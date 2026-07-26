// Ludo Game Engine — Pure game logic (no UI, no network)
// Classic Ludo rules: 2-4 players, 4 tokens each, race to home

const PLAYER_COLORS = ['red', 'blue', 'green', 'yellow'];

// Board positions: 0-51 = main track, each player has a 6-cell home column
const START_POSITIONS = { red: 0, blue: 13, green: 26, yellow: 39 };

// Safe positions (star cells) — cannot be captured here
const SAFE_POSITIONS = [0, 8, 13, 21, 26, 34, 39, 47];

// Token states
const TOKEN_STATE = {
  BASE: 'base',         // In starting yard
  ACTIVE: 'active',     // On main track
  HOME_COL: 'home_col', // In home stretch
  FINISHED: 'finished'  // Reached center
};

/**
 * Creates initial game state
 */
export function createGame(playerIds, playerInfos) {
  const players = {};
  playerIds.forEach((id, index) => {
    const color = PLAYER_COLORS[index];
    players[id] = {
      id,
      username: playerInfos[index]?.username || `Player ${index + 1}`,
      avatar: playerInfos[index]?.avatar || null,
      color,
      tokens: [
        { id: 0, state: TOKEN_STATE.BASE, position: -1, homeProgress: -1 },
        { id: 1, state: TOKEN_STATE.BASE, position: -1, homeProgress: -1 },
        { id: 2, state: TOKEN_STATE.BASE, position: -1, homeProgress: -1 },
        { id: 3, state: TOKEN_STATE.BASE, position: -1, homeProgress: -1 },
      ],
      finishedCount: 0,
      capturesCount: 0,
      isBot: !!playerInfos[index]?.isBot,
      isOffline: false,
      resigned: false
    };
  });

  return {
    players,
    playerOrder: [...playerIds],
    currentPlayerIndex: 0,
    currentPlayerId: playerIds[0],
    diceValue: null,
    diceRolled: false,
    turnPhase: 'roll', // 'roll' | 'move' | 'done'
    extraTurn: false,
    winner: null,
    moveHistory: [],
    turnCount: 0
  };
}

/**
 * Roll dice (1-6)
 */
export function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

export function applyDiceRoll(state, value) {
  const newState = JSON.parse(JSON.stringify(state));
  newState.diceValue = value;
  newState.diceRolled = true;

  if (value === 6) {
    newState.consecutiveSixes = (newState.consecutiveSixes || 0) + 1;
  } else {
    newState.consecutiveSixes = 0;
  }

  // 3 Consecutive 6s Penalty Rule (Void 3rd 6 and skip turn)
  if (newState.consecutiveSixes >= 3) {
    newState.consecutiveSixes = 0;
    newState.diceValue = null;
    newState.diceRolled = false;
    advanceTurn(newState);
    return newState;
  }

  newState.turnPhase = 'move';
  return newState;
}

/**
 * Calculate distance a token traveled from its color start position
 */
function getDistanceFromStart(color, currentPos) {
  const startPos = START_POSITIONS[color];
  if (currentPos >= startPos) {
    return currentPos - startPos;
  } else {
    return (52 - startPos) + currentPos;
  }
}

/**
 * Get valid moves for current player
 */
export function getValidMoves(state) {
  if (!state || !state.diceValue || state.turnPhase !== 'move') return [];

  const player = state.players[state.currentPlayerId];
  if (!player || player.isOffline || player.resigned) return [];

  const dice = state.diceValue;
  const validMoves = [];

  player.tokens.forEach(token => {
    if (token.state === TOKEN_STATE.FINISHED) return;

    if (token.state === TOKEN_STATE.BASE) {
      if (dice === 6) {
        validMoves.push({
          tokenId: token.id,
          startState: TOKEN_STATE.BASE,
          startPos: -1,
          destState: TOKEN_STATE.ACTIVE,
          destPosition: START_POSITIONS[player.color],
          destHomeProgress: -1
        });
      }
    } else if (token.state === TOKEN_STATE.ACTIVE) {
      const currentDist = getDistanceFromStart(player.color, token.position);
      const newDist = currentDist + dice;

      if (newDist <= 50) {
        const nextPos = (token.position + dice) % 52;
        validMoves.push({
          tokenId: token.id,
          startState: TOKEN_STATE.ACTIVE,
          startPos: token.position,
          destState: TOKEN_STATE.ACTIVE,
          destPosition: nextPos,
          destHomeProgress: -1
        });
      } else if (newDist <= 56) {
        const homeProgress = newDist - 51;
        const isFinish = homeProgress === 5;
        validMoves.push({
          tokenId: token.id,
          startState: TOKEN_STATE.ACTIVE,
          startPos: token.position,
          destState: isFinish ? TOKEN_STATE.FINISHED : TOKEN_STATE.HOME_COL,
          destPosition: -1,
          destHomeProgress: homeProgress
        });
      }
    } else if (token.state === TOKEN_STATE.HOME_COL) {
      const newProgress = token.homeProgress + dice;
      if (newProgress <= 5) {
        const isFinish = newProgress === 5;
        validMoves.push({
          tokenId: token.id,
          startState: TOKEN_STATE.HOME_COL,
          startPos: token.position,
          destState: isFinish ? TOKEN_STATE.FINISHED : TOKEN_STATE.HOME_COL,
          destPosition: -1,
          destHomeProgress: newProgress
        });
      }
    }
  });

  return validMoves;
}

/**
 * Advance turn to next active player
 */
function advanceTurn(state) {
  let nextIndex = (state.currentPlayerIndex + 1) % state.playerOrder.length;
  let attempts = 0;

  while (attempts < state.playerOrder.length) {
    const candidateId = state.playerOrder[nextIndex];
    const player = state.players[candidateId];
    if (player && !player.isOffline && !player.resigned) {
      break;
    }
    nextIndex = (nextIndex + 1) % state.playerOrder.length;
    attempts++;
  }

  state.currentPlayerIndex = nextIndex;
  state.currentPlayerId = state.playerOrder[state.currentPlayerIndex];
  state.diceValue = null;
  state.diceRolled = false;
  state.turnPhase = 'roll';
  state.extraTurn = false;
  state.consecutiveSixes = 0;
  state.turnCount++;
}

/**
 * Apply move to state
 */
export function applyMove(state, move) {
  const newState = JSON.parse(JSON.stringify(state));
  const player = newState.players[newState.currentPlayerId];
  const token = player.tokens.find(t => t.id === move.tokenId);

  if (!token) return newState;

  let captured = false;
  let finished = false;

  token.state = move.destState;
  token.position = move.destPosition;
  token.homeProgress = move.destHomeProgress;

  if (move.destState === TOKEN_STATE.FINISHED) {
    finished = true;
    player.finishedCount++;
    if (player.finishedCount === 4) {
      newState.winner = player.id;
      newState.turnPhase = 'done';
      return newState;
    }
  } else if (move.destState === TOKEN_STATE.ACTIVE && !SAFE_POSITIONS.includes(move.destPosition)) {
    Object.values(newState.players).forEach(otherPlayer => {
      if (otherPlayer.id === player.id) return;
      otherPlayer.tokens.forEach(otherToken => {
        if (otherToken.state === TOKEN_STATE.ACTIVE && otherToken.position === move.destPosition) {
          otherToken.state = TOKEN_STATE.BASE;
          otherToken.position = -1;
          otherToken.homeProgress = -1;
          captured = true;
          player.capturesCount = (player.capturesCount || 0) + 1;
        }
      });
    });
  }

  const getsExtraTurn = newState.diceValue === 6 || captured || finished;

  if (getsExtraTurn) {
    newState.diceValue = null;
    newState.diceRolled = false;
    newState.turnPhase = 'roll';
    newState.extraTurn = true;
  } else {
    advanceTurn(newState);
  }

  newState.moveHistory.push({
    playerId: player.id,
    color: player.color,
    tokenId: token.id,
    from: move.startPos,
    to: move.destPosition,
    captured,
    finished
  });

  return newState;
}

/**
 * Skip current player's turn
 */
export function skipTurn(state) {
  const newState = JSON.parse(JSON.stringify(state));
  advanceTurn(newState);
  return newState;
}

/**
 * Handle player resignation
 */
export function handlePlayerResign(state, playerId) {
  const newState = JSON.parse(JSON.stringify(state));
  if (newState.players[playerId]) {
    newState.players[playerId].isOffline = true;
    newState.players[playerId].resigned = true;
  }

  const activePlayers = Object.values(newState.players).filter(p => !p.isOffline && !p.resigned);

  if (activePlayers.length <= 1 && activePlayers.length > 0) {
    newState.winner = activePlayers[0].id;
    newState.turnPhase = 'done';
  } else if (activePlayers.length > 1) {
    if (newState.currentPlayerId === playerId) {
      advanceTurn(newState);
    }
  }

  return newState;
}

/**
 * Track coordinates mapping (0-51) to 15x15 SVG board
 */
export function getBoardPosition(absolutePos) {
  const TRACK_COORDS = [
    {x:6, y:13}, {x:6, y:12}, {x:6, y:11}, {x:6, y:10}, {x:6, y:9},
    {x:5, y:8},
    {x:4, y:8}, {x:3, y:8}, {x:2, y:8}, {x:1, y:8}, {x:0, y:8},
    {x:0, y:7}, {x:0, y:6},
    {x:1, y:6}, {x:2, y:6}, {x:3, y:6}, {x:4, y:6}, {x:5, y:6},
    {x:6, y:5},
    {x:6, y:4}, {x:6, y:3}, {x:6, y:2}, {x:6, y:1}, {x:6, y:0},
    {x:7, y:0}, {x:8, y:0},
    {x:8, y:1}, {x:8, y:2}, {x:8, y:3}, {x:8, y:4}, {x:8, y:5},
    {x:9, y:6},
    {x:10, y:6}, {x:11, y:6}, {x:12, y:6}, {x:13, y:6}, {x:14, y:6},
    {x:14, y:7}, {x:14, y:8},
    {x:13, y:8}, {x:12, y:8}, {x:11, y:8}, {x:10, y:8}, {x:9, y:8},
    {x:8, y:9},
    {x:8, y:10}, {x:8, y:11}, {x:8, y:12}, {x:8, y:13}, {x:8, y:14},
    {x:7, y:14}, {x:6, y:14}
  ];

  return TRACK_COORDS[absolutePos] || { x: 7, y: 7 };
}

/**
 * Home column coordinates
 */
export function getHomeColumnPosition(color, homeProgress) {
  const HOME_COORDS = {
    red:    [{x:7,y:13}, {x:7,y:12}, {x:7,y:11}, {x:7,y:10}, {x:7,y:9}, {x:7,y:8}],
    blue:   [{x:1,y:7},  {x:2,y:7},  {x:3,y:7},  {x:4,y:7},  {x:5,y:7}, {x:6,y:7}],
    green:  [{x:7,y:1},  {x:7,y:2},  {x:7,y:3},  {x:7,y:4},  {x:7,y:5}, {x:7,y:6}],
    yellow: [{x:13,y:7}, {x:12,y:7}, {x:11,y:7}, {x:10,y:7}, {x:9,y:7}, {x:8,y:7}]
  };

  return HOME_COORDS[color]?.[homeProgress] || { x: 7, y: 7 };
}

/**
 * Base yard coordinates
 */
export function getBasePositions(color) {
  const BASE_COORDS = {
    red:    [{x:2, y:11}, {x:3, y:11}, {x:2, y:12}, {x:3, y:12}],
    blue:   [{x:2, y:2},  {x:3, y:2},  {x:2, y:3},  {x:3, y:3}],
    green:  [{x:11, y:2}, {x:12, y:2}, {x:11, y:3}, {x:12, y:3}],
    yellow: [{x:11, y:11},{x:12, y:11},{x:11, y:12},{x:12, y:12}]
  };

  return BASE_COORDS[color] || [];
}

/**
 * Calculate exact next step position state for token movement animation
 */
export function getNextStepTokenState(color, state, position, homeProgress) {
  // Only BASE tokens should jump to start position
  if (state === TOKEN_STATE.BASE) {
    return {
      state: TOKEN_STATE.ACTIVE,
      position: START_POSITIONS[color],
      homeProgress: -1
    };
  }

  if (state === TOKEN_STATE.HOME_COL) {
    if (homeProgress >= 4) {
      return {
        state: TOKEN_STATE.FINISHED,
        position: -1,
        homeProgress: 5
      };
    } else {
      return {
        state: TOKEN_STATE.HOME_COL,
        position: -1,
        homeProgress: homeProgress + 1
      };
    }
  }

  if (state === TOKEN_STATE.ACTIVE) {
    const currentDist = getDistanceFromStart(color, position);
    if (currentDist === 50) {
      return {
        state: TOKEN_STATE.HOME_COL,
        position: -1,
        homeProgress: 0
      };
    } else {
      return {
        state: TOKEN_STATE.ACTIVE,
        position: (position + 1) % 52,
        homeProgress: -1
      };
    }
  }

  return { state, position, homeProgress };
}

/**
 * Calculate step-by-step coordinate path for token jumping animation
 */
export function getTokenMovePath(color, token, steps, CELL_SIZE = 40) {
  const path = [];
  if (!token) return path;

  let currentState = token.state;
  let currentPos = token.position;
  let currentHomeProg = token.homeProgress;
  const tokenId = token.id;

  const actualSteps = currentState === TOKEN_STATE.BASE || currentPos === -1 ? 1 : steps;

  for (let i = 0; i < actualSteps; i++) {
    const next = getNextStepTokenState(color, currentState, currentPos, currentHomeProg);
    currentState = next.state;
    currentPos = next.position;
    currentHomeProg = next.homeProgress;

    let cx = 0, cy = 0;
    if (currentState === TOKEN_STATE.FINISHED) {
      const centerPos = getFinishedCenterPosition(color, tokenId, CELL_SIZE);
      cx = centerPos.x;
      cy = centerPos.y;
    } else if (currentState === TOKEN_STATE.HOME_COL) {
      const pos = getHomeColumnPosition(color, currentHomeProg);
      cx = (pos.x + 0.5) * CELL_SIZE;
      cy = (pos.y + 0.5) * CELL_SIZE;
    } else if (currentState === TOKEN_STATE.ACTIVE) {
      const pos = getBoardPosition(currentPos);
      cx = (pos.x + 0.5) * CELL_SIZE;
      cy = (pos.y + 0.5) * CELL_SIZE;
    }

    path.push({ cx, cy, state: currentState, position: currentPos, homeProgress: currentHomeProg });
  }

  return path;
}

/**
 * Calculate step-by-step coordinate path backward for captured tokens
 */
export function getTokenRewindPath(color, token, CELL_SIZE = 40) {
  const path = [];
  if (!token || token.position === -1) return path;

  let currentPos = token.position;
  const steps = getDistanceFromStart(color, currentPos);

  // 1. Walk backward cell-by-cell to startPos
  for (let i = 0; i < steps; i++) {
    currentPos = (currentPos - 1 + 52) % 52;
    const pos = getBoardPosition(currentPos);
    path.push({
      cx: (pos.x + 0.5) * CELL_SIZE,
      cy: (pos.y + 0.5) * CELL_SIZE
    });
  }

  // 2. Finally step back into the home yard yard base position
  const baseCoords = getBasePositions(color);
  const coord = baseCoords[token.id % 4] || { x: 2, y: 2 };
  path.push({
    cx: (coord.x + 0.5) * CELL_SIZE,
    cy: (coord.y + 0.5) * CELL_SIZE
  });

  return path;
}

/**
 * Finished token center triangle coordinates (Blue=Left, Red=Bottom, Green=Top, Yellow=Right)
 */
export function getFinishedCenterPosition(color, tokenId, CELL_SIZE = 40) {
  const index = (tokenId || 0) % 4;
  const col = index % 2;
  const row = Math.floor(index / 2);

  const TRIANGLE_COORDS = {
    blue:   { x: (6.5 + col * 0.45) * CELL_SIZE, y: (7.2 + row * 0.6) * CELL_SIZE },
    red:    { x: (7.2 + col * 0.6) * CELL_SIZE, y: (8.5 - row * 0.45) * CELL_SIZE },
    green:  { x: (7.2 + col * 0.6) * CELL_SIZE, y: (6.5 + row * 0.45) * CELL_SIZE },
    yellow: { x: (8.5 - col * 0.45) * CELL_SIZE, y: (7.2 + row * 0.6) * CELL_SIZE }
  };

  return TRIANGLE_COORDS[color] || { x: 7.5 * CELL_SIZE, y: 7.5 * CELL_SIZE };
}

/**
 * Calculate player rankings (1st, 2nd, 3rd, 4th) for end-game leaderboard
 */
export function calculatePlayerRankings(gameState) {
  if (!gameState || !gameState.players) return [];

  const playersList = Object.values(gameState.players);

  return playersList.map(p => {
    let totalProgress = 0;
    (p.tokens || []).forEach(t => {
      if (t.state === TOKEN_STATE.FINISHED) totalProgress += 100;
      else if (t.state === TOKEN_STATE.HOME_COL) totalProgress += 50 + (t.homeProgress || 0) * 10;
      else if (t.state === TOKEN_STATE.ACTIVE) totalProgress += getDistanceFromStart(p.color, t.position || 0);
    });

    return {
      ...p,
      totalProgress
    };
  }).sort((a, b) => {
    if (gameState.winner === a.id) return -1;
    if (gameState.winner === b.id) return 1;

    if (b.finishedCount !== a.finishedCount) {
      return b.finishedCount - a.finishedCount;
    }
    if ((b.capturesCount || 0) !== (a.capturesCount || 0)) {
      return (b.capturesCount || 0) - (a.capturesCount || 0);
    }
    return b.totalProgress - a.totalProgress;
  });
}

export function evaluateBestBotMove(gameState, moves, difficulty = 'medium') {
  if (!moves || moves.length === 0) return null;
  if (moves.length === 1) return moves[0];

  // Easy: Random move selection
  if (difficulty === 'easy') {
    const randomIndex = Math.floor(Math.random() * moves.length);
    return moves[randomIndex];
  }

  const currentPlayer = gameState.players[gameState.currentPlayerId];
  if (!currentPlayer) return moves[0];

  const activeTokens = (currentPlayer.tokens || []).filter(t => t.state === TOKEN_STATE.ACTIVE);

  let bestMove = moves[0];
  let maxScore = -9999;

  moves.forEach(m => {
    let score = 0;

    // 1. CAPTURE / KILL OPPONENT TOKEN (Human Priority #1: +250 pts)
    let capturesCount = 0;
    if (m.destState === TOKEN_STATE.ACTIVE && !SAFE_POSITIONS.includes(m.destPosition)) {
      Object.values(gameState.players).forEach(other => {
        if (other.id !== currentPlayer.id) {
          (other.tokens || []).forEach(tok => {
            if (tok.state === TOKEN_STATE.ACTIVE && tok.position === m.destPosition) {
              capturesCount++;
            }
          });
        }
      });
    }
    if (capturesCount > 0) {
      score += 250 * capturesCount;
    }

    // 2. REACH HOME CENTER (FINISH TOKEN: +200 pts)
    if (m.destState === TOKEN_STATE.FINISHED) {
      score += 200;
    }

    // 3. ENTER HOME STRETCH COLUMN (+130 pts)
    if (m.startState === TOKEN_STATE.ACTIVE && m.destState === TOKEN_STATE.HOME_COL) {
      score += 130;
    }

    // 4. OPEN NEW TOKEN FROM BASE (Human multi-token strategy: +160 pts if <= 1 active token)
    if (m.startState === TOKEN_STATE.BASE && m.destState === TOKEN_STATE.ACTIVE) {
      if (activeTokens.length <= 1) {
        score += 160; // Highly urgent to bring a 2nd token out!
      } else if (activeTokens.length === 2) {
        score += 120;
      } else {
        score += 80;
      }
    }

    // 5. ESCAPE DANGER / OPPONENT THREAT ZONE (+150 pts for Hard, +90 for Medium)
    if (m.startState === TOKEN_STATE.ACTIVE && !SAFE_POSITIONS.includes(m.startPos)) {
      let isUnderThreat = false;
      Object.values(gameState.players).forEach(other => {
        if (other.id !== currentPlayer.id) {
          (other.tokens || []).forEach(tok => {
            if (tok.state === TOKEN_STATE.ACTIVE) {
              const enemyDist = getDistanceFromStart(other.color, tok.position);
              const myDist = getDistanceFromStart(other.color, m.startPos);
              const diff = myDist - enemyDist;
              if (diff > 0 && diff <= 6) {
                isUnderThreat = true;
              }
            }
          });
        }
      });
      if (isUnderThreat) {
        score += (difficulty === 'hard' ? 150 : 90);
      }
    }

    // 6. LAND ON SAFE STAR SPOT (+110 pts for Hard, +60 for Medium)
    if (m.destState === TOKEN_STATE.ACTIVE && SAFE_POSITIONS.includes(m.destPosition)) {
      score += (difficulty === 'hard' ? 110 : 60);
    }

    // 7. STACK WITH OWN TOKEN (TEAM BLOCKADE: +70 pts)
    if (m.destState === TOKEN_STATE.ACTIVE) {
      const stacksWithOwn = (currentPlayer.tokens || []).some(t =>
        t.id !== m.tokenId && t.state === TOKEN_STATE.ACTIVE && t.position === m.destPosition
      );
      if (stacksWithOwn) {
        score += 70;
      }
    }

    // 8. MULTI-TOKEN MANAGEMENT & DISTANCE BALANCING:
    // Humans advance trailing tokens forward to support each other instead of solo racing 1 token
    if (m.destState === TOKEN_STATE.ACTIVE) {
      const moveDistance = getDistanceFromStart(currentPlayer.color, m.destPosition);
      if (activeTokens.length > 1) {
        const minDistance = Math.min(...activeTokens.map(t => getDistanceFromStart(currentPlayer.color, t.position)));
        const tokenDist = getDistanceFromStart(currentPlayer.color, m.startPos);
        if (tokenDist === minDistance) {
          score += 40; // Advance trailing pawn!
        }
      }
      score += moveDistance * 0.3;
    } else if (m.destState === TOKEN_STATE.HOME_COL) {
      score += 60 + (m.destHomeProgress || 0) * 5;
    }

    if (score > maxScore) {
      maxScore = score;
      bestMove = m;
    }
  });

  return bestMove;
}

export { PLAYER_COLORS, START_POSITIONS, SAFE_POSITIONS, TOKEN_STATE };


