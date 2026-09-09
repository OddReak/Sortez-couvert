/**
 * Recherche de ville : Foreca `location/search` → `Place[]` (brief §4.2).
 */
import type { Place } from '../../src/shared/types/domain.js';
import { withCache } from './cache.js';
import { forecaGet } from './foreca.js';
import { normalizePlace } from './normalize.js';
import type { SearchQuery } from './params.js';
import { forecaSearchResponseSchema } from './schemas.js';

export async function searchPlaces(query: SearchQuery): Promise<Place[]> {
  const { value } = await withCache(
    'location-search',
    `${query.q.toLowerCase()}:${query.lang}`,
    () =>
      forecaGet(`/api/v1/location/search/${encodeURIComponent(query.q)}`, {
        params: { lang: query.lang },
      }).then((raw) => forecaSearchResponseSchema.parse(raw).locations),
  );

  return value.map((location) => normalizePlace(location));
}
