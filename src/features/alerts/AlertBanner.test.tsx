import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import type { Warning } from '@/shared/types/domain';

import { AlertBanner } from './AlertBanner';

const make = (over: Partial<Warning>): Warning => ({
  id: 'w1',
  event: 'Vent violent',
  headline: 'Rafales à 100 km/h',
  description: 'Passage venteux en soirée.',
  severity: 'moderate',
  color: 'orange',
  onset: '2026-09-09T18:00:00+02:00',
  expires: '2026-09-09T23:00:00+02:00',
  source: 'Foreca',
  ...over,
});

describe('AlertBanner', () => {
  it('ne rend rien sans alerte (cas prod)', () => {
    const { container } = render(
      <AlertBanner warnings={[]} timezone="Europe/Paris" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche l’alerte la plus grave et le nombre d’alertes en plus', () => {
    render(
      <AlertBanner
        warnings={[
          make({ id: 'a', event: 'Orages', color: 'yellow' }),
          make({ id: 'b', event: 'Vent violent', color: 'orange' }),
        ]}
        timezone="Europe/Paris"
      />,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Vent violent');
    expect(button).toHaveTextContent('+1 autre');
  });

  it('ouvre la sheet de détail au tap', async () => {
    render(<AlertBanner warnings={[make({})]} timezone="Europe/Paris" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Vent violent/ }));
    const dialog = screen.getByRole('dialog', { name: 'Alerte météo' });
    expect(dialog).toHaveTextContent('Rafales à 100 km/h');
    expect(dialog).toHaveTextContent('Vigilance orange');
  });
});
