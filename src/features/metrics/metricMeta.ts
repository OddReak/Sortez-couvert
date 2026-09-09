/**
 * Descripteurs des métriques « chartables » (brief §9.6) — vent, humidité, UV.
 *
 * La qualité de l'air a sa propre source (`AirQualityStep`, sous-indices EPA) et
 * est traitée à part dans `MetricSheet`.
 */
import { Droplets, Sun, Wind, type LucideIcon } from 'lucide-react';

import {
  EM_DASH,
  formatPercent,
  formatUvIndex,
  formatWind,
  uvIndexLevel,
} from '@/shared/lib/units';
import type { TimeStep, Units } from '@/shared/types/domain';

export type ChartMetricKey = 'wind' | 'humidity' | 'uv';
export type MetricKey = ChartMetricKey | 'aqi';

/**
 * Les valeurs du `WeatherSnapshot` arrivent déjà dans l'unité demandée (le
 * `queryKey` inclut les réglages, cf. `useWeatherSnapshot`) : la série du graphe
 * s'utilise telle quelle, seul le libellé d'axe dépend des réglages.
 */
export type MetricMeta = {
  key: ChartMetricKey;
  label: string;
  Icon: LucideIcon;
  /** Valeur depuis un pas horaire, dans l'unité d'affichage courante. */
  fromStep: (step: TimeStep) => number | null;
  /** Libellé complet d'une valeur, unité comprise. */
  format: (value: number | null, units: Units) => string;
  /** Unité courte pour l'axe du graphe. */
  axisUnit: (units: Units) => string;
  /** Explication courte affichée dans la sheet de détail. */
  explanation: string;
};

const WIND_AXIS: Record<Units['wind'], string> = {
  KMH: 'km/h',
  MS: 'm/s',
  MPH: 'mph',
};

export const METRIC_META: Record<ChartMetricKey, MetricMeta> = {
  wind: {
    key: 'wind',
    label: 'Vent',
    Icon: Wind,
    fromStep: (s) => s.windSpeed,
    format: (v, u) => formatWind(v, u.wind),
    axisUnit: (u) => WIND_AXIS[u.wind],
    explanation:
      'Vitesse moyenne du vent. Les rafales, plus fortes, peuvent la dépasser nettement. Sur 24 h, on repère les pics de milieu de journée.',
  },
  humidity: {
    key: 'humidity',
    label: 'Humidité',
    Icon: Droplets,
    fromStep: (s) => s.humidity,
    format: (v) => formatPercent(v),
    axisUnit: () => '%',
    explanation:
      "Humidité relative de l'air. Au-dessus de 70 %, l'air paraît lourd ; en dessous de 30 %, il assèche la peau et les voies respiratoires.",
  },
  uv: {
    key: 'uv',
    label: 'Indice UV',
    Icon: Sun,
    fromStep: (s) => s.uvIndex,
    format: (v) => (v === null ? EM_DASH : formatUvIndex(v)),
    axisUnit: () => 'UV',
    explanation:
      "Intensité du rayonnement ultraviolet. À partir de 3, une protection est conseillée ; à partir de 8, l'exposition doit être limitée aux heures fraîches.",
  },
};

type UvLevel = {
  level: NonNullable<ReturnType<typeof uvIndexLevel>>;
  label: string;
  from: number;
  colorVar: string;
};

/** Niveaux de l'indice UV — libellé + couleur pour l'échelle de la sheet. */
export const UV_LEVELS: UvLevel[] = [
  { level: 'low', label: 'Faible', from: 0, colorVar: 'var(--color-ok)' },
  {
    level: 'moderate',
    label: 'Modéré',
    from: 3,
    colorVar: 'var(--color-warn-yellow)',
  },
  {
    level: 'high',
    label: 'Élevé',
    from: 6,
    colorVar: 'var(--color-warn-orange)',
  },
  {
    level: 'very-high',
    label: 'Très élevé',
    from: 8,
    colorVar: 'var(--color-warn-red)',
  },
  {
    level: 'extreme',
    label: 'Extrême',
    from: 11,
    colorVar: 'var(--color-warn-violet)',
  },
];

export function uvLevelMeta(
  value: number | null,
): (typeof UV_LEVELS)[number] | null {
  const level = uvIndexLevel(value);
  return level ? (UV_LEVELS.find((l) => l.level === level) ?? null) : null;
}
