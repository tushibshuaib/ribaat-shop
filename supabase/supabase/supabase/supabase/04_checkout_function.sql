create or replace function public.create_order(
  p_name text, p_phone text, p_email text, p_address text,
  p_zone text, p_notes text, p_payment_method text, p_trx_id text,
  p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  s public.settings%rowtype;
  v_order public.orders%rowtype;
  r record;
  prod public.products%rowtype;
  v_subtotal numeric(12,2) := 0;
  v_fee numeric(12,2) := 0;
begin
  if p_name is null or length(trim(p_name)) < 2 or length(p_name) > 100 then
    raise exception 'Invalid name'; end if;
  if p_phone is null or p_phone !~ '^[0-9+ -]{6,20}$' then
    raise exception 'Invalid phone number'; end if;
  if p_address is null or length(trim(p_address)) < 5 or length(p_address) > 300 then
    raise exception 'Invalid address'; end if;
  if p_zone is null or p_zone not in ('inside','outside') then
    raise exception 'Invalid delivery area'; end if;
  if p_payment_method is null or p_payment_method not in ('cod','bkash','nagad') then
    raise exception 'Invalid payment method'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'Your cart is empty'; end if;

  select * into s from public.settings where id = 1;
  if p_payment_method = 'cod' and not s.cod_enabled then
    raise exception 'Cash on delivery is unavailable'; end if;
  if p_payment_method <> 'cod' then
    if not s.manual_pay_enabled then raise exception 'This payment method is unavailable'; end if;
    if p_trx_id is null or length(trim(p_trx_id)) < 4 or length(p_trx_id) > 40 then
      raise exception 'Transaction ID is required'; end if;
  end if;

  insert into public.orders (customer_name, phone, email, address, delivery_zone,
                             notes, payment_method, payment_trx_id)
  values (trim(p_name), trim(p_phone), nullif(left(trim(coalesce(p_email,'')),120),''),
          trim(p_address), p_zone, nullif(left(trim(coalesce(p_notes,'')),500),''),
          p_payment_method,
          case when p_payment_method = 'cod' then null else trim(p_trx_id) end)
  returning * into v_order;

  for r in
    select (e->>'product_id')::uuid as pid, sum((e->>'quantity')::int) as qty
    from jsonb_array_elements(p_items) e
    group by 1 order by 1
  loop
    if r.qty is null or r.qty < 1 or r.qty > 100 then
      raise exception 'Invalid quantity'; end if;
    select * into prod from public.products where id = r.pid and is_active for update;
    if not found then raise exception 'A product in your cart is unavailable'; end if;
    if prod.stock < r.qty then
      raise exception 'Not enough stock for %', prod.name; end if;
    update public.products set stock = stock - r.qty where id = prod.id;
    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
    values (v_order.id, prod.id, prod.name, prod.price, r.qty, prod.price * r.qty);
    v_subtotal := v_subtotal + prod.price * r.qty;
  end loop;

  v_fee := case when p_zone = 'inside' then s.delivery_fee_inside else s.delivery_fee_outside end;
  if s.free_delivery_over > 0 and v_subtotal >= s.free_delivery_over then v_fee := 0; end if;

  update public.orders
     set subtotal = v_subtotal, delivery_fee = v_fee, total = v_subtotal + v_fee
   where id = v_order.id returning * into v_order;

  return jsonb_build_object('order_id', v_order.id,
                            'order_number', v_order.order_number,
                            'total', v_order.total);
end; $$;

revoke all on function public.create_order(text,text,text,text,text,text,text,text,jsonb)
  from public, anon, authenticated;
grant execute on function public.create_order(text,text,text,text,text,text,text,text,jsonb)
  to service_role;

-- Cancelling an order returns stock; un-cancelling takes it out again.
create or replace function public.handle_order_status_stock()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status <> 'cancelled' and new.status = 'cancelled' then
    update public.products p set stock = p.stock + i.quantity
      from public.order_items i where i.order_id = new.id and i.product_id = p.id;
  elsif old.status = 'cancelled' and new.status <> 'cancelled' then
    update public.products p set stock = p.stock - i.quantity
      from public.order_items i where i.order_id = new.id and i.product_id = p.id;
  end if;
  return new;
end; $$;

drop trigger if exists trg_order_status_stock on public.orders;
create trigger trg_order_status_stock after update of status on public.orders
  for each row when (old.status is distinct from new.status)
  execute function public.handle_order_status_stock();
