import { expect, test } from '@playwright/test';

/**
 * Captures de référence des thèmes (brief §13). Pour l'instant : simple
 * capture d'artefact ; la non-régression pixel arrive en Phase 8.
 */
for (const scheme of ['light', 'dark'] as const) {
  test(`capture — thème ${scheme}`, async ({ page }) => {
    await page.addInitScript((value) => {
      window.localStorage.setItem(
        'terra.settings',
        JSON.stringify({
          state: {
            units: { temp: 'C', wind: 'KMH' },
            themeOverride: value,
            language: 'fr',
            nonGesturalTimeControl: false,
            soundTick: false,
          },
          version: 1,
        }),
      );
    }, scheme);

    await page.goto('/');
    await page.getByRole('heading', { name: 'Paris' }).waitFor();
    await page.locator('canvas').waitFor({ timeout: 15_000 });
    await page.waitForTimeout(2500);
    await page.screenshot({
      path: test.info().outputPath(`home-${scheme}.png`),
      fullPage: false,
    });
    await expect(page.getByText('Foreca')).toBeVisible();
  });
}

test.describe('fallback 2D', () => {
  test.use({ reducedMotion: 'reduce' });
  test('capture — globe 2D', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('img', { name: /rendu 2D/ }).waitFor();
    await page.waitForTimeout(400);
    await page.screenshot({ path: test.info().outputPath('globe-2d.png') });
  });
});

test('capture — bague scrubée (Prévision)', async ({ page }) => {
  await page.goto('/');
  const ring = page.getByRole('slider', { name: /Heure affichée/ });
  await ring.waitFor();
  await ring.focus();
  for (let i = 0; i < 9; i += 1) await ring.press('ArrowRight');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: test.info().outputPath('ring-scrubbed.png') });
});

test('capture — onboarding pré-permission', async ({ page }) => {
  await page.goto('/?onboarding=1');
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('heading', { name: /Votre position/ }).waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: test.info().outputPath('onboarding.png') });
});

test('capture — détail métrique (graphe 24 h)', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Paris' }).waitFor();
  await page.getByRole('button', { name: /Détail : Vent/ }).click();
  await page.getByRole('dialog', { name: 'Vent' }).waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: test.info().outputPath('metric-sheet.png') });
});

test('capture — qualité de l’air détaillée', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Paris' }).waitFor();
  await page.getByRole('button', { name: /Détail : Qualité de l'air/ }).click();
  await page.getByRole('dialog', { name: "Qualité de l'air" }).waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: test.info().outputPath('air-quality.png') });
});

test('capture — prévisions 7 jours', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Paris' }).waitFor();
  await page.getByRole('button', { name: 'Ouvrir le menu des lieux' }).click();
  await page.getByRole('button', { name: 'Réglages' }).click();
  await page.getByRole('button', { name: 'Prévisions 7 jours' }).click();
  await page.getByRole('dialog', { name: '7 jours' }).waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: test.info().outputPath('forecast-7d.png') });
});

test('capture — bandeau et détail d’alerte', async ({ page }) => {
  await page.goto('/?alerts=1');
  await page.getByRole('heading', { name: 'Paris' }).waitFor();
  await page.getByRole('button', { name: /Vent violent/ }).click();
  await page.getByRole('dialog', { name: /Alertes? météo/ }).waitFor();
  await page.waitForTimeout(400);
  await page.screenshot({ path: test.info().outputPath('alert-sheet.png') });
});

test('capture — recherche de ville', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Rechercher une ville' }).click();
  await page.getByLabel('Nom de ville').fill('Paris');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Paris/ })
    .first()
    .waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: test.info().outputPath('search.png') });
});
