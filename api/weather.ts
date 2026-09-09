/**
 * GET /api/weather?lat&lon&lang&tempunit&windunit
 *
 * Route d'agrégation unique du front (brief §4.3). Renvoie un `WeatherSnapshot`.
 */
import { cacheControl } from './_lib/cache.js';
import { json, withApi } from './_lib/http.js';
import { parseWeatherQuery } from './_lib/params.js';
import { getWeatherSnapshot } from './_lib/weather-service.js';

export const config = { runtime: 'nodejs' } as const;

export function GET(request: Request): Promise<Response> {
  return withApi(request, async () => {
    const query = parseWeatherQuery(new URL(request.url).searchParams);
    const snapshot = await getWeatherSnapshot(query);
    return json(snapshot, { cacheControl: cacheControl('weather') });
  });
}
