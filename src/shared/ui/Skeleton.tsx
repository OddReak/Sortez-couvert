import type { CSSProperties } from 'react';

/** Bloc de chargement neutre (brief §7.4 « skeleton pendant le chargement »). */
export function Skeleton({
  width,
  height,
  radius = '0.5rem',
  className,
}: {
  width?: string;
  height?: string;
  radius?: string;
  className?: string;
}) {
  const style: CSSProperties = {
    width,
    height,
    borderRadius: radius,
  };
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-pulse bg-current/10 ${className ?? ''}`}
      style={style}
    />
  );
}
