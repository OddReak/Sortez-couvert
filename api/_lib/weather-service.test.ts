import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '../../src/mocks/node';
import { ForecaError } from './foreca';
import { __resetKvStore } from './kv';
import { getWeatherSnapshot } from './weather-service';

const FORECA = 'https://weatherapi.foreca.net/api/v1';
const query = {
  lat: 48.8566,
  lon: 2.3522,
  lang: 'fr',
  tempunit: 'C',
  windunit: 'KMH',
} as const;

beforeEach(() => {
  __resetKvStore();
  vi.stubEnv('FORECA_API_KEY', 'test-key');
});

afterEach(() => {
  __resetKvStore();
  vi.unstubAllEnvs();
});

describe('getWeatherSnapshot', () => {
  it('agrège les 5 endpoints en un WeatherSnapshot', async () => {
    const snapshot = await getWeatherSnapshot(query);

    expect(snapshot.place).toMatchObject({
      name: 'Paris',
      country: 'France',
      timezone: 'Europe/Paris',
      id: '48.8566,2.3522',
    });
    expect(snapshot.current.symbol).toBe('d200');
    expect(snapshot.hourly).toHaveLength(6);
    expect(snapshot.daily).toHaveLength(4);
    expect(snapshot.airQuality[0]).toMatchObject({ aqi: 21 });
    expect(snapshot.warnings).toEqual([]);
    expect(snapshot.attribution).toEqual({
      provider: 'Foreca',
      thirdParty: [],
    });
    expect(snapshot.fetchedAt).toBeGreaterThan(0);
  });

  it('utilise le fuseau de la ville pour paramétrer hourly et air-quality', async () => {
    const seen: string[] = [];
    server.use(
      http.get(`${FORECA}/forecast/hourly/:loc`, ({ request }) => {
        seen.push(new URL(request.url).searchParams.get('tz') ?? '');
        return HttpResponse.json({ forecast: [] });
      }),
    );
    await getWeatherSnapshot(query);
    expect(seen).toContain('Europe/Paris');
  });

  it('dégrade proprement si daily et air-quality échouent (état vide)', async () => {
    server.use(
      http.get(`${FORECA}/forecast/daily/:loc`, () =>
        HttpResponse.json({ error: 'boom' }, { status: 500 }),
      ),
      http.get(`${FORECA}/air-quality/forecast/hourly/:loc`, () =>
        HttpResponse.json({ error: 'boom' }, { status: 503 }),
      ),
    );

    const snapshot = await getWeatherSnapshot(query);
    expect(snapshot.daily).toEqual([]);
    expect(snapshot.airQuality).toEqual([]);
    expect(snapshot.current.symbol).toBe('d200'); // le reste fonctionne
  });

  it('échoue si `current` est indisponible', async () => {
    server.use(
      http.get(`${FORECA}/current/:loc`, () =>
        HttpResponse.json({ error: 'nope' }, { status: 500 }),
      ),
    );
    await expect(getWeatherSnapshot(query)).rejects.toBeInstanceOf(ForecaError);
  });

  it('propage un 401 Foreca (→ 503 générique côté route)', async () => {
    server.use(
      http.get(`${FORECA}/location/:loc`, () =>
        HttpResponse.json({ error: 'unauthorized' }, { status: 401 }),
      ),
    );
    await expect(getWeatherSnapshot(query)).rejects.toMatchObject({
      status: 401,
    });
  });

  it('sert le cache au second appel (0 requête Foreca à chaud)', async () => {
    let calls = 0;
    server.use(
      http.get(`${FORECA}/current/:loc`, () => {
        calls += 1;
        return HttpResponse.json({
          current: {
            time: '2026-09-08T11:00:00+02:00',
            symbol: 'd000',
            symbolPhrase: 'clair',
            temperature: 20,
            feelsLikeTemp: 20,
            relHumidity: 50,
            dewPoint: 10,
            windSpeed: 1,
            windDir: 0,
            windDirString: 'N',
            windGust: 2,
            precipProb: 0,
            precipRate: 0,
            cloudiness: 0,
            thunderProb: 0,
            uvIndex: 1,
            pressure: 1015,
            visibility: 10000,
          },
        });
      }),
    );

    await getWeatherSnapshot(query);
    await getWeatherSnapshot(query);
    expect(calls).toBe(1);
  });
});
