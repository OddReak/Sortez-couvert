import { expect, test, type Page } from '@playwright/test';

/**
 * L'app doit s'adapter à la taille de l'affichage, pas seulement à l'iPhone 15
 * (demande d'Audric, Phase 8). On vérifie sur plusieurs tailles : rendu complet,
 * pas de scroll horizontal, pas de chevauchement des textes clés.
 */
const VIEWPORTS = [
  { name: 'petit téléphone (SE)', width: 375, height: 667 },
  { name: 'grand téléphone (Pro Max)', width: 430, height: 932 },
  { name: 'desktop', width: 1280, height: 800 },
] as const;

async function noHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(overflow, 'le body ne doit jamais défiler horizontalement').toBe(
    false,
  );
}

/** La sous-ligne « … En direct » doit finir au-dessus du repère « MAINTENANT ». */
async function subLineAboveNowMarker(page: Page): Promise<void> {
  const subLine = await page
    .getByText('En direct', { exact: false })
    .first()
    .boundingBox();
  const nowMarker = await page
    .getByText('Maintenant', { exact: true })
    .boundingBox();
  expect(subLine, 'sous-ligne introuvable').not.toBeNull();
  expect(nowMarker, 'repère MAINTENANT introuvable').not.toBeNull();
  expect(
    subLine!.y + subLine!.height,
    'la sous-ligne chevauche le repère MAINTENANT',
  ).toBeLessThanOrEqual(nowMarker!.y + 1);
}

for (const vp of VIEWPORTS) {
  test.describe(vp.name, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('écran principal complet, sans débordement ni chevauchement', async ({
      page,
    }) => {
      await page.goto('/');
      await expect(page.getByRole('heading', { name: 'Paris' })).toBeVisible();
      await expect(page.locator('footer')).toContainText(/\d+°/);
      await expect(page.getByText('Foreca')).toBeVisible();
      await expect(
        page.getByRole('slider', { name: /Heure affichée/ }),
      ).toBeVisible();

      await noHorizontalScroll(page);
      await subLineAboveNowMarker(page);
    });
  });
}

test.describe('paysage court', () => {
  test.use({ viewport: { width: 740, height: 360 } });

  test('tout reste atteignable (fit ou défilement)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Paris' })).toBeVisible();
    await noHorizontalScroll(page);

    // Le conteneur central défile si le contenu déborde (jamais coupé).
    const scrollable = page.locator('[class*="overflow-y-auto"]').first();
    await expect(scrollable).toHaveCSS('overflow-y', 'auto');

    // Température et attribution atteignables (défilement au besoin).
    await page.getByText('Foreca').scrollIntoViewIfNeeded();
    await expect(page.getByText('Foreca')).toBeVisible();
    await expect(page.getByText(/Ressenti/)).toBeVisible();
  });
});
