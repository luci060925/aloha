import type { CartItem, Coupon, Product, StoreSettings } from '../types';

/** Tope de unidades por prenda en un pedido. La base aplica el mismo límite (supabase/hardening_seguridad.sql). */
export const MAX_ITEM_QUANTITY = 50;

export interface CartTotals {
  count: number;
  subtotal: number;
  discount: number;
  total: number;
  isVolumeDiscountApplied: boolean;
}

/**
 * Totales de la bolsa. Regla: se aplica UN solo descuento, en este orden de prioridad:
 * cupón → volumen (cantidad de prendas) → monto mínimo → descuento global.
 *
 * ⚠️ La base valida los pedidos con las mismas reglas (función validate_order en
 * supabase/hardening_seguridad.sql). Si se cambia algo acá, hay que cambiarlo allá.
 */
export function calculateCartTotals(cart: CartItem[], settings: StoreSettings, coupon: Coupon | null): CartTotals {
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  let discount = 0;
  let isVolumeDiscountApplied = false;

  if (coupon && coupon.isActive) {
    const eligibleSubtotal = coupon.targetCategory && coupon.targetCategory !== 'all'
      ? cart.filter(it => it.product.category === coupon.targetCategory).reduce((acc, it) => acc + it.price * it.quantity, 0)
      : subtotal;

    if (coupon.discountPercentage > 0) {
      discount = Math.round((eligibleSubtotal * coupon.discountPercentage) / 100);
    } else if (coupon.fixedDiscount) {
      discount = Math.min(coupon.fixedDiscount, eligibleSubtotal);
    }
  } else if (settings.volumeDiscountActive && count >= settings.volumeDiscountMinItems && settings.volumeDiscountPercentage > 0) {
    discount = Math.round((subtotal * settings.volumeDiscountPercentage) / 100);
    isVolumeDiscountApplied = true;
  } else if (settings.priceDiscountActive && settings.priceDiscountMinAmount && subtotal >= settings.priceDiscountMinAmount && (settings.priceDiscountPercentage || 0) > 0) {
    discount = Math.round((subtotal * (settings.priceDiscountPercentage || 0)) / 100);
  } else if (settings.globalDiscountActive && settings.globalDiscountPercentage > 0) {
    discount = Math.round((subtotal * settings.globalDiscountPercentage) / 100);
  }

  return { count, subtotal, discount, total: Math.max(0, subtotal - discount), isVolumeDiscountApplied };
}

/**
 * Alinea la bolsa con el catálogo vigente: precio actual, sin prendas borradas o agotadas y con cantidad topeada.
 * Así una bolsa guardada días atrás no viaja con precios viejos (la base rechazaría ese pedido).
 */
export function syncCartWithCatalog(cart: CartItem[], products: Product[]): CartItem[] {
  const byId = new Map(products.map(p => [p.id, p]));
  return cart.flatMap(item => {
    const product = byId.get(item.productId);
    if (!product || !product.inStock) return [];
    return [{ ...item, product, price: product.price, quantity: Math.min(item.quantity, MAX_ITEM_QUANTITY) }];
  });
}
