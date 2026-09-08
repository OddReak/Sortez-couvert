import { useRef, type PointerEvent as ReactPointerEvent } from 'react';

import { usePlaces } from './placesStore';

const THRESHOLD = 60;

/**
 * Navigation entre favoris par swipe horizontal (brief §9.4).
 * Renvoie des props `onPointerDown/Move/Up` à étaler sur un conteneur.
 */
export function useSwipePlaces() {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: ReactPointerEvent): void => {
    if (e.pointerType === 'mouse') return;
    start.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: ReactPointerEvent): void => {
    const s = start.current;
    start.current = null;
    if (!s) return;

    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) < THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return;

    const { favorites, current, setCurrent } = usePlaces.getState();
    if (favorites.length < 2 || !current) return;
    const idx = favorites.findIndex((f) => f.id === current.id);
    if (idx < 0) return;

    const nextIdx =
      dx < 0
        ? (idx + 1) % favorites.length
        : (idx - 1 + favorites.length) % favorites.length;
    const next = favorites[nextIdx];
    if (next) setCurrent(next);
  };

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel: () => (start.current = null),
  };
}
