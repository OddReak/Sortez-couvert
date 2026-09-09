import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './_helpers';

test('le globe WebGL se charge après l’UI', async ({ page }) => {
  await page.goto('/');
  // La ville et la température sont visibles AVANT le globe (brief §7.4).
  await expect(page.getByRole('heading', { name: 'Paris' })).toBeVisible();

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 15_000 });
});

test.describe('prefers-reduced-motion → fallback 2D (brief §7.5)', () => {
  test.use({ reducedMotion: 'reduce' });

  test('rend une projection SVG, pas de canvas WebGL', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Paris' })).toBeVisible();

    await expect(
      page.getByRole('img', { name: /vue de la Terre \(rendu 2D\)/ }),
    ).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
  });

  test('le fallback 2D reste sans violation d’accessibilité', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('heading', { name: 'Paris' }).waitFor();
    await expectNoA11yViolations(page);
  });
});
