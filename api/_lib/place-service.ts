/**
 * Résolution d'un lieu depuis des coordonnées (Foreca `location/{lon,lat}`).
 * Utilisé par `/api/place` (géolocalisation) et par l'agrégateur météo.
 */
import { toForecaLocation } from '../../src/shared/lib/geo.js';
import type { Place } from '../../src/shared/types/domain.js';
import { withCache } from './cache.js';
import { forecaGet } from './foreca.js';
import { normalizePlace } from './normalize.js';
import { forecaLocationMetaSchema } from './schemas.js';

export async function resolvePlace(
  lat: number,
  lon: number,
  lang: string,
): Promise<Place> {
  const loc = toForecaLocation(lat, lon);
  const { value } = await withCache('location-meta', `${loc}:${lang}`, () =>
    forecaGet(`/api/v1/location/${loc}`, { params: { lang } }).then((raw) =>
      forecaLocationMetaSchema.parse(raw),
    ),
  );
  return normalizePlace(value, value.timezone);
}
