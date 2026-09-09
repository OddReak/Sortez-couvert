import { useQuery } from '@tanstack/react-query';

import { useSettings } from '@/features/settings/store';
import { interpolateValue, nearestStep } from '@/shared/lib/interpolate';
import { resolveTheme, type ThemePaint } from '@/shared/lib/theme';
import type { Place, TimeStep, WeatherSnapshot } from '@/shared/types/domain';

import { fetchWeather, type WeatherQueryInput } from './api';
import { loadSnapshot, saveSnapshot } from './snapshotCache';

/**
 * Récupère la météo ; en cas d'échec réseau, retombe sur le dernier snapshot
 * mis en cache pour ce lieu (brief §9.11). Un succès rafraîchit le cache.
 */
export async function resolveWeather(
  placeId: string,
  input: WeatherQueryInput,
): Promise<WeatherSnapshot> {
  try {
    const snapshot = await fetchWeather(input);
    // Attendre l'écriture : garantit que le repli hors ligne est disponible.
    await saveSnapshot(placeId, snapshot);
    return snapshot;
  } catch (error) {
    const cached = await loadSnapshot(placeId);
    if (cached) return cached.snapshot;
    throw error;
  }
}

export function useWeatherSnapshot(place: Place) {
  const language = useSettings((s) => s.language);
  const units = useSettings((s) => s.units);

  return useQuery({
    queryKey: ['weather', place.id, language, units.temp, units.wind] as const,
    queryFn: () =>
      resolveWeather(place.id, {
        lat: place.lat,
        lon: place.lon,
        lang: language,
        units,
      }),
    networkMode: 'offlineFirst',
  });
}

export type DisplayedConditions = {
  atEpoch: number;
  isNow: boolean;
  /** Pas météo affiché : nombres interpolés, symbole/phrase au plus proche. */
  step: TimeStep;
  theme: ThemePaint;
};

/** Valeur numérique au moment sélectionné (linéaire entre les pas). */
function pickNumeric(
  hourly: readonly TimeStep[],
  atEpoch: number,
  key: keyof TimeStep,
): number | null {
  return interpolateValue(hourly, atEpoch, (s) => {
    const v = s[key];
    return typeof v === 'number' ? v : null;
  });
}

export function selectConditions(
  snapshot: WeatherSnapshot,
  selectedEpoch: number | null,
  now: number,
  highContrast = false,
): DisplayedConditions {
  // `null` = « suit maintenant » → on utilise l'instant réel + les mesures
  // observées (`snapshot.current`), pas un pas interpolé.
  if (selectedEpoch === null) {
    const today = snapshot.daily[0];
    return {
      atEpoch: now,
      isNow: true,
      step: { ...snapshot.current, epoch: now },
      theme: resolveTheme({
        atSeconds: now,
        sunriseSeconds: today?.sunriseEpoch ?? null,
        sunsetSeconds: today?.sunsetEpoch ?? null,
        highContrast,
      }),
    };
  }

  const atEpoch = selectedEpoch;
  const isNow = Math.abs(atEpoch - now) < 30 * 60;

  const hourly = snapshot.hourly;
  const anchor = nearestStep(hourly, atEpoch) ?? snapshot.current;

  const step: TimeStep = {
    time: anchor.time,
    epoch: atEpoch,
    symbol: anchor.symbol,
    phrase: anchor.phrase,
    windDirLabel: anchor.windDirLabel,
    precipType: anchor.precipType,
    temp: pickNumeric(hourly, atEpoch, 'temp'),
    feelsLike: pickNumeric(hourly, atEpoch, 'feelsLike'),
    humidity: pickNumeric(hourly, atEpoch, 'humidity'),
    windSpeed: pickNumeric(hourly, atEpoch, 'windSpeed'),
    windDir: pickNumeric(hourly, atEpoch, 'windDir'),
    gust: pickNumeric(hourly, atEpoch, 'gust'),
    precipProb: pickNumeric(hourly, atEpoch, 'precipProb'),
    precipAccum: pickNumeric(hourly, atEpoch, 'precipAccum'),
    cloudiness: pickNumeric(hourly, atEpoch, 'cloudiness'),
    uvIndex: pickNumeric(hourly, atEpoch, 'uvIndex'),
    pressure: pickNumeric(hourly, atEpoch, 'pressure'),
    visibility: pickNumeric(hourly, atEpoch, 'visibility'),
  };

  const today = snapshot.daily[0];
  const theme = resolveTheme({
    atSeconds: atEpoch,
    sunriseSeconds: today?.sunriseEpoch ?? null,
    sunsetSeconds: today?.sunsetEpoch ?? null,
    highContrast,
  });

  return { atEpoch, isNow, step, theme };
}
