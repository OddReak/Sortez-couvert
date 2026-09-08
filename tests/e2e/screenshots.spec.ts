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
