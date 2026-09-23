import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { pwaService } from '../../services/pwa/PwaService';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Command, 
  Activity, 
  Radio, 
  ShieldCheck, 
  Volume2, 
  Sparkles,
  Minus,
  Square,
  X
} from 'lucide-react';

interface DesktopAppHeaderProps {
  onOpenInstallModal: () => void;
}

export const DesktopAppHeader: React.FC<DesktopAppHeaderProps> = ({ onOpenInstallModal }) => {
  const [state, store] = useStore();
  const [pwaState, setPwaState] = useState(pwaService.getState());

  useEffect(() => {
    return pwaService.subscribe(() => {
      setPwaState({ ...pwaService.getState() });
    });
  }, []);

  const handleBack = () => {
    window.history.back();
  };

  const handleForward = () => {
    window.history.forward();
  };

  const handleClose = () => {
    if (state.isFullScreenPlayerOpen) {
      store.setState({ isFullScreenPlayerOpen: false });
      return;
    }
    if (state.isCreateRoomModalOpen) {
      store.setState({ isCreateRoomModalOpen: false });
      return;
    }
    if (state.isQueueDrawerOpen) {
      store.setState({ isQueueDrawerOpen: false });
      return;
    }
    if (state.isVisualizerOptionsOpen) {
      store.setState({ isVisualizerOptionsOpen: false });
      return;
    }
    if (state.isShortcutsModalOpen) {
      store.setState({ isShortcutsModalOpen: false });
      return;
    }
    if (state.isAIPlaylistModalOpen) {
      store.setState({ isAIPlaylistModalOpen: false });
      return;
    }
    if (state.isTasteOnboardingOpen) {
      store.setState({ isTasteOnboardingOpen: false });
      return;
    }
    if (window.location.pathname.startsWith('/room/')) {
      if (window.confirm('Leave this listening room?')) {
        window.history.pushState({}, '', '/rooms');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      return;
    }
    if (window.confirm('Close ChillWithYT player window?')) {
      try {
        window.close();
      } catch {}
    }
  };

  const handleMinimize = () => {
    store.setState({
      isFullScreenPlayerOpen: false,
      isQueueDrawerOpen: false,
      isCreateRoomModalOpen: false,
      isVisualizerOptionsOpen: false,
      isShortcutsModalOpen: false,
      isAIPlaylistModalOpen: false,
      isTasteOnboardingOpen: false,
    });
  };

  const handleMaximize = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="hidden lg:flex items-center justify-between h-9 bg-[#18181A] border-b border-[#27272A] px-4 text-xs select-none z-40 shrink-0">
      {/* Left: Window Dots & Navigation Arrows */}
      <div className="flex items-center gap-4">
        {/* Interactive Window controls styling (Mac/Electron look) */}
        <div className="flex items-center gap-2 group/dots">
          <button
            onClick={handleClose}
            className="w-3 h-3 rounded-full bg-[#FF5F56] hover:bg-[#FF3B30] border border-[#E0443E]/50 flex items-center justify-center cursor-pointer transition active:scale-90"
            title="Close / Exit modal (Alt + F4 / Esc)"
            aria-label="Close"
          >
            <span className="opacity-0 group-hover/dots:opacity-100 text-[8px] font-black text-[#500000] leading-none select-none">✕</span>
          </button>
          <button
            onClick={handleMinimize}
            className="w-3 h-3 rounded-full bg-[#FFBD2E] hover:bg-[#FF9500] border border-[#DEA123]/50 flex items-center justify-center cursor-pointer transition active:scale-90"
            title="Minimize fullscreen & modals"
            aria-label="Minimize"
          >
            <span className="opacity-0 group-hover/dots:opacity-100 text-[8px] font-black text-[#503000] leading-none select-none mb-0.5">─</span>
          </button>
          <button
            onClick={handleMaximize}
            className="w-3 h-3 rounded-full bg-[#27C93F] hover:bg-[#34C759] border border-[#1AAB29]/50 flex items-center justify-center cursor-pointer transition active:scale-90"
            title="Toggle Fullscreen Window (F11)"
            aria-label="Maximize"
          >
            <span className="opacity-0 group-hover/dots:opacity-100 text-[8px] font-black text-[#003500] leading-none select-none">▲</span>
          </button>
        </div>

        {/* History Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleBack}
            className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition cursor-pointer"
            title="Go Back (Alt + Left)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleForward}
            className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition cursor-pointer"
            title="Go Forward (Alt + Right)"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-white/50 pl-1">
          <span>ChillWithYT Desktop v2.4</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected
          </span>
        </div>
      </div>

      {/* Center: Realtime Audio Engine Telemetry */}
      <div className="flex items-center gap-2 px-3 py-0.5 rounded-full bg-black/40 border border-white/5 text-[10px] text-white/60">
        <Activity className="w-3 h-3 text-red-500 animate-pulse" />
        <span>Lossless 320kbps Audio Engine</span>
        <span className="text-white/20">•</span>
        <span className="text-amber-400 font-mono">Synced Room Sync Ref</span>
        <span className="text-white/20">•</span>
        <span className="text-white/40">Visualizer: {state.visualizerConfig.mode}</span>
      </div>

      {/* Right: Install Desktop App, Shortcuts & Windows Window Controls */}
      <div className="flex items-center gap-2">
        {!pwaState.isStandalone && (
          <button
            onClick={onOpenInstallModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 hover:text-red-300 text-[11px] font-bold transition cursor-pointer group"
            title="Add ChillWithYT icon directly to your Laptop / PC Desktop Screen"
          >
            <Download className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform" />
            <span>Add to Laptop / Desktop Screen</span>
          </button>
        )}

        <button
          onClick={() => store.setState({ isShortcutsModalOpen: true })}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-white/40 hover:text-white hover:bg-white/5 transition cursor-pointer"
          title="Keyboard shortcuts"
        >
          <Command className="w-3 h-3" />
          <span>Hotkeys</span>
        </button>

        {/* Windows-style Minimize, Maximize, and Close Buttons */}
        <div className="flex items-center border-l border-white/10 pl-2 ml-1">
          <button
            onClick={handleMinimize}
            className="w-7 h-6 flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white rounded transition cursor-pointer"
            title="Minimize (Collapse full view to mini player)"
            aria-label="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-7 h-6 flex items-center justify-center hover:bg-white/10 text-white/50 hover:text-white rounded transition cursor-pointer"
            title="Maximize (Toggle Fullscreen)"
            aria-label="Maximize"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={handleClose}
            className="w-7 h-6 flex items-center justify-center hover:bg-red-600 text-white/50 hover:text-white rounded transition cursor-pointer"
            title="Close active modal / Leave room"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
