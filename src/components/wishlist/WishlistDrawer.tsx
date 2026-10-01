import React from 'react';
import { useStore } from '../../context/StoreContext';
import type { Product } from '../../types';
import { X, Heart, ShoppingBag, Trash2, ArrowRight, Lock } from 'lucide-react';

export const WishlistDrawer: React.FC = () => {
  const {
    isWishlistOpen,
    setIsWishlistOpen,
    wishlist,
    products,
    toggleWishlist,
    addToCart,
    setIsCartOpen,
    setSelectedProductForDetail,
    currentUser,
    setIsAuthModalOpen,
  } = useStore();

  if (!isWishlistOpen) return null;

  const favoriteProducts = products.filter(p => wishlist.includes(p.id));

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount).replace('ARS', '$').trim();
  };

  const handleAddToCart = (product: Product) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const defaultSize = product.sizes[0] || 'U';
    const defaultColor = product.colors[0] || { name: 'Negro', hex: '#000000' };
    addToCart(product, defaultSize, defaultColor, 1);
    setIsWishlistOpen(false);
    setIsCartOpen(true);
  };

  const handleAddAllToCart = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    favoriteProducts.forEach(prod => {
      if (prod.inStock) {
        addToCart(prod, prod.sizes[0] || 'U', prod.colors[0] || { name: 'Negro', hex: '#000000' }, 1);
      }
    });
    setIsWishlistOpen(false);
    setIsCartOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div 
        onClick={() => setIsWishlistOpen(false)}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over Container: full screen width on mobile (pl-0), bounded on desktop */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-[#101010] text-white flex flex-col shadow-2xl border-l border-neutral-800 h-full">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-800 flex items-center justify-between bg-[#141414] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-400 shadow-inner">
                <Heart className="w-4.5 h-4.5 fill-current" />
              </div>
              <div>
                <h2 className="font-serif text-sm sm:text-base font-bold uppercase tracking-widest text-white">
                  Tus Favoritos
                </h2>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {favoriteProducts.length} {favoriteProducts.length === 1 ? 'prenda guardada' : 'prendas guardadas'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsWishlistOpen(false)}
              className="p-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors cursor-pointer active:scale-95"
              title="Cerrar favoritos"
              aria-label="Cerrar favoritos"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 overscroll-contain">
            {favoriteProducts.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                  <Heart className="w-8 h-8 stroke-1" />
                </div>
                <div className="space-y-1 px-4">
                  <p className="font-serif text-base font-medium uppercase tracking-wider text-white">
                    Tu lista de deseos está vacía
                  </p>
                  <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                    Guardá las prendas que más te gusten tocando el ícono de corazón en cualquier producto para no perderlas de vista.
                  </p>
                </div>
                <button
                  onClick={() => setIsWishlistOpen(false)}
                  className="mt-4 px-6 py-2.5 bg-white text-black text-xs uppercase tracking-[0.2em] font-semibold hover:bg-neutral-200 transition-colors cursor-pointer rounded"
                >
                  Explorar Colección
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {favoriteProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="flex gap-3 p-3 bg-neutral-900/80 border border-neutral-800 rounded-lg hover:border-neutral-700 transition-all group"
                  >
                    {/* 3:4 Thumbnail */}
                    <div
                      onClick={() => {
                        setSelectedProductForDetail(prod);
                        setIsWishlistOpen(false);
                      }}
                      className="w-20 aspect-[3/4] bg-neutral-950 shrink-0 overflow-hidden cursor-pointer rounded border border-neutral-800 relative"
                    >
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        style={{ objectPosition: prod.imagePosition || '50% 50%' }}
                      />
                      {!prod.inStock && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-[9px] font-bold uppercase tracking-wider text-red-400 text-center px-1">
                          Sin Stock
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-1.5">
                          <h3 
                            onClick={() => {
                              setSelectedProductForDetail(prod);
                              setIsWishlistOpen(false);
                            }}
                            className="font-serif text-xs sm:text-sm font-semibold uppercase tracking-wide truncate cursor-pointer hover:text-neutral-300 text-white"
                          >
                            {prod.name}
                          </h3>
                          <button
                            onClick={() => toggleWishlist(prod.id)}
                            className="text-neutral-500 hover:text-red-400 p-1 cursor-pointer transition-colors active:scale-90 shrink-0"
                            title="Quitar de favoritos"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono truncate mt-0.5">
                          {prod.category} {prod.subcategory ? `• ${prod.subcategory}` : ''}
                        </p>

                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="font-sans font-bold text-base tracking-tight tabular-nums text-white">
                            {formatPrice(prod.price)}
                          </span>
                          {prod.originalPrice && (
                            <span className="text-[11px] text-neutral-500 line-through font-sans font-medium tabular-nums">
                              {formatPrice(prod.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Add to Bag CTA */}
                      <button
                        onClick={() => handleAddToCart(prod)}
                        disabled={!prod.inStock}
                        className={`w-full mt-2.5 py-2 px-3 text-[11px] uppercase tracking-wider font-semibold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-[0.98] ${
                          prod.inStock
                            ? 'bg-white text-black hover:bg-neutral-200'
                            : 'bg-neutral-800/60 text-neutral-500 cursor-not-allowed border border-neutral-700/50'
                        }`}
                      >
                        {!currentUser ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-neutral-600" />
                            <span>Iniciá Sesión para Comprar</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>{prod.inStock ? 'Mover a la Bolsa' : 'Sin Stock'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          {favoriteProducts.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-neutral-800 bg-[#141414] shrink-0 space-y-2 pb-safe">
              <button
                onClick={handleAddAllToCart}
                className="w-full py-3.5 bg-white text-black text-xs uppercase tracking-[0.2em] font-bold hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 cursor-pointer rounded shadow-md active:scale-[0.98]"
              >
                {!currentUser ? (
                  <>
                    <Lock className="w-4 h-4 text-black" />
                    <span>Iniciá Sesión para Agregar Todo</span>
                  </>
                ) : (
                  <>
                    <span>Agregar Todos a la Bolsa</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
