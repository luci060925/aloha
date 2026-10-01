import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { MAGNOLIA_CATEGORY } from '../../data/fixedCategories';

/** Bloque del inicio de la línea Magnolia Intimates: panel oscuro con acentos bordó. Lleva al catálogo filtrado por la línea. */
export const MagnoliaSection: React.FC = () => {
  const { setSelectedCategory, setSelectedSubcategory } = useStore();

  const goToLine = () => {
    setSelectedCategory(MAGNOLIA_CATEGORY.slug);
    setSelectedSubcategory('all');
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="magnolia-intimates" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-white">
      <div className="relative overflow-hidden rounded-2xl border border-[#6D1A2C]/60 bg-gradient-to-br from-[#2A0F18] via-[#1B0B11] to-[#120709] px-6 py-10 sm:px-10 sm:py-14 text-center">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#6D1A2C]/25 blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative">
          <span className="block text-[10px] sm:text-xs uppercase tracking-[0.35em] text-[#C98A9A] font-mono font-bold">
            Nuestra línea íntima
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-wide mt-2">{MAGNOLIA_CATEGORY.name}</h2>
          <p className="mt-3 text-sm sm:text-base text-neutral-300 font-medium">
            Lencería, pijamas, medias y conjuntos.
          </p>
          <button
            type="button"
            onClick={goToLine}
            className="mt-6 inline-flex items-center gap-2.5 px-6 py-3 bg-[#6D1A2C] hover:bg-[#8E2A42] text-white text-xs uppercase tracking-[0.2em] font-bold transition-colors cursor-pointer rounded"
          >
            <span>Ver toda la línea</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
