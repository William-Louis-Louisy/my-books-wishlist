# Feature — Regroupement mensuel & internationalisation

## Regroupement par mois

L'organisation principale de la liste est désormais **mensuelle**. Les livres `À paraître` et `Disponibles` ne sont plus séparés en deux grandes sections dans l'affichage par défaut : ils cohabitent dans le même groupe `YYYY-MM` selon leur `releaseDate`.

Le statut de sortie reste une information métier indépendante et continue d'être visible au niveau de chaque card :

- `À paraître` utilise `--accent-brass` ;
- `Disponible` utilise `--accent-cloth` ;
- `purchased` reste indépendant du statut de sortie et ne change ni le mois ni la position du livre.

### Ordre de la timeline mensuelle

Le mode mensuel est centré autour du mois courant :

1. mois courant ;
2. mois futurs dans l'ordre chronologique croissant ;
3. mois passés du plus récent au plus ancien.

À l'intérieur d'un mois courant ou futur, les livres sont triés par date croissante. Dans les mois passés, ils sont triés par date décroissante.

Cette logique vit dans `groupBooksByTimelineMonth` (`lib/books.ts`) et est couverte par Vitest.

### Organisation optionnelle par statut

Le panneau de recherche/filtres propose une option d'organisation :

- `Par mois (par défaut)` ;
- `Par statut`.

Le mode `Par statut` conserve l'ancien comportement :

- section `À paraître` avec mois croissants ;
- section `Disponibles` avec mois décroissants.

Ce mode est volontairement secondaire : il permet de retrouver une lecture par état de sortie sans imposer cette séparation à la timeline principale.

Un groupe mensuel est identifié par une clé stable `YYYY-MM`, mais son libellé est formaté selon la langue active (`Août 2026` / `August 2026`).

## Internationalisation

### Scope initial

Langues disponibles :

- Français (`fr`), langue par défaut.
- Anglais (`en`).

L'internationalisation utilise `next-intl`. Les catalogues sont séparés dans :

- `messages/fr.json`
- `messages/en.json`

Les textes visibles, libellés d'accessibilité, confirmations, validations, états Drive, mois et dates sont localisés.

### Persistance de la langue

L'application reste sans backend et sans routes localisées. La préférence est stockée dans `localStorage` sous la clé `book-wishlist:locale`.

`LocaleProvider` s'appuie sur `useSyncExternalStore` afin de :

- éviter une synchronisation de state dans un effet ;
- rester compatible avec le rendu serveur/hydratation ;
- propager instantanément un changement de langue dans l'onglet courant ;
- réagir également à un changement provenant d'un autre onglet.

Le provider met aussi à jour l'attribut `lang` du document et le titre du document après hydratation.

### Formats

- `fr` → `fr-FR`
- `en` → `en-GB`

Ce mapping s'applique aux dates de sortie, horodatages de sauvegarde et libellés de mois.

### Choix d'architecture

Les URLs restent `/`, `/settings`, `/book/new`, etc. Le produit est une PWA mono-utilisateur et non un site éditorial indexable ; des préfixes `/fr` et `/en` ajouteraient ici de la complexité de navigation sans bénéfice fonctionnel. Si le produit devient public/SEO plus tard, une migration vers le routing localisé de `next-intl` pourra être envisagée.
