import { useEffect, useRef, useState } from 'react';

import { useSettings } from '@/features/settings/store';
import { Sheet } from '@/shared/ui/Sheet';
import type { Place } from '@/shared/types/domain';

import { fetchSearch } from './api';
import { usePlaces } from './placesStore';

const DEBOUNCE_MS = 300;

export function SearchSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const language = useSettings((s) => s.language);
  const setCurrent = usePlaces((s) => s.setCurrent);
  const addHistory = usePlaces((s) => s.addHistory);
  const history = usePlaces((s) => s.history);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'empty'>(
    'idle',
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const reqId = useRef(0);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQuery('');
      setResults([]);
      setStatus('idle');
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setStatus('idle');
      return;
    }
    setStatus('loading');
    const id = ++reqId.current;
    const timer = setTimeout(() => {
      fetchSearch(q, language)
        .then((places) => {
          if (id !== reqId.current) return;
          setResults(places);
          setStatus(places.length === 0 ? 'empty' : 'idle');
        })
        .catch(() => {
          if (id === reqId.current) setStatus('error');
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [query, language]);

  const choose = (place: Place): void => {
    addHistory(place.name);
    setCurrent(place);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title="Rechercher une ville">
      <label className="sr-only" htmlFor="terra-search-input">
        Nom de ville
      </label>
      <input
        ref={inputRef}
        id="terra-search-input"
        type="search"
        inputMode="search"
        autoComplete="off"
        placeholder="Paris, Lyon, Berlin…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
        }}
        className="hairline-border w-full rounded-xl border bg-transparent px-3 py-2.5 text-base outline-none focus-visible:border-[var(--app-live)]"
      />

      <div className="mt-3">
        {status === 'loading' ? (
          <p className="ink-muted py-2 text-sm">Recherche…</p>
        ) : null}
        {status === 'error' ? (
          <p role="alert" className="py-2 text-sm">
            Recherche indisponible. Réessaie dans un instant.
          </p>
        ) : null}
        {status === 'empty' ? (
          <p className="ink-muted py-2 text-sm">Aucune ville trouvée.</p>
        ) : null}

        {results.length > 0 ? (
          <ul className="flex flex-col">
            {results.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => {
                    choose(place);
                  }}
                  className="hairline-border flex w-full items-baseline gap-2 border-b py-3 text-left last:border-0"
                >
                  <span className="font-semibold">{place.name}</span>
                  <span className="ink-muted text-sm">
                    {[place.adminArea, place.country]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {query.trim().length < 2 && history.length > 0 ? (
          <>
            <p className="ink-muted mt-1 mb-1 text-xs tracking-wide uppercase">
              Recherches récentes
            </p>
            <ul className="flex flex-wrap gap-2">
              {history.map((h) => (
                <li key={h}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery(h);
                    }}
                    className="chip-active rounded-full px-3 py-1.5 text-sm"
                  >
                    {h}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </Sheet>
  );
}
