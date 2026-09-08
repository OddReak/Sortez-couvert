import { describe, expect, it } from 'vitest';

import { contrastRatio } from './color';
import { resolveTheme, surfacePassesAA } from './theme';

// Journée type à Paris le 2026-09-08 (issu des fixtures Foreca).
const SUNRISE = 1_788_844_593; // 07:16:33 locale
const SUNSET = 1_788_891_554; // 20:19:14 locale
const day = { sunriseSeconds: SUNRISE, sunsetSeconds: SUNSET };

describe('resolveTheme — modes', () => {
  it('plein midi → day', () => {
    const t = resolveTheme({ atSeconds: (SUNRISE + SUNSET) / 2, ...day });
    expect(t.mode).toBe('day');
    expect(t.dayness).toBe(1);
    expect(t.scheme).toBe('light');
  });

  it('minuit → night', () => {
    const t = resolveTheme({ atSeconds: SUNRISE - 6 * 3600, ...day });
    expect(t.mode).toBe('night');
    expect(t.dayness).toBe(0);
    expect(t.scheme).toBe('dark');
  });

  it('pile au lever → dawn, à mi-transition', () => {
    const t = resolveTheme({ atSeconds: SUNRISE, ...day });
    expect(t.mode).toBe('dawn');
    expect(t.dayness).toBeCloseTo(0.5, 1);
  });

  it('pile au coucher → dusk', () => {
    const t = resolveTheme({ atSeconds: SUNSET, ...day });
    expect(t.mode).toBe('dusk');
    expect(t.dayness).toBeCloseTo(0.5, 1);
  });

  it('45 min avant le lever → encore la nuit ; 45 min après → le jour', () => {
    expect(resolveTheme({ atSeconds: SUNRISE - 46 * 60, ...day }).mode).toBe(
      'night',
    );
    expect(resolveTheme({ atSeconds: SUNRISE + 46 * 60, ...day }).mode).toBe(
      'day',
    );
  });

  it('repli sans éphémérides (heure seule)', () => {
    const noon = resolveTheme({
      atSeconds: 12 * 3600,
      sunriseSeconds: null,
      sunsetSeconds: null,
    });
    expect(noon.mode).toBe('day');
  });
});

describe('accessibilité — contraste ≥ 4.5:1 sur tout le cycle (brief §11)', () => {
  it('20 points de la transition d’aube : surface vs encre', () => {
    for (let i = 0; i <= 19; i += 1) {
      const at = SUNRISE - 45 * 60 + (i / 19) * 90 * 60;
      const paint = resolveTheme({ atSeconds: at, ...day });
      expect(
        contrastRatio(paint.surface, paint.ink),
        `dawn point ${String(i)} (dayness ${paint.dayness.toFixed(2)})`,
      ).toBeGreaterThanOrEqual(4.5);
      expect(surfacePassesAA(paint)).toBe(true);
    }
  });

  it('20 points de la transition de crépuscule', () => {
    for (let i = 0; i <= 19; i += 1) {
      const at = SUNSET - 45 * 60 + (i / 19) * 90 * 60;
      const paint = resolveTheme({ atSeconds: at, ...day });
      expect(
        contrastRatio(paint.surface, paint.ink),
        `dusk point ${String(i)}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('jour et nuit pleins passent aussi', () => {
    for (const at of [SUNRISE - 3 * 3600, (SUNRISE + SUNSET) / 2]) {
      expect(surfacePassesAA(resolveTheme({ atSeconds: at, ...day }))).toBe(
        true,
      );
    }
  });
});
