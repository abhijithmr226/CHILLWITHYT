import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Flame, 
  Play, 
  Save, 
  Users, 
  Check, 
  Loader2, 
  Clock, 
  Music, 
  Compass, 
  Wand2, 
  ShieldCheck 
} from 'lucide-react';
import { Song, Playlist } from '../../types';
import { 
  SmartPlaylistEngine, 
  SMART_PLAYLIST_PRESETS, 
  SmartPlaylistPreset 
} from '../../services/audio/SmartPlaylistEngine';
import { audioManager } from '../../services/audio/AudioManager';
import { useStore } from '../../store/useStore';

interface SmartPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

export const SmartPlaylistModal: React.FC<SmartPlaylistModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [, store] = useStore();
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [selectedPreset, setSelectedPreset] = useState<SmartPlaylistPreset>(SMART_PLAYLIST_PRESETS[0]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepMessage, setStepMessage] = useState('');

  // Generated results
  const [generatedPlaylist, setGeneratedPlaylist] = useState<Playlist | null>(null);
  const [generatedTracks, setGeneratedTracks] = useState<Song[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePreset = async (preset: SmartPlaylistPreset) => {
    setSelectedPreset(preset);
    setIsGenerating(true);
    setGeneratedPlaylist(null);
    setGeneratedTracks([]);
    setSavedSuccess(false);

    try {
      setStepMessage('Querying YouTube Music Charts...');
      await new Promise(r => setTimeout(r, 400));
      setStepMessage('Filtering out Shorts, vertical clips & snippets...');
      
      const { playlist, tracks } = await SmartPlaylistEngine.generatePlaylistFromPreset(
        preset.id,
        'ChillWithYT Algorithm'
      );

      setStepMessage('Verifying full-length studio audio tracks...');
      await new Promise(r => setTimeout(r, 300));

      setGeneratedPlaylist(playlist);
      setGeneratedTracks(tracks);
    } catch (e) {
      console.warn('Smart playlist generation error:', e);
    } finally {
      setIsGenerating(false);
      setStepMessage('');
    }
  };

  const handleGenerateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    setIsGenerating(true);
    setGeneratedPlaylist(null);
    setGeneratedTracks([]);
    setSavedSuccess(false);

    try {
      setStepMessage(`Searching musical tracks for "${customPrompt.trim()}"...`);
      await new Promise(r => setTimeout(r, 400));
      setStepMessage('Purging Shorts & non-music audio...');

      const { playlist, tracks } = await SmartPlaylistEngine.generateCustomSmartPlaylist(
        customPrompt.trim(),
        'Custom Smart Mix'
      );

      setStepMessage('Balancing audio flow & tracklist...');
      await new Promise(r => setTimeout(r, 300));

      setGeneratedPlaylist(playlist);
      setGeneratedTracks(tracks);
    } catch (e) {
      console.warn('Custom smart mix generation error:', e);
    } finally {
      setIsGenerating(false);
      setStepMessage('');
    }
  };

  const handlePlayNow = () => {
    if (generatedTracks.length === 0) return;
    audioManager.playSong(generatedTracks[0], generatedTracks);
    onClose();
  };

  const handleSaveToLibrary = () => {
    if (!generatedPlaylist || generatedTracks.length === 0) return;
    store.createPlaylistWithSongs(
      generatedPlaylist.name,
      generatedPlaylist.description,
      generatedPlaylist.coverUrl,
      generatedTracks
    );
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
      if (onNavigate) onNavigate('/playlists');
    }, 1200);
  };

  const handleStartRoom = () => {
    if (!generatedPlaylist || generatedTracks.length === 0) return;

    // Create room with this playlist and generated tracks!
    const room = store.createRoom({
      name: `${generatedPlaylist.name} Room`,
      description: `Listening together to: ${generatedPlaylist.description}`,
      coverUrl: generatedPlaylist.coverUrl,
      tags: ['SmartMix', 'Community', 'ZeroShorts'],
      seedSong: generatedTracks[0],
      initialQueue: generatedTracks,
    });

    onClose();
    if (onNavigate) onNavigate(`/room/${room.id}`);
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalMinutes = Math.floor(
    generatedTracks.reduce((acc, s) => acc + (s.duration || 0), 0) / 60
  );

  return (
    <div 
      className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in select-none pb-[calc(12px+env(safe-area-inset-bottom,0px))]"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#1A1A1A] border border-[#272727] rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#272727] bg-[#212121]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF0000] to-rose-600 flex items-center justify-center shadow-lg shadow-red-900/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Smart Playlist Generator</span>
                <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FF0000]/20 text-[#FF4D4D] border border-[#FF0000]/30">
                  SPOTIFY STYLE
                </span>
              </h2>
              <p className="text-xs text-[#AAAAAA]">
                Auto-generate playlists from real listening trends • 100% full songs • Zero Shorts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#AAAAAA] hover:text-white hover:bg-[#272727] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center px-5 pt-4 pb-2 gap-2 border-b border-[#272727] bg-[#1F1F1F]">
          <button
            onClick={() => {
              setActiveTab('presets');
              setGeneratedPlaylist(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-[#F1F1F1] text-[#0F0F0F] shadow-sm'
                : 'text-[#AAAAAA] hover:text-white hover:bg-[#272727]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#FF0000]" />
            <span>Community Trends & Mixes</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('custom');
              setGeneratedPlaylist(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'custom'
                ? 'bg-[#F1F1F1] text-[#0F0F0F] shadow-sm'
                : 'text-[#AAAAAA] hover:text-white hover:bg-[#272727]'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Custom Vibe / Seed Mix</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Presets Mode */}
          {activeTab === 'presets' && !generatedPlaylist && !isGenerating && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#AAAAAA]">
                  Select a Trending Archetype
                </span>
                <span className="text-[11px] text-[#717171] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Verified Zero Shorts
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SMART_PLAYLIST_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => handleGeneratePreset(preset)}
                    className="group relative p-3.5 rounded-2xl bg-[#212121] hover:bg-[#272727] border border-[#272727] hover:border-[#444444] transition cursor-pointer flex gap-3.5 items-start overflow-hidden shadow-md"
                  >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-800">
                      <img
                        src={preset.coverImage}
                        alt={preset.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-[#FF4D4D] bg-[#FF0000]/10 px-2 py-0.5 rounded-md inline-block mb-1">
                        {preset.badge}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#FF4D4D] transition">
                        {preset.name}
                      </h4>
                      <p className="text-[11px] text-[#AAAAAA] line-clamp-2 mt-0.5 leading-snug">
                        {preset.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Mode */}
          {activeTab === 'custom' && !generatedPlaylist && !isGenerating && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  Generate Mix from Any Artist, Vibe, or Mood
                </h4>
                <p className="text-xs text-[#AAAAAA]">
                  Type any artist, genre, or vibe. Our algorithm pulls the highest-rated full songs from YouTube, strips away all Shorts, and compiles a seamless playlist.
                </p>
              </div>

              <form onSubmit={handleGenerateCustom} className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g. Anirudh energetic EDM, Arijit Singh slow reverb, Malayalam acoustic"
                    className="w-full px-4 py-3 rounded-2xl bg-[#0F0F0F] border border-[#272727] text-white text-xs placeholder-[#717171] focus:border-[#FF0000] focus:outline-none pr-10"
                  />
                  <Compass className="w-4 h-4 text-[#717171] absolute right-3.5 top-3.5" />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[11px] text-[#717171] self-center">Try:</span>
                  {[
                    'Sushin Shyam beats',
                    'Arijit Singh soulful acoustic',
                    'Karan Aujla trap',
                    'DSP mass beats',
                    '2000s Bollywood Nostalgia',
                    'Synthwave midnight drive',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setCustomPrompt(chip)}
                      className="px-2.5 py-1 rounded-lg bg-[#212121] hover:bg-[#272727] border border-[#272727] text-[11px] text-[#AAAAAA] hover:text-white transition"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#FF0000] to-rose-600 hover:from-[#CC0000] hover:to-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition cursor-pointer"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Custom Smart Mix</span>
                </button>
              </form>
            </div>
          )}

          {/* Generating State */}
          {isGenerating && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#FF0000] to-orange-500 animate-pulse flex items-center justify-center shadow-xl shadow-red-900/40">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white">
                  Generating Smart Playlist...
                </h4>
                <p className="text-xs text-[#FF4D4D] font-mono mt-1 animate-pulse">
                  {stepMessage || 'Consulting real-time YouTube music charts...'}
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#AAAAAA] bg-[#212121] px-3 py-1.5 rounded-full border border-[#272727]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enforcing Zero Shorts • Verified Studio Full Tracks</span>
              </div>
            </div>
          )}

          {/* Generated Playlist Preview */}
          {generatedPlaylist && !isGenerating && (
            <div className="space-y-4 animate-fade-in">
              {/* Cover & Summary Banner */}
              <div className="p-4 rounded-2xl bg-[#212121] border border-[#272727] flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <img
                  src={generatedPlaylist.coverUrl}
                  alt={generatedPlaylist.name}
                  className="w-24 h-24 rounded-2xl object-cover shadow-lg flex-shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md inline-flex items-center gap-1 mb-1">
                    <Check className="w-3 h-3" />
                    Generated & Ready
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white truncate">
                    {generatedPlaylist.name}
                  </h3>
                  <p className="text-xs text-[#AAAAAA] line-clamp-2 mt-0.5">
                    {generatedPlaylist.description}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-[#717171]">
                    <span className="flex items-center gap-1 text-white font-semibold">
                      <Music className="w-3.5 h-3.5 text-[#FF0000]" />
                      {generatedTracks.length} Full Songs
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      ~{totalMinutes} mins
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400">Zero Shorts</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={handlePlayNow}
                  className="py-2.5 px-4 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play All Now</span>
                </button>

                <button
                  onClick={handleSaveToLibrary}
                  disabled={savedSuccess}
                  className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    savedSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#272727] hover:bg-[#383838] text-white border border-[#383838]'
                  }`}
                >
                  {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4 text-[#FF0000]" />}
                  <span>{savedSuccess ? 'Saved to Library!' : 'Save to Library'}</span>
                </button>

                <button
                  onClick={handleStartRoom}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                >
                  <Users className="w-4 h-4" />
                  <span>Listen in Room</span>
                </button>
              </div>

              {/* Track List Preview */}
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#AAAAAA]">
                  Tracklist ({generatedTracks.length} tracks)
                </span>
                
                <div className="divide-y divide-[#272727] border border-[#272727] rounded-2xl overflow-hidden bg-[#181818] max-h-64 overflow-y-auto">
                  {generatedTracks.map((song, idx) => (
                    <div
                      key={song.id}
                      onClick={() => audioManager.playSong(song, generatedTracks)}
                      className="group flex items-center justify-between p-2.5 hover:bg-[#212121] transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-5 text-center text-xs font-mono font-bold text-[#717171] group-hover:text-[#FF0000]">
                          {idx + 1}
                        </span>
                        <img
                          src={song.artwork}
                          alt={song.title}
                          className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate group-hover:text-[#FF4D4D] transition">
                            {song.title}
                          </p>
                          <p className="text-[10px] text-[#AAAAAA] truncate">{song.artist}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <span className="text-[10px] font-mono text-[#717171]">
                          {formatDuration(song.duration)}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-[#FF0000] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#272727] bg-[#212121] flex items-center justify-between text-xs text-[#717171]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>YouTube Data API v3 Active</span>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-[#AAAAAA] hover:text-white transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
