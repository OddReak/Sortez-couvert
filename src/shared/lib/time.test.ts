import { describe, expect, it } from 'vitest';

import {
  formatClock,
  formatDayTime,
  formatRelativeDay,
  formatShortDay,
  isSameLocalHour,
  startOfDayEpoch,
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

describe('formatShortDay', () => {
  const now = PARIS_10H;
  it('« Auj. » / « Dem. » / jour court', () => {
    expect(formatShortDay(PARIS_10H + 3 * 3600, TZ, now)).toBe('Auj.');
    expect(formatShortDay(PARIS_10H + 30 * 3600, TZ, now)).toBe('Dem.');
    // 2026-09-11 = vendredi → « ven. » en français
    expect(formatShortDay(PARIS_10H + 72 * 3600, TZ, now)).toBe('ven.');
  });
});

describe('startOfDayEpoch', () => {
  it('renvoie minuit local pour une date ISO, selon le fuseau', () => {
    expect(startOfDayEpoch('2026-09-08', TZ)).toBe(
      Math.floor(Date.parse('2026-09-08T00:00:00+02:00') / 1000),
    );
    expect(startOfDayEpoch('2026-09-08', NY)).toBe(
      Math.floor(Date.parse('2026-09-08T00:00:00-04:00') / 1000),
    );
  });

  it('se recale bien sur le jour nommé via formatRelativeDay', () => {
    const now = Math.floor(Date.parse('2026-09-08T12:00:00+02:00') / 1000);
    expect(formatRelativeDay(startOfDayEpoch('2026-09-09', TZ), TZ, now)).toBe(
      'Demain',
    );
  });
});

describe('isSameLocalHour', () => {
  it('vrai dans la même heure locale, faux sinon', () => {
    expect(isSameLocalHour(PARIS_10H, PARIS_10H + 600, TZ)).toBe(true);
    expect(isSameLocalHour(PARIS_10H, PARIS_10H + 3600, TZ)).toBe(false);
  });
});
