import { useSyncExternalStore } from 'react';

/** Filas de prendas que se muestran por página en "Todas las Prendas". */
export const CATALOG_ROWS_PER_PAGE = 5;

/** Columnas de la grilla del catálogo según el ancho de la pantalla (igual que las clases grid-cols de CatalogGrid). */
export function columnsForWidth(width: number): 2 | 3 | 4 {
  if (width >= 1024) return 4;
  if (width >= 768) return 3;
  return 2;
}

const QUERIES = ['(min-width: 768px)', '(min-width: 1024px)'];

function subscribe(onChange: () => void): () => void {
  const lists = QUERIES.map(q => window.matchMedia(q));
  lists.forEach(l => l.addEventListener('change', onChange));
  return () => lists.forEach(l => l.removeEventListener('change', onChange));
}

const getColumns = () => columnsForWidth(window.innerWidth);

/** Cantidad de columnas de la grilla en este momento (se actualiza si cambia el tamaño de la ventana o se gira el celular). */
export function useGridColumns(): 2 | 3 | 4 {
  return useSyncExternalStore(subscribe, getColumns, () => 4);
}
