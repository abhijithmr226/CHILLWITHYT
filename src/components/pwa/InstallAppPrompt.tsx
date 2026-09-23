import React, { useState, useEffect } from 'react';
import { pwaService, PlatformType } from '../../services/pwa/PwaService';
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Share, 
  PlusSquare, 
  Check, 
  X, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Music2,
  Tv
} from 'lucide-react';

interface InstallAppPromptProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const InstallAppPrompt: React.FC<InstallAppPromptProps> = ({ forceOpen = false, onClose }) => {
  const [pwaState, setPwaState] = useState(pwaService.getState());
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    return pwaService.subscribe(() => {
      setPwaState({ ...pwaService.getState() });
    });
  }, []);

  useEffect(() => {
    if (forceOpen) {
      setIsVisible(true);
      return;
    }

    // Check if already in standalone mode
    if (pwaState.isStandalone) {
      setIsVisible(false);
      return;
    }

    // Check if previously dismissed in this session
    const dismissed = sessionStorage.getItem('chillwithyt_install_dismissed');
    if (dismissed) {
      setIsVisible(false);
      return;
    }

    // Show prompt after a pleasant 3.5s delay so first-time users can see the app first
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3500);

    return () => clearTimeout(timer);
  }, [forceOpen, pwaState.isStandalone]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('chillwithyt_install_dismissed', 'true');
    onClose?.();
  };

  const handleInstallClick = async () => {
    setIsInstalling(true);
    const success = await pwaService.promptInstall();
    setIsInstalling(false);
    if (success) {
      setInstalledSuccess(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 2000);
    }
  };

  if (!isVisible || pwaState.isStandalone) {
    return null;
  }

  const isMobile = pwaState.platform === 'ios' || pwaState.platform === 'android';
  const isIOS = pwaState.platform === 'ios';

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in select-none">
      <div 
        className="relative w-full max-w-lg bg-[#18181B] border border-[#2D2D32] rounded-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent Glow Header */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse" />

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-3 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-lg shadow-red-900/30 border border-white/10 shrink-0">
              <img src="/icon.png" alt="ChillWithYT Icon" className="w-full h-full object-cover" />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-2xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  {isMobile ? 'Add ChillWithYT to Phone Home Screen' : 'Add ChillWithYT to PC / Laptop Desktop Screen'}
                </h3>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                {isMobile 
                  ? 'Adds launcher icon directly to your phone home screen • Native app feel' 
                  : 'Adds shortcut icon to your Laptop Desktop Screen • Standalone software window'}
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 space-y-4 text-xs">
          {/* Feature Badges */}
          <div className="grid grid-cols-3 gap-2 py-1">
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-center flex flex-col items-center gap-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white text-[11px]">
                {isMobile ? 'Phone Home Screen' : 'Laptop Desktop'}
              </span>
              <span className="text-[9px] text-white/40">Direct desktop icon</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-center flex flex-col items-center gap-1">
              <Music2 className="w-4 h-4 text-red-500" />
              <span className="font-bold text-white text-[11px]">Standalone Window</span>
              <span className="text-[9px] text-white/40">No URL bar / tabs</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-center flex flex-col items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white text-[11px]">Background Audio</span>
              <span className="text-[9px] text-white/40">Continuous playback</span>
            </div>
          </div>

          {/* Platform Specific Guidance */}
          {isIOS ? (
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5">
              <p className="font-bold text-white flex items-center gap-1.5 text-xs">
                <span>How to add to your iPhone / iPad Home Screen:</span>
              </p>
              <div className="space-y-2 text-white/80">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-white/10 text-white font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                  <span className="flex items-center gap-1">
                    Tap the <strong className="text-white flex items-center gap-1"><Share className="w-3.5 h-3.5 text-blue-400" /> Share button</strong> in Safari toolbar at the bottom
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-white/10 text-white font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                  <span className="flex items-center gap-1">
                    Scroll down and select <strong className="text-white flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 text-red-400" /> Add to Home Screen</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-white/10 text-white font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                  <span>Tap <strong className="text-white">Add</strong> in top right. You can now launch ChillWithYT right from your home screen!</span>
                </div>
              </div>
            </div>
          ) : isMobile ? (
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">
                  Android Phone Home Screen Installation
                </p>
                <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed">
                  Adds the ChillWithYT app icon directly to your phone's home screen drawer. Tap the button below to install in 1 second!
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500 shrink-0 mt-0.5">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-white text-xs">
                    Adds Icon Directly to Your Laptop / PC Desktop Screen
                  </p>
                  <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed">
                    Installs ChillWithYT as desktop software. A shortcut icon is created on your <strong>Windows Desktop / Mac Desktop screen</strong> and pinned to your taskbar!
                  </p>
                </div>
              </div>

              {/* Browser fallback instructions for PC if beforeinstallprompt didn't trigger */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-white/70 space-y-1">
                <span className="font-bold text-white text-[11px] block">💻 In Chrome, Edge, or Brave on your PC:</span>
                <p>1. Click the <strong>Add to Desktop Screen</strong> button below.</p>
                <p>2. Or click the <strong>Install App icon (⊕ or 💻)</strong> at the right end of your browser's top URL address bar.</p>
                <p>3. Or click browser menu <code className="bg-white/10 px-1 py-0.5 rounded text-white">⋮</code> → <strong>"Save and share"</strong> → <strong>"Install ChillWithYT"</strong> or <strong>"Create shortcut"</strong>.</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-black/40">
          <button
            onClick={handleDismiss}
            className="text-xs text-white/40 hover:text-white transition px-3 py-2 rounded-xl hover:bg-white/5 cursor-pointer"
          >
            Not right now
          </button>

          {!isIOS ? (
            <button
              onClick={handleInstallClick}
              disabled={isInstalling || installedSuccess}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg cursor-pointer ${
                installedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-900/40 active:scale-95'
              }`}
            >
              {installedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Desktop / Home Screen!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{isMobile ? 'Add to Phone Home Screen' : 'Add to Laptop / PC Desktop Screen'}</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleDismiss}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Got it</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
