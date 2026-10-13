# v78 — Limites d'écriture dans la base (lot 2 de la v66)

**État au 12/10/2026 : PRÉPARÉ, RIEN N'EST APPLIQUÉ.** Aucun fichier de ce dossier n'a été lancé : ni sur la vraie base (refus
`execute_sql` / `apply_migration` cette nuit, et c'est une décision de Lucas), ni en local (ni Docker ni Postgres sur le Mac).
Les tests sont écrits pour être lancés demain sur un Postgres local, avant toute chose. Relu la même nuit ; les réserves de la
relecture sont corrigées (retour arrière relançable, sauvegarde complète et vérifiée, répétition en un fichier sans `commit`,
vérification des clés au banc, empreinte des règles plus complète, 2 tests de plus).

## Le problème, en deux phrases
Depuis l'ouverture de l'inscription (v54), n'importe qui peut créer un compte « prospect ». Ce compte peut écrire par l'API,
dans ses propres lignes, **n'importe quelle clé et n'importe quelle taille** : un seul inscrit pourrait remplir les 500 Mo
gratuits de la base (audit du 01/10), et un prénom de plusieurs mégaoctets passe aussi.

## Ce que la migration change (et ce qu'elle ne change pas)
- La base n'accepte plus que **les 29 clés que l'app écrit** (27 au 12/10, plus `journal_alimentaire` en v79 et `seances_formation` en v90) (liste et raisons : `../releve-2026-09-30/INVENTAIRE-CLES.md`).
- Chaque clé a une **taille maximale**, 5 à 10 fois au-dessus de sa taille réaliste la plus lourde (16 Ko pour les petites
  clés, 4 Mo pour le journal, 16 Mo pour l'historique des diètes…). Un **prospect** : 256 Ko au plus par clé.
- **Prénom et nom** : 100 caractères au plus (l'app en écrit 60 au plus à l'inscription).
- Une ligne déjà là et plus grosse que sa limite (impossible le jour J : la migration s'arrête avant) resterait **lisible** et
  **modifiable sans grossir** ; elle ne pourrait plus grossir.
- **Ne change pas** : aucune ligne n'est modifiée ni supprimée ; les règles d'accès (RLS), les fonctions existantes, les
  colonnes, la lecture : tout reste identique. `est_coach`, `est_client`, `noter_connexion` gardent leur droit d'exécution
  pour `authenticated` (règle « Security Advisor » de `CLAUDE.md`, vérifiée par la migration, les tests et les vérifications).
- Côté app, rien à changer : un refus de la base est déjà géré (la modification reste sur l'appareil, message « Préviens ton
  coach »). Avec ces marges, aucun usage normal ne doit l'atteindre.
- **Le seul vrai risque dans la durée** : une clé ajoutée plus tard dans l'app sans être ajoutée à `public.v78_limite()` serait
  refusée en production (gardée sur l'appareil, jamais renvoyée toute seule, perdue à la déconnexion après un avertissement),
  et les suites du banc ne le verraient pas (elles imitent Supabase). D'où `tests-locaux/garde-cles.js` au banc (partie 10) :
  rouge si une clé que `js/` écrit ou lit manque dans la liste de `02-migration.sql`.

## Les fichiers
| Fichier | Rôle | Où le lancer |
|---|---|---|
| `00-socle-local.sql` | imitation minimale de Supabase (rôles, `auth.uid()`, tables, fonctions, règles RLS exactes du 29/09) | **Postgres local seulement** (refuse toute autre base que `mhx_v78_local`) |
| `01-releve-agregats.sql` | relevé en **agrégats**, une seule requête `SELECT`, aucune donnée de client | vraie base (éditeur SQL), avant ; peut se relancer après le retour arrière |
| `02-migration.sql` | la migration, non destructive, en une transaction, idempotente | local d'abord, puis vraie base (avec l'« ok » de Lucas), **éditeur SQL** |
| `03-retour.sql` | retour arrière : retire les 5 objets ajoutés (2 fonctions, 1 déclencheur, 2 contraintes), rien d'autre ; relançable | si besoin |
| `04-tests.sql` | 76 tests, transaction annulée, comptes fictifs | local |
| `05-verifications.sql` | vérifications après application, une seule requête `SELECT` | vraie base, juste après |
| `06-repetition.sql` | la répétition **toute prête** : `begin` + corps de 02 + corps de 04 + `rollback`, **aucun `commit`** | local (étape 0), puis vraie base (étape 3, obligatoire) |

`06-repetition.sql` ne se modifie jamais à la main : après un changement de 02 ou de 04, depuis `tests-locaux/` :
`node garde-cles.js ../index.html --refaire-06`. Le banc (`garde-cles.js`) est rouge si 06 n'est plus exactement 02 + 04, si un
`commit` s'y glisse, si les copies de la liste des clés (01, 02, 04, 05, INVENTAIRE) ou les formules d'empreinte (01, 02, 03, 05)
ne concordent plus.

## Ordre des étapes (chaque étape : rapport court, puis on attend l'« ok » de Lucas pour la suivante)

### 0. Tests en local (sans la vraie base)
Sur un Postgres 15 ou 17 local (installé par Lucas, ou par Claude avec son accord : cette nuit, aucune installation) :
```
createdb mhx_v78_local
psql -d mhx_v78_local -f 00-socle-local.sql
psql -d mhx_v78_local -f 06-repetition.sql         # la répétition de l'étape 3, telle quelle, sur une base sans v78
psql -d mhx_v78_local -f 01-releve-agregats.sql    # « objets v78 déjà là » : 0 (la répétition n'a rien laissé)
psql -d mhx_v78_local -f 02-migration.sql
psql -d mhx_v78_local -f 04-tests.sql
psql -d mhx_v78_local -f 05-verifications.sql      # aucune ligne « ÉCHEC » (ici, « À COMPARER » est normal)
psql -d mhx_v78_local -f 02-migration.sql          # 2e fois : idempotente, doit repasser sans erreur
psql -d mhx_v78_local -f 04-tests.sql
psql -d mhx_v78_local -f 03-retour.sql             # le retour arrière…
psql -d mhx_v78_local -f 03-retour.sql             # … une 2e fois : rien à retirer, doit passer SANS ERREUR
psql -d mhx_v78_local -f 01-releve-agregats.sql    # « objets v78 déjà là » : 0
psql -d mhx_v78_local -f 02-migration.sql          # et une nouvelle application
```
Attendu :
- `06` et `04` : `v78 : 76 / 76 tests OK, 0 sauté(s) — aucun échec. Annulation forcée : rien n'est gardé.` (c'est une erreur
  voulue) ;
- `01` : dernière ligne « OK pour appliquer » (base locale vide ; les tables du catalogue y sont « absente » : normal) ;
- `05` : aucune ligne « ÉCHEC » ;
- `03` deux fois de suite : aucune erreur (la 2e fois, seulement des avis « does not exist, skipping »).

**Arrêt** : un seul « ÉCHEC », ou une autre erreur : on corrige les fichiers (puis on refait 06), on ne va pas plus loin.

### 1. Relevé sur la vraie base (lecture seule)
Lucas colle `01-releve-agregats.sql` dans l'éditeur SQL de Supabase (ou Claude le lance, si Lucas lève le refus `execute_sql`
pour la séance). Le résultat (un tableau, sans donnée de client) est rangé hors dépôt :
`~/MHX-Code/sauvegardes/2026-10-13-avant-v78/releve-avant.csv`.
**Arrêt** si la dernière ligne n'est pas « OK pour appliquer » :
- une clé hors liste (partie A) : on l'ajoute à la liste avec une limite ×4 au moins de sa plus grosse ligne (02, 01, 04, 05,
  INVENTAIRE ; le banc vérifie qu'elles concordent), on refait 06, on relance l'étape 0 ; on ne supprime jamais la ligne ;
- une ligne au-dessus du **quart** de sa limite (marge sous ×4, parties A et B) : on relève la limite de cette clé, même suite ;
- un prénom ou un nom au-dessus de 100 caractères (partie D) : on en parle à Lucas (aucune ligne n'est jamais coupée) ;
- pas **6 règles sur `donnees` et 2 sur `profils`** (partie G) : on compare au HANDOFF §2.3 ; un écart voulu se règle avant
  d'appliquer (le bon nombre dans 01, 04 test 4 et 05), sinon on regarde avec Lucas ;
- un pré-requis « STOP » (partie H) : on s'arrête et on regarde.

À noter pour la suite : les 4 empreintes de la partie G (pour 05) ; les lignes / empreintes de chaque clé (partie A) ; le nombre
de lignes de chaque table (partie F, pour vérifier la sauvegarde) ; les **déclencheurs de `auth.users`** (partie G) : on doit y
voir celui de `creer_profil` ; s'il y en a un autre, on regarde ce qu'il fait avant la répétition (il s'exécutera pour les
comptes fictifs de 04, annulés avec eux).

### 2. Sauvegarde et comptage « avant »
- **Sauvegarde complète** juste avant : la sauvegarde automatique de la tâche 4 lancée à la main si elle est en place (elle
  copie toute la base), sinon l'export habituel par `SELECT` (HANDOFF §3, règle zéro perte n° 1) : `profils`, `donnees` avec
  `contenu`, `bibliotheque`, le catalogue (`aliments`, `recettes`, `programmes_types`, `exercices`), `briefs`, `connexions`, et le
  texte des règles, des fonctions et des déclencheurs. Rangée dans `~/MHX-Code/sauvegardes/2026-10-13-avant-v78/` (hors dépôt).
- **Vérifier la sauvegarde avant d'aller plus loin**, avec le relevé 01 lancé juste avant (partie F, « lignes de la table … ») :
  pour chaque table, autant de lignes dans la sauvegarde que dans le relevé (`donnees` : le nombre de la ligne « lignes de la
  table donnees ») ; dans `profils`, les **7 clients** (rôle et statut « client ») et le coach (partie D) ; le texte des 8 règles
  de `donnees` et `profils`. Un écart : on relance le relevé puis la sauvegarde (une inscription a pu arriver entre les deux) ;
  un écart qui reste = STOP.
- Le comptage « avant » est ce relevé (le relancer s'il date de plus d'une heure ; une sauvegarde de plus d'une heure : la
  relancer aussi, pas seulement le relevé).
- De préférence à une heure calme (peu de clients connectés : moins d'écritures entre « avant » et « après », et l'app ne se
  fige pour personne, voir l'étape 3).

### 3. Répétition sur la vraie base (obligatoire, avec l'« ok » de Lucas)
Obligatoire : `CLAUDE.md`, « Les garde-fous » (« répétition annulée ») ; l'étape 0 ne voit ni les vraies règles d'accès, ni les
vrais déclencheurs de `auth.users`, ni les vraies tailles. La sauter = une exception, seulement sur un « ok » écrit de Lucas.
Coller **`06-repetition.sql` tel quel** dans l'éditeur SQL, en un seul envoi — jamais un morceau de 02 ou de 04 (06 n'a aucun
`commit` ; 02 en a un, qui appliquerait la migration pour de bon). Tout est annulé. Attendu : l'erreur voulue
`v78 : 68 / 68 tests OK, 8 sauté(s) — aucun échec. Annulation forcée : rien n'est gardé.` (la partie F demande un
superutilisateur, qu'on n'a pas sur Supabase : elle est couverte par l'étape 0). Les comptes des tests sont fictifs
(`@exemple.invalid`) et disparaissent avec l'annulation ; aucun vrai compte n'est lu ni écrit.

**Pendant l'envoi, l'app peut se figer quelques secondes.** Ajouter une contrainte à `profils` verrouille toute la table jusqu'à
la fin de la transaction (même en `NOT VALID`), et chaque règle d'accès lit `profils` (`est_coach`). Pour la répétition, cela
dure le temps de tous les tests (contenus de plusieurs Mo) : un client connecté peut voir « Hors ligne — gardé sur cet appareil,
renvoi automatique » (ou, sans « Rester connecté », « Hors ligne — gardé dans cet onglet seulement : ne le ferme pas »).
**C'est normal** : l'app réessaie seule, rien n'est perdu tant que l'onglet reste ouvert (d'où l'heure calme). (Pour
l'application, étape 4 : moins d'une seconde.) Après : relancer 01, partie G : « objets v78 déjà là » = 0.

### 4. Application
`02-migration.sql` en entier, **dans l'éditeur SQL de Supabase** (Lucas, ou Claude par `execute_sql` si Lucas lève le refus) :
le fichier ouvre et ferme lui-même sa transaction. **Pas `apply_migration`** : l'outil peut entourer le SQL de sa propre
transaction (les `begin;` et `commit;` du fichier font alors doublon) et note une ligne dans `supabase_migrations` ; sa réponse
peut tromper (erreur affichée alors que c'est appliqué, ou l'inverse). S'il sert quand même : le fichier sans ses lignes
`begin;` et `commit;`. **Dans tous les cas, on ne juge que sur `05-verifications.sql`** (étape 5), jamais sur le message de
l'outil.

Une seule transaction : en cas d'erreur, **rien** n'est appliqué ; le message commence par « v78 : STOP — … » et dit pourquoi. Un
verrou attendu plus de 5 s annule tout aussi : on réessaie quelques minutes plus tard.

### 5. Vérifications et comptage « après »
`05-verifications.sql`, après avoir collé dans `avant` les 4 empreintes de la partie G du relevé. Attendu : aucune ligne
« ÉCHEC », dernière ligne « OK » (ou « À COMPARER / À REGARDER » si les seules lignes ni « OK » ni « INFO » sont en
« ÉCART » sur les empreintes de `donnees` ou des profils, expliquées par la partie E : `docs/V78-A-APPLIQUER-DEMAIN.md`,
étape 5). Comparer la partie E (lignes et empreinte par clé, lignes de chaque table) aux parties A et F du relevé :
- identiques : parfait ;
- une clé de `donnees` diffère : seulement si l'app l'a écrite entre-temps (une personne connectée : `activite`,
  `coach_visite`, `checkins`, `journal`…). Le catalogue et la bibliothèque : identiques attendus. Une différence qu'on ne sait
  pas expliquer, ou un nombre de lignes qui **baisse** : STOP, retour arrière (étape 7), on regarde avec Lucas. (La migration ne
  contient aucun `INSERT`, `UPDATE` ni `DELETE`.)

Puis, avec l'« ok » de Lucas, relancer `04-tests.sql` (sur la vraie base, il écrit des comptes fictifs puis annule tout) :
attendu `68 / 68 tests OK, 8 sauté(s)`.

**Le jour même, dès que 05 dit « OK »** (pas « plus tard ») : mettre à jour les repères, pour qu'aucune nouvelle clé ne parte
sans être ajoutée à la base :
- `docs/HANDOFF-CLAUDE-CODE.md` : §2.2, remplacer « PAS ENCORE APPLIQUÉE » par « appliquée le … » ; §2.3, ajouter le
  déclencheur `v78_donnees_limites` et les deux contraintes de `profils` ;
- `CLAUDE.md`, « Repères », une ligne : « **Limites d'écriture (v78, appliquée le …)** : la base n'accepte dans `donnees` que les
  clés de `public.v78_limite()` (`supabase/v78-limites/02-migration.sql`), avec une taille maximale par clé. Une nouvelle clé
  s'y ajoute d'abord, en base (`CREATE OR REPLACE FUNCTION`, non destructif, avec l'« ok » de Lucas) et dans le fichier, puis
  l'app ; sinon le banc (`garde-cles.js`) est rouge et la base refuserait l'écriture en production. »

### 6. Dans l'app (Lucas, avec le compte de test `9df6bb84…`, jamais un vrai client)
Ouvrir l'app, noter une séance, cocher un repas, ajouter une mesure, envoyer un bilan ; côté coach, ouvrir la fiche du compte de
test et envoyer un programme ; un compte prospect de test (à vérifier : aucun n'est noté, à décider avec Lucas) :
questionnaire, calculateur. Aucun message « refusée par la base ».

### 7. Si quelque chose ne va pas
- Urgence, sans rien supprimer (une ligne, réversible) : `alter table public.donnees disable trigger v78_donnees_limites;`
  (les limites de `donnees` ne s'appliquent plus ; `enable trigger` pour les remettre).
- Retour complet : `03-retour.sql` (retire les 5 objets de la v78 et rien d'autre), puis `01-releve-agregats.sql` : la partie G
  ne montre plus d'objet v78, les empreintes des règles et des fonctions sont celles d'avant. `03` peut se relancer sans
  risque : une 2e fois, il ne trouve rien à retirer et passe sans erreur (un message d'erreur n'y veut donc jamais dire « à
  moitié retiré » : tout ou rien).
- Si `apply_migration` a servi malgré l'étape 4 : sa ligne d'historique dans `supabase_migrations` reste après le retour
  arrière (`03` ne la retire pas : ce n'est pas une donnée de compte). On la laisse ; une nouvelle application portera un autre
  nom.

### 8. Après
`docs/HISTORIQUE.md`, `supabase/README.md` (les repères de HANDOFF et `CLAUDE.md` sont faits à l'étape 5, le jour même).

## Critères d'arrêt (résumé)
Un test local rouge · le banc rouge (`garde-cles.js`) · une ligne « STOP » au relevé (dont « pas 6 + 2 ») · la sauvegarde
absente, sans les 7 clients, ou avec un nombre de lignes différent du relevé · une erreur à l'application · une ligne « ÉCHEC »
aux vérifications · un écart de comptage inexpliqué · un message « refusée par la base » dans l'app.
Dans tous les cas : on s'arrête, rien n'est perdu (aucune ligne n'est touchée), on en parle à Lucas.

## Décisions prises dans ce projet (à confirmer par Lucas)
- **Déclencheur plutôt que règles RLS** : le projet du 30/09 modifiait les règles « propriétaire » (`ALTER POLICY`) ; un
  déclencheur couvre aussi les écritures du coach, ne touche à aucune règle d'accès, et se met à jour par
  `CREATE OR REPLACE FUNCTION` (sans `DROP`) quand une clé arrive.
- **Ancienne ligne plus grosse que sa limite** : lisible, modifiable sans grossir, ne peut plus grossir (test 90 à 97).
  Pourquoi : personne n'est jamais bloqué sur sa propre donnée, la base ne coupe ni n'efface rien, et aucun contenu nouveau ne
  dépasse la limite. Le jour J ce cas n'existe pas (la migration s'arrête si une ligne dépasse le quart de sa limite) ; il ne
  pourrait venir que d'une limite abaissée plus tard.
- **Plafond prospect** de 256 Ko par clé, jugé sur l'auteur de l'écriture (le coach qui écrit chez un prospect n'y est pas
  soumis ; sans session — clé de service, éditeur SQL — non plus : tests 65 et 66).
- **Un client que le coach « repasse prospect »** : le plafond vise celui qui écrit, au moment où il écrit. Si ce client a déjà
  une clé au-dessus de 256 Ko (journal, bilans…), elle ne peut plus grossir : ses nouvelles séances sont refusées et gardées sur
  l'appareil, avec « Préviens ton coach ». Le jour J ce cas est arrêté par le garde-fou ; il peut apparaître ensuite. Autre
  point : pour `formation`, le cas lourd d'un prospect (69 Ko) ne laisse que ×3,7 de marge, sous la règle ×4 de ce lot.
  **Choix simple pour Lucas** : garder 256 Ko et l'accepter (repasser un client prospect reste rare ; le coach peut le
  repasser client), ou passer le plafond prospect à **512 Ko** (environ 6,3 Mo au plus par compte prospect au lieu de 3,6 Mo ;
  marge de `formation` ×7,4). Si 512 Ko : changer la valeur dans 02 et ses copies (01, 04, 05 : le banc vérifie qu'elles
  concordent), adapter les tests 3, 25, 55, 56, 65 et 71 de 04, refaire 06, relancer l'étape 0. Ne pas remplacer 262144
  partout : c'est aussi la limite de `intake`.
- **Prénom / nom** : contraintes `CHECK` validées (100 caractères). Une inscription faite hors de l'app avec un prénom plus long
  échoue en entier (aucun compte créé) ; un accès créé par le coach avec un nom de plus de 100 caractères aussi (message
  d'erreur de Supabase, le champ du coach n'a pas de `maxlength`).

## Ce qui reste après ce lot (pour information, hors sujet)
L'inscription est libre et sans confirmation d'email (décisions de Lucas). Après la v78, un compte prospect peut écrire environ
**3,6 Mo au plus** (les 24 clés qu'il a le droit d'écrire, chacune plafonnée), au lieu de « sans limite ». Environ 140 faux
comptes suffiraient encore à remplir les 500 Mo de la base. Ce lot ne règle pas ce point : c'est le rôle du CAPTCHA (tâche 3 de
la v78, en ligne mais éteint) et des limites d'inscription de Supabase Auth, à décider par Lucas.
