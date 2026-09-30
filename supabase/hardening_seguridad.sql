-- ==============================================================================
-- ALOHA INDUMENTARIA - ENDURECIMIENTO DE SEGURIDAD DE LA BASE (informe.md)
-- Pegar completo en Supabase > SQL Editor y ejecutar (Run). Re-ejecutable.
-- Ejecutar DESPUÉS de rls_policies.sql y cupones.sql (ver docs/base-de-datos.md).
--
-- Corrige:
--   SEC-001  Pedidos con precios, cantidades, totales o descuentos falsos
--   SEC-002  Cupones que se agotaban o usaban sin validar
--   SEC-003  Perfiles: la clienta controlaba su email / is_admin
--   SEC-004  Sin límites de frecuencia ni de tamaño
--   SEC-006  get_coupon abierta a visitantes sin sesión
--   SEC-009  avatar_url apuntando a sitios de terceros
--
-- Las reglas de descuento son las mismas de src/lib/pricing.ts: si se cambian allá, cambiarlas acá.
-- Las validaciones solo se aplican a las cuentas de usuarias (API con sesión); el panel de Supabase
-- y service_role (sin auth.uid()) quedan fuera para poder administrar los datos a mano.
-- ==============================================================================

-- 1. SEC-006 · get_coupon solo con sesión iniciada ---------------------------------------------

revoke execute on function public.get_coupon(text) from anon;
grant execute on function public.get_coupon(text) to authenticated;

-- 2. SEC-003 · Perfiles: columnas protegidas ----------------------------------------------------
-- El email sale SIEMPRE de la cuenta de acceso (auth.users), nunca de lo que escriba la clienta;
-- id y created_at no cambian; is_admin solo lo cambia una administradora (o el panel de Supabase).

create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  if auth.uid() is null then
    return new;   -- panel de Supabase / service_role
  end if;

  select lower(u.email) into v_email from auth.users u where u.id = new.id;

  if tg_op = 'INSERT' then
    if v_email is not null then new.email := v_email; end if;
    if not public.is_admin() then new.is_admin := false; end if;
    new.created_at := now();
  else
    new.id := old.id;
    new.created_at := old.created_at;
    new.email := coalesce(v_email, old.email);
    if not public.is_admin() then new.is_admin := old.is_admin; end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.protect_profile_columns() from public, anon, authenticated;

drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect
  before insert or update on public.profiles
  for each row execute function public.protect_profile_columns();

-- 3. SEC-004 / SEC-009 · Límites de tamaño y formato ------------------------------------------
-- NOT VALID: se exigen en los datos nuevos sin frenar la instalación por datos viejos.

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_limits_chk') then
    alter table public.profiles add constraint profiles_limits_chk check (
      char_length(full_name) <= 120
      and char_length(coalesce(phone, '')) <= 60
      and char_length(coalesce(avatar_url, '')) <= 500
      and (coalesce(avatar_url, '') = '' or avatar_url ~* '^https://([a-z0-9-]+\.)*googleusercontent\.com/')
      and coalesce(pg_column_size(address), 0) <= 2000
    ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_limits_chk') then
    alter table public.orders add constraint orders_limits_chk check (
      id ~ '^ORD-[A-Z0-9]{4,24}$'
      and char_length(customer_name) <= 120
      and char_length(coalesce(customer_phone, '')) <= 60
      and char_length(coalesce(customer_location, '')) <= 300
      and char_length(coalesce(whatsapp_message, '')) <= 4000
      and char_length(coalesce(coupon_code, '')) <= 60
      and jsonb_typeof(items) = 'array'
      and jsonb_array_length(items) between 1 and 30
      and pg_column_size(items) <= 20000
      and subtotal >= 0
      and total >= 0
      and coalesce(discount_amount, 0) >= 0
    ) not valid;
  end if;
end $$;

-- 4. SEC-001 / SEC-002 / SEC-004 · Validación de pedidos en el servidor -----------------------

create or replace function public.validate_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  it jsonb;
  v_product record;
  v_coupon record;
  v_has_coupon boolean := false;
  v_c_target text;
  v_c_percent numeric;
  v_c_fixed numeric;
  v_c_min_amount numeric;
  v_c_min_items integer;
  v_units integer := 0;
  v_qty numeric;
  v_price numeric;
  v_subtotal numeric := 0;
  v_eligible numeric := 0;
  v_discount numeric;
  v_max numeric := 0;
  v_recent integer;
  v_code text := nullif(btrim(coalesce(new.coupon_code, '')), '');
begin
  if auth.uid() is null then
    return new;   -- panel de Supabase / service_role
  end if;

  -- SEC-004: tope de pedidos por usuaria y hora
  select count(*) into v_recent
  from public.orders o
  where o.user_id = new.user_id and o.created_at > now() - interval '1 hour';
  if v_recent >= 10 then
    raise exception 'Enviaste demasiados pedidos en poco tiempo. Esperá un rato antes de enviar otro.';
  end if;

  if new.items is null or jsonb_typeof(new.items) <> 'array'
     or jsonb_array_length(new.items) < 1 or jsonb_array_length(new.items) > 30 then
    raise exception 'El pedido no tiene prendas válidas.';
  end if;

  -- SEC-002: cupón real, activo, vigente y con cupo; la fila queda bloqueada hasta el final de la transacción
  -- para que dos pedidos simultáneos no gasten el último cupo a la vez ni una clienta use el mismo cupón dos veces.
  -- Los cupones son el único descuento posible (no hay descuentos automáticos).
  if v_code is not null then
    -- Serializa los pedidos con cupón de una misma clienta (que no gaste dos cupones a la vez)
    perform pg_advisory_xact_lock(hashtext(new.user_id::text));
    select * into v_coupon from public.coupons c where upper(c.code) = upper(v_code) for update;
    if not found
       or not coalesce(v_coupon.is_active, false)
       or (v_coupon.expires_at is not null and v_coupon.expires_at <= now())
       or (v_coupon.max_uses is not null and coalesce(v_coupon.used_count, 0) >= v_coupon.max_uses) then
      raise exception 'El cupón no es válido, venció o se agotó.';
    end if;
    -- Reglas de uso (solo cuando el pedido realmente aprovecha el cupón). Los pedidos cancelados no cuentan.
    if coalesce(new.discount_amount, 0) > 0 then
      -- Cada cupón, una sola vez por clienta
      if exists (
        select 1 from public.orders o
        where o.user_id = new.user_id
          and upper(o.coupon_code) = upper(v_code)
          and coalesce(o.discount_amount, 0) > 0
          and coalesce(o.status, '') <> 'cancelled'
      ) then
        raise exception 'Ya usaste este cupón: es de un solo uso por clienta.';
      end if;
      -- Y ningún otro cupón durante las 24 horas siguientes a usar uno
      if exists (
        select 1 from public.orders o
        where o.user_id = new.user_id
          and coalesce(o.coupon_code, '') <> ''
          and coalesce(o.discount_amount, 0) > 0
          and coalesce(o.status, '') <> 'cancelled'
          and o.created_at > now() - interval '24 hours'
      ) then
        raise exception 'Ya usaste un cupón en las últimas 24 horas. Podés usar otro más tarde.';
      end if;
    end if;
    v_has_coupon := true;
    v_c_min_amount := coalesce(v_coupon.min_amount, 0);
    v_c_min_items := coalesce(v_coupon.min_items, 0);
    v_c_target := coalesce(v_coupon.target_category, 'all');
    v_c_percent := coalesce(v_coupon.discount_percentage, 0);
    v_c_fixed := coalesce(v_coupon.fixed_discount, 0);
  end if;

  -- SEC-001: cada prenda, con el precio y el stock reales de la base
  for it in select * from jsonb_array_elements(new.items) loop
    begin
      v_qty := (it ->> 'quantity')::numeric;
      v_price := (it ->> 'price')::numeric;
      select p.id, p.price, p.category, p.in_stock into v_product
      from public.products p where p.id = (it ->> 'productId')::uuid;
    exception when others then
      raise exception 'El pedido tiene datos de prendas inválidos.';
    end;

    if v_qty is null or v_qty <> trunc(v_qty) or v_qty < 1 or v_qty > 50 then
      raise exception 'Cantidad inválida en el pedido (entre 1 y 50 unidades por prenda).';
    end if;
    if v_product.id is null then
      raise exception 'Una de las prendas del pedido ya no existe.';
    end if;
    if not coalesce(v_product.in_stock, false) then
      raise exception 'Una de las prendas del pedido está agotada.';
    end if;
    if v_price is distinct from v_product.price then
      raise exception 'El precio de una prenda cambió. Actualizá tu bolsa e intentá de nuevo.';
    end if;

    v_subtotal := v_subtotal + v_product.price * v_qty;
    v_units := v_units + v_qty::integer;
    if v_has_coupon and (v_c_target = 'all' or v_product.category = v_c_target) then
      v_eligible := v_eligible + v_product.price * v_qty;
    end if;
  end loop;

  if new.subtotal is distinct from v_subtotal then
    raise exception 'El subtotal del pedido no coincide con los precios.';
  end if;

  v_discount := coalesce(new.discount_amount, 0);
  if v_discount < 0 or v_discount > v_subtotal then
    raise exception 'El descuento del pedido es inválido.';
  end if;
  if new.total is distinct from (v_subtotal - v_discount) then
    raise exception 'El total del pedido no coincide.';
  end if;

  -- Descuento máximo legítimo (mismas reglas que src/lib/pricing.ts). Se tolera 1 peso por redondeo.
  if v_has_coupon then
    -- Condición del cupón: compra mínima (por monto) o cantidad mínima de prendas (por cantidad)
    if v_discount > 0 and v_subtotal < v_c_min_amount then
      raise exception 'Tu compra no llega al monto mínimo del cupón.';
    end if;
    if v_discount > 0 and v_units < v_c_min_items then
      raise exception 'Tu bolsa no tiene las prendas mínimas que pide el cupón.';
    end if;
    if v_c_percent > 0 then
      v_max := round(v_eligible * v_c_percent / 100);
    else
      v_max := least(v_c_fixed, v_eligible);
    end if;
  end if;

  if v_discount > v_max + 1 then
    raise exception 'El descuento del pedido no corresponde a ningún cupón vigente.';
  end if;

  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.validate_order() from public, anon, authenticated;

drop trigger if exists orders_validate on public.orders;
create trigger orders_validate
  before insert on public.orders
  for each row execute function public.validate_order();

-- El uso de un cupón solo cuenta cuando el pedido realmente lo aprovecha (descuento mayor a cero).
create or replace function public.count_coupon_use()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.coupon_code is not null and new.coupon_code <> '' and coalesce(new.discount_amount, 0) > 0 then
    update public.coupons
    set used_count = coalesce(used_count, 0) + 1
    where upper(code) = upper(new.coupon_code);
  end if;
  return new;
end;
$$;

revoke all on function public.count_coupon_use() from public, anon, authenticated;

-- Si un pedido con cupón se cancela, el uso del cupón se devuelve (y si se reactiva, se vuelve a contar).
-- Así el cupo de "límite de personas" y el recuento reflejan solo las compras que siguen en pie.
create or replace function public.sync_coupon_use_on_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_was_active boolean;
  v_is_active boolean;
begin
  if coalesce(new.coupon_code, '') = '' or coalesce(new.discount_amount, 0) <= 0 then
    return new;
  end if;
  v_was_active := coalesce(old.status, '') <> 'cancelled';
  v_is_active := coalesce(new.status, '') <> 'cancelled';
  if v_was_active and not v_is_active then
    update public.coupons set used_count = greatest(coalesce(used_count, 0) - 1, 0)
    where upper(code) = upper(new.coupon_code);
  elsif not v_was_active and v_is_active then
    update public.coupons set used_count = coalesce(used_count, 0) + 1
    where upper(code) = upper(new.coupon_code);
  end if;
  return new;
end;
$$;

revoke all on function public.sync_coupon_use_on_status() from public, anon, authenticated;

drop trigger if exists orders_sync_coupon on public.orders;
create trigger orders_sync_coupon
  after update of status on public.orders
  for each row
  when (old.status is distinct from new.status)
  execute function public.sync_coupon_use_on_status();

-- 5. Verificación --------------------------------------------------------------------------------

select event_object_table as tabla, trigger_name as disparador, event_manipulation as evento
from information_schema.triggers
where trigger_name in ('profiles_protect', 'orders_validate', 'orders_count_coupon')
order by 1, 2;
