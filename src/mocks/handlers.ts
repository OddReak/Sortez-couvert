import { http, HttpResponse, type RequestHandler } from 'msw';

import airQuality from './fixtures/air-quality.json';
import current from './fixtures/current.json';
import daily from './fixtures/forecast-daily.json';
import hourly from './fixtures/forecast-hourly.json';
import locationMeta from './fixtures/location-meta.json';
import locationSearch from './fixtures/location-search.json';
import warning403 from './fixtures/warning-403.json';
import weatherSnapshot from './fixtures/weather-snapshot.json';
import { rebaseSnapshot } from './rebase';
import type { WeatherSnapshot } from '@/shared/types/domain';

/**
 * Mock de Foreca (niveau serveur) à partir des fixtures dérivées de la sonde
 * (brief §13). En dev et en test, aucun appel ne sort vers `foreca.net`.
 */
const FORECA = 'https://weatherapi.foreca.net/api/v1';

export const forecaHandlers: RequestHandler[] = [
  http.get(`${FORECA}/location/search/:query`, () =>
    HttpResponse.json(locationSearch),
  ),
  http.get(`${FORECA}/location/:loc`, () => HttpResponse.json(locationMeta)),
  http.get(`${FORECA}/current/:loc`, () => HttpResponse.json(current)),
  http.get(`${FORECA}/forecast/hourly/:loc`, () => HttpResponse.json(hourly)),
  http.get(`${FORECA}/forecast/daily/:loc`, () => HttpResponse.json(daily)),
  http.get(`${FORECA}/air-quality/forecast/hourly/:loc`, () =>
    HttpResponse.json(airQuality),
  ),
  http.get(`${FORECA}/warning/:loc`, () =>
    HttpResponse.json(warning403, { status: 403 }),
  ),
];

/**
 * Mock du proxy `/api/*` (niveau navigateur) — il n'y a pas de Vercel Function
 * en `vite dev`. Sert un `WeatherSnapshot` normalisé prêt à afficher.
 */
export const apiHandlers: RequestHandler[] = [
  http.get('*/api/weather', () =>
    HttpResponse.json(rebaseSnapshot(weatherSnapshot as WeatherSnapshot)),
  ),
  http.get('*/api/place', ({ request }) => {
    const url = new URL(request.url);
    const lat = Number(url.searchParams.get('lat'));
    const lon = Number(url.searchParams.get('lon'));
    return HttpResponse.json({
      id: `${lat.toFixed(4)},${lon.toFixed(4)}`,
      name: 'Paris',
      country: 'France',
      adminArea: 'Île-de-France',
      lat,
      lon,
      timezone: 'Europe/Paris',
    });
  }),
  http.get('*/api/search', () =>
    HttpResponse.json({
      results: locationSearch.locations.map((l) => ({
        id: `${l.lat.toFixed(4)},${l.lon.toFixed(4)}`,
        name: l.name,
        country: l.country,
        adminArea: l.adminArea ?? null,
        lat: l.lat,
        lon: l.lon,
        timezone: l.timezone,
      })),
    }),
  ),
  http.get('*/api/health', () => HttpResponse.json({ ok: true })),
];

export const handlers: RequestHandler[] = [...forecaHandlers, ...apiHandlers];
