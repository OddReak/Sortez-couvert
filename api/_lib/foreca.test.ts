import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ForecaError, forecaGet } from './foreca';

type FetchMock = ReturnType<typeof vi.fn>;

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

let fetchMock: FetchMock;

beforeEach(() => {
  vi.stubEnv('FORECA_API_KEY', 'test-key');
  vi.stubEnv('FORECA_BASE_URL', 'https://weatherapi.foreca.net');
  vi.stubEnv('FORECA_AUTH_MODE', 'bearer');
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('forecaGet — configuration', () => {
  it('échoue explicitement sans clé', async () => {
    vi.stubEnv('FORECA_API_KEY', '');
    await expect(forecaGet('/api/v1/current/2,48')).rejects.toMatchObject({
      status: 500,
    });
  });

  it('envoie la clé en en-tête Bearer', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await forecaGet('/api/v1/current/2,48');

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer test-key',
    );
    expect(url.searchParams.has('token')).toBe(false);
  });

  it('passe la clé en query quand FORECA_AUTH_MODE=query', async () => {
    vi.stubEnv('FORECA_AUTH_MODE', 'query');
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await forecaGet('/api/v1/current/2,48');

    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.searchParams.get('token')).toBe('test-key');
  });

  it('sérialise les params et ignore les undefined', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await forecaGet('/api/v1/forecast/hourly/2,48', {
      params: { periods: 72, lang: 'fr', tz: undefined },
    });

    const [url] = fetchMock.mock.calls[0] as [URL];
    expect(url.searchParams.get('periods')).toBe('72');
    expect(url.searchParams.get('lang')).toBe('fr');
    expect(url.searchParams.has('tz')).toBe(false);
  });

  it('renvoie le JSON parsé sur succès', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ temperature: 21 }));
    await expect(forecaGet('/api/v1/current/2,48')).resolves.toEqual({
      temperature: 21,
    });
  });
});

describe('forecaGet — erreurs 4xx (aucun retry)', () => {
  it('401 → ForecaError 401, un seul appel', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, { status: 401 }));
    await expect(forecaGet('/api/v1/current/2,48')).rejects.toBeInstanceOf(
      ForecaError,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('429 → ForecaError 429 avec Retry-After', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({}, { status: 429, headers: { 'retry-after': '30' } }),
    );
    await expect(forecaGet('/api/v1/current/2,48')).rejects.toMatchObject({
      status: 429,
      retryAfterSeconds: 30,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('404 → ForecaError 404, un seul appel', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, { status: 404 }));
    await expect(forecaGet('/api/v1/current/2,48')).rejects.toMatchObject({
      status: 404,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('forecaGet — 5xx et réseau (retries)', () => {
  it('retente puis réussit', async () => {
    vi.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({ recovered: true }));

    const promise = forecaGet('/api/v1/current/2,48');
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toEqual({ recovered: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('épuise les retries sur 500 → ForecaError 502 (3 appels)', async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(jsonResponse({}, { status: 500 }));

    const promise = forecaGet('/api/v1/current/2,48');
    const assertion = expect(promise).rejects.toMatchObject({ status: 502 });
    await vi.runAllTimersAsync();
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('retente sur erreur réseau puis abandonne', async () => {
    vi.useFakeTimers();
    fetchMock.mockRejectedValue(new Error('ECONNRESET'));

    const promise = forecaGet('/api/v1/current/2,48');
    const assertion = expect(promise).rejects.toMatchObject({ status: 502 });
    await vi.runAllTimersAsync();
    await assertion;

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
