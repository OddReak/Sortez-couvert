import { describe, expect, it } from 'vitest';

import {
  celsiusToFahrenheit,
  convertWindFromKmh,
  fahrenheitToCelsius,
  formatPercent,
  formatPressure,
  formatTemp,
  formatTempUnit,
  formatVisibility,
  formatWind,
  kmhToMph,
  kmhToMs,
  mphToKmh,
  msToKmh,
  roundHalfUp,
  uvIndexLevel,
} from './units';

describe('conversions de température', () => {
  it('C ↔ F', () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);
    expect(fahrenheitToCelsius(32)).toBe(0);
  });

  it('aller-retour stable', () => {
    for (const c of [-40, -12.3, 0, 21.7, 37]) {
      expect(fahrenheitToCelsius(celsiusToFahrenheit(c))).toBeCloseTo(c, 10);
    }
  });
});

describe('conversions de vent', () => {
  it('km/h ↔ m/s ↔ mph', () => {
    expect(kmhToMs(36)).toBeCloseTo(10, 10);
    expect(msToKmh(10)).toBeCloseTo(36, 10);
    expect(kmhToMph(1.609344)).toBeCloseTo(1, 10);
    expect(mphToKmh(1)).toBeCloseTo(1.609344, 10);
  });

  it('aller-retour stable', () => {
    for (const kmh of [0, 3.6, 14, 100.5]) {
      expect(msToKmh(kmhToMs(kmh))).toBeCloseTo(kmh, 10);
      expect(mphToKmh(kmhToMph(kmh))).toBeCloseTo(kmh, 10);
    }
  });

  it('convertWindFromKmh couvre les 3 unités', () => {
    expect(convertWindFromKmh(36, 'KMH')).toBe(36);
    expect(convertWindFromKmh(36, 'MS')).toBeCloseTo(10, 10);
    expect(convertWindFromKmh(1.609344, 'MPH')).toBeCloseTo(1, 10);
  });
});

describe('roundHalfUp', () => {
  it('arrondit symétriquement', () => {
    expect(roundHalfUp(21.5)).toBe(22);
    expect(roundHalfUp(-21.5)).toBe(-22);
    expect(roundHalfUp(21.4)).toBe(21);
    expect(roundHalfUp(-0.4)).toBe(-0);
  });
});

describe('formatage — valeurs nulles → « — »', () => {
  it('formatTemp', () => {
    expect(formatTemp(21.6)).toBe('22°');
    expect(formatTemp(null)).toBe('—°');
    expect(formatTemp(Number.NaN)).toBe('—°');
  });

  it('formatWind', () => {
    expect(formatWind(14.2, 'KMH')).toBe('14 km/h');
    expect(formatWind(9.87, 'MS')).toBe('9.9 m/s');
    expect(formatWind(null, 'KMH')).toBe('—');
  });

  it('formatPercent', () => {
    expect(formatPercent(68)).toBe('68 %');
    expect(formatPercent(null)).toBe('—');
  });

  it('formatTempUnit / formatPressure / formatVisibility', () => {
    expect(formatTempUnit(21.4, 'C')).toBe('21 °C');
    expect(formatTempUnit(null, 'F')).toBe('—°');
    expect(formatPressure(1013.6)).toBe('1014 hPa');
    expect(formatPressure(null)).toBe('—');
    expect(formatVisibility(12000)).toBe('10+ km');
    expect(formatVisibility(4200)).toBe('4.2 km');
    expect(formatVisibility(null)).toBe('—');
  });
});

describe('uvIndexLevel', () => {
  it('classe l’indice UV selon l’échelle standard', () => {
    expect(uvIndexLevel(2)).toBe('low');
    expect(uvIndexLevel(4)).toBe('moderate');
    expect(uvIndexLevel(7)).toBe('high');
    expect(uvIndexLevel(9)).toBe('very-high');
    expect(uvIndexLevel(12)).toBe('extreme');
    expect(uvIndexLevel(null)).toBeNull();
  });
});
