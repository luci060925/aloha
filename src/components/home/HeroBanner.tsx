import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { openExternal, safeUrl } from '../../lib/external';

export const HeroBanner: React.FC = () => {
  const { setSelectedCategory, settings } = useStore();

  const handleExplore = () => {
    setSelectedCategory('all');
    const el = document.getElementById('catalogo');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const bgImage = settings.heroImageUrl || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2000';
  const titleText = settings.heroTitle || 'Elegancia & Estilo';
  const subtitleText = settings.heroSubtitle || 'Prendas esenciales y diseño contemporáneo pensados para acompañar tu día a día con distinción.';

  return (
    <section className="relative bg-black text-white overflow-hidden">
      {/* Background with soft contrast overlay */}
      <div className="absolute inset-0 z-0 transition-all duration-500">
        <img
          src={bgImage}
          alt={settings.storeName || 'Aloha Indumentaria'}
          className="w-full h-full object-cover object-center"
        />
        {/* Velo oscuro para que el texto blanco se lea sobre fotos claras, sin quitarle el color a la foto */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/70" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32 flex flex-col items-center text-center">
        
        {/* Main Headline */}
        <h1 className="font-['Bebas_Neue'] text-4xl sm:text-5xl lg:text-6xl font-normal uppercase tracking-[0.1em] leading-tight max-w-4xl text-white">
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
            <span>Ver Catálogo</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => openExternal(safeUrl(settings.instagramUrl))}
            className="w-full sm:w-auto px-8 py-3.5 border border-white/70 bg-black/40 text-white text-xs uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer backdrop-blur-sm rounded"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <span>Instagram</span>
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
