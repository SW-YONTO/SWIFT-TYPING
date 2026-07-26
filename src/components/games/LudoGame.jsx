import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ludoManager } from '../../utils/ludoManager';
import { rollDice, applyDiceRoll, getValidMoves, applyMove, skipTurn, handlePlayerResign, createGame, SAFE_POSITIONS, START_POSITIONS, getNextStepTokenState, calculatePlayerRankings, evaluateBestBotMove } from './ludo/ludoEngine';
import LudoLobby from './ludo/LudoLobby';
import LudoBoard from './ludo/LudoBoard';
import { Trophy, RotateCcw, Home, Sword, Crown } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

const getAvatarPath = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith('data:image/') || avatar.startsWith('http')) return avatar;
  try {
    return new URL(`../../assets/avatars/${avatar}`, import.meta.url).href;
  } catch {
    return null;
  }
};

const LudoGame = ({ currentUser }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlRoomCode = searchParams.get('room') || '';
  const [phase, setPhase] = useState('lobby'); // 'lobby' | 'playing' | 'gameover'
  const [gameState, setGameState] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [isRolling, setIsRolling] = useState(false);
  const [winner, setWinner] = useState(null);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [gameMode, setGameMode] = useState('online'); // 'online' | 'bots' | 'local'
  const [chatBubbles, setChatBubbles] = useState({ red: '', blue: '', green: '', yellow: '' });
  const [chatHistory, setChatHistory] = useState([]);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [movingTokenId, setMovingTokenId] = useState(null);
  const [activeAnimation, setActiveAnimation] = useState(null);
  const emojiIdRef = useRef(0);
  const skipTimerRef = useRef(null);
  const offlineTimersRef = useRef({});


  const myPlayerId = gameMode === 'online' ? (currentUser?.id || ludoManager.userId) : (gameState ? gameState.currentPlayerId : '');

  // Keep ludoManager.roomCode and user synced with props/URL
  useEffect(() => {
    if (currentUser) {
      ludoManager.updateUser(currentUser);
    }
    if (urlRoomCode) {
      ludoManager.roomCode = urlRoomCode;
    }
  }, [urlRoomCode, currentUser]);

  // 1. Reconnection on Tab Reload
  useEffect(() => {
    if (!urlRoomCode || phase === 'playing') return;

    const checkAndReconnect = async () => {
      try {
        const roomRecord = await ludoManager.checkRoomExists(urlRoomCode);
        if (roomRecord) {
          logLudo('RECONNECT', `Found room in DB (${roomRecord.status}). Restoring state...`, roomRecord);
          await ludoManager.joinRoom(urlRoomCode, {
            onGameStateSync: (dbState) => {
              if (dbState) setGameState(dbState);
            }
          });

          if (roomRecord.status === 'playing' && roomRecord.game_state) {
            setGameState(roomRecord.game_state);
            setGameMode('online');
            setPhase('playing');
          }
        }
      } catch (e) {
        console.warn('Reconnection error:', e);
      }
    };

    checkAndReconnect();
  }, [urlRoomCode, phase]);

  // Helper for timestamped logging
  const logLudo = (tag, message, data = {}) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    console.log(`%c[LUDO ${time}] [${tag}] ${message}`, 'color: #f59e0b; font-weight: bold;', data);
  };

  const pendingStateRef = useRef(null);

  // Smooth Token Movement Animation Handler (Prepares activeAnimation for UI step jumping)
  const animateTokenMove = useCallback((movingPlayerId, tokenId, targetState, isLocalMove = false) => {
    const player = gameState?.players?.[movingPlayerId];
    const tokenObj = player?.tokens?.find(t => t.id === tokenId);
    if (!player || !tokenObj) {
      setGameState(targetState);
      if (isLocalMove && gameMode === 'online') {
        ludoManager.updateGameState(targetState);
      }
      return;
    }

    const isOpeningFromBase = tokenObj.state === 'base' || tokenObj.position === -1;
    const steps = isOpeningFromBase ? 1 : (gameState.diceValue || 1);

    setActiveAnimation({
      movingPlayerId,
      tokenId,
      color: player.color,
      initialToken: JSON.parse(JSON.stringify(tokenObj)),
      steps,
      targetState,
      isLocalMove
    });
  }, [gameState, gameMode]);

  // Handle completion of pawn UI animation
  const handleAnimationComplete = useCallback((targetState, isLocalMove) => {
    // IMPORTANT: Set gameState FIRST, then clear animation, so there's never a frame
    // where animation is null but the old gameState is still rendered (causes visual glitch)
    setGameState(targetState);
    setActiveAnimation(null);
    if (isLocalMove && gameMode === 'online') {
      ludoManager.updateGameState(targetState);
    }
    if (pendingStateRef.current) {
      const next = pendingStateRef.current;
      pendingStateRef.current = null;
      setGameState(next);
    }
  }, [gameMode]);

  // 1. Database State Synchronization Handler
  const handleIncomingGameState = useCallback((newState) => {
    if (!newState) return;
    if (activeAnimation) {
      pendingStateRef.current = newState;
      return;
    }
    setGameState(newState);
  }, [activeAnimation]);

  // 2. Start Countdown & Join Channel
  const handleStartCountdown = useCallback(({ gameState: initialGameState }) => {
    const code = initialGameState?.roomCode || urlRoomCode;
    logLudo('START', `Match starting for room: ${code}`, { initialGameState });

    if (code) {
      ludoManager.subscribeToRoom(code);
    }

    setCountdown(3);
    setGameState(initialGameState);
    setGameMode('online');

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(interval);
        setCountdown(null);
        setPhase('playing');
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, [urlRoomCode]);

  // Keep ludoManager callbacks fresh to eliminate stale closures on state updates!
  useEffect(() => {
    ludoManager.onPlayersUpdate = (players) => {
      setOnlinePlayers(players || []);
    };

    if (ludoManager.roomChannel) {
      try {
        const state = ludoManager.roomChannel.presenceState();
        const players = Object.values(state).flat();
        setOnlinePlayers(players || []);
      } catch (e) {
        console.warn('Failed to retrieve initial presence list:', e);
      }
    }

    ludoManager.onGameStateSync = (newState) => {
      if (newState) {
        handleIncomingGameState(newState);
      }
    };

    ludoManager.onTokenMoveStart = ({ movingPlayerId, tokenId, targetState, userId }) => {
      if (userId && (userId === ludoManager.userId || userId === currentUser?.id)) return;
      logLudo('SYNC_REALTIME_MOVE', `Realtime move start for ${movingPlayerId}, token ${tokenId}`);
      animateTokenMove(movingPlayerId, tokenId, targetState, false);
    };

    ludoManager.onDiceRolling = ({ color, username }) => {
      logLudo('DICE_ROLLING_ANIM', `Dice rolling animation received for ${username} (${color})`);
      setIsRolling(true);
      setTimeout(() => {
        setIsRolling(false);
      }, 500);
    };

    ludoManager.onEmoji = ({ emoji, username, userId }) => {
      if (userId && (userId === ludoManager.userId || userId === currentUser?.id)) return;
      const id = emojiIdRef.current++;
      setFloatingEmojis(prev => [...prev, { id, emoji, username, x: Math.random() * 80 + 10 }]);
      setTimeout(() => {
        setFloatingEmojis(prev => prev.filter(e => e.id !== id));
      }, 2500);
    };

    ludoManager.onChat = ({ text, color, username, userId }) => {
      if (userId && (userId === ludoManager.userId || userId === currentUser?.id)) return;
      const pColor = color || 'red';
      const senderName = username || 'Opponent';
      setChatBubbles(prev => ({ ...prev, [pColor]: text }));
      setTimeout(() => {
        setChatBubbles(prev => ({ ...prev, [pColor]: '' }));
      }, 4000);
      setChatHistory(prev => [...prev, { username: senderName, text, color: pColor, timestamp: Date.now() }]);
    };

    ludoManager.onPlayAgain = () => {
      setGameState(null);
      setValidMoves([]);
      setWinner(null);
      setPhase('lobby');
    };

    ludoManager.onRoomClosed = () => {
      // Host closed the room — kick all players back to lobby
      ludoManager.leaveRoom();
      setGameState(null);
      setValidMoves([]);
      setWinner(null);
      setPhase('lobby');
      setSearchParams({}, { replace: true });
    };
  }, [handleIncomingGameState, animateTokenMove, currentUser, setSearchParams]);

  // 3. Periodic DB Fallback Polling (Every 3 seconds in online mode)
  useEffect(() => {
    if (gameMode !== 'online' || phase !== 'playing') return;

    const interval = setInterval(async () => {
      const dbState = await ludoManager.fetchGameState();
      if (dbState) {
        setGameState(prev => {
          if (!prev) return dbState;
          if (
            dbState.currentPlayerId !== prev.currentPlayerId || 
            dbState.turnPhase !== prev.turnPhase ||
            dbState.diceValue !== prev.diceValue
          ) {
            const curr = dbState.players[dbState.currentPlayerId];
            logLudo('SYNC_DB_POLL', `DB Fallback Synced state! Current turn: ${curr?.username} (${curr?.color}), Dice: ${dbState.diceValue}, Phase: ${dbState.turnPhase}`);
            return dbState;
          }
          return prev;
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [gameMode, phase]);

  // 3b. Auto-resign disconnected players after 1 minute (60 seconds)
  useEffect(() => {
    if (gameMode !== 'online' || phase !== 'playing' || !gameState) return;

    const interval = setInterval(async () => {
      const now = Date.now();
      const playersList = Object.values(gameState.players);
      const presenceUserIds = onlinePlayers.map(op => op.userId || op.user_id);

      let stateChanged = false;
      let updatedState = JSON.parse(JSON.stringify(gameState));

      for (const p of playersList) {
        if (p.resigned || p.isOffline) continue;

        const isOnline = presenceUserIds.includes(p.id);
        if (!isOnline) {
          const offlineStart = p.offlineSince || offlineTimersRef.current[p.id];
          if (!offlineStart) {
            offlineTimersRef.current[p.id] = now;
            updatedState.players[p.id].offlineSince = now;
            stateChanged = true;
          } else if (now - offlineStart >= 60000) { // 1 minute (60s)
            console.log(`[LUDO] Player ${p.username} offline for > 1 min. Auto-resigning...`);
            const amIHost = ludoManager.isHost;
            if (amIHost) {
              updatedState = handlePlayerResign(updatedState, p.id);
              delete updatedState.players[p.id].offlineSince;
              stateChanged = true;
            }
          }
        } else {
          // Player came back online, clear their offline timer
          if (p.offlineSince || offlineTimersRef.current[p.id]) {
            delete updatedState.players[p.id].offlineSince;
            delete offlineTimersRef.current[p.id];
            stateChanged = true;
          }
        }
      }

      if (stateChanged) {
        await ludoManager.updateGameState(updatedState);
        setGameState(updatedState);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onlinePlayers, gameState, phase, gameMode]);

  // 4. Turn Validation & Valid Moves Calculation
  useEffect(() => {
    if (!gameState || phase !== 'playing') return;

    // Always clear previous timers when turn state changes
    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }

    const currentPlayer = gameState.players[gameState.currentPlayerId];

    if (gameState.winner) {
      const winnerPlayer = gameState.players[gameState.winner];
      logLudo('GAME_OVER', `Winner declared: ${winnerPlayer?.username}`);
      setWinner(winnerPlayer);
      setPhase('gameover');
      return;
    }

    if (currentPlayer?.isBot) {
      setValidMoves([]);
      return;
    }

    const isMyTurn = gameMode !== 'online' || gameState.currentPlayerId === myPlayerId;

    if (isMyTurn && gameState.turnPhase === 'move') {
      const moves = getValidMoves(gameState);
      setValidMoves(moves);

      if (moves.length === 0) {
        logLudo('SKIP', `No valid moves available for ${currentPlayer?.username}. Skipping turn...`);
        skipTimerRef.current = setTimeout(() => {
          const newState = skipTurn(gameState);
          const nextPlayer = newState.players[newState.currentPlayerId];
          logLudo('TURN_SWITCH', `Turn automatically switched from ${currentPlayer?.username} to ${nextPlayer?.username}`);
          setGameState(newState);
          setValidMoves([]);
          if (gameMode === 'online') {
            ludoManager.updateGameState(newState);
          }
        }, 800);
      } else if (moves.length === 1) {
        logLudo('AUTO_MOVE', `Only 1 valid move available for ${currentPlayer?.username}. Auto-moving token #${moves[0].tokenId}...`);
        skipTimerRef.current = setTimeout(() => {
          handleTokenClick(moves[0].tokenId);
        }, 400);
      } else {
        logLudo('VALID_MOVES', `Found ${moves.length} valid move(s) for ${currentPlayer?.username}`, moves);
        // Set 15-second AFK timer for the move phase (multiple choices)
        skipTimerRef.current = setTimeout(() => {
          logLudo('AFK_AUTO_SKIP', `AFK timer triggered for ${currentPlayer?.username} (did not move). Skipping turn...`);
          const newState = skipTurn(gameState);
          setGameState(newState);
          setValidMoves([]);
          if (gameMode === 'online') {
            ludoManager.updateGameState(newState);
          }
        }, 15000);
      }
    } else if (isMyTurn && gameState.turnPhase === 'roll' && !isRolling) {
      setValidMoves([]);
      // Set 15-second AFK timer for the roll phase
      skipTimerRef.current = setTimeout(() => {
        logLudo('AFK_AUTO_SKIP', `AFK timer triggered for ${currentPlayer?.username} (did not roll). Skipping turn...`);
        const newState = skipTurn(gameState);
        setGameState(newState);
        setValidMoves([]);
        if (gameMode === 'online') {
          ludoManager.updateGameState(newState);
        }
      }, 15000);
    } else {
      setValidMoves([]);
    }

    return () => {
      if (skipTimerRef.current) {
        clearTimeout(skipTimerRef.current);
        skipTimerRef.current = null;
      }
    };
  }, [gameState, phase, myPlayerId, gameMode, isRolling]);

  // 4b. AI Bot Turn Execution Loop
  useEffect(() => {
    if (!gameState || phase !== 'playing') return;

    const currentPlayer = gameState.players[gameState.currentPlayerId];
    if (!currentPlayer || !currentPlayer.isBot) return;

    const botTimer = setTimeout(() => {
      // 1. Bot Roll Phase
      if (gameState.turnPhase === 'roll' && !isRolling) {
        setIsRolling(true);
        const value = rollDice();
        const rolledState = applyDiceRoll(gameState, value);

        logLudo('BOT_DICE_ROLL', `${currentPlayer.username} rolled a ${value}!`, { value, rolledState });

        setTimeout(() => {
          setIsRolling(false);
          setTimeout(() => {
            setGameState(rolledState);
          }, 400);
        }, 400);
      }
      // 2. Bot Move Phase
      else if (gameState.turnPhase === 'move') {
        const moves = getValidMoves(gameState);
        if (moves.length === 0) {
          logLudo('BOT_SKIP', `No valid moves for ${currentPlayer.username}. Skipping turn...`);
          const skippedState = skipTurn(gameState);
          setGameState(skippedState);
        } else {
          const diff = currentPlayer.botDifficulty || botDifficulty || 'medium';
          const bestMove = evaluateBestBotMove(gameState, moves, diff);

          logLudo('BOT_MOVE', `${currentPlayer.username} (${diff}) executing move for token #${bestMove.tokenId}`, bestMove);

          const movedState = applyMove(gameState, bestMove);
          animateTokenMove(currentPlayer.id, bestMove.tokenId, movedState, gameMode === 'online');
        }
      }
    }, 700);

    return () => clearTimeout(botTimer);
  }, [gameState, phase, isRolling, animateTokenMove, gameMode]);

  // 5. Dice Roll Action
  const handleDiceRoll = useCallback(() => {
    if (!gameState || gameState.currentPlayerId !== myPlayerId || gameState.turnPhase !== 'roll' || isRolling) return;

    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }

    const player = gameState.players[myPlayerId];
    setIsRolling(true);

    if (gameMode === 'online') {
      ludoManager.broadcastDiceRoll(player?.color);
    }

    const value = rollDice();
    const newState = applyDiceRoll(gameState, value);

    logLudo('DICE_ROLL', `Player ${player?.username} (${player?.color}) rolled a ${value}!`, { value, newState });

    if (gameMode === 'online') {
      ludoManager.updateGameState(newState);
    }

    setTimeout(() => {
      setIsRolling(false);

      // Hold static rolled number clearly on dice face for 500ms (0.5s)
      setTimeout(() => {
        setGameState(newState);
      }, 500);
    }, 400);
  }, [gameState, myPlayerId, isRolling, gameMode]);

  // 6. Token Click / Move Action (Step-by-Step 3D Jumping Movement)
  const handleTokenClick = useCallback((tokenId) => {
    if (!gameState || gameState.currentPlayerId !== myPlayerId || gameState.turnPhase !== 'move') return;

    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }

    const move = validMoves.find(m => m.tokenId === tokenId);
    if (!move) return;

    const player = gameState.players[myPlayerId];
    const newState = applyMove(gameState, move);
    const nextPlayer = newState.players[newState.currentPlayerId];

    logLudo('MOVE', `Player ${player?.username} moved token #${tokenId}. Next turn: ${nextPlayer?.username} (${nextPlayer?.color})`, { move, newState });

    setValidMoves([]);

    if (gameMode === 'online') {
      ludoManager.broadcastTokenMoveStart(myPlayerId, tokenId, newState);
    }

    animateTokenMove(myPlayerId, tokenId, newState, true);
  }, [gameState, myPlayerId, validMoves, animateTokenMove, gameMode]);


  // 7. Chat Message Action
  const handleSendChat = useCallback((text) => {
    if (!text || !text.trim()) return;
    const player = gameState?.players[myPlayerId];
    const pColor = player?.color || 'red';
    const senderName = ludoManager.username || player?.username || 'You';
    const msgObj = { username: senderName, text, color: pColor, timestamp: Date.now() };

    setChatBubbles(prev => ({ ...prev, [pColor]: text }));
    setTimeout(() => {
      setChatBubbles(prev => ({ ...prev, [pColor]: '' }));
    }, 4000);

    setChatHistory(prev => [...prev, msgObj]);

    if (gameMode === 'online') {
      ludoManager.broadcastChatMessage(text, pColor);
      setGameState(prev => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          chatHistory: [...(prev.chatHistory || []), msgObj]
        };
        ludoManager.updateGameState(updated);
        return updated;
      });
    }
  }, [gameState, myPlayerId, gameMode]);

  // 8. Emoji Reaction Action
  const handleSendEmoji = useCallback((emoji) => {
    ludoManager.broadcastEmoji(emoji);
    const id = emojiIdRef.current++;
    setFloatingEmojis(prev => [...prev, { id, emoji, username: ludoManager.username, x: Math.random() * 80 + 10 }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 2500);
  }, []);

  // 9. Resign / Forfeit Handler
  const handleResignMatch = useCallback(async () => {
    if (gameState && gameMode === 'online') {
      const updatedState = handlePlayerResign(gameState, myPlayerId);
      await ludoManager.updateGameState(updatedState);
      setGameState(updatedState);

      if (updatedState.winner) {
        const winnerPlayer = updatedState.players[updatedState.winner];
        setWinner(winnerPlayer);
        setPhase('gameover');
      } else {
        setGameState(null);
        setValidMoves([]);
        setWinner(null);
        setPhase('lobby');
        ludoManager.leaveRoom();
        setSearchParams({}, { replace: true });
      }
    } else {
      setGameState(null);
      setValidMoves([]);
      setWinner(null);
      setPhase('lobby');
      ludoManager.leaveRoom();
      setSearchParams({}, { replace: true });
    }
  }, [gameState, myPlayerId, gameMode, setSearchParams]);

  // 10. Play Again Handler (Returns players to the waiting lobby of the same room)
  const handlePlayAgain = useCallback(async () => {
    setGameState(null);
    setValidMoves([]);
    setWinner(null);
    setPhase('lobby');

    if (gameMode === 'online' && ludoManager.roomCode) {
      try {
        await supabase
          .from('ludo_rooms')
          .update({
            status: 'waiting',
            game_state: null,
            updated_at: new Date().toISOString()
          })
          .eq('room_code', ludoManager.roomCode);

        if (ludoManager.roomChannel) {
          await ludoManager.roomChannel.send({
            type: 'broadcast',
            event: 'play_again',
            payload: {}
          });
        }
      } catch (e) {
        console.warn('Failed to reset room for play again:', e);
      }
    }
  }, [gameMode]);

  // 10b. Go to Lobby Handler (Exits the current room and goes back to main screen)
  const handleGoToLobby = useCallback(() => {
    ludoManager.leaveRoom();
    setGameState(null);
    setValidMoves([]);
    setWinner(null);
    setPhase('lobby');
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const [botDifficulty, setBotDifficulty] = useState('medium');

  // 11. Offline Bot & Local Play Modes
  const handleStartBotGame = useCallback((botCount = 3, difficulty = 'medium') => {
    setGameMode('bots');
    setBotDifficulty(difficulty);

    const BOT_NAMES = ['CyberBot', 'RoboPulse', 'MechaOmega', 'NeuraBot'];
    const totalPlayers = Math.min(4, Math.max(2, botCount + 1));
    const playerIds = [currentUser?.id || 'player1'];
    const playerInfos = [
      { id: currentUser?.id || 'player1', username: currentUser?.username || 'You', avatar: currentUser?.avatar || 'avatar1.png' }
    ];

    for (let i = 1; i < totalPlayers; i++) {
      const bId = `bot_${i}`;
      playerIds.push(bId);
      playerInfos.push({
        id: bId,
        username: `${BOT_NAMES[i - 1]} (${difficulty.toUpperCase()})`,
        avatar: 'bot',
        isBot: true,
        botDifficulty: difficulty
      });
    }

    const initialGameState = createGame(playerIds, playerInfos);
    setCountdown(3);
    setGameState(initialGameState);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(interval);
        setCountdown(null);
        setPhase('playing');
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, [currentUser]);

  const handleStartLocalGame = useCallback(() => {
    setGameMode('local');
    const playerIds = ['p1', 'p2', 'p3', 'p4'];
    const playerInfos = [
      { id: 'p1', username: 'Player 1 (Red)', avatar: 'avatar1.png' },
      { id: 'p2', username: 'Player 2 (Blue)', avatar: 'avatar2.png' },
      { id: 'p3', username: 'Player 3 (Green)', avatar: 'avatar3.png' },
      { id: 'p4', username: 'Player 4 (Yellow)', avatar: 'avatar4.png' },
    ];
    const initialGameState = createGame(playerIds, playerInfos);
    setCountdown(3);
    setGameState(initialGameState);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(interval);
        setCountdown(null);
        setPhase('playing');
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, []);

  // ─── GAME OVER VIEW ───
  if (phase === 'gameover' && gameState) {
    const rankings = calculatePlayerRankings(gameState);
    const winnerPlayer = winner || (gameState.winner ? gameState.players[gameState.winner] : rankings[0]);
    const isWinner = winnerPlayer?.id === myPlayerId;

    const rankBadges = [
      { label: '1st Place', icon: '1st', bg: 'bg-gradient-to-r from-amber-400 to-yellow-600 border-amber-300 text-white shadow-md shadow-yellow-500/25' },
      { label: '2nd Place', icon: '2nd', bg: 'bg-gradient-to-r from-slate-300 to-slate-500 border-slate-200 text-white shadow-md shadow-slate-400/20' },
      { label: '3rd Place', icon: '3rd', bg: 'bg-gradient-to-r from-amber-700 to-amber-900 border-amber-600 text-white shadow-md shadow-amber-900/20' },
      { label: '4th Place', icon: '4th', bg: 'bg-gradient-to-r from-slate-600 to-slate-800 border-slate-500 text-white' }
    ];

    const COLOR_HEX = {
      red: '#ef4444',
      blue: '#3b82f6',
      green: '#10b981',
      yellow: '#f59e0b'
    };

    return (
      <div className="flex items-center justify-center min-h-[550px] p-4 select-none animate-fade-in">
        <div className={`${theme.cardBg} rounded-3xl border ${theme.border} shadow-2xl p-6 md:p-8 max-w-lg w-full text-center space-y-6 relative overflow-hidden backdrop-blur-md`}>
          {/* Top colored ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-amber-500/10 blur-xl rounded-full pointer-events-none" />

          {/* Header Banner */}
          <div className="relative flex flex-col items-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-xl mb-4 transition-transform duration-500 ${
              isWinner ? 'bg-amber-500/20 border-amber-500 text-amber-500 scale-105 animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <Trophy className={`w-12 h-12 ${isWinner ? 'text-amber-400 filter drop-shadow' : 'text-gray-400'}`} />
            </div>

            <h2 className={`text-3xl font-black tracking-tight ${isWinner ? 'text-amber-500' : theme.text}`}>
              {isWinner ? '🎉 VICTORY!' : 'MATCH OVER'}
            </h2>
            <p className={`text-sm font-bold mt-1.5 ${theme.textSecondary}`}>
              {isWinner
                ? 'Congratulations! You won the match!'
                : `${winnerPlayer?.username || 'Opponent'} won the match!`
              }
            </p>
          </div>

          {/* Standings Table (1st, 2nd, 3rd, 4th) */}
          <div className="space-y-3 text-left">
            <h3 className="text-xs font-black tracking-wider text-amber-500 uppercase px-1">
              FINAL STANDINGS ({rankings.length} PLAYERS)
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {rankings.map((p, rankIdx) => {
                const isMe = p.id === myPlayerId;
                const badge = rankBadges[rankIdx] || rankBadges[3];

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all hover:scale-[1.01] ${theme.cardBg} ${
                      isMe ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-500/5' : 'shadow-sm'
                    }`}
                    style={{ borderColor: COLOR_HEX[p.color] || '#3b82f6' }}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Rank Medal */}
                      <span className={`w-11 h-9 rounded-xl border font-black text-[11px] uppercase flex items-center justify-center flex-shrink-0 ${badge.bg}`}>
                        {badge.icon}
                      </span>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center text-white font-black text-sm flex-shrink-0 border border-slate-700/50">
                        {p.avatar ? (
                          <img
                            src={getAvatarPath(p.avatar)}
                            className="w-full h-full object-cover"
                            alt=""
                            onError={(e) => {
                              e.target.style.display = 'none';
                              // If image fails, show text initials
                              const span = document.createElement('span');
                              span.innerText = p.username?.charAt(0)?.toUpperCase() || '?';
                              e.target.parentNode.appendChild(span);
                            }}
                          />
                        ) : (
                          <span>{p.username?.charAt(0)?.toUpperCase() || '?'}</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-black text-sm ${theme.text} truncate max-w-[130px]`}>
                            {p.username}
                          </span>
                          {isMe && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500 text-black">YOU</span>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-gray-400 capitalize block mt-0.5">
                          {badge.label} • {p.color}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 text-[10px] font-black flex-shrink-0">
                      {/* Killed / Captures */}
                      <div className="flex items-center gap-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2.5 py-1.5 rounded-xl" title="Opponent tokens killed">
                        <Sword className="w-3.5 h-3.5" />
                        <span>Killed: {p.capturesCount || 0}</span>
                      </div>
                      {/* Passed / Finished */}
                      <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl" title="Tokens reached center home">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Passed: {p.finishedCount || 0}/4</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={handlePlayAgain}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-sm shadow-xl hover:shadow-orange-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again
            </button>
            <button
              onClick={handleGoToLobby}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-gray-300 font-bold text-sm hover:bg-slate-300 dark:hover:bg-slate-700 transition-all active:scale-95 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              Lobby
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── PLAYING VIEW ───
  if (phase === 'playing' && gameState) {
    return (
      <LudoBoard
        gameState={gameState}
        myPlayerId={myPlayerId}
        validMoves={validMoves}
        onTokenClick={handleTokenClick}
        onDiceRoll={handleDiceRoll}
        isRolling={isRolling}
        onSendEmoji={handleSendEmoji}
        floatingEmojis={floatingEmojis}
        gameMode={gameMode}
        chatBubbles={chatBubbles}
        chatHistory={chatHistory}
        onSendChat={handleSendChat}
        onResign={handleResignMatch}
        movingTokenId={movingTokenId}
        activeAnimation={activeAnimation}
        onAnimationComplete={handleAnimationComplete}
        onlinePlayers={onlinePlayers}
      />
    );
  }

  // ─── LOBBY VIEW ───
  return (
    <>
      <LudoLobby
        currentUser={currentUser}
        onGameStart={handleStartCountdown}
        onStartBotGame={handleStartBotGame}
        onStartLocalGame={handleStartLocalGame}
        urlRoomCode={urlRoomCode}
        onRoomJoined={(code) => setSearchParams({ room: code })}
        onLeave={() => setSearchParams({})}
      />

      {countdown !== null && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md">
          <div className="text-center animate-fade-in">
            <span className="text-[120px] font-black text-amber-500 animate-pulse block select-none">
              {countdown}
            </span>
            <p className="text-white text-xl font-bold tracking-wider mt-4 uppercase animate-pulse">
              Match Starting...
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default LudoGame;
