import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Trophy, Target, Zap, AlertTriangle, Volume2, VolumeX, Crown, Star } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { progressManager } from '../../utils/storage';
import { playSound } from '../../utils/soundEffects';

// Word lists by length (different from balloon game)
const wordsByLength = {
  tiny: ['ax', 'ox', 'ex', 'is', 'us', 'am', 'an', 'go', 'hi', 'lo', 'pi', 'qi', 'xi', 'um', 'mm', 'ow', 'oh', 'ah', 'eh', 'uh'],
  small: ['fix', 'hex', 'mix', 'six', 'wax', 'zoo', 'zip', 'zap', 'gym', 'spy', 'dry', 'fry', 'cry', 'why', 'sky', 'fly', 'sly', 'try', 'pry', 'shy', 'dye', 'bye', 'rye', 'eye', 'ace', 'ice', 'axe', 'ape', 'owl', 'ink', 'oak', 'oat', 'odd', 'off', 'oil', 'old', 'one', 'our', 'out'],
  medium: ['quick', 'quirk', 'queen', 'query', 'quest', 'quote', 'quilt', 'xerox', 'proxy', 'pixel', 'mixer', 'boxer', 'fixer', 'extra', 'expat', 'exile', 'exact', 'exert', 'oxide', 'axiom', 'nexus', 'vexed', 'taxed', 'hexed', 'waxed', 'sixth', 'sixty', 'oxide', 'ozone', 'azure'],
  large: ['complex', 'context', 'express', 'extreme', 'example', 'examine', 'execute', 'exhaust', 'exhibit', 'texture', 'mixture', 'fixture', 'sixteen', 'taxicab', 'maximum', 'minimum', 'anxiety', 'luxury', 'oxygen', 'phoenix', 'syntax', 'galaxy', 'prefix', 'suffix', 'reflex', 'duplex', 'vortex', 'matrix', 'climax', 'sphinx'],
  xlarge: ['exquisite', 'excellent', 'exclaimed', 'exclusive', 'executive', 'exhausted', 'existence', 'expansion', 'expensive', 'expertise', 'explosion', 'extension', 'extremist', 'luxurious', 'complexion', 'perplexed', 'inflexible', 'oxygenated', 'maximizing', 'synthesize', 'analyzing', 'oxidizing', 'vaporizing', 'paralyzing', 'recognized', 'organized', 'authorized', 'criticized', 'emphasized', 'summarized']
};

// Time-based difficulty config (similar to balloon game but harder)
const getDynamicConfig = (elapsedSeconds, difficulty) => {
  // Progress ramps up over 75 seconds (faster than balloon game)
  const progress = Math.min(elapsedSeconds / 75, 1);
  
  // Difficulty multipliers - harder than balloon game
  const diffMod = {
    easy: { speedMult: 0.8, spawnBase: 2000, spawnMin: 1000, livesBase: 5 },
    medium: { speedMult: 1.1, spawnBase: 1600, spawnMin: 700, livesBase: 4 },
    hard: { speedMult: 1.4, spawnBase: 1200, spawnMin: 450, livesBase: 3 }
  }[difficulty];
  
  // Determine word pools based on time progress
  let wordPools;
  if (progress < 0.12) wordPools = ['tiny', 'small'];       // 0-9 sec
  else if (progress < 0.25) wordPools = ['small'];          // 9-19 sec
  else if (progress < 0.4) wordPools = ['small', 'medium']; // 19-30 sec
  else if (progress < 0.6) wordPools = ['medium'];          // 30-45 sec
  else if (progress < 0.8) wordPools = ['medium', 'large']; // 45-60 sec
  else wordPools = ['large', 'xlarge'];                     // 60+ sec
  
  // Spawn interval decreases over time (faster spawns)
  const spawnInterval = diffMod.spawnBase - (progress * (diffMod.spawnBase - diffMod.spawnMin));
  
  return {
    wordPools,
    // Block speed increases over time: 0.6 -> 1.2 (faster than balloon)
    baseSpeed: (0.6 + progress * 0.6) * diffMod.speedMult,
    spawnInterval: spawnInterval
  };
};

// High score storage key
const HIGH_SCORE_KEY = 'crusher_game_high_scores';

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
    return true;
  }
  return false;
};

const BlockContainerGame = ({ currentUser, settings }) => {
  const { theme } = useTheme();
  const [gameState, setGameState] = useState('idle'); // idle, playing, paused, gameOver
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [blocks, setBlocks] = useState([]);
  const [containerFill, setContainerFill] = useState(0); // 0-100 percentage
  const [userInput, setUserInput] = useState('');
  const [wordsTyped, setWordsTyped] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [totalChars, setTotalChars] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [difficulty, setDifficulty] = useState('medium');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [warningPulse, setWarningPulse] = useState(false);
  const [highScores, setHighScores] = useState(getHighScores());
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  
  const inputRef = useRef(null);
  const gameAreaRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const gameStartTimeRef = useRef(0);
  const elapsedSecondsRef = useRef(0);

  const blockColors = [
    { gradient: 'from-red-400 to-red-600', glow: 'rgba(248, 113, 113, 0.6)', ring: 'ring-red-400', text: 'text-red-200' },
    { gradient: 'from-orange-400 to-orange-600', glow: 'rgba(251, 146, 60, 0.6)', ring: 'ring-orange-400', text: 'text-orange-200' },
    { gradient: 'from-amber-400 to-amber-600', glow: 'rgba(251, 191, 36, 0.6)', ring: 'ring-amber-400', text: 'text-amber-200' },
    { gradient: 'from-lime-400 to-lime-600', glow: 'rgba(163, 230, 53, 0.6)', ring: 'ring-lime-400', text: 'text-lime-200' },
    { gradient: 'from-emerald-400 to-emerald-600', glow: 'rgba(52, 211, 153, 0.6)', ring: 'ring-emerald-400', text: 'text-emerald-200' },
    { gradient: 'from-cyan-400 to-cyan-600', glow: 'rgba(34, 211, 238, 0.6)', ring: 'ring-cyan-400', text: 'text-cyan-200' },
    { gradient: 'from-blue-400 to-blue-600', glow: 'rgba(96, 165, 250, 0.6)', ring: 'ring-blue-400', text: 'text-blue-200' },
    { gradient: 'from-violet-400 to-violet-600', glow: 'rgba(167, 139, 250, 0.6)', ring: 'ring-violet-400', text: 'text-violet-200' }
  ];

  // Container settings
  const containerWidth = 300;
  const containerHeight = 350;
  const blockHeight = 50;
  const maxFillLevel = 100; // percentage at which game ends

  // Get current config based on elapsed time
  const getCurrentConfig = useCallback(() => {
    return getDynamicConfig(elapsedSecondsRef.current, difficulty);
  }, [difficulty]);

  // Get fall speed based on time
  const getFallSpeed = useCallback(() => {
    const config = getCurrentConfig();
    return config.baseSpeed + (Math.random() * 0.2);
  }, [getCurrentConfig]);

  // Get spawn interval based on time
  const getSpawnInterval = useCallback(() => {
    const config = getCurrentConfig();
    return config.spawnInterval;
  }, [getCurrentConfig]);

  // Get random word based on current difficulty
  const getRandomWord = useCallback(() => {
    const config = getCurrentConfig();
    const poolName = config.wordPools[Math.floor(Math.random() * config.wordPools.length)];
    const pool = wordsByLength[poolName];
    return pool[Math.floor(Math.random() * pool.length)];
  }, [getCurrentConfig]);

  // Calculate container fill percentage
  const calculateFillPercentage = useCallback((blocksList) => {
    const settledBlocks = blocksList.filter(b => b.settled && !b.destroying);
    const totalBlockHeight = settledBlocks.length * blockHeight;
    return Math.min(100, (totalBlockHeight / containerHeight) * 100);
  }, []);

  // Spawn a new block
  const spawnBlock = useCallback(() => {
    const word = getRandomWord();
    
    const newBlock = {
      id: Date.now() + Math.random(),
      word,
      x: containerWidth / 2, // Center of container
      y: 0, // Start at top (will be positioned using bottom)
      color: blockColors[Math.floor(Math.random() * blockColors.length)],
      settled: false,
      destroying: false,
      fallDistance: 0, // Track how far block has fallen
      speed: getFallSpeed(),
      crackLevel: 0 // 0 = no cracks, increases as user types matching letters
    };

    setBlocks(prev => [...prev, newBlock]);
  }, [getRandomWord, getFallSpeed]);

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
      spawnBlock();
      spawnTimerRef.current = 0;
    }

    // Get current config for speed boost
    const currentConfig = getCurrentConfig();

    // Update block positions
    setBlocks(prev => {
      // Count settled blocks to determine stack height
      const settledCount = prev.filter(b => b.settled && !b.destroying).length;
      
      const updated = prev.map(block => {
        if (block.settled || block.destroying) return block;

        // Increase fall distance - blocks speed up over time
        const speedBoost = currentConfig.baseSpeed * 0.2;
        const newFallDistance = block.fallDistance + (block.speed + speedBoost) * (deltaTime / 16);
        
        // Calculate the stop position (distance from top where block should settle)
        const stackHeight = settledCount * blockHeight;
        const stopDistance = containerHeight - stackHeight - blockHeight;

        if (newFallDistance >= stopDistance) {
          return { ...block, fallDistance: stopDistance, settled: true };
        }

        return { ...block, fallDistance: newFallDistance };
      });

      // Update container fill
      const fillPercentage = calculateFillPercentage(updated);
      setContainerFill(fillPercentage);

      // Check for game over
      if (fillPercentage >= maxFillLevel) {
        setGameState('gameOver');
        if (soundEnabled) {
          playSound('error');
        }
      }

      // Warning effect when fill is high
      if (fillPercentage >= 70) {
        setWarningPulse(true);
      } else {
        setWarningPulse(false);
      }

      return updated.filter(b => !b.destroying || b.destroyTimer > 0).map(b => {
        if (b.destroying && b.destroyTimer) {
          return { ...b, destroyTimer: b.destroyTimer - deltaTime };
        }
        return b;
      });
    });

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, getSpawnInterval, getCurrentConfig, spawnBlock, calculateFillPercentage, soundEnabled]);

  // Start game loop
  useEffect(() => {
    if (gameState === 'playing') {
      const now = performance.now();
      lastTimeRef.current = now;
      gameStartTimeRef.current = now;
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

  // Handle input change - update crack levels on matching blocks
  const handleInputChange = (e) => {
    const value = e.target.value.toLowerCase();
    setUserInput(value);
    setTotalChars(prev => prev + 1);

    // Update crack levels for matching blocks
    setBlocks(prev => prev.map(block => {
      if (block.destroying) return block;
      if (block.word.startsWith(value) && value.length > 0) {
        // Calculate crack level based on how much of the word is typed (0-100%)
        const crackLevel = (value.length / block.word.length) * 100;
        return { ...block, crackLevel };
      }
      return { ...block, crackLevel: 0 };
    }));

    // Check if typed word matches any block (prioritize falling blocks, then settled)
    const fallingBlocks = blocks.filter(b => !b.settled && !b.destroying);
    const settledBlocks = blocks.filter(b => b.settled && !b.destroying);
    
    let matchingBlock = fallingBlocks.find(b => b.word === value);
    if (!matchingBlock) {
      matchingBlock = settledBlocks.find(b => b.word === value);
    }
    
    if (matchingBlock) {
      // Destroy the block
      setBlocks(prev => prev.map(b => 
        b.id === matchingBlock.id ? { ...b, destroying: true, destroyTimer: 300, crackLevel: 100 } : b
      ));

      // Calculate score with combo multiplier
      const comboMultiplier = Math.min(combo + 1, 10);
      const wordScore = matchingBlock.word.length * 15 * comboMultiplier;
      
      // Bonus for destroying falling blocks
      const fallingBonus = !matchingBlock.settled ? matchingBlock.word.length * 5 : 0;
      
      setScore(prev => prev + wordScore + fallingBonus);
      setWordsTyped(prev => prev + 1);
      setCorrectChars(prev => prev + matchingBlock.word.length);
      setCombo(prev => {
        const newCombo = prev + 1;
        setMaxCombo(max => Math.max(max, newCombo));
        return newCombo;
      });

      // Play destroy sound
      if (soundEnabled) {
        playSound('correct');
      }

      // Remove block after animation and recalculate stack positions
      setTimeout(() => {
        setBlocks(prev => {
          const remaining = prev.filter(b => b.id !== matchingBlock.id);
          // Recalculate settled block positions
          const settledRemaining = remaining.filter(b => b.settled && !b.destroying);
          const fallingRemaining = remaining.filter(b => !b.settled);
          
          return [
            ...fallingRemaining,
            ...settledRemaining.map((block, index) => ({
              ...block,
              fallDistance: containerHeight - ((settledRemaining.length - index) * blockHeight)
            }))
          ];
        });
      }, 300);

      setUserInput('');
    }
  };

  // Reset combo on wrong input after a delay
  useEffect(() => {
    if (userInput.length > 0) {
      const hasPartialMatch = blocks.some(b => 
        !b.destroying && b.word.startsWith(userInput)
      );
      
      if (!hasPartialMatch && userInput.length > 2) {
        // Wrong input
        setCombo(0);
      }
    }
  }, [userInput, blocks]);

  // Calculate accuracy
  useEffect(() => {
    if (totalChars > 0) {
      setAccuracy(Math.round((correctChars / totalChars) * 100));
    }
  }, [correctChars, totalChars]);

  // Start game
  const startGame = () => {
    setBlocks([]);
    setScore(0);
    setLevel(1);
    setContainerFill(0);
    setWordsTyped(0);
    setAccuracy(100);
    setTotalChars(0);
    setCorrectChars(0);
    setCombo(0);
    setMaxCombo(0);
    setUserInput('');
    setWarningPulse(false);
    setIsNewHighScore(false);
    elapsedSecondsRef.current = 0;
    gameStartTimeRef.current = performance.now();
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
        gameType: 'container',
        score,
        wordsTyped,
        accuracy,
        maxCombo,
        difficulty,
        isHighScore: isNewHigh,
        timeSpent: Math.round(elapsedSecondsRef.current),
        wpm: Math.round(wordsTyped * 10),
        totalCharacters: correctChars,
        testTitle: `Word Crusher (${difficulty})`
      });
    }
  }, [gameState, currentUser, score, wordsTyped, accuracy, maxCombo, correctChars, difficulty]);

  // Get fill level color
  const getFillColor = () => {
    if (containerFill >= 80) return 'from-red-500 to-red-600';
    if (containerFill >= 60) return 'from-orange-500 to-orange-600';
    if (containerFill >= 40) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  };

  return (
    <div className={`${theme.cardBg} rounded-2xl shadow-xl border ${theme.border} overflow-hidden`}>
      {/* Breaking animation keyframes */}
      <style>{`
        @keyframes breakLeft {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(-30px, 40px) rotate(-25deg); opacity: 0; }
        }
        @keyframes breakCenter {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(0, 60px) scale(0.5); opacity: 0; }
        }
        @keyframes breakRight {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(30px, 40px) rotate(25deg); opacity: 0; }
        }
      `}</style>
      {/* Game Header */}
      <div className={`p-4 border-b ${theme.border} ${theme.background}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className={`text-xl font-bold ${theme.text}`}>📦 Word Crusher</h2>
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
        {gameState === 'playing' && (
          <div className="mt-2 flex items-center gap-4">
            <span className={`text-sm ${theme.textSecondary}`}>Level {level}</span>
            <div className="flex-1 flex items-center gap-2">
              <span className={`text-xs ${theme.textSecondary}`}>Fill:</span>
              <div className={`flex-1 h-3 rounded-full ${theme.progressBg} overflow-hidden`}>
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${getFillColor()} transition-all duration-300 ${warningPulse ? 'animate-pulse' : ''}`}
                  style={{ width: `${containerFill}%` }}
                />
              </div>
              <span className={`text-xs font-bold ${containerFill >= 70 ? 'text-red-500' : theme.textSecondary}`}>
                {Math.round(containerFill)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Game Area */}
      <div
        ref={gameAreaRef}
        className={`relative h-[450px] ${theme.mode === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-b from-slate-100 to-slate-300'} overflow-hidden flex items-end justify-center pb-4`}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${theme.mode === 'dark' ? '#fff' : '#000'} 10px, ${theme.mode === 'dark' ? '#fff' : '#000'} 11px)`
          }}></div>
        </div>

        {/* U-Shape Container */}
        <div 
          className="relative"
          style={{ width: containerWidth + 20, height: containerHeight + 20 }}
        >
          {/* Container walls */}
          <div className={`absolute left-0 top-0 bottom-0 w-3 rounded-l-lg bg-gradient-to-r ${theme.mode === 'dark' ? 'from-gray-600 to-gray-700' : 'from-gray-500 to-gray-600'} shadow-lg`}></div>
          <div className={`absolute right-0 top-0 bottom-0 w-3 rounded-r-lg bg-gradient-to-l ${theme.mode === 'dark' ? 'from-gray-600 to-gray-700' : 'from-gray-500 to-gray-600'} shadow-lg`}></div>
          <div className={`absolute left-0 right-0 bottom-0 h-3 rounded-b-lg bg-gradient-to-t ${theme.mode === 'dark' ? 'from-gray-600 to-gray-700' : 'from-gray-500 to-gray-600'} shadow-lg`}></div>

          {/* Container interior */}
          <div 
            className={`absolute left-3 right-3 top-0 bottom-3 ${theme.mode === 'dark' ? 'bg-gray-800/50' : 'bg-white/50'} backdrop-blur-sm`}
            style={{ height: containerHeight }}
          >
            {/* Warning overlay when nearly full */}
            {warningPulse && (
              <div className="absolute inset-0 bg-red-500/20 animate-pulse flex items-start justify-center pt-4">
                <AlertTriangle className="w-8 h-8 text-red-500 animate-bounce" />
              </div>
            )}

            {/* Blocks */}
            {blocks.map((block) => {
              // Check if this block matches what user is typing
              const isMatching = userInput.length > 0 && block.word.startsWith(userInput) && !block.destroying;
              const isExactMatch = userInput.length > 0 && block.word === userInput && !block.destroying;
              
              return (
                <div
                  key={block.id}
                  className="absolute"
                  style={{
                    top: block.fallDistance,
                    left: '50%',
                    width: containerWidth - 26,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {/* Breaking pieces when destroying */}
                  {block.destroying && (
                    <div className="relative h-12 w-full">
                      <div className={`absolute w-1/3 h-12 left-0 bg-gradient-to-br ${block.color.gradient} rounded-l-lg`} 
                        style={{ 
                          animation: 'breakLeft 0.5s ease-out forwards',
                          boxShadow: `0 0 20px 5px ${block.color.glow}`
                        }} 
                      />
                      <div className={`absolute w-1/3 h-12 left-1/3 bg-gradient-to-br ${block.color.gradient}`} 
                        style={{ 
                          animation: 'breakCenter 0.5s ease-out forwards',
                          boxShadow: `0 0 20px 5px ${block.color.glow}`
                        }} 
                      />
                      <div className={`absolute w-1/3 h-12 right-0 bg-gradient-to-br ${block.color.gradient} rounded-r-lg`} 
                        style={{ 
                          animation: 'breakRight 0.5s ease-out forwards',
                          boxShadow: `0 0 20px 5px ${block.color.glow}`
                        }} 
                      />
                    </div>
                  )}
                  
                  {!block.destroying && (
                    <div 
                      className={`h-12 bg-gradient-to-br ${block.color.gradient} rounded-lg flex items-center justify-center shadow-lg overflow-hidden relative ${
                        isExactMatch ? 'animate-pulse' : ''
                      }`}
                      style={{
                        boxShadow: isMatching 
                          ? `0 0 20px 5px ${block.color.glow}` 
                          : '0 4px 15px rgba(0, 0, 0, 0.4)'
                      }}
                    >
                      {/* Word with highlight for typed portion */}
                      <span className="text-white font-bold text-lg drop-shadow-md tracking-wider relative z-10">
                        {isMatching ? (
                          <>
                            <span className={`${block.color.text} font-black drop-shadow-lg`} style={{ textShadow: `0 0 10px ${block.color.glow}` }}>{block.word.slice(0, userInput.length)}</span>
                            <span className="opacity-70">{block.word.slice(userInput.length)}</span>
                          </>
                        ) : (
                          block.word
                        )}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Container reflection */}
          <div className="absolute left-3 right-3 bottom-3 h-8 bg-gradient-to-t from-white/10 to-transparent pointer-events-none"></div>
        </div>

        {/* Idle State */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-white mb-2">Word Crusher</h3>
            <p className="text-white/80 mb-4 text-center max-w-md px-4">
              Type words to destroy blocks before the container overflows! Destroy falling blocks for bonus points.
            </p>
            
            {/* High Scores Display */}
            {(highScores.easy > 0 || highScores.medium > 0 || highScores.hard > 0) && (
              <div className="mb-4 px-6 py-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-xl border border-amber-500/30">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-300 font-bold">High Scores</span>
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
              onClick={startGame}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg shadow-lg hover:scale-105 transition-transform`}
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
                <div className="text-4xl mb-2 animate-bounce">🏆</div>
                <h3 className="text-2xl font-bold text-amber-400 mb-2">New High Score!</h3>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">💥</div>
                <h3 className="text-2xl font-bold text-white mb-2">Container Overflow!</h3>
              </>
            )}
            <div className={`${theme.cardBg} rounded-xl p-6 mb-6 text-center`}>
              {isNewHighScore && (
                <div className="mb-4 pb-4 border-b border-amber-500/30">
                  <div className="flex items-center justify-center gap-2">
                    <Crown className="w-6 h-6 text-amber-400" />
                    <span className="text-amber-400 font-bold text-xl">{score}</span>
                    <Crown className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="text-amber-300/80 text-sm">Best on {difficulty}!</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className={`text-2xl font-bold ${theme.accent}`}>{score}</div>
                  <div className={`text-sm ${theme.textSecondary}`}>Score</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${theme.accent}`}>{wordsTyped}</div>
                  <div className={`text-sm ${theme.textSecondary}`}>Crushed</div>
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
                <div className={`text-lg font-bold ${theme.accent}`}>Level {level}</div>
                <div className={`text-sm ${theme.textSecondary}`}>Reached</div>
              </div>
            </div>
            <button
              onClick={startGame}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-lg hover:scale-105 transition-transform"
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
          {/* Matching blocks indicator */}
          <div className="mb-3 flex items-center justify-center gap-2 min-h-10 flex-wrap">
            {userInput.length > 0 && (
              <>
                <span className={`text-sm ${theme.textSecondary}`}>Matching:</span>
                {blocks.filter(b => b.word.startsWith(userInput) && !b.destroying).length > 0 ? (
                  blocks
                    .filter(b => b.word.startsWith(userInput) && !b.destroying)
                    .slice(0, 5)
                    .map(b => (
                      <span 
                        key={b.id} 
                        className={`px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r ${b.color.gradient} ${b.word === userInput ? 'scale-110 ring-2 ring-white' : ''} ${!b.settled ? 'animate-pulse' : ''}`}
                        style={{
                          boxShadow: `0 0 15px 5px ${b.color.glow}, 0 0 30px 10px ${b.color.glow.replace('0.6', '0.3')}`,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span className={`${b.color.text} font-black`} style={{ textShadow: `0 0 8px ${b.color.glow}` }}>{b.word.slice(0, userInput.length)}</span>
                        <span className="opacity-70">{b.word.slice(userInput.length)}</span>
                        {!b.settled && <span className="ml-1 text-xs">⬇️</span>}
                      </span>
                    ))
                ) : (
                  <span className="text-red-500 text-sm font-medium">No matching block!</span>
                )}
              </>
            )}
            {userInput.length === 0 && (
              <span className={`text-sm ${theme.textSecondary} italic`}>Start typing to crush blocks...</span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={handleInputChange}
                placeholder="Type here to crush blocks..."
                className={`w-full px-4 py-3 rounded-xl ${theme.inputBg} ${theme.text} border-2 ${
                  userInput.length > 0 
                    ? blocks.some(b => b.word.startsWith(userInput) && !b.destroying)
                      ? 'border-cyan-400 focus:border-cyan-500'
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
                  blocks.some(b => b.word === userInput && !b.destroying)
                    ? 'bg-green-500 text-white'
                    : blocks.some(b => b.word.startsWith(userInput) && !b.destroying)
                    ? 'bg-cyan-500 text-white'
                    : 'bg-red-500 text-white'
                } text-xs font-bold`}>
                  {blocks.some(b => b.word === userInput && !b.destroying)
                    ? '✓ CRUSH!'
                    : blocks.some(b => b.word.startsWith(userInput) && !b.destroying)
                    ? `${blocks.filter(b => b.word.startsWith(userInput) && !b.destroying).length} match`
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

export default BlockContainerGame;
