# Déploiement — Terra

Cible : **Vercel** (compte personnel), domaine `terra-weather.vercel.app`,
fonctions serveur en région **`cdg1`** (Paris).

Le front est une SPA Vite ; les routes `/api/*` sont des **Vercel Functions**
(le proxy Foreca — la clé ne touche jamais le navigateur, brief §4.3 / §14).

---

## 1. Projet Vercel

1. **New Project** → importer le dépôt `OddReak/Sortez-couvert`.
2. Framework : **Vite** (auto-détecté). Build : `pnpm build`. Output : `dist`.
   Ces valeurs sont aussi dans `vercel.json` — ne rien changer.
3. **Settings → Functions → Region** : `Paris, France (cdg1)` (déjà forcé par
   `vercel.json`, vérifier).
4. **Settings → Domains** : ajouter `terra-weather.vercel.app`.
5. **Settings → Deployment Protection** : activer la **protection par mot de
   passe sur les déploiements Preview** (brief §15) — la production reste
   publique.
6. **Analytics** et **Speed Insights** : déjà activés (onglets dédiés du
   dashboard). Le code (`<Analytics/>`, `<SpeedInsights/>`) n'est actif qu'en
   build de production.

## 2. Base Upstash Redis (cache + rate-limit partagés)

Sans Redis, chaque instance serverless a son propre cache mémoire : ça
fonctionne mais c'est dégradé (moins de cache, rate-limit par instance). **En
production, Redis est nécessaire.**

1. Sur [upstash.com](https://upstash.com) → **Create Database**, type _Redis_,
   région **UE** (proche de `cdg1`).
2. Onglet _REST API_ → copier `UPSTASH_REDIS_REST_URL` et
   `UPSTASH_REDIS_REST_TOKEN`.

> Alternative : l'intégration Vercel « Upstash » crée la base et injecte les
> variables automatiquement (Marketplace → Upstash → Add Integration).

## 3. Variables d'environnement

À renseigner dans **Settings → Environment Variables**, pour les **trois
cibles** (Production / Preview / Development) :

| Variable                   | Valeur                            | Notes                                 |
| -------------------------- | --------------------------------- | ------------------------------------- |
| `FORECA_API_KEY`           | la clé du portail _My API_ Foreca | **secret**, jamais de préfixe `VITE_` |
| `FORECA_BASE_URL`          | `https://weatherapi.foreca.net`   |                                       |
| `UPSTASH_REDIS_REST_URL`   | depuis Upstash                    |                                       |
| `UPSTASH_REDIS_REST_TOKEN` | depuis Upstash                    | **secret**                            |

Optionnel : `FORECA_AUTH_MODE=bearer` (valeur par défaut si absent — confirmée
par la sonde en Phase 1).

**Ne jamais** ajouter de variable `VITE_*` contenant un secret : elle finirait
dans le bundle client. Un job CI (`grep` sur `dist/`) le vérifie à chaque push.

## 4. Premier déploiement

Un `git push` sur `main` (ou le bouton _Deploy_) suffit. Vérifier ensuite :

### Checklist post-déploiement

- [ ] `https://terra-weather.vercel.app/api/health` → `200`, JSON avec
      `"region": "cdg1"`, `"redis": true`.
- [ ] L'app se charge, la météo s'affiche (autoriser la géoloc ou chercher une
      ville).
- [ ] **Console du navigateur : aucune erreur CSP** (les scripts Analytics /
      Speed Insights sont servis en même origine `/_vercel/*`). Si une violation
      apparaît, ajouter `https://va.vercel-scripts.com` à `script-src` dans
      `vercel.json`.
- [ ] DevTools → _Application_ : le service worker `terra` est _activated_ ; le
      manifeste est valide ; l'icône et le splash sont là.
- [ ] Couper le réseau (DevTools → _Network_ → _Offline_) + recharger : l'app
      s'ouvre, bandeau « Données du … ».
- [ ] Installer sur un **iPhone réel** (Partager → Ajouter à l'écran d'accueil) :
      écran de lancement correct, test hors ligne, test **VoiceOver**.
- [ ] `/aide` et `/confidentialite` répondent (rewrite SPA).

## 5. Exploitation

- **Quota Foreca** : 2 000 requêtes/jour. À froid, `/api/weather` fait 5 appels
  Foreca ; à chaud (cache), 0. Surveiller la consommation dans le portail
  Foreca. Si le quota est dépassé, le proxy renvoie un `503` générique (aucune
  fuite de la clé ou de l'URL Foreca).
- **Clé Foreca invalide / expirée** : `503` générique côté client + un
  `console.error('[foreca] clé invalide…')` dans les logs Vercel.
- **RGPD** : les coordonnées GPS transitent par le proxy et Foreca mais ne sont
  **ni journalisées ni stockées** (les logs ne contiennent que des classes
  d'erreur). L'adresse IP sert uniquement de clé de rate-limit dans Redis (TTL
  < 1 min). Page publique : `/confidentialite`.

## 6. Rollback

Vercel → onglet **Deployments** → ouvrir un déploiement antérieur sain →
**Promote to Production**. Instantané, aucun rebuild.

## 7. CI (rappel)

`main` et chaque PR passent : `typecheck` · `lint` · `format` · tests unitaires ·
build · **budget JS < 180 ko** · e2e (Playwright) · **Lighthouse ≥ 0.95**
(perf / a11y / best-practices) · « aucun secret dans le bundle » · `pnpm audit`.
Le déploiement Vercel est indépendant de ces jobs (Vercel rebuild de son côté).
