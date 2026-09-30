import type { Product, Category, Coupon } from '../types';

// Datos de DEMOSTRACIÓN: se usan solo cuando el sitio corre sin Supabase (sin variables de entorno).
// Con Supabase configurado, el catálogo, las categorías y los cupones salen de la base.

export const DEMO_CATEGORIES: Category[] = [
  {
    id: 'cat-all',
    name: 'Todos',
    slug: 'all',
    order: 0,
  },
  {
    id: 'cat-pantalones',
    name: 'Pantalones',
    slug: 'pantalones',
    description: 'Sastrería contemporánea, calzas modeladoras, joggers y denim.',
    image: 'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&q=80&w=800',
    order: 1,
    subcategories: [
      { id: 'sub-sastreros', name: 'Sastreros', slug: 'sastreros' },
      { id: 'sub-calzas', name: 'Calzas', slug: 'calzas' },
      { id: 'sub-joggers', name: 'Joggers / Jogging', slug: 'joggers' },
      { id: 'sub-jeans', name: 'Jeans & Denim', slug: 'jeans' },
    ],
  },
  {
    id: 'cat-tops',
    name: 'Tops & Remeras',
    slug: 'tops-remeras',
    description: 'Corsets estructurados, halters, algodón pima y siluetas modernas.',
    image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800',
    order: 2,
    subcategories: [
      { id: 'sub-corsets', name: 'Corsets', slug: 'corsets' },
      { id: 'sub-halters', name: 'Halters', slug: 'halters' },
      { id: 'sub-manga-corta', name: 'Manga Corta', slug: 'manga-corta' },
      { id: 'sub-musculosas', name: 'Musculosas', slug: 'musculosas' },
      { id: 'sub-bodys', name: 'Bodys', slug: 'bodys' },
    ],
  },
  {
    id: 'cat-vestidos',
    name: 'Vestidos',
    slug: 'vestidos',
    description: 'Siluetas arquitectónicas para noche, eventos o uso diario.',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800',
    order: 3,
    subcategories: [
      { id: 'sub-fiesta', name: 'Fiesta / Noche', slug: 'fiesta' },
      { id: 'sub-casual', name: 'Casual', slug: 'casual' },
      { id: 'sub-lenceros', name: 'Lenceros', slug: 'lenceros' },
    ],
  },
  {
    id: 'cat-abrigos',
    name: 'Abrigos & Blazers',
    slug: 'abrigos-blazers',
    description: 'Blazers sastreros oversize, tapados y camperas estructuradas.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800',
    order: 4,
    subcategories: [
      { id: 'sub-blazers', name: 'Blazers', slug: 'blazers' },
      { id: 'sub-tapados', name: 'Tapados', slug: 'tapados' },
      { id: 'sub-camperas', name: 'Camperas', slug: 'camperas' },
    ],
  },
  {
    id: 'cat-accesorios',
    name: 'Accesorios',
    slug: 'accesorios',
    description: 'Cinturones de cuero genuino, bolsos y complementos de autor.',
    image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&q=80&w=800',
    order: 5,
    subcategories: [
      { id: 'sub-cintos', name: 'Cintos de Cuero', slug: 'cintos' },
      { id: 'sub-bolsos', name: 'Bolsos & Carteras', slug: 'bolsos' },
      { id: 'sub-joyeria', name: 'Joyería Minimal', slug: 'joyeria' },
    ],
  }
];

export const DEMO_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Pantalón Sastrero Palazzo Noir',
    slug: 'pantalon-sastrero-palazzo-noir',
    description: 'Pantalón de tiro alto con pinzas pronunciadas, bolsillos laterales y caída impecable en creppe sastrero premium.',
    price: 59000,
    originalPrice: 65000,
    category: 'pantalones',
    subcategory: 'sastreros',
    images: [
      'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?auto=format&fit=crop&q=80&w=1000',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Negro Ébano', hex: '#0a0a0a' },
      { name: 'Blanco Hueso', hex: '#fdfbf7' },
      { name: 'Gris Carbón', hex: '#374151' }
    ],
    inStock: true,
    featured: true,
    isNewArrival: true,
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'prod-2',
    name: 'Top Corset Estructurado Noir',
    slug: 'top-corset-estructurado-noir',
    description: 'Corset moderno con ballenas flexibles internas que afinan la silueta con total comodidad. Escote recto con terminación de alta costura.',
    price: 32000,
    category: 'tops-remeras',
    subcategory: 'corsets',
    images: [
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1000',
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [
      { name: 'Negro Ébano', hex: '#0a0a0a' },
      { name: 'Blanco Puro', hex: '#ffffff' }
    ],
    inStock: true,
    featured: true,
    isNewArrival: true,
    createdAt: '2026-03-02T11:00:00Z',
  },
  {
    id: 'prod-3',
    name: 'Top Asimétrico Halter Luxe',
    slug: 'top-asimetrico-halter-luxe',
    description: 'Top minimalista con escote unihombro y espalda descubierta. Tejido doble faz con textura suave que modela sutilmente la figura.',
    price: 28900,
    originalPrice: 32000,
    category: 'tops-remeras',
    subcategory: 'halters',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=1000',
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [
      { name: 'Negro Ébano', hex: '#0a0a0a' },
      { name: 'Blanco Crudo', hex: '#f8f8f6' }
    ],
    inStock: true,
    featured: true,
    isNewArrival: true,
    createdAt: '2026-03-03T12:00:00Z',
  },
  {
    id: 'prod-4',
    name: 'Blazer Oversize Sastrería Atenas',
    slug: 'blazer-oversize-sastreria-atenas',
    description: 'Blazer de corte masculino estructurado con hombreras marcadas, solapas anchas en punta y botones forrados al tono.',
    price: 94000,
    originalPrice: 105000,
    category: 'abrigos-blazers',
    subcategory: 'blazers',
    images: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1000',
    ],
    sizes: ['S', 'M', 'L'],
    colors: [
      { name: 'Negro Absoluto', hex: '#000000' },
      { name: 'Blanco Nieve', hex: '#fafafa' }
    ],
    inStock: true,
    featured: true,
    isNewArrival: true,
    createdAt: '2026-03-04T13:00:00Z',
  },
  {
    id: 'prod-5',
    name: 'Calza Seamless Ribbed High-Rise',
    slug: 'calza-seamless-ribbed-high-rise',
    description: 'Calza anatómica sin costuras con pretina ancha de alta compresión y textura acanalada ultra suave.',
    price: 38000,
    category: 'pantalones',
    subcategory: 'calzas',
    images: [
      'https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1584370848010-d7fe6bc767ec?auto=format&fit=crop&q=80&w=1000',
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [
      { name: 'Negro Ébano', hex: '#0a0a0a' },
      { name: 'Gris Carbón', hex: '#374151' }
    ],
    inStock: true,
    featured: false,
    isNewArrival: true,
    createdAt: '2026-03-05T14:00:00Z',
  },
  {
    id: 'prod-6',
    name: 'Remera Pima Noir Oversize',
    slug: 'remera-pima-noir-oversize',
    description: '100% algodón pima peinado con tacto sedoso y caída pesada. Cuello cerrado acanalado de alta costura.',
    price: 34500,
    category: 'tops-remeras',
    subcategory: 'manga-corta',
    images: [
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=1000',
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: [
      { name: 'Negro Ébano', hex: '#0a0a0a' },
      { name: 'Blanco Puro', hex: '#ffffff' }
    ],
    inStock: true,
    featured: true,
    isNewArrival: true,
    createdAt: '2026-03-06T15:00:00Z',
  },
  {
    id: 'prod-7',
    name: 'Vestido Midi Minimal Column Gala',
    slug: 'vestido-midi-minimal-column-gala',
    description: 'Vestido recto corte columna de largo midi con abertura lateral sutil. Silueta refinada inspirada en los noventa.',
    price: 68500,
    originalPrice: 75000,
    category: 'vestidos',
    subcategory: 'fiesta',
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1000',
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: [
      { name: 'Negro Profundo', hex: '#050505' },
      { name: 'Gris Humo', hex: '#6b7280' }
    ],
    inStock: true,
    featured: true,
    isNewArrival: true,
    createdAt: '2026-03-07T16:00:00Z',
  },
  {
    id: 'prod-8',
    name: 'Cinturón Piel Hebilla Plata Minimal',
    slug: 'cinturon-piel-hebilla-plata-minimal',
    description: '100% cuero vacuno graneado con hebilla geométrica de líneas depuradas. Ancho versátil de 2.5 cm.',
    price: 21500,
    category: 'accesorios',
    subcategory: 'cintos',
    images: [
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&q=80&w=1000',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=1000',
    ],
    sizes: ['Talle Único (Ajustable)'],
    colors: [
      { name: 'Negro Cuero', hex: '#111111' },
      { name: 'Blanco Tiza', hex: '#f4f4f5' }
    ],
    inStock: true,
    featured: false,
    isNewArrival: false,
    createdAt: '2026-03-08T17:00:00Z',
  }
];

export const DEMO_COUPONS: Coupon[] = [
  {
    id: 'coup-1',
    code: 'ALOHA10',
    discountPercentage: 10,
    targetCategory: 'all',
    maxUses: 50,
    usedCount: 14,
    isActive: true,
    expiresAt: '2027-12-31T23:59:59Z',
  },
  {
    id: 'coup-2',
    code: 'BIENVENIDA15',
    discountPercentage: 15,
    targetCategory: 'all',
    maxUses: 20,
    usedCount: 6,
    isActive: true,
    expiresAt: '2027-12-31T23:59:59Z',
  },
  {
    id: 'coup-3',
    code: 'PANTALONES20',
    discountPercentage: 20,
    targetCategory: 'pantalones',
    maxUses: 25,
    usedCount: 5,
    isActive: true,
    expiresAt: '2027-12-31T23:59:59Z',
  },
  {
    id: 'coup-4',
    code: 'VESTIDOSVIP',
    discountPercentage: 25,
    targetCategory: 'vestidos',
    maxUses: 15,
    usedCount: 3,
    isActive: true,
    expiresAt: '2027-12-31T23:59:59Z',
  }
];
