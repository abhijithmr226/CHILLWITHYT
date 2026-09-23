import { Song } from '../../types';

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || 'AIzaSyADsbonv9b2xYBXTHnTJhaEFBKx4dMRRXU';

export interface RegionOption {
  code: string;
  name: string;
  flag: string;
}

export const YOUTUBE_REGIONS: RegionOption[] = [
  { code: 'IN', name: 'India (All Regions)', flag: '🇮🇳' },
  { code: 'GLOBAL', name: 'Global Top Hits', flag: '🌐' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
];

export interface YouTubePlaylistResult {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  thumbnail: string;
  itemCount?: number;
}

// Helper to decode HTML entities in YouTube snippet titles
function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

// Convert ISO 8601 duration string (e.g. PT3M45S, PT1H2M10S) to seconds
function parseIsoDuration(duration: string): number {
  if (!duration) return 210;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 210;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

// Convert MM:SS or HH:MM:SS string to seconds
export function parseTimeStringToSeconds(timeStr: string): number {
  if (!timeStr) return 210;
  const parts = timeStr.trim().split(':').map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return 210;
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 210;
}

/**
 * Filter out YouTube Shorts, vertical clips, ringtones, and snippets.
 * Real full-length music songs are at least 80 seconds long.
 */
export function isYouTubeShort(title: string, description: string, durationSeconds: number): boolean {
  // Any video shorter than 80 seconds is considered a Short/teaser/snippet
  if (durationSeconds > 0 && durationSeconds < 80) {
    return true;
  }

  const text = `${title} ${description}`.toLowerCase();
  if (/#shorts?\b/.test(text)) return true;
  if (/\bshorts\b/.test(text)) return true;
  if (/\b#short\b/.test(text)) return true;
  if (/\bwhatsapp status\b/.test(text)) return true;
  if (/\bstatus video\b/.test(text)) return true;
  if (/\b30\s*(?:sec|seconds|s)\b/.test(text)) return true;
  if (/\breels?\b/.test(text)) return true;
  if (/\btiktok\b/.test(text)) return true;
  if (/\bringtone\b/.test(text)) return true;
  if (/\bsnippet\b/.test(text)) return true;
  if (/\bbgm status\b/.test(text)) return true;
  if (/\blyrics status\b/.test(text)) return true;
  if (/\bteaser\b/.test(text) && durationSeconds < 120) return true;
  if (/\btrailer\b/.test(text) && durationSeconds < 150) return true;
  if (/\bpromo\b/.test(text) && durationSeconds < 120) return true;

  return false;
}

export interface PaginatedSearchResponse {
  songs: Song[];
  nextPageToken?: string;
  totalResults?: number;
}

export class YouTubeDataApiService {
  // Query to NextPageToken rotation cache to automatically advance pages on repeated searches
  private static queryPageTokens: Map<string, string> = new Map();

  // 1. Live Search YouTube Music Videos (Filtered against Shorts, with pagination support)
  public static async searchVideos(query: string, maxResults = 25, pageToken?: string): Promise<Song[]> {
    const res = await YouTubeDataApiService.searchVideosPaginated(query, maxResults, pageToken);
    return res.songs;
  }

  // 1b. Paginated Search returning songs and nextPageToken
  public static async searchVideosPaginated(
    query: string,
    maxResults = 25,
    pageToken?: string,
    autoAdvancePage = true
  ): Promise<PaginatedSearchResponse> {
    if (!query.trim()) return { songs: [] };

    try {
      // Request 1.5x to account for shorts filtering
      const fetchCount = Math.min(maxResults * 2, 50);
      const effectivePageToken = pageToken || (autoAdvancePage ? YouTubeDataApiService.queryPageTokens.get(query.trim().toLowerCase()) : undefined);

      let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=${fetchCount}&q=${encodeURIComponent(
        query
      )}&key=${API_KEY}`;

      if (effectivePageToken) {
        searchUrl += `&pageToken=${encodeURIComponent(effectivePageToken)}`;
      }

      const res = await fetch(searchUrl);
      if (!res.ok) {
        console.warn('YouTube Data API response error:', res.status, '— Falling back to unlimited InnerTube search');
        return await YouTubeDataApiService.searchInnerTubeDetailed(query, maxResults, effectivePageToken);
      }

      const data = await res.json();
      if (!data.items || !Array.isArray(data.items)) {
        return await YouTubeDataApiService.searchInnerTubeDetailed(query, maxResults, effectivePageToken);
      }

      // Update next page token in rotation map
      if (data.nextPageToken) {
        YouTubeDataApiService.queryPageTokens.set(query.trim().toLowerCase(), data.nextPageToken);
      } else {
        YouTubeDataApiService.queryPageTokens.delete(query.trim().toLowerCase());
      }

      const videoIds = data.items
        .map((item: any) => item.id?.videoId)
        .filter(Boolean);

      // Fetch video details with durations and filter out Shorts
      const songs = await YouTubeDataApiService.getVideoDetails(videoIds, data.items);
      
      if (songs.length === 0) {
        const fallbackSongs = await YouTubeDataApiService.searchInnerTube(query, maxResults);
        if (fallbackSongs.length > 0) {
          return { songs: fallbackSongs.slice(0, maxResults) };
        }
      }

      return {
        songs: songs.slice(0, maxResults),
        nextPageToken: data.nextPageToken,
        totalResults: data.pageInfo?.totalResults,
      };
    } catch (e) {
      console.warn('YouTube search exception, falling back to InnerTube:', e);
      const fallbackSongs = await YouTubeDataApiService.searchInnerTube(query, maxResults);
      return { songs: fallbackSongs };
    }
  }

  /**
   * Fetch real-time search suggestions via YouTube Suggest endpoint
   */
  public static async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query.trim()) return [];

    try {
      const url = `/api/yt-suggest?client=firefox&ds=yt&q=${encodeURIComponent(query.trim())}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // data format: [query, [suggestion1, suggestion2, ...]]
        if (Array.isArray(data) && Array.isArray(data[1])) {
          return data[1].slice(0, 10);
        }
      }
    } catch {
      // Fallback to local
    }

    return [];
  }

  /**
   * Search YouTube directly via InnerTube endpoint with continuation token support
   * (Bypasses Google API key, CORS, and 429 quota)
   */
  public static async searchInnerTubeDetailed(
    query: string,
    maxResults = 25,
    continuationToken?: string
  ): Promise<PaginatedSearchResponse> {
    if (!query.trim() && !continuationToken) return { songs: [] };

    const endpoints = [
      '/api/yt-innertube',
      'https://www.youtube.com/youtubei/v1/search'
    ];

    for (const endpoint of endpoints) {
      try {
        const reqBody = continuationToken
          ? {
              context: {
                client: {
                  clientName: 'WEB',
                  clientVersion: '2.20231201.00.00',
                  hl: 'en',
                  gl: 'IN',
                },
              },
              continuation: continuationToken,
            }
          : {
              context: {
                client: {
                  clientName: 'WEB',
                  clientVersion: '2.20231201.00.00',
                  hl: 'en',
                  gl: 'IN',
                },
              },
              query,
            };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reqBody),
        });

        if (!res.ok) continue;

        const data = await res.json();
        const songs: Song[] = [];
        let nextContinuationToken: string | undefined;

        if (!continuationToken) {
          // Page 1 initial response format
          const sections =
            data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

          for (const s of sections) {
            if (s.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token) {
              nextContinuationToken = s.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
            }

            const items = s.itemSectionRenderer?.contents || [];
            for (const item of items) {
              const v = item.videoRenderer;
              if (!v || !v.videoId) continue;

              const title =
                v.title?.runs?.map((r: any) => r.text).join('') || v.title?.simpleText || 'YouTube Song';
              const artist =
                v.ownerText?.runs?.map((r: any) => r.text).join('') || 'YouTube Music';
              const durationStr = v.lengthText?.simpleText || '';
              const duration = parseTimeStringToSeconds(durationStr);

              // Filter out Shorts
              if (isYouTubeShort(title, '', duration)) continue;

              const artwork =
                v.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
                `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`;

              songs.push({
                id: `yt-${v.videoId}`,
                source: 'youtube',
                sourceId: v.videoId,
                title: decodeHtmlEntities(title),
                artist: decodeHtmlEntities(artist),
                artwork,
                duration: duration > 0 ? duration : 210,
                tags: ['YouTube', 'Music'],
              });

              if (songs.length >= maxResults) break;
            }
            if (songs.length >= maxResults) break;
          }
        } else {
          // Continuation subsequent pages format
          const contActions = data.onResponseReceivedCommands || [];
          for (const action of contActions) {
            const items = action.appendContinuationItemsAction?.continuationItems || [];
            for (const item of items) {
              if (item.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token) {
                nextContinuationToken = item.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
              }

              if (item.itemSectionRenderer?.contents) {
                for (const c of item.itemSectionRenderer.contents) {
                  const v = c.videoRenderer;
                  if (!v || !v.videoId) continue;

                  const title =
                    v.title?.runs?.map((r: any) => r.text).join('') || v.title?.simpleText || 'YouTube Song';
                  const artist =
                    v.ownerText?.runs?.map((r: any) => r.text).join('') || 'YouTube Music';
                  const durationStr = v.lengthText?.simpleText || '';
                  const duration = parseTimeStringToSeconds(durationStr);

                  if (isYouTubeShort(title, '', duration)) continue;

                  const artwork =
                    v.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
                    `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`;

                  songs.push({
                    id: `yt-${v.videoId}`,
                    source: 'youtube',
                    sourceId: v.videoId,
                    title: decodeHtmlEntities(title),
                    artist: decodeHtmlEntities(artist),
                    artwork,
                    duration: duration > 0 ? duration : 210,
                    tags: ['YouTube', 'Music'],
                  });

                  if (songs.length >= maxResults) break;
                }
              }
              if (songs.length >= maxResults) break;
            }
          }
        }

        if (songs.length > 0) {
          return { songs, nextPageToken: nextContinuationToken };
        }
      } catch {
        // Continue to next endpoint
      }
    }

    return { songs: [] };
  }

  /**
   * Simple wrapper for backward compatibility
   */
  public static async searchInnerTube(query: string, maxResults = 25): Promise<Song[]> {
    const res = await YouTubeDataApiService.searchInnerTubeDetailed(query, maxResults);
    return res.songs;
  }

  // 2. Fetch Video Details & Durations (Strictly excluding Shorts)
  public static async getVideoDetails(videoIds: string[], snippetFallback: any[] = []): Promise<Song[]> {
    if (videoIds.length === 0) return [];

    try {
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds.join(
        ','
      )}&key=${API_KEY}`;

      const res = await fetch(detailsUrl);
      if (!res.ok) throw new Error('Details fetch failed');

      const data = await res.json();
      const items = data.items || [];

      const filteredSongs: Song[] = [];

      for (const item of items) {
        const title = decodeHtmlEntities(item.snippet?.title || 'YouTube Track');
        const artist = decodeHtmlEntities(item.snippet?.channelTitle || 'YouTube Creator');
        const description = item.snippet?.description || '';
        const duration = parseIsoDuration(item.contentDetails?.duration);

        // Filter out Shorts!
        if (isYouTubeShort(title, description, duration)) {
          continue;
        }

        const artwork =
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`;

        filteredSongs.push({
          id: `yt-${item.id}`,
          source: 'youtube' as const,
          sourceId: item.id,
          title,
          artist,
          artwork,
          duration: duration > 0 ? duration : 210,
          tags: ['YouTube', 'Music'],
        });
      }

      return filteredSongs;
    } catch {
      // Fallback: exclude any snippets with #shorts
      return snippetFallback
        .filter((item: any) => !isYouTubeShort(item.snippet?.title || '', item.snippet?.description || '', 200))
        .map((item: any) => ({
          id: `yt-${item.id?.videoId}`,
          source: 'youtube' as const,
          sourceId: item.id?.videoId,
          title: decodeHtmlEntities(item.snippet?.title || 'YouTube Track'),
          artist: decodeHtmlEntities(item.snippet?.channelTitle || 'YouTube Artist'),
          artwork: item.snippet?.thumbnails?.high?.url || `https://img.youtube.com/vi/${item.id?.videoId}/hqdefault.jpg`,
          duration: 210,
          tags: ['YouTube'],
        }));
    }
  }

  // 3. Fetch Real Regional Trending Music (Excluding Shorts)
  public static async getTrendingMusic(maxResults = 25, regionCode = 'IN'): Promise<Song[]> {
    try {
      const fetchCount = Math.min(maxResults * 2, 50);
      let url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&chart=mostPopular&videoCategoryId=10&maxResults=${fetchCount}&key=${API_KEY}`;
      if (regionCode && regionCode !== 'GLOBAL') {
        url += `&regionCode=${encodeURIComponent(regionCode)}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        console.warn('Trending music API error, falling back to InnerTube');
        const fallbackQuery = regionCode === 'IN' ? 'Top trending hit songs India official audio' : 'Billboard Hot 100 top music hits official audio';
        return await YouTubeDataApiService.searchInnerTube(fallbackQuery, maxResults);
      }

      const data = await res.json();
      const items = data.items || [];

      const songs: Song[] = [];

      for (const item of items) {
        const title = decodeHtmlEntities(item.snippet?.title || 'Trending Track');
        const artist = decodeHtmlEntities(item.snippet?.channelTitle || 'YouTube Music');
        const description = item.snippet?.description || '';
        const duration = parseIsoDuration(item.contentDetails?.duration);

        // Filter out Shorts!
        if (isYouTubeShort(title, description, duration)) {
          continue;
        }

        const artwork =
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`;

        songs.push({
          id: `yt-${item.id}`,
          source: 'youtube' as const,
          sourceId: item.id,
          title,
          artist,
          artwork,
          duration: duration > 0 ? duration : 210,
          tags: ['Trending', regionCode !== 'GLOBAL' ? regionCode : 'Hot'],
        });
      }

      if (songs.length === 0) {
        const fallbackQuery = regionCode === 'IN' ? 'Top trending hit songs India official audio' : 'Billboard Hot 100 top music hits official audio';
        return await YouTubeDataApiService.searchInnerTube(fallbackQuery, maxResults);
      }

      return songs.slice(0, maxResults);
    } catch (e) {
      console.warn('Trending music API error, falling back to InnerTube:', e);
      const fallbackQuery = regionCode === 'IN' ? 'Top trending hit songs India official audio' : 'Billboard Hot 100 top music hits official audio';
      return await YouTubeDataApiService.searchInnerTube(fallbackQuery, maxResults);
    }
  }

  // 4. Music-Focused High Quality Recommendations Engine
  public static async getMusicRecommendations(genreOrLanguage = 'All', maxResults = 12): Promise<Song[]> {
    const currentYear = new Date().getFullYear();
    let searchQuery = `top hit songs ${currentYear} official audio`;

    const l = genreOrLanguage.toLowerCase();
    if (l.includes('malayalam')) {
      searchQuery = 'Malayalam hit songs Sushin Shyam Rex Vijayan official audio';
    } else if (l.includes('tamil')) {
      searchQuery = 'Tamil superhit songs Anirudh AR Rahman official audio';
    } else if (l.includes('telugu')) {
      searchQuery = 'Telugu superhit songs DSP Thaman Sid Sriram official audio';
    } else if (l.includes('hindi') || l.includes('bollywood')) {
      searchQuery = 'Bollywood romantic songs Arijit Singh Pritam official audio';
    } else if (l.includes('punjabi')) {
      searchQuery = 'Punjabi hit songs Diljit Dosanjh Karan Aujla official audio';
    } else if (l.includes('lofi')) {
      searchQuery = 'Lofi hip hop beats study relax cozy official';
    } else if (l.includes('english') || l.includes('pop')) {
      searchQuery = 'Billboard Hot 100 hit songs The Weeknd Taylor Swift official audio';
    }

    return await YouTubeDataApiService.searchVideos(searchQuery, maxResults);
  }

  // 5. Live Search YouTube Playlists
  public static async searchPlaylists(query: string, maxResults = 12): Promise<YouTubePlaylistResult[]> {
    if (!query.trim()) return [];

    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=playlist&maxResults=${maxResults}&q=${encodeURIComponent(
        query + ' full album music playlist'
      )}&key=${API_KEY}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Playlist search failed');

      const data = await res.json();
      const items = data.items || [];

      return items
        .filter((item: any) => item.id?.playlistId)
        .map((item: any) => ({
          id: item.id.playlistId,
          title: decodeHtmlEntities(item.snippet?.title || 'YouTube Playlist'),
          description: decodeHtmlEntities(item.snippet?.description || ''),
          channelTitle: decodeHtmlEntities(item.snippet?.channelTitle || 'YouTube Curator'),
          thumbnail:
            item.snippet?.thumbnails?.high?.url ||
            item.snippet?.thumbnails?.medium?.url ||
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        }));
    } catch (e) {
      console.warn('Playlist search error:', e);
      return [];
    }
  }

  // 6. Fetch Real YouTube Playlist Tracks (Strictly excluding Shorts)
  public static async getPlaylistVideos(playlistId: string, maxResults = 30): Promise<Song[]> {
    if (!playlistId.trim()) return [];

    try {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(
        playlistId
      )}&maxResults=${Math.min(maxResults * 2, 50)}&key=${API_KEY}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Playlist items fetch failed with status ${res.status}`);

      const data = await res.json();
      const items = data.items || [];

      const videoIds = items
        .map((item: any) => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId)
        .filter(Boolean);

      if (videoIds.length === 0) return [];

      const songs = await YouTubeDataApiService.getVideoDetails(videoIds, items);
      return songs.slice(0, maxResults);
    } catch (e) {
      console.warn('Error fetching playlist videos:', e);
      return [];
    }
  }

  // 7. Extract Playlist ID from URL or Raw ID
  public static extractPlaylistId(input: string): string | null {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();

    // Standard list= parameter
    const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (listMatch && listMatch[1]) {
      return listMatch[1];
    }

    // Direct playlist ID (e.g. PL..., RD..., OLAK5uy_...)
    if (/^(PL|RD|OLAK5uy_)[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return trimmed;
    }

    return null;
  }

  // 8. Curated Real YouTube Music Playlists (Indian Regional & Global)
  public static getCuratedPlaylists(): YouTubePlaylistResult[] {
    return [
      {
        id: 'PL_rXc1ssylNfT3H9vIwiSMNyDM_tgpWnX',
        title: 'Malayalam Superhits & Sushin Vibe 🌴',
        description: 'Aavesham, Manjummel Boys, Sushin Shyam, Rex Vijayan & Kerala hits.',
        channelTitle: 'Mollywood Music Central',
        thumbnail: 'https://img.youtube.com/vi/HUAAYwtusLI/hqdefault.jpg',
        itemCount: 45,
      },
      {
        id: 'PL_DaWb6RFQc2UqJNHQ1TQ9RB-uACJ-ZNv',
        title: 'Tamil Kollywood & Anirudh Hits ⚡',
        description: 'Rockstar Anirudh Ravichander, AR Rahman, Yuvan Shankar Raja & Leo hits.',
        channelTitle: 'Kollywood Beats HQ',
        thumbnail: 'https://img.youtube.com/vi/3wDiqlTNlfQ/hqdefault.jpg',
        itemCount: 50,
      },
      {
        id: 'PL4sNEU2Mgm6bNnbM-qKPmTwwDromFqpMQ',
        title: 'Telugu Tollywood Melodies & Mass 🔥',
        description: 'DSP, Thaman S, Sid Sriram & Telugu cinema blockbusters.',
        channelTitle: 'Tollywood Hits Radio',
        thumbnail: 'https://img.youtube.com/vi/CKpbdCciELk/hqdefault.jpg',
        itemCount: 40,
      },
      {
        id: 'PLEGmrLqbpWRuwnQ5Eqt2rrdBrGfI21tu1',
        title: 'Bollywood Romance & Arijit Singh 🌙',
        description: 'Arijit Singh, Pritam, Shreya Ghoshal & late night soulful Hindi tunes.',
        channelTitle: 'Bollywood Love Network',
        thumbnail: 'https://img.youtube.com/vi/6RdS6wLu7RY/hqdefault.jpg',
        itemCount: 60,
      },
      {
        id: 'PLtOCRDWv_u1h_kLNGFXT6k-4NAJxnovte',
        title: 'Punjabi Heat: Diljit & Karan Aujla 💥',
        description: 'Heavy bass, street anthems and chart-topping Punjabi trap.',
        channelTitle: 'Punjabi Wave Records',
        thumbnail: 'https://img.youtube.com/vi/cl0a3i2wFcc/hqdefault.jpg',
        itemCount: 35,
      },
      {
        id: 'PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj',
        title: 'Global Billboard & Pop Hits 🎧',
        description: 'The world\'s most popular and trending pop hits updated weekly.',
        channelTitle: 'Pop Hits Central',
        thumbnail: 'https://img.youtube.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
        itemCount: 50,
      },
      {
        id: 'RDCLAK5uy_lRr70m6uTvLpxAG3G6Yuc41cJBIXODAws',
        title: 'Living Room Lofi & Chill Beats ☕',
        description: 'Mellow beats, cozy vibes and relaxed instrumentals directly from YouTube Music.',
        channelTitle: 'YouTube Music Lofi',
        thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
        itemCount: 40,
      },
    ];
  }
}
