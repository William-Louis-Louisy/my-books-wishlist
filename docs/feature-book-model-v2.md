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

### Saisie native date/mois

Les contrôles `type="date"` et `type="month"` conservent les sélecteurs natifs du navigateur, mais ils ne sont pas pilotés par React pendant la saisie intermédiaire. Ils utilisent une valeur initiale (`defaultValue`) puis remontent la valeur métier via `onChange`.

Ce choix est volontaire : sur desktop, un contrôle natif segmenté ne fournit pas toujours une valeur ISO complète pendant que l'utilisateur saisit successivement jour, mois et année. Le rendre strictement contrôlé avec `value` pouvait réinjecter une chaîne vide et interrompre la saisie, notamment sur le segment année.

Chaque changement de précision remonte un contrôle distinct grâce à une `key`, afin que la valeur initiale correspondant au mode sélectionné soit correctement réappliquée.

Le mode **Année** reste un input texte contrôlé : il conserve les valeurs numériques partielles (`2`, `20`, `202`, `2027`) pendant la frappe, mais seule une année complète à quatre chiffres passe la validation finale.

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

## Compatibilité Drive

L'import Drive accepte temporairement les anciens exports V1 : les anciens champs de statut sont ignorés et chaque entrée est normalisée vers le modèle V2 avant insertion.

La future itération **Import JSON** extraira cette validation dans un pipeline commun aux fichiers locaux et à Google Drive.

La suppression de la sauvegarde Drive automatique appartient à une itération séparée afin de conserver des PR petites et vérifiables.
