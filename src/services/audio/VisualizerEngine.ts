import { VisualizerConfig, VisualizerMode, Song } from '../../types';
import { audioManager } from './AudioManager';

export type DetectedGenre = 'MassBass' | 'LiquidLofi' | 'RadialAurora' | 'SynthRock' | 'PopChart';

export interface GenreProfile {
  id: DetectedGenre;
  label: string;
  badgeIcon: string;
  description: string;
  suggestedMode: VisualizerMode;
  suggestedColor: 'red' | 'indigo' | 'violet' | 'cyan' | 'emerald' | 'amber' | 'rainbow';
  bpm: number;
  energyLevel: 'ultra' | 'high' | 'medium' | 'calm';
}

/**
 * Intelligent Song-Type Classifier
 * Analyzes track metadata (title, artist, tags, album) to determine the acoustic signature.
 */
export function detectSongGenre(song?: Song | null): GenreProfile {
  if (!song) {
    return {
      id: 'MassBass',
      label: 'Mass / High Energy',
      badgeIcon: '🔥',
      description: 'Heavy 808s, punching bass kicks & energetic drop shockwaves',
      suggestedMode: 'MassBass',
      suggestedColor: 'red',
      bpm: 134,
      energyLevel: 'ultra',
    };
  }

  const text = `${song.title} ${song.artist} ${(song.tags || []).join(' ')} ${song.album || ''}`.toLowerCase();

  // 1. MASS BASS / EDM / TRAP / HIGH OCTANE BEATS
  const massKeywords = [
    'mass', 'hukum', 'badass', 'tauba', 'pushpa', 'oo antava', 'naatu', 'beast',
    'leo', 'jailer', 'vikram', 'master', 'kgf', 'bass', 'edm', 'trap', 'phonk',
    'hardstyle', 'beat', 'remix', 'club', 'dhol', 'workout', 'party', 'dubstep',
    'anthem', 'brown munde', 'karan aujla', 'diljit', 'anirudh', 'thaman', 'dsp',
    'devi sri prasad', 'badshah', 'sidhu moose', 'skrillex', 'honey singh'
  ];
  if (massKeywords.some(k => text.includes(k))) {
    return {
      id: 'MassBass',
      label: 'Mass / High Energy Bass',
      badgeIcon: '🔥',
      description: 'Heavy 808s, punching kick shockwaves & fiery radial sparks',
      suggestedMode: 'MassBass',
      suggestedColor: 'red',
      bpm: 132,
      energyLevel: 'ultra',
    };
  }

  // 2. LOFI / CHILL / STUDY / SLEEP / AMBIENT
  const lofiKeywords = [
    'lofi', 'lo-fi', 'chill', 'study', 'relax', 'sleep', 'rain', 'night', 'mellow',
    'coffee', 'cozy', 'late night', 'soft', 'piano', 'gentle', 'instrumental',
    'focus', 'beats to study', 'peace', 'ambient', 'chillhop', 'sleepy', 'calm'
  ];
  if (lofiKeywords.some(k => text.includes(k))) {
    return {
      id: 'LiquidLofi',
      label: 'Lofi / Ambient Chill',
      badgeIcon: '☕',
      description: 'Organic morphing fluid contour with floating stardust particles',
      suggestedMode: 'LiquidLofi',
      suggestedColor: 'cyan',
      bpm: 78,
      energyLevel: 'calm',
    };
  }

  // 3. SOUL / ROMANCE / VOCAL MELODY / ACOUSTIC
  const soulKeywords = [
    'arijit', 'sushin', 'sid sriram', 'shreya', 'pradeep', 'yesudas', 'chithra',
    'sonu nigam', 'acoustic', 'melody', 'romantic', 'romance', 'love', 'soul',
    'heart', 'ghazal', 'unplugged', 'kesariya', 'cherathukal', 'aaradhike',
    'tum hi ho', 'raanjhanaa', 'shayad', 'dil', 'channa mereya', 'o maahi',
    'pehle bhi main', 'sajni', 'raabta', 'kalank', 'vocal', 'ballad'
  ];
  if (soulKeywords.some(k => text.includes(k))) {
    return {
      id: 'RadialAurora',
      label: 'Soul / Vocal Aurora',
      badgeIcon: '🌙',
      description: 'Harmonic shimmering vocal ribbons and radiant celestial aura',
      suggestedMode: 'RadialAurora',
      suggestedColor: 'violet',
      bpm: 72,
      energyLevel: 'medium',
    };
  }

  // 4. SYNTH / ROCK / RETROWAVE
  const rockKeywords = [
    'rock', 'metal', 'synth', 'retro', '80s', 'cyberpunk', 'wave', 'electric',
    'guitar', 'solo', 'band', 'electro', 'daft punk', 'kavinsky', 'imagine dragons',
    'linkin park', 'queen'
  ];
  if (rockKeywords.some(k => text.includes(k))) {
    return {
      id: 'SynthRock',
      label: 'Synthwave / Electric',
      badgeIcon: '⚡',
      description: 'Jagged neon laser waveforms and dynamic frequency shocks',
      suggestedMode: 'Wave',
      suggestedColor: 'cyan',
      bpm: 126,
      energyLevel: 'high',
    };
  }

  // 5. DEFAULT POP / CHART
  return {
    id: 'PopChart',
    label: 'Modern Pop & Rhythm',
    badgeIcon: '✨',
    description: 'Dynamic dual-ring rhythmic frequency spectrum',
    suggestedMode: 'Circular',
    suggestedColor: 'rainbow',
    bpm: 120,
    energyLevel: 'high',
  };
}

interface Shockwave {
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  lineWidth: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseSize: number;
  color: string;
  alpha: number;
  life?: number;
  maxLife?: number;
}

export class VisualizerRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationFrameId: number | null = null;
  private config: VisualizerConfig;
  private particles: Particle[] = [];
  private shockwaves: Shockwave[] = [];
  private sparks: Particle[] = [];
  private phase = 0;

  // Realtime Beat Detection Telemetry
  private avgBass = 40;
  private beatStrength = 0;
  private lastBeatTimestamp = 0;
  private lastSongId: string | null = null;
  private currentGenre: GenreProfile = detectSongGenre(null);
  private onBeatCallback?: (strength: number, genre: GenreProfile) => void;

  // Continuous 60 FPS Dancing & Motion Kinematics
  private lastAudioTime = 0;
  private lastAudioTimeTimestamp = 0;
  private smoothCurrentTime = 0;
  private rotationAngle = 0;
  private dancingPhase = 0;
  private elasticBounce = 0;

  // Studio Spectrum Equalizer Telemetry & Ballistics
  private peakHeights: number[] = [];
  private peakDropVelocity: number[] = [];
  private peakHoldTimers: number[] = [];
  private smoothedBars: number[] = [];

  constructor(canvas: HTMLCanvasElement, config: VisualizerConfig) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2D context');
    this.ctx = context;
    this.config = config;
    this.initParticles();
  }

  /**
   * Logarithmic octave band energy extraction with psychoacoustic weighting
   */
  private getBandEnergy(bandIdx: number, totalBands: number, data: Uint8Array): number {
    const minBin = 1;
    const maxBin = Math.min(data.length - 1, 480);
    const tStart = bandIdx / totalBands;
    const tEnd = (bandIdx + 1) / totalBands;
    const startBin = Math.floor(minBin * Math.pow(maxBin / minBin, tStart));
    const endBin = Math.max(startBin + 1, Math.floor(minBin * Math.pow(maxBin / minBin, tEnd)));
    let sum = 0, max = 0, count = 0;
    for (let b = startBin; b < endBin && b < data.length; b++) {
      const v = data[b] || 0;
      if (v > max) max = v;
      sum += v;
      count++;
    }
    return count > 0 ? (max * 0.65 + (sum / count) * 0.35) : 0;
  }

  public setOnBeatListener(cb: (strength: number, genre: GenreProfile) => void) {
    this.onBeatCallback = cb;
  }

  public updateConfig(newConfig: Partial<VisualizerConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public updateSong(song?: Song | null) {
    this.currentGenre = detectSongGenre(song);
  }

  public getCurrentGenre(): GenreProfile {
    return this.currentGenre;
  }

  public getBeatStrength(): number {
    return this.beatStrength;
  }

  private initParticles() {
    this.particles = [];
    const count = 60;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 3 + 1,
        baseSize: Math.random() * 3 + 1,
        color: this.getColorForIndex(i, count),
        alpha: Math.random() * 0.7 + 0.3,
      });
    }
  }

  private getColorForIndex(index: number, total: number, overrideScheme?: string): string {
    const scheme = overrideScheme || this.config.colorScheme;
    if (scheme === 'red') return '#FF0000';
    if (scheme === 'indigo') return '#6366F1';
    if (scheme === 'violet') return '#8B5CF6';
    if (scheme === 'cyan') return '#06B6D4';
    if (scheme === 'emerald') return '#10B981';
    if (scheme === 'amber') return '#F59E0B';
    if (scheme === 'rainbow') {
      const hue = (index / total) * 360;
      return `hsl(${hue}, 85%, 60%)`;
    }
    return '#FF0000';
  }

  public start() {
    if (this.animationFrameId !== null) return;

    const render = () => {
      this.renderFrame();
      this.animationFrameId = requestAnimationFrame(render);
    };

    render();
  }

  public stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // ─── Improved Beat Detection State ──────────────────────────────────────────
  //
  // Uses sub-band energy history + variance-adaptive threshold (onset detection).
  // Reference: "Beat Tracking by Dynamic Programming" (Ellis 2007),
  //            "Beatroot" real-time onset detector principles.
  //
  private energyHistory: number[] = new Array(43).fill(0); // ~1s at 60fps
  private energyHistoryIdx = 0;
  private subBassHistory: number[] = new Array(43).fill(0);
  private subBassHistoryIdx = 0;
  private readonly MIN_BEAT_INTERVAL_MS = 200; // max ~300 BPM cap

  /**
   * Analyze beat frequency spikes & manage shockwave pulses with 60 FPS temporal interpolation
   */
  private processBeatPhysics(dataArray: Uint8Array, waveArray: Uint8Array, isPlaying: boolean, now: number) {
    // Exponential beat strength decay & elastic bounce spring
    this.beatStrength *= 0.86;
    if (this.beatStrength < 0.005) this.beatStrength = 0;
    this.elasticBounce *= 0.88;
    if (this.elasticBounce < 0.005) this.elasticBounce = 0;

    const speed = this.config.speed;
    this.dancingPhase += (0.04 + this.beatStrength * 0.08) * speed;
    this.rotationAngle += (0.006 + this.beatStrength * 0.015) * speed;
    this.phase += 0.02 * speed;

    const sensitivity = (this.config.beatSensitivity ?? 80) / 100;

    // Smooth continuous 60fps playback time tracking to eliminate 250ms polling lag/freeze
    const audioState = audioManager.getState();
    if (isPlaying) {
      if (Math.abs(audioState.currentTime - this.lastAudioTime) > 0.001) {
        this.lastAudioTime = audioState.currentTime;
        this.lastAudioTimeTimestamp = now;
        this.smoothCurrentTime = audioState.currentTime;
      } else {
        const elapsed = (now - this.lastAudioTimeTimestamp) / 1000;
        this.smoothCurrentTime = this.lastAudioTime + Math.min(elapsed, 0.4);
      }
    } else {
      this.smoothCurrentTime = audioState.currentTime;
      this.lastAudioTimeTimestamp = now;
    }

    // ── Band energy extraction with fftSize 2048 (1024 bins) ──────────────────
    const nyquist = 22050;
    const binWidth = nyquist / dataArray.length; // Hz per bin
    
    const bassLo = Math.floor(20 / binWidth);
    const bassMid = Math.floor(80 / binWidth);
    const bassHi = Math.floor(250 / binWidth);
    const midHi = Math.floor(4000 / binWidth);

    let subBassEnergy = 0, bassEnergy = 0, midEnergy = 0;
    for (let i = Math.max(1, bassLo); i < Math.min(dataArray.length, bassMid); i++) {
      subBassEnergy += dataArray[i] * dataArray[i];
    }
    for (let i = bassMid; i < Math.min(dataArray.length, bassHi); i++) {
      bassEnergy += dataArray[i] * dataArray[i];
    }
    for (let i = bassHi; i < Math.min(dataArray.length, midHi); i++) {
      midEnergy += dataArray[i] * dataArray[i];
    }

    subBassEnergy = subBassEnergy / Math.max(1, bassMid - bassLo);
    bassEnergy = bassEnergy / Math.max(1, bassHi - bassMid);
    midEnergy = midEnergy / Math.max(1, midHi - bassHi);

    // Total weighted energy (kick-focused: sub-bass 60%, bass 30%, mid 10%)
    const totalEnergy = subBassEnergy * 0.6 + bassEnergy * 0.3 + midEnergy * 0.1;

    // Check if we have real audio signal (non-zero data from actual playback)
    const peakBin = dataArray.reduce((m, v) => Math.max(m, v), 0);
    const hasLiveAudio = peakBin > 8;

    let triggerBeat = false;
    let strength = 0;

    if (hasLiveAudio && isPlaying) {
      // ── Variance-Adaptive Onset Detection ─────────────────────────────────
      this.energyHistory[this.energyHistoryIdx] = totalEnergy;
      this.energyHistoryIdx = (this.energyHistoryIdx + 1) % this.energyHistory.length;

      this.subBassHistory[this.subBassHistoryIdx] = subBassEnergy;
      this.subBassHistoryIdx = (this.subBassHistoryIdx + 1) % this.subBassHistory.length;

      const mean = this.energyHistory.reduce((s, v) => s + v, 0) / this.energyHistory.length;
      const variance = this.energyHistory.reduce((s, v) => s + (v - mean) ** 2, 0) / this.energyHistory.length;
      
      const C = Math.max(0.8, 1.8 - sensitivity * 0.9);
      const adaptiveThreshold = mean + C * Math.sqrt(variance);

      const refractory = now - this.lastBeatTimestamp;
      if (
        totalEnergy > adaptiveThreshold &&
        totalEnergy > mean * 1.15 &&
        refractory > this.MIN_BEAT_INTERVAL_MS
      ) {
        triggerBeat = true;
        strength = Math.min(1.0, (totalEnergy - mean) / (Math.sqrt(variance) * 3 + 1));
        this.lastBeatTimestamp = now;
      }

      this.avgBass = this.avgBass * 0.96 + Math.sqrt(bassEnergy) * 0.04;

    } else if (isPlaying) {
      // ── High-Precision Continuous BPM Tempo Fallback for YouTube ───────────
      const bpm = this.currentGenre.bpm;
      const beatsPerSec = bpm / 60;
      const beatIntervalMs = 1000 / beatsPerSec;
      const currentSec = this.smoothCurrentTime;

      // Fractional beat position in current beat cycle [0, 1) - completely continuous
      const beatPhase = (currentSec * beatsPerSec) % 1.0;

      // Gate window: trigger when phase crosses downbeat boundary
      const tolerance = 0.08;
      const refractory = now - this.lastBeatTimestamp;
      if (beatPhase < tolerance && refractory > beatIntervalMs * 0.75) {
        triggerBeat = true;
        strength = 0.8 + sensitivity * 0.2;
        this.lastBeatTimestamp = now;
      }

      const genreMultiplier =
        this.currentGenre.energyLevel === 'ultra' ? 1.0 :
        this.currentGenre.energyLevel === 'high' ? 0.85 :
        this.currentGenre.energyLevel === 'medium' ? 0.65 : 0.45;

      // 4-on-the-floor / downbeat kick envelope (punchy exponential attack + ring decay)
      const kickEnv = Math.exp(-beatPhase * 6.5);
      // Snare on 2nd and 4th beats
      const snarePhase = (currentSec * (beatsPerSec / 2)) % 1.0;
      const snareEnv = Math.exp(-snarePhase * 9.0);
      // 16th-note hi-hat rhythmic pulse
      const hihatPhase = (currentSec * beatsPerSec * 4) % 1.0;
      const hihatEnv = Math.exp(-hihatPhase * 11.0);

      const len = dataArray.length;
      for (let i = 0; i < len; i++) {
        let val = 0;

        if (i < 24) {
          // Sub-bass & 808 kick (20 - 150 Hz) - huge punchy kick + sub drone
          val = (kickEnv * 220 + Math.sin(this.dancingPhase * 3 + i * 0.25) * 45 + 35) * genreMultiplier;
        } else if (i < 90) {
          // Bass & Snare punch (150 - 600 Hz)
          val = (snareEnv * 180 + kickEnv * 80 + Math.sin(this.dancingPhase * 2 + i * 0.15) * 40 + 25) * genreMultiplier;
        } else if (i < 350) {
          // Midrange: vocals, chords (600 - 2400 Hz)
          const melody = Math.abs(Math.sin(this.dancingPhase * 1.5 + i * 0.05)) * 120;
          val = (melody + snareEnv * 60 + 20) * genreMultiplier;
        } else if (i < 900) {
          // Highs & Percussion (2.4k - 7kHz)
          val = (hihatEnv * 140 + Math.random() * 45 + 15) * genreMultiplier;
        } else {
          // Sparkle (7k - 20kHz)
          val = (hihatEnv * 95 + Math.random() * 35 + 10) * genreMultiplier;
        }

        dataArray[i] = Math.max(8, Math.min(255, Math.floor(val)));
      }

      // Synthesize rich undulating waveform for time-domain visualizers (Wave, Minimal)
      for (let i = 0; i < waveArray.length; i++) {
        const waveAngle = (i / waveArray.length) * Math.PI * 4;
        const kickDisplacement = kickEnv * 55 * Math.sin(waveAngle * 2);
        const synthWave = Math.sin(waveAngle + this.dancingPhase * 3) * 35 + Math.sin(waveAngle * 3 - this.dancingPhase * 2) * 15;
        waveArray[i] = Math.max(10, Math.min(245, Math.floor(128 + synthWave + kickDisplacement)));
      }
    }

    if (triggerBeat) {
      this.beatStrength = Math.max(strength, 0.75);
      this.elasticBounce = Math.min(1.0, this.elasticBounce + 0.65 * strength);
      this.spawnShockwave();
      if (this.currentGenre.id === 'MassBass') {
        this.spawnSparks();
      }
      if (this.onBeatCallback) {
        this.onBeatCallback(this.beatStrength, this.currentGenre);
      }
    }
  }


  private spawnShockwave() {
    const { width, height } = this.canvas;
    const baseColor = this.getColorForIndex(0, 1);
    const accentColor = this.currentGenre.id === 'MassBass' ? '#FF5500' : baseColor;

    this.shockwaves.push({
      radius: Math.min(width, height) * 0.28,
      maxRadius: Math.min(width, height) * 0.58,
      alpha: 0.85,
      color: accentColor,
      lineWidth: this.currentGenre.id === 'MassBass' ? 5 : 3,
    });
  }

  private spawnSparks() {
    const { width, height } = this.canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const sparkCount = 14;

    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2.5;
      this.sparks.push({
        x: centerX + Math.cos(angle) * (Math.min(width, height) * 0.28),
        y: centerY + Math.sin(angle) * (Math.min(width, height) * 0.28),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2.5 + 1.5,
        baseSize: 2,
        color: Math.random() > 0.4 ? '#FF0000' : '#FFB800',
        alpha: 1.0,
        life: 0,
        maxLife: Math.floor(Math.random() * 25 + 15),
      });
    }
  }

  private updateAndRenderShockwaves() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 0.12 * this.config.speed;
      sw.alpha *= 0.90;

      if (sw.alpha < 0.02 || sw.radius >= sw.maxRadius - 2) {
        this.shockwaves.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = sw.alpha;
      ctx.lineWidth = sw.lineWidth;
      ctx.shadowBlur = 15;
      ctx.shadowColor = sw.color;
      ctx.stroke();
      ctx.restore();
    }
  }

  private updateAndRenderSparks() {
    const ctx = this.ctx;
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx * this.config.speed;
      s.y += s.vy * this.config.speed;
      s.life = (s.life || 0) + 1;
      s.alpha = 1 - (s.life / (s.maxLife || 20));

      if (s.life >= (s.maxLife || 20)) {
        this.sparks.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.shadowBlur = 8;
      ctx.shadowColor = s.color;
      ctx.fill();
      ctx.restore();
    }
  }

  private renderFrame() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);

    const analyser = audioManager.getAnalyser();
    const binCount = analyser ? analyser.frequencyBinCount : 512;
    const dataArray = new Uint8Array(binCount);
    const waveArray = new Uint8Array(binCount);

    const state = audioManager.getState();
    const isPlaying = state.isPlaying;

    if (state.currentSong && state.currentSong.id !== this.lastSongId) {
      this.lastSongId = state.currentSong.id;
      this.updateSong(state.currentSong);
    }

    if (analyser && isPlaying) {
      analyser.getByteFrequencyData(dataArray);
      analyser.getByteTimeDomainData(waveArray);
    }

    const now = performance.now();
    this.processBeatPhysics(dataArray, waveArray, isPlaying, now);

    // Determine active render mode (Auto-Adaptive picks according to song type)
    let activeMode = this.config.mode;
    if (activeMode === 'AutoAdaptive') {
      activeMode = this.currentGenre.suggestedMode;
    }

    // Dalia3D has its own Three.js render loop — skip 2D canvas
    if (activeMode === 'Dalia3D') return;

    // Render active mode
    switch (activeMode) {
      case 'MassBass':
        this.renderMassBass(dataArray, isPlaying);
        break;
      case 'LiquidLofi':
        this.renderLiquidLofi(dataArray, isPlaying);
        break;
      case 'RadialAurora':
        this.renderRadialAurora(dataArray, isPlaying);
        break;
      case 'Circular':
        this.renderCircular(dataArray, isPlaying);
        break;
      case 'Spectrum':
        this.renderSpectrum(dataArray);
        break;
      case 'Wave':
        this.renderWave(waveArray);  // use time-domain data for waveform
        break;
      case 'Particles':
        this.renderParticles(dataArray, isPlaying);
        break;
      case 'Minimal':
        this.renderMinimal(waveArray);  // minimal uses time-domain for smooth line
        break;
      default:
        this.renderCircular(dataArray, isPlaying);
        break;
    }

    // Overlay active beat shockwaves and spark bursts
    this.updateAndRenderShockwaves();
    this.updateAndRenderSparks();
  }

  /**
   * MODE 1: MASS BASS (High Energy / EDM / Kollywood-Tollywood-Punjabi Mass Beats)
   * Leaping violent radial bars, kick shockwave rings, and fiery crimson/amber glow.
   * Logarithmic symmetrical mirrored bars with heavy 808 elastic jump!
   */
  private renderMassBass(dataArray: Uint8Array, isPlaying: boolean) {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.29;
    const bounceRadius = baseRadius + this.elasticBounce * 22 + Math.sin(this.dancingPhase * 0.8) * 4;
    const bars = 72;
    const halfBars = bars / 2;

    // Glowing intense Bass Core Aura
    const auraGrad = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.65, centerX, centerY, baseRadius * 1.7);
    const alphaPulse = isPlaying ? 0.3 + this.beatStrength * 0.45 : 0.1;
    auraGrad.addColorStop(0, `rgba(255, 30, 0, ${alphaPulse})`);
    auraGrad.addColorStop(0.5, `rgba(255, 120, 0, ${alphaPulse * 0.6})`);
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 1.7, 0, Math.PI * 2);
    ctx.fill();

    // Energetic Symmetrical Radial Bars
    for (let i = 0; i < bars; i++) {
      const bandIdx = i < halfBars ? i : (bars - 1 - i);
      const energy = this.getBandEnergy(bandIdx, halfBars, dataArray);
      const percent = (energy / 255) * (this.config.intensity / 100);

      // Bass boost on lower bands + dancing groove wave
      const bassFactor = bandIdx < halfBars * 0.35 ? 1.45 : 1.0;
      const danceWave = isPlaying ? Math.sin(i * 0.35 + this.dancingPhase * 1.2) * (8 + this.beatStrength * 18) : 0;
      const barHeight = Math.max(6, (percent * (baseRadius * 0.85) * bassFactor + (this.elasticBounce * 32) + danceWave));

      const angle = (i / bars) * Math.PI * 2 - Math.PI / 2 + (isPlaying ? this.rotationAngle * 1.2 : 0);
      const x1 = centerX + Math.cos(angle) * bounceRadius;
      const y1 = centerY + Math.sin(angle) * bounceRadius;
      const x2 = centerX + Math.cos(angle) * (bounceRadius + barHeight);
      const y2 = centerY + Math.sin(angle) * (bounceRadius + barHeight);

      // Fiery gradient per bar
      const barGrad = ctx.createLinearGradient(x1, y1, x2, y2);
      barGrad.addColorStop(0, '#FF0000');
      barGrad.addColorStop(0.5, '#FF7A00');
      barGrad.addColorStop(1, '#FFE600');

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = Math.max(2.5, (2 * Math.PI * bounceRadius) / bars * 0.7);
      ctx.lineCap = 'round';
      ctx.strokeStyle = barGrad;
      ctx.shadowBlur = isPlaying ? 14 + this.beatStrength * 14 : 4;
      ctx.shadowColor = '#FF3300';
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  /**
   * MODE 2: LIQUID LOFI (Calm, Cozy, Organic Sine Metaball & Floating Stardust)
   * Smooth undulating fluid contour that breathes and dances with gentle bass thumps.
   */
  private renderLiquidLofi(dataArray: Uint8Array, isPlaying: boolean) {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.31;
    const points = 48;

    // Ambient Floating Stardust Motes
    for (const p of this.particles.slice(0, 35)) {
      p.x += p.vx * 0.6 * this.config.speed;
      p.y += p.vy * 0.6 * this.config.speed;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.baseSize, 0, Math.PI * 2);
      ctx.fillStyle = '#2DD4BF';
      ctx.globalAlpha = p.alpha * 0.65;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#2DD4BF';
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Organic Fluid Blob with Dynamic Dancing Waves
    ctx.beginPath();
    for (let i = 0; i <= points; i++) {
      const idx = i % points;
      const angle = (idx / points) * Math.PI * 2;
      const freqVal = (dataArray[idx % dataArray.length] || 20) / 255;

      // Complex multi-octave harmonic wave deformation dancing with song
      const wave1 = Math.sin(angle * 3 + this.dancingPhase * 1.5) * 12;
      const wave2 = Math.cos(angle * 5 - this.dancingPhase * 1.1) * 8;
      const beatDeform = (this.beatStrength + this.elasticBounce) * 20 * Math.sin(angle * 4 + this.dancingPhase);
      const r = baseRadius + wave1 + wave2 + (freqVal * 22 * (this.config.intensity / 100)) + beatDeform;

      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    // Translucent Soothing Fluid Gradient
    const blobGrad = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.6, centerX, centerY, baseRadius * 1.4);
    blobGrad.addColorStop(0, 'rgba(45, 212, 191, 0.08)');
    blobGrad.addColorStop(0.7, 'rgba(168, 85, 247, 0.18)');
    blobGrad.addColorStop(1, 'rgba(45, 212, 191, 0)');
    ctx.fillStyle = blobGrad;
    ctx.fill();

    ctx.strokeStyle = '#2DD4BF';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#A855F7';
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  /**
   * MODE 3: RADIAL AURORA (Soul, Romance, Arijit Singh, Melodic Vocal Swells)
   * Radiant shimmering ribbons expanding in soft northern-lights auroral waves.
   */
  private renderRadialAurora(dataArray: Uint8Array, isPlaying: boolean) {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.31;
    const ribbons = 3;

    // Harmonic Vocal Swell (Mid-range frequencies 15-45)
    let midVocalEnergy = 0;
    for (let i = 12; i < 40; i++) {
      midVocalEnergy += dataArray[i] || 0;
    }
    midVocalEnergy = (midVocalEnergy / 28) / 255;

    // Shimmering Aurora Layers Dancing with Rhythmic Grooves
    for (let r = 0; r < ribbons; r++) {
      const radiusOffset = baseRadius + r * 16 + (this.elasticBounce * 16);
      const points = 36;
      ctx.beginPath();

      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const wave = Math.sin(angle * (3 + r) + this.dancingPhase * (1 + r * 0.4)) * (8 + midVocalEnergy * 22 + this.beatStrength * 10);
        const radius = radiusOffset + wave;

        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      const alpha = 0.35 - r * 0.1 + (midVocalEnergy * 0.2);
      ctx.strokeStyle = r === 0 ? '#C084FC' : r === 1 ? '#818CF8' : '#F43F5E';
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = Math.max(0.1, alpha);
      ctx.shadowBlur = 16;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;

    // Celestial Twinkling Nodes along the perimeter
    const starCount = 18;
    for (let i = 0; i < starCount; i++) {
      const angle = (i / starCount) * Math.PI * 2 + this.rotationAngle * 0.5;
      const dist = baseRadius + 44 + Math.sin(i + this.dancingPhase * 2) * 6;
      const sx = centerX + Math.cos(angle) * dist;
      const sy = centerY + Math.sin(angle) * dist;

      ctx.beginPath();
      ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#FFFFFF';
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  /**
   * Enhanced Symmetrical Mirrored Circular Visualizer with Dancing Bounce
   * Left & right mirrored hemispheres (Monstercat / Trap Nation style)
   * Logarithmic octave bin mapping + continuous rotation + dancing ripple
   */
  private renderCircular(dataArray: Uint8Array, isPlaying: boolean) {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.30;
    const bounceRadius = baseRadius + this.elasticBounce * 16 + Math.sin(this.dancingPhase * 0.5) * 3;
    const bars = 64;
    const halfBars = bars / 2;

    // Glowing outer aura pulsing with bass kick
    const pulseIntensity = isPlaying ? 0.15 + this.beatStrength * 0.3 : 0.08;
    const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.75, centerX, centerY, baseRadius * 1.6);
    const baseColor = this.getColorForIndex(0, 1);
    gradient.addColorStop(0, `${baseColor}${Math.floor(pulseIntensity * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 1.6, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < bars; i++) {
      // Symmetrical mirrored bands: bass at bottom/top sweeping around
      const bandIdx = i < halfBars ? i : (bars - 1 - i);
      const energy = this.getBandEnergy(bandIdx, halfBars, dataArray);
      const percent = (energy / 255) * (this.config.intensity / 100);

      // Dancing wave ripple modulation
      const danceWave = isPlaying ? Math.sin(i * 0.4 + this.dancingPhase) * (6 + this.beatStrength * 14) : 0;
      const barHeight = Math.max(4, percent * (baseRadius * 0.75) + this.elasticBounce * 20 + danceWave);

      // Symmetrical angular positioning with gentle continuous rotation
      const angle = (i / bars) * Math.PI * 2 - Math.PI / 2 + (isPlaying ? this.rotationAngle : 0);
      const x1 = centerX + Math.cos(angle) * bounceRadius;
      const y1 = centerY + Math.sin(angle) * bounceRadius;
      const x2 = centerX + Math.cos(angle) * (bounceRadius + barHeight);
      const y2 = centerY + Math.sin(angle) * (bounceRadius + barHeight);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineWidth = Math.max(2.5, (2 * Math.PI * bounceRadius) / bars * 0.65);
      ctx.lineCap = 'round';
      ctx.strokeStyle = this.getColorForIndex(bandIdx, halfBars);
      ctx.shadowBlur = isPlaying ? 10 + this.beatStrength * 12 : 3;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  }

  /**
   * Studio-Grade Spectrum Equalizer:
   * - Logarithmic multi-band frequency grouping across auditory octaves
   * - Smooth analog ballistics (fast attack, liquid decay)
   * - True gravity-falling peak caps with peak-hold physics
   * - Segmented LED aesthetic with glowing pill bars & subtle floor reflection
   */
  private renderSpectrum(dataArray: Uint8Array) {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const bars = 48;
    const gap = Math.max(2, Math.floor(width * 0.005));
    const totalGap = gap * (bars + 1);
    const barWidth = Math.max(3, (width - totalGap) / bars);
    const usableHeight = height * 0.82;

    // Initialize state arrays if needed
    if (this.smoothedBars.length !== bars) {
      this.smoothedBars = new Array(bars).fill(4);
      this.peakHeights = new Array(bars).fill(4);
      this.peakDropVelocity = new Array(bars).fill(0);
      this.peakHoldTimers = new Array(bars).fill(0);
    }

    const dataLen = dataArray.length;
    // Logarithmic frequency bin mapping: f_i = f_min * (f_max / f_min) ** (i / (bars - 1))
    const minBin = 1;
    const maxBin = Math.min(dataLen - 1, 950);

    for (let i = 0; i < bars; i++) {
      // Calculate bin window for this frequency band
      const tStart = i / bars;
      const tEnd = (i + 1) / bars;
      const startBin = Math.floor(minBin * Math.pow(maxBin / minBin, tStart));
      const endBin = Math.max(startBin + 1, Math.floor(minBin * Math.pow(maxBin / minBin, tEnd)));

      // Extract peak energy within this logarithmic band
      let maxVal = 0;
      let sum = 0;
      let count = 0;
      for (let b = startBin; b < endBin && b < dataLen; b++) {
        const v = dataArray[b] || 0;
        if (v > maxVal) maxVal = v;
        sum += v;
        count++;
      }
      const bandEnergy = count > 0 ? (maxVal * 0.65 + (sum / count) * 0.35) : 0;

      // Equal loudness compensation curve (boost quiet highs and sub-bass)
      const loudnessCurve = 1.0 + Math.sin((i / (bars - 1)) * Math.PI) * 0.35 + (i > bars * 0.6 ? 0.3 : 0);
      const intensity = (this.config.intensity / 100);
      const beatBoost = (i < 12) ? this.beatStrength * usableHeight * 0.2 : 0;
      const targetHeight = Math.max(4, Math.min(usableHeight, (bandEnergy / 255) * usableHeight * intensity * loudnessCurve + beatBoost));

      // Studio ballistics: Fast attack (0.4), smooth decay (0.18)
      if (targetHeight > this.smoothedBars[i]) {
        this.smoothedBars[i] += (targetHeight - this.smoothedBars[i]) * 0.42;
      } else {
        this.smoothedBars[i] += (targetHeight - this.smoothedBars[i]) * 0.16;
      }

      const barH = this.smoothedBars[i];

      // Gravity peak hold and drop physics
      if (barH >= this.peakHeights[i]) {
        this.peakHeights[i] = barH;
        this.peakDropVelocity[i] = 0;
        this.peakHoldTimers[i] = 14; // Hold peak for ~220ms
      } else {
        if (this.peakHoldTimers[i] > 0) {
          this.peakHoldTimers[i]--;
        } else {
          this.peakDropVelocity[i] += 0.45; // Gravity acceleration
          this.peakHeights[i] = Math.max(barH, this.peakHeights[i] - this.peakDropVelocity[i]);
        }
      }

      const x = gap + i * (barWidth + gap);
      const y = height - barH - 4;
      const baseColor = this.getColorForIndex(i, bars);

      // Draw Main Equalizer Bar (Vibrant rounded neon bar with inner glow)
      const grad = ctx.createLinearGradient(0, y, 0, height);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.12, baseColor);
      grad.addColorStop(0.75, baseColor);
      grad.addColorStop(1, 'rgba(20, 20, 20, 0.4)');

      ctx.save();
      ctx.fillStyle = grad;
      ctx.shadowBlur = this.beatStrength > 0.5 ? 8 : 2;
      ctx.shadowColor = baseColor;

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [barWidth * 0.5, barWidth * 0.5, 2, 2]);
      ctx.fill();
      ctx.restore();

      // Draw Peak Floating Cap with bright neon halo
      const peakY = Math.max(2, height - this.peakHeights[i] - 7);
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#FFFFFF';
      ctx.fillRect(x, peakY, barWidth, 2.5);
      ctx.restore();

      // Subtle floor reflection
      const reflectH = Math.min(18, barH * 0.22);
      if (reflectH > 2) {
        ctx.save();
        ctx.globalAlpha = 0.18;
        const refGrad = ctx.createLinearGradient(0, height, 0, height + reflectH);
        refGrad.addColorStop(0, baseColor);
        refGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = refGrad;
        ctx.fillRect(x, height - 3, barWidth, reflectH);
        ctx.restore();
      }
    }
  }

  /**
   * Enhanced Wave Oscilloscope
   */
  private renderWave(dataArray: Uint8Array) {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    ctx.lineWidth = 3 + this.beatStrength * 2;
    ctx.strokeStyle = this.getColorForIndex(0, 1);
    ctx.shadowBlur = 12 + this.beatStrength * 10;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.beginPath();

    const sliceWidth = width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 128.0;
      const amp = 1 + this.beatStrength * 0.5;
      const y = height / 2 + ((v - 1) * (height / 2) * amp);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  /**
   * Enhanced Particles with Beat Explosion Velocity
   */
  private renderParticles(dataArray: Uint8Array, isPlaying: boolean) {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const avgEnergy = dataArray.reduce((acc, v) => acc + v, 0) / (dataArray.length * 255);
    const boost = isPlaying ? 1 + avgEnergy * (this.config.intensity / 50) + (this.beatStrength * 1.5) : 1;

    for (const p of this.particles) {
      p.x += p.vx * this.config.speed * boost;
      p.y += p.vy * this.config.speed * boost;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      const currentSize = p.baseSize * boost;

      ctx.beginPath();
      ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 8 * boost;
      ctx.shadowColor = p.color;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  /**
   * Enhanced Minimal Visualizer
   */
  private renderMinimal(dataArray: Uint8Array) {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    const avgEnergy = dataArray.reduce((acc, v) => acc + v, 0) / (dataArray.length * 255);
    const activeWidth = width * Math.min(1, Math.max(0.1, (avgEnergy + this.beatStrength * 0.4) * (this.config.intensity / 60)));

    const grad = ctx.createLinearGradient((width - activeWidth) / 2, 0, (width + activeWidth) / 2, 0);
    grad.addColorStop(0, 'rgba(255, 0, 0, 0)');
    grad.addColorStop(0.5, this.getColorForIndex(0, 1));
    grad.addColorStop(1, 'rgba(255, 0, 0, 0)');

    ctx.fillStyle = grad;
    const barThickness = 4 + this.beatStrength * 4;
    ctx.fillRect((width - activeWidth) / 2, height / 2 - barThickness / 2, activeWidth, barThickness);
  }
}
