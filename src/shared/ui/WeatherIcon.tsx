import type { ReactNode, SVGProps } from 'react';

import { decodeSymbol, type WeatherIconName } from '@/shared/lib/symbols';

/**
 * Icônes météo filaires maison (brief §5.4 / §4.4) — stroke 1.5, sans
 * remplissage lourd. Remplaçables par le jeu officiel Foreca plus tard.
 */

const CLOUD =
  'M7 18a4 4 0 0 1 0-8 5.5 5.5 0 0 1 10.6-1.3A3.8 3.8 0 0 1 17.5 18Z';

function Sun() {
  return (
    <>
      <circle cx="12" cy="12" r="4" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="12"
          y1="3"
          x2="12"
          y2="5.5"
          transform={`rotate(${String(deg)} 12 12)`}
        />
      ))}
    </>
  );
}

function Moon() {
  return <path d="M17 15A6.5 6.5 0 1 1 10 5a5 5 0 0 0 7 10Z" />;
}

const ICONS: Record<WeatherIconName, () => ReactNode> = {
  'clear-day': () => <Sun />,
  'clear-night': () => <Moon />,
  'partly-day': () => (
    <>
      <circle cx="8.5" cy="7.5" r="2.8" />
      <path d="M8.5 2v1.6M3.6 7.5H2M12 3.9l-1 1M5 5l-1-1" />
      <path d={CLOUD} />
    </>
  ),
  'partly-night': () => (
    <>
      <path d="M11 7.5A3.5 3.5 0 0 1 9.2 3a4 4 0 1 0 4.6 6" />
      <path d={CLOUD} />
    </>
  ),
  cloudy: () => <path d={CLOUD} />,
  overcast: () => (
    <>
      <path d="M6 15a3.2 3.2 0 0 1 .3-6.4A4.6 4.6 0 0 1 15 7.2 3.2 3.2 0 0 1 15.5 15Z" />
      <path d="M9 19h9" />
    </>
  ),
  fog: () => (
    <>
      <path d={CLOUD} />
      <path d="M6 21h12M8 18.5h9" />
    </>
  ),
  drizzle: () => (
    <>
      <path d={CLOUD} />
      <path d="M9 20l-1 2M13 20l-1 2" />
    </>
  ),
  rain: () => (
    <>
      <path d={CLOUD} />
      <path d="M8 20l-1.5 3M12 20l-1.5 3M16 20l-1.5 3" />
    </>
  ),
  'heavy-rain': () => (
    <>
      <path d={CLOUD} />
      <path d="M7 19l-2 4M11 19l-2 4M15 19l-2 4M19 19l-2 4" />
    </>
  ),
  sleet: () => (
    <>
      <path d={CLOUD} />
      <path d="M9 20l-1.5 3" />
      <circle cx="14" cy="21.5" r="0.6" />
    </>
  ),
  snow: () => (
    <>
      <path d={CLOUD} />
      <path d="M8 21h.01M12 22h.01M16 21h.01M10 23h.01M14 20h.01" />
    </>
  ),
  thunder: () => (
    <>
      <path d={CLOUD} />
      <path d="M13 18l-3 4h3l-1 3" />
    </>
  ),
};

export type WeatherIconProps = SVGProps<SVGSVGElement> & {
  /** Code symbole Foreca (`dNNN` / `nNNN`). */
  code: string;
  /** Libellé accessible (`symbolPhrase` Foreca). */
  label?: string | null;
  size?: number;
};

export function WeatherIcon({
  code,
  label,
  size = 24,
  ...props
}: WeatherIconProps) {
  const { icon } = decodeSymbol(code);

  return (
    <svg
      viewBox="0 0 24 26"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      {...props}
    >
      {ICONS[icon]()}
    </svg>
  );
}
