import { describe, expect, it } from 'vitest';

import {
  SECONDS_PER_TURN,
  angleToSeconds,
  clampEpoch,
  graduations,
  ringPoint,
  secondsToAngle,
} from './geometry';

const NOW = 1_788_868_800;
// Journée affichée : 00:00 → 23:59 autour de NOW.
const DAY_START = Math.floor(NOW / 86_400) * 86_400;
const DAY_END = DAY_START + 86_400 - 1;

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

  it('le futur est en anti-horaire (angle négatif)', () => {
    // graduation d'une heure future, vue depuis le centre du jour
    const [future] = graduations(DAY_START, DAY_START, DAY_END, 2).filter(
      (g) => g.epoch > DAY_START,
    );
    expect(future?.angle).toBeLessThan(0);
  });
});

describe('clampEpoch', () => {
  it('borne à la journée affichée [00:00, 23:59]', () => {
    expect(clampEpoch(DAY_START - 5 * 3600, DAY_START, DAY_END)).toBe(
      DAY_START,
    );
    expect(clampEpoch(DAY_END + 5 * 3600, DAY_START, DAY_END)).toBe(DAY_END);
    expect(clampEpoch(DAY_START + 3600, DAY_START, DAY_END)).toBe(
      DAY_START + 3600,
    );
  });
});

describe('graduations', () => {
  const MID = DAY_START + 12 * 3600;

  it('produit des graduations horaires autour du curseur', () => {
    const g = graduations(MID, DAY_START, DAY_END, 5);
    expect(g.length).toBe(11); // −5 h … +5 h
    expect(g.every((x) => x.epoch % 3600 === 0)).toBe(true);
  });

  it('marque les majeures toutes les 3 h', () => {
    const g = graduations(MID, DAY_START, DAY_END, 6);
    const majors = g.filter((x) => x.major);
    expect(majors.every((x) => (x.epoch / 3600) % 3 === 0)).toBe(true);
  });

  it('ne dépasse jamais la journée affichée', () => {
    const g = graduations(DAY_END, DAY_START, DAY_END, 7);
    expect(g.every((x) => x.epoch >= DAY_START && x.epoch <= DAY_END)).toBe(
      true,
    );
  });

  it('la graduation du curseur est à l’angle 0 (en haut)', () => {
    const g = graduations(MID, DAY_START, DAY_END, 3);
    const atCursor = g.find((x) => x.epoch === MID);
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
