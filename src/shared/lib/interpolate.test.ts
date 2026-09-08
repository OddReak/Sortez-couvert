import { describe, expect, it } from 'vitest';

import { bracket, interpolateValue, lerp, nearestStep } from './interpolate';

type Step = {
  epoch: number;
  temp: number | null;
  symbol: string;
};

const steps: Step[] = [
  { epoch: 100, temp: 10, symbol: 'a' },
  { epoch: 200, temp: 20, symbol: 'b' },
  { epoch: 300, temp: null, symbol: 'c' },
];

describe('lerp', () => {
  it('interpole linéairement', () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 0.5)).toBe(15);
    expect(lerp(10, 20, 1)).toBe(20);
  });
});

describe('bracket', () => {
  it('encadre une cible interne', () => {
    const b = bracket(steps, 150);
    expect(b).toMatchObject({ before: { epoch: 100 }, after: { epoch: 200 } });
    expect((b as { t: number }).t).toBeCloseTo(0.5);
  });

  it('borne aux extrémités (clamp)', () => {
    expect(bracket(steps, 50)).toMatchObject({
      before: { epoch: 100 },
      after: null,
    });
    expect(bracket(steps, 999)).toMatchObject({
      before: { epoch: 300 },
      after: null,
    });
  });

  it('renvoie null pour une liste vide', () => {
    expect(bracket([], 100)).toBeNull();
  });
});

describe('interpolateValue', () => {
  it('interpole la température entre deux pas', () => {
    expect(interpolateValue(steps, 150, (s) => s.temp)).toBe(15);
    expect(interpolateValue(steps, 175, (s) => s.temp)).toBeCloseTo(17.5);
  });

  it('renvoie null si une borne est null', () => {
    expect(interpolateValue(steps, 250, (s) => s.temp)).toBeNull();
  });

  it('clampe hors plage sans extrapoler', () => {
    expect(interpolateValue(steps, 0, (s) => s.temp)).toBe(10);
    expect(interpolateValue(steps, 10_000, (s) => s.temp)).toBeNull(); // dernier = null
  });
});

describe('nearestStep — plus proche voisin', () => {
  it('choisit le pas le plus proche, jamais une valeur intermédiaire', () => {
    expect(nearestStep(steps, 140)?.symbol).toBe('a');
    expect(nearestStep(steps, 160)?.symbol).toBe('b');
    expect(nearestStep(steps, 260)?.symbol).toBe('c');
  });

  it('renvoie null pour une liste vide', () => {
    expect(nearestStep([], 100)).toBeNull();
  });
});
