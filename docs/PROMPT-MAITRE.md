# PROMPT MAÎTRE — CLAUDE CODE

## Projet « TERRA » — PWA météo iOS avec globe 3D interactif et bague temporelle

> **Mode d'emploi (pour moi, Audric)** : copier l'intégralité de ce fichier dans Claude Code au premier message, en y joignant le mockup `board-ui-ux.jpeg` et le brief `Brief_UI_UX_Meteo_Terre.pdf`. Puis répondre aux questions de la section 17.

---

## 0. COMMENT TU DOIS TRAVAILLER (méta-instructions — priorité absolue)

Tu es le lead developer de ce projet. Tu construis l'application **de bout en bout**, mais tu ne prends jamais de décision à ma place sur ce que je suis seul à pouvoir faire (comptes, clés, tests sur appareil physique, arbitrages produit).

**Règles de conduite non négociables :**

1. **Lis tout ce brief d'abord.** N'écris pas une ligne de code avant l'étape 3 ci-dessous.
2. **Pose-moi toutes les questions bloquantes en UNE SEULE fois** (voir section 17). Ne me pose pas 15 questions étalées sur 15 messages. Regroupe, numérote, propose une valeur par défaut recommandée pour chaque question afin que je puisse répondre « défaut pour tout sauf 3 et 7 ».
3. **Passe en mode plan** et présente-moi le plan d'implémentation phase par phase. Attends ma validation explicite avant d'exécuter.
4. **Crée un `CLAUDE.md`** à la racine du repo dès la Phase 0, contenant : commandes de build/test/lint, conventions de code, arborescence, décisions d'architecture, glossaire du domaine (terminateur, scrubbing, symbole Foreca…). Tiens-le à jour à chaque phase.
5. **Travaille par phases** (section 16). À la fin de chaque phase : `typecheck` + `lint` + `test` + `build` doivent être verts. Ensuite tu **t'arrêtes**, tu me fais un compte rendu court (ce qui est fait / ce qui reste / ce que je dois vérifier moi-même) et tu attends mon feu vert.
6. **Commits atomiques** au format Conventional Commits, en anglais, une branche par phase (`feat/phase-3-globe`). Jamais de commit de secrets, jamais de `.env` versionné.
7. **Quand une action ne peut être réalisée que par moi** (créer un compte, coller une clé dans Vercel, tester sur iPhone, installer sur l'écran d'accueil, valider un rendu visuel), tu **t'arrêtes** et tu me donnes un mode opératoire numéroté, en français, précis, avec les URL exactes et ce que je dois te renvoyer en retour.
8. **Zéro invention.** Si tu ne connais pas la forme exacte d'une réponse API, tu écris un script de sonde (`scripts/probe-foreca.mjs`) et tu me demandes de l'exécuter avec ma clé, puis tu écris les types à partir du résultat réel. Tu ne devines jamais un schéma de données.
9. **Zéro faux-semblant en production.** Pas de données mockées, pas de valeurs codées en dur, pas de `TODO` silencieux. Une donnée absente = un état vide explicite dans l'UI.
10. **Signale-moi les compromis.** Si une exigence du brief est techniquement impossible ou dégradée sur iOS/Safari (c'est le cas du retour haptique, voir §8.5), tu me le dis franchement au moment où tu la rencontres, avec les alternatives, plutôt que de livrer quelque chose qui ne marche pas.
11. **Économise mon quota API.** En développement et en test, tout passe par des fixtures MSW. Les appels réels sont limités à la validation manuelle. Le plan Foreca d'essai est plafonné à 2 000 requêtes/jour et tu peux le griller en une après-midi de hot reload.

---

## 1. LE PRODUIT

**Nom de code :** TERRA (nom commercial définitif à confirmer — question 1).

**Promesse utilisateur :** _« Tournez le temps, voyez votre monde changer. »_

Une application météo qui rompt avec la liste verticale classique. L'utilisateur ne lit pas la météo, il la **voit** : un globe terrestre 3D centré sur sa position, avec l'ombre jour/nuit calculée en temps réel, entouré d'une bague rotative qui permet de faire défiler les heures. Quand la bague tourne, le soleil se déplace sur la Terre, l'arrière-plan de l'app passe du jour à la nuit, et les métriques s'animent en douceur.

**Cible :** PWA installée sur iPhone (Safari iOS 17+), orientation portrait, usage principalement one-handed (le pouce doit atteindre la bague).

**Périmètre v1 :** météo grand public, une ville à la fois, jusqu'à 8 favoris, prévisions horaires + journalières, qualité de l'air, alertes officielles.

**Hors périmètre v1 :** carte radar plein écran, widget iOS natif, compte utilisateur, monétisation.

---

## 2. STACK IMPOSÉE

| Domaine         | Choix                                                           | Justification                                                 |
| --------------- | --------------------------------------------------------------- | ------------------------------------------------------------- |
| Build           | **Vite 6+**                                                     | vitesse, écosystème PWA mature                                |
| Framework       | **React 19 + TypeScript strict**                                | `strict: true`, `noUncheckedIndexedAccess: true`              |
| Styles          | **Tailwind CSS v4** (tokens via `@theme`)                       | design tokens centralisés ; fallback v3.4 si un plugin manque |
| 3D              | **three.js + @react-three/fiber + @react-three/drei**           | rendu WebGL déclaratif                                        |
| Calcul solaire  | **suncalc** (MIT, ~3 kB)                                        | position réelle du soleil, déclinaison saisonnière            |
| État client     | **zustand** (+ `persist`)                                       | favoris, unités, préférences                                  |
| État serveur    | **@tanstack/react-query v5**                                    | cache, revalidation, retry, offline                           |
| Validation      | **zod**                                                         | schémas des réponses Foreca, typage dérivé                    |
| Animation       | **motion** (ex framer-motion)                                   | springs, transitions de valeurs                               |
| Dates/TZ        | **luxon** ou **date-fns + @date-fns/tz**                        | fuseau IANA de la ville cible, jamais celui du device         |
| PWA             | **vite-plugin-pwa** (Workbox)                                   | manifest + service worker                                     |
| Backend         | **Vercel Functions** (runtime Node, région `cdg1`)              | proxy Foreca, la clé ne quitte jamais le serveur              |
| Tests           | **Vitest + Testing Library + Playwright + MSW + axe-core**      |                                                               |
| Qualité         | **ESLint 9 flat + Prettier + Husky + lint-staged + commitlint** |                                                               |
| Package manager | **pnpm**                                                        |                                                               |
| Runtime         | **Node 22 LTS**                                                 |                                                               |

**Interdits explicites :** pas de Next.js (Vite suffit et reste plus léger pour une PWA mono-écran), pas de CSS-in-JS runtime, pas de librairie de composants lourde (pas de MUI/Chakra), pas de `localStorage` pour les données volumineuses (utiliser IndexedDB via `idb-keyval`).

---

## 3. ARCHITECTURE DU REPO

```
terra/
├─ .devcontainer/devcontainer.json      # Codespaces : Node 22, pnpm, extensions
├─ .github/workflows/ci.yml             # typecheck, lint, test, build, lighthouse
├─ api/                                 # Vercel Functions (proxy Foreca)
│  ├─ _lib/
│  │  ├─ foreca.ts                      # client HTTP + auth + retry + backoff
│  │  ├─ cache.ts                       # TTL, headers CDN, cache mémoire
│  │  ├─ ratelimit.ts                   # limitation par IP
│  │  └─ schemas.ts                     # zod, partagé avec le front via /shared
│  ├─ weather.ts                        # GET /api/weather?lat&lon&lang&units
│  ├─ search.ts                         # GET /api/search?q&lang
│  └─ health.ts
├─ public/
│  ├─ textures/                         # earth-day, earth-night, earth-spec, clouds (.webp/.ktx2)
│  ├─ icons/                            # PWA icons + maskable
│  ├─ splash/                           # écrans de lancement iOS générés
│  └─ manifest.webmanifest
├─ scripts/
│  ├─ fetch-textures.mjs                # téléchargement + redimensionnement + conversion
│  ├─ generate-pwa-assets.mjs           # icônes + splash iOS
│  └─ probe-foreca.mjs                  # sonde API (à exécuter par Audric)
├─ src/
│  ├─ app/                              # bootstrap, providers, router
│  ├─ features/
│  │  ├─ globe/                         # Canvas R3F, shaders, matériaux, caméra
│  │  ├─ time-ring/                     # bague, gestes, snapping, a11y
│  │  ├─ weather/                       # hooks React Query, sélecteurs, interpolation
│  │  ├─ location/                      # géoloc, recherche, favoris
│  │  ├─ metrics/                       # grille du bas, bottom sheet détail
│  │  └─ alerts/                        # warnings Foreca
│  ├─ shared/
│  │  ├─ ui/                            # primitives (Sheet, Chip, Skeleton, Icon)
│  │  ├─ lib/                           # units, time, sun, symbols, interpolate
│  │  ├─ types/
│  │  └─ styles/theme.css               # tokens Tailwind @theme
│  ├─ pwa/                              # sw custom, update prompt, install prompt
│  └─ main.tsx
├─ tests/
│  ├─ unit/  ├─ e2e/  └─ fixtures/       # réponses Foreca réelles anonymisées
├─ .env.example
├─ vercel.json
└─ CLAUDE.md
```

---

## 4. INTÉGRATION FORECA (source de données unique)

### 4.1 Faits techniques vérifiés — respecte-les strictement

- **Base URL :** `https://weatherapi.foreca.net`
- **Authentification :** clé API en en-tête `Authorization: Bearer <clé>` (ou `?token=`). La clé est générée dans le portail **My API** de Foreca — il n'y a pas d'échange programmatique de credentials à implémenter. _Certaines documentations tierces plus anciennes décrivent un flux `POST /authorize/token` avec user/password sur `pfa.foreca.com` : ne l'implémente que si ma sonde confirme que mon compte fonctionne ainsi. Demande-moi de vérifier._
- **Ordre des coordonnées : `longitude,latitude`** — c'est l'inverse de l'habitude, c'est la source d'erreur n°1. Écris un helper typé `toForecaLocation(lat, lon)` et interdis la concaténation manuelle ailleurs dans le code.
- **Quotas :** essai gratuit et Freemium = **2 000 requêtes/jour**, plus une limite de requêtes/seconde selon le plan. Seules les requêtes réussies sont décomptées.
- **Valeurs nulles :** l'API renvoie `null` quand une donnée manque. Les schémas zod doivent l'accepter (`.nullable()`) et l'UI doit afficher un état « — » plutôt que `NaN` ou `0`.
- **Attribution obligatoire (contractuelle) :** le logo Foreca, ou à défaut le texte « Foreca », doit être visible dans l'application, en lien avec les données. Les attributions tierces éventuelles (radar, satellite, pollen) sont renvoyées par l'API et doivent être affichées.

### 4.2 Endpoints utilisés

| Usage                   | Endpoint                                            | Paramètres                                                           |
| ----------------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| Recherche de ville      | `GET /api/v1/location/search/{query}`               | `lang=fr`                                                            |
| Métadonnées ville       | `GET /api/v1/location/{lon,lat}`                    | `lang=fr` → récupère `timezone` (IANA), `name`, `country`            |
| Conditions actuelles    | `GET /api/v1/current/{lon,lat}`                     | `lang=fr&tempunit=C&windunit=KMH&rounding=0`                         |
| Prévisions horaires     | `GET /api/v1/forecast/hourly/{lon,lat}`             | `periods=72&dataset=full&history=1&tz=<IANA>&lang=fr&rounding=0`     |
| Prévisions journalières | `GET /api/v1/forecast/daily/{lon,lat}`              | `periods=10&dataset=full&lang=fr&rounding=0`                         |
| Nowcast pluie           | `GET /api/v1/forecast/minutely/{lon,lat}`           | `periods=60` — **seulement à la demande**, quand `precipProb > 30 %` |
| Qualité de l'air        | `GET /api/v1/air-quality/forecast/hourly/{lon,lat}` | `periods=24&tz=<IANA>&lang=fr`                                       |
| Alertes                 | `GET /api/v1/warning/{lon,lat}`                     | `dataset=full`                                                       |

**Notes :**

- `dataset=full` est **obligatoire** sur `daily` pour obtenir `sunrise`, `sunset`, `uvIndex`, `moonPhase`, `cloudiness`.
- `history=1` sur `hourly` renvoie les 24 h passées : indispensable si je choisis d'autoriser le scrub vers le passé (question 6).
- `rounding=0` (valeurs non arrondies) permet une interpolation propre ; l'arrondi se fait à l'affichage.
- `tz` = fuseau IANA **de la ville cible**, pas celui du téléphone.

### 4.3 Architecture de l'accès aux données

**La clé API ne doit jamais atteindre le navigateur.** Aucune variable `VITE_*` ne contient de secret. Ajoute un test CI qui échoue si `FORECA_API_KEY` apparaît dans le bundle client.

Le front n'appelle qu'une seule route d'agrégation :

```
GET /api/weather?lat=48.8566&lon=2.3522&lang=fr&tempunit=C&windunit=KMH
```

Côté serveur, cette route :

1. Valide les paramètres (zod, bornes lat/lon, liste blanche des langues/unités).
2. Applique la limitation de débit par IP.
3. Vérifie le cache (mémoire → KV si activé).
4. Appelle en parallèle `current`, `hourly`, `daily`, `air-quality`, `warning` (`Promise.allSettled` : une alerte en échec ne doit pas casser l'écran).
5. Normalise en un **modèle de domaine unique** (voir 4.5), indépendant de la forme Foreca.
6. Renvoie avec `Cache-Control: public, s-maxage=600, stale-while-revalidate=1800`.

**TTL par type de donnée :**

| Donnée            | TTL serveur | stale-while-revalidate |
| ----------------- | ----------- | ---------------------- |
| `current`         | 10 min      | 30 min                 |
| `hourly`          | 30 min      | 2 h                    |
| `daily`           | 3 h         | 6 h                    |
| `air-quality`     | 1 h         | 3 h                    |
| `warning`         | 10 min      | 30 min                 |
| `location/search` | 24 h        | 7 j                    |
| `location/{id}`   | 30 j        | 90 j                   |

**Budget d'appels :** l'ouverture d'un écran de ville doit coûter **au maximum 5 requêtes Foreca à froid, 0 à chaud**. Le scrub de la bague ne déclenche **jamais** de requête réseau : toutes les heures affichables sont déjà dans le payload.

**Résilience :** timeout 6 s, 2 retries avec backoff exponentiel + jitter sur 5xx/timeout uniquement (jamais sur 4xx). `401` → log serveur explicite « clé invalide/expirée » + réponse 503 générique côté client. `429` → respecter `Retry-After`, servir le cache périmé.

### 4.4 Symboles météo

Foreca renvoie des codes du type `d400` (jour) / `n400` (nuit) avec `symbolPhrase`. Les jeux d'icônes officiels Foreca (SVG/PNG) sont téléchargeables depuis My API **par les clients de l'API** — je devrai te les fournir (voir section 18).

En attendant, implémente un **mapping code → icône filaire maison** (stroke 1.5 px, conformément au brief), avec une table exhaustive dans `src/shared/lib/symbols.ts` et un test unitaire qui vérifie qu'aucun code de la documentation Foreca ne tombe dans le cas par défaut. L'icône doit être une variante jour/nuit selon le préfixe `d`/`n`.

### 4.5 Modèle de domaine (à figer avant tout code UI)

```ts
type Units = { temp: 'C' | 'F'; wind: 'KMH' | 'MS' | 'MPH' };

type Place = {
  id: string; // "lat,lon" normalisé à 4 décimales
  name: string;
  country: string;
  adminArea: string | null;
  lat: number;
  lon: number;
  timezone: string; // IANA
};

type TimeStep = {
  time: string; // ISO 8601 avec offset de la ville
  epoch: number;
  symbol: string; // code Foreca
  phrase: string | null;
  temp: number | null;
  feelsLike: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDir: number | null;
  windDirLabel: string | null;
  gust: number | null;
  precipProb: number | null;
  precipAccum: number | null;
  precipType: 'rain' | 'mixed' | 'snow' | null;
  cloudiness: number | null; // % → pilote la couche nuageuse du globe
  uvIndex: number | null;
  pressure: number | null;
  visibility: number | null;
};

type DayStep = {
  date: string;
  sunrise: string | null;
  sunset: string | null;
  sunriseEpoch: number | null;
  sunsetEpoch: number | null;
  minTemp: number | null;
  maxTemp: number | null;
  symbol: string;
  phrase: string | null;
  precipProb: number | null;
  precipAccum: number | null;
  uvIndex: number | null;
  moonPhase: number | null;
  confidence: 'g' | 'y' | 'o' | null;
};

type WeatherSnapshot = {
  place: Place;
  fetchedAt: number;
  current: TimeStep;
  hourly: TimeStep[]; // −24 h → +72 h
  daily: DayStep[];
  airQuality: { time: string; aqi: number | null; pollutant: string | null }[];
  warnings: Warning[];
  attribution: { provider: 'Foreca'; thirdParty: string[] };
};
```

---

## 5. DESIGN SYSTEM

Extrait du mockup et du brief. Centralise tout dans `src/shared/styles/theme.css` via `@theme`. **Aucune valeur hexadécimale en dur dans un composant.**

### 5.1 Couleurs

```
--color-primary       #1E3A8A   indigo profond (accents, actifs)
--color-primary-soft  #BFDBFE   bleu clair (états secondaires, halo)
--color-surface       #FFFFFF
--color-ink           #1F2937   texte encre (mode clair)
--color-accent        #FBBF24   ambre (soleil, UV, alertes modérées)

--bg-day              #F8F9FA   fond mode clair
--bg-night            #0B0F19   fond mode sombre
--bg-dawn             dégradé  #FBCFA0 → #6E63A8
--bg-dusk             dégradé  #F59E0B → #312E81
```

Couleurs sémantiques dérivées pour les alertes (jaune/orange/rouge/violet, alignées sur `significance` Foreca) et pour l'AQI (échelle EPA). **Toutes doivent passer 4.5:1** sur leur fond, y compris pendant les transitions de dégradé — écris un test qui échantillonne 20 points de chaque dégradé et vérifie le contraste avec la couleur de texte associée.

### 5.2 Mode clair/sombre

Le thème **suit l'heure locale de la ville affichée**, pas le réglage système. Bascule :

- Jour : de `sunrise + 45 min` à `sunset − 45 min` → fond clair.
- Nuit : de `sunset + 45 min` à `sunrise − 45 min` → fond sombre.
- Aube / crépuscule : dégradés, sur les 90 minutes autour de chaque transition, interpolés en continu selon l'heure sélectionnée sur la bague.

Prévoir un override manuel dans les réglages (Auto / Clair / Sombre). Le `theme-color` du manifest doit être mis à jour dynamiquement via `<meta name="theme-color">` pour que la barre d'état iOS suive.

### 5.3 Typographie

- **Inter Variable**, auto-hébergée via `@fontsource-variable/inter` (obligatoire pour le fonctionnement hors ligne ; pas de Google Fonts CDN).
- `font-variant-numeric: tabular-nums` sur **tous** les chiffres qui changent (température, heure, métriques) — sinon la valeur tremble pendant le scrub. C'est explicitement demandé dans le brief.
- Échelle : ville `1.5rem/700` · sous-titre `0.875rem/400` · température principale `clamp(4rem, 18vw, 5.5rem)/300` · métriques `0.875rem` label / `1rem/600` valeur.
- Tailles en `rem`, jamais en `px`, pour respecter le Dynamic Type iOS.

### 5.4 Divers

- Grille d'espacement 4 pt.
- Rayons : `1rem` pour les cartes, `999px` pour les chips.
- Iconographie : **stroke 1.5 px**, sans remplissage lourd (brief). Base `lucide-react` + icônes météo maison.
- Aucune boîte superflue, aucun fond texturé : les éléments flottent sur un fond uni, séparés par l'espace négatif (brief, « Less is more »).

---

## 6. LAYOUT

Proportions imposées par le brief, exprimées en fractions du viewport utile (hors safe areas) :

**TOP — 15 %**

- Bouton menu (gauche) et recherche (droite), 44×44 pt de zone tactile, discrets.
- Nom de ville, Inter Bold 1.5 rem, centré, `text-balance`, troncature élégante sur les noms longs.
- Sous-ligne : condition courte + heure locale (`Partiellement nuageux · 10:00`). Pastille « En direct » quand la bague est sur l'heure présente ; texte neutre « Prévision · jeudi 14:00 » sinon.

**CENTER — 60 %**

- Globe 3D centré, la ville cible face caméra.
- Bague temporelle concentrique, graduations horaires.
- Étiquette de l'heure sélectionnée sous la bague, et repère « MAINTENANT » au-dessus.

**BOTTOM — 25 %**

- Température en très grand à gauche, `Ressenti X°` en dessous.
- Grille de métriques à droite : Vent, Humidité, Indice UV (+ Qualité de l'air en 4ᵉ ligne si l'espace le permet). Chaque ligne = icône + label + valeur.
- Tap sur une métrique → bottom sheet de détail (graphe 24 h de cette métrique).
- Attribution Foreca en pied, discrète mais toujours visible.

**Contraintes iOS :**

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` — **sans** `user-scalable=no` (interdit pour l'accessibilité).
- Hauteur : `100dvh`, jamais `100vh`.
- Padding via `env(safe-area-inset-top/bottom/left/right)`.
- Vérifier le rendu sur : iPhone SE (petit), iPhone 15 (Dynamic Island), iPhone 15 Pro Max. La zone du bas ne doit jamais passer sous l'indicateur de home.
- `overscroll-behavior: none` sur le body, `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation` (sauf sur la bague, voir §8).

---

## 7. LE GLOBE 3D

### 7.1 Rendu

- Sphère `SphereGeometry(1, 96, 96)`, matériau custom `ShaderMaterial` (ou `MeshStandardMaterial` étendu via `onBeforeCompile`).
- **Textures** (dans `public/textures/`, format `.webp`, et `.ktx2`/Basis si tu peux automatiser la compression) :
  - `earth-day` (couleur, 4096×2048 desktop / 2048×1024 mobile)
  - `earth-night` (lumières des villes)
  - `earth-spec` (masque océans → spéculaire)
  - `earth-normal` ou bump (relief)
  - `clouds` (alpha)
- **Sources :** NASA Visible Earth / Blue Marble (domaine public). Écris `scripts/fetch-textures.mjs` qui télécharge, redimensionne et convertit, et documente précisément la provenance et la licence dans `public/textures/CREDITS.md`. Ne commite pas de textures dont tu n'as pas vérifié la licence — demande-moi confirmation avant de choisir la source.
- **Shader jour/nuit :** `mix(nightColor, dayColor, smoothstep(-0.10, 0.10, dot(normal, sunDir)))`. La largeur du terminateur (0,20 en produit scalaire ≈ 11° d'arc) donne le crépuscule doux attendu.
- **Atmosphère :** halo fresnel `pow(1.0 - dot(viewDir, normal), 3.0)` teinté `--color-primary-soft`, additif, très subtil.
- **Nuages :** sphère à rayon 1.005, opacité pilotée par `cloudiness` de l'heure sélectionnée, rotation lente indépendante. Si `cloudiness < 20 %`, opacité ~0.
- **Sélecteur de résolution :** charge les textures 2048 par défaut sur mobile, 4096 uniquement si `devicePixelRatio × screen.width > 1200` ET connexion non `save-data`.

### 7.2 Position du soleil (le point critique de crédibilité)

Utilise **suncalc** avec l'instant sélectionné sur la bague (converti en UTC) pour obtenir la position subsolaire, puis convertis en vecteur directionnel dans le repère du globe. La déclinaison saisonnière doit être réelle : c'est exactement ce que demande le brief (« en été, l'hémisphère nord reste éclairé plus tard »).

**Tests unitaires obligatoires — ce calcul doit être vérifiable, pas « à peu près bon » :**

- Équinoxe (20 mars, 12:00 UTC) : le terminateur passe par les deux pôles.
- Solstice d'été (21 juin) : le cercle arctique (66,5° N) est éclairé sur les 24 h ; l'Antarctique est dans l'ombre.
- Solstice d'hiver (21 décembre) : l'inverse.
- Paris, 21 juin, 22:00 locale : encore éclairé. Paris, 21 décembre, 17:30 locale : dans l'ombre.

### 7.3 Caméra

- Caméra orientée sur (lat, lon) de la ville : la ville est au centre de l'écran, légèrement au-dessus du centre géométrique du globe pour laisser respirer la zone du bas.
- Changement de ville → interpolation **quaternion slerp** le long du grand cercle, durée ~900 ms, easing `easeInOutCubic`. Pas de « saut » brutal.
- Pas de rotation libre à un doigt (elle entrerait en conflit avec la bague). Pincement pour zoomer légèrement (facteur 0,9 à 1,3) : optionnel, à valider.

### 7.4 Performance

- `frameloop="demand"` par défaut ; passe en `always` uniquement pendant un scrub actif ou une animation de caméra, puis reviens en `demand`.
- `dpr={[1, 2]}` (jamais 3, gain visuel nul, coût thermique réel sur iPhone).
- Pause complète du rendu sur `visibilitychange` (onglet caché / app en arrière-plan) et sur `prefers-reduced-motion`.
- `dispose()` explicite des textures et géométries au démontage.
- Le chunk `three` doit être en import dynamique, chargé après le premier rendu de l'interface : l'utilisateur voit la température et la ville **avant** que le globe n'apparaisse. Skeleton pendant le chargement.
- Budget : le globe ne doit pas dépasser **1,5 Mo** de textures au total après compression.

### 7.5 Fallback (obligatoire, pas optionnel)

Si WebGL est indisponible, si le contexte est perdu (`webglcontextlost`), ou si `prefers-reduced-motion: reduce` :
→ rendu de repli **2D** : projection orthographique de la Terre en SVG/canvas avec un masque d'ombre calculé par le même code solaire. Statique, sans animation, mais fonctionnellement complet. L'app doit rester entièrement utilisable.

---

## 8. LA BAGUE TEMPORELLE (composant le plus délicat — soigne-le)

### 8.1 Géométrie et données

- Anneau centré sur le globe, rayon = rayon apparent du globe + 24 px. Épaisseur de la zone tactile : **44 px minimum** (rayon intérieur 36 px sous l'anneau visible, extérieur +8 px).
- Graduations : trait fin toutes les heures, trait long + libellé toutes les 3 h.
- Plage temporelle par défaut : **−24 h → +72 h** (à confirmer, question 6). Repère visuel distinct pour « maintenant ».
- Sensibilité : **un tour complet = 12 heures**.

### 8.2 Gestes

- **Pointer Events uniquement** (`pointerdown/move/up/cancel`), jamais de code séparé touch/mouse.
- `touch-action: none` sur la zone de la bague (et uniquement là), `setPointerCapture` sur le pointeur actif.
- Angle = `Math.atan2(y - cy, x - cx)`. Accumule les deltas avec **gestion du passage ±π** : sinon un saut de 12 h se produit quand le doigt franchit le haut de la bague. C'est le bug classique de ce composant — écris un test unitaire dédié.
- **Inertie** : à la relâche, conserve la vitesse angulaire, applique une friction (~0.94/frame), arrête sous un seuil.
- **Snapping** : aimantation douce sur l'heure pleine à l'arrêt. Aimantation **renforcée** sur l'heure courante si la bague s'arrête à moins de 30 minutes de « maintenant » (demandé par le brief).
- Double-tap sur la bague, ou tap sur le repère « MAINTENANT » → retour animé à l'instant présent.

### 8.3 Interpolation des valeurs

Les données Foreca sont ponctuelles (pas horaires). Entre deux points :

- **Températures, humidité, vent, pression, UV** : interpolation linéaire (voire monotone cubique si tu veux du lissage), puis affichage via une animation _spring_ pour éviter les sauts de valeur (exigence explicite du brief).
- **Symbole, phrase, type de précipitation** : plus proche voisin, **jamais** d'interpolation.
- La position du soleil, elle, est calculée en continu — elle n'est pas interpolée depuis l'API.

### 8.4 Performance pendant le scrub

- Le globe se met à jour à 60 fps dans `useFrame` (lecture d'une ref, pas d'état React).
- Le texte du DOM (température, métriques) est rafraîchi à ~10 Hz maximum, via une ref + `requestAnimationFrame` throttlé, ou `useSyncExternalStore`. **Ne provoque pas un re-render React de tout l'écran à chaque pixel de déplacement du doigt.**
- Aucune requête réseau pendant le scrub.

### 8.5 Retour haptique — à lire attentivement

Le brief demande une vibration à chaque passage d'heure (Taptic Engine). **Sur iOS, Safari ne prend pas en charge l'API Vibration**, y compris en PWA installée. C'est une limitation de la plateforme, pas un problème d'implémentation.

Ce que tu dois faire :

1. Implémenter une abstraction `haptics.tick()` avec détection de capacité (`'vibrate' in navigator`). Sur Android/desktop compatible : vibration courte de 8–10 ms. Sur iOS : no-op silencieux, aucune erreur console.
2. Compenser sur iOS par un **feedback sensoriel de substitution** : micro-impulsion d'échelle (1 → 1.06 → 1) sur la graduation franchie + léger accent lumineux, sur ~120 ms. C'est ce qui donne l'impression de « cran ».
3. Optionnellement, un tick sonore très court (< 30 ms, volume bas), **désactivé par défaut**, activable dans les réglages.
4. Il existe des contournements non officiels (astuce du `<input type="checkbox" switch>` iOS). **Ne les implémente pas** sans me demander : c'est fragile et cassable à chaque mise à jour d'iOS. Signale-le-moi comme piste, rien de plus.

Documente cette limitation dans le `CLAUDE.md` et dans le README.

### 8.6 Accessibilité de la bague

- `role="slider"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` (epoch), `aria-valuetext` (« jeudi 14:00, 18 degrés, partiellement nuageux »), `aria-label`.
- Clavier : `←`/`→` = ±1 h, `⇧`+flèche = ±6 h, `Home` = maintenant, `PageUp/Down` = ±24 h.
- `aria-live="polite"` sur une région annonçant l'heure et la température après stabilisation (débounce 500 ms, pas à chaque cran).
- **Alternative non gestuelle obligatoire** : une rangée de chips horaires horizontalement scrollable, affichée quand `prefers-reduced-motion` est actif, quand VoiceOver est détecté, ou activable dans les réglages. Un utilisateur qui ne peut pas faire un geste circulaire précis doit pouvoir utiliser toute l'application.

---

## 9. FONCTIONNALITÉS

### v1 (obligatoire)

1. **Onboarding** — 2 écrans maximum, dont un écran de « pré-permission » qui explique pourquoi la localisation est demandée **avant** de déclencher la boîte de dialogue iOS (une fois refusée, elle ne se rouvre plus : ce pattern est indispensable).
2. **Localisation** — `navigator.geolocation` avec timeout et fallback propre vers la recherche manuelle. Gestion explicite des 3 états : accordée / refusée / indisponible.
3. **Recherche de ville** — champ avec debounce 300 ms, résultats via `/api/search`, historique des 5 dernières recherches, clavier iOS bien géré (le champ ne doit pas être masqué).
4. **Favoris** — jusqu'à 8 lieux, réordonnables, persistés (zustand + IndexedDB). Navigation entre favoris par swipe horizontal ou via le menu.
5. **Écran principal** — le layout §6 complet, fonctionnel.
6. **Bottom sheet de détail** — au tap sur une métrique : graphe 24 h, min/max, explication courte (ex. échelle UV).
7. **Prévisions journalières** — liste 7–10 jours accessible depuis le menu : icône, min/max, probabilité de pluie, indicateur de confiance Foreca (`g`/`y`/`o`).
8. **Qualité de l'air** — AQI avec code couleur EPA et polluant dominant.
9. **Alertes météo** — bandeau non intrusif quand une alerte existe ; détail au tap ; couleur selon `significance`.
10. **Réglages** — unités (°C/°F, km/h / m/s / mph), thème, langue (FR/EN), tick sonore, alternative non gestuelle, effacement des données.
11. **Hors ligne** — dernier `WeatherSnapshot` par lieu conservé en IndexedDB, affiché avec un bandeau « Données du 8 sept. à 14:32 ». L'app ne doit jamais afficher un écran blanc sans réseau.
12. **Mise à jour de l'app** — détection d'un nouveau service worker → toast « Nouvelle version disponible · Recharger ».

### v2 (à ne pas commencer sans mon accord)

Notifications push d'alertes (contraintes iOS ci-dessous), nowcast pluie minute par minute, carte radar, widgets.

---

## 10. PWA & SPÉCIFICITÉS iOS

### 10.1 Manifest

Complet : `id`, `name`, `short_name` (≤ 12 caractères), `description`, `start_url: "/?source=pwa"`, `scope`, `display: "standalone"`, `orientation: "portrait"`, `background_color`, `theme_color`, `lang: "fr"`, `dir: "ltr"`, `categories: ["weather"]`, icônes 192/512 + **maskable** 512, `screenshots` (form_factor narrow), `shortcuts` (« Ma position », « Favoris »).

### 10.2 Balises iOS

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<meta
  name="apple-mobile-web-app-status-bar-style"
  content="black-translucent"
/>
<meta name="apple-mobile-web-app-title" content="Terra" />
<link
  rel="apple-touch-icon"
  sizes="180x180"
  href="/icons/apple-touch-icon.png"
/>
<!-- + tous les apple-touch-startup-image générés -->
```

Génère les écrans de lancement pour **toutes** les tailles d'iPhone actuelles avec `pwa-asset-generator` (script `scripts/generate-pwa-assets.mjs`). Un splash manquant = un écran blanc au lancement, c'est immédiatement perceptible.

### 10.3 Service worker (vite-plugin-pwa / Workbox)

- Precache : app shell, polices, icônes.
- `CacheFirst` : textures du globe, polices (expiration 30 j).
- `NetworkFirst` (timeout 3 s) : `/api/weather`, `/api/search`.
- `cleanupOutdatedCaches: true`, `skipWaiting: false` (mise à jour contrôlée par l'utilisateur via le toast).
- Ne jamais mettre en cache une réponse d'erreur.

### 10.4 Limites iOS à connaître et à documenter honnêtement

- **Vibration : non supportée** (§8.5).
- **Notifications push** : possibles uniquement si l'app est **installée sur l'écran d'accueil** (iOS 16.4+), avec demande de permission déclenchée par un geste utilisateur explicite. Impossible depuis Safari onglet.
- **Background sync / periodic sync** : non disponibles. Il n'y a pas de moyen fiable de rafraîchir les données quand l'app est fermée. Les alertes en v2 devront donc passer par un **cron Vercel côté serveur** qui pousse via Web Push, pas par un mécanisme client.
- **Stockage** : quota limité, et les données peuvent être purgées après ~7 jours sans usage. Ne jamais considérer IndexedDB comme un stockage durable : c'est un cache.
- **Géolocalisation en arrière-plan** : impossible.

Écris cette liste dans le README, section « Limites connues sur iOS ». Je dois pouvoir l'expliquer sans surprise.

---

## 11. ACCESSIBILITÉ (WCAG 2.2 niveau AA — non négociable)

- Contraste ≥ 4.5:1 pour le texte, ≥ 3:1 pour les éléments d'interface, **y compris pendant les transitions de dégradé aube/crépuscule** (exigence du brief, testée automatiquement).
- Cibles tactiles ≥ 44×44 pt.
- Focus visible sur tous les éléments interactifs (`:focus-visible`, anneau 2 px contrasté).
- Libellés VoiceOver en français, complets, sur chaque contrôle. Aucun bouton sans nom accessible.
- `prefers-reduced-motion` : désactive l'inertie, les transitions de caméra, la rotation des nuages ; bascule sur le fallback statique.
- `prefers-contrast: more` : renforce les bordures et le contraste des dégradés.
- Aucune information transmise **uniquement** par la couleur (les alertes ont un texte et une icône, pas seulement une teinte).
- Support du Dynamic Type : tout en `rem`, mise en page qui tient à 200 % de zoom texte sans perte de fonctionnalité.
- Tests `axe-core` automatisés sur chaque écran, en CI, sans violation critique ou sérieuse.

---

## 12. PERFORMANCE (budgets à respecter, mesurés en CI)

| Métrique                               | Cible    |
| -------------------------------------- | -------- |
| LCP (iPhone 12, 4G simulée)            | < 2,0 s  |
| INP                                    | < 200 ms |
| CLS                                    | < 0,05   |
| TBT                                    | < 150 ms |
| JS initial (gzip, hors chunk three)    | < 180 kB |
| Textures totales                       | < 1,5 Mo |
| FPS pendant le scrub                   | ≥ 55     |
| Lighthouse PWA / A11y / Best Practices | ≥ 95     |

Moyens : code splitting par route et par feature, `three` en chunk séparé chargé après le premier paint, images en `.webp`, polices en `woff2` avec `font-display: swap` et préchargement de la variable, `rel=preconnect` inutile (tout est same-origin), analyse du bundle (`rollup-plugin-visualizer`) commitée en artefact CI.

---

## 13. QUALITÉ, TESTS, CI

**Unitaires (Vitest)** — obligatoires sur :

- Calcul de la position solaire (les 4 cas de §7.2).
- Accumulation angulaire de la bague, notamment le franchissement ±π.
- Snapping et inertie.
- Interpolation des valeurs (linéaire vs plus proche voisin).
- Conversions d'unités (aller-retour, arrondis).
- Parsers zod contre des fixtures réelles, y compris avec des champs `null`.
- Mapping exhaustif des symboles Foreca.
- Sélection du thème selon l'heure et le lever/coucher du soleil.

**Composants (Testing Library)** — bague pilotée par `pointerdown/move/up` simulés, navigation clavier, annonces `aria-live`, bottom sheet.

**E2E (Playwright, émulation iPhone 15)** — premier lancement + permission refusée → recherche manuelle ; recherche → ajout aux favoris → affichage ; scrub de la bague → cohérence de la valeur affichée ; mode hors ligne → bandeau + données en cache ; captures visuelles de non-régression sur les 3 thèmes (jour, nuit, crépuscule).

**MSW** — mocke Foreca en dev et en test à partir de fixtures réelles anonymisées. Un flag `.env` permet de basculer sur l'API réelle pour la validation manuelle.

**CI GitHub Actions** — `typecheck` → `lint` → `test` → `build` → `lighthouse-ci` → vérification « aucun secret dans le bundle ». Bloquante sur la branche principale.

---

## 14. SÉCURITÉ & CONFORMITÉ

- `FORECA_API_KEY` en variable d'environnement serveur uniquement. `.env` dans `.gitignore`, `.env.example` versionné avec des valeurs factices.
- Test CI qui `grep` le bundle client à la recherche de la clé et de tout motif `VITE_.*KEY|SECRET|TOKEN`.
- Rate limiting sur `/api/*` : 60 req/min/IP (Upstash Redis si activé, sinon compteur en mémoire par instance + protection Vercel).
- En-têtes de sécurité dans `vercel.json` : `Content-Security-Policy` stricte (pas de `unsafe-eval` ; attention aux shaders — ils ne nécessitent pas d'assouplissement), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(self), camera=(), microphone=()`.
- **RGPD** : les coordonnées GPS transitent par le serveur mais ne sont **jamais journalisées ni stockées** (tronque à 2 décimales dans les logs, ou ne logue pas du tout). Pas de cookie de suivi. Page « Confidentialité » expliquant : ce qui est collecté, la finalité, la durée de conservation, le fait que Foreca est destinataire des coordonnées.
- Attribution Foreca visible (obligation contractuelle, §4.1).
- Dépendances : `pnpm audit` en CI, Dependabot activé.

---

## 15. ENVIRONNEMENT & DÉPLOIEMENT

**Codespaces** — `.devcontainer/devcontainer.json` : image Node 22, `pnpm` préinstallé, extensions VS Code (ESLint, Prettier, Tailwind IntelliSense, Playwright), `postCreateCommand: pnpm install`, ports 5173 et 3000 forwardés.

**Vercel** —

- Framework preset : Vite. Build : `pnpm build`. Output : `dist`.
- Fonctions en région **`cdg1`** (Paris) pour la latence depuis la France.
- Variables d'environnement séparées Production / Preview / Development.
- Déploiements preview sur chaque PR, avec protection par mot de passe activée.
- `vercel.json` : en-têtes de sécurité, `Cache-Control` sur `/textures/*` (`immutable, max-age=31536000`), rewrite SPA.

**Environnements** — `development` (MSW), `preview` (API réelle, quota surveillé), `production`.

---

## 16. PHASES DE LIVRAISON

Chaque phase se termine par : tests verts, build OK, compte rendu, **arrêt et attente de ma validation**.

| #   | Phase                | Livrable                                                                                             | Point de contrôle pour moi                                   |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 0   | **Fondations**       | Repo, devcontainer, Vite+TS+Tailwind, tokens, ESLint/Prettier/Husky, CI, `CLAUDE.md`, `.env.example` | Le repo démarre dans Codespaces, `pnpm dev` fonctionne       |
| 1   | **Proxy Foreca**     | Routes `/api/*`, client, zod, cache, rate limit, script de sonde, fixtures                           | J'exécute la sonde avec ma clé, je te renvoie le résultat    |
| 2   | **Squelette UI**     | Layout 15/60/25, design system, thèmes jour/nuit/aube, données réelles affichées **sans globe**      | Je valide la typo, les couleurs, l'espacement sur mon iPhone |
| 3   | **Globe 3D**         | Canvas R3F, textures, shader terminateur, atmosphère, caméra, fallback 2D                            | Je valide le rendu et la crédibilité de l'ombre              |
| 4   | **Bague temporelle** | Gestes, inertie, snapping, interpolation, liaison globe ↔ données ↔ thème                            | Je teste le geste au pouce sur iPhone — c'est LE test        |
| 5   | **Lieux**            | Géoloc, pré-permission, recherche, favoris, persistance                                              | Je teste le refus de permission                              |
| 6   | **Enrichissement**   | Bottom sheets, prévisions 10 j, qualité de l'air, alertes, réglages                                  |                                                              |
| 7   | **PWA & offline**    | Manifest, SW, splash iOS, mode hors ligne, toast de mise à jour                                      | J'installe sur l'écran d'accueil et je coupe le réseau       |
| 8   | **A11y & perf**      | Audit axe, VoiceOver, Lighthouse CI, budgets tenus, alternative non gestuelle                        | Je teste avec VoiceOver activé                               |
| 9   | **Production**       | Domaine, en-têtes, monitoring, README + doc de déploiement en français                               | Mise en ligne                                                |
| —   | _v2 optionnelle_     | Push d'alertes (VAPID + cron Vercel), nowcast, radar                                                 | Sur accord explicite                                         |

---

## 17. QUESTIONS À ME POSER AVANT DE COMMENCER

Regroupe-les dans ton premier message, numérotées, avec ta recommandation. Ajoutes-en si j'ai oublié quelque chose.

**Produit**

1. Nom définitif de l'app + `short_name` (≤ 12 car.) ? _(le mockup dit « Aether », le brief « Terra Meteo »/« TerraWeather » — il faut trancher)_
2. Langues : FR seul, ou FR + EN dès la v1 ?
3. Unités par défaut : °C / km/h ?
4. Nombre maximum de favoris (défaut : 8) ?
5. Prévisions journalières : 7 ou 10 jours ?
6. La bague permet-elle de remonter dans le passé (−24 h) ou uniquement d'avancer ? Amplitude vers l'avant : +48 h ou +72 h ?
7. Un tour de bague = 12 h : d'accord, ou tu préfères 6 h (plus précis) ou 24 h (plus rapide) ?
8. Le pincement pour zoomer sur le globe : on l'inclut ou on garde l'interaction minimale ?

**Compte & API Foreca** 9. As-tu déjà un compte Foreca et une clé ? Sur quel plan (essai 30 j, Freemium, payant) — pour dimensionner le cache ? 10. Ton compte utilise-t-il la clé Bearer statique du portail My API, ou l'ancien flux user/password → token ? _(exécute la sonde que je te fournirai en Phase 1 et renvoie-moi la sortie)_ 11. Les endpoints Qualité de l'air et Alertes sont-ils inclus dans ton plan ? 12. As-tu accès aux jeux d'icônes météo officiels Foreca via My API ? Si oui, peux-tu me les fournir ? Sinon je crée un set filaire maison.

**Infrastructure** 13. Nom du repo GitHub, public ou privé ? Le crées-tu, ou je te donne les commandes ? 14. Compte Vercel : équipe ou perso ? Nom du projet ? 15. Domaine personnalisé prévu (ex. `terra.tondomaine.fr`) ou `*.vercel.app` suffit pour la v1 ? 16. Active-t-on Vercel KV / Upstash Redis pour le cache et le rate limiting (recommandé, coût faible), ou on reste sur le cache CDN seul ? 17. Sentry pour le monitoring d'erreurs : oui/non ? 18. Vercel Analytics + Speed Insights : oui/non ?

**Design & assets** 19. Valides-tu la palette du mockup telle quelle, ou dois-je l'ajuster pour garantir le contraste AA ? 20. As-tu un logo / une icône d'app, ou dois-je générer un placeholder à partir du « A » du mockup ? 21. Textures du globe : je pars sur NASA Blue Marble (domaine public) — tu valides, ou tu as une autre source ? 22. Le fond de l'app suit l'heure de la **ville affichée** (brief) — confirmé ? Même quand elle est à l'opposé de ton fuseau ?

**Divers** 23. Sur quel iPhone testeras-tu (modèle + version iOS) ? 24. Y a-t-il une échéance ? 25. Ce projet sera-t-il partagé avec des proches (comme tes autres projets) ? Si oui je prévois une page d'aide en français et un guide d'installation sur l'écran d'accueil.

---

## 18. CE QUE JE DEVRAI FAIRE MOI-MÊME (prépare-moi la checklist)

Rappelle-moi ces points au moment opportun, jamais tous d'un coup :

- [ ] Créer le compte Foreca et générer la clé API dans **My API** (`developer.foreca.com/my-api`).
- [ ] Exécuter `node scripts/probe-foreca.mjs` avec ma clé et te renvoyer la sortie (schémas réels).
- [ ] Télécharger les icônes météo officielles Foreca depuis My API, si mon plan y donne droit.
- [ ] Créer le repo GitHub et l'ouvrir dans Codespaces.
- [ ] Créer le projet Vercel, le lier au repo, choisir la région `cdg1`.
- [ ] Ajouter `FORECA_API_KEY` (et le cas échéant les identifiants Upstash / le DSN Sentry) dans les variables d'environnement Vercel, pour les 3 environnements.
- [ ] Configurer le domaine personnalisé et le DNS, le cas échéant.
- [ ] Valider visuellement chaque phase sur mon iPhone réel (le simulateur ne reproduit ni le rendu WebGL exact, ni les safe areas, ni le comportement du clavier).
- [ ] Installer la PWA sur l'écran d'accueil et tester le lancement, le splash, le mode hors ligne.
- [ ] Tester avec VoiceOver activé (Réglages → Accessibilité → VoiceOver).
- [ ] Surveiller la consommation de quota dans le portail Foreca après la mise en production.
- [ ] Générer les clés VAPID si on fait la v2 push.

---

## 19. DEFINITION OF DONE

L'application est terminée quand **tous** ces points sont vrais :

1. Installée sur l'écran d'accueil d'un iPhone, elle se lance avec son splash, sans barre Safari, en portrait, sans écran blanc.
2. La géolocalisation fonctionne, et son refus mène proprement à la recherche manuelle.
3. Le globe affiche la Terre centrée sur la ville, avec un terminateur physiquement correct (les 4 tests de §7.2 passent).
4. Faire tourner la bague au pouce déplace le soleil, change le fond de l'app, et met à jour la température et les métriques **en continu, sans à-coup, sans requête réseau, à 55 fps minimum**.
5. Les chiffres ne tremblent pas pendant le défilement (tabular-nums vérifié à l'œil).
6. Sans réseau, l'app affiche les dernières données connues avec leur horodatage.
7. VoiceOver permet d'utiliser l'intégralité des fonctions, y compris de changer d'heure sans geste circulaire.
8. Lighthouse ≥ 95 en PWA, Accessibilité et Bonnes pratiques ; les budgets de §12 sont tenus.
9. Aucun secret n'est présent dans le bundle client (test CI vert).
10. L'attribution Foreca est visible.
11. La CI est verte sur la branche principale, la couverture des modules de `shared/lib` est ≥ 85 %.
12. Le README et le `CLAUDE.md` sont à jour, en français, et incluent la section « Limites connues sur iOS ».

---

## 20. ANTI-PATTERNS INTERDITS

- ❌ Clé API dans le bundle client, ou appel direct du navigateur vers `weatherapi.foreca.net`.
- ❌ `lat,lon` au lieu de `lon,lat` dans les URL Foreca.
- ❌ Utiliser le fuseau du téléphone au lieu de celui de la ville affichée.
- ❌ Requête réseau déclenchée par le mouvement de la bague.
- ❌ Re-render React de tout l'écran à chaque frame de scrub.
- ❌ `100vh` sur iOS.
- ❌ `user-scalable=no` ou `maximum-scale=1`.
- ❌ Textures 4096 chargées systématiquement sur mobile.
- ❌ Interpoler un symbole météo ou une phrase descriptive.
- ❌ Ignorer les `null` de l'API et afficher `NaN`, `0` ou `undefined`.
- ❌ Composant sans nom accessible, ou information portée uniquement par la couleur.
- ❌ Cacher l'absence de vibration sur iOS derrière un contournement fragile sans m'en parler.
- ❌ Livrer une phase avec des tests rouges ou des `TODO` non signalés.
- ❌ `git push --force` sur la branche principale.

---

## 21. TON PREMIER MESSAGE

Réponds-moi avec, dans cet ordre :

1. **Ta compréhension du projet en 5 lignes** — pour que je vérifie qu'on parle de la même chose.
2. **Les 2 ou 3 risques techniques majeurs** que tu identifies, et comment tu comptes les traiter.
3. **La liste numérotée des questions** de la section 17, avec ta recommandation par défaut pour chacune.
4. **Le plan de la Phase 0**, détaillé.

Puis **attends ma réponse**. Ne commence pas à coder.
