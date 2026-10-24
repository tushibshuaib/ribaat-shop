create or replace function public.admin_adjust_stock(p_product uuid, p_delta int)
returns int
language plpgsql security definer set search_path = public as $$
declare v_stock int;
begin
  if not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  update public.products
     set stock = stock + p_delta
   where id = p_product and stock + p_delta >= 0
   returning stock into v_stock;
  if v_stock is null then
    raise exception 'Stock cannot go below zero';
  end if;
  return v_stock;
end; $$;

revoke all on function public.admin_adjust_stock(uuid, int) from public, anon;
grant execute on function public.admin_adjust_stock(uuid, int) to authenticated;
