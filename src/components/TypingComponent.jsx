import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Clock, RotateCcw, Play, Pause, Target, Zap, Eye, EyeOff, Settings, Award, TrendingUp, Trophy, Volume2, VolumeX, ArrowBigUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemedKeyboard from './ThemedKeyboard';
import SingleHandDisplay from './SingleHandDisplay';
import CustomizeModal from './CustomizeModal';
import { calculateWPM, calculateGrossWPM, calculateWordsTyped, calculateAccuracy, formatTime, streakManager } from '../utils/storage';
import { useTheme } from '../contexts/ThemeContext';
import { soundEffects } from '../utils/soundEffects';
import { achievementManager, ACHIEVEMENTS } from '../utils/achievements';
import { AchievementToast } from './AchievementsPanel';

// MONKEYTYPE-INSPIRED: High-performance continuous word rendering
// Performance strategy:
//  - Individual words are memoized and only re-render when their state changes
//  - Uses refs for hot-path values (currentIndex, errors) to avoid unnecessary re-renders
//  - Line-jump DOM queries are throttled to only run on word boundary changes
//  - No CSS transitions on letters - instant color changes like MonkeyType
//  - GPU-accelerated container transform for smooth line jumping
const VISIBLE_WORD_BUFFER = 60;
const LINE_JUMP_THRESHOLD = 2;

// Determine if a word has any errors by checking each character directly
// This is O(wordLength) per word, much faster than Array.from(errors).some() which is O(totalErrors)
const wordHasError = (errors, startIndex, endIndex) => {
  for (let i = startIndex; i <= endIndex; i++) {
    if (errors.has(i)) return true;
  }
  return false;
};

// Individual memoized word component - only re-renders when its specific state changes
const MemoizedWord = React.memo(({ 
  word, 
  actualWordIndex, 
  wordState, // 'active' | 'typed' | 'untyped'
  hasError, 
  currentIndex, 
  errors, 
  cursorPos, 
  isAtSpace,
  caretColor 
}) => {
  const isThisWordBeforeSpace = isAtSpace && word.endIndex === cursorPos;
  
  return (
    <div
      className={`word ${wordState === 'active' ? 'active' : ''} ${hasError ? 'error' : ''}`}
      data-wordindex={actualWordIndex}
    >
      {word.text.split('').map((char, letterIdx) => {
        const charIndex = word.startIndex + letterIdx;
        
        // Inline letter class logic to avoid function call overhead
        let letterClass;
        if (charIndex < currentIndex) {
          letterClass = errors.has(charIndex) ? 'letter-incorrect' : 'letter-correct';
        } else if (charIndex === currentIndex) {
          letterClass = 'letter-current';
        } else {
          letterClass = 'letter-untyped';
        }
        
        const shouldShowCaret = charIndex === cursorPos && !isAtSpace;
        
        return (
          <span
            key={charIndex}
            className={`letter ${letterClass}`}
          >
            {char}
            {shouldShowCaret && (
              <span className="caret" style={{ backgroundColor: caretColor }} />
            )}
          </span>
        );
      })}
      {/* Cursor after last letter when at space between words */}
      {isThisWordBeforeSpace && (
        <span 
          className="caret caret-after-word"
          style={{ backgroundColor: caretColor }}
        />
      )}
    </div>
  );
}, (prev, next) => {
  // Custom comparison: only re-render if this word's visual state actually changed
  return (
    prev.wordState === next.wordState &&
    prev.hasError === next.hasError &&
    prev.cursorPos === next.cursorPos &&
    prev.isAtSpace === next.isAtSpace &&
    prev.currentIndex === next.currentIndex &&
    prev.word.startIndex === next.word.startIndex
  );
});

MemoizedWord.displayName = 'MemoizedWord';

const MonkeyTypeText = React.memo(({ 
  content, 
  currentIndex, 
  errors, 
  theme, 
  fontSize, 
  fontFamily,
  onNeedMoreWords
}) => {
  const containerRef = useRef(null);
  const wordsRef = useRef(null);
  const [translateY, setTranslateY] = useState(0);
  const [visibleStartIndex, setVisibleStartIndex] = useState(0);
  const lastLineTopRef = useRef(0);
  const lineHeightRef = useRef(0);
  const prevContentLenRef = useRef(0);
  // Track previous word index to throttle line-jump checks
  const prevWordIndexRef = useRef(-1);
  
  const typingFontSize = useMemo(() => {
    const fontSizeMap = {
      'small': 'text-lg',
      'medium': 'text-xl',
      'large': 'text-2xl',
      'xl': 'text-3xl',
      '2xl': 'text-4xl'
    };
    return fontSizeMap[fontSize] || fontSizeMap['medium'];
  }, [fontSize]);

  const typingFontFamily = useMemo(() => {
    const fontFamilyMap = {
      'inter': 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'roboto': 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'mono': '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
      'serif': 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
    };
    return fontFamilyMap[fontFamily] || fontFamilyMap['mono'];
  }, [fontFamily]);

  // Split content into words with position tracking
  const allWords = useMemo(() => {
    const result = [];
    let currentWord = '';
    let startIndex = 0;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === ' ' || char === '\n' || char === '\t') {
        if (currentWord) {
          result.push({ 
            text: currentWord, 
            startIndex, 
            endIndex: i - 1,
            isWord: true
          });
        }
        currentWord = '';
        startIndex = i + 1;
      } else {
        currentWord += char;
      }
    }
    if (currentWord) {
      result.push({ 
        text: currentWord, 
        startIndex, 
        endIndex: content.length - 1,
        isWord: true
      });
    }
    return result;
  }, [content]);

  // Find current word index
  const currentWordIndex = useMemo(() => {
    for (let i = 0; i < allWords.length; i++) {
      if (currentIndex >= allWords[i].startIndex && currentIndex <= allWords[i].endIndex + 1) {
        return i;
      }
    }
    if (allWords.length > 0 && currentIndex > allWords[allWords.length - 1].endIndex) {
      return allWords.length - 1;
    }
    return Math.max(0, allWords.length - 1);
  }, [allWords, currentIndex]);

  // Reset when content is reset (restart)
  useEffect(() => {
    if (content.length < prevContentLenRef.current) {
      setVisibleStartIndex(0);
      setTranslateY(0);
      lastLineTopRef.current = 0;
      lineHeightRef.current = 0;
      prevWordIndexRef.current = -1;
    }
    prevContentLenRef.current = content.length;
  }, [content]);

  // Request more words when buffer is low
  useEffect(() => {
    if (!onNeedMoreWords) return;
    const remainingWords = allWords.length - currentWordIndex;
    if (remainingWords < 30) {
      onNeedMoreWords();
    }
  }, [currentWordIndex, allWords.length, onNeedMoreWords]);

  // Compute visible words
  const safeStart = Math.min(visibleStartIndex, currentWordIndex);
  const visibleWords = useMemo(() => {
    const end = Math.min(safeStart + VISIBLE_WORD_BUFFER, allWords.length);
    return allWords.slice(safeStart, end);
  }, [allWords, safeStart]);

  // LINE JUMP: Only check when the current WORD changes (not every keystroke)
  // This dramatically reduces DOM queries from ~300/min to ~60/min for a 60 WPM typist
  useEffect(() => {
    // Skip if word hasn't changed
    if (currentWordIndex === prevWordIndexRef.current) return;
    prevWordIndexRef.current = currentWordIndex;
    
    if (!wordsRef.current || currentWordIndex < 0 || visibleWords.length === 0) return;

    const wordElements = wordsRef.current.querySelectorAll('.word');
    if (wordElements.length === 0) return;

    const currentVisibleIndex = currentWordIndex - safeStart;
    if (currentVisibleIndex < 0 || currentVisibleIndex >= wordElements.length) return;
    
    const currentWordEl = wordElements[currentVisibleIndex];
    if (!currentWordEl) return;

    const currentTop = currentWordEl.offsetTop;
    
    // Initialize line height on first render
    if (lineHeightRef.current === 0 && wordElements[0]) {
      const computedStyle = window.getComputedStyle(wordElements[0]);
      lineHeightRef.current = parseFloat(computedStyle.lineHeight) || wordElements[0].offsetHeight * 1.6;
      lastLineTopRef.current = 0;
      return;
    }

    const lineChangeThreshold = lineHeightRef.current * 0.5;
    
    if (currentTop > lastLineTopRef.current + lineChangeThreshold) {
      lastLineTopRef.current = currentTop;
      
      // Find words on previous lines
      const wordsOnPreviousLines = [];
      for (let i = 0; i < currentVisibleIndex; i++) {
        if (wordElements[i] && wordElements[i].offsetTop < currentTop - lineChangeThreshold) {
          wordsOnPreviousLines.push(i);
        }
      }

      // Count distinct lines above
      const linesAbove = new Set();
      for (const idx of wordsOnPreviousLines) {
        linesAbove.add(Math.round(wordElements[idx].offsetTop / lineHeightRef.current));
      }

      if (linesAbove.size >= LINE_JUMP_THRESHOLD && wordsOnPreviousLines.length > 0) {
        // Find topmost line words
        let minTop = Infinity;
        for (const idx of wordsOnPreviousLines) {
          const top = wordElements[idx].offsetTop;
          if (top < minTop) minTop = top;
        }
        
        const topLineWords = wordsOnPreviousLines.filter(idx => 
          Math.abs(wordElements[idx].offsetTop - minTop) < 5
        );
        
        if (topLineWords.length > 0) {
          const newVisibleStart = safeStart + Math.max(...topLineWords) + 1;
          
          setTranslateY(-lineHeightRef.current);
          requestAnimationFrame(() => {
            setVisibleStartIndex(newVisibleStart);
            setTranslateY(0);
            lastLineTopRef.current = 0;
          });
        }
      }
    }
  }, [currentWordIndex, safeStart, visibleWords.length]);

  // Precompute cursor state once per render (not per word)
  const isAtSpace = currentIndex < content.length && content[currentIndex] === ' ';
  const cursorPos = (isAtSpace && currentIndex > 0) ? currentIndex - 1 : currentIndex;
  const caretColor = theme.css?.['--theme-cursor'] || '#3b82f6';

  const containerStyle = useMemo(() => ({
    fontFamily: typingFontFamily,
    width: '100%',
    overflow: 'hidden',
    position: 'relative'
  }), [typingFontFamily]);

  return (
    <div 
      ref={containerRef}
      className={`monkeytype-container ${typingFontSize}`}
      style={containerStyle}
    >
      <div 
        ref={wordsRef}
        id="words"
        className="words-wrapper"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0',
          alignItems: 'flex-start',
          transform: `translateY(${translateY}px)`,
        }}
      >
        {visibleWords.map((word, index) => {
          const actualWordIndex = safeStart + index;
          
          // Determine word state for memo comparison
          let wordState;
          if (actualWordIndex < currentWordIndex) {
            wordState = 'typed';
          } else if (actualWordIndex === currentWordIndex) {
            wordState = 'active';
          } else {
            wordState = 'untyped';
          }
          
          const hasError = wordState !== 'untyped' && wordHasError(errors, word.startIndex, word.endIndex);
          
          return (
            <MemoizedWord
              key={`${actualWordIndex}-${word.startIndex}`}
              word={word}
              actualWordIndex={actualWordIndex}
              wordState={wordState}
              hasError={hasError}
              currentIndex={currentIndex}
              errors={errors}
              cursorPos={cursorPos}
              isAtSpace={isAtSpace}
              caretColor={caretColor}
            />
          );
        })}
      </div>
    </div>
  );
});

MonkeyTypeText.displayName = 'MonkeyTypeText';

const TypingComponent = ({ 
  content, 
  onComplete, 
  settings = { timeLimit: 60, wordLimit: 50, theme: 'blue' },
  onSettingsChange,
  title = "Typing Practice",
  isLesson = false // New prop to identify lesson mode
}) => {
  const { theme, fontSize, fontFamily, changeFontSize } = useTheme();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [errors, setErrors] = useState(new Set());
  const [allErrors, setAllErrors] = useState(new Set());
  const [startTime, setStartTime] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [wpmHistory, setWpmHistory] = useState([]);
  const [currentKey, setCurrentKey] = useState('');
  const [correctCharacters, setCorrectCharacters] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false); // Caps Lock indicator
  const [soundEnabled, setSoundEnabled] = useState(() => soundEffects.getConfig().enabled);
  const [newAchievement, setNewAchievement] = useState(null); // For achievement toast
  // Safe localStorage operations with error handling
  const safeLocalStorage = useMemo(() => ({
    getItem: (key) => {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn('LocalStorage read failed:', error);
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn('LocalStorage write failed:', error);
      }
    }
  }), []);

  const [practiceSettings, setPracticeSettings] = useState(() => {
    const savedSettings = safeLocalStorage.getItem('typing_app_practice_settings');
    const defaultSettings = {
      practiceMode: isLesson ? 'lesson' : 'time',
      timeLimit: 60,
      wordLimit: 50
    };
    return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
  });
  const [generatedContent, setGeneratedContent] = useState(content);
  const [endTime, setEndTime] = useState(null); // Add missing endTime state
  const [scrollOffset, setScrollOffset] = useState(0); // For smooth scrolling
  
  const inputRef = useRef(null);
  const textRef = useRef(null);
  const completedRef = useRef(false);

  // Caps Lock detection and Keyboard shortcuts (Ctrl+Plus/Minus for zoom)
  useEffect(() => {
    const fontSizes = ['small', 'medium', 'large', 'xl', '2xl'];
    
    const handleKeyDown = (e) => {
      // Detect Caps Lock
      if (e.getModifierState) {
        setCapsLockOn(e.getModifierState('CapsLock'));
      }
      
      // Ctrl + Plus for zoom in (handles +, =, and numpad +)
      if (e.ctrlKey && (e.key === '+' || e.key === '=' || e.code === 'Equal' || e.code === 'NumpadAdd')) {
        e.preventDefault();
        e.stopPropagation();
        const currentIdx = fontSizes.indexOf(fontSize);
        if (currentIdx < fontSizes.length - 1) {
          changeFontSize(fontSizes[currentIdx + 1]);
        }
        return false;
      }
      
      // Ctrl + Minus for zoom out (handles - and numpad -)
      if (e.ctrlKey && (e.key === '-' || e.code === 'Minus' || e.code === 'NumpadSubtract')) {
        e.preventDefault();
        e.stopPropagation();
        const currentIdx = fontSizes.indexOf(fontSize);
        if (currentIdx > 0) {
          changeFontSize(fontSizes[currentIdx - 1]);
        }
        return false;
      }
      
      // Ctrl + 0 to reset zoom
      if (e.ctrlKey && (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0')) {
        e.preventDefault();
        e.stopPropagation();
        changeFontSize('medium');
        return false;
      }
    };
    
    // Use capture phase to intercept before browser handles it
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [fontSize, changeFontSize]);

  // Memoized content generation - creates initial chunk of words
  // For time/word modes, generates enough content to start typing smoothly.
  // Additional content is appended on-demand via handleNeedMoreWords.
  const generateInfiniteContent = useCallback(() => {
    if (practiceSettings.practiceMode === 'time' || practiceSettings.practiceMode === 'word') {
      let infiniteContent = '';
      const baseContent = content.trim();
      // Generate ~10 repetitions initially (~100-200 words depending on content)
      // This ensures enough buffer for fast typists while keeping initial load light
      for (let i = 0; i < 10; i++) {
        infiniteContent += (i > 0 ? ' ' : '') + baseContent;
      }
      return infiniteContent;
    } else {
      return content;
    }
  }, [content, practiceSettings.practiceMode]);

  // Callback for MonkeyTypeText to request more words when buffer runs low
  // This appends content in chunks (3 repetitions at a time) for smooth streaming
  const handleNeedMoreWords = useCallback(() => {
    if (practiceSettings.practiceMode !== 'time' && practiceSettings.practiceMode !== 'word') return;
    const baseContent = content.trim();
    let extension = '';
    for (let i = 0; i < 5; i++) {
      extension += ' ' + baseContent;
    }
    setGeneratedContent(prev => prev + extension);
  }, [content, practiceSettings.practiceMode]);

  // Memoized stats calculation
  const currentStats = useMemo(() => {
    const currentWPM = (!startTime || timeElapsed === 0) ? 0 : calculateWPM(correctCharacters, timeElapsed);
    const grossWPM = timeElapsed > 0 ? calculateGrossWPM(userInput.length, timeElapsed) : 0;
    const accuracy = calculateAccuracy(correctCharacters, userInput.length);
    
    return { currentWPM, grossWPM, accuracy };
  }, [correctCharacters, timeElapsed, userInput.length, startTime]);

  // Optimized customize modal handler with useCallback
  const handleCustomizeApply = useCallback((newSettings) => {
    setPracticeSettings(newSettings);
    safeLocalStorage.setItem('typing_app_practice_settings', JSON.stringify(newSettings));
    handleRestart();
  }, [safeLocalStorage]);

  // Optimized restart handler with useCallback
  const handleRestart = useCallback(() => {
    completedRef.current = false;
    setCurrentIndex(0);
    setUserInput('');
    setErrors(new Set());
    setAllErrors(new Set());
    setStartTime(null);
    setEndTime(null);
    setTimeElapsed(0);
    setIsActive(false);
    setIsPaused(false);
    setIsCompleted(false);
    setWpmHistory([]);
    setCorrectCharacters(0);
    setScrollOffset(0);
    
    const infiniteContent = generateInfiniteContent();
    setGeneratedContent(infiniteContent);
    setCurrentKey(infiniteContent[0]?.toLowerCase() || '');
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [generateInfiniteContent]);

  // Optimized toggle pause with useCallback
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Toggle sound effects
  const toggleSound = useCallback(() => {
    const newState = soundEffects.toggle();
    setSoundEnabled(newState);
  }, []);

  // Initialize content when component mounts or settings change
  useEffect(() => {
    const infiniteContent = generateInfiniteContent();
    setGeneratedContent(infiniteContent);
    setCurrentIndex(0);
    setScrollOffset(0);
    setStartTime(null);
    setEndTime(null);
    setErrors(new Set());
    setIsCompleted(false);
    setCurrentKey(infiniteContent[0]?.toLowerCase() || '');
  }, [content, practiceSettings.practiceMode]);

  // NOTE: Auto-scroll is now handled inside MonkeyTypeText via line-jumping.
  // The MonkeyTypeText component manages its own visible window and requests
  // more content via onNeedMoreWords when the buffer runs low.

  // Timer effect - runs continuously once typing starts
  useEffect(() => {
    let interval = null;
    if (isActive && !isPaused && !isCompleted) {
      interval = setInterval(() => {
        setTimeElapsed(prev => {
          const newTime = prev + 1;
          
          // Check time limit based on practice mode and settings
          const timeLimit = practiceSettings.practiceMode === 'time' ? practiceSettings.timeLimit : 0;
          if (timeLimit && newTime >= timeLimit && !isCompleted) {
            // Use a ref or state to trigger completion in next tick
            setIsCompleted(true);
            setIsActive(false);
          }
          
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, isCompleted, practiceSettings]);

  // Handle completion when isCompleted becomes true
  useEffect(() => {
    if (isCompleted && !isActive && startTime && !completedRef.current) {
      // Call handleComplete logic directly here to avoid circular dependency
      completedRef.current = true;
      
      // Play success sound
      soundEffects.playSuccess();
      
      const actualTimeElapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : timeElapsed;
      let finalTime = Math.max(actualTimeElapsed, timeElapsed, 1);
      
      if (practiceSettings.practiceMode === 'time' && practiceSettings.timeLimit > 0) {
        finalTime = Math.min(finalTime, practiceSettings.timeLimit + 2);
      }
      
      const totalCharacters = userInput.length;
      const wordsTyped = calculateWordsTyped(userInput);
      const grossWPM = calculateGrossWPM(totalCharacters, finalTime);
      const netWPM = calculateWPM(correctCharacters, finalTime);
      const rawAccuracy = calculateAccuracy(correctCharacters, totalCharacters);
      
      // Build final WPM history
      const finalWpmHistory = [...wpmHistory];
      if (finalWpmHistory.length === 0 || finalWpmHistory[finalWpmHistory.length - 1]?.time !== finalTime) {
        finalWpmHistory.push({ time: finalTime, wpm: netWPM });
      }

      const result = {
        wpm: netWPM,
        grossWPM: grossWPM,
        accuracy: rawAccuracy,
        timeSpent: finalTime,
        totalCharacters: totalCharacters,
        correctCharacters: correctCharacters,
        errors: allErrors.size,
        wordsTyped: wordsTyped,
        content: title,
        wpmHistory: finalWpmHistory,
        completedAt: new Date().toISOString()
      };

      // Record practice streak
      try {
        const userId = localStorage.getItem('typing_app_current_user') || 'default';
        streakManager.recordPractice(userId);
      } catch (e) {
        console.warn('Streak recording failed:', e);
      }

      // Check for new achievements
      const userId = localStorage.getItem('typing_app_current_user') || 'default';
      let newAchievements = [];
      try {
        newAchievements = achievementManager.checkAchievements(userId, {
          bestWPM: netWPM,
          bestAccuracy: rawAccuracy,
          totalTests: 1,
          totalTime: finalTime,
          lessonsCompleted: isLesson ? 1 : 0,
          currentStreak: 1
        });
        
        if (newAchievements.length > 0) {
          soundEffects.playAchievement();
        }
      } catch (e) {
        console.warn('Achievement check failed:', e);
      }

      // Navigate to results page
      navigate('/results', { state: { results: result, newAchievements } });

      // Call onComplete callback
      if (onComplete) {
        onComplete(result);
      }
    }
  }, [isCompleted, isActive, startTime, timeElapsed, practiceSettings, userInput, correctCharacters, allErrors, title, wpmHistory, navigate, onComplete, isLesson]);

  // Update WPM history every second when typing is active
  useEffect(() => {
    if (isActive && !isPaused && !isCompleted && timeElapsed > 0) {
      // Update WPM history every 2 seconds for smoother chart
      if (timeElapsed % 2 === 0) {
        setWpmHistory(prevHistory => {
          const currentWPM = calculateWPM(correctCharacters, timeElapsed);
          const newEntry = { time: timeElapsed, wpm: currentWPM };
          
          // Avoid duplicate entries
          if (prevHistory.length === 0 || prevHistory[prevHistory.length - 1].time !== timeElapsed) {
            return [...prevHistory, newEntry];
          }
          return prevHistory;
        });
      }
    }
  }, [timeElapsed, correctCharacters, isActive, isPaused, isCompleted]);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // NOTE: Auto-focus on key press is handled in the unified keyboard handler below

  // Global keydown for auto-focus and Ctrl+R restart
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Handle Ctrl+R to restart lesson instead of reloading page
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        handleRestart();
        return;
      }
      
      // Only focus if not in input already and not special keys
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (['Escape', 'Tab', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(e.key)) return;
      
      // Focus input for regular keys
      if (inputRef.current && !isPaused && !isCompleted) {
        inputRef.current.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, isCompleted, handleRestart]);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    const newLength = value.length;
    
    // Detect paste attempt: if length jumped by more than 1 character at once, reject it
    const lengthDiff = Math.abs(newLength - userInput.length);
    if (lengthDiff > 1) {
      // Paste or multi-character input detected - reject
      if (settings.soundEnabled) playSound('error');
      return;
    }
    
    if (!isActive && !startTime) {
      setStartTime(Date.now());
      setIsActive(true);
    }

    // Content extension is now handled by MonkeyTypeText's onNeedMoreWords callback.
    // No need for character-based content extension or trimming here.

    // Prevent going beyond generated content length
    // For time/word modes, MonkeyTypeText will request more content via onNeedMoreWords
    // before user reaches the end, so this should rarely be hit
    if (newLength > generatedContent.length) return;

    setUserInput(value);
    setCurrentIndex(newLength);

    // Update current key for keyboard highlighting
    if (newLength < generatedContent.length) {
      setCurrentKey(generatedContent[newLength].toLowerCase());
    } else {
      setCurrentKey('');
    }

    // Optimized error checking: only check the last character change
    // instead of re-scanning all characters on every keystroke.
    // This keeps input handling O(1) even for very long typing sessions.
    if (newLength > userInput.length) {
      // Character was added (typing forward)
      const i = newLength - 1;
      const isCorrect = value[i] === generatedContent[i];
      
      const newErrors = new Set(errors);
      const newAllErrors = new Set(allErrors);
      let hasNewError = false;
      
      if (isCorrect) {
        newErrors.delete(i);
      } else {
        hasNewError = !errors.has(i);
        newErrors.add(i);
        newAllErrors.add(i);
      }
      
      // Play sound effects
      if (hasNewError || !isCorrect) {
        soundEffects.playError();
      } else {
        soundEffects.playKeypress();
      }
      
      setErrors(newErrors);
      setAllErrors(newAllErrors);
      setCorrectCharacters(isCorrect ? correctCharacters + 1 : correctCharacters);
    } else if (newLength < userInput.length) {
      // Character was deleted (backspace)
      const deletedIndex = newLength;
      const newErrors = new Set(errors);
      newErrors.delete(deletedIndex);
      
      const wasDeletedCharCorrect = userInput[deletedIndex] === generatedContent[deletedIndex];
      setErrors(newErrors);
      if (wasDeletedCharCorrect) {
        setCorrectCharacters(prev => Math.max(0, prev - 1));
      }
    }

  // Check for completion based on practice mode
    const wordsTyped = calculateWordsTyped(value);
    let shouldComplete = false;
    
    if (practiceSettings.practiceMode === 'lesson') {
      // Lesson mode: complete when all lesson content is typed
      shouldComplete = newLength >= content.length;
    } else if (practiceSettings.practiceMode === 'word' && practiceSettings.wordLimit > 0) {
      // Word mode: complete when word limit is reached
      shouldComplete = wordsTyped >= practiceSettings.wordLimit;
    } else if (practiceSettings.practiceMode === 'time') {
      // Time mode: completion handled by timer effect
      shouldComplete = false;
    }
    
    if (shouldComplete && !isCompleted) {
      // Set completion state instead of calling handleComplete directly
      setIsCompleted(true);
      setIsActive(false);
    }
  };

  const handleComplete = useCallback(() => {
    if (completedRef.current) {
      return;
    }
    
    completedRef.current = true;
    setIsActive(false);
    setIsCompleted(true);
    
    // Play success sound
    soundEffects.playSuccess();
    
    const actualTimeElapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : timeElapsed;
    
    let finalTime = Math.max(actualTimeElapsed, timeElapsed, 1);
    
    if (practiceSettings.practiceMode === 'time' && practiceSettings.timeLimit > 0) {
      finalTime = Math.min(finalTime, practiceSettings.timeLimit + 2);
    }
    
    const totalCharacters = userInput.length;
    const wordsTyped = calculateWordsTyped(userInput);
    
    // Remove debug logging for production
    if (process.env.NODE_ENV === 'development') {
      console.log('Completion Debug:', {
        mode: practiceSettings.practiceMode,
        timeLimit: practiceSettings.timeLimit,
        actualTimeElapsed,
        timeElapsed,
        finalTime,
        totalCharacters,
        correctCharacters,
        wordsTyped,
        userInput: userInput.substring(0, 50) + '...'
      });
    }
    
    const grossWPM = calculateGrossWPM(totalCharacters, finalTime);
    const netWPM = calculateWPM(correctCharacters, finalTime);
    const rawAccuracy = calculateAccuracy(correctCharacters, totalCharacters);
    
    // Build final WPM history with the completion entry
    const finalWpmHistory = [...wpmHistory];
    if (finalWpmHistory.length === 0 || finalWpmHistory[finalWpmHistory.length - 1].time !== finalTime) {
      finalWpmHistory.push({ time: finalTime, wpm: netWPM });
    }
    
    // Update state (for display purposes)
    setWpmHistory(finalWpmHistory);

    const result = {
      wpm: netWPM,
      grossWPM: grossWPM,
      accuracy: rawAccuracy,
      timeSpent: finalTime,
      totalCharacters: totalCharacters,
      correctCharacters: correctCharacters,
      errors: allErrors.size,
      wordsTyped: wordsTyped,
      content: title,
      wpmHistory: finalWpmHistory,
      completedAt: new Date().toISOString()
    };

    // Check for new achievements
    const userId = localStorage.getItem('typing_app_current_user') || 'default';
    const newAchievements = achievementManager.checkAchievements(userId, {
      bestWPM: netWPM,
      bestAccuracy: rawAccuracy,
      totalTests: 1,
      totalTime: finalTime,
      lessonsCompleted: isLesson ? 1 : 0,
      currentStreak: 1
    });
    
    // Show achievement toast if any new achievements
    if (newAchievements.length > 0) {
      soundEffects.playAchievement();
      setNewAchievement(newAchievements[0]); // Show first new achievement
    }

    // Navigate to results page
    navigate('/results', { state: { results: result, newAchievements } });

    // Call onComplete callback
    if (onComplete) {
      onComplete(result);
    }
  }, [startTime, timeElapsed, practiceSettings, userInput, correctCharacters, allErrors, title, wpmHistory, navigate, onComplete, isLesson]);



  // Calculate live stats with accurate real-time formulas
  const calculateCurrentWPM = () => {
    if (!startTime || timeElapsed === 0) return 0;
    return calculateWPM(correctCharacters, timeElapsed);
  };

  const currentNetWPM = calculateCurrentWPM();
  const currentGrossWPM = timeElapsed > 0 ? calculateGrossWPM(userInput.length, timeElapsed) : 0;
  const currentAccuracy = calculateAccuracy(correctCharacters, userInput.length);
  
  // Calculate progress based on typing completion
  let progress = 0;
  if (practiceSettings.practiceMode === 'lesson') {
    // For lesson mode, show progress through original content
    progress = content.length > 0 ? Math.min((currentIndex / content.length) * 100, 100) : 0;
  } else if (practiceSettings.practiceMode === 'word' && practiceSettings.wordLimit > 0) {
    const wordsTyped = calculateWordsTyped(userInput);
    progress = Math.min((wordsTyped / practiceSettings.wordLimit) * 100, 100);
  } else if (practiceSettings.practiceMode === 'time' && practiceSettings.timeLimit > 0) {
    progress = Math.min((timeElapsed / practiceSettings.timeLimit) * 100, 100);
  } else {
    // For other modes, show progress through visible content
    progress = generatedContent.length > 0 ? Math.min((currentIndex / generatedContent.length) * 100, 100) : 0;
  }

  // Font size mapping for typing area
  const getTypingFontSize = () => {
    const fontSizeMap = {
      'small': 'text-xl',     // 20px for typing area
      'medium': 'text-2xl',   // 24px for typing area  
      'large': 'text-3xl',    // 30px for typing area
      'xl': 'text-4xl',       // 36px for typing area
      '2xl': 'text-5xl'       // 48px for typing area
    };
    return fontSizeMap[fontSize] || fontSizeMap['medium'];
  };

  // Font family mapping for typing area with offline fallbacks
  const getTypingFontFamily = () => {
    const fontFamilyMap = {
      'inter': 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'roboto': 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'mono': '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
      'serif': 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
    };
    return fontFamilyMap[fontFamily] || fontFamilyMap['mono'];
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 ${theme.cardBg} rounded-lg shadow-lg`}>
      {/* Simplified Header with Essential Stats */}
      <div className={`transition-all duration-300 ${focusMode ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`}>
        <div className={`flex flex-wrap items-center justify-between mb-4 p-4 ${theme.background} rounded-lg border ${theme.border}`}>
          {/* Left: Title */}
          <h2 className={`text-xl font-bold ${theme.text}`}>{title}</h2>
          
          {/* Center: Live Stats with Animations - FIXED ICON COLORS */}
          <div className="flex items-center gap-6">
            {/* WPM Indicator - Theme-aware icon colors */}
            <div className="flex items-center gap-2 group">
              <div className={`p-2 ${theme.mode === 'dark' ? 'bg-blue-900/40' : 'bg-blue-100'} rounded-full group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
                <Zap className={`w-4 h-4 ${theme.mode === 'dark' ? 'text-blue-300' : 'text-blue-600'} drop-shadow-sm`} />
              </div>
              <div className="flex flex-col items-center">
                <span className={`font-bold text-xl ${theme.text} tabular-nums transition-all duration-300 ${currentNetWPM > 0 ? 'animate-bounce-subtle' : ''}`}>
                  {currentNetWPM}
                </span>
                <span className={`text-xs ${theme.textSecondary} font-medium`}>WPM</span>
              </div>
            </div>
            
            {/* Accuracy Indicator - Theme-aware icon colors */}
            <div className="flex items-center gap-2 group">
              <div className={`p-2 ${theme.mode === 'dark' ? 'bg-green-900/40' : 'bg-green-100'} rounded-full group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
                <Target className={`w-4 h-4 ${theme.mode === 'dark' ? 'text-green-300' : 'text-green-600'} drop-shadow-sm`} />
              </div>
              <div className="flex flex-col items-center">
                <span className={`font-bold text-xl ${theme.text} tabular-nums transition-all duration-300`}>
                  {currentAccuracy}%
                </span>
                <span className={`text-xs ${theme.textSecondary} font-medium`}>ACC</span>
              </div>
            </div>
            
            {/* Time Indicator - Theme-aware icon colors */}
            <div className="flex items-center gap-2 group">
              <div className={`p-2 ${theme.mode === 'dark' ? 'bg-orange-900/40' : 'bg-orange-100'} rounded-full group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
                <Clock className={`w-4 h-4 ${theme.mode === 'dark' ? 'text-orange-300' : 'text-orange-600'} drop-shadow-sm`} />
              </div>
              <div className="flex flex-col items-center">
                <span className={`font-bold text-xl ${theme.text} tabular-nums`}>
                  {formatTime(timeElapsed)}
                </span>
                <span className={`text-xs ${theme.textSecondary} font-medium`}>TIME</span>
              </div>
            </div>
            
            {/* Achievement Indicator - Theme-aware colors */}
            <div className="min-w-[85px] flex justify-start">
              {currentAccuracy === 100 ? (
                <div className="flex items-center gap-1 animate-fade-in">
                  <Target className={`w-4 h-4 ${theme.mode === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} animate-bounce`} />
                  <span className={`text-xs ${theme.mode === 'dark' ? 'text-emerald-400' : 'text-emerald-600'} font-semibold`}>Perfect!</span>
                </div>
              ) : currentNetWPM >= 80 && currentAccuracy >= 95 ? (
                <div className="flex items-center gap-1 animate-fade-in">
                  <Award className={`w-4 h-4 ${theme.mode === 'dark' ? 'text-amber-400' : 'text-amber-600'} animate-bounce`} />
                  <span className={`text-xs ${theme.mode === 'dark' ? 'text-amber-400' : 'text-amber-600'} font-semibold`}>Excellent!</span>
                </div>
              ) : currentNetWPM >= 50 ? (
                <div className="flex items-center gap-1 animate-fade-in">
                  <Award className={`w-4 h-4 ${theme.mode === 'dark' ? 'text-blue-400' : 'text-blue-600'} animate-bounce`} />
                  <span className={`text-xs ${theme.mode === 'dark' ? 'text-blue-400' : 'text-blue-600'} font-semibold`}>Great!</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Right: Enhanced Control Buttons */}
          <div className="flex gap-2">
            <button
              onClick={toggleSound}
              className={`flex items-center gap-2 ${soundEnabled ? theme.primary : 'bg-gray-500'} text-white px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg transform active:scale-95`}
              title={soundEnabled ? 'Sounds On' : 'Sounds Off'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4 text-white" />}
            </button>
            
            <button
              onClick={() => setShowCustomizeModal(true)}
              className={`flex items-center gap-2 ${theme.primary} text-white px-4 py-2 rounded-lg text-sm ${theme.primaryHover} transition-all duration-200 hover:scale-105 hover:shadow-lg transform active:scale-95`}
            >
              <Settings className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">Customize</span>
            </button>
            
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`flex items-center gap-2 ${theme.accent} text-white px-4 py-2 rounded-lg text-sm ${theme.accentHover} transition-all duration-200 hover:scale-105 hover:shadow-lg transform active:scale-95`}
            >
              {focusMode ? <EyeOff className="w-4 h-4 text-white" /> : <Eye className="w-4 h-4 text-white" />}
              <span className="hidden sm:inline">{focusMode ? 'Exit Focus' : 'Focus'}</span>
            </button>
            
            <button
              onClick={togglePause}
              className={`flex items-center gap-2 ${isActive ? theme.secondary : 'bg-gray-400'} text-white px-4 py-2 rounded-lg text-sm ${theme.secondaryHover} transition-all duration-200 hover:scale-105 hover:shadow-lg transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
              disabled={!isActive}
            >
              {isPaused ? <Play className="w-4 h-4 text-white" /> : <Pause className="w-4 h-4 text-white" />}
              <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
            
            <button
              onClick={handleRestart}
              className={`flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg transform active:scale-95`}
            >
              <RotateCcw className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">Restart</span>
            </button>
          </div>
        </div>

        {/* Enhanced Progress Bar with Animations */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm ${theme.textSecondary} font-medium`}>Progress</span>
            <span className={`text-sm ${theme.text} font-semibold`}>{Math.round(progress)}%</span>
          </div>
          <div className={`w-full ${theme.progressBg} rounded-full h-3 shadow-inner overflow-hidden`}>
            <div 
              className={`${theme.progressFill} h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden`}
              style={{ width: `${progress}%` }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-shine"></div>
              {/* Pulsing effect for high accuracy */}
              {currentAccuracy >= 95 && (
                <div className="absolute inset-0 bg-linear-to-r from-green-400/30 to-emerald-400/30 animate-pulse"></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Typing Area with MonkeyType-style Line Display */}
      <div className="mb-6 relative">
        {/* Caps Lock Warning Indicator */}
        {capsLockOn && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
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
        
        <div 
          ref={textRef}
          className={`${theme.cardBg} ${theme.mode === 'dark' ? 'dark-mode' : 'light-mode'} p-8 rounded-xl border-2 ${theme.border} cursor-text relative transition-all duration-300 hover:shadow-lg focus-within:shadow-xl select-none`}
          onClick={() => inputRef.current?.focus()}
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          data-theme={theme.name || 'blue'}
          style={{ 
            minHeight: '200px',
            maxHeight: '200px',
            overflow: 'hidden',
            fontFamily: getTypingFontFamily(),
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            '--letter-correct-color': theme.css?.['--theme-accent'] || '#3b82f6',
            '--letter-current-bg': theme.mode === 'dark' ? 'rgba(96, 165, 250, 0.2)' : 'rgba(59, 130, 246, 0.15)'
          }}
        >
          {/* Focus Indicator - Theme-aware */}
          {isActive && (
            <div className="absolute top-2 right-2 z-10">
              <div className={`w-3 h-3 ${theme.mode === 'dark' ? 'bg-green-400' : 'bg-green-500'} rounded-full animate-pulse`}></div>
            </div>
          )}
          
          {/* MONKEYTYPE-INSPIRED: Continuous Word-based Text Display */}
          <MonkeyTypeText
            content={generatedContent}
            currentIndex={currentIndex}
            errors={errors}
            theme={theme}
            fontSize={fontSize}
            fontFamily={fontFamily}
            onNeedMoreWords={handleNeedMoreWords}
          />
          
          {/* Completion Celebration - Theme-aware */}
          {isCompleted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl animate-fade-in">
              <div className={`${theme.mode === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-2xl animate-bounce-in text-center`}>
                <Award className={`w-12 h-12 ${theme.mode === 'dark' ? 'text-yellow-400' : 'text-yellow-600'} mx-auto mb-2 animate-spin-slow`} />
                <h3 className={`text-2xl font-bold ${theme.text} mb-1`}>Complete!</h3>
                <p className={`${theme.textSecondary}`}>Great job! 🎉</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Hidden Input */}
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={handleInputChange}
          onPaste={(e) => e.preventDefault()}
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
          className="opacity-0 absolute -z-10"
          disabled={isPaused || isCompleted}
          // Disable all auto-suggestions and auto-fill features
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          data-gramm="false"
          data-gramm_editor="false"
          data-enable-grammarly="false"
          inputMode="none"
          enterKeyHint="none"
          // Additional attributes to prevent auto-suggestions
          role="textbox"
          aria-autocomplete="none"
          aria-describedby=""
          // Prevent browser password/form suggestions
          name="typing-input-hidden"
          form=""
          // Prevent mobile keyboard suggestions
          autoFocus={false}
        />
      </div>

      {/* Virtual Keyboard with Hands - Hide in focus mode */}
      <div className={`relative transition-all duration-300 ${focusMode ? 'opacity-20 scale-95' : 'opacity-100 scale-100'}`}>
        {settings.showVirtualHand ? (
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: '800px', 
            margin: '0 auto',
            paddingTop: '30px'
          }}>
            <ThemedKeyboard activeKey={currentKey} />
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              pointerEvents: 'none',
              overflow: 'hidden'
            }}>
              <SingleHandDisplay activeKey={currentKey} settings={settings} />
            </div>
          </div>
        ) : (
          /* Only show keyboard without hands when showVirtualHand is false */
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: '800px', 
            margin: '0 auto',
            paddingTop: '20px'
          }}>
            <ThemedKeyboard activeKey={currentKey} />
          </div>
        )}
      </div>

      {/* Customize Modal */}
      <CustomizeModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        onApply={(newSettings) => {
          setPracticeSettings(newSettings);
          // Reset the test when new settings are applied
          handleRestart();
        }}
        currentSettings={practiceSettings}
        isLesson={isLesson}
      />
      
      {/* Achievement Toast */}
      {newAchievement && (
        <AchievementToast 
          achievement={newAchievement} 
          onClose={() => setNewAchievement(null)} 
        />
      )}
    </div>
  );
};

export default TypingComponent;
