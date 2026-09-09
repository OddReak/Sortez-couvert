import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dist-mock/**',
      'dev-dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'public/mockServiceWorker.js',
      'stats.html',
      '**/*.d.ts',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        project: [
          './tsconfig.app.json',
          './tsconfig.node.json',
          './tsconfig.worker.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Le modèle de domaine (brief §4.5) est écrit avec `type` : on l'assume.
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // — Fichiers de config JS + config d'outil hors projet TS —
  {
    files: ['**/*.{js,mjs,cjs}', 'pwa-assets.config.ts'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { project: null, projectService: false },
    },
  },

  // — Front React (navigateur) —
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    settings: { react: { version: 'detect' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/prop-types': 'off',
      // Le navigateur ne doit jamais appeler Foreca en direct (brief §4.3 / §20).
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/weatherapi\\.foreca\\.net/], TemplateElement[value.raw=/weatherapi\\.foreca\\.net/]',
          message:
            'Appel direct à Foreca interdit côté client (brief §4.3). Passe par /api/*.',
        },
      ],
    },
  },

  // — Node (scripts, api, e2e, configs TS) —
  {
    files: [
      'scripts/**/*.{js,mjs,ts}',
      'api/**/*.ts',
      'tests/e2e/**/*.ts',
      '*.config.ts',
    ],
    languageOptions: { globals: { ...globals.node } },
  },

  // — Service worker : contexte WebWorker, pas de React —
  {
    files: ['src/pwa/sw.ts'],
    languageOptions: { globals: { ...globals.serviceworker } },
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // — Mocks MSW : doivent nommer l'URL Foreca pour l'intercepter —
  {
    files: ['src/mocks/**/*.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },

  // — Globe R3F : les props three.js (`args`, `material`, `intensity`…) ne
  //   sont pas des attributs DOM. —
  {
    files: ['src/features/globe/**/*.tsx'],
    rules: { 'react/no-unknown-property': 'off' },
  },

  // — Tests unitaires —
  {
    files: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'api/**/*.{test,spec}.ts',
      'tests/**/*.ts',
    ],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      // Les mocks (`vi.fn()`, réponses factices) sont typés `any` par nature.
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },

  prettier,
);
