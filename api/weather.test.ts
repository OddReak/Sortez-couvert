import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { __resetKvStore } from './_lib/kv';
import { GET as searchGET } from './search';
import { GET as weatherGET } from './weather';

const url = (path: string): Request =>
  new Request(`https://terra.app${path}`, {
    headers: {
      'x-forwarded-for': `10.0.0.${String(Math.floor(Math.random() * 254) + 1)}`,
    },
  });

beforeEach(() => {
  __resetKvStore();
  vi.stubEnv('FORECA_API_KEY', 'test-key');
});

afterEach(() => {
  __resetKvStore();
  vi.unstubAllEnvs();
});

describe('GET /api/weather', () => {
  it('renvoie 200 + un WeatherSnapshot + Cache-Control', async () => {
    const res = await weatherGET(url('/api/weather?lat=48.8566&lon=2.3522'));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe(
      'public, s-maxage=600, stale-while-revalidate=1800',
    );
    const body = (await res.json()) as { place: { name: string } };
    expect(body.place.name).toBe('Paris');
  });

  it('renvoie 400 sur des coordonnées invalides', async () => {
    const res = await weatherGET(url('/api/weather?lat=999&lon=2'));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { issues: string[] };
    expect(body.issues.length).toBeGreaterThan(0);
  });

  it('renvoie 429 quand le quota IP est dépassé', async () => {
    const ip = '203.0.113.77';
    const req = (): Request =>
      new Request('https://terra.app/api/weather?lat=48.8&lon=2.3', {
        headers: { 'x-forwarded-for': ip },
      });
    let last = await weatherGET(req());
    for (let i = 0; i < 65; i += 1) last = await weatherGET(req());
    expect(last.status).toBe(429);
  });
});

describe('GET /api/search', () => {
  it('renvoie 200 + { results }', async () => {
    const res = await searchGET(url('/api/search?q=Paris'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { results: unknown[] };
    expect(body.results).toHaveLength(2);
  });

  it('renvoie 400 sur une requête vide', async () => {
    const res = await searchGET(url('/api/search?q='));
    expect(res.status).toBe(400);
  });
});
