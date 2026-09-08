/**
 * Interpolation des valeurs entre deux points Foreca (brief §8.3).
 *
 * - Valeurs numériques (température, humidité, vent, pression, UV) : linéaire.
 * - Symbole / phrase / type de précipitation : PLUS PROCHE VOISIN, jamais
 *   interpolé (brief §8.3 / §20).
 * - Si l'une des deux bornes est `null`, le résultat est `null` (« — »).
 */

export type Keyed = { epoch: number };

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

/**
 * Trouve les deux pas qui encadrent `targetEpoch`.
 * `steps` DOIT être trié par `epoch` croissant.
 */
export function bracket<T extends Keyed>(
  steps: readonly T[],
  targetEpoch: number,
):
  { before: T; after: T; t: number } | { before: T; after: null; t: 0 } | null {
  if (steps.length === 0) return null;
  const first = steps[0];
  const last = steps[steps.length - 1];
  if (!first || !last) return null;

  if (targetEpoch <= first.epoch) return { before: first, after: null, t: 0 };
  if (targetEpoch >= last.epoch) return { before: last, after: null, t: 0 };

  for (let i = 0; i < steps.length - 1; i += 1) {
    const before = steps[i];
    const after = steps[i + 1];
    if (!before || !after) continue;
    if (targetEpoch >= before.epoch && targetEpoch <= after.epoch) {
      const span = after.epoch - before.epoch;
      const t = span === 0 ? 0 : (targetEpoch - before.epoch) / span;
      return { before, after, t };
    }
  }
  return null;
}

/** Valeur numérique interpolée linéairement, ou `null` si une borne manque. */
export function interpolateValue<T extends Keyed>(
  steps: readonly T[],
  targetEpoch: number,
  pick: (step: T) => number | null,
): number | null {
  const b = bracket(steps, targetEpoch);
  if (!b) return null;

  const beforeValue = pick(b.before);
  if (b.after === null) return beforeValue;

  const afterValue = pick(b.after);
  if (beforeValue === null || afterValue === null) return null;
  return lerp(beforeValue, afterValue, b.t);
}

/** Pas le plus proche (symbole, phrase, type de précip). */
export function nearestStep<T extends Keyed>(
  steps: readonly T[],
  targetEpoch: number,
): T | null {
  let best: T | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const step of steps) {
    const dist = Math.abs(step.epoch - targetEpoch);
    if (dist < bestDist) {
      bestDist = dist;
      best = step;
    }
  }
  return best;
}
