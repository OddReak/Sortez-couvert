import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const noop = vi.fn();

import type {
  AirQualityStep,
  TimeStep,
  Units,
  WeatherSnapshot,
} from '@/shared/types/domain';

import { MetricSheet } from './MetricSheet';

const UNITS: Units = { temp: 'C', wind: 'KMH' };
const NOW = Math.floor(Date.parse('2026-09-08T12:00:00+02:00') / 1000);

const hourly: TimeStep[] = Array.from({ length: 13 }, (_, i) => {
  const epoch = NOW + (i - 6) * 3600;
  return {
    time: new Date(epoch * 1000).toISOString(),
    epoch,
    symbol: 'd200',
    phrase: null,
    temp: 18 + i,
    feelsLike: 17 + i,
    humidity: 50 + i,
    windSpeed: 10 + i,
    windDir: 250,
    windDirLabel: 'O',
    gust: 20,
    precipProb: 5,
    precipAccum: 0,
    precipType: null,
    cloudiness: 40,
    uvIndex: Math.max(0, i - 3),
    pressure: 1015,
    visibility: 10000,
  };
});

const airQuality: AirQualityStep[] = Array.from({ length: 13 }, (_, i) => ({
  time: new Date((NOW + (i - 6) * 3600) * 1000).toISOString(),
  aqi: 20 + i,
  pollutant: 'Ozone',
  subIndices: { o3: 20 + i, pm25: 12, no2: 6 },
}));

const snapshot = {
  place: { timezone: 'Europe/Paris' },
  hourly,
  airQuality,
} as WeatherSnapshot;

describe('MetricSheet', () => {
  it('ne rend rien quand aucune métrique n’est sélectionnée', () => {
    render(
      <MetricSheet
        metricKey={null}
        onClose={noop}
        snapshot={snapshot}
        atEpoch={NOW}
        units={UNITS}
      />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('vent : titre, graphe 24 h et min/max', () => {
    render(
      <MetricSheet
        metricKey="wind"
        onClose={noop}
        snapshot={snapshot}
        atEpoch={NOW}
        units={UNITS}
      />,
    );
    expect(screen.getByRole('dialog', { name: 'Vent' })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /Vent sur 24 heures/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/min .* max/)).toBeInTheDocument();
  });

  it('qualité de l’air : sous-indices EPA et polluant dominant', () => {
    render(
      <MetricSheet
        metricKey="aqi"
        onClose={noop}
        snapshot={snapshot}
        atEpoch={NOW}
        units={UNITS}
      />,
    );
    expect(screen.getByText('Sous-indices EPA')).toBeInTheDocument();
    expect(screen.getByText(/Polluant dominant/)).toBeInTheDocument();
    expect(screen.getByText('Ozone (O₃)')).toBeInTheDocument();
  });
});
