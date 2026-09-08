import { describe, expect, it } from 'vitest';

import {
  formatClock,
  formatDayTime,
  formatRelativeDay,
  isSameLocalHour,
} from './time';

const PARIS_10H = Math.floor(Date.parse('2026-09-08T10:00:00+02:00') / 1000);
const TZ = 'Europe/Paris';
const NY = 'America/New_York';

describe('formatClock', () => {
  it('affiche l’heure dans le fuseau de la ville, pas celui du device', () => {
    expect(formatClock(PARIS_10H, TZ)).toBe('10:00');
    expect(formatClock(PARIS_10H, NY)).toBe('04:00');
    expect(formatClock(PARIS_10H, 'Asia/Tokyo')).toBe('17:00');
  });
});

describe('formatDayTime', () => {
  it('« jour heure » en français', () => {
    expect(formatDayTime(PARIS_10H, TZ, 'fr')).toBe('mardi 10:00');
  });
});

describe('formatRelativeDay', () => {
  const now = PARIS_10H;
  it('aujourd’hui / demain / jour nommé', () => {
    expect(formatRelativeDay(PARIS_10H + 3 * 3600, TZ, now)).toBe(
      "Aujourd'hui",
    );
    expect(formatRelativeDay(PARIS_10H + 30 * 3600, TZ, now)).toBe('Demain');
    expect(formatRelativeDay(PARIS_10H + 72 * 3600, TZ, now, 'en')).toBe(
      'Friday',
    );
  });
});

describe('isSameLocalHour', () => {
  it('vrai dans la même heure locale, faux sinon', () => {
    expect(isSameLocalHour(PARIS_10H, PARIS_10H + 600, TZ)).toBe(true);
    expect(isSameLocalHour(PARIS_10H, PARIS_10H + 3600, TZ)).toBe(false);
  });
});
