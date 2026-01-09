import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Heart } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { progressManager } from '../../utils/storage';
import { playSound } from '../../utils/soundEffects';

const wordLists = {
  easy: {
    name: 'Easy Words',
    words: ['go', 'up', 'it', 'we', 'no', 'so', 'an', 'in', 'on', 'do', 'to', 'be', 'he', 'me', 'cat', 'dog', 'run', 'sit', 'hat', 'map', 'cup', 'sun', 'big', 'red', 'pen', 'box', 'top', 'fun', 'win', 'hop']
  },
  medium: {
    name: 'Medium Words',
    words: ['apple', 'house', 'green', 'water', 'paper', 'light', 'music', 'happy', 'river', 'cloud', 'stone', 'bread', 'chair', 'plant', 'smile', 'dream', 'ocean', 'beach', 'sweet', 'night', 'table', 'phone', 'world', 'heart', 'brain']
  },
  hard: {
    name: 'Hard Words',
    words: ['keyboard', 'mountain', 'computer', 'elephant', 'building', 'exciting', 'beautiful', 'adventure', 'chocolate', 'different', 'wonderful', 'important', 'dangerous', 'celebrate', 'experience', 'butterfly', 'crocodile', 'fantastic', 'lightning', 'pineapple']
  }
};

const difficultySettings = {
  easy: { lives: 12, label: 'Easy', wordsPerLevel: 8 },
  medium: { lives: 8, label: 'Medium', wordsPerLevel: 12 },
  hard: { lives: 5, label: 'Hard', wordsPerLevel: 15 }
};

const levelThemes = [
  { name: 'Forest', sky: 'bg-gradient-to-b from-sky-400 to-blue-300', platform: { type: 'log', color: '#8B4513' }, ground: 'bg-[#4a8505]' },
  { name: 'Desert', sky: 'bg-gradient-to-b from-sky-300 to-amber-200', platform: { type: 'cactus', color: '#458B74' }, ground: 'bg-[#E3C695]' },
  { name: 'Snow', sky: 'bg-gradient-to-b from-slate-300 to-blue-200', platform: { type: 'ice', color: '#A5F2F3' }, ground: 'bg-white' },
  { name: 'Night', sky: 'bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900', platform: { type: 'stone', color: '#708090' }, ground: 'bg-slate-900' },
  { name: 'Candy', sky: 'bg-gradient-to-b from-pink-300 to-purple-200', platform: { type: 'candy', color: '#FF69B4' }, ground: 'bg-pink-400' }
];

const HIGH_SCORE_KEY = 'keyboard_jump_high_scores';
const getHighScores = () => { try { const d = localStorage.getItem(HIGH_SCORE_KEY); return d ? JSON.parse(d) : { easy: 0, medium: 0, hard: 0 }; } catch { return { easy: 0, medium: 0, hard: 0 }; } };
const saveHighScore = (diff, sc) => { const hs = getHighScores(); if (sc > hs[diff]) { hs[diff] = sc; localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(hs)); return true; } return false; };

const KeyboardJumpGame = ({ currentUser, settings }) => {
  const { theme } = useTheme();
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
  const [wordList] = useState('medium');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [soundEnabled] = useState(true);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [highScores, setHighScores] = useState(getHighScores());
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [showLevelBanner, setShowLevelBanner] = useState(false);
  const [levelBannerText, setLevelBannerText] = useState('');
  const [showLevelBadge, setShowLevelBadge] = useState(true);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [wrongInputShake, setWrongInputShake] = useState(false);
  const [robotFacing, setRobotFacing] = useState('right');

  const inputRef = useRef(null);
  const gameAreaRef = useRef(null);
  const platformIdCounter = useRef(0);

  const currentTheme = levelThemes[(currentLevel - 1) % levelThemes.length];
  const currentDifficulty = difficultySettings[difficulty];
  const wordsNeededForLevel = currentDifficulty.wordsPerLevel;
  const levelProgress = (levelWordsTyped / wordsNeededForLevel) * 100;
  const targetPlatform = platforms.find(p => p.id === targetPlatformId);

  useEffect(() => {
    if (targetPlatform && platforms.length > 0) {
       const currentP = platforms.find(p => p.id === currentPlatformId);
       const startX = currentP ? currentP.x + currentP.width/2 : playerVisualX; 
       setRobotFacing(targetPlatform.x > startX ? 'right' : 'left');
    }
  }, [targetPlatformId, platforms, currentPlatformId, playerVisualX]);

  const getRandomWord = useCallback(() => {
    const words = wordLists[wordList].words;
    return words[Math.floor(Math.random() * words.length)];
  }, [wordList]);

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
  useEffect(() => { if (gameState === 'playing' && platforms.length > 0 && !targetPlatformId) { const np = platforms.find(p => !p.completed && !p.isStart); if (np) { setTargetPlatformId(np.id); setTypedChars([]); setCurrentCharIndex(0); setConsecutiveWrong(0); } } }, [gameState, platforms, targetPlatformId]);
  useEffect(() => { if (levelWordsTyped >= wordsNeededForLevel && gameState === 'playing') handleLevelComplete(); }, [levelWordsTyped, wordsNeededForLevel, gameState]);
  useEffect(() => { if (totalChars > 0) setAccuracy(Math.round((correctChars / totalChars) * 100)); }, [totalChars, correctChars]);

  const handleLevelComplete = () => {
    const nextLevel = currentLevel + 1;
    const nextTheme = levelThemes[(nextLevel - 1) % levelThemes.length];
    setLevelBannerText(nextTheme.name);
    setShowLevelBanner(true);
    if (soundEnabled) playSound('success');
    setPlayerState('climb'); 
    let climbY = playerVisualY;
    const climbInterval = setInterval(() => { climbY -= 10; setPlayerVisualY(climbY); if (climbY < -100) { clearInterval(climbInterval); setTimeout(() => startNextLevel(nextLevel), 600); } }, 20);
  };

  const startNextLevel = (newLevel) => {
    setCurrentLevel(newLevel); setLevelWordsTyped(0); setTargetPlatformId(null); setTypedChars([]); setCurrentCharIndex(0); setConsecutiveWrong(0);
    const newPlatforms = generatePlatforms();
    setPlatforms(newPlatforms);
    if (newPlatforms.length > 0) {
      const startPlatform = newPlatforms[0];
      setCurrentPlatformId(startPlatform.id);
      const finalY = startPlatform.y - 12, startY = -400;
      setPlayerVisualX(startPlatform.x + startPlatform.width / 2 - 25);
      setPlayerVisualY(startY);
      setPlayerState('fall');
      let currentY = startY;
      const fallInterval = setInterval(() => { currentY += 15; setPlayerVisualY(currentY); if (currentY >= finalY) { setPlayerVisualY(finalY); clearInterval(fallInterval); setPlayerState('idle'); setGameState('playing'); setShowLevelBanner(false); setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 100); } }, 16);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value; e.target.value = '';
    if (gameState !== 'playing' || !targetPlatform || value.length === 0 || playerState === 'climb' || playerState === 'fall') return;
    const typedChar = value[value.length - 1].toLowerCase();
    const expectedChar = targetPlatform.word[currentCharIndex];
    if (!expectedChar) return;
    setTotalChars(prev => prev + 1);
    if (typedChar === expectedChar) {
       setCorrectChars(prev => prev + 1); setConsecutiveWrong(0); setWrongInputShake(false);
       setTypedChars(prev => [...prev, { char: expectedChar, correct: true }]);
       const nextIndex = currentCharIndex + 1;
       setCurrentCharIndex(nextIndex);
       const currentP = platforms.find(p => p.id === currentPlatformId) || { x: playerVisualX - 25, width: 170 };
       const startX = currentP.x + currentP.width/2 - 25;
       const targetDir = targetPlatform.x > currentP.x ? 1 : -1;
       const progress = nextIndex / targetPlatform.word.length;
       if (playerState === 'idle') setPlayerVisualX(startX + targetDir * (progress * 60));
       if (nextIndex >= targetPlatform.word.length) jumpToPlatform(targetPlatform);
    } else {
       setWrongInputShake(true); setTimeout(() => setWrongInputShake(false), 300);
       setConsecutiveWrong(prev => prev + 1);
       if (soundEnabled) playSound('error');
       if (consecutiveWrong >= 1) { setLives(prev => { const nl = prev - 1; if (nl <= 0) setTimeout(() => setGameState('gameOver'), 500); return Math.max(0, nl); }); setConsecutiveWrong(0); setCombo(0); }
    }
  };

  const addNewPlatformsAbove = (currentY) => {
    const gameArea = gameAreaRef.current; if (!gameArea) return;
    const areaWidth = gameArea.clientWidth;
    setPlatforms(prev => {
        const filtered = prev.filter(p => p.y < 800);
        let highestY = filtered.length > 0 ? Math.min(...filtered.map(p => p.y)) : 400;
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
    const startY = playerVisualY, startX = playerVisualX, targetY = platform.y - 12, targetX = platform.x + platform.width / 2 - 25;
    const jumpDuration = 400, startTime = performance.now();
    const animateJump = (currentTime) => {
      const elapsed = currentTime - startTime, progress = Math.min(elapsed / jumpDuration, 1);
      const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const arcHeight = Math.abs(targetY - startY) * 0.4 + 60, arc = Math.sin(progress * Math.PI) * arcHeight;
      setPlayerVisualY(startY - (startY - targetY) * easeProgress - arc);
      setPlayerVisualX(startX + (targetX - startX) * easeProgress);
      if (progress < 1) requestAnimationFrame(animateJump);
      else { setCurrentPlatformId(platform.id); setPlayerState('idle'); const np = platforms.find(p => !p.completed && !p.isStart && p.id !== platform.id); if (np) { setTargetPlatformId(np.id); setTypedChars([]); setCurrentCharIndex(0); setConsecutiveWrong(0); addNewPlatformsAbove(targetY); } if (inputRef.current) inputRef.current.focus(); }
    };
    requestAnimationFrame(animateJump);
  };

  const startGame = () => {
    setPlatforms([]);
    setTimeout(() => { const ip = generatePlatforms(); setPlatforms(ip); if (ip.length > 0) { const sp = ip[0]; setCurrentPlatformId(sp.id); setPlayerVisualY(sp.y - 12); setPlayerVisualX(sp.x + sp.width / 2 - 25); } }, 0);
    setScore(0); setLives(currentDifficulty.lives); setMaxLives(currentDifficulty.lives); setWordsTyped(0); setLevelWordsTyped(0); setCurrentLevel(1); setAccuracy(100); setTotalChars(0); setCorrectChars(0); setCombo(0); setMaxCombo(0); setTypedChars([]); setCurrentCharIndex(0); setConsecutiveWrong(0); setTargetPlatformId(null); setIsNewHighScore(false); setPlayerState('idle'); setShowLevelBanner(false); setGameState('playing'); setRobotFacing('right');
    setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 100);
  };

  useEffect(() => { if (gameState === 'gameOver' && currentUser) { const inh = saveHighScore(difficulty, score); setIsNewHighScore(inh); setHighScores(getHighScores()); progressManager.saveTestResult(currentUser.id, { type: 'game', gameType: 'keyboard-jump', score, wordsTyped, accuracy, maxCombo, difficulty, level: currentLevel, isHighScore: inh, timeSpent: wordsTyped * 2, wpm: Math.round(wordsTyped * 12), totalCharacters: correctChars, testTitle: `Keyboard Jump (${difficulty})` }); } }, [gameState, currentUser, score, wordsTyped, accuracy, maxCombo, correctChars, difficulty, currentLevel]);

  const renderRobot = () => {
    const isJumping = playerState === 'jump', isFalling = playerState === 'fall', isClimbing = playerState === 'climb', isIdle = playerState === 'idle';
    let rotation = isFalling ? '180deg' : isJumping ? (robotFacing === 'right' ? '-15deg' : '15deg') : '0deg';
    return (
      <div className="absolute z-20 pointer-events-none" style={{ left: playerVisualX, top: playerVisualY - 55, transition: isJumping ? 'none' : 'top 0.2s ease-out' }}>
        <div className="relative transition-transform duration-100" style={{ transform: `rotate(${rotation}) ${isClimbing ? 'translateY(-20px)' : ''}` }}>
          <div style={{ transform: robotFacing === 'left' ? 'scaleX(-1)' : 'scaleX(1)' }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-lg filter drop-shadow-sm animate-bounce">🌱</div>
              <div className="w-12 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl mx-auto shadow-lg border-[3px] border-blue-800 relative z-10">
                <div className="absolute inset-1.5 bg-white rounded-lg flex items-center justify-center gap-1.5">
                  <div className={`w-1.5 h-2 bg-slate-800 rounded-full ${isIdle ? 'animate-pulse' : ''}`}></div>
                  <div className={`w-1.5 h-2 bg-slate-800 rounded-full ${isIdle ? 'animate-pulse' : ''}`}></div>
                </div>
              </div>
              <div className="w-8 h-6 bg-blue-600 rounded-b-lg mx-auto -mt-1 relative z-0"><div className="absolute top-1 left-2 w-1.5 h-1.5 bg-yellow-400 rounded-full"></div><div className="absolute top-1 right-2 w-1.5 h-1.5 bg-green-400 rounded-full"></div></div>
              <div className="flex justify-center gap-1 -mt-1 relative">
                 <div className={`w-2.5 h-3 bg-blue-800 rounded-b-md transform origin-top ${(isIdle || isClimbing) ? 'animate-run-left' : ''}`}></div>
                 <div className={`w-2.5 h-3 bg-blue-800 rounded-b-md transform origin-top ${(isIdle || isClimbing) ? 'animate-run-right' : ''}`}></div>
              </div>
              <div className={`absolute top-8 -left-1 w-2.5 h-4 bg-blue-700 rounded-full origin-top ${(isIdle || isClimbing) ? 'animate-arm-left' : ''}`}></div>
              <div className={`absolute top-8 -right-1 w-2.5 h-4 bg-blue-700 rounded-full origin-top ${(isIdle || isClimbing) ? 'animate-arm-right' : ''}`}></div>
          </div>
        </div>
      </div>
    );
  };

  const renderPlatform = (platform, isTarget) => {
    const pType = currentTheme.platform.type;
    let platformContent;
    if (pType === 'cactus') platformContent = <div className="relative h-8 bg-emerald-600 rounded-full shadow-[0_4px_0_#1a4731]"><div className="absolute top-0 w-full h-full opacity-30 flex justify-around items-center"><span>|</span><span>|</span><span>|</span><span>|</span></div></div>;
    else if (pType === 'log') platformContent = <div className="relative h-7 bg-[#8B4513] rounded-full shadow-[0_4px_0_#5D2E0C] overflow-hidden"><div className="absolute top-1 left-0 w-full h-[1px] bg-white/10"></div><div className="absolute bottom-2 left-0 w-full h-[1px] bg-black/10"></div><div className="absolute -left-2 -top-1 text-green-600 transform -rotate-45">🌿</div><div className="absolute -right-2 -top-1 text-green-600 transform rotate-45">🌿</div></div>;
    else platformContent = <div className="relative h-7 rounded-full shadow-lg" style={{ backgroundColor: currentTheme.platform.color, boxShadow: '0 4px 0 rgba(0,0,0,0.2)' }}><div className="absolute top-1 left-2 right-2 h-1 bg-white/20 rounded-full"></div></div>;
    return (
        <div key={platform.id} className="absolute" style={{ left: platform.x, top: platform.y, width: platform.width }}>
            {platformContent}
            {platform.word && <div className={`absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-1 transition-all duration-200 ${isTarget ? 'scale-100' : 'scale-90 opacity-80'}`}>
              {platform.word.split('').map((char, idx) => {
                let bgColor = 'bg-white', textColor = 'text-gray-600', border = 'border-b-4 border-gray-200', transform = '', animation = '';
                if (isTarget) { if (idx < typedChars.length) { bgColor = 'bg-green-500'; textColor = 'text-white'; border = 'border-b-4 border-green-700'; } else if (idx === currentCharIndex) { bgColor = 'bg-blue-500'; textColor = 'text-white'; border = 'border-b-4 border-blue-700'; transform = '-translate-y-1'; if (wrongInputShake) animation = 'animate-shake bg-red-500 border-red-700'; } }
                return <span key={idx} className={`flex items-center justify-center w-8 h-9 rounded-md font-bold text-xl shadow-sm transition-all duration-100 ${bgColor} ${textColor} ${border} ${transform} ${animation}`}>{char}</span>;
              })}
            </div>}
        </div>
    );
  };

  return (
    <div className="rounded-xl shadow-2xl overflow-hidden border-4 border-white transform transition-all">
      <style>{`@keyframes shake { 0%, 100% { transform: translateX(0) translateY(-4px); } 25% { transform: translateX(-4px) translateY(-4px); } 75% { transform: translateX(4px) translateY(-4px); } } .animate-shake { animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both; } @keyframes run-left { 0% { transform: rotate(0deg); } 25% { transform: rotate(15deg); } 50% { transform: rotate(0deg); } 75% { transform: rotate(-10deg); } 100% { transform: rotate(0deg); } } @keyframes run-right { 0% { transform: rotate(0deg); } 25% { transform: rotate(-10deg); } 50% { transform: rotate(0deg); } 75% { transform: rotate(15deg); } 100% { transform: rotate(0deg); } } .animate-run-left { animation: run-left 0.4s infinite linear; } .animate-run-right { animation: run-right 0.4s infinite linear; } @keyframes arm-swing { 0%, 100% { transform: rotate(10deg); } 50% { transform: rotate(-10deg); } } .animate-arm-left { animation: arm-swing 0.8s infinite ease-in-out; } .animate-arm-right { animation: arm-swing 0.8s infinite ease-in-out reverse; }`}</style>
      <input ref={inputRef} type="text" onChange={handleInputChange} className="absolute opacity-0" autoComplete="off" autoFocus />
      <div ref={gameAreaRef} className={`relative h-[500px] w-full ${currentTheme.sky} overflow-hidden font-sans`} onClick={() => inputRef.current?.focus()}>
         <div className="absolute inset-0 pointer-events-none"><div className="absolute top-10 left-10 text-white/40 text-6xl">☁️</div><div className="absolute top-24 right-20 text-white/30 text-5xl">☁️</div><div className="absolute bottom-12 !-mb-4 left-0 w-full h-32 bg-white/10 rounded-t-[100%] scale-150 transform translate-y-10"></div></div>
         <div className={`absolute bottom-0 w-full h-12 ${currentTheme.ground} flex items-end justify-around pb-2 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-10`}><span className="text-2xl filter brightness-90">🌲</span><span className="text-xl filter brightness-90">🌳</span><span className="text-2xl filter brightness-90">🌲</span><span className="text-xl filter brightness-90">🌳</span><span className="text-3xl filter brightness-90">🌲</span></div>
        <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-start z-30 pointer-events-none">
            <div className="flex flex-col gap-4"><div className="flex gap-1">{[...Array(maxLives)].map((_, i) => <Heart key={i} className={`w-6 h-6 drop-shadow-sm ${i < lives ? 'fill-red-500 text-red-600' : 'fill-black/20 text-transparent'}`} />)}</div>{gameState === 'playing' && <div className="w-6 h-48 bg-black/20 rounded-full border-2 border-white/30 backdrop-blur-sm overflow-hidden relative"><div className="absolute bottom-0 w-full bg-gradient-to-t from-orange-500 to-yellow-400 transition-all duration-300" style={{ height: `${levelProgress}%` }}></div></div>}</div>
            <div className="flex flex-col gap-2 items-end">{gameState === 'playing' && <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-xl px-4 py-2 text-white shadow-sm flex flex-col items-end"><span className="text-xs font-bold uppercase tracking-wider opacity-80">Score</span><span className="text-2xl font-black drop-shadow-sm">{score.toLocaleString()}</span></div>}</div>
        </div>
        {gameState === 'playing' && showLevelBadge && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-in fade-in zoom-in duration-300"><div className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-lg border-2 border-blue-400">{currentTheme.name} - Level {currentLevel}</div></div>}
        {platforms.map(p => renderPlatform(p, p.id === targetPlatformId))}
        {(gameState === 'playing' || gameState === 'paused') && renderRobot()}
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
