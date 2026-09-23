import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { audioManager, PlaybackState } from '../../services/audio/AudioManager';
import { Play, Pause, SkipForward, Music } from 'lucide-react';

import { ArtworkImage } from '../../utils/artwork';

export const MobileMiniPlayer: React.FC = () => {
  const [, store] = useStore();
  const [playback, setPlayback] = useState<PlaybackState>(audioManager.getState());

  useEffect(() => {
    return audioManager.subscribe((newPlayback) => {
      setPlayback(newPlayback);
    });
  }, []);

  const { currentSong, isPlaying, currentTime, duration } = playback;

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="md:hidden fixed bottom-[calc(68px+env(safe-area-inset-bottom,0px))] left-2.5 right-2.5 z-[60] bg-[#1A1A1E]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.7)] overflow-hidden animate-slide-up select-none touch-manipulation">
      {/* Mini Progress Bar */}
      <div className="w-full bg-white/10 h-[2.5px]">
        <div
          className="bg-gradient-to-r from-red-600 to-amber-500 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between p-2">
        {/* Click to open full-screen */}
        <div
          onClick={() => store.setState({ isFullScreenPlayerOpen: true })}
          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer active:scale-[0.99] active:opacity-90 transition-all"
        >
          <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-md ring-1 ring-white/15 shrink-0">
            <ArtworkImage
              song={currentSong}
              alt={currentSong.title}
              className="w-full h-full object-cover"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-[#FF0000] animate-ping" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
              <span>{currentSong.title}</span>
              {isPlaying && (
                <span className="inline-flex items-end gap-0.5 h-2.5 shrink-0" aria-hidden="true">
                  <span className="w-0.5 bg-red-500 rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-2.5" />
                  <span className="w-0.5 bg-red-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite_0.2s] h-1.5" />
                  <span className="w-0.5 bg-amber-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.4s] h-2" />
                </span>
              )}
            </p>
            <p
              onClick={(e) => {
                e.stopPropagation();
                window.history.pushState({}, '', `/artist/${encodeURIComponent(currentSong.artist)}`);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="text-[10px] text-white/50 hover:text-[#FF4D4D] truncate mt-0.5 cursor-pointer font-medium"
            >
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Controls with 44px+ touch-friendly padding */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              audioManager.togglePlayPause();
            }}
            className="w-11 h-11 flex items-center justify-center active:scale-90 transition cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <span className="w-9 h-9 rounded-full bg-[#FF0000] hover:bg-[#E60000] text-white flex items-center justify-center shadow-lg shadow-red-900/40">
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              audioManager.next();
            }}
            className="w-11 h-11 flex items-center justify-center text-white/70 hover:text-white active:scale-90 transition cursor-pointer"
            title="Next Track"
            aria-label="Next Track"
          >
            <SkipForward className="w-4.5 h-4.5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
