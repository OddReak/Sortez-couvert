import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import { Link } from '@/app/router';

/**
 * Coquille commune aux pages statiques (`/aide`, `/confidentialite`) : colonne
 * lisible, lien retour, défilement naturel. Thème jour par défaut (ces pages ne
 * dépendent pas de la météo).
 */
export function StaticPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[var(--app-ambient)] text-[var(--app-ink)]">
      <main className="safe-t safe-b safe-x mx-auto flex max-w-md flex-col gap-4 px-5 py-4">
        <Link
          to="/"
          className="ink-muted -ml-1 inline-flex items-center gap-1 self-start text-sm"
        >
          <ArrowLeft size={16} aria-hidden />
          Retour à l’application
        </Link>
        <h1 className="text-2xl leading-tight font-bold text-balance">
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}

/** Section titrée réutilisée par les deux pages. */
export function Section({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="text-base font-semibold">{heading}</h2>
      <div className="ink-muted flex flex-col gap-1.5 text-sm">{children}</div>
    </section>
  );
}
