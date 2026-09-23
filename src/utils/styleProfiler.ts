import { Song, UserMusicPreferences } from '../types';
import { DEFAULT_TRACKS } from '../services/audio/DefaultMusicProvider';

export interface StylePersona {
  personaName: string;
  personaTagline: string;
  primaryMood: string;
  vibeBadge: string;
  tags: string[];
  suggestedQueries: string[];
  recommendedTracks: Song[];
  isDefault: boolean;
}

export interface QuickStyleVibe {
  id: string;
  name: string;
  icon: string;
  vibeTag: string;
  searchSeed: string;
  accent: string;
  description: string;
}

export const QUICK_STYLE_VIBES: QuickStyleVibe[] = [
  {
    id: 'lofi_chill',
    name: 'Late Night Lo-Fi',
    icon: '🌙',
    vibeTag: 'Late Night Chill',
    searchSeed: 'lofi hip hop chill beats relax study',
    accent: 'from-indigo-600/30 to-purple-900/30 border-indigo-500/40 text-indigo-300',
    description: 'Mellow keys, tape saturation & soothing midnight ambient rhythms.',
  },
  {
    id: 'high_energy',
    name: 'Mass & Workout Fuel',
    icon: '🔥',
    vibeTag: 'Mass & High Energy',
    searchSeed: 'Tamil mass gym workout bass boosted songs Anirudh',
    accent: 'from-red-600/30 to-orange-900/30 border-red-500/40 text-red-300',
    description: 'Pulse-pounding 808s, electrifying drops & maximum adrenaline.',
  },
  {
    id: 'soulful_romance',
    name: 'Soulful & Romantic',
    icon: '❤️',
    vibeTag: 'Soulful Romance',
    searchSeed: 'Bollywood romantic soulful hits Arijit Singh Pritam',
    accent: 'from-rose-600/30 to-pink-900/30 border-rose-500/40 text-rose-300',
    description: 'Heartfelt melodies, acoustic guitar riffs & poetic vocals.',
  },
  {
    id: 'deep_work',
    name: 'Focus, Study & Code',
    icon: '☕',
    vibeTag: 'Focus & Deep Work',
    searchSeed: 'chill ambient background music for coding deep focus',
    accent: 'from-amber-600/30 to-yellow-900/30 border-amber-500/40 text-amber-300',
    description: 'Zero lyrical distraction, organic textures & flow state audio.',
  },
  {
    id: 'south_waves',
    name: 'South Indie & Groove',
    icon: '🌴',
    vibeTag: 'Malayalam & Tamil Indie',
    searchSeed: 'Malayalam hits Sushin Shyam Jakes Bejoy Aavesham',
    accent: 'from-emerald-600/30 to-teal-900/30 border-emerald-500/40 text-emerald-300',
    description: 'Experimental indie rhythms, folk guitars & cinematic synths.',
  },
  {
    id: 'punjabi_street',
    name: 'Desi Hip-Hop & Street',
    icon: '💥',
    vibeTag: 'Punjabi & Trap',
    searchSeed: 'Punjabi songs Diljit Dosanjh Karan Aujla AP Dhillon',
    accent: 'from-orange-600/30 to-amber-900/30 border-orange-500/40 text-orange-300',
    description: 'Heavy basslines, catchy Punjabi hooks & modern global trap.',
  },
  {
    id: 'retro_gold',
    name: 'Vintage Evergreens',
    icon: '📻',
    vibeTag: '70s-90s Classics',
    searchSeed: 'Golden retro hindi classics Kishore Kumar RD Burman',
    accent: 'from-yellow-600/30 to-amber-950/30 border-yellow-500/40 text-yellow-300',
    description: 'Analog warmth, master orchestration & timeless melodies.',
  },
  {
    id: 'global_pop',
    name: 'Global Pop & Synthwave',
    icon: '🌐',
    vibeTag: 'Billboard Hot 100',
    searchSeed: 'The Weeknd Dua Lipa Bruno Mars synthpop hits',
    accent: 'from-cyan-600/30 to-blue-900/30 border-cyan-500/40 text-cyan-300',
    description: 'Chart-topping retro synths, four-on-the-floor disco & glossy pop.',
  },
];

// Curated Hand-Picked "Our Favourites" Tracks with 100% playable official YouTube audio
export const CURATED_OUR_FAVOURITES: {
  song: Song;
  curatorNote: string;
  badge: string;
}[] = [
  {
    song: DEFAULT_TRACKS[0], // Jaada - Sushin Shyam
    curatorNote: 'Hypnotic electronic brass & infectious Malayalam energy',
    badge: "Editor's Choice",
  },
  {
    song: DEFAULT_TRACKS[1] || DEFAULT_TRACKS[0], // Illuminati - Sushin Shyam
    curatorNote: 'Bass-heavy South anthem that took the charts by storm',
    badge: 'Chart Topper',
  },
  {
    song: DEFAULT_TRACKS.find(t => t.tags?.includes('Tamil')) || DEFAULT_TRACKS[3] || DEFAULT_TRACKS[0],
    curatorNote: 'Pure Anirudh rockstar energy with stadium-level percussion',
    badge: 'High Voltage',
  },
  {
    song: DEFAULT_TRACKS.find(t => t.tags?.includes('Hindi')) || DEFAULT_TRACKS[4] || DEFAULT_TRACKS[0],
    curatorNote: 'Timeless acoustic soul that hits straight in the heart',
    badge: 'Soulful Melody',
  },
  {
    song: DEFAULT_TRACKS.find(t => t.tags?.includes('Chill') || t.tags?.includes('Acoustic')) || DEFAULT_TRACKS[3] || DEFAULT_TRACKS[0],
    curatorNote: 'Smooth sunset melodies for unwinding after a long day',
    badge: 'Late Night Chill',
  },
  {
    song: DEFAULT_TRACKS.find(t => t.tags?.includes('Retro')) || DEFAULT_TRACKS[13] || DEFAULT_TRACKS[2] || DEFAULT_TRACKS[0],
    curatorNote: 'Warm golden brass & vintage nostalgic instrumentation',
    badge: 'Evergreen Vibe',
  },
].filter((item): item is { song: Song; curatorNote: string; badge: string } => !!(item && item.song && item.song.id));

/**
 * Analyzes search history, user preferences, liked tracks, and play history
 * to dynamically synthesize the user's "Style Makeup".
 */
export function analyzeUserStyle(
  searchHistory: string[] = [],
  preferences: UserMusicPreferences | null = null,
  history: { song: Song }[] = [],
  likedSongs: Song[] = []
): StylePersona {
  const safeSearches = (searchHistory || []).filter(Boolean);
  const safeHistory = (history || []).filter(h => h && h.song && h.song.id);
  const safeLiked = (likedSongs || []).filter(s => s && s.id);
  const hasSearches = safeSearches.length > 0;
  const hasPrefs = !!(preferences && preferences.completedOnboarding);
  const hasHistory = safeHistory.length > 0;
  const hasLikes = safeLiked.length > 0;

  // Aggregate all text signals from search history, titles, artists, and tags
  const signals: string[] = [
    ...safeSearches.map(s => String(s).toLowerCase()),
    ...(preferences?.genres || []).filter(Boolean).map(g => String(g).toLowerCase()),
    ...(preferences?.languages || []).filter(Boolean).map(l => String(l).toLowerCase()),
    ...(preferences?.artists || []).filter(Boolean).map(a => String(a).toLowerCase()),
    ...safeLiked.flatMap(s => [
      s.title ? String(s.title).toLowerCase() : '',
      s.artist ? String(s.artist).toLowerCase() : '',
      ...(Array.isArray(s.tags) ? s.tags.filter(Boolean).map(t => String(t).toLowerCase()) : [])
    ]),
    ...safeHistory.slice(0, 15).flatMap(h => [
      h.song.title ? String(h.song.title).toLowerCase() : '',
      h.song.artist ? String(h.song.artist).toLowerCase() : '',
      ...(Array.isArray(h.song.tags) ? h.song.tags.filter(Boolean).map(t => String(t).toLowerCase()) : [])
    ]),
  ];

  const fullText = signals.filter(Boolean).join(' ');

  // If user is brand new with zero history or searches
  if (!hasSearches && !hasPrefs && !hasHistory && !hasLikes) {
    return {
      personaName: 'Curious Melodic Explorer',
      personaTagline: 'Discover our top favourites and pick your vibe to make up your signature sound.',
      primaryMood: 'Fresh & Eclectic',
      vibeBadge: '✨ Starter Taste',
      tags: ['#DiscoverFavourites', '#PickYourVibe', '#PureAudio', '#NoAlgorithms'],
      suggestedQueries: [
        'Malayalam hits Sushin Shyam',
        'Tamil Anirudh hits',
        'Arijit Singh soulful acoustic',
        'Lofi hip hop chill beats',
      ],
      recommendedTracks: CURATED_OUR_FAVOURITES.map(f => f.song).filter(Boolean),
      isDefault: true,
    };
  }

  // Count domain keywords
  const counts = {
    lofi: (fullText.match(/lofi|chill|sleep|relax|study|ambient|rain|focus|coffee/g) || []).length,
    mass: (fullText.match(/mass|bass|workout|gym|hype|edm|trap|party|club/g) || []).length,
    romance: (fullText.match(/romance|romantic|love|soul|acoustic|heart|melody|arijit/g) || []).length,
    retro: (fullText.match(/retro|vintage|classic|evergreen|90s|80s|70s|golden/g) || []).length,
    south: (fullText.match(/malayalam|tamil|kerala|sushin|anirudh|jakes|rahman|arr|tollywood|telugu/g) || []).length,
    punjabi: (fullText.match(/punjabi|diljit|aujla|ap dhillon|shubh|trap/g) || []).length,
    pop: (fullText.match(/pop|weeknd|billie|dua|disco|synthwave|english|global/g) || []).length,
  };

  // Find dominant mood
  let dominant = 'south';
  let maxCount = -1;
  (Object.keys(counts) as (keyof typeof counts)[]).forEach(k => {
    if (counts[k] > maxCount) {
      maxCount = counts[k];
      dominant = k;
    }
  });

  if (dominant === 'lofi' && counts.lofi > 0) {
    return {
      personaName: 'Midnight Lo-Fi Architect',
      personaTagline: 'Guided by mellow acoustic beats, tape saturation & introspective flow.',
      primaryMood: 'Late Night Chill',
      vibeBadge: '🌙 Ambient Chill',
      tags: ['#LofiFocus', '#LateNightVibes', '#MellowKeys', '#ZeroDistraction'],
      suggestedQueries: [
        'Lofi hip hop chill beats study',
        'Late night acoustic chill guitar',
        'Peaceful piano ambient coding',
        'Rainy day lofi melodies',
      ],
      recommendedTracks: DEFAULT_TRACKS.filter(t => t.tags?.some(tag => ['Acoustic', 'Chill', 'Melody'].includes(tag))).slice(0, 6),
      isDefault: false,
    };
  }

  if (dominant === 'mass' && counts.mass > 0) {
    return {
      personaName: 'High-Voltage Beat Master',
      personaTagline: 'Fueled by heavy 808 bass, chest-thumping drops & high-octane anthems.',
      primaryMood: 'Mass & Energetic',
      vibeBadge: '🔥 Pure Hype',
      tags: ['#MassBass', '#GymMotivation', '#Heavy808', '#StadiumEnergy'],
      suggestedQueries: [
        'Tamil mass gym workout songs Anirudh',
        'Aavesham Illuminati Jaada Sushin Shyam',
        'Telugu mass dance anthems DSP',
        'Bass boosted trap hype music',
      ],
      recommendedTracks: DEFAULT_TRACKS.filter(t => t.tags?.some(tag => ['Sushin', 'Anirudh', 'Energy', 'Tollywood'].includes(tag))).slice(0, 6),
      isDefault: false,
    };
  }

  if (dominant === 'romance' && counts.romance > 0) {
    return {
      personaName: 'Soulful Melody Romantic',
      personaTagline: 'Drawn to heartfelt vocals, acoustic fingerpicking & timeless poetry.',
      primaryMood: 'Soulful Romance',
      vibeBadge: '❤️ Acoustic Soul',
      tags: ['#AcousticSoul', '#HeartfeltMelodies', '#BollywoodLove', '#LateNightSerenade'],
      suggestedQueries: [
        'Arijit Singh romantic hits acoustic',
        'Jasleen Royal Prateek Kuhad indie',
        'Soulful Bollywood unplugged',
        'Sid Sriram melodious hits',
      ],
      recommendedTracks: DEFAULT_TRACKS.filter(t => t.tags?.some(tag => ['Soul', 'Romance', 'Arijit'].includes(tag))).slice(0, 6),
      isDefault: false,
    };
  }

  if (dominant === 'punjabi' && counts.punjabi > 0) {
    return {
      personaName: 'Desi Street Pioneer',
      personaTagline: 'Vibing with crisp 808s, Punjabi swagger & international chart hits.',
      primaryMood: 'Punjabi & Trap',
      vibeBadge: '💥 Desi Street',
      tags: ['#BrownMunde', '#PunjabiHype', '#GlobalTrap', '#ModernDesi'],
      suggestedQueries: [
        'Diljit Dosanjh hit songs official audio',
        'Karan Aujla latest trap tracks',
        'AP Dhillon Punjabi wave',
        'Desi hip hop street anthems',
      ],
      recommendedTracks: DEFAULT_TRACKS.filter(t => t.tags?.some(tag => ['Dance', 'Energy'].includes(tag))).slice(0, 6),
      isDefault: false,
    };
  }

  if (dominant === 'retro' && counts.retro > 0) {
    return {
      personaName: 'Golden Era Vinyl Connoisseur',
      personaTagline: 'Cherishing organic warmth, master orchestras & classic 70s-90s recordings.',
      primaryMood: 'Vintage Gold',
      vibeBadge: '📻 Golden Retro',
      tags: ['#EvergreenClassics', '#AnalogWarmth', '#Golden90s', '#MasterComposers'],
      suggestedQueries: [
        'RD Burman Kishore Kumar timeless classics',
        'SPB evergreen Tamil melodies',
        'Yesudas golden Malayalam melodies',
        '90s Bollywood romance songs',
      ],
      recommendedTracks: DEFAULT_TRACKS.filter(t => t.tags?.some(tag => ['Retro', 'Soul'].includes(tag))).slice(0, 6),
      isDefault: false,
    };
  }

  // Default South & Cinematic Indie
  return {
    personaName: 'South Cinema & Indie Connoisseur',
    personaTagline: 'Curating world-class composers, experimental fusion & cinematic masterstrokes.',
    primaryMood: 'South Indie & Groove',
    vibeBadge: '🌴 South Waves',
    tags: ['#SushinShyam', '#AnirudhVibes', '#MalayalamIndie', '#KollywoodHits'],
    suggestedQueries: [
      'Aavesham Sushin Shyam songs',
      'Anirudh Ravichander best tracks',
      'Malayalam indie acoustic songs',
      'Thallumaala Vishnu Vijay hits',
    ],
    recommendedTracks: DEFAULT_TRACKS.slice(0, 6),
    isDefault: false,
  };
}
