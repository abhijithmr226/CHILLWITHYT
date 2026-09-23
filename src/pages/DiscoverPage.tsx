import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { audioManager } from '../services/audio/AudioManager';
import { radioEngine } from '../services/audio/RadioEngine';
import { YouTubePlayerService } from '../services/audio/YouTubePlayer';
import {
  YouTubeDataApiService,
  YouTubePlaylistResult
} from '../services/audio/YouTubeDataApi';
import { Song } from '../types';
import { MusicService } from '../services/audio/MusicService';
import { ArtworkImage } from '../utils/artwork';
import { ResponsiveAdBanner, AdSlot } from '../components/ads/AdSlot';
import { DiscoverFavoritesAndStyle } from '../components/discovery/DiscoverFavoritesAndStyle';
import {
  Play,
  Plus,
  Heart,
  Radio,
  ListMusic,
  FolderPlus,
  Flame,
  Check,
  Film,
  Sparkles,
  RadioTower,
  Music2,
  Users,
  Search,
  Zap,
  ArrowRight,
  Coffee,
  Moon,
  Headphones,
  Disc3,
  Waves,
  Sun,
  Music,
  X
} from 'lucide-react';

interface DiscoverPageProps {
  onNavigate: (path: string) => void;
  initialQuery?: string;
  autoFocusSearch?: boolean;
}

type TabCategory = 'All' | 'Songs' | 'Artists' | 'Albums & Soundtracks' | 'Radios' | 'Playlists' | 'Rooms';

export const DiscoverPage: React.FC<DiscoverPageProps> = ({
  onNavigate,
  initialQuery = '',
  autoFocusSearch = false,
}) => {
  const [state, store] = useStore();
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<TabCategory>('All');
  const [songs, setSongs] = useState<Song[]>([]);
  const [ytPlaylists, setYtPlaylists] = useState<YouTubePlaylistResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [loadingPlaylistId, setLoadingPlaylistId] = useState<string | null>(null);
  const [playback, setPlayback] = useState(audioManager.getState());
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Auto-focus search input if requested or query string has focus=search
  useEffect(() => {
    if (autoFocusSearch || window.location.search.includes('focus=search')) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocusSearch]);

  // ── Sync initialQuery prop changes (Navbar search while already on /discover) ──
  useEffect(() => {
    if (initialQuery !== query) {
      setQuery(initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  useEffect(() => {
    return audioManager.subscribe((newPlayback) => {
      setPlayback(newPlayback);
    });
  }, []);

  const showNotification = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Fetch YouTube data based on search query or selected region
  useEffect(() => {
    let isCancelled = false;

    const runSearch = async () => {
      setLoading(true);

      const ytPlaylistId = YouTubeDataApiService.extractPlaylistId(query);
      const ytVideoId = YouTubePlayerService.extractVideoId(query);

      if (ytPlaylistId) {
        // Real YouTube Playlist URL/ID entered!
        const playlistTracks = await YouTubeDataApiService.getPlaylistVideos(ytPlaylistId, 30);
        if (!isCancelled) {
          setSongs(playlistTracks);
          setYtPlaylists([]);
          setLoading(false);
        }
        return;
      }

      if (ytVideoId) {
        // Real YouTube Video URL/ID entered!
        const meta = await YouTubePlayerService.fetchYouTubeMetadata(ytVideoId);
        if (!isCancelled) {
          setSongs([
            {
              id: `yt-${ytVideoId}`,
              source: 'youtube',
              sourceId: ytVideoId,
              title: meta.title,
              artist: meta.artist,
              artwork: meta.artwork,
              duration: meta.duration,
              tags: ['YouTube', 'Live Video'],
            },
          ]);
          setYtPlaylists([]);
          setLoading(false);
        }
        return;
      }

      if (query.trim()) {
        store.recordSearch(query.trim());
        // Live search YouTube songs & playlists in parallel using cached MusicService
        const [searchedSongsResult, searchedPlaylists] = await Promise.all([
          MusicService.searchTracks(query, 28),
          YouTubeDataApiService.searchPlaylists(query, 8),
        ]);

        if (!isCancelled) {
          setSongs(searchedSongsResult.data);
          setYtPlaylists(searchedPlaylists);
          setLoading(false);
        }
      } else {
        // Load live real YouTube trending music
        const [trendingResult] = await Promise.all([
          MusicService.getTrending('US', 24),
        ]);

        if (!isCancelled) {
          setSongs(trendingResult.data);
          setYtPlaylists(YouTubeDataApiService.getCuratedPlaylists());
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(runSearch, 300);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handlePlaySong = (song: Song) => {
    audioManager.playSong(song, songs);
    showNotification(`Playing "${song.title}"`);
  };

  const handlePlayNext = (song: Song) => {
    audioManager.playNext(song);
    showNotification(`Playing next: "${song.title}"`);
  };

  const handleAddToQueue = (song: Song) => {
    audioManager.addToQueue(song);
    showNotification(`Added to queue: "${song.title}"`);
  };

  const handleAddToPlaylist = (song: Song) => {
    if (state.playlists.length > 0) {
      store.addSongToPlaylist(state.playlists[0].id, song);
      showNotification(`Added to ${state.playlists[0].name}`);
    } else {
      const pl = store.createPlaylist('Favorites', 'Created from discovery');
      store.addSongToPlaylist(pl.id, song);
      showNotification(`Added to new playlist "${pl.name}"`);
    }
  };

  // Play an entire YouTube Playlist
  const handlePlayYouTubePlaylist = async (playlist: YouTubePlaylistResult) => {
    try {
      setLoadingPlaylistId(playlist.id);
      const tracks = await YouTubeDataApiService.getPlaylistVideos(playlist.id, 30);
      if (tracks.length > 0) {
        audioManager.playSong(tracks[0], tracks);
        showNotification(`Playing YouTube Playlist: "${playlist.title}" (${tracks.length} tracks)`);
      } else {
        showNotification(`No playable tracks found in playlist.`);
      }
    } finally {
      setLoadingPlaylistId(null);
    }
  };

  // Import an entire YouTube Playlist to user library
  const handleImportYouTubePlaylist = async (playlist: YouTubePlaylistResult) => {
    try {
      setLoadingPlaylistId(playlist.id);
      const tracks = await YouTubeDataApiService.getPlaylistVideos(playlist.id, 40);
      if (tracks.length > 0) {
        store.createPlaylistWithSongs(
          playlist.title,
          playlist.description || `Imported from YouTube (${playlist.channelTitle})`,
          playlist.thumbnail,
          tracks
        );
        showNotification(`Imported "${playlist.title}" (${tracks.length} tracks) to library!`);
      } else {
        showNotification(`Could not fetch tracks for this playlist.`);
      }
    } finally {
      setLoadingPlaylistId(null);
    }
  };

  const CURATED_DISCOVER_ARTISTS = [
    { name: 'Arijit Singh', role: 'Bollywood Soul King', listeners: '42.8M', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80' },
    { name: 'Anirudh Ravichander', role: 'Rockstar & Kollywood King', listeners: '28.4M', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop&q=80' },
    { name: 'Sushin Shyam', role: 'Mollywood Beatmaker', listeners: '9.6M', image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80' },
    { name: 'The Weeknd', role: 'Global R&B / Pop Icon', listeners: '108.5M', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80' },
    { name: 'A.R. Rahman', role: 'The Musical Maestro', listeners: '36.2M', image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=400&auto=format&fit=crop&q=80' },
    { name: 'Diljit Dosanjh', role: 'Global Punjabi Icon', listeners: '22.1M', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80' },
    { name: 'Sid Sriram', role: 'Melody Phenomenon', listeners: '18.9M', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80' },
    { name: 'Hans Zimmer', role: 'Hollywood Film Maestro', listeners: '15.4M', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80' },
  ];

  const CURATED_DISCOVER_ALBUMS = [
    { title: 'Interstellar', artist: 'Hans Zimmer', year: '2014', cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80', isMovie: true },
    { title: 'Animal', artist: 'Pritam / Harshavardhan', year: '2023', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80', isMovie: true },
    { title: 'Leo', artist: 'Anirudh Ravichander', year: '2023', cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80', isMovie: true },
    { title: 'Aavesham', artist: 'Sushin Shyam', year: '2024', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80', isMovie: true },
    { title: 'Dune', artist: 'Hans Zimmer', year: '2021', cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80', isMovie: true },
    { title: 'After Hours', artist: 'The Weeknd', year: '2020', cover: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80', isMovie: false },
  ];

  const CURATED_DISCOVER_RADIOS = [
    { name: 'Lofi Hip Hop Chill & Study', tag: '24/7 Relax', query: 'lofi hip hop radio beats to relax study to', icon: Coffee },
    { name: 'Synthwave 80s Cyberpunk Night Drive', tag: 'Neon Beats', query: 'synthwave radio chill synth cyberpunk beats', icon: Zap },
    { name: 'Coffee House Acoustic & Jazz', tag: 'Cafe Vibes', query: 'coffee shop jazz acoustic guitar music', icon: Music },
    { name: 'Golden Bollywood Retro 90s', tag: 'Nostalgia', query: 'classic bollywood 90s songs hits', icon: Moon },
    { name: 'Deep House & Electronic Waves', tag: 'Dance / Club', query: 'deep house vocal chillout music', icon: Headphones },
    { name: 'Peaceful Piano Focus & Sleep', tag: 'Calm Focus', query: 'peaceful piano music relaxing study', icon: Disc3 },
  ];

  // ── Dynamic Artists extraction from search results + curated matches ──
  const dynamicArtists = useMemo(() => {
    if (!query.trim()) return CURATED_DISCOVER_ARTISTS;

    const curatedMatches = CURATED_DISCOVER_ARTISTS.filter(a =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      query.toLowerCase().includes(a.name.toLowerCase())
    );

    const artistMap = new Map<string, { name: string; role: string; listeners: string; image: string }>();
    curatedMatches.forEach(a => artistMap.set(a.name.toLowerCase(), a));

    songs.forEach((s) => {
      const aLower = s.artist.toLowerCase();
      if (!artistMap.has(aLower)) {
        artistMap.set(aLower, {
          name: s.artist,
          role: s.album || 'Featured Artist',
          listeners: 'Active Artist',
          image: s.artwork,
        });
      }
    });

    return Array.from(artistMap.values()).slice(0, 8);
  }, [query, songs]);

  // ── Dynamic Albums extraction from search results + curated matches ──
  const dynamicAlbums = useMemo(() => {
    if (!query.trim()) return CURATED_DISCOVER_ALBUMS;

    const curatedMatches = CURATED_DISCOVER_ALBUMS.filter(alb =>
      alb.title.toLowerCase().includes(query.toLowerCase()) ||
      alb.artist.toLowerCase().includes(query.toLowerCase())
    );

    const albumMap = new Map<string, { title: string; artist: string; year: string; cover: string; isMovie: boolean }>();
    curatedMatches.forEach(alb => albumMap.set(alb.title.toLowerCase(), alb));

    songs.forEach((s) => {
      if (s.album && !albumMap.has(s.album.toLowerCase())) {
        albumMap.set(s.album.toLowerCase(), {
          title: s.album,
          artist: s.artist,
          year: '2024',
          cover: s.artwork,
          isMovie: false,
        });
      }
    });

    return Array.from(albumMap.values()).slice(0, 6);
  }, [query, songs]);

  // ── Top Result Hero Resolution (Spotify / Apple Music paradigm) ──
  const topResult = useMemo(() => {
    if (!query.trim() || songs.length === 0) return null;

    // Check if query exactly or strongly matches an artist
    const qLower = query.trim().toLowerCase();
    const exactArtist = dynamicArtists.find(a =>
      a.name.toLowerCase() === qLower ||
      qLower.includes(a.name.toLowerCase())
    );

    if (exactArtist && qLower.length > 2) {
      return {
        type: 'artist' as const,
        title: exactArtist.name,
        subtitle: exactArtist.role,
        image: exactArtist.image,
        artist: exactArtist.name,
        targetArtist: exactArtist.name,
        song: null,
      };
    }

    const first = songs[0];
    return {
      type: 'song' as const,
      title: first.title,
      subtitle: first.artist,
      image: first.artwork,
      artist: first.artist,
      targetArtist: null,
      song: first,
    };
  }, [query, songs, dynamicArtists]);

  const filteredRooms = state.rooms.filter(
    (r) =>
      !query ||
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.tags?.some((t) => t.toLowerCase().includes(query.toLowerCase()))
  );

  const categories: { id: TabCategory; label: string; count?: number }[] = [
    { id: 'All', label: 'All' },
    { id: 'Songs', label: 'Songs', count: query ? songs.length : undefined },
    { id: 'Artists', label: 'Artists', count: query ? dynamicArtists.length : undefined },
    { id: 'Playlists', label: 'Playlists', count: query ? ytPlaylists.length : undefined },
    { id: 'Albums & Soundtracks', label: 'Albums', count: query ? dynamicAlbums.length : undefined },
    { id: 'Radios', label: 'Radios' },
    { id: 'Rooms', label: 'Rooms', count: query ? filteredRooms.length : undefined },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 select-none">
      {/* Toast Notification */}
      {actionFeedback && (
        <div className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#212121] border border-[#272727] text-white text-xs font-semibold shadow-2xl animate-fade-in">
          <Check className="w-4 h-4 text-[#FF0000]" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* ── Page Header ── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {query ? `Results for "${query}"` : 'Discover & Trending'}
              </h1>
              {query && (
                <span className="text-xs font-mono font-bold text-[#FF4D4D] bg-[#FF0000]/10 px-2.5 py-0.5 rounded-full border border-[#FF0000]/25">
                  {songs.length + ytPlaylists.length} Found
                </span>
              )}
            </div>
            <p className="text-xs text-[#888888]">
              {query
                ? `Direct live streaming results from YouTube Music catalog`
                : `Real-time top charts, hitmakers, and curated live audio radios`}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {query && songs.length > 0 && (
              <button
                onClick={() => {
                  radioEngine.startRadio(songs[0]);
                  showNotification(`Started infinite radio for "${query}"`);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2A2A2A] hover:bg-[#333333] border border-[#3A3A3A] hover:border-[#FF0000]/50 text-white text-xs font-semibold transition cursor-pointer shadow-sm"
                title="Start infinite radio based on these search results"
              >
                <Radio className="w-3.5 h-3.5 text-[#FF4D4D]" />
                <span>Start Radio</span>
              </button>
            )}
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-xs text-[#AAAAAA] hover:text-white bg-[#212121] hover:bg-[#272727] px-3 py-1.5 rounded-xl border border-[#333333] hover:border-red-500/40 transition cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Search</span>
              </button>
            )}
          </div>
        </div>

        {/* ── High-Visibility Search Input Bar ── */}
        <div className="relative mb-3.5 group">
          <Search className="w-4 h-4 text-[#777777] group-focus-within:text-[#FF4D4D] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists, albums, or paste a YouTube URL..."
            className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-2xl bg-[#161618] border border-[#2B2B30] hover:border-[#3D3D45] focus:border-[#FF0000] focus:ring-2 focus:ring-[#FF0000]/20 text-white placeholder-[#71717A] text-xs sm:text-sm font-medium transition outline-none shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Genre Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { label: 'Malayalam Hits', q: 'Malayalam hits Sushin Shyam Jakes Bejoy', icon: Music },
            { label: 'Tamil Anirudh & ARR', q: 'Tamil Anirudh hits AR Rahman Yuvan', icon: Zap },
            { label: 'Telugu Tollywood', q: 'Telugu mass songs DSP Thaman S', icon: Flame },
            { label: 'Bollywood Soul', q: 'Bollywood romantic Arijit Singh Pritam', icon: Moon },
            { label: 'Punjabi Street', q: 'Punjabi songs Diljit Dosanjh Karan Aujla', icon: Radio },
            { label: 'Kannada Hits', q: 'Kannada hit songs Ravi Basrur', icon: Disc3 },
            { label: 'Bengali Hits', q: 'Bengali hits Anupam Roy Arijit', icon: Waves },
            { label: 'Indian Indie & Sunset', q: 'Indian indie acoustic Prateek Kuhad Anuv Jain', icon: Sun },
            { label: 'Lofi Study & Chill', q: 'Lofi hip hop chill beats relax', icon: Coffee },
            { label: 'Global Billboard', q: 'Global Billboard Hot 100 songs', icon: Headphones },
          ].map((tag) => {
            const TagIcon = tag.icon;
            return (
              <button
                key={tag.label}
                onClick={() => setQuery(tag.q)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition shrink-0 cursor-pointer ${
                  query === tag.q
                    ? 'bg-[#FF0000] border-[#FF0000] text-white shadow-md'
                    : 'bg-[#212121] hover:bg-[#272727] border-[#272727] hover:border-red-500/40 text-[#AAAAAA] hover:text-white'
                }`}
              >
                <TagIcon className="w-3 h-3 text-[#FF4D4D]" />
                <span>{tag.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Category Filter Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-[#272727]">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
              activeTab === cat.id
                ? 'bg-[#F1F1F1] text-[#0F0F0F] font-bold shadow-md'
                : 'bg-[#212121] text-[#AAAAAA] hover:text-white hover:bg-[#2A2A2A]'
            }`}
          >
            <span>{cat.label}</span>
            {cat.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === cat.id ? 'bg-black/15 text-black' : 'bg-[#333333] text-[#AAAAAA]'
              }`}>
                {cat.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── SPONSORED BANNER (ADAPTIVE & NON-INTRUSIVE) ── */}
      <ResponsiveAdBanner className="my-4" />

      {/* ── Tailored Skeleton Loading State ── */}
      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 h-48 rounded-2xl bg-[#1E1E1E] border border-[#2A2A2A] p-5 flex flex-col justify-between">
              <div className="w-24 h-4 rounded bg-[#2E2E2E]" />
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-[#2E2E2E]" />
                <div className="space-y-2 flex-1">
                  <div className="w-3/4 h-5 rounded bg-[#2E2E2E]" />
                  <div className="w-1/2 h-3.5 rounded bg-[#2E2E2E]" />
                </div>
              </div>
              <div className="w-28 h-8 rounded-full bg-[#2E2E2E]" />
            </div>
            <div className="lg:col-span-7 space-y-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-12 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] flex items-center px-3 gap-3">
                  <div className="w-8 h-8 rounded bg-[#2E2E2E]" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-1/2 h-3.5 rounded bg-[#2E2E2E]" />
                    <div className="w-1/4 h-2.5 rounded bg-[#2E2E2E]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-14 rounded-xl bg-[#1E1E1E] border border-[#2A2A2A] flex items-center px-3 gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#2E2E2E]" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-3/5 h-3.5 rounded bg-[#2E2E2E]" />
                  <div className="w-2/5 h-2.5 rounded bg-[#2E2E2E]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Results Content ── */}
      {!loading && (
        <div className="space-y-8">
          {/* ═══ 0. DISCOVER OUR FAVOURITES & MAKE UP YOUR STYLE ═══ */}
          {!query && activeTab === 'All' && (
            <DiscoverFavoritesAndStyle
              onSearchSelect={(q) => setQuery(q)}
              onNavigate={onNavigate}
            />
          )}

          {/* ═══ 1. TOP RESULT & TOP SONGS HERO SECTION (Search Mode in 'All') ═══ */}
          {query && topResult && activeTab === 'All' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left: Top Result Card */}
              <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b from-[#252525] to-[#181818] border border-[#333333] hover:border-[#FF0000]/50 transition group shadow-xl relative overflow-hidden">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FF0000]/20 text-[#FF4D4D] border border-[#FF0000]/30 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#FF0000]" />
                      Top Result · {topResult.type.toUpperCase()}
                    </span>
                    {topResult.type === 'song' && topResult.song && (
                      <span className="text-[10px] font-mono text-[#717171]">
                        {Math.floor(topResult.song.duration / 60)}:{(topResult.song.duration % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`relative w-20 h-20 sm:w-24 sm:h-24 overflow-hidden shrink-0 shadow-xl ${
                      topResult.type === 'artist' ? 'rounded-full border-2 border-white/20' : 'rounded-xl'
                    }`}>
                      <img
                        src={topResult.image}
                        alt={topResult.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      {playback.currentSong?.id === topResult.song?.id && playback.isPlaying && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="flex items-end gap-0.5 h-4">
                            <span className="w-1 bg-[#FF0000] animate-bounce h-3 rounded-full" />
                            <span className="w-1 bg-[#FF0000] animate-bounce delay-75 h-4 rounded-full" />
                            <span className="w-1 bg-[#FF0000] animate-bounce delay-150 h-2 rounded-full" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3
                        onClick={() => {
                          if (topResult.type === 'artist') {
                            onNavigate(`/artist/${encodeURIComponent(topResult.targetArtist || topResult.title)}`);
                          } else if (topResult.song) {
                            handlePlaySong(topResult.song);
                          }
                        }}
                        className="text-lg sm:text-xl font-bold text-white truncate cursor-pointer hover:text-[#FF4D4D] transition"
                      >
                        {topResult.title}
                      </h3>
                      <p
                        onClick={() => onNavigate(`/artist/${encodeURIComponent(topResult.artist)}`)}
                        className="text-xs text-[#AAAAAA] hover:text-[#FF4D4D] hover:underline cursor-pointer truncate mt-1"
                      >
                        {topResult.subtitle}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    {topResult.type === 'song' && topResult.song ? (
                      <>
                        <button
                          onClick={() => handlePlaySong(topResult.song!)}
                          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition shadow-lg hover:scale-105 cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                          <span>Play Now</span>
                        </button>
                        <button
                          onClick={() => radioEngine.startRadio(topResult.song!)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#2A2A2A] hover:bg-[#383838] text-[#CCCCCC] hover:text-white text-xs font-semibold border border-[#3A3A3A] transition cursor-pointer"
                          title="Start infinite radio based on this track"
                        >
                          <Radio className="w-3.5 h-3.5 text-[#FF4D4D]" />
                          <span>Radio</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onNavigate(`/artist/${encodeURIComponent(topResult.targetArtist || topResult.title)}`)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition shadow-lg hover:scale-105 cursor-pointer"
                      >
                        <Users className="w-4 h-4" />
                        <span>View Artist</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Top 4 Matching Songs */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#AAAAAA]">Top Songs</span>
                  {songs.length > 4 && (
                    <button
                      onClick={() => setActiveTab('Songs')}
                      className="text-xs text-[#FF4D4D] hover:underline font-semibold cursor-pointer"
                    >
                      See All ({songs.length})
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {songs.slice(0, 4).map((song, i) => {
                    const isCurrent = playback.currentSong?.id === song.id && playback.isPlaying;
                    const isLiked = state.likedSongIds.includes(song.id);
                    return (
                      <div
                        key={`top-song-${song.id}-${i}`}
                        className={`flex items-center justify-between p-2 rounded-xl bg-[#1E1E1E] hover:bg-[#272727] border transition group ${
                          isCurrent ? 'border-[#FF0000]' : 'border-[#2A2A2A]'
                        }`}
                      >
                        <div
                          onClick={() => handlePlaySong(song)}
                          className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer"
                        >
                          <span className="w-5 text-center text-xs font-mono text-[#717171] font-bold">
                            {i + 1}
                          </span>
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                            <ArtworkImage song={song} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Play className="w-3.5 h-3.5 text-white fill-current ml-0.5" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate group-hover:text-[#FF4D4D] transition">
                              {song.title}
                            </p>
                            <p
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigate(`/artist/${encodeURIComponent(song.artist)}`);
                              }}
                              className="text-[11px] text-[#AAAAAA] hover:text-[#FF4D4D] hover:underline cursor-pointer truncate"
                            >
                              {song.artist}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[11px] font-mono text-[#717171] mr-1">
                            {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                          </span>
                          <button
                            onClick={() => handlePlaySong(song)}
                            className="p-1.5 rounded-lg bg-[#FF0000] text-white sm:opacity-0 sm:group-hover:opacity-100 transition cursor-pointer"
                            title="Play"
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                          <button
                            onClick={() => store.toggleLikeSong(song.id, song)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              isLiked ? 'text-[#FF0000]' : 'text-[#717171] hover:text-white hover:bg-[#272727]'
                            }`}
                            title="Like"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => handlePlayNext(song)}
                            className="p-1.5 rounded-lg text-[#717171] hover:text-white hover:bg-[#272727] transition cursor-pointer sm:opacity-0 sm:group-hover:opacity-100"
                            title="Play Next"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══ 2. SONGS RESULTS ═══ */}
          {(activeTab === 'All' || activeTab === 'Songs') && songs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#FF0000]" />
                  <span>
                    {query ? (activeTab === 'All' ? 'All Songs' : `Songs for "${query}"`) : 'Trending Music'}
                  </span>
                </h2>
                <span className="text-xs text-[#717171]">{songs.length} tracks</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {songs.map((song, index) => {
                  const isLiked = state.likedSongIds.includes(song.id);
                  const isCurrentlyPlaying = playback.currentSong?.id === song.id && playback.isPlaying;

                  return (
                    <div
                      key={`${song.id}-${index}`}
                      className={`flex items-center justify-between p-2.5 rounded-xl bg-[#212121] hover:bg-[#272727] border transition group ${
                        isCurrentlyPlaying ? 'border-[#FF0000] bg-[#261E1E]' : 'border-[#272727]'
                      }`}
                    >
                      <div
                        onClick={() => handlePlaySong(song)}
                        className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer"
                      >
                        <span className="w-5 text-center text-xs font-mono text-[#717171] font-bold">
                          {index + 1}
                        </span>

                        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                          <ArtworkImage song={song} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <Play className="w-4 h-4 text-white fill-current ml-0.5" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate group-hover:text-[#FF4D4D] transition">
                            {song.title}
                          </p>
                          <p
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate(`/artist/${encodeURIComponent(song.artist)}`);
                            }}
                            className="text-[11px] text-[#AAAAAA] hover:text-[#FF4D4D] hover:underline cursor-pointer truncate"
                            title={`View ${song.artist} page`}
                          >
                            {song.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <span className="text-[11px] font-mono text-[#717171] mr-1">
                          {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                        </span>
                        {/* Play button — always visible on mobile, hover-reveal on desktop */}
                        <button
                          onClick={() => handlePlaySong(song)}
                          className="p-1.5 rounded-lg bg-[#FF0000] text-white sm:opacity-0 sm:group-hover:opacity-100 transition cursor-pointer"
                          title="Play"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          onClick={() => store.toggleLikeSong(song.id, song)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            isLiked ? 'text-[#FF0000]' : 'text-[#717171] hover:text-white hover:bg-[#272727]'
                          }`}
                          title="Like"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={() => handlePlayNext(song)}
                          className="p-1.5 rounded-lg text-[#717171] hover:text-white hover:bg-[#272727] transition cursor-pointer sm:opacity-0 sm:group-hover:opacity-100"
                          title="Play Next"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleAddToQueue(song)}
                          className="hidden sm:flex p-1.5 rounded-lg text-[#717171] hover:text-white hover:bg-[#272727] transition cursor-pointer sm:opacity-0 sm:group-hover:opacity-100"
                          title="Add to queue"
                        >
                          <ListMusic className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleAddToPlaylist(song)}
                          className="hidden sm:flex p-1.5 rounded-lg text-[#717171] hover:text-white hover:bg-[#272727] transition cursor-pointer sm:opacity-0 sm:group-hover:opacity-100"
                          title="Add to library playlist"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ 3. ARTISTS DISCOVERY SHELF ═══ */}
          {(activeTab === 'All' || activeTab === 'Artists') && dynamicArtists.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#FF0000]" />
                    <span>{query ? `Artists matching "${query}"` : 'Popular Artists & Hitmakers'}</span>
                  </h2>
                  <p className="text-xs text-[#AAAAAA]">Click an artist to open their discography and albums</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3.5">
                {dynamicArtists.map((art) => (
                  <div
                    key={art.name}
                    onClick={() => onNavigate(`/artist/${encodeURIComponent(art.name)}`)}
                    className="group cursor-pointer p-4 rounded-2xl bg-[#212121] hover:bg-[#272727] border border-[#272727] hover:border-[#383838] transition flex items-center gap-3.5 shadow-md hover:scale-[1.02]"
                  >
                    <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border-2 border-white/10 shadow-lg">
                      <img src={art.image} alt={art.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FF4D4D] transition flex items-center gap-1">
                        <span>{art.name}</span>
                        <Sparkles className="w-3 h-3 text-[#FF0000] shrink-0" />
                      </h4>
                      <p className="text-[10px] text-[#AAAAAA] truncate mt-0.5">{art.role}</p>
                      <span className="text-[9px] font-mono text-emerald-400 font-bold block mt-1">
                        {art.listeners}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ 4. YOUTUBE MUSIC PLAYLISTS SECTION ═══ */}
          {(activeTab === 'All' || activeTab === 'Playlists') && ytPlaylists.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ListMusic className="w-4 h-4 text-[#FF0000]" />
                  <span>{query ? `Playlists for "${query}"` : 'Curated YouTube Music Playlists'}</span>
                </h2>
                <span className="text-xs text-[#717171]">{ytPlaylists.length} playlists</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ytPlaylists.map((pl) => {
                  const isProcessing = loadingPlaylistId === pl.id;
                  return (
                    <div
                      key={pl.id}
                      className="group rounded-2xl bg-[#212121] hover:bg-[#272727] border border-[#272727] hover:border-[#383838] p-4 transition flex flex-col justify-between shadow-lg"
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                        <img src={pl.thumbnail} alt={pl.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition">
                          <button
                            onClick={() => handlePlayYouTubePlaylist(pl)}
                            disabled={isProcessing}
                            className="w-10 h-10 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white flex items-center justify-center shadow-lg cursor-pointer transition hover:scale-110"
                            title="Play all tracks"
                          >
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 mb-3">
                        <h4 className="text-xs font-bold text-white line-clamp-1">{pl.title}</h4>
                        <p className="text-[11px] text-[#AAAAAA] line-clamp-2 leading-relaxed">{pl.description || `Curated by ${pl.channelTitle}`}</p>
                        <span className="text-[10px] text-[#717171] font-mono block">By {pl.channelTitle}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[#272727]">
                        <button
                          onClick={() => handlePlayYouTubePlaylist(pl)}
                          disabled={isProcessing}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#FF0000] hover:bg-[#CC0000] text-white text-[11px] font-semibold transition cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Play Now</span>
                        </button>
                        <button
                          onClick={() => handleImportYouTubePlaylist(pl)}
                          disabled={isProcessing}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#272727] hover:bg-[#383838] text-white text-[11px] font-semibold border border-[#383838] transition cursor-pointer"
                          title="Import into your library"
                        >
                          <FolderPlus className="w-3.5 h-3.5 text-[#FF0000]" />
                          <span>Import</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ 5. ALBUMS & MOVIE SOUNDTRACKS SHELF ═══ */}
          {(activeTab === 'All' || activeTab === 'Albums & Soundtracks') && dynamicAlbums.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Film className="w-4 h-4 text-[#FF0000]" />
                    <span>{query ? `Albums matching "${query}"` : 'Iconic Soundtracks & Masterwork Albums'}</span>
                  </h2>
                  <p className="text-xs text-[#AAAAAA]">Full cinematic jukeboxes and studio albums</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {dynamicAlbums.map((alb) => (
                  <div
                    key={alb.title}
                    onClick={() => onNavigate(`/album/${encodeURIComponent(alb.title)}`)}
                    className="group cursor-pointer p-3 rounded-2xl bg-[#212121] hover:bg-[#272727] border border-[#272727] hover:border-[#383838] transition space-y-2 shadow-md hover:scale-[1.02]"
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-neutral-900 shadow-sm">
                      <img src={alb.cover} alt={alb.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <div className="w-9 h-9 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-lg">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                      {alb.isMovie && (
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-bold text-white border border-white/10 uppercase">
                          OST
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-[#FF4D4D] transition">
                        {alb.title}
                      </h4>
                      <p className="text-[10px] text-[#888888] truncate">{alb.artist}</p>
                      <span className="text-[9px] text-[#FF4D4D] font-mono">{alb.year}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ 6. 24/7 CURATED AUDIO RADIOS ═══ */}
          {(activeTab === 'All' || activeTab === 'Radios') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <RadioTower className="w-4 h-4 text-[#FF0000]" />
                    <span>24/7 Curated Live Audio Radios</span>
                  </h2>
                  <p className="text-xs text-[#AAAAAA]">Infinite continuous live streaming curated for focus and relaxation</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {CURATED_DISCOVER_RADIOS.map((rad) => (
                  <div
                    key={rad.name}
                    className="p-4 rounded-2xl bg-[#212121] hover:bg-[#272727] border border-[#272727] hover:border-[#383838] transition flex items-center justify-between gap-3 shadow-md"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600/20 to-orange-600/20 border border-red-500/30 flex items-center justify-center shrink-0">
                        <rad.icon className="w-6 h-6 text-[#FF4D4D]" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] bg-[#FF0000]/20 text-[#FF4D4D] font-bold px-1.5 py-0.5 rounded uppercase font-mono">
                          {rad.tag}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate mt-1">{rad.name}</h4>
                        <p className="text-[10px] text-[#888888] flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live Stream
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        showNotification(`Connecting to ${rad.name}...`);
                        const radioResult = await MusicService.searchTracks(rad.query, 15);
                        const radioTracks = radioResult.data;
                        if (radioTracks.length > 0) {
                          audioManager.playSong(radioTracks[0]);
                          audioManager.setQueue(radioTracks.slice(1));
                          showNotification(`Now playing: ${rad.name}`);
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ 7. LIVE ROOMS RESULTS ═══ */}
          {(activeTab === 'All' || activeTab === 'Rooms') && filteredRooms.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#FF0000]" />
                <span>Live Listening Rooms</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {filteredRooms.map((room, idx) => (
                  <div
                    key={`${room.id}-${idx}`}
                    onClick={() => onNavigate(`/room/${room.id}`)}
                    className="p-3 rounded-2xl bg-[#212121] hover:bg-[#272727] border border-[#272727] cursor-pointer transition flex items-center gap-3 shadow-md"
                  >
                    <img src={room.coverUrl} alt={room.name} className="w-12 h-12 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate">{room.name}</h4>
                      <p className="text-[11px] text-[#AAAAAA] truncate">Host: {room.ownerName}</p>
                      <p className="text-[10px] text-[#FF0000] font-semibold">● {room.membersCount} listening</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ 8. SMART EMPTY STATE WITH SEARCH SUGGESTIONS ═══ */}
          {songs.length === 0 && ytPlaylists.length === 0 && (
            <div className="py-16 px-4 text-center space-y-5 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-[#212121] border border-[#2F2F2F] flex items-center justify-center mx-auto text-[#FF4D4D] shadow-lg">
                <Music2 className="w-8 h-8 opacity-80" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white">No results found for "{query}"</h3>
                <p className="text-xs text-[#888888]">
                  Check your spelling, try search terms with artist names, or tap one of these popular searches:
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {[
                  { label: 'Malayalam Hits', q: 'Malayalam hits Sushin Shyam Jakes Bejoy', icon: Music },
                  { label: 'Anirudh Ravichander', q: 'Tamil Anirudh hits AR Rahman', icon: Zap },
                  { label: 'Arijit Singh', q: 'Bollywood romantic Arijit Singh Pritam', icon: Moon },
                  { label: 'Telugu Tollywood', q: 'Telugu mass songs DSP Thaman S', icon: Flame },
                  { label: 'The Weeknd', q: 'The Weeknd', icon: Headphones },
                  { label: 'Lofi Study Beats', q: 'Lofi hip hop chill beats relax', icon: Coffee },
                  { label: 'Coldplay Hits', q: 'Coldplay hits', icon: Disc3 },
                ].map((s) => {
                  const SIcon = s.icon;
                  return (
                    <button
                      key={s.label}
                      onClick={() => setQuery(s.q)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#222222] hover:bg-[#2E2E2E] border border-[#333333] hover:border-[#FF0000]/60 text-white text-xs font-semibold transition cursor-pointer shadow-sm hover:scale-105"
                    >
                      <SIcon className="w-3.5 h-3.5 text-[#FF4D4D]" />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
