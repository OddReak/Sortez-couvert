import { Droplets } from 'lucide-react';

import { confidenceMeta } from '@/shared/lib/forecast';
import { formatShortDay, nowSeconds, startOfDayEpoch } from '@/shared/lib/time';
import { EM_DASH, formatPercent, formatTemp } from '@/shared/lib/units';
import { WeatherIcon } from '@/shared/ui/WeatherIcon';
import type { DayStep } from '@/shared/types/domain';

/** Jours affichés dans le carrousel (le proxy en récupère 10). */
const SHOWN_DAYS = 7;

/**
 * Bande horizontale des prévisions journalières, entre le globe et les
 * métriques (brief §9.7). Taper un jour recale le globe et le thème sur ce jour
 * (mêmes fonctions que le jour même : fond selon l'heure regardée, etc.).
 */
export function ForecastCarousel({
  days,
  timezone,
  activeDayStart,
  onSelectDay,
}: {
  days: DayStep[];
  timezone: string;
  /** Début (epoch) du jour actuellement piloté par la bague. */
  activeDayStart: number;
  onSelectDay: (dateIso: string) => void;
}) {
  const shown = days.slice(0, SHOWN_DAYS);
  if (shown.length === 0) return null;

  const now = nowSeconds();

  return (
    <section
      aria-label={`Prévisions ${String(SHOWN_DAYS)} jours`}
      className="shrink-0"
    >
      <ul className="flex [scroll-snap-type:x_proximity] [scrollbar-width:none] gap-1 overflow-x-auto overscroll-x-contain px-4 pt-0.5 pb-1 [&::-webkit-scrollbar]:hidden">
        {shown.map((day) => (
          <li key={day.date} className="snap-start">
            <DayCard
              day={day}
              timezone={timezone}
              now={now}
              active={startOfDayEpoch(day.date, timezone) === activeDayStart}
              onSelect={onSelectDay}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function DayCard({
  day,
  timezone,
  now,
  active,
  onSelect,
}: {
  day: DayStep;
  timezone: string;
  now: number;
  active: boolean;
  onSelect: (dateIso: string) => void;
}) {
  const label = formatShortDay(
    startOfDayEpoch(day.date, timezone),
    timezone,
    now,
  );
  const conf = confidenceMeta(day.confidence);
  const rain = day.precipProb === null ? null : formatPercent(day.precipProb);

  const aria = [
    label,
    day.phrase ?? '',
    `max ${formatTemp(day.maxTemp)}`,
    `min ${formatTemp(day.minTemp)}`,
    rain ? `pluie ${rain}` : '',
    conf ? conf.label : '',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <button
      type="button"
      onClick={() => {
        onSelect(day.date);
      }}
      aria-label={aria}
      aria-pressed={active}
      className={`flex min-h-11 w-14 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 ${
        active ? 'chip-active' : 'active:chip-active'
      }`}
    >
      <span className="ink-muted flex items-center gap-1 text-[0.6875rem] font-medium capitalize">
        {conf ? (
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: conf.colorVar }}
            aria-hidden="true"
          />
        ) : null}
        {label}
      </span>
      <WeatherIcon code={day.symbol} size={20} />
      <span className="text-xs font-semibold tabular-nums">
        {formatTemp(day.maxTemp)}
      </span>
      <span className="ink-muted text-[0.6875rem] tabular-nums">
        {formatTemp(day.minTemp)}
      </span>
      <span className="ink-muted flex items-center gap-0.5 text-[0.6875rem] tabular-nums">
        <Droplets size={9} aria-hidden="true" />
        {rain ?? EM_DASH}
      </span>
    </button>
  );
}
