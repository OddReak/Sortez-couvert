import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { isFollowingNow } from '@/features/time-ring/cursor';
import { useCursorEpoch } from '@/features/time-ring/useCursor';
import { nowSeconds } from '@/shared/lib/time';
import { usePrefersContrast } from '@/shared/lib/useMediaQuery';
import type { WeatherSnapshot } from '@/shared/types/domain';

import { selectConditions, type DisplayedConditions } from './useWeather';

const LiveCtx = createContext<DisplayedConditions | null>(null);

/**
 * Calcule les conditions au curseur UNE fois, et les diffuse par contexte.
 *
 * `children` est passé tel quel : quand le curseur bouge (≤ 11 Hz), seul ce
 * provider et ses CONSOMMATEURS de contexte se re-rendent — pas l'arbre entier
 * (brief §8.4).
 */
export function LiveConditionsProvider({
  snapshot,
  children,
}: {
  snapshot: WeatherSnapshot;
  children: ReactNode;
}) {
  const cursorEpoch = useCursorEpoch();
  const highContrast = usePrefersContrast();

  const conditions = useMemo(
    () =>
      selectConditions(
        snapshot,
        isFollowingNow() ? null : cursorEpoch,
        nowSeconds(),
        highContrast,
      ),
    [snapshot, cursorEpoch, highContrast],
  );

  return <LiveCtx.Provider value={conditions}>{children}</LiveCtx.Provider>;
}

export function useLiveConditions(): DisplayedConditions {
  const ctx = useContext(LiveCtx);
  if (!ctx) {
    throw new Error(
      'useLiveConditions doit être sous <LiveConditionsProvider>',
    );
  }
  return ctx;
}
