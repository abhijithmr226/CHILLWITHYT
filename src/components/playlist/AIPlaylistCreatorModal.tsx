import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { audioManager } from '../../services/audio/AudioManager';
import { SmartAIPlaylistGenerator, GeneratedPlaylistResult } from '../../services/audio/SmartAIPlaylistGenerator';
import { ArtworkImage } from '../../utils/artwork';
import {
  Sparkles,
  X,
  Play,
  Check,
  Wand2,
  BookmarkPlus,
  Loader2,
  Music,
  ArrowRight,
  Compass,
  Flame,
  Zap,
  Moon,
  Disc3,
  Coffee,
  Headphones
} from 'lucide-react';

interface AIPlaylistCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

const PRESET_PROMPTS = [
  { text: 'Late night rainy drive in Kochi', icon: Compass },
  { text: 'High energy workout Tollywood & DSP', icon: Flame },
  { text: 'Rockstar Anirudh & ARR Kollywood mix', icon: Zap },
  { text: 'Soulful 90s Bollywood & Arijit Singh', icon: Moon },
  { text: 'Heavy bass Punjabi trap & Diljit', icon: Disc3 },
  { text: 'Cozy coffee shop acoustic chill', icon: Coffee },
  { text: '24/7 Lofi beats to code and relax', icon: Headphones },
];

export const AIPlaylistCreatorModal: React.FC<AIPlaylistCreatorModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [, store] = useStore();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedPlaylistResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = customPrompt || prompt;
    if (!textToUse.trim()) return;

    setIsGenerating(true);
    setResult(null);
    setIsSaved(false);

    try {
      const generated = await SmartAIPlaylistGenerator.generateFromPrompt(textToUse);
      setResult(generated);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndPlay = () => {
    if (!result || result.songs.length === 0) return;

    // Save to user library
    const newPl = store.createPlaylistWithSongs(
      result.title,
      result.description,
      result.coverUrl,
      result.songs
    );

    setIsSaved(true);

    // Start playing immediately
    audioManager.playSong(result.songs[0], result.songs);

    setTimeout(() => {
      onClose();
      if (onNavigate) onNavigate(`/playlist/${newPl.id}`);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div
        className="w-full max-w-xl rounded-3xl bg-[#1A1A1C] border border-[#2E2E32] shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center shadow-lg">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>AI Mix Studio</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-mono font-bold">
                  Next-Gen
                </span>
              </h2>
              <p className="text-xs text-[#AAAAAA]">Type any vibe, scene, language, or memory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar">
          {/* Prompt Input Box */}
          <div className="space-y-2">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                placeholder="e.g. Late night drive in Kerala with chill Sushin Shyam melodies..."
                className="w-full px-4 py-3 rounded-2xl bg-[#141416] border border-[#2E2E32] text-sm text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none transition resize-none shadow-inner"
              />
            </div>

            {/* Quick Inspiration Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              {PRESET_PROMPTS.map((p) => {
                const IconComp = p.icon;
                return (
                  <button
                    key={p.text}
                    onClick={() => {
                      setPrompt(p.text);
                      handleGenerate(p.text);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#212124] hover:bg-[#2A2A2E] border border-white/5 hover:border-white/15 text-[11px] font-medium text-neutral-300 hover:text-white transition shrink-0 cursor-pointer"
                  >
                    <IconComp className="w-3 h-3 text-rose-400" />
                    <span>{p.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Curating Acoustic Vectors & Tracks...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Curated Playlist</span>
              </>
            )}
          </button>

          {/* Generated Result Preview */}
          {result && result.songs.length > 0 && (
            <div className="rounded-2xl bg-[#141416] border border-[#2E2E32] p-4 space-y-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <img
                  src={result.coverUrl}
                  alt={result.title}
                  className="w-16 h-16 rounded-xl object-cover shadow-md shrink-0 ring-1 ring-white/10"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-rose-400">
                      {result.detectedLanguage} • {result.mood}
                    </span>
                    <span className="text-[10px] text-neutral-500">{result.songs.length} Tracks</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-white truncate">{result.title}</h3>
                  <p className="text-xs text-neutral-400 line-clamp-1">{result.description}</p>
                </div>
              </div>

              {/* Track list preview */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar divide-y divide-white/5">
                {result.songs.slice(0, 5).map((song, i) => (
                  <div key={song.id} className="pt-1.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="text-[10px] font-mono text-neutral-500 w-4">{i + 1}</span>
                      <span className="font-semibold text-white truncate">{song.title}</span>
                      <span className="text-neutral-400 truncate text-[11px]">— {song.artist}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                      {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                ))}
                {result.songs.length > 5 && (
                  <p className="pt-1 text-[11px] text-neutral-500 text-center font-medium">
                    + {result.songs.length - 5} more tracks curated
                  </p>
                )}
              </div>

              {/* Save & Play Button */}
              <button
                onClick={handleSaveAndPlay}
                className="w-full py-2.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-neutral-200 transition shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Saved to Library! Starting Playback...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Save to Library & Play Now</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
