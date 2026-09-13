// Sound Effects System for Swift Typing
// Realistic Physical Acoustic Synthesis using Web Audio API for ultra low-latency, authentic keyboard sounds

class SoundEffectsManager {
  constructor() {
    this.audioContext = null;
    this.noiseBuffer = null;
    this.enabled = true;
    this.volume = 0.35;
    this.soundType = 'default'; // 'default', 'thocky', 'cherry', 'soft', 'typewriter', 'none'
    
    // Load settings from localStorage
    this.loadSettings();
  }

  // Initialize Audio Context (must be called after user interaction)
  init() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this;
  }

  // Shared pre-generated noise buffer for authentic physical impact transients
  getNoiseBuffer() {
    if (!this.audioContext) return null;
    if (!this.noiseBuffer) {
      const duration = 0.2; // 200ms white noise buffer
      const bufferSize = Math.floor(this.audioContext.sampleRate * duration);
      this.noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return this.noiseBuffer;
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
        this.volume = parsed.volume !== undefined ? parsed.volume : 0.35;
        this.soundType = parsed.soundType || 'default';
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

  // ── Keyboard Switch Profiles ────────────────────────────────────────────────

  // 0. DEFAULT (Classic Swift-Typing keystroke - active by default for all users)
  playDefault(now) {
    const ctx = this.audioContext;
    const vol = this.volume;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    const freq = 800 + Math.random() * 200;
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(vol * 0.5, now + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // 1. THOCKY (Lubed Linear / NovelKeys Cream / Holy Panda style)
  // Character: Deep, warm, creamy, low-frequency cavity resonance with muted transient
  playThocky(now) {
    const ctx = this.audioContext;
    const vol = this.volume;
    const noiseBuf = this.getNoiseBuffer();

    // Layer A: Low-frequency acoustic cavity bottom-out thud (sine/triangle body)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    const oscFilter = ctx.createBiquadFilter();

    const baseFreq = 155 + (Math.random() * 20 - 10);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.045);

    oscFilter.type = 'lowpass';
    oscFilter.frequency.setValueAtTime(420, now);
    oscFilter.Q.setValueAtTime(1.2, now);

    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(vol * 0.9, now + 0.002);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.048);

    osc.connect(oscFilter);
    oscFilter.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);

    // Layer B: Warm plastic stem impact (bandpassed low noise)
    if (noiseBuf) {
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(310 + (Math.random() * 30 - 15), now);
      noiseFilter.Q.setValueAtTime(2.2, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(vol * 0.75, now + 0.001);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now, Math.random() * 0.05);
      noise.stop(now + 0.035);
    }
  }

  // 2. CHERRY MX (Clicky / Blue / Kailh Box White style)
  // Character: Razor-sharp high-frequency tactile click leaf snap + crisp housing clack
  playCherry(now) {
    const ctx = this.audioContext;
    const vol = this.volume;
    const noiseBuf = this.getNoiseBuffer();

    // Layer A: Click leaf metal snap (sharp high transient)
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    const clickFilter = ctx.createBiquadFilter();

    const clickFreq = 3400 + (Math.random() * 300 - 150);
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(clickFreq, now);
    clickOsc.frequency.exponentialRampToValueAtTime(1200, now + 0.012);

    clickFilter.type = 'bandpass';
    clickFilter.frequency.setValueAtTime(3600, now);
    clickFilter.Q.setValueAtTime(4.0, now);

    clickGain.gain.setValueAtTime(0, now);
    clickGain.gain.linearRampToValueAtTime(vol * 0.85, now + 0.0008);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);

    clickOsc.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(ctx.destination);

    clickOsc.start(now);
    clickOsc.stop(now + 0.015);

    // Layer B: Tactile click bar high-frequency noise pop
    if (noiseBuf) {
      const snapNoise = ctx.createBufferSource();
      snapNoise.buffer = noiseBuf;

      const snapFilter = ctx.createBiquadFilter();
      snapFilter.type = 'highpass';
      snapFilter.frequency.setValueAtTime(4200, now);

      const snapGain = ctx.createGain();
      snapGain.gain.setValueAtTime(0, now);
      snapGain.gain.linearRampToValueAtTime(vol * 0.7, now + 0.0008);
      snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);

      snapNoise.connect(snapFilter);
      snapFilter.connect(snapGain);
      snapGain.connect(ctx.destination);

      snapNoise.start(now, Math.random() * 0.05);
      snapNoise.stop(now + 0.016);

      // Layer C: 2.5ms delayed bottom-out plastic tap (clack)
      const bottomNoise = ctx.createBufferSource();
      bottomNoise.buffer = noiseBuf;

      const bottomFilter = ctx.createBiquadFilter();
      bottomFilter.type = 'bandpass';
      bottomFilter.frequency.setValueAtTime(1800 + (Math.random() * 150 - 75), now + 0.0025);
      bottomFilter.Q.setValueAtTime(2.0, now + 0.0025);

      const bottomGain = ctx.createGain();
      bottomGain.gain.setValueAtTime(0, now + 0.0025);
      bottomGain.gain.linearRampToValueAtTime(vol * 0.5, now + 0.004);
      bottomGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.024);

      bottomNoise.connect(bottomFilter);
      bottomFilter.connect(bottomGain);
      bottomGain.connect(ctx.destination);

      bottomNoise.start(now + 0.0025, Math.random() * 0.05);
      bottomNoise.stop(now + 0.025);
    }
  }

  // 3. CLASSIC MECHANICAL (Standard Red / Brown tactile clack)
  playMechanical(now) {
    const ctx = this.audioContext;
    const vol = this.volume;
    const noiseBuf = this.getNoiseBuffer();

    if (noiseBuf) {
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1150 + (Math.random() * 120 - 60), now);
      filter.Q.setValueAtTime(1.8, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol * 0.65, now + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.032);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now, Math.random() * 0.05);
      noise.stop(now + 0.034);
    }

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.028);

    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(vol * 0.45, now + 0.002);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  // 4. SOFT (Low-profile quiet membrane / chiclet)
  playSoft(now) {
    const ctx = this.audioContext;
    const vol = this.volume;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260 + (Math.random() * 20 - 10), now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.022);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(550, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol * 0.4, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.026);
  }

  // 5. TYPEWRITER (Vintage heavy metal lever + platen strike)
  playTypewriter(now) {
    const ctx = this.audioContext;
    const vol = this.volume;
    const noiseBuf = this.getNoiseBuffer();

    if (noiseBuf) {
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200 + (Math.random() * 200 - 100), now);
      filter.Q.setValueAtTime(2.8, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol * 0.8, now + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now, Math.random() * 0.05);
      noise.stop(now + 0.046);
    }

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.045);

    oscGain.gain.setValueAtTime(0, now);
    oscGain.gain.linearRampToValueAtTime(vol * 0.45, now + 0.002);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.046);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.048);
  }

  // Generate keystroke sound based on selected profile
  playKeypress() {
    if (!this.enabled || this.soundType === 'none') return;
    this.init();
    if (!this.audioContext) return;

    try {
      const now = this.audioContext.currentTime;
      switch (this.soundType) {
        case 'thocky':
          this.playThocky(now);
          break;
        case 'cherry':
          this.playCherry(now);
          break;
        case 'soft':
          this.playSoft(now);
          break;
        case 'typewriter':
          this.playTypewriter(now);
          break;
        case 'default':
        case 'mechanical':
        default:
          this.playDefault(now);
          break;
      }
    } catch (e) {
      console.warn('Sound playback failed:', e);
    }
  }

  // Play error sound (wrong key)
  playError() {
    if (!this.enabled || this.soundType === 'none') return;
    this.init();
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      oscillator.type = 'sawtooth';
      const now = this.audioContext.currentTime;
      oscillator.frequency.setValueAtTime(180, now);
      oscillator.frequency.exponentialRampToValueAtTime(90, now + 0.1);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, now);

      gainNode.gain.setValueAtTime(this.volume * 0.45, now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start(now);
      oscillator.stop(now + 0.12);
    } catch (e) {
      console.warn('Error sound playback failed:', e);
    }
  }

  // Play success/completion sound
  playSuccess() {
    if (!this.enabled || this.soundType === 'none') return;
    this.init();
    if (!this.audioContext) return;

    try {
      // Pleasant C major triad arpeggio
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
      
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          if (!this.audioContext) return;
          const oscillator = this.audioContext.createOscillator();
          const gainNode = this.audioContext.createGain();

          oscillator.type = 'sine';
          const now = this.audioContext.currentTime;
          oscillator.frequency.setValueAtTime(freq, now);

          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(this.volume * 0.35, now + 0.03);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext.destination);

          oscillator.start(now);
          oscillator.stop(now + 0.4);
        }, index * 90);
      });
    } catch (e) {
      console.warn('Success sound playback failed:', e);
    }
  }

  // Play achievement unlocked fanfare
  playAchievement() {
    if (!this.enabled || this.soundType === 'none') return;
    this.init();
    if (!this.audioContext) return;

    try {
      const notes = [
        { freq: 523.25, delay: 0, duration: 0.14 },
        { freq: 659.25, delay: 0.09, duration: 0.14 },
        { freq: 783.99, delay: 0.18, duration: 0.14 },
        { freq: 1046.50, delay: 0.28, duration: 0.35 }
      ];

      notes.forEach(note => {
        setTimeout(() => {
          if (!this.audioContext) return;
          const oscillator = this.audioContext.createOscillator();
          const gainNode = this.audioContext.createGain();

          oscillator.type = 'triangle';
          const now = this.audioContext.currentTime;
          oscillator.frequency.setValueAtTime(note.freq, now);

          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, now + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + note.duration);

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

  // Play streak milestone sound
  playStreak() {
    if (!this.enabled || this.soundType === 'none') return;
    this.init();
    if (!this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = 'sine';
      const now = this.audioContext.currentTime;
      oscillator.frequency.setValueAtTime(750, now);
      oscillator.frequency.exponentialRampToValueAtTime(1150, now + 0.18);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.35, now + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start(now);
      oscillator.stop(now + 0.25);
    } catch (e) {
      console.warn('Streak sound playback failed:', e);
    }
  }
}

// Export singleton instance
export const soundEffects = new SoundEffectsManager();
export default soundEffects;

// Helper function for playing sounds by name
export const playSound = (soundName) => {
  switch (soundName) {
    case 'correct':
      soundEffects.playSuccess();
      break;
    case 'error':
      soundEffects.playError();
      break;
    case 'levelUp':
      soundEffects.playAchievement();
      break;
    case 'keypress':
      soundEffects.playKeypress();
      break;
    case 'streak':
      soundEffects.playStreak();
      break;
    default:
      soundEffects.playKeypress();
  }
};
