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
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
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

  // — Fichiers de config JS (pas de projet TS) —
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: { ...globals.node } },
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

  // — Tests unitaires —
  {
    files: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },

  prettier,
);
