/** ¿Es una dirección absoluta http(s)? Rechaza `javascript:`, `data:`, `vbscript:` y textos que no son URL. */
export function isHttpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const { protocol } = new URL(url.trim());
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

/** Devuelve la URL solo si es http(s); si no, `#` (el enlace queda inofensivo). Usar en todo `href`/`src` con datos configurables. */
export function safeUrl(url: string | null | undefined): string {
  return url && isHttpUrl(url) ? url.trim() : '#';
}

/**
 * Los avatares solo pueden venir de Google (googleusercontent.com). Cualquier otra dirección se ignora:
 * evita que una cuenta haga que el navegador de la administradora consulte un sitio de un tercero.
 */
export function isTrustedAvatarUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const { protocol, hostname } = new URL(url.trim());
    return protocol === 'https:' && (hostname === 'googleusercontent.com' || hostname.endsWith('.googleusercontent.com'));
  } catch {
    return false;
  }
}

/** ¿Es un enlace para abrir un chat de WhatsApp? */
export function isWhatsAppUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === 'https:' && (hostname === 'wa.me' || hostname === 'api.whatsapp.com');
  } catch {
    return false;
  }
}

/** ¿Es un celular o una tablet? (pantalla táctil sin mouse) */
function isTouchDevice(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
}

/**
 * Abre un sitio externo en otra pestaña sin darle acceso a `window.opener` ni enviar el referrer.
 * Excepción: en celulares los enlaces de WhatsApp se abren en la misma pestaña, porque en el iPhone una pestaña
 * nueva que se redirige a la aplicación queda en blanco al volver al navegador.
 */
export function openExternal(url: string): void {
  if (isWhatsAppUrl(url) && isTouchDevice()) {
    window.location.assign(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
