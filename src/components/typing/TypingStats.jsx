import React from 'react';
import { Clock, Target, Zap, Award } from 'lucide-react';
import { formatTime } from '../../utils/storage';

/**
 * TypingStats - Displays live typing statistics (WPM, accuracy, time)
 */
const TypingStats = React.memo(({ 
  wpm, 
  accuracy, 
  timeElapsed, 
  theme,
  showAchievementIndicator = true
}) => {
  return (
    <div 
      className="flex items-center gap-6"
      role="status"
      aria-live="polite"
      aria-label={`WPM: ${wpm}, Accuracy: ${accuracy}%, Time: ${formatTime(timeElapsed)}`}
    >
      {/* WPM Indicator */}
      <div className="flex items-center gap-2 group">
        <div className={`p-2 ${theme.mode === 'dark' ? 'bg-blue-900/40' : 'bg-blue-100'} rounded-full group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
          <Zap className={`w-4 h-4 ${theme.mode === 'dark' ? 'text-blue-300' : 'text-blue-600'} drop-shadow-sm`} aria-hidden="true" />
        </div>
        <div className="flex flex-col items-center">
          <span className={`font-bold text-xl ${theme.text} tabular-nums transition-all duration-300 ${wpm > 0 ? 'animate-bounce-subtle' : ''}`}>
            {wpm}
          </span>
          <span className={`text-xs ${theme.textSecondary} font-medium`}>WPM</span>
        </div>
      </div>
      
      {/* Accuracy Indicator */}
      <div className="flex items-center gap-2 group">
        <div className={`p-2 ${theme.mode === 'dark' ? 'bg-green-900/40' : 'bg-green-100'} rounded-full group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
          <Target className={`w-4 h-4 ${theme.mode === 'dark' ? 'text-green-300' : 'text-green-600'} drop-shadow-sm`} aria-hidden="true" />
        </div>
        <div className="flex flex-col items-center">
          <span className={`font-bold text-xl ${theme.text} tabular-nums transition-all duration-300`}>
            {accuracy}%
          </span>
          <span className={`text-xs ${theme.textSecondary} font-medium`}>ACC</span>
        </div>
      </div>
      
      {/* Time Indicator */}
      <div className="flex items-center gap-2 group">
        <div className={`p-2 ${theme.mode === 'dark' ? 'bg-orange-900/40' : 'bg-orange-100'} rounded-full group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
          <Clock className={`w-4 h-4 ${theme.mode === 'dark' ? 'text-orange-300' : 'text-orange-600'} drop-shadow-sm`} aria-hidden="true" />
        </div>
        <div className="flex flex-col items-center">
          <span className={`font-bold text-xl ${theme.text} tabular-nums`}>
            {formatTime(timeElapsed)}
          </span>
          <span className={`text-xs ${theme.textSecondary} font-medium`}>TIME</span>
        </div>
      </div>
      
      {/* Achievement Indicator */}
      {showAchievementIndicator && (
        <div className="min-w-[85px] flex justify-start">
          {accuracy === 100 ? (
            <div className="flex items-center gap-1 animate-fade-in">
              <Target className={`w-4 h-4 ${theme.mode === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} animate-bounce`} aria-hidden="true" />
              <span className={`text-xs ${theme.mode === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} font-semibold`}>Perfect!</span>
            </div>
          ) : wpm >= 80 && accuracy >= 95 ? (
            <div className="flex items-center gap-1 animate-fade-in">
              <Award className={`w-4 h-4 ${theme.mode === 'dark' ? 'text-amber-400' : 'text-amber-600'} animate-bounce`} aria-hidden="true" />
              <span className={`text-xs ${theme.mode === 'dark' ? 'text-amber-400' : 'text-amber-600'} font-semibold`}>Excellent!</span>
            </div>
          ) : wpm >= 50 ? (
            <div className="flex items-center gap-1 animate-fade-in">
              <Award className={`w-4 h-4 ${theme.mode === 'dark' ? 'text-blue-400' : 'text-blue-600'} animate-bounce`} aria-hidden="true" />
              <span className={`text-xs ${theme.mode === 'dark' ? 'text-blue-400' : 'text-blue-600'} font-semibold`}>Great!</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
});

TypingStats.displayName = 'TypingStats';

export default TypingStats;
