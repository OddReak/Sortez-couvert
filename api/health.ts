/**
 * GET /api/health — sonde de disponibilité du proxy.
 *
 * Ne touche PAS Foreca (aucun secret requis). Sert à vérifier que le pipeline
 * Vercel Functions (région cdg1) répond. Le vrai agrégateur `/api/weather`
 * arrive en Phase 1 (brief §3 / §4.3).
 */
export const config = { runtime: 'nodejs' } as const;

export function GET(): Response {
  return Response.json({
    ok: true,
    service: 'terra',
    time: new Date().toISOString(),
  });
}
