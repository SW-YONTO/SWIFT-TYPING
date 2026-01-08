import React from 'react';
import { RotateCcw, Play, Pause, Eye, EyeOff, Settings, Volume2, VolumeX } from 'lucide-react';

/**
 * TypingControls - Control buttons for typing practice
 */
const TypingControls = React.memo(({
  isActive,
  isPaused,
  focusMode,
  soundEnabled,
  theme,
  onRestart,
  onTogglePause,
  onToggleFocusMode,
  onToggleSound,
  onOpenCustomize
}) => {
  return (
    <div className="flex gap-2" role="toolbar" aria-label="Typing controls">
      {/* Sound Toggle */}
      <button
        onClick={onToggleSound}
        className={`flex items-center gap-2 ${soundEnabled ? theme.primary : 'bg-gray-500'} text-white px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg transform active:scale-95`}
        title={soundEnabled ? 'Sounds On' : 'Sounds Off'}
        aria-label={soundEnabled ? 'Disable sound effects' : 'Enable sound effects'}
        aria-pressed={soundEnabled}
      >
        {soundEnabled ? <Volume2 className="w-4 h-4 text-white" aria-hidden="true" /> : <VolumeX className="w-4 h-4 text-white" aria-hidden="true" />}
      </button>
      
      {/* Customize Button */}
      <button
        onClick={onOpenCustomize}
        className={`flex items-center gap-2 ${theme.primary} text-white px-4 py-2 rounded-lg text-sm ${theme.primaryHover} transition-all duration-200 hover:scale-105 hover:shadow-lg transform active:scale-95`}
        aria-label="Open customize settings"
      >
        <Settings className="w-4 h-4 text-white" aria-hidden="true" />
        <span className="hidden sm:inline">Customize</span>
      </button>
      
      {/* Focus Mode Toggle */}
      <button
        onClick={onToggleFocusMode}
        className={`flex items-center gap-2 ${theme.accent} text-white px-4 py-2 rounded-lg text-sm ${theme.accentHover} transition-all duration-200 hover:scale-105 hover:shadow-lg transform active:scale-95`}
        aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
        aria-pressed={focusMode}
      >
        {focusMode ? <EyeOff className="w-4 h-4 text-white" aria-hidden="true" /> : <Eye className="w-4 h-4 text-white" aria-hidden="true" />}
        <span className="hidden sm:inline">{focusMode ? 'Exit Focus' : 'Focus'}</span>
      </button>
      
      {/* Pause/Resume Button */}
      <button
        onClick={onTogglePause}
        className={`flex items-center gap-2 ${isActive ? theme.secondary : 'bg-gray-400'} text-white px-4 py-2 rounded-lg text-sm ${theme.secondaryHover} transition-all duration-200 hover:scale-105 hover:shadow-lg transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
        disabled={!isActive}
        aria-label={isPaused ? 'Resume typing' : 'Pause typing'}
        aria-pressed={isPaused}
      >
        {isPaused ? <Play className="w-4 h-4 text-white" aria-hidden="true" /> : <Pause className="w-4 h-4 text-white" aria-hidden="true" />}
        <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
      </button>
      
      {/* Restart Button */}
      <button
        onClick={onRestart}
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg transform active:scale-95"
        aria-label="Restart typing practice"
      >
        <RotateCcw className="w-4 h-4 text-white" aria-hidden="true" />
        <span className="hidden sm:inline">Restart</span>
      </button>
    </div>
  );
});

TypingControls.displayName = 'TypingControls';

export default TypingControls;
