-- ==============================================================================
-- ALOHA INDUMENTARIA - "Piso 3" pasa a "Oficina 3"
-- Pegar completo en Supabase > SQL Editor y ejecutar (Run). Re-ejecutable; solo cambia textos.
--
-- Reemplaza "Piso 3" por "Oficina 3" (sin distinguir mayúsculas) en la dirección del showroom
-- y en la marquesina superior. Si preferís, también se puede editar desde el panel (Ajustes de Tienda).
-- ==============================================================================

update public.store_settings
set address = regexp_replace(address, 'piso 3', 'Oficina 3', 'gi'),
    announcement_text = regexp_replace(announcement_text, 'piso 3', 'Oficina 3', 'gi')
where id = 1;

-- Verificación
select address, announcement_text from public.store_settings where id = 1;
