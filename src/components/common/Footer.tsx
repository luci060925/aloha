import React from 'react';
import { useStore } from '../../context/StoreContext';
import { 
  MapPin, 
  Phone, 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  Lock
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { openExternal, safeUrl } from '../../lib/external';

export const Footer: React.FC = () => {
  const { 
    settings,
    currentUser,
    setIsLocationModalOpen,
    setCurrentView,
    setActiveInfoModal,
    setSelectedCategory,
  } = useStore();

  return (
    <footer className="bg-black text-white border-t border-neutral-800">
      
      {/* Value Proposition Bar */}
      <div className="border-b border-neutral-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* 1. Envíos */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 sm:gap-4 text-center sm:text-left justify-center sm:justify-start">
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-full shrink-0 shadow-sm">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider font-bold text-white">Envíos a Todo el País</h4>
              <p className="text-xs text-neutral-300 mt-1 font-medium max-w-xs mx-auto sm:mx-0">
                Coordinamos tu envío directamente por WhatsApp.
              </p>
            </div>
          </div>

          {/* 2. Showroom */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 sm:gap-4 text-center sm:text-left justify-center sm:justify-start">
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-full shrink-0 shadow-sm">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider font-bold text-white">Showroom Exclusivo</h4>
              <p className="text-xs text-neutral-300 mt-1 font-medium max-w-xs mx-auto sm:mx-0">
                {settings.openingHours}
              </p>
            </div>
          </div>

          {/* 3. Compra Segura */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 sm:gap-4 text-center sm:text-left justify-center sm:justify-start">
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-full shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider font-bold text-white">Compra Segura</h4>
              <p className="text-xs text-neutral-300 mt-1 font-medium max-w-xs mx-auto sm:mx-0">
                Asesoramiento directo y confirmación vía WhatsApp.
              </p>
            </div>
          </div>

          {/* 4. Medios de Pago */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 sm:gap-4 text-center sm:text-left justify-center sm:justify-start">
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-full shrink-0 shadow-sm">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider font-bold text-white">Medios de Pago</h4>
              <p className="text-xs text-neutral-300 mt-1 font-medium max-w-xs mx-auto sm:mx-0">
                Transferencia bancaria; efectivo o débito en el showroom.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 sm:gap-8">
          
          {/* Brand & Socials Column */}
          <div className="lg:col-span-5 space-y-4 flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="flex justify-center sm:justify-start w-full">
              <BrandLogo className="h-10 w-auto mx-auto sm:mx-0" variant="light" />
            </div>
            <p className="text-xs text-neutral-300 font-medium leading-relaxed max-w-sm mx-auto sm:mx-0">
              Bienvenida a nuestra tienda. Estamos acá para ayudarte a encontrar el look perfecto.
            </p>

            {/* Complete Social Channels */}
            <div className="pt-2 flex flex-col items-center sm:items-start w-full">
              <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-neutral-400 font-bold mb-2.5">
                Redes Oficiales
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                {/* Instagram */}
                <a
                  href={safeUrl(settings.instagramUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-full text-neutral-200 hover:text-white hover:border-white transition-colors"
                  title={`Instagram: @${settings.instagramHandle}`}
                  aria-label="Instagram de Aloha"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>

                {/* WhatsApp */}
                <button
                  onClick={() => {
                    const phone = settings.whatsappNumber.replace(/[^0-9]/g, '');
                    openExternal(`https://wa.me/${phone}`);
                  }}
                  className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-full text-neutral-200 hover:text-emerald-400 hover:border-emerald-400 transition-colors cursor-pointer"
                  title="WhatsApp Directo"
                  aria-label="WhatsApp de Aloha"
                >
                  <Phone className="w-4 h-4" />
                </button>

                {/* Facebook */}
                <a
                  href={safeUrl(settings.facebookUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-full text-neutral-200 hover:text-[#1877F2] hover:border-[#1877F2] transition-colors"
                  title="Facebook: Aloha Indumentaria"
                  aria-label="Facebook de Aloha"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* TikTok */}
                <a
                  href={safeUrl(settings.tiktokUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-full text-neutral-200 hover:text-white hover:border-white transition-colors"
                  title="TikTok de Aloha"
                  aria-label="TikTok de Aloha"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3 15.28a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.05a8.28 8.28 0 0 0 4.91 1.6V7.2a4.83 4.83 0 0 1-1-.51z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-4 space-y-3 flex flex-col items-center sm:items-start text-center sm:text-left">
            <p className="text-xs uppercase tracking-[0.2em] font-mono text-neutral-200 font-bold">
              Información & Ayuda
            </p>
            <ul className="space-y-2 text-xs font-medium text-neutral-300 w-full flex flex-col items-center sm:items-start">
              <li>
                <button 
                  onClick={() => setActiveInfoModal('como-comprar')} 
                  className="hover:text-white transition-colors cursor-pointer text-center sm:text-left font-medium"
                >
                  ¿Cómo Comprar en Aloha?
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveInfoModal('devoluciones')} 
                  className="hover:text-white transition-colors cursor-pointer text-center sm:text-left font-medium"
                >
                  Política de Cambios y Devolución
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveInfoModal('terminos')} 
                  className="hover:text-white transition-colors cursor-pointer text-center sm:text-left font-medium"
                >
                  Términos y Condiciones
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveInfoModal('arrepentimiento')}
                  className="hover:text-white transition-colors cursor-pointer text-center sm:text-left font-medium"
                >
                  Botón de Arrepentimiento
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveInfoModal('contacto')} 
                  className="hover:text-white transition-colors cursor-pointer text-center sm:text-left font-medium"
                >
                  Contacto y Redes Oficiales
                </button>
              </li>
              <li>
                <button 
                  onClick={() => {
                    setSelectedCategory('all');
                    const el = document.getElementById('catalogo');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }} 
                  className="hover:text-white transition-colors cursor-pointer text-center sm:text-left font-medium"
                >
                  Últimos Ingresos
                </button>
              </li>
            </ul>
          </div>

          {/* Showroom & Location info */}
          <div className="lg:col-span-3 space-y-3 flex flex-col items-center sm:items-start text-center sm:text-left">
            <p className="text-xs uppercase tracking-[0.2em] font-mono text-neutral-200 font-bold">
              Showroom
            </p>
            <div className="text-xs font-medium text-neutral-300 space-y-1.5 flex flex-col items-center sm:items-start">
              <p className="text-white font-bold">{settings.address}</p>
              <p>{settings.city}, {settings.province}</p>
              <p className="text-neutral-400 font-mono text-[11px] pt-1">{settings.openingHours}</p>
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-white underline underline-offset-4 hover:text-neutral-300 pt-1 cursor-pointer font-bold"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Ver Mapa & GPS</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom copyright & admin bar */}
        <div className="mt-12 pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span>© {new Date().getFullYear()} Aloha Indumentaria. Todos los derechos reservados.</span>
          </div>

          {currentUser?.isAdmin && (
            <div className="flex items-center justify-center sm:justify-end gap-4 text-[11px] font-mono">
              <button
                onClick={() => setCurrentView('admin')}
                className="text-neutral-400 hover:text-white flex items-center gap-1.5 cursor-pointer font-medium transition-colors"
              >
                <Lock className="w-3 h-3" />
                <span>Panel Administrador</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </footer>
  );
};
