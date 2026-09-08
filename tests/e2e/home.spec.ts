import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('l’écran principal affiche la ville, la condition et la température', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Paris' })).toBeVisible();
  // sous-ligne « … · HH:MM En direct » (données mockées)
  await expect(page.getByText('En direct')).toBeVisible();
  // température héro
  await expect(page.locator('footer').getByText(/^\d+°$/)).toBeVisible();
  // métriques
  await expect(page.getByText('Vent')).toBeVisible();
  await expect(page.getByText('Humidité')).toBeVisible();
  await expect(page.getByText('Indice UV')).toBeVisible();
  // attribution Foreca toujours visible (brief §4.1)
  await expect(page.getByText('Foreca')).toBeVisible();
});

test('choisir une heure passe en mode « Prévision »', async ({ page }) => {
  await page.goto('/');
  const strip = page.getByRole('group', { name: 'Choisir l’heure' });
  await strip.waitFor();

  const chips = strip.getByRole('button');
  await chips.last().click();

  await expect(page.getByText(/^Prévision ·/)).toBeVisible();
});

test('aucune violation d’accessibilité critique ou sérieuse', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Paris' }).waitFor();

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
  expect(blocking).toEqual([]);
});
