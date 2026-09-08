/**
 * Retour haptique — abstraction avec détection de capacité (brief §8.5).
 *
 * ⚠️ Safari iOS NE SUPPORTE PAS l'API Vibration, même en PWA installée. C'est
 * une limitation de plateforme. Sur iOS, `tick()` est un no-op silencieux ; la
 * compensation (micro-impulsion d'échelle sur la graduation franchie) est
 * gérée visuellement par le composant `TimeRing`.
 *
 * Les contournements non officiels (`<input type="checkbox" switch>`) ne sont
 * PAS implémentés : fragiles, cassables à chaque mise à jour d'iOS.
 */

export type Haptics = {
  /** Vibre brièvement si la plateforme le permet. Sinon : rien. */
  tick: () => void;
  /** La vibration est-elle réellement disponible ? */
  readonly canVibrate: boolean;
};

function vibrationSupported(): boolean {
  return (
    typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
  );
}

export function createHaptics(): Haptics {
  const canVibrate = vibrationSupported();
  return {
    canVibrate,
    tick: () => {
      if (!canVibrate) return;
      try {
        navigator.vibrate(9);
      } catch {
        /* certains navigateurs jettent si l'onglet n'a pas d'interaction */
      }
    },
  };
}

let sharedAudio: AudioContext | null = null;

/**
 * Tick sonore très court (< 30 ms), désactivé par défaut, activable dans les
 * réglages (brief §8.5.3). Utilise WebAudio (aucun asset).
 */
export function playSoundTick(volume = 0.04): void {
  if (typeof window === 'undefined') return;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return;

  sharedAudio ??= new Ctor();
  const ctx = sharedAudio;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.03);
}
