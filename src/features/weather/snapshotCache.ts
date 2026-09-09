/**
 * Cache hors ligne du dernier `WeatherSnapshot` par lieu (brief §9.11).
 *
 * IndexedDB via `idb-keyval` — c'est un **cache**, pas un stockage durable :
 * iOS peut le purger après ~7 j sans usage (README « Limites connues sur iOS »).
 */
import { del, get, keys, set } from 'idb-keyval';

import type { WeatherSnapshot } from '@/shared/types/domain';

const PREFIX = 'terra:snapshot:';

type CachedSnapshot = { snapshot: WeatherSnapshot; savedAt: number };

export async function saveSnapshot(
  placeId: string,
  snapshot: WeatherSnapshot,
): Promise<void> {
  try {
    await set(PREFIX + placeId, { snapshot, savedAt: Date.now() });
  } catch {
    // quota plein / mode privé : le hors ligne se dégrade, sans casser.
  }
}

export async function loadSnapshot(
  placeId: string,
): Promise<CachedSnapshot | null> {
  try {
    return (await get<CachedSnapshot>(PREFIX + placeId)) ?? null;
  } catch {
    return null;
  }
}

export async function clearSnapshots(): Promise<void> {
  try {
    const all = await keys();
    await Promise.all(
      all
        .filter((k) => typeof k === 'string' && k.startsWith(PREFIX))
        .map((k) => del(k)),
    );
  } catch {
    // rien à faire
  }
}
