/**
 * GET /api/health — sonde de disponibilité du proxy.
 *
 * Ne touche PAS Foreca (aucun secret requis). Sert à vérifier que le pipeline
 * Vercel Functions (région cdg1) répond, et à identifier le déploiement en
 * cours (sonde post-déploiement — voir `docs/DEPLOIEMENT.md`).
 */
export const config = { runtime: 'nodejs' } as const;

export function GET(): Response {
  return Response.json({
    ok: true,
    service: 'terra',
    time: new Date().toISOString(),
    region: process.env.VERCEL_REGION ?? null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    redis: Boolean(
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN,
    ),
  });
}
