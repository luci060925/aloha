// Pruebas de las funciones puras de src/lib (informe.md: SEC-001, SEC-009, SEC-010, SEC-012).
import { describe, expect, test } from 'vitest';
import { calculateCartTotals, couponKind, couponShortfall, syncCartWithCatalog, normalizeCouponCode, MAX_ITEM_QUANTITY } from '../../src/lib/pricing';
import { isHttpUrl, isTrustedAvatarUrl, safeUrl } from '../../src/lib/external';
import { slugify } from '../../src/lib/slug';
import { MIN_PASSWORD_LENGTH } from '../../src/lib/constants';
import type { CartItem, Coupon, Product } from '../../src/types';

const product = (id: string, price: number, category = 'abrigos-blazers', inStock = true): Product => ({
  id, name: id, slug: id, description: '', price, category, images: [], sizes: ['M'], colors: [], inStock, createdAt: '2026-01-01',
});
const line = (p: Product, quantity = 1): CartItem => ({
  id: `${p.id}-M-Negro`, productId: p.id, product: p, selectedSize: 'M', selectedColor: { name: 'Negro', hex: '#000' }, quantity, price: p.price,
});
const coupon = (over: Partial<Coupon>): Coupon => ({
  id: 'c', code: 'X', discountPercentage: 0, usedCount: 0, isActive: true, targetCategory: 'all', ...over,
});

const blazer = product('p1', 50000);
const vestido = product('p2', 30000, 'vestidos');

describe('pricing · calculateCartTotals (debe coincidir con validate_order en supabase/hardening_seguridad.sql)', () => {
  test('sin cupón no hay descuento, por más prendas que lleve', () => {
    expect(calculateCartTotals([line(blazer), line(vestido)], null)).toMatchObject({ count: 2, subtotal: 80000, discount: 0, total: 80000 });
    expect(calculateCartTotals([line(blazer, 5)], null)).toMatchObject({ discount: 0, total: 250000 }); // ya no hay descuento por cantidad
  });

  test('cupón porcentual, fijo y por categoría', () => {
    expect(calculateCartTotals([line(blazer)], coupon({ discountPercentage: 10 })).discount).toBe(5000);
    expect(calculateCartTotals([line(blazer)], coupon({ fixedDiscount: 8000 })).discount).toBe(8000);
    expect(calculateCartTotals([line(blazer)], coupon({ fixedDiscount: 999999 })).discount).toBe(50000); // nunca más que lo elegible
    const soloVestidos = coupon({ discountPercentage: 20, targetCategory: 'vestidos' });
    expect(calculateCartTotals([line(vestido), line(blazer)], soloVestidos).discount).toBe(6000);
    expect(calculateCartTotals([line(blazer)], soloVestidos).discount).toBe(0);
  });

  test('con muchas prendas el cupón descuenta igual (no compite con nada automático)', () => {
    const t = calculateCartTotals([line(blazer, 3)], coupon({ discountPercentage: 10 }));
    expect(t).toMatchObject({ discount: 15000, total: 135000 });
  });

  test('un cupón inactivo no descuenta y el total nunca es negativo', () => {
    expect(calculateCartTotals([line(blazer)], coupon({ discountPercentage: 10, isActive: false })).discount).toBe(0);
    expect(calculateCartTotals([line(blazer)], coupon({ discountPercentage: 100 })).total).toBe(0);
  });
});

describe('pricing · tipos de cupón y sus condiciones', () => {
  test('el tipo sale de la condición del cupón', () => {
    expect(couponKind(coupon({ minAmount: 80000 }))).toBe('amount');
    expect(couponKind(coupon({ minItems: 3 }))).toBe('items');
    expect(couponKind(coupon({ targetCategory: 'vestidos' }))).toBe('category');
    expect(couponKind(coupon({}))).toBe('global');
  });

  test('por monto: descuenta sobre el total solo si la bolsa llega al mínimo', () => {
    const grande = coupon({ discountPercentage: 10, minAmount: 80000 });
    expect(calculateCartTotals([line(blazer)], grande).discount).toBe(0);
    expect(calculateCartTotals([line(blazer), line(vestido)], grande).discount).toBe(8000); // justo en el mínimo
    expect(couponShortfall([line(blazer)], grande)).toMatch(/Te faltan \$\s?30\.000/);
  });

  test('por cantidad: cuenta unidades y descuenta sobre el total', () => {
    const tres = coupon({ discountPercentage: 15, minItems: 3 });
    expect(calculateCartTotals([line(blazer, 2)], tres).discount).toBe(0);
    expect(couponShortfall([line(blazer, 2)], tres)).toMatch(/falta 1 prenda/);
    expect(couponShortfall([line(blazer)], tres)).toMatch(/faltan 2 prendas/);
    expect(calculateCartTotals([line(blazer, 3)], tres)).toMatchObject({ discount: 22500, total: 127500 });
    expect(couponShortfall([line(blazer, 3)], tres)).toBeNull();
  });

  test('un cupón de valor fijo admite cualquier monto positivo (15900, 45000...)', () => {
    expect(calculateCartTotals([line(blazer, 2)], coupon({ fixedDiscount: 15900 })).discount).toBe(15900);
    expect(calculateCartTotals([line(blazer, 2)], coupon({ fixedDiscount: 45000 })).discount).toBe(45000);
  });
});

describe('pricing · normalizeCouponCode (lo que escribe la clienta = lo que guarda la administradora)', () => {
  test('mayúsculas, sin espacios en los bordes y guiones en lugar de espacios', () => {
    expect(normalizeCouponCode('  aloha10 ')).toBe('ALOHA10');
    expect(normalizeCouponCode('verano 10')).toBe('VERANO-10');
    expect(normalizeCouponCode('verano   10')).toBe('VERANO-10');
    expect(normalizeCouponCode('Verano-10')).toBe('VERANO-10');
  });
});

describe('pricing · syncCartWithCatalog (SEC-001: la bolsa no viaja con precios viejos)', () => {
  test('actualiza el precio al vigente', () => {
    const vieja = line(product('p1', 40000));
    const [l] = syncCartWithCatalog([vieja], [blazer]);
    expect(l.price).toBe(50000);
  });

  test('quita prendas borradas o agotadas', () => {
    const agotada = product('p9', 100, 'vestidos', false);
    const res = syncCartWithCatalog([line(blazer), line(agotada), line(product('borrada', 5))], [blazer, agotada]);
    expect(res.map(l => l.productId)).toEqual(['p1']);
  });

  test('topea la cantidad', () => {
    const [l] = syncCartWithCatalog([line(blazer, 500)], [blazer]);
    expect(l.quantity).toBe(MAX_ITEM_QUANTITY);
  });
});

describe('external · URLs seguras (SEC-009, SEC-010)', () => {
  test('isHttpUrl solo acepta http(s) completas', () => {
    expect(isHttpUrl('https://instagram.com/aloha')).toBe(true);
    expect(isHttpUrl('http://ejemplo.com')).toBe(true);
    for (const malo of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<script>1</script>', 'vbscript:x', 'ftp://x.com', '//evil.com', 'instagram.com/aloha', '', null, undefined]) {
      expect(isHttpUrl(malo as string), String(malo)).toBe(false);
    }
  });

  test('safeUrl neutraliza lo peligroso', () => {
    expect(safeUrl('  https://tiktok.com/@aloha ')).toBe('https://tiktok.com/@aloha');
    expect(safeUrl('javascript:alert(document.cookie)')).toBe('#');
    expect(safeUrl(undefined)).toBe('#');
  });

  test('los avatares solo pueden ser de Google', () => {
    expect(isTrustedAvatarUrl('https://lh3.googleusercontent.com/a/abc=s96-c')).toBe(true);
    expect(isTrustedAvatarUrl('https://atacante.example/pixel.gif')).toBe(false);
    expect(isTrustedAvatarUrl('https://googleusercontent.com.atacante.example/x.png')).toBe(false); // subdominio engañoso
    expect(isTrustedAvatarUrl('http://lh3.googleusercontent.com/a')).toBe(false); // sin https
    expect(isTrustedAvatarUrl('javascript:alert(1)')).toBe(false);
  });
});

describe('slug y contraseñas', () => {
  test('slugify quita tildes y símbolos', () => {
    expect(slugify('Pantalón Sastrero Ñandú')).toBe('pantalon-sastrero-nandu');
    expect(slugify('  Tops & Remeras!! ')).toBe('tops-remeras');
    expect(slugify('<script>alert(1)</script>')).toBe('script-alert-1-script');
  });

  test('la contraseña mínima es de al menos 8 caracteres (SEC-012)', () => {
    expect(MIN_PASSWORD_LENGTH).toBeGreaterThanOrEqual(8);
  });
});
