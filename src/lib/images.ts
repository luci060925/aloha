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

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, type, quality));

/** Calidades que se prueban, de mejor a peor, antes de achicar más la foto. */
const QUALITIES = [0.85, 0.75, 0.65, 0.55, 0.45];
const MAX_ATTEMPTS = 14;

/** Extensión del archivo según el formato en el que quedó la foto. */
const extensionFor = (type: string): string => (type === 'image/webp' ? 'webp' : type === 'image/jpeg' ? 'jpg' : 'png');

/**
 * Convierte una imagen (data URL) a WebP y la achica hasta que pese menos de 1 MB (límite del almacenamiento).
 * Si el navegador no sabe generar WebP (algunos Safari / iPhone lo reemplazan por PNG, que pesa mucho más),
 * usa JPG. Va probando calidades más bajas y, si hace falta, reduce las dimensiones, hasta que entre.
 */
export async function toWebpBlob(src: string, maxWidth?: number): Promise<Blob> {
  const img = await loadImage(src);
  let scale = maxWidth && img.width > maxWidth ? maxWidth / img.width : 1;
  let type = 'image/webp';

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Tu navegador no permite procesar imágenes');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    for (const quality of QUALITIES) {
      let blob = await canvasToBlob(canvas, type, quality);
      if (blob && blob.type !== type && type === 'image/webp') {
        type = 'image/jpeg'; // el navegador no genera WebP: se sigue con JPG
        blob = await canvasToBlob(canvas, type, quality);
      }
      if (blob && blob.type === type && blob.size <= MAX_BYTES) return blob;
    }
    scale *= 0.8;
  }
  throw new Error('No se pudo reducir la foto lo suficiente. Probá con otra foto o una captura de pantalla de ella.');
}

/**
 * Sube una imagen (data URL) al bucket público y devuelve su URL.
 * Sin Supabase configurado (modo demostración) devuelve la misma imagen.
 */
export async function uploadCatalogImage(
  src: string,
  folder: 'products' | 'hero' | 'showroom',
  maxWidth?: number,
): Promise<string> {
  if (!isSupabaseConfigured || !supabase) return src;

  const blob = await toWebpBlob(src, maxWidth);
  const path = `${folder}/${crypto.randomUUID()}.${extensionFor(blob.type)}`;
  const { error } = await supabase.storage
    .from(CATALOG_BUCKET)
    .upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false });
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
