import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../context/StoreContext';
import type { StoreSettings, OrderRecord } from '../../types';
import { BrandLogo } from '../common/BrandLogo';
import { OrderItemThumb } from '../common/OrderItemThumb';
import { fileToDataUrl, uploadCatalogImage } from '../../lib/images';
import { slugify } from '../../lib/slug';
import { normalizeCouponCode, couponKind } from '../../lib/pricing';
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
  Menu,
  Percent,
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

  // La sección abierta se recuerda en esta pestaña del navegador: al recargar la página se vuelve a la misma sección
  type AdminTab = 'metrics' | 'orders' | 'categories' | 'promotions' | 'settings';
  const ADMIN_TABS: AdminTab[] = ['metrics', 'orders', 'categories', 'promotions', 'settings'];
  const ACTIVE_TAB_KEY = 'aloha_admin_tab';
  const [activeTab, setActiveTabState] = useState<AdminTab>(() => {
    try {
      const saved = sessionStorage.getItem(ACTIVE_TAB_KEY);
      return ADMIN_TABS.find(tab => tab === saved) ?? 'settings';
    } catch {
      return 'settings';
    }
  });
  const setActiveTab = (tab: AdminTab) => {
    setActiveTabState(tab);
    try {
      sessionStorage.setItem(ACTIVE_TAB_KEY, tab);
    } catch {
      // sin almacenamiento disponible (modo privado): simplemente no se recuerda
    }
  };
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Category & Subcategory Form States
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [selectedCatForSub, setSelectedCatForSub] = useState<string>('');
  const [newSubName, setNewSubName] = useState('');

  // Unified 4-Type Discount Form State
  const [discountKind, setDiscountKind] = useState<'amount' | 'items' | 'global' | 'category'>('global');
  const [discountMinAmount, setDiscountMinAmount] = useState<string>('');
  const [discountMinItems, setDiscountMinItems] = useState<string>('');
  const [discountMode, setDiscountMode] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(15);
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

  // Crea un cupón. Todo descuento es un cupón que la clienta escribe. Cada cupón tiene UN tipo (su condición):
  // por monto, por cantidad de prendas, global (toda la tienda) o por categoría.
  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountFormError('');
    const isFixed = discountMode === 'fixed';
    const val = Number(discountValue);

    if (!Number.isFinite(val) || val <= 0 || (!isFixed && val > 100)) {
      setDiscountFormError(isFixed ? 'Ingresá un monto mayor a cero.' : 'El porcentaje tiene que ser mayor a 0 y hasta 100.');
      return;
    }

    let minAmount: number | undefined;
    let minItems: number | undefined;
    let targetCategory = 'all';
    if (discountKind === 'amount') {
      minAmount = Number(discountMinAmount);
      if (!Number.isFinite(minAmount) || minAmount <= 0) {
        setDiscountFormError('Ingresá la compra mínima: un monto mayor a cero.');
        return;
      }
    } else if (discountKind === 'items') {
      minItems = Number(discountMinItems);
      if (!Number.isInteger(minItems) || minItems < 1) {
        setDiscountFormError('Ingresá la cantidad mínima de prendas: un número entero desde 1.');
        return;
      }
    } else if (discountKind === 'category') {
      if (discountConditionCategory === 'all') {
        setDiscountFormError('Elegí la categoría a la que aplica el cupón.');
        return;
      }
      targetCategory = discountConditionCategory;
    }

    let maxUses: number | undefined;
    if (discountMaxUsers.trim() !== '') {
      maxUses = Number(discountMaxUsers);
      if (!Number.isInteger(maxUses) || maxUses < 1) {
        setDiscountFormError('El límite de personas tiene que ser un número entero desde 1 (o dejalo vacío).');
        return;
      }
    }

    const code = normalizeCouponCode(discountCode);
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      setDiscountFormError('El código tiene que tener entre 3 y 30 caracteres: letras sin tilde, números o guiones (los espacios pasan a guión).');
      return;
    }
    if (coupons.some(c => c.code.toUpperCase() === code)) {
      setDiscountFormError(`Ya existe un cupón con el código ${code}.`);
      return;
    }

    const couponError = await addCoupon({
      code,
      discountPercentage: isFixed ? 0 : val,
      fixedDiscount: isFixed ? val : undefined,
      maxUses,
      targetCategory,
      minAmount,
      minItems,
      isActive: true,
    });
    if (couponError) {
      setDiscountFormError(couponError);
      return;
    }

    setDiscountFormSuccess(true);
    setDiscountCode('');
    setDiscountMaxUsers('');
    setDiscountMinAmount('');
    setDiscountMinItems('');
    setTimeout(() => setDiscountFormSuccess(false), 3500);
  };

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSettingsError('');
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

  const activePromosCount = coupons.filter(c => c.isActive).length;

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
                  Configurá la marquesina superior, la dirección, los horarios, las fotos y la portada de la tienda con vista previa en tiempo real.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* FORMULARIO DE AJUSTES */}
                <div className="lg:col-span-7 bg-[#121212] border border-neutral-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
                  
                  <form onSubmit={handleSaveStoreSettings} className="space-y-6">
                    
                    {/* Sección Marquesina */}
                    <div className="space-y-2 pt-2 border-t border-neutral-800">
                      <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300">
                        Texto de la Marquesina Superior (Barra de Anuncios)
                      </label>
                      <input
                        type="text"
                        value={settingsForm.announcementText}
                        onChange={(e) => setSettingsForm({ ...settingsForm, announcementText: e.target.value })}
                        placeholder="✨ NUEVA TEMPORADA • 25 DE MAYO 903, OFICINA 3, COMODORO RIVADAVIA..."
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
                          placeholder="25 de Mayo 903, Oficina 3"
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
                              Ver Catálogo
                            </span>
                            <span className="px-2.5 py-1 bg-black/60 border border-white/60 text-white text-[9px] uppercase font-bold rounded">
                              Instagram
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
                        {settingsForm.announcementText || '✨ NUEVA TEMPORADA • 25 DE MAYO 903, OFICINA 3, COMODORO RIVADAVIA'}
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
                              {settingsForm.address || '25 de Mayo 903, Oficina 3'}
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
              
              {/* 1. CREADOR DE CUPONES */}
              <div className="bg-[#121212] border border-neutral-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                      <Percent className="w-4.5 h-4.5 text-emerald-400" />
                      <span>Crear Cupón de Descuento</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Todos los descuentos son cupones que la clienta escribe en su bolsa. Una compra admite un solo cupón y cada clienta usa cada cupón una sola vez.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateDiscount} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                    {/* TIPO DE CUPÓN: define la condición para que valga */}
                    <div className="space-y-1.5">
                      <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300 font-mono">
                        1. Tipo de Cupón
                      </label>
                      <select
                        value={discountKind}
                        onChange={(e) => setDiscountKind(e.target.value as typeof discountKind)}
                        className="w-full px-3.5 py-2.5 text-xs bg-neutral-950 border border-neutral-700 rounded-xl text-white font-bold focus:outline-none focus:border-white transition-colors cursor-pointer"
                      >
                        <option value="amount">💵 Por monto de compra</option>
                        <option value="items">📦 Por cantidad de prendas</option>
                        <option value="global">🌐 Global (toda la tienda)</option>
                        <option value="category">👗 Por categoría</option>
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
                          min="0.01"
                          max={discountMode === 'percentage' ? 100 : undefined}
                          step="any"
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

                  <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-4">
                    {discountKind !== 'global' && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-neutral-300 font-mono">
                          {discountKind === 'amount' && 'Compra mínima para usar el cupón ($):'}
                          {discountKind === 'items' && 'Cantidad mínima de prendas en la bolsa:'}
                          {discountKind === 'category' && 'Categoría a la que aplica:'}
                        </label>
                        {discountKind === 'amount' && (
                          <input
                            type="number"
                            required
                            min="0.01"
                            step="any"
                            placeholder="Ej: 80000"
                            value={discountMinAmount}
                            onChange={(e) => setDiscountMinAmount(e.target.value)}
                            className="w-full sm:w-64 px-3.5 py-2 text-xs bg-neutral-950 border border-neutral-700 rounded-xl font-mono text-white focus:outline-none focus:border-white"
                          />
                        )}
                        {discountKind === 'items' && (
                          <input
                            type="number"
                            required
                            min="1"
                            step="1"
                            placeholder="Ej: 3"
                            value={discountMinItems}
                            onChange={(e) => setDiscountMinItems(e.target.value)}
                            className="w-full sm:w-64 px-3.5 py-2 text-xs bg-neutral-950 border border-neutral-700 rounded-xl font-mono text-white focus:outline-none focus:border-white"
                          />
                        )}
                        {discountKind === 'category' && (
                          <select
                            value={discountConditionCategory}
                            onChange={(e) => setDiscountConditionCategory(e.target.value)}
                            className="w-full sm:w-64 px-3.5 py-2 text-xs bg-neutral-950 border border-neutral-700 rounded-xl font-bold text-white focus:outline-none focus:border-white cursor-pointer"
                          >
                            <option value="all">Elegí una categoría…</option>
                            {categories.filter(c => c.slug !== 'all').map(c => (
                              <option key={c.id} value={c.slug}>👗 Solo {c.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-neutral-300 font-mono">
                          Código que escribe la clienta:
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={30}
                          placeholder="Ej: ALOHA15, VERANO-10..."
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs bg-neutral-950 border border-neutral-700 rounded-xl font-mono uppercase text-white font-bold focus:outline-none focus:border-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-neutral-300 font-mono">
                          Límite de Personas (Opcional):
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="Ej: 50 (o dejar vacío para ilimitado)"
                          value={discountMaxUsers}
                          onChange={(e) => setDiscountMaxUsers(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs bg-neutral-950 border border-neutral-700 rounded-xl font-mono text-white focus:outline-none focus:border-white"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-neutral-400">
                      💡 {discountKind === 'amount' && `El cupón solo vale si el total de la bolsa llega a ${discountMinAmount ? formatPrice(Number(discountMinAmount)) : 'el monto mínimo'}. El descuento se calcula sobre todo el total.`}
                      {discountKind === 'items' && `El cupón solo vale si la bolsa tiene ${discountMinItems || 'la cantidad mínima de'} prendas o más. El descuento se calcula sobre todo el total.`}
                      {discountKind === 'global' && 'El cupón vale para cualquier compra de la tienda, sin condición. El descuento se calcula sobre todo el total.'}
                      {discountKind === 'category' && 'El cupón descuenta únicamente sobre las prendas de la categoría elegida.'}
                      {' '}Cada persona puede usar un cupón una sola vez y, después de usar uno, no puede usar otro durante 24 horas.
                    </p>
                  </div>

                  {/* Submit Button & Feedback */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    {discountFormSuccess ? (
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-mono">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>¡Cupón guardado y activado en la tienda!</span>
                      </div>
                    ) : discountFormError ? (
                      <div className="text-red-400 font-bold text-xs max-w-xl">{discountFormError}</div>
                    ) : <div />}

                    <button
                      type="submit"
                      className="w-full sm:w-auto px-8 py-3 bg-white hover:bg-neutral-200 text-black text-xs uppercase tracking-[0.2em] font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-black" />
                      <span>Crear Cupón</span>
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
                      <span>Cupones Creados</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Pausá, reactivá o eliminá cada cupón. Los cambios se ven al instante en la tienda.
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
                        <th className="py-3.5 px-4">Código</th>
                        <th className="py-3.5 px-4">Beneficio</th>
                        <th className="py-3.5 px-4">Tipo y Condición</th>
                        <th className="py-3.5 px-4">Personas que lo usaron</th>
                        <th className="py-3.5 px-4 text-center">Estado</th>
                        <th className="py-3.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/80">
                      
                      {coupons.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 px-4 text-center text-neutral-500 font-mono">
                            Todavía no creaste ningún cupón.
                          </td>
                        </tr>
                      )}

                      {/* 4. Descuentos por Categoría & Promos Creadas */}
                      {coupons.map((c) => {
                        const target = c.targetCategory || 'all';
                        const catName = target === 'all'
                          ? 'Toda la Tienda'
                          : categories.find(cat => cat.slug === target)?.name || target.toUpperCase();
                        const kind = couponKind(c);
                        const kindLabel = { amount: 'Por monto', items: 'Por cantidad', category: 'Por categoría', global: 'Global' }[kind];
                        const condition = kind === 'amount'
                          ? `Compra desde ${formatPrice(c.minAmount || 0)}`
                          : kind === 'items'
                          ? `${c.minItems} prenda${c.minItems === 1 ? '' : 's'} o más`
                          : kind === 'category'
                          ? `Solo ${catName}`
                          : 'Toda la tienda';
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
                              <span className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">{kindLabel}</span>
                              <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-neutral-900 text-neutral-300 border border-neutral-750">
                                {condition}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-neutral-300">
                              {c.maxUses ? `${c.usedCount || 0} de ${c.maxUses}` : `${c.usedCount || 0} (sin límite)`}
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
                          <div key={idx} className="flex justify-between items-center gap-3 text-xs p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl">
                            <div className="flex items-center gap-3 min-w-0">
                              <OrderItemThumb productId={it.productId} name={it.name} size={48} />
                              <div className="min-w-0">
                                <span className="font-bold block text-white">{it.name}</span>
                                <span className="text-neutral-400 text-[11px] font-mono">
                                  Talle: {it.size} | Color: {it.color} (x{it.quantity})
                                </span>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-white shrink-0">{formatPrice(it.price * it.quantity)}</span>
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
                        {categories.filter(c => c.slug !== 'all' && !c.locked).map(c => (
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
                          {cat.locked ? (
                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#6D1A2C] text-white" title="Categoría fija: no se puede editar">
                              Fija
                            </span>
                          ) : cat.slug !== 'all' && (
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
                                  {!cat.locked && (
                                    <button
                                      onClick={async () => {
                                        const error = await deleteSubcategory(cat.id, sub.id);
                                        if (error) alert(error);
                                      }}
                                      className="text-neutral-500 hover:text-red-400 font-bold cursor-pointer"
                                    >
                                      ×
                                    </button>
                                  )}
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
                        {!cat.locked && (
                          <button
                            onClick={() => setSelectedCatForSub(cat.id)}
                            className="text-white font-bold hover:underline cursor-pointer"
                          >
                            + Agregar
                          </button>
                        )}
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
