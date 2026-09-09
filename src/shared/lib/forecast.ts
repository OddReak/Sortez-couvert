/**
 * Prévisions journalières — helpers d'affichage (brief §9.7).
 */
import type { ForecastConfidence } from '@/shared/types/domain';

export type ConfidenceMeta = {
  /** Libellé FR pour le lecteur d'écran (jamais porté par la seule couleur). */
  label: string;
  /** Token `@theme` de la pastille. */
  colorVar: string;
  /** 1 = fiable, 3 = incertain — pour un rendu en points pleins/vides. */
  level: 1 | 2 | 3;
};

const META: Record<ForecastConfidence, ConfidenceMeta> = {
  g: { label: 'Prévision fiable', colorVar: 'var(--color-ok)', level: 1 },
  y: {
    label: 'Fiabilité moyenne',
    colorVar: 'var(--color-warn-yellow)',
    level: 2,
  },
  o: {
    label: 'Prévision incertaine',
    colorVar: 'var(--color-warn-orange)',
    level: 3,
  },
};

export function confidenceMeta(
  confidence: ForecastConfidence | null,
): ConfidenceMeta | null {
  return confidence ? META[confidence] : null;
}
