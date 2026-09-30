import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Product, Category, CartItem, UserProfile, Coupon, OrderRecord, StoreSettings, InfoModalType } from '../types';
import { DEMO_CATEGORIES, DEMO_PRODUCTS, DEMO_COUPONS } from '../data/demoData';
import { DEFAULT_SETTINGS } from '../data/defaultSettings';
import { supabase, isSupabaseConfigured, openedFromRecoveryLink, openedFromExpiredLink } from '../lib/supabase';
import { deleteCatalogImages } from '../lib/images';
import { slugify } from '../lib/slug';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type {
  CategoryRow, SubcategoryRow, ProductRow, ProfileRow, OrderRow, CouponRow, CouponRpcRow,
  StoreSettingsRow, DbWrite,
} from '../types/database';
import type { Options as ConfettiOptions } from 'canvas-confetti';

// El confeti se descarga recién cuando se usa (no pesa en la carga inicial)
const confetti = (options: ConfettiOptions) => {
  import('canvas-confetti').then(m => m.default(options)).catch(() => {});
};

interface StoreContextType {
  // Catalog
  products: Product[];
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (slug: string) => void;
  selectedSubcategory: string;
  setSelectedSubcategory: (subSlug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'newest';
  setSortBy: (sort: 'featured' | 'price-asc' | 'price-desc' | 'newest') => void;
  
  // Product CRUD (Admin)
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductStock: (id: string) => Promise<void>;

  // Product Modal (Contextual Admin creation/edition)
  isProductModalOpen: boolean;
  editingProduct: Product | null;
  openCreateProductModal: (category?: string, subcategory?: string) => void;
  openEditProductModal: (product: Product) => void;
  closeProductModal: () => void;

  // Category & Subcategory CRUD (Admin)
  // Devuelven null si salió bien, o el motivo del error para mostrarlo en el panel
  addCategory: (category: Omit<Category, 'id'>) => Promise<string | null>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<string | null>;
  deleteCategory: (id: string) => Promise<string | null>;
  addSubcategory: (categoryId: string, name: string, slug?: string) => Promise<string | null>;
  deleteSubcategory: (categoryId: string, subcategoryId: string) => Promise<string | null>;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, size: string, color: { name: string; hex: string }, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartDiscount: number;
  isVolumeDiscountApplied: boolean;
  cartTotal: number;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;

  // Checkout WhatsApp
  checkoutViaWhatsApp: () => Promise<string>;
  
  // Orders / WhatsApp logs (Admin & User)
  orders: OrderRecord[];
  updateOrderStatus: (orderId: string, status: OrderRecord['status']) => Promise<boolean>;
  refreshOrders: () => Promise<void>;

  // Promotions & Coupons (Admin)
  coupons: Coupon[];
  addCoupon: (coupon: Omit<Coupon, 'id' | 'usedCount'>) => Promise<string | null>; // null = ok, texto = motivo del error
  deleteCoupon: (id: string) => Promise<string | null>;
  toggleCouponActive: (id: string) => Promise<string | null>;
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<boolean>;

  // Auth & Profile
  currentUser: UserProfile | null;
  registeredUsers: UserProfile[];
  loginWithSocial: (provider: 'google') => Promise<string | null>; // null = redirigiendo a Google; texto = error
  loginWithEmail: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  registerUser: (data: {
    fullName: string;
    email: string;
    password?: string;
    phone: string;
    postalCode?: string;
    street?: string;
    city?: string;
    province?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  // Recuperar contraseña
  requestPasswordReset: (email: string) => Promise<string | null>; // null = enviado (o correo desconocido); texto = error
  updatePassword: (newPassword: string) => Promise<string | null>; // null = cambiada; texto = error
  isPasswordRecovery: boolean; // el sitio se abrió desde el enlace del correo: falta elegir la contraseña nueva
  closePasswordRecovery: () => void;
  authNotice: string; // aviso para el modal de ingreso (p. ej. enlace vencido)
  setAuthNotice: (notice: string) => void;
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>;

  // Navigation & Page Routing
  currentView: 'shop' | 'admin';
  setCurrentView: (view: 'shop' | 'admin') => void;

  // Modals & UI States
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  activeInfoModal: InfoModalType;
  setActiveInfoModal: (modal: InfoModalType) => void;
  
  // Quick View / Detail
  selectedProductForDetail: Product | null;
  setSelectedProductForDetail: (product: Product | null) => void;

  // Wishlist
  wishlist: string[]; // product IDs
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  PRODUCTS: 'aloha_products_v3',
  CATEGORIES: 'aloha_categories_v3',
  CART: 'aloha_cart_v3',
  COUPONS: 'aloha_coupons_v3',
  SETTINGS: 'aloha_settings_v3',
  USERS: 'aloha_users_v3',
  CURRENT_USER: 'aloha_current_user_v3',
  ORDERS: 'aloha_orders_v3',
  WISHLIST: 'aloha_wishlist_v3',
};

// Correspondencia entre los campos de la app y las columnas de la tabla store_settings
const SETTINGS_DB_KEYS: Record<keyof StoreSettings, string> = {
  whatsappNumber: 'whatsapp_number',
  storeName: 'store_name',
  address: 'address',
  city: 'city',
  province: 'province',
  openingHours: 'opening_hours',
  globalDiscountPercentage: 'global_discount_percentage',
  globalDiscountActive: 'global_discount_active',
  volumeDiscountActive: 'volume_discount_active',
  volumeDiscountMinItems: 'volume_discount_min_items',
  volumeDiscountPercentage: 'volume_discount_percentage',
  priceDiscountActive: 'price_discount_active',
  priceDiscountMinAmount: 'price_discount_min_amount',
  priceDiscountPercentage: 'price_discount_percentage',
  announcementText: 'announcement_text',
  instagramUrl: 'instagram_url',
  instagramHandle: 'instagram_handle',
  facebookUrl: 'facebook_url',
  tiktokUrl: 'tiktok_url',
  heroBadgeText: 'hero_badge_text',
  heroTitle: 'hero_title',
  heroSubtitle: 'hero_subtitle',
  heroImageUrl: 'hero_image_url',
  heroPrimaryBtnText: 'hero_primary_btn_text',
  heroSecondaryBtnText: 'hero_secondary_btn_text',
};

const mapOrderFromDb = (r: OrderRow): OrderRecord => ({
  id: r.id,
  userId: r.user_id ?? undefined,
  customerName: r.customer_name,
  customerPhone: r.customer_phone || undefined,
  customerLocation: r.customer_location || undefined,
  items: r.items ?? [],
  subtotal: Number(r.subtotal || 0),
  discountAmount: Number(r.discount_amount || 0),
  couponCode: r.coupon_code || undefined,
  total: Number(r.total || 0),
  status: r.status,
  whatsappMessage: r.whatsapp_message || '',
  createdAt: r.created_at || new Date().toISOString(),
});

// El cupón puede venir completo (tabla, para la administradora) o reducido (función get_coupon)
type CouponInput = CouponRpcRow & Partial<CouponRow>;

const mapCouponFromDb = (r: CouponInput): Coupon => ({
  id: r.id,
  code: r.code,
  discountPercentage: Number(r.discount_percentage || 0),
  fixedDiscount: Number(r.fixed_discount || 0) || undefined,
  maxUses: r.max_uses ?? undefined,
  usedCount: r.used_count ?? 0,
  targetCategory: r.target_category || 'all',
  isActive: r.is_active ?? true,
  expiresAt: r.expires_at || undefined,
});

const settingsKeys = Object.keys(SETTINGS_DB_KEYS) as (keyof StoreSettings)[];

const settingsFromDb = (row: StoreSettingsRow): StoreSettings => {
  const result: StoreSettings = { ...DEFAULT_SETTINGS };
  // Se escribe por nombre de campo: la conversión es segura porque el tipo de cada valor sale de DEFAULT_SETTINGS
  const target = result as unknown as Record<string, unknown>;
  settingsKeys.forEach(key => {
    const value = row[SETTINGS_DB_KEYS[key]];
    if (value === null || value === undefined) return;
    target[key] = typeof DEFAULT_SETTINGS[key] === 'number' ? Number(value) : value;
  });
  return result;
};

const settingsToDb = (settings: Partial<StoreSettings>): DbWrite => {
  const dbObj: DbWrite = { updated_at: new Date().toISOString() };
  settingsKeys.forEach(key => {
    if (settings[key] !== undefined) dbObj[SETTINGS_DB_KEYS[key]] = settings[key];
  });
  return dbObj;
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initial states with LocalStorage persistence fallback
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : DEMO_PRODUCTS;
  });

  // Con Supabase las categorías vienen de la base (sin caché ni categorías de fábrica)
  const [categories, setCategories] = useState<Category[]>(() => {
    if (isSupabaseConfigured) return [];
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : DEMO_CATEGORIES;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.CART);
    return saved ? JSON.parse(saved) : [];
  });

  // Con Supabase la lista completa de cupones solo la recibe la administradora (las clientas validan de a uno)
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    if (isSupabaseConfigured) return [];
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.COUPONS);
    return saved ? JSON.parse(saved) : DEMO_COUPONS;
  });

  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        // Copia local (caché): la fuente de verdad es la tabla store_settings de Supabase
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Con Supabase, pedidos y clientas se leen de la base según la sesión: no se guardan en el navegador
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>(() => {
    if (isSupabaseConfigured) return [];
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.USERS);
    if (saved) {
      try {
        const parsed: UserProfile[] = JSON.parse(saved);
        return parsed.filter(u => u.id !== 'usr-camila' && u.id !== 'usr-luci');
      } catch {
        return [];
      }
    }
    return [];
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
    if (saved) {
      try {
        const parsed: UserProfile = JSON.parse(saved);
        if (parsed.id === 'usr-camila' || parsed.id === 'usr-luci') {
          localStorage.removeItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
          return null;
        }
        return parsed;
      } catch {
        return null;
      }
    }
    return null; // Guest by default, no auto-login
  });

  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    if (isSupabaseConfigured) return [];
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.ORDERS);
    if (saved) {
      try {
        const parsed: OrderRecord[] = JSON.parse(saved);
        return parsed.filter(o => o.id !== 'ORD-9842' && o.userId !== 'usr-luci');
      } catch {
        return [];
      }
    }
    return [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEYS.WISHLIST);
    return saved ? JSON.parse(saved) : [];
  });

  // Filter & Navigation states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  // Si se llega con un enlace de correo vencido, se abre el ingreso con un aviso; si es de recuperación, se pide la contraseña nueva
  const [isAuthModalOpen, setAuthModalOpenRaw] = useState(openedFromExpiredLink);
  const [authNotice, setAuthNotice] = useState(
    openedFromExpiredLink ? 'El enlace del correo venció o ya se usó. Pedí uno nuevo desde acá.' : ''
  );
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(openedFromRecoveryLink);
  // Al cerrar el ingreso se descarta el aviso, para que no reaparezca la próxima vez que se abra
  const setIsAuthModalOpen = (open: boolean) => {
    setAuthModalOpenRaw(open);
    if (!open) setAuthNotice('');
  };
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeInfoModal, setActiveInfoModal] = useState<InfoModalType>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);

  // Admin Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const openCreateProductModal = (catSlug?: string, subSlug?: string) => {
    const fallbackCategory = categories.find(c => c.slug !== 'all')?.slug || 'pantalones';
    const activeCat = catSlug || (selectedCategory !== 'all' ? selectedCategory : fallbackCategory);
    const catObj = categories.find(c => c.slug === activeCat);
    const activeSub = subSlug || (selectedSubcategory !== 'all' ? selectedSubcategory : (catObj?.subcategories?.[0]?.slug || ''));

    setEditingProduct({
      id: '',
      name: '',
      slug: '',
      description: '',
      price: 0,
      originalPrice: 0,
      category: activeCat,
      subcategory: activeSub,
      images: [],
      sizes: [],
      colors: [],
      inStock: true,
      featured: false,
      isNewArrival: true,
      createdAt: new Date().toISOString(),
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  // When category changes, reset subcategory to 'all'
  const handleSetCategory = (slug: string) => {
    setSelectedCategory(slug);
    setSelectedSubcategory('all');
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    if (isSupabaseConfigured) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.CATEGORIES);
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (isSupabaseConfigured) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.COUPONS); // los códigos no se guardan en el navegador
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (isSupabaseConfigured) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.USERS); // datos personales: solo en memoria
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isSupabaseConfigured) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.ORDERS); // datos personales: solo en memoria
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.WISHLIST, JSON.stringify(wishlist));
  }, [wishlist]);

  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    });
  };

  const mapProductFromDb = (row: ProductRow): Product => ({
    id: row.id,
    name: row.name,
    slug: row.slug || slugify(row.name),
    description: row.description || '',
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    category: row.category,
    subcategory: row.subcategory || undefined,
    images: Array.isArray(row.images) ? row.images : [],
    sizes: Array.isArray(row.sizes) ? row.sizes : ['S', 'M', 'L'],
    colors: Array.isArray(row.colors) ? row.colors : [],
    inStock: Boolean(row.in_stock ?? true),
    featured: Boolean(row.featured ?? false),
    isNewArrival: Boolean(row.is_new_arrival ?? false),
    createdAt: row.created_at || new Date().toISOString(),
  });

  const mapProductToDb = (product: Partial<Product>) => {
    const dbObj: DbWrite = {};
    if (product.id !== undefined) dbObj.id = product.id;
    if (product.name !== undefined) dbObj.name = product.name;
    if (product.slug !== undefined) dbObj.slug = product.slug;
    if (product.description !== undefined) dbObj.description = product.description;
    if (product.price !== undefined) dbObj.price = product.price;
    if ('originalPrice' in product) dbObj.original_price = product.originalPrice ?? 0;
    if (product.category !== undefined) dbObj.category = product.category;
    if (product.subcategory !== undefined) dbObj.subcategory = product.subcategory;
    if (product.images !== undefined) dbObj.images = product.images;
    if (product.sizes !== undefined) dbObj.sizes = product.sizes;
    if (product.colors !== undefined) dbObj.colors = product.colors;
    if (product.inStock !== undefined) dbObj.in_stock = product.inStock;
    if (product.featured !== undefined) dbObj.featured = product.featured;
    if (product.isNewArrival !== undefined) dbObj.is_new_arrival = product.isNewArrival;
    return dbObj;
  };

  const mapProfileFromDb = (p: ProfileRow): UserProfile => ({
    id: p.id,
    email: p.email,
    fullName: p.full_name || 'Cliente Aloha',
    avatarUrl: p.avatar_url || '',
    phone: p.phone || '',
    address: p.address?.city ? p.address : undefined,
    provider: (p.provider as UserProfile['provider']) || 'email',
    isAdmin: Boolean(p.is_admin),
    createdAt: p.created_at || new Date().toISOString(),
  });

  const mapProfileToDb = (profile: Partial<UserProfile>) => {
    const dbObj: DbWrite = {};
    if (profile.id !== undefined) dbObj.id = profile.id;
    if (profile.email !== undefined) dbObj.email = profile.email;
    if (profile.fullName !== undefined) dbObj.full_name = profile.fullName;
    if (profile.avatarUrl !== undefined) dbObj.avatar_url = profile.avatarUrl;
    if (profile.phone !== undefined) dbObj.phone = profile.phone;
    if (profile.address !== undefined) dbObj.address = profile.address;
    if (profile.provider !== undefined) dbObj.provider = profile.provider;
    // is_admin nunca se escribe desde el cliente: se asigna solo desde el panel de Supabase.
    return dbObj;
  };

  // Perfil de una cuenta con sesión: se lee de la base y, si es la primera vez (p. ej. el primer ingreso con Google
  // o una cuenta recién confirmada por correo), se crea con los datos que trae la cuenta.
  const resolveProfile = async (client: SupabaseClient, authUser: User): Promise<UserProfile> => {
    const { data, error } = await client.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
    if (error) console.warn('No se pudo leer el perfil:', error.code, error.message);
    if (data) return mapProfileFromDb(data as ProfileRow);

    const meta = authUser.user_metadata || {};
    const created: UserProfile = {
      id: authUser.id,
      email: (authUser.email || '').toLowerCase(),
      fullName: meta.full_name || meta.name || 'Cliente Aloha',
      phone: meta.phone || '',
      avatarUrl: meta.avatar_url || meta.picture || '',
      provider: authUser.app_metadata?.provider === 'google' ? 'google' : 'email',
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };
    const { error: upsertError } = await client.from('profiles').upsert([mapProfileToDb(created)]);
    if (upsertError) console.warn('No se pudo crear el perfil:', upsertError.code, upsertError.message);
    return created;
  };

  // If Supabase is configured, initialize remote fetch
  useEffect(() => {
    const client = supabase;
    if (isSupabaseConfigured && client) {
      const fetchSupabaseData = async () => {
        try {
          const { data: dbProducts, error: prodError } = await client.from('products').select('*');
          if (prodError) {
            console.warn('Supabase product query notice:', prodError.message);
          } else if (dbProducts) {
            // La base es la fuente de verdad: si está vacía, el catálogo queda vacío (sin prendas de demostración)
            setProducts((dbProducts as ProductRow[]).map(mapProductFromDb));
          }

          const { data: dbSettings, error: settingsError } = await client.from('store_settings').select('*').eq('id', 1).maybeSingle();
          if (settingsError) console.warn('Supabase settings query notice:', settingsError.message);
          else if (dbSettings) setSettings(settingsFromDb(dbSettings as StoreSettingsRow));

          const { data: dbCategories, error: catError } = await client.from('categories').select('*').order('display_order');
          const { data: dbSubcategories, error: subError } = await client.from('subcategories').select('*').order('created_at');
          if (catError || subError) {
            console.warn('Supabase categories query notice:', (catError || subError)?.message);
          } else if (dbCategories) {
            setCategories((dbCategories as CategoryRow[]).map((c): Category => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              description: c.description || undefined,
              image: c.image_url || undefined,
              order: c.display_order ?? 0,
              subcategories: ((dbSubcategories || []) as SubcategoryRow[])
                .filter(s => s.category_id === c.id)
                .map(s => ({ id: s.id, name: s.name, slug: s.slug })),
            })));
          }

          // La sesión real es la de Supabase Auth: el usuario guardado en localStorage no alcanza.
          // Si no hay sesión se descarta, y si la hay se toma el perfil (y el rol admin) de la base.
          const { data: sessionData } = await client.auth.getSession();
          const sessionUser = sessionData.session?.user;
          setCurrentUser(sessionUser ? await resolveProfile(client, sessionUser) : null);

        } catch (e) {
          console.warn('Using offline database cache:', e);
        }
      };
      fetchSupabaseData();
    }
  }, []);

  // Cambios de sesión (ingreso con Google al volver de la redirección, cierre en otra pestaña, sesión vencida)
  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) return;

    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        return;
      }
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        return;
      }
      if (event === 'SIGNED_IN' && session?.user) {
        const authUser = session.user;
        // No se hacen consultas dentro del callback (bloquearía al cliente de Supabase): se difieren
        setTimeout(() => {
          resolveProfile(client, authUser).then(profile => {
            setCurrentUser(prev => (prev && prev.id === profile.id && prev.isAdmin === profile.isAdmin ? prev : profile));
          });
        }, 0);
      }
    });
    return () => data.subscription.unsubscribe();
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pedidos y clientas: la base decide qué se ve (RLS). La admin recibe todo; cada clienta, solo lo suyo.
  const currentUserId = currentUser?.id;
  const isAdminUser = Boolean(currentUser?.isAdmin);

  const refreshOrders = useCallback(async () => {
    const client = supabase;
    if (!isSupabaseConfigured || !client || !currentUserId) return;
    const { data, error } = await client.from('orders').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('No se pudieron leer los pedidos:', error.message);
      return;
    }
    setOrders((data || []).map(mapOrderFromDb));
  }, [currentUserId]);

  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) return;

    if (!currentUserId) {
      // Al cerrar sesión se vacían los datos privados: es sincronización con la sesión, no estado derivable
      // oxlint-disable-next-line react/set-state-in-effect
      setOrders([]);
      setRegisteredUsers([]);
      setCoupons([]);
      return;
    }

    refreshOrders();
    if (isAdminUser) {
      client.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
        if (error) console.warn('No se pudieron leer las clientas:', error.message);
        else setRegisteredUsers((data || []).map(mapProfileFromDb));
      });
      client.from('coupons').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
        if (error) console.warn('No se pudieron leer los cupones:', error.message);
        else setCoupons((data || []).map(mapCouponFromDb));
      });
    } else {
      setRegisteredUsers([]);
      setCoupons([]);
    }
  }, [currentUserId, isAdminUser, refreshOrders]);

  // Navigation & Page Routing
  const [currentView, setCurrentView] = useState<'shop' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      return (window.location.pathname.startsWith('/admin') || window.location.hash === '#admin') ? 'admin' : 'shop';
    }
    return 'shop';
  });

  // Sync route changes
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin' || window.location.pathname.startsWith('/admin')) {
        setCurrentView('admin');
      } else if (window.location.hash === '' || window.location.hash === '#shop') {
        setCurrentView('shop');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSetCurrentView = (view: 'shop' | 'admin') => {
    setCurrentView(view);
    if (view === 'admin') {
      window.location.hash = '#admin';
    } else {
      window.location.hash = '#shop';
    }
  };

  // Cart Calculations: Strict single-discount rule (coupons are single-use per cart, no stacking)
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  let cartDiscount = 0;
  let isVolumeDiscountApplied = false;

  // 1. Single Coupon Discount (takes priority when applied, only 1 coupon allowed)
  if (appliedCoupon && appliedCoupon.isActive) {
    const eligibleSubtotal = appliedCoupon.targetCategory && appliedCoupon.targetCategory !== 'all'
      ? cart.filter(it => it.product.category === appliedCoupon.targetCategory).reduce((acc, it) => acc + (it.price * it.quantity), 0)
      : cartSubtotal;

    if (appliedCoupon.discountPercentage > 0) {
      cartDiscount = Math.round((eligibleSubtotal * appliedCoupon.discountPercentage) / 100);
    } else if (appliedCoupon.fixedDiscount) {
      cartDiscount = Math.min(appliedCoupon.fixedDiscount, eligibleSubtotal);
    }
  } else if (settings.volumeDiscountActive && cartCount >= settings.volumeDiscountMinItems && settings.volumeDiscountPercentage > 0) {
    // 2. Volume Discount calculation (only if no coupon is active)
    cartDiscount = Math.round((cartSubtotal * settings.volumeDiscountPercentage) / 100);
    isVolumeDiscountApplied = true;
  } else if (settings.priceDiscountActive && settings.priceDiscountMinAmount && cartSubtotal >= settings.priceDiscountMinAmount && (settings.priceDiscountPercentage || 0) > 0) {
    // 3. Price Threshold Discount
    cartDiscount = Math.round((cartSubtotal * (settings.priceDiscountPercentage || 0)) / 100);
  } else if (settings.globalDiscountActive && settings.globalDiscountPercentage > 0) {
    // 4. Global Store Discount
    cartDiscount = Math.round((cartSubtotal * settings.globalDiscountPercentage) / 100);
  }

  const cartTotal = Math.max(0, cartSubtotal - cartDiscount);

  // Cart actions
  const addToCart = (product: Product, size: string, color: { name: string; hex: string }, quantity = 1) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const cartItemId = `${product.id}-${size}-${color.name}`;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === cartItemId);
      if (existing) {
        return prev.map(item => 
          item.id === cartItemId 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          product,
          selectedSize: size,
          selectedColor: color,
          quantity,
          price: product.price,
        }
      ];
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  // Coupon handling with maxUses and targetCategory validation (no minPurchaseAmount required)
  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.trim().toUpperCase();
    let found: Coupon | undefined;

    if (isSupabaseConfigured && supabase) {
      // La base valida un solo código por vez (activo, vigente y con cupo): no se puede listar el resto
      const { data, error } = await supabase.rpc('get_coupon', { p_code: cleanCode });
      if (error) {
        return { success: false, message: 'No pudimos validar el cupón. Intentá nuevamente.' };
      }
      const row = data?.[0];
      if (row) found = mapCouponFromDb({ ...row, is_active: true });
    } else {
      found = coupons.find(c => c.code.toUpperCase() === cleanCode && c.isActive);
    }

    if (!found) {
      return { success: false, message: 'Cupón no válido, vencido o agotado.' };
    }

    // Check expiration (se ejecuta al tocar "Aplicar", no al renderizar)
    // oxlint-disable-next-line react/purity
    if (found.expiresAt && new Date(found.expiresAt).getTime() < Date.now()) {
      return { success: false, message: 'Este cupón ha expirado.' };
    }

    // Check max uses limit (X cantidad de personas)
    if (found.maxUses && found.maxUses > 0 && (found.usedCount || 0) >= found.maxUses) {
      return { 
        success: false, 
        message: `El cupón ${found.code} alcanzó el cupo máximo de ${found.maxUses} personas/canjes.` 
      };
    }

    // Check category targeting
    if (found.targetCategory && found.targetCategory !== 'all') {
      const hasCategoryItem = cart.some(it => it.product.category === found.targetCategory);
      if (!hasCategoryItem) {
        const catObj = categories.find(c => c.slug === found.targetCategory);
        const catName = catObj ? catObj.name : found.targetCategory.toUpperCase();
        return {
          success: false,
          message: `Este cupón es exclusivo para prendas de la sección "${catName}".`
        };
      }
    }

    setAppliedCoupon(found);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    } catch {}
    
    const scopeMsg = found.targetCategory && found.targetCategory !== 'all' 
      ? ` (válido para ${found.targetCategory.toUpperCase()})`
      : '';
    const benefit = found.discountPercentage > 0
      ? `-${found.discountPercentage}%`
      : `-${formatPrice(found.fixedDiscount || 0)}`;
    return { success: true, message: `¡Cupón ${found.code} aplicado con éxito! (${benefit})${scopeMsg}` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Format currency helper
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount).replace('ARS', '$').trim();
  };

  // Checkout via WhatsApp matching exact requested structure
  const checkoutViaWhatsApp = async (): Promise<string> => {
    if (cart.length === 0) return '';

    // Build exact item lines: [- Producto 1, Talle: M, Color: Negro, Precio: $15.000]
    const itemsLines = cart.map(item => {
      const formattedItemPrice = formatPrice(item.price * item.quantity);
      const qtyText = item.quantity > 1 ? ` (${item.quantity}x)` : '';
      return `[- ${item.product.name}${qtyText}, Talle: ${item.selectedSize}, Color: ${item.selectedColor.name}, Precio: ${formattedItemPrice}]`;
    }).join('\n');

    const formattedTotal = formatPrice(cartTotal);

    let whatsappMessage = `Hola, quiero realizar este pedido:\n${itemsLines}\nTotal: ${formattedTotal}\n¿Cómo continuamos con el proceso de compra seguro?`;

    // Append customer info if logged in
    if (currentUser) {
      const loc = currentUser.address
        ? [currentUser.address.street, currentUser.address.city, currentUser.address.province].filter(Boolean).join(', ')
        : '';
      if (loc) {
        whatsappMessage += `\n\nDatos de entrega: ${currentUser.fullName} - ${loc} (Tel: ${currentUser.phone || 'N/A'})`;
      }
    }

    // ID único (fecha + azar): el de 4 dígitos al azar podía repetirse y perder pedidos
    const newOrderId = `ORD-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 46656).toString(36).toUpperCase().padStart(3, '0')}`;
    const newOrder: OrderRecord = {
      id: newOrderId,
      userId: currentUser?.id,
      customerName: currentUser?.fullName || 'Cliente Web',
      customerPhone: currentUser?.phone || 'No especificado',
      customerLocation: currentUser?.address
        ? `${currentUser.address.city}, ${currentUser.address.province}${currentUser.address.street ? ` (${currentUser.address.street})` : ''}`
        : 'Consulta directa',
      items: cart.map(item => ({
        productId: item.productId,
        name: item.product.name,
        size: item.selectedSize,
        color: item.selectedColor.name,
        price: item.price,
        quantity: item.quantity
      })),
      subtotal: cartSubtotal,
      discountAmount: cartDiscount,
      couponCode: appliedCoupon?.code || (isVolumeDiscountApplied ? `VOLUMEN-${settings.volumeDiscountPercentage}%` : undefined),
      total: cartTotal,
      status: 'whatsapp_sent',
      whatsappMessage,
      createdAt: new Date().toISOString()
    };

    const targetPhone = settings.whatsappNumber.replace(/[^0-9]/g, '');
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodedMessage}`;

    // WhatsApp se abre ANTES de esperar a la base: en celulares el navegador bloquea ventanas abiertas después de un await
    window.open(whatsappUrl, '_blank');

    setOrders(prev => [newOrder, ...prev]);

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('orders').insert([{
        id: newOrderId,
        user_id: currentUser?.id || null,
        customer_name: newOrder.customerName,
        customer_phone: newOrder.customerPhone,
        customer_location: newOrder.customerLocation,
        items: newOrder.items,
        subtotal: newOrder.subtotal,
        discount_amount: newOrder.discountAmount,
        coupon_code: newOrder.couponCode,
        total: newOrder.total,
        status: 'whatsapp_sent',
        whatsapp_message: whatsappMessage,
      }]);
      if (error) console.error('No se pudo registrar el pedido en la base (el mensaje de WhatsApp sí se envió):', error.message);
    }

    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {}

    // Clear cart so the order resides exclusively in "Mis Pedidos"
    clearCart();

    return whatsappUrl;
  };

  // Solo la administradora puede cambiar estados: la base rechaza a cualquier otra cuenta
  const updateOrderStatus = async (orderId: string, status: OrderRecord['status']): Promise<boolean> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select('id');
      if (error || !data || data.length === 0) {
        console.error('No se pudo actualizar el estado del pedido:', error?.message || 'sin permisos');
        return false;
      }
    }
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status } : order
    ));
    return true;
  };

  // Product CRUD
  const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: generateUUID(),
      createdAt: new Date().toISOString()
    };
    // Primero la base: si falla, se avisa y no queda una prenda "fantasma" solo en este navegador
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('products').insert([mapProductToDb(newProduct)]);
      if (error) throw new Error(error.code === '23505' ? 'Ya existe una prenda con ese nombre. Cambiale el nombre.' : error.message);
    }
    setProducts(prev => [newProduct, ...prev]);
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    const previous = products.find(p => p.id === id);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .update({ ...mapProductToDb(productData), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id');
      if (error) throw new Error(error.code === '23505' ? 'Ya existe una prenda con ese nombre. Cambiale el nombre.' : error.message);
      if (!data || data.length === 0) throw new Error('No se pudo guardar: la prenda no existe en la base o tu cuenta no tiene permisos.');

      // Se borran del bucket las fotos que ya no se usan
      const newImages = productData.images;
      if (newImages && previous) {
        await deleteCatalogImages(previous.images.filter(url => !newImages.includes(url)));
      }
    }
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...productData } : p));
  };

  const deleteProduct = async (id: string) => {
    const previous = products.find(p => p.id === id);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('products').delete().eq('id', id).select('id');
      if (error) throw new Error(error.message);
      if (!data || data.length === 0) throw new Error('No se pudo eliminar: la prenda no existe en la base o tu cuenta no tiene permisos.');
      if (previous) await deleteCatalogImages(previous.images);
    }
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const toggleProductStock = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const newStock = !product.inStock;
    await updateProduct(id, { inStock: newStock });
  };

  // Category & Subcategory CRUD
  const addCategory = async (categoryData: Omit<Category, 'id'>): Promise<string | null> => {
    const slug = slugify(categoryData.slug || categoryData.name);
    if (!slug) return 'El nombre de la categoría no es válido.';
    if (categories.some(c => c.slug === slug)) return 'Ya existe una categoría con ese identificador.';

    let id = `cat-${Date.now()}`;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          slug,
          name: categoryData.name.trim(),
          description: categoryData.description || '',
          image_url: categoryData.image || '',
          display_order: categoryData.order,
        }])
        .select('id')
        .single();
      if (error || !data) return error?.code === '23505' ? 'Ya existe una categoría con ese identificador.' : (error?.message || 'No se pudo guardar la categoría.');
      id = data.id;
    }

    setCategories(prev => [...prev, { ...categoryData, slug, name: categoryData.name.trim(), id, subcategories: [] }]);
    return null;
  };

  const updateCategory = async (id: string, categoryData: Partial<Category>): Promise<string | null> => {
    if (isSupabaseConfigured && supabase) {
      const dbObj: DbWrite = { updated_at: new Date().toISOString() };
      if (categoryData.name !== undefined) dbObj.name = categoryData.name;
      if (categoryData.description !== undefined) dbObj.description = categoryData.description;
      if (categoryData.image !== undefined) dbObj.image_url = categoryData.image;
      if (categoryData.order !== undefined) dbObj.display_order = categoryData.order;
      const { data, error } = await supabase.from('categories').update(dbObj).eq('id', id).select('id');
      if (error || !data || data.length === 0) return error?.message || 'No se pudo actualizar la categoría (sin permisos).';
    }
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...categoryData } : c));
    return null;
  };

  const deleteCategory = async (id: string): Promise<string | null> => {
    const category = categories.find(c => c.id === id);
    if (!category) return 'Categoría no encontrada.';

    // Si hay prendas en la categoría se rechaza: quedarían sin sección y no aparecerían en ningún filtro
    const inUse = products.filter(p => p.category === category.slug).length;
    if (inUse > 0) {
      return `La categoría "${category.name}" tiene ${inUse} prenda${inUse > 1 ? 's' : ''}. Movelas a otra categoría o eliminalas antes de borrarla.`;
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('categories').delete().eq('id', id).select('id'); // sus subcategorías se borran en cascada
      if (error || !data || data.length === 0) return error?.message || 'No se pudo eliminar la categoría (sin permisos).';
    }
    setCategories(prev => prev.filter(c => c.id !== id));
    return null;
  };

  const addSubcategory = async (categoryId: string, name: string, slug?: string): Promise<string | null> => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return 'Categoría no encontrada.';

    const subSlug = slugify(slug || name);
    if (!subSlug) return 'El nombre de la subcategoría no es válido.';
    if ((category.subcategories || []).some(s => s.slug === subSlug)) return 'Esa subcategoría ya existe en esta categoría.';

    let id = `sub-${Date.now()}`;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('subcategories')
        .insert([{ category_id: categoryId, slug: subSlug, name: name.trim() }])
        .select('id')
        .single();
      if (error || !data) return error?.message || 'No se pudo guardar la subcategoría.';
      id = data.id;
    }

    const newSub = { id, name: name.trim(), slug: subSlug };
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, subcategories: [...(cat.subcategories || []), newSub] } : cat
    ));
    return null;
  };

  const deleteSubcategory = async (categoryId: string, subcategoryId: string): Promise<string | null> => {
    const category = categories.find(c => c.id === categoryId);
    const subcategory = category?.subcategories?.find(s => s.id === subcategoryId);
    if (!category || !subcategory) return 'Subcategoría no encontrada.';

    const inUse = products.filter(p => p.category === category.slug && p.subcategory === subcategory.slug).length;
    if (inUse > 0) {
      return `La subcategoría "${subcategory.name}" tiene ${inUse} prenda${inUse > 1 ? 's' : ''}. Movelas o eliminalas antes de borrarla.`;
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('subcategories').delete().eq('id', subcategoryId).select('id');
      if (error || !data || data.length === 0) return error?.message || 'No se pudo eliminar la subcategoría (sin permisos).';
    }
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId
        ? { ...cat, subcategories: (cat.subcategories || []).filter(s => s.id !== subcategoryId) }
        : cat
    ));
    return null;
  };

  // Coupons & Settings
  // Los tres devuelven null si salió bien, o el motivo del error para mostrarlo en el panel
  const addCoupon = async (couponData: Omit<Coupon, 'id' | 'usedCount'>): Promise<string | null> => {
    const newCoupon: Coupon = {
      ...couponData,
      id: `coup-${Date.now()}`,
      usedCount: 0,
      targetCategory: couponData.targetCategory || 'all',
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('coupons')
        .insert([{
          code: newCoupon.code,
          discount_percentage: newCoupon.discountPercentage,
          fixed_discount: newCoupon.fixedDiscount ?? 0,
          max_uses: newCoupon.maxUses ?? null,
          target_category: newCoupon.targetCategory,
          is_active: newCoupon.isActive,
          expires_at: newCoupon.expiresAt ?? null,
        }])
        .select('*')
        .single();
      if (error || !data) {
        return error?.code === '23505' ? 'Ya existe un cupón con ese código.' : (error?.message || 'No se pudo guardar el cupón.');
      }
      setCoupons(prev => [mapCouponFromDb(data), ...prev]);
      return null;
    }

    setCoupons(prev => [newCoupon, ...prev]);
    return null;
  };

  const deleteCoupon = async (id: string): Promise<string | null> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('coupons').delete().eq('id', id).select('id');
      if (error || !data || data.length === 0) return error?.message || 'No se pudo eliminar el cupón (sin permisos).';
    }
    setCoupons(prev => prev.filter(c => c.id !== id));
    return null;
  };

  const toggleCouponActive = async (id: string): Promise<string | null> => {
    const current = coupons.find(c => c.id === id);
    if (!current) return 'Cupón no encontrado.';

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('coupons').update({ is_active: !current.isActive }).eq('id', id).select('id');
      if (error || !data || data.length === 0) return error?.message || 'No se pudo actualizar el cupón (sin permisos).';
    }
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
    return null;
  };

  // Devuelve false si la base no pudo guardar los cambios (sin permisos, sin conexión, etc.)
  const updateSettings = async (newSettings: Partial<StoreSettings>): Promise<boolean> => {
    setSettings(prev => ({ ...prev, ...newSettings }));

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('store_settings')
        .update(settingsToDb(newSettings))
        .eq('id', 1)
        .select('id');
      if (error || !data || data.length === 0) {
        console.error('No se pudieron guardar los ajustes:', error?.message || 'sin permisos');
        return false;
      }
    }
    return true;
  };

  // Auth & Profile
  // El proveedor debe estar habilitado en Supabase (Authentication > Sign In / Providers). Ver docs/login-google.md
  const loginWithSocial = async (provider: 'google'): Promise<string | null> => {
    if (!isSupabaseConfigured || !supabase) {
      return 'El ingreso con Google no está disponible en modo demostración.';
    }
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
    if (error) {
      console.warn('Supabase social login error:', error.message);
      return 'No pudimos iniciar el ingreso con Google. Intentá nuevamente.';
    }
    return null; // el navegador se redirige a Google
  };

  const registerUser = async (data: {
    fullName: string;
    email: string;
    password?: string;
    phone: string;
    postalCode?: string;
    street?: string;
    city?: string;
    province?: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = data.email.toLowerCase().trim();
    
    // 1. Check local users
    const existingLocal = registeredUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingLocal) {
      return { success: false, message: 'Ya existe una cuenta registrada con este correo electrónico. Por favor iniciá sesión.' };
    }

    // 2. Check Supabase profiles table directly
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: existingDb, error: checkError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (!checkError && existingDb) {
          return { success: false, message: 'Ya existe una cuenta registrada con este correo electrónico. Por favor iniciá sesión.' };
        }
      } catch (err) {
        console.warn('Error checking existing user in DB:', err);
      }
    }

    let userId = generateUUID();

    if (isSupabaseConfigured && supabase) {
      if (!data.password || data.password.length < 6) {
        return { success: false, message: 'La contraseña debe tener al menos 6 caracteres.' };
      }
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName.trim(),
              phone: data.phone.trim(),
            }
          }
        });
        if (authError) {
          const msg = authError.message.toLowerCase();
          return {
            success: false,
            message: msg.includes('already') || msg.includes('registered')
              ? 'Ya existe una cuenta registrada con este correo electrónico. Por favor iniciá sesión.'
              : 'No pudimos crear tu cuenta. Revisá los datos e intentá nuevamente.',
          };
        }
        if (!authData.user || !authData.session) {
          // Supabase exige confirmar el correo antes de iniciar sesión: el perfil se completa en el primer ingreso.
          return {
            success: false,
            message: 'Te enviamos un correo para confirmar tu cuenta. Confirmalo y luego iniciá sesión.',
          };
        }
        userId = authData.user.id;
      } catch (e) {
        console.warn('Supabase auth signup error:', e);
        return { success: false, message: 'No pudimos crear tu cuenta. Intentá nuevamente en unos minutos.' };
      }
    }

    const newUser: UserProfile = {
      id: userId,
      email: cleanEmail,
      fullName: data.fullName.trim(),
      phone: data.phone.trim(),
      address: {
        street: (data.street || '').trim(),
        city: (data.city || 'Comodoro Rivadavia').trim(),
        province: (data.province || 'Chubut').trim(),
        postalCode: (data.postalCode || '9000').trim(),
      },
      avatarUrl: '', // No generic image
      createdAt: new Date().toISOString(),
      provider: 'email',
      isAdmin: false,
    };

    setCurrentUser(newUser);
    setRegisteredUsers(prev => [newUser, ...prev.filter(u => u.email.toLowerCase() !== cleanEmail)]);

    if (isSupabaseConfigured && supabase) {
      try {
        const dbProfile = mapProfileToDb(newUser);
        const { error: upsertError } = await supabase.from('profiles').upsert([dbProfile]);
        if (upsertError) {
          console.error('Supabase profile upsert error:', upsertError.message);
        }
      } catch (err) {
        console.error('Supabase profile upsert exception:', err);
      }
    }

    setIsAuthModalOpen(false);
    return { success: true };
  };

  const loginWithEmail = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      return { success: false, message: 'Por favor ingresá tu correo electrónico.' };
    }

    if (!password) {
      return { success: false, message: 'Por favor ingresá tu contraseña.' };
    }

    // Con Supabase configurado, la única forma de ingresar es una sesión real de Supabase Auth.
    // El rol de administradora (is_admin) se lee del perfil en la base y se asigna solo desde el panel de Supabase.
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (authErr || !authData.user) {
          const msg = (authErr?.message || '').toLowerCase();
          return {
            success: false,
            message: msg.includes('confirm')
              ? 'Tenés que confirmar tu correo electrónico antes de ingresar.'
              : 'Correo o contraseña incorrectos.',
          };
        }

        const mapped = await resolveProfile(supabase, authData.user);

        setCurrentUser(mapped);
        setRegisteredUsers(prev => [mapped, ...prev.filter(u => u.email.toLowerCase() !== cleanEmail)]);
        setIsAuthModalOpen(false);
        return { success: true };
      } catch (err) {
        console.warn('Supabase sign in error:', err);
        return { success: false, message: 'No pudimos iniciar sesión. Intentá nuevamente en unos minutos.' };
      }
    }

    // Modo demostración (sin Supabase configurado): solo cuentas locales, sin acceso de administradora.
    const user = registeredUsers.find(u => u.email.toLowerCase() === cleanEmail && !u.isAdmin);
    if (user) {
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      return { success: true };
    }

    return {
      success: false,
      message: 'No encontramos ninguna cuenta registrada con este correo electrónico. Por favor hacé clic en "Crear cuenta".'
    };
  };

  // Envía el enlace para elegir una contraseña nueva. Por privacidad responde igual exista o no la cuenta.
  const requestPasswordReset = async (email: string): Promise<string | null> => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) return 'Por favor ingresá tu correo electrónico.';
    if (!isSupabaseConfigured || !supabase) return 'La recuperación de contraseña no está disponible en modo demostración.';

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: window.location.origin });
    if (error) {
      console.warn('No se pudo enviar el enlace de recuperación:', error.status, error.message);
      return error.status === 429
        ? 'Ya pediste un enlace hace instantes. Esperá un minuto y volvé a intentar.'
        : 'No pudimos enviar el correo. Intentá nuevamente en unos minutos.';
    }
    return null;
  };

  // Guarda la contraseña nueva. Funciona con la sesión temporal que abre el enlace del correo.
  const updatePassword = async (newPassword: string): Promise<string | null> => {
    if (!isSupabaseConfigured || !supabase) return 'No disponible en modo demostración.';
    if (newPassword.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      console.warn('No se pudo cambiar la contraseña:', error.status, error.message);
      const msg = error.message.toLowerCase();
      if (msg.includes('different') || msg.includes('same')) return 'La contraseña nueva tiene que ser distinta de la anterior.';
      if (msg.includes('session')) return 'El enlace venció. Pedí uno nuevo desde "¿Olvidaste tu contraseña?".';
      return 'No pudimos cambiar la contraseña. Intentá nuevamente.';
    }
    return null;
  };

  const closePasswordRecovery = () => setIsPasswordRecovery(false);

  const logout = () => {
    setCurrentUser(null);
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut();
    }
  };

  const updateUserProfile = async (profileData: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...profileData };
    setCurrentUser(updated);
    setRegisteredUsers(prev => prev.map(u => u.id === updated.id ? updated : u));

    if (isSupabaseConfigured && supabase) {
      try {
        const dbProfile = mapProfileToDb(updated);
        await supabase.from('profiles').upsert([dbProfile]);
      } catch (err) {
        console.error('Error updating profile in Supabase:', err);
      }
    }
  };

  // Wishlist
  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        selectedCategory,
        setSelectedCategory: handleSetCategory,
        selectedSubcategory,
        setSelectedSubcategory,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductStock,
        isProductModalOpen,
        editingProduct,
        openCreateProductModal,
        openEditProductModal,
        closeProductModal,
        addCategory,
        updateCategory,
        deleteCategory,
        addSubcategory,
        deleteSubcategory,
        currentView,
        setCurrentView: handleSetCurrentView,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        cartDiscount,
        isVolumeDiscountApplied,
        cartTotal,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        checkoutViaWhatsApp,
        orders,
        updateOrderStatus,
        refreshOrders,
        coupons,
        addCoupon,
        deleteCoupon,
        toggleCouponActive,
        settings,
        updateSettings,
        currentUser,
        registeredUsers,
        loginWithSocial,
        loginWithEmail,
        registerUser,
        logout,
        requestPasswordReset,
        updatePassword,
        isPasswordRecovery,
        closePasswordRecovery,
        authNotice,
        setAuthNotice,
        updateUserProfile,
        isCartOpen,
        setIsCartOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isProfileModalOpen,
        setIsProfileModalOpen,
        isLocationModalOpen,
        setIsLocationModalOpen,
        isSearchOpen,
        setIsSearchOpen,
        activeInfoModal,
        setActiveInfoModal,
        selectedProductForDetail,
        setSelectedProductForDetail,
        wishlist,
        isWishlistOpen,
        setIsWishlistOpen,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

// oxlint-disable-next-line react/only-export-components -- el hook y su proveedor van juntos a propósito
export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

