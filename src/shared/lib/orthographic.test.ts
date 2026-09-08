import { describe, expect, it } from 'vitest';

import {
  nightRegion,
  projectOrthographic,
  terminatorPath,
} from './orthographic';
import { isSunlit, latLonToVector3, subsolarPoint } from './sun';

const R = 100;

describe('projectOrthographic', () => {
  it('place le centre de vue à l’origine', () => {
    const p = projectOrthographic(48.85, 2.35, 48.85, 2.35, R);
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.y).toBeCloseTo(0, 6);
    expect(p.visible).toBe(true);
  });

  it('met le nord vers le haut (y négatif)', () => {
    const p = projectOrthographic(58.85, 2.35, 48.85, 2.35, R);
    expect(p.y).toBeLessThan(0);
    expect(Math.abs(p.x)).toBeLessThan(1);
  });

  it('met l’est vers la droite (x positif)', () => {
    const p = projectOrthographic(48.85, 12.35, 48.85, 2.35, R);
    expect(p.x).toBeGreaterThan(0);
  });

  it('marque la face cachée comme non visible', () => {
    const antipode = projectOrthographic(-48.85, -177.65, 48.85, 2.35, R);
    expect(antipode.visible).toBe(false);
  });

  it('reste dans le disque de rayon R', () => {
    for (let lat = -80; lat <= 80; lat += 20) {
      for (let lon = -180; lon < 180; lon += 30) {
        const p = projectOrthographic(lat, lon, 20, 10, R);
        expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(R + 1e-6);
      }
    }
  });
});

describe('terminatorPath', () => {
  it('produit un contour fermé d’échantillons', () => {
    const path = terminatorPath(
      new Date('2026-09-08T12:00:00Z'),
      48.85,
      2.35,
      R,
      48,
    );
    expect(path).toHaveLength(49);
    expect(path.every((p) => Math.hypot(p.x, p.y) <= R + 1e-6)).toBe(true);
  });

  it('la distance minimale du terminateur au centre = sin(angle centre↔terminateur)', () => {
    const date = new Date('2026-09-08T12:00:00Z');
    const lat = 48.8566;
    const lon = 2.3522;

    const sub = subsolarPoint(date);
    const c = latLonToVector3(lat, lon);
    const s = latLonToVector3(sub.lat, sub.lon);
    const dotCS = c.x * s.x + c.y * s.y + c.z * s.z; // cos(angle centre↔soleil)
    const expected = R * Math.abs(dotCS); // = R·sin(angle centre↔terminateur)

    const visible = terminatorPath(date, lat, lon, R, 200).filter(
      (p) => p.visible,
    );
    const minDist = Math.min(...visible.map((p) => Math.hypot(p.x, p.y)));
    expect(minDist).toBeCloseTo(expected, 0);
  });

  it('à l’équinoxe, vu depuis le terminateur, l’ombre est une ligne verticale par les pôles', () => {
    const eq = new Date('2026-03-20T12:00:00Z');
    // Le point subsolaire est ~ (0°, EoT) ; on regarde 90° à l'est de lui.
    const path = terminatorPath(eq, 0, 89, R, 180).filter((p) => p.visible);
    expect(path.length).toBeGreaterThan(5);
    const maxX = Math.max(...path.map((p) => Math.abs(p.x)));
    const maxY = Math.max(...path.map((p) => Math.abs(p.y)));
    expect(maxX).toBeLessThan(15); // quasi vertical
    expect(maxY).toBeGreaterThan(R * 0.9); // atteint (presque) les pôles
  });
});

describe('nightRegion', () => {
  const R100 = 100;

  it('renvoie un polygone dont le contour tient dans le disque', () => {
    const region = nightRegion(
      new Date('2026-09-08T12:00:00Z'),
      48.8566,
      2.3522,
      R100,
    );
    expect(region.length).toBeGreaterThan(5);
    for (const p of region) {
      expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(R100 + 1e-6);
    }
  });

  it('le centre éclairé n’est PAS dans le polygone de nuit', () => {
    const date = new Date('2026-09-08T12:00:00Z');
    expect(isSunlit(48.8566, 2.3522, date, 0)).toBe(true);
    const region = nightRegion(date, 48.8566, 2.3522, R100);
    expect(pointInPolygon(0, 0, region)).toBe(false);
  });

  it('un point clairement dans l’ombre EST dans le polygone', () => {
    const date = new Date('2026-09-08T12:00:00Z');
    // Point à l'opposé du soleil, bien visible depuis Paris à cette heure.
    const dark = { lat: 40, lon: 120 };
    expect(isSunlit(dark.lat, dark.lon, date, 0)).toBe(false);
    const region = nightRegion(date, 48.8566, 2.3522, R100);
    const p = projectOrthographic(dark.lat, dark.lon, 48.8566, 2.3522, R100);
    if (p.visible) {
      expect(pointInPolygon(p.x, p.y, region)).toBe(true);
    }
  });

  it('face entièrement éclairée → polygone vide', () => {
    // Regarder le point subsolaire : tout est jour.
    const date = new Date('2026-06-21T12:00:00Z');
    const sub = subsolarPoint(date);
    expect(nightRegion(date, sub.lat, sub.lon, R100)).toEqual([]);
  });
});

function pointInPolygon(
  x: number,
  y: number,
  poly: { x: number; y: number }[],
): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (!a || !b) continue;
    if (
      a.y > y !== b.y > y &&
      x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x
    ) {
      inside = !inside;
    }
  }
  return inside;
}
