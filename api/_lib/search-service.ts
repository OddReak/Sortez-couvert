/**
 * Recherche de ville : Foreca `location/search` → `Place[]` (brief §4.2).
 */
import type { Place } from '../../src/shared/types/domain';
import { withCache } from './cache';
import { forecaGet } from './foreca';
import { normalizePlace } from './normalize';
import type { SearchQuery } from './params';
import { forecaSearchResponseSchema } from './schemas';

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
