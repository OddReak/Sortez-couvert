import { Droplets } from 'lucide-react';

import { useWeatherSnapshot } from '@/features/weather/useWeather';
import { confidenceMeta } from '@/shared/lib/forecast';
import {
  formatRelativeDay,
  nowSeconds,
  startOfDayEpoch,
} from '@/shared/lib/time';
import { EM_DASH, formatPercent, formatTemp } from '@/shared/lib/units';
import { Skeleton } from '@/shared/ui/Skeleton';
import { Sheet } from '@/shared/ui/Sheet';
import { WeatherIcon } from '@/shared/ui/WeatherIcon';
import type { DayStep, Place } from '@/shared/types/domain';

/** Nombre de jours affichés (le proxy en récupère 10 ; on n'en montre que les fiables). */
const SHOWN_DAYS = 7;

export function DailyForecastSheet({
  open,
  onClose,
  place,
}: {
  open: boolean;
  onClose: () => void;
  place: Place;
}) {
  const query = useWeatherSnapshot(place);
  const nowEpoch = nowSeconds();
  const days = (query.data?.daily ?? []).slice(0, SHOWN_DAYS);
  const temps = days.flatMap((d) =>
    [d.minTemp, d.maxTemp].filter((v): v is number => v !== null),
  );
  const weekMin = temps.length ? Math.min(...temps) : 0;
  const weekMax = temps.length ? Math.max(...temps) : 1;

  return (
    <Sheet open={open} onClose={onClose} title={`${String(SHOWN_DAYS)} jours`}>
      {query.isPending ? (
        <div className="flex flex-col gap-2 py-2">
          {Array.from({ length: SHOWN_DAYS }, (_, i) => (
            <Skeleton key={i} width="100%" height="2.5rem" />
          ))}
        </div>
      ) : days.length === 0 ? (
        <p className="ink-muted py-6 text-sm">
          Prévisions journalières indisponibles pour ce lieu.
        </p>
      ) : (
        <ul className="hairline-border flex flex-col divide-y">
          {days.map((day) => (
            <DayRow
              key={day.date}
              day={day}
              timezone={place.timezone}
              nowEpoch={nowEpoch}
              weekMin={weekMin}
              weekMax={weekMax}
            />
          ))}
        </ul>
      )}
      <p className="ink-muted mt-3 text-[0.6875rem]">
        La pastille de couleur indique la fiabilité de la prévision (verte =
        fiable, orange = incertaine).
      </p>
    </Sheet>
  );
}

function DayRow({
  day,
  timezone,
  nowEpoch,
  weekMin,
  weekMax,
}: {
  day: DayStep;
  timezone: string;
  nowEpoch: number;
  weekMin: number;
  weekMax: number;
}) {
  const name = formatRelativeDay(
    startOfDayEpoch(day.date, timezone),
    timezone,
    nowEpoch,
  );
  const conf = confidenceMeta(day.confidence);
  const span = weekMax - weekMin || 1;
  const left =
    day.minTemp === null ? 0 : ((day.minTemp - weekMin) / span) * 100;
  const right =
    day.maxTemp === null ? 100 : ((weekMax - day.maxTemp) / span) * 100;

  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="flex w-24 shrink-0 items-center gap-1.5">
        {conf ? (
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: conf.colorVar }}
            aria-hidden="true"
          />
        ) : null}
        <span className="truncate text-sm font-medium capitalize">{name}</span>
        {conf ? <span className="sr-only">({conf.label})</span> : null}
      </span>

      <WeatherIcon code={day.symbol} label={day.phrase} size={22} />

      <span className="ink-muted flex w-12 shrink-0 items-center gap-0.5 text-xs tabular-nums">
        <Droplets size={12} aria-hidden />
        {day.precipProb === null ? EM_DASH : formatPercent(day.precipProb)}
      </span>

      <span className="ml-auto flex flex-1 items-center gap-2">
        <span className="ink-muted w-7 text-right text-sm tabular-nums">
          {formatTemp(day.minTemp)}
        </span>
        <span className="hairline-border relative h-1 min-w-8 flex-1 rounded-full border">
          <span
            className="absolute inset-y-0 rounded-full bg-[var(--app-ink)]"
            style={{ left: `${String(left)}%`, right: `${String(right)}%` }}
          />
        </span>
        <span className="w-7 text-sm font-semibold tabular-nums">
          {formatTemp(day.maxTemp)}
        </span>
      </span>
    </li>
  );
}
