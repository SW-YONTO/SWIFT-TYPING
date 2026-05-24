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

// Boss-exclusive 8-10 letter words
const BOSS_WORD_BANK = [
  "destroyer", "overlords", "dominance", "annihilate", "blackhole",
  "obliterate", "singularity", "cataclysm", "dreadnought", "devastator",
  "behemoth", "warlords", "commander", "onslaught", "colossus",
  "juggernaut", "celestial", "judgement", "armageddon", "extinction"
];

// Tank/Station boss — 10-14 letter words (heavy, no shooting)
const TANK_WORD_BANK = [
  "intergalactic", "battlecruiser", "gravitational", "invulnerable",
  "indestructible", "annihilator", "deathbringer", "thunderstrike",
  "mothership", "devastation", "supermassive", "constellation",
  "starfortress", "darkmatter", "supercharged", "spacewalker",
  "impenetrable", "unstoppable", "obliteration", "dreadfortress"
];

// Bolt buff — short punchy words (easier to type for a reward)
const BOLT_WORDS = [
  "surge", "zap", "volt", "flash", "spark", "shock", "burst", "pulse"
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
  const [sweepLasers, setSweepLasers] = useState([]); // Electric bolt sweep beams
  
  // Boss
  const [bossWarning, setBossWarning] = useState(false);

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

  // Health drop throttle refs
  const lastHealthDropTimeRef = useRef(-Infinity); // timestamp of last health drop spawn
  const healthDropCountRef = useRef(0);            // how many health drops spawned this level
  const levelRef = useRef(1);                      // mirrors `level` for use inside game loop

  // Boss throttle refs
  const nextBossTimeRef = useRef(0);        // earliest timestamp a boss can spawn
  const bossActiveRef = useRef(false);      // true while a boss word is on screen
  const bossHealthDropTimeRef = useRef(0);  // timestamp to auto-spawn a health drop after boss arrives
  const bossBoltDropTimeRef = useRef(0);    // timestamp to auto-spawn a bolt drop after boss arrives

  // Tank boss refs
  const nextTankTimeRef = useRef(0);        // earliest timestamp a tank boss can spawn
  const tankActiveRef = useRef(false);      // true while a tank is on screen

  // Bolt buff refs
  const lastBoltDropTimeRef = useRef(-Infinity); // timestamp of last bolt drop
  const boltDropCountRef = useRef(0);            // bolt drops spawned this level

  // Health mirror ref (for use inside game-loop callbacks)
  const healthRef = useRef(100);

  // Sync refs with state
  useEffect(() => { wordsRef.current = words; }, [words]);
  useEffect(() => { lasersRef.current = lasers; }, [lasers]);
  useEffect(() => { targetIdRef.current = targetId; }, [targetId]);
  useEffect(() => { explosionsRef.current = explosions; }, [explosions]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { healthRef.current = health; }, [health]);

  // Helper to spawn a word
  const spawnWord = useCallback((timestamp) => {
    const wordText = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
    const xPos = 10 + Math.random() * 80; // 10% to 90%
    
    // We want words to take about 10-15 seconds to reach the bottom (100%)
    // Speed is % per millisecond. 100% / 12000ms = ~0.008% per ms
    const baseSpeed = 0.006;
    const speed = baseSpeed + (levelRef.current * 0.0005) + (Math.random() * 0.003); 
    
    // ── Health-drop throttle (dynamic: shorter cooldown + higher chance at low HP/high level) ──
    const curHP = healthRef.current;
    const isLowHP = curHP < 40 && levelRef.current >= 2;
    const isMidHP = curHP < 65 && levelRef.current >= 3;
    const isHighLevel = levelRef.current >= 9; // Late game is brutal, need more health
    
    const HEALTH_COOLDOWN_MS = isHighLevel ? 8_000 : (isLowHP ? 12_000 : isMidHP ? 20_000 : 30_000);
    const healthChanceThreshold = isHighLevel ? 0.60 : (isLowHP ? 0.78 : isMidHP ? 0.84 : 0.90); 
    const maxHealthDropsThisLevel = isHighLevel ? 15 : 1 + levelRef.current;
    
    const timeSinceLast = timestamp - lastHealthDropTimeRef.current;
    const canSpawnHealth =
      timeSinceLast >= HEALTH_COOLDOWN_MS &&
      healthDropCountRef.current < maxHealthDropsThisLevel;
    // ────────────────────────────────────────────────────────────────────────

    // ── Bolt-drop throttle (level 5+, 30s gap, resets each level) ──
    const BOLT_COOLDOWN_MS = 30_000;
    const maxBoltsThisLevel = levelRef.current >= 8 ? 4 : 2; // Drop even more at 8+
    const boltTimeSinceLast = timestamp - lastBoltDropTimeRef.current;
    const canSpawnBolt =
      levelRef.current >= 5 &&
      boltTimeSinceLast >= BOLT_COOLDOWN_MS &&
      boltDropCountRef.current < maxBoltsThisLevel;
    // ─────────────────────────────────────────────────────────────────────────

    let type = 'bomb';
    const rand = Math.random();
    // 30% chance to drop at level 5, 60% chance to drop at level 8+ once cooldown is met
    const boltChance = levelRef.current >= 8 ? 0.4 : 0.7; 
    const shipChance = levelRef.current >= 9 ? 0.4 : 0.6; // More ships, fewer bombs at level 9+

    if (rand > boltChance && canSpawnBolt) {
      type = 'bolt';
      lastBoltDropTimeRef.current = timestamp;
      boltDropCountRef.current += 1;
    } else if (rand > healthChanceThreshold && canSpawnHealth) {
      type = 'health';
      lastHealthDropTimeRef.current = timestamp;
      healthDropCountRef.current += 1;
    } else if (rand > shipChance) {
      type = 'ship'; // Ships instead of bombs
    }

    // Override text for bolt drops
    const finalText = type === 'bolt'
      ? BOLT_WORDS[Math.floor(Math.random() * BOLT_WORDS.length)]
      : wordText;

    return {
      id: `word_${timestamp}_${Math.random()}`,
      text: finalText,
      progress: 0,
      x: xPos,
      y: -5,
      speed: type === 'health' ? speed * 1.2 : type === 'bolt' ? speed * 0.9 : speed,
      type: type,
      lastShootTime: timestamp + 1500 + Math.random() * 1000
    };
  }, []);

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
    // Reset health-drop throttle
    lastHealthDropTimeRef.current = -Infinity;
    healthDropCountRef.current = 0;
    levelRef.current = 1;
    // Reset boss throttle
    nextBossTimeRef.current = 0;
    bossActiveRef.current = false;
    bossHealthDropTimeRef.current = 0;
    bossBoltDropTimeRef.current = 0;
    setBossWarning(false);
    // Reset tank throttle
    nextTankTimeRef.current = 0;
    tankActiveRef.current = false;
    // Reset bolt throttle
    lastBoltDropTimeRef.current = -Infinity;
    boltDropCountRef.current = 0;
    // Reset health mirror
    healthRef.current = 100;
    setSweepLasers([]);
    setAppState('playing');
    lastTimeRef.current = null;
    nextSpawnTimeRef.current = 0;
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

    // ── Pre-Boss Spawn Pause (Level 9+) ─────────────────────────────────────
    // Give the player 5 seconds of no new spawns to clear the board before a boss
    const timeUntilBoss = nextBossTimeRef.current > 0 ? nextBossTimeRef.current - timestamp : Infinity;
    const timeUntilTank = nextTankTimeRef.current > 0 ? nextTankTimeRef.current - timestamp : Infinity;
    const bossImminent = levelRef.current >= 9 && ((timeUntilBoss > 0 && timeUntilBoss < 5000) || (timeUntilTank > 0 && timeUntilTank < 5000));

    // Spawn words
    if (timestamp > nextSpawnTimeRef.current && !bossImminent) {
      const newWord = spawnWord(timestamp);
      currentWords.push(newWord);
      stateChanged = true;
      // Decrease spawn interval as level increases (cap at 1.5s max speed so it doesn't get crazy)
      const spawnInterval = Math.max(1500, 3000 - (level * 150));
      nextSpawnTimeRef.current = timestamp + spawnInterval + (Math.random() * 500);
    }

    // ── Boss spawn ───────────────────────────────────────────────────────────
    // First boss available after 60 s; subsequent bosses every 60 s after kill.
    // Boss only appears from level 2 onwards and only one at a time.
    if (
      levelRef.current >= 2 &&
      !bossActiveRef.current &&
      nextBossTimeRef.current > 0 &&        // 0 means "not yet initialised"
      timestamp >= nextBossTimeRef.current
    ) {
      // Pick an 8-10 letter boss word
      const bossText = BOSS_WORD_BANK[Math.floor(Math.random() * BOSS_WORD_BANK.length)];
      const bossSpeed = 0.003 + (levelRef.current * 0.0002); // very slow
      const bossWord = {
        id: `boss_${timestamp}_${Math.random()}`,
        text: bossText,
        progress: 0,
        x: 20 + Math.random() * 60, // center-ish
        y: -8,
        speed: bossSpeed,
        type: 'boss',
        lastShootTime: timestamp + 800,
        shootCooldown: Math.max(800, 1000 - (levelRef.current - 2) * 25),
      };
      currentWords.push(bossWord);
      bossActiveRef.current = true;
      stateChanged = true;
      // Queue guaranteed drops to help the player
      bossHealthDropTimeRef.current = timestamp + 10_000;
      bossBoltDropTimeRef.current = timestamp + 7_000;
      // Show warning banner for 3 s then hide
      setBossWarning(true);
      setTimeout(() => setBossWarning(false), 3000);
    }

    // ── Boss-triggered health drop ─────────────────────────────────────────
    if (bossHealthDropTimeRef.current > 0 && timestamp >= bossHealthDropTimeRef.current) {
      bossHealthDropTimeRef.current = 0;
      const spd = 0.006 + (levelRef.current * 0.0005);
      currentWords.push({
        id: `healthbonus_${timestamp}_${Math.random()}`,
        text: WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)],
        progress: 0, x: 15 + Math.random() * 70, y: -5,
        speed: spd * 1.2, type: 'health', lastShootTime: Infinity
      });
      stateChanged = true;
    }

    // ── Boss-triggered bolt drop ───────────────────────────────────────────
    if (bossBoltDropTimeRef.current > 0 && timestamp >= bossBoltDropTimeRef.current) {
      bossBoltDropTimeRef.current = 0;
      const spd = 0.006 + (levelRef.current * 0.0005);
      currentWords.push({
        id: `boltbonus_${timestamp}_${Math.random()}`,
        text: BOLT_WORDS[Math.floor(Math.random() * BOLT_WORDS.length)],
        progress: 0, x: 15 + Math.random() * 70, y: -5,
        speed: spd * 0.9, type: 'bolt', lastShootTime: Infinity
      });
      stateChanged = true;
    }

    // ── Tank boss spawn (level 3+, every 90s, one at a time) ──────────────
    if (
      levelRef.current >= 3 &&
      !tankActiveRef.current &&
      nextTankTimeRef.current > 0 &&
      timestamp >= nextTankTimeRef.current
    ) {
      const tankText = TANK_WORD_BANK[Math.floor(Math.random() * TANK_WORD_BANK.length)];
      const tankSpeed = 0.0018 + (levelRef.current * 0.0001); // very slow
      currentWords.push({
        id: `tank_${timestamp}_${Math.random()}`,
        text: tankText, progress: 0,
        x: 15 + Math.random() * 70, y: -10,
        speed: tankSpeed, type: 'tank',
        lastShootTime: Infinity // tanks never shoot
      });
      tankActiveRef.current = true;
      stateChanged = true;
      // Queue guaranteed drops for Tank as well
      bossHealthDropTimeRef.current = timestamp + 10_000;
      bossBoltDropTimeRef.current = timestamp + 7_000;
    }

    // Initialise timers once after game starts
    if (nextBossTimeRef.current === 0 && timestamp > 0) {
      nextBossTimeRef.current = timestamp + 60_000;
    }
    if (nextTankTimeRef.current === 0 && timestamp > 0) {
      nextTankTimeRef.current = timestamp + 90_000;
    }
    // ─────────────────────────────────────────────────────────────────────────

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
          speed: 0.04,
          isBoss: false
        });
        // Ships fire faster at higher levels
        const shipFireRate = Math.max(1200, 2500 - (levelRef.current * 150));
        word.lastShootTime = timestamp + shipFireRate;
        lasersChanged = true;
      }

      // Boss triple-laser salvo
      if (word.type === 'boss' && timestamp > word.lastShootTime) {
        [-4, 0, 4].forEach(offset => {
          currentLasers.push({
            id: `bosslaser_${Math.random()}`,
            x: word.x + offset,
            y: word.y,
            speed: 0.055,
            isBoss: true
          });
        });
        word.lastShootTime = timestamp + word.shootCooldown;
        lasersChanged = true;
      }

      // Check if word hit the bottom (base)
      if (word.y >= 90) {
        if (word.type === 'health' || word.type === 'bolt') {
          // Pickups just disappear harmlessly
          createExplosion(word.x, 90, 0.5, word.type === 'bolt' ? 'yellow' : 'green');
        } else if (word.type === 'boss') {
          healthLost += 35;
          createExplosion(word.x, 90, 3, 'orange');
          soundEffects.playError();
          bossActiveRef.current = false;
          nextBossTimeRef.current = timestamp + 60_000;
        } else if (word.type === 'tank') {
          healthLost += 40; // Tank ram — brutal
          createExplosion(word.x, 90, 3.5, 'gray');
          createExplosion(word.x - 6, 88, 2, 'red');
          createExplosion(word.x + 6, 88, 2, 'red');
          soundEffects.playError();
          tankActiveRef.current = false;
          nextTankTimeRef.current = timestamp + 90_000;
        } else {
          healthLost += 20;
          createExplosion(word.x, 90, 1.5, 'red');
          soundEffects.playError();
        }
        
        currentWords.splice(i, 1);
        
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
        // Boss lasers deal 5 HP each (3/salvo = 15 HP = ~15-19 HP/s); ship lasers deal 5 HP
        healthLost += laser.isBoss ? 5 : 5;
        createExplosion(laser.x, 90, 0.5, laser.isBoss ? 'orange' : 'purple');
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

              if (word.type === 'boss') {
                createExplosion(word.x, word.y, 3, 'orange');
                createExplosion(word.x - 5, word.y + 5, 2, 'red');
                createExplosion(word.x + 5, word.y - 5, 2, 'yellow');
                setScore(s => s + word.text.length * 50 * (1 + Math.floor(combo / 10) * 0.5));
                bossActiveRef.current = false;
                nextBossTimeRef.current = performance.now() + 60_000;
              } else if (word.type === 'tank') {
                // Tank death — massive multi-explosion
                [0, -8, 8, -4, 4].forEach((ox, i) => {
                  setTimeout(() => createExplosion(word.x + ox, word.y + (i % 2 === 0 ? 0 : 5), 2.5, i % 2 === 0 ? 'gray' : 'red'), i * 80);
                });
                setScore(s => s + word.text.length * 80 * (1 + Math.floor(combo / 10) * 0.5));
                tankActiveRef.current = false;
                nextTankTimeRef.current = performance.now() + 90_000;
              } else if (word.type === 'bolt') {
                // ⚡ ELECTRIC BOLT — sweep all enemies!
                createExplosion(word.x, word.y, 2, 'blue');
                setScore(s => s + 500); // flat bonus
                // Collect all destructible enemy positions
                const targets = currentWords
                  .filter(w => w.id !== word.id && !['health','bolt'].includes(w.type));
                // Draw sweep laser lines from turret to each target
                const beams = targets.map(t => ({ id: `beam_${Math.random()}`, x2: t.x, y2: t.y }));
                setSweepLasers(beams);
                setTimeout(() => setSweepLasers([]), 600);
                // Destroy all enemies with staggered explosions
                targets.forEach((t, idx) => {
                  setTimeout(() => {
                    createExplosion(t.x, t.y, 2, 'blue');
                    createExplosion(t.x, t.y, 1.5, 'cyan');
                    if (t.type === 'boss') { bossActiveRef.current = false; nextBossTimeRef.current = performance.now() + 60_000; }
                    if (t.type === 'tank') { tankActiveRef.current = false; nextTankTimeRef.current = performance.now() + 90_000; }
                  }, idx * 60);
                });
                // Remove all those enemies from currentWords array immediately so they aren't processed further
                const targetIds = new Set(targets.map(t => t.id));
                const remaining = currentWords.filter(w => !targetIds.has(w.id));
                currentWords.length = 0; // clear
                currentWords.push(...remaining); // refill with only alive words
                // Score bonus per enemy cleared
                setScore(s => s + targets.length * 30);
              } else {
                createExplosion(word.x, word.y);
                setScore(s => s + word.text.length * 10 * (1 + Math.floor(combo / 10) * 0.5));
              }

              setCombo(c => c + 1);
              
              if (word.type === 'health') {
                 setHealth(prev => { const n = Math.min(100, prev + 30); healthRef.current = n; return n; });
                 createExplosion(word.x, word.y, 2, 'green');
              }

              setTargetId(null);
              targetIdRef.current = null;
              
              // Safe splice by re-finding index in case currentWords array changed (e.g. from bolt clear)
              const newIndex = currentWords.findIndex(w => w.id === word.id);
              if (newIndex !== -1) {
                currentWords.splice(newIndex, 1);
              }
              
              // Level up logic
              setScore(currentScore => {
                const newLevel = Math.floor(currentScore / 500) + 1;
                if (newLevel > levelRef.current) {
                  setLevel(newLevel);
                  levelRef.current = newLevel;
                  // Reset drop counts so each level gets its own fresh allowance
                  healthDropCountRef.current = 0;
                  boltDropCountRef.current = 0;
                }
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
              x1="50%" y1="100%" 
              x2={`${words.find(w => w.id === targetId).x}%`} 
              y2={`${words.find(w => w.id === targetId).y}%`} 
              stroke="cyan" strokeWidth="2" 
              className="animate-pulse opacity-50"
              style={{ filter: 'drop-shadow(0 0 5px cyan)' }}
            />
          </svg>
        )}

        {/* ⚡ Electric Bolt Sweep Lasers */}
        {sweepLasers.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-40" preserveAspectRatio="none">
            {sweepLasers.map(sl => (
              <line
                key={sl.id}
                x1="50%" y1="100%"
                x2={`${sl.x2}%`} y2={`${sl.y2}%`}
                stroke="#3b82f6"
                strokeWidth="3"
                style={{
                  opacity: 0.95,
                  filter: 'drop-shadow(0 0 10px #3b82f6) drop-shadow(0 0 20px #60a5fa)',
                  animation: 'sweepFade 0.6s ease-out forwards'
                }}
              />
            ))}
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
            className={`absolute z-10 rounded-full ${
              laser.isBoss
                ? 'w-1.5 h-8 bg-orange-400 shadow-[0_0_12px_4px_rgba(251,146,60,0.8)]'
                : 'w-1 h-6 bg-purple-500 shadow-[0_0_10px_purple]'
            }`}
            style={{
              left: `${laser.x}%`,
              top: `${laser.y}%`,
              transform: 'translateX(-50%)',
              willChange: 'top, left'
            }}
          />
        ))}

        {/* Boss Warning Banner */}
        {bossWarning && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-xl font-black text-sm uppercase tracking-widest text-orange-300 bg-orange-900/80 border border-orange-500 shadow-[0_0_20px_rgba(251,146,60,0.6)] animate-pulse pointer-events-none">
            ⚠ BOSS INCOMING ⚠
          </div>
        )}

        {/* Falling Words */}
        {words.map(word => {
          const isTarget = word.id === targetId;
          const isBoss = word.type === 'boss';
          const isTank = word.type === 'tank';
          const isBolt = word.type === 'bolt';
          return (
            <div
              key={word.id}
              className={`absolute transform -translate-x-1/2 flex flex-col items-center justify-center ${
                isBoss ? 'z-25' : 'z-20'
              }`}
              style={{
                left: `${word.x}%`,
                top: `${word.y}%`,
                willChange: 'top, left'
              }}
            >
              {/* Graphic based on type */}
              {word.type === 'bolt' ? (
                /* ⚡ ELECTRIC BOLT BUFF */
                <div className="mb-2 relative flex items-center justify-center" style={{ width: 44, height: 44 }}>
                  <div className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: 'rgba(59,130,246,0.25)' }} />
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                    isTarget ? 'bg-blue-400 shadow-[0_0_30px_15px_rgba(59,130,246,0.8)]' : 'bg-blue-600 shadow-[0_0_20px_10px_rgba(59,130,246,0.5)]'
                  } transition-all duration-300`}>
                    <Zap className="w-6 h-6 text-white" style={{ filter: 'drop-shadow(0 0 4px white)' }} />
                  </div>
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest text-blue-300 whitespace-nowrap">⚡ BOLT ⚡</div>
                </div>
              ) : word.type === 'health' ? (
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
              ) : word.type === 'boss' ? (
                /* ── MINI BOSS SHIP ────────────────────────────────────── */
                <div className="mb-2 relative flex flex-col items-center" style={{ width: 72, height: 80 }}>
                  {/* Outer glow ring */}
                  <div
                    className="absolute inset-0 rounded-full animate-pulse pointer-events-none"
                    style={{
                      boxShadow: isTarget
                        ? '0 0 40px 15px rgba(251,146,60,0.6), 0 0 80px 30px rgba(239,68,68,0.3)'
                        : '0 0 30px 10px rgba(239,68,68,0.5), 0 0 60px 20px rgba(251,146,60,0.2)'
                    }}
                  />
                  {/* Command Bridge */}
                  <div
                    className={`w-10 h-8 rounded-t-full relative z-20 flex items-end justify-center pb-1 ${
                      isTarget ? 'bg-orange-400' : 'bg-red-700'
                    } transition-colors duration-300`}
                    style={{ boxShadow: isTarget ? '0 0 20px rgba(251,146,60,0.9)' : '0 0 15px rgba(239,68,68,0.7)' }}
                  >
                    {/* Viewport slit */}
                    <div className="w-7 h-2 bg-red-200/30 rounded-full border border-red-300/50" />
                    {/* Side guns on bridge */}
                    <div className="absolute -left-3 top-3 w-3 h-1.5 bg-gray-600 rounded-l-full" />
                    <div className="absolute -right-3 top-3 w-3 h-1.5 bg-gray-600 rounded-r-full" />
                  </div>
                  {/* Main hull */}
                  <div
                    className={`w-16 h-10 relative z-10 flex items-center justify-center ${
                      isTarget ? 'bg-orange-600' : 'bg-red-900'
                    } transition-colors duration-300`}
                    style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)' }}
                  >
                    {/* Engine vents */}
                    <div className="flex gap-2">
                      <div className="w-2 h-4 bg-orange-300/60 rounded-sm animate-pulse" />
                      <div className="w-2 h-4 bg-orange-300/60 rounded-sm animate-pulse delay-75" />
                      <div className="w-2 h-4 bg-orange-300/60 rounded-sm animate-pulse delay-150" />
                    </div>
                  </div>
                  {/* Swept wings */}
                  <div
                    className={`absolute top-6 z-0 ${
                      isTarget ? 'bg-orange-700' : 'bg-red-800'
                    } transition-colors duration-300`}
                    style={{ width: 72, height: 20, clipPath: 'polygon(0% 100%, 15% 0%, 85% 0%, 100% 100%)' }}
                  >
                    {/* Wing cannons */}
                    <div className="absolute bottom-0 left-2 w-1.5 h-3 bg-gray-400 rounded-b-sm" />
                    <div className="absolute bottom-0 right-2 w-1.5 h-3 bg-gray-400 rounded-b-sm" />
                  </div>
                  {/* Triple cannon array */}
                  <div className="flex gap-1.5 mt-1 z-20 relative">
                    <div className={`w-1.5 h-5 rounded-b-sm ${ isTarget ? 'bg-orange-300' : 'bg-red-400'} shadow-[0_4px_8px_rgba(251,146,60,0.8)]`} />
                    <div className={`w-2 h-6 rounded-b-sm ${ isTarget ? 'bg-orange-200' : 'bg-red-300'} shadow-[0_4px_12px_rgba(251,146,60,1)]`} />
                    <div className={`w-1.5 h-5 rounded-b-sm ${ isTarget ? 'bg-orange-300' : 'bg-red-400'} shadow-[0_4px_8px_rgba(251,146,60,0.8)]`} />
                  </div>
                  {/* Boss HP bar (remaining letters) */}
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-16 h-2 bg-gray-800 rounded-full overflow-hidden border border-red-700">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-150"
                      style={{ width: `${((word.text.length - word.progress) / word.text.length) * 100}%` }}
                    />
                  </div>
                  {/* BOSS label */}
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase tracking-widest text-orange-400 whitespace-nowrap">
                    ★ MINI BOSS ★
                  </div>
                </div>
              ) : word.type === 'tank' ? (
                /* ⬛ HEAVY TANK / BATTLE STATION */
                <div className="mb-2 relative flex flex-col items-center" style={{ width: 96, height: 70 }}>
                  {/* Outer threat glow */}
                  <div className="absolute inset-0 pointer-events-none animate-pulse" style={{
                    boxShadow: isTarget
                      ? '0 0 50px 20px rgba(156,163,175,0.5), 0 0 100px 40px rgba(239,68,68,0.2)'
                      : '0 0 30px 12px rgba(107,114,128,0.4)'
                  }} />
                  {/* Top command turret */}
                  <div className={`w-8 h-5 rounded-t-md relative z-20 flex items-center justify-center ${
                    isTarget ? 'bg-gray-300' : 'bg-gray-500'
                  } transition-colors duration-300`}>
                    <div className="w-6 h-1.5 bg-gray-700/60 rounded-full" />
                    {/* Side sensor pods */}
                    <div className="absolute -left-2 top-1 w-2 h-1 bg-gray-600 rounded-l-sm" />
                    <div className="absolute -right-2 top-1 w-2 h-1 bg-gray-600 rounded-r-sm" />
                  </div>
                  {/* Main body — wide flat hull */}
                  <div className={`w-24 h-8 relative z-10 flex items-center justify-around px-2 ${
                    isTarget ? 'bg-gray-400' : 'bg-gray-700'
                  } transition-colors duration-300`}>
                    {/* Armour plating lines */}
                    <div className="absolute inset-0 flex flex-col justify-around pointer-events-none">
                      <div className="w-full h-[1px] bg-gray-500/40" />
                      <div className="w-full h-[1px] bg-gray-500/40" />
                    </div>
                    {/* Viewport slots */}
                    {[0,1,2].map(i => (
                      <div key={i} className={`w-3 h-2 rounded-sm ${
                        isTarget ? 'bg-red-400/70' : 'bg-red-800/60'
                      } animate-pulse`} style={{ animationDelay: `${i*150}ms` }} />
                    ))}
                  </div>
                  {/* Bottom thruster bank */}
                  <div className={`w-20 h-4 relative z-0 flex items-center justify-around px-2 ${
                    isTarget ? 'bg-gray-500' : 'bg-gray-800'
                  } transition-colors duration-300`} style={{ clipPath: 'polygon(5% 0%,95% 0%,100% 100%,0% 100%)' }}>
                    {[0,1,2,3].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-orange-500/70 animate-pulse" style={{ animationDelay: `${i*100}ms` }} />
                    ))}
                  </div>
                  {/* HP bar */}
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-20 h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-500">
                    <div className="h-full bg-gradient-to-r from-gray-400 to-gray-300 transition-all duration-150"
                      style={{ width: `${((word.text.length - word.progress) / word.text.length) * 100}%` }} />
                  </div>
                  {/* Label */}
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest text-gray-300 whitespace-nowrap">⬛ HEAVY TANK ⬛</div>
                </div>
              ) : (
                /* Regular ship */
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
              <div className={`px-2 py-1 rounded-md backdrop-blur-sm border flex shadow-lg ${
                isBoss
                  ? `${isDarkMode ? 'bg-red-950/90' : 'bg-red-100/90'} ${isTarget ? 'border-orange-400/70' : 'border-red-600/50'}`
                  : isTank
                  ? `${isDarkMode ? 'bg-gray-900/90' : 'bg-gray-200/90'} ${isTarget ? 'border-gray-300/80' : 'border-gray-600/50'}`
                  : isBolt
                  ? `bg-blue-950/90 ${isTarget ? 'border-blue-300/80' : 'border-blue-600/50'}`
                  : `${isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'} ${isTarget ? 'border-cyan-500/50' : 'border-gray-500/30'}`
              }`}>
                {word.text.split('').map((char, i) => {
                  const isTyped = i < word.progress;
                  const isNext = i === word.progress && isTarget;
                  return (
                    <span key={i} className={`
                      font-mono font-bold transition-colors
                      ${isBoss || isTank ? 'text-xl' : isBolt ? 'text-lg' : 'text-lg'}
                      ${isTyped ? (isBoss ? 'text-orange-400' : isTank ? 'text-gray-300' : isBolt ? 'text-blue-300' : 'text-cyan-500') : ''}
                      ${isNext ? (isBoss ? 'text-white bg-orange-500 rounded px-[1px]' : isTank ? 'text-black bg-gray-300 rounded px-[1px]' : isBolt ? 'text-white bg-blue-500 rounded px-[1px]' : 'text-white bg-cyan-500 rounded px-[1px]') : ''}
                      ${!isTyped && !isNext ? (isBoss ? 'text-red-300' : isTank ? (isDarkMode ? 'text-gray-400' : 'text-gray-500') : isBolt ? 'text-blue-400' : (isDarkMode ? 'text-gray-400' : 'text-gray-600')) : ''}
                    `}>{char}</span>
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
          @keyframes bossShake {
            0%, 100% { transform: translate(-50%, 0) rotate(0deg); }
            25% { transform: translate(-48%, 0) rotate(-1deg); }
            75% { transform: translate(-52%, 0) rotate(1deg); }
          }
          @keyframes sweepFade {
            0% { opacity: 1; stroke-width: 4; }
            60% { opacity: 0.8; stroke-width: 6; }
            100% { opacity: 0; stroke-width: 1; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default WordDefenderGame;
