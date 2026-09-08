import type { RequestHandler } from 'msw';

/**
 * Handlers MSW — vides en Phase 0.
 *
 * Phase 1 : mock des routes `/api/*` à partir des fixtures Foreca réelles
 * anonymisées (`tests/fixtures/`). En dev et en test, TOUT passe par MSW —
 * les appels réels sont réservés à la validation manuelle (brief §0.11 / §13).
 */
export const handlers: RequestHandler[] = [];
