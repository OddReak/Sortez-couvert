import { describe, expect, it } from 'vitest';

import type { WeatherSnapshot } from '@/shared/types/domain';

import { selectConditions } from './useWeather';

const NOW = 1_788_868_800;

function makeSnapshot(
  overrides: Partial<WeatherSnapshot> = {},
): WeatherSnapshot {
  const baseStep = {
    time: '',
    symbol: 'd200',
    phrase: 'en partie nuageux',
    windDirLabel: 'O',
    precipType: null,
    humidity: 60,
    windSpeed: 10,
    windDir: 250,
    gust: 18,
    precipProb: 10,
    precipAccum: 0,
    cloudiness: 40,
    uvIndex: 3,
    pressure: 1015,
    visibility: 10000,
    feelsLike: 20,
  };
  return {
    place: {
      id: '48.8566,2.3522',
      name: 'Paris',
      country: 'France',
      adminArea: null,
      lat: 48.8566,
      lon: 2.3522,
      timezone: 'Europe/Paris',
    },
    fetchedAt: NOW * 1000,
    current: { ...baseStep, epoch: NOW, temp: 21 },
    hourly: [
      { ...baseStep, epoch: NOW - 3600, temp: 18 },
      { ...baseStep, epoch: NOW, temp: 21 },
      { ...baseStep, epoch: NOW + 3600, temp: 24, symbol: 'd310' },
    ],
    daily: [
      {
        date: '2026-09-08',
        sunrise: '07:16',
        sunset: '20:19',
        sunriseEpoch: NOW - 6 * 3600,
        sunsetEpoch: NOW + 6 * 3600,
        minTemp: 15,
        maxTemp: 26,
        symbol: 'd310',
        phrase: null,
        precipProb: 40,
        precipAccum: 0.3,
        uvIndex: 3,
        moonPhase: 0.5,
        confidence: 'g',
      },
    ],
    airQuality: [{ time: '', aqi: 22, pollutant: 'Ozone', subIndices: null }],
    warnings: [],
    attribution: { provider: 'Foreca', thirdParty: [] },
    ...overrides,
  };
}

describe('selectConditions', () => {
  it('sans sélection : « maintenant », mesures observées', () => {
    const c = selectConditions(makeSnapshot(), null, NOW);
    expect(c.isNow).toBe(true);
    expect(c.atEpoch).toBe(NOW);
    expect(c.step.temp).toBe(21);
    expect(c.theme.mode).toBe('day');
  });

  it('avec sélection : interpole les nombres, symbole au plus proche', () => {
    const c = selectConditions(makeSnapshot(), NOW + 2400, NOW);
    expect(c.isNow).toBe(false);
    expect(c.step.temp).toBeCloseTo(23); // entre 21 (NOW) et 24 (NOW+3600), t=2/3
    expect(c.step.symbol).toBe('d310'); // plus proche de NOW+3600
  });

  it('propage les null sans produire de NaN (brief §4.1)', () => {
    const snap = makeSnapshot();
    snap.hourly = snap.hourly.map((s) => ({ ...s, humidity: null }));
    const c = selectConditions(snap, NOW + 1800, NOW);
    expect(c.step.humidity).toBeNull();
  });

  it('bascule le thème en nuit après le coucher', () => {
    const c = selectConditions(makeSnapshot(), NOW + 7 * 3600, NOW);
    expect(c.theme.scheme).toBe('dark');
  });
});
