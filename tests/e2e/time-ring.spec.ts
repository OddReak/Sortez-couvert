import { expect, test } from '@playwright/test';

test('faire tourner la bague au geste change l’heure', async ({ page }) => {
  await page.goto('/');
  const ring = page.getByRole('slider', { name: /Heure affichée/ });
  await ring.waitFor();

  const box = await ring.boundingBox();
  if (!box) throw new Error('bague introuvable');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const r = box.width / 2 - 6;

  // Départ en haut de l'anneau, rotation horaire d'un quart de tour (~3 h).
  await page.mouse.move(cx, cy - r);
  await page.mouse.down();
  for (let a = 0; a <= 90; a += 6) {
    const rad = (a - 90) * (Math.PI / 180);
    await page.mouse.move(cx + Math.cos(rad) * r, cy + Math.sin(rad) * r);
  }
  await page.mouse.up();
  await page.waitForTimeout(700); // laisse l'inertie/aimantation se poser

  await expect(page.getByText(/^Prévision ·/)).toBeVisible();

  // Retour à « maintenant » (touche Home sur la bague).
  await page.getByRole('slider', { name: /Heure affichée/ }).press('Home');
  await expect(page.getByText('En direct')).toBeVisible({ timeout: 10_000 });
});

test('la température reste stable pendant le scrub (pas de NaN, pas d’écran blanc)', async ({
  page,
}) => {
  await page.goto('/');
  const ring = page.getByRole('slider', { name: /Heure affichée/ });
  await ring.focus();
  for (let i = 0; i < 20; i += 1) await ring.press('ArrowRight');

  await expect(page.locator('footer')).toContainText(/-?\d+°/);
  await expect(page.getByText('Foreca')).toBeVisible();
});
