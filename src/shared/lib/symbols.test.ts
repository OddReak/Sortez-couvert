import { describe, expect, it } from 'vitest';

import {
  WEATHER_ICON_NAMES,
  decodeSymbol,
  type WeatherIconName,
} from './symbols';

describe('decodeSymbol — cas observés', () => {
  it.each([
    ['d000', 'clear-day'],
    ['n000', 'clear-night'],
    ['d100', 'clear-day'],
    ['d200', 'partly-day'],
    ['n200', 'partly-night'],
    ['d300', 'cloudy'],
    ['d400', 'overcast'],
    ['d600', 'fog'],
    ['d210', 'drizzle'],
    ['d320', 'rain'],
    ['d330', 'heavy-rain'],
    ['d312', 'snow'],
    ['d311', 'sleet'],
    ['d440', 'thunder'],
  ])('%s → %s', (code, icon) => {
    expect(decodeSymbol(code).icon).toBe(icon);
  });

  it('déduit le jour / la nuit du préfixe', () => {
    expect(decodeSymbol('d000').isNight).toBe(false);
    expect(decodeSymbol('n000').isNight).toBe(true);
  });
});

describe('decodeSymbol — exhaustivité (brief §4.4)', () => {
  it('AUCUN code bien formé ne tombe dans le cas par défaut', () => {
    const misses: string[] = [];
    for (const prefix of ['d', 'n']) {
      for (let cover = 0; cover <= 6; cover += 1) {
        for (let intensity = 0; intensity <= 4; intensity += 1) {
          for (let type = 0; type <= 3; type += 1) {
            const code = `${prefix}${String(cover)}${String(intensity)}${String(type)}`;
            const decoded = decodeSymbol(code);
            if (decoded.fallback) misses.push(code);
            expect(WEATHER_ICON_NAMES).toContain<WeatherIconName>(decoded.icon);
          }
        }
      }
    }
    expect(misses).toEqual([]);
  });

  it('un code malformé utilise le repli sans planter', () => {
    expect(decodeSymbol('xyz').fallback).toBe(true);
    expect(decodeSymbol('').fallback).toBe(true);
    expect(decodeSymbol('n99').fallback).toBe(true);
  });
});
