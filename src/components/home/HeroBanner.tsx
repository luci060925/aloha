import React from 'react';
import { ArrowRight, MapPin, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const HeroBanner: React.FC = () => {
  const { setSelectedCategory, setIsLocationModalOpen, settings } = useStore();

  const handleExplore = () => {
    setSelectedCategory('all');
    const el = document.getElementById('catalogo');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const bgImage = settings.heroImageUrl || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2000';
  const badgeText = settings.heroBadgeText || 'Nueva Colección 2026';
  const titleText = settings.heroTitle || 'Elegancia & Estilo';
  const subtitleText = settings.heroSubtitle || 'Prendas esenciales y diseño contemporáneo pensados para acompañar tu día a día con distinción.';
  const primaryBtnText = settings.heroPrimaryBtnText || 'Ver Catálogo';
  const secondaryBtnText = settings.heroSecondaryBtnText || 'Ver Showroom';

  return (
    <section className="relative bg-black text-white overflow-hidden">
      {/* Background with soft contrast overlay */}
      <div className="absolute inset-0 z-0 opacity-40 transition-all duration-500">
        <img
          src={bgImage}
          alt={settings.storeName || 'Aloha Indumentaria'}
          className="w-full h-full object-cover object-center grayscale"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32 flex flex-col items-center text-center">
        
        {/* Badge */}
        {badgeText && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/20 bg-black/70 backdrop-blur-md rounded-full text-xs uppercase tracking-[0.25em] font-bold text-neutral-200 mb-5 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
            <span>{badgeText}</span>
          </div>
        )}

        {/* Main Headline */}
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold uppercase tracking-widest leading-tight max-w-4xl text-white">
          {titleText}
        </h1>

        {subtitleText && (
          <p className="mt-4 text-sm sm:text-base text-neutral-300 max-w-lg font-medium tracking-wide leading-relaxed">
            {subtitleText}
          </p>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={handleExplore}
            className="w-full sm:w-auto px-8 py-3.5 bg-white text-black text-xs uppercase tracking-[0.2em] font-bold hover:bg-neutral-200 transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer rounded shadow-lg"
          >
            <span>{primaryBtnText}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="w-full sm:w-auto px-8 py-3.5 border border-white/70 bg-black/40 text-white text-xs uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer backdrop-blur-sm rounded"
          >
            <MapPin className="w-4 h-4" />
            <span>{secondaryBtnText}</span>
          </button>
        </div>

        {/* Info points */}
        <div className="mt-12 pt-8 border-t border-white/15 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-left w-full max-w-3xl">
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">Variedad</span>
            <p className="font-sans text-xs sm:text-sm font-bold text-white mt-0.5">Talles & Colores Reales</p>
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">Atención</span>
            <p className="font-sans text-xs sm:text-sm font-bold text-white mt-0.5">Directa por WhatsApp</p>
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">Envíos</span>
            <p className="font-sans text-xs sm:text-sm font-bold text-white mt-0.5">A Todo el País</p>
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold">Espacio</span>
            <p className="font-sans text-xs sm:text-sm font-bold text-white mt-0.5">Showroom Exclusivo</p>
          </div>
        </div>

      </div>
    </section>
  );
};
