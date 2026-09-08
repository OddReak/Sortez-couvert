/**
 * Client HTTP Foreca (serveur uniquement).
 *
 * - La clé (`FORECA_API_KEY`) reste ici : elle ne quitte jamais le serveur.
 * - Ordre des coordonnées imposé : `longitude,latitude` (brief §4.1 / §20).
 * - Résilience (brief §4.3) : timeout 6 s, 2 retries avec backoff exponentiel
 *   + jitter sur 5xx / timeout UNIQUEMENT (jamais sur 4xx).
 * - Ce module NE valide PAS la forme des réponses : il renvoie `unknown`.
 *   La validation zod est faite par l'appelant (`api/_lib/schemas.ts`, Phase 1B
 *   — écrit à partir de la sortie réelle de `scripts/probe-foreca.mjs`).
 */

const DEFAULT_BASE_URL = 'https://weatherapi.foreca.net';
const TIMEOUT_MS = 6_000;
const MAX_RETRIES = 2;
const BASE_BACKOFF_MS = 300;

export type ForecaAuthMode = 'bearer' | 'query';

export class ForecaError extends Error {
  readonly status: number;
  readonly retryAfterSeconds: number | null;

  constructor(
    message: string,
    status: number,
    retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = 'ForecaError';
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

type ForecaConfig = {
  apiKey: string;
  baseUrl: string;
  authMode: ForecaAuthMode;
};

function readConfig(): ForecaConfig {
  const apiKey = process.env.FORECA_API_KEY;
  if (!apiKey) {
    throw new ForecaError('FORECA_API_KEY absente côté serveur', 500);
  }
  const authMode: ForecaAuthMode =
    process.env.FORECA_AUTH_MODE === 'query' ? 'query' : 'bearer';
  return {
    apiKey,
    baseUrl: (process.env.FORECA_BASE_URL ?? DEFAULT_BASE_URL).replace(
      /\/$/,
      '',
    ),
    authMode,
  };
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);
  const date = Date.parse(header);
  if (Number.isFinite(date)) {
    return Math.max(0, Math.round((date - Date.now()) / 1000));
  }
  return null;
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

function backoffDelay(attempt: number): number {
  const exp = BASE_BACKOFF_MS * 2 ** attempt;
  return exp + Math.random() * exp; // jitter « full »
}

export type ForecaGetOptions = {
  /** Paramètres de query. Les `undefined` sont ignorés. */
  params?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
};

/**
 * `GET https://weatherapi.foreca.net/{path}` avec auth, timeout et retries.
 * `path` ne doit PAS contenir le domaine ; il commence par `/api/v1/...`.
 * @returns le corps JSON parsé, typé `unknown` (à valider par l'appelant).
 */
export async function forecaGet(
  path: string,
  options: ForecaGetOptions = {},
): Promise<unknown> {
  const config = readConfig();
  const url = new URL(
    `${config.baseUrl}${path.startsWith('/') ? path : `/${path}`}`,
  );

  for (const [key, value] of Object.entries(options.params ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (config.authMode === 'bearer') {
    headers.Authorization = `Bearer ${config.apiKey}`;
  } else {
    url.searchParams.set('token', config.apiKey);
  }

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const timeout = new AbortController();
    const timer = setTimeout(() => {
      timeout.abort();
    }, TIMEOUT_MS);
    const signal = options.signal
      ? AbortSignal.any([options.signal, timeout.signal])
      : timeout.signal;

    try {
      const res = await fetch(url, { headers, signal });

      if (res.ok) {
        clearTimeout(timer);
        const data: unknown = await res.json();
        return data;
      }

      // 4xx : erreur définitive, aucun retry.
      if (res.status >= 400 && res.status < 500) {
        clearTimeout(timer);
        const retryAfter = parseRetryAfter(res.headers.get('retry-after'));
        if (res.status === 401) {
          throw new ForecaError(
            'Foreca a répondu 401 : clé invalide ou expirée',
            401,
          );
        }
        if (res.status === 429) {
          throw new ForecaError(
            'Foreca a répondu 429 : quota / débit dépassé',
            429,
            retryAfter,
          );
        }
        throw new ForecaError(
          `Foreca a répondu ${String(res.status)} sur ${path}`,
          res.status,
          retryAfter,
        );
      }

      // 5xx : on retente.
      lastError = new ForecaError(
        `Foreca a répondu ${String(res.status)} sur ${path}`,
        res.status,
      );
    } catch (err) {
      if (err instanceof ForecaError) throw err; // 4xx déjà classé
      lastError = err; // réseau / timeout / abort : on retente
    } finally {
      clearTimeout(timer);
    }

    if (attempt < MAX_RETRIES) {
      await sleep(backoffDelay(attempt));
    }
  }

  if (lastError instanceof Error) {
    throw new ForecaError(
      `Foreca injoignable sur ${path} après ${String(MAX_RETRIES + 1)} tentatives : ${lastError.message}`,
      502,
    );
  }
  throw new ForecaError(`Foreca injoignable sur ${path}`, 502);
}
