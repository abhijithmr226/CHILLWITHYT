/**
 * SmartAIPlaylistGenerator — Natural Language Prompt to Curated Playlist Engine
 * 
 * Allows users to type any natural prompt (e.g. "Late night rainy drive in Kerala",
 * "High energy workout Tollywood & Punjabi trap", "90s ARR & SPB evergreen nostalgia")
 * and converts it into a production-grade 12-15 track playlist with custom artwork.
 */

import { Song, Playlist } from '../../types';
import { YouTubeDataApiService } from './YouTubeDataApi';
import { deduplicateSongs } from './SongNormalization';
import { calculateCompositeScore } from './RankingConfig';

export interface GeneratedPlaylistResult {
  title: string;
  description: string;
  coverUrl: string;
  songs: Song[];
  mood: string;
  detectedLanguage: string;
}

export class SmartAIPlaylistGenerator {
  /**
   * Generates a complete themed playlist from any natural language prompt
   */
  public static async generateFromPrompt(prompt: string): Promise<GeneratedPlaylistResult> {
    const cleanPrompt = prompt.trim();
    const pLower = cleanPrompt.toLowerCase();
    const currentYear = new Date().getFullYear();

    // 1. Detect language / regional context
    let detectedLanguage = 'Mixed';
    let langQueryModifier = '';

    if (pLower.includes('malayalam') || pLower.includes('kerala') || pLower.includes('kochi') || pLower.includes('sushin')) {
      detectedLanguage = 'Malayalam';
      langQueryModifier = 'Malayalam';
    } else if (pLower.includes('tamil') || pLower.includes('chennai') || pLower.includes('anirudh') || pLower.includes('kollywood')) {
      detectedLanguage = 'Tamil';
      langQueryModifier = 'Tamil';
    } else if (pLower.includes('telugu') || pLower.includes('hyderabad') || pLower.includes('tollywood') || pLower.includes('dsp') || pLower.includes('thaman')) {
      detectedLanguage = 'Telugu';
      langQueryModifier = 'Telugu';
    } else if (pLower.includes('hindi') || pLower.includes('bollywood') || pLower.includes('arijit') || pLower.includes('mumbai')) {
      detectedLanguage = 'Hindi';
      langQueryModifier = 'Hindi';
    } else if (pLower.includes('punjabi') || pLower.includes('diljit') || pLower.includes('chandigarh') || pLower.includes('trap')) {
      detectedLanguage = 'Punjabi';
      langQueryModifier = 'Punjabi';
    } else if (pLower.includes('kannada') || pLower.includes('sandalwood') || pLower.includes('bangalore') || pLower.includes('basrur')) {
      detectedLanguage = 'Kannada';
      langQueryModifier = 'Kannada';
    }

    // 2. Detect mood / vibe context
    let mood = 'Vibe Mix';
    let moodKeywords = 'hit songs official audio';
    let coverUrl = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&fit=crop';

    if (pLower.includes('rain') || pLower.includes('night') || pLower.includes('drive') || pLower.includes('late')) {
      mood = 'Late Night Drive';
      moodKeywords = 'late night chill drive acoustic official audio';
      coverUrl = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&fit=crop';
    } else if (pLower.includes('gym') || pLower.includes('workout') || pLower.includes('energy') || pLower.includes('mass') || pLower.includes('beast')) {
      mood = 'High-Octane Energy';
      moodKeywords = 'mass energetic gym workout motivational official audio';
      coverUrl = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&fit=crop';
    } else if (pLower.includes('acoustic') || pLower.includes('sunset') || pLower.includes('coffee') || pLower.includes('chai') || pLower.includes('cozy')) {
      mood = 'Sunset & Acoustic';
      moodKeywords = 'acoustic sunset relaxing chill melodies official audio';
      coverUrl = 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&fit=crop';
    } else if (pLower.includes('retro') || pLower.includes('90s') || pLower.includes('80s') || pLower.includes('nostalg') || pLower.includes('evergreen')) {
      mood = 'Golden Nostalgia';
      moodKeywords = 'evergreen golden classic melodies 90s official audio';
      coverUrl = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&fit=crop';
    } else if (pLower.includes('lofi') || pLower.includes('study') || pLower.includes('focus') || pLower.includes('code')) {
      mood = 'Focus & Lofi';
      moodKeywords = 'lofi chill study beats relaxing official audio';
      coverUrl = 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&fit=crop';
    }

    // 3. Construct 3 multi-angle queries
    const queries = [
      `${langQueryModifier} ${moodKeywords}`.trim(),
      `${cleanPrompt} ${currentYear} official audio`,
      `${langQueryModifier} trending hit songs official audio`.trim(),
    ];

    try {
      const searchResults = await Promise.allSettled(
        queries.map((q) => YouTubeDataApiService.searchVideos(q, 10))
      );

      const combined: Song[] = [];
      for (const res of searchResults) {
        if (res.status === 'fulfilled') {
          combined.push(...res.value);
        }
      }

      // Filter out shorts (< 80s) and deduplicate
      const unique = deduplicateSongs(combined.filter((s) => s.duration >= 80));

      // Rank using composite scoring
      const ranked = unique
        .map((song) => {
          const score = calculateCompositeScore(
            {
              viewCount: 1500000,
              likeCount: 45000,
              commentCount: 2500,
            },
            {
              targetLanguage: detectedLanguage,
              songTitle: song.title,
              artistName: song.artist,
            }
          );
          return { song, score: score.finalScore };
        })
        .sort((a, b) => b.score - a.score)
        .map((item) => item.song);

      const finalSongs = ranked.slice(0, 14);

      // Synthesize clean title & description
      const title = cleanPrompt.length <= 40
        ? cleanPrompt.replace(/\b\w/g, (l) => l.toUpperCase())
        : `${detectedLanguage} ${mood}`;

      const description = `AI Curated mix tuned for "${cleanPrompt}". Featuring ${finalSongs.slice(0, 3).map((s) => s.artist).join(', ')} and more.`;

      return {
        title,
        description,
        coverUrl: finalSongs[0]?.artwork || coverUrl,
        songs: finalSongs,
        mood,
        detectedLanguage,
      };
    } catch (e) {
      console.warn('SmartAIPlaylistGenerator error:', e);
      return {
        title: cleanPrompt,
        description: 'AI Generated Mix',
        coverUrl,
        songs: [],
        mood,
        detectedLanguage,
      };
    }
  }
}
