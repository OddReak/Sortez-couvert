/**
 * Verrouille le zoom par pincement (et le zoom Ctrl/Cmd + molette) SANS toucher
 * au `<meta viewport>`.
 *
 * Pourquoi pas `user-scalable=no` / `maximum-scale=1` : cet attribut fait
 * échouer l'audit Lighthouse `meta-viewport` (a11y −0,10) et désactive aussi le
 * zoom d'accessibilité natif. Ici on n'intercepte que les gestes de zoom : le
 * Dynamic Type iOS et le zoom Réglages → Accessibilité restent fonctionnels.
 *
 * `touch-action: manipulation` (dans `theme.css`) couvre déjà le double-tap.
 *
 * @returns une fonction pour retirer les écouteurs (tests / hot-reload).
 */

/** Gestes de pincement WebKit/iOS — hors `DocumentEventMap` standard. */
const IOS_GESTURE_EVENTS = ['gesturestart', 'gesturechange', 'gestureend'];

export function lockPinchZoom(): () => void {
  const cleanups: (() => void)[] = [];

  if (typeof document !== 'undefined') {
    const prevent = (event: Event): void => {
      event.preventDefault();
    };
    const preventZoomWheel = (event: WheelEvent): void => {
      if (event.ctrlKey) event.preventDefault();
    };

    for (const type of IOS_GESTURE_EVENTS) {
      document.addEventListener(type, prevent);
      cleanups.push(() => {
        document.removeEventListener(type, prevent);
      });
    }
    document.addEventListener('wheel', preventZoomWheel, { passive: false });
    cleanups.push(() => {
      document.removeEventListener('wheel', preventZoomWheel);
    });
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
}
