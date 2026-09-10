import { expect, test } from '@playwright/test';

import { expectNoA11yViolations } from './_helpers';

test('tap sur une métrique → bottom sheet de détail avec graphe 24 h', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Paris' }).waitFor();

  await page.getByRole('button', { name: /Détail : Vent/ }).click();

  const sheet = page.getByRole('dialog', { name: 'Vent' });
  await expect(sheet).toBeVisible();
  await expect(
    sheet.getByRole('img', { name: /Vent sur 24 heures/ }),
  ).toBeVisible();
  await expect(sheet.getByText(/min .* · max /)).toBeVisible();

  await expectNoA11yViolations(page);

  await sheet.getByRole('button', { name: 'Fermer' }).click();
  await expect(sheet).toBeHidden();
});

test('la sheet Qualité de l’air montre les sous-indices EPA', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Paris' }).waitFor();

  await page.getByRole('button', { name: /Détail : Qualité de l'air/ }).click();

  const sheet = page.getByRole('dialog', { name: "Qualité de l'air" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText('Sous-indices EPA')).toBeVisible();
  await expect(sheet.getByText(/Polluant dominant/)).toBeVisible();
});

test('carrousel 7 jours entre le globe et les métriques, tap → adapte le globe', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Paris' }).waitFor();

  const carousel = page.getByRole('region', { name: /Prévisions 7 jours/ });
  await expect(carousel).toBeVisible();
  await expect(carousel.getByRole('button')).toHaveCount(7);

  // Placé sous le repère « Maintenant » (globe) et au-dessus des métriques.
  const now = await page.getByText('Maintenant', { exact: true }).boundingBox();
  const rail = await carousel.boundingBox();
  const wind = await page
    .getByRole('button', { name: /Détail : Vent/ })
    .boundingBox();
  expect(rail!.y).toBeGreaterThan(now!.y);
  expect(rail!.y).toBeLessThan(wind!.y);

  // Taper un autre jour recale le globe/thème sur ce jour (pas de popup).
  await carousel.getByRole('button').nth(2).click();
  await expect(carousel.getByRole('button').nth(2)).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByText(/^Prévision ·/)).toBeVisible();
  await expect(page.getByRole('dialog', { name: '7 jours' })).toHaveCount(0);
});

test('prévisions 7 jours accessibles depuis le menu des lieux', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Paris' }).waitFor();

  await page.getByRole('button', { name: 'Ouvrir le menu des lieux' }).click();
  await page.getByRole('button', { name: 'Prévisions 7 jours' }).click();

  const sheet = page.getByRole('dialog', { name: '7 jours' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText("Aujourd'hui")).toBeVisible();
  await expect(sheet.getByRole('listitem')).toHaveCount(7);

  await expectNoA11yViolations(page);
});

test('bandeau d’alerte avec ?alerts=1, absent sinon', async ({ page }) => {
  await page.goto('/?alerts=1');
  await page.getByRole('heading', { name: 'Paris' }).waitFor();

  const banner = page.getByRole('button', { name: /Vent violent/ });
  await expect(banner).toBeVisible();
  await banner.click();

  const sheet = page.getByRole('dialog', { name: /Alertes? météo/ });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText('Vigilance orange')).toBeVisible();

  await expectNoA11yViolations(page);

  await page.goto('/');
  await page.getByRole('heading', { name: 'Paris' }).waitFor();
  await expect(page.getByRole('button', { name: /Vent violent/ })).toHaveCount(
    0,
  );
});
