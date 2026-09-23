import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { audioManager, PlaybackState } from '../../services/audio/AudioManager';
import { Play, Heart, X, RotateCcw } from 'lucide-react';
import { ArtworkImage } from '../../utils/artwork';

export const ResumeSessionPrompt: React.FC = () => {
  const [state, store] = useStore();
  const [playback, setPlayback] = useState<PlaybackState>(audioManager.getState());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    return audioManager.subscribe((newPlayback) => {
      setPlayback(newPlayback);
    });
  }, []);

  // If music is already playing, or dismissed, or no session track exists and no likes exist, don't show
  if (playback.isPlaying || dismissed) {
    return null;
  }

  const currentSong = playback.currentSong;
  const likedCount = state.likedSongs.length || state.likedSongIds.length;
  const hasRestoredTrack = !!currentSong;

  if (!hasRestoredTrack && likedCount === 0) {
    return null;
  }

  const handleResumeLast = () => {
    audioManager.play();
    setDismissed(true);
  };

  const handleResumeLiked = () => {
    const success = store.resumeFromLikedSongs();
    if (success) {
      setDismissed(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-[calc(138px+env(safe-area-inset-bottom,0px))] md:bottom-28 right-3 md:right-8 z-40 max-w-sm w-[calc(100%-24px)] md:w-auto animate-fade-in select-none">
      <div className="bg-[#141418]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-3.5 shadow-2xl text-white flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {currentSong ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-neutral-900 border border-white/10 shadow-md">
                <ArtworkImage song={currentSong} alt={currentSong.title} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                <Heart className="w-5 h-5 fill-current" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider">
                  {currentSong ? 'Paused Session' : 'Liked Collection'}
                </span>
                {currentSong && playback.currentTime > 0 && (
                  <span className="text-[10px] text-white/50 font-mono">
                    • {formatTime(playback.currentTime)}
                  </span>
                )}
              </div>
              <h4 className="text-xs font-bold text-white truncate">
                {currentSong ? currentSong.title : `${likedCount} Liked Songs Ready`}
              </h4>
              <p className="text-[10px] text-white/60 truncate">
                {currentSong ? currentSong.artist : 'Pick up right where you left off'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
          {hasRestoredTrack && (
            <button
              onClick={handleResumeLast}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition shadow-md shadow-red-950/40 cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Resume Playback</span>
            </button>
          )}

          {likedCount > 0 && (
            <button
              onClick={handleResumeLiked}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-white text-xs font-semibold transition cursor-pointer ${
                !hasRestoredTrack ? 'flex-1' : ''
              }`}
              title="Play your liked songs collection"
            >
              <Heart className="w-3 h-3 text-red-400 fill-current" />
              <span>Resume Liked ({likedCount})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
