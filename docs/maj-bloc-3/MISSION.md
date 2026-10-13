# MISSION — Bloc 3 : espace coach (recherche, sélection, archivage, fiche à onglets)

Mission validée par Lucas le 13/10/2026. Lucas est absent : tu travailles en autonomie.

## 0. Avant tout
- Enregistre ce message tel quel dans docs/maj-bloc-3/MISSION.md (premier commit). Il fait foi.
- Fais les 2 vérifications de démarrage de CLAUDE.md. Dernier commit attendu sur main : 037cdc4 (v82). Si tu vois un travail récent inconnu : STOP.

## Mode de travail (exception validée par Lucas)
- Autonomie complète, push compris : tu enchaînes sans attendre de validation. C'est une exception à « une étape à la fois », valable seulement pour cette mission. Note-la en une ligne dans CLAUDE.md au début, retire-la à la fin.
- Pour cette mission, Lucas demande explicitement : de nouveaux tests, le banc GitHub et des captures avant/après.
- Toutes les autres règles de CLAUDE.md restent valables : zéro perte de données, dépôt public (aucun nom ni email réel), aucun prix, « ton coach » et jamais « Lucas », pas de alert/confirm natifs (objet UI), aucune nouvelle librairie, aucun nouveau service.
- Une seule version : v83. Branche v2/bloc-3 (worktree), petits commits en français. Tu fusionnes dans main seulement si le banc est vert, puis tu vérifies la publication et le pied de page « <date du jour> · 83 ».
- Les push ouvrent une fenêtre de confirmation. Si Lucas n'est pas là, tu attends. Ne contourne jamais cette fenêtre.
- Ne touche ni à donnees/ ni à ce qui sort du bloc 3.

## Références
- Maquettes : docs/maj-blocs-1-2/maquettes/espace-coach/ (format canevas : traduis-les en HTML, CSS et JS normaux ; {{accent}} = l'or). Captures : docs/maj-blocs-1-2/captures/espace-coach/.
- Écrans à faire : Tableau, Liste, ListeSelection, ListeConfirmation, ListeProspects, FicheSuivi, FicheCompte, Nouveau.
- Hors périmètre : AccueilClient et Progression (style déjà fait au bloc 1), et tout écran « Règles pour le code » (non validé).
- Le visuel suit la maquette. Les textes suivent la section « Textes » ci-dessous, qui remplace ceux des maquettes (par exemple, « Supprimer » devient « Archiver »). Ne reprends jamais les données de démo (Camille R., Sarah L., chiffres…).
- Réutilise le style commun du bloc 1 (jetons et classes existants). Ne crée pas un second style.

## Étape 0 — État des lieux (lecture seule), à noter dans le rapport
1. Les écrans coach actuels : Tableau (outilTableau.js), Mes clients (outilClients.js), Prospects (outilProspects.js), la fiche d'un client (mode consultation, navigation.js), la barre du bas et « Plus ». Fais la liste de TOUTES les infos et actions de chaque écran.
2. Où le coach voit les réponses d'un prospect (intake : l'ancien format v60 et le nouveau v81).
3. Comment « Supprimer » marche aujourd'hui (Auth.supprimerCompte, double confirmation).
4. Où ranger l'archivage sans migration (voir E).
5. Les définitions existantes de « à traiter » (clients et prospects) et de « inactif » (10 jours).

**Règle d'or : rien ne disparaît.** Chaque info et chaque action d'aujourd'hui reste accessible, même si elle change de place. Mets la liste avant/après dans le rapport.

## Décisions validées par Lucas
1. Dans les listes, on archive au lieu de supprimer.
2. La fiche a 2 onglets, Suivi et Compte, pour les clients comme pour les prospects.
3. La fiche prospect est la même que la fiche client, avec en plus une carte « Ses réponses ».
4. Sur la fiche prospect, un bouton WhatsApp pré-rempli remplace « Préparer le call ».
5. Pas de filtre « Bilan fait ».
6. La croix ramène là d'où l'on vient.
7. Une seule façon de passer de Clients à Prospects : la barre du bas. Retire le sélecteur « Clients | Prospects » en haut des listes.
8. Zones tactiles d'au moins 44 px. Confirmation avant tout archivage, même pour un seul compte.
9. Retire les polices Oswald et IBM Plex Mono (fichiers et déclarations), puis adapte la liste attendue par verif72 sans retirer aucune autre vérification.

## Choix par défaut (Lucas n'a pas tranché : on fait le plus simple)
- « Créer un accès » garde les mêmes champs et les mêmes rôles qu'aujourd'hui. Seuls changent le style et l'accès par le bouton « + ».
- Le vrai « Supprimer définitivement » reste tel qu'aujourd'hui (double confirmation), uniquement dans l'onglet Compte : il sert quand une personne demande l'effacement de ses données. Il n'apparaît jamais dans la sélection multiple.

## Détail des écrans
**A. Barre du bas coach** : Tableau · Clients · Prospects · Plus. « Plus » ouvre tous les autres outils coach existants.

**B. Tableau de bord** (maquette Tableau)
- 3 compteurs : Clients, À traiter, Prospects.
- Puis « À traiter maintenant » : clients et prospects à traiter, avec la raison existante.
- Tout le reste du tableau actuel reste, en dessous.
- Les archivés sont exclus des compteurs et des listes.

**C. Listes Clients et Prospects** (Liste, ListeProspects)
- Contenu : titre, nombre, recherche par nom (sans tenir compte des accents ni des majuscules), filtres en pastilles, bouton « + » (Créer un accès), bouton « Sélectionner ».
- Chaque ligne : initiales, nom, raison, info à droite.
- Filtres Clients : Tous · À traiter · Inactifs · Archivés. Filtres Prospects : Tous · À traiter · Archivés.
- Au retour d'une fiche, la recherche, le filtre et la position dans la liste sont gardés.
- Tout ce que les listes affichent aujourd'hui reste disponible : pastilles, issue Signé/Perdu/Absent, bilan réservé, export CSV, compteur, etc.

**D. Sélection** (ListeSelection, ListeConfirmation)
- « Sélectionner » fait apparaître les cases. « Tout sélectionner » prend la liste filtrée.
- En bas, une barre affiche « N sélectionnés » et « Archiver ».
- Puis une fenêtre de confirmation (objet UI) et un message une fois l'action faite.
- Dans le filtre Archivés, le bouton devient « Restaurer ».

**E. Archivage**
- Archiver, c'est masquer la personne de toutes les listes, des compteurs, de « à traiter » et des Nouveautés du coach. Rien ne change pour elle (compte, connexion, données). On peut restaurer à tout moment.
- Rangement SANS migration : dans une clé coach-seul qui existe déjà et que la personne ne peut pas lire (règles RLS), écrite par CleCoach.ecrireSi (écriture conditionnelle).
- Proposition : un champ archive_le dans notes_coach, en gardant texte, maj et avant intacts. Si l'étape 0 montre un meilleur endroit sans migration, prends-le et note-le.
- Si c'est impossible sans migration : STOP sur ce point seulement. Livre le reste et explique dans le rapport.
- Jamais de DELETE. Restaurer = remettre le champ à null.

**F. Fiche** (FicheSuivi, FicheCompte) : la même pour client et prospect
- **En-tête** : croix (retour là d'où l'on vient), initiales, nom, pastille Client ou Prospect, pastille du programme s'il est connu.
- **Bouton principal** : pour un client, « Préparer le call » (l'outil actuel) ; pour un prospect, « WhatsApp » (voir G). À côté, un bouton rond Appeler (tel:).
- **Onglet Suivi, client** :
  - retour de la semaine (Lire), poids, régularité sur 30 jours ;
  - questionnaire, programme et diète (données existantes) ;
  - accès à tous les outils du client, comme aujourd'hui.
- **Onglet Suivi, prospect** :
  - d'abord la carte « Ses réponses » : objectif, blocages, texte libre, dans 3 mois, « Tu es ? ». L'ancien format reste lisible ;
  - ensuite le panneau « Suivi commercial » actuel, complet : Bilan réservé, Signé/Perdu/Absent, relances, note.
- **Onglet Compte**, dans cet ordre :
  - email, téléphone, rôle (« Changer », comme aujourd'hui), dernière connexion ;
  - « Générer un mot de passe », « Accès complet » (s'il existe) ;
  - « Archiver ce compte » (avec confirmation) ou « Restaurer ce compte » ;
  - puis la zone rouge « Supprimer définitivement », inchangée.

**G. Bouton WhatsApp du prospect**
- Il ouvre WhatsApp en réutilisant boutonWhatsApp (la logique wa.me existante), avec le message pré-rempli ci-dessous.
- Le coach peut modifier le message avant de l'envoyer. Rien ne part automatiquement.
- Sans numéro : bouton grisé « Pas de numéro ».

**H. Créer un accès** (Nouveau) : s'ouvre avec « + ». Mêmes champs et mêmes rôles qu'aujourd'hui. La croix ramène là d'où l'on vient.

## Textes (FR ; EN en anglais américain via I18N, comme le reste)
- Recherche : « Rechercher un client par son nom » / « Rechercher un prospect par son nom ». Aucun résultat : « Aucun résultat pour ce nom. »
- Compteur : « 1 client », « 8 clients », « 1 prospect », « 6 prospects ».
- Filtres : Tous · À traiter · Inactifs · Archivés.
- Sélection : « Sélectionner », « Annuler », « Tout sélectionner », « 1 sélectionné » / « 3 sélectionnés », « Archiver », « Restaurer ».
- Confirmation, titre : « Archiver 3 clients ? » (ou « Archiver 1 prospect ? », etc.).
- Confirmation, texte pour 1 compte : « Ce compte disparaît de tes listes. Tu le retrouves dans « Archivés ». Rien ne change pour la personne. »
- Confirmation, texte pour plusieurs : « Ces comptes disparaissent de tes listes. Tu les retrouves dans « Archivés ». Rien ne change pour eux. »
- Boutons de la confirmation : « Annuler » / « Archiver ».
- Messages après l'action : « 3 clients archivés », « 1 prospect archivé », « 2 clients restaurés ».
- Tableau :
  - titre « Tableau de bord » ; sous-titre « Ce qui demande ton attention aujourd'hui. » ;
  - compteurs « Clients », « À traiter », « Prospects » ;
  - section « À traiter maintenant » ; si elle est vide : « Rien à traiter pour l'instant. »
- Fiche :
  - onglets « Suivi » / « Compte » ;
  - carte « Ses réponses », lignes « Objectif », « Ce qui bloque », « Avec ses mots », « Dans 3 mois », « Tu es ? » ; sans réponse : « Pas encore répondu » ;
  - boutons « WhatsApp » / « Pas de numéro » ; « Archiver ce compte » / « Restaurer ce compte » ; pastille « Archivé » ;
  - nom lu pour la croix (aria-label) : « Fermer la fiche ».
- Message WhatsApp (FR) : « Salut {prénom} 👋 Bienvenue chez MHX Coaching ! J'ai bien reçu tes réponses : ton objectif, c'est {objectif}, et ce qui a coincé jusqu'ici : {blocages}. [si texte libre : Tu m'as aussi écrit : « {texte} ».] Je prépare ton plan d'action. Tu as pu réserver ton appel offert de 15 min ? »
- Message WhatsApp (EN, si le prospect a choisi l'anglais) : « Hi {first name} 👋 Welcome to MHX Coaching! I got your answers: your goal is {goal}, and what's held you back so far: {blockers}. [if free text: You also wrote: "{text}".] I'm putting together your action plan. Were you able to book your free 15-min call? »
- S'il manque une réponse, la phrase correspondante est sautée proprement. Les réponses sont écrites en texte court, en minuscules quand ça se lit mieux.

## Tests (demandés par Lucas pour cette mission)
- Nouvelle suite verif86, inscrite au banc. Elle vérifie :
  - la recherche (accents, majuscules) et chaque filtre ;
  - la sélection et « Tout sélectionner » ;
  - archiver 1 compte puis plusieurs (confirmation, message) ;
  - les archivés : absents des compteurs, des listes et de « à traiter », présents dans « Archivés » ; puis restaurer ;
  - aucun appel DELETE ;
  - les fiches à onglets (client et prospect) et « Ses réponses » (ancien et nouveau format) ;
  - le lien WhatsApp : numéro, texte encodé, avec et sans texte libre, sans numéro ;
  - la croix : retour au Tableau, retour à la liste avec la recherche gardée ;
  - le Suivi commercial toujours utilisable ;
  - les zones tactiles d'au moins 44 px ;
  - les largeurs 360, 390 et 430 px, avec Chromium et WebKit, et l'anglais.
- Tous les tests existants restent verts. Ne supprime ni n'affaiblis jamais un test : tu peux seulement adapter un sélecteur ou un texte si l'écran change, en gardant le même nombre de vérifications.
- Base simulée uniquement : aucun vrai compte, aucune écriture dans Supabase.
- Captures avant/après à 390 px dans docs/maj-bloc-3/rapport/ (comptes fictifs uniquement).

## Base de données
- Aucune migration prévue. Si l'étape 0 en montre une nécessaire : STOP sur ce point (Lucas doit la valider), et livre le reste.

## Règles d'arrêt
STOP veut dire : pas de push sur main, tu écris le rapport et tu t'arrêtes. Ça s'applique quand :
- une action effacerait ou modifierait des données existantes ;
- un comportement des comptes clients ou prospects changerait ;
- une info ou une action d'aujourd'hui disparaîtrait sans nouvelle place ;
- un test reste rouge après 2 tentatives de correction.

Pour un doute mineur : prends l'option la plus simple et la plus sûre, note-la et continue.

## Fin
- Retire la ligne d'exception de CLAUDE.md. Ajoute la ligne v83 dans docs/HISTORIQUE.md et mets à jour la ligne « En ligne » de CLAUDE.md.
- Rapport court, en français simple, dans docs/maj-bloc-3/RAPPORT.md et dans le chat :
  1. ce qui est en ligne (version, commit, lien) ;
  2. ce qui n'est pas fait, et pourquoi ;
  3. où l'archivage est rangé ;
  4. la liste avant/après des infos et actions coach (rien de perdu) ;
  5. ce que Lucas doit tester sur son téléphone : 5 points au maximum, avec le lien ;
  6. les choix que tu as faits seul.
