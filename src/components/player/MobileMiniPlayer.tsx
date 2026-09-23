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
    <div className="md:hidden fixed bottom-[calc(68px+env(safe-area-inset-bottom,0px))] left-2.5 right-2.5 z-30 bg-[#1E1E22]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.6)] overflow-hidden animate-slide-up select-none">
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
          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer active:opacity-80 transition"
        >
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md ring-1 ring-white/10 shrink-0">
            <ArtworkImage
              song={currentSong}
              alt={currentSong.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-xs font-bold text-white truncate">{currentSong.title}</p>
            <p
              onClick={(e) => {
                e.stopPropagation();
                window.history.pushState({}, '', `/artist/${encodeURIComponent(currentSong.artist)}`);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="text-[10px] text-white/50 hover:text-[#FF4D4D] truncate mt-0.5 cursor-pointer"
            >
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              audioManager.togglePlayPause();
            }}
            className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md active:scale-90 transition cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              audioManager.next();
            }}
            className="w-8 h-8 rounded-full text-white/60 hover:text-white flex items-center justify-center active:scale-90 transition cursor-pointer"
            title="Next Track"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
