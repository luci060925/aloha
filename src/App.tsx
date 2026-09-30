import React, { lazy, Suspense, useMemo } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { HeroBanner } from './components/home/HeroBanner';
import { StoreLocationSection } from './components/home/StoreLocationSection';
import { CatalogGrid } from './components/catalog/CatalogGrid';
import { ProductCarousel } from './components/catalog/ProductCarousel';
import { ProductDetailModal } from './components/catalog/ProductDetailModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { AuthModal } from './components/auth/AuthModal';
import { CustomerProfileModal } from './components/auth/CustomerProfileModal';
import { PasswordRecoveryModal } from './components/auth/PasswordRecoveryModal';
import { StoreLocationModal } from './components/home/StoreLocationModal';
import { InfoModal } from './components/common/InfoModal';
import { WishlistDrawer } from './components/wishlist/WishlistDrawer';
import { Lock, MessageSquare } from 'lucide-react';
import { openExternal } from './lib/external';

// El panel de administración solo lo usa la dueña: se descarga únicamente al entrar a /admin
const AdminPage = lazy(() => import('./components/admin/AdminPage').then(m => ({ default: m.AdminPage })));

const MainLayout: React.FC = () => {
  const { settings, products } = useStore();

  // Carruseles del inicio: las destacadas (marcadas en la prenda) y las últimas cargadas, solo con stock
  const featuredProducts = useMemo(() => products.filter(p => p.featured && p.inStock).slice(0, 12), [products]);
  const latestProducts = useMemo(
    () => products.filter(p => p.inStock).sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()).slice(0, 10),
    [products],
  );

  const handleFloatingWhatsApp = () => {
    const phone = settings.whatsappNumber.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(`Hola Aloha Indumentaria! Me comunico desde la tienda web para consultar sobre la colección.`);
    openExternal(`https://wa.me/${phone}?text=${msg}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white selection:bg-white selection:text-black">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        {/* Lookbook Hero */}
        <HeroBanner />

        {/* Carruseles chicos: prendas marcadas como destacadas y últimas agregadas */}
        <ProductCarousel id="prendas-destacadas" title="Prendas Destacadas" products={featuredProducts} />
        <ProductCarousel id="ultimas-agregadas" title="Últimas Agregadas" products={latestProducts} />

        {/* Todas las prendas, con filtros y paginación */}
        <CatalogGrid />

        {/* Physical Store Location Section in Comodoro Rivadavia */}
        <StoreLocationSection />
      </main>

      {/* High-Fashion Footer with Terms, Refund, Location & Socials */}
      <Footer />

      {/* Modals & Drawers */}
      <ProductDetailModal />
      <CartDrawer />
      <WishlistDrawer />
      <AuthModal />
      <PasswordRecoveryModal />
      <CustomerProfileModal />
      <StoreLocationModal />
      <InfoModal />

      {/* Floating Action Button (WhatsApp Direct) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={handleFloatingWhatsApp}
          className="w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group"
          title="Consultar por WhatsApp"
          aria-label="WhatsApp"
        >
          <MessageSquare className="w-6 h-6 fill-white" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-semibold uppercase tracking-wider pl-0 group-hover:pl-2">
            WhatsApp
          </span>
        </button>
      </div>
    </div>
  );
};

const AdminGate: React.FC = () => {
  const { currentUser, setCurrentView, setIsAuthModalOpen } = useStore();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4">
        <Lock className="w-7 h-7 text-white" />
      </div>
      <h1 className="font-serif text-2xl font-bold uppercase tracking-wide">Acceso restringido</h1>
      <p className="text-xs text-neutral-400 mt-2 max-w-xs">
        {currentUser
          ? 'Tu cuenta no tiene permisos de administración.'
          : 'Ingresá con la cuenta de administradora para continuar.'}
      </p>
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        {!currentUser && (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-6 py-3 bg-white text-black text-xs uppercase tracking-[0.2em] font-bold hover:bg-neutral-200 transition-colors cursor-pointer rounded-xl"
          >
            Iniciar sesión
          </button>
        )}
        <button
          onClick={() => setCurrentView('shop')}
          className="px-6 py-3 border border-neutral-700 text-neutral-200 text-xs uppercase tracking-[0.2em] font-bold hover:bg-neutral-900 transition-colors cursor-pointer rounded-xl"
        >
          Volver a la tienda
        </button>
      </div>
      <AuthModal />
    </div>
  );
};

const RootView: React.FC = () => {
  const { currentView, currentUser, authReady } = useStore();

  if (currentView === 'admin') {
    // Barrera de interfaz: la protección real de los datos la hace la RLS de Supabase.
    if (!authReady) return <div className="min-h-screen bg-[#0a0a0a]" />; // verificando la sesión
    return currentUser?.isAdmin ? (
      <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
        <AdminPage />
      </Suspense>
    ) : (
      <AdminGate />
    );
  }

  return <MainLayout />;
};

export function App() {
  return (
    <StoreProvider>
      <RootView />
    </StoreProvider>
  );
}

export default App;