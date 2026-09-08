import { Suspense, lazy, useEffect, useState } from 'react';

import { getCursorEpoch } from '@/features/time-ring/cursor';
import { useCursorEpoch } from '@/features/time-ring/useCursor';
import type { TimeStep } from '@/shared/types/domain';

import { Fallback2D } from './Fallback2D';
import { isWebglAvailable, prefersReducedMotion } from './webglSupport';

const GlobeCanvas = lazy(() => import('./GlobeCanvas'));

export type GlobeProps = {
  lat: number;
  lon: number;
  /** Pas horaires (−24 h → +72 h) — pour la nébulosité et le fallback. */
  hourly: TimeStep[];
  label: string;
};

/**
 * Point d'entrée du globe. Ne tire PAS three : `GlobeCanvas` (et donc le chunk
 * three) n'est chargé que si on rend réellement en WebGL. Bascule sur le
 * fallback 2D si WebGL est indisponible, si le contexte est perdu, ou si
 * `prefers-reduced-motion` est actif (brief §7.5).
 */
export default function Globe({ lat, lon, hourly, label }: GlobeProps) {
  const [use2D, setUse2D] = useState(
    () => !isWebglAvailable() || prefersReducedMotion(),
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (): void => {
      setUse2D(media.matches || !isWebglAvailable());
    };
    media.addEventListener('change', onChange);
    return () => {
      media.removeEventListener('change', onChange);
    };
  }, []);

  if (use2D) {
    return <Fallback2DConnected lat={lat} lon={lon} label={label} />;
  }

  return (
    <Suspense fallback={<GlobePlaceholder />}>
      <GlobeCanvas
        lat={lat}
        lon={lon}
        hourly={hourly}
        reducedMotion={prefersReducedMotion()}
        onContextLost={() => {
          setUse2D(true);
        }}
      />
    </Suspense>
  );
}

/** Le fallback 2D est statique : il se rafraîchit au rythme lent du curseur. */
function Fallback2DConnected({
  lat,
  lon,
  label,
}: {
  lat: number;
  lon: number;
  label: string;
}) {
  useCursorEpoch(); // re-render ~11 Hz max quand on scrube
  return (
    <Fallback2D
      lat={lat}
      lon={lon}
      date={new Date(getCursorEpoch() * 1000)}
      label={label}
    />
  );
}

function GlobePlaceholder() {
  return (
    <div className="grid h-full w-full place-items-center">
      <span className="hairline-border block aspect-square w-4/5 animate-pulse rounded-full border" />
    </div>
  );
}
