/**
 * Punto de enfoque de una foto de portada: qué parte de la foto queda en el centro cuando se recorta para llenar su marco.
 * Se guarda como el valor de `object-position` de CSS ("50% 50%" = centrada), así se aplica tal cual a la imagen.
 */
export const DEFAULT_FOCAL = '50% 50%';

export interface Focal {
  x: number;
  y: number;
}

const clamp = (value: number) => Math.min(100, Math.max(0, value));

/** Lee "30% 70%" (si viene vacío o inválido, la deja centrada). */
export function parseFocal(value: string | null | undefined): Focal {
  const match = /^\s*(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%\s*$/.exec(value ?? '');
  return match ? { x: clamp(Number(match[1])), y: clamp(Number(match[2])) } : { x: 50, y: 50 };
}

export function formatFocal(focal: Focal): string {
  return `${Math.round(clamp(focal.x))}% ${Math.round(clamp(focal.y))}%`;
}

/** Cuántos píxeles de la foto sobran (en horizontal y en vertical) al llenar un marco de ancho x alto sin deformarla. */
export function focalOverflow(imageRatio: number, boxW: number, boxH: number): { x: number; y: number } {
  return {
    x: Math.max(0, boxH * imageRatio - boxW),
    y: Math.max(0, boxW / imageRatio - boxH),
  };
}

/**
 * Nuevo punto de enfoque al arrastrar la foto `dx`, `dy` píxeles dentro de su marco: la foto sigue al dedo o al mouse
 * (arrastrar hacia abajo muestra la parte de arriba). Si en un sentido no sobra foto, ese sentido no se mueve.
 */
export function dragFocal(start: Focal, dx: number, dy: number, imageRatio: number, boxW: number, boxH: number): Focal {
  const extra = focalOverflow(imageRatio, boxW, boxH);
  return {
    x: extra.x > 1 ? clamp(start.x - (dx / extra.x) * 100) : start.x,
    y: extra.y > 1 ? clamp(start.y - (dy / extra.y) * 100) : start.y,
  };
}
