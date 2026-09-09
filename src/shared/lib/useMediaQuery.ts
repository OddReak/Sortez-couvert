import { useCallback, useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void): (() => void) => {
      const noop = (): void => undefined;
      if (typeof window === 'undefined') return noop;
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => {
        mql.removeEventListener('change', onChange);
      };
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
    () => false,
  );
}

export const usePrefersReducedMotion = (): boolean =>
  useMediaQuery('(prefers-reduced-motion: reduce)');

export const usePrefersContrast = (): boolean =>
  useMediaQuery('(prefers-contrast: more)');
