import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function expectNoBlockingA11y(page: Page) {
  // Laisser l'animation d'ouverture des sheets se terminer : sinon axe mesure
  // le contraste sur un panneau encore semi-transparent.
  await page.evaluate(() => {
    for (const a of document.getAnimations()) {
      try {
        a.finish();
      } catch {
        // animation infinie (ex. pulse) — sans effet sur l'opacité des sheets
      }
    }
  });
  await page.waitForTimeout(50);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
  expect(blocking).toEqual([]);
}

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

  await expectNoBlockingA11y(page);

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

test('prévisions 7 jours accessibles depuis le menu', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Paris' }).waitFor();

  await page.getByRole('button', { name: 'Ouvrir le menu des lieux' }).click();
  await page.getByRole('button', { name: 'Prévisions 7 jours' }).click();

  const sheet = page.getByRole('dialog', { name: '7 jours' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText("Aujourd'hui")).toBeVisible();
  await expect(sheet.getByRole('listitem')).toHaveCount(7);

  await expectNoBlockingA11y(page);
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

  await expectNoBlockingA11y(page);

  await page.goto('/');
  await page.getByRole('heading', { name: 'Paris' }).waitFor();
  await expect(page.getByRole('button', { name: /Vent violent/ })).toHaveCount(
    0,
  );
});
