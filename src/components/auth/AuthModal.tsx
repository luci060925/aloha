import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { X, Mail, User, Lock, Phone, MapPin, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { isSupabaseConfigured } from '../../lib/supabase';
import { MIN_PASSWORD_LENGTH } from '../../lib/constants';

// Se monta al abrir el modal: al cerrarlo se descarta el correo, la contraseña y el resto de los campos
const AuthModalContent: React.FC = () => {
  const {
    setIsAuthModalOpen,
    loginWithSocial,
    loginWithEmail,
    registerUser,
    requestPasswordReset,
    authNotice,
    setAuthNotice,
  } = useStore();

  // Form states
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(authNotice ? 'forgot' : 'login');
  const isRegisterMode = mode === 'register';
  const isForgotMode = mode === 'forgot';
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleChangeMode = (next: 'login' | 'register' | 'forgot') => {
    setMode(next);
    setErrorMessage('');
    setInfoMessage('');
    setAuthNotice('');
    setShowPassword(false);
  };

  const handleGoogle = async () => {
    setErrorMessage('');
    setGoogleLoading(true);
    const error = await loginWithSocial('google');
    // Sin error, el navegador viaja a Google y vuelve con la sesión iniciada
    if (error) {
      setErrorMessage(error);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!email.trim()) {
      setErrorMessage('Por favor ingresá tu correo electrónico.');
      return;
    }

    if (isForgotMode) {
      setLoading(true);
      const error = await requestPasswordReset(email);
      setLoading(false);
      if (error) {
        setErrorMessage(error);
      } else {
        setAuthNotice('');
        setInfoMessage('Si el correo está registrado, te enviamos un enlace para elegir una contraseña nueva. Revisá también la carpeta de spam.');
      }
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
            {isRegisterMode ? 'Crear Cuenta' : isForgotMode ? 'Recuperar Contraseña' : 'Acceso a tu Cuenta'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
            {isRegisterMode 
              ? 'Registrate para agilizar tus compras y cotizaciones.'
              : isForgotMode
              ? 'Ingresá tu correo y te enviamos un enlace para elegir una contraseña nueva.'
              : 'Ingresá con tu cuenta para gestionar pedidos.'}
          </p>
        </div>

        {/* Aviso (p. ej. enlace del correo vencido) */}
        {authNotice && (
          <div className="mb-4 p-3 bg-amber-950/60 border border-amber-800 text-amber-200 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{authNotice}</span>
          </div>
        )}

        {/* Confirmación */}
        {infoMessage && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Acceso con Google (requiere habilitar el proveedor en Supabase: ver docs/login-google.md) */}
        {isSupabaseConfigured && !isForgotMode && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="w-full py-2.5 px-4 border border-neutral-700 bg-neutral-900 text-white text-xs uppercase tracking-wider font-bold hover:bg-neutral-800 hover:border-white transition-colors flex items-center justify-center gap-3 cursor-pointer rounded-xl disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span>{googleLoading ? 'Conectando con Google...' : 'Continuar con Google'}</span>
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-neutral-800 w-full" />
              <span className="bg-[#121212] px-3 text-[10px] text-neutral-500 uppercase tracking-widest font-mono font-bold whitespace-nowrap">
                O con tu correo
              </span>
              <div className="border-t border-neutral-800 w-full" />
            </div>
          </>
        )}

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

          {/* Contraseña (no se pide al recuperarla) */}
          {!isForgotMode && (
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
                placeholder={isRegisterMode ? `Creá una contraseña (mínimo ${MIN_PASSWORD_LENGTH} caracteres)` : 'Ingresá tu contraseña'}
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
            {mode === 'login' && isSupabaseConfigured && (
              <button
                type="button"
                onClick={() => handleChangeMode('forgot')}
                className="mt-1.5 text-[11px] text-neutral-400 hover:text-white underline cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>
          )}

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
            ) : isForgotMode ? (
              <span>Enviarme el enlace</span>
            ) : (
              <span>Ingresar a mi cuenta</span>
            )}
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="mt-4 pt-3 border-t border-neutral-800/80 text-center">
          <button
            type="button"
            onClick={() => handleChangeMode(mode === 'login' ? 'register' : 'login')}
            className="text-xs text-neutral-400 hover:text-white underline font-semibold cursor-pointer"
          >
            {mode === 'login' ? '¿No tenés cuenta? Registrate acá' : mode === 'register' ? '¿Ya tenés cuenta? Iniciar sesión' : 'Volver a iniciar sesión'}
          </button>
        </div>

      </div>
    </div>
  );
};

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen } = useStore();

  if (!isAuthModalOpen) return null;
  return <AuthModalContent />;
};
