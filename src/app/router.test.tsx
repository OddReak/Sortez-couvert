import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { Link, navigate as rawNavigate, useRoute } from './router';

const navigate = (path: string): void => {
  act(() => {
    rawNavigate(path);
  });
};

afterEach(() => {
  window.history.pushState(null, '', '/');
});

function RouteProbe() {
  return <span data-testid="path">{useRoute()}</span>;
}

describe('router', () => {
  it('useRoute reflète le pathname et suit navigate()', () => {
    render(<RouteProbe />);
    expect(screen.getByTestId('path')).toHaveTextContent('/');

    navigate('/aide');
    expect(screen.getByTestId('path')).toHaveTextContent('/aide');
  });

  it('réagit à popstate (bouton précédent du navigateur)', () => {
    render(<RouteProbe />);
    navigate('/aide');
    act(() => {
      window.history.replaceState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByTestId('path')).toHaveTextContent('/');
  });

  it('<Link> navigue sans recharger et respecte les clics modifiés', async () => {
    render(
      <>
        <Link to="/aide">Aide</Link>
        <RouteProbe />
      </>,
    );

    await userEvent.click(screen.getByRole('link', { name: 'Aide' }));
    expect(screen.getByTestId('path')).toHaveTextContent('/aide');

    navigate('/');
    await userEvent.keyboard('[ControlLeft>]');
    await userEvent.click(screen.getByRole('link', { name: 'Aide' }));
    await userEvent.keyboard('[/ControlLeft]');
    // clic Ctrl → laissé au navigateur, pas de navigation SPA
    expect(screen.getByTestId('path')).toHaveTextContent('/');
  });

  it('navigate() est idempotent sur le même chemin', () => {
    render(<RouteProbe />);
    navigate('/aide');
    const len = window.history.length;
    navigate('/aide');
    expect(window.history.length).toBe(len);
  });
});
