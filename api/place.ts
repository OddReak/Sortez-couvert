/**
 * GET /api/place?lat&lon&lang — coordonnées → lieu (nom, pays, fuseau).
 * Sert la géolocalisation : le device donne lat/lon, on remonte le `Place`.
 */
import { cacheControl } from './_lib/cache';
import { json, withApi } from './_lib/http';
import { parsePlaceQuery } from './_lib/params';
import { resolvePlace } from './_lib/place-service';

export const config = { runtime: 'nodejs' } as const;

export function GET(request: Request): Promise<Response> {
  return withApi(request, async () => {
    const q = parsePlaceQuery(new URL(request.url).searchParams);
    const place = await resolvePlace(q.lat, q.lon, q.lang);
    return json(place, { cacheControl: cacheControl('location-meta') });
  });
}
