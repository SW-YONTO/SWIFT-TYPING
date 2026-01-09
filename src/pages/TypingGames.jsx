import React, { useState, Suspense } from 'react';
import { Gamepad2, Wind, Box, ArrowLeft, Trophy, Star, Clock, Car, Loader2, Mountain } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Lazy load game components for better performance
const BalloonGame = React.lazy(() => import('../components/games/BalloonGame'));
const BlockContainerGame = React.lazy(() => import('../components/games/BlockContainerGame'));
const WordRacerGame = React.lazy(() => import('../components/games/WordRacerGame'));
const KeyboardJumpGame = React.lazy(() => import('../components/games/KeyboardJumpGame'));

// Loading fallback component
const GameLoadingFallback = ({ theme }) => (
  <div className={`flex flex-col items-center justify-center min-h-[400px] ${theme.cardBg} rounded-xl`}>
    <Loader2 className={`w-12 h-12 ${theme.accent} animate-spin mb-4`} />
    <p className={`${theme.text} font-medium`}>Loading game...</p>
    <p className={`${theme.textSecondary} text-sm mt-1`}>This may take a moment</p>
  </div>
);

// Import game thumbnails
import balloonPopImg from '../assets/games/balloon-pop.png';
import wordCrusherImg from '../assets/games/word-crusher.png';
import wordRacerImg from '../assets/games/word-racer.png';
import keyboardJumpImg from '../assets/games/keyboard-jump.png';

const TypingGames = ({ currentUser, settings }) => {
  const [selectedGame, setSelectedGame] = useState(null);
  const { theme } = useTheme();

  const games = [
    {
      id: 'balloon',
      title: 'Balloon Pop',
      description: 'Pop balloons by typing the words before they float away! Words rise from the bottom - type them before they escape at the top.',
      icon: Wind,
      image: balloonPopImg,
      color: 'from-pink-500 to-purple-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      difficulty: 'Easy',
      avgTime: '2-5 min'
    },
    {
      id: 'container',
      title: 'Word Crusher',
      description: 'Blocks with words fall into a container - type them to destroy before the container overflows! Speed up as you progress.',
      icon: Box,
      image: wordCrusherImg,
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
      difficulty: 'Medium',
      avgTime: '3-7 min'
    },
    {
      id: 'racer',
      title: 'Word Racer',
      description: 'Race against AI opponents! Type words to accelerate your car and cross the finish line first. The faster you type, the faster you go!',
      icon: Car,
      image: wordRacerImg,
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      difficulty: 'Hard',
      avgTime: '1-3 min'
    },
    {
      id: 'keyboard-jump',
      title: 'Keyboard Jump',
      description: 'Jump between platforms by typing words! Guide the robot higher through multiple themed levels. Complete levels to unlock new themes!',
      icon: Mountain,
      image: keyboardJumpImg,
      color: 'from-green-500 to-teal-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      difficulty: 'Medium',
      avgTime: '3-5 min'
    }
  ];

  // Handle game selection
  const handleGameSelect = (gameId) => {
    setSelectedGame(gameId);
  };

  // Handle back to games list
  const handleBackToGames = () => {
    setSelectedGame(null);
  };

  // Render selected game
  if (selectedGame === 'balloon') {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBackToGames}
            className={`flex items-center gap-2 mb-4 px-4 py-2 rounded-lg ${theme.secondary} ${theme.text} hover:opacity-80 transition-opacity`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </button>
          <Suspense fallback={<GameLoadingFallback theme={theme} />}>
            <BalloonGame currentUser={currentUser} settings={settings} />
          </Suspense>
        </div>
      </div>
    );
  }

  if (selectedGame === 'container') {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBackToGames}
            className={`flex items-center gap-2 mb-4 px-4 py-2 rounded-lg ${theme.secondary} ${theme.text} hover:opacity-80 transition-opacity`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </button>
          <Suspense fallback={<GameLoadingFallback theme={theme} />}>
            <BlockContainerGame currentUser={currentUser} settings={settings} />
          </Suspense>
        </div>
      </div>
    );
  }

  if (selectedGame === 'racer') {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBackToGames}
            className={`flex items-center gap-2 mb-4 px-4 py-2 rounded-lg ${theme.secondary} ${theme.text} hover:opacity-80 transition-opacity`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </button>
          <Suspense fallback={<GameLoadingFallback theme={theme} />}>
            <WordRacerGame currentUser={currentUser} settings={settings} />
          </Suspense>
        </div>
      </div>
    );
  }

  if (selectedGame === 'keyboard-jump') {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBackToGames}
            className={`flex items-center gap-2 mb-4 px-4 py-2 rounded-lg ${theme.secondary} ${theme.text} hover:opacity-80 transition-opacity`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </button>
          <Suspense fallback={<GameLoadingFallback theme={theme} />}>
            <KeyboardJumpGame currentUser={currentUser} settings={settings} />
          </Suspense>
        </div>
      </div>
    );
  }

  // Render game selection hub
  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Gamepad2 className={`w-8 h-8 ${theme.accent}`} />
            <h1 className={`text-3xl font-bold ${theme.text}`}>Typing Games</h1>
          </div>
          <p className={theme.textSecondary}>
            Have fun while improving your typing skills with these interactive games!
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {games.map((game) => {
            const Icon = game.icon;
            return (
              <div
                key={game.id}
                onClick={() => handleGameSelect(game.id)}
                className={`${theme.cardBg} rounded-2xl shadow-lg border ${theme.border} overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl group`}
              >
                {/* Game Preview Area */}
                <div className={`h-48 relative overflow-hidden group`}>
                   <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300 z-10`} />
                   <img 
                      src={game.image} 
                      alt={game.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                   />
                   <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-lg">
                      <Icon className={`w-6 h-6 text-gray-800`} />
                   </div>
                </div>

                {/* Game Info */}
                <div className="p-6">
                  <h2 className={`text-xl font-bold ${theme.text} mb-2`}>{game.title}</h2>
                  <p className={`${theme.textSecondary} text-sm mb-4`}>{game.description}</p>
                  
                  {/* Game Stats */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className={`w-4 h-4 ${theme.accent}`} />
                      <span className={`text-xs ${theme.textSecondary}`}>{game.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className={`w-4 h-4 ${theme.accent}`} />
                      <span className={`text-xs ${theme.textSecondary}`}>{game.avgTime}</span>
                    </div>
                  </div>

                  {/* Play Button */}
                  <button
                    className={`w-full py-3 rounded-lg bg-gradient-to-r ${game.color} text-white font-semibold transition-all duration-300 group-hover:shadow-lg`}
                  >
                    Play Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tips Section */}
        <div className={`mt-8 ${theme.cardBg} rounded-lg shadow-lg border ${theme.border} p-6`}>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className={`w-5 h-5 ${theme.accent}`} />
            <h3 className={`text-lg font-semibold ${theme.text}`}>Game Tips</h3>
          </div>
          <ul className={`${theme.textSecondary} text-sm space-y-2`}>
            <li>• Focus on accuracy first, speed will come naturally</li>
            <li>• Keep your fingers on the home row for faster typing</li>
            <li>• Take breaks between games to avoid fatigue</li>
            <li>• Challenge yourself by increasing difficulty as you improve</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TypingGames;
