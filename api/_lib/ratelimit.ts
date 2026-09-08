/**
 * Limitation de débit sur `/api/*` : 60 requêtes / minute / IP (brief §14).
 *
 * Fenêtre fixe d'une minute. Sur repli mémoire, la limite est par instance
 * serverless (dégradé mais acceptable) ; avec Upstash, elle est globale.
 */
import { getKvStore } from './kv';

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 60;

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

export async function checkRateLimit(
  ip: string,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const bucket = Math.floor(now.getTime() / 1000 / WINDOW_SECONDS);
  const key = `ratelimit:${ip}:${String(bucket)}`;

  const count = await getKvStore().incr(key, WINDOW_SECONDS);
  const remaining = Math.max(0, MAX_REQUESTS - count);
  const secondsIntoWindow = Math.floor(now.getTime() / 1000) % WINDOW_SECONDS;

  return {
    ok: count <= MAX_REQUESTS,
    limit: MAX_REQUESTS,
    remaining,
    retryAfterSeconds: WINDOW_SECONDS - secondsIntoWindow,
  };
}

/** Extrait l'IP client d'une requête Vercel (X-Forwarded-For en tête). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}
