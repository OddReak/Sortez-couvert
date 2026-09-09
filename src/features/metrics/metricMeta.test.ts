import { describe, expect, it } from 'vitest';

import type { TimeStep, Units } from '@/shared/types/domain';

import { METRIC_META, uvLevelMeta } from './metricMeta';

const KMH: Units = { temp: 'C', wind: 'KMH' };
const MPH: Units = { temp: 'C', wind: 'MPH' };

const step = (over: Partial<TimeStep> = {}): TimeStep =>
  ({
    windSpeed: 18,
    humidity: 64,
    uvIndex: 5.2,
    ...over,
  }) as TimeStep;

describe('METRIC_META', () => {
  it('vent : lit la valeur (déjà dans l’unité demandée) et l’étiquette d’axe', () => {
    const m = METRIC_META.wind;
    expect(m.fromStep(step())).toBe(18);
    expect(m.format(18, KMH)).toBe('18 km/h');
    expect(m.format(10, MPH)).toBe('10 mph');
    expect(m.axisUnit(MPH)).toBe('mph');
  });

  it('humidité / UV : libellés', () => {
    expect(METRIC_META.humidity.format(64, KMH)).toBe('64 %');
    expect(METRIC_META.uv.format(5.2, KMH)).toBe('5');
  });

  it('valeur absente → « — »', () => {
    expect(METRIC_META.wind.format(null, KMH)).toBe('—');
    expect(METRIC_META.uv.format(null, KMH)).toBe('—');
  });
});

describe('uvLevelMeta', () => {
  it('classe l’indice UV et donne un libellé', () => {
    expect(uvLevelMeta(1)?.label).toBe('Faible');
    expect(uvLevelMeta(5.2)?.label).toBe('Modéré');
    expect(uvLevelMeta(9)?.label).toBe('Très élevé');
    expect(uvLevelMeta(12)?.label).toBe('Extrême');
  });

  it('null si la valeur est absente', () => {
    expect(uvLevelMeta(null)).toBeNull();
  });
});
