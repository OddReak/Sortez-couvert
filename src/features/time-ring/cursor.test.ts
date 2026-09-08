import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __resetCursor,
  followNow,
  getCursorEpoch,
  isFollowingNow,
  isScrubbing,
  setCursorEpoch,
  setScrubbing,
  subscribeFast,
  subscribeThrottled,
} from './cursor';

beforeEach(() => {
  __resetCursor();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  __resetCursor();
});

describe('curseur temporel', () => {
  it('suit maintenant par défaut', () => {
    expect(isFollowingNow()).toBe(true);
    expect(getCursorEpoch()).toBeGreaterThan(0);
  });

  it('setCursorEpoch fixe l’instant et quitte le mode « suit maintenant »', () => {
    setCursorEpoch(1_000_000);
    expect(isFollowingNow()).toBe(false);
    expect(getCursorEpoch()).toBe(1_000_000);
  });

  it('followNow revient au suivi de l’heure réelle', () => {
    setCursorEpoch(1_000_000, true);
    followNow();
    expect(isFollowingNow()).toBe(true);
    expect(isScrubbing()).toBe(false);
  });

  it('notifie les abonnés « fast » à chaque changement', () => {
    const spy = vi.fn();
    subscribeFast(spy);
    setCursorEpoch(1);
    setCursorEpoch(2);
    setCursorEpoch(3);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('throttle les abonnés « lents » (≤ ~11 Hz)', () => {
    const spy = vi.fn();
    subscribeThrottled(spy);
    for (let i = 0; i < 30; i += 1) setCursorEpoch(i);
    vi.advanceTimersByTime(90);
    expect(spy).toHaveBeenCalledTimes(1); // 30 changements → 1 notification
  });

  it('setScrubbing ne notifie que sur transition', () => {
    const spy = vi.fn();
    subscribeFast(spy);
    setScrubbing(true);
    setScrubbing(true);
    setScrubbing(false);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
