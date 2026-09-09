import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

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
      <ForecastCarousel days={[]} timezone={TZ} onOpenDetail={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('montre 7 jours (sur 10 reçus) et ouvre le détail au tap', async () => {
    const onOpenDetail = vi.fn();
    render(
      <ForecastCarousel
        days={week}
        timezone={TZ}
        onOpenDetail={onOpenDetail}
      />,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(7);

    await userEvent.click(buttons[0]!);
    expect(onOpenDetail).toHaveBeenCalledOnce();
  });

  it('affiche « — » pour une température absente, jamais NaN', () => {
    render(
      <ForecastCarousel
        days={[day({ maxTemp: null, minTemp: null, precipProb: null })]}
        timezone={TZ}
        onOpenDetail={vi.fn()}
      />,
    );
    // 3 tirets : max, min, pluie
    expect(screen.getAllByText('—°').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });
});
