/**
 * Accès au proxy `/api/*` (jamais Foreca en direct — brief §4.3 / §20).
 */
import type { Place, Units, WeatherSnapshot } from '@/shared/types/domain';

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { accept: 'application/json' } });
  if (!res.ok) {
    throw new ApiError(`GET ${path} → ${String(res.status)}`, res.status);
  }
  return (await res.json()) as T;
}

export type WeatherQueryInput = {
  lat: number;
  lon: number;
  lang: 'fr' | 'en';
  units: Units;
};

export function fetchWeather(
  input: WeatherQueryInput,
): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    lat: String(input.lat),
    lon: String(input.lon),
    lang: input.lang,
    tempunit: input.units.temp,
    windunit: input.units.wind,
  });
  return getJson<WeatherSnapshot>(`/api/weather?${params.toString()}`);
}

export function fetchSearch(q: string, lang: 'fr' | 'en'): Promise<Place[]> {
  const params = new URLSearchParams({ q, lang });
  return getJson<{ results: Place[] }>(`/api/search?${params.toString()}`).then(
    (r) => r.results,
  );
}
