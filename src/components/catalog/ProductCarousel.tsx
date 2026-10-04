import React, { useEffect, useRef } from 'react';
import { ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product } from '../../types';
import { useStore } from '../../context/StoreContext';

interface ProductCarouselProps {
  id: string;
  eyebrow: string;
  title: string;
  products: Product[];
}

const AUTOPLAY_MS = 4500;
const PAUSE_AFTER_TOUCH_MS = 10000;

const formatPrice = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount).replace('ARS', '$').trim();

/**
 * Carrusel del inicio: una franja con fondo propio y tarjetas con el nombre y el precio sobre la foto,
 * distinto de la grilla de "Todas las Prendas". Avanza solo (se frena al tocarlo o pasar el mouse) y,
 * si la persona prefiere menos movimiento, no se mueve solo. No se muestra si no hay prendas.
 */
export const ProductCarousel: React.FC<ProductCarouselProps> = ({ id, eyebrow, title, products }) => {
  const { setSelectedProductForDetail } = useStore();
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedUntil = useRef(0);
  const hovering = useRef(false);

  const count = products.length;
  useEffect(() => {
    if (count === 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      const track = trackRef.current;
      if (!track || hovering.current || document.hidden || Date.now() < pausedUntil.current) return;
      if (track.scrollWidth <= track.clientWidth + 4) return; // todas las prendas entran: no hace falta mover
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      if (atEnd) track.scrollTo({ left: 0, behavior: 'smooth' });
      else track.scrollBy({ left: track.clientWidth * 0.6, behavior: 'smooth' });
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    pausedUntil.current = Date.now() + PAUSE_AFTER_TOUCH_MS;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: 'smooth' });
  };

  const goToCatalog = () => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section id={id} className="bg-[#101010] border-b border-neutral-800/80 py-8 sm:py-10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <span className="block text-[10px] sm:text-xs uppercase tracking-[0.3em] text-neutral-500 font-mono font-bold">{eyebrow}</span>
            <h2 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold uppercase tracking-[0.12em] text-white mt-0.5">{title}</h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={goToCatalog}
              className="sm:hidden inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-300 cursor-pointer"
            >
              Ver todas <ArrowDown className="w-3 h-3" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollByPage(-1)}
                aria-label={`${title}: ver anteriores`}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white text-white hover:text-black transition-colors flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByPage(1)}
                aria-label={`${title}: ver más`}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white text-white hover:text-black transition-colors flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={trackRef}
          onMouseEnter={() => { hovering.current = true; }}
          onMouseLeave={() => { hovering.current = false; }}
          onTouchStart={() => { pausedUntil.current = Date.now() + PAUSE_AFTER_TOUCH_MS; }}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                className="group relative snap-start shrink-0 aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-900 text-left cursor-pointer w-[calc((100%-0.9rem)/2.2)] sm:w-[calc((100%-1.5rem)/3)] lg:w-[calc((100%-3rem)/5)]"
              >
                <img
                  src={product.images[0]}
                  alt={product.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1">
                  {discount > 0 && (
                    <span className="bg-white text-black text-[10px] font-mono uppercase px-2 py-0.5 font-bold rounded-full">
                      -{discount}%
                    </span>
                  )}
                  {product.lastInStock && (
                    <span className="bg-amber-400 text-black text-[9px] sm:text-[10px] font-mono uppercase whitespace-nowrap px-1.5 sm:px-2 py-0.5 font-bold rounded">
                      Último en stock
                    </span>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                  <p className="text-xs sm:text-sm font-semibold text-white line-clamp-1">{product.name}</p>
                  <p className="text-sm sm:text-base font-sans font-bold tracking-tight tabular-nums text-white mt-0.5">
                    {formatPrice(product.price)}
                    {discount > 0 && product.originalPrice && (
                      <span className="ml-1.5 text-xs text-white/50 line-through font-medium">{formatPrice(product.originalPrice)}</span>
                    )}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
