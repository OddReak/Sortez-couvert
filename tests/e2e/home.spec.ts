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
  await expect(page.locator('footer')).toContainText(/\d+°/);
  await expect(page.locator('footer')).toContainText(/Ressenti/);
  // métriques
  await expect(page.getByText('Vent')).toBeVisible();
  await expect(page.getByText('Humidité')).toBeVisible();
  await expect(page.getByText('Indice UV')).toBeVisible();
  // attribution Foreca toujours visible (brief §4.1)
  await expect(page.getByText('Foreca')).toBeVisible();
});

test('la bague au clavier passe en mode « Prévision » puis revient à « En direct »', async ({
  page,
}) => {
  await page.goto('/');
  const ring = page.getByRole('slider', { name: /Heure affichée/ });
  await ring.waitFor();

  await ring.focus();
  for (let i = 0; i < 5; i += 1) await ring.press('ArrowRight');
  await expect(page.getByText(/^Prévision ·/)).toBeVisible();

  await ring.press('Home');
  await expect(page.getByText('En direct')).toBeVisible();
});

test('l’alternative non gestuelle (chips) s’affiche en prefers-reduced-motion', async ({
  browser,
}) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');

  const strip = page.getByRole('group', { name: 'Choisir l’heure' });
  await expect(strip).toBeVisible();
  await expect(
    page.getByRole('slider', { name: /Heure affichée/ }),
  ).toHaveCount(0);

  await strip.getByRole('button').last().click();
  await expect(page.getByText(/^Prévision ·/)).toBeVisible();
  await context.close();
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
