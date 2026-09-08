import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { __resetKvStore } from './kv';
import { checkRateLimit, clientIp } from './ratelimit';

beforeEach(() => {
  __resetKvStore();
});

afterEach(() => {
  __resetKvStore();
});

describe('checkRateLimit', () => {
  const now = new Date('2026-09-08T12:00:10.000Z');

  it('autorise jusqu’à 60 requêtes par minute et par IP', async () => {
    let last = await checkRateLimit('1.2.3.4', now);
    for (let i = 1; i < 60; i += 1) {
      last = await checkRateLimit('1.2.3.4', now);
    }
    expect(last.ok).toBe(true);
    expect(last.remaining).toBe(0);
  });

  it('refuse la 61ᵉ requête', async () => {
    for (let i = 0; i < 60; i += 1) await checkRateLimit('9.9.9.9', now);
    const blocked = await checkRateLimit('9.9.9.9', now);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(50);
  });

  it('isole les IP entre elles', async () => {
    for (let i = 0; i < 60; i += 1) await checkRateLimit('a', now);
    const other = await checkRateLimit('b', now);
    expect(other.ok).toBe(true);
  });

  it('repart à zéro à la fenêtre suivante', async () => {
    for (let i = 0; i < 60; i += 1) await checkRateLimit('c', now);
    const nextWindow = new Date('2026-09-08T12:01:10.000Z');
    const fresh = await checkRateLimit('c', nextWindow);
    expect(fresh.ok).toBe(true);
    expect(fresh.remaining).toBe(59);
  });
});

describe('clientIp', () => {
  it('prend la première IP de X-Forwarded-For', () => {
    const req = new Request('https://terra.app/api/weather', {
      headers: { 'x-forwarded-for': '203.0.113.1, 70.41.3.18' },
    });
    expect(clientIp(req)).toBe('203.0.113.1');
  });

  it('se rabat sur X-Real-IP puis "unknown"', () => {
    expect(
      clientIp(
        new Request('https://terra.app', {
          headers: { 'x-real-ip': '198.51.100.9' },
        }),
      ),
    ).toBe('198.51.100.9');
    expect(clientIp(new Request('https://terra.app'))).toBe('unknown');
  });
});
