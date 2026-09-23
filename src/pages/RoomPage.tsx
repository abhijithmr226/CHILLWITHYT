import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { audioManager, PlaybackState } from '../services/audio/AudioManager';
import { RoomSyncEngine } from '../services/realtime/RoomSyncEngine';
import { Room, RoomMember, ChatMessage, FloatingReaction, QueueItem, Song } from '../types';
import { MembersList } from '../components/room/MembersList';
import { LiveChat } from '../components/room/LiveChat';
import { FloatingReactions } from '../components/room/FloatingReactions';
import { VisualizerCanvas } from '../components/player/VisualizerCanvas';
import { DJModePanel } from '../components/player/DJModePanel';
import { detectSongGenre } from '../services/audio/VisualizerEngine';
import { resolveAvatar } from '../utils/avatar';
import { AddMusicToRoomModal } from '../components/room/AddMusicToRoomModal';
import { YouTubePlayerService } from '../services/audio/YouTubePlayer';
import { ArtworkImage } from '../utils/artwork';
import { RoomVotingDuel } from '../components/room/RoomVotingDuel';
import { VideoFrameSpectrum } from '../components/player/VideoFrameSpectrum';
import {
  ArrowLeft,
  Crown,
  Share2,
  Sliders,
  ListMusic,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  Radio,
  Users,
  MessageCircle,
  Music,
  Trash2,
  Plus,
  Headphones,
  Flame,
  Activity,
  Layers,
  MonitorPlay,
  Sparkles,
  Rocket,
  ThumbsUp,
  LogOut
} from 'lucide-react';

interface RoomPageProps {
  roomId: string;
  onNavigate: (path: string) => void;
}

type RoomTab = 'chat' | 'queue' | 'members';

interface RoomScrubberProps {
  duration: number;
  isHostOrDJ: boolean;
  ownerName: string;
  onSeek: (target: number) => void;
  formatTime: (sec: number) => string;
}

const RoomScrubber: React.FC<RoomScrubberProps> = React.memo(({
  duration,
  isHostOrDJ,
  ownerName,
  onSeek,
  formatTime,
}) => {
  const [progress, setProgress] = useState(() => ({
    currentTime: audioManager.getState().currentTime,
    duration: audioManager.getState().duration || duration,
  }));

  useEffect(() => {
    return audioManager.subscribeProgress(setProgress);
  }, []);

  const totalDur = progress.duration || duration || 100;

  return (
    <div className="space-y-1">
      <input
        type="range"
        min="0"
        max={totalDur}
        value={progress.currentTime || 0}
        onChange={(e) => onSeek(parseFloat(e.target.value))}
        disabled={!isHostOrDJ}
        className={`w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#FF0000] hover:h-2 transition-all ${
          !isHostOrDJ ? 'opacity-60 cursor-not-allowed' : ''
        }`}
        title={isHostOrDJ ? 'Seek playback' : `Synced with ${ownerName}`}
      />
      <div className="flex justify-between items-center text-[11px] font-mono text-[#777777] px-0.5">
        <span>{formatTime(progress.currentTime)}</span>
        <span>{formatTime(totalDur)}</span>
      </div>
    </div>
  );
});

export const RoomPage: React.FC<RoomPageProps> = ({ roomId, onNavigate }) => {
  const [state, store] = useStore();
  const [playback, setPlayback] = useState<PlaybackState>(audioManager.getState());
  const [activeTab, setActiveTab] = useState<RoomTab>('chat');
  const [showDJPanel, setShowDJPanel] = useState(false);
  const [isBeatKick, setIsBeatKick] = useState(false);
  const [isAddMusicOpen, setIsAddMusicOpen] = useState(false);
  const [roomViewMode, setRoomViewMode] = useState<'no_video' | 'video' | 'split'>('no_video');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const roomVideoMountRef = useRef<HTMLDivElement | null>(null);
  const youtubeService = YouTubePlayerService.getInstance();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Local synced state
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [roomQueue, setRoomQueue] = useState<QueueItem[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [latestChatPreview, setLatestChatPreview] = useState<ChatMessage | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncEngineRef = useRef<RoomSyncEngine | null>(null);

  useEffect(() => {
    // Locate target room
    const targetRoom = state.rooms.find((r) => r.id === roomId);
    if (!targetRoom) {
      setRoom(null);
      return;
    }
    setRoom(targetRoom);

    // If room has current song, initialize playback at exact current position!
    if (targetRoom.currentSong) {
      let initialPos = targetRoom.currentPlaybackPosition || 0;
      if (targetRoom.isPlaying && targetRoom.playbackStartedAt) {
        const elapsed = Math.max(0, (Date.now() - targetRoom.playbackStartedAt) / 1000);
        const duration = targetRoom.currentSong.duration || 9999;
        initialPos = Math.min(elapsed, duration > 0 ? duration : elapsed);
      }
      audioManager.playSong(targetRoom.currentSong, undefined, initialPos);
    }

    // Load local chat cache for instant display
    const cacheKey = `chillwithyt_chat_${targetRoom.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setChatMessages(JSON.parse(cached));
      } catch {}
    } else {
      setChatMessages([]);
    }

    // Initialize RoomSyncEngine with real active user
    const currentUserId = state.currentUser?.id || 'guest';
    const userRole = targetRoom.ownerId === currentUserId ? 'owner' : 'member';
    const engine = new RoomSyncEngine(targetRoom.id, currentUserId, userRole);
    syncEngineRef.current = engine;

    engine.connect({
      onPlaybackSync: (payload) => {
        // Sync local room state when host updates playback
        setRoom((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            currentSong: payload.song || prev.currentSong,
            isPlaying: payload.isPlaying,
            currentPlaybackPosition: payload.position,
            playbackStartedAt: payload.startedAt,
          };
        });
      },
      onChatMessage: (msg) => {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          const updated = [...prev, msg];
          try {
            localStorage.setItem(cacheKey, JSON.stringify(updated.slice(-100)));
          } catch {}
          return updated;
        });

        // Notify if not currently focused on chat tab
        setActiveTab((currentTab) => {
          if (currentTab !== 'chat') {
            setUnreadChatCount((prev) => prev + 1);
            setLatestChatPreview(msg);
            if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
            previewTimerRef.current = setTimeout(() => {
              setLatestChatPreview(null);
            }, 4500);
          }
          return currentTab;
        });
      },
      onReaction: (reaction) => {
        setReactions((prev) => [...prev.slice(-10), reaction]);
        setTimeout(() => {
          setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
        }, 2500);
      },
      onPresenceUpdate: (updatedMembers) => {
        setMembers(updatedMembers);
      },
      onQueueUpdate: (updatedQueue) => {
        setRoomQueue(updatedQueue);
      },
    });

    const unsubscribeAudio = audioManager.subscribe((newPlayback) => {
      setPlayback(newPlayback);
    });

    return () => {
      engine.disconnect();
      unsubscribeAudio();
      youtubeService.hideToBackground();
    };
  }, [roomId]);

  // Handle in-room video mount/unmount
  useEffect(() => {
    const isVideoMount = (roomViewMode === 'video' || roomViewMode === 'split') && playback.currentSong?.source === 'youtube';
    if (isVideoMount && roomVideoMountRef.current) {
      const el = roomVideoMountRef.current;
      const timer = window.setTimeout(() => {
        if (el) {
          youtubeService.showInContainer(el);
          youtubeService.setPlayerControls(true);
        }
      }, 60);

      return () => {
        window.clearTimeout(timer);
        youtubeService.hideToBackground();
      };
    } else {
      youtubeService.hideToBackground();
    }
  }, [roomViewMode, playback.currentSong?.id]);

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 select-none space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#1A1A1E] border border-white/10 flex items-center justify-center mx-auto text-[#717171]">
          <Radio className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Room Not Found</h3>
          <p className="text-xs text-[#888888] mt-1">This listening room does not exist or has been closed.</p>
        </div>
        <button
          onClick={() => onNavigate('/rooms')}
          className="px-4 py-2 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition cursor-pointer"
        >
          Browse Listening Rooms
        </button>
      </div>
    );
  }

  const currentSong = playback.currentSong || room.currentSong;
  const isLiked = currentSong ? state.likedSongIds.includes(currentSong.id) : false;

  const currentMember: RoomMember = {
    userId: state.currentUser?.id || 'guest',
    username: state.currentUser?.username || 'chiller',
    displayName: state.currentUser?.displayName || 'Chiller',
    avatarUrl: resolveAvatar(state.currentUser?.avatarUrl, state.currentUser?.username || state.currentUser?.id),
    role: room.ownerId === (state.currentUser?.id || 'guest') ? 'owner' : 'member',
    isOnline: true,
    joinedAt: new Date().toISOString(),
    isListening: true,
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isHostOrDJ = syncEngineRef.current?.isHost() ?? (room.ownerId === (state.currentUser?.id || 'guest'));

  const handleSeek = (target: number) => {
    if (!isHostOrDJ) return;
    audioManager.seek(target);
    if (syncEngineRef.current && currentSong) {
      syncEngineRef.current.broadcastPlayback(playback.isPlaying, currentSong.id, target, playback.queueIndex, currentSong);
    }
    if (room) {
      store.updateRoom(room.id, {
        currentPlaybackPosition: target,
        playbackStartedAt: playback.isPlaying ? Date.now() - Math.round(target * 1000) : undefined,
      });
    }
  };

  const handleTogglePlay = () => {
    if (!isHostOrDJ) {
      showToast(`Playback is synced with host (${room?.ownerName || 'Host'}). Only host or DJs can control playback.`);
      return;
    }
    audioManager.togglePlayPause();
    const isNowPlaying = !playback.isPlaying;
    const pos = audioManager.getState().currentTime;
    if (syncEngineRef.current && currentSong) {
      syncEngineRef.current.broadcastPlayback(isNowPlaying, currentSong.id, pos, playback.queueIndex, currentSong);
    }
    if (room) {
      store.updateRoom(room.id, {
        isPlaying: isNowPlaying,
        currentPlaybackPosition: pos,
        playbackStartedAt: isNowPlaying ? Date.now() - Math.round(pos * 1000) : undefined,
      });
    }
  };

  const handleNext = async () => {
    if (!isHostOrDJ) return;
    await audioManager.next();
    const nextSong = audioManager.getState().currentSong;
    if (nextSong && syncEngineRef.current) {
      syncEngineRef.current.broadcastPlayback(true, nextSong.id, 0, audioManager.getState().queueIndex, nextSong);
      if (room) {
        store.updateRoom(room.id, {
          currentSong: nextSong,
          isPlaying: true,
          currentPlaybackPosition: 0,
          playbackStartedAt: Date.now(),
        });
      }
    }
  };

  const handlePrevious = async () => {
    if (!isHostOrDJ) return;
    await audioManager.previous();
    const prevSong = audioManager.getState().currentSong;
    if (prevSong && syncEngineRef.current) {
      syncEngineRef.current.broadcastPlayback(true, prevSong.id, 0, audioManager.getState().queueIndex, prevSong);
      if (room) {
        store.updateRoom(room.id, {
          currentSong: prevSong,
          isPlaying: true,
          currentPlaybackPosition: 0,
          playbackStartedAt: Date.now(),
        });
      }
    }
  };

  const handleReaction = (emoji: string) => {
    syncEngineRef.current?.broadcastReaction(emoji, currentMember.displayName);
  };

  const handleSendMessage = (text: string, songRef?: Song, replyTo?: ChatMessage['replyTo']) => {
    syncEngineRef.current?.sendChatMessage(text, currentMember, songRef, replyTo);
  };

  const handleQueueSong = async (song: Song) => {
    if (!syncEngineRef.current) return;
    const added = await syncEngineRef.current.addSongToQueue(song, {
      id: currentMember.userId,
      username: currentMember.username,
      avatarUrl: currentMember.avatarUrl,
    });
    if (added) {
      audioManager.addToQueue(song);
      showToast(`Added "${song.title}" to room queue`);
    } else {
      showToast(`"${song.title}" is already in the room queue`);
    }
  };

  const handlePlayNow = (song: Song) => {
    if (!isHostOrDJ) return;
    audioManager.playSong(song);
    if (syncEngineRef.current) {
      syncEngineRef.current.broadcastPlayback(true, song.id, 0, playback.queueIndex, song);
    }
    if (room) {
      store.updateRoom(room.id, {
        currentSong: song,
        isPlaying: true,
        currentPlaybackPosition: 0,
        playbackStartedAt: Date.now(),
      });
    }
  };

  const switchTab = (tab: RoomTab) => {
    setActiveTab(tab);
    if (tab === 'chat') {
      setUnreadChatCount(0);
      setLatestChatPreview(null);
    }
  };

  // Reusable Queue List for Desktop & Mobile
  const renderQueueList = () => (
    <div className="h-full flex flex-col p-3 sm:p-4 overflow-y-auto space-y-3 custom-scrollbar bg-[#121214]">
      <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-white">Room Queue</h3>
          <p className="text-[10px] sm:text-[11px] text-[#888888]">{playback.queue.length} track{playback.queue.length === 1 ? '' : 's'} queued</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddMusicOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF0000] text-white text-xs font-semibold transition active:scale-95 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Music</span>
          </button>
        </div>
      </div>

      <div className="space-y-1.5 flex-1 overflow-y-auto">
        {playback.queue.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#717171]">
            Room queue is empty. Tap "+ Add Music" to queue songs.
          </div>
        ) : (
          playback.queue.map((s, idx) => {
            const isPlaying = playback.currentSong?.id === s.id;
            return (
              <div
                key={`${s.id}-${idx}`}
                className={`flex items-center justify-between p-2 rounded-xl transition border ${
                  isPlaying ? 'border-[#FF0000]/50 bg-[#FF0000]/10' : 'border-white/5 bg-[#18181C] hover:bg-[#202026]'
                }`}
              >
                <div
                  onClick={() => isHostOrDJ && audioManager.playSong(s)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                >
                  <span className="text-[11px] font-mono text-[#717171] w-4 font-bold">{idx + 1}</span>
                  <ArtworkImage song={s} alt={s.title} className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover shrink-0 ring-1 ring-white/10" />
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold truncate ${isPlaying ? 'text-[#FF4D4D]' : 'text-white'}`}>
                      {s.title}
                    </p>
                    <p className="text-[10px] text-[#888888] truncate">{s.artist}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-1.5">
                  {isHostOrDJ && (
                    <button
                      onClick={() => audioManager.playSong(s)}
                      className="p-1.5 rounded-lg bg-[#24242A] hover:bg-[#FF0000] text-[#AAAAAA] hover:text-white transition active:scale-95 cursor-pointer"
                      title="Play Now"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                  )}
                  {idx > 0 && isHostOrDJ && (
                    <button
                      onClick={() => audioManager.removeFromQueue(idx)}
                      className="p-1.5 rounded-lg text-[#717171] hover:text-red-400 transition active:scale-95 cursor-pointer"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#0C0C0E] select-none overflow-hidden relative">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#1A1A1E] border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-2xl animate-fade-in flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Room Top Bar with Clear Room Identity ── */}
      <div className="h-13 sm:h-14 bg-[#121215] border-b border-white/10 px-3 sm:px-6 flex items-center justify-between z-20 shrink-0 gap-2">
        {/* Left: Back + Room Name & Live Telemetry */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={() => onNavigate('/rooms')}
            className="p-1.5 rounded-xl text-[#AAAAAA] hover:text-white bg-[#1A1A1E] hover:bg-[#26262C] border border-white/5 transition shrink-0 cursor-pointer"
            title="Back to rooms"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">{room.name}</h2>
              <span title={`Host: ${room.ownerName}`}>
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#AAAAAA] truncate">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
              <span>•</span>
              <span>{members.length} listening</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline text-[#888888]">Hosted by {room.ownerName}</span>
            </div>
          </div>
        </div>

        {/* Center: Desktop Display Mode Toggle */}
        <div className="hidden md:flex items-center p-1 rounded-xl bg-[#161619] border border-white/10 shadow-inner">
          <button
            onClick={() => setRoomViewMode('no_video')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              roomViewMode === 'no_video'
                ? 'bg-[#26262B] text-white shadow-sm font-semibold'
                : 'text-[#888888] hover:text-white'
            }`}
            title="Artwork Thumbnail + Equalizer Mode"
          >
            <Activity className="w-3.5 h-3.5 text-[#FF0000]" />
            <span>Audio + EQ</span>
          </button>
          <button
            onClick={() => setRoomViewMode('video')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              roomViewMode === 'video'
                ? 'bg-[#26262B] text-white shadow-sm font-semibold'
                : 'text-[#888888] hover:text-white'
            }`}
            title="Watch official YouTube video with room"
          >
            <MonitorPlay className="w-3.5 h-3.5 text-[#FF0000]" />
            <span>Video</span>
          </button>
          <button
            onClick={() => setRoomViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              roomViewMode === 'split'
                ? 'bg-[#26262B] text-white shadow-sm font-semibold'
                : 'text-[#888888] hover:text-white'
            }`}
            title="Watch Video with Perimeter Equalizer Spectrum"
          >
            <Layers className="w-3.5 h-3.5 text-[#FF0000]" />
            <span>Cinema EQ</span>
          </button>
        </div>

        {/* Right: Action Controls with Button Discipline */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Primary Action Button: Add Music */}
          <button
            onClick={() => setIsAddMusicOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF0000] to-rose-600 hover:from-[#CC0000] hover:to-rose-700 text-white text-xs font-semibold transition shadow-md shadow-red-900/30 cursor-pointer shrink-0 active:scale-95"
            title="Search and add songs to room queue"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Music</span>
            <span className="sm:hidden">Add</span>
          </button>

          {/* DJ Mode Toggle (Host/DJ) */}
          <button
            onClick={() => setShowDJPanel(!showDJPanel)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              showDJPanel
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-[#1A1A1E] text-[#AAAAAA] hover:text-white border border-white/10'
            }`}
            title="DJ Controls & Soundboard"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">DJ Mode</span>
          </button>

          {/* Visualizer Settings */}
          <button
            onClick={() => store.setState({ isVisualizerOptionsOpen: true })}
            className="p-1.5 rounded-xl bg-[#1A1A1E] hover:bg-[#26262C] text-[#AAAAAA] hover:text-white border border-white/10 transition hidden sm:flex cursor-pointer"
            title="Visualizer Presets"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Share Room Link */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              showToast('Room invite link copied to clipboard!');
            }}
            className="p-1.5 rounded-xl bg-[#1A1A1E] hover:bg-[#26262C] text-[#AAAAAA] hover:text-white border border-white/10 transition cursor-pointer"
            title="Copy invite link"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Leave / Delete Room */}
          {(() => {
            const isOwner = room.ownerId === state.currentUser?.id || room.ownerId === 'user-alex';
            return (
              <button
                onClick={() => {
                  if (window.confirm(isOwner ? `Close and delete room "${room.name}"?` : `Leave room "${room.name}"?`)) {
                    if (isOwner) {
                      store.deleteRoom(room.id);
                    }
                    onNavigate('/rooms');
                  }
                }}
                className={`p-1.5 rounded-xl bg-[#1A1A1E] transition cursor-pointer border border-white/10 ${
                  isOwner
                    ? 'hover:bg-red-950/40 text-[#AAAAAA] hover:text-red-400'
                    : 'hover:bg-amber-950/40 text-[#AAAAAA] hover:text-amber-300'
                }`}
                title={isOwner ? 'Close & delete room' : 'Leave room'}
              >
                {isOwner ? <Trash2 className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
              </button>
            );
          })()}
        </div>
      </div>

      {/* Floating DJ Panel if active */}
      {showDJPanel && (
        <div 
          className="fixed inset-0 z-[80] flex items-start justify-end p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowDJPanel(false)}
        >
          <div className="relative mt-12 sm:mt-14" onClick={(e) => e.stopPropagation()}>
            <DJModePanel onClose={() => setShowDJPanel(false)} />
          </div>
        </div>
      )}

      {/* ── Main Content Stage: Balanced Layout ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ── LEFT / MAIN STAGE (Spacious Player Arena, 65-70% on Desktop) ── */}
        <div className="flex-1 flex flex-col justify-between p-3 sm:p-5 lg:p-6 overflow-y-auto relative min-h-0 custom-scrollbar">
          {/* Floating Reactions */}
          <FloatingReactions reactions={reactions} />

          {/* Mobile Display Mode Toggle */}
          <div className="md:hidden flex items-center justify-center p-0.5 rounded-xl bg-[#161619] border border-white/10 mb-2 mx-auto w-fit">
            <button
              onClick={() => setRoomViewMode('no_video')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                roomViewMode === 'no_video' ? 'bg-[#26262B] text-white shadow-sm' : 'text-[#888888]'
              }`}
            >
              <Activity className="w-3 h-3 text-[#FF0000]" />
              <span>Audio + EQ</span>
            </button>
            <button
              onClick={() => setRoomViewMode('video')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                roomViewMode === 'video' ? 'bg-[#26262B] text-white shadow-sm' : 'text-[#888888]'
              }`}
            >
              <MonitorPlay className="w-3 h-3 text-[#FF0000]" />
              <span>Video</span>
            </button>
            <button
              onClick={() => setRoomViewMode('split')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                roomViewMode === 'split' ? 'bg-[#26262B] text-white shadow-sm' : 'text-[#888888]'
              }`}
            >
              <Layers className="w-3 h-3 text-[#FF0000]" />
              <span>Cinema</span>
            </button>
          </div>

          {/* Visual Presentation Area */}
          <div className="flex-1 flex flex-col items-center justify-center relative my-auto py-1 sm:py-2 min-h-0">
            {roomViewMode === 'split' ? (
              /* Cinema Mode: Video Mount with Soft Perimeter Audio Glow */
              <div className="w-full max-w-xl aspect-video rounded-2xl flex flex-col items-center justify-center z-10">
                <VideoFrameSpectrum
                  song={currentSong}
                  isPlaying={playback.isPlaying}
                  onBeat={() => {
                    setIsBeatKick(true);
                    setTimeout(() => setIsBeatKick(false), 140);
                  }}
                  className="w-full aspect-video"
                >
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-black ring-1 ring-white/10 shadow-2xl relative flex items-center justify-center">
                    <div ref={roomVideoMountRef} className="w-full h-full" />
                  </div>
                </VideoFrameSpectrum>
              </div>
            ) : roomViewMode === 'video' ? (
              /* Video Mount in Room */
              <div className="w-full max-w-xl aspect-video rounded-2xl overflow-hidden bg-black ring-1 ring-white/10 shadow-2xl relative flex items-center justify-center z-10">
                <div ref={roomVideoMountRef} className="w-full h-full" />
              </div>
            ) : (
              /* Clean Video Artwork + Equalizer Presentation */
              <div className="w-full max-w-lg aspect-video rounded-2xl overflow-hidden bg-black ring-1 ring-white/10 shadow-2xl relative flex items-center justify-center">
                {/* Ambient Blurred Backdrop */}
                {currentSong && (
                  <img
                    src={currentSong.artwork}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-30 select-none pointer-events-none"
                    aria-hidden="true"
                  />
                )}

                {/* Central Crisp Artwork Card */}
                {currentSong && (
                  <div className={`relative z-10 w-[88%] h-[82%] rounded-xl overflow-hidden shadow-2xl border border-white/15 transition-transform duration-200 ${
                    isBeatKick ? 'scale-[1.02]' : playback.isPlaying ? 'scale-[1.01]' : 'scale-100'
                  }`}>
                    <img
                      src={currentSong.artwork}
                      alt={currentSong.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  </div>
                )}

                {/* Studio Equalizer Canvas overlay */}
                <VisualizerCanvas
                  config={state.visualizerConfig}
                  song={currentSong}
                  onBeat={() => {
                    setIsBeatKick(true);
                    setTimeout(() => setIsBeatKick(false), 120);
                  }}
                  width={640}
                  height={360}
                  className="absolute inset-0 w-full h-full pointer-events-none z-20 opacity-70"
                />
              </div>
            )}

            {/* Prominent Current Song Info Card with 2-Line Wrapping */}
            {currentSong && (
              <div className="text-center mt-3 z-20 max-w-xl px-4 w-full">
                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white tracking-tight line-clamp-2 break-words leading-snug">
                  {currentSong.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#AAAAAA] font-medium mt-0.5 truncate">
                  {currentSong.artist} {currentSong.album ? `• ${currentSong.album}` : ''}
                </p>
                <div className="mt-1 flex items-center justify-center gap-1.5">
                  {!isHostOrDJ ? (
                    <span className="text-[10px] text-amber-300/90 font-medium px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center gap-1">
                      <Headphones className="w-3 h-3 text-amber-400" />
                      <span>Synced with Host ({room.ownerName})</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-emerald-400" />
                      <span>Host DJ Controls Active</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Playback Controls & Community Duel Area ── */}
          <div className="w-full max-w-xl mx-auto space-y-3 shrink-0 z-20 pt-1">
            {/* Progress Scrubber */}
            <RoomScrubber
              duration={playback.duration}
              isHostOrDJ={isHostOrDJ}
              ownerName={room.ownerName}
              onSeek={handleSeek}
              formatTime={formatTime}
            />

            {/* Transport Buttons Row */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              {/* Left: Like button */}
              {currentSong && (
                <button
                  onClick={() => store.toggleLikeSong(currentSong.id, currentSong)}
                  className={`p-2.5 rounded-full transition cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center ${
                    isLiked ? 'text-[#FF0000] bg-[#FF0000]/15' : 'text-[#AAAAAA] hover:text-white'
                  }`}
                  title="Like song"
                >
                  <Heart className={`w-4.5 h-4.5 ${isLiked ? 'fill-current' : ''}`} />
                </button>
              )}

              {/* Center Controls */}
              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  onClick={() => audioManager.toggleShuffle()}
                  disabled={!isHostOrDJ}
                  className={`p-2 rounded-full transition ${
                    playback.isShuffled ? 'text-[#FF0000] bg-[#FF0000]/10' : isHostOrDJ ? 'text-[#777777] hover:text-white cursor-pointer' : 'text-[#444444] cursor-not-allowed'
                  }`}
                  title={isHostOrDJ ? 'Shuffle' : 'Host controlled'}
                >
                  <Shuffle className="w-4 h-4" />
                </button>

                <button
                  onClick={handlePrevious}
                  disabled={!isHostOrDJ}
                  className={`p-2 transition ${isHostOrDJ ? 'text-[#CCCCCC] hover:text-white cursor-pointer active:scale-95' : 'text-[#444444] cursor-not-allowed'}`}
                  title={isHostOrDJ ? 'Previous' : 'Host controlled'}
                >
                  <SkipBack className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-current" />
                </button>

                <button
                  onClick={handleTogglePlay}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full text-white flex items-center justify-center transition shrink-0 cursor-pointer ${
                    isHostOrDJ
                      ? 'bg-[#FF0000] hover:bg-[#E00000] shadow-[0_4px_20px_rgba(255,0,0,0.4)] hover:scale-105 active:scale-95'
                      : 'bg-[#202024] hover:bg-[#2A2A30] text-white/50 ring-1 ring-white/10'
                  }`}
                  title={!isHostOrDJ ? `Playback controlled by ${room.ownerName}` : playback.isPlaying ? 'Pause' : 'Play'}
                >
                  {playback.isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={handleNext}
                  disabled={!isHostOrDJ}
                  className={`p-2 transition ${isHostOrDJ ? 'text-[#CCCCCC] hover:text-white cursor-pointer active:scale-95' : 'text-[#444444] cursor-not-allowed'}`}
                  title={isHostOrDJ ? 'Next' : 'Host controlled'}
                >
                  <SkipForward className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-current" />
                </button>

                <button
                  onClick={() => audioManager.setRepeatMode()}
                  disabled={!isHostOrDJ}
                  className={`p-2 rounded-full transition ${
                    playback.repeatMode !== 'off' ? 'text-[#FF0000] bg-[#FF0000]/10' : isHostOrDJ ? 'text-[#777777] hover:text-white cursor-pointer' : 'text-[#444444] cursor-not-allowed'
                  }`}
                  title={isHostOrDJ ? `Repeat: ${playback.repeatMode}` : 'Host controlled'}
                >
                  <Repeat className="w-4 h-4" />
                </button>
              </div>

              {/* Right: Volume Slider */}
              <div className="flex items-center gap-1.5 shrink-0 pl-1.5 border-l border-white/10">
                <button
                  onClick={() => audioManager.toggleMute()}
                  className="p-1 text-[#AAAAAA] hover:text-white transition cursor-pointer"
                  title={playback.isMuted ? 'Unmute' : 'Mute'}
                >
                  {playback.isMuted || playback.volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={playback.isMuted ? 0 : playback.volume}
                  onChange={(e) => audioManager.setVolume(parseFloat(e.target.value))}
                  className="w-16 sm:w-20 accent-[#FF0000] hidden sm:block cursor-pointer"
                />
              </div>
            </div>

            {/* Next Song Community Voting Duel (Compact, collapsible, accessible) */}
            <RoomVotingDuel room={room} defaultExpanded={false} />

            {/* Vibe Reactions Bar */}
            <div className="flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-2xl bg-[#141416] border border-white/10 shadow-sm select-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF0000] pl-1">Vibe</span>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'fire', icon: Flame, color: 'text-amber-500' },
                  { id: 'heart', icon: Heart, color: 'text-rose-500 fill-rose-500/30' },
                  { id: 'thumbsup', icon: ThumbsUp, color: 'text-emerald-400' },
                  { id: 'rocket', icon: Rocket, color: 'text-indigo-400' },
                  { id: 'sparkles', icon: Sparkles, color: 'text-yellow-400' },
                  { id: 'music', icon: Music, color: 'text-pink-400' },
                ].map((r) => {
                  const IconComp = r.icon;
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleReaction(r.id)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl bg-[#1C1C20] hover:bg-[#25252C] active:scale-75 transition-all cursor-pointer ${r.color}`}
                      title={`Send ${r.id}`}
                    >
                      <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  );
                })}
              </div>

              {/* Mobile Quick Chat Trigger */}
              <button
                onClick={() => switchTab('chat')}
                className="md:hidden flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 text-white text-xs font-semibold active:scale-95 transition shrink-0 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                {unreadChatCount > 0 && <span className="text-[10px] font-bold text-[#FF0000]">{unreadChatCount}</span>}
              </button>
            </div>

            {/* ── Mobile Secondary Tabs: Chat / Queue / Members ── */}
            <div className="md:hidden pt-2 space-y-2">
              <div className="flex items-center p-1 rounded-xl bg-[#161619] border border-white/10">
                <button
                  onClick={() => switchTab('chat')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                    activeTab === 'chat' ? 'bg-[#26262B] text-white shadow-sm' : 'text-[#888888]'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat</span>
                  {unreadChatCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#FF0000] text-white text-[9px] font-bold">
                      {unreadChatCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => switchTab('queue')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                    activeTab === 'queue' ? 'bg-[#26262B] text-white shadow-sm' : 'text-[#888888]'
                  }`}
                >
                  <ListMusic className="w-3.5 h-3.5" />
                  <span>Queue ({playback.queue.length})</span>
                </button>
                <button
                  onClick={() => switchTab('members')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                    activeTab === 'members' ? 'bg-[#26262B] text-white shadow-sm' : 'text-[#888888]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Members ({members.length})</span>
                </button>
              </div>

              {/* Mobile Tab Content Box */}
              <div className="h-80 rounded-2xl bg-[#141416] border border-white/10 overflow-hidden shadow-inner">
                {activeTab === 'chat' && (
                  <LiveChat
                    messages={chatMessages}
                    currentMember={currentMember}
                    currentSong={currentSong}
                    onSendMessage={handleSendMessage}
                    onSendReaction={handleReaction}
                    onQueueSong={handleQueueSong}
                    onBackToMusic={() => {}}
                  />
                )}
                {activeTab === 'queue' && renderQueueList()}
                {activeTab === 'members' && (
                  <MembersList
                    members={members}
                    currentSong={currentSong}
                    onInvite={() => showToast('Invite link copied!')}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Desktop Unified 3-in-1 Sidebar (Chat / Queue / Members) ── */}
        <div className="hidden md:flex w-80 lg:w-92 xl:w-96 shrink-0 h-full border-l border-white/10 flex-col bg-[#141416] overflow-hidden">
          {/* Segmented Sidebar Tabs Header */}
          <div className="flex items-center p-1.5 bg-[#161619] border-b border-white/10 gap-1 shrink-0">
            <button
              onClick={() => switchTab('chat')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-[#26262B] text-white shadow-sm'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Chat</span>
              {unreadChatCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#FF0000] text-white text-[9px] font-bold">
                  {unreadChatCount}
                </span>
              )}
            </button>
            <button
              onClick={() => switchTab('queue')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'queue'
                  ? 'bg-[#26262B] text-white shadow-sm'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>Queue ({playback.queue.length})</span>
            </button>
            <button
              onClick={() => switchTab('members')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'members'
                  ? 'bg-[#26262B] text-white shadow-sm'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Members ({members.length})</span>
            </button>
          </div>

          {/* Sidebar Body */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' && (
              <LiveChat
                messages={chatMessages}
                currentMember={currentMember}
                currentSong={currentSong}
                onSendMessage={handleSendMessage}
                onSendReaction={handleReaction}
                onQueueSong={handleQueueSong}
                onBackToMusic={() => {}}
              />
            )}
            {activeTab === 'queue' && renderQueueList()}
            {activeTab === 'members' && (
              <MembersList
                members={members}
                currentSong={currentSong}
                onInvite={() => showToast('Invite link copied to clipboard!')}
              />
            )}
          </div>
        </div>
      </div>

      {/* Add Music to Room Modal */}
      <AddMusicToRoomModal
        isOpen={isAddMusicOpen}
        onClose={() => setIsAddMusicOpen(false)}
        room={room}
        onQueueSong={handleQueueSong}
        onPlayNow={handlePlayNow}
        isHostOrDj={isHostOrDJ}
      />
    </div>
  );
};
