/**
 * Instant sélectionné sur l'axe temporel.
 *
 * Phase 2 : sélection discrète via la rangée d'heures (`HourStrip`).
 * Phase 4 : la bague pilotera ce même store, mais à 60 fps la valeur passera
 * par une ref lue dans `useFrame` — surtout pas un re-render global (brief §8.4).
 */
import { create } from 'zustand';

export type TimeSelectionState = {
  /** Instant affiché (secondes epoch). `null` = « suit maintenant ». */
  selectedEpoch: number | null;
  select: (epoch: number | null) => void;
  reset: () => void;
};

export const useTimeSelection = create<TimeSelectionState>((set) => ({
  selectedEpoch: null,
  select: (selectedEpoch) => {
    set({ selectedEpoch });
  },
  reset: () => {
    set({ selectedEpoch: null });
  },
}));
