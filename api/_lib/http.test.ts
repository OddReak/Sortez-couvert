import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ForecaError } from './foreca';
import { errorJson, json, withApi } from './http';
import { __resetKvStore } from './kv';
import { BadRequestError } from './params';

let ipCounter = 0;
const freshRequest = (): Request => {
  ipCounter += 1;
  return new Request('https://terra.app/api/weather', {
    headers: { 'x-forwarded-for': `192.0.2.${String(ipCounter)}` },
  });
};

beforeEach(() => {
  __resetKvStore();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  __resetKvStore();
  vi.restoreAllMocks();
});

describe('json / errorJson', () => {
  it('json pose le content-type et le cache-control optionnel', async () => {
    const res = json({ a: 1 }, { cacheControl: 'public, s-maxage=60' });
    expect(res.headers.get('content-type')).toBe(
      'application/json; charset=utf-8',
    );
    expect(res.headers.get('cache-control')).toBe('public, s-maxage=60');
    expect(await res.json()).toEqual({ a: 1 });
  });

  it('errorJson renvoie { error, ...extra } au bon statut', async () => {
    const res = errorJson(503, 'indispo', { retryAfter: 12 });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'indispo', retryAfter: 12 });
  });
});

describe('withApi — succès et limitation', () => {
  it('exécute le handler quand la limite n’est pas atteinte', async () => {
    const res = await withApi(freshRequest(), () =>
      Promise.resolve(json({ ok: true })),
    );
    expect(res.status).toBe(200);
  });

  it('renvoie 429 au-delà de 60 requêtes pour la même IP', async () => {
    const req = new Request('https://terra.app/api/weather', {
      headers: { 'x-forwarded-for': '198.51.100.1' },
    });
    let res = await withApi(req, () => Promise.resolve(json({})));
    for (let i = 0; i < 61; i += 1) {
      res = await withApi(req, () => Promise.resolve(json({})));
    }
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ error: 'Trop de requêtes' });
  });
});

describe('withApi — traduction des erreurs', () => {
  it('BadRequestError → 400 + issues', async () => {
    const res = await withApi(freshRequest(), () => {
      throw new BadRequestError(['lat: requis']);
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ issues: ['lat: requis'] });
  });

  it('ForecaError 401 → 503 générique (et log serveur)', async () => {
    const res = await withApi(freshRequest(), () => {
      throw new ForecaError('clé', 401);
    });
    expect(res.status).toBe(503);
    expect(console.error).toHaveBeenCalled();
  });

  it('ForecaError 429 → 503 + retryAfter', async () => {
    const res = await withApi(freshRequest(), () => {
      throw new ForecaError('quota', 429, 42);
    });
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ retryAfter: 42 });
  });

  it('ForecaError 5xx → 502', async () => {
    const res = await withApi(freshRequest(), () => {
      throw new ForecaError('bad gateway', 502);
    });
    expect(res.status).toBe(502);
  });

  it('erreur inconnue → 500', async () => {
    const res = await withApi(freshRequest(), () => {
      throw new Error('inattendu');
    });
    expect(res.status).toBe(500);
  });
});
