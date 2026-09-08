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

type Row = {
  key: string;
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
}: {
  step: TimeStep;
  units: Units;
  snapshot: WeatherSnapshot;
}) {
  const rows = buildRows(step, units, snapshot);

  return (
    <ul className="flex min-w-[9.5rem] flex-col gap-2">
      {rows.map(({ key, Icon, label, value, hint }) => (
        <li key={key} className="flex items-center gap-2.5">
          <Icon size={17} className="ink-faint shrink-0" aria-hidden />
          <span className="ink-muted text-sm">{label}</span>
          <span className="ml-auto text-right">
            <span className="font-semibold tabular-nums">{value}</span>
            {hint ? (
              <span className="ink-muted ml-1 text-xs">{hint}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
