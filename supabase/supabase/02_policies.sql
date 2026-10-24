alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.banners enable row level security;
alter table public.settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Defense in depth: strip table privileges that must never be used from the browser
revoke all on public.profiles, public.orders, public.order_items from anon, authenticated;
grant select on public.profiles to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
revoke insert, update, delete on public.categories, public.products,
  public.banners, public.settings from anon;

-- profiles: read own row (or all if admin). No client writes at all.
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select
  using (id = auth.uid() or public.is_admin());

-- categories
drop policy if exists "categories read" on public.categories;
create policy "categories read" on public.categories for select
  using (is_active or public.is_admin());
drop policy if exists "categories admin" on public.categories;
create policy "categories admin" on public.categories for all
  using (public.is_admin()) with check (public.is_admin());

-- products
drop policy if exists "products read" on public.products;
create policy "products read" on public.products for select
  using (is_active or public.is_admin());
drop policy if exists "products admin" on public.products;
create policy "products admin" on public.products for all
  using (public.is_admin()) with check (public.is_admin());

-- banners
drop policy if exists "banners read" on public.banners;
create policy "banners read" on public.banners for select
  using (is_active or public.is_admin());
drop policy if exists "banners admin" on public.banners;
create policy "banners admin" on public.banners for all
  using (public.is_admin()) with check (public.is_admin());

-- settings
drop policy if exists "settings read" on public.settings;
create policy "settings read" on public.settings for select using (true);
drop policy if exists "settings admin" on public.settings;
create policy "settings admin" on public.settings for all
  using (public.is_admin()) with check (public.is_admin());

-- orders and items: admin only. Customers never touch these tables directly.
drop policy if exists "orders admin read" on public.orders;
create policy "orders admin read" on public.orders for select using (public.is_admin());
drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders for update
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "items admin read" on public.order_items;
create policy "items admin read" on public.order_items for select using (public.is_admin());
