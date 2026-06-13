import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { arenaManager } from '../../utils/arenaManager';
import { supabase } from '../../utils/supabaseClient';
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

// Arena typing sentences — all lowercase, no capitals, longer for challenge
const ARENA_SENTENCES = [
  "the quick brown fox jumps over the lazy dog resting near the old river bank on a warm sunny afternoon.",
  "practice makes perfect when you commit to typing every single day without skipping even one session.",
  "speed and accuracy are both equally important skills that every fast typist needs to develop over time.",
  "learning to type without ever looking down at the keyboard is a habit that takes weeks of daily practice.",
  "the best way to improve your typing speed is to practice regularly and stay completely focused on every word.",
  "a journey of a thousand miles always begins with a single step taken in the right direction with courage.",
  "technology has completely changed the way we communicate share ideas and connect with people around the world.",
  "reading books every day is one of the greatest ways to expand your vocabulary and sharpen your mind.",
  "music can help you stay relaxed and deeply focused while you are working hard on something important.",
  "good things always come to those who wait patiently and work consistently toward their goals every day.",
  "every expert in any field was once a complete beginner who refused to stop trying despite early failures.",
  "success is never final and failure is never fatal what truly matters is the courage to keep moving forward.",
  "the only way to do truly great work in life is to genuinely love what you do and do it with passion.",
  "hard work will always beat raw talent when the talented person decides not to put in the necessary effort.",
  "dreams do not work on their own unless you wake up every morning and take real consistent action toward them.",
  "the future always belongs to those who dare to believe deeply in the beauty and power of their own dreams.",
  "your attitude toward challenges determines how far you will go and how much you will ultimately achieve.",
  "consistency is far more important than occasional bursts of motivation when building any long term skill.",
  "every small improvement you make each day adds up over time and eventually leads to remarkable results.",
  "the difference between those who succeed and those who give up is simply the willingness to keep going.",
  "typing faster is not just about moving your fingers quickly but about building muscle memory through repetition.",
  "a calm and focused mind will always outperform a rushed and scattered one when it comes to precision tasks.",
  "the words you type on a screen can inspire someone thousands of miles away whom you have never even met.",
  "building good habits early in life creates a strong foundation for everything you want to accomplish later.",
  "when you stop comparing yourself to others and focus on your own progress everything begins to feel easier.",
  "patience and persistence are two qualities that separate people who achieve greatness from those who almost did.",
  "your fingers should glide across the keyboard with purpose and rhythm just like a musician playing a melody.",
  "the more you practice typing under pressure the more comfortable and confident you will feel during real challenges.",
  "every character you type correctly in a race brings you one step closer to crossing the finish line first.",
  "focus on hitting each key cleanly and accurately and your speed will naturally follow without forcing it.",
  "the arena is a place where only the fastest and most accurate typists earn the right to call themselves champions.",
  "do not rush through words just to go faster slow down slightly and let accuracy guide your fingers forward.",
  "great typing speed comes from trusting your hands to know where each key is without any conscious thought.",
  "the keyboard is your instrument and every race is a performance where precision and speed must work together.",
  "in competitive typing even a single mistyped character can cost you precious seconds and change the entire outcome.",
  "developing a smooth typing flow feels effortless once your fingers have memorized the position of every single key.",
  "each match you complete in the arena makes you sharper faster and better prepared for the next challenger.",
  "the thrill of a close typing race is unmatched as both players push their limits to finish just one word faster.",
  "speed without accuracy is just noise but accuracy with growing speed is the mark of a truly skilled typist.",
  "keep your wrists relaxed your posture straight and your eyes on the text and your fingers will do the rest.",
];

const SwiftArenaGame = ({ currentUser }) => {
  const { theme } = useTheme();
  const matchSavedRef = useRef(false); // Prevent double-saving per match

  // Save match result to DB — this keeps Supabase active and logs history
  const saveMatchResult = async ({ matchData, isWin, myWpm, myTime, opponentFinalWpm }) => {
    if (matchSavedRef.current || !matchData) return;
    matchSavedRef.current = true;

    const myId = currentUser?.id || arenaManager.userId || 'anon';
    const myUsername = arenaManager.username || currentUser?.username || 'Player';
    const opponentId = matchData.opponent?.userId || 'unknown';
    const opponentUsername = matchData.opponent?.username || 'Opponent';

    try {
      await supabase.from('arena_matches').insert({
        player1_id: myId,
        player1_username: myUsername,
        player2_id: opponentId,
        player2_username: opponentUsername,
        winner_id: isWin ? myId : opponentId,
        player1_wpm: myWpm || 0,
        player2_wpm: opponentFinalWpm || 0,
        player1_time_seconds: myTime || 0,
        match_id: matchData.matchId || null,
      });
    } catch (err) {
      // Non-critical — silently ignore save errors
      console.warn('Arena match save failed:', err.message);
    }
  };
  
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

  // Reset the save guard whenever a new match starts
  useEffect(() => {
    if (appState === 'match') {
      matchSavedRef.current = false;
    }
  }, [appState]);

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
                      // Save loss to DB (opponent wpm comes from broadcast payload)
                      setMatchData((md) => {
                        setPlayerWpm((myWpm) => {
                          setPlayerTime((myTime) => {
                            saveMatchResult({
                              matchData: md,
                              isWin: false,
                              myWpm,
                              myTime,
                              opponentFinalWpm: payload.wpm || 0,
                            });
                            return myTime;
                          });
                          return myWpm;
                        });
                        return md;
                      });
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
        // Save win to DB
        setMatchData((md) => {
          setOpponentWpm((oppWpm) => {
            saveMatchResult({
              matchData: md,
              isWin: true,
              myWpm: finalWpm,
              myTime: finalTime,
              opponentFinalWpm: oppWpm,
            });
            return oppWpm;
          });
          return md;
        });
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
