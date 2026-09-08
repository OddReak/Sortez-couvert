import '@testing-library/jest-dom/vitest';

import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from '@/mocks/node';

// Toute requête non interceptée en test = erreur : on ne touche jamais le
// réseau réel dans la suite unitaire (brief §0.11).
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});
