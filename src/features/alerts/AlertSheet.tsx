import { DateTime } from 'luxon';

import { Sheet } from '@/shared/ui/Sheet';
import type { Warning } from '@/shared/types/domain';

import { alertMeta } from './alertMeta';

function formatWindow(
  onset: string | null,
  expires: string | null,
  timezone: string,
): string | null {
  const fmt = (iso: string): string =>
    DateTime.fromISO(iso, { zone: timezone })
      .setLocale('fr')
      .toFormat("cccc d LLL 'à' HH'h'mm");
  if (onset && expires) return `Du ${fmt(onset)} au ${fmt(expires)}`;
  if (onset) return `À partir du ${fmt(onset)}`;
  if (expires) return `Jusqu'au ${fmt(expires)}`;
  return null;
}

export function AlertSheet({
  open,
  onClose,
  warnings,
  timezone,
}: {
  open: boolean;
  onClose: () => void;
  warnings: Warning[];
  timezone: string;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={warnings.length > 1 ? 'Alertes météo' : 'Alerte météo'}
    >
      <ul className="flex flex-col gap-4">
        {warnings.map((warning) => {
          const meta = alertMeta(warning);
          const when = formatWindow(warning.onset, warning.expires, timezone);
          return (
            <li
              key={warning.id}
              className="border-l-4 pl-3"
              style={{ borderColor: meta.colorVar }}
            >
              <p className="ink-muted flex items-center gap-1.5 text-xs font-semibold">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: meta.colorVar }}
                  aria-hidden="true"
                />
                {meta.levelLabel}
              </p>
              <h3 className="text-base font-bold">{warning.event}</h3>
              {warning.headline ? (
                <p className="mt-0.5 text-sm">{warning.headline}</p>
              ) : null}
              {when ? (
                <p className="ink-muted mt-1 text-xs tabular-nums">{when}</p>
              ) : null}
              {warning.description ? (
                <p className="ink-muted mt-2 text-sm">{warning.description}</p>
              ) : null}
              {warning.source ? (
                <p className="ink-muted mt-2 text-[0.6875rem]">
                  Source : {warning.source}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
