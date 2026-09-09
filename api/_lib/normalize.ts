/**
 * Normalisation Foreca → modèle de domaine (`src/shared/types/domain.ts`).
 *
 * Le front ne voit JAMAIS la forme Foreca : tout passe par ici (brief §4.3).
 */
import { normalizePlaceId } from '../../src/shared/lib/geo';
import type {
  AirQualityStep,
  AqiPollutant,
  DayStep,
  ForecastConfidence,
  Place,
  PrecipType,
  TimeStep,
  WeatherSnapshot,
} from '../../src/shared/types/domain';
import type {
  ForecaAirQualityStep,
  ForecaCurrent,
  ForecaDailyStep,
  ForecaHourlyStep,
  ForecaLocation,
} from './schemas';

function epochFromIso(iso: string): number {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? Math.round(ms / 1000) : Number.NaN;
}

function normalizePrecipType(raw: string | null): PrecipType | null {
  switch (raw?.toLowerCase()) {
    case 'rain':
      return 'rain';
    case 'snow':
      return 'snow';
    case 'sleet':
    case 'mixed':
    case 'freezing':
    case 'freezingrain':
      return 'mixed';
    default:
      return null;
  }
}

function normalizeConfidence(raw: string | null): ForecastConfidence | null {
  return raw === 'g' || raw === 'y' || raw === 'o' ? raw : null;
}

/** Foreca donne la phase lunaire en degrés (0–360) ; le domaine veut 0–1. */
function normalizeMoonPhase(deg: number | null): number | null {
  if (deg === null || !Number.isFinite(deg)) return null;
  return (((deg % 360) + 360) % 360) / 360;
}

export function normalizePlace(raw: ForecaLocation, timezone?: string): Place {
  return {
    id: normalizePlaceId(raw.lat, raw.lon),
    name: raw.name,
    country: raw.country,
    adminArea: raw.adminArea ?? raw.state ?? null,
    lat: raw.lat,
    lon: raw.lon,
    timezone: timezone ?? raw.timezone,
  };
}

export function normalizeCurrent(raw: ForecaCurrent): TimeStep {
  return {
    time: raw.time,
    epoch: epochFromIso(raw.time),
    symbol: raw.symbol,
    phrase: raw.symbolPhrase,
    temp: raw.temperature,
    feelsLike: raw.feelsLikeTemp,
    humidity: raw.relHumidity,
    windSpeed: raw.windSpeed,
    windDir: raw.windDir,
    windDirLabel: raw.windDirString,
    gust: raw.windGust,
    precipProb: raw.precipProb,
    precipAccum: null, // `current` ne renvoie qu'un `precipRate`
    precipType: null,
    cloudiness: raw.cloudiness,
    uvIndex: raw.uvIndex,
    pressure: raw.pressure,
    visibility: raw.visibility,
  };
}

export function normalizeHourly(raw: ForecaHourlyStep): TimeStep {
  return {
    time: raw.time,
    epoch: epochFromIso(raw.time),
    symbol: raw.symbol,
    phrase: raw.symbolPhrase,
    temp: raw.temperature,
    feelsLike: raw.feelsLikeTemp,
    humidity: raw.relHumidity,
    windSpeed: raw.windSpeed,
    windDir: raw.windDir,
    windDirLabel: raw.windDirString,
    gust: raw.windGust,
    precipProb: raw.precipProb,
    precipAccum: raw.precipAccum,
    precipType: normalizePrecipType(raw.precipType),
    cloudiness: raw.cloudiness,
    uvIndex: raw.uvIndex,
    pressure: raw.pressure,
    visibility: raw.visibility,
  };
}

export function normalizeDaily(raw: ForecaDailyStep): DayStep {
  return {
    date: raw.date,
    sunrise: raw.sunrise,
    sunset: raw.sunset,
    sunriseEpoch: raw.sunriseEpoch,
    sunsetEpoch: raw.sunsetEpoch,
    minTemp: raw.minTemp,
    maxTemp: raw.maxTemp,
    symbol: raw.symbol,
    phrase: raw.symbolPhrase,
    precipProb: raw.precipProb,
    precipAccum: raw.precipAccum,
    uvIndex: raw.uvIndex,
    moonPhase: normalizeMoonPhase(raw.moonPhase),
    confidence: normalizeConfidence(raw.confidence),
  };
}

const AQI_SUBINDEX_KEYS: [keyof ForecaAirQualityStep, AqiPollutant][] = [
  ['AQI_CO', 'co'],
  ['AQI_NO2', 'no2'],
  ['AQI_O3', 'o3'],
  ['AQI_SO2', 'so2'],
  ['AQI_PM10', 'pm10'],
  ['AQI_PM2P5', 'pm25'],
];

function normalizeSubIndices(
  raw: ForecaAirQualityStep,
): AirQualityStep['subIndices'] {
  const out: Partial<Record<AqiPollutant, number>> = {};
  for (const [forecaKey, pollutant] of AQI_SUBINDEX_KEYS) {
    const value = raw[forecaKey];
    if (typeof value === 'number' && Number.isFinite(value)) {
      out[pollutant] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function normalizeAirQuality(raw: ForecaAirQualityStep): AirQualityStep {
  return {
    time: raw.time,
    aqi: raw.AQI,
    pollutant: raw.pollutantPhrase ?? raw.pollutant,
    subIndices: normalizeSubIndices(raw),
  };
}

export type SnapshotParts = {
  place: Place;
  current: ForecaCurrent;
  hourly: ForecaHourlyStep[];
  daily: ForecaDailyStep[];
  airQuality: ForecaAirQualityStep[];
  thirdPartyAttribution?: string[];
};

export function buildSnapshot(parts: SnapshotParts): WeatherSnapshot {
  return {
    place: parts.place,
    fetchedAt: Date.now(),
    current: normalizeCurrent(parts.current),
    hourly: parts.hourly.map(normalizeHourly),
    daily: parts.daily.map(normalizeDaily),
    airQuality: parts.airQuality.map(normalizeAirQuality),
    warnings: [], // endpoint `warning` hors plan Foreca d'Audric (403)
    attribution: {
      provider: 'Foreca',
      thirdParty: parts.thirdPartyAttribution ?? [],
    },
  };
}
