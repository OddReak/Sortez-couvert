import { describe, expect, it } from 'vitest';

import {
  RANGE_FUTURE_SECONDS,
  RANGE_PAST_SECONDS,
  SECONDS_PER_TURN,
  angleToSeconds,
  clampEpoch,
  graduations,
  ringPoint,
  secondsToAngle,
} from './geometry';

const NOW = 1_788_868_800;

describe('angle ↔ temps', () => {
  it('un tour complet = 12 h', () => {
    expect(angleToSeconds(Math.PI * 2)).toBe(SECONDS_PER_TURN);
    expect(SECONDS_PER_TURN).toBe(12 * 3600);
  });

  it('aller-retour angle → secondes → angle', () => {
    for (const s of [0, 3600, -7200, 21_600]) {
      expect(angleToSeconds(secondsToAngle(s))).toBeCloseTo(s, 6);
    }
  });

  it('+1 h = +30° (un quart de tour = 3 h)', () => {
    expect(secondsToAngle(3600)).toBeCloseTo(Math.PI / 6, 6);
    expect(secondsToAngle(3 * 3600)).toBeCloseTo(Math.PI / 2, 6);
  });
});

describe('clampEpoch', () => {
  it('borne à −24 h / +72 h autour de maintenant', () => {
    expect(clampEpoch(NOW - 40 * 3600, NOW)).toBe(NOW - RANGE_PAST_SECONDS);
    expect(clampEpoch(NOW + 100 * 3600, NOW)).toBe(NOW + RANGE_FUTURE_SECONDS);
    expect(clampEpoch(NOW + 3600, NOW)).toBe(NOW + 3600);
  });
});

describe('graduations', () => {
  it('produit des graduations horaires autour du curseur', () => {
    const g = graduations(NOW, NOW, 5);
    expect(g.length).toBe(11); // −5 h … +5 h
    expect(g.every((x) => x.epoch % 3600 === 0)).toBe(true);
  });

  it('marque les majeures toutes les 3 h', () => {
    const g = graduations(NOW, NOW, 6);
    const majors = g.filter((x) => x.major);
    expect(majors.every((x) => (x.epoch / 3600) % 3 === 0)).toBe(true);
  });

  it('ne dépasse pas la plage autorisée', () => {
    const g = graduations(NOW + RANGE_FUTURE_SECONDS, NOW, 7);
    expect(g.every((x) => x.epoch <= NOW + RANGE_FUTURE_SECONDS)).toBe(true);
  });

  it('la graduation du curseur est à l’angle 0 (en haut)', () => {
    const g = graduations(NOW, NOW, 3);
    const atCursor = g.find((x) => x.epoch === NOW);
    expect(atCursor?.angle).toBeCloseTo(0, 6);
  });
});

describe('ringPoint', () => {
  it('angle 0 → haut, angle π/2 → droite', () => {
    expect(ringPoint(0, 100)).toEqual({ x: 0, y: -100 });
    const right = ringPoint(Math.PI / 2, 100);
    expect(right.x).toBeCloseTo(100, 6);
    expect(right.y).toBeCloseTo(0, 6);
  });
});
