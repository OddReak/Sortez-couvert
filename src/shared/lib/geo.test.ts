import { describe, expect, it } from 'vitest';

import { normalizePlaceId, roundTo, toForecaLocation } from './geo';

describe('roundTo', () => {
  it('arrondit au nombre de décimales demandé', () => {
    expect(roundTo(48.85661234, 4)).toBe(48.8566);
    expect(roundTo(2.35219, 4)).toBe(2.3522);
    expect(roundTo(-0.00004, 4)).toBe(-0);
  });

  it('gère 0 décimale', () => {
    expect(roundTo(21.6, 0)).toBe(22);
  });
});

describe('toForecaLocation', () => {
  it('produit "longitude,latitude" (ordre inversé Foreca)', () => {
    expect(toForecaLocation(48.8566, 2.3522)).toBe('2.3522,48.8566');
  });

  it('gère les coordonnées négatives (hémisphère sud / ouest)', () => {
    expect(toForecaLocation(-33.8688, 151.2093)).toBe('151.2093,-33.8688');
    expect(toForecaLocation(40.7128, -74.006)).toBe('-74.006,40.7128');
  });

  it('accepte les bornes exactes', () => {
    expect(toForecaLocation(-90, -180)).toBe('-180,-90');
    expect(toForecaLocation(90, 180)).toBe('180,90');
  });

  it('rejette une latitude hors bornes', () => {
    expect(() => toForecaLocation(91, 0)).toThrow(RangeError);
    expect(() => toForecaLocation(-90.1, 0)).toThrow(RangeError);
  });

  it('rejette une longitude hors bornes', () => {
    expect(() => toForecaLocation(0, 181)).toThrow(RangeError);
    expect(() => toForecaLocation(0, -180.5)).toThrow(RangeError);
  });

  it('rejette les valeurs non finies', () => {
    expect(() => toForecaLocation(Number.NaN, 0)).toThrow(RangeError);
    expect(() => toForecaLocation(0, Number.POSITIVE_INFINITY)).toThrow(
      RangeError,
    );
  });
});

describe('normalizePlaceId', () => {
  it('normalise à 4 décimales sous la forme "lat,lon"', () => {
    expect(normalizePlaceId(48.856614, 2.352222)).toBe('48.8566,2.3522');
  });

  it('est stable pour deux points très proches', () => {
    expect(normalizePlaceId(48.85661, 2.35221)).toBe(
      normalizePlaceId(48.856612, 2.352214),
    );
  });

  it('rejette les coordonnées invalides', () => {
    expect(() => normalizePlaceId(200, 0)).toThrow(RangeError);
  });
});
