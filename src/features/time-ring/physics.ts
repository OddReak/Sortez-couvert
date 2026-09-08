/**
 * Inertie et aimantation de la bague (brief §8.2).
 */

/** Friction appliquée à la vitesse angulaire à chaque frame (~0.94). */
export const FRICTION = 0.94;

/** En dessous de cette vitesse (secondes de temps / frame), on s'arrête. */
export const STOP_THRESHOLD_SECONDS = 40;

/** Fenêtre autour de « maintenant » pour l'aimantation renforcée. */
export const SNAP_TO_NOW_SECONDS = 30 * 60;

/** Applique la friction ; renvoie 0 sous le seuil d'arrêt. */
export function decayVelocity(velocity: number): number {
  const next = velocity * FRICTION;
  return Math.abs(next) < STOP_THRESHOLD_SECONDS ? 0 : next;
}

/**
 * Cible d'aimantation à l'arrêt :
 * - à moins de 30 min de « maintenant » → aimante sur maintenant (renforcé) ;
 * - sinon → aimante sur l'heure pleine la plus proche.
 */
export function snapTarget(epoch: number, nowEpoch: number): number {
  if (Math.abs(epoch - nowEpoch) <= SNAP_TO_NOW_SECONDS) {
    return nowEpoch;
  }
  return Math.round(epoch / 3600) * 3600;
}

/**
 * Interpolation critique douce vers une cible (pour l'animation d'aimantation
 * et le retour à « maintenant »). `stiffness` ∈ ]0, 1].
 */
export function approach(
  current: number,
  target: number,
  stiffness: number,
): number {
  const next = current + (target - current) * stiffness;
  return Math.abs(target - next) < 1 ? target : next;
}
