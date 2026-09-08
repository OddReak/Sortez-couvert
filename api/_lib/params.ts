/**
 * Validation des paramètres de requête entrants sur `/api/*`.
 *
 * Ces schémas décrivent NOTRE contrat public (pas celui de Foreca) : bornes
 * lat/lon, liste blanche des langues et unités (brief §4.3, étape 1).
 */
import { z } from 'zod';

export const LANGS = ['fr', 'en'] as const;
export const TEMP_UNITS = ['C', 'F'] as const;
export const WIND_UNITS = ['KMH', 'MS', 'MPH'] as const;

const latitude = z.coerce.number().min(-90).max(90);
const longitude = z.coerce.number().min(-180).max(180);

export const weatherQuerySchema = z.object({
  lat: latitude,
  lon: longitude,
  lang: z.enum(LANGS).default('fr'),
  tempunit: z.enum(TEMP_UNITS).default('C'),
  windunit: z.enum(WIND_UNITS).default('KMH'),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(120),
  lang: z.enum(LANGS).default('fr'),
});

export type WeatherQuery = z.infer<typeof weatherQuerySchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;

export class BadRequestError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super('Paramètres de requête invalides');
    this.name = 'BadRequestError';
    this.issues = issues;
  }
}

function parse<T>(schema: z.ZodType<T>, raw: URLSearchParams): T {
  const result = schema.safeParse(Object.fromEntries(raw));
  if (!result.success) {
    throw new BadRequestError(
      result.error.issues.map(
        (i) => `${i.path.join('.') || '(racine)'}: ${i.message}`,
      ),
    );
  }
  return result.data;
}

export const parseWeatherQuery = (raw: URLSearchParams): WeatherQuery =>
  parse(weatherQuerySchema, raw);

export const parseSearchQuery = (raw: URLSearchParams): SearchQuery =>
  parse(searchQuerySchema, raw);
