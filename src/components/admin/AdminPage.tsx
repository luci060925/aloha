import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../context/StoreContext';
import type { StoreSettings, OrderRecord } from '../../types';
import { BrandLogo } from '../common/BrandLogo';
import { fileToDataUrl, uploadCatalogImage } from '../../lib/images';
import { slugify } from '../../lib/slug';
import { isHttpUrl, isTrustedAvatarUrl } from '../../lib/external';
import {
  Users, 
  MessageSquare, 
  Sliders, 
  Tag, 
  Settings, 
  ArrowLeft, 
  DollarSign, 
  Search, 
  Trash2, 
  CheckCircle2, 
  X,
  Layers,
  PhoneCall,
  Menu,
  Percent,
  Package,
  ExternalLink,
  MapPin,
  Clock,
  Eye,
  Upload,
  Sparkles,
  RefreshCw,
  Plus
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const {
    setCurrentView,
    registeredUsers,
    currentUser,
    orders,
    refreshOrders,
    categories,
    coupons,
    settings,
    updateOrderStatus,
    addCategory,
    deleteCategory,
    addSubcategory,
    deleteSubcategory,
    addCoupon,
    deleteCoupon,
    toggleCouponActive,
    updateSettings,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'metrics' | 'orders' | 'categories' | 'promotions' | 'settings'>('settings');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Category & Subcategory Form States
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [selectedCatForSub, setSelectedCatForSub] = useState<string>('');
  const [newSubName, setNewSubName] = useState('');

  // Unified 4-Type Discount Form State
  const [discountType, setDiscountType] = useState<'volume' | 'price' | 'global' | 'category'>('volume');
  const [discountMode, setDiscountMode] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(15);
  const [discountConditionItems, setDiscountConditionItems] = useState<number>(3);
  const [discountConditionPrice, setDiscountConditionPrice] = useState<number>(80000);
  const [discountConditionCategory, setDiscountConditionCategory] = useState<string>('all');
  const [discountMaxUsers, setDiscountMaxUsers] = useState<string>('');
  const [discountCode, setDiscountCode] = useState<string>('');
  const [discountFormSuccess, setDiscountFormSuccess] = useState<boolean>(false);
  const [discountFormError, setDiscountFormError] = useState('');

  // Settings State
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(settings);
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);

  // Hero Image Upload Ref & Handler
  const heroFileInputRef = React.useRef<HTMLInputElement>(null);
  const showroomFileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState<'hero' | 'showroom' | null>(null);
  const uploadingHero = uploadingImage === 'hero';
  const uploadingShowroom = uploadingImage === 'showroom';
  const [saveSettingsError, setSaveSettingsError] = useState('');

  // Sube la foto de la portada ('hero') o del showroom a Storage y deja su URL en el formulario (se publica con "Guardar Ajustes")
  const handleSettingsImageUpload = (kind: 'hero' | 'showroom') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const input = kind === 'hero' ? heroFileInputRef.current : showroomFileInputRef.current;
    if (input) input.value = '';
    if (!file) return;

    setUploadingImage(kind);
    setSaveSettingsError('');
    try {
      const dataUrl = await fileToDataUrl(file);
      const url = await uploadCatalogImage(dataUrl, kind, kind === 'hero' ? 2000 : 1600);
      setSettingsForm(prev => (kind === 'hero' ? { ...prev, heroImageUrl: url } : { ...prev, showroomImageUrl: url }));
    } catch (err) {
      setSaveSettingsError(err instanceof Error ? `No se pudo subir la foto: ${err.message}` : 'No se pudo subir la foto.');
    } finally {
      setUploadingImage(null);
    }
  };

  // Sync settingsForm if store settings change
  React.useEffect(() => {
    // El formulario es un borrador editable que se reinicia cuando llegan ajustes nuevos desde la base
    // oxlint-disable-next-line react/set-state-in-effect
    setSettingsForm(settings);
  }, [settings]);

  // Orders Filter & Inspect State
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrderForInspect, setSelectedOrderForInspect] = useState<OrderRecord | null>(null);

  // El detalle del pedido se cierra con la tecla Esc
  React.useEffect(() => {
    if (!selectedOrderForInspect) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedOrderForInspect(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedOrderForInspect]);

  // Los pedidos viejos pueden traer la dirección vacía (", ()"): sin letras ni números se muestra "No indicada"
  const formatLocation = (location?: string) =>
    location && /[\p{L}\p{N}]/u.test(location) ? location : 'No indicada';

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount).replace('ARS', '$').trim();
  };

  // Metrics
  const totalRevenue = orders.reduce((sum, ord) => (ord.status === 'cancelled' ? sum : sum + ord.total), 0);
  const adminName = currentUser?.fullName || 'Administradora';
  const adminInitials = adminName.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');

  const handleChangeOrderStatus = async (orderId: string, status: string) => {
    const ok = await updateOrderStatus(orderId, status as OrderRecord['status']);
    if (!ok) alert('No se pudo actualizar el estado del pedido. Revisá tu conexión y que tu cuenta sea de administradora.');
  };

  // Al abrir la pestaña de pedidos se trae la lista actualizada desde la base
  React.useEffect(() => {
    if (activeTab === 'orders') refreshOrders();
  }, [activeTab, refreshOrders]);
  const totalUsersCount = registeredUsers.length;
  const totalOrdersCount = orders.length;

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const slug = slugify(newCatSlug.trim() || newCatName);
    const nextOrder = categories.reduce((max, c) => Math.max(max, c.order), 0) + 1;
    const error = await addCategory({
      name: newCatName.trim(),
      slug,
      description: newCatDesc.trim(),
      order: nextOrder,
      subcategories: [],
    });
    if (error) {
      alert(error);
      return;
    }
    const createdName = newCatName.trim();
    setNewCatName('');
    setNewCatSlug('');
    setNewCatDesc('');
    alert(`Categoría "${createdName}" creada con éxito.`);
  };

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatForSub || !newSubName.trim()) return;
    const error = await addSubcategory(selectedCatForSub, newSubName);
    if (error) {
      alert(error);
      return;
    }
    setNewSubName('');
    alert(`Subcategoría agregada con éxito.`);
  };

  const handleQuickTogglePromo = (type: 'volume' | 'price' | 'global') => {
    const updated = { ...settingsForm };
    if (type === 'volume') updated.volumeDiscountActive = !updated.volumeDiscountActive;
    if (type === 'price') updated.priceDiscountActive = !updated.priceDiscountActive;
    if (type === 'global') updated.globalDiscountActive = !updated.globalDiscountActive;
    
    setSettingsForm(updated);
    updateSettings(updated);
  };

  const handleCreateOrApplyDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountFormError('');
    const maxUses = discountMaxUsers && Number(discountMaxUsers) > 0 ? Number(discountMaxUsers) : undefined;
    const isFixed = discountMode === 'fixed';
    const isPerc = discountMode === 'percentage';
    const val = Number(discountValue) || 10;

    // Los descuentos automáticos (cantidad, monto, global) no admiten límite de personas ni valor fijo:
    // en ese caso la condición se perdería y el cupón valdría para cualquier compra.
    if (discountType !== 'category' && (maxUses || isFixed)) {
      setDiscountFormError('Los descuentos por cantidad, por monto o globales solo admiten porcentaje y sin límite de personas. Para un cupón con límite o de valor fijo elegí "Por Categoría Específica" y "Todas las categorías".');
      return;
    }

    if (discountType === 'volume' && !maxUses && isPerc) {
      const updated = {
        ...settingsForm,
        volumeDiscountActive: true,
        volumeDiscountMinItems: Number(discountConditionItems) || 3,
        volumeDiscountPercentage: val,
      };
      setSettingsForm(updated);
      updateSettings(updated);
    } else if (discountType === 'price' && !maxUses && isPerc) {
      const updated = {
        ...settingsForm,
        priceDiscountActive: true,
        priceDiscountMinAmount: Number(discountConditionPrice) || 80000,
        priceDiscountPercentage: val,
      };
      setSettingsForm(updated);
      updateSettings(updated);
    } else if (discountType === 'global' && !maxUses && isPerc) {
      const updated = {
        ...settingsForm,
        globalDiscountActive: true,
        globalDiscountPercentage: val,
      };
      setSettingsForm(updated);
      updateSettings(updated);
    } else {
      // Create as trackable custom promo with category/volume/price target or capped uses
      const defaultCode = discountType === 'category' 
        ? `ALOHA-${(discountConditionCategory || 'CAT').toUpperCase()}-${val}${isPerc ? 'PCT' : 'OFF'}`
        : `PROMO-${discountType.toUpperCase()}-${val}${isPerc ? 'PCT' : 'OFF'}`;
      
      const code = (discountCode.trim() || defaultCode).toUpperCase().replace(/\s+/g, '-');
      const couponError = await addCoupon({
        code,
        discountPercentage: isPerc ? val : 0,
        fixedDiscount: isFixed ? val : undefined,
        maxUses,
        targetCategory: discountType === 'category' ? discountConditionCategory : 'all',
        isActive: true,
      });
      if (couponError) {
        setDiscountFormError(couponError);
        return;
      }
    }

    setDiscountFormSuccess(true);
    setDiscountCode('');
    setDiscountMaxUsers('');
    setTimeout(() => setDiscountFormSuccess(false), 3500);
  };

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSettingsError('');
    // Los enlaces a redes se publican en el sitio: solo se aceptan direcciones http(s) completas
    const badLink = ([
      ['Instagram', settingsForm.instagramUrl],
      ['Facebook', settingsForm.facebookUrl],
      ['TikTok', settingsForm.tiktokUrl],
    ] as const).find(([, url]) => url.trim() !== '' && !isHttpUrl(url));
    if (badLink) {
      setSaveSettingsError(`El enlace de ${badLink[0]} no es válido: tiene que empezar con https://`);
      return;
    }
    const saved = await updateSettings(settingsForm);
    if (!saved) {
      setSaveSettingsError('No se pudieron guardar los ajustes en la base. Revisá tu conexión y que tu cuenta sea de administradora.');
      return;
    }
    setSaveSettingsSuccess(true);
    setTimeout(() => setSaveSettingsSuccess(false), 3000);
  };

  const filteredOrders = orders.filter(o => {
    if (!orderSearch.trim()) return true;
    const q = orderSearch.toLowerCase();
    return o.id.toLowerCase().includes(q) || 
           o.customerName.toLowerCase().includes(q) || 
           o.customerLocation?.toLowerCase().includes(q) ||
           o.customerPhone?.toLowerCase().includes(q);
  });

  const activePromosCount = 
    (settings.volumeDiscountActive ? 1 : 0) +
    (settings.priceDiscountActive ? 1 : 0) +
    (settings.globalDiscountActive ? 1 : 0) +
    coupons.filter(c => c.isActive).length;

  const navItems: { id: typeof activeTab; label: string; icon: React.ElementType; badge: string | number | null }[] = [
    {
      id: 'settings',
      label: 'Ajustes de Tienda & Portada',
      icon: Settings,
      badge: null,
    },
    {
      id: 'promotions',
      label: 'Descuentos & Promociones',
      icon: Tag,
      badge: activePromosCount > 0 ? `${activePromosCount} activas` : '0',
    },
    {
      id: 'orders',
      label: 'Pedidos WhatsApp',
      icon: MessageSquare,
      badge: totalOrdersCount,
    },
    {
      id: 'categories',
      label: 'Categorías & Subcategorías',
      icon: Sliders,
      badge: categories.length,
    },
    {
      id: 'metrics',
      label: 'Métricas & Clientas',
      icon: Users,
      badge: totalUsersCount,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col md:flex-row antialiased selection:bg-white selection:text-black">
      
      {/* MOBILE TOP BAR */}
      <div className="md:hidden bg-[#101010] text-white px-5 py-3.5 flex items-center justify-between sticky top-0 z-40 border-b border-neutral-800 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 -ml-2 hover:bg-neutral-800 rounded-lg text-white cursor-pointer transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <BrandLogo variant="light" className="h-6" showSubtitle={false} />
        </div>

        <button
          onClick={() => setCurrentView('shop')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-xs font-semibold uppercase tracking-wider text-white cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Ver Tienda</span>
        </button>
      </div>

      {/* SIDEBAR NAVIGATION (DARK LUXURY) */}
      <aside 
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-50 w-72 bg-[#101010] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-neutral-800 shadow-2xl md:shadow-none h-screen shrink-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header */}
        <div className="p-6 border-b border-neutral-800 relative">
          <div className="flex items-center justify-center text-center">
            <BrandLogo variant="light" className="h-9 w-auto mx-auto" />
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden absolute top-6 right-6 p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Badge */}
          <div className="mt-5 pt-4 border-t border-neutral-800 flex items-center gap-3 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800">
            <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs shadow-xs shrink-0 font-serif">
              {adminInitials || 'A'}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">{adminName}</span>
              <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Administradora
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          <p className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500 font-bold">
            Módulos del Panel
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs tracking-wide transition-all cursor-pointer text-left group ${
                  isActive
                    ? 'bg-white text-black font-bold shadow-md'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive ? 'bg-black text-white' : 'bg-neutral-900 text-neutral-400 group-hover:text-white'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="block truncate font-semibold">{item.label}</span>
                  </div>
                </div>

                {item.badge !== null && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    isActive 
                      ? 'bg-black text-white' 
                      : 'bg-neutral-900 text-neutral-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Bar in Sidebar */}
        <div className="p-4 border-t border-neutral-800 space-y-3 bg-[#0d0d0d]">
          <div className="text-[11px] font-mono text-neutral-400 bg-neutral-900/50 p-3 rounded-xl border border-neutral-800 space-y-1">
            <div className="flex items-center gap-1.5 text-white font-bold">
              <MapPin className="w-3.5 h-3.5 text-neutral-300" />
              <span>Showroom Aloha</span>
            </div>
            <p className="text-[10px] text-neutral-400 pl-5">{settings.address}, Comodoro Rivadavia</p>
          </div>

          <button
            onClick={() => setCurrentView('shop')}
            className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white text-xs uppercase tracking-wider font-bold rounded-xl flex items-center justify-center gap-2 border border-neutral-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Tienda</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-h-screen flex flex-col overflow-y-auto bg-[#0a0a0a]">
        
        {/* TOP STATUS HEADER BAR */}
        <header className="bg-[#121212] border-b border-neutral-800 px-6 sm:px-10 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30 shadow-md">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-neutral-500">
              <span>Aloha Admin</span>
              <span>/</span>
              <span className="text-white font-bold">
                {navItems.find(i => i.id === activeTab)?.label}
              </span>
            </div>
            <h1 className="font-serif text-2xl font-bold text-white mt-0.5">
              {navItems.find(i => i.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-bold rounded-full font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Modo Administradora Activo</span>
            </div>

            <button
              onClick={() => setCurrentView('shop')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <span>Ver Catálogo Online</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* CONTENT CONTAINER */}
        <div className="flex-1 p-6 sm:p-10 max-w-7xl w-full mx-auto space-y-8">
          
          {/* TAB 1: AJUSTES DE TIENDA & HERO BANNER */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <p className="text-xs text-neutral-400 font-medium">
                  Configurá el número oficial receptor de WhatsApp, la marquesina superior y la portada de la tienda con vista previa en tiempo real.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* FORMULARIO DE AJUSTES */}
                <div className="lg:col-span-7 bg-[#121212] border border-neutral-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
                  
                  <form onSubmit={handleSaveStoreSettings} className="space-y-6">
                    
                    {/* Sección WhatsApp */}
                    <div className="space-y-2">
                      <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300">
                        Número de WhatsApp Receptor (Pedidos y Consultas)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                          <PhoneCall className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={settingsForm.whatsappNumber}
                          onChange={(e) => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                          placeholder="5492974201122"
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-neutral-900 border border-neutral-750 rounded-xl font-mono font-bold text-white focus:outline-none focus:border-white transition-colors"
                        />
                      </div>
                      <p className="text-[11px] text-neutral-500 font-mono">
                        Formato: código de país + código de área + número (ej: <strong>5492974201122</strong>).
                      </p>
                    </div>

                    {/* Sección Marquesina */}
                    <div className="space-y-2 pt-2 border-t border-neutral-800">
                      <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300">
                        Texto de la Marquesina Superior (Barra de Anuncios)
                      </label>
                      <input
                        type="text"
                        value={settingsForm.announcementText}
                        onChange={(e) => setSettingsForm({ ...settingsForm, announcementText: e.target.value })}
                        placeholder="✨ NUEVA TEMPORADA • 25 DE MAYO 903, PISO 3, COMODORO RIVADAVIA..."
                        className="w-full px-4 py-2.5 text-sm bg-neutral-900 border border-neutral-750 rounded-xl font-medium text-white focus:outline-none focus:border-white transition-colors"
                      />
                    </div>

                    {/* Sección Dirección y Ciudad */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
                      <div className="space-y-2">
                        <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300">
                          Dirección del Showroom
                        </label>
                        <input
                          type="text"
                          value={settingsForm.address}
                          onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                          placeholder="25 de Mayo 903, Piso 3"
                          className="w-full px-4 py-2 text-sm bg-neutral-900 border border-neutral-750 rounded-xl font-medium text-white focus:outline-none focus:border-white transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300">
                          Horarios de Atención
                        </label>
                        <input
                          type="text"
                          value={settingsForm.openingHours}
                          onChange={(e) => setSettingsForm({ ...settingsForm, openingHours: e.target.value })}
                          placeholder="Lunes a Sábados de 15:00 a 20:00 hs"
                          className="w-full px-4 py-2 text-sm bg-neutral-900 border border-neutral-750 rounded-xl font-medium text-white focus:outline-none focus:border-white transition-colors"
                        />
                      </div>
                    </div>

                    {/* FOTO DEL SHOWROOM */}
                    <div className="pt-2 border-t border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs uppercase tracking-wider font-bold text-neutral-300">
                          Foto del Showroom (sección "Vení a conocer nuestro local")
                        </label>
                        {settingsForm.showroomImageUrl && (
                          <button
                            type="button"
                            onClick={() => setSettingsForm(prev => ({ ...prev, showroomImageUrl: '' }))}
                            className="text-[10px] text-neutral-400 hover:text-red-400 font-mono underline flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            Quitar foto
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="w-full sm:w-28 h-16 bg-neutral-950 rounded-lg overflow-hidden border border-neutral-750 shrink-0 flex items-center justify-center">
                          {isHttpUrl(settingsForm.showroomImageUrl) ? (
                            <img src={settingsForm.showroomImageUrl} alt="Foto del showroom" className="w-full h-full object-cover" />
                          ) : (
                            <MapPin className="w-6 h-6 text-neutral-700" aria-hidden="true" />
                          )}
                        </div>

                        <div className="flex-1 w-full space-y-1">
                          <input
                            type="file"
                            accept="image/*"
                            ref={showroomFileInputRef}
                            onChange={handleSettingsImageUpload('showroom')}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => showroomFileInputRef.current?.click()}
                            disabled={uploadingShowroom}
                            className="w-full py-2.5 px-3 bg-neutral-900 border border-neutral-700 hover:border-white rounded-lg text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{uploadingShowroom ? 'Subiendo foto...' : 'Subir Foto del Local'}</span>
                          </button>
                          <p className="text-[10px] text-neutral-500 font-mono">
                            Se muestra en blanco y negro con el cartel de la dirección encima. Sin foto se ve una tarjeta oscura. Recordá tocar "Guardar Ajustes".
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* REDES SOCIALES */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
                      <div className="space-y-2">
                        <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300">
                          Instagram Handle
                        </label>
                        <input
                          type="text"
                          value={settingsForm.instagramHandle}
                          onChange={(e) => setSettingsForm({ ...settingsForm, instagramHandle: e.target.value })}
                          placeholder="aloha.indumentaria_cr"
                          className="w-full px-4 py-2 text-sm bg-neutral-900 border border-neutral-750 rounded-xl font-mono text-white focus:outline-none focus:border-white transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300">
                          Enlace de Instagram
                        </label>
                        <input
                          type="url"
                          value={settingsForm.instagramUrl}
                          onChange={(e) => setSettingsForm({ ...settingsForm, instagramUrl: e.target.value })}
                          placeholder="https://instagram.com/aloha.indumentaria_cr"
                          className="w-full px-4 py-2 text-sm bg-neutral-900 border border-neutral-750 rounded-xl font-mono text-white focus:outline-none focus:border-white transition-colors"
                        />
                      </div>
                    </div>

                    {/* FACEBOOK Y TIKTOK */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800">
                      <div className="space-y-2">
                        <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300">
                          Enlace de Facebook
                        </label>
                        <input
                          type="url"
                          value={settingsForm.facebookUrl}
                          onChange={(e) => setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })}
                          placeholder="https://www.facebook.com/..."
                          className="w-full px-4 py-2 text-sm bg-neutral-900 border border-neutral-750 rounded-xl font-mono text-white focus:outline-none focus:border-white transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300">
                          Enlace de TikTok
                        </label>
                        <input
                          type="url"
                          value={settingsForm.tiktokUrl}
                          onChange={(e) => setSettingsForm({ ...settingsForm, tiktokUrl: e.target.value })}
                          placeholder="https://www.tiktok.com/@..."
                          className="w-full px-4 py-2 text-sm bg-neutral-900 border border-neutral-750 rounded-xl font-mono text-white focus:outline-none focus:border-white transition-colors"
                        />
                      </div>
                    </div>

                    {/* PERSONALIZACIÓN DEL HERO BANNER */}
                    <div className="pt-4 border-t border-neutral-800 space-y-4">
                      <div className="flex items-center gap-2 pb-1 border-b border-neutral-800/80">
                        <Sparkles className="w-4 h-4 text-white" />
                        <h3 className="text-xs uppercase tracking-wider font-bold text-white font-mono">
                          Personalización de la Portada (Hero Banner)
                        </h3>
                      </div>

                      {/* Imagen de Fondo con Subida desde archivo */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs uppercase tracking-wider font-bold text-neutral-300">
                            Foto de Fondo de Portada
                          </label>
                          {settingsForm.heroImageUrl && (
                            <button
                              type="button"
                              onClick={() => setSettingsForm(prev => ({ ...prev, heroImageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2000' }))}
                              className="text-[10px] text-neutral-400 hover:text-white font-mono underline flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Restaurar original
                            </button>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                          <div className="w-full sm:w-28 h-16 bg-neutral-950 rounded-lg overflow-hidden border border-neutral-750 shrink-0 relative">
                            <img
                              src={settingsForm.heroImageUrl || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2000'}
                              alt="Portada"
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="flex-1 w-full space-y-1">
                            <input
                              type="file"
                              accept="image/*"
                              ref={heroFileInputRef}
                              onChange={handleSettingsImageUpload('hero')}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => heroFileInputRef.current?.click()}
                              disabled={uploadingHero}
                              className="w-full py-2.5 px-3 bg-neutral-900 border border-neutral-700 hover:border-white rounded-lg text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{uploadingHero ? 'Subiendo foto...' : 'Subir Foto desde mi PC / Celular'}</span>
                            </button>
                            <p className="text-[10px] text-neutral-500 font-mono">
                              JPG, PNG o WEBP. Se guarda optimizada (WebP). Recordá tocar "Guardar Ajustes" para publicarla.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Insignia / Badge */}
                      <div className="space-y-1">
                        <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300">
                          Texto de la Insignia Superior
                        </label>
                        <input
                          type="text"
                          value={settingsForm.heroBadgeText || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, heroBadgeText: e.target.value })}
                          placeholder="Ej: Nueva Colección 2026"
                          className="w-full px-4 py-2.5 text-sm bg-neutral-900 border border-neutral-750 rounded-xl font-medium text-white focus:outline-none focus:border-white"
                        />
                      </div>

                      {/* Título Principal */}
                      <div className="space-y-1">
                        <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300">
                          Título Principal de la Portada
                        </label>
                        <input
                          type="text"
                          value={settingsForm.heroTitle || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })}
                          placeholder="Ej: Elegancia & Estilo"
                          className="w-full px-4 py-2.5 text-sm bg-neutral-900 border border-neutral-750 rounded-xl font-serif font-bold text-white focus:outline-none focus:border-white"
                        />
                      </div>

                      {/* Subtítulo */}
                      <div className="space-y-1">
                        <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300">
                          Bajada Descriptiva / Subtítulo
                        </label>
                        <textarea
                          rows={2}
                          value={settingsForm.heroSubtitle || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })}
                          placeholder="Ej: Prendas esenciales y diseño contemporáneo pensados para acompañar tu día a día con distinción."
                          className="w-full px-4 py-2 text-sm bg-neutral-900 border border-neutral-750 rounded-xl font-medium text-white focus:outline-none focus:border-white"
                        />
                      </div>

                      {/* Botones */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider font-bold text-neutral-400 mb-1">
                            Texto Botón Catálogo
                          </label>
                          <input
                            type="text"
                            value={settingsForm.heroPrimaryBtnText || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, heroPrimaryBtnText: e.target.value })}
                            placeholder="Ver Catálogo"
                            className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-750 rounded-lg font-bold text-white focus:outline-none focus:border-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] uppercase tracking-wider font-bold text-neutral-400 mb-1">
                            Texto Botón Showroom
                          </label>
                          <input
                            type="text"
                            value={settingsForm.heroSecondaryBtnText || ''}
                            onChange={(e) => setSettingsForm({ ...settingsForm, heroSecondaryBtnText: e.target.value })}
                            placeholder="Ver Showroom"
                            className="w-full px-3 py-2 text-xs bg-neutral-900 border border-neutral-750 rounded-lg font-bold text-white focus:outline-none focus:border-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Botón Guardar */}
                    <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                      {saveSettingsSuccess ? (
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>¡Ajustes guardados correctamente!</span>
                        </div>
                      ) : saveSettingsError ? (
                        <div className="text-red-400 font-bold text-xs">{saveSettingsError}</div>
                      ) : <div />}

                      <button
                        type="submit"
                        className="w-full sm:w-auto px-8 py-3 bg-white hover:bg-neutral-200 text-black text-xs uppercase tracking-[0.2em] font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-black" />
                        <span>Guardar Ajustes</span>
                      </button>
                    </div>

                  </form>
                </div>

                {/* VISTA PREVIA EN TIEMPO REAL */}
                <div className="lg:col-span-5 space-y-5">
                  <div className="bg-[#121212] border border-neutral-800 rounded-2xl shadow-xl p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-white" />
                        <h3 className="text-xs uppercase tracking-wider font-bold text-white font-mono">
                          Vista Previa en Tienda
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded-md">
                        En Tiempo Real
                      </span>
                    </div>

                    {/* Mini Hero Banner */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                        Portada (Hero Banner):
                      </span>
                      <div className="relative rounded-xl overflow-hidden bg-black text-white p-6 text-center border border-neutral-800 shadow-sm min-h-[200px] flex flex-col items-center justify-center">
                        <div className="absolute inset-0 opacity-40">
                          <img
                            src={settingsForm.heroImageUrl || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2000'}
                            alt="Portada Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="relative z-10 space-y-1.5 max-w-sm">
                          {settingsForm.heroBadgeText && (
                            <span className="inline-block px-2.5 py-0.5 bg-black/80 border border-white/20 rounded-full text-[8.5px] uppercase tracking-[0.2em] font-bold text-neutral-300 font-mono">
                              {settingsForm.heroBadgeText}
                            </span>
                          )}
                          <h4 className="font-serif text-lg font-bold uppercase tracking-wider text-white">
                            {settingsForm.heroTitle || 'ELEGANCIA & ESTILO'}
                          </h4>
                          {settingsForm.heroSubtitle && (
                            <p className="text-[10px] text-neutral-300 line-clamp-2 leading-relaxed">
                              {settingsForm.heroSubtitle}
                            </p>
                          )}
                          <div className="flex items-center justify-center gap-2 pt-2">
                            <span className="px-2.5 py-1 bg-white text-black text-[9px] uppercase font-bold rounded">
                              {settingsForm.heroPrimaryBtnText || 'Ver Catálogo'}
                            </span>
                            <span className="px-2.5 py-1 bg-black/60 border border-white/60 text-white text-[9px] uppercase font-bold rounded">
                              {settingsForm.heroSecondaryBtnText || 'Ver Showroom'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Marquesina */}
                    <div className="space-y-1.5 pt-2 border-t border-neutral-800">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                        Barra Superior de Anuncios:
                      </span>
                      <div className="bg-black text-white p-3 rounded-xl text-center text-xs font-medium tracking-wide border border-neutral-800">
                        {settingsForm.announcementText || '✨ NUEVA TEMPORADA • 25 DE MAYO 903, PISO 3, COMODORO RIVADAVIA'}
                      </div>
                    </div>

                    {/* Card Showroom */}
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                        Showroom Físico:
                      </span>
                      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-neutral-800 rounded-lg text-white">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-white block">
                              {settingsForm.address || '25 de Mayo 903, Piso 3'}
                            </span>
                            <span className="text-xs text-neutral-400">
                              {settingsForm.city || 'Comodoro Rivadavia'}, Chubut
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-neutral-300 font-mono pt-1">
                          <Clock className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{settingsForm.openingHours || '15:00 a 20:00 hs'}</span>
                        </div>

                        <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs">
                          <span className="font-mono text-[11px] text-neutral-400">Receptor WhatsApp:</span>
                          <span className="font-mono font-bold text-emerald-400">+{settingsForm.whatsappNumber}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: DESCUENTOS & PROMOCIONES (CREADOR DINÁMICO 4 TIPOS & TABLA ACTIVA) */}
          {activeTab === 'promotions' && (
            <div className="space-y-8 animate-fade-in">
              
              {/* 1. CREADOR DINÁMICO DE DESCUENTOS CON DESPLEGABLE DE 4 TIPOS */}
              <div className="bg-[#121212] border border-neutral-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                      <Percent className="w-4.5 h-4.5 text-emerald-400" />
                      <span>Configurar Nuevo Descuento</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Elegí el tipo de descuento, la modalidad (% o $) y la regla de activación para la tienda.
                    </p>
                  </div>

                  <span className="text-[11px] font-mono px-3 py-1 bg-neutral-900 border border-neutral-750 text-neutral-300 rounded-full">
                    Impacto en tiempo real
                  </span>
                </div>

                <form onSubmit={handleCreateOrApplyDiscount} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    {/* DESPLEGABLE INICIAL: 4 TIPOS DE DESCUENTO */}
                    <div className="space-y-1.5">
                      <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300 font-mono">
                        1. Tipo de Descuento
                      </label>
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as typeof discountType)}
                        className="w-full px-3.5 py-2.5 text-xs bg-neutral-950 border border-neutral-700 rounded-xl text-white font-bold focus:outline-none focus:border-white transition-colors cursor-pointer"
                      >
                        <option value="volume">📦 Por Cantidad de Prendas (Volumen)</option>
                        <option value="price">💵 Por Monto / Precio de Compra</option>
                        <option value="global">🌐 En Toda la Web (Descuento Global)</option>
                        <option value="category">👗 Por Categoría Específica</option>
                      </select>
                    </div>

                    {/* MODALIDAD: PORCENTAJE (%) O VALOR FIJO ($) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300 font-mono">
                        2. Modalidad del Descuento
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDiscountMode('percentage')}
                          className={`py-2 px-3 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            discountMode === 'percentage'
                              ? 'bg-white text-black border-white shadow-sm'
                              : 'bg-neutral-950 text-neutral-400 border-neutral-750 hover:text-white'
                          }`}
                        >
                          <Percent className="w-3.5 h-3.5" />
                          <span>Porcentaje (%)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDiscountMode('fixed')}
                          className={`py-2 px-3 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            discountMode === 'fixed'
                              ? 'bg-white text-black border-white shadow-sm'
                              : 'bg-neutral-950 text-neutral-400 border-neutral-750 hover:text-white'
                          }`}
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Valor Fijo ($)</span>
                        </button>
                      </div>
                    </div>

                    {/* VALOR DEL DESCUENTO (% o $) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300 font-mono">
                        3. Valor a Descontar ({discountMode === 'percentage' ? '%' : '$ ARS'})
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="1"
                          max={discountMode === 'percentage' ? 90 : 500000}
                          step={discountMode === 'percentage' ? 1 : 1000}
                          value={discountValue}
                          onChange={(e) => setDiscountValue(Number(e.target.value))}
                          placeholder={discountMode === 'percentage' ? "Ej: 15" : "Ej: 10000"}
                          className="w-full px-3.5 py-2.5 text-xs bg-neutral-950 border border-neutral-700 rounded-xl text-emerald-400 font-mono font-bold focus:outline-none focus:border-white transition-colors"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-mono text-neutral-400 font-bold">
                          {discountMode === 'percentage' ? '% OFF' : '$ ARS'}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* CAMPOS DINÁMICOS SEGÚN EL TIPO DE DESCUENTO */}
                  <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-4">
                    <span className="text-[11px] uppercase tracking-wider font-mono font-bold text-neutral-400 block">
                      Condición de Aplicación:
                    </span>

                    {/* Caso 1: Por Cantidad de Prendas */}
                    {discountType === 'volume' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-neutral-300">
                            Cantidad mínima de prendas en el carrito:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="2"
                              max="50"
                              value={discountConditionItems}
                              onChange={(e) => setDiscountConditionItems(Number(e.target.value))}
                              className="w-24 px-3 py-2 text-xs bg-neutral-950 border border-neutral-700 rounded-xl font-mono text-white font-bold focus:outline-none focus:border-white"
                            />
                            <span className="text-xs text-neutral-400">prendas o más</span>
                          </div>
                        </div>
                        <div className="text-xs text-neutral-400 flex items-center">
                          💡 Se activará automáticamente cuando la clienta sume {discountConditionItems} prendas a su bolsa.
                        </div>
                      </div>
                    )}

                    {/* Caso 2: Por Monto / Precio de Compra */}
                    {discountType === 'price' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-neutral-300">
                            Monto mínimo de compra requerido ($):
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="5000"
                              min="10000"
                              value={discountConditionPrice}
                              onChange={(e) => setDiscountConditionPrice(Number(e.target.value))}
                              className="w-36 px-3 py-2 text-xs bg-neutral-950 border border-neutral-700 rounded-xl font-mono text-white font-bold focus:outline-none focus:border-white"
                            />
                            <span className="text-xs text-neutral-400">$ ARS o más</span>
                          </div>
                        </div>
                        <div className="text-xs text-neutral-400 flex items-center">
                          💡 Se aplicará en carritos que superen {formatPrice(discountConditionPrice)}.
                        </div>
                      </div>
                    )}

                    {/* Caso 3: En Toda la Web */}
                    {discountType === 'global' && (
                      <div className="text-xs text-neutral-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                        <span>Este descuento aplicará de manera global e inmediata en <strong>todos los pedidos de la tienda online</strong>.</span>
                      </div>
                    )}

                    {/* Caso 4: Por Categoría Específica */}
                    {discountType === 'category' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-neutral-300">
                            Seleccionar Categoría Aplicable:
                          </label>
                          <select
                            value={discountConditionCategory}
                            onChange={(e) => setDiscountConditionCategory(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs bg-neutral-950 border border-neutral-700 rounded-xl font-bold text-white focus:outline-none focus:border-white cursor-pointer"
                          >
                            <option value="all">🌐 Todas las categorías</option>
                            {categories.filter(c => c.slug !== 'all').map(c => (
                              <option key={c.id} value={c.slug}>👗 Solo {c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="text-xs text-neutral-400 flex items-center">
                          💡 El descuento se aplicará únicamente a los ítems que pertenezcan a la categoría elegida.
                        </div>
                      </div>
                    )}

                    {/* OPCIONALES: LÍMITE DE PERSONAS Y CÓDIGO */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-neutral-800">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-neutral-300 font-mono">
                          Límite de Personas (Opcional):
                        </label>
                        <input
                          type="number"
                          min="1"
                          placeholder="Ej: 50 (o dejar vacío para ilimitado)"
                          value={discountMaxUsers}
                          onChange={(e) => setDiscountMaxUsers(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs bg-neutral-950 border border-neutral-700 rounded-xl font-mono text-white focus:outline-none focus:border-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-neutral-300 font-mono">
                          Código / Nombre de Referencia (Opcional):
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: PROMO-CANTIDAD, ALOHA15..."
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs bg-neutral-950 border border-neutral-700 rounded-xl font-mono uppercase text-white font-bold focus:outline-none focus:border-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button & Feedback */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    {discountFormSuccess ? (
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>¡Descuento guardado y activado en la tienda!</span>
                      </div>
                    ) : discountFormError ? (
                      <div className="text-red-400 font-bold text-xs max-w-xl">{discountFormError}</div>
                    ) : <div />}

                    <button
                      type="submit"
                      className="w-full sm:w-auto px-8 py-3 bg-white hover:bg-neutral-200 text-black text-xs uppercase tracking-[0.2em] font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-black" />
                      <span>Guardar / Activar Descuento</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* 2. TABLA UNIFICADA DE DESCUENTOS ACTIVOS Y SUS DATOS */}
              <div className="bg-[#121212] border border-neutral-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                      <Tag className="w-4.5 h-4.5 text-emerald-400" />
                      <span>Tabla de Descuentos y Promociones Activas</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Controlá el estado en vivo de cada beneficio disponible para las clientas.
                    </p>
                  </div>

                  <span className="text-[11px] font-mono px-3 py-1 bg-neutral-900 border border-neutral-750 text-emerald-400 font-bold rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Sincronizado con la Bolsa
                  </span>
                </div>

                <div className="overflow-x-auto border border-neutral-800 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#181818] text-neutral-300 font-mono uppercase tracking-wider text-[11px] border-b border-neutral-800">
                      <tr>
                        <th className="py-3.5 px-4">Tipo de Descuento</th>
                        <th className="py-3.5 px-4">Beneficio</th>
                        <th className="py-3.5 px-4">Condición / Alcance</th>
                        <th className="py-3.5 px-4">Límite de Personas</th>
                        <th className="py-3.5 px-4 text-center">Estado</th>
                        <th className="py-3.5 px-4 text-right">Interruptor (On / Off)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/80">
                      
                      {/* 1. Por Cantidad de Prendas (Volumen) */}
                      <tr className="hover:bg-neutral-900/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                          <Package className="w-4 h-4 text-sky-400" />
                          <span>Por Cantidad de Prendas</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                          {settingsForm.volumeDiscountPercentage || 15}% OFF
                        </td>
                        <td className="py-3.5 px-4 text-neutral-300 font-mono">
                          Llevando <strong>{settingsForm.volumeDiscountMinItems || 3} o más prendas</strong>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-400">
                          Sin límite (Ilimitado)
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono uppercase font-bold border ${
                            settingsForm.volumeDiscountActive
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                          }`}>
                            {settingsForm.volumeDiscountActive ? '🟢 Activo en Web' : '⚪ Pausado'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleQuickTogglePromo('volume')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                              settingsForm.volumeDiscountActive
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border-neutral-700'
                            }`}
                          >
                            {settingsForm.volumeDiscountActive ? 'Pausar' : 'Activar'}
                          </button>
                        </td>
                      </tr>

                      {/* 2. Por Monto / Precio de Compra */}
                      <tr className="hover:bg-neutral-900/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-amber-400" />
                          <span>Por Monto de Compra</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                          {settingsForm.priceDiscountPercentage || 10}% OFF
                        </td>
                        <td className="py-3.5 px-4 text-neutral-300 font-mono">
                          Compras superiores a <strong>{formatPrice(settingsForm.priceDiscountMinAmount || 80000)}</strong>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-400">
                          Sin límite (Ilimitado)
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono uppercase font-bold border ${
                            settingsForm.priceDiscountActive
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                          }`}>
                            {settingsForm.priceDiscountActive ? '🟢 Activo en Web' : '⚪ Pausado'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleQuickTogglePromo('price')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                              settingsForm.priceDiscountActive
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border-neutral-700'
                            }`}
                          >
                            {settingsForm.priceDiscountActive ? 'Pausar' : 'Activar'}
                          </button>
                        </td>
                      </tr>

                      {/* 3. Descuento General de la Tienda */}
                      <tr className="hover:bg-neutral-900/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                          <Percent className="w-4 h-4 text-purple-400" />
                          <span>En Toda la Web (Global)</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                          {settingsForm.globalDiscountPercentage || 10}% OFF
                        </td>
                        <td className="py-3.5 px-4 text-neutral-300 font-mono">
                          Todos los carritos automáticamente
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-400">
                          Sin límite (Ilimitado)
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono uppercase font-bold border ${
                            settingsForm.globalDiscountActive
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : 'bg-neutral-900 text-neutral-500 border-neutral-800'
                          }`}>
                            {settingsForm.globalDiscountActive ? '🟢 Activo en Web' : '⚪ Pausado'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleQuickTogglePromo('global')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                              settingsForm.globalDiscountActive
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border-neutral-700'
                            }`}
                          >
                            {settingsForm.globalDiscountActive ? 'Pausar' : 'Activar'}
                          </button>
                        </td>
                      </tr>

                      {/* 4. Descuentos por Categoría & Promos Creadas */}
                      {coupons.map((c) => {
                        const target = c.targetCategory || 'all';
                        const catName = target === 'all' 
                          ? 'Toda la Tienda' 
                          : categories.find(cat => cat.slug === target)?.name || target.toUpperCase();
                        const isLimitReached = Boolean(c.maxUses && c.maxUses > 0 && (c.usedCount || 0) >= c.maxUses);

                        return (
                          <tr key={c.id} className="hover:bg-neutral-900/50 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                              <Tag className="w-4 h-4 text-emerald-400" />
                              <span className="font-mono">{c.code}</span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                              {c.discountPercentage > 0 ? `${c.discountPercentage}% OFF` : `${formatPrice(c.fixedDiscount || 0)} OFF`}
                            </td>
                            <td className="py-3.5 px-4 font-medium">
                              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-neutral-900 text-neutral-300 border border-neutral-750">
                                {catName}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-neutral-300">
                              {c.maxUses ? `${c.usedCount || 0} / ${c.maxUses} personas` : 'Sin límite (Ilimitado)'}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono uppercase font-bold border ${
                                !c.isActive 
                                  ? 'bg-neutral-900 text-neutral-500 border-neutral-800'
                                  : isLimitReached 
                                  ? 'bg-amber-950 text-amber-300 border-amber-800' 
                                  : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              }`}>
                                {!c.isActive ? '⚪ Pausado' : isLimitReached ? '🟡 Agotado' : '🟢 Activo'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const err = await toggleCouponActive(c.id);
                                    if (err) alert(err);
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
                                    c.isActive
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border-neutral-700'
                                  }`}
                                >
                                  {c.isActive ? 'Pausar' : 'Activar'}
                                </button>
                                <button
                                  onClick={async () => {
                                    const err = await deleteCoupon(c.id);
                                    if (err) alert(err);
                                  }}
                                  className="text-neutral-500 hover:text-red-400 p-1.5 cursor-pointer transition-colors"
                                  title="Eliminar descuento"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: PEDIDOS WHATSAPP & LOGS */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                    Historial de Pedidos ({filteredOrders.length})
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Actualizá el estado de los pedidos para que impacte en vivo en la bolsa de las clientas.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative max-w-xs w-full">
                    <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Buscar por ID, clienta o teléfono..."
                      className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-750 rounded-xl text-xs text-white placeholder:text-neutral-500 font-medium focus:outline-none focus:border-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => refreshOrders()}
                    className="shrink-0 p-2.5 bg-neutral-900 border border-neutral-700 hover:border-white rounded-xl text-white cursor-pointer transition-colors"
                    title="Actualizar pedidos"
                    aria-label="Actualizar pedidos"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-[#121212] border border-neutral-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#181818] text-neutral-300 font-mono uppercase tracking-wider text-[11px] border-b border-neutral-800">
                      <tr>
                        <th className="py-3.5 px-4">ID Pedido</th>
                        <th className="py-3.5 px-4">Fecha</th>
                        <th className="py-3.5 px-4">Clienta</th>
                        <th className="py-3.5 px-4">Prendas</th>
                        <th className="py-3.5 px-4">Total</th>
                        <th className="py-3.5 px-4">Estado (En Vivo)</th>
                        <th className="py-3.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/80">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-neutral-500">
                            No se encontraron pedidos registrados.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-neutral-900/50 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-white">
                              {ord.id}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-neutral-400">
                              {new Date(ord.createdAt).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-white block">{ord.customerName}</span>
                              <span className="text-[11px] font-mono text-neutral-400">{ord.customerPhone || 'Sin teléfono'}</span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-neutral-300">
                              {ord.items.reduce((sum, item) => sum + item.quantity, 0)} prendas
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-white text-sm">
                              {formatPrice(ord.total)}
                            </td>
                            <td className="py-3.5 px-4">
                              <select
                                value={ord.status}
                                onChange={(e) => handleChangeOrderStatus(ord.id, e.target.value)}
                                className={`text-[11px] font-mono uppercase font-bold px-3 py-1.5 rounded-lg border cursor-pointer ${
                                  ord.status === 'delivered'
                                    ? 'bg-white text-black border-white'
                                    : ord.status === 'confirmed' 
                                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                                    : ord.status === 'contacted'
                                    ? 'bg-sky-950 text-sky-300 border-sky-700'
                                    : ord.status === 'cancelled'
                                    ? 'bg-red-950 text-red-300 border-red-700'
                                    : 'bg-amber-950 text-amber-300 border-amber-700'
                                }`}
                              >
                                <option value="whatsapp_sent" className="bg-neutral-900 text-white">🟡 Pedido Enviado</option>
                                <option value="contacted" className="bg-neutral-900 text-white">🔵 Contactado WhatsApp</option>
                                <option value="confirmed" className="bg-neutral-900 text-white">🟢 Pago Confirmado / En Preparación</option>
                                <option value="delivered" className="bg-neutral-900 text-white">⚪ Compra Realizada / Entregado</option>
                                <option value="cancelled" className="bg-neutral-900 text-white">🔴 Cancelado</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => setSelectedOrderForInspect(ord)}
                                className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] uppercase tracking-wider font-bold rounded-lg border border-neutral-750 cursor-pointer transition-colors"
                              >
                                Ver Detalle
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detalle del pedido: se dibuja en <body> (portal). Dentro de la pestaña, la animación de entrada deja una
                  transformación CSS que haría que "fixed" se ubique respecto de la pestaña y no de la pantalla (modal cortado). */}
              {selectedOrderForInspect && createPortal(
                <div
                  className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
                  onClick={() => setSelectedOrderForInspect(null)}
                >
                  <div className="min-h-full flex items-center justify-center p-4">
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="detalle-pedido-titulo"
                      onClick={(e) => e.stopPropagation()}
                      className="bg-[#121212] text-white max-w-lg w-full p-6 sm:p-8 rounded-2xl shadow-2xl space-y-4 border border-neutral-800"
                    >
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                        <div>
                          <h4 id="detalle-pedido-titulo" className="text-base font-bold uppercase tracking-wide font-serif">Prendas del Pedido</h4>
                          <span className="font-mono text-xs text-neutral-400 font-bold">{selectedOrderForInspect.id}</span>
                        </div>
                        <button
                          onClick={() => setSelectedOrderForInspect(null)}
                          className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer hover:bg-neutral-800"
                          aria-label="Cerrar detalle"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div><strong className="text-white">Clienta:</strong> <span className="text-neutral-300">{selectedOrderForInspect.customerName}</span></div>
                        <div><strong className="text-white">Teléfono:</strong> <span className="text-neutral-300">{selectedOrderForInspect.customerPhone || 'N/A'}</span></div>
                        <div><strong className="text-white">Dirección:</strong> <span className="text-neutral-300">{formatLocation(selectedOrderForInspect.customerLocation)}</span></div>
                      </div>

                      <div className="border-t border-b border-neutral-800 py-3 space-y-2 max-h-60 overflow-y-auto">
                        {selectedOrderForInspect.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl">
                            <div>
                              <span className="font-bold block text-white">{it.name}</span>
                              <span className="text-neutral-400 text-[11px] font-mono">
                                Talle: {it.size} | Color: {it.color} (x{it.quantity})
                              </span>
                            </div>
                            <span className="font-mono font-bold text-white">{formatPrice(it.price * it.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      {selectedOrderForInspect.discountAmount > 0 && (
                        <div className="space-y-1 text-xs font-mono text-neutral-300">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>{formatPrice(selectedOrderForInspect.subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-emerald-400">
                            <span>Descuento{selectedOrderForInspect.couponCode ? ` (${selectedOrderForInspect.couponCode})` : ''}:</span>
                            <span>-{formatPrice(selectedOrderForInspect.discountAmount)}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-base font-bold font-mono">
                        <span>Total del Pedido:</span>
                        <span className="text-white">{formatPrice(selectedOrderForInspect.total)}</span>
                      </div>

                      <button
                        onClick={() => setSelectedOrderForInspect(null)}
                        className="w-full py-3 bg-white hover:bg-neutral-200 text-black text-xs uppercase tracking-wider font-bold rounded-xl cursor-pointer transition-colors shadow-sm"
                      >
                        Cerrar Detalle
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </div>
          )}

          {/* TAB 4: CATEGORÍAS & SUBCATEGORÍAS */}
          {activeTab === 'categories' && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Crear Categoría Principal */}
                <div className="lg:col-span-6 bg-[#121212] border border-neutral-800 shadow-xl p-6 sm:p-8 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-white" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                      Nueva Categoría Principal
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Aparecerá en el menú lateral y catálogo de la tienda.
                  </p>

                  <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300 mb-1">
                        Nombre de la Categoría
                      </label>
                      <input
                        type="text"
                        required
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Ej: Conjuntos"
                        className="w-full px-3.5 py-2.5 text-xs bg-neutral-900 border border-neutral-750 rounded-xl focus:outline-none focus:border-white font-semibold text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300 mb-1">
                          Slug (Identificador)
                        </label>
                        <input
                          type="text"
                          value={newCatSlug}
                          onChange={(e) => setNewCatSlug(e.target.value)}
                          placeholder="conjuntos"
                          className="w-full px-3.5 py-2 text-xs bg-neutral-900 border border-neutral-750 rounded-xl font-mono text-white focus:outline-none focus:border-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300 mb-1">
                          Descripción
                        </label>
                        <input
                          type="text"
                          value={newCatDesc}
                          onChange={(e) => setNewCatDesc(e.target.value)}
                          placeholder="Prendas combinadas"
                          className="w-full px-3.5 py-2 text-xs bg-neutral-900 border border-neutral-750 rounded-xl text-white focus:outline-none focus:border-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-white text-black text-xs uppercase tracking-wider font-bold hover:bg-neutral-200 transition-colors cursor-pointer rounded-xl shadow-sm"
                    >
                      Guardar Categoría
                    </button>
                  </form>
                </div>

                {/* Agregar Subcategoría */}
                <div className="lg:col-span-6 bg-[#121212] border border-neutral-800 shadow-xl p-6 sm:p-8 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-white" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                      Agregar Subcategoría Dinámica
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Asociá subcategorías (ej: Pantalones → Sastreros, Calzas, Joggers).
                  </p>

                  <form onSubmit={handleAddSubcategory} className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300 mb-1">
                        Categoría Padre
                      </label>
                      <select
                        value={selectedCatForSub}
                        onChange={(e) => setSelectedCatForSub(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 text-xs bg-neutral-900 border border-neutral-750 rounded-xl text-white uppercase font-bold focus:outline-none focus:border-white"
                      >
                        <option value="">-- Seleccionar Categoría --</option>
                        {categories.filter(c => c.slug !== 'all').map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300 mb-1">
                        Nombre de la Subcategoría
                      </label>
                      <input
                        type="text"
                        required
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        placeholder="Ej: Sastreros, Calzas, Halter..."
                        className="w-full px-3.5 py-2.5 text-xs bg-neutral-900 border border-neutral-750 rounded-xl focus:outline-none focus:border-white font-semibold text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!selectedCatForSub}
                      className="w-full py-3 bg-white text-black text-xs uppercase tracking-wider font-bold hover:bg-neutral-200 transition-colors cursor-pointer rounded-xl disabled:opacity-40 shadow-sm"
                    >
                      + Vincular Subcategoría
                    </button>
                  </form>
                </div>

              </div>

              {/* Vista de Estructura de Categorías */}
              <div className="bg-[#121212] border border-neutral-800 shadow-xl p-6 sm:p-8 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                  Estructura Actual de Colecciones
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat) => (
                    <div key={cat.id} className="p-4 bg-neutral-900/80 border border-neutral-800 rounded-xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                          <span className="text-xs font-bold text-white uppercase tracking-wide">
                            {cat.name}
                          </span>
                          {cat.slug !== 'all' && (
                            <button
                              onClick={async () => {
                                if (confirm(`¿Eliminar la categoría "${cat.name}"?`)) {
                                  const error = await deleteCategory(cat.id);
                                  if (error) alert(error);
                                }
                              }}
                              className="text-neutral-500 hover:text-red-400 p-1 cursor-pointer transition-colors"
                              title="Eliminar categoría"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <p className="text-[11px] text-neutral-400 font-mono mt-1">
                          /{cat.slug}
                        </p>

                        <div className="mt-3">
                          <p className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 font-bold mb-1.5">
                            Subcategorías ({cat.subcategories?.length || 0}):
                          </p>
                          {cat.subcategories && cat.subcategories.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {cat.subcategories.map(sub => (
                                <span
                                  key={sub.id}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-950 border border-neutral-750 text-[11px] text-neutral-200 rounded-lg font-semibold"
                                >
                                  <span>{sub.name}</span>
                                  <button
                                    onClick={async () => {
                                      const error = await deleteSubcategory(cat.id, sub.id);
                                      if (error) alert(error);
                                    }}
                                    className="text-neutral-500 hover:text-red-400 font-bold cursor-pointer"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-neutral-500 italic">
                              Sin subcategorías
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                        <span>Orden: #{cat.order}</span>
                        <button
                          onClick={() => setSelectedCatForSub(cat.id)}
                          className="text-white font-bold hover:underline cursor-pointer"
                        >
                          + Agregar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MÉTRICAS & CLIENTAS */}
          {activeTab === 'metrics' && (
            <div className="space-y-8 animate-fade-in">
              
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-6 bg-[#121212] border border-neutral-800 shadow-xl rounded-2xl">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span className="text-xs uppercase tracking-wider font-mono font-bold">Clientas Registradas</span>
                    <div className="p-2 bg-neutral-900 rounded-xl text-white">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white mt-3 font-mono">{totalUsersCount}</p>
                  <p className="text-xs text-emerald-400 mt-2 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Cuentas creadas en la tienda</span>
                  </p>
                </div>

                <div className="p-6 bg-[#121212] border border-neutral-800 shadow-xl rounded-2xl">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span className="text-xs uppercase tracking-wider font-mono font-bold">Carritos WhatsApp</span>
                    <div className="p-2 bg-neutral-900 rounded-xl text-white">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white mt-3 font-mono">{totalOrdersCount}</p>
                  <p className="text-xs text-neutral-400 mt-2">Cotizaciones recibidas</p>
                </div>

                <div className="p-6 bg-[#121212] border border-neutral-800 shadow-xl rounded-2xl">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span className="text-xs uppercase tracking-wider font-mono font-bold">Volumen Solicitado</span>
                    <div className="p-2 bg-neutral-900 rounded-xl text-white">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white mt-3 font-mono">{formatPrice(totalRevenue)}</p>
                  <p className="text-xs text-neutral-400 mt-2">Monto en pedidos</p>
                </div>

                <div className="p-6 bg-[#121212] border border-neutral-800 shadow-xl rounded-2xl">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span className="text-xs uppercase tracking-wider font-mono font-bold">Promos Activas</span>
                    <div className="p-2 bg-neutral-900 rounded-xl text-white">
                      <Tag className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white mt-3 font-mono">{activePromosCount}</p>
                  <p className="text-xs text-neutral-400 mt-2">Descuentos vigentes</p>
                </div>
              </div>

              {/* Clientas Registradas */}
              <div className="bg-[#121212] border border-neutral-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                  Clientas y Perfiles Registrados ({registeredUsers.length})
                </h3>

                <div className="overflow-x-auto border border-neutral-800 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#181818] text-neutral-300 font-mono uppercase tracking-wider text-[11px] border-b border-neutral-800">
                      <tr>
                        <th className="py-3.5 px-4">Clienta</th>
                        <th className="py-3.5 px-4">Email</th>
                        <th className="py-3.5 px-4">Teléfono</th>
                        <th className="py-3.5 px-4">Ciudad / Provincia</th>
                        <th className="py-3.5 px-4">Fecha y Hora</th>
                        <th className="py-3.5 px-4">Rol</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/80">
                      {registeredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-neutral-900/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                            {isTrustedAvatarUrl(u.avatarUrl) ? (
                              <img src={u.avatarUrl} alt="" referrerPolicy="no-referrer" loading="lazy" className="w-7 h-7 rounded-full object-cover border border-neutral-700" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs">
                                {u.fullName ? u.fullName.charAt(0) : 'U'}
                              </div>
                            )}
                            <span>{u.fullName}</span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-neutral-400">{u.email}</td>
                          <td className="py-3.5 px-4 font-mono text-neutral-400">{u.phone || 'N/A'}</td>
                          <td className="py-3.5 px-4 text-neutral-300">
                            {(() => {
                              let city = u.address?.city?.trim();
                              let province = u.address?.province?.trim();
                              const cp = u.address?.postalCode?.trim();

                              if ((!city || !province) && cp) {
                                if (cp.startsWith('9000')) { city = city || 'Comodoro Rivadavia'; province = province || 'Chubut'; }
                                else if (cp.startsWith('9001')) { city = city || 'Rada Tilly'; province = province || 'Chubut'; }
                                else if (cp.startsWith('9100')) { city = city || 'Trelew'; province = province || 'Chubut'; }
                                else if (cp.startsWith('9120')) { city = city || 'Puerto Madryn'; province = province || 'Chubut'; }
                                else if (cp.startsWith('9011')) { city = city || 'Caleta Olivia'; province = province || 'Santa Cruz'; }
                                else if (cp.startsWith('9400')) { city = city || 'Río Gallegos'; province = province || 'Santa Cruz'; }
                                else if (cp.startsWith('9410')) { city = city || 'Ushuaia'; province = province || 'Tierra del Fuego'; }
                              }

                              city = city || 'Comodoro Rivadavia';
                              province = province || 'Chubut';
                              const cpSuffix = cp ? ` (CP ${cp})` : '';

                              return `${city}, ${province}${cpSuffix}`;
                            })()}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-neutral-400 whitespace-nowrap">
                            {u.createdAt ? (
                              new Date(u.createdAt).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            ) : (
                              'Reciente'
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {u.isAdmin ? (
                              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[10px] font-mono uppercase font-bold">
                                Admin
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-neutral-900 text-neutral-400 border border-neutral-800 rounded text-[10px] font-mono uppercase">
                                Clienta
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

      </main>

    </div>
  );
};
