import { describe, expect, it } from 'vitest';

import { buildChartGeometry, nearestIndex, usableCount } from './chartPath';

const SIZE = { width: 100, height: 100 } as const;

describe('usableCount', () => {
  it('compte les valeurs finies', () => {
    expect(usableCount([1, null, 3, Number.NaN, 5])).toBe(3);
  });
});

describe('buildChartGeometry', () => {
  it('renvoie null avec moins de 2 points exploitables', () => {
    expect(buildChartGeometry({ points: [null, 4, null], ...SIZE })).toBeNull();
    expect(buildChartGeometry({ points: [], ...SIZE })).toBeNull();
  });

  it('mappe le premier et le dernier point sur les bords internes', () => {
    const g = buildChartGeometry({
      points: [0, 10],
      width: 100,
      height: 100,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
    })!;
    expect(g.samples[0]!.x).toBe(0);
    expect(g.samples[1]!.x).toBe(100);
    // point haut (10) plus près du sommet que point bas (0)
    expect(g.samples[1]!.y).toBeLessThan(g.samples[0]!.y);
    expect(g.line.startsWith('M0.00')).toBe(true);
  });

  it('expose les bornes et les index des extrêmes', () => {
    const g = buildChartGeometry({ points: [5, 2, 9, 4], ...SIZE })!;
    expect(g.bounds).toEqual({ min: 2, max: 9 });
    expect(g.extremes).toEqual({ minIndex: 1, maxIndex: 2 });
  });

  it('coupe la ligne autour des trous (sous-chemins multiples)', () => {
    const g = buildChartGeometry({ points: [1, 2, null, 4, 5], ...SIZE })!;
    const moveCommands = g.line.match(/M/g) ?? [];
    expect(moveCommands).toHaveLength(2);
  });

  it('baselineZero descend la baseline jusqu’à 0', () => {
    const g = buildChartGeometry({
      points: [4, 8, 6],
      width: 100,
      height: 100,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      baselineZero: true,
    })!;
    expect(g.baselineY).toBeCloseTo(100); // 0 en bas
  });
});

describe('nearestIndex', () => {
  it('trouve l’échantillon le plus proche en X', () => {
    const g = buildChartGeometry({
      points: [0, 1, 2, 3, 4],
      width: 100,
      height: 100,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
    })!;
    expect(nearestIndex(g, 0)).toBe(0);
    expect(nearestIndex(g, 51)).toBe(2);
    expect(nearestIndex(g, 100)).toBe(4);
  });
});
