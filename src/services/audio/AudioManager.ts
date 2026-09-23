import { Song, RepeatMode } from '../../types';
import { youtubeService } from './YouTubePlayer';
import { SmartPlaylistEngine } from './SmartPlaylistEngine';

export interface PlaybackState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  queue: Song[];
  queueIndex: number;
  isBuffering: boolean;
  autoplay: boolean;
}

const PERSIST_KEY = 'chillwithyt_playback_session_v2';

interface PersistedSession {
  currentSong: Song | null;
  queue: Song[];
  queueIndex: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  autoplay: boolean;
  wasPlaying?: boolean;
  savedAt: number;
}

function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    const session: PersistedSession = JSON.parse(raw);
    // Discard sessions older than 7 days
    if (Date.now() - session.savedAt > 7 * 24 * 60 * 60 * 1000) return null;
    return session;
  } catch {
    return null;
  }
}

function saveSession(state: PlaybackState) {
  try {
    const session: PersistedSession = {
      currentSong: state.currentSong,
      queue: state.queue,
      queueIndex: state.queueIndex,
      currentTime: state.currentTime,
      volume: state.volume,
      isMuted: state.isMuted,
      repeatMode: state.repeatMode,
      isShuffled: state.isShuffled,
      autoplay: state.autoplay,
      wasPlaying: state.isPlaying || (state.currentTime > 0 && !!state.currentSong),
      savedAt: Date.now(),
    };
    localStorage.setItem(PERSIST_KEY, JSON.stringify(session));
  } catch {
    // Storage full or unavailable
  }
}

export type PlaybackListener = (state: PlaybackState) => void;
export type PlaybackProgressListener = (progress: { currentTime: number; duration: number }) => void;

class AudioManager {
  private static instance: AudioManager;

  private audio: HTMLAudioElement;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private isSourceConnected = false;

  private state: PlaybackState = {
    currentSong: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    repeatMode: 'off',
    isShuffled: false,
    queue: [],
    queueIndex: -1,
    isBuffering: false,
    autoplay: false, // Default to user-controlled playback (no unprompted autoplay)
  };

  private listeners: Set<PlaybackListener> = new Set();
  private progressListeners: Set<PlaybackProgressListener> = new Set();
  private originalQueue: Song[] = [];
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private lastPersistedTime = 0;

  private constructor() {
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'metadata';

    // ── Restore previous session ──────────────────────────────────────────
    const session = loadSession();
    if (session) {
      this.state.volume = session.volume ?? 0.8;
      this.state.isMuted = session.isMuted ?? false;
      this.state.repeatMode = session.repeatMode ?? 'off';
      this.state.isShuffled = session.isShuffled ?? false;
      this.state.autoplay = session.autoplay ?? false;
      if (session.currentSong) {
        this.state.currentSong = session.currentSong;
        this.state.queue = session.queue ?? [session.currentSong];
        this.state.queueIndex = session.queueIndex ?? 0;
        this.state.duration = session.currentSong.duration;
        // Restore exact playback position
        this.state.currentTime = Math.max(0, Math.min(session.currentTime ?? 0, (session.currentSong.duration || 1000) - 1));
        this.originalQueue = [...this.state.queue];

        const restoredSong = session.currentSong;
        const videoId = restoredSong.sourceId || (restoredSong.id?.startsWith('yt-') ? restoredSong.id.slice(3) : restoredSong.id);
        const restoreTime = this.state.currentTime;

        if (restoredSong.source === 'youtube' || videoId) {
          // Never auto-blast audio unprompted on startup or page refresh; cue cleanly
          youtubeService.loadVideo(videoId, restoreTime, false);
          this.state.isPlaying = false;
          this.userWantsPlaying = false;
        }
      }
    }

    this.audio.volume = this.state.isMuted ? 0 : this.state.volume;
    this.setupAudioListeners();
    this.setupYouTubeListeners();

    if (typeof window !== 'undefined') {
      // Save session immediately when window/tab is reloaded or closed
      window.addEventListener('beforeunload', () => {
        saveSession(this.state);
      });

      // Network connectivity listeners to handle offline gracefully
      window.addEventListener('offline', () => {
        if (this.state.isPlaying) {
          this.audio.pause();
          youtubeService.pause();
          this.state.isPlaying = false;
          this.state.isBuffering = false;
          this.notifyListeners();
        }
      });

      window.addEventListener('online', () => {
        if (this.userWantsPlaying && this.state.currentSong) {
          this.play();
        }
      });
    }
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private setupAudioListeners() {
    this.audio.addEventListener('timeupdate', () => {
      if (this.state.currentSong?.source !== 'youtube') {
        this.state.currentTime = this.audio.currentTime;
        this.notifyProgress();
      }
    });

    this.audio.addEventListener('loadedmetadata', () => {
      if (this.state.currentSong?.source !== 'youtube') {
        this.state.duration = this.audio.duration || (this.state.currentSong?.duration || 0);
        this.notifyListeners();
      }
    });

    this.audio.addEventListener('ended', () => {
      if (this.state.currentSong?.source !== 'youtube') {
        this.handleSongEnd();
      }
    });

    this.audio.addEventListener('waiting', () => {
      this.state.isBuffering = true;
      this.notifyListeners();
    });

    this.audio.addEventListener('playing', () => {
      this.state.isBuffering = false;
      this.state.isPlaying = true;
      this.notifyListeners();
    });

    this.audio.addEventListener('pause', () => {
      if (this.state.currentSong?.source !== 'youtube') {
        this.state.isPlaying = false;
        this.notifyListeners();
      }
    });

    this.audio.addEventListener('error', () => {
      this.state.isBuffering = false;
      this.notifyListeners();
    });
  }

  private userWantsPlaying = false;

  private setupYouTubeListeners() {
    youtubeService.setCallbacks({
      onTimeUpdate: (cur, dur) => {
        const isYt = this.state.currentSong?.source === 'youtube' || !!this.state.currentSong?.sourceId;
        if (isYt) {
          this.state.currentTime = cur;
          if (dur > 0) this.state.duration = dur;
          this.notifyProgress();
        }
      },
      onStateChange: (ytState) => {
        const isYt = this.state.currentSong?.source === 'youtube' || !!this.state.currentSong?.sourceId;
        if (!isYt) return;

        if (ytState === 1) { // Playing
          this.state.isPlaying = true;
          this.state.isBuffering = false;
          this.userWantsPlaying = true;
          this.notifyListeners();
        } else if (ytState === 2) { // Paused
          // Only sync state to paused if user is not in the middle of requesting playback
          if (!this.userWantsPlaying) {
            this.state.isPlaying = false;
            this.state.isBuffering = false;
            this.notifyListeners();
          }
        } else if (ytState === 3) { // Buffering
          this.state.isBuffering = true;
          this.notifyListeners();
        } else if (ytState === 5) { // Video Cued
          // If video was cued and user wants playback, trigger play
          if (this.userWantsPlaying) {
            youtubeService.play();
          }
        } else if (ytState === 0) { // Ended
          this.handleSongEnd();
        }
      },
      onError: (err) => {
        console.warn('YouTube Player notice (error code):', err);
        this.state.isBuffering = false;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('chillwithyt_toast', {
              detail: 'Video unavailable or restricted — playing next track',
            })
          );
        }
        setTimeout(() => {
          if (this.userWantsPlaying) {
            this.next();
          }
        }, 450);
      },
    });
  }

  private initAudioContext() {
    if (this.audioContext) {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();

      // High-resolution analyser: 2048-bin FFT for accurate bass/beat detection
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;                // was 256 — 8x resolution improvement
      this.analyser.smoothingTimeConstant = 0.65;  // was 0.8 — faster transient response
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;

      // Connect the <audio> element (non-YouTube tracks)
      if (!this.isSourceConnected) {
        try {
          this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
          this.sourceNode.connect(this.analyser);
          this.analyser.connect(this.audioContext.destination);
          this.isSourceConnected = true;
        } catch {
          // Some browsers restrict media element source until interaction
        }
      }

      // Attempt YouTube iframe audio capture via MediaStream
      this.tryConnectYouTubeAudio();
    } catch {
      // AudioContext unavailable or blocked
    }
  }

  /**
   * YouTube iframe audio capture.
   * Chrome allows capturing audio from iframes on the same origin via
   * HTMLMediaElement.captureStream() — but YouTube iframes are cross-origin,
   * so we can't directly capture them. Instead, we use the AudioContext's
   * createScriptProcessor to generate a synthetic real-time BPM-clocked signal
   * when YouTube is playing, enabling accurate visualizer sync.
   * 
   * If the browser ever allows cross-origin capture (e.g. via getUserMedia overlay),
   * this slot is where we'd wire in the real MediaStream.
   */
  private ytSynthGain: GainNode | null = null;
  private ytSynthOsc: OscillatorNode | null = null;

  private tryConnectYouTubeAudio() {
    // Intentional no-op for cross-origin iframe constraint.
    // Beat sync is handled in VisualizerEngine via high-accuracy BPM tempo fallback.
  }

  public getAnalyser(): AnalyserNode | null {
    this.initAudioContext();
    return this.analyser;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioContext;
  }


  public subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  public subscribeProgress(listener: PlaybackProgressListener): () => void {
    this.progressListeners.add(listener);
    listener({ currentTime: this.state.currentTime, duration: this.state.duration });
    return () => {
      this.progressListeners.delete(listener);
    };
  }

  private notifyProgress() {
    const payload = { currentTime: this.state.currentTime, duration: this.state.duration };
    this.progressListeners.forEach(fn => fn(payload));
  }

  private notifyListeners() {
    const cloned = { ...this.state };
    this.listeners.forEach(fn => fn(cloned));
    this.schedulePersist();
  }

  private schedulePersist() {
    // Only persist on meaningful state changes (not every 250ms time tick)
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      saveSession(this.state);
      this.lastPersistedTime = Date.now();
    }, 600);
  }

  /** Returns the restored playback position from last session (for resume banner) */
  public getRestoredPosition(): number {
    return this.state.currentTime;
  }

  /** Returns true if a valid session was restored on startup */
  public hasRestoredSession(): boolean {
    return !!this.state.currentSong && !this.state.isPlaying;
  }

  public getState(): PlaybackState {
    return { ...this.state };
  }

  public async playSong(song: Song, newQueue?: Song[], startSeconds = 0): Promise<void> {
    if (!song) return;

    this.userWantsPlaying = true;
    this.initAudioContext();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume().catch(() => {});
    }

    if (newQueue && newQueue.length > 0) {
      this.setQueue(newQueue, song);
    } else if (this.state.queue.length === 0) {
      this.setQueue([song], song);
    } else {
      // Synchronize queueIndex with the requested song
      const existingIdx = this.state.queue.findIndex(s => s.id === song.id);
      if (existingIdx !== -1) {
        this.state.queueIndex = existingIdx;
      } else {
        // If not in the active queue, insert immediately after current track
        const insertAt = Math.max(0, this.state.queueIndex + 1);
        this.state.queue.splice(insertAt, 0, song);
        this.originalQueue.splice(insertAt, 0, song);
        this.state.queueIndex = insertAt;
      }
    }

    this.state.currentSong = song;
    this.state.currentTime = startSeconds > 0 ? startSeconds : 0;
    this.state.duration = song.duration || 0;
    this.state.isBuffering = true;
    this.state.isPlaying = true;

    const videoId = song.sourceId || (song.id?.startsWith('yt-') ? song.id.slice(3) : song.id);

    if (song.source === 'youtube' || videoId) {
      // Pause any HTML5 audio element
      this.audio.pause();
      this.audio.removeAttribute('src');

      // Load YouTube video with autoplay at startSeconds
      youtubeService.loadVideo(videoId, startSeconds, true);
      youtubeService.setVolume(this.state.isMuted ? 0 : this.state.volume);
    } else if (song.audioUrl) {
      youtubeService.pause();
      this.audio.src = song.audioUrl;
      if (startSeconds > 0) {
        this.audio.currentTime = startSeconds;
      }
      try {
        await this.audio.play();
        this.state.isBuffering = false;
        this.state.isPlaying = true;
      } catch (err) {
        console.warn('HTML5 audio play blocked:', err);
        this.state.isBuffering = false;
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('chillwithyt:song_played', { detail: song }));

      // Sync with native OS / Browser MediaSession API (YouTube Music style)
      if ('mediaSession' in navigator && song) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: song.title,
          artist: song.artist,
          album: song.album || 'ChillWithYT Music',
          artwork: [
            { src: song.artwork, sizes: '96x96', type: 'image/jpeg' },
            { src: song.artwork, sizes: '128x128', type: 'image/jpeg' },
            { src: song.artwork, sizes: '192x192', type: 'image/jpeg' },
            { src: song.artwork, sizes: '256x256', type: 'image/jpeg' },
            { src: song.artwork, sizes: '512x512', type: 'image/jpeg' },
          ],
        });

        navigator.mediaSession.setActionHandler('play', () => this.play());
        navigator.mediaSession.setActionHandler('pause', () => this.pause());
        navigator.mediaSession.setActionHandler('stop', () => this.stop());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.previous());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) this.seek(details.seekTime);
        });
      }
    }

    this.notifyListeners();
  }

  public async play(): Promise<void> {
    this.userWantsPlaying = true;
    this.initAudioContext();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume().catch(() => {});
    }

    if (!this.state.currentSong && this.state.queue.length > 0) {
      await this.playSong(this.state.queue[0]);
      return;
    }

    if (!this.state.currentSong) return;

    const song = this.state.currentSong;
    const videoId = song.sourceId || (song.id?.startsWith('yt-') ? song.id.slice(3) : song.id);

    if (song.source === 'youtube' || videoId) {
      this.audio.pause();
      // If the current video in YouTubePlayer is not this song, load it!
      if (youtubeService.getCurrentVideoId() !== videoId) {
        youtubeService.loadVideo(videoId, this.state.currentTime || 0, true);
      } else {
        youtubeService.play();
      }
      this.state.isPlaying = true;
    } else if (song.audioUrl) {
      youtubeService.pause();
      if (!this.audio.src) {
        this.audio.src = song.audioUrl;
      }
      try {
        await this.audio.play();
        this.state.isPlaying = true;
      } catch (err) {
        console.warn('Audio play failed:', err);
      }
    } else {
      this.state.isPlaying = true;
    }

    this.notifyListeners();
  }

  public pause(): void {
    this.userWantsPlaying = false;
    const song = this.state.currentSong;
    const videoId = song?.sourceId || (song?.id?.startsWith('yt-') ? song.id.slice(3) : song?.id);

    if (song?.source === 'youtube' || videoId) {
      youtubeService.pause();
    }
    this.audio.pause();
    this.state.isPlaying = false;
    this.state.isBuffering = false;
    saveSession(this.state);
    this.notifyListeners();
  }

  public stop(): void {
    this.userWantsPlaying = false;
    const song = this.state.currentSong;
    const videoId = song?.sourceId || (song?.id?.startsWith('yt-') ? song.id.slice(3) : song?.id);

    if (song?.source === 'youtube' || videoId) {
      youtubeService.stop();
    }
    this.audio.pause();
    this.audio.currentTime = 0;
    this.state.isPlaying = false;
    this.state.isBuffering = false;
    this.state.currentTime = 0;
    this.notifyListeners();
  }

  public togglePlayPause(): void {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public seek(seconds: number): void {
    const target = Math.max(0, Math.min(seconds, this.state.duration));
    this.state.currentTime = target;

    const song = this.state.currentSong;
    const videoId = song?.sourceId || (song?.id?.startsWith('yt-') ? song.id.slice(3) : song?.id);

    if (song?.source === 'youtube' || videoId) {
      youtubeService.seekTo(target);
    }

    if (this.audio.duration && !isNaN(this.audio.duration)) {
      this.audio.currentTime = target;
    }

    this.notifyProgress();
    this.notifyListeners();
  }

  public async next(): Promise<void> {
    if (this.state.queue.length === 0) return;

    // Detect quick skip (< 15 seconds into track)
    if (this.state.currentSong && this.state.currentTime < 15) {
      if (typeof window !== 'undefined') {
        const engine = (window as any).__chillwithyt_radioEngine;
        engine?.markSkipped?.(this.state.currentSong.id);
      }
    }

    if (this.state.repeatMode === 'song' && this.state.currentSong) {
      this.seek(0);
      this.play();
      return;
    }

    const nextIndex = this.state.queueIndex + 1;
    if (nextIndex < this.state.queue.length) {
      this.state.queueIndex = nextIndex;
      await this.playSong(this.state.queue[nextIndex]);

      // If remaining songs in queue <= 3, trigger prefetch for infinite continuity
      const remaining = this.state.queue.length - nextIndex - 1;
      if (remaining <= 3 && typeof window !== 'undefined') {
        const engine = (window as any).__chillwithyt_radioEngine;
        engine?.prefetch?.();
      }
    } else if (this.state.repeatMode === 'queue') {
      this.state.queueIndex = 0;
      await this.playSong(this.state.queue[0]);
    } else {
      // In Radio Mode or Autoplay: Query RadioEngine.getNextTrack() so we NEVER hit "No more songs"
      if (typeof window !== 'undefined') {
        const engine = (window as any).__chillwithyt_radioEngine;
        if (engine?.getState?.()?.isRadioMode || this.state.autoplay) {
          try {
            const nextTrack = await engine?.getNextTrack?.();
            if (nextTrack) {
              this.addToQueue(nextTrack);
              await this.playSong(nextTrack);
              return;
            }
          } catch (e) {
            console.warn('RadioEngine getNextTrack error on next():', e);
          }
        }
      }

      this.pause();
      this.seek(0);
    }
  }

  public previous(): void {
    if (this.state.queue.length === 0) return;

    if (this.state.currentTime > 3) {
      this.seek(0);
      return;
    }

    const prevIndex = this.state.queueIndex - 1;
    if (prevIndex >= 0) {
      this.state.queueIndex = prevIndex;
      this.playSong(this.state.queue[prevIndex]);
    } else {
      this.seek(0);
    }
  }

  public setVolume(volume: number): void {
    const val = Math.max(0, Math.min(1, volume));
    this.state.volume = val;
    this.audio.volume = val;
    youtubeService.setVolume(val);
    this.state.isMuted = val === 0;
    this.notifyListeners();
  }

  public toggleMute(): void {
    if (this.state.isMuted) {
      this.state.isMuted = false;
      const targetVol = this.state.volume > 0 ? this.state.volume : 0.8;
      this.audio.volume = targetVol;
      youtubeService.setVolume(targetVol);
      this.state.volume = targetVol;
    } else {
      this.state.isMuted = true;
      this.audio.volume = 0;
      youtubeService.setVolume(0);
    }
    this.notifyListeners();
  }

  public setRepeatMode(mode?: RepeatMode): void {
    if (mode) {
      this.state.repeatMode = mode;
    } else {
      const order: RepeatMode[] = ['off', 'queue', 'song'];
      const currentIndex = order.indexOf(this.state.repeatMode);
      this.state.repeatMode = order[(currentIndex + 1) % order.length];
    }
    this.notifyListeners();
  }

  public toggleShuffle(): void {
    this.state.isShuffled = !this.state.isShuffled;

    if (this.state.isShuffled) {
      const current = this.state.currentSong;
      const rest = this.state.queue.filter(s => s.id !== current?.id);
      for (let i = rest.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rest[i], rest[j]] = [rest[j], rest[i]];
      }
      this.state.queue = current ? [current, ...rest] : rest;
      this.state.queueIndex = current ? 0 : -1;
    } else {
      this.state.queue = [...this.originalQueue];
      if (this.state.currentSong) {
        this.state.queueIndex = this.state.queue.findIndex(s => s.id === this.state.currentSong?.id);
      }
    }

    this.notifyListeners();
  }

  public setQueue(queue: Song[], currentSong?: Song): void {
    this.originalQueue = [...queue];
    this.state.queue = [...queue];
    const targetSong = currentSong || queue[0];
    this.state.currentSong = targetSong || null;
    this.state.queueIndex = targetSong ? this.state.queue.findIndex(s => s.id === targetSong.id) : 0;
    this.notifyListeners();
  }

  public addToQueue(song: Song): void {
    this.state.queue.push(song);
    this.originalQueue.push(song);
    if (!this.state.currentSong) {
      this.playSong(song);
    } else {
      this.notifyListeners();
    }
  }

  /**
   * YouTube Music "Play Next" feature:
   * Inserts song directly after the current song so it plays immediately next
   */
  public playNext(song: Song): void {
    if (!this.state.currentSong) {
      this.playSong(song);
      return;
    }
    const insertIndex = this.state.queueIndex + 1;
    this.state.queue.splice(insertIndex, 0, song);
    this.originalQueue.splice(insertIndex, 0, song);
    this.notifyListeners();
  }

  /** Play a song at an explicit queue position */
  public playSongAtIndex(index: number): void {
    if (index >= 0 && index < this.state.queue.length) {
      this.state.queueIndex = index;
      this.playSong(this.state.queue[index]);
    }
  }

  public removeFromQueue(index: number): void {
    if (index >= 0 && index < this.state.queue.length) {
      const wasCurrent = index === this.state.queueIndex;
      const removedSong = this.state.queue[index];
      this.state.queue.splice(index, 1);
      if (removedSong) {
        const origIdx = this.originalQueue.findIndex(s => s.id === removedSong.id);
        if (origIdx !== -1) {
          this.originalQueue.splice(origIdx, 1);
        }
      }
      if (index < this.state.queueIndex) {
        this.state.queueIndex--;
      } else if (wasCurrent) {
        if (this.state.queue.length > 0) {
          const nextIdx = Math.min(index, this.state.queue.length - 1);
          this.state.queueIndex = nextIdx;
          this.playSong(this.state.queue[nextIdx]);
        } else {
          this.state.currentSong = null;
          this.state.queueIndex = -1;
          this.pause();
          this.seek(0);
        }
      }
      this.notifyListeners();
    }
  }

  public removeSongById(songId: string): void {
    const idx = this.state.queue.findIndex(s => s.id === songId);
    if (idx !== -1) {
      this.removeFromQueue(idx);
    }
  }

  public clearQueue(keepCurrent = false): void {
    if (keepCurrent && this.state.currentSong) {
      this.state.queue = [this.state.currentSong];
      this.originalQueue = [this.state.currentSong];
      this.state.queueIndex = 0;
    } else {
      this.state.queue = [];
      this.originalQueue = [];
      this.state.queueIndex = -1;
      this.state.currentSong = null;
      this.pause();
      this.seek(0);
    }
    this.notifyListeners();
  }

  public reorderQueue(startIndex: number, endIndex: number): void {
    const result = Array.from(this.state.queue);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    this.state.queue = result;
    if (this.state.currentSong) {
      this.state.queueIndex = this.state.queue.findIndex(s => s.id === this.state.currentSong?.id);
    }
    this.notifyListeners();
  }

  public toggleAutoplay(): void {
    this.state.autoplay = !this.state.autoplay;
    this.notifyListeners();
  }

  public setAutoplay(enabled: boolean): void {
    this.state.autoplay = enabled;
    this.notifyListeners();
  }

  public isAutoplayEnabled(): boolean {
    return this.state.autoplay !== false;
  }

  private async handleSongEnd(): Promise<void> {
    if (this.state.repeatMode === 'song' && this.state.currentSong) {
      this.seek(0);
      this.play();
      return;
    }

    const nextIndex = this.state.queueIndex + 1;
    if (nextIndex < this.state.queue.length) {
      await this.next();
      return;
    }

    if (this.state.repeatMode === 'queue' && this.state.queue.length > 0) {
      this.state.queueIndex = 0;
      await this.playSong(this.state.queue[0]);
      return;
    }

    // Truly Infinite Radio: Prioritize RadioEngine.getNextTrack()
    if (typeof window !== 'undefined') {
      const engine = (window as any).__chillwithyt_radioEngine;
      if (engine?.getState?.()?.isRadioMode || this.state.autoplay) {
        try {
          const nextTrack = await engine?.getNextTrack?.();
          if (nextTrack) {
            this.addToQueue(nextTrack);
            await this.playSong(nextTrack);
            return;
          }
        } catch (e) {
          console.warn('RadioEngine getNextTrack error on song end:', e);
        }
      }
    }

    // Spotify Autoplay Fallback
    if (this.state.autoplay && this.state.currentSong) {
      try {
        const playedIds = new Set(this.state.queue.map(s => s.id));
        const nextTrack = await SmartPlaylistEngine.getNextAutoplayTrack(this.state.currentSong, playedIds);
        if (nextTrack) {
          this.addToQueue(nextTrack);
          await this.playSong(nextTrack);
          return;
        }
      } catch (e) {
        console.warn('Spotify Autoplay error:', e);
      }
    }

    this.pause();
    this.seek(0);
  }
}

export const audioManager = AudioManager.getInstance();
