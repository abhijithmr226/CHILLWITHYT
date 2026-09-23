import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { YouTubeDataApiService } from '../../services/audio/YouTubeDataApi';
import { YouTubePlayerService } from '../../services/audio/YouTubePlayer';
import { DEFAULT_TRACKS } from '../../services/audio/DefaultMusicProvider';
import { Song, Room } from '../../types';
import {
  Search,
  Link2,
  ListPlus,
  Play,
  Sparkles,
  Heart,
  X,
  Loader2,
  Check,
  Music,
  Plus,
  Radio,
  ExternalLink
} from 'lucide-react';

interface AddMusicToRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  onQueueSong: (song: Song) => void;
  onPlayNow?: (song: Song) => void;
  isHostOrDj?: boolean;
}

type TabType = 'search' | 'url' | 'library' | 'suggestions';

export const AddMusicToRoomModal: React.FC<AddMusicToRoomModalProps> = ({
  isOpen,
  onClose,
  room,
  onQueueSong,
  onPlayNow,
  isHostOrDj = false,
}) => {
  const [state] = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('search');

  // Search tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const searchDebounceRef = useRef<any>(null);

  // URL tab state
  const [urlInput, setUrlInput] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [detectedSong, setDetectedSong] = useState<Song | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Feedback notifications
  const [addedSongId, setAddedSongId] = useState<string | null>(null);

  // Initial suggestions based on room tags/language
  const roomSuggestions = React.useMemo(() => {
    const tags = room.tags?.map((t) => t.toLowerCase()) || [];
    const nameLower = room.name.toLowerCase();
    const candidateTracks = [...(state.likedSongs || []), ...DEFAULT_TRACKS];
    // Deduplicate by ID
    const unique = candidateTracks.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    const matched = unique.filter((song) => {
      const sTags = song.tags?.map((t) => t.toLowerCase()) || [];
      return (
        tags.some((tag) => sTags.includes(tag) || song.artist.toLowerCase().includes(tag)) ||
        sTags.some((tag) => nameLower.includes(tag))
      );
    });
    return matched.length >= 3 ? matched : unique.slice(0, 8);
  }, [room, state.likedSongs]);

  // Liked songs from persistent store cache
  const likedSongs = React.useMemo(() => {
    if (state.likedSongs && state.likedSongs.length > 0) {
      return state.likedSongs;
    }
    return DEFAULT_TRACKS.filter((s) => state.likedSongIds.includes(s.id));
  }, [state.likedSongs, state.likedSongIds]);

  // Check if track is actively in room queue or currently playing
  const getQueueStatus = (song: Song) => {
    if (room.currentSong?.id === song.id || (song.sourceId && room.currentSong?.sourceId === song.sourceId)) {
      return 'playing';
    }
    if (state.roomQueue.some(q => q.song.id === song.id || (song.sourceId && q.song.sourceId === song.sourceId))) {
      return 'queued';
    }
    return null;
  };

  // Handle Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setHasSearched(true);
      try {
        const results = await YouTubeDataApiService.searchVideos(searchQuery.trim(), 14);
        // Exclude shorts (< 60s)
        const verified = results.filter((s) => s.duration >= 60);
        setSearchResults(verified.length > 0 ? verified : results);
      } catch (err) {
        console.warn('Failed to search YouTube:', err);
      } finally {
        setIsSearching(false);
      }
    }, 450);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery]);

  // Handle URL detection
  const handleDetectUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError(null);
    setDetectedSong(null);

    const clean = urlInput.trim();
    if (!clean) return;

    const ytId = YouTubePlayerService.extractVideoId(clean);
    if (!ytId) {
      setUrlError('Please paste a valid YouTube video link or video ID.');
      return;
    }

    setIsLoadingUrl(true);
    try {
      const meta = await YouTubePlayerService.fetchYouTubeMetadata(ytId);
      const song: Song = {
        id: `yt-${ytId}`,
        source: 'youtube',
        sourceId: ytId,
        title: meta.title,
        artist: meta.artist,
        artwork: meta.artwork,
        duration: meta.duration,
        tags: ['YouTube', 'Room Added'],
      };
      setDetectedSong(song);
    } catch (err: any) {
      setUrlError('Could not retrieve YouTube video details. Make sure the video is public.');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleQueueTrack = (song: Song) => {
    onQueueSong(song);
    setAddedSongId(song.id);
    setTimeout(() => {
      setAddedSongId(null);
    }, 2000);
  };

  const handlePlayTrackNow = (song: Song) => {
    if (onPlayNow) {
      onPlayNow(song);
      onClose();
    } else {
      handleQueueTrack(song);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#161618] border border-[#2D2D32] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-[#25252A] flex items-center justify-between bg-[#1B1B1F]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <ListPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Add Music to Room</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white font-semibold">
                  {room.name}
                </span>
              </h3>
              <p className="text-xs text-[#CCCCCC]">Search YouTube, paste links, or pick from your library</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#CCCCCC] hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 px-5 pt-3 pb-2 border-b border-[#25252A] bg-[#161618] overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'search'
                ? 'bg-[#FF0000] text-white shadow-md shadow-red-900/40 font-bold'
                : 'text-[#CCCCCC] hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search YouTube</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'url'
                ? 'bg-[#FF0000] text-white shadow-md shadow-red-900/40 font-bold'
                : 'text-[#CCCCCC] hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Paste Link</span>
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'library'
                ? 'bg-[#FF0000] text-white shadow-md shadow-red-900/40 font-bold'
                : 'text-[#CCCCCC] hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>My Library ({likedSongs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'suggestions'
                ? 'bg-[#FF0000] text-white shadow-md shadow-red-900/40 font-bold'
                : 'text-[#CCCCCC] hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Room Vibes</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          
          {/* TAB 1: SEARCH YOUTUBE */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAAAAA]" />
                <input
                  type="text"
                  placeholder="Search songs, artists, soundtracks on YouTube..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full bg-[#202024] border border-[#3A3A42] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-neutral-400 focus:outline-none focus:border-red-500 transition"
                />
                {isSearching ? (
                  <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 animate-spin" />
                ) : searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

              {/* Search Results */}
              <div className="space-y-2">
                {searchResults.length > 0 ? (
                  searchResults.map((song) => {
                    const isJustAdded = addedSongId === song.id;
                    return (
                      <div
                        key={song.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* 16:9 YouTube Thumbnail Size Box */}
                          <div className="w-16 h-10 aspect-video rounded-lg overflow-hidden bg-neutral-900 shrink-0 border border-white/10 shadow-sm">
                            <img
                              src={song.artwork}
                              alt={song.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-white truncate group-hover:text-red-400 transition">
                              {song.title}
                            </h4>
                            <p className="text-[11px] text-[#CCCCCC] truncate mt-0.5">
                              {song.artist} • <span className="font-mono text-white/90">{formatDuration(song.duration)}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-3">
                          {(() => {
                            const status = getQueueStatus(song);
                            if (status === 'playing') {
                              return (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Playing
                                </span>
                              );
                            }
                            if (status === 'queued') {
                              return (
                                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-medium border border-white/10">
                                  In Queue
                                </span>
                              );
                            }
                            return null;
                          })()}

                          {isHostOrDj && (
                            <button
                              onClick={() => handlePlayTrackNow(song)}
                              className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                              title="Play Now in Room"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              <span className="hidden sm:inline">Play</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleQueueTrack(song)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                              isJustAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#FF0000] hover:bg-red-600 text-white'
                            }`}
                          >
                            {isJustAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Queued</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : hasSearched && !isSearching ? (
                  <div className="py-12 text-center text-[#CCCCCC]">
                    <Music className="w-8 h-8 mx-auto mb-2 opacity-60 text-red-500" />
                    <p className="text-sm font-semibold text-white">No songs found for "{searchQuery}"</p>
                    <p className="text-xs text-[#AAAAAA] mt-1">Try another title, soundtrack, or artist keyword</p>
                  </div>
                ) : (
                  <div className="py-8 text-center text-[#CCCCCC]">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50 text-red-400" />
                    <p className="text-sm font-bold text-white">Type to search any YouTube music</p>
                    <p className="text-xs text-[#AAAAAA] mt-1">Full audio length • Zero shorts filtered</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PASTE URL */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <form onSubmit={handleDetectUrl} className="space-y-3">
                <label className="text-xs font-semibold text-white">
                  Paste YouTube Video URL or ID:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 bg-[#202024] border border-[#3A3A42] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-400 focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="submit"
                    disabled={isLoadingUrl || !urlInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#FF0000] hover:bg-red-600 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    {isLoadingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch Song'}
                  </button>
                </div>
                {urlError && <p className="text-xs text-red-400 font-medium">{urlError}</p>}
              </form>

              {/* Detected Song Card */}
              {detectedSong && (
                <div className="p-4 rounded-xl bg-white/[0.06] border border-white/15 space-y-3 animate-fade-in">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Video Detected</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-14 aspect-video rounded-lg overflow-hidden bg-neutral-900 shrink-0 border border-white/10">
                      <img
                        src={detectedSong.artwork}
                        alt={detectedSong.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate">{detectedSong.title}</h4>
                      <p className="text-xs text-[#CCCCCC] mt-0.5">
                        {detectedSong.artist} • <span className="font-mono text-white/90">{formatDuration(detectedSong.duration)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    {isHostOrDj && (
                      <button
                        onClick={() => handlePlayTrackNow(detectedSong)}
                        className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Play Right Now</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleQueueTrack(detectedSong)}
                      className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        addedSongId === detectedSong.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#FF0000] hover:bg-red-600 text-white'
                      }`}
                    >
                      {addedSongId === detectedSong.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Added to Queue!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Add to Room Queue</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MY LIBRARY */}
          {activeTab === 'library' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-[#CCCCCC] font-bold uppercase tracking-wider">
                  Your Liked Tracks & Playlists
                </span>
                <span className="text-xs text-red-400 font-bold">{likedSongs.length} tracks</span>
              </div>

              {likedSongs.length > 0 ? (
                <div className="space-y-2">
                  {likedSongs.map((song) => {
                    const isJustAdded = addedSongId === song.id;
                    return (
                      <div
                        key={song.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-16 h-10 aspect-video rounded-lg overflow-hidden bg-neutral-900 shrink-0 border border-white/10">
                            <img
                              src={song.artwork}
                              alt={song.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-white truncate group-hover:text-red-400 transition">{song.title}</h4>
                            <p className="text-[11px] text-[#CCCCCC] truncate mt-0.5">
                              {song.artist} • <span className="font-mono text-white/90">{formatDuration(song.duration)}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-3">
                          {(() => {
                            const status = getQueueStatus(song);
                            if (status === 'playing') {
                              return (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Playing
                                </span>
                              );
                            }
                            if (status === 'queued') {
                              return (
                                <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-medium border border-white/10">
                                  In Queue
                                </span>
                              );
                            }
                            return null;
                          })()}

                          {isHostOrDj && (
                            <button
                              onClick={() => handlePlayTrackNow(song)}
                              className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                              title="Play Now in Room"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              <span className="hidden sm:inline">Play</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleQueueTrack(song)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                              isJustAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#FF0000] hover:bg-red-600 text-white'
                            }`}
                          >
                            {isJustAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            <span>{isJustAdded ? 'Queued' : 'Add'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-[#CCCCCC]">
                  <Heart className="w-8 h-8 mx-auto mb-2 opacity-60 text-red-500" />
                  <p className="text-sm font-bold text-white">No liked songs in your library yet</p>
                  <p className="text-xs text-[#AAAAAA] mt-1">Like songs to add them with one click here!</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ROOM SUGGESTIONS */}
          {activeTab === 'suggestions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-[#CCCCCC] font-bold uppercase tracking-wider">
                  Handpicked for {room.tags?.[0] || room.name}
                </span>
                <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Vibe Match
                </span>
              </div>

              <div className="space-y-2">
                {roomSuggestions.map((song) => {
                  const isJustAdded = addedSongId === song.id;
                  return (
                    <div
                      key={song.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-16 h-10 aspect-video rounded-lg overflow-hidden bg-neutral-900 shrink-0 border border-white/10">
                          <img
                            src={song.artwork}
                            alt={song.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-red-400 transition">{song.title}</h4>
                          <p className="text-[11px] text-[#CCCCCC] truncate mt-0.5">
                            {song.artist} • <span className="font-mono text-white/90">{formatDuration(song.duration)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-3">
                        {(() => {
                          const status = getQueueStatus(song);
                          if (status === 'playing') {
                            return (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Playing
                              </span>
                            );
                          }
                          if (status === 'queued') {
                            return (
                              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-medium border border-white/10">
                                In Queue
                              </span>
                            );
                          }
                          return null;
                        })()}

                        {isHostOrDj && (
                          <button
                            onClick={() => handlePlayTrackNow(song)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="Play Now in Room"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            <span className="hidden sm:inline">Play</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleQueueTrack(song)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                            isJustAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#FF0000] hover:bg-red-600 text-white'
                          }`}
                        >
                          {isJustAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          <span>{isJustAdded ? 'Queued' : 'Add'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
