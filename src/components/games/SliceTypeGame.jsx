import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { playSound } from '../../utils/soundEffects';
import { progressManager } from '../../utils/storage';
import { Swords, Heart, RefreshCw, Trophy, Star, Volume2, VolumeX, Play, RotateCcw, Pause, X } from 'lucide-react';

// ─── Word Pools ─────────────────────────────────────────────────────────────
const WORD_POOLS = {
  easy: ['cut', 'slice', 'ninja', 'slash', 'blade', 'sword', 'fast', 'quick', 'sharp', 'dash', 'steel', 'glowing'],
  medium: ['katana', 'shuriken', 'reflex', 'precise', 'kinetic', 'cyber', 'neon', 'shadow', 'warrior', 'chopping', 'phantom', 'warrior'],
  hard: ['execution', 'assassination', 'shattering', 'obliterate', 'decimation', 'trajectory', 'equilibrium', 'centrifugal', 'gravitational']
};

const BOMB_WORDS = ['BOOM', 'BOMB', 'DANGER', 'EXPLODE', 'TRAP'];

// ─── Custom Synth Sound FX (Web Audio API) ──────────────────────────────────
class SliceSynth {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  playSwoosh() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      // Quick pitch sweep downward for swoosh
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {
      console.warn(e);
    }
  }
  playSlice() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const noiseNode = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.15);
      
      noiseNode.gain.setValueAtTime(0.12, this.ctx.currentTime);
      noiseNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc.connect(noiseNode);
      noiseNode.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {
      console.warn(e);
    }
  }
  playExplosion() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn(e);
    }
  }
  playGlitch() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {
      console.warn(e);
    }
  }
}
const synth = new SliceSynth();

const SliceTypeGame = ({ currentUser }) => {
  const { theme } = useTheme();

  // ─── States ────────────────────────────────────────────────────────────────
  const [gameState, setGameState] = useState('title'); // title | playing | gameover
  const [difficulty, setDifficulty] = useState('medium');
  const [score, setScore] = useState(0);
  const [combo, setScoreCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [highScores, setHighScores] = useState({ easy: 0, medium: 0, hard: 0 });
  const [paused, setPaused] = useState(false);
  const [slicedCount, setSlicedCount] = useState(0);
  const [isHighScore, setIsHighScore] = useState(false);

  // ─── Refs ──────────────────────────────────────────────────────────────────
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const invisibleInputRef = useRef(null);

  // High performance visual/physical arrays tracked in refs to run outside React state loops
  const flyingWordsRef = useRef([]);      // active items flying in arcs
  const splitFragmentsRef = useRef([]);  // gravity/rotational splits of words cut in half
  const particlesRef = useRef([]);       // spark visual bursts
  const slashTrailsRef = useRef([]);     // sword slice overlay lines
  const targetedWordIdRef = useRef(null);
  const comboTimerRef = useRef(0);
  const freezeTimerRef = useRef(0);      // slow motion duration
  const doublePointsTimerRef = useRef(0); // furious duration
  const spawnTimerRef = useRef(0);
  const statsRef = useRef({ keysTyped: 0, correctKeys: 0 });
  const slicedCountRef = useRef(0);

  // Sync slicedCount ref
  useEffect(() => { slicedCountRef.current = slicedCount; }, [slicedCount]);

  // Mirror state refs to keep the game loop perfectly stable
  const gameStateRef = useRef(gameState);
  const pausedRef = useRef(paused);
  const difficultyRef = useRef(difficulty);
  const soundEnabledRef = useRef(soundEnabled);
  const comboRef = useRef(combo);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);
  useEffect(() => { comboRef.current = combo; }, [combo]);

  // ─── Local Storage High Scores ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem('slice_type_high_scores');
      if (stored) setHighScores(JSON.parse(stored));
    } catch (e) {
      console.warn('Could not load high scores', e);
    }
  }, []);

  const saveScore = (finalScore) => {
    const key = 'slice_type_high_scores';
    const currentHigh = highScores[difficulty] || 0;
    if (finalScore > currentHigh) {
      const updated = { ...highScores, [difficulty]: finalScore };
      setHighScores(updated);
      setIsHighScore(true);
      try {
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save high score', e);
      }
      return true;
    }
    setIsHighScore(false);
    return false;
  };

  // ─── Ctrl+R restart hotkey ───────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        if (gameStateRef.current !== 'title') {
          e.preventDefault();
          e.stopPropagation();
          startNewGame();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);

  // ─── Parabolic Physics Spawner ─────────────────────────────────────────────
  const spawnFlyingWord = useCallback(() => {
    const isBomb = Math.random() < 0.15;
    const isFreeze = !isBomb && Math.random() < 0.08;
    const isFurious = !isBomb && !isFreeze && Math.random() < 0.08;

    let word = '';
    let color = '#ec4899'; // standard hot pink
    let type = 'normal';

    const currentDiff = difficultyRef.current;

    if (isBomb) {
      word = getRandom(BOMB_WORDS);
      color = '#ef4444'; // bomb red
      type = 'bomb';
    } else if (isFreeze) {
      word = getRandom(WORD_POOLS.easy);
      color = '#3b82f6'; // ice blue
      type = 'freeze';
    } else if (isFurious) {
      word = getRandom(WORD_POOLS.medium);
      color = '#f97316'; // furious orange
      type = 'furious';
    } else {
      const curSliced = slicedCountRef.current;
      let pool = WORD_POOLS.easy;

      if (currentDiff === 'easy') {
        pool = WORD_POOLS.easy;
      } else if (currentDiff === 'medium') {
        if (curSliced >= 8) {
          pool = Math.random() < 0.65 ? WORD_POOLS.medium : WORD_POOLS.easy;
        } else {
          pool = WORD_POOLS.easy;
        }
      } else if (currentDiff === 'hard') {
        if (curSliced >= 16) {
          pool = Math.random() < 0.60 ? WORD_POOLS.hard : Math.random() < 0.70 ? WORD_POOLS.medium : WORD_POOLS.easy;
        } else if (curSliced >= 6) {
          pool = Math.random() < 0.70 ? WORD_POOLS.medium : WORD_POOLS.easy;
        } else {
          pool = WORD_POOLS.easy;
        }
      }
      word = getRandom(pool);
    }

    // Physics starting parameters
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 800;
    const height = canvas ? canvas.height : 360;

    // Strict Limit of active words on screen progressively so player is not overwhelmed
    let maxActiveWords = 1;
    const curSliced = slicedCountRef.current;
    if (curSliced >= 15) maxActiveWords = 3;
    else if (curSliced >= 5) maxActiveWords = 2;

    if (flyingWordsRef.current.length >= maxActiveWords) {
      return;
    }

    const x = 100 + Math.random() * (width - 200);
    const y = height + 20;

    // Launch speed and angle - EVEN lower forces to float extremely slowly and stay on screen
    const baseForce = 4.8 + Math.random() * 1.2;
    const angle = Math.PI / 2.6 + Math.random() * (Math.PI / 8); // gentler upwards angle

    flyingWordsRef.current.push({
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      vx: Math.cos(angle) * baseForce * (x < width / 2 ? 0.7 : -0.7),
      vy: -Math.sin(angle) * baseForce,
      word,
      originalWord: word,
      type,
      color,
      typedIndex: 0,
      width: 0, // calculated during canvas draw
    });
  }, []);

  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // ─── Exploding Spark Particles Generator ──────────────────────────────────
  const spawnSliceParticles = (x, y, color) => {
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 1.5 + Math.random() * 2.5,
        alpha: 1,
        decay: 0.03 + Math.random() * 0.03,
        color
      });
    }
  };

  // ─── Sword Trail Swipe Visuals ─────────────────────────────────────────────
  const registerSlashTrail = (startX, startY, endX, endY, color) => {
    slashTrailsRef.current.push({
      x1: startX,
      y1: startY,
      x2: endX,
      y2: endY,
      alpha: 1,
      decay: 0.08,
      color
    });
  };

  // ─── Slice Trigger Physics Splitting ───────────────────────────────────────
  const sliceWord = useCallback((wordObj) => {
    // Canvas dimensions for blast centering
    const textHalfWidth = wordObj.width / 2;
    const splitIndex = Math.ceil(wordObj.originalWord.length / 2);
    const leftText = wordObj.originalWord.slice(0, splitIndex);
    const rightText = wordObj.originalWord.slice(splitIndex);

    // Dynamic sword Trail overlay swipe
    registerSlashTrail(
      wordObj.x - textHalfWidth - 25,
      wordObj.y - 12,
      wordObj.x + textHalfWidth + 25,
      wordObj.y + 12,
      wordObj.color
    );

    // Audio hit
    if (soundEnabledRef.current) {
      if (wordObj.type === 'bomb') synth.playExplosion();
      else synth.playSlice();
    }

    // Detonate visual burst sparks
    spawnSliceParticles(wordObj.x, wordObj.y, wordObj.color);

    // Type special checks
    if (wordObj.type === 'bomb') {
      // Flash screen, subtract a life
      setLives(l => {
        const nl = Math.max(0, l - 1);
        if (nl <= 0) setGameState('gameover');
        return nl;
      });
      // Screen shake particles
      spawnSliceParticles(wordObj.x, wordObj.y, '#ef4444');
    } else {
      // Normal slice
      setSlicedCount(c => c + 1);
      setScoreCombo(c => {
        const nc = c + 1;
        setMaxCombo(m => Math.max(m, nc));
        return nc;
      });
      comboTimerRef.current = 150; // 2.5 seconds at 60 FPS

      // Check special type reward activations
      if (wordObj.type === 'freeze') {
        freezeTimerRef.current = 300; // 5 seconds freeze
      } else if (wordObj.type === 'furious') {
        doublePointsTimerRef.current = 600; // 10 seconds double multiplier
      }

      setScore(s => {
        const multiplier = doublePointsTimerRef.current > 0 ? 2 : 1;
        const add = Math.round(wordObj.originalWord.length * 15 * multiplier * (1 + comboRef.current * 0.08));
        return s + add;
      });

      // Spawning two sliced gravity fragments flying apart!
      splitFragmentsRef.current.push({
        text: leftText,
        x: wordObj.x - 12,
        y: wordObj.y,
        vx: wordObj.vx - 3 - Math.random() * 2,
        vy: wordObj.vy - 2,
        rot: 0,
        rotSpeed: -0.06 - Math.random() * 0.05,
        color: wordObj.color
      });

      splitFragmentsRef.current.push({
        text: rightText,
        x: wordObj.x + 12,
        y: wordObj.y,
        vx: wordObj.vx + 3 + Math.random() * 2,
        vy: wordObj.vy - 2,
        rot: 0,
        rotSpeed: 0.06 + Math.random() * 0.05,
        color: wordObj.color
      });
    }

    // Remove from active lists
    flyingWordsRef.current = flyingWordsRef.current.filter(w => w.id !== wordObj.id);

    // Reset targeted ID
    if (targetedWordIdRef.current === wordObj.id) {
      targetedWordIdRef.current = null;
    }
  }, []);

  // ─── Game Management Loops ─────────────────────────────────────────────────
  const startNewGame = () => {
    synth.init();
    flyingWordsRef.current = [];
    splitFragmentsRef.current = [];
    particlesRef.current = [];
    slashTrailsRef.current = [];
    targetedWordIdRef.current = null;
    comboTimerRef.current = 0;
    freezeTimerRef.current = 0;
    doublePointsTimerRef.current = 0;
    spawnTimerRef.current = 0;
    statsRef.current = { keysTyped: 0, correctKeys: 0 };

    setScore(0);
    setLives(3);
    setScoreCombo(0);
    setMaxCombo(0);
    setSlicedCount(0);
    setPaused(false);
    setIsHighScore(false);
    setGameState('playing');
    if (soundEnabledRef.current) playSound('correct');

    // Focus input
    setTimeout(() => {
      if (invisibleInputRef.current) invisibleInputRef.current.focus();
    }, 150);
  };

  const handleKeyPress = useCallback((e) => {
    if (gameStateRef.current !== 'playing' || pausedRef.current) return;

    const char = e.key.toLowerCase();
    if (!/^[a-z]$/.test(char)) return;

    statsRef.current.keysTyped += 1;
    const flyingWords = flyingWordsRef.current;

    // Play visual swoop Trail and swipe tone on click
    if (soundEnabledRef.current) synth.playSwoosh();

    // 1. Locked onto a flying word
    if (targetedWordIdRef.current !== null) {
      const activeWord = flyingWords.find(w => w.id === targetedWordIdRef.current);
      if (activeWord) {
        const expectedChar = activeWord.word[activeWord.typedIndex].toLowerCase();
        if (char === expectedChar) {
          activeWord.typedIndex += 1;
          statsRef.current.correctKeys += 1;

          // Word sliced!
          if (activeWord.typedIndex >= activeWord.word.length) {
            sliceWord(activeWord);
          }
        } else {
          // Keep targeted progress on error, just play error sound
          if (soundEnabledRef.current) synth.playGlitch();
        }
      }
    } else {
      // 2. Lock onto any flying candidate word starting with this letter
      // Prioritize words that are closest to dropping off the screen
      const candidates = flyingWords.filter(w => w.word[0].toLowerCase() === char);
      if (candidates.length > 0) {
        let bestCandidate = candidates[0];
        let lowestY = -Infinity;
        candidates.forEach(w => {
          if (w.y > lowestY) {
            lowestY = w.y;
            bestCandidate = w;
          }
        });

        targetedWordIdRef.current = bestCandidate.id;
        bestCandidate.typedIndex = 1;
        statsRef.current.correctKeys += 1;

        if (bestCandidate.typedIndex >= bestCandidate.word.length) {
          sliceWord(bestCandidate);
        }
      }
    }
  }, [sliceWord]);

  const handleRefocus = () => {
    if (invisibleInputRef.current) invisibleInputRef.current.focus();
  };

  // ─── Core 60FPS Game Loop ──────────────────────────────────────────────────
  useEffect(() => {
    if (gameState !== 'playing' || paused) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const updateFrame = () => {
      // Auto refocus invisible text input
      if (document.activeElement !== invisibleInputRef.current && invisibleInputRef.current) {
        invisibleInputRef.current.focus();
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw dynamic synthwave grid lines background
      ctx.strokeStyle = 'rgba(236,72,153,0.06)';
      ctx.lineWidth = 1;
      const gridSpacing = 40;
      for (let x = 0; x < canvas.width; x += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Decrement special duration timers
      if (comboTimerRef.current > 0) {
        comboTimerRef.current -= 1;
        if (comboTimerRef.current === 0) setScoreCombo(0);
      }
      if (freezeTimerRef.current > 0) freezeTimerRef.current -= 1;
      if (doublePointsTimerRef.current > 0) doublePointsTimerRef.current -= 1;

      // ─── Gravity & Physic settings ───
      const slowMultiplier = freezeTimerRef.current > 0 ? 0.35 : 1.0;
      const gravity = 0.045 * slowMultiplier; // lower gravity makes words float longer and feel playable

      // ─── 1. Word Spawning ───
      spawnTimerRef.current += 1;
      
      // Dynamic progressive spawn cooldown: starts slower and ramps up speed as sliced count grows
      const currentDiff = difficultyRef.current;
      const baseSpawnCooldown = currentDiff === 'easy' ? 240 : currentDiff === 'medium' ? 180 : 130;
      const curSliced = slicedCountRef.current;
      const spawnCooldown = Math.max(60, baseSpawnCooldown - Math.floor(curSliced * 1.8));

      if (spawnTimerRef.current >= spawnCooldown) {
        spawnTimerRef.current = 0;
        spawnFlyingWord();
      }

      // ─── 2. Update and Draw Flying Words ───
      const flyingWords = flyingWordsRef.current;
      flyingWordsRef.current = flyingWords.filter(word => {
        // Physics update
        word.x += word.vx * slowMultiplier;
        word.y += word.vy * slowMultiplier;
        word.vy += gravity;

        // Draw active targets
        const isTargeted = targetedWordIdRef.current === word.id;

        ctx.font = 'bold 20px monospace';
        ctx.textBaseline = 'middle';
        word.width = ctx.measureText(word.originalWord).width;

        // Render matched letters in green, remaining in white
        const typedCount = word.typedIndex;
        const typedPart = word.originalWord.slice(0, typedCount);
        const untypedPart = word.originalWord.slice(typedCount);

        const typedWidth = ctx.measureText(typedPart).width;
        let startX = word.x - (word.width / 2);

        // Draw shadow glow
        ctx.shadowColor = word.color;
        ctx.shadowBlur = isTargeted ? 12 : 5;

        const padX = 14;
        const padY = 8;
        const rectX = startX - padX;
        const rectY = word.y - 18;
        const rectW = word.width + (padX * 2);
        const rectH = 34;

        // Draw glowing colored border box for special words to identify their buffs
        if (word.type !== 'normal') {
          ctx.save();
          ctx.shadowColor = word.color;
          ctx.shadowBlur = isTargeted ? 14 : 6;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; // opaque dark fill
          ctx.strokeStyle = word.color;
          ctx.lineWidth = isTargeted ? 2.5 : 1.5;
          ctx.beginPath();
          ctx.roundRect(rectX, rectY, rectW, rectH, 6);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        } else if (isTargeted) {
          // Green targeted outline box for normal words
          ctx.save();
          ctx.shadowColor = '#22c55e';
          ctx.shadowBlur = 10;
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.roundRect(rectX, rectY, rectW, rectH, 6);
          ctx.stroke();
          ctx.restore();
        }

        // Render text parts
        ctx.fillStyle = '#22c55e'; // typed green
        ctx.fillText(typedPart, startX, word.y);
        ctx.fillStyle = '#ffffff'; // remaining white
        ctx.fillText(untypedPart, startX + typedWidth, word.y);

        ctx.shadowBlur = 0; // reset glow

        // Check if word falls below screen (miss)
        if (word.y > canvas.height + 25) {
          // If not a bomb, penalize a life!
          if (word.type !== 'bomb') {
            setLives(l => {
              const nl = Math.max(0, l - 1);
              if (nl <= 0) setGameState('gameover');
              return nl;
            });
            if (soundEnabledRef.current) synth.playGlitch();
          }

          if (targetedWordIdRef.current === word.id) {
            targetedWordIdRef.current = null;
          }
          return false; // delete
        }

        return true;
      });

      // ─── 3. Draw Sliced gravity fragments ───
      const splits = splitFragmentsRef.current;
      splitFragmentsRef.current = splits.filter(f => {
        // Physics update
        f.x += f.vx * slowMultiplier;
        f.y += f.vy * slowMultiplier;
        f.vy += gravity * 1.2;
        f.rot += f.rotSpeed * slowMultiplier;

        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = f.color;
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 4;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(f.text, 0, 0);
        ctx.restore();

        // Remove if off screen
        return f.y < canvas.height + 50;
      });

      // ─── 4. Particle Bursts ───
      const particles = particlesRef.current;
      particlesRef.current = particles.filter(p => {
        p.x += p.vx * slowMultiplier;
        p.y += p.vy * slowMultiplier;
        p.vy += 0.05 * slowMultiplier; // faint gravity
        p.alpha -= p.decay;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        return p.alpha > 0;
      });

      // ─── 5. Sword trail lines ───
      const trails = slashTrailsRef.current;
      slashTrailsRef.current = trails.filter(t => {
        t.alpha -= t.decay;
        ctx.strokeStyle = t.color;
        ctx.lineWidth = 4 * t.alpha;
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 8;
        ctx.globalAlpha = Math.max(0, t.alpha);
        ctx.beginPath();
        ctx.moveTo(t.x1, t.y1);
        ctx.lineTo(t.x2, t.y2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;

        return t.alpha > 0;
      });

      animationFrameRef.current = requestAnimationFrame(updateFrame);
    };

    animationFrameRef.current = requestAnimationFrame(updateFrame);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState, paused, spawnFlyingWord, sliceWord]);

  // ─── Game Over High Score Save ───
  useEffect(() => {
    if (gameState === 'gameover' && currentUser) {
      const isNewHigh = saveScore(score);
      
      const acc = statsRef.current.keysTyped > 0
        ? Math.round((statsRef.current.correctKeys / statsRef.current.keysTyped) * 100)
        : 100;

      progressManager.saveTestResult(currentUser.id, {
        type: 'game',
        gameType: 'slice-type',
        score,
        wordsTyped: slicedCount,
        accuracy: acc,
        maxCombo,
        difficulty,
        isHighScore: isNewHigh,
        timeSpent: slicedCount * 3,
        wpm: Math.round((statsRef.current.correctKeys / 5) / (slicedCount * 3 / 60) || 40),
        totalCharacters: statsRef.current.correctKeys,
        testTitle: `SliceType (${difficulty})`
      });
    }
  }, [gameState]);

  // ─── Global Keystroke hooks ───
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (gameStateRef.current === 'playing' && !pausedRef.current) {
        handleKeyPress(e);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleKeyPress]);

  const accPercentage = statsRef.current.keysTyped > 0 
    ? Math.round((statsRef.current.correctKeys / statsRef.current.keysTyped) * 100)
    : 100;

  // ═══════════════════════════════════════════════════════════════════════════
  // TITLE SCREEN RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  if (gameState === 'title') {
    return (
      <div className={`${theme.cardBg} rounded-2xl shadow-xl border ${theme.border} overflow-hidden`}>
        <div className="relative min-h-[380px] flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-neutral-950 via-pink-950/40 to-fuchsia-950 overflow-hidden">
          {/* Constellation background visual grid */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg className="w-full h-full">
              <line x1="100" y1="400" x2="300" y2="100" stroke="#ec4899" strokeWidth="2.5" strokeDasharray="5,5" />
              <line x1="500" y1="50" x2="700" y2="400" stroke="#a855f7" strokeWidth="2.5" strokeDasharray="5,5" />
            </svg>
          </div>

          <div className="relative z-10 max-w-md w-full">
            <div className="w-20 h-20 bg-gradient-to-tr from-rose-500 via-pink-600 to-fuchsia-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-500/25 border border-white/20 animate-bounce-subtle">
              <Swords className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-fuchsia-400 tracking-wider mb-2" style={{ filter: 'drop-shadow(0 0 20px rgba(236,72,153,0.4))' }}>
              SLICETYPE
            </h1>
            <p className="text-gray-400 text-sm mb-8 font-medium">Cyberpunk Typing Ninja Arcade</p>

            {/* Select difficulty */}
            <div className="grid grid-cols-3 gap-2.5 mb-8">
              {['easy', 'medium', 'hard'].map(diff => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`py-2.5 rounded-xl text-xs font-bold capitalize border transition-all ${
                    difficulty === diff
                      ? 'bg-gradient-to-r from-rose-500 to-fuchsia-600 border-pink-400 text-white shadow-lg shadow-pink-500/20 scale-105'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>

            {/* High scores legend */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 mb-8 flex justify-around items-center">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span className="text-xs text-gray-400 font-semibold">High Scores:</span>
              </div>
              <div className="flex gap-4 font-mono text-xs font-bold text-white">
                <div>E: <span className="text-rose-400">{highScores.easy}</span></div>
                <div>M: <span className="text-pink-400">{highScores.medium}</span></div>
                <div>H: <span className="text-fuchsia-400">{highScores.hard}</span></div>
              </div>
            </div>

            <button
              onClick={startNewGame}
              className="w-full py-4 rounded-2xl font-black text-sm tracking-wider uppercase text-white bg-gradient-to-r from-rose-500 via-pink-600 to-fuchsia-600 hover:from-rose-400 hover:to-fuchsia-500 shadow-xl shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
            >
              <Swords className="w-4.5 h-4.5" /> Enter Dojo
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="mt-4 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 transition-colors mx-auto block"
            >
              {soundEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME OVER SCREEN RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  if (gameState === 'gameover') {
    return (
      <div className={`${theme.cardBg} rounded-2xl shadow-xl border ${theme.border} overflow-hidden`}>
        <div className="relative min-h-[360px] flex flex-col items-center justify-center p-5 text-center bg-gradient-to-br from-neutral-950 via-rose-950/20 to-black">
          <div className="relative z-10 max-w-md w-full">
            <div className="w-10 h-10 bg-red-950/30 rounded-full border border-red-500/50 flex items-center justify-center mx-auto mb-3">
              <Swords className="w-5 h-5 text-red-500 animate-pulse" />
            </div>

            <h2 className="text-2xl font-black text-red-500 mb-0.5">Dojo Defeated</h2>
            <p className="text-gray-400 text-xs mb-4">Fallen words breached your ninja defense barriers</p>

            {isHighScore && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-full py-1 px-4 mb-4 text-center max-w-xs mx-auto animate-bounce">
                <div className="text-[10px] font-bold text-amber-400 flex items-center justify-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" /> NEW RECORD!
                </div>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2 mb-6 text-center font-mono">
              <div className="bg-white/5 py-3 px-1 rounded-xl border border-white/5">
                <div className="text-gray-500 text-[9px] font-bold uppercase tracking-wider mb-1">Score</div>
                <div className="text-lg font-black text-rose-400">{score}</div>
              </div>
              <div className="bg-white/5 py-3 px-1 rounded-xl border border-white/5">
                <div className="text-gray-500 text-[9px] font-bold uppercase tracking-wider mb-1">Sliced</div>
                <div className="text-lg font-black text-pink-400">{slicedCount}</div>
              </div>
              <div className="bg-white/5 py-3 px-1 rounded-xl border border-white/5">
                <div className="text-gray-500 text-[9px] font-bold uppercase tracking-wider mb-1">Accuracy</div>
                <div className="text-lg font-black text-fuchsia-400">{accPercentage}%</div>
              </div>
              <div className="bg-white/5 py-3 px-1 rounded-xl border border-white/5">
                <div className="text-gray-500 text-[9px] font-bold uppercase tracking-wider mb-1">Combo</div>
                <div className="text-lg font-black text-orange-400">x{maxCombo}</div>
              </div>
            </div>

            <div className="flex gap-3 max-w-sm mx-auto">
              <button
                onClick={startNewGame}
                className="flex-1 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Slice Again
              </button>

              <button
                onClick={() => setGameState('title')}
                className="flex-1 py-3 rounded-xl font-bold text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              >
                Back to Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIVE PLAY SCREEN
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className={`${theme.cardBg} rounded-2xl shadow-xl border ${theme.border} overflow-hidden select-none`}>
      {/* Invisible global keys grabber */}
      <input
        ref={invisibleInputRef}
        type="text"
        className="absolute opacity-0 pointer-events-none w-0 h-0"
        onChange={() => {}}
        onBlur={handleRefocus}
      />

      {/* Top Hud Panels */}
      <div className="p-4 border-b border-white/10 bg-neutral-950 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-black text-rose-500 tracking-wider">SLICETYPE</h2>
          <div className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-yellow-500" /><span className="font-bold text-white text-xs">{score}</span></div>
          {combo > 2 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 animate-pulse text-xxs font-black">
              Combo x{combo}
            </div>
          )}
        </div>

        {/* Lives representation swords icons */}
        <div className="flex gap-1.5 items-center">
          <span className="text-gray-500 text-xxs font-bold uppercase tracking-wider mr-1.5">LIVES:</span>
          {[...Array(3)].map((_, i) => (
            <Heart
              key={i}
              className={`w-4 h-4 ${i < lives ? 'text-rose-500 fill-rose-500 animate-pulse' : 'text-neutral-800 fill-neutral-800'}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaused(!paused)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            {paused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
          </button>
          <button
            onClick={() => setGameState('title')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas rendering block */}
      <div
        className="relative bg-neutral-950 cursor-crosshair flex items-center justify-center"
        onClick={handleRefocus}
        style={{ minHeight: 360 }}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={360}
          className="w-full h-auto block select-none"
        />

        {/* Legend instructions floating badge */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 flex gap-4 text-xxs font-bold text-gray-400">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Bomb (Red Border)</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Time Freeze (Blue Border)</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Furious 2x (Orange Border)</div>
        </div>

        {/* Special status active banners */}
        {freezeTimerRef.current > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-500/20 border border-blue-500/40 text-blue-300 rounded-full px-4 py-1 animate-pulse text-xxs font-black tracking-widest">
            TIME FROZEN ({Math.ceil(freezeTimerRef.current / 60)}s)
          </div>
        )}
        {doublePointsTimerRef.current > 0 && freezeTimerRef.current <= 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-orange-500/20 border border-orange-500/40 text-orange-300 rounded-full px-4 py-1 animate-pulse text-xxs font-black tracking-widest">
            FURIOUS 2X SCORE MULTIPLIER ({Math.ceil(doublePointsTimerRef.current / 60)}s)
          </div>
        )}

        {/* Pause Overlay screen */}
        {paused && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-40">
            <h3 className="text-3xl font-black text-white tracking-widest uppercase">Grid Paused</h3>
            <button
              onClick={() => setPaused(false)}
              className="px-6 py-2.5 rounded-xl font-bold bg-rose-500 hover:bg-rose-400 text-white shadow-lg active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" /> Continue Slicing
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SliceTypeGame;
