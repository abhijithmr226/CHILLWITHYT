import { Song, UserMusicPreferences } from '../types';
import {
  DEFAULT_TRACKS,
  getTracksByTag,
  getTracksByLanguage,
  getDiverseSampleTracks
} from '../services/audio/DefaultMusicProvider';

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

export interface CuratedFavouriteItem {
  song: Song;
  curatorNote: string;
  badge: string;
}

export const FAVOURITE_CATEGORIES = [
  { id: 'foryou', label: '✨ Curated For You' },
  { id: 'global', label: '🌐 Global Pop' },
  { id: 'bollywood', label: '🇮🇳 Bollywood Soul' },
  { id: 'south', label: '🌴 South Waves' },
  { id: 'punjabi', label: '💥 Punjabi & Trap' },
  { id: 'lofi', label: '☕ Lo-Fi Chill' },
];

/**
 * Dynamically produces hand-picked gems based on category and user taste.
 * Avoids rigid templates by adapting directly to preferences.
 */
export function getCuratedFavourites(
  category = 'foryou',
  preferences?: UserMusicPreferences | null
): CuratedFavouriteItem[] {
  if (category === 'global') {
    const pop = getTracksByTag('english').slice(0, 6);
    return pop.map((song, i) => ({
      song,
      curatorNote: i === 0 ? 'Chart-dominating synthwave pop with timeless energy' : 'Global Billboard hit streaming worldwide',
      badge: i === 0 ? 'Global Anthem' : 'Billboard Top 10',
    }));
  }

  if (category === 'bollywood') {
    const hindi = getTracksByTag('hindi').slice(0, 6);
    return hindi.map((song, i) => ({
      song,
      curatorNote: i === 0 ? 'Heartfelt acoustic soul straight from Bollywood classics' : 'Soulful melody with acoustic instrumentation',
      badge: i === 0 ? 'Soulful Hit' : 'Acoustic Melody',
    }));
  }

  if (category === 'south') {
    const south = [...getTracksByTag('malayalam'), ...getTracksByTag('tamil'), ...getTracksByTag('telugu')].slice(0, 6);
    return south.map((song, i) => ({
      song,
      curatorNote: i === 0 ? 'Infectious rhythm & cinematic bass drops' : 'South Indian mass anthem with stadium percussion',
      badge: i === 0 ? "Editor's Pick" : 'Cinema Chartbuster',
    }));
  }

  if (category === 'punjabi') {
    const punjabi = getTracksByTag('punjabi').slice(0, 6);
    return punjabi.map((song, i) => ({
      song,
      curatorNote: 'Heavy 808s, street flow & global Punjabi trap anthem',
      badge: i === 0 ? 'Desi Hit' : 'Club Banger',
    }));
  }

  if (category === 'lofi') {
    const lofi = getTracksByTag('lofi').slice(0, 6);
    return lofi.map((song, i) => ({
      song,
      curatorNote: 'Calming ambient keys, warm tape saturation & flow-state beats',
      badge: 'Zero Distraction',
    }));
  }

  // category === 'foryou'
  // Check if user has explicit preferences set
  if (preferences && preferences.completedOnboarding) {
    const userLangs = (preferences.languages || []).map(l => l.toLowerCase());
    const userGenres = (preferences.genres || []).map(g => g.toLowerCase());
    const matched: Song[] = [];

    // Prioritize language preferences
    for (const lang of userLangs) {
      const found = getTracksByLanguage(lang);
      matched.push(...found.slice(0, 2));
    }

    // Prioritize genre preferences
    for (const g of userGenres) {
      const found = getTracksByTag(g);
      matched.push(...found.slice(0, 2));
    }

    // Deduplicate
    const unique = matched.filter((s, idx, arr) => arr.findIndex(x => x.id === s.id) === idx);
    if (unique.length >= 4) {
      return unique.slice(0, 6).map((song, i) => ({
        song,
        curatorNote: 'Tailored precisely to your selected languages and listening taste',
        badge: i === 0 ? 'Top Taste Match' : 'For You',
      }));
    }
  }

  // Diverse multi-genre eclectic lineup for new users: English, Hindi, Punjabi, South, Lofi
  const balanced = getDiverseSampleTracks(6);
  const badges = ['Global Hit', 'Soulful Romance', 'High Voltage', 'Desi Trap', 'South Wave', 'Deep Focus'];
  const notes = [
    'Chart-topping pop synthwave with universal acclaim',
    'Timeless acoustic Bollywood soul that resonates deeply',
    'Electrifying bass percussion and stadium energy',
    'Modern Punjabi 808 rhythm with swagger and groove',
    'Experimental cinematic fusion and infectious beats',
    'Ambient soothing vinyl crackle for effortless focus',
  ];

  return balanced.map((song, i) => ({
    song,
    curatorNote: notes[i] || 'Hand-picked musical gem from our curated sound vault',
    badge: badges[i] || "Editor's Choice",
  }));
}

// Fallback constant for legacy imports
export const CURATED_OUR_FAVOURITES: CuratedFavouriteItem[] = getCuratedFavourites('foryou');

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
    const starterTracks = getCuratedFavourites('foryou').map(f => f.song);
    return {
      personaName: 'Curious Melodic Explorer',
      personaTagline: 'Discover our top favourites and pick your vibe to make up your signature sound.',
      primaryMood: 'Fresh & Eclectic',
      vibeBadge: '✨ Starter Taste',
      tags: ['#DiscoverFavourites', '#PickYourVibe', '#PureAudio', '#NoAlgorithms'],
      suggestedQueries: [
        'The Weeknd Starboy official audio',
        'Arijit Singh Kesariya Brahmastra',
        'Anirudh Naa Ready Leo',
        'Lofi hip hop chill beats study',
      ],
      recommendedTracks: starterTracks,
      isDefault: true,
    };
  }

  // 1. Direct explicit preference priority (if user completed onboarding taste tuner)
  if (hasPrefs && preferences) {
    const langs = (preferences.languages || []).map(l => l.toLowerCase());
    const genres = (preferences.genres || []).map(g => g.toLowerCase());

    if (langs.includes('english') || genres.includes('pop') || genres.includes('hip-hop')) {
      const engTracks = getTracksByTag('english');
      if (engTracks.length > 0) {
        return {
          personaName: 'Global Pop & Modern Synthwave',
          personaTagline: 'Hook-driven melodies, retro 80s synths, and chart-topping international anthems.',
          primaryMood: 'Global Pop',
          vibeBadge: '🌐 Modern Pop',
          tags: ['#BillboardHot100', '#Synthwave', '#GlobalHits', '#RadioTop40'],
          suggestedQueries: [
            'The Weeknd top hit songs',
            'Dua Lipa disco dance pop',
            'Taylor Swift pop anthems',
            'Billie Eilish indie pop',
          ],
          recommendedTracks: engTracks.slice(0, 6),
          isDefault: false,
        };
      }
    }

    if (langs.includes('hindi') || genres.includes('bollywood') || genres.includes('romance')) {
      const hinTracks = getTracksByTag('hindi');
      if (hinTracks.length > 0) {
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
            'Pritam greatest hits',
          ],
          recommendedTracks: hinTracks.slice(0, 6),
          isDefault: false,
        };
      }
    }

    if (langs.includes('punjabi')) {
      const punTracks = getTracksByTag('punjabi');
      if (punTracks.length > 0) {
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
          recommendedTracks: punTracks.slice(0, 6),
          isDefault: false,
        };
      }
    }
  }

  // 2. Count domain keywords across listening history and searches
  const counts = {
    lofi: (fullText.match(/lofi|chill|sleep|relax|study|ambient|rain|focus|coffee/g) || []).length,
    mass: (fullText.match(/mass|bass|workout|gym|hype|edm|trap|party|club/g) || []).length,
    romance: (fullText.match(/romance|romantic|love|soul|acoustic|heart|melody|arijit|hindi|bollywood/g) || []).length,
    retro: (fullText.match(/retro|vintage|classic|evergreen|90s|80s|70s|golden/g) || []).length,
    south: (fullText.match(/malayalam|tamil|kerala|sushin|anirudh|jakes|rahman|arr|tollywood|telugu/g) || []).length,
    punjabi: (fullText.match(/punjabi|diljit|aujla|ap dhillon|shubh/g) || []).length,
    pop: (fullText.match(/pop|weeknd|billie|dua|disco|synthwave|english|global|taylor|swift/g) || []).length,
  };

  // Find dominant mood
  let dominant: keyof typeof counts | null = null;
  let maxCount = 0;
  (Object.keys(counts) as (keyof typeof counts)[]).forEach(k => {
    if (counts[k] > maxCount) {
      maxCount = counts[k];
      dominant = k;
    }
  });

  if (dominant === 'pop' && counts.pop > 0) {
    const popTracks = getTracksByTag('english');
    return {
      personaName: 'Global Pop & Modern Synthwave',
      personaTagline: 'Hook-driven melodies, retro 80s synths, and chart-topping international anthems.',
      primaryMood: 'Global Pop',
      vibeBadge: '🌐 Modern Pop',
      tags: ['#BillboardHot100', '#Synthwave', '#GlobalHits', '#RadioTop40'],
      suggestedQueries: [
        'The Weeknd top hit songs',
        'Dua Lipa disco dance pop',
        'Taylor Swift pop anthems',
        'Billie Eilish indie pop',
      ],
      recommendedTracks: popTracks.slice(0, 6),
      isDefault: false,
    };
  }

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
      recommendedTracks: DEFAULT_TRACKS.filter(t => t.tags?.some(tag => ['Acoustic', 'Chill', 'Melody', 'Lofi'].includes(tag))).slice(0, 6),
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
    const hindiTracks = getTracksByTag('hindi');
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
      recommendedTracks: (hindiTracks.length > 0 ? hindiTracks : DEFAULT_TRACKS.filter(t => t.tags?.some(tag => ['Soul', 'Romance', 'Arijit'].includes(tag)))).slice(0, 6),
      isDefault: false,
    };
  }

  if (dominant === 'punjabi' && counts.punjabi > 0) {
    const punjabiTracks = getTracksByTag('punjabi');
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
      recommendedTracks: (punjabiTracks.length > 0 ? punjabiTracks : DEFAULT_TRACKS.filter(t => t.tags?.some(tag => ['Dance', 'Energy'].includes(tag)))).slice(0, 6),
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

  if (dominant === 'south' && counts.south > 0) {
    const southTracks = [...getTracksByTag('malayalam'), ...getTracksByTag('tamil')];
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
      recommendedTracks: southTracks.slice(0, 6),
      isDefault: false,
    };
  }

  // 3. Balanced multi-genre eclectic lineup if no single genre is dominant
  const balancedGems = getDiverseSampleTracks(6);
  return {
    personaName: 'Curious Melodic Explorer',
    personaTagline: 'An eclectic cross-section of global hits, soulful acoustics, and timeless grooves.',
    primaryMood: 'Eclectic & Fresh',
    vibeBadge: '✨ Eclectic Vibe',
    tags: ['#GlobalHits', '#SoulAcoustic', '#PureVibes', '#NoBorders'],
    suggestedQueries: [
      'The Weeknd Starboy official audio',
      'Arijit Singh Kesariya Brahmastra',
      'Anirudh Naa Ready Leo',
      'Lofi hip hop beats study focus',
    ],
    recommendedTracks: balancedGems,
    isDefault: true,
  };
}
