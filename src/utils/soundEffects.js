// Sound Effects System for Swift Typing
// Uses Web Audio API for low-latency sound generation

class SoundEffectsManager {
  constructor() {
    this.audioContext = null;
    this.enabled = true;
    this.volume = 0.3;
    this.soundType = 'mechanical'; // 'mechanical', 'soft', 'typewriter', 'none'
    
    // Load settings from localStorage
    this.loadSettings();
  }

  // Initialize Audio Context (must be called after user interaction)
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this;
  }

  // Get current configuration
  getConfig() {
    return {
      enabled: this.enabled,
      volume: this.volume,
      soundType: this.soundType
    };
  }

  // Toggle sound on/off and return new state
  toggle() {
    this.enabled = !this.enabled;
    this.saveSettings();
    return this.enabled;
  }

  // Load settings from localStorage
  loadSettings() {
    try {
      const settings = localStorage.getItem('typing_app_sound_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.enabled = parsed.enabled !== false;
        this.volume = parsed.volume || 0.3;
        this.soundType = parsed.soundType || 'mechanical';
      }
    } catch (e) {
      console.warn('Failed to load sound settings:', e);
    }
  }

  // Save settings to localStorage
  saveSettings() {
    try {
      localStorage.setItem('typing_app_sound_settings', JSON.stringify({
        enabled: this.enabled,
        volume: this.volume,
        soundType: this.soundType
      }));
    } catch (e) {
      console.warn('Failed to save sound settings:', e);
    }
  }

  // Set enabled state
  setEnabled(enabled) {
    this.enabled = enabled;
    this.saveSettings();
  }

  // Set volume (0-1)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  // Set sound type
  setSoundType(type) {
    this.soundType = type;
    this.saveSettings();
  }

  // Generate a click/keystroke sound (alias: playKeypress)
  playKeypress() {
    if (!this.enabled || this.soundType === 'none') return;
    this.init();

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      // Different sound profiles
      const soundProfiles = {
        mechanical: {
          frequency: 800 + Math.random() * 200,
          type: 'square',
          duration: 0.05,
          filterFreq: 2000,
          attack: 0.001,
          decay: 0.04
        },
        soft: {
          frequency: 400 + Math.random() * 100,
          type: 'sine',
          duration: 0.03,
          filterFreq: 1000,
          attack: 0.005,
          decay: 0.025
        },
        typewriter: {
          frequency: 1200 + Math.random() * 300,
          type: 'sawtooth',
          duration: 0.08,
          filterFreq: 3000,
          attack: 0.001,
          decay: 0.07
        }
      };

      const profile = soundProfiles[this.soundType] || soundProfiles.mechanical;

      oscillator.type = profile.type;
      oscillator.frequency.setValueAtTime(profile.frequency, this.audioContext.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(profile.filterFreq, this.audioContext.currentTime);

      // Envelope
      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.5, now + profile.attack);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + profile.duration);

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start(now);
      oscillator.stop(now + profile.duration);
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }

  // Play error sound (wrong key)
  playError() {
    if (!this.enabled || this.soundType === 'none') return;
    this.init();

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);

      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(this.volume * 0.4, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start(now);
      oscillator.stop(now + 0.15);
    } catch (e) {
      console.warn('Error sound playback failed:', e);
    }
  }

  // Play success/completion sound
  playSuccess() {
    if (!this.enabled || this.soundType === 'none') return;
    this.init();

    try {
      // Play a pleasant chord
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (C major chord)
      
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = this.audioContext.createOscillator();
          const gainNode = this.audioContext.createGain();

          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);

          const now = this.audioContext.currentTime;
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext.destination);

          oscillator.start(now);
          oscillator.stop(now + 0.5);
        }, index * 100);
      });
    } catch (e) {
      console.warn('Success sound playback failed:', e);
    }
  }

  // Play achievement unlocked sound
  playAchievement() {
    if (!this.enabled || this.soundType === 'none') return;
    this.init();

    try {
      // Fanfare-like sound
      const notes = [
        { freq: 523.25, delay: 0, duration: 0.15 },
        { freq: 659.25, delay: 0.1, duration: 0.15 },
        { freq: 783.99, delay: 0.2, duration: 0.15 },
        { freq: 1046.50, delay: 0.3, duration: 0.4 }
      ];

      notes.forEach(note => {
        setTimeout(() => {
          const oscillator = this.audioContext.createOscillator();
          const gainNode = this.audioContext.createGain();

          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(note.freq, this.audioContext.currentTime);

          const now = this.audioContext.currentTime;
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, now + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + note.duration);

          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext.destination);

          oscillator.start(now);
          oscillator.stop(now + note.duration);
        }, note.delay * 1000);
      });
    } catch (e) {
      console.warn('Achievement sound playback failed:', e);
    }
  }

  // Play streak sound (milestone reached)
  playStreak() {
    if (!this.enabled || this.soundType === 'none') return;
    this.init();

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.2);

      const now = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start(now);
      oscillator.stop(now + 0.3);
    } catch (e) {
      console.warn('Streak sound playback failed:', e);
    }
  }
}

// Export singleton instance
export const soundEffects = new SoundEffectsManager();
export default soundEffects;
