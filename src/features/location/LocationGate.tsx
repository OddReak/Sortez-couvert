import type { ReactNode } from 'react';

import { ChooseLocation } from './ChooseLocation';
import { Onboarding } from './Onboarding';
import { usePlaces } from './placesStore';

/**
 * Décide de l'écran d'entrée (brief §9.1 / §9.2) :
 * - store pas encore hydraté → rien (évite un flash) ;
 * - aucun lieu, onboarding pas fait → onboarding (2 écrans, pré-permission) ;
 * - aucun lieu, onboarding fait → écran « choisir un lieu » ;
 * - un lieu courant → l'application.
 */
export function LocationGate({ children }: { children: ReactNode }) {
  const hydrated = usePlaces((s) => s.hydrated);
  const current = usePlaces((s) => s.current);
  const onboardingDone = usePlaces((s) => s.onboardingDone);

  if (!hydrated) {
    return <div className="app-h bg-[var(--app-ambient)]" />;
  }
  if (current) return <>{children}</>;
  return onboardingDone ? <ChooseLocation /> : <Onboarding />;
}
