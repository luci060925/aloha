import React, { useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from './ProductCard';

const MAX_ITEMS = 10;

/** Carrusel con las últimas prendas cargadas al catálogo (las más nuevas primero, solo con stock). */
export const NewArrivalsCarousel: React.FC = () => {
  const { products } = useStore();
  const trackRef = useRef<HTMLDivElement>(null);

  const latest = useMemo(
    () =>
      products
        .filter(p => p.inStock)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, MAX_ITEMS),
    [products],
  );

  if (latest.length === 0) return null;

  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: 'smooth' });
  };

  return (
    <section id="ultimos-ingresos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 text-white">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-neutral-400 font-mono font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Recién llegadas</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-wide uppercase text-white">
            Últimos Ingresos
          </h2>
        </div>

        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            aria-label="Ver prendas anteriores"
            className="w-10 h-10 rounded-full border border-neutral-700 text-white hover:bg-white hover:text-black transition-colors flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            aria-label="Ver más prendas"
            className="w-10 h-10 rounded-full border border-neutral-700 text-white hover:bg-white hover:text-black transition-colors flex items-center justify-center cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {latest.map(product => (
          <div key={product.id} className="snap-start shrink-0 w-[62%] sm:w-[calc((100%-3rem)/3)] lg:w-[calc((100%-4.5rem)/4)]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
};
