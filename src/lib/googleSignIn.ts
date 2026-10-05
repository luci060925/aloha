// Ingreso con el botón oficial de Google (Google Identity Services).
// A diferencia del ingreso por redirección, Google muestra el nombre de la tienda en vez de la dirección de Supabase.
// El ID de cliente es público (no es una clave secreta): es el mismo "ID de cliente" de Google Cloud que ya está cargado en Supabase.
export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID || '653158457386-1ch4np31l2be3t2j6o56bra6jfr7v4k6.apps.googleusercontent.com';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

interface GoogleIdApi {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
    nonce?: string;
    ux_mode?: 'popup';
    use_fedcm_for_button?: boolean;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } };
  }
}

let loading: Promise<void> | null = null;

function loadGsi(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error('No se pudo cargar el ingreso de Google.'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

const toHex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');

/** Código de un solo uso: Google recibe su huella (hash) y Supabase el original, así nadie puede reutilizar el token. */
async function createNonce(): Promise<{ raw: string; hashed: string }> {
  const raw = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return { raw, hashed: toHex(new Uint8Array(digest)) };
}

/** Dibuja el botón de Google dentro de `parent`. Devuelve true si pudo. */
export async function renderGoogleButton(
  parent: HTMLElement,
  onCredential: (idToken: string, nonce: string) => void,
  width: number
): Promise<boolean> {
  try {
    await loadGsi();
    const api = window.google?.accounts?.id;
    if (!api) return false;
    const nonce = await createNonce();
    api.initialize({
      client_id: GOOGLE_CLIENT_ID,
      nonce: nonce.hashed,
      ux_mode: 'popup',
      use_fedcm_for_button: true,
      callback: response => {
        if (response.credential) onCredential(response.credential, nonce.raw);
      },
    });
    parent.innerHTML = '';
    api.renderButton(parent, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      locale: 'es',
      width: Math.min(400, Math.max(200, Math.floor(width))),
    });
    return true;
  } catch {
    return false;
  }
}
