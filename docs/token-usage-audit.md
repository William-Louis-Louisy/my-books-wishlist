# Audit — usage explicite des accents du design-system

Les accents identitaires du design-system doivent rester traçables directement depuis les composants.

## Règle

- `--accent-brass` : statut `À paraître`, CTA principal, état de sauvegarde en attente.
- `--accent-cloth` : statut `Disponible`, état de sauvegarde synchronisé.

Pour éviter qu'une recherche du token ne renvoie uniquement sa déclaration dans `globals.css`, les composants qui consomment ces couleurs utilisent désormais explicitement `var(--accent-brass)` / `var(--accent-cloth)` dans leurs classes Tailwind arbitraires.

## Usages UI attendus

### `--accent-cloth`

- bande de statut gauche des livres disponibles ;
- date des livres disponibles ;
- repère du mois des groupes disponibles ;
- point de sauvegarde Drive synchronisée.

### `--accent-brass`

- bande de statut gauche des livres à paraître ;
- date des livres à paraître ;
- repère du mois des groupes à paraître ;
- point de sauvegarde Drive en attente.

Cette règle complète le design-system : les aliases Tailwind raccourcis ne doivent pas masquer la provenance d'un token identitaire lorsqu'on audite l'interface.
