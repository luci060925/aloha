import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { isOneSizeList, oneSizeLabel } from '../../lib/sizes';
import { Heart, Eye, ShoppingBag, Edit3, Trash2, Lock, Star, Hourglass, PackageX, MoreHorizontal } from 'lucide-react';

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
    deleteProduct,
    updateProduct,
    toggleProductStock,
  } = useStore();
  
  const [isHovered, setIsHovered] = useState(false);
  const [selectedQuickSize, setSelectedQuickSize] = useState(product.sizes[0] || 'U');
  const [selectedQuickColor, setSelectedQuickColor] = useState(product.colors[0] || { name: 'Negro', hex: '#000000' });
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  // Menú de acciones de la administradora (los tres puntos) y su confirmación para eliminar
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const closeMenu = () => {
    setMenuOpen(false);
    setConfirmingDelete(false);
  };

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

  const handleAdminDelete = async () => {
    try {
      await deleteProduct(product.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo eliminar la prenda.');
      closeMenu();
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
          } ${product.inStock ? '' : 'grayscale'}`}
          loading="lazy"
        />

        {/* Secondary Image for Hover Flip */}
        {product.images[1] && (
          <img
            src={product.images[1]}
            alt={`${product.name} - Vista`}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out ${
              isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
            } ${product.inStock ? '' : 'grayscale'}`}
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
          {currentUser?.isAdmin && product.featured && (
            <span className="inline-flex items-center gap-1 bg-white text-black text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 font-bold shadow-md rounded">
              <Star className="w-3 h-3 fill-black" aria-hidden="true" /> Destacada
            </span>
          )}
          {product.lastInStock && product.inStock && (
            <span className="bg-red-600 text-white text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 font-bold shadow-md rounded">
              Último en stock
            </span>
          )}
          {!product.inStock && (
            <span className="bg-neutral-800 text-white border border-neutral-600 text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 font-bold shadow-md rounded">
              Agotado
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

          {/* Acciones de la administradora, dentro de un solo menú */}
          {currentUser?.isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (menuOpen) closeMenu();
                else setMenuOpen(true);
              }}
              className={`p-2 rounded-full transition-all shadow-md cursor-pointer border ${
                menuOpen ? 'bg-white text-black border-white' : 'bg-black/80 backdrop-blur-sm text-white hover:bg-black border-neutral-700'
              }`}
              title="Acciones de la prenda"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Menú de la administradora: una hoja que sale desde abajo en el celular y una ventana chica en la computadora.
            Se dibuja fuera de la tarjeta (en el body) para que la foto no la recorte. */}
        {currentUser?.isAdmin && menuOpen && createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={(e) => {
              e.stopPropagation();
              closeMenu();
            }}
          >
            <div
              role="menu"
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-sm bg-[#121212] border border-neutral-800 rounded-t-3xl sm:rounded-2xl p-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl"
            >
              <div className="sm:hidden w-12 h-1.5 bg-neutral-700 rounded-full mx-auto mb-3" />
              <p className="px-3 pb-2 text-[11px] uppercase tracking-wider text-neutral-500 font-mono truncate">{product.name}</p>

              {confirmingDelete ? (
                <div className="p-3 space-y-4 text-center">
                  <p className="text-base font-semibold text-white leading-snug">
                    ¿Seguro que querés eliminar «{product.name}»?
                  </p>
                  <p className="text-sm text-neutral-400">No se puede deshacer.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={closeMenu}
                      className="py-3.5 rounded-xl border border-neutral-600 text-sm font-bold uppercase tracking-wider text-neutral-200 hover:bg-neutral-800 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAdminDelete}
                      className="py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm font-bold uppercase tracking-wider text-white cursor-pointer"
                    >
                      Sí, eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {[
                    {
                      key: 'featured',
                      icon: <Star className={`w-5 h-5 ${product.featured ? 'fill-white' : ''}`} />,
                      label: product.featured ? 'Quitar de destacadas' : 'Marcar como destacada',
                      run: () => updateProduct(product.id, { featured: !product.featured }),
                    },
                    {
                      key: 'last',
                      icon: <Hourglass className="w-5 h-5" />,
                      label: product.lastInStock ? 'Quitar "Último en stock"' : 'Marcar "Último en stock"',
                      run: () => updateProduct(product.id, { lastInStock: !product.lastInStock }),
                    },
                    {
                      key: 'stock',
                      icon: <PackageX className="w-5 h-5" />,
                      label: product.inStock ? 'Marcar como agotada' : 'Volver a poner en stock',
                      run: () => toggleProductStock(product.id),
                    },
                  ].map(item => (
                    <button
                      key={item.key}
                      role="menuitem"
                      onClick={async () => {
                        closeMenu();
                        try {
                          await item.run();
                        } catch (err) {
                          alert(err instanceof Error ? err.message : 'No se pudo guardar el cambio.');
                        }
                      }}
                      className="w-full flex items-center gap-3.5 px-3 py-3.5 rounded-xl text-left text-[15px] font-semibold text-neutral-100 hover:bg-neutral-800 cursor-pointer"
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                  <button
                    role="menuitem"
                    onClick={(e) => {
                      closeMenu();
                      handleAdminEdit(e);
                    }}
                    className="w-full flex items-center gap-3.5 px-3 py-3.5 rounded-xl text-left text-[15px] font-semibold text-neutral-100 hover:bg-neutral-800 cursor-pointer"
                  >
                    <Edit3 className="w-5 h-5 shrink-0" />
                    <span>Modificar prenda</span>
                  </button>
                  <div className="my-1.5 h-px bg-neutral-800" />
                  <button
                    role="menuitem"
                    onClick={() => setConfirmingDelete(true)}
                    className="w-full flex items-center gap-3.5 px-3 py-3.5 rounded-xl text-left text-[15px] font-semibold text-red-400 hover:bg-red-950/60 cursor-pointer"
                  >
                    <Trash2 className="w-5 h-5 shrink-0" />
                    <span>Eliminar prenda</span>
                  </button>
                  <button
                    onClick={closeMenu}
                    className="mt-2 w-full py-3.5 rounded-xl border border-neutral-700 text-sm font-bold uppercase tracking-wider text-neutral-300 hover:bg-neutral-800 cursor-pointer"
                  >
                    Cerrar
                  </button>
                </>
              )}
            </div>
          </div>,
          document.body
        )}

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
            {product.productType || product.subcategory || product.category}
          </span>
        </div>

        {/* Product Title */}
        <h3 
          onClick={() => setSelectedProductForDetail(product)}
          className="font-serif text-lg font-bold text-white hover:underline underline-offset-4 cursor-pointer line-clamp-1"
        >
          {product.name}
        </h3>

        {/* Price & Discount */}
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-sans text-base font-bold tracking-tight tabular-nums text-white">
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

