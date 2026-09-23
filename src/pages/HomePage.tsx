import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { audioManager } from '../services/audio/AudioManager';
import { DEFAULT_TRACKS } from '../services/audio/DefaultMusicProvider';
import {
  YOUTUBE_REGIONS,
} from '../services/audio/YouTubeDataApi';
import { Song } from '../types';
import { 
  DAILY_MIX_CONFIGS, 
  DailyMixConfig, 
  SmartPlaylistEngine 
} from '../services/audio/SmartPlaylistEngine';
import { SmartPlaylistModal } from '../components/playlist/SmartPlaylistModal';
import { radioEngine, LANGUAGE_RADIO_STATIONS } from '../services/audio/RadioEngine';
import { ArtworkImage } from '../utils/artwork';
import { ResponsiveAdBanner } from '../components/ads/AdSlot';
import { DiscoverFavoritesAndStyle } from '../components/discovery/DiscoverFavoritesAndStyle';
import {
  Play,
  Flame,
  Radio,
  Heart,
  Plus,
  Loader2,
  Users,
  Sparkles,
  ArrowRight,
  Wand2,
  RefreshCw,
  TrendingUp,
  Headphones,
  Clock,
  Disc,
  Check
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [state, store] = useStore();
  const [selectedRegion, setSelectedRegion] = useState('IN');
  const [trendingTracks, setTrendingTracks] = useState<Song[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [chartLastUpdated, setChartLastUpdated] = useState<string>('Live');
  const [addedQueueSongId, setAddedQueueSongId] = useState<string | null>(null);

  // Daily Mix Generator Modal State
  const [isSmartModalOpen, setIsSmartModalOpen] = useState(false);
  const [playingMixId, setPlayingMixId] = useState<string | null>(null);

  // Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = state.currentUser?.displayName || 'Friend';

  // Fetch real YouTube trending music for the active region
  useEffect(() => {
    let cancelled = false;
    const fetchTrending = async () => {
      setLoadingTrending(true);
      const { tracks, lastUpdated } = await SmartPlaylistEngine.getTodayTopCharts(selectedRegion);
      if (!cancelled) {
        setTrendingTracks(tracks.length > 0 ? tracks : DEFAULT_TRACKS.slice(0, 12));
        setChartLastUpdated(lastUpdated);
        setLoadingTrending(false);
      }
    };
    fetchTrending();
    return () => {
      cancelled = true;
    };
  }, [selectedRegion]);

  const handlePlaySong = (song: Song, trackList?: Song[]) => {
    audioManager.playSong(song, trackList || trendingTracks);
  };

  const handleAddToQueue = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    audioManager.addToQueue(song);
    setAddedQueueSongId(song.id);
    setTimeout(() => setAddedQueueSongId(null), 1800);
  };

  const handlePlayDailyMix = async (mix: DailyMixConfig) => {
    try {
      setPlayingMixId(mix.id);
      const tracks = await SmartPlaylistEngine.getDailyMixTracks(mix.id);
      if (tracks.length > 0) {
        audioManager.playSong(tracks[0], tracks);
      }
    } finally {
      setPlayingMixId(null);
    }
  };

  const handlePlayAllTrending = () => {
    if (trendingTracks.length > 0) {
      audioManager.playSong(trendingTracks[0], trendingTracks);
    }
  };

  const handleRefreshTrending = async () => {
    setLoadingTrending(true);
    const { tracks, lastUpdated } = await SmartPlaylistEngine.getTodayTopCharts(selectedRegion);
    if (tracks.length > 0) {
      setTrendingTracks(tracks);
      setChartLastUpdated(lastUpdated);
    }
    setLoadingTrending(false);
  };

  // Continue listening source: recent history or curated starters
  const continueListeningTracks: Song[] = state.history && state.history.length > 0
    ? state.history.map((h) => h.song).slice(0, 8)
    : DEFAULT_TRACKS.slice(0, 6);


  const currentRegionMeta = YOUTUBE_REGIONS.find((r) => r.code === selectedRegion) || YOUTUBE_REGIONS[0];

  // Curated spotlight artists
  const spotlightArtists = [
    { name: 'Arijit Singh', genre: 'Soul • Acoustic Bollywood', initial: 'AS' },
    { name: 'Anirudh Ravichander', genre: 'Mass EDM • Film Score', initial: 'AR' },
    { name: 'Sushin Shyam', genre: 'Indie Electronic • Malayalam', initial: 'SS' },
    { name: 'The Weeknd', genre: 'Synthwave • R&B', initial: 'TW' },
    { name: 'Sid Sriram', genre: 'Carnatic Pop • Contemporary', initial: 'SR' },
    { name: 'Dua Lipa', genre: 'Dance Pop • Disco', initial: 'DL' },
  ];

  return (
    <div className="space-y-8 sm:space-y-10 p-4 sm:p-8 select-none max-w-7xl mx-auto">
      {/* ─── 1. HERO HEADER WITH DISCIPLINED ACTION HIERARCHY ────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-gradient-to-r from-[#202024] via-[#18181A] to-[#202024] p-5 sm:p-7 rounded-3xl border border-[#2D2D32] shadow-xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] text-white text-xs font-semibold border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Real-time YouTube streaming • High-fidelity audio</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {getGreeting()}, {displayName}
          </h1>
          <p className="text-xs sm:text-sm text-[#CCCCCC]">
            Explore trending charts, stream top hits, and generate custom mixes.
          </p>
        </div>

        {/* Primary and Secondary CTA hierarchy */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          {/* Primary Action */}
          <button
            onClick={handlePlayAllTrending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition shadow-lg shadow-red-900/40 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play Top Charts</span>
          </button>

          {/* Secondary Actions */}
          <button
            onClick={() => setIsSmartModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-white text-xs font-semibold transition cursor-pointer"
          >
            <Wand2 className="w-4 h-4 text-red-400" />
            <span>Generate Daily Mix</span>
          </button>

          <button
            onClick={() => store.openTasteOnboarding()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-white text-xs font-semibold transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Tune Taste</span>
          </button>
        </div>
      </div>

      {/* ─── DISCOVER OUR FAVOURITES & MAKE UP YOUR STYLE ─────────────────── */}
      <DiscoverFavoritesAndStyle
        onSearchSelect={(q) => onNavigate(`/discover?focus=search&q=${encodeURIComponent(q)}`)}
        onNavigate={onNavigate}
      />

      {/* ─── 2. CONTINUE LISTENING (MOBILE CAROUSEL / DESKTOP GRID) ─────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Continue Listening
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/history')}
            className="text-xs text-[#AAAAAA] hover:text-white font-medium flex items-center gap-1 cursor-pointer transition"
          >
            <span>History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal Carousel on Mobile; Responsive Grid on Desktop */}
        <div className="flex sm:grid overflow-x-auto sm:overflow-x-visible sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pb-2 sm:pb-0 overscroll-x-contain touch-pan-x no-scrollbar">
          {continueListeningTracks.map((song) => {
            const isJustQueued = addedQueueSongId === song.id;
            return (
              <div
                key={`cont-${song.id}`}
                onClick={() => handlePlaySong(song, continueListeningTracks)}
                className="group cursor-pointer rounded-2xl bg-[#18181A] hover:bg-[#222226] border border-[#27272A] hover:border-[#3E3E44] p-2.5 transition duration-200 flex flex-col justify-between shadow-sm relative overflow-hidden min-w-[145px] sm:min-w-0 shrink-0"
              >
                {/* 16:9 Thumbnail Box */}
                <div className="relative aspect-video rounded-xl overflow-hidden mb-2 bg-neutral-900 border border-white/10 shadow-sm">
                  <ArtworkImage
                    song={song}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <div className="w-8 h-8 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-lg">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-red-400 transition">
                    {song.title}
                  </h4>
                  <p className="text-[11px] text-[#AAAAAA] truncate mt-0.5">{song.artist}</p>
                </div>

                <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-white/5">
                  <span className="text-[10px] font-mono text-[#888888]">
                    {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                  </span>
                  <button
                    onClick={(e) => handleAddToQueue(e, song)}
                    className="p-1 rounded-lg text-[#AAAAAA] hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="Add to Queue"
                  >
                    {isJustQueued ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── SPONSORED BANNER (NON-INTRUSIVE) ─────────────────────────────── */}
      <ResponsiveAdBanner className="my-2" />

      {/* ─── 3. MADE FOR YOU (PERSONALIZED DAILY MIXES) ─────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Made For You
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/10">
              Personalized
            </span>
          </div>

          <button
            onClick={() => setIsSmartModalOpen(true)}
            className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer transition"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Generate Mix</span>
          </button>
        </div>

        {/* Horizontal Carousel on Mobile; Responsive Grid on Desktop */}
        <div className="flex sm:grid overflow-x-auto sm:overflow-x-visible sm:grid-cols-3 lg:grid-cols-6 gap-3.5 pb-2 sm:pb-0 overscroll-x-contain touch-pan-x no-scrollbar">
          {DAILY_MIX_CONFIGS.map((mix) => {
            const isPlayingThis = playingMixId === mix.id;
            return (
              <div
                key={mix.id}
                onClick={() => handlePlayDailyMix(mix)}
                className="group cursor-pointer rounded-2xl p-3 bg-[#18181A] hover:bg-[#222226] border border-[#27272A] hover:border-[#3E3E44] transition flex flex-col justify-between shadow-sm relative overflow-hidden min-w-[155px] sm:min-w-0 shrink-0"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 bg-neutral-900 shadow-sm border border-white/5">
                  <ArtworkImage
                    src={mix.coverImage}
                    alt={mix.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-bold text-red-400 border border-white/10">
                    {mix.vibe}
                  </div>

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <div className="w-9 h-9 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-xl">
                      {isPlayingThis ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-red-400 transition">
                    {mix.title}
                  </h4>
                  <p className="text-[10px] text-[#AAAAAA] line-clamp-2 mt-0.5 leading-snug">
                    {mix.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 4. TRENDING NOW (DEFINITIVE RANKED CHART) ───────────────────────── */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-500" />
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Trending Now</span>
                <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              </h2>
              <span className="text-[10px] font-mono font-bold bg-white/10 text-white border border-white/10 px-2 py-0.5 rounded-full">
                {currentRegionMeta.flag} {currentRegionMeta.name.split(' ')[0]}
              </span>
            </div>
            <p className="text-[11px] text-[#AAAAAA] mt-0.5">
              Live YouTube charts • Updated {chartLastUpdated}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePlayAllTrending}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition shadow-md cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play All</span>
            </button>

            <button
              onClick={handleRefreshTrending}
              disabled={loadingTrending}
              className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[#CCCCCC] hover:text-white transition cursor-pointer"
              title="Refresh Charts"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingTrending ? 'animate-spin text-red-500' : ''}`} />
            </button>

            {/* Region Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              {YOUTUBE_REGIONS.slice(0, 5).map((reg) => (
                <button
                  key={reg.code}
                  onClick={() => setSelectedRegion(reg.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
                    selectedRegion === reg.code
                      ? 'bg-white/20 text-white font-bold border border-white/30'
                      : 'bg-white/[0.05] text-[#AAAAAA] hover:text-white hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <span>{reg.flag}</span> <span className="hidden sm:inline">{reg.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {loadingTrending ? (
          <div className="py-12 flex items-center justify-center gap-2 text-xs text-[#AAAAAA]">
            <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
            <span>Loading live charts...</span>
          </div>
        ) : (
          /* Horizontal on Mobile; 6-Column Grid on Desktop */
          <div className="flex sm:grid overflow-x-auto sm:overflow-x-visible sm:grid-cols-3 lg:grid-cols-6 gap-3 pb-2 sm:pb-0 overscroll-x-contain touch-pan-x no-scrollbar">
            {trendingTracks.slice(0, 12).map((song, idx) => {
              const isLiked = state.likedSongIds.includes(song.id);
              const rank = idx + 1;
              const isJustQueued = addedQueueSongId === song.id;

              return (
                <div
                  key={song.id}
                  className="group cursor-pointer rounded-2xl p-2.5 bg-[#18181A] hover:bg-[#222226] border border-[#27272A] hover:border-[#3E3E44] transition flex flex-col justify-between shadow-sm relative overflow-hidden min-w-[150px] sm:min-w-0 shrink-0"
                >
                  {/* Rank Badge */}
                  <div className="absolute top-2 left-2 z-10 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 flex items-center gap-1 shadow-md">
                    <span className={`text-[11px] font-black font-mono ${rank <= 3 ? 'text-red-400' : 'text-white'}`}>
                      #{rank}
                    </span>
                    {rank <= 3 && <Flame className="w-3 h-3 text-red-500 fill-red-500" />}
                  </div>

                  {/* 16:9 Thumbnail Box */}
                  <div
                    onClick={() => handlePlaySong(song, trendingTracks)}
                    className="relative aspect-video rounded-xl overflow-hidden mb-2 shadow-sm bg-neutral-900 border border-white/10"
                  >
                    <ArtworkImage
                      song={song}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <div className="w-8 h-8 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-lg">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4
                      onClick={() => handlePlaySong(song, trendingTracks)}
                      className="text-xs font-bold text-white truncate hover:text-red-400 transition"
                    >
                      {song.title}
                    </h4>
                    <p className="text-[11px] text-[#AAAAAA] truncate mt-0.5">{song.artist}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-white/5">
                    <span className="text-[10px] font-mono text-[#888888]">
                      {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => store.toggleLikeSong(song.id, song)}
                        className={`p-1 rounded transition cursor-pointer ${
                          isLiked ? 'text-red-500' : 'text-[#888888] hover:text-white'
                        }`}
                        title="Like"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => handleAddToQueue(e, song)}
                        className="p-1 rounded text-[#888888] hover:text-white transition cursor-pointer"
                        title="Add to queue"
                      >
                        {isJustQueued ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── 6. INFINITE RADIO STATIONS ─────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Infinite Radio
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white">
              24/7 Autoplay
            </span>
          </div>
        </div>

        {/* Horizontal Carousel on Mobile; 6-Column Grid on Desktop */}
        <div className="flex sm:grid overflow-x-auto sm:overflow-x-visible sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pb-2 sm:pb-0 overscroll-x-contain touch-pan-x no-scrollbar">
          {LANGUAGE_RADIO_STATIONS.slice(0, 12).map((station) => (
            <div
              key={station.id}
              onClick={() => radioEngine.startLanguageStation(station.id)}
              className="group cursor-pointer rounded-2xl p-3 bg-[#18181A] hover:bg-[#222226] border border-[#27272A] hover:border-red-500/40 transition flex flex-col justify-between shadow-sm relative overflow-hidden min-w-[145px] sm:min-w-0 shrink-0"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{station.flag}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 group-hover:animate-ping" />
              </div>

              <div className="mt-4">
                <h4 className="text-xs font-bold text-white group-hover:text-red-400 transition truncate">
                  {station.name}
                </h4>
                <p className="text-[10px] text-[#AAAAAA] line-clamp-1 mt-0.5">
                  {station.language}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-mono text-emerald-400 font-bold">ON AIR</span>
                <Play className="w-3 h-3 text-white fill-white group-hover:text-red-500 group-hover:fill-red-500 transition" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 7. FEATURED ARTISTS SPOTLIGHT (DYNAMIC LINK TO /artist/:name) ──── */}
      <section className="space-y-3 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Disc className="w-4 h-4 text-red-500" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Featured Artists
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/discover')}
            className="text-xs text-[#AAAAAA] hover:text-white font-medium flex items-center gap-1 cursor-pointer transition"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal Carousel on Mobile; 6-Column Grid on Desktop */}
        <div className="flex sm:grid overflow-x-auto sm:overflow-x-visible sm:grid-cols-3 lg:grid-cols-6 gap-3 pb-2 sm:pb-0 overscroll-x-contain touch-pan-x no-scrollbar">
          {spotlightArtists.map((artist) => (
            <div
              key={artist.name}
              onClick={() => onNavigate(`/artist/${encodeURIComponent(artist.name)}`)}
              className="group cursor-pointer rounded-2xl p-3 bg-[#18181A] hover:bg-[#222226] border border-[#27272A] hover:border-red-500/40 transition flex items-center gap-3 shadow-sm min-w-[180px] sm:min-w-0 shrink-0"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex items-center justify-center font-black text-xs text-red-400 shrink-0 group-hover:scale-105 group-hover:border-red-500/50 transition">
                {artist.initial}
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-white truncate group-hover:text-red-400 transition">
                  {artist.name}
                </h5>
                <p className="text-[10px] text-[#AAAAAA] truncate">{artist.genre}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Smart Playlist Modal */}
      <SmartPlaylistModal
        isOpen={isSmartModalOpen}
        onClose={() => setIsSmartModalOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
