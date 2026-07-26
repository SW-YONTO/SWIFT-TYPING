import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { ludoManager } from '../../../utils/ludoManager';
import { createGame } from './ludoEngine';
import LudoChat from './LudoChat';
import { Users, Copy, Check, LogIn, Plus, Crown, Loader2, Dice1, RefreshCw, Bot } from 'lucide-react';


const getAvatarPath = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('data:image/') || avatar.startsWith('http')) return avatar;
  try {
    return new URL(`../../../assets/avatars/${avatar}`, import.meta.url).href;
  } catch {
    return null;
  }
};

const LudoLobby = ({ currentUser, onGameStart, onLeave, urlRoomCode, onRoomJoined, onStartBotGame, onStartLocalGame }) => {
  const { theme, isDarkMode } = useTheme();
  const [view, setView] = useState('main'); // 'main' | 'waiting'
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [players, setPlayers] = useState([]);
  const [activeRooms, setActiveRooms] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    ludoManager.initialize(currentUser);

    ludoManager.joinLobby((rooms) => {
      const next = {};
      rooms.forEach(r => {
        next[r.code] = r;
      });
      setActiveRooms(next);
    });

    return () => {
      ludoManager.leaveLobby();
    };
  }, [currentUser]);

  useEffect(() => {
    if (urlRoomCode && view === 'main') {
      handleJoinRoom(urlRoomCode);
    }
  }, [urlRoomCode]);

  const handleCreateRoom = async () => {
    setLoading(true);
    setError('');
    try {
      const code = await ludoManager.createRoom({
        onPlayersUpdate: (updatedPlayers) => {
          setPlayers(updatedPlayers);
        },
        onStartCountdown: (payload) => {
          onGameStart(payload);
        }
      });
      setRoomCode(code);
      setView('waiting');
      if (onRoomJoined) onRoomJoined(code);
      await ludoManager.fetchActiveRooms();
    } catch (err) {
      setError('Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (codeToJoin) => {
    const targetCode = (codeToJoin || joinCode).trim();
    if (!targetCode) {
      setError('Please enter a room code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await ludoManager.joinRoom(targetCode, {
        onPlayersUpdate: (updatedPlayers) => {
          setPlayers(updatedPlayers);
        },
        onStartCountdown: (payload) => {
          onGameStart(payload);
        }
      });
      setRoomCode(targetCode);
      setView('waiting');
      if (onRoomJoined) onRoomJoined(targetCode);
    } catch (err) {
      setError(err.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (ludoManager.isHost) {
      await ludoManager.destroyRoom();
    } else {
      await ludoManager.leaveRoom();
    }
    setView('main');
    setRoomCode('');
    setPlayers([]);
    await ludoManager.fetchActiveRooms();
    setError('');
    if (onLeave) onLeave();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const aIsHost = a?.isHost ? 1 : 0;
      const bIsHost = b?.isHost ? 1 : 0;
      if (bIsHost !== aIsHost) return bIsHost - aIsHost;
      return (a?.joinTime || 0) - (b?.joinTime || 0);
    });
  }, [players]);

  const hostPlayer = sortedPlayers[0];
  const amIHost = Boolean(ludoManager.isHost) || (hostPlayer && hostPlayer.userId === ludoManager.userId);

  const handleStartGame = () => {
    const playerIds = sortedPlayers.map(p => p.userId);
    const playerInfos = sortedPlayers.map(p => ({
      id: p.userId,
      username: p.username,
      avatar: p.avatar
    }));

    const gameState = createGame(playerIds, playerInfos);
    gameState.roomCode = ludoManager.roomCode || roomCode;
    ludoManager.startGame(gameState);
    onGameStart({ gameState, startedBy: ludoManager.userId });
  };

  const handleRefresh = async () => {
    setLoading(true);
    await ludoManager.fetchActiveRooms();
    setLoading(false);
  };

  // ─── WAITING ROOM VIEW ───
  if (view === 'waiting') {
    return (
      <div className="max-w-2xl mx-auto p-4 select-none">
        <div className={`${theme.cardBg} rounded-3xl border ${theme.border} p-6 shadow-2xl space-y-6`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Dice1 className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h2 className={`text-xl font-black ${theme.text}`}>Ludo Room</h2>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-bold text-amber-500">{roomCode}</span>
                  <button
                    onClick={handleCopyCode}
                    className="p-1 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleLeaveRoom}
              className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              ← Leave Room
            </button>
          </div>

          {/* Players List */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold tracking-wider text-gray-400 uppercase">
              PLAYERS ({players.length}/4)
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {[0, 1, 2, 3].map(index => {
                const p = sortedPlayers[index];
                const isMe = p?.userId === ludoManager.userId;
                const isHost = Boolean(p?.isHost) || (isMe && amIHost);

                return (
                  <div
                    key={index}
                    className={`p-3 rounded-2xl border ${
                      p ? theme.cardBg : 'bg-slate-100 dark:bg-slate-900/30 border-dashed border-slate-300 dark:border-slate-800'
                    } flex items-center justify-between transition-all`}
                  >
                    {p ? (
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10">
                          {p.avatar && getAvatarPath(p.avatar) ? (
                            <img src={getAvatarPath(p.avatar)} className="w-full h-full rounded-xl object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-sm uppercase">
                              {p.username?.charAt(0)}
                            </div>
                          )}
                          {isHost && (
                            <Crown className="w-4 h-4 text-yellow-500 absolute -top-1.5 -left-1.5 filter drop-shadow" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-black text-sm ${theme.text}`}>{p.username}</span>
                            {isMe && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500 text-black">YOU</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 opacity-60">
                        <div className="w-10 h-10 rounded-xl border border-dashed border-gray-400 dark:border-gray-600 flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-500" />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 italic">Waiting for player to join...</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          {amIHost ? (
            <button
              onClick={handleStartGame}
              disabled={players.length < 2}
              className={`w-full py-4 rounded-2xl font-black text-base shadow-xl transition-all ${
                players.length >= 2
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-black hover:shadow-orange-500/25 active:scale-95 cursor-pointer'
                  : 'bg-slate-200 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              {players.length >= 2 ? '🚀 START MATCH' : 'Waiting for 2+ Players to Start...'}
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
              <p className="text-sm font-bold text-amber-500 animate-pulse">
                Waiting for host to start the match...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── MAIN LOBBY VIEW ───
  return (
    <div className="max-w-4xl mx-auto p-4 select-none">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Create Room Box */}
        <div className={`${theme.cardBg} rounded-3xl border ${theme.border} p-6 shadow-2xl flex flex-col justify-between space-y-6`}>
          <div>
            <h2 className={`text-xl font-black ${theme.text} mb-1 flex items-center gap-2`}>
              <Plus className="w-5 h-5 text-amber-500" /> Create Room
            </h2>
            <p className={`text-xs ${theme.textSecondary}`}>
              Host a new Ludo game, challenge smart AI bots, or play locally in person.
            </p>
          </div>

          <div className="space-y-4">
            {/* Play Bots Button */}
            <button
              onClick={onStartBotGame}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-white font-black text-base shadow-lg hover:shadow-cyan-500/25 transition-all cursor-pointer flex items-center px-4 gap-3 group active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="tracking-wide">Play Bots</span>
            </button>

            {/* Create Room Button */}
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white font-black text-base shadow-lg hover:shadow-orange-500/25 transition-all cursor-pointer flex items-center px-4 gap-3 group active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                {loading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Plus className="w-5 h-5 text-white" />}
              </div>
              <span className="tracking-wide">Create Room</span>
            </button>

            {/* Play in Person Button */}
            <button
              onClick={onStartLocalGame}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-base shadow-lg hover:shadow-purple-500/25 transition-all cursor-pointer flex items-center px-4 gap-3 group active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="tracking-wide">Play in Person</span>
            </button>
          </div>
        </div>

        {/* Join Room Box */}
        <div className={`${theme.cardBg} rounded-3xl border ${theme.border} p-6 shadow-2xl space-y-6 flex flex-col justify-between`}>
          <div>
            <h2 className={`text-xl font-black ${theme.text} mb-1 flex items-center gap-2`}>
              <LogIn className="w-5 h-5 text-amber-500" /> Join Room
            </h2>
            
            {/* Active Public Rooms */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-gray-400 uppercase">
                <div className="flex items-center gap-2">
                  <span>ACTIVE ROOMS</span>
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-gray-400 hover:text-amber-500 transition-colors cursor-pointer"
                    title="Refresh rooms"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {Object.values(activeRooms).length > 0 ? (
                  Object.values(activeRooms).map(r => (
                    <div
                      key={r.code}
                      onClick={() => handleJoinRoom(r.code)}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer group ${
                        isDarkMode
                          ? 'bg-slate-900/60 border-slate-800 hover:border-amber-500/50'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-amber-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl overflow-hidden bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 font-black text-xs">
                          {r.hostAvatar && getAvatarPath(r.hostAvatar) ? (
                            <img src={getAvatarPath(r.hostAvatar)} className="w-full h-full object-cover" alt="" />
                          ) : (
                            r.host?.charAt(0)
                          )}
                        </div>
                        <div>
                          <span className="font-mono font-bold text-amber-500 text-sm block">{r.code}</span>
                          <span className={`text-[11px] font-semibold ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>{r.host}'s room</span>
                        </div>
                      </div>
                      <span className={`text-xs font-extrabold px-2.5 py-1 rounded-xl group-hover:bg-amber-500 group-hover:text-black transition-colors ${
                        isDarkMode ? 'bg-slate-800 text-gray-300' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {r.playerCount}/4
                      </span>
                    </div>
                  ))
                ) : (
                  <div className={`p-6 rounded-2xl border border-dashed text-center ${
                    isDarkMode ? 'bg-slate-900/20 border-slate-800' : 'bg-slate-50 border-slate-300'
                  }`}>
                    <p className={`text-xs font-bold ${isDarkMode ? 'text-gray-400' : 'text-slate-600'}`}>No active rooms.</p>
                    <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>Create a room on the left to get started!</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className={`w-full border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`} />
              <span className={`absolute px-3 text-[11px] font-bold uppercase rounded ${
                isDarkMode ? 'bg-slate-900 text-gray-500' : 'bg-white text-slate-400'
              }`}>
                or enter code
              </span>
            </div>

            {error && <p className="text-xs text-rose-500 font-bold text-center">{error}</p>}

            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                className={`flex-1 rounded-2xl px-4 py-3.5 text-center font-mono font-bold text-sm border uppercase tracking-widest focus:outline-none focus:border-amber-500 ${
                  isDarkMode
                    ? 'bg-slate-900/80 border-slate-700 text-white placeholder-gray-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
              <button
                onClick={() => handleJoinRoom()}
                disabled={loading}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-black text-sm shadow-lg hover:shadow-orange-500/25 transition-all cursor-pointer active:scale-95"
              >
                Join
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LudoLobby;
