import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { TimeStep, Units, WeatherSnapshot } from '@/shared/types/domain';

import { MetricGrid, buildRows } from './MetricGrid';

const units: Units = { temp: 'C', wind: 'KMH' };

const step = (over: Partial<TimeStep> = {}): TimeStep => ({
  time: '',
  epoch: 0,
  symbol: 'd200',
  phrase: null,
  temp: 21,
  feelsLike: 20,
  humidity: 68,
  windSpeed: 14,
  windDir: 250,
  windDirLabel: 'NO',
  gust: 22,
  precipProb: 10,
  precipAccum: 0,
  precipType: null,
  cloudiness: 40,
  uvIndex: 4,
  pressure: 1015,
  visibility: 10000,
  ...over,
});

const snapshot = (aqi: number | null): WeatherSnapshot =>
  ({
    airQuality: aqi === null ? [] : [{ time: '', aqi, pollutant: 'O3' }],
  }) as WeatherSnapshot;

describe('MetricGrid', () => {
  it('affiche vent, humidité, UV et qualité de l’air', () => {
    render(<MetricGrid step={step()} units={units} snapshot={snapshot(42)} />);
    expect(screen.getByText('14 km/h')).toBeInTheDocument();
    expect(screen.getByText('68 %')).toBeInTheDocument();
    expect(screen.getByText('Bonne')).toBeInTheDocument(); // AQI 42
  });

  it('affiche « — » pour les valeurs nulles, jamais NaN/0', () => {
    const rows = buildRows(
      step({ windSpeed: null, humidity: null, uvIndex: null }),
      units,
      snapshot(null),
    );
    expect(rows.find((r) => r.key === 'wind')?.value).toBe('—');
    expect(rows.find((r) => r.key === 'humidity')?.value).toBe('—');
    expect(rows.find((r) => r.key === 'uv')?.value).toBe('—');
    expect(rows.find((r) => r.key === 'aqi')?.value).toBe('—');
  });

  it('sans onSelect : lignes non interactives (pas de bouton)', () => {
    render(<MetricGrid step={step()} units={units} snapshot={snapshot(42)} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('avec onSelect : chaque ligne est un bouton nommé qui remonte sa clé', async () => {
    const onSelect = vi.fn();
    render(
      <MetricGrid
        step={step()}
        units={units}
        snapshot={snapshot(42)}
        onSelect={onSelect}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: /Détail : Vent/ }),
    );
    expect(onSelect).toHaveBeenCalledWith('wind');

    await userEvent.click(
      screen.getByRole('button', { name: /Détail : Qualité de l'air/ }),
    );
    expect(onSelect).toHaveBeenCalledWith('aqi');
  });
});
