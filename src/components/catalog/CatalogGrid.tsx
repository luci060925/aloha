import React, { useMemo, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from './ProductCard';
import { ProductFormModal } from './ProductFormModal';
import { 
  SlidersHorizontal, 
  ArrowUpDown, 
  Search, 
  Sparkles, 
  Plus, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';

export const CatalogGrid: React.FC = () => {
  const {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    selectedSubcategory,
    setSelectedSubcategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    currentUser,
    openCreateProductModal,
  } = useStore();

  // Pagination state (8 products per page). La página vuelve a 1 sola cuando cambia algún filtro.
  const filterKey = `${selectedCategory}|${selectedSubcategory}|${searchQuery}|${sortBy}`;
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const currentPage = pageState.key === filterKey ? pageState.page : 1;
  const setCurrentPage = (page: number) => setPageState({ key: filterKey, page });
  const itemsPerPage = 8;

  // Active Category & Subcategories
  const activeCategoryObj = categories.find(c => c.slug === selectedCategory);
  const availableSubcategories = activeCategoryObj?.subcategories || [];
  const activeSubcategoryObj = availableSubcategories.find(s => s.slug === selectedSubcategory);

  // Filter & Sort logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false;
      }
      // Subcategory filter
      if (selectedSubcategory !== 'all' && product.subcategory !== selectedSubcategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = product.name.toLowerCase().includes(query);
        const matchDesc = product.description.toLowerCase().includes(query);
        const matchCat = product.category.toLowerCase().includes(query);
        const matchSub = product.subcategory?.toLowerCase().includes(query);
        const matchColor = product.colors.some(c => c.name.toLowerCase().includes(query));
        const matchSize = product.sizes.some(s => s.toLowerCase().includes(query));
        if (!matchName && !matchDesc && !matchCat && !matchSub && !matchColor && !matchSize) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [products, selectedCategory, selectedSubcategory, searchQuery, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const catalogEl = document.getElementById('catalogo');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-white">
      
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-neutral-400 font-mono font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>{selectedCategory === 'all' ? 'Colección Disponible' : 'Sección'}</span>
        </div>
        
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-wide uppercase text-white">
          {selectedCategory === 'all' || !activeCategoryObj 
            ? 'Todas las Prendas'
            : activeSubcategoryObj 
              ? `${activeCategoryObj.name} • ${activeSubcategoryObj.name}`
              : activeCategoryObj.name}
        </h2>
        
        <p className="mt-2 text-xs sm:text-sm text-neutral-400 font-medium max-w-md mx-auto">
          {selectedCategory === 'all'
            ? 'Explorá todas las prendas y piezas esenciales de la temporada.'
            : activeCategoryObj?.description || 'Prendas seleccionadas de la nueva temporada.'}
        </p>

        {/* Integrated Catalog Search Bar */}
        <div className="mt-6 max-w-xl mx-auto">
          <div className="relative flex items-center">
            <Search className="w-4.5 h-4.5 text-neutral-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por prenda, corte, color o talle..."
              className="w-full pl-11 pr-10 py-3.5 bg-[#141414] border border-neutral-800 rounded-full text-xs sm:text-sm text-white placeholder:text-neutral-500 font-medium focus:outline-none focus:border-white transition-colors shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 text-neutral-400 hover:text-white p-1 cursor-pointer font-bold text-xs"
                title="Limpiar búsqueda"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chip (if selected from header menu) */}
        {selectedCategory !== 'all' && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-neutral-900 border border-neutral-750 text-white rounded-full text-xs font-mono">
              <span className="text-neutral-400">Colección:</span>
              <strong className="text-white">{activeCategoryObj?.name}</strong>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSubcategory('all');
                }}
                className="ml-1 w-4 h-4 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-xs text-neutral-300 hover:text-white cursor-pointer"
                title="Quitar filtro de colección"
              >
                ×
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Subcategories & Filters Bar */}
      <div className="space-y-4 mb-8">
        
        {/* Subcategories when a specific category is active */}
        {selectedCategory !== 'all' && availableSubcategories.length > 0 && (
          <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3 overflow-x-auto py-2 px-2 border-y border-neutral-800 bg-neutral-950/40 rounded-xl">
            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 font-bold hidden sm:inline mr-1">
              Subcategorías:
            </span>
            <button
              onClick={() => setSelectedSubcategory('all')}
              className={`px-3 py-1 text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap rounded-md ${
                selectedSubcategory === 'all'
                  ? 'bg-neutral-800 text-white font-bold'
                  : 'text-neutral-400 hover:text-white font-medium'
              }`}
            >
              Todos {activeCategoryObj?.name}
            </button>
            {availableSubcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubcategory(sub.slug)}
                className={`px-3 py-1 text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap rounded-md ${
                  selectedSubcategory === sub.slug
                    ? 'bg-neutral-800 text-white font-bold'
                    : 'text-neutral-400 hover:text-white font-medium'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* Admin Contextual Banner */}
        {currentUser?.isAdmin && (
          <div className="p-3.5 bg-neutral-900/90 border border-neutral-750 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse shrink-0" />
              <div>
                <span className="text-xs font-mono font-bold text-white tracking-wide">
                  Panel de Administración Rápida
                </span>
                <span className="text-[11px] text-neutral-400 block">
                  Publicá nuevas prendas directamente en esta colección.
                </span>
              </div>
            </div>

            <button
              onClick={() => openCreateProductModal(
                selectedCategory !== 'all' ? selectedCategory : undefined,
                selectedSubcategory !== 'all' ? selectedSubcategory : undefined
              )}
              className="px-4 py-2 bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-[0.15em] transition-all cursor-pointer rounded-lg flex items-center gap-2 shrink-0 shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>
                Agregar Prenda {activeSubcategoryObj ? `en ${activeSubcategoryObj.name}` : ''}
              </span>
            </button>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-neutral-800 text-xs">
          
          {/* Left: Results Count & Active Search */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-neutral-400 font-medium">
              Mostrando <strong className="text-white font-bold">{paginatedProducts.length}</strong> de <strong className="text-white font-bold">{filteredProducts.length}</strong> prendas
            </span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-800 border border-neutral-700 rounded font-mono text-[11px] font-bold text-white">
                <Search className="w-3 h-3 text-neutral-400" />
                <span>"{searchQuery}"</span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-1 text-neutral-400 hover:text-white font-bold cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          {/* Right: Sort Dropdown */}
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-[#141414] border border-neutral-700 rounded py-1.5 px-2.5 text-xs text-white font-semibold cursor-pointer focus:outline-none focus:border-white"
              >
                <option value="featured" className="bg-neutral-900 text-white">Destacados</option>
                <option value="newest" className="bg-neutral-900 text-white">Más Nuevos</option>
                <option value="price-asc" className="bg-neutral-900 text-white">Precio: Menor a Mayor</option>
                <option value="price-desc" className="bg-neutral-900 text-white">Precio: Mayor a Menor</option>
              </select>
            </div>
          </div>

        </div>

      </div>

      {/* Products Grid (Paginated) */}
      {paginatedProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 sm:gap-y-12 items-stretch">
          {paginatedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-neutral-800 p-8 my-8 rounded bg-neutral-950/60">
          <SlidersHorizontal className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
          <h3 className="font-serif text-2xl font-bold text-white uppercase">No se encontraron prendas</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto font-medium">
            No hay prendas en esta sección o con los filtros aplicados.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            {currentUser?.isAdmin && (
              <button
                onClick={() => openCreateProductModal(
                  selectedCategory !== 'all' ? selectedCategory : undefined,
                  selectedSubcategory !== 'all' ? selectedSubcategory : undefined
                )}
                className="px-5 py-2.5 bg-white text-black text-xs uppercase tracking-wider font-bold hover:bg-neutral-200 transition-colors cursor-pointer rounded"
              >
                + Crear Primera Prenda Aquí
              </button>
            )}
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSubcategory('all');
                setSearchQuery('');
              }}
              className="px-5 py-2.5 bg-neutral-900 border border-neutral-700 text-white text-xs uppercase tracking-wider font-bold hover:bg-neutral-800 transition-colors cursor-pointer rounded"
            >
              Ver Todo el Catálogo
            </button>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-14 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-mono text-neutral-400">
            Página <strong className="text-white font-bold">{currentPage}</strong> de <strong className="text-white font-bold">{totalPages}</strong> ({filteredProducts.length} prendas)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border border-neutral-800 rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1 hover:border-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer bg-[#141414] text-white"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-white text-black font-bold'
                      : 'bg-[#141414] text-neutral-400 border border-neutral-800 hover:border-neutral-600 hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 border border-neutral-800 rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1 hover:border-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer bg-[#141414] text-white"
              title="Página siguiente"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Admin Product Form Modal */}
      <ProductFormModal />

    </section>
  );
};
