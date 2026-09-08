# CLAUDE.md — Terra

Guide de travail pour Claude Code sur ce dépôt. **Tenu à jour à chaque phase.**

Le cahier des charges qui fait autorité est `docs/PROMPT-MAITRE.md`. En cas de
doute, c'est lui qui tranche. Ce fichier en est le résumé opérationnel.

---

## 1. Commandes

| Besoin           | Commande                                |
| ---------------- | --------------------------------------- |
| Dev              | `pnpm dev` (port 5173)                  |
| Typecheck        | `pnpm typecheck`                        |
| Lint             | `pnpm lint` / `pnpm lint:fix`           |
| Format           | `pnpm format` / `pnpm format:check`     |
| Tests unitaires  | `pnpm test` / `pnpm test:watch`         |
| Couverture       | `pnpm test:coverage`                    |
| Tests E2E        | `pnpm test:e2e` (Playwright, iPhone 15) |
| Build            | `pnpm build` (typecheck + `vite build`) |
| Preview du build | `pnpm preview` (port 4173)              |

**Fin de chaque phase :** `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`
doivent être verts. Ensuite : compte rendu, arrêt, attente du feu vert d'Audric.

---

## 2. Stack (imposée — voir `docs/PROMPT-MAITRE.md` §2)

Vite · React 19 + TypeScript strict · Tailwind CSS v4 (`@theme`) · three.js +
@react-three/fiber + drei · suncalc · zustand · @tanstack/react-query v5 · zod ·
motion · luxon · vite-plugin-pwa · Vercel Functions (`cdg1`) · Vitest +
Testing Library + Playwright + MSW + axe-core · ESLint 9 flat + Prettier +
Husky + commitlint · pnpm · Node 22.

**Interdits :** Next.js, CSS-in-JS runtime, librairie de composants lourde
(MUI/Chakra), `localStorage` pour les données volumineuses (→ IndexedDB via
`idb-keyval`).

### Écarts assumés par rapport au brief (à connaître)

| Sujet      | Brief     | Réel                    | Raison                                                                                        |
| ---------- | --------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| Node       | 22 LTS    | `>=22` (Codespace : 24) | 24 est désormais LTS et déjà provisionné ; `.nvmrc`/CI/devcontainer restent sur 22            |
| Vite       | « 6+ »    | 8.x                     | 6+ satisfait ; tout l'écosystème (vitest 5, plugin-react 6) supporte 8                        |
| TypeScript | non pinné | `~5.9`                  | `typescript-eslint` exige `typescript < 6.1` ; TS 7 (portage Go) casserait le lint type-aware |
| ESLint     | 9 flat    | 9 flat                  | conforme                                                                                      |

Les dépendances `three`, `zustand`, `react-query`, `zod`, `motion`, `luxon`,
`suncalc`, `idb-keyval`, `lucide-react`, `vite-plugin-pwa` **ne sont pas encore
installées** : elles arrivent à leur phase respective pour garder la Phase 0
légère.

---

## 3. Arborescence

```
api/            Vercel Functions — proxy Foreca (la clé reste serveur)
  health.ts     GET /api/health (sonde, sans secret)
  _lib/         (Phase 1) client HTTP, cache, ratelimit, schemas zod
docs/           Brief maître + brief design + mockup
public/         textures/ icons/ splash/ + favicon.svg + manifest (Phase 7)
scripts/        (Phase 1+) fetch-textures, generate-pwa-assets, probe-foreca
src/
  app/          bootstrap, providers, router
  features/
    globe/      Canvas R3F, shaders, caméra (Phase 3)
    time-ring/  bague, gestes, snapping, a11y (Phase 4)
    weather/    hooks React Query, sélecteurs, interpolation (Phase 2+)
    location/   géoloc, recherche, favoris (Phase 5)
    metrics/    grille du bas, bottom sheets (Phase 2 / 6)
    alerts/     warnings Foreca (Phase 6)
  shared/
    ui/         primitives (Sheet, Chip, Skeleton, Icon)
    lib/        units, time, sun, symbols, interpolate, geo
    types/      domain.ts (modèle de domaine figé)
    styles/     theme.css (tokens @theme — SOURCE UNIQUE des couleurs)
  pwa/          service worker custom, update/install prompts (Phase 7)
  mocks/        MSW (handlers, serveur node)
tests/          unit/ e2e/ fixtures/ + setup.ts
```

---

## 4. Conventions de code

- **TypeScript strict** : `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noUnusedLocals/Parameters`. Pas de `any`, pas
  de `!` non-null gratuit, pas de `@ts-ignore` sans commentaire justifié.
- **Imports** : alias `@/` → `src/`. `import type` (inline) pour les types.
- **Nommage** : composants `PascalCase`, hooks `useXxx`, helpers `camelCase`,
  types `PascalCase`. Fichiers de test `*.test.ts(x)` à côté du fichier testé.
- **Styles** : classes Tailwind uniquement. **Aucune couleur hexadécimale en
  dur dans un composant** — tout vient des tokens `@theme` de `theme.css`.
  Tailles en `rem`, jamais `px` (Dynamic Type iOS). `100dvh`, jamais `100vh`.
- **Chiffres qui changent** (température, heure, métriques) : classe
  `tabular-nums` obligatoire.
- **Données absentes** : afficher « — », jamais `NaN`, `0` ou `undefined`.
- **Accessibilité** : tout contrôle a un nom accessible en français ; focus
  visible ; cibles ≥ 44×44 pt ; aucune info portée uniquement par la couleur.
- **Commits** : Conventional Commits en anglais, atomiques. Une branche par
  phase (`feat/phase-N-slug`). Jamais de secret, jamais de `.env` versionné,
  jamais de `git push --force` sur `main`.

---

## 5. Décisions d'architecture

1. **La clé Foreca ne touche jamais le navigateur.** Le front n'appelle que
   `/api/weather` et `/api/search`. Aucune variable `VITE_*` ne contient de
   secret. Un job CI échoue si un secret ou `weatherapi.foreca.net` apparaît
   dans `dist/`.
2. **Ordre des coordonnées Foreca : `longitude,latitude`.** Toujours via
   `toForecaLocation(lat, lon)` (`src/shared/lib/geo.ts`). Jamais de
   concaténation manuelle (règle ESLint `no-restricted-syntax`).
3. **Fuseau horaire = celui de la ville affichée** (IANA), jamais celui du
   device. Toutes les dates via luxon avec la timezone du `Place`.
4. **Modèle de domaine unique** (`src/shared/types/domain.ts`), indépendant de
   la forme Foreca. Le proxy normalise ; le front ne connaît que ce modèle.
5. **Scrub de la bague = zéro requête réseau.** Toutes les heures affichables
   sont déjà dans le payload (`hourly` : −24 h → +72 h).
6. **Scrub = pas de re-render React global.** La valeur d'heure transite par
   une `ref` / `useSyncExternalStore` ; le globe lit la ref dans `useFrame`, le
   DOM texte est throttlé à ~10 Hz.
7. **Position du soleil = calcul continu** (`suncalc`), jamais interpolée
   depuis l'API. Isolée dans `src/shared/lib/sun.ts` (fonction pure), testée
   sur les 4 cas du brief §7.2 avant tout shader.
8. **Symbole / phrase / type de précip = plus proche voisin**, jamais
   interpolés. Seules les valeurs numériques sont interpolées (linéaire +
   spring d'affichage).
9. **Thème = heure locale de la ville**, pas le réglage système. Override
   manuel Auto/Clair/Sombre dans les réglages.
10. **Globe : fallback 2D obligatoire** (SVG/canvas, même code solaire) si
    WebGL absent, contexte perdu, ou `prefers-reduced-motion`.
11. **Bague : alternative non gestuelle obligatoire** (chips horaires
    scrollables) pour VoiceOver / `prefers-reduced-motion` / réglage manuel.
12. **Dev & test = MSW.** API réelle uniquement en validation manuelle, via
    `USE_REAL_FORECA_API=true`. Quota Foreca : 2 000 req/j.

---

## 6. Glossaire du domaine

| Terme                   | Définition                                                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Terminateur**         | Ligne mobile de séparation jour/nuit sur le globe. Largeur ≈ 11° d'arc (crépuscule doux).                                                |
| **Scrubbing / scrub**   | Action de faire tourner la bague pour parcourir les heures.                                                                              |
| **Snapping**            | Aimantation douce de la bague sur l'heure pleine à l'arrêt ; renforcée près de « maintenant » (< 30 min).                                |
| **Inertie**             | À la relâche, la bague conserve sa vitesse angulaire puis freine (~0.94/frame).                                                          |
| **Passage ±π**          | Discontinuité de `atan2` quand le doigt franchit le haut de la bague — doit être gérée dans l'accumulateur d'angle (sinon saut de 12 h). |
| **Point subsolaire**    | Point de la Terre où le soleil est au zénith à un instant donné.                                                                         |
| **Déclinaison solaire** | Angle du soleil par rapport à l'équateur ; varie avec la saison (±23,44°).                                                               |
| **Symbole Foreca**      | Code condition météo : `dNNN` (jour) / `nNNN` (nuit), ex. `d400`, accompagné de `symbolPhrase`.                                          |
| **`significance`**      | Niveau d'une alerte Foreca → couleur (jaune/orange/rouge/violet).                                                                        |
| **Confiance `g/y/o`**   | Indicateur Foreca de fiabilité d'une prévision journalière (green / yellow / orange).                                                    |
| **AQI**                 | Air Quality Index, échelle EPA (code couleur + polluant dominant).                                                                       |
| **Nowcast**             | Prévision pluie minute par minute (`forecast/minutely`), appelée seulement si `precipProb > 30 %`.                                       |
| **Pré-permission**      | Écran maison expliquant pourquoi la géoloc est demandée, AVANT la boîte de dialogue iOS (irréversible si refusée).                       |
| **App shell**           | Coquille HTML/CSS/JS de l'app, précachée par le service worker.                                                                          |
| **Terminateur (test)**  | Équinoxe → passe par les 2 pôles ; solstices → cercle polaire éclairé/dans l'ombre 24 h.                                                 |

---

## 7. Limites iOS (à ne jamais masquer — brief §8.5 / §10.4)

- **Vibration : non supportée** par Safari iOS (même PWA installée).
  Abstraction `haptics.tick()` avec détection `'vibrate' in navigator` :
  vibration courte sur Android/desktop, no-op silencieux sur iOS. Compensation
  visuelle obligatoire. Contournements non officiels (`<input switch>`) :
  **ne pas implémenter** sans accord d'Audric.
- **Push** : seulement si installée sur l'écran d'accueil (iOS 16.4+), geste
  utilisateur requis. → v2, cron Vercel + Web Push.
- **Background/Periodic Sync** : indisponibles. **Géoloc arrière-plan** :
  impossible. **Stockage** : IndexedDB = cache, purge possible après ~7 j.

Ces points sont documentés dans le README, section « Limites connues sur iOS ».

---

## 8. Ce qu'Audric fait lui-même (rappeler au bon moment, jamais en bloc)

Compte Foreca + clé (My API) · exécuter `scripts/probe-foreca.mjs` et renvoyer
la sortie · fournir les icônes Foreca si son plan y donne droit · créer le
projet Vercel + région `cdg1` · ajouter `FORECA_API_KEY` aux 3 environnements
Vercel · valider chaque phase sur iPhone réel · installer la PWA + tester
offline · tester avec VoiceOver · surveiller le quota Foreca · générer les clés
VAPID (si v2 push).

---

## 9. Journal des phases

### Phase 0 — Fondations _(validée par Audric, PR #1)_

Structure du repo, Vite 8/React 19/TS strict, Tailwind v4 + tokens `@theme`,
ESLint 9 flat + Prettier + Husky + lint-staged + commitlint, Vitest + Testing
Library + Playwright + MSW + axe (tests fumée), devcontainer, CI GitHub Actions
(typecheck/lint/format/test/build + job « aucun secret » + e2e + lighthouse non
bloquant + audit), `.env.example`, `vercel.json`, `api/health.ts`, helper
`geo.ts` (+ tests), modèle de domaine `domain.ts`.

### Phase 1 — Proxy Foreca _(en cours — branche `feat/phase-1-foreca`)_

**Partie A (faite, indépendante du schéma Foreca) :**

- `scripts/probe-foreca.mjs` — sonde des 8 endpoints du §4.2, sauvegarde les
  réponses brutes dans `tests/fixtures/probe/`, détecte le mode d'auth
  (Bearer / `?token=` / ancien flux). **À exécuter par Audric.**
- `api/_lib/foreca.ts` — client HTTP : auth Bearer (ou `query` via
  `FORECA_AUTH_MODE`), timeout 6 s, 2 retries backoff+jitter sur 5xx/timeout
  seulement, `ForecaError` typée (401 → 500 interne « clé invalide », 429 avec
  `Retry-After`). Ne valide pas la forme des réponses.
- `api/_lib/params.ts` — validation zod des paramètres entrants (bornes
  lat/lon, liste blanche langue/unités).
- `api/_lib/kv.ts` — magasin clé-valeur : Upstash Redis si configuré, sinon
  repli mémoire par instance.
- `api/_lib/cache.ts` — TTL du §4.3, `withCache()`, en-tête `Cache-Control`.
  Ne met jamais une erreur en cache.
- `api/_lib/ratelimit.ts` — 60 req/min/IP, fenêtre fixe.
- Tests : 46 au total, couverture `api/_lib` ≈ 96 %.

**Partie B (bloquée — attend la sortie de la sonde) :**

- `api/_lib/schemas.ts` (zod, dérivé du résultat réel) + `api/_lib/normalize.ts`
  (Foreca → `WeatherSnapshot`) + `api/weather.ts` + `api/search.ts` + fixtures
  MSW + `src/shared/lib/symbols.ts` (mapping symboles + test exhaustif).
