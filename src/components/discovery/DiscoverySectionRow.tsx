/**
 * DiscoverySectionRow
 * 
 * Reusable horizontal scrolling song row for a discovery section.
 * Shows skeleton loading state, discovery labels, and live refresh indicator.
 */
import React from 'react';
import { DiscoverySection, DiscoveredSong } from '../../services/audio/DiscoveryEngine';
import { audioManager } from '../../services/audio/AudioManager';
import { useStore } from '../../store/useStore';
import { radioEngine } from '../../services/audio/RadioEngine';
import { Play, Heart, Plus, Check, Loader2, RefreshCw, TrendingUp, Radio, Flame, Zap, Globe, Sparkles, Film, Disc3, Waves, Compass, Mic, Music } from 'lucide-react';

function getSectionIcon(id: string) {
  switch (id) {
    case 'quick_picks':
      return <Zap className="w-4 h-4 text-amber-400" />;
    case 'trending_india':
      return <TrendingUp className="w-4 h-4 text-[#FF0000]" />;
    case 'trending_global':
      return <Globe className="w-4 h-4 text-blue-400" />;
    case 'rising_fast':
      return <Flame className="w-4 h-4 text-orange-400" />;
    case 'new_releases':
      return <Sparkles className="w-4 h-4 text-emerald-400" />;
    case 'regional_hindi':
      return <Film className="w-4 h-4 text-rose-400" />;
    case 'regional_malayalam':
      return <Music className="w-4 h-4 text-teal-400" />;
    case 'regional_tamil':
      return <Zap className="w-4 h-4 text-amber-400" />;
    case 'regional_telugu':
      return <Flame className="w-4 h-4 text-red-400" />;
    case 'regional_kannada':
      return <Disc3 className="w-4 h-4 text-yellow-400" />;
    case 'regional_punjabi':
      return <Radio className="w-4 h-4 text-purple-400" />;
    case 'regional_bengali':
      return <Waves className="w-4 h-4 text-indigo-400" />;
    case 'fresh_discoveries':
      return <Compass className="w-4 h-4 text-pink-400" />;
    case 'artist_spotlight':
      return <Mic className="w-4 h-4 text-violet-400" />;
    default:
      return <Music className="w-4 h-4 text-[#FF0000]" />;
  }
}

// ── Label color map ────────────────────────────────────────────────────────

const LABEL_STYLES: Record<string, string> = {
  'Trending':           'bg-[#FF0000]/15 text-[#FF4D4D] border-[#FF0000]/30',
  'Rising fast':        'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'New today':          'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'New this week':      'bg-teal-500/15 text-teal-400 border-teal-500/30',
  'Popular in India':   'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'Global hit':         'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Fresh discovery':    'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'Evergreen':          'bg-neutral-500/15 text-neutral-400 border-neutral-500/30',
  'Artist spotlight':   'bg-pink-500/15 text-pink-400 border-pink-500/30',
};

function getLabelStyle(label: string): string {
  return LABEL_STYLES[label] ?? 'bg-[#272727] text-[#AAAAAA] border-[#383838]';
}

// ── Skeleton card ─────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <div className="shrink-0 w-36 sm:w-40 animate-pulse">
    <div className="aspect-square rounded-xl bg-[#272727] mb-2" />
    <div className="h-2.5 bg-[#272727] rounded w-4/5 mb-1.5" />
    <div className="h-2 bg-[#272727] rounded w-3/5" />
  </div>
);

// ── Song card ─────────────────────────────────────────────────────────────

interface SongCardProps {
  song: DiscoveredSong;
  queue: DiscoveredSong[];
  rank?: number;
  onNavigate?: (path: string) => void;
}

import { ArtworkImage } from '../../utils/artwork';

const SongCard: React.FC<SongCardProps> = ({ song, queue, rank }) => {
  const [, store] = useStore();
  const [state] = useStore();
  const [isQueued, setIsQueued] = React.useState(false);
  const isLiked = state.likedSongIds.includes(song.id);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handlePlay = () => {
    audioManager.playSong(song, queue);
    radioEngine.startRadio(song);
  };

  const handleQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    audioManager.addToQueue(song);
    setIsQueued(true);
    setTimeout(() => setIsQueued(false), 1500);
  };

  return (
    <div className="shrink-0 w-36 sm:w-40 group cursor-pointer">
      <div
        onClick={handlePlay}
        className="relative aspect-square rounded-xl overflow-hidden bg-[#1A1A1A] mb-2 shadow"
      >
        <ArtworkImage
          song={song}
          alt={song.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />

        {/* Rank badge */}
        {rank !== undefined && (
          <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur px-1.5 py-0.5 rounded text-[10px] font-black font-mono text-white border border-white/10">
            #{rank + 1}
          </div>
        )}

        {/* Discovery label */}
        <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide border ${getLabelStyle(song.meta.label)}`}>
          {song.meta.label}
        </div>

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
          <div className="w-10 h-10 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-xl">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1" onClick={handlePlay}>
          <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FF4D4D] transition leading-tight">
            {song.title}
          </h4>
          <p className="text-[10px] text-[#AAAAAA] truncate mt-0.5">{song.artist}</p>
          <p className="text-[9px] font-mono text-[#555] mt-0.5">{fmt(song.duration)}</p>
        </div>

        <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); store.toggleLikeSong(song.id); }}
            className={`p-1 rounded transition ${isLiked ? 'text-[#FF0000]' : 'text-[#555] hover:text-white'}`}
            title="Like"
          >
            <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleQueue}
            className={`p-1 rounded transition ${isQueued ? 'text-emerald-400 scale-110' : 'text-[#555] hover:text-white'}`}
            title={isQueued ? "Added to queue!" : "Add to queue"}
          >
            {isQueued ? <Check className="w-3 h-3 text-emerald-400" /> : <Plus className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Discovery Section Row ─────────────────────────────────────────────────

interface DiscoverySectionRowProps {
  section: DiscoverySection;
  onRefresh?: () => void;
  onNavigate?: (path: string) => void;
  showRanks?: boolean;
}

export const DiscoverySectionRow: React.FC<DiscoverySectionRowProps> = ({
  section, onRefresh, onNavigate, showRanks = false,
}) => {
  const handlePlayAll = () => {
    if (section.songs.length === 0) return;
    audioManager.playSong(section.songs[0], section.songs);
    radioEngine.startRadio(section.songs[0]);
  };

  const timeAgo = (ms: number): string => {
    const mins = Math.round((Date.now() - ms) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.round(mins / 60)}h ago`;
  };

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-[#212121] border border-[#2F2F2F] shrink-0 flex items-center justify-center shadow-sm">
            {getSectionIcon(section.id)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white truncate">{section.title}</h2>
              {section.isLoading && (
                <Loader2 className="w-3.5 h-3.5 text-[#FF0000] animate-spin shrink-0" />
              )}
              {!section.isLoading && section.songs.length > 0 && (
                <span className="flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#717171] truncate">
              {section.subtitle}
              {section.lastUpdated > 0 && (
                <span className="ml-2 text-[#555]">· updated {timeAgo(section.lastUpdated)}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {section.songs.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF0000] hover:bg-[#CC0000] text-white text-[10px] font-bold transition shadow"
            >
              <Radio className="w-3 h-3" />
              <span className="hidden sm:inline">Play Radio</span>
            </button>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={section.isLoading}
              className="p-1.5 rounded-lg text-[#555] hover:text-white hover:bg-[#272727] transition disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${section.isLoading ? 'animate-spin text-[#FF0000]' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Songs row */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {section.isLoading && section.songs.length === 0 ? (
          // Skeleton state
          Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)
        ) : section.songs.length === 0 ? (
          <div className="flex items-center gap-2 py-8 px-4 text-[#555] text-xs">
            <TrendingUp className="w-4 h-4" />
            <span>Loading fresh content…</span>
          </div>
        ) : (
          section.songs.map((song, i) => (
            <SongCard
              key={song.id}
              song={song}
              queue={section.songs}
              rank={showRanks ? i : undefined}
              onNavigate={onNavigate}
            />
          ))
        )}
      </div>
    </section>
  );
};
