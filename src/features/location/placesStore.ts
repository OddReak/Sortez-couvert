/**
 * Lieux : lieu courant, favoris (≤ 8, réordonnables), historique de recherche
 * (brief §9.3 / §9.4). Persisté en **IndexedDB** (`idb-keyval`) — pas en
 * localStorage : ce sont des données à conserver, pas un cache (brief §2).
 */
import { del, get, set } from 'idb-keyval';
import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware';

import type { Place } from '@/shared/types/domain';

export const MAX_FAVORITES = 8;
const MAX_HISTORY = 5;

export type GeoStatus =
  'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

const idbStorage: StateStorage = {
  getItem: async (name) => (await get<string>(name)) ?? null,
  setItem: async (name, value) => {
    await set(name, value);
  },
  removeItem: async (name) => {
    await del(name);
  },
};

export type PlacesState = {
  current: Place | null;
  favorites: Place[];
  history: string[];
  onboardingDone: boolean;
  geoStatus: GeoStatus;
  hydrated: boolean;

  setCurrent: (place: Place) => void;
  updateCurrentMeta: (place: Place) => void;
  addFavorite: (place: Place) => boolean;
  removeFavorite: (id: string) => void;
  toggleFavorite: (place: Place) => void;
  reorderFavorites: (from: number, to: number) => void;
  isFavorite: (id: string) => boolean;
  addHistory: (query: string) => void;
  clearHistory: () => void;
  completeOnboarding: () => void;
  setGeoStatus: (status: GeoStatus) => void;
  clearAll: () => void;
};

export const usePlaces = create<PlacesState>()(
  persist(
    (setState, getState) => ({
      current: null,
      favorites: [],
      history: [],
      onboardingDone: false,
      geoStatus: 'idle',
      hydrated: false,

      setCurrent: (place) => {
        setState({ current: place });
      },

      updateCurrentMeta: (place) => {
        setState((s) => ({
          current: s.current?.id === place.id ? place : s.current,
          favorites: s.favorites.map((f) => (f.id === place.id ? place : f)),
        }));
      },

      addFavorite: (place) => {
        const { favorites } = getState();
        if (favorites.some((f) => f.id === place.id)) return true;
        if (favorites.length >= MAX_FAVORITES) return false;
        setState({ favorites: [...favorites, place] });
        return true;
      },

      removeFavorite: (id) => {
        setState((s) => ({
          favorites: s.favorites.filter((f) => f.id !== id),
        }));
      },

      toggleFavorite: (place) => {
        const { favorites, addFavorite, removeFavorite } = getState();
        if (favorites.some((f) => f.id === place.id)) removeFavorite(place.id);
        else addFavorite(place);
      },

      reorderFavorites: (from, to) => {
        setState((s) => {
          const next = [...s.favorites];
          const [moved] = next.splice(from, 1);
          if (moved) next.splice(to, 0, moved);
          return { favorites: next };
        });
      },

      isFavorite: (id) => getState().favorites.some((f) => f.id === id),

      addHistory: (query) => {
        const q = query.trim();
        if (!q) return;
        setState((s) => ({
          history: [q, ...s.history.filter((h) => h !== q)].slice(
            0,
            MAX_HISTORY,
          ),
        }));
      },

      clearHistory: () => {
        setState({ history: [] });
      },

      completeOnboarding: () => {
        setState({ onboardingDone: true });
      },

      setGeoStatus: (geoStatus) => {
        setState({ geoStatus });
      },

      clearAll: () => {
        setState({
          current: null,
          favorites: [],
          history: [],
          onboardingDone: false,
          geoStatus: 'idle',
        });
      },
    }),
    {
      name: 'terra.places',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({
        current: s.current,
        favorites: s.favorites,
        history: s.history,
        onboardingDone: s.onboardingDone,
        geoStatus: s.geoStatus === 'requesting' ? 'idle' : s.geoStatus,
      }),
      onRehydrateStorage: () => () => {
        usePlaces.setState({ hydrated: true });
      },
    },
  ),
);
