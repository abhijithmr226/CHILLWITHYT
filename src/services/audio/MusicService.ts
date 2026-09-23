/**
 * MusicService — Centralized Music Data Gateway & Cache Layer
 * 
 * Objectives:
 * 1. Strict YouTube API quota protection with category-specific TTLs.
 * 2. In-flight promise sharing (zero duplicate parallel requests).
 * 3. Graceful fallback on API failure (serves cached data with age indicator).
 * 4. Automatic duplicate filtering and scoring integration.
 */

import { Song } from '../../types';
import { YouTubeDataApiService } from './YouTubeDataApi';
import { deduplicateSongs, normalizeSearchQuery, rankSearchResults, cleanDisplayMetadata } from './SongNormalization';
import { calculateCompositeScore, SongMetrics } from './RankingConfig';
import { DEFAULT_TRACKS } from './DefaultMusicProvider';

export interface CacheEntry<T> {
  data: T;
  timestamp: number; // epoch ms
  expiresAt: number; // epoch ms
}

export interface CachedResult<T> {
  data: T;
  isStale: boolean;
  lastUpdatedLabel: string;
  fromCache: boolean;
}

const CACHE_PREFIX = 'chillwithyt_music_cache_v1_';

// Default TTLs in milliseconds
export const CACHE_TTLS = {
  trending: 15 * 60 * 1000,         // 15 minutes
  new_releases: 30 * 60 * 1000,     // 30 minutes
  language_trending: 25 * 60 * 1000,// 25 minutes
  radio_seeds: 2 * 60 * 60 * 1000,  // 2 hours
  search: 10 * 60 * 1000,           // 10 minutes
  artist: 24 * 60 * 60 * 1000,      // 24 hours
};

class MusicServiceClass {
  private static instance: MusicServiceClass;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private inFlightRequests: Map<string, Promise<any>> = new Map();

  private constructor() {
    this.hydrateFromStorage();
  }

  public static getInstance(): MusicServiceClass {
    if (!MusicServiceClass.instance) {
      MusicServiceClass.instance = new MusicServiceClass();
    }
    return MusicServiceClass.instance;
  }

  // ─── Storage Helpers ───────────────────────────────────────────────────────

  private hydrateFromStorage() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const entry: CacheEntry<any> = JSON.parse(raw);
            const cacheKey = key.replace(CACHE_PREFIX, '');
            // Only keep if not expired by more than 24 hours (for offline fallback)
            if (Date.now() - entry.timestamp < 48 * 60 * 60 * 1000) {
              this.memoryCache.set(cacheKey, entry);
            }
          }
        }
      }
    } catch {
      // LocalStorage access restricted or full
    }
  }

  private persistEntry<T>(key: string, entry: CacheEntry<T>) {
    this.memoryCache.set(key, entry);
    try {
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
    } catch {
      // Storage quota exceeded
    }
  }

  private formatAgeLabel(timestamp: number): string {
    const elapsedMinutes = Math.floor((Date.now() - timestamp) / 60000);
    if (elapsedMinutes < 1) return 'Just now';
    if (elapsedMinutes === 1) return '1m ago';
    if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
    const hours = Math.floor(elapsedMinutes / 60);
    return `${hours}h ago`;
  }

  // ─── Generic Cached Request Runner ─────────────────────────────────────────

  public async fetchCached<T>(
    cacheKey: string,
    ttlMs: number,
    fetchFn: () => Promise<T>,
    fallbackData?: T
  ): Promise<CachedResult<T>> {
    const cached = this.memoryCache.get(cacheKey);
    const now = Date.now();

    // Valid cache hit
    if (cached && now < cached.expiresAt) {
      return {
        data: cached.data,
        isStale: false,
        lastUpdatedLabel: this.formatAgeLabel(cached.timestamp),
        fromCache: true,
      };
    }

    // In-flight request deduplication
    if (this.inFlightRequests.has(cacheKey)) {
      try {
        const data = await this.inFlightRequests.get(cacheKey);
        return {
          data,
          isStale: false,
          lastUpdatedLabel: 'Just now',
          fromCache: false,
        };
      } catch {
        // Handled below
      }
    }

    // Execute live request
    const requestPromise = (async () => {
      try {
        const result = await fetchFn();
        const entry: CacheEntry<T> = {
          data: result,
          timestamp: Date.now(),
          expiresAt: Date.now() + ttlMs,
        };
        this.persistEntry(cacheKey, entry);
        return result;
      } finally {
        this.inFlightRequests.delete(cacheKey);
      }
    })();

    this.inFlightRequests.set(cacheKey, requestPromise);

    try {
      const data = await requestPromise;
      return {
        data,
        isStale: false,
        lastUpdatedLabel: 'Just now',
        fromCache: false,
      };
    } catch (err) {
      console.warn(`MusicService: live fetch failed for [${cacheKey}]:`, err);
      // Serve stale cache if available
      if (cached) {
        return {
          data: cached.data,
          isStale: true,
          lastUpdatedLabel: this.formatAgeLabel(cached.timestamp),
          fromCache: true,
        };
      }
      // Fallback data if provided
      if (fallbackData) {
        return {
          data: fallbackData,
          isStale: true,
          lastUpdatedLabel: 'Default',
          fromCache: true,
        };
      }
      throw err;
    }
  }

  // ─── Public Music Data Pipelines ───────────────────────────────────────────

  /**
   * 1. Get Trending Music (Region-specific)
   */
  public async getTrending(regionCode = 'IN', maxResults = 20): Promise<CachedResult<Song[]>> {
    const key = `trending_${regionCode}_${maxResults}`;
    return this.fetchCached(key, CACHE_TTLS.trending, async () => {
      const raw = await YouTubeDataApiService.getTrendingMusic(maxResults * 2, regionCode);
      return deduplicateSongs(raw).slice(0, maxResults);
    });
  }

  /**
   * 2. Get Language-Specific Trending Pool
   */
  public async getLanguageTrending(language: string, maxResults = 16): Promise<CachedResult<Song[]>> {
    const key = `lang_trending_${language.toLowerCase()}_${maxResults}`;
    return this.fetchCached(key, CACHE_TTLS.language_trending, async () => {
      const currentYear = new Date().getFullYear();
      const queries: Record<string, string> = {
        malayalam: `Malayalam hit songs ${currentYear} official audio Sushin Shyam`,
        tamil: `Tamil hit songs ${currentYear} official audio Anirudh Ravichander`,
        telugu: `Telugu hit songs ${currentYear} official audio DSP Thaman S`,
        hindi: `Bollywood hit songs ${currentYear} official audio Arijit Singh`,
        punjabi: `Punjabi trending songs ${currentYear} official audio Diljit Dosanjh`,
        kannada: `Kannada new hit songs ${currentYear} official audio`,
        bengali: `Bengali hit songs ${currentYear} official audio`,
        english: `Billboard Hot 100 top songs ${currentYear} official audio`,
      };

      const q = queries[language.toLowerCase()] || `${language} hit songs ${currentYear} official audio`;
      const raw = await YouTubeDataApiService.searchVideos(q, maxResults * 2);
      return deduplicateSongs(raw).slice(0, maxResults);
    });
  }

  /**
   * 3. Get New Releases (Published in the last 14 days)
   */
  public async getNewReleases(genreOrLanguage = 'All', maxResults = 16): Promise<CachedResult<Song[]>> {
    const key = `new_releases_${genreOrLanguage.toLowerCase()}_${maxResults}`;
    return this.fetchCached(key, CACHE_TTLS.new_releases, async () => {
      const currentYear = new Date().getFullYear();
      let query = `new music release ${currentYear} official audio`;
      if (genreOrLanguage.toLowerCase() !== 'all') {
        query = `${genreOrLanguage} new songs ${currentYear} official audio`;
      }
      const raw = await YouTubeDataApiService.searchVideos(query, maxResults * 2);
      return deduplicateSongs(raw).slice(0, maxResults);
    });
  }

  /**
   * 4. Unified Search with normalizer and caching
   */
  public async searchTracks(query: string, maxResults = 25, bypassCache = false): Promise<CachedResult<Song[]>> {
    const normalizedQuery = normalizeSearchQuery(query);
    const key = `search_${normalizedQuery.toLowerCase()}_${maxResults}`;
    if (bypassCache) {
      const raw = await YouTubeDataApiService.searchVideos(normalizedQuery, maxResults);
      const ranked = rankSearchResults(raw, query);
      return {
        data: ranked,
        isStale: false,
        lastUpdatedLabel: 'Just now',
        fromCache: false,
      };
    }
    return this.fetchCached(key, CACHE_TTLS.search, async () => {
      let raw = await YouTubeDataApiService.searchVideos(normalizedQuery, maxResults);
      if (!raw || raw.length === 0) {
        const q = normalizedQuery.toLowerCase();
        const tokens = q.split(/\s+/).filter(Boolean);
        raw = DEFAULT_TRACKS.filter((s) => {
          const t = s.title.toLowerCase();
          const a = s.artist.toLowerCase();
          const alb = (s.album || '').toLowerCase();
          return (
            t.includes(q) ||
            a.includes(q) ||
            alb.includes(q) ||
            (tokens.length > 1 && tokens.every((tok) => t.includes(tok) || a.includes(tok) || alb.includes(tok))) ||
            (s.tags && s.tags.some((tag) => tag.toLowerCase().includes(q)))
          );
        });
      }
      return rankSearchResults(raw, query);
    });
  }

  /**
   * Real-time search suggestions via YouTube Autocomplete with fallback
   */
  public async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query.trim()) return [];
    try {
      const suggestions = await YouTubeDataApiService.getSearchSuggestions(query);
      if (suggestions && suggestions.length > 0) return suggestions;
    } catch {
      // Fallback below
    }

    const q = query.toLowerCase();
    const matches = new Set<string>();
    for (const track of DEFAULT_TRACKS) {
      if (track.title.toLowerCase().includes(q)) matches.add(track.title);
      if (track.artist.toLowerCase().includes(q)) matches.add(track.artist);
    }
    return Array.from(matches).slice(0, 8);
  }

  /**
   * Paginated search for deep song discovery (20, 40, 60+ songs)
   */
  public async searchTracksPaginated(
    query: string,
    maxResults = 25,
    continuationToken?: string
  ): Promise<{ data: Song[]; nextPageToken?: string }> {
    const normalizedQuery = normalizeSearchQuery(query);
    if (!normalizedQuery && !continuationToken) {
      return { data: [] };
    }

    try {
      const res = await YouTubeDataApiService.searchVideosPaginated(
        normalizedQuery,
        maxResults,
        continuationToken,
        false
      );
      return {
        data: deduplicateSongs(res.songs),
        nextPageToken: res.nextPageToken,
      };
    } catch (e) {
      console.warn('searchTracksPaginated failed:', e);
      return { data: [] };
    }
  }

  /**
   * 5. Intelligent Recommendations for a Specific Song
   * Generates highly relevant, regional/genre-aware recommendations when a user likes or plays a song
   */
  public async getRecommendationsForSong(seed: Song, count = 8): Promise<Song[]> {
    const currentYear = new Date().getFullYear();
    const cleanTitle = seed.title.replace(/[^\w\s]/gi, ' ').trim();
    const cleanArtist = seed.artist.replace(/\s*-\s*Topic$/i, '').trim();

    // Multi-angle query strategies for deep Indian & global context
    const queries = [
      `${cleanArtist} top hit songs official audio`,
      `${cleanTitle} ${cleanArtist} similar songs official`,
      `${cleanArtist} hit songs ${currentYear} official audio`,
    ];

    // Detect language or regional flavor if present in tags or title
    const combinedText = `${seed.title} ${seed.artist} ${(seed.tags || []).join(' ')}`.toLowerCase();
    if (combinedText.includes('malayalam') || combinedText.includes('kerala') || combinedText.includes('sushin')) {
      queries.push(`Malayalam hit songs ${currentYear} official audio`);
    } else if (combinedText.includes('tamil') || combinedText.includes('anirudh') || combinedText.includes('kollywood')) {
      queries.push(`Tamil trending songs ${currentYear} official audio`);
    } else if (combinedText.includes('telugu') || combinedText.includes('dsp') || combinedText.includes('thaman')) {
      queries.push(`Telugu hit songs ${currentYear} official audio`);
    } else if (combinedText.includes('hindi') || combinedText.includes('bollywood') || combinedText.includes('arijit')) {
      queries.push(`Bollywood hit songs ${currentYear} official audio`);
    } else if (combinedText.includes('punjabi') || combinedText.includes('diljit') || combinedText.includes('karan aujla')) {
      queries.push(`Punjabi trending songs ${currentYear} official audio`);
    }

    try {
      const results = await Promise.allSettled(
        queries.map((q) => YouTubeDataApiService.searchVideos(q, 8))
      );

      const combined: Song[] = [];
      for (const res of results) {
        if (res.status === 'fulfilled') {
          combined.push(...res.value);
        }
      }

      // Filter out self, duplicate tracks, and short clips
      const deduplicated = deduplicateSongs(
        combined.filter((s) => s.id !== seed.id && s.sourceId !== seed.sourceId && s.duration >= 80)
      );

      return deduplicated.slice(0, count);
    } catch (e) {
      console.warn('getRecommendationsForSong error:', e);
      return [];
    }
  }
}

export const MusicService = MusicServiceClass.getInstance();
