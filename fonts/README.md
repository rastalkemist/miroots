# Polices Museo auto-hébergées

Déposer ici les fichiers de polices référencés par `../roots-fonts.css` :

- `MuseoModerno-var.woff` et `MuseoModerno-Italic-var.woff` (police variable, axe wght 100–900)
- Museo Sans : `subsetMuseoSans{100,300,500,700}.woff2` (+ italiques)
- Museo Sans Display : `subsetMuseoSansDisplay{ExtraLight,Light,Black,ExtraBlack}.woff2`
- Museo Slab : `subsetMuseoSlab{100,300,500,700,900,1000}.woff2` (+ italiques)
- Museo (serif) : `subsetMuseo{100,300,500,700,900}.woff2` (+ italiques)

**Source** : bundle `roots_bundle_v1.2.zip` (22 `.woff2` subset + les `.woff` MuseoModerno).

## Important

- **Tant que ce dossier est vide, l'app fonctionne** : le repli **Roboto** (acté) prend le relais et `MuseoModerno` se charge via Google Fonts. Rien ne casse — Museo auto-hébergée est une amélioration, pas une dépendance bloquante.
- **Licence Museo** : acquisition webfont (Fontspring) en cours. Tant que des graisses gratuites sont servies en webfont, le crédit **exljbris** reste requis. Ne pas redistribuer ces fichiers hors du présent projet. Vérifier que la licence acquise couvre bien les graisses réellement déployées avant toute mise en production publique.
