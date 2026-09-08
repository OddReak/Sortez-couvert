import { getPosition } from 'suncalc';
import { describe, expect, it } from 'vitest';

import {
  equationOfTimeMinutes,
  isSunlit,
  solarDeclination,
  subsolarPoint,
  sunDirection,
} from './sun';

// Le cercle polaire est à 66,563°. Pile à cette latitude, le jour/nuit de 24 h
// au solstice se joue au centième de degré près (l'altitude solaire y frôle
// 0°). On teste donc franchement à l'intérieur (68°) : le modèle doit y
// montrer un jour/une nuit polaire nets.
const INSIDE_POLAR = 68;
const PARIS = { lat: 48.8566, lon: 2.3522 };

describe('déclinaison / point subsolaire (brief §7.2)', () => {
  it('équinoxe de mars → terminateur par les deux pôles (déclinaison ≈ 0)', () => {
    const eq = new Date('2026-03-20T12:00:00Z');
    expect(Math.abs(solarDeclination(eq))).toBeLessThan(0.4);
    expect(Math.abs(subsolarPoint(eq).lat)).toBeLessThan(0.4);
  });

  it('solstice d’été → subsolaire ≈ +23,44° N', () => {
    const june = new Date('2026-06-21T12:00:00Z');
    expect(subsolarPoint(june).lat).toBeCloseTo(23.44, 0);
    expect(subsolarPoint(june).lat).toBeGreaterThan(23.2);
  });

  it('solstice d’hiver → subsolaire ≈ −23,44° S', () => {
    const dec = new Date('2026-12-21T12:00:00Z');
    expect(subsolarPoint(dec).lat).toBeCloseTo(-23.44, 0);
    expect(subsolarPoint(dec).lat).toBeLessThan(-23.2);
  });

  it('point subsolaire ≈ méridien de midi solaire (via l’équation du temps)', () => {
    const d = new Date('2026-03-20T12:00:00Z');
    const expectedLon = -equationOfTimeMinutes(d) / 4; // 15°/h · 1h/60min
    expect(subsolarPoint(d).lon).toBeCloseTo(expectedLon, 0);
  });
});

describe('éclairement des cercles polaires aux solstices (brief §7.2)', () => {
  it('21 juin : l’Arctique éclairé 24 h, l’Antarctique dans l’ombre 24 h', () => {
    for (let h = 0; h < 24; h += 3) {
      const t = new Date(Date.UTC(2026, 5, 21, h));
      expect(isSunlit(INSIDE_POLAR, 0, t), `arctique ${String(h)}h`).toBe(true);
      expect(isSunlit(-INSIDE_POLAR, 0, t), `antarctique ${String(h)}h`).toBe(
        false,
      );
    }
  });

  it('21 décembre : l’inverse', () => {
    for (let h = 0; h < 24; h += 3) {
      const t = new Date(Date.UTC(2026, 11, 21, h));
      expect(isSunlit(-INSIDE_POLAR, 0, t)).toBe(true);
      expect(isSunlit(INSIDE_POLAR, 0, t)).toBe(false);
    }
  });
});

describe('Paris aux solstices (brief §7.2)', () => {
  it('21 juin 22:00 locale (20:00 UTC) → encore éclairé (crépuscule civil)', () => {
    const t = new Date('2026-06-21T20:00:00Z');
    expect(isSunlit(PARIS.lat, PARIS.lon, t, 6)).toBe(true);
  });

  it('21 décembre 17:30 locale (16:30 UTC) → dans l’ombre', () => {
    const t = new Date('2026-12-21T16:30:00Z');
    expect(isSunlit(PARIS.lat, PARIS.lon, t, 0)).toBe(false);
  });
});

describe('cohérence avec suncalc (validation indépendante)', () => {
  it('isSunlit s’accorde avec l’altitude solaire de suncalc', () => {
    const samples: [number, number, string][] = [
      [PARIS.lat, PARIS.lon, '2026-06-21T10:00:00Z'],
      [PARIS.lat, PARIS.lon, '2026-06-21T23:00:00Z'],
      [-33.87, 151.21, '2026-01-15T03:00:00Z'],
      [40.71, -74.01, '2026-09-08T18:00:00Z'],
      [64.14, -21.94, '2026-12-21T12:00:00Z'],
    ];
    for (const [lat, lon, iso] of samples) {
      const date = new Date(iso);
      const altitude = getPosition(date, lat, lon).altitude;
      expect(isSunlit(lat, lon, date, 0), `${iso} @ ${String(lat)}`).toBe(
        altitude > 0,
      );
    }
  });

  it('la direction du soleil est un vecteur unité', () => {
    const v = sunDirection(new Date('2026-09-08T12:00:00Z'));
    expect(Math.hypot(v.x, v.y, v.z)).toBeCloseTo(1, 6);
  });
});
