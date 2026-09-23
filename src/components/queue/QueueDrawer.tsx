import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { audioManager, PlaybackState } from '../../services/audio/AudioManager';
import { radioEngine } from '../../services/audio/RadioEngine';
import { ArtworkImage } from '../../utils/artwork';
import { YouTubeDataApiService } from '../../services/audio/YouTubeDataApi';
import {
  X,
  Trash2,
  BookmarkPlus,
  ArrowUp,
  ArrowDown,
  ThumbsUp,
  ThumbsDown,
  Play,
  Check,
  Radio,
  Disc3,
  Search,
  SkipForward,
  ListMusic,
  CornerDownRight,
  Plus,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { QueueItem, Song } from '../../types';

interface QueueDrawerProps {
  roomQueue?: QueueItem[];
  onVoteQueueItem?: (queueItemId: string, vote: 'skip' | 'keep') => void;
  onRemoveQueueItem?: (queueItemId: string) => void;
}

type VibeFilter = 'All' | 'Familiar' | 'Discover' | 'Popular' | 'Deep Cuts' | 'Chill' | 'Upbeat';

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  roomQueue,
  onVoteQueueItem,
  onRemoveQueueItem,
}) => {
  const [state, store] = useStore();
  const { isQueueDrawerOpen } = state;
  const [playback, setPlayback] = useState<PlaybackState>(audioManager.getState());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<VibeFilter>('All');
  const [isRetuning, setIsRetuning] = useState(false);
  const [queueSearch, setQueueSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Search & Add state
  const [drawerTab, setDrawerTab] = useState<'queue' | 'search'>('queue');
  const [ytSearchQuery, setYtSearchQuery] = useState('');
  const [ytSearchResults, setYtSearchResults] = useState<Song[]>([]);
  const [isYtSearching, setIsYtSearching] = useState(false);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const ytSearchDebounceRef = useRef<any>(null);
  const ytSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return audioManager.subscribe((newPlayback) => {
      setPlayback(newPlayback);
    });
  }, []);

  // YouTube search debounce
  useEffect(() => {
    if (!ytSearchQuery.trim()) {
      setYtSearchResults([]);
      setIsYtSearching(false);
      return;
    }

    if (ytSearchDebounceRef.current) {
      clearTimeout(ytSearchDebounceRef.current);
    }

    ytSearchDebounceRef.current = setTimeout(async () => {
      setIsYtSearching(true);
      try {
        const results = await YouTubeDataApiService.searchVideos(ytSearchQuery.trim(), 12);
        setYtSearchResults(results);
      } catch (err) {
        console.warn('YouTube search failed in queue drawer:', err);
      } finally {
        setIsYtSearching(false);
      }
    }, 400);

    return () => {
      if (ytSearchDebounceRef.current) clearTimeout(ytSearchDebounceRef.current);
    };
  }, [ytSearchQuery]);

  if (!isQueueDrawerOpen) return null;

  const currentSong = playback.currentSong;
  const queue = playback.queue;
  const queueIndex = playback.queueIndex;

  // The "Up Next" list: everything after the current queueIndex
  const upNextSongs = queue.slice(queueIndex + 1);

  // Filter by search query (local — never hits YouTube)
  const searchLower = queueSearch.trim().toLowerCase();
  const filteredUpNext = searchLower
    ? upNextSongs.filter(
        (s) =>
          s.title.toLowerCase().includes(searchLower) ||
          s.artist.toLowerCase().includes(searchLower)
      )
    : upNextSongs;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAddSearchResult = (song: Song, playNext = false) => {
    if (playNext) {
      audioManager.playNext(song);
      showToast(`"${song.title}" will play next`);
    } else {
      audioManager.addToQueue(song);
      showToast(`Added "${song.title}" to queue`);
    }
    setRecentlyAddedId(song.id);
    setTimeout(() => {
      setRecentlyAddedId((curr) => (curr === song.id ? null : curr));
    }, 2000);
  };

  const handleClear = () => {
    audioManager.clearQueue(true); // keep current
    setQueueSearch('');
    showToast('Queue cleared');
  };

  // actualQueueIdx = real index in audioManager's queue array
  const handleRemoveTrack = (actualQueueIdx: number, song: Song, roomItemId?: string) => {
    audioManager.removeFromQueue(actualQueueIdx);
    if (roomItemId && onRemoveQueueItem) {
      onRemoveQueueItem(roomItemId);
    }
    showToast(`Removed "${song.title}" from queue`);
  };

  const handlePlayNext = (song: Song, actualQueueIdx: number) => {
    // Move song to position queueIndex + 1 (immediately after current)
    const insertAt = queueIndex + 1;
    if (actualQueueIdx === insertAt) {
      showToast(`"${song.title}" is already playing next`);
      return;
    }
    // Remove from current position, insert at target
    audioManager.removeFromQueue(actualQueueIdx);
    audioManager.playNext(song);
    showToast(`"${song.title}" will play next`);
  };

  const handleSaveAsPlaylist = () => {
    if (queue.length === 0) return;
    const pl = store.createPlaylist('Queue Mix', `Saved queue with ${queue.length} tracks`);
    queue.forEach((s) => store.addSongToPlaylist(pl.id, s));
    showToast(`Saved ${queue.length} songs to new playlist!`);
  };

  const handleMoveUp = (actualQueueIdx: number) => {
    if (actualQueueIdx > queueIndex + 1) {
      audioManager.reorderQueue(actualQueueIdx, actualQueueIdx - 1);
    }
  };

  const handleMoveDown = (actualQueueIdx: number) => {
    if (actualQueueIdx < queue.length - 1) {
      audioManager.reorderQueue(actualQueueIdx, actualQueueIdx + 1);
    }
  };

  const handleToggleAutoplay = () => {
    const nextVal = !playback.autoplay;
    audioManager.setAutoplay(nextVal);
    showToast(nextVal ? 'Autoplay: Continuous similar music ON' : 'Autoplay OFF');
  };

  const handleVibeSelect = async (vibe: VibeFilter) => {
    setSelectedVibe(vibe);
    setIsRetuning(true);

    if (vibe === 'All') {
      setIsRetuning(false);
      return;
    }

    try {
      if (vibe === 'Chill') {
        await radioEngine.startGenreRadio('Chill', 'Mellow Acoustic & Chill');
      } else if (vibe === 'Upbeat') {
        await radioEngine.startGenreRadio('MassBass', 'High Energy & Upbeat');
      } else if (vibe === 'Discover') {
        await radioEngine.replenishCandidatePool(true);
        const candidates = radioEngine.selectNextCandidates(8);
        audioManager.setQueue([currentSong || candidates[0], ...candidates.filter(c => c.id !== currentSong?.id)]);
      } else {
        await radioEngine.startRadio(currentSong);
      }
      showToast(`Retuned queue for ${vibe} vibe`);
    } finally {
      setIsRetuning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in flex justify-end">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A1A1A] border border-[#333333] text-white text-xs font-semibold shadow-2xl animate-fade-in">
          <Check className="w-4 h-4 text-[#FF0000]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Click-outside to close */}
      <div
        className="absolute inset-0"
        onClick={() => store.setState({ isQueueDrawerOpen: false })}
      />

      <div
        className="relative w-full max-w-md bg-[#1C1C1E] border-l border-[#2A2A2E] h-full flex flex-col shadow-2xl animate-slide-in-right select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2E]">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-rose-400" />
            <h3 className="text-base font-bold text-white tracking-tight">Queue</h3>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#272727] text-[#AAAAAA] border border-[#383838]">
              {queue.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAsPlaylist}
              disabled={queue.length === 0}
              className="p-1.5 rounded-lg text-[#AAAAAA] hover:text-white hover:bg-[#272727] transition disabled:opacity-30 cursor-pointer"
              title="Save queue as playlist"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              disabled={upNextSongs.length === 0}
              className="p-1.5 rounded-lg text-[#AAAAAA] hover:text-[#FF0000] hover:bg-[#272727] transition disabled:opacity-30 cursor-pointer"
              title="Clear queue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => store.setState({ isQueueDrawerOpen: false })}
              className="p-1.5 rounded-lg text-[#AAAAAA] hover:text-white hover:bg-[#272727] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Segmented Tab Bar */}
        <div className="flex items-center p-1 bg-[#141416] mx-4 mt-3 mb-1 rounded-xl border border-[#272727]">
          <button
            onClick={() => setDrawerTab('queue')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              drawerTab === 'queue'
                ? 'bg-[#2A2A2E] text-white shadow-sm'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5 text-rose-400" />
            <span>Up Next ({upNextSongs.length})</span>
          </button>
          <button
            onClick={() => {
              setDrawerTab('search');
              setTimeout(() => ytSearchInputRef.current?.focus(), 80);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              drawerTab === 'search'
                ? 'bg-[#2A2A2E] text-white shadow-sm'
                : 'text-[#888888] hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-rose-400" />
            <span>Search & Add</span>
          </button>
        </div>

        {drawerTab === 'search' ? (
          /* Search & Add to Queue Tab */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#2A2A2E]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#717171] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={ytSearchInputRef}
                  type="text"
                  value={ytSearchQuery}
                  onChange={(e) => setYtSearchQuery(e.target.value)}
                  placeholder="Search YouTube to add songs..."
                  className="w-full pl-8 pr-8 py-2 text-xs rounded-xl bg-[#0F0F0F] border border-[#2B2B30] text-white placeholder-[#717171] focus:border-rose-500/60 focus:outline-none transition"
                />
                {isYtSearching ? (
                  <Loader2 className="w-3.5 h-3.5 text-rose-400 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                ) : ytSearchQuery ? (
                  <button
                    onClick={() => setYtSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#717171] hover:text-white p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>

              {/* Quick Suggestion Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2">
                {['Trending Hits', 'Acoustic Chill', 'Arijit Singh', 'Anirudh', 'Synthwave', 'Lofi Beats'].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setYtSearchQuery(chip)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#212124] hover:bg-[#2B2B30] text-[#AAAAAA] hover:text-white border border-[#2E2E32] transition shrink-0 cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {isYtSearching && ytSearchResults.length === 0 ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 text-rose-400 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-[#888888]">Searching YouTube Music catalog...</p>
                </div>
              ) : ytSearchResults.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-[#2A2A2E] rounded-2xl bg-[#141416]">
                  <Search className="w-7 h-7 text-[#555555] mx-auto mb-2" />
                  <p className="text-xs text-white font-semibold">
                    {ytSearchQuery ? 'No YouTube results found' : 'Find songs to enqueue'}
                  </p>
                  <p className="text-[11px] text-[#888888] mt-1 max-w-xs mx-auto">
                    {ytSearchQuery
                      ? 'Try searching with an artist name or song title'
                      : 'Type a title or tap one of the chips above to add music instantly'}
                  </p>
                </div>
              ) : (
                ytSearchResults.map((song) => {
                  const isRecentlyAdded = recentlyAddedId === song.id;
                  return (
                    <div
                      key={song.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#212124] hover:bg-[#28282B] border border-[#2A2A2E] hover:border-white/20 transition group"
                    >
                      <div
                        className="flex items-center gap-3 overflow-hidden min-w-0 flex-1 cursor-pointer"
                        onClick={() => {
                          audioManager.playSong(song);
                          showToast(`Playing "${song.title}"`);
                        }}
                        title="Click to Play Now"
                      >
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow">
                          <ArtworkImage song={song} alt={song.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <Play className="w-3.5 h-3.5 fill-current text-white ml-0.5" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate group-hover:text-rose-400 transition">
                            {song.title}
                          </p>
                          <p className="text-[11px] text-[#AAAAAA] truncate">{song.artist}</p>
                          {song.duration > 0 && (
                            <p className="text-[10px] text-[#717171] font-mono">
                              {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleAddSearchResult(song, true)}
                          className="p-1.5 rounded-lg text-[#AAAAAA] hover:text-rose-400 hover:bg-white/5 transition cursor-pointer"
                          title="Play Next"
                        >
                          <SkipForward className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleAddSearchResult(song, false)}
                          disabled={isRecentlyAdded}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            isRecentlyAdded
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/30'
                          }`}
                          title="Add to queue"
                        >
                          {isRecentlyAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Added</span>
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
              )}
            </div>
          </div>
        ) : (
          /* Up Next / Queue Tab */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Queue Search — find songs already in queue */}
            <div className="px-4 py-2.5 border-b border-[#2A2A2E]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#717171] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchRef}
                  type="text"
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  placeholder="Search in queue..."
                  className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg bg-[#0F0F0F] border border-[#272727] text-white placeholder-[#717171] focus:border-rose-500/60 focus:outline-none transition"
                />
                {queueSearch && (
                  <button
                    onClick={() => setQueueSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#717171] hover:text-white p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              {queueSearch && (
                <p className="text-[10px] text-[#717171] mt-1 pl-0.5">
                  {filteredUpNext.length} of {upNextSongs.length} songs match
                </p>
              )}
            </div>

            {/* Vibe Tuners */}
            {!queueSearch && (
              <div className="px-4 py-2.5 border-b border-[#2A2A2E] overflow-x-auto no-scrollbar flex items-center gap-1.5">
                {(['All', 'Familiar', 'Discover', 'Popular', 'Deep Cuts', 'Chill', 'Upbeat'] as VibeFilter[]).map((vibe) => (
                  <button
                    key={vibe}
                    onClick={() => handleVibeSelect(vibe)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition shrink-0 cursor-pointer ${
                      selectedVibe === vibe
                        ? 'bg-white text-black font-bold shadow-md'
                        : 'bg-[#272727] text-[#AAAAAA] hover:text-white hover:bg-[#333333]'
                    }`}
                  >
                    {isRetuning && selectedVibe === vibe ? '...' : vibe}
                  </button>
                ))}
              </div>
            )}

            {/* Autoplay Toggle */}
            <div className="px-4 py-2.5 bg-[#141416] border-b border-[#2A2A2E] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${playback.autoplay ? 'text-rose-500 animate-pulse' : 'text-[#717171]'}`} />
                <p className="text-xs font-bold text-white">Autoplay</p>
                {playback.autoplay && (
                  <span className="text-[10px] text-rose-400">Similar music streams on</span>
                )}
              </div>
              <button
                onClick={handleToggleAutoplay}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  playback.autoplay ? 'bg-rose-600' : 'bg-[#333333]'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
                    playback.autoplay ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
              {/* Now Playing */}
              {currentSong && !queueSearch && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      Playing Now
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-red-950/30 via-[#252528] to-[#252528] border border-rose-500/30 shadow-lg">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow">
                        <ArtworkImage song={currentSong} alt={currentSong.title} className="w-full h-full object-cover" />
                        {playback.isPlaying && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                            <span className="w-1 h-3 bg-white animate-pulse" />
                            <span className="w-1 h-5 bg-white animate-pulse delay-75" />
                            <span className="w-1 h-2 bg-white animate-pulse delay-150" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{currentSong.title}</p>
                        <p className="text-[11px] text-[#AAAAAA] truncate">{currentSong.artist}</p>
                        <p className="text-[10px] text-rose-400 font-mono mt-0.5">
                          {Math.floor(playback.currentTime / 60)}:{Math.floor(playback.currentTime % 60).toString().padStart(2, '0')}
                          {' / '}
                          {Math.floor(currentSong.duration / 60)}:{(currentSong.duration % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Up Next / Search Results */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#AAAAAA]">
                    {queueSearch
                      ? `Results (${filteredUpNext.length})`
                      : `Next in Queue (${upNextSongs.length})`}
                  </span>
                  {!queueSearch && upNextSongs.length > 0 && (
                    <button
                      onClick={handleClear}
                      className="text-xs text-rose-400 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {filteredUpNext.length === 0 ? (
                  <div className="text-center py-8 px-4 border border-dashed border-[#2A2A2E] rounded-2xl bg-[#141416]">
                    <Disc3 className="w-7 h-7 text-[#555555] mx-auto mb-2 animate-spin-slow" />
                    {queueSearch ? (
                      <>
                        <p className="text-xs text-white font-semibold">No matches in queue</p>
                        <p className="text-[11px] text-[#888888] mt-1">Want to search YouTube for "{queueSearch}"?</p>
                        <button
                          onClick={() => {
                            setYtSearchQuery(queueSearch);
                            setDrawerTab('search');
                          }}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-rose-400 hover:text-white text-xs font-semibold border border-white/10 transition cursor-pointer"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>Search YouTube & Add</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-white font-semibold">Queue is empty</p>
                        <p className="text-[11px] text-[#888888] mt-1">
                          {playback.autoplay ? 'Autoplay ON — radio will stream next' : 'Add songs to queue.'}
                        </p>
                        <button
                          onClick={() => {
                            setDrawerTab('search');
                            setTimeout(() => ytSearchInputRef.current?.focus(), 80);
                          }}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold border border-white/10 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-rose-400" />
                          <span>Find songs on YouTube</span>
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredUpNext.map((song, idx) => {
                      // Calculate actual position in the full queue array
                      const actualQueueIdx = queueSearch
                        ? queue.findIndex((q, qi) => qi > queueIndex && q.id === song.id && !queue.slice(queueIndex + 1, qi).some(prev => prev.id === song.id))
                        : queueIndex + 1 + idx;

                      const roomItem = roomQueue?.find((rq) => rq.song.id === song.id);
                      const isNextUp = actualQueueIdx === queueIndex + 1;

                      return (
                        <div
                          key={`${song.id}-${actualQueueIdx}`}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition group ${
                            isNextUp
                              ? 'bg-[#272728] border-rose-500/40'
                              : 'bg-[#212124] hover:bg-[#28282B] border-[#2A2A2E] hover:border-white/20'
                          }`}
                        >
                          <div
                            className="flex items-center gap-3 overflow-hidden min-w-0 cursor-pointer flex-1"
                            onClick={() => audioManager.playSongAtIndex(actualQueueIdx)}
                          >
                            <span className="text-xs font-mono text-[#717171] w-4 text-center shrink-0">
                              {queueSearch ? (
                                <Search className="w-3 h-3" />
                              ) : isNextUp ? (
                                <CornerDownRight className="w-3 h-3 text-rose-400" />
                              ) : (
                                actualQueueIdx - queueIndex
                              )}
                            </span>
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 shadow">
                              <ArtworkImage song={song} alt={song.title} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                <Play className="w-3.5 h-3.5 fill-current text-white ml-0.5" />
                              </div>
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-semibold truncate transition ${isNextUp ? 'text-rose-400' : 'text-white group-hover:text-rose-400'}`}>
                                {song.title}
                              </p>
                              <p className="text-[11px] text-[#AAAAAA] truncate">{song.artist}</p>
                              {roomItem && (
                                <p className="text-[10px] text-rose-400 mt-0.5">
                                  Added by @{roomItem.addedBy.username}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                            {/* Room voting */}
                            {roomItem && onVoteQueueItem && (
                              <div className="flex items-center gap-1 mr-1 bg-[#18181A] px-1.5 py-0.5 rounded-lg border border-[#333333]">
                                <button
                                  onClick={() => onVoteQueueItem(roomItem.id, 'keep')}
                                  className={`p-1 rounded text-[10px] flex items-center gap-1 ${
                                    roomItem.votes.userVote === 'keep' ? 'text-emerald-400 font-bold' : 'text-[#AAAAAA] hover:text-white'
                                  }`}
                                  title="Vote Keep"
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                  <span>{roomItem.votes.keep}</span>
                                </button>
                                <button
                                  onClick={() => onVoteQueueItem(roomItem.id, 'skip')}
                                  className={`p-1 rounded text-[10px] flex items-center gap-1 ${
                                    roomItem.votes.userVote === 'skip' ? 'text-red-400 font-bold' : 'text-[#AAAAAA] hover:text-white'
                                  }`}
                                  title="Vote Skip"
                                >
                                  <ThumbsDown className="w-3 h-3" />
                                  <span>{roomItem.votes.skip}</span>
                                </button>
                              </div>
                            )}

                            {/* Play Next */}
                            {!isNextUp && (
                              <button
                                onClick={() => handlePlayNext(song, actualQueueIdx)}
                                className="p-1 text-[#717171] hover:text-rose-400 transition cursor-pointer opacity-0 group-hover:opacity-100"
                                title="Play Next"
                              >
                                <SkipForward className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Reorder buttons */}
                            {!queueSearch && (
                              <div className="flex flex-col opacity-0 group-hover:opacity-100 transition">
                                <button
                                  onClick={() => handleMoveUp(actualQueueIdx)}
                                  disabled={isNextUp}
                                  className="p-0.5 text-[#717171] hover:text-white disabled:opacity-20 cursor-pointer"
                                  title="Move up"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleMoveDown(actualQueueIdx)}
                                  disabled={actualQueueIdx === queue.length - 1}
                                  className="p-0.5 text-[#717171] hover:text-white disabled:opacity-20 cursor-pointer"
                                  title="Move down"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => {
                                if (actualQueueIdx >= 0) {
                                  handleRemoveTrack(actualQueueIdx, song, roomItem?.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-[#AAAAAA] hover:text-[#FF0000] hover:bg-white/5 transition cursor-pointer opacity-0 group-hover:opacity-100"
                              title="Remove from queue"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
