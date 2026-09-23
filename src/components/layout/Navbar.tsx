import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { Search, Plus, User, Disc, LogIn, Command, Users, Download, Clock, X, ArrowUpRight, TrendingUp, Compass, Zap, Flame, Radio, Moon, Coffee } from 'lucide-react';
import { resolveAvatar } from '../../utils/avatar';
import { MusicService } from '../../services/audio/MusicService';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onSearch?: (query: string) => void;
  onOpenInstallModal?: () => void;
}

const RECENT_SEARCHES_KEY = 'chillwithyt_recent_searches_v1';

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, onSearch, onOpenInstallModal }) => {
  const [state, store] = useStore();
  const [searchVal, setSearchVal] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveToRecent = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    store.recordSearch(trimmed);
    try {
      const updated = [trimmed, ...recentSearches.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const removeRecentSearch = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    store.removeSearchItem(item);
    try {
      const updated = recentSearches.filter((s) => s !== item);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    store.clearSearchHistory();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsDropdownOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !searchInputRef.current?.contains(e.target as Node) &&
        !mobileInputRef.current?.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions when query changes
  useEffect(() => {
    if (!searchVal.trim()) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    let isCurrent = true;
    const timer = setTimeout(async () => {
      const results = await MusicService.getSearchSuggestions(searchVal);
      if (isCurrent) {
        setSuggestions(results);
        setSelectedIndex(-1);
      }
    }, 150);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [searchVal]);

  const executeSearch = (targetQuery: string) => {
    const finalQuery = targetQuery.trim();
    if (!finalQuery) return;
    saveToRecent(finalQuery);
    setSearchVal(finalQuery);
    setIsDropdownOpen(false);
    setIsMobileSearchOpen(false);
    onSearch?.(finalQuery);
    // Always navigate to discover when explicitly executing a search
    if (currentPath !== '/discover') {
      onNavigate('/discover');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentList = searchVal.trim() ? suggestions : recentSearches;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsDropdownOpen(true);
      setSelectedIndex((prev) => (prev < currentList.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : currentList.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && currentList[selectedIndex]) {
        executeSearch(currentList[selectedIndex]);
      } else {
        executeSearch(searchVal);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchVal(val);
    setIsDropdownOpen(true);
    // Pass query up to parent live (DiscoverPage syncs via useEffect on initialQuery)
    // but do NOT navigate on every keystroke — wait for Enter or suggestion click
    onSearch?.(val);
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Discover', path: '/discover' },
    { label: 'Rooms', path: '/rooms' },
    { label: 'Playlists', path: '/playlists' },
  ];

  const POPULAR_QUICK_TAGS = [
    { label: 'Malayalam Hits', icon: Compass },
    { label: 'Anirudh Ravichander', icon: Zap },
    { label: 'Arijit Singh', icon: Flame },
    { label: 'Diljit Dosanjh', icon: Radio },
    { label: 'Bollywood Romance', icon: Moon },
    { label: 'Lofi Study Chill', icon: Coffee },
  ];

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-[#212121] border-b border-[#272727] px-4 lg:px-8 select-none">
      <div className="h-full flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate('/')} 
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,0,0,0.4)] group-hover:scale-105 transition shrink-0 flex items-center justify-center">
            <img
              src="/icon.png"
              alt="ChillWithYT Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-white flex items-center">
            ChillWith<span className="text-[#FF0000]">YT</span>
          </span>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 shrink-0">
          {navLinks.map((link) => {
            const active = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => onNavigate(link.path)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  active
                    ? 'bg-[#FF0000]/10 text-white border border-[#FF0000]/30 shadow-sm'
                    : 'text-[#AAAAAA] hover:text-white hover:bg-[#272727] border border-transparent'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Center Search Input with Instant Autocomplete Dropdown */}
        <div className="flex-1 max-w-md lg:max-w-xl relative hidden sm:block mx-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#AAAAAA] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchVal}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Search complete songs, artists, albums, or paste YouTube link..."
              aria-label="Search music, artists, rooms"
              className="w-full pl-10 pr-14 py-2.5 text-xs sm:text-sm rounded-xl bg-[#141416] border border-[#333338] text-white placeholder-[#888888] focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000]/40 focus:outline-none transition shadow-inner"
            />
            {searchVal ? (
              <button
                onClick={() => {
                  setSearchVal('');
                  onSearch?.('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-[#272727] text-[#AAAAAA] hover:text-white transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-[#CCCCCC] bg-[#222225] px-2 py-0.5 rounded-md border border-[#3A3A40] pointer-events-none font-mono">
                <Command className="w-2.5 h-2.5" />
                <span>K</span>
              </div>
            )}
          </div>

          {/* Autocomplete Predictions Dropdown */}
          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute left-0 right-0 top-full mt-2 bg-[#1A1A1A] border border-[#333333] rounded-2xl shadow-2xl py-2 z-50 overflow-hidden backdrop-blur-xl animate-fade-in"
            >
              {/* If query has text, show real-time YouTube suggestions */}
              {searchVal.trim() ? (
                <div>
                  <div className="px-3.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#717171] flex items-center justify-between">
                    <span>Suggestions</span>
                    <span className="text-red-500 font-bold">YouTube Music Live</span>
                  </div>

                  {suggestions.length > 0 ? (
                    <div className="mt-1 space-y-0.5">
                      {suggestions.map((item, idx) => (
                        <div
                          key={item}
                          onClick={() => executeSearch(item)}
                          className={`flex items-center justify-between px-3.5 py-2 text-xs cursor-pointer transition ${
                            selectedIndex === idx
                              ? 'bg-[#272727] text-white font-semibold pl-4'
                              : 'text-[#D1D1D1] hover:bg-[#222222] hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <Search className="w-3.5 h-3.5 text-[#FF0000] shrink-0" />
                            <span className="truncate">{item}</span>
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#717171] shrink-0 opacity-0 group-hover:opacity-100" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3.5 py-3 text-xs text-[#888888] flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Press Enter to search for "{searchVal}"</span>
                    </div>
                  )}
                </div>
              ) : (
                /* When search input is empty, show recent searches & quick trending tags */
                <div>
                  {recentSearches.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#717171] flex items-center justify-between">
                        <span>Recent Searches</span>
                        <button
                          onClick={clearAllRecent}
                          className="text-[10px] text-[#888888] hover:text-red-400 transition"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {recentSearches.map((item, idx) => (
                          <div
                            key={item}
                            onClick={() => executeSearch(item)}
                            className={`flex items-center justify-between px-3.5 py-2 text-xs cursor-pointer transition ${
                              selectedIndex === idx
                                ? 'bg-[#272727] text-white font-semibold'
                                : 'text-[#D1D1D1] hover:bg-[#222222] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <Clock className="w-3.5 h-3.5 text-[#717171] shrink-0" />
                              <span className="truncate">{item}</span>
                            </div>
                            <button
                              onClick={(e) => removeRecentSearch(e, item)}
                              className="p-1 rounded hover:bg-[#333333] text-[#717171] hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="px-3.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#717171] flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-[#FF0000]" />
                    <span>Popular Quick Searches</span>
                  </div>
                  <div className="px-3 py-2 flex flex-wrap gap-1.5">
                    {POPULAR_QUICK_TAGS.map((tag) => {
                      const Icon = tag.icon;
                      return (
                        <button
                          key={tag.label}
                          onClick={() => executeSearch(tag.label)}
                          className="px-2.5 py-1 rounded-lg bg-[#272727] hover:bg-[#333333] border border-[#383838] text-[11px] font-medium text-[#D1D1D1] hover:text-white transition cursor-pointer flex items-center gap-1.5"
                        >
                          <Icon className="w-3 h-3 text-[#FF4D4D]" />
                          <span>{tag.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Mobile Search Button */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="sm:hidden p-2 rounded-xl bg-[#272727] text-[#AAAAAA] hover:text-white"
            title="Search songs"
          >
            <Search className="w-4 h-4 text-[#FF0000]" />
          </button>

          <button
            onClick={() => onNavigate('/rooms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
              currentPath === '/rooms'
                ? 'bg-[#FF0000] border-[#FF0000] text-white shadow-[0_0_15px_rgba(255,0,0,0.4)]'
                : 'bg-[#272727] border-[#383838] text-white hover:bg-[#333333]'
            }`}
            title="Listen music together with friends"
          >
            <Users className="w-3.5 h-3.5 text-[#FF4D4D]" />
            <span className="hidden sm:inline">Listen With Friends</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => store.setState({ isCreateRoomModalOpen: true })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#272727] hover:bg-[#333333] border border-[#383838] hover:border-[#FF0000]/60 text-white text-xs font-semibold transition cursor-pointer"
            title="Create your own room"
          >
            <Plus className="w-3.5 h-3.5 text-[#FF0000]" />
            <span className="hidden sm:inline">Create Room</span>
          </button>

          {onOpenInstallModal && (
            <button
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600/20 to-orange-500/20 hover:from-red-600/30 hover:to-orange-500/30 border border-red-500/30 hover:border-red-500/60 text-white text-xs font-semibold transition cursor-pointer group"
              title="Add ChillWithYT to PC Desktop / Phone Home Screen"
            >
              <Download className="w-3.5 h-3.5 text-[#FF4D4D] group-hover:scale-110 transition" />
              <span className="hidden lg:inline">Add to Home Screen</span>
            </button>
          )}

          {state.isAuthenticated && state.currentUser ? (
            <div
              onClick={() => onNavigate('/profile')}
              className="flex items-center gap-2 p-1 pl-2 rounded-xl bg-[#272727] border border-[#383838] hover:border-[#4F4F4F] cursor-pointer transition"
            >
              <span className="text-xs font-medium text-white hidden md:inline">
                {state.currentUser.displayName}
              </span>
              <img
                src={resolveAvatar(state.currentUser.avatarUrl, state.currentUser.username || state.currentUser.id)}
                alt={state.currentUser.displayName}
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-[#383838]"
              />
            </div>
          ) : (
            <button
              onClick={() => store.setState({ isAuthModalOpen: true })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#272727] hover:bg-[#383838] border border-[#383838] text-xs font-semibold text-white transition"
            >
              <LogIn className="w-3.5 h-3.5 text-[#FF0000]" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Search Overlay Bar */}
      {isMobileSearchOpen && (
        <div className="sm:hidden absolute top-16 left-0 right-0 bg-[#1A1A1A] border-b border-[#272727] p-3 z-40 shadow-2xl">
          <div className="relative">
            <Search className="w-4 h-4 text-[#717171] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={mobileInputRef}
              type="text"
              autoFocus
              value={searchVal}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Search songs, artists..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-[#0F0F0F] border border-[#272727] text-white placeholder-[#717171] focus:border-[#FF0000] focus:outline-none"
            />
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#717171] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="mt-2 divide-y divide-[#272727]">
              {suggestions.slice(0, 5).map((item) => (
                <div
                  key={item}
                  onClick={() => executeSearch(item)}
                  className="py-2 px-2 text-xs text-[#D1D1D1] flex items-center justify-between"
                >
                  <span className="truncate">{item}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#717171]" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
