import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { soundEffects } from '../utils/soundEffects';

const ArenaTypingRace = ({ text, onProgress, onFinish, opponentProgress, opponentWpm, opponentName = 'Opponent', opponentAvatar, playerName = 'You', playerAvatar }) => {
  const { theme, isDarkMode } = useTheme();
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef(null);

  const words = text.split(' ');
  const inputWords = input.split(' ');
  const currentWordIndex = input.endsWith(' ') ? inputWords.length - 1 : inputWords.length - 1;
  
  // Calculate progress percentage based on characters typed correctly
  const targetChars = text.length;
  const typedChars = input.length;
  
  // Hard stop mechanic:
  // Is the current input valid so far?
  const expectedPrefix = text.substring(0, input.length);
  const hasError = input !== expectedPrefix;

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (!startTime && input.length > 0) {
      setStartTime(Date.now());
    }

    if (startTime && !isFinished) {
      const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
      const wordsTyped = input.length / 5;
      const currentWpm = Math.round(wordsTyped / timeElapsed) || 0;
      setWpm(currentWpm);
      
      const progress = Math.min(100, Math.round((typedChars / targetChars) * 100));
      
      if (!hasError) {
        onProgress(progress, currentWpm);
      }

      if (input === text) {
        setIsFinished(true);
        onFinish(currentWpm);
        soundEffects.playSuccess();
      }
    }
  }, [input, startTime, text, hasError, isFinished, typedChars, targetChars, onProgress, onFinish]);

  const handleChange = (e) => {
    if (isFinished) return;
    
    const val = e.target.value;
    
    // HARD STOP MECHANIC
    // Only allow typing if the previous input was completely correct, OR if they are hitting backspace to fix it.
    if (hasError && val.length > input.length) {
      // Play error sound and reject input
      soundEffects.playError();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);
      return;
    }

    setInput(val);
  };

  const renderText = () => {
    return text.split('').map((char, index) => {
      let colorClass = 'letter-untyped';

      if (index < input.length) {
        if (input[index] === char) {
          colorClass = 'letter-correct';
        } else {
          colorClass = 'letter-incorrect';
        }
      }

      const shouldShowCaret = index === input.length;
      const caretColor = theme.css?.['--theme-cursor'] || '#3b82f6';

      return (
        <span key={index} className={`letter ${colorClass} relative transition-colors duration-75`}>
          {char === ' ' ? '\u00A0' : char}
          {shouldShowCaret && (
            <span className="caret" style={{ backgroundColor: caretColor }} />
          )}
        </span>
      );
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Progress Bars */}
      <div className="space-y-6">
        {/* Opponent Progress */}
        <div className="relative pt-6">
          <div className="flex items-center justify-between text-sm mb-2 font-bold text-purple-500">
            <div className="flex items-center gap-2">
              {opponentAvatar ? (
                <img src={opponentAvatar} alt={opponentName} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs">
                  {opponentName.charAt(0).toUpperCase()}
                </div>
              )}
              <span>{opponentName}</span>
            </div>
            <span className="bg-purple-500 text-white px-2 py-1 rounded-md">{opponentWpm || 0} WPM</span>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-300 dark:border-gray-700">
            <div 
              className="h-full bg-purple-500 transition-all duration-300 ease-out"
              style={{ width: `${opponentProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Player Progress */}
        <div className="relative pt-2">
          <div className={`flex items-center justify-between text-sm mb-2 font-bold ${theme.text}`}>
            <div className="flex items-center gap-2">
              {playerAvatar ? (
                <img src={playerAvatar} alt={playerName} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className={`w-6 h-6 rounded-full ${theme.primary} text-white flex items-center justify-center text-xs`}>
                  {playerName.charAt(0).toUpperCase()}
                </div>
              )}
              <span>{playerName} (You)</span>
            </div>
            <span className={`${theme.primary} text-white px-2 py-1 rounded-md`}>{wpm} WPM</span>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-300 dark:border-gray-700 shadow-inner">
            <div 
              className={`h-full ${theme.primary} transition-all duration-100 ease-out`}
              style={{ width: `${Math.min(100, Math.round((typedChars / targetChars) * 100))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Typing Area */}
      <div 
        className={`${theme.cardBg} rounded-2xl p-8 border-2 ${theme.border} shadow-lg transition-colors duration-200 cursor-text relative overflow-hidden ${isShaking ? 'animate-[shake_0.3s_ease-in-out_1]' : ''}`}
        onClick={() => inputRef.current?.focus()}
        style={{
          animation: isShaking ? 'shake 0.3s cubic-bezier(.36,.07,.19,.97) both' : 'none',
          '--letter-correct-color': theme.css?.['--theme-primary'] || theme.css?.['--theme-accent'] || (isDarkMode ? '#10b981' : '#059669')
        }}
      >
        <style>
          {`
            @keyframes shake {
              10%, 90% { transform: translate3d(-1px, 0, 0); }
              20%, 80% { transform: translate3d(1px, 0, 0); }
              30%, 50%, 70% { transform: translate3d(-2px, 0, 0); }
              40%, 60% { transform: translate3d(2px, 0, 0); }
            }
          `}
        </style>
        <div className={`text-2xl leading-relaxed font-medium tracking-wide ${theme.fontFamily === 'mono' ? 'font-mono' : 'font-sans'}`} style={{ wordSpacing: '0.2em' }}>
          {renderText()}
        </div>
        
        {/* Hidden Input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleChange}
          className="absolute opacity-0 pointer-events-none w-full h-full inset-0"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </div>
    </div>
  );
};

export default ArenaTypingRace;
