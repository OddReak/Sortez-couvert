import { useEffect } from 'react';

import { useSettings } from '@/features/settings/store';
import { forcedPaint, type ThemePaint } from '@/shared/lib/theme';

function ensureThemeColorMeta(): HTMLMetaElement {
  let meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  return meta;
}

/**
 * Applique le thème calculé aux variables CSS et à `<meta name="theme-color">`
 * (pour que la barre d'état iOS suive — brief §5.2). Respecte l'override
 * manuel Auto / Clair / Sombre.
 */
export function useApplyTheme(paint: ThemePaint | null): void {
  const override = useSettings((s) => s.themeOverride);

  useEffect(() => {
    if (!paint) return;

    const effective =
      override === 'light'
        ? forcedPaint('light')
        : override === 'dark'
          ? forcedPaint('dark')
          : paint;

    const root = document.documentElement;
    root.dataset.scheme = effective.scheme;
    root.style.setProperty('--app-ambient', effective.ambient);
    root.style.setProperty('--app-surface', effective.surface);
    root.style.setProperty('--app-ink', effective.ink);
    root.style.setProperty('--app-dayness', effective.dayness.toFixed(3));

    ensureThemeColorMeta().setAttribute('content', effective.themeColor);
  }, [paint, override]);
}
