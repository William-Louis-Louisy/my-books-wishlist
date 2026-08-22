# Design System — Liste de livres à paraître

Complète `spec-book-wishlist.md` (logique fonctionnelle) : ce fichier ne traite que de l'identité visuelle et des composants d'UI. À suivre à la lettre pour garder une cohérence sur tout l'app.

## 1. Direction

Le point de départ n'est pas "une app à liste" générique, mais l'univers de l'édition : ex-libris, tranche de livre, ruban marque-page, papier bible. Deux idées porteuses :

- Chaque livre est traité comme une **fiche d'éditeur** (titre, série/tome lorsqu'ils existent, auteur, éditeur, date — présentés avec la sobriété d'une notice bibliographique), pas comme une vignette e-commerce.
- L'action "marqué comme acheté" est incarnée par un **ruban marque-page** qui se réduit/se range visuellement, plutôt qu'une case à cocher générique — c'est la signature de l'app (voir 6.3).

À éviter explicitement : le combo fond crème + accent terracotta, le fond quasi noir + accent néon, et les mises en page façon "journal" à colonnes serrées — ce sont les trois défauts par lesquels une UI générée par IA se reconnaît. On s'en écarte volontairement ci-dessous.

## 2. Palette de couleurs

### Mode clair (par défaut)

| Rôle | Valeur | Usage |
|---|---|---|
| `--paper` | `#F7F6F2` | Fond principal — blanc papier, pas crème |
| `--ink` | `#14212B` | Texte principal — bleu-noir encre, pas noir pur |
| `--ink-muted` | `#5B6B72` | Texte secondaire (auteur, éditeur, métadonnées) |
| `--accent-brass` | `#B9873F` | Accent signature — doré/laiton (tranche dorée), utilisé pour "À paraître", CTA principal |
| `--accent-cloth` | `#3E6259` | Vert reliure toilée — utilisé pour "Disponible" |
| `--line` | `#DFDAD0` | Hairlines, séparateurs, bordures de card |
| `--surface-muted` | `#EDEAE3` | Fond des cards en section repliée / achetées |

### Mode sombre (`prefers-color-scheme: dark`)

| Rôle | Valeur | Usage |
|---|---|---|
| `--paper` | `#10181C` | Fond principal — encre profonde teintée bleu, pas noir neutre |
| `--ink` | `#EDE7DA` | Texte principal — blanc papier chaud |
| `--ink-muted` | `#94A0A3` | Texte secondaire |
| `--accent-brass` | `#D6A75B` | Accent signature, éclairci pour le contraste |
| `--accent-cloth` | `#649583` | Vert reliure, éclairci |
| `--line` | `#26333A` | Séparateurs |
| `--surface-muted` | `#182229` | Fond des cards achetées |

Règle : `--accent-brass` et `--accent-cloth` sont les deux seules couleurs vives de l'app. Tout le reste de l'UI reste dans la gamme papier/encre — pas de troisième accent, pas de dégradés.

## 3. Typographie

| Rôle | Police | Usage |
|---|---|---|
| Display | **Literata** (variable, `opsz` bas pour les gros titres) | Titre de l'app, titres de livre dans la liste et le formulaire — utilisée avec retenue, jamais pour un paragraphe entier. Choix délibéré : Literata a été dessinée à l'origine pour la lecture de livres numériques (Google Play Books), ce qui colle directement au sujet plutôt que d'être une serif display générique |
| Corps | **Inter** | Auteur, éditeur, série, notes, labels d'UI, boutons |
| Utilitaire / data | **IBM Plex Mono** | Dates de sortie, tome lorsqu'il est purement utilitaire, compteur "J-3", champs numériques — donne un rendu "fiche technique" cohérent avec l'univers éditorial |

Échelle (mobile-first, en rem) :

- Titre livre (Literata, 500) : `1.125rem` / line-height `1.3`
- Titre de section / app (Literata, 600) : `1.375rem`
- Corps (Inter, 400) : `0.9375rem`
- Meta / auteur-éditeur / série-tome (Inter, 400, `--ink-muted`) : `0.8125rem`
- Date / mono (Plex Mono, 500, letter-spacing `0.02em`) : `0.8125rem`, toujours en petites capitales ou majuscules (ex: `12 MARS 2027`)

## 4. Espacement & grille

- Base d'espacement 4px : `4, 8, 12, 16, 24, 32, 48`.
- Padding horizontal de page : `20px` (mobile), max-width `640px` centré si affiché sur écran large.
- Cards : padding interne `16px`, rayon de bordure `12px` — pas de `0` (pas de style broadsheet), pas au-delà de `16px` (pas de style "bulle" trop doux).
- Hairline (`1px solid var(--line)`) entre les items d'une même section plutôt que des ombres portées — l'app reste plate, la profondeur vient de la couleur et du poids typographique, pas de `box-shadow` lourd.

## 5. Composants

### 5.1 Card livre (liste principale)

- Bande verticale de 3px sur le bord gauche de la card, couleur = statut : `--accent-brass` (à paraître), `--accent-cloth` (disponible), `--ink-muted` à 40% d'opacité (acheté).
- Titre en Literata. Si le livre appartient à une série ou possède un tome renseigné, afficher juste sous le titre une ligne compacte `Série · Tome X`; omettre complètement cette ligne lorsque les deux champs sont absents. Auteur + éditeur restent sur la ligne suivante (`Auteur · Éditeur`). Date en Plex Mono alignée à droite.
- Série/tome sont des métadonnées, pas un second titre : pas de couleur d'accent dédiée, pas de badge, pas de chip.
- Livre acheté : card entière à `opacity: 0.55`, titre en `text-decoration: line-through`, bande latérale grisée comme ci-dessus.

### 5.2 En-tête de section

- Libellé en Inter majuscules, `letter-spacing: 0.08em`, taille `0.75rem`, couleur `--ink-muted` — traité comme une étiquette de classeur, pas comme un titre.
- Section "Acheté" repliable : chevron + compteur (`Acheté (12)`), même traitement typographique, tap pour déplier avec une simple transition de hauteur (200ms).

### 5.3 Ruban marque-page (toggle "acheté") — élément signature

- Icône dédiée en forme de ruban de marque-page (rectangle fin avec encoche en V au bas), couleur `--accent-brass` par défaut (livre pas encore acheté), positionnée en haut à droite de la card comme si elle dépassait de la tranche du livre.
- Tap : le ruban pivote et se rétracte dans la card (animation ~250ms, easing `ease-out`), pendant que la card bascule vers son état "acheté" (fondu vers `opacity: 0.55` + line-through synchronisé). C'est le seul moment d'animation marquée de toute l'app — tout le reste reste sobre.
- Reduced motion : remplacer l'animation par un simple fondu croisé de 100ms.

### 5.4 Formulaire (ajout/édition)

- Champs en Inter, labels au-dessus (jamais en placeholder seul), soulignés par une hairline `--line` plutôt que des inputs "boîte" avec bordure complète — cohérent avec l'esprit fiche/formulaire papier.
- Les labels `Série`, `Tome` et `Note` affichent explicitement `(optionnel)` dans une casse normale et sans letter-spacing afin que l'utilisateur comprenne immédiatement qu'ils peuvent être ignorés.
- `Série` utilise un autocomplete discret à partir des valeurs déjà présentes localement ; `Tome` reste un champ texte pour accepter aussi bien une numérotation classique que `1.5`, `HS`, etc.
- Focus visible : la hairline passe à `--accent-brass` et s'épaissit à 2px (jamais de glow/box-shadow flou).
- Bouton principal "Enregistrer" : fond `--accent-brass`, texte `--paper`, rayon `8px`. Bouton secondaire "Annuler" : texte seul, `--ink-muted`.

### 5.5 Indicateur de sync (header)

- Point de `6px` : `--accent-cloth` (synchronisé), `--accent-brass` (en attente), un rouge discret dédié `#B4543F` (échec — seule apparition de cette couleur dans toute l'app, réservée aux erreurs).
- Tap → affiche l'horodatage du dernier export en Plex Mono, en tooltip/sheet minimal.

### 5.6 État vide

- Pas d'illustration décorative générique : une simple ligne en Literata italique, ex. *"Aucun livre en attente pour l'instant."*, suivie d'un texte Inter en `--ink-muted` invitant à l'action ("Ajoutez le premier titre à surveiller."). Le bouton flottant "+" reste la seule action visuelle.

### 5.7 Notification (rappel de sortie)

- Titre de la notification en ton direct, voix active : `"[Titre] sort dans 3 jours"` / `"[Titre] est disponible aujourd'hui"` — jamais de formulation système ("Une notification a été déclenchée pour...").

## 6. Motion

- Une seule animation "riche" autorisée : le ruban marque-page (5.3). Tout le reste (apparition de liste, ouverture de section, transitions d'écran) reste à des fondus/déplacements courts (150–200ms, easing `ease-out`), sans rebond ni effet de ressort.
- Respecter `prefers-reduced-motion` partout : toute transition > 100ms doit avoir une version réduite.

## 7. Accessibilité

- Contraste : toutes les paires texte/fond ci-dessus visent au minimum AA (vérifier `--ink-muted` sur `--paper` en mode clair et sombre).
- Focus clavier visible sur tous les éléments interactifs (voir 5.4 pour le traitement visuel du focus).
- Le ruban marque-page (5.3) doit être un vrai bouton avec `aria-pressed` et un label explicite ("Marquer comme acheté" / "Marquer comme non acheté"), pas juste une icône cliquable.

## 8. Ton rédactionnel (microcopy)

- Voix active, verbes concrets, vocabulaire de lecteur — jamais de jargon technique ("sync", "payload") dans l'UI visible.
- Les boutons gardent le même intitulé du déclenchement au résultat : "Enregistrer" déclenche un état visible de sauvegarde, pas un message générique "Envoyé".
- Les erreurs de sync annoncent le fait sans excuse ni jargon : ex. *"Dernière sauvegarde impossible. Nouvel essai à la prochaine ouverture."* — jamais "Une erreur est survenue."

## 9. Mapping Tailwind (indicatif)

```js
// tailwind.config.js — extend
colors: {
  paper: "var(--paper)",
  ink: "var(--ink)",
  "ink-muted": "var(--ink-muted)",
  brass: "var(--accent-brass)",
  cloth: "var(--accent-cloth)",
  line: "var(--line)",
  "surface-muted": "var(--surface-muted",
},
fontFamily: {
  display: ["Literata", "serif"],
  sans: ["Inter", "sans-serif"],
  mono: ["IBM Plex Mono", "monospace"],
},
borderRadius: {
  card: "12px",
},
```

Les valeurs `--paper`, `--ink`, etc. sont définies en CSS custom properties dans `globals.css`, avec le bloc `dark:` (ou `@media (prefers-color-scheme: dark)`) reprenant les valeurs de la section 2.
