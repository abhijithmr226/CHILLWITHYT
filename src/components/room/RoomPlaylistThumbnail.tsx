import React from 'react';
import { Room } from '../../types';
import { ListMusic, Users, Globe, Lock, Mail } from 'lucide-react';

interface RoomPlaylistThumbnailProps {
  room: Room;
  className?: string;
  showDetails?: boolean;
}

export const RoomPlaylistThumbnail: React.FC<RoomPlaylistThumbnailProps> = ({
  room,
  className = 'h-44 sm:h-48',
  showDetails = true,
}) => {
  // If room has 4 covers, use them; otherwise fallback to dynamic 4-mosaic or single cover
  const covers = room.playlistCovers && room.playlistCovers.length >= 4 
    ? room.playlistCovers.slice(0, 4)
    : null;

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden bg-neutral-950 border border-white/10 shadow-lg group select-none ${className}`}>
      {/* Vinyl Record Peek Effect (Peeks out on right edge on hover) */}
      <div 
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-[#111111] border-2 border-neutral-700/80 shadow-2xl opacity-70 group-hover:opacity-100 group-hover:translate-x-4 transition-all duration-500 flex items-center justify-center pointer-events-none z-0"
        aria-hidden="true"
      >
        <div className="w-24 h-24 rounded-full border border-neutral-800 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border border-neutral-800 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF0000] to-rose-700 border border-white/30 flex items-center justify-center shadow-inner">
              <div className="w-3 h-3 rounded-full bg-black border border-white/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Artwork Surface: 2x2 Playlist Mosaic or Stacked Cover */}
      {covers ? (
        /* ── 4-QUADRANT PLAYLIST ALBUM COLLAGE ── */
        <div className="relative z-10 grid grid-cols-2 grid-rows-2 w-full h-full gap-[1.5px] bg-[#151515]">
          {covers.map((coverUrl, idx) => (
            <div key={idx} className="relative w-full h-full overflow-hidden bg-neutral-900">
              <img
                src={coverUrl}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
            </div>
          ))}
        </div>
      ) : (
        /* ── SINGLE COVER WITH PLAYLIST SLEEVE EFFECT ── */
        <div className="relative z-10 w-full h-full overflow-hidden bg-neutral-900">
          <img
            src={room.coverUrl}
            alt={room.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      )}

      {/* Dark Vignette Gradient Overlay */}
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/95 via-black/40 to-black/25 pointer-events-none" />

      {/* Top Overlay Badges */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-30 flex items-center justify-between pointer-events-none gap-2">
        {/* Left: LIVE and Playlist Indicator */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="flex items-center gap-1.5 bg-[#FF0000] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            LIVE
          </span>

          <span className="flex items-center gap-1 bg-black/75 backdrop-blur-md text-gray-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10 shadow-sm">
            <ListMusic className="w-3 h-3 text-[#FF4D4D]" />
            <span>Playlist • {room.trackCount || 24}+ Tracks</span>
          </span>
        </div>

        {/* Right: Listeners and Privacy */}
        <div className="flex items-center gap-1.5">
          <span className="bg-black/80 backdrop-blur-md text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1 shadow-sm">
            <Users className="w-3 h-3 text-emerald-400" />
            <span>{room.membersCount}</span>
          </span>

          <span className="bg-black/70 backdrop-blur-sm text-gray-300 text-[10px] p-1 rounded-full border border-white/10 flex items-center">
            {room.privacy === 'public' && <Globe className="w-3 h-3" />}
            {room.privacy === 'private' && <Lock className="w-3 h-3" />}
            {room.privacy === 'invite_only' && <Mail className="w-3 h-3" />}
          </span>
        </div>
      </div>

      {/* Bottom Overlay Info (Title & Description) */}
      {showDetails && (
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-30 pointer-events-none text-white">
          <h3 className="text-sm font-bold truncate group-hover:text-[#FF4D4D] transition">
            {room.name}
          </h3>
          <p className="text-[11px] text-[#AAAAAA] line-clamp-1 mt-0.5">{room.description}</p>
        </div>
      )}
    </div>
  );
};
