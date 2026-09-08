#!/usr/bin/env node
/**
 * Sonde de l'API Foreca — À EXÉCUTER PAR AUDRIC avec sa clé.
 *
 *   node scripts/probe-foreca.mjs
 *
 * Objectif : découvrir la forme RÉELLE des réponses Foreca (brief §0.8 « zéro
 * invention »). Le script interroge chaque endpoint du §4.2, sauvegarde les
 * réponses brutes dans `tests/fixtures/probe/` et imprime un résumé de
 * structure. Claude écrira ensuite les schémas zod à partir de ce résultat.
 *
 * ─── Ce dont le script a besoin ───────────────────────────────────────────
 *   FORECA_API_KEY   clé du portail My API (obligatoire)
 *   FORECA_BASE_URL  défaut : https://weatherapi.foreca.net
 *
 * Fournir la clé au choix :
 *   • variable d'environnement :  FORECA_API_KEY=xxx node scripts/probe-foreca.mjs
 *   • fichier `.env` à la racine (KEY=VALUE, lu automatiquement)
 *   • argument :  node scripts/probe-foreca.mjs --key=xxx
 *
 * Test du flux d'auth « ancien » (user/password → token) : seulement si
 * FORECA_USER et FORECA_PASS sont fournis (voir brief §4.1).
 *
 * ─── Ce que le script renvoie ─────────────────────────────────────────────
 *   • tests/fixtures/probe/<endpoint>.json   réponses brutes (à me renvoyer)
 *   • tests/fixtures/probe/summary.json      statuts + structure
 *   • un rapport lisible sur la sortie standard
 *
 * ⚠️ Quota : essai / Freemium = 2 000 requêtes/jour. Ce script fait ~9 appels.
 * ⚠️ La clé n'est JAMAIS imprimée ni sauvegardée.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'tests', 'fixtures', 'probe');

const TIMEOUT_MS = 15_000;

// ── Lieu cible : Paris (rappel : Foreca attend lon,lat) ──────────────────────
const TARGET = { name: 'Paris', lat: 48.8566, lon: 2.3522 };
const SEARCH_QUERY = 'Paris';
const LON_LAT = `${TARGET.lon},${TARGET.lat}`;

// ────────────────────────────────────────────────────────────────────────────
// Récupération de la configuration
// ────────────────────────────────────────────────────────────────────────────

async function loadDotEnv() {
  try {
    const raw = await readFile(join(ROOT, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m && !(m[1] in process.env)) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    /* pas de .env : on continue avec l'environnement */
  }
}

function getArg(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

// ────────────────────────────────────────────────────────────────────────────
// Description de structure (types, nullabilité, forme des tableaux)
// ────────────────────────────────────────────────────────────────────────────

function describeShape(value, depth = 0) {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    if (value.length === 0) return { array: 0 };
    return { array: value.length, of: describeShape(value[0], depth + 1) };
  }
  const t = typeof value;
  if (t !== 'object') return t;
  if (depth > 4) return 'object(…)';
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = describeShape(v, depth + 1);
  }
  return out;
}

/** Chemins dont la valeur est `null` (pour vérifier `.nullable()` dans zod). */
function collectNullPaths(value, prefix = '', acc = []) {
  if (value === null) {
    acc.push(prefix || '(racine)');
  } else if (Array.isArray(value)) {
    if (value[0] !== undefined) collectNullPaths(value[0], `${prefix}[]`, acc);
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      collectNullPaths(v, prefix ? `${prefix}.${k}` : k, acc);
    }
  }
  return acc;
}

// ────────────────────────────────────────────────────────────────────────────
// HTTP
// ────────────────────────────────────────────────────────────────────────────

let requestCount = 0;

async function call(url, { headers = {}, method = 'GET', body } = {}) {
  requestCount += 1;
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, TIMEOUT_MS);
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      durationMs: Date.now() - started,
      contentType: res.headers.get('content-type'),
      retryAfter: res.headers.get('retry-after'),
      json,
      rawText: json === undefined ? text.slice(0, 2000) : undefined,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      statusText: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - started,
    };
  } finally {
    clearTimeout(timer);
  }
}

function redactUrl(url, key) {
  let out = url;
  if (key) out = out.split(key).join('<KEY>');
  return out.replace(/([?&]token=)[^&]+/i, '$1<KEY>');
}

// ────────────────────────────────────────────────────────────────────────────
// Programme principal
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  await loadDotEnv();

  const apiKey = getArg('key') ?? process.env.FORECA_API_KEY;
  const baseUrl = (
    process.env.FORECA_BASE_URL ?? 'https://weatherapi.foreca.net'
  ).replace(/\/$/, '');
  const user = process.env.FORECA_USER;
  const pass = process.env.FORECA_PASS;

  if (!apiKey) {
    console.error(
      '\n✗ FORECA_API_KEY manquante.\n' +
        "  Renseigne-la dans .env, en variable d'environnement, ou via --key=…\n",
    );
    process.exit(1);
  }

  console.log(`\nSonde Foreca — base : ${baseUrl}`);
  console.log(`Lieu cible : ${TARGET.name} (lon,lat = ${LON_LAT})\n`);

  const authHeader = { Authorization: `Bearer ${apiKey}` };

  // ── Étape 0 : quel mécanisme d'authentification ? ─────────────────────────
  const authReport = { bearer: null, queryToken: null, legacyFlow: null };

  const bearerProbe = await call(
    `${baseUrl}/api/v1/current/${LON_LAT}?lang=fr`,
    { headers: authHeader },
  );
  authReport.bearer = { status: bearerProbe.status, ok: bearerProbe.ok };

  if (!bearerProbe.ok && bearerProbe.status === 401) {
    // Essai : token en query
    const q = await call(
      `${baseUrl}/api/v1/current/${LON_LAT}?lang=fr&token=${encodeURIComponent(apiKey)}`,
    );
    authReport.queryToken = { status: q.status, ok: q.ok };

    // Essai : ancien flux pfa.foreca.com si identifiants fournis
    if (user && pass) {
      const legacy = await call('https://pfa.foreca.com/authorize/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password: pass }),
      });
      authReport.legacyFlow = {
        status: legacy.status,
        ok: legacy.ok,
        shape: legacy.json ? describeShape(legacy.json) : undefined,
      };
    } else {
      authReport.legacyFlow = 'non testé (FORECA_USER / FORECA_PASS absents)';
    }
  }

  const bearerWorks = bearerProbe.ok;
  console.log(
    bearerWorks
      ? '✓ Auth : Bearer statique OK\n'
      : `⚠ Auth Bearer : HTTP ${bearerProbe.status} — voir summary.json (section auth)\n`,
  );

  // ── Étape 1 : interroger tous les endpoints ──────────────────────────────
  const endpoints = [
    {
      name: 'location-search',
      url: `${baseUrl}/api/v1/location/search/${encodeURIComponent(SEARCH_QUERY)}?lang=fr`,
    },
    {
      name: 'location-meta',
      url: `${baseUrl}/api/v1/location/${LON_LAT}?lang=fr`,
    },
    {
      name: 'current',
      url: `${baseUrl}/api/v1/current/${LON_LAT}?lang=fr&tempunit=C&windunit=KMH&rounding=0`,
    },
    {
      name: 'forecast-hourly',
      url: `${baseUrl}/api/v1/forecast/hourly/${LON_LAT}?periods=72&dataset=full&history=1&tz=Europe/Paris&lang=fr&rounding=0`,
    },
    {
      name: 'forecast-daily',
      url: `${baseUrl}/api/v1/forecast/daily/${LON_LAT}?periods=10&dataset=full&lang=fr&rounding=0`,
    },
    {
      name: 'forecast-minutely',
      url: `${baseUrl}/api/v1/forecast/minutely/${LON_LAT}?periods=60`,
    },
    {
      name: 'air-quality-hourly',
      url: `${baseUrl}/api/v1/air-quality/forecast/hourly/${LON_LAT}?periods=24&tz=Europe/Paris&lang=fr`,
    },
    {
      name: 'warning',
      url: `${baseUrl}/api/v1/warning/${LON_LAT}?dataset=full`,
    },
  ];

  await mkdir(OUT_DIR, { recursive: true });
  const summary = {
    probedAt: new Date().toISOString(),
    baseUrl,
    target: TARGET,
    auth: authReport,
    endpoints: {},
  };

  for (const ep of endpoints) {
    const useQueryToken = !bearerWorks && authReport.queryToken?.ok;
    const finalUrl = useQueryToken
      ? `${ep.url}${ep.url.includes('?') ? '&' : '?'}token=${encodeURIComponent(apiKey)}`
      : ep.url;

    const result = await call(finalUrl, {
      headers: bearerWorks ? authHeader : {},
    });

    const line = `${result.ok ? '✓' : '✗'} ${ep.name.padEnd(20)} HTTP ${result.status} · ${result.durationMs} ms`;
    console.log(line);

    summary.endpoints[ep.name] = {
      url: redactUrl(ep.url, apiKey),
      status: result.status,
      ok: result.ok,
      durationMs: result.durationMs,
      contentType: result.contentType,
      retryAfter: result.retryAfter ?? undefined,
      topLevelKeys:
        result.json && typeof result.json === 'object'
          ? Object.keys(result.json)
          : undefined,
      shape: result.json ? describeShape(result.json) : undefined,
      nullPaths: result.json ? collectNullPaths(result.json) : undefined,
      rawTextPreview: result.rawText,
    };

    if (result.json !== undefined) {
      await writeFile(
        join(OUT_DIR, `${ep.name}.json`),
        JSON.stringify(result.json, null, 2),
        'utf8',
      );
    }
  }

  await writeFile(
    join(OUT_DIR, 'summary.json'),
    JSON.stringify(summary, null, 2),
    'utf8',
  );

  console.log(
    `\n${requestCount} requêtes effectuées (quota Foreca : 2 000/jour).`,
  );
  console.log(`Réponses brutes  : tests/fixtures/probe/*.json`);
  console.log(`Résumé structure : tests/fixtures/probe/summary.json`);
  console.log(
    '\n→ Renvoie-moi le contenu de `tests/fixtures/probe/summary.json`' +
      ' (et les .json qui posent question).\n',
  );
}

main().catch((err) => {
  console.error('\n✗ Erreur inattendue :', err);
  process.exit(1);
});
