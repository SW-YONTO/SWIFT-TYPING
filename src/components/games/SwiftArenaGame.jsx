import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { arenaManager } from '../../utils/arenaManager';
import ArenaTypingRace from '../ArenaTypingRace';
import { Trophy, Users, Loader2, User, Swords, ArrowRight, Zap, Clock } from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';

const getAvatarPath = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('data:image/') || avatar.startsWith('http')) return avatar;
  try {
    return new URL(`../../assets/avatars/${avatar}`, import.meta.url).href;
  } catch {
    return null;
  }
};

// Temporary local sentences fallback since we might not have the DB set up
const ARENA_SENTENCES = [
  "The quick brown fox jumps over the lazy dog near the river bank.",
  "Practice makes perfect when you type every single day without fail.",
  "Speed and accuracy are both important skills for fast typing.",
  "Learning to type without looking at the keyboard takes time.",
  "The best way to improve is to practice regularly and stay focused.",
  "A journey of a thousand miles begins with a single step forward.",
  "Technology has changed the way we communicate with each other.",
  "Reading books is a great way to expand your vocabulary skills.",
  "The sun rises in the east and sets in the west every day.",
  "Music can help you relax and focus while you are working hard.",
  "Good things come to those who wait and work with patience.",
  "Every expert was once a beginner who never gave up trying.",
  "Success is not final and failure is not fatal keep going.",
  "The only way to do great work is to love what you do daily.",
  "Time flies when you are having fun with friends and family.",
  "Hard work beats talent when talent does not work hard enough.",
  "Dreams do not work unless you take action and make them real.",
  "The future belongs to those who believe in the beauty of dreams.",
  "Life is what happens when you are busy making other plans.",
  "Actions speak louder than words so show what you can do."
];

const SwiftArenaGame = ({ currentUser }) => {
  const { theme } = useTheme();
  
  // App states: 'lobby' | 'matchmaking' | 'countdown' | 'match' | 'result'
  const [appState, setAppState] = useState('lobby');
  const [countdownValue, setCountdownValue] = useState(3);
  
  // Matchmaking queue count
  const [queueCount, setQueueCount] = useState(0);
  
  // Custom inputs
  const [roomCode, setRoomCode] = useState('');
  const [customUsername, setCustomUsername] = useState(currentUser?.username || '');
  
  // Match data
  const [matchData, setMatchData] = useState(null);
  const [sentenceText, setSentenceText] = useState("");
  
  // Opponent status
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [opponentWpm, setOpponentWpm] = useState(0);
  
  // Match results
  const [matchResult, setMatchResult] = useState(null); // 'win', 'loss'
  
  // Player status
  const [playerWpm, setPlayerWpm] = useState(0);
  const [playerTime, setPlayerTime] = useState(0);

  useEffect(() => {
    // Initialize arena manager with current user
    if (currentUser) {
      arenaManager.initialize(currentUser);
    }

    return () => {
      // Cleanup
      arenaManager.leaveMatchmaking();
      arenaManager.leaveMatch();
    };
  }, [currentUser]);

  const handleJoinMatchmaking = async () => {
    setAppState('matchmaking');
    soundEffects.playKeypress();
    setPlayerWpm(0);
    setPlayerTime(0);
    
    await arenaManager.joinMatchmaking(
      // onMatchFound
      ({ matchId, opponent, isHost, sentenceIndex }) => {
        soundEffects.playSuccess();
        setMatchData({ matchId, opponent, isHost });
        setSentenceText(ARENA_SENTENCES[sentenceIndex % ARENA_SENTENCES.length]);
        
        setAppState('countdown');
        setCountdownValue(3);
        
        // BUG FIX: Leave matchmaking queue as soon as match is found to prevent ghost queues
        arenaManager.leaveMatchmaking();
        
        let counter = 3;
        const interval = setInterval(() => {
          counter--;
          if (counter > 0) {
            setCountdownValue(counter);
            soundEffects.playKeypress();
          } else if (counter === 0) {
            setCountdownValue('GO!');
            soundEffects.playAchievement();
          } else {
            clearInterval(interval);
            setAppState('match');
            
            // Connect to the specific match channel
            arenaManager.joinMatch(
              matchId, 
              opponent.userId, 
              // onOpponentUpdate
              (payload) => {
                setOpponentProgress(payload.progress);
                setOpponentWpm(payload.wpm);
              },
              // onMatchEvent
              (payload) => {
                if (payload.type === 'finish') {
                  // Opponent finished!
                  setOpponentProgress(100);
                  
                  // Fix "Both Wins" bug by checking state functionally
                  setAppState((prev) => {
                    if (prev === 'match') {
                      setMatchResult('loss');
                      soundEffects.playError();
                      return 'result';
                    }
                    return prev;
                  });
                } else if (payload.type === 'opponent_left') {
                  setAppState((prev) => {
                    if (prev !== 'result') {
                      setMatchResult('win'); // Win by default if opponent disconnects
                      return 'result';
                    }
                    return prev;
                  });
                }
              }
            );
          }
        }, 1000);
      },
      // onQueueUpdate
      (count) => {
        setQueueCount(count);
      },
      roomCode.trim() || null,
      customUsername.trim() || null
    );
  };

  const handleCancelMatchmaking = () => {
    arenaManager.leaveMatchmaking();
    setAppState('lobby');
    soundEffects.playKeypress();
  };

  const handlePlayerProgress = (progress, currentWpm, elapsedSeconds) => {
    arenaManager.broadcastProgress(progress, currentWpm);
    setPlayerWpm(currentWpm);
    if (elapsedSeconds !== undefined) {
      setPlayerTime(elapsedSeconds);
    }
  };

  const handlePlayerFinish = (finalWpm, finalTime) => {
    arenaManager.broadcastMatchEvent('finish', { wpm: finalWpm });
    setPlayerWpm(finalWpm);
    if (finalTime !== undefined) {
      setPlayerTime(finalTime);
    }
    
    // Check if we haven't already lost
    setAppState((prev) => {
      if (prev === 'match') {
        setMatchResult('win');
        soundEffects.playAchievement();
        return 'result';
      }
      return prev;
    });
  };

  const handleReturnToLobby = () => {
    arenaManager.leaveMatch();
    setMatchData(null);
    setOpponentProgress(0);
    setOpponentWpm(0);
    setPlayerWpm(0);
    setPlayerTime(0);
    setMatchResult(null);
    setAppState('lobby');
    soundEffects.playKeypress();
  };

  // --- RENDERING VIEWS ---

  if (appState === 'match') {
    return (
      <div className={`min-h-screen ${theme.background} p-6 flex flex-col`}>
        <div className="max-w-6xl mx-auto w-full flex-1">
          {/* Match Header */}
          <div className={`mb-8 ${theme.cardBg} rounded-2xl p-6 border ${theme.border} shadow-sm`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {currentUser?.avatar ? (
                  <img src={getAvatarPath(currentUser.avatar)} alt="You" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className={`w-12 h-12 rounded-full ${theme.primary} text-white font-bold flex items-center justify-center text-xl`}>
                    {(customUsername || currentUser?.username || 'Y').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className={`text-sm font-bold ${theme.text}`}>You</div>
                  <div className={`text-xs ${theme.textSecondary}`}>Host: {matchData?.isHost ? 'Yes' : 'No'}</div>
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                <Swords className={`w-8 h-8 ${theme.accent} animate-pulse`} />
                <span className={`text-xs font-bold ${theme.textSecondary} mt-1`}>VS</span>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className={`text-sm font-bold ${theme.text}`}>{matchData?.opponent?.username || 'Opponent'}</div>
                  <div className={`text-xs ${theme.textSecondary}`}>Challenger</div>
                </div>
                {matchData?.opponent?.avatar ? (
                  <img src={getAvatarPath(matchData?.opponent?.avatar)} alt="Opponent" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className={`w-12 h-12 rounded-full ${theme.primary} flex items-center justify-center text-white font-bold opacity-80 text-xl`}>
                    {matchData?.opponent?.username?.charAt(0).toUpperCase() || 'O'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Typing Component */}
          <ArenaTypingRace 
            text={sentenceText}
            onProgress={handlePlayerProgress}
            onFinish={handlePlayerFinish}
            opponentProgress={opponentProgress}
            opponentWpm={opponentWpm}
            playerName={customUsername || currentUser?.username || 'You'}
            playerAvatar={getAvatarPath(currentUser?.avatar)}
            opponentName={matchData?.opponent?.username || 'Opponent'}
            opponentAvatar={getAvatarPath(matchData?.opponent?.avatar)}
          />
        </div>
      </div>
    );
  }

  if (appState === 'countdown') {
    return (
      <div className={`min-h-[80vh] ${theme.background} flex flex-col items-center justify-center p-6`}>
        <div className={`w-full max-w-2xl ${theme.cardBg} rounded-3xl p-12 border ${theme.border} shadow-2xl text-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 animate-pulse"></div>
          
          <h2 className={`text-3xl font-bold ${theme.textSecondary} mb-8`}>MATCH FOUND!</h2>
          
          <div className="flex items-center justify-center gap-8 mb-12 relative z-10">
            <div className="flex flex-col items-center gap-3">
              {currentUser?.avatar ? (
                <img src={getAvatarPath(currentUser.avatar)} alt="You" className="w-20 h-20 rounded-full object-cover shadow-lg border-4 border-white/10" />
              ) : (
                <div className={`w-20 h-20 rounded-full ${theme.primary} text-white text-3xl font-bold flex items-center justify-center shadow-lg`}>
                  {(customUsername || currentUser?.username || 'Y').charAt(0).toUpperCase()}
                </div>
              )}
              <span className={`font-bold text-xl ${theme.text}`}>{customUsername || currentUser?.username || 'You'}</span>
            </div>
            
            <div className={`text-4xl font-black ${theme.accent} animate-pulse`}>
              VS
            </div>
            
            <div className="flex flex-col items-center gap-3">
              {matchData?.opponent?.avatar ? (
                <img src={getAvatarPath(matchData.opponent.avatar)} alt="Opponent" className="w-20 h-20 rounded-full object-cover shadow-lg border-4 border-white/10" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-purple-500 text-white text-3xl font-bold flex items-center justify-center shadow-lg">
                  {matchData?.opponent?.username?.charAt(0).toUpperCase() || 'O'}
                </div>
              )}
              <span className={`font-bold text-xl ${theme.text}`}>{matchData?.opponent?.username || 'Opponent'}</span>
            </div>
          </div>
          
          <div className="text-8xl font-black text-indigo-500 animate-bounce relative z-10" key={countdownValue}>
            {countdownValue}
          </div>
        </div>
      </div>
    );
  }

  if (appState === 'result') {
    const isWin = matchResult === 'win';
    
    // Determine the opponent's name correctly
    const opponentName = matchData?.opponent?.username || 'Opponent';
    
    return (
      <div className={`min-h-[80vh] ${theme.background} flex items-center justify-center p-6`}>
        <div className={`w-full max-w-lg ${theme.cardBg} rounded-3xl p-8 border ${theme.border} shadow-2xl text-center relative overflow-hidden`}>
          {isWin && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(30)].map((_, i) => (
                <div key={`confetti-${i}`} className="absolute w-3 h-3 rounded-sm animate-[confetti_2.5s_ease-out_infinite]"
                     style={{
                       left: `${Math.random() * 100}%`,
                       top: `-10%`,
                       animationDelay: `${Math.random() * 2.5}s`,
                       backgroundColor: ['#fbbf24', '#f472b6', '#60a5fa', '#34d399', '#c084fc'][Math.floor(Math.random() * 5)],
                       transform: `rotate(${Math.random() * 360}deg)`
                     }}></div>
              ))}
              <style>{`
                @keyframes confetti {
                  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                  100% { transform: translateY(600px) rotate(720deg); opacity: 0; }
                }
              `}</style>
            </div>
          )}

          {!isWin && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden bg-blue-900/5 dark:bg-blue-900/20">
              {[...Array(25)].map((_, i) => (
                <div key={`rain-${i}`} className="absolute w-0.5 h-10 bg-blue-500/30 dark:bg-blue-400/20 animate-[rain_0.7s_linear_infinite]"
                     style={{
                       left: `${Math.random() * 100}%`,
                       top: `-10%`,
                       animationDelay: `${Math.random() * 0.7}s`
                     }}></div>
              ))}
              <style>{`
                @keyframes rain {
                  0% { transform: translateY(0); opacity: 1; }
                  100% { transform: translateY(600px); opacity: 0; }
                }
              `}</style>
            </div>
          )}
          
          <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 shadow-xl relative z-10 ${isWin ? theme.primary : 'bg-gray-200 dark:bg-gray-800'}`}>
            {isWin ? (
              currentUser?.avatar ? (
                <img src={getAvatarPath(currentUser.avatar)} alt="You" className="w-24 h-24 rounded-full object-cover animate-bounce border-4 border-yellow-400" />
              ) : (
                <Trophy className={`w-12 h-12 text-white animate-bounce`} />
              )
            ) : (
              currentUser?.avatar ? (
                <img src={getAvatarPath(currentUser.avatar)} alt="You" className="w-24 h-24 rounded-full object-cover border-4 border-gray-400 opacity-80 grayscale" />
              ) : (
                <User className={`w-12 h-12 text-gray-500 opacity-50`} />
              )
            )}
          </div>
          
          <h2 className={`text-3xl font-bold mb-2 ${theme.text} ${isWin ? 'animate-bounce' : ''}`}>
            {isWin ? 'Victory!' : 'Defeat!'}
          </h2>
          
          <div className="mb-8 overflow-hidden">
            {isWin ? (
              <p className={`text-lg font-bold ${theme.accent} animate-fade-in-up`}>
                You defeated {opponentName}!
              </p>
            ) : (
              <p className={`text-lg font-bold ${theme.textSecondary} animate-fade-in-up`}>
                You were defeated by {opponentName}.
              </p>
            )}
          </div>

          {/* Typing Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8 relative z-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className={`p-4 rounded-xl ${theme.mode === 'dark' ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-50 border-gray-200'} border shadow-sm`}>
              <div className="flex justify-center mb-1">
                <Zap className={`w-5 h-5 ${theme.mode === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
              </div>
              <div className={`text-xs uppercase tracking-wider ${theme.textSecondary} font-medium mb-1`}>Your Speed</div>
              <div className={`text-2xl font-black ${theme.text}`}>{playerWpm} <span className="text-xs font-normal">WPM</span></div>
            </div>
            <div className={`p-4 rounded-xl ${theme.mode === 'dark' ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-50 border-gray-200'} border shadow-sm`}>
              <div className="flex justify-center mb-1">
                <Clock className={`w-5 h-5 ${theme.mode === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
              </div>
              <div className={`text-xs uppercase tracking-wider ${theme.textSecondary} font-medium mb-1`}>Time Taken</div>
              <div className={`text-2xl font-black ${theme.text}`}>
                {playerTime > 0 ? `${playerTime}s` : '--'}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {(!roomCode || isWin) && (
              <button
                onClick={handleJoinMatchmaking}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all transform hover:-translate-y-1 ${theme.primary} shadow-lg relative overflow-hidden group`}
              >
                <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                {roomCode ? 'Wait for Next Challenger' : 'Find Next Match'}
              </button>
            )}
            <button
              onClick={handleReturnToLobby}
              className={`w-full py-4 rounded-xl font-bold ${theme.text} ${theme.secondary} transition-all transform hover:-translate-y-1 shadow-lg`}
            >
              Return to Arena Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lobby & Matchmaking
  return (
    <div className={`min-h-[80vh] ${theme.background} flex flex-col items-center justify-center p-6`}>
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-6 transform -rotate-3">
          <Swords className="w-12 h-12 text-white" />
        </div>
        <h1 className={`text-4xl md:text-5xl font-bold ${theme.text} mb-4 tracking-tight`}>
          Swift <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Arena</span>
        </h1>
        <p className={`${theme.textSecondary} max-w-lg mx-auto text-lg`}>
          Compete against other players in real-time typing battles. 
          First to complete the sentence wins!
        </p>
      </div>

      <div className={`w-full max-w-md ${theme.cardBg} rounded-3xl p-8 border ${theme.border} shadow-2xl relative overflow-hidden`}>
        {appState === 'lobby' ? (
          <div className="space-y-6">
            <div className={`p-4 rounded-xl ${theme.mode === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} flex flex-col gap-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className={`w-5 h-5 ${theme.accent}`} />
                  <span className={`font-medium ${theme.text}`}>Multiplayer Ready</span>
                </div>
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              </div>
              
              <div className="space-y-3 mt-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>Arena Username</label>
                  <input
                    type="text"
                    value={customUsername}
                    onChange={(e) => setCustomUsername(e.target.value)}
                    placeholder="Enter username"
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${theme.border} bg-transparent ${theme.text} focus:ring-2 focus:ring-indigo-500 outline-none`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${theme.textSecondary}`}>Room Code (Optional)</label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Leave empty for random"
                    maxLength={6}
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${theme.border} bg-transparent ${theme.text} focus:ring-2 focus:ring-indigo-500 outline-none uppercase font-mono`}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleJoinMatchmaking}
              className="w-full group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-xl overflow-hidden shadow-lg hover:shadow-indigo-500/30 transition-all hover:scale-[1.02] bg-[length:200%_auto] hover:animate-gradient"
            >
              Enter Matchmaking
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="text-center py-8 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
              <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto relative z-10" />
            </div>
            
            <div>
              <h3 className={`text-xl font-bold ${theme.text} mb-2`}>
                {roomCode ? `Waiting in Room: ${roomCode}` : 'Searching for Opponent...'}
              </h3>
              <p className={`${theme.textSecondary}`}>
                Players in Queue: <span className="font-bold text-indigo-500">{queueCount}</span>
              </p>
            </div>

            <button
              onClick={handleCancelMatchmaking}
              className={`px-8 py-3 rounded-xl font-bold text-red-500 border-2 border-red-500/30 hover:bg-red-500 hover:text-white transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-red-500/20 mt-4`}
            >
              Cancel Matchmaking
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwiftArenaGame;
