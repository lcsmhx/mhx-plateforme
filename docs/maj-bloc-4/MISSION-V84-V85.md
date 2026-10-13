# MISSION — v84 (ménage du bloc 3) puis v85 (bloc 4 : programmes + vidéos + « Formation »)

Mission validée par Lucas le 13/10/2026.

## ⚠️ Autonomie complète, sans t'arrêter
Lucas est absent. Tu fais TOUTE la mission seul, du début à la fin, sans pause, sans attendre de validation et sans poser de question : état des lieux, v84, v85, tests, captures, fusions, mises en ligne, rapport. C'est une exception explicite à « une étape à la fois » de CLAUDE.md, valable seulement pour cette mission : note-la en une ligne dans CLAUDE.md au début et retire-la à la fin. Pour un doute : prends l'option la plus simple et la plus sûre, note-la dans le rapport et continue. Tu ne t'arrêtes QUE sur les règles d'arrêt ci-dessous, ou quand les deux versions sont en ligne et le rapport écrit.

## 0. Avant tout
- Copie dans docs/maj-bloc-4/ les fichiers du dossier ~/Desktop/Export Insta/bloc-4/ : MISSION-V84-V85.md (ce fichier) et programmes-formation.json. Premier commit.
- Les 2 vérifications de démarrage de CLAUDE.md.

## Règles de la mission
- Tests, banc GitHub et captures avant/après : demandés par Lucas pour cette mission.
- Toutes les autres règles de CLAUDE.md restent : zéro perte de données, aucune migration, dépôt public, « ton coach » jamais « Lucas », aucun prix, FR + EN (anglais américain), aucune nouvelle librairie ni nouveau service, pas de alert/confirm natifs (objet UI).
- **Ne touche jamais donnees/** (tu peux lire exercices.json et liensexercices.json, pas les modifier). Les données des programmes vont dans js/ (le site ne publie que index.html, css/, js/, polices/).
- **Deux versions séparées, dans cet ordre** : v84 (partie A), puis v85 (partie B). Pour chacune : branche v2/… (worktree), petits commits en français, fusion dans main seulement si le banc est vert, vérifie la publication et le pied de page, puis enchaîne sur la suivante.

---

# PARTIE A — v84 : petit ménage du bloc 3 (branche v2/menage-bloc-3)

### A1. Retirer l'ancien écran en double
- Sous les nouvelles listes Clients et Prospects, retire l'ancien écran qui fait doublon.
- **Règle d'or : rien ne disparaît.** Avant de retirer quoi que ce soit, fais la liste de ce qui n'existe QUE dans l'ancien écran (par exemple le tableau complet, Comptes, les cartes, l'export CSV, la newsletter, les statistiques, les comptes de l'équipe). Chacun de ces éléments reçoit une nouvelle place simple : dans « Plus », dans la nouvelle liste ou dans la fiche.
- Mets la liste avant/après dans le rapport. Si un élément n'a pas de place évidente, garde-le et note-le.

### A2. Bouton « Archiver » en or
- Le bouton « Archiver » (barre de sélection, fenêtre de confirmation, onglet Compte) passe en or, avec le texte #07090d posé dessus.
- Le rouge reste réservé à « Supprimer définitivement ».

### A3. Enregistrer la langue du parcours
- Quand un prospect fait le parcours en anglais, sa langue est enregistrée sur son compte, sans migration, à un endroit qui existe déjà (par exemple prefs.langue ou intake). Choisis le plus simple et note-le.
- Le message WhatsApp de sa fiche sort alors en anglais. Les comptes existants ne changent pas.

### A4. Ne change pas
- Les statistiques et la newsletter comptent toujours les archivés (décision de Lucas).

### Tests de la v84
- Ajoute à verif86 :
  - plus d'ancien écran en double, et chaque élément déplacé reste accessible ;
  - le bouton Archiver est en or ;
  - un parcours fait en anglais donne un message WhatsApp en anglais.

---

# PARTIE B — v85 : bloc 4 (branche v2/bloc-4)

### Les données : docs/maj-bloc-4/programmes-formation.json (fait foi)
- 3 programmes, transcrits des PDF de la formation. On ne garde que les séances et la méthode, pas les longs textes.
  - **Programme salle 12 semaines · Homme** : 3 phases (semaines 1-4, 5-8, 9-12), 6 séances par phase.
  - **Programme salle 12 semaines · Femme** : même structure, avec des HIIT à 3 options et des séances cardio.
  - **Full body à la maison** : 3 séances + 1 séance bonus en circuit.
- Un échauffement commun, la règle « Combien de séances ? » et le tableau « attribution ».
- Supersets : 2 lignes avec technique « superset » et le même « groupe ». Dropsets : technique « dropset ».

### B1. Un seul nom par exercice, et la vidéo qui s'accroche toute seule
- Relie chacun des 104 noms d'exercices du JSON à un exercice de donnees/exercices.json (id). Exemples à fusionner :
  - « Squat arrière » = « Squat » ;
  - « Fentes bulgares » = « Squat bulgare » ;
  - « Planche statique » = « Planche (gainage) » = « Planche abdominale » ;
  - « Jump squats » = « Squats sautés » ;
  - « Pompes avec clap » = « Pompes avec claquement ».
- Dans l'app, affiche le nom de l'exercice tel qu'il est dans l'app. La vidéo vient de son champ « lien ».
- Un nom sans équivalent sûr : ne devine pas. L'exercice s'affiche avec le nom du PDF et sans vidéo. Mets-le dans la liste « à préciser » du rapport.
- Mets aussi dans le rapport le tableau complet « nom du PDF → exercice de l'app », pour que Lucas le relise.

### B2. Attribution du programme (validée par Lucas)

| Objectif (parcours) | Homme | Femme |
|---|---|---|
| Perdre du gras | Salle homme, toutes les séances | Salle femme, toutes les séances |
| Prendre du muscle | Salle homme ; séance 6 marquée « Facultative » | Salle femme ; séance 6 marquée « Facultative » |
| Me remettre en forme | Full body maison | Full body maison |

- Sans objectif ou sans sexe connu (anciens comptes) : la personne choisit elle-même son programme.
- **La personne peut toujours changer de programme** parmi les 3 (validé). Son choix et sa date de début sont rangés sans migration, dans une clé ou un champ qui existe déjà (par exemple prefs). Note l'endroit choisi.

### B3. Les écrans (style du bloc 1, FR + EN)
- **Étape 0 (lecture seule)** : regarde comment le programme s'affiche aujourd'hui pour un prospect (page verrouillée, gratuit_vitrine) et pour un client (programme fait par le coach, clé programme), et ce qui existe déjà pour noter une séance faite.
- **Prospect** : l'onglet Programme montre son programme de la formation. En dessous, la carte existante 🔒 « Après ton bilan : ton programme sur mesure, avec ton coach. » reste.
- **Client** : son programme fait par le coach reste en premier et ne change pas. Les programmes de la formation sont accessibles en plus, dans une section ou un onglet à part.
- **Page programme** :
  - nom du programme et bouton « Changer de programme » ;
  - la règle « Combien de séances ? » en une ligne dépliable ;
  - 3 onglets de phase (Semaines 1-4, 5-8, 9-12), avec la phase du moment choisie d'après la date de début ; la personne peut en ouvrir une autre ;
  - la liste des séances.
- **Écran séance** :
  - l'échauffement commun, replié, en haut ;
  - puis chaque exercice : nom, séries × reps, repos, pastille « Superset » ou « Dropset », la note s'il y en a une, et un bouton vidéo (comme les vidéos d'exercices d'aujourd'hui : YouTube seulement) ;
  - pour un HIIT ou un circuit : la consigne puis la liste (le temps de travail et de repos) ; pour un HIIT à options : 3 onglets Option 1, 2 et 3 ; pour le cardio : la consigne seule.
- **Full body maison** : la méthode, en 3 phrases, en haut du programme.
- **Accueil** : une carte « Ton programme », avec le nom, la phase et le bouton « Voir mes séances ». Pas de nouveau suivi de séance : si l'app sait déjà noter une séance faite, réutilise-le ; sinon, n'en crée pas et note l'idée dans le rapport.
- **CONFIG.parcours.disponibles.programme passe à true** : le badge « Bientôt » disparaît de Programmes. Ne change pas les textes « ton espace » du parcours : note-le dans le rapport, Lucas décidera.
- **Anglais** : traduis l'interface, les noms de séances, les consignes et la méthode (anglais américain). Pour les noms d'exercices, garde ceux de l'app.

### B4. « Speed Formation » devient « Formation » (validé par Lucas)
- Plus aucun « Speed Formation » nulle part dans l'app (4 endroits connus dans js/config.js, plus les traductions).
- Nom : **Formation**. Sous-titre : « Cours et ebooks : alimentation, entraînement, mindset ». En anglais : « Course », sous-titre « Courses and ebooks: nutrition, training, mindset ».

### Tests du bloc 4
- Nouvelle suite verif87, inscrite au banc. Elle vérifie :
  - l'attribution de chaque objectif × sexe, et le choix manuel sans objectif ;
  - « Changer de programme » et la phase choisie d'après la date de début ;
  - chaque séance des 3 programmes s'ouvre, avec le bon nombre d'exercices (le JSON fait foi) ;
  - les supersets, les dropsets, les options de HIIT et le cardio ;
  - le bouton vidéo est présent si l'exercice a un lien, et absent sans lien ;
  - le programme d'un client fait par le coach est inchangé ;
  - plus de badge « Bientôt » sur Programmes ;
  - plus aucun « Speed Formation » ;
  - l'anglais, les largeurs 360, 390 et 430 px, Chromium et WebKit.
- Tous les tests existants restent verts. Ne retire ni n'affaiblis aucune vérification. Base simulée uniquement : aucun vrai compte, aucune écriture dans Supabase.


## Pour les deux versions
- Tous les tests existants restent verts. Ne retire ni n'affaiblis jamais une vérification (seulement adapter un sélecteur ou un texte si l'écran change, même nombre de vérifications).
- Base simulée uniquement : aucun vrai compte, aucune écriture dans Supabase.

## Règles d'arrêt
STOP (pas de push sur main, rapport, arrêt) seulement si :
- une info ou une action disparaîtrait sans nouvelle place ;
- une migration serait nécessaire ;
- une donnée existante changerait (programme d'un client, comptes) ;
- un test reste rouge après 2 tentatives de correction.
Si la v84 est en ligne et que la v85 bloque : la v84 reste en ligne, rapport, arrêt.

## Rapport final court (docs/maj-bloc-4/RAPPORT.md + dans le chat)
1. Ce qui est en ligne (versions, commits, lien).
2. Ce qui n'est pas fait, et pourquoi.
3. v84 : la liste avant/après de l'ancien écran ; où la langue du parcours est enregistrée.
4. v85 : le tableau « nom du PDF → exercice de l'app » et la liste « à préciser » (sans vidéo ou sans équivalent sûr) ; où le choix de programme est rangé.
5. Au maximum 5 points à tester sur le téléphone, avec le lien.
6. Les choix faits seul.
