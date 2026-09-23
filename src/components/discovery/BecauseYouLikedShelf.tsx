import React, { useState } from 'react';
import { Song } from '../../types';
import { useStore } from '../../store/useStore';
import { audioManager } from '../../services/audio/AudioManager';
import { radioEngine } from '../../services/audio/RadioEngine';
import { ArtworkImage } from '../../utils/artwork';
import {
  Heart,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Sparkles,
  Music,
  Check
} from 'lucide-react';

interface BecauseYouLikedShelfProps {
  onNavigate?: (path: string) => void;
}

export const BecauseYouLikedShelf: React.FC<BecauseYouLikedShelfProps> = ({ onNavigate }) => {
  const [state, store] = useStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const likedRec = state.lastLikedRecommendation;
  if (!likedRec || !likedRec.recommendations || likedRec.recommendations.length === 0) {
    return null;
  }

  const { seedSong, recommendations } = likedRec;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handlePlayAll = () => {
    audioManager.playSong(recommendations[0], recommendations);
    showToast(`Playing recommendations for "${seedSong.title}"`);
  };

  const handleStartRadio = () => {
    radioEngine.startRadio(seedSong);
    showToast(`Started continuous Radio from "${seedSong.title}"`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await store.refreshLikedRecommendations(seedSong);
    setIsRefreshing(false);
    showToast(`Refreshed recommendations for "${seedSong.title}"`);
  };

  const handlePlaySingle = (song: Song) => {
    audioManager.playSong(song, recommendations);
    showToast(`Playing "${song.title}"`);
  };

  const handleAddToQueue = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    audioManager.addToQueue(song);
    showToast(`Added "${song.title}" to queue`);
  };

  const handleToggleLike = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    store.toggleLikeSong(song.id, song);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '3:45';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <section className="space-y-3 relative select-none">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#212121] border border-[#272727] text-white text-xs font-semibold shadow-2xl animate-fade-in">
          <Check className="w-4 h-4 text-[#FF0000]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Shelf */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-red-950/30 via-[#1C1C1E] to-[#1C1C1E] p-4 rounded-2xl border border-red-500/20">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow shrink-0 border border-white/10">
            <ArtworkImage song={seedSong} alt={seedSong.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Because You Liked
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 font-mono font-bold">
                AI Tuned
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight line-clamp-1">
              "{seedSong.title}"
              <span className="text-xs font-normal text-[#AAAAAA] ml-1.5 hidden sm:inline">
                by {seedSong.artist}
              </span>
            </h2>
          </div>
        </div>

        {/* Shelf Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePlayAll}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition shadow-md shadow-red-900/30 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play All</span>
          </button>
          <button
            onClick={handleStartRadio}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#272727] hover:bg-[#333333] border border-[#383838] text-white text-xs font-semibold transition cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-rose-400" />
            <span>Start Radio</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh recommendations"
            className="p-1.5 rounded-xl bg-[#272727] hover:bg-[#333333] text-[#AAAAAA] hover:text-white transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-rose-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Recommendations Carousel / Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {recommendations.slice(0, 8).map((song) => {
          const isLiked = state.likedSongIds.includes(song.id);
          return (
            <div
              key={`rec-${song.id}`}
              onClick={() => handlePlaySingle(song)}
              className="group cursor-pointer rounded-2xl bg-[#1C1C1E] hover:bg-[#252528] border border-[#2A2A2E] hover:border-red-500/40 p-2.5 transition duration-200 flex flex-col justify-between shadow-sm relative overflow-hidden"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-neutral-900 shadow">
                <ArtworkImage
                  song={song}
                  alt={song.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-lg hover:scale-105 transition">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                  <button
                    onClick={(e) => handleAddToQueue(e, song)}
                    title="Add to queue"
                    className="w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center shadow transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {song.duration > 0 && (
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-[10px] text-white font-mono">
                    {formatDuration(song.duration)}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-white truncate group-hover:text-rose-400 transition" title={song.title}>
                  {song.title}
                </h3>
                <div className="flex items-center justify-between text-[11px] text-[#AAAAAA]">
                  <span className="truncate pr-1">{song.artist}</span>
                  <button
                    onClick={(e) => handleToggleLike(e, song)}
                    className="hover:scale-110 transition shrink-0"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        isLiked ? 'text-rose-500 fill-rose-500' : 'text-[#717171] hover:text-white'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
