import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { RotateCcw, Heart } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { progressManager } from '../../utils/storage';
import { playSound } from '../../utils/soundEffects';

// Theme words (4-5 letters only)
const WORDS = {
  'Green Forest': ['tree', 'leaf', 'bird', 'nest', 'moss', 'fern', 'bark', 'vine', 'root', 'bush', 'wood', 'twig', 'palm', 'pine', 'deer'],
  'Dry Desert': ['sand', 'dune', 'heat', 'dust', 'wind', 'rock', 'mesa', 'cave', 'hawk', 'arid', 'bone', 'gold', 'trap', 'veil', 'opal'],
  'Winter Land': ['snow', 'cold', 'sled', 'coat', 'wolf', 'bear', 'floe', 'gale', 'pack', 'hail', 'plow', 'pond', 'yeti', 'berg', 'cave'],
  'Cherry Blossom': ['pink', 'silk', 'kite', 'jade', 'lily', 'pond', 'mist', 'soft', 'gate', 'vase', 'moon', 'dawn', 'calm', 'glow', 'hope'],
  'Blood Moon': ['dark', 'bone', 'tomb', 'doom', 'fear', 'grim', 'claw', 'fang', 'howl', 'vein', 'gore', 'bat', 'hex', 'void', 'dusk'],
  'Oreo Jungle': ['vine', 'frog', 'palm', 'wild', 'lush', 'root', 'rain', 'mist', 'lair', 'fern', 'prey', 'roar', 'hunt', 'puma', 'moth'],
  'Crystal Fields': ['glow', 'star', 'orb', 'wand', 'gem', 'beam', 'mist', 'aura', 'rune', 'halo', 'moon', 'myth', 'soul', 'void', 'gaze'],
  'Sunset Fall': ['fall', 'dusk', 'warm', 'gold', 'glow', 'haze', 'rust', 'leaf', 'wind', 'cozy', 'mist', 'pine', 'peak', 'dawn', 'blaze']
};

const difficultySettings = {
  easy: { lives: 12, label: 'Easy', wordsPerLevel: 8 },
  medium: { lives: 8, label: 'Medium', wordsPerLevel: 12 },
  hard: { lives: 5, label: 'Hard', wordsPerLevel: 15 }
};

// 8 Biomes with custom image assets and robot colors
const levelThemes = [
  { 
    name: 'Green Forest', 
    sky: 'linear-gradient(180deg, #87CEEB 0%, #98D8C8 50%, #7CB342 100%)',
    ground: '#4a8505',
    platform: { type: 'log', color: '#6B4423' },
    particle: 'leaf',
    folder: 'GREEN FOREST',
    files: ['FOREST (1).png', 'FOREST (2).png', 'FOREST (3).png', 'FOREST (4).png'],
    skyElement: '☀️',
    cloudColor: 'rgba(255,255,255,0.6)',
    robotColor: { body: '#3B82F6', accent: '#60A5FA', border: '#1E40AF' },
    starGlow: 'rgba(255,200,0,0.6)'
  },
  { 
    name: 'Dry Desert', 
    sky: 'linear-gradient(180deg, #FFB347 0%, #FFCC80 50%, #E3C695 100%)',
    ground: '#C4A35A',
    platform: { type: 'cactus', color: '#458B74' },
    particle: 'sand',
    folder: 'DRY DESERT',
    files: ['dry-dersert (1).png', 'dry-dersert (2).png', 'dry-dersert (3).png', 'dry-dersert (4).png'],
    skyElement: '🌞',
    cloudColor: 'rgba(255,200,100,0.4)',
    robotColor: { body: '#F59E0B', accent: '#FBBF24', border: '#B45309' },
    starGlow: 'rgba(255,200,0,0.6)'
  },
  { 
    name: 'Winter Land', 
    sky: 'linear-gradient(180deg, #1E3A5F 0%, #2D5A87 50%, #87CEEB 100%)',
    ground: '#E8F4F8',
    platform: { type: 'ice', color: '#A5F2F3' },
    particle: 'snow',
    folder: 'WINTER LAND',
    files: ['winter-land (1).png', 'winter-land (2).png', 'winter-land (3).png', 'winter-land (4).png'],
    skyElement: '⭐',
    cloudColor: 'rgba(200,220,255,0.7)',
    robotColor: { body: '#06B6D4', accent: '#67E8F9', border: '#0E7490' },
    starGlow: 'rgba(255,215,0,0.8)'
  },
  { 
    name: 'Cherry Blossom', 
    sky: 'linear-gradient(180deg, #FFB6C1 0%, #FFC0CB 50%, #FFE4E1 100%)',
    ground: '#8B4513',
    platform: { type: 'wood', color: '#DEB887' },
    particle: 'petal',
    folder: 'CHERRY BLOSSOM',
    files: ['cherry-blossom (1).png', 'cherry-blossom (2).png', 'cherry-blossom (3).png', 'cherry-blossom (4).png'],
    skyElement: '🌸',
    cloudColor: 'rgba(255,182,193,0.5)',
    robotColor: { body: '#EC4899', accent: '#F472B6', border: '#BE185D' },
    starGlow: 'rgba(255,105,180,0.7)'
  },
  { 
    name: 'Blood Moon',
    sky: 'linear-gradient(180deg, #1a0000 0%, #330000 30%, #4a0000 60%, #2a0000 100%)',
    ground: '#0a0a0a',
    platform: { type: 'bone', color: '#E8DCC4' },
    particle: 'blood',
    folder: 'RED FOREST',
    files: ['red-forest (1).png', 'red-forest (2).png', 'red-forest (3).png', 'red-forest (4).png'],
    skyElement: '🪦',
    cloudColor: 'rgba(80,0,0,0.4)',
    robotColor: { body: '#1F2937', accent: '#E5E7EB', border: '#111827', isSkull: true },
    starGlow: 'rgba(200,0,0,0.8)'
  },
  { 
    name: 'Oreo Jungle', 
    sky: 'linear-gradient(180deg, #2C3E50 0%, #4A5568 50%, #1A202C 100%)',
    ground: '#1A1A2E',
    platform: { type: 'stone', color: '#4A4A4A' },
    particle: 'firefly',
    folder: 'OREO JUNGLE',
    files: ['oreo (1).png', 'oreo (2).png', 'oreo (3).png', 'oreo (4).png'],
    skyElement: '🌙',
    cloudColor: 'rgba(100,100,120,0.4)',
    robotColor: { body: '#3D2314', accent: '#FFFEF0', border: '#1A0F0A', isOreo: true },
    starGlow: 'rgba(255,255,200,0.5)'
  },
  { 
    name: 'Crystal Fields', 
    sky: 'linear-gradient(180deg, #667EEA 0%, #764BA2 50%, #6B8DD6 100%)',
    ground: '#4A3F7F',
    platform: { type: 'crystal', color: '#9F7AEA' },
    particle: 'sparkle',
    folder: 'CRYSTAL FIELDS',
    files: ['crystal-fields (1).png', 'crystal-fields (2).png', 'crystal-fields (3).png', 'crystal-fields (4).png'],
    skyElement: '✨',
    cloudColor: 'rgba(150,100,250,0.4)',
    robotColor: { body: '#00D4FF', accent: '#FF6B6B', border: '#9F7AEA', isRainbow: true },
    starGlow: 'rgba(200,150,255,0.7)'
  },
  { 
    name: 'Sunset Fall', 
    sky: 'linear-gradient(180deg, #FF6B35 0%, #FF8C42 30%, #FFA07A 60%, #FFD700 100%)',
    ground: '#8B4513',
    platform: { type: 'wood', color: '#A0522D' },
    particle: 'petal',
    folder: 'SPRING FALL',
    files: ['spring (1).png', 'spring (2).png', 'spring (3).png', 'spring (4).png'],
    skyElement: '�',
    cloudColor: 'rgba(255,140,100,0.6)',
    robotColor: { body: '#FF6B35', accent: '#FFD700', border: '#CC4400' },
    starGlow: 'rgba(255,165,0,0.8)'
  }
];

const HIGH_SCORE_KEY = 'keyboard_jump_high_scores';
const getHighScores = () => { try { const d = localStorage.getItem(HIGH_SCORE_KEY); return d ? JSON.parse(d) : { easy: 0, medium: 0, hard: 0 }; } catch { return { easy: 0, medium: 0, hard: 0 }; } };
const saveHighScore = (diff, sc) => { const hs = getHighScores(); if (sc > hs[diff]) { hs[diff] = sc; localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(hs)); return true; } return false; };

// Optimized CSS-only Wind Particles
const WindParticlesCSS = React.memo(({ type }) => {
  const particleStyles = useMemo(() => {
    const particles = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      particles.push({
        id: i,
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${4 + Math.random() * 3}s`,
        size: 10 + Math.random() * 8
      });
    }
    return particles;
  }, [type]);

  const getParticleContent = (p) => {
    switch (type) {
      case 'leaf': return <span style={{ fontSize: p.size }}>🍃</span>;
      case 'snow': return <div className="rounded-full bg-white/80" style={{ width: p.size * 0.6, height: p.size * 0.6 }} />;
      case 'sand': return <div className="rounded-full bg-amber-400/60" style={{ width: p.size * 0.3, height: p.size * 0.3 }} />;
      case 'firefly': return <div className="rounded-full bg-yellow-300" style={{ width: p.size * 0.4, height: p.size * 0.4, boxShadow: '0 0 4px 2px rgba(253, 224, 71, 0.5)' }} />;
      case 'sparkle': return <span style={{ fontSize: p.size * 0.7 }}>✨</span>;
      case 'petal': return <span style={{ fontSize: p.size * 0.8 }}>🌸</span>;
      case 'blood': return <span style={{ fontSize: p.size * 0.7, filter: 'drop-shadow(0 0 3px rgba(200,0,0,0.8))' }}>🩸</span>;
      default: return null;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <style>{`
        @keyframes fall-particle {
          0% { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.7; }
          100% { transform: translateY(520px) translateX(30px) rotate(360deg); opacity: 0; }
        }
        .particle-fall { animation: fall-particle linear infinite; }
      `}</style>
      {particleStyles.map(p => (
        <div
          key={p.id}
          className="absolute particle-fall"
          style={{
            left: p.left,
            top: '-20px',
            animationDelay: p.animationDelay,
            animationDuration: p.animationDuration
          }}
        >
          {getParticleContent(p)}
        </div>
      ))}
    </div>
  );
});

const KeyboardJumpGame = ({ currentUser, settings }) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [gameState, setGameState] = useState('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(8);
  const [maxLives, setMaxLives] = useState(8);
  const [platforms, setPlatforms] = useState([]);
  const [currentPlatformId, setCurrentPlatformId] = useState(0);
  const [targetPlatformId, setTargetPlatformId] = useState(null);
  const [playerVisualY, setPlayerVisualY] = useState(350);
  const [playerVisualX, setPlayerVisualX] = useState(200);
  const [playerState, setPlayerState] = useState('idle');
  const [typedChars, setTypedChars] = useState([]);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [wordsTyped, setWordsTyped] = useState(0);
  const [levelWordsTyped, setLevelWordsTyped] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [totalChars, setTotalChars] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [difficulty, setDifficulty] = useState('medium');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [soundEnabled] = useState(true);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [highScores, setHighScores] = useState(getHighScores());
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [showLevelBanner, setShowLevelBanner] = useState(false);
  const [levelBannerText, setLevelBannerText] = useState('');
  const [showLevelBadge, setShowLevelBadge] = useState(true);
  const [wrongInputShake, setWrongInputShake] = useState(false);
  const [robotFacing, setRobotFacing] = useState('right');
  
  // Level transition states
  const [skyTransitionProgress, setSkyTransitionProgress] = useState(0);
  const [previousTheme, setPreviousTheme] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Life loss logic
  const [charLostLife, setCharLostLife] = useState(false);
  
  // Dev mode (Alt+S+W to toggle)
  const [devMode, setDevMode] = useState(false);
  const devKeysRef = useRef({ alt: false, s: false, w: false });

  const inputRef = useRef(null);
  const gameAreaRef = useRef(null);
  const platformIdCounter = useRef(0);

  const currentTheme = levelThemes[(currentLevel - 1) % levelThemes.length];
  const currentDifficulty = difficultySettings[difficulty];
  const wordsNeededForLevel = currentDifficulty.wordsPerLevel;
  const levelProgress = (levelWordsTyped / wordsNeededForLevel) * 100;
  const targetPlatform = platforms.find(p => p.id === targetPlatformId);

  // Preload all biome assets
  useEffect(() => {
    const loadAssets = async () => {
      const allImages = [];
      levelThemes.forEach(theme => {
        theme.files.forEach(file => {
          allImages.push(`/assets/keyboard_jump/biomes/${encodeURIComponent(theme.folder)}/${encodeURIComponent(file)}`);
        });
      });
      
      let loaded = 0;
      const total = allImages.length;
      
      await Promise.all(allImages.map(src => 
        new Promise(resolve => {
          const img = new Image();
          img.onload = () => { loaded++; setLoadProgress(Math.round((loaded / total) * 100)); resolve(); };
          img.onerror = () => { loaded++; setLoadProgress(Math.round((loaded / total) * 100)); resolve(); };
          img.src = src;
        })
      ));
      
      setIsLoading(false);
    };
    loadAssets();
  }, []);

  // Dev mode keyboard shortcut (Alt+S+W)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const k = devKeysRef.current;
      if (e.key === 'Alt') k.alt = true;
      if (e.key.toLowerCase() === 's') k.s = true;
      if (e.key.toLowerCase() === 'w') k.w = true;
      
      // Toggle dev mode when all keys pressed
      if (k.alt && k.s && k.w) {
        e.preventDefault();
        setDevMode(prev => !prev);
        devKeysRef.current = { alt: false, s: false, w: false };
      }
      
      // Skip level in dev mode with / key
      if (devMode && e.key === '/' && gameState === 'playing') {
        e.preventDefault();
        setLevelWordsTyped(wordsNeededForLevel);
      }
    };
    
    const handleKeyUp = (e) => {
      const k = devKeysRef.current;
      if (e.key === 'Alt') k.alt = false;
      if (e.key.toLowerCase() === 's') k.s = false;
      if (e.key.toLowerCase() === 'w') k.w = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [devMode, gameState, wordsNeededForLevel]);

  useEffect(() => {
    if (targetPlatform && platforms.length > 0) {
       const currentP = platforms.find(p => p.id === currentPlatformId);
       const startX = currentP ? currentP.x + currentP.width/2 : playerVisualX; 
       setRobotFacing(targetPlatform.x > startX ? 'right' : 'left');
    }
  }, [targetPlatformId, platforms, currentPlatformId, playerVisualX]);

  const getRandomWord = useCallback(() => {
    const words = WORDS[currentTheme?.name] || WORDS['Green Forest'];
    return words[Math.floor(Math.random() * words.length)];
  }, [currentTheme]);

  const generatePlatforms = useCallback(() => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return [];
    const areaWidth = gameArea.clientWidth;
    const newPlatforms = [];
    newPlatforms.push({ id: platformIdCounter.current++, x: areaWidth / 2 - 80, y: 400, word: '', width: 160, isStart: true, completed: false });
    for (let i = 1; i <= 5; i++) {
        const margin = 100, platformWidth = 170;
        const side = i % 2 === 0 ? 'left' : 'right';
        let newX = side === 'left' ? margin + Math.random() * (areaWidth/2 - margin - platformWidth) : areaWidth/2 + Math.random() * (areaWidth/2 - margin - platformWidth);
        newX = Math.max(margin, Math.min(areaWidth - margin - platformWidth, newX));
        newPlatforms.push({ id: platformIdCounter.current++, x: newX, y: 400 - (i * 130), word: getRandomWord(), width: platformWidth, isStart: false, completed: false });
    }
    return newPlatforms;
  }, [getRandomWord]);

  useEffect(() => { if (gameState === 'playing' && inputRef.current) inputRef.current.focus(); }, [gameState]);
  useEffect(() => { if (gameState === 'playing') { setShowLevelBadge(true); const t = setTimeout(() => setShowLevelBadge(false), 4000); return () => clearTimeout(t); } }, [currentLevel, gameState]);
  useEffect(() => { if (gameState === 'playing' && platforms.length > 0 && !targetPlatformId) { const np = platforms.find(p => !p.completed && !p.isStart); if (np) { setTargetPlatformId(np.id); setTypedChars([]); setCurrentCharIndex(0); setCharLostLife(false); } } }, [gameState, platforms, targetPlatformId]);
  useEffect(() => { if (levelWordsTyped >= wordsNeededForLevel && gameState === 'playing') handleLevelComplete(); }, [levelWordsTyped, wordsNeededForLevel, gameState]);
  useEffect(() => { if (totalChars > 0) setAccuracy(Math.round((correctChars / totalChars) * 100)); }, [totalChars, correctChars]);

  const handleLevelComplete = () => {
    const nextLevel = currentLevel + 1;
    const nextTheme = levelThemes[(nextLevel - 1) % levelThemes.length];
    setLevelBannerText(nextTheme.name);
    setShowLevelBanner(true);
    setGameState('transitioning');
    if (soundEnabled) playSound('success');
    
    setPreviousTheme(currentTheme);
    setIsTransitioning(true);
    setPlayerState('climb');
    
    let currentY = playerVisualY;
    const topY = -80;
    
    const climbUp = setInterval(() => {
      currentY -= 12;
      setPlayerVisualY(currentY);
      if (currentY <= topY) {
        clearInterval(climbUp);
        startFallingIntoNewLevel(nextLevel);
      }
    }, 16);
  };

  const startFallingIntoNewLevel = (nextLevel) => {
    setCurrentLevel(nextLevel);
    setPlayerState('fall');
    const newPlatforms = generatePlatforms();
    
    let currentY = -100;
    const groundY = 430;
    let progress = 0;
    
    const fallAndTransition = setInterval(() => {
      progress = Math.min(progress + 0.025, 1);
      setSkyTransitionProgress(progress);
      
      const speed = 8 + progress * 6;
      currentY += speed;
      setPlayerVisualY(currentY);
      
      const gameArea = gameAreaRef.current;
      if (gameArea) setPlayerVisualX(gameArea.clientWidth / 2 - 25);
      
      if (currentY >= groundY && progress >= 1) {
        clearInterval(fallAndTransition);
        setPlayerVisualY(groundY);
        setSkyTransitionProgress(1);
        setPreviousTheme(null);
        setIsTransitioning(false);
        
        setPlatforms(newPlatforms);
        setLevelWordsTyped(0);
        setTargetPlatformId(null);
        setTypedChars([]);
        setCurrentCharIndex(0);
        setCharLostLife(false);
        
        setTimeout(() => {
          if (newPlatforms.length > 0) climbToFirstPlatform(newPlatforms[0]);
        }, 200);
      }
    }, 16);
  };

  const climbToFirstPlatform = (startPlatform) => {
    setCurrentPlatformId(startPlatform.id);
    const targetX = startPlatform.x + startPlatform.width / 2 - 25;
    const targetY = startPlatform.y - 12;
    
    setPlayerState('climb');
    let currentY = playerVisualY;
    let currentX = playerVisualX;
    
    const climbUp = setInterval(() => {
      currentY -= 10;
      currentX += (targetX - currentX) * 0.1;
      setPlayerVisualY(currentY);
      setPlayerVisualX(currentX);
      
      if (currentY <= targetY) {
        clearInterval(climbUp);
        setPlayerVisualY(targetY);
        setPlayerVisualX(targetX);
        setPlayerState('idle');
        setGameState('playing');
        setShowLevelBanner(false);
        setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 100);
      }
    }, 16);
  };

  const handleInputChange = (e) => {
    const value = e.target.value; e.target.value = '';
    if (gameState !== 'playing' || !targetPlatform || value.length === 0 || playerState === 'climb' || playerState === 'fall' || playerState === 'jump') return;
    
    const typedChar = value[value.length - 1].toLowerCase();
    const expectedChar = targetPlatform.word[currentCharIndex];
    if (!expectedChar) return;
    
    setTotalChars(prev => prev + 1);
    
    if (typedChar === expectedChar) {
      setCorrectChars(prev => prev + 1);
      setCharLostLife(false);
      setWrongInputShake(false);
      setTypedChars(prev => [...prev, { char: expectedChar, correct: true }]);
      const nextIndex = currentCharIndex + 1;
      setCurrentCharIndex(nextIndex);
      if (nextIndex >= targetPlatform.word.length) jumpToPlatform(targetPlatform);
    } else {
      setWrongInputShake(true);
      setTimeout(() => setWrongInputShake(false), 300);
      if (soundEnabled) playSound('error');
      // Skip life loss in dev mode
      if (!devMode && !charLostLife) {
        setCharLostLife(true);
        setCombo(0);
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) setTimeout(() => setGameState('gameOver'), 500);
          return Math.max(0, newLives);
        });
      }
    }
  };

  const addNewPlatformsAbove = (currentY) => {
    const gameArea = gameAreaRef.current; if (!gameArea) return;
    const areaWidth = gameArea.clientWidth;
    setPlatforms(prev => {
        const filtered = prev.filter(p => p.y < 800);
        let shiftAmount = currentY < 400 ? 400 - currentY : 0;
        const shiftedPlatforms = filtered.map(p => ({ ...p, y: p.y + shiftAmount }));
        let newHighestY = Math.min(...shiftedPlatforms.map(p => p.y));
        while (newHighestY > -100) {
            const lastPlatformX = shiftedPlatforms[shiftedPlatforms.length - 1]?.x || areaWidth / 2;
            const targetSide = lastPlatformX < areaWidth / 2 ? 'right' : 'left';
            const margin = 100, platformWidth = 170, maxX = areaWidth - margin - platformWidth;
            let newX = targetSide === 'left' ? margin + Math.random() * (areaWidth/2 - margin - platformWidth) : areaWidth/2 + Math.random() * (areaWidth/2 - margin - platformWidth);
            newX = Math.max(margin, Math.min(maxX, newX));
            shiftedPlatforms.push({ id: platformIdCounter.current++, x: newX, y: newHighestY - 130, word: getRandomWord(), width: platformWidth, isStart: false, completed: false });
            newHighestY -= 130;
        }
        return shiftedPlatforms;
    });
    if (currentY < 400) setPlayerVisualY(400);
  };

  const jumpToPlatform = (platform) => {
    setPlayerState('jump');
    setPlatforms(prev => prev.map(p => p.id === platform.id ? { ...p, completed: true } : p));
    const comboMult = Math.min(combo + 1, 10);
    setScore(prev => prev + platform.word.length * 10 * comboMult);
    setWordsTyped(prev => prev + 1);
    setLevelWordsTyped(prev => prev + 1);
    setCombo(prev => { const nc = prev + 1; setMaxCombo(max => Math.max(max, nc)); return nc; });
    if (soundEnabled) playSound('correct');
    
    const startY = playerVisualY, startX = playerVisualX;
    const targetY = platform.y - 12, targetX = platform.x + platform.width / 2 - 25;
    const jumpDuration = 450;
    const startTime = performance.now();
    
    const animateJump = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / jumpDuration, 1);
      const easeProgress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const arcHeight = Math.abs(targetY - startY) * 0.5 + 80;
      const arc = Math.sin(progress * Math.PI) * arcHeight;
      setPlayerVisualY(startY - (startY - targetY) * easeProgress - arc);
      setPlayerVisualX(startX + (targetX - startX) * easeProgress);
      
      if (progress < 1) requestAnimationFrame(animateJump);
      else {
        setCurrentPlatformId(platform.id);
        setPlayerState('idle');
        setCharLostLife(false);
        const np = platforms.find(p => !p.completed && !p.isStart && p.id !== platform.id);
        if (np) {
          setTargetPlatformId(np.id);
          setTypedChars([]);
          setCurrentCharIndex(0);
          addNewPlatformsAbove(targetY);
        }
        if (inputRef.current) inputRef.current.focus();
      }
    };
    requestAnimationFrame(animateJump);
  };

  const startGame = () => {
    setPlatforms([]);
    setTimeout(() => {
      const ip = generatePlatforms();
      setPlatforms(ip);
      if (ip.length > 0) {
        const sp = ip[0];
        setCurrentPlatformId(sp.id);
        setPlayerVisualY(sp.y - 12);
        setPlayerVisualX(sp.x + sp.width / 2 - 25);
      }
    }, 0);
    setScore(0); setLives(currentDifficulty.lives); setMaxLives(currentDifficulty.lives);
    setWordsTyped(0); setLevelWordsTyped(0); setCurrentLevel(1); setAccuracy(100);
    setTotalChars(0); setCorrectChars(0); setCombo(0); setMaxCombo(0);
    setTypedChars([]); setCurrentCharIndex(0); setCharLostLife(false);
    setTargetPlatformId(null); setIsNewHighScore(false); setPlayerState('idle');
    setShowLevelBanner(false); setGameState('playing'); setRobotFacing('right');
    setSkyTransitionProgress(0); setPreviousTheme(null); setIsTransitioning(false);
    setWalkCycle(0);
    setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 100);
  };

  useEffect(() => {
    if (gameState === 'gameOver' && currentUser) {
      const inh = saveHighScore(difficulty, score);
      setIsNewHighScore(inh);
      setHighScores(getHighScores());
      progressManager.saveTestResult(currentUser.id, { type: 'game', gameType: 'keyboard-jump', score, wordsTyped, accuracy, maxCombo, difficulty, level: currentLevel, isHighScore: inh, timeSpent: wordsTyped * 2, wpm: Math.round(wordsTyped * 12), totalCharacters: correctChars, testTitle: `Keyboard Jump (${difficulty})` });
    }
  }, [gameState, currentUser, score, wordsTyped, accuracy, maxCombo, correctChars, difficulty, currentLevel]);

  // Get biome asset path
  const getBiomeAssetPath = (theme, index) => {
    return `/assets/keyboard_jump/biomes/${encodeURIComponent(theme.folder)}/${encodeURIComponent(theme.files[index])}`;
  };

  const renderRobot = () => {
    const isJumping = playerState === 'jump';
    const isFalling = playerState === 'fall';
    const isClimbing = playerState === 'climb';
    const isIdle = playerState === 'idle';
    let rotation = isFalling ? '180deg' : isJumping ? (robotFacing === 'right' ? '-20deg' : '20deg') : '0deg';
    
    // Use theme-based robot colors
    const robotColors = currentTheme.robotColor || { body: '#3B82F6', accent: '#60A5FA', border: '#1E40AF' };
    const isSkull = robotColors.isSkull;
    const isOreo = robotColors.isOreo;
    const isRainbow = robotColors.isRainbow;
    
    // Special head plant/decoration based on theme
    const getHeadDecoration = () => {
      if (isSkull) return <span className="text-red-600">💀</span>;
      if (isOreo) return <span>🍪</span>;
      if (isRainbow) return <span>💎</span>;
      return <span>🌱</span>;
    };
    
    // Get body gradient based on theme type
    const getBodyStyle = () => {
      if (isRainbow) {
        return { background: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 25%, #4ECDC4 50%, #45B7D1 75%, #A855F7 100%)', borderColor: '#9F7AEA' };
      }
      if (isOreo) {
        return { background: 'linear-gradient(135deg, #3D2314 0%, #2A1810 50%, #3D2314 100%)', borderColor: '#1A0F0A' };
      }
      return { background: `linear-gradient(135deg, ${robotColors.accent} 0%, ${robotColors.body} 100%)`, borderColor: robotColors.border };
    };
    
    // Get face plate style
    const getFacePlateStyle = () => {
      if (isSkull) return 'bg-gray-900';
      if (isOreo) return 'bg-[#FFFEF0]';
      return 'bg-white';
    };
    
    // Get eye style
    const getEyeStyle = () => {
      if (isSkull) return 'bg-red-500 animate-pulse';
      return 'bg-slate-800';
    };
    
    return (
      <div 
        className={`absolute z-20 pointer-events-none ${isIdle ? 'animate-robot-walk' : ''}`} 
        style={{ left: playerVisualX, top: playerVisualY - 55 }}
      >
        <div className="relative transition-transform duration-150" style={{ transform: `rotate(${rotation}) ${isClimbing ? 'translateY(-20px)' : ''}` }}>
          <div style={{ transform: robotFacing === 'left' ? 'scaleX(-1)' : 'scaleX(1)' }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-lg filter drop-shadow-sm animate-bounce">{getHeadDecoration()}</div>
              <div 
                className="w-12 h-10 rounded-xl mx-auto shadow-lg border-[3px] relative z-10"
                style={getBodyStyle()}
              >
                <div className={`absolute inset-1.5 ${getFacePlateStyle()} rounded-lg flex items-center justify-center gap-1.5`}>
                  <div className={`w-1.5 h-2 ${getEyeStyle()} rounded-full ${isIdle && !isSkull ? 'animate-pulse' : ''}`}></div>
                  <div className={`w-1.5 h-2 ${getEyeStyle()} rounded-full ${isIdle && !isSkull ? 'animate-pulse' : ''}`}></div>
                </div>
              </div>
              <div 
                className="w-8 h-6 rounded-b-lg mx-auto -mt-1 relative z-0"
                style={{ backgroundColor: isOreo ? '#3D2314' : robotColors.body }}
              >
                <div className="absolute top-1 left-2 w-1.5 h-1.5 bg-yellow-400 rounded-full" style={{ opacity: isSkull ? 0.3 : 1 }}></div>
                <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-green-400 rounded-full" style={{ opacity: isSkull ? 0.3 : 1 }}></div>
              </div>
              <div className="flex justify-center gap-1 -mt-1 relative">
                 <div className={`w-2.5 h-3 rounded-b-md transform origin-top ${isIdle ? 'animate-run-left' : ''}`} style={{ backgroundColor: isOreo ? '#1A0F0A' : robotColors.border }}></div>
                 <div className={`w-2.5 h-3 rounded-b-md transform origin-top ${isIdle ? 'animate-run-right' : ''}`} style={{ backgroundColor: isOreo ? '#1A0F0A' : robotColors.border }}></div>
              </div>
              <div className={`absolute top-8 -left-1 w-2.5 h-4 rounded-full origin-top ${isIdle ? 'animate-arm-left' : ''}`} style={{ backgroundColor: isOreo ? '#3D2314' : robotColors.body }}></div>
              <div className={`absolute top-8 -right-1 w-2.5 h-4 rounded-full origin-top ${isIdle ? 'animate-arm-right' : ''}`} style={{ backgroundColor: isOreo ? '#3D2314' : robotColors.body }}></div>
          </div>
        </div>
      </div>
    );
  };

  const renderPlatform = (platform, isTarget) => {
    const pType = currentTheme.platform.type;
    let platformContent;
    
    if (pType === 'cactus') {
      platformContent = <div className="relative h-8 bg-emerald-600 rounded-full shadow-[0_4px_0_#1a4731]"><div className="absolute top-0 w-full h-full opacity-30 flex justify-around items-center"><span>|</span><span>|</span><span>|</span><span>|</span></div></div>;
    } else if (pType === 'log') {
      platformContent = (
        <div className="relative h-8 rounded-full overflow-hidden" style={{ background: 'linear-gradient(180deg, #6B4423 0%, #8B5A2B 30%, #5D3A1A 100%)' }}>
          <div className="absolute top-0 left-6 w-8 h-2 bg-gradient-to-b from-green-500 to-green-600 rounded-b-full opacity-80"></div>
          <div className="absolute top-0 right-10 w-10 h-2.5 bg-gradient-to-b from-green-500 to-green-700 rounded-b-full opacity-75"></div>
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-b from-white/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/20 rounded-b-full"></div>
        </div>
      );
    } else if (pType === 'ice') {
      platformContent = <div className="relative h-7 rounded-full shadow-lg" style={{ background: 'linear-gradient(180deg, #A5F2F3 0%, #7DD3FC 100%)', boxShadow: '0 4px 0 rgba(100,200,255,0.4)' }}><div className="absolute top-1 left-2 right-2 h-1 bg-white/40 rounded-full"></div></div>;
    } else if (pType === 'crystal') {
      platformContent = <div className="relative h-7 rounded-full shadow-lg" style={{ background: 'linear-gradient(180deg, #9F7AEA 0%, #667EEA 100%)', boxShadow: '0 4px 0 rgba(100,80,200,0.4)' }}><div className="absolute top-1 left-2 right-2 h-1 bg-white/30 rounded-full"></div></div>;
    } else if (pType === 'stone') {
      platformContent = <div className="relative h-7 rounded-full shadow-lg" style={{ background: 'linear-gradient(180deg, #6B7280 0%, #4B5563 100%)', boxShadow: '0 4px 0 rgba(0,0,0,0.3)' }}><div className="absolute top-1 left-2 right-2 h-1 bg-white/10 rounded-full"></div></div>;
    } else if (pType === 'bone') {
      platformContent = (
        <div className="relative h-8 rounded-full overflow-hidden" style={{ background: 'linear-gradient(180deg, #E8DCC4 0%, #D4C4A8 50%, #BFB08C 100%)', boxShadow: '0 4px 0 rgba(0,0,0,0.5)' }}>
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-b from-white/40 to-transparent"></div>
          <div className="absolute top-1 left-4 text-xs opacity-60">💀</div>
          <div className="absolute top-1 right-4 text-xs opacity-60">💀</div>
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/30 rounded-b-full"></div>
        </div>
      );
    } else {
      platformContent = <div className="relative h-7 rounded-full shadow-lg" style={{ backgroundColor: currentTheme.platform.color, boxShadow: '0 4px 0 rgba(0,0,0,0.2)' }}><div className="absolute top-1 left-2 right-2 h-1 bg-white/20 rounded-full"></div></div>;
    }
    
    return (
      <div key={platform.id} className="absolute" style={{ left: platform.x, top: platform.y, width: platform.width }}>
        {platformContent}
        {platform.word && (
          <div className={`absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-1 transition-all duration-200 ${isTarget ? 'scale-100' : 'scale-90 opacity-80'}`}>
            {platform.word.split('').map((char, idx) => {
              let bgColor = 'bg-white', textColor = 'text-gray-600', border = 'border-b-4 border-gray-200', transform = '', animation = '';
              if (isTarget) {
                if (idx < typedChars.length) { bgColor = 'bg-green-500'; textColor = 'text-white'; border = 'border-b-4 border-green-700'; }
                else if (idx === currentCharIndex) { bgColor = 'bg-blue-500'; textColor = 'text-white'; border = 'border-b-4 border-blue-700'; transform = '-translate-y-1'; if (wrongInputShake) animation = 'animate-shake bg-red-500 border-red-700'; }
              }
              return <span key={idx} className={`flex items-center justify-center w-8 h-9 rounded-md font-bold text-xl shadow-sm transition-all duration-100 ${bgColor} ${textColor} ${border} ${transform} ${animation}`}>{char}</span>;
            })}
          </div>
        )}
      </div>
    );
  };

  // Get current sky style (CSS gradient)
  const getSkyStyle = (theme, opacity = 1) => ({
    background: theme.sky,
    opacity
  });

  // Loading screen
  if (isLoading) {
    return (
      <div className="rounded-xl shadow-2xl overflow-hidden border-4 border-white h-[500px] flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #98D8C8 50%, #7CB342 100%)' }}>
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🌳</div>
          <div className="text-xl font-bold text-white mb-4 drop-shadow-md">Loading Assets...</div>
          <div className="w-48 h-3 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-200" style={{ width: `${loadProgress}%` }}></div>
          </div>
          <div className="text-white/80 text-sm mt-2">{loadProgress}%</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl shadow-2xl overflow-hidden border-4 border-white transform transition-all">
      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0) translateY(-4px); } 25% { transform: translateX(-4px) translateY(-4px); } 75% { transform: translateX(4px) translateY(-4px); } }
        .animate-shake { animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes run-left { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(15deg); } }
        @keyframes run-right { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-15deg); } }
        .animate-run-left { animation: run-left 0.3s infinite ease-in-out; }
        .animate-run-right { animation: run-right 0.3s infinite ease-in-out; }
        @keyframes arm-swing { 0%, 100% { transform: rotate(8deg); } 50% { transform: rotate(-8deg); } }
        .animate-arm-left { animation: arm-swing 0.6s infinite ease-in-out; }
        .animate-arm-right { animation: arm-swing 0.6s infinite ease-in-out reverse; }
        @keyframes sun-pulse { 0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(255,200,0,0.5)); } 50% { transform: scale(1.1); filter: drop-shadow(0 0 20px rgba(255,200,0,0.8)); } }
        .animate-sun { animation: sun-pulse 3s infinite ease-in-out; }
        @keyframes cloud-drift { 0% { transform: translateX(0); } 50% { transform: translateX(15px); } 100% { transform: translateX(0); } }
        .animate-cloud { animation: cloud-drift 8s infinite ease-in-out; }
        .animate-cloud-slow { animation: cloud-drift 12s infinite ease-in-out; }
        @keyframes robot-walk { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(4px); } }
        .animate-robot-walk { animation: robot-walk 0.8s infinite ease-in-out; }
      `}</style>
      <input ref={inputRef} type="text" onChange={handleInputChange} className="absolute opacity-0" autoComplete="off" autoFocus />
      <div ref={gameAreaRef} className="relative h-[500px] w-full overflow-hidden font-sans" onClick={() => inputRef.current?.focus()}>
         {/* Sky with gradient - smooth transition */}
         <div className="absolute inset-0 transition-opacity duration-300" style={getSkyStyle(currentTheme, isTransitioning ? skyTransitionProgress : 1)}></div>
         {previousTheme && isTransitioning && (
           <div className="absolute inset-0" style={getSkyStyle(previousTheme, 1 - skyTransitionProgress)}></div>
         )}
         
         {/* Sky element (sun/moon/etc) - LEFT side to avoid score panel */}
         <div className="absolute top-8 left-20 text-6xl filter drop-shadow-lg select-none z-[1] animate-sun" style={{ opacity: isTransitioning ? skyTransitionProgress : 1 }}>
           {currentTheme.skyElement}
         </div>
         {previousTheme && isTransitioning && (
           <div className="absolute top-8 left-20 text-6xl filter drop-shadow-lg select-none z-[1]" style={{ opacity: 1 - skyTransitionProgress }}>
             {previousTheme.skyElement}
           </div>
         )}
         
         {/* Clouds with biome-specific color - animated */}
         <div className="absolute inset-0 pointer-events-none z-[2]">
           <div className="absolute top-16 left-40 text-5xl animate-cloud" style={{ color: currentTheme.cloudColor }}>☁️</div>
           <div className="absolute top-8 right-40 text-4xl animate-cloud-slow" style={{ color: currentTheme.cloudColor }}>☁️</div>
           <div className="absolute top-24 right-60 text-3xl animate-cloud" style={{ color: currentTheme.cloudColor }}>☁️</div>
         </div>
         
         {/* Particles */}
         {(gameState === 'playing' || gameState === 'transitioning') && <WindParticlesCSS type={currentTheme.particle} />}
         
         {/* Background trees - BEHIND ground, positioned to rise from bottom */}
         <div className="absolute bottom-0 w-full flex items-end justify-around px-4 z-[1]" style={{ height: '180px' }}>
           <img src={getBiomeAssetPath(currentTheme, 0)} alt="" className="h-40 w-auto object-contain drop-shadow-xl opacity-90" style={{ marginBottom: '40px' }} />
           <img src={getBiomeAssetPath(currentTheme, 1)} alt="" className="h-36 w-auto object-contain drop-shadow-xl opacity-85" style={{ marginBottom: '40px' }} />
           <img src={getBiomeAssetPath(currentTheme, 2)} alt="" className="h-32 w-auto object-contain drop-shadow-xl opacity-90" style={{ marginBottom: '40px' }} />
           <img src={getBiomeAssetPath(currentTheme, 3)} alt="" className="h-40 w-auto object-contain drop-shadow-xl opacity-85" style={{ marginBottom: '40px' }} />
         </div>
         
         {/* Ground - on top of trees */}
         <div className="absolute bottom-0 w-full h-12 z-[5]" style={{ backgroundColor: currentTheme.ground }}></div>
         
        <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-start z-30 pointer-events-none">
            <div className="flex flex-col gap-4">
              <div className="flex gap-1">{[...Array(maxLives)].map((_, i) => <Heart key={i} className={`w-6 h-6 drop-shadow-sm ${i < lives ? 'fill-red-500 text-red-600' : 'fill-black/20 text-transparent'}`} />)}</div>
              {(gameState === 'playing' || gameState === 'transitioning') && <div className="w-6 h-48 bg-black/20 rounded-full border-2 border-white/30 backdrop-blur-sm overflow-hidden relative"><div className="absolute bottom-0 w-full bg-gradient-to-t from-orange-500 to-yellow-400 transition-all duration-300" style={{ height: `${levelProgress}%` }}></div></div>}
            </div>
            <div className="flex flex-col gap-2 items-end">
              {(gameState === 'playing' || gameState === 'transitioning') && <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-2 text-white shadow-sm flex flex-col items-end"><span className="text-xs font-bold uppercase tracking-wider opacity-80">Score</span><span className="text-2xl font-black drop-shadow-sm">{score.toLocaleString()}</span></div>}
            </div>
        </div>
        
        {gameState === 'playing' && showLevelBadge && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-in fade-in zoom-in duration-300"><div className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-lg border-2 border-blue-400">{currentTheme.name} - Level {currentLevel}</div></div>}
        
        {/* Dev mode badge */}
        {devMode && <div className="absolute top-4 right-4 z-40"><div className="bg-red-600 text-white px-4 py-1 rounded-full font-bold text-sm shadow-lg border-2 border-red-400 animate-pulse">🔧 DEV MODE (/=skip)</div></div>}
        
        {platforms.map(p => renderPlatform(p, p.id === targetPlatformId))}
        {(gameState === 'playing' || gameState === 'paused' || gameState === 'transitioning') && renderRobot()}
        
        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center z-50 pointer-events-auto">
            <div className="text-6xl mb-4 font-black text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] tracking-tight"><span className="text-orange-400">JUMP</span><span className="text-white">TYPE</span></div>
            <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/20 w-80 mb-6">
              <div className="space-y-4">
                <div><label className="text-white/80 text-xs font-bold uppercase tracking-wider mb-2 block">Difficulty</label><div className="flex gap-2 bg-black/20 p-1 rounded-lg">{Object.keys(difficultySettings).map(d => <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-1.5 rounded-md text-sm font-bold capitalize transition-all ${difficulty === d ? 'bg-orange-500 text-white shadow-sm' : 'text-white/60 hover:text-white'}`}>{d}</button>)}</div></div>
                <div className="flex justify-between items-center text-white/80 text-sm font-medium pt-2 border-t border-white/10"><span>High Score</span><span className="text-yellow-400 font-bold">{highScores[difficulty].toLocaleString()}</span></div>
              </div>
            </div>
            <button onClick={startGame} className="bg-yellow-400 text-yellow-900 text-xl font-black py-4 px-12 rounded-2xl shadow-[0_6px_0_#b45309] hover:translate-y-1 hover:shadow-[0_4px_0_#b45309] active:translate-y-2 active:shadow-none transition-all">PLAY</button>
          </div>
        )}
        
        {gameState === 'gameOver' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in duration-300 pointer-events-auto">
            <div className="text-5xl mb-2">💀</div><h2 className="text-4xl font-black text-white mb-6 drop-shadow-md">GAME OVER</h2>
            <div className="bg-white rounded-2xl p-6 w-72 mb-8 shadow-2xl text-center"><div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Final Score</div><div className="text-4xl font-black text-gray-800 mb-4">{score.toLocaleString()}</div><div className="grid grid-cols-2 gap-4 text-left bg-gray-50 p-3 rounded-xl"><div><div className="text-gray-400 text-[10px] font-bold uppercase">Accuracy</div><div className="text-gray-700 font-bold">{accuracy}%</div></div><div><div className="text-gray-400 text-[10px] font-bold uppercase">Max Combo</div><div className="text-gray-700 font-bold text-orange-500">x{maxCombo}</div></div></div></div>
            <button onClick={startGame} className="bg-green-500 text-white text-lg font-black py-3 px-8 rounded-xl shadow-[0_4px_0_#15803d] hover:translate-y-0.5 hover:shadow-[0_2px_0_#15803d] transition-all flex items-center gap-2"><RotateCcw className="w-5 h-5" />TRY AGAIN</button>
          </div>
        )}
        
        {showLevelBanner && <div className="absolute top-20 inset-x-0 flex items-center justify-center z-40 animate-in fade-in zoom-in duration-300 pointer-events-none"><div className="bg-white/90 backdrop-blur-md px-6 py-2 rounded-full shadow-lg transform scale-110 border-2 border-white/50"><div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">{levelBannerText}</div></div></div>}
      </div>
    </div>
  );
};

export default KeyboardJumpGame;
