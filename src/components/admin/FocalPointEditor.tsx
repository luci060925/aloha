import React, { useEffect, useRef, useState } from 'react';
import { Move, RotateCcw } from 'lucide-react';
import { DEFAULT_FOCAL, dragFocal, focalOverflow, formatFocal, parseFocal, type Focal } from '../../lib/focalPoint';

export interface FocalFrame {
  label: string;
  /** Proporción del marco, como en CSS (ej. "16 / 9"). */
  aspect: string;
  /** Ancho del marco (clase de Tailwind). */
  widthClass: string;
}

interface FocalPointEditorProps {
  src: string;
  value?: string;
  onChange: (value: string) => void;
  frames: FocalFrame[];
}

/**
 * Muestra la foto en los marcos en los que se va a ver (computadora y celular) y permite arrastrarla para elegir
 * qué parte queda a la vista. Todos los marcos comparten el mismo punto de enfoque.
 */
export const FocalPointEditor: React.FC<FocalPointEditorProps> = ({ src, value, onChange, frames }) => {
  const [loaded, setLoaded] = useState<{ src: string; ratio: number | null } | null>(null);
  const drag = useRef<{ x: number; y: number; start: Focal; w: number; h: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => !cancelled && setLoaded({ src, ratio: img.width && img.height ? img.width / img.height : null });
    img.onerror = () => !cancelled && setLoaded({ src, ratio: null });
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  const ratio = loaded && loaded.src === src ? loaded.ratio : null;
  const focal = parseFocal(value);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, start: focal, w: rect.width, h: rect.height };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || !ratio) return;
    onChange(formatFocal(dragFocal(d.start, e.clientX - d.x, e.clientY - d.y, ratio, d.w, d.h)));
  };

  const endDrag = () => {
    drag.current = null;
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end gap-4">
        {frames.map(frame => {
          const canMove = ratio !== null && (() => {
            // El marco real se mide al arrastrar; acá se estima con un marco de 100 de ancho para saber si hay algo que mover
            const [w, h] = frame.aspect.split('/').map(n => Number(n.trim()));
            const extra = focalOverflow(ratio, 100, (100 * h) / w);
            return extra.x > 1 || extra.y > 1;
          })();
          return (
            <div key={frame.label} className={frame.widthClass}>
              <span className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold mb-1">{frame.label}</span>
              <div
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                style={{ aspectRatio: frame.aspect, touchAction: canMove ? 'none' : 'auto' }}
                className={`relative w-full overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 select-none ${canMove ? 'cursor-grab active:cursor-grabbing' : ''}`}
              >
                <img
                  src={src}
                  alt={`Vista en ${frame.label.toLowerCase()}`}
                  draggable={false}
                  className="w-full h-full object-cover pointer-events-none"
                  style={{ objectPosition: formatFocal(focal) }}
                />
                {canMove && (
                  <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono uppercase text-white pointer-events-none">
                    <Move className="w-3 h-3" /> Arrastrá
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] text-neutral-500 font-mono">
          {ratio === null
            ? 'Cargando la foto…'
            : 'Arrastrá la foto dentro de cualquiera de los marcos para elegir qué parte se ve. Recordá tocar "Guardar Ajustes".'}
        </p>
        {formatFocal(focal) !== DEFAULT_FOCAL && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FOCAL)}
            className="shrink-0 text-[10px] text-neutral-400 hover:text-white font-mono underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Centrar
          </button>
        )}
      </div>
    </div>
  );
};
