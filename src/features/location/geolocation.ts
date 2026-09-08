/**
 * Accès à la géolocalisation du device (brief §9.2).
 *
 * Les 3 états sont explicites : accordée / refusée / indisponible. Sur iOS,
 * une fois refusée la boîte de dialogue ne se rouvre plus — d'où l'écran de
 * pré-permission (brief §9.1).
 */

export type GeoOk = { ok: true; lat: number; lon: number };
export type GeoFailReason = 'denied' | 'unavailable' | 'timeout' | 'insecure';
export type GeoResult = GeoOk | { ok: false; reason: GeoFailReason };

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

/** État de la permission SANS déclencher la boîte de dialogue. */
export async function queryGeoPermission(): Promise<PermissionState> {
  if (typeof navigator === 'undefined' || !('permissions' in navigator)) {
    return 'unknown';
  }
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state;
  } catch {
    return 'unknown';
  }
}

/**
 * Demande la position. DÉCLENCHE la boîte de dialogue iOS si l'état est
 * « prompt » — à n'appeler qu'après un geste explicite (bouton).
 */
export function getCurrentPosition(timeoutMs = 10_000): Promise<GeoResult> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return Promise.resolve({ ok: false, reason: 'unavailable' });
  }
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return Promise.resolve({ ok: false, reason: 'insecure' });
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          ok: true,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      (err) => {
        resolve({
          ok: false,
          reason:
            err.code === err.PERMISSION_DENIED
              ? 'denied'
              : err.code === err.TIMEOUT
                ? 'timeout'
                : 'unavailable',
        });
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 5 * 60_000 },
    );
  });
}
