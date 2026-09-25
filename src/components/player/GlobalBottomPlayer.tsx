import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { audioManager, PlaybackState } from '../../services/audio/AudioManager';
import { radioEngine, RadioState } from '../../services/audio/RadioEngine';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  ListMusic,
  Maximize2,
  Radio as RadioIcon,
  Users,
  Quote,
} from 'lucide-react';
import { ArtworkImage } from '../../utils/artwork';

export const GlobalBottomPlayer: React.FC = () => {
  const [state, store] = useStore();
  const [playback, setPlayback] = useState<PlaybackState>(audioManager.getState());
  const [progress, setProgress] = useState(() => ({
    currentTime: audioManager.getState().currentTime,
    duration: audioManager.getState().duration,
  }));
  const [radio, setRadio] = useState<RadioState>(radioEngine.getState());

  useEffect(() => {
    const unsubAudio = audioManager.subscribe(setPlayback);
    const unsubProgress = audioManager.subscribeProgress(setProgress);
    const unsubRadio = radioEngine.subscribe(setRadio);
    return () => {
      unsubAudio();
      unsubProgress();
      unsubRadio();
    };
  }, []);

  const { currentSong, isPlaying, duration, volume, isMuted, isShuffled, repeatMode } = playback;

  if (!currentSong) return null;

  const isLiked = state.likedSongIds.includes(currentSong.id);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    audioManager.seek(target);
  };

  const handleRadioToggle = () => {
    radioEngine.toggleRadio(currentSong);
  };

  const totalDuration = progress.duration || duration || 100;
  const currentPosition = progress.currentTime || 0;
  const progressPercent = totalDuration > 0 ? (currentPosition / totalDuration) * 100 : 0;

  return (
    <div className="hidden md:block fixed bottom-0 left-0 right-0 z-40 bg-[#0E0E12] border-t border-white/[0.07] select-none h-20 transition-all">
      <div className="max-w-[1440px] h-full mx-auto flex items-center justify-between gap-4 px-4 lg:px-6">
        {/* LEFT: Album artwork 52x52, song title, artist, like */}
        <div className="flex items-center gap-3 w-1/4 min-w-[200px] max-w-[280px]">
          <div
            onClick={() => store.setState({ isFullScreenPlayerOpen: true })}
            className="relative cursor-pointer group shrink-0 w-[52px] h-[52px] rounded-lg overflow-hidden ring-1 ring-white/10 shadow-md bg-black"
          >
            <ArtworkImage
              song={currentSong}
              alt={currentSong.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <Maximize2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h4
              onClick={() => store.setState({ isFullScreenPlayerOpen: true })}
              className="text-xs font-bold text-[#F5F5F5] truncate hover:underline cursor-pointer leading-snug"
              title={currentSong.title}
            >
              {currentSong.title}
            </h4>
            <p
              onClick={(e) => {
                e.stopPropagation();
                window.history.pushState({}, '', `/artist/${encodeURIComponent(currentSong.artist)}`);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="text-[11px] text-[#A1A1A1] hover:text-[#FF0000] hover:underline cursor-pointer truncate mt-0.5"
              title={currentSong.artist}
            >
              {currentSong.artist}
            </p>
            {radio.isRadioMode && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#FF0000] uppercase tracking-wider mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF0000] animate-pulse" />
                Radio Active
              </span>
            )}
          </div>

          <button
            onClick={() => store.toggleLikeSong(currentSong.id, currentSong)}
            className={`p-1.5 rounded-lg transition shrink-0 cursor-pointer ${
              isLiked ? 'text-[#FF0000] hover:text-[#E50914]' : 'text-[#666666] hover:text-white'
            }`}
            title={isLiked ? 'Unlike song' : 'Like song'}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* CENTER: Controls & Scrubber */}
        <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl">
          <div className="flex items-center gap-5">
            <button
              onClick={() => audioManager.toggleShuffle()}
              className={`p-1 rounded transition cursor-pointer ${
                isShuffled ? 'text-[#FF0000]' : 'text-[#777777] hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => audioManager.previous()}
              className="p-1 text-[#A1A1A1] hover:text-white transition cursor-pointer"
              title="Previous"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={() => audioManager.togglePlayPause()}
              className="w-9 h-9 rounded-full bg-[#FF0000] hover:bg-[#E50914] text-white flex items-center justify-center shadow-[0_0_12px_rgba(255,0,0,0.35)] transition hover:scale-105 active:scale-95 cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={() => audioManager.next()}
              className="p-1 text-[#A1A1A1] hover:text-white transition cursor-pointer"
              title="Next"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={() => audioManager.setRepeatMode()}
              className={`p-1 rounded transition cursor-pointer ${
                repeatMode !== 'off' ? 'text-[#FF0000]' : 'text-[#777777] hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Time Scrubber */}
          <div className="w-full flex items-center gap-2.5">
            <span className="text-[10px] font-mono text-[#777777] w-9 text-right tabular-nums">
              {formatTime(currentPosition)}
            </span>
            <input
              type="range"
              min="0"
              max={totalDuration}
              value={currentPosition}
              onChange={handleProgressChange}
              className="flex-1 h-1 bg-[#222228] rounded-full appearance-none cursor-pointer accent-[#FF0000]"
              style={{
                '--range-progress': `${progressPercent}%`,
              } as React.CSSProperties}
            />
            <span className="text-[10px] font-mono text-[#777777] w-9 text-left tabular-nums">
              {formatTime(totalDuration)}
            </span>
          </div>
        </div>

        {/* RIGHT: Volume, Queue, Lyrics, Room, Fullscreen */}
        <div className="flex items-center justify-end gap-2.5 w-1/4 min-w-[200px] max-w-[280px]">
          {/* Radio toggle */}
          <button
            onClick={handleRadioToggle}
            className={`p-1.5 rounded-lg transition text-xs font-medium cursor-pointer flex items-center gap-1 ${
              radio.isRadioMode
                ? 'text-[#FF0000] bg-[#FF0000]/10 border border-[#FF0000]/30'
                : 'text-[#888888] hover:text-white'
            }`}
            title={radio.isRadioMode ? 'Stop Radio' : 'Start Radio'}
          >
            <RadioIcon className="w-3.5 h-3.5" />
          </button>

          {/* Lyrics quick toggle */}
          <button
            onClick={() => store.setState({ isFullScreenPlayerOpen: true })}
            className="p-1.5 rounded-lg text-[#888888] hover:text-white transition cursor-pointer"
            title="Lyrics & Visualizer"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          {/* Listening Room shortcut */}
          <button
            onClick={() => store.setState({ isCreateRoomModalOpen: true })}
            className="p-1.5 rounded-lg text-[#888888] hover:text-[#FF0000] transition cursor-pointer"
            title="Create Listening Room with current song"
          >
            <Users className="w-3.5 h-3.5" />
          </button>

          {/* Queue Drawer toggle */}
          <button
            onClick={() => store.setState({ isQueueDrawerOpen: !state.isQueueDrawerOpen })}
            className={`relative p-1.5 rounded-lg transition cursor-pointer ${
              state.isQueueDrawerOpen
                ? 'text-[#FF0000] bg-[#FF0000]/10'
                : 'text-[#888888] hover:text-white'
            }`}
            title="Queue"
          >
            <ListMusic className="w-3.5 h-3.5" />
            {playback.queue.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF0000] text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center shadow">
                {playback.queue.length}
              </span>
            )}
          </button>

          {/* Volume slider */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-white/[0.07]">
            <button
              onClick={() => audioManager.toggleMute()}
              className="text-[#888888] hover:text-white transition cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-red-500" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : (volume ?? 1)}
              onChange={(e) => audioManager.setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-[#222228] rounded-full appearance-none cursor-pointer accent-[#FF0000]"
              style={{
                '--range-progress': `${(isMuted ? 0 : (volume ?? 1)) * 100}%`,
              } as React.CSSProperties}
            />
          </div>

          {/* Fullscreen player */}
          <button
            onClick={() => store.setState({ isFullScreenPlayerOpen: true })}
            className="p-1.5 rounded-lg text-[#888888] hover:text-white transition cursor-pointer"
            title="Open Fullscreen Player"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
