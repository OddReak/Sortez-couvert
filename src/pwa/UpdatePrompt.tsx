import { RefreshCw, X } from 'lucide-react';

import { applyUpdate, dismissUpdate, usePwaStatus } from './register';

/**
 * Toast « Nouvelle version disponible · Recharger » (brief §9.12). Discret, en
 * bas de l'écran, au-dessus de la zone de home. Ne bloque rien.
 */
export function UpdatePrompt() {
  const { needRefresh } = usePwaStatus();
  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="safe-b safe-x fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-3"
    >
      <div className="hairline-border flex w-full max-w-md items-center gap-3 rounded-xl border bg-[var(--app-surface)] px-4 py-3 text-[var(--app-ink)] shadow-lg">
        <RefreshCw size={18} className="ink-faint shrink-0" aria-hidden />
        <p className="flex-1 text-sm font-medium">
          Nouvelle version disponible
        </p>
        <button
          type="button"
          onClick={applyUpdate}
          className="rounded-lg bg-[var(--app-live)] px-3 py-1.5 text-sm font-semibold text-[var(--app-surface)]"
        >
          Recharger
        </button>
        <button
          type="button"
          onClick={dismissUpdate}
          aria-label="Ignorer"
          className="grid size-8 shrink-0 place-items-center"
        >
          <X size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}
