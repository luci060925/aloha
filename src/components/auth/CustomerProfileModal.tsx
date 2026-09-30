import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { X, LogOut, Check, ShieldCheck, PackageCheck } from 'lucide-react';
import type { UserProfile } from '../../types';
import { isTrustedAvatarUrl } from '../../lib/external';

// Se monta al abrir el perfil, así el formulario arranca con los datos actuales sin efectos de sincronización
const ProfileModalContent: React.FC<{ currentUser: UserProfile }> = ({ currentUser }) => {
  const {
    setIsProfileModalOpen,
    setIsCartOpen,
    updateUserProfile,
    logout,
    setCurrentView,
  } = useStore();

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const avatarUrl = isTrustedAvatarUrl(currentUser.avatarUrl) ? currentUser.avatarUrl || '' : '';
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [city, setCity] = useState(currentUser?.address?.city || 'Comodoro Rivadavia');
  const [province, setProvince] = useState(currentUser?.address?.province || 'Chubut');
  const [postalCode, setPostalCode] = useState(currentUser?.address?.postalCode || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      fullName,
      avatarUrl,
      phone,
      address: {
        ...(currentUser.address || {}),
        city,
        province,
        postalCode,
      },
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleLogout = () => {
    logout();
    setIsProfileModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-[#121212] text-white max-w-lg w-full p-6 sm:p-8 relative shadow-2xl border border-neutral-800 my-auto rounded-2xl">
        
        {/* Close Button */}
        <button
          onClick={() => setIsProfileModalOpen(false)}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white transition-colors cursor-pointer rounded-full hover:bg-neutral-800"
          aria-label="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Avatar (inicial del nombre; la foto de perfil se retiró para no guardar imágenes pesadas) */}
        <div className="flex items-center gap-4 pb-6 border-b border-neutral-800">
          <div className="relative group shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border-2 border-neutral-700 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center text-xl font-bold font-serif shadow-md">
                {fullName ? fullName.charAt(0).toUpperCase() : 'A'}
              </div>
            )}

          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-2xl font-bold tracking-wide text-white truncate">
                {currentUser.fullName}
              </h3>
              {currentUser.isAdmin && (
                <span className="bg-white text-black text-[9px] font-mono px-2 py-0.5 rounded uppercase tracking-wider font-bold shrink-0">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 font-mono truncate">{currentUser.email}</p>
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setIsCartOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-3 py-1 rounded-md transition-colors cursor-pointer"
              >
                <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ver Mis Pedidos</span>
              </button>

              {currentUser.isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    setCurrentView('admin');
                  }}
                  className="inline-flex items-center gap-1.5 text-[11px] text-amber-300 hover:text-amber-200 bg-neutral-900 border border-amber-800/60 px-3 py-1 rounded-md font-semibold cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Panel Admin</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="pt-5 space-y-4">
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-neutral-400 font-mono">
            Datos Personales y de Contacto
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wider font-medium text-neutral-300 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-neutral-900 text-white border border-neutral-750 rounded-lg focus:outline-none focus:border-white transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-neutral-300 mb-1">
                  Ciudad / Localidad
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Comodoro Rivadavia"
                  className="w-full px-3 py-2.5 text-xs bg-neutral-900 text-white border border-neutral-750 rounded-lg focus:outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-neutral-300 mb-1">
                  Provincia
                </label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Chubut"
                  className="w-full px-3 py-2.5 text-xs bg-neutral-900 text-white border border-neutral-750 rounded-lg focus:outline-none focus:border-white transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-neutral-300 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 297 123-4567"
                  className="w-full px-3 py-2.5 text-xs bg-neutral-900 text-white border border-neutral-750 rounded-lg focus:outline-none focus:border-white font-mono placeholder:text-neutral-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-medium text-neutral-300 mb-1">
                  Código Postal
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="9000"
                  className="w-full px-3 py-2.5 text-xs bg-neutral-900 text-white border border-neutral-750 rounded-lg focus:outline-none focus:border-white font-mono placeholder:text-neutral-600 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              className="flex-1 py-3 bg-white text-black text-xs uppercase tracking-[0.2em] font-bold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer rounded-xl shadow-sm"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>¡Datos Guardados!</span>
                </>
              ) : (
                <span>Guardar Cambios</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="py-3 px-4 border border-neutral-700 text-neutral-300 hover:text-red-400 hover:border-red-400/50 text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer rounded-xl"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export const CustomerProfileModal: React.FC = () => {
  const { currentUser, isProfileModalOpen } = useStore();

  if (!isProfileModalOpen || !currentUser) return null;
  return <ProfileModalContent currentUser={currentUser} />;
};
