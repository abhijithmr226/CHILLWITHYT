import React, { useState, useEffect } from 'react';
import { radioEngine, RadioDebugInfo } from '../../services/audio/RadioEngine';
import { audioManager } from '../../services/audio/AudioManager';
import {
  Activity,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Layers,
  Users,
  ShieldCheck,
  RefreshCw,
  X
} from 'lucide-react';

export const RadioDebugInspector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<RadioDebugInfo>(() => radioEngine.getDebugInfo());
  const [radioState, setRadioState] = useState(() => radioEngine.getState());

  useEffect(() => {
    const unsubRadio = radioEngine.subscribe((st) => {
      setRadioState(st);
      setDebugInfo(radioEngine.getDebugInfo());
    });

    const interval = setInterval(() => {
      setDebugInfo(radioEngine.getDebugInfo());
    }, 2000);

    return () => {
      unsubRadio();
      clearInterval(interval);
    };
  }, []);

  if (!radioState.isRadioMode) return null;

  return (
    <div className="fixed bottom-24 right-4 z-40 select-none">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1C1E]/90 hover:bg-[#252528] border border-rose-500/30 text-[11px] font-mono font-bold text-white shadow-xl backdrop-blur cursor-pointer hover:border-rose-500 transition"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Radio HUD ({debugInfo.candidatePoolCount} pooled)</span>
          <ChevronUp className="w-3.5 h-3.5 text-rose-400" />
        </button>
      ) : (
        <div className="w-80 rounded-2xl bg-[#141416]/95 border border-white/10 p-4 shadow-2xl backdrop-blur-xl text-white space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold">Radio Telemetry HUD</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-neutral-400">Station:</span>
              <span className="font-bold text-rose-400 truncate max-w-[150px]">{debugInfo.stationName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Candidate Pool:</span>
              <span className="font-mono font-bold text-emerald-400">{debugInfo.candidatePoolCount} tracks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Played History:</span>
              <span className="font-mono text-neutral-200">{debugInfo.playedHistoryCount} / 100 tracks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Artist Diversity:</span>
              <span className="font-mono text-cyan-400">{debugInfo.uniqueArtistsCount} in recent window</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Lang Confidence:</span>
              <span className="font-mono font-bold text-amber-400">{(debugInfo.languageConfidenceSample * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Fallback Level:</span>
              <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono font-bold">
                {debugInfo.activeFallbackLevel}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 pt-1 border-t border-white/5">
              <span className="text-[10px] text-neutral-400">Last Query Rotation:</span>
              <span className="text-[10px] font-mono text-neutral-300 truncate bg-black/40 px-2 py-1 rounded">
                {debugInfo.lastUsedQuery || 'Dynamic rotation active'}
              </span>
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center text-[10px] text-neutral-400 border-t border-white/5">
            <span>Continuous discovery engine</span>
            <button
              onClick={() => radioEngine.replenishCandidatePool(true)}
              className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Force Batch</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
