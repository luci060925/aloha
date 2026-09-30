-- ==============================================================================
-- ALOHA INDUMENTARIA - Ajustes de tienda (redes y portada) + bucket de imágenes
-- Pegar completo en Supabase > SQL Editor y ejecutar (Run). Solo agrega cosas; no borra datos.
-- ==============================================================================

-- 1. COLUMNAS QUE FALTAN EN store_settings ---------------------------------------------

alter table public.store_settings
  add column if not exists instagram_url text default 'https://instagram.com/aloha.indumentaria_cr',
  add column if not exists instagram_handle text default 'aloha.indumentaria_cr',
  add column if not exists facebook_url text default 'https://www.facebook.com/share/1DkPR93ziX/',
  add column if not exists tiktok_url text default 'https://www.tiktok.com/@aloha.indumentaria_',
  add column if not exists hero_badge_text text default 'Nueva Colección 2026',
  add column if not exists hero_title text default 'Elegancia & Estilo',
  add column if not exists hero_subtitle text default 'Prendas esenciales y diseño contemporáneo pensados para acompañar tu día a día con distinción.',
  add column if not exists hero_image_url text default 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2000',
  add column if not exists hero_primary_btn_text text default 'Ver Catálogo',
  add column if not exists hero_secondary_btn_text text default 'Ver Showroom';

update public.store_settings set
  instagram_url = coalesce(instagram_url, 'https://instagram.com/aloha.indumentaria_cr'),
  instagram_handle = coalesce(instagram_handle, 'aloha.indumentaria_cr'),
  facebook_url = coalesce(facebook_url, 'https://www.facebook.com/share/1DkPR93ziX/'),
  tiktok_url = coalesce(tiktok_url, 'https://www.tiktok.com/@aloha.indumentaria_'),
  hero_badge_text = coalesce(hero_badge_text, 'Nueva Colección 2026'),
  hero_title = coalesce(hero_title, 'Elegancia & Estilo'),
  hero_subtitle = coalesce(hero_subtitle, 'Prendas esenciales y diseño contemporáneo pensados para acompañar tu día a día con distinción.'),
  hero_image_url = coalesce(hero_image_url, 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2000'),
  hero_primary_btn_text = coalesce(hero_primary_btn_text, 'Ver Catálogo'),
  hero_secondary_btn_text = coalesce(hero_secondary_btn_text, 'Ver Showroom')
where id = 1;

-- 2. BUCKET PÚBLICO PARA FOTOS DE PRODUCTOS Y PORTADA ---------------------------------------
-- Lectura pública (las fotos se ven en el sitio); solo la administradora sube, cambia o borra.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog-images', 'catalog-images', true, 1048576, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "catalog_images_admin_select" on storage.objects;
drop policy if exists "catalog_images_admin_insert" on storage.objects;
drop policy if exists "catalog_images_admin_update" on storage.objects;
drop policy if exists "catalog_images_admin_delete" on storage.objects;

create policy "catalog_images_admin_select" on storage.objects
  for select using (bucket_id = 'catalog-images' and public.is_admin());
create policy "catalog_images_admin_insert" on storage.objects
  for insert with check (bucket_id = 'catalog-images' and public.is_admin());
create policy "catalog_images_admin_update" on storage.objects
  for update using (bucket_id = 'catalog-images' and public.is_admin())
  with check (bucket_id = 'catalog-images' and public.is_admin());
create policy "catalog_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'catalog-images' and public.is_admin());

-- 3. VERIFICACIÓN --------------------------------------------------------------------------

select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'catalog-images';
