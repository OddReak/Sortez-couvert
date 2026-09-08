import { useMemo } from 'react';

import { nightRegion, projectOrthographic } from '@/shared/lib/orthographic';

/**
 * Rendu de repli 2D (brief §7.5) : projection orthographique en SVG avec un
 * masque d'ombre calculé par le MÊME code solaire que le globe WebGL
 * (`sun.ts` / `orthographic.ts`). Statique, sans animation, mais complet.
 */
const R = 100;

export function Fallback2D({
  lat,
  lon,
  date,
  label,
}: {
  lat: number;
  lon: number;
  date: Date;
  label: string;
}) {
  const { nightPath, city } = useMemo(() => {
    const region = nightRegion(date, lat, lon, R);
    const path =
      region.length < 3
        ? ''
        : `${region
            .map(
              (p, i) =>
                `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
            )
            .join(' ')} Z`;
    return {
      nightPath: path,
      city: projectOrthographic(lat, lon, lat, lon, R),
    };
  }, [lat, lon, date]);

  return (
    <svg
      viewBox={`${-R - 8} ${-R - 8} ${(R + 8) * 2} ${(R + 8) * 2}`}
      className="h-full w-full"
      role="img"
      aria-label={`${label} — vue de la Terre (rendu 2D)`}
    >
      <defs>
        <radialGradient id="terra-ocean" cx="38%" cy="34%" r="80%">
          <stop offset="0%" stopColor="#2f6096" />
          <stop offset="100%" stopColor="#123049" />
        </radialGradient>
        <clipPath id="terra-globe">
          <circle cx="0" cy="0" r={R} />
        </clipPath>
      </defs>

      <circle cx="0" cy="0" r={R} fill="url(#terra-ocean)" />

      <g clipPath="url(#terra-globe)">
        {nightPath ? (
          <path d={nightPath} fill="#050912" fillOpacity="0.62" />
        ) : null}
      </g>

      <circle
        cx="0"
        cy="0"
        r={R}
        fill="none"
        stroke="#bfdbfe"
        strokeOpacity="0.4"
        strokeWidth="1.5"
      />

      {city.visible ? (
        <circle
          cx={city.x}
          cy={city.y}
          r="3"
          fill="#fbbf24"
          stroke="#0b0f19"
          strokeWidth="1"
        />
      ) : null}
    </svg>
  );
}
