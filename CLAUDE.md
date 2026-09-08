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

| Sujet      | Brief     | Réel                    | Raison                                                                                                                           |
| ---------- | --------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Node       | 22 LTS    | `>=22` (Codespace : 24) | 24 est désormais LTS et déjà provisionné ; `.nvmrc`/CI/devcontainer restent sur 22                                               |
| Vite       | « 6+ »    | 8.x                     | 6+ satisfait ; tout l'écosystème (vitest 5, plugin-react 6) supporte 8                                                           |
| TypeScript | non pinné | `~5.9`                  | `typescript-eslint` exige `typescript < 6.1` ; TS 7 (portage Go) casserait le lint type-aware. **Fermer la PR Dependabot TS 6.** |
| ESLint     | 9 flat    | 9 flat                  | conforme                                                                                                                         |
| `motion`   | stack §5  | **non installé**        | +40 ko gzip pour un seul ressort (Phase 4) ; ressort maison à la place. Réintroductible en `lazy()` si Phase 6 en a besoin.      |
| `drei`     | stack §2  | **non installé**        | seul `useTexture` était utilisé ; `TextureLoader` three suffit. À reconsidérer si Phase 8 veut des helpers drei.                 |

Installées à leur phase : `zod` (1), `three`/`@react-three/fiber` (3),
`suncalc` (3), `zustand`/`@tanstack/react-query`/`luxon`/`lucide-react` (2),
`idb-keyval` (5). Restent : `vite-plugin-pwa` (7).

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

### État au 2026-09-08 (fin de session)

- **`main` : Phases 0 → 4 mergées.** Phase 5 en attente dans la **PR #17**
  (`sync/phase-5` → `main`, rebasée, à merger en rebase).
- Toutes les branches `feat/phase-N-*` sont sur `origin`. Les branches
  `sync/phase-N` sont l'artefact du merge stacké : à ignorer une fois #17
  mergée.
- **Piège récurrent réglé pour la suite** : ne plus empiler les PRs de phase
  sur des branches intermédiaires. Chaque nouvelle phase = brancher depuis
  `origin/main` à jour, PR → `main` directement.
- **PRs Dependabot ouvertes (#4–#10)** : #9 (TypeScript 6) est à **fermer**
  (casse `typescript-eslint`). Les autres sont sûres.
- `gh pr merge` est bloqué pour Claude Code dans ce harness — c'est Audric
  qui merge (ou `! gh pr merge N --rebase`).

### Pour reprendre (Phase 6 — Enrichissement)

Bottom sheets de détail au tap sur une métrique (graphe 24 h + min/max +
explication), prévisions journalières 7–10 j (icône, min/max, pluie,
confiance `g/y/o`), qualité de l'air détaillée (sous-indices EPA déjà dans
`AQI_*` de la sonde — étendre `AirQualityStep`), alertes (état vide,
endpoint 403), réglages avancés. La primitive `Sheet` existe déjà
(`src/shared/ui/Sheet.tsx`). Le graphe 24 h : charte `dataviz` à charger.

### Phase 0 — Fondations _(mergée, PR #1)_

Structure du repo, Vite 8/React 19/TS strict, Tailwind v4 + tokens `@theme`,
ESLint 9 flat + Prettier + Husky + lint-staged + commitlint, Vitest + Testing
Library + Playwright + MSW + axe (tests fumée), devcontainer, CI GitHub Actions
(typecheck/lint/format/test/build + job « aucun secret » + e2e + lighthouse non
bloquant + audit), `.env.example`, `vercel.json`, `api/health.ts`, helper
`geo.ts` (+ tests), modèle de domaine `domain.ts`.

### Phase 1 — Proxy Foreca _(en cours — branche `feat/phase-1-foreca`, PR #2)_

**Résultat de la sonde (2026-09-08, Paris) :**

- Auth : **Bearer statique OK** (pas d'ancien flux user/password à implémenter).
- `warning` → **403** : les alertes ne sont **pas** dans le plan Foreca d'Audric.
  → `WeatherSnapshot.warnings` est toujours `[]`, l'endpoint n'est jamais appelé.
- `air-quality` → 200 : la qualité de l'air **est** dans le plan.
- Formats notables : `daily.sunrise/sunset` = horloge locale `"HH:MM:SS"` (les
  epochs sont séparés) ; `daily.moonPhase` = **degrés 0–360** (normalisé en
  fraction 0–1) ; `daily.confidence` ∈ `g|y|o` ; `current` renvoie `precipRate`
  (pas `precipAccum`, pas `precipType`).

**Fait :**

- `scripts/probe-foreca.mjs` — sonde des 8 endpoints du §4.2, détecte le mode
  d'auth. Sorties brutes dans `tests/fixtures/probe/` (gitignoré).
- `api/_lib/foreca.ts` — client HTTP : auth Bearer (ou `query` via
  `FORECA_AUTH_MODE`), timeout 6 s, 2 retries backoff+jitter sur 5xx/timeout
  seulement, `ForecaError` typée.
- `api/_lib/params.ts` — validation zod des paramètres entrants.
- `api/_lib/kv.ts` — Upstash Redis si configuré, repli mémoire sinon.
- `api/_lib/cache.ts` — TTL du §4.3, `withCache()`, `Cache-Control`.
- `api/_lib/ratelimit.ts` — 60 req/min/IP.
- `api/_lib/schemas.ts` — schémas zod **dérivés de la sonde réelle** (champs de
  mesure `.nullable()` par principe, brief §4.1).
- `api/_lib/normalize.ts` — Foreca → modèle de domaine.
- `api/_lib/weather-service.ts` — agrégation : `location` (fuseau) puis
  `current`+`hourly`+`daily`+`air-quality` en `Promise.allSettled`. `current` et
  `hourly` obligatoires ; `daily`/`air-quality` en échec → état vide. **5 appels
  à froid, 0 à chaud.**
- `api/_lib/search-service.ts` — `location/search` → `Place[]`, cache 24 h.
- `api/_lib/http.ts` — `withApi()` : rate-limit + traduction des erreurs
  (BadRequest → 400, Foreca 401 → 503 générique + log, 429 → 503, 5xx → 502).
- `api/weather.ts` + `api/search.ts` — routes (signature Web/Fetch).
- `src/mocks/` — MSW mocke Foreca en dev et en test, fixtures dérivées de la
  sonde dans `src/mocks/fixtures/`.
- **80 tests**, couverture `src/shared/lib` + `api/_lib` ≈ 98 % / 93 % branches.

### Phase 2 — Squelette UI _(validée, PR #3)_

**Fait :**

- **Lib pure + tests :** `units.ts` (conversions + formatage, `null` → « — »),
  `time.ts` (luxon, fuseau de la ville), `color.ts` (WCAG), `theme.ts`
  (`resolveTheme` day/night/dawn/dusk + contraste garanti — test 20 points
  aube/crépuscule, brief §11), `symbols.ts` (décodeur Foreca `dNNN`/`nNNN`
  **total**, test exhaustif §4.4), `interpolate.ts` (linéaire vs plus proche
  voisin, brief §8.3).
- **Données :** React Query + `fetchWeather`/`fetchSearch` (front n'appelle que
  `/api/*`). `useWeatherSnapshot` + `selectConditions` (interpole les nombres,
  symbole/phrase au plus proche, dérive le thème).
- **Thème :** `useApplyTheme` pilote les variables CSS + `<meta theme-color>` ;
  override manuel Auto/Clair/Sombre (`useSettings`, persisté localStorage).
  Encres secondaires `--app-ink-muted` (≥ 4.5:1) / `--app-ink-faint` (≥ 3:1)
  par schéma. **Le fond ambiant peut être un dégradé ; le texte repose sur une
  surface unie qui bascule franchement au milieu de transition** (interprétation
  de l'exigence §11, à valider sur iPhone).
- **UI :** layout 15/60/25 (`HomeScreen`), `WeatherIcon` (13 icônes filaires
  maison, stroke 1.5), `MetricGrid` (Vent/Humidité/UV/AQI), `HourStrip`
  (sélecteur d'heure — sert aussi d'alternative non gestuelle §8.6),
  `Attribution` Foreca, `Skeleton`.
- **MSW navigateur** : `/api/weather` sert `weather-snapshot.json` recalé sur
  « maintenant » (`rebaseSnapshot`). Chunk MSW absent du build de prod ;
  `VITE_ENABLE_MOCKS=true` (`.env.mock`, `pnpm build:mock`) le réactive pour
  e2e / Lighthouse.
- **Tests :** 141 unitaires + 5 e2e (écran, sélection d'heure, axe, captures
  clair/sombre). Bundle JS 100 kB gzip (budget §12 : < 180).

### Phase 3 — Globe 3D _(validée, PR #13)_

- **`src/shared/lib/sun.ts`** — position solaire PURE (formules NOAA abrégées) :
  `subsolarPoint()`, `sunDirection()`, `isSunlit()`. **Les 4 tests obligatoires
  du §7.2 passent** (équinoxe → terminateur par les pôles ; solstices → cercle
  polaire éclairé/dans l'ombre 24 h ; Paris 21 juin 22 h éclairé / 21 déc 17 h 30
  dans l'ombre) + cross-check indépendant avec `suncalc`.
- **`src/shared/lib/orthographic.ts`** — projection orthographique + `nightRegion()`
  (polygone de l'hémisphère nuit) pour le fallback 2D. Même code solaire que le
  globe WebGL.
- **`scripts/fetch-textures.mjs`** — télécharge NASA Blue/Black Marble
  (**domaine public**, `public/textures/CREDITS.md`), redimensionne + webp.
  Set mobile ≈ 625 ko, total 1,3 Mo (budget §7.4 : mobile < 1,5 Mo).
- **`src/features/globe/`** :
  - `GlobeScene` — sphère 96×96, `ShaderMaterial` day/night
    (`mix(nuit, jour, smoothstep(-0.10, 0.10, dot(normal, sunDir)))` — formule
    exacte du §7.1), halo fresnel additif `--color-primary-soft`, nuages
    (opacité pilotée par `cloudiness`), marqueur ville, caméra orientée +
    **slerp quaternion** au changement de ville, `frameloop="demand"`,
    `dpr={[1,2]}`, `dispose()` au démontage.
  - `Fallback2D` — projection SVG + ombre, **obligatoire** (brief §7.5) :
    déclenché si pas de WebGL, contexte perdu, ou `prefers-reduced-motion`.
  - `Globe` — n'importe PAS three ; `GlobeCanvas` (et le chunk three) chargé
    en `lazy()` seulement pour le rendu WebGL. La ville + la température
    s'affichent avant le globe (§7.4).
- Chunk `three` ≈ 236 ko gzip, séparé (hors budget §12) ; bundle initial
  inchangé à **101 ko gzip**.
- **163 tests** unitaires + e2e (globe WebGL se charge ; reduced-motion →
  fallback 2D + axe).

**Écarts / à polir (Phase 8) :** léger smear de texture au pôle Nord (atténué
par anisotropy) ; le chunk three est lourd (drei tire beaucoup — envisager de
le retirer) ; `@react-three/fiber` v9 exige `react <19.3` (notre `^19.2` le
permet, à surveiller).

### Phase 4 — Bague temporelle _(validée, PR #15)_

Le composant le plus délicat du brief (§8). LE test au pouce sur iPhone.

- **Logique pure + tests :** `angle.ts` (`AngleAccumulator` — **franchissement
  ±π testé**, le bug classique), `geometry.ts` (1 tour = 12 h, plage
  −24 h → +72 h, graduations), `physics.ts` (inertie friction 0.94, snapping —
  **renforcé à < 30 min de maintenant**), `haptics.ts` (`tick()` + détection
  `navigator.vibrate`, no-op iOS + tick sonore optionnel).
- **`cursor.ts`** — curseur temporel singleton hors React (brief §8.4) :
  `subscribeFast` (globe, chaque frame) vs `subscribeThrottled` (DOM, ≤ 11 Hz).
  **Aucun re-render de `HomeScreen` pendant le scrub.**
- **`LiveConditionsProvider`** — calcule les conditions au curseur une fois et
  les diffuse par contexte ; seuls les consommateurs (température, métriques,
  sous-ligne, thème) se re-rendent, l'arbre passe en `children`.
- **`TimeRing.tsx`** — bague SVG : graduations rotor pilotées par ref à 60 fps
  (`setAttribute transform`), repère « maintenant », zone tactile 60 px,
  **Pointer Events uniquement** + `setPointerCapture` + `touch-action: none`,
  inertie + aimantation animées en rAF, double-tap → retour à maintenant.
  `role="slider"` + clavier (←/→ ±1 h, ⇧ ±6 h, Home, PageUp/Down ±24 h) +
  `aria-live` débouncé 500 ms.
- **Compensation haptique iOS** (`haptic-pulse.ts`) : micro-impulsion d'échelle
  sur la graduation franchie (l'API Vibration n'existe pas sur Safari iOS).
- **Alternative non gestuelle** (`HourStrip`) affichée en `prefers-reduced-
motion` ou via les réglages (brief §8.6).
- Le **globe suit le curseur** : `subsolarPoint(getCursorEpoch())` lu dans
  `useFrame`, nébulosité interpolée sur les pas horaires. Scrub → le soleil se
  déplace, le thème bascule, la température s'anime (ressort maison).
- **Écart brief :** `motion` (framer-motion) prévu au §5 mais non utilisé —
  +40 ko gzip pour un seul ressort. Ressort maison à la place (écrit
  directement dans le nœud texte, aucun re-render). `motion` sera réintroduit
  en lazy si une Phase 6 en a vraiment besoin (bottom sheets).
- **207 tests** unitaires + e2e (bague au geste + clavier, chips, scrub stable,
  axe). Bundle initial **104 ko gzip**.

### Phase 5 — Lieux _(en cours — branche `feat/phase-5-places`, PR #16)_

- **`GET /api/place?lat&lon`** — coordonnées → `Place` (Foreca `location`, cache
  30 j). `resolvePlace()` factorisé, réutilisé par l'agrégateur météo.
- **`geolocation.ts`** — wrapper `navigator.geolocation` : les **3 états
  explicites** (accordée / refusée / indisponible) + `queryGeoPermission()`
  (état SANS déclencher la boîte de dialogue). Testé.
- **Onboarding** — 2 écrans, le 2ᵉ est une **pré-permission** : explication
  AVANT `getCurrentPosition()` (irréversible une fois refusée sur iOS, §9.1).
  Refus → on reste sur l'écran, recherche manuelle proposée.
- **`SearchSheet`** — champ debouncé 300 ms, résultats via `/api/search`,
  **historique des 5 dernières** recherches, `inputMode="search"`.
- **`placesStore`** (zustand + **IndexedDB** via `idb-keyval`, pas localStorage) :
  lieu courant, favoris **≤ 8 réordonnables**, historique, `onboardingDone`,
  `geoStatus`. `updateCurrentMeta` affine le nom/fuseau depuis la réponse météo.
- **`PlacesMenu`** (drawer) : favoris (bascule, monter/descendre, retirer),
  « ajouter aux favoris », lien Réglages. **`SettingsSheet`** : unités, thème,
  langue, tick sonore, rangée d'heures, effacer les données.
- **`useSwipePlaces`** — swipe horizontal entre favoris (§9.4).
- **`LocationGate`** décide l'écran d'entrée selon `hydrated` / `current` /
  `onboardingDone`.
- **Mode mock** : `seedMockPlace()` saute l'onboarding (Paris) sauf
  `?onboarding=1` (pour tester le parcours permission en e2e).
- **`Sheet`** — primitive bottom sheet (`role="dialog"`, Échap, backdrop),
  sans dépendance d'animation.
- Correctif Phase 4 découvert au passage : l'inertie de la bague écrasait un
  retour à « maintenant » (Home / double-tap) — le loop bail maintenant sur
  `isFollowingNow()`.
- **222 tests** unitaires + e2e (onboarding, **refus de permission → recherche
  manuelle**, permission accordée, favoris). Bundle **110 ko gzip**.

**Pas encore fait :** bottom sheets de détail + graphes + prévisions 10 j +
alertes + réglages avancés (Phase 6).
