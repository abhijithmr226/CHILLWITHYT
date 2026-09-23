import React from 'react';
import { useStore } from '../store/useStore';
import { audioManager } from '../services/audio/AudioManager';
import { Song } from '../types';
import { ArrowLeft, Play, Shuffle, Heart, Plus, Trash2, Clock } from 'lucide-react';

interface PlaylistDetailPageProps {
  playlistId: string;
  onNavigate: (path: string) => void;
}

export const PlaylistDetailPage: React.FC<PlaylistDetailPageProps> = ({ playlistId, onNavigate }) => {
  const [state, store] = useStore();
  const playlist = state.playlists.find((p) => p.id === playlistId) || state.playlists[0];

  if (!playlist) {
    return (
      <div className="p-8 text-center text-xs text-[#94A3B8]">
        Playlist not found.
      </div>
    );
  }

  const handlePlayAll = () => {
    if (playlist.songs.length > 0) {
      audioManager.playSong(playlist.songs[0], playlist.songs);
    }
  };

  const handleShufflePlay = () => {
    if (playlist.songs.length > 0) {
      const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5);
      audioManager.playSong(shuffled[0], shuffled);
    }
  };

  const handlePlaySong = (song: Song) => {
    audioManager.playSong(song, playlist.songs);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 select-none">
      {/* Back button */}
      <button
        onClick={() => onNavigate('/playlists')}
        className="flex items-center gap-2 text-xs font-semibold text-[#94A3B8] hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Playlists</span>
      </button>

      {/* Playlist Hero Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 p-6 rounded-3xl bg-[#212121] border border-[#272727]">
        <img
          src={playlist.coverUrl}
          alt={playlist.name}
          className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl object-cover shadow-2xl ring-2 ring-white/10 shrink-0"
        />

        <div className="space-y-3 text-center sm:text-left flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF0000] bg-[#FF0000]/10 px-2.5 py-0.5 rounded-full border border-[#FF0000]/25">
            Playlist
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight truncate">
            {playlist.name}
          </h1>
          <p className="text-xs sm:text-sm text-[#AAAAAA] line-clamp-2">{playlist.description}</p>
          <p className="text-xs text-[#717171]">
            By <span className="text-white font-medium">{playlist.ownerName}</span> • {playlist.songs.length} songs
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white font-semibold text-xs transition shadow-lg hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Play</span>
            </button>
            <button
              onClick={handleShufflePlay}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#272727] hover:bg-[#383838] border border-[#383838] text-white font-semibold text-xs transition cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Shuffle</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm(`Delete playlist "${playlist.name}"?`)) {
                  store.deletePlaylist(playlist.id);
                  onNavigate('/playlists');
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#272727] hover:bg-red-950/40 hover:text-red-400 hover:border-red-800/50 border border-[#383838] text-[#888888] font-semibold text-xs transition cursor-pointer"
              title="Delete this playlist"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete Playlist</span>
            </button>
          </div>
        </div>
      </div>

      {/* Song Table */}
      <div className="bg-[#212121] border border-[#272727] rounded-2xl overflow-hidden shadow-lg">
        <div className="grid grid-cols-12 px-4 py-3 border-b border-[#272727] text-[11px] font-bold uppercase tracking-wider text-[#717171]">
          <span className="col-span-1 text-center">#</span>
          <span className="col-span-6 sm:col-span-5">Title</span>
          <span className="col-span-3 sm:col-span-4 hidden sm:block">Album</span>
          <span className="col-span-5 sm:col-span-2 text-right flex items-center justify-end gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Duration</span>
          </span>
        </div>

        <div className="divide-y divide-[#272727]">
          {playlist.songs.map((song, index) => {
            const isLiked = state.likedSongIds.includes(song.id);
            return (
              <div
                key={song.id}
                className="grid grid-cols-12 items-center px-4 py-2.5 hover:bg-[#272727] transition group text-xs text-[#AAAAAA]"
              >
                <span className="col-span-1 text-center font-mono text-[#717171] group-hover:hidden">
                  {index + 1}
                </span>
                <button
                  onClick={() => handlePlaySong(song)}
                  className="col-span-1 text-center hidden group-hover:flex items-center justify-center text-white"
                >
                  <Play className="w-3.5 h-3.5 fill-current text-[#FF0000]" />
                </button>

                <div
                  onClick={() => handlePlaySong(song)}
                  className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0 cursor-pointer"
                >
                  <img src={song.artwork} alt={song.title} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate group-hover:text-[#FF4D4D] transition">
                      {song.title}
                    </p>
                    <p className="text-[11px] text-[#717171] truncate">{song.artist}</p>
                  </div>
                </div>

                <span className="col-span-3 sm:col-span-4 truncate hidden sm:block text-xs">
                  {song.album || 'Single'}
                </span>

                <div className="col-span-5 sm:col-span-2 flex items-center justify-end gap-2 shrink-0 font-mono text-[11px]">
                  <span>{formatDuration(song.duration)}</span>
                  <button
                    onClick={() => store.toggleLikeSong(song.id)}
                    className={`p-1 rounded transition ${isLiked ? 'text-[#FF0000]' : 'text-[#717171] hover:text-white'}`}
                    title="Like song"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => audioManager.addToQueue(song)}
                    className="p-1 text-[#717171] hover:text-white transition"
                    title="Add to queue"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      store.removeSongFromPlaylist(playlist.id, song.id);
                    }}
                    className="p-1 text-[#717171] hover:text-red-400 transition"
                    title="Remove from playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
