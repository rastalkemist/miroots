# CLAUDE.md — dépôt public

> **Ce dépôt est public.** Tout ce qui y entre est lisible par n'importe qui,
> définitivement. Ce qui n'est pas destiné à être public ne vit pas ici.
> **En cas de doute : ne pas écrire, demander.**

---

## 1. Le projet

Application web du **Roots**, un lieu à Cotonou (Bénin) : réservation d'espaces
de travail et de logements, commande sur place. Sans compte — identité minimale
et code de confirmation. Bilingue français / anglais, mobile d'abord.

Ouverture : tous les jours, 7 h – 19 h.

## 2. Nature du site

Site **statique** — HTML, CSS, JavaScript — servi tel quel, sans étape de
construction ni dépendance à installer. Un dépôt par sous-domaine.

**Aucune dépendance externe** : polices auto-hébergées, icônes en SVG intégré,
champ téléphone embarqué. La seule adresse externe appelée à l'exécution est
celle de la base.

## 3. Une seule source pour le style, une seule pour le chrome

`roots.css` est la **source unique du style** : aucun écran ne porte de balise
`<style>`, aucun ne redéfinit une valeur en dur. Le fichier est ordonné —
jetons de marque, base, chrome partagé, dialecte public, dialecte de console,
puis une section par écran. Une règle propre à un écran est rattachée par
`:where(body.p-…)`, ce qui la scope **sans peser sur la spécificité** :
rattacher une règle ne doit jamais changer qui l'emporte dans la cascade.

`roots.js` est la **source unique du chrome** : planche d'icônes, champ
téléphone international, navigation basse, menu déroulant, toast, et le
comportement des panneaux modaux.

Toute duplication entre écrans est un défaut, pas un raccourci : trois copies
divergent, et elles l'ont déjà fait.

## 4. Deux dialectes d'interface

Une seule famille visuelle — même palette, mêmes polices, même sémantique de
statut — mais deux grammaires, et **un seul dialecte par écran**.

**Dialecte A « rond / ambiant »**, sur les écrans publics. Pilules `999px`,
cartes `26px`, module `17px`, champ `13px`, surfaces lumineuses, animations
douces coupées sous `prefers-reduced-motion`. Les prix ne sont jamais en rouge :
encre neutre.

Deux **surfaces** pour ce dialecte, qui ne changent que l'encre et la structure
du chrome, jamais ses dimensions : `data-surface="ambiante"` pour l'accueil posé
sur le jardin, `data-surface="claire"` pour les pages de contenu.

**Dialecte B « tuiles / opérationnel »**, sur les écrans de gestion. Tuiles
carrées jointives à fort contraste : **rayon nul**, gouttière `4px`, pas de
grille `96px`, aplats saturés, grande icône plus libellé de un à trois mots.
**Aucun liseré, aucun flou, aucune ombre, aucun dégradé, aucune animation** — le
retour d'interaction est un changement d'état franc. La couleur d'une tuile dit
son **état** ; ce qu'on peut *faire* se signale par une encre inversée portant un
verbe, ou par un chevron. Une tuile sans verbe ni chevron est en lecture seule.

Le dialecte B est une grammaire d'opération, pas une interface appauvrie : une
tuile peut ouvrir un tableau dense. C'est l'entrée qui est grosse, pas le contenu
qui est pauvre.

**La règle du cartouche gouverne le logo, les dialectes gouvernent les
composants.** Les écrans de gestion gardent donc le cartouche **rond** ; jamais
de cartouche carré dans une interface.

## 5. Contraintes d'exécution

**Mobile d'abord**, sur des appareils d'entrée de gamme.

Sur la surface publique, la couverture réseau n'est pas une contrainte
structurante. Survivent, chacun pour son motif propre :

- **identifiant généré côté client et clé d'idempotence** sur toute écriture —
  protection contre les doubles soumissions, indépendante du réseau ;
- **cache applicatif** — pour la vitesse et l'installabilité ;
- **file d'attente locale** sur les seuls gestes critiques.

Sur les écrans de gestion, en revanche, la dégradation hors ligne est explicite :
état « non synchronisé » visible sur l'objet concerné, fonctions indisponibles
grisées et non cachées.

## 6. Accessibilité — non négociable, partout

Cibles tactiles **≥ 44 px**, contrastes **AA**, `prefers-reduced-motion`
respecté, `aria-live` sur les changements d'état, focus clavier visible, lien
d'évitement vers le contenu, un titre de niveau 1 par page.

Un panneau qui se déclare modal doit l'être : le focus n'en sort pas, la touche
d'échappement le ferme, et le geste « retour » du téléphone le referme au lieu de
quitter la page. Ce comportement vit dans `roots.js` — ne pas le réécrire par
écran.

La sémantique de statut par la couleur — jaune : attente · terracotta :
préparation · vert : confirmé ou prêt · rouge : annulé ou urgence · vert forêt :
terminé — est **toujours doublée d'une icône ou d'une position**, jamais portée
par la couleur seule.

**Toute affirmation de conformité porte sa mesure.** On n'écrit pas « contraste
AA vérifié » : on lance le contrôle qui mesure sur le rendu, et l'on montre le
résultat.

**Accessibilité ≠ littératie.** L'accessibilité s'applique partout. Les
aménagements de lecture sont des **réglages offerts à tous, à tout moment** — une
densité, et des médias autres que le texte. Jamais un attribut stocké sur
quelqu'un, jamais une caractéristique attribuée à un visiteur.

## 7. Marque et jetons

Les jetons vivent dans la section 1 de `roots.css`.

**Palette de marque, cinq couleurs** : vert `#006838`, jaune `#FFC840`,
terracotta `#CE5A2C`, rouge `#CD0909`, noir `#1A1A1A` — répartition 60/25/15.
**Secondaires**, surfaces et encres, jamais en concurrence : blanc cassé
`#FDFBF6`, crème `#F8EDDA`, terre brune `#76403D`, vert nuit `#0A332E`
(`--encre`), vert forêt `#2F4B3C`. **Un seul gris de service** : `#E4E1DA`.

**Terracotta profond `#B84F26`** : déclinaison sombre de la troisième couleur,
comme le vert nuit l'est du vert. Elle sert d'**encre** et de filet là où le
terracotta de marque ne tient pas le seuil AA — mesuré 3,96:1 sur blanc cassé
contre 4,85:1 pour le profond. Le terracotta de marque reste l'aplat.

**Échelle typographique**, base 16, quarte juste ×1,333 : 12 · 14 · 16 · 21 ·
28 · 38 · 64. Un texte ne se code jamais en pixels bruts : il prend un palier.
Un champ de saisie ne descend jamais sous 16 px — en dessous, iOS agrandit la
page dès qu'on entre dedans.

**Typographie** : MuseoModerno et la famille Museo, auto-hébergées dans `fonts/`,
repli Roboto. **Cooper Black est réservée au logotype du Café**, vectorisée,
jamais en webfont.

**Logo** : cartouche rond pour le web, carré pour l'imprimé.

**Iconographie** : deux registres qui ne se mélangent jamais — les symboles
issus de la fresque, extraits verbatim et jamais redessinés, pour l'expression de
marque ; un jeu fonctionnel pour les icônes d'interface.

**Crédits** : voir `CREDITS.md`. Toute mention d'attribution se recopie telle
quelle.

## 8. Nomenclature

Grille **2×3** : **Mi / NU** × **Roots / Plan / Roam**. Barre de navigation
basse : **Plan · Roots · Roam**, Roots au centre. Bascule Mi ↔ NU en haut à
gauche ; menu des sections en haut à droite.

En v1, le monde **Roots** est vivant ; **Plan** et **Roam** sont présents mais
dormants. **Mi** est actif, **NU** dormant.

Le verbe **« Road » n'existe plus** : il s'appelle **« Plan »**.

## 9. Règles de code

- **Aucune clé, aucun jeton, aucun mot de passe ici.** Ce qui doit rester secret
  vit dans des variables d'environnement côté serveur.
- **Un élément publié ici est public pour toujours.** S'il n'aurait pas dû
  l'être, il doit être **remplacé**, pas seulement retiré.
- **Aucun raisonnement interne dans le code, commentaires compris** : ni marqueur
  de décision, ni renvoi à une note de travail, ni aveu d'état d'avancement, ni
  note « à faire ». Un commentaire se lit exactement comme le code. Il dit la
  **contrainte**, jamais l'endroit où elle a été écrite.
- **Les montants se recalculent côté serveur.** Une valeur venue du navigateur
  n'est jamais autorité.
- **Les écritures comptables ne se modifient pas** : correction par écriture
  inverse, jamais par mise à jour ni suppression.
- Les écritures ouvertes au public portent une **vérification anti-robot** et une
  **limitation de débit**.
- `node --check` sur tout JavaScript avant commit. Noms de fichiers **en
  minuscules, sans suffixe de version**. Références CSS **en relatif**.

## 10. Avant de publier

**Ne pas juger le rendu en ouvrant un fichier depuis le disque.** Le navigateur y
bloque l'import de modules et plusieurs comportements paraissent défaillants sans
l'être. Servir le dossier — `python -m http.server` — puis regarder sur
`http://localhost:8000`.

Deux contrôles, hébergés hors de ce dépôt, chacun avec un mode qui pose des
défauts volontaires et vérifie qu'ils sont vus. Les lancer tous les deux avant
de publier.

Les scripts de `.githooks/` refusent de s'exécuter sans leur fichier de règles,
et bloquent alors toute écriture : c'est voulu, pas une panne.

## 11. Conventions de travail

L'agent **édite dans le dépôt** ; le mainteneur relit les différences et commit
lui-même. **L'agent ne pousse jamais.**

**Toujours demander avant une action conséquente ou irréversible.**

Quand un écran existe, on le clone à l'identique et l'on ne change que ce qui a
été demandé. Les propositions se font **à côté**, jamais à la place.

## 12. Portée de ce fichier

Ce document décrit **ce qu'il faut savoir pour écrire du code dans ce dépôt**, et
rien d'autre. Il ne décrit ni l'organisation, ni ses activités, ni ses outils, ni
ses documents. Ne pas l'étendre dans ces directions.
