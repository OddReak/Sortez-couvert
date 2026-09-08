import { setupServer } from 'msw/node';

import { handlers } from './handlers';

/** Serveur MSW pour l'environnement de test (Vitest / jsdom). */
export const server = setupServer(...handlers);
