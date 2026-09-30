-- ==============================================================================
-- ALOHA INDUMENTARIA - Foto editable del showroom
-- Pegar completo en Supabase > SQL Editor y ejecutar (Run). Re-ejecutable; solo agrega una columna.
--
-- Guarda la dirección de la foto de la sección "Vení a conocer nuestro local".
-- La foto se sube desde el panel (Ajustes de Tienda → Foto del Showroom) al bucket catalog-images.
-- ==============================================================================

alter table public.store_settings
  add column if not exists showroom_image_url text default '';

update public.store_settings set showroom_image_url = coalesce(showroom_image_url, '') where id = 1;

-- Verificación: debe devolver una fila
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'store_settings' and column_name = 'showroom_image_url';
