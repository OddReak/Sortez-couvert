import { Link } from '@/app/router';
import type { Attribution as AttributionData } from '@/shared/types/domain';

/**
 * Attribution Foreca — obligation contractuelle, toujours visible (brief §4.1).
 * Porte aussi le lien Confidentialité (emplacement conventionnel de pied).
 */
export function Attribution({ data }: { data: AttributionData }) {
  return (
    <p className="ink-muted text-center text-[0.6875rem]">
      Données météo&nbsp;: <span className="font-semibold">Foreca</span>
      {data.thirdParty.length > 0 ? ` · ${data.thirdParty.join(' · ')}` : ''}
      {' · '}
      <Link to="/confidentialite" className="underline">
        Confidentialité
      </Link>
    </p>
  );
}
