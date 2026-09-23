import React, { useState, useEffect, useRef } from 'react';
import { Song } from '../../types';
import { audioManager, PlaybackState } from '../../services/audio/AudioManager';
import { radioEngine } from '../../services/audio/RadioEngine';
import { MusicService } from '../../services/audio/MusicService';
import { ArtworkImage } from '../../utils/artwork';
import {
  ListMusic,
  Sparkles,
  Radio,
  Play,
  Trash2,
  Sliders,
  Check,
  Flame,
  Coffee,
  Disc3,
  Search,
  Plus,
  Loader2,
  X,
  ListPlus,
  CornerDownRight
} from 'lucide-react';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export type PlayerTabType = 'up_next' | 'related';

interface YouTubeMusicPlayerTabsProps {
  currentSong: Song | null;
  playback: PlaybackState;
  onCloseModal?: () => void;
  className?: string;
  defaultTab?: PlayerTabType;
}

type VibeFilter = 'All' | 'Familiar' | 'Discover' | 'Popular' | 'Deep Cuts' | 'Chill' | 'Upbeat';

const VIBE_FILTERS: { id: VibeFilter; label: string; icon: React.ReactNode }[] = [
  { id: 'All', label: 'All', icon: <Sliders className="w-3 h-3" /> },
  { id: 'Familiar', label: 'Familiar', icon: <Disc3 className="w-3 h-3" /> },
  { id: 'Discover', label: 'Discover', icon: <Sparkles className="w-3 h-3" /> },
  { id: 'Popular', label: 'Popular', icon: <Flame className="w-3 h-3" /> },
  { id: 'Deep Cuts', label: 'Deep Cuts', icon: <Radio className="w-3 h-3" /> },
  { id: 'Chill', label: 'Chill', icon: <Coffee className="w-3 h-3" /> },
  { id: 'Upbeat', label: 'Upbeat', icon: <Sparkles className="w-3 h-3" /> },
];

export const YouTubeMusicPlayerTabs: React.FC<YouTubeMusicPlayerTabsProps> = ({
  currentSong,
  playback,
  className = '',
  defaultTab = 'up_next'
}) => {
  const [activeTab, setActiveTab] = useState<PlayerTabType>(defaultTab === 'related' ? 'related' : 'up_next');
  const [selectedVibe, setSelectedVibe] = useState<VibeFilter>('All');
  const [, setIsRetuning] = useState(false);

  // In-Player Search & Add state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedSongId, setAddedSongId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Related state
  const [relatedTracks, setRelatedTracks] = useState<Song[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Keep activeTab synced with defaultTab prop changes
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab === 'related' ? 'related' : 'up_next');
    }
  }, [defaultTab]);

  // Debounced search for adding songs directly from player
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await MusicService.searchTracks(trimmed, 8);
        setSearchResults(res.data);
      } catch (err) {
        console.warn('In-player search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load related tracks when song changes or tab opened
  useEffect(() => {
    if (!currentSong) return;
    let isCancelled = false;

    const fetchRelated = async () => {
      setLoadingRelated(true);
      try {
        const tracks = await MusicService.getRecommendationsForSong(currentSong, 12);
        if (!isCancelled) {
          setRelatedTracks(tracks);
        }
      } catch (err) {
        console.warn('Failed to load related tracks:', err);
      } finally {
        if (!isCancelled) setLoadingRelated(false);
      }
    };

    fetchRelated();
    return () => {
      isCancelled = true;
    };
  }, [currentSong?.id]);

  const handleApplyVibe = async (vibe: VibeFilter) => {
    setSelectedVibe(vibe);
    if (!currentSong) return;
    setIsRetuning(true);
    try {
      if (vibe === 'All') {
        // Keep current queue
      } else if (vibe === 'Discover') {
        const query = `${currentSong.artist} indie fresh new releases`;
        const tracks = await MusicService.searchTracks(query, 10);
        if (tracks.data.length > 0) {
          audioManager.setQueue(tracks.data);
        }
      } else if (vibe === 'Familiar') {
        const query = `${currentSong.artist} greatest hits classic`;
        const tracks = await MusicService.searchTracks(query, 10);
        if (tracks.data.length > 0) {
          audioManager.setQueue(tracks.data);
        }
      } else if (vibe === 'Chill') {
        const query = `${currentSong.artist} chill acoustic unplugged slow`;
        const tracks = await MusicService.searchTracks(query, 10);
        if (tracks.data.length > 0) {
          audioManager.setQueue(tracks.data);
        }
      } else if (vibe === 'Upbeat') {
        const query = `${currentSong.artist} fast beat dance energetic`;
        const tracks = await MusicService.searchTracks(query, 10);
        if (tracks.data.length > 0) {
          audioManager.setQueue(tracks.data);
        }
      }
    } catch (e) {
      console.warn('Vibe tune failed:', e);
    } finally {
      setIsRetuning(false);
    }
  };

  const handleStartRadioFromCurrent = () => {
    if (currentSong) {
      radioEngine.startRadio(currentSong);
    }
  };

  const handleAddSongAction = (song: Song, action: 'play' | 'next' | 'queue') => {
    if (action === 'play') {
      audioManager.playSong(song);
    } else if (action === 'next') {
      audioManager.playNext(song);
    } else {
      audioManager.addToQueue(song);
    }
    setAddedSongId(song.id);
    setTimeout(() => setAddedSongId(null), 1800);
  };

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className={`flex flex-col h-full bg-[#161616] border border-[#272727] rounded-3xl overflow-hidden shadow-2xl ${className}`}>
      {/* ── 2-Tab Header (UP NEXT | RELATED) ── */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2 border-b border-[#242424] bg-[#1A1A1A] select-none shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('up_next')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'up_next'
                ? 'bg-white text-black shadow-md'
                : 'text-[#AAAAAA] hover:text-white hover:bg-[#272727]'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Up Next</span>
            {playback.queue.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'up_next' ? 'bg-black text-white' : 'bg-[#333333] text-[#AAAAAA]'
              }`}>
                {playback.queue.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('related')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'related'
                ? 'bg-white text-black shadow-md'
                : 'text-[#AAAAAA] hover:text-white hover:bg-[#272727]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Related</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Search & Add Toggle */}
          <button
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (!isSearchOpen) setTimeout(() => searchInputRef.current?.focus(), 80);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
              isSearchOpen
                ? 'bg-[#FF0000] text-white'
                : 'bg-[#272727] text-[#CCCCCC] hover:text-white hover:bg-[#333333]'
            }`}
            title="Search and add songs to queue"
          >
            <Search className="w-3 h-3" />
            <span className="hidden sm:inline">{isSearchOpen ? 'Close Search' : 'Add Songs'}</span>
          </button>

          {/* Quick Radio Button */}
          <button
            onClick={handleStartRadioFromCurrent}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#272727] hover:bg-[#FF0000] text-[#CCCCCC] hover:text-white text-[11px] font-semibold transition cursor-pointer"
            title="Start continuous radio station from current track"
          >
            <Radio className="w-3 h-3" />
            <span>Radio</span>
          </button>
        </div>
      </div>

      {/* ── Tab Content Panes ── */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar">
        {/* TAB 1: UP NEXT */}
        {activeTab === 'up_next' && (
          <div className="space-y-3">
            {/* Collapsible In-Player Quick Search & Add Bar */}
            {(isSearchOpen || searchQuery.trim().length > 0) && (
              <div className="space-y-2 animate-fade-in">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 absolute left-3 text-[#777777] pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search & add songs to queue..."
                    className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#202020] border border-[#333333] focus:border-[#FF0000] text-xs text-white placeholder-[#717171] focus:outline-none transition"
                  />
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 absolute right-3 text-[#FF0000] animate-spin" />
                  ) : searchQuery ? (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 p-1 text-[#777777] hover:text-white transition cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>

                {/* Live Search Results Dropdown/Shelf */}
                {searchQuery.trim().length > 0 && (
                  <div className="p-2.5 rounded-2xl bg-[#1C1C1E] border border-[#353538] space-y-2 shadow-xl animate-fade-in">
                    <div className="flex items-center justify-between px-1 text-[11px] font-bold text-[#AAAAAA]">
                      <span className="flex items-center gap-1.5 text-white">
                        <Search className="w-3 h-3 text-[#FF0000]" />
                        Search Results ({searchResults.length})
                      </span>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-[10px] text-[#888888] hover:text-white cursor-pointer"
                      >
                        Done
                      </button>
                    </div>

                    {isSearching && searchResults.length === 0 ? (
                      <div className="py-4 text-center text-xs text-[#717171] flex items-center justify-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF0000]" />
                        <span>Searching YouTube...</span>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="py-4 text-center text-xs text-[#717171]">
                        No songs found for "{searchQuery}"
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5 custom-scrollbar">
                        {searchResults.map((song) => {
                          const isJustAdded = addedSongId === song.id;
                          return (
                            <div
                              key={song.id}
                              className="flex items-center justify-between p-1.5 rounded-xl bg-[#252528] hover:bg-[#2F2F33] transition border border-transparent hover:border-[#3D3D42]"
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/10">
                                  <ArtworkImage src={song.artwork} alt={song.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1 pr-1">
                                  <p className="text-xs font-semibold text-white line-clamp-1">
                                    {song.title}
                                  </p>
                                  <p className="text-[10px] text-[#888888] truncate">
                                    {song.artist}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                {isJustAdded ? (
                                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-bold animate-fade-in">
                                    <Check className="w-3 h-3" />
                                    <span>Added</span>
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleAddSongAction(song, 'play')}
                                      className="p-1.5 rounded-lg bg-[#333336] hover:bg-[#FF0000] text-white transition cursor-pointer"
                                      title="Play Now"
                                    >
                                      <Play className="w-3 h-3 fill-current" />
                                    </button>
                                    <button
                                      onClick={() => handleAddSongAction(song, 'next')}
                                      className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-[#333336] hover:bg-[#FF0000] text-[#CCCCCC] hover:text-white text-[10px] font-semibold transition cursor-pointer"
                                      title="Play Next"
                                    >
                                      <CornerDownRight className="w-3 h-3 text-[#AAAAAA]" />
                                      <span>Next</span>
                                    </button>
                                    <button
                                      onClick={() => handleAddSongAction(song, 'queue')}
                                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#333336] hover:bg-emerald-600 text-[#CCCCCC] hover:text-white text-[10px] font-semibold transition cursor-pointer"
                                      title="Add to Queue"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Queue</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Streamlined Controls Row: Autoplay & Vibe Pills */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              {/* Autoplay Switch */}
              <div className="flex items-center gap-1.5 shrink-0 bg-[#1C1C1E] px-2.5 py-1 rounded-full border border-[#2B2B2D]">
                <button
                  onClick={() => audioManager.toggleAutoplay()}
                  className={`w-6 h-3.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                    audioManager.isAutoplayEnabled() ? 'bg-[#FF0000]' : 'bg-[#444444]'
                  }`}
                  title="Autoplay continuous similar music"
                >
                  <div className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                    audioManager.isAutoplayEnabled() ? 'translate-x-2.5' : 'translate-x-0'
                  }`} />
                </button>
                <span className="text-[10px] font-bold text-white">Autoplay</span>
              </div>

              {/* Vibe Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 flex-1 justify-end">
                {VIBE_FILTERS.slice(0, 5).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleApplyVibe(f.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                      selectedVibe === f.id
                        ? 'bg-[#FF0000] text-white shadow-sm'
                        : 'bg-[#202020] text-[#888888] hover:text-white border border-[#2B2B2B]'
                    }`}
                  >
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>

              {playback.queue.length > 0 && (
                <button
                  onClick={() => audioManager.clearQueue(false)}
                  className="p-1 text-[#717171] hover:text-red-400 hover:bg-red-950/20 rounded-lg transition text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                  title="Clear upcoming queue"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Upcoming Queue List */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-1 text-[11px] font-bold text-[#717171] uppercase tracking-wider">
                <span>Next In Queue</span>
                <span>{playback.queue.length} Tracks</span>
              </div>

              {playback.queue.length === 0 ? (
                <div className="text-center py-6 px-4 rounded-2xl bg-[#1A1A1A] border border-dashed border-[#333333]">
                  <ListPlus className="w-7 h-7 text-[#FF0000]/50 mx-auto mb-2 animate-pulse" />
                  <p className="text-xs font-bold text-white">Queue is empty</p>
                  <p className="text-[11px] text-[#888888] mt-1">Use the search box above to add songs or start radio</p>
                  <button
                    onClick={handleStartRadioFromCurrent}
                    className="mt-3 px-4 py-1.5 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Start Radio</span>
                  </button>
                </div>
              ) : (
                playback.queue.map((song, idx) => {
                  const isCurrent = idx === playback.queueIndex;
                  return (
                    <div
                      key={`${song.id}-${idx}`}
                      className={`group flex items-center justify-between p-2 rounded-xl transition border ${
                        isCurrent
                          ? 'bg-[#FF0000]/10 border-[#FF0000]/40 shadow-sm'
                          : 'hover:bg-[#212121] border-transparent hover:border-[#2C2C2C]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="w-4 text-[11px] font-mono text-[#555555] group-hover:hidden text-center shrink-0">
                          {isCurrent ? (
                            <span className="inline-block w-2 h-2 rounded-full bg-[#FF0000] animate-pulse" />
                          ) : (
                            idx + 1
                          )}
                        </span>
                        <button
                          onClick={() => audioManager.playSongAtIndex(idx)}
                          className="w-4 text-[#FF0000] hidden group-hover:flex items-center justify-center cursor-pointer shrink-0"
                          title="Play now"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>

                        <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/5">
                          <ArtworkImage src={song.artwork} alt={song.title} className="w-full h-full object-cover" />
                          {isCurrent && playback.isPlaying && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="flex items-end gap-0.5 h-3">
                                <span className="w-0.5 bg-[#FF0000] animate-[pulse_0.6s_ease-in-out_infinite] h-full" />
                                <span className="w-0.5 bg-[#FF0000] animate-[pulse_0.4s_ease-in-out_infinite] h-2" />
                                <span className="w-0.5 bg-[#FF0000] animate-[pulse_0.8s_ease-in-out_infinite] h-2.5" />
                              </div>
                            </div>
                          )}
                        </div>

                        <div
                          className="min-w-0 pr-2 cursor-pointer flex-1"
                          onClick={() => audioManager.playSongAtIndex(idx)}
                        >
                          <p className={`text-xs font-semibold truncate transition ${
                            isCurrent ? 'text-[#FF4D4D] font-bold' : 'text-white group-hover:text-[#FF4D4D]'
                          }`}>
                            {song.title}
                          </p>
                          <p className="text-[10px] text-[#888888] truncate">{song.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-mono text-[#717171]">{formatTime(song.duration)}</span>
                        {!isCurrent && (
                          <button
                            onClick={() => audioManager.removeFromQueue(idx)}
                            className="p-1 text-[#555555] hover:text-red-400 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            title="Remove from queue"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: RELATED (Recommendations based on current song)
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'related' && (
          <div className="space-y-4">
            {/* Artist Card */}
            {currentSong && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-[#211B1B] to-[#1A1A1A] border border-[#332525] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 ring-2 ring-[#FF0000]/30 shadow-md">
                    <ArtworkImage src={currentSong.artwork} alt={currentSong.artist} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{currentSong.artist}</h4>
                  </div>
                </div>
                <button
                  onClick={handleStartRadioFromCurrent}
                  className="px-3 py-1.5 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Radio className="w-3 h-3" />
                  <span>Artist Station</span>
                </button>
              </div>
            )}

            {/* Recommendations Shelf */}
            <div className="space-y-2">
              <div className="flex items-center px-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-bold text-white">You Might Also Like</span>
                </div>
              </div>

              {loadingRelated ? (
                <div className="space-y-2 py-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-[#1C1C1C] animate-pulse">
                      <div className="w-10 h-10 rounded-lg bg-[#272727]" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3 w-3/4 bg-[#272727] rounded" />
                        <div className="h-2.5 w-1/2 bg-[#272727] rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : relatedTracks.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#717171]">
                  No related recommendations found.
                </div>
              ) : (
                <div className="space-y-1">
                  {relatedTracks.map((song) => (
                    <div
                      key={song.id}
                      className="group flex items-center justify-between p-2 rounded-xl hover:bg-[#222222] transition border border-transparent hover:border-[#2C2C2C]"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 ring-1 ring-white/5">
                          <ArtworkImage src={song.artwork} alt={song.title} className="w-full h-full object-cover" />
                          <button
                            onClick={() => audioManager.playSong(song, [song, ...relatedTracks])}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition cursor-pointer"
                          >
                            <Play className="w-4 h-4 fill-current text-[#FF0000]" />
                          </button>
                        </div>
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="text-xs font-semibold text-white truncate group-hover:text-[#FF4D4D] transition">
                            {song.title}
                          </p>
                          <p className="text-[10px] text-[#888888] truncate">{song.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        <button
                          onClick={() => audioManager.playNext(song)}
                          className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-[#252525] hover:bg-[#FF0000] text-[#AAAAAA] hover:text-white text-[10px] font-semibold transition cursor-pointer"
                          title="Play right after current song"
                        >
                          <CornerDownRight className="w-3 h-3 text-[#AAAAAA]" />
                          <span>Next</span>
                        </button>
                        <button
                          onClick={() => audioManager.addToQueue(song)}
                          className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-[#252525] hover:bg-emerald-600 text-[#AAAAAA] hover:text-white text-[10px] font-semibold transition cursor-pointer"
                          title="Add to queue"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Queue</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
