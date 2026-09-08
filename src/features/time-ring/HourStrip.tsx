import {
  followNow,
  getCursorEpoch,
  isFollowingNow,
  setCursorEpoch,
} from '@/features/time-ring/cursor';
import { useCursorEpoch } from '@/features/time-ring/useCursor';
import { decodeSymbol } from '@/shared/lib/symbols';
import { formatClock, nowSeconds } from '@/shared/lib/time';
import { formatTemp } from '@/shared/lib/units';
import { WeatherIcon } from '@/shared/ui/WeatherIcon';
import type { TimeStep } from '@/shared/types/domain';

/**
 * Alternative non gestuelle obligatoire à la bague (brief §8.6) : rangée
 * d'heures scrollable. Affichée quand `prefers-reduced-motion` est actif ou via
 * les réglages. Pilote le même curseur temporel que la bague.
 */
export function HourStrip({
  hourly,
  timezone,
}: {
  hourly: TimeStep[];
  timezone: string;
}) {
  useCursorEpoch(); // suit le curseur pour l'état actif
  const now = nowSeconds();
  const active = getCursorEpoch();

  return (
    <div
      className="flex snap-x gap-1.5 overflow-x-auto px-4 pb-1"
      role="group"
      aria-label="Choisir l’heure"
    >
      {hourly.map((step) => {
        const isActive = Math.abs(step.epoch - active) < 1800;
        const isNow = Math.abs(step.epoch - now) < 1800;
        return (
          <button
            key={step.epoch}
            type="button"
            onClick={() => {
              if (isNow) followNow();
              else setCursorEpoch(step.epoch, false);
            }}
            aria-pressed={isActive}
            aria-current={isNow && isFollowingNow() ? 'true' : undefined}
            aria-label={`${
              isNow ? 'Maintenant' : formatClock(step.epoch, timezone)
            }, ${formatTemp(step.temp)}, ${step.phrase ?? ''}`}
            className={`flex min-w-14 shrink-0 snap-start flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-colors ${
              isActive ? 'chip-active font-semibold' : 'ink-muted'
            }`}
          >
            <span className="text-xs tabular-nums">
              {isNow ? 'Maintenant' : formatClock(step.epoch, timezone)}
            </span>
            <WeatherIcon
              code={step.symbol}
              size={20}
              aria-hidden
              className={decodeSymbol(step.symbol).isNight ? 'opacity-90' : ''}
            />
            <span className="text-sm tabular-nums">
              {formatTemp(step.temp)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
