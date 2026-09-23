import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { audioManager } from '../services/audio/AudioManager';
import { YouTubeDataApiService, YouTubePlaylistResult } from '../services/audio/YouTubeDataApi';
import { 
  DAILY_MIX_CONFIGS, 
  DailyMixConfig, 
  SmartPlaylistEngine 
} from '../services/audio/SmartPlaylistEngine';
import { SmartPlaylistModal } from '../components/playlist/SmartPlaylistModal';
import { StorageService } from '../services/storage/StorageService';
import { DEFAULT_PLAYLISTS } from '../services/audio/DefaultMusicProvider';
import { ListMusic, Plus, Play, Users, FolderDown, Loader2, Check, ExternalLink, Sparkles, Wand2, Trash2, Upload, Image as ImageIcon, Compass } from 'lucide-react';
import { Playlist, Song } from '../types';
import { ResponsiveAdBanner } from '../components/ads/AdSlot';

interface PlaylistsPageProps {
  onNavigate: (path: string) => void;
}

export const PlaylistsPage: React.FC<PlaylistsPageProps> = ({ onNavigate }) => {
  const [state, store] = useStore();
  const [activeTab, setActiveTab] = useState<'my' | 'dailymixes' | 'curated' | 'youtube'>('my');
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSmartModalOpen, setIsSmartModalOpen] = useState(false);
  const [loadingMixId, setLoadingMixId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [importUrl, setImportUrl] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const curatedYtPlaylists = YouTubeDataApiService.getCuratedPlaylists();

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCover(true);
      const url = await StorageService.uploadImage(file, 'playlists');
      setCoverUrl(url);
      showNotification('Cover image uploaded!');
    } catch (err) {
      console.error('Failed to upload cover:', err);
      showNotification('Failed to upload cover.');
    } finally {
      setIsUploadingCover(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const pl = store.createPlaylist(name.trim(), desc.trim(), coverUrl || undefined);
    setIsCreating(false);
    setName('');
    setDesc('');
    setCoverUrl('');
    onNavigate(`/playlist/${pl.id}`);
  };

  const handleImportYouTubePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    const playlistId = YouTubeDataApiService.extractPlaylistId(importUrl);
    if (!playlistId) {
      showNotification('Invalid YouTube playlist URL or ID. Make sure it contains "list="');
      return;
    }

    try {
      setImportLoading(true);
      const tracks = await YouTubeDataApiService.getPlaylistVideos(playlistId, 50);
      if (tracks.length === 0) {
        showNotification('No videos could be retrieved from this playlist.');
        return;
      }

      const newPl = store.createPlaylistWithSongs(
        `YouTube Playlist (${tracks.length} tracks)`,
        `Imported from YouTube: ${playlistId}`,
        tracks[0]?.artwork || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&fit=crop',
        tracks
      );

      setIsImporting(false);
      setImportUrl('');
      showNotification(`Imported ${tracks.length} tracks successfully!`);
      onNavigate(`/playlist/${newPl.id}`);
    } catch {
      showNotification('Error importing playlist. Please check the URL.');
    } finally {
      setImportLoading(false);
    }
  };

  const handlePlayCurated = async (pl: YouTubePlaylistResult) => {
    try {
      setImportLoading(true);
      const tracks = await YouTubeDataApiService.getPlaylistVideos(pl.id, 40);
      if (tracks.length > 0) {
        audioManager.playSong(tracks[0], tracks);
        showNotification(`Playing YouTube Playlist: "${pl.title}" (${tracks.length} tracks)`);
      }
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportCurated = async (pl: YouTubePlaylistResult) => {
    try {
      setImportLoading(true);
      const tracks = await YouTubeDataApiService.getPlaylistVideos(pl.id, 40);
      if (tracks.length > 0) {
        store.createPlaylistWithSongs(
          pl.title,
          pl.description || `Curated YouTube Music from ${pl.channelTitle}`,
          pl.thumbnail,
          tracks
        );
        showNotification(`Imported "${pl.title}" into library!`);
      }
    } finally {
      setImportLoading(false);
    }
  };

  const handlePlayDailyMix = async (mix: DailyMixConfig) => {
    try {
      setLoadingMixId(mix.id);
      const tracks = await SmartPlaylistEngine.getDailyMixTracks(mix.id);
      if (tracks.length > 0) {
        audioManager.playSong(tracks[0], tracks);
        showNotification(`Playing ${mix.title}: ${mix.vibe} (${tracks.length} full tracks)`);
      }
    } finally {
      setLoadingMixId(null);
    }
  };

  const handleImportDailyMix = async (mix: DailyMixConfig) => {
    try {
      setLoadingMixId(mix.id);
      const tracks = await SmartPlaylistEngine.getDailyMixTracks(mix.id);
      if (tracks.length > 0) {
        store.createPlaylistWithSongs(
          `${mix.title} (${mix.vibe})`,
          `Spotify-style dynamic mix: ${mix.subtitle}`,
          mix.coverImage,
          tracks
        );
        showNotification(`Saved ${mix.title} to your library!`);
      }
    } finally {
      setLoadingMixId(null);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 select-none">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#212121] border border-[#272727] text-white text-xs font-semibold shadow-2xl animate-fade-in">
          <Check className="w-4 h-4 text-[#FF0000]" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ListMusic className="w-6 h-6 text-[#FF0000]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Playlists & Library
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#AAAAAA] mt-1">
            Build personal mixes, auto-generate Spotify-style playlists, or stream regional YouTube music.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSmartModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF0000] to-rose-600 hover:from-[#CC0000] hover:to-rose-700 text-white font-bold text-xs transition shadow-lg shadow-red-900/30 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Auto-Generate Mix (Spotify Style)</span>
          </button>

          <button
            onClick={() => {
              setIsImporting(true);
              setIsCreating(false);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#212121] hover:bg-[#272727] border border-[#272727] text-white font-semibold text-xs transition cursor-pointer"
          >
            <FolderDown className="w-4 h-4 text-[#FF0000]" />
            <span>Import YouTube</span>
          </button>

          <button
            onClick={() => {
              setIsCreating(true);
              setIsImporting(false);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#272727] hover:bg-[#383838] border border-[#383838] text-white font-semibold text-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Playlist</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#272727] pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
            activeTab === 'my'
              ? 'bg-[#F1F1F1] text-[#0F0F0F] font-bold shadow-md'
              : 'bg-[#272727] text-[#AAAAAA] hover:text-white hover:bg-[#383838]'
          }`}
        >
          My Library ({state.playlists.length})
        </button>

        <button
          onClick={() => setActiveTab('dailymixes')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
            activeTab === 'dailymixes'
              ? 'bg-[#FF0000] text-white font-bold shadow-md'
              : 'bg-[#272727] text-[#AAAAAA] hover:text-white hover:bg-[#383838]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Made For You: Daily Mixes (6)</span>
        </button>

        <button
          onClick={() => setActiveTab('curated')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
            activeTab === 'curated'
              ? 'bg-[#F1F1F1] text-[#0F0F0F] font-bold shadow-md'
              : 'bg-[#272727] text-[#AAAAAA] hover:text-white hover:bg-[#383838]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Curated Collections ({DEFAULT_PLAYLISTS.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('youtube')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
            activeTab === 'youtube'
              ? 'bg-[#F1F1F1] text-[#0F0F0F] font-bold shadow-md'
              : 'bg-[#272727] text-[#AAAAAA] hover:text-white hover:bg-[#383838]'
          }`}
        >
          YouTube Curated Playlists ({curatedYtPlaylists.length})
        </button>
      </div>

      {/* ── SPONSORED BANNER (NON-INTRUSIVE) ── */}
      <ResponsiveAdBanner className="my-4" />

      {/* Import YouTube Playlist Modal */}
      {isImporting && (
        <div className="p-5 rounded-2xl bg-[#212121] border border-[#272727] shadow-xl max-w-lg animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FolderDown className="w-4 h-4 text-[#FF0000]" />
              <span>Import Real YouTube Playlist</span>
            </h3>
            <span className="text-[10px] text-[#FF0000] font-mono font-bold bg-[#FF0000]/10 px-2 py-0.5 rounded">
              v3 API
            </span>
          </div>
          <p className="text-xs text-[#AAAAAA]">
            Paste any YouTube playlist link or playlist ID (e.g., https://www.youtube.com/playlist?list=PL...). We will extract all real tracks and sync them to your library.
          </p>
          <form onSubmit={handleImportYouTubePlaylist} className="space-y-3">
            <input
              type="text"
              required
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              placeholder="Paste YouTube playlist URL or ID"
              className="w-full px-3 py-2.5 rounded-xl bg-[#0F0F0F] border border-[#272727] text-xs text-white placeholder-[#717171] focus:border-[#FF0000] focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={importLoading}
                className="px-4 py-2 bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {importLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{importLoading ? 'Fetching YouTube Tracks...' : 'Import Playlist'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsImporting(false)}
                className="px-4 py-2 bg-[#272727] text-[#AAAAAA] hover:text-white text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Playlist Modal */}
      {isCreating && (
        <div className="p-5 rounded-2xl bg-[#212121] border border-[#272727] shadow-xl max-w-md animate-fade-in space-y-4">
          <h3 className="text-sm font-bold text-white">Create New Playlist</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Playlist name"
              className="w-full px-3 py-2 rounded-xl bg-[#0F0F0F] border border-[#272727] text-xs text-white placeholder-[#717171] focus:border-[#FF0000] focus:outline-none"
            />
            <textarea
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-3 py-2 rounded-xl bg-[#0F0F0F] border border-[#272727] text-xs text-white placeholder-[#717171] focus:border-[#FF0000] focus:outline-none resize-none"
            />

            {/* Custom Cover Upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-[#AAAAAA] uppercase tracking-wider">
                  Playlist Cover (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => coverFileInputRef.current?.click()}
                  disabled={isUploadingCover}
                  className="flex items-center gap-1.5 text-xs text-[#FF0000] hover:text-[#FF4444] font-medium transition cursor-pointer"
                >
                  {isUploadingCover ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload from Device</span>
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

              {coverUrl && (
                <div className="flex items-center gap-3 p-2 rounded-xl bg-[#0F0F0F] border border-[#272727]">
                  <img src={coverUrl} alt="Cover preview" className="w-10 h-10 rounded-lg object-cover" />
                  <span className="text-xs text-[#AAAAAA] truncate flex-1">Custom cover uploaded</span>
                  <button
                    type="button"
                    onClick={() => setCoverUrl('')}
                    className="text-xs text-[#FF0000] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isUploadingCover}
                className="px-4 py-2 bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setCoverUrl('');
                }}
                className="px-4 py-2 bg-[#272727] text-[#AAAAAA] hover:text-white text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Active Tab: My Library */}
      {activeTab === 'my' && (
        <>
          {state.playlists.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl bg-[#141416] border border-[#232328] space-y-4 max-w-md mx-auto my-6">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#FF4D4D]">
                <ListMusic className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Your Library is Clean</h3>
                <p className="text-xs text-[#888888] max-w-xs mx-auto">
                  Create custom playlists or import existing ones from YouTube to make this space your own.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition shadow-md cursor-pointer"
                >
                  Create Playlist
                </button>
                <button
                  onClick={() => setIsImporting(true)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Import from YouTube
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {state.playlists.map((pl: Playlist) => (
                <div
                  key={pl.id}
                  onClick={() => onNavigate(`/playlist/${pl.id}`)}
                  className="group cursor-pointer rounded-2xl bg-[#212121] hover:bg-[#272727] border border-[#272727] hover:border-[#383838] p-3.5 transition duration-300 shadow-md flex flex-col justify-between"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                    <img
                      src={pl.coverUrl}
                      alt={pl.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <div className="w-10 h-10 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>

                    {pl.isCollaborative && (
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-gray-200 text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" />
                        <span>Collaborative</span>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Delete playlist "${pl.name}"?`)) {
                          store.deletePlaylist(pl.id);
                          showNotification(`Deleted "${pl.name}"`);
                        }
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 hover:bg-red-600 text-gray-300 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10 cursor-pointer shadow-md"
                      title="Delete playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#FF4D4D] transition">
                      {pl.name}
                    </h3>
                    <p className="text-[11px] text-[#AAAAAA] truncate mt-0.5">by {pl.ownerName}</p>
                    <p className="text-[10px] text-[#717171] mt-1">{pl.songsCount} songs</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Active Tab: Curated Collections (Official Genres) */}
      {activeTab === 'curated' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
          {DEFAULT_PLAYLISTS.map((pl: Playlist) => (
            <div
              key={pl.id}
              onClick={() => onNavigate(`/playlist/${pl.id}`)}
              className="group cursor-pointer rounded-2xl bg-[#18181A] hover:bg-[#222226] border border-[#27272A] hover:border-[#3E3E44] p-3.5 transition duration-300 shadow-md flex flex-col justify-between"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-neutral-900 border border-white/5">
                <img
                  src={pl.coverUrl}
                  alt={pl.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <div className="w-10 h-10 rounded-full bg-[#FF0000] text-white flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>

                <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-sm text-red-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                  <span>Curated Collection</span>
                </div>
              </div>

              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#FF4D4D] transition">
                  {pl.name}
                </h3>
                <p className="text-[11px] text-[#AAAAAA] line-clamp-1 mt-0.5">{pl.description}</p>
                <p className="text-[10px] text-[#717171] mt-1">{pl.songsCount} songs</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Tab: Made For You: Daily Mixes (Spotify Style) */}
      {activeTab === 'dailymixes' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl bg-gradient-to-r from-[#212121] to-[#1B1B1B] border border-[#272727]">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF0000]" />
                <span>Made For You: Algorithmic Daily Mixes</span>
              </h3>
              <p className="text-xs text-[#AAAAAA] mt-0.5">
                Dynamic combinations of your favorite artists and genres, updated daily • Zero Shorts guarantee
              </p>
            </div>

            <button
              onClick={() => setIsSmartModalOpen(true)}
              className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Generate New Mix</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DAILY_MIX_CONFIGS.map((mix) => {
              const isLoading = loadingMixId === mix.id;
              return (
                <div
                  key={mix.id}
                  className="group rounded-2xl bg-[#212121] hover:bg-[#272727] border border-[#272727] hover:border-[#383838] p-4 transition flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-neutral-900">
                      <img
                        src={mix.coverImage}
                        alt={mix.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10 text-[10px] font-bold text-[#FF4D4D]">
                        {mix.vibe}
                      </div>

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <button
                          onClick={() => handlePlayDailyMix(mix)}
                          disabled={isLoading}
                          className="w-11 h-11 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white flex items-center justify-center shadow-xl cursor-pointer"
                        >
                          {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 mb-3">
                      <h4 className="text-sm font-black text-white">{mix.title}</h4>
                      <p className="text-[11px] text-[#AAAAAA] line-clamp-2 leading-relaxed">
                        {mix.subtitle}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {mix.artists.map((artist) => (
                          <span
                            key={artist}
                            className="text-[9px] px-2 py-0.5 rounded bg-[#181818] border border-[#272727] text-[#AAAAAA]"
                          >
                            {artist}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-[#272727]">
                    <button
                      onClick={() => handlePlayDailyMix(mix)}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition cursor-pointer"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      )}
                      <span>Play Daily Mix</span>
                    </button>
                    <button
                      onClick={() => handleImportDailyMix(mix)}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#272727] hover:bg-[#383838] text-white text-xs font-semibold border border-[#383838] transition cursor-pointer"
                      title="Save to My Library"
                    >
                      <FolderDown className="w-3.5 h-3.5 text-[#FF0000]" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Tab: Curated Real YouTube Playlists */}
      {activeTab === 'youtube' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {curatedYtPlaylists.map((pl) => (
            <div
              key={pl.id}
              className="group rounded-2xl bg-[#212121] hover:bg-[#272727] border border-[#272727] hover:border-[#383838] p-4 transition flex flex-col justify-between shadow-lg"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                <img src={pl.thumbnail} alt={pl.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <button
                    onClick={() => handlePlayCurated(pl)}
                    className="w-10 h-10 rounded-full bg-[#FF0000] hover:bg-[#CC0000] text-white flex items-center justify-center shadow-lg cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 mb-3">
                <h4 className="text-xs font-bold text-white line-clamp-1">{pl.title}</h4>
                <p className="text-[11px] text-[#AAAAAA] line-clamp-2 leading-relaxed">{pl.description}</p>
                <span className="text-[10px] text-[#717171] font-mono block">Curated by {pl.channelTitle}</span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#272727]">
                <button
                  onClick={() => handlePlayCurated(pl)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#FF0000] hover:bg-[#CC0000] text-white text-[11px] font-semibold transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play Stream</span>
                </button>
                <button
                  onClick={() => handleImportCurated(pl)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#272727] hover:bg-[#383838] text-white text-[11px] font-semibold border border-[#383838] transition cursor-pointer"
                >
                  <FolderDown className="w-3.5 h-3.5 text-[#FF0000]" />
                  <span>Save to Library</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Smart Playlist Modal */}
      <SmartPlaylistModal
        isOpen={isSmartModalOpen}
        onClose={() => setIsSmartModalOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
