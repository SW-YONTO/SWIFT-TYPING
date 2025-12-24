import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Zap,
  Volume2,
  VolumeX,
  Flag,
  Crown,
  Star,
  Timer,
  User
} from 'lucide-react';
import { playSound } from '../../utils/soundEffects';

// Sentences for typing race
const sentences = [
  "The quick brown fox jumps over the lazy dog near the river bank.",
  "Practice makes perfect when you type every single day without fail.",
  "Speed and accuracy are both important skills for fast typing.",
  "Learning to type without looking at the keyboard takes time.",
  "The best way to improve is to practice regularly and stay focused.",
  "A journey of a thousand miles begins with a single step forward.",
  "Technology has changed the way we communicate with each other.",
  "Reading books is a great way to expand your vocabulary skills.",
  "The sun rises in the east and sets in the west every day.",
  "Music can help you relax and focus while you are working hard.",
  "Good things come to those who wait and work with patience.",
  "Every expert was once a beginner who never gave up trying.",
  "Success is not final and failure is not fatal keep going.",
  "The only way to do great work is to love what you do daily.",
  "Time flies when you are having fun with friends and family.",
  "Hard work beats talent when talent does not work hard enough.",
  "Dreams do not work unless you take action and make them real.",
  "The future belongs to those who believe in the beauty of dreams.",
  "Life is what happens when you are busy making other plans.",
  "Actions speak louder than words so show what you can do."
];

// Get player name from localStorage
const getPlayerName = () => {
  try {
    const userData = localStorage.getItem('swift_typing_user');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.name || parsed.username || 'Player';
    }
    return 'Player';
  } catch {
    return 'Player';
  }
};

// AI racers with base WPM speeds
const createAIRacers = () => [
  { id: 1, name: 'Rookie', baseWPM: 20, bodyColor: '#10b981', windowColor: '#6ee7b7', glow: 'rgba(16, 185, 129, 0.6)' },
  { id: 2, name: 'Speedy', baseWPM: 30, bodyColor: '#f59e0b', windowColor: '#fcd34d', glow: 'rgba(245, 158, 11, 0.6)' },
  { id: 3, name: 'Master', baseWPM: 40, bodyColor: '#8b5cf6', windowColor: '#c4b5fd', glow: 'rgba(147, 51, 234, 0.6)' },
  { id: 4, name: 'Lightning', baseWPM: 50, bodyColor: '#ef4444', windowColor: '#fca5a5', glow: 'rgba(239, 68, 68, 0.6)' }
];

// CSS Car Component - faces right (toward finish line)
const RaceCar = ({ bodyColor, windowColor, size = 'md', isMoving = false }) => {
  const sizes = {
    sm: { width: 32, height: 14, wheel: 5 },
    md: { width: 40, height: 16, wheel: 6 },
    lg: { width: 48, height: 20, wheel: 8 }
  };
  const s = sizes[size];
  
  return (
    <svg width={s.width} height={s.height} viewBox="0 0 40 16" className="flex-shrink-0" style={{ transform: 'scaleX(-1)' }}>
      {/* Car body */}
      <path 
        d="M4 10 L8 10 L10 6 L18 4 L30 4 L34 6 L38 8 L38 12 L4 12 Z" 
        fill={bodyColor}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="0.5"
      />
      {/* Window */}
      <path 
        d="M12 6 L17 5 L28 5 L32 7 L30 9 L12 9 Z" 
        fill={windowColor}
        opacity="0.8"
      />
      {/* Front wheel */}
      <circle cx="10" cy="12" r={s.wheel - 1} fill="#1f2937" stroke="#374151" strokeWidth="1">
        {isMoving && <animateTransform attributeName="transform" type="rotate" from="0 10 12" to="-360 10 12" dur="0.2s" repeatCount="indefinite" />}
      </circle>
      {/* Back wheel */}
      <circle cx="30" cy="12" r={s.wheel - 1} fill="#1f2937" stroke="#374151" strokeWidth="1">
        {isMoving && <animateTransform attributeName="transform" type="rotate" from="0 30 12" to="-360 30 12" dur="0.2s" repeatCount="indefinite" />}
      </circle>
      {/* Wheel caps */}
      <circle cx="10" cy="12" r="2" fill="#6b7280" />
      <circle cx="30" cy="12" r="2" fill="#6b7280" />
      {/* Headlight - now on right side after flip */}
      <rect x="36" y="8" width="3" height="2" rx="1" fill="#fef08a" />
      {/* Taillight - now on left side after flip */}
      <rect x="2" y="9" width="2" height="2" rx="0.5" fill="#ef4444" />
    </svg>
  );
};

// High score storage
const getHighScores = () => {
  try {
    const stored = localStorage.getItem('racer_game_high_scores');
    return stored ? JSON.parse(stored) : { easy: 0, medium: 0, hard: 0 };
  } catch {
    return { easy: 0, medium: 0, hard: 0 };
  }
};

const saveHighScore = (difficulty, wpm) => {
  try {
    const scores = getHighScores();
    if (wpm > scores[difficulty]) {
      scores[difficulty] = wpm;
      localStorage.setItem('racer_game_high_scores', JSON.stringify(scores));
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

const WordRacerGame = () => {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState('idle'); // idle, countdown, playing, finished
  const [difficulty, setDifficulty] = useState('medium');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [highScores, setHighScores] = useState(getHighScores());
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [playerName, setPlayerName] = useState(getPlayerName());
  
  // Race state
  const [currentSentence, setCurrentSentence] = useState('');
  const [userInput, setUserInput] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [raceTime, setRaceTime] = useState(0);
  const [playerProgress, setPlayerProgress] = useState(0); // 0-100%
  const [playerWPM, setPlayerWPM] = useState(0);
  const [finishOrder, setFinishOrder] = useState([]);
  
  // AI racers state
  const [aiRacers, setAiRacers] = useState(createAIRacers());
  const [aiProgress, setAiProgress] = useState([0, 0, 0, 0]); // Progress for each AI
  const [aiCurrentWPM, setAiCurrentWPM] = useState([0, 0, 0, 0]); // Current WPM display for each AI
  
  // Stats
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  
  const inputRef = useRef(null);
  const gameLoopRef = useRef(null);
  const startTimeRef = useRef(null);
  const aiSpeedsRef = useRef([]); // Store AI effective speeds (with variations)
  
  // Difficulty affects AI speed multiplier
  const difficultyMultiplier = {
    easy: 0.7,    // AI slower
    medium: 1.0,  // Normal
    hard: 1.3     // AI faster
  };
  
  // Calculate time to complete sentence based on WPM
  // Formula: WPM * 5 chars/word / 60 = chars per second
  // Time to complete = sentence length / chars per second
  const calculateTimeToComplete = useCallback((wpm, sentenceLength) => {
    const charsPerSecond = (wpm * 5) / 60;
    return sentenceLength / charsPerSecond; // seconds to complete
  }, []);
  
  // Calculate progress based on elapsed time and WPM
  const calculateProgressFromTime = useCallback((elapsedSeconds, wpm, sentenceLength) => {
    const timeToComplete = calculateTimeToComplete(wpm, sentenceLength);
    const progress = (elapsedSeconds / timeToComplete) * 100;
    return Math.min(100, progress);
  }, [calculateTimeToComplete]);
  
  // Get random sentence
  const getRandomSentence = useCallback(() => {
    return sentences[Math.floor(Math.random() * sentences.length)];
  }, []);
  
  // Calculate player's current WPM
  const calculateWPM = useCallback(() => {
    if (!startTimeRef.current || userInput.length === 0) return 0;
    const elapsedMinutes = (Date.now() - startTimeRef.current) / 60000;
    if (elapsedMinutes < 0.01) return 0;
    const wordsTyped = userInput.length / 5; // Standard: 5 chars = 1 word
    return Math.round(wordsTyped / elapsedMinutes);
  }, [userInput]);
  
  // Start countdown
  const startCountdown = useCallback(() => {
    setGameState('countdown');
    setCountdown(3);
    setPlayerProgress(0);
    setAiProgress([0, 0, 0, 0]);
    setAiCurrentWPM([0, 0, 0, 0]);
    setRaceTime(0);
    setPlayerWPM(0);
    setFinishOrder([]);
    setTotalKeystrokes(0);
    setCorrectKeystrokes(0);
    setIsNewHighScore(false);
    setCurrentSentence(getRandomSentence());
    setUserInput('');
    setPlayerName(getPlayerName());
    
    // Reset AI racers with fresh random variations
    const newAiRacers = createAIRacers();
    setAiRacers(newAiRacers);
    
    // Pre-calculate AI speeds with variation (set once at race start)
    const multiplier = difficultyMultiplier[difficulty];
    aiSpeedsRef.current = newAiRacers.map(ai => {
      // Each AI gets a consistent speed for this race with ±15% variation
      const variation = 0.85 + Math.random() * 0.30;
      return ai.baseWPM * multiplier * variation;
    });
    
    if (soundEnabled) playSound('pop');
  }, [soundEnabled, getRandomSentence, difficulty]);
  
  // Countdown effect
  useEffect(() => {
    if (gameState !== 'countdown') return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        if (soundEnabled) playSound('pop');
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setGameState('playing');
      startTimeRef.current = Date.now();
      if (soundEnabled) playSound('success');
      inputRef.current?.focus();
    }
  }, [gameState, countdown, soundEnabled]);
  
  // Game loop for AI movement and time tracking - INDEPENDENT of typing
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const multiplier = difficultyMultiplier[difficulty];
    let lastTime = performance.now();
    let animationId;
    
    // Create AI state that persists across animation frames
    const aiState = aiRacers.map(ai => ({
      ...ai,
      currentWPM: ai.baseWPM * multiplier,
      nextVariationTime: Math.random() * 2000, // Next WPM change in ms
      mistakeEndTime: 0 // When current mistake penalty ends
    }));
    
    const gameLoop = () => {
      const currentTime = performance.now();
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      // Update race time
      setRaceTime(prev => prev + delta);
      
      // Update AI progress with realistic speed variations
      setAiProgress(prev => {
        const newProgress = [...prev];
        const newWPM = [];
        
        if (!currentSentence) return newProgress;
        const sentenceLength = currentSentence.length;
        
        aiState.forEach((ai, index) => {
          if (prev[index] >= 100) {
            newWPM[index] = 0; // Finished
            return;
          }
          
          // Update WPM variation every 1-3 seconds for more realistic typing
          if (currentTime >= ai.nextVariationTime) {
            const variation = 0.8 + Math.random() * 0.4; // ±20% variation
            ai.currentWPM = ai.baseWPM * multiplier * variation;
            ai.nextVariationTime = currentTime + (1000 + Math.random() * 2000); // Next change in 1-3s
            
            // Random "mistake" that slows down typing (3% chance)
            if (Math.random() < 0.03) {
              ai.mistakeEndTime = currentTime + (500 + Math.random() * 1500); // 0.5-2s penalty
            }
          }
          
          // Apply mistake penalty
          let effectiveWPM = ai.currentWPM;
          if (currentTime < ai.mistakeEndTime) {
            effectiveWPM *= 0.3; // Slow down during mistake
          }
          
          // Convert WPM to progress per second (more realistic calculation)
          // Average word length is 5 chars, so WPM * 5 = chars per minute
          // Divide by 60 to get chars per second, then by sentence length for progress per second
          const charsPerSecond = (effectiveWPM * 5) / 60;
          const progressPerSecond = (charsPerSecond / sentenceLength) * 100;
          
          // Smooth increment
          const progressIncrement = progressPerSecond * delta;
          
          newProgress[index] = Math.min(100, prev[index] + progressIncrement);
          newWPM[index] = Math.round(effectiveWPM);
        });
        
        // Update WPM display
        setAiCurrentWPM(newWPM);
        
        return newProgress;
      });
      
      animationId = requestAnimationFrame(gameLoop);
    };
    
    // Start the game loop
    animationId = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [gameState, difficulty]); // Only restart when game state or difficulty changes
  
  // Separate effect for updating player WPM based on typing
  useEffect(() => {
    if (gameState !== 'playing') return;
    setPlayerWPM(calculateWPM());
  }, [userInput, gameState, calculateWPM]);
  
  // Check for finish
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const newFinishOrder = [...finishOrder];
    let updated = false;
    
    // Check player finish
    if (playerProgress >= 100 && !finishOrder.includes('player')) {
      newFinishOrder.push('player');
      updated = true;
      if (soundEnabled) {
        playSound(newFinishOrder.length === 1 ? 'levelUp' : 'success');
      }
    }
    
    // Check AI finish
    aiProgress.forEach((progress, index) => {
      const aiId = `ai_${index}`;
      if (progress >= 100 && !finishOrder.includes(aiId)) {
        newFinishOrder.push(aiId);
        updated = true;
      }
    });
    
    if (updated) {
      setFinishOrder(newFinishOrder);
      
      // Game ends when player finishes
      if (newFinishOrder.includes('player')) {
        setGameState('finished');
      }
    }
  }, [playerProgress, aiProgress, gameState, finishOrder, soundEnabled]);
  
  // Handle input - allow wrong characters, user must fix with backspace
  const handleInputChange = (e) => {
    if (gameState !== 'playing') return;
    
    const value = e.target.value;
    
    // Allow any input including wrong characters
    setUserInput(value);
    setTotalKeystrokes(prev => prev + 1);
    
    // Count correct characters for accuracy
    let correctCount = 0;
    for (let i = 0; i < value.length && i < currentSentence.length; i++) {
      if (value[i] === currentSentence[i]) {
        correctCount++;
      }
    }
    setCorrectKeystrokes(correctCount);
    
    // Only update progress based on CORRECT consecutive characters from start
    let correctLength = 0;
    for (let i = 0; i < value.length && i < currentSentence.length; i++) {
      if (value[i] === currentSentence[i]) {
        correctLength++;
      } else {
        break; // Stop at first mistake
      }
    }
    
    const newProgress = (correctLength / currentSentence.length) * 100;
    setPlayerProgress(newProgress);
    
    // Check if completed correctly
    if (value === currentSentence) {
      setPlayerProgress(100);
      if (soundEnabled) playSound('levelUp');
    } else if (value.length > userInput.length) {
      // New character typed
      const lastTypedIndex = value.length - 1;
      if (lastTypedIndex < currentSentence.length && value[lastTypedIndex] === currentSentence[lastTypedIndex]) {
        if (soundEnabled) playSound('pop');
      } else {
        if (soundEnabled) playSound('error');
      }
    }
  };
  
  // Save high score on finish
  useEffect(() => {
    if (gameState === 'finished') {
      const finalWPM = calculateWPM();
      const isNew = saveHighScore(difficulty, finalWPM);
      setIsNewHighScore(isNew);
      if (isNew) {
        setHighScores(getHighScores());
      }
    }
  }, [gameState, difficulty, calculateWPM]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);
  
  // Get current position
  const getCurrentPosition = () => {
    const allProgress = [
      { id: 'player', progress: playerProgress },
      ...aiProgress.map((p, i) => ({ id: `ai_${i}`, progress: p }))
    ];
    allProgress.sort((a, b) => b.progress - a.progress);
    return allProgress.findIndex(p => p.id === 'player') + 1;
  };
  
  const accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`${theme.cardBg} rounded-2xl shadow-xl border ${theme.border} overflow-hidden`}>
      {/* Race track animations */}
      <style>{`
        @keyframes roadMove {
          0% { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
        @keyframes carMove {
          0%, 100% { transform: translateY(-50%); }
          50% { transform: translateY(-50%) translateY(-1px); }
        }
        @keyframes checkeredWave {
          0% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
          100% { transform: rotate(-5deg); }
        }
        @keyframes exhaustSmoke {
          0% { opacity: 0.6; transform: scale(1) translateX(0); }
          100% { opacity: 0; transform: scale(2) translateX(-10px); }
        }
      `}</style>
      
      {/* Game Header */}
      <div className={`p-4 border-b ${theme.border} ${theme.background}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className={`text-xl font-bold ${theme.text}`}>🏎️ Word Racer</h2>
            {gameState === 'playing' && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Timer className="w-4 h-4 text-blue-500" />
                  <span className={`font-mono font-bold ${theme.text}`}>{formatTime(raceTime)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className={`font-bold ${theme.text}`}>P{getCurrentPosition()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-cyan-500" />
                  <span className={`${theme.textSecondary}`}>{playerWPM} WPM</span>
                </div>
                <div className="flex items-center gap-1">
                  <Flag className="w-4 h-4 text-green-500" />
                  <span className={`${theme.textSecondary}`}>{Math.round(playerProgress)}%</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg ${theme.secondary} ${theme.text} transition-colors`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            {gameState === 'idle' && (
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className={`px-3 py-2 rounded-lg ${theme.inputBg} ${theme.text} border ${theme.border}`}
              >
                <option value="easy">Easy (Slower AI)</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard (Faster AI)</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Race Track */}
      <div x
        className="relative h-[320px] overflow-hidden"
        style={{
          background: theme.mode === 'dark' 
            ? 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)'
            : 'linear-gradient(180deg, #e0f2fe 0%, #bae6fd 100%)'
        }}
      >
        {/* Track lanes */}
        <div className="absolute inset-x-0 top-4 bottom-4 flex flex-col justify-between px-16">
          {/* Player lane */}
          <div className="relative h-14 flex items-center">
            {/* Track background */}
            <div 
              className={`absolute inset-0 rounded-xl ${
                theme.mode === 'dark' ? 'bg-gray-700/80' : 'bg-gray-300/80'
              } border-2 border-cyan-400/60`}
            >
              {/* Road texture */}
              <div 
                className="absolute inset-1 rounded-lg opacity-30"
                style={{
                  backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, transparent 30px, ${theme.mode === 'dark' ? '#fff' : '#000'} 30px, ${theme.mode === 'dark' ? '#fff' : '#000'} 35px)`,
                  animation: gameState === 'playing' ? 'roadMove 0.5s linear infinite' : 'none'
                }}
              />
            </div>
            
            {/* Start line */}
            <div className="absolute left-0 top-1 bottom-1 w-2 bg-green-500 rounded-l-lg" />
            {/* Finish line */}
            <div 
              className="absolute right-0 top-1 bottom-1 w-4 rounded-r-lg"
              style={{ background: 'repeating-linear-gradient(0deg, #000 0px, #000 4px, #fff 4px, #fff 8px)' }}
            />
            
            {/* Player car */}
            <div 
              className="absolute top-1/2 z-10 transition-all duration-100 ease-linear"
              style={{ 
                left: `calc(${Math.min(Math.max(playerProgress, 2), 95)}%)`,
                transform: 'translateY(-50%)',
                animation: gameState === 'playing' ? 'carMove 0.15s ease-in-out infinite' : 'none'
              }}
            >
              <div className="relative">
                {/* Exhaust smoke */}
                {gameState === 'playing' && (
                  <div 
                    className="absolute -left-3 top-1/2 w-2 h-2 rounded-full bg-gray-400"
                    style={{ animation: 'exhaustSmoke 0.3s ease-out infinite' }}
                  />
                )}
                <div 
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600"
                  style={{ boxShadow: '0 0 15px 5px rgba(6, 182, 212, 0.5)' }}
                >
                  <RaceCar bodyColor="#06b6d4" windowColor="#67e8f9" size="md" isMoving={gameState === 'playing'} />
                  <span className="text-white font-bold text-xs hidden md:inline">{playerName}</span>
                  {finishOrder.includes('player') && (
                    <span className="text-yellow-300 font-bold text-xs">#{finishOrder.indexOf('player') + 1}</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Lane label */}
            <div className={`absolute -left-14 top-1/2 -translate-y-1/2 w-12 text-right`}>
              <div className="flex items-center justify-end gap-1">
                <span className="text-xs font-bold text-cyan-500">YOU</span>
              </div>
              <div className={`text-xs ${theme.textSecondary}`}>{playerWPM}wpm</div>
            </div>
          </div>
          
          {/* AI lanes */}
          {aiRacers.map((ai, index) => {
            const progress = aiProgress[index];
            const hasFinished = finishOrder.includes(`ai_${index}`);
            const finishPosition = finishOrder.indexOf(`ai_${index}`) + 1;
            
            return (
              <div key={ai.id} className="relative h-11 flex items-center">
                {/* Track background */}
                <div 
                  className={`absolute inset-0 rounded-lg ${
                    theme.mode === 'dark' ? 'bg-gray-800/60' : 'bg-gray-200/60'
                  } border border-white/20`}
                >
                  <div 
                    className="absolute inset-1 rounded opacity-20"
                    style={{
                      backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, transparent 30px, ${theme.mode === 'dark' ? '#fff' : '#000'} 30px, ${theme.mode === 'dark' ? '#fff' : '#000'} 35px)`,
                      animation: gameState === 'playing' && !hasFinished ? 'roadMove 0.6s linear infinite' : 'none'
                    }}
                  />
                </div>
                
                {/* Start/Finish markers */}
                <div className="absolute left-0 top-1 bottom-1 w-1.5 bg-green-500/60 rounded-l" />
                <div 
                  className="absolute right-0 top-1 bottom-1 w-3 rounded-r opacity-60"
                  style={{ background: 'repeating-linear-gradient(0deg, #000 0px, #000 3px, #fff 3px, #fff 6px)' }}
                />
                
                {/* AI car */}
                <div 
                  className="absolute top-1/2 z-10 transition-all duration-150 ease-linear"
                  style={{ 
                    left: `calc(${Math.min(Math.max(progress, 2), 95)}%)`,
                    transform: 'translateY(-50%)',
                    animation: gameState === 'playing' && !hasFinished ? 'carMove 0.2s ease-in-out infinite' : 'none'
                  }}
                >
                  <div className="relative">
                    {gameState === 'playing' && !hasFinished && (
                      <div 
                        className="absolute -left-2 top-1/2 w-1.5 h-1.5 rounded-full bg-gray-400"
                        style={{ animation: 'exhaustSmoke 0.4s ease-out infinite' }}
                      />
                    )}
                    <div 
                      className="flex items-center gap-1 px-1 py-0.5 rounded-md"
                      style={{ 
                        background: `linear-gradient(135deg, ${ai.bodyColor}dd, ${ai.bodyColor}aa)`,
                        boxShadow: `0 0 10px 3px ${ai.glow}`
                      }}
                    >
                      <RaceCar bodyColor={ai.bodyColor} windowColor={ai.windowColor} size="sm" isMoving={gameState === 'playing' && !hasFinished} />
                      <span className="text-white font-bold text-xs hidden lg:inline">{ai.name}</span>
                      {hasFinished && (
                        <span className="text-yellow-300 font-bold text-xs">#{finishPosition}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* AI info label */}
                <div className={`absolute -left-14 top-1/2 -translate-y-1/2 w-12 text-right`}>
                  <div className={`text-xs font-medium ${theme.text}`}>{ai.name}</div>
                  <div className={`text-xs ${theme.textSecondary}`}>
                    {ai.baseWPM}wpm
                    {gameState === 'playing' && !hasFinished && (
                      <span className="text-yellow-500"> ({aiCurrentWPM[index]})</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Progress indicator bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/30">
          <div 
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-150"
            style={{ width: `${playerProgress}%` }}
          />
        </div>
        
        {/* Countdown overlay */}
        {gameState === 'countdown' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-8xl font-bold text-white mb-4 animate-pulse">
                {countdown > 0 ? countdown : 'GO!'}
              </div>
              <div className="text-xl text-white/80">Get ready to type!</div>
            </div>
          </div>
        )}
        
        {/* Idle State */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="mb-4 transform scale-150">
              <RaceCar bodyColor="#06b6d4" windowColor="#67e8f9" size="lg" isMoving={false} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Word Racer</h3>
            <p className="text-white/80 mb-4 text-center max-w-md px-4">
              Type the sentence faster than AI opponents! First to 100% wins the race!
            </p>
            
         
            
            {/* High Scores Display */}
            {(highScores.easy > 0 || highScores.medium > 0 || highScores.hard > 0) && (
              <div className="mb-4 px-6 py-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-xl border border-amber-500/30">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-300 font-bold">Best WPM</span>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-green-400 font-bold">{highScores.easy}</div>
                    <div className="text-white/60 text-xs">Easy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-yellow-400 font-bold">{highScores.medium}</div>
                    <div className="text-white/60 text-xs">Medium</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-400 font-bold">{highScores.hard}</div>
                    <div className="text-white/60 text-xs">Hard</div>
                  </div>
                </div>
              </div>
            )}
            
            <button
              onClick={startCountdown}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg shadow-lg hover:scale-105 transition-transform"
            >
              <Play className="w-5 h-5" />
              Start Race
            </button>
          </div>
        )}
        
        {/* Finished State */}
        {gameState === 'finished' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-4">
            {finishOrder[0] === 'player' ? (
              <>
                <div className="text-5xl mb-1" style={{ animation: 'checkeredWave 0.5s ease-in-out infinite' }}>🏆</div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-1">Victory!</h3>
                {isNewHighScore && (
                  <div className="flex items-center gap-2 mb-1 text-amber-300 text-sm">
                    <Star className="w-4 h-4" />
                    <span className="font-bold">New Best WPM!</span>
                    <Star className="w-4 h-4" />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-5xl mb-1">🏁</div>
                <h3 className="text-xl font-bold text-white mb-1">Race Complete!</h3>
              </>
            )}
            
            {/* Leaderboard */}
            <div className={`${theme.cardBg} rounded-xl p-3 mb-3 w-full max-w-sm`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className={`font-bold ${theme.text}`}>Leaderboard</span>
              </div>
              <div className="space-y-1">
                {/* Sort all racers by progress/finish order */}
                {(() => {
                  const allRacers = [
                    { id: 'player', name: playerName, wpm: playerWPM, bodyColor: '#06b6d4', windowColor: '#67e8f9', isPlayer: true, progress: playerProgress },
                    ...aiRacers.map((ai, i) => ({ id: `ai_${i}`, name: ai.name, wpm: ai.baseWPM, bodyColor: ai.bodyColor, windowColor: ai.windowColor, isPlayer: false, progress: aiProgress[i] }))
                  ];
                  
                  // Sort by finish order first, then by progress
                  allRacers.sort((a, b) => {
                    const aFinished = finishOrder.indexOf(a.id);
                    const bFinished = finishOrder.indexOf(b.id);
                    if (aFinished !== -1 && bFinished !== -1) return aFinished - bFinished;
                    if (aFinished !== -1) return -1;
                    if (bFinished !== -1) return 1;
                    return b.progress - a.progress;
                  });
                  
                  return allRacers.map((racer, pos) => (
                    <div 
                      key={racer.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                        racer.isPlayer 
                          ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-400/50' 
                          : theme.mode === 'dark' ? 'bg-gray-800/50' : 'bg-gray-200/50'
                      }`}
                    >
                      {/* Position */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        pos === 0 ? 'bg-yellow-500 text-black' :
                        pos === 1 ? 'bg-gray-400 text-black' :
                        pos === 2 ? 'bg-amber-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        #{pos + 1}
                      </div>
                      
                      {/* Car */}
                      <RaceCar bodyColor={racer.bodyColor} windowColor={racer.windowColor} size="sm" isMoving={false} />
                      
                      {/* Name */}
                      <span className={`flex-1 font-medium ${racer.isPlayer ? 'text-cyan-400' : theme.text}`}>
                        {racer.name}
                        {racer.isPlayer && <span className="ml-1 text-xs text-cyan-300">(You)</span>}
                      </span>
                      
                      {/* WPM */}
                      <span className={`text-sm font-mono ${theme.textSecondary}`}>
                        {racer.isPlayer ? playerWPM : racer.wpm} WPM
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>
            
            {/* Stats */}
            <div className={`${theme.cardBg} rounded-xl p-3 mb-3`}>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`text-xl font-bold ${theme.accent}`}>{playerWPM}</div>
                  <div className={`text-xs ${theme.textSecondary}`}>WPM</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold ${theme.accent}`}>{formatTime(raceTime)}</div>
                  <div className={`text-xs ${theme.textSecondary}`}>Time</div>
                </div>
                <div className="text-center">
                  <div className={`text-xl font-bold ${theme.accent}`}>{accuracy}%</div>
                  <div className={`text-xs ${theme.textSecondary}`}>Accuracy</div>
                </div>
              </div>
            </div>
            
            <button
              onClick={startCountdown}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg hover:scale-105 transition-transform"
            >
              <RotateCcw className="w-4 h-4" />
              Race Again
            </button>
          </div>
        )}
      </div>

      {/* Input Area */}
      {gameState === 'playing' && (
        <div className={`p-4 border-t ${theme.border}`}>
          {/* Sentence display */}
          <div className="mb-4">
            <div className={`text-sm ${theme.textSecondary} mb-2`}>Type this sentence: <span className="text-xs">(mistakes shown in red)</span></div>
            <div 
              className={`p-4 rounded-xl ${theme.mode === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} font-mono text-lg leading-relaxed`}
            >
              {currentSentence.split('').map((char, i) => {
                let className = theme.textSecondary;
                let style = {};
                
                if (i < userInput.length) {
                  if (userInput[i] === char) {
                    // Correct character
                    className = 'text-cyan-400 font-bold';
                    style = { textShadow: '0 0 8px rgba(6, 182, 212, 0.6)' };
                  } else {
                    // Wrong character - show in red
                    className = 'text-red-500 font-bold bg-red-500/20';
                    style = { textShadow: '0 0 8px rgba(239, 68, 68, 0.6)' };
                  }
                } else if (i === userInput.length) {
                  className = `${theme.text} bg-cyan-400/30 border-b-2 border-cyan-400`;
                }
                
                return (
                  <span key={i} className={className} style={style}>
                    {char}
                  </span>
                );
              })}
            </div>
          </div>
          
          {/* WPM bar */}
          <div className="mb-4">
            <div className={`flex justify-between text-sm ${theme.textSecondary} mb-1`}>
              <span>Your Speed</span>
              <span>{playerWPM} WPM</span>
            </div>
            <div className={`h-3 rounded-full ${theme.mode === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
              <div 
                className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-cyan-400 to-blue-500"
                style={{ 
                  width: `${Math.min((playerWPM / 80) * 100, 100)}%`,
                  boxShadow: playerWPM > 40 ? '0 0 15px rgba(6, 182, 212, 0.6)' : 'none'
                }}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={handleInputChange}
              placeholder="Start typing..."
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className={`flex-1 px-4 py-3 rounded-xl ${theme.inputBg} ${theme.text} border-2 ${
                userInput.length > 0 
                  ? currentSentence.startsWith(userInput)
                    ? 'border-cyan-400 focus:border-cyan-500'
                    : 'border-red-400 focus:border-red-500'
                  : theme.border
              } text-lg font-mono tracking-wide focus:outline-none transition-colors`}
            />
            <div className={`px-4 py-2 rounded-lg ${theme.secondary}`}>
              <span className={`text-sm ${theme.textSecondary}`}>Accuracy: </span>
              <span className={`font-bold ${theme.text}`}>{accuracy}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordRacerGame;
