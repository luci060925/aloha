-- ==============================================================================
-- ALOHA INDUMENTARIA - Etiqueta "Último en stock"
-- Pegar completo en Supabase > SQL Editor y ejecutar (Run). Re-ejecutable; solo agrega una columna.
--
-- La administradora puede marcar una prenda como "Último en stock" (casilla en el formulario de la prenda)
-- y la tienda muestra esa etiqueta en la tarjeta, en el carrusel y en el detalle.
-- ==============================================================================

alter table public.products
  add column if not exists last_in_stock boolean default false;

-- Verificación: debe devolver una fila
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'products' and column_name = 'last_in_stock';
