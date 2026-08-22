# Feature — Purchased in place, thème manuel, autocomplete & actions de card

## Livres achetés

Le champ `purchased` reste une information indépendante du statut de sortie. Il ne provoque plus de déplacement vers une section dédiée.

Un livre acheté :

- reste dans son groupe de sortie selon `releaseDate` ; les anciens `statusOverride` restent encore lus temporairement pour compatibilité, mais le formulaire ne permet plus d'en créer ;
- conserve son groupe mensuel et sa position chronologique ;
- garde le titre barré et un rendu atténué ;
- utilise une bande latérale grisée pour signaler l'état acheté.

L'atténuation visuelle s'applique uniquement au contenu interne de la card, pas au conteneur complet. Le fond de la card reste opaque afin que la couche d'actions de swipe située derrière ne transparaisse pas lorsque la card est au repos.

## Actions de card

Le tap/clic simple sur une card n'ouvre plus l'édition et ne déclenche aucune action. Les actions sont explicites :

- swipe vers la droite → révèle l'action **Modifier** à gauche ;
- swipe vers la gauche → révèle l'action **Supprimer** à droite ;
- le relâchement du swipe ne déclenche pas directement l'action : il laisse apparaître le bouton iconographique, qui doit ensuite être activé volontairement ;
- l'édition utilise une surface bleue fonctionnelle et une icône crayon ;
- la suppression utilise une surface rouge fonctionnelle et une icône corbeille, puis conserve la confirmation avant suppression réelle.

Le geste mobile est volontairement souple : la card peut se déplacer librement dans une plage horizontale courte, un déplacement modéré suffit à révéler l'action et un flick rapide est également reconnu. `touch-action: pan-y` préserve le scroll vertical de la page.

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

Le composant d'autocomplete n'utilise plus de `datalist` natif afin d'éviter les heuristiques d'autofill du navigateur (par exemple les suggestions de moyens de paiement sur le champ Série). Il expose une vraie combobox accessible au clavier : flèches, Entrée et Échap.

Pour Auteur et Éditeur, l'autocorrection et la vérification orthographique sont désactivées afin d'éviter les corrections indésirables d'iOS sur les noms propres et maisons d'édition.

Aucune API externe de livres ou d'auteurs n'est introduite.

## Formulaire — feedback utilisateurs, itération 1

La date de sortie reste obligatoire. Tous les autres champs deviennent optionnels, avec une règle métier unique pour identifier le livre :

- un titre suffit ;
- sans titre, une série **et** un tome sont requis ensemble.

La fonction pure `hasValidBookIdentity` centralise cette règle afin qu'elle puisse être réutilisée plus tard par l'import JSON et les migrations de données.

Lorsqu'un livre ne possède pas de titre explicite, `getBookDisplayTitle` construit uniquement pour l'affichage une valeur localisée du type `Saga · Tome 2`. La valeur n'est pas recopiée artificiellement dans le champ `title`.

Tous les champs de saisie utilisent désormais la même typographie et une taille minimale de `16px`. Ce choix supprime le zoom automatique de Safari iOS au focus sur les champs qui étaient auparavant rendus en 15px ou 13px.

Le sélecteur permettant de forcer `À paraître` / `Disponible` est retiré du formulaire. Les anciens overrides restent temporairement compatibles dans le modèle courant et seront supprimés avec la migration du modèle de date V2.
