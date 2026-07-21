# Mi Roots — application du tiers-lieu Roots (PWA)

Application web du **Roots Café** (Cotonou) : réservation d'espaces et commande au bar, **sans compte** (identité minimale + code de confirmation type billet d'avion), bilingue FR/EN, pensée mobile-first pour des téléphones d'entrée de gamme.

> Ce dépôt contient le **code du site/app** (public, servi par GitHub Pages). La stratégie de marque, la bible et les documents sensibles **ne vivent pas ici** — voir « Sources de vérité » plus bas.

## Contenu

| Fichier / dossier | Rôle |
|---|---|
| `index.html` | Écran d'accueil `mi.roots.bj` — boucle vidéo (placeholder), réservation sans compte, FR/EN |
| `bar.html` | Écran « Encas & Rafraîchissements » — carte du bar, panier, paiement Kkiapay, sans compte |
| `roots-fonts.css` | Déclarations `@font-face` des polices auto-hébergées (Museo) — pointent vers `fonts/` |
| `roots-tokens.css` | Jetons de design (couleurs, typo, formes) — source unique pour tout nouvel écran |
| `fonts/` | Polices `.woff2` / `.woff` auto-hébergées (voir `fonts/README.md`) |
| `CREDITS.md` | Crédits des vecteurs (œuvre d'Ame Karaba, logotypes) |

## Ouvrir en local

Double-cliquer `index.html` (accueil) ou `bar.html` (bar) dans un navigateur. Aucune installation, aucun build. En ligne, les polices `MuseoModerno` et le repli `Roboto` se chargent via Google Fonts ; les icônes via Lucide (CDN).

## Polices

Les `.woff2` / `.woff` Museo se déposent dans `fonts/` (voir `fonts/README.md`). **Tant qu'elles sont absentes, l'app fonctionne quand même** : le repli **Roboto** (acté) prend le relais, `MuseoModerno` reste servie par Google Fonts. Rien ne casse.

## Règle d'or — aucun secret dans ce dépôt

Ce dépôt est **public**. On n'y met **jamais** de clé ni de secret : les clés **Supabase** et **Kkiapay** vivent côté serveur (Edge Functions / variables d'environnement), jamais dans le code du site. Voir `.gitignore`.

## Sources de vérité (hors dépôt public)

La **Bible de marque** (le pourquoi), le **Design System** (le quoi) et les documents stratégiques/financiers restent dans le projet Roots.bj (et/ou un dépôt **privé**). En cas de doute sur une décision de marque, la Bible fait foi.

## Versionnement

C'est Git qui porte l'historique : les suffixes de version dans les noms de fichiers (ex. `mi-roots-v5.html`) sont abandonnés au profit de `index.html` — l'historique des versions vit dans les commits.

## Licence

Voir `LICENSE.txt`. Code et identité **propriétaires, tous droits réservés**. L'œuvre iconographique est créditée à **Ame Karaba** (voir `CREDITS.md`) ; la police **Museo** relève de sa propre licence (acquisition en cours).
