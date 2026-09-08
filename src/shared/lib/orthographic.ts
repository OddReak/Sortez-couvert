/**
 * Projection orthographique de la Terre — utilisée par le fallback 2D du globe
 * (brief §7.5) et par ses tests. Pur, sans three.js.
 *
 * Le fallback partage EXACTEMENT le code solaire du globe WebGL (`sun.ts`) : la
 * position de l'ombre est identique dans les deux rendus.
 */
import { isSunlit, latLonToVector3, subsolarPoint, type Vec3 } from './sun';

export type Point2D = { x: number; y: number; visible: boolean };

const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const norm = (v: Vec3): Vec3 => {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
};

export type ViewBasis = { east: Vec3; up: Vec3; view: Vec3 };

/** Repère caméra pour une vue centrée sur (lat, lon). */
export function viewBasis(
  centerLatDeg: number,
  centerLonDeg: number,
): ViewBasis {
  const view = latLonToVector3(centerLatDeg, centerLonDeg);
  const north: Vec3 = { x: 0, y: 1, z: 0 };
  const east = norm(cross(north, view));
  const up = cross(view, east);
  return { east, up, view };
}

/** Direction 3D → point écran (y vers le bas). `visible` = face avant. */
export function projectWithBasis(
  dir: Vec3,
  basis: ViewBasis,
  radius: number,
): Point2D {
  return {
    x: dot(dir, basis.east) * radius,
    y: -dot(dir, basis.up) * radius,
    visible: dot(dir, basis.view) >= 0,
  };
}

export function projectOrthographic(
  latDeg: number,
  lonDeg: number,
  centerLatDeg: number,
  centerLonDeg: number,
  radius: number,
): Point2D {
  return projectWithBasis(
    latLonToVector3(latDeg, lonDeg),
    viewBasis(centerLatDeg, centerLonDeg),
    radius,
  );
}

/**
 * Contour du terminateur projeté (le grand cercle où le soleil est à
 * l'horizon), échantillonné sur 360°. `visible` distingue face avant/arrière.
 */
export function terminatorPath(
  date: Date,
  centerLatDeg: number,
  centerLonDeg: number,
  radius: number,
  steps = 96,
): Point2D[] {
  const sub = subsolarPoint(date);
  const sun = latLonToVector3(sub.lat, sub.lon);

  // Deux vecteurs orthonormés au vecteur soleil (pôle du grand cercle).
  const ref: Vec3 =
    Math.abs(sun.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
  const u1 = norm(cross(sun, ref));
  const u2 = cross(sun, u1);

  const basis = viewBasis(centerLatDeg, centerLonDeg);
  const out: Point2D[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = (i / steps) * Math.PI * 2;
    const p: Vec3 = {
      x: u1.x * Math.cos(a) + u2.x * Math.sin(a),
      y: u1.y * Math.cos(a) + u2.y * Math.sin(a),
      z: u1.z * Math.cos(a) + u2.z * Math.sin(a),
    };
    out.push(projectWithBasis(p, basis, radius));
  }
  return out;
}

/**
 * Polygone (points écran) couvrant l'hémisphère de NUIT visible : arc du
 * terminateur visible + arc du limbe côté ombre. Prêt à remplir en SVG.
 * Vide si toute la face est éclairée ; disque entier si toute la face est nuit.
 */
export function nightRegion(
  date: Date,
  centerLatDeg: number,
  centerLonDeg: number,
  radius: number,
  steps = 256,
): Point2D[] {
  const sub = subsolarPoint(date);
  const sun = latLonToVector3(sub.lat, sub.lon);
  const basis = viewBasis(centerLatDeg, centerLonDeg);
  const centerLit = isSunlit(centerLatDeg, centerLonDeg, date, 0);

  const term = terminatorPath(
    date,
    centerLatDeg,
    centerLonDeg,
    radius,
    steps,
  ).filter((p) => p.visible);

  const termHugsLimb =
    term.length > 0 &&
    Math.min(...term.map((p) => Math.hypot(p.x, p.y))) >= radius * 0.999;

  if (term.length < 2 || (centerLit && termHugsLimb)) {
    if (centerLit) return [];
    return [
      { x: -radius, y: -radius, visible: true },
      { x: radius, y: -radius, visible: true },
      { x: radius, y: radius, visible: true },
      { x: -radius, y: radius, visible: true },
    ];
  }

  const first = term[0];
  const last = term[term.length - 1];
  if (!first || !last) return [];

  // Point du limbe à l'angle écran θ, et son statut « nuit ».
  const limbIsNight = (theta: number): boolean => {
    const dir: Vec3 = {
      x: Math.cos(theta) * basis.east.x - Math.sin(theta) * basis.up.x,
      y: Math.cos(theta) * basis.east.y - Math.sin(theta) * basis.up.y,
      z: Math.cos(theta) * basis.east.z - Math.sin(theta) * basis.up.z,
    };
    return dot(dir, sun) < 0;
  };

  const thetaFirst = Math.atan2(first.y, first.x);
  const thetaLast = Math.atan2(last.y, last.x);

  // On ferme par le limbe de thetaLast → thetaFirst, dans le sens qui passe
  // par l'ombre.
  const twoPi = Math.PI * 2;
  const ccwSpan = (thetaFirst - thetaLast + twoPi) % twoPi;
  const midCcw = thetaLast + ccwSpan / 2;
  const goCcw = limbIsNight(midCcw);

  const arc: Point2D[] = [];
  const span = goCcw ? ccwSpan : ccwSpan - twoPi;
  const segments = 48;
  const limbR = radius * 0.996; // léger retrait : évite le débord au clip SVG
  for (let k = 1; k < segments; k += 1) {
    const t = thetaLast + (span * k) / segments;
    arc.push({
      x: Math.cos(t) * limbR,
      y: Math.sin(t) * limbR,
      visible: true,
    });
  }

  return [...term, ...arc];
}

export { isSunlit, subsolarPoint };
