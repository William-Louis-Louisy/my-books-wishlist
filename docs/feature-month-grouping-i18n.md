# Feature — Regroupement mensuel & internationalisation

## Regroupement par mois

Les groupes métier visibles sont désormais `À paraître` et `Disponibles`. Le champ `purchased` reste indépendant du statut de sortie et ne crée plus de troisième section : un livre acheté conserve sa section, son mois et sa position chronologique.

À l'intérieur des deux sections, les livres sont regroupés par mois de `releaseDate` :

- `À paraître` : mois le plus proche en premier, puis progression vers le futur (`asc`).
- `Disponibles` : mois le plus récent en premier, puis remontée vers le passé (`desc`).

Un groupe mensuel est identifié par une clé stable `YYYY-MM`, mais son libellé est formaté selon la langue active (`Août 2026` / `August 2026`). Les livres à l'intérieur du mois suivent la même direction chronologique que le groupe.

La logique pure vit dans `groupBooksByReleaseMonth` (`lib/books.ts`) et est couverte par Vitest.

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
