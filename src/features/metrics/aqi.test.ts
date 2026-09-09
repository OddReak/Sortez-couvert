import { describe, expect, it } from 'vitest';

import type { AirQualityStep } from '@/shared/types/domain';

import {
  aqiBand,
  aqiBandAdvice,
  aqiBandColor,
  aqiLevelLabel,
  dominantPollutant,
} from './aqi';

describe('aqiBand', () => {
  it('classe selon les seuils EPA', () => {
    expect(aqiBand(0)).toBe('good');
    expect(aqiBand(50)).toBe('good');
    expect(aqiBand(51)).toBe('moderate');
    expect(aqiBand(150)).toBe('sensitive');
    expect(aqiBand(300)).toBe('very-unhealthy');
    expect(aqiBand(400)).toBe('hazardous');
  });

  it('null si absent', () => {
    expect(aqiBand(null)).toBeNull();
    expect(aqiLevelLabel(null)).toBeNull();
    expect(aqiBandAdvice(null)).toBeNull();
  });
});

describe('aqiBandColor', () => {
  it('renvoie un token @theme, repli faint si inconnu', () => {
    expect(aqiBandColor('good')).toBe('var(--color-aqi-good)');
    expect(aqiBandColor(null)).toBe('var(--app-ink-faint)');
  });
});

describe('dominantPollutant', () => {
  const step = (subIndices: AirQualityStep['subIndices']): AirQualityStep => ({
    time: '',
    aqi: 40,
    pollutant: null,
    subIndices,
  });

  it('renvoie le polluant au sous-indice le plus élevé', () => {
    expect(dominantPollutant(step({ o3: 24, pm25: 40, no2: 8 }))).toBe('pm25');
  });

  it('null si aucun sous-indice', () => {
    expect(dominantPollutant(step(null))).toBeNull();
    expect(dominantPollutant(step({}))).toBeNull();
  });
});
