# Livres à paraître / Upcoming Books

PWA mobile-first pour suivre une liste personnelle de livres à paraître, disponibles ou déjà achetés. Les données restent locales dans IndexedDB et peuvent être sauvegardées dans un unique fichier Google Drive créé par l'application.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript strict
- Tailwind CSS 4
- Motion for React (successeur de Framer Motion)
- `next-intl` pour l'internationalisation FR/EN
- Dexie / IndexedDB
- Google Identity Services + Google Drive API (`drive.file` uniquement)
- Manifest Next.js + service worker minimal

## Démarrage

```bash
npm install
cp .env.example .env.local
npm run dev
```

L'application fonctionne entièrement en local sans configuration Google. Pour activer la sauvegarde Drive, renseigner `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

## Configuration Google Drive

1. Créer un projet dans Google Cloud Console.
2. Activer **Google Drive API**.
3. Configurer l'écran de consentement OAuth.
4. Créer un **OAuth 2.0 Client ID** de type *Web application*.
5. Ajouter les origines JavaScript autorisées (par exemple `http://localhost:3000` et le domaine Vercel de production).
6. Définir l'identifiant dans `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

L'application demande exclusivement le scope `https://www.googleapis.com/auth/drive.file`. Le jeton d'accès reste en mémoire ; aucun refresh token n'est stocké en clair. Le fichier distant s'appelle `book-wishlist-export.json` et est réécrit au lieu d'être dupliqué.

> **Décision OAuth :** la spec initiale mentionne PKCE tout en interdisant tout backend. Google exige aujourd'hui une plateforme backend pour terminer son *Authorization Code flow* (échange du code contre les tokens). La V1 utilise donc le *GIS token model* côté navigateur, qui est le seul modèle GIS compatible avec l'architecture 100 % client imposée. Si un backend est accepté plus tard, ce point devra être migré vers Authorization Code + PKCE.

## Internationalisation

L'interface est disponible en **français** et en **anglais**. La préférence est enregistrée localement dans le navigateur (`book-wishlist:locale`) et peut être changée depuis les réglages sans modifier les URLs ni nécessiter de backend. Les libellés, messages d'erreur, textes d'accessibilité, mois et dates suivent la langue sélectionnée.

Les traductions vivent dans :

- `messages/fr.json`
- `messages/en.json`

## Apparence

Le thème peut être choisi depuis les réglages : **Système**, **Clair** ou **Sombre**. La préférence est persistée sous `book-wishlist:theme`. Le mode Système continue de suivre `prefers-color-scheme`, tandis que les modes Clair/Sombre forcent explicitement la palette correspondante.

## Scripts

```bash
npm run dev
npm run test
npm run lint
npm run build
```

## Règles métier importantes

- La date de sortie reste obligatoire et accepte trois précisions réelles : année (`YYYY`), mois (`YYYY-MM`) ou date exacte (`YYYY-MM-DD`).
- L'identité d'un livre nécessite soit un **titre**, soit une **série + un tome**. Auteur, éditeur et note sont optionnels.
- Si le titre est absent, l'interface construit le titre d'affichage à partir de la série et du tome (`Saga · Tome 2`) sans dupliquer artificiellement cette valeur dans `title`.
- Le statut n'est plus persisté : il est dérivé de `releaseDate` à l'affichage et peut être `À paraître`, `Disponible` ou `Indéterminé` lorsque la précision de la date ne permet pas de trancher.
- Auteur, série et éditeur proposent un autocomplete alimenté par les valeurs déjà enregistrées localement.
- Les contrôles textuels du formulaire utilisent `.book-form-control`, qui impose explicitement Inter, `16px`, poids 400, casse et espacement normaux, y compris pour la valeur interne des champs date/mois WebKit. Cela homogénéise réellement les champs et évite le zoom Safari iOS au focus.
- L'autocorrection et la vérification orthographique sont désactivées pour Auteur et Éditeur.
- La recherche texte porte sur le titre, l'auteur, la série et le tome.
- `purchased` ne modifie plus le regroupement : un livre acheté conserve son groupe temporel et sa position chronologique.
- L'organisation par défaut reste une timeline temporelle sans séparation globale `À paraître` / `Disponibles`.
- Les dates mensuelles et exactes sont groupées par mois ; les dates annuelles utilisent un groupe `YYYY · Mois non précisé`.
- La timeline commence par le groupe courant, poursuit avec les groupes futurs dans l'ordre croissant, puis affiche les groupes passés du plus récent au plus ancien.
- Les statuts certains restent visibles sur chaque card via les accents `--accent-brass` (`À paraître`) et `--accent-cloth` (`Disponible`) ; le statut indéterminé utilise un rendu neutre.
- Une organisation **Par statut** reste disponible en option et comporte désormais `À paraître`, `Statut indéterminé` et `Disponibles`.
- Toute mutation locale programme encore un export Drive après ~5 secondes si Drive est connecté ; cette sauvegarde automatique sera supprimée dans l'itération Drive dédiée afin de rester cohérent avec l'architecture sans backend.
- Aucun backend, aucune API de catalogue de livres, aucune couverture, aucune notification push et aucune Background Sync API.

## PWA / iOS

Le service worker n'est enregistré qu'en production. Après déploiement HTTPS, Safari iOS peut installer l'application via **Partager → Sur l'écran d'accueil**. Le stockage principal reste IndexedDB ; le service worker ne sert qu'à accélérer le chargement des ressources statiques et à conserver une coque minimale.

## Documentation

- `docs/spec-book-wishlist.md` : spécification fonctionnelle historique.
- `docs/design-system-book-wishlist.md` : identité visuelle et règles UI.
- `docs/feature-book-model-v2.md` : modèle métier V2, dates partielles et migration IndexedDB.
- `docs/feature-month-grouping-i18n.md` : décisions détaillées pour la timeline temporelle et l'internationalisation.
- `docs/feature-purchased-theme-autocomplete.md` : comportement acheté, thème manuel, autocomplete et formulaire.
