import { useEffect, useId, useRef, type ReactNode } from 'react';

import { usePrefersReducedMotion } from '@/shared/lib/useMediaQuery';

/**
 * Bottom sheet : panneau montant du bas, `role="dialog"` modal.
 * Ferme au backdrop, à Échap, ou au bouton. Sans dépendance d'animation.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prevFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="safe-b safe-x relative mx-auto flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-2xl bg-[var(--app-surface)] text-[var(--app-ink)] shadow-2xl outline-none"
        style={
          reduced ? undefined : { animation: 'terra-sheet-in 220ms ease-out' }
        }
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 id={titleId} className="text-lg font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid size-9 place-items-center rounded-full text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}
