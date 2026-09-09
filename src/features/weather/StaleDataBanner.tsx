import { CloudOff } from 'lucide-react';

import { formatDayTime, nowSeconds } from '@/shared/lib/time';

/** Au-delà de ce délai, on prévient que les données ne sont plus fraîches. */
const STALE_AFTER_SECONDS = 20 * 60;

export function isStale(fetchedAtSeconds: number, now = nowSeconds()): boolean {
  return now - fetchedAtSeconds > STALE_AFTER_SECONDS;
}

/**
 * Bandeau « Données du … » — affiché quand le dernier relevé date (hors ligne,
 * ou simplement périmé). L'app ne montre jamais d'écran blanc sans réseau
 * (brief §9.11).
 */
export function StaleDataBanner({
  fetchedAtMs,
  timezone,
}: {
  fetchedAtMs: number;
  timezone: string;
}) {
  const fetchedAtSeconds = Math.floor(fetchedAtMs / 1000);
  if (!isStale(fetchedAtSeconds)) return null;

  return (
    <div className="px-4">
      <p className="ink-muted flex items-center justify-center gap-1.5 text-xs">
        <CloudOff size={13} aria-hidden />
        <span className="tabular-nums">
          Données du {formatDayTime(fetchedAtSeconds, timezone)}
        </span>
      </p>
    </div>
  );
}
