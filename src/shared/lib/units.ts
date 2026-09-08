/**
 * Conversions et formatage d'unités (brief §5.3 / §10 / §13).
 *
 * Le proxy renvoie déjà les données dans les unités demandées ; ces fonctions
 * servent au formatage d'affichage et aux conversions instantanées lors d'un
 * changement de réglage sans re-fetch.
 *
 * Règle : une valeur `null` s'affiche « — », jamais `NaN` / `0` (brief §4.1).
 */
import type { Units } from '@/shared/types/domain';

export const EM_DASH = '—';

// ── Température ─────────────────────────────────────────────────────────────

export const celsiusToFahrenheit = (c: number): number => c * 1.8 + 32;
export const fahrenheitToCelsius = (f: number): number => (f - 32) / 1.8;

// ── Vent (référence interne : km/h) ────────────────────────────────────────

export const kmhToMs = (kmh: number): number => kmh / 3.6;
export const msToKmh = (ms: number): number => ms * 3.6;
export const kmhToMph = (kmh: number): number => kmh / 1.609344;
export const mphToKmh = (mph: number): number => mph * 1.609344;

export function convertWindFromKmh(kmh: number, to: Units['wind']): number {
  switch (to) {
    case 'KMH':
      return kmh;
    case 'MS':
      return kmhToMs(kmh);
    case 'MPH':
      return kmhToMph(kmh);
  }
}

// ── Formatage ──────────────────────────────────────────────────────────────

const WIND_UNIT_LABEL: Record<Units['wind'], string> = {
  KMH: 'km/h',
  MS: 'm/s',
  MPH: 'mph',
};

/** Arrondi « demi vers le haut » symétrique (−0,5 → −1, 0,5 → 1). */
export function roundHalfUp(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

/** Température nue pour l'affichage principal : « 21° » (l'unité est implicite). */
export function formatTemp(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return `${EM_DASH}°`;
  return `${String(roundHalfUp(value))}°`;
}

export function formatTempUnit(
  value: number | null,
  unit: Units['temp'],
): string {
  if (value === null || !Number.isFinite(value)) return `${EM_DASH}°`;
  return `${String(roundHalfUp(value))} °${unit}`;
}

export function formatWind(value: number | null, unit: Units['wind']): string {
  if (value === null || !Number.isFinite(value)) return EM_DASH;
  const rounded =
    unit === 'MS' ? Math.round(value * 10) / 10 : roundHalfUp(value);
  return `${String(rounded)} ${WIND_UNIT_LABEL[unit]}`;
}

export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return EM_DASH;
  return `${String(roundHalfUp(value))} %`;
}

export function formatUvIndex(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return EM_DASH;
  return String(roundHalfUp(value));
}

export function formatPressure(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return EM_DASH;
  return `${String(roundHalfUp(value))} hPa`;
}

export function formatVisibility(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return EM_DASH;
  const km = value / 1000;
  return km >= 10 ? '10+ km' : `${String(Math.round(km * 10) / 10)} km`;
}

/** Échelon qualitatif de l'indice UV (brief §9.6 « échelle UV »). */
export function uvIndexLevel(
  value: number | null,
): 'low' | 'moderate' | 'high' | 'very-high' | 'extreme' | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (value < 3) return 'low';
  if (value < 6) return 'moderate';
  if (value < 8) return 'high';
  if (value < 11) return 'very-high';
  return 'extreme';
}
