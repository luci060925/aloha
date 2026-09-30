import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface OrderItemThumbProps {
  productId: string;
  name: string;
  /** Lado del cuadrado en píxeles (las fotos son verticales 3:4). */
  size?: number;
}

/**
 * Miniatura de una prenda de un pedido. La foto sale del catálogo actual: si la prenda se eliminó
 * (o no tiene foto), se muestra un ícono en su lugar.
 */
export const OrderItemThumb: React.FC<OrderItemThumbProps> = ({ productId, name, size = 44 }) => {
  const { products } = useStore();
  const photo = products.find(p => p.id === productId)?.images[0];

  return (
    <div
      className="shrink-0 overflow-hidden rounded-md border border-neutral-800 bg-neutral-900 flex items-center justify-center"
      style={{ width: size, height: Math.round(size * 1.25) }}
    >
      {photo ? (
        <img src={photo} alt={name} loading="lazy" className="w-full h-full object-cover object-center" />
      ) : (
        <ShoppingBag className="w-4 h-4 text-neutral-600" aria-hidden="true" />
      )}
    </div>
  );
};
