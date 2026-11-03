import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

const IS_NATIVE = Capacitor.isNativePlatform();

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export type InstallState = {
  installed: boolean;
  /** Rodando como app Android (APK). */
  isNative: boolean;
  canPrompt: boolean;
  isIOS: boolean;
  /** Mostrar o botão "Instalar app"? */
  available: boolean;
  install: () => Promise<'prompted' | 'ios-help' | 'unavailable'>;
};

export function useInstallState(): InstallState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(IS_NATIVE);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (IS_NATIVE) return;
    const mq = window.matchMedia('(display-mode: standalone)');
    const check = () =>
      setInstalled(mq.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    check();
    const ua = navigator.userAgent;
    setIsIOS(/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    mq.addEventListener?.('change', check);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      mq.removeEventListener?.('change', check);
    };
  }, []);

  const install = useCallback(async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
      setDeferred(null);
      return 'prompted' as const;
    }
    if (isIOS) return 'ios-help' as const;
    return 'unavailable' as const;
  }, [deferred, isIOS]);

  return {
    installed,
    isNative: IS_NATIVE,
    canPrompt: !!deferred,
    isIOS,
    available: !installed && (!!deferred || isIOS),
    install,
  };
}

export const InstallContext = createContext<InstallState>({
  installed: false,
  isNative: false,
  canPrompt: false,
  isIOS: false,
  available: false,
  install: async () => 'unavailable',
});
export const useInstall = () => useContext(InstallContext);
