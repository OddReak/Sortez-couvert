import { Download } from 'lucide-react';

import { Link } from '@/app/router';
import { usePlaces } from '@/features/location/placesStore';
import { useInstallPrompt } from '@/pwa/useInstallPrompt';
import { Sheet } from '@/shared/ui/Sheet';

import { useSettings } from './store';

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className="hairline-border flex rounded-xl border p-0.5"
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => {
              onChange(o.value);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              value === o.value ? 'chip-active font-semibold' : 'ink-muted'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex w-full items-center justify-between gap-3 py-2.5 text-left"
    >
      <span className="text-sm">{label}</span>
      <span
        aria-hidden="true"
        className={`hairline-border flex h-6 w-10 items-center rounded-full border px-0.5 transition-colors ${
          checked ? 'bg-[var(--app-live)]' : ''
        }`}
      >
        <span
          className={`size-4 rounded-full bg-[var(--app-surface)] transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </span>
    </button>
  );
}

export function SettingsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const s = useSettings();
  const clearPlaces = usePlaces((p) => p.clearAll);
  const { canInstall, promptInstall } = useInstallPrompt();

  return (
    <Sheet open={open} onClose={onClose} title="Réglages">
      <div className="hairline-border divide-y">
        <Segmented
          label="Température"
          value={s.units.temp}
          options={[
            { value: 'C', label: '°C' },
            { value: 'F', label: '°F' },
          ]}
          onChange={s.setTempUnit}
        />
        <Segmented
          label="Vent"
          value={s.units.wind}
          options={[
            { value: 'KMH', label: 'km/h' },
            { value: 'MS', label: 'm/s' },
            { value: 'MPH', label: 'mph' },
          ]}
          onChange={s.setWindUnit}
        />
        <Segmented
          label="Thème"
          value={s.themeOverride}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'light', label: 'Clair' },
            { value: 'dark', label: 'Sombre' },
          ]}
          onChange={s.setThemeOverride}
        />
        <Segmented
          label="Langue"
          value={s.language}
          options={[
            { value: 'fr', label: 'FR' },
            { value: 'en', label: 'EN' },
          ]}
          onChange={s.setLanguage}
        />
        <Toggle
          label="Rangée d’heures au lieu de la bague"
          checked={s.nonGesturalTimeControl}
          onChange={s.toggleNonGesturalTimeControl}
        />
        <Toggle
          label="Tick sonore de la bague"
          checked={s.soundTick}
          onChange={s.toggleSoundTick}
        />
      </div>

      {canInstall ? (
        <button
          type="button"
          onClick={promptInstall}
          className="mt-4 flex w-full items-center gap-2 rounded-xl bg-[var(--app-live)] px-3 py-2.5 text-sm font-semibold text-[var(--app-surface)]"
        >
          <Download size={16} aria-hidden />
          Installer Terra
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => {
          clearPlaces();
          onClose();
        }}
        className="mt-4 w-full rounded-xl py-3 text-sm font-semibold text-[var(--color-warn-red)]"
      >
        Effacer mes lieux et repartir de zéro
      </button>

      <div className="mt-4 flex gap-4 text-sm">
        <Link
          to="/aide"
          onNavigate={onClose}
          className="font-semibold underline"
        >
          Aide
        </Link>
        <Link
          to="/confidentialite"
          onNavigate={onClose}
          className="font-semibold underline"
        >
          Confidentialité
        </Link>
      </div>

      <details className="mt-3 text-[0.6875rem]">
        <summary className="ink-muted cursor-pointer">À propos</summary>
        <div className="ink-muted mt-2 flex flex-col gap-1.5">
          <p>
            <span className="font-semibold">Terra</span> — météo fournie par
            Foreca.
          </p>
          <p>
            Vibration au passage d’heure : non disponible sur iPhone (Safari) —
            une pulsation visuelle la remplace.
          </p>
          <p>
            Notifications, géolocalisation en arrière-plan et synchronisation
            hors ligne sont limitées sur iOS. Le dernier relevé de chaque lieu
            reste consultable sans réseau. Détails dans le README.
          </p>
          <p>
            Sur iPhone, installez Terra via le menu Partager de Safari → «
            Ajouter à l’écran d’accueil ».
          </p>
        </div>
      </details>
    </Sheet>
  );
}
