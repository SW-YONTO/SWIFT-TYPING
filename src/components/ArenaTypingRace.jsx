import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { soundEffects } from '../utils/soundEffects';
import { ArrowBigUp } from 'lucide-react';

const ArenaTypingRace = ({ text, onProgress, onFinish, opponentProgress, opponentWpm, opponentName = 'Opponent', opponentAvatar, playerName = 'You', playerAvatar }) => {
  const { theme, isDarkMode } = useTheme();
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef(null);
  const [capsLockOn, setCapsLockOn] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.getModifierState) {
        setCapsLockOn(e.getModifierState('CapsLock'));
      }
    };
    const handleKeyUp = (e) => {
      if (e.getModifierState) {
        setCapsLockOn(e.getModifierState('CapsLock'));
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
  }, []);

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
      const timeElapsedSeconds = Math.round((Date.now() - startTime) / 1000);
      const timeElapsed = (Date.now() - startTime) / 1000 / 60; // in minutes
      const wordsTyped = input.length / 5;
      const currentWpm = Math.round(wordsTyped / timeElapsed) || 0;
      setWpm(currentWpm);
      
      const progress = Math.min(100, Math.round((typedChars / targetChars) * 100));
      
      if (!hasError) {
        onProgress(progress, currentWpm, timeElapsedSeconds);
      }

      if (input === text) {
        setIsFinished(true);
        onFinish(currentWpm, timeElapsedSeconds);
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
    // Split text into words, including trailing space inside the word
    const wordList = [];
    let currentLetters = [];
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      currentLetters.push({ char, index: i });
      
      // If it's a space or the last character of the text, complete the current word
      if (char === ' ' || i === text.length - 1) {
        wordList.push({ letters: currentLetters });
        currentLetters = [];
      }
    }

    const caretColor = theme.css?.['--theme-cursor'] || '#3b82f6';

    return wordList.map((wordObj, wordIdx) => {
      return (
        <span key={`word-${wordIdx}`} className="word flex-shrink-0" style={{ display: 'inline-flex', whiteSpace: 'nowrap', marginRight: '0' }}>
          {wordObj.letters.map((letterObj) => {
            let colorClass = 'letter-untyped';
            if (letterObj.index < input.length) {
              if (letterObj.char === ' ') {
                colorClass = input[letterObj.index] === ' ' ? 'letter-correct' : 'letter-incorrect';
              } else {
                colorClass = input[letterObj.index] === letterObj.char ? 'letter-correct' : 'letter-incorrect';
              }
            }
            const isCurrent = letterObj.index === input.length;

            let customStyle = {};
            if (letterObj.char === ' ' && colorClass === 'letter-incorrect') {
              customStyle = {
                backgroundColor: theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.15)',
                borderBottom: '2px solid #ef4444',
                borderRadius: '2px'
              };
            }

            return (
              <span 
                key={letterObj.index} 
                className={`letter ${colorClass} relative transition-colors duration-75`}
                style={customStyle}
              >
                {letterObj.char === ' ' ? '\u00A0' : letterObj.char}
                {isCurrent && (
                  <span className="caret" style={{ backgroundColor: caretColor }} />
                )}
              </span>
            );
          })}
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

      {/* Typing Area Container */}
      <div className="relative">
        {/* Caps Lock Warning Indicator */}
        {capsLockOn && (
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${theme.mode === 'dark' ? 'bg-amber-900/90 border-amber-500' : 'bg-amber-100 border-amber-400'} border-2 shadow-lg backdrop-blur-sm`}>
              <div className={`p-1 rounded ${theme.mode === 'dark' ? 'bg-amber-500/30' : 'bg-amber-200'}`}>
                <ArrowBigUp className={`w-4 h-4 ${theme.mode === 'dark' ? 'text-amber-300' : 'text-amber-600'}`} />
              </div>
              <span className={`text-sm font-bold ${theme.mode === 'dark' ? 'text-amber-300' : 'text-amber-700'}`}>
                CAPS LOCK ON
              </span>
            </div>
          </div>
        )}

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
          <div 
            className={`text-2xl leading-relaxed font-medium tracking-wide ${theme.fontFamily === 'mono' ? 'font-mono' : 'font-sans'}`} 
            style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              rowGap: '0.4em', 
              columnGap: '0em' 
            }}
          >
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
    </div>
  );
};

export default ArenaTypingRace;
