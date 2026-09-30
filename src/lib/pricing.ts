import type { CartItem, Coupon, Product } from '../types';

/** Tope de unidades por prenda en un pedido. La base aplica el mismo límite (supabase/hardening_seguridad.sql). */
export const MAX_ITEM_QUANTITY = 50;

/** Un cupón se usa como máximo una vez por clienta y, tras usar uno, no se puede usar otro durante estas horas. */
export const COUPON_COOLDOWN_HOURS = 24;

export interface CartTotals {
  count: number;
  subtotal: number;
  discount: number;
  total: number;
}

/** Tipo de cupón según su condición: por monto, por cantidad de prendas, por categoría o global (toda la tienda). */
export type CouponKind = 'amount' | 'items' | 'category' | 'global';

export const couponKind = (coupon: Coupon): CouponKind => {
  if ((coupon.minAmount ?? 0) > 0) return 'amount';
  if ((coupon.minItems ?? 0) > 0) return 'items';
  if (coupon.targetCategory && coupon.targetCategory !== 'all') return 'category';
  return 'global';
};

const formatArs = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount).replace('ARS', '$').trim();

/**
 * Deja un código de cupón en su forma canónica: sin espacios en los bordes, en mayúsculas y con guiones
 * en lugar de espacios ("verano 10" → "VERANO-10"). Se usa al crearlo y al escribirlo la clienta.
 */
export const normalizeCouponCode = (code: string): string => code.trim().toUpperCase().replace(/\s+/g, '-');

/** Suma de las prendas sobre las que rige el cupón (toda la bolsa, o solo la categoría del cupón). */
export function couponEligibleSubtotal(cart: CartItem[], coupon: Coupon): number {
  const items = coupon.targetCategory && coupon.targetCategory !== 'all'
    ? cart.filter(it => it.product.category === coupon.targetCategory)
    : cart;
  return items.reduce((acc, it) => acc + it.price * it.quantity, 0);
}

/**
 * Qué le falta a la bolsa para cumplir la condición del cupón (compra mínima o prendas mínimas),
 * o null si la cumple. El monto mínimo se mide sobre el total de la bolsa.
 */
export function couponShortfall(cart: CartItem[], coupon: Coupon): string | null {
  const subtotal = cart.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const count = cart.reduce((acc, it) => acc + it.quantity, 0);
  const minAmount = coupon.minAmount ?? 0;
  const minItems = coupon.minItems ?? 0;
  if (minAmount > 0 && subtotal < minAmount) {
    return `Te faltan ${formatArs(minAmount - subtotal)} para usar este cupón (compra mínima ${formatArs(minAmount)}).`;
  }
  if (minItems > 0 && count < minItems) {
    const missing = minItems - count;
    return `Te ${missing === 1 ? 'falta 1 prenda' : `faltan ${missing} prendas`} para usar este cupón (mínimo ${minItems}).`;
  }
  return null;
}

/**
 * Totales de la bolsa. El único descuento posible es el de UN cupón que la clienta escribe
 * (no hay descuentos automáticos): porcentaje o monto fijo, sobre el total de la bolsa o, si el cupón
 * es de una categoría, solo sobre las prendas de esa categoría. Si la bolsa no cumple la condición del
 * cupón (compra o prendas mínimas), no descuenta.
 *
 * ⚠️ La base valida los pedidos con las mismas reglas (función validate_order en
 * supabase/hardening_seguridad.sql). Si se cambia algo acá, hay que cambiarlo allá.
 */
export function calculateCartTotals(cart: CartItem[], coupon: Coupon | null): CartTotals {
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  let discount = 0;
  if (coupon && coupon.isActive && couponShortfall(cart, coupon) === null) {
    const eligible = couponEligibleSubtotal(cart, coupon);
    if (coupon.discountPercentage > 0) {
      discount = Math.round((eligible * coupon.discountPercentage) / 100);
    } else if (coupon.fixedDiscount) {
      discount = Math.min(coupon.fixedDiscount, eligible);
    }
  }

  return { count, subtotal, discount, total: Math.max(0, subtotal - discount) };
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
