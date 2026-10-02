// Filas de las tablas de Supabase, tal como las devuelve `select('*')`.
// Reflejan supabase/database_schema.sql (+ supabase/storage_y_ajustes.sql). Si cambia el esquema, actualizar acá.

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  display_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SubcategoryRow {
  id: string;
  category_id: string | null;
  slug: string;
  name: string;
  created_at: string | null;
}

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | string;
  original_price: number | string | null;
  category: string;
  subcategory: string | null;
  product_type: string | null;
  images: string[] | null;
  sizes: string[] | null;
  colors: { name: string; hex: string }[] | null;
  in_stock: boolean | null;
  featured: boolean | null;
  is_new_arrival: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  address: {
    street?: string;
    city: string;
    province: string;
    postalCode: string;
    notes?: string;
  } | null;
  provider: string | null;
  is_admin: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface OrderRow {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_location: string | null;
  items: { productId: string; name: string; size: string; color: string; price: number; quantity: number }[] | null;
  subtotal: number | string;
  discount_amount: number | string | null;
  coupon_code: string | null;
  total: number | string;
  status: 'whatsapp_sent' | 'contacted' | 'confirmed' | 'delivered' | 'cancelled';
  whatsapp_message: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CouponRow {
  id: string;
  code: string;
  discount_percentage: number | string | null;
  fixed_discount: number | string | null;
  max_uses: number | null;
  used_count: number | null;
  target_category: string | null;
  min_amount: number | string | null;
  min_items: number | null;
  is_active: boolean | null;
  expires_at: string | null;
  created_at: string | null;
}

/** Lo que devuelve la función get_coupon() (un cupón válido, sin datos internos). */
export type CouponRpcRow = Pick<
  CouponRow,
  'id' | 'code' | 'discount_percentage' | 'fixed_discount' | 'target_category' | 'max_uses' | 'used_count' | 'min_amount' | 'min_items'
>;

/** store_settings: una sola fila con columnas planas (ver SETTINGS_DB_KEYS en StoreContext). */
export type StoreSettingsRow = Record<string, string | number | boolean | null>;

/** Objeto de escritura hacia la base (solo las columnas que se cambian). */
export type DbWrite = Record<string, unknown>;
