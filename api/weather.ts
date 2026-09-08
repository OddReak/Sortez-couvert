/**
 * GET /api/weather?lat&lon&lang&tempunit&windunit
 *
 * Route d'agrégation unique du front (brief §4.3). Renvoie un `WeatherSnapshot`.
 */
import { cacheControl } from './_lib/cache';
import { json, withApi } from './_lib/http';
import { parseWeatherQuery } from './_lib/params';
import { getWeatherSnapshot } from './_lib/weather-service';

export const config = { runtime: 'nodejs' } as const;

export function GET(request: Request): Promise<Response> {
  return withApi(request, async () => {
    const query = parseWeatherQuery(new URL(request.url).searchParams);
    const snapshot = await getWeatherSnapshot(query);
    return json(snapshot, { cacheControl: cacheControl('weather') });
  });
}
