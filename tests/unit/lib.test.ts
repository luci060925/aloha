// Pruebas de las funciones puras de src/lib (informe.md: SEC-001, SEC-009, SEC-010, SEC-012).
import { describe, expect, test } from 'vitest';
import { calculateCartTotals, couponKind, couponShortfall, syncCartWithCatalog, normalizeCouponCode, MAX_ITEM_QUANTITY } from '../../src/lib/pricing';
import { isHttpUrl, isTrustedAvatarUrl, isWhatsAppUrl, safeUrl } from '../../src/lib/external';
import { hasAuthErrorInUrl, shouldKeepAlive } from '../../src/lib/supabase';
import { slugify } from '../../src/lib/slug';
import { displayPhone } from '../../src/lib/phone';
import { fitWithin } from '../../src/lib/aiDescription';
import { dragFocal, focalOverflow, formatFocal, parseFocal } from '../../src/lib/focalPoint';
import { buildOneSize, isOneSizeList, oneSizeLabel, parseOneSize, validateOneSizeRange } from '../../src/lib/sizes';
import { MAGNOLIA_CATEGORY, MAGNOLIA_SLUG } from '../../src/data/fixedCategories';
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

describe('displayPhone · un solo + adelante', () => {
  test('no duplica el + aunque el número ya lo traiga', () => {
    expect(displayPhone('+54 9 2975 92-5842')).toBe('+54 9 2975 92-5842');
    expect(displayPhone('5492975925842')).toBe('+5492975925842');
    expect(displayPhone('++54 9 2975')).toBe('+54 9 2975');
    expect(displayPhone('')).toBe('');
  });
});

describe('Magnolia Intimates · categoría fija', () => {
  test('tiene sus 4 subcategorías y está bloqueada', () => {
    expect(MAGNOLIA_CATEGORY.slug).toBe(MAGNOLIA_SLUG);
    expect(MAGNOLIA_CATEGORY.locked).toBe(true);
    expect(MAGNOLIA_CATEGORY.subcategories?.map(s => s.slug)).toEqual(['lenceria', 'pijamas', 'medias', 'conjuntos']);
  });
});

describe('aiDescription · fitWithin (foto que se manda a la IA)', () => {
  test('achica sin deformar y nunca agranda', () => {
    expect(fitWithin(3000, 1500, 768)).toEqual({ width: 768, height: 384 });
    expect(fitWithin(1500, 3000, 768)).toEqual({ width: 384, height: 768 });
    expect(fitWithin(400, 300, 768)).toEqual({ width: 400, height: 300 });
  });
});

describe('sizes · talle único', () => {
  test('se guarda como un talle de texto y se interpreta de vuelta', () => {
    expect(buildOneSize('S', 'L')).toBe('Único (S al L)');
    expect(buildOneSize('M', 'M')).toBe('Único (M)');
    expect(buildOneSize('', '')).toBe('Único');
    expect(parseOneSize('Único (S al L)')).toEqual({ from: 'S', to: 'L' });
    expect(parseOneSize('Único (40 al 44)')).toEqual({ from: '40', to: '44' });
    expect(parseOneSize('Único (M)')).toEqual({ from: 'M', to: 'M' });
    expect(parseOneSize('Único')).toEqual({ from: '', to: '' });
    expect(parseOneSize('M')).toBeNull();
    expect(parseOneSize('VIENEN DEL S AL L')).toBeNull(); // las prendas ya cargadas así quedan como están
  });

  test('solo una prenda con un único talle de ese formato es de talle único', () => {
    expect(isOneSizeList(['Único (S al L)'])).toBe(true);
    expect(isOneSizeList(['Único'])).toBe(true);
    expect(isOneSizeList(['S', 'M'])).toBe(false);
    expect(isOneSizeList(['Único (S al L)', 'M'])).toBe(false);
  });

  test('texto para mostrar', () => {
    expect(oneSizeLabel('Único (S al L)')).toBe('Talle único · calza del S al L');
    expect(oneSizeLabel('Único (M)')).toBe('Talle único · M');
    expect(oneSizeLabel('Único')).toBe('Talle único');
  });

  test('valida el rango: orden, mismo tipo y que estén los dos', () => {
    expect(validateOneSizeRange('', '')).toBeNull();
    expect(validateOneSizeRange('S', 'L')).toBeNull();
    expect(validateOneSizeRange('38', '44')).toBeNull();
    expect(validateOneSizeRange('M', 'M')).toBeNull();
    expect(validateOneSizeRange('L', 'S')).toMatch(/menor/);
    expect(validateOneSizeRange('S', '40')).toMatch(/mismo tipo/);
    expect(validateOneSizeRange('S', '')).toMatch(/los dos/);
  });
});

describe('external · enlaces de WhatsApp', () => {
  test('reconoce solo los enlaces de chat de WhatsApp', () => {
    expect(isWhatsAppUrl('https://wa.me/5492974201122?text=Hola')).toBe(true);
    expect(isWhatsAppUrl('https://api.whatsapp.com/send?phone=1')).toBe(true);
    expect(isWhatsAppUrl('https://instagram.com/aloha')).toBe(false);
    expect(isWhatsAppUrl('https://wa.me.atacante.example/x')).toBe(false);
    expect(isWhatsAppUrl('http://wa.me/1')).toBe(false);
    expect(isWhatsAppUrl('no es una url')).toBe(false);
  });
});

describe('supabase · el envío del pedido sobrevive al cambio de página', () => {
  test('keepalive solo para pedidos nuevos', () => {
    expect(shouldKeepAlive('https://x.supabase.co/rest/v1/orders', 'POST')).toBe(true);
    expect(shouldKeepAlive('https://x.supabase.co/rest/v1/orders?columns=%22id%22', 'post')).toBe(true);
    expect(shouldKeepAlive('https://x.supabase.co/rest/v1/orders', 'GET')).toBe(false);
    expect(shouldKeepAlive('https://x.supabase.co/rest/v1/products', 'POST')).toBe(false);
    expect(shouldKeepAlive('https://x.supabase.co/storage/v1/object/catalog-images/a.webp', 'POST')).toBe(false);
  });
});

describe('supabase · errores de ingreso en la dirección', () => {
  test('detecta el error de cancelar con Google y no confunde otras direcciones', () => {
    expect(hasAuthErrorInUrl('?error=access_denied&error_description=#error=access_denied&sb=')).toBe(true);
    expect(hasAuthErrorInUrl('#error=access_denied&error_code=otp_expired')).toBe(true);
    expect(hasAuthErrorInUrl('')).toBe(false);
    expect(hasAuthErrorInUrl('#access_token=abc&type=recovery')).toBe(false);
    expect(hasAuthErrorInUrl('?terror=1')).toBe(false);
  });
});

describe('focalPoint · acomodar las fotos de portada', () => {
  test('lee y escribe la posición como en CSS, y ante algo inválido deja la foto centrada', () => {
    expect(parseFocal('30% 70%')).toEqual({ x: 30, y: 70 });
    expect(parseFocal('150% -20%')).toEqual({ x: 100, y: 0 });
    expect(parseFocal('')).toEqual({ x: 50, y: 50 });
    expect(parseFocal('center top')).toEqual({ x: 50, y: 50 });
    expect(parseFocal(undefined)).toEqual({ x: 50, y: 50 });
    expect(formatFocal({ x: 33.4, y: 66.6 })).toBe('33% 67%');
  });

  test('calcula cuánto sobra de foto en cada sentido', () => {
    // foto vertical (3:4) en un marco horizontal 16:9 de 160 x 90: sobra alto, no ancho
    const v = focalOverflow(0.75, 160, 90);
    expect(v.x).toBe(0);
    expect(Math.round(v.y)).toBe(123);
    // foto horizontal (2:1) en un marco vertical 9:16 de 90 x 160: sobra ancho, no alto
    const h = focalOverflow(2, 90, 160);
    expect(h.y).toBe(0);
    expect(h.x).toBe(230);
  });

  test('al arrastrar la foto sigue al dedo y nunca se sale de 0–100', () => {
    // sobra 230 px de ancho: arrastrar 23 px hacia la derecha muestra 10 puntos más de la izquierda
    expect(dragFocal({ x: 50, y: 50 }, 23, 0, 2, 90, 160)).toEqual({ x: 40, y: 50 });
    expect(dragFocal({ x: 50, y: 50 }, -9999, 0, 2, 90, 160).x).toBe(100);
    expect(dragFocal({ x: 50, y: 50 }, 9999, 0, 2, 90, 160).x).toBe(0);
    // en el sentido en el que no sobra foto no se mueve
    expect(dragFocal({ x: 50, y: 20 }, 0, 80, 2, 90, 160).y).toBe(20);
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
