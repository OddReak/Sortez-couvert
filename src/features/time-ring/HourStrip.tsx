import { useTimeSelection } from '@/features/time-ring/selectionStore';
import { decodeSymbol } from '@/shared/lib/symbols';
import { formatClock, nowSeconds } from '@/shared/lib/time';
import { formatTemp } from '@/shared/lib/units';
import { WeatherIcon } from '@/shared/ui/WeatherIcon';
import type { TimeStep } from '@/shared/types/domain';

/**
 * Rangée d'heures horizontalement défilable.
 *
 * Sert d'abord d'interface temporelle intérimaire (la bague arrive en Phase 4),
 * et reste ensuite l'**alternative non gestuelle obligatoire** pour VoiceOver /
 * `prefers-reduced-motion` (brief §8.6).
 */
export function HourStrip({
  hourly,
  timezone,
  currentEpoch,
}: {
  hourly: TimeStep[];
  timezone: string;
  currentEpoch: number;
}) {
  const selectedEpoch = useTimeSelection((s) => s.selectedEpoch);
  const select = useTimeSelection((s) => s.select);
  const now = nowSeconds();
  const active = selectedEpoch ?? currentEpoch;

  return (
    <div
      className="flex snap-x gap-1.5 overflow-x-auto px-4 pb-1"
      role="group"
      aria-label="Choisir l’heure"
    >
      {hourly.map((step) => {
        const isActive = Math.abs(step.epoch - active) < 1800;
        const isNow = Math.abs(step.epoch - now) < 1800;
        const { isNight } = decodeSymbol(step.symbol);
        return (
          <button
            key={step.epoch}
            type="button"
            onClick={() => {
              select(isNow ? null : step.epoch);
            }}
            aria-pressed={isActive}
            aria-label={`${
              isNow ? 'Maintenant' : formatClock(step.epoch, timezone)
            }, ${formatTemp(step.temp)}, ${step.phrase ?? ''}`}
            data-night={isNight ? '' : undefined}
            className={`flex min-w-14 shrink-0 snap-start flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-colors ${
              isActive ? 'chip-active font-semibold' : 'ink-muted'
            }`}
          >
            <span className="text-xs tabular-nums">
              {isNow ? 'Maintenant' : formatClock(step.epoch, timezone)}
            </span>
            <WeatherIcon code={step.symbol} size={20} aria-hidden />
            <span className="text-sm tabular-nums">
              {formatTemp(step.temp)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
