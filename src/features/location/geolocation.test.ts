import { afterEach, describe, expect, it, vi } from 'vitest';

import { getCurrentPosition, queryGeoPermission } from './geolocation';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getCurrentPosition — les 3 états (brief §9.2)', () => {
  it('succès → coordonnées', async () => {
    vi.stubGlobal('window', { isSecureContext: true });
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (ok: (p: unknown) => void) => {
          ok({ coords: { latitude: 48.85, longitude: 2.35 } });
        },
      },
    });
    await expect(getCurrentPosition()).resolves.toEqual({
      ok: true,
      lat: 48.85,
      lon: 2.35,
    });
  });

  it('refus → { ok: false, reason: "denied" }', async () => {
    vi.stubGlobal('window', { isSecureContext: true });
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (_ok: unknown, fail: (e: unknown) => void) => {
          fail({ code: 1, PERMISSION_DENIED: 1, TIMEOUT: 3 });
        },
      },
    });
    await expect(getCurrentPosition()).resolves.toEqual({
      ok: false,
      reason: 'denied',
    });
  });

  it('API absente → indisponible', async () => {
    vi.stubGlobal('navigator', {});
    await expect(getCurrentPosition()).resolves.toEqual({
      ok: false,
      reason: 'unavailable',
    });
  });

  it('contexte non sécurisé → insecure', async () => {
    vi.stubGlobal('window', { isSecureContext: false });
    vi.stubGlobal('navigator', {
      geolocation: { getCurrentPosition: vi.fn() },
    });
    await expect(getCurrentPosition()).resolves.toEqual({
      ok: false,
      reason: 'insecure',
    });
  });
});

describe('queryGeoPermission', () => {
  it('renvoie l’état sans déclencher la boîte de dialogue', async () => {
    vi.stubGlobal('navigator', {
      permissions: { query: () => Promise.resolve({ state: 'prompt' }) },
    });
    await expect(queryGeoPermission()).resolves.toBe('prompt');
  });

  it('« unknown » si l’API Permissions manque', async () => {
    vi.stubGlobal('navigator', {});
    await expect(queryGeoPermission()).resolves.toBe('unknown');
  });
});
