/// <reference lib="webworker" />

/**
 * Service worker Terra (brief §10.3). Écrit à la main (`injectManifest`) pour
 * garder le contrôle : `skipWaiting` n'est jamais automatique — la mise à jour
 * est déclenchée par l'utilisateur via le toast (`src/pwa/register.ts`).
 *
 * ⚠️ Absent des builds `mode: 'mock'` : là, MSW sert son propre SW.
 */
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import {
  CacheFirst,
  NetworkFirst,
  StaleWhileRevalidate,
} from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

// Précache l'app shell (JS/CSS/HTML/polices/manifest) injecté au build.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Navigations hors ligne → index.html précaché (jamais d'écran blanc, §9.11).
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/api\//],
  }),
);

// Chunks chargés à la demande (three.js du globe) : hors précache, mais
// disponibles hors ligne après une première visite.
registerRoute(
  ({ url, sameOrigin }) =>
    sameOrigin && /\/assets\/.*\.(?:js|css)$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'terra-lazy-assets',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 40,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  }),
);

// Textures du globe : lourdes et immuables → CacheFirst 30 j.
registerRoute(
  ({ url }) => url.pathname.startsWith('/textures/'),
  new CacheFirst({
    cacheName: 'terra-textures',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 12,
        maxAgeSeconds: 30 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

// Polices Google (si jamais utilisées) → CacheFirst 30 j.
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'terra-fonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 8, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  }),
);

// Proxy météo : NetworkFirst, bascule sur le cache après 3 s. Jamais d'erreur
// en cache (le repli « données du … » est géré côté app via IndexedDB).
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'terra-api',
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 }),
    ],
  }),
);

// Mise à jour contrôlée : le nouveau SW attend, le toast poste ce message.
self.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | null)?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

clientsClaim();
