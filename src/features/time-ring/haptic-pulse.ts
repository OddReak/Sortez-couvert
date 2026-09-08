/**
 * Compensation visuelle du retour haptique (brief §8.5.2).
 *
 * Sur iOS, `navigator.vibrate` n'existe pas : au lieu d'une vibration, la
 * graduation franchie fait une micro-impulsion d'échelle (1 → 1.06 → 1) sur
 * ~120 ms. Piloté en dehors de React (pas de re-render par cran).
 */
export function pulseGraduation(el: SVGElement | null): void {
  if (!el) return;
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }
  el.animate(
    [
      { transform: 'scale(1)', opacity: '1' },
      { transform: 'scale(1.6)', opacity: '1', offset: 0.35 },
      { transform: 'scale(1)', opacity: '0.85' },
    ],
    { duration: 120, easing: 'ease-out' },
  );
}
