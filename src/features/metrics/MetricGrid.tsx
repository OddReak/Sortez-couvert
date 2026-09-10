import { Droplets, Leaf, Sun, Wind } from 'lucide-react';
import type { ComponentType } from 'react';

import { aqiLevelLabel } from '@/features/metrics/aqi';
import {
  EM_DASH,
  formatPercent,
  formatUvIndex,
  formatWind,
  uvIndexLevel,
} from '@/shared/lib/units';
import type { TimeStep, Units, WeatherSnapshot } from '@/shared/types/domain';

import type { MetricKey } from './metricMeta';

type Row = {
  key: MetricKey;
  Icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  hint: string | null;
};

const UV_LABEL: Record<NonNullable<ReturnType<typeof uvIndexLevel>>, string> = {
  low: 'Faible',
  moderate: 'Modéré',
  high: 'Élevé',
  'very-high': 'Très élevé',
  extreme: 'Extrême',
};

export function buildRows(
  step: TimeStep,
  units: Units,
  snapshot: WeatherSnapshot,
): Row[] {
  const uvLevel = uvIndexLevel(step.uvIndex);
  const aqi = snapshot.airQuality[0]?.aqi ?? null;

  return [
    {
      key: 'wind',
      Icon: Wind,
      label: 'Vent',
      value: formatWind(step.windSpeed, units.wind),
      hint: step.windDirLabel,
    },
    {
      key: 'humidity',
      Icon: Droplets,
      label: 'Humidité',
      value: formatPercent(step.humidity),
      hint: null,
    },
    {
      key: 'uv',
      Icon: Sun,
      label: 'Indice UV',
      value: formatUvIndex(step.uvIndex),
      hint: uvLevel ? UV_LABEL[uvLevel] : null,
    },
    {
      key: 'aqi',
      Icon: Leaf,
      label: "Qualité de l'air",
      value: aqi === null ? EM_DASH : String(Math.round(aqi)),
      hint: aqiLevelLabel(aqi),
    },
  ];
}

export function MetricGrid({
  step,
  units,
  snapshot,
  onSelect,
}: {
  step: TimeStep;
  units: Units;
  snapshot: WeatherSnapshot;
  onSelect?: (key: MetricKey) => void;
}) {
  const rows = buildRows(step, units, snapshot);

  return (
    <ul className="grid grid-cols-2 gap-x-3 text-sm">
      {rows.map(({ key, Icon, label, value, hint }) => {
        const content = (
          <>
            <span className="flex items-center gap-1.5">
              <Icon size={14} className="ink-faint shrink-0" aria-hidden />
              <span className="ink-muted truncate text-xs">{label}</span>
            </span>
            <span className="flex items-baseline gap-1">
              <span className="font-semibold tabular-nums">{value}</span>
              {hint ? (
                <span className="ink-muted truncate text-xs">{hint}</span>
              ) : null}
            </span>
          </>
        );

        return (
          <li key={key} className="min-w-0">
            {onSelect ? (
              <button
                type="button"
                onClick={() => {
                  onSelect(key);
                }}
                aria-label={`Détail : ${label}, ${value}${
                  hint ? `, ${hint}` : ''
                }`}
                className="flex min-h-11 w-full flex-col justify-center gap-0.5 rounded-lg text-left"
              >
                {content}
              </button>
            ) : (
              <span className="flex flex-col justify-center gap-0.5 py-1">
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
