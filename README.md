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

- Le statut est dérivé de `releaseDate` à l'affichage.
- Un override manuel optionnel permet de gérer les sorties avancées ou retardées sans empêcher les statuts automatiques de vieillir correctement.
- `series` et `volume` sont optionnels : ils permettent de rattacher un livre à une série et à un tome sans imposer cette structure aux ouvrages indépendants.
- Auteur, série et éditeur proposent un autocomplete alimenté par les valeurs déjà enregistrées localement.
- La recherche texte porte sur le titre, l'auteur, la série et le tome.
- `purchased` ne modifie plus le regroupement : un livre acheté conserve sa section de sortie, son mois et sa position chronologique.
- Les livres sont séparés en `À paraître` / `Disponibles`, puis regroupés par mois de sortie à l'intérieur de chaque section.
- Dans `À paraître`, les mois sont affichés du plus proche vers le futur ; dans `Disponibles`, du plus récent vers les plus anciens.
- Toute mutation locale programme un export Drive après ~5 secondes si Drive est connecté.
- Aucun backend, aucune API de catalogue de livres, aucune couverture, aucune notification push et aucune Background Sync API.

## PWA / iOS

Le service worker n'est enregistré qu'en production. Après déploiement HTTPS, Safari iOS peut installer l'application via **Partager → Sur l'écran d'accueil**. Le stockage principal reste IndexedDB ; le service worker ne sert qu'à accélérer le chargement des ressources statiques et à conserver une coque minimale.

## Documentation

- `docs/spec-book-wishlist.md` : spécification fonctionnelle historique.
- `docs/design-system-book-wishlist.md` : identité visuelle et règles UI.
- `docs/feature-month-grouping-i18n.md` : décisions détaillées pour le regroupement mensuel et l'internationalisation.
- `docs/feature-purchased-theme-autocomplete.md` : évolution du comportement acheté, thème manuel et autocomplete.
