import { beforeEach, describe, expect, it } from 'vitest';

import type { WeatherSnapshot } from '@/shared/types/domain';

import { clearSnapshots, loadSnapshot, saveSnapshot } from './snapshotCache';

const snap = (fetchedAt: number): WeatherSnapshot =>
  ({ fetchedAt, place: { id: 'p' } }) as WeatherSnapshot;

describe('snapshotCache', () => {
  beforeEach(async () => {
    await clearSnapshots();
  });

  it('round-trip save → load', async () => {
    await saveSnapshot('48.85,2.35', snap(111));
    const cached = await loadSnapshot('48.85,2.35');
    expect(cached?.snapshot.fetchedAt).toBe(111);
    expect(typeof cached?.savedAt).toBe('number');
  });

  it('renvoie null pour un lieu absent', async () => {
    expect(await loadSnapshot('nope')).toBeNull();
  });

  it('clearSnapshots efface les entrées terra:snapshot:*', async () => {
    await saveSnapshot('a', snap(1));
    await saveSnapshot('b', snap(2));
    await clearSnapshots();
    expect(await loadSnapshot('a')).toBeNull();
    expect(await loadSnapshot('b')).toBeNull();
  });
});
