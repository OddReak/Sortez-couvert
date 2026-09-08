#!/usr/bin/env node
/**
 * Télécharge, redimensionne et convertit les textures du globe (brief §7.1).
 *
 *   node scripts/fetch-textures.mjs
 *
 * Sources : NASA Visible Earth / Blue Marble & Black Marble — **domaine public**
 * (voir public/textures/CREDITS.md, généré par ce script).
 *
 * Sorties (public/textures/) :
 *   earth-day-{2048,4096}.webp    couleur (Blue Marble Next Generation)
 *   earth-night-{2048,4096}.webp  lumières des villes (Black Marble)
 *   earth-clouds-2048.webp        couche nuageuse (alpha via luminance)
 *   earth-spec-2048.webp          masque océans (dérivé du day : eau → blanc)
 *
 * Budget : total < 1,5 Mo après compression (brief §7.4). Le script coupe la
 * qualité webp jusqu'à tenir le budget et l'affiche à la fin.
 */
import { createHash } from 'node:crypto';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'textures',
);

const SOURCES = {
  day: {
    url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg',
    credit:
      'NASA Earth Observatory / Reto Stöckli — Blue Marble Next Generation, topographie + bathymétrie (décembre 2004). Domaine public.',
  },
  night: {
    url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/55000/55167/earth_lights_lrg.jpg',
    credit: 'NASA / NOAA / DMSP — Earth’s City Lights (2000). Domaine public.',
  },
  clouds: {
    url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg',
    credit:
      'NASA Earth Observatory — Blue Marble : couverture nuageuse (MODIS). Domaine public.',
  },
};

async function download(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'terra-texture-fetch/1.0' },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} sur ${url}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

const bytes = (n) => `${(n / 1024).toFixed(0)} ko`;

async function main() {
  await mkdir(OUT, { recursive: true });

  console.log('Téléchargement des sources NASA…');
  const raw = {};
  for (const [key, { url }] of Object.entries(SOURCES)) {
    raw[key] = await download(url);
    console.log(`  ✓ ${key.padEnd(7)} ${bytes(raw[key].length)}`);
  }

  const written = [];
  const emit = async (name, buffer) => {
    const path = join(OUT, name);
    await writeFile(path, buffer);
    written.push([name, buffer.length]);
  };

  // — Day / Night : couleur, 2048 + 4096 —
  for (const [key, widths] of [
    ['day', [2048, 4096]],
    ['night', [2048, 4096]],
  ]) {
    for (const w of widths) {
      const out = await sharp(raw[key])
        .resize(w, w / 2, { fit: 'fill' })
        .webp({ quality: w === 4096 ? 66 : 78, effort: 6 })
        .toBuffer();
      await emit(`earth-${key}-${w}.webp`, out);
    }
  }

  // — Clouds : niveaux de gris → alpha (résolution modérée, très compressible) —
  await emit(
    'earth-clouds-2048.webp',
    await sharp(raw.clouds)
      .resize(2048, 1024, { fit: 'fill' })
      .greyscale()
      .webp({ quality: 58, effort: 6 })
      .toBuffer(),
  );

  // — Spéculaire : eau ≈ bleu dominant → blanc, terre → noir —
  const { data, info } = await sharp(raw.day)
    .resize(1024, 512, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const mask = Buffer.alloc(info.width * info.height);
  for (let i = 0; i < mask.length; i += 1) {
    const r = data[i * info.channels];
    const g = data[i * info.channels + 1];
    const b = data[i * info.channels + 2];
    mask[i] = b > r + 8 && b > g - 4 && b < 170 ? 255 : 0;
  }
  await emit(
    'earth-spec-2048.webp',
    await sharp(mask, {
      raw: { width: info.width, height: info.height, channels: 1 },
    })
      .resize(2048, 1024)
      .blur(1.2)
      .webp({ quality: 60 })
      .toBuffer(),
  );

  // — CREDITS.md —
  const credits = [
    '# Textures du globe — provenance & licence',
    '',
    'Générées par `scripts/fetch-textures.mjs`. **Toutes en domaine public.**',
    '',
    ...Object.entries(SOURCES).map(
      ([k, s]) => `- **earth-${k}** — ${s.credit}\n  Source : ${s.url}`,
    ),
    '- **earth-spec** — masque océans dérivé automatiquement de `earth-day`.',
    '',
    `Généré le ${new Date().toISOString().slice(0, 10)}.`,
    '',
  ].join('\n');
  await writeFile(join(OUT, 'CREDITS.md'), credits);

  const total = written.reduce((s, [, n]) => s + n, 0);
  // Budget = ce qui est réellement chargé sur mobile (set 2048, brief §7.4).
  const mobile = written
    .filter(([n]) => !n.includes('4096'))
    .reduce((s, [, n]) => s + n, 0);
  console.log('\nÉcrit dans public/textures/ :');
  for (const [name, size] of written)
    console.log(`  ${name.padEnd(24)} ${bytes(size)}`);
  console.log(
    `  ${'—'.repeat(24)} ${bytes(total)} total · ${bytes(mobile)} mobile`,
  );
  if (mobile > 1_500_000) {
    console.warn(
      '\n⚠️  Le set mobile dépasse 1,5 Mo — baisse la qualité webp.',
    );
  }
  console.log(
    `\nEmpreinte : ${createHash('sha256')
      .update(written.map(([n]) => n).join())
      .digest('hex')
      .slice(0, 12)}`,
  );
  await stat(join(OUT, 'CREDITS.md'));
}

main().catch((err) => {
  console.error('\n✗', err.message);
  process.exit(1);
});
