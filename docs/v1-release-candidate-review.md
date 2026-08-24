# V1 Release Candidate Review — plan de validation finale

## 1. Intention

La Release Candidate Review commence **uniquement après** la fin de la phase `V1 Product Finish`.

Son but n'est plus d'améliorer le produit par ajout de fonctionnalités, mais de décider si l'état actuel peut être publié comme **V1.0.0** avec un niveau de confiance élevé.

La question centrale est simple :

> Si un utilisateur découvre aujourd'hui l'application, l'installe, y confie sa bibliothèque, l'utilise plusieurs semaines, change d'appareil, rencontre une erreur ou restaure une sauvegarde, avons-nous suffisamment confiance pour appeler cela une V1 ?

## 2. Règles de la phase RC

- **Feature freeze** : aucune nouvelle fonctionnalité métier.
- Seuls les correctifs de bugs, accessibilité, performance, sécurité, résilience, documentation et polish bloquant la release sont acceptés.
- Toute nouvelle idée produit va dans le backlog post-V1.
- Les PR restent petites et thématiques.
- Tout bug découvert reçoit une sévérité explicite : P0, P1, P2 ou P3.
- Un P0 ou P1 ouvert bloque la sortie V1.
- Un P2 doit être corrigé ou explicitement accepté/documenté.
- Un P3 peut être reporté si son impact est réellement mineur.

## 3. Livrables attendus

À la fin de la review, nous devons disposer de :

- une matrice de QA remplie ;
- les tests automatisés critiques ;
- une liste de bugs fermée ou explicitement acceptée ;
- une validation PWA/offline/install ;
- une validation Google Drive ;
- une validation accessibilité ;
- une validation SEO/social ;
- un audit code/architecture ;
- une documentation alignée ;
- un changelog/release note V1 ;
- un tag/version `v1.0.0` uniquement après Go final.

---

# 4. Gate 0 — santé de `main`

Avant toute QA manuelle :

- `npm ci` fonctionne sur environnement propre ;
- `npm run typecheck` vert ;
- `npm run test` vert ;
- `npm run lint` vert ;
- `npm run build` vert ;
- déploiement preview/production sans erreur ;
- aucune erreur console connue au premier chargement ;
- aucune warning applicative récurrente non comprise.

Vérifier également la cohérence Node/npm avec la CI et le lockfile.

## Critère de passage

Aucune investigation manuelle ne commence sur une base CI instable.

---

# 5. QA fonctionnelle — parcours cœur

## 5.1 Bibliothèque vide

Tester :

- premier lancement ;
- état vide ;
- CTA d'ajout ;
- accès réglages ;
- accès Guide/Aide ;
- comportement installation PWA.

## 5.2 Ajouter un livre

Couvrir toutes les variantes métier :

- titre seul ;
- série + tome sans titre ;
- auteur/éditeur/note optionnels ;
- date année ;
- date mois ;
- date exacte ;
- acheté dès la création ;
- validation des cas invalides ;
- navigation retour/annulation ;
- autocomplete auteur/série/éditeur.

## 5.3 Modifier un livre

Tester :

- passage année → mois → date exacte ;
- passage date exacte → mois/année ;
- ajout/suppression de métadonnées optionnelles ;
- changement acheté/non acheté ;
- rendu immédiat dans la timeline ;
- persistance après reload.

## 5.4 Supprimer un livre

Tester :

- swipe partiel → action révélée ;
- swipe complet → confirmation ;
- bouton accessible sans swipe ;
- annulation de confirmation ;
- suppression confirmée ;
- fermeture par clic extérieur/Échap si applicable ;
- persistance après reload.

## 5.5 Timeline par mois

Tester :

- mois courant ;
- mois futurs ;
- mois passés de l'année courante ;
- démarcation `Sorties passées` ;
- absence de démarcation quand inutile ;
- année seule / mois non précisé ;
- archives annuelles ;
- collapse/expand des mois ;
- collapse/expand des archives ;
- compteurs ;
- ordre exact des groupes et livres.

## 5.6 Organisation par statut

Tester :

- à paraître ;
- indéterminé ;
- disponibles ;
- livre acheté qui conserve son groupe de sortie ;
- ordre chronologique attendu dans chaque groupe.

## 5.7 Recherche et filtres

Tester :

- titre ;
- auteur ;
- série ;
- tome ;
- éditeur ;
- casse/accents ;
- combinaison recherche + éditeur ;
- aucun résultat ;
- ouverture forcée des groupes contenant un résultat ;
- reset des filtres.

## 5.8 État acheté

Tester :

- bookmark ;
- animation ;
- libellé `Acheté/Purchased` ;
- changement de fond/opacité/bordure/date ;
- état optimiste ;
- retour arrière si la persistance échoue ;
- persistance après reload.

---

# 6. QA i18n

Tester toute l'application en français puis en anglais.

Vérifier :

- aucune clé brute affichée ;
- aucun texte français restant en anglais et inversement ;
- pluriels `0/1/n` ;
- formats de date ;
- mois ;
- aria-labels ;
- erreurs ;
- guide ;
- confidentialité ;
- PWA install prompts/guides ;
- métadonnées visibles quand pertinent ;
- strings longues qui ne cassent pas les layouts.

Effectuer un passage spécifique sur les textes anglais pour éliminer les traductions littérales maladroites.

---

# 7. Matrice appareils / navigateurs

## Priorité A — indispensable

### iPhone / iOS

- Safari web classique ;
- PWA installée depuis l'écran d'accueil ;
- thème clair ;
- thème sombre ;
- portrait ;
- clavier ouvert sur formulaires ;
- date/month pickers ;
- swipe ;
- installation guidée ;
- relance après fermeture complète.

### Android

- Chrome web ;
- PWA installée ;
- prompt d'installation natif si disponible ;
- date/month pickers ;
- swipe ;
- mode offline ;
- thème clair/sombre.

## Priorité B — desktop

- Chrome/Chromium ;
- Firefox ;
- Safari macOS si disponible ;
- navigation clavier complète ;
- saisie segmentée date/mois ;
- responsive étroit/large.

## À documenter

Pour chaque environnement :

- version OS ;
- version navigateur ;
- résultat ;
- bug éventuel ;
- capture/vidéo si le bug est visuel.

---

# 8. PWA / install / offline review

## 8.1 Installation

Vérifier :

- CTA visible uniquement lorsque pertinent ;
- prompt natif quand supporté ;
- instructions iOS correctes ;
- dismiss/snooze ;
- standalone détecté ;
- aucun CTA résiduel une fois installé.

## 8.2 Données navigateur vs PWA

Tester un vrai parcours :

1. créer plusieurs livres dans le navigateur ;
2. voir l'avertissement avant installation ;
3. exporter/sauvegarder ;
4. installer la PWA ;
5. constater l'état de la DB ;
6. restaurer les données ;
7. vérifier l'intégrité complète.

Le parcours doit être compréhensible sans connaissance technique.

## 8.3 Service worker

Tester :

- première installation ;
- navigation online ;
- navigation offline ;
- nouveau déploiement ;
- reprise de l'app avec ancienne version en cache ;
- invalidation du cache ;
- absence de boucle de reload ;
- absence de page blanche.

## 8.4 Manifest

Auditer avec les outils navigateur disponibles et vérifier réellement :

- icônes ;
- maskable ;
- nom ;
- couleurs ;
- standalone ;
- screenshots éventuels.

---

# 9. Google Drive review

C'est l'intégration externe critique de la V1.

## 9.1 Configuration

Tester :

- Drive non configuré ;
- client ID invalide ;
- environnement local autorisé ;
- production autorisée.

## 9.2 Authentification

Tester :

- première autorisation ;
- autorisation refusée/fermée ;
- token encore valide ;
- reload complet → nouveau flow si nécessaire ;
- 401 → retry prévu par le code ;
- absence de persistance de token sensible.

## 9.3 Export

Tester :

- première sauvegarde ;
- sauvegarde suivante ;
- absence de duplication indésirable ;
- timestamp de dernière sauvegarde ;
- feedback utilisateur ;
- bibliothèque vide si autorisé ;
- offline ;
- erreur API.

## 9.4 Import

Tester :

- Replace ;
- Merge ;
- doublons d'ID ;
- fichier Drive absent ;
- JSON invalide ;
- V1 legacy ;
- V2 ;
- future version non supportée ;
- aucune mutation partielle si validation échoue.

## 9.5 Scénario nouvel appareil

Effectuer un test de bout en bout sur un autre navigateur/profil/appareil :

1. sauvegarde sur appareil A ;
2. application vierge sur appareil B ;
3. autorisation Google ;
4. import ;
5. comparaison des livres et champs ;
6. nouvelle sauvegarde depuis B ;
7. vérification qu'aucune incohérence n'est créée.

---

# 10. Sauvegarde JSON locale review

Tester :

- export local ;
- nom de fichier ;
- structure V2 ;
- import du même fichier ;
- Replace ;
- Merge ;
- ancien tableau brut ;
- ancienne enveloppe ;
- anciens champs `status`/`statusOverride` ;
- date partielle ;
- fichier corrompu ;
- fichier texte renommé `.json` ;
- future version rejetée ;
- bibliothèque importante en volume raisonnable.

Comparer le résultat final avec l'original, pas seulement le compteur.

---

# 11. Accessibilité review

## 11.1 Clavier

Tout le produit doit être utilisable sans souris :

- header ;
- filtres ;
- formulaire ;
- autocomplete ;
- bookmark ;
- swipe alternatives ;
- collapse/expand ;
- dialogs ;
- settings ;
- guide ;
- installation ;
- erreurs.

Vérifier l'ordre de tabulation et la visibilité du focus.

## 11.2 Lecteurs d'écran

Au minimum :

- VoiceOver iOS ;
- un lecteur d'écran desktop ou Android si disponible.

Vérifier :

- titres de pages ;
- headings ;
- labels ;
- états `aria-expanded` ;
- `aria-pressed` ;
- dialogs ;
- messages `role=status` ;
- erreurs de formulaire ;
- éléments purement décoratifs correctement masqués.

## 11.3 Contrastes

Contrôler light/dark :

- texte principal ;
- texte muted ;
- brass ;
- cloth ;
- boutons ;
- focus ;
- états disabled ;
- erreurs/succès.

## 11.4 Motion

Avec `prefers-reduced-motion` :

- bookmark ;
- purchased label ;
- swipe settle ;
- splash ;
- transitions de liste ;
- dialogs ;
- toute nouvelle animation Product Finish.

Aucune interaction ne doit dépendre d'une animation pour être comprise.

---

# 12. SEO / partage review

En production, vérifier :

- `<title>` ;
- description ;
- canonical ;
- Open Graph ;
- Twitter Card ;
- image de partage ;
- `robots.txt` ;
- sitemap ;
- JSON-LD si retenu ;
- favicon ;
- Apple touch icon.

Tester le rendu d'un lien partagé dans au moins quelques surfaces réelles ou validateurs adaptés.

Vérifier que les routes formulaires/réglages ne sont pas indexées inutilement.

---

# 13. États d'erreur et résilience

Tester volontairement :

- route inexistante ;
- erreur React de route ;
- erreur globale ;
- IndexedDB refusée/indisponible ;
- erreur de lecture d'un livre supprimé ;
- absence réseau ;
- erreur Drive ;
- import invalide ;
- interaction pendant état `busy` ;
- double tap/clic rapide ;
- reload pendant ou juste après une mutation locale.

Chaque erreur doit :

- être compréhensible ;
- proposer une action utile quand possible ;
- ne pas détruire silencieusement des données ;
- ne pas exposer de détails techniques en production.

---

# 14. Tests automatisés à compléter

Les tests unitaires métier existants restent la base, mais la RC doit évaluer la nécessité d'une couche E2E.

## 14.1 Unit / integration

Maintenir/couvrir :

- dérivation de statut ;
- dates partielles ;
- timeline ;
- démarcation passé/futur au niveau mois ;
- archives ;
- autocomplete ;
- filtrage ;
- merge imports ;
- parsing/migrations de backup ;
- swipe resolver ;
- helpers PWA/install si ajoutés ;
- logique de rappel mensuel de sauvegarde.

## 14.2 E2E — minimum recommandé avant V1

Introduire une solution E2E légère si le coût reste raisonnable, avec au minimum :

1. ajouter un livre ;
2. éditer un livre ;
3. marquer acheté ;
4. rechercher/filtrer ;
5. supprimer ;
6. export/import local ;
7. navigation vers Guide/Settings ;
8. 404/error state si testable.

Ne pas tenter d'automatiser de manière fragile le vrai OAuth Google ; garder la validation Drive réelle dans la QA manuelle et tester les helpers isolables séparément.

---

# 15. Performance review

Mesurer au minimum sur production :

- temps de premier affichage ;
- coût du splash ;
- fluidité du scroll avec une bibliothèque conséquente ;
- fluidité du swipe ;
- coût du rendu des groupes/archives ;
- bundle/dépendances ;
- chargement des fonts ;
- comportement après installation PWA.

Créer un jeu de données de test suffisamment grand pour révéler les problèmes de rendu, sans optimiser prématurément si aucun problème réel n'apparaît.

Rechercher :

- re-renders évitables ;
- calculs lourds dans le rendu ;
- listeners non nettoyés ;
- URLs blob non libérées ;
- memory leaks ;
- animations saccadées.

---

# 16. Audit code / architecture

## 16.1 TypeScript

- strict toujours actif ;
- aucun `any` explicite non justifié ;
- types d'événements modernes ;
- guards réutilisables ;
- pas de casts dangereux évitables.

## 16.2 Architecture

Vérifier la séparation :

- UI ;
- règles métier ;
- IndexedDB/repository ;
- backup/import ;
- Google Drive ;
- i18n ;
- thème ;
- PWA lifecycle.

Éviter un refactor massif uniquement « pour faire propre ». Corriger uniquement ce qui réduit un risque réel ou une dette clairement gênante.

## 16.3 Code mort

Rechercher et supprimer :

- anciens hooks de sync ;
- tokens CSS devenus inutiles ;
- translations orphelines ;
- composants non utilisés ;
- helpers non utilisés ;
- docs décrivant une architecture abandonnée comme si elle était actuelle.

## 16.4 Dépendances

- dépendances réellement utilisées ;
- versions cohérentes ;
- pas de package lourd introduit pour un besoin trivial ;
- vulnérabilités pertinentes traitées ou documentées.

---

# 17. Documentation review

Avant V1 :

- README = état réel du produit ;
- spec historique clairement identifiée comme telle ;
- docs Product Finish et RC présentes ;
- Guide utilisateur cohérent ;
- page Confidentialité cohérente ;
- docs Drive manuel exactes ;
- docs backup exactes ;
- docs modèle V2 exactes ;
- installation locale reproductible.

Mettre à jour la section Documentation du README avec les documents devenus sources de vérité.

---

# 18. Sécurité / confidentialité

Même sans backend, vérifier :

- aucun secret dans le bundle/repo ;
- seul le client ID public Google est exposé ;
- scope Drive limité ;
- access token non persisté ;
- aucun log de token ;
- aucune donnée de bibliothèque envoyée ailleurs ;
- pas d'injection évidente via les champs utilisateur ;
- URLs/HTML utilisateur non interprétés dangereusement ;
- politique de confidentialité fidèle au code.

---

# 19. Scénarios de régression à rejouer après chaque correctif RC

Après une correction importante, rejouer au minimum :

- ouverture application ;
- création ;
- édition ;
- purchased toggle ;
- swipe ;
- recherche ;
- changement langue ;
- changement thème ;
- export local ;
- navigation settings/home ;
- build CI.

Pour un correctif touchant Drive, date, PWA ou IndexedDB, rejouer le sous-ensemble complet correspondant.

---

# 20. Classification des bugs

## P0 — critique

Exemples :

- perte/corruption de données ;
- application inutilisable au lancement ;
- migration destructive ;
- import qui écrase des données avant validation ;
- faille grave.

**Bloque immédiatement la release.**

## P1 — majeur

Exemples :

- parcours principal cassé ;
- ajout/édition/suppression impossible sur une plateforme cible ;
- PWA impossible à installer/utiliser correctement ;
- sauvegarde/restauration Drive cassée ;
- erreur d'accessibilité majeure empêchant l'usage.

**Bloque la release.**

## P2 — moyen

Exemples :

- incohérence visuelle notable ;
- feedback incorrect mais contournable ;
- bug limité à un cas secondaire ;
- SEO/metadata partiellement incorrecte.

**À corriger ou accepter explicitement avant Go.**

## P3 — mineur

Exemples :

- détail de spacing ;
- micro-animation perfectible ;
- wording non bloquant ;
- optimisation sans impact utilisateur significatif.

**Peut être reporté.**

---

# 21. Go / No-Go V1

## Go si et seulement si

- aucun P0/P1 ouvert ;
- tous les P2 sont corrigés ou explicitement acceptés ;
- CI entièrement verte ;
- QA iOS PWA validée ;
- QA Android PWA validée ;
- navigateur desktop principal validé ;
- backup local validé ;
- Drive export/import validé sur production ;
- parcours nouvel appareil validé ;
- accessibilité critique validée ;
- SEO/social validé ;
- erreurs/offline validés ;
- documentation alignée ;
- aucune régression connue de données.

## No-Go si

- une perte de données reste plausible/non comprise ;
- une plateforme cible principale est cassée ;
- la sauvegarde/restauration n'est pas fiable ;
- la PWA installée produit un comportement que nous ne savons pas expliquer ;
- une erreur critique est masquée par un fallback trompeur ;
- la documentation utilisateur décrit un comportement différent du produit réel.

---

# 22. Préparation de la release V1.0.0

Une fois le Go décidé :

1. mettre à jour `package.json` vers `1.0.0` si cette version est retenue ;
2. ajouter/mettre à jour les release notes/changelog ;
3. relancer la CI complète ;
4. vérifier le déploiement production final ;
5. effectuer un smoke test production ;
6. créer le tag/release `v1.0.0` ;
7. conserver la checklist RC comme trace de validation.

Aucun tag V1 ne doit être créé avant la décision Go.

# 23. Après la V1

Après publication, ouvrir une phase distincte de backlog V2. Les idées qui auront été volontairement refusées pendant Product Finish/RC y seront réévaluées sans pression de scope.

La V1 doit rester définie par une promesse simple et cohérente : **une wishlist de livres local-first, élégante, fiable, installable et sauvegardable, sans complexité inutile.**
