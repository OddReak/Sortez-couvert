/**
 * Accès au proxy pour les lieux (jamais Foreca en direct — brief §4.3).
 */
import { ApiError } from '@/features/weather/api';
import type { Place } from '@/shared/types/domain';

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { accept: 'application/json' } });
  if (!res.ok) {
    throw new ApiError(`GET ${path} → ${String(res.status)}`, res.status);
  }
  return (await res.json()) as T;
}

/** Coordonnées → lieu complet (nom, pays, fuseau). */
export function fetchPlaceByCoords(
  lat: number,
  lon: number,
  lang: 'fr' | 'en',
): Promise<Place> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    lang,
  });
  return getJson<Place>(`/api/place?${params.toString()}`);
}

export { fetchSearch } from '@/features/weather/api';
