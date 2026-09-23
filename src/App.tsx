import React, { useState, useEffect } from 'react';
import { useStore, DEFAULT_USER } from './store/useStore';
import { FirebaseAuthService } from './services/firebase/auth';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { DesktopAppHeader } from './components/layout/DesktopAppHeader';
import { MobileHeader } from './components/layout/MobileHeader';
import { InstallAppPrompt } from './components/pwa/InstallAppPrompt';
import { GlobalBottomPlayer } from './components/player/GlobalBottomPlayer';
import { MobileMiniPlayer } from './components/player/MobileMiniPlayer';
import { FullScreenPlayerModal } from './components/player/FullScreenPlayerModal';
import { VisualizerOptionsModal } from './components/player/VisualizerOptionsModal';
import { CreateRoomModal } from './components/room/CreateRoomModal';
import { QueueDrawer } from './components/queue/QueueDrawer';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';
import { AuthModal } from './components/common/AuthModal';
import { MusicTasteOnboardingModal } from './components/onboarding/MusicTasteOnboardingModal';
import { AIPlaylistCreatorModal } from './components/playlist/AIPlaylistCreatorModal';
import { RadioHUD } from './components/player/RadioHUD';
import { RadioDebugInspector } from './components/player/RadioDebugInspector';

// Pages
import { LandingPage } from './pages/LandingPage';
import { HomePage } from './pages/HomePage';
import { DiscoverPage } from './pages/DiscoverPage';
import { RoomsPage } from './pages/RoomsPage';
import { RoomPage } from './pages/RoomPage';
import { PlaylistsPage } from './pages/PlaylistsPage';
import { PlaylistDetailPage } from './pages/PlaylistDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { ArtistPage } from './pages/ArtistPage';
import { AlbumPage } from './pages/AlbumPage';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname || '/');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'app' | 'landing'>('app');
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [state, store] = useStore();

  // ── Firebase Auth session restore on page load ─────────────────────────
  useEffect(() => {
    // Initial check
    const current = FirebaseAuthService.getCurrentUser();
    if (current) {
      store.setState({
        currentUser: {
          ...DEFAULT_USER,
          id: current.id,
          username: current.username,
          displayName: current.displayName,
          avatarUrl: current.avatarUrl || DEFAULT_USER.avatarUrl,
          email: current.email || '',
        },
        isAuthenticated: true,
      });
    }

    // Listen for auth changes (Google popup sign-in, email auth, sign out)
    const unsub = FirebaseAuthService.onAuthStateChange((authUser) => {
      if (authUser) {
        store.setState({
          currentUser: {
            ...DEFAULT_USER,
            id: authUser.id,
            username: authUser.username,
            displayName: authUser.displayName,
            avatarUrl: authUser.avatarUrl || DEFAULT_USER.avatarUrl,
            email: authUser.email || '',
          },
          isAuthenticated: true,
        });
      } else if (state.isAuthenticated) {
        // User signed out
        const guest = FirebaseAuthService.createGuestUser();
        store.setState({
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
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Route resolver
  const renderPage = () => {
    const basePath = currentPath.split('?')[0];

    if (viewMode === 'landing' || basePath === '/landing') {
      return <LandingPage onNavigate={(path) => { setViewMode('app'); navigate(path); }} />;
    }

    if (basePath === '/' || basePath === '') {
      return <HomePage onNavigate={navigate} />;
    }

    if (basePath === '/discover') {
      const isSearchFocus = currentPath.includes('focus=search');
      const urlParams = currentPath.includes('?')
        ? new URLSearchParams(currentPath.split('?')[1])
        : null;
      const urlQuery = urlParams?.get('q') || urlParams?.get('initialQuery') || searchQuery;

      return (
        <DiscoverPage
          onNavigate={navigate}
          initialQuery={urlQuery}
          autoFocusSearch={isSearchFocus}
        />
      );
    }

    if (basePath === '/rooms') {
      return <RoomsPage onNavigate={navigate} />;
    }

    if (basePath.startsWith('/room/')) {
      const roomId = basePath.split('/room/')[1];
      return <RoomPage roomId={roomId} onNavigate={navigate} />;
    }

    if (basePath === '/playlists') {
      return <PlaylistsPage onNavigate={navigate} />;
    }

    if (basePath.startsWith('/playlist/')) {
      const plId = basePath.split('/playlist/')[1];
      return <PlaylistDetailPage playlistId={plId} onNavigate={navigate} />;
    }

    if (basePath === '/profile' || basePath === '/liked' || basePath === '/history') {
      return <ProfilePage onNavigate={navigate} />;
    }

    if (basePath === '/settings') {
      return <SettingsPage onNavigate={navigate} onOpenInstallModal={() => setIsInstallModalOpen(true)} />;
    }

    if (basePath.startsWith('/artist/')) {
      const artistName = basePath.split('/artist/')[1];
      return <ArtistPage artistName={artistName} onNavigate={navigate} />;
    }

    if (basePath.startsWith('/album/')) {
      const albumTitle = basePath.split('/album/')[1];
      return <AlbumPage albumTitle={albumTitle} onNavigate={navigate} />;
    }

    if (basePath.startsWith('/movie/')) {
      const movieTitle = basePath.split('/movie/')[1];
      return <AlbumPage albumTitle={movieTitle} onNavigate={navigate} />;
    }

    return <HomePage onNavigate={navigate} />;
  };

  const isRoomView = currentPath.startsWith('/room/');

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#F1F1F1] flex flex-col font-sans antialiased selection:bg-[#FF0000]/30">
      {/* 1. Desktop Window Frame Header (Spotify/Electron Client Software Look) */}
      <DesktopAppHeader onOpenInstallModal={() => setIsInstallModalOpen(true)} />

      {/* 2. Mobile App Header (iOS/Android Native Music App Bar - only on mobile app mode) */}
      {viewMode === 'app' && !isRoomView && (
        <MobileHeader
          onNavigate={navigate}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
        />
      )}

      {/* 3. Main Navigation Bar */}
      <div className={viewMode === 'app' && !isRoomView ? 'hidden md:block' : 'block'}>
        <Navbar
          currentPath={currentPath}
          onNavigate={(path) => {
            setViewMode('app');
            navigate(path);
          }}
          onSearch={(q) => setSearchQuery(q)}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
        />
      </div>

      {/* Main App Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar on desktop (hidden in landing mode and room view to maximize screen space) */}
        {viewMode === 'app' && !isRoomView && (
          <Sidebar
            currentPath={currentPath}
            onNavigate={navigate}
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
          />
        )}

        {/* Dynamic Page Content */}
        <main className={`flex-1 overflow-y-auto ${!isRoomView ? 'pb-36 sm:pb-28' : 'pb-0'}`}>
          {renderPage()}
        </main>
      </div>

      {/* Persistent Global Player (Desktop) */}
      {viewMode === 'app' && !isRoomView && <GlobalBottomPlayer />}

      {/* Mobile Mini-Player (docked above bottom navigation) */}
      {viewMode === 'app' && !isRoomView && <MobileMiniPlayer />}

      {/* Mobile Bottom Navigation (Hidden in room view to avoid overlapping room controls & chat) */}
      {viewMode === 'app' && !isRoomView && (
        <MobileNav currentPath={currentPath} onNavigate={navigate} />
      )}

      {/* Radio HUD — song transition overlay (global, above everything) */}
      <RadioHUD variant="overlay" />
      {/* Radio Debug Inspector HUD (telemetry on candidate pool & language confidence) */}
      <RadioDebugInspector />

      {/* Modals & Drawers */}
      <InstallAppPrompt
        forceOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
      <FullScreenPlayerModal />
      <VisualizerOptionsModal />
      <CreateRoomModal onRoomCreated={(newRoomId) => navigate(`/room/${newRoomId}`)} />
      <QueueDrawer />
      <KeyboardShortcutsModal />
      <AuthModal />
      <MusicTasteOnboardingModal />
      <AIPlaylistCreatorModal
        isOpen={state.isAIPlaylistModalOpen}
        onClose={() => store.setState({ isAIPlaylistModalOpen: false })}
        onNavigate={navigate}
      />
    </div>
  );
}

export default App;
