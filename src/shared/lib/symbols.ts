/**
 * Décodage des codes symbole Foreca (brief §4.4).
 *
 * Format : `d` (jour) ou `n` (nuit) + 3 chiffres `[couverture][intensité][type]`
 *   couverture : 0 clair · 1 majoritairement clair · 2 en partie nuageux
 *                3 nuageux · 4 couvert · 5 voile d'altitude · 6 brouillard
 *   intensité  : 0 aucune · 1 faible · 2 modérée · 3 forte
 *   type       : 0 pluie · 1 pluie et neige mêlées · 2 neige
 * (Exemples observés : d000 « clair », d100, d200, d210, d310, d400.)
 *
 * ⚠️ À recouper avec la table officielle du portail Foreca My API quand Audric
 * la fournit (checklist §18). En attendant, le décodeur est TOTAL : tout code
 * `dNNN`/`nNNN` bien formé donne une icône connue — jamais le cas par défaut.
 *
 * Le mapping icône → SVG filaire vit dans `src/shared/ui/WeatherIcon.tsx`.
 */

export type WeatherIconName =
  | 'clear-day'
  | 'clear-night'
  | 'partly-day'
  | 'partly-night'
  | 'cloudy'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy-rain'
  | 'sleet'
  | 'snow'
  | 'thunder';

export type DecodedSymbol = {
  icon: WeatherIconName;
  isNight: boolean;
  /** Vrai si le code n'était pas bien formé (icône de repli utilisée). */
  fallback: boolean;
};

const SYMBOL_RE = /^([dn])([0-6])([0-4])([0-3])$/;

export function decodeSymbol(code: string): DecodedSymbol {
  const match = SYMBOL_RE.exec(code.trim().toLowerCase());
  if (!match) {
    return {
      icon: 'cloudy',
      isNight: code.trim().toLowerCase().startsWith('n'),
      fallback: true,
    };
  }

  const isNight = match[1] === 'n';
  const cover = Number(match[2]);
  const intensity = Number(match[3]);
  const type = Number(match[4]);

  // Précipitations : prioritaires sur la couverture.
  if (intensity > 0) {
    if (intensity === 4) return { icon: 'thunder', isNight, fallback: false };
    if (type === 2) return { icon: 'snow', isNight, fallback: false };
    if (type === 1) return { icon: 'sleet', isNight, fallback: false };
    if (intensity >= 3) return { icon: 'heavy-rain', isNight, fallback: false };
    if (intensity === 1) return { icon: 'drizzle', isNight, fallback: false };
    return { icon: 'rain', isNight, fallback: false };
  }

  // Ciel sec.
  switch (cover) {
    case 0:
    case 1:
      return {
        icon: isNight ? 'clear-night' : 'clear-day',
        isNight,
        fallback: false,
      };
    case 2:
    case 5:
      return {
        icon: isNight ? 'partly-night' : 'partly-day',
        isNight,
        fallback: false,
      };
    case 3:
      return { icon: 'cloudy', isNight, fallback: false };
    case 4:
      return { icon: 'overcast', isNight, fallback: false };
    case 6:
      return { icon: 'fog', isNight, fallback: false };
    default:
      return { icon: 'cloudy', isNight, fallback: true };
  }
}

/** Toutes les icônes possibles — utile pour les stories / tests. */
export const WEATHER_ICON_NAMES: readonly WeatherIconName[] = [
  'clear-day',
  'clear-night',
  'partly-day',
  'partly-night',
  'cloudy',
  'overcast',
  'fog',
  'drizzle',
  'rain',
  'heavy-rain',
  'sleet',
  'snow',
  'thunder',
];
