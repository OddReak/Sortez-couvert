import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import type { PluginOption } from 'vite';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

import { pwaManifest } from './src/pwa/manifest.ts';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));

/**
 * Précharge la variable Inter (latin) — brief §12. Le nom du woff2 est hashé
 * au build : on le retrouve dans le bundle et on injecte le `<link rel=preload>`.
 */
function fontPreloadPlugin(): PluginOption {
  return {
    name: 'terra-font-preload',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const font = Object.keys(ctx.bundle ?? {}).find((name) =>
          /inter-latin-[^/]*\.woff2$/.test(name),
        );
        if (!font) return html;
        return {
          html,
          tags: [
            {
              tag: 'link',
              injectTo: 'head-prepend',
              attrs: {
                rel: 'preload',
                as: 'font',
                type: 'font/woff2',
                crossorigin: '',
                href: `/${font}`,
              },
            },
          ],
        };
      },
    },
  };
}

/**
 * Le mode `mock` (`pnpm build:mock`) sert MSW via son propre service worker
 * (`public/mockServiceWorker.js`) pour les e2e / Lighthouse. On n'active donc
 * PAS la PWA dans ce mode : deux service workers pour un même scope = conflit.
 */
function pwaPlugin(mode: string): PluginOption {
  return VitePWA({
    // En mode `mock`, MSW tient déjà le service worker (e2e / Lighthouse) :
    // le plugin est inerte mais `virtual:pwa-register` reste résolvable.
    disable: mode === 'mock',
    strategies: 'injectManifest',
    srcDir: 'src/pwa',
    filename: 'sw.ts',
    injectRegister: false,
    registerType: 'prompt',
    devOptions: { enabled: false },
    injectManifest: {
      // App shell + polices + icônes seulement (brief §10.3). Le gros chunk
      // three.js (`GlobeCanvas`, ~890 ko) et les textures restent en cache
      // runtime — pas dans le précache d'installation.
      // `manifest.webmanifest` est ajouté d'office par le plugin — ne pas le
      // reprendre dans les globs (sinon `add-to-cache-list-conflicting-entries`).
      globPatterns: ['**/*.{css,html,woff2}', 'assets/index-*.js'],
      globIgnores: ['**/stats.html'],
      manifestTransforms: [
        (entries) => ({
          manifest: entries.filter(
            (e) => !/(?:GlobeCanvas|Globe|workbox)-[^/]+\.js$/.test(e.url),
          ),
          warnings: [],
        }),
      ],
    },
    pwaAssets: { config: true },
    manifest: pwaManifest,
  });
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    fontPreloadPlugin(),
    pwaPlugin(mode),
    visualizer({
      // Hors `dist/` : sinon Lighthouse CI (staticDistDir) l'audite aussi et le
      // gros HTML du treemap plombe le score.
      filename: 'stats.html',
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
    }),
  ],
  resolve: {
    alias: {
      '@': srcDir,
    },
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
  build: {
    // Sourcemaps publiées (projet privé) : debug prod + audit Lighthouse
    // `valid-source-maps`. Non chargées par le navigateur hors devtools.
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./tests/setup.ts'],
    css: false,
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'api/**/*.{test,spec}.ts',
      'tests/unit/**/*.{test,spec}.{ts,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Élargi phase par phase. Le brief exige ≥ 85 % sur src/shared/lib (§19.11).
      include: ['src/shared/lib/**/*.ts', 'api/_lib/**/*.ts'],
      exclude: ['**/*.{test,spec}.ts', '**/index.ts', '**/*.d.ts'],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
  },
}));
