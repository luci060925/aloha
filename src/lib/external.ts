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

/** Abre un sitio externo en otra pestaña sin darle acceso a `window.opener` ni enviar el referrer. */
export function openExternal(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}
