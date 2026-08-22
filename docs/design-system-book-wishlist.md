# Design System — Liste de livres à paraître

Complète `spec-book-wishlist.md` (logique fonctionnelle) : ce fichier traite de l'identité visuelle, de la hiérarchie des composants et des interactions d'UI. Il constitue la référence à suivre pour garder une cohérence sur toute l'app.

## 1. Direction

Le point de départ n'est pas "une app à liste" générique, mais l'univers de l'édition : ex-libris, tranche de livre, ruban marque-page, papier bible. Deux idées porteuses :

- Chaque livre est traité comme une **fiche d'éditeur** (titre, série/tome lorsqu'ils existent, auteur, éditeur, date — présentés avec la sobriété d'une notice bibliographique), pas comme une vignette e-commerce.
- L'action "marqué comme acheté" est incarnée par un **ruban marque-page** qui se réduit/se range visuellement, plutôt qu'une case à cocher générique — c'est la signature de l'app (voir 5.3).

À éviter explicitement : le combo fond crème + accent terracotta, le fond quasi noir + accent néon, et les mises en page façon "journal" à colonnes serrées. L'interface doit rester éditoriale, calme et immédiatement lisible.

## 2. Palette de couleurs

### Mode clair (par défaut)

| Rôle | Valeur | Usage |
|---|---|---|
| `--paper` | `#F7F6F2` | Fond principal — blanc papier, pas crème |
| `--ink` | `#14212B` | Texte principal — bleu-noir encre, pas noir pur |
| `--ink-muted` | `#5B6B72` | Texte secondaire (auteur, éditeur, métadonnées) |
| `--accent-brass` | `#B9873F` | Accent signature — doré/laiton, statut "À paraître", CTA principal |
| `--accent-cloth` | `#3E6259` | Vert reliure toilée — statut "Disponible", état de sync réussi |
| `--line` | `#DFDAD0` | Hairlines, séparateurs, bordures de card |
| `--surface-muted` | `#EDEAE3` | Fond des cards achetées |
| `--action-edit` | `#2F6F9F` | Surface fonctionnelle révélée pour l'édition |
| `--action-delete` | `#A6493D` | Surface fonctionnelle révélée pour la suppression |

### Mode sombre

| Rôle | Valeur | Usage |
|---|---|---|
| `--paper` | `#10181C` | Fond principal — encre profonde teintée bleu |
| `--ink` | `#EDE7DA` | Texte principal — blanc papier chaud |
| `--ink-muted` | `#94A0A3` | Texte secondaire |
| `--accent-brass` | `#D6A75B` | Accent signature, éclairci pour le contraste |
| `--accent-cloth` | `#649583` | Vert reliure, éclairci |
| `--line` | `#26333A` | Séparateurs |
| `--surface-muted` | `#182229` | Fond des cards achetées |
| `--action-edit` | `#2B648F` | Surface fonctionnelle édition |
| `--action-delete` | `#9E3F35` | Surface fonctionnelle suppression |

### Règles de couleur

`--accent-brass` et `--accent-cloth` sont les **deux accents identitaires** de l'app. Ils doivent rester perceptibles sans être décoratifs :

- `brass` matérialise le futur / "À paraître" et les CTA principaux ;
- `cloth` matérialise le présent / "Disponible" et la synchronisation réussie.

Les couleurs bleu/rouge de swipe sont des **couleurs fonctionnelles d'action**, visibles uniquement pendant l'interaction. Elles ne doivent jamais devenir des accents décoratifs, des couleurs de badge ou des couleurs de section.

## 3. Typographie

| Rôle | Police | Usage |
|---|---|---|
| Display | **Literata** | Titre de l'app, titres de livre, libellés mensuels |
| Corps | **Inter** | Auteur, éditeur, série, notes, labels d'UI, boutons |
| Utilitaire / data | **IBM Plex Mono** | Dates de sortie, tome lorsqu'il est purement utilitaire, données techniques |

Échelle mobile-first :

- Titre livre : `1.125rem`, Literata 500, line-height `1.3`
- Titre app : `1.375rem`, Literata 600
- Corps : `0.9375rem`, Inter 400
- Meta auteur/éditeur/série-tome : `0.8125rem`, Inter 400, `--ink-muted`
- Date : `0.8125rem`, IBM Plex Mono 500, letter-spacing `0.02em`, majuscules/petites capitales

## 4. Espacement & grille

- Base : `4, 8, 12, 16, 24, 32, 48px`.
- Padding horizontal de page : `20px` mobile, max-width `640px` centré.
- Cards : padding interne `16px`, rayon `12px`.
- Pas d'ombre lourde : séparation par hairlines, couleurs de surface et typographie.

## 5. Composants

### 5.1 Card livre

- Bande verticale gauche de `3px` : `--accent-brass` pour "À paraître", `--accent-cloth` pour "Disponible", `--ink-muted` à 40% pour un livre acheté.
- Titre en Literata.
- Série/tome, lorsqu'ils existent, sont affichés juste sous le titre en **Inter `0.8125rem`, `--ink-muted`**. Ce sont des métadonnées : pas de badge, pas de chip, pas de couleur d'accent.
- Auteur + éditeur sur la ligne suivante en `--ink-muted`.
- Date en IBM Plex Mono `0.8125rem`, alignée à droite. Pour renforcer la lecture du statut sans ajouter de badge : date `brass` si le livre est à paraître, `cloth` s'il est disponible, `ink-muted` s'il est acheté.
- Un livre acheté **reste à sa position chronologique**. Le titre est barré et le contenu interne passe à `opacity: 0.55`. La surface externe reste opaque afin de ne jamais laisser transparaître la couche d'actions située derrière la card.
- Le tap/clic simple sur la card est **neutre** : il ne doit ni ouvrir l'édition ni déclencher une autre action.

### 5.2 En-têtes et groupes mensuels

- En-tête de section (`À paraître`, `Disponibles`) : Inter majuscules, `letter-spacing: 0.08em`, `0.75rem`, `--ink-muted`.
- Les mois restent en Literata, sans badge. Un point de `6px` rappelle discrètement le statut : `brass` pour les groupes à paraître, `cloth` pour les groupes disponibles.
- Ce point est un repère fonctionnel, pas un élément décoratif supplémentaire.

### 5.3 Ruban marque-page — toggle "acheté"

- Ruban fin avec encoche en V, `--accent-brass`, en haut à droite de la card.
- Tap : le ruban pivote/se rétracte (~250ms, `ease-out`) pendant que le contenu de la card s'atténue et que le titre se barre.
- Reduced motion : fondu croisé de 100ms.
- C'est la seule animation volontairement expressive de l'app.

### 5.4 Actions de swipe

Le swipe ne doit jamais exécuter immédiatement une action destructive ou naviguer sans cible explicite.

- Swipe vers la **droite** : révèle à gauche une surface bleue `--action-edit` avec une **icône crayon** blanche.
- Swipe vers la **gauche** : révèle à droite une surface rouge `--action-delete` avec une **icône corbeille** blanche.
- Le relâchement laisse l'action révélée ; l'utilisateur active ensuite explicitement l'icône.
- La suppression conserve obligatoirement la boîte de confirmation.
- Sur mobile, le geste doit être souple : déplacement libre sur une courte amplitude, seuil modéré, prise en charge d'un flick rapide, `touch-action: pan-y` pour préserver le scroll vertical.
- Les anciens labels textuels `Modifier` / `Supprimer` derrière la card sont interdits.
- Le tap/clic de la card ne sert pas de raccourci vers l'édition.

### 5.5 Formulaire

- Inputs soulignés par une hairline `--line`, sans boîte complète.
- Labels au-dessus ; `Série`, `Tome`, `Note` affichent explicitement `(optionnel)`.
- Auteur, Série et Éditeur utilisent l'autocomplete contrôlé de l'application à partir des valeurs déjà présentes localement.
- `Tome` reste un champ texte libre.
- Focus : hairline `--accent-brass` à 2px, sans glow.
- Bouton principal : `--accent-brass`, texte `--paper`, rayon `8px`.
- Annuler : texte `--ink-muted`.

### 5.6 Indicateur de sync

- Point `6px` : `--accent-cloth` synchronisé, `--accent-brass` en attente, rouge discret réservé à l'échec.
- Tap : affiche le dernier export dans une surface minimale.

### 5.7 État vide

- Pas d'illustration générique.
- Une phrase Literata italique + une phrase Inter `--ink-muted`.
- Le FAB `+` reste l'action principale.

## 6. Motion

- Animation riche : ruban marque-page uniquement.
- Swipe : translation directe et physique, sans spring exagéré ; retour/settle en 150–200ms `ease-out`.
- Apparitions, panneaux et changements de section : 150–200ms maximum.
- Respecter `prefers-reduced-motion` pour toute transition >100ms.

## 7. Accessibilité

- Contraste AA minimum pour les textes et icônes fonctionnelles.
- Focus clavier visible sur tous les éléments réellement interactifs.
- Ruban marque-page : vrai bouton, `aria-pressed`, label explicite.
- Actions révélées : vrais boutons avec labels accessibles `Modifier « titre »` / `Supprimer « titre »` ; lorsqu'elles ne sont pas révélées, elles ne doivent pas être tabulables.
- Une card au repos n'est pas un bouton et ne doit pas annoncer une action d'édition implicite.

## 8. Ton rédactionnel

- Voix active, vocabulaire lecteur, pas de jargon technique dans l'UI.
- Les boutons gardent un libellé stable entre action et résultat.
- Les erreurs de sauvegarde décrivent le fait et le prochain comportement attendu.

## 9. Mapping Tailwind

Les tokens sont exposés par Tailwind 4 via `@theme inline` dans `app/globals.css` :

```css
--color-paper: var(--paper);
--color-ink: var(--ink);
--color-ink-muted: var(--ink-muted);
--color-brass: var(--accent-brass);
--color-cloth: var(--accent-cloth);
--color-line: var(--line);
--color-surface-muted: var(--surface-muted);
--color-action-edit: var(--action-edit);
--color-action-delete: var(--action-delete);
```

Toute nouvelle couleur doit être ajoutée comme token sémantique documenté ; aucune valeur couleur ad hoc ne doit être disséminée dans les composants.
