// Pruebas de las funciones puras de src/lib (informe.md: SEC-001, SEC-009, SEC-010, SEC-012).
import { describe, expect, test } from 'vitest';
import { calculateCartTotals, syncCartWithCatalog, MAX_ITEM_QUANTITY } from '../../src/lib/pricing';
import { isHttpUrl, isTrustedAvatarUrl, safeUrl } from '../../src/lib/external';
import { slugify } from '../../src/lib/slug';
import { MIN_PASSWORD_LENGTH } from '../../src/lib/constants';
import { DEFAULT_SETTINGS } from '../../src/data/defaultSettings';
import type { CartItem, Coupon, Product, StoreSettings } from '../../src/types';

const product = (id: string, price: number, category = 'abrigos-blazers', inStock = true): Product => ({
  id, name: id, slug: id, description: '', price, category, images: [], sizes: ['M'], colors: [], inStock, createdAt: '2026-01-01',
});
const line = (p: Product, quantity = 1): CartItem => ({
  id: `${p.id}-M-Negro`, productId: p.id, product: p, selectedSize: 'M', selectedColor: { name: 'Negro', hex: '#000' }, quantity, price: p.price,
});
const settings = (over: Partial<StoreSettings> = {}): StoreSettings => ({
  ...DEFAULT_SETTINGS,
  volumeDiscountActive: false, priceDiscountActive: false, globalDiscountActive: false, ...over,
});
const coupon = (over: Partial<Coupon>): Coupon => ({
  id: 'c', code: 'X', discountPercentage: 0, usedCount: 0, isActive: true, targetCategory: 'all', ...over,
});

const blazer = product('p1', 50000);
const vestido = product('p2', 30000, 'vestidos');

describe('pricing · calculateCartTotals (debe coincidir con validate_order en supabase/hardening_seguridad.sql)', () => {
  test('sin promociones no hay descuento', () => {
    const t = calculateCartTotals([line(blazer), line(vestido)], settings(), null);
    expect(t).toMatchObject({ count: 2, subtotal: 80000, discount: 0, total: 80000, isVolumeDiscountApplied: false });
  });

  test('descuento por volumen: 15 % desde 3 prendas', () => {
    const s = settings({ volumeDiscountActive: true, volumeDiscountMinItems: 3, volumeDiscountPercentage: 15 });
    expect(calculateCartTotals([line(blazer, 3)], s, null)).toMatchObject({ discount: 22500, total: 127500, isVolumeDiscountApplied: true });
    expect(calculateCartTotals([line(blazer, 2)], s, null).discount).toBe(0);
  });

  test('descuento por monto mínimo y global', () => {
    const porMonto = settings({ priceDiscountActive: true, priceDiscountMinAmount: 80000, priceDiscountPercentage: 10 });
    expect(calculateCartTotals([line(blazer, 2)], porMonto, null).discount).toBe(10000);
    expect(calculateCartTotals([line(blazer)], porMonto, null).discount).toBe(0);
    const global = settings({ globalDiscountActive: true, globalDiscountPercentage: 5 });
    expect(calculateCartTotals([line(blazer)], global, null).discount).toBe(2500);
  });

  test('cupón porcentual, fijo y por categoría', () => {
    expect(calculateCartTotals([line(blazer)], settings(), coupon({ discountPercentage: 10 })).discount).toBe(5000);
    expect(calculateCartTotals([line(blazer)], settings(), coupon({ fixedDiscount: 8000 })).discount).toBe(8000);
    expect(calculateCartTotals([line(blazer)], settings(), coupon({ fixedDiscount: 999999 })).discount).toBe(50000); // nunca más que lo elegible
    const soloVestidos = coupon({ discountPercentage: 20, targetCategory: 'vestidos' });
    expect(calculateCartTotals([line(vestido), line(blazer)], settings(), soloVestidos).discount).toBe(6000);
    expect(calculateCartTotals([line(blazer)], settings(), soloVestidos).discount).toBe(0);
  });

  test('un solo descuento por compra: el cupón tiene prioridad sobre el volumen', () => {
    const s = settings({ volumeDiscountActive: true, volumeDiscountMinItems: 3, volumeDiscountPercentage: 15 });
    const t = calculateCartTotals([line(blazer, 3)], s, coupon({ discountPercentage: 10 }));
    expect(t.discount).toBe(15000);
    expect(t.isVolumeDiscountApplied).toBe(false);
  });

  test('un cupón inactivo no descuenta y el total nunca es negativo', () => {
    expect(calculateCartTotals([line(blazer)], settings(), coupon({ discountPercentage: 10, isActive: false })).discount).toBe(0);
    expect(calculateCartTotals([line(blazer)], settings(), coupon({ discountPercentage: 100 })).total).toBe(0);
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
