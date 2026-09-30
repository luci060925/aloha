/** "Pantalón Sastrero Ñandú" -> "pantalon-sastrero-nandu" (sin tildes ni símbolos). */
export const slugify = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
