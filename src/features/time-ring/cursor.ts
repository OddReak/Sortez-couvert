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
  /** Bornes de la journée affichée par la bague (00:00 → 23:59, fuseau ville). */
  dayStart: number;
  dayEnd: number;
};

/** Fenêtre « aujourd'hui » de repli avant que l'écran ne fournisse le fuseau. */
function fallbackDay(now: number): { start: number; end: number } {
  const start = Math.floor(now / 86_400) * 86_400;
  return { start, end: start + 86_400 - 1 };
}

let today = fallbackDay(nowSeconds());

let state: CursorState = {
  epoch: nowSeconds(),
  following: true,
  scrubbing: false,
  dayStart: today.start,
  dayEnd: today.end,
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
  state = { ...state, epoch, following: false, scrubbing };
  emitFast();
  scheduleThrottled();
}

/** Revient à « maintenant » : jour du jour, heure réelle (double-tap, Home). */
export function followNow(): void {
  state = {
    epoch: nowSeconds(),
    following: true,
    scrubbing: false,
    dayStart: today.start,
    dayEnd: today.end,
  };
  emitFast();
  scheduleThrottled();
}

/** Bornes de la journée actuellement pilotée par la bague. */
export function getDayWindow(): { start: number; end: number } {
  return { start: state.dayStart, end: state.dayEnd };
}

/** Début (epoch) du jour affiché — pour surligner le carrousel sous le globe. */
export function getActiveDayStart(): number {
  return state.dayStart;
}

/**
 * Déclare les bornes du jour « aujourd'hui » (fuseau de la ville) et recale la
 * bague dessus. Appelé au montage de l'écran et à chaque changement de ville.
 */
export function configureToday(start: number, end: number): void {
  today = { start, end };
  state = {
    epoch: nowSeconds(),
    following: true,
    scrubbing: false,
    dayStart: start,
    dayEnd: end,
  };
  emitFast();
  scheduleThrottled();
}

/**
 * L'utilisateur choisit un jour dans le carrousel sous le globe. Le globe et le
 * thème suivent alors ce jour ; on conserve l'heure de la journée en cours.
 */
export function selectDay(start: number, end: number): void {
  if (start === today.start) {
    followNow();
    return;
  }
  const span = end - start;
  const timeOfDay = Math.min(
    Math.max(getCursorEpoch() - state.dayStart, 0),
    span,
  );
  state = {
    epoch: Math.min(Math.max(start + timeOfDay, start), end),
    following: false,
    scrubbing: false,
    dayStart: start,
    dayEnd: end,
  };
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
  today = fallbackDay(nowSeconds());
  state = {
    epoch: nowSeconds(),
    following: true,
    scrubbing: false,
    dayStart: today.start,
    dayEnd: today.end,
  };
  fastListeners.clear();
  throttledListeners.clear();
  throttleScheduled = false;
  lastThrottleAt = 0;
}
