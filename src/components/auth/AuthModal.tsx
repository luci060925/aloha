import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { X, Mail, User, Lock, Phone, MapPin, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginWithEmail,
    registerUser,
  } = useStore();

  // Form states
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isAuthModalOpen) return null;

  const resetForm = () => {
    setErrorMessage('');
    setShowPassword(false);
  };

  const handleToggleMode = (register: boolean) => {
    setIsRegisterMode(register);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Por favor ingresá tu correo electrónico.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Por favor ingresá tu contraseña.');
      return;
    }

    setLoading(true);

    try {
      if (isRegisterMode) {
        if (!fullName.trim()) {
          setErrorMessage('Por favor completá tu nombre y apellido.');
          setLoading(false);
          return;
        }
        if (!phone.trim()) {
          setErrorMessage('Por favor ingresá tu número de teléfono / WhatsApp.');
          setLoading(false);
          return;
        }

        const res = await registerUser({
          fullName,
          email,
          password,
          phone,
          postalCode,
        });

        if (!res.success && res.message) {
          setErrorMessage(res.message);
        }
      } else {
        const res = await loginWithEmail(email, password);
        if (!res.success && res.message) {
          setErrorMessage(res.message);
        }
      }
    } catch (err) {
      setErrorMessage(err instanceof Error && err.message ? err.message : 'Ocurrió un error. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#121212] text-white max-w-md w-full p-6 sm:p-8 relative shadow-2xl border border-neutral-800 rounded-2xl my-auto">
        
        {/* Close button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 w-9 h-9 bg-neutral-900 hover:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer border border-neutral-700"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <BrandLogo className="h-8 w-auto mx-auto mb-2" variant="light" />
          <h2 className="text-xs uppercase tracking-[0.2em] text-neutral-300 font-mono font-bold">
            {isRegisterMode ? 'Crear Cuenta' : 'Acceso a tu Cuenta'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
            {isRegisterMode 
              ? 'Registrate para agilizar tus compras y cotizaciones.'
              : 'Ingresá con tu cuenta para gestionar pedidos.'}
          </p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Acceso con Google: oculto hasta configurar el proveedor en Supabase (Authentication > Providers) */}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Registration Fields */}
          {isRegisterMode && (
            <>
              {/* Nombre y Apellido */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300 mb-1">
                  Nombre y Apellido *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej: Carolina Morales"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-700 bg-neutral-900 text-white rounded-lg focus:outline-none focus:border-white font-medium placeholder:text-neutral-500"
                  />
                </div>
              </div>

              {/* Teléfono / WhatsApp */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300 mb-1">
                  Teléfono / WhatsApp *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: 297 154123456"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-700 bg-neutral-900 text-white rounded-lg focus:outline-none focus:border-white font-medium placeholder:text-neutral-500 font-mono"
                  />
                </div>
              </div>

              {/* Código Postal */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300 mb-1">
                  Código Postal
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="Ej: 9000 (Comodoro Rivadavia)"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-700 bg-neutral-900 text-white rounded-lg focus:outline-none focus:border-white font-medium placeholder:text-neutral-500 font-mono"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300 mb-1">
              Correo Electrónico *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tuemail@ejemplo.com"
                className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-700 bg-neutral-900 text-white rounded-lg focus:outline-none focus:border-white font-medium placeholder:text-neutral-500"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300 mb-1">
              Contraseña *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegisterMode ? 'Creá una contraseña segura' : 'Ingresá tu contraseña'}
                className="w-full pl-9 pr-10 py-2 text-xs border border-neutral-700 bg-neutral-900 text-white rounded-lg focus:outline-none focus:border-white font-medium placeholder:text-neutral-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-white cursor-pointer"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black text-xs uppercase tracking-[0.18em] font-bold hover:bg-neutral-200 transition-colors cursor-pointer rounded-xl shadow-sm mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Procesando...</span>
            ) : isRegisterMode ? (
              <span>Crear cuenta</span>
            ) : (
              <span>Ingresar a mi cuenta</span>
            )}
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="mt-4 pt-3 border-t border-neutral-800/80 text-center">
          <button
            type="button"
            onClick={() => handleToggleMode(!isRegisterMode)}
            className="text-xs text-neutral-400 hover:text-white underline font-semibold cursor-pointer"
          >
            {isRegisterMode ? '¿Ya tenés cuenta? Iniciar sesión' : '¿No tenés cuenta? Registrate acá'}
          </button>
        </div>

      </div>
    </div>
  );
};
