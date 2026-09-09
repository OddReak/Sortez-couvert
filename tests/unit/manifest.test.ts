import { describe, expect, it } from 'vitest';

import { pwaManifest } from '@/pwa/manifest';

/**
 * Le manifeste PWA doit rester complet (brief §10.1). La catégorie « PWA » de
 * Lighthouse ayant disparu (Lighthouse 12), c'est ici + l'e2e offline qui
 * garantissent l'installabilité.
 */
describe('pwaManifest', () => {
  it('a les champs obligatoires', () => {
    expect(pwaManifest.name).toBeTruthy();
    expect(pwaManifest.description).toBeTruthy();
    expect(pwaManifest.start_url).toBe('/?source=pwa');
    expect(pwaManifest.scope).toBe('/');
    expect(pwaManifest.display).toBe('standalone');
    expect(pwaManifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(pwaManifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(pwaManifest.lang).toBe('fr');
  });

  it('short_name tient en 12 caractères (§10.1)', () => {
    expect(pwaManifest.short_name).toBeTruthy();
    expect(pwaManifest.short_name!.length).toBeLessThanOrEqual(12);
  });

  it('déclare les raccourcis « Ma position » et « Favoris »', () => {
    const names = (pwaManifest.shortcuts ?? []).map((s) => s.name);
    expect(names).toContain('Ma position');
    expect(names).toContain('Favoris');
  });

  it('catégorie météo', () => {
    expect(pwaManifest.categories).toContain('weather');
  });
});
