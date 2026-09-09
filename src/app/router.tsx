import { useCallback, useSyncExternalStore, type ReactNode } from 'react';

/**
 * Mini-routeur maison — l'app est quasi mono-écran ; seules les pages statiques
 * `/aide` et `/confidentialite` ont besoin d'une vraie URL (partageable, page
 * légale). Le rewrite SPA de `vercel.json` renvoie tout vers `index.html`.
 */

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
  };
}

/** Chemin courant (`location.pathname`), réactif aux navigations. */
export function useRoute(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => '/',
  );
}

/** Navigation programmatique (pushState + notification). */
export function navigate(path: string): void {
  if (path === window.location.pathname) return;
  window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/** Lien interne — se comporte comme `<a>` (nouvel onglet, etc.) mais navigue en SPA. */
export function Link({
  to,
  className,
  children,
  onNavigate,
}: {
  to: string;
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  const onClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      event.preventDefault();
      onNavigate?.();
      navigate(to);
    },
    [to, onNavigate],
  );

  return (
    <a href={to} className={className} onClick={onClick}>
      {children}
    </a>
  );
}
