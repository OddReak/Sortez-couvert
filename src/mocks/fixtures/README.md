# Fixtures Foreca (MSW)

Réponses **dérivées de la sonde réelle** (`scripts/probe-foreca.mjs`, exécutée
le 2026-09-08 sur Paris). Valeurs authentiques ; les tableaux sont tronqués /
légèrement étendus pour garder le dépôt léger.

Utilisées par `src/mocks/handlers.ts` pour mocker Foreca en dev et en test
(brief §13). Aucune donnée personnelle : météo publique d'une ville.

L'endpoint `warning` renvoie 403 sur le plan Foreca d'Audric — voir
`warning-403.json`. Les alertes sont donc un état vide dans l'app.
