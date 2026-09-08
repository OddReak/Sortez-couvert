import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

/** Worker MSW pour le développement (`vite dev`). Voir `src/mocks/start.ts`. */
export const worker = setupWorker(...handlers);
