# Livres à paraître / Upcoming Books

PWA mobile-first pour suivre une liste personnelle de livres à paraître, disponibles ou déjà achetés. Les données restent locales dans IndexedDB et peuvent être exportées/importées en JSON ou sauvegardées dans un unique fichier Google Drive créé par l'application.

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

## Sauvegardes JSON

Les exports locaux et Google Drive utilisent désormais le même format versionné (`version: 2`) et le même pipeline de validation.

Depuis **Réglages → Données locales**, l'utilisateur peut :

- exporter la bibliothèque en JSON ;
- sélectionner un fichier JSON local ;
- vérifier le nom du fichier et le nombre de livres détectés ;
- remplacer entièrement la liste locale ;
- ou fusionner uniquement les IDs absents.

Les anciens exports V1 restent importables, notamment les enveloppes sans numéro de version, les anciens tableaux bruts et les livres contenant encore `status` / `statusOverride`. Un fichier invalide est rejeté avant toute mutation IndexedDB.

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
- Les champs natifs Date précise et Mois utilisent `defaultValue` plutôt qu'un `value` React strict afin de préserver la saisie segmentée manuelle sur desktop ; le mode Année reste contrôlé et accepte les quatre chiffres progressivement.
- L'autocorrection et la vérification orthographique sont désactivées pour Auteur et Éditeur.
- La recherche texte porte sur le titre, l'auteur, la série et le tome.
- `purchased` ne modifie plus le regroupement : un livre acheté conserve son groupe temporel et sa position chronologique.
- L'organisation par défaut reste une timeline temporelle sans séparation globale `À paraître` / `Disponibles`.
- Les dates mensuelles et exactes sont groupées par mois ; les dates annuelles utilisent un groupe `YYYY · Mois non précisé`.
- La partie active de la timeline conserve l'année courante et les années futures ; les mois déjà passés de l'année courante restent visibles du plus récent au plus ancien.
- Tous les groupes mensuels `YYYY-MM` de la timeline sont ouverts par défaut mais peuvent être repliés individuellement, y compris les mois futurs et les mois contenus dans une archive annuelle ouverte.
- Les groupes `YYYY · Mois non précisé` restent non collapsables car ils ne représentent pas un mois réel.
- Les années strictement antérieures sont regroupées en **archives annuelles collapsables**, fermées par défaut, avec compteur de livres. Une archive ouverte affiche ses mois du plus récent au plus ancien puis `Mois non précisé` si nécessaire.
- Une recherche texte ou un filtre éditeur force temporairement l'ouverture des mois et archives concernés afin qu'aucun résultat ne soit masqué.
- Les sauvegardes JSON locales et Drive partagent le même sérialiseur, validateur et migrateur V1→V2 ; toute sauvegarde est entièrement validée avant écriture en base.
- En mode Fusionner, les livres locaux gagnent en cas d'ID déjà existant et le compteur ne rapporte que les nouvelles entrées réellement ajoutées.
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
- `docs/feature-backup-import.md` : format de sauvegarde, compatibilité V1/V2 et pipeline d'import commun.
- `docs/feature-month-grouping-i18n.md` : décisions détaillées pour la timeline temporelle, les mois/archives collapsables et l'internationalisation.
- `docs/feature-purchased-theme-autocomplete.md` : comportement acheté, thème manuel, autocomplete et formulaire.
