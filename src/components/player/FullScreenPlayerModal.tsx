import React, { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../store/useStore';
import { audioManager, PlaybackState } from '../../services/audio/AudioManager';
import { VisualizerCanvas } from './VisualizerCanvas';
import { FloatingReactions } from '../room/FloatingReactions';
import { detectSongGenre } from '../../services/audio/VisualizerEngine';
import { Song } from '../../types';
import { youtubeService } from '../../services/audio/YouTubePlayer';
import { MusicService } from '../../services/audio/MusicService';
import { ArtworkImage } from '../../utils/artwork';

// Lazy-load the heavy Three.js Dalia visualizer so it doesn't block initial render
const DaliaCanvas = lazy(() => import('./DaliaCanvas').then(m => ({ default: m.DaliaCanvas })));

// Thin wrapper to avoid Suspense flash inside the modal
const DaliaCanvasLazy: React.FC<{ song?: Song | null; showPresetBar?: boolean; className?: string }> = (props) => (
  <Suspense fallback={
    <div className="w-full h-full flex items-center justify-center bg-black text-white/30 text-xs">
      Loading Dalia 3D…
    </div>
  }>
    <DaliaCanvas {...props} />
  </Suspense>
);
import { VideoFrameSpectrum } from './VideoFrameSpectrum';
import { YouTubeMusicPlayerTabs, PlayerTabType } from './YouTubeMusicPlayerTabs';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  Sliders,
  ListMusic,
  Share2,
  Plus,
  MonitorPlay,
  Lock,
  Unlock,
  Activity,
  Layers,
  Sparkles,
  ChevronDown,
  Search,
  Check,
  Loader2,
  CornerDownRight,
  Users
} from 'lucide-react';

export const FullScreenPlayerModal: React.FC = () => {
  const [state, store] = useStore();
  const [playback, setPlayback] = useState<PlaybackState>(audioManager.getState());
  const [copied, setCopied] = useState(false);
  const [isBeatKick, setIsBeatKick] = useState(false);
  const [displayMode, setDisplayMode] = useState<'video' | 'no_video' | 'split'>('video');
  const [isLocked, setIsLocked] = useState(false);
  const [isSideTabsOpen, setIsSideTabsOpen] = useState(true);
  const [activeSideTab, setActiveSideTab] = useState<PlayerTabType>('up_next');
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [videoMountNode, setVideoMountNode] = useState<HTMLDivElement | null>(null);
  const lastSongIdRef = useRef<string | null>(null);

  // In-Player Fullscreen Search Overlay state
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [overlaySearchQuery, setOverlaySearchQuery] = useState('');
  const [overlayResults, setOverlayResults] = useState<Song[]>([]);
  const [isOverlaySearching, setIsOverlaySearching] = useState(false);
  const [overlayAddedId, setOverlayAddedId] = useState<string | null>(null);

  // Dedicated reliable close handler: immediately moves iframe offscreen and updates state
  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    youtubeService.hideToBackground();
    store.setState({ isFullScreenPlayerOpen: false });
  };

  // Subscribe to audio state changes
  useEffect(() => {
    return audioManager.subscribe((newPlayback) => {
      setPlayback(newPlayback);
    });
  }, []);

  // Global ESC key listener to close modal or search overlay
  useEffect(() => {
    if (!state.isFullScreenPlayerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSearchOverlayOpen) {
          setIsSearchOverlayOpen(false);
        } else {
          handleClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isFullScreenPlayerOpen, isSearchOverlayOpen]);

  // Debounced search for In-Player Search Overlay
  useEffect(() => {
    const trimmed = overlaySearchQuery.trim();
    if (!trimmed) {
      setOverlayResults([]);
      setIsOverlaySearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsOverlaySearching(true);
      try {
        const res = await MusicService.searchTracks(trimmed, 10);
        setOverlayResults(res.data);
      } catch (err) {
        console.warn('In-player overlay search error:', err);
      } finally {
        setIsOverlaySearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [overlaySearchQuery]);

  // Auto video play: when modal opens on a streamable song, default to video mode
  useEffect(() => {
    const current = audioManager.getState().currentSong;
    if (current?.source === 'youtube' || !!current?.sourceId || !!current?.id) {
      setDisplayMode('video');
    } else {
      setDisplayMode('no_video');
    }
  }, [state.isFullScreenPlayerOpen]);

  // Auto-switch video mode when song changes mid-session
  useEffect(() => {
    const songId = playback.currentSong?.id ?? null;
    if (songId && songId !== lastSongIdRef.current) {
      lastSongIdRef.current = songId;
      if (playback.currentSong?.source === 'youtube' || !!playback.currentSong?.sourceId || !!playback.currentSong?.id) {
        if (displayMode === 'no_video') {
          // Keep user's preference if they specifically set no_video
        }
      } else {
        setDisplayMode('no_video');
      }
    }
  }, [playback.currentSong?.id]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      youtubeService.hideToBackground();
    };
  }, []);

  // Show/hide the YouTube iframe according to displayMode and search overlay state
  useEffect(() => {
    if (!state.isFullScreenPlayerOpen || isSearchOverlayOpen) {
      youtubeService.hideToBackground();
      return;
    }

    const isVideoMode = (displayMode === 'video' || displayMode === 'split') && !!playback.currentSong;

    if (isVideoMode && videoMountNode) {
      youtubeService.showInContainer(videoMountNode, '72');

      const t1 = window.setTimeout(() => {
        if (videoMountNode && !isSearchOverlayOpen) youtubeService.showInContainer(videoMountNode, '72');
      }, 60);
      const t2 = window.setTimeout(() => {
        if (videoMountNode && !isSearchOverlayOpen) youtubeService.showInContainer(videoMountNode, '72');
      }, 200);

      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    } else if (!isVideoMode) {
      youtubeService.hideToBackground();
    }
  }, [displayMode, state.isFullScreenPlayerOpen, videoMountNode, playback.currentSong?.id, isSearchOverlayOpen]);

  if (!state.isFullScreenPlayerOpen || !playback.currentSong) return null;

  const { currentSong, isPlaying, currentTime, duration, volume, isMuted, isShuffled, repeatMode } = playback;
  const isLiked = state.likedSongIds.includes(currentSong.id);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    audioManager.seek(target);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-[#0C0C0E] flex flex-col justify-between px-3 py-2 sm:px-6 sm:py-4 md:px-8 md:py-5 animate-fade-in select-none">
      {/* Locked Floating Unlock Pill */}
      {isLocked && (
        <div className="fixed top-5 left-0 right-0 flex justify-center z-[85] pointer-events-auto animate-fade-in">
          <button
            onClick={() => setIsLocked(false)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/90 backdrop-blur-xl border border-[#FF0000]/60 text-white shadow-[0_0_25px_rgba(255,0,0,0.4)] hover:scale-105 active:scale-95 transition-all text-xs font-bold tracking-wider uppercase cursor-pointer group"
            title="Unlock Player"
          >
            <Lock className="w-4 h-4 text-[#FF0000] group-hover:hidden" />
            <Unlock className="w-4 h-4 text-emerald-400 hidden group-hover:inline" />
            <span>Player Locked · Tap to Unlock</span>
          </button>
        </div>
      )}

      {/* Top Bar - Clean, Compact 48px Header */}
      <div className={`flex items-center justify-between gap-2 z-[75] transition-all duration-300 ${
        isLocked ? 'opacity-0 pointer-events-none -translate-y-2' : 'opacity-100 translate-y-0'
      }`}>
        {/* Top-Left: Minimize Button & App Branding */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleClose}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#1A1A1E] hover:bg-[#26262C] text-[#CCCCCC] hover:text-white border border-white/10 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer shrink-0 shadow-sm group"
            title="Minimize Player (Esc)"
            aria-label="Minimize Player"
          >
            <ChevronDown className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#FF0000] group-hover:translate-y-0.5 transition-transform" />
            <span className="hidden sm:inline">Minimize</span>
          </button>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#161618] border border-white/10">
            <img src="/icon.png" alt="ChillWithYT" className="w-3.5 h-3.5 rounded object-cover" />
            <span className="text-[11px] font-bold text-white tracking-tight">ChillWith<span className="text-[#FF0000]">YT</span></span>
          </div>

          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#FF0000] bg-[#FF0000]/10 px-2 sm:px-2.5 py-0.5 rounded-full border border-[#FF0000]/25 shrink-0">
            Now Playing
          </span>
        </div>

        {/* Center Mode Switcher Pill (Segmented, elegant, cohesive) */}
        {(currentSong.source === 'youtube' || !!currentSong.sourceId || !!currentSong.id) && (
          <div className="hidden sm:inline-flex items-center p-1 rounded-xl bg-[#161619] border border-white/10 shadow-inner">
            <button
              onClick={() => setDisplayMode('video')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                displayMode === 'video'
                  ? 'bg-[#26262B] text-white shadow-sm font-semibold'
                  : 'text-[#888888] hover:text-white'
              }`}
              title="Watch YouTube Video"
            >
              <MonitorPlay className="w-3.5 h-3.5 text-[#FF0000]" />
              <span>Video</span>
            </button>
            <button
              onClick={() => setDisplayMode('no_video')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                displayMode === 'no_video'
                  ? 'bg-[#26262B] text-white shadow-sm font-semibold'
                  : 'text-[#888888] hover:text-white'
              }`}
              title="Audio & Studio Equalizer"
            >
              <Activity className="w-3.5 h-3.5 text-[#FF0000]" />
              <span>Audio + EQ</span>
            </button>
            <button
              onClick={() => setDisplayMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                displayMode === 'split'
                  ? 'bg-[#26262B] text-white shadow-sm font-semibold'
                  : 'text-[#888888] hover:text-white'
              }`}
              title="Video + Audio Perimeter Glow"
            >
              <Layers className="w-3.5 h-3.5 text-[#FF0000]" />
              <span>Cinema EQ</span>
            </button>
          </div>
        )}

        {/* Top-Right Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile Display Mode Toggle Button */}
          {(currentSong.source === 'youtube' || !!currentSong.sourceId || !!currentSong.id) && (
            <div className="flex sm:hidden items-center p-0.5 rounded-lg bg-[#161619] border border-white/10">
              <button
                onClick={() => setDisplayMode(displayMode === 'video' ? 'no_video' : displayMode === 'no_video' ? 'split' : 'video')}
                className="px-2 py-1 rounded-md text-[11px] font-semibold bg-[#26262B] text-white flex items-center gap-1.5 cursor-pointer"
                title="Switch Display Mode"
              >
                {displayMode === 'video' && <MonitorPlay className="w-3 h-3 text-[#FF0000]" />}
                {displayMode === 'no_video' && <Activity className="w-3 h-3 text-[#FF0000]" />}
                {displayMode === 'split' && <Layers className="w-3 h-3 text-[#FF0000]" />}
                <span>{displayMode === 'video' ? 'Video' : displayMode === 'no_video' ? 'Audio+EQ' : 'Cinema'}</span>
              </button>
            </div>
          )}

          {/* 👥 Create Room with this song */}
          <button
            onClick={() => {
              handleClose();
              store.setState({ isCreateRoomModalOpen: true });
            }}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-[#FF0000] to-rose-600 hover:from-[#CC0000] hover:to-rose-700 text-white text-xs font-semibold transition cursor-pointer shadow-md shadow-red-900/30 shrink-0"
            title="Start a Listening Room with friends playing this song"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Create Room</span>
          </button>

          {/* 🔍 Search & Add Button */}
          <button
            onClick={() => setIsSearchOverlayOpen(true)}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-[#1A1A1E] hover:bg-[#26262C] text-white border border-white/10 hover:border-[#FF0000]/50 text-xs font-semibold transition cursor-pointer shadow-sm shrink-0"
            title="Search and add songs directly to queue"
          >
            <Search className="w-3.5 h-3.5 text-[#FF0000]" />
            <span className="hidden sm:inline">Search & Add</span>
          </button>

          {/* Desktop Toggle Side Tabs Button */}
          <button
            onClick={() => setIsSideTabsOpen(!isSideTabsOpen)}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              isSideTabsOpen
                ? 'bg-white text-black border-white shadow-md'
                : 'bg-[#1A1A1E] text-[#AAAAAA] hover:text-white border-white/10'
            }`}
            title="Toggle Up Next & Queue panel"
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Queue</span>
          </button>

          {/* Lock Screen Controls Toggle */}
          <button
            onClick={() => setIsLocked(true)}
            className="p-2 rounded-xl bg-[#1A1A1E] hover:bg-[#26262C] text-[#AAAAAA] hover:text-white border border-white/10 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="Lock player controls"
          >
            <Lock className="w-4 h-4" />
          </button>

          {/* Visualizer Settings & Presets */}
          <button
            onClick={() => store.setState({ isVisualizerOptionsOpen: true })}
            className="hidden sm:flex p-2 rounded-xl bg-[#1A1A1E] hover:bg-[#26262C] text-[#AAAAAA] hover:text-white border border-white/10 transition cursor-pointer"
            title="Visualizer Settings & Equalizer Presets"
          >
            <Sliders className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="hidden sm:flex p-2 rounded-xl bg-[#1A1A1E] hover:bg-[#26262C] text-[#AAAAAA] hover:text-white border border-white/10 transition cursor-pointer"
            title={copied ? "Copied!" : "Share Track"}
          >
            <Share2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Top-Right Close Button (Esc) */}
          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-[#1A1A1E] hover:bg-red-950/50 text-[#CCCCCC] hover:text-red-400 border border-white/10 hover:border-red-500/50 transition cursor-pointer shrink-0 shadow-md"
            title="Close Player (Esc)"
            aria-label="Close Player"
          >
            <X className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* ── Main Stage Container (Balanced 55/45 Split on Desktop) ── */}
      <div className="relative flex-1 flex flex-col lg:flex-row items-stretch gap-4 lg:gap-6 my-1 lg:my-2 overflow-hidden max-w-7xl mx-auto w-full min-h-0">
        {/* Left Side: Visual Presentation & Player Controls */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden min-w-0 min-h-0">
          {/* Center Artwork & Visualizer Container */}
          <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden min-h-0 py-1 sm:py-2">
            {/* Floating Reactions overlay */}
            <FloatingReactions reactions={state.roomReactions} />

            {/* Main Visual Presentation Container */}
            {displayMode === 'video' ? (
              /* ── 1. VIDEO ONLY MODE: Clean 16:9 Cinema presentation of YouTube video ── */
              <div className="relative w-full max-w-2xl mx-auto flex items-center justify-center">
                <div 
                  className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black ring-1 ring-white/10 shadow-2xl"
                >
                  {/* Dedicated mount target for YouTube video player */}
                  <div ref={setVideoMountNode} className="w-full h-full" />

                  {isLocked && (
                    <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full border border-[#FF0000]/40 text-xs text-white flex items-center gap-1.5 z-[74] pointer-events-none shadow-lg animate-fade-in">
                      <Lock className="w-3.5 h-3.5 text-[#FF0000]" />
                      <span>Locked</span>
                    </div>
                  )}
                </div>
              </div>
            ) : displayMode === 'split' ? (
              /* ── 2. SPLIT / CINEMA MODE: Video with Clean Perimeter Spectrum around Video Frame ── */
              <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center">
                <VideoFrameSpectrum
                  song={currentSong}
                  isPlaying={isPlaying}
                  onBeat={() => {
                    setIsBeatKick(true);
                    setTimeout(() => setIsBeatKick(false), 140);
                  }}
                  className="w-full aspect-video"
                >
                  <div 
                    className="relative w-full h-full aspect-video rounded-2xl overflow-hidden bg-black ring-1 ring-white/10 shadow-2xl"
                  >
                    <div ref={setVideoMountNode} className="w-full h-full" />

                    {isLocked && (
                      <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full border border-[#FF0000]/40 text-xs text-white flex items-center gap-1.5 z-[74] pointer-events-none shadow-lg animate-fade-in">
                        <Lock className="w-3.5 h-3.5 text-[#FF0000]" />
                        <span>Locked</span>
                      </div>
                    )}
                  </div>
                </VideoFrameSpectrum>
              </div>
            ) : (
              /* ── 3. NO VIDEO MODE: Clean Video Thumbnail + Studio Equalizer Spectrum Combined ── */
              <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center">
                <VideoFrameSpectrum
                  song={currentSong}
                  isPlaying={isPlaying}
                  onBeat={() => {
                    setIsBeatKick(true);
                    setTimeout(() => setIsBeatKick(false), 140);
                  }}
                  className="w-full aspect-video"
                >
                  <div className="relative w-full h-full aspect-video rounded-2xl overflow-hidden bg-black ring-1 ring-white/10 shadow-2xl flex items-center justify-center">
                    {/* Blurred Ambient Backdrop from Video Artwork */}
                    <img
                      src={currentSong.artwork}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-30 select-none pointer-events-none"
                      aria-hidden="true"
                    />

                    {/* Central Clean Video Thumbnail Box without Cluttered Text Stamped on Top */}
                    <div className={`relative z-10 w-[90%] h-[82%] max-w-lg aspect-video rounded-xl overflow-hidden shadow-[0_0_35px_rgba(0,0,0,0.8)] border border-white/15 transition-transform duration-200 ${
                      isBeatKick ? 'scale-[1.02]' : isPlaying ? 'scale-[1.01]' : 'scale-100'
                    }`}>
                      <img
                        src={currentSong.artwork}
                        alt={currentSong.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Subtle Vignette */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    </div>

                    {/* Studio Dynamic Equalizer Canvas overlaid across the frame */}
                    <VisualizerCanvas
                      config={state.visualizerConfig}
                      song={currentSong}
                      onBeat={() => {
                        setIsBeatKick(true);
                        setTimeout(() => setIsBeatKick(false), 140);
                      }}
                      width={960}
                      height={540}
                      className="absolute inset-0 w-full h-full pointer-events-none z-20 opacity-70"
                    />

                    {isLocked && (
                      <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-full border border-[#FF0000]/40 text-xs text-white flex items-center gap-1.5 z-[74] pointer-events-none shadow-lg animate-fade-in">
                        <Lock className="w-3.5 h-3.5 text-[#FF0000]" />
                        <span>Locked</span>
                      </div>
                    )}
                  </div>
                </VideoFrameSpectrum>
              </div>
            )}

            {/* Song Info (Single, clean, non-redundant title with 2-line wrap support) */}
            <div className="text-center mt-2.5 mb-1 z-20 max-w-xl mx-auto px-4 w-full">
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-white tracking-tight line-clamp-2 break-words leading-snug">
                {currentSong.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#AAAAAA] font-medium mt-0.5 truncate">
                {currentSong.artist}{currentSong.album ? ` · ${currentSong.album}` : ''}
              </p>
            </div>
          </div>

          {/* Bottom Controls Area */}
          <div className={`w-full max-w-2xl mx-auto space-y-3 sm:space-y-4 z-[75] transition-all duration-300 ${
            isLocked ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'
          }`}>
            {/* Progress Scrubber */}
            <div className="space-y-1">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime || 0}
                onChange={handleProgressChange}
                className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#FF0000] hover:h-2 transition-all"
              />
              <div className="flex justify-between text-[11px] font-mono text-[#777777] px-0.5">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Primary Controls Row */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              {/* Left Actions: Like & Shuffle */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => store.toggleLikeSong(currentSong.id, currentSong)}
                  className={`p-2.5 rounded-full transition cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center ${
                    isLiked ? 'text-[#FF0000] bg-[#FF0000]/15' : 'text-[#AAAAAA] hover:text-white'
                  }`}
                  title="Like"
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => audioManager.toggleShuffle()}
                  className={`p-2.5 rounded-full transition min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer ${
                    isShuffled ? 'text-[#FF0000] bg-[#FF0000]/10' : 'text-[#777777] hover:text-white'
                  }`}
                  title={`Shuffle: ${isShuffled ? 'On' : 'Off'}`}
                >
                  <Shuffle className="w-4 sm:w-4.5 h-4 sm:h-4.5" />
                </button>
              </div>

              {/* Center Playback Buttons: Previous, Play/Pause, Next */}
              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  onClick={() => audioManager.previous()}
                  className="p-2 sm:p-2.5 rounded-full text-[#CCCCCC] hover:text-white transition cursor-pointer min-w-[42px] min-h-[42px] flex items-center justify-center active:scale-95"
                  title="Previous track"
                >
                  <SkipBack className="w-5 sm:w-5.5 h-5 sm:h-5.5 fill-current" />
                </button>

                <button
                  onClick={() => audioManager.togglePlayPause()}
                  className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#FF0000] hover:bg-[#E00000] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(255,0,0,0.4)] transition hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 sm:w-6 h-5 sm:h-6 fill-current" />
                  ) : (
                    <Play className="w-5 sm:w-6 h-5 sm:h-6 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => audioManager.next()}
                  className="p-2 sm:p-2.5 rounded-full text-[#CCCCCC] hover:text-white transition cursor-pointer min-w-[42px] min-h-[42px] flex items-center justify-center active:scale-95"
                  title="Next track"
                >
                  <SkipForward className="w-5 sm:w-5.5 h-5 sm:h-5.5 fill-current" />
                </button>
              </div>

              {/* Right Controls: Repeat & Volume */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => audioManager.setRepeatMode()}
                  className={`p-2.5 rounded-full transition min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer ${
                    repeatMode !== 'off' ? 'text-[#FF0000] bg-[#FF0000]/10' : 'text-[#777777] hover:text-white'
                  }`}
                  title={`Repeat: ${repeatMode}`}
                >
                  <Repeat className="w-4 sm:w-4.5 h-4 sm:h-4.5" />
                </button>

                {/* Integrated Volume Slider */}
                <div className="hidden sm:flex items-center gap-1.5 pl-1.5 border-l border-white/10">
                  <button
                    onClick={() => audioManager.toggleMute()}
                    className="p-1.5 text-[#AAAAAA] hover:text-white transition cursor-pointer"
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-red-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : (volume ?? 1)}
                    onChange={(e) => audioManager.setVolume(parseFloat(e.target.value))}
                    className="w-16 sm:w-20 accent-[#FF0000] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Up Next Quick Drawer Trigger Bar */}
            <button
              onClick={() => {
                setActiveSideTab('up_next');
                setIsMobileSheetOpen(true);
              }}
              className="lg:hidden w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#161619] hover:bg-[#202025] border border-white/10 active:scale-[0.99] transition shadow-md mt-1 cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <ListMusic className="w-4 h-4 text-[#FF0000] shrink-0" />
                <span className="text-xs font-semibold text-white truncate">
                  Up Next {playback.queue.length > 0 ? `· ${playback.queue.length} in queue` : ''}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-[#888888] font-medium shrink-0">
                <span>View Queue</span>
                <ChevronDown className="w-3.5 h-3.5 rotate-180 text-white/60" />
              </div>
            </button>
          </div>
        </div>

        {/* Right Side: YouTube Music Queue & Related Panel (Desktop Spacious 420px+) */}
        {isSideTabsOpen && (
          <div className="hidden lg:flex w-88 xl:w-[440px] shrink-0 h-full overflow-hidden animate-fade-in">
            <YouTubeMusicPlayerTabs
              currentSong={currentSong}
              playback={playback}
              defaultTab={activeSideTab}
              className="w-full h-full"
            />
          </div>
        )}
      </div>

      {/* Mobile Drawer Sheet for Up Next & Related (Responsive Phone View) */}
      {isMobileSheetOpen && (
        <div className="lg:hidden fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex flex-col justify-end animate-fade-in">
          <div className="bg-[#181818] border-t border-[#333333] rounded-t-3xl p-4 max-h-[85vh] h-[85vh] flex flex-col shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#292929]">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <img src="/icon.png" alt="" className="w-4 h-4 rounded" />
                Up Next & Queue
              </span>
              <button
                onClick={() => setIsMobileSheetOpen(false)}
                className="p-1.5 rounded-full bg-[#272727] text-[#AAAAAA] hover:text-white cursor-pointer"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <YouTubeMusicPlayerTabs
                currentSong={currentSong}
                playback={playback}
                defaultTab={activeSideTab}
                className="w-full h-full border-none shadow-none rounded-none bg-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── In-Player Fullscreen Search & Add Overlay Modal ── */}
      {isSearchOverlayOpen && createPortal(
        <div
          className="fixed inset-0 z-[999] bg-black/85 backdrop-blur-2xl flex flex-col items-center justify-start p-3 sm:p-6 md:p-10 animate-fade-in overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSearchOverlayOpen(false);
          }}
        >
          <div className="w-full max-w-2xl bg-[#161618] border border-[#2E2E32] rounded-3xl p-4 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.85)] flex flex-col max-h-[88vh] my-auto animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-[#26262A] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-2xl bg-[#FF0000]/15 text-[#FF0000] border border-[#FF0000]/20 shrink-0">
                  <Search className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">Search & Add to Player</h3>
                  <p className="text-[11px] sm:text-xs text-[#888888] truncate">Find and play or queue music without leaving full screen</p>
                </div>
              </div>
              <button
                onClick={() => setIsSearchOverlayOpen(false)}
                className="p-2 rounded-xl bg-[#222226] text-[#AAAAAA] hover:text-white hover:bg-[#2C2C32] border border-[#2E2E34] transition cursor-pointer shrink-0 ml-2"
                title="Close search (Esc)"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Box */}
            <div className="relative flex items-center shrink-0 mt-4">
              <Search className="w-5 h-5 absolute left-3.5 text-[#777777] pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={overlaySearchQuery}
                onChange={(e) => setOverlaySearchQuery(e.target.value)}
                placeholder="Search songs, artists, or genres..."
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-[#202024] border border-[#303036] focus:border-[#FF0000] text-sm text-white placeholder-[#717171] focus:outline-none focus:ring-1 focus:ring-[#FF0000]/50 transition"
              />
              {isOverlaySearching ? (
                <Loader2 className="w-4 h-4 absolute right-3.5 text-[#FF0000] animate-spin" />
              ) : overlaySearchQuery ? (
                <button
                  onClick={() => setOverlaySearchQuery('')}
                  className="absolute right-3 p-1.5 text-[#777777] hover:text-white transition cursor-pointer"
                  title="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>

            {/* Quick Inspiration Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-2 shrink-0 scrollbar-none">
              <span className="text-[11px] font-semibold text-[#666666] shrink-0 mr-0.5">Try:</span>
              {['Lofi Beats', 'Synthwave', 'Acoustic Chill', 'Trending Hits', 'EDM', 'Piano Relax'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setOverlaySearchQuery(tag)}
                  className="px-2.5 py-1 rounded-full bg-[#202024] hover:bg-[#2A2A30] text-xs text-[#AAAAAA] hover:text-white border border-[#2E2E34] transition whitespace-nowrap cursor-pointer shrink-0"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Results list - Scrollable container */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mt-1 scrollbar-thin">
              {isOverlaySearching && overlayResults.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#717171] flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#FF0000]" />
                  <span>Searching music catalog...</span>
                </div>
              ) : overlayResults.length === 0 && overlaySearchQuery.trim() ? (
                <div className="py-12 text-center text-xs text-[#717171]">
                  No songs found matching "{overlaySearchQuery}"
                </div>
              ) : (
                overlayResults.map((song) => {
                  const isJustAdded = overlayAddedId === song.id;
                  return (
                    <div
                      key={song.id}
                      className="flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-2xl bg-[#1D1D21] hover:bg-[#25252A] transition border border-[#28282D]"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 ring-1 ring-white/10">
                          <ArtworkImage src={song.artwork} alt={song.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-semibold text-white truncate">{song.title}</p>
                          <p className="text-[11px] text-[#888888] truncate">{song.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        {isJustAdded ? (
                          <span className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold animate-fade-in">
                            <Check className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Added</span>
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                audioManager.playSong(song);
                                setIsSearchOverlayOpen(false);
                              }}
                              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#2D2D32] hover:bg-[#FF0000] text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                              title="Play Now"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span className="hidden sm:inline">Play</span>
                            </button>
                            <button
                              onClick={() => {
                                audioManager.playNext(song);
                                setOverlayAddedId(song.id);
                                setTimeout(() => setOverlayAddedId(null), 1800);
                              }}
                              className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-[#26262B] hover:bg-[#FF0000] text-[#CCCCCC] hover:text-white text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                              title="Play Next in Queue"
                            >
                              <CornerDownRight className="w-3.5 h-3.5 text-[#AAAAAA]" />
                              <span className="hidden sm:inline">Next</span>
                            </button>
                            <button
                              onClick={() => {
                                audioManager.addToQueue(song);
                                setOverlayAddedId(song.id);
                                setTimeout(() => setOverlayAddedId(null), 1800);
                              }}
                              className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-[#26262B] hover:bg-emerald-600 text-[#CCCCCC] hover:text-white text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                              title="Add to End of Queue"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Queue</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
