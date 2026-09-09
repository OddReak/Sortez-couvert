import { useEffect, useState } from 'react';

/**
 * Invite à l'installation (brief §9). Android / desktop Chromium exposent
 * `beforeinstallprompt` ; iOS Safari ne l'a pas → il faut passer par le menu
 * Partager (message affiché dans les réglages, pas de bannière intrusive).
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function useInstallPrompt(): {
  canInstall: boolean;
  promptInstall: () => void;
} {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    const onPrompt = (event: Event): void => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = (): void => {
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  return {
    canInstall: deferred !== null,
    promptInstall: () => {
      if (!deferred) return;
      void deferred.prompt();
      setDeferred(null);
    },
  };
}
