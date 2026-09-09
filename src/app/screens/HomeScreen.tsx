import { Menu, Search } from 'lucide-react';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';

import { AlertBanner } from '@/features/alerts/AlertBanner';
import { PlacesMenu } from '@/features/location/PlacesMenu';
import { SearchSheet } from '@/features/location/SearchSheet';
import { usePlaces } from '@/features/location/placesStore';
import { useSwipePlaces } from '@/features/location/useSwipePlaces';
import { MetricGrid } from '@/features/metrics/MetricGrid';
import { MetricSheet } from '@/features/metrics/MetricSheet';
import type { MetricKey } from '@/features/metrics/metricMeta';
import { useSettings } from '@/features/settings/store';
import { useApplyTheme } from '@/features/theme/useApplyTheme';
import { followNow } from '@/features/time-ring/cursor';
import { HourStrip } from '@/features/time-ring/HourStrip';
import { TimeRing } from '@/features/time-ring/TimeRing';
import { Attribution } from '@/features/weather/Attribution';
import {
  LiveConditionsProvider,
  useLiveConditions,
} from '@/features/weather/LiveConditions';
import { StaleDataBanner } from '@/features/weather/StaleDataBanner';
import { useWeatherSnapshot } from '@/features/weather/useWeather';
import { usePrefersReducedMotion } from '@/shared/lib/useMediaQuery';
import { formatClock, formatDayTime } from '@/shared/lib/time';
import { roundHalfUp } from '@/shared/lib/units';
import { Skeleton } from '@/shared/ui/Skeleton';
import { WeatherIcon } from '@/shared/ui/WeatherIcon';
import type { Place, WeatherSnapshot } from '@/shared/types/domain';

const Globe = lazy(() => import('@/features/globe/Globe'));

export function HomeScreen() {
  const place = usePlaces((s) => s.current);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);

  if (!place) return null; // garanti par <LocationGate>

  return (
    <div className="safe-x mx-auto flex h-dvh max-w-md flex-col bg-[var(--app-ambient)]">
      <PlaceScreen
        key={place.id}
        place={place}
        onOpenMenu={() => {
          setMenu(true);
        }}
        onOpenSearch={() => {
          setSearch(true);
        }}
      />
      <PlacesMenu
        open={menu}
        onClose={() => {
          setMenu(false);
        }}
      />
      <SearchSheet
        open={search}
        onClose={() => {
          setSearch(false);
        }}
      />
    </div>
  );
}

function PlaceScreen({
  place,
  onOpenMenu,
  onOpenSearch,
}: {
  place: Place;
  onOpenMenu: () => void;
  onOpenSearch: () => void;
}) {
  const query = useWeatherSnapshot(place);
  const updateCurrentMeta = usePlaces((s) => s.updateCurrentMeta);
  const swipe = useSwipePlaces();

  // Nouveau lieu → le curseur revient à « maintenant ».
  useEffect(() => {
    followNow();
  }, [place.id]);

  // Affine le nom / fuseau du lieu courant depuis la réponse météo.
  useEffect(() => {
    if (query.data) updateCurrentMeta(query.data.place);
  }, [query.data, updateCurrentMeta]);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto"
      {...swipe}
    >
      {query.data ? (
        <LiveConditionsProvider snapshot={query.data}>
          <ThemeSync />
          <TopBar
            place={place}
            onOpenMenu={onOpenMenu}
            onOpenSearch={onOpenSearch}
          />
          <AlertBanner
            warnings={query.data.warnings}
            timezone={place.timezone}
          />
          <StaleDataBanner
            fetchedAtMs={query.data.fetchedAt}
            timezone={place.timezone}
          />
          <CenterStage place={place} snapshot={query.data} />
          <BottomPanel snapshot={query.data} />
        </LiveConditionsProvider>
      ) : (
        <LoadingLayout
          place={place}
          error={query.isError}
          onRetry={query.refetch}
          onOpenMenu={onOpenMenu}
          onOpenSearch={onOpenSearch}
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

type BarActions = { onOpenMenu: () => void; onOpenSearch: () => void };

function TopButtons({ onOpenMenu, onOpenSearch }: BarActions) {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        aria-label="Ouvrir le menu des lieux"
        onClick={onOpenMenu}
        className="grid size-11 place-items-center"
      >
        <Menu size={22} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Rechercher une ville"
        onClick={onOpenSearch}
        className="grid size-11 place-items-center"
      >
        <Search size={22} aria-hidden="true" />
      </button>
    </div>
  );
}

function TopBar({
  place,
  onOpenMenu,
  onOpenSearch,
}: { place: Place } & BarActions) {
  return (
    <header className="safe-t flex shrink-0 flex-col gap-1 px-4 pt-1">
      <TopButtons onOpenMenu={onOpenMenu} onOpenSearch={onOpenSearch} />
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

// ── CENTER — prend la place restante (fluide, du petit écran au desktop) ───

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
    <main className="flex min-h-[15rem] flex-1 flex-col items-center justify-center gap-2 py-2">
      <p className="ink-muted shrink-0 text-xs tracking-widest uppercase">
        Maintenant
      </p>

      {/* Le globe se dimensionne sur la hauteur disponible (aspect carré),
          plafonné à 20rem, borné en largeur sur les écrans étroits. */}
      <div className="grid min-h-0 w-full flex-1 place-items-center">
        <div className="relative aspect-square h-full max-h-80 max-w-[86%]">
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
    <p className="min-h-5 shrink-0 text-center text-sm font-semibold tabular-nums">
      {isNow
        ? formatClock(atEpoch, timezone)
        : formatDayTime(atEpoch, timezone)}
    </p>
  );
}

// ── BOTTOM — température + métriques + attribution ────────────────────────

function BottomPanel({ snapshot }: { snapshot: WeatherSnapshot }) {
  const [metric, setMetric] = useState<MetricKey | null>(null);
  const units = useSettings((s) => s.units);
  const { atEpoch } = useLiveConditions();

  return (
    <footer className="safe-b flex shrink-0 flex-col gap-2 px-4 pt-1 pb-2">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <HeroTemperature />
        <Metrics snapshot={snapshot} onSelect={setMetric} />
      </div>
      <Attribution data={snapshot.attribution} />

      <MetricSheet
        metricKey={metric}
        onClose={() => {
          setMetric(null);
        }}
        snapshot={snapshot}
        atEpoch={atEpoch}
        units={units}
      />
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
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (value === null || !Number.isFinite(value)) return;
    target.current = value;

    // Mouvement réduit (brief §11) : la valeur saute à la cible, sans ressort.
    if (reduced) {
      current.current = value;
      if (ref.current)
        ref.current.textContent = `${String(roundHalfUp(value))}°`;
      return;
    }

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
  }, [value, reduced]);

  if (value === null || !Number.isFinite(value)) return <>—°</>;
  return <span ref={ref}>{`${String(roundHalfUp(value))}°`}</span>;
}

function Metrics({
  snapshot,
  onSelect,
}: {
  snapshot: WeatherSnapshot;
  onSelect: (key: MetricKey) => void;
}) {
  const { step } = useLiveConditions();
  const units = useSettings((s) => s.units);
  return (
    <MetricGrid
      step={step}
      units={units}
      snapshot={snapshot}
      onSelect={onSelect}
    />
  );
}

// ── Chargement / erreur ───────────────────────────────────────────────────

function LoadingLayout({
  place,
  error,
  onRetry,
  onOpenMenu,
  onOpenSearch,
}: {
  place: Place;
  error: boolean;
  onRetry: () => Promise<unknown>;
} & BarActions) {
  return (
    <>
      <header className="safe-t flex shrink-0 flex-col gap-2 px-4 pt-1">
        <TopButtons onOpenMenu={onOpenMenu} onOpenSearch={onOpenSearch} />
        <h1 className="text-center text-2xl font-bold">{place.name}</h1>
        <p className="flex justify-center">
          <Skeleton width="12rem" height="0.95rem" />
        </p>
      </header>
      <main className="flex min-h-[15rem] flex-1 items-center justify-center p-6">
        {error ? (
          <p role="alert" className="text-center text-sm">
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
      <footer className="safe-b shrink-0 px-4 pb-2">
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
