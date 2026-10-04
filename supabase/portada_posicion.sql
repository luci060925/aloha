-- ==============================================================================
-- ALOHA INDUMENTARIA - Posición de las fotos de portada
-- Pegar completo en Supabase > SQL Editor y ejecutar (Run). Re-ejecutable; solo agrega dos columnas.
--
-- Guarda qué parte de la foto de la portada y de la foto del local queda a la vista cuando la
-- administradora las acomoda arrastrándolas (Ajustes de Tienda & Portada). "50% 50%" = centrada.
-- ==============================================================================

alter table public.store_settings
  add column if not exists hero_image_position text default '50% 50%',
  add column if not exists showroom_image_position text default '50% 50%';

update public.store_settings
set hero_image_position = coalesce(hero_image_position, '50% 50%'),
    showroom_image_position = coalesce(showroom_image_position, '50% 50%')
where id = 1;

-- Verificación: debe devolver dos filas
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'store_settings'
  and column_name in ('hero_image_position', 'showroom_image_position')
order by column_name;
