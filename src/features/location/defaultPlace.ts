import type { Place } from '@/shared/types/domain';

/**
 * Lieu par défaut en attendant la géolocalisation (Phase 5).
 * En Phase 2, l'écran affiche toujours Paris.
 */
export const DEFAULT_PLACE: Place = {
  id: '48.8566,2.3522',
  name: 'Paris',
  country: 'France',
  adminArea: 'Île-de-France',
  lat: 48.8566,
  lon: 2.3522,
  timezone: 'Europe/Paris',
};
