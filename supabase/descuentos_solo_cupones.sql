-- ==============================================================================
-- ALOHA INDUMENTARIA - Descuentos solo por cupón (un cupón por compra, un uso por clienta)
-- Pegar completo en Supabase > SQL Editor y ejecutar (Run). Re-ejecutable; no borra datos ni cupones.
--
-- Reglas nuevas:
--   1. El único descuento posible es un cupón que la clienta escribe. Se eliminan los descuentos
--      automáticos (por cantidad de prendas, por monto y global): quedan desactivados en la base.
--   2. Un cupón solo se puede usar UNA vez por clienta (los pedidos cancelados liberan el cupón).
--      Por eso "Límite de personas" cuenta personas de verdad.
--   3. Los pedidos con la etiqueta "VOLUMEN-x%" ya no se aceptan (era el descuento automático).
--
-- Va de la mano con el cambio en la tienda (src/lib/pricing.ts): las reglas tienen que coincidir.
-- ==============================================================================

-- 1. Desactivar los descuentos automáticos (las columnas quedan sin uso)
update public.store_settings
set volume_discount_active = false,
    price_discount_active = false,
    global_discount_active = false
where id = 1;

-- 2. Validación de pedidos: solo cupones, un uso por clienta
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
    select * into v_coupon from public.coupons c where upper(c.code) = upper(v_code) for update;
    if not found
       or not coalesce(v_coupon.is_active, false)
       or (v_coupon.expires_at is not null and v_coupon.expires_at <= now())
       or (v_coupon.max_uses is not null and coalesce(v_coupon.used_count, 0) >= v_coupon.max_uses) then
      raise exception 'El cupón no es válido, venció o se agotó.';
    end if;
    -- Una sola vez por clienta: los pedidos cancelados liberan el cupón
    if exists (
      select 1 from public.orders o
      where o.user_id = new.user_id
        and upper(o.coupon_code) = upper(v_code)
        and coalesce(o.discount_amount, 0) > 0
        and coalesce(o.status, '') <> 'cancelled'
    ) then
      raise exception 'Ya usaste este cupón: es de un solo uso por clienta.';
    end if;
    v_has_coupon := true;
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

-- 3. Verificación: los tres deben estar en false
select volume_discount_active, price_discount_active, global_discount_active
from public.store_settings where id = 1;
