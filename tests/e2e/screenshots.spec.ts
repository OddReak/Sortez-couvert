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
    await page.waitForTimeout(700);
    await page.screenshot({
      path: test.info().outputPath(`home-${scheme}.png`),
      fullPage: false,
    });
    await expect(page.getByText('Foreca')).toBeVisible();
  });
}
