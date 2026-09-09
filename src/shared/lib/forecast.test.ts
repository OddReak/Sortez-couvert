import { describe, expect, it } from 'vitest';

import { confidenceMeta } from './forecast';

describe('confidenceMeta', () => {
  it('mappe g/y/o vers un libellé, une couleur et un niveau', () => {
    expect(confidenceMeta('g')).toEqual({
      label: 'Prévision fiable',
      colorVar: 'var(--color-ok)',
      level: 1,
    });
    expect(confidenceMeta('y')?.level).toBe(2);
    expect(confidenceMeta('o')?.label).toBe('Prévision incertaine');
  });

  it('renvoie null pour une confiance absente', () => {
    expect(confidenceMeta(null)).toBeNull();
  });
});
