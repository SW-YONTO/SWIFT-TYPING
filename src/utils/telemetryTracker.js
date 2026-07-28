import { supabase } from './supabaseClient';

const APP_VERSION = '3.26.9'; // Swift Typing Version

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
        .or(`user_id.eq.${userId},username.ilike.${username}`)
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

      const remoteJson = JSON.stringify((remoteLessons || []).map(l => typeof l === 'string' ? l : l.lessonId).sort());
      const localJson = JSON.stringify((localLessons || []).map(l => typeof l === 'string' ? l : l.lessonId).sort());

      const hasNewData = remoteJson !== localJson;

      if (hasNewData) {
        localProg.completedLessons = remoteLessons;
        if (cloudRecord.best_wpm) localProg.stats.bestWPM = Math.max(localProg.stats?.bestWPM || 0, cloudRecord.best_wpm);
        if (cloudRecord.total_time_seconds) localProg.stats.totalTime = Math.max(localProg.stats?.totalTime || 0, cloudRecord.total_time_seconds);

        localStorage.setItem(progKey, JSON.stringify(localProg));

        console.log('🎉 [CLIENT LOCAL PROGRESS SYNCED FROM CLOUD]: Updated lessons count =', remoteLessons.length);

        if (typeof onCloudUpdate === 'function') {
          onCloudUpdate(cloudRecord, remoteLessons.length);
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
  recordTest({ wpm = 0, accuracy = 0, timeSpent = 0, type = 'test' }) {
    const currentUserId = localStorage.getItem('typing_app_current_user');
    if (currentUserId) {
      this.syncUserProgress(currentUserId);
    }
  }

  async checkBanStatus(username = '') {
    const targetUser = (username || '').toLowerCase();
    const targetDev = (this.deviceId || '').toLowerCase();

    try {
      const bannedList = JSON.parse(localStorage.getItem('swift_banned_devices') || '[]');
      const localFound = bannedList.find(b => {
        const d = (b.device_id || '').toLowerCase();
        return b.is_banned && (d === targetDev || (targetUser && d === targetUser));
      });

      if (localFound) {
        const reason = localFound.ban_reason || 'Suspended by Administrator.';
        localStorage.setItem('swift_device_banned', 'true');
        localStorage.setItem('swift_ban_reason', reason);
        return true;
      }
    } catch (e) { }

    if (!navigator.onLine) {
      return localStorage.getItem('swift_device_banned') === 'true';
    }

    try {
      const targets = Array.from(new Set([
        this.deviceId,
        targetDev,
        username,
        targetUser
      ])).filter(Boolean);

      const { data } = await supabase
        .from('user_moderation')
        .select('*')
        .in('device_id', targets)
        .eq('is_banned', true)
        .limit(1);

      if (data && data.length > 0) {
        const item = data[0];
        const reason = item.ban_reason || 'Suspended by Administrator.';
        localStorage.setItem('swift_device_banned', 'true');
        localStorage.setItem('swift_ban_reason', reason);

        try {
          const list = JSON.parse(localStorage.getItem('swift_banned_devices') || '[]');
          if (!list.some(b => b.device_id?.toLowerCase() === targetDev)) {
            list.unshift({ device_id: username || this.deviceId, is_banned: true, ban_reason: reason, banned_at: new Date().toISOString() });
            localStorage.setItem('swift_banned_devices', JSON.stringify(list));
          }
        } catch (e) { }

        return true;
      } else {
        localStorage.removeItem('swift_device_banned');
        localStorage.removeItem('swift_ban_reason');
        return false;
      }
    } catch (e) {
      return localStorage.getItem('swift_device_banned') === 'true';
    }
  }
}

export const telemetry = new TelemetryTracker();
