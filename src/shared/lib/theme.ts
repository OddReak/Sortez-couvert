/**
 * Sélection du thème selon l'heure locale de la ville affichée (brief §5.2).
 *
 * Le thème NE suit PAS le réglage système : il suit l'instant sélectionné sur
 * la bague et le lever/coucher du soleil du jour concerné. Un override manuel
 * (Auto / Clair / Sombre) est géré séparément dans le store de réglages.
 *
 * ── Contrainte d'accessibilité (brief §11, testée) ────────────────────────
 * Le texte doit garder ≥ 4.5:1 sur son fond, y compris pendant les
 * transitions aube/crépuscule. On y parvient ainsi :
 *   - le fond « ambiant » (décoratif, plein écran) peut être un dégradé ;
 *   - le texte repose sur une COULEUR DE SURFACE dérivée qui bascule
 *     franchement autour du milieu de transition (dayness 0.5), en même temps
 *     que la couleur d'encre — jamais de demi-teinte illisible.
 */
import { mixHex, contrastRatio, relativeLuminance } from '@/shared/lib/color';

export type ThemeMode = 'day' | 'night' | 'dawn' | 'dusk';
export type ColorScheme = 'light' | 'dark';

export type ThemePaint = {
  mode: ThemeMode;
  /** 0 = pleine nuit, 1 = plein jour. */
  dayness: number;
  scheme: ColorScheme;
  /** Fond ambiant plein écran (couleur ou dégradé CSS). */
  ambient: string;
  /** Couleur de surface sous le texte (unie, contraste garanti). */
  surface: string;
  /** Couleur d'encre (texte) garantissant ≥ 4.5:1 sur `surface`. */
  ink: string;
  /** Couleur unie pour `<meta name="theme-color">` (barre d'état iOS). */
  themeColor: string;
};

// Tokens (miroir de src/shared/styles/theme.css §5.1)
const BG_DAY = '#f8f9fa';
const BG_NIGHT = '#0b0f19';
const INK_LIGHT = '#1f2937';
const INK_DARK = '#f8f9fa';
const DAWN_FROM = '#fbcfa0';
const DAWN_TO = '#6e63a8';
const DUSK_FROM = '#f59e0b';
const DUSK_TO = '#312e81';

// Surfaces de texte : assez sombres / claires pour tenir 4.5:1 avec l'encre.
const SURFACE_NIGHT = '#0b0f19';
const SURFACE_DUSK = '#161335'; // indigo très sombre
const SURFACE_DAWN = '#241a33'; // prune très sombre
const SURFACE_DAY = '#f8f9fa';

const TRANSITION_SECONDS = 45 * 60; // ± 45 min autour du lever/coucher

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/** Rampe douce 0→1 (smoothstep). */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export type ResolveThemeInput = {
  /** Instant sélectionné (secondes epoch). */
  atSeconds: number;
  /** Lever/coucher du jour concerné (secondes epoch), ou null si inconnu. */
  sunriseSeconds: number | null;
  sunsetSeconds: number | null;
};

/**
 * Repli quand on n'a pas les éphémérides : heuristique par heure locale.
 * `hourOfDay` ∈ [0, 24).
 */
function resolveByHour(hourOfDay: number): ThemePaint {
  if (hourOfDay < 5 || hourOfDay >= 21) return paint(0, 'night');
  if (hourOfDay >= 8 && hourOfDay < 18) return paint(1, 'day');
  if (hourOfDay < 8) return paint(smoothstep(5, 8, hourOfDay), 'dawn');
  return paint(smoothstep(21, 18, hourOfDay), 'dusk');
}

export function resolveTheme(input: ResolveThemeInput): ThemePaint {
  const { atSeconds, sunriseSeconds, sunsetSeconds } = input;

  if (sunriseSeconds === null || sunsetSeconds === null) {
    // Repli grossier sans éphémérides : heure UTC (le proxy fournit
    // normalement sunrise/sunsetEpoch, ce chemin est rare).
    const hour = (((atSeconds % 86_400) + 86_400) % 86_400) / 3600;
    return resolveByHour(hour);
  }

  const dawnStart = sunriseSeconds - TRANSITION_SECONDS;
  const dawnEnd = sunriseSeconds + TRANSITION_SECONDS;
  const duskStart = sunsetSeconds - TRANSITION_SECONDS;
  const duskEnd = sunsetSeconds + TRANSITION_SECONDS;

  if (atSeconds >= dawnStart && atSeconds <= dawnEnd) {
    return paint(smoothstep(dawnStart, dawnEnd, atSeconds), 'dawn');
  }
  if (atSeconds >= duskStart && atSeconds <= duskEnd) {
    return paint(smoothstep(duskEnd, duskStart, atSeconds), 'dusk');
  }
  if (atSeconds > dawnEnd && atSeconds < duskStart) {
    return paint(1, 'day');
  }
  return paint(0, 'night');
}

function paint(daynessRaw: number, mode: ThemeMode): ThemePaint {
  const dayness = clamp01(daynessRaw);
  const scheme: ColorScheme = dayness < 0.5 ? 'dark' : 'light';

  // Fond ambiant : dégradé pendant aube/crépuscule, uni sinon.
  let ambient: string;
  let themeColor: string;
  if (mode === 'dawn') {
    ambient = `linear-gradient(180deg, ${mixHex(BG_NIGHT, DAWN_TO, dayness)} 0%, ${mixHex(DAWN_TO, DAWN_FROM, dayness)} 100%)`;
    themeColor = mixHex(BG_NIGHT, DAWN_FROM, dayness);
  } else if (mode === 'dusk') {
    ambient = `linear-gradient(180deg, ${mixHex(BG_NIGHT, DUSK_TO, dayness)} 0%, ${mixHex(DUSK_TO, DUSK_FROM, dayness)} 100%)`;
    themeColor = mixHex(BG_NIGHT, DUSK_FROM, dayness);
  } else if (mode === 'day') {
    ambient = BG_DAY;
    themeColor = BG_DAY;
  } else {
    ambient = BG_NIGHT;
    themeColor = BG_NIGHT;
  }

  // Surface de texte : bascule franche au milieu de transition.
  let surface: string;
  if (scheme === 'dark') {
    surface =
      mode === 'dawn'
        ? SURFACE_DAWN
        : mode === 'dusk'
          ? SURFACE_DUSK
          : SURFACE_NIGHT;
  } else {
    surface = SURFACE_DAY;
  }
  const ink = scheme === 'dark' ? INK_DARK : INK_LIGHT;

  return { mode, dayness, scheme, ambient, surface, ink, themeColor };
}

/** Vérifie qu'une surface tient le contraste minimal avec son encre. */
export function surfacePassesAA(paintResult: ThemePaint): boolean {
  return contrastRatio(paintResult.surface, paintResult.ink) >= 4.5;
}

/** Thème figé par un override manuel Clair / Sombre (brief §5.2). */
export function forcedPaint(scheme: ColorScheme): ThemePaint {
  return scheme === 'dark'
    ? {
        mode: 'night',
        dayness: 0,
        scheme,
        ambient: BG_NIGHT,
        surface: SURFACE_NIGHT,
        ink: INK_DARK,
        themeColor: BG_NIGHT,
      }
    : {
        mode: 'day',
        dayness: 1,
        scheme,
        ambient: BG_DAY,
        surface: SURFACE_DAY,
        ink: INK_LIGHT,
        themeColor: BG_DAY,
      };
}

export { relativeLuminance };
