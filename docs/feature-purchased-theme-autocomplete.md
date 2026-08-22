# Feature — Purchased in place, thème manuel & autocomplete

## Livres achetés

Le champ `purchased` reste une information indépendante du statut de sortie. Il ne provoque plus de déplacement vers une section dédiée.

Un livre acheté :

- reste dans `À paraître` ou `Disponibles` selon `releaseDate` et l'éventuel `statusOverride` ;
- conserve son groupe mensuel et sa position chronologique ;
- garde le titre barré et un rendu atténué ;
- utilise une bande latérale grisée pour signaler l'état acheté.

L'atténuation visuelle s'applique uniquement au contenu interne de la card, pas au conteneur complet. Le fond de la card reste opaque afin que les actions de swipe `Modifier` / `Supprimer` ne transparaissent pas lorsque la card est au repos.

## Thème

Trois préférences sont disponibles dans les réglages :

- `system` : suit `prefers-color-scheme` ;
- `light` : force la palette claire ;
- `dark` : force la palette sombre.

La préférence est stockée dans `localStorage` sous `book-wishlist:theme`. `ThemeProvider` utilise `useSyncExternalStore` pour réagir aux changements dans l'onglet courant et entre onglets.

Un script minimal dans le `RootLayout` applique la préférence persistée avant l'hydratation afin d'éviter un flash de thème incorrect au chargement. Le CSS repose sur l'attribut `data-theme` de l'élément `<html>` et garde le media query système comme fallback.

## Autocomplete du formulaire

Les champs suivants utilisent un `datalist` natif :

- Auteur ;
- Série ;
- Éditeur.

Les suggestions proviennent uniquement des livres déjà enregistrés localement. La fonction `getBookAutocompleteOptions` :

- trim les valeurs ;
- ignore les chaînes vides ;
- déduplique sans tenir compte de la casse ;
- trie selon la langue active.

Aucune API externe de livres ou d'auteurs n'est introduite.
