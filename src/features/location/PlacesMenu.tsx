import { useState } from 'react';

import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  MapPin,
  Star,
  Trash2,
} from 'lucide-react';

import { DailyForecastSheet } from '@/features/forecast/DailyForecastSheet';
import { SettingsSheet } from '@/features/settings/SettingsSheet';
import { Sheet } from '@/shared/ui/Sheet';
import type { Place } from '@/shared/types/domain';

import { MAX_FAVORITES, usePlaces } from './placesStore';

export function PlacesMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const current = usePlaces((s) => s.current);
  const favorites = usePlaces((s) => s.favorites);
  const setCurrent = usePlaces((s) => s.setCurrent);
  const addFavorite = usePlaces((s) => s.addFavorite);
  const removeFavorite = usePlaces((s) => s.removeFavorite);
  const reorder = usePlaces((s) => s.reorderFavorites);
  const [settings, setSettings] = useState(false);
  const [forecast, setForecast] = useState(false);

  const currentIsFav =
    current !== null && favorites.some((f) => f.id === current.id);

  const pick = (place: Place): void => {
    setCurrent(place);
    onClose();
  };

  return (
    <>
      <Sheet open={open} onClose={onClose} title="Mes lieux">
        {current && !currentIsFav && favorites.length < MAX_FAVORITES ? (
          <button
            type="button"
            onClick={() => addFavorite(current)}
            className="mb-3 flex w-full items-center gap-2 rounded-xl bg-[var(--app-live)] px-3 py-2.5 text-sm font-semibold text-[var(--app-surface)]"
          >
            <Star size={16} aria-hidden />
            Ajouter {current.name} aux favoris
          </button>
        ) : null}

        {favorites.length === 0 ? (
          <p className="ink-muted py-4 text-sm">
            Aucun favori. Ajoute une ville depuis la recherche ou ce menu.
          </p>
        ) : (
          <ul className="hairline-border flex flex-col divide-y">
            {favorites.map((place, i) => {
              const active = current?.id === place.id;
              return (
                <li
                  key={place.id}
                  className="flex items-center gap-1 py-1.5"
                  aria-current={active ? 'true' : undefined}
                >
                  <button
                    type="button"
                    onClick={() => {
                      pick(place);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
                  >
                    <MapPin
                      size={16}
                      className={
                        active ? 'text-[var(--app-live)]' : 'ink-faint'
                      }
                      aria-hidden
                    />
                    <span className="truncate">
                      <span className={active ? 'font-semibold' : ''}>
                        {place.name}
                      </span>
                      <span className="ink-muted ml-1.5 text-xs">
                        {place.country}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-label={`Monter ${place.name}`}
                    disabled={i === 0}
                    onClick={() => {
                      reorder(i, i - 1);
                    }}
                    className="grid size-8 place-items-center disabled:opacity-30"
                  >
                    <ChevronUp size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Descendre ${place.name}`}
                    disabled={i === favorites.length - 1}
                    onClick={() => {
                      reorder(i, i + 1);
                    }}
                    className="grid size-8 place-items-center disabled:opacity-30"
                  >
                    <ChevronDown size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Retirer ${place.name} des favoris`}
                    onClick={() => {
                      removeFavorite(place.id);
                    }}
                    className="grid size-8 place-items-center text-[var(--color-warn-red)]"
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {current ? (
          <button
            type="button"
            onClick={() => {
              setForecast(true);
            }}
            className="mt-4 flex w-full items-center gap-2 rounded-xl py-3 text-left text-sm font-semibold"
          >
            <CalendarDays size={16} aria-hidden />
            Prévisions 7 jours
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => {
            setSettings(true);
          }}
          className="w-full rounded-xl py-3 text-left text-sm font-semibold"
        >
          Réglages
        </button>
      </Sheet>

      {current ? (
        <DailyForecastSheet
          open={forecast}
          onClose={() => {
            setForecast(false);
          }}
          place={current}
        />
      ) : null}

      <SettingsSheet
        open={settings}
        onClose={() => {
          setSettings(false);
        }}
      />
    </>
  );
}
