import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

const WCAG_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
  'wcag22aa',
] as const;

/**
 * Aucune violation `critical` / `serious` sur la page (ou une portion) —
 * brief §11 « tests axe-core automatisés sur chaque écran ».
 */
export async function expectNoA11yViolations(
  page: Page,
  options: { include?: string } = {},
): Promise<void> {
  // Terminer les animations en cours (ouverture des sheets) : sinon axe mesure
  // le contraste sur un panneau encore semi-transparent.
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      try {
        animation.finish();
      } catch {
        // animation infinie (ex. pulse) — sans effet ici
      }
    }
  });
  await page.waitForTimeout(50);

  let builder = new AxeBuilder({ page }).withTags([...WCAG_TAGS]);
  if (options.include) builder = builder.include(options.include);

  const { violations } = await builder.analyze();
  const blocking = violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );

  expect(
    blocking,
    blocking.map((v) => `${v.id} (${String(v.impact)}): ${v.help}`).join('\n'),
  ).toEqual([]);
}
