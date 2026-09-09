import { useSyncExternalStore } from 'react';

/**
 * Enregistrement du service worker + état de mise à jour (brief §9.12).
 *
 * `skipWaiting` n'est jamais automatique : `onNeedRefresh` lève un drapeau, le
 * toast (`UpdatePrompt`) déclenche `applyUpdate()` sur action explicite.
 *
 * No-op en dev et dans les builds mock (là, MSW tient le service worker).
 */
type PwaState = { needRefresh: boolean; offlineReady: boolean };

let state: PwaState = { needRefresh: false, offlineReady: false };
const listeners = new Set<() => void>();
let updateSW: ((reload?: boolean) => Promise<void>) | undefined;

function setState(patch: Partial<PwaState>): void {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

function pwaDisabled(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCKS === 'true';
}

export async function registerServiceWorker(): Promise<void> {
  if (pwaDisabled() || updateSW) return;
  try {
    const { registerSW } = await import('virtual:pwa-register');
    updateSW = registerSW({
      immediate: true,
      onNeedRefresh: () => {
        setState({ needRefresh: true });
      },
      onOfflineReady: () => {
        setState({ offlineReady: true });
      },
      onRegisterError: (error) => {
        console.error('[pwa] échec d’enregistrement du service worker', error);
      },
    });
  } catch (error) {
    console.error('[pwa] service worker indisponible', error);
  }
}

/** Applique la mise à jour en attente et recharge (action utilisateur). */
export function applyUpdate(): void {
  void updateSW?.(true);
}

export function dismissUpdate(): void {
  setState({ needRefresh: false });
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): PwaState {
  return state;
}

export function usePwaStatus(): PwaState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/** Réservé aux tests — remet l'état à zéro. */
export function __resetPwaStatus(): void {
  state = { needRefresh: false, offlineReady: false };
  updateSW = undefined;
  listeners.clear();
}
