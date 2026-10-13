# À faire avec Lucas, mis à jour le 14/10/2026 (mission de nuit)

Cette liste va du plus grave au moins grave. Chaque point dit **quoi** faire, **pourquoi**, le **temps** à prévoir et la **marche à suivre**, pas à pas.

**Les règles de chaque séance (CLAUDE.md)**
- Une seule étape à la fois. Claude fait un rapport court, puis attend ton « ok ».
- Avant toute suppression ou écriture dans la base : une sauvegarde et un comptage d'abord.
- Un écart qu'on ne sait pas expliquer : on arrête tout.
- Supprimer, faire un push forcé (remplacer l'historique sur GitHub) ou écrire dans Supabase, c'est toi qui décides. Le plus souvent, c'est aussi toi qui le fais.

> Ce fichier est dans le dépôt public. Il ne contient aucun nom de client ni aucun détail de santé, mais il dit où ces données traînent encore. Plus vite le point 1 est fait, mieux c'est.

## En un coup d'œil

| # | Quoi | Gravité | Temps | Qui |
|---|---|---|---|---|
| 1 | 32 branches publiques qui montrent encore des données de santé | critique | 30 min (+ question CNIL) | toi |
| 2 | Nettoyer l'historique de main et la pull request n° 1 | haute | 2 à 3 h, puis le support GitHub | toi + Claude |
| 3 | Limites d'écriture dans la base (v78) | haute | 2 à 3 h | toi + Claude |
| 4A | Réglages Supabase (tableau de bord) | moyenne | 45 min à 1 h | toi |
| 4B | Règles de la base à resserrer | moyenne à basse | 3 à 5 h, en plusieurs fois | toi + Claude |
| 5 | Turnstile (vérification anti-robot) | moyenne | 1 h 30, sur 2 à 3 jours | toi + Claude |
| 6 | Sauvegarde de la base : vérifier, puis restauration d'essai | importante | 1 h 15 | toi (+ Claude) |
| 7 | Jeton GitHub de Grok Bot, et qui peut publier sur main | moyenne | 30 à 45 min | toi |
| 8 | Petits points à trancher | basse | 5 à 45 min chacun | toi |

**Ordre conseillé des séances** :
1. Le point 1.
2. Le point 6, étapes 1 à 3 (s'assurer que la sauvegarde marche).
3. Le point 3, qui s'appuie sur cette sauvegarde.
4. Le point 2, toujours après le point 1.
5. Les points 4A et 5.
6. Le point 7. La protection de main vient seulement après le point 2.
7. Le point 4B, après le point 3.
8. Le point 8.

À faire dès aujourd'hui, en 5 minutes : les deux premières cases du point 4A.

---

## 1. Les 32 branches publiques `v2/*` qui montrent encore des données de santé (CRITIQUE)

**Quoi** : supprimer de GitHub 32 anciennes branches de travail. Elles montrent encore les 2 fichiers retirés de `main` le 12/10.

**Pourquoi** :
- N'importe qui, sans compte, peut choisir une de ces branches sur la page GitHub du projet et ouvrir le dossier `donnees/`.
- Il y lit le prénom d'une cliente avec une information de santé.
- Il y lit aussi un tableau avec le prénom, le nom, le poids, la taille et l'âge d'autres clients, et des identifiants de comptes.
- Les robots qui copient les dépôts publics y ont accès de la même façon.
- Ce sont des données de santé de personnes nommées : les plus protégées par le RGPD, le règlement européen sur les données personnelles.

**Temps estimé** : 30 min (sauvegarde 5 min, suppression 10 min, vérification 10 min). Ajoute environ 1 h pour la question CNIL (voir plus bas).

**Bon à savoir** :
- 27 de ces branches sont déjà entrées dans `main` : les supprimer ne fait rien perdre.
- Les 5 autres (`v2/v53-c3`, `v2/v53-c4`, `v2/v53-dclients`, `v2/v53-nettoyage`, `v2/v62`) restent sur ton Mac et dans la sauvegarde.
- Supprimer ces branches ne suffit pas : les anciens commits restent lisibles par leur identifiant et par la pull request n° 1. C'est le point 2, à faire **après** celui-ci. Sinon, le nettoyage recréerait les branches.
- Passer le dépôt en privé n'est pas une option : GitHub Pages gratuit demande un dépôt public, donc le site serait coupé.
- Ce relevé date de la dernière mise à jour depuis GitHub (13/10, 20 h 35). L'étape 3 le refait.
- Claude n'a pas le droit de supprimer des branches sur GitHub : c'est toi qui le fais, dans ton Terminal.

**La liste exacte des 32 branches** (constat critique n° 1 de l'audit, revérifiée sur la copie du Mac) :

```
v2/audit                 v2/v53-c3            v2/v61
v2/compteur-connexions   v2/v53-c4            v2/v62
v2/decoupage             v2/v53-dclients      v2/v62b
v2/ouverture-inscription v2/v53-nettoyage     v2/v63
v2/relecture-v54         v2/v57-retouches     v2/v64
v2/simu-main-v64         v2/v58-cartes        v2/v65
v2/simu-off-v59          v2/v59               v2/v66
v2/simu-tous-v59         v2/v60               v2/v67-audit
v2/v52                   v2/v67-pub           v2/v71
v2/v53                   v2/v72               v2/v73
v2/v74                   v2/v77-liens-formation
```

**Marche à suivre** :
1. Ouvre le Terminal (Applications → Utilitaires → Terminal).
2. Fais la sauvegarde du dépôt entier en un seul fichier (un « bundle »). Remplace la date par celle du jour.
   ```
   cd ~/MHX-Code/mhx-plateforme
   git fetch origin
   git bundle create ~/MHX-prive/sauvegardes-depot/mhx-plateforme-2026-10-14-avant-branches.bundle --all
   git bundle verify ~/MHX-prive/sauvegardes-depot/mhx-plateforme-2026-10-14-avant-branches.bundle
   ```
   On doit lire « The bundle records a complete history » puis « … is okay ». Sinon : arrêt, montre le message à Claude.
3. Recompte les branches concernées. Cette commande ne fait que lire :
   ```
   for b in $(git branch -r | grep -v HEAD); do git ls-tree -r --name-only "$b" -- donnees/audit-coherence.md | grep -q . && echo "$b"; done
   ```
   On doit lire les 32 noms de la liste, précédés de `origin/`. Une branche en plus ou en moins : arrêt, demande à Claude.
4. Supprime les 32 branches sur GitHub, en une seule commande :
   ```
   git push origin --delete \
     v2/audit v2/compteur-connexions v2/decoupage v2/ouverture-inscription v2/relecture-v54 \
     v2/simu-main-v64 v2/simu-off-v59 v2/simu-tous-v59 v2/v52 v2/v53 v2/v53-c3 v2/v53-c4 \
     v2/v53-dclients v2/v53-nettoyage v2/v57-retouches v2/v58-cartes v2/v59 v2/v60 v2/v61 \
     v2/v62 v2/v62b v2/v63 v2/v64 v2/v65 v2/v66 v2/v67-audit v2/v67-pub v2/v71 v2/v72 \
     v2/v73 v2/v74 v2/v77-liens-formation
   ```
   Autre façon, plus lente : https://github.com/lcsmhx/mhx-plateforme/branches → onglet « All » → l'icône corbeille à droite de chaque branche, 32 fois.
5. Vérifie :
   ```
   git fetch --prune origin
   git ls-remote --heads origin 'v2/*'
   ```
   - Aucune des 32 ne doit apparaître.
   - Relance la commande de l'étape 3 : elle ne doit plus rien afficher.
   - Dans le navigateur, https://github.com/lcsmhx/mhx-plateforme/tree/v2/v74 doit donner une page d'erreur.
6. Dis à Claude que c'est fait : il note la date et la suite du point 2.

**Retour arrière** : une branche supprimée par erreur est dans le bundle, et Claude peut la remettre. Mais la remettre republierait les données : à éviter.

**La question CNIL (ta décision)**
- La CNIL est l'autorité française de protection des données.
- Ce que tu as ici : des données de santé de personnes nommées, lisibles par tous sur GitHub depuis fin août ou septembre. Découverte au plus tard le 12/10/2026, quand les fichiers ont été retirés de `main`.
- Les repères généraux du RGPD. Claude n'est pas juriste : vérifie sur cnil.fr ou demande à un juriste.
  - Toute violation de données se note dans un **registre interne**, même si tu ne déclares rien. On y écrit : quoi, depuis quand, combien de personnes, ce qui a été fait.
  - La **déclaration à la CNIL** est due dans les 72 h après la découverte, si la fuite présente un risque pour les personnes. En retard, on déclare quand même, en expliquant le retard.
  - Les **personnes concernées** sont prévenues si le risque est élevé. Des données de santé avec le nom pèsent dans ce sens.
- Marche à suivre :
  1. Claude prépare une fiche d'incident hors du dépôt, dans `~/MHX-prive/`, sans recopier les données : dates, fichiers, nombre de personnes, mesures prises.
  2. Tu décides si tu déclares (sur cnil.fr, cherche « Notifier une violation de données personnelles »).
  3. Tu décides si tu préviens les personnes, avec un message simple et honnête.
  4. Garde la fiche.

---

## 2. Nettoyer l'historique de `main` et la pull request n° 1 (HAUTE)

**Quoi** : réécrire l'historique du dépôt public pour retirer :
- le prénom d'une cliente (dans 3 messages de commit et dans le nom d'un fichier) ;
- les 2 fichiers retirés le 12/10 ;
- les adresses email réelles.

Ensuite, demander à GitHub d'effacer ses copies.

**Pourquoi** :
- Sur la page des commits de `main`, n'importe qui lit le prénom.
- En ouvrant un ancien commit par son identifiant, il relit le programme avec l'information de santé et le tableau poids / taille / âge. Un simple `git clone` donne tout.
- La pull request n° 1 (une proposition de fusion) et le cache de GitHub gardent l'ancien historique, même après la réécriture. Seul le support de GitHub peut les effacer.

**Temps estimé** : 2 à 3 h avec Claude (dont 30 min d'attente du banc de tests), puis 15 min pour le formulaire du support. La réponse du support peut prendre plusieurs jours.

**Référence** : `docs/V78-A-APPLIQUER-DEMAIN.md`, partie 6. Elle fait foi.
- L'essai à blanc a été fait et vérifié le 12/10 : 3 messages et 65 versions de fichiers réécrits, et le contenu de `main` reste identique au bit près.
- La vraie réécriture n'a **pas** été faite : le contrôle des permissions l'a refusée.

**Décisions à prendre avant** (partie 6, étape 0) :
- Ajouter ou non le prénom et le nom de la 2e personne qui a eu l'accès coach. Ils sont dans d'anciennes notes, et une règle est prête mais inactive.
- Remplacer aussi ton adresse email personnelle d'auteur dans les commits (option `--mailmap`). C'est conseillé : c'est aussi l'identifiant de connexion du compte coach.
- Confirmer le remplacement de l'ancienne adresse de contact de la marque.
- Les branches `v2/*` qui resteront après le point 1 (une quinzaine) : les réécrire et les repousser (conseillé), ou les supprimer.
- `tests-locaux/verif72.js` garde des empreintes (des codes calculés) de noms retirés. Avec une liste de prénoms, on peut retrouver un prénom à partir de son empreinte. Les remplacer demande de modifier cette suite de tests : décision à part.

**Marche à suivre** :
1. **Pré-requis : le point 1 est fait.**
2. Tout de suite, sans risque :
   - GitHub → ta photo → Settings → Emails : coche « Keep my email addresses private » et « Block command line pushes that expose my email ».
   - Donne à Claude l'adresse « noreply » que GitHub affiche sur cette page. Il la règle dans le dépôt pour les prochains commits.
3. Préviens Grok Bot : il ne pousse rien pendant l'opération.
4. Fais la sauvegarde. Même commande qu'au point 1, avec un nom qui finit par `-avant-nettoyage.bundle`. On doit lire « complete history ».
5. Avec Claude :
   - `main` a avancé depuis le 12/10 : l'ancien point de départ (`0727aed`) est remplacé par le dernier commit de `main`.
   - Claude refait donc la copie de travail (le « miroir »), avec l'envoi vers GitHub coupé.
   - Il relance l'inventaire, refait le relevé « avant » et adapte `nettoyer.sh` au nouveau `main`.
   - Tu autorises la commande de réécriture **pour la séance seulement**.
6. Essai à blanc, puis réécriture du miroir. Rien ne part sur GitHub.
7. Vérifications sur le miroir réécrit :
   - 0 fichier retiré, 0 nom de la liste, 0 adresse réelle, dans tout l'historique ;
   - contenu de `main` identique au bit près : le site ne change pas ;
   - catalogue identique ;
   - banc de tests complet vert sur une copie, dont `verif52`.

   Un seul écart : arrêt.
8. **Push forcé : toi seulement**, à une heure calme, après ton « ok » écrit. Claude te donne le chemin exact du miroir. La commande prévue est :
   ```
   cd ~/MHX-prive/nettoyage/mhx-plateforme.git && git push --force https://github.com/lcsmhx/mhx-plateforme 'refs/heads/*:refs/heads/*'
   ```
   À savoir :
   - tous les identifiants de commits changent (la table `commit-map` fait la correspondance) ;
   - les commits faits sur GitHub perdent leur badge « Verified » ;
   - « Tests puis publication » rejoue le banc, et le site ne change pas.
9. **Support GitHub**, seulement après l'étape 8 : https://support.github.com/contact, rubrique sur les données sensibles. Joins la liste des anciens identifiants tirée de `commit-map`, jamais les noms. Texte prêt (en anglais) :
   > Repository lcsmhx/mhx-plateforme (public). I rewrote the history to remove personal data of my clients (files and names) and force-pushed all branches. Please remove the cached views of the old commits and the references of pull request #1 (refs/pull/1/head), which still point to the old history. I can provide the list of affected old commit IDs.
10. Après :
    - Remplace ta copie `~/MHX-Code/mhx-plateforme` par un clone neuf. Garde l'ancienne dans `~/MHX-prive/` le temps de vérifier.
    - Grok Bot reclone sa copie.
    - Décide pour les autres copies : les copies de la base du 25/09 au 01/10 dans `~/MHX-Code/sauvegardes/`, Time Machine, les journaux de Claude dans `~/.claude`. Toute suppression est ta décision.

**Retour arrière** :
- Avant le push forcé, rien n'est parti : on jette le miroir réécrit.
- Après : on repousse l'ancien historique depuis le bundle. Mais cela republie les données.

---

## 3. Limites d'écriture dans la base (v78) (HAUTE)

**Quoi** : appliquer la migration prête dans `supabase/v78-limites/`. Après elle :
- la base n'accepte plus que les **29 clés** de l'app ;
- chaque clé a une taille maximale (256 Ko par clé pour un prospect) ;
- le prénom et le nom font 100 caractères au plus.

**Pourquoi** :
- Aujourd'hui, n'importe quel inscrit peut écrire par l'API des clés inventées et des contenus énormes. L'API, c'est la porte d'accès directe à la base, sans passer par l'app. Et l'inscription est libre, sans vérification anti-robot.
- Premier effet : quand tu ouvres Tableau de bord, Mes clients ou Prospects, ton téléphone télécharge tout ce contenu et l'écran se bloque.
- Deuxième effet : les 500 Mo gratuits peuvent se remplir, et la base peut alors passer en lecture seule. Les séances, bilans et repas de tes clients ne s'enregistreraient plus.

**Ce qu'elle ne change pas** :
- aucune ligne modifiée ni supprimée ;
- règles d'accès, fonctions et lecture identiques ;
- rien à changer dans l'app.

**Les clés de l'app sont-elles toutes dans la liste ? Oui (vérifié cette nuit)** :
- La liste de `02-migration.sql` a 29 clés, dont `journal_alimentaire` (v79) et `seances_formation` (v90, « J'ai fait cette séance », 256 Ko).
- Le choix du programme de la formation (v85) est rangé dans `prefs.prog_formation`. C'est un champ de `prefs`, donc il est couvert. La limite de `prefs` (16 Ko) est très large pour ce petit objet.
- L'accord santé redemandé (v88) est rangé dans les informations du compte, pas dans `donnees` : il n'est pas concerné.
- Aucune clé que l'app écrit ou lit ne manque. Les seuls noms hors liste ne sont pas des clés de `donnees` : les tables du catalogue, le stockage du téléphone (`mhx_…`), « sexe » (une ligne d'affichage).
- Le banc vérifie aussi ce point à chaque version (`garde-cles.js`).
- Toute nouvelle clé devra entrer dans la liste avant d'être publiée (c'est déjà fait pour `seances_formation`).

**Temps estimé** : 2 à 3 h avec Claude, en une séance, à une heure calme (peu de clients connectés).

**Avant la séance** :
- Pré-requis : le point 6, étapes 1 à 3 (la sauvegarde marche).
- Claude corrige le mode d'emploi :
  - il cite encore l'ancien compte de test `9df6bb84…`, qui n'existe plus : prendre `294c473f…` ;
  - le dossier de séance doit porter la date du jour ;
  - aucun compte prospect de test n'est noté : à choisir ensemble.

**Décisions** (détail à la fin de la partie 5 de `docs/V78-A-APPLIQUER-DEMAIN.md`) :
1. Plafond d'un prospect : 256 Ko par clé (prévu) ou 512 Ko.
2. Les limites de chaque clé : le tableau est dans `supabase/releve-2026-09-30/INVENTAIRE-CLES.md`.
3. Prénom et nom : 100 caractères au plus.
4. Un déclencheur (un contrôle automatique à chaque écriture) plutôt que de modifier les règles d'accès.
5. Une ancienne ligne déjà plus grosse que sa limite reste lisible, mais ne peut plus grossir.
6. La répétition sur la vraie base est obligatoire.
7. Qui lance les commandes : toi, dans l'éditeur SQL de Supabase (conseillé), ou Claude, si tu lèves son refus pour la séance. Le SQL est le langage de la base.
8. La sauvegarde passe par le dépôt privé `mhx-prive` (conseillé).
9. L'heure de la séance.

**Marche à suivre** (références : `docs/V78-A-APPLIQUER-DEMAIN.md` partie 5 et `supabase/v78-limites/LISEZMOI.md` ; un rapport de Claude et ton « ok » entre chaque étape) :
0. Tests sur ton Mac, sans la vraie base : installe Postgres.app (gratuit, 15 min) ; Claude lance les fichiers dans l'ordre prévu. Attendu : « 76 / 76 tests OK ».
1. Relevé de la vraie base, en lecture seule : Supabase → SQL Editor → colle tout `01-releve-agregats.sql` → Run. Exporte le résultat en CSV dans le dossier de séance. Attendu : dernière ligne « OK pour appliquer ».
2. Sauvegarde complète juste avant : `mhx-prive` → Actions → « Sauvegarde de la base » → Run workflow. Claude compare les nombres de lignes, table par table, avec le relevé. Un écart : arrêt.
3. Claude fait relire les fichiers par l'agent `database-reviewer` (obligatoire). Une réserve : on la règle d'abord.
4. Répétition sur la vraie base, tout sera annulé : colle `06-repetition.sql` **en entier, en un seul envoi**. Attendu, comme erreur voulue : « 68 / 68 tests OK, 8 sauté(s) — aucun échec. Annulation forcée ». L'app peut se figer quelques secondes : c'est normal.
5. Application : `02-migration.sql` **en entier**, jamais un morceau.
6. Vérifications : `05-verifications.sql`, avec les 4 empreintes du relevé (attendu « OK ») ; comptage « après » identique au comptage « avant » ; puis `04-tests.sql`, avec ton « ok » (il écrit des comptes fictifs, puis annule tout).
7. Essai dans l'app, avec le compte de test : côté client une séance, un repas, une mesure, un bilan ; côté coach, envoyer un programme ; avec un prospect de test, le questionnaire et le calculateur. Aucun message « Non enregistré : la base a refusé cette modification » ne doit apparaître.
8. Le jour même, Claude met à jour CLAUDE.md (« Repères ») et le HANDOFF. Si tu as levé le refus de Claude, remets-le.

**Retour arrière** :
- **Urgence, sans rien supprimer** (une ligne, réversible) : `alter table public.donnees disable trigger v78_donnees_limites;`. Pour remettre les limites : la même ligne avec `enable` à la place de `disable`.
- **Retour complet** : `03-retour.sql`. Il retire seulement les 5 objets ajoutés par la v78, aucune ligne de données. Il contient des « DROP » de ces objets : seulement avec ton accord explicite.

---

## 4A. Réglages Supabase du tableau de bord (MOYENNE)

**Quoi** : vérifier et régler, dans le tableau de bord Supabase, la protection des connexions, surtout celle du compte coach.

**Pourquoi** :
- Le compte coach ouvre toutes les données de santé, toutes les photos et les exports avec les emails. Il peut aussi supprimer des comptes.
- Il n'est protégé que par un mot de passe : pas de code à 6 chiffres, vérification anti-robot éteinte, mots de passe déjà fuités acceptés.
- Son identifiant de connexion est lisible dans l'historique public (point 2).
- Certains réglages (adresses de retour, sessions) ne se voient pas dans le code : personne ne les a encore vérifiés.

**Temps estimé** : 45 min à 1 h. Aucune donnée n'est touchée.

**Retour arrière** : avant de changer un réglage, fais une capture d'écran de sa valeur. Pour revenir, tu remets cette valeur.

**Tout de suite (5 min)** :
- [ ] Mot de passe du compte coach : 16 caractères ou plus, utilisé nulle part ailleurs, rangé dans ton gestionnaire de mots de passe.
- [ ] Ne crée **aucun compte « accès complet »** (rôle coach) tant que le point 4B n'est pas fait. Un tel compte pourrait te retirer le rôle coach, ou supprimer ton compte et ta bibliothèque.

**Dans Supabase** : https://supabase.com/dashboard/project/nzynbuczmogifuidcjed, menu Authentication. Les libellés exacts sont à vérifier à l'écran.
- [ ] **URL Configuration** : « Site URL » = `https://lcsmhx.github.io/mhx-plateforme/` ; « Redirect URLs » = cette seule adresse (retire l'ancienne adresse Netlify, tout `localhost` et tout joker `*`, `**`). Sinon, quelqu'un pourrait détourner un lien « mot de passe oublié » et prendre un compte.
- [ ] **Rate Limits** (limites de débit) : note les valeurs (emails par heure, inscriptions et connexions par 5 min et par adresse IP) ; garde la limite d'inscriptions basse, sans exagérer (plusieurs clients peuvent partager le même réseau).
- [ ] **Sign In / Providers** : « Allow anonymous sign-ins » = désactivé ; « Allow new users to sign up » = ta décision (ouvert aujourd'hui) ; « Confirm email » **reste désactivé** (le parcours prospect en dépend).
- [ ] **Fournisseur Email** : « Secure password change » = activé. L'app est prête.
- [ ] **Longueur minimale du mot de passe (décision)** : l'app demande 8 caractères à l'inscription et pour un accès que tu crées, mais 6 dans le Profil. Conseil : 8 partout. Ordre : d'abord Claude passe le Profil et son message à 8 (FR et EN, une petite version), ensuite tu règles 8 dans Supabase. Les mots de passe existants continuent de marcher.
- [ ] **Protection contre les mots de passe divulgués** (« Leaked password protection ») : selon Supabase, elle est réservée aux plans payants. Si l'écran le confirme, laisse-la éteinte (règle « tout gratuit »).
- [ ] **Sessions** : « Detect and revoke potentially compromised refresh tokens » = activé ; délai 10 s et durée du jeton 3 600 s (les valeurs par défaut) ; ne prends pas « Time-box » ni « Inactivity timeout » (payants).
- [ ] **Multi-Factor** : vérifie que « TOTP » est permis (le code à 6 chiffres d'une appli comme Google Authenticator). N'impose rien : l'app ne sait pas encore demander ce code (point 4B).
- [ ] **Email Templates** : les modèles doivent être ceux de `supabase/templates/` du dépôt.
- [ ] **Storage → photos** : pas de badge « Public » ; limite de 5 Mo ; type image/jpeg seulement.
- [ ] **Realtime** : ne clique jamais « Enable Realtime » sur `donnees`, `profils` ou `connexions`.
- [ ] Facultatif, avec Claude : Settings → API → « Exposed schemas » → retirer `graphql_public` (l'app ne s'en sert pas, réversible en un clic).
- [ ] Relevé en lecture seule, avec Claude : les requêtes 1, 2, 5, 7 et 8 de `supabase/releve-2026-09-30/releve.sql`, dans l'éditeur SQL (texte exact des règles des photos et de `briefs`, droits des tables). Claude range le résultat hors du dépôt.

---

## 4B. Règles de la base à resserrer (MOYENNE à BASSE)

**Quoi** : de petites migrations non destructives (aucune ligne supprimée), une par séance, **après la v78** (sa vérification compare l'empreinte des fonctions : il ne faut pas la fausser avant).

**Temps estimé** : 45 min à 1 h par migration avec Claude. Entre 3 et 5 h en tout, en plusieurs fois.

**Même méthode pour chacune** : sauvegarde et relevé ; ancien texte gardé (le retour arrière) ; relecture par l'agent `database-reviewer` ; essai dans une transaction annulée ; application avec ton « ok » ; vérification.

**La liste** :
- [ ] **Le correctif de `supprimer-acces` (déjà écrit le 01/10)** : si la lecture du profil rate (panne passagère), le garde-fou « dernier compte coach » saute. Ce n'est pas une règle de la base : peut se faire avant la v78. Étapes : Supabase → Edge Functions → `supprimer-acces` ; copie le code en ligne dans un fichier (la sauvegarde ; Claude le compare à `~/MHX-Code/sauvegardes/2026-10-01-audit/supprimer-acces-AVANT.ts`) ; colle `supprimer-acces-PROJET.ts` (même dossier) → Deploy ; Claude recopie la nouvelle version dans le dépôt. Retour arrière : recoller l'ancien code → Deploy.
- [ ] **Un seul « propriétaire » : toi** : aujourd'hui, un compte « accès complet » peut te retirer le rôle coach (et tu ne peux pas le reprendre depuis l'app), supprimer pour de bon ton compte et ta bibliothèque, créer d'autres coachs. Correction : `protege_role` refuse tout changement de rôle demandé par quelqu'un d'autre que toi ; `creer-acces` refuse de créer un coach si la demande ne vient pas de toi ; `supprimer-acces` refuse de supprimer ton compte. Ton identifiant est posé par toi dans Supabase, comme secret de la fonction, jamais dans le dépôt. Claude écrit aussi la commande de secours pour te rendre le rôle coach depuis l'éditeur SQL.
- [ ] **Les clés du coach dans la ligne d'un client** : un client ou un prospect peut écrire, remplacer ou effacer par l'API son programme, ses calories (`calc`), ses compléments et les historiques, comme si ça venait de toi. Correction : 3 règles modifiées ajoutent ces 5 clés à celles que le compte ne peut pas toucher (`repas` reste permis, pour « Remplacer »).
- [ ] **`protege_role` et la date d'inscription** : un compte peut réécrire sa date d'inscription (`cree_le`) et disparaître des « Nouveaux inscrits ». Correction : ajouter `cree_le` à la protection (sans figer le prénom ni le nom).
- [ ] **Droits par défaut des nouvelles tables** : Supabase donne par défaut tous les droits sur les tables, même sans compte. Pas de faille aujourd'hui (toutes les tables ont leurs règles), mais un piège pour la prochaine table. Correction : retirer `truncate`, `trigger` et `references` à `anon` et `authenticated`.
- [ ] **La double authentification du coach** (le code à 6 chiffres), dans cet ordre, **jamais inversé** : 1) Claude ajoute dans l'app, pour le coach seulement, l'écran pour inscrire le code puis la demande du code ; 2) tu inscris 2 appareils (Supabase ne donne pas de codes de secours) ; 3) seulement ensuite, la base exige le code pour les droits de coach. Si tu perds tes appareils : retire le code dans Authentication → Users.
- [ ] Facultatif : un journal de qui change un rôle, crée ou supprime un compte (aujourd'hui, aucune trace n'est gardée).

---

## 5. Turnstile : la vérification anti-robot (MOYENNE)

**Quoi** : allumer la vérification anti-robot gratuite de Cloudflare (un CAPTCHA), déjà prête dans l'app mais éteinte.

**Pourquoi** : sans elle, un robot peut créer des comptes en série (même après la v78, environ 140 faux comptes suffiraient à remplir les 500 Mo) et essayer des mots de passe en série sur ton compte coach.

**Temps estimé** : 1 h 30 en tout, sur 2 à 3 jours (compte Cloudflare 10 min, confidentialité 30 min, mise en ligne 10 min, vérifications 15 min, 1 à 2 jours d'attente, Supabase et tests 15 min).

**Référence** : `docs/TURNSTILE.md`. Il fait foi, et **l'ordre compte**.

**Marche à suivre** :
0. **Décision « profil »** : `true` (conseillé) : le cadre de vérification apparaît aussi dans « Changer mon mot de passe » ; `false` : plus personne ne peut changer son mot de passe dans l'app, et 3 textes doivent changer.
1. **Cloudflare (toi)** : crée un compte gratuit, puis un widget Turnstile (nom au choix, domaine `lcsmhx.github.io`, mode « Managed »). Tu obtiens la **Site Key** (publique, commence par `0x`) et la **Secret Key** (seulement dans Supabase : jamais dans un message, jamais dans le dépôt).
2. **La confidentialité, AVANT la clé** (Cloudflare reçoit des données dès que la clé est en ligne) : valide le paragraphe Cloudflare de `docs/CONFIDENTIALITE-BROUILLON.md` ; Claude met à jour le texte court de l'app (FR et EN : ajoute Cloudflare, retire Google Fonts) ; tu mets à jour les PDF du Drive. Lien avec la v88 : si la date des conditions (`cgu_version`) change, tous les prospects et clients revoient une fois la fenêtre de l'accord santé ; si seul le texte court change de version, personne ne la revoit.
3. **La clé dans l'app** : donne la Site Key à Claude (elle est publique) et ton choix pour « profil » ; il l'écrit dans `js/config.js` et publie sur ton « ok ». Le banc refuse une clé de test ou une confidentialité pas à jour.
4. **Vérifie sur le vrai site** (#/connexion et #/inscription : coche verte sous le bouton ; Safari sur iPhone, Instagram, TikTok, et le Profil si `true`). À ce stade, Supabase ne demande encore rien.
5. **Attends 1 à 2 jours** : la plupart des téléphones auront rouvert l'app.
6. **Allume la vérification dans Supabase** : Authentication → Attack Protection → « Enable Captcha protection » → « Turnstile by Cloudflare » → colle la **Secret Key** → Save. Si la page demande un plan payant : arrêt, et Claude vide la clé.
7. **Teste tout de suite** : connexion avec le compte de test ; création d'un compte d'essai avec une adresse à toi puis suppression ; Profil → « Changer mon mot de passe ». Ce que tes clients peuvent voir, et quoi leur répondre : `docs/TURNSTILE.md`, §8.

**Retour arrière** : 1) **Supabase d'abord** : désactive « Enable Captcha protection » → Save ; 2) ensuite seulement, Claude vide la clé dans l'app. Jamais dans l'autre ordre : plus personne ne pourrait se connecter.

---

## 6. La sauvegarde de la base (IMPORTANTE, pré-requis des points 3 et 4B)

**Quoi** : t'assurer que la sauvegarde automatique marche vraiment (dépôt privé `lcsmhx/mhx-prive`, chaque dimanche à 12 h 00 UTC, chiffrée, gardée 90 jours), puis prouver qu'on sait la remettre en place.

**Pourquoi** : c'est le filet de sécurité avant toute migration, et en cas de panne ou d'erreur. Une sauvegarde qu'on n'a jamais remise en place n'est pas prouvée.

**Où on en est** : CLAUDE.md dit encore que les secrets `SUPABASE_DB_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont « à poser », mais ton Mac garde une vraie sauvegarde faite et téléchargée le 12/10 (`~/MHX-prive/verif-sauvegarde-2026-10-12/`) : les secrets semblent donc déjà posés. À vérifier (étape 1), puis Claude corrige CLAUDE.md. La restauration d'essai n'est notée nulle part comme faite.

**Temps estimé** : 15 min pour les étapes 1 à 3, et 1 h pour la restauration d'essai.

**Marche à suivre** :
1. **Les secrets** : https://github.com/lcsmhx/mhx-prive/settings/secrets/actions. On doit voir `SUPABASE_DB_URL`, `SUPABASE_SERVICE_ROLE_KEY` et `PHRASE_SAUVEGARDE` (GitHub n'affiche jamais leur valeur). Si un secret manque : crée-le avec le tableau « Les secrets à créer » du README de `mhx-prive`. Ne mets jamais une valeur dans un message à Claude.
2. **Une sauvegarde à la main** : Actions → « Sauvegarde de la base » → Run workflow → 5 à 10 min. Attendu : coche verte, nombre de lignes de chaque table dans le journal, fichiers `mhx-base-…` et `mhx-photos-…`.
3. **La phrase secrète** : vérifie qu'elle est dans ton gestionnaire de mots de passe ; prouve-le en déchiffrant la dernière sauvegarde sur le Mac (`RESTAURATION.md` de `mhx-prive`, parties A et B) ; efface ensuite le dossier déchiffré (partie F : il contient les données des clients en clair).
4. **Restauration d'essai dans un 2e projet** (`RESTAURATION.md`, parties C et D1) : nouveau projet Supabase gratuit `mhx-restauration` ; extensions de `base/manifeste.txt` ; secret `RESTAURATION_DB_URL` (et `RESTAURATION_SERVICE_ROLE_KEY` du 2e projet pour les photos) ; Actions → « Restauration d'essai (2e projet) » → Run workflow. Attendu : les mêmes nombres de lignes, table par table. Après : supprime ce 2e projet (il contient une copie des données) et retire les 2 secrets `RESTAURATION_…` — ta décision.
5. Dis le résultat à Claude : il met à jour CLAUDE.md et le HANDOFF.

**Retour arrière** : rien à défaire (rien n'est écrit dans la vraie base).

---

## 7. Le jeton GitHub de Grok Bot, et qui peut publier sur `main` (MOYENNE)

**Quoi** : révoquer le jeton GitHub de Grok Bot, puis vérifier qui peut écrire dans le dépôt et publier le site.

**Pourquoi** : le jeton (créé vers le 28/08, portée « public_repo ») donne l'écriture sur tous les fichiers et toutes les branches, `main` compris ; il vit sur une autre machine et sa révocation n'est notée nulle part. S'il fuit, quelqu'un peut changer le code (un script ajouté s'exécuterait chez chaque client et chez toi) ou `donnees/`, que l'app lit en direct. Le bouton « urgence » de la publication met `main` en ligne sans le banc : tout compte qui peut écrire dans le dépôt peut le lancer.

**Temps estimé** : 30 à 45 min.

**Marche à suivre** (sur GitHub, connecté en lcsmhx) :
1. Ta photo → Settings → Developer settings → Personal access tokens (onglets « Tokens (classic) » et « Fine-grained tokens ») : repère le jeton de Grok (vers le 28/08) → Delete. Donne la date à Claude (il la note dans CLAUDE.md).
2. Settings → Applications : retire ce que tu ne reconnais pas.
3. Dépôt `mhx-plateforme` → Settings → Collaborators, Deploy keys, GitHub Apps : retire tout accès en écriture que tu ne reconnais pas.
4. Si Grok doit encore envoyer des fichiers : un jeton « fine-grained » limité à ce seul dépôt, avec une date d'expiration courte ; ses envois sur une branche `grok/…`, fusionnée après le banc ; jamais d'envoi direct sur `main`.
5. Settings → Password and authentication : active la double authentification du compte lcsmhx.
6. Dépôt → Settings → Pages : source « GitHub Actions » ; Settings → Environments → `github-pages` : seulement la branche `main`.
7. Dépôt → Settings → Code security : active « Secret scanning » et « Push protection » (gratuit pour un dépôt public).
8. Protection de `main` : interdis le push forcé et la suppression de `main` — **seulement après le point 2**, qui a besoin d'un push forcé.

**Retour arrière** : un jeton révoqué ne se rallume pas (on en crée un nouveau si besoin) ; les autres réglages se remettent à la main.

---

## 8. Petits points à trancher (BASSE)

**a. Le lien Calendly contient ton prénom** (la règle de l'app : jamais ton prénom visible côté prospect ou client ; il est dans le nom de l'événement, et le prospect voit l'adresse en ouvrant Calendly). 15 min : décide si tu changes le lien ; si oui, Calendly → l'événement de 15 min → Edit → le lien de l'événement → un nom sans prénom, puis donne tout de suite le nouveau lien à Claude (en attendant, le bouton mène à une page d'erreur Calendly).

**b. Le pseudo Instagram du pied de page contient ton prénom** : c'est ta marque, est-ce voulu ? Soit on le garde (Claude note l'exception dans CLAUDE.md), soit le lien affiche « MHX Coaching » (le lien vers ton compte reste le même).

**c. Les 2 PDF du dossier Drive « MHX legal »** : à aligner sur la version du 13 octobre 2026 (texte court de l'app en version « 2026-10-13b », FR et EN). Demande le texte à Claude, mets à jour les 2 PDF avec la mention « Version du 13 octobre 2026 », remplace-les dans le même dossier (le lien ne change pas). Toujours en attente aussi : les textes légaux du téléphone, de Calendly et de WhatsApp (`docs/MISSION-V72.md`, « Questions pour Lucas »).

**d. La CSP, une barrière de sécurité du navigateur** (la liste des sites dont la page a le droit de charger du code) : aujourd'hui, toute la protection contre l'injection de code repose sur `esc()`, appliquée à la main partout. Aucune faille n'a été trouvée, mais il n'y a pas de filet. Mal réglée, la CSP empêche l'app de démarrer : à faire plus tard (pas pendant un voyage), sur une branche, avec le banc et un test sur ton iPhone.

**e. Les étiquettes régime et allergènes des recettes de secours** : quand la base ne répond pas, l'app lit les recettes dans un fichier de secours et reprend telles quelles ses étiquettes « régime » et « allergènes ». Aujourd'hui, aucune recette n'est concernée (0 sur 248). La correction a été essayée cette nuit, puis retirée : à faire avec des tests dédiés (zone la plus sensible de l'app). En attendant, consigne pour Grok : aucune étiquette de régime ni d'allergène dans `donnees/recettes.json`.

**f. `donnees/` est lu en direct sur `main`** (lié au point 7) : un changement dans `donnees/` arrive chez les clients sans passer par le banc. Option : figer l'adresse sur un commit relu (30 min pour Claude). Ta décision.

**g. Questions qui attendent ta réponse** : les textes « ton espace » du parcours (rien n'a été changé cette nuit) ; « Supprimer mon compte » qui efface le marqueur de l'appareil (`docs/MISSION-V72.md`) ; les 10 axes du module 5 et 4 défis de la Formation restés en français en anglais (choix d'une version passée, verif66) : les veux-tu en anglais ?.

---

## Déjà fait cette nuit (rien à faire)

Voir `docs/mission-nuit/RAPPORT.md` : audit de sécurité (92 constats, 50 confirmés, 3 plausibles, 39 pour information, aucun réfuté), v86 sécurité, v87 vidéos des exercices, v88 rappel de l'accord santé, v89 qualité, v90 « J'ai fait cette séance ✓ ».
