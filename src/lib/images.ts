import { supabase, isSupabaseConfigured } from './supabase';

export const CATALOG_BUCKET = 'catalog-images';
const MAX_BYTES = 1024 * 1024; // límite del bucket: 1 MB por archivo

export const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = src;
  });

const canvasToWebp = (canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality));

/** Convierte una imagen (data URL) a WebP y la achica hasta que pese menos de 1 MB. */
export async function toWebpBlob(src: string, maxWidth?: number): Promise<Blob> {
  const img = await loadImage(src);
  let scale = maxWidth && img.width > maxWidth ? maxWidth / img.width : 1;

  for (let attempt = 0; attempt < 6; attempt++) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Tu navegador no permite procesar imágenes');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.82, 0.7, 0.6]) {
      const blob = await canvasToWebp(canvas, quality);
      if (blob && blob.size <= MAX_BYTES) return blob;
    }
    scale *= 0.85;
  }
  throw new Error('La imagen es demasiado pesada. Probá con una foto más chica.');
}

/**
 * Sube una imagen (data URL) al bucket público y devuelve su URL.
 * Sin Supabase configurado (modo demostración) devuelve la misma imagen.
 */
export async function uploadCatalogImage(
  src: string,
  folder: 'products' | 'hero',
  maxWidth?: number,
): Promise<string> {
  if (!isSupabaseConfigured || !supabase) return src;

  const blob = await toWebpBlob(src, maxWidth);
  const path = `${folder}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage
    .from(CATALOG_BUCKET)
    .upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
  if (error) throw new Error(error.message);

  return supabase.storage.from(CATALOG_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Ruta dentro del bucket si la URL pertenece a él; null si es externa (p. ej. Unsplash). */
const catalogImagePath = (url: string): string | null => {
  const marker = `/${CATALOG_BUCKET}/`;
  const index = url.indexOf(marker);
  if (!url.startsWith('http') || index === -1) return null;
  return url.slice(index + marker.length).split('?')[0];
};

/** Borra del bucket las fotos indicadas (ignora las que no son del bucket). */
export async function deleteCatalogImages(urls: string[]): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const paths = urls.map(catalogImagePath).filter((p): p is string => Boolean(p));
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(CATALOG_BUCKET).remove(paths);
  if (error) console.warn('No se pudieron borrar imágenes antiguas:', error.message);
}
