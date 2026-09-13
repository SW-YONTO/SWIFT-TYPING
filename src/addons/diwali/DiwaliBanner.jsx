import React, { useState, useEffect } from 'react';
import { Sparkles, X, Palette } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { soundEffects } from '../../utils/soundEffects';

export const DiwaliBanner = ({ currentUser }) => {
  const { changeTheme } = useTheme();
  const [visible, setVisible] = useState(false);

  // Per-account announcement tracking key so every user gets notified exactly once
  const accountKey = currentUser?.id ? `swift_diwali_announced_${currentUser.id}` : 'swift_diwali_announced_guest';

  useEffect(() => {
    try {
      const alreadyAnnounced = localStorage.getItem(accountKey);
      if (!alreadyAnnounced) {
        // Small delay so it appears smoothly after page mounts
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // safe fallback
    }
  }, [accountKey]);

  const handleDismiss = React.useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(accountKey, 'true');
    } catch {
      // safe fallback
    }
  }, [accountKey]);

  // Auto-dismiss after 12s so it never lingers if ignored
  useEffect(() => {
    if (!visible) return;
    const autoDismiss = setTimeout(() => {
      handleDismiss();
    }, 12000);
    return () => clearTimeout(autoDismiss);
  }, [visible, handleDismiss]);

  const handleApplyTheme = () => {
    changeTheme('diwali');
    soundEffects.playSuccess();
    handleDismiss();
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm sm:max-w-md w-[calc(100%-3rem)] sm:w-auto festive-banner-animate pointer-events-auto select-none">
      <div className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-[#191124]/95 text-[#fef3c7] border-2 border-amber-500/70 shadow-[0_12px_36px_rgba(245,158,11,0.35)] backdrop-blur-md">
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shrink-0">
          🪔
        </div>
        <div className="pr-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <strong className="text-amber-400 font-bold text-xs uppercase tracking-wider">Shubh Deepawali!</strong>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-semibold">Festive</span>
          </div>
          <p className="text-xs text-[#fde68a] opacity-90 leading-snug">
            Festive Theme & Mechanical Sounds are live.
          </p>
        </div>

        <div className="flex items-center gap-2 ml-auto shrink-0">
          <button
            onClick={handleApplyTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-xs transition-transform active:scale-95 shadow-md cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Try Theme</span>
          </button>
          
          <button
            onClick={handleDismiss}
            aria-label="Dismiss festive announcement"
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
