import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource-variable/inter';
import './shared/styles/theme.css';

import { App } from './app/App';
import { startMockServiceWorker } from './mocks/start';
import { registerServiceWorker } from './pwa/register';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Élément racine #root introuvable dans index.html');
}

const root = createRoot(rootEl);

void startMockServiceWorker().then(() => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  // Après le premier render : n'entre jamais en concurrence avec MSW (no-op en
  // dev / build mock).
  void registerServiceWorker();
});
