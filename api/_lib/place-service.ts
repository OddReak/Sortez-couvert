/**
 * Résolution d'un lieu depuis des coordonnées (Foreca `location/{lon,lat}`).
 * Utilisé par `/api/place` (géolocalisation) et par l'agrégateur météo.
 */
import { toForecaLocation } from '../../src/shared/lib/geo';
import type { Place } from '../../src/shared/types/domain';
import { withCache } from './cache';
import { forecaGet } from './foreca';
import { normalizePlace } from './normalize';
import { forecaLocationMetaSchema } from './schemas';

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
