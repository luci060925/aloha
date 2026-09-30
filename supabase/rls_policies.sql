-- ==============================================================================
-- ALOHA INDUMENTARIA - POLÍTICAS DE SEGURIDAD (RLS) CORREGIDAS
-- Se ejecuta UNA vez en Supabase > SQL Editor, sobre el esquema de database_schema.sql.
-- Es re-ejecutable: borra las políticas anteriores de estas tablas y las vuelve a crear.
--
-- Qué corrige:
--   1. Ninguna usuaria puede convertirse en admin (is_admin solo se cambia desde el panel de Supabase).
--   2. Se elimina la recursión infinita de las políticas de "profiles" (función is_admin()).
--   3. Los cupones dejan de ser legibles por todo el mundo (se consultan de a uno con get_coupon()).
--   4. Un pedido solo puede crearlo una usuaria con sesión, y a su nombre.
-- ==============================================================================

-- 1. FUNCIONES AUXILIARES ------------------------------------------------------

-- ¿La usuaria actual es admin? SECURITY DEFINER evita la recursión al leer "profiles".
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Valida UN cupón por código sin exponer la lista completa.
drop function if exists public.get_coupon(text);
create function public.get_coupon(p_code text)
returns table (
  id uuid,
  code text,
  discount_percentage numeric,
  fixed_discount numeric,
  target_category text,
  max_uses integer,
  used_count integer,
  min_amount numeric,
  min_items integer
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.code, c.discount_percentage::numeric, c.fixed_discount::numeric,
         c.target_category, c.max_uses, c.used_count,
         coalesce(c.min_amount, 0)::numeric, coalesce(c.min_items, 0)
  from public.coupons c
  where upper(c.code) = upper(trim(p_code))
    and c.is_active
    and (c.expires_at is null or c.expires_at > now())
    and (c.max_uses is null or c.used_count < c.max_uses)
  limit 1;
$$;

revoke all on function public.get_coupon(text) from public;
grant execute on function public.get_coupon(text) to anon, authenticated;

-- 2. LIMPIEZA DE POLÍTICAS ANTERIORES ---------------------------------------------

do $$
declare r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('categories', 'subcategories', 'products', 'profiles',
                        'orders', 'coupons', 'store_settings')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

alter table public.categories     enable row level security;
alter table public.subcategories  enable row level security;
alter table public.products       enable row level security;
alter table public.profiles       enable row level security;
alter table public.orders         enable row level security;
alter table public.coupons        enable row level security;
alter table public.store_settings enable row level security;

-- 3. CATÁLOGO Y AJUSTES: lectura pública, escritura solo admin -----------------------

create policy "categories_read"   on public.categories     for select using (true);
create policy "subcategories_read" on public.subcategories for select using (true);
create policy "products_read"     on public.products       for select using (true);
create policy "settings_read"     on public.store_settings for select using (true);

create policy "categories_admin"   on public.categories     for all using (public.is_admin()) with check (public.is_admin());
create policy "subcategories_admin" on public.subcategories for all using (public.is_admin()) with check (public.is_admin());
create policy "products_admin"     on public.products       for all using (public.is_admin()) with check (public.is_admin());
create policy "settings_admin"     on public.store_settings for all using (public.is_admin()) with check (public.is_admin());

-- 4. CUPONES: sin lectura pública (se usa get_coupon), gestión solo admin ----------------

create policy "coupons_admin" on public.coupons for all using (public.is_admin()) with check (public.is_admin());

-- 5. PERFILES: cada usuaria ve y edita el suyo, sin poder darse rol de admin ---------------

create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id and is_admin = false);

create policy "profiles_update" on public.profiles
  for update
  using (auth.uid() = id or public.is_admin())
  with check (public.is_admin() or (auth.uid() = id and is_admin = false));

create policy "profiles_delete" on public.profiles
  for delete using (public.is_admin());

-- 6. PEDIDOS: crea quien tiene sesión y a su nombre; ve los suyos (o todos si es admin) -----

create policy "orders_insert" on public.orders
  for insert with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and status = 'whatsapp_sent'
  );

create policy "orders_select" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());

create policy "orders_update_admin" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

create policy "orders_delete_admin" on public.orders
  for delete using (public.is_admin());

-- 7. VERIFICACIÓN: debería listar las políticas nuevas de las 7 tablas ---------------------

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
