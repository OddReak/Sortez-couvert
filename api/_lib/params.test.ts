import { describe, expect, it } from 'vitest';

import { BadRequestError, parseSearchQuery, parseWeatherQuery } from './params';

const sp = (obj: Record<string, string>): URLSearchParams =>
  new URLSearchParams(obj);

describe('parseWeatherQuery', () => {
  it('accepte des coordonnées valides et applique les défauts', () => {
    expect(parseWeatherQuery(sp({ lat: '48.8566', lon: '2.3522' }))).toEqual({
      lat: 48.8566,
      lon: 2.3522,
      lang: 'fr',
      tempunit: 'C',
      windunit: 'KMH',
    });
  });

  it('respecte les valeurs fournies dans la liste blanche', () => {
    expect(
      parseWeatherQuery(
        sp({
          lat: '0',
          lon: '0',
          lang: 'en',
          tempunit: 'F',
          windunit: 'MPH',
        }),
      ),
    ).toMatchObject({ lang: 'en', tempunit: 'F', windunit: 'MPH' });
  });

  it('rejette une latitude hors bornes', () => {
    expect(() => parseWeatherQuery(sp({ lat: '91', lon: '0' }))).toThrow(
      BadRequestError,
    );
  });

  it('rejette une longitude non numérique', () => {
    expect(() => parseWeatherQuery(sp({ lat: '0', lon: 'abc' }))).toThrow(
      BadRequestError,
    );
  });

  it('rejette une unité hors liste blanche', () => {
    expect(() =>
      parseWeatherQuery(sp({ lat: '0', lon: '0', tempunit: 'K' })),
    ).toThrow(BadRequestError);
  });

  it('rejette des coordonnées manquantes et liste les problèmes', () => {
    try {
      parseWeatherQuery(sp({}));
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
      expect((err as BadRequestError).issues.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('parseSearchQuery', () => {
  it('nettoie la requête et applique la langue par défaut', () => {
    expect(parseSearchQuery(sp({ q: '  Paris  ' }))).toEqual({
      q: 'Paris',
      lang: 'fr',
    });
  });

  it('rejette une requête vide', () => {
    expect(() => parseSearchQuery(sp({ q: '   ' }))).toThrow(BadRequestError);
  });
});
