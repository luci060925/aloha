import type { Category } from '../types';

export const MAGNOLIA_SLUG = 'magnolia-intimates';

/**
 * Magnolia Intimates: línea fija de la tienda. Vive en el código (no en la base de datos), por eso la administradora
 * no puede editarla ni borrarla ni agregarle subcategorías; solo elige "Magnolia Intimates" y una de sus 4
 * subcategorías al cargar una prenda. Las prendas guardan estos nombres como texto, igual que cualquier categoría.
 */
export const MAGNOLIA_CATEGORY: Category = {
  id: 'fixed-magnolia-intimates',
  name: 'Magnolia Intimates',
  slug: MAGNOLIA_SLUG,
  description: 'Lencería, pijamas, medias y conjuntos.',
  order: 1000,
  locked: true,
  subcategories: [
    { id: 'fixed-magnolia-lenceria', name: 'Lencería', slug: 'lenceria' },
    { id: 'fixed-magnolia-pijamas', name: 'Pijamas', slug: 'pijamas' },
    { id: 'fixed-magnolia-medias', name: 'Medias', slug: 'medias' },
    { id: 'fixed-magnolia-conjuntos', name: 'Conjuntos', slug: 'conjuntos' },
  ],
};

/** Mensaje cuando se intenta cambiar una categoría fija desde el panel. */
export const LOCKED_CATEGORY_MESSAGE = 'Esta categoría es fija y no se puede modificar.';
