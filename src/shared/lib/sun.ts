/**
 * Position solaire — le cœur de crédibilité du globe (brief §7.2).
 *
 * Fonctions PURES, sans dépendance three.js, testables au degré près.
 * On calcule le **point subsolaire** (là où le soleil est au zénith) pour un
 * instant UTC, puis le vecteur directionnel du soleil dans le repère du globe.
 *
 * Repère du globe : +Y = pôle Nord · lon 0° → +Z · lon 90° E → +X.
 * (Cohérent avec `latLonToVector3` utilisé par la caméra et le shader.)
 *
 * Précision : formules « basse précision » (NOAA / Meeus abrégé), erreur
 * < 0,02° sur la déclinaison — largement suffisant pour un terminateur.
 */

const DEG = Math.PI / 180;
const J2000 = Date.UTC(2000, 0, 1, 12); // 2000-01-01 12:00 UTC

export type LatLon = { lat: number; lon: number };
export type Vec3 = { x: number; y: number; z: number };

const norm360 = (deg: number): number => ((deg % 360) + 360) % 360;
const norm180 = (deg: number): number => {
  const d = norm360(deg);
  return d > 180 ? d - 360 : d;
};

/** Jours (fractionnaires) depuis l'époque J2000.0. */
export function daysSinceJ2000(date: Date): number {
  return (date.getTime() - J2000) / 86_400_000;
}

type SolarCoords = {
  declinationDeg: number;
  rightAscensionDeg: number;
  meanLongitudeDeg: number;
};

function solarCoords(n: number): SolarCoords {
  const L = norm360(280.46 + 0.9856474 * n); // longitude moyenne
  const g = norm360(357.528 + 0.9856003 * n) * DEG; // anomalie moyenne
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * DEG; // longitude écliptique
  const epsilon = (23.439 - 0.0000004 * n) * DEG; // obliquité

  const declination = Math.asin(Math.sin(epsilon) * Math.sin(lambda)) / DEG;
  const rightAscension =
    Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda)) / DEG;

  return {
    declinationDeg: declination,
    rightAscensionDeg: norm360(rightAscension),
    meanLongitudeDeg: L,
  };
}

/** Temps sidéral moyen de Greenwich (degrés). */
function gmstDeg(n: number): number {
  return norm360(280.46061837 + 360.98564736629 * n);
}

/** Écart au temps solaire moyen (minutes). */
export function equationOfTimeMinutes(date: Date): number {
  const { meanLongitudeDeg, rightAscensionDeg } = solarCoords(
    daysSinceJ2000(date),
  );
  return norm180(meanLongitudeDeg - rightAscensionDeg) * 4;
}

/** Déclinaison solaire (degrés) — l'inclinaison saisonnière réelle (§7.2). */
export function solarDeclination(date: Date): number {
  return solarCoords(daysSinceJ2000(date)).declinationDeg;
}

/**
 * Point de la Terre où le soleil est exactement au zénith à `date`.
 * `lat` ≈ déclinaison ; `lon` suit la rotation terrestre.
 */
export function subsolarPoint(date: Date): LatLon {
  const n = daysSinceJ2000(date);
  const { declinationDeg, rightAscensionDeg } = solarCoords(n);
  return {
    lat: declinationDeg,
    lon: norm180(rightAscensionDeg - gmstDeg(n)),
  };
}

/** Vecteur unité (lat, lon) → repère du globe. */
export function latLonToVector3(latDeg: number, lonDeg: number): Vec3 {
  const lat = latDeg * DEG;
  const lon = lonDeg * DEG;
  return {
    x: Math.cos(lat) * Math.sin(lon),
    y: Math.sin(lat),
    z: Math.cos(lat) * Math.cos(lon),
  };
}

/** Direction unité du soleil dans le repère du globe, pour le shader. */
export function sunDirection(date: Date): Vec3 {
  const { lat, lon } = subsolarPoint(date);
  return latLonToVector3(lat, lon);
}

/**
 * La localisation (lat, lon) est-elle éclairée à `date` ?
 * `twilightDeg` élargit la zone éclairée sous l'horizon : 0 = horizon
 * géométrique, ~6 = crépuscule civil (le globe utilise ~6 pour un terminateur
 * doux, brief §7.1).
 */
export function isSunlit(
  latDeg: number,
  lonDeg: number,
  date: Date,
  twilightDeg = 0,
): boolean {
  const surface = latLonToVector3(latDeg, lonDeg);
  const sun = sunDirection(date);
  const dot = surface.x * sun.x + surface.y * sun.y + surface.z * sun.z;
  return dot > -Math.sin(twilightDeg * DEG);
}
