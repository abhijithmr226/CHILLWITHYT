import React, { useState, useEffect } from 'react';
import { radioEngine, RadioState } from '../../services/audio/RadioEngine';
import { audioManager, PlaybackState } from '../../services/audio/AudioManager';
import {
  Radio,
  Play,
  Pause,
  Sparkles,
  Search,
  Music2,
  Globe,
  Users,
  Mic2,
  Flame,
  Check,
  Disc,
  ArrowRight,
  Compass,
  Zap,
  Moon,
  Headphones,
  Coffee,
  Mic,
  Guitar,
  Music,
  Disc3,
  Star,
  Award
} from 'lucide-react';

interface StationItem {
  id: string;
  name: string;
  category: 'language' | 'artist';
  target: string;
  vibe: string;
  query: string;
  icon: React.ComponentType<{ className?: string }>;
  listeners: string;
  gradient: string;
  featuredArtists: string[];
}

const LANGUAGE_STATIONS: StationItem[] = [
  {
    id: 'rad-malayalam',
    name: 'Malayalam 24/7 Hits Radio',
    category: 'language',
    target: 'Malayalam',
    vibe: 'Kerala Melodies & Indie Grooves',
    query: 'Malayalam hits songs Sushin Shyam Jassie Gift official audio',
    icon: Compass,
    listeners: '14.2K listening',
    gradient: 'from-emerald-900/60 to-teal-950/60 border-emerald-500/30',
    featuredArtists: ['Sushin Shyam', 'Rex Vijayan', 'Shaan Rahman'],
  },
  {
    id: 'rad-tamil',
    name: 'Tamil Kollywood Rockstar Radio',
    category: 'language',
    target: 'Tamil',
    vibe: 'High-Octane Anirudh & ARR Hits',
    query: 'Tamil hit songs Anirudh AR Rahman Yuvan Shankar Raja official audio',
    icon: Zap,
    listeners: '29.8K listening',
    gradient: 'from-red-900/60 to-orange-950/60 border-red-500/30',
    featuredArtists: ['Anirudh', 'A.R. Rahman', 'Harris Jayaraj'],
  },
  {
    id: 'rad-telugu',
    name: 'Telugu Tollywood Mass Radio',
    category: 'language',
    target: 'Telugu',
    vibe: 'DSP & Thaman S Energy Anthems',
    query: 'Telugu mass songs Devi Sri Prasad Thaman S official audio',
    icon: Flame,
    listeners: '21.4K listening',
    gradient: 'from-amber-900/60 to-orange-950/60 border-amber-500/30',
    featuredArtists: ['Devi Sri Prasad', 'Thaman S', 'Mickey J Meyer'],
  },
  {
    id: 'rad-hindi',
    name: 'Bollywood Romance & Lo-Fi Radio',
    category: 'language',
    target: 'Hindi',
    vibe: 'Arijit Singh & Soulful Acoustic',
    query: 'Bollywood romantic songs Arijit Singh Pritam Shreya Ghoshal official audio',
    icon: Moon,
    listeners: '48.6K listening',
    gradient: 'from-rose-900/60 to-pink-950/60 border-rose-500/30',
    featuredArtists: ['Arijit Singh', 'Pritam', 'Atif Aslam'],
  },
  {
    id: 'rad-punjabi',
    name: 'Punjabi Wave & Bhangra Radio',
    category: 'language',
    target: 'Punjabi',
    vibe: 'Diljit Dosanjh & Karan Aujla Beats',
    query: 'Punjabi hit songs Diljit Dosanjh Karan Aujla AP Dhillon official audio',
    icon: Radio,
    listeners: '34.2K listening',
    gradient: 'from-yellow-900/60 to-amber-950/60 border-yellow-500/30',
    featuredArtists: ['Diljit Dosanjh', 'Karan Aujla', 'AP Dhillon'],
  },
  {
    id: 'rad-english',
    name: 'Global Billboard Hits Radio',
    category: 'language',
    target: 'English',
    vibe: 'Top 50 Hot Hits & Synthwave',
    query: 'Billboard Hot 100 hit songs The Weeknd Taylor Swift official audio',
    icon: Headphones,
    listeners: '56.1K listening',
    gradient: 'from-blue-900/60 to-indigo-950/60 border-blue-500/30',
    featuredArtists: ['The Weeknd', 'Taylor Swift', 'Dua Lipa'],
  },
  {
    id: 'rad-lofi',
    name: 'Lo-Fi Chillout & Study Radio',
    category: 'language',
    target: 'Lo-Fi',
    vibe: '24/7 Ambient Beats & Piano Focus',
    query: 'lofi hip hop radio beats to relax study to official stream',
    icon: Coffee,
    listeners: '42.9K listening',
    gradient: 'from-purple-900/60 to-slate-950/60 border-purple-500/30',
    featuredArtists: ['Lofi Girl', 'ChilledCow', 'Kudasai'],
  },
];

const ARTIST_STATIONS: StationItem[] = [
  {
    id: 'art-arijit',
    name: 'Arijit Singh Non-Stop Radio',
    category: 'artist',
    target: 'Arijit Singh',
    vibe: 'Deep Cuts, Acoustic & Anthems',
    query: 'Arijit Singh best songs live audio jukebox',
    icon: Mic,
    listeners: '62.4K tuned in',
    gradient: 'from-red-950/70 to-neutral-900 border-red-500/30',
    featuredArtists: ['Arijit Singh', 'Pritam', 'Mithoon'],
  },
  {
    id: 'art-anirudh',
    name: 'Anirudh Rockstar Radio',
    category: 'artist',
    target: 'Anirudh Ravichander',
    vibe: 'EDM, Kollywood Mass Anthems',
    query: 'Anirudh Ravichander hit songs official audio jukebox',
    icon: Guitar,
    listeners: '44.1K tuned in',
    gradient: 'from-orange-950/70 to-neutral-900 border-orange-500/30',
    featuredArtists: ['Anirudh Ravichander', 'Jonita Gandhi', 'Aravind'],
  },
  {
    id: 'art-weeknd',
    name: 'The Weeknd After Hours Radio',
    category: 'artist',
    target: 'The Weeknd',
    vibe: 'Dark Synthwave, R&B & Pop',
    query: 'The Weeknd greatest hits official audio Dawn FM',
    icon: Moon,
    listeners: '78.2K tuned in',
    gradient: 'from-red-950/70 to-stone-900 border-red-600/40',
    featuredArtists: ['The Weeknd', 'Daft Punk', 'Gesaffelstein'],
  },
  {
    id: 'art-rahman',
    name: 'A.R. Rahman Maestro Radio',
    category: 'artist',
    target: 'A.R. Rahman',
    vibe: '3 Decades of Cinematic Masterpieces',
    query: 'AR Rahman evergreen best songs official audio',
    icon: Music,
    listeners: '38.5K tuned in',
    gradient: 'from-amber-950/70 to-neutral-900 border-amber-500/30',
    featuredArtists: ['A.R. Rahman', 'Hariharan', 'Chitra'],
  },
  {
    id: 'art-sushin',
    name: 'Sushin Shyam Kerala Beats Radio',
    category: 'artist',
    target: 'Sushin Shyam',
    vibe: 'Aavesham, Romancham & Cult Beats',
    query: 'Sushin Shyam songs jukebox official audio',
    icon: Compass,
    listeners: '19.7K tuned in',
    gradient: 'from-emerald-950/70 to-neutral-900 border-emerald-500/30',
    featuredArtists: ['Sushin Shyam', 'Nazriya', 'MC Couper'],
  },
  {
    id: 'art-zimmer',
    name: 'Hans Zimmer Epic Soundtracks Radio',
    category: 'artist',
    target: 'Hans Zimmer',
    vibe: 'Interstellar, Dune & Inception Score',
    query: 'Hans Zimmer best soundtracks Interstellar Dune official audio',
    icon: Disc3,
    listeners: '25.3K tuned in',
    gradient: 'from-indigo-950/70 to-neutral-900 border-indigo-500/30',
    featuredArtists: ['Hans Zimmer', 'Lisa Gerrard', 'Johnny Marr'],
  },
  {
    id: 'art-diljit',
    name: 'Diljit Dosanjh Global Wave Radio',
    category: 'artist',
    target: 'Diljit Dosanjh',
    vibe: 'G.O.A.T, Lover & Coachella Anthems',
    query: 'Diljit Dosanjh hit songs official audio',
    icon: Star,
    listeners: '31.9K tuned in',
    gradient: 'from-yellow-950/70 to-neutral-900 border-yellow-500/30',
    featuredArtists: ['Diljit Dosanjh', 'Intense', 'Snappy'],
  },
  {
    id: 'art-shreya',
    name: 'Shreya Ghoshal Melody Queen Radio',
    category: 'artist',
    target: 'Shreya Ghoshal',
    vibe: 'Pure Acoustic Melodies (All Languages)',
    query: 'Shreya Ghoshal best songs official audio jukebox',
    icon: Award,
    listeners: '27.4K tuned in',
    gradient: 'from-pink-950/70 to-neutral-900 border-pink-500/30',
    featuredArtists: ['Shreya Ghoshal', 'Sonu Nigam', 'Shaan'],
  },
];

export const RadioStationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'language' | 'artist'>('all');
  const [radioState, setRadioState] = useState<RadioState>(radioEngine.getState());
  const [playback, setPlayback] = useState<PlaybackState>(audioManager.getState());
  const [customInput, setCustomInput] = useState('');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);

  useEffect(() => {
    const unsubRadio = radioEngine.subscribe(setRadioState);
    const unsubAudio = audioManager.subscribe(setPlayback);
    return () => {
      unsubRadio();
      unsubAudio();
    };
  }, []);

  const handleTuneIn = (station: StationItem) => {
    radioEngine.startStation({
      name: station.name,
      vibe: station.vibe,
      query: station.query,
      type: station.category,
      target: station.target,
    });
  };

  const handleCustomRadio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    setIsGeneratingCustom(true);
    const cleanTarget = customInput.trim();
    radioEngine.startStation({
      name: `${cleanTarget} 24/7 Radio`,
      vibe: `Infinite ${cleanTarget} Stream`,
      query: `${cleanTarget} hit songs official audio`,
      type: 'custom',
      target: cleanTarget,
    });

    setTimeout(() => {
      setIsGeneratingCustom(false);
      setCustomInput('');
    }, 1200);
  };

  const isCurrentStationActive = (name: string) => {
    return radioState.isRadioMode && radioState.stationName === name && playback.isPlaying;
  };

  return (
    <div className="space-y-6 select-none animate-fade-in">
      {/* Hub Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#211010] via-[#1B1B1D] to-[#121214] border border-red-500/20 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-red-600/20 text-[#FF4D4D] border border-red-500/30">
                <Radio className="w-5 h-5 animate-pulse" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                24/7 Infinite Radios (Language & Artist Streams)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#AAAAAA] leading-relaxed">
              Continuous live broadcasts curated by language cultures and legend artists. Infinite streaming with zero repeats, smooth transitions, and instant prefetching.
            </p>
          </div>

          {/* Active Broadcast Pill */}
          {radioState.isRadioMode && (
            <div className="p-3 rounded-2xl bg-black/60 border border-red-500/40 flex items-center gap-3 shrink-0 shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div className="min-w-0 pr-2">
                <span className="text-[9px] font-mono uppercase tracking-wider text-red-400 font-bold block">
                  ON AIR NOW
                </span>
                <p className="text-xs font-bold text-white truncate">{radioState.stationName}</p>
              </div>
              <button
                onClick={() => radioEngine.stopRadio()}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-white font-semibold transition cursor-pointer"
              >
                Stop
              </button>
            </div>
          )}
        </div>

        {/* Custom Station Generator Bar */}
        <form onSubmit={handleCustomRadio} className="mt-5 max-w-xl flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#717171] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Tune any artist or language (e.g. Coldplay, Kannada, EDM, Taylor Swift)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F0F0F]/90 border border-[#272727] text-xs text-white placeholder-[#717171] focus:border-[#FF0000] focus:outline-none transition shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!customInput.trim() || isGeneratingCustom}
            className="px-4 py-2.5 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-950/40 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tune Radio</span>
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#272727] pb-3">
        {[
          { id: 'all', label: 'All 24/7 Radios', count: LANGUAGE_STATIONS.length + ARTIST_STATIONS.length },
          { id: 'language', label: 'Language Culture Radios', count: LANGUAGE_STATIONS.length },
          { id: 'artist', label: 'Artist Deep-Dive Radios', count: ARTIST_STATIONS.length },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                active
                  ? 'bg-[#FF0000] text-white shadow-md'
                  : 'bg-[#212121] text-[#AAAAAA] hover:text-white hover:bg-[#272727] border border-[#272727]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${active ? 'bg-black/30 text-white' : 'bg-[#272727] text-[#717171]'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ═══ SECTION 1: LANGUAGE RADIOS ═══════════════════════════════════ */}
      {(activeTab === 'all' || activeTab === 'language') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#AAAAAA] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#FF0000]" />
              <span>Language & Regional Radios (24/7 Continuous)</span>
            </h3>
            <span className="text-[11px] text-[#717171]">Infinite music stream</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {LANGUAGE_STATIONS.map((station) => {
              const active = isCurrentStationActive(station.name);
              return (
                <div
                  key={station.id}
                  className={`group p-4 rounded-2xl bg-gradient-to-br ${station.gradient} border hover:border-red-500/60 transition shadow-lg flex flex-col justify-between space-y-3`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition shadow-md text-white">
                        <station.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-red-400 bg-black/40 px-2 py-0.5 rounded-full border border-red-500/20">
                          {station.target} Radio
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#FF4D4D] transition mt-1">
                          {station.name}
                        </h4>
                      </div>
                    </div>

                    {active && (
                      <span className="flex items-center gap-1 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        On Air
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-white/70 line-clamp-1">{station.vibe}</p>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {station.featuredArtists.map((a) => (
                      <span key={a} className="text-[10px] text-white/50 bg-black/30 px-2 py-0.5 rounded-md border border-white/5">
                        {a}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                      ● {station.listeners}
                    </span>

                    <button
                      onClick={() => handleTuneIn(station)}
                      className="px-4 py-1.5 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-red-950/40 cursor-pointer active:scale-95"
                    >
                      {active ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Tuned In</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          <span>Tune In</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══ SECTION 2: ARTIST RADIOS ═════════════════════════════════════ */}
      {(activeTab === 'all' || activeTab === 'artist') && (
        <section className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#AAAAAA] flex items-center gap-2">
              <Mic2 className="w-4 h-4 text-[#FF0000]" />
              <span>Dedicated Artist Radios (Infinite Hits & Deep Cuts)</span>
            </h3>
            <span className="text-[11px] text-[#717171]">Artist catalog auto-replenish</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {ARTIST_STATIONS.map((station) => {
              const active = isCurrentStationActive(station.name);
              return (
                <div
                  key={station.id}
                  className={`group p-4 rounded-2xl bg-gradient-to-br ${station.gradient} border hover:border-red-500/60 transition shadow-lg flex flex-col justify-between space-y-3`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-11 h-11 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition text-white">
                      <station.icon className="w-5 h-5" />
                    </div>

                    {active && (
                      <span className="flex items-center gap-1 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        On Air
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#FF4D4D] block">
                      Artist Radio
                    </span>
                    <h4 className="text-xs font-bold text-white group-hover:text-[#FF4D4D] transition mt-0.5">
                      {station.name}
                    </h4>
                    <p className="text-[11px] text-white/60 line-clamp-1 mt-0.5">{station.vibe}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <span className="text-[9px] font-mono text-emerald-400">
                      {station.listeners}
                    </span>

                    <button
                      onClick={() => handleTuneIn(station)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer active:scale-95"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{active ? 'Playing' : 'Tune In'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
