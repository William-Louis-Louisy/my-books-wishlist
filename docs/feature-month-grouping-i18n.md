# Feature — Regroupement temporel & internationalisation

## Regroupement par période

L'organisation principale reste centrée sur les dates de sortie. Les livres `À paraître`, `Disponibles` et ceux dont le statut est momentanément indéterminé cohabitent dans la timeline par défaut.

Avec le modèle V2, `releaseDate` accepte `YYYY`, `YYYY-MM` ou `YYYY-MM-DD` :

- une date mensuelle ou précise rejoint un groupe `YYYY-MM` ;
- une date annuelle rejoint un groupe `YYYY · Mois non précisé` ;
- `purchased` reste indépendant du statut et ne déplace pas le livre.

Le statut de sortie reste visible au niveau de chaque card :

- `À paraître` utilise `--accent-brass` ;
- `Disponible` utilise `--accent-cloth` ;
- `Statut indéterminé` utilise un rendu neutre.

### Ordre de la timeline active

La partie toujours visible de la timeline est centrée autour de la période courante :

1. mois courant ;
2. éventuel groupe `année courante · mois non précisé` ;
3. périodes futures dans l'ordre chronologique croissant ;
4. périodes déjà passées de l'année courante, du plus récent au plus ancien.

Les dates précises sont triées chronologiquement dans leur groupe. Une date connue uniquement au mois reste après les dates précises du même mois afin de ne pas lui inventer un jour implicite.

La logique de tri temporel vit dans `groupBooksByTimelinePeriod` (`lib/books.ts`) et est couverte par Vitest.

### Archives annuelles collapsables

Les années strictement antérieures à l'année courante ne sont plus déroulées intégralement dans la timeline par défaut. `buildBookTimeline` sépare désormais :

- `activeGroups` : année courante et années futures ;
- `archives` : années passées regroupées de la plus récente à la plus ancienne.

Chaque archive annuelle est **repliée par défaut** et affiche son année, son nombre de livres et un chevron. Une fois ouverte, elle retrouve le détail par période :

- mois du plus récent au plus ancien ;
- éventuel groupe `Mois non précisé` en dernier pour les livres dont seule l'année est connue.

L'état ouvert/fermé est un état d'interface local à `BookList` et n'est pas persisté dans IndexedDB.

Lorsqu'une recherche texte ou un filtre éditeur est actif, les archives concernées sont temporairement forcées ouvertes afin qu'aucun résultat ne soit masqué derrière un groupe fermé. Lorsque les filtres sont retirés, l'interface retrouve l'état manuel des archives.

Les archives annuelles s'appliquent à l'organisation principale `Par mois`. Le mode optionnel `Par statut` conserve son regroupement métier propre.

### Organisation optionnelle par statut

Le panneau de recherche/filtres propose toujours :

- `Par mois (par défaut)` ;
- `Par statut`.

Le mode `Par statut` comporte désormais :

- section `À paraître` ;
- section `Statut indéterminé` ;
- section `Disponibles`.

Chaque section conserve ensuite le regroupement par période de sortie.

## Internationalisation

### Scope initial

Langues disponibles :

- Français (`fr`), langue par défaut.
- Anglais (`en`).

L'internationalisation utilise `next-intl`. Les catalogues sont séparés dans :

- `messages/fr.json`
- `messages/en.json`

Les textes visibles, libellés d'accessibilité, confirmations, validations, états Drive, mois, dates et contrôles d'archives sont localisés.

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

Ce mapping s'applique aux dates de sortie, horodatages de sauvegarde et libellés de mois. Une année seule reste affichée telle quelle et un mois seul est formaté sans inventer de jour.

### Choix d'architecture

Les URLs restent `/`, `/settings`, `/book/new`, etc. Le produit est une PWA mono-utilisateur et non un site éditorial indexable ; des préfixes `/fr` et `/en` ajouteraient ici de la complexité de navigation sans bénéfice fonctionnel. Si le produit devient public/SEO plus tard, une migration vers le routing localisé de `next-intl` pourra être envisagée.
