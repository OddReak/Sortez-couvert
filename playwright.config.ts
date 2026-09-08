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
    },
  ],
  webServer: {
    // Build de production + fixtures MSW (VITE_ENABLE_MOCKS via .env.mock).
    command: 'pnpm preview:mock',
    url: 'http://localhost:4173',
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
