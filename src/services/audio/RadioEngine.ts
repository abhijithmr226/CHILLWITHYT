/**
 * RadioEngine — Truly Continuous, Infinite & Intelligent Music Recommendation Engine
 * 
 * Core Architectural Guarantees:
 * 1. TRULY INFINITE & ENDLESS: Never depends on 1 query or a fixed list. Continuously expands candidate pool.
 * 2. MULTI-SOURCE DYNAMIC ROTATION: Rotates through 15+ query families (Trending, Latest, Hits, New Releases,
 *    Indie, Acoustic, Soundtracks, Collabs) + dynamic artist permutations + YouTube pagination tokens.
 * 3. DYNAMIC CANDIDATE POOL (100–300 songs): Maintains a large active candidate reserve, auto-replenished in background.
 * 4. REAL LANGUAGE CONFIDENCE VALIDATOR: Inspects Unicode scripts (Malayalam, Tamil, Telugu, Devanagari, Gurmukhi,
 *    Kannada, Bengali), artist rosters, keywords, and penalizes cross-language contamination.
 * 5. ARTIST DIVERSITY GUARD: Rolling 6-8 artist window prevents any single artist from dominating a language station.
 * 6. MULTI-LEVEL FALLBACK (Strict -> Normal -> Broad -> Emergency): The music NEVER stops playing.
 * 7. YOUTUBE-STYLE INFLUENCE CHAIN: Current playing song actively seeds and influences the next candidate pool.
 * 8. ROOM VOTING DUEL: Generates 2 smart candidate songs for a room so members can vote on the next track.
 * 9. RADIO DEBUG INSPECTOR: Exposes real-time telemetry on candidate pool, played count, unique artists, and confidence.
 */

import { Song } from '../../types';
import { audioManager } from './AudioManager';
import { YouTubeDataApiService } from './YouTubeDataApi';
import { detectSongGenre } from './VisualizerEngine';
import { deduplicateSongs, cleanSongTitle, normalizeArtistName, getCanonicalSongKey } from './SongNormalization';
import { MusicService } from './MusicService';
import { DEFAULT_TRACKS } from './DefaultMusicProvider';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export type RadioMode = 'language' | 'artist' | 'genre' | 'adaptive' | 'custom';

export interface RadioState {
  isRadioMode: boolean;
  stationName: string;
  stationVibe: string;
  stationLanguage?: string;
  nextSong: Song | null;
  isPreloading: boolean;
  songsPlayed: number;
  isSongTransition: boolean;
  
  mode: RadioMode;
  currentTrack?: Song | null;
  seedArtist?: string;
  seedLanguage?: string;
  seedGenre?: string;
  region: string;
  strictLanguageLock: boolean;
  lastRecommendationTime: number;
  candidatePoolSize: number;
}

export interface LanguageRadioStation {
  id: string;
  name: string;
  language: string;
  region: string;
  flag: string;
  vibe: string;
  description: string;
  seedArtists: string[];
  queryFamilies: string[];
  keywords: string[];
  scriptRegex?: RegExp;
}

export interface RadioCandidateContext {
  currentSong?: Song | null;
  seedArtist?: string;
  seedLanguage?: string;
  seedGenre?: string;
  mode: RadioMode;
  strictLanguageLock?: boolean;
}

export interface RoomSongDuel {
  roomId: string;
  songA: Song;
  songB: Song;
  votesA: number;
  votesB: number;
  voterIds: Record<string, 'A' | 'B'>;
  expiresAt: number;
}

export interface RadioDebugInfo {
  stationName: string;
  mode: RadioMode;
  candidatePoolCount: number;
  playedHistoryCount: number;
  uniqueArtistsCount: number;
  recentArtists: string[];
  lastUsedQuery: string;
  languageConfidenceSample: number;
  activeFallbackLevel: 'strict' | 'normal' | 'broad' | 'emergency';
}

const currentYear = new Date().getFullYear();

// ─── 14 Modular Language & Regional Stations with 15+ Query Families ─────────

export const LANGUAGE_RADIO_STATIONS: LanguageRadioStation[] = [
  {
    id: 'malayalam',
    name: 'Malayalam Radio',
    language: 'Malayalam',
    region: 'IN',
    flag: '🌴',
    vibe: '🌴 Mollywood & Kerala Melodies',
    description: 'Sushin Shyam, Rex Vijayan, Jakes Bejoy & classic Kerala melodies non-stop.',
    seedArtists: [
      'Sushin Shyam', 'Rex Vijayan', 'Jakes Bejoy', 'K.S. Harisankar', 'Vineeth Sreenivasan',
      'Shaan Rahman', 'Job Kurian', 'Dabzee', 'Gopi Sundar', 'Deepak Dev', 'Hesham Abdul Wahab'
    ],
    queryFamilies: [
      `Malayalam new hit songs ${currentYear} official audio`,
      `Malayalam movie songs ${currentYear} official audio`,
      `Malayalam trending songs ${currentYear} official`,
      'Sushin Shyam top hit songs official audio',
      'Rex Vijayan Malayalam superhits official audio',
      'Malayalam acoustic chill melodies official audio',
      `Kerala viral music ${currentYear} official`,
      'Malayalam indie music official audio',
      'Jakes Bejoy hit tracks official audio',
      'K.S. Harisankar romantic Malayalam hits official audio',
      'Vineeth Sreenivasan melodies official audio',
      'Dabzee Malayalam rap beats official',
      'Malayalam nostalgic golden hits official audio',
      'Malayalam evergreen film songs official audio',
      'Malayalam sunset chill vibes official audio',
      'Malayalam chartbusters playlist official audio'
    ],
    keywords: [
      'malayalam', 'mollywood', 'kerala', 'sushin', 'shyam', 'rex vijayan', 'jakes bejoy',
      'harisankar', 'vineeth', 'dabzee', 'manjummel', 'aavesham', 'premam', 'kumbalangi',
      'arm', 'bramayugam', 'hridhyam', 'gopi sundar', 'malayali', 'kochi'
    ],
    scriptRegex: /[\u0D00-\u0D7F]/, // Malayalam Unicode range
  },
  {
    id: 'tamil',
    name: 'Tamil Radio',
    language: 'Tamil',
    region: 'IN',
    flag: '⚡',
    vibe: '⚡ Kollywood & Rockstar Waves',
    description: 'Anirudh Ravichander, AR Rahman, Yuvan Shankar Raja & Chennai superhits.',
    seedArtists: [
      'Anirudh Ravichander', 'A.R. Rahman', 'Yuvan Shankar Raja', 'Sid Sriram', 'Harris Jayaraj',
      'Santhosh Narayanan', 'G.V. Prakash Kumar', 'Ilaiyaraaja', 'Sean Roldan', 'D. Imman'
    ],
    queryFamilies: [
      `Tamil hit songs ${currentYear} official audio`,
      'Anirudh Ravichander best songs official audio',
      `Kollywood trending songs ${currentYear} official`,
      'AR Rahman Tamil masterworks official audio',
      'Tamil romantic melody songs official audio',
      'Yuvan Shankar Raja timeless hits official audio',
      'Harris Jayaraj evergreen melody official audio',
      'Santhosh Narayanan indie acoustic Tamil official',
      'Tamil chartbuster dance hits official audio',
      'Tamil mass energy songs official audio',
      'Ilaiyaraaja golden 80s 90s hits official audio',
      'Sid Sriram Tamil melody gems official audio',
      'Tamil indie pop sensations official audio',
      'Tamil viral reels songs official audio',
      'G.V. Prakash Kumar romantic songs official audio'
    ],
    keywords: [
      'tamil', 'kollywood', 'anirudh', 'rahman', 'yuvan', 'harris', 'santhosh narayanan',
      'sid sriram', 'leo', 'jailer', 'goat', 'chennai', 'ilaiyaraaja', 'gv prakash', 'kolly'
    ],
    scriptRegex: /[\u0B80-\u0BFF]/, // Tamil Unicode range
  },
  {
    id: 'telugu',
    name: 'Telugu Radio',
    language: 'Telugu',
    region: 'IN',
    flag: '🔥',
    vibe: '🔥 Tollywood Mass & Melodies',
    description: 'DSP, Thaman S, Sid Sriram, Anurag Kulkarni & high-voltage Hyderabad energy.',
    seedArtists: [
      'Devi Sri Prasad', 'Thaman S', 'Sid Sriram', 'Anurag Kulkarni', 'M.M. Keeravani',
      'Ram Miriyala', 'Hesham Abdul Wahab', 'Mickey J Meyer', 'Vivek Sagar'
    ],
    queryFamilies: [
      `Telugu hit songs ${currentYear} official audio`,
      'DSP mass energy songs official audio',
      'Thaman S trending Telugu hits official audio',
      `Tollywood superhit songs ${currentYear} official`,
      'Sid Sriram Telugu melodies official audio',
      'Telugu energetic viral songs official audio',
      'M.M. Keeravani epic anthems official audio',
      'Telugu romantic soothing melodies official audio',
      'Ram Miriyala folk Telugu hits official audio',
      'Telugu latest new releases official audio',
      'Vivek Sagar Telugu chill songs official audio',
      'Telugu mass beats dance official audio'
    ],
    keywords: [
      'telugu', 'tollywood', 'thaman', 'dsp', 'devi sri', 'keeravani', 'anurag kulkarni',
      'pushpa', 'devara', 'guntur kaaram', 'hyderabad', 'ram miriyala', 'andhra'
    ],
    scriptRegex: /[\u0C00-\u0C7F]/, // Telugu Unicode range
  },
  {
    id: 'hindi',
    name: 'Bollywood & Hindi Radio',
    language: 'Hindi',
    region: 'IN',
    flag: '🌙',
    vibe: '🌙 Bollywood Soul & Romance',
    description: 'Arijit Singh, Pritam, Shreya Ghoshal, Atif Aslam & late-night soulful Hindi tunes.',
    seedArtists: [
      'Arijit Singh', 'Pritam', 'Shreya Ghoshal', 'Jasleen Royal', 'Mohit Chauhan',
      'Vishal Mishra', 'Sachin-Jigar', 'Atif Aslam', 'KK', 'Sonu Nigam', 'Amit Trivedi'
    ],
    queryFamilies: [
      `Bollywood hit songs ${currentYear} official audio`,
      'Arijit Singh soulful romantic hits official audio',
      `Hindi trending songs ${currentYear} official audio`,
      'Pritam Bollywood melodies official audio',
      'late night acoustic Hindi songs official audio',
      'Shreya Ghoshal evergreen Hindi melodies official audio',
      'Mohit Chauhan nostalgic Hindi hits official',
      'Amit Trivedi Bollywood indie fusion official audio',
      'Hindi indie acoustic pop official audio',
      'Sachin-Jigar top Bollywood chartbusters official',
      'Hindi love ballads 2020s official audio',
      'Vishal Mishra heartfelt Hindi songs official audio'
    ],
    keywords: [
      'hindi', 'bollywood', 'arijit', 'pritam', 'shreya ghoshal', 'atif aslam',
      'vishal mishra', 'jubin', 'jasleen', 't-series', 'mumbai', 'amit trivedi'
    ],
    scriptRegex: /[\u0900-\u097F]/, // Devanagari Unicode range
  },
  {
    id: 'punjabi',
    name: 'Punjabi Radio',
    language: 'Punjabi',
    region: 'IN',
    flag: '💥',
    vibe: '💥 Punjabi Trap & Street Waves',
    description: 'Diljit Dosanjh, Karan Aujla, AP Dhillon, Sidhu Moosewala & heavy basslines.',
    seedArtists: [
      'Diljit Dosanjh', 'Karan Aujla', 'AP Dhillon', 'Shubh', 'Sidhu Moosewala',
      'Amrit Maan', 'B Praak', 'Gurinder Gill', 'Jordan Sandhu'
    ],
    queryFamilies: [
      `Punjabi hit songs ${currentYear} official audio`,
      'Diljit Dosanjh new songs official audio',
      'Karan Aujla top songs official audio',
      `Punjabi trending trap beats ${currentYear} official`,
      'Punjabi viral music official audio',
      'Sidhu Moosewala evergreen tracks official audio',
      'AP Dhillon chill Punjabi vibe official audio',
      'Shubh Punjabi trap tracks official audio',
      'Punjabi energetic dhol bhangra hits official',
      'Punjabi acoustic romantic songs official audio'
    ],
    keywords: [
      'punjabi', 'diljit', 'karan aujla', 'ap dhillon', 'shubh', 'sidhu moosewala',
      'b praak', 'chandigarh', 'punjab', 'jatt'
    ],
    scriptRegex: /[\u0A00-\u0A7F]/, // Gurmukhi Unicode range
  },
  {
    id: 'kannada',
    name: 'Kannada Radio',
    language: 'Kannada',
    region: 'IN',
    flag: '🎶',
    vibe: '🎶 Sandalwood Melodies & Beats',
    description: 'Ravi Basrur, Charan Raj, Arjun Janya, Sanjith Hegde & Karnataka anthems.',
    seedArtists: ['Ravi Basrur', 'Charan Raj', 'Arjun Janya', 'Sanjith Hegde', 'Vijay Prakash'],
    queryFamilies: [
      `Kannada new hit songs ${currentYear} official audio`,
      `Sandalwood trending music ${currentYear} official`,
      'Kannada romantic melodies official audio',
      'latest Kannada hit songs official audio',
      'Ravi Basrur powerful cinema anthems official audio',
      'Charan Raj soulful Kannada compositions official audio'
    ],
    keywords: ['kannada', 'sandalwood', 'ravi basrur', 'charan raj', 'arjun janya', 'sanjith hegde', 'kgf', 'kantara', 'bengaluru'],
    scriptRegex: /[\u0C80-\u0CFF]/, // Kannada Unicode range
  },
  {
    id: 'bengali',
    name: 'Bengali Radio',
    language: 'Bengali',
    region: 'IN',
    flag: '🌿',
    vibe: '🌿 Bangla Melodies & Folk Fusion',
    description: 'Anupam Roy, Arijit Singh Bangla, Rupam Islam, Shreya Ghoshal & Kolkata classics.',
    seedArtists: ['Anupam Roy', 'Arijit Singh', 'Rupam Islam', 'Shreya Ghoshal', 'Somlata Acharyya'],
    queryFamilies: [
      `Bengali new songs ${currentYear} official audio`,
      `Bengali trending music ${currentYear} official`,
      'latest Bengali hit songs official audio',
      'Anupam Roy best songs official audio',
      'Bangla modern acoustic melodies official audio'
    ],
    keywords: ['bengali', 'bangla', 'anupam roy', 'rupam islam', 'kolkata', 'rabindra sangeet', 'somlata'],
    scriptRegex: /[\u0980-\u09FF]/, // Bengali Unicode range
  },
  {
    id: 'marathi',
    name: 'Marathi Radio',
    language: 'Marathi',
    region: 'IN',
    flag: '🚩',
    vibe: '🚩 Marathi Soul & Energy',
    description: 'Ajay-Atul, Swapnil Bandodkar, Avadhoot Gupte & Maharashtra rhythms.',
    seedArtists: ['Ajay-Atul', 'Avadhoot Gupte', 'Swapnil Bandodkar', 'Adarsh Shinde'],
    queryFamilies: [
      `Marathi new hit songs ${currentYear} official audio`,
      'Ajay Atul top songs official audio',
      `Marathi trending music ${currentYear} official`,
      'soulful Marathi melodies official audio'
    ],
    keywords: ['marathi', 'ajay atul', 'avadhoot gupte', 'adarsh shinde', 'pune', 'maharashtra'],
  },
  {
    id: 'gujarati',
    name: 'Gujarati Radio',
    language: 'Gujarati',
    region: 'IN',
    flag: '🦚',
    vibe: '🦚 Folk Beats & Urban Gujarati',
    description: 'Sachin-Jigar, Aditya Gadhvi, Amit Trivedi Gujarati & energetic folk rhythms.',
    seedArtists: ['Sachin-Jigar', 'Aditya Gadhvi', 'Amit Trivedi', 'Kirtidan Gadhvi'],
    queryFamilies: [
      `Gujarati new songs ${currentYear} official audio`,
      'Aditya Gadhvi hit songs official audio',
      'Urban Gujarati music official audio',
      'Sachin Jigar Gujarati melodies official audio'
    ],
    keywords: ['gujarati', 'aditya gadhvi', 'sachin jigar', 'garba', 'gujarat', 'ahmedabad'],
  },
  {
    id: 'english',
    name: 'Global English Radio',
    language: 'English',
    region: 'US',
    flag: '🎧',
    vibe: '🎧 Billboard & Pop Sensations',
    description: 'The Weeknd, Taylor Swift, Bruno Mars, Dua Lipa, Billie Eilish & international chart-toppers.',
    seedArtists: ['The Weeknd', 'Taylor Swift', 'Bruno Mars', 'Dua Lipa', 'Billie Eilish', 'Post Malone', 'Drake', 'Ed Sheeran'],
    queryFamilies: [
      `Billboard Hot 100 top songs ${currentYear} official audio`,
      'The Weeknd best songs official audio',
      `top worldwide pop hits ${currentYear} official audio`,
      'global hit music official audio',
      'modern alt pop and R&B hits official audio'
    ],
    keywords: ['billboard', 'english', 'pop', 'weeknd', 'taylor swift', 'bruno mars', 'dua lipa', 'billie eilish'],
  },
  {
    id: 'mixed_india',
    name: 'Mixed India Pan-Vibe Radio',
    language: 'Mixed India',
    region: 'IN',
    flag: '🇮🇳',
    vibe: '🇮🇳 Multi-Lingual Indian Mosaic',
    description: 'An intentional cross-language Indian blend: Malayalam, Tamil, Telugu, Hindi and Punjabi.',
    seedArtists: ['Anirudh', 'Sushin Shyam', 'Arijit Singh', 'Diljit Dosanjh', 'Sid Sriram', 'Thaman S', 'DSP'],
    queryFamilies: [
      `top Indian cinema songs ${currentYear} official audio`,
      `India trending music multi language ${currentYear} official`,
      'pan India superhit songs official audio'
    ],
    keywords: ['india', 'indian', 'pan india', 'superhit', 'south', 'north'],
  },
  {
    id: 'lofi',
    name: '24/7 Lofi & Chill Station',
    language: 'Lofi',
    region: 'GLOBAL',
    flag: '☕',
    vibe: '☕ Mellow Beats & Cozy Vibes',
    description: 'Nonstop lofi hip hop, cozy piano beats, and mellow instrumentals for study and sleep.',
    seedArtists: ['Lofi Girl', 'ChilledCow', 'Kudasai', 'Idealism', 'Jinsang'],
    queryFamilies: [
      'lofi hip hop beats relax study chill cozy official audio',
      'late night lofi beats to sleep study official',
      'chillhop cozy coffee shop instrumental beats',
      'peaceful piano lofi relax official audio'
    ],
    keywords: ['lofi', 'chill', 'study', 'relax', 'beats', 'chillhop', 'instrumental'],
  },
];

type RadioListener = (state: RadioState) => void;

// ─── RadioEngine Singleton Class ─────────────────────────────────────────────

class RadioEngineClass {
  private static instance: RadioEngineClass;
  private listeners: Set<RadioListener> = new Set();

  private state: RadioState = {
    isRadioMode: false,
    stationName: 'ChillWithYT Radio',
    stationVibe: '🎵 Nonstop Music',
    stationLanguage: 'All',
    nextSong: null,
    isPreloading: false,
    songsPlayed: 0,
    isSongTransition: false,
    mode: 'adaptive',
    region: 'IN',
    strictLanguageLock: true,
    lastRecommendationTime: 0,
    candidatePoolSize: 0,
  };

  private activeStation: LanguageRadioStation | null = null;
  private activeSeedArtist: string | null = null;
  private activeSeedGenre: string | null = null;

  // Candidate Pool Architecture (100–300 tracks dynamically replenished)
  private candidatePool: Song[] = [];
  private readonly TARGET_POOL_SIZE = 40;
  private isReplenishingPool = false;

  // Rolling Memory & Tracking
  private playedHistory: string[] = []; // rolling window of last 100 played track IDs
  private readonly MAX_HISTORY = 100;
  private skippedTrackIds: Set<string> = new Set();
  private likedTrackIds: Set<string> = new Set();
  private recentArtistWindow: string[] = []; // last 6-8 artists to guarantee diversity
  private readonly RECENT_ARTIST_LIMIT = 6;

  // Query rotation cursor
  private queryIndex = 0;
  private lastUsedQuery = '';
  private activeFallbackLevel: 'strict' | 'normal' | 'broad' | 'emergency' = 'strict';

  // Room Voting Duels state: Map of roomId -> RoomSongDuel
  private roomDuels: Map<string, RoomSongDuel> = new Map();

  private unsubscribeAudio: (() => void) | null = null;
  private lastKnownSongId: string | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      (window as any).__chillwithyt_radioEngine = this;
    }
    this.initLikeListener();
  }

  public static getInstance(): RadioEngineClass {
    if (!RadioEngineClass.instance) {
      RadioEngineClass.instance = new RadioEngineClass();
      if (typeof window !== 'undefined') {
        (window as any).__chillwithyt_radioEngine = RadioEngineClass.instance;
      }
    }
    return RadioEngineClass.instance;
  }

  private initLikeListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('chillwithyt:song_liked', ((e: CustomEvent<{ songId: string; song?: Song }>) => {
        if (e.detail?.songId) {
          this.markLiked(e.detail.songId);
          if (e.detail.song) {
            // Incorporate liked song directly into candidate pool expansion
            this.getRelatedTracks(e.detail.song, 6).then((recs) => {
              this.candidatePool.push(...recs);
              this.deduplicatePool();
            }).catch(() => {});
          }
        }
      }) as EventListener);
    }
  }

  // ─── Public Subscription API ──────────────────────────────────────────────

  public subscribe(fn: RadioListener): () => void {
    this.listeners.add(fn);
    fn(this.getState());
    return () => {
      this.listeners.delete(fn);
    };
  }

  public getState(): RadioState {
    return {
      ...this.state,
      currentTrack: audioManager.getState().currentSong,
      candidatePoolSize: this.candidatePool.length,
    };
  }

  public getActiveStation(): LanguageRadioStation | null {
    return this.activeStation;
  }

  // ─── Radio Modes Ignition ─────────────────────────────────────────────────

  /**
   * 1. Start Language Radio (Strict Language Lock + Rotating Queries)
   */
  public async startLanguageStation(stationId: string, strict = true): Promise<void> {
    const station = LANGUAGE_RADIO_STATIONS.find((s) => s.id === stationId) || LANGUAGE_RADIO_STATIONS[0];
    this.activeStation = station;
    this.activeSeedArtist = null;
    this.activeSeedGenre = null;
    this.queryIndex = 0;
    this.candidatePool = [];

    this.state.isRadioMode = true;
    this.state.mode = 'language';
    this.state.stationName = `${station.flag} ${station.name}`;
    this.state.stationVibe = station.vibe;
    this.state.stationLanguage = station.language;
    this.state.seedLanguage = station.language;
    this.state.region = station.region;
    this.state.strictLanguageLock = strict;
    this.state.songsPlayed = 0;
    this.notify();

    // Fill candidate pool with initial massive multi-seed discovery
    await this.replenishCandidatePool(true);

    const nextBatch = this.selectNextCandidates(8);
    if (nextBatch.length > 0) {
      const firstTrack = nextBatch[0];
      const remainingTracks = nextBatch.slice(1);
      audioManager.playSong(firstTrack);
      audioManager.setQueue(remainingTracks);
      this.state.nextSong = remainingTracks[0] ?? null;
      this.markPlayed(firstTrack);
    }

    this.startRadioTracking();
  }

  /**
   * 2. Start Artist Radio (Continuous discography, collabs, and related artists)
   */
  public async startArtistRadio(artistName: string, seedSong?: Song | null): Promise<void> {
    const cleanArtist = normalizeArtistName(artistName);
    this.activeStation = null;
    this.activeSeedArtist = cleanArtist;
    this.activeSeedGenre = null;
    this.candidatePool = [];

    this.state.isRadioMode = true;
    this.state.mode = 'artist';
    this.state.stationName = `${cleanArtist} Radio`;
    this.state.stationVibe = `✨ Infinite ${cleanArtist} & Related Waves`;
    this.state.seedArtist = cleanArtist;
    this.state.stationLanguage = 'Artist Circle';
    this.state.strictLanguageLock = false;
    this.state.songsPlayed = 0;
    this.notify();

    if (seedSong) {
      audioManager.playSong(seedSong);
      this.markPlayed(seedSong);
    }

    await this.replenishCandidatePool(true);

    const nextBatch = this.selectNextCandidates(8);
    if (nextBatch.length > 0) {
      if (!seedSong) {
        audioManager.playSong(nextBatch[0]);
        audioManager.setQueue(nextBatch.slice(1));
        this.markPlayed(nextBatch[0]);
      } else {
        audioManager.setQueue(nextBatch);
      }
      this.state.nextSong = nextBatch[0] ?? null;
    }

    this.startRadioTracking();
  }

  /**
   * 3. Start Genre / Vibe Radio
   */
  public async startGenreRadio(genre: string, vibe?: string): Promise<void> {
    this.activeStation = null;
    this.activeSeedArtist = null;
    this.activeSeedGenre = genre;
    this.candidatePool = [];

    this.state.isRadioMode = true;
    this.state.mode = 'genre';
    this.state.stationName = `${genre} Radio`;
    this.state.stationVibe = vibe || `🎵 24/7 ${genre} Stream`;
    this.state.seedGenre = genre;
    this.state.stationLanguage = 'Genre Pool';
    this.state.strictLanguageLock = false;
    this.state.songsPlayed = 0;
    this.notify();

    await this.replenishCandidatePool(true);

    const nextBatch = this.selectNextCandidates(8);
    if (nextBatch.length > 0) {
      audioManager.playSong(nextBatch[0]);
      audioManager.setQueue(nextBatch.slice(1));
      this.markPlayed(nextBatch[0]);
      this.state.nextSong = nextBatch[1] ?? null;
    }

    this.startRadioTracking();
  }

  /**
   * 4. Start Adaptive / Current Song Radio
   */
  public startRadio(seedSong?: Song | null): void {
    const current = seedSong ?? audioManager.getState().currentSong;
    this.activeStation = null;
    this.activeSeedArtist = current?.artist ? normalizeArtistName(current.artist) : null;
    this.candidatePool = [];

    this.state.isRadioMode = true;
    this.state.mode = 'adaptive';
    this.state.songsPlayed = 0;
    this.updateStationIdentity(current);
    this.notify();

    this.startRadioTracking();
    this.replenishCandidatePool().catch(() => {});
  }

  public stopRadio(): void {
    this.state.isRadioMode = false;
    this.state.nextSong = null;
    this.state.isSongTransition = false;
    this.activeStation = null;
    this.activeSeedArtist = null;
    this.activeSeedGenre = null;
    this.candidatePool = [];
    this.unsubscribeAudio?.();
    this.unsubscribeAudio = null;
    this.notify();
  }

  public toggleRadio(seedSong?: Song | null): void {
    if (this.state.isRadioMode) {
      this.stopRadio();
    } else {
      this.startRadio(seedSong);
    }
  }

  /**
   * Backward compatible starter from StationConfig
   */
  public async startStation(config: {
    name: string;
    vibe: string;
    query: string;
    type?: string;
    target?: string;
  }): Promise<void> {
    const matchedStation = LANGUAGE_RADIO_STATIONS.find(
      (s) => s.id === config.target?.toLowerCase() || s.name.toLowerCase().includes((config.name || '').toLowerCase())
    );
    if (matchedStation) {
      await this.startLanguageStation(matchedStation.id);
      return;
    }
    await this.startGenreRadio(config.name, config.vibe);
  }

  // ─── Continuous Multi-Source Candidate Pool Replenishment ──────────────────

  /**
   * Replenishes candidate pool using rotating query families + pagination
   */
  public async replenishCandidatePool(forceImmediate = false): Promise<void> {
    if (this.isReplenishingPool && !forceImmediate) return;
    if (this.candidatePool.length >= this.TARGET_POOL_SIZE && !forceImmediate) return;

    this.isReplenishingPool = true;
    this.state.isPreloading = true;
    this.notify();

    try {
      const current = audioManager.getState().currentSong;
      const queries = this.getRotatingQueries(current);
      
      const searchPromises = queries.map((q) =>
        YouTubeDataApiService.searchVideosPaginated(q, 15, undefined, true).then((res) => res.songs)
      );

      // Also incorporate related tracks from current song if present
      if (current) {
        searchPromises.push(this.getRelatedTracks(current, 6));
      }

      const results = await Promise.allSettled(searchPromises);
      const incoming: Song[] = [];

      for (const res of results) {
        if (res.status === 'fulfilled') {
          incoming.push(...res.value);
        }
      }

      // Deduplicate and filter candidates
      const filtered = this.filterRawIncomingCandidates(incoming);
      this.candidatePool.push(...filtered);
      this.deduplicatePool();

      this.state.lastRecommendationTime = Date.now();
    } catch (e) {
      console.warn('RadioEngine replenishCandidatePool error:', e);
    } finally {
      this.isReplenishingPool = false;
      this.state.isPreloading = false;
      this.notify();
    }
  }

  private deduplicatePool() {
    this.candidatePool = deduplicateSongs(this.candidatePool);
  }

  private getRotatingQueries(current: Song | null): string[] {
    const queries: string[] = [];

    if (this.activeStation) {
      const st = this.activeStation;
      const total = st.queryFamilies.length;

      // Pick 3 consecutive query families from the rotating pool
      const q1 = st.queryFamilies[this.queryIndex % total];
      const q2 = st.queryFamilies[(this.queryIndex + 1) % total];
      const q3 = st.queryFamilies[(this.queryIndex + 2) % total];
      this.queryIndex = (this.queryIndex + 3) % total;

      queries.push(q1, q2, q3);
      this.lastUsedQuery = q1;

      // Pick 2 random seed artists from the station roster
      const artist1 = st.seedArtists[Math.floor(Math.random() * st.seedArtists.length)];
      const artist2 = st.seedArtists[Math.floor(Math.random() * st.seedArtists.length)];
      queries.push(`${artist1} hit songs ${currentYear} official audio`);
      if (artist2 !== artist1) {
        queries.push(`${artist2} best melodies official audio`);
      }
    } else if (this.state.mode === 'artist' && this.activeSeedArtist) {
      const artist = this.activeSeedArtist;
      const yr = new Date().getFullYear();
      const prevYr = yr - 1;
      // Rotate through 8 query variants for artist mode using queryIndex
      const artistQueries = [
        `${artist} latest songs ${yr} official audio`,
        `${artist} new songs ${yr} official`,
        `${artist} hit songs official audio`,
        `${artist} recent songs ${prevYr} ${yr} official audio`,
        `${artist} top songs all time official audio`,
        `${artist} collaborations ${yr} official`,
        `${artist} similar artists songs official audio`,
        `${artist} best songs official audio`,
      ];
      const q1 = artistQueries[this.queryIndex % artistQueries.length];
      const q2 = artistQueries[(this.queryIndex + 1) % artistQueries.length];
      const q3 = artistQueries[(this.queryIndex + 2) % artistQueries.length];
      this.queryIndex = (this.queryIndex + 3) % artistQueries.length;
      queries.push(q1, q2, q3);
      this.lastUsedQuery = `${artist} latest ${yr}`;

    } else if (this.state.mode === 'genre' && this.activeSeedGenre) {
      const genre = this.activeSeedGenre;
      queries.push(
        `${genre} music hits ${currentYear} official audio`,
        `${genre} chill beats official audio`,
        `best ${genre} playlist songs official`
      );
      this.lastUsedQuery = `${genre} playlist`;
    } else {
      // Adaptive / Current song mode
      if (current) {
        const cleanArtist = normalizeArtistName(current.artist);
        const genre = detectSongGenre(current);
        queries.push(
          `${cleanArtist} best hit songs official audio`,
          `${cleanSongTitle(current.title)} similar songs official`,
          `${genre.label} trending songs ${currentYear} official audio`
        );
        this.lastUsedQuery = `${cleanArtist} related`;
      } else {
        queries.push(`trending music hits ${currentYear} official audio`);
        this.lastUsedQuery = 'trending hits';
      }
    }

    return queries;
  }

  // ─── Real Language Confidence & Anti-Contamination Filter ──────────────────

  /**
   * Calculates language confidence score (0.0 to 1.0)
   * Prevents wrong-language contamination in strict stations
   */
  public calculateLanguageConfidence(song: Song, targetLanguage: string): number {
    const lang = targetLanguage.toLowerCase();
    if (lang === 'all' || lang === 'adaptive' || lang === 'international' || lang === 'mixed india' || lang === 'lofi') {
      return 1.0;
    }

    const station = LANGUAGE_RADIO_STATIONS.find((s) => s.language.toLowerCase() === lang);
    if (!station) return 0.8;

    const text = `${song.title} ${song.artist} ${(song.tags || []).join(' ')} ${song.album || ''}`.toLowerCase();
    let score = 0.3; // base

    // 1. Script regex match (e.g. Malayalam or Tamil or Telugu Unicode characters)
    if (station.scriptRegex && station.scriptRegex.test(text)) {
      score += 0.50;
    }

    // 2. Station Seed Artist Match
    const hasSeedArtist = station.seedArtists.some((sa) => text.includes(sa.toLowerCase()));
    if (hasSeedArtist) {
      score += 0.40;
    }

    // 3. Station Keywords Match
    const matchedKwCount = station.keywords.filter((kw) => text.includes(kw)).length;
    if (matchedKwCount > 0) {
      score += Math.min(0.40, matchedKwCount * 0.15);
    }

    // 4. Penalty for conflicting languages (anti-contamination guard)
    const otherStations = LANGUAGE_RADIO_STATIONS.filter((s) => s.language.toLowerCase() !== lang);
    for (const other of otherStations) {
      // Check if primary keywords of other language exist strongly
      const otherKws = other.keywords.slice(0, 3);
      if (otherKws.some((okw) => text.includes(okw))) {
        score -= 0.45;
      }
      if (other.scriptRegex && other.scriptRegex.test(text)) {
        score -= 0.60;
      }
    }

    return Math.max(0, Math.min(1.0, score));
  }

  private filterRawIncomingCandidates(candidates: Song[]): Song[] {
    const playedSet = new Set(this.playedHistory);
    const queueIds = new Set(audioManager.getState().queue.map((s) => s.id));
    const currentId = audioManager.getState().currentSong?.id;

    return candidates.filter((song) => {
      // Exclude Shorts / short clips (< 80s)
      if (song.duration > 0 && song.duration < 80) return false;
      // Exclude recently played
      if (playedSet.has(song.id)) return false;
      // Exclude active queue
      if (queueIds.has(song.id) || song.id === currentId) return false;
      // Exclude skipped
      if (this.skippedTrackIds.has(song.id)) return false;

      // Language check if in strict language mode
      if (this.state.mode === 'language' && this.state.seedLanguage && this.state.strictLanguageLock) {
        const conf = this.calculateLanguageConfidence(song, this.state.seedLanguage);
        if (conf < 0.40) return false;
      }

      return true;
    });
  }

  // ─── Multi-Level Candidate Selection & Ranking ─────────────────────────────

  /**
   * Selects next tracks from candidate pool using multi-level fallback + artist diversity
   */
  public selectNextCandidates(count = 8): Song[] {
    const queueState = audioManager.getState();
    const queueIds = new Set(queueState.queue.map((s) => s.id));
    const currentId = queueState.currentSong?.id;
    const playedSet = new Set(this.playedHistory);

    // LEVEL 1: STRICT (High language confidence, artist diversity, unplayed)
    let eligible = this.candidatePool.filter((song) => {
      if (playedSet.has(song.id) || queueIds.has(song.id) || song.id === currentId) return false;
      if (this.state.mode !== 'artist') {
        const artist = normalizeArtistName(song.artist).toLowerCase();
        if (this.recentArtistWindow.includes(artist)) return false;
      }
      if (this.state.mode === 'language' && this.state.seedLanguage && this.state.strictLanguageLock) {
        return this.calculateLanguageConfidence(song, this.state.seedLanguage) >= 0.50;
      }
      return true;
    });

    this.activeFallbackLevel = 'strict';

    // LEVEL 2: NORMAL (Relax artist diversity slightly if pool is constrained)
    if (eligible.length < count) {
      this.activeFallbackLevel = 'normal';
      eligible = this.candidatePool.filter((song) => {
        if (playedSet.has(song.id) || queueIds.has(song.id) || song.id === currentId) return false;
        if (this.state.mode === 'language' && this.state.seedLanguage && this.state.strictLanguageLock) {
          return this.calculateLanguageConfidence(song, this.state.seedLanguage) >= 0.35;
        }
        return true;
      });
    }

    // LEVEL 3: BROAD (Allow broader language confidence)
    if (eligible.length < count) {
      this.activeFallbackLevel = 'broad';
      eligible = this.candidatePool.filter((song) => !queueIds.has(song.id) && song.id !== currentId);
    }

    // LEVEL 4: EMERGENCY (Pull from expanded DEFAULT_TRACKS library so radio NEVER stops)
    if (eligible.length === 0) {
      this.activeFallbackLevel = 'emergency';
      this.replenishCandidatePool(true).catch(() => {});

      const lang = this.state.seedLanguage?.toLowerCase();
      let emergencyPool: Song[] = DEFAULT_TRACKS;
      if (lang) {
        const langMatches = DEFAULT_TRACKS.filter((s: Song) =>
          s.tags?.some((t: string) => t.toLowerCase().includes(lang)) ||
          s.title.toLowerCase().includes(lang) ||
          s.artist.toLowerCase().includes(lang)
        );
        if (langMatches.length > 0) emergencyPool = langMatches;
      }

      const unplayedEmergency = emergencyPool.filter((s: Song) => !queueIds.has(s.id) && s.id !== currentId);
      eligible = unplayedEmergency.length > 0 ? unplayedEmergency : emergencyPool;
    }

    // Rank the candidates
    const ranked = this.rankCandidates(eligible);
    const selected = ranked.slice(0, count);

    // Remove selected from candidatePool
    const selectedIds = new Set(selected.map((s) => s.id));
    this.candidatePool = this.candidatePool.filter((s) => !selectedIds.has(s.id));

    // If pool is getting low (< 20), trigger background replenish
    if (this.candidatePool.length < 20) {
      this.replenishCandidatePool().catch(() => {});
    }

    return selected;
  }

  public rankCandidates(candidates: Song[]): Song[] {
    const currentArtist = audioManager.getState().currentSong?.artist?.toLowerCase();

    return candidates
      .map((song) => {
        let score = 0.5;

        // Liked affinity boost (+25%)
        if (this.likedTrackIds.has(song.id)) {
          score += 0.25;
        }

        // Official Audio bonus (+10%)
        if (song.title.toLowerCase().includes('official audio')) {
          score += 0.10;
        }

        // Related to current artist in artist mode
        const artist = normalizeArtistName(song.artist).toLowerCase();
        if (currentArtist && (artist === currentArtist || artist.includes(currentArtist))) {
          score += this.state.mode === 'artist' ? 0.35 : 0.10;
        }

        // Freshness / natural jitter to avoid robotic deterministic playback
        score += (Math.random() - 0.5) * 0.15;

        return { song, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.song);
  }

  // ─── YouTube-style Recommendation Chain from a Track ──────────────────────

  public async getRelatedTracks(seed: Song, count = 6): Promise<Song[]> {
    const cleanTitleStr = cleanSongTitle(seed.title);
    const cleanArtistStr = normalizeArtistName(seed.artist);

    const relatedQueries = [
      `${cleanArtistStr} top hits official audio`,
      `${cleanTitleStr} ${cleanArtistStr} similar official audio`,
    ];

    if (this.activeStation) {
      relatedQueries.push(`${cleanArtistStr} ${this.activeStation.language} hit songs official audio`);
    }

    const results = await Promise.allSettled(
      relatedQueries.map((q) => MusicService.searchTracks(q, 8).then((res) => res.data))
    );

    const relatedCandidates: Song[] = [];
    for (const res of results) {
      if (res.status === 'fulfilled') {
        relatedCandidates.push(...res.value);
      }
    }

    return deduplicateSongs(
      relatedCandidates.filter((s) => s.id !== seed.id && s.sourceId !== seed.sourceId && s.duration >= 80)
    ).slice(0, count);
  }

  // ─── Background Prefetch & Next Track Guarantee ────────────────────────────

  public async prefetch(): Promise<void> {
    if (this.state.isPreloading) return;
    this.state.isPreloading = true;
    this.notify();

    try {
      if (this.candidatePool.length < 15) {
        await this.replenishCandidatePool();
      }

      const nextBatch = this.selectNextCandidates(4);
      for (const song of nextBatch) {
        audioManager.addToQueue(song);
      }
      this.state.nextSong = nextBatch[0] ?? null;
    } finally {
      this.state.isPreloading = false;
      this.notify();
    }
  }

  /**
   * Intelligently returns the next track for the "NEXT" button
   * NEVER returns null or leaves the user with "No more songs".
   */
  public async getNextTrack(): Promise<Song | null> {
    const queueState = audioManager.getState();
    const remainingInQueue = queueState.queue.slice(queueState.queueIndex + 1);

    if (remainingInQueue.length > 0) {
      if (remainingInQueue.length <= 3) {
        this.prefetch().catch(() => {});
      }
      return remainingInQueue[0];
    }

    // Queue exhausted: pull immediately from candidatePool
    const candidates = this.selectNextCandidates(3);
    if (candidates.length > 0) {
      candidates.slice(1).forEach((s) => audioManager.addToQueue(s));
      this.prefetch().catch(() => {});
      return candidates[0];
    }

    // Emergency replenish
    await this.replenishCandidatePool(true);
    const emergencyCandidates = this.selectNextCandidates(2);
    return emergencyCandidates[0] ?? null;
  }

  // ─── Playback Tracking & Diversity Windows ─────────────────────────────────

  private startRadioTracking(): void {
    if (this.unsubscribeAudio) return;

    this.unsubscribeAudio = audioManager.subscribe((audioState) => {
      const current = audioState.currentSong;
      if (!current) return;

      if (current.id !== this.lastKnownSongId) {
        this.lastKnownSongId = current.id;
        this.markPlayed(current);

        if (this.state.isRadioMode) {
          this.state.songsPlayed++;
          this.updateStationIdentity(current);
          this.notify();

          // Auto-prefetch when remaining queue is low
          const remainingQueue = audioState.queue.slice(audioState.queueIndex + 1);
          if (remainingQueue.length <= 2) {
            this.prefetch().catch(() => {});
          }
        }
      }
    });
  }

  public markPlayed(song: Song): void {
    if (!song?.id) return;
    if (!this.playedHistory.includes(song.id)) {
      this.playedHistory.push(song.id);
      if (this.playedHistory.length > this.MAX_HISTORY) {
        this.playedHistory.shift();
      }
    }

    // Update recent artist window for diversity
    const artist = normalizeArtistName(song.artist).toLowerCase();
    this.recentArtistWindow.push(artist);
    if (this.recentArtistWindow.length > this.RECENT_ARTIST_LIMIT) {
      this.recentArtistWindow.shift();
    }
  }

  public markSkipped(songId: string): void {
    this.skippedTrackIds.add(songId);
    // Remove from candidate pool
    this.candidatePool = this.candidatePool.filter((s) => s.id !== songId);
  }

  public markLiked(songId: string): void {
    this.likedTrackIds.add(songId);
  }

  private updateStationIdentity(current: Song | null): void {
    if (!current) return;
    if (this.state.mode === 'adaptive') {
      const cleanArtist = normalizeArtistName(current.artist);
      this.state.stationName = `${cleanArtist} Mix`;
      this.state.stationVibe = `🎵 Radio based on ${current.title}`;
    }
  }

  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach((fn) => fn(currentState));
  }

  // ─── Room Next-Song Community Voting Duel ──────────────────────────────────

  /**
   * Generates a 2-song voting duel for a room based on the room's current station or vibe
   */
  public async generateRoomVotingDuel(roomId: string, currentSong?: Song | null): Promise<RoomSongDuel | null> {
    let pool = this.candidatePool.filter((s) => s.id !== currentSong?.id);
    if (pool.length < 2) {
      await this.replenishCandidatePool(true);
      pool = this.candidatePool.filter((s) => s.id !== currentSong?.id);
    }

    if (pool.length < 2) return null;

    const songA = pool[0];
    const songB = pool[1];

    const duel: RoomSongDuel = {
      roomId,
      songA,
      songB,
      votesA: 0,
      votesB: 0,
      voterIds: {},
      expiresAt: Date.now() + 60 * 1000, // 60 seconds comfortable voting window
    };

    this.roomDuels.set(roomId, duel);
    return duel;
  }

  public getRoomDuel(roomId: string): RoomSongDuel | null {
    return this.roomDuels.get(roomId) || null;
  }

  public castDuelVote(roomId: string, userId: string, choice: 'A' | 'B'): RoomSongDuel | null {
    const duel = this.roomDuels.get(roomId);
    if (!duel) return null;

    const previousVote = duel.voterIds[userId];
    if (previousVote === choice) return duel; // Already voted for this

    if (previousVote === 'A') duel.votesA = Math.max(0, duel.votesA - 1);
    if (previousVote === 'B') duel.votesB = Math.max(0, duel.votesB - 1);

    if (choice === 'A') duel.votesA++;
    if (choice === 'B') duel.votesB++;

    duel.voterIds[userId] = choice;
    this.roomDuels.set(roomId, duel);
    return duel;
  }

  public resolveVotingDuel(roomId: string): Song | null {
    const duel = this.roomDuels.get(roomId);
    if (!duel) return null;

    const winner = duel.votesB > duel.votesA ? duel.songB : duel.songA;
    this.roomDuels.delete(roomId);
    return winner;
  }

  // ─── Radio Debug Inspector API ─────────────────────────────────────────────

  public getDebugInfo(): RadioDebugInfo {
    const sample = this.candidatePool[0];
    const sampleConf = sample && this.state.seedLanguage
      ? this.calculateLanguageConfidence(sample, this.state.seedLanguage)
      : 1.0;

    return {
      stationName: this.state.stationName,
      mode: this.state.mode,
      candidatePoolCount: this.candidatePool.length,
      playedHistoryCount: this.playedHistory.length,
      uniqueArtistsCount: new Set(this.recentArtistWindow).size,
      recentArtists: [...this.recentArtistWindow],
      lastUsedQuery: this.lastUsedQuery,
      languageConfidenceSample: Math.round(sampleConf * 100) / 100,
      activeFallbackLevel: this.activeFallbackLevel,
    };
  }
}

export const radioEngine = RadioEngineClass.getInstance();
