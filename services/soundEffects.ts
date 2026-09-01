// Sound Effects Engine using Web Audio API (Zero dependencies, offline, instantaneous, highly interactive)
let audioCtx: AudioContext | null = null;
let activeSirenInterval: NodeJS.Timeout | null = null;
let activeWarningInterval: NodeJS.Timeout | null = null;

export interface AudioSettingsConfig {
  muteDuringSleepHours?: boolean;
  muteInteractionSounds?: boolean;
  sleepHoursStart?: number; // e.g. 0 (12:00 AM)
  sleepHoursEnd?: number; // e.g. 8 (8:00 AM)
  soundEnabled?: boolean;
}

let currentAudioSettings: AudioSettingsConfig = {
  muteDuringSleepHours: true,
  muteInteractionSounds: false,
  sleepHoursStart: 0,
  sleepHoursEnd: 8,
  soundEnabled: true
};

export const updateAudioSettings = (settings: AudioSettingsConfig) => {
  currentAudioSettings = { ...currentAudioSettings, ...settings };
};

const isSleepHourNow = (): boolean => {
  const currentHour = new Date().getHours();
  const start = currentAudioSettings.sleepHoursStart ?? 0;
  const end = currentAudioSettings.sleepHoursEnd ?? 8;
  if (start <= end) {
    return currentHour >= start && currentHour < end;
  }
  return currentHour >= start || currentHour < end;
};

const isInteractionSoundAllowed = (): boolean => {
  if (currentAudioSettings.soundEnabled === false) return false;
  if (currentAudioSettings.muteInteractionSounds) return false;
  return true;
};

const isNotificationSoundAllowed = (): boolean => {
  if (currentAudioSettings.soundEnabled === false) return false;
  if (currentAudioSettings.muteDuringSleepHours && isSleepHourNow()) return false;
  return true;
};

export const getAudioContext = (): AudioContext | null => {
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
};

/**
 * Stop any active continuous siren or escalating warning loops
 */
export const stopContinuousSounds = () => {
  if (activeSirenInterval) {
    clearInterval(activeSirenInterval);
    activeSirenInterval = null;
  }
  if (activeWarningInterval) {
    clearInterval(activeWarningInterval);
    activeWarningInterval = null;
  }
};

/**
 * SHIPWRECK & DANGER KLAXON + CONTINUOUS AGGRESSIVE BUZZER (صوت إنذار غرق السفن + الطنان المزعج المستمر)
 * Synthesizes a true naval distress klaxon, general quarters ship emergency horn,
 * combined with an aggressive continuous electrical alarm buzzer and sub-bass danger pulse.
 */
export const playShipDistressKlaxonWithBuzzer = (intensityLevel: number = 2) => {
  if (!isNotificationSoundAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const duration = 1.35;

    // --- LAYER 1: Deep Naval Shipwreck Klaxon (بوق استغاثة وإنذار غرق السفن الضخم) ---
    // Classic oscillating naval diving/shipwreck alarm (Whoop-Whoop / Klaxon)
    const klaxonOsc = ctx.createOscillator();
    const klaxonGain = ctx.createGain();
    const klaxonDistortion = ctx.createWaveShaper();

    // Create subtle warm clipping curve for authentic horn acoustics
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; ++i) {
      const x = (i * 2) / 256 - 1;
      curve[i] = ((3 + 2) * x * 20 * (Math.PI / 180)) / (Math.PI + 2 * Math.abs(x));
    }
    klaxonDistortion.curve = curve;

    klaxonOsc.type = 'sawtooth';
    // Frequency sweep imitating ship horn klaxon
    const baseFreq = 180 + intensityLevel * 30; // 180Hz to 270Hz
    const peakFreq = 380 + intensityLevel * 60; // 380Hz to 560Hz

    // Cycle 1 of Ship Alarm
    klaxonOsc.frequency.setValueAtTime(baseFreq, now);
    klaxonOsc.frequency.exponentialRampToValueAtTime(peakFreq, now + 0.35);
    klaxonOsc.frequency.linearRampToValueAtTime(baseFreq * 0.9, now + 0.6);

    // Cycle 2 of Ship Alarm
    klaxonOsc.frequency.setValueAtTime(baseFreq, now + 0.65);
    klaxonOsc.frequency.exponentialRampToValueAtTime(peakFreq * 1.05, now + 0.98);
    klaxonOsc.frequency.linearRampToValueAtTime(baseFreq * 0.85, now + 1.25);

    const klaxonVol = Math.min(0.32 + intensityLevel * 0.05, 0.48);
    klaxonGain.gain.setValueAtTime(klaxonVol, now);
    klaxonGain.gain.setValueAtTime(klaxonVol, now + 1.15);
    klaxonGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Filter to give that metallic ship cabin resonance
    const klaxonFilter = ctx.createBiquadFilter();
    klaxonFilter.type = 'bandpass';
    klaxonFilter.frequency.setValueAtTime(480 + intensityLevel * 50, now);
    klaxonFilter.Q.setValueAtTime(2.5, now);

    klaxonOsc.connect(klaxonDistortion);
    klaxonDistortion.connect(klaxonFilter);
    klaxonFilter.connect(klaxonGain);
    klaxonGain.connect(ctx.destination);

    klaxonOsc.start(now);
    klaxonOsc.stop(now + duration);

    // --- LAYER 2: Aggressive Continuous Industrial Buzzer (الطنان المزعج المستمر) ---
    // High-pitched rapid abrasive square-wave electrical buzzer
    const buzzerPitches = [640, 780, 920];
    const buzzerVolume = Math.min(0.2 + intensityLevel * 0.06, 0.42);

    buzzerPitches.forEach((pitch, pIdx) => {
      const buzzerOsc = ctx.createOscillator();
      const buzzerGain = ctx.createGain();
      buzzerOsc.type = 'square';
      buzzerOsc.frequency.setValueAtTime(pitch + (pIdx * 15), now);

      // Rapid pulsing gate (Stroboscopic buzzer clicks: on/off 12 times per second)
      const numPulses = 10;
      const pulseLen = duration / numPulses;
      for (let i = 0; i < numPulses; i++) {
        const pStart = now + i * pulseLen;
        const pMid = pStart + pulseLen * 0.65;
        const pEnd = pStart + pulseLen;
        buzzerGain.gain.setValueAtTime(buzzerVolume, pStart);
        buzzerGain.gain.setValueAtTime(buzzerVolume * 0.9, pMid);
        buzzerGain.gain.setValueAtTime(0.005, pEnd - 0.01);
      }
      buzzerGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      buzzerOsc.connect(buzzerGain);
      buzzerGain.connect(ctx.destination);
      buzzerOsc.start(now);
      buzzerOsc.stop(now + duration);
    });

    // --- LAYER 3: Emergency Distress Dual-Tone Wailing Siren (صفارة الخطر المتناوبة) ---
    const sirenOsc = ctx.createOscillator();
    const sirenGain = ctx.createGain();
    sirenOsc.type = 'triangle';

    sirenOsc.frequency.setValueAtTime(750, now);
    sirenOsc.frequency.linearRampToValueAtTime(1250, now + 0.3);
    sirenOsc.frequency.linearRampToValueAtTime(750, now + 0.6);
    sirenOsc.frequency.linearRampToValueAtTime(1300, now + 0.95);
    sirenOsc.frequency.linearRampToValueAtTime(700, now + 1.25);

    sirenGain.gain.setValueAtTime(0.18 + intensityLevel * 0.04, now);
    sirenGain.gain.setValueAtTime(0.18 + intensityLevel * 0.04, now + 1.15);
    sirenGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    sirenOsc.connect(sirenGain);
    sirenGain.connect(ctx.destination);
    sirenOsc.start(now);
    sirenOsc.stop(now + duration);

    // --- LAYER 4: Deep Danger Sub-Bass Hull Heartbeat (ضربات قاع السفينة الهادرة) ---
    const bassBeats = [0, 0.32, 0.65, 0.98];
    bassBeats.forEach(bTime => {
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'triangle';
      const bStart = now + bTime;
      bassOsc.frequency.setValueAtTime(110, bStart);
      bassOsc.frequency.exponentialRampToValueAtTime(38, bStart + 0.22);

      bassGain.gain.setValueAtTime(0.42, bStart);
      bassGain.gain.exponentialRampToValueAtTime(0.001, bStart + 0.23);

      bassOsc.connect(bassGain);
      bassGain.connect(ctx.destination);
      bassOsc.start(bStart);
      bassOsc.stop(bStart + 0.24);
    });

  } catch {
    // Ignore audio errors
  }
};

/**
 * STAGE 1 SOUND: Friendly Dispatch & Telephone Ring + Early Warning Chime
 */
export const playStage1NormalReminder = () => {
  if (!isNotificationSoundAllowed()) return;
  // Play subtle ship alert + friendly warning
  playShipDistressKlaxonWithBuzzer(1);
};

/**
 * STAGE 2 SOUND: Escalating Warning Alert with Ship Klaxon & Annoying Buzzer
 * @param step from 0 to 5 for escalating intensity
 */
export const playStage2EscalatingWarning = (step = 0) => {
  if (!isNotificationSoundAllowed()) return;
  const intensity = Math.min(step + 1, 4);
  playShipDistressKlaxonWithBuzzer(intensity);
};

/**
 * STAGE 3 SOUND: Critical Emergency SOS Shipwreck Siren + Max Volume Continuous Buzzer
 */
export const playStage3EmergencySOS = () => {
  if (!isNotificationSoundAllowed()) return;
  // Full-scale catastrophic ship distress klaxon + piercing continuous emergency buzzer
  playShipDistressKlaxonWithBuzzer(5);
};

/**
 * Play a rich, joyful cash register & coin win chime (for earnings / courses / profit)
 */
export const playEarningCashSound = () => {
  if (!isInteractionSoundAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Fast mechanical register click
    const oscClick = ctx.createOscillator();
    const gainClick = ctx.createGain();
    oscClick.type = 'triangle';
    oscClick.frequency.setValueAtTime(1200, now);
    oscClick.frequency.exponentialRampToValueAtTime(300, now + 0.04);
    gainClick.gain.setValueAtTime(0.2, now);
    gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    oscClick.connect(gainClick);
    gainClick.connect(ctx.destination);
    oscClick.start(now);
    oscClick.stop(now + 0.04);

    // Multi-coin cascade (B5, D6, F#6, B6)
    const coinNotes = [987.77, 1174.66, 1479.98, 1975.53];
    coinNotes.forEach((freq, index) => {
      const startTime = now + 0.03 + index * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.22, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  } catch {
    // Ignore audio errors
  }
};

/**
 * Play a crisp debit / withdrawal / expense deduction sound (downward whoosh + snap)
 */
export const playExpenseDeductSound = () => {
  if (!isInteractionSoundAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Downward swoosh oscillator
    const oscSwoosh = ctx.createOscillator();
    const gainSwoosh = ctx.createGain();
    oscSwoosh.type = 'sawtooth';
    oscSwoosh.frequency.setValueAtTime(520, now);
    oscSwoosh.frequency.exponentialRampToValueAtTime(140, now + 0.18);
    gainSwoosh.gain.setValueAtTime(0.12, now);
    gainSwoosh.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    oscSwoosh.connect(gainSwoosh);
    gainSwoosh.connect(ctx.destination);
    oscSwoosh.start(now);
    oscSwoosh.stop(now + 0.18);

    // Filtered noise swoosh
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.15);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // Low gentle thud
    const oscThud = ctx.createOscillator();
    const gainThud = ctx.createGain();
    oscThud.type = 'sine';
    oscThud.frequency.setValueAtTime(160, now + 0.08);
    oscThud.frequency.exponentialRampToValueAtTime(45, now + 0.25);
    gainThud.gain.setValueAtTime(0.18, now + 0.08);
    gainThud.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    oscThud.connect(gainThud);
    gainThud.connect(ctx.destination);
    oscThud.start(now + 0.08);
    oscThud.stop(now + 0.25);
  } catch {
    // Ignore
  }
};

/**
 * Play a subtle, pleasant acoustic keypad click/tap
 */
export const playKeypadBeep = (key?: string) => {
  if (!isInteractionSoundAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (key === 'C') {
      // Clear key: slightly lower tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    } else if (key === '✓') {
      // Confirm key: higher bright chirp
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    } else {
      // Normal numbers: distinct soft click
      const freq = 450 + (parseInt(key || '1') || 1) * 35;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch {
    // Ignore
  }
};

/**
 * Play heavy golden vault lock / deposit sound
 */
export const playVaultDepositSound = () => {
  if (!isInteractionSoundAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Metallic heavy latch
    const oscLatch = ctx.createOscillator();
    const gainLatch = ctx.createGain();
    oscLatch.type = 'square';
    oscLatch.frequency.setValueAtTime(220, now);
    oscLatch.frequency.exponentialRampToValueAtTime(80, now + 0.12);
    gainLatch.gain.setValueAtTime(0.15, now);
    gainLatch.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    oscLatch.connect(gainLatch);
    gainLatch.connect(ctx.destination);
    oscLatch.start(now);
    oscLatch.stop(now + 0.12);

    // Golden chime echo
    [784, 1046.5, 1318.5, 1567.98].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + 0.1 + idx * 0.08;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  } catch {
    // Ignore
  }
};

/**
 * Play a classic coin chime (upon deposit / settlement)
 */
export const playCoinChime = () => {
  playEarningCashSound();
};

/**
 * Play incoming phone ring / dispatch walkie-talkie call for inactive driver radar
 */
export const playDispatchPhoneRing = () => {
  if (!isNotificationSoundAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const freqs = [440, 480];
    freqs.forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.setValueAtTime(0.14, now + 0.3);
      gain.gain.setValueAtTime(0.001, now + 0.32);

      gain.gain.setValueAtTime(0.14, now + 0.42);
      gain.gain.setValueAtTime(0.14, now + 0.72);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.85);
    });
  } catch {
    // Ignore
  }
};

/**
 * Play a friendly upbeat driver scooter/taxi horn (Beep Beep) to motivate driver
 */
export const playDispatchMotivationHorn = () => {
  if (!isNotificationSoundAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    
    // First honk
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.setValueAtTime(0.18, now + 0.1);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Second honk
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(783.99, now + 0.14); // G5
    gain2.gain.setValueAtTime(0.2, now + 0.14);
    gain2.gain.setValueAtTime(0.2, now + 0.28);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.32);
  } catch {
    // Ignore
  }
};

/**
 * Play an undo / item deleted swoosh
 */
export const playUndoSound = () => {
  if (!isInteractionSoundAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch {
    // Ignore
  }
};

/**
 * Play a magical mystery chest opening sparkle chime
 */
export const playChestOpenSound = () => {
  if (!isInteractionSoundAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00]; // C5 to C7 arpeggio
    
    notes.forEach((freq, index) => {
      const startTime = now + index * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = index % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  } catch {
    // Ignore
  }
};

/**
 * Play triumphant fanfare when a milestone / station is unlocked
 */
export const playLevelUpFanfare = () => {
  if (!isInteractionSoundAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const chords = [
      { time: 0, freqs: [523.25, 659.25, 783.99], dur: 0.25 },
      { time: 0.25, freqs: [587.33, 739.99, 880.00], dur: 0.25 },
      { time: 0.5, freqs: [659.25, 830.61, 987.77], dur: 0.25 },
      { time: 0.75, freqs: [783.99, 987.77, 1318.51, 1567.98], dur: 0.8 }
    ];

    chords.forEach(({ time, freqs, dur }) => {
      freqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);
        
        gain.gain.setValueAtTime(0.12, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    });
  } catch {
    // Ignore
  }
};

/**
 * Play an explosive shockwave sound with sparkling resonant chime
 */
export const playExplosionShockwaveSound = () => {
  if (!isInteractionSoundAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Deep sub-bass boom
    const oscBass = ctx.createOscillator();
    const gainBass = ctx.createGain();
    oscBass.type = 'triangle';
    oscBass.frequency.setValueAtTime(140, now);
    oscBass.frequency.exponentialRampToValueAtTime(30, now + 0.6);
    gainBass.gain.setValueAtTime(0.35, now);
    gainBass.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    oscBass.connect(gainBass);
    gainBass.connect(ctx.destination);
    oscBass.start(now);
    oscBass.stop(now + 0.6);

    // Explosive noise blast
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.4);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start(now);

    // Shimmering upward sparkles
    [587.33, 880, 1174.66, 1760, 2349.32].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + 0.1 + i * 0.06;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.12, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  } catch {
    // Ignore
  }
};

/**
 * Gentle alert chime for charity/discipline reminder
 */
export const playGentleAlert = () => {
  if (!isInteractionSoundAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(349.23, now + 0.4);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  } catch {
    // Ignore
  }
};

/**
 * Play gentle countdown tick
 */
export const playCountdownTick = () => {
  if (!isInteractionSoundAllowed()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  } catch {
    // Ignore
  }
};

