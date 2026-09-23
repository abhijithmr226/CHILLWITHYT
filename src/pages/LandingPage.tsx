import React from 'react';
import { useStore } from '../store/useStore';
import { audioManager } from '../services/audio/AudioManager';
import { DEFAULT_TRACKS } from '../services/audio/DefaultMusicProvider';
import {
  Play,
  Radio,
  Users,
  MessageCircle,
  ListMusic,
  Compass,
  Monitor,
  Smartphone,
  Tablet,
  Download,
  ArrowRight,
  Disc,
  Flame,
  ShieldCheck
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [state, store] = useStore();

  const featuredTrack = React.useMemo(() => {
    if (state.likedSongs && state.likedSongs.length > 0) return state.likedSongs[0];
    const pop = DEFAULT_TRACKS.find(t => t.tags?.includes('English')) || DEFAULT_TRACKS[0];
    return pop;
  }, [state.likedSongs]);

  const handleStartListening = () => {
    audioManager.playSong(featuredTrack);
    onNavigate('/');
  };

  const featureCards = [
    {
      icon: <Radio className="w-5 h-5 text-[#FF0000]" />,
      title: 'Listen Together',
      desc: 'Real-time synchronized playback with sub-second accuracy.'
    },
    {
      icon: <Users className="w-5 h-5 text-[#F1F1F1]" />,
      title: 'Create Rooms',
      desc: 'Public or private rooms. Hand over the aux to your friends.'
    },
    {
      icon: <MessageCircle className="w-5 h-5 text-[#FF0000]" />,
      title: 'Chat Live',
      desc: 'Talk, react with floating emojis, and share song suggestions.'
    },
    {
      icon: <ListMusic className="w-5 h-5 text-[#F1F1F1]" />,
      title: 'Build Playlists',
      desc: 'Collaborate with friends to curate unforgettable track mixes.'
    },
    {
      icon: <Compass className="w-5 h-5 text-[#FF0000]" />,
      title: 'Discover Music',
      desc: 'Live YouTube v3 catalog search with real video streams.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#F1F1F1] pb-24 overflow-x-hidden select-none">
      {/* Hero Section */}
      <section className="relative px-6 pt-12 pb-20 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="flex-1 space-y-6 text-left max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#212121] border border-[#272727] text-xs font-semibold text-[#F1F1F1]">
            <span className="w-2 h-2 rounded-full bg-[#FF0000] animate-pulse" />
            <span className="text-[#AAAAAA]">Realtime Social Listening</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#F1F1F1] leading-tight">
            Music hits different <br />
            <span className="text-[#FF0000]">
              together.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-[#AAAAAA] max-w-xl leading-relaxed">
            Listen, chat, and vibe with people in real time. Search any track via YouTube v3, host rooms, pass the aux, and experience synchronized visualizers.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={handleStartListening}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#FF0000] hover:bg-[#CC0000] text-white font-semibold text-sm transition shadow-[0_0_20px_rgba(255,0,0,0.35)] hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Listening</span>
            </button>

            <button
              onClick={() => onNavigate('/rooms')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#212121] hover:bg-[#272727] border border-[#272727] hover:border-[#3E3E3E] text-[#F1F1F1] font-semibold text-sm transition cursor-pointer"
            >
              <span>Explore Rooms</span>
              <ArrowRight className="w-4 h-4 text-[#AAAAAA]" />
            </button>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="flex-1 w-full max-w-lg relative">
          <div className="absolute -inset-2 bg-[#FF0000]/10 rounded-3xl blur-2xl -z-10" />
          
          <div className="relative rounded-2xl overflow-hidden border border-[#272727] bg-[#212121] shadow-2xl">
            {/* Realistic Hero Image: friends vibing with city view */}
            <div className="relative h-64 sm:h-72 w-full overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&auto=format&fit=crop&q=80"
                alt="Friends listening to music"
                className="w-full h-full object-cover brightness-75 hover:scale-105 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#212121] via-transparent to-transparent" />
              
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#0F0F0F]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#272727] text-xs text-white">
                <span className="w-2 h-2 rounded-full bg-[#FF0000] animate-ping" />
                <span className="font-semibold">Late Night Chill</span>
                <span className="text-[#AAAAAA]">• 24 listening</span>
              </div>
            </div>

            {/* Embedded Player Snapshot */}
            <div className="p-5 flex items-center justify-between bg-[#212121]">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md ring-2 ring-[#FF0000]/40">
                  <img
                    src={featuredTrack.artwork}
                    alt={featuredTrack.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <Disc className="w-5 h-5 text-white animate-spin-slow" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{featuredTrack.title}</h4>
                  <p className="text-xs text-[#AAAAAA]">{featuredTrack.artist}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#FF0000] bg-[#FF0000]/10 px-2.5 py-1 rounded-full border border-[#FF0000]/20">
                  Sync: 0.02s
                </span>
                <button
                  onClick={handleStartListening}
                  className="w-10 h-10 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white flex items-center justify-center shadow-lg cursor-pointer transition hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Value Props Strip */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {featureCards.map((feat, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[#212121] border border-[#272727] hover:bg-[#272727] hover:border-[#383838] transition space-y-2 group cursor-pointer"
            >
              <div className="p-2 w-fit rounded-xl bg-[#272727] group-hover:scale-110 transition">
                {feat.icon}
              </div>
              <h3 className="text-xs font-bold text-white tracking-wide">{feat.title}</h3>
              <p className="text-[11px] text-[#AAAAAA] leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Rooms Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>Trending Live Rooms</span>
              <Flame className="w-5 h-5 text-[#FF0000] fill-[#FF0000]" />
            </h2>
            <p className="text-xs sm:text-sm text-[#AAAAAA] mt-1">Jump into an active session and vibe right now</p>
          </div>
          <button
            onClick={() => onNavigate('/rooms')}
            className="text-xs text-[#FF0000] font-semibold hover:underline cursor-pointer"
          >
            View all
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {state.rooms.map((room, idx) => (
            <div
              key={`${room.id}-${idx}`}
              onClick={() => onNavigate(`/room/${room.id}`)}
              className="group cursor-pointer rounded-2xl overflow-hidden bg-[#212121] border border-[#272727] hover:bg-[#272727] hover:border-[#383838] transition duration-300 flex flex-col shadow-lg"
            >
              <div className="relative h-40 w-full overflow-hidden">
                <img
                  src={room.coverUrl}
                  alt={room.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#212121] via-black/20 to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-[#FF0000] text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  LIVE
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="text-sm font-bold truncate">{room.name}</h3>
                  <p className="text-[11px] text-[#AAAAAA] mt-0.5">
                    {room.tags?.[0]} • {room.membersCount} listening
                  </p>
                </div>
              </div>

              <div className="p-3.5 flex items-center justify-between border-t border-[#272727] bg-[#212121] group-hover:bg-[#272727] transition">
                <div className="flex items-center gap-2 overflow-hidden">
                  <img
                    src={room.ownerAvatar}
                    alt={room.ownerName}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-white/20"
                  />
                  <span className="text-xs text-[#AAAAAA] truncate">{room.ownerName}</span>
                </div>
                <button className="text-xs font-semibold text-[#FF0000] group-hover:text-white transition">
                  Join →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Playlists Section */}
      <section className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Trending Playlists</h2>
            <p className="text-xs sm:text-sm text-[#AAAAAA] mt-1">Curated sounds for every state of mind</p>
          </div>
          <button
            onClick={() => onNavigate('/playlists')}
            className="text-xs text-[#FF0000] font-semibold hover:underline cursor-pointer"
          >
            View all
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {state.playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onNavigate(`/playlist/${pl.id}`)}
              className="group cursor-pointer rounded-2xl p-3 bg-[#212121] border border-[#272727] hover:bg-[#272727] hover:border-[#383838] transition"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5">
                <img
                  src={pl.coverUrl}
                  alt={pl.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
                <button className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#FF0000] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg cursor-pointer">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>
              </div>
              <h4 className="text-xs font-bold text-white truncate">{pl.name}</h4>
              <p className="text-[10px] text-[#AAAAAA] truncate mt-0.5">by {pl.ownerName}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Available on All Devices / PWA Banner */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="rounded-3xl bg-[#212121] border border-[#272727] p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 max-w-xl text-center sm:text-left">
            <h3 className="text-2xl sm:text-3xl font-bold text-white">Available across all your devices</h3>
            <p className="text-xs sm:text-sm text-[#AAAAAA] leading-relaxed">
              Desktop, iOS, Android, and installable PWA. One account. All your playlists, real-time YouTube sync, and rooms ready everywhere.
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-[#AAAAAA]">
              <div className="flex items-center gap-1.5 bg-[#272727] px-3 py-1.5 rounded-xl border border-[#383838]">
                <Monitor className="w-4 h-4 text-[#FF0000]" />
                <span>Desktop (Windows / macOS)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#272727] px-3 py-1.5 rounded-xl border border-[#383838]">
                <Smartphone className="w-4 h-4 text-[#F1F1F1]" />
                <span>Mobile (iOS / Android)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#272727] px-3 py-1.5 rounded-xl border border-[#383838]">
                <Tablet className="w-4 h-4 text-[#F1F1F1]" />
                <span>Tablet</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#272727] px-3 py-1.5 rounded-xl border border-[#383838]">
                <Download className="w-4 h-4 text-[#FF0000]" />
                <span>PWA Installable</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => store.setState({ isCreateRoomModalOpen: true })}
            className="px-6 py-3.5 rounded-2xl bg-[#FF0000] hover:bg-[#CC0000] text-white font-semibold text-sm transition shadow-[0_0_20px_rgba(255,0,0,0.35)] shrink-0 cursor-pointer"
          >
            Create Your Room Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#272727] py-8 text-center text-xs text-[#777777] bg-[#141416]">
        <p>
          ChillWithYT · Created & Developed by{' '}
          <a
            href="https://linkedin.com/in/abhijithmr226"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:text-[#FF0000] font-semibold underline underline-offset-4 decoration-[#FF0000]/40 transition"
          >
            Abhijith M R
          </a>
        </p>
      </footer>
    </div>
  );
};
