// Ludo Multiplayer Manager — Unified Realtime Channel for Presence, DB Sync & Ephemeral Events
import { supabase } from './supabaseClient';

class LudoManager {
  constructor() {
    this.userId = null;
    this.username = null;
    this.avatar = null;
    this.roomCode = null;
    this.isHost = false;
    this.lobbyChannel = null;
    this.roomChannel = null;

    // Callbacks
    this.onPlayersUpdate = null;
    this.onStartCountdown = null;
    this.onGameStateSync = null;
    this.onEmoji = null;
    this.onChat = null;
    this.onRoomListUpdate = null;
    this.onPlayerReady = null;
    this.onError = null;
    this.heartbeatTimer = null;
  }

  startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(async () => {
      if (this.roomCode && this.isHost) {
        try {
          await supabase
            .from('ludo_rooms')
            .update({ updated_at: new Date().toISOString() })
            .eq('room_code', this.roomCode);
        } catch (e) {
          console.warn('Room heartbeat update warning:', e);
        }
      }
    }, 30000);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  initialize(user = {}) {
    let storedId = localStorage.getItem('swift_ludo_uid');
    if (!storedId) {
      storedId = `anon_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('swift_ludo_uid', storedId);
    }

    this.userId = user.id || storedId;
    this.username = user.username || `Player_${storedId.substring(5, 9)}`;
    this.avatar = user.avatar || null;
  }

  updateUser(user = {}) {
    if (user.id) this.userId = user.id;
    if (user.username) this.username = user.username;
    if (user.avatar !== undefined) this.avatar = user.avatar;
  }

  getUserData() {
    return {
      userId: this.userId,
      username: this.username,
      avatar: this.avatar,
      isHost: Boolean(this.isHost),
      joinTime: Date.now()
    };
  }

  generateRoomCode() {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  // ─── LOBBY (Room Discovery) ───

  async fetchActiveRooms() {
    try {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

      // Clean up stale rooms in DB older than 3 hours
      try {
        await supabase
          .from('ludo_rooms')
          .delete()
          .lt('updated_at', threeHoursAgo);
      } catch (e) {
        console.warn('DB stale room cleanup warning:', e);
      }

      const { data, error } = await supabase
        .from('ludo_rooms')
        .select('*')
        .eq('status', 'waiting')
        .gt('player_count', 0)
        .gte('updated_at', threeHoursAgo)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const rooms = data.map(r => ({
          code: r.room_code,
          host: r.host_username,
          hostAvatar: r.host_avatar,
          playerCount: r.player_count,
          maxPlayers: r.max_players,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
        if (this.onRoomListUpdate) this.onRoomListUpdate(rooms);
        return rooms;
      }
    } catch (e) {
      console.warn('DB rooms fetch fallback:', e);
    }
    return [];
  }

  async joinLobby(onRoomListUpdate) {
    this.onRoomListUpdate = onRoomListUpdate;
    await this.fetchActiveRooms();

    if (!this.lobbyChannel) {
      this.lobbyChannel = supabase
        .channel('public:ludo_rooms_lobby')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ludo_rooms' }, () => {
          this.fetchActiveRooms();
        })
        .subscribe();
    }
  }

  async leaveLobby() {
    if (this.lobbyChannel) {
      await supabase.removeChannel(this.lobbyChannel);
      this.lobbyChannel = null;
    }
  }

  // ─── ROOM MANAGEMENT & UNIFIED REALTIME CHANNEL ───

  async checkRoomExists(code) {
    if (!code) return null;
    try {
      const { data, error } = await supabase
        .from('ludo_rooms')
        .select('*')
        .eq('room_code', code.toUpperCase())
        .maybeSingle();

      if (error || !data) return null;
      return data;
    } catch {
      return null;
    }
  }

  async createRoom(callbacks = {}) {
    let code = this.generateRoomCode();
    let existing = await this.checkRoomExists(code);
    let attempts = 0;
    while (existing && attempts < 5) {
      code = this.generateRoomCode();
      existing = await this.checkRoomExists(code);
      attempts++;
    }
    this.roomCode = code;
    this.isHost = true;
    this.hostUsername = this.username;
    this.roomRecord = {
      room_code: code,
      host_username: this.username,
      host_avatar: this.avatar
    };
    Object.assign(this, callbacks);

    try {
      await supabase.from('ludo_rooms').upsert({
        room_code: this.roomCode,
        host_username: this.username,
        host_avatar: this.avatar,
        player_count: 1,
        max_players: 4,
        status: 'waiting',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'room_code' });
      console.log(`[LUDO_MANAGER] Room ${this.roomCode} created in DB.`);
    } catch (e) {
      console.warn('DB create room error:', e);
    }

    this.startHeartbeat();
    await this.subscribeToRoom(this.roomCode, callbacks);
    return this.roomCode;
  }

  async joinRoom(code, callbacks = {}) {
    const formattedCode = code.toUpperCase();
    const roomRecord = await this.checkRoomExists(formattedCode);
    if (!roomRecord) {
      throw new Error('Invalid room code or room no longer exists.');
    }

    this.roomCode = formattedCode;
    this.roomRecord = roomRecord;
    this.hostUsername = roomRecord.host_username;
    this.isHost = (roomRecord.host_username === this.username);
    Object.assign(this, callbacks);

    await this.subscribeToRoom(formattedCode, callbacks);

    // Broadcast player_joined event so host receives immediate notification
    if (this.roomChannel) {
      const userData = this.getUserData();
      await this.roomChannel.send({
        type: 'broadcast',
        event: 'player_joined',
        payload: { player: userData }
      });
    }

    return roomRecord;
  }

  async subscribeToRoom(code, callbacks = {}) {
    if (!code) return;
    const formatted = code.toUpperCase();
    this.roomCode = formatted;
    Object.assign(this, callbacks);

    const channelName = `ludo_room_${this.roomCode}`;

    if (this.roomChannel) {
      try {
        await supabase.removeChannel(this.roomChannel);
      } catch (e) {
        console.warn('Error removing previous room channel:', e);
      }
      this.roomChannel = null;
    }

    this.roomChannel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true, self: true },
        presence: { key: this.userId }
      }
    });

    // Unified Presence State Updater (Deduplicated by userId)
    const handlePresenceUpdate = async () => {
      const state = this.roomChannel ? this.roomChannel.presenceState() : {};
      const rawPlayers = Object.values(state).flat();

      const uniquePlayersMap = new Map();
      const localUserData = this.getUserData();

      rawPlayers.forEach(p => {
        const id = p.userId || p.user_id;
        if (id) {
          uniquePlayersMap.set(id, p);
        }
      });

      // Always guarantee local user is included in players list
      if (localUserData && localUserData.userId && !uniquePlayersMap.has(localUserData.userId)) {
        uniquePlayersMap.set(localUserData.userId, localUserData);
      }

      // If roomRecord exists and Host is not yet in presence state, inject host so guest sees host immediately
      const currentHostUsername = this.hostUsername || this.roomRecord?.host_username;
      if (currentHostUsername) {
        const hasHostInList = Array.from(uniquePlayersMap.values()).some(p => p.isHost || p.username === currentHostUsername);
        if (!hasHostInList && !this.isHost) {
          const hostData = {
            userId: `host_${currentHostUsername}`,
            username: currentHostUsername,
            avatar: this.roomRecord?.host_avatar || null,
            isHost: true,
            joinTime: 0
          };
          uniquePlayersMap.set(hostData.userId, hostData);
        }
      }

      const players = Array.from(uniquePlayersMap.values());

      const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
      console.log(`%c[LUDO ${time}] [PRESENCE] Online players (${players.length}): ${players.map(p => `${p.username || p.user_id} (${p.color || 'no-color'})`).join(', ')}`, 'color: #10b981; font-weight: bold;');
      
      if (this.onPlayersUpdate) this.onPlayersUpdate(players);

      if (this.isHost && this.roomCode) {
        try {
          await supabase
            .from('ludo_rooms')
            .update({ player_count: Math.max(1, players.length), updated_at: new Date().toISOString() })
            .eq('room_code', this.roomCode);
        } catch (e) {
          console.warn('DB player count update error:', e);
        }
      }
    };

    // 1. Presence Listeners (Sync, Join, Leave)
    this.roomChannel
      .on('presence', { event: 'sync' }, handlePresenceUpdate)
      .on('presence', { event: 'join' }, handlePresenceUpdate)
      .on('presence', { event: 'leave' }, handlePresenceUpdate);

    // 2. Postgres Changes (DB State Sync)
    this.roomChannel.on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'ludo_rooms',
      filter: `room_code=eq.${this.roomCode}`
    }, (payload) => {
      const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
      console.log(`%c[LUDO ${time}] [NET_DB_SYNC_RX] Postgres WAL DB sync received`, 'color: #10b981; font-weight: bold;', payload.new?.game_state);
      if (payload.new && payload.new.game_state) {
        if (this.onGameStateSync) {
          this.onGameStateSync(payload.new.game_state);
        }
      }
    });

    // 3. Broadcast Events (Instant Game Action, Chat, Emoji, Countdown, Dice Animation, Player Joined)
    this.roomChannel
      .on('broadcast', { event: 'game_action' }, ({ payload }) => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
        console.log(`%c[LUDO ${time}] [NET_BROADCAST_RX] Received game_action`, 'color: #3b82f6; font-weight: bold;', payload);
        if (payload?.gameState && this.onGameStateSync) {
          this.onGameStateSync(payload.gameState);
        }
      })
      .on('broadcast', { event: 'player_joined' }, ({ payload }) => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
        console.log(`[LUDO ${time}] [PLAYER_JOINED_RX] Broadcast player_joined:`, payload);
        if (this.onPlayerJoined) this.onPlayerJoined(payload);
        handlePresenceUpdate();
      })
      .on('broadcast', { event: 'token_move_start' }, ({ payload }) => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
        console.log(`%c[LUDO ${time}] [MOVE_START_RX] Realtime move start received`, 'color: #3b82f6; font-weight: bold;', payload);
        if (this.onTokenMoveStart) this.onTokenMoveStart(payload);
      })
      .on('broadcast', { event: 'dice_rolling' }, ({ payload }) => {
        if (this.onDiceRolling) this.onDiceRolling(payload);
      })
      .on('broadcast', { event: 'start_countdown' }, ({ payload }) => {
        if (this.onStartCountdown) this.onStartCountdown(payload);
      })
      .on('broadcast', { event: 'emoji' }, ({ payload }) => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
        console.log(`%c[LUDO ${time}] [EMOJI_RX] Emoji received from ${payload.username}: ${payload.emoji}`, 'color: #ec4899; font-weight: bold;', payload);
        if (this.onEmoji) this.onEmoji(payload);
      })
      .on('broadcast', { event: 'player_ready' }, ({ payload }) => {
        if (this.onPlayerReady) this.onPlayerReady(payload);
      })
      .on('broadcast', { event: 'chat_message' }, ({ payload }) => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
        console.log(`%c[LUDO ${time}] [CHAT_RX] Chat message received from ${payload.username} (${payload.color}): "${payload.text}"`, 'color: #ec4899; font-weight: bold;', payload);
        if (this.onChat) this.onChat(payload);
      })
      .on('broadcast', { event: 'play_again' }, () => {
        if (this.onPlayAgain) this.onPlayAgain();
      })
      .on('broadcast', { event: 'room_closed' }, ({ payload }) => {
        console.log(`[LUDO_MANAGER] Room closed by host:`, payload);
        if (this.onRoomClosed) this.onRoomClosed(payload);
      });

    await this.roomChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const userData = this.getUserData();
        await this.roomChannel.track(userData);
        await handlePresenceUpdate();

        if (this.isHost) {
          this.startHeartbeat();
        }

        // Fetch latest DB state immediately after subscribing
        const dbState = await this.fetchGameState();
        if (dbState && this.onGameStateSync) {
          this.onGameStateSync(dbState);
        }
      }
    });
  }

  // ─── GAME STATE OPERATIONS ───

  async fetchGameState() {
    if (!this.roomCode) return null;
    try {
      const { data, error } = await supabase
        .from('ludo_rooms')
        .select('game_state, status')
        .eq('room_code', this.roomCode)
        .maybeSingle();

      if (!error && data && data.game_state) {
        return data.game_state;
      }
    } catch (e) {
      console.warn('Error fetching game_state:', e);
    }
    return null;
  }

  async ensureRoomChannel() {
    if (!this.roomChannel && this.roomCode) {
      const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
      console.warn(`[LUDO ${time}] [AUTO_HEAL] roomChannel was null for ${this.roomCode}. Re-subscribing automatically...`);
      await this.subscribeToRoom(this.roomCode);
    }
  }

  async updateGameState(newGameState) {
    if (!newGameState) return;
    const targetRoomCode = this.roomCode || newGameState.roomCode;
    if (!targetRoomCode) return;
    this.roomCode = targetRoomCode;

    await this.ensureRoomChannel();

    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });

    // 1. Instant 0ms Broadcast over WebSocket
    if (this.roomChannel) {
      try {
        const sendStatus = await this.roomChannel.send({
          type: 'broadcast',
          event: 'game_action',
          payload: { gameState: newGameState }
        });
        console.log(`%c[LUDO ${time}] [NET_BROADCAST_TX] Sent game_action status: ${sendStatus}`, sendStatus === 'ok' ? 'color: #3b82f6; font-weight: bold;' : 'color: #ef4444; font-weight: bold;', { sendStatus, roomCode: targetRoomCode });
      } catch (err) {
        console.error(`[LUDO ${time}] [NET_BROADCAST_TX_ERR] Socket send error:`, err);
      }
    } else {
      console.warn(`[LUDO ${time}] [NET_BROADCAST_TX_ERR] Cannot broadcast: roomChannel is null!`);
    }

    // 2. Persistent DB update
    try {
      const dbStatus = newGameState.winner ? 'gameover' : 'playing';
      const { error } = await supabase
        .from('ludo_rooms')
        .update({
          status: dbStatus,
          game_state: newGameState,
          updated_at: new Date().toISOString()
        })
        .eq('room_code', targetRoomCode);

      if (error) {
        console.error(`%c[LUDO ${time}] [NET_DB_UPDATE_ERR] DB Update Failed: ${error.message}`, 'color: #ef4444; font-weight: bold;', error);
      } else {
        console.log(`%c[LUDO ${time}] [NET_DB_UPDATE_OK] State saved to DB (status: ${dbStatus})!`, 'color: #10b981;');
      }
    } catch (e) {
      console.warn('Error updating game_state in DB:', e);
    }
  }

  // ─── GAME ACTIONS ───

  async startGame(gameState) {
    const targetRoomCode = this.roomCode || gameState?.roomCode;
    if (!targetRoomCode) return;
    this.roomCode = targetRoomCode;

    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });

    try {
      const { error } = await supabase
        .from('ludo_rooms')
        .update({
          status: 'playing',
          game_state: gameState,
          updated_at: new Date().toISOString()
        })
        .eq('room_code', targetRoomCode);

      if (error) console.error(`[LUDO ${time}] [START_GAME_DB_ERR]`, error);
    } catch (e) {
      console.warn('Error starting game in DB:', e);
    }

    if (this.roomChannel) {
      const status = await this.roomChannel.send({
        type: 'broadcast',
        event: 'start_countdown',
        payload: { gameState, startedBy: this.userId }
      });
      console.log(`[LUDO ${time}] [START_COUNTDOWN_TX] Broadcast status: ${status}`);
    }
  }

  async broadcastTokenMoveStart(movingPlayerId, tokenId, targetState) {
    await this.ensureRoomChannel();
    if (!this.roomChannel) return;
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    const status = await this.roomChannel.send({
      type: 'broadcast',
      event: 'token_move_start',
      payload: { movingPlayerId, tokenId, targetState, userId: this.userId, timestamp: Date.now() }
    });
    console.log(`[LUDO ${time}] [MOVE_START_TX] Broadcast status: ${status}`);
  }

  async broadcastDiceRoll(color) {
    await this.ensureRoomChannel();
    if (!this.roomChannel) return;
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    const status = await this.roomChannel.send({
      type: 'broadcast',
      event: 'dice_rolling',
      payload: { color, userId: this.userId, username: this.username, timestamp: Date.now() }
    });
    console.log(`[LUDO ${time}] [DICE_ROLL_TX] status: ${status}`);
  }

  async broadcastEmoji(emoji, color) {
    await this.ensureRoomChannel();
    if (!this.roomChannel) return;
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    const status = await this.roomChannel.send({
      type: 'broadcast',
      event: 'emoji',
      payload: { emoji, color, userId: this.userId, username: this.username, timestamp: Date.now() }
    });
    console.log(`[LUDO ${time}] [EMOJI_TX] status: ${status}`);
  }

  async broadcastChatMessage(text, color) {
    await this.ensureRoomChannel();
    if (!this.roomChannel) return;
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    const status = await this.roomChannel.send({
      type: 'broadcast',
      event: 'chat_message',
      payload: { text, color, userId: this.userId, username: this.username }
    });
    console.log(`%c[LUDO ${time}] [CHAT_TX] Sent message status: ${status}`, status === 'ok' ? 'color: #ec4899; font-weight: bold;' : 'color: #ef4444; font-weight: bold;');
  }

  async broadcastReady(isReady) {
    if (!this.roomChannel) return;
    await this.roomChannel.send({
      type: 'broadcast',
      event: 'player_ready',
      payload: { userId: this.userId, isReady }
    });
  }

  // ─── CLEANUP & PERSISTENCE ───

  async destroyRoom() {
    if (this.roomCode) {
      try {
        // Broadcast room_closed so all clients in the room get kicked
        if (this.roomChannel) {
          await this.roomChannel.send({
            type: 'broadcast',
            event: 'room_closed',
            payload: { reason: 'host_destroyed' }
          });
        }
        await supabase.from('ludo_rooms').delete().eq('room_code', this.roomCode);
        console.log(`[LUDO_MANAGER] Room ${this.roomCode} destroyed by host.`);
      } catch (e) {
        console.warn('DB room delete error:', e);
      }
    }
    await this.leaveRoom();
  }

  async leaveRoom() {
    this.stopHeartbeat();

    // If host leaves during lobby (waiting), delete the room and broadcast closure.
    // But if the game is already playing/gameover, keep the room so players can rematch.
    if (this.isHost && this.roomCode) {
      const codeToDelete = this.roomCode;
      try {
        const { data } = await supabase
          .from('ludo_rooms')
          .select('status')
          .eq('room_code', codeToDelete)
          .maybeSingle();

        const roomStatus = data?.status || 'waiting';

        if (roomStatus === 'waiting') {
          // Broadcast room_closed so other players in lobby get kicked
          if (this.roomChannel) {
            await this.roomChannel.send({
              type: 'broadcast',
              event: 'room_closed',
              payload: { reason: 'host_left_lobby' }
            });
          }
          await supabase.from('ludo_rooms').delete().eq('room_code', codeToDelete);
          console.log(`[LUDO_MANAGER] Host left waiting room. Room ${codeToDelete} deleted from DB.`);
        } else {
          console.log(`[LUDO_MANAGER] Host left but game is ${roomStatus}. Keeping room ${codeToDelete} alive for rematch.`);
        }
      } catch (e) {
        console.warn('DB room status check/delete error on host leave:', e);
      }
    }

    if (this.roomChannel) {
      try {
        await this.roomChannel.untrack();
        await supabase.removeChannel(this.roomChannel);
      } catch (e) {
        console.warn('Error unsubscribing room channel:', e);
      }
      this.roomChannel = null;
    }

    this.roomCode = null;
    this.isHost = false;
  }

  async cleanup() {
    await this.leaveRoom();
    await this.leaveLobby();
  }
}

export const ludoManager = new LudoManager();
