# MISSION DE NUIT — environ 10 h en autonomie : sécurité, audit, corrections, compléments

Mission validée par Lucas. Il dort, puis il prend l'avion pour la mine : il ne pourra pas réparer quoi que ce soit pendant plusieurs jours.
**La règle n°1 de cette nuit : l'app doit être au moins aussi stable au réveil qu'au coucher.** Mieux vaut 3 lots propres en ligne que 6 lots fragiles.

## ⚠️ Autonomie complète, sans t'arrêter
- Tu travailles seul environ 10 h, sans pause, sans attendre de validation et sans poser de question : tu enchaînes les lots dans l'ordre.
- C'est une exception explicite à « une étape à la fois » de CLAUDE.md, valable seulement pour cette mission. Note-la en une ligne dans CLAUDE.md au début et retire-la à la fin.
- Lucas demande explicitement, pour cette mission : les agents (security-reviewer, silent-failure-hunter, code-reviewer, e2e-runner), de nouveaux tests, le banc GitHub et des captures.
- Pour un doute : choisis l'option la plus simple et la plus sûre, note-la dans le rapport et continue.
- **Un lot bloqué ne bloque pas la nuit.** Si un lot ne passe pas (test rouge après 2 tentatives, risque pour les données, trop gros) : rien sur main pour ce lot, tu gardes sa branche, tu le notes et tu passes au lot suivant.
- Prends le temps de bien réfléchir avant chaque changement : lis le code concerné en entier, vérifie toi-même ce que disent les agents.

## 0. Démarrage
1. Lance `caffeinate -dims &` pour que le Mac ne se mette pas en veille de la nuit.
2. Copie ce fichier dans docs/mission-nuit/MISSION.md (premier commit).
3. Fais les vérifications de démarrage de CLAUDE.md. Dernier commit attendu sur main : bec2408 (v85).
4. Crée ton fichier de progression hors du dépôt (fait / en cours / suivant, heure de début). Relis-le après chaque compression du contexte.
5. Lis CLAUDE.md, docs/HANDOFF-CLAUDE-CODE.md (les sections utiles), docs/maj-bloc-3/RAPPORT.md et docs/maj-bloc-4/RAPPORT.md.

## Règles de toute la nuit
- Toutes les règles de CLAUDE.md restent valables : zéro perte de données, dépôt public, « ton coach » et jamais « Lucas », aucun prix, FR + EN, aucune nouvelle librairie ni nouveau service, tout reste gratuit, ne jamais toucher à donnees/, pas de alert/confirm natifs.
- **Un lot = une version** (v86, v87, …) :
  - branche v2/<nom> dans un worktree, petits commits en français ;
  - fusion dans main seulement si le banc GitHub est vert ;
  - après la publication, vérifie le pied de page et ouvre le site sans erreur ;
  - puis passe au lot suivant.
- **Si une version en ligne casse le site** : `git revert` vers la dernière version qui marchait, push tout de suite (règle de CLAUDE.md), note-le, puis continue avec les lots suivants depuis la version saine.
- Base simulée uniquement : aucun vrai compte, aucune écriture dans Supabase.
- Tout le banc reste vert. Ne supprime ni n'affaiblis jamais un test.
- Chaque correction de bug ou de faille a un test qui échoue sur la version d'avant.
- Machine : MacBook Air. Au plus 2 suites de tests locales en même temps. Les agents de lecture peuvent tourner en parallèle sans souci : sers-toi largement des agents pour lire, chercher et relire, et garde l'écriture du code pour toi.
- **Ce que tu ne fais jamais cette nuit** (à mettre dans le rapport « à faire avec Lucas ») :
  - écrire dans Supabase (schéma, données, RLS, fonctions, réglages) ou appliquer supabase/v78-limites/ ;
  - remplir la clé Turnstile, changer `inscription_libre` ou un interrupteur de nouveauté ;
  - faire un push forcé, réécrire l'historique Git ou toucher aux secrets ;
  - retirer l'exécution de `est_coach()`, `est_client()` ou `noter_connexion()` ;
  - changer les textes « ton espace » du parcours (Lucas décidera) ;
  - créer un service serveur (par exemple « Générer un mot de passe » d'un compte existant).
- **Horaire** : après environ 8 h 30 de travail, ne commence plus de nouveau lot. Termine celui en cours ou abandonne-le proprement, puis passe à la fin de mission.

---

## LOT 1 — v86 : sécurité (priorité absolue)
**Audit en lecture seule** avec security-reviewer, silent-failure-hunter et code-reviewer. Vérifie toi-même chaque point. À regarder en priorité :
1. **Les textes écrits par un inconnu et affichés** (prénom, « Avec ses mots », réponses du parcours, notes, retours de la semaine, aliments du journal, nom de programme) : partout échappés (innerHTML, attributs, titres).
2. **Les liens fabriqués avec des données** (wa.me, tel:, Calendly pré-rempli, `?ref=`, vidéos) : encodage correct, aucune redirection vers un site choisi par quelqu'un d'autre.
3. **L'export CSV** : une cellule qui commence par = + - @ ne doit jamais devenir une formule.
4. **Ce qui est gardé sur le téléphone** (localStorage, sessionStorage) : jamais de mot de passe ; rien de sensible qui reste après « Se déconnecter ».
5. **Les sessions** : jeton expiré, compte supprimé ou archivé, prospect ou client qui ouvre une page coach par son adresse.
6. **Le dépôt public** : aucun secret, email réel ou nom de client, y compris dans docs/maj-bloc-3, docs/maj-bloc-4 et leurs captures. Le garde du dépôt doit couvrir ces dossiers.
7. **Les règles RLS** décrites dans supabase/ (lecture seule) : quelqu'un peut-il lire ou écrire les données d'un autre, ou une clé coach-seul ? Un problème trouvé = rapport, pas de correction.
8. **Les écritures qui échouent sans bruit** : une sauvegarde ratée doit toujours être dite à la personne.
9. **Les points propres à Supabase** (lecture des fichiers de supabase/ seulement, rien n'est appliqué) :
   - les fonctions `security definer` ont un `search_path` fixé ;
   - la fonction creer-acces vérifie bien que l'appelant est le coach ;
   - aucune table n'a RLS désactivé ;
   - le bucket des photos est privé, avec ses règles d'accès ;
   - la clé « service_role » n'apparaît jamais côté app (la clé anon dans l'app, c'est normal).
   Les réglages qui ne se voient que dans le tableau de bord Supabase vont dans le rapport « à faire avec Lucas » : longueur minimale du mot de passe, protection contre les mots de passe divulgués, limites d'envoi d'emails, URL de redirection autorisées.

**Corrections** : seulement dans index.html, css/ et js/, sans changer ce que voit un client normal. Les tests vont dans une nouvelle suite verif88, inscrite au banc.

**Faille critique** que seul Supabase peut fermer : n'essaie pas de la contourner. Mets-la en première ligne du rapport, puis continue les autres lots.

## LOT 2 — v87 : vidéos des exercices des programmes
Base : docs/maj-bloc-4/RAPPORT.md (tableau et liste « à préciser »).
1. **Corrige** « Burpees » dans les HIIT et circuits : ce n'est pas « Burpees contrôlés (sans saut) ». Sans vrai équivalent, pas de vidéo.
2. **Propositions de Claude (Cowork), à vérifier une par une** avec la fiche de l'exercice dans l'app (exécution, matériel). Applique seulement si c'est vraiment le même mouvement :
   - Soulevé de terre jambes tendues → Soulevé de terre roumain
   - Hip thrust à l'haltère → Hip thrust
   - Rowing → Rowing barre
   - Extension mollets → Mollets debout
   - Vélo elliptique ou tapis de marche → Vélo elliptique
   - Développé militaire avec haltères → Développé haltères assis
   - Squat avec haltères → Squat goblet
   - Fentes avant → Fentes haltères
   - Fentes latérales → Fentes latérales haltère
   - Fentes statiques haltères → Fente statique courte
   - Step-ups avec haltères / sur une chaise → Step-up bas (marche d'escalier)
   - Peck deck → Écartés poulie vis-à-vis
   - Triceps kickback avec haltères → Kickback poulie
3. **Revois aussi la liste « à vérifier en priorité »** du rapport (Tractions assistées, Dips sur banc, Curl barre EZ…) avec la même règle.
4. **Exercices encore sans vidéo** (jumping jacks, box jump, squats sautés, planche dynamique…) :
   - Une vidéo s'ajoute seulement si tu la trouves sur la chaîne YouTube AZEOO (la source déjà utilisée par l'app) et que son titre correspond clairement au mouvement.
   - Le lien va dans les données des programmes, dans js/, jamais dans donnees/.
   - Le moindre doute : pas de vidéo.
5. **Rapport du lot** : le tableau « avant → après » et ce qui reste sans vidéo.

## LOT 3 — v88 : redemander l'accord santé aux comptes déjà inscrits
C'est la demande de Lucas du 13/10, notée dans CLAUDE.md, « À faire ensuite ». Aujourd'hui, un accord donné vaut pour toutes les versions (`Sante.accordDans`).
- Lis d'abord tout ce qui existe : la confidentialité, `Sante.accordDans`, l'écran d'accord actuel, docs/MISSION-V72.md et MISSION-V78.md.
- Un compte dont l'accord santé date d'avant la version actuelle des textes voit **une seule fois** un écran court, dans le style de l'app :
  - le lien vers la politique de confidentialité ;
  - « J'accepte » : la nouvelle version de l'accord est enregistrée avec sa date, au même endroit que l'accord actuel ;
  - « Plus tard » : rien ne change pour lui (son accord d'avant reste valable). L'écran revient au plus tôt 7 jours après.
- **Personne ne perd l'accès à ses données ni à ses outils.** Aucune donnée n'est effacée. Les comptes créés avec l'accord actuel ne voient rien.
- Le coach ne voit jamais cet écran.
- Si tu ne trouves pas où ranger la nouvelle date sans migration : STOP sur ce lot seulement, rapport, lot suivant.

## LOT 4 — v89 : qualité générale (sans rien redessiner)
Audit avec code-reviewer et des agents de lecture, puis corrige seulement ce qui est sûr :
1. Les vrais bugs trouvés : un bouton qui ne fait rien, une erreur dans la console, un écran vide, un retour qui perd la position.
2. Les écritures qui échouent sans bruit, s'il en reste après le lot 1.
3. **Les traductions** : chaque phrase visible en français a son anglais (anglais américain) dans I18N.en.
4. **Les textes interdits** : aucun « Lucas » visible côté prospect ou client, aucun prix, plus de « 14 jours », plus de « Speed Formation ».
5. **L'accessibilité** : zones tactiles d'au moins 44 px, labels des champs, aria-label des boutons-icônes, contraste du texte (4,5:1), version sans mouvement.
6. **Le hors-ligne** : chaque écran qui lit la base dit « Pas de connexion » avec « Réessayer », jamais un faux écran vide.
7. **La performance** : au plus 4 éléments flous par écran, aucun fichier inutile chargé.

Ne retire aucune fonction, aucun écran et aucun réglage. Pour une idée plus grosse, ne la code pas : note-la dans le rapport.

## LOT 5 — v90 : « J'ai fait cette séance » (programmes de la formation)
Seulement si les lots 1 à 4 sont terminés et qu'il reste au moins 2 h avant les 8 h 30.
- Sur l'écran d'une séance des programmes de la formation, un bouton « J'ai fait cette séance ✓ » enregistre la date.
- La page programme montre « Fait le … » à côté de la séance, et « N séances faites cette semaine ».
- Rangement : une clé à part, à la personne, sans migration (par exemple `seances_formation`). Ajoute-la aussi à la liste des clés de supabase/v78-limites/, dans les fichiers du dépôt seulement, pour qu'elle passe le jour où Lucas appliquera ces limites. N'applique rien.
- **Ne touche pas** au compteur de la semaine ni à la régularité du programme fait par le coach.
- Le coach voit « Séances de la formation faites (30 j) : N » dans l'onglet Suivi de la fiche.
- FR + EN, tests dans une suite verif89.

## LOT 6 — préparer le travail avec Lucas (documents seulement, pas de version)
- Mets à jour docs/V78-A-APPLIQUER-DEMAIN.md, ou crée docs/A-FAIRE-AVEC-LUCAS.md, avec la liste à jour, du plus important au moins important :
  - les points Supabase trouvés cette nuit ;
  - les limites d'écriture ;
  - Turnstile ;
  - la sauvegarde de la base ;
  - le nettoyage de l'historique.
- Pour chacun : quoi, pourquoi, temps estimé, et la marche à suivre pas à pas, en français simple.

---

## Fin de mission (obligatoire, même si des lots ont été abandonnés)
1. Vérifie que main est vert, que le site s'ouvre sans erreur et que le pied de page affiche la dernière version. Si un doute existe sur une version en ligne, reviens à la dernière version sûre.
2. Retire la ligne d'exception de CLAUDE.md. Mets à jour « En ligne » et « À faire ensuite », et ajoute une ligne par version dans docs/HISTORIQUE.md.
3. Arrête `caffeinate`.
4. Écris le rapport dans docs/mission-nuit/RAPPORT.md et dans le chat. Il doit être court, en français simple, lisible sur un téléphone :
   1. **En une phrase** : l'app est-elle stable et sûre ce matin ?
   2. Les versions en ligne (numéro, commit, ce qui change en une ligne).
   3. Les lots abandonnés ou incomplets, et pourquoi.
   4. Sécurité : le tableau des problèmes (gravité, quoi, corrigé oui ou non).
   5. **À faire avec Lucas** : les 5 points les plus importants, du plus grave au moins grave.
   6. Au maximum 5 points à tester sur le téléphone, avec le lien, et seulement les plus utiles.
   7. Les choix faits seul.
