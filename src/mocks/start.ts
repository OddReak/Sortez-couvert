/**
 * Démarre MSW dans le navigateur.
 *
 * - `vite dev` : actif par défaut (aucun appel réseau réel — brief §0.11/§13).
 * - build : inactif, SAUF si `VITE_ENABLE_MOCKS=true` (preview e2e / Lighthouse).
 * - `VITE_USE_REAL_API=true` : désactive MSW pour tester le vrai proxy.
 */
export async function startMockServiceWorker(): Promise<void> {
  const enabled =
    import.meta.env.VITE_USE_REAL_API !== 'true' &&
    (import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCKS === 'true');

  if (!enabled) return;

  const { worker } = await import('./browser');
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true });

  const { seedMockPlace } = await import('./seed');
  seedMockPlace();
}
