import type { WeatherSnapshot } from '@/shared/types/domain';

/**
 * Recale les horodatages d'un `WeatherSnapshot` de fixture sur « maintenant »,
 * pour que le mock reste réaliste (l'instant courant tombe bien sur `current`,
 * la rangée d'heures encadre le présent).
 */
export function rebaseSnapshot(
  snapshot: WeatherSnapshot,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): WeatherSnapshot {
  // On cale sur l'heure ronde la plus proche → la rangée d'heures reste propre.
  const nearestHour = Math.round(nowSeconds / 3600) * 3600;
  const delta = nearestHour - snapshot.current.epoch;
  const shiftIso = (iso: string): string =>
    new Date(
      (Date.parse(iso) || nowSeconds * 1000) + delta * 1000,
    ).toISOString();

  return {
    ...snapshot,
    fetchedAt: nowSeconds * 1000,
    current: {
      ...snapshot.current,
      epoch: snapshot.current.epoch + delta,
      time: shiftIso(snapshot.current.time),
    },
    hourly: snapshot.hourly.map((s) => ({
      ...s,
      epoch: s.epoch + delta,
      time: shiftIso(s.time),
    })),
    daily: snapshot.daily.map((d) => ({
      ...d,
      sunriseEpoch: d.sunriseEpoch === null ? null : d.sunriseEpoch + delta,
      sunsetEpoch: d.sunsetEpoch === null ? null : d.sunsetEpoch + delta,
    })),
    airQuality: snapshot.airQuality.map((a) => ({
      ...a,
      time: shiftIso(a.time),
    })),
  };
}
