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

| Phase | Contenu                                       | Statut      |
| ----- | --------------------------------------------- | ----------- |
| 0     | Fondations (repo, build, tokens, qualité, CI) | ✅ terminée |
| 1     | Proxy Foreca (`/api/*`, zod, cache, sonde)    | ✅ terminée |
| 2     | Squelette UI (layout 15/60/25, thèmes)        | ✅ terminée |
| 3     | Globe 3D                                      | ✅ terminée |
| 4     | Bague temporelle                              | ✅ terminée |
| 5     | Lieux (géoloc, recherche, favoris)            | ✅ terminée |
| 6     | Enrichissement (détails, prévisions, alertes) | ✅ terminée |
| 7     | PWA & hors ligne                              | ✅ terminée |
| 8     | Accessibilité & performance                   | ✅ terminée |
| 9     | Production (Vercel, pages légales, doc)       | ✅ terminée |

Plan détaillé : `docs/PROMPT-MAITRE.md` §16. Déploiement : `docs/DEPLOIEMENT.md`.

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

| Commande                   | Rôle                                                     |
| -------------------------- | -------------------------------------------------------- |
| `pnpm dev`                 | Serveur de dev Vite                                      |
| `pnpm build`               | Typecheck + build de production (`dist/`)                |
| `pnpm preview`             | Sert le build (`http://localhost:4173`)                  |
| `pnpm typecheck`           | `tsc --noEmit` (app + node)                              |
| `pnpm lint`                | ESLint (flat config)                                     |
| `pnpm format`              | Prettier (écriture)                                      |
| `pnpm test`                | Vitest (unitaires)                                       |
| `pnpm test:coverage`       | Vitest + couverture (seuil `src/shared/lib` ≥ 85 %)      |
| `pnpm test:e2e`            | Playwright (iPhone 15 ; le hors ligne sur Chromium)      |
| `pnpm preview:real`        | Sert le build réel avec le service worker PWA (`:4174`)  |
| `pnpm generate:pwa-assets` | Régénère icônes + splash iOS depuis `public/favicon.svg` |

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

## Installer Terra / hors ligne

- **Android / desktop Chromium :** un bouton « Installer Terra » apparaît dans
  les réglages quand le navigateur le propose.
- **iPhone (Safari) :** menu Partager → « Ajouter à l'écran d'accueil ». Une
  fois installée, l'app dispose d'un écran de lancement dédié.
- **Sans réseau :** l'app reste utilisable. Le dernier relevé de chaque lieu
  (météo, prévisions, qualité de l'air) est servi depuis le cache, avec un
  bandeau « Données du … ». Le service worker précache la coquille de l'app
  (HTML/CSS/JS, polices) ; le globe 3D et ses textures se mettent en cache à la
  première visite. Une nouvelle version déclenche un toast « Recharger » —
  jamais de rechargement forcé.

---

## Accessibilité

Terra vise **WCAG 2.2 niveau AA**, vérifié automatiquement (`axe-core` sur
chaque écran en CI, Lighthouse A11y ≥ 0.95 bloquant) :

- **Focus visible** partout (anneau 2 px contrasté), cibles tactiles ≥ 44 pt.
- **Contraste** ≥ 4.5:1 pour le texte, y compris pendant les transitions
  aube/crépuscule ; `prefers-contrast: more` renforce encore filets et surfaces.
- **`prefers-reduced-motion`** : globe → rendu 2D statique, bague → alternative
  en chips d'heures, plus d'inertie ni de ressort.
- **Dynamic Type / zoom 200 %** : mise en page en `rem`, défilement en secours.
- **VoiceOver** : libellés en français sur chaque contrôle ; annonces `aria-live`
  débouncées lors du scrub.
- **Multi-appareils** : la mise en page s'adapte à la taille de l'écran (petit
  téléphone, grand téléphone, tablette, desktop en colonne), pas seulement à
  l'iPhone 15.

---

## Déploiement

Cible **Vercel** (`terra-weather.vercel.app`, fonctions région `cdg1`), cache et
rate-limit sur **Upstash Redis**. Procédure complète, variables d'environnement
et checklist post-déploiement : **`docs/DEPLOIEMENT.md`**.

Pages publiques : `/aide` (prise en main, installation) et `/confidentialite`
(RGPD).

## Documentation

- `CLAUDE.md` — conventions, architecture, glossaire, commandes (tenu à jour à
  chaque phase).
- `docs/PROMPT-MAITRE.md` — cahier des charges complet.
- `docs/DEPLOIEMENT.md` — mise en production Vercel.
- `docs/Brief_UI_UX_Meteo_Terre.pdf` + `docs/mockup-board-ui-ux.jpg` — design.

## Attribution

Les données météo sont fournies par **Foreca**. L'attribution Foreca est
visible dans l'application (obligation contractuelle).

## Licence

Projet privé — `UNLICENSED`.
