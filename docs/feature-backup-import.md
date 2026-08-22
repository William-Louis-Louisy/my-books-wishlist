# Feature — Sauvegardes JSON & pipeline d'import commun

## Objectif

L'application dispose d'un même format de sauvegarde et d'un même pipeline de validation pour :

- l'export JSON local ;
- l'import JSON local ;
- l'export Google Drive ;
- l'import Google Drive.

L'objectif est d'éviter que les sauvegardes locales et Drive évoluent différemment et de conserver la compatibilité avec les fichiers créés avant le Book Model V2.

## Format courant

Les nouveaux exports produisent une enveloppe versionnée :

```json
{
  "version": 2,
  "exportedAt": "2026-08-22T17:30:00.000Z",
  "books": []
}
```

La sérialisation vit dans `lib/book-backup.ts` via `serializeBookBackup`.

## Compatibilité descendante

`parseBookBackup` accepte :

1. l'enveloppe V2 actuelle ;
2. les anciennes enveloppes `{ exportedAt, books }` sans numéro de version ;
3. les sauvegardes historiques constituées directement d'un tableau de livres ;
4. les anciens enregistrements V1 contenant `status` et `statusOverride`.

Les champs `status` et `statusOverride` sont ignorés à l'import, puisque le statut est désormais dérivé de `releaseDate`.

Les dates `YYYY`, `YYYY-MM` et `YYYY-MM-DD` sont acceptées selon les règles du Book Model V2.

Une version explicitement plus récente que celle comprise par l'application est rejetée afin d'éviter une migration destructive silencieuse.

## Validation avant écriture

Le fichier complet est parsé et validé **avant toute mutation IndexedDB**.

Chaque livre doit notamment avoir :

- un `id` non vide ;
- une `releaseDate` valide ;
- un booléen `purchased` ;
- des timestamps `createdAt` et `updatedAt` valides ;
- soit un titre, soit une série accompagnée d'un tome.

Les champs optionnels doivent rester des chaînes lorsqu'ils sont présents. Les IDs dupliqués dans une même sauvegarde sont rejetés pour éviter un écrasement ambigu.

Si une entrée est invalide, l'import entier est refusé et les données locales restent intactes.

## Modes d'import

La logique d'écriture vit dans `lib/book-import.ts`.

### Remplacer

L'opération est transactionnelle :

1. validation complète du fichier ;
2. ouverture d'une transaction Dexie ;
3. suppression de la liste locale ;
4. insertion de la sauvegarde validée.

Le compteur de résultat correspond au nombre de livres présents dans la sauvegarde.

### Fusionner sans doublons

Les IDs déjà présents localement sont conservés tels quels et les entrées correspondantes du fichier ne remplacent pas la version locale.

Seuls les IDs absents sont ajoutés. Le compteur de résultat représente donc le nombre de livres **réellement ajoutés**, et non la taille totale de la sauvegarde.

## Interface locale

Dans **Réglages → Données locales** :

- `Exporter en JSON` télécharge une sauvegarde V2 ;
- `Importer un JSON` ouvre le sélecteur de fichier ;
- le fichier est validé avant de proposer une action ;
- le nom du fichier et le nombre de livres détectés sont affichés ;
- l'utilisateur choisit ensuite `Remplacer la liste locale` ou `Fusionner sans doublons`.

Un fichier invalide affiche une erreur explicite et n'altère jamais IndexedDB.

## Google Drive

`drive-sync.ts` ne maintient plus son propre normaliseur de livres. Il utilise :

- `serializeBookBackup` pour l'export ;
- `parseBookBackup` pour la restauration ;
- `applyBookImport` pour l'écriture locale.

Google Drive est désormais un **mécanisme de sauvegarde/restauration strictement manuel**. Les deux opérations sont lancées uniquement depuis les réglages par une action utilisateur explicite.

Un import Drive ne programme aucun export en retour. De la même manière, les mutations locales n'appellent jamais Drive. IndexedDB reste donc la source de vérité et le pipeline de sauvegarde ne crée aucune boucle de synchronisation implicite.

Le détail du choix OAuth et de la suppression de l'autosync est documenté dans `docs/feature-manual-drive-backup.md`.
