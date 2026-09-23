import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { pwaService } from '../../services/pwa/PwaService';
import { resolveAvatar } from '../../utils/avatar';
import { Search, Download, Users, LogIn, Sparkles, Plus } from 'lucide-react';

interface MobileHeaderProps {
  onNavigate: (path: string) => void;
  onOpenInstallModal: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onNavigate, onOpenInstallModal }) => {
  const [state, store] = useStore();
  const [pwaState, setPwaState] = useState(pwaService.getState());

  useEffect(() => {
    return pwaService.subscribe(() => {
      setPwaState({ ...pwaService.getState() });
    });
  }, []);

  return (
    <div className="md:hidden sticky top-0 z-30 w-full h-14 bg-[#161618]/95 backdrop-blur-xl border-b border-[#27272A] px-3 sm:px-4 flex items-center justify-between select-none shadow-sm">
      {/* Brand & Live Pill */}
      <div 
        onClick={() => onNavigate('/')}
        className="flex items-center gap-2 cursor-pointer active:scale-95 transition shrink-0"
      >
        <div className="w-7 h-7 rounded-xl overflow-hidden shadow-md shadow-red-900/30 border border-white/10 shrink-0">
          <img src="/icon.png" alt="ChillWithYT" className="w-full h-full object-cover" />
        </div>
        <span className="text-base font-extrabold tracking-tight text-white hidden sm:flex items-center">
          ChillWith<span className="text-[#FF0000]">YT</span>
        </span>
      </div>

      {/* Prominent Search Bar Pill on Mobile */}
      <div
        onClick={() => onNavigate('/discover?focus=search')}
        className="flex-1 mx-2 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 flex items-center gap-2 text-xs text-[#AAAAAA] cursor-pointer active:scale-98 transition shadow-inner min-w-0"
      >
        <Search className="w-3.5 h-3.5 text-red-500 shrink-0" />
        <span className="truncate text-[11px]">Search YouTube music...</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Quick Create Room Button */}
        <button
          onClick={() => store.setState({ isCreateRoomModalOpen: true })}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF0000] to-rose-600 hover:from-[#CC0000] text-white text-[11px] font-bold shadow-md shadow-red-900/30 active:scale-95 transition cursor-pointer"
          title="Create a Listening Room"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Room</span>
        </button>

        {/* Live Rooms quick indicator */}
        {state.rooms.length > 0 && (
          <button
            onClick={() => onNavigate('/rooms')}
            className="flex items-center gap-1 p-1.5 px-2 rounded-xl bg-white/5 text-white/80 active:scale-95 transition text-[11px] font-semibold"
            title="Live Rooms"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{state.rooms.length}</span>
          </button>
        )}

        {/* Profile Avatar or Login */}
        {state.isAuthenticated && state.currentUser ? (
          <div
            onClick={() => onNavigate('/profile')}
            className="cursor-pointer active:scale-95 transition"
          >
            <img
              src={resolveAvatar(state.currentUser.avatarUrl, state.currentUser.username || state.currentUser.id)}
              alt={state.currentUser.displayName}
              className="w-7 h-7 rounded-xl object-cover ring-1 ring-white/20"
            />
          </div>
        ) : (
          <button
            onClick={() => store.setState({ isAuthModalOpen: true })}
            className="p-1.5 rounded-xl bg-[#FF0000] text-white text-xs font-semibold active:scale-95 transition"
          >
            <LogIn className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
