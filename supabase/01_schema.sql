create extension if not exists pgcrypto;
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text default '',
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text default '',
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) check (compare_at_price is null or compare_at_price >= 0),
  image_url text,
  extra_images text[] not null default '{}',
  stock integer not null default 0 check (stock >= 0),
  low_stock_alert integer not null default 5,
  sku text,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text default '',
  subtitle text default '',
  image_url text not null,
  link_url text default '',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'Ribaat Shop',
  tagline text default 'Quality products, delivered fast',
  currency_symbol text not null default '৳',
  contact_phone text default '',
  contact_email text default '',
  whatsapp text default '',
  facebook_url text default '',
  address text default '',
  announcement text default '',
  delivery_fee_inside numeric(12,2) not null default 60,
  delivery_fee_outside numeric(12,2) not null default 120,
  free_delivery_over numeric(12,2) not null default 0,
  cod_enabled boolean not null default true,
  manual_pay_enabled boolean not null default true,
  bkash_number text default '',
  nagad_number text default '',
  payment_instructions text default 'Send money to the number above, then enter the transaction ID at checkout.',
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('RB-' || nextval('public.order_number_seq')),
  customer_name text not null,
  phone text not null,
  email text,
  address text not null,
  delivery_zone text not null default 'inside' check (delivery_zone in ('inside','outside')),
  notes text,
  payment_method text not null check (payment_method in ('cod','bkash','nagad')),
  payment_trx_id text,
  subtotal numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'pending'
    check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12,2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(12,2) not null
);

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_active on public.products(is_active, is_featured);
create index if not exists idx_orders_status on public.orders(status, created_at desc);
create index if not exists idx_orders_phone on public.orders(phone);
create index if not exists idx_items_order on public.order_items(order_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();
drop trigger if exists trg_settings_updated on public.settings;
create trigger trg_settings_updated before update on public.settings
  for each row execute function public.set_updated_at();
drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

insert into public.settings (id) values (1) on conflict (id) do nothing;
