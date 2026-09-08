/**
 * Qualité de l'air — échelle EPA (brief §9.8).
 */
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

export function aqiLevelLabel(aqi: number | null): string | null {
  const band = aqiBand(aqi);
  return band ? LABELS[band] : null;
}
