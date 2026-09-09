import { describe, expect, it } from 'vitest';

import type { Warning } from '@/shared/types/domain';

import { alertColor, alertMeta, mostSevere } from './alertMeta';

const make = (over: Partial<Warning>): Warning => ({
  id: 'w1',
  event: 'Vent violent',
  headline: null,
  description: null,
  severity: null,
  color: null,
  onset: null,
  expires: null,
  source: null,
  ...over,
});

describe('alertColor', () => {
  it('préfère la couleur explicite', () => {
    expect(alertColor(make({ color: 'red', severity: 'minor' }))).toBe('red');
  });

  it('dérive la couleur du niveau quand `color` est absente', () => {
    expect(alertColor(make({ severity: 'extreme' }))).toBe('violet');
    expect(alertColor(make({ severity: 'minor' }))).toBe('yellow');
  });

  it('retombe sur orange quand tout est absent', () => {
    expect(alertColor(make({}))).toBe('orange');
  });
});

describe('alertMeta', () => {
  it('rouge/violet → annonce assertive, jaune/orange → polite', () => {
    expect(alertMeta(make({ color: 'red' })).live).toBe('assertive');
    expect(alertMeta(make({ color: 'yellow' })).live).toBe('polite');
  });

  it('expose un libellé de niveau et un token de couleur', () => {
    const meta = alertMeta(make({ color: 'orange' }));
    expect(meta.levelLabel).toBe('Vigilance orange');
    expect(meta.colorVar).toBe('var(--color-warn-orange)');
  });
});

describe('mostSevere', () => {
  it('renvoie l’alerte la plus grave', () => {
    const list = [
      make({ id: 'a', color: 'yellow' }),
      make({ id: 'b', color: 'red' }),
      make({ id: 'c', color: 'orange' }),
    ];
    expect(mostSevere(list)?.id).toBe('b');
  });

  it('renvoie null sur une liste vide', () => {
    expect(mostSevere([])).toBeNull();
  });
});
