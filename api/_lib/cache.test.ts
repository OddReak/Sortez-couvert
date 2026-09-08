import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TTL, cacheControl, withCache } from './cache';
import { __resetKvStore } from './kv';

beforeEach(() => {
  __resetKvStore();
});

afterEach(() => {
  __resetKvStore();
  vi.restoreAllMocks();
});

describe('cacheControl', () => {
  it('reflète les TTL du brief §4.3', () => {
    expect(cacheControl('current')).toBe(
      'public, s-maxage=600, stale-while-revalidate=1800',
    );
    expect(cacheControl('daily')).toBe(
      'public, s-maxage=10800, stale-while-revalidate=21600',
    );
  });

  it('la route weather s’aligne sur la donnée la plus volatile', () => {
    expect(TTL.weather).toEqual(TTL.current);
  });
});

describe('withCache', () => {
  it('exécute le producteur au premier appel (miss) puis sert le cache (hit)', async () => {
    const producer = vi.fn().mockResolvedValue({ temp: 21 });

    const first = await withCache('current', 'paris', producer);
    expect(first).toEqual({ value: { temp: 21 }, hit: false });

    const second = await withCache('current', 'paris', producer);
    expect(second).toEqual({ value: { temp: 21 }, hit: true });
    expect(producer).toHaveBeenCalledTimes(1);
  });

  it('isole les entrées par type et par clé', async () => {
    await withCache('current', 'paris', () => Promise.resolve('a'));
    const other = await withCache('current', 'lyon', () =>
      Promise.resolve('b'),
    );
    expect(other).toEqual({ value: 'b', hit: false });
  });

  it('ne met jamais une erreur en cache', async () => {
    const failing = vi.fn().mockRejectedValueOnce(new Error('foreca down'));

    await expect(withCache('current', 'x', failing)).rejects.toThrow(
      'foreca down',
    );

    failing.mockResolvedValueOnce({ ok: true });
    await expect(withCache('current', 'x', failing)).resolves.toEqual({
      value: { ok: true },
      hit: false,
    });
  });
});
