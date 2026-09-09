/**
 * Qualité de l'air — échelle EPA (brief §9.8).
 */
import type { AirQualityStep, AqiPollutant } from '@/shared/types/domain';

export type AqiBand =
  | 'good'
  | 'moderate'
  | 'sensitive'
  | 'unhealthy'
  | 'very-unhealthy'
  | 'hazardous';

export function aqiBand(aqi: number | null): AqiBand | null {
  if (aqi === null || !Number.isFinite(aqi)) return null;
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'sensitive';
  if (aqi <= 200) return 'unhealthy';
  if (aqi <= 300) return 'very-unhealthy';
  return 'hazardous';
}

const LABELS: Record<AqiBand, string> = {
  good: 'Bonne',
  moderate: 'Moyenne',
  sensitive: 'Médiocre',
  unhealthy: 'Mauvaise',
  'very-unhealthy': 'Très mauvaise',
  hazardous: 'Dangereuse',
};

/** Token `@theme` de la bande (fond des pastilles / barres). */
const BAND_COLOR: Record<AqiBand, string> = {
  good: 'var(--color-aqi-good)',
  moderate: 'var(--color-aqi-moderate)',
  sensitive: 'var(--color-aqi-sensitive)',
  unhealthy: 'var(--color-aqi-unhealthy)',
  'very-unhealthy': 'var(--color-aqi-very-unhealthy)',
  hazardous: 'var(--color-aqi-hazardous)',
};

/** Borne haute de chaque bande — sert à dessiner l'échelle et à normaliser. */
export const AQI_BAND_MAX: Record<AqiBand, number> = {
  good: 50,
  moderate: 100,
  sensitive: 150,
  unhealthy: 200,
  'very-unhealthy': 300,
  hazardous: 500,
};

export const AQI_BANDS: AqiBand[] = [
  'good',
  'moderate',
  'sensitive',
  'unhealthy',
  'very-unhealthy',
  'hazardous',
];

export function aqiLevelLabel(aqi: number | null): string | null {
  const band = aqiBand(aqi);
  return band ? LABELS[band] : null;
}

export function aqiBandLabel(band: AqiBand): string {
  return LABELS[band];
}

export function aqiBandColor(band: AqiBand | null): string {
  return band ? BAND_COLOR[band] : 'var(--app-ink-faint)';
}

/** Conseil santé court par bande (affiché dans la sheet de détail). */
const BAND_ADVICE: Record<AqiBand, string> = {
  good: "La qualité de l'air ne présente aucun risque.",
  moderate:
    'Acceptable ; les personnes très sensibles peuvent ressentir une gêne.',
  sensitive:
    'Les personnes sensibles (asthme, enfants, seniors) devraient limiter les efforts prolongés en extérieur.',
  unhealthy:
    'Tout le monde peut ressentir des effets ; les personnes sensibles doivent éviter les efforts en extérieur.',
  'very-unhealthy': 'Alerte sanitaire : limitez les activités en extérieur.',
  hazardous: "Urgence sanitaire : restez à l'intérieur, fenêtres fermées.",
};

export function aqiBandAdvice(band: AqiBand | null): string | null {
  return band ? BAND_ADVICE[band] : null;
}

export const AQI_POLLUTANT_LABELS: Record<AqiPollutant, string> = {
  co: 'Monoxyde de carbone (CO)',
  no2: "Dioxyde d'azote (NO₂)",
  o3: 'Ozone (O₃)',
  so2: 'Dioxyde de soufre (SO₂)',
  pm10: 'Particules PM10',
  pm25: 'Particules PM2,5',
};

/** Ordre d'affichage stable des sous-indices. */
export const AQI_POLLUTANT_ORDER: AqiPollutant[] = [
  'pm25',
  'pm10',
  'o3',
  'no2',
  'so2',
  'co',
];

/** Polluant au sous-indice le plus élevé (le « responsable » de l'AQI). */
export function dominantPollutant(step: AirQualityStep): AqiPollutant | null {
  const subs = step.subIndices;
  if (!subs) return null;
  let best: AqiPollutant | null = null;
  let bestValue = -Infinity;
  for (const key of AQI_POLLUTANT_ORDER) {
    const value = subs[key];
    if (typeof value === 'number' && value > bestValue) {
      best = key;
      bestValue = value;
    }
  }
  return best;
}
