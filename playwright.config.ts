import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  ...(isCI ? { workers: 1 } : {}),
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      // Cible de test d'Audric : iPhone 15, dernier iOS stable (brief §17.23).
      name: 'iphone-15',
      use: { ...devices['iPhone 15'] },
      testIgnore: /offline\.spec\.ts/,
    },
    {
      // Le mode hors ligne teste le service worker + `context.setOffline` +
      // reload : WebKit plante sur cette combinaison dans Playwright. Le
      // comportement testé (cache SW / repli IndexedDB) est indépendant du
      // moteur → on le vérifie sur Chromium.
      name: 'offline-chromium',
      use: { ...devices['Pixel 7'] },
      testMatch: /offline\.spec\.ts/,
    },
  ],
  webServer: [
    {
      // Build + fixtures MSW (VITE_ENABLE_MOCKS via .env.mock) — la majorité
      // des specs. baseURL par défaut.
      command: 'pnpm preview:mock',
      url: 'http://localhost:4173',
      reuseExistingServer: !isCI,
      timeout: 180_000,
    },
    {
      // Build RÉEL (service worker PWA actif, pas de MSW) — `offline.spec.ts`
      // s'y branche via `test.use({ baseURL })`.
      command: 'pnpm preview:real',
      url: 'http://localhost:4174',
      reuseExistingServer: !isCI,
      timeout: 180_000,
    },
  ],
});
