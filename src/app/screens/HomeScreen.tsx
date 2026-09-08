import { Menu, Search } from 'lucide-react';
import { Suspense, lazy, useEffect, useRef } from 'react';

import { DEFAULT_PLACE } from '@/features/location/defaultPlace';
import { MetricGrid } from '@/features/metrics/MetricGrid';
import { useSettings } from '@/features/settings/store';
import { useApplyTheme } from '@/features/theme/useApplyTheme';
import { HourStrip } from '@/features/time-ring/HourStrip';
import { TimeRing } from '@/features/time-ring/TimeRing';
import { Attribution } from '@/features/weather/Attribution';
import {
  LiveConditionsProvider,
  useLiveConditions,
} from '@/features/weather/LiveConditions';
import { useWeatherSnapshot } from '@/features/weather/useWeather';
import { usePrefersReducedMotion } from '@/shared/lib/useMediaQuery';
import { formatClock, formatDayTime } from '@/shared/lib/time';
import { roundHalfUp } from '@/shared/lib/units';
import { Skeleton } from '@/shared/ui/Skeleton';
import { WeatherIcon } from '@/shared/ui/WeatherIcon';
import type { Place, WeatherSnapshot } from '@/shared/types/domain';

const Globe = lazy(() => import('@/features/globe/Globe'));

export function HomeScreen() {
  const place = DEFAULT_PLACE;
  const query = useWeatherSnapshot(place);

  return (
    <div className="safe-x mx-auto flex h-dvh max-w-md flex-col bg-[var(--app-ambient)]">
      {query.data ? (
        <LiveConditionsProvider snapshot={query.data}>
          <ThemeSync />
          <TopBar place={place} />
          <CenterStage place={place} snapshot={query.data} />
          <BottomPanel snapshot={query.data} />
        </LiveConditionsProvider>
      ) : (
        <LoadingLayout
          place={place}
          error={query.isError}
          onRetry={query.refetch}
        />
      )}
    </div>
  );
}

function ThemeSync() {
  const { theme } = useLiveConditions();
  useApplyTheme(theme);
  return null;
}

// ── TOP · 15 % ────────────────────────────────────────────────────────────

function TopBar({ place }: { place: Place }) {
  return (
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
      <SubLine timezone={place.timezone} />
    </header>
  );
}

function SubLine({ timezone }: { timezone: string }) {
  const { step, atEpoch, isNow } = useLiveConditions();
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

// ── CENTER · 60 % ─────────────────────────────────────────────────────────

function CenterStage({
  place,
  snapshot,
}: {
  place: Place;
  snapshot: WeatherSnapshot;
}) {
  const soundTick = useSettings((s) => s.soundTick);
  const forceChips = useSettings((s) => s.nonGesturalTimeControl);
  const reduced = usePrefersReducedMotion();
  const showChips = forceChips || reduced;

  return (
    <main
      className="flex min-h-0 grow flex-col items-center justify-center gap-3"
      style={{ flexBasis: '60%' }}
    >
      <p className="ink-muted text-xs tracking-widest uppercase">Maintenant</p>

      <div className="relative aspect-square w-[86%] max-w-80">
        <Suspense fallback={<GlobeFallback />}>
          <Globe
            lat={place.lat}
            lon={place.lon}
            hourly={snapshot.hourly}
            label={place.name}
          />
        </Suspense>
        {!showChips ? (
          <TimeRing snapshot={snapshot} soundTick={soundTick} />
        ) : null}
      </div>

      <SelectedTimeLabel timezone={place.timezone} />

      {showChips ? (
        <HourStrip hourly={snapshot.hourly} timezone={place.timezone} />
      ) : null}
    </main>
  );
}

function SelectedTimeLabel({ timezone }: { timezone: string }) {
  const { atEpoch, isNow } = useLiveConditions();
  return (
    <p className="h-5 text-sm font-semibold tabular-nums">
      {isNow
        ? formatClock(atEpoch, timezone)
        : formatDayTime(atEpoch, timezone)}
    </p>
  );
}

// ── BOTTOM · 25 % ─────────────────────────────────────────────────────────

function BottomPanel({ snapshot }: { snapshot: WeatherSnapshot }) {
  return (
    <footer
      className="safe-b flex shrink-0 flex-col gap-2 px-4 pb-2"
      style={{ flexBasis: '25%' }}
    >
      <div className="flex items-end justify-between gap-4">
        <HeroTemperature />
        <Metrics snapshot={snapshot} />
      </div>
      <Attribution data={snapshot.attribution} />
    </footer>
  );
}

function HeroTemperature() {
  const { step } = useLiveConditions();
  return (
    <div className="flex flex-col">
      <span
        className="leading-none font-light tabular-nums"
        style={{ fontSize: 'var(--text-temp-hero)' }}
      >
        <SpringTemp value={step.temp} />
      </span>
      <span className="ink-muted text-sm tabular-nums">
        Ressenti <SpringTemp value={step.feelsLike} />
      </span>
    </div>
  );
}

/**
 * Température lissée par un ressort (brief §8.3) — la valeur affichée suit la
 * cible en douceur, écrite DIRECTEMENT dans le nœud texte (aucun re-render).
 */
function SpringTemp({ value }: { value: number | null }) {
  const ref = useRef<HTMLSpanElement>(null);
  const current = useRef(value ?? 0);
  const target = useRef(value ?? 0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (value === null || !Number.isFinite(value)) return;
    target.current = value;

    const step = (): void => {
      const c = current.current;
      const next = c + (target.current - c) * 0.16;
      current.current =
        Math.abs(target.current - next) < 0.05 ? target.current : next;
      if (ref.current) {
        ref.current.textContent = `${String(roundHalfUp(current.current))}°`;
      }
      raf.current =
        current.current === target.current ? null : requestAnimationFrame(step);
    };

    raf.current ??= requestAnimationFrame(step);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    };
  }, [value]);

  if (value === null || !Number.isFinite(value)) return <>—°</>;
  return <span ref={ref}>{`${String(roundHalfUp(value))}°`}</span>;
}

function Metrics({ snapshot }: { snapshot: WeatherSnapshot }) {
  const { step } = useLiveConditions();
  const units = useSettings((s) => s.units);
  return <MetricGrid step={step} units={units} snapshot={snapshot} />;
}

// ── Chargement / erreur ───────────────────────────────────────────────────

function LoadingLayout({
  place,
  error,
  onRetry,
}: {
  place: Place;
  error: boolean;
  onRetry: () => Promise<unknown>;
}) {
  return (
    <>
      <header
        className="safe-t flex shrink-0 flex-col gap-2 px-4 pt-1"
        style={{ flexBasis: '15%' }}
      >
        <div className="h-11" />
        <h1 className="text-center text-2xl font-bold">{place.name}</h1>
        <p className="flex justify-center">
          <Skeleton width="12rem" height="0.95rem" />
        </p>
      </header>
      <main
        className="flex grow items-center justify-center"
        style={{ flexBasis: '60%' }}
      >
        {error ? (
          <p role="alert" className="px-6 text-center text-sm">
            Impossible de charger la météo.{' '}
            <button
              type="button"
              onClick={() => void onRetry()}
              className="font-semibold text-[var(--app-live)] underline"
            >
              Réessayer
            </button>
          </p>
        ) : (
          <GlobeFallback />
        )}
      </main>
      <footer
        className="safe-b shrink-0 px-4 pb-2"
        style={{ flexBasis: '25%' }}
      >
        <Skeleton width="60%" height="4rem" />
      </footer>
    </>
  );
}

function GlobeFallback() {
  return (
    <span className="hairline-border block aspect-square w-2/3 max-w-72 animate-pulse rounded-full border" />
  );
}
