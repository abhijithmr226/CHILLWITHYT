import React, { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { audioManager } from '../../services/audio/AudioManager';
import { radioEngine } from '../../services/audio/RadioEngine';
import { Song } from '../../types';
import { ArtworkImage } from '../../utils/artwork';
import {
  analyzeUserStyle,
  QUICK_STYLE_VIBES,
  CURATED_OUR_FAVOURITES,
  QuickStyleVibe,
} from '../../utils/styleProfiler';
import {
  Sparkles,
  Play,
  Plus,
  Heart,
  Radio,
  Clock,
  Search,
  Check,
  Wand2,
  SlidersHorizontal,
  X,
  Compass,
  Zap,
  ArrowRight,
} from 'lucide-react';

interface DiscoverFavoritesAndStyleProps {
  onSearchSelect?: (query: string) => void;
  onNavigate?: (path: string) => void;
  compact?: boolean;
}

export const DiscoverFavoritesAndStyle: React.FC<DiscoverFavoritesAndStyleProps> = ({
  onSearchSelect,
  onNavigate,
  compact = false,
}) => {
  const [state, store] = useStore();
  const [addedQueueId, setAddedQueueId] = useState<string | null>(null);
  const [appliedVibeId, setAppliedVibeId] = useState<string | null>(null);

  // Compute dynamic user style profile
  const styleProfile = useMemo(() => {
    return analyzeUserStyle(
      state.searchHistory,
      state.musicPreferences,
      state.history,
      state.likedSongs
    );
  }, [state.searchHistory, state.musicPreferences, state.history, state.likedSongs]);

  const handlePlaySong = (song: Song, playlist: Song[]) => {
    audioManager.playSong(song, playlist);
  };

  const handleAddToQueue = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    audioManager.addToQueue(song);
    setAddedQueueId(song.id);
    setTimeout(() => setAddedQueueId(null), 1800);
  };

  const handleApplyStyleVibe = (vibe: QuickStyleVibe) => {
    store.applyQuickStyle(vibe.vibeTag);
    setAppliedVibeId(vibe.id);
    setTimeout(() => setAppliedVibeId(null), 2500);

    // If user has search input handler, seed suggestions or search
    if (onSearchSelect) {
      onSearchSelect(vibe.searchSeed);
    }
  };

  const handleStartStyleRadio = () => {
    if (styleProfile.recommendedTracks.length > 0) {
      radioEngine.startRadio(styleProfile.recommendedTracks[0]);
    } else if (CURATED_OUR_FAVOURITES.length > 0) {
      radioEngine.startRadio(CURATED_OUR_FAVOURITES[0].song);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* ── 1. STYLE PERSONA & MAKE UP YOUR STYLE BANNER ────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1A1E] via-[#121215] to-[#17171C] border border-[#2B2B32] p-5 sm:p-7 shadow-2xl">
        {/* Subtle accent backdrop glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] text-white text-xs font-semibold border border-white/10 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{styleProfile.vibeBadge}</span>
                </span>
                <span className="text-[11px] font-mono text-[#888888]">
                  {state.searchHistory.length > 0
                    ? `Synthesized from ${state.searchHistory.length} searches & listening vibe`
                    : 'Personalized Music Style Studio'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{styleProfile.personaName}</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#AAAAAA] mt-1 max-w-2xl leading-relaxed">
                {styleProfile.personaTagline}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {(state.likedSongs.length > 0 || state.likedSongIds.length > 0) && (
                <button
                  onClick={() => store.resumeFromLikedSongs()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-white text-xs font-semibold transition cursor-pointer"
                  title="Resume playback from your liked songs collection"
                >
                  <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
                  <span>Resume from Liked ({state.likedSongs.length || state.likedSongIds.length})</span>
                </button>
              )}

              <button
                onClick={handleStartStyleRadio}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition shadow-lg shadow-red-900/40 cursor-pointer"
                title="Launch infinite radio matched to your style"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Play Style Radio</span>
              </button>

              <button
                onClick={() => store.openTasteOnboarding()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-white text-xs font-semibold transition cursor-pointer"
                title="Open comprehensive 3-step taste tuner"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span>Fine-Tune Style</span>
              </button>
            </div>
          </div>

          {/* ── Make Up Your Style: Quick Vibe Selector ── */}
          <div className="pt-2 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#888888]">
              <span className="font-semibold text-white/90 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-red-500" />
                <span>Make Up Your Style (Tap to Switch Vibes):</span>
              </span>
              <span className="text-[11px] hidden sm:inline">Instant 1-tap style makeup</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar overscroll-x-contain touch-pan-x">
              {QUICK_STYLE_VIBES.map((vibe) => {
                const isSelected = appliedVibeId === vibe.id || state.musicPreferences?.genres?.includes(vibe.vibeTag);
                return (
                  <button
                    key={vibe.id}
                    onClick={() => handleApplyStyleVibe(vibe)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold transition shrink-0 border cursor-pointer ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-md'
                        : 'bg-[#18181B] hover:bg-[#232328] text-white/80 hover:text-white border-[#2E2E35] hover:border-white/30'
                    }`}
                  >
                    <span>{vibe.icon}</span>
                    <span>{vibe.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Recent Searches & Search-Driven Inspiration ── */}
          {state.searchHistory.length > 0 && (
            <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-semibold text-[#777777] flex items-center gap-1">
                <Clock className="w-3 h-3 text-red-400" />
                <span>Recent Searches:</span>
              </span>
              {state.searchHistory.slice(0, 6).map((term) => (
                <div
                  key={term}
                  className="group flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/5 hover:border-white/20 text-[#CCCCCC] hover:text-white transition text-[11px]"
                >
                  <button
                    onClick={() => onSearchSelect?.(term)}
                    className="cursor-pointer hover:underline"
                    title={`Search for "${term}"`}
                  >
                    {term}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      store.removeSearchItem(term);
                    }}
                    className="opacity-40 group-hover:opacity-100 hover:text-red-400 p-0.5 rounded cursor-pointer"
                    title="Remove from history"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => store.clearSearchHistory()}
                className="text-[10px] text-[#666666] hover:text-[#999999] cursor-pointer ml-auto"
              >
                Clear Searches
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. DISCOVER OUR FAVOURITES (HAND-PICKED AUDIO GEMS) ─────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-red-500" />
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Discover Our Favourites
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/10">
              Curated Gems
            </span>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('/discover')}
              className="text-xs text-[#AAAAAA] hover:text-white font-medium flex items-center gap-1 cursor-pointer transition"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Responsive Grid on Desktop; Smooth Carousel on Mobile */}
        <div className="flex sm:grid overflow-x-auto sm:overflow-x-visible sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pb-2 sm:pb-0 overscroll-x-contain touch-pan-x no-scrollbar">
          {CURATED_OUR_FAVOURITES.map(({ song, curatorNote, badge }) => {
            const isLiked = state.likedSongIds.includes(song.id);
            const isJustQueued = addedQueueId === song.id;
            const favouriteList = CURATED_OUR_FAVOURITES.map((f) => f.song);

            return (
              <div
                key={`fav-${song.id}`}
                className="group cursor-pointer rounded-2xl bg-[#161619] hover:bg-[#202024] border border-[#26262B] hover:border-[#3D3D45] p-2.5 transition duration-200 flex flex-col justify-between shadow-sm relative overflow-hidden min-w-[155px] sm:min-w-0 shrink-0"
              >
                {/* 16:9 Thumbnail Box */}
                <div
                  onClick={() => handlePlaySong(song, favouriteList)}
                  className="relative aspect-video rounded-xl overflow-hidden mb-2 bg-neutral-900 border border-white/10 shadow-sm"
                >
                  <ArtworkImage
                    song={song}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-black/85 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-amber-400 border border-white/10">
                    {badge}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <div className="w-8 h-8 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-lg">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="min-w-0" onClick={() => handlePlaySong(song, favouriteList)}>
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-red-400 transition">
                    {song.title}
                  </h4>
                  <p className="text-[11px] text-[#AAAAAA] truncate mt-0.5">{song.artist}</p>
                  <p className="text-[10px] text-[#6E6E77] line-clamp-1 mt-1 italic">
                    {curatorNote}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono text-[#888888]">
                    {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        store.toggleLikeSong(song.id, song);
                      }}
                      className={`p-1 rounded transition cursor-pointer ${
                        isLiked ? 'text-red-500' : 'text-[#888888] hover:text-white'
                      }`}
                      title="Like"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => handleAddToQueue(e, song)}
                      className="p-1 rounded-lg text-[#AAAAAA] hover:text-white hover:bg-white/10 transition cursor-pointer"
                      title="Add to Queue"
                    >
                      {isJustQueued ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. SEARCH INSPIRATION QUICK SHORTCUTS ───────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#141416] border border-[#25252A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-white">Suggested for Your Style</h5>
            <p className="text-[11px] text-[#888888]">
              Ready-to-search prompts based on your music DNA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {styleProfile.suggestedQueries.map((q) => (
            <button
              key={q}
              onClick={() => onSearchSelect?.(q)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1F1F24] hover:bg-[#282830] border border-[#2E2E38] hover:border-white/20 text-[#CCCCCC] hover:text-white text-xs font-medium transition shrink-0 cursor-pointer"
            >
              <Search className="w-3 h-3 text-[#FF4D4D]" />
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
