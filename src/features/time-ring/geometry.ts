/**
 * Correspondance angle ↔ instant, et disposition des graduations (brief §8.1).
 *
 * - Un tour complet de bague = 12 heures (question 7, défaut).
 * - Plage : −24 h → +72 h autour de « maintenant » (question 6, défaut).
 * - Sens horaire = on avance dans le temps (brief §8.2).
 */

export const SECONDS_PER_TURN = 12 * 3600;
export const RANGE_PAST_SECONDS = 24 * 3600;
export const RANGE_FUTURE_SECONDS = 72 * 3600;

const TWO_PI = Math.PI * 2;

/** Angle parcouru (radians, horaire) → décalage temporel (secondes). */
export function angleToSeconds(totalAngle: number): number {
  return (totalAngle / TWO_PI) * SECONDS_PER_TURN;
}

/** Décalage temporel (secondes) → angle sur la bague (radians, 0 = haut). */
export function secondsToAngle(seconds: number): number {
  return (seconds / SECONDS_PER_TURN) * TWO_PI;
}

/** Borne un instant à la plage autorisée autour de `nowEpoch`. */
export function clampEpoch(epoch: number, nowEpoch: number): number {
  return Math.max(
    nowEpoch - RANGE_PAST_SECONDS,
    Math.min(nowEpoch + RANGE_FUTURE_SECONDS, epoch),
  );
}

export type Graduation = {
  epoch: number;
  /** Angle sur la bague, radians, 0 = haut, sens horaire. */
  angle: number;
  /** Trait long + libellé toutes les 3 h. */
  major: boolean;
};

/**
 * Graduations horaires visibles autour de l'instant `cursorEpoch` :
 * ± `windowHours` (par défaut un peu plus d'un demi-tour pour couvrir l'anneau).
 */
export function graduations(
  cursorEpoch: number,
  nowEpoch: number,
  windowHours = 7,
): Graduation[] {
  const cursorHour = Math.round(cursorEpoch / 3600);
  const minHour = Math.ceil((nowEpoch - RANGE_PAST_SECONDS) / 3600);
  const maxHour = Math.floor((nowEpoch + RANGE_FUTURE_SECONDS) / 3600);

  const out: Graduation[] = [];
  for (
    let h = cursorHour - windowHours;
    h <= cursorHour + windowHours;
    h += 1
  ) {
    if (h < minHour || h > maxHour) continue;
    const epoch = h * 3600;
    out.push({
      epoch,
      angle: secondsToAngle(epoch - cursorEpoch),
      major: h % 3 === 0,
    });
  }
  return out;
}

/** Position (x, y) sur un cercle de rayon `r` pour un angle bague (0 = haut). */
export function ringPoint(
  angle: number,
  r: number,
  cx = 0,
  cy = 0,
): { x: number; y: number } {
  return { x: cx + Math.sin(angle) * r, y: cy - Math.cos(angle) * r };
}
