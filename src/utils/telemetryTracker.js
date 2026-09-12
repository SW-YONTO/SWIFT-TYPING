import { supabase } from './supabaseClient';

const APP_VERSION = '3.26.11'; // Swift Typing Version

/**
 * Anonymous persistent device identifier
 */
function getDeviceId() {
  let deviceId = localStorage.getItem('swift_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    localStorage.setItem('swift_device_id', deviceId);
  }
  return deviceId;
}

class TelemetryTracker {
  constructor() {
    this.deviceId = getDeviceId();
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.syncActiveUserProgress();
        this.startPingHeartbeat();
      });
      window.addEventListener('beforeunload', () => this.syncActiveUserProgress());
    }

    // Initial cloud sync ONLY for active logged-in user
    this.syncActiveUserProgress();
    this.startPingHeartbeat();
  }

  /**
   * Periodic Ping Heartbeat (Every 3 minutes)
   * Updates only last_seen timestamp in Supabase user_telemetry table.
   * Extremely lightweight, uses < 100 bytes of bandwidth!
   */
  startPingHeartbeat() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = setInterval(async () => {
      if (!navigator.onLine) return;
      try {
        const currentUserId = localStorage.getItem('typing_app_current_user');
        if (!currentUserId) return;
        const users = JSON.parse(localStorage.getItem('typing_app_users') || '[]');
        const targetUser = users.find(u => u.id === currentUserId);
        if (!targetUser || !targetUser.username) return;

        const ADMIN_USERNAMES = ['sd', 'swsharagaki', 'admin', 'swiftadmin'];
        if (ADMIN_USERNAMES.includes(targetUser.username.toLowerCase().trim())) return;

        const cleanUser = targetUser.username.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const rowId = `${this.deviceId}_${cleanUser}`;
        const nowIso = new Date().toISOString();

        console.log('💚 [PING HEARTBEAT]: Updating last_seen timestamp for', targetUser.username);

        await supabase
          .from('user_telemetry')
          .update({ last_seen: nowIso })
          .eq('id', rowId);
      } catch (e) {}
    }, 3 * 60 * 1000);
  }

  getPlatformInfo() {
    const isElectron = !!(
      window.electron ||
      window.electronAPI ||
      window.process?.type === 'renderer' ||
      navigator.userAgent.includes('Electron')
    );

    let osPlatform = 'web';
    if (isElectron) {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('win')) osPlatform = 'win32';
      else if (ua.includes('mac')) osPlatform = 'darwin';
      else if (ua.includes('linux')) osPlatform = 'linux';
      else osPlatform = 'desktop';
    }

    return {
      clientType: isElectron ? 'electron' : 'web',
      osPlatform
    };
  }

  /**
   * Sync complete user progress snapshot from localStorage to Supabase 'user_telemetry' table.
   */
  async syncUserProgress(userId) {
    if (!navigator.onLine) return;

    try {
      const usersStr = localStorage.getItem('typing_app_users');
      if (!usersStr) return;
      const users = JSON.parse(usersStr);

      const targetUser = users.find(u => u.id === userId || u.username === userId);
      if (!targetUser || !targetUser.username) return;

      const ADMIN_USERNAMES = ['sd', 'swsharagaki', 'admin', 'swiftadmin'];
      if (ADMIN_USERNAMES.includes(targetUser.username.toLowerCase().trim())) {
        return;
      }

      const progRaw = localStorage.getItem(`typing_app_user_progress_${targetUser.id}`);
      const prog = progRaw ? JSON.parse(progRaw) : {};
      const stats = prog.stats || {};
      const completedLessons = prog.completedLessons || [];
      const testResults = prog.testResults || [];

      let computedAvgAcc = targetUser.averageAccuracy || 90;
      const nonGameResults = testResults.filter(r => r.type !== 'game');
      if (nonGameResults.length > 0) {
        computedAvgAcc = Math.round(
          nonGameResults.reduce((sum, r) => sum + (r.accuracy || 0), 0) / nonGameResults.length
        );
      }

      let computedAvgWpm = targetUser.averageWPM || 0;
      if (nonGameResults.length > 0) {
        computedAvgWpm = Math.round(
          nonGameResults.reduce((sum, r) => sum + (r.wpm || 0), 0) / nonGameResults.length
        );
      }

      const { clientType, osPlatform } = this.getPlatformInfo();
      const cleanUser = targetUser.username.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const rowId = `${this.deviceId}_${cleanUser}`;

      const payload = {
        id: rowId,
        device_id: this.deviceId,
        user_id: targetUser.id,
        username: targetUser.username,
        client_type: clientType,
        os_platform: osPlatform,
        app_version: APP_VERSION,
        average_wpm: computedAvgWpm,
        best_wpm: stats.bestWPM || computedAvgWpm,
        average_accuracy: computedAvgAcc,
        lessons_completed_count: completedLessons.length,
        total_time_seconds: stats.totalTime || 0,
        total_tests: stats.totalTests || targetUser.totalTests || testResults.length,
        completed_lessons: completedLessons,
        test_results: testResults,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('☁️ [SUPABASE SYNC SUCCESS]: Synced full user progress for', targetUser.username, payload);

      const { error } = await supabase
        .from('user_telemetry')
        .upsert([payload], { onConflict: 'id' });

      if (error) {
        console.warn('⚠️ Supabase user_telemetry upsert alert:', error.message);
      } else {
        try {
          localStorage.setItem(`typing_app_last_sync_${targetUser.id}`, new Date().toISOString());
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Failed to sync user progress to cloud:', err);
    }
  }

  /**
   * Listen for live updates from Admin (e.g. unlocked lessons) via Supabase Realtime & Periodic Poll
   */
  subscribeToCloudProgressUpdates(userId, username, onCloudUpdate) {
    if (!navigator.onLine || !userId) return () => {};

    const cleanUser = (username || '').toLowerCase().trim();

    // 1. Initial fetch check on mount
    this.fetchLatestCloudProgress(userId, username, onCloudUpdate);

    // 2. Realtime Channel Subscription
    const channelName = `user_telemetry_sync_${userId}_${Math.random().toString(36).substring(2, 6)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_telemetry' },
        (payload) => {
          if (!payload.new) return;
          const remoteUser = (payload.new.username || '').toLowerCase().trim();
          const remoteUserId = payload.new.user_id || '';
          if (remoteUser === cleanUser || remoteUserId === userId) {
            console.log('⚡ [REALTIME CLOUD PUSH RECEIVED]: Admin updated progress!', payload.new);
            this.applyCloudProgressToLocal(userId, payload.new, onCloudUpdate);
          }
        }
      )
      .subscribe();

    // 3. Periodic 10s poll check in case Realtime WebSockets are blocked
    const pollInterval = setInterval(() => {
      this.fetchLatestCloudProgress(userId, username, onCloudUpdate);
    }, 10000);

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {}
      clearInterval(pollInterval);
    };
  }

  async fetchLatestCloudProgress(userId, username, onCloudUpdate) {
    try {
      if (!navigator.onLine || !userId) return;
      const cleanUser = (username || '').toLowerCase().trim();
      const { data } = await supabase
        .from('user_telemetry')
        .select('*')
        .or(`user_id.eq.${userId},username.ilike.${cleanUser || username}`)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const cloudRecord = data[0];
        this.applyCloudProgressToLocal(userId, cloudRecord, onCloudUpdate);
      }
    } catch (e) {}
  }

  applyCloudProgressToLocal(userId, cloudRecord, onCloudUpdate) {
    if (!cloudRecord || !userId) return;

    try {
      const progKey = `typing_app_user_progress_${userId}`;
      const localRaw = localStorage.getItem(progKey);
      const localProg = localRaw ? JSON.parse(localRaw) : { completedLessons: [], stats: {} };

      const remoteLessons = cloudRecord.completed_lessons || [];
      const localLessons = localProg.completedLessons || [];

      // If admin explicitly reset all progress (lessons_completed_count is 0 and total_tests is 0 in cloud)
      if (cloudRecord.lessons_completed_count === 0 && Array.isArray(remoteLessons) && remoteLessons.length === 0 && (cloudRecord.total_tests === 0 || cloudRecord.total_time_seconds === 0) && localLessons.length > 0) {
        console.log('🔄 [CLIENT DETECTED ADMIN RESET]: Resetting local progress to match cloud reset');
        localProg.completedLessons = [];
        localProg.testResults = [];
        if (localProg.stats) {
          localProg.stats.totalTests = 0;
          localProg.stats.totalTime = 0;
          localProg.stats.totalCharacters = 0;
          localProg.stats.bestWPM = 0;
          localProg.stats.bestAccuracy = 0;
        }
        localStorage.setItem(progKey, JSON.stringify(localProg));
        if (typeof onCloudUpdate === 'function') {
          onCloudUpdate(cloudRecord, 0);
        }
        return;
      }

      // ── MERGE: Take the UNION of local and remote lessons ──
      // Build a map keyed by lessonId, preferring the entry with real data (non-zero WPM)
      const mergedMap = new Map();

      // Add all local lessons first
      localLessons.forEach(l => {
        const id = typeof l === 'string' ? l : l.lessonId;
        if (id) mergedMap.set(id, l);
      });

      // Merge remote lessons — only overwrite if remote has better data or local doesn't have it
      remoteLessons.forEach(l => {
        const id = typeof l === 'string' ? l : l.lessonId;
        if (!id) return;
        const existing = mergedMap.get(id);
        if (!existing) {
          // Remote has a lesson local doesn't — ADD it
          mergedMap.set(id, l);
        } else {
          // Both have it — keep the one with real WPM data (not admin-placeholder 0)
          const existingWpm = typeof existing === 'object' ? (existing.wpm || 0) : 0;
          const remoteWpm = typeof l === 'object' ? (l.wpm || 0) : 0;
          if (remoteWpm > existingWpm) {
            mergedMap.set(id, l);
          }
        }
      });

      const mergedLessons = Array.from(mergedMap.values());

      // Check if the merge actually changed anything
      const localIds = new Set(localLessons.map(l => typeof l === 'string' ? l : l.lessonId).filter(Boolean));
      const mergedIds = new Set(mergedLessons.map(l => typeof l === 'string' ? l : l.lessonId).filter(Boolean));
      const newlyAddedIds = [...mergedIds].filter(id => !localIds.has(id));
      const hasNewLessons = newlyAddedIds.length > 0;

      if (hasNewLessons) {
        localProg.completedLessons = mergedLessons;
        if (!localProg.stats) localProg.stats = {};
        if (cloudRecord.best_wpm) localProg.stats.bestWPM = Math.max(localProg.stats?.bestWPM || 0, cloudRecord.best_wpm);
        if (cloudRecord.total_time_seconds) localProg.stats.totalTime = Math.max(localProg.stats?.totalTime || 0, cloudRecord.total_time_seconds);

        localStorage.setItem(progKey, JSON.stringify(localProg));

        console.log('🎉 [CLIENT LOCAL PROGRESS MERGED FROM CLOUD]: Total lessons after merge =', mergedLessons.length, '(local had', localIds.size, ', remote had', remoteLessons.length, ', new:', newlyAddedIds, ')');

        if (typeof onCloudUpdate === 'function') {
          onCloudUpdate(cloudRecord, mergedLessons.length, newlyAddedIds);
        }
      }
    } catch (e) {
      console.warn('Failed to apply cloud progress to local storage:', e);
    }
  }

  /**
   * Sync ONLY the active logged-in user to Supabase
   */
  async syncActiveUserProgress() {
    try {
      const currentUserId = localStorage.getItem('typing_app_current_user');
      if (currentUserId) {
        await this.syncUserProgress(currentUserId);
      }
    } catch (e) {}
  }

  /**
   * Called whenever a test or lesson finishes
   */
  recordTest(_testData = {}) {
    const currentUserId = localStorage.getItem('typing_app_current_user');
    if (currentUserId) {
      this.syncUserProgress(currentUserId);
    }
  }

  async checkBanStatus(username = '') {
    const targetUser = (username || '').toLowerCase().trim();
    if (!targetUser) {
      localStorage.removeItem('swift_device_banned');
      localStorage.removeItem('swift_ban_reason');
      return false;
    }

    // ── ONLINE: Always check Supabase FIRST (source of truth) ──
    if (navigator.onLine) {
      try {
        const targets = Array.from(new Set([
          username.trim(),
          targetUser
        ])).filter(Boolean);

        const { data } = await supabase
          .from('user_moderation')
          .select('*')
          .in('device_id', targets)
          .eq('is_banned', true)
          .limit(1);

        if (data && data.length > 0) {
          // Cloud says BANNED — cache locally for this account
          const item = data[0];
          const reason = item.ban_reason || 'Suspended by Administrator.';
          localStorage.setItem('swift_device_banned', 'true');
          localStorage.setItem('swift_ban_reason', reason);

          // Update local ban list (per-account entry)
          try {
            const list = JSON.parse(localStorage.getItem('swift_banned_devices') || '[]');
            const idx = list.findIndex(b => b.device_id?.toLowerCase() === targetUser);
            const entry = { device_id: targetUser, is_banned: true, ban_reason: reason, banned_at: new Date().toISOString() };
            if (idx >= 0) {
              list[idx] = entry;
            } else {
              list.unshift(entry);
            }
            localStorage.setItem('swift_banned_devices', JSON.stringify(list));
          } catch (e) { }

          return true;
        } else {
          // Cloud says NOT BANNED — clear ALL local ban flags for this user
          localStorage.removeItem('swift_device_banned');
          localStorage.removeItem('swift_ban_reason');

          // Remove this specific username from local ban list
          try {
            const list = JSON.parse(localStorage.getItem('swift_banned_devices') || '[]');
            const cleaned = list.filter(b => b.device_id?.toLowerCase() !== targetUser);
            localStorage.setItem('swift_banned_devices', JSON.stringify(cleaned));
          } catch (e) { }

          return false;
        }
      } catch (e) {
        // Network error — fall through to local cache below
      }
    }

    // ── OFFLINE fallback: check local cache for THIS specific username only ──
    try {
      const bannedList = JSON.parse(localStorage.getItem('swift_banned_devices') || '[]');
      const localFound = bannedList.find(b => {
        const d = (b.device_id || '').toLowerCase().trim();
        return b.is_banned && d === targetUser;
      });

      if (localFound) {
        const reason = localFound.ban_reason || 'Suspended by Administrator.';
        localStorage.setItem('swift_device_banned', 'true');
        localStorage.setItem('swift_ban_reason', reason);
        return true;
      }
    } catch (e) { }

    // No ban found locally for this specific username
    localStorage.removeItem('swift_device_banned');
    localStorage.removeItem('swift_ban_reason');
    return false;
  }
}

export const telemetry = new TelemetryTracker();
