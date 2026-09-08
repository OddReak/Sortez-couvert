import { useState } from 'react';

import { MapPin, Search as SearchIcon } from 'lucide-react';

import { SearchSheet } from './SearchSheet';
import { usePlaces } from './placesStore';
import { useAcquireLocation } from './useAcquireLocation';

/**
 * Écran affiché quand l'onboarding est passé mais qu'aucun lieu n'est retenu
 * (position refusée / indisponible, aucun favori) — brief §9.2.
 */
export function ChooseLocation() {
  const [search, setSearch] = useState(false);
  const [busy, setBusy] = useState(false);
  const geoStatus = usePlaces((s) => s.geoStatus);
  const acquire = useAcquireLocation();

  return (
    <div className="safe-x safe-t safe-b mx-auto flex h-dvh max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <MapPin size={36} className="ink-faint" aria-hidden />
      <div>
        <h1 className="text-xl font-bold">Choisir un lieu</h1>
        <p className="ink-muted mt-1 text-sm text-pretty">
          {geoStatus === 'denied'
            ? 'La localisation est refusée. Cherchez une ville, ou réactivez-la dans les réglages du navigateur.'
            : 'On n’a pas pu vous localiser. Cherchez une ville pour continuer.'}
        </p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            setSearch(true);
          }}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--app-live)] px-6 py-3.5 font-semibold text-[var(--app-surface)]"
        >
          <SearchIcon size={18} aria-hidden />
          Chercher une ville
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void acquire().finally(() => {
              setBusy(false);
            });
          }}
          className="hairline-border rounded-2xl border px-6 py-3.5 font-semibold disabled:opacity-60"
        >
          {busy ? 'Localisation…' : 'Réessayer la localisation'}
        </button>
      </div>

      <SearchSheet
        open={search}
        onClose={() => {
          setSearch(false);
        }}
      />
    </div>
  );
}
