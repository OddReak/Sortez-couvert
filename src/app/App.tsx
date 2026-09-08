import { AppProviders } from './providers';
import { HomeScreen } from './screens/HomeScreen';

export function App() {
  return (
    <AppProviders>
      <HomeScreen />
    </AppProviders>
  );
}
