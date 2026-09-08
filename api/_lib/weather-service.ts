/**
 * Agrégation Foreca → `WeatherSnapshot` (brief §4.3).
 *
 * Budget d'appels : 5 requêtes Foreca à froid (meta + current + hourly + daily
 * + air-quality), 0 à chaud. L'endpoint `warning` n'est pas appelé (hors plan
 * Foreca d'Audric — 403).
 *
 * Séquencement : `location/{lon,lat}` d'abord (pour le fuseau IANA de la ville,
 * requis par `hourly` et `air-quality`), puis les 4 autres en parallèle
 * (`Promise.allSettled` : `daily` ou `air-quality` en échec = état vide, pas
 * d'écran cassé). `current` et `hourly` restent obligatoires.
 */
import { toForecaLocation } from '../../src/shared/lib/geo';
import type { Place, WeatherSnapshot } from '../../src/shared/types/domain';
import { withCache } from './cache';
import { forecaGet } from './foreca';
import { buildSnapshot, type SnapshotParts } from './normalize';
import type { WeatherQuery } from './params';
import { resolvePlace } from './place-service';
import {
  forecaAirQualityResponseSchema,
  forecaCurrentResponseSchema,
  forecaDailyResponseSchema,
  forecaHourlyResponseSchema,
} from './schemas';

const HOURLY_PERIODS = 72;
const DAILY_PERIODS = 10;
const AIR_QUALITY_PERIODS = 24;

const fetchPlace = (query: WeatherQuery): Promise<Place> =>
  resolvePlace(query.lat, query.lon, query.lang);

export async function getWeatherSnapshot(
  query: WeatherQuery,
): Promise<WeatherSnapshot> {
  const loc = toForecaLocation(query.lat, query.lon);
  const place = await fetchPlace(query);
  const tz = place.timezone;
  const unitKey = `${loc}:${query.lang}:${query.tempunit}:${query.windunit}`;

  const [current, hourly, daily, air] = await Promise.allSettled([
    withCache('current', unitKey, () =>
      forecaGet(`/api/v1/current/${loc}`, {
        params: {
          lang: query.lang,
          tempunit: query.tempunit,
          windunit: query.windunit,
          rounding: 0,
        },
      }).then((raw) => forecaCurrentResponseSchema.parse(raw).current),
    ),
    withCache('hourly', unitKey, () =>
      forecaGet(`/api/v1/forecast/hourly/${loc}`, {
        params: {
          periods: HOURLY_PERIODS,
          dataset: 'full',
          history: 1,
          tz,
          lang: query.lang,
          tempunit: query.tempunit,
          windunit: query.windunit,
          rounding: 0,
        },
      }).then((raw) => forecaHourlyResponseSchema.parse(raw).forecast),
    ),
    withCache('daily', `${loc}:${query.lang}:${query.tempunit}`, () =>
      forecaGet(`/api/v1/forecast/daily/${loc}`, {
        params: {
          periods: DAILY_PERIODS,
          dataset: 'full',
          lang: query.lang,
          tempunit: query.tempunit,
          rounding: 0,
        },
      }).then((raw) => forecaDailyResponseSchema.parse(raw).forecast),
    ),
    withCache('air-quality', `${loc}:${query.lang}`, () =>
      forecaGet(`/api/v1/air-quality/forecast/hourly/${loc}`, {
        params: {
          periods: AIR_QUALITY_PERIODS,
          tz,
          lang: query.lang,
        },
      }).then((raw) => forecaAirQualityResponseSchema.parse(raw).forecast),
    ),
  ]);

  if (current.status === 'rejected') throw current.reason;
  if (hourly.status === 'rejected') throw hourly.reason;

  const parts: SnapshotParts = {
    place,
    current: current.value.value,
    hourly: hourly.value.value,
    daily: daily.status === 'fulfilled' ? daily.value.value : [],
    airQuality: air.status === 'fulfilled' ? air.value.value : [],
  };

  return buildSnapshot(parts);
}
