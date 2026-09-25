import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { audioManager } from '../services/audio/AudioManager';
import { 
  getTracksByTag, 
  getTracksByLanguage, 
  getDiverseSampleTracks,
  DEFAULT_PLAYLISTS
} from '../services/audio/DefaultMusicProvider';
import { YOUTUBE_REGIONS } from '../services/audio/YouTubeDataApi';
import { Song, UserMusicPreferences } from '../types';
import { 
  DAILY_MIX_CONFIGS, 
  DailyMixConfig, 
  SmartPlaylistEngine 
} from '../services/audio/SmartPlaylistEngine';
import { SmartPlaylistModal } from '../components/playlist/SmartPlaylistModal';
import { radioEngine, LANGUAGE_RADIO_STATIONS } from '../services/audio/RadioEngine';
import { ArtworkImage } from '../utils/artwork';
import {
  Play,
  Flame,
  Radio,
  Heart,
  Plus,
  Loader2,
  Users,
  Compass,
  ListMusic,
  Check,
  Disc,
  Mic2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

const getFallbackTrending = (region: string, preferences?: UserMusicPreferences | null): Song[] => {
  if (['US', 'GB', 'CA', 'AU', 'GLOBAL'].includes(region)) {
    const pop = getTracksByTag('english');
    if (pop.length > 0) return pop.slice(0, 12);
  }

  if (preferences && preferences.completedOnboarding && (preferences.languages || []).length > 0) {
    const matched: Song[] = [];
    for (const lang of preferences.languages) {
      matched.push(...getTracksByLanguage(lang).slice(0, 3));
    }
    if (matched.length >= 6) {
      return matched.slice(0, 12);
    }
  }

  return getDiverseSampleTracks(12);
};

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

  // Fetch real YouTube trending music for the active region
  useEffect(() => {
    let cancelled = false;
    const fetchTrending = async () => {
      setLoadingTrending(true);
      const { tracks, lastUpdated } = await SmartPlaylistEngine.getTodayTopCharts(selectedRegion);
      if (!cancelled) {
        setTrendingTracks(tracks.length > 0 ? tracks : getFallbackTrending(selectedRegion, state.musicPreferences));
        setChartLastUpdated(lastUpdated);
        setLoadingTrending(false);
      }
    };
    fetchTrending();
    return () => {
      cancelled = true;
    };
  }, [selectedRegion, state.musicPreferences]);

  const handlePlaySong = (song: Song, trackList?: Song[]) => {
    audioManager.playSong(song, trackList || trendingTracks);
  };

  const handleAddToQueue = (e: React.MouseEvent, song: Song) => {
    e.stopPropagation();
    audioManager.addToQueue(song);
    setAddedQueueSongId(song.id);
    setTimeout(() => setAddedQueueSongId(null), 1800);
  };

  const handlePlayAllTrending = () => {
    if (trendingTracks.length > 0) {
      audioManager.playSong(trendingTracks[0], trendingTracks);
    }
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

  const handleRefreshTrending = async () => {
    setLoadingTrending(true);
    const { tracks, lastUpdated } = await SmartPlaylistEngine.getTodayTopCharts(selectedRegion);
    if (tracks.length > 0) {
      setTrendingTracks(tracks);
      setChartLastUpdated(lastUpdated);
    } else {
      setTrendingTracks(getFallbackTrending(selectedRegion, state.musicPreferences));
    }
    setLoadingTrending(false);
  };

  // Popular Artists list
  const popularArtists = useMemo(() => {
    return [
      { name: 'Arijit Singh', genre: 'Bollywood · Soul', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&fit=crop', initial: 'AS' },
      { name: 'Anirudh Ravichander', genre: 'Mass EDM · Tamil', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&fit=crop', initial: 'AR' },
      { name: 'Sushin Shyam', genre: 'Indie Electronic · Malayalam', image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&fit=crop', initial: 'SS' },
      { name: 'Diljit Dosanjh', genre: 'Punjabi Pop · Desi', image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400&fit=crop', initial: 'DD' },
      { name: 'The Weeknd', genre: 'R&B · Synth Pop', image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&fit=crop', initial: 'TW' },
      { name: 'Dua Lipa', genre: 'Dance Pop · Disco', image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&fit=crop', initial: 'DL' },
    ];
  }, []);

  // Curated playlists to display (mix of user playlists and curated presets)
  const curatedPlaylists = useMemo(() => {
    if (state.playlists && state.playlists.length >= 6) {
      return state.playlists.slice(0, 6);
    }
    const combined = [...state.playlists, ...DEFAULT_PLAYLISTS];
    return combined.slice(0, 6);
  }, [state.playlists]);

  const currentRegionMeta = YOUTUBE_REGIONS.find((r) => r.code === selectedRegion) || YOUTUBE_REGIONS[0];

  return (
    <div className="space-y-10 p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto select-none">
      {/* ─── 1. HERO SECTION (250–300px desktop, Cinematic Music Background) ─── */}
      <section className="relative h-[250px] sm:h-[280px] rounded-2xl overflow-hidden shadow-2xl border border-white/[0.07] flex items-center justify-between p-6 sm:p-10">
        {/* Background artwork image with dark gradient overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&fit=crop')`,
          }}
        />
        {/* Dark radial & linear gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0C] via-[#0A0A0C]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-transparent to-black/40" />

        {/* Content */}
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#FF0000]/15 border border-[#FF0000]/30 text-white text-[11px] font-bold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF0000] animate-pulse" />
            <span>SYNCHRONIZED MUSIC PLATFORM</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight uppercase font-sans">
            Good Music.<br />
            <span className="text-[#FF0000]">Better Together.</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#A1A1A1] max-w-lg leading-relaxed">
            Listen to your favorite songs, create rooms, chat with friends and enjoy the vibe.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handlePlayAllTrending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#FF0000] hover:bg-[#E50914] text-white text-xs font-bold transition shadow-lg shadow-red-950/40 hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Start Listening</span>
            </button>

            <button
              onClick={() => store.setState({ isCreateRoomModalOpen: true })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#141418] hover:bg-[#1C1C22] border border-white/[0.12] text-white text-xs font-bold transition cursor-pointer hover:border-white/25 active:scale-95 uppercase tracking-wider"
            >
              <Users className="w-4 h-4 text-[#FF0000]" />
              <span>Create Room</span>
            </button>
          </div>
        </div>

        {/* Right Subtle Artwork Badge on Desktop */}
        <div className="hidden lg:flex items-center gap-4 relative z-10 pr-6">
          <div className="w-40 h-40 rounded-xl overflow-hidden border border-white/10 shadow-2xl ring-1 ring-white/10 transform rotate-2 hover:rotate-0 transition duration-300">
            <img 
              src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&fit=crop" 
              alt="Music" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* ─── 2. QUICK ACCESS (Five Compact Cards) ───────────────────────────── */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            {
              label: 'Trending',
              desc: 'Top viral charts',
              icon: TrendingUp,
              action: () => document.getElementById('trending-section')?.scrollIntoView({ behavior: 'smooth' }),
            },
            {
              label: 'Radio',
              desc: '12 Regional stations',
              icon: Radio,
              action: () => document.getElementById('radio-section')?.scrollIntoView({ behavior: 'smooth' }),
            },
            {
              label: 'Playlists',
              desc: 'Curated mixes',
              icon: ListMusic,
              action: () => onNavigate('/playlists'),
            },
            {
              label: 'Discover',
              desc: 'Search & genres',
              icon: Compass,
              action: () => onNavigate('/discover'),
            },
            {
              label: 'Rooms',
              desc: 'Social listening',
              icon: Users,
              action: () => onNavigate('/rooms'),
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                onClick={item.action}
                className="group cursor-pointer p-3.5 rounded-xl bg-[#111114] hover:bg-[#1A1A20] border border-white/[0.07] hover:border-[#FF0000]/40 transition duration-150 flex items-center gap-3 shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-[#16161B] group-hover:bg-[#FF0000]/15 flex items-center justify-center shrink-0 transition">
                  <Icon className="w-5 h-5 text-[#A1A1A1] group-hover:text-[#FF0000] transition" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white group-hover:text-[#FF0000] transition truncate">
                    {item.label}
                  </h4>
                  <p className="text-[10px] text-[#666666] truncate mt-0.5">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 3. TRENDING NOW (Desktop: 5–6 cards, Tablet: 3–4, Mobile: 2 Horizontal) ─── */}
      <section id="trending-section" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FF0000]" />
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Trending Now</span>
                <Flame className="w-4 h-4 text-[#FF0000] fill-current" />
              </h2>
              <span className="text-[10px] font-mono font-bold bg-[#18181D] text-[#A1A1A1] border border-white/10 px-2 py-0.5 rounded">
                {currentRegionMeta.flag} {currentRegionMeta.name.split(' ')[0]}
              </span>
            </div>
            <p className="text-xs text-[#666666] mt-0.5">
              Live YouTube music trends • Updated {chartLastUpdated}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePlayAllTrending}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FF0000] hover:bg-[#E50914] text-white text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play All</span>
            </button>

            <button
              onClick={handleRefreshTrending}
              disabled={loadingTrending}
              className="p-1.5 rounded-lg bg-[#141418] hover:bg-[#1A1A20] border border-white/[0.07] text-[#A1A1A1] hover:text-white transition cursor-pointer"
              title="Refresh charts"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingTrending ? 'animate-spin text-[#FF0000]' : ''}`} />
            </button>

            {/* Region Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
              {YOUTUBE_REGIONS.slice(0, 5).map((reg) => (
                <button
                  key={reg.code}
                  onClick={() => setSelectedRegion(reg.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
                    selectedRegion === reg.code
                      ? 'bg-white/15 text-white font-bold border border-white/20'
                      : 'bg-[#141418] text-[#777777] hover:text-white border border-transparent'
                  }`}
                >
                  <span>{reg.flag}</span> <span className="hidden sm:inline">{reg.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {loadingTrending ? (
          <div className="py-12 flex items-center justify-center gap-2 text-xs text-[#A1A1A1]">
            <Loader2 className="w-5 h-5 text-[#FF0000] animate-spin" />
            <span>Loading live trending songs...</span>
          </div>
        ) : (
          /* Grid: Desktop 5-6 cards, Tablet 3-4, Mobile 2 cards scroll */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {trendingTracks.slice(0, 12).map((song, idx) => {
              const isLiked = state.likedSongIds.includes(song.id);
              const rank = idx + 1;
              const isJustQueued = addedQueueSongId === song.id;

              return (
                <div
                  key={song.id}
                  className="group cursor-pointer rounded-xl p-2.5 bg-[#111114] hover:bg-[#1A1A20] border border-white/[0.07] hover:border-white/[0.14] transition duration-150 flex flex-col justify-between shadow-sm relative overflow-hidden"
                >
                  {/* Rank Badge */}
                  <div className="absolute top-2 left-2 z-10 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-black font-mono flex items-center gap-1 border border-white/10 shadow">
                    <span className={rank <= 3 ? 'text-[#FF0000]' : 'text-white'}>
                      #{rank}
                    </span>
                  </div>

                  {/* 1:1 Aspect Ratio Artwork Box — NEVER distort */}
                  <div
                    onClick={() => handlePlaySong(song, trendingTracks)}
                    className="relative w-full aspect-square rounded-lg overflow-hidden mb-2 bg-[#0E0E12] border border-white/5"
                  >
                    <ArtworkImage
                      song={song}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <div className="w-9 h-9 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h4
                      onClick={() => handlePlaySong(song, trendingTracks)}
                      className="text-xs font-bold text-[#F5F5F5] truncate hover:text-[#FF0000] transition"
                      title={song.title}
                    >
                      {song.title}
                    </h4>
                    <p className="text-[11px] text-[#A1A1A1] truncate mt-0.5">{song.artist}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-white/[0.05]">
                    <span className="text-[10px] font-mono text-[#666666]">
                      {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => store.toggleLikeSong(song.id, song)}
                        className={`p-1 rounded transition cursor-pointer ${
                          isLiked ? 'text-[#FF0000]' : 'text-[#666666] hover:text-white'
                        }`}
                        title="Like"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => handleAddToQueue(e, song)}
                        className="p-1 rounded text-[#666666] hover:text-white transition cursor-pointer"
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

      {/* ─── 4. POPULAR ARTISTS (Circular Artist Cards) ─────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic2 className="w-5 h-5 text-[#FF0000]" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Popular Artists
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/discover')}
            className="text-xs text-[#A1A1A1] hover:text-white font-medium flex items-center gap-1 cursor-pointer transition"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {popularArtists.map((artist) => (
            <div
              key={artist.name}
              onClick={() => onNavigate(`/artist/${encodeURIComponent(artist.name)}`)}
              className="group cursor-pointer flex flex-col items-center text-center p-3 rounded-xl bg-[#111114] hover:bg-[#1A1A20] border border-white/[0.07] hover:border-white/15 transition duration-150 shadow-sm"
            >
              {/* Circular artwork */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden mb-2.5 border-2 border-white/10 group-hover:border-[#FF0000] shadow-md transition duration-300">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <Play className="w-5 h-5 text-white fill-current" />
                </div>
              </div>

              <h4 className="text-xs font-bold text-white group-hover:text-[#FF0000] transition truncate w-full">
                {artist.name}
              </h4>
              <p className="text-[10px] text-[#666666] truncate w-full mt-0.5">{artist.genre}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 5. CURATED PLAYLISTS (6 Cards Desktop) ─────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-[#FF0000]" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Curated Playlists
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/playlists')}
            className="text-xs text-[#A1A1A1] hover:text-white font-medium flex items-center gap-1 cursor-pointer transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {curatedPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onNavigate(`/playlist/${pl.id}`)}
              className="group cursor-pointer rounded-xl p-2.5 bg-[#111114] hover:bg-[#1A1A20] border border-white/[0.07] hover:border-white/15 transition flex flex-col justify-between shadow-sm relative overflow-hidden"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden mb-2 bg-[#0E0E12] border border-white/5">
                <img
                  src={pl.coverUrl}
                  alt={pl.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <div className="w-9 h-9 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FF0000] transition">
                  {pl.name}
                </h4>
                <p className="text-[10px] text-[#666666] line-clamp-1 mt-0.5">
                  {pl.songsCount || pl.songs?.length || 0} songs · {pl.ownerName || 'ChillWithYT'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 6. RADIO (12 Language-Based Stations: Instant Autoplay) ──────────── */}
      <section id="radio-section" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#FF0000]" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Language & Regional Radio</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FF0000]/15 text-[#FF0000] border border-[#FF0000]/30">
                  Infinite 24/7
                </span>
              </h2>
              <p className="text-xs text-[#666666] mt-0.5">
                Click any station for an endless, non-repeating stream tailored by language and vibe.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {LANGUAGE_RADIO_STATIONS.slice(0, 12).map((station) => (
            <div
              key={station.id}
              onClick={() => radioEngine.startLanguageStation(station.id)}
              className="group cursor-pointer rounded-xl p-3 bg-[#111114] hover:bg-[#1A1A20] border border-white/[0.07] hover:border-[#FF0000]/40 transition flex flex-col justify-between shadow-sm relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{station.flag}</span>
                <span className="w-2 h-2 rounded-full bg-[#FF0000] group-hover:animate-ping" />
              </div>

              <div className="mt-3">
                <h4 className="text-xs font-bold text-white group-hover:text-[#FF0000] transition truncate">
                  {station.name}
                </h4>
                <p className="text-[10px] text-[#666666] line-clamp-1 mt-0.5">
                  {station.language}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-white/[0.05] flex items-center justify-between">
                <span className="text-[9px] font-mono text-[#FF0000] font-bold">ON AIR</span>
                <Play className="w-3 h-3 text-white fill-white group-hover:text-[#FF0000] group-hover:fill-[#FF0000] transition" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 7. RECOMMENDED FOR YOU (Daily Mixes) ───────────────────────────── */}
      <section className="space-y-4 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Recommended For You
            </h2>
          </div>
          <button
            onClick={() => setIsSmartModalOpen(true)}
            className="text-xs text-[#FF0000] hover:text-red-400 font-bold flex items-center gap-1 cursor-pointer transition"
          >
            <span>Custom Mix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {DAILY_MIX_CONFIGS.slice(0, 6).map((mix) => {
            const isPlayingThis = playingMixId === mix.id;
            return (
              <div
                key={mix.id}
                onClick={() => handlePlayDailyMix(mix)}
                className="group cursor-pointer rounded-xl p-2.5 bg-[#111114] hover:bg-[#1A1A20] border border-white/[0.07] hover:border-white/15 transition flex flex-col justify-between shadow-sm relative overflow-hidden"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden mb-2 bg-[#0E0E12] border border-white/5">
                  <ArtworkImage
                    src={mix.coverImage}
                    alt={mix.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-[#FF0000] border border-white/10">
                    {mix.vibe}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <div className="w-9 h-9 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-lg">
                      {isPlayingThis ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FF0000] transition">
                    {mix.title}
                  </h4>
                  <p className="text-[10px] text-[#666666] line-clamp-1 mt-0.5">
                    {mix.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
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
