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

// MONKEYTYPE-STYLE: Line-by-line rendering with smooth vertical scroll
// Shows 3 lines at a time, scrolls as user types
const MonkeyTypeText = React.memo(({ 
  content, 
  currentIndex, 
  errors, 
  theme, 
  fontSize, 
  fontFamily,
  containerWidth
}) => {
  const containerRef = useRef(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  
  const getTypingFontSize = () => {
    const fontSizeMap = {
      'small': 'text-lg',
      'medium': 'text-xl',
      'large': 'text-2xl',
      'xl': 'text-3xl'
    };
    return fontSizeMap[fontSize] || fontSizeMap['medium'];
  };

  const getTypingFontFamily = () => {
    const fontFamilyMap = {
      'inter': 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'roboto': 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      'mono': '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
      'serif': 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
    };
    return fontFamilyMap[fontFamily] || fontFamilyMap['mono'];
  };

  // Split content into words for word-based line wrapping
  const words = useMemo(() => {
    const result = [];
    let currentWord = '';
    let startIndex = 0;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === ' ' || char === '\n') {
        if (currentWord) {
          result.push({ text: currentWord, startIndex, endIndex: i - 1 });
        }
        result.push({ text: char, startIndex: i, endIndex: i, isSpace: true });
        currentWord = '';
        startIndex = i + 1;
      } else {
        currentWord += char;
      }
    }
    if (currentWord) {
      result.push({ text: currentWord, startIndex, endIndex: content.length - 1 });
    }
    return result;
  }, [content]);

  // Create lines that fit within container width - calculate char width based on font size
  const lines = useMemo(() => {
    // Reduced character widths for tighter packing - fills more of the line
    const charWidthMap = {
      'small': 8,    // text-lg ~18px font = ~8px char width (tighter)
      'medium': 10,  // text-xl ~20px font = ~10px char width (tighter)
      'large': 12,   // text-2xl ~24px font = ~12px char width (tighter)
      'xl': 14       // text-3xl ~30px font = ~14px char width (tighter)
    };
    const charWidth = charWidthMap[fontSize] || 10;
    const charsPerLine = Math.floor((containerWidth || 900) / charWidth);
    const result = [];
    let currentLine = [];
    let currentLineLength = 0;
    let lineStartIndex = 0;
    
    words.forEach((word) => {
      const wordLength = word.text.length;
      
      if (currentLineLength + wordLength > charsPerLine && currentLine.length > 0) {
        // Start new line
        result.push({
          words: currentLine,
          startIndex: lineStartIndex,
          endIndex: currentLine[currentLine.length - 1]?.endIndex || lineStartIndex
        });
        currentLine = [word];
        currentLineLength = wordLength;
        lineStartIndex = word.startIndex;
      } else {
        currentLine.push(word);
        currentLineLength += wordLength;
      }
    });
    
    if (currentLine.length > 0) {
      result.push({
        words: currentLine,
        startIndex: lineStartIndex,
        endIndex: currentLine[currentLine.length - 1]?.endIndex || lineStartIndex
      });
    }
    
    return result;
  }, [words, containerWidth]);

  // Find current line based on currentIndex
  const currentLineIdx = useMemo(() => {
    for (let i = 0; i < lines.length; i++) {
      if (currentIndex <= lines[i].endIndex) {
        return i;
      }
    }
    return lines.length - 1;
  }, [lines, currentIndex]);

  // Update visible lines - show current line and next 2 lines
  useEffect(() => {
    setCurrentLineIndex(Math.max(0, currentLineIdx));
  }, [currentLineIdx]);

  // Get visible lines (current + next 2)
  const visibleLines = useMemo(() => {
    const start = currentLineIndex;
    const end = Math.min(start + 3, lines.length);
    return lines.slice(start, end);
  }, [lines, currentLineIndex]);

  // Get the correct color class for typed characters - USE THEME ACCENT COLOR
  const getCorrectColorClass = () => {
    // Use theme accent for correct characters (blue for blue theme, orange for orange, etc.)
    return theme.accent;
  };

  // Render a single character
  const renderChar = (char, charIndex) => {
    let colorClass = '';
    let isCurrentChar = charIndex === currentIndex;
    
    if (charIndex < currentIndex) {
      // Typed character
      if (errors.has(charIndex)) {
        // ERROR: Only red text, no background
        colorClass = 'text-red-500';
      } else {
        // CORRECT: Use theme accent color for both light and dark modes
        colorClass = getCorrectColorClass();
      }
    } else if (isCurrentChar) {
      // Current character - highlighted
      colorClass = `${theme.textSecondary} bg-current-char`;
    } else {
      // Untyped character
      colorClass = theme.mode === 'dark' ? 'text-gray-500' : 'text-gray-400';
    }

    return (
      <span
        key={charIndex}
        className={`${colorClass} ${isCurrentChar ? 'relative' : ''}`}
        style={{ 
          transition: 'color 0.1s ease',
        }}
      >
        {char === ' ' ? '\u00A0' : char}
        {isCurrentChar && (
          <span 
            className="absolute left-0 top-0 bottom-0 w-0.5 animate-pulse"
            style={{ 
              backgroundColor: theme.css?.['--theme-cursor'] || '#3b82f6',
              animation: 'pulse 1s ease-in-out infinite'
            }}
          />
        )}
      </span>
    );
  };

  // Render a word
  const renderWord = (word) => {
    const chars = [];
    for (let i = word.startIndex; i <= word.endIndex; i++) {
      chars.push(renderChar(content[i], i));
    }
    return chars;
  };

  const fontStyle = { fontFamily: getTypingFontFamily() };

  return (
    <div 
      ref={containerRef}
      className={`${getTypingFontSize()} leading-loose overflow-hidden w-full`}
      style={{ 
        ...fontStyle,
        minHeight: '160px',
        width: '100%',
      }}
    >
      {visibleLines.map((line, lineIdx) => {
        const isCurrentLine = lineIdx === 0;
        const isPastLine = false; // First visible line is always current or upcoming
        
        return (
          <div 
            key={`line-${currentLineIndex + lineIdx}`}
            className={`transition-opacity duration-200 ${
              isCurrentLine ? 'opacity-100' : 'opacity-60'
            }`}
            style={{
              marginBottom: '0.5em',
            }}
          >
            {line.words.map((word, wordIdx) => (
              <span key={`word-${word.startIndex}`}>
                {renderWord(word)}
              </span>
            ))}
          </div>
        );
      })}
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
  const [containerWidth, setContainerWidth] = useState(900); // Track container width for line wrapping
  
  const inputRef = useRef(null);
  const textRef = useRef(null);
  const completedRef = useRef(false);

  // Track container width for MonkeyType-style line wrapping
  useEffect(() => {
    const updateWidth = () => {
      if (textRef.current) {
        // Use actual container width minus padding (32px on each side = 64px total)
        const actualWidth = textRef.current.clientWidth - 64;
        setContainerWidth(Math.max(actualWidth, 400)); // Minimum 400px
      }
    };
    
    // Initial update after a small delay to ensure render is complete
    const timer = setTimeout(updateWidth, 100);
    updateWidth();
    
    window.addEventListener('resize', updateWidth);
    return () => {
      window.removeEventListener('resize', updateWidth);
      clearTimeout(timer);
    };
  }, []);

  // Caps Lock detection and Keyboard shortcuts (Ctrl+Plus/Minus for zoom)
  useEffect(() => {
    const fontSizes = ['small', 'medium', 'large', 'xl'];
    
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

  // Memoized content generation to avoid recalculation
  const generateInfiniteContent = useCallback(() => {
    if (practiceSettings.practiceMode === 'time' || practiceSettings.practiceMode === 'word') {
      let infiniteContent = '';
      const baseContent = content.trim();
      
      for (let i = 0; i < 5; i++) {
        infiniteContent += (i > 0 ? ' ' : '') + baseContent;
      }
      
      return infiniteContent;
    } else {
      return content;
    }
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

  // Handle auto-scroll when user completes lines (only scroll after full line completion)
  useEffect(() => {
    if ((practiceSettings.practiceMode === 'time' || practiceSettings.practiceMode === 'word') && 
        textRef.current) {
      
      // More conservative calculation - wait longer before scrolling
      const approxCharsPerLine = 60; // Increased from 50 to wait longer per line
      const approxLineHeight = 30; // Reduced from 40 to scroll less per line
      
      // Calculate current line number (0-based)
      const currentLine = Math.floor(currentIndex / approxCharsPerLine);
      
      // Only scroll when user has completed at least 3 full lines (instead of 2)
      // This prevents early scrolling and keeps text stable longer
      if (currentLine >= 3) {
        // Keep the typing position visible but don't scroll too aggressively
        // Show 2 lines above and keep current line visible
        const scrollLines = Math.max(0, currentLine - 2); // More conservative scrolling
        const newScrollOffset = scrollLines * approxLineHeight;
        
        // Only update if scroll offset changed by at least one full line (prevents micro-scrolls)
        setScrollOffset(prevOffset => {
          const diff = Math.abs(newScrollOffset - prevOffset);
          if (diff >= approxLineHeight) { // Only scroll by full line heights
            return newScrollOffset;
          }
          return prevOffset;
        });
      } else {
        // Keep scroll at 0 for first 3 lines (instead of 2)
        setScrollOffset(0);
      }
    }
  }, [currentIndex, practiceSettings.practiceMode]);

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

  // Auto-focus input on any key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't auto-focus if user is typing in another input field or if test is completed/paused
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || isCompleted || isPaused) {
        return;
      }
      
      // Don't auto-focus on special keys
      if (e.ctrlKey || e.altKey || e.metaKey || e.key === 'Tab' || e.key === 'Escape') {
        return;
      }
      
      // Focus the input field
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCompleted, isPaused]);

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
    
    if (!isActive && !startTime) {
      setStartTime(Date.now());
      setIsActive(true);
    }

    // For time/word modes, extend content if user is approaching the end
    if ((practiceSettings.practiceMode === 'time' || practiceSettings.practiceMode === 'word') && 
        newLength > generatedContent.length - 150) { // Extend when 150 chars left
      const baseContent = content.trim();
      // Add just 3 more repetitions to keep it lightweight
      let extension = '';
      for (let i = 0; i < 3; i++) {
        extension += ' ' + baseContent;
      }
      setGeneratedContent(prev => prev + extension);
    }

    // Trim old content if it gets too long (keep last 2000 characters)
    if ((practiceSettings.practiceMode === 'time' || practiceSettings.practiceMode === 'word') && 
        generatedContent.length > 3000 && newLength > 800) {
      const trimAmount = generatedContent.length - 2000;
      const newContent = generatedContent.substring(trimAmount);
      const newIndex = Math.max(0, newLength - trimAmount);
      
      setGeneratedContent(newContent);
      setCurrentIndex(newIndex);
      setUserInput(value.substring(trimAmount));
      
      // Adjust scroll offset when trimming
      setScrollOffset(prev => Math.max(0, prev - (trimAmount * 0.8))); // Rough adjustment
      
      // Adjust errors sets
      const newErrors = new Set();
      const newAllErrors = new Set();
      errors.forEach(errorIndex => {
        const adjustedIndex = errorIndex - trimAmount;
        if (adjustedIndex >= 0) newErrors.add(adjustedIndex);
      });
      allErrors.forEach(errorIndex => {
        const adjustedIndex = errorIndex - trimAmount;
        if (adjustedIndex >= 0) newAllErrors.add(adjustedIndex);
      });
      setErrors(newErrors);
      setAllErrors(newAllErrors);
      
      return; // Early return to avoid duplicate processing
    }

    // Prevent going beyond current content length (except in time/word modes where content repeats)
    if (practiceSettings.practiceMode === 'lesson' && newLength > generatedContent.length) return;

    setUserInput(value);
    setCurrentIndex(newLength);

    // Update current key for keyboard highlighting
    if (newLength < generatedContent.length) {
      setCurrentKey(generatedContent[newLength].toLowerCase());
    } else {
      setCurrentKey('');
    }

    // Check for errors and correct characters
    const newErrors = new Set();
    const newAllErrors = new Set(allErrors);
    let correctCount = 0;
    let hasNewError = false;
    
    for (let i = 0; i < newLength; i++) {
      if (value[i] === generatedContent[i]) {
        correctCount++;
      } else {
        if (!errors.has(i)) hasNewError = true;
        newErrors.add(i);
        newAllErrors.add(i);
      }
    }
    
    // Play sound effects
    if (newLength > userInput.length) {
      // Only play sound on typing forward (not backspace)
      if (hasNewError || (newLength > 0 && value[newLength - 1] !== generatedContent[newLength - 1])) {
        soundEffects.playError();
      } else {
        soundEffects.playKeypress();
      }
    }
    
    setErrors(newErrors);
    setAllErrors(newAllErrors);
    setCorrectCharacters(correctCount);

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
      'xl': 'text-4xl'        // 36px for typing area
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
          className={`${theme.cardBg} p-8 rounded-xl border-2 ${theme.border} cursor-text relative transition-all duration-300 hover:shadow-lg focus-within:shadow-xl`}
          onClick={() => inputRef.current?.focus()}
          style={{ 
            minHeight: '180px',
            lineHeight: '2',
            wordSpacing: '0.15em',
            letterSpacing: '0.01em',
            fontFamily: getTypingFontFamily()
          }}
        >
          {/* Focus Indicator - Theme-aware */}
          {isActive && (
            <div className="absolute top-2 right-2 z-10">
              <div className={`w-3 h-3 ${theme.mode === 'dark' ? 'bg-green-400' : 'bg-green-500'} rounded-full animate-pulse`}></div>
            </div>
          )}
          
          {/* MONKEYTYPE-STYLE: Line-by-line Text Display */}
          <MonkeyTypeText
            content={generatedContent}
            currentIndex={currentIndex}
            errors={errors}
            theme={theme}
            fontSize={fontSize}
            fontFamily={fontFamily}
            containerWidth={containerWidth}
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
