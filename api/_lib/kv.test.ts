import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { __resetKvStore, getKvStore } from './kv';

beforeEach(() => {
  __resetKvStore();
  vi.unstubAllEnvs();
});

afterEach(() => {
  __resetKvStore();
  vi.unstubAllEnvs();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('magasin mémoire (sans Upstash)', () => {
  it('stocke et relit une valeur', async () => {
    const store = getKvStore();
    await store.set('k', { n: 1 }, 60);
    await expect(store.get('k')).resolves.toEqual({ n: 1 });
  });

  it('expire la valeur après le TTL', async () => {
    vi.useFakeTimers();
    const store = getKvStore();
    await store.set('k', 'v', 10);
    vi.advanceTimersByTime(11_000);
    await expect(store.get('k')).resolves.toBeNull();
  });

  it('incrémente et pose une fenêtre d’expiration', async () => {
    vi.useFakeTimers();
    const store = getKvStore();
    await expect(store.incr('c', 60)).resolves.toBe(1);
    await expect(store.incr('c', 60)).resolves.toBe(2);
    vi.advanceTimersByTime(61_000);
    await expect(store.incr('c', 60)).resolves.toBe(1);
  });

  it('renvoie null pour une clé inconnue', async () => {
    await expect(getKvStore().get('absent')).resolves.toBeNull();
  });
});

describe('magasin Upstash (mocké)', () => {
  it('utilise Redis quand les variables d’environnement sont présentes', async () => {
    const get = vi.fn().mockResolvedValue({ cached: true });
    const set = vi.fn().mockResolvedValue('OK');
    const incr = vi.fn().mockResolvedValue(1);
    const expire = vi.fn().mockResolvedValue(1);

    class FakeRedis {
      get = get;
      set = set;
      incr = incr;
      expire = expire;
    }
    vi.doMock('@upstash/redis', () => ({ Redis: FakeRedis }));
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://example.upstash.io');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token');
    vi.resetModules();

    const { getKvStore: freshGetKvStore } = await import('./kv');
    const store = freshGetKvStore();

    await expect(store.get('k')).resolves.toEqual({ cached: true });
    await store.set('k', 'v', 30);
    expect(set).toHaveBeenCalledWith('k', 'v', { ex: 30 });

    await expect(store.incr('c', 60)).resolves.toBe(1);
    expect(expire).toHaveBeenCalledWith('c', 60);

    vi.doUnmock('@upstash/redis');
  });
});
