import React from 'react';
import { X, Ruler } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#121212] text-white max-w-xl w-full p-6 sm:p-8 relative shadow-2xl border border-neutral-800 rounded-2xl">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Ruler className="w-6 h-6 text-white" />
          <div>
            <h3 className="font-serif text-2xl font-light tracking-wide uppercase text-white">Guía de Talles</h3>
            <p className="text-xs text-neutral-400 uppercase tracking-widest font-mono">Medidas corporales en centímetros</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-neutral-800 mb-6 rounded-xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-900 text-white font-mono uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Talle</th>
                <th className="py-3 px-4">Busto (cm)</th>
                <th className="py-3 px-4">Cintura (cm)</th>
                <th className="py-3 px-4">Cadera (cm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans text-neutral-300">
              <tr className="hover:bg-neutral-900/50">
                <td className="py-3 px-4 font-bold text-white">XS (34-36)</td>
                <td className="py-3 px-4">80 - 84</td>
                <td className="py-3 px-4">60 - 64</td>
                <td className="py-3 px-4">88 - 92</td>
              </tr>
              <tr className="hover:bg-neutral-900/50">
                <td className="py-3 px-4 font-bold text-white">S (36-38)</td>
                <td className="py-3 px-4">85 - 89</td>
                <td className="py-3 px-4">65 - 69</td>
                <td className="py-3 px-4">93 - 97</td>
              </tr>
              <tr className="hover:bg-neutral-900/50">
                <td className="py-3 px-4 font-bold text-white">M (40-42)</td>
                <td className="py-3 px-4">90 - 95</td>
                <td className="py-3 px-4">70 - 75</td>
                <td className="py-3 px-4">98 - 103</td>
              </tr>
              <tr className="hover:bg-neutral-900/50">
                <td className="py-3 px-4 font-bold text-white">L (44-46)</td>
                <td className="py-3 px-4">96 - 102</td>
                <td className="py-3 px-4">76 - 82</td>
                <td className="py-3 px-4">104 - 110</td>
              </tr>
              <tr className="hover:bg-neutral-900/50">
                <td className="py-3 px-4 font-bold text-white">XL (48)</td>
                <td className="py-3 px-4">103 - 110</td>
                <td className="py-3 px-4">83 - 90</td>
                <td className="py-3 px-4">111 - 118</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-neutral-900/80 p-4 border-l-2 border-white text-xs text-neutral-400 space-y-1 rounded-r-xl">
          <p className="font-semibold text-white">¿Dudas entre dos talles?</p>
          <p>
            Nuestras prendas son de corte relajado y estructurado. Si preferís un calce al cuerpo, elegí tu talle habitual. Para un look más oversize, te sugerimos un talle más. También podés consultarnos por WhatsApp antes de tu pedido.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-white text-black text-xs uppercase tracking-[0.2em] font-bold hover:bg-neutral-200 transition-colors cursor-pointer rounded-xl"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};
