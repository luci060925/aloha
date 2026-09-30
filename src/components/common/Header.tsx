import React, { useState } from 'react';
import { 
  ShoppingBag, 
  User, 
  MapPin, 
  Menu, 
  X, 
  ShieldCheck, 
  Heart,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { BrandLogo } from './BrandLogo';
import { safeUrl, isTrustedAvatarUrl } from '../../lib/external';

export const Header: React.FC = () => {
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    cartCount,
    setIsCartOpen,
    currentUser,
    setIsAuthModalOpen,
    setIsProfileModalOpen,
    setIsLocationModalOpen,
    setCurrentView,
    settings,
    wishlist,
    setIsWishlistOpen,
    setActiveInfoModal,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(slug);
    setMobileMenuOpen(false);
    const catalogEl = document.getElementById('catalogo');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-black text-white text-[11px] md:text-xs py-2.5 px-4 font-semibold tracking-[0.18em] uppercase text-center border-b border-neutral-800 flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-neutral-300 animate-pulse shrink-0" />
        <span className="truncate">{settings.announcementText}</span>
        <button 
          onClick={() => setIsLocationModalOpen(true)}
          className="hidden md:inline-flex items-center gap-1 underline underline-offset-4 hover:text-neutral-300 ml-2 font-bold cursor-pointer shrink-0"
        >
          <MapPin className="w-3.5 h-3.5" />
          Showroom
        </button>
      </div>

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-neutral-800 text-white transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 items-center h-20">
            
            {/* Left Column: Hamburger Menu Button (Universal for PC & Mobile) */}
            <div className="flex items-center justify-start">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-full transition-colors cursor-pointer flex items-center gap-2 group"
                aria-label="Abrir menú"
                title="Menú"
              >
                <Menu className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Center Column: Brand Logo (Always Centered) */}
            <div className="flex items-center justify-center text-center">
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedCategory('all');
                  setSelectedSubcategory('all');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center group cursor-pointer py-1"
                title="Aloha Indumentaria"
              >
                <BrandLogo className="h-10 sm:h-12 w-auto" variant="light" />
              </a>
            </div>

            {/* Right Column: Action Icons (Favoritos, Carrito, Mi Perfil al extremo) */}
            <div className="flex items-center justify-end gap-2 sm:gap-3">
              
              {/* 1. Favoritos / Wishlist */}
              <button
                onClick={() => setIsWishlistOpen(true)}
                className="relative p-2.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
                title="Favoritos"
                aria-label="Favoritos"
              >
                <Heart className={`w-5 h-5 transition-transform duration-200 active:scale-125 ${wishlist.length > 0 ? 'fill-white text-white' : ''}`} />
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 bg-white text-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold font-mono shadow-xs">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* 2. Bolsa / Carrito */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
                title="Bolsa de compras"
                aria-label="Bolsa de compras"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 bg-white text-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold font-mono shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* 3. Mi Perfil / Iniciar Sesión (Esquina derecha del todo) */}
              {currentUser ? (
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="p-2 sm:p-2.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-full transition-colors cursor-pointer relative"
                  title={`Perfil de ${currentUser.fullName}`}
                  aria-label="Mi Perfil"
                >
                  {isTrustedAvatarUrl(currentUser.avatarUrl) ? (
                    <img 
                      src={currentUser.avatarUrl} 
                      alt={currentUser.fullName} 
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full object-cover border border-neutral-500"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-bold">
                      {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  {currentUser.isAdmin && (
                    <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black" />
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="p-2.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-full transition-colors cursor-pointer"
                  title="Mi Perfil / Ingresar"
                  aria-label="Mi Perfil"
                >
                  <User className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Unified Lateral Menu Drawer (PC & Mobile) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fade-in">
          {/* Backdrop click to close */}
          <div 
            className="fixed inset-0 cursor-pointer" 
            onClick={() => setMobileMenuOpen(false)} 
          />

          <div className="fixed inset-y-0 left-0 max-w-sm w-full bg-[#101010] text-white shadow-2xl z-50 flex flex-col justify-between p-6 overflow-y-auto border-r border-neutral-800 animate-slide-in-left">
            <div>
              {/* Header inside drawer */}
              <div className="relative flex items-center justify-center pb-5 border-b border-neutral-800">
                <BrandLogo className="h-8 w-auto mx-auto" variant="light" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="absolute right-0 top-1 p-2 text-neutral-400 hover:text-white rounded-full cursor-pointer hover:bg-neutral-800 transition-colors"
                  aria-label="Cerrar menú"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categorías Principales */}
              <div className="py-5">
                <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-bold mb-3 font-mono">
                  Colecciones
                </p>

                {/* Todas las Prendas */}
                <button
                  onClick={() => {
                    handleCategoryClick('all');
                    setSelectedSubcategory('all');
                  }}
                  className={`w-full text-left text-xs uppercase tracking-[0.15em] py-2.5 px-3 rounded-lg transition-all cursor-pointer font-bold mb-1 ${
                    selectedCategory === 'all'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  Todas las Prendas
                </button>

                {/* Categories List */}
                <div className="flex flex-col space-y-1.5">
                  {categories.filter(c => c.slug !== 'all').map((cat) => {
                    const isCatSelected = selectedCategory === cat.slug;
                    const hasSubs = cat.subcategories && cat.subcategories.length > 0;
                    const isExpanded = expandedCategory === cat.slug;

                    return (
                      <div key={cat.id} className="rounded-lg overflow-hidden border border-neutral-850 bg-neutral-900/30">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => {
                              if (hasSubs) {
                                setExpandedCategory(isExpanded ? null : cat.slug);
                              } else {
                                handleCategoryClick(cat.slug);
                                setSelectedSubcategory('all');
                              }
                            }}
                            className={`flex-1 text-left text-xs uppercase tracking-[0.14em] py-2.5 px-3 transition-colors cursor-pointer font-bold flex items-center justify-between ${
                              isCatSelected
                                ? 'text-white bg-neutral-800'
                                : 'text-neutral-300 hover:text-white hover:bg-neutral-850'
                            }`}
                          >
                            <span>{cat.name}</span>
                          </button>

                          {hasSubs && (
                            <button
                              onClick={() => setExpandedCategory(isExpanded ? null : cat.slug)}
                              className="p-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                              title="Ver subcategorías"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Subcategories Accordion */}
                        {hasSubs && isExpanded && (
                          <div className="bg-black/60 border-t border-neutral-800/80 px-2 py-2 space-y-1">
                            <button
                              onClick={() => {
                                setSelectedCategory(cat.slug);
                                setSelectedSubcategory('all');
                                setMobileMenuOpen(false);
                                const catalogEl = document.getElementById('catalogo');
                                if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className={`w-full text-left text-[11px] uppercase tracking-wider py-1.5 px-3 rounded-md cursor-pointer font-bold transition-colors ${
                                isCatSelected && selectedSubcategory === 'all'
                                  ? 'bg-white text-black'
                                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                              }`}
                            >
                              Ver Todo en {cat.name}
                            </button>

                            {cat.subcategories?.map((sub) => (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setSelectedCategory(cat.slug);
                                  setSelectedSubcategory(sub.slug);
                                  setMobileMenuOpen(false);
                                  const catalogEl = document.getElementById('catalogo');
                                  if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className={`w-full text-left text-[11px] uppercase tracking-wider py-1.5 px-3 rounded-md cursor-pointer transition-colors flex items-center gap-1.5 ${
                                  isCatSelected && selectedSubcategory === sub.slug
                                    ? 'bg-white text-black font-bold'
                                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                                }`}
                              >
                                <span className="text-neutral-500">↳</span>
                                <span>{sub.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Accesos Directos Solicitados: Como comprar, contacto, politica de devolucion, terminos y condiciones */}
              <div className="py-4 border-t border-neutral-800 space-y-2">
                <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-bold mb-2 font-mono">
                  Accesos Directos
                </p>

                {/* 1. ¿Cómo Comprar? */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setActiveInfoModal('como-comprar');
                  }}
                  className="w-full text-left text-xs uppercase tracking-wider text-neutral-300 hover:text-white font-semibold py-2 px-3 rounded hover:bg-neutral-900 transition-colors cursor-pointer"
                >
                  ¿Cómo Comprar?
                </button>

                {/* 2. Contacto */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setActiveInfoModal('contacto');
                  }}
                  className="w-full text-left text-xs uppercase tracking-wider text-neutral-300 hover:text-white font-semibold py-2 px-3 rounded hover:bg-neutral-900 transition-colors cursor-pointer"
                >
                  Sobre Nosotras
                </button>

                {/* 3. Política de Devolución */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setActiveInfoModal('devoluciones');
                  }}
                  className="w-full text-left text-xs uppercase tracking-wider text-neutral-300 hover:text-white font-semibold py-2 px-3 rounded hover:bg-neutral-900 transition-colors cursor-pointer"
                >
                  Política de Devolución
                </button>

                {/* 4. Términos y Condiciones */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setActiveInfoModal('terminos');
                  }}
                  className="w-full text-left text-xs uppercase tracking-wider text-neutral-300 hover:text-white font-semibold py-2 px-3 rounded hover:bg-neutral-900 transition-colors cursor-pointer"
                >
                  Términos y Condiciones
                </button>

                {/* 5. Botón de Arrepentimiento (compras online) */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setActiveInfoModal('arrepentimiento');
                  }}
                  className="w-full text-left text-xs uppercase tracking-wider text-neutral-300 hover:text-white font-semibold py-2 px-3 rounded hover:bg-neutral-900 transition-colors cursor-pointer"
                >
                  Botón de Arrepentimiento
                </button>
              </div>
            </div>

            {/* Bottom Section: Social Media Icons & Admin */}
            <div className="border-t border-neutral-800 pt-4 space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 font-bold mb-2.5 font-mono text-center">
                  Redes Sociales Oficiales
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {/* Instagram */}
                  <a
                    href={safeUrl(settings.instagramUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center justify-center p-2.5 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all group"
                    title={`Instagram @${settings.instagramHandle}`}
                  >
                    <svg className="w-5 h-5 fill-neutral-300 group-hover:fill-pink-500 transition-colors" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span className="text-[9px] font-mono text-neutral-400 mt-1 group-hover:text-white">Insta</span>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center justify-center p-2.5 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all group"
                    title="WhatsApp Oficial"
                  >
                    <svg className="w-5 h-5 fill-neutral-300 group-hover:fill-emerald-400 transition-colors" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                    <span className="text-[9px] font-mono text-neutral-400 mt-1 group-hover:text-white">Wsp</span>
                  </a>

                  {/* TikTok */}
                  <a
                    href={safeUrl(settings.tiktokUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center justify-center p-2.5 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all group"
                    title="TikTok de Aloha"
                    aria-label="TikTok de Aloha"
                  >
                    <svg className="w-5 h-5 fill-neutral-300 group-hover:fill-cyan-400 transition-colors" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.47 2.77 1.43-.03 2.72-.94 3.19-2.31.25-.66.31-1.38.3-2.09l.01-14.73z"/>
                    </svg>
                    <span className="text-[9px] font-mono text-neutral-400 mt-1 group-hover:text-white">TikTok</span>
                  </a>

                  {/* Facebook */}
                  <a
                    href={safeUrl(settings.facebookUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center justify-center p-2.5 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all group"
                    title="Facebook Aloha Indumentaria"
                    aria-label="Facebook de Aloha"
                  >
                    <svg className="w-5 h-5 fill-neutral-300 group-hover:fill-blue-500 transition-colors" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="text-[9px] font-mono text-neutral-400 mt-1 group-hover:text-white">FB</span>
                  </a>
                </div>
              </div>

              {currentUser?.isAdmin && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setCurrentView('admin');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white text-black hover:bg-neutral-200 text-xs uppercase tracking-[0.15em] font-bold cursor-pointer rounded-lg transition-colors shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Panel Administrativo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

