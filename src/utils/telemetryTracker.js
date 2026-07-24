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

    // Track app launch
    this.trackLaunch();

    // Listen for tab/window unload to flush remaining stats
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flushSessionSummary());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flushSessionSummary();
        }
      });
    }
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
   * App launch ping - fires once when app loads if online
   */
  async trackLaunch() {
    if (!navigator.onLine) return;

    const today = new Date().toISOString().split('T')[0];
    const lastLaunchLogged = localStorage.getItem('swift_last_launch_date');
    if (lastLaunchLogged === today) return; // Only 1 launch ping per day per user

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
   * Called whenever user completes a test, lesson, or game
   */
  recordTest({ wpm = 0, accuracy = 0, timeSpent = 0, type = 'test' }) {
    // 1. Update local daily accumulator
    const today = new Date().toISOString().split('T')[0];
    let session = JSON.parse(localStorage.getItem('swift_today_session') || '{}');

    if (session.date !== today) {
      session = {
        date: today,
        testsCompleted: 0,
        wpmSum: 0,
        maxWpm: 0,
        accuracySum: 0,
        totalTimeSpent: 0
      };
    }

    session.testsCompleted += 1;
    session.wpmSum += Number(wpm) || 0;
    session.maxWpm = Math.max(session.maxWpm || 0, Number(wpm) || 0);
    session.accuracySum += Number(accuracy) || 0;
    session.totalTimeSpent += Number(timeSpent) || 0;

    localStorage.setItem('swift_today_session', JSON.stringify(session));

    // 2. Check if we should sync to server (every 3 mins max or after 3 tests)
    const now = Date.now();
    if (now - this.lastSyncTime > this.SYNC_INTERVAL_MS || session.testsCompleted % 3 === 0) {
      this.flushSessionSummary();
    }
  }

  /**
   * Flushes current session summary payload to Supabase
   */
  async flushSessionSummary() {
    if (!navigator.onLine) return;

    const session = JSON.parse(localStorage.getItem('swift_today_session') || '{}');
    if (!session.testsCompleted) return;

    const { clientType, osPlatform } = this.getPlatformInfo();
    const avgWpm = Math.round(session.wpmSum / session.testsCompleted);
    const avgAccuracy = Math.round(session.accuracySum / session.testsCompleted);

    const payload = {
      device_id: this.deviceId,
      client_type: clientType,
      app_version: APP_VERSION,
      os_platform: osPlatform,
      event_type: 'session_summary',
      event_data: {
        tests_completed: session.testsCompleted,
        avg_wpm: avgWpm,
        max_wpm: session.maxWpm,
        avg_accuracy: avgAccuracy,
        total_time_seconds: session.totalTimeSpent
      }
    };

    try {
      const { error } = await supabase.from('app_telemetry').insert([payload]);
      if (!error) {
        this.lastSyncTime = Date.now();
      }
    } catch (err) {
      // Quiet fail
    }
  }
}

export const telemetry = new TelemetryTracker();
