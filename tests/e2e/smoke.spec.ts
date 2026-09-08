import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('la coquille de l’app se charge en portrait', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Terra' })).toBeVisible();
});

test('aucune violation d’accessibilité critique ou sérieuse', async ({
  page,
}) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
  expect(blocking).toEqual([]);
});
