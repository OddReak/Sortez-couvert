import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  __resetPwaStatus,
  applyUpdate,
  registerServiceWorker,
} from './register';

afterEach(() => {
  __resetPwaStatus();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('registerServiceWorker', () => {
  it('no-op en dev (n’importe jamais virtual:pwa-register)', async () => {
    vi.stubEnv('DEV', true);
    await expect(registerServiceWorker()).resolves.toBeUndefined();
  });

  it('no-op quand VITE_ENABLE_MOCKS=true', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_ENABLE_MOCKS', 'true');
    await expect(registerServiceWorker()).resolves.toBeUndefined();
  });

  it('applyUpdate est sûr quand aucun SW n’est enregistré', () => {
    expect(() => {
      applyUpdate();
    }).not.toThrow();
  });
});
