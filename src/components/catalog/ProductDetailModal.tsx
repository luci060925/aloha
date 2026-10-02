import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import type { Product } from '../../types';
import { X, Heart, ShoppingBag, Ruler, Check, ShieldCheck, Truck, RotateCcw, Lock } from 'lucide-react';
import { SizeGuideModal } from './SizeGuideModal';

// Se monta una vez por prenda (ver `key` abajo): talle, color y cantidad arrancan de cero sin efectos de sincronización
const ProductDetailContent: React.FC<{ product: Product }> = ({ product }) => {
  const {
    setSelectedProductForDetail,
    addToCart,
    toggleWishlist,
    isInWishlist,
    currentUser,
    setIsAuthModalOpen
  } = useStore();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'U');
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string } | null>(
    product.colors[0] || { name: 'Negro', hex: '#000000' }
  );
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const inWish = isInWishlist(product.id);

  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount).replace('ARS', '$').trim();
  };

  const handleAction = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!selectedColor) return;
    addToCart(product, selectedSize, selectedColor, quantity);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      setSelectedProductForDetail(null);
    }, 600);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in overflow-hidden">
        {/* Modal Container */}
        <div className="bg-[#121212] text-white w-full max-h-[92vh] sm:max-h-[90vh] sm:max-w-4xl relative shadow-2xl border-t sm:border border-neutral-800 rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden">
          
          {/* Mobile Handle Indicator */}
          <div className="sm:hidden w-12 h-1.5 bg-neutral-700 rounded-full mx-auto my-2.5 shrink-0" />

          {/* Close button */}
          <button
            onClick={() => setSelectedProductForDetail(null)}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 p-2 bg-neutral-900/90 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer border border-neutral-700 shadow-md"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Scrollable Body */}
          <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto flex-1 pb-24 sm:pb-0">
            
            {/* Left: Gallery */}
            <div className="p-4 sm:p-6 bg-[#161616] flex flex-col justify-between border-b md:border-b-0 md:border-r border-neutral-800">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-900 border border-neutral-800 rounded-xl">
                <img
                  src={product.images[selectedImageIndex] || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                />
                
                {discountPercent > 0 && (
                  <span className="absolute top-3 left-3 bg-white text-black text-xs font-mono tracking-widest uppercase px-2.5 py-1 font-bold shadow-md rounded">
                    -{discountPercent}% OFF
                  </span>
                )}
                {product.isNewArrival && (
                  <span className="absolute top-3 right-3 bg-black/80 text-white border border-neutral-700 text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 font-bold shadow-md rounded">
                    NEW DROP
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-2.5 mt-3 overflow-x-auto pb-1.5 scrollbar-thin">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-16 h-20 shrink-0 border-2 overflow-hidden cursor-pointer rounded-lg transition-all ${
                        selectedImageIndex === idx 
                          ? 'border-white ring-2 ring-white/30 scale-105' 
                          : 'border-neutral-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Details & Options */}
            <div className="p-5 sm:p-7 md:p-8 flex flex-col justify-between space-y-6 bg-[#121212]">
              <div className="space-y-4">
                {/* Category & Wishlist */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-neutral-400 font-mono font-bold">
                    {product.subcategory ? `${product.category} • ${product.subcategory}` : product.category}
                  </span>
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer bg-neutral-900 px-3 py-1.5 rounded-full border border-neutral-800"
                  >
                    <Heart className={`w-3.5 h-3.5 ${inWish ? 'fill-white text-white' : ''}`} />
                    <span className="font-medium">{inWish ? 'Guardado' : 'Favorito'}</span>
                  </button>
                </div>

                {/* Title */}
                <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                  {product.name}
                </h2>

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="font-sans text-3xl sm:text-4xl font-bold tracking-tight tabular-nums text-white">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="font-sans text-base text-neutral-500 line-through font-medium tabular-nums">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed border-t border-b border-neutral-800 py-3.5">
                  {product.description}
                </p>

                {/* Size Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase tracking-[0.15em] font-semibold text-neutral-300">
                      Talle: <span className="font-bold font-mono text-white">{selectedSize}</span>
                    </span>
                    <button
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="text-[11px] text-neutral-400 hover:text-white underline underline-offset-4 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Ruler className="w-3 h-3" />
                      Guía de Talles
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[48px] h-11 px-3.5 flex items-center justify-center font-mono text-xs border uppercase tracking-wider transition-all cursor-pointer rounded-xl ${
                          selectedSize === size
                            ? 'bg-white text-black border-white font-bold shadow-md scale-105'
                            : 'bg-neutral-900 text-neutral-300 border-neutral-700 hover:border-white hover:text-white'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <div className="text-xs uppercase tracking-[0.15em] font-semibold text-neutral-300 mb-2">
                    Color: <span className="font-bold text-white">{selectedColor?.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {product.colors.map(color => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color)}
                        className={`group relative p-1 rounded-full border-2 transition-all cursor-pointer ${
                          selectedColor?.name === color.name ? 'border-white scale-110' : 'border-transparent hover:border-neutral-600'
                        }`}
                        title={color.name}
                      >
                        <span
                          className="block w-7 h-7 rounded-full border border-neutral-600 shadow-inner"
                          style={{ backgroundColor: color.hex }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs uppercase tracking-[0.15em] font-semibold text-neutral-300">
                    Cantidad:
                  </span>
                  <div className="flex items-center border border-neutral-700 bg-neutral-900 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-9 h-9 flex items-center justify-center text-sm font-mono hover:bg-neutral-800 cursor-pointer text-white font-bold"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-mono text-xs font-bold text-white">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-9 h-9 flex items-center justify-center text-sm font-mono hover:bg-neutral-800 cursor-pointer text-white font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Garantías (escritorio) */}
              <div className="hidden sm:grid grid-cols-3 gap-2.5 pt-3 border-t border-neutral-800">
                {[
                  { Icon: Truck, title: 'Envíos a todo el país', text: 'Despachamos tu pedido donde estés.' },
                  { Icon: ShieldCheck, title: 'Asesoramiento personalizado', text: 'Te ayudamos a elegir tu talle y a combinar.' },
                  { Icon: RotateCcw, title: 'Cambios de talle o modelo', text: '7 días desde que la recibís.' },
                ].map(({ Icon, title, text }) => (
                  <div key={title} className="flex flex-col items-center text-center gap-1.5 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                    <Icon className="w-5 h-5 text-white" aria-hidden="true" />
                    <span className="text-[11px] font-bold text-white leading-tight">{title}</span>
                    <span className="text-[10px] text-neutral-400 leading-snug">{text}</span>
                  </div>
                ))}
              </div>

              {/* Desktop CTA Button */}
              <div className="hidden sm:block pt-2">
                <button
                  onClick={handleAction}
                  disabled={!product.inStock}
                  className={`w-full py-4 text-xs uppercase tracking-[0.25em] font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg cursor-pointer rounded-xl ${
                    !product.inStock
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      : !currentUser
                      ? 'bg-neutral-900 border border-neutral-700 hover:border-white text-white hover:bg-neutral-800'
                      : addedAnimation
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-black hover:bg-neutral-200'
                  }`}
                >
                  {addedAnimation ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>¡Agregado a la Bolsa!</span>
                    </>
                  ) : !product.inStock ? (
                    <span>Agotado Temporalmente</span>
                  ) : !currentUser ? (
                    <>
                      <Lock className="w-4 h-4 text-neutral-400" />
                      <span>Iniciá sesión para comprar</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Agregar a la Bolsa • {formatPrice(product.price * quantity)}</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

          {/* Sticky Mobile Bottom Bar */}
          <div className="sm:hidden absolute bottom-0 inset-x-0 p-3 bg-[#141414]/95 backdrop-blur-md border-t border-neutral-800 z-30 shadow-2xl">
            <button
              onClick={handleAction}
              disabled={!product.inStock}
              className={`w-full py-3.5 text-xs uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer rounded-xl ${
                !product.inStock
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : !currentUser
                  ? 'bg-neutral-900 border border-neutral-700 text-white active:bg-neutral-800'
                  : addedAnimation
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-black active:bg-neutral-200'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Agregado a la Bolsa!</span>
                </>
              ) : !product.inStock ? (
                <span>Agotado</span>
              ) : !currentUser ? (
                <>
                  <Lock className="w-4 h-4 text-neutral-400" />
                  <span>Iniciá sesión para comprar</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Agregar a la Bolsa • {formatPrice(product.price * quantity)}</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />
    </>
  );
};


export const ProductDetailModal: React.FC = () => {
  const { selectedProductForDetail } = useStore();

  if (!selectedProductForDetail) return null;
  return <ProductDetailContent key={selectedProductForDetail.id} product={selectedProductForDetail} />;
};
