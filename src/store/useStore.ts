import { useState, useEffect } from 'react';
import { 
  UserProfile, 
  UserMusicPreferences,
  Room, 
  Song, 
  Playlist, 
  VisualizerConfig, 
  ChatMessage, 
  FloatingReaction, 
  QueueItem, 
  RoomMember, 
  MemberRole,
  AppSettings 
} from '../types';
import { DEFAULT_TRACKS, DEFAULT_PLAYLISTS } from '../services/audio/DefaultMusicProvider';
import { SupabaseDbService } from '../services/supabase/db';
import { FirebaseAuthService } from '../services/firebase/auth';
import { audioManager } from '../services/audio/AudioManager';
import { MusicService } from '../services/audio/MusicService';
import { getDiceBearAvatar } from '../utils/avatar';

const STORAGE_KEYS = {
  SETTINGS: 'chillwithyt_settings',
  THEME: 'chillwithyt_theme',
  ACCENT: 'chillwithyt_accent',
  VISUALIZER: 'chillwithyt_visualizer',
  LIKED: 'chillwithyt_liked_songs',
  LIKED_SONGS_DATA: 'chillwithyt_liked_songs_data',
  PLAYLISTS: 'chillwithyt_playlists',
  ROOMS: 'chillwithyt_rooms',
  USER: 'chillwithyt_user',
  AUTH: 'chillwithyt_is_auth',
  PREFERENCES: 'chillwithyt_preferences',
  HISTORY: 'chillwithyt_history',
  LIKED_RECOMMENDATION: 'chillwithyt_liked_recommendation',
};

export const DEFAULT_SETTINGS: AppSettings = {
  autoplay: true,
  audioNormalization: true,
  highQualityAudio: true,
  crossfadeDuration: 3,
  strictZeroShorts: true,
  defaultRegion: 'IN',
  defaultRoomPrivacy: 'public',
  defaultPlaybackMode: 'dj_controlled',
  showListeningActivity: true,
  chatSoundEffects: true,
  floatingReactionsEnabled: true,
  syncDriftThresholdMs: 1000,
  privateProfile: false,
  allowFriendInvites: true,
};

// Default mock current user
export const DEFAULT_USER: UserProfile = {
  id: 'user-alex',
  username: 'alex',
  displayName: 'Alex Carter',
  avatarUrl: getDiceBearAvatar('alex'),
  bio: 'Good music. Better company. 🎧',
  createdAt: '2025-10-12T00:00:00Z',
  stats: {
    roomsCreated: 12,
    playlistsCount: 8,
    songsPlayed: 542,
  },
};

export const INITIAL_ROOMS: Room[] = [];

interface AppState {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  musicPreferences: UserMusicPreferences | null;
  rooms: Room[];
  currentRoom: Room | null;
  roomMembers: RoomMember[];
  roomChat: ChatMessage[];
  roomReactions: FloatingReaction[];
  roomQueue: QueueItem[];
  playlists: Playlist[];
  likedSongIds: string[];
  likedSongs: Song[];
  lastLikedRecommendation: {
    seedSong: Song;
    recommendations: Song[];
    updatedAt: number;
  } | null;
  history: { song: Song; playedAt: string }[];
  visualizerConfig: VisualizerConfig;
  theme: 'dark' | 'light';
  accentColor: string;
  isDJModeActive: boolean;
  settings: AppSettings;

  // Modals
  isAuthModalOpen: boolean;
  isCreateRoomModalOpen: boolean;
  isQueueDrawerOpen: boolean;
  isFullScreenPlayerOpen: boolean;
  isVisualizerOptionsOpen: boolean;
  isShortcutsModalOpen: boolean;
  isTasteOnboardingOpen: boolean;
  isAIPlaylistModalOpen: boolean;
}

const initialVisualizerConfig: VisualizerConfig = {
  mode: 'AutoAdaptive',
  colorScheme: 'red',
  speed: 1.5,
  intensity: 75,
  beatSensitivity: 80,
};

// Global Store singleton for lightweight, bulletproof state
class Store {
  private state: AppState = {
    currentUser: DEFAULT_USER,
    isAuthenticated: true,
    musicPreferences: null,
    rooms: INITIAL_ROOMS,
    currentRoom: null,
    roomMembers: [],
    roomChat: [],
    roomReactions: [],
    roomQueue: [],
    playlists: DEFAULT_PLAYLISTS,
    likedSongIds: ['track-1', 'track-2', 'track-7'],
    likedSongs: DEFAULT_TRACKS.filter(t => ['track-1', 'track-2', 'track-7'].includes(t.id)),
    lastLikedRecommendation: {
      seedSong: DEFAULT_TRACKS[0],
      recommendations: DEFAULT_TRACKS.slice(1, 7),
      updatedAt: Date.now(),
    },
    history: [
      { song: DEFAULT_TRACKS[0], playedAt: '2 hours ago' },
      { song: DEFAULT_TRACKS[1], playedAt: '3 hours ago' },
      { song: DEFAULT_TRACKS[6], playedAt: 'Yesterday' },
      { song: DEFAULT_TRACKS[7], playedAt: 'Yesterday' },
    ],
    visualizerConfig: initialVisualizerConfig,
    theme: 'dark',
    accentColor: '#FF0000',
    isDJModeActive: false,
    settings: DEFAULT_SETTINGS,

    isAuthModalOpen: false,
    isCreateRoomModalOpen: false,
    isQueueDrawerOpen: false,
    isFullScreenPlayerOpen: false,
    isVisualizerOptionsOpen: false,
    isShortcutsModalOpen: false,
    isTasteOnboardingOpen: false,
    isAIPlaylistModalOpen: false,
  };

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
    this.initSupabaseRooms();
    this.initSupabasePlaylists();

    if (typeof window !== 'undefined') {
      window.addEventListener('chillwithyt:song_played', (e: any) => {
        if (e.detail) {
          this.recordSongPlayed(e.detail);
        }
      });
    }
  }

  private loadFromStorage() {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) {
        this.state.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      }

      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        this.state.theme = savedTheme;
      }

      const savedAccent = localStorage.getItem(STORAGE_KEYS.ACCENT);
      if (savedAccent) {
        this.state.accentColor = savedAccent;
        document.documentElement.style.setProperty('--accent', savedAccent);
        document.documentElement.style.setProperty('--accent-glow', `${savedAccent}55`);
      }

      const savedVisualizer = localStorage.getItem(STORAGE_KEYS.VISUALIZER);
      if (savedVisualizer) {
        this.state.visualizerConfig = { ...initialVisualizerConfig, ...JSON.parse(savedVisualizer) };
      }

      const savedLiked = localStorage.getItem(STORAGE_KEYS.LIKED);
      if (savedLiked) {
        this.state.likedSongIds = JSON.parse(savedLiked);
      }

      const savedLikedData = localStorage.getItem(STORAGE_KEYS.LIKED_SONGS_DATA);
      if (savedLikedData) {
        try {
          const parsed = JSON.parse(savedLikedData);
          if (Array.isArray(parsed)) {
            this.state.likedSongs = parsed;
          }
        } catch {}
      } else {
        this.state.likedSongs = DEFAULT_TRACKS.filter(t => this.state.likedSongIds.includes(t.id));
      }

      const savedLikedRec = localStorage.getItem(STORAGE_KEYS.LIKED_RECOMMENDATION);
      if (savedLikedRec) {
        try {
          this.state.lastLikedRecommendation = JSON.parse(savedLikedRec);
        } catch {}
      }

      const savedPlaylists = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      if (savedPlaylists) {
        const parsed = JSON.parse(savedPlaylists);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.state.playlists = parsed;
        }
      }

      // Purge all rooms and reset state to empty
      localStorage.removeItem(STORAGE_KEYS.ROOMS);
      this.state.rooms = [];

      const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.state.history = parsed;
          }
        } catch {}
      }

      const savedPrefs = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (savedPrefs) {
        try {
          const parsed = JSON.parse(savedPrefs);
          this.state.musicPreferences = parsed;
          if (!parsed.completedOnboarding) {
            this.state.isTasteOnboardingOpen = true;
          }
        } catch {
          this.state.isTasteOnboardingOpen = true;
        }
      } else {
        // First-time user: automatically trigger the interactive taste onboarding
        this.state.isTasteOnboardingOpen = true;
      }

      const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER);

      if (savedAuth === 'true' && savedUser) {
        this.state.isAuthenticated = true;
        this.state.currentUser = JSON.parse(savedUser);
      } else {
        // Default to persistent Guest identity
        const guest = FirebaseAuthService.createGuestUser();
        this.state.isAuthenticated = false;
        this.state.currentUser = {
          ...DEFAULT_USER,
          id: guest.id,
          username: guest.username,
          displayName: guest.displayName,
          avatarUrl: DEFAULT_USER.avatarUrl,
        };
      }
    } catch (e) {
      console.warn('Could not load cached state from localStorage:', e);
    }
  }

  private saveToStorage(updates: Partial<AppState>) {
    try {
      if (updates.settings) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.state.settings));
      }
      if (updates.theme) {
        localStorage.setItem(STORAGE_KEYS.THEME, updates.theme);
      }
      if (updates.accentColor) {
        localStorage.setItem(STORAGE_KEYS.ACCENT, updates.accentColor);
      }
      if (updates.visualizerConfig) {
        localStorage.setItem(STORAGE_KEYS.VISUALIZER, JSON.stringify(this.state.visualizerConfig));
      }
      if (updates.likedSongIds) {
        localStorage.setItem(STORAGE_KEYS.LIKED, JSON.stringify(updates.likedSongIds));
      }
      if (updates.likedSongs) {
        localStorage.setItem(STORAGE_KEYS.LIKED_SONGS_DATA, JSON.stringify(updates.likedSongs));
      }
      if (updates.playlists) {
        localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(updates.playlists));
      }
      if (updates.rooms) {
        localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(this.state.rooms));
      }
      if (updates.currentUser !== undefined) {
        if (updates.currentUser) {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updates.currentUser));
        } else {
          localStorage.removeItem(STORAGE_KEYS.USER);
        }
      }
      if (updates.isAuthenticated !== undefined) {
        localStorage.setItem(STORAGE_KEYS.AUTH, updates.isAuthenticated ? 'true' : 'false');
      }
      if (updates.musicPreferences !== undefined) {
        if (updates.musicPreferences) {
          localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updates.musicPreferences));
        } else {
          localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
        }
      }
      if (updates.history) {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updates.history));
      }
    } catch {
      // LocalStorage full or quota restricted
    }
  }

  public clearAllRooms() {
    this.setState({ rooms: [] });
    try {
      localStorage.removeItem(STORAGE_KEYS.ROOMS);
    } catch {}
  }

  private async initSupabaseRooms() {
    // Rooms are empty by default unless explicitly created by user
  }

  private async initSupabasePlaylists() {
    try {
      const realPlaylists = await SupabaseDbService.fetchPlaylists();
      if (realPlaylists.length > 0) {
        // Merge with existing avoiding duplicate IDs
        const existingIds = new Set(this.state.playlists.map(p => p.id));
        const newOnes = realPlaylists.filter(p => !existingIds.has(p.id));
        if (newOnes.length > 0) {
          this.setState({ playlists: [...this.state.playlists, ...newOnes] });
        }
      }
    } catch {
      // Handled
    }
  }

  public getState(): AppState {
    return this.state;
  }

  public setState(updates: Partial<AppState>) {
    this.state = { ...this.state, ...updates };
    this.saveToStorage(updates);
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  // Action helpers
  public openTasteOnboarding() {
    this.setState({ isTasteOnboardingOpen: true });
  }

  public closeTasteOnboarding() {
    this.setState({ isTasteOnboardingOpen: false });
  }

  public openAIPlaylistModal() {
    this.setState({ isAIPlaylistModalOpen: true });
  }

  public closeAIPlaylistModal() {
    this.setState({ isAIPlaylistModalOpen: false });
  }

  public saveMusicPreferences(prefs: UserMusicPreferences) {
    const timestamp = new Date().toISOString();
    const finalizedPrefs: UserMusicPreferences = {
      ...prefs,
      completedOnboarding: true,
      completedAt: timestamp,
    };

    // Synthesize 3 customized playlists tailored to the user's choices
    const primaryLang = prefs.primaryLanguage || prefs.languages[0] || 'My';
    const topArtist = prefs.artists[0] || 'Top Artist';
    const topGenre = prefs.genres[0] || 'Late Night Chill';

    const allTracks = [...DEFAULT_TRACKS];

    // Filter tracks matching chosen languages
    const langLower = prefs.languages.map(l => l.toLowerCase());
    const langTracks = allTracks.filter(s => 
      s.tags?.some(t => langLower.includes(t.toLowerCase())) ||
      langLower.some(l => s.title.toLowerCase().includes(l) || s.artist.toLowerCase().includes(l))
    );
    const blendSongs = langTracks.length >= 3 ? langTracks.slice(0, 10) : allTracks.slice(0, 8);

    // Filter tracks matching top artists
    const artistLower = prefs.artists.map(a => a.toLowerCase());
    const artistTracks = allTracks.filter(s => 
      artistLower.some(a => s.artist.toLowerCase().includes(a) || s.title.toLowerCase().includes(a))
    );
    const radioSongs = artistTracks.length >= 2 ? artistTracks.slice(0, 10) : allTracks.slice(2, 9);

    // Vibe songs
    const vibeSongs = allTracks.slice(3, 11);

    const synthesizedPlaylists: Playlist[] = [
      {
        id: `pl-taste-blend-${Date.now()}`,
        name: `✨ Made For You • ${primaryLang} Blend`,
        description: `Custom blend reflecting your love for ${prefs.languages.slice(0, 3).join(', ')} and ${topGenre}.`,
        coverUrl: blendSongs[0]?.artwork || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&fit=crop',
        ownerId: this.state.currentUser?.id || 'guest',
        ownerName: this.state.currentUser?.displayName || 'ChillWithYT',
        songsCount: blendSongs.length,
        totalDuration: blendSongs.reduce((acc, s) => acc + (s.duration || 0), 0),
        privacy: 'public',
        isCollaborative: false,
        songs: blendSongs,
        createdAt: timestamp,
      },
      {
        id: `pl-taste-artist-${Date.now() + 1}`,
        name: `🔥 ${topArtist} & Friends Radio`,
        description: `Deep cuts & essentials inspired by ${prefs.artists.slice(0, 4).join(', ')}.`,
        coverUrl: radioSongs[0]?.artwork || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&fit=crop',
        ownerId: this.state.currentUser?.id || 'guest',
        ownerName: this.state.currentUser?.displayName || 'ChillWithYT',
        songsCount: radioSongs.length,
        totalDuration: radioSongs.reduce((acc, s) => acc + (s.duration || 0), 0),
        privacy: 'public',
        isCollaborative: false,
        songs: radioSongs,
        createdAt: timestamp,
      },
      {
        id: `pl-taste-vibe-${Date.now() + 2}`,
        name: `🌙 ${topGenre} Mood Session`,
        description: `Handcrafted flow for your ${topGenre} chillouts.`,
        coverUrl: vibeSongs[0]?.artwork || 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&fit=crop',
        ownerId: this.state.currentUser?.id || 'guest',
        ownerName: this.state.currentUser?.displayName || 'ChillWithYT',
        songsCount: vibeSongs.length,
        totalDuration: vibeSongs.reduce((acc, s) => acc + (s.duration || 0), 0),
        privacy: 'public',
        isCollaborative: false,
        songs: vibeSongs,
        createdAt: timestamp,
      }
    ];

    const updatedPlaylists = [...synthesizedPlaylists, ...this.state.playlists];
    this.setState({
      musicPreferences: finalizedPrefs,
      isTasteOnboardingOpen: false,
      playlists: updatedPlaylists,
    });

    synthesizedPlaylists.forEach(pl => {
      SupabaseDbService.syncPlaylist(pl).catch(() => {});
    });
  }

  public toggleLikeSong(songId: string, songObj?: Song) {
    const isLiked = this.state.likedSongIds.includes(songId);
    const updatedIds = isLiked
      ? this.state.likedSongIds.filter(id => id !== songId)
      : [...this.state.likedSongIds, songId];

    let targetSong: Song | undefined = songObj;
    if (!targetSong) {
      if (audioManager.getState().currentSong?.id === songId) {
        targetSong = audioManager.getState().currentSong!;
      } else {
        targetSong = DEFAULT_TRACKS.find(t => t.id === songId);
      }
    }
    if (!targetSong) {
      targetSong = this.state.history.find(h => h.song.id === songId)?.song;
    }
    if (!targetSong) {
      for (const pl of this.state.playlists) {
        const match = pl.songs.find(s => s.id === songId);
        if (match) {
          targetSong = match;
          break;
        }
      }
    }

    const currentLikedSongs = this.state.likedSongs || [];
    const updatedSongs = isLiked
      ? currentLikedSongs.filter(s => s.id !== songId)
      : targetSong
      ? [targetSong, ...currentLikedSongs.filter(s => s.id !== songId)]
      : currentLikedSongs;

    this.setState({ likedSongIds: updatedIds, likedSongs: updatedSongs });

    if (!isLiked && targetSong) {
      // Broadcast custom event for RadioEngine
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('chillwithyt:song_liked', { detail: { songId, song: targetSong } }));
        }

        // Fetch intelligent recommendations asynchronously
        MusicService.getRecommendationsForSong(targetSong, 8).then((recs) => {
          if (recs && recs.length > 0 && targetSong) {
            const likedRecPayload = {
              seedSong: targetSong,
              recommendations: recs,
              updatedAt: Date.now(),
            };
            this.setState({ lastLikedRecommendation: likedRecPayload });
            try {
              localStorage.setItem(STORAGE_KEYS.LIKED_RECOMMENDATION, JSON.stringify(likedRecPayload));
            } catch {}
          }
        }).catch(() => {});
    }
  }

  public async refreshLikedRecommendations(seed?: Song) {
    const targetSong = seed || this.state.lastLikedRecommendation?.seedSong || audioManager.getState().currentSong || DEFAULT_TRACKS[0];
    if (!targetSong) return;
    try {
      const recs = await MusicService.getRecommendationsForSong(targetSong, 8);
      if (recs && recs.length > 0) {
        const likedRecPayload = {
          seedSong: targetSong,
          recommendations: recs,
          updatedAt: Date.now(),
        };
        this.setState({ lastLikedRecommendation: likedRecPayload });
        try {
          localStorage.setItem(STORAGE_KEYS.LIKED_RECOMMENDATION, JSON.stringify(likedRecPayload));
        } catch {}
      }
    } catch {}
  }

  public createPlaylist(name: string, description: string, coverUrl?: string) {
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      description,
      coverUrl: coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&fit=crop',
      ownerId: this.state.currentUser?.id || 'guest',
      ownerName: this.state.currentUser?.displayName || 'Guest',
      songsCount: 0,
      totalDuration: 0,
      privacy: 'public',
      isCollaborative: false,
      songs: [],
      createdAt: new Date().toISOString(),
    };
    this.setState({ playlists: [newPlaylist, ...this.state.playlists] });
    SupabaseDbService.syncPlaylist(newPlaylist).catch(() => {});
    return newPlaylist;
  }

  public createPlaylistWithSongs(name: string, description: string, coverUrl: string, songs: Song[]) {
    const totalDuration = songs.reduce((acc, s) => acc + (s.duration || 0), 0);
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      description,
      coverUrl: coverUrl || (songs[0]?.artwork || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&fit=crop'),
      ownerId: this.state.currentUser?.id || 'guest',
      ownerName: this.state.currentUser?.displayName || 'Guest',
      songsCount: songs.length,
      totalDuration,
      privacy: 'public',
      isCollaborative: false,
      songs,
      createdAt: new Date().toISOString(),
    };
    this.setState({ playlists: [newPlaylist, ...this.state.playlists] });
    SupabaseDbService.syncPlaylist(newPlaylist).catch(() => {});
    return newPlaylist;
  }

  public addSongToPlaylist(playlistId: string, song: Song) {
    const playlists = this.state.playlists.map(p => {
      if (p.id === playlistId) {
        if (p.songs.some(s => s.id === song.id)) return p;
        const updatedSongs = [...p.songs, song];
        const updated = {
          ...p,
          songs: updatedSongs,
          songsCount: updatedSongs.length,
          totalDuration: (p.totalDuration || 0) + (song.duration || 0),
        };
        SupabaseDbService.syncPlaylist(updated).catch(() => {});
        return updated;
      }
      return p;
    });
    this.setState({ playlists });
  }

  public createRoom(roomData: Partial<Room> & { seedSong?: Song | null; initialQueue?: Song[] }): Room {
    const user = this.state.currentUser;
    const initialTrack = roomData.seedSong || roomData.currentSong || (roomData.initialQueue && roomData.initialQueue[0]) || DEFAULT_TRACKS[0];
    const initialQueue = roomData.initialQueue && roomData.initialQueue.length > 0 
      ? roomData.initialQueue 
      : [initialTrack];

    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name: roomData.name || 'Untitled Room',
      description: roomData.description || 'Welcome to the room!',
      coverUrl: roomData.coverUrl || initialTrack.artwork || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&fit=crop',
      privacy: roomData.privacy || 'public',
      ownerId: user?.id || 'guest',
      ownerName: user?.displayName || 'Room Host',
      ownerAvatar: user?.avatarUrl || getDiceBearAvatar(user?.displayName || 'host'),
      membersCount: 1,
      maxMembers: roomData.maxMembers || 50,
      playbackMode: roomData.playbackMode || 'host_controlled',
      currentSong: initialTrack,
      currentPlaybackPosition: 0,
      playbackStartedAt: Date.now(),
      isPlaying: true,
      tags: roomData.tags && roomData.tags.length > 0 ? roomData.tags : ['Live', 'Chill'],
      trackCount: initialQueue.length,
      playlistCovers: (initialQueue.length >= 4)
        ? initialQueue.slice(0, 4).map((s) => s.artwork).filter(Boolean)
        : undefined,
      createdAt: new Date().toISOString(),
    };

    const initialQueueItems: QueueItem[] = initialQueue.map((s, idx) => ({
      id: `q-${Date.now()}-${idx}`,
      song: s,
      addedBy: {
        id: user?.id || 'guest',
        username: user?.displayName || 'Host',
        avatarUrl: user?.avatarUrl || getDiceBearAvatar(user?.displayName || 'host'),
      },
      addedAt: Date.now(),
      votes: {
        skip: 0,
        keep: 1,
        userVote: 'keep',
      },
    }));

    const updatedRooms = [newRoom, ...this.state.rooms];
    this.setState({ 
      rooms: updatedRooms, 
      currentRoom: newRoom,
      roomQueue: initialQueueItems
    });

    // Start playing the room's primary track
    if (initialTrack) {
      audioManager.playSong(initialTrack, initialQueue);
    }

    // Sync to real Supabase PostgreSQL backend
    SupabaseDbService.createRoom(newRoom, user?.id || 'guest').catch((err) => {
      console.warn('Supabase createRoom sync notice:', err);
    });

    return newRoom;
  }

  public updateRoom(roomId: string, updates: Partial<Room>) {
    const rooms = this.state.rooms.map((r) => (r.id === roomId ? { ...r, ...updates } : r));
    const currentRoom = this.state.currentRoom?.id === roomId 
      ? { ...this.state.currentRoom, ...updates }
      : this.state.currentRoom;
    this.setState({ rooms, currentRoom });
  }

  public updateVisualizerConfig(updates: Partial<VisualizerConfig>) {
    this.setState({
      visualizerConfig: { ...this.state.visualizerConfig, ...updates }
    });
  }

  public setAccentColor(color: string) {
    this.setState({ accentColor: color });
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--accent-glow', `${color}55`);
  }

  public updateSettings(updates: Partial<AppSettings>) {
    const updated = { ...this.state.settings, ...updates };
    this.setState({ settings: updated });
    if (updates.autoplay !== undefined) {
      audioManager.setAutoplay(updates.autoplay);
    }
  }

  public updateUserProfile(updates: Partial<UserProfile>) {
    if (!this.state.currentUser) return;
    const updatedUser = { ...this.state.currentUser, ...updates };
    this.setState({ currentUser: updatedUser });
    SupabaseDbService.syncProfile(updatedUser).catch(() => {});
  }

  public recordSongPlayed(song: Song) {
    const current = this.state.history.filter(h => h.song.id !== song.id);
    const updated = [{ song, playedAt: 'Just now' }, ...current].slice(0, 30);
    this.setState({ history: updated });
  }

  public clearHistory() {
    this.setState({ history: [] });
  }

  public resetPlaylistsToDefault() {
    this.setState({ playlists: DEFAULT_PLAYLISTS });
  }

  public deletePlaylist(playlistId: string) {
    const playlists = this.state.playlists.filter(p => p.id !== playlistId);
    this.setState({ playlists });
    SupabaseDbService.deletePlaylist(playlistId).catch(() => {});
  }

  public removeSongFromPlaylist(playlistId: string, songId: string) {
    const playlists = this.state.playlists.map(p => {
      if (p.id === playlistId) {
        const remaining = p.songs.filter(s => s.id !== songId);
        const updated = {
          ...p,
          songs: remaining,
          songsCount: remaining.length,
          totalDuration: remaining.reduce((acc, s) => acc + (s.duration || 0), 0),
        };
        SupabaseDbService.syncPlaylist(updated).catch(() => {});
        return updated;
      }
      return p;
    });
    this.setState({ playlists });
  }

  public deleteRoom(roomId: string) {
    const rooms = this.state.rooms.filter(r => r.id !== roomId);
    const currentRoom = this.state.currentRoom?.id === roomId ? null : this.state.currentRoom;
    this.setState({ rooms, currentRoom });
    SupabaseDbService.deleteRoom(roomId).catch(() => {});
  }

  public async signOut() {
    await FirebaseAuthService.signOut().catch(() => {});
    const guest = FirebaseAuthService.createGuestUser();
    this.setState({
      currentUser: {
        ...DEFAULT_USER,
        id: guest.id,
        username: guest.username,
        displayName: guest.displayName,
        avatarUrl: DEFAULT_USER.avatarUrl,
      },
      isAuthenticated: false,
    });
  }
}

export const store = new Store();

// React Hook
export function useStore(): [AppState, typeof store] {
  const [state, setState] = useState<AppState>(store.getState());

  useEffect(() => {
    return store.subscribe(() => {
      setState(store.getState());
    });
  }, []);

  return [state, store];
}
