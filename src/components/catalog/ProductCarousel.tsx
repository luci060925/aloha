import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../../types';
import { useStore } from '../../context/StoreContext';

interface ProductCarouselProps {
  id: string;
  title: string;
  products: Product[];
}

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount).replace('ARS', '$').trim();

/** Carrusel chico de prendas (foto, nombre y precio). Al tocar una prenda se abre su detalle. No se muestra si no hay prendas. */
export const ProductCarousel: React.FC<ProductCarouselProps> = ({ id, title, products }) => {
  const { setSelectedProductForDetail } = useStore();
  const trackRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: 'smooth' });
  };

  return (
    <section id={id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12 text-white">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="font-serif text-lg sm:text-xl font-bold tracking-[0.15em] uppercase text-white">{title}</h2>

        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            aria-label={`${title}: ver anteriores`}
            className="w-8 h-8 rounded-full border border-neutral-700 text-white hover:bg-white hover:text-black transition-colors flex items-center justify-center cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            aria-label={`${title}: ver más`}
            className="w-8 h-8 rounded-full border border-neutral-700 text-white hover:bg-white hover:text-black transition-colors flex items-center justify-center cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map(product => {
          const discount = product.originalPrice && product.originalPrice > product.price
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : 0;
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => setSelectedProductForDetail(product)}
              className="group snap-start shrink-0 text-left cursor-pointer w-[calc((100%-1.125rem)/2.5)] sm:w-[calc((100%-2.25rem)/4)] lg:w-[calc((100%-3.75rem)/6)]"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900 border border-neutral-800 rounded-sm">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                {discount > 0 && (
                  <span className="absolute top-1.5 left-1.5 bg-white text-black text-[9px] font-mono uppercase px-1.5 py-0.5 font-bold rounded">
                    -{discount}%
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[11px] sm:text-xs font-medium text-white truncate">{product.name}</p>
              <p className="text-[11px] sm:text-xs font-mono font-bold text-neutral-200">
                {formatPrice(product.price)}
                {discount > 0 && product.originalPrice && (
                  <span className="ml-1.5 text-neutral-500 line-through font-normal">{formatPrice(product.originalPrice)}</span>
                )}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
};
