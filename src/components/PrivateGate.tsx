import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Lock, Unlock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { BrainMascot } from './BrainMascot.tsx';

interface PrivateGateProps {
  memoryId?: string;
  category?: string;
  date?: string;
  onUnlocked: (data: { password: string; memory?: any }) => void;
  onCancel?: () => void;
}

export const PrivateGate: React.FC<PrivateGateProps> = ({
  memoryId,
  category,
  date,
  onUnlocked,
  onCancel,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isVerifying) return;

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      // Security: Password is sent strictly to the backend server!
      const res = await fetch('/api/verify-private', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: password.trim(),
          memoryId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage(data.message || 'Ha, o‘zing ekansan 😂');
        setTimeout(() => {
          onUnlocked({ password: password.trim(), memory: data.memory });
        }, 800);
      } else {
        setErrorMessage(data.message || 'Yo‘q 😂 Bu parol emas.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err) {
      setErrorMessage('Server bilan aloqa uzildi. Yana bir bor urinib ko‘ring.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-6 px-4 animate-fade-in">
      <div
        className={`relative overflow-hidden rounded-3xl bg-[#0c0809] border-2 border-red-500/50 shadow-[0_0_50px_rgba(244,63,94,0.2)] p-6 sm:p-8 text-center ${
          shake ? 'animate-glitch' : ''
        }`}
      >
        {/* Ambient red hazard stripes at top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 animate-pulse" />

        {/* Mascot in Secret / Sunglasses mood */}
        <div className="mb-4">
          <BrainMascot mood="private" size={70} />
        </div>

        {/* Big Alert Heading */}
        <div className="flex items-center justify-center gap-2 text-red-500 mb-1">
          <ShieldAlert className="w-7 h-7 animate-bounce" />
          <h2 className="font-display text-3xl sm:text-4xl font-black tracking-tight uppercase">
            🚨 EI, EI...
          </h2>
          <ShieldAlert className="w-7 h-7 animate-bounce" />
        </div>

        <p className="text-red-400 font-bold text-lg sm:text-xl mb-1">
          Bu joyga ruxsatsiz kirish mumkin emas 😂
        </p>

        <p className="text-neutral-400 text-sm mb-6 font-mono">
          “Bu ma’lumot MAXFIY.”
        </p>

        {/* Metadata pills */}
        {(category || date) && (
          <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-red-950/40 border border-red-800/40 text-xs font-mono text-red-300 mb-6">
            {category && <span>📂 Papka: {category}</span>}
            {date && <span>📅 Sana: {date}</span>}
          </div>
        )}

        {/* Password Entry Form */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <KeyRound className="w-4 h-4 text-red-400" />
            </div>

            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="Parolni kiriting... (e.g. miya2025)"
              disabled={isVerifying || Boolean(successMessage)}
              autoFocus
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-neutral-900/90 border border-red-500/40 text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/20 text-sm tracking-wider"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-500 hover:text-neutral-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-rose-400 bg-rose-950/40 py-2 px-3 rounded-xl border border-rose-800/40 animate-bounce">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 py-2 px-3 rounded-xl border border-emerald-800/40 animate-pulse">
              <Unlock className="w-4 h-4 shrink-0" />
              <span className="font-bold">{successMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 text-xs font-semibold transition-all"
              >
                Bekor qilish
              </button>
            )}

            <button
              type="submit"
              disabled={!password.trim() || isVerifying || Boolean(successMessage)}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold tracking-wide transition-all shadow-lg hover:shadow-red-500/30 disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Lock className="w-4 h-4 animate-spin" />
                  <span>Tekshirilmoqda...</span>
                </>
              ) : successMessage ? (
                <>
                  <Unlock className="w-4 h-4 text-emerald-300" />
                  <span>Ochildi!</span>
                </>
              ) : (
                <>
                  <span>Tekshir 🔐</span>
                </>
              )}
            </button>
          </div>

          {/* Playful hint */}
          <p className="text-[11px] text-neutral-500 font-mono pt-2">
            💡 Egasi bo‘lsangiz standart parol: <code className="text-red-400 font-bold bg-neutral-900 px-1 py-0.5 rounded">miya2025</code>
          </p>
        </form>
      </div>
    </div>
  );
};
