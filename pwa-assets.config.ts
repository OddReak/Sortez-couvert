import {
  AllAppleDeviceNames,
  createAppleSplashScreens,
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config';

/**
 * Icônes PWA + écrans de lancement iOS, générés au build par `vite-plugin-pwa`
 * (`pwaAssets: { config: true }`) depuis `public/pwa-source.svg` — marque Terra
 * (globe + terminateur), dessinée à partir des tokens de
 * `src/shared/styles/theme.css`. Fichiers non commités.
 *
 * Régénération manuelle : `pnpm generate:pwa-assets`.
 */

// L'app est verrouillée en portrait et ciblée iPhone : on écarte les iPad.
const iphoneDevices = AllAppleDeviceNames.filter((name) =>
  name.startsWith('iPhone'),
);

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    appleSplashScreens: createAppleSplashScreens(
      {
        padding: 0.3,
        resizeOptions: { background: '#f8f9fa', fit: 'contain' },
        darkResizeOptions: { background: '#0b0f19', fit: 'contain' },
        linkMediaOptions: { log: false, addMediaScreen: true, xhtml: false },
      },
      iphoneDevices,
    ),
  },
  images: ['public/pwa-source.svg'],
});
