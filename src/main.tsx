import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './shared/styles/theme.css';

import { App } from './app/App';
import { startMockServiceWorker } from './mocks/start';
import { registerServiceWorker } from './pwa/register';
import { lockPinchZoom } from './shared/lib/viewportLock';
import { syncViewportHeight } from './shared/lib/viewportHeight';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Élément racine #root introuvable dans index.html');
}

lockPinchZoom();
syncViewportHeight();

const root = createRoot(rootEl);

void startMockServiceWorker().then(() => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

  // Enregistrement du SW juste après le 1er rendu, mais hors du chemin critique
  // (léger délai pour ne pas peser sur le TBT initial — brief §12).
  // No-op en dev / build mock.
  window.setTimeout(() => void registerServiceWorker(), 800);
});
