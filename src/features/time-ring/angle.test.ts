import { describe, expect, it } from 'vitest';

import { AngleAccumulator, pointerAngle, shortestAngleDelta } from './angle';

describe('shortestAngleDelta', () => {
  it('reste petit lors du franchissement ±π (le bug classique de la bague)', () => {
    // On passe de +3,0 rad à −3,0 rad : le vrai déplacement est ~+0,28 rad,
    // pas −6,0 rad.
    expect(shortestAngleDelta(3.0, -3.0)).toBeCloseTo(0.283, 2);
    expect(shortestAngleDelta(-3.0, 3.0)).toBeCloseTo(-0.283, 2);
  });

  it('gère les petits pas normaux', () => {
    expect(shortestAngleDelta(0.1, 0.3)).toBeCloseTo(0.2, 6);
    expect(shortestAngleDelta(1, 0.5)).toBeCloseTo(-0.5, 6);
  });
});

describe('AngleAccumulator', () => {
  it('accumule un tour complet sans saut au passage du haut', () => {
    const acc = new AngleAccumulator();
    acc.reset();
    // Simule un tour horaire en 12 pas, en passant par ±π.
    let total = 0;
    for (let i = 0; i <= 24; i += 1) {
      const angle = -Math.PI + (i / 24) * (Math.PI * 2);
      total = acc.push(angle);
    }
    void total;
    expect(acc.total).toBeCloseTo(Math.PI * 2, 3);
  });

  it('le premier push ne produit aucun delta', () => {
    const acc = new AngleAccumulator();
    acc.reset();
    expect(acc.push(2.5)).toBe(0);
    expect(acc.total).toBe(0);
  });

  it('un aller-retour revient à zéro', () => {
    const acc = new AngleAccumulator();
    acc.reset(0);
    acc.push(1);
    acc.push(2);
    acc.push(1);
    acc.push(0);
    expect(acc.total).toBeCloseTo(0, 6);
  });
});

describe('pointerAngle', () => {
  it('0 à droite, π/2 en bas (repère écran)', () => {
    expect(pointerAngle(10, 0, 0, 0)).toBeCloseTo(0, 6);
    expect(pointerAngle(0, 10, 0, 0)).toBeCloseTo(Math.PI / 2, 6);
  });
});
