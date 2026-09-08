import { useCallback } from 'react';

import { useSettings } from '@/features/settings/store';
import { normalizePlaceId } from '@/shared/lib/geo';
import type { Place } from '@/shared/types/domain';

import { fetchPlaceByCoords } from './api';
import { getCurrentPosition, type GeoResult } from './geolocation';
import { usePlaces } from './placesStore';

/**
 * Demande la position, remonte le `Place`, le fixe comme lieu courant et
 * l'ajoute aux favoris (brief §9.2). Gère les 3 états explicitement.
 */
export function useAcquireLocation(): () => Promise<GeoResult> {
  const language = useSettings((s) => s.language);
  const setCurrent = usePlaces((s) => s.setCurrent);
  const addFavorite = usePlaces((s) => s.addFavorite);
  const setGeoStatus = usePlaces((s) => s.setGeoStatus);

  return useCallback(async () => {
    setGeoStatus('requesting');
    const res = await getCurrentPosition();

    if (!res.ok) {
      setGeoStatus(res.reason === 'denied' ? 'denied' : 'unavailable');
      return res;
    }

    let place: Place;
    try {
      place = await fetchPlaceByCoords(res.lat, res.lon, language);
    } catch {
      place = {
        id: normalizePlaceId(res.lat, res.lon),
        name: 'Ma position',
        country: '',
        adminArea: null,
        lat: res.lat,
        lon: res.lon,
        timezone: 'UTC',
      };
    }

    setGeoStatus('granted');
    setCurrent(place);
    addFavorite(place);
    return res;
  }, [language, setCurrent, addFavorite, setGeoStatus]);
}
