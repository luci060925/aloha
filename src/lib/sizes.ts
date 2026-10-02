/** Talles que se ofrecen al armar un "talle único" (el rango en el que calza la prenda). */
export const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
export const NUMBER_SIZES = Array.from({ length: 17 }, (_, i) => String(34 + i)); // 34 a 50

const sizeGroup = (size: string): 'letters' | 'numbers' | null =>
  LETTER_SIZES.includes(size) ? 'letters' : NUMBER_SIZES.includes(size) ? 'numbers' : null;

/**
 * Talle único: una prenda que no se elige por talle sino que "calza del X al Y".
 * Se guarda como un único talle de texto ("Único", "Único (M)" o "Único (S al L)"), así viaja tal cual a la bolsa,
 * al pedido y al mensaje de WhatsApp sin cambiar la base de datos.
 */
export function buildOneSize(from: string, to: string): string {
  if (!from || !to) return 'Único';
  return from === to ? `Único (${from})` : `Único (${from} al ${to})`;
}

/** Interpreta un talle guardado: devuelve el rango si es "talle único" (puede venir vacío) o null si es un talle común. */
export function parseOneSize(size: string): { from: string; to: string } | null {
  const match = /^Único(?:\s*\((.+?)(?:\s+al\s+(.+?))?\))?$/i.exec(size.trim());
  if (!match) return null;
  const from = match[1] ?? '';
  return { from, to: match[2] ?? from };
}

/** ¿La prenda es de talle único? (un solo talle guardado con el formato de arriba) */
export function isOneSizeList(sizes: string[]): boolean {
  return sizes.length === 1 && parseOneSize(sizes[0]) !== null;
}

/** Texto para mostrar: "Talle único · calza del S al L". */
export function oneSizeLabel(size: string): string {
  const range = parseOneSize(size);
  if (!range || !range.from) return 'Talle único';
  return range.from === range.to ? `Talle único · ${range.from}` : `Talle único · calza del ${range.from} al ${range.to}`;
}

/** Revisa el rango elegido. Devuelve el motivo del error o null si está bien (también es válido dejarlo vacío). */
export function validateOneSizeRange(from: string, to: string): string | null {
  if (!from && !to) return null;
  if (!from || !to) return 'Elegí los dos talles del rango ("del" y "al"), o dejá los dos vacíos.';
  const groupFrom = sizeGroup(from);
  const groupTo = sizeGroup(to);
  if (!groupFrom || groupFrom !== groupTo) return 'Elegí los dos talles del mismo tipo: los dos en letras o los dos en números.';
  const list = groupFrom === 'letters' ? LETTER_SIZES : NUMBER_SIZES;
  if (list.indexOf(from) > list.indexOf(to)) return 'El talle del "al" no puede ser menor que el del "del".';
  return null;
}
