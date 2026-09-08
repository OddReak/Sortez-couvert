import { LocationGate } from '@/features/location/LocationGate';

import { AppProviders } from './providers';
import { HomeScreen } from './screens/HomeScreen';

export function App() {
  return (
    <AppProviders>
      <LocationGate>
        <HomeScreen />
      </LocationGate>
    </AppProviders>
  );
}
