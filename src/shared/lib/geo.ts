/**
 * Helpers de coordonnées géographiques.
 *
 * ⚠️ Foreca attend l'ordre `longitude,latitude` dans les URL — l'inverse de
 * l'usage courant, et la source d'erreur n°1 du projet (brief §4.1 / §20).
 * Toute construction d'un segment de localisation Foreca DOIT passer par
 * `toForecaLocation()`. La concaténation manuelle de coordonnées est interdite
 * partout ailleurs (règle ESLint `no-restricted-syntax` à renforcer en Phase 1).
 */

/** Décimales de l'identifiant canonique d'un lieu (brief §4.5). */
export const PLACE_ID_PRECISION = 4;

/** Arrondi décimal stable (évite les artefacts binaires de `toFixed`). */
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function assertLatLon(lat: number, lon: number): void {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new RangeError(`Latitude invalide : ${String(lat)}`);
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new RangeError(`Longitude invalide : ${String(lon)}`);
  }
}

/**
 * Identifiant canonique d'un lieu : `"lat,lon"` arrondi à 4 décimales.
 * Sert de clé de cache, de favori et de `Place.id`.
 */
export function normalizePlaceId(lat: number, lon: number): string {
  assertLatLon(lat, lon);
  return `${String(roundTo(lat, PLACE_ID_PRECISION))},${String(
    roundTo(lon, PLACE_ID_PRECISION),
  )}`;
}

/**
 * Segment de chemin Foreca : `"longitude,latitude"` (ordre inversé, brief §4.1).
 * @example toForecaLocation(48.8566, 2.3522) // "2.3522,48.8566"
 */
export function toForecaLocation(lat: number, lon: number): string {
  assertLatLon(lat, lon);
  return `${String(lon)},${String(lat)}`;
}
