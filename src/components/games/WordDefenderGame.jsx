import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, Zap, Heart, RefreshCw, Star, Target, Crosshair } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { soundEffects } from '../../utils/soundEffects';

const WORD_BANK = [
  // Original
  "system", "matrix", "cyber", "laser", "shield", "orbit", "planet", "galaxy", 
  "asteroid", "meteor", "quantum", "gravity", "nebula", "plasma", "reactor", 
  "velocity", "cosmic", "stellar", "fusion", "photon", "eclipse", "satellite",
  "module", "station", "thrust", "vector", "horizon", "zenith", "aurora", "nova",
  // Sci-Fi Tech
  "android", "cyborg", "drone", "engine", "network", "portal", "sensor", "server",
  "signal", "warp", "hyper", "circuit", "data", "firewall", "hacker", "mainframe",
  "memory", "packet", "router", "terminal", "virus", "armor", "blaster", "cannon",
  // Space & Astronomy
  "comet", "cosmos", "crater", "equinox", "lunar", "quasar", "solar", "void",
  "pulsar", "vacuum", "abyss", "celestial", "cluster", "infinity", "lightyear", 
  "supernova", "universe", "wormhole", "zodiac", "apogee", "perigee", "solstice",
  // Cyberpunk & Grid
  "neon", "chrome", "glitch", "synth", "virtual", "reality", "hologram", "proxy",
  "cipher", "crypto", "uplink", "download", "override", "protocol", "syntax",
  "grid", "nexus", "pulse", "static", "bandwidth", "node", "gateway", "firewire",
  // Action & Defense
  "attack", "defend", "breach", "combat", "danger", "evade", "impact", "target",
  "threat", "alert", "barrier", "blast", "damage", "strike", "turret", "weapon",
  "intercept", "destroy", "critical", "tactical", "secure", "lockdown", "engage",
  // Elements & Energy
  "spark", "volt", "charge", "kinetic", "thermal", "flux", "ion", "magnetic",
  "radiation", "spectrum", "current", "power", "energy", "force", "core",
  // Cool Call-signs
  "phantom", "shadow", "apex", "vortex", "omega", "alpha", "delta", "echo",
  "stratos", "aether", "chronos", "prism", "helix", "vertex", "axiom", "cipher"
];

const WordDefenderGame = ({ currentUser }) => {
  const { theme, isDarkMode } = useTheme();
  
  // Game state
  const [appState, setAppState] = useState('start'); // start, playing, gameover
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  
  // Entities
  const [words, setWords] = useState([]);
  const [explosions, setExplosions] = useState([]);
  const [lasers, setLasers] = useState([]);
  
  // Input
  const [targetId, setTargetId] = useState(null);
  
  // Refs for game loop
  const requestRef = useRef();
  const lastTimeRef = useRef();
  const wordsRef = useRef([]);
  const lasersRef = useRef([]);
  const targetIdRef = useRef(null);
  const nextSpawnTimeRef = useRef(0);
  const gameAreaRef = useRef(null);
  const explosionsRef = useRef([]);

  // Sync refs with state
  useEffect(() => { wordsRef.current = words; }, [words]);
  useEffect(() => { lasersRef.current = lasers; }, [lasers]);
  useEffect(() => { targetIdRef.current = targetId; }, [targetId]);
  useEffect(() => { explosionsRef.current = explosions; }, [explosions]);

  // Helper to spawn a word
  const spawnWord = useCallback((timestamp) => {
    const wordText = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
    const xPos = 10 + Math.random() * 80; // 10% to 90%
    
    // We want words to take about 10-15 seconds to reach the bottom (100%)
    // Speed is % per millisecond. 100% / 12000ms = ~0.008% per ms
    const baseSpeed = 0.006;
    const speed = baseSpeed + (level * 0.0005) + (Math.random() * 0.003); 
    
    let type = 'bomb';
    const rand = Math.random();
    if (rand > 0.9) {
      type = 'health'; // 10% chance for health drop
    } else if (rand > 0.6) {
      type = 'ship'; // 30% chance for ship
    }

    return {
      id: `word_${timestamp}_${Math.random()}`,
      text: wordText,
      progress: 0,
      x: xPos,
      y: -5, // Start just above screen
      speed: type === 'health' ? speed * 1.2 : speed, // Health drops slightly faster
      type: type,
      lastShootTime: timestamp + 1500 + Math.random() * 1000 // Initial shoot delay
    };
  }, [level]);

  const startGame = () => {
    setScore(0);
    setHealth(100);
    setLevel(1);
    setCombo(0);
    setWords([]);
    wordsRef.current = []; // Sync ref immediately
    setLasers([]);
    lasersRef.current = [];
    setExplosions([]);
    setTargetId(null);
    targetIdRef.current = null;
    setAppState('playing');
    lastTimeRef.current = null;
    nextSpawnTimeRef.current = 0; // Spawn immediately on first frame
  };

  const createExplosion = (x, y, scale = 1, color = 'cyan') => {
    const newExplosion = { id: Date.now() + Math.random(), x, y, scale, color, time: performance.now() };
    setExplosions(prev => [...prev, newExplosion]);
    
    // Clean up explosion after 500ms
    setTimeout(() => {
      setExplosions(prev => prev.filter(e => e.id !== newExplosion.id));
    }, 500);
  };

  const handleGameOver = useCallback(() => {
    setAppState('gameover');
    soundEffects.playError();
    // In a real app, update global stats here
  }, []);

  // Main game loop
  const updateGame = useCallback((timestamp) => {
    if (appState !== 'playing') return;

    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const deltaTime = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    const currentWords = [...wordsRef.current];
    const currentLasers = [...lasersRef.current];
    let stateChanged = false;
    let lasersChanged = false;

    // Spawn words
    if (timestamp > nextSpawnTimeRef.current) {
      const newWord = spawnWord(timestamp);
      currentWords.push(newWord);
      stateChanged = true;
      // Decrease spawn interval as level increases (start at 2.5s, drop to 1s)
      const spawnInterval = Math.max(1000, 3000 - (level * 200));
      nextSpawnTimeRef.current = timestamp + spawnInterval + (Math.random() * 500);
    }

    // Move words and shoot lasers
    let healthLost = 0;

    for (let i = currentWords.length - 1; i >= 0; i--) {
      const word = currentWords[i];
      // Move word down based on elapsed time (deltaTime)
      word.y += word.speed * deltaTime;
      stateChanged = true; // Always moving

      // Ship shooting logic
      if (word.type === 'ship' && timestamp > word.lastShootTime) {
        currentLasers.push({
          id: `laser_${Math.random()}`,
          x: word.x,
          y: word.y,
          speed: 0.04 // Fast laser
        });
        word.lastShootTime = timestamp + 2500; // Next shot in 2.5s
        lasersChanged = true;
      }

      // Check if word hit the bottom (base)
      if (word.y >= 90) {
        if (word.type !== 'health') {
          // Hit base
          healthLost += 20; // Bomb/Ship crash deals 20 HP
          createExplosion(word.x, 90, 1.5, 'red');
          soundEffects.playError();
        } else {
          // Health drops just disappear harmlessly with a small effect
          createExplosion(word.x, 90, 0.5, 'green');
        }
        
        // Remove word
        currentWords.splice(i, 1);
        
        // Reset target if we were typing this word
        if (targetIdRef.current === word.id) {
          setTargetId(null);
          targetIdRef.current = null;
          setCombo(0);
        }
      }
    }

    // Move lasers
    for (let i = currentLasers.length - 1; i >= 0; i--) {
      const laser = currentLasers[i];
      laser.y += laser.speed * deltaTime;
      lasersChanged = true;

      if (laser.y >= 90) { // Laser hits shield
        healthLost += 5; // Laser deals 5 HP
        createExplosion(laser.x, 90, 0.5, 'purple');
        currentLasers.splice(i, 1);
      }
    }

    if (stateChanged) {
      wordsRef.current = currentWords; // Sync ref synchronously to avoid frame drops
      setWords(currentWords);
    }
    if (lasersChanged) {
      lasersRef.current = currentLasers;
      setLasers(currentLasers);
    }

    if (healthLost > 0) {
      setHealth(prev => {
        const newHealth = prev - healthLost;
        if (newHealth <= 0) {
          handleGameOver();
          return 0;
        }
        return newHealth;
      });
    }

    requestRef.current = requestAnimationFrame(updateGame);
  }, [appState, level, spawnWord, handleGameOver]);

  useEffect(() => {
    if (appState === 'playing') {
      requestRef.current = requestAnimationFrame(updateGame);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [appState, updateGame]);

  // Input Handling
  useEffect(() => {
    if (appState !== 'playing') return;

    const handleKeyDown = (e) => {
      // Ignore functional keys
      if (e.key.length > 1 || e.ctrlKey || e.altKey || e.metaKey) return;
      
      const char = e.key.toLowerCase();
      const currentWords = [...wordsRef.current];
      const targetWordId = targetIdRef.current;

      if (targetWordId) {
        // We have a target, check next letter
        const wordIndex = currentWords.findIndex(w => w.id === targetWordId);
        if (wordIndex !== -1) {
          const word = currentWords[wordIndex];
          if (word.text[word.progress] === char) {
            // Correct letter
            word.progress += 1;
            soundEffects.playKeypress();

            if (word.progress === word.text.length) {
              // Word destroyed!
              soundEffects.playSuccess();
              createExplosion(word.x, word.y);
              setScore(s => s + word.text.length * 10 * (1 + Math.floor(combo / 10) * 0.5));
              setCombo(c => c + 1);
              
              if (word.type === 'health') {
                 setHealth(prev => Math.min(100, prev + 30));
                 createExplosion(word.x, word.y, 2, 'green'); // Big green explosion
              }

              setTargetId(null);
              targetIdRef.current = null;
              currentWords.splice(wordIndex, 1);
              
              // Level up logic
              setScore(currentScore => {
                const newLevel = Math.floor(currentScore / 500) + 1;
                if (newLevel > level) setLevel(newLevel);
                return currentScore;
              });
            }
            wordsRef.current = currentWords; // Sync ref synchronously
            setWords(currentWords);
          } else {
            // Wrong letter
            soundEffects.playError();
            setCombo(0);
          }
        } else {
          // Target not found
          setTargetId(null);
          targetIdRef.current = null;
        }
      } else {
        // No target, find a word starting with the typed char
        // Prioritize words that are lowest on the screen
        const availableWords = currentWords
          .filter(w => w.text[0] === char)
          .sort((a, b) => b.y - a.y);

        if (availableWords.length > 0) {
          // Found a word!
          const target = availableWords[0];
          target.progress = 1;
          setTargetId(target.id);
          targetIdRef.current = target.id;
          soundEffects.playKeypress();
          
          if (target.text.length === 1) {
             createExplosion(target.x, target.y);
             setScore(s => s + 10);
             setTargetId(null);
             targetIdRef.current = null;
             currentWords.splice(currentWords.findIndex(w => w.id === target.id), 1);
          }
          wordsRef.current = currentWords; // Sync ref synchronously
          setWords(currentWords);
        } else {
          // Typed wrong letter and no target
          soundEffects.playError();
          setCombo(0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState, level, combo]);

  // Render Start Screen
  if (appState === 'start') {
    return (
      <div className={`min-h-[70vh] flex flex-col items-center justify-center ${theme.cardBg} rounded-3xl p-8 border ${theme.border} shadow-2xl`}>
        <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cyan-500/30 transform rotate-3">
          <Shield className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">Word Defender</h1>
        <p className={`text-center ${theme.textSecondary} max-w-md mb-8`}>
          Protect your base from the falling data fragments. Type the words to target and destroy them before they breach your shields.
        </p>
        
        <div className="flex gap-4 mb-8">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Crosshair className="w-5 h-5 text-cyan-500" />
            <span className={`font-medium ${theme.text}`}>Auto-Target</span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className={`font-medium ${theme.text}`}>Combos</span>
          </div>
        </div>

        <button
          onClick={startGame}
          className="px-8 py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-cyan-500/25 cursor-pointer"
        >
          Initialize Defense
        </button>
      </div>
    );
  }

  // Render Game Over Screen
  if (appState === 'gameover') {
    return (
      <div className={`min-h-[70vh] flex flex-col items-center justify-center ${theme.cardBg} rounded-3xl p-8 border ${theme.border} shadow-2xl relative overflow-hidden`}>
        <div className="absolute inset-0 bg-red-500/5 z-0"></div>
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg relative z-10 animate-bounce">
          <Shield className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-4xl font-black text-red-500 mb-2 relative z-10">Shields Breached</h1>
        <p className={`${theme.textSecondary} mb-8 relative z-10`}>Your base was overrun by data fragments.</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8 w-full max-w-sm relative z-10">
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} text-center border ${theme.border}`}>
            <div className={`text-xs uppercase tracking-wider ${theme.textSecondary} mb-1`}>Final Score</div>
            <div className={`text-2xl font-black text-cyan-500`}>{Math.round(score)}</div>
          </div>
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} text-center border ${theme.border}`}>
            <div className={`text-xs uppercase tracking-wider ${theme.textSecondary} mb-1`}>Level Reached</div>
            <div className={`text-2xl font-black text-purple-500`}>{level}</div>
          </div>
        </div>

        <div className="flex gap-4 relative z-20 mt-4">
          <button
            onClick={startGame}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 transition-all transform hover:-translate-y-1 hover:shadow-cyan-500/50 shadow-lg cursor-pointer pointer-events-auto"
          >
            <RefreshCw className="w-5 h-5" />
            Retry Defense
          </button>
        </div>
      </div>
    );
  }

  // Render Playing Screen
  return (
    <div className={`w-full h-[70vh] ${theme.cardBg} rounded-3xl border-2 ${theme.border} shadow-2xl relative overflow-hidden flex flex-col`} ref={gameAreaRef}>
      
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-10" style={{
        backgroundImage: `linear-gradient(${theme.primary.replace('bg-', '')} 1px, transparent 1px), linear-gradient(90deg, ${theme.primary.replace('bg-', '')} 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      }}></div>

      {/* Top HUD */}
      <div className="p-4 flex justify-between items-start relative z-40 bg-gradient-to-b from-black/40 to-transparent">
        <div className="flex gap-6 items-center">
          <div className={`flex flex-col`}>
            <span className={`text-xs font-bold uppercase tracking-widest text-cyan-500 mb-1`}>Score</span>
            <span className={`text-2xl font-black ${theme.text}`}>{Math.round(score)}</span>
          </div>
          <div className={`flex flex-col`}>
            <span className={`text-xs font-bold uppercase tracking-widest text-purple-500 mb-1`}>Level</span>
            <span className={`text-2xl font-black ${theme.text}`}>{level}</span>
          </div>
          {/* Health Bar (100 HP) */}
          <div className="flex flex-col ml-4">
             <span className={`text-xs font-bold uppercase tracking-widest ${health > 50 ? 'text-cyan-500' : health > 25 ? 'text-yellow-500' : 'text-red-500'} mb-1`}>Shield Integrity: {health}%</span>
             <div className="w-48 h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
               <div 
                 className={`h-full transition-all duration-300 ${health > 50 ? 'bg-cyan-500 shadow-[0_0_10px_cyan]' : health > 25 ? 'bg-yellow-500 shadow-[0_0_10px_yellow]' : 'bg-red-500 shadow-[0_0_10px_red]'}`}
                 style={{ width: `${health}%` }}
               ></div>
             </div>
          </div>
          {combo > 5 && (
            <div className={`flex flex-col animate-pulse ml-4`}>
              <span className={`text-xs font-bold uppercase tracking-widest text-yellow-500 mb-1 flex items-center gap-1`}><Zap className="w-3 h-3"/> Combo</span>
              <span className={`text-xl font-black text-yellow-500`}>{combo}x</span>
            </div>
          )}
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 relative w-full overflow-hidden">
        
        {/* Laser beams for target */}
        {targetId && words.find(w => w.id === targetId) && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none">
            <line 
              x1="50%" 
              y1="100%" 
              x2={`${words.find(w => w.id === targetId).x}%`} 
              y2={`${words.find(w => w.id === targetId).y}%`} 
              stroke="cyan" 
              strokeWidth="2" 
              className="animate-pulse opacity-50"
              style={{ filter: 'drop-shadow(0 0 5px cyan)' }}
            />
          </svg>
        )}

        {/* Explosions */}
        {explosions.map(exp => (
          <div 
            key={exp.id}
            className={`absolute rounded-full opacity-0 pointer-events-none z-20`}
            style={{
              left: `${exp.x}%`,
              top: `${exp.y}%`,
              transform: 'translate(-50%, -50%)',
              width: `${100 * exp.scale}px`,
              height: `${100 * exp.scale}px`,
              backgroundColor: exp.color,
              animation: 'explode 0.5s ease-out forwards',
              boxShadow: `0 0 20px 10px ${exp.color === 'cyan' ? 'rgba(34, 211, 238, 0.5)' : exp.color === 'purple' ? 'rgba(168,85,247,0.5)' : 'rgba(239,68,68,0.5)'}`
            }}
          />
        ))}

        {/* Enemy Lasers */}
        {lasers.map(laser => (
          <div 
            key={laser.id}
            className="absolute w-1 h-6 bg-purple-500 shadow-[0_0_10px_purple] z-10 rounded-full"
            style={{
              left: `${laser.x}%`,
              top: `${laser.y}%`,
              transform: 'translateX(-50%)',
              willChange: 'top, left'
            }}
          />
        ))}

        {/* Falling Words */}
        {words.map(word => {
          const isTarget = word.id === targetId;
          return (
            <div
              key={word.id}
              className={`absolute transform -translate-x-1/2 flex flex-col items-center justify-center z-20`}
              style={{
                left: `${word.x}%`,
                top: `${word.y}%`,
                willChange: 'top, left'
              }}
            >
              {/* Graphic based on type */}
              {word.type === 'health' ? (
                <div className={`w-8 h-8 mb-2 rounded-lg flex items-center justify-center relative ${isTarget ? 'bg-green-400 shadow-[0_0_20px_green]' : 'bg-green-600 shadow-[0_0_15px_green]'} transition-colors duration-300`}>
                  <Zap className="w-5 h-5 text-white animate-pulse" />
                </div>
              ) : word.type === 'bomb' ? (
                <div className={`w-8 h-8 mb-2 rounded-full flex items-center justify-center relative ${isTarget ? 'bg-cyan-500 shadow-[0_0_20px_cyan]' : 'bg-red-600 shadow-[0_0_15px_red]'} transition-colors duration-300`}>
                  <div className={`w-full h-full rounded-full border-[3px] ${isDarkMode ? 'border-gray-900' : 'border-white'} flex items-center justify-center overflow-hidden relative`}>
                    <div className="w-full h-1/2 bg-black/20 absolute bottom-0"></div>
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping opacity-90 relative z-10"></div>
                  </div>
                  <div className="absolute -top-2 w-3 h-3 bg-gray-600 rounded-t-sm border-t border-gray-400">
                     <div className="absolute -top-2 left-1 w-1 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_5px_orange]"></div>
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 mb-2 relative flex flex-col items-center justify-start mt-1">
                  {/* Cockpit */}
                  <div className={`w-5 h-5 rounded-t-full relative z-20 ${isTarget ? 'bg-cyan-400 shadow-[0_0_15px_cyan]' : 'bg-purple-400 shadow-[0_0_15px_purple]'} transition-colors duration-300`}>
                     <div className="absolute top-1 left-[4px] w-2.5 h-1.5 bg-white/60 rounded-full"></div>
                  </div>
                  {/* Main Wings */}
                  <div className={`absolute top-4 w-12 h-3.5 rounded-full z-10 ${isTarget ? 'bg-cyan-600' : 'bg-purple-600'} transition-colors duration-300 flex justify-between px-1 items-center shadow-lg`}>
                     <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_5px_yellow]"></div>
                     <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse delay-75 shadow-[0_0_5px_yellow]"></div>
                  </div>
                  {/* Forward Swept Wings */}
                  <div className={`absolute top-2 w-9 h-2 rounded-full z-0 ${isTarget ? 'bg-cyan-800' : 'bg-purple-800'} transition-colors duration-300`}></div>
                  {/* Laser Cannon */}
                  <div className={`w-2.5 h-3 relative z-20 ${isTarget ? 'bg-cyan-300' : 'bg-purple-300'} transition-colors duration-300 rounded-b-sm shadow-[0_2px_10px_white]`}></div>
                </div>
              )}

              {/* Text */}
              <div className={`px-2 py-1 rounded-md backdrop-blur-sm ${isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'} border ${isTarget ? 'border-cyan-500/50' : 'border-gray-500/30'} flex shadow-lg`}>
                {word.text.split('').map((char, i) => {
                  const isTyped = i < word.progress;
                  const isNext = i === word.progress && isTarget;
                  
                  return (
                    <span 
                      key={i} 
                      className={`
                        font-mono font-bold text-lg transition-colors
                        ${isTyped ? 'text-cyan-500' : ''}
                        ${isNext ? 'text-white bg-cyan-500 rounded px-[1px]' : ''}
                        ${!isTyped && !isNext ? (isDarkMode ? 'text-gray-400' : 'text-gray-600') : ''}
                      `}
                    >
                      {char}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Dome Shield inside Game Area */}
        <div 
          className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 w-[150%] max-w-[1200px] h-64 rounded-[50%] border-t-[6px] transition-all duration-300 z-10 pointer-events-none"
          style={{
            opacity: Math.max(0.1, health / 100),
            borderColor: health > 50 ? 'rgba(34,211,238,0.8)' : health > 25 ? 'rgba(234,179,8,0.8)' : 'rgba(239,68,68,0.8)',
            boxShadow: `0 -10px 40px ${health > 50 ? 'rgba(34,211,238,0.3)' : health > 25 ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)'} inset`
          }}
        >
           {/* Inner glowing pulse */}
           <div className="absolute inset-0 rounded-[50%] animate-pulse" style={{
             backgroundColor: health > 50 ? 'rgba(34,211,238,0.1)' : health > 25 ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)'
           }}></div>
        </div>

        {/* Base Turret inside Game Area */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-16 bg-gray-800 rounded-t-xl border-t-4 border-x-2 border-cyan-500 shadow-[0_0_30px_cyan] flex justify-center items-end pb-3 z-30 pointer-events-none">
            <Crosshair className="w-8 h-8 text-cyan-400 animate-pulse" />
        </div>

        <style>{`
          @keyframes explode {
            0% { transform: translate(-50%, -50%) scale(0.1); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default WordDefenderGame;
