import React from 'react';
import { MapPin, Clock, Phone, Navigation, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { openExternal, isHttpUrl } from '../../lib/external';

export const StoreLocationSection: React.FC = () => {
  const { settings } = useStore();
  const configuredPhoto = settings.showroomImageUrl?.trim() ?? '';
  const photo = isHttpUrl(configuredPhoto) ? configuredPhoto : '';

  const handleOpenGoogleMaps = () => {
    const query = encodeURIComponent(`${settings.address}, ${settings.city}, ${settings.province}, Argentina`);
    openExternal(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const handleWhatsAppInquiry = () => {
    const message = encodeURIComponent(`Hola Aloha! Quisiera consultar por horarios y disponibilidad en el local de Comodoro Rivadavia (${settings.address}).`);
    const phone = settings.whatsappNumber.replace(/[^0-9]/g, '');
    openExternal(`https://wa.me/${phone}?text=${message}`);
  };

  return (
    <section id="ubicacion" className="py-20 bg-neutral-950 text-white border-t border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Text & Store Info */}
          <div className="lg:col-span-6 space-y-8 text-center lg:text-left flex flex-col items-center lg:items-start">
            <div className="space-y-3">
              <span className="inline-flex items-center justify-center lg:justify-start gap-2 text-xs uppercase tracking-[0.3em] text-neutral-400 font-mono">
                <MapPin className="w-4 h-4 text-white" />
                Espacio Showroom
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light tracking-wide uppercase">
                Vení a Conocer <br />
                <span className="italic font-normal">Nuestro Local</span>
              </h2>
              <p className="text-neutral-400 text-sm sm:text-base font-light leading-relaxed max-w-lg mx-auto lg:mx-0">
                Vení a conocer de cerca las texturas, probarte cada prenda de nuestra colección y recibir atención personalizada en nuestro showroom exclusivo.
              </p>
            </div>

            {/* TODO(confirmar con la clienta): "Domingos cerrado", "Retiro gratuito" y "Probador y asesoramiento" están fijos en el código */}
            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="p-5 bg-neutral-900/90 border border-neutral-800 rounded-sm text-left">
                <div className="flex items-center gap-3 text-neutral-300 mb-2">
                  <MapPin className="w-4 h-4 text-white" />
                  <span className="text-xs uppercase tracking-wider font-semibold">Ubicación</span>
                </div>
                <p className="text-sm text-white font-serif">{settings.address}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{settings.city}, {settings.province}</p>
              </div>

              <div className="p-5 bg-neutral-900/90 border border-neutral-800 rounded-sm text-left">
                <div className="flex items-center gap-3 text-neutral-300 mb-2">
                  <Clock className="w-4 h-4 text-white" />
                  <span className="text-xs uppercase tracking-wider font-semibold">Horarios</span>
                </div>
                <p className="text-sm text-white font-serif">{settings.openingHours}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Consultar por WhatsApp</p>
              </div>
            </div>

            {/* Benefits & Pickup in Store */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2 border-t border-neutral-800/80 w-full">
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <ShoppingBag className="w-4 h-4 text-white" />
                <span>Retiro de compras online en el showroom</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>Atención personalizada</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-2 w-full">
              <button
                onClick={handleOpenGoogleMaps}
                className="px-6 py-3.5 bg-white text-black text-xs uppercase tracking-[0.2em] font-semibold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Navigation className="w-4 h-4" />
                <span>Cómo llegar (GPS)</span>
              </button>

              <button
                onClick={handleWhatsAppInquiry}
                className="px-6 py-3.5 border border-neutral-600 text-white text-xs uppercase tracking-[0.2em] hover:bg-neutral-900 hover:border-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Consultar por WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Right Column: Visual Showcase & Map Preview */}
          <div className="lg:col-span-6 relative">
            {/* La foto la sube la dueña desde el panel (Ajustes de Tienda → Foto del Showroom). Sin foto: tarjeta oscura. */}
            <div className={`group relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden rounded-sm border border-neutral-800 shadow-2xl ${photo ? 'bg-black' : 'bg-gradient-to-br from-neutral-900 via-[#141414] to-black'}`}>
              {photo ? (
                <img
                  src={photo}
                  alt="Showroom de Aloha Indumentaria"
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  style={{ objectPosition: settings.showroomImagePosition || '50% 50%' }}
                />
              ) : (
                <MapPin className="absolute top-8 right-8 w-24 h-24 text-white/5" aria-hidden="true" />
              )}
              <div className={`absolute inset-0 flex flex-col justify-end p-6 sm:p-8 ${photo ? 'bg-gradient-to-t from-black/70 via-black/10 to-transparent' : ''}`}>
                <div className="bg-black/80 backdrop-blur-md px-4 py-2.5 border border-white/20 self-start">
                  <div className="flex items-center gap-2 text-white text-xs uppercase tracking-widest font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    Showroom Oficial
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
