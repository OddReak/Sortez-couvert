/**
 * Réglages utilisateur (brief §9.10) — persistés en localStorage (données
 * légères ; les favoris volumineux iront en IndexedDB en Phase 5).
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Units } from '@/shared/types/domain';

export type ThemeOverride = 'auto' | 'light' | 'dark';
export type Language = 'fr' | 'en';

export type SettingsState = {
  units: Units;
  themeOverride: ThemeOverride;
  language: Language;
  /** Alternative non gestuelle à la bague, forcée (brief §8.6). */
  nonGesturalTimeControl: boolean;
  /** Tick sonore de la bague — désactivé par défaut (brief §8.5). */
  soundTick: boolean;
  setTempUnit: (temp: Units['temp']) => void;
  setWindUnit: (wind: Units['wind']) => void;
  setThemeOverride: (value: ThemeOverride) => void;
  setLanguage: (value: Language) => void;
  toggleNonGesturalTimeControl: () => void;
  toggleSoundTick: () => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      units: { temp: 'C', wind: 'KMH' },
      themeOverride: 'auto',
      language: 'fr',
      nonGesturalTimeControl: false,
      soundTick: false,
      setTempUnit: (temp) => {
        set((s) => ({ units: { ...s.units, temp } }));
      },
      setWindUnit: (wind) => {
        set((s) => ({ units: { ...s.units, wind } }));
      },
      setThemeOverride: (themeOverride) => {
        set({ themeOverride });
      },
      setLanguage: (language) => {
        set({ language });
      },
      toggleNonGesturalTimeControl: () => {
        set((s) => ({ nonGesturalTimeControl: !s.nonGesturalTimeControl }));
      },
      toggleSoundTick: () => {
        set((s) => ({ soundTick: !s.soundTick }));
      },
    }),
    { name: 'terra.settings', version: 1 },
  ),
);
