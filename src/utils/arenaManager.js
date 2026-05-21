import { supabase } from './supabaseClient';

class ArenaManager {
  constructor() {
    this.userId = null;
    this.username = null;
    this.avatar = null;
    this.matchmakingChannel = null;
    this.matchChannel = null;
  }

  initialize(user) {
    this.userId = user.id;
    this.username = user.username;
    this.avatar = user.avatar;
  }

  // --- MATCHMAKING ---

  async joinMatchmaking(onMatchFound, onQueueUpdate, roomCode = null, customUsername = null) {
    if (this.matchmakingChannel) {
      this.leaveMatchmaking();
    }

    if (customUsername) {
      this.username = customUsername;
    }

    const channelName = roomCode ? `arena_room_${roomCode}` : 'arena_matchmaking';

    this.matchmakingChannel = supabase.channel(channelName, {
      config: { presence: { key: this.userId } }
    });

    this.matchmakingChannel
      .on('presence', { event: 'sync' }, () => {
        const state = this.matchmakingChannel.presenceState();
        const playersInQueue = Object.values(state).flat();
        if (onQueueUpdate) onQueueUpdate(playersInQueue.length);

        // Simple Host-based matchmaking (first player in queue acts as host)
        if (playersInQueue.length >= 2) {
          // Sort by join time to consistently pick a host
          const sortedPlayers = playersInQueue.sort((a, b) => a.joinTime - b.joinTime);
          const amIHost = sortedPlayers[0].userId === this.userId;
          
          if (amIHost) {
            const opponent = sortedPlayers[1];
            const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const sentenceIndex = Math.floor(Math.random() * 20); // Generate once
            
            // Broadcast match start to everyone (the specific opponent will catch it)
            this.matchmakingChannel.send({
              type: 'broadcast',
              event: 'match_found',
              payload: {
                matchId,
                player1: this.getUserData(),
                player2: opponent,
                sentenceIndex
              }
            });

            // Start locally
            onMatchFound({ 
              matchId, 
              opponent, 
              isHost: true,
              sentenceIndex
            });
          }
        }
      })
      .on('broadcast', { event: 'match_found' }, ({ payload }) => {
        // If I was selected as player 2 by a host
        if (payload.player2.userId === this.userId) {
          onMatchFound({ 
            matchId: payload.matchId, 
            opponent: payload.player1,
            isHost: false,
            sentenceIndex: payload.sentenceIndex
          });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.matchmakingChannel.track({
            ...this.getUserData(),
            joinTime: Date.now()
          });
        }
      });
  }

  leaveMatchmaking() {
    if (this.matchmakingChannel) {
      this.matchmakingChannel.unsubscribe();
      this.matchmakingChannel = null;
    }
  }

  // --- MATCH SYNCHRONIZATION ---

  async joinMatch(matchId, opponentId, onOpponentUpdate, onMatchEvent) {
    if (this.matchChannel) {
      this.leaveMatch();
    }

    this.matchChannel = supabase.channel(`match_${matchId}`, {
      config: { presence: { key: this.userId } }
    });

    this.matchChannel
      .on('broadcast', { event: 'typing_progress' }, ({ payload }) => {
        if (payload.userId === opponentId && onOpponentUpdate) {
          onOpponentUpdate(payload);
        }
      })
      .on('broadcast', { event: 'match_event' }, ({ payload }) => {
        if (onMatchEvent) {
          onMatchEvent(payload);
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const leftUserId = leftPresences[0]?.userId;
        if (leftUserId === opponentId && onMatchEvent) {
          onMatchEvent({ type: 'opponent_left' });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.matchChannel.track({ userId: this.userId });
        }
      });
  }

  broadcastProgress(progress, wpm) {
    if (this.matchChannel) {
      this.matchChannel.send({
        type: 'broadcast',
        event: 'typing_progress',
        payload: { userId: this.userId, progress, wpm }
      });
    }
  }

  broadcastMatchEvent(eventType, data = {}) {
     if (this.matchChannel) {
      this.matchChannel.send({
        type: 'broadcast',
        event: 'match_event',
        payload: { type: eventType, userId: this.userId, ...data }
      });
    }
  }

  leaveMatch() {
    if (this.matchChannel) {
      this.matchChannel.unsubscribe();
      this.matchChannel = null;
    }
  }

  getUserData() {
    return {
      userId: this.userId,
      username: this.username,
      avatar: this.avatar
    };
  }
}

export const arenaManager = new ArenaManager();
