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

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
