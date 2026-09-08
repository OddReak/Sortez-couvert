/**
 * Accumulation d'angle continue — gère le passage ±π (brief §8.2).
 *
 * Le bug classique de la bague : `Math.atan2` saute de +π à −π quand le doigt
 * franchit le haut du cercle. Un `delta = angle - anglePrécédent` naïf produit
 * alors un bond de ~2π (soit 12 h de scrub d'un coup). On borne chaque delta
 * à [−π, π].
 */

const TWO_PI = Math.PI * 2;

/** Plus petit écart signé entre deux angles (radians), dans [−π, π]. */
export function shortestAngleDelta(from: number, to: number): number {
  let d = (to - from) % TWO_PI;
  if (d > Math.PI) d -= TWO_PI;
  if (d < -Math.PI) d += TWO_PI;
  return d;
}

/** Angle (radians) d'un point (x, y) autour d'un centre, 0 = « à droite ». */
export function pointerAngle(
  x: number,
  y: number,
  cx: number,
  cy: number,
): number {
  return Math.atan2(y - cy, x - cx);
}

/**
 * Accumulateur : additionne les deltas bornés au fil des `push()`.
 * `total` est l'angle parcouru depuis le dernier `reset()`.
 */
export class AngleAccumulator {
  private last: number | null = null;
  total = 0;

  reset(startAngle?: number): void {
    this.last = startAngle ?? null;
    this.total = 0;
  }

  push(angle: number): number {
    if (this.last === null) {
      this.last = angle;
      return 0;
    }
    const delta = shortestAngleDelta(this.last, angle);
    this.last = angle;
    this.total += delta;
    return delta;
  }
}
