import { ChevronRight, TriangleAlert } from 'lucide-react';
import { useState } from 'react';

import type { Warning } from '@/shared/types/domain';

import { AlertSheet } from './AlertSheet';
import { alertMeta, mostSevere } from './alertMeta';

/**
 * Bandeau d'alerte non intrusif (brief §9.9). Rendu `null` quand il n'y a pas
 * d'alerte — le cas normal en production (endpoint Foreca 403).
 */
export function AlertBanner({
  warnings,
  timezone,
}: {
  warnings: Warning[];
  timezone: string;
}) {
  const [open, setOpen] = useState(false);
  const lead = mostSevere(warnings);
  if (!lead) return null;

  const meta = alertMeta(lead);
  const extra = warnings.length - 1;

  return (
    <div className="px-4">
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        className="hairline-border flex min-h-11 w-full items-center gap-2 rounded-xl border-l-4 bg-[var(--app-surface)] py-1.5 pr-2 pl-3 text-left"
        style={{ borderLeftColor: meta.colorVar }}
      >
        <TriangleAlert
          size={16}
          className="shrink-0"
          style={{ color: meta.colorVar }}
          aria-hidden
        />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {lead.event}
          {extra > 0 ? (
            <span className="ink-muted font-normal">
              {' '}
              +{extra} autre{extra > 1 ? 's' : ''}
            </span>
          ) : null}
        </span>
        <span className="sr-only">{meta.levelLabel} — voir le détail</span>
        <ChevronRight size={16} className="ink-faint shrink-0" aria-hidden />
      </button>

      <AlertSheet
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        warnings={warnings}
        timezone={timezone}
      />
    </div>
  );
}
