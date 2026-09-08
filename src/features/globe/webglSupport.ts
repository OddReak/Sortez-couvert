/**
 * Décide si on rend le globe WebGL ou le fallback 2D (brief §7.5).
 */
export function isWebglAvailable(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') ?? canvas.getContext('webgl')),
    );
  } catch {
    return false;
  }
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Textures 4096 seulement si écran dense ET connexion non « save-data ». */
export function useHighResTextures(): boolean {
  if (typeof window === 'undefined') return false;
  const dense = window.devicePixelRatio * window.screen.width > 1200;
  const nav = window.navigator as Navigator & {
    connection?: { saveData?: boolean };
  };
  return dense && !nav.connection?.saveData;
}
