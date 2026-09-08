import { describe, expect, it } from 'vitest';

import { approach, decayVelocity, snapTarget } from './physics';

const NOW = 1_788_868_800;

describe('decayVelocity', () => {
  it('décroît par friction et s’annule sous le seuil', () => {
    let v = 4000;
    let steps = 0;
    while (v !== 0 && steps < 500) {
      v = decayVelocity(v);
      steps += 1;
    }
    expect(v).toBe(0);
    expect(steps).toBeLessThan(200);
  });

  it('conserve le signe', () => {
    expect(decayVelocity(-3000)).toBeLessThan(0);
  });
});

describe('snapTarget', () => {
  it('aimante sur l’heure pleine la plus proche', () => {
    expect(snapTarget(NOW + 3 * 3600 + 800, NOW)).toBe(NOW + 3 * 3600);
    expect(snapTarget(NOW + 3 * 3600 + 2000, NOW)).toBe(NOW + 4 * 3600);
  });

  it('aimantation RENFORCÉE : < 30 min de maintenant → maintenant', () => {
    expect(snapTarget(NOW + 20 * 60, NOW)).toBe(NOW);
    expect(snapTarget(NOW - 29 * 60, NOW)).toBe(NOW);
  });

  it('au-delà de 30 min, retour à l’aimantation horaire normale', () => {
    expect(snapTarget(NOW + 40 * 60, NOW)).toBe(NOW + 3600);
  });
});

describe('approach', () => {
  it('converge vers la cible et s’y fixe', () => {
    let v = 0;
    for (let i = 0; i < 100 && v !== 1000; i += 1) v = approach(v, 1000, 0.2);
    expect(v).toBe(1000);
  });
});
