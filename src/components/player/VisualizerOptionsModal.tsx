import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { VisualizerMode } from '../../types';
import { audioManager } from '../../services/audio/AudioManager';
import { detectSongGenre, GenreProfile } from '../../services/audio/VisualizerEngine';
import { 
  X, 
  Sliders, 
  Sparkles, 
  Activity, 
  Disc, 
  Radio, 
  Eye, 
  Flame, 
  Coffee, 
  Moon, 
  Zap, 
  Volume2,
  Orbit 
} from 'lucide-react';

export const VisualizerOptionsModal: React.FC = () => {
  const [state, store] = useStore();
  const { isVisualizerOptionsOpen, visualizerConfig } = state;
  const [activeSong, setActiveSong] = useState(audioManager.getState().currentSong);
  const [isBeatActive, setIsBeatActive] = useState(false);
  const [currentGenre, setCurrentGenre] = useState<GenreProfile>(detectSongGenre(audioManager.getState().currentSong));

  useEffect(() => {
    if (!isVisualizerOptionsOpen) return;

    const unsub = audioManager.subscribe((playback) => {
      setActiveSong(playback.currentSong);
      setCurrentGenre(detectSongGenre(playback.currentSong));
    });

    // Gentle pulse loop for the beat meter HUD
    const beatInterval = setInterval(() => {
      if (audioManager.getState().isPlaying) {
        setIsBeatActive(true);
        setTimeout(() => setIsBeatActive(false), 120);
      }
    }, (60 / currentGenre.bpm) * 1000);

    return () => {
      unsub();
      clearInterval(beatInterval);
    };
  }, [isVisualizerOptionsOpen, currentGenre.bpm]);

  if (!isVisualizerOptionsOpen) return null;

  const modes: { id: VisualizerMode; label: string; icon: React.ReactNode; desc: string; badge?: string }[] = [
    { 
      id: 'AutoAdaptive', 
      label: 'Auto-Adaptive', 
      icon: <Zap className="w-4 h-4 text-[#FFD600]" />, 
      desc: 'Adapts physics & colors automatically based on song type',
      badge: 'RECOMMENDED' 
    },
    { 
      id: 'MassBass', 
      label: 'Mass Bass', 
      icon: <Flame className="w-4 h-4 text-[#FF0000]" />, 
      desc: 'Heavy 808s, drop shockwaves & fiery sparks' 
    },
    { 
      id: 'LiquidLofi', 
      label: 'Liquid Lofi', 
      icon: <Coffee className="w-4 h-4 text-[#2DD4BF]" />, 
      desc: 'Morphing organic fluid blob with floating stardust' 
    },
    { 
      id: 'RadialAurora', 
      label: 'Radial Aurora', 
      icon: <Moon className="w-4 h-4 text-[#A855F7]" />, 
      desc: 'Radiant vocal ribbons with northern-lights bloom' 
    },
    { 
      id: 'Circular', 
      label: 'Circular Disc', 
      icon: <Disc className="w-4 h-4 text-[#6366F1]" />, 
      desc: 'Classic vinyl radial frequency bars with beat bounce' 
    },
    { 
      id: 'Spectrum', 
      label: 'Equalizer Bars', 
      icon: <Activity className="w-4 h-4 text-[#10B981]" />, 
      desc: 'Multi-band frequency spectrum with peak floating caps' 
    },
    { 
      id: 'Wave', 
      label: 'Oscilloscope', 
      icon: <Radio className="w-4 h-4 text-[#06B6D4]" />, 
      desc: 'Realtime harmonic audio waveform laser line' 
    },
    { 
      id: 'Particles', 
      label: 'Particle Field', 
      icon: <Sparkles className="w-4 h-4 text-[#F59E0B]" />, 
      desc: 'Ambient dust accelerating with audio energy' 
    },
    { 
      id: 'Minimal', 
      label: 'Minimalist Line', 
      icon: <Eye className="w-4 h-4 text-white" />, 
      desc: 'Ultra-clean dynamic pulsing stereo expander' 
    },
    {
      id: 'Dalia3D',
      label: 'Dalia 3D',
      icon: <Orbit className="w-4 h-4 text-white" />,
      desc: '20 procedural 3D point-cloud geometries — Spheres, Tori, Nebulae, Black Holes',
      badge: '3D · NEW',
    },
  ];

  const colors: { id: 'red' | 'indigo' | 'violet' | 'cyan' | 'emerald' | 'amber' | 'rainbow'; hex: string }[] = [
    { id: 'red', hex: '#FF0000' },
    { id: 'indigo', hex: '#6366F1' },
    { id: 'violet', hex: '#8B5CF6' },
    { id: 'cyan', hex: '#06B6D4' },
    { id: 'emerald', hex: '#10B981' },
    { id: 'amber', hex: '#F59E0B' },
    { id: 'rainbow', hex: 'linear-gradient(135deg, #FF0000, #FF7A00, #FFD600)' },
  ];

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in pb-[calc(12px+env(safe-area-inset-bottom,0px))]">
      <div 
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#1A1A1A] border border-[#272727] rounded-3xl p-6 shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#272727] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF0000]/15 border border-[#FF0000]/30 flex items-center justify-center text-[#FF0000]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg leading-tight">Beat & Audio Visualizer</h3>
              <p className="text-xs text-[#AAAAAA]">Dynamic frequency rendering & song-type acoustics</p>
            </div>
          </div>
          <button
            onClick={() => store.setState({ isVisualizerOptionsOpen: false })}
            className="p-2 rounded-xl text-[#AAAAAA] hover:text-white hover:bg-[#272727] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Detected Song Genre & Beat Meter HUD */}
        <div className="p-4 rounded-2xl bg-[#121212] border border-[#2A2A2A] relative overflow-hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl">{currentGenre.badgeIcon}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF0000]">
                    Auto-Detected Genre:
                  </span>
                  <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full bg-[#272727] border border-[#383838]">
                    {currentGenre.label}
                  </span>
                </div>
                <p className="text-xs text-[#AAAAAA] truncate mt-0.5">
                  {activeSong ? `${activeSong.title} • ${activeSong.artist}` : 'Default Audio Signature'}
                </p>
              </div>
            </div>

            {/* Live Beat Pulse Meter */}
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1.5">
                <div 
                  className={`w-3 h-3 rounded-full transition-all duration-100 ${
                    isBeatActive 
                      ? 'bg-[#FF0000] shadow-[0_0_12px_#FF0000] scale-125' 
                      : 'bg-[#444444]'
                  }`} 
                />
                <span className="text-[10px] font-mono font-bold text-[#AAAAAA]">
                  {currentGenre.bpm} BPM
                </span>
              </div>
              <span className="text-[9px] text-[#717171] uppercase tracking-widest mt-0.5">
                {isBeatActive ? 'KICK PULSE' : 'BEAT SYNC'}
              </span>
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <div>
          <label className="text-xs font-bold text-[#AAAAAA] uppercase tracking-wider block mb-2.5">
            Visualizer Geometry & Acoustic Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {modes.map((m) => {
              const active = visualizerConfig.mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => store.updateVisualizerConfig({ mode: m.id })}
                  className={`flex flex-col items-start p-3 rounded-2xl border text-left transition relative cursor-pointer ${
                    active
                      ? 'bg-[#FF0000]/15 border-[#FF0000] text-white shadow-[0_0_15px_rgba(255,0,0,0.25)]'
                      : 'bg-[#181818] border-[#272727] text-[#AAAAAA] hover:text-white hover:border-[#444444]'
                  }`}
                >
                  {m.badge && (
                    <span className="absolute top-2 right-2 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#FF0000] text-white tracking-wider">
                      {m.badge}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    {m.icon}
                    <span className="text-xs font-bold text-white">{m.label}</span>
                  </div>
                  <span className="text-[11px] text-[#888888] leading-tight">
                    {m.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Palette */}
        <div>
          <label className="text-xs font-bold text-[#AAAAAA] uppercase tracking-wider block mb-2.5">
            Color Spectrum
          </label>
          <div className="flex items-center gap-3">
            {colors.map((c) => {
              const active = visualizerConfig.colorScheme === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => store.updateVisualizerConfig({ colorScheme: c.id })}
                  className={`w-9 h-9 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                    active 
                      ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-[#1A1A1A] shadow-lg' 
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ background: c.hex }}
                  title={c.id}
                />
              );
            })}
          </div>
        </div>

        {/* Beat Sensitivity & Reactivity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-2xl bg-[#151515] border border-[#272727] space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-[#AAAAAA] flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#FF0000]" />
                Beat Shockwave Sensitivity
              </span>
              <span className="text-white font-mono">{visualizerConfig.beatSensitivity ?? 80}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={visualizerConfig.beatSensitivity ?? 80}
              onChange={(e) => store.updateVisualizerConfig({ beatSensitivity: parseInt(e.target.value) })}
              className="w-full accent-[#FF0000] cursor-pointer"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-[#151515] border border-[#272727] space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-[#AAAAAA]">Animation Speed</span>
              <span className="text-white font-mono">{visualizerConfig.speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={visualizerConfig.speed ?? 1.0}
              onChange={(e) => store.updateVisualizerConfig({ speed: parseFloat(e.target.value) })}
              className="w-full accent-[#FF0000] cursor-pointer"
            />
          </div>
        </div>

        {/* Intensity Slider */}
        <div className="p-3.5 rounded-2xl bg-[#151515] border border-[#272727] space-y-1.5">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-[#AAAAAA]">Frequency Amplitude & Height</span>
            <span className="text-white font-mono">{visualizerConfig.intensity ?? 80}%</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            step="5"
            value={visualizerConfig.intensity ?? 80}
            onChange={(e) => store.updateVisualizerConfig({ intensity: parseInt(e.target.value) })}
            className="w-full accent-[#FF0000] cursor-pointer"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={() => store.setState({ isVisualizerOptionsOpen: false })}
          className="w-full py-3 bg-[#FF0000] hover:bg-[#CC0000] text-white font-bold rounded-2xl transition shadow-[0_0_20px_rgba(255,0,0,0.3)] cursor-pointer"
        >
          Save & Apply Visualizer
        </button>
      </div>
    </div>
  );
};
