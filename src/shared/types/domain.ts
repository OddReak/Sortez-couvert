/**
 * Modèle de domaine TERRA — figé avant tout code UI (brief §4.5).
 *
 * Ce modèle est INDÉPENDANT de la forme des réponses Foreca. Le proxy
 * `/api/weather` normalise Foreca vers ces types ; le front ne connaît que
 * ceux-ci. Les types dérivés de zod (Phase 1) devront rester compatibles.
 *
 * Convention : toute donnée potentiellement absente est `| null` (Foreca
 * renvoie `null`, jamais `undefined`, et l'UI affiche « — », brief §4.1).
 */

export type Units = {
  temp: 'C' | 'F';
  wind: 'KMH' | 'MS' | 'MPH';
};

export type Place = {
  /** Identifiant canonique : "lat,lon" normalisé à 4 décimales. */
  id: string;
  name: string;
  country: string;
  adminArea: string | null;
  lat: number;
  lon: number;
  /** Fuseau IANA de la ville — jamais celui du device (brief §4.2 / §20). */
  timezone: string;
};

export type PrecipType = 'rain' | 'mixed' | 'snow';

export type TimeStep = {
  /** ISO 8601 avec l'offset de la ville cible. */
  time: string;
  epoch: number;
  /** Code symbole Foreca (`dNNN` jour / `nNNN` nuit). */
  symbol: string;
  phrase: string | null;
  temp: number | null;
  feelsLike: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDir: number | null;
  windDirLabel: string | null;
  gust: number | null;
  precipProb: number | null;
  precipAccum: number | null;
  precipType: PrecipType | null;
  /** % — pilote la couche nuageuse du globe (brief §7.1). */
  cloudiness: number | null;
  uvIndex: number | null;
  pressure: number | null;
  visibility: number | null;
};

/** Indicateur de confiance Foreca : g(reen) / y(ellow) / o(range). */
export type ForecastConfidence = 'g' | 'y' | 'o';

export type DayStep = {
  date: string;
  sunrise: string | null;
  sunset: string | null;
  sunriseEpoch: number | null;
  sunsetEpoch: number | null;
  minTemp: number | null;
  maxTemp: number | null;
  symbol: string;
  phrase: string | null;
  precipProb: number | null;
  precipAccum: number | null;
  uvIndex: number | null;
  moonPhase: number | null;
  confidence: ForecastConfidence | null;
};

/** Polluants suivis par l'échelle EPA (sous-indices `AQI_*` Foreca). */
export type AqiPollutant = 'co' | 'no2' | 'o3' | 'so2' | 'pm10' | 'pm25';

export type AirQualityStep = {
  time: string;
  aqi: number | null;
  pollutant: string | null;
  /**
   * Sous-indices EPA par polluant. `null` si le plan Foreca ne les renvoie
   * pas ; sinon un objet partiel (un polluant absent = clé absente).
   */
  subIndices: Partial<Record<AqiPollutant, number>> | null;
};

/**
 * Alerte météo officielle (Foreca `warning`).
 *
 * ⚠️ Forme PROVISOIRE — à confirmer avec la sonde `scripts/probe-foreca.mjs`
 * en Phase 1, puis à figer depuis les schémas zod réels.
 */
export type WarningSeverity = 'minor' | 'moderate' | 'severe' | 'extreme';
export type WarningColor = 'yellow' | 'orange' | 'red' | 'violet';

export type Warning = {
  id: string;
  event: string;
  headline: string | null;
  description: string | null;
  /** `significance` Foreca, normalisé. */
  severity: WarningSeverity | null;
  color: WarningColor | null;
  onset: string | null;
  expires: string | null;
  source: string | null;
};

export type Attribution = {
  provider: 'Foreca';
  /** Attributions tierces renvoyées par l'API (radar, satellite, pollen…). */
  thirdParty: string[];
};

export type WeatherSnapshot = {
  place: Place;
  fetchedAt: number;
  current: TimeStep;
  /** −24 h → +72 h (brief §4.5 / §8.1). */
  hourly: TimeStep[];
  daily: DayStep[];
  airQuality: AirQualityStep[];
  warnings: Warning[];
  attribution: Attribution;
};
