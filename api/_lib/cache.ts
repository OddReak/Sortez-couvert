/**
 * Cache du proxy Foreca.
 *
 * TTL par type de donnée (brief §4.3). Le cache serveur protège le quota
 * Foreca ; l'en-tête `Cache-Control` protège l'origine via le CDN Vercel.
 */
import { getKvStore } from './kv';

export type CacheKind =
  | 'current'
  | 'hourly'
  | 'daily'
  | 'air-quality'
  | 'warning'
  | 'location-search'
  | 'location-meta'
  | 'weather';

type Ttl = { sMaxAge: number; swr: number };

const MIN = 60;
const HOUR = 3600;
const DAY = 86_400;

/** { TTL serveur, stale-while-revalidate } en secondes (brief §4.3). */
export const TTL: Record<CacheKind, Ttl> = {
  current: { sMaxAge: 10 * MIN, swr: 30 * MIN },
  hourly: { sMaxAge: 30 * MIN, swr: 2 * HOUR },
  daily: { sMaxAge: 3 * HOUR, swr: 6 * HOUR },
  'air-quality': { sMaxAge: HOUR, swr: 3 * HOUR },
  warning: { sMaxAge: 10 * MIN, swr: 30 * MIN },
  'location-search': { sMaxAge: DAY, swr: 7 * DAY },
  'location-meta': { sMaxAge: 30 * DAY, swr: 90 * DAY },
  // Route d'agrégation : on s'aligne sur la donnée la plus volatile.
  weather: { sMaxAge: 10 * MIN, swr: 30 * MIN },
};

export function cacheControl(kind: CacheKind): string {
  const { sMaxAge, swr } = TTL[kind];
  return `public, s-maxage=${String(sMaxAge)}, stale-while-revalidate=${String(swr)}`;
}

export type Cached<T> = { value: T; hit: boolean };

/**
 * Renvoie la valeur en cache, ou exécute `producer`, met en cache et renvoie.
 * Ne met JAMAIS en cache une erreur (le `producer` qui rejette propage).
 */
export async function withCache<T>(
  kind: CacheKind,
  key: string,
  producer: () => Promise<T>,
): Promise<Cached<T>> {
  const store = getKvStore();
  const namespaced = `foreca:${kind}:${key}`;

  const cached = await store.get<T>(namespaced);
  if (cached !== null) {
    return { value: cached, hit: true };
  }

  const value = await producer();
  await store.set(namespaced, value, TTL[kind].sMaxAge);
  return { value, hit: false };
}
