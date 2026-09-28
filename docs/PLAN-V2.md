# PLAN V2 — Plateforme MHX (validé par Lucas le 28/09/2026)

## Reprise après une coupure (à lire en premier)
Une nouvelle conversation reprend en lisant seulement `CLAUDE.md` et ce fichier.
- **Mode de travail** : mission autonome donnée par Lucas le 28/09/2026 (résumée juste en dessous). On enchaîne sans lui présenter de plan ; les questions pour lui vont dans « Questions pour Lucas » en bas de ce fichier, et on continue sur le reste.
- **Où en est le travail** : la dernière case cochée ci-dessous. La ligne « En cours » dit sur quoi on travaillait, sur quelle branche, et ce qu'il restait à vérifier.
- **Branches** : chaque étape se fait sur une branche locale `v2/…`, fusionnée dans `main` (avance rapide) quand tout est vert. `attente/nuit-28-09` = travail de la nuit du 28/09 mis de côté, jamais poussé (on y reprend les corrections utiles, voir Chantier 1).
- **Avant de reprendre** : `git status`, `git log --oneline -10 --all`, relire la ligne « En cours », relancer le banc (`tests-locaux/README.md`) sur la branche en cours.
- **En cours** : v52 en ligne (`b937eb1`). **Chantier 1 bis** (découpage d'`index.html`, 52.1) **fait et vert sur la branche `v2/decoupage`** (banc GitHub vert sur `0d98147`, passage 36377727430, en 25 min environ) ; reste à le publier seul (fusion dans `main`, vérification en ligne : aucun fichier `css/` ou `js/` en 404). Ensuite v53.

## Ligne directrice (Lucas, 28/09/2026 au soir) — remplace ses messages de décision précédents
**Simple, efficace, opérationnel.** Travail en continu : tout s'enchaîne sans s'arrêter ni attendre Lucas entre les lots, les chantiers ou les versions. Une question se pose : prendre l'option la plus prudente, la noter ici (« Questions pour Lucas ») et continuer. S'arrêter seulement pour un vrai risque sur les données des clients. Ne rien retirer aux tests ni aux relectures.
1. **Emails : rien pour l'instant.** Pas de vérification d'email, pas de SMTP, aucun email envoyé par l'app (Lucas s'en occupera plus tard). « Mot de passe oublié » affiche : « Écris-nous à mhx.coaching@gmail.com, on te débloque rapidement. » Aucun réglage changé dans Supabase par Claude.
2. **Bouton bilan : aucune connexion à Calendly.** Un simple bouton « Réserver mon bilan » vers le lien que Lucas règle lui-même (sans nouvelle table si possible) ; pré-remplissage du nom gardé s'il est déjà fait.
3. **Newsletter : aucun envoi.** La case (décochée) et son retrait dans le Profil arrivent ensemble en v52 (réutiliser la v51).
4. **Reporté après l'ouverture** : les 3 cartes (lot F) et l'écran d'acceptation Q6.
5. **Deux versions seulement** : **v52** = chantier 1 (lots A à E + G), sans la partie clients et coach du lot D — c'est elle qui permet d'ouvrir l'inscription ; **v53** = partie clients et coach du lot D (calculateur client, « Mon journal », « Ses séances ») + chantiers 3 et 4 + liste newsletter en CSV + compteur.
6. Dès que B et C sont finis : D, E et G en parallèle.
7. En v53, on garde « Mon journal », les alertes du feedback et « À traiter ».
8. Retirer les vérifications obsolètes de verif49 et ce qui devient inutile (fonction emails v51 et sa lecture côté coach, tuile « Prospects en découverte », mode test « jour 8 »), sans toucher aux données.
**Mise à jour (Lucas, avant la v52)** : banc sur GitHub seulement (branches `v2/*` poussées pour tests, 10 parties, runner `ubuntu-24.04`) ; suites de fonctions supprimées en HORS_BANC au lieu de les réécrire (garder ce qui protège les clients) ; preuve « échoue sur l'ancienne version » seulement pour données et accès ; une seule relecture, corrections bloquantes seulement (le reste en liste) ; nettoyage en v53 sauf s'il bloque la v52 ; notes Grok / HANDOFF / NOTESCLAUDE seulement à la v52 et à la fin de la v53.
Quand la v52 est en ligne : envoyer à Lucas la marche à suivre pour ouvrir l'inscription (une étape à la fois, avec les liens), puis enchaîner directement sur la v53.

## Mission autonome (Lucas, 28/09/2026) — règles qui complètent CLAUDE.md
En cas de doute, ces règles passent avant `CLAUDE.md` (et la ligne directrice ci-dessus passe avant elles).

**Ne doit JAMAIS arriver**
- Un client réel perd une donnée ou voit son app cassée.
- Un email part vers un vrai client ou prospect. Aucun envoi par l'app (ligne directrice, point 1).
- L'inscription publique s'ouvre (`inscription_libre` reste `false` : Lucas l'ouvrira lui-même).
- Une nouveauté qui remplace une habitude des clients (le bilan) leur apparaît avant que Lucas l'active. Les petits ajouts (un onglet en plus, une correction de bug) peuvent partir directement.
- Un service ou une option payante.

**Ordre** : Étape 0 → Étape 1 → **v52** (chantier 1 : lots A à E + G, partie prospect du lot D) → **chantier 1 bis** (découpage d'`index.html`, version 52.1 sans nouveauté) → **v53** (partie clients et coach du lot D, chantier 3 puis chantier 4, liste newsletter en CSV, compteur). Le 3 passe avant le 4 : le tableau de bord coach a besoin des données du feedback.

**Règles de travail**
- Simple avant tout : réutiliser l'existant (Store, UI, Regularite, Journal, Historique, questionnaire, générateur de diète, séance découverte, recettes). Pas de nouvelle bibliothèque, pas de nouveau fichier sans nécessité.
- Données : les nouvelles infos vont si possible dans la TABLE Supabase `donnees` (JSON, sans migration) — à ne pas confondre avec le DOSSIER `donnees/` du dépôt, réservé à Grok Bot, jamais touché. Sinon : migration non destructive, sauvegarde et comptage avant/après. Le compte de test peut être modifié librement ; les données d'un vrai client jamais ; les anciennes données restent lisibles.
- Chaque chantier : banc de tests à jour (nouveaux tests pour ce qui est ajouté), vérification téléphone et ordi, relecture par des vérificateurs indépendants, corrections, puis un commit et un push. Version incrémentée (52, 53…).
- Toute nouvelle phrase côté client a sa traduction dans `I18N.en`. Pas de `alert`, `confirm`, `prompt` natifs.
- Après chaque chantier : note courte dans `NOTESCLAUDE.md` pour Grok Bot avec 5 à 10 tests à faire sur le compte de test ; mise à jour de « État actuel » dans `CLAUDE.md`.
- Ne toucher ni au dossier `donnees/`, ni aux tâches Cowork, ni à Notion.
- Tant que le push n'est pas autorisé : commits locaux, et push dès que possible.

**Organisation du temps (Lucas, 28/09)** : pendant le développement, seulement les suites touchées ; le banc complet une seule fois par chantier, juste avant la fusion dans `main`. GitHub Actions : banc découpé en 4 jobs parallèles (même exigence : la publication attend les 4). Ne pas attendre la fin des tests en ligne pour avancer : pousser, enchaîner, puis vérifier (retour arrière si rouge). Au plus 2 bancs en même temps sur le Mac, isolés (copie du dépôt, ports différents). Vérificateurs indépendants seulement pour ce qui est risqué (données, accès, ce que voient les clients), un seul par sujet, aucun pour les documents. Partie documents du chantier 2 en parallèle du chantier 3. Mise à jour du 28/09 : paralléliser tout ce qui peut l'être (lots indépendants, relectures), 2 bancs au plus ; banc complet une seule fois par version, juste avant la mise en ligne ; réutiliser l'existant ; notes courtes, pas de perfectionnisme sur les documents.

**Quand s'arrêter** : seulement si une donnée réelle risque d'être perdue, si un comptage ne tombe pas juste, ou si un test reste rouge après correction. Pour tout autre besoin de Lucas (un clic, un identifiant, un choix) : noter la question en bas de ce fichier et continuer.

**Résumé final (un seul, en langage simple)** : ce qui change pour le prospect, le client et le coach ; ce qui est en ligne et ce qui attend derrière l'interrupteur ; ce que Lucas doit faire, dans l'ordre, avec les liens (réglages, test sur son téléphone, activation du feedback pour tous, étapes du chantier 2) ; le message WhatsApp pour ses clients ; les commandes de retour arrière ; les idées non codées.

## Principes
- L'app sert à la fois d'aimant à prospects, de funnel et de suivi client.
- Le gratuit, c'est l'outil. Le payant, c'est le coach.
- Aucun prix dans l'app : on propose seulement un bilan en call (Calendly).
- Aucun piège : pas de fausse urgence, pas de case pré-cochée, le bouton « Pas maintenant » aussi visible que le bouton principal.
- Tableau de bord et écrans : clairs, 2 clics maximum, couleur seulement pour les alertes, pensés téléphone d'abord.

## Étape 0 — Plan à jour (documents uniquement)
- [x] Précisions de Lucas du 28/09 ajoutées, chaque point transformé en case à cocher, section de reprise.

## Étape 1 — Filet de sécurité
- [x] a. *(vérifié le 28/09 : `9429e43`, 4 parties vertes en 9 min, publication en 26 s)* Workflow GitHub Actions (gratuit, dépôt public) : à chaque push sur `main`, le banc `tests-locaux` tourne ; le site n'est publié sur GitHub Pages que si tout est vert. Le site publié contient exactement les mêmes fichiers qu'aujourd'hui. Le banc n'écrit jamais dans la vraie base.
- [x] b. *(Q1 validée et posée ; « Mise en ligne » de `CLAUDE.md` à jour)* Proposer à Lucas une seule modification de `.claude/settings.local.json` qui autorise uniquement « git push origin main » (il la valide). Mettre à jour « Mise en ligne » dans `CLAUDE.md` : push seulement si les tests sont verts, un push par chantier, jamais pour ouvrir l'inscription ni pour passer un interrupteur sur « tous ».
- [x] c. *(source passée sur « GitHub Actions » par Lucas ; première publication `9429e43` : les 106 adresses du site répondent comme avant, chaque fichier servi = celui du commit, mêmes pages .md converties, `.github` non publié ; seul ajout : `tests-locaux/banc.sh`)* Pousser le workflow, puis demander à Lucas de passer la source de GitHub Pages sur « GitHub Actions » (https://github.com/lcsmhx/mhx-plateforme/settings/pages). Vérifier ensuite qu'une publication passe et que le site en ligne est identique.
- [x] d. *(codé au chantier 1, lot A : `CONFIG.nouveautes` + objet `Interrupteurs` ; en ligne avec la v52)* Interrupteur simple dans `CONFIG` pour les nouveautés qui remplacent une habitude des clients : « off » / « test » / « tous ». En « test », seuls le compte client de test (identifié par son id dans le code, jamais par son email en clair) et le coach les voient ; les autres clients gardent l'ancienne version. Le chantier 3 démarre en « test ».
- [x] e. *(fait pour `9429e43` : écran de connexion en format téléphone, version « 2026-09-27 · 51 », aucune erreur de console, `#/inscription` reste fermé)* Après chaque mise en ligne : ouvrir le site en ligne en format téléphone et vérifier la connexion, le numéro de version et les pages principales. Si quelque chose casse : retour arrière immédiat (`git revert` + push) et note.

## Chantier 1 — Parcours prospect
- [x] 1. Inscription : prénom, NOM (nouveau champ), email, mot de passe. *(28/09 soir : sans vérification d'email pour l'instant, aucun email envoyé ; le code qui gère la vérification reste en place pour plus tard.)* **v52**
   - [x] « Mot de passe oublié » : « Écris-nous à mhx.coaching@gmail.com, on te débloque rapidement. » (aucun email) ; changement d'adresse email dans le Profil : même principe. **v52**
- [x] 2. Cases séparées à l'inscription :
   - [x] CGU + politique de confidentialité (obligatoire).
   - [x] Données de santé : garder la case séparée existante ; enregistrer la date et la version du texte.
   - [x] Newsletter (facultative, décochée par défaut), texte : « Je veux recevoir par email les conseils, témoignages et offres de coaching de MHX Coaching (1 à 2 emails par semaine maximum). Désinscription en 1 clic dans chaque email. » Remplace l'actuelle case « rappels liés à ma découverte ». Enregistrer la date et la version du texte.
- [x] 3. Juste après l'inscription, 3 questions (remplacent les 10 actuelles ; les anciennes réponses déjà enregistrées restent lisibles) :
   - Problème : « Quel est ton objectif principal ? » (perdre du gras / prendre du muscle / me remettre en forme)
   - Obstacle : « Qu'est-ce qui t'a bloqué jusqu'ici ? »
   - Projection : « Dans 3 mois, qu'est-ce qui aurait changé pour toi ? »
   - [x] Précision : les 3 questions sont posées juste après la vérification d'email. Leurs réponses alimentent la page bilan et la fiche coach du prospect.
- [x] 4. Page de proposition de bilan : reprend sa réponse « projection ». Texte : « Ton bilan offert de 30 minutes avec un coach MHX. On fait le point sur ton objectif, ce qui te bloque et ce que tu as déjà essayé. Tu repars avec 2 ou 3 actions concrètes. Si l'accompagnement personnalisé te correspond, on te le présente à la fin de l'appel. Tu es libre de dire non. » Boutons : « Réserver mon bilan » et « Pas maintenant, découvrir mon espace ». **v52**
   - [x] Bouton « Réserver mon bilan » : un simple lien, sans connexion à Calendly ; le lien est réglé par Lucas en un seul endroit : `CONFIG.marque.calendly`, en haut de `index.html` (seul endroit lisible par un prospect sans nouvelle table : voir Q9) ; pré-remplissage prénom, nom, email gardé (paramètres du lien, sans effet si le lien n'est pas Calendly).
- [x] 5. Accueil prospect : une seule action mise en avant au départ, « Calcule tes calories (2 min) », puis « Enregistre ta pesée de départ ».
- [x] 6. Gratuit pour toujours : calculateur (onglet ouvert au prospect), suivi poids et mensurations, Speed Formation. Supprimer la limite de 7 jours partout, textes compris (« Crée ton accès découverte — 7 jours… »).
   - [ ] Précision : un client voit au moins tout ce que voit un prospect : le calculateur et le journal d'entraînement doivent lui être accessibles. *(Cause : le calculateur est le réglage du coach ; le journal des clients est dans « Mon programme », l'onglet « Journal d'entraînement » est l'outil du coach.)* **v53** (partie clients et coach du lot D : calculateur client avec sa propre clé, onglet « Mon journal », lien coach « Ses séances » vers ce journal).
- [x] 7. Pages verrouillées (programme, nutrition, journal, suivi) : un échantillon générique, puis « Tu veux un programme construit pour toi, qui évolue chaque semaine ? Réserve ton bilan. » Programme : la séance découverte existante. Nutrition : une journée type d'exemple (réutiliser le générateur ou les recettes existantes).
- [ ] 8. **Reporté après l'ouverture (ligne directrice, point 4).** Cartes dans l'app (pas d'emails) : poids stable (± 0,3 kg) sur 14 jours → carte « Ton poids stagne… » + bilan ; 3e visite d'une page verrouillée → rappel de sa réponse « problème » + bilan ; Speed Formation terminée → proposition de bilan.
- [x] 9. Bug : sur téléphone, après connexion, le Profil s'ouvre déjà défilé et l'encadré « Bienvenue ! » est coupé sous l'en-tête.
- [x] 10. Garder le garde-fou 18 ans et la mention « pas un avis médical » existants. (Q7 : garde-fou au calculateur ; case des conditions « J'ai 18 ans ou plus et j'accepte… »)
- [x] 11. Bug mineur : un client qui ouvre une page coach (par exemple `#/calculateur`) voit l'Accueil, mais l'adresse ne change pas.
- [x] 12. Branche `attente/nuit-28-09` : reprendre les corrections utiles (messages d'erreur en français, session après changement d'adresse, erreurs du Profil). Laisser ce qui concerne l'envoi des emails (aucun email pour l'instant).
- [x] 13. *(fait avant la v52 : `ubuntu-24.04`, checkout v7, setup-node v7, upload-artifact v7, configure-pages v6, upload-pages-artifact v5, deploy-pages v5)* GitHub Actions (demande de Lucas du 28/09, à faire à la fin du chantier, sans interrompre les lots) : dans `.github/workflows`, figer le runner sur `ubuntu-24.04` au lieu de `ubuntu-latest` (passage à Ubuntu 26 le 19 octobre) et mettre à jour les actions qui tournent encore sous Node.js 20 ; vérifier que le banc reste vert sur GitHub.
- [ ] 14. Nettoyage (ligne directrice, point 8) : retirer le mode test « jour 8 » et la tuile « Prospects en découverte » (lot D) ; retirer la fonction d'emails v51 (`supabase/functions/emails-prospects`, sa migration jamais appliquée, `desinscription.html`, son test dans le banc), sans toucher aux données. **v52** — la lecture côté coach (journal des emails, bonus du score) part avec le score en **v53**.
- [x] *(v52 en ligne le 28/09 : `b937eb1`, banc GitHub 10/10 vert, relecture unique : 1 bloquant corrigé — objectif d'un ancien client —, vérification en ligne sur téléphone : version 52, « Mot de passe oublié » → message, inscription fermée, aucune erreur de console ; marche à suivre envoyée à Lucas)* Fin de la v52 : banc à jour et vert, téléphone + ordi, relecture indépendante, version 52, note Grok (5 à 10 tests), « État actuel », commit, push, vérification en ligne, puis marche à suivre d'ouverture envoyée à Lucas (une étape à la fois, avec les liens).

## Chantier 1 bis — Découpage d'index.html (validé par Lucas le 28/09) — version **52.1**, sans aucune nouveauté
Commence dès que la v52 est en ligne ; on enchaîne ensuite sur la v53 sans attendre Lucas.
- [x] Déplacer, jamais réécrire : zéro changement de logique, même ordre de chargement, scripts classiques (pas de modules), démarrage de l'app en dernier. (28/09 : concaténation des 3 fichiers `css/` = ancien `<style>` et des 32 fichiers `js/` = ancien `<script>`, octet pour octet, hors la ligne de version.)
- [x] Aujourd'hui tout est dans un seul `<script>` : toutes les fonctions existent dès le chargement. Une fois découpé, ce n'est plus vrai : vérifier qu'aucun code exécuté au chargement n'utilise une fonction ou une variable d'un fichier chargé plus tard. Même mode (strict ou non) dans chaque fichier. (28/09 : `tests-locaux/niveau-haut.js`, au banc : aucun problème ; non strict partout, comme avant.)
- [x] `index.html` garde le HTML ; le CSS va dans `css/`, chaque outil dans `js/` (ex. `js/outilNutrition.js`), avec `?v=<version>` sur chaque lien ; le numéro vient d'un seul endroit, et le banc vérifie que tous les liens l'ont. (28/09 : `MHX_FICHIERS` en tête d'`index.html` ; `rig.js` vérifie chaque page.)
- [x] Banc adapté à la nouvelle structure (serveurs de `rig.js` et `flux.js`, suites qui lisent `index.html`). (28/09 : `tests-locaux/fichiers.js`, tous les nombres attendus inchangés.)
- [x] Preuve : banc complet vert, écrans identiques à la v52 (verif52 + captures de `rig.js`), aucune erreur de console en plus de celles de la v52. (28/09 : 75 captures sur 81 identiques à l'octet près à un passage de la v52, les 6 autres à moins de 700 pixels et 25/255, moins que l'écart entre deux passages de la v52 ; console : les mêmes 6 messages.)
- [ ] Limite : 3 h. Si ce n'est pas vert et identique après correction, ou au bout de 3 h : abandonner le découpage, garder la v52 et passer à la v53 (le noter ici).
- [ ] Publier seul (version 52.1, aucune nouveauté) ; vérification en ligne : aucun fichier `css/` ou `js/` en erreur 404.
- [x] Mettre à jour `CLAUDE.md` et `docs/HANDOFF-CLAUDE-CODE.md` (carte des fichiers), et une note pour Grok dans `NOTESCLAUDE.md`.
- [ ] Après le découpage : paralléliser davantage la v53 (un agent par fichier).

## Chantier 3 — Feedback du dimanche (remplace le bilan du vendredi) — **v53**
Démarre derrière l'interrupteur en « test » (Étape 1 d) : les autres clients gardent le bilan du vendredi tant que Lucas ne passe pas l'interrupteur sur « tous ».
- [ ] Le dimanche : « Selon toi, comment as-tu travaillé cette semaine ? » (note sur 10), puis 3 cases : Training, Alimentation, Autre.
- [ ] Réponse du coach juste en dessous, au même endroit.
- [ ] Smiley 😞 😐 😊 sur la réponse du coach (facultatif, 1 clic). Si 😞 : « Qu'est-ce qui ne t'a pas plu ? » et « Qu'est-ce que je peux améliorer pour toi ? », qui remontent en priorité chez le coach.
- [ ] Historique visible. Rappel le dimanche. Alerte au client quand le coach a répondu.
   - [ ] Précision : rappels et alertes dans l'app seulement : un bandeau le dimanche, un badge quand le coach a répondu (aucun email).
- [ ] Les anciens bilans restent lisibles, rien n'est supprimé.
- [ ] Bug : le lundi, le bilan porte encore sur la semaine passée et dit « avant dimanche soir ».
- [ ] À vérifier : où les clients notent leurs séances (le journal d'entraînement semble caché aux clients).
- [ ] Précision : note en chute = note de 5 ou moins, ou 2 points de moins que la semaine précédente.
- [ ] Préparer un court message WhatsApp que Lucas enverra à ses clients pour expliquer le nouveau feedback du dimanche. Il annonce aussi le suivi des visites (Q4). (L'écran d'acceptation Q6 est reporté après l'ouverture.)

## Chantier 4 — Côté coach — **v53**
- [ ] Tableau de bord : 2 tuiles seulement, Clients et Prospects, avec les urgences en badge.
- [ ] Clients : retour du dimanche (à traiter / fait), note, dernier smiley, dernière visite, jours actifs sur 30 jours. Les 😞 et les notes en chute en haut. Alerte si la note chute.
- [ ] Prospects : date d'inscription, 3 réponses, bilan réservé ou pas, newsletter oui / non, dernière visite, jours actifs. Retirer le score sur 100 et la température CHAUD / TIÈDE / FROID.
- [ ] Bilan réservé : le coach le coche lui-même en un clic dans la fiche du prospect. Pas de liaison automatique avec Calendly (payante).
- [ ] Précision : jour actif = un jour où la personne a ouvert l'app, pas une connexion. Suivi des visites (dernière visite, jours actifs sur 30 jours) aussi pour les clients.
- [ ] Précision : garder le bouton « Passer client » : c'est lui qui donne l'accès complet après la vente.
- [ ] Liste « À traiter maintenant » sous les 2 tuiles (5 lignes au plus, seulement quand elle n'est pas vide).
- [ ] Retirer le score, la température, la lecture du journal des emails (bonus « email ouvert ») et les vérifications devenues obsolètes de verif49, sans toucher aux données.
- [ ] Fin de la v53 (partie clients et coach du lot D + chantiers 3 et 4 + liste newsletter + compteur) : banc à jour et vert, téléphone + ordi, relecture indépendante, version 53, note Grok (5 à 10 tests), « État actuel », message WhatsApp, commit, push, vérification en ligne.

## Chantier 2 — Ouverture de l'inscription
Rien n'est activé ni déployé par Claude, **aucun email n'est envoyé** (ligne directrice, point 1). Lucas gérera les emails (SMTP, newsletter) plus tard.
- [ ] Case newsletter à l'inscription (texte validé, facultative, décochée), avec la date et la version du texte enregistrées. **v52** (lot B)
- [ ] Retrait de cet accord dans le Profil (date et version enregistrées). **v52** (lot B)
- [ ] Précision : accords — date et version du texte pour la case santé et pour la case newsletter. **v52** (lot B)
- [ ] Espace coach : la liste des personnes qui ont coché la case, exportable en CSV (prénom, nom, email, date de l'accord). **v53**
- [ ] Compteur simple côté coach : inscrits → 3 questions remplies → bilans réservés → clients. **v53**
- [x] Politique de confidentialité et mentions légales : brouillons avec des champs à compléter par Lucas (`docs/CONFIDENTIALITE-BROUILLON.md`, `docs/MENTIONS-LEGALES-BROUILLON.md`). *(à retoucher : plus aucun email envoyé par l'app pour l'instant)*
- [ ] `docs/OUVERTURE-INSCRIPTION.md` : marche à suivre pas à pas, **sans SMTP ni vérification d'email** (réglages que Lucas fait lui-même dans Supabase, test prospect complet par Grok, puis ouverture), avec les liens. **v52**
- [ ] Reporté après l'ouverture : écran unique d'acceptation Q6 (conditions + données de santé des clients existants).
- [ ] Vrai test prospect complet (par Grok, compte jetable) sur la nouvelle version. *(Lucas)*
- [ ] Ensuite seulement, Lucas ouvre l'inscription lui-même. *(Lucas)*

## Fin de mission
- [ ] Résumé final unique pour Lucas (voir « Résumé final » plus haut).

## Décisions encore ouvertes

## Réponses de Lucas (28/09/2026) — décisions à appliquer
- **Q1** push : validé (autorisation « git push origin main » posée dans `.claude/settings.local.json`).
- **Q2** compte de test : `9df6bb84-5a09-4bb0-a77a-b2633d842ed9` confirmé (lucasmahauxpro+test@gmail.com). Ne jamais utiliser `6cbdf770`.
- **Q3** source Pages : oui, Lucas la passe sur GitHub Actions dès qu'on le lui demande. **La publication d'urgence sert uniquement à revenir en arrière, jamais à publier du nouveau code sans tests** (écrit dans `CLAUDE.md`).
- **Q4** suivi des visites des clients : oui, derrière l'interrupteur en « test » ; l'annoncer dans le message WhatsApp.
- **Q5** emails : (a) la relance J3 va dans le flux newsletter ; (b) **les relances de vente (J3 et suivantes) s'arrêtent dès qu'un bilan est coché « réservé »** ; la newsletter hebdomadaire continue pour les prospects qui n'ont pas signé et s'arrête quand la personne devient cliente ; (c) lien de désinscription aussi dans les emails de service ; (d) page de désinscription en anglais aussi ; (e) Brevo ne permet pas de retirer le pixel : dans la marche à suivre, activer le **suivi anonyme** ; nouveau texte de la case newsletter (nouvelle version) : « Je veux recevoir par email les conseils, témoignages et offres de coaching de MHX Coaching (1 à 2 emails par semaine maximum) et j'accepte la mesure de leur ouverture. Désinscription en 1 clic dans chaque email. »
- **Q6** accords des clients existants : **à coder dans cette mission** : un écran unique d'acceptation (conditions + données de santé) à la prochaine connexion des clients qui n'ont aucun accord enregistré, derrière l'interrupteur en « test » (Lucas l'activera quand la politique de confidentialité sera finale et ses clients prévenus) ; l'annoncer dans le message WhatsApp.
- **Q7** âge : garde-fou 18 ans dans le calculateur, et l'âge intégré à la case des conditions, sans case en plus : « J'ai 18 ans ou plus et j'accepte les conditions d'utilisation et la politique de confidentialité. »
- **Chantier 2 simplifié (28/09, plus tard dans la journée)** : ni newsletter, ni relances par email, ni exemples de newsletter (Lucas gérera l'envoi plus tard). On garde la case newsletter (texte validé, date et version), le retrait dans le Profil, et côté coach la liste des personnes qui ont coché la case, exportable en CSV (prénom, nom, email, date de l'accord). Les emails d'inscription restent prévus via le SMTP de Gmail. Les réponses Q5 a, b, c, d ne s'appliquent plus.
- **Brevo et mesure d'ouverture (28/09, précision)** : la fonction d'envoi v51 reste non déployée et rien dans l'app ne l'appelle ; Brevo est retiré des brouillons légaux ; **plus de mesure d'ouverture** : case newsletter « Je veux recevoir par email les conseils, témoignages et offres de coaching de MHX Coaching (1 à 2 emails par semaine maximum). Désinscription en 1 clic dans chaque email. », nouvelle version du texte (`2026-09-28c`) enregistrée avec la date. Les exemples des pages verrouillées du chantier 1 (séance découverte, journée type nutrition…) restent : seuls les exemples de newsletter sont abandonnés.
- **Q12** : non. En cas de panne : `git revert` + push (avec le banc). La publication d'urgence reste réservée à Lucas.
- **Q10** : pour débloquer quelqu'un (mot de passe, adresse), Lucas passe par Claude chat avec Supabase connecté. Rien à coder. **Q11** : `https://calendly.com/mhx-coaching/30min` est le bon lien.
- **Chantier 1 bis validé (28/09)** : découpage d'`index.html`, entre la v52 et la v53 (voir sa section).
- **Ligne directrice du 28/09 au soir** : voir en haut de ce fichier (elle remplace les décisions précédentes quand elles se contredisent : emails, Calendly, versions, reports).
- **Décisions prises seules par Claude jusqu'au 28/09** (liste donnée à Lucas) : toutes validées. Tableau de bord : liste « À traiter maintenant » sous les 2 tuiles, 5 lignes au plus, affichée seulement quand elle n'est pas vide.

## À faire plus tard (relecture de la v52, rien de bloquant)
- Accueil du prospect : l'étape suivante (pesée) peut apparaître avec un écran de retard juste après l'enregistrement du calcul (lecture du serveur, écriture encore en attente).
- Anglais incomplet dans le contenu de la Speed Formation (descriptions des modules) et le catalogue (noms de recettes) ; case santé FR « … conformément à la politique » (compléter « de confidentialité »).
- Coach : le suivi commercial parle encore de « découverte jour n/7 » / « terminée » (retiré avec le score en v53) ; « Ses calories » d'un prospect montre `calc`, pas son `calc_perso`.
- Conditions : citer les chargements Google (polices, vignettes YouTube) ; un « 7 jours » reste dans le contenu de la Speed Formation (cours, pas une limite).
- Sauvegarde manuelle : un âge mineur tapé (jamais enregistré) peut se retrouver dans le fichier exporté par « Copier ma sauvegarde » ; à nettoyer.
- Base : seul le code empêche un client d'écrire `calc` (policy du propriétaire) ; à envisager : retirer les clés du coach des policies du propriétaire (migration, décision de Lucas).
- Navigation du coach : le calculateur a changé de place (après Ma progression) ; retour en haut de page à chaque rechargement (`scrollRestoration`) ; titre « Changer mon adresse email » au-dessus d'une simple phrase (« Mon adresse email » ?) ; code des emails gardé mais plus appelé (à retirer en v53).

## Questions pour Lucas
*(notées pendant la mission autonome ; on continue sur le reste en attendant)*
- [x] **Q1 — Autoriser le push (Étape 1 b).** Dans `.claude/settings.local.json`, une seule modification : dans `"deny"`, remplacer la ligne `"Bash(git push*)",` par les 8 lignes ci-dessous, et dans `"allow"`, ajouter `"Bash(git push origin main)",`. Les interdictions l'emportent toujours sur les autorisations : ces 8 lignes bloquent toutes les autres formes (forcer, supprimer, pousser une autre branche sur `main`, options, `git -C`), sans bloquer `git push origin main`.
  ```
  "Bash(git push)",
  "Bash(git push -*)",
  "Bash(git push * -*)",
  "Bash(git push *:*)",
  "Bash(git push *+*)",
  "Bash(git push * * *)",
  "Bash(git -C * push*)",
  "Bash(git -c *)",
  ```
  Limite connue : `git push origin <autre-branche>` n'est pas bloqué par ces lignes (il créerait une branche sur GitHub, sans rien publier : seul `main` est publié). La règle de `CLAUDE.md` l'interdit.
- [x] **Q2 — Compte client de test.** L'interrupteur « test » utilise l'identifiant `9df6bb84-5a09-4bb0-a77a-b2633d842ed9` (compte client sans prénom, créé le 25/09 ; c'est celui que les anciennes sessions utilisaient comme « compte test »). À confirmer : Supabase → Authentication → Users → cherche `lucasmahauxpro+test@gmail.com` → « User UID » doit commencer par `9df6bb84`. Sinon, donne-moi le bon (un autre compte « lucas m. », `6cbdf770…`, existe aussi).
- [x] **Q3 — Source de GitHub Pages (Étape 1 c), après le premier push du workflow.** https://github.com/lcsmhx/mhx-plateforme/settings/pages → « Build and deployment » → Source : **GitHub Actions**. Ensuite, chaque push n'est publié que si le banc est vert (environ 40 minutes après le push). Retour arrière en urgence : onglet Actions → « Tests puis publication » → « Run workflow » → cocher « urgence ».
- [x] **Q4 — Suivi des visites des clients (Chantier 4).** Tes 7 clients n'ont accepté aucun texte sur le suivi d'activité (dernière visite, jours actifs). Je le code derrière un interrupteur en « test » (compte de test seulement) : à passer sur « tous » quand tu les auras prévenus (le message WhatsApp du chantier 3 peut le dire) et que la politique de confidentialité le mentionnera (Chantier 2).
- [x] **Q5 — Emails (Chantier 2, pour la suite ; je code l'option la plus prudente en attendant).** (a) La relance « J3 » d'un prospect : email de service, de newsletter, ou supprimée ? (je la passe en newsletter) ; (b) la newsletter s'arrête-t-elle entièrement dès qu'un bilan est coché réservé ou que la personne devient cliente ? (oui, tout s'arrête) ; (c) un lien de désinscription aussi dans les emails de service ? (oui) ; (d) la page de désinscription en anglais aussi ? (oui) ; (e) Brevo gratuit : peux-tu désactiver le suivi des ouvertures (Paramètres → Suivi) ? Sans ça, la promesse « pas de pixel » ne tient pas.
- [x] **Q6 — Tes 7 clients et les accords.** Leurs comptes ont été créés par toi : ils n'ont jamais coché la case santé ni les conditions dans l'app. Veux-tu qu'ils les acceptent à leur prochaine connexion ? (non codé)
- [x] **Q7 — Âge minimum.** Les 3 nouvelles questions ne demandent plus l'âge : le garde-fou 18 ans passe au calculateur (rien n'est enregistré sous 18 ans). Veux-tu en plus une case « J'ai 18 ans ou plus » à l'inscription ? (non codé)
- [ ] **Q8 — Brouillons légaux (non bloquant, à faire par Lucas).** Dans `docs/CONFIDENTIALITE-BROUILLON.md` et `docs/MENTIONS-LEGALES-BROUILLON.md` : compléter les « [À COMPLÉTER] » (identité, statut, adresse, numéro d'entreprise, directeur de la publication) et trancher les points listés en bas de la politique (outil d'envoi de la newsletter, durées de conservation, base légale du suivi d'activité, Gmail personnel sans contrat de sous-traitance, contrats Supabase / Calendly, polices Google chargées depuis Google, CGU complètes ou non). Le test prospect par Grok (marche à suivre, étape 5) demande de choisir entre une copie locale lancée par Claude et une ouverture discrète.
- [ ] **Q9 — Où tu colles le lien du bouton « Réserver mon bilan ».** Option prudente choisie : une seule ligne en haut de `index.html` (`CONFIG.marque.calendly`, commentée « colle ici le lien de ton bilan »). Raison : un prospect ne peut lire aucune donnée du coach dans la base (règles d'accès), donc un réglage « dans l'espace coach » demanderait une petite table nouvelle, lisible par tous les comptes (migration, que je ne peux pas appliquer moi-même). Pour changer le lien : me le donner (un commit, tests, publication) ou modifier cette ligne sur GitHub. Si tu veux le réglage dans l'app, dis-le : je prépare la migration pour que tu l'appliques.
- [x] **Q10 — Débloquer quelqu'un sans email (avant l'ouverture, 2 minutes dans Supabase).** Comme l'app n'envoie aucun email, un mot de passe oublié ou un changement d'adresse se font à la main. À vérifier dans https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/auth/users : peux-tu, sur un utilisateur, taper toi-même un nouveau mot de passe, et modifier son adresse email ? N'utilise pas les boutons qui envoient un email. Si ce n'est pas possible, dis-le : je prépare une autre solution. Rappel : sans vérification d'email, quelqu'un peut s'inscrire avec l'adresse d'un autre (`docs/OUVERTURE-INSCRIPTION.md`, encadré du début).
- [x] **Q11 — Lien du bilan.** Le bouton mène aujourd'hui à `https://calendly.com/mhx-coaching/30min`. Est-ce le bon ?
