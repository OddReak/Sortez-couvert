import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HelpPage } from './HelpPage';

describe('HelpPage', () => {
  it('explique l’installation iOS et Android', () => {
    render(<HelpPage />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Aide' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ajouter à l’écran d’accueil/)).toBeInTheDocument();
    expect(screen.getByText(/bouton « Installer »/)).toBeInTheDocument();
    // usage de la bague + hors ligne
    expect(
      screen.getByText(/tournez-la pour avancer ou reculer/),
    ).toBeInTheDocument();
    expect(screen.getByText(/hors ligne/)).toBeInTheDocument();
  });

  it('renvoie vers l’app et la confidentialité', () => {
    render(<HelpPage />);
    expect(
      screen.getByRole('link', { name: /Retour à l’application/ }),
    ).toHaveAttribute('href', '/');
    expect(
      screen.getByRole('link', { name: 'Confidentialité' }),
    ).toHaveAttribute('href', '/confidentialite');
  });
});
