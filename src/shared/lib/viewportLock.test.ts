import { afterEach, describe, expect, it } from 'vitest';

import { lockPinchZoom } from './viewportLock';

describe('lockPinchZoom', () => {
  let teardown: (() => void) | undefined;

  afterEach(() => {
    teardown?.();
    teardown = undefined;
  });

  it('annule les gestes de pincement iOS', () => {
    teardown = lockPinchZoom();
    for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
      const event = new Event(type, { cancelable: true });
      document.dispatchEvent(event);
      expect(event.defaultPrevented, type).toBe(true);
    }
  });

  it('annule le zoom Ctrl + molette, mais laisse le scroll normal', () => {
    teardown = lockPinchZoom();

    const zoom = new WheelEvent('wheel', { cancelable: true, ctrlKey: true });
    document.dispatchEvent(zoom);
    expect(zoom.defaultPrevented).toBe(true);

    const scroll = new WheelEvent('wheel', { cancelable: true });
    document.dispatchEvent(scroll);
    expect(scroll.defaultPrevented).toBe(false);
  });

  it('la fonction de nettoyage retire les écouteurs', () => {
    lockPinchZoom()();
    const event = new Event('gesturestart', { cancelable: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });
});
