# MISSION — Blocs 1 et 2 : style commun + nouveau parcours prospect

Mission validée par Lucas le 13/10/2026. Lis ce fichier en entier, puis TEXTES.md, avant de toucher au code.

## Mode de travail (exception validée par Lucas)

- **Autonomie complète, push compris.** Tu enchaînes sans attendre de validation. C’est une exception explicite à la règle « étape par étape » de CLAUDE.md, valable uniquement pour cette mission. Note-la en une ligne dans CLAUDE.md au début, et retire-la à la fin.
- Avant de commencer : ta tâche précédente doit être terminée et poussée. Pars de main à jour.
- Toutes les autres règles de CLAUDE.md restent valables, en particulier « zéro perte de données ».
- Deux versions séparées, dans cet ordre : bloc 1, puis bloc 2. Pour chacune : branche v2/… comme d’habitude, un commit par sujet, fusion dans main seulement si le banc de tests est vert, puis vérifie que la publication GitHub Actions passe. Numérote les versions dans la suite habituelle.
- Ne touche ni au dossier donnees/ ni aux fichiers sans rapport avec la mission.
- **On simplifie** : aucune nouvelle librairie, aucun nouveau service. Réutilise ce qui existe.

## Contenu de ce dossier

- MISSION.md : ce fichier.
- TEXTES.md : les textes finaux en français. **Ils font foi.**
- maquettes/ : sources des maquettes, au format « canevas » de claude.ai (balises x-dc, sc-if, sc-for, {{…}}). Ne les copie pas tels quels : traduis-les en HTML, CSS et JS normaux. {{accent}} = l’or #D4A844.
  - parcours-prospect/ : les écrans du parcours. Main.dc.html contient l’animation d’accueil.
  - espace-coach/ : référence de **style uniquement** pour les pages coach et client.
- captures/ : les écrans des maquettes en image.
- Pour le visuel, c’est la maquette qui fait foi. Pour les textes, c’est TEXTES.md. Les valeurs de démo des maquettes (Alex, Camille R., 6 12 34 56 78, réponses pré-cochées) ne doivent jamais être reprises.

## Étape 0 — État des lieux (lecture seule, environ 30 min)

Ne modifie rien pendant cette étape. Note dans le rapport :

1. Où sont les styles actuels (fichiers CSS, styles écrits dans le JS). Existe-t-il un thème clair et un bouton pour le choisir ?
2. Le système de langue FR/EN : existe-t-il, et comment y ajouter des textes ?
3. L’inscription actuelle (v72) : écrans, champs, création du compte, téléphone obligatoire, Calendly pré-rempli, lien ?ref=, liens CGU et confidentialité, consentement newsletter.
4. Le questionnaire actuel : quelles colonnes stockent les réponses (objectif, obstacle, projection…) ? Le sexe est-il déjà enregistré (pour le calculateur) ?
5. Ce qu’un prospect peut utiliser aujourd’hui parmi : programme (séances prêtes), journal alimentaire, recettes, calculateur, suivi.
6. L’endroit où le coach voit aujourd’hui les réponses d’un prospect.
7. La bannière d’installation de l’app : quand s’affiche-t-elle ?

## Bloc 1 — Style commun (aucune fonction ne change)

But : le même style « verre dépoli » partout (prospect, client, coach), **sans changer l’organisation des pages ni les fonctions**. La réorganisation de l’espace coach (recherche, sélection multiple, fiche à onglets, bouton « + ») fera l’objet du bloc 3 : **ne la fais pas ici**.

1. **Un seul fichier de style partagé** : variables (couleurs, flou, bordures, arrondis) et classes réutilisables (verre, bouton or, bouton rouge, champ, carte, pastille, en-tête, barre du bas, fenêtre de confirmation). Remplace les styles en double.
2. **Valeurs** :
   - fond #07090d ; texte #F4F5F7 ; texte secondaire #a3abb8 ;
   - or #D4A844, avec du texte #07090d posé sur l’or ;
   - rouge #F87171 (supprimer) ; vert #4ADE80 ; ambre #FBBF24 ; gris #6B7280 ;
   - verre : fond rgba(255,255,255,0.06), flou 18 px, bordure 1 px rgba(255,255,255,0.14) ; élément sélectionné : fond 0.12 et bordure or ;
   - arrondis : 16 px (boutons, champs), 18 à 20 px (cartes), 999 px (pastilles) ;
   - hauteurs : bouton 56 px, champ 60 px, bouton rond 44 px ;
   - halos de fond : rgba(160,148,128,.40), rgba(72,88,118,.55), rgba(212,168,68,.16).
3. **Performance (validé)** :
   - Le flou est réservé aux en-têtes, à la barre du bas, aux cartes et aux fenêtres, avec 3 à 4 éléments flous par écran au maximum.
   - Les lignes des longues listes gardent le même fond semi-transparent, **sans flou**.
   - Les halos de fond sont des dégradés radiaux fixes, pas des éléments floutés avec filter: blur.
   - Écris toujours -webkit-backdrop-filter en plus de backdrop-filter.
   - Prévois une version sans mouvement quand l’appareil le demande (prefers-reduced-motion).
4. **Polices (validé)** : IBM Plex Sans (400, 500, 600, 700) partout, et Instrument Serif (400) seulement pour le grand titre de l’accueil prospect. Les fichiers woff2 sont hébergés dans le dépôt avec leur licence OFL, sans Google Fonts : l’app reste sans dépendance externe.
5. **Tout en sombre (validé)** : supprime le thème clair et son bouton. Ignore un éventuel choix « clair » déjà enregistré sur un appareil. Le bouton EN reste.
6. Zones tactiles d’au moins 44 px.
7. Logo cliquable partout : il ramène au Tableau de bord (coach) ou à l’Accueil (client). Ce point est validé ; il est petit, fais-le au passage.
8. **Contrôle** : fais des captures avant/après des écrans principaux (prospect, client, coach) à 390 px de large, et range-les dans docs/maj-blocs-1-2/rapport/. Tous les tests existants doivent rester verts.

## Bloc 2 — Nouveau parcours prospect

Périmètre : les écrans 1 à 11 ci-dessous, plus la carte cadeau sur l’accueil existant. Les cartes « Ta séance du jour » et « Ton journal » de l’accueil, ainsi que l’écran séance, appartiennent aux blocs 4 et 5 : **ne les fais pas**.

Ordre des écrans et barre de progression (continue d’un écran à l’autre) :
Accueil (sans barre) → Objectif 10 % → Coincé 20 % → Dans 3 mois 30 % → Tu es 40 % → Prénom 50 % → Chargement 60 % → Compte 70 % → WhatsApp 80 % → Ton espace 90 % → Cadeau 100 % → accueil de l’app.

1. **Réutilise l’inscription existante (v72)** : création du compte, téléphone obligatoire, rôle prospect, lien ?ref=, Calendly pré-rempli. Ne refais pas ce qui marche : découpe-le en écrans.
2. **Les réponses sont gardées pendant le parcours** dans sessionStorage, en protégeant les lectures et écritures par try/catch. Si la page est rechargée, la personne reprend là où elle en était.
3. **Le compte est créé au clic sur « Débloquer mon espace »** (écran WhatsApp), pas avant. Toutes les réponses sont alors enregistrées dans son profil. Ça marche parce que la confirmation d’email est désactivée : note cette dépendance dans CLAUDE.md.
4. Si l’email est déjà utilisé, retour à l’écran Compte avec le message prévu dans TEXTES.md.
5. **Questions** : textes, réactions et règles dans TEXTES.md. Rien n’est pré-coché. Pour l’objectif et « Tu es ? », un tap passe à l’écran suivant.
6. **Accueil** :
   - Reprends l’animation de maquettes/parcours-prospect/Main.dc.html (uniquement du CSS et du SVG, pas de JS), en remplaçant {{accent}} par la variable or.
   - Prévois une image fixe pour prefers-reduced-motion.
   - Badge « Bientôt » sur chaque fonction qu’un prospect ne peut pas encore utiliser (d’après l’étape 0), dans l’animation et dans « Ton espace ».
   - Garde une seule liste des fonctions disponibles, facile à modifier quand les blocs 4 et 5 sortiront.
7. **Compte à rebours** :
   - Heure de Paris, date de fin dans une seule constante : 15/11/2026 23:59:59, Europe/Paris.
   - Textes dans TEXTES.md. Après la date, la ligne disparaît et rien d’autre ne change.
   - Teste les dates limites (14/11, 15/11, 16/11) et le changement d’heure du 25/10.
8. **Chargement** : coches à 0,6 / 1,4 / 2,2 / 3,0 s, puis passage automatique à l’écran suivant. Le lien « Suite → » permet d’aller plus vite.
9. **Cadeau** :
   - Affiché une seule fois, en plein écran, sans croix.
   - Photo : coach.jpg dans le dossier d’images de l’app si le fichier existe ; sinon, le logo dans le cercle. Si docs/maj-blocs-1-2/coach.jpg existe, recadre-la en carré et utilise-la.
   - « Je réserve mon créneau offert » ouvre le lien Calendly pré-rempli comme aujourd’hui (https://calendly.com/mhx-coaching/ton-plan-d-action-offert-15-min-avec-lucas) et enregistre la date du clic.
   - « Plus tard » mène à l’accueil.
10. **Carte cadeau sur l’accueil** : visible pour les prospects qui n’ont jamais cliqué sur « Je réserve ». Elle disparaît après le clic. Les clients et le coach ne la voient jamais.
11. Pas de bannière d’installation de l’app pendant le parcours : seulement après, sur l’accueil.
12. **FR + EN (validé)** : tous les nouveaux textes passent par le système de langue existant ; traduis-les en anglais américain. S’il n’existe aucun système de langue, fais la version française seule et note-le dans le rapport.
13. **Le coach doit continuer à voir les réponses des nouveaux prospects** au même endroit qu’aujourd’hui, y compris le texte libre et le sexe : aucune perte de visibilité. Ne crée pas de nouvel écran coach (c’est le bloc 3).
14. **Comptes existants : rien ne change pour eux** (connexion, données, ancien questionnaire toujours lisible).
15. Partout : « ton coach », jamais « Lucas » ; aucun prix ; plus aucun « 14 jours » dans l’accueil, l’inscription et le parcours.

## Base de données (seulement si l’étape 0 montre qu’il manque des colonnes)

- Une seule migration pour tout le bloc 2, uniquement des ADD COLUMN, avec des valeurs vides par défaut.
- Colonnes possibles : objectif, blocages (2 au maximum), blocage_texte, projection_3_mois, sexe, newsletter_ok et sa date, cgu_acceptees_le, cadeau_clique_le. N’ajoute que celles qui manquent et réutilise les colonnes existantes.
- Avant la migration : sauvegarde vérifiable et comptage des lignes. Après : même comptage.
- Teste sur le compte de test habituel (voir CLAUDE.md).
- RLS : chacun ne lit et n’écrit que son profil ; le coach lit tout.

## Tests

- Le banc existant, plus de nouveaux tests :
  - parcours complet avec 1 blocage, avec 2 blocages, et avec le texte libre seul ;
  - retour arrière, et rechargement de la page en cours de route ;
  - email déjà utilisé, numéro invalide ;
  - compte à rebours aux dates limites ;
  - carte cadeau avant et après le clic ;
  - comptes client et coach existants inchangés.
- Largeurs d’écran 360, 390 et 430 px ; Safari iPhone et Chrome Android (moteurs WebKit et Chromium du banc).
- Si un test doit créer un vrai compte, utilise une variante « +parcoursN » de l’adresse du compte de test habituel, et liste ces comptes dans le rapport.
- Ce dossier peut être commité dans docs/maj-blocs-1-2/ : il ne contient aucune donnée personnelle. N’y ajoute jamais d’adresse email ni de donnée d’un vrai client (le dépôt est public).

## Règles d’arrêt

STOP veut dire : tu ne pousses pas sur main, tu écris le rapport et tu t’arrêtes. Ça s’applique quand :

- une action effacerait ou modifierait des données existantes (DELETE, DROP, TRUNCATE, UPDATE de masse) ;
- le comptage avant et après une migration diffère ;
- un test reste rouge après 2 tentatives de correction ;
- un comportement des comptes existants changerait.

Pour un doute mineur : choisis l’option la plus simple et la plus sûre, note-la dans le rapport et continue.

## Rapport final (court, en français simple)

Dans docs/maj-blocs-1-2/RAPPORT.md, et en réponse dans le chat :

1. Ce qui est en ligne (versions, liens).
2. Ce qui n’est pas fait, et pourquoi.
3. La migration : colonnes ajoutées, comptages avant et après.
4. Les comptes de test créés.
5. Ce que Lucas doit tester sur son téléphone : 5 points au maximum, avec le lien.
6. Les choix que tu as faits seul pendant la mission.
