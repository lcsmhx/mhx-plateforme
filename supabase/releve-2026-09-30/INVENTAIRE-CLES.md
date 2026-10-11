# Inventaire des clés écrites dans `donnees` (et des champs de `profils`) — 12/10/2026, v78

Fait dans le code de la branche `v2/v78-limites` (au départ de `main` = v77, `85973aa` + plan v78). Il complète le relevé du 30/09
(`releve.sql`, requête 13), dont la liste de 25 clés **oubliait `contact` (v72) et `coach_visite` (v72 E)** : le projet de
migration v66 aurait refusé le numéro de téléphone des inscrits et la visite du coach. La liste à jour compte **27 clés** ;
c'est la seule liste admise par la migration v78 (`supabase/v78-limites/02-migration.sql`, fonction `public.v78_limite`).

Taille = ce que la base mesure : `octet_length(contenu::text)`, le JSON tel que Postgres l'écrit (avec `", "` et `": "`, accents
sur 2 octets). « Taille lourde » = un cas lourd mais réaliste, calculé à partir des bornes du code ci-dessous (gros client,
textes longs, plusieurs années) ; aucune donnée réelle n'a été lue pour ce calcul. Le relevé `supabase/v78-limites/01-releve-agregats.sql`
donnera les vraies tailles (max, moyenne, p95) ; la migration s'arrête si une ligne dépasse le quart de sa limite.

## Qui peut écrire quoi (règles RLS, inchangées depuis la v49 — HANDOFF §2.3)
- **Le propriétaire** (client, prospect ou coach, sur ses propres lignes) : toutes les clés **sauf** `feedbacks`, `notes_coach`,
  `suivi_prospect` (règles « donnees creees / modifiees par leur proprietaire »). Sans la v78, n'importe quelle clé et n'importe
  quelle taille : c'est ce que le lot 2 ferme.
- **Le coach** (`est_coach()`), dans la fiche de n'importe quel compte : seulement `programme`, `repas`, `calc`, `complements`,
  `hist_programme`, `hist_repas`, `feedbacks`, `notes_coach`, `suivi_prospect`.
- **L'anonyme** : rien.

## Les 27 clés

| Clé | Qui l'écrit (et où dans le code) | Forme | Bornes déjà imposées par le code | Taille lourde | Limite v78 | Marge |
|---|---|---|---|---|---|---|
| `hist_repas` | coach seul, fiche du client : `Historique.archiver`, POST upsert direct (`js/outilProgramme.js:44`), appelé avant de remplacer une diète (`js/outilNutrition.js:952, 1053, 1067`) | `{liste[{nom, du, au, contenu: diète}]}` | 24 diètes (`js/outilProgramme.js:17`, 41) ; une diète n'a pas de borne de taille | 2,9 Mo (24 diètes de 7 j × 6 repas × 11 ingrédients) | 16 Mo | ×5,6 |
| `hist_programme` | coach seul, même chemin (`js/outilProgramme.js:44`, appelé 1041, 1109, 1131, 1146) | `{liste[{nom, du, au, contenu: programme}]}` | 24 programmes (`js/outilProgramme.js:17`) | 1,3 Mo (24 programmes lourds) | 8 Mo | ×6,5 |
| `journal` | client : `Journal`, `Store.ecrire` (`js/outilProgramme.js:304`) | `{seances[{date, si, nom, exos[{nom, series[{r, c}]}]}]}` | 400 séances (`js/outilProgramme.js:147`, 303) ; brouillon : r ≤ 6 car., c ≤ 8 car. (161) | 609 Ko (400 séances × 8 exercices × 5 séries) | 4 Mo | ×6,7 |
| `perf` | coach, pour lui-même (journal d'entraînement) : `js/outilEntrainement.js:72` | `{seances[…], courante, historique[{date, si, nom, exos[{nom, vol, max}], series, vol}]}` | **aucune** : `historique` grossit à chaque séance (`js/outilEntrainement.js:235`) | 622 Ko (3 ans à 5 séances par semaine ; ~210 Ko par an) | 4 Mo | ×6,6 (≈ 19 ans) |
| `checkins` | client : `Checkin`, `Store.ecrire` (`js/outilSuivi.js:246, 259`) | `{liste[{semaine, fin, envoye_le, envoye_a, reponses{}}], avis[{semaine, fb, smiley, le, deplu?, ameliorer?}], fb_vu}` | 60 bilans (`js/outilSuivi.js:11`, 186, 348) ; 200 avis (12, 194, 617) ; textes du dimanche et des avis ≤ 2 000 car. (549, 571, 598-599, 634) ; textes du vendredi **sans** `maxlength` (75) | 281 Ko (60 bilans × 5 textes de 600 car. + 200 avis) | 2 Mo | ×7,3 |
| `repas` | coach, fiche du client (`js/outilNutrition.js:718`, 1018) ; client par « Remplacer » (801) | `{nom, note, cible, regime, allergenes, nb_repas, maj, debut, jours[{nom, repas[carte], manquants, complement, diagnostic}]}` | 7 jours × 2 à 6 repas (`js/outilNutrition.js:625`) ; cartes figées depuis le catalogue (étapes ≤ 320 o, ≤ 11 ingrédients dans `donnees/recettes.json`) | 121 Ko (7 j × 6 repas × 11 ingrédients) ; ~30 Ko pour une vraie diète (code, commentaire `js/outilProgramme.js:10`) | 1 Mo | ×8,5 |
| `feedbacks` | coach seul (le client la lit) : `Feedback`, `CleCoach.ecrireSi` (`js/outilSuivi.js:880`) | `{liste[{semaine, fin, date, texte, bilan?}]}` | 60 réponses (`js/outilSuivi.js:823`, 880) ; texte **sans** `maxlength` (916) | 105 Ko (60 × 1 500 car.) | 1 Mo | ×10 |
| `programme` | coach, fiche du client (`js/outilProgramme.js:978`, 1066) | `{nom, note, seances[{nom, note, exercices[{nom, series, reps, repos, note, lien, id}]}], maj, debut, cycle, duree_semaines, objectifs{mois, liste[3], statuts[3]}}` | aucune (séances, exercices, notes) ; programmes types du catalogue : 10 Ko au plus | 52 Ko (7 séances × 12 exercices, notes de 300 car.) | 512 Ko | ×10 |
| `atelier` | coach, pour lui-même (programme modèle) : `js/outilAtelier.js:46` | comme `programme` (+ lieu, niveau, objectif) | aucune | 52 Ko | 512 Ko | ×10 |
| `mens` | client ; prospect après l'accord santé (`Sante.bloque`) : `js/outilMensurations.js:310` (une mesure : 543) | `{dstart, pstart, zones[10], affichees[], compo_affichee, mesures[{sem, date, poids, vals{}, compo{}}]}` | une mesure par semaine, **sans** borne de nombre | 70 Ko (5 ans de mesures hebdomadaires ; ~14 Ko par an) | 512 Ko (prospect : 256 Ko) | ×7,3 |
| `formation` | client, prospect : `js/outilFormation.js:784` | `{coches{}, ouvert, lecon, challenge, defis{}, diete{semaine:{jour:[6 repas]}}, semaine, jour, priorites{}, notes[], objectifs[]}` | diète 12 semaines × 7 j × 6 repas (`js/outilFormation.js:641-646`) ; notes, priorités, objectifs **sans** borne (956, 935, 972) | 69 Ko (diète pleine + 30 notes de 1 000 car.) ; prospect réaliste ~35 Ko | 512 Ko (prospect : 256 Ko) | ×7,4 (prospect ×3,7 au pire, ×7 réaliste) |
| `photos` | client (index ; le dépôt des images est réservé aux clients par Storage depuis la v42) : `js/outilMensurations.js:167, 175, 181` | `{liste[{semaine, date, vues{face, profil, dos}}]}` | une entrée par semaine ; chemins de forme fixe (`Photos.valide`, `js/outilMensurations.js:27`) | 60 Ko (5 ans) | 512 Ko | ×8,5 |
| `notes_coach` | coach seul, illisible par le client : `NotesCoach`, `CleCoach.ecrireSi` (`js/outilSuivi.js:987`) | `{texte, maj, avant?}` | texte **sans** `maxlength` (963) ; `avant` = la version précédente (le double) | 43 Ko (20 000 car. + version précédente) | 512 Ko | ×12 |
| `intake` | client : questionnaire (`js/outilProfil.js:295`) ; prospect : Découverte (`js/outilDecouverte.js:876, 972, 1099, 1113, 1133, 1187`) | client : 57 questions (28 textes longs) + `complet` ; prospect : 10 réponses + `court_le`, `email_compte`, `bilan_propose`… | textes du client **sans** `maxlength` (`js/outilProfil.js:163`) ; prospect : réponses et précisions ≤ 500 car. (`js/outilDecouverte.js:1050, 1073`), 2 choix au plus | 28 Ko (28 textes de 800 car.) ; prospect ~3 Ko | 256 Ko | ×9,4 |
| `complements` | coach, fiche du client : `js/outilComplements.js:120` | `{liste[{ref, nom, dose, unite, moment, note, proteine, par100}], note}` | aucune | 17 Ko (30 produits) | 128 Ko | ×7,6 |
| `repas_suivi` | client : `js/outilNutrition.js:742, 747, 751, 758, 802` | `{date, mange{}, courses{}, joursCourses{}, hist{date:{c, p}}}` | `hist` : 70 jours (`js/outilProgramme.js:427`) ; `mange` ≤ 42 cases | 14 Ko (150 articles de courses) | 128 Ko | ×9 |
| `challenge` | prospect, le compte lui-même (jamais le coach) : `Decouverte.plusTard / clic / reserver` (`js/outilDecouverte.js:312, 323, 331`) | `{cta{clics[{jour, source, date}], plus_tard[{source, date}]}, reserve}` ; anciens prospects du challenge : `{version, debut, jours{1…7}, termine}` | 50 clics (`js/outilDecouverte.js:322`), 50 « Plus tard » (311) | 13 Ko | 128 Ko | ×10 |
| `suivi_prospect` | coach seul, illisible par le prospect : `Commercial`, `CleCoach.ecrireSi` (`js/outilProspects.js:315`) | `{version, issue, issue_le, note, bilan_le, relances[], historique[{type, valeur?, le, note?}]}` | note ≤ 200 car. (`js/outilProspects.js:397`) ; 20 relances (323) ; 30 événements (320) | 10 Ko | 128 Ko | ×13 |
| `activite` | prospect (et client si l'interrupteur `suivi_visites_clients` le permet) : `Activite`, `Store.ecrire` (`js/outilDecouverte.js:701`) | `{version, jours[], pages{}, temps_s, derniere}` | 60 jours (`js/outilDecouverte.js:529, 537, 548, 566`) ; noms de page ≤ 40 car. (528) | 1,4 Ko | 64 Ko | ×45 |
| `calc` | coach, fiche du client ou pour lui-même : `js/outilCalculateur.js:332` | `{sexe, age, taille, poids, pas, heures, objectif}` | 7 champs | 0,1 Ko | 16 Ko | ×150 |
| `calc_perso` | prospect, client (v52, v53) : `js/outilCalculateur.js:200, 205` | comme `calc` | 7 champs | 0,1 Ko | 16 Ko | ×150 |
| `objectifs_faits` | client : `js/outilProgramme.js:470` | `{mois, faits[3]}` | 3 cases | < 0,1 Ko | 16 Ko | — |
| `prefs` | tout compte (jamais une fiche consultée) : `Store.envoyer` (`js/i18n.js:108`) | `{langue}` | 1 champ | < 0,1 Ko | 16 Ko | — |
| `emails` | prospect : `Accords.copierEmails`, POST simple sans fusion (`js/auth-store.js:436`) ; Profil (`js/outilProfil.js:341`) | `{newsletter, maj, version, source, suivi?}` | 5 champs | 0,1 Ko | 16 Ko | — |
| **`contact`** (v72, oubliée le 30/09) | client, prospect, le compte lui-même (jamais le coach) : `Contact.enregistrer` → `CleCoach.ecrireSi` (`js/auth-store.js:484`), appelé à l'inscription (`js/connexion.js:183`), à l'écran « Ajoute ton numéro » (`js/connexion.js:320`), dans Profil (`js/outilProfil.js:372`), au démarrage (copie de secours, `js/auth-store.js:327`) | `{telephone, ref, inscrit_le}` | téléphone `^\+[1-9]\d{6,16}$` (`js/boite-a-outils.js:105` ; saisie `maxlength` 24 : 142) ; `ref` ≤ 30 car. (`js/auth-store.js:469`) | 0,1 Ko | 16 Ko | — |
| `coach_notifs` | coach, pour lui-même : `Nouveautes.marquerVu` (`js/outilProspects.js:526`) | `{vu}` | 1 champ | < 0,1 Ko | 16 Ko | — |
| **`coach_visite`** (v72 E, oubliée le 30/09) | coach, pour lui-même : POST upsert direct (`js/outilTableau.js:161`) | `{le, jusqua, avant, avant_le}` | 4 dates (`js/outilTableau.js:55-66`) | 0,1 Ko | 16 Ko | — |

**Plafond prospect** (v78, reprend l'idée du projet v66) : un compte connecté qui n'est ni coach ni client (l'inscription libre)
écrit **256 Ko au plus par clé**, quelle que soit la clé (la plus grosse qu'il écrit réellement : `formation` / `mens`, ~35 Ko
réalistes). Le coach qui écrit dans la fiche d'un prospect n'y est pas soumis (c'est l'auteur qui compte). Sans session (clé de
service, éditeur SQL) : la limite de la clé seule.

**Restauration d'une sauvegarde** (`Store.importer`, `js/auth-store.js:1161`) : réécrit, avec le contenu d'un fichier fourni par
la personne, toutes les clés des outils et `calc_perso` (jamais `emails`, `activite`, les clés du coach seul, ni — pour un client
— les clés écrites par le coach). Le fichier n'a aucune borne côté app : c'est la base qui borne.

## Les écritures qui ne passent pas par `Store.ecrire` / `Store.envoyer`
- `emails` : `Accords.copierEmails`, `js/auth-store.js:436` (POST simple : refusé si la ligne existe déjà, 409).
- `contact` : `Contact.enregistrer` → `CleCoach.ecrireSi`, `js/auth-store.js:484`.
- `hist_programme`, `hist_repas` : `Historique.archiver`, `js/outilProgramme.js:44` (POST upsert).
- `coach_visite` : `js/outilTableau.js:161` (POST upsert, échec seulement noté dans la console).
- `feedbacks`, `notes_coach` : `CleCoach.ecrireSi`, `js/outilSuivi.js:790` (PATCH conditionnel sur `maj_le`) / 801 (POST simple).
- `suivi_prospect` : `Commercial.modifier` → `CleCoach.ecrireSi`, `js/outilProspects.js:315`.
- Ce que l'app fait d'un refus de la base (erreur 400 de la v78) : `Store.envoyer` garde la modification sur l'appareil
  (`mhx_refus|…`) et affiche « Non enregistré : la base a refusé cette modification. Préviens ton coach. »
  (`js/auth-store.js:1044-1051`) ; `CleCoach` garde le texte dans le champ, mais son message dit « la connexion a échoué »
  (`js/outilSuivi.js:814-818`, message à revoir si une limite était un jour atteinte) ; `Historique.archiver` demande
  « L'ancien programme n'a pas pu être rangé… Le remplacer quand même ? » (`js/outilProgramme.js:55-62`).
- Clés de l'appareil (`localStorage` / `sessionStorage`, **pas** dans la base) : `mhx_langue`, `mhx_theme`, `mhx_ref`,
  `mhx_attente|…`, `mhx_refus|…`, `mhx_invitations|…`, `mhx_activite_attente|…`, `mhx_contact_attente|…`, `mhx_tracking`.

## `profils` : prénom, nom, statut, rôle

| Champ | Qui l'écrit (et où) | Bornes du code | Limite v78 |
|---|---|---|---|
| `prenom` | à l'inscription, le déclencheur `creer_profil` recopie `raw_user_meta_data.prenom` (`Auth.inscrire`, `js/auth-store.js:361-367` ; saisie `maxlength` 60 et `slice(0, 60)` : `js/connexion.js:72, 144`) ; accès créé par le coach : `creer-acces` (`supabase/releve-2026-09-30/fonctions/creer-acces/index.ts:67`, `trim` seul ; champ **sans** `maxlength` : `js/outilClients.js:213`) ; par l'API, le compte lui-même ou le coach (règle « profil modifiable par son proprietaire ou le coach » ; l'app ne le fait jamais) | 60 car. à l'inscription ; rien côté coach ni par l'API | **100 caractères** (`v78_profils_prenom_longueur`) |
| `nom` | idem : inscription `""` depuis la v74 (`js/connexion.js:171`) ; coach : `js/outilClients.js:214`, `index.ts:68` | rien | **100 caractères** (`v78_profils_nom_longueur`) |
| `statut` | coach : « Passer client / Repasser prospect » (`js/outilClients.js:299`), création d'accès (369), `Commercial.passerClient` (`js/outilProspects.js:328`) ; `creer-acces` (clé de service) ; gardé par `protege_role` | `prospect` / `client` (contrainte `profils_statut_valeurs`) | inchangé |
| `role` | coach : « Donner / retirer l'accès complet » (`js/outilClients.js:320`) ; `creer-acces` ; gardé par `protege_role` | `client` / `coach` | inchangé |
| `cree_le` | jamais par l'app ; modifiable par son compte par l'API (noté dans `js/outilTableau.js:122`) | — | hors de ce lot (audit du 01/10 : à décider) |

Affichage seulement (rien d'écrit) : `js/boite-a-outils.js:46` (Calendly, 80 car.) et 165 (60 car.).

## À tenir à jour
Une **nouvelle clé** écrite par l'app : l'ajouter d'abord dans `public.v78_limite()` (`CREATE OR REPLACE FUNCTION`, non
destructif), puis dans ce fichier et dans les listes de `supabase/v78-limites/` (01, 04, 05) ; sinon la base refuse son écriture
(l'app la garde sur l'appareil et affiche « Préviens ton coach »). C'est un 4e endroit à aligner, en plus des trois du HANDOFF §2.2.
