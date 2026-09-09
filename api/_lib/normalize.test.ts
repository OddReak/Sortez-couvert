import { describe, expect, it } from 'vitest';

import currentFixture from '../../src/mocks/fixtures/current.json';
import dailyFixture from '../../src/mocks/fixtures/forecast-daily.json';
import hourlyFixture from '../../src/mocks/fixtures/forecast-hourly.json';
import searchFixture from '../../src/mocks/fixtures/location-search.json';
import {
  normalizeAirQuality,
  normalizeCurrent,
  normalizeDaily,
  normalizeHourly,
  normalizePlace,
} from './normalize';
import {
  forecaCurrentResponseSchema,
  forecaDailyResponseSchema,
  forecaHourlyResponseSchema,
  forecaSearchResponseSchema,
} from './schemas';

describe('normalizePlace', () => {
  it('produit un Place avec id canonique et adminArea', () => {
    const raw = forecaSearchResponseSchema.parse(searchFixture).locations[0]!;
    expect(normalizePlace(raw)).toEqual({
      id: '48.8534,2.3488',
      name: 'Paris',
      country: 'France',
      adminArea: 'Région Île-de-France',
      lat: 48.8534,
      lon: 2.3488,
      timezone: 'Europe/Paris',
    });
  });

  it('se rabat sur `state` quand adminArea est absent, et force le fuseau donné', () => {
    const raw = forecaSearchResponseSchema.parse(searchFixture).locations[1]!;
    const place = normalizePlace(
      { ...raw, adminArea: null },
      'America/Chicago',
    );
    expect(place.adminArea).toBe('TX');
    expect(place.timezone).toBe('America/Chicago');
  });
});

describe('normalizeCurrent / normalizeHourly', () => {
  it('mappe les conditions actuelles vers le modèle de domaine', () => {
    const raw = forecaCurrentResponseSchema.parse(currentFixture).current;
    const step = normalizeCurrent(raw);
    expect(step).toMatchObject({
      symbol: 'd200',
      phrase: 'en partie nuageux',
      temp: 22.8,
      feelsLike: 22.8,
      windDirLabel: 'W',
      precipAccum: null,
      precipType: null,
    });
    expect(step.epoch).toBe(Math.round(Date.parse(raw.time) / 1000));
  });

  it('mappe une étape horaire et convertit le type de précipitation', () => {
    const steps = forecaHourlyResponseSchema.parse(hourlyFixture).forecast;
    expect(normalizeHourly(steps[0]!).precipType).toBe('rain');
    expect(normalizeHourly(steps[4]!).precipType).toBeNull();
  });

  it('normalise tous les types de précipitation Foreca', () => {
    const base = forecaHourlyResponseSchema.parse(hourlyFixture).forecast[0]!;
    expect(normalizeHourly({ ...base, precipType: 'snow' }).precipType).toBe(
      'snow',
    );
    expect(normalizeHourly({ ...base, precipType: 'sleet' }).precipType).toBe(
      'mixed',
    );
    expect(
      normalizeHourly({ ...base, precipType: 'FREEZING' }).precipType,
    ).toBe('mixed');
    expect(
      normalizeHourly({ ...base, precipType: 'grésil' }).precipType,
    ).toBeNull();
  });

  it('préserve les valeurs nulles (pas de NaN / 0)', () => {
    const nightStep =
      forecaHourlyResponseSchema.parse(hourlyFixture).forecast[5]!;
    expect(normalizeHourly(nightStep).uvIndex).toBeNull();
  });
});

describe('normalizeDaily', () => {
  const days = forecaDailyResponseSchema.parse(dailyFixture).forecast;

  it('mappe une journée et normalise la confiance', () => {
    const day = normalizeDaily(days[0]!);
    expect(day).toMatchObject({
      date: '2026-09-08',
      minTemp: 15.45,
      maxTemp: 26.11,
      confidence: 'y',
      sunrise: '07:16:33',
      sunriseEpoch: 1788844593,
    });
  });

  it('convertit la phase lunaire de degrés (0–360) en fraction (0–1)', () => {
    expect(normalizeDaily(days[0]!).moonPhase).toBeCloseTo(325 / 360, 5);
    expect(
      normalizeDaily({ ...days[0]!, moonPhase: null }).moonPhase,
    ).toBeNull();
  });

  it('renvoie un epoch NaN pour une date illisible (jamais 0)', () => {
    const step = normalizeCurrent({
      ...forecaCurrentResponseSchema.parse(currentFixture).current,
      time: 'pas-une-date',
    });
    expect(Number.isNaN(step.epoch)).toBe(true);
  });

  it('renvoie une confiance nulle pour une lettre inconnue', () => {
    expect(
      normalizeDaily({ ...days[0]!, confidence: 'z' }).confidence,
    ).toBeNull();
  });
});

describe('normalizeAirQuality', () => {
  it('mappe AQI + polluant dominant, sous-indices nuls si absents', () => {
    expect(
      normalizeAirQuality({
        time: '2026-09-08T11:00+02:00',
        pollutant: 'O3',
        pollutantPhrase: 'Ozone',
        AQI: 21,
      }),
    ).toEqual({
      time: '2026-09-08T11:00+02:00',
      aqi: 21,
      pollutant: 'Ozone',
      subIndices: null,
    });
  });

  it('mappe les sous-indices EPA présents et ignore les absents', () => {
    expect(
      normalizeAirQuality({
        time: '2026-09-08T11:00+02:00',
        pollutant: 'O3',
        pollutantPhrase: 'Ozone',
        AQI: 26,
        AQI_CO: 1,
        AQI_O3: 24,
        AQI_PM2P5: 26,
        AQI_SO2: null,
      }).subIndices,
    ).toEqual({ co: 1, o3: 24, pm25: 26 });
  });
});
