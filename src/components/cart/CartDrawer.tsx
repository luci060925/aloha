import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  Tag, 
  CheckCircle2, 
  MessageSquare, 
  AlertCircle, 
  Sparkles,
  PackageCheck,
  Clock,
  ExternalLink,
  Lock
} from 'lucide-react';
import { openExternal } from '../../lib/external';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    cartCount,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartSubtotal,
    cartDiscount,
    isVolumeDiscountApplied,
    cartTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    checkoutViaWhatsApp,
    currentUser,
    setIsAuthModalOpen,
    setIsProfileModalOpen,
    settings,
    orders,
    refreshOrders,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'cart' | 'orders'>('cart');
  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Al abrir la bolsa se trae el estado actualizado de los pedidos desde la base
  useEffect(() => {
    if (isCartOpen) refreshOrders();
  }, [isCartOpen, refreshOrders]);

  if (!isCartOpen) return null;

  // Filter orders strictly for the active logged-in user
  const userOrders = currentUser
    ? orders.filter(o => 
        (o.userId && o.userId === currentUser.id) || 
        (currentUser.email && o.userId === currentUser.email) || 
        (currentUser.phone && o.customerPhone && o.customerPhone === currentUser.phone)
      )
    : [];

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount).replace('ARS', '$').trim();
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = await applyCoupon(couponInput);
    if (res.success) {
      setCouponFeedback({ type: 'success', text: res.message });
      setCouponInput('');
    } else {
      setCouponFeedback({ type: 'error', text: res.message });
    }
  };

  const handleCheckout = async () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsSubmittingOrder(true);
    try {
      const { recorded } = await checkoutViaWhatsApp();
      if (!recorded) {
        alert('Tu mensaje de WhatsApp está listo para enviar, pero no pudimos registrar el pedido en el sitio (por ejemplo, porque cambió un precio o venció un cupón). Confirmá el detalle con Aloha por WhatsApp.');
      }
      setTimeout(() => {
        setIsSubmittingOrder(false);
        setActiveTab('orders'); // Switch to orders tab to show tracking
      }, 1000);
    } catch (err) {
      console.error(err);
      setIsSubmittingOrder(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return {
          label: 'Compra Entregada',
          badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-700/80',
          dotClass: 'bg-emerald-400'
        };
      case 'confirmed':
        return {
          label: 'Pago Aprobado • En Preparación',
          badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700',
          dotClass: 'bg-emerald-400 animate-pulse'
        };
      case 'contacted':
        return {
          label: 'Contactado vía WhatsApp',
          badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-700',
          dotClass: 'bg-sky-400'
        };
      case 'cancelled':
        return {
          label: 'Cancelado',
          badgeClass: 'bg-red-950/80 text-red-300 border-red-700',
          dotClass: 'bg-red-400'
        };
      case 'whatsapp_sent':
      case 'pending':
      default:
        return {
          label: 'Pedido WhatsApp Enviado',
          badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-700',
          dotClass: 'bg-amber-400 animate-pulse'
        };
    }
  };

  const itemsNeededForVolume = settings.volumeDiscountActive 
    ? Math.max(0, settings.volumeDiscountMinItems - cartCount) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity cursor-pointer"
      />

      {/* Drawer Container (Full width on phones, max-w-md on desktop) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-md bg-[#101010] text-white shadow-2xl flex flex-col justify-between border-l border-neutral-800 h-full">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-800 bg-[#141414] shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-serif text-lg sm:text-xl tracking-wider uppercase font-bold text-white">
                  Bolsa & Pedidos
                </h2>
              </div>
              
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-neutral-400 hover:text-white rounded-full transition-colors cursor-pointer hover:bg-neutral-800 border border-neutral-800"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Top Tab Switcher */}
            <div className="grid grid-cols-2 gap-1.5 mt-3.5 p-1 bg-black rounded-xl border border-neutral-800">
              <button
                onClick={() => setActiveTab('cart')}
                className={`py-2 px-3 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'cart'
                    ? 'bg-white text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>Mi Bolsa</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'cart' ? 'bg-black text-white' : 'bg-neutral-800 text-neutral-300'
                }`}>
                  {cartCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`py-2 px-3 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'orders'
                    ? 'bg-white text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>Mis Pedidos</span>
                {userOrders.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'orders' ? 'bg-black text-white' : 'bg-neutral-800 text-neutral-300'
                  }`}>
                    {userOrders.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* TAB 1: MI BOLSA DE COMPRAS */}
          {activeTab === 'cart' && (
            <>
              {/* Volume Discount Alert Banner */}
              {settings.volumeDiscountActive && cart.length > 0 && (
                <div className={`py-2 px-4 text-xs font-mono flex items-center gap-2 border-b shrink-0 ${
                  isVolumeDiscountApplied
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 font-bold'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800 font-semibold'
                }`}>
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-white" />
                  {isVolumeDiscountApplied ? (
                    <span className="truncate">
                      ¡Descuento activado! <strong>-{settings.volumeDiscountPercentage}% OFF</strong>
                    </span>
                  ) : (
                    <span className="truncate">
                      Sumá <strong>{itemsNeededForVolume} prenda{itemsNeededForVolume > 1 ? 's' : ''} más</strong> y obtené <strong>{settings.volumeDiscountPercentage}% OFF</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Cart Items Scrollable List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 text-neutral-400">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 shadow-md">
                      <ShoppingBag className="w-8 h-8 text-neutral-500" />
                    </div>
                    <p className="font-serif text-2xl text-white font-bold">Tu bolsa está vacía</p>
                    <p className="text-xs text-neutral-400 mt-1 max-w-xs font-medium">
                      Explorá nuestras prendas seleccionadas y coordiná tu pedido por WhatsApp.
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="mt-6 px-6 py-3 bg-white text-black text-xs uppercase tracking-[0.2em] font-bold hover:bg-neutral-200 transition-colors cursor-pointer rounded-xl shadow-md"
                    >
                      Ver Catálogo
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2.5">
                      {cart.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-3 p-3 bg-neutral-900/90 border border-neutral-800 rounded-2xl relative items-center shadow-sm"
                        >
                          {/* Thumbnail */}
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-20 h-24 object-cover shrink-0 border border-neutral-800 rounded-xl"
                          />

                          {/* Info */}
                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <div className="flex justify-between items-start gap-1.5">
                                <h4 className="font-serif text-sm font-bold text-white line-clamp-1">
                                  {item.product.name}
                                </h4>
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="text-neutral-500 hover:text-red-400 transition-colors p-1 cursor-pointer shrink-0"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Attributes badge */}
                              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono">
                                <span className="bg-[#171717] px-2 py-0.5 border border-neutral-700 font-bold text-white rounded-md">
                                  Talle {item.selectedSize}
                                </span>
                                <span className="inline-flex items-center gap-1 bg-[#171717] px-2 py-0.5 border border-neutral-700 text-neutral-300 font-semibold rounded-md truncate">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-neutral-600 shrink-0"
                                    style={{ backgroundColor: item.selectedColor.hex }}
                                  />
                                  <span className="truncate">{item.selectedColor.name}</span>
                                </span>
                              </div>
                            </div>

                            {/* Quantity and Price */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800/80">
                              <div className="flex items-center border border-neutral-700 bg-neutral-800 rounded-lg overflow-hidden">
                                <button
                                  onClick={() => updateCartQuantity(item.id, -1)}
                                  className="w-7 h-7 flex items-center justify-center text-xs font-mono font-bold hover:bg-neutral-700 cursor-pointer text-white"
                                >
                                  -
                                </button>
                                <span className="w-7 text-center font-mono text-xs font-bold text-white">{item.quantity}</span>
                                <button
                                  onClick={() => updateCartQuantity(item.id, 1)}
                                  className="w-7 h-7 flex items-center justify-center text-xs font-mono font-bold hover:bg-neutral-700 cursor-pointer text-white"
                                >
                                  +
                                </button>
                              </div>

                              <span className="font-mono text-sm font-bold text-white">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Clear Cart Button */}
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={clearCart}
                        className="text-[11px] text-neutral-400 hover:text-red-400 underline font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Vaciar bolsa
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Footer / Summary / Checkout (Fixed to bottom with safe-area spacing) */}
              {cart.length > 0 && (
                <div className="p-4 sm:p-5 bg-[#141414] border-t border-neutral-800 space-y-3.5 shadow-2xl shrink-0 pb-6 sm:pb-5">
                  
                  {/* Single Coupon Section */}
                  {appliedCoupon ? (
                    <div className="p-3 bg-emerald-950/70 border border-emerald-700/80 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white uppercase">{appliedCoupon.code}</span>
                            <span className="text-[10px] bg-emerald-900 border border-emerald-600 px-2 py-0.5 rounded text-emerald-200 font-mono font-bold">
                              {appliedCoupon.discountPercentage > 0
                                ? `-${appliedCoupon.discountPercentage}% OFF`
                                : `-${formatPrice(appliedCoupon.fixedDiscount || 0)} OFF`}
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-300/80 block mt-0.5 font-medium">
                            Cupón aplicado (máximo 1 cupón por compra)
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          removeCoupon();
                          setCouponFeedback(null);
                        }}
                        className="text-neutral-400 hover:text-red-400 text-[11px] underline font-bold cursor-pointer shrink-0 transition-colors"
                      >
                        Quitar cupón
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            placeholder="Cupón de descuento"
                            className="w-full pl-8 pr-3 py-2 text-xs uppercase tracking-wider border border-neutral-700 bg-neutral-900 text-white focus:outline-none focus:border-white font-mono font-bold placeholder:text-neutral-500 rounded-xl"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-white text-black text-xs uppercase tracking-wider font-bold hover:bg-neutral-200 transition-colors cursor-pointer rounded-xl shadow-sm"
                        >
                          Aplicar
                        </button>
                      </div>

                      {couponFeedback && (
                        <div className={`text-[11px] font-medium flex items-center gap-1 ${
                          couponFeedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {couponFeedback.type === 'success' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{couponFeedback.text}</span>
                        </div>
                      )}
                    </form>
                  )}

                  {/* Summary */}
                  <div className="space-y-1.5 text-xs border-t border-neutral-800 pt-2.5">
                    <div className="flex justify-between text-neutral-400 font-medium">
                      <span>Subtotal:</span>
                      <span className="font-mono font-bold text-white">{formatPrice(cartSubtotal)}</span>
                    </div>

                    {cartDiscount > 0 && (
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span>
                          {appliedCoupon 
                            ? `Cupón (${appliedCoupon.code}):`
                            : isVolumeDiscountApplied 
                            ? `Descuento por volumen (${settings.volumeDiscountPercentage}%):` 
                            : 'Descuento aplicado:'}
                        </span>
                        <span className="font-mono">-{formatPrice(cartDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-base font-bold text-white border-t border-neutral-800 pt-2 mt-2">
                      <span className="uppercase tracking-wider">Total a pagar:</span>
                      <span className="font-mono text-xl text-white">{formatPrice(cartTotal)}</span>
                    </div>
                  </div>

                  {/* Auth Requirement on Checkout */}
                  {!currentUser ? (
                    <div className="p-3 bg-neutral-900 border border-neutral-750 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
                        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Debés ingresar para confirmar tu pedido.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAuthModalOpen(true)}
                        className="w-full py-3 bg-white text-black text-xs uppercase tracking-wider font-bold hover:bg-neutral-200 transition-colors rounded-xl cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Iniciá sesión para comprar</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      {currentUser.address?.postalCode && (
                        <div className="text-[11px] text-neutral-300 bg-neutral-900 p-2.5 border border-neutral-800 rounded-xl">
                          <span className="font-bold text-white">Cliente:</span> {currentUser.fullName} (CP: {currentUser.address.postalCode} • Tel: {currentUser.phone || 'N/A'})
                        </div>
                      )}

                      {!currentUser.phone?.trim() ? (
                        // Sin teléfono no se puede coordinar la entrega (pasa con las cuentas creadas con Google)
                        <div className="p-3 bg-neutral-900 border border-neutral-750 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>Sumá tu teléfono para coordinar la entrega.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCartOpen(false);
                              setIsProfileModalOpen(true);
                            }}
                            className="w-full py-3 bg-white text-black text-xs uppercase tracking-wider font-bold hover:bg-neutral-200 transition-colors rounded-xl cursor-pointer"
                          >
                            Completar mi perfil
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleCheckout}
                          disabled={isSubmittingOrder}
                          className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg cursor-pointer rounded-xl"
                        >
                          <MessageSquare className="w-4 h-4 fill-white shrink-0" />
                          <span>{isSubmittingOrder ? 'Generando Pedido...' : 'Finalizar Compra vía WhatsApp'}</span>
                          <ArrowRight className="w-4 h-4 shrink-0" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* TAB 2: MIS PEDIDOS */}
          {activeTab === 'orders' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {!currentUser ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-neutral-400">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 shadow-md">
                    <Lock className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="font-serif text-2xl text-white font-bold">Iniciá sesión para ver tus pedidos</p>
                  <p className="text-xs text-neutral-400 mt-2 max-w-xs font-medium leading-relaxed">
                    Accedé con tu cuenta para ver el historial y realizar seguimiento en tiempo real de todas tus compras.
                  </p>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="mt-6 px-6 py-3.5 bg-white text-black text-xs uppercase tracking-[0.2em] font-bold hover:bg-neutral-200 transition-colors cursor-pointer rounded-xl flex items-center gap-2 shadow-lg"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Iniciar Sesión / Registrarme</span>
                  </button>
                </div>
              ) : userOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-neutral-400">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 shadow-md">
                    <PackageCheck className="w-8 h-8 text-neutral-500" />
                  </div>
                  <p className="font-serif text-2xl text-white font-bold">No tenés pedidos registrados</p>
                  <p className="text-xs text-neutral-400 mt-1 max-w-xs font-medium">
                    Cuando finalices un pedido por WhatsApp, vas a poder seguir el estado de tu compra en tiempo real desde acá.
                  </p>
                  <button
                    onClick={() => setActiveTab('cart')}
                    className="mt-6 px-6 py-3 bg-white text-black text-xs uppercase tracking-[0.2em] font-bold hover:bg-neutral-200 transition-colors cursor-pointer rounded-xl shadow-md"
                  >
                    Ir a Mi Bolsa
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                      Historial ({userOrders.length} pedido{userOrders.length > 1 ? 's' : ''})
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Estado al día
                    </span>
                  </div>

                  {userOrders.map((ord) => {
                    const badge = getStatusBadge(ord.status);

                    return (
                      <div
                        key={ord.id}
                        className="p-4 bg-neutral-900/90 border border-neutral-800 rounded-2xl space-y-3 shadow-sm"
                      >
                        {/* Order Card Header (Mobile responsive flex) */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
                          <div>
                            <span className="font-mono text-xs font-bold text-white block">
                              {ord.id}
                            </span>
                            <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-neutral-500" />
                              {new Date(ord.createdAt).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {/* Live Status Badge */}
                          <div className={`px-2.5 py-1 rounded-full border text-[10px] font-mono uppercase font-bold flex items-center gap-1.5 w-fit ${badge.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                            <span>{badge.label}</span>
                          </div>
                        </div>

                        {/* Order Items Breakdown */}
                        <div className="space-y-1.5 text-xs">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-neutral-300 gap-2">
                              <div className="flex items-center gap-2 truncate min-w-0">
                                <span className="font-mono text-neutral-500 shrink-0">{item.quantity}x</span>
                                <span className="text-white font-medium truncate">{item.name}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-neutral-800 rounded text-neutral-400 shrink-0">
                                  {item.size} • {item.color}
                                </span>
                              </div>
                              <span className="font-mono text-neutral-400 shrink-0">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Order Total & Consultation WhatsApp Action */}
                        <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] uppercase font-mono text-neutral-500 block">Total</span>
                            <span className="font-mono text-base font-bold text-white">
                              {formatPrice(ord.total)}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              const phone = settings.whatsappNumber.replace(/[^0-9]/g, '');
                              const msg = encodeURIComponent(`Hola Aloha! Quería consultar sobre el estado de mi pedido ${ord.id}.`);
                              openExternal(`https://wa.me/${phone}?text=${msg}`);
                            }}
                            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer border border-neutral-700 shadow-sm"
                            title="Consultar por WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Consultar</span>
                            <ExternalLink className="w-3 h-3 text-neutral-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
