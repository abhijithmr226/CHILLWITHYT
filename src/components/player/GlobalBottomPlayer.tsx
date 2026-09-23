import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { audioManager, PlaybackState } from '../../services/audio/AudioManager';
import { radioEngine, RadioState } from '../../services/audio/RadioEngine';
import { RadioHUD } from './RadioHUD';
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
  Sliders,
  Radio,
  Users
} from 'lucide-react';

import { ArtworkImage } from '../../utils/artwork';

export const GlobalBottomPlayer: React.FC = () => {
  const [state, store] = useStore();
  const [playback, setPlayback] = useState<PlaybackState>(audioManager.getState());
  const [radio, setRadio] = useState<RadioState>(radioEngine.getState());
  const [showResumeBanner, setShowResumeBanner] = useState(
    audioManager.hasRestoredSession()
  );

  useEffect(() => {
    const unsubAudio = audioManager.subscribe((s) => {
      setPlayback(s);
      // Hide banner once actual playback starts
      if (s.isPlaying) setShowResumeBanner(false);
    });
    const unsubRadio = radioEngine.subscribe(setRadio);
    return () => {
      unsubAudio();
      unsubRadio();
    };
  }, []);

  const { currentSong, isPlaying, currentTime, duration, volume, isMuted, isShuffled, repeatMode } = playback;

  if (!currentSong) return null;

  const isLiked = state.likedSongIds.includes(currentSong.id);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResume = () => {
    setShowResumeBanner(false);
    audioManager.play();
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = parseFloat(e.target.value);
    audioManager.seek(target);
  };

  const handleRadioToggle = () => {
    radioEngine.toggleRadio(currentSong);
  };

  return (
    <div className="hidden md:block fixed bottom-0 left-0 right-0 z-[60] bg-[#212121] border-t border-[#272727] select-none transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        {/* Left: Track Information */}
        <div className="flex items-center gap-3 w-1/4 min-w-[180px]">
          <div
            onClick={() => store.setState({ isFullScreenPlayerOpen: true })}
            className="relative cursor-pointer group shrink-0"
          >
            <ArtworkImage
              song={currentSong}
              alt={currentSong.title}
              className="w-12 h-12 rounded-lg object-cover ring-1 ring-[#272727]"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h4
              onClick={() => store.setState({ isFullScreenPlayerOpen: true })}
              className="text-xs sm:text-sm font-semibold text-white truncate hover:underline cursor-pointer"
            >
              {currentSong.title}
            </h4>
            <p
              onClick={(e) => {
                e.stopPropagation();
                window.history.pushState({}, '', `/artist/${encodeURIComponent(currentSong.artist)}`);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="text-[11px] sm:text-xs text-[#AAAAAA] hover:text-[#FF4D4D] hover:underline cursor-pointer truncate"
              title={`View ${currentSong.artist} page`}
            >
              {currentSong.artist}
            </p>
            {/* Radio HUD inline bar */}
            {radio.isRadioMode && (
              <RadioHUD variant="bar" className="mt-0.5" />
            )}
          </div>
          <button
            onClick={() => store.toggleLikeSong(currentSong.id, currentSong)}
            className={`p-1.5 rounded-lg transition ${
              isLiked ? 'text-[#FF0000] hover:text-[#CC0000]' : 'text-[#717171] hover:text-white'
            }`}
            title="Like song"
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center: Controls & Scrubber */}
        <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl">
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => audioManager.toggleShuffle()}
              className={`p-1 rounded transition ${
                isShuffled ? 'text-[#FF0000]' : 'text-[#717171] hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => audioManager.previous()}
              className="p-1 text-[#AAAAAA] hover:text-white transition"
              title="Previous"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={() => audioManager.togglePlayPause()}
              className="w-9 h-9 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white flex items-center justify-center shadow-[0_0_12px_rgba(255,0,0,0.35)] transition hover:scale-105 active:scale-95"
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
              className="p-1 text-[#AAAAAA] hover:text-white transition"
              title="Next"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={() => audioManager.setRepeatMode()}
              className={`p-1 rounded transition ${
                repeatMode !== 'off' ? 'text-[#FF0000]' : 'text-[#717171] hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Time Scrubber */}
          <div className="w-full flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#717171] w-8 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime || 0}
              onChange={handleProgressChange}
              className="flex-1"
            />
            <span className="text-[10px] font-mono text-[#717171] w-8 text-left">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Aux Tools */}
        <div className="hidden md:flex items-center justify-end gap-2.5 w-1/4 min-w-[180px]">
          {/* Radio Toggle */}
          <button
            onClick={handleRadioToggle}
            className={`p-1.5 rounded-lg transition flex items-center gap-1 text-[11px] font-semibold ${
              radio.isRadioMode
                ? 'text-[#FF0000] bg-[#FF0000]/10 border border-[#FF0000]/30'
                : 'text-[#717171] hover:text-white hover:bg-[#272727]'
            }`}
            title={radio.isRadioMode ? 'Stop Radio' : 'Start Radio — infinite nonstop music'}
          >
            <Radio className="w-4 h-4" />
            <span className="hidden lg:inline">{radio.isRadioMode ? 'Radio ON' : 'Radio'}</span>
          </button>

          <button
            onClick={() => store.setState({ isCreateRoomModalOpen: true })}
            className="p-1.5 rounded-lg text-[#AAAAAA] hover:text-white hover:bg-[#272727] transition flex items-center gap-1.5"
            title="Create Listening Room with current song"
          >
            <Users className="w-4 h-4 text-[#FF4D4D]" />
            <span className="hidden xl:inline text-xs font-semibold">Room</span>
          </button>

          <button
            onClick={() => store.setState({ isVisualizerOptionsOpen: true })}
            className="p-1.5 rounded-lg text-[#AAAAAA] hover:text-white hover:bg-[#272727] transition"
            title="Visualizer Options"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <button
            onClick={() => store.setState({ isQueueDrawerOpen: !state.isQueueDrawerOpen })}
            className={`relative p-1.5 rounded-lg transition ${
              state.isQueueDrawerOpen
                ? 'text-[#FF0000] bg-[#FF0000]/10'
                : 'text-[#AAAAAA] hover:text-white hover:bg-[#272727]'
            }`}
            title="Queue"
          >
            <ListMusic className="w-4 h-4" />
            {playback.queue.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF0000] text-white text-[9px] font-bold px-1 rounded-full min-w-[14px] text-center shadow">
                {playback.queue.length}
              </span>
            )}
          </button>

          {/* Volume */}
          <div className="flex items-center gap-2 pl-1 border-l border-[#272727]">
            <button
              onClick={() => audioManager.toggleMute()}
              className="text-[#AAAAAA] hover:text-white transition"
            >
              {isMuted || volume === 0 ? (
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
              value={isMuted ? 0 : (volume ?? 1)}
              onChange={(e) => audioManager.setVolume(parseFloat(e.target.value))}
              className="w-20"
            />
          </div>

          <button
            onClick={() => store.setState({ isFullScreenPlayerOpen: true })}
            className="p-1.5 rounded-lg text-[#AAAAAA] hover:text-white hover:bg-[#272727] transition"
            title="Full-screen player"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
