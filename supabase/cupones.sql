-- ==============================================================================
-- ALOHA INDUMENTARIA - Conteo automático de usos de cupones
-- Pegar completo en Supabase > SQL Editor y ejecutar (Run). Solo agrega un disparador; no borra datos.
--
-- Cada vez que se registra un pedido con un cupón, suma 1 a su contador (used_count).
-- Cuando el contador llega a max_uses, get_coupon() deja de aceptarlo ("agotado").
-- ==============================================================================

create or replace function public.count_coupon_use()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.coupon_code is not null and new.coupon_code <> '' then
    update public.coupons
    set used_count = coalesce(used_count, 0) + 1
    where upper(code) = upper(new.coupon_code);
  end if;
  return new;
end;
$$;

revoke all on function public.count_coupon_use() from public, anon, authenticated;

drop trigger if exists orders_count_coupon on public.orders;
create trigger orders_count_coupon
  after insert on public.orders
  for each row execute function public.count_coupon_use();

-- Verificación: debería devolver una fila con el disparador
select trigger_name, event_manipulation, event_object_table
from information_schema.triggers
where trigger_name = 'orders_count_coupon';
