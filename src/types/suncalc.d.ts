/**
 * `suncalc` v2 exporte des fonctions nommées (ESM). `@types/suncalc` ne décrit
 * que la v1 (`export =`) : on déclare ici le sous-ensemble utilisé.
 */
declare module 'suncalc' {
  export function getPosition(
    date: Date,
    latitude: number,
    longitude: number,
  ): { azimuth: number; altitude: number };

  export function getMoonIllumination(date: Date): {
    fraction: number;
    phase: number;
    angle: number;
  };

  export function getTimes(
    date: Date,
    latitude: number,
    longitude: number,
    height?: number,
  ): Record<string, Date>;
}
