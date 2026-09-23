import React from 'react';
import { Home, Compass, Radio, Library, Search } from 'lucide-react';

interface MobileNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentPath, onNavigate }) => {
  const tabs = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Discover', path: '/discover', icon: Compass },
    { label: 'Rooms', path: '/rooms', icon: Radio, isLive: true },
    { label: 'Library', path: '/playlists', icon: Library },
    { label: 'Search', path: '/discover?focus=search', icon: Search },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-[#161618]/95 backdrop-blur-xl border-t border-[#27272A] flex items-center justify-around h-[calc(60px+env(safe-area-inset-bottom,0px))] px-2 select-none pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-10px_25px_rgba(0,0,0,0.5)] touch-manipulation">
      {tabs.map((tab) => {
        const active = currentPath === tab.path || (tab.path !== '/' && currentPath.startsWith(tab.path));
        const Icon = tab.icon;

        return (
          <button
            key={tab.path}
            onClick={() => onNavigate(tab.path)}
            className={`relative flex flex-col items-center justify-center flex-1 py-1 min-h-[48px] transition-all duration-150 active:scale-90 cursor-pointer ${
              active ? 'text-[#FF0000]' : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            {/* Active Pill Indicator */}
            {active && (
              <span className="absolute top-1 w-6 h-1 rounded-full bg-[#FF0000] shadow-[0_0_8px_#FF0000]" />
            )}

            <div className="relative mt-1">
              <Icon className={`w-5 h-5 transition-transform duration-150 ${active ? 'scale-110' : ''}`} />
              {tab.isLive && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#161618] animate-pulse" />
              )}
            </div>

            <span className={`text-[10px] tracking-tight mt-0.5 ${active ? 'font-bold text-white' : 'font-medium'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
