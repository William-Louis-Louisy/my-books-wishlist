# Spec — Liste de livres à paraître (PWA)

## 1. Résumé du projet

Application web (PWA) simple et au design très soigné, permettant de suivre les livres qu'on souhaite se procurer : noter les livres à paraître, leur date de sortie, leur éditeur, et savoir en un coup d'œil ce qui est déjà disponible. Utilisation mono-utilisateur, sur smartphone (iOS Safari en priorité), installable sur l'écran d'accueil.

**Ce que l'app n'est PAS** (voir section 11 — Exclusions) : ni un catalogue de livres, ni une liseuse, ni un outil connecté à une base de données externe de livres.

## 2. Stack technique

- **Framework** : Next.js (App Router), TypeScript strict
- **Style** : Tailwind CSS
- **Animations** : Framer Motion (légères, pas d'effets superflus)
- **Stockage local** : IndexedDB via Dexie.js
- **Auth / sync cloud** : Google Identity Services (OAuth 2.0 côté client, PKCE), API Google Drive (scope `drive.file` uniquement)
- **PWA** : `next-pwa` (ou config manuelle manifest + service worker) — installable sur iOS 16.4+
- **Hébergement** : statique/serverless (Vercel ou équivalent) — aucun backend applicatif, aucune base de données serveur

## 3. Modèle de données

Un livre (`Book`) :

```ts
interface Book {
  id: string;              // uuid v4, généré côté client
  title: string;            // requis
  author: string;           // requis
  publisher: string;        // requis
  releaseDate: string;      // format ISO "YYYY-MM-DD", requis
  note?: string;             // champ libre, optionnel
  status: "upcoming" | "available"; // dérivé automatiquement de releaseDate vs date du jour, mais stocké pour permettre un override manuel
  purchased: boolean;        // true = déjà acheté, indépendant du status
  purchasedAt?: string;      // ISO datetime, renseigné au moment du toggle
  createdAt: string;         // ISO datetime
  updatedAt: string;         // ISO datetime
}
```

Règle métier : `status` passe automatiquement à `"available"` dès que `releaseDate <= aujourd'hui`, calculé à l'affichage (pas besoin de tâche planifiée). L'utilisateur peut aussi forcer manuellement le statut (ex: livre disponible en avance, ou retardé). `purchased` est un champ indépendant : un livre peut être acheté avant même sa sortie officielle (précommande) tout comme après.

Table Dexie unique : `books`, indexée sur `releaseDate` et `publisher`.

## 4. Arborescence des écrans

1. **Écran principal — Liste**
2. **Formulaire — Ajout / Édition d'un livre** (modale ou route dédiée)
3. **Écran Paramètres** (connexion Google Drive, statut de sync, export/import manuel)

Pas de navigation complexe : une bottom bar ou un simple bouton flottant "+" suffit, plus une icône réglages en header.

## 5. Détail des écrans et composants

### 5.1 Écran principal (`/`)

- **Header** : titre de l'app, icône réglages (→ écran Paramètres), indicateur discret de statut de sync (ex: petit point vert/orange/rouge + horodatage dernier export au tap).
- **Liste des livres**, triée par `releaseDate` croissant :
  - Groupée en trois sections : **"À paraître"** (releaseDate future, non acheté), **"Disponibles"** (releaseDate passée, non acheté), et **"Acheté"** en bas de liste, **repliée par défaut** (affiche juste le nombre, ex: "Acheté (12)", tap pour déplier). Un livre marqué acheté bascule dans cette troisième section quel que soit son `releaseDate` — le statut de sortie devient secondaire une fois l'achat effectué.
  - Chaque item : titre, auteur, éditeur, date de sortie formatée (ex: "12 mars 2027"), pas de couverture ni d'image. Un bouton/icône de type case à cocher (cercle) en bordure de card permet de basculer `purchased` en un tap, sans passer par le formulaire d'édition.
  - **Différenciation visuelle des livres achetés** : card en opacité réduite (ex: 50%) et titre barré (`line-through`). La transition (tap sur la case → card qui s'estompe et glisse vers la section "Acheté") est animée en douceur avec Framer Motion pour donner un retour visuel satisfaisant sans être too much.
  - Swipe gauche → supprimer (avec confirmation). Swipe droit ou tap → édition.
- **Barre de recherche / filtre** (repliable) : filtre par éditeur ou recherche texte libre sur titre/auteur.
- **Bouton flottant "+"** : ouvre le formulaire d'ajout.
- **État vide** : message et illustration simple invitant à ajouter un premier livre.

### 5.2 Formulaire Ajout / Édition (`/book/new`, `/book/[id]/edit`, ou modale)

Champs, dans cet ordre :
1. Titre (texte, requis)
2. Auteur (texte, requis)
3. Éditeur (texte, requis, avec autocomplete basé sur les éditeurs déjà saisis localement)
4. Date de sortie (date picker natif, requis)
5. Note (textarea, optionnel)
6. Case à cocher "Déjà acheté" (reflète/modifie `purchased` ; redondant avec le toggle rapide de la liste mais utile pour corriger un oubli en une seule fois)

- Bouton principal "Enregistrer", bouton secondaire "Annuler".
- Validation inline (champs requis non vides, date valide).
- En édition : bouton "Supprimer" accessible (avec confirmation).
- Après enregistrement : déclenche l'export auto vers Drive (voir section 8).

### 5.3 Écran Paramètres (`/settings`)

- **Section Google Drive** :
  - Si non connecté : bouton "Connecter Google Drive" → lance le flow OAuth.
  - Si connecté : email du compte affiché, bouton "Déconnecter", statut de dernière synchronisation (date/heure + succès ou échec).
  - Bouton "Exporter maintenant" (export manuel, toujours disponible en complément de l'auto-export).
  - Bouton "Importer depuis Drive" (restauration si changement d'appareil ou réinstallation) — charge le JSON depuis Drive et remplace/fusionne la base locale (proposer un choix simple : remplacer tout, ou fusionner en ignorant les doublons par `id`).
- **Section Données locales** :
  - Nombre total de livres enregistrés.
  - Bouton "Export JSON local" (téléchargement direct du fichier, sans passer par Drive — filet de sécurité supplémentaire).

## 6. Logique métier

- **Tri** : toujours par `releaseDate` croissant au sein de chaque section.
- **Statut** : calculé à l'affichage via comparaison `releaseDate` / date du jour, sauf override manuel stocké.
- **Filtre éditeur** : liste déroulante générée dynamiquement à partir des éditeurs existants en base locale.
- **Achat** : `purchased` prime sur `status` pour le regroupement visuel — un livre acheté sort des sections "À paraître"/"Disponibles" et rejoint la section "Acheté", quel que soit son `releaseDate`. Toggle possible depuis la liste (icône case à cocher) ou depuis le formulaire d'édition ; `purchasedAt` est renseigné/effacé en conséquence.
- **Pas de notifications push** dans une v1 — non demandé, à ne pas implémenter sauf demande explicite ultérieure.

## 7. Persistance locale (IndexedDB / Dexie)

- Une seule table `books`, CRUD complet en local.
- Toute mutation (create/update/delete) déclenche :
  1. L'écriture immédiate en IndexedDB.
  2. Le déclenchement de l'export debounced vers Drive (section 8).
- Aucune donnée sensible : pas de chiffrement nécessaire côté stockage local.

## 8. Synchronisation Google Drive

### 8.1 Authentification

- Google Identity Services, flow OAuth 2.0 côté client (PKCE), **scope `drive.file` uniquement** (l'app ne voit que les fichiers qu'elle a elle-même créés — pas d'accès au reste du Drive de l'utilisateur).
- Token stocké en mémoire + refresh silencieux via le SDK Google ; ne pas stocker de refresh token en clair dans le localStorage si évitable, privilégier le refresh via le SDK.

### 8.2 Fichier de sync

- Un seul fichier `book-wishlist-export.json` dans le Drive de l'utilisateur (créé au premier export, puis réécrit — pas de multiplication de fichiers).
- Contenu : tableau JSON de tous les objets `Book`, plus un `exportedAt` (timestamp).

### 8.3 Déclencheurs d'export automatique

- À chaque mutation (create/update/delete), avec un **debounce de ~5 secondes** pour grouper les modifications rapprochées.
- Au retour au premier plan de l'app (`visibilitychange` → visible), pour rattraper d'éventuels changements en attente.
- **Important** : pas de tentative de tâche de fond (Background Sync / Periodic Background Sync) — non supportées par iOS Safari, ne pas implémenter de code inutile pour ça.

### 8.4 Gestion des erreurs

- Si l'export échoue (token expiré, pas de connexion) : ne pas bloquer l'utilisateur, juste marquer le statut de sync comme "en attente" ou "échec" (affiché discrètement, voir 5.1), et retenter au prochain déclencheur.
- Le bouton d'export manuel dans les Paramètres reste toujours disponible comme filet de sécurité.

## 9. Configuration PWA

- `manifest.json` : nom, icônes (192x192, 512x512, format PNG), `display: standalone`, couleur de thème cohérente avec le design.
- Service worker minimal (cache des assets statiques pour un chargement rapide) — pas besoin de stratégie offline-first complexe puisque tout est déjà local via IndexedDB.
- Vérifier le comportement d'installation sur iOS Safari (ajout à l'écran d'accueil) en priorité, Android/Chrome en secondaire.

## 10. Guidelines de design

- Rendu volontairement épuré et "léché" : typographie soignée (une police lisible avec un bon contraste des graisses), espacements généreux, pas de surcharge visuelle.
- Mode sombre pris en charge dès le départ (préférence système via `prefers-color-scheme`).
- Animations Framer Motion légères : transition d'apparition des items de liste, transition douce à l'ouverture du formulaire — jamais d'animation qui ralentit la prise en main.
- Pas d'iconographie ni de couleurs criardes ; palette sobre.

## 11. Exclusions explicites (ne pas implémenter)

- Pas d'appel à une API externe de type Google Books / Open Library / ISBN.
- Pas de couvertures de livres, pas d'images.
- Pas de distinction format papier/numérique.
- Pas de notifications push en v1.
- Pas de compte utilisateur / backend applicatif / base de données serveur — tout est local + sync Drive.
- Pas de tâche de fond (Background Sync API) — non supportée sur la cible iOS Safari.

## 12. Instructions générales pour l'agent de code

- Respecter strictement le scope ci-dessus : ne pas ajouter de fonctionnalités non listées (pas de gamification, pas de recommandations, pas de partage social, etc.).
- Code TypeScript strict, composants React fonctionnels, hooks pour la logique Dexie et Drive isolés dans des modules dédiés (`lib/db.ts`, `lib/drive-sync.ts`).
- Prioriser la simplicité et la lisibilité du code plutôt que l'abstraction prématurée — c'est une app mono-utilisateur à usage personnel, pas un produit multi-tenant.
- Tester en priorité le parcours : ajout d'un livre → apparition triée dans la bonne section → export automatique déclenché → statut de sync visible.
- Tester également : toggle "acheté" depuis la liste → card grisée/barrée avec animation → livre déplacé dans la section "Acheté" repliée → export auto déclenché.
