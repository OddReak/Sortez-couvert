import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Units, WeatherSnapshot } from '@/shared/types/domain';

import * as api from './api';
import { clearSnapshots, loadSnapshot } from './snapshotCache';
import { resolveWeather } from './useWeather';

const UNITS: Units = { temp: 'C', wind: 'KMH' };
const input = { lat: 48.85, lon: 2.35, lang: 'fr' as const, units: UNITS };
const snap = (fetchedAt: number): WeatherSnapshot =>
  ({ fetchedAt, place: { id: 'p' } }) as WeatherSnapshot;

describe('resolveWeather', () => {
  beforeEach(async () => {
    await clearSnapshots();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('succès réseau : renvoie le snapshot et le met en cache', async () => {
    vi.spyOn(api, 'fetchWeather').mockResolvedValue(snap(42));
    const result = await resolveWeather('paris', input);
    expect(result.fetchedAt).toBe(42);
    // laisse le void saveSnapshot se résoudre
    await Promise.resolve();
    expect((await loadSnapshot('paris'))?.snapshot.fetchedAt).toBe(42);
  });

  it('échec réseau + cache présent : renvoie le cache', async () => {
    vi.spyOn(api, 'fetchWeather').mockResolvedValueOnce(snap(7));
    await resolveWeather('paris', input);
    await Promise.resolve();

    vi.spyOn(api, 'fetchWeather').mockRejectedValue(new Error('offline'));
    const result = await resolveWeather('paris', input);
    expect(result.fetchedAt).toBe(7);
  });

  it('échec réseau + pas de cache : propage l’erreur', async () => {
    vi.spyOn(api, 'fetchWeather').mockRejectedValue(new Error('offline'));
    await expect(resolveWeather('vide', input)).rejects.toThrow('offline');
  });
});
