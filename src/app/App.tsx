import { Analytics } from '@vercel/analytics/react';

import { LocationGate } from '@/features/location/LocationGate';
import { UpdatePrompt } from '@/pwa/UpdatePrompt';

import { AppProviders } from './providers';
import { HomeScreen } from './screens/HomeScreen';

export function App() {
  return (
    <AppProviders>
      <LocationGate>
        <HomeScreen />
      </LocationGate>
      <UpdatePrompt />
      <Analytics />
    </AppProviders>
  );
}
