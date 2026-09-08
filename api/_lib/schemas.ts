/**
 * Schémas zod des réponses Foreca — DÉRIVÉS de la sonde réelle
 * (`scripts/probe-foreca.mjs`, exécutée le 2026-09-08 sur Paris).
 *
 * Règle brief §4.1 : Foreca renvoie `null` pour une donnée manquante. Les
 * champs de mesure sont donc `.nullable()` même quand la sonde a vu un nombre —
 * une autre localisation ou une autre heure peut renvoyer `null`.
 *
 * Les clés inconnues sont ignorées (Foreca peut en ajouter sans casser le
 * contrat).
 */
import { z } from 'zod';

const num = z.number().nullable();
const str = z.string().nullable();

// ── Localisation (search + meta) ────────────────────────────────────────────

export const forecaLocationSchema = z.object({
  id: z.number(),
  name: z.string(),
  country: z.string(),
  timezone: z.string(),
  language: z.string().optional(),
  state: z.string().optional(),
  adminArea: z.string().nullish(),
  adminArea2: z.string().nullish(),
  adminArea3: z.string().nullish(),
  lon: z.number(),
  lat: z.number(),
});

export const forecaSearchResponseSchema = z.object({
  locations: z.array(forecaLocationSchema),
});

export const forecaLocationMetaSchema = forecaLocationSchema;

// ── Conditions actuelles ───────────────────────────────────────────────────

export const forecaCurrentSchema = z.object({
  time: z.string(),
  symbol: z.string(),
  symbolPhrase: str,
  temperature: num,
  feelsLikeTemp: num,
  relHumidity: num,
  dewPoint: num,
  windSpeed: num,
  windDir: num,
  windDirString: str,
  windGust: num,
  precipProb: num,
  precipRate: num,
  cloudiness: num,
  thunderProb: num,
  uvIndex: num,
  pressure: num,
  visibility: num,
});

export const forecaCurrentResponseSchema = z.object({
  current: forecaCurrentSchema,
});

// ── Prévisions horaires ────────────────────────────────────────────────────

export const forecaHourlyStepSchema = z.object({
  time: z.string(),
  symbol: z.string(),
  symbolPhrase: str,
  temperature: num,
  feelsLikeTemp: num,
  windSpeed: num,
  windGust: num,
  relHumidity: num,
  dewPoint: num,
  windDir: num,
  windDirString: str,
  precipProb: num,
  precipAccum: num,
  snowAccum: num,
  cloudiness: num,
  thunderProb: num,
  uvIndex: num,
  pressure: num,
  visibility: num,
  solarRadiation: num.optional(),
  snowDepth: num.optional(),
  precipType: str,
});

export const forecaHourlyResponseSchema = z.object({
  forecast: z.array(forecaHourlyStepSchema),
});

// ── Prévisions journalières (dataset=full) ─────────────────────────────────

export const forecaDailyStepSchema = z.object({
  date: z.string(),
  symbol: z.string(),
  symbolPhrase: str,
  maxTemp: num,
  minTemp: num,
  maxFeelsLikeTemp: num,
  minFeelsLikeTemp: num,
  maxRelHumidity: num,
  minRelHumidity: num,
  maxDewPoint: num,
  minDewPoint: num,
  precipAccum: num,
  snowAccum: num,
  maxWindSpeed: num,
  windDir: num,
  maxWindGust: num,
  precipProb: num,
  cloudiness: num,
  sunrise: str,
  sunset: str,
  sunriseEpoch: num,
  sunsetEpoch: num,
  moonrise: str,
  moonset: str,
  moonPhase: num,
  uvIndex: num,
  minVisibility: num,
  pressure: num,
  confidence: str,
  solarRadiationSum: num.optional(),
  snowDepth: num.optional(),
  sunhours: num.optional(),
});

export const forecaDailyResponseSchema = z.object({
  forecast: z.array(forecaDailyStepSchema),
});

// ── Qualité de l'air ───────────────────────────────────────────────────────

export const forecaAirQualityStepSchema = z.object({
  time: z.string(),
  pollutant: str,
  pollutantPhrase: str,
  AQI: num,
  AQI_CO: num.optional(),
  AQI_NO2: num.optional(),
  AQI_O3: num.optional(),
  AQI_SO2: num.optional(),
  AQI_PM10: num.optional(),
  AQI_PM2P5: num.optional(),
});

export const forecaAirQualityResponseSchema = z.object({
  forecast: z.array(forecaAirQualityStepSchema),
});

// ── Types dérivés ──────────────────────────────────────────────────────────

export type ForecaLocation = z.infer<typeof forecaLocationSchema>;
export type ForecaCurrent = z.infer<typeof forecaCurrentSchema>;
export type ForecaHourlyStep = z.infer<typeof forecaHourlyStepSchema>;
export type ForecaDailyStep = z.infer<typeof forecaDailyStepSchema>;
export type ForecaAirQualityStep = z.infer<typeof forecaAirQualityStepSchema>;
