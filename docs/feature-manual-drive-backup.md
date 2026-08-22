# Feature — Google Drive en sauvegarde manuelle

## Contexte

L'application est volontairement **sans backend**. Google Drive est intégré via Google Identity Services (GIS) avec le token model et le scope restreint `https://www.googleapis.com/auth/drive.file`.

Dans ce modèle, l'access token est **short-lived** et reste uniquement en mémoire. Aucun refresh token n'est conservé par l'application. Il n'est donc pas cohérent de présenter Drive comme une connexion persistante ou de tenter une synchronisation silencieuse durable après expiration du token.

## Décision produit

Google Drive n'est plus une synchronisation automatique. Il devient un mécanisme explicite de **backup / restore**.

IndexedDB reste la source de vérité de la bibliothèque.

Les seules actions distantes possibles sont :

- **Exporter vers Google Drive** ;
- **Importer depuis Google Drive**.

Ces actions sont déclenchées exclusivement depuis **Réglages → Google Drive** par un geste utilisateur.

## Ce qui a été supprimé

L'ancienne implémentation comportait plusieurs éléments donnant l'impression d'une synchronisation persistante :

- `queueDriveExport()` après chaque création, modification, suppression ou changement d'état acheté ;
- debounce d'environ 5 secondes avant l'export ;
- retry lors du retour de visibilité de l'application ;
- état persistant `connected / pending / synced / error` ;
- indicateur de synchronisation dans le header ;
- connexion/déconnexion Drive séparée de l'action de sauvegarde ;
- export automatique juste après la connexion ;
- export automatique après une restauration Drive.

Tous ces mécanismes ont été supprimés.

## Cycle d'authentification

L'application ne persiste aucun access token Google.

Lorsqu'un utilisateur clique sur Exporter ou Importer :

1. si un access token encore valide existe en mémoire, il est réutilisé ;
2. sinon, Google Identity Services est invoqué depuis cette action utilisateur ;
3. GIS affiche les écrans de compte/consentement uniquement lorsqu'ils sont nécessaires ;
4. le token reçu reste en mémoire jusqu'à son expiration ou au rechargement de la page.

Une réponse HTTP `401` invalide le token en mémoire et provoque une nouvelle demande d'autorisation dans le contexte de l'action manuelle en cours.

Aucun token ni refresh token n'est écrit dans `localStorage`, IndexedDB ou un fichier de sauvegarde.

## Identité du fichier Drive

L'ID de `book-wishlist-export.json` n'est plus persisté entre les sessions. Il est mémorisé uniquement pendant la session JavaScript courante.

Au premier export/import après un chargement de page, l'application recherche donc le fichier dans le compte réellement autorisé à ce moment-là. Cela évite de conserver un ID appartenant à un ancien compte Google si l'utilisateur change de compte entre deux sessions.

## Métadonnée persistée

La seule métadonnée Drive conservée dans `localStorage` est l'horodatage de la dernière sauvegarde Drive réussie, uniquement pour l'affichage dans les réglages.

L'ancien horodatage contenu dans `book-wishlist:sync-status` est migré au premier passage vers la nouvelle clé afin de ne pas perdre l'information visible pour l'utilisateur.

Les anciennes clés `drive-connected`, `drive-email`, `drive-file-id` et `sync-status` sont supprimées lors de cette migration et ne participent plus au comportement de l'application.

## Export manuel

`exportBooksToDrive()` :

1. s'assure que l'intégration Google est configurée ;
2. obtient un token depuis l'action utilisateur si nécessaire ;
3. lit la bibliothèque depuis IndexedDB ;
4. sérialise le backup avec `serializeBookBackup` ;
5. recherche puis met à jour le fichier Drive existant, ou le crée ;
6. enregistre localement la date de réussite.

Aucune mutation locale ne lance cette fonction automatiquement.

## Import manuel

`importBooksFromDrive(mode)` :

1. obtient l'autorisation Google si nécessaire ;
2. recherche et récupère le fichier Drive ;
3. le valide entièrement avec `parseBookBackup` ;
4. applique `replace` ou `merge` via `applyBookImport`.

L'import ne déclenche **aucun export Drive après écriture locale**.

## Interface

La section Google Drive des réglages n'affiche plus un état « connecté » ou « synchronisé ».

Elle affiche uniquement :

- une explication du fonctionnement manuel ;
- la date de la dernière sauvegarde réussie ;
- `Exporter vers Google Drive` ;
- `Importer depuis Google Drive` ;
- le choix `Remplacer` / `Fusionner` lors d'une restauration.

L'indicateur de synchronisation auparavant visible dans le header a été supprimé.

## Conséquence assumée

Avec l'architecture actuelle 100 % client, une sauvegarde Drive ne peut pas être garantie automatiquement en arrière-plan après chaque changement.

Ce compromis est volontaire : il privilégie une architecture simple, honnête sur ses capacités, sans backend et sans stockage sensible de credentials. Si une synchronisation distante automatique redevient un besoin produit, elle devra être traitée comme une évolution d'architecture impliquant un backend et un modèle OAuth adapté, plutôt que réintroduite comme un comportement implicite côté navigateur.
