import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Los enlaces de los correos (recuperar contraseña, confirmar cuenta) vuelven al sitio con datos en la dirección.
// Supabase los lee y los borra de la barra al crear el cliente, así que se anotan ANTES de crearlo.
const openedUrlData = typeof window !== 'undefined' ? `${window.location.hash}${window.location.search}` : '';
/** El sitio se abrió desde el enlace "restablecer contraseña" de un correo. */
export const openedFromRecoveryLink = /type=recovery/.test(openedUrlData);
/** El sitio se abrió desde un enlace de correo que ya venció o ya se usó. */
export const openedFromExpiredLink = /error_code=otp_expired/.test(openedUrlData);

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co'
);

/**
 * El envío de un pedido (POST a /rest/v1/orders) debe sobrevivir aunque la página cambie: en el celular, al tocar
 * "Finalizar compra" el navegador puede pasar a WhatsApp en la misma pestaña. Con `keepalive` el navegador termina
 * de enviarlo igual. Solo se usa en pedidos: es chico y las subidas de fotos (más de 64 KB) no lo admiten.
 */
export function shouldKeepAlive(url: string, method: string | undefined): boolean {
  return (method ?? 'GET').toUpperCase() === 'POST' && /\/rest\/v1\/orders(\?|$)/.test(url);
}

const orderSafeFetch: typeof fetch = (input, init) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const method = init?.method ?? (input instanceof Request ? input.method : undefined);
  return fetch(input, shouldKeepAlive(url, method) ? { ...init, keepalive: true } : init);
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, { global: { fetch: orderSafeFetch } })
  : null;
