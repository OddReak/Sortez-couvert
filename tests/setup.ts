import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import { server } from '@/mocks/node';

// `globals: false` : le nettoyage auto de Testing Library ne s'enregistre pas.
afterEach(() => {
  cleanup();
});

// jsdom n'implémente pas `matchMedia` — stub par défaut « ne correspond pas »
// (aucune préférence système). Les tests peuvent le remplacer si besoin.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

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
