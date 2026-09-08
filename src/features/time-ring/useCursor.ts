import { useSyncExternalStore } from 'react';

import { getThrottledSnapshot, subscribeThrottled } from './cursor';

/**
 * Instant du curseur, rafraîchi à ~11 Hz max (brief §8.4). À utiliser
 * UNIQUEMENT dans les feuilles de l'arbre qui affichent une valeur temporelle
 * (température, métriques, sous-ligne) — jamais dans `HomeScreen`.
 */
export function useCursorEpoch(): number {
  return useSyncExternalStore(
    subscribeThrottled,
    getThrottledSnapshot,
    getThrottledSnapshot,
  );
}
