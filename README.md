# Mi Roots — application du tiers-lieu Roots (PWA)

Application web du **Roots** (Cotonou) : réservation d'espaces et commande sur
place, **sans compte** — identité minimale et code de confirmation. Bilingue
français / anglais, conçue pour le mobile d'abord.

Ouverture : tous les jours, 7 h – 19 h.

## Contenu

| Fichier / dossier | Rôle |
|---|---|
| `index.html` | Accueil `mi.roots.bj` — réservation d'espace et commande, en une feuille à deux onglets |
| `carte.html` | La carte — articles, panier, prise de commande |
| `retrouver.html` | Retrouver une réservation avec son code |
| `confidentialite.html` | Politique de confidentialité, bilingue |
| `roots.css` | **Source unique du style.** Jetons de marque, dialecte public, dialecte de console, chrome partagé |
| `roots.js` | **Source unique du chrome** — planche d'icônes, champ téléphone, navigation, menu, toast |
| `roots-db.js` | Passerelle unique vers la base : lectures, écritures, traduction des messages d'erreur |
| `roots-fonts.css` | Déclarations `@font-face` des polices auto-hébergées |
| `fonts/` | Polices `.woff2` auto-hébergées |
| `vendor/` | Champ téléphone international, embarqué |
| `CREDITS.md` | Crédits de l'iconographie et des logotypes |

## Aucune dépendance externe

Le site ne charge **rien** depuis un tiers : polices auto-hébergées, icônes en
SVG intégré, champ téléphone embarqué. La seule adresse externe appelée à
l'exécution est celle de la base de données.

## Ouvrir en local

**Ne pas double-cliquer sur `index.html`.** Ouvert directement depuis le disque,
le navigateur refuse d'importer certains modules et plusieurs comportements
paraissent défaillants alors qu'ils ne le sont pas — la mise en forme du numéro
de téléphone, notamment.

Servir le dossier, puis ouvrir `http://localhost:8000` :

```
python -m http.server
```

Aucune installation, aucune étape de construction.

## Vérifier avant de publier

Les outils de mesure et de relecture ne vivent pas dans ce dépôt : ils portent
par nécessité les motifs qu'ils recherchent. Ils s'exécutent depuis le dossier
qui les héberge, en recevant ce dépôt en argument.

Chacun dispose d'un mode qui pose des défauts volontaires et vérifie qu'ils sont
détectés : un contrôle tout vert qui n'a jamais rougi est une hypothèse, pas une
preuve.

## Versionnement

L'historique vit dans les commits. Les noms de fichiers ne portent pas de
suffixe de version.

## Licence

Voir `LICENSE.txt` — code et identité propriétaires, tous droits réservés.
L'iconographie est créditée dans `CREDITS.md`.
