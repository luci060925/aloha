import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { MIN_PASSWORD_LENGTH } from '../../lib/constants';

// Se muestra cuando la clienta vuelve desde el enlace "restablecer contraseña" del correo.
// Supabase ya abrió una sesión temporal con ese enlace: solo falta elegir la contraseña nueva.
const PasswordRecoveryContent: React.FC = () => {
  const { updatePassword, closePasswordRecovery } = useStore();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrorMessage(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirm) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const error = await updatePassword(password);
    setLoading(false);

    if (error) {
      setErrorMessage(error);
    } else {
      setPassword('');
      setConfirm('');
      setDone(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recovery-title"
        className="bg-[#121212] text-white max-w-md w-full p-6 sm:p-8 relative shadow-2xl border border-neutral-800 rounded-2xl my-auto"
      >
        <div className="text-center mb-6">
          <BrandLogo className="h-8 w-auto mx-auto mb-2" variant="light" />
          <h2 id="recovery-title" className="text-xs uppercase tracking-[0.2em] text-neutral-300 font-mono font-bold">
            {done ? 'Contraseña actualizada' : 'Elegí tu contraseña nueva'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
            {done
              ? 'Ya podés seguir comprando con tu cuenta.'
              : 'Escribí la contraseña nueva para tu cuenta de Aloha.'}
          </p>
        </div>

        {done ? (
          <>
            <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Tu contraseña se cambió correctamente y tu sesión está iniciada.</span>
            </div>
            <button
              type="button"
              onClick={closePasswordRecovery}
              className="w-full py-3 bg-white text-black text-xs uppercase tracking-[0.18em] font-bold hover:bg-neutral-200 transition-colors cursor-pointer rounded-xl"
            >
              Ir a la tienda
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMessage && (
              <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300 mb-1">
                Contraseña nueva *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
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

            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-neutral-300 mb-1">
                Repetí la contraseña *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Volvé a escribirla"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-700 bg-neutral-900 text-white rounded-lg focus:outline-none focus:border-white font-medium placeholder:text-neutral-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white text-black text-xs uppercase tracking-[0.18em] font-bold hover:bg-neutral-200 transition-colors cursor-pointer rounded-xl shadow-sm mt-2 disabled:opacity-60"
            >
              {loading ? 'Guardando...' : 'Guardar contraseña nueva'}
            </button>

            <button
              type="button"
              onClick={closePasswordRecovery}
              className="w-full text-xs text-neutral-400 hover:text-white underline font-semibold cursor-pointer pt-1"
            >
              Cambiarla más tarde
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const PasswordRecoveryModal: React.FC = () => {
  const { isPasswordRecovery } = useStore();

  if (!isPasswordRecovery) return null;
  return <PasswordRecoveryContent />;
};
