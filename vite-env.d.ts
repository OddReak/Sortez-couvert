/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Active MSW dans un build (preview e2e, Lighthouse). */
  readonly VITE_ENABLE_MOCKS?: string;
  /** Désactive MSW pour taper le vrai proxy `/api/*` (avec `vercel dev`). */
  readonly VITE_USE_REAL_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
