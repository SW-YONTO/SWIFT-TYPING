import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Trophy, Target, Zap, Heart, Volume2, VolumeX, Crown, Star } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { progressManager } from '../../utils/storage';
import { playSound } from '../../utils/soundEffects';

// Expanded word lists by stage difficulty (2-3 letters, 4-5 letters, 6-7 letters, 8+ letters)
const wordsByLength = {
  tiny: ['go', 'up', 'it', 'we', 'no', 'so', 'an', 'in', 'on', 'do', 'to', 'be', 'he', 'me', 'my', 'by', 'or', 'as', 'at', 'if'],
  small: ['cat', 'dog', 'run', 'sit', 'hat', 'map', 'cup', 'sun', 'big', 'red', 'pen', 'box', 'top', 'fun', 'win', 'hop', 'tap', 'net', 'bed', 'hot', 'jar', 'key', 'log', 'mud', 'oak', 'pig', 'rat', 'sky', 'toy', 'van', 'web', 'yes', 'zip', 'arm', 'bus', 'cow', 'dad', 'egg', 'fly', 'gym'],
  medium: ['apple', 'house', 'green', 'water', 'paper', 'light', 'music', 'happy', 'river', 'cloud', 'stone', 'bread', 'chair', 'plant', 'smile', 'dream', 'ocean', 'beach', 'sweet', 'night', 'table', 'phone', 'world', 'heart', 'brain', 'storm', 'tiger', 'lemon', 'grape', 'piano', 'clock', 'mouse', 'sheep', 'horse', 'whale', 'eagle', 'shark', 'tiger', 'zebra', 'olive'],
  large: ['garden', 'winter', 'summer', 'orange', 'purple', 'yellow', 'silver', 'golden', 'dragon', 'castle', 'forest', 'island', 'monkey', 'rabbit', 'flower', 'window', 'bridge', 'market', 'rocket', 'planet', 'sunset', 'guitar', 'violin', 'tennis', 'soccer', 'hockey', 'basket', 'circle', 'square', 'jungle'],
  xlarge: ['keyboard', 'mountain', 'computer', 'elephant', 'building', 'exciting', 'beautiful', 'adventure', 'chocolate', 'different', 'wonderful', 'important', 'dangerous', 'celebrate', 'experience', 'butterfly', 'crocodile', 'fantastic', 'lightning', 'pineapple', 'strawberry', 'waterfall', 'sunflower', 'basketball', 'trampoline', 'helicopter', 'skateboard', 'microphone', 'television', 'restaurant']
};

// Difficulty increases based on TIME elapsed (in seconds), not words typed
// This creates constant pressure regardless of typing speed
const getDynamicConfig = (elapsedSeconds, difficulty) => {
  // Progress ramps up over 90 seconds (1.5 minutes to max difficulty)
  const progress = Math.min(elapsedSeconds / 90, 1);
  
  // Difficulty multipliers - affects spawn rate and speed
  const diffMod = {
    easy: { speedMult: 0.7, spawnBase: 2200, spawnMin: 1200, livesBase: 6 },
    medium: { speedMult: 1.0, spawnBase: 1800, spawnMin: 800, livesBase: 4 },
    hard: { speedMult: 1.3, spawnBase: 1400, spawnMin: 500, livesBase: 3 }
  }[difficulty];
  
  // Determine word pools based on time progress
  let wordPools;
  if (progress < 0.15) wordPools = ['tiny', 'small'];      // 0-13 sec
  else if (progress < 0.3) wordPools = ['small'];           // 13-27 sec
  else if (progress < 0.5) wordPools = ['small', 'medium']; // 27-45 sec
  else if (progress < 0.7) wordPools = ['medium'];          // 45-63 sec
  else if (progress < 0.85) wordPools = ['medium', 'large'];// 63-76 sec
  else wordPools = ['large', 'xlarge'];                     // 76+ sec
  
  // Spawn interval decreases over time (faster spawns)
  // Easy: 2.2s -> 1.2s, Medium: 1.8s -> 0.8s, Hard: 1.4s -> 0.5s
  const spawnInterval = diffMod.spawnBase - (progress * (diffMod.spawnBase - diffMod.spawnMin));
  
  return {
    wordPools,
    // Balloon speed increases over time: 0.4 -> 0.9
    baseSpeed: (0.4 + progress * 0.5) * diffMod.speedMult,
    // Spawn interval in milliseconds
    spawnInterval: spawnInterval,
    lives: diffMod.livesBase
  };
};

// High score storage key
const HIGH_SCORE_KEY = 'balloon_game_high_scores';

// Get high scores from localStorage
const getHighScores = () => {
  try {
    const data = localStorage.getItem(HIGH_SCORE_KEY);
    return data ? JSON.parse(data) : { easy: 0, medium: 0, hard: 0 };
  } catch {
    return { easy: 0, medium: 0, hard: 0 };
  }
};

// Save high score
const saveHighScore = (difficulty, score) => {
  const highScores = getHighScores();
  if (score > highScores[difficulty]) {
    highScores[difficulty] = score;
    localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(highScores));
    return true; // New high score!
  }
  return false;
};

const BalloonGame = ({ currentUser, settings }) => {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState('idle'); // idle, playing, paused, gameOver
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [maxLives, setMaxLives] = useState(5); // Track max lives for display
  const [balloons, setBalloons] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [wordsTyped, setWordsTyped] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [totalChars, setTotalChars] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [difficulty, setDifficulty] = useState('medium');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [highScores, setHighScores] = useState(getHighScores());
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  
  const inputRef = useRef(null);
  const gameAreaRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const gameStartTimeRef = useRef(0); // Track when game started for time-based difficulty
  const elapsedSecondsRef = useRef(0); // Track elapsed seconds

  const balloonColors = [
    { gradient: 'from-pink-400 to-pink-600', glow: 'rgba(236, 72, 153, 0.6)', glowStrong: 'rgba(236, 72, 153, 0.8)', ring: 'ring-pink-400', text: 'text-pink-200' },
    { gradient: 'from-purple-400 to-purple-600', glow: 'rgba(168, 85, 247, 0.6)', glowStrong: 'rgba(168, 85, 247, 0.8)', ring: 'ring-purple-400', text: 'text-purple-200' },
    { gradient: 'from-blue-400 to-blue-600', glow: 'rgba(96, 165, 250, 0.6)', glowStrong: 'rgba(96, 165, 250, 0.8)', ring: 'ring-blue-400', text: 'text-blue-200' },
    { gradient: 'from-green-400 to-green-600', glow: 'rgba(74, 222, 128, 0.6)', glowStrong: 'rgba(74, 222, 128, 0.8)', ring: 'ring-green-400', text: 'text-green-200' },
    { gradient: 'from-yellow-300 to-yellow-400', glow: 'rgba(250, 204, 21, 0.6)', glowStrong: 'rgba(250, 204, 21, 0.8)', ring: 'ring-yellow-400', text: 'text-yellow-200' },
    { gradient: 'from-red-400 to-red-600', glow: 'rgba(248, 113, 113, 0.6)', glowStrong: 'rgba(248, 113, 113, 0.8)', ring: 'ring-red-400', text: 'text-red-200' },
    { gradient: 'from-cyan-400 to-cyan-600', glow: 'rgba(34, 211, 238, 0.6)', glowStrong: 'rgba(34, 211, 238, 0.8)', ring: 'ring-cyan-400', text: 'text-cyan-200' },
    { gradient: 'from-orange-400 to-orange-600', glow: 'rgba(251, 146, 60, 0.6)', glowStrong: 'rgba(251, 146, 60, 0.8)', ring: 'ring-orange-400', text: 'text-orange-200' }
  ];

  // Get current config based on elapsed time (continuous difficulty)
  const getCurrentConfig = useCallback(() => {
    return getDynamicConfig(elapsedSecondsRef.current, difficulty);
  }, [difficulty]);

  // Get word for current difficulty
  const getRandomWord = useCallback(() => {
    const config = getCurrentConfig();
    const poolName = config.wordPools[Math.floor(Math.random() * config.wordPools.length)];
    const pool = wordsByLength[poolName];
    return pool[Math.floor(Math.random() * pool.length)];
  }, [getCurrentConfig]);

  // Get speed based on current difficulty
  const getSpeed = useCallback(() => {
    const config = getCurrentConfig();
    return config.baseSpeed + (Math.random() * 0.15);
  }, [getCurrentConfig]);

  // Get spawn interval based on current difficulty
  const getSpawnInterval = useCallback(() => {
    const config = getCurrentConfig();
    return config.spawnInterval;
  }, [getCurrentConfig]);

  // Spawn a new balloon - no max limit, balloons accumulate if user is slow
  const spawnBalloon = useCallback(() => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    const word = getRandomWord();
    const maxX = gameArea.clientWidth - 120;
    const newBalloon = {
      id: Date.now() + Math.random(),
      word,
      x: Math.random() * maxX + 20,
      y: gameArea.clientHeight,
      color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
      popping: false,
      speed: getSpeed()
    };

    // No max balloon limit - balloons will accumulate if user types slowly
    setBalloons(prev => [...prev, newBalloon]);
  }, [getRandomWord, getSpeed]);

  // Game loop
  const gameLoop = useCallback((timestamp) => {
    if (gameState !== 'playing') return;

    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    // Update elapsed time for difficulty scaling
    elapsedSecondsRef.current = (timestamp - gameStartTimeRef.current) / 1000;

    // Spawn timer - interval changes based on elapsed time
    spawnTimerRef.current += deltaTime;
    const currentSpawnInterval = getSpawnInterval();
    if (spawnTimerRef.current >= currentSpawnInterval) {
      spawnBalloon();
      spawnTimerRef.current = 0;
    }

    // Update balloon positions - speed increases over time
    const currentConfig = getCurrentConfig();
    setBalloons(prev => {
      const updated = prev.map(balloon => ({
        ...balloon,
        // Balloons speed up as time passes (existing balloons also get faster!)
        y: balloon.y - (balloon.speed + currentConfig.baseSpeed * 0.3) * (deltaTime / 16)
      }));

      // Check for escaped balloons
      const escaped = updated.filter(b => b.y < -80 && !b.popping);
      if (escaped.length > 0) {
        setLives(l => {
          const newLives = l - escaped.length;
          if (newLives <= 0) {
            setGameState('gameOver');
          }
          return Math.max(0, newLives);
        });
        setCombo(0);
        if (soundEnabled) {
          playSound('error');
        }
      }

      return updated.filter(b => b.y > -100 && !b.popping);
    });

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, getSpawnInterval, getCurrentConfig, spawnBalloon, soundEnabled]);

  // Start game loop
  useEffect(() => {
    if (gameState === 'playing') {
      const now = performance.now();
      lastTimeRef.current = now;
      gameStartTimeRef.current = now; // Record game start time
      elapsedSecondsRef.current = 0;
      spawnTimerRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, gameLoop]);

  // Focus input when playing
  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value.toLowerCase();
    setUserInput(value);
    setTotalChars(prev => prev + 1);

    // Check if typed word matches any balloon
    const matchingBalloon = balloons.find(b => b.word === value && !b.popping);
    
    if (matchingBalloon) {
      // Pop the balloon
      setBalloons(prev => prev.map(b => 
        b.id === matchingBalloon.id ? { ...b, popping: true } : b
      ));

      // Calculate score with combo multiplier
      const comboMultiplier = Math.min(combo + 1, 10);
      const wordScore = matchingBalloon.word.length * 10 * comboMultiplier;
      setScore(prev => prev + wordScore);
      setWordsTyped(prev => prev + 1);
      setCorrectChars(prev => prev + matchingBalloon.word.length);
      setCombo(prev => {
        const newCombo = prev + 1;
        setMaxCombo(max => Math.max(max, newCombo));
        return newCombo;
      });

      // Play pop sound
      if (soundEnabled) {
        playSound('correct');
      }

      // Remove balloon after animation
      setTimeout(() => {
        setBalloons(prev => prev.filter(b => b.id !== matchingBalloon.id));
      }, 300);

      setUserInput('');
    }
  };

  // Calculate accuracy
  useEffect(() => {
    if (totalChars > 0) {
      setAccuracy(Math.round((correctChars / totalChars) * 100));
    }
  }, [correctChars, totalChars]);

  // Start game
  const startGame = () => {
    const config = getDynamicConfig(0, difficulty);
    
    setBalloons([]);
    setScore(0);
    setLives(config.lives);
    setMaxLives(config.lives); // Store max lives for heart display
    setWordsTyped(0);
    elapsedSecondsRef.current = 0;
    gameStartTimeRef.current = performance.now();
    setAccuracy(100);
    setTotalChars(0);
    setCorrectChars(0);
    setCombo(0);
    setMaxCombo(0);
    setUserInput('');
    setIsNewHighScore(false);
    setGameState('playing');
  };

  // Pause/Resume
  const togglePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
  };

  // Save score when game ends
  useEffect(() => {
    if (gameState === 'gameOver' && currentUser) {
      // Check for high score
      const isNewHigh = saveHighScore(difficulty, score);
      setIsNewHighScore(isNewHigh);
      setHighScores(getHighScores());
      
      progressManager.saveTestResult(currentUser.id, {
        type: 'game',
        gameType: 'balloon',
        score,
        wordsTyped,
        accuracy,
        maxCombo,
        difficulty,
        isHighScore: isNewHigh,
        timeSpent: wordsTyped * 2, // Approximate time
        wpm: Math.round(wordsTyped * 12), // Approximate WPM
        totalCharacters: correctChars,
        testTitle: `Balloon Pop (${difficulty})`
      });
    }
  }, [gameState, currentUser, score, wordsTyped, accuracy, maxCombo, correctChars, difficulty]);

  return (
    <div className={`${theme.cardBg} rounded-2xl shadow-xl border ${theme.border} overflow-hidden`}>
      {/* Game Header */}
      <div className={`p-4 border-b ${theme.border} ${theme.background}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className={`text-xl font-bold ${theme.text}`}>🎈 Balloon Pop</h2>
            {gameState !== 'idle' && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className={`font-bold ${theme.text}`}>{score}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className={`text-xs ${theme.textSecondary}`}>Best: {highScores[difficulty]}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4 text-green-500" />
                  <span className={`${theme.textSecondary}`}>{accuracy}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-purple-500" />
                  <span className={`${theme.textSecondary}`}>x{combo}</span>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(maxLives)].map((_, i) => (
                    <Heart
                      key={i}
                      className={`w-5 h-5 ${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-300'}`}
                    />
                  ))}
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
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div
        ref={gameAreaRef}
        className={`relative h-96 ${theme.mode === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-b from-sky-200 to-sky-400'} overflow-hidden`}
      >
        {/* Sky decorations */}
        <div className="absolute inset-0 pointer-events-none">
          {theme.mode === 'light' && (
            <>
              <div className="absolute top-8 left-1/4 w-16 h-8 bg-white/60 rounded-full blur-sm"></div>
              <div className="absolute top-12 right-1/3 w-20 h-10 bg-white/50 rounded-full blur-sm"></div>
              <div className="absolute top-6 right-1/4 w-12 h-6 bg-white/40 rounded-full blur-sm"></div>
            </>
          )}
        </div>

        {/* Danger zone indicator */}
        <div className={`absolute top-0 left-0 right-0 h-16 bg-gradient-to-b ${theme.mode === 'dark' ? 'from-red-900/50' : 'from-red-500/30'} to-transparent pointer-events-none`}>
          <div className={`text-center pt-2 text-xs ${theme.mode === 'dark' ? 'text-red-400' : 'text-red-700'} font-semibold uppercase tracking-wide`}>
            Danger Zone
          </div>
        </div>

        {/* Balloons */}
        {balloons.map((balloon) => {
          // Check if this balloon matches what user is typing
          const isMatching = userInput.length > 0 && balloon.word.startsWith(userInput) && !balloon.popping;
          const isExactMatch = userInput.length > 0 && balloon.word === userInput && !balloon.popping;
          
          return (
            <div
              key={balloon.id}
              className={`absolute ${balloon.popping ? 'scale-150 opacity-0 transition-all duration-300' : ''}`}
              style={{
                left: balloon.x,
                bottom: gameAreaRef.current ? gameAreaRef.current.clientHeight - balloon.y : 0,
                transform: 'translateX(-50%)',
                transition: balloon.popping ? 'all 0.3s' : 'none'
              }}
            >
              {/* Balloon */}
              <div 
                className={`relative bg-gradient-to-br ${balloon.color.gradient} rounded-full w-20 h-24 flex items-center justify-center shadow-lg ${balloon.popping ? 'animate-ping' : ''} ${isMatching ? `ring-4 ${balloon.color.ring} ring-opacity-80` : ''} ${isExactMatch ? `ring-4 ${balloon.color.ring} ring-opacity-100 scale-110` : ''}`}
                style={{
                  boxShadow: isMatching 
                    ? `0 0 20px 8px ${balloon.color.glow}, 0 0 40px 15px ${balloon.color.glow.replace('0.6', '0.3')}` 
                    : isExactMatch 
                    ? `0 0 25px 10px ${balloon.color.glowStrong}, 0 0 50px 20px ${balloon.color.glow}`
                    : '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                  transition: 'box-shadow 0.15s ease, transform 0.15s ease'
                }}
              >
                {/* Balloon shine */}
                <div className="absolute top-3 left-4 w-4 h-4 bg-white/40 rounded-full"></div>
                {/* Word with highlight for typed portion */}
                <span className="text-white font-bold text-sm drop-shadow-md px-2 text-center">
                  {isMatching ? (
                    <>
                      <span className={`${balloon.color.text} underline`}>{balloon.word.slice(0, userInput.length)}</span>
                      <span>{balloon.word.slice(userInput.length)}</span>
                    </>
                  ) : (
                    balloon.word
                  )}
                </span>
                {/* Balloon knot */}
                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-gradient-to-br ${balloon.color.gradient} rotate-45`}></div>
              </div>
              {/* String */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-px h-8 bg-gray-400"></div>
            </div>
          );
        })}

        {/* Idle State */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="text-6xl mb-4">🎈</div>
            <h3 className="text-2xl font-bold text-white mb-2">Balloon Pop</h3>
            <p className="text-white/80 mb-4 text-center max-w-md">
              Type the words on the balloons to pop them before they escape!
            </p>
            
            {/* High Scores Display */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 justify-center mb-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-bold">High Scores</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-400">{highScores.easy}</div>
                  <div className="text-xs text-white/60">Easy</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-400">{highScores.medium}</div>
                  <div className="text-xs text-white/60">Medium</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-400">{highScores.hard}</div>
                  <div className="text-xs text-white/60">Hard</div>
                </div>
              </div>
            </div>
            
            <button
              onClick={startGame}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-lg shadow-lg hover:scale-105 transition-transform`}
            >
              <Play className="w-5 h-5" />
              Start Game
            </button>
          </div>
        )}

        {/* Paused State */}
        {gameState === 'paused' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-4xl mb-4">⏸️</div>
            <h3 className="text-2xl font-bold text-white mb-6">Game Paused</h3>
            <button
              onClick={togglePause}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold shadow-lg hover:scale-105 transition-transform"
            >
              <Play className="w-5 h-5" />
              Resume
            </button>
          </div>
        )}

        {/* Game Over State */}
        {gameState === 'gameOver' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            {isNewHighScore ? (
              <>
                <div className="text-4xl mb-2">👑</div>
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">New High Score!</h3>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">💥</div>
                <h3 className="text-2xl font-bold text-white mb-2">Game Over!</h3>
              </>
            )}
            <div className={`${theme.cardBg} rounded-xl p-6 mb-6 text-center`}>
              {isNewHighScore && (
                <div className="mb-4 py-2 px-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg">
                  <span className="text-white font-bold">🏆 New Record!</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className={`text-2xl font-bold ${theme.accent}`}>{score}</div>
                  <div className={`text-sm ${theme.textSecondary}`}>Score</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${theme.accent}`}>{wordsTyped}</div>
                  <div className={`text-sm ${theme.textSecondary}`}>Words</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${theme.accent}`}>{accuracy}%</div>
                  <div className={`text-sm ${theme.textSecondary}`}>Accuracy</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${theme.accent}`}>x{maxCombo}</div>
                  <div className={`text-sm ${theme.textSecondary}`}>Max Combo</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className={`text-sm ${theme.textSecondary}`}>
                  Best ({difficulty}): <span className="font-bold text-yellow-500">{highScores[difficulty]}</span>
                </div>
              </div>
            </div>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold shadow-lg hover:scale-105 transition-transform"
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Input Area */}
      {gameState === 'playing' && (
        <div className={`p-4 border-t ${theme.border}`}>
          {/* Matching balloons indicator */}
          <div className="mb-3 flex items-center justify-center gap-2 min-h-8">
            {userInput.length > 0 && (
              <>
                <span className={`text-sm ${theme.textSecondary}`}>Matching:</span>
                {balloons.filter(b => b.word.startsWith(userInput) && !b.popping).length > 0 ? (
                  balloons
                    .filter(b => b.word.startsWith(userInput) && !b.popping)
                    .slice(0, 5)
                    .map(b => (
                      <span 
                        key={b.id} 
                        className={`px-3 py-1 rounded-full text-sm font-bold text-white bg-gradient-to-r ${b.color.gradient} shadow-md ${b.word === userInput ? 'scale-110' : ''}`}
                        style={{
                          boxShadow: b.word === userInput 
                            ? `0 0 15px 5px ${b.color.glow}` 
                            : '0 2px 8px rgba(0,0,0,0.2)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span className={b.color.text}>{b.word.slice(0, userInput.length)}</span>
                        <span>{b.word.slice(userInput.length)}</span>
                      </span>
                    ))
                ) : (
                  <span className="text-red-500 text-sm font-medium">No matching balloon!</span>
                )}
              </>
            )}
            {userInput.length === 0 && (
              <span className={`text-sm ${theme.textSecondary} italic`}>Start typing to find matching balloons...</span>
            )}
          </div>
          
          {/* Input field with large typed text display */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={handleInputChange}
                placeholder="Type here..."
                className={`w-full px-4 py-3 rounded-xl ${theme.inputBg} ${theme.text} border-2 ${
                  userInput.length > 0 
                    ? balloons.some(b => b.word.startsWith(userInput) && !b.popping)
                      ? 'border-yellow-400 focus:border-yellow-500'
                      : 'border-red-400 focus:border-red-500'
                    : theme.border
                } text-xl font-mono font-bold tracking-wider focus:outline-none transition-colors`}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
              />
              {/* Visual indicator of typed text */}
              {userInput.length > 0 && (
                <div className={`absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg ${
                  balloons.some(b => b.word === userInput && !b.popping)
                    ? 'bg-green-500 text-white'
                    : balloons.some(b => b.word.startsWith(userInput) && !b.popping)
                    ? 'bg-yellow-500 text-white'
                    : 'bg-red-500 text-white'
                } text-xs font-bold`}>
                  {balloons.some(b => b.word === userInput && !b.popping)
                    ? '✓ POP!'
                    : balloons.some(b => b.word.startsWith(userInput) && !b.popping)
                    ? `${balloons.filter(b => b.word.startsWith(userInput) && !b.popping).length} match`
                    : '✗ None'}
                </div>
              )}
            </div>
            <button
              onClick={togglePause}
              className={`p-3 rounded-xl ${theme.secondary} ${theme.text} transition-colors`}
            >
              <Pause className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalloonGame;
