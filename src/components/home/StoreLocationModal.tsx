import React from 'react';
import { X, MapPin, Clock, Phone, Navigation, ExternalLink } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const StoreLocationModal: React.FC = () => {
  const { isLocationModalOpen, setIsLocationModalOpen, settings } = useStore();

  if (!isLocationModalOpen) return null;

  const handleOpenGoogleMaps = () => {
    const query = encodeURIComponent(`${settings.address}, ${settings.city}, ${settings.province}, Argentina`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hola Aloha! Quisiera consultar sobre el stock disponible en el local de ${settings.city}.`);
    const phone = settings.whatsappNumber.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#121212] text-white max-w-md w-full p-6 sm:p-8 relative shadow-2xl border border-neutral-800 rounded-2xl">
        
        {/* Close Button */}
        <button
          onClick={() => setIsLocationModalOpen(false)}
          className="absolute top-4 right-4 w-9 h-9 bg-neutral-900 hover:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer border border-neutral-800"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-7 h-7 text-white" />
          </div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-neutral-400 font-mono font-bold">
            Punto Físico & Retiro
          </span>
          <h3 className="font-serif text-2xl font-bold uppercase tracking-wide text-white mt-1">
            Showroom Oficial
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            {settings.city}, {settings.province}
          </p>
        </div>

        {/* Details Grid */}
        <div className="space-y-3.5 my-6 text-xs bg-neutral-900/90 p-4 rounded-xl border border-neutral-800">
          <div className="flex items-start gap-3">
            <MapPin className="w-4.5 h-4.5 text-white shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Dirección:</p>
              <p className="text-neutral-300 font-medium">{settings.address}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-4.5 h-4.5 text-white shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Horarios de Atención:</p>
              <p className="text-neutral-300 font-medium">{settings.openingHours}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-4.5 h-4.5 text-white shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">WhatsApp Showroom:</p>
              <p className="text-neutral-300 font-mono font-bold">+{settings.whatsappNumber}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleOpenGoogleMaps}
            className="w-full py-3 bg-white text-black text-xs uppercase tracking-[0.18em] font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xl shadow-sm"
          >
            <Navigation className="w-4 h-4" />
            <span>Abrir en Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1 text-neutral-600" />
          </button>

          <button
            onClick={handleWhatsApp}
            className="w-full py-2.5 border border-neutral-700 text-neutral-200 text-xs uppercase tracking-[0.18em] font-bold hover:bg-neutral-900 transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xl"
          >
            <Phone className="w-4 h-4" />
            <span>Escribir por WhatsApp</span>
          </button>
        </div>

      </div>
    </div>
  );
};
