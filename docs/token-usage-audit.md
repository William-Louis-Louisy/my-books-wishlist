# Audit — usage explicite des accents du design-system

Les accents identitaires du design-system doivent rester traçables directement depuis les composants.

## Règle

- `--accent-brass` : statut `À paraître`, CTA principal, état de sauvegarde en attente.
- `--accent-cloth` : statut `Disponible`, état de sauvegarde synchronisé.
- `Statut indéterminé` : rendu neutre basé sur `ink-muted`, sans nouvel accent identitaire.

Pour éviter qu'une recherche du token ne renvoie uniquement sa déclaration dans `globals.css`, les composants qui consomment ces couleurs utilisent explicitement `var(--accent-brass)` / `var(--accent-cloth)` dans leurs classes Tailwind arbitraires.

## Usages UI attendus

### `--accent-cloth`

- bande de statut gauche des livres disponibles ;
- date des livres disponibles ;
- repère de période vert uniquement lorsque l'organisation optionnelle `Par statut` est active ;
- point de sauvegarde Drive synchronisée.

### `--accent-brass`

- bande de statut gauche des livres à paraître ;
- date des livres à paraître ;
- repère de période doré uniquement lorsque l'organisation optionnelle `Par statut` est active ;
- point de sauvegarde Drive en attente.

### Statut indéterminé

Lorsque `releaseDate` ne permet pas encore de savoir si la sortie est passée ou future (année courante seule ou mois courant sans jour), la bande et la date utilisent un gris neutre. Ce cas ne doit jamais détourner `brass` ou `cloth` pour simuler une certitude inexistante.

Dans l'organisation par défaut, les en-têtes de période restent neutres : un même mois peut contenir simultanément des livres disponibles, à paraître et indéterminés. Le statut est donc porté par chaque card plutôt que par le groupe.

Cette règle complète le design-system : les aliases Tailwind raccourcis ne doivent pas masquer la provenance d'un token identitaire lorsqu'on audite l'interface.
