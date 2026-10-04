-- ==============================================================================
-- ALOHA INDUMENTARIA - ESQUEMA DE BASE DE DATOS MAESTRO (SUPABASE / POSTGRESQL)
-- Optimizado para Cloudflare Pages, alto volumen de clientas y catálogo de prendas.
--
-- ORDEN DE EJECUCIÓN (ver docs/base-de-datos.md):
--   1. este archivo  2. rls_policies.sql  3. storage_y_ajustes.sql  4. cupones.sql  5. categorias_iniciales.sql
-- IMPORTANTE: las políticas de la sección 8 de este archivo las REEMPLAZA rls_policies.sql
-- (corrige el escalado de privilegios y la recursión en "profiles"). Ejecutar siempre ese archivo después.
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLA: CATEGORÍAS & SUBCATEGORÍAS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories(category_id);

-- ==============================================================================
-- 3. TABLA: PRODUCTOS / PRENDAS (CATÁLOGO)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    original_price NUMERIC(12, 2) DEFAULT 0,
    category TEXT NOT NULL,
    subcategory TEXT DEFAULT '',
    product_type TEXT DEFAULT '',
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    sizes TEXT[] DEFAULT ARRAY['S', 'M', 'L']::TEXT[],
    colors JSONB DEFAULT '[]'::JSONB,
    in_stock BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    last_in_stock BOOLEAN DEFAULT FALSE,
    is_new_arrival BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de alto rendimiento para filtros
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON public.products(subcategory);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- ==============================================================================
-- 4. TABLA: PERFILES DE USUARIAS & CLIENTAS (AUTH LINKED)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    address JSONB DEFAULT '{}'::JSONB,
    provider TEXT DEFAULT 'email',
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);

-- ==============================================================================
-- 5. TABLA: PEDIDOS Y REGISTROS WHATSAPP (ORDERS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT DEFAULT '',
    customer_location TEXT DEFAULT '',
    items JSONB NOT NULL DEFAULT '[]'::JSONB,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12, 2) DEFAULT 0,
    coupon_code TEXT DEFAULT '',
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'whatsapp_sent' CHECK (status IN ('whatsapp_sent', 'contacted', 'confirmed', 'delivered', 'cancelled')),
    whatsapp_message TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- ==============================================================================
-- 6. TABLA: CUPONES Y DESCUENTOS ESPECIALES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_percentage NUMERIC(5, 2) DEFAULT 0,
    fixed_discount NUMERIC(12, 2) DEFAULT 0,
    max_uses INTEGER DEFAULT NULL,
    used_count INTEGER DEFAULT 0,
    target_category TEXT DEFAULT 'all',
    min_amount NUMERIC(12, 2) DEFAULT 0,   -- cupón "por monto": compra mínima (0 = sin mínimo)
    min_items INTEGER DEFAULT 0,           -- cupón "por cantidad": prendas mínimas (0 = sin mínimo)
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);

-- ==============================================================================
-- 7. TABLA: CONFIGURACIÓN GENERAL DEL SHOWROOM & TIENDA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.store_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    store_name TEXT DEFAULT 'Aloha Indumentaria',
    whatsapp_number TEXT DEFAULT '5492974201122',
    address TEXT DEFAULT '25 de Mayo 903, Oficina 3',
    city TEXT DEFAULT 'Comodoro Rivadavia',
    province TEXT DEFAULT 'Chubut, Argentina',
    opening_hours TEXT DEFAULT 'Lunes a Sábados de 15:00 a 20:00 hs',
    global_discount_percentage NUMERIC(5, 2) DEFAULT 0,
    global_discount_active BOOLEAN DEFAULT FALSE,
    volume_discount_active BOOLEAN DEFAULT TRUE,
    volume_discount_min_items INTEGER DEFAULT 3,
    volume_discount_percentage NUMERIC(5, 2) DEFAULT 15,
    price_discount_active BOOLEAN DEFAULT FALSE,
    price_discount_min_amount NUMERIC(12, 2) DEFAULT 80000,
    price_discount_percentage NUMERIC(5, 2) DEFAULT 10,
    announcement_text TEXT DEFAULT '✨ NUEVA COLECCIÓN • ENVÍOS A TODO EL PAÍS • ASESORAMIENTO PERSONALIZADO',
    instagram_url TEXT DEFAULT 'https://instagram.com/aloha.indumentaria_cr',
    instagram_handle TEXT DEFAULT 'aloha.indumentaria_cr',
    facebook_url TEXT DEFAULT 'https://facebook.com/alohaindumentariacr',
    tiktok_url TEXT DEFAULT 'https://tiktok.com/@aloha.indumentaria_cr',
    hero_badge_text TEXT DEFAULT 'Nueva Colección 2026',
    hero_title TEXT DEFAULT 'Elegancia & Estilo',
    hero_subtitle TEXT DEFAULT 'Prendas esenciales y diseño contemporáneo pensados para acompañar tu día a día con distinción.',
    showroom_image_url TEXT DEFAULT '',
    showroom_image_position TEXT DEFAULT '50% 50%',
    hero_image_position TEXT DEFAULT '50% 50%',
    hero_image_url TEXT DEFAULT 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2000',
    hero_primary_btn_text TEXT DEFAULT 'Ver Catálogo',
    hero_secondary_btn_text TEXT DEFAULT 'Ver Showroom',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- ==============================================================================
-- 8. POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Lectura pública para clientes (Catálogo, Ajustes, Cupones Activos, Categorías)
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public Read Subcategories" ON public.subcategories FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public Read Settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Active Coupons" ON public.coupons FOR SELECT USING (is_active = true);

-- Inserción de pedidos (Cualquier clienta o invitada puede enviar un pedido)
CREATE POLICY "Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users Read Own Orders" ON public.orders FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);

-- Perfiles: Cada usuario gestiona el suyo, los admins ven todos
CREATE POLICY "Users Manage Own Profile" ON public.profiles FOR ALL USING (
    auth.uid() = id OR 
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);

-- Escritura y gestión de catálogo exclusiva para Administradores
CREATE POLICY "Admin Manage Categories" ON public.categories FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);
CREATE POLICY "Admin Manage Subcategories" ON public.subcategories FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);
CREATE POLICY "Admin Manage Products" ON public.products FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);
CREATE POLICY "Admin Manage Coupons" ON public.coupons FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);
CREATE POLICY "Admin Manage Settings" ON public.store_settings FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);
CREATE POLICY "Admin Manage Orders" ON public.orders FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
);

-- ==============================================================================
-- 9. DATOS SEMILLA INICIALES (SEED DATA)
-- ==============================================================================
INSERT INTO public.store_settings (id, store_name, address, city, province) 
VALUES (1, 'Aloha Indumentaria', '25 de Mayo 903, Oficina 3', 'Comodoro Rivadavia', 'Chubut, Argentina')
ON CONFLICT (id) DO NOTHING;
