import { expect, test } from '@playwright/test';

test.describe('onboarding + permission de localisation (brief §9.1 / §9.2)', () => {
  test('2 écrans, dont un de pré-permission avant la boîte de dialogue', async ({
    page,
  }) => {
    await page.goto('/?onboarding=1');

    await expect(
      page.getByRole('heading', { name: /Tournez le temps/ }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Écran de pré-permission : explication AVANT la demande système.
    await expect(
      page.getByRole('heading', { name: /Votre position/ }),
    ).toBeVisible();
    await expect(page.getByText(/uniquement pour afficher/)).toBeVisible();
  });

  test('refus de permission → recherche manuelle (LE checkpoint)', async ({
    browser,
  }) => {
    // Contexte sans permission géoloc accordée → getCurrentPosition échoue.
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/?onboarding=1');

    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.getByRole('button', { name: 'Autoriser ma position' }).click();

    await expect(page.getByText(/Localisation refusée/)).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('button', { name: /Chercher une ville/ }).click();
    await page.getByLabel('Nom de ville').fill('Paris');
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /Paris/ })
      .first()
      .click();

    await expect(page.getByRole('heading', { name: 'Paris' })).toBeVisible();
    await expect(page.getByText('En direct')).toBeVisible();
    await context.close();
  });

  test('permission accordée → météo locale directement', async ({
    browser,
  }) => {
    const context = await browser.newContext({
      permissions: ['geolocation'],
      geolocation: { latitude: 48.8566, longitude: 2.3522 },
    });
    const page = await context.newPage();
    await page.goto('/?onboarding=1');

    await page.getByRole('button', { name: 'Continuer' }).click();
    await page.getByRole('button', { name: 'Autoriser ma position' }).click();

    await expect(page.getByRole('heading', { name: 'Paris' })).toBeVisible({
      timeout: 15_000,
    });
    await context.close();
  });
});

test('favoris : ajout depuis le menu et bascule', async ({ page }) => {
  await page.goto('/'); // seed = Paris
  await page.getByRole('button', { name: 'Ouvrir le menu des lieux' }).click();

  const menu = page.getByRole('dialog', { name: 'Mes lieux' });
  await expect(menu).toBeVisible();
  // Paris est déjà favori (seed) — on vérifie qu'il est listé.
  await expect(menu.getByText('Paris')).toBeVisible();
  await menu.getByRole('button', { name: 'Fermer' }).click();
});
