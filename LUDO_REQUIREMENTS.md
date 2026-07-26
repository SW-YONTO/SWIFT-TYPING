# Ludo Multiplayer Game Requirements & Verification Checklist

This document outlines the core multiplayer features implemented in the Ludo game, their expected behaviors, and how to verify them.

---

## 1. Room Management & Lobby
- [x] **Room Creation**: Host creates a new room, generating a unique 6-digit room code.
- [x] **Room Joining**: Opponents can type the room code in the lobby and click **Join** to join the room.
- [x] **Active Rooms List**: The lobby shows a live list of all active rooms that players can click to join.
- [x] **Privileged Game Start**:
  - Only the **Host** has the **🚀 START MATCH** button visible in the waiting lobby.
  - The start button is disabled until at least 2 players are in the room.
  - Other players see a *"Waiting for host to start..."* status message.
- [x] **Leave Lobby**: Players can click `← Leave Room` to exit the waiting room at any time.

---

## 2. Real-Time Network Sync & Presence
- [x] **Presence Connection Status**:
  - Compares the room's players list with active Supabase Presence records.
  - **🟢 Online (Green Wifi icon)**: Player is actively connected to the channel.
  - **🔴 Offline (Red Wifi icon)**: Player has closed their browser tab, lost connection, or resigned.
- [x] **Instant Connection Recovery**: If a page is reloaded, the player instantly reconnects back into their active color/slot seamlessly.
- [x] **Multiplayer Sync**: Turns, dice rolls, token positions, chat messages, and emojis are broadcasted and synchronized instantly on all screens.

---

## 3. Gameplay Engine
- [x] **Dice Rolling**: Players click the dice icon on their turn to roll. A 3D shake animation runs on all screens.
- [x] **Step-by-Step Jumping Pawn Animation**:
  - Instead of sliding or teleporting, tokens hop tile-by-tile along the board track.
  - Hops include Y-axis elevation (`cy = cy - 6px`) and radius expansion (`r = r + 3px`) to look like a physical jump.
  - Syncs properly across both the turn player and observers.
- [x] **Captures & Star Safe Zones**:
  - Safe spots (marked by stars) allow multiple pawns of different colors to stand on them safely.
  - Non-safe spots trigger a **Capture** event, sending the opponent's token back to their home base and granting the active player an extra turn.
- [x] **Pawn Stacking Offsets**: When 2 or more tokens occupy the same cell, they automatically shrink and position diagonally side-by-side to stay clearly visible.
- [x] **Winning Conditions**: Tokens must navigate the home column to reach the center. The first player to get all 4 tokens to the center wins.

---

## 4. Inactivity & Resignation Controls
- [x] **AFK Auto-Skip Turn**: If the active player does not roll the dice within **15 seconds**, the turn automatically skips to the next player.
- [x] **No Valid Moves Auto-Skip**: If the rolled dice value yields 0 valid moves for the active player's tokens, the turn is automatically skipped after 800ms.
- [x] **Single Move Auto-Play**: If only 1 valid move exists, the token automatically plays itself after 400ms to keep the game fast-paced.
- [x] **Resignation (Resign Match)**:
  - Players can click the resign/leave button (🚪) to forfeit.
  - Resignation updates the database state to flag the player as resigned.
  - If only one active player remains, they are automatically declared the winner.

---

## 5. Chat & Emojis
- [x] **Real-Time Chat**: Messages typed in the sidebar Chat Box appear as sliding bubble overlays next to the player's corner avatar on the board, and append to the chat logs.
- [x] **Emoji Reactions**: Clicking emoji icons shoots floating reactions upward on the Ludo board on all screens.

---

## 6. Future Implementations (Pending)
- [ ] **2-Min Disconnect Forfeit**: If a player remains disconnected (Offline) for more than 2 consecutive minutes, they will automatically be resigned from the match.
