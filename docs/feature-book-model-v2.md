# Feature — Book Model V2 & dates à précision variable

## Objectif

Le modèle V2 adapte l'application à la manière dont les maisons d'édition annoncent réellement leurs sorties : une date peut être connue précisément, seulement au mois, ou seulement à l'année. L'application ne doit jamais fabriquer un jour ou un mois fictif pour compléter une information inconnue.

## Identité du livre

Un livre est valide lorsqu'il possède :

- soit un `title` non vide ;
- soit un `series` non vide **et** un `volume` non vide.

`title`, `author`, `publisher`, `series`, `volume` et `note` sont optionnels dans le modèle persistant. `releaseDate` reste obligatoire.

Quand `title` est absent, `getBookDisplayTitle` produit uniquement pour l'interface un libellé du type `Saga · Tome 2`. Cette valeur n'est pas recopiée dans `title`.

## Release date

`releaseDate` reste une chaîne ISO, mais accepte trois niveaux de précision :

- `YYYY` — année uniquement, par exemple `2027` ;
- `YYYY-MM` — mois connu, par exemple `2027-11` ;
- `YYYY-MM-DD` — date exacte, par exemple `2027-11-18`.

`getReleaseDatePrecision` et `isValidReleaseDate` centralisent la validation. Les formats incomplets ou impossibles (`2027-13`, `2027-02-30`, etc.) sont rejetés.

Le formulaire propose explicitement trois modes de saisie : **Date précise**, **Mois**, **Année**. Changer de précision ne complète jamais automatiquement une partie inconnue.

Les contrôles natifs `type="date"` et `type="month"` utilisent `defaultValue` afin de laisser le navigateur conserver correctement une saisie clavier segmentée incomplète sur desktop. La valeur métier n'est synchronisée via `onChange` que lorsque le navigateur produit une valeur exploitable. Le mode `Année`, basé sur un input texte, reste contrôlé et conserve les saisies partielles `2`, `20`, `202`, puis `2027` jusqu'à validation finale.

## Statut entièrement dérivé

Le statut n'est plus stocké dans `Book`. Les anciens champs `status` et `statusOverride` disparaissent du modèle.

`deriveStatus(releaseDate, today)` renvoie :

- `available` : la période de sortie est entièrement passée ;
- `upcoming` : la période de sortie est entièrement future ;
- `unknown` : la précision disponible recouvre la période courante et ne permet pas de conclure.

Exemples au 22 août 2026 :

| releaseDate | statut |
| --- | --- |
| `2026-08-22` | `available` |
| `2026-08-23` | `upcoming` |
| `2026-07` | `available` |
| `2026-08` | `unknown` |
| `2026-09` | `upcoming` |
| `2025` | `available` |
| `2026` | `unknown` |
| `2027` | `upcoming` |

Le troisième état est volontairement neutre : l'application préfère déclarer qu'elle ne sait pas plutôt que d'inventer une information.

## Affichage et regroupement

Les dates exactes et mensuelles restent regroupées par `YYYY-MM`. Les livres dont seule l'année est connue sont regroupés dans un bloc `YYYY · Mois non précisé`.

Dans la timeline par défaut :

1. mois courant ;
2. éventuel groupe `année courante · mois non précisé` ;
3. périodes futures dans l'ordre croissant ;
4. périodes passées du plus récent au plus ancien.

Tous les groupes mensuels `YYYY-MM` de l'organisation `Par mois` sont ouverts par défaut et peuvent être repliés individuellement. Cela inclut les mois futurs et les mois d'années passées lorsqu'une archive annuelle est ouverte. Les groupes annuels `YYYY · Mois non précisé` ne sont pas collapsables.

Le mode optionnel **Par statut** possède désormais trois sections :

- `À paraître` ;
- `Statut indéterminé` ;
- `Disponibles`.

Une card `unknown` utilise un accent neutre. Les accents `brass` et `cloth` restent réservés respectivement aux sorties futures et disponibles.

## Migration IndexedDB

La base passe en version 2 sans modifier les index existants. L'upgrade :

- supprime `status` ;
- supprime `statusOverride` ;
- retire les anciennes chaînes vides de `title`, `author` et `publisher` afin qu'elles deviennent de vrais champs optionnels.

Les IDs, dates, série/tome, note, état acheté et timestamps restent inchangés.

## Compatibilité des sauvegardes

Le pipeline commun `lib/book-backup.ts` normalise désormais aussi bien les imports JSON locaux que les imports Google Drive.

Il accepte les anciens exports V1 : les champs `status` et `statusOverride` sont ignorés et chaque entrée est normalisée vers le modèle V2 avant insertion. Les anciennes enveloppes `{ exportedAt, books }` sans numéro de version et les anciens tableaux bruts restent également importables.

Les nouveaux exports utilisent une enveloppe `version: 2`. Une sauvegarde explicitement plus récente que la version comprise par l'application est rejetée plutôt que migrée silencieusement.

Le détail du format, de la validation et des modes `Remplacer` / `Fusionner` est documenté dans `docs/feature-backup-import.md`.

La suppression de la sauvegarde Drive automatique appartient toujours à l'itération suivante afin de conserver une architecture sans backend et un comportement OAuth honnête.
