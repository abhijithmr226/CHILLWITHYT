import React from 'react';
import { useStore } from '../../store/useStore';
import {
  Home,
  Compass,
  Radio,
  ListMusic,
  Heart,
  History,
  Plus,
  Settings,
  Disc,
  Headphones,
  Download,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { resolveAvatar } from '../../utils/avatar';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenInstallModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, onOpenInstallModal }) => {
  const [state, store] = useStore();

  const mainLinks = [
    { label: 'Home', path: '/', icon: <Home className="w-4 h-4" /> },
    { label: 'Discover', path: '/discover', icon: <Compass className="w-4 h-4" /> },
    { label: 'Rooms', path: '/rooms', icon: <Radio className="w-4 h-4" /> },
    { label: 'Playlists', path: '/playlists', icon: <ListMusic className="w-4 h-4" /> },
    { label: 'Liked Songs', path: '/liked', icon: <Heart className="w-4 h-4" /> },
    { label: 'History', path: '/history', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-[#212121] border-r border-[#272727] flex flex-col justify-between p-4 h-full select-none shrink-0 overflow-y-auto hidden lg:flex">
      <div className="space-y-6">
        {/* Main Nav Items */}
        <div className="space-y-1">
          {mainLinks.map((link) => {
            const active = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => onNavigate(link.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  active
                    ? 'bg-[#272727] text-white border-l-2 border-l-[#FF0000] shadow-sm'
                    : 'text-[#AAAAAA] hover:text-white hover:bg-[#272727]'
                }`}
              >
                <span className={active ? 'text-[#FF0000]' : 'text-[#717171]'}>{link.icon}</span>
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>

        {/* Your Rooms */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#717171]">
              Your Rooms
            </span>
            <button
              onClick={() => store.setState({ isCreateRoomModalOpen: true })}
              className="p-1 text-[#717171] hover:text-white transition"
              title="Create new room"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            {state.rooms.length > 0 ? (
              state.rooms.slice(0, 4).map((room, idx) => (
                <button
                  key={`${room.id}-${idx}`}
                  onClick={() => onNavigate(`/room/${room.id}`)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-[#AAAAAA] hover:text-white hover:bg-[#272727] transition text-left group"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">{room.name}</span>
                  </div>
                  {room.isPlaying && (
                    <span className="text-[9px] bg-[#FF0000] text-white font-bold px-1.5 py-0.2 rounded uppercase shrink-0">
                      Live
                    </span>
                  )}
                </button>
              ))
            ) : (
              <p className="text-[11px] text-[#666666] px-2 py-1">No active rooms</p>
            )}
          </div>
        </div>


        {/* Your Playlists */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#717171]">
              Your Playlists
            </span>
            <button
              onClick={() => {
                const pl = store.createPlaylist('My Mix', 'Custom collection');
                onNavigate(`/playlist/${pl.id}`);
              }}
              className="p-1 text-[#717171] hover:text-white transition"
              title="Create playlist"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-0.5">
            {state.playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => onNavigate(`/playlist/${pl.id}`)}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-[#AAAAAA] hover:text-white hover:bg-[#272727] transition text-left"
              >
                <img
                  src={pl.coverUrl}
                  alt={pl.name}
                  className="w-5 h-5 rounded object-cover shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="truncate">{pl.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Install App Promo / Button */}
      {onOpenInstallModal && (
        <div className="p-3 rounded-2xl bg-gradient-to-br from-[#1C1515] to-[#151515] border border-red-500/20 hover:border-red-500/40 transition group">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF0000] to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-red-950/50 group-hover:scale-105 transition">
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                Add to Desktop
                <span className="text-[9px] bg-red-500/20 text-[#FF4D4D] font-mono px-1 py-0.2 rounded">PWA</span>
              </h4>
              <p className="text-[10px] text-[#888888] leading-tight mt-0.5">
                Add app icon to laptop desktop & taskbar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenInstallModal}
            className="w-full mt-2.5 py-1.5 px-3 rounded-xl bg-[#272727] hover:bg-[#FF0000] text-white text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Add to Desktop Screen</span>
          </button>
        </div>
      )}

      {/* Bottom Profile & Settings */}
      <div className="pt-3 border-t border-[#272727] space-y-2">
        {state.currentUser && (
          <div
            onClick={() => onNavigate('/profile')}
            className="flex items-center justify-between p-2 rounded-xl bg-[#272727] border border-[#383838] hover:border-[#4F4F4F] cursor-pointer transition"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={resolveAvatar(state.currentUser.avatarUrl, state.currentUser.username || state.currentUser.id)}
                alt={state.currentUser.displayName}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-[#383838]"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{state.currentUser.displayName}</p>
                <p className="text-[10px] text-[#AAAAAA] font-mono truncate">@{state.currentUser.username}</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('/settings');
              }}
              className="p-1.5 text-[#717171] hover:text-white transition"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Developer Credit */}
        <div className="px-2 py-1 flex items-center justify-between text-[11px] text-[#717171]">
          <span>Developer</span>
          <a
            href="https://linkedin.com/in/abhijithmr226"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#CCCCCC] hover:text-[#FF0000] font-semibold transition flex items-center gap-1 group"
            title="Connect on LinkedIn"
          >
            <span className="group-hover:underline">Abhijith M R</span>
            <ExternalLink className="w-3 h-3 text-[#717171] group-hover:text-[#FF0000]" />
          </a>
        </div>
      </div>
    </aside>
  );
};
