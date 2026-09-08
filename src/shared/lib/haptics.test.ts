import { afterEach, describe, expect, it, vi } from 'vitest';

import { createHaptics } from './haptics';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('createHaptics', () => {
  it('vibre brièvement quand navigator.vibrate existe', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    const h = createHaptics();
    expect(h.canVibrate).toBe(true);
    h.tick();
    expect(vibrate).toHaveBeenCalledWith(9);
  });

  it('no-op silencieux quand la vibration n’est pas supportée (iOS)', () => {
    vi.stubGlobal('navigator', {});
    const h = createHaptics();
    expect(h.canVibrate).toBe(false);
    expect(() => {
      h.tick();
    }).not.toThrow();
  });

  it('ne jette pas si navigator.vibrate lève une exception', () => {
    vi.stubGlobal('navigator', {
      vibrate: () => {
        throw new Error('blocked');
      },
    });
    const h = createHaptics();
    expect(() => {
      h.tick();
    }).not.toThrow();
  });
});
