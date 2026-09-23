// Progressive Web App (PWA) & Install Manager Service

export type PlatformType = 'ios' | 'android' | 'desktop_windows' | 'desktop_mac' | 'desktop_other';

interface PwaState {
  canInstall: boolean;
  isStandalone: boolean;
  platform: PlatformType;
  deferredPrompt: any;
  hasBeenInstalled: boolean;
}

class PwaService {
  private static instance: PwaService;
  private state: PwaState = {
    canInstall: false,
    isStandalone: false,
    platform: 'desktop_windows',
    deferredPrompt: null,
    hasBeenInstalled: false,
  };
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.detectStandalone();
    this.detectPlatform();
    this.registerServiceWorker();
    this.initInstallPromptListener();
  }

  public static getInstance(): PwaService {
    if (!PwaService.instance) {
      PwaService.instance = new PwaService();
    }
    return PwaService.instance;
  }

  private detectStandalone() {
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    this.state.isStandalone = isStandalone;
  }

  private detectPlatform() {
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      this.state.platform = 'ios';
    } else if (/android/.test(ua)) {
      this.state.platform = 'android';
    } else if (/macintosh|mac os x/.test(ua)) {
      this.state.platform = 'desktop_mac';
    } else if (/windows/.test(ua)) {
      this.state.platform = 'desktop_windows';
    } else {
      this.state.platform = 'desktop_other';
    }
  }

  private registerServiceWorker() {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('PWA Service Worker registered:', reg.scope);
          })
          .catch((err) => {
            console.warn('PWA SW registration notice:', err);
          });
      });
    }
  }

  private initInstallPromptListener() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent automatic mini-infobar
      e.preventDefault();
      this.state.deferredPrompt = e;
      this.state.canInstall = true;
      this.notify();
    });

    window.addEventListener('appinstalled', () => {
      this.state.canInstall = false;
      this.state.deferredPrompt = null;
      this.state.hasBeenInstalled = true;
      this.state.isStandalone = true;
      localStorage.setItem('chillwithyt_installed', 'true');
      this.notify();
    });
  }

  public getState(): PwaState {
    return this.state;
  }

  public async promptInstall(): Promise<boolean> {
    if (!this.state.deferredPrompt) {
      return false;
    }

    try {
      this.state.deferredPrompt.prompt();
      const choiceResult = await this.state.deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        this.state.canInstall = false;
        this.state.deferredPrompt = null;
        this.notify();
        return true;
      }
    } catch (err) {
      console.warn('Failed to prompt installation:', err);
    }
    return false;
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }
}

export const pwaService = PwaService.getInstance();
