export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string; // e.g. "pantalones", "tops-remeras", "vestidos", "abrigos-blazers", "accesorios"
  subcategory?: string; // e.g. "sastreros", "calzas", "joggers", "corsets", "halters"
  images: string[];
  sizes: string[]; // e.g. ["XS", "S", "M", "L", "XL"]
  colors: { name: string; hex: string }[];
  inStock: boolean;
  featured?: boolean;
  isNewArrival?: boolean;
  imagePosition?: string;
  createdAt: string;
}

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  order: number;
  subcategories?: Subcategory[];
}

export interface CartItem {
  id: string; // generated unique id: `${productId}-${selectedSize}-${selectedColor}`
  productId: string;
  product: Product;
  selectedSize: string;
  selectedColor: { name: string; hex: string };
  quantity: number;
  price: number;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  address?: {
    street?: string;
    city: string;
    province: string;
    postalCode: string;
    notes?: string;
  };
  provider?: 'google' | 'facebook' | 'email' | 'guest';
  createdAt: string;
  isAdmin?: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  fixedDiscount?: number;
  maxUses?: number; // Límite para X cantidad de personas
  usedCount: number; // Contador de usos
  targetCategory?: string; // 'all' o slug de categoría (ej: 'pantalones', 'vestidos')
  minAmount?: number; // cupón "por monto": compra mínima (sobre el total de la bolsa)
  minItems?: number; // cupón "por cantidad": prendas mínimas en la bolsa
  isActive: boolean;
  expiresAt?: string;
}

export interface OrderRecord {
  id: string;
  userId?: string;
  customerName: string;
  customerPhone?: string;
  customerLocation?: string;
  items: {
    productId: string;
    name: string;
    size: string;
    color: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  total: number;
  status: 'whatsapp_sent' | 'contacted' | 'confirmed' | 'delivered' | 'cancelled';
  whatsappMessage: string;
  createdAt: string;
}

export interface StoreSettings {
  whatsappNumber: string; // e.g. "5492974201122"
  storeName: string;
  address: string;
  city: string;
  province: string;
  openingHours: string;
  announcementText: string;
  instagramUrl: string;
  instagramHandle: string;
  facebookUrl: string;
  tiktokUrl: string;

  // Hero Banner Customization (Editable from Admin)
  heroBadgeText?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImageUrl?: string;
  // Foto de la sección "Vení a conocer nuestro local" (vacía = tarjeta oscura sin foto)
  showroomImageUrl?: string;
}

export type InfoModalType = 'como-comprar' | 'terminos' | 'devoluciones' | 'arrepentimiento' | 'contacto' | null;

