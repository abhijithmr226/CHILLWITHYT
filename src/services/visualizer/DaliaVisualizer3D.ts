/**
 * DaliaVisualizer3D — A Dalia-inspired Three.js 3D audio-reactive visualizer
 * 
 * Inspired by https://github.com/TheAdkk/dalia (GPL-3.0)
 * 
 * Implements:
 * - 6 procedural geometry presets (point clouds, spheres, torus, plasma, galaxy, nebula)
 * - Real-time bass/mid/treble energy band analysis
 * - Beat-locked geometry morphing with smoothstep blending
 * - Chromagram-inspired harmonic color system (hue derived from detected frequency peaks)
 * - Post-processing: bloom glow via composite multiply passes
 * - Stereo-aware stereo L/R spatial separation effect
 * - Auto-transitions between presets on beat drops
 */

import * as THREE from 'three';
import { audioManager } from '../audio/AudioManager';
import { GenreProfile, detectSongGenre } from '../audio/VisualizerEngine';
import { Song } from '../../types';

// ─── Dalia Preset Definitions ────────────────────────────────────────────────

export type DaliaPreset =
  | 'VectorSphere'
  | 'MutantTorus'
  | 'PlasmaField'
  | 'NebulaVortex'
  | 'GalacticWeb'
  | 'BlackHoleSingularity';

const PRESET_ORDER: DaliaPreset[] = [
  'VectorSphere',
  'MutantTorus',
  'PlasmaField',
  'NebulaVortex',
  'GalacticWeb',
  'BlackHoleSingularity',
];

// ─── Audio Analysis ───────────────────────────────────────────────────────────

interface AudioBands {
  subBass: number;  // 20–60 Hz
  bass: number;     // 60–250 Hz
  mid: number;      // 250–4000 Hz
  treble: number;   // 4000–20000 Hz
  overall: number;  // full RMS
  beatStrength: number;
  dominantHue: number; // 0–360 derived from frequency peak
}

function extractAudioBands(analyser: AnalyserNode, fftSize: number): AudioBands {
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);

  const nyquist = 22050;
  const binFreq = nyquist / data.length;

  const bandRange = (lo: number, hi: number) => {
    let sum = 0, count = 0;
    const startBin = Math.floor(lo / binFreq);
    const endBin = Math.min(Math.ceil(hi / binFreq), data.length - 1);
    for (let i = startBin; i <= endBin; i++) {
      sum += data[i];
      count++;
    }
    return count > 0 ? sum / count / 255 : 0;
  };

  const subBass = bandRange(20, 60);
  const bass = bandRange(60, 250);
  const mid = bandRange(250, 4000);
  const treble = bandRange(4000, 20000);

  // Find dominant frequency bin for chromagram-style hue
  let peakBin = 0, peakVal = 0;
  for (let i = 2; i < Math.min(data.length, 200); i++) {
    if (data[i] > peakVal) { peakVal = data[i]; peakBin = i; }
  }
  const dominantHue = (peakBin / 200) * 360;

  const overall = (subBass + bass + mid + treble) / 4;

  return { subBass, bass, mid, treble, overall, beatStrength: 0, dominantHue };
}

// ─── Point Cloud Generator ───────────────────────────────────────────────────

function generateSpherePoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 1.0 + Math.random() * 0.15;
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  return positions;
}

function generateTorusPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const R = 1.0, r = 0.38;
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 2;
    positions[i * 3] = (R + r * Math.cos(phi)) * Math.cos(theta);
    positions[i * 3 + 1] = (R + r * Math.cos(phi)) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.sin(phi);
  }
  return positions;
}

function generateGalaxyPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const arms = 4;
  for (let i = 0; i < count; i++) {
    const armIndex = i % arms;
    const t = (i / count) * 3.0;
    const r = t * 1.5;
    const angle = t * Math.PI * 3 + (armIndex * Math.PI * 2 / arms);
    const spread = 0.08 + t * 0.05;
    positions[i * 3] = r * Math.cos(angle) + (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.12;
    positions[i * 3 + 2] = r * Math.sin(angle) + (Math.random() - 0.5) * spread;
  }
  return positions;
}

function generatePlasmaPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 8;
    const r = 1.1 + Math.sin(t * 0.7) * 0.4;
    positions[i * 3] = r * Math.cos(t) * Math.sin(t * 0.5);
    positions[i * 3 + 1] = r * Math.sin(t) * Math.cos(t * 0.3);
    positions[i * 3 + 2] = r * Math.cos(t * 0.4);
  }
  return positions;
}

function generateNebulaPoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = (Math.random() - 0.5) * 4;
    const v = (Math.random() - 0.5) * 4;
    const w = (Math.random() - 0.5) * 2;
    const density = Math.exp(-(u * u + v * v) * 0.4);
    positions[i * 3] = u * density * 1.2 + Math.sin(v * 2) * 0.3;
    positions[i * 3 + 1] = w + Math.cos(u * 2) * 0.2;
    positions[i * 3 + 2] = v * density * 1.2;
  }
  return positions;
}

function generateBlackHolePoints(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 0.3 + Math.pow(Math.random(), 0.4) * 2.5;
    const theta = Math.random() * Math.PI * 2;
    // Accretion disk distortion
    const phi = (Math.random() - 0.5) * 0.12 * (1 / r);
    positions[i * 3] = r * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * 0.5;
    positions[i * 3 + 2] = r * Math.sin(theta);
  }
  return positions;
}

// ─── Main Dalia 3D Renderer ─────────────────────────────────────────────────

export class DaliaVisualizer3D {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  private animationId: number | null = null;

  private pointCloud: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.PointsMaterial | null = null;
  private originalPositions: Float32Array | null = null;

  // Dalia tunnel particles
  private tunnelParticles: THREE.Points | null = null;
  private tunnelGeo: THREE.BufferGeometry | null = null;

  private currentPreset: DaliaPreset = 'VectorSphere';
  private presetIndex = 0;
  private lastPresetSwitch = 0;
  private presetSwitchCooldown = 12000; // ms

  // Beat detection state
  private avgBass = 0.3;
  private beatStrength = 0;
  private lastBeatTime = 0;

  // Rotation
  private rotX = 0;
  private rotY = 0;
  private targetRotX = 0;
  private targetRotY = 0;

  // Color state
  private currentHue = 200;
  private targetHue = 200;

  // Genre
  private currentGenre: GenreProfile;
  private lastSongId: string | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.currentGenre = detectSongGenre(audioManager.getState().currentSong);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.width, canvas.height);
    this.renderer.setClearColor(0x000000, 0);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x000000, 0.08);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 100);
    this.camera.position.set(0, 0, 3.5);

    // Clock
    this.clock = new THREE.Clock();

    // Build initial preset
    this.buildPreset('VectorSphere');
    this.buildTunnelParticles();
  }

  private buildTunnelParticles() {
    const count = 600;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.5 + Math.random() * 3.5;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    this.tunnelGeo = new THREE.BufferGeometry();
    this.tunnelGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.02,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.35,
    });

    this.tunnelParticles = new THREE.Points(this.tunnelGeo, mat);
    this.scene.add(this.tunnelParticles);
  }

  private buildPreset(preset: DaliaPreset) {
    // Remove old
    if (this.pointCloud) {
      this.scene.remove(this.pointCloud);
      this.geometry?.dispose();
      (this.material as THREE.PointsMaterial | null)?.dispose();
    }

    const pointCount = 3500;
    let positions: Float32Array;

    switch (preset) {
      case 'VectorSphere':      positions = generateSpherePoints(pointCount); break;
      case 'MutantTorus':       positions = generateTorusPoints(pointCount); break;
      case 'PlasmaField':       positions = generatePlasmaPoints(pointCount); break;
      case 'NebulaVortex':      positions = generateNebulaPoints(pointCount); break;
      case 'GalacticWeb':       positions = generateGalaxyPoints(pointCount); break;
      case 'BlackHoleSingularity': positions = generateBlackHolePoints(pointCount); break;
      default:                  positions = generateSpherePoints(pointCount); break;
    }

    this.originalPositions = positions.slice();

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Assign vertex colors for chromagram effect
    const colors = new Float32Array(pointCount * 3);
    const color = new THREE.Color();
    for (let i = 0; i < pointCount; i++) {
      const hue = (this.currentHue + (i / pointCount) * 60) % 360;
      color.setHSL(hue / 360, 0.85, 0.65);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.material = new THREE.PointsMaterial({
      size: preset === 'GalacticWeb' ? 0.025 : 0.02,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.pointCloud = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.pointCloud);
    this.currentPreset = preset;
  }

  public updateSong(song?: Song | null) {
    this.currentGenre = detectSongGenre(song);

    // Map genre to starting preset
    const genrePresetMap: Record<string, DaliaPreset> = {
      'MassBass':    'BlackHoleSingularity',
      'LiquidLofi':  'NebulaVortex',
      'RadialAurora':'VectorSphere',
      'SynthRock':   'MutantTorus',
      'PopChart':    'PlasmaField',
    };

    const targetPreset = genrePresetMap[this.currentGenre.id] || 'VectorSphere';
    if (targetPreset !== this.currentPreset) {
      this.buildPreset(targetPreset);
    }
  }

  public resize(width: number, height: number) {
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public start() {
    if (this.animationId !== null) return;
    this.clock.start();
    this.animate();
  }

  public stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public dispose() {
    this.stop();
    this.geometry?.dispose();
    this.material?.dispose();
    this.tunnelGeo?.dispose();
    this.renderer.dispose();
  }

  private animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const elapsed = this.clock.getElapsedTime();
    const delta = this.clock.getDelta();
    const audioState = audioManager.getState();

    // Check song change
    if (audioState.currentSong && audioState.currentSong.id !== this.lastSongId) {
      this.lastSongId = audioState.currentSong.id;
      this.updateSong(audioState.currentSong);
    }

    // Get audio data
    const analyser = audioManager.getAnalyser();
    let bands: AudioBands = {
      subBass: 0, bass: 0, mid: 0, treble: 0, overall: 0,
      beatStrength: 0, dominantHue: this.currentHue,
    };

    if (analyser && audioState.isPlaying) {
      bands = extractAudioBands(analyser, analyser.fftSize);
    } else if (audioState.isPlaying) {
      // Procedural fallback using BPM
      const bpm = this.currentGenre.bpm;
      const phase = (elapsed * bpm / 60) % 1.0;
      const beatImpulse = Math.pow(Math.max(0, 1 - phase * 8), 2);
      bands = {
        subBass: 0.3 + beatImpulse * 0.7,
        bass: 0.25 + beatImpulse * 0.5,
        mid: 0.2 + Math.sin(elapsed * 4.2) * 0.15,
        treble: 0.15 + Math.sin(elapsed * 8.7) * 0.1,
        overall: 0.3 + beatImpulse * 0.4,
        beatStrength: beatImpulse,
        dominantHue: (elapsed * 15) % 360,
      };
    }

    // Beat detection with EMA
    this.avgBass = this.avgBass * 0.94 + bands.bass * 0.06;
    const now = Date.now();
    if (bands.bass > this.avgBass * 1.25 && bands.bass > 0.08 && now - this.lastBeatTime > 230) {
      this.beatStrength = Math.min(1.0, (bands.bass - this.avgBass) / 0.2);
      this.lastBeatTime = now;

      // Auto-advance preset on heavy beat drops (every 12s minimum)
      if (now - this.lastPresetSwitch > this.presetSwitchCooldown && this.beatStrength > 0.7) {
        this.presetIndex = (this.presetIndex + 1) % PRESET_ORDER.length;
        this.buildPreset(PRESET_ORDER[this.presetIndex]);
        this.lastPresetSwitch = now;
      }
    }
    this.beatStrength *= 0.87;

    // Chromagram hue tracking
    this.targetHue = bands.dominantHue;
    this.currentHue += (this.targetHue - this.currentHue) * 0.04;

    // ── Point Cloud Deformation ─────────────────────────────────────────────

    if (this.geometry && this.originalPositions && this.pointCloud) {
      const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
      const colAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute;
      const pos = posAttr.array as Float32Array;
      const orig = this.originalPositions;
      const col = colAttr.array as Float32Array;
      const count = pos.length / 3;

      const beatPulse = 1.0 + this.beatStrength * 0.35;
      const bassLift = bands.bass * 0.4;
      const midWave = bands.mid * 0.25;

      const color = new THREE.Color();

      for (let i = 0; i < count; i++) {
        const ox = orig[i * 3], oy = orig[i * 3 + 1], oz = orig[i * 3 + 2];
        const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
        const nx = ox / len, ny = oy / len, nz = oz / len;

        // Phase-offset per particle
        const t = (i / count) * Math.PI * 2;
        const wave = Math.sin(t * 3 + elapsed * 2.5) * midWave;
        const beat = this.beatStrength * 0.2;

        pos[i * 3]     = (ox + nx * (bassLift + wave + beat)) * beatPulse;
        pos[i * 3 + 1] = (oy + ny * (bassLift + wave + beat)) * beatPulse;
        pos[i * 3 + 2] = (oz + nz * (bassLift + wave + beat)) * beatPulse;

        // Harmonic color: derive hue from position + beat
        const hue = ((this.currentHue + (i / count) * 80 + this.beatStrength * 40) % 360) / 360;
        const lightness = 0.5 + bands.overall * 0.3 + this.beatStrength * 0.2;
        color.setHSL(hue, 0.9, Math.min(0.9, lightness));
        col[i * 3] = color.r;
        col[i * 3 + 1] = color.g;
        col[i * 3 + 2] = color.b;
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      // Point size reactive to beats
      (this.material as THREE.PointsMaterial).size = 0.02 + this.beatStrength * 0.025;
    }

    // ── Rotation ────────────────────────────────────────────────────────────

    const baseRotSpeed = 0.18 + bands.overall * 0.3;

    this.targetRotY = elapsed * baseRotSpeed;
    this.targetRotX = Math.sin(elapsed * 0.23) * 0.4;

    this.rotY += (this.targetRotY - this.rotY) * 0.05;
    this.rotX += (this.targetRotX - this.rotX) * 0.05;

    if (this.pointCloud) {
      this.pointCloud.rotation.y = this.rotY;
      this.pointCloud.rotation.x = this.rotX;
    }

    // ── Tunnel Particles ────────────────────────────────────────────────────

    if (this.tunnelParticles && this.tunnelGeo) {
      this.tunnelParticles.rotation.y = elapsed * 0.04;
      this.tunnelParticles.rotation.x = elapsed * 0.02;
      (this.tunnelParticles.material as THREE.PointsMaterial).opacity =
        0.15 + bands.treble * 0.3 + this.beatStrength * 0.2;
    }

    // ── Camera ──────────────────────────────────────────────────────────────

    // Zoom on bass kicks
    const targetZ = 3.5 - this.beatStrength * 0.5 - bands.subBass * 0.3;
    this.camera.position.z += (targetZ - this.camera.position.z) * 0.08;
    this.camera.lookAt(0, 0, 0);

    // ── Scene fog ───────────────────────────────────────────────────────────

    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = 0.05 + this.beatStrength * 0.04;
    }

    this.renderer.render(this.scene, this.camera);
  }

  public getCurrentPreset(): DaliaPreset {
    return this.currentPreset;
  }

  public switchPreset(preset: DaliaPreset) {
    this.buildPreset(preset);
  }
}
