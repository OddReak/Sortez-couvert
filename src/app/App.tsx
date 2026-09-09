import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

import { LocationGate } from '@/features/location/LocationGate';
import { UpdatePrompt } from '@/pwa/UpdatePrompt';

import { AppProviders } from './providers';
import { useRoute } from './router';
import { HelpPage } from './screens/HelpPage';
import { HomeScreen } from './screens/HomeScreen';
import { PrivacyPage } from './screens/PrivacyPage';

/** Analytics Vercel — uniquement en build réel (pas de bruit en e2e / Lighthouse). */
const analyticsEnabled =
  import.meta.env.PROD && import.meta.env.VITE_ENABLE_MOCKS !== 'true';

function Routes() {
  const path = useRoute();
  if (path === '/confidentialite') return <PrivacyPage />;
  if (path === '/aide') return <HelpPage />;
  return (
    <LocationGate>
      <HomeScreen />
    </LocationGate>
  );
}

export function App() {
  return (
    <AppProviders>
      <Routes />
      <UpdatePrompt />
      {analyticsEnabled ? (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      ) : null}
    </AppProviders>
  );
}
