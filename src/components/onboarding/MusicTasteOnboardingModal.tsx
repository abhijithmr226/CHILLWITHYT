import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { UserMusicPreferences } from '../../types';
import { 
  Sparkles, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Music, 
  Search, 
  Plus, 
  Radio, 
  Headphones, 
  Flame, 
  Heart, 
  Moon, 
  Coffee, 
  Zap,
  Disc3,
  X
} from 'lucide-react';

interface LanguageOption {
  id: string;
  name: string;
  native: string;
  badge: string;
  region: string;
  color: string;
  bgGradient: string;
}

const LANGUAGES: LanguageOption[] = [
  { id: 'Malayalam', name: 'Malayalam', native: 'മലയാളം', badge: '🌴 God\'s Own Country', region: 'kerala', color: '#10b981', bgGradient: 'from-emerald-950/40 to-black' },
  { id: 'Tamil', name: 'Tamil', native: 'தமிழ்', badge: '⚡ Kollywood & Indie', region: 'tamilnadu', color: '#f59e0b', bgGradient: 'from-amber-950/40 to-black' },
  { id: 'Telugu', name: 'Telugu', native: 'తెలుగు', badge: '🔥 Tollywood Highs', region: 'andhra', color: '#ef4444', bgGradient: 'from-red-950/40 to-black' },
  { id: 'Hindi', name: 'Hindi', native: 'हिन्दी', badge: '🌙 Bollywood & Soul', region: 'north', color: '#8b5cf6', bgGradient: 'from-purple-950/40 to-black' },
  { id: 'Punjabi', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', badge: '💥 Hip Hop & Trap', region: 'punjab', color: '#f97316', bgGradient: 'from-orange-950/40 to-black' },
  { id: 'English', name: 'English', native: 'Global', badge: '🌐 Hot 100 & Pop', region: 'global', color: '#06b6d4', bgGradient: 'from-cyan-950/40 to-black' },
  { id: 'Lofi', name: 'Lo-Fi / Focus', native: 'Ambient', badge: '☕ Study & Code', region: 'ambient', color: '#ec4899', bgGradient: 'from-pink-950/40 to-black' },
  { id: 'Retro', name: 'Retro Classics', native: 'Evergreens', badge: '📻 70s-90s Golden Era', region: 'retro', color: '#eab308', bgGradient: 'from-yellow-950/40 to-black' },
  { id: 'Indie', name: 'Indian Indie', native: 'Acoustic', badge: '🌅 Sunset & Coffee', region: 'indie', color: '#14b8a6', bgGradient: 'from-teal-950/40 to-black' },
];

interface VibeOption {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  tag: string;
  accent: string;
}

const VIBES: VibeOption[] = [
  { id: 'Late Night Chill', title: 'Late Night Chill', description: 'Mellow keys, lo-fi beats, gentle vocals for winding down.', icon: Moon, tag: '🌙 Mellow', accent: 'text-indigo-400 border-indigo-500/30 hover:border-indigo-500' },
  { id: 'Mass & High Energy', title: 'Mass / Workout Fuel', description: 'Bass-heavy anthems, electrifying drops, pure hype.', icon: Flame, tag: '🔥 Intense', accent: 'text-red-400 border-red-500/30 hover:border-red-500' },
  { id: 'Soulful Romance', title: 'Soulful & Romantic', description: 'Heartfelt melodies, acoustic guitar riffs & timeless poetry.', icon: Heart, tag: '❤️ Soulful', accent: 'text-rose-400 border-rose-500/30 hover:border-rose-500' },
  { id: 'Focus & Ambient Lo-Fi', title: 'Focus, Study & Code', description: 'Zero lyrical distraction, soothing tape crackle & synth textures.', icon: Coffee, tag: '☕ Deep Work', accent: 'text-amber-400 border-amber-500/30 hover:border-amber-500' },
  { id: 'Sunset Acoustic Indie', title: 'Sunset Indie & Coffeehouse', description: 'Raw guitars, intimate vocals, coffee shop serenades.', icon: Headphones, tag: '🌅 Indie', accent: 'text-teal-400 border-teal-500/30 hover:border-teal-500' },
  { id: 'Golden Retro Nostalgia', title: 'Evergreen Classics (70s-90s)', description: 'Analog warmth, master orchestras, golden melodies.', icon: Disc3, tag: '📻 Vintage', accent: 'text-yellow-400 border-yellow-500/30 hover:border-yellow-500' },
];

interface CuratedArtist {
  id: string;
  name: string;
  role: string;
  languages: string[];
  photo: string;
}

const CURATED_ARTISTS: CuratedArtist[] = [
  // Malayalam
  { id: 'sushin', name: 'Sushin Shyam', role: 'Composer / Producer', languages: ['Malayalam'], photo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&fit=crop' },
  { id: 'rex', name: 'Rex Vijayan', role: 'Guitarist / Composer', languages: ['Malayalam'], photo: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&fit=crop' },
  { id: 'sreenath', name: 'Sreenath Bhasi', role: 'Vocalist / Actor', languages: ['Malayalam'], photo: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&fit=crop' },
  { id: 'jakes', name: 'Jakes Bejoy', role: 'Composer', languages: ['Malayalam'], photo: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=200&fit=crop' },
  
  // Tamil
  { id: 'anirudh', name: 'Anirudh Ravichander', role: 'Composer / Rock Star', languages: ['Tamil', 'Telugu'], photo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&fit=crop' },
  { id: 'arr', name: 'A.R. Rahman', role: 'Maestro / Composer', languages: ['Tamil', 'Hindi'], photo: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=200&fit=crop' },
  { id: 'santhosh', name: 'Santhosh Narayanan', role: 'Acoustic / Folk / Bass', languages: ['Tamil', 'Telugu'], photo: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&fit=crop' },
  { id: 'sid_sriram', name: 'Sid Sriram', role: 'Carnatic / Playback', languages: ['Tamil', 'Telugu', 'Malayalam'], photo: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&fit=crop' },

  // Telugu
  { id: 'dsp', name: 'Devi Sri Prasad (DSP)', role: 'Composer / Rock Star', languages: ['Telugu', 'Tamil'], photo: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&fit=crop' },
  { id: 'thaman', name: 'Thaman S', role: 'Music Director', languages: ['Telugu'], photo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&fit=crop' },

  // Hindi / Bollywood
  { id: 'arijit', name: 'Arijit Singh', role: 'Soul Vocalist', languages: ['Hindi'], photo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&fit=crop' },
  { id: 'pritam', name: 'Pritam', role: 'Composer', languages: ['Hindi'], photo: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=200&fit=crop' },
  { id: 'shreya', name: 'Shreya Ghoshal', role: 'Queen of Melody', languages: ['Hindi', 'Malayalam', 'Tamil', 'Telugu'], photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop' },
  { id: 'jasleen', name: 'Jasleen Royal', role: 'Acoustic Songwriter', languages: ['Hindi', 'Indie'], photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop' },

  // Punjabi
  { id: 'diljit', name: 'Diljit Dosanjh', role: 'Global Icon', languages: ['Punjabi'], photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=crop' },
  { id: 'karan_aujla', name: 'Karan Aujla', role: 'Rapper / Lyricist', languages: ['Punjabi'], photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&fit=crop' },
  { id: 'ap_dhillon', name: 'AP Dhillon', role: 'Brown Munde Hype', languages: ['Punjabi'], photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&fit=crop' },

  // English & Global Pop
  { id: 'weeknd', name: 'The Weeknd', role: 'Synthpop / R&B', languages: ['English'], photo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&fit=crop' },
  { id: 'bruno', name: 'Bruno Mars', role: 'Soul / Funk', languages: ['English'], photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&fit=crop' },
  { id: 'billie', name: 'Billie Eilish', role: 'Alternative Pop', languages: ['English'], photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop' },

  // Indie & Retro
  { id: 'chai_toast', name: 'When Chai Met Toast', role: 'Indie Folk', languages: ['Indie', 'Malayalam', 'English'], photo: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=200&fit=crop' },
  { id: 'prateek', name: 'Prateek Kuhad', role: 'Acoustic Indie', languages: ['Indie', 'Hindi'], photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&fit=crop' },
  { id: 'spb', name: 'S.P. Balasubrahmanyam', role: 'Legendary Maestro', languages: ['Retro', 'Tamil', 'Telugu'], photo: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&fit=crop' },
  { id: 'yesudas', name: 'K.J. Yesudas', role: 'Celestial Singer', languages: ['Retro', 'Malayalam', 'Tamil'], photo: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=200&fit=crop' },
];

export const MusicTasteOnboardingModal: React.FC = () => {
  const [state, store] = useStore();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Selections
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    state.musicPreferences?.languages || ['Malayalam', 'Tamil']
  );
  const [selectedVibes, setSelectedVibes] = useState<string[]>(
    state.musicPreferences?.genres || ['Late Night Chill']
  );
  const [selectedArtists, setSelectedArtists] = useState<string[]>(
    state.musicPreferences?.artists || ['Sushin Shyam', 'Anirudh Ravichander']
  );
  const [customArtistInput, setCustomArtistInput] = useState('');
  const [artistSearch, setArtistSearch] = useState('');

  // Synthesis animation state
  const [synthesisStage, setSynthesisStage] = useState(0);

  if (!state.isTasteOnboardingOpen) {
    return null;
  }

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang)
        ? (prev.length > 1 ? prev.filter(l => l !== lang) : prev)
        : [...prev, lang]
    );
  };

  const toggleVibe = (vibe: string) => {
    setSelectedVibes(prev => 
      prev.includes(vibe)
        ? (prev.length > 1 ? prev.filter(v => v !== vibe) : prev)
        : [...prev, vibe]
    );
  };

  const toggleArtist = (name: string) => {
    setSelectedArtists(prev => 
      prev.includes(name)
        ? (prev.length > 1 ? prev.filter(a => a !== name) : prev)
        : [...prev, name]
    );
  };

  const handleAddCustomArtist = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customArtistInput.trim();
    if (!clean) return;
    if (!selectedArtists.includes(clean)) {
      setSelectedArtists(prev => [clean, ...prev]);
    }
    setCustomArtistInput('');
  };

  // Recommended artists filtered by selected languages
  const recommendedArtists = useMemo(() => {
    return CURATED_ARTISTS.filter(a => 
      a.languages.some(l => selectedLanguages.includes(l))
    );
  }, [selectedLanguages]);

  // Search filtered artists
  const displayedArtists = useMemo(() => {
    if (!artistSearch.trim()) return recommendedArtists.length > 0 ? recommendedArtists : CURATED_ARTISTS;
    const query = artistSearch.toLowerCase();
    return CURATED_ARTISTS.filter(a => 
      a.name.toLowerCase().includes(query) || 
      a.role.toLowerCase().includes(query)
    );
  }, [recommendedArtists, artistSearch]);

  const handleStartSynthesis = () => {
    setStep(4);
    setSynthesisStage(1);

    setTimeout(() => {
      setSynthesisStage(2);
    }, 700);

    setTimeout(() => {
      setSynthesisStage(3);
    }, 1400);

    setTimeout(() => {
      try {
        const prefs: UserMusicPreferences = {
          languages: selectedLanguages,
          genres: selectedVibes,
          artists: selectedArtists,
          primaryLanguage: selectedLanguages[0] || 'Malayalam',
          completedOnboarding: true,
          completedAt: new Date().toISOString(),
        };
        store.saveMusicPreferences(prefs);
      } catch (err) {
        console.warn('Error saving music preferences:', err);
      } finally {
        store.setState({ isTasteOnboardingOpen: false });
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0F0F12] border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Glow Header Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse" />

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <Sparkles className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Personalize Your Vibe
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-semibold border border-red-500/30">
                  Step {step} of 3
                </span>
              </h2>
              <p className="text-xs text-white/50">
                {step === 1 && "Choose your music scenes & languages"}
                {step === 2 && "Select the energy & vibes you listen to"}
                {step === 3 && "Pick your favorite artists to seed your daily radio"}
                {step === 4 && "Generating your bespoke music universe..."}
              </p>
            </div>
          </div>

          <button
            onClick={() => store.setState({ isTasteOnboardingOpen: false })}
            className="text-xs text-white/50 hover:text-white transition px-3 py-1.5 rounded-xl hover:bg-white/10 flex items-center gap-1.5 cursor-pointer border border-white/10"
            title="Close"
          >
            <span>{step < 4 ? "Skip for now" : "Done"}</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* STEP 1: LANGUAGES & SCENES */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider text-white/40 font-semibold">
                  Select Languages ({selectedLanguages.length} chosen)
                </label>
                <span className="text-[11px] text-red-400">Select at least 1</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {LANGUAGES.map(lang => {
                  const isSelected = selectedLanguages.includes(lang.id);
                  return (
                    <button
                      key={lang.id}
                      onClick={() => toggleLanguage(lang.id)}
                      className={`relative text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between group overflow-hidden ${
                        isSelected 
                          ? 'bg-red-500/10 border-red-500/50 shadow-lg shadow-red-500/10' 
                          : 'bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className="text-sm font-bold text-white group-hover:text-red-400 transition">
                          {lang.name}
                        </span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                          isSelected ? 'bg-red-600 border-red-500 text-white' : 'border-white/20 bg-black/40'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-white/40 font-medium">{lang.native}</span>
                        <span className="text-[10px] text-white/50">{lang.badge}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: SONIC VIBES */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider text-white/40 font-semibold">
                  What Energy Fits Your Days? ({selectedVibes.length} selected)
                </label>
                <span className="text-[11px] text-red-400">Multi-select enabled</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {VIBES.map(vibe => {
                  const isSelected = selectedVibes.includes(vibe.id);
                  const Icon = vibe.icon;
                  return (
                    <button
                      key={vibe.id}
                      onClick={() => toggleVibe(vibe.id)}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 flex items-start space-x-3.5 ${
                        isSelected
                          ? 'bg-red-500/10 border-red-500/60 shadow-lg shadow-red-500/10'
                          : 'bg-white/[0.03] border-white/5 hover:border-white/20 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-white/60'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-white">{vibe.title}</h4>
                          {isSelected && <Check className="w-4 h-4 text-red-400" />}
                        </div>
                        <p className="text-xs text-white/50 mt-1 leading-relaxed line-clamp-2">
                          {vibe.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: TOP ARTISTS */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              {/* Search + Add Custom */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search composers or singers..."
                    value={artistSearch}
                    onChange={e => setArtistSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-red-500/50"
                  />
                </div>

                <form onSubmit={handleAddCustomArtist} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add custom artist..."
                    value={customArtistInput}
                    onChange={e => setCustomArtistInput(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-red-500/50"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </form>
              </div>

              {/* Selected Pills */}
              {selectedArtists.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 max-h-24 overflow-y-auto custom-scrollbar">
                  <span className="text-[11px] text-white/40 self-center mr-1">Your lineup:</span>
                  {selectedArtists.map(artist => (
                    <button
                      key={artist}
                      onClick={() => toggleArtist(artist)}
                      className="px-2.5 py-1 rounded-lg bg-red-600/20 border border-red-500/40 text-red-300 text-xs font-medium flex items-center gap-1.5 hover:bg-red-600/30 transition"
                    >
                      <span>{artist}</span>
                      <span className="text-red-400 text-[10px]">✕</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Artist Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {displayedArtists.map(artist => {
                  const isSelected = selectedArtists.includes(artist.name);
                  return (
                    <button
                      key={artist.id}
                      onClick={() => toggleArtist(artist.name)}
                      className={`flex items-center space-x-3 p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-red-500/15 border-red-500/50 text-white'
                          : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.07] text-white/80'
                      }`}
                    >
                      <img
                        src={artist.photo}
                        alt={artist.name}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-bold truncate text-white">{artist.name}</h5>
                        <p className="text-[10px] text-white/40 truncate">{artist.role}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border flex-shrink-0 ${
                        isSelected ? 'bg-red-600 border-red-500 text-white' : 'border-white/20'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: SYNTHESIS LOADING */}
          {step === 4 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center shadow-xl shadow-red-500/30">
                  <Music className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>

              <div className="space-y-2 max-w-sm">
                <h3 className="text-lg font-bold text-white">
                  {synthesisStage === 1 && "Deciphering Your Sonic Profile..."}
                  {synthesisStage === 2 && `Synthesizing ${selectedArtists[0] || 'Artist'} Radio...`}
                  {synthesisStage === 3 && "Setting Up Your Personalized Feed..."}
                </h3>
                <p className="text-xs text-white/50">
                  Curating {selectedLanguages.join(', ')} scenes with {selectedVibes[0] || 'Chill'} flow.
                </p>
              </div>

              {/* Live steps pill */}
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full transition-all duration-300 ${synthesisStage >= 1 ? 'bg-red-500 scale-125' : 'bg-white/20'}`} />
                <span className={`w-2 h-2 rounded-full transition-all duration-300 ${synthesisStage >= 2 ? 'bg-red-500 scale-125' : 'bg-white/20'}`} />
                <span className={`w-2 h-2 rounded-full transition-all duration-300 ${synthesisStage >= 3 ? 'bg-red-500 scale-125' : 'bg-white/20'}`} />
              </div>

              <button
                type="button"
                onClick={() => {
                  try {
                    store.saveMusicPreferences({
                      languages: selectedLanguages,
                      genres: selectedVibes,
                      artists: selectedArtists,
                      primaryLanguage: selectedLanguages[0] || 'Malayalam',
                      completedOnboarding: true,
                    });
                  } catch {}
                  store.setState({ isTasteOnboardingOpen: false });
                }}
                className="mt-1 px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold transition cursor-pointer shadow-lg shadow-red-600/20 active:scale-95"
              >
                Start Listening Now →
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        {step < 4 && (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-black/40">
            {step > 1 ? (
              <button
                onClick={() => setStep((step - 1) as any)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 transition flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep((step + 1) as any)}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-red-600/20 active:scale-95"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleStartSynthesis}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-red-600/30 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                Tune My Playlists
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
