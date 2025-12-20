import React, { useState } from 'react';
import { Gamepad2, Wind, Box, ArrowLeft, Trophy, Star, Clock, Car } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import BalloonGame from '../components/games/BalloonGame';
import BlockContainerGame from '../components/games/BlockContainerGame';
import WordRacerGame from '../components/games/WordRacerGame';

const TypingGames = ({ currentUser, settings }) => {
  const [selectedGame, setSelectedGame] = useState(null);
  const { theme } = useTheme();

  const games = [
    {
      id: 'balloon',
      title: 'Balloon Pop',
      description: 'Pop balloons by typing the words before they float away! Words rise from the bottom - type them before they escape at the top.',
      icon: Wind,
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
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      difficulty: 'Hard',
      avgTime: '1-3 min'
    }
  ];

  const handleGameSelect = (gameId) => {
    setSelectedGame(gameId);
  };

  const handleBackToGames = () => {
    setSelectedGame(null);
  };

  // Render selected game
  if (selectedGame === 'balloon') {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={handleBackToGames}
            className={`mb-4 flex items-center gap-2 ${theme.primary} hover:${theme.primaryHover} text-white px-4 py-2 rounded-lg transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </button>
          <BalloonGame currentUser={currentUser} settings={settings} />
        </div>
      </div>
    );
  }

  if (selectedGame === 'container') {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={handleBackToGames}
            className={`mb-4 flex items-center gap-2 ${theme.primary} hover:${theme.primaryHover} text-white px-4 py-2 rounded-lg transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </button>
          <BlockContainerGame currentUser={currentUser} settings={settings} />
        </div>
      </div>
    );
  }

  if (selectedGame === 'racer') {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={handleBackToGames}
            className={`mb-4 flex items-center gap-2 ${theme.primary} hover:${theme.primaryHover} text-white px-4 py-2 rounded-lg transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </button>
          <WordRacerGame currentUser={currentUser} settings={settings} />
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
                <div className={`h-40 bg-gradient-to-br ${game.color} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-20">
                    {/* Decorative elements */}
                    {game.id === 'balloon' && (
                      <>
                        <div className="absolute top-4 left-8 w-12 h-16 bg-white/30 rounded-full"></div>
                        <div className="absolute top-8 right-12 w-10 h-14 bg-white/20 rounded-full"></div>
                        <div className="absolute bottom-4 left-1/3 w-8 h-12 bg-white/25 rounded-full"></div>
                      </>
                    )}
                    {game.id === 'container' && (
                      <>
                        <div className="absolute top-4 left-8 w-10 h-10 bg-white/30 rotate-12"></div>
                        <div className="absolute top-12 right-16 w-8 h-8 bg-white/20 -rotate-6"></div>
                        <div className="absolute bottom-8 left-1/4 w-12 h-12 bg-white/25 rotate-45"></div>
                      </>
                    )}
                    {game.id === 'racer' && (
                      <>
                        <div className="absolute top-1/2 left-4 right-4 h-2 bg-white/30 rounded"></div>
                        <div className="absolute top-1/2 left-4 right-4 h-px bg-white/50 border-dashed" style={{ borderTopWidth: '2px', borderStyle: 'dashed' }}></div>
                        <div className="absolute top-6 left-1/4 text-2xl">🏎️</div>
                        <div className="absolute top-10 right-1/4 text-xl">🚗</div>
                        <div className="absolute bottom-8 left-1/3 text-xl">🚕</div>
                      </>
                    )}
                  </div>
                  <Icon className="w-20 h-20 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
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
