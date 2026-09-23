// Real YouTube IFrame Player API Service

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export type YouTubePlayerState = -1 | 0 | 1 | 2 | 3 | 5; // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued

interface YouTubePlayerCallbacks {
  onReady?: () => void;
  onStateChange?: (state: YouTubePlayerState) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onError?: (err: any) => void;
}

export class YouTubePlayerService {
  private static instance: YouTubePlayerService;
  private player: any = null;
  private isReady = false;
  private currentVideoId: string | null = null;
  private timeUpdateInterval: any = null;
  private callbacks: YouTubePlayerCallbacks = {};
  private containerId = 'chillwithyt-yt-player-container';

  private constructor() {
    this.loadIFrameAPI();
  }

  public static getInstance(): YouTubePlayerService {
    if (!YouTubePlayerService.instance) {
      YouTubePlayerService.instance = new YouTubePlayerService();
    }
    return YouTubePlayerService.instance;
  }

  private loadIFrameAPI() {
    if (window.YT && window.YT.Player) {
      this.initPlayer();
      return;
    }

    // Insert YouTube script tag
    const existingScript = document.getElementById('youtube-iframe-script');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevReady) prevReady();
      this.initPlayer();
    };

    const pollInterval = window.setInterval(() => {
      if (window.YT && window.YT.Player && !this.player) {
        window.clearInterval(pollInterval);
        this.initPlayer();
      }
    }, 150);
    // Auto-clear after 15s to prevent perpetual timer
    window.setTimeout(() => window.clearInterval(pollInterval), 15000);
  }

  private initPlayer() {
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      container.style.position = 'fixed';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.bottom = 'auto';
      container.style.right = 'auto';
      container.style.width = '1px';
      container.style.height = '1px';
      container.style.opacity = '0.01';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }

    const playerDiv = document.createElement('div');
    playerDiv.id = 'chillwithyt-yt-element';
    container.appendChild(playerDiv);

    try {
      this.player = new window.YT.Player('chillwithyt-yt-element', {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            this.isReady = true;
            this.startTimeUpdater();
            this.callbacks.onReady?.();
          },
          onStateChange: (event: any) => {
            this.callbacks.onStateChange?.(event.data);
          },
          onError: (err: any) => {
            console.warn('YouTube Player notice:', err);
            this.callbacks.onError?.(err);
          },
        },
      });
    } catch (e) {
      console.warn('Could not initialize YouTube player instance:', e);
    }
  }

  public setCallbacks(cbs: YouTubePlayerCallbacks) {
    this.callbacks = { ...this.callbacks, ...cbs };
  }

  private readyPollTimer: any = null;

  public loadVideo(videoId: string, startSeconds = 0, autoplay = true) {
    if (!videoId) return;
    const cleanId = YouTubePlayerService.extractVideoId(videoId) || videoId;
    if (!cleanId || cleanId.trim().length === 0) return;

    this.currentVideoId = cleanId;

    if (this.readyPollTimer) {
      clearInterval(this.readyPollTimer);
      this.readyPollTimer = null;
    }

    if (!this.isReady || !this.player || typeof this.player.loadVideoById !== 'function') {
      this.readyPollTimer = setInterval(() => {
        if (this.isReady && this.player && typeof this.player.loadVideoById === 'function') {
          clearInterval(this.readyPollTimer);
          this.readyPollTimer = null;
          this.executeLoad(cleanId, startSeconds, autoplay);
        }
      }, 100);
      return;
    }

    this.executeLoad(cleanId, startSeconds, autoplay);
  }

  private executeLoad(videoId: string, startSeconds: number, autoplay: boolean) {
    try {
      if (autoplay) {
        if (typeof this.player.loadVideoById === 'function') {
          this.player.loadVideoById({
            videoId,
            startSeconds,
          });
        }
      } else {
        if (typeof this.player.cueVideoById === 'function') {
          this.player.cueVideoById({
            videoId,
            startSeconds,
          });
        }
      }
    } catch {
      try {
        if (autoplay) {
          this.player.loadVideoById(videoId, startSeconds);
        } else {
          this.player.cueVideoById(videoId, startSeconds);
        }
      } catch (err) {
        console.warn('YouTube loadVideoById fallback exception:', err);
      }
    }
  }

  public play() {
    try {
      if (this.player && typeof this.player.playVideo === 'function') {
        this.player.playVideo();
      }
    } catch (e) {
      console.warn('Play video failed:', e);
    }
  }

  public pause() {
    try {
      if (this.player && typeof this.player.pauseVideo === 'function') {
        this.player.pauseVideo();
      }
    } catch (e) {
      console.warn('Pause video failed:', e);
    }
  }

  public stop() {
    try {
      if (this.player && typeof this.player.stopVideo === 'function') {
        this.player.stopVideo();
      }
    } catch (e) {
      console.warn('Stop video failed:', e);
    }
  }

  public seekTo(seconds: number) {
    try {
      if (this.player && typeof this.player.seekTo === 'function') {
        this.player.seekTo(seconds, true);
      }
    } catch (e) {
      console.warn('Seek video failed:', e);
    }
  }

  public setVolume(volume: number) {
    // volume is 0 to 1 -> YouTube takes 0 to 100
    try {
      if (this.player && typeof this.player.setVolume === 'function') {
        this.player.setVolume(Math.round(volume * 100));
      }
    } catch (e) {
      console.warn('Set volume failed:', e);
    }
  }

  public getCurrentVideoId(): string | null {
    return this.currentVideoId;
  }

  public getCurrentTime(): number {
    try {
      return this.player?.getCurrentTime ? this.player.getCurrentTime() : 0;
    } catch {
      return 0;
    }
  }

  public getDuration(): number {
    try {
      return this.player?.getDuration ? this.player.getDuration() : 0;
    } catch {
      return 0;
    }
  }

  private activeWatchTarget: HTMLElement | null = null;
  private watchInterval: number | null = null;

  /** Position the player container over targetEl using fixed coordinates without moving it in the DOM tree */
  public showInContainer(targetEl: HTMLElement, targetZIndex = '82') {
    this.activeWatchTarget = targetEl;
    let container = document.getElementById(this.containerId);
    if (!container) {
      this.initPlayer();
      container = document.getElementById(this.containerId);
      if (!container) return;
    }

    const updatePosition = () => {
      if (!this.activeWatchTarget) return;
      if (!document.body.contains(this.activeWatchTarget)) {
        this.hideToBackground();
        return;
      }
      const rect = this.activeWatchTarget.getBoundingClientRect();
      if (rect.width <= 10 || rect.height <= 10) return;

      Object.assign(container!.style, {
        position: 'fixed',
        top: `${Math.round(rect.top)}px`,
        left: `${Math.round(rect.left)}px`,
        bottom: 'auto',
        right: 'auto',
        width: `${Math.round(rect.width)}px`,
        height: `${Math.round(rect.height)}px`,
        opacity: '1',
        visibility: 'visible',
        pointerEvents: 'auto',
        zIndex: targetZIndex,
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'block',
        transition: 'none',
      });

      // Crucial: keep iframe fully visible and sized on every update
      const iframe = container!.querySelector('iframe');
      if (iframe) {
        Object.assign(iframe.style, {
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: 'inherit',
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          display: 'block',
          opacity: '1',
          visibility: 'visible',
        });
      }

      const inner = document.getElementById('chillwithyt-yt-element');
      if (inner && inner !== (iframe as any)) {
        Object.assign(inner.style, {
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: '0',
          left: '0',
          display: 'block',
          opacity: '1',
          visibility: 'visible',
        });
      }
    };

    updatePosition();

    // Keep position synchronized during scrolling / resizing / transitions
    if (this.watchInterval) clearInterval(this.watchInterval);
    this.watchInterval = window.setInterval(updatePosition, 100);
  }

  /** Move the player container back off-screen (audio-only mode) without reparenting or reloading */
  public hideToBackground() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }
    this.activeWatchTarget = null;

    const container = document.getElementById(this.containerId);
    if (!container) return;

    Object.assign(container.style, {
      position: 'fixed',
      top: '-9999px',
      left: '-9999px',
      bottom: 'auto',
      right: 'auto',
      width: '1px',
      height: '1px',
      opacity: '0.001',
      pointerEvents: 'none',
      zIndex: '-100',
    });
  }

  /** Enable/disable the YouTube controls bar interaction */
  public setPlayerControls(enabled: boolean) {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.style.pointerEvents = enabled ? 'auto' : 'none';
    }
  }


  private startTimeUpdater() {
    if (this.timeUpdateInterval) clearInterval(this.timeUpdateInterval);

    this.timeUpdateInterval = setInterval(() => {
      if (this.isReady && this.player) {
        const cur = this.getCurrentTime();
        const dur = this.getDuration();
        this.callbacks.onTimeUpdate?.(cur, dur);
      }
    }, 250);
  }

  // Parse YouTube video ID from standard URL, mobile link, or embed
  public static extractVideoId(url: string): string | null {
    if (!url) return null;
    const clean = url.trim();

    // Direct ID check (11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
      return clean;
    }

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = clean.match(regExp);

    return match && match[2].length === 11 ? match[2] : null;
  }

  // Real metadata fetcher via YouTube oEmbed API (no API key required)
  public static async fetchYouTubeMetadata(videoIdOrUrl: string) {
    const videoId = YouTubePlayerService.extractVideoId(videoIdOrUrl) || videoIdOrUrl;
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

    try {
      const res = await fetch(oembedUrl);
      if (!res.ok) throw new Error('Failed to fetch oEmbed metadata');
      const data = await res.json();

      return {
        videoId,
        title: data.title || 'YouTube Track',
        artist: data.author_name || 'YouTube Music',
        artwork: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        duration: 210, // fallback average duration until loaded
      };
    } catch {
      return {
        videoId,
        title: `YouTube Video (${videoId})`,
        artist: 'YouTube Creator',
        artwork: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        duration: 210,
      };
    }
  }
}

export const youtubeService = YouTubePlayerService.getInstance();
