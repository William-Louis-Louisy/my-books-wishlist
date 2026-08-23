# Feature — Purchased in place, thème manuel, autocomplete & actions de card

## Livres achetés

Le champ `purchased` reste une information indépendante du statut de sortie. Il ne provoque plus de déplacement vers une section dédiée.

Un livre acheté :

- reste dans son groupe de sortie selon `releaseDate` ;
- conserve son groupe temporel et sa position chronologique ;
- garde le titre barré et un rendu atténué ;
- utilise une bande latérale grisée pour signaler l'état acheté.

L'atténuation visuelle s'applique uniquement au contenu interne de la card, pas au conteneur complet. Le fond de la card reste opaque afin que la couche d'actions de swipe située derrière ne transparaisse pas lorsque la card est au repos.

## Actions de card

Le tap/clic simple sur une card n'ouvre plus l'édition et ne déclenche aucune action. Les actions sont explicites :

- swipe vers la droite → révèle l'action **Modifier** à gauche ;
- swipe vers la gauche → révèle l'action **Supprimer** à droite ;
- un geste intermédiaire se stabilise à `±76px` et laisse l'action visible ;
- la décision de fin de geste repose sur la position horizontale finale réelle de la card, et non sur le delta du dernier drag : une action déjà révélée peut donc être ramenée naturellement vers `0` sans devoir cliquer à l'extérieur ;
- pousser la card presque jusqu'à la butée (`±96px` pour une contrainte de `±104px`) puis relâcher déclenche directement l'action correspondante ;
- un flick court peut révéler une action mais ne peut pas la déclencher directement ;
- les boutons iconographiques restent disponibles comme fallback accessible lorsque l'action est révélée ;
- l'édition utilise une surface bleue fonctionnelle et une icône crayon ;
- la suppression utilise une surface rouge fonctionnelle et une icône corbeille, puis conserve la confirmation avant suppression réelle.

Le geste mobile reste volontairement souple : la card peut se déplacer librement dans une plage horizontale courte, un déplacement modéré suffit à révéler l'action et `touch-action: pan-y` préserve le scroll vertical de la page. La zone de déclenchement direct est volontairement distincte de la zone de révélation afin d'éviter les actions accidentelles.

Les couleurs bleue/rouge sont des **couleurs fonctionnelles d'action**, pas de nouveaux accents de marque. `accent-brass` et `accent-cloth` restent les accents identitaires de l'application.

## Thème

Trois préférences sont disponibles dans les réglages :

- `system` : suit `prefers-color-scheme` ;
- `light` : force la palette claire ;
- `dark` : force la palette sombre.

La préférence est stockée dans `localStorage` sous `book-wishlist:theme`. `ThemeProvider` utilise `useSyncExternalStore` pour réagir aux changements dans l'onglet courant et entre onglets.

Un script minimal dans le `RootLayout` applique la préférence persistée avant l'hydratation afin d'éviter un flash de thème incorrect au chargement. Le CSS repose sur l'attribut `data-theme` de l'élément `<html>` et garde le media query système comme fallback.

## Autocomplete du formulaire

Les champs suivants utilisent un autocomplete contrôlé par l'application :

- Auteur ;
- Série ;
- Éditeur.

Les suggestions proviennent uniquement des livres déjà enregistrés localement. La fonction `getBookAutocompleteOptions` :

- trim les valeurs ;
- ignore les chaînes vides ;
- déduplique sans tenir compte de la casse ;
- trie selon la langue active.

Le composant d'autocomplete n'utilise plus de `datalist` natif afin d'éviter les heuristiques d'autofill du navigateur. Il expose une vraie combobox accessible au clavier : flèches, Entrée et Échap.

Pour Auteur et Éditeur, l'autocorrection et la vérification orthographique sont désactivées afin d'éviter les corrections indésirables d'iOS sur les noms propres et maisons d'édition.

Aucune API externe de livres ou d'auteurs n'est introduite.

## Formulaire — feedback utilisateurs

La date de sortie reste obligatoire. Tous les autres champs sont optionnels, avec une règle métier unique pour identifier le livre :

- un titre suffit ;
- sans titre, une série **et** un tome sont requis ensemble.

La fonction pure `hasValidBookIdentity` centralise cette règle afin qu'elle puisse être réutilisée par les imports et migrations.

Lorsqu'un livre ne possède pas de titre explicite, `getBookDisplayTitle` construit uniquement pour l'affichage une valeur localisée du type `Saga · Tome 2`. La valeur n'est pas recopiée artificiellement dans le champ `title`.

Tous les contrôles textuels du formulaire (`input`, autocomplete, `select`, date, mois et `textarea`) utilisent la classe dédiée `.book-form-control`. Elle impose explicitement `Inter`, `16px`, un poids `400`, une hauteur de ligne commune, une casse normale et un `letter-spacing` normal. Cela neutralise notamment l'héritage involontaire de `font-medium`, `uppercase` et du tracking des labels englobants. La valeur interne des contrôles date/mois WebKit hérite également de ces règles. Le rendu est donc homogène et la taille calculée reste d'au moins `16px`, ce qui évite le zoom automatique de Safari iOS au focus.

Le modèle V2 supprime définitivement le statut forcé : `status` et `statusOverride` ne sont plus persistés. Le statut est entièrement dérivé de la précision réelle de `releaseDate`.
