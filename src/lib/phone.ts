/**
 * Número para mostrar en pantalla, siempre con un único "+" adelante.
 * El número guardado puede venir con o sin "+" y con espacios ("+54 9 2975 92-5842"), y así se respeta.
 */
export function displayPhone(raw: string | null | undefined): string {
  const cleaned = (raw ?? '').trim().replace(/^[\s+]+/, '');
  return cleaned ? `+${cleaned}` : '';
}
