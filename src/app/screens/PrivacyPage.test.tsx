import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PrivacyPage } from './PrivacyPage';

describe('PrivacyPage', () => {
  it('couvre les points RGPD attendus', () => {
    render(<PrivacyPage />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Confidentialité' }),
    ).toBeInTheDocument();
    // Foreca comme destinataire des coordonnées
    expect(screen.getAllByText(/Foreca/).length).toBeGreaterThan(0);
    // stockage local + effacement
    expect(screen.getByText(/Effacer mes lieux/)).toBeInTheDocument();
    // analytics sans cookie
    expect(screen.getByText(/sans cookie/)).toBeInTheDocument();
    // contact = issue GitHub
    const gh = screen.getByRole('link', { name: /issue sur le dépôt GitHub/ });
    expect(gh).toHaveAttribute(
      'href',
      'https://github.com/OddReak/Sortez-couvert',
    );
  });

  it('a un lien retour vers l’application', () => {
    render(<PrivacyPage />);
    expect(
      screen.getByRole('link', { name: /Retour à l’application/ }),
    ).toHaveAttribute('href', '/');
  });
});
