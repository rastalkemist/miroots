# CLAUDE.md — dépôt `miroots`

> **Ce dépôt est public.** Tout ce qui y entre est lisible par n'importe qui, définitivement.
> Ce qui n'est pas destiné à être public ne vit pas ici. **En cas de doute : ne pas commiter, demander.**

---

## 1. Le projet

Application web du **Roots**, un lieu à Cotonou (Bénin) : réservation d'espaces de travail et de logements, commande sur place. Sans compte — identité minimale et code de confirmation. Bilingue français / anglais, conçue pour le mobile d'abord.

Ouverture au public : tous les jours, 7 h – 19 h.

## 2. Nature du site

Site **statique** — HTML, CSS, JavaScript — servi tel quel, sans étape de construction ni dépendance à installer. Un dépôt par sous-domaine.

## 3. Deux dialectes d'interface

Une seule famille visuelle — même palette, mêmes polices, même sémantique de statut — mais deux grammaires de forme, et **un seul dialecte par écran**.

**Dialecte A « rond / ambiant »**, sur les écrans destinés au public. Pilules `999px`, cartes `26px`, module `17px`, champ `13px`, surfaces lumineuses, animations douces — coupées sous `prefers-reduced-motion`. Les prix ne sont jamais en rouge : encre neutre.

**Dialecte B « tuiles / opérationnel »**, sur les écrans de gestion. Tuiles carrées jointives à fort contraste : rayon `4px`, gouttière `4px`, pas de grille `96px`, aplats saturés, grande icône plus libellé de un à trois mots, liseré d'état `3px`. **Aucun flou, aucune ombre, aucun dégradé, aucune animation** — le retour d'interaction est un changement d'état franc.

Le dialecte B est une grammaire d'opération, pas une interface appauvrie : une tuile peut ouvrir un tableau dense. C'est l'entrée qui est grosse, pas le contenu qui est pauvre.

**La règle du cartouche gouverne le logo, les dialectes gouvernent les composants.** Les écrans de gestion gardent donc le cartouche **rond**. Corollaire : jamais de cartouche carré dans une interface.

## 4. Contraintes d'exécution

**Mobile d'abord**, sur des appareils d'entrée de gamme.

Sur la connectivité : la couverture réseau est bonne et ce n'est pas une contrainte structurante. Le dogme « hors-ligne d'abord » ne s'applique pas. Survivent, chacun pour son motif propre :

- **identifiants générés côté client et clé d'idempotence** sur toute écriture — correction générale contre les doubles soumissions, indépendante du réseau ;
- **cache applicatif** (manifest et service worker) — pour la vitesse et l'installabilité ;
- **file d'attente locale** sur les seuls gestes critiques — rare, mais grave s'il échoue au mauvais moment.

## 5. Accessibilité — non négociable, partout

Cibles tactiles **≥ 44 px**, contrastes **AA**, `prefers-reduced-motion` respecté, `aria-live` sur les changements d'état, focus clavier visible.

La sémantique de statut par la couleur — jaune : attente · terracotta : préparation · vert : confirmé ou prêt · rouge : annulé ou urgence · vert forêt : terminé — est **toujours doublée d'une icône ou d'une position**, jamais portée par la couleur seule.

**Accessibilité ≠ littératie.** L'accessibilité s'applique à tous les écrans. Les aménagements de lecture, eux, sont un **mode assisté** neutre, attaché à un **poste**, activable par la personne qui l'occupe — jamais un attribut stocké sur quelqu'un, jamais une caractéristique attribuée aux visiteurs du site.

## 6. Marque et jetons

`roots-tokens.css` est la **source unique** des variables. Aucun écran ne redéfinit une valeur en dur.

**Palette de marque, cinq couleurs** : vert `#006838`, jaune `#FFC840`, terracotta `#CE5A2C`, rouge `#CD0909`, noir `#1A1A1A` — répartition 60/25/15. **Secondaires**, surfaces et encres, jamais en concurrence : blanc cassé `#FDFBF6`, crème `#F8EDDA`, terre brune `#76403D`, vert nuit `#0A332E` (`--encre`), vert forêt `#2F4B3C`. **Un seul gris de service** : `#E4E1DA`.

**Typographie** : MuseoModerno et la famille Museo, auto-hébergées dans `fonts/`, repli Roboto. **Cooper Black est réservée au logotype Roots Café**, vectorisée, jamais en webfont.

**Logo** : cartouche rond (`r_roots_*`) pour le web, carré (`roots_*`) pour l'imprimé.

**Iconographie** : deux registres qui ne se mélangent jamais — les symboles issus de la fresque, extraits verbatim et jamais redessinés, pour l'expression de marque ; **Lucide** pour les icônes fonctionnelles.

**Crédits** — toute mention d'attribution se recopie telle quelle :

> Identité de marque, système et direction artistique : Michael Gnimadi.
> Logo Roots : création originale de Loïc Malo — Évolu (Communication 360°, Bénin),
> en sessions de travail avec Mika ; contributeur design de l'identité.
> Iconographie : Ame Karaba.

## 7. Nomenclature

Grille **2×3** : **Mi / NU** × **Roots / Plan / Roam**. Barre de navigation basse : **Plan · Roots · Roam**, Roots au centre. Bascule Mi ↔ NU en haut à gauche ; menu des sections en haut à droite.

En v1, le monde **Roots** est vivant ; **Plan** et **Roam** sont présents mais dormants. **Mi** est actif, **NU** dormant.

⚠️ Le verbe **« Road » n'existe plus** — renommé **« Plan »**. Le fichier `vecteurs/lockup_mi_road.svg` conserve son nom jusqu'à son renommage effectif : ce n'est pas une coquille.

## 8. Règles de code

- **Aucune clé, aucun jeton, aucun mot de passe dans ce dépôt.** Ce qui doit rester secret vit dans des variables d'environnement côté serveur.
- **Un élément publié ici est public pour toujours.** S'il n'aurait pas dû l'être, il doit être **remplacé**, pas seulement retiré. Réécrire l'historique ne suffit jamais seul.
- **Les montants se recalculent côté serveur.** Une valeur venue du navigateur n'est jamais autorité.
- **Les écritures comptables ne se modifient pas** : correction par écriture inverse, jamais par mise à jour ni suppression.
- Les écritures ouvertes au public portent une **vérification anti-robot** et une **limitation de débit**.
- `node --check` sur tout JavaScript avant commit. Noms de fichiers **en minuscules, sans suffixe de version**. Références CSS **en relatif**.

## 9. Conventions de travail

L'agent **édite dans le dépôt** ; le mainteneur relit les différences et commit lui-même. **L'agent ne pousse jamais.**

**Toujours demander avant une action conséquente ou irréversible.**

Les scripts de vérification présents dans `.githooks/` refusent de s'exécuter sans leur fichier de règles, et bloquent alors toute écriture : c'est voulu. Ne jamais contourner par `--no-verify` sans avoir relu la différence ligne à ligne.

## 10. Portée de ce fichier

Ce document décrit **ce qu'il faut savoir pour écrire du code dans ce dépôt**, et rien d'autre. Il ne décrit ni l'organisation, ni ses activités, ni ses outils, ni ses documents. Ne pas l'étendre dans ces directions.
