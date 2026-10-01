import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { MAGNOLIA_CATEGORY } from '../../data/fixedCategories';

/** Bloque del inicio de la línea Magnolia Intimates (bordó y blanco). Cada subcategoría lleva al catálogo ya filtrado. */
export const MagnoliaSection: React.FC = () => {
  const { setSelectedCategory, setSelectedSubcategory } = useStore();

  const goTo = (subSlug: string) => {
    setSelectedCategory(MAGNOLIA_CATEGORY.slug);
    setSelectedSubcategory(subSlug);
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="magnolia-intimates" className="bg-[#6D1A2C] text-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-5 text-center lg:text-left">
          <span className="block text-[10px] sm:text-xs uppercase tracking-[0.35em] text-white/70 font-mono font-bold">
            Nuestra línea íntima
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-wide mt-2">{MAGNOLIA_CATEGORY.name}</h2>
          <p className="mt-3 text-sm sm:text-base text-white/80 font-medium">
            Lencería, pijamas, medias y conjuntos.
          </p>
          <button
            type="button"
            onClick={() => goTo('all')}
            className="mt-6 inline-flex items-center gap-2.5 px-7 py-3 bg-white text-[#6D1A2C] text-xs uppercase tracking-[0.2em] font-bold hover:bg-neutral-100 transition-colors cursor-pointer rounded"
          >
            <span>Ver toda la línea</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="lg:col-span-7 grid grid-cols-2 gap-3 sm:gap-4">
          {MAGNOLIA_CATEGORY.subcategories?.map(sub => (
            <button
              key={sub.id}
              type="button"
              onClick={() => goTo(sub.slug)}
              className="group flex items-center justify-between gap-3 px-5 py-6 sm:py-8 border border-white/30 hover:bg-white hover:text-[#6D1A2C] transition-colors cursor-pointer rounded-xl text-left"
            >
              <span className="font-serif text-lg sm:text-2xl font-bold">{sub.name}</span>
              <ArrowRight className="w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
