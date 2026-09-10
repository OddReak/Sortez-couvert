import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { startOfDayEpoch } from '@/shared/lib/time';
import type { DayStep } from '@/shared/types/domain';

import { ForecastCarousel } from './ForecastCarousel';

const TZ = 'Europe/Paris';

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

const week = Array.from({ length: 10 }, (_, i) =>
  day({ date: `2026-09-${String(8 + i).padStart(2, '0')}` }),
);

describe('ForecastCarousel', () => {
  it('n’affiche rien sans données', () => {
    const { container } = render(
      <ForecastCarousel
        days={[]}
        timezone={TZ}
        activeDayStart={0}
        onSelectDay={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('montre 7 jours (sur 10 reçus) et sélectionne le jour au tap', async () => {
    const onSelectDay = vi.fn();
    render(
      <ForecastCarousel
        days={week}
        timezone={TZ}
        activeDayStart={0}
        onSelectDay={onSelectDay}
      />,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(7);

    await userEvent.click(buttons[0]!);
    expect(onSelectDay).toHaveBeenCalledWith('2026-09-08');
  });

  it('marque le jour actif (aria-pressed)', () => {
    render(
      <ForecastCarousel
        days={week}
        timezone={TZ}
        activeDayStart={startOfDayEpoch('2026-09-10', TZ)}
        onSelectDay={vi.fn()}
      />,
    );
    const pressed = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressed).toHaveLength(1);
  });

  it('affiche « — » pour une température absente, jamais NaN', () => {
    render(
      <ForecastCarousel
        days={[day({ maxTemp: null, minTemp: null, precipProb: null })]}
        timezone={TZ}
        activeDayStart={0}
        onSelectDay={vi.fn()}
      />,
    );
    // 3 tirets : max, min, pluie
    expect(screen.getAllByText('—°').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });
});
