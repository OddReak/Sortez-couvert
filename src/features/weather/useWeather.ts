import { useQuery } from '@tanstack/react-query';

import { useSettings } from '@/features/settings/store';
import { interpolateValue, nearestStep } from '@/shared/lib/interpolate';
import { resolveTheme, type ThemePaint } from '@/shared/lib/theme';
import type { Place, TimeStep, WeatherSnapshot } from '@/shared/types/domain';

import { fetchWeather } from './api';

export function useWeatherSnapshot(place: Place) {
  const language = useSettings((s) => s.language);
  const units = useSettings((s) => s.units);

  return useQuery({
    queryKey: ['weather', place.id, language, units.temp, units.wind] as const,
    queryFn: () =>
      fetchWeather({
        lat: place.lat,
        lon: place.lon,
        lang: language,
        units,
      }),
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
  });

  return { atEpoch, isNow, step, theme };
}
