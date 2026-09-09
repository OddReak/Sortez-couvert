import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { StaleDataBanner, isStale } from './StaleDataBanner';

const NOW = Math.floor(Date.parse('2026-09-09T12:00:00+02:00') / 1000);

afterEach(() => {
  vi.useRealTimers();
});

describe('isStale', () => {
  it('vrai au-delà de 20 min, faux en deçà', () => {
    expect(isStale(NOW - 25 * 60, NOW)).toBe(true);
    expect(isStale(NOW - 5 * 60, NOW)).toBe(false);
  });
});

describe('StaleDataBanner', () => {
  it('affiche « Données du … » dans le fuseau du lieu quand c’est périmé', () => {
    vi.setSystemTime(NOW * 1000);
    render(
      <StaleDataBanner
        fetchedAtMs={(NOW - 3 * 3600) * 1000}
        timezone="Europe/Paris"
      />,
    );
    expect(screen.getByText(/Données du .+ 09:00/)).toBeInTheDocument();
  });

  it('ne rend rien quand les données sont fraîches', () => {
    vi.setSystemTime(NOW * 1000);
    const { container } = render(
      <StaleDataBanner
        fetchedAtMs={(NOW - 60) * 1000}
        timezone="Europe/Paris"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
