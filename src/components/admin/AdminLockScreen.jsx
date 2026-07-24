import React from 'react';
import { Lock, ShieldAlert, KeyRound, Eye, EyeOff } from 'lucide-react';

export default function AdminLockScreen({
  theme,
  passwordInput,
  setPasswordInput,
  showPassword,
  setShowPassword,
  authError,
  setAuthError,
  isShaking,
  handleLogin
}) {
  const cardClass = `${theme.cardBg} ${theme.border} border shadow-2xl rounded-3xl transition-all duration-300`;
  const subTextClass = theme.textSecondary || 'text-gray-400';
  const primaryBtnClass = `${theme.primary} ${theme.primaryHover} text-white font-bold transition-all duration-200 shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer`;
  const inputClass = `${theme.inputBg} ${theme.border} border ${theme.text} rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200`;

  return (
    <div className={`min-h-[82vh] flex items-center justify-center p-4 ${theme.text}`}>
      <form 
        onSubmit={handleLogin} 
        className={`${cardClass} p-8 md:p-10 w-full max-w-md space-y-6 transform transition-transform ${isShaking ? 'animate-shake border-red-500/50' : ''}`}
      >
        {/* Header Icon & Title */}
        <div className="text-center space-y-3">
          <div className={`w-20 h-20 ${theme.secondary || 'bg-blue-100'} border-2 ${theme.border} ${theme.accent} rounded-3xl flex items-center justify-center mx-auto shadow-inner transform hover:scale-105 transition-transform duration-300`}>
            <Lock className="w-10 h-10 animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Swift Typing Admin Portal</h2>
          <p className={`text-sm ${subTextClass}`}>Enter master password to unlock admin dashboard</p>
        </div>

        {/* Error Badge */}
        {authError && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl text-sm font-medium flex items-center gap-3 animate-bounce">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span>{authError}</span>
          </div>
        )}

        {/* Password Input with Show/Hide Toggle */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className={`text-xs font-bold uppercase tracking-wider ${subTextClass} flex items-center gap-1.5`}>
              <KeyRound className="w-3.5 h-3.5" /> Master Password
            </label>
            {passwordInput.length > 0 && (
              <span className="text-[11px] font-mono font-semibold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                {passwordInput.length} chars
              </span>
            )}
          </div>

          <div className="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); if (authError) setAuthError(''); }}
              className={`w-full ${inputClass} font-mono pr-12`}
              placeholder="Enter password..."
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 p-2 rounded-xl text-slate-400 hover:text-slate-200 transition-colors focus:outline-none cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          className={`w-full py-4 rounded-2xl ${primaryBtnClass}`}
        >
          Unlock Admin Dashboard
        </button>
      </form>
    </div>
  );
}
