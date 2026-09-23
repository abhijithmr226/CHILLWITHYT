import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { audioManager } from '../services/audio/AudioManager';
import { VisualizerMode, RoomPrivacy, PlaybackMode } from '../types';
import { YOUTUBE_REGIONS } from '../services/audio/YouTubeDataApi';
import { FirebaseAuthService } from '../services/firebase/auth';
import { StorageService } from '../services/storage/StorageService';
import { 
  Palette, 
  Volume2, 
  Shield, 
  User, 
  Check, 
  Radio, 
  Sparkles, 
  Sliders, 
  RefreshCw, 
  Trash2, 
  RotateCcw, 
  Zap, 
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Music,
  Users,
  LogOut,
  LogIn,
  Activity,
  Upload,
  Loader2,
  Download,
  Laptop,
  Smartphone,
  Mic,
  Coffee,
  Star,
  Headphones
} from 'lucide-react';

interface SettingsPageProps {
  onNavigate?: (path: string) => void;
  onOpenInstallModal?: () => void;
}

const AVATAR_PRESETS = [
  'https://api.dicebear.com/9.x/bottts/svg?seed=cyber_dj&radius=50&backgroundColor=b6e3f4,c0aede',
  'https://api.dicebear.com/9.x/lorelei/svg?seed=neon_vibes&radius=50&backgroundColor=ffd5dc,ffdfbf',
  'https://api.dicebear.com/9.x/adventurer/svg?seed=bass_head&radius=50&backgroundColor=d1d4f9,c0aede',
  'https://api.dicebear.com/9.x/fun-emoji/svg?seed=party_rocker&radius=50&backgroundColor=ffdfbf,ffd5dc',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=sonic_flow&radius=50&backgroundColor=b6e3f4,d1d4f9',
  'https://api.dicebear.com/9.x/notionists/svg?seed=lofi_coder&radius=50&backgroundColor=c0aede,ffd5dc',
  'https://api.dicebear.com/9.x/bottts/svg?seed=retro_synth&radius=50&backgroundColor=d1d4f9,ffdfbf',
  'https://api.dicebear.com/9.x/micah/svg?seed=chill_groove&radius=50&backgroundColor=b6e3f4,ffd5dc',
];

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate, onOpenInstallModal }) => {
  const [state, store] = useStore();
  const [activeTab, setActiveTab] = useState<'account' | 'audio' | 'appearance' | 'rooms' | 'privacy' | 'about'>('account');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State: Account
  const [displayName, setDisplayName] = useState(state.currentUser?.displayName || '');
  const [username, setUsername] = useState(state.currentUser?.username || '');
  const [bio, setBio] = useState(state.currentUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(state.currentUser?.avatarUrl || AVATAR_PRESETS[0]);
  const [email, setEmail] = useState('alex.carter@chillwithyt.app');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const url = await StorageService.uploadImage(file, 'avatars');
      setAvatarUrl(url);
      showToast('Avatar uploaded to real cloud storage!');
    } catch (err: any) {
      showToast(err.message || 'Avatar upload failed.');
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  // Form State: Audio & Playback
  const [autoplay, setAutoplay] = useState(state.settings?.autoplay ?? true);
  const [audioNorm, setAudioNorm] = useState(state.settings?.audioNormalization ?? true);
  const [highQualityAudio, setHighQualityAudio] = useState(state.settings?.highQualityAudio ?? true);
  const [strictZeroShorts, setStrictZeroShorts] = useState(state.settings?.strictZeroShorts ?? true);
  const [crossfadeDuration, setCrossfadeDuration] = useState(state.settings?.crossfadeDuration ?? 3);
  const [defaultRegion, setDefaultRegion] = useState(state.settings?.defaultRegion ?? 'IN');

  // Form State: Studio Graphic Equalizer
  const [eqPreset, setEqPreset] = useState<string>(state.settings?.equalizerPreset || 'flat');
  const [eqBands, setEqBands] = useState<number[]>(state.settings?.equalizerBands || [0, 0, 0, 0, 0]);

  const EQ_PRESETS: Record<string, { label: string; bands: number[]; icon: React.ComponentType<{ className?: string }> }> = {
    flat: { label: 'Flat / Studio', bands: [0, 0, 0, 0, 0], icon: Headphones },
    bass: { label: 'Bass Boost', bands: [8, 5, 0, -1, 2], icon: Flame },
    vocal: { label: 'Acoustic / Vocal', bands: [-2, 1, 5, 3, 2], icon: Mic },
    electronic: { label: 'Electronic / EDM', bands: [7, 3, -2, 4, 6], icon: Zap },
    hiphop: { label: 'Hip Hop / Trap', bands: [9, 4, -1, 2, 3], icon: Sparkles },
    rock: { label: 'Rock / Punch', bands: [4, 3, -1, 3, 4], icon: Music },
    lofi: { label: 'Chill / Lofi', bands: [3, 2, 1, -2, -4], icon: Coffee },
  };

  const applyEqPreset = (presetKey: string) => {
    setEqPreset(presetKey);
    const preset = EQ_PRESETS[presetKey];
    if (preset) {
      setEqBands([...preset.bands]);
    }
  };

  const updateEqBand = (index: number, val: number) => {
    const updated = [...eqBands];
    updated[index] = val;
    setEqBands(updated);
    setEqPreset('custom');
  };

  // Form State: Appearance & Visualizer
  const [themeMode, setThemeMode] = useState(state.theme);
  const [accentColor, setAccentColor] = useState(state.accentColor);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>(state.visualizerConfig.mode);
  const [visualizerSpeed, setVisualizerSpeed] = useState(state.visualizerConfig.speed);
  const [visualizerIntensity, setVisualizerIntensity] = useState(state.visualizerConfig.intensity);
  const [visualizerColor, setVisualizerColor] = useState(state.visualizerConfig.colorScheme);

  // Form State: Social & Rooms
  const [defaultRoomPrivacy, setDefaultRoomPrivacy] = useState<RoomPrivacy>(state.settings?.defaultRoomPrivacy ?? 'public');
  const [defaultPlaybackMode, setDefaultPlaybackMode] = useState<PlaybackMode>(state.settings?.defaultPlaybackMode ?? 'dj_controlled');
  const [showListeningActivity, setShowListeningActivity] = useState(state.settings?.showListeningActivity ?? true);
  const [chatSoundEffects, setChatSoundEffects] = useState(state.settings?.chatSoundEffects ?? true);
  const [floatingReactions, setFloatingReactions] = useState(state.settings?.floatingReactionsEnabled ?? true);
  const [driftThreshold, setDriftThreshold] = useState(state.settings?.syncDriftThresholdMs ?? 1000);

  // Form State: Privacy & Security
  const [privateProfile, setPrivateProfile] = useState(state.settings?.privateProfile ?? false);
  const [allowFriendInvites, setAllowFriendInvites] = useState(state.settings?.allowFriendInvites ?? true);

  const colors = [
    { label: 'YouTube Red', hex: '#FF0000' },
    { label: 'Electric Indigo', hex: '#6366F1' },
    { label: 'Royal Violet', hex: '#8B5CF6' },
    { label: 'Neon Cyan', hex: '#06B6D4' },
    { label: 'Emerald Green', hex: '#10B981' },
    { label: 'Amber Gold', hex: '#F59E0B' },
  ];

  const [visualizerBeatSensitivity, setVisualizerBeatSensitivity] = useState(state.visualizerConfig.beatSensitivity ?? 80);

  const visualizerModes: VisualizerMode[] = [
    'AutoAdaptive',
    'MassBass',
    'LiquidLofi',
    'RadialAurora',
    'Circular',
    'Spectrum',
    'Wave',
    'Particles',
    'Minimal'
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Save Account Profile & Sync with Supabase Database
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDisplayName = displayName.trim() || 'Music Lover';
    const trimmedUsername = username.trim().toLowerCase() || 'user';
    const trimmedBio = bio.trim();
    const trimmedAvatar = avatarUrl.trim() || AVATAR_PRESETS[0];

    store.updateUserProfile({
      displayName: trimmedDisplayName,
      username: trimmedUsername,
      bio: trimmedBio,
      avatarUrl: trimmedAvatar,
    });

    if (state.currentUser?.id && !state.currentUser.id.startsWith('guest_')) {
      FirebaseAuthService.updateProfile({
        displayName: trimmedDisplayName,
        avatarUrl: trimmedAvatar,
      }).then(() => {
        showToast('Profile saved & synced with Firebase & Supabase!');
      }).catch((err) => {
        showToast(`Profile updated locally (${err.message})`);
      });
    } else {
      showToast('Profile details updated locally (Guest session)!');
    }
  };

  // Save Audio & Playback Preferences
  const handleSaveAudio = () => {
    store.updateSettings({
      autoplay,
      audioNormalization: audioNorm,
      highQualityAudio,
      strictZeroShorts,
      crossfadeDuration,
      defaultRegion,
      equalizerPreset: eqPreset,
      equalizerBands: eqBands,
    });
    audioManager.setAutoplay(autoplay);
    showToast('Playback, Equalizer, and Autoplay settings saved!');
  };

  // Save Appearance & Visualizer Preferences
  const handleSaveAppearance = () => {
    store.setState({ theme: themeMode });
    store.setAccentColor(accentColor);
    store.updateVisualizerConfig({
      mode: visualizerMode,
      speed: visualizerSpeed,
      intensity: visualizerIntensity,
      colorScheme: visualizerColor,
      beatSensitivity: visualizerBeatSensitivity,
    });
    showToast('Theme and visualizer preferences applied!');
  };

  // Save Social & Room Preferences
  const handleSaveRooms = () => {
    store.updateSettings({
      defaultRoomPrivacy,
      defaultPlaybackMode,
      showListeningActivity,
      chatSoundEffects,
      floatingReactionsEnabled: floatingReactions,
      syncDriftThresholdMs: driftThreshold,
    });
    showToast('Room and social settings saved!');
  };

  // Save Privacy Preferences
  const handleSavePrivacy = () => {
    store.updateSettings({
      privateProfile,
      allowFriendInvites,
    });
    showToast('Privacy preferences updated!');
  };

  const handleClearHistory = () => {
    store.clearHistory();
    showToast('Listening history cleared!');
  };

  const handleResetPlaylists = () => {
    store.resetPlaylistsToDefault();
    showToast('Playlists reset to default recommendations!');
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 select-none animate-fade-in">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#212121] border border-[#272727] text-white text-xs font-bold shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#FF0000]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-6 h-6 text-[#FF0000]" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Settings & Preferences
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#AAAAAA] mt-1">
            Manage your profile, Spotify-style autoplay, YouTube audio stream parameters, visualizers, and room controls.
          </p>
        </div>

        {onNavigate && (
          <button
            onClick={() => onNavigate('/profile')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#212121] hover:bg-[#272727] border border-[#272727] text-xs font-semibold text-white transition self-start sm:self-auto cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-[#FF0000]" />
            <span>View Public Profile</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-1.5">
          {[
            { id: 'account', label: 'Account & Profile', icon: User, badge: 'Editable' },
            { id: 'audio', label: 'Audio & Autoplay', icon: Volume2, badge: 'Spotify' },
            { id: 'appearance', label: 'Theme & Visualizer', icon: Palette, badge: null },
            { id: 'rooms', label: 'Social & Rooms', icon: Users, badge: null },
            { id: 'privacy', label: 'Privacy & System', icon: Shield, badge: null },
            { id: 'about', label: 'Developer & Credits', icon: Sparkles, badge: 'Creator' },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition cursor-pointer ${
                  active
                    ? 'bg-[#FF0000] text-white shadow-lg shadow-red-900/30'
                    : 'bg-[#212121] hover:bg-[#272727] text-[#AAAAAA] hover:text-white border border-[#272727]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                      active
                        ? 'bg-black/30 text-white'
                        : 'bg-[#272727] text-[#FF4D4D]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="md:col-span-3 bg-[#212121] border border-[#272727] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* TAB 1: ACCOUNT & PROFILE (FULLY EDITABLE) */}
          {activeTab === 'account' && (
            <form onSubmit={handleSaveProfile} className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-[#FF0000]" />
                    <span>Edit Profile & Account</span>
                  </h3>
                  <p className="text-xs text-[#AAAAAA] mt-0.5">
                    Customize your presence in listening rooms and manage your Supabase account.
                  </p>
                </div>

                {/* Account Status Badge & Action */}
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    state.isAuthenticated
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-neutral-800 text-[#888888] border-[#333333]'
                  }`}>
                    {state.isAuthenticated ? (
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Authenticated</span>
                      </span>
                    ) : (
                      'Guest Mode'
                    )}
                  </span>

                  {state.isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => {
                        store.signOut();
                        showToast('Signed out of Firebase.');
                      }}
                      className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#272727] hover:bg-red-950/40 text-[#AAAAAA] hover:text-red-400 border border-[#383838] text-xs font-semibold transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => store.setState({ isAuthModalOpen: true })}
                      className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In / Up</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Avatar Picker & Preview */}
              <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#272727] space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#AAAAAA]">
                  Avatar Photo
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <img
                    src={avatarUrl}
                    alt="Avatar preview"
                    className="w-20 h-20 rounded-2xl object-cover ring-2 ring-[#FF0000] shadow-md shrink-0"
                  />
                  <div className="space-y-2 flex-1 w-full">
                    <p className="text-[11px] text-[#AAAAAA]">
                      Select from presets or paste any custom image URL below:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatarUrl(preset)}
                          className={`w-9 h-9 rounded-xl overflow-hidden transition ring-2 cursor-pointer ${
                            avatarUrl === preset ? 'ring-[#FF0000] scale-110' : 'ring-transparent opacity-75 hover:opacity-100'
                          }`}
                        >
                          <img src={preset} alt={`preset ${idx}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="Custom image URL (https://...)"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#0F0F0F] border border-[#272727] text-white text-xs placeholder-[#717171] focus:border-[#FF0000] focus:outline-none"
                  />
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingAvatar}
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Real Photo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Display Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[#AAAAAA] font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Carter"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0F0F] border border-[#272727] text-white text-xs placeholder-[#717171] focus:border-[#FF0000] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#AAAAAA] font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                    Username (@handle)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-[#717171] font-mono">@</span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
                      placeholder="alexcarter"
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-[#0F0F0F] border border-[#272727] text-white text-xs placeholder-[#717171] focus:border-[#FF0000] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Email (Readonly / Connected) */}
              <div>
                <label className="block text-[#AAAAAA] font-bold mb-1.5 uppercase tracking-wider text-[11px]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@chillwithyt.app"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0F0F] border border-[#272727] text-white text-xs placeholder-[#717171] focus:border-[#FF0000] focus:outline-none"
                />
              </div>

              {/* Bio */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[#AAAAAA] font-bold uppercase tracking-wider text-[11px]">
                    Bio
                  </label>
                  <span className="text-[10px] text-[#717171]">{bio.length} / 160</span>
                </div>
                <textarea
                  rows={3}
                  maxLength={160}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people about your music taste, favorite regional artists, or room vibes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0F0F] border border-[#272727] text-white text-xs placeholder-[#717171] focus:border-[#FF0000] focus:outline-none resize-none"
                />
              </div>

              {/* Stats Overview */}
              <div className="p-4 rounded-2xl bg-[#181818] border border-[#272727] grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-black text-white">{state.currentUser?.stats?.roomsCreated || 12}</p>
                  <p className="text-[10px] text-[#AAAAAA] font-semibold uppercase tracking-wider">Rooms Hosted</p>
                </div>
                <div>
                  <p className="text-lg font-black text-[#FF0000]">{state.playlists.length}</p>
                  <p className="text-[10px] text-[#AAAAAA] font-semibold uppercase tracking-wider">Playlists</p>
                </div>
                <div>
                  <p className="text-lg font-black text-white">{state.currentUser?.stats?.songsPlayed || 542}</p>
                  <p className="text-[10px] text-[#AAAAAA] font-semibold uppercase tracking-wider">Songs Played</p>
                </div>
              </div>

              {/* Musical Taste & Discovery Section */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/20 via-[#181818] to-black border border-red-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Musical Taste DNA & Recommendations
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => store.openTasteOnboarding()}
                    className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-xs font-semibold text-red-300 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Retune Preferences</span>
                  </button>
                </div>

                {state.musicPreferences ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-white/40 font-semibold text-[11px] self-center mr-1">Languages:</span>
                      {state.musicPreferences.languages.map((l) => (
                        <span key={l} className="px-2 py-0.5 rounded-md bg-white/10 text-white font-medium text-[11px]">{l}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-white/40 font-semibold text-[11px] self-center mr-1">Vibes:</span>
                      {state.musicPreferences.genres.map((g) => (
                        <span key={g} className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-400 font-medium text-[11px]">{g}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-white/40 font-semibold text-[11px] self-center mr-1">Top Artists:</span>
                      {state.musicPreferences.artists.map((a) => (
                        <span key={a} className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-medium text-[11px] flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>{a}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-white/50">
                    No musical taste profile configured yet. Click "Retune Preferences" to personalize your playlists and discovery feeds!
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition shadow-lg shadow-red-900/30 flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: AUDIO, PLAYBACK & SPOTIFY AUTOPLAY */}
          {activeTab === 'audio' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#FF0000]" />
                  <span>Audio & Playback Parameters</span>
                </h3>
                <p className="text-xs text-[#AAAAAA] mt-0.5">
                  Configure Spotify-style infinite autoplay, YouTube audio stream quality, and crossfades.
                </p>
              </div>

              <div className="space-y-3">
                {/* Spotify Autoplay */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1A1A1A] border border-[#272727]">
                  <div className="space-y-0.5 pr-4">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white text-xs">Spotify Infinite Autoplay</p>
                      <span className="text-[9px] font-bold bg-[#FF0000]/15 text-[#FF4D4D] px-2 py-0.5 rounded">
                        RECOMMENDED
                      </span>
                    </div>
                    <p className="text-[11px] text-[#AAAAAA]">
                      When your queue reaches the end, automatically fetch and play similar songs from YouTube so music never stops.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoplay}
                    onChange={(e) => setAutoplay(e.target.checked)}
                    className="accent-[#FF0000] w-5 h-5 cursor-pointer shrink-0"
                  />
                </div>

                {/* Strict Zero Shorts Filter */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1A1A1A] border border-[#272727]">
                  <div className="space-y-0.5 pr-4">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white text-xs">Strict Zero-Shorts Filter</p>
                      <span className="text-[9px] font-bold bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded">
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-[11px] text-[#AAAAAA]">
                      Exclude videos with duration under 80 seconds, vertical clips, WhatsApp status videos, and ringtones.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={strictZeroShorts}
                    onChange={(e) => setStrictZeroShorts(e.target.checked)}
                    className="accent-[#FF0000] w-5 h-5 cursor-pointer shrink-0"
                  />
                </div>

                {/* Audio Normalization */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1A1A1A] border border-[#272727]">
                  <div className="space-y-0.5 pr-4">
                    <p className="font-bold text-white text-xs">Audio Normalization</p>
                    <p className="text-[11px] text-[#AAAAAA]">
                      Smooth out differences in volume levels between different YouTube video uploads.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={audioNorm}
                    onChange={(e) => setAudioNorm(e.target.checked)}
                    className="accent-[#FF0000] w-5 h-5 cursor-pointer shrink-0"
                  />
                </div>

                {/* High Quality Audio */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1A1A1A] border border-[#272727]">
                  <div className="space-y-0.5 pr-4">
                    <p className="font-bold text-white text-xs">High Fidelity YouTube Audio</p>
                    <p className="text-[11px] text-[#AAAAAA]">
                      Prioritize highest available bitrate (up to 256kbps Opus/AAC audio streams).
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={highQualityAudio}
                    onChange={(e) => setHighQualityAudio(e.target.checked)}
                    className="accent-[#FF0000] w-5 h-5 cursor-pointer shrink-0"
                  />
                </div>
              </div>

              {/* Graphic Studio Equalizer */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#1A1A1A] border border-[#272727] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#FF0000]" />
                      <p className="font-bold text-white text-xs sm:text-sm">Studio Graphic Equalizer & Presets</p>
                    </div>
                    <p className="text-[11px] text-[#AAAAAA] mt-0.5">
                      Shape the frequency curve across sub-bass, punch, vocal mids, presence, and air.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#FF4D4D] bg-[#FF0000]/10 px-2.5 py-1 rounded-lg border border-[#FF0000]/20 self-start sm:self-auto">
                    {EQ_PRESETS[eqPreset]?.label || 'Custom Tuning'}
                  </span>
                </div>

                {/* EQ Preset Selector Pills */}
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(EQ_PRESETS).map(([key, p]) => {
                    const IconComp = p.icon;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => applyEqPreset(key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                          eqPreset === key
                            ? 'bg-[#FF0000] text-white shadow-md'
                            : 'bg-[#0F0F0F] text-[#AAAAAA] hover:text-white hover:bg-[#252525] border border-[#272727]'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                        <span>{p.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 5-Band Sliders Grid */}
                <div className="grid grid-cols-5 gap-2 sm:gap-4 pt-2">
                  {[
                    { name: '60 Hz', sub: 'Sub-Bass', val: eqBands[0] ?? 0 },
                    { name: '250 Hz', sub: 'Bass Punch', val: eqBands[1] ?? 0 },
                    { name: '1 kHz', sub: 'Mids / Vocal', val: eqBands[2] ?? 0 },
                    { name: '4 kHz', sub: 'Presence', val: eqBands[3] ?? 0 },
                    { name: '14 kHz', sub: 'Treble Air', val: eqBands[4] ?? 0 },
                  ].map((band, idx) => (
                    <div key={band.name} className="flex flex-col items-center p-2 rounded-xl bg-[#0F0F0F] border border-[#272727] space-y-2">
                      <span className="text-[11px] font-mono font-bold text-white">
                        {band.val > 0 ? `+${band.val}` : band.val} dB
                      </span>
                      <div className="h-28 flex items-center justify-center py-1">
                        <input
                          type="range"
                          min={-12}
                          max={12}
                          step={1}
                          value={band.val}
                          onChange={(e) => updateEqBand(idx, parseInt(e.target.value))}
                          className="h-24 -rotate-90 accent-[#FF0000] cursor-pointer"
                        />
                      </div>
                      <div className="text-center pt-1">
                        <p className="text-[10px] font-bold text-white">{band.name}</p>
                        <p className="text-[9px] text-[#717171] hidden sm:block">{band.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Crossfade Duration Slider */}
              <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#272727] space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white text-xs">Crossfade Between Songs</p>
                    <p className="text-[11px] text-[#AAAAAA]">Allows songs to smoothly transition into one another</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#FF4D4D]">{crossfadeDuration}s</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={12}
                  step={1}
                  value={crossfadeDuration}
                  onChange={(e) => setCrossfadeDuration(parseInt(e.target.value))}
                  className="w-full accent-[#FF0000] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#717171] font-mono">
                  <span>Off (0s)</span>
                  <span>6s</span>
                  <span>12s</span>
                </div>
              </div>

              {/* Default YouTube Music Region */}
              <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#272727] space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#AAAAAA]">
                  Default Music Charts Region
                </label>
                <select
                  value={defaultRegion}
                  onChange={(e) => setDefaultRegion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F0F0F] border border-[#272727] text-white text-xs focus:border-[#FF0000] focus:outline-none"
                >
                  {YOUTUBE_REGIONS.map((reg) => (
                    <option key={reg.code} value={reg.code}>
                      {reg.flag} {reg.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveAudio}
                  className="px-6 py-2.5 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition shadow-lg shadow-red-900/30 flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Audio Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: APPEARANCE & VISUALIZER */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#FF0000]" />
                  <span>Theme & Realtime Visualizers</span>
                </h3>
                <p className="text-xs text-[#AAAAAA] mt-0.5">
                  Tune the interface aesthetics and customize your dynamic audio frequency spectrum.
                </p>
              </div>

              {/* Theme Mode */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#AAAAAA] block">
                  Theme Palette
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setThemeMode('dark')}
                    className={`py-3 px-4 rounded-2xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      themeMode === 'dark'
                        ? 'bg-[#0F0F0F] border-[#FF0000] text-white shadow-lg'
                        : 'bg-[#181818] border-[#272727] text-[#AAAAAA]'
                    }`}
                  >
                    <span>YouTube Dark (#0F0F0F)</span>
                    {themeMode === 'dark' && <Check className="w-4 h-4 text-[#FF0000]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setThemeMode('light')}
                    className={`py-3 px-4 rounded-2xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      themeMode === 'light'
                        ? 'bg-[#272727] border-[#FF0000] text-white shadow-lg'
                        : 'bg-[#181818] border-[#272727] text-[#AAAAAA]'
                    }`}
                  >
                    <span>High Contrast (#212121)</span>
                    {themeMode === 'light' && <Check className="w-4 h-4 text-[#FF0000]" />}
                  </button>
                </div>
              </div>

              {/* Accent Color */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#AAAAAA] block">
                  Accent Color
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {colors.map((c) => {
                    const active = accentColor === c.hex;
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setAccentColor(c.hex)}
                        className={`w-11 h-11 rounded-2xl transition-transform flex items-center justify-center cursor-pointer ${
                          active
                            ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#212121]'
                            : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.label}
                      >
                        {active && <Check className="w-5 h-5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Visualizer Mode */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#AAAAAA] block">
                  Default Visualizer Geometry
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {visualizerModes.map((m) => {
                    const active = visualizerMode === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setVisualizerMode(m)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          active
                            ? 'bg-[#FF0000] border-[#FF0000] text-white shadow-md'
                            : 'bg-[#1A1A1A] border-[#272727] text-[#AAAAAA] hover:text-white hover:bg-[#272727]'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visualizer Sliders (Speed, Intensity, Beat Sensitivity) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#272727] space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-white">Visualizer Speed</span>
                    <span className="font-mono text-[#FF4D4D] font-bold">{visualizerSpeed}x</span>
                  </div>
                  <input
                    type="range"
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    value={visualizerSpeed}
                    onChange={(e) => setVisualizerSpeed(parseFloat(e.target.value))}
                    className="w-full accent-[#FF0000] cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#272727] space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-white">Spectrum Intensity</span>
                    <span className="font-mono text-[#FF4D4D] font-bold">{visualizerIntensity}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    step={5}
                    value={visualizerIntensity}
                    onChange={(e) => setVisualizerIntensity(parseInt(e.target.value))}
                    className="w-full accent-[#FF0000] cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#272727] space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-white">Beat Shockwave</span>
                    <span className="font-mono text-[#FF4D4D] font-bold">{visualizerBeatSensitivity}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    step={5}
                    value={visualizerBeatSensitivity}
                    onChange={(e) => setVisualizerBeatSensitivity(parseInt(e.target.value))}
                    className="w-full accent-[#FF0000] cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveAppearance}
                  className="px-6 py-2.5 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition shadow-lg shadow-red-900/30 flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Appearance Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: SOCIAL & ROOMS */}
          {activeTab === 'rooms' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#FF0000]" />
                  <span>Listening Rooms & Social Features</span>
                </h3>
                <p className="text-xs text-[#AAAAAA] mt-0.5">
                  Control default room privacy, collaborative host modes, reactions, and sync drift thresholds.
                </p>
              </div>

              <div className="space-y-4">
                {/* Default Room Privacy */}
                <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#272727] space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#AAAAAA]">
                    Default Room Privacy
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'public', label: 'Public (Everyone)' },
                      { id: 'private', label: 'Private (Passcode)' },
                      { id: 'invite_only', label: 'Invite Only' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setDefaultRoomPrivacy(p.id as RoomPrivacy)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          defaultRoomPrivacy === p.id
                            ? 'bg-[#FF0000] border-[#FF0000] text-white shadow-md'
                            : 'bg-[#0F0F0F] border-[#272727] text-[#AAAAAA] hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default Playback Mode */}
                <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#272727] space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#AAAAAA]">
                    Default Playback Control Mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'dj_controlled', label: 'DJ Rotation (Collaborative)' },
                      { id: 'host_controlled', label: 'Host Controlled (Strict)' },
                      { id: 'community_voting', label: 'Community Upvoting' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setDefaultPlaybackMode(m.id as PlaybackMode)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                          defaultPlaybackMode === m.id
                            ? 'bg-[#FF0000] border-[#FF0000] text-white shadow-md'
                            : 'bg-[#0F0F0F] border-[#272727] text-[#AAAAAA] hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1A1A1A] border border-[#272727]">
                    <div className="space-y-0.5 pr-4">
                      <p className="font-bold text-white text-xs">Live Floating Emoji Reactions</p>
                      <p className="text-[11px] text-[#AAAAAA]">
                        Display floating animated emojis sent by room listeners across the video player.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={floatingReactions}
                      onChange={(e) => setFloatingReactions(e.target.checked)}
                      className="accent-[#FF0000] w-5 h-5 cursor-pointer shrink-0"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1A1A1A] border border-[#272727]">
                    <div className="space-y-0.5 pr-4">
                      <p className="font-bold text-white text-xs">Chat Message Sound Effects</p>
                      <p className="text-[11px] text-[#AAAAAA]">
                        Play an unobtrusive audio cue when new messages arrive in the room chat.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={chatSoundEffects}
                      onChange={(e) => setChatSoundEffects(e.target.checked)}
                      className="accent-[#FF0000] w-5 h-5 cursor-pointer shrink-0"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1A1A1A] border border-[#272727]">
                    <div className="space-y-0.5 pr-4">
                      <p className="font-bold text-white text-xs">Broadcast Listening Activity</p>
                      <p className="text-[11px] text-[#AAAAAA]">
                        Let friends see what room you're currently in and what track you are listening to.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={showListeningActivity}
                      onChange={(e) => setShowListeningActivity(e.target.checked)}
                      className="accent-[#FF0000] w-5 h-5 cursor-pointer shrink-0"
                    />
                  </div>
                </div>

                {/* Sync Drift Threshold */}
                <div className="p-4 rounded-2xl bg-[#1A1A1A] border border-[#272727] space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">Playback Drift Auto-Sync Threshold</p>
                      <p className="text-[11px] text-[#AAAAAA]">
                        Auto-resync with room host if local playback drifts by more than this limit
                      </p>
                    </div>
                    <span className="font-mono text-[#FF4D4D] font-bold">{driftThreshold}ms</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {[
                      { val: 500, label: 'Strict (500ms)' },
                      { val: 1000, label: 'Optimal (1000ms)' },
                      { val: 2000, label: 'Relaxed (2000ms)' },
                    ].map((d) => (
                      <button
                        key={d.val}
                        type="button"
                        onClick={() => setDriftThreshold(d.val)}
                        className={`py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                          driftThreshold === d.val
                            ? 'bg-[#FF0000] border-[#FF0000] text-white'
                            : 'bg-[#0F0F0F] border-[#272727] text-[#AAAAAA]'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveRooms}
                  className="px-6 py-2.5 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition shadow-lg shadow-red-900/30 flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Room Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: PRIVACY, SECURITY & INTEGRATIONS */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#FF0000]" />
                  <span>Privacy, Security & System Integrations</span>
                </h3>
                <p className="text-xs text-[#AAAAAA] mt-0.5">
                  Manage visibility, backend database policies, API keys, and cache resets.
                </p>
              </div>

              {/* Privacy Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1A1A1A] border border-[#272727]">
                  <div className="space-y-0.5 pr-4">
                    <p className="font-bold text-white text-xs">Private User Profile</p>
                    <p className="text-[11px] text-[#AAAAAA]">
                      Hide your playlist collections and liked songs from non-friends and room members.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privateProfile}
                    onChange={(e) => setPrivateProfile(e.target.checked)}
                    className="accent-[#FF0000] w-5 h-5 cursor-pointer shrink-0"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1A1A1A] border border-[#272727]">
                  <div className="space-y-0.5 pr-4">
                    <p className="font-bold text-white text-xs">Allow Listening Room Invites</p>
                    <p className="text-[11px] text-[#AAAAAA]">
                      Permit friends and room hosts to send you live session join requests.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowFriendInvites}
                    onChange={(e) => setAllowFriendInvites(e.target.checked)}
                    className="accent-[#FF0000] w-5 h-5 cursor-pointer shrink-0"
                  />
                </div>
              </div>

              {/* Desktop Software & Mobile PWA Installation */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#241515] to-[#171717] border border-red-500/30 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF0000] to-orange-500 flex items-center justify-center text-white shadow-lg shadow-red-950/50 shrink-0">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <span>Desktop Software & Home Screen App</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                          PWA Ready
                        </span>
                      </h4>
                      <p className="text-xs text-[#AAAAAA] mt-0.5">
                        Run ChillWithYT as a standalone app on Windows, macOS, Android, and iOS.
                      </p>
                    </div>
                  </div>

                  {onOpenInstallModal && (
                    <button
                      type="button"
                      onClick={onOpenInstallModal}
                      className="px-4 py-2 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition shadow-md shadow-red-900/30 flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Install App Now</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-[#FF4D4D]" />
                      PC / Mac Client
                    </span>
                    <p className="text-[11px] text-[#888888]">
                      Borderless window, taskbar pin, and hardware media keys (play/pause/skip).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-[#FF4D4D]" />
                      Mobile App Shell
                    </span>
                    <p className="text-[11px] text-[#888888]">
                      Full-screen immersive experience with bottom tab bar and zero browser address bar.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Continuous Playback
                    </span>
                    <p className="text-[11px] text-[#888888]">
                      Keeps audio streaming in background and across listening room synchronizations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Backend System Telemetry */}
              <div className="p-4 rounded-2xl bg-[#181818] border border-[#272727] space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#AAAAAA] block">
                  Backend Infrastructure Status
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#212121] border border-[#272727]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white">Supabase PostgreSQL & RLS</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      ONLINE & PROTECTED
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#212121] border border-[#272727]">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#FF0000]" />
                      <span className="font-bold text-white">YouTube Data API v3 Service</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#FF4D4D] bg-[#FF0000]/10 px-2 py-0.5 rounded">
                      ACTIVE & CONNECTED
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#212121] border border-[#272727]">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-white">Firebase Authentication & Google OAuth</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      ACTIVE & CONNECTED
                    </span>
                  </div>
                </div>
              </div>

              {/* Cache & Data Resets */}
              <div className="p-4 rounded-2xl bg-[#181818] border border-red-950/40 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-red-400 block">
                  Data & Library Maintenance
                </span>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#272727] hover:bg-[#383838] text-white text-xs font-semibold border border-[#383838] transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[#FF0000]" />
                    <span>Clear Listening History</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetPlaylists}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#272727] hover:bg-[#383838] text-white text-xs font-semibold border border-[#383838] transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reset Recommended Playlists</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Delete all custom playlists and reset library?')) {
                        store.setState({ playlists: [] });
                        showToast('All custom playlists removed.');
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#272727] hover:bg-red-950/40 text-red-400 text-xs font-semibold border border-[#383838] transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete All Playlists</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSavePrivacy}
                  className="px-6 py-2.5 rounded-xl bg-[#FF0000] hover:bg-[#CC0000] text-white text-xs font-bold transition shadow-lg shadow-red-900/30 flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Privacy Settings</span>
                </button>
              </div>
            </div>
          )}

          {/* ── TAB 6: DEVELOPER & CREDITS ── */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              {/* Developer Profile Hero Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E1E24] via-[#161619] to-[#0F0F12] border border-[#2E2E36] p-6 sm:p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-72 h-72 bg-[#FF0000]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                
                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#FF0000] to-rose-500 p-0.5 shadow-xl shadow-red-900/40">
                      <div className="w-full h-full rounded-[22px] bg-[#161619] flex items-center justify-center overflow-hidden">
                        <Sparkles className="w-10 h-10 text-[#FF0000] animate-pulse" />
                      </div>
                    </div>
                    <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                      Creator
                    </span>
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        Abhijith M R
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FF0000]/20 text-[#FF4D4D] text-[11px] font-bold border border-[#FF0000]/30">
                        Lead Developer & Architect
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#AAAAAA] leading-relaxed max-w-xl">
                      Crafted the ChillWithYT experience — realtime synchronized YouTube music rooms, studio equalizer engines, low-latency audio sync, and cross-device listening party software.
                    </p>

                    <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      <a
                        href="https://linkedin.com/in/abhijithmr226"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-bold transition shadow-lg shadow-blue-900/30 cursor-pointer active:scale-95"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>linkedin.com/in/abhijithmr226</span>
                      </a>

                      <a
                        href="https://github.com/abhijithmr226/CHILLWITHYT"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#26262B] hover:bg-[#33333A] text-white text-xs font-semibold border border-white/10 transition cursor-pointer"
                      >
                        <span>GitHub Repository</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#888888]" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Telemetry & Version Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[#1C1C20] border border-white/5 space-y-1">
                  <span className="text-[11px] text-[#717171] uppercase tracking-wider font-semibold">Platform Version</span>
                  <p className="text-sm font-bold text-white">ChillWithYT v1.0.0 (Production)</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#1C1C20] border border-white/5 space-y-1">
                  <span className="text-[11px] text-[#717171] uppercase tracking-wider font-semibold">Engine Stack</span>
                  <p className="text-sm font-bold text-white">React 19 · Vite · Web Audio API</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#1C1C20] border border-white/5 space-y-1">
                  <span className="text-[11px] text-[#717171] uppercase tracking-wider font-semibold">Realtime Engine</span>
                  <p className="text-sm font-bold text-white">Supabase Realtime + YouTube Iframe API</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
