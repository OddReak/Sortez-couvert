import { Menu, Search } from 'lucide-react';
import { Suspense, lazy } from 'react';

import { DEFAULT_PLACE } from '@/features/location/defaultPlace';
import { MetricGrid } from '@/features/metrics/MetricGrid';
import { useSettings } from '@/features/settings/store';
import { useApplyTheme } from '@/features/theme/useApplyTheme';
import { HourStrip } from '@/features/time-ring/HourStrip';
import { Attribution } from '@/features/weather/Attribution';
import {
  useDisplayedConditions,
  useWeatherSnapshot,
} from '@/features/weather/useWeather';
import { formatClock, formatDayTime } from '@/shared/lib/time';
import { formatTemp } from '@/shared/lib/units';
import { Skeleton } from '@/shared/ui/Skeleton';
import { WeatherIcon } from '@/shared/ui/WeatherIcon';

// Le chunk `three` est chargé après le premier paint (brief §7.4).
const Globe = lazy(() => import('@/features/globe/Globe'));

export function HomeScreen() {
  const place = DEFAULT_PLACE;
  const query = useWeatherSnapshot(place);
  const conditions = useDisplayedConditions(query.data);
  const units = useSettings((s) => s.units);

  useApplyTheme(conditions?.theme ?? null);

  return (
    <div className="safe-x mx-auto flex h-dvh max-w-md flex-col bg-[var(--app-ambient)]">
      {/* ── TOP · 15 % ──────────────────────────────────────────────── */}
      <header
        className="safe-t flex shrink-0 flex-col justify-start gap-1 px-4 pt-1"
        style={{ flexBasis: '15%' }}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Ouvrir le menu"
            className="grid size-11 place-items-center"
          >
            <Menu size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Rechercher une ville"
            className="grid size-11 place-items-center"
          >
            <Search size={22} aria-hidden="true" />
          </button>
        </div>

        <h1 className="text-center text-2xl leading-tight font-bold text-balance">
          {place.name}
        </h1>

        <SubLine
          conditions={conditions}
          timezone={place.timezone}
          loading={query.isPending}
        />
      </header>

      {/* ── CENTER · 60 % ──────────────────────────────────────────── */}
      <main
        className="flex min-h-0 grow flex-col items-center justify-center gap-4"
        style={{ flexBasis: '60%' }}
      >
        <p className="ink-muted text-xs tracking-widest uppercase">
          {(conditions?.isNow ?? true) ? 'Maintenant' : 'Prévision'}
        </p>

        <div className="aspect-square w-[78%] max-w-72">
          {conditions ? (
            <Suspense fallback={<GlobeFallback />}>
              <Globe
                lat={place.lat}
                lon={place.lon}
                atEpoch={conditions.atEpoch}
                cloudiness={conditions.step.cloudiness}
                label={place.name}
              />
            </Suspense>
          ) : (
            <GlobeFallback />
          )}
        </div>

        {query.data ? (
          <HourStrip
            hourly={query.data.hourly}
            timezone={place.timezone}
            currentEpoch={query.data.current.epoch}
          />
        ) : (
          <Skeleton width="90%" height="4.75rem" />
        )}
      </main>

      {/* ── BOTTOM · 25 % ──────────────────────────────────────────── */}
      <footer
        className="safe-b flex shrink-0 flex-col gap-2 px-4 pb-2"
        style={{ flexBasis: '25%' }}
      >
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col">
            <span
              className="leading-none font-light tabular-nums"
              style={{ fontSize: 'var(--text-temp-hero)' }}
            >
              {conditions ? formatTemp(conditions.step.temp) : '—°'}
            </span>
            <span className="ink-muted text-sm tabular-nums">
              Ressenti{' '}
              {conditions ? formatTemp(conditions.step.feelsLike) : '—°'}
            </span>
          </div>

          {query.data && conditions ? (
            <MetricGrid
              step={conditions.step}
              units={units}
              snapshot={query.data}
            />
          ) : (
            <Skeleton width="9.5rem" height="6.5rem" />
          )}
        </div>

        {query.data ? <Attribution data={query.data.attribution} /> : null}
      </footer>

      {query.isError ? (
        <ErrorBanner onRetry={() => void query.refetch()} />
      ) : null}
    </div>
  );
}

type SubLineProps = {
  conditions: ReturnType<typeof useDisplayedConditions>;
  timezone: string;
  loading: boolean;
};

function SubLine({ conditions, timezone, loading }: SubLineProps) {
  if (loading || !conditions) {
    return (
      <p className="flex justify-center">
        <Skeleton width="12rem" height="0.95rem" />
      </p>
    );
  }

  const { step, atEpoch, isNow } = conditions;

  return (
    <p className="ink-muted flex items-center justify-center gap-1.5 text-sm">
      <WeatherIcon code={step.symbol} size={16} />
      <span>{step.phrase ?? '—'}</span>
      <span aria-hidden="true">·</span>
      {isNow ? (
        <span className="tabular-nums">
          {formatClock(atEpoch, timezone)}
          <span className="ml-1.5 font-semibold text-[var(--app-live)]">
            En direct
          </span>
        </span>
      ) : (
        <span className="tabular-nums">
          Prévision · {formatDayTime(atEpoch, timezone)}
        </span>
      )}
    </p>
  );
}

function GlobeFallback() {
  return (
    <span className="hairline-border block aspect-square w-full animate-pulse rounded-full border" />
  );
}

function ErrorBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="safe-b hairline-border fixed inset-x-0 bottom-0 mx-auto max-w-md border-t bg-[var(--app-surface)] px-4 py-3 text-center text-sm"
    >
      Impossible de charger la météo.{' '}
      <button
        type="button"
        onClick={onRetry}
        className="font-semibold text-[var(--app-live)] underline"
      >
        Réessayer
      </button>
    </div>
  );
}
