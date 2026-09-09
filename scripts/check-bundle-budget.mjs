#!/usr/bin/env node
/**
 * Garde-fou du budget §12 : « JS initial (gzip, hors chunk three) < 180 ko ».
 *
 * On mesure le chunk d'entrée `dist/assets/index-*.js` gzippé. Les chunks
 * chargés à la demande (globe/three, MSW, registre PWA) sont des fichiers
 * séparés et ne comptent pas.
 *
 * Usage : `node scripts/check-bundle-budget.mjs [dist]`
 */
import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const BUDGET_BYTES = 180 * 1024;
const dist = process.argv[2] ?? 'dist';
const assetsDir = join(dist, 'assets');

const entry = readdirSync(assetsDir).find(
  (f) => /^index-.*\.js$/.test(f) && !f.endsWith('.map'),
);

if (!entry) {
  console.error(`✗ chunk d'entrée introuvable dans ${assetsDir}`);
  process.exit(1);
}

const raw = readFileSync(join(assetsDir, entry));
const gz = gzipSync(raw, { level: 9 }).length;
const kib = (n) => `${(n / 1024).toFixed(1)} ko`;

console.log(`chunk initial : ${entry}`);
console.log(`  brut  ${kib(raw.length)}`);
console.log(`  gzip  ${kib(gz)}  (budget ${kib(BUDGET_BYTES)})`);

if (gz > BUDGET_BYTES) {
  console.error(`✗ budget dépassé de ${kib(gz - BUDGET_BYTES)}`);
  process.exit(1);
}
console.log('✓ budget tenu');
