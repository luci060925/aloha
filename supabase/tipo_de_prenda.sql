-- ==============================================================================
-- ALOHA INDUMENTARIA - Tipo de prenda (Mom, Oxford, Wide Leg...)
-- Pegar completo en Supabase > SQL Editor y ejecutar (Run). Re-ejecutable; solo agrega una columna.
--
-- Cada prenda puede tener UN tipo, además de su categoría y subcategoría
-- (ej.: Pantalones > Jeans > Wide Leg). Se carga en el formulario de la prenda, pestaña
-- "Talle, color y tipo", y la tienda lo encuentra al buscar.
-- ==============================================================================

alter table public.products
  add column if not exists product_type text default '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_type_len_chk') then
    alter table public.products add constraint products_type_len_chk
      check (char_length(coalesce(product_type, '')) <= 60) not valid;
  end if;
end $$;

-- Verificación: debe devolver una fila
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'products' and column_name = 'product_type';
