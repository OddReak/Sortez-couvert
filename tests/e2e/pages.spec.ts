import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './_helpers';

test('page Confidentialité — URL directe, contenu, a11y', async ({ page }) => {
  await page.goto('/confidentialite');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Confidentialité' }),
  ).toBeVisible();
  await expect(page.getByText(/ni journalisées ni conservées/)).toBeVisible();
  await expect(
    page.getByRole('link', { name: /issue sur le dépôt GitHub/ }),
  ).toHaveAttribute('href', 'https://github.com/OddReak/Sortez-couvert');
  await expectNoA11yViolations(page);
});

test('page Aide — URL directe, contenu, a11y', async ({ page }) => {
  await page.goto('/aide');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Aide' }),
  ).toBeVisible();
  await expect(page.getByText(/Ajouter à l’écran d’accueil/)).toBeVisible();
  await expectNoA11yViolations(page);
});

test('navigation Réglages → Aide → retour à l’app', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Paris' }).waitFor();
  await page.getByRole('button', { name: 'Ouvrir le menu des lieux' }).click();
  await page.getByRole('button', { name: 'Réglages' }).click();
  await page.getByRole('link', { name: 'Aide' }).click();

  await expect(page).toHaveURL(/\/aide$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Aide' }),
  ).toBeVisible();

  await page.getByRole('link', { name: /Retour à l’application/ }).click();
  await expect(page.getByRole('heading', { name: 'Paris' })).toBeVisible();
});

test('lien Confidentialité du pied de l’accueil', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Paris' }).waitFor();
  await page
    .locator('footer')
    .getByRole('link', { name: 'Confidentialité' })
    .click();
  await expect(page).toHaveURL(/\/confidentialite$/);
});
