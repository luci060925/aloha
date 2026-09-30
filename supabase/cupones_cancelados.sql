-- ==============================================================================
-- ALOHA INDUMENTARIA - Cancelar un pedido devuelve el uso del cupón
-- Pegar completo en Supabase > SQL Editor y ejecutar (Run). Re-ejecutable; no borra pedidos ni cupones.
--
-- Hasta ahora el contador de usos de un cupón ("X de N personas") subía al registrarse el pedido y no
-- bajaba al cancelarlo. Desde ahora, al pasar un pedido a "Cancelado" el uso se devuelve, y si se
-- reactiva se vuelve a contar. Además se recalculan los contadores de todos los cupones a partir de
-- los pedidos que siguen en pie (con descuento y no cancelados).
-- ==============================================================================

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

-- Recuento de todos los cupones (corrige los pedidos que ya estaban cancelados)
update public.coupons c
set used_count = (
  select count(*) from public.orders o
  where upper(o.coupon_code) = upper(c.code)
    and coalesce(o.discount_amount, 0) > 0
    and coalesce(o.status, '') <> 'cancelled'
);

-- Verificación: cada cupón con su recuento de usos
select code, used_count, max_uses from public.coupons order by code;
