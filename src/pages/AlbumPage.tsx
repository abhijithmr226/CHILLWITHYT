import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { audioManager } from '../services/audio/AudioManager';
import { YouTubeDataApiService } from '../services/audio/YouTubeDataApi';
import { Song } from '../types';
import {
  Play,
  Pause,
  Plus,
  Heart,
  Radio,
  Share2,
  Users,
  Sparkles,
  Music,
  Disc,
  Clock,
  ArrowLeft,
  Loader2,
  Film,
  Check
} from 'lucide-react';

interface AlbumPageProps {
  albumTitle: string;
  onNavigate: (path: string) => void;
}

// Curated presets for iconic albums and movie soundtracks
const ALBUM_PRESETS: Record<string, {
  artist: string;
  year: string;
  genre: string;
  coverUrl: string;
  description: string;
  isMovie: boolean;
}> = {
  'Interstellar': {
    artist: 'Hans Zimmer',
    year: '2014',
    genre: 'Cinematic • Ambient Orchestral',
    coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    description: 'Hans Zimmer’s Academy Award-nominated magnum opus, featuring the iconic pipe organ recorded at Temple Church, London.',
    isMovie: true,
  },
  'Animal': {
    artist: 'Pritam, JAM8, Harshavardhan Rameshwar',
    year: '2023',
    genre: 'Bollywood • Rock • Dark Punjabi',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    description: 'The viral pan-India blockbuster soundtrack featuring chart-destroyers "Arjan Vailly", "Pehle Bhi Main", and "Satranga".',
    isMovie: true,
  },
  'Leo': {
    artist: 'Anirudh Ravichander',
    year: '2023',
    genre: 'Kollywood • EDM • Mass Rock',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    description: 'Anirudh Ravichander’s high-octane soundtrack featuring "Badass", "Naa Ready", and the spine-chilling "Lokiverse 2.0".',
    isMovie: true,
  },
  'Aavesham': {
    artist: 'Sushin Shyam',
    year: '2024',
    genre: 'Mollywood • Street Hip-Hop • Electronic',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    description: 'The trendsetting Malayalam phenomenon featuring "Illuminati", "Jaada", and energetic festival anthems.',
    isMovie: true,
  },
  'Dune': {
    artist: 'Hans Zimmer',
    year: '2021',
    genre: 'Sci-Fi Orchestral • World Vocal',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    description: 'The Oscar-winning soundscape combining synthesized bagpipes, female whispers, and desert wind acoustics.',
    isMovie: true,
  },
  'After Hours': {
    artist: 'The Weeknd',
    year: '2020',
    genre: 'Synthwave • Electro-Pop • Dark R&B',
    coverUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    description: 'The record-breaking studio album featuring the historic #1 single "Blinding Lights" and 80s analog synthesizers.',
    isMovie: false,
  },
};

const POPULAR_SOUNDTRACKS = [
  'Interstellar',
  'Animal',
  'Leo',
  'Aavesham',
  'Dune',
  'After Hours',
];

export const AlbumPage: React.FC<AlbumPageProps> = ({ albumTitle, onNavigate }) => {
  const [state, store] = useStore();
  const [tracks, setTracks] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [playback, setPlayback] = useState(audioManager.getState());

  useEffect(() => {
    return audioManager.subscribe(setPlayback);
  }, []);

  const cleanTitle = decodeURIComponent(albumTitle).trim();
  const preset = ALBUM_PRESETS[cleanTitle] || {
    artist: 'Various Artists',
    year: '2024',
    genre: 'Original Soundtrack & Full Album',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    description: `Complete track collection and audio masterworks from ${cleanTitle}.`,
    isMovie: true,
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const fetchAlbumTracks = async () => {
      try {
        const query = `${cleanTitle} songs official full audio`;
        const songs = await YouTubeDataApiService.searchVideos(query, 16);

        if (isMounted) {
          setTracks(songs);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load album tracks:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAlbumTracks();

    return () => {
      isMounted = false;
    };
  }, [cleanTitle]);

  const totalDurationSeconds = tracks.reduce((acc, t) => acc + t.duration, 0);
  const totalMinutes = Math.floor(totalDurationSeconds / 60);

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    audioManager.playSong(tracks[0], tracks);
  };

  const handleAddAllToQueue = () => {
    tracks.forEach((t) => audioManager.addToQueue(t));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen pb-32 select-none animate-fade-in text-[#F1F1F1]">
      {/* Header Container */}
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <div>
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#212121] hover:bg-[#272727] border border-[#272727] text-xs font-semibold text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        {/* Album Hero Showcase */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#241515] via-[#1B1B1B] to-[#141414] border border-[#2B2222] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF0000]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Cover Art */}
          <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-white/10 bg-neutral-900 group">
            <img
              src={tracks[0]?.artwork || preset.coverUrl}
              alt={cleanTitle}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
            {preset.isMovie && (
              <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-white/10">
                <Film className="w-3 h-3 text-[#FF0000]" />
                Movie OST
              </span>
            )}
          </div>

          {/* Metadata & Controls */}
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FF0000]/20 text-[#FF4D4D] border border-red-500/30">
                {preset.isMovie ? 'Original Motion Picture Soundtrack' : 'Official Album'}
              </span>
              <span className="text-xs text-[#AAAAAA]">• {preset.year}</span>
              <span className="text-xs text-[#AAAAAA]">• {preset.genre}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {cleanTitle}
            </h1>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#CCCCCC]">
              <span
                onClick={() => onNavigate(`/artist/${encodeURIComponent(preset.artist)}`)}
                className="font-bold text-white hover:text-[#FF4D4D] hover:underline cursor-pointer"
              >
                {preset.artist}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Music className="w-3.5 h-3.5 text-[#FF0000]" />
                {tracks.length} tracks
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#AAAAAA]">
                <Clock className="w-3.5 h-3.5" />
                ~{totalMinutes} mins
              </span>
            </div>

            <p className="text-xs text-[#AAAAAA] line-clamp-2 max-w-2xl leading-relaxed">
              {preset.description}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <button
                onClick={handlePlayAll}
                disabled={tracks.length === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-900/40 hover:scale-105 transition cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Play Album</span>
              </button>

              <button
                onClick={handleAddAllToQueue}
                disabled={tracks.length === 0}
                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-[#272727] hover:bg-[#333333] border border-[#383838] text-xs font-bold text-white transition cursor-pointer"
                title="Add all songs to listening queue"
              >
                <Plus className="w-4 h-4" />
                <span>Add All to Queue</span>
              </button>

              <button
                onClick={() => store.setState({ isCreateRoomModalOpen: true })}
                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-[#272727] hover:bg-[#333333] border border-[#383838] text-xs font-bold text-white transition cursor-pointer"
                title="Host a room for this album"
              >
                <Users className="w-4 h-4 text-[#FF4D4D]" />
                <span className="hidden sm:inline">Listen With Friends</span>
              </button>

              <button
                onClick={handleShare}
                className="p-3 rounded-2xl bg-[#272727] hover:bg-[#333333] border border-[#383838] text-white transition cursor-pointer"
                title="Share link"
              >
                <Share2 className="w-4 h-4" />
              </button>
              {copiedLink && (
                <span className="text-[11px] text-emerald-400 font-bold animate-fade-in flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tracklist Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#272727] text-xs text-[#717171] uppercase font-bold tracking-wider">
            <div className="flex items-center gap-6">
              <span className="w-6 text-center">#</span>
              <span>Title & Artist</span>
            </div>
            <div className="flex items-center gap-8">
              <span className="hidden sm:inline">Duration</span>
              <span className="w-16 text-right">Actions</span>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-xs text-[#AAAAAA]">
              <Loader2 className="w-7 h-7 text-[#FF0000] animate-spin" />
              <span>Loading soundtrack master files...</span>
            </div>
          ) : tracks.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#AAAAAA]">
              No soundtrack tracks found for "{cleanTitle}".
            </div>
          ) : (
            <div className="space-y-1.5">
              {tracks.map((song, index) => {
                const isCurrent = playback.currentSong?.id === song.id;
                const isLiked = state.likedSongIds.includes(song.id);

                return (
                  <div
                    key={song.id}
                    className={`group flex items-center justify-between p-3 rounded-2xl border transition ${
                      isCurrent
                        ? 'bg-[#272727] border-[#FF0000]/60 text-white shadow-md'
                        : 'bg-[#181818] hover:bg-[#212121] border-[#242424] hover:border-[#333333]'
                    }`}
                  >
                    {/* Left: Track number & info */}
                    <div
                      onClick={() => {
                        audioManager.playSong(song);
                        audioManager.setQueue(tracks.filter((t) => t.id !== song.id));
                      }}
                      className="flex items-center gap-4 overflow-hidden flex-1 cursor-pointer"
                    >
                      <span className="w-6 text-center text-xs font-mono font-bold text-[#AAAAAA] group-hover:hidden">
                        {index + 1}
                      </span>
                      <div className="w-6 hidden group-hover:flex items-center justify-center text-[#FF0000]">
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>

                      {/* 16:9 YouTube Thumbnail Box */}
                      <div className="w-16 h-10 aspect-video rounded-lg overflow-hidden bg-neutral-900 shrink-0 border border-white/10">
                        <img
                          src={song.artwork}
                          alt={song.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>

                      <div className="min-w-0 pr-3">
                        <h4
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isCurrent ? 'text-[#FF4D4D]' : 'text-white group-hover:text-[#FF4D4D]'
                          }`}
                        >
                          {song.title}
                        </h4>
                        <p className="text-[11px] text-[#CCCCCC] truncate">{song.artist}</p>
                      </div>
                    </div>

                    {/* Right: Duration & Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono text-[#CCCCCC] hidden sm:inline mr-2">
                        {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                      </span>

                      <button
                        onClick={() => store.toggleLikeSong(song.id)}
                        className={`p-2 rounded-xl transition cursor-pointer ${
                          isLiked ? 'text-[#FF0000]' : 'text-[#AAAAAA] hover:text-white hover:bg-[#272727]'
                        }`}
                        title="Like"
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      </button>

                      <button
                        onClick={() => audioManager.addToQueue(song)}
                        className="p-2 rounded-xl text-[#AAAAAA] hover:text-white hover:bg-[#272727] transition cursor-pointer"
                        title="Add to queue"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* More Iconic Soundtracks & Albums Shelf */}
        <section className="pt-8 border-t border-[#272727] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Disc className="w-4 h-4 text-[#FF0000]" />
                <span>More Iconic Movie Soundtracks & Albums</span>
              </h3>
              <p className="text-xs text-[#AAAAAA]">Explore cinematic masterworks and viral studio albums</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {POPULAR_SOUNDTRACKS.filter((s) => s !== cleanTitle).map((sTitle) => {
              const meta = ALBUM_PRESETS[sTitle];
              return (
                <div
                  key={sTitle}
                  onClick={() => onNavigate(`/album/${encodeURIComponent(sTitle)}`)}
                  className="group cursor-pointer p-3 rounded-2xl bg-[#1A1A1A] hover:bg-[#242424] border border-[#272727] hover:border-[#383838] transition space-y-2 shadow-sm"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-neutral-900">
                    <img
                      src={meta?.coverUrl}
                      alt={sTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <Play className="w-6 h-6 text-[#FF0000] fill-current" />
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white truncate group-hover:text-[#FF4D4D] transition">
                      {sTitle}
                    </h5>
                    <p className="text-[11px] text-[#888888] truncate">{meta?.artist}</p>
                    <span className="text-[10px] text-[#FF4D4D] font-mono">{meta?.year}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
