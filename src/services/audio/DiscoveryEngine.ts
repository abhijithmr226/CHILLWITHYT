/**
 * DiscoveryEngine — CHILLWITHYT's Live YouTube Music Discovery System
 * 
 * Continuously fetches fresh YouTube Data API v3 data to surface:
 * - Trending songs (mostPopular chart, India + Global)
 * - Rising songs (momentum-scored from viewCount velocity)
 * - New releases (sorted by publishedAt, last 14 days)
 * - Artist spotlights (dynamic, not hardcoded)
 * - Regional discovery (India languages + global)
 * - Radio recommendations
 * 
 * Key design principles:
 * - NEVER hardcodes artists/songs — all data from live API
 * - Gradual stale updates (no sudden jumps)
 * - Energy-efficient caching with time-window TTLs
 * - Momentum scoring (views relative to age, not just total views)
 * - Quota-aware: batched requests, smart refresh intervals
 */

import { Song } from '../../types';
import { YouTubeDataApiService, isYouTubeShort } from './YouTubeDataApi';
import { calculateCompositeScore, DEFAULT_RANKING_WEIGHTS } from './RankingConfig';
import { cleanSongTitle, normalizeArtistName, deduplicateSongs } from './SongNormalization';

// ─── Discovery Item Metadata ─────────────────────────────────────────────────

export interface DiscoveryMeta {
  firstSeenAt: number;       // epoch ms when we first discovered this track
  lastFetchedAt: number;     // epoch ms of last successful API refresh
  publishedAt?: string;      // YouTube publishedAt ISO string
  viewCount?: number;        // last known view count
  likeCount?: number;        // last known like count
  commentCount?: number;     // last known comment count
  prevViewCount?: number;    // view count at previous refresh (for velocity)
  region: string;            // 'IN' | 'US' | 'GLOBAL' | etc.
  source: DiscoverySource;
  discoveryScore: number;    // our calculated score (NOT YouTube's ranking)
  momentumScore: number;     // velocity-based rising signal
  ageHours: number;          // hours since YouTube upload
  label: DiscoveryLabel;     // UI label for the card
}

export type DiscoverySource =
  | 'chart_trending'    // YouTube mostPopular chart
  | 'search_new'        // search by recency (publishedAt last 14 days)
  | 'search_rising'     // momentum-detected
  | 'search_regional'   // region/language specific search
  | 'search_genre'      // genre-tagged search
  | 'radio_related'     // related to currently playing
  | 'search_artist'     // artist-specific search
  | 'fresh_discovery';  // surprise discovery

export type DiscoveryLabel =
  | 'Trending'
  | 'Rising fast'
  | 'New today'
  | 'New this week'
  | 'Popular in India'
  | 'Global hit'
  | 'Fresh discovery'
  | 'Evergreen'
  | 'Because you played…'
  | 'Artist spotlight'
  | string;

export interface DiscoveredSong extends Song {
  meta: DiscoveryMeta;
}

// ─── Discovery Sections ────────────────────────────────────────────────────

export type DiscoverySectionId =
  | 'quick_picks'
  | 'trending_india'
  | 'trending_global'
  | 'trending_kerala'
  | 'rising_fast'
  | 'new_releases'
  | 'regional_hindi'
  | 'regional_malayalam'
  | 'regional_tamil'
  | 'regional_telugu'
  | 'regional_kannada'
  | 'regional_punjabi'
  | 'regional_bengali'
  | 'fresh_discoveries'
  | 'artist_spotlight';

export interface DiscoverySection {
  id: DiscoverySectionId;
  title: string;
  subtitle: string;
  emoji: string;
  songs: DiscoveredSong[];
  lastUpdated: number;
  isLoading: boolean;
  /** TTL in ms — how long before this section auto-refreshes */
  ttlMs: number;
}

type DiscoveryListener = (sections: DiscoverySectionMap) => void;
type DiscoverySectionMap = Map<DiscoverySectionId, DiscoverySection>;

// ─── Cache Key ────────────────────────────────────────────────────────────

const CACHE_KEY = 'chillwithyt_discovery_v4';
const MAX_CACHE_AGE_MS = 60 * 60 * 1000; // 1 hour max cache

// ─── Discovery Search Queries (dynamic pools, NOT hardcoded artists) ───────
// These are search intent strings, not static artist lists.
// The actual artists returned are fully dynamic from YouTube.

const currentYear = new Date().getFullYear();

const DISCOVERY_QUERIES = {
  trending_india: [
    `trending music India ${currentYear} official audio`,
    'top songs India this week official audio',
    `India viral music ${currentYear} official`,
  ],
  trending_global: [
    `Billboard Hot 100 ${currentYear} official audio`,
    `global hits ${currentYear} official audio`,
    `top worldwide music ${currentYear} official`,
  ],
  new_releases: [
    `new music release ${currentYear} official audio`,
    'latest songs released this month official audio',
    `new song release today ${currentYear} official`,
  ],
  rising_fast: [
    `rising viral songs ${currentYear} official audio`,
    `trending new song ${currentYear} official audio`,
    `new hit song gaining fast ${currentYear} official`,
  ],
  regional_hindi: [
    `Bollywood new songs ${currentYear} official audio`,
    `Hindi hit songs ${currentYear} official audio`,
    `top Hindi music ${currentYear} official`,
  ],
  regional_malayalam: [
    `Malayalam new songs ${currentYear} official audio`,
    'Malayalam hit songs this month official',
    `Mollywood trending ${currentYear} official audio`,
  ],
  regional_tamil: [
    `Tamil new songs ${currentYear} official audio`,
    `Kollywood trending ${currentYear} official audio`,
    'Tamil hit songs this week official',
  ],
  regional_telugu: [
    `Telugu new songs ${currentYear} official audio`,
    `Tollywood trending ${currentYear} official audio`,
    'Telugu hit songs this month official',
  ],
  regional_punjabi: [
    `Punjabi new songs ${currentYear} official audio`,
    'Punjabi trending music this week official',
    `latest Punjabi hit songs ${currentYear} official`,
  ],
  regional_bengali: [
    `Bengali new songs ${currentYear} official audio`,
    `Bengali trending music ${currentYear} official`,
    'latest Bengali hit songs official audio',
  ],
  regional_kannada: [
    `Kannada new songs ${currentYear} official audio`,
    `Sandalwood trending music ${currentYear} official`,
    'latest Kannada hit songs official audio',
  ],
  trending_kerala: [
    `trending Malayalam songs ${currentYear} official audio`,
    'top Malayalam music this month official audio',
    `Kerala viral hits ${currentYear} official`,
  ],
  fresh_discoveries: [
    `hidden gem music ${currentYear} official audio`,
    `underrated music ${currentYear} official audio`,
    `indie music gems ${currentYear} official`,
    `emerging artists music ${currentYear} official audio`,
  ],
};

// ─── Section Configuration ─────────────────────────────────────────────────

const SECTION_CONFIG: Record<DiscoverySectionId, {
  title: string; subtitle: string; emoji: string;
  ttlMs: number; count: number; region: string;
  source: DiscoverySource; queryKey: keyof typeof DISCOVERY_QUERIES;
  label: DiscoveryLabel;
}> = {
  quick_picks:        { title: 'Quick Picks', subtitle: 'For you right now', emoji: '⚡', ttlMs: 30*60*1000, count: 12, region: 'IN', source: 'chart_trending', queryKey: 'trending_india', label: 'Trending' },
  trending_india:     { title: 'Trending in India', subtitle: 'YouTube mostPopular · India', emoji: '🇮🇳', ttlMs: 20*60*1000, count: 15, region: 'IN', source: 'chart_trending', queryKey: 'trending_india', label: 'Popular in India' },
  trending_global:    { title: 'Global Hits', subtitle: 'Top charts worldwide', emoji: '🌐', ttlMs: 30*60*1000, count: 12, region: 'GLOBAL', source: 'chart_trending', queryKey: 'trending_global', label: 'Global hit' },
  trending_kerala:    { title: 'Kerala & Mollywood Top', subtitle: 'Kerala viral & cinema hits', emoji: '🌴', ttlMs: 30*60*1000, count: 12, region: 'IN', source: 'search_regional', queryKey: 'trending_kerala', label: 'Popular in Kerala' },
  rising_fast:        { title: 'Rising Fast', subtitle: 'Momentum scoring · gaining quickly', emoji: '📈', ttlMs: 15*60*1000, count: 12, region: 'IN', source: 'search_rising', queryKey: 'rising_fast', label: 'Rising fast' },
  new_releases:       { title: 'New Music', subtitle: 'Released recently', emoji: '🆕', ttlMs: 20*60*1000, count: 12, region: 'IN', source: 'search_new', queryKey: 'new_releases', label: 'New this week' },
  regional_hindi:     { title: 'Bollywood & Hindi', subtitle: 'Hindi cinema & pop hits', emoji: '🎬', ttlMs: 45*60*1000, count: 10, region: 'IN', source: 'search_regional', queryKey: 'regional_hindi', label: 'Popular in India' },
  regional_malayalam: { title: 'Malayalam Hits', subtitle: 'Mollywood & Kerala music', emoji: '🌴', ttlMs: 45*60*1000, count: 10, region: 'IN', source: 'search_regional', queryKey: 'regional_malayalam', label: 'Popular in India' },
  regional_tamil:     { title: 'Tamil & Kollywood', subtitle: 'Kollywood & Tamil pop', emoji: '🎵', ttlMs: 45*60*1000, count: 10, region: 'IN', source: 'search_regional', queryKey: 'regional_tamil', label: 'Popular in India' },
  regional_telugu:    { title: 'Telugu & Tollywood', subtitle: 'Tollywood mass & melody', emoji: '🔥', ttlMs: 45*60*1000, count: 10, region: 'IN', source: 'search_regional', queryKey: 'regional_telugu', label: 'Popular in India' },
  regional_kannada:   { title: 'Kannada & Sandalwood', subtitle: 'Sandalwood melodies & beats', emoji: '🎶', ttlMs: 45*60*1000, count: 10, region: 'IN', source: 'search_regional', queryKey: 'regional_kannada', label: 'Popular in India' },
  regional_punjabi:   { title: 'Punjabi Beats', subtitle: 'Punjab & Haryana sounds', emoji: '💥', ttlMs: 45*60*1000, count: 10, region: 'IN', source: 'search_regional', queryKey: 'regional_punjabi', label: 'Popular in India' },
  regional_bengali:   { title: 'Bengali Music', subtitle: 'Bangla cinema & pop', emoji: '🎶', ttlMs: 60*60*1000, count: 10, region: 'IN', source: 'search_regional', queryKey: 'regional_bengali', label: 'Popular in India' },
  fresh_discoveries:  { title: 'Fresh Discoveries', subtitle: 'Hidden gems · off the beaten path', emoji: '🔍', ttlMs: 60*60*1000, count: 10, region: 'GLOBAL', source: 'fresh_discovery', queryKey: 'fresh_discoveries', label: 'Fresh discovery' },
  artist_spotlight:   { title: 'Artist Spotlight', subtitle: 'Dynamic · changes with trends', emoji: '🎤', ttlMs: 60*60*1000, count: 12, region: 'IN', source: 'search_artist', queryKey: 'trending_india', label: 'Artist spotlight' },
};

// ─── API Key ──────────────────────────────────────────────────────────────

const API_KEY = (typeof window !== 'undefined' && (window as any).__VITE_YT_KEY)
  || import.meta.env?.VITE_YOUTUBE_API_KEY
  || 'AIzaSyADsbonv9b2xYBXTHnTJhaEFBKx4dMRRXU';

// ─── Momentum / Discovery Scorer ──────────────────────────────────────────

/**
 * CHILLWITHYT Discovery Score
 * 
 * This is NOT YouTube's recommendation algorithm.
 * This is our own adaptive score using publicly available API signals.
 * 
 * Components:
 * 1. Recency bonus   — newer uploads score higher (decays over weeks)
 * 2. Velocity bonus  — view count growth since last check
 * 3. Engagement rate — likeCount / viewCount ratio
 * 4. Absolute views  — normalized baseline popularity
 */
function calculateDiscoveryScores(
  viewCount: number,
  likeCount: number,
  commentCount: number,
  publishedAt: string | undefined,
  prevViewCount: number | undefined,
  refreshIntervalHours: number,
  context?: { targetLanguage?: string; targetRegion?: string; songTitle?: string; artistName?: string }
): { discoveryScore: number; momentumScore: number; ageHours: number } {
  const scores = calculateCompositeScore(
    {
      viewCount,
      likeCount,
      commentCount,
      publishedAt,
      prevViewCount,
      refreshIntervalHours,
    },
    context,
    DEFAULT_RANKING_WEIGHTS
  );

  // Momentum score combines velocity and recency
  const momentumScore = Math.round((scores.velocityScore * 0.6 + scores.freshnessScore * 0.4) * 1000) / 1000;

  return {
    discoveryScore: scores.finalScore,
    momentumScore,
    ageHours: scores.ageHours,
  };
}

// ─── YouTube API helpers ───────────────────────────────────────────────────

function decodeHtml(text: string): string {
  if (!text) return '';
  const el = document.createElement('textarea');
  el.innerHTML = text;
  return el.value;
}

function parseIsoDuration(d: string): number {
  if (!d) return 210;
  const m = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 210;
  return (parseInt(m[1] || '0') * 3600) + (parseInt(m[2] || '0') * 60) + parseInt(m[3] || '0');
}

/** Fetch from YouTube mostPopular chart (category 10 = Music) */
async function fetchChartTrending(region: string, count: number): Promise<DiscoveredSong[]> {
  try {
    let url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&chart=mostPopular&videoCategoryId=10&maxResults=${Math.min(count * 2, 50)}&key=${API_KEY}`;
    if (region && region !== 'GLOBAL') url += `&regionCode=${region}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Chart API ${res.status}`);
    const data = await res.json();

    const rawSongs: DiscoveredSong[] = (data.items || []).flatMap((item: any) => {
      const rawTitle = decodeHtml(item.snippet?.title || 'Track');
      const rawArtist = decodeHtml(item.snippet?.channelTitle || 'Artist');
      const title = cleanSongTitle(rawTitle);
      const artist = normalizeArtistName(rawArtist);
      const desc = item.snippet?.description || '';
      const dur = parseIsoDuration(item.contentDetails?.duration || '');
      if (isYouTubeShort(title, desc, dur)) return [];

      const viewCount = parseInt(item.statistics?.viewCount || '0');
      const likeCount = parseInt(item.statistics?.likeCount || '0');
      const commentCount = parseInt(item.statistics?.commentCount || '0');
      const publishedAt = item.snippet?.publishedAt;
      const scores = calculateDiscoveryScores(viewCount, likeCount, commentCount, publishedAt, undefined, 0.5, {
        targetRegion: region,
        songTitle: title,
        artistName: artist,
      });

      const artwork = item.snippet?.thumbnails?.maxres?.url
        || item.snippet?.thumbnails?.high?.url
        || `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`;

      return [{
        id: `yt-${item.id}`,
        source: 'youtube' as const,
        sourceId: item.id,
        title,
        artist,
        artwork,
        duration: dur || 210,
        tags: ['Trending', region],
        meta: {
          firstSeenAt: Date.now(),
          lastFetchedAt: Date.now(),
          publishedAt,
          viewCount,
          likeCount,
          commentCount,
          region,
          source: 'chart_trending' as DiscoverySource,
          label: region === 'IN' ? 'Popular in India' : 'Global hit',
          ...scores,
        },
      }];
    });

    return deduplicateSongs(rawSongs).slice(0, count);
  } catch (e) {
    console.warn('DiscoveryEngine chart fetch error:', e);
    return [];
  }
}

/** Fetch from search.list, sorted by date (new releases) or relevance (rising/regional) */
async function fetchSearchBased(
  query: string,
  count: number,
  region: string,
  source: DiscoverySource,
  label: DiscoveryLabel,
  orderBy: 'date' | 'relevance' | 'viewCount' = 'relevance'
): Promise<DiscoveredSong[]> {
  try {
    const fetchCount = Math.min(count * 2, 50);
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=${fetchCount}&order=${orderBy}&q=${encodeURIComponent(query)}&key=${API_KEY}${region && region !== 'GLOBAL' ? `&regionCode=${region}` : ''}`;

    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) throw new Error(`Search API ${searchRes.status}`);
    const searchData = await searchRes.json();

    const items = searchData.items || [];
    const videoIds: string[] = items.map((i: any) => i.id?.videoId).filter(Boolean);
    if (!videoIds.length) return [];

    // Enrich with statistics + contentDetails
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${API_KEY}`;
    const detailsRes = await fetch(detailsUrl);
    if (!detailsRes.ok) throw new Error(`Details API ${detailsRes.status}`);
    const detailsData = await detailsRes.json();

    const rawSongs: DiscoveredSong[] = (detailsData.items || []).flatMap((item: any) => {
      const rawTitle = decodeHtml(item.snippet?.title || 'Track');
      const rawArtist = decodeHtml(item.snippet?.channelTitle || 'Artist');
      const title = cleanSongTitle(rawTitle);
      const artist = normalizeArtistName(rawArtist);
      const desc = item.snippet?.description || '';
      const dur = parseIsoDuration(item.contentDetails?.duration || '');
      if (isYouTubeShort(title, desc, dur)) return [];

      const viewCount = parseInt(item.statistics?.viewCount || '0');
      const likeCount = parseInt(item.statistics?.likeCount || '0');
      const commentCount = parseInt(item.statistics?.commentCount || '0');
      const publishedAt = item.snippet?.publishedAt;
      const scores = calculateDiscoveryScores(viewCount, likeCount, commentCount, publishedAt, undefined, 1, {
        targetRegion: region,
        songTitle: title,
        artistName: artist,
      });

      const artwork = item.snippet?.thumbnails?.maxres?.url
        || item.snippet?.thumbnails?.high?.url
        || `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`;

      return [{
        id: `yt-${item.id}`,
        source: 'youtube' as const,
        sourceId: item.id,
        title,
        artist,
        artwork,
        duration: dur || 210,
        tags: [label, region],
        meta: {
          firstSeenAt: Date.now(),
          lastFetchedAt: Date.now(),
          publishedAt,
          viewCount,
          likeCount,
          commentCount,
          region,
          source,
          label,
          ...scores,
        },
      }];
    });

    return deduplicateSongs(rawSongs).slice(0, count);
  } catch (e) {
    console.warn('DiscoveryEngine search error, attempting YouTubeDataApiService fallback:', e);
    try {
      const fallbackSongs = await YouTubeDataApiService.searchVideos(query, count);
      return fallbackSongs.map((s) => ({
        ...s,
        meta: {
          firstSeenAt: Date.now(),
          lastFetchedAt: Date.now(),
          region,
          source,
          label,
          discoveryScore: 0.7,
          momentumScore: 0.6,
          ageHours: 24,
        },
      }));
    } catch {
      return [];
    }
  }
}

// ─── Discovery Engine Singleton ──────────────────────────────────────────

class DiscoveryEngineClass {
  private static instance: DiscoveryEngineClass;
  private sections: DiscoverySectionMap = new Map();
  private listeners: Set<DiscoveryListener> = new Set();
  private refreshTimers: Map<DiscoverySectionId, ReturnType<typeof setTimeout>> = new Map();
  private loadQueue: DiscoverySectionId[] = [];
  private isProcessingQueue = false;

  private constructor() {
    this.initSections();
    this.loadFromCache();
    this.startDiscovery();
  }

  public static getInstance(): DiscoveryEngineClass {
    if (!DiscoveryEngineClass.instance) {
      DiscoveryEngineClass.instance = new DiscoveryEngineClass();
    }
    return DiscoveryEngineClass.instance;
  }

  public subscribe(fn: DiscoveryListener): () => void {
    this.listeners.add(fn);
    fn(new Map(this.sections));
    return () => this.listeners.delete(fn);
  }

  public getSections(): DiscoverySectionMap {
    return new Map(this.sections);
  }

  public getSection(id: DiscoverySectionId): DiscoverySection | undefined {
    return this.sections.get(id);
  }

  public refreshSection(id: DiscoverySectionId) {
    if (!this.loadQueue.includes(id)) {
      this.loadQueue.unshift(id); // priority refresh
    }
    this.processLoadQueue();
  }

  // ── Private ─────────────────────────────────────────────────────────────

  private initSections() {
    for (const [id, cfg] of Object.entries(SECTION_CONFIG)) {
      this.sections.set(id as DiscoverySectionId, {
        id: id as DiscoverySectionId,
        title: cfg.title,
        subtitle: cfg.subtitle,
        emoji: cfg.emoji,
        songs: [],
        lastUpdated: 0,
        isLoading: false,
        ttlMs: cfg.ttlMs,
      });
    }
  }

  private loadFromCache() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return;
      const parsed = JSON.parse(cached) as { sections: [string, any][] };
      for (const [id, section] of parsed.sections) {
        if (this.sections.has(id as DiscoverySectionId)) {
          const existing = this.sections.get(id as DiscoverySectionId)!;
          const age = Date.now() - (section.lastUpdated || 0);
          if (age < MAX_CACHE_AGE_MS && section.songs?.length > 0) {
            this.sections.set(id as DiscoverySectionId, { ...existing, ...section, isLoading: false });
          }
        }
      }
      this.notify();
    } catch { /* ignore */ }
  }

  private saveToCache() {
    try {
      const entries = [...this.sections.entries()].map(([id, s]) => [id, {
        songs: s.songs,
        lastUpdated: s.lastUpdated,
      }]);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ sections: entries }));
    } catch { /* storage full etc */ }
  }

  private startDiscovery() {
    // Stagger initial loads to spread API quota
    const sectionIds = Object.keys(SECTION_CONFIG) as DiscoverySectionId[];
    
    // Priority order: trending India first, then others
    const prioritized = [
      'quick_picks', 'trending_india', 'rising_fast', 'new_releases',
      'trending_global', 'regional_hindi', 'regional_tamil', 'regional_malayalam',
      'regional_telugu', 'regional_punjabi', 'regional_bengali',
      'fresh_discoveries', 'artist_spotlight',
    ] as DiscoverySectionId[];

    // Queue all sections for initial load
    for (const id of prioritized) {
      const section = this.sections.get(id);
      if (section && section.songs.length === 0) {
        this.loadQueue.push(id);
      }
    }
    this.processLoadQueue();

    // Schedule periodic refresh for each section based on its TTL
    for (const id of sectionIds) {
      this.scheduleRefresh(id);
    }
  }

  private scheduleRefresh(id: DiscoverySectionId) {
    const section = this.sections.get(id);
    if (!section) return;
    if (this.refreshTimers.has(id)) clearTimeout(this.refreshTimers.get(id)!);

    const timer = setTimeout(() => {
      if (!this.loadQueue.includes(id)) {
        this.loadQueue.push(id);
      }
      this.processLoadQueue();
      this.scheduleRefresh(id); // re-schedule
    }, section.ttlMs + Math.random() * 60000); // jitter ±1min to avoid thundering herd

    this.refreshTimers.set(id, timer);
  }

  /** Process one section at a time with ~1.5s gap to avoid rate limits */
  private async processLoadQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.loadQueue.length > 0) {
      const id = this.loadQueue.shift()!;
      await this.loadSection(id);
      await new Promise(r => setTimeout(r, 1200)); // quota gap between sections
    }

    this.isProcessingQueue = false;
  }

  private async loadSection(id: DiscoverySectionId) {
    const cfg = SECTION_CONFIG[id];
    const section = this.sections.get(id);
    if (!section || section.isLoading) return;

    // Mark loading
    this.sections.set(id, { ...section, isLoading: true });
    this.notify();

    try {
      let songs: DiscoveredSong[] = [];

      // Rotate query for variety on each refresh
      const queries = DISCOVERY_QUERIES[cfg.queryKey];
      const query = queries[Math.floor(Math.random() * queries.length)];

      if (cfg.source === 'chart_trending') {
        songs = await fetchChartTrending(cfg.region, cfg.count);
        // Fallback to search if chart fails
        if (songs.length < 3) {
          songs = await fetchSearchBased(query, cfg.count, cfg.region, cfg.source, cfg.label, 'viewCount');
        }
      } else if (cfg.source === 'search_new') {
        songs = await fetchSearchBased(query, cfg.count, cfg.region, cfg.source, cfg.label, 'date');
      } else if (cfg.source === 'search_rising') {
        songs = await fetchSearchBased(query, cfg.count * 2, cfg.region, cfg.source, cfg.label, 'relevance');
        // Sort by momentum score for rising
        songs = songs.sort((a, b) => b.meta.momentumScore - a.meta.momentumScore).slice(0, cfg.count);
      } else {
        songs = await fetchSearchBased(query, cfg.count, cfg.region, cfg.source, cfg.label, 'relevance');
      }

      // Merge with existing (gradual update: keep old songs that are still good)
      const existing = section.songs;
      const merged = this.gradualMerge(existing, songs, cfg.count);

      this.sections.set(id, {
        ...section,
        songs: merged,
        lastUpdated: Date.now(),
        isLoading: false,
      });

      this.saveToCache();
    } catch (e) {
      console.warn(`DiscoveryEngine: section ${id} failed:`, e);
      this.sections.set(id, { ...section, isLoading: false });
    }

    this.notify();
  }

  /**
   * Gradual merge: don't replace everything at once.
   * Keep 40% of old songs if they're still "fresh" (< 2h old),
   * add new songs, remove truly stale ones.
   */
  private gradualMerge(
    existing: DiscoveredSong[],
    incoming: DiscoveredSong[],
    maxCount: number
  ): DiscoveredSong[] {
    const incomingIds = new Set(incoming.map(s => s.id));
    const now = Date.now();
    const staleMs = 2 * 60 * 60 * 1000; // 2 hours

    // Keep existing that are still fresh and not replaced
    const kept = existing.filter(s =>
      !incomingIds.has(s.id) &&
      (now - s.meta.lastFetchedAt) < staleMs
    ).slice(0, Math.floor(maxCount * 0.3)); // keep max 30% old

    // Combine: new songs first, then kept
    const merged = [...incoming, ...kept];

    // Deduplicate using canonical song keys
    return deduplicateSongs(merged).slice(0, maxCount);
  }

  private notify() {
    const snap = new Map(this.sections);
    this.listeners.forEach(fn => fn(snap));
  }
}

export const DiscoveryEngine = DiscoveryEngineClass.getInstance();
