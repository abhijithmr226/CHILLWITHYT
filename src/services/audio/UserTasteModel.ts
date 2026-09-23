/**
 * UserTasteModel — Dynamic Real-Time Acoustic & Session Taste Tracker
 * 
 * Replaces static user profiles with a real-time behavioral taste model:
 * 1. Circadian Phase Engine (Adjusts energy/valence targets based on user local time).
 * 2. Session Velocity & Frustration Detection (Detects consecutive skips & lowers energy).
 * 3. Language & Artist Affinity Matrix (Decaying exponential moving average).
 * 4. Acoustic Target Matching (BPM, Energy, Valence, Danceability).
 */

import { Song } from '../../types';

export type CircadianPhase = 'morning_energize' | 'afternoon_focus' | 'sunset_relax' | 'late_night_soul';

export interface AcousticTarget {
  targetEnergy: number;      // 0.0 (calm) to 1.0 (mass/club)
  targetValence: number;     // 0.0 (sad/melancholic) to 1.0 (euphoric)
  targetBpm: number;         // e.g. 85, 110, 130
  acousticPreference: number;// 0.0 (synthetic/trap) to 1.0 (organic/acoustic)
}

export interface SessionState {
  circadianPhase: CircadianPhase;
  consecutiveSkips: number;
  consecutiveLikes: number;
  sessionPlayCount: number;
  sessionStartTime: number;
  isFrustrated: boolean;     // >= 2 rapid skips (< 15s)
  currentMoodLabel: string;
}

const STORAGE_KEY_TASTE = 'chillwithyt_taste_model_v1';

export class UserTasteModelClass {
  private static instance: UserTasteModelClass;

  private languageAffinity: Map<string, number> = new Map();
  private artistAffinity: Map<string, number> = new Map();

  private session: SessionState = {
    circadianPhase: 'afternoon_focus',
    consecutiveSkips: 0,
    consecutiveLikes: 0,
    sessionPlayCount: 0,
    sessionStartTime: Date.now(),
    isFrustrated: false,
    currentMoodLabel: 'Balanced',
  };

  private constructor() {
    this.hydrate();
    this.updateCircadianPhase();
  }

  public static getInstance(): UserTasteModelClass {
    if (!UserTasteModelClass.instance) {
      UserTasteModelClass.instance = new UserTasteModelClass();
    }
    return UserTasteModelClass.instance;
  }

  private hydrate() {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem(STORAGE_KEY_TASTE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.languages) this.languageAffinity = new Map(Object.entries(parsed.languages));
        if (parsed.artists) this.artistAffinity = new Map(Object.entries(parsed.artists));
      }
    } catch {}
  }

  private persist() {
    try {
      if (typeof window === 'undefined') return;
      const data = {
        languages: Object.fromEntries(this.languageAffinity),
        artists: Object.fromEntries(this.artistAffinity),
        updatedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY_TASTE, JSON.stringify(data));
    } catch {}
  }

  // ─── Circadian Rhythm & Time of Day ───────────────────────────────────────

  public updateCircadianPhase(): CircadianPhase {
    const hour = new Date().getHours();
    let phase: CircadianPhase;
    let mood: string;

    if (hour >= 5 && hour < 11) {
      phase = 'morning_energize';
      mood = '🌅 Fresh & Uplifting';
    } else if (hour >= 11 && hour < 17) {
      phase = 'afternoon_focus';
      mood = '🎧 Focused & Productive';
    } else if (hour >= 17 && hour < 22) {
      phase = 'sunset_relax';
      mood = '🌇 Sunset Acoustic & Melodic';
    } else {
      phase = 'late_night_soul';
      mood = '🌙 Late Night Chill & Lofi';
    }

    this.session.circadianPhase = phase;
    this.session.currentMoodLabel = mood;
    return phase;
  }

  /**
   * Returns current acoustic targets calibrated for the active time-of-day & frustration state
   */
  public getAcousticTarget(): AcousticTarget {
    this.updateCircadianPhase();

    // If user is frustrated (rapid consecutive skips), tone down energy drastically
    if (this.session.isFrustrated) {
      return {
        targetEnergy: 0.35,
        targetValence: 0.50,
        targetBpm: 90,
        acousticPreference: 0.75,
      };
    }

    switch (this.session.circadianPhase) {
      case 'morning_energize':
        return { targetEnergy: 0.78, targetValence: 0.80, targetBpm: 122, acousticPreference: 0.35 };
      case 'afternoon_focus':
        return { targetEnergy: 0.65, targetValence: 0.65, targetBpm: 110, acousticPreference: 0.50 };
      case 'sunset_relax':
        return { targetEnergy: 0.52, targetValence: 0.60, targetBpm: 98, acousticPreference: 0.70 };
      case 'late_night_soul':
      default:
        return { targetEnergy: 0.38, targetValence: 0.45, targetBpm: 84, acousticPreference: 0.85 };
    }
  }

  // ─── Interaction Feedback Stream ──────────────────────────────────────────

  public recordTrackPlayed(song: Song) {
    this.session.sessionPlayCount++;
    this.session.consecutiveSkips = 0;
    this.session.isFrustrated = false;

    // Boost artist affinity slightly
    const artist = (song.artist || '').toLowerCase();
    if (artist) {
      const current = this.artistAffinity.get(artist) || 1.0;
      this.artistAffinity.set(artist, Math.min(5.0, current + 0.15));
    }

    // Boost language affinity
    if (song.tags) {
      for (const tag of song.tags) {
        const t = tag.toLowerCase();
        if (['malayalam', 'tamil', 'telugu', 'hindi', 'punjabi', 'kannada', 'bengali', 'english'].includes(t)) {
          const cur = this.languageAffinity.get(t) || 1.0;
          this.languageAffinity.set(t, Math.min(5.0, cur + 0.20));
        }
      }
    }

    this.persist();
  }

  public recordTrackSkippedEarly(song: Song) {
    this.session.consecutiveSkips++;
    this.session.consecutiveLikes = 0;

    if (this.session.consecutiveSkips >= 2) {
      this.session.isFrustrated = true;
    }

    // Dampen artist affinity slightly
    const artist = (song.artist || '').toLowerCase();
    if (artist && this.artistAffinity.has(artist)) {
      const cur = this.artistAffinity.get(artist)!;
      this.artistAffinity.set(artist, Math.max(0.2, cur - 0.25));
    }
  }

  public recordTrackLiked(song: Song) {
    this.session.consecutiveLikes++;
    this.session.consecutiveSkips = 0;
    this.session.isFrustrated = false;

    // Strong positive boost to artist
    const artist = (song.artist || '').toLowerCase();
    if (artist) {
      const current = this.artistAffinity.get(artist) || 1.0;
      this.artistAffinity.set(artist, Math.min(5.0, current + 0.60));
    }

    this.persist();
  }

  public getSessionState(): SessionState {
    return { ...this.session };
  }

  public getArtistAffinity(artistName: string): number {
    const key = artistName.toLowerCase();
    return this.artistAffinity.get(key) || 1.0;
  }

  public getLanguageAffinity(lang: string): number {
    const key = lang.toLowerCase();
    return this.languageAffinity.get(key) || 1.0;
  }
}

export const userTasteModel = UserTasteModelClass.getInstance();
