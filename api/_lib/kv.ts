/**
 * Magasin clé-valeur pour le cache et le rate-limit du proxy.
 *
 * - Si `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` sont présents :
 *   Upstash Redis (partagé entre toutes les instances serverless).
 * - Sinon : repli mémoire par instance (suffisant en dev / preview, dégradé
 *   mais fonctionnel en prod — brief §14).
 */
import { Redis } from '@upstash/redis';

export type KvStore = {
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, value: T, ttlSeconds: number) => Promise<void>;
  /** Incrémente et renvoie la valeur ; pose l'expiration au 1er appel. */
  incr: (key: string, ttlSeconds: number) => Promise<number>;
};

type MemEntry = { value: unknown; expiresAt: number };

function createMemoryStore(): KvStore {
  const map = new Map<string, MemEntry>();

  const prune = (): void => {
    const now = Date.now();
    for (const [k, entry] of map) {
      if (entry.expiresAt <= now) map.delete(k);
    }
  };

  return {
    get: <T>(key: string) => {
      const entry = map.get(key);
      if (!entry || entry.expiresAt <= Date.now()) {
        map.delete(key);
        return Promise.resolve(null);
      }
      return Promise.resolve(entry.value as T);
    },
    set: <T>(key: string, value: T, ttlSeconds: number) => {
      prune();
      map.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
      return Promise.resolve();
    },
    incr: (key: string, ttlSeconds: number) => {
      prune();
      const entry = map.get(key);
      const now = Date.now();
      if (!entry || entry.expiresAt <= now) {
        map.set(key, { value: 1, expiresAt: now + ttlSeconds * 1000 });
        return Promise.resolve(1);
      }
      const next = (entry.value as number) + 1;
      entry.value = next;
      return Promise.resolve(next);
    },
  };
}

function createRedisStore(url: string, token: string): KvStore {
  const redis = new Redis({ url, token });
  return {
    get: <T>(key: string) => redis.get<T>(key),
    set: async <T>(key: string, value: T, ttlSeconds: number) => {
      await redis.set(key, value, { ex: ttlSeconds });
    },
    incr: async (key: string, ttlSeconds: number) => {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, ttlSeconds);
      return count;
    },
  };
}

let store: KvStore | undefined;

export function getKvStore(): KvStore {
  if (store) return store;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  store = url && token ? createRedisStore(url, token) : createMemoryStore();
  return store;
}

/** Réinitialise le magasin mémorisé — usage test uniquement. */
export function __resetKvStore(): void {
  store = undefined;
}
