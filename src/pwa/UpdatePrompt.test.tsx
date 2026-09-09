import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { UpdatePrompt } from './UpdatePrompt';
import * as reg from './register';

afterEach(() => {
  reg.__resetPwaStatus();
  vi.restoreAllMocks();
});

describe('UpdatePrompt', () => {
  it('rien à afficher quand aucune mise à jour', () => {
    const { container } = render(<UpdatePrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it('affiche le toast et déclenche la mise à jour', async () => {
    vi.spyOn(reg, 'usePwaStatus').mockReturnValue({
      needRefresh: true,
      offlineReady: false,
    });
    const apply = vi.spyOn(reg, 'applyUpdate').mockImplementation(vi.fn());

    render(<UpdatePrompt />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Nouvelle version disponible',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Recharger' }));
    expect(apply).toHaveBeenCalled();
  });
});
