# Terra

> _« Tournez le temps, voyez votre monde changer. »_

PWA météo pour iPhone : un globe terrestre 3D centré sur votre ville, avec
l'ombre jour/nuit calculée en temps réel, entouré d'une **bague temporelle**
qui fait défiler les heures — le soleil se déplace, le fond de l'app passe du
jour à la nuit, les métriques s'animent.

Source de données unique : **Foreca**, via un proxy serveur (la clé API ne
touche jamais le navigateur).

---

## État du projet

| Phase | Contenu                                             | Statut      |
| ----- | --------------------------------------------------- | ----------- |
| 0     | Fondations (repo, build, tokens, qualité, CI)       | ✅ terminée |
| 1     | Proxy Foreca (`/api/*`, zod, cache, sonde)          | ✅ terminée |
| 2     | Squelette UI (layout 15/60/25, thèmes)              | ✅ terminée |
| 3     | Globe 3D                                            | ✅ terminée |
| 4     | Bague temporelle                                    | 🚧 en cours |
| 5–9   | Lieux, enrichissement, PWA/offline, a11y/perf, prod | à venir     |

Plan détaillé : `docs/PROMPT-MAITRE.md` §16.

---

## Démarrage rapide

Prérequis : **Node 22+**, **pnpm 11+** (`corepack enable`).

```bash
pnpm install
pnpm dev            # http://localhost:5173
```

En développement, toutes les données météo passent par des mocks **MSW**
(fixtures) — aucun appel réseau réel, pour préserver le quota Foreca.

### Scripts

| Commande             | Rôle                                                |
| -------------------- | --------------------------------------------------- |
| `pnpm dev`           | Serveur de dev Vite                                 |
| `pnpm build`         | Typecheck + build de production (`dist/`)           |
| `pnpm preview`       | Sert le build (`http://localhost:4173`)             |
| `pnpm typecheck`     | `tsc --noEmit` (app + node)                         |
| `pnpm lint`          | ESLint (flat config)                                |
| `pnpm format`        | Prettier (écriture)                                 |
| `pnpm test`          | Vitest (unitaires)                                  |
| `pnpm test:coverage` | Vitest + couverture (seuil `src/shared/lib` ≥ 85 %) |
| `pnpm test:e2e`      | Playwright (émulation iPhone 15)                    |

---

## Limites connues sur iOS

Ces limites sont des contraintes de plateforme (Safari / WebKit), pas des
défauts d'implémentation :

- **Vibration / Taptic Engine : non disponible.** L'API Vibration n'est pas
  supportée par Safari iOS, même en PWA installée. Terra compense par un
  feedback visuel (micro-impulsion d'échelle + accent lumineux sur la
  graduation franchie) et, en option, un tick sonore désactivé par défaut.
- **Notifications push :** possibles uniquement si l'app est **installée sur
  l'écran d'accueil** (iOS 16.4+), avec permission déclenchée par un geste
  utilisateur. Prévu en v2, via un cron serveur + Web Push.
- **Rafraîchissement en arrière-plan :** Background Sync et Periodic Sync ne
  sont pas disponibles. Pas de mise à jour des données quand l'app est fermée.
- **Géolocalisation en arrière-plan :** impossible.
- **Stockage :** IndexedDB est traité comme un **cache**, pas un stockage
  durable — les données peuvent être purgées après ~7 jours sans usage.

---

## Documentation

- `CLAUDE.md` — conventions, architecture, glossaire, commandes (tenu à jour à
  chaque phase).
- `docs/PROMPT-MAITRE.md` — cahier des charges complet.
- `docs/Brief_UI_UX_Meteo_Terre.pdf` + `docs/mockup-board-ui-ux.jpg` — design.

## Attribution

Les données météo sont fournies par **Foreca**. L'attribution Foreca est
visible dans l'application (obligation contractuelle).

## Licence

Projet privé — `UNLICENSED`.
