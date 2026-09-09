/**
 * Helpers de réponse HTTP pour les routes `/api/*` (signature Web/Fetch).
 */
import { BadRequestError } from './params.js';
import { ForecaError } from './foreca.js';
import { checkRateLimit, clientIp } from './ratelimit.js';

export function json(
  data: unknown,
  init: ResponseInit & { cacheControl?: string } = {},
): Response {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  if (init.cacheControl) headers.set('cache-control', init.cacheControl);
  return new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers,
  });
}

export function errorJson(
  status: number,
  message: string,
  extra: Record<string, unknown> = {},
): Response {
  return json({ error: message, ...extra }, { status });
}

/**
 * Enveloppe commune : rate-limit par IP puis exécution, avec traduction des
 * erreurs connues en codes HTTP (brief §4.3).
 */
export async function withApi(
  request: Request,
  handler: () => Promise<Response>,
): Promise<Response> {
  const ip = clientIp(request);
  const rate = await checkRateLimit(ip);
  if (!rate.ok) {
    return errorJson(429, 'Trop de requêtes', {
      retryAfter: rate.retryAfterSeconds,
    });
  }

  try {
    return await handler();
  } catch (err) {
    if (err instanceof BadRequestError) {
      return errorJson(400, err.message, { issues: err.issues });
    }
    if (err instanceof ForecaError) {
      if (err.status === 401) {
        // Log serveur explicite ; réponse générique côté client (brief §4.3).
        console.error('[foreca] clé invalide ou expirée (401)');
        return errorJson(503, 'Service météo temporairement indisponible');
      }
      if (err.status === 429) {
        return errorJson(503, 'Service météo saturé', {
          retryAfter: err.retryAfterSeconds,
        });
      }
      return errorJson(502, 'Réponse invalide du service météo');
    }
    console.error('[api] erreur non gérée', err);
    return errorJson(500, 'Erreur interne');
  }
}
