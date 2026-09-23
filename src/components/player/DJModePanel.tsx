import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { audioManager } from '../../services/audio/AudioManager';
import { Crown, SkipForward, FastForward, PlusCircle, Shuffle, Repeat, X } from 'lucide-react';

interface DJModePanelProps {
  onClose?: () => void;
}

export const DJModePanel: React.FC<DJModePanelProps> = ({ onClose }) => {
  const [state, store] = useStore();
  const [crossfade, setCrossfade] = useState<number>(3);

  const handleSkip = () => {
    audioManager.next();
  };

  const handleSeekForward = () => {
    const currentState = audioManager.getState();
    audioManager.seek(currentState.currentTime + 15);
  };

  const handleToggleShuffle = () => {
    audioManager.toggleShuffle();
  };

  const handleToggleRepeat = () => {
    audioManager.setRepeatMode();
  };

  const handleOpenQueue = () => {
    store.setState({ isQueueDrawerOpen: true });
  };

  const handleLeaveDJ = () => {
    store.setState({ isDJModeActive: false });
    onClose?.();
  };

  return (
    <div className="bg-[#212121] border border-[#272727] rounded-2xl p-5 shadow-2xl space-y-4 max-w-sm w-full animate-fade-in">
      <div className="flex items-center justify-between border-b border-[#272727] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">DJ Mode</h4>
            <p className="text-[11px] text-[#AAAAAA]">You have the aux cord</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded text-[#AAAAAA] hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Primary DJ Controls */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleSkip}
          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#272727] hover:bg-[#383838] border border-[#383838] text-xs text-white transition gap-1.5"
        >
          <SkipForward className="w-4 h-4 text-[#FF0000]" />
          <span>Skip Track</span>
        </button>

        <button
          onClick={handleSeekForward}
          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#272727] hover:bg-[#383838] border border-[#383838] text-xs text-white transition gap-1.5"
        >
          <FastForward className="w-4 h-4 text-[#AAAAAA]" />
          <span>Seek +15s</span>
        </button>

        <button
          onClick={handleOpenQueue}
          className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#272727] hover:bg-[#383838] border border-[#383838] text-xs text-white transition gap-1.5"
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          <span>Queue</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleToggleShuffle}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#272727] hover:bg-[#383838] border border-[#383838] text-xs text-[#AAAAAA] hover:text-white transition"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>Shuffle</span>
        </button>

        <button
          onClick={handleToggleRepeat}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#272727] hover:bg-[#383838] border border-[#383838] text-xs text-[#AAAAAA] hover:text-white transition"
        >
          <Repeat className="w-3.5 h-3.5" />
          <span>Repeat</span>
        </button>
      </div>

      {/* Crossfade */}
      <div className="pt-1">
        <div className="flex justify-between items-center text-xs mb-1 font-medium">
          <span className="text-[#AAAAAA]">Crossfade</span>
          <span className="text-white font-mono">{crossfade}s</span>
        </div>
        <input
          type="range"
          min="0"
          max="10"
          step="1"
          value={crossfade}
          onChange={(e) => setCrossfade(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Leave DJ Mode */}
      <button
        onClick={handleLeaveDJ}
        className="w-full py-2 bg-[#FF0000]/15 hover:bg-[#FF0000]/25 border border-[#FF0000]/30 text-[#FF4D4D] hover:text-white rounded-xl text-xs font-medium transition"
      >
        Leave DJ Mode
      </button>
    </div>
  );
};
