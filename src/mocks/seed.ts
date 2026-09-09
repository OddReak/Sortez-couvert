import { usePlaces } from '@/features/location/placesStore';
import type { Place } from '@/shared/types/domain';

const PARIS: Place = {
  id: '48.8566,2.3522',
  name: 'Paris',
  country: 'France',
  adminArea: 'Île-de-France',
  lat: 48.8566,
  lon: 2.3522,
  timezone: 'Europe/Paris',
};

/**
 * En mode mock (dev / e2e), on saute l'onboarding et on part sur Paris — sauf :
 *  - `?onboarding=1` : garde l'onboarding (parcours de permission) ;
 *  - `?choose=1` : onboarding fait mais aucun lieu → écran « Choisir un lieu ».
 */
export function seedMockPlace(): void {
  const params =
    typeof window === 'undefined'
      ? new URLSearchParams()
      : new URLSearchParams(window.location.search);

  if (params.has('onboarding')) {
    usePlaces.setState({ hydrated: true });
    return;
  }
  if (params.has('choose')) {
    usePlaces.setState({ onboardingDone: true, hydrated: true });
    return;
  }
  const s = usePlaces.getState();
  if (!s.current) {
    usePlaces.setState({
      current: PARIS,
      favorites: s.favorites.length ? s.favorites : [PARIS],
      onboardingDone: true,
      geoStatus: 'granted',
    });
  }
  usePlaces.setState({ hydrated: true });
}
