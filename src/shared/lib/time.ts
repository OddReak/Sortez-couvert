/**
 * Dates et heures — TOUJOURS dans le fuseau de la ville affichée (IANA),
 * jamais celui du device (brief §4.2 / §20).
 */
import { DateTime } from 'luxon';

export type Locale = 'fr' | 'en';

function at(epochSeconds: number, timezone: string, locale: Locale): DateTime {
  return DateTime.fromSeconds(epochSeconds, { zone: timezone }).setLocale(
    locale,
  );
}

/** « 10:00 » dans le fuseau de la ville. */
export function formatClock(
  epochSeconds: number,
  timezone: string,
  locale: Locale = 'fr',
): string {
  return at(epochSeconds, timezone, locale).toFormat('HH:mm');
}

/** « jeudi 14:00 » — pour l'étiquette « Prévision · … » (brief §6). */
export function formatDayTime(
  epochSeconds: number,
  timezone: string,
  locale: Locale = 'fr',
): string {
  const dt = at(epochSeconds, timezone, locale);
  return `${dt.toFormat('cccc')} ${dt.toFormat('HH:mm')}`;
}

/** « Aujourd'hui » / « Demain » / « jeudi » relativement à `nowSeconds`. */
export function formatRelativeDay(
  epochSeconds: number,
  timezone: string,
  nowSeconds: number,
  locale: Locale = 'fr',
): string {
  const day = at(epochSeconds, timezone, locale).startOf('day');
  const today = at(nowSeconds, timezone, locale).startOf('day');
  const diff = day.diff(today, 'days').days;

  if (diff === 0) return locale === 'fr' ? "Aujourd'hui" : 'Today';
  if (diff === 1) return locale === 'fr' ? 'Demain' : 'Tomorrow';
  return day.toFormat('cccc');
}

/** « Auj. » / « Dem. » / « mer. » — version courte pour le carrousel 7 jours. */
export function formatShortDay(
  epochSeconds: number,
  timezone: string,
  nowSeconds: number,
  locale: Locale = 'fr',
): string {
  const day = at(epochSeconds, timezone, locale).startOf('day');
  const today = at(nowSeconds, timezone, locale).startOf('day');
  const diff = day.diff(today, 'days').days;

  if (diff === 0) return locale === 'fr' ? 'Auj.' : 'Today';
  if (diff === 1) return locale === 'fr' ? 'Dem.' : 'Tmrw';
  return day.toFormat('ccc');
}

/** Epoch (s) du début de journée locale pour une date ISO « YYYY-MM-DD ». */
export function startOfDayEpoch(dateIso: string, timezone: string): number {
  return Math.floor(
    DateTime.fromISO(dateIso, { zone: timezone }).startOf('day').toSeconds(),
  );
}

/** Date locale « YYYY-MM-DD » (fuseau ville) d'un instant. */
export function localDateIso(epochSeconds: number, timezone: string): string {
  return DateTime.fromSeconds(epochSeconds, { zone: timezone }).toFormat(
    'yyyy-LL-dd',
  );
}

/** Heure décimale locale ∈ [0, 24) d'un instant (courbe diurne de repli). */
export function localHourFraction(
  epochSeconds: number,
  timezone: string,
): number {
  const d = DateTime.fromSeconds(epochSeconds, { zone: timezone });
  return d.hour + d.minute / 60;
}

/** Vrai si les deux instants tombent dans la même heure locale. */
export function isSameLocalHour(
  aSeconds: number,
  bSeconds: number,
  timezone: string,
): boolean {
  const a = DateTime.fromSeconds(aSeconds, { zone: timezone });
  const b = DateTime.fromSeconds(bSeconds, { zone: timezone });
  return a.hasSame(b, 'hour');
}

/** Secondes epoch de « maintenant » — extrait pour faciliter les tests. */
export const nowSeconds = (): number => Math.floor(Date.now() / 1000);
