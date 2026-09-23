import React, { useState, useEffect, useMemo } from 'react';
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
  Check,
  UserPlus,
  Share2,
  Users,
  Sparkles,
  Music,
  Disc,
  Flame,
  ArrowLeft,
  Loader2,
  Film,
  Clock
} from 'lucide-react';

interface ArtistPageProps {
  artistName: string;
  onNavigate: (path: string) => void;
}

export const ArtistPage: React.FC<ArtistPageProps> = ({ artistName, onNavigate }) => {
  const [state, store] = useStore();
  const [songs, setSongs] = useState<Song[]>([]);
  const [musicVideos, setMusicVideos] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'top' | 'videos' | 'albums'>('top');
  const [copiedLink, setCopiedLink] = useState(false);
  const [playback, setPlayback] = useState(audioManager.getState());

  useEffect(() => {
    return audioManager.subscribe(setPlayback);
  }, []);

  const cleanName = decodeURIComponent(artistName).trim();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const fetchArtistData = async () => {
      try {
        const [topSongs, videos, albumResults] = await Promise.all([
          YouTubeDataApiService.searchVideos(`${cleanName} best songs audio`, 24),
          YouTubeDataApiService.searchVideos(`${cleanName} official music video`, 12),
          YouTubeDataApiService.searchVideos(`${cleanName} full album jukebox songs`, 8),
        ]);

        if (isMounted) {
          setSongs(topSongs);
          setMusicVideos(videos);
          setAlbums(albumResults);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to load artist tracks:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    fetchArtistData();

    // Check following status from local storage
    const followed = localStorage.getItem(`follow_artist_${cleanName}`) === 'true';
    setIsFollowing(followed);

    return () => {
      isMounted = false;
    };
  }, [cleanName]);

  const toggleFollow = () => {
    const next = !isFollowing;
    setIsFollowing(next);
    localStorage.setItem(`follow_artist_${cleanName}`, String(next));
  };

  const handlePlayAll = () => {
    if (songs.length === 0) return;
    audioManager.playSong(songs[0], songs);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const isCurrentPlayingArtist =
    playback.currentSong?.artist.toLowerCase().includes(cleanName.toLowerCase()) && playback.isPlaying;

  // Dynamically extract potential related collaborators from titles and metadata
  const dynamicRelatedArtists = useMemo(() => {
    const discovered = new Set<string>();
    const regex = /(?:ft\.|feat\.|with|&|,|\bx\b)\s+([A-Za-z0-9\s]{3,25})/gi;

    [...songs, ...musicVideos].forEach((item) => {
      const fullText = `${item.title} ${item.artist}`;
      let match;
      while ((match = regex.exec(fullText)) !== null) {
        const candidate = match[1]?.trim();
        if (
          candidate &&
          candidate.toLowerCase() !== cleanName.toLowerCase() &&
          !candidate.toLowerCase().includes('official') &&
          !candidate.toLowerCase().includes('video') &&
          !candidate.toLowerCase().includes('audio') &&
          !candidate.toLowerCase().includes('song') &&
          !candidate.toLowerCase().includes('records')
        ) {
          discovered.add(candidate);
        }
      }
    });

    const fallbackPicks = [
      'A.R. Rahman',
      'Anirudh Ravichander',
      'Arijit Singh',
      'Sushin Shyam',
      'Sid Sriram',
      'Shreya Ghoshal',
      'The Weeknd',
      'Dua Lipa',
    ].filter((name) => name.toLowerCase() !== cleanName.toLowerCase());

    const result = Array.from(discovered).slice(0, 4);
    if (result.length < 4) {
      fallbackPicks.forEach((p) => {
        if (result.length < 4 && !result.includes(p)) {
          result.push(p);
        }
      });
    }
    return result;
  }, [songs, musicVideos, cleanName]);

  // Derive high-resolution banner and artwork from the top YouTube tracks
  const primaryArtwork = songs[0]?.artwork || musicVideos[0]?.artwork;
  const highResBanner = primaryArtwork
    ? primaryArtwork.replace('hqdefault.jpg', 'maxresdefault.jpg').replace('default.jpg', 'hqdefault.jpg')
    : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&auto=format&fit=crop&q=80';

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen pb-32 select-none animate-fade-in text-[#F1F1F1]">
      {/* Dynamic Hero Banner */}
      <div className="relative w-full h-80 sm:h-96 overflow-hidden bg-gradient-to-b from-[#2E1010] to-[#0F0F0F]">
        <img
          src={highResBanner}
          alt={cleanName}
          className="w-full h-full object-cover opacity-35 mix-blend-overlay filter blur-[1.5px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-[#0F0F0F]/70 to-transparent" />

        {/* Back navigation button */}
        <div className="absolute top-4 left-4 sm:left-8 z-20">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-xs font-semibold text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        {/* Artist Profile Header Details */}
        <div className="absolute bottom-6 left-4 sm:left-8 right-4 sm:right-8 z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="flex items-end gap-5">
            {/* Avatar - Aspect Square with Real High-Res YouTube Artwork */}
            <div className="relative w-24 h-24 sm:w-36 sm:h-36 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0 bg-neutral-900">
              {primaryArtwork ? (
                <img
                  src={primaryArtwork}
                  alt={cleanName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-600 to-rose-900 text-white font-black text-3xl">
                  {cleanName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FF0000]/25 text-red-400 border border-red-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  YouTube Artist
                </span>
                <span className="text-xs text-[#CCCCCC] font-medium hidden sm:inline">
                  Verified Audio & Music Videos
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {cleanName}
              </h1>

              <p className="text-xs sm:text-sm text-[#CCCCCC] flex items-center gap-2">
                <span className="font-bold text-white">{songs.length}+ official releases</span>
                <span>• Live synchronized streaming</span>
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handlePlayAll}
              disabled={songs.length === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-900/40 hover:scale-105 transition cursor-pointer disabled:opacity-50"
            >
              {isCurrentPlayingArtist ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Artist</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span>Play Top Tracks</span>
                </>
              )}
            </button>

            <button
              onClick={toggleFollow}
              className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                isFollowing
                  ? 'bg-[#272727] border-emerald-500/50 text-emerald-400'
                  : 'bg-[#212121] hover:bg-[#272727] border-[#383838] text-white'
              }`}
            >
              {isFollowing ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Follow</span>
                </>
              )}
            </button>

            <button
              onClick={() => store.setState({ isCreateRoomModalOpen: true })}
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-[#212121] hover:bg-[#272727] border border-[#383838] text-xs font-bold text-white transition cursor-pointer"
              title="Host a listening room with this artist"
            >
              <Users className="w-4 h-4 text-[#FF4D4D]" />
              <span className="hidden sm:inline">Create Room</span>
            </button>

            <button
              onClick={handleShare}
              className="p-3 rounded-2xl bg-[#212121] hover:bg-[#272727] border border-[#383838] text-white transition cursor-pointer"
              title="Share artist profile"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {copiedLink && (
              <span className="text-[11px] text-emerald-400 font-bold animate-fade-in">
                Link Copied!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 space-y-8">
        {/* Dynamic Bio Card */}
        <div className="p-4 sm:p-6 rounded-2xl bg-[#1A1A1A] border border-[#272727] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#FF4D4D]">
              Artist Profile
            </span>
            <p className="text-xs sm:text-sm text-[#CCCCCC] leading-relaxed">
              Streaming discography, official music videos, soundtracks, and collaborations by <span className="font-semibold text-white">{cleanName}</span>. All audio is dynamically fetched directly from YouTube with studio playback and listening room capabilities.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate(`/discover`)}
              className="px-4 py-2 rounded-xl bg-[#272727] hover:bg-[#333333] border border-[#383838] text-xs font-semibold text-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <Disc className="w-3.5 h-3.5 text-[#FF0000]" />
              <span>Explore More Artists</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#272727] pb-3 overflow-x-auto no-scrollbar">
          {[
            { id: 'top', label: `Popular Tracks (${songs.length})`, icon: Flame },
            { id: 'videos', label: `Music Videos (${musicVideos.length})`, icon: Film },
            { id: 'albums', label: `Albums & Jukeboxes (${albums.length})`, icon: Disc },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  active
                    ? 'bg-[#FF0000] text-white shadow-md shadow-red-900/40'
                    : 'text-[#CCCCCC] hover:text-white hover:bg-[#212121]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: POPULAR TRACKS */}
        {activeTab === 'top' && (
          <section className="space-y-3">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-xs text-[#CCCCCC]">
                <Loader2 className="w-7 h-7 text-[#FF0000] animate-spin" />
                <span>Loading official tracks for {cleanName}...</span>
              </div>
            ) : songs.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#CCCCCC]">
                No tracks found for this artist.
              </div>
            ) : (
              <div className="space-y-1.5">
                {songs.map((song, index) => {
                  const isCurrent = playback.currentSong?.id === song.id;
                  const isLiked = state.likedSongIds.includes(song.id);

                  return (
                    <div
                      key={song.id}
                      className={`group flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border transition ${
                        isCurrent
                          ? 'bg-[#272727] border-[#FF0000]/60 text-white shadow-md'
                          : 'bg-[#181818] hover:bg-[#212121] border-[#242424] hover:border-[#333333]'
                      }`}
                    >
                      {/* Left: Index, 16:9 Aspect Video Thumbnail Box, Title */}
                      <div
                        onClick={() => {
                          audioManager.playSong(song);
                          audioManager.setQueue(songs.filter((s) => s.id !== song.id));
                        }}
                        className="flex items-center gap-3 sm:gap-4 overflow-hidden flex-1 cursor-pointer"
                      >
                        <span className="w-6 text-center text-xs font-mono font-bold text-[#AAAAAA] group-hover:hidden">
                          {index + 1}
                        </span>
                        <div className="w-6 hidden group-hover:flex items-center justify-center text-[#FF0000]">
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </div>

                        {/* 16:9 Native YouTube Thumbnail Box */}
                        <div className="relative w-16 sm:w-20 h-10 sm:h-12 aspect-video rounded-lg overflow-hidden shrink-0 bg-neutral-900 border border-white/10 shadow-sm">
                          <img
                            src={song.artwork}
                            alt={song.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          {isCurrent && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#FF0000] animate-ping" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 pr-3">
                          <h4
                            className={`text-xs sm:text-sm font-bold truncate ${
                              isCurrent ? 'text-[#FF4D4D]' : 'text-white group-hover:text-[#FF4D4D]'
                            }`}
                          >
                            {song.title}
                          </h4>
                          <p className="text-[11px] text-[#CCCCCC] truncate mt-0.5">{song.artist}</p>
                        </div>
                      </div>

                      {/* Right Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-[#CCCCCC] hidden sm:inline mr-2">
                          {formatDuration(song.duration)}
                        </span>

                        <button
                          onClick={() => store.toggleLikeSong(song.id)}
                          className={`p-2 rounded-xl transition cursor-pointer ${
                            isLiked ? 'text-[#FF0000]' : 'text-[#AAAAAA] hover:text-white hover:bg-[#272727]'
                          }`}
                          title="Like song"
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
          </section>
        )}

        {/* TAB 2: MUSIC VIDEOS */}
        {activeTab === 'videos' && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {musicVideos.map((vid) => (
              <div
                key={vid.id}
                onClick={() => {
                  audioManager.playSong(vid);
                  audioManager.setQueue(musicVideos.filter((v) => v.id !== vid.id));
                }}
                className="group cursor-pointer rounded-2xl bg-[#1A1A1A] hover:bg-[#212121] border border-[#272727] hover:border-[#383838] p-3 transition space-y-2.5 shadow-sm"
              >
                {/* 16:9 Aspect Video Box */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-neutral-900 border border-white/10">
                  <img
                    src={vid.artwork}
                    alt={vid.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <div className="w-10 h-10 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded font-bold">
                    {formatDuration(vid.duration)}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-[#FF4D4D] transition">
                    {vid.title}
                  </h4>
                  <p className="text-[11px] text-[#CCCCCC] truncate mt-0.5">{vid.artist}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* TAB 3: DYNAMIC ALBUMS & JUKEBOXES */}
        {activeTab === 'albums' && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {albums.map((album) => (
              <div
                key={album.id}
                onClick={() => {
                  audioManager.playSong(album);
                  audioManager.setQueue(albums.filter((a) => a.id !== album.id));
                }}
                className="group cursor-pointer p-3.5 rounded-2xl bg-[#1A1A1A] hover:bg-[#212121] border border-[#272727] hover:border-[#383838] transition flex items-center gap-3.5"
              >
                {/* 16:9 Thumbnail Box */}
                <div className="w-24 sm:w-28 h-14 sm:h-16 aspect-video rounded-xl overflow-hidden bg-neutral-900 shrink-0 border border-white/10 relative">
                  <img
                    src={album.artwork}
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition" />
                  <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-mono px-1 rounded font-bold">
                    {formatDuration(album.duration)}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono text-[#FF4D4D] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Disc className="w-3 h-3" />
                    <span>Album / Jukebox</span>
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#FF4D4D] transition mt-0.5">
                    {album.title}
                  </h4>
                  <p className="text-[11px] text-[#CCCCCC] truncate mt-0.5">{album.artist}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Related Artists Section */}
        <section className="space-y-4 pt-6 border-t border-[#272727]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FF0000]" />
                <span>Fans Also Like</span>
              </h3>
              <p className="text-xs text-[#CCCCCC]">Artists with similar sonic palettes and styles</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {dynamicRelatedArtists.map((relName, idx) => (
              <div
                key={idx}
                onClick={() => onNavigate(`/artist/${encodeURIComponent(relName)}`)}
                className="group cursor-pointer p-3 rounded-2xl bg-[#181818] hover:bg-[#212121] border border-[#242424] hover:border-[#383838] transition flex items-center gap-3"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex items-center justify-center font-black text-sm text-[#FF4D4D] shrink-0 group-hover:scale-105 group-hover:border-red-500/50 transition">
                  {relName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-white truncate group-hover:text-[#FF4D4D] transition">
                    {relName}
                  </h5>
                  <p className="text-[10px] text-[#AAAAAA]">Explore Artist</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

