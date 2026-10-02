import React, { useState } from 'react';
import type { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { isOneSizeList, oneSizeLabel } from '../../lib/sizes';
import { Heart, Eye, ShoppingBag, Edit3, Trash2, Lock } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { 
    setSelectedProductForDetail, 
    toggleWishlist, 
    isInWishlist, 
    addToCart,
    currentUser,
    setIsAuthModalOpen,
    openEditProductModal,
    deleteProduct
  } = useStore();
  
  const [isHovered, setIsHovered] = useState(false);
  const [selectedQuickSize, setSelectedQuickSize] = useState(product.sizes[0] || 'U');
  const [selectedQuickColor, setSelectedQuickColor] = useState(product.colors[0] || { name: 'Negro', hex: '#000000' });
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  const inWish = isInWishlist(product.id);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount).replace('ARS', '$').trim();
  };

  const handleQuickAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, selectedQuickSize, selectedQuickColor, 1);
    setShowQuickAdd(false);
  };

  const handleAdminEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    openEditProductModal(product);
  };

  const handleAdminDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`¿Estás segura de eliminar la prenda "${product.name}" del catálogo?`)) {
      try {
        await deleteProduct(product.id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'No se pudo eliminar la prenda.');
      }
    }
  };

  return (
    <div 
      className="group flex flex-col h-full relative bg-[#141414] border border-neutral-800 hover:border-neutral-600 rounded-xl overflow-hidden shadow-lg shadow-black/30 transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowQuickAdd(false);
      }}
    >
      {/* Image Showcase Container */}
      <div 
        onClick={() => setSelectedProductForDetail(product)}
        className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-900 cursor-pointer"
      >
        {/* Primary Image */}
        <img
          src={product.images[0]}
          alt={product.name}
          className={`w-full h-full object-cover object-center transition-all duration-700 ease-out ${
            isHovered && product.images[1] ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          }`}
          loading="lazy"
        />

        {/* Secondary Image for Hover Flip */}
        {product.images[1] && (
          <img
            src={product.images[1]}
            alt={`${product.name} - Vista`}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out ${
              isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
            }`}
            loading="lazy"
          />
        )}

        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {discountPercent > 0 && (
            <span className="bg-white text-black text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 font-bold shadow-md rounded">
              -{discountPercent}% OFF
            </span>
          )}
          {product.isNewArrival && (
            <span className="bg-[#141414] text-white border border-neutral-700 text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 font-bold shadow-md rounded">
              NEW DROP
            </span>
          )}
          {!product.inStock && (
            <span className="bg-neutral-800 text-neutral-400 text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 font-bold rounded">
              PAUSADO
            </span>
          )}
        </div>

        {/* Top Right Floating Controls (Wishlist + Admin quick tools) */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            className="p-2 rounded-full bg-black/80 backdrop-blur-sm text-white hover:bg-black transition-all shadow-md cursor-pointer border border-neutral-700"
            title={inWish ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <Heart className={`w-4 h-4 transition-colors ${inWish ? 'fill-white text-white' : 'text-neutral-400'}`} />
          </button>

          {/* Admin Direct Actions on Card */}
          {currentUser?.isAdmin && (
            <>
              <button
                onClick={handleAdminEdit}
                className="p-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-all shadow-md cursor-pointer border border-neutral-600"
                title="Modificar prenda (Admin)"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleAdminDelete}
                className="p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all shadow-md cursor-pointer"
                title="Eliminar prenda (Admin)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {/* Quick View Button Hover Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between gap-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProductForDetail(product);
            }}
            className="flex-1 py-2 px-3 bg-white text-black text-[11px] uppercase tracking-[0.15em] font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer rounded"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Detalle</span>
          </button>

          {product.inStock && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!currentUser) {
                  setIsAuthModalOpen(true);
                } else {
                  setShowQuickAdd(!showQuickAdd);
                }
              }}
              className="py-2 px-3 bg-neutral-800 text-white text-[11px] uppercase tracking-[0.15em] font-bold hover:bg-neutral-700 transition-colors flex items-center justify-center gap-1.5 shadow-md border border-neutral-700 cursor-pointer rounded"
              title={currentUser ? "Agregar rápido" : "Iniciá sesión para comprar"}
            >
              {currentUser ? (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>+</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-neutral-300" />
                  <span>Ingresar</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Quick Add Inline Panel */}
        {showQuickAdd && product.inStock && currentUser && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 bg-[#121212]/98 backdrop-blur-md p-3.5 border-t border-neutral-700 z-20 animate-fade-in shadow-2xl text-white rounded-b"
          >
            {isOneSizeList(product.sizes) ? (
              <div className="text-[11px] font-semibold mb-2.5 text-neutral-200">{oneSizeLabel(product.sizes[0])}</div>
            ) : (
              <>
                <div className="text-[11px] uppercase tracking-wider font-bold mb-1.5 text-neutral-300">
                  Seleccionar Talle:
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedQuickSize(size)}
                      className={`text-xs px-2.5 py-1 font-mono font-bold border transition-colors cursor-pointer rounded ${
                        selectedQuickSize === size
                          ? 'bg-white text-black border-white'
                          : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:border-white'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="text-[11px] uppercase tracking-wider font-bold mb-1 text-neutral-300">
              Color: <span className="font-semibold text-white">{selectedQuickColor.name}</span>
            </div>
            <div className="flex items-center gap-2 mb-3">
              {product.colors.map(color => (
                <button
                  key={color.name}
                  onClick={() => setSelectedQuickColor(color)}
                  className={`w-4.5 h-4.5 rounded-full border cursor-pointer transition-transform ${
                    selectedQuickColor.name === color.name ? 'ring-2 ring-white scale-110' : 'border-neutral-600'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>

            <button
              onClick={handleQuickAddToCart}
              className="w-full py-2.5 bg-white text-black text-xs uppercase tracking-[0.15em] font-bold hover:bg-neutral-200 transition-colors cursor-pointer rounded shadow-sm"
            >
              Confirmar & Agregar
            </button>
          </div>
        )}
      </div>

      {/* Product Details Section */}
      <div className="p-3.5 flex flex-col flex-1 border-t border-neutral-800">
        {/* Colors & Talles Preview */}
        <div className="flex items-center justify-between gap-1.5 mb-1">
          <div className="flex items-center gap-1.5">
            {product.colors.map((color, idx) => (
              <span
                key={idx}
                className="w-2.5 h-2.5 rounded-full border border-neutral-700 inline-block"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
          <span className="text-[10px] text-neutral-500 font-mono font-bold uppercase">
            {product.subcategory || product.category}
          </span>
        </div>

        {/* Product Title */}
        <h3 
          onClick={() => setSelectedProductForDetail(product)}
          className="font-serif text-base font-bold text-white hover:underline underline-offset-4 cursor-pointer line-clamp-1"
        >
          {product.name}
        </h3>

        {/* Price & Discount */}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-sans text-lg font-bold tracking-tight tabular-nums text-white">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="font-sans text-xs text-neutral-500 line-through font-medium tabular-nums">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

