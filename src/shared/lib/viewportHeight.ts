/**
 * Hauteur de la coquille = hauteur réelle du viewport, publiée dans
 * `--app-vh` (px) sur `<html>`.
 *
 * Pourquoi : sur iOS en PWA installée, `100dvh` et `env(safe-area-inset-*)` ne
 * sont pas fiables au tout premier rendu — la valeur se fige trop courte, d'où
 * un vide en bas de l'écran et des textes qui se chevauchent, jusqu'à ce
 * qu'une rotation force un recalcul. On force ce recalcul nous-mêmes : lecture
 * de `window.innerHeight` (viewport de mise en page, stable — il ne bouge pas
 * quand le clavier s'ouvre, contrairement à `visualViewport`) au chargement
 * puis à chaque changement de taille / d'orientation.
 *
 * `theme.css` : `@utility app-h { height: var(--app-vh, 100dvh) }` — le
 * `100dvh` reste le repli avant le premier calcul et hors navigateur.
 *
 * @returns une fonction pour retirer les écouteurs (tests / hot-reload).
 */
export function syncViewportHeight(): () => void {
  const noop = (): void => {
    /* hors navigateur : rien à synchroniser */
  };
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return noop;
  }

  const apply = (): void => {
    document.documentElement.style.setProperty(
      '--app-vh',
      `${String(window.innerHeight)}px`,
    );
  };

  apply();
  // iOS fige parfois une valeur trop courte au 1er rendu : on repasse sur les
  // frames suivantes, une fois la barre d'état et les safe areas stabilisées.
  const raf1 = window.requestAnimationFrame(() => {
    apply();
    window.requestAnimationFrame(apply);
  });

  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', apply);
  window.addEventListener('pageshow', apply);

  return () => {
    window.cancelAnimationFrame(raf1);
    window.removeEventListener('resize', apply);
    window.removeEventListener('orientationchange', apply);
    window.removeEventListener('pageshow', apply);
  };
}
