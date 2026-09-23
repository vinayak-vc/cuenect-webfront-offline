import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const installListeners = new Set<(canInstall: boolean) => void>();

/**
 * Register Service Worker on window load
 */
export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('[PWA] Service Worker registration failed:', error);
        });
    });

    // Capture beforeinstallprompt event for custom install button
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      installListeners.forEach((listener) => listener(true));
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      installListeners.forEach((listener) => listener(false));
      console.log('[PWA] Application successfully installed');
    });
  }
}

/**
 * Trigger browser native PWA installation dialog
 */
export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }
  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    installListeners.forEach((listener) => listener(false));
    return choice.outcome === 'accepted';
  } catch (err) {
    console.warn('[PWA] Install prompt failed:', err);
    return false;
  }
}

/**
 * Hook to observe PWA installability in React components
 */
export function usePWAInstall(): { canInstall: boolean; triggerInstall: () => Promise<boolean> } {
  const [canInstall, setCanInstall] = useState<boolean>(!!deferredPrompt);

  useEffect(() => {
    const listener = (available: boolean) => setCanInstall(available);
    installListeners.add(listener);
    return () => {
      installListeners.delete(listener);
    };
  }, []);

  return {
    canInstall,
    triggerInstall: promptPWAInstall
  };
}
