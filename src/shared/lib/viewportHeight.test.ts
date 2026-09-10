import { afterEach, describe, expect, it, vi } from 'vitest';

import { syncViewportHeight } from './viewportHeight';

describe('syncViewportHeight', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--app-vh');
    vi.restoreAllMocks();
  });

  it('publie window.innerHeight dans --app-vh au montage', () => {
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(742);
    const stop = syncViewportHeight();
    expect(document.documentElement.style.getPropertyValue('--app-vh')).toBe(
      '742px',
    );
    stop();
  });

  it('recalcule sur resize et orientationchange', () => {
    const h = vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(500);
    const stop = syncViewportHeight();

    h.mockReturnValue(844);
    window.dispatchEvent(new Event('resize'));
    expect(document.documentElement.style.getPropertyValue('--app-vh')).toBe(
      '844px',
    );

    h.mockReturnValue(390);
    window.dispatchEvent(new Event('orientationchange'));
    expect(document.documentElement.style.getPropertyValue('--app-vh')).toBe(
      '390px',
    );

    stop();
  });

  it('retire ses écouteurs après stop()', () => {
    const h = vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(600);
    const stop = syncViewportHeight();
    stop();

    h.mockReturnValue(999);
    window.dispatchEvent(new Event('resize'));
    expect(document.documentElement.style.getPropertyValue('--app-vh')).toBe(
      '600px',
    );
  });
});
