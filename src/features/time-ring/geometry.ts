/**
 * Correspondance angle ↔ instant, et disposition des graduations (brief §8.1).
 *
 * - Un tour complet de bague = 12 heures.
 * - Plage : la bague est un cadran 24 h — 00:00 → 23:59 du jour affiché
 *   (aujourd'hui par défaut, ou le jour choisi sous le globe).
 * - La bague suit le doigt : rotation sens horaire = on avance dans le temps,
 *   anti-horaire = on recule.
 */

export const SECONDS_PER_TURN = 12 * 3600;

const TWO_PI = Math.PI * 2;

/** Angle parcouru (radians, horaire) → décalage temporel (secondes). */
export function angleToSeconds(totalAngle: number): number {
  return (totalAngle / TWO_PI) * SECONDS_PER_TURN;
}

/** Décalage temporel (secondes) → angle sur la bague (radians, 0 = haut). */
export function secondsToAngle(seconds: number): number {
  return (seconds / SECONDS_PER_TURN) * TWO_PI;
}

/** Borne un instant à la journée affichée `[dayStart, dayEnd]`. */
export function clampEpoch(
  epoch: number,
  dayStart: number,
  dayEnd: number,
): number {
  return Math.max(dayStart, Math.min(dayEnd, epoch));
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
 * ± `windowHours` (par défaut un peu plus d'un demi-tour pour couvrir l'anneau),
 * bornées à la journée affichée `[dayStart, dayEnd]`.
 *
 * L'angle place le FUTUR en anti-horaire : en tournant la bague dans le sens
 * horaire, ces graduations remontent vers le repère du haut (le temps avance).
 */
export function graduations(
  cursorEpoch: number,
  dayStart: number,
  dayEnd: number,
  windowHours = 7,
): Graduation[] {
  const cursorHour = Math.round(cursorEpoch / 3600);
  const minHour = Math.ceil(dayStart / 3600);
  const maxHour = Math.floor(dayEnd / 3600);

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
      angle: secondsToAngle(cursorEpoch - epoch),
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
