# Audit — usage explicite des accents du design-system

Les accents identitaires du design-system doivent rester traçables directement depuis les composants.

## Règle

- `--accent-brass` : statut `À paraître`, CTA principal, état de sauvegarde en attente.
- `--accent-cloth` : statut `Disponible`, état de sauvegarde synchronisé.

Pour éviter qu'une recherche du token ne renvoie uniquement sa déclaration dans `globals.css`, les composants qui consomment ces couleurs utilisent explicitement `var(--accent-brass)` / `var(--accent-cloth)` dans leurs classes Tailwind arbitraires.

## Usages UI attendus

### `--accent-cloth`

- bande de statut gauche des livres disponibles ;
- date des livres disponibles ;
- repère mensuel vert uniquement lorsque l'organisation optionnelle `Par statut` est active ;
- point de sauvegarde Drive synchronisée.

### `--accent-brass`

- bande de statut gauche des livres à paraître ;
- date des livres à paraître ;
- repère mensuel doré uniquement lorsque l'organisation optionnelle `Par statut` est active ;
- point de sauvegarde Drive en attente.

Dans l'organisation par défaut `Par mois`, les en-têtes mensuels restent neutres : un même mois peut contenir simultanément des livres disponibles et à paraître. Le statut est donc porté par chaque card plutôt que par le groupe mensuel.

Cette règle complète le design-system : les aliases Tailwind raccourcis ne doivent pas masquer la provenance d'un token identitaire lorsqu'on audite l'interface.
