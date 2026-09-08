import { Suspense, lazy, useEffect, useState } from 'react';

import { Fallback2D } from './Fallback2D';
import { isWebglAvailable, prefersReducedMotion } from './webglSupport';

const GlobeCanvas = lazy(() => import('./GlobeCanvas'));

export type GlobeProps = {
  lat: number;
  lon: number;
  /** Instant affiché (secondes epoch). */
  atEpoch: number;
  /** % de nébulosité (0–100), ou null. */
  cloudiness: number | null;
  label: string;
};

/**
 * Point d'entrée du globe. Ne tire PAS three : `GlobeCanvas` (et donc le chunk
 * three) n'est chargé que si on rend réellement en WebGL. Bascule sur le
 * fallback 2D si WebGL est indisponible, si le contexte est perdu, ou si
 * `prefers-reduced-motion` est actif (brief §7.5).
 */
export default function Globe({
  lat,
  lon,
  atEpoch,
  cloudiness,
  label,
}: GlobeProps) {
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
    return (
      <Fallback2D
        lat={lat}
        lon={lon}
        date={new Date(atEpoch * 1000)}
        label={label}
      />
    );
  }

  return (
    <Suspense fallback={<GlobePlaceholder />}>
      <GlobeCanvas
        lat={lat}
        lon={lon}
        atEpoch={atEpoch}
        cloudiness={cloudiness}
        reducedMotion={prefersReducedMotion()}
        onContextLost={() => {
          setUse2D(true);
        }}
      />
    </Suspense>
  );
}

function GlobePlaceholder() {
  return (
    <div className="grid h-full w-full place-items-center">
      <span className="hairline-border block aspect-square w-4/5 animate-pulse rounded-full border" />
    </div>
  );
}
