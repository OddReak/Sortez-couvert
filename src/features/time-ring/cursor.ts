/**
 * Curseur temporel — l'instant affiché par toute l'app (brief §8.4).
 *
 * Contrainte : le scrub NE DOIT PAS provoquer un re-render React de tout
 * l'écran à chaque pixel. Ce module est un singleton hors React :
 *
 * - `subscribeFast` : notifié à CHAQUE changement — le globe (lecture dans
 *   `useFrame`, aucun state React).
 * - `subscribeThrottled` : notifié à ~11 Hz max — le texte du DOM
 *   (température, métriques, sous-ligne) via `useSyncExternalStore`.
 *
 * `following = true` → le curseur suit l'heure réelle (« En direct »).
 */
import { nowSeconds } from '@/shared/lib/time';

type CursorState = {
  epoch: number;
  following: boolean;
  scrubbing: boolean;
};

let state: CursorState = {
  epoch: nowSeconds(),
  following: true,
  scrubbing: false,
};

const fastListeners = new Set<() => void>();
const throttledListeners = new Set<() => void>();

const THROTTLE_MS = 90;
let throttleScheduled = false;
let lastThrottleAt = 0;

function emitFast(): void {
  for (const l of fastListeners) l();
}

function emitThrottled(): void {
  for (const l of throttledListeners) l();
}

function scheduleThrottled(): void {
  if (throttleScheduled) return;
  throttleScheduled = true;
  const elapsed =
    (typeof performance !== 'undefined' ? performance.now() : Date.now()) -
    lastThrottleAt;
  const wait = Math.max(0, THROTTLE_MS - elapsed);
  setTimeout(() => {
    throttleScheduled = false;
    lastThrottleAt =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    emitThrottled();
  }, wait);
}

export function getCursorEpoch(): number {
  return state.following ? nowSeconds() : state.epoch;
}

export function isFollowingNow(): boolean {
  return state.following;
}

export function isScrubbing(): boolean {
  return state.scrubbing;
}

/** Fixe le curseur sur un instant précis (bague, chips, clavier). */
export function setCursorEpoch(epoch: number, scrubbing = false): void {
  state = { epoch, following: false, scrubbing };
  emitFast();
  scheduleThrottled();
}

/** Revient à « maintenant » (double-tap, repère MAINTENANT, touche Home). */
export function followNow(): void {
  state = { epoch: nowSeconds(), following: true, scrubbing: false };
  emitFast();
  scheduleThrottled();
}

export function setScrubbing(scrubbing: boolean): void {
  if (state.scrubbing === scrubbing) return;
  state = { ...state, scrubbing };
  emitFast();
}

export function subscribeFast(cb: () => void): () => void {
  fastListeners.add(cb);
  return () => {
    fastListeners.delete(cb);
  };
}

export function subscribeThrottled(cb: () => void): () => void {
  throttledListeners.add(cb);
  return () => {
    throttledListeners.delete(cb);
  };
}

/** Snapshot pour `useSyncExternalStore` (nombre → égalité de valeur). */
export function getThrottledSnapshot(): number {
  return getCursorEpoch();
}

/** Réinitialise — test uniquement. */
export function __resetCursor(): void {
  state = { epoch: nowSeconds(), following: true, scrubbing: false };
  fastListeners.clear();
  throttledListeners.clear();
  throttleScheduled = false;
  lastThrottleAt = 0;
}
