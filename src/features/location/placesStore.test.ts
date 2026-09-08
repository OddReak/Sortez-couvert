import { beforeEach, describe, expect, it } from 'vitest';

import type { Place } from '@/shared/types/domain';

import { MAX_FAVORITES, usePlaces } from './placesStore';

const place = (id: string, name = id): Place => ({
  id,
  name,
  country: 'France',
  adminArea: null,
  lat: 48 + Number(id.length),
  lon: 2,
  timezone: 'Europe/Paris',
});

beforeEach(() => {
  usePlaces.setState({
    current: null,
    favorites: [],
    history: [],
    onboardingDone: false,
    geoStatus: 'idle',
  });
});

describe('favoris', () => {
  it('ajoute, refuse les doublons, plafonne à 8', () => {
    const { addFavorite } = usePlaces.getState();
    for (let i = 0; i < MAX_FAVORITES; i += 1) {
      expect(addFavorite(place(`v${String(i)}`))).toBe(true);
    }
    expect(addFavorite(place('v0'))).toBe(true); // doublon → ok, pas d'ajout
    expect(addFavorite(place('trop'))).toBe(false); // plein
    expect(usePlaces.getState().favorites).toHaveLength(MAX_FAVORITES);
  });

  it('toggle ajoute puis retire', () => {
    const { toggleFavorite } = usePlaces.getState();
    toggleFavorite(place('lyon'));
    expect(usePlaces.getState().isFavorite('lyon')).toBe(true);
    toggleFavorite(place('lyon'));
    expect(usePlaces.getState().isFavorite('lyon')).toBe(false);
  });

  it('réordonne', () => {
    const { addFavorite, reorderFavorites } = usePlaces.getState();
    addFavorite(place('a'));
    addFavorite(place('b'));
    addFavorite(place('c'));
    reorderFavorites(2, 0);
    expect(usePlaces.getState().favorites.map((f) => f.id)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('updateCurrentMeta rafraîchit le lieu courant et le favori', () => {
    const p = place('48.85,2.35', 'Ma position');
    usePlaces.getState().setCurrent(p);
    usePlaces.getState().addFavorite(p);
    usePlaces.getState().updateCurrentMeta({ ...p, name: 'Paris' });
    expect(usePlaces.getState().current?.name).toBe('Paris');
    expect(usePlaces.getState().favorites[0]?.name).toBe('Paris');
  });
});

describe('historique de recherche', () => {
  it('garde les 5 dernières, sans doublon, plus récent en tête', () => {
    const { addHistory } = usePlaces.getState();
    ['Paris', 'Lyon', 'Berlin', 'Rome', 'Oslo', 'Paris'].forEach(addHistory);
    expect(usePlaces.getState().history).toEqual([
      'Paris',
      'Oslo',
      'Rome',
      'Berlin',
      'Lyon',
    ]);
  });
});

describe('clearAll', () => {
  it('remet tout à zéro', () => {
    const s = usePlaces.getState();
    s.setCurrent(place('x'));
    s.addFavorite(place('x'));
    s.completeOnboarding();
    s.clearAll();
    expect(usePlaces.getState()).toMatchObject({
      current: null,
      favorites: [],
      onboardingDone: false,
    });
  });
});
