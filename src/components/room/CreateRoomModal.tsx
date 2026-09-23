import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { RoomPrivacy, PlaybackMode, Song } from '../../types';
import { audioManager } from '../../services/audio/AudioManager';
import { YouTubeDataApiService } from '../../services/audio/YouTubeDataApi';
import { ArtworkImage } from '../../utils/artwork';
import {
  X,
  Sparkles,
  Upload,
  Loader2,
  Plus,
  Check,
  Radio,
  Search,
  Music2,
  Trash2,
  ListMusic
} from 'lucide-react';
import { StorageService } from '../../services/storage/StorageService';

const COVER_PRESETS = [
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&fit=crop',
  'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&fit=crop',
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&fit=crop',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&fit=crop',
  'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&fit=crop',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&fit=crop'
];

const SUGGESTED_TAGS = [
  'Chill',
  'Study & Focus',
  'Late Night',
  'Acoustic',
  'Lofi Beats',
  'Synthwave',
  'Upbeat',
  'Party',
  'Gaming',
  'Indie Folk',
  'Bollywood',
  'Electronic'
];

interface CreateRoomModalProps {
  onRoomCreated?: (roomId: string) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onRoomCreated }) => {
  const [state, store] = useStore();
  const currentPlayingSong = audioManager.getState().currentSong;

  // Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<RoomPrivacy>('public');
  const [maxMembers, setMaxMembers] = useState<number>(24);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('dj_controlled');
  const [selectedCover, setSelectedCover] = useState(
    currentPlayingSong?.artwork || COVER_PRESETS[0]
  );
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

  // Starting Queue & Search
  const [startingQueue, setStartingQueue] = useState<Song[]>(() => 
    currentPlayingSong ? [currentPlayingSong] : []
  );
  const [seedWithPlayingSong, setSeedWithPlayingSong] = useState(!!currentPlayingSong);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [songSearchResults, setSongSearchResults] = useState<Song[]>([]);
  const [isSearchingSongs, setIsSearchingSongs] = useState(false);
  const [addedSongIds, setAddedSongIds] = useState<Record<string, boolean>>({});
  const searchDebounceRef = useRef<any>(null);

  // Freeform tags
  const [roomTags, setRoomTags] = useState<string[]>(['Chill']);
  const [customTagInput, setCustomTagInput] = useState('');

  const [isCreating, setIsCreating] = useState(false);

  // Auto-populate default name when currently playing song exists
  useEffect(() => {
    if (currentPlayingSong && !name) {
      setName(`${currentPlayingSong.artist} & Friends Room`);
      setSelectedCover(currentPlayingSong.artwork);
    }
  }, [currentPlayingSong]);

  // Synchronize seed song toggle
  useEffect(() => {
    if (!currentPlayingSong) return;
    if (seedWithPlayingSong) {
      setStartingQueue((prev) => 
        prev.some((s) => s.id === currentPlayingSong.id) ? prev : [currentPlayingSong, ...prev]
      );
    } else {
      setStartingQueue((prev) => prev.filter((s) => s.id !== currentPlayingSong.id));
    }
  }, [seedWithPlayingSong]);

  // YouTube live search for adding starting tracks
  useEffect(() => {
    const trimmed = songSearchQuery.trim();
    if (!trimmed) {
      setSongSearchResults([]);
      setIsSearchingSongs(false);
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearchingSongs(true);
      try {
        const results = await YouTubeDataApiService.searchVideos(trimmed, 8);
        setSongSearchResults(results);
      } catch (err) {
        console.warn('YouTube search error in room creation:', err);
      } finally {
        setIsSearchingSongs(false);
      }
    }, 380);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [songSearchQuery]);

  if (!state.isCreateRoomModalOpen) return null;

  const handleAddSongToQueue = (song: Song) => {
    if (startingQueue.some((s) => s.id === song.id)) return;
    setStartingQueue((prev) => [...prev, song]);
    // Auto-update cover to first song if still using preset
    if (startingQueue.length === 0 && COVER_PRESETS.includes(selectedCover)) {
      setSelectedCover(song.artwork);
    }
    setAddedSongIds((prev) => ({ ...prev, [song.id]: true }));
    setTimeout(() => {
      setAddedSongIds((prev) => ({ ...prev, [song.id]: false }));
    }, 2000);
  };

  const handleRemoveSongFromQueue = (songId: string) => {
    setStartingQueue((prev) => prev.filter((s) => s.id !== songId));
    if (currentPlayingSong && songId === currentPlayingSong.id) {
      setSeedWithPlayingSong(false);
    }
  };

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim().replace(/^#/, '');
    if (!clean || roomTags.includes(clean)) return;
    setRoomTags((prev) => [...prev, clean]);
    setCustomTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setRoomTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCover(true);
      const url = await StorageService.uploadImage(file, 'covers');
      setSelectedCover(url);
    } catch (err) {
      console.error('Failed to upload cover:', err);
    } finally {
      setIsUploadingCover(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);

    try {
      const seedSong = startingQueue.length > 0 ? startingQueue[0] : null;

      const newRoom = store.createRoom({
        name: name.trim(),
        description: description.trim() || 'Welcome! Listen to synced music together with friends.',
        privacy,
        maxMembers,
        playbackMode,
        coverUrl: selectedCover,
        tags: roomTags.length > 0 ? roomTags : ['Live', 'Chill'],
        seedSong,
        initialQueue: startingQueue,
      });

      store.setState({ isCreateRoomModalOpen: false });
      onRoomCreated?.(newRoom.id);
    } catch (err) {
      console.error('Failed to create room:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in select-none pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-[#1A1A1E] border border-[#2F2F35] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 sm:px-6 border-b border-[#2B2B30] flex items-center justify-between bg-[#141416] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FF0000]/20 border border-[#FF0000]/40 flex items-center justify-center text-[#FF0000]">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">Create Listening Room</h2>
              <p className="text-[11px] text-[#AAAAAA]">Synced YouTube playback, live chat, and audio sessions with friends</p>
            </div>
          </div>
          <button
            onClick={() => store.setState({ isCreateRoomModalOpen: false })}
            className="p-1.5 rounded-lg text-[#AAAAAA] hover:text-white hover:bg-[#25252A] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="create-room-form" onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* 1. ROOM IDENTITY */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                Room Name <span className="text-[#FF0000]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Late Night Synthwave, Lofi Study Lounge, Bollywood Acoustic"
                className="w-full px-4 py-2.5 rounded-xl bg-[#121214] border border-[#2D2D33] text-sm text-white placeholder-neutral-500 focus:border-[#FF0000] focus:outline-none transition font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                Room Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are we listening to? Drop track requests in chat and chill..."
                className="w-full px-4 py-2 rounded-xl bg-[#121214] border border-[#2D2D33] text-xs text-white placeholder-neutral-500 focus:border-[#FF0000] focus:outline-none transition resize-none"
              />
            </div>
          </div>

          {/* 2. DIRECT MUSIC QUEUE BUILDER */}
          <div className="space-y-3 bg-[#131316] p-4 rounded-2xl border border-[#28282E]">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Music2 className="w-4 h-4 text-[#FF4D4D]" />
                  <span>Starting Music & Queue</span>
                </label>
                <p className="text-[11px] text-[#AAAAAA] mt-0.5">
                  Pick the exact YouTube songs to launch the room with
                </p>
              </div>

              {startingQueue.length > 0 && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-red-950/40 text-red-400 border border-red-500/30">
                  {startingQueue.length} {startingQueue.length === 1 ? 'Track' : 'Tracks'}
                </span>
              )}
            </div>

            {/* Quick Toggle: Current playing track */}
            {currentPlayingSong && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#1A1A1E] border border-white/5">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                    <ArtworkImage song={currentPlayingSong} alt={currentPlayingSong.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">Start with currently playing song</p>
                    <p className="text-[10px] text-[#AAAAAA] truncate">{currentPlayingSong.title} • {currentPlayingSong.artist}</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={seedWithPlayingSong}
                    onChange={(e) => setSeedWithPlayingSong(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#333338] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF0000]"></div>
                </label>
              </div>
            )}

            {/* Search YouTube for Starting Tracks */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={songSearchQuery}
                onChange={(e) => setSongSearchQuery(e.target.value)}
                placeholder="Search any YouTube song, artist, or paste a link..."
                className="w-full pl-9 pr-9 py-2 rounded-xl bg-[#1C1C20] border border-[#2F2F36] text-xs text-white placeholder-neutral-500 focus:border-[#FF0000] focus:outline-none transition"
              />
              {isSearchingSongs ? (
                <Loader2 className="w-4 h-4 text-red-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
              ) : songSearchQuery ? (
                <button
                  type="button"
                  onClick={() => setSongSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>

            {/* Live Search Results */}
            {songSearchResults.length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 rounded-xl bg-[#18181C] border border-[#2B2B30] custom-scrollbar">
                <p className="text-[10px] font-bold text-[#888888] uppercase tracking-wider px-1">
                  Search Results ({songSearchResults.length})
                </p>
                {songSearchResults.map((song) => {
                  const isAdded = startingQueue.some((s) => s.id === song.id);
                  const isJustAdded = addedSongIds[song.id];

                  return (
                    <div
                      key={song.id}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-[#202024] hover:bg-[#28282E] transition border border-transparent hover:border-white/10"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden min-w-0 flex-1 pr-2">
                        <div className="w-8 h-8 rounded-md overflow-hidden shrink-0 bg-neutral-900">
                          <ArtworkImage song={song} alt={song.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{song.title}</p>
                          <p className="text-[10px] text-[#AAAAAA] truncate">{song.artist}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddSongToQueue(song)}
                        disabled={isAdded}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-white/10 hover:bg-[#FF0000] text-white'
                        }`}
                      >
                        {isAdded || isJustAdded ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Queued</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Starting Queue Preview */}
            {startingQueue.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                  Initial Room Queue ({startingQueue.length})
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {startingQueue.map((song, idx) => (
                    <div
                      key={`${song.id}-${idx}`}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#1C1C20] border border-[#2D2D33]"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden min-w-0 flex-1 pr-2">
                        <span className="text-xs font-mono font-bold text-red-400 w-4 text-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-neutral-900">
                          <ArtworkImage song={song} alt={song.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{song.title}</p>
                          <p className="text-[10px] text-[#AAAAAA] truncate">{song.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {idx === 0 && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full border border-red-500/30">
                            Plays First
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveSongFromQueue(song.id)}
                          className="p-1 rounded text-[#777777] hover:text-red-400 hover:bg-white/5 transition cursor-pointer"
                          title="Remove track"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. FREEFORM VIBES & TAGS */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-white uppercase tracking-wider">
              Room Vibe & Tags
            </label>

            {/* Tag Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    handleAddTag(customTagInput);
                  }
                }}
                placeholder="Type any tag (e.g. Synthwave, Lofi, Gaming, Chill, Metal) and press Enter..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#121214] border border-[#2D2D33] text-xs text-white placeholder-neutral-500 focus:border-[#FF0000] focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => handleAddTag(customTagInput)}
                disabled={!customTagInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-[#28282E] hover:bg-[#34343C] text-white text-xs font-bold transition disabled:opacity-40 cursor-pointer"
              >
                Add Tag
              </button>
            </div>

            {/* Active Tags */}
            {roomTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {roomTags.map((tag) => (
                  <span
                    key={tag}
                    onClick={() => handleRemoveTag(tag)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/40 text-red-300 border border-red-500/30 text-xs font-semibold cursor-pointer hover:bg-red-950/70 transition"
                    title="Click to remove"
                  >
                    <span>#{tag}</span>
                    <X className="w-3 h-3 text-red-400" />
                  </span>
                ))}
              </div>
            )}

            {/* Quick Suggestion Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              <span className="text-[10px] text-[#777777] shrink-0 mr-1">Suggestions:</span>
              {SUGGESTED_TAGS.map((sTag) => {
                const isSelected = roomTags.includes(sTag);
                return (
                  <button
                    key={sTag}
                    type="button"
                    onClick={() => (isSelected ? handleRemoveTag(sTag) : handleAddTag(sTag))}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#FF0000] text-white font-bold'
                        : 'bg-[#18181C] hover:bg-[#25252A] text-[#AAAAAA] hover:text-white border border-[#2A2A30]'
                    }`}
                  >
                    {isSelected ? `✓ ${sTag}` : `+ ${sTag}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. PRIVACY & AUX CONTROLS */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                Room Privacy
              </label>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value as RoomPrivacy)}
                className="w-full px-3 py-2 rounded-xl bg-[#121214] border border-[#2D2D33] text-xs font-semibold text-white focus:border-[#FF0000] focus:outline-none cursor-pointer"
              >
                <option value="public">Public (Anyone can join)</option>
                <option value="private">Private (Invite link only)</option>
                <option value="invite_only">Invite Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                Aux / Playback Control
              </label>
              <select
                value={playbackMode}
                onChange={(e) => setPlaybackMode(e.target.value as PlaybackMode)}
                className="w-full px-3 py-2 rounded-xl bg-[#121214] border border-[#2D2D33] text-xs font-semibold text-white focus:border-[#FF0000] focus:outline-none cursor-pointer"
              >
                <option value="dj_controlled">Designated DJs</option>
                <option value="host_controlled">Host Only</option>
                <option value="community_voting">Community Voting</option>
              </select>
            </div>
          </div>

          {/* 5. COVER ARTWORK */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-white uppercase tracking-wider">
                Room Cover Artwork
              </label>
              <button
                type="button"
                onClick={() => coverFileInputRef.current?.click()}
                disabled={isUploadingCover}
                className="flex items-center gap-1.5 text-xs text-[#FF4D4D] hover:text-white font-semibold transition cursor-pointer"
              >
                {isUploadingCover ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Custom Cover</span>
                  </>
                )}
              </button>
              <input
                type="file"
                ref={coverFileInputRef}
                onChange={handleFileUpload}
                accept="image/png, image/jpeg, image/webp, image/gif"
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-6 gap-2">
              {COVER_PRESETS.map((url, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedCover(url)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                    selectedCover === url
                      ? 'border-[#FF0000] scale-105 shadow-md shadow-red-900/40 ring-2 ring-[#FF0000]/50'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="preset" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Sticky Launch Room Footer */}
        <div className="p-4 sm:p-5 border-t border-[#2B2B30] bg-[#141416] shrink-0">
          <button
            type="submit"
            form="create-room-form"
            disabled={isCreating || !name.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-[#FF0000] to-rose-600 hover:from-[#CC0000] hover:to-rose-700 text-white font-bold rounded-2xl transition shadow-[0_0_25px_rgba(255,0,0,0.4)] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 text-sm active:scale-98"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Launching Listening Room...</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4" />
                <span>Start Listening Room ({startingQueue.length} {startingQueue.length === 1 ? 'Track' : 'Tracks'})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
