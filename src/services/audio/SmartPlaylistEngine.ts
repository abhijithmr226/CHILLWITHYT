import { Song, Playlist } from '../../types';
import { YouTubeDataApiService } from './YouTubeDataApi';

export interface DailyMixConfig {
  id: string;
  mixNumber: number;
  title: string;
  subtitle: string;
  artists: string[];
  searchQuery: string;
  coverGradient: string;
  coverImage: string;
  vibe: string;
}

export interface SmartPlaylistPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  searchQuery: string;
  coverImage: string;
  gradient: string;
  targetCount: number;
}

// 6 Curated Spotify-style Daily Mixes combining related artists & vibes
export const DAILY_MIX_CONFIGS: DailyMixConfig[] = [
  {
    id: 'daily-mix-1',
    mixNumber: 1,
    title: 'Daily Mix 1',
    subtitle: 'Sushin Shyam, Anirudh Ravichander, Rex Vijayan & Santhosh Narayanan',
    artists: ['Sushin Shyam', 'Anirudh', 'Rex Vijayan', 'Santhosh Narayanan'],
    searchQuery: 'Malayalam Tamil superhit songs Sushin Shyam Anirudh official audio',
    coverGradient: 'from-amber-600 via-rose-700 to-stone-900',
    coverImage: 'https://img.youtube.com/vi/HUAAYwtusLI/hqdefault.jpg',
    vibe: '🌴 South Waves',
  },
  {
    id: 'daily-mix-2',
    mixNumber: 2,
    title: 'Daily Mix 2',
    subtitle: 'Arijit Singh, Pritam, Shreya Ghoshal & Jasleen Royal',
    artists: ['Arijit Singh', 'Pritam', 'Shreya Ghoshal', 'Jasleen Royal'],
    searchQuery: 'Bollywood romantic soulful hits Arijit Singh Pritam official audio',
    coverGradient: 'from-indigo-700 via-purple-800 to-neutral-900',
    coverImage: 'https://img.youtube.com/vi/6RdS6wLu7RY/hqdefault.jpg',
    vibe: '🌙 Bollywood Romance',
  },
  {
    id: 'daily-mix-3',
    mixNumber: 3,
    title: 'Daily Mix 3',
    subtitle: 'Diljit Dosanjh, Karan Aujla, AP Dhillon & Shubh',
    artists: ['Diljit Dosanjh', 'Karan Aujla', 'AP Dhillon', 'Shubh'],
    searchQuery: 'Punjabi hip hop trap hits Diljit Dosanjh Karan Aujla official audio',
    coverGradient: 'from-red-600 via-orange-700 to-black',
    coverImage: 'https://img.youtube.com/vi/cl0a3i2wFcc/hqdefault.jpg',
    vibe: '💥 Punjabi Club',
  },
  {
    id: 'daily-mix-4',
    mixNumber: 4,
    title: 'Daily Mix 4',
    subtitle: 'Devi Sri Prasad (DSP), Thaman S, Sid Sriram & Anurag Kulkarni',
    artists: ['DSP', 'Thaman S', 'Sid Sriram', 'Anurag Kulkarni'],
    searchQuery: 'Telugu mass and melody superhits DSP Thaman Sid Sriram official audio',
    coverGradient: 'from-yellow-600 via-red-800 to-stone-900',
    coverImage: 'https://img.youtube.com/vi/CKpbdCciELk/hqdefault.jpg',
    vibe: '🔥 Tollywood Mass',
  },
  {
    id: 'daily-mix-5',
    mixNumber: 5,
    title: 'Daily Mix 5',
    subtitle: 'The Weeknd, Bruno Mars, Dua Lipa, Billie Eilish & Post Malone',
    artists: ['The Weeknd', 'Bruno Mars', 'Dua Lipa', 'Billie Eilish'],
    searchQuery: 'Billboard Hot 100 pop hits The Weeknd Bruno Mars official audio',
    coverGradient: 'from-blue-700 via-cyan-800 to-slate-900',
    coverImage: 'https://img.youtube.com/vi/fHI8X4OXluQ/hqdefault.jpg',
    vibe: '🎧 Global Billboard',
  },
  {
    id: 'daily-mix-6',
    mixNumber: 6,
    title: 'Daily Mix 6',
    subtitle: 'Lofi Girl, ChilledCow, Rainy Coffee & Midnight Chill Beats',
    artists: ['Lofi Girl', 'ChilledCow', 'Kudasai', 'Idealism'],
    searchQuery: 'lofi hip hop beats relax study chill cozy official',
    coverGradient: 'from-emerald-700 via-teal-900 to-black',
    coverImage: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    vibe: '☕ Late Night Lofi',
  },
];

const currentYear = new Date().getFullYear();

// Spotify-inspired Smart Playlist Archetypes based on how most people listen
export const SMART_PLAYLIST_PRESETS: SmartPlaylistPreset[] = [
  {
    id: 'today-most-listened',
    name: "Today's Most Listened (India Top 20)",
    badge: '🔥 Chart Leader',
    description: 'The definitive ranking of songs with the most listens today across India. Updated continuously.',
    searchQuery: `top trending music songs India ${currentYear} official audio`,
    coverImage: 'https://img.youtube.com/vi/3wDiqlTNlfQ/hqdefault.jpg',
    gradient: 'from-[#FF0000] to-[#800000]',
    targetCount: 20,
  },
  {
    id: 'south-wave-viral',
    name: 'South Wave: Malayalam & Tamil Viral',
    badge: '🌴 High Energy',
    description: 'Sushin Shyam, Anirudh Ravichander, and the newest trending cinema tracks making waves.',
    searchQuery: 'Malayalam Tamil viral hits Aavesham Leo Manjummel Boys official audio',
    coverImage: 'https://img.youtube.com/vi/HUAAYwtusLI/hqdefault.jpg',
    gradient: 'from-emerald-600 to-teal-900',
    targetCount: 18,
  },
  {
    id: 'late-night-drive',
    name: 'Late Night Long Drive & Soul',
    badge: '🌙 Chill Vibes',
    description: 'Mellow acoustics, slow reverb, and heartfelt melodies for open highways after dark.',
    searchQuery: 'late night drive acoustic Hindi English soulful songs official audio',
    coverImage: 'https://img.youtube.com/vi/6RdS6wLu7RY/hqdefault.jpg',
    gradient: 'from-purple-700 to-slate-900',
    targetCount: 16,
  },
  {
    id: 'gym-beast-mode',
    name: 'High-Voltage Workout & Bass',
    badge: '⚡ Pure Adrenaline',
    description: 'Heavy 808 bass, Punjabi trap, and electronic drops engineered to smash your personal records.',
    searchQuery: 'workout motivation bass boosted Punjabi trap songs official audio',
    coverImage: 'https://img.youtube.com/vi/cl0a3i2wFcc/hqdefault.jpg',
    gradient: 'from-orange-600 to-red-900',
    targetCount: 18,
  },
  {
    id: 'deep-work-lofi',
    name: 'Deep Focus & Coding Beats',
    badge: '☕ Focus Mode',
    description: 'Instrumental chillhop, gentle vinyl crackle, and no lyrics so you can enter effortless flow.',
    searchQuery: 'lofi study focus coding instrumental beats relax official',
    coverImage: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    gradient: 'from-cyan-700 to-blue-950',
    targetCount: 15,
  },
  {
    id: 'global-pop-pulse',
    name: 'Global Billboard Hot 100 Pulse',
    badge: '🌐 Worldwide Hits',
    description: 'The highest-streaming international songs ruling charts across Spotify, YouTube, and Apple Music.',
    searchQuery: `Billboard Hot 100 top pop songs ${currentYear} official audio`,
    coverImage: 'https://img.youtube.com/vi/fHI8X4OXluQ/hqdefault.jpg',
    gradient: 'from-pink-600 to-indigo-900',
    targetCount: 20,
  },
];

// In-memory cache for trending charts & generated playlists to conserve API quota and ensure instant UI
const cache = {
  charts: new Map<string, { tracks: Song[]; timestamp: number }>(),
  dailyMixes: new Map<string, { tracks: Song[]; timestamp: number }>(),
};

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export class SmartPlaylistEngine {
  /**
   * 1. Get real-time trending chart tracks with ranking (#1, #2, #3, ...)
   * Uses real YouTube Data API v3 trending music, filtered strictly against shorts.
   */
  public static async getTodayTopCharts(regionCode = 'IN'): Promise<{ tracks: Song[]; lastUpdated: string }> {
    const cached = cache.charts.get(regionCode);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return {
        tracks: cached.tracks,
        lastUpdated: new Date(cached.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    try {
      const items = await YouTubeDataApiService.getTrendingMusic(20, regionCode);
      const filtered = items.filter(s => s.duration >= 80);

      cache.charts.set(regionCode, {
        tracks: filtered,
        timestamp: now,
      });

      return {
        tracks: filtered,
        lastUpdated: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    } catch {
      return {
        tracks: [],
        lastUpdated: 'Live',
      };
    }
  }

  /**
   * 2. Automatically generate a full playlist from a Spotify-style Smart Preset
   * Returns a ready-to-save Playlist and track array with zero shorts.
   */
  public static async generatePlaylistFromPreset(
    presetId: string,
    userName = 'ChillWithYT Curator'
  ): Promise<{ playlist: Playlist; tracks: Song[] }> {
    const preset = SMART_PLAYLIST_PRESETS.find(p => p.id === presetId) || SMART_PLAYLIST_PRESETS[0];

    // Query real YouTube Data API with music-specific keywords
    const tracks = await YouTubeDataApiService.searchVideos(preset.searchQuery, preset.targetCount);

    // Secondary strict verification: ensure duration >= 80s (no shorts)
    const verifiedTracks = tracks.filter(t => t.duration >= 80);

    const totalDuration = verifiedTracks.reduce((sum, t) => sum + (t.duration || 210), 0);

    const playlist: Playlist = {
      id: `smart-${preset.id}-${Date.now()}`,
      name: preset.name,
      description: `${preset.description} • Auto-created based on community listening trends.`,
      coverUrl: verifiedTracks[0]?.artwork || preset.coverImage,
      ownerId: 'smart-algorithm',
      ownerName: userName,
      songsCount: verifiedTracks.length,
      totalDuration,
      privacy: 'public',
      isCollaborative: false,
      songs: verifiedTracks,
      createdAt: new Date().toISOString(),
    };

    return { playlist, tracks: verifiedTracks };
  }

  /**
   * 3. Fetch tracks for a Spotify-style Daily Mix
   */
  public static async getDailyMixTracks(mixId: string): Promise<Song[]> {
    const config = DAILY_MIX_CONFIGS.find(m => m.id === mixId);
    if (!config) return [];

    const cached = cache.dailyMixes.get(mixId);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.tracks;
    }

    try {
      const tracks = await YouTubeDataApiService.searchVideos(config.searchQuery, 15);
      const verified = tracks.filter(t => t.duration >= 80);

      if (verified.length > 0) {
        cache.dailyMixes.set(mixId, {
          tracks: verified,
          timestamp: now,
        });
      }

      return verified;
    } catch {
      return [];
    }
  }

  /**
   * 4. Dynamic Auto-Playlist Generator from any Artist, Genre, or Mood
   * e.g. user types "Anirudh fast pace" or "Arijit Singh soulful"
   */
  public static async generateCustomSmartPlaylist(
    promptOrArtist: string,
    userName = 'ChillWithYT Curator'
  ): Promise<{ playlist: Playlist; tracks: Song[] }> {
    const cleanPrompt = promptOrArtist.trim();
    const query = `${cleanPrompt} best songs official audio full track`;

    const rawTracks = await YouTubeDataApiService.searchVideos(query, 18);
    const verifiedTracks = rawTracks.filter(t => t.duration >= 80);

    const totalDuration = verifiedTracks.reduce((sum, t) => sum + (t.duration || 210), 0);
    const coverUrl =
      verifiedTracks[0]?.artwork ||
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

    const playlist: Playlist = {
      id: `smart-mix-${Date.now()}`,
      name: `${cleanPrompt} Smart Mix`,
      description: `Custom algorithmic mix generated from "${cleanPrompt}". Verified full-length tracks with zero shorts.`,
      coverUrl,
      ownerId: 'smart-algorithm',
      ownerName: userName,
      songsCount: verifiedTracks.length,
      totalDuration,
      privacy: 'public',
      isCollaborative: false,
      songs: verifiedTracks,
      createdAt: new Date().toISOString(),
    };

    return { playlist, tracks: verifiedTracks };
  }

  /**
   * 5. Spotify Autoplay (Infinite Radio):
   * When queue runs out, automatically find the next best track matching the current song
   * without repeating already played songs and strictly excluding shorts!
   */
  public static async getNextAutoplayTrack(
    currentSong: Song,
    playedSongIds: Set<string>
  ): Promise<Song | null> {
    try {
      // Formulate query using artist and title cues
      const query = `${currentSong.artist} similar songs official audio`;
      const candidates = await YouTubeDataApiService.searchVideos(query, 8);

      for (const song of candidates) {
        if (!playedSongIds.has(song.id) && song.id !== currentSong.id && song.duration >= 80) {
          return song;
        }
      }

      // Fallback: search by genre/tags
      const tagQuery = (currentSong.tags && currentSong.tags[0]) || 'trending music';
      const fallbackCandidates = await YouTubeDataApiService.searchVideos(`${tagQuery} top songs official audio`, 8);
      for (const song of fallbackCandidates) {
        if (!playedSongIds.has(song.id) && song.id !== currentSong.id && song.duration >= 80) {
          return song;
        }
      }

      return null;
    } catch {
      return null;
    }
  }
}
