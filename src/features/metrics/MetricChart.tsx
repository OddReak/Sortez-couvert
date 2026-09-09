import { useId, useMemo, useRef, useState } from 'react';

import { formatClock } from '@/shared/lib/time';

import {
  buildChartGeometry,
  nearestIndex,
  type ChartGeometry,
} from './chartPath';

const VIEW_W = 320;
const VIEW_H = 132;
const PAD = { top: 10, right: 10, bottom: 22, left: 10 };

export type MetricChartPoint = { epoch: number; value: number | null };

/**
 * Graphe 24 h d'une métrique (brief §9.6). SVG inline, aucune lib (§12).
 * Repère de survol au doigt / à la souris ; résumé `aria-label` + `<title>`.
 */
export function MetricChart({
  series,
  nowEpoch,
  timezone,
  label,
  unit,
  formatValue,
  baselineZero = false,
}: {
  series: readonly MetricChartPoint[];
  nowEpoch: number;
  timezone: string;
  label: string;
  unit: string;
  formatValue: (value: number | null) => string;
  baselineZero?: boolean;
}) {
  const titleId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const geometry = useMemo<ChartGeometry | null>(
    () =>
      buildChartGeometry({
        points: series.map((p) => p.value),
        width: VIEW_W,
        height: VIEW_H,
        padding: PAD,
        baselineZero,
      }),
    [series, baselineZero],
  );

  if (!geometry) {
    return (
      <p className="ink-muted py-8 text-center text-sm">
        Données horaires indisponibles.
      </p>
    );
  }

  const { min, max } = geometry.bounds;
  const firstValue = series[0]?.value ?? null;
  const lastValue = series[series.length - 1]?.value ?? null;
  const trend =
    firstValue !== null && lastValue !== null ? lastValue - firstValue : null;
  const trendWord =
    trend === null
      ? ''
      : trend > 0.5
        ? ' en hausse'
        : trend < -0.5
          ? ' en baisse'
          : ' stable';
  const summary = `${label} sur 24 heures : de ${formatValue(min)} à ${formatValue(max)}${trendWord}.`;

  const nowIndex = nearestEpochIndex(series, nowEpoch);
  const nowX = nowIndex === null ? null : geometry.xAt(nowIndex);

  const ticks = axisTicks(series, geometry);

  const active = hover ?? nowIndex;
  const activeSample =
    active === null
      ? null
      : (geometry.samples.find((s) => s.index === active) ?? null);

  const onMove = (event: React.PointerEvent<SVGSVGElement>): void => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const localX = ((event.clientX - rect.left) / rect.width) * VIEW_W;
    setHover(nearestIndex(geometry, localX));
  };

  return (
    <figure className="m-0">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${String(VIEW_W)} ${String(VIEW_H)}`}
        className="h-auto w-full touch-none"
        role="img"
        aria-labelledby={titleId}
        onPointerMove={onMove}
        onPointerLeave={() => {
          setHover(null);
        }}
      >
        <title id={titleId}>{summary}</title>

        <line
          x1={PAD.left}
          x2={VIEW_W - PAD.right}
          y1={geometry.baselineY}
          y2={geometry.baselineY}
          stroke="var(--app-hairline)"
          strokeWidth={1}
        />

        {nowX !== null ? (
          <line
            x1={nowX}
            x2={nowX}
            y1={PAD.top}
            y2={geometry.baselineY}
            stroke="var(--app-ink-faint)"
            strokeWidth={1}
            strokeDasharray="2 3"
          />
        ) : null}

        <path d={geometry.area} fill="var(--app-live)" fillOpacity={0.14} />
        <path
          d={geometry.line}
          fill="none"
          stroke="var(--app-live)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        <ExtremeMarker
          sample={geometry.samples.find(
            (s) => s.index === geometry.extremes.maxIndex,
          )}
          text={formatValue(max)}
          place="above"
        />
        <ExtremeMarker
          sample={geometry.samples.find(
            (s) => s.index === geometry.extremes.minIndex,
          )}
          text={formatValue(min)}
          place="below"
        />

        {activeSample ? (
          <g>
            <line
              x1={activeSample.x}
              x2={activeSample.x}
              y1={PAD.top}
              y2={geometry.baselineY}
              stroke="var(--app-ink)"
              strokeOpacity={0.25}
              strokeWidth={1}
            />
            <circle
              cx={activeSample.x}
              cy={activeSample.y}
              r={3.5}
              fill="var(--app-live)"
              stroke="var(--app-surface)"
              strokeWidth={2}
            />
          </g>
        ) : null}

        {ticks.map((t) => (
          <text
            key={t.index}
            x={t.x}
            y={VIEW_H - 6}
            textAnchor={t.anchor}
            className="tabular-nums"
            fill="var(--app-ink-muted)"
            fontSize={10}
          >
            {formatClock(series[t.index]!.epoch, timezone)}
          </text>
        ))}
      </svg>

      <figcaption className="ink-muted mt-1 flex items-baseline justify-between text-xs tabular-nums">
        <span>
          {hover !== null && activeSample
            ? `${formatClock(series[activeSample.index]!.epoch, timezone)} · ${formatValue(activeSample.value)}`
            : `Unité : ${unit}`}
        </span>
        <span>
          min {formatValue(min)} · max {formatValue(max)}
        </span>
      </figcaption>
    </figure>
  );
}

function ExtremeMarker({
  sample,
  text,
  place,
}: {
  sample: { x: number; y: number } | undefined;
  text: string;
  place: 'above' | 'below';
}) {
  if (!sample) return null;
  const dy = place === 'above' ? -7 : 13;
  // Garde l'étiquette dans le cadre quand l'extrême tombe sur un bord.
  const near = 40;
  const anchor: 'start' | 'middle' | 'end' =
    sample.x < near ? 'start' : sample.x > VIEW_W - near ? 'end' : 'middle';
  const labelX =
    anchor === 'start'
      ? PAD.left
      : anchor === 'end'
        ? VIEW_W - PAD.right
        : sample.x;
  return (
    <g>
      <circle cx={sample.x} cy={sample.y} r={2.5} fill="var(--app-ink-muted)" />
      <text
        x={labelX}
        y={sample.y + dy}
        textAnchor={anchor}
        className="tabular-nums"
        fill="var(--app-ink-muted)"
        fontSize={10}
        fontWeight={600}
      >
        {text}
      </text>
    </g>
  );
}

function nearestEpochIndex(
  series: readonly MetricChartPoint[],
  epoch: number,
): number | null {
  if (series.length === 0) return null;
  let best = 0;
  let bestDist = Infinity;
  series.forEach((p, i) => {
    const d = Math.abs(p.epoch - epoch);
    if (d < bestDist) {
      best = i;
      bestDist = d;
    }
  });
  return best;
}

function axisTicks(
  series: readonly MetricChartPoint[],
  geometry: ChartGeometry,
): { index: number; x: number; anchor: 'start' | 'middle' | 'end' }[] {
  if (series.length < 2) return [];
  const last = series.length - 1;
  const wanted = [0, Math.round(last / 3), Math.round((2 * last) / 3), last];
  return [...new Set(wanted)].map((index) => ({
    index,
    x: geometry.xAt(index),
    anchor: index === 0 ? 'start' : index === last ? 'end' : 'middle',
  }));
}
