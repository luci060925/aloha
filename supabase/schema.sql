-- ==============================================================================
-- !!! OBSOLETO E INSEGURO: NO EJECUTAR ESTE ARCHIVO !!!
-- Sus políticas ("using (true)") dejan que cualquiera lea y modifique todo.
-- Usar database_schema.sql y supabase/rls_policies.sql (ver README.md).
-- ==============================================================================
-- ALOHA INDUMENTARIA - SUPABASE DATABASE SCHEMA (VERSIÓN ANTERIOR)
-- E-commerce Catalog & Backoffice
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES / USERS TABLE
create table if not exists public.profiles (
  id text primary key,
  email text unique not null,
  full_name text not null,
  avatar_url text,
  phone text,
  address jsonb default '{}'::jsonb,
  provider text default 'email',
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. CATEGORIES TABLE
create table if not exists public.categories (
  id text primary key,
  name text not null,
  slug text unique not null,
  description text,
  image text,
  "order" integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PRODUCTS TABLE
create table if not exists public.products (
  id text primary key,
  name text not null,
  slug text unique not null,
  description text not null,
  price numeric(12, 2) not null,
  original_price numeric(12, 2),
  category text not null,
  images jsonb not null default '[]'::jsonb,
  sizes jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  in_stock boolean default true,
  featured boolean default false,
  is_new_arrival boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ORDERS & WHATSAPP CART TRANSACTIONS TABLE
create table if not exists public.orders (
  id text primary key,
  user_id text references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  customer_location text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12, 2) not null,
  discount_amount numeric(12, 2) default 0,
  coupon_code text,
  total numeric(12, 2) not null,
  status text default 'whatsapp_sent' check (status in ('whatsapp_sent', 'contacted', 'confirmed', 'delivered', 'cancelled')),
  whatsapp_message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. COUPONS TABLE
create table if not exists public.coupons (
  id text primary key,
  code text unique not null,
  discount_percentage numeric(5, 2) not null default 10,
  fixed_discount numeric(12, 2),
  min_purchase_amount numeric(12, 2) default 0,
  is_active boolean default true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. STORE SETTINGS TABLE
create table if not exists public.settings (
  id text primary key default 'store_config',
  whatsapp_number text not null default '5492974201122',
  store_name text not null default 'Aloha Indumentaria',
  address text not null default '25 de Mayo 903',
  city text not null default 'Comodoro Rivadavia',
  province text not null default 'Chubut, Argentina',
  opening_hours text not null default 'Lunes a Sábados de 15:00 a 20:00 hs',
  global_discount_percentage numeric(5, 2) default 0,
  global_discount_active boolean default false,
  announcement_text text not null default '✨ NUEVA COLECCIÓN MONOCHROME 2026 • 25 DE MAYO 903, COMODORO RIVADAVIA (15 A 20 HS) • ENVÍOS A TODO EL PAÍS',
  instagram_url text default 'https://instagram.com/aloha.indumentaria_cr',
  instagram_handle text default 'aloha.indumentaria_cr',
  facebook_url text default 'https://facebook.com/alohaindumentariacr',
  tiktok_url text default 'https://tiktok.com/@aloha.indumentaria_cr',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.coupons enable row level security;
alter table public.settings enable row level security;

-- Public Read Access for catalog
create policy "Allow public read categories" on public.categories for select using (true);
create policy "Allow public read products" on public.products for select using (true);
create policy "Allow public read coupons" on public.coupons for select using (is_active = true);
create policy "Allow public read settings" on public.settings for select using (true);

-- Allow public insert orders (for WhatsApp checkouts)
create policy "Allow insert orders" on public.orders for insert with check (true);
create policy "Allow select own orders" on public.orders for select using (true);

-- Allow profile insert & update
create policy "Allow profile operations" on public.profiles for all using (true);

-- Allow full management for admin
create policy "Allow full category admin" on public.categories for all using (true);
create policy "Allow full product admin" on public.products for all using (true);
create policy "Allow full coupon admin" on public.coupons for all using (true);
create policy "Allow full settings admin" on public.settings for all using (true);

-- SEED DATA INITIALIZATION
insert into public.settings (id, whatsapp_number, store_name, address, city, province, opening_hours, announcement_text)
values (
  'store_config',
  '5492974201122',
  'Aloha Indumentaria',
  '25 de Mayo 903',
  'Comodoro Rivadavia',
  'Chubut, Argentina',
  'Lunes a Sábados de 15:00 a 20:00 hs',
  '✨ NUEVA COLECCIÓN MONOCHROME 2026 • 25 DE MAYO 903, COMODORO RIVADAVIA (15 A 20 HS) • ENVÍOS A TODO EL PAÍS'
) on conflict (id) do nothing;