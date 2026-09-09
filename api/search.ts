/**
 * GET /api/search?q&lang — recherche de ville (brief §4.2).
 */
import { cacheControl } from './_lib/cache.js';
import { json, withApi } from './_lib/http.js';
import { parseSearchQuery } from './_lib/params.js';
import { searchPlaces } from './_lib/search-service.js';

export const config = { runtime: 'nodejs' } as const;

export function GET(request: Request): Promise<Response> {
  return withApi(request, async () => {
    const query = parseSearchQuery(new URL(request.url).searchParams);
    const results = await searchPlaces(query);
    return json({ results }, { cacheControl: cacheControl('location-search') });
  });
}
