import { useMemo } from 'react';

import { interpolateValue, nearestStep } from '@/shared/lib/interpolate';
import { formatClock } from '@/shared/lib/time';
import { EM_DASH } from '@/shared/lib/units';
import { Sheet } from '@/shared/ui/Sheet';
import type {
  AirQualityStep,
  TimeStep,
  Units,
  WeatherSnapshot,
} from '@/shared/types/domain';

import {
  AQI_POLLUTANT_LABELS,
  AQI_POLLUTANT_ORDER,
  aqiBand,
  aqiBandAdvice,
  aqiBandColor,
  aqiBandLabel,
  dominantPollutant,
} from './aqi';
import { MetricChart, type MetricChartPoint } from './MetricChart';
import {
  METRIC_META,
  UV_LEVELS,
  uvLevelMeta,
  type MetricKey,
} from './metricMeta';

const WINDOW_BACK = 6 * 3600;
const WINDOW_FWD = 18 * 3600;

const TITLES: Record<MetricKey, string> = {
  wind: 'Vent',
  humidity: 'Humidité',
  uv: 'Indice UV',
  aqi: "Qualité de l'air",
};

export function MetricSheet({
  metricKey,
  onClose,
  snapshot,
  atEpoch,
  units,
}: {
  metricKey: MetricKey | null;
  onClose: () => void;
  snapshot: WeatherSnapshot;
  atEpoch: number;
  units: Units;
}) {
  return (
    <Sheet
      open={metricKey !== null}
      onClose={onClose}
      title={metricKey ? TITLES[metricKey] : ''}
    >
      {metricKey === 'aqi' ? (
        <AirQualityDetail
          steps={snapshot.airQuality}
          atEpoch={atEpoch}
          timezone={snapshot.place.timezone}
        />
      ) : metricKey ? (
        <ChartMetricDetail
          metricKey={metricKey}
          hourly={snapshot.hourly}
          atEpoch={atEpoch}
          timezone={snapshot.place.timezone}
          units={units}
        />
      ) : null}
    </Sheet>
  );
}

// ── Vent / Humidité / UV ──────────────────────────────────────────────────

function ChartMetricDetail({
  metricKey,
  hourly,
  atEpoch,
  timezone,
  units,
}: {
  metricKey: 'wind' | 'humidity' | 'uv';
  hourly: TimeStep[];
  atEpoch: number;
  timezone: string;
  units: Units;
}) {
  const meta = METRIC_META[metricKey];

  const series = useMemo<MetricChartPoint[]>(
    () =>
      hourly
        .filter(
          (s) =>
            s.epoch >= atEpoch - WINDOW_BACK && s.epoch <= atEpoch + WINDOW_FWD,
        )
        .map((s) => ({ epoch: s.epoch, value: meta.fromStep(s) })),
    [hourly, atEpoch, meta],
  );

  const currentValue = interpolateValue(hourly, atEpoch, meta.fromStep);
  const uvMeta = metricKey === 'uv' ? uvLevelMeta(currentValue) : null;

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-baseline gap-2">
        <span className="text-3xl font-light tabular-nums">
          {meta.format(currentValue, units)}
        </span>
        {uvMeta ? (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: uvMeta.colorVar }}
          >
            {uvMeta.label}
          </span>
        ) : null}
      </p>

      <MetricChart
        series={series}
        nowEpoch={atEpoch}
        timezone={timezone}
        label={meta.label}
        unit={meta.axisUnit(units)}
        formatValue={(v) => meta.format(v, units)}
        baselineZero={metricKey !== 'humidity'}
      />

      {metricKey === 'uv' ? <UvScale value={currentValue} /> : null}

      <p className="ink-muted text-sm">{meta.explanation}</p>

      <ValuesTable
        rows={series.map((p) => ({
          epoch: p.epoch,
          time: formatClock(p.epoch, timezone),
          value: meta.format(p.value, units),
        }))}
      />
    </div>
  );
}

function UvScale({ value }: { value: number | null }) {
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full">
        {UV_LEVELS.map((lvl) => (
          <span
            key={lvl.level}
            className="flex-1"
            style={{ backgroundColor: lvl.colorVar }}
            aria-hidden="true"
          />
        ))}
      </div>
      <ul className="ink-muted mt-1 flex justify-between text-[0.625rem]">
        {UV_LEVELS.map((lvl) => (
          <li
            key={lvl.level}
            className={
              value !== null && uvLevelMeta(value)?.level === lvl.level
                ? 'font-semibold text-[var(--app-ink)]'
                : ''
            }
          >
            {lvl.from}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Qualité de l'air ──────────────────────────────────────────────────────

function AirQualityDetail({
  steps,
  atEpoch,
  timezone,
}: {
  steps: AirQualityStep[];
  atEpoch: number;
  timezone: string;
}) {
  const withEpoch = useMemo(
    () =>
      steps.map((s) => ({
        ...s,
        epoch: Math.floor(Date.parse(s.time) / 1000),
      })),
    [steps],
  );

  const current = nearestStep(withEpoch, atEpoch) ?? withEpoch[0] ?? null;

  const series = useMemo<MetricChartPoint[]>(
    () =>
      withEpoch
        .filter(
          (s) =>
            s.epoch >= atEpoch - WINDOW_BACK && s.epoch <= atEpoch + WINDOW_FWD,
        )
        .map((s) => ({ epoch: s.epoch, value: s.aqi })),
    [withEpoch, atEpoch],
  );

  if (!current) {
    return (
      <p className="ink-muted py-6 text-sm">
        Qualité de l&apos;air indisponible pour ce lieu.
      </p>
    );
  }

  const band = aqiBand(current.aqi);
  const dominant = dominantPollutant(current);
  const advice = aqiBandAdvice(band);
  const subEntries = AQI_POLLUTANT_ORDER.filter(
    (key) => current.subIndices?.[key] != null,
  );
  const subMax = Math.max(
    1,
    ...subEntries.map((key) => current.subIndices?.[key] ?? 0),
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-baseline gap-2">
        <span className="text-3xl font-light tabular-nums">
          {current.aqi ?? EM_DASH}
        </span>
        {band ? (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: aqiBandColor(band) }}
          >
            {aqiBandLabel(band)}
          </span>
        ) : null}
      </p>

      {dominant ? (
        <p className="ink-muted text-sm">
          Polluant dominant : {AQI_POLLUTANT_LABELS[dominant]}
        </p>
      ) : null}

      <MetricChart
        series={series}
        nowEpoch={atEpoch}
        timezone={timezone}
        label="Indice de qualité de l'air"
        unit="AQI (EPA)"
        formatValue={(v) => (v === null ? EM_DASH : String(Math.round(v)))}
        baselineZero
      />

      {subEntries.length > 0 ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Sous-indices EPA</h3>
          <ul className="flex flex-col gap-1.5">
            {subEntries.map((key) => {
              const v = current.subIndices?.[key] ?? 0;
              return (
                <li key={key} className="flex items-center gap-2 text-sm">
                  <span className="ink-muted w-40 shrink-0">
                    {AQI_POLLUTANT_LABELS[key]}
                  </span>
                  <span className="hairline-border h-2 flex-1 overflow-hidden rounded-full border">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${String((v / subMax) * 100)}%`,
                        backgroundColor: aqiBandColor(aqiBand(v)),
                      }}
                    />
                  </span>
                  <span className="w-7 shrink-0 text-right font-semibold tabular-nums">
                    {v}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {advice ? <p className="ink-muted text-sm">{advice}</p> : null}

      <ValuesTable
        rows={series.map((p) => ({
          epoch: p.epoch,
          time: formatClock(p.epoch, timezone),
          value: p.value === null ? EM_DASH : String(Math.round(p.value)),
        }))}
      />
    </div>
  );
}

// ── Table de valeurs (repli accessible, charte dataviz) ───────────────────

function ValuesTable({
  rows,
}: {
  rows: { epoch: number; time: string; value: string }[];
}) {
  if (rows.length === 0) return null;
  return (
    <details className="text-sm">
      <summary className="ink-muted cursor-pointer">Voir les valeurs</summary>
      <table className="mt-2 w-full text-left tabular-nums">
        <thead className="ink-muted">
          <tr>
            <th scope="col" className="font-normal">
              Heure
            </th>
            <th scope="col" className="font-normal">
              Valeur
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.epoch}>
              <td>{r.time}</td>
              <td>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
