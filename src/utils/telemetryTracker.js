import { supabase } from './supabaseClient';

const APP_VERSION = '3.26.8'; // Swift Typing Version

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

/**
 * Smart Telemetry Tracker
 * Accumulates practice data locally and periodically syncs to Supabase
 * without spamming network requests or overloading servers.
 */
class TelemetryTracker {
  constructor() {
    this.deviceId = getDeviceId();
    this.lastSyncTime = 0;
    this.SYNC_INTERVAL_MS = 3 * 60 * 1000; // Sync every 3 minutes max
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Track app launch (Max 1 ping per day per user)
    this.trackLaunch();
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
   * App launch ping - STRICTLY max 1 ping per day per user
   */
  async trackLaunch() {
    if (!navigator.onLine) return;

    const today = new Date().toISOString().split('T')[0];
    const lastLaunchLogged = localStorage.getItem('swift_last_launch_date');
    if (lastLaunchLogged === today) return; // Zero requests if already launched today!

    const { clientType, osPlatform } = this.getPlatformInfo();

    try {
      await supabase.from('app_telemetry').insert([{
        device_id: this.deviceId,
        client_type: clientType,
        app_version: APP_VERSION,
        os_platform: osPlatform,
        event_type: 'app_launch',
        event_data: { timestamp: new Date().toISOString() }
      }]);
      localStorage.setItem('swift_last_launch_date', today);
    } catch (err) {
      // Quietly ignore network failures
    }
  }

  /**
   * Called ONLY when user actually completes a test, lesson, or game
   */
  async recordTest({ wpm = 0, accuracy = 0, timeSpent = 0, type = 'test' }) {
    if (!navigator.onLine) return;

    // 5-second cooldown to prevent spamming DB requests
    const now = Date.now();
    if (now - this.lastSyncTime < 5000) return;
    this.lastSyncTime = now;

    try {
      const { clientType, osPlatform } = this.getPlatformInfo();
      let username = 'Anonymous Typist';
      try {
        const currentUserId = localStorage.getItem('typing_app_current_user');
        const users = JSON.parse(localStorage.getItem('typing_app_users') || '[]');
        const user = users.find(u => u.id === currentUserId);
        if (user?.username) username = user.username;
      } catch (e) {}

      const payload = {
        device_id: this.deviceId,
        client_type: clientType,
        app_version: APP_VERSION,
        os_platform: osPlatform,
        event_type: 'test_completed',
        event_data: {
          username,
          wpm: Number(wpm) || 0,
          accuracy: Number(accuracy) || 0,
          time_spent_seconds: Number(timeSpent) || 0,
          type: type || 'lesson'
        }
      };

      await supabase.from('app_telemetry').insert([payload]);
    } catch (err) {
      // Quiet fail
    }
  }
}

export const telemetry = new TelemetryTracker();
