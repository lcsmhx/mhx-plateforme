# Rapport — mission de nuit du 14/10/2026

## 1. En une phrase
L'app est stable et plus sûre ce matin : 4 versions sont en ligne (v86 à v89), chacune avec le banc GitHub vert et le site vérifié ; le seul problème grave trouvé n'est pas dans l'app mais dans le dépôt public (anciennes branches avec des données de vrais clients), et c'est à toi de le régler (point 5, n° 1).

## 2. Les versions en ligne
Lien : https://lcsmhx.github.io/mhx-plateforme/

| Version | Commit sur main | Ce qui change |
|---|---|---|
| v86 | `9162a11` | Sécurité : une douzaine de corrections, invisibles pour un client normal (tableau du point 4). |
| v87 | `ac031e3` | Vidéos des programmes de la formation : « Burpees » corrigé, 11 vidéos AZEOO ajoutées. |
| v88 | `ea0d842` | L'accord santé redemandé une fois aux comptes dont l'accord date d'une ancienne version. |
| v89 | `899429a` | Qualité : une dizaine de petits bugs, plus de « 14 jours », 158 phrases traduites en anglais, accessibilité. |

Chaque version : banc GitHub vert sur sa branche puis sur main, publication réussie, site ouvert sans erreur dans un navigateur vierge, pied de page à la bonne version.

## 3. Lots abandonnés ou incomplets
- **Lot 5 (« J'ai fait cette séance »)** : pas fait. La mission le permettait seulement si les lots 1 à 4 étaient finis 2 h avant la limite de 8 h 30 ; ce n'était pas le cas.
- **Lot 4** : seulement les corrections sûres. Pas faits (notés pour plus tard) : agrandir certaines zones de toucher et renforcer certains contrastes (cela change un peu l'apparence), les écrans « Pas de connexion » du coach (fiche, calculateur, atelier), le bouton « Enregistrer dans ma bibliothèque » de l'atelier (il ne fait rien : à rebrancher avec un test), le contenu long des 2 leçons de la Formation en anglais.
- **Lot 1** : la barrière CSP du navigateur n'a pas été ajoutée (risque d'empêcher l'app de démarrer pendant ton voyage).
- **Lot 2** : rien d'abandonné.

## 4. Sécurité : les problèmes trouvés
Audit en lecture seule par 125 agents, chaque problème revérifié par deux autres : 92 constats, 50 confirmés, 3 plausibles, 39 pour information, aucun réfuté.

| Gravité | Quoi | Corrigé ? |
|---|---|---|
| Critique | 32 anciennes branches publiques montrent encore des données de santé et des noms de vrais clients | Non : suppression = toi (point 5) |
| Haute | Historique public de main : prénom d'une cliente dans 3 messages, anciens fichiers lisibles | Non : nettoyage = toi (point 5) |
| Haute | Limites d'écriture pas en base : un inscrit peut remplir la base | Non : Supabase = toi (point 5) |
| Moyenne | Inscription sans anti-robot, compte coach protégé par un seul mot de passe, un compte « accès complet » peut retirer ton rôle | Non : Supabase = toi |
| Moyenne | « Se déconnecter » laissait les autres onglets ouverts sur le compte | Oui (v86) |
| Moyenne | Notes privées et feedback du coach perdus sans message si la fiche était fermée | Oui (v86) |
| Moyenne | Réponses du parcours effacées sans message si leur enregistrement ratait deux fois | Oui (v86) |
| Moyenne | Une clé « __proto__ » écrite par un compte faisait lire de faux suivis dans les listes du coach | Oui (v86) |
| Moyenne | Un nom d'exercice piégé faisait planter la fiche ; diète avec des clés piégées | Oui (v86) |
| Moyenne | Pas de barrière CSP | Non : plus tard, avec tests |
| Basse | Lien Instagram et liens de la fiche non échappés ; jeton non renouvelé avant Créer un accès ; date illisible jetée sans message ; garde du dépôt sans recherche de secrets ; « Claude outputs/ » non ignoré | Oui (v86) |
| Basse | Fin de session : page vide après « Réessayer », bandeau trop optimiste, profil absent au démarrage | Non : notés |
| Info | Réglages du tableau de bord Supabase à vérifier (adresses de retour, mots de passe, sessions, photos) | À vérifier avec toi |

Rien de grave dans l'app elle-même : aucun texte d'un inconnu affiché sans échappement, export CSV protégé, aucun mot de passe gardé sur le téléphone, aucune clé secrète dans le dépôt, RLS activée partout, bucket des photos privé.

## 5. À faire avec Lucas : les 5 plus importants
Le détail, pas à pas : `docs/A-FAIRE-AVEC-LUCAS.md`.
1. **Supprimer les 32 anciennes branches publiques** (30 min, sauvegarde d'abord) et décider pour la CNIL.
2. **Nettoyer l'historique public** de main et la pull request n° 1 (2 à 3 h avec Claude, push forcé par toi).
3. **Appliquer les limites d'écriture** dans la base (v78, 2 à 3 h avec Claude ; vérifier d'abord la sauvegarde).
4. **Réglages Supabase** : mot de passe fort du coach, adresses de retour, sessions ; ne créer aucun compte « accès complet » d'ici là.
5. **Turnstile** (anti-robot), dans l'ordre de `docs/TURNSTILE.md`.

## 6. À tester sur ton téléphone
1. **Ton compte de test** : si son accord santé est ancien, la fenêtre « Notre politique de confidentialité a changé » s'ouvre une fois → « Plus tard » → elle ne revient pas avant 7 jours (rien ne change pour tes données).
2. **Programmes de la formation** (compte de test → Mon programme → Voir les programmes) : une séance HIIT montre « Burpees » sans vidéo ; « Soulevé de terre jambes tendues » a une vidéo AZEOO.
3. **Coach, deux onglets** sur l'ordinateur : « Se déconnecter » dans l'un → l'autre revient à l'écran de connexion.
4. **Accueil du compte de test** après un bilan envoyé : la carte « Bilan de la semaine envoyé › » ouvre Mon suivi.
5. **La Formation en anglais** (bouton EN) : les tâches, ressources et la diète sont en anglais ; plus de « 14 jours » en français.

## 7. Les choix faits seul
- **Fichier de la mission** : le Bureau m'était refusé par macOS ; j'ai pris la copie la plus récente de Téléchargements (`MISSION-NUIT_1.md`, 00 h 20, identique en contenu à ce que tu as validé, point 9 Supabase compris). La session était ouverte dans `MHX-Code` et pas dans `mhx-plateforme` : j'ai travaillé dans `mhx-plateforme` avec ses règles.
- **Aucune écriture dans Supabase**, aucun push forcé, aucune suppression sur GitHub. Seule exception à noter : pour vérifier la v86 en ligne, le navigateur de l'app était resté connecté au compte de test (`294c473f`) ; la simple ouverture a compté une connexion pour ce compte. Ensuite, toutes les vérifications ont été faites dans un navigateur vierge, sans compte.
- **Lot 1** : « Se déconnecter » prévient les autres onglets par le canal du navigateur (rien n'est rangé sur le téléphone) ; une session qui expire seule ne recharge rien. Le changement des recettes de secours (étiquettes régime / allergènes) a été retiré : zone la plus sensible, à faire avec des tests dédiés.
- **Lot 2** : « Burpees » délié partout (10 lignes), pas seulement dans les HIIT. « Tractions assistées » et « Curl barre EZ » déliés aussi (variantes pas sûrement identiques). Les vidéos ajoutées viennent toutes de la chaîne AZEOO, avec un titre identique, vérifiées par deux agents. « Rowing », « Extension mollets », « Vélo elliptique ou tapis », « Fentes statiques haltères », les step-ups : laissés sans vidéo (doute).
- **Lot 3** : la fenêtre s'adresse aux prospects et aux clients qui ont déjà un accord d'une version plus ancienne (pas à ceux qui n'en ont aucun) ; le tout premier accord est gardé (date, version, écran) ; « Plus tard » est retenu sur le téléphone et effacé à la déconnexion.
- **Lot 4** : les 10 axes du module 5 et 4 défis de la Formation restent en français en anglais (choix d'une version passée, vérifié par un test) ; les jours abrégés (Lun, Mar…) ne sont pas traduits (un prénom « Sam » deviendrait « Sat »).
- **Numéros de tests** : verif88 (lot 1), verif90 (lot 3), verif91 (lot 4) ; verif89 est gardé pour le lot 5.

---

## Annexe — lot 2 : vidéos des exercices (avant → après)

| Nom du PDF | Avant | Après |
|---|---|---|
| Burpees (HIIT, circuits, full body, 10 lignes) | « Burpees contrôlés » (sans saut) + vidéo | « Burpees », sans vidéo |
| Tractions assistées (4) | « Tractions » + vidéo | « Tractions assistées », sans vidéo |
| Curl barre EZ, Curl biceps barre EZ (4) | « Curl barre » + vidéo | « Curl barre EZ », sans vidéo |
| Soulevé de terre jambes tendues (7) | sans vidéo | vidéo AZEOO « Soulevé de terre jambes tendues » |
| Hip thrust à l'haltère | sans vidéo | vidéo AZEOO « Dumbbell Hip Thrust » |
| Développé militaire avec haltères | sans vidéo | vidéo AZEOO « Développé militaire aux haltères » |
| Squat avec haltères (2) | sans vidéo | vidéo AZEOO « Squat avec haltères » |
| Fentes avant | sans vidéo | vidéo AZEOO « Forward Lunges » |
| Fentes latérales | sans vidéo | vidéo AZEOO « Side Lunges » |
| Peck deck | sans vidéo | vidéo AZEOO « Écarté à la machine » |
| Triceps kickback avec haltères | sans vidéo | vidéo AZEOO « Dumbbell KickBack Triceps » |
| High knees, High knees rapides | sans vidéo | vidéo AZEOO « Montées de genoux » |
| Fentes sautées (2) | sans vidéo | vidéo AZEOO « Fente sautée » |
| Tirage poitrine, Dips sur banc, Leg curl couché, Mollets debout à la machine | reliés | gardés tels quels (même mouvement) |

**Toujours sans vidéo** (pas d'équivalent sûr ni de vidéo AZEOO au titre clair) : Box jump, Burpees, Burpees avec saut, Burpees explosifs, Curl barre EZ, Extension mollets, Fentes alternées, Fentes statiques haltères, Jumping jacks, Planche dynamique, Planche avec levée de jambe, Planche avec rotation, Planche avec rotation rapide, Planche avec touche d'épaule, Pompes avec claquement, Pompes explosives, Rowing, Squats sautés, Squats sautés avec levée de genoux, Step-ups avec haltères, Step-ups sur une chaise avec haltères, Tractions assistées, Vélo elliptique ou tapis de marche.
