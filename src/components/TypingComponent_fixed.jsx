import React, { useState, useEffect, useRef } from 'react';
import { Clock, RotateCcw, Play, Pause, BarChart3, Target, Zap, Eye, EyeOff, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Keyboard from './Keyboard';
import CustomizeModal from './CustomizeModal';
import { calculateWPM, calculateAccuracy, formatTime } from '../utils/storage';
import { useTheme } from '../contexts/ThemeContext';

const TypingComponent = ({ 
  content, 
  onComplete, 
  settings = { timeLimit: 60, wordLimit: 50, theme: 'blue' },
  title = "Typing Practice"
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
  const [practiceSettings, setPracticeSettings] = useState(() => {
    const savedSettings = localStorage.getItem('typing_app_practice_settings');
    return savedSettings ? JSON.parse(savedSettings) : {
      practiceMode: 'time',
      timeLimit: 60,
      wordLimit: 50
    };
  });
  const [generatedContent, setGeneratedContent] = useState(content);
  
  const inputRef = useRef(null);
  const textRef = useRef(null);

  // Generate content based on practice settings
  const generateContent = (originalContent, settings) => {
    if (settings.practiceMode === 'word' && settings.wordLimit > 0) {
      const words = originalContent.split(/\s+/);
      const targetWords = settings.wordLimit;
      
      if (words.length >= targetWords) {
        return words.slice(0, targetWords).join(' ');
      }
      
      // Repeat content to reach word target
      let repeatedWords = [];
      while (repeatedWords.length < targetWords) {
        const remainingWords = targetWords - repeatedWords.length;
        const wordsToAdd = words.slice(0, Math.min(words.length, remainingWords));
        repeatedWords = [...repeatedWords, ...wordsToAdd];
      }
      return repeatedWords.join(' ');
    }
    
    // For time mode, generate enough content to last the duration
    if (settings.practiceMode === 'time' && settings.timeLimit > 0) {
      const words = originalContent.split(/\s+/);
      // Estimate needed words (assuming 40 WPM average)
      const estimatedWords = Math.max(100, (settings.timeLimit / 60) * 40);
      
      let repeatedWords = [];
      while (repeatedWords.length < estimatedWords) {
        repeatedWords = [...repeatedWords, ...words];
      }
      return repeatedWords.filter(word => word !== '').join(' ');
    }
    
    // Default: return original content
    return originalContent;
  };

  // Handle customize modal apply
  const handleCustomizeApply = (newSettings) => {
    setPracticeSettings(newSettings);
    const newContent = generateContent(content, newSettings);
    setGeneratedContent(newContent);
    handleRestart();
  };

  // Initialize generated content when component mounts or content changes
  useEffect(() => {
    const newContent = generateContent(content, practiceSettings);
    setGeneratedContent(newContent);
  }, [content, practiceSettings]);

  // Timer effect - runs continuously once typing starts
  useEffect(() => {
    let interval = null;
    if (isActive && !isPaused && !isCompleted) {
      interval = setInterval(() => {
        setTimeElapsed(prev => {
          const newTime = prev + 1;
          
          // Check time limit based on practice mode and settings
          const timeLimit = practiceSettings.practiceMode === 'time' ? practiceSettings.timeLimit : 0;
          if (timeLimit && newTime >= timeLimit) {
            handleComplete();
            return newTime;
          }
          
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, isPaused, isCompleted, practiceSettings]);

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

    // Prevent going beyond content length (unless in time mode where content can extend)
    if (newLength > generatedContent.length) return;

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
    const wordsTyped = value.trim().split(/\s+/).filter(word => word.length > 0).length;
    let isCompleted = false;
    
    if (practiceSettings.practiceMode === 'word' && practiceSettings.wordLimit > 0) {
      isCompleted = wordsTyped >= practiceSettings.wordLimit;
    } else {
      isCompleted = newLength >= generatedContent.length;
    }
    
    if (isCompleted && !isCompleted) {
      setTimeout(() => handleComplete(), 200);
    }
  };

  const handleComplete = () => {
    if (isCompleted) return; // Prevent multiple completions
    
    setIsActive(false);
    setIsCompleted(true);
    
    const finalTime = timeElapsed || 1;
    const totalCharacters = userInput.length;
    const wordsTyped = userInput.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    // Calculate comprehensive results
    const grossWPM = Math.round((totalCharacters / 5) / (finalTime / 60));
    const netWPM = Math.round((correctCharacters / 5) / (finalTime / 60));
    const rawAccuracy = totalCharacters > 0 ? Math.round((correctCharacters / totalCharacters) * 100) : 100;
    
    // Add final WPM to history for chart
    setWpmHistory(prevHistory => {
      const finalEntry = { time: finalTime, wpm: netWPM };
      
      // Check if we already have this entry
      if (prevHistory.length === 0 || prevHistory[prevHistory.length - 1].time !== finalTime) {
        return [...prevHistory, finalEntry];
      }
      return prevHistory;
    });

    const result = {
      // Core metrics
      wpm: netWPM,
      grossWPM: grossWPM,
      accuracy: rawAccuracy,
      timeSpent: finalTime,
      
      // Character metrics
      totalCharacters: totalCharacters,
      correctCharacters: correctCharacters,
      errors: allErrors.size,
      
      // Word metrics
      wordsTyped: wordsTyped,
      
      // Practice settings
      practiceMode: practiceSettings.practiceMode,
      timeLimit: practiceSettings.timeLimit,
      wordLimit: practiceSettings.wordLimit,
      
      // Additional data
      content: title,
      wpmHistory: wpmHistory,
      completedAt: new Date().toISOString()
    };

    // Navigate to results page with comprehensive data
    navigate('/results', { state: { results: result } });

    if (onComplete) {
      onComplete(result);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setUserInput('');
    setErrors(new Set());
    setAllErrors(new Set());
    setStartTime(null);
    setTimeElapsed(0);
    setIsActive(false);
    setIsPaused(false);
    setIsCompleted(false);
    setWpmHistory([]);
    setCorrectCharacters(0);
    
    // Regenerate content based on current settings
    const newContent = generateContent(content, practiceSettings);
    setGeneratedContent(newContent);
    setCurrentKey(newContent[0]?.toLowerCase() || '');
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Render character with styling
  const renderCharacter = (char, index) => {
    let className = `${getTypingFontSize()} ${getTypingFontFamily()} inline-block `;
    
    if (index < currentIndex) {
      // Already typed
      if (errors.has(index)) {
        className += `${theme.errorBg} ${theme.errorText}`;
      } else {
        // Typed correctly - use theme color
        if (theme.mode === 'dark') {
          // For dark mode, use the accent color which is properly defined
          className += `${theme.accent} ${theme.correctBg}`;
        } else {
          // For light mode, use primary color as text
          className += `${theme.text} ${theme.correctBg}`;
        }
      }
    } else if (index === currentIndex) {
      // Current character
      className += `${theme.currentBg} text-white animate-pulse`;
    } else {
      // Not typed yet - use different colors for dark vs light
      if (theme.mode === 'dark') {
        className += 'text-gray-500'; // Grey for untyped in dark mode
      } else {
        className += `${theme.textSecondary}`;
      }
    }

    return (
      <span key={index} className={className}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    );
  };

  // Calculate live stats with correct formulas
  const currentGrossWPM = timeElapsed > 0 ? Math.round((userInput.length / 5) / (timeElapsed / 60)) : 0;
  const currentNetWPM = timeElapsed > 0 ? Math.round((correctCharacters / 5) / (timeElapsed / 60)) : 0;
  const currentAccuracy = userInput.length > 0 ? Math.round((correctCharacters / userInput.length) * 100) : 100;
  
  // Calculate progress based on practice mode
  let progress = 0;
  if (practiceSettings.practiceMode === 'word' && practiceSettings.wordLimit > 0) {
    const wordsTyped = userInput.trim().split(/\s+/).filter(word => word.length > 0).length;
    progress = Math.min((wordsTyped / practiceSettings.wordLimit) * 100, 100);
  } else if (practiceSettings.practiceMode === 'time' && practiceSettings.timeLimit > 0) {
    progress = Math.min((timeElapsed / practiceSettings.timeLimit) * 100, 100);
  } else {
    progress = generatedContent.length > 0 ? (currentIndex / generatedContent.length) * 100 : 0;
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

  // Font family mapping for typing area
  const getTypingFontFamily = () => {
    const fontFamilyMap = {
      'inter': 'font-sans',
      'roboto': 'font-sans', 
      'mono': 'font-mono',
      'serif': 'font-serif'
    };
    return fontFamilyMap[fontFamily] || fontFamilyMap['mono'];
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 ${theme.cardBg} rounded-lg shadow-lg`}>
      {/* Compact Header with Stats in One Line */}
      <div className={`transition-all duration-300 ${focusMode ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`}>
        <div className={`flex flex-wrap items-center justify-between mb-4 p-4 ${theme.background} rounded-lg border ${theme.border}`}>
          {/* Left: Title */}
          <h2 className={`text-xl font-bold ${theme.text}`}>{title}</h2>
          
          {/* Center: Live Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className={`font-semibold text-lg ${theme.text}`}>{currentNetWPM}</span>
              <span className={`text-sm ${theme.textSecondary}`}>WPM</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-600" />
              <span className={`font-semibold text-lg ${theme.text}`}>{currentAccuracy}%</span>
              <span className={`text-sm ${theme.textSecondary}`}>ACC</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className={`font-semibold text-lg ${theme.text}`}>{formatTime(timeElapsed)}</span>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowCustomizeModal(true)}
              className={`flex items-center gap-1 ${theme.secondary} text-white px-3 py-1 rounded text-sm ${theme.secondaryHover} transition-colors`}
            >
              <Settings className="w-3 h-3" />
              Customize
            </button>
            
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`flex items-center gap-1 ${theme.accent} text-white px-3 py-1 rounded text-sm ${theme.accentHover} transition-colors`}
            >
              {focusMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {focusMode ? 'Exit Focus' : 'Focus'}
            </button>
            
            <button
              onClick={togglePause}
              className={`flex items-center gap-1 ${theme.secondary} text-white px-3 py-1 rounded text-sm ${theme.secondaryHover} transition-colors`}
              disabled={!isActive}
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            
            <button
              onClick={handleRestart}
              className={`flex items-center gap-1 ${theme.primary} text-white px-3 py-1 rounded text-sm ${theme.primaryHover} transition-colors`}
            >
              <RotateCcw className="w-3 h-3" />
              Restart
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`w-full ${theme.progressBg} rounded-full h-2 mb-6`}>
          <div 
            className={`${theme.progressFill} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Typing Area */}
      <div className="mb-6">
        <div 
          ref={textRef}
          className={`${theme.background} p-8 rounded-lg border-2 ${theme.border} min-h-40 leading-loose cursor-text ${getTypingFontSize()} ${getTypingFontFamily()}`}
          onClick={() => inputRef.current?.focus()}
          style={{ 
            wordWrap: 'break-word', 
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word'
          }}
        >
          <div className="text-justify" style={{ wordSpacing: 'normal' }}>
            {generatedContent.split('').map((char, index) => renderCharacter(char, index))}
          </div>
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
        onApply={handleCustomizeApply}
        currentSettings={practiceSettings}
      />
    </div>
  );
};

export default TypingComponent;
