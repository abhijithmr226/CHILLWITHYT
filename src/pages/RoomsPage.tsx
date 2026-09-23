import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Room } from '../types';
import { resolveAvatar } from '../utils/avatar';
import { RoomPlaylistThumbnail } from '../components/room/RoomPlaylistThumbnail';
import { ResponsiveAdBanner } from '../components/ads/AdSlot';
import { 
  Radio, 
  Plus, 
  Users, 
  Globe, 
  Lock, 
  Mail, 
  Play, 
  Search, 
  Headphones, 
  Sparkles,
  Music2,
  Volume2,
  X
} from 'lucide-react';

interface RoomsPageProps {
  onNavigate: (path: string) => void;
}

export const RoomsPage: React.FC<RoomsPageProps> = ({ onNavigate }) => {
  const [state, store] = useStore();
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const tags = [
    'All', 
    'Malayalam', 
    'Tamil', 
    'Telugu', 
    'Hindi', 
    'Punjabi', 
    'English', 
    'Lofi', 
    'Retro', 
    'Indie'
  ];

  const totalListeners = useMemo(() => {
    return state.rooms.reduce((acc, r) => acc + (r.membersCount || 0), 0);
  }, [state.rooms]);

  const filteredRooms = useMemo(() => {
    return state.rooms.filter((room) => {
      // Tag filter
      if (selectedTag !== 'All') {
        const queryTag = selectedTag.toLowerCase();
        const matchesTag = room.tags?.some((t) => t.toLowerCase().includes(queryTag)) ||
          room.name.toLowerCase().includes(queryTag) ||
          room.description.toLowerCase().includes(queryTag);
        if (!matchesTag) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = 
          room.name.toLowerCase().includes(q) ||
          room.description.toLowerCase().includes(q) ||
          room.ownerName.toLowerCase().includes(q) ||
          room.tags?.some((t) => t.toLowerCase().includes(q)) ||
          room.currentSong?.title.toLowerCase().includes(q) ||
          room.currentSong?.artist.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      return true;
    });
  }, [state.rooms, selectedTag, searchQuery]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-7 select-none">
      {/* Header & Hero Callout */}
      <div className="bg-gradient-to-r from-[#212121] via-[#1A1A1A] to-[#212121] p-6 sm:p-8 rounded-3xl border border-[#2B2B2B] shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#272727] text-white text-xs font-semibold border border-[#383838]">
              <span className="w-2 h-2 rounded-full bg-[#FF0000] animate-ping" />
              <span>Listen Together In Real-Time • Synced YouTube Playback</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span>Listening Rooms</span>
              <Users className="w-7 h-7 text-[#FF0000]" />
            </h1>
            <p className="text-xs sm:text-sm text-[#AAAAAA] max-w-2xl leading-relaxed">
              Drop in and listen with friends across Malayalam, Tamil, Telugu, Hindi, Punjabi, English and Lofi audio spaces. Real-time synced music, open aux requests, and live community chat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {state.rooms.length > 0 && (
              <div className="px-4 py-2 rounded-2xl bg-[#141414] border border-[#272727] flex items-center gap-2.5 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <div className="text-left">
                  <p className="text-xs font-bold text-white">{totalListeners} Friends Listening</p>
                  <p className="text-[10px] text-[#AAAAAA]">{state.rooms.length} Active Rooms</p>
                </div>
              </div>
            )}

            <button
              onClick={() => store.setState({ isCreateRoomModalOpen: true })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF0000] to-rose-600 hover:from-[#CC0000] hover:to-rose-700 text-white font-bold text-xs transition shadow-lg shadow-red-900/40 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Room</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Language Filter Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#AAAAAA] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by room name, artist, language, or host..."
              className="w-full pl-10 pr-4 py-2 bg-[#212121] border border-[#2E2E2E] focus:border-[#FF0000] rounded-xl text-xs text-white placeholder-[#AAAAAA] focus:outline-none transition shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[#CCCCCC] hover:text-white transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-[#CCCCCC] font-medium">
            Showing <span className="text-white font-bold">{filteredRooms.length}</span> of {state.rooms.length} rooms
          </div>
        </div>

        {/* Filter Tags */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${
                selectedTag === tag
                  ? 'bg-gradient-to-r from-[#FF0000] to-rose-600 text-white font-bold shadow-md shadow-red-900/30'
                  : 'bg-[#212121] text-[#AAAAAA] hover:text-white hover:bg-[#272727] border border-[#2B2B2B]'
              }`}
            >
              {tag === 'All' ? 'All Languages' : tag}
            </button>
          ))}
        </div>
      </div>

      {/* ── SPONSORED BANNER (NON-INTRUSIVE) ── */}
      <ResponsiveAdBanner className="my-4" />

      {/* Rooms Grid */}
      {filteredRooms.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map((room, idx) => {
            const hostAvatar = resolveAvatar(room.ownerAvatar, room.ownerName);
            return (
              <div
                key={`${room.id}-${idx}`}
                onClick={() => onNavigate(`/room/${room.id}`)}
                className="group cursor-pointer rounded-2xl bg-gradient-to-b from-[#212121] to-[#181818] hover:from-[#262626] hover:to-[#1E1E1E] border border-[#2B2B2B] hover:border-[#FF0000]/60 p-4 transition duration-300 shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                {/* Playlist-Style Multi-Album Mosaic & Vinyl Peek */}
                <RoomPlaylistThumbnail room={room} className="h-44 sm:h-48" />

                {/* Middle: Host and Tags */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                    <img
                      src={hostAvatar}
                      alt={room.ownerName}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10 bg-neutral-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{room.ownerName}</p>
                      <p className="text-[10px] text-[#AAAAAA]">Host • Aux Controller</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {room.tags?.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-md bg-[#2B2B2B] text-[#CCCCCC] text-[10px] font-medium border border-[#383838]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom: Currently Playing Bar */}
                {room.currentSong ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0F0F0F] border border-[#272727] gap-2">
                    <div className="flex items-center gap-2 overflow-hidden min-w-0">
                      <div className="w-12 h-7 aspect-video rounded-md overflow-hidden bg-neutral-900 shrink-0 border border-white/10">
                        <img
                          src={room.currentSong.artwork}
                          alt={room.currentSong.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{room.currentSong.title}</p>
                        <p className="text-[10px] text-[#AAAAAA] truncate">{room.currentSong.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-end gap-0.5 h-3.5 px-1" title="Synchronized live audio">
                        <span className="w-0.5 h-2.5 bg-[#FF0000] rounded-full animate-pulse" />
                        <span className="w-0.5 h-3.5 bg-rose-400 rounded-full animate-bounce" />
                        <span className="w-0.5 h-1.5 bg-[#FF0000] rounded-full animate-pulse" />
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate(`/room/${room.id}`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF0000] to-rose-600 text-white text-xs font-bold hover:from-[#CC0000] hover:to-rose-700 transition shrink-0 shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <Headphones className="w-3 h-3" />
                        <span>Join</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0F0F0F] border border-[#272727]">
                    <span className="text-xs text-[#CCCCCC]">Waiting for host to play music</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(`/room/${room.id}`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#272727] hover:bg-[#383838] text-white text-xs font-semibold transition cursor-pointer"
                    >
                      Enter Room
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 text-center space-y-4 bg-[#1E1E1E]/50 rounded-3xl border border-[#2B2B2B] p-8">
          <div className="w-16 h-16 rounded-2xl bg-[#272727] text-white flex items-center justify-center mx-auto shadow-md">
            <Radio className="w-8 h-8 text-[#FF4D4D]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No listening rooms found</h3>
            <p className="text-xs text-[#AAAAAA] mt-1 max-w-md mx-auto">
              {searchQuery
                ? `No active rooms matching "${searchQuery}". Try a different keyword or create this room now.`
                : `No active rooms for ${selectedTag} currently. Be the first host to start one!`}
            </p>
          </div>
          <button
            onClick={() => store.setState({ isCreateRoomModalOpen: true })}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition shadow-lg shadow-red-900/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create a {selectedTag !== 'All' ? selectedTag : ''} Room Now</span>
          </button>
        </div>
      )}
    </div>
  );
};
