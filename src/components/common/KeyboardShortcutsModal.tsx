import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { audioManager } from '../../services/audio/AudioManager';
import { X, Command } from 'lucide-react';

export const KeyboardShortcutsModal: React.FC = () => {
  const [state, store] = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        audioManager.togglePlayPause();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        const s = audioManager.getState();
        audioManager.seek(s.currentTime + 5);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const s = audioManager.getState();
        audioManager.seek(s.currentTime - 5);
      } else if (e.key === 'n' || e.key === 'N') {
        audioManager.next();
      } else if (e.key === 'p' || e.key === 'P') {
        audioManager.previous();
      } else if (e.key === 'm' || e.key === 'M') {
        audioManager.toggleMute();
      } else if (e.key === 'q' || e.key === 'Q') {
        store.setState({ isQueueDrawerOpen: !store.getState().isQueueDrawerOpen });
      } else if (e.key === '?') {
        store.setState({ isShortcutsModalOpen: !store.getState().isShortcutsModalOpen });
      } else if (e.key === 'Escape' && store.getState().isShortcutsModalOpen) {
        store.setState({ isShortcutsModalOpen: false });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);

  if (!state.isShortcutsModalOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Play / Pause' },
    { key: '→', desc: 'Seek forward 5s' },
    { key: '←', desc: 'Seek backward 5s' },
    { key: 'N', desc: 'Next track' },
    { key: 'P', desc: 'Previous track' },
    { key: 'M', desc: 'Mute / Unmute' },
    { key: 'Q', desc: 'Toggle playback queue' },
    { key: '?', desc: 'Show keyboard shortcuts' },
  ];

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in pb-[calc(12px+env(safe-area-inset-bottom,0px))]"
      onClick={() => store.setState({ isShortcutsModalOpen: false })}
    >
      <div
        className="w-full max-w-md bg-[#212121] border border-[#272727] rounded-2xl p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#272727] pb-4">
          <div className="flex items-center gap-2">
            <Command className="w-5 h-5 text-[#FF0000]" />
            <h3 className="font-semibold text-white text-lg">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={() => store.setState({ isShortcutsModalOpen: false })}
            className="p-1.5 rounded-lg text-[#AAAAAA] hover:text-white hover:bg-[#272727] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="divide-y divide-[#272727] text-sm">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between py-2.5">
              <span className="text-[#AAAAAA]">{s.desc}</span>
              <kbd className="px-2.5 py-1 bg-[#272727] border border-[#383838] text-white rounded-lg text-xs font-mono shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <button
          onClick={() => store.setState({ isShortcutsModalOpen: false })}
          className="w-full py-2.5 bg-[#272727] hover:bg-[#383838] text-white text-xs font-medium rounded-xl transition"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
