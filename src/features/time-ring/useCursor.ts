import { useSyncExternalStore } from 'react';

import {
  getActiveDayStart,
  getThrottledSnapshot,
  subscribeThrottled,
} from './cursor';

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

/**
 * Début (epoch) du jour affiché par la bague. Ne change qu'au choix d'un jour
 * dans le carrousel — l'égalité de valeur évite tout re-render pendant le scrub.
 */
export function useActiveDayStart(): number {
  return useSyncExternalStore(
    subscribeThrottled,
    getActiveDayStart,
    getActiveDayStart,
  );
}
