/**
 * SongNormalization — Duplicate Protection & Identity Normalization
 * 
 * Prevents YouTube duplicate clutter:
 * The same song may exist as:
 * - Official Audio
 * - Music Video
 * - Lyric Video
 * - Visualizer
 * - Re-upload
 * - 4K Remaster
 * 
 * We compute a canonical identity to deduplicate recommendation pools,
 * while preserving genuine variants (Remix, Acoustic, Live, Reprise, Unplugged).
 */

import { Song } from '../../types';

// YouTube clutter patterns to strip for identity matching
const CLUTTER_REGEXES = [
  /\((?:official\s+)?(?:music\s+)?video\)/gi,
  /\[(?:official\s+)?(?:music\s+)?video\]/gi,
  /\((?:official\s+)?audio\)/gi,
  /\[(?:official\s+)?audio\]/gi,
  /\((?:lyric\s+video|lyrics|lyrical(?:\s+video)?)\)/gi,
  /\[(?:lyric\s+video|lyrics|lyrical(?:\s+video)?)\)/gi,
  /\((?:full\s+)?(?:video\s+)?song\)/gi,
  /\[(?:full\s+)?(?:video\s+)?song\]/gi,
  /\((?:visualizer|4k(?:\s+video)?|hd|uhd|1080p)\)/gi,
  /\[(?:visualizer|4k(?:\s+video)?|hd|uhd|1080p)\]/gi,
  /\|\s*(?:official\s+)?(?:music\s+)?video/gi,
  /\|\s*(?:official\s+)?audio/gi,
  /\|\s*new\s+song\s+\d{4}/gi,
  /\|\s*latest\s+song\s+\d{4}/gi,
  /\b(?:official\s+video|official\s+audio|music\s+video)\b/gi,
  /\b4k\s+ultra\s+hd\b/gi,
];

// Special genuine variant tags that SHOULD NOT be stripped and define a distinct version
const VARIANT_TAGS = [
  'remix',
  'acoustic',
  'live',
  'unplugged',
  'reprise',
  'lofi',
  'slowed',
  'speed up',
  'mashup',
  'cover',
  'instrumental',
];

/**
 * Strips YouTube channel suffixes (e.g. " - Topic", "VEVO", "Official")
 */
export function normalizeArtistName(rawArtist: string): string {
  if (!rawArtist) return 'Unknown Artist';
  return rawArtist
    .replace(/\s*-\s*Topic$/i, '')
    .replace(/\s*VEVO$/i, '')
    .replace(/\s*Official(?:\s+Channel)?$/i, '')
    .trim();
}

/**
 * Normalizes title for clean display and deduplication
 */
export function cleanSongTitle(rawTitle: string): string {
  if (!rawTitle) return 'Track';
  let cleaned = rawTitle;

  // Strip clutter
  for (const regex of CLUTTER_REGEXES) {
    cleaned = cleaned.replace(regex, '');
  }

  // Remove trailing dashes/pipes/spaces left behind
  cleaned = cleaned.replace(/[\s\-\|]+$/, '').replace(/^[\s\-\|]+/, '');
  // Normalize double spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  return cleaned || rawTitle;
}

/**
 * Extract variant modifier if genuine
 */
function extractVariantKey(title: string): string {
  const lower = title.toLowerCase();
  for (const tag of VARIANT_TAGS) {
    if (lower.includes(tag)) {
      return tag;
    }
  }
  return 'standard';
}

/**
 * Generate a canonical deduplication key for a song
 * e.g. "jaada::sushin shyam::standard::dur_40"
 */
export function getCanonicalSongKey(song: Song): string {
  const cleanTitle = cleanSongTitle(song.title).toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanArtist = normalizeArtistName(song.artist).toLowerCase().replace(/[^a-z0-9]/g, '');
  const variant = extractVariantKey(song.title);
  // Bucket duration by 8 seconds to allow slight video vs audio intro variations
  const durationBucket = song.duration > 0 ? Math.round(song.duration / 8) : 0;

  return `${cleanTitle}::${cleanArtist.slice(0, 14)}::${variant}::${durationBucket}`;
}

/**
 * Compare two songs to determine if they are effectively the same track
 */
export function isDuplicateTrack(a: Song, b: Song): boolean {
  if (a.id === b.id) return true;
  if (a.sourceId && b.sourceId && a.sourceId === b.sourceId) return true;

  const keyA = getCanonicalSongKey(a);
  const keyB = getCanonicalSongKey(b);
  if (keyA === keyB) return true;

  // Secondary check: Title string similarity + same duration within 4 seconds
  const titleA = cleanSongTitle(a.title).toLowerCase().replace(/[^a-z0-9]/g, '');
  const titleB = cleanSongTitle(b.title).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (titleA && titleB && (titleA === titleB || titleA.includes(titleB) || titleB.includes(titleA))) {
    const durDiff = Math.abs(a.duration - b.duration);
    if (durDiff <= 5 && extractVariantKey(a.title) === extractVariantKey(b.title)) {
      return true;
    }
  }

  return false;
}

/**
 * Deduplicate a song list while keeping the highest quality version
 * (Prefers official audio or higher view count if metadata exists)
 */
export function deduplicateSongs<T extends Song>(songs: T[]): T[] {
  const seenKeys = new Map<string, T>();
  const results: T[] = [];

  for (const song of songs) {
    const key = getCanonicalSongKey(song);
    if (!seenKeys.has(key)) {
      seenKeys.set(key, song);
      results.push(song);
    } else {
      // If the incoming song is labeled "Official Audio" vs a lyric video, optionally swap
      const existing = seenKeys.get(key)!;
      const incomingTitle = song.title.toLowerCase();
      const existingTitle = existing.title.toLowerCase();
      if (incomingTitle.includes('official audio') && !existingTitle.includes('official audio')) {
        const idx = results.indexOf(existing);
        if (idx !== -1) {
          results[idx] = song;
          seenKeys.set(key, song);
        }
      }
    }
  }

  return results;
}

/**
 * Normalizes user search queries (collapsing whitespace, resolving common artist aliases,
 * phonetic spellings, and Indian film soundtrack shorthand)
 */
export function normalizeSearchQuery(rawQuery: string): string {
  if (!rawQuery) return '';
  let q = rawQuery.trim().replace(/\s+/g, ' ');

  // Mapping known common query variations to canonical search terms
  const aliases: [RegExp, string][] = [
    // Top Composers & Music Directors
    [/\b(?:a\s*r\s*rahman|ar\s+rahman|arr|a\s+r\s+rehman)\b/gi, 'A.R. Rahman'],
    [/\b(?:anirudh\s+ravichander|anirudh\s+ravichandran|rockstar\s+anirudh|ani\s+songs|ani\s+hits)\b/gi, 'Anirudh Ravichander'],
    [/\b(?:devi\s+sri\s+prasad|dsp\s+songs|dsp\s+hits|devi\s+sri)\b/gi, 'Devi Sri Prasad'],
    [/\b(?:sushin\s+shyam|sushin\s+hits|sushin\s+songs)\b/gi, 'Sushin Shyam'],
    [/\b(?:thaman\s*s|s\s*thaman|thaman\s+hits|thaman\s+songs)\b/gi, 'Thaman S'],
    [/\b(?:yuvan\s+shankar\s+raja|yuvan\s+shankar|u1\s+songs|ysr\s+songs|ysr\s+hits)\b/gi, 'Yuvan Shankar Raja'],
    [/\b(?:harris\s+jayraj|harris\s+jayaraj|hj\s+songs)\b/gi, 'Harris Jayaraj'],
    [/\b(?:santhosh\s+narayanan|sa\s+na\s+songs|sana\s+songs)\b/gi, 'Santhosh Narayanan'],
    [/\b(?:gv\s+prakash|g\s*v\s*prakash\s+kumar|gvp)\b/gi, 'G.V. Prakash Kumar'],
    [/\b(?:ilayaraja|ilaiyaraaja|isaignani|ilayaraja\s+hits)\b/gi, 'Ilaiyaraaja'],
    [/\b(?:m\s*m\s*keeravani|mm\s+keeravani|keeravani)\b/gi, 'M.M. Keeravani'],
    [/\b(?:pritam\s+chakraborty|pritam\s+da)\b/gi, 'Pritam'],
    [/\b(?:jakes\s+bejoy|jakes\s+songs)\b/gi, 'Jakes Bejoy'],
    [/\b(?:rex\s+vijayan|rex\s+songs)\b/gi, 'Rex Vijayan'],
    [/\b(?:hesham\s+abdul\s+wahab|hesham\s+songs)\b/gi, 'Hesham Abdul Wahab'],
    [/\b(?:shaan\s+rahman|shaan\s+songs)\b/gi, 'Shaan Rahman'],
    [/\b(?:ravi\s+basrur|basrur)\b/gi, 'Ravi Basrur'],

    // Legendary & Contemporary Singers
    [/\b(?:spb|s\s*p\s*b|s\s*p\s*balasubrahmanyam|balasubramaniam)\b/gi, 'S.P. Balasubrahmanyam'],
    [/\b(?:k\s*j\s*yesudas|kj\s+yesudas|kjy|yesudas)\b/gi, 'K.J. Yesudas'],
    [/\b(?:k\s*s\s*chithra|ks\s+chithra|chithra|chitra\s+songs)\b/gi, 'K.S. Chithra'],
    [/\b(?:arijit\s+singh|arijit\s+hits|arijit\s+romantic)\b/gi, 'Arijit Singh'],
    [/\b(?:shreya\s+ghoshal|shreya\s+ghosal|shreya\s+hits)\b/gi, 'Shreya Ghoshal'],
    [/\b(?:sid\s+sriram|sid\s+sriram\s+melodies)\b/gi, 'Sid Sriram'],
    [/\b(?:diljit\s+dosanjh|diljit\s+songs|diljit\s+punjabi)\b/gi, 'Diljit Dosanjh'],
    [/\b(?:karan\s+aujla|aujla\s+songs)\b/gi, 'Karan Aujla'],
    [/\b(?:sidhu\s+moose\s*wala|sidhu\s+moosewala|moosewala)\b/gi, 'Sidhu Moose Wala'],
    [/\b(?:ap\s+dhillon|dhillon)\b/gi, 'AP Dhillon'],
    [/\b(?:vineeth\s+sreenivasan|vineeth\s+hits)\b/gi, 'Vineeth Sreenivasan'],
    [/\b(?:k\s*s\s*harisankar|ks\s+harisankar|harisankar\s+songs)\b/gi, 'K.S. Harisankar'],
    [/\b(?:hanumankind|hanuman\s+kind)\b/gi, 'Hanumankind'],
    [/\b(?:dabzee\s+songs|dabzee)\b/gi, 'Dabzee'],
    [/\b(?:sonu\s+nigam|sonu\s+hits)\b/gi, 'Sonu Nigam'],
    [/\b(?:prateek\s+kuhad)\b/gi, 'Prateek Kuhad'],
    [/\b(?:anuv\s+jain)\b/gi, 'Anuv Jain'],

    // Popular Films & Soundtrack shorthand
    [/\baavesham\s*(?:songs|bgm|track)?\b/gi, 'Aavesham official audio Sushin Shyam'],
    [/\bmanjummel\s*boys\s*(?:songs)?\b/gi, 'Manjummel Boys official audio Sushin Shyam'],
    [/\bjailer\s*(?:songs|hukum)?\b/gi, 'Jailer official audio Anirudh Ravichander'],
    [/\bleo\s*(?:songs|badass)?\b/gi, 'Leo official audio Anirudh Ravichander'],
    [/\bpushpa\s*2\s*(?:songs)?\b/gi, 'Pushpa 2 The Rule official audio DSP'],
    [/\bdevara\s*(?:songs)?\b/gi, 'Devara official audio Anirudh'],
    [/\bkalki\s*2898\s*(?:ad|songs)?\b/gi, 'Kalki 2898 AD official audio Santhosh Narayanan'],
    [/\bpremam\s*(?:songs)?\b/gi, 'Premam Malayalam songs official audio'],
  ];

  for (const [pattern, canonical] of aliases) {
    if (typeof canonical === 'string') {
      q = q.replace(pattern, canonical);
    }
  }

  // Strip common noisy search terms that return ringtones, status videos, or reactions
  const noise = [
    /\bwhatsapp\s+status\b/gi,
    /\bstatus\s+video\b/gi,
    /\b30\s*sec\s+status\b/gi,
    /\breaction\s+video\b/gi,
    /\bkaraoke\s+without\s+voice\b/gi,
    /\b1\s*hour\s+loop\b/gi,
  ];
  for (const reg of noise) {
    q = q.replace(reg, '').trim();
  }

  return q;
}
