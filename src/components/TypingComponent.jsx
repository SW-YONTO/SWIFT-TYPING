import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Clock, RotateCcw, Play, Pause, Target, Zap, Eye, EyeOff, Settings, Award, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Keyboard from './Keyboard';
import CustomizeModal from './CustomizeModal';
import { calculateWPM, calculateGrossWPM, calculateWordsTyped, calculateAccuracy, formatTime } from '../utils/storage';
import { useTheme } from '../contexts/ThemeContext';

// Memoized Character Component for better performance with offline fonts
const CharacterComponent = React.memo(({ char, index, currentIndex, errors, theme, fontSize, fontFamily, showCursor }) => {
  const getTypingFontSize = () => {
    const fontSizeMap = {
      'small': 'text-xl',
      'medium': 'text-2xl',
      'large': 'text-3xl',
      'xl': 'text-4xl'
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

  const baseClass = `${getTypingFontSize()} inline-block relative`;
  const fontStyle = { fontFamily: getTypingFontFamily() };
  
  let charClass = '';
  if (index < currentIndex) {
    if (errors.has(index)) {
      charClass = 'text-red-500';
    } else {
      // Typed correctly - use theme color
      if (theme.mode === 'dark') {
        // For dark mode, use the accent color which is properly defined
        charClass = theme.accent;
      } else {
        // For light mode, use primary color as text
        charClass = `${theme.primary.replace('bg-', 'text-')}`;
      }
    }
  } else if (index === currentIndex) {
    // Current character - use secondary text color
    charClass = `${theme.textSecondary}`;
  } else {
    // Untyped characters - use different colors for dark vs light
    if (theme.mode === 'dark') {
      charClass = 'text-gray-500'; // Grey for untyped in dark mode
    } else {
      charClass = `${theme.textSecondary}`;
    }
  }

  return (
    <span className={`${baseClass} ${charClass}`} style={fontStyle}>
      {char === ' ' ? '\u00A0' : char}
      {showCursor && (
        <span className="absolute top-0 bottom-0 left-0 w-0.5 bg-blue-500 animate-pulse"></span>
      )}
    </span>
  );
});

CharacterComponent.displayName = 'CharacterComponent';

const TypingComponent = ({ 
  content, 
  onComplete, 
  settings = { timeLimit: 60, wordLimit: 50, theme: 'blue' },
  title = "Typing Practice",
  isLesson = false // New prop to identify lesson mode
}) => {
  const { theme, fontSize, fontFamily } = useTheme();
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
    if (isCompleted && !isActive && startTime) {
      // Small delay to ensure all state updates are complete
      const timeoutId = setTimeout(() => handleComplete(), 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isCompleted, isActive, startTime]);

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

  // Global keydown for auto-focus
  useEffect(() => {
    const handleKeyDown = (e) => {
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
  }, [isPaused, isCompleted]);

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
    
    for (let i = 0; i < newLength; i++) {
      if (value[i] === generatedContent[i]) {
        correctCount++;
      } else {
        newErrors.add(i);
        newAllErrors.add(i);
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
    
    setWpmHistory(prevHistory => {
      const finalEntry = { time: finalTime, wpm: netWPM };
      
      if (prevHistory.length === 0 || prevHistory[prevHistory.length - 1].time !== finalTime) {
        return [...prevHistory, finalEntry];
      }
      return prevHistory;
    });

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
      wpmHistory: wpmHistory,
      completedAt: new Date().toISOString()
    };

    navigate('/results', { state: { results: result } });

    if (onComplete) {
      onComplete(result);
    }
  }, [startTime, timeElapsed, practiceSettings, userInput, correctCharacters, allErrors, title, wpmHistory, navigate, onComplete]);



  // Error boundary for character rendering - memoized for performance
  const CharacterWithErrorBoundary = React.memo(({ char, index }) => {
    try {
      return (
        <CharacterComponent 
          char={char} 
          index={index}
          currentIndex={currentIndex}
          errors={errors}
          theme={theme}
          fontSize={settings.fontSize}
          fontFamily={settings.fontFamily}
          showCursor={index === currentIndex}
        />
      );
    } catch (error) {
      console.error('Character rendering error:', error);
      return <span className="text-red-500">?</span>;
    }
  });
  
  CharacterWithErrorBoundary.displayName = 'CharacterWithErrorBoundary';

  // Calculate live stats with accurate real-time formulas
  const calculateCurrentWPM = () => {
    if (!startTime || timeElapsed === 0) return 0;
    return calculateWPM(correctCharacters, timeElapsed);
  };

  // Optimized content slicing for better performance - only render visible characters
  const getVisibleContent = useMemo(() => {
    if (!generatedContent) return '';
    
    // Calculate visible range based on current position and viewport
    const buffer = 300; // Character buffer around visible area
    const start = Math.max(0, currentIndex - buffer);
    const end = Math.min(generatedContent.length, currentIndex + buffer * 2);
    
    return {
      content: generatedContent.slice(start, end),
      offset: start
    };
  }, [generatedContent, currentIndex]);

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
          
          {/* Center: Live Stats with Animations */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 group">
              <div className={`p-2 ${theme.name === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'} rounded-full group-hover:scale-110 transition-transform duration-200`}>
                <Zap className={`w-4 h-4 ${theme.name === 'dark' ? 'text-blue-400' : 'text-blue-700'}`} />
              </div>
              <div className="flex flex-col items-center">
                <span className={`font-bold text-xl ${theme.text} tabular-nums transition-all duration-300 ${currentNetWPM > 0 ? 'animate-bounce-subtle' : ''}`}>
                  {currentNetWPM}
                </span>
                <span className={`text-xs ${theme.textSecondary} font-medium`}>WPM</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 group">
              <div className={`p-2 ${theme.name === 'dark' ? 'bg-green-900/30' : 'bg-green-100'} rounded-full group-hover:scale-110 transition-transform duration-200`}>
                <Target className={`w-4 h-4 ${theme.name === 'dark' ? 'text-green-400' : 'text-green-700'}`} />
              </div>
              <div className="flex flex-col items-center">
                <span className={`font-bold text-xl ${theme.text} tabular-nums transition-all duration-300`}>
                  {currentAccuracy}%
                </span>
                <span className={`text-xs ${theme.textSecondary} font-medium`}>ACC</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 group">
              <div className={`p-2 ${theme.name === 'dark' ? 'bg-orange-900/30' : 'bg-orange-100'} rounded-full group-hover:scale-110 transition-transform duration-200`}>
                <Clock className={`w-4 h-4 ${theme.name === 'dark' ? 'text-orange-400' : 'text-orange-700'}`} />
              </div>
              <div className="flex flex-col items-center">
                <span className={`font-bold text-xl ${theme.text} tabular-nums`}>
                  {formatTime(timeElapsed)}
                </span>
                <span className={`text-xs ${theme.textSecondary} font-medium`}>TIME</span>
              </div>
            </div>
            
            {/* Performance Indicator */}
            {currentNetWPM > 50 && (
              <div className="flex items-center gap-1 animate-fade-in">
                <Award className={`w-4 h-4 ${theme.name === 'dark' ? 'text-yellow-400' : 'text-yellow-600'} animate-bounce`} />
                <span className={`text-xs ${theme.name === 'dark' ? 'text-yellow-400' : 'text-yellow-600'} font-semibold`}>Great!</span>
              </div>
            )}
            
            {/* Perfect Accuracy Badge */}
            {currentAccuracy === 100 && (
              <div className="flex items-center gap-1 animate-fade-in">
                <Target className={`w-4 h-4 ${theme.name === 'dark' ? 'text-green-400' : 'text-green-600'} animate-bounce`} />
                <span className={`text-xs ${theme.name === 'dark' ? 'text-green-400' : 'text-green-600'} font-semibold`}>Perfect!</span>
              </div>
            )}
          </div>

          {/* Right: Enhanced Control Buttons */}
          <div className="flex gap-2">
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
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine"></div>
              {/* Pulsing effect for high accuracy */}
              {currentAccuracy >= 95 && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/30 to-emerald-400/30 animate-pulse"></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Typing Area with Overflow Scroll */}
      <div className="mb-6 relative">
        <div 
          ref={textRef}
          className={`${theme.background} p-8 rounded-xl border-2 ${theme.border} cursor-text ${getTypingFontSize()} relative transition-all duration-300 hover:shadow-lg focus-within:shadow-xl focus-within:border-blue-500 overflow-hidden`}
          onClick={() => inputRef.current?.focus()}
          style={{ 
            height: '160px',
            lineHeight: '1.8',
            wordSpacing: '0.2em',
            letterSpacing: '0.02em',
            fontFamily: getTypingFontFamily()
          }}
        >
          {/* Focus Indicator */}
          {isActive && (
            <div className="absolute top-2 right-2 z-10">
              <div className={`w-3 h-3 ${theme.name === 'dark' ? 'bg-green-400' : 'bg-green-500'} rounded-full animate-pulse`}></div>
            </div>
          )}
          
          {/* Scrollable Text Content */}
          <div 
            className="leading-relaxed whitespace-pre-wrap"
            style={{
              transform: `translateY(-${scrollOffset}px)`,
              transition: 'transform 0.15s ease-out', // Faster transition
              minHeight: '200px' // Much smaller minimum height
            }}
          >
            {getVisibleContent.content.split('').map((char, index) => (
              <CharacterWithErrorBoundary
                key={`char-${getVisibleContent.offset + index}-${char}`}
                char={char}
                index={getVisibleContent.offset + index}
              />
            ))}
          </div>
          
          {/* Completion Celebration */}
          {isCompleted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl animate-fade-in">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl animate-bounce-in text-center">
                <Award className={`w-12 h-12 ${theme.name === 'dark' ? 'text-yellow-400' : 'text-yellow-500'} mx-auto mb-2 animate-spin-slow`} />
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
          autoComplete="off"
          spellCheck="false"
        />
      </div>

      {/* Virtual Keyboard - Hide in focus mode */}
      <div className={`transition-all duration-300 ${focusMode ? 'opacity-20 scale-95' : 'opacity-100 scale-100'}`}>
        <Keyboard currentKey={currentKey} theme={settings.theme} />
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
    </div>
  );
};

export default TypingComponent;
