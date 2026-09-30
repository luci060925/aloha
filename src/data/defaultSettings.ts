import type { StoreSettings } from '../types';

// Valores por defecto de los ajustes de la tienda: base de todo lo que no viene de la tabla store_settings.

export const DEFAULT_SETTINGS: StoreSettings = {
  whatsappNumber: '5492974201122',
  storeName: 'Aloha Indumentaria',
  address: '25 de Mayo 903, Oficina 3',
  city: 'Comodoro Rivadavia',
  province: 'Chubut, Argentina',
  openingHours: 'Lunes a Sábados de 15:00 a 20:00 hs',
  announcementText: '✨ NUEVA COLECCIÓN • ENVÍOS A TODO EL PAÍS • ASESORAMIENTO PERSONALIZADO',
  instagramUrl: 'https://instagram.com/aloha.indumentaria_cr',
  instagramHandle: 'aloha.indumentaria_cr',
  facebookUrl: 'https://www.facebook.com/share/1DkPR93ziX/',
  tiktokUrl: 'https://www.tiktok.com/@aloha.indumentaria_',
  
  // Hero Defaults
  heroBadgeText: 'Nueva Colección 2026',
  heroTitle: 'Elegancia & Estilo',
  heroSubtitle: 'Prendas esenciales y diseño contemporáneo pensados para acompañar tu día a día con distinción.',
  heroImageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2000',
  showroomImageUrl: '',
};
