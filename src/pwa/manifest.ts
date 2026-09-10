import type { ManifestOptions } from 'vite-plugin-pwa';

/**
 * Manifeste PWA (brief §10.1). Extrait ici pour être vérifié par un test
 * (`tests/unit/manifest.test.ts`) en plus d'être consommé par `vite.config.ts`.
 *
 * Les `icons` sont ajoutés d'office par `@vite-pwa/assets-generator`
 * (`pwaAssets: { config: true }`) : 192/512 + maskable 512.
 */
export const pwaManifest: Partial<ManifestOptions> = {
  id: '/',
  name: 'Terra weather',
  // Nom sous l'icône une fois installée (Android/Chrome) — iOS prend
  // `apple-mobile-web-app-title` dans index.html, aligné dessus.
  short_name: 'Terra weather',
  description:
    'Tournez le temps, voyez votre monde changer. La météo sur un globe.',
  start_url: '/?source=pwa',
  scope: '/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#f8f9fa',
  theme_color: '#f8f9fa',
  lang: 'fr',
  dir: 'ltr',
  categories: ['weather'],
  shortcuts: [
    { name: 'Ma position', url: '/?source=pwa&shortcut=locate' },
    { name: 'Favoris', url: '/?source=pwa&shortcut=favorites' },
  ],
};
