# Rapport — mission « v84 + v85 » (13/10/2026)

## 1. Ce qui est en ligne
- **v84 — ménage du bloc 3** : en ligne (`main` e04da65 ; banc GitHub de la branche `v2/menage-bloc-3` vert, passage 38413559246, puis banc de `main` vert sur les 10 parties, WebKit compris, et publication réussie, passage 38415531471 ; site vérifié : `MHX_FICHIERS = "84"`, « 2026-10-13 · 84 »).
- **v85 — bloc 4, les programmes de la formation** : en ligne (`main` 466648a ; banc GitHub de la branche `v2/bloc-4` vert, passage 38419575997, puis banc de `main` vert sur les 10 parties, WebKit compris, et publication réussie, passage 38421568879 ; site vérifié : `MHX_FICHIERS = "85"`, « 2026-10-13 · 85 », plus aucun « Speed Formation » dans les fichiers servis).
- Lien : https://lcsmhx.github.io/mhx-plateforme/
- Captures avant / après à 390 px (comptes fictifs) : `docs/maj-bloc-4/rapport/`.

## 2. Ce qui n'est pas fait, et pourquoi
- **Noter une séance des programmes de la formation** : pas fait, comme le demande la mission (pas de nouveau suivi). L'app sait
  noter une séance du programme du coach (clé `journal`), mais chaque séance y est repérée par son numéro dans le programme du coach :
  y mélanger les séances de la formation fausserait le compteur « Cette semaine », la régularité et la prochaine séance de l'accueil.
  Idée pour plus tard : un bouton « Séance faite » sur l'écran d'une séance, rangé à part (un champ de plus dans `journal`, avec
  l'identifiant du programme), compté dans la régularité seulement si tu le décides.
- **Les textes « ton espace » du parcours** ne changent pas (mission) : la carte « Ton programme — Des séances toutes prêtes, avec la
  vidéo de chaque exercice. » n'a plus son badge « Bientôt » ; à toi de dire si tu veux un autre texte.
- Rien d'autre : v84 (A1, A2, A3), v85 (B1 à B4), les tests (verif86 complétée, nouvelle suite verif87), le banc GitHub et les captures sont faits.

## 3. v84
### Avant / après de l'écran d'avant (rien n'a disparu)
**Clients** — la page ne garde que la liste (recherche, filtres, sélection, archivage, « + »).

| Élément de l'écran d'avant (sous la liste) | Nouvelle place |
|---|---|
| Le tableau complet (18 colonnes : retour, note, smiley, visite, connexions, dernière connexion, jours actifs, activité, régularité, poids, depuis le début, 4 dernières semaines, questionnaire, programme, diète, téléphone avec Appeler et WhatsApp, Préparer le call, Ouvrir) et sa légende | **Plus › Suivi détaillé** (tel quel) |
| Les alertes regroupées (calculateur ≠ questionnaire avec le détail, régularité faible, sans nouvelles depuis 10 jours, jamais rien saisi, il manque quelque chose, « tout va bien ») | **Plus › Suivi détaillé** (tel quel) |
| Comptes : tous les comptes, ton équipe et toi compris, 🇺🇸 anglais, « actif / pas encore utilisé », « dernière saisie : date », Ouvrir sa fiche, Passer client / Repasser prospect, Donner / Retirer l'accès complet, Supprimer un compte d'équipe, la phrase d'aide (mot de passe partagé…) | **Plus › Comptes** (tel quel) |

**Prospects** — la page garde la liste, puis le panneau **Nouveautés** (le badge de l'onglet et « Tout marquer comme vu » vivent avec lui).

| Élément de l'écran d'avant (sous la liste) | Nouvelle place |
|---|---|
| « N comptes gratuits · M à traiter », compteur Inscrits → 3 questions → bilans → clients, tuiles À traiter / Signés / Perdus / Absents (30 jours), Mesure (périodes, clics par écran, comptes de test) | **Plus › Suivi commercial** (tel quel) |
| Filtres détaillés (À traiter, Appel fait, Tous avec leurs nombres), recherche nom ou email, période d'inscription, bilan, newsletter, tri (priorité, inscription, dernière visite), « N sur M prospects », les cartes avec tous leurs boutons (J'ai relancé, Signé, Perdu, Absent, Passer client…), « Afficher 50 de plus », export CSV, la note d'aide | **Plus › Suivi commercial** (tel quel) |
| La liste newsletter (prospects et clients, « Voir les N autres », export CSV) | **Plus › Newsletter** (telle quelle) |
| Nouveautés | **reste sous la liste Prospects** |

Au retour d'une fiche ouverte depuis une de ces pages, la croix (ou « Revenir … ») ramène à cette page, à la même position.

### Archiver en or
Barre de sélection, fenêtre de confirmation et onglet Compte : « Archiver » est doré, texte #07090d dessus. « Supprimer
définitivement » reste rouge (zone rouge de l'onglet Compte et ses deux confirmations).

### Où la langue du parcours est enregistrée
Dans la clé **`prefs`** du compte (`prefs.langue = "en"`), la préférence que l'app lisait déjà (démarrage, fiche du coach, Comptes).
Écrite une fois, à la fin d'un parcours fait en anglais, seulement pour le compte créé à l'instant ; jamais par-dessus un choix déjà
rangé ; un parcours en français n'écrit rien. Les comptes existants ne changent pas. Le message WhatsApp de sa fiche sort alors en
anglais.

## 4. v85
### Où le choix de programme est rangé
Dans la clé **`prefs`** du compte, champ **`prog_formation = { id, debut }`** (id : `salle-homme`, `salle-femme` ou `maison` ; début :
la date du choix). Sans migration. Écrit seulement quand la personne touche « Choisir » (« Changer de programme ») : la clé est relue
d'abord et tous ses autres champs (la langue) sont gardés ; changer de langue garde aussi le programme. Rien n'est écrit quand on
regarde son programme. Sans choix rangé : le programme attribué (objectif × sexe), avec pour début le jour du parcours.

### Nom du PDF → exercice de l'app
68 noms reliés (tous ont leur vidéo). Les 5 fusions de la mission sont faites : « Squat arrière » = « Squat » → Squat barre ; « Fentes bulgares » = « Squat bulgare » → Fentes bulgares ; « Planche statique » = « Planche (gainage) » = « Planche abdominale » → Planche ; « Jump squats » = « Squats sautés » et « Pompes avec clap » = « Pompes avec claquement » : pas d'équivalent dans l'app, un seul nom chacun, sans vidéo (liste suivante).

**À vérifier en priorité** (équivalents proches, gardés parce que la fiche de l'app décrit le même mouvement) : Burpees → Burpees contrôlés (sans saut) ; Tractions assistées → Tractions (la fiche parle de l'assistance élastique) ; Curl barre EZ et Curl biceps barre EZ → Curl barre ; Tirage poitrine → Tirage vertical ; Dips sur banc → Dips de chaise ; Leg curl couché → Leg curl ; Mollets debout à la machine → Mollets debout.

| Nom du PDF | Exercice de l'app (id) | Vidéo |
|---|---|---|
| Abducteurs à la machine | Abducteurs machine (`abducteurs-machine`) | oui |
| Burpees | Burpees contrôlés (`burpees-controles`) | oui |
| Chaise contre le mur | Wall sit (`wall-sit`) | oui |
| Crunch abdos | Crunch (`crunch`) | oui |
| Curl barre EZ | Curl barre (`curl-barre`) | oui |
| Curl biceps alterné avec haltères | Curl haltères (`curl-halteres`) | oui |
| Curl biceps barre EZ | Curl barre (`curl-barre`) | oui |
| Curl biceps haltères | Curl haltères (`curl-halteres`) | oui |
| Curl haltères | Curl haltères (`curl-halteres`) | oui |
| Dips | Dips (`dips`) | oui |
| Dips sur banc | Dips de chaise (`dips-de-chaise`) | oui |
| Développé couché | Développé couché (`developpe-couche`) | oui |
| Développé couché avec haltères au sol | Développé haltères au sol (`developpe-halteres-au-sol`) | oui |
| Développé couché barre | Développé couché (`developpe-couche`) | oui |
| Développé incliné haltères | Développé haltères incliné (`developpe-halteres-incline`) | oui |
| Développé militaire | Développé militaire (`developpe-militaire`) | oui |
| Extension mollets debout | Mollets debout (`mollets-debout`) | oui |
| Extension mollets à la presse | Mollets à la presse (`mollets-a-la-presse`) | oui |
| Extension triceps poulie | Extension triceps poulie (`extension-triceps-poulie`) | oui |
| Extensions triceps poulie | Extension triceps poulie (`extension-triceps-poulie`) | oui |
| Fentes arrière | Fentes arrière (`fentes-arriere`) | oui |
| Fentes arrière avec haltères | Fentes arrière haltères (`fentes-arriere-halteres`) | oui |
| Fentes avec haltères | Fentes haltères (`fentes-halteres`) | oui |
| Fentes bulgares | Fentes bulgares (`fentes-bulgares`) | oui |
| Fentes haltère | Fentes haltères (`fentes-halteres`) | oui |
| Fentes marchées | Fentes marchées (`fentes-marchees`) | oui |
| Fentes marchées haltère | Fentes marchées haltères (`fentes-marchees-halteres`) | oui |
| Glute bridge | Pont fessier (`pont-fessier`) | oui |
| Hip thrust | Hip thrust (`hip-thrust`) | oui |
| Leg curl | Leg curl (`leg-curl`) | oui |
| Leg curl couché | Leg curl (`leg-curl`) | oui |
| Leg extension | Leg extension (`leg-extension`) | oui |
| Leg extensions | Leg extension (`leg-extension`) | oui |
| Mollets assis | Mollets assis (`mollets-assis`) | oui |
| Mollets debout | Mollets debout (`mollets-debout`) | oui |
| Mollets debout à la machine | Mollets debout (`mollets-debout`) | oui |
| Mountain climbers | Mountain climbers (`mountain-climbers`) | oui |
| Mountain climbers rapides | Mountain climbers (`mountain-climbers`) | oui |
| Oiseau haltères | Oiseau haltères (`oiseau-halteres`) | oui |
| Planche | Planche (`planche`) | oui |
| Planche (gainage) | Planche (`planche`) | oui |
| Planche abdominale | Planche (`planche`) | oui |
| Planche latérale | Gainage latéral (`gainage-lateral`) | oui |
| Planche statique | Planche (`planche`) | oui |
| Pompes | Pompes (`pompes`) | oui |
| Presse à cuisses | Presse à cuisses (`presse-a-cuisses`) | oui |
| Rowing barre | Rowing barre (`rowing-barre`) | oui |
| Rowing haltère | Rowing haltère (`rowing-haltere`) | oui |
| Rowing haltères | Rowing haltère (`rowing-haltere`) | oui |
| Rowing unilatéral haltère | Rowing haltère un bras (`rowing-haltere-un-bras`) | oui |
| Rowing à un bras avec haltère | Rowing haltère un bras (`rowing-haltere-un-bras`) | oui |
| Soulevé de terre | Soulevé de terre (`souleve-de-terre`) | oui |
| Soulevé de terre aux haltères | Soulevé de terre haltères (`souleve-de-terre-halteres`) | oui |
| Squat | Squat barre (`squat-barre`) | oui |
| Squat arrière | Squat barre (`squat-barre`) | oui |
| Squat avant | Squat front (`squat-front`) | oui |
| Squat bulgare | Fentes bulgares (`fentes-bulgares`) | oui |
| Squat goblet | Squat goblet (`squat-goblet`) | oui |
| Squats | Squats (`squats`) | oui |
| Tirage horizontal | Tirage horizontal (`tirage-horizontal`) | oui |
| Tirage horizontal à la machine | Tirage horizontal (`tirage-horizontal`) | oui |
| Tirage poitrine | Tirage vertical (`tirage-vertical`) | oui |
| Tirage vertical | Tirage vertical (`tirage-vertical`) | oui |
| Tirage vertical (poulie haute) | Tirage vertical (`tirage-vertical`) | oui |
| Tractions assistées | Tractions (`tractions`) | oui |
| Écarté couché haltères | Écartés haltères (`ecartes-halteres`) | oui |
| Élévations latérales | Élévations latérales (`elevations-laterales`) | oui |
| Élévations latérales aux haltères | Élévations latérales haltères (`elevations-laterales-halteres`) | oui |

### À préciser (36 noms sans équivalent sûr dans l'app : affichés avec le nom du PDF, sans vidéo)
- Box jump
- Burpees avec saut
- Burpees explosifs
- Développé militaire avec haltères
- Extension mollets
- Fentes alternées
- Fentes avant
- Fentes latérales
- Fentes sautées
- Fentes statiques haltères
- High knees
- High knees rapides
- Hip thrust à l'haltère
- Jump squats → affiché « Squats sautés » (un seul nom)
- Jumping jack → affiché « Jumping jacks » (un seul nom)
- Jumping jacks
- Peck deck
- Planche avec levée de jambe
- Planche avec levée de jambes → affiché « Planche avec levée de jambe » (un seul nom)
- Planche avec rotation
- Planche avec rotation rapide
- Planche avec touche d'épaule
- Planche dynamique
- Pompes avec clap → affiché « Pompes avec claquement » (un seul nom)
- Pompes avec claquement
- Pompes explosives
- Rowing
- Soulevé de terre jambes tendues
- Squat avec haltères
- Squat haltère → affiché « Squat avec haltères » (un seul nom)
- Squats sautés
- Squats sautés avec levée de genoux
- Step-ups avec haltères
- Step-ups sur une chaise avec haltères
- Triceps kickback avec haltères
- Vélo elliptique ou tapis de marche

## 5. À tester sur ton téléphone (lien : https://lcsmhx.github.io/mhx-plateforme/)
1. **Menu Plus du coach** : « Suivi détaillé », « Comptes », « Suivi commercial », « Newsletter » ; dans Suivi détaillé, ouvre une fiche
   (« Ouvrir ») puis la croix : tu reviens au tableau, au même endroit.
2. **Clients → Sélectionner** → coche ton compte de test → « Archiver » est doré → Annuler (rien ne change).
3. **Ton compte de test** (client) : Mon programme → tout en bas « Les programmes de la formation » → Voir les programmes : ton
   programme, les onglets Semaines 1-4 / 5-8 / 9-12, une séance, l'échauffement replié, un bouton « Vidéo ».
4. Sur cette page, **« Changer de programme »** → « Full body à la maison » → la méthode en 3 phrases en haut ; tu peux revenir au
   programme d'avant de la même façon.
5. **La Formation** s'appelle « Formation », avec « Cours et ebooks : alimentation, entraînement, mindset » ; en anglais (bouton EN) :
   « Course ».

## 6. Les choix que j'ai faits seul
**v84**
- **Rien n'est retiré, tout est déplacé tel quel** : l'écran d'avant n'a pas été découpé élément par élément ; il est passé, entier
  et inchangé, dans 4 pages du menu Plus (Suivi détaillé, Comptes, Suivi commercial, Newsletter). C'était le plus sûr pour que rien
  ne disparaisse (mêmes boutons, mêmes chiffres, mêmes exports).
- **Les cartes des prospects** sont gardées dans « Suivi commercial » : elles sont le résultat des filtres détaillés et de l'export
  CSV (Appel fait, recherche par email, période, bilan, newsletter, tri), qui n'existent nulle part ailleurs.
- **Les Nouveautés restent sous la liste Prospects** : le badge de l'onglet Prospects et « Tout marquer comme vu » vont avec elles.
- **« Et N autres : Prospects → »** du Tableau de bord ouvre la liste Prospects sur « Tous » (avant : les cartes) ; le sous-titre du
  raccourci « Mes clients » devient « liste, recherche, création d'accès » ; les messages de Créer un accès disent « Comptes (menu
  Plus) ».
- **« Restaurer ce compte »** (le même bouton de la fiche) est doré lui aussi.
- **Langue du parcours** : seulement « en » est écrit, seulement pour le compte créé à l'instant, jamais par-dessus un choix rangé.

**v85**
- **La vidéo d'un exercice** est celle de l'app : le lien de `donnees/liensexercices.json` (tes liens) s'il existe, sinon le champ
  « lien » de la fiche — la même règle que l'import du catalogue. Pour 16 noms, les deux fichiers ont des liens différents : c'est le
  tien qui sert. Bouton « ▶ Vidéo », puis le lecteur YouTube (youtube-nocookie) à sa place, comme dans la séance découverte.
- **Équivalences « à vérifier »** et **un seul nom** pour les variantes sans équivalent : voir la partie 4.
- **« Prendre du muscle »** : la séance 6 est marquée « Facultative » (le JSON disait « sans la séance 6 » : ton tableau de la mission
  l'emporte). **« Me remettre en forme » sans sexe connu** → la maison (les deux colonnes de ton tableau sont identiques).
- **Clients** : leur objectif vient du questionnaire complet (« Perte de poids / sèche » → Perdre du gras, « Prise de muscle » →
  Prendre du muscle, « Santé & énergie au quotidien » → Me remettre en forme) ; « Recomposition » ou « Performance » : ils choisissent.
- **Date de début** : sans choix rangé, le jour du parcours (sinon la semaine 1) ; choisir un programme (même le même) le fait
  recommencer à la semaine 1 ; après 12 semaines, l'onglet Semaines 9-12 reste ouvert avec « Tes 12 semaines sont faites ».
- **Le prospect** : son onglet Programme reste une page « verrouillée » (petit cadenas, réservation Calendly comptée comme avant) ;
  l'exemple « Ta séance découverte » est remplacé par son programme ; la carte 🔒 garde son bouton et prend le texte « Après ton
  bilan : ton programme sur mesure, avec ton coach. » ; elle n'est pas répétée sur l'écran d'une séance. Cette page lit maintenant
  son objectif et son choix (avant, elle ne lisait rien) ; elle n'écrit rien.
- **Le client** : les programmes de la formation sont une sous-page de « Mon programme » (lien en bas) ; la carte « Ton programme »
  de son accueil n'apparaît que s'il n'a pas de programme de toi (sinon elle ferait doublon avec le tien).
- **Anglais** : les noms d'exercices restent ceux de l'app ; les noms sans équivalent restent tels quels.
- **Formation** : le sous-titre remplace aussi le texte de la carte Formation de l'accueil du prospect.
- **Changer de langue** relit la préférence et garde le programme choisi (avant, elle réécrivait la préférence entière).
- **Hors ligne** : si la lecture échoue, la page dit « Pas de connexion » avec Réessayer (jamais un faux « choisis ton programme »).
- **Les visites** des pages du programme par un prospect comptent comme avant pour cette page (« verrou-programme » dans son
  activité, vue dans sa fiche).
- **Lien avec le catalogue** : verif87 vérifie que les 68 exercices reliés existent toujours dans `donnees/exercices.json` sous le même
  nom. Si Grok Bot en renomme ou en retire un, le banc le signalera : il faudra refaire `js/programmesFormation.js` (le fichier
  est fabriqué depuis le JSON de la formation et la table de correspondance du rapport).

**Tests** : verif86 passe de 46 à 57 vérifications (v84) ; nouvelle suite verif87 (44, partie 6 du banc, WebKit compris) ; 37
suites adaptées pour la v84 et 8 pour la v85, chacune avec le même nombre de vérifications ; deux relectures indépendantes ont
cherché toute vérification affaiblie, et ce qu'elles ont trouvé a été rendu ; aucune écriture dans la vraie base.
