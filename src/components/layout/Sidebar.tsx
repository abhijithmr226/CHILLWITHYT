import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import {
  Home,
  Compass,
  Radio,
  ListMusic,
  Heart,
  History,
  Clock,
  Disc,
  Mic2,
  Settings,
  HelpCircle,
  Info,
  Plus,
  Flame,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenInstallModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate }) => {
  const [state, store] = useStore();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const mainNav = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Discover', path: '/discover', icon: Compass },
    { label: 'Rooms', path: '/rooms', icon: Radio },
    { label: 'Playlists', path: '/playlists', icon: ListMusic },
    { label: 'Liked Songs', path: '/liked', icon: Heart },
    { label: 'History', path: '/history', icon: History },
  ];

  const libraryNav = [
    { label: 'Recently Played', path: '/history', icon: Clock },
    { label: 'Albums & Soundtracks', path: '/discover?tab=albums', icon: Disc },
    { label: 'Popular Artists', path: '/discover?tab=artists', icon: Mic2 },
  ];

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setShowFeedbackModal(false);
      setFeedbackText('');
    }, 1800);
  };

  return (
    <>
      <aside
        className="w-[230px] bg-[#0A0A0C] border-r border-white/[0.07] flex flex-col justify-between py-4 px-3 h-full select-none shrink-0 overflow-y-auto hidden lg:flex z-20"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="space-y-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#666666]">
              Menu
            </div>
            {mainNav.map((link) => {
              const Icon = link.icon;
              const active = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path));
              return (
                <button
                  key={link.path}
                  onClick={() => onNavigate(link.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition duration-150 text-left cursor-pointer group ${
                    active
                      ? 'bg-[#FF0000]/12 text-white font-semibold border-l-2 border-[#FF0000]'
                      : 'text-[#A1A1A1] hover:text-[#F5F5F5] hover:bg-[#141418]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors shrink-0 ${
                      active ? 'text-[#FF0000]' : 'text-[#777777] group-hover:text-white'
                    }`}
                  />
                  <span className="truncate">{link.label}</span>
                </button>
              );
            })}
          </div>

          {/* Library Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 pb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#666666]">
                Library
              </span>
              <button
                onClick={() => {
                  const pl = store.createPlaylist(`My Mix #${state.playlists.length + 1}`, 'Curated playlist');
                  onNavigate(`/playlist/${pl.id}`);
                }}
                className="p-1 rounded text-[#777777] hover:text-white hover:bg-[#16161B] transition cursor-pointer"
                title="Create new playlist"
              >
                <Plus className="w-3.5 h-3.5 text-[#FF0000]" />
              </button>
            </div>

            {/* Playlists quick list */}
            {state.playlists.slice(0, 5).map((pl) => {
              const active = currentPath === `/playlist/${pl.id}`;
              return (
                <button
                  key={pl.id}
                  onClick={() => onNavigate(`/playlist/${pl.id}`)}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition text-left cursor-pointer group ${
                    active
                      ? 'bg-[#FF0000]/12 text-white font-semibold border-l-2 border-[#FF0000]'
                      : 'text-[#A1A1A1] hover:text-[#F5F5F5] hover:bg-[#141418]'
                  }`}
                >
                  <img
                    src={pl.coverUrl}
                    alt=""
                    className="w-4 h-4 rounded object-cover shrink-0 ring-1 ring-white/10"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <span className="truncate">{pl.name}</span>
                </button>
              );
            })}

            {libraryNav.map((item) => {
              const Icon = item.icon;
              const active = currentPath === item.path;
              return (
                <button
                  key={item.label}
                  onClick={() => onNavigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition text-left cursor-pointer group ${
                    active
                      ? 'bg-[#FF0000]/12 text-white font-semibold border-l-2 border-[#FF0000]'
                      : 'text-[#A1A1A1] hover:text-[#F5F5F5] hover:bg-[#141418]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors shrink-0 ${
                      active ? 'text-[#FF0000]' : 'text-[#777777] group-hover:text-white'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Listening Rooms shortcut */}
          {state.rooms.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-3 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#666666]">
                  Active Rooms
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              {state.rooms.slice(0, 3).map((room) => (
                <button
                  key={room.id}
                  onClick={() => onNavigate(`/room/${room.id}`)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-[#A1A1A1] hover:text-white hover:bg-[#141418] transition text-left cursor-pointer group"
                >
                  <span className="truncate max-w-[130px]">{room.name}</span>
                  <span className="text-[9px] font-bold font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    {room.membersCount || 1}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: Settings, Feedback, About */}
        <div className="pt-4 mt-4 border-t border-white/[0.07] space-y-1">
          <button
            onClick={() => onNavigate('/settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition text-left cursor-pointer ${
              currentPath === '/settings'
                ? 'bg-[#FF0000]/12 text-white font-semibold'
                : 'text-[#A1A1A1] hover:text-white hover:bg-[#141418]'
            }`}
          >
            <Settings className="w-4 h-4 text-[#777777]" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => setShowFeedbackModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-[#A1A1A1] hover:text-white hover:bg-[#141418] transition text-left cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#777777]" />
            <span>Feedback</span>
          </button>

          <button
            onClick={() => setShowAboutModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-[#A1A1A1] hover:text-white hover:bg-[#141418] transition text-left cursor-pointer"
          >
            <Info className="w-4 h-4 text-[#777777]" />
            <span>About</span>
          </button>

          <div className="px-3 pt-3 text-[10px] text-[#555555] font-mono flex items-center justify-between">
            <span>ChillWithYT v1.2</span>
            <span className="text-[#FF0000]">●</span>
          </div>
        </div>
      </aside>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#121216] border border-white/10 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#FF0000]" />
                Send Product Feedback
              </h3>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-[#777777] hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-[#A1A1A1] leading-relaxed">
              Help us improve ChillWithYT. Ideas for new radio stations, rooms, audio sync features or UI improvements?
            </p>
            {feedbackSent ? (
              <div className="py-6 text-center text-xs text-emerald-400 font-medium">
                ✓ Thank you for your feedback! We review every idea.
              </div>
            ) : (
              <form onSubmit={handleSendFeedback} className="space-y-3">
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us what you'd love to see or what we can refine..."
                  rows={4}
                  className="w-full bg-[#0E0E12] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-[#666666] focus:border-[#FF0000] focus:outline-none resize-none"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-[#A1A1A1] hover:text-white hover:bg-white/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#FF0000] hover:bg-[#E50914] text-white shadow-md cursor-pointer"
                  >
                    Submit
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#121216] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FF0000]/15 border border-[#FF0000]/30 mx-auto flex items-center justify-center">
              <img src="/icon.png" alt="ChillWithYT" className="w-7 h-7 rounded object-cover" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                ChillWith<span className="text-[#FF0000]">YT</span>
              </h3>
              <p className="text-xs text-[#A1A1A1] mt-1">
                Real-time synchronized YouTube music discovery & social rooms.
              </p>
            </div>
            <div className="bg-[#0E0E12] rounded-xl p-3 text-left space-y-1.5 text-xs text-[#A1A1A1] border border-white/5">
              <div className="flex justify-between">
                <span>Audio Engine</span>
                <span className="text-white font-medium">YouTube IFrame + AudioContext</span>
              </div>
              <div className="flex justify-between">
                <span>Room Sync</span>
                <span className="text-white font-medium">PostgreSQL + Realtime Channels</span>
              </div>
              <div className="flex justify-between">
                <span>Radio Engine</span>
                <span className="text-white font-medium">12 Regional Stations Infinite Stream</span>
              </div>
            </div>
            <button
              onClick={() => setShowAboutModal(false)}
              className="w-full py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white cursor-pointer transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
