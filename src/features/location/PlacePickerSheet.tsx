import { MapPin, Search } from 'lucide-react';

import { Sheet } from '@/shared/ui/Sheet';
import type { Place } from '@/shared/types/domain';

import { usePlaces } from './placesStore';

/**
 * Sélecteur de lieu ouvert en tapant le nom de la ville en haut de l'écran
 * (feature connue et intuitive — pas d'indicateur visuel, brief §9.4). Liste le
 * lieu courant et les favoris enregistrés ; renvoie vers la recherche sinon.
 */
export function PlacePickerSheet({
  open,
  onClose,
  onSearch,
}: {
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
}) {
  const current = usePlaces((s) => s.current);
  const favorites = usePlaces((s) => s.favorites);
  const setCurrent = usePlaces((s) => s.setCurrent);

  const places: Place[] = [];
  if (current) places.push(current);
  for (const fav of favorites) {
    if (fav.id !== current?.id) places.push(fav);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Changer de lieu">
      <ul className="hairline-border flex flex-col divide-y">
        {places.map((place) => {
          const active = place.id === current?.id;
          return (
            <li key={place.id}>
              <button
                type="button"
                onClick={() => {
                  setCurrent(place);
                  onClose();
                }}
                aria-current={active ? 'true' : undefined}
                className="flex w-full items-center gap-2 py-3 text-left"
              >
                <MapPin
                  size={16}
                  className={active ? 'text-[var(--app-live)]' : 'ink-faint'}
                  aria-hidden
                />
                <span className={active ? 'font-semibold' : ''}>
                  {place.name}
                </span>
                <span className="ink-muted ml-1 text-xs">{place.country}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => {
          onClose();
          onSearch();
        }}
        className="mt-3 flex w-full items-center gap-2 rounded-xl py-3 text-left text-sm font-semibold"
      >
        <Search size={16} aria-hidden />
        Rechercher une autre ville
      </button>
    </Sheet>
  );
}
