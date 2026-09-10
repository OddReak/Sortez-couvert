# CLAUDE.md — Terra

Guide de travail pour Claude Code sur ce dépôt. **Tenu à jour à chaque phase.**

Le cahier des charges qui fait autorité est `docs/PROMPT-MAITRE.md`. En cas de
doute, c'est lui qui tranche. Ce fichier en est le résumé opérationnel.

---

## 1. Commandes

| Besoin           | Commande                                                         |
| ---------------- | ---------------------------------------------------------------- |
| Dev              | `pnpm dev` (port 5173)                                           |
| Typecheck        | `pnpm typecheck`                                                 |
| Lint             | `pnpm lint` / `pnpm lint:fix`                                    |
| Format           | `pnpm format` / `pnpm format:check`                              |
| Tests unitaires  | `pnpm test` / `pnpm test:watch`                                  |
| Couverture       | `pnpm test:coverage`                                             |
| Tests E2E        | `pnpm test:e2e` (Playwright, iPhone 15)                          |
| Build            | `pnpm build` (typecheck + `vite build`)                          |
| Preview du build | `pnpm preview` (4173) · `pnpm preview:real` (4174, SW PWA actif) |
| Assets PWA       | `pnpm generate:pwa-assets` (icônes + splash iOS)                 |

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

| Sujet          | Brief                       | Réel                         | Raison                                                                                                                                               |
| -------------- | --------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node           | 22 LTS                      | `>=22` (Codespace : 24)      | 24 est désormais LTS et déjà provisionné ; `.nvmrc`/CI/devcontainer restent sur 22                                                                   |
| Vite           | « 6+ »                      | 8.x                          | 6+ satisfait ; tout l'écosystème (vitest 5, plugin-react 6) supporte 8                                                                               |
| TypeScript     | non pinné                   | `~5.9`                       | `typescript-eslint` exige `typescript < 6.1` ; TS 7 (portage Go) casserait le lint type-aware. **Fermer la PR Dependabot TS 6.**                     |
| ESLint         | 9 flat                      | 9 flat                       | conforme                                                                                                                                             |
| `motion`       | stack §5                    | **non installé**             | +40 ko gzip pour un seul ressort (Phase 4) ; ressort maison à la place. Réintroductible en `lazy()` si Phase 6 en a besoin.                          |
| `drei`         | stack §2                    | **non installé**             | seul `useTexture` était utilisé ; `TextureLoader` three suffit. À reconsidérer si Phase 8 veut des helpers drei.                                     |
| splash iOS     | `pwa-asset-generator` §10.2 | `@vite-pwa/assets-generator` | sharp (pas de puppeteer/chromium à installer), intégration native `vite-plugin-pwa` (`pwaAssets`) : génération au build, aucun binaire commité.      |
| e2e hors ligne | iPhone 15 §13               | Chromium (`Pixel 7`)         | WebKit + `context.setOffline` + service worker plante dans Playwright. Le comportement testé (cache SW / repli IndexedDB) est indépendant du moteur. |
| Lighthouse PWA | catégorie PWA ≥ 95 §12      | supprimée dans Lighthouse 12 | LHCI bloque sur perf / a11y / best-practices ≥ 0.95 sur le build réel ; installabilité = `tests/unit/manifest.test.ts` + e2e offline.                |

Installées à leur phase : `zod` (1), `three`/`@react-three/fiber` (3),
`suncalc` (3), `zustand`/`@tanstack/react-query`/`luxon`/`lucide-react` (2),
`idb-keyval` (5), `vite-plugin-pwa` + `workbox-*` + `@vite-pwa/assets-generator`
(7). Tout est en place.

---

## 3. Arborescence

```
api/            Vercel Functions — proxy Foreca (la clé reste serveur)
  health.ts     GET /api/health (sonde, sans secret)
  _lib/         (Phase 1) client HTTP, cache, ratelimit, schemas zod
docs/           Brief maître + brief design + mockup + DEPLOIEMENT.md
public/         textures/ + favicon.svg (favicon + source icônes/splash PWA)
                icônes PWA + splash iOS : générés au build (non commités)
scripts/        fetch-textures, probe-foreca, check-bundle-budget
src/
  app/          bootstrap, providers, mini-routeur (router.tsx), screens/
                (HomeScreen · PrivacyPage /confidentialite · HelpPage /aide)
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
  pwa/          sw.ts (SW Workbox custom), register.ts, UpdatePrompt, install (Phase 7)
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

**Fait** : compte + clé Foreca ✓ · sonde ✓ · projet Vercel perso lié au repo ✓ ·
`FORECA_API_KEY` sur Vercel ✓ · Analytics + Speed Insights ✓ · domaine
`terra-weather.vercel.app` ✓.

**Reste** (détaillé dans `docs/DEPLOIEMENT.md`) : base **Upstash Redis** +
`UPSTASH_REDIS_REST_URL/TOKEN` sur les 3 environnements ; **protection par mot de
passe des déploiements Preview** ; premier déploiement + checklist post-deploy ;
tests iPhone réel (install PWA, offline, **VoiceOver**) ; surveiller le quota
Foreca (2 000 req/j) ; clés VAPID (si v2 push).

---

## 9. Journal des phases

### Retouches UX post-Phase 9 _(branche `feat/ux-day-globe-ring`, 2026-09-10)_

Sur demande d'Audric, 5 ajustements (gate verte : typecheck / lint / format /
280 tests unitaires / build ; e2e ciblés verts) :

1. **Contraste texte aube/crépuscule** (`shared/lib/theme.ts`) : le dégradé
   ambiant restait de teinte moyenne → texte illisible (cf. `docs/image.png`).
   Désormais l'aube et le crépuscule sont **toujours en schéma sombre** (texte
   clair) et le dégradé est bridé côté nuit sur toute la transition ; bascule
   franche vers le plein jour à la sortie de la fenêtre ±45 min.
2. **Sens de la bague** (`time-ring/geometry.ts` + `TimeRing.tsx`) : le rotor
   suit le doigt — rotation **horaire = on avance**, anti-horaire = on recule.
   Le futur est désormais dessiné en anti-horaire ; `secondsToAngle` inchangé,
   c'est le signe de la rotation du rotor et des graduations qui a été inversé.
3. **Bague bornée à 24 h** : plus de plage −24 h → +72 h. La bague est un cadran
   00:00 → 23:59 du **jour affiché** (fuseau ville). `clampEpoch(epoch,
dayStart, dayEnd)`, `graduations(cursor, dayStart, dayEnd, …)`. Le jour actif
   vit dans `time-ring/cursor.ts` (`configureToday` / `selectDay` /
   `getDayWindow` / `getActiveDayStart`, hook `useActiveDayStart`).
4. **Jour du carrousel → globe** : taper un jour sous le globe recale la bague
   sur ce jour (mêmes fonctions : fond selon l'heure regardée, position du
   soleil, thème). **Plus de popup « Prévisions 7 jours »** depuis le carrousel
   ni le menu — le détail 7 jours reste accessible depuis **Réglages**
   (`SettingsSheet`). `selectConditions` choisit les éphémérides du jour affiché
   et approxime la température des jours hors couverture horaire (J+4 → J+7)
   via une courbe diurne min/max.
5. **Plus de swipe entre lieux** (`useSwipePlaces` supprimé). Taper le nom de la
   ville en haut ouvre `PlacePickerSheet` (lieu courant + favoris + lien
   recherche). Pas d'indicateur visuel (feature connue).

### État au 2026-09-09 (fin de session)

- **`main` : Phases 0 → 8 mergées.** Dependabot #4–#8, #10 mergées ; #9 (TS 6)
  fermée. Analytics/Speed Insights Vercel installés (PRs auto #21/#22).
- **Phase 9 terminée sur `feat/phase-9-production`** (PR à ouvrir) — gate verte
  (typecheck / lint / format / 271 tests unitaires / build / e2e / Lighthouse
  ≥ 0.95). Bundle initial **~113 ko gzip**.
- **Il reste à Audric** (voir `docs/DEPLOIEMENT.md`) : créer la base Upstash
  Redis + renseigner `UPSTASH_REDIS_REST_*` × 3 env Vercel ; activer la
  protection par mot de passe des Preview ; premier déploiement + checklist ;
  tests sur iPhone réel (install, offline, **VoiceOver**).
- **Piège récurrent réglé** : brancher chaque phase depuis `origin/main` à jour,
  PR → `main` directement.
- `gh pr merge` est bloqué pour Claude Code — c'est Audric qui merge.

### v2 (sur accord explicite)

Notifications push d'alertes (VAPID + cron Vercel + Web Push), nowcast pluie
minute par minute (`forecast/minutely`), carte radar, widgets. Rien à commencer
sans le feu vert d'Audric.

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

### Phase 9 — Production _(terminée — branche `feat/phase-9-production`)_

- **Mini-routeur maison** `src/app/router.tsx` (`useRoute` / `navigate` / `Link`,
  ~60 lignes, aucune dépendance) — l'app reste mono-écran, seules `/aide` et
  `/confidentialite` ont une vraie URL (le rewrite SPA de `vercel.json` sert
  déjà tout). `App.tsx` : `<Routes>` switch sur `pathname`.
- **`PrivacyPage` (`/confidentialite`)** — RGPD : responsable, données transmises
  à Foreca (jamais journalisées), stockage local + bouton d'effacement,
  Analytics sans cookie, base légale, durées, hébergement UE, contact = issue
  GitHub. **`HelpPage` (`/aide`)** — installation iOS/Android, prise en main,
  hors ligne, limites iOS. Coquille commune `StaticPage` + `Section`.
- Liens : `SettingsSheet` (Aide / Confidentialité), `Attribution` du pied
  (« · Confidentialité », toujours visible).
- **`<Analytics/>` / `<SpeedInsights/>`** (câblés par les PRs auto #21/#22)
  rendus **uniquement en build réel** (`import.meta.env.PROD && !VITE_ENABLE_MOCKS`)
  — pas de bruit réseau/404 en e2e / Lighthouse. En prod ils passent par
  `/_vercel/*` (même origine) → CSP stricte inchangée.
- **`vercel.json`** : `X-Frame-Options: DENY`, `Cache-Control immutable` sur
  `/assets/*`. **`.env.example`** : Upstash documenté (obligatoire en prod).
  **`api/health.ts`** : ajoute `region` / `commit` / `redis` (sonde post-deploy).
- **`docs/DEPLOIEMENT.md`** — procédure Vercel + Upstash + variables + checklist
  post-déploiement + rollback, en français.
- **`tests/e2e/pages.spec.ts`** (URL directes, navigation depuis les réglages,
  a11y). **271 tests** unitaires (+ router, PrivacyPage, HelpPage) + e2e.
  Bundle inchangé (~113 ko gzip).

### Phase 8 — A11y & perf _(mergée)_

- **Focus visible** : `:focus-visible` global (anneau 2 px, token `--app-focus`
  par schéma) dans `theme.css`.
- **`prefers-contrast: more`** : `theme.css` (encres à pleine encre, filets
  marqués) + `resolveTheme(highContrast)` force la surface de texte en pleine
  couleur (pas de teinte aube/crépuscule). Câblé via `usePrefersContrast()` →
  `selectConditions` → `LiveConditions`. Testé (`theme.test.ts`, 40 points).
- **Polices** : `@fontsource-variable/inter` (7 sous-ensembles) → **1 `@font-face`
  latin-only** (`src/shared/styles/fonts.css`, `@import` dans `theme.css`). Plugin
  Vite `fontPreloadPlugin` injecte `<link rel=preload>` du woff2 hashé. Précache
  SW : 611 → 444 ko.
- **Layout responsive** (§6 réinterprété — multi-appareils) : `HomeScreen` passe
  de `flexBasis` 15/60/25 rigides à un flux flexible (`shrink-0` haut/bas,
  `flex-1 min-h-0` centre). Globe = `aspect-square h-full max-h-80 max-w-[86%]`
  dans un wrapper `grid place-items-center` → se dimensionne sur la hauteur
  dispo. `PlaceScreen` : `overflow-y-auto` (paysage/écran court → défilement, pas
  d'écrasement). **Corrige le débordement iPhone SE** (plus de chevauchement
  MAINTENANT / sous-ligne). `SpringTemp` court-circuité en reduced-motion.
- **axe partout** : `tests/e2e/_helpers.ts#expectNoA11yViolations` (termine les
  animations d'abord). `tests/e2e/a11y.spec.ts` : onboarding, ChooseLocation
  (`?choose=1`, hook mock), recherche, menu, réglages, prévisions, alerte,
  HourStrip. Specs existants refactorés sur le helper.
- **Responsive e2e** : `tests/e2e/responsive.spec.ts` (SE / Pro Max / desktop +
  paysage court) — rendu complet, 0 scroll horizontal, sous-ligne au-dessus du
  repère « MAINTENANT ».
- **Lighthouse CI bloquant** (`.lighthouserc.json`, `continue-on-error` retiré) :
  perf / a11y / best-practices **≥ 0.95** en `error`. Tourne sur le **build
  réel** (`pnpm build`, écran d'entrée = 1ᵉʳ chargement représentatif) — la
  catégorie PWA n'existe plus dans Lighthouse 12. `visualizer` sort **hors
  `dist/`** (`stats.html` racine) sinon LHCI l'audite aussi et plombe le score.
  `sourcemap: true` (audit `valid-source-maps`). `main.tsx` : SW enregistré
  `setTimeout(800)` après le 1er rendu (hors TBT ; `requestIdleCallback` cassait
  l'e2e offline).
- **Budget bundle** : `scripts/check-bundle-budget.mjs` (chunk `index-*.js`
  gzip < 180 ko) en CI, job `verify`.
- **Manifest** : extrait en `src/pwa/manifest.ts`, `tests/unit/manifest.test.ts`.
- **263 tests** unitaires + e2e. Bundle **~113 ko gzip**.

### Phase 7 — PWA & hors ligne _(mergée, PR #19)_

- **`vite-plugin-pwa` en `injectManifest`** — SW custom `src/pwa/sw.ts`
  (Workbox) : précache coquille (HTML/CSS/`index-*.js`/polices ;
  `manifest.webmanifest` ajouté d'office — **ne PAS le remettre dans les globs**,
  sinon `add-to-cache-list-conflicting-entries` → SW ne s'enregistre pas) ;
  `NavigationRoute` → `index.html` ; CacheFirst textures + fonts gstatic 30 j ;
  `StaleWhileRevalidate` `/assets/*.{js,css}` (le chunk three ~890 ko hors
  précache, dispo offline après 1ʳᵉ visite) ; NetworkFirst `/api/*` timeout 3 s,
  jamais d'erreur en cache. `skipWaiting` **jamais** auto (message `SKIP_WAITING`).
- **`src/pwa/register.ts`** — `registerSW` de `virtual:pwa-register` (`immediate`),
  store `useSyncExternalStore` `{ needRefresh, offlineReady }`. **No-op en DEV /
  `VITE_ENABLE_MOCKS`** (MSW tient le SW en mock). `UpdatePrompt` = toast
  « Nouvelle version · Recharger » (§9.12). `useInstallPrompt` +
  bouton « Installer Terra » dans les réglages (Android/desktop ; iOS = message).
- **`mode: 'mock'`** : plugin PWA en `disable: true` (SW MSW seul en `build:mock` ;
  `virtual:pwa-register` reste résolvable). Config Vite → `defineConfig(({mode})…)`.
- **`build:mock` sort dans `dist-mock/`** (pas `dist/`) — sinon les 2 `webServer`
  Playwright (`preview:mock` + `preview:real`) écrasent le même `dist/` et
  servent tous les deux le dernier build. `.lighthouserc.json` → `./dist-mock`.
  eslint/prettier ignorent `dist-mock` + `dev-dist`.
- **Cache hors ligne** : `snapshotCache.ts` (idb-keyval, `terra:snapshot:<id>`),
  `resolveWeather()` = fetch → sauvegarde ; échec → dernier snapshot du lieu.
  `StaleDataBanner` (`fetchedAt` > 20 min) monté à côté d'`AlertBanner`.
  `rebaseSnapshot` inchangé. `clearAll` (réglages) purge aussi les snapshots.
- **Assets** : `pwa-assets.config.ts` + `@vite-pwa/assets-generator` — icônes
  192/512/maskable + 48 `apple-touch-startup-image` (12 iPhones × 2 orient. × 2
  thèmes), **générés au build**, source `public/favicon.svg`. `sharp: true`
  dans `pnpm-workspace.yaml`.
- **`tsconfig.worker.json`** (lib WebWorker, `exactOptionalPropertyTypes: false`
  — les plugins Workbox), ajouté à `pnpm typecheck` + `eslint` (globals
  serviceworker). `pwa-assets.config.ts` hors projet TS (eslint `disableTypeChecked`).
- **`vercel.json`** : `Cache-Control: must-revalidate` sur `/sw.js` +
  `/manifest.webmanifest`. CSP déjà OK (`worker-src`, `manifest-src`).
- **e2e** : `tests/e2e/offline.spec.ts` sur **build réel** (`preview:real` :4174,
  2ᵉ `webServer`) + **Chromium** (`offline-chromium`, `Pixel 7`) — WebKit +
  `setOffline` + SW plante dans Playwright. Le test : onboarding + géoloc →
  météo → SW actif → `route(** → abort)` + reload → app shell + bandeau + °.
  Les specs iPhone 15 ignorent `offline.spec.ts` (`testIgnore`). CI : installer
  `webkit chromium`.
- **258 tests** unitaires (+14 : snapshotCache, resolveWeather, StaleDataBanner,
  register, UpdatePrompt) + e2e. Bundle **~117 ko gzip**.

### Phase 6 — Enrichissement _(mergée, PR #18)_

- **Domaine + proxy** : `AirQualityStep.subIndices` (sous-indices EPA
  `co/no2/o3/so2/pm10/pm25`) — `normalizeAirQuality` mappe les `AQI_*` de la
  sonde ; `null` si le plan ne les renvoie pas.
- **Libs pures + tests** : `metricMeta.ts` (descripteur vent/humidité/UV +
  échelle UV), `chartPath.ts` (géométrie SVG du graphe, ruptures sur `null`,
  extrêmes, repère de survol), `aqi.ts` étendu (bandes EPA → couleur + conseil,
  polluant dominant), `shared/lib/forecast.ts` (`confidenceMeta` g/y/o),
  `alerts/alertMeta.ts` (`significance` → couleur/label/`aria-live`),
  `time.ts#startOfDayEpoch`.
- **Bottom sheet de détail** (§9.6) : `MetricGrid` → boutons ; tap ouvre
  `MetricSheet` = valeur courante + `MetricChart` (SVG inline, aucune lib,
  charte `dataviz` : série mono, tokens `@theme`, `<title>` + table de valeurs
  repliable) + min/max 24 h + explication. Fenêtre −6 h → +18 h autour du
  curseur. UV : échelle colorée. AQI : barres des sous-indices + polluant
  dominant + conseil santé.
- **Prévisions 7 jours** (§9.7) : `DailyForecastSheet` depuis `PlacesMenu`
  (« Prévisions 7 jours »). Le proxy récupère 10 périodes, l'UI en montre 7
  (décision Audric). Icône, jour (`formatRelativeDay`), pluie, barre min/max,
  pastille de confiance + label a11y.
- **Alertes** (§9.9) : `AlertBanner` (bandeau discret sous le `TopBar`, `null`
  si `warnings` vide = cas prod) + `AlertSheet` (détail, couleur selon
  `significance`, fenêtre `onset`→`expires`). Mock dev/e2e : `?alerts=1` injecte
  `src/mocks/fixtures/warnings.json` (comme `?onboarding=1`). Prod inchangée :
  endpoint `warning` jamais appelé.
- **Réglages** : bloc dépliable « À propos » dans `SettingsSheet` (Foreca,
  limites iOS).
- **Mock** : `weather-snapshot.json` régénéré (hourly −24 h → +36 h, 10 jours,
  sous-indices AQI). `rebaseSnapshot` recale aussi `daily[].date` (décalage en
  jours entiers) sinon les libellés « Aujourd'hui / Demain » sont faux.
- **Infra test** : `tests/setup.ts` ajoute un stub `matchMedia` + `cleanup()`
  RTL (auto-cleanup absent car `globals: false`).
- **Écart brief** : `motion` toujours pas installé — le `Sheet` anime en CSS,
  le graphe est statique. Rien ne le justifiait.
- **244 tests** unitaires + **27 e2e** (tap métrique → sheet + graphe + axe ;
  sous-indices AQI ; prévisions depuis le menu + axe ; `?alerts=1` bandeau +
  sheet + axe). Bundle **115,7 ko gzip**.

### Phase 5 — Lieux _(mergée, PR #16 + #17)_

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
