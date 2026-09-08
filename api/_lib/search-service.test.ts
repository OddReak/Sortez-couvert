import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '../../src/mocks/node';
import { __resetKvStore } from './kv';
import { searchPlaces } from './search-service';

beforeEach(() => {
  __resetKvStore();
  vi.stubEnv('FORECA_API_KEY', 'test-key');
});

afterEach(() => {
  __resetKvStore();
  vi.unstubAllEnvs();
});

describe('searchPlaces', () => {
  it('normalise les résultats Foreca en Place[]', async () => {
    const results = await searchPlaces({ q: 'Paris', lang: 'fr' });
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      id: '48.8534,2.3488',
      name: 'Paris',
      country: 'France',
      adminArea: 'Région Île-de-France',
      lat: 48.8534,
      lon: 2.3488,
      timezone: 'Europe/Paris',
    });
    expect(results[1]?.country).toBe('États-Unis');
  });

  it('met le résultat en cache (une seule requête pour deux recherches identiques)', async () => {
    let calls = 0;
    server.use(
      http.get(
        'https://weatherapi.foreca.net/api/v1/location/search/:query',
        () => {
          calls += 1;
          return HttpResponse.json({ locations: [] });
        },
      ),
    );
    await searchPlaces({ q: 'Lyon', lang: 'fr' });
    await searchPlaces({ q: 'lyon', lang: 'fr' });
    expect(calls).toBe(1);
  });
});
