-- ==============================================================================
-- ALOHA INDUMENTARIA - Categorías y subcategorías iniciales
-- Pegar completo en Supabase > SQL Editor y ejecutar (Run).
-- Es re-ejecutable: no duplica lo que ya existe. Después la dueña puede agregar o borrar
-- categorías desde el panel de administración (Categorías & Subcategorías).
-- ==============================================================================

insert into public.categories (slug, name, description, image_url, display_order) values
  ('pantalones',      'Pantalones',        'Sastrería contemporánea, calzas modeladoras, joggers y denim.',      '', 1),
  ('tops-remeras',    'Tops & Remeras',    'Corsets estructurados, halters, algodón pima y siluetas modernas.',  '', 2),
  ('vestidos',        'Vestidos',          'Siluetas arquitectónicas para noche, eventos o uso diario.',         '', 3),
  ('abrigos-blazers', 'Abrigos & Blazers', 'Blazers sastreros oversize, tapados y camperas estructuradas.',     '', 4),
  ('accesorios',      'Accesorios',        'Cinturones de cuero genuino, bolsos y complementos de autor.',       '', 5)
on conflict (slug) do nothing;

insert into public.subcategories (category_id, slug, name)
select c.id, s.slug, s.name
from (values
  ('pantalones',      'sastreros',   'Sastreros'),
  ('pantalones',      'calzas',      'Calzas'),
  ('pantalones',      'joggers',     'Joggers / Jogging'),
  ('pantalones',      'jeans',       'Jeans & Denim'),
  ('tops-remeras',    'corsets',     'Corsets'),
  ('tops-remeras',    'halters',     'Halters'),
  ('tops-remeras',    'manga-corta', 'Manga Corta'),
  ('tops-remeras',    'musculosas',  'Musculosas'),
  ('tops-remeras',    'bodys',       'Bodys'),
  ('vestidos',        'fiesta',      'Fiesta / Noche'),
  ('vestidos',        'casual',      'Casual'),
  ('vestidos',        'lenceros',    'Lenceros'),
  ('abrigos-blazers', 'blazers',     'Blazers'),
  ('abrigos-blazers', 'tapados',     'Tapados'),
  ('abrigos-blazers', 'camperas',    'Camperas'),
  ('accesorios',      'cintos',      'Cintos de Cuero'),
  ('accesorios',      'bolsos',      'Bolsos & Carteras'),
  ('accesorios',      'joyeria',     'Joyería Minimal')
) as s(cat_slug, slug, name)
join public.categories c on c.slug = s.cat_slug
where not exists (
  select 1 from public.subcategories x where x.category_id = c.id and x.slug = s.slug
);

-- Verificación: 5 categorías y 18 subcategorías
select (select count(*) from public.categories) as categorias,
       (select count(*) from public.subcategories) as subcategorias;
