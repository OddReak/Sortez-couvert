import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { DayStep, Place, WeatherSnapshot } from '@/shared/types/domain';

import { DailyForecastSheet } from './DailyForecastSheet';

const PLACE: Place = {
  id: '48.8566,2.3522',
  name: 'Paris',
  country: 'France',
  adminArea: 'Île-de-France',
  lat: 48.8566,
  lon: 2.3522,
  timezone: 'Europe/Paris',
};

const day = (over: Partial<DayStep>): DayStep => ({
  date: '2026-09-08',
  sunrise: null,
  sunset: null,
  sunriseEpoch: null,
  sunsetEpoch: null,
  minTemp: 12,
  maxTemp: 22,
  symbol: 'd000',
  phrase: 'clair',
  precipProb: 10,
  precipAccum: 0,
  uvIndex: 4,
  moonPhase: 0.5,
  confidence: 'g',
  ...over,
});

function renderSeeded(daily: DayStep[]) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
    },
  });
  const snapshot = { place: PLACE, daily } as WeatherSnapshot;
  client.setQueryData(['weather', PLACE.id, 'fr', 'C', 'KMH'], snapshot);
  return render(
    <QueryClientProvider client={client}>
      <DailyForecastSheet open onClose={vi.fn()} place={PLACE} />
    </QueryClientProvider>,
  );
}

describe('DailyForecastSheet', () => {
  it('affiche au plus 7 jours avec min/max, pluie et confiance', () => {
    renderSeeded(
      Array.from({ length: 10 }, (_, i) =>
        day({
          date: `2026-09-${String(8 + i).padStart(2, '0')}`,
          minTemp: 10 + i,
          maxTemp: 20 + i,
          confidence: i < 3 ? 'g' : i < 6 ? 'y' : 'o',
        }),
      ),
    );

    const dialog = screen.getByRole('dialog', { name: '7 jours' });
    expect(dialog).toHaveTextContent("Aujourd'hui");
    expect(dialog).toHaveTextContent('Demain');
    // 7 lignes seulement
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
    // confiance rendue avec un libellé accessible
    expect(screen.getAllByText('(Prévision fiable)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('(Prévision incertaine)').length).toBe(1);
  });

  it('état vide quand aucune donnée journalière', () => {
    renderSeeded([]);
    expect(
      screen.getByText(/Prévisions journalières indisponibles/),
    ).toBeInTheDocument();
  });
});
