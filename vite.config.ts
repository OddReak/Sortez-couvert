import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vitest/config';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: 'dist/stats.html',
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
    sourcemap: false,
    // Le chunk `three` sera isolé en Phase 3 (brief §7.4 / §12).
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
      exclude: [
        '**/*.{test,spec}.ts',
        '**/index.ts',
        '**/*.d.ts',
        'api/_lib/schemas.ts',
        'api/_lib/normalize.ts',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
  },
});
