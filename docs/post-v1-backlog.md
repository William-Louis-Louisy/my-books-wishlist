# Post-V1 Backlog

## 1. Rôle de ce document

Ce backlog contient les idées, pistes d'amélioration et évolutions qui **ne sont pas nécessaires pour livrer correctement la V1**.

Il existe pour protéger le périmètre de la V1 sans perdre les bonnes idées qui apparaîtront pendant `V1 Product Finish` et la `Release Candidate Review`.

Les deux documents qui pilotent la V1 restent :

- `docs/v1-product-finish-plan.md`
- `docs/v1-release-candidate-review.md`

Le présent fichier ne doit jamais devenir une troisième roadmap concurrente.

---

## 2. Règle de décision pendant la V1

Pour toute nouvelle idée, poser d'abord cette question :

> Est-ce nécessaire pour mener correctement la vision actuelle de la V1 jusqu'à son niveau de qualité attendu ?

### Si oui

L'idée doit être ajoutée au plan V1 correspondant :

- `V1 Product Finish` si elle concerne la finition produit ;
- `Release Candidate Review` si elle concerne la validation, la résilience, l'accessibilité, la performance, la sécurité ou la qualité de release.

### Si non

Elle est ajoutée ici et **aucun développement ne démarre avant la sortie de `v1.0.0`**, sauf décision explicite de reclassification.

---

## 3. Principes du backlog

- Une entrée dans le backlog n'est **pas une promesse de développement**.
- Le backlog doit rester lisible : mieux vaut quelques idées bien décrites qu'une liste infinie.
- Toute proposition doit expliquer le problème utilisateur qu'elle cherche à résoudre.
- Une solution technique ne doit pas être confondue avec un besoin produit.
- Les évolutions qui remettent en cause l'architecture `local-first` doivent être explicitement identifiées comme telles.
- Les contraintes iOS/PWA doivent être prises en compte avant validation d'une idée.
- Les fonctionnalités ajoutées après V1 devront conserver l'exigence actuelle : TypeScript strict, accessibilité, internationalisation FR/EN, mobile-first et absence d'abstraction inutile.

---

## 4. Statuts utilisés

### `IDEA`

Intuition intéressante, pas encore étudiée sérieusement.

### `TO_EXPLORE`

Le besoin semble pertinent mais nécessite une étude produit et/ou technique avant décision.

### `VALIDATED`

Le besoin et le principe de solution sont jugés suffisamment pertinents pour entrer dans une future roadmap.

### `PARKED`

Idée volontairement mise de côté. Elle peut être réévaluée plus tard mais ne correspond pas actuellement à la direction du produit.

### `REJECTED`

Idée étudiée et explicitement incompatible avec la vision actuelle, sauf changement majeur de produit.

---

## 5. Format recommandé pour une nouvelle entrée

```md
### Nom de l'idée

**Statut :** IDEA | TO_EXPLORE | VALIDATED | PARKED | REJECTED

**Problème utilisateur :**
Décrire le besoin réel, pas seulement la solution imaginée.

**Valeur potentielle :**
Pourquoi cette évolution pourrait améliorer le produit.

**Points à étudier :**
- impact UX ;
- impact technique ;
- compatibilité iOS/PWA ;
- impact local-first / Drive ;
- accessibilité ;
- migration de données éventuelle.

**Décision :**
À remplir lorsqu'une étude ou une décision produit a été menée.
```

---

# 6. Candidats post-V1 déjà identifiés

## 6.1 Rappels de sortie optionnels

**Statut :** `TO_EXPLORE`

### Problème utilisateur

Un utilisateur peut enregistrer un livre plusieurs mois avant sa sortie puis oublier la date lorsqu'elle approche.

### Valeur potentielle

Permettre un rappel proche de la date de sortie renforcerait la fonction première de l'application sans nécessairement transformer My Books Wishlist en outil complexe.

### Points à étudier

- rappel uniquement pour les livres ayant une date suffisamment précise ;
- délai configurable ou règle simple (`J-7`, `J-1`, jour J) ;
- comportement si le livre est déjà marqué comme acheté ;
- UX d'activation volontaire, jamais intrusive ;
- compatibilité réelle avec les notifications Web/PWA sur iOS et Android ;
- nécessité éventuelle d'une infrastructure distante pour garantir des notifications lorsque l'application est fermée ;
- conséquences d'un backend sur l'architecture actuelle.

### Contrainte connue

Le rappel mensuel de sauvegarde prévu pour `V1 Product Finish` est un rappel **dans l'application** et ne doit pas être confondu avec de véritables notifications système de sortie.

---

## 6.2 Statistiques personnelles légères

**Statut :** `IDEA`

### Problème utilisateur

Avec une bibliothèque qui grandit, certaines informations intéressantes deviennent difficiles à percevoir directement dans la timeline.

### Valeur potentielle

Quelques statistiques calculées entièrement localement pourraient enrichir l'expérience sans dépendre d'un service externe.

### Exemples à étudier

- nombre de livres suivis ;
- livres achetés / non achetés ;
- répartition par éditeur ;
- séries les plus suivies ;
- sorties prévues dans les prochains mois ;
- historique annuel des sorties enregistrées.

### Garde-fous

- ne pas gamifier artificiellement l'application ;
- éviter un dashboard lourd ;
- rester utile même avec une petite bibliothèque ;
- ne pas ajouter de tracking externe pour produire ces statistiques.

---

## 6.3 Transfert navigateur ↔ PWA plus fluide

**Statut :** `TO_EXPLORE`

### Problème utilisateur

Le stockage local du site ouvert dans le navigateur et celui de la Web App installée peuvent être distincts. La V1 doit expliquer ce comportement et guider l'utilisateur vers une sauvegarde/restauration avant installation, mais le transfert reste manuel.

### Valeur potentielle

Réduire le nombre d'étapes nécessaires pour passer d'une utilisation navigateur à la PWA installée.

### Points à étudier

- limites réelles des navigateurs et de WebKit concernant le partage d'IndexedDB entre contextes ;
- possibilité d'améliorer le handoff via fichier JSON ;
- possibilité d'utiliser le partage natif de fichier lorsque la plateforme le permet ;
- possibilité d'ouvrir directement un backup dans l'application ;
- UX de restauration simplifiée après installation ;
- sécurité et risque d'écrasement involontaire de la bibliothèque locale.

### Important

La V1 ne doit pas attendre cette évolution. Le Product Finish doit déjà fournir un parcours d'installation sûr et compréhensible avec les outils disponibles aujourd'hui.

---

## 6.4 Import avancé et résolution de conflits

**Statut :** `IDEA`

### Problème utilisateur

Le mode actuel `Fusionner` utilise l'ID comme référence et donne la priorité aux données locales en cas de collision. Ce comportement est simple et robuste, mais il peut devenir limité pour des bibliothèques restaurées depuis plusieurs sources.

### Valeur potentielle

Un import plus riche pourrait donner davantage de contrôle lors de restaurations complexes.

### Pistes à étudier

- aperçu avant import ;
- résumé des ajouts / conflits / entrées ignorées ;
- comparaison entrée par entrée ;
- choix local / sauvegarde distante pour certains conflits ;
- détection de doublons métier au-delà du seul `id` ;
- stratégie prudente pour éviter les faux positifs sur les titres ou séries similaires.

### Garde-fou

Ne pas transformer un filet de sécurité simple en interface de synchronisation complexe sans besoin utilisateur réel.

---

## 6.5 Historique ou journal local des sauvegardes

**Statut :** `IDEA`

### Problème utilisateur

La V1 affiche la date de la dernière sauvegarde Drive réussie mais ne conserve pas un historique lisible des opérations.

### Valeur potentielle

Un historique local minimal pourrait rassurer l'utilisateur lorsqu'il effectue régulièrement des exports/imports.

### Points à étudier

- conserver seulement quelques événements récents ;
- ne jamais stocker de token ou d'information sensible ;
- distinguer export Drive, import Drive et sauvegarde locale ;
- utilité réelle comparée à la complexité UX ajoutée.

---

## 6.6 Gestion plus explicite des mises à jour PWA

**Statut :** `IDEA`

### Problème utilisateur

Un service worker peut conserver une version précédente de certaines ressources jusqu'à l'activation d'une nouvelle version.

### Valeur potentielle

Donner davantage de contrôle ou de visibilité lorsqu'une nouvelle version de l'application est disponible.

### Pistes à étudier

- message discret `Une nouvelle version est disponible` ;
- action `Mettre à jour` / `Recharger` ;
- stratégie de versionnement du cache ;
- éviter les reloads forcés pendant une saisie ou un import ;
- intérêt réel après observation du comportement de la V1 en production.

---

## 6.7 Web Share / partage d'une sauvegarde locale

**Statut :** `IDEA`

### Problème utilisateur

Le téléchargement d'un fichier JSON est fiable mais peut être moins naturel sur mobile qu'un partage vers Fichiers, AirDrop ou une autre application.

### Valeur potentielle

Permettre d'envoyer ou stocker une sauvegarde locale via le panneau de partage natif lorsque la plateforme le supporte.

### Points à étudier

- support `navigator.share` avec fichiers ;
- fallback téléchargement existant obligatoire ;
- comportement iOS/Android ;
- accessibilité ;
- type MIME et nommage des fichiers.

---

# 7. Évolutions nécessitant un changement d'architecture

Ces idées ne sont pas interdites, mais elles changeraient profondément le caractère actuel du projet. Elles doivent donc faire l'objet d'une décision produit et architecture spécifique avant toute implémentation.

## 7.1 Synchronisation cloud automatique multi-appareils

**Statut :** `PARKED`

### Ce que cela impliquerait probablement

- backend applicatif ou service cloud équivalent ;
- authentification durable ;
- gestion des conflits ;
- stratégie offline/online ;
- sécurité et confidentialité des données ;
- migration de l'architecture Drive manuelle actuelle ;
- gestion de comptes ou d'identités.

### Position actuelle

La V1 assume volontairement une application local-first avec Google Drive utilisé uniquement comme sauvegarde/restauration manuelle.

---

## 7.2 Backend applicatif et comptes utilisateurs

**Statut :** `PARKED`

### Valeur potentielle

Pourrait permettre sync multi-appareils, notifications distantes et nouvelles fonctions collaboratives.

### Coût produit

Cela modifierait fortement :

- la simplicité du produit ;
- la confidentialité ;
- les coûts d'infrastructure ;
- l'authentification ;
- la sécurité ;
- la maintenance ;
- les obligations liées aux données utilisateurs.

Aucun backend ne doit être ajouté uniquement pour résoudre un problème mineur pouvant rester local.

---

## 7.3 OAuth serveur / refresh token durable pour Google Drive

**Statut :** `PARKED`

### Contexte

Le projet utilise actuellement Google Identity Services côté navigateur et conserve les tokens uniquement en mémoire. Ce choix est cohérent avec l'absence de backend et avec le modèle de sauvegarde manuelle.

### À réévaluer uniquement si

- une vraie synchronisation automatique devient un besoin validé ;
- un backend est accepté comme évolution d'architecture ;
- les bénéfices justifient les coûts et responsabilités supplémentaires.

---

# 8. Idées volontairement hors direction actuelle

Cette section sert à éviter de rouvrir régulièrement des décisions déjà prises sans nouveau besoin utilisateur.

## 8.1 Catalogue externe Google Books / Open Library / ISBN

**Statut :** `PARKED`

La V1 est volontairement un outil personnel de suivi et non un catalogue de livres. Une intégration externe ne doit être reconsidérée que si la saisie manuelle devient un problème utilisateur démontré.

---

## 8.2 Couvertures et images de livres

**Statut :** `PARKED`

Le langage visuel actuel repose volontairement sur la typographie, la timeline et les métadonnées. Ajouter des couvertures modifierait fortement la densité et l'identité de l'interface.

---

## 8.3 Recommandations de lecture

**Statut :** `PARKED`

Le produit n'a actuellement ni vocation de découverte algorithmique ni besoin de profilage utilisateur.

---

## 8.4 Fonctions sociales ou partage public de bibliothèque

**Statut :** `PARKED`

La bibliothèque est aujourd'hui personnelle, locale et privée. Un modèle social impliquerait un changement important de positionnement et probablement d'architecture.

---

## 8.5 Gamification

**Statut :** `REJECTED`

Points, badges, streaks ou mécaniques de récompense artificielles ne correspondent pas à la vision actuelle d'un outil calme, utilitaire et soigné.

---

# 9. Idées à capturer pendant Product Finish et RC

Pendant les deux phases V1, lorsqu'une idée intéressante apparaît mais ne bloque pas la sortie :

1. ne pas interrompre le chantier courant ;
2. créer une courte entrée dans ce document ;
3. lui attribuer un statut initial ;
4. noter le problème utilisateur observé ;
5. revenir dessus seulement après la sortie V1.

Les bugs ne vont **pas** dans ce backlog : ils sont traités dans Product Finish ou dans la RC selon leur nature et leur sévérité.

---

# 10. Revue du backlog après V1.0.0

Après la release V1 :

1. observer l'usage réel et les retours ;
2. supprimer les idées devenues inutiles ;
3. regrouper les propositions qui répondent au même problème ;
4. étudier les entrées `TO_EXPLORE` ;
5. ne promouvoir en roadmap V2 que les évolutions avec une valeur utilisateur claire ;
6. conserver volontairement les autres en `IDEA`, `PARKED` ou `REJECTED`.

La future roadmap V2 devra être créée séparément. Ce backlog restera un réservoir d'idées, pas un planning.