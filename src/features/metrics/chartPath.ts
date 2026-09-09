/**
 * Géométrie SVG pure du graphe 24 h (brief §9.6).
 *
 * Entrée : des échantillons régulièrement espacés (pas horaire), du plus ancien
 * au plus récent, `null` pour une valeur absente. Sortie : chemins `d` prêts à
 * poser dans un `<svg viewBox="0 0 width height">`, plus les coordonnées écran
 * des points (pour le repère de survol) et les bornes.
 *
 * Aucune dépendance — le budget bundle interdit une lib de graphes (§12).
 */

export type ChartPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type ChartInput = {
  points: readonly (number | null)[];
  width: number;
  height: number;
  padding?: Partial<ChartPadding>;
  /** Force le bas de l'axe Y à 0 (utile pour pluie / UV / vent). */
  baselineZero?: boolean;
};

export type ChartSample = {
  index: number;
  x: number;
  y: number;
  value: number;
};

export type ChartGeometry = {
  /** `d` de la ligne (sous-chemins séparés autour des trous). */
  line: string;
  /** `d` de l'aire remplie sous la ligne. */
  area: string;
  /** Points non nuls en coordonnées écran. */
  samples: ChartSample[];
  /** Valeur mini / maxi de la série (pour l'axe et les repères). */
  bounds: { min: number; max: number };
  /** Index du premier mini et du premier maxi rencontrés. */
  extremes: { minIndex: number; maxIndex: number };
  /** X écran d'un index d'échantillon. */
  xAt: (index: number) => number;
  /** Y écran de la baseline de l'aire. */
  baselineY: number;
  /** Nombre d'échantillons attendus. */
  count: number;
};

const DEFAULT_PADDING: ChartPadding = { top: 8, right: 8, bottom: 8, left: 8 };

function resolvePadding(p?: Partial<ChartPadding>): ChartPadding {
  return { ...DEFAULT_PADDING, ...p };
}

/** Nombre de valeurs exploitables. */
export function usableCount(points: readonly (number | null)[]): number {
  return points.reduce<number>(
    (n, v) => (typeof v === 'number' && Number.isFinite(v) ? n + 1 : n),
    0,
  );
}

export function buildChartGeometry(input: ChartInput): ChartGeometry | null {
  const { points, width, height, baselineZero = false } = input;
  const pad = resolvePadding(input.padding);
  const count = points.length;

  if (usableCount(points) < 2) return null;

  const numeric = points.filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v),
  );
  const dataMin = Math.min(...numeric);
  const dataMax = Math.max(...numeric);

  // Marge verticale de 6 % pour ne pas coller la courbe aux bords.
  const span = dataMax - dataMin || 1;
  const domainMin = baselineZero ? Math.min(0, dataMin) : dataMin - span * 0.06;
  const domainMax = dataMax + span * 0.06;
  const domainSpan = domainMax - domainMin || 1;

  const innerW = Math.max(1, width - pad.left - pad.right);
  const innerH = Math.max(1, height - pad.top - pad.bottom);
  const step = count > 1 ? innerW / (count - 1) : 0;

  const xAt = (index: number): number => pad.left + index * step;
  const yAt = (value: number): number =>
    pad.top + innerH * (1 - (value - domainMin) / domainSpan);

  const baselineY = yAt(domainMin);

  const samples: ChartSample[] = [];
  points.forEach((value, index) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      samples.push({ index, x: xAt(index), y: yAt(value), value });
    }
  });

  // Ligne : un nouveau sous-chemin après chaque trou.
  let line = '';
  let penDown = false;
  points.forEach((value, index) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      const cmd = penDown ? 'L' : 'M';
      line += `${cmd}${xAt(index).toFixed(2)} ${yAt(value).toFixed(2)} `;
      penDown = true;
    } else {
      penDown = false;
    }
  });

  // Aire : suit la ligne segment par segment, refermée sur la baseline.
  let area = '';
  let runStart: number | null = null;
  const closeRun = (endIndex: number): void => {
    if (runStart === null) return;
    area += `L${xAt(endIndex).toFixed(2)} ${baselineY.toFixed(2)} `;
    area += `L${xAt(runStart).toFixed(2)} ${baselineY.toFixed(2)} Z `;
    runStart = null;
  };
  points.forEach((value, index) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      if (runStart === null) {
        runStart = index;
        area += `M${xAt(index).toFixed(2)} ${baselineY.toFixed(2)} `;
      }
      area += `L${xAt(index).toFixed(2)} ${yAt(value).toFixed(2)} `;
      if (index === count - 1) closeRun(index);
    } else {
      closeRun(index - 1);
    }
  });

  return {
    line: line.trimEnd(),
    area: area.trimEnd(),
    samples,
    bounds: { min: dataMin, max: dataMax },
    extremes: {
      minIndex: points.findIndex((v) => v === dataMin),
      maxIndex: points.findIndex((v) => v === dataMax),
    },
    xAt,
    baselineY,
    count,
  };
}

/** Index d'échantillon le plus proche d'une position X écran (repère de survol). */
export function nearestIndex(
  geometry: ChartGeometry,
  screenX: number,
): number | null {
  if (geometry.samples.length === 0) return null;
  let best = geometry.samples[0]!;
  let bestDist = Math.abs(best.x - screenX);
  for (const sample of geometry.samples) {
    const dist = Math.abs(sample.x - screenX);
    if (dist < bestDist) {
      best = sample;
      bestDist = dist;
    }
  }
  return best.index;
}
