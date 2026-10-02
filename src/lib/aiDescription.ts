import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Nombre con el que quedó creada en Supabase la función que arma las sugerencias (su código está en
 * supabase/functions/sugerir-descripcion). Supabase le asignó un nombre automático al crearla desde el panel.
 * Ver docs/ia-descripciones.md
 */
const FUNCTION_NAME = 'dynamic-api';
const MAX_IMAGE_SIDE = 768;

export interface SuggestionInput {
  name: string;
  category: string;
  subcategory: string;
  colors: string[];
  sizes: string[];
  /** Primera foto de la prenda (data URL o dirección). Opcional: sin foto se usan solo los datos escritos. */
  imageSrc?: string;
}

/** Tamaño al que se achica la foto (lado mayor = max) sin agrandarla nunca. */
export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Achica la foto a JPG liviano (unos pocos cientos de KB como máximo) para mandarla a la IA. Devuelve null si no se puede leer. */
async function imageForAi(src: string): Promise<{ mimeType: string; data: string } | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('imagen'));
      el.src = src;
    });
    const { width, height } = fitWithin(img.width, img.height, MAX_IMAGE_SIDE);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    return { mimeType: 'image/jpeg', data: dataUrl.split(',')[1] ?? '' };
  } catch {
    return null; // sin foto igual se pueden pedir sugerencias con los datos escritos
  }
}

/** Pide 3 descripciones (cercana, elegante y canchera). Lanza un Error con un mensaje listo para mostrar. */
export async function suggestDescriptions(input: SuggestionInput): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Las sugerencias con IA no están disponibles en modo demostración.');
  }

  const image = input.imageSrc ? await imageForAi(input.imageSrc) : null;
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: {
      name: input.name,
      category: input.category,
      subcategory: input.subcategory,
      colors: input.colors,
      sizes: input.sizes,
      ...(image ? { image } : {}),
    },
  });

  if (error) {
    const response = (error as { context?: unknown }).context;
    if (response instanceof Response) {
      if (response.status === 404) {
        throw new Error('La función de IA todavía no está instalada en Supabase. Mirá docs/ia-descripciones.md.');
      }
      const payload = await response.json().catch(() => null);
      if (payload && typeof payload.error === 'string') throw new Error(payload.error);
    }
    throw new Error('No se pudieron generar sugerencias. Revisá tu conexión e intentá de nuevo.');
  }

  const options = (data as { options?: unknown } | null)?.options;
  if (!Array.isArray(options) || options.length === 0) {
    throw new Error('La IA no devolvió sugerencias. Probá de nuevo.');
  }
  return options.filter((o): o is string => typeof o === 'string' && o.trim() !== '').slice(0, 3);
}
