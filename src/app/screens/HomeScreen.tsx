import { Menu, Search } from 'lucide-react';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';

import { AlertBanner } from '@/features/alerts/AlertBanner';
import { ForecastCarousel } from '@/features/forecast/ForecastCarousel';
import { PlacePickerSheet } from '@/features/location/PlacePickerSheet';
import { PlacesMenu } from '@/features/location/PlacesMenu';
import { SearchSheet } from '@/features/location/SearchSheet';
import { usePlaces } from '@/features/location/placesStore';
import { MetricGrid } from '@/features/metrics/MetricGrid';
import { MetricSheet } from '@/features/metrics/MetricSheet';
import type { MetricKey } from '@/features/metrics/metricMeta';
import { useSettings } from '@/features/settings/store';
import { useApplyTheme } from '@/features/theme/useApplyTheme';
import {
  configureToday,
  followNow,
  selectDay,
} from '@/features/time-ring/cursor';
import { useActiveDayStart } from '@/features/time-ring/useCursor';
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
import {
  formatClock,
  formatDayTime,
  localDateIso,
  nowSeconds,
  startOfDayEpoch,
} from '@/shared/lib/time';
import { roundHalfUp } from '@/shared/lib/units';
import { Skeleton } from '@/shared/ui/Skeleton';
import { WeatherIcon } from '@/shared/ui/WeatherIcon';
import type { Place, WeatherSnapshot } from '@/shared/types/domain';

const Globe = lazy(() => import('@/features/globe/Globe'));

export function HomeScreen() {
  const place = usePlaces((s) => s.current);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [picker, setPicker] = useState(false);

  if (!place) return null; // garanti par <LocationGate>

  return (
    <div className="safe-x app-h mx-auto flex max-w-md flex-col overflow-hidden bg-[var(--app-ambient)]">
      <PlaceScreen
        key={place.id}
        place={place}
        onOpenMenu={() => {
          setMenu(true);
        }}
        onOpenSearch={() => {
          setSearch(true);
        }}
        onOpenPicker={() => {
          setPicker(true);
        }}
      />
      <PlacesMenu
        open={menu}
        onClose={() => {
          setMenu(false);
        }}
      />
      <PlacePickerSheet
        open={picker}
        onClose={() => {
          setPicker(false);
        }}
        onSearch={() => {
          setSearch(true);
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
  onOpenPicker,
}: {
  place: Place;
  onOpenMenu: () => void;
  onOpenSearch: () => void;
  onOpenPicker: () => void;
}) {
  const query = useWeatherSnapshot(place);
  const updateCurrentMeta = usePlaces((s) => s.updateCurrentMeta);
  const activeDayStart = useActiveDayStart();
  const tz = place.timezone;

  // Nouveau lieu (ou fuseau) → la bague se cale sur « aujourd'hui », en direct.
  useEffect(() => {
    const start = startOfDayEpoch(localDateIso(nowSeconds(), tz), tz);
    configureToday(start, start + 24 * 3600 - 1);
  }, [tz, place.id]);

  // Affine le nom / fuseau du lieu courant depuis la réponse météo. `place.id`
  // en 2ᵉ argument : si Foreca a recalé les coordonnées (géoloc → ville la plus
  // proche), l'`id` résolu diffère et le fuseau de repli resterait sinon figé.
  useEffect(() => {
    if (query.data) updateCurrentMeta(query.data.place, place.id);
  }, [query.data, updateCurrentMeta, place.id]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
      {query.data ? (
        <LiveConditionsProvider snapshot={query.data}>
          <ThemeSync />
          <TopBar
            place={place}
            onOpenMenu={onOpenMenu}
            onOpenSearch={onOpenSearch}
            onOpenPicker={onOpenPicker}
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
          <ForecastCarousel
            days={query.data.daily}
            timezone={place.timezone}
            activeDayStart={activeDayStart}
            onSelectDay={(dateIso) => {
              const start = startOfDayEpoch(dateIso, place.timezone);
              selectDay(start, start + 24 * 3600 - 1);
            }}
          />
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
  onOpenPicker,
}: { place: Place; onOpenPicker: () => void } & BarActions) {
  return (
    <header className="safe-t flex shrink-0 flex-col gap-1 px-4 pt-1">
      <TopButtons onOpenMenu={onOpenMenu} onOpenSearch={onOpenSearch} />
      <h1 className="text-center text-2xl leading-tight font-bold text-balance">
        <button
          type="button"
          onClick={onOpenPicker}
          aria-haspopup="dialog"
          aria-label={`Lieu affiché : ${place.name}. Changer de lieu`}
          className="rounded-lg px-2 py-0.5"
        >
          {place.name}
        </button>
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
    <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-0.5 py-0.5">
      <button
        type="button"
        onClick={() => {
          followNow();
        }}
        aria-label="Revenir à l’heure actuelle"
        className="ink-muted -my-1 shrink-0 rounded px-5 py-2.5 text-xs tracking-widest uppercase"
      >
        Maintenant
      </button>

      {/* Élément principal de l'app : le globe prend toute la hauteur restante
          (carré), la bague affleure les bords (marge minimale). */}
      <div className="grid min-h-0 w-full flex-1 place-items-center px-1">
        <div className="relative aspect-square h-full w-auto max-w-full">
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
    <footer className="safe-b flex shrink-0 flex-col gap-1 px-4 pt-0.5 pb-1.5">
      <div className="flex items-end justify-between gap-x-4">
        <HeroTemperature />
        <div className="min-w-0 flex-1">
          <Metrics snapshot={snapshot} onSelect={setMetric} />
        </div>
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
    <div className="flex shrink-0 flex-col">
      <span
        className="leading-none font-light tabular-nums"
        style={{ fontSize: 'var(--text-temp-hero)' }}
      >
        <SpringTemp value={step.temp} />
      </span>
      <span className="ink-muted text-xs tabular-nums">
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
