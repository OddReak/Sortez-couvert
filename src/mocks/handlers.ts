import { http, HttpResponse, type RequestHandler } from 'msw';

import airQuality from './fixtures/air-quality.json';
import current from './fixtures/current.json';
import daily from './fixtures/forecast-daily.json';
import hourly from './fixtures/forecast-hourly.json';
import locationMeta from './fixtures/location-meta.json';
import locationSearch from './fixtures/location-search.json';
import warning403 from './fixtures/warning-403.json';

/**
 * Mock de Foreca à partir des fixtures dérivées de la sonde réelle
 * (brief §13). En dev et en test, aucun appel ne sort vers `foreca.net`.
 *
 * Les schémas d'erreur (401, 429, 5xx) se testent au cas par cas via
 * `server.use(...)` — voir `api/_lib/weather-service.test.ts`.
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

export const handlers: RequestHandler[] = [...forecaHandlers];
