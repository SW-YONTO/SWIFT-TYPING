import React, { useState, Suspense } from 'react';
import { Gamepad2, Wind, Box, ArrowLeft, Trophy, Star, Clock, Car, Loader2, Mountain, AlertTriangle, Swords, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Lazy load game components for better performance
const BalloonGame = React.lazy(() => import('../components/games/BalloonGame'));
const BlockContainerGame = React.lazy(() => import('../components/games/BlockContainerGame'));
const WordRacerGame = React.lazy(() => import('../components/games/WordRacerGame'));
const KeyboardJumpGame = React.lazy(() => import('../components/games/KeyboardJumpGame'));
const SwiftArenaGame = React.lazy(() => import('../components/games/SwiftArenaGame'));
const WordDefenderGame = React.lazy(() => import('../components/games/WordDefenderGame'));

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
import swiftArenaImg from '../assets/games/swift-arena.png';
import wordDefenderImg from '../assets/games/word-defender.png';

const TypingGames = ({ currentUser }) => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
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
      shadowColor: 'hover:shadow-pink-500/25 dark:hover:shadow-pink-500/15 hover:border-pink-500/40',
      difficulty: 'Easy',
      avgTime: '2-5 min',
      type: 'single'
    },
    {
      id: 'container',
      title: 'Word Crusher',
      description: 'Blocks with words fall into a container - type them to destroy before the container overflows! Speed up as you progress.',
      icon: Box,
      image: wordCrusherImg,
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
      shadowColor: 'hover:shadow-cyan-500/25 dark:hover:shadow-cyan-500/15 hover:border-cyan-500/40',
      difficulty: 'Medium',
      avgTime: '3-7 min',
      type: 'single'
    },
    {
      id: 'racer',
      title: 'Word Racer',
      description: 'Race against AI opponents! Type words to accelerate your car and cross the finish line first. The faster you type, the faster you go!',
      icon: Car,
      image: wordRacerImg,
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      shadowColor: 'hover:shadow-orange-500/25 dark:hover:shadow-orange-500/15 hover:border-orange-500/40',
      difficulty: 'Hard',
      avgTime: '1-3 min',
      type: 'single'
    },
    {
      id: 'keyboard-jump',
      title: 'Keyboard Jump',
      description: 'Jump between platforms by typing words! Guide the robot higher through multiple themed levels. Complete levels to unlock new themes!',
      icon: Mountain,
      image: keyboardJumpImg,
      color: 'from-green-500 to-teal-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      shadowColor: 'hover:shadow-green-500/25 dark:hover:shadow-green-500/15 hover:border-green-500/40',
      difficulty: 'Medium',
      avgTime: '3-5 min',
      type: 'single'
    },
    {
      id: 'arena',
      title: 'Swift Arena',
      description: 'Compete against other players in real-time typing battles! First to type the sentence correctly wins!',
      icon: Swords,
      image: swiftArenaImg,
      color: 'from-indigo-500 to-purple-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      shadowColor: 'hover:shadow-indigo-500/25 dark:hover:shadow-indigo-500/15 hover:border-indigo-500/40',
      difficulty: 'Hard',
      avgTime: '1-3 min',
      type: 'multi'
    },
    {
      id: 'defender',
      title: 'Word Defender',
      description: 'Defend your base from falling data fragments! Lock onto words by typing their first letter and destroy them with your lasers before they breach your shields.',
      icon: Shield,
      image: wordDefenderImg,
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
      shadowColor: 'hover:shadow-cyan-500/25 dark:hover:shadow-cyan-500/15 hover:border-cyan-500/40',
      difficulty: 'Medium',
      avgTime: '2-5 min',
      type: 'single'
    }
  ];

  // Handle game selection
  const handleGameSelect = (gameId) => {
    setSelectedGame(gameId);
  };

  // Handle back to games list
  const handleBackToGames = () => {
    setShowExitConfirm(true);
  };

  // Render selected game
  if (selectedGame) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleBackToGames}
            className={`flex items-center gap-2 mb-4 px-4 py-2 rounded-lg ${theme.secondary} ${theme.text} hover:opacity-80 transition-opacity cursor-pointer`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </button>
          
          <Suspense fallback={<GameLoadingFallback theme={theme} />}>
            {selectedGame === 'balloon' && <BalloonGame currentUser={currentUser} />}
            {selectedGame === 'container' && <BlockContainerGame currentUser={currentUser} />}
            {selectedGame === 'racer' && <WordRacerGame currentUser={currentUser} />}
            {selectedGame === 'keyboard-jump' && <KeyboardJumpGame currentUser={currentUser} />}
            {selectedGame === 'arena' && <SwiftArenaGame currentUser={currentUser} />}
            {selectedGame === 'defender' && <WordDefenderGame currentUser={currentUser} />}
          </Suspense>
        </div>

        {/* Custom Glassmorphic Exit Confirmation Dialog */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <div className={`${theme.cardBg} border ${theme.border} rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in text-center`}>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-subtle">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className={`text-xl font-bold ${theme.text} mb-2`}>Exit Current Game?</h3>
              <p className={`${theme.textSecondary} text-sm mb-6`}>
                Are you sure you want to quit? Your current score, combo, and gameplay progress will be permanently lost.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className={`flex-1 py-3 rounded-lg ${theme.secondary} ${theme.text} font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer`}
                >
                  Resume Playing
                </button>
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                    setSelectedGame(null);
                  }}
                  className="flex-1 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold active:scale-95 transition-all cursor-pointer"
                >
                  Quit Game
                </button>
              </div>
            </div>
          </div>
        )}
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

        {/* Single Player Games */}
        <div className="mb-12">
          <h2 className={`text-2xl font-bold ${theme.text} mb-6 flex items-center gap-2`}>
            <Gamepad2 className={`w-6 h-6 ${theme.accent}`} />
            Single Player Games
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {games.filter(g => g.type === 'single').map((game) => {
              const Icon = game.icon;
              return (
                <div
                  key={game.id}
                  onClick={() => handleGameSelect(game.id)}
                  className={`${theme.cardBg} rounded-2xl shadow-lg border ${theme.border} overflow-hidden cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${game.shadowColor} group`}
                >
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
                  <div className="p-6">
                    <h2 className={`text-xl font-bold ${theme.text} mb-2`}>{game.title}</h2>
                    <p className={`${theme.textSecondary} text-sm mb-4`}>{game.description}</p>
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
                    <button className={`w-full py-3 rounded-lg bg-gradient-to-r ${game.color} text-white font-semibold transition-all duration-300 group-hover:shadow-lg`}>
                      Play Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Multiplayer Games */}
        <div>
          <h2 className={`text-2xl font-bold ${theme.text} mb-6 flex items-center gap-2`}>
            <Swords className={`w-6 h-6 text-indigo-500`} />
            Online Multiplayer
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {games.filter(g => g.type === 'multi').map((game) => {
              const Icon = game.icon;
              return (
                <div
                  key={game.id}
                  onClick={() => handleGameSelect(game.id)}
                  className={`${theme.cardBg} rounded-2xl shadow-lg border ${theme.border} overflow-hidden cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${game.shadowColor} group`}
                >
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
                  <div className="p-6">
                    <h2 className={`text-xl font-bold ${theme.text} mb-2`}>{game.title}</h2>
                    <p className={`${theme.textSecondary} text-sm mb-4`}>{game.description}</p>
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
                    <button className={`w-full py-3 rounded-lg bg-gradient-to-r ${game.color} text-white font-semibold transition-all duration-300 group-hover:shadow-lg`}>
                      Play Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
