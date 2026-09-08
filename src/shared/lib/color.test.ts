import { describe, expect, it } from 'vitest';

import { contrastRatio, hexToRgb, mixHex, relativeLuminance } from './color';

describe('hexToRgb', () => {
  it('gère les formes #rgb et #rrggbb', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('1e3a8a')).toEqual({ r: 30, g: 58, b: 138 });
  });
});

describe('mixHex', () => {
  it('interpole entre deux couleurs et borne t', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mixHex('#000000', '#ffffff', -1)).toBe('#000000');
    expect(mixHex('#000000', '#ffffff', 2)).toBe('#ffffff');
  });
});

describe('contrastRatio', () => {
  it('noir/blanc = 21:1, identique = 1:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#123456', '#123456')).toBeCloseTo(1, 5);
  });

  it('les tokens de marque tiennent l’AA texte', () => {
    // ink sur surface claire
    expect(contrastRatio('#1f2937', '#f8f9fa')).toBeGreaterThanOrEqual(4.5);
    // blanc cassé sur fond nuit
    expect(contrastRatio('#f8f9fa', '#0b0f19')).toBeGreaterThanOrEqual(4.5);
  });

  it('relativeLuminance est monotone', () => {
    expect(relativeLuminance('#000000')).toBeLessThan(
      relativeLuminance('#808080'),
    );
    expect(relativeLuminance('#808080')).toBeLessThan(
      relativeLuminance('#ffffff'),
    );
  });
});
