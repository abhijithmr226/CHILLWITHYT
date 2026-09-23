import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { DEFAULT_TRACKS } from '../services/audio/DefaultMusicProvider';
import { audioManager } from '../services/audio/AudioManager';
import { resolveAvatar } from '../utils/avatar';
import { 
  User, 
  Settings, 
  Flame, 
  Radio, 
  ListMusic, 
  Headphones, 
  Play, 
  Heart,
  Share2,
  Check,
  History,
  Sparkles,
  Star
} from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (path: string) => void;
}

type ProfileTab = 'playlists' | 'liked' | 'history';

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const [state, store] = useStore();
  const [activeTab, setActiveTab] = useState<ProfileTab>('playlists');

  const user = state.currentUser;

  if (!user) {
    return (
      <div className="p-8 text-center text-xs text-[#AAAAAA]">
        Please sign in to view your profile.
      </div>
    );
  }

  const likedSongs = state.likedSongs && state.likedSongs.length > 0
    ? state.likedSongs
    : DEFAULT_TRACKS.filter((s) => state.likedSongIds.includes(s.id));

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 select-none">
      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#212121] border border-[#272727] flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-xl">
        <img
          src={resolveAvatar(user.avatarUrl, user.username || user.id)}
          alt={user.displayName}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-[#FF0000]/40 shadow-lg shrink-0"
        />

        <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {user.displayName}
              </h1>
              <p className="text-xs font-mono text-[#FF4D4D]">@{user.username}</p>
            </div>

            <div className="flex items-center gap-2 self-center sm:self-auto flex-wrap">
              <button
                onClick={() => store.openTasteOnboarding()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-xs font-semibold text-red-300 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Retune Music Taste</span>
              </button>
              <button
                onClick={() => onNavigate('/settings')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#272727] hover:bg-[#383838] border border-[#383838] text-xs font-semibold text-white transition cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#AAAAAA] max-w-md pt-1">{user.bio}</p>

          {/* User Music Taste Profile Badges */}
          {state.musicPreferences && (
            <div className="mt-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-white/40 font-bold uppercase tracking-wider text-[10px]">Taste DNA:</span>
              {state.musicPreferences.languages.map((l) => (
                <span key={l} className="px-2 py-0.5 rounded-md bg-white/10 text-white font-medium text-[11px]">{l}</span>
              ))}
              {state.musicPreferences.genres.map((g) => (
                <span key={g} className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 font-medium text-[11px]">{g}</span>
              ))}
              {state.musicPreferences.artists.slice(0, 3).map((a) => (
                <span key={a} className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-medium text-[11px] flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  <span>{a}</span>
                </span>
              ))}
            </div>
          )}

          {/* Stats Badges */}
          <div className="flex items-center justify-center sm:justify-start gap-6 pt-3 text-xs">
            <div>
              <span className="font-extrabold text-white text-base mr-1">
                {user.stats?.roomsCreated || 12}
              </span>
              <span className="text-[#AAAAAA]">Rooms</span>
            </div>
            <div>
              <span className="font-extrabold text-white text-base mr-1">
                {state.playlists.length}
              </span>
              <span className="text-[#AAAAAA]">Playlists</span>
            </div>
            <div>
              <span className="font-extrabold text-white text-base mr-1">
                {user.stats?.songsPlayed || 542}
              </span>
              <span className="text-[#AAAAAA]">Songs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#272727] pb-2">
        <button
          onClick={() => setActiveTab('playlists')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'playlists'
              ? 'bg-[#FF0000]/15 text-[#FF4D4D] border border-[#FF0000]/30'
              : 'text-[#AAAAAA] hover:text-white hover:bg-[#272727]'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          <span>Playlists ({state.playlists.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('liked')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'liked'
              ? 'bg-[#FF0000]/15 text-[#FF4D4D] border border-[#FF0000]/30'
              : 'text-[#AAAAAA] hover:text-white hover:bg-[#272727]'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Liked Songs ({likedSongs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[#FF0000]/15 text-[#FF4D4D] border border-[#FF0000]/30'
              : 'text-[#AAAAAA] hover:text-white hover:bg-[#272727]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>History ({state.history.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === 'playlists' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {state.playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => onNavigate(`/playlist/${pl.id}`)}
                className="group cursor-pointer rounded-2xl p-3 bg-[#212121] hover:bg-[#272727] border border-[#272727] hover:border-[#383838] transition"
              >
                <img src={pl.coverUrl} alt={pl.name} className="w-full aspect-video rounded-xl object-cover mb-2" />
                <h4 className="text-xs font-bold text-white truncate">{pl.name}</h4>
                <p className="text-[10px] text-[#AAAAAA] truncate mt-0.5">{pl.songsCount} tracks</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'liked' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {likedSongs.map((song) => (
              <div
                key={song.id}
                onClick={() => audioManager.playSong(song)}
                className="flex items-center justify-between p-3 rounded-xl bg-[#212121] hover:bg-[#272727] border border-[#272727] cursor-pointer transition group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <img src={song.artwork} alt={song.title} className="w-11 h-11 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-[#FF4D4D] transition">
                      {song.title}
                    </p>
                    <p className="text-[11px] text-[#AAAAAA] truncate">{song.artist}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    store.toggleLikeSong(song.id, song);
                  }}
                  className="p-2 text-[#FF0000] hover:scale-110 transition cursor-pointer"
                  title="Remove from liked songs"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-2">
            {state.history.map((item, idx) => (
              <div
                key={idx}
                onClick={() => audioManager.playSong(item.song)}
                className="flex items-center justify-between p-3 rounded-xl bg-[#212121] hover:bg-[#272727] border border-[#272727] cursor-pointer transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img src={item.song.artwork} alt={item.song.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate group-hover:text-[#FF4D4D] transition">
                      {item.song.title}
                    </p>
                    <p className="text-[11px] text-[#AAAAAA] truncate">{item.song.artist}</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-[#717171] shrink-0">{item.playedAt}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
