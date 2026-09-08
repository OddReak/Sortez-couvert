import { useState } from 'react';

import { MapPin, Search as SearchIcon } from 'lucide-react';

import { SearchSheet } from './SearchSheet';
import { usePlaces } from './placesStore';
import { useAcquireLocation } from './useAcquireLocation';

/**
 * Onboarding — 2 écrans maximum (brief §9.1). Le 2ᵉ est un écran de
 * PRÉ-PERMISSION : il explique pourquoi la localisation est demandée AVANT de
 * déclencher la boîte de dialogue iOS (irréversible une fois refusée).
 */
export function Onboarding() {
  const [step, setStep] = useState<0 | 1>(0);
  const [search, setSearch] = useState(false);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);
  const completeOnboarding = usePlaces((s) => s.completeOnboarding);
  const acquire = useAcquireLocation();

  const requestLocation = async (): Promise<void> => {
    setBusy(true);
    const res = await acquire();
    setBusy(false);
    if (res.ok) {
      completeOnboarding(); // le lieu courant est fixé → l'app s'affiche
    } else {
      setDenied(true); // on reste sur cet écran, recherche manuelle proposée
    }
  };

  return (
    <div className="safe-x safe-t safe-b mx-auto flex h-dvh max-w-md flex-col justify-between px-6 py-10 text-center">
      {step === 0 ? (
        <>
          <div />
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-3xl font-bold text-balance">
              Tournez le temps,
              <br />
              voyez votre monde changer
            </h1>
            <p className="ink-muted text-pretty">
              Terra montre la météo sur un globe : faites tourner la bague, le
              soleil se déplace et les heures défilent.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setStep(1);
            }}
            className="rounded-2xl bg-[var(--app-live)] px-6 py-3.5 font-semibold text-[var(--app-surface)]"
          >
            Continuer
          </button>
        </>
      ) : (
        <>
          <div />
          <div className="flex flex-col items-center gap-4">
            <MapPin size={40} className="ink-faint" aria-hidden />
            <h1 className="text-2xl font-bold text-balance">
              Votre position, pour commencer
            </h1>
            <p className="ink-muted text-pretty">
              {`Terra l'utilise uniquement pour afficher votre météo locale. Elle
              n'est ni stockée, ni partagée avec des tiers autres que le
              fournisseur météo. Vous pouvez aussi choisir une ville à la main.`}
            </p>
            {denied ? (
              <p
                role="alert"
                className="text-sm text-[var(--color-warn-orange)]"
              >
                Localisation refusée. Cherchez une ville ci-dessous — vous
                pourrez réactiver la position dans les réglages du navigateur.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3">
            {!denied ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void requestLocation()}
                className="rounded-2xl bg-[var(--app-live)] px-6 py-3.5 font-semibold text-[var(--app-surface)] disabled:opacity-60"
              >
                {busy ? 'Localisation…' : 'Autoriser ma position'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setSearch(true);
              }}
              className="hairline-border flex items-center justify-center gap-2 rounded-2xl border px-6 py-3.5 font-semibold"
            >
              <SearchIcon size={18} aria-hidden />
              Chercher une ville
            </button>
          </div>
        </>
      )}

      <SearchSheet
        open={search}
        onClose={() => {
          setSearch(false);
          completeOnboarding();
        }}
      />
    </div>
  );
}
