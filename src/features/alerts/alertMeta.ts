/**
 * Alertes météo — mapping `significance` Foreca → présentation (brief §9.9).
 *
 * L'endpoint `warning` est hors du plan Foreca d'Audric (403) : en production
 * `warnings` est toujours `[]`. Ce module sert la maquette + le mock dev/e2e et
 * sera prêt si le plan évolue.
 */
import type {
  Warning,
  WarningColor,
  WarningSeverity,
} from '@/shared/types/domain';

export type AlertMeta = {
  /** Token `@theme` (bordure / pastille / barre latérale). */
  colorVar: string;
  /** Libellé FR du niveau — jamais porté par la seule couleur (a11y). */
  levelLabel: string;
  /** `polite` pour jaune/orange, `assertive` pour rouge/violet. */
  live: 'polite' | 'assertive';
};

const COLOR_TOKEN: Record<WarningColor, string> = {
  yellow: 'var(--color-warn-yellow)',
  orange: 'var(--color-warn-orange)',
  red: 'var(--color-warn-red)',
  violet: 'var(--color-warn-violet)',
};

const SEVERITY_COLOR: Record<WarningSeverity, WarningColor> = {
  minor: 'yellow',
  moderate: 'orange',
  severe: 'red',
  extreme: 'violet',
};

const COLOR_LEVEL_LABEL: Record<WarningColor, string> = {
  yellow: 'Vigilance jaune',
  orange: 'Vigilance orange',
  red: 'Vigilance rouge',
  violet: 'Vigilance violette',
};

/** Résout la couleur effective : `color` explicite, sinon dérivée du niveau. */
export function alertColor(warning: Warning): WarningColor {
  return warning.color ?? SEVERITY_COLOR[warning.severity ?? 'moderate'];
}

export function alertMeta(warning: Warning): AlertMeta {
  const color = alertColor(warning);
  return {
    colorVar: COLOR_TOKEN[color],
    levelLabel: COLOR_LEVEL_LABEL[color],
    live: color === 'red' || color === 'violet' ? 'assertive' : 'polite',
  };
}

/** Rang de gravité — pour trier / choisir l'alerte la plus grave à mettre en avant. */
const COLOR_RANK: Record<WarningColor, number> = {
  yellow: 0,
  orange: 1,
  red: 2,
  violet: 3,
};

export function mostSevere(warnings: Warning[]): Warning | null {
  return warnings.reduce<Warning | null>((worst, w) => {
    if (!worst) return w;
    return COLOR_RANK[alertColor(w)] > COLOR_RANK[alertColor(worst)]
      ? w
      : worst;
  }, null);
}
