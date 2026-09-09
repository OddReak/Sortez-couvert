import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './_helpers';

const snapshot = JSON.parse(
  readFileSync(
    fileURLToPath(
      new URL(
        '../../src/mocks/fixtures/weather-snapshot.json',
        import.meta.url,
      ),
    ),
    'utf8',
  ),
) as Record<string, unknown>;

/**
 * Mode hors ligne (brief §9.11) — testé sur le BUILD RÉEL (service worker PWA
 * actif, pas de MSW). Le serveur `:4174` est démarré par `playwright.config.ts`.
 */
test.use({
  baseURL: 'http://localhost:4174',
  permissions: ['geolocation'],
  geolocation: { latitude: 48.8566, longitude: 2.3522 },
});

const PARIS_PLACE = {
  id: '48.8566,2.3522',
  name: 'Paris',
  country: 'France',
  adminArea: 'Île-de-France',
  lat: 48.8566,
  lon: 2.3522,
  timezone: 'Europe/Paris',
};

test('sans réseau : app shell + données en cache + bandeau, jamais d’écran blanc', async ({
  page,
}) => {
  test.slow(); // build réel + install SW + reload « hors ligne »
  // Données servies pendant la phase EN LIGNE (le SW les met en cache).
  const staleSnapshot = {
    ...snapshot,
    place: PARIS_PLACE,
    fetchedAt: Date.now() - 90 * 60 * 1000, // 1 h 30 → périmé (> 20 min)
  };
  await page.route('**/api/place**', (route) =>
    route.fulfill({ json: PARIS_PLACE }),
  );
  await page.route('**/api/weather**', (route) =>
    route.fulfill({ json: staleSnapshot }),
  );

  // Parcours d'entrée (build réel = pas de seed) → onboarding + géoloc.
  await page.goto('/?source=pwa');
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'Autoriser ma position' }).click();
  await expect(page.getByRole('heading', { name: 'Paris' })).toBeVisible({
    timeout: 15_000,
  });

  // Attend que le service worker contrôle la page (précache prêt).
  await page.waitForFunction(
    () => navigator.serviceWorker.controller !== null,
    { timeout: 20_000 },
  );

  // Recharge EN LIGNE une fois le SW actif : la coquille + `/api/weather`
  // passent alors par le SW et sont mis en cache (`terra-api`).
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Paris' })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/Données du /)).toBeVisible();

  // « Hors ligne » : toute requête réseau échoue. Un hit du cache SW ou
  // d'IndexedDB n'est pas une requête réseau → il passe.
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await page.route('**/*', (route) => route.abort('internetdisconnected'));

  await page.reload({ waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('heading', { name: 'Paris' })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/Données du /)).toBeVisible();
  await expect(page.locator('footer')).toContainText(/\d+°/);

  await expectNoA11yViolations(page);
});
