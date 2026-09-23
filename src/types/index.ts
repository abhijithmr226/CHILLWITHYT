export type VisualizerMode = 
  | 'AutoAdaptive' 
  | 'Circular' 
  | 'Spectrum' 
  | 'Wave' 
  | 'Particles' 
  | 'Minimal'
  | 'MassBass' 
  | 'LiquidLofi' 
  | 'RadialAurora'
  | 'Dalia3D';

export type RoomPrivacy = 'public' | 'private' | 'invite_only';

export type MemberRole = 'owner' | 'dj' | 'moderator' | 'member';

export type PlaybackMode = 'host_controlled' | 'dj_controlled' | 'community_voting';

export type RepeatMode = 'off' | 'queue' | 'song';

export interface UserMusicPreferences {
  languages: string[];     // e.g. ['Malayalam', 'Tamil', 'Hindi']
  genres: string[];        // e.g. ['Chill / Acoustic', 'Mass / Energetic', 'Bollywood Soul']
  artists: string[];       // e.g. ['Sushin Shyam', 'Anirudh Ravichander', 'Arijit Singh']
  primaryLanguage: string; // e.g. 'Malayalam'
  completedOnboarding: boolean;
  completedAt?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  email?: string;
  bio?: string;
  createdAt: string;
  stats?: {
    roomsCreated: number;
    playlistsCount: number;
    songsPlayed: number;
  };
  musicPreferences?: UserMusicPreferences;
}

export interface Song {
  id: string;
  source: 'youtube' | 'catalog' | 'stream';
  sourceId: string;
  title: string;
  artist: string;
  album?: string;
  artwork: string;
  duration: number; // in seconds
  audioUrl?: string; // direct audio stream or preview
  bpm?: number;
  tags?: string[];
}

export interface QueueItem {
  id: string;
  song: Song;
  addedBy: {
    id: string;
    username: string;
    avatarUrl: string;
  };
  addedAt: number;
  votes: {
    skip: number;
    keep: number;
    userVote?: 'skip' | 'keep';
  };
}

export interface RoomMember {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  role: MemberRole;
  isOnline: boolean;
  joinedAt: string;
  isListening: boolean;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  playlistCovers?: string[]; // 2x2 album mosaic artworks for playlist-like thumbnail
  trackCount?: number;
  privacy: RoomPrivacy;
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  membersCount: number;
  maxMembers: number;
  playbackMode: PlaybackMode;
  currentSong?: Song;
  currentPlaybackPosition?: number;
  playbackStartedAt?: number;
  isPlaying?: boolean;
  tags?: string[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    role?: MemberRole;
  };
  content: string;
  timestamp: string;
  replyTo?: {
    id: string;
    username: string;
    content: string;
  };
  songRef?: Song; // Embedded track pill in chat!
  reactions?: Record<string, string[]>; // emoji -> [userIds]
  isSystem?: boolean;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  xOffset: number; // percentage across player
  user?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  ownerId: string;
  ownerName: string;
  songsCount: number;
  totalDuration: number;
  privacy: 'public' | 'private' | 'unlisted';
  isCollaborative: boolean;
  songs: Song[];
  createdAt: string;
}

export interface VisualizerConfig {
  mode: VisualizerMode;
  colorScheme: 'red' | 'indigo' | 'violet' | 'cyan' | 'emerald' | 'amber' | 'rainbow';
  speed: number;
  intensity: number;
  beatSensitivity?: number; // 0 - 100, default 75
}

export interface AppSettings {
  // Playback & Audio
  autoplay: boolean;
  audioNormalization: boolean;
  highQualityAudio: boolean;
  crossfadeDuration: number; // 0 - 12s
  strictZeroShorts: boolean;
  defaultRegion: string;

  // Social & Rooms
  defaultRoomPrivacy: RoomPrivacy;
  defaultPlaybackMode: PlaybackMode;
  showListeningActivity: boolean;
  chatSoundEffects: boolean;
  floatingReactionsEnabled: boolean;
  syncDriftThresholdMs: number;

  // Privacy & Preferences
  privateProfile: boolean;
  allowFriendInvites: boolean;

  // Equalizer
  equalizerPreset?: string;
  equalizerBands?: number[]; // [60Hz, 250Hz, 1kHz, 4kHz, 14kHz] in dB (-12 to +12)
}
