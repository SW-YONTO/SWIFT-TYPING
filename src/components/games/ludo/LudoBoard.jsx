import React, { useState, useMemo, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { ludoManager } from '../../../utils/ludoManager';
import LudoDice from './LudoDice';
import {
  getBoardPosition,
  getHomeColumnPosition,
  getBasePositions,
  getFinishedCenterPosition,
  getTokenMovePath,
  getTokenRewindPath,
  PLAYER_COLORS,
  SAFE_POSITIONS
} from './ludoEngine';
import { Crown, MessageSquare, Send, Smile, LogOut, Sword, Trophy, Wifi, WifiOff, Bot } from 'lucide-react';

const COLOR_STYLES = {
  red:    { bg: '#ef4444', light: '#fee2e2', border: '#b91c1c', text: 'text-red-500', fill: '#ef4444' },
  blue:   { bg: '#3b82f6', light: '#dbeafe', border: '#1d4ed8', text: 'text-blue-500', fill: '#3b82f6' },
  green:  { bg: '#10b981', light: '#d1fae5', border: '#047857', text: 'text-green-500', fill: '#10b981' },
  yellow: { bg: '#f59e0b', light: '#fef3c7', border: '#b45309', text: 'text-yellow-500', fill: '#f59e0b' }
};

const CORNER_POSITIONS = {
  red:    'bottom-3 left-3',
  blue:   'top-3 left-3',
  green:  'top-3 right-3',
  yellow: 'bottom-3 right-3'
};

import { getAvatarPath } from '../../../utils/image';

const EMOJI_LIST = ['👍', '🔥', '😂', '🎉', '😡', '👏', '👑', '😎'];

const LudoBoard = ({
  gameState,
  myPlayerId,
  validMoves = [],
  onTokenClick,
  onDiceRoll,
  isRolling,
  onSendEmoji,
  floatingEmojis = [],
  gameMode,
  chatBubbles = {},
  chatHistory = [],
  onSendChat,
  onResign,
  movingTokenId = null,
  activeAnimation = null,
  onAnimationComplete,
  onlinePlayers = []
}) => {
  const { theme, isDarkMode } = useTheme();
  const [chatInput, setChatInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [animStep, setAnimStep] = useState(0);
  const [prevAnimKey, setPrevAnimKey] = useState(null);

  const currentAnimKey = activeAnimation
    ? `${activeAnimation.movingPlayerId}-${activeAnimation.tokenId}-${activeAnimation.steps}-${activeAnimation.isRewind ? 'rewind' : 'forward'}-${activeAnimation.targetState?.updated_at || ''}`
    : null;

  if (currentAnimKey !== prevAnimKey) {
    setPrevAnimKey(currentAnimKey);
    setAnimStep(0);
  }

  const chatEndRef = React.useRef(null);

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const playersByColor = useMemo(() => {
    if (!gameState || !gameState.players) return {};
    const map = {};
    Object.values(gameState.players).forEach(p => {
      if (p.color) map[p.color] = p;
    });
    return map;
  }, [gameState]);

  const currentPlayer = gameState?.players[gameState?.currentPlayerId];
  const isMyTurn = (gameMode === 'local')
    ? (!currentPlayer?.isBot)
    : (gameState?.currentPlayerId === myPlayerId && !currentPlayer?.isBot);
  const canRoll = isMyTurn && gameState?.turnPhase === 'roll' && !isRolling;

  const validTokenIds = useMemo(() => {
    return (validMoves || []).map(m => m.tokenId);
  }, [validMoves]);

  const tileGroups = useMemo(() => {
    if (!gameState || !gameState.players) return {};
    const groups = {};

    Object.values(gameState.players).forEach(player => {
      (player.tokens || []).forEach(token => {
        let key = null;
        if (token.state === 'active' && typeof token.position === 'number') {
          key = `track_${token.position}`;
        } else if (token.state === 'home_col') {
          key = `home_${player.color}_${token.homeProgress}`;
        }
        if (key) {
          if (!groups[key]) groups[key] = [];
          groups[key].push({ playerId: player.id, color: player.color, tokenId: token.id });
        }
      });
    });

    return groups;
  }, [gameState]);

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (onSendChat) onSendChat(chatInput.trim());
    setChatInput('');
  };

  const CELL_SIZE = 40;
  const BOARD_SIZE = 15 * CELL_SIZE;

  const animPath = useMemo(() => {
    if (!activeAnimation || !activeAnimation.initialToken) return [];
    if (activeAnimation.isRewind) {
      return getTokenRewindPath(activeAnimation.color, activeAnimation.initialToken, CELL_SIZE);
    }
    return getTokenMovePath(activeAnimation.color, activeAnimation.initialToken, activeAnimation.steps, CELL_SIZE);
  }, [activeAnimation, CELL_SIZE]);

  useEffect(() => {
    if (!animPath || !animPath.length) {
      setAnimStep(0);
      return;
    }

    setAnimStep(0);
    const intervalTime = 160;

    const timer = setInterval(() => {
      setAnimStep(prev => {
        if (prev + 1 >= animPath.length) {
          clearInterval(timer);
          setTimeout(() => {
            if (onAnimationComplete && activeAnimation) {
              onAnimationComplete(activeAnimation.targetState, activeAnimation.isLocalMove);
            }
          }, 80);
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [animPath, activeAnimation, onAnimationComplete]);

  return (
    <div className="flex flex-col lg:flex-row items-start justify-center gap-8 w-full max-w-5xl mx-auto px-4 py-2 select-none">
      <style>{`
        @keyframes countdown-avatar-ring {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 140; }
        }
      `}</style>
      
      {/* ─── LEFT SIDEBAR: PLAYERS & CHAT (Single Unified Card Container) ─── */}
      <div className={`w-full lg:w-80 flex flex-col gap-4 p-4 rounded-3xl border ${theme.border} ${theme.cardBg} shadow-2xl flex-shrink-0`}>
        
        {/* Header & Resign Match Button */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className={`font-black text-xs tracking-wider uppercase ${theme.textSecondary}`}>PLAYERS & SCORECARD</h3>
            <p className="text-xs font-bold text-amber-500 mt-0.5">
              {gameMode === 'online' ? `Room: ${gameState?.roomCode || ludoManager.roomCode}` : 'Local Match'}
            </p>
          </div>
          {onResign && (
            <button
              onClick={onResign}
              className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
              title="Resign / Leave Match"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Player List */}
        <div className="flex flex-col gap-2.5">
          {(PLAYER_COLORS || []).map((color, idx) => {
            const p = playersByColor[color];
            if (!p) return null;

            const isCurrent = gameState?.currentPlayerId === p.id;
            const isMe = p.id === myPlayerId;
            const isOnline = gameMode !== 'online' || onlinePlayers.some(op => op.userId === p.id || op.user_id === p.id);
            const isDisconnected = !isOnline || !!p.resigned;

            return (
              <div
                key={color}
                className={`p-3 rounded-2xl border-2 ${isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'} shadow-sm transition-all flex items-center justify-between gap-3 ${
                  isCurrent ? 'ring-4 ring-amber-400 scale-[1.02]' : isDisconnected ? 'opacity-60 grayscale-[30%]' : 'opacity-90'
                }`}
                style={{ borderColor: COLOR_STYLES[color]?.bg }}
              >
                <div className="relative w-10 h-10 flex-shrink-0">
                  {p.avatar && getAvatarPath(p.avatar) ? (
                    <img src={getAvatarPath(p.avatar)} className="w-full h-full rounded-xl object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-sm uppercase">
                      {p.username?.charAt(0)}
                    </div>
                  )}
                  {idx === 0 && <Crown className="w-4 h-4 text-yellow-500 absolute -top-1.5 -left-1.5 filter drop-shadow" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`font-black text-sm truncate ${theme.text} ${isDisconnected ? 'line-through opacity-50' : ''}`}>
                      {p.username}
                    </span>
                    {p.isBot ? (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-500 text-black uppercase flex items-center gap-0.5">
                        <Bot className="w-2.5 h-2.5" /> AI BOT
                      </span>
                    ) : (
                      <>
                        {isMe && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500 text-black uppercase">YOU</span>
                        )}
                        {isDisconnected ? (
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/10 border border-rose-500/20" title="Offline (Disconnected)">
                            <WifiOff className="w-3 h-3 text-rose-500" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-pulse" title="Online (Connected)">
                            <Wifi className="w-3 h-3 text-emerald-500" />
                          </div>
                        )}
                      </>
                    )}
                    {isCurrent && !isDisconnected && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-black animate-pulse">TURN</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-0.5 text-[11px] font-extrabold text-slate-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Sword className="w-3.5 h-3.5 text-rose-500" />
                      <span>{p.capturesCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      <span>{p.finishedCount || 0}/4</span>
                    </div>
                  </div>
                </div>

                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: COLOR_STYLES[color]?.bg }} />
              </div>
            );
          })}
        </div>

        {/* Chat Box (Flattened inside the unified sidebar container) */}
        <div className="flex flex-col gap-2.5 border-t pt-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${theme.textSecondary} flex items-center gap-1.5 uppercase tracking-wider`}>
              <MessageSquare className="w-3.5 h-3.5 text-amber-500" /> CHAT BOX
            </span>
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-gray-400 hover:text-amber-500 transition-colors p-1 cursor-pointer"
              >
                <Smile className="w-4 h-4" />
              </button>
              {showEmojiPicker && (
                <div className={`absolute right-0 bottom-8 z-50 ${theme.cardBg} border ${theme.border} rounded-xl p-2 grid grid-cols-4 gap-1.5 shadow-2xl`}>
                  {EMOJI_LIST.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        if (onSendEmoji) onSendEmoji(emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat History Log */}
          {Array.isArray(chatHistory) && chatHistory.length > 0 && (
            <div className="max-h-28 overflow-y-auto flex flex-col gap-1 pr-1 custom-scrollbar">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${
                  isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="font-bold text-amber-500 truncate max-w-[80px]">{msg.username}:</span>
                  <span className={`truncate ${isDarkMode ? 'text-gray-200' : 'text-slate-800'}`}>{msg.text}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}

          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type message..."
              className={`flex-1 rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-amber-500 ${
                isDarkMode
                  ? 'bg-slate-900/80 border-slate-700 text-white placeholder-gray-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white font-bold text-xs flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* ─── CENTER: LUDO BOARD wrapper area ─── */}
      <div className="flex-grow flex items-center justify-center py-2 min-w-0">
        <div className="relative flex items-center justify-center p-2 rounded-3xl bg-slate-200 dark:bg-slate-900 shadow-2xl border-4 border-slate-300 dark:border-slate-800 w-full max-w-[min(600px,78vh)]">
        
        {/* Floating Emojis Overlay */}
        {(floatingEmojis || []).map(item => (
          <div
            key={item.id}
            className="absolute z-50 pointer-events-none animate-bounce text-4xl"
            style={{ left: `${item.x}%`, top: '30%' }}
          >
            {item.emoji}
          </div>
        ))}

        {/* SVG Ludo Board */}
        <svg
          viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
          className="w-full h-auto rounded-2xl shadow-inner bg-white"
        >
          {/* 1. Corner Home Yards */}
          {(PLAYER_COLORS || []).map(color => {
            const style = COLOR_STYLES[color];
            const baseCoords = getBasePositions(color) || [];

            const yardLayouts = {
              red:    { x: 0, y: 9 * CELL_SIZE, innerX: CELL_SIZE, innerY: 10 * CELL_SIZE },
              blue:   { x: 0, y: 0, innerX: CELL_SIZE, innerY: CELL_SIZE },
              green:  { x: 9 * CELL_SIZE, y: 0, innerX: 10 * CELL_SIZE, innerY: CELL_SIZE },
              yellow: { x: 9 * CELL_SIZE, y: 9 * CELL_SIZE, innerX: 10 * CELL_SIZE, innerY: 10 * CELL_SIZE }
            };

            const layout = yardLayouts[color];
            if (!layout) return null;

            return (
              <g key={`yard-${color}`}>
                <rect
                  x={layout.x}
                  y={layout.y}
                  width={6 * CELL_SIZE}
                  height={6 * CELL_SIZE}
                  fill={style.bg}
                  rx="16"
                />
                <rect
                  x={layout.innerX}
                  y={layout.innerY}
                  width={4 * CELL_SIZE}
                  height={4 * CELL_SIZE}
                  fill="#ffffff"
                  rx="12"
                />
                {baseCoords.map((coord, i) => (
                  <circle
                    key={`yard-circle-${color}-${i}`}
                    cx={(coord.x + 0.5) * CELL_SIZE}
                    cy={(coord.y + 0.5) * CELL_SIZE}
                    r={14}
                    fill={style.bg}
                    opacity="0.25"
                  />
                ))}
              </g>
            );
          })}

          {/* 2. Outer Track Cells */}
          {Array.from({ length: 52 }).map((_, idx) => {
            const pos = getBoardPosition(idx);

            let isSafe = SAFE_POSITIONS.includes(idx);
            let safeColor = null;
            if (idx === 0) safeColor = 'red';
            if (idx === 13) safeColor = 'blue';
            if (idx === 26) safeColor = 'green';
            if (idx === 39) safeColor = 'yellow';

            return (
              <g key={`track-${idx}`}>
                <rect
                  x={pos.x * CELL_SIZE}
                  y={pos.y * CELL_SIZE}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  fill={safeColor ? COLOR_STYLES[safeColor].bg : '#ffffff'}
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />
                {isSafe && !safeColor && (
                  <text
                    x={pos.x * CELL_SIZE + CELL_SIZE / 2}
                    y={pos.y * CELL_SIZE + CELL_SIZE / 2 + 7}
                    textAnchor="middle"
                    fontSize="22"
                    fill="#64748b"
                  >
                    ★
                  </text>
                )}
              </g>
            );
          })}

          {/* 3. Home Stretch Columns */}
          {PLAYER_COLORS.map(color => {
            const style = COLOR_STYLES[color];
            return Array.from({ length: 5 }).map((_, idx) => {
              const pos = getHomeColumnPosition(color, idx);
              return (
                <rect
                  key={`home-col-${color}-${idx}`}
                  x={pos.x * CELL_SIZE}
                  y={pos.y * CELL_SIZE}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  fill={style.bg}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              );
            });
          })}

          {/* 4. Center Home Triangles */}
          <polygon
            points={`${6 * CELL_SIZE},${6 * CELL_SIZE} ${9 * CELL_SIZE},${6 * CELL_SIZE} ${7.5 * CELL_SIZE},${7.5 * CELL_SIZE}`}
            fill={COLOR_STYLES.green.bg}
          />
          <polygon
            points={`${9 * CELL_SIZE},${6 * CELL_SIZE} ${9 * CELL_SIZE},${9 * CELL_SIZE} ${7.5 * CELL_SIZE},${7.5 * CELL_SIZE}`}
            fill={COLOR_STYLES.yellow.bg}
          />
          <polygon
            points={`${6 * CELL_SIZE},${9 * CELL_SIZE} ${9 * CELL_SIZE},${9 * CELL_SIZE} ${7.5 * CELL_SIZE},${7.5 * CELL_SIZE}`}
            fill={COLOR_STYLES.red.bg}
          />
          <polygon
            points={`${6 * CELL_SIZE},${6 * CELL_SIZE} ${6 * CELL_SIZE},${9 * CELL_SIZE} ${7.5 * CELL_SIZE},${7.5 * CELL_SIZE}`}
            fill={COLOR_STYLES.blue.bg}
          />

          {/* 5. Pawns Rendering with Multi-Token Stacking Offsets & Hop animations */}
          {gameState && Object.values(gameState.players || {}).map(player => {
            return (player.tokens || []).map(token => {
              const isSelectable = validTokenIds.includes(token.id) && player.id === gameState.currentPlayerId;
              let cx = 0, cy = 0;
              let key = null;

              const isThisAnimating = activeAnimation && activeAnimation.movingPlayerId === player.id && activeAnimation.tokenId === token.id && animPath && animPath.length > 0;

              if (isThisAnimating) {
                const safeStep = Math.min(animStep, animPath.length - 1);
                cx = animPath[safeStep].cx;
                cy = animPath[safeStep].cy;
              } else if (token.state === 'base') {
                const baseCoords = getBasePositions(player.color) || [];
                const coord = baseCoords[token.id % 4] || { x: 2, y: 2 };
                cx = (coord.x + 0.5) * CELL_SIZE;
                cy = (coord.y + 0.5) * CELL_SIZE;
              } else if (token.state === 'finished') {
                const centerPos = getFinishedCenterPosition(player.color, token.id, CELL_SIZE);
                cx = centerPos.x;
                cy = centerPos.y;
              } else if (token.state === 'home_col') {
                key = `home_${player.color}_${token.homeProgress}`;
                const pos = getHomeColumnPosition(player.color, token.homeProgress);
                cx = (pos.x + 0.5) * CELL_SIZE;
                cy = (pos.y + 0.5) * CELL_SIZE;
              } else if (token.state === 'active' && typeof token.position === 'number' && token.position >= 0) {
                key = `track_${token.position}`;
                const pos = getBoardPosition(token.position);
                cx = (pos.x + 0.5) * CELL_SIZE;
                cy = (pos.y + 0.5) * CELL_SIZE;
              }

              let dx = 0, dy = 0;
              let r = isSelectable ? 16 : 13;

              if (isThisAnimating) {
                r = r + 3;
                cy = cy - 6; // Lift the pawn upwards on the hop!
              } else if (key && tileGroups[key] && tileGroups[key].length > 1) {
                const group = tileGroups[key];
                const indexInGroup = group.findIndex(g => g.playerId === player.id && g.tokenId === token.id);
                const count = group.length;

                r = isSelectable ? 12 : 9.5;

                if (count === 2) {
                  const offsets = [{ x: -6, y: -6 }, { x: 6, y: 6 }];
                  dx = offsets[indexInGroup % 2].x;
                  dy = offsets[indexInGroup % 2].y;
                } else if (count === 3) {
                  const offsets = [{ x: -7, y: -5 }, { x: 7, y: -5 }, { x: 0, y: 6 }];
                  dx = offsets[indexInGroup % 3].x;
                  dy = offsets[indexInGroup % 3].y;
                } else if (count >= 4) {
                  const offsets = [{ x: -7, y: -7 }, { x: 7, y: -7 }, { x: -7, y: 7 }, { x: 7, y: 7 }];
                  dx = offsets[indexInGroup % 4].x;
                  dy = offsets[indexInGroup % 4].y;
                }
              }

              const finalCx = cx + dx;
              const finalCy = cy + dy;

              // Snap fast transition during active step animation, and normal transition otherwise
              const transitionStyle = isThisAnimating
                ? 'cx 0.15s cubic-bezier(0.25, 1, 0.5, 1), cy 0.15s cubic-bezier(0.25, 1, 0.5, 1), r 0.12s ease'
                : 'cx 0.3s cubic-bezier(0.25, 1, 0.5, 1), cy 0.3s cubic-bezier(0.25, 1, 0.5, 1), r 0.2s ease';

              return (
                <g
                  key={`${player.id}-${token.id}`}
                  onClick={() => isSelectable && onTokenClick && onTokenClick(token.id)}
                  className={`${isSelectable ? 'cursor-pointer' : ''}`}
                >
                  <circle
                    cx={finalCx}
                    cy={finalCy}
                    r={r}
                    fill={COLOR_STYLES[player.color].bg}
                    stroke={isSelectable ? "#f59e0b" : "#ffffff"}
                    strokeWidth={isSelectable ? "3.5" : "2.5"}
                    className={`filter drop-shadow-md ${isSelectable ? 'animate-pulse' : ''}`}
                    style={{ transition: transitionStyle }}
                  />
                  {isSelectable && (
                    <circle
                      cx={finalCx}
                      cy={finalCy}
                      r={r + 6}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                      className="animate-spin"
                      style={{ transformOrigin: `${finalCx}px ${finalCy}px`, animationDuration: '3s', transition: transitionStyle }}
                    />
                  )}
                  <circle
                    cx={finalCx}
                    cy={finalCy}
                    r={r > 10 ? 5 : 3.5}
                    fill="#ffffff"
                    style={{ transition: transitionStyle }}
                  />
                </g>
              );
            });
          })}
        </svg>

        {/* ─── CORNER AVATAR OVERLAYS & DICE ─── */}
        {PLAYER_COLORS.map(color => {
          const p = playersByColor[color];
          if (!p) return null;

          const isCurrent = gameState?.currentPlayerId === p.id;
          const bubble = chatBubbles[color];
          const isTopCorner = color === 'blue' || color === 'green';
          const bubblePositionClass = isTopCorner ? 'top-14 left-0' : 'bottom-14 left-0';

          return (
            <div
              key={`corner-${color}`}
              className={`absolute ${CORNER_POSITIONS[color]} flex items-center gap-2 z-20`}
            >
              {/* Avatar Pill */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl ${theme.cardBg} border-2 shadow-2xl backdrop-blur-md`}
                style={{ borderColor: COLOR_STYLES[color].bg }}
              >
                {/* Avatar with countdown ring */}
                <div
                  key={isCurrent ? `timer-${gameState?.turnCount}-${gameState?.currentPlayerId}` : `idle-${color}`}
                  className="relative w-9 h-9 flex items-center justify-center flex-shrink-0"
                >
                  {/* SVG rounded-rect countdown ring OUTSIDE the avatar */}
                  {isCurrent && (
                    <svg
                      className="absolute -inset-[3px] pointer-events-none z-20"
                      viewBox="0 0 42 42"
                      style={{ width: 'calc(100% + 6px)', height: 'calc(100% + 6px)' }}
                    >
                      {/* Background track */}
                      <rect
                        x="1.5" y="1.5" width="39" height="39" rx="10"
                        fill="none"
                        stroke={isDarkMode ? '#334155' : '#cbd5e1'}
                        strokeWidth="2.5"
                      />
                      {/* Animated shrinking border */}
                      <rect
                        x="1.5" y="1.5" width="39" height="39" rx="10"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        strokeDasharray="140"
                        strokeDashoffset="0"
                        strokeLinecap="round"
                        style={{
                          animation: 'countdown-avatar-ring 15s linear forwards'
                        }}
                      />
                    </svg>
                  )}
                  <div className="w-full h-full rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center text-white font-black text-xs z-10">
                    {p.avatar && getAvatarPath(p.avatar) ? (
                      <img src={getAvatarPath(p.avatar)} className="w-full h-full object-cover" alt="" />
                    ) : (
                      p.username?.charAt(0)?.toUpperCase()
                    )}
                  </div>
                </div>
                <span className={`font-black text-xs ${theme.text} max-w-[85px] truncate`}>
                  {p.username}
                </span>
              </div>


              {/* Dice Box (Rendered ONLY at active player corner) */}
              {isCurrent && (
                <LudoDice
                  value={gameState?.diceValue}
                  isRolling={isRolling}
                  canRoll={canRoll}
                  onRoll={onDiceRoll}
                  playerColor={color}
                />
              )}

              {/* Chat Bubble */}
              {bubble && (
                <div className={`absolute ${bubblePositionClass} z-50 bg-amber-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-2xl shadow-2xl animate-fade-in border border-amber-300 max-w-[150px] truncate`}>
                  {bubble}
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default LudoBoard;
