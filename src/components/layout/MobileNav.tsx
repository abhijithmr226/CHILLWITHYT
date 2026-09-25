import React from 'react';
import { Home, Compass, Radio, ListMusic, Heart } from 'lucide-react';

interface MobileNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentPath, onNavigate }) => {
  const tabs = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Discover', path: '/discover', icon: Compass },
    { label: 'Rooms', path: '/rooms', icon: Radio, isLive: true },
    { label: 'Playlists', path: '/playlists', icon: ListMusic },
    { label: 'Library', path: '/liked', icon: Heart },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-[#0A0A0C] border-t border-white/[0.07] flex items-center justify-around h-[calc(64px+env(safe-area-inset-bottom,0px))] px-1 select-none pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-8px_20px_rgba(0,0,0,0.6)] touch-manipulation">
      {tabs.map((tab) => {
        const active = currentPath === tab.path || (tab.path !== '/' && currentPath.startsWith(tab.path));
        const Icon = tab.icon;

        return (
          <button
            key={tab.path}
            onClick={() => onNavigate(tab.path)}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 min-h-[48px] transition-all duration-150 active:scale-95 cursor-pointer ${
              active ? 'text-[#FF0000]' : 'text-[#888888] hover:text-white'
            }`}
          >
            {active && (
              <span className="absolute top-0.5 w-6 h-0.5 rounded-full bg-[#FF0000] shadow-[0_0_8px_#FF0000]" />
            )}

            <div className="relative mt-1">
              <Icon className={`w-5 h-5 transition-transform duration-150 ${active ? 'scale-110 text-[#FF0000]' : ''}`} />
              {tab.isLive && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FF0000] ring-2 ring-[#0A0A0C] animate-pulse" />
              )}
            </div>

            <span className={`text-[10px] tracking-tight mt-1 ${active ? 'font-bold text-white' : 'font-medium text-[#888888]'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
