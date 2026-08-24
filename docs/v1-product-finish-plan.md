# V1 Product Finish — plan de finition produit

## 1. Intention

Cette phase intervient **avant** la Release Candidate Review. Son objectif n'est pas d'ajouter de nouvelles fonctionnalités métier, mais de mener la V1 jusqu'au niveau de finition attendu d'un produit réellement prêt à être découvert, installé, utilisé, compris, partagé et récupéré en cas de problème.

La V1 doit donner le sentiment que l'expérience a été pensée de bout en bout : premier contact, installation PWA, compréhension du stockage local, sauvegarde, feedback utilisateur, SEO/partage, aide, lancement, erreurs et résilience.

## 2. Principes directeurs

- Ne pas élargir le périmètre métier de l'application.
- Conserver l'architecture **local-first**, sans backend applicatif.
- IndexedDB reste la source de vérité locale.
- Google Drive reste une sauvegarde/restauration **strictement manuelle**.
- Préserver l'expérience mobile-first, iOS Safari/PWA en priorité puis Android/Chrome.
- Respecter `prefers-reduced-motion`, l'accessibilité clavier et les lecteurs d'écran.
- Avancer par petites PR focalisées, chacune testable et réversible.
- Ne pas introduire d'abstraction ou de dépendance lourde si une solution simple suffit.
- Toute nouvelle surface utilisateur doit être disponible en français et en anglais.

## 3. Pré-requis immédiat — hygiène avant chantier

Avant de commencer les grands lots, corriger les petites régressions déjà identifiées sur `main`.

### P0 — traduction anglaise de l'import local

Vérifier et restaurer la cohérence de `Settings.localImportSuccess` en anglais : le pluriel doit conserver le préfixe `Import complete:` comme les variantes `0` et `1`.

### Critère de sortie

- `typecheck`, tests, lint et build verts.
- Aucun correctif indépendant connu laissé en attente avant les lots Product Finish.

---

# 4. Lot A — Installation & expérience PWA

## Objectif

Rendre l'installabilité de l'application **découvrable et compréhensible**, surtout parce que le stockage de la version navigateur et celui de la Web App installée peuvent être distincts.

## A1. Détection du contexte d'exécution

Mettre en place un helper centralisé capable de distinguer au minimum :

- application ouverte comme site web classique ;
- application ouverte en mode standalone/installé ;
- environnement compatible avec un prompt d'installation natif ;
- environnement iOS/iPadOS nécessitant un guide d'installation manuel.

Éviter de disséminer des tests `navigator`/`matchMedia` partout dans l'UI.

## A2. CTA d'installation visible mais non intrusif

Créer une surface cohérente avec le design system, visible uniquement lorsqu'elle est pertinente.

Comportement attendu :

- ne jamais apparaître dans la PWA déjà installée ;
- utiliser le prompt natif d'installation lorsqu'il est exposé par le navigateur ;
- proposer un guide spécifique sur iOS lorsque le prompt natif n'est pas disponible ;
- permettre de fermer/remettre à plus tard le message ;
- mémoriser ce choix localement pour ne pas harceler l'utilisateur ;
- rester accessible depuis le Guide/Aide même après avoir été masqué.

## A3. Protection des données avant installation

Le message d'installation doit expliquer clairement que les données sont locales à l'environnement utilisé.

Si la bibliothèque contient déjà des livres dans le navigateur :

- signaler le risque de ne pas retrouver automatiquement ces données dans l'application installée ;
- proposer un chemin de sauvegarde simple avant installation ;
- orienter vers export JSON local et/ou sauvegarde Google Drive ;
- documenter le chemin de restauration après installation.

Le wording doit être rassurant et factuel, sans laisser entendre qu'une synchronisation automatique existe.

## A4. Manifest PWA — passe de finition

Auditer et compléter le manifest :

- `name` / `short_name` ;
- `id` ;
- `start_url` ;
- `scope` ;
- `display` ;
- `background_color` / `theme_color` ;
- icônes classiques ;
- icône `maskable` si pertinente ;
- Apple touch icon ;
- description ;
- éventuels screenshots si cela améliore l'expérience d'installation sur les plateformes qui les exploitent.

Vérifier visuellement les icônes sur fond clair/sombre et dans les masques Android.

## A5. Mise à jour de la PWA et service worker

Revoir le comportement du service worker :

- stratégie de cache explicite et minimale ;
- invalidation propre lors d'un nouveau déploiement ;
- pas de version obsolète bloquée durablement ;
- comportement offline cohérent ;
- aucune mise en cache hasardeuse des données utilisateur ;
- aucune fausse promesse d'offline complet sur les opérations réseau Google Drive.

Étudier un feedback discret lorsqu'une nouvelle version est disponible, uniquement si cela apporte une vraie valeur sans complexifier la V1.

## Definition of Done — Lot A

- Installation découvrable sur Android/Chromium quand le navigateur le permet.
- Instructions iOS claires et testées sur appareil réel.
- Aucun CTA d'installation dans la PWA installée.
- Parcours de sauvegarde avant installation compréhensible.
- Manifest validé et icônes vérifiées.
- Service worker testé après au moins deux déploiements successifs.
- Installation, fermeture, relance et mode offline de base testés sur iOS et Android.

---

# 5. Lot B — SEO, partage et confiance

## Objectif

Faire en sorte que l'application soit correctement comprise par les moteurs de recherche et qu'un lien partagé produise une présentation soignée.

## B1. Metadata globale

Compléter la metadata Next.js :

- `metadataBase` ;
- titre et template de titre ;
- description éditoriale claire ;
- canonical ;
- application name ;
- Open Graph ;
- Twitter Card ;
- icônes/favicons cohérents ;
- locale(s) exposées proprement.

## B2. Image de partage

Créer une image Open Graph/Twitter dédiée, cohérente avec l'identité visuelle :

- logo/nom de l'application ;
- promesse produit courte ;
- palette du design system ;
- lisibilité sur mobile ;
- aucun contenu utilisateur.

## B3. Robots et sitemap

Ajouter :

- `app/robots.ts` ;
- `app/sitemap.ts`.

Indexer seulement les pages publiques pertinentes.

Les routes purement applicatives/personnelles comme les formulaires d'ajout/édition et les réglages ne doivent pas devenir des pages SEO artificielles.

## B4. Données structurées

Évaluer puis ajouter, si pertinent, un JSON-LD simple de type `WebApplication`/`SoftwareApplication`, sans surenchère ni données trompeuses.

## B5. Page Confidentialité

Créer une page publique courte, claire et lisible expliquant :

- stockage local IndexedDB ;
- absence de backend applicatif ;
- absence de collecte de bibliothèque par nos serveurs ;
- Google Drive utilisé uniquement à la demande ;
- nature des permissions Drive ;
- conséquences d'une suppression des données du navigateur ;
- lien vers le guide de sauvegarde/restauration.

## Definition of Done — Lot B

- Un lien partagé génère une carte propre avec titre, description et image.
- `robots.txt` et sitemap sont accessibles et cohérents.
- Les routes privées/applicatives ne sont pas inutilement indexées.
- Les métadonnées sont valides en production.
- La page Confidentialité correspond exactement au comportement réel du code.

---

# 6. Lot C — Guide d'usage / Q&A

## Objectif

Fournir un point d'entrée unique pour comprendre l'application sans transformer l'interface principale en tutoriel permanent.

## C1. Page Guide & aide

Créer une page publique ou semi-publique, accessible au minimum depuis les réglages.

Contenu V1 recommandé :

1. À quoi sert My Books Wishlist ?
2. Ajouter, modifier et supprimer un livre.
3. Comprendre les précisions de date : année, mois, date exacte.
4. Comprendre les statuts et la démarcation des sorties passées.
5. Marquer un livre comme acheté.
6. Recherche, filtre éditeur et organisation par mois/statut.
7. Gestes de swipe et alternatives accessibles.
8. Installer l'application sur iPhone/iPad.
9. Installer l'application sur Android/desktop compatible.
10. Pourquoi les données du navigateur et de la PWA peuvent être séparées.
11. Export/import JSON local.
12. Sauvegarder/restaurer via Google Drive.
13. Que se passe-t-il hors connexion ?
14. Que faire en cas de problème ou de données manquantes ?

## C2. FAQ concise

Inclure quelques réponses directes :

- « Où sont stockées mes données ? »
- « Faut-il un compte ? »
- « Google Drive synchronise-t-il automatiquement ? »
- « Pourquoi dois-je parfois autoriser Google à nouveau ? »
- « Puis-je transférer ma bibliothèque vers un autre appareil ? »
- « Puis-je utiliser l'application sans Drive ? »

## C3. Cohérence avec la documentation technique

Le guide utilisateur devient la source de vérité côté produit ; les docs techniques restent destinées au développement.

Toute divergence découverte entre guide, README et comportement réel doit être corrigée avant la RC.

## Definition of Done — Lot C

- Guide disponible FR/EN.
- Accessible depuis les réglages.
- Installation et sauvegarde expliquées sans ambiguïté.
- Aucun jargon technique inutile.
- Toutes les instructions ont été exécutées réellement sur iOS et Android avant validation.

---

# 7. Lot D — Feedback utilisateur & rappel de sauvegarde

## Objectif

Rendre les actions importantes compréhensibles, rassurantes et récupérables.

## D1. Feedback Google Drive plus précis

Remplacer le message générique unique par des catégories utiles, sans exposer de détails techniques :

- sauvegarde réussie ;
- restauration réussie ;
- autorisation annulée/refusée ;
- absence de connexion ;
- fichier de sauvegarde introuvable ;
- fichier invalide/incompatible ;
- erreur temporaire Google Drive ;
- fallback générique seulement si nécessaire.

Conserver les zones `role="status"`/annonces accessibles.

## D2. Feedback global cohérent

Décider d'un pattern unique pour :

- succès ;
- erreur ;
- opération en cours ;
- action réversible/non réversible.

Évaluer un composant toast léger uniquement si cela améliore réellement les actions transverses. Éviter les notifications simultanées ou décoratives.

## D3. Rappel mensuel local de sauvegarde

Ajouter un rappel **dans l'application**, sans notification push et sans backend.

Règle proposée :

- calcul au lancement/reprise à partir de `lastDriveBackupAt` ;
- rappel après environ 30 jours sans sauvegarde Drive réussie ;
- uniquement si Drive est configuré et si la bibliothèque contient des données ;
- CTA `Sauvegarder maintenant` ;
- CTA `Plus tard` ;
- délai de snooze persistant pour éviter une répétition à chaque ouverture ;
- disparition après une sauvegarde réussie.

Ne pas appeler cela « sauvegarde automatique » ni suggérer qu'une tâche planifiée s'exécute lorsque l'application est fermée.

## D4. États réseau

Pour les actions Drive :

- détecter l'absence de connexion quand cela est possible ;
- ne pas bloquer les fonctions locales ;
- expliquer que la bibliothèque locale reste utilisable ;
- permettre de retenter l'action réseau.

## Definition of Done — Lot D

- Les erreurs Drive les plus probables ont un message utilisateur utile.
- Les succès importants sont visibles sans être intrusifs.
- Le rappel de sauvegarde est testable en simulant une date ancienne.
- Le rappel ne spamme pas l'utilisateur.
- Aucune logique de pseudo-scheduling de fond n'est introduite.

---

# 8. Lot E — Launch experience / splash

## Objectif

Transformer l'état de démarrage en expérience de marque, sans ralentir artificiellement l'application.

## E1. Splash/boot visuel

Créer un état de lancement très court et élégant :

- palette adaptée au thème ;
- symbole/logo de l'application ;
- animation signature légère ;
- durée pilotée par le chargement réel, pas par un timer marketing ;
- transition douce vers la bibliothèque ;
- fallback simple avec `prefers-reduced-motion`.

## E2. Intégration avec le chargement IndexedDB

Le splash doit masquer intelligemment l'ouverture initiale de la base, mais :

- ne pas retarder l'affichage si les données sont déjà prêtes ;
- ne pas cacher une erreur réelle ;
- basculer vers un état d'erreur dédié si IndexedDB ne peut pas être ouvert.

## E3. Cohérence PWA

Vérifier la transition entre le splash généré par l'OS et le splash applicatif pour éviter :

- double flash ;
- changement brutal de couleur ;
- logo affiché deux fois de manière maladroite ;
- flash clair en dark mode.

## Definition of Done — Lot E

- Lancement fluide sur Safari iOS, PWA iOS, Chrome Android et desktop.
- Aucun délai artificiel perceptible.
- `prefers-reduced-motion` respecté.
- Pas de flash de thème incorrect.

---

# 9. Lot F — Résilience et écrans exceptionnels

## Objectif

Faire en sorte que les chemins d'erreur soient aussi soignés que le happy path.

## F1. `not-found.tsx`

Créer une 404 cohérente :

- ton visuel de l'application ;
- explication courte ;
- retour clair vers la bibliothèque ;
- aucun jargon Next.js.

## F2. `error.tsx`

Créer un error boundary de route :

- message compréhensible ;
- bouton `Réessayer` ;
- retour possible à l'accueil ;
- pas d'exposition de stack trace en production.

## F3. `global-error.tsx`

Prévoir un filet de sécurité minimal si le layout principal échoue.

Il doit être autonome, robuste et rester lisible même si les providers applicatifs ne fonctionnent plus.

## F4. Erreurs IndexedDB

Définir un état dédié si la base locale est inaccessible :

- expliquer que la bibliothèque n'a pas pu être ouverte ;
- proposer `Réessayer` ;
- ne jamais proposer automatiquement de vider la base ;
- documenter les options de récupération dans le Guide.

## F5. Offline

Ajouter un comportement cohérent pour les cas réseau :

- l'application locale reste utilisable ;
- les actions Drive signalent qu'elles nécessitent une connexion ;
- une navigation offline déjà mise en cache ne doit pas produire une page blanche.

## Definition of Done — Lot F

- 404 testée.
- Error boundary testée avec une erreur volontaire.
- Global error testé en développement/staging.
- IndexedDB indisponible simulée.
- Offline simulé sur PWA installée.
- Tous les écrans FR/EN et compatibles dark mode.

---

# 10. Ordre de livraison recommandé

Chaque étape doit être une PR indépendante autant que possible.

1. `fix/i18n-local-import-success`
2. `feat/pwa-install-experience`
3. `chore/pwa-manifest-and-service-worker`
4. `feat/seo-social-metadata`
5. `feat/guide-and-privacy`
6. `feat/drive-feedback`
7. `feat/backup-reminder`
8. `feat/launch-experience`
9. `feat/error-and-offline-states`
10. `docs/align-v1-product-finish`

Les noms exacts peuvent évoluer ; le principe important est de garder les PR petites et focalisées.

# 11. Ce qui reste explicitement hors scope V1 Product Finish

Ne pas profiter de cette phase pour ajouter :

- API Google Books/Open Library/ISBN ;
- couvertures de livres ;
- compte utilisateur ;
- backend ;
- synchronisation Drive automatique ;
- notifications push ;
- recommandations ;
- partage social de bibliothèques ;
- statistiques/gamification ;
- nouvelles langues ;
- fonctionnalités métier non déjà présentes.

Toute idée de ce type va dans un backlog post-V1.

# 12. Gate de sortie vers la Release Candidate Review

La phase Product Finish est terminée lorsque :

- tous les lots A à F sont soit livrés, soit explicitement écartés avec justification documentée ;
- aucune régression connue P0/P1 n'est ouverte ;
- les parcours installation → sauvegarde → restauration sont compréhensibles ;
- les métadonnées SEO/sociales sont présentes en production ;
- le Guide et la page Confidentialité reflètent le comportement réel ;
- les principaux états d'erreur existent ;
- le lancement est visuellement propre ;
- CI verte sur `main` ;
- README et documentation de référence sont alignés.

À ce moment seulement, la V1 entre en **Release Candidate Review**.
