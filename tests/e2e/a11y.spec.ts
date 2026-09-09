import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './_helpers';

/**
 * Audit axe sur chaque écran / surface (brief §11). Les écrans « principaux »
 * (accueil, globe 2D, offline, détails métriques) sont couverts dans leurs
 * specs respectives ; ici on complète tout le reste.
 */

test('onboarding — écran 1 puis pré-permission', async ({ page }) => {
  await page.goto('/?onboarding=1');
  await expect(
    page.getByRole('heading', { name: /Tournez le temps/ }),
  ).toBeVisible();
  await expectNoA11yViolations(page);

  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(
    page.getByRole('heading', { name: /Votre position/ }),
  ).toBeVisible();
  await expectNoA11yViolations(page);
});

test('écran « Choisir un lieu »', async ({ page }) => {
  await page.goto('/?choose=1');
  await expect(
    page.getByRole('heading', { name: 'Choisir un lieu' }),
  ).toBeVisible();
  await expectNoA11yViolations(page);
});

test('feuille de recherche de ville', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Paris' }).waitFor();
  await page.getByRole('button', { name: 'Rechercher une ville' }).click();

  const sheet = page.getByRole('dialog');
  await sheet.getByLabel('Nom de ville').fill('Paris');
  await sheet.getByRole('button', { name: /Paris/ }).first().waitFor();
  await expectNoA11yViolations(page);
});

test('menu des lieux', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Paris' }).waitFor();
  await page.getByRole('button', { name: 'Ouvrir le menu des lieux' }).click();
  await expect(page.getByRole('dialog', { name: 'Mes lieux' })).toBeVisible();
  await expectNoA11yViolations(page);
});

test('réglages (avec « À propos » déplié)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Paris' }).waitFor();
  await page.getByRole('button', { name: 'Ouvrir le menu des lieux' }).click();
  await page.getByRole('button', { name: 'Réglages' }).click();

  const sheet = page.getByRole('dialog', { name: 'Réglages' });
  await expect(sheet).toBeVisible();
  await sheet.getByText('À propos').click();
  await expectNoA11yViolations(page);
});

test('prévisions 7 jours', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Paris' }).waitFor();
  await page.getByRole('button', { name: 'Ouvrir le menu des lieux' }).click();
  await page.getByRole('button', { name: 'Prévisions 7 jours' }).click();
  await expect(page.getByRole('dialog', { name: '7 jours' })).toBeVisible();
  await expectNoA11yViolations(page);
});

test('sheet d’alerte', async ({ page }) => {
  await page.goto('/?alerts=1');
  await page.getByRole('heading', { name: 'Paris' }).waitFor();
  await page.getByRole('button', { name: /Vent violent/ }).click();
  await expect(
    page.getByRole('dialog', { name: /Alertes? météo/ }),
  ).toBeVisible();
  await expectNoA11yViolations(page);
});

test('rangée d’heures (prefers-reduced-motion)', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(
    page.getByRole('group', { name: 'Choisir l’heure' }),
  ).toBeVisible();
  await expectNoA11yViolations(page);
  await context.close();
});
