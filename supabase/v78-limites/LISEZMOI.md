# v78 — Limites d'écriture dans la base (lot 2 de la v66)

**État au 12/10/2026 : PRÉPARÉ, RIEN N'EST APPLIQUÉ.** Aucun fichier de ce dossier n'a été lancé : ni sur la vraie base (refus
`execute_sql` / `apply_migration` cette nuit, et c'est une décision de Lucas), ni en local (ni Docker ni Postgres sur le Mac).
Les tests sont écrits pour être lancés demain sur un Postgres local, avant toute chose.

## Le problème, en deux phrases
Depuis l'ouverture de l'inscription (v54), n'importe qui peut créer un compte « prospect ». Ce compte peut écrire par l'API,
dans ses propres lignes, **n'importe quelle clé et n'importe quelle taille** : un seul inscrit pourrait remplir les 500 Mo
gratuits de la base (audit du 01/10), et un prénom de plusieurs mégaoctets passe aussi.

## Ce que la migration change (et ce qu'elle ne change pas)
- La base n'accepte plus que **les 27 clés que l'app écrit** (liste et raisons : `../releve-2026-09-30/INVENTAIRE-CLES.md`).
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

## Les fichiers
| Fichier | Rôle | Où le lancer |
|---|---|---|
| `00-socle-local.sql` | imitation minimale de Supabase (rôles, `auth.uid()`, tables, fonctions, règles RLS exactes du 29/09) | **Postgres local seulement** (refuse toute autre base que `mhx_v78_local`) |
| `01-releve-agregats.sql` | relevé en **agrégats**, une seule requête `SELECT`, aucune donnée de client | vraie base (éditeur SQL), avant ; peut se relancer après le retour arrière |
| `02-migration.sql` | la migration, non destructive, en une transaction, idempotente | local d'abord, puis vraie base (avec l'« ok » de Lucas) |
| `03-retour.sql` | retour arrière : retire les 5 objets ajoutés (2 fonctions, 1 déclencheur, 2 contraintes), rien d'autre | si besoin |
| `04-tests.sql` | 74 tests, transaction annulée, comptes fictifs | local ; répétition possible sur la vraie base (étape 3) |
| `05-verifications.sql` | vérifications après application, une seule requête `SELECT` | vraie base, juste après |

## Ordre des étapes (chaque étape : rapport court, puis on attend l'« ok » de Lucas pour la suivante)

### 0. Tests en local (sans la vraie base)
Sur un Postgres 15 ou 17 local (installé par Lucas, ou par Claude avec son accord : cette nuit, aucune installation) :
```
createdb mhx_v78_local
psql -d mhx_v78_local -f 00-socle-local.sql
psql -d mhx_v78_local -f 02-migration.sql
psql -d mhx_v78_local -f 04-tests.sql
psql -d mhx_v78_local -f 02-migration.sql          # 2e fois : idempotente, doit repasser sans erreur
psql -d mhx_v78_local -f 04-tests.sql
psql -d mhx_v78_local -f 03-retour.sql             # puis le retour arrière…
psql -d mhx_v78_local -f 02-migration.sql          # … et une nouvelle application
```
Attendu : `v78 : 74 / 74 tests OK, 0 sauté(s) — aucun échec. Annulation forcée : rien n'est gardé.` (c'est une erreur voulue).
**Arrêt** : un seul « ÉCHEC », ou une autre erreur : on corrige les fichiers, on ne va pas plus loin.

### 1. Relevé sur la vraie base (lecture seule)
Lucas colle `01-releve-agregats.sql` dans l'éditeur SQL de Supabase (ou Claude le lance, si Lucas lève le refus `execute_sql`
pour la séance). Le résultat (un tableau, sans donnée de client) est rangé hors dépôt :
`~/MHX-Code/sauvegardes/2026-10-13-avant-v78/releve-avant.csv`.
**Arrêt** si la dernière ligne n'est pas « OK pour appliquer » :
- une clé hors liste (partie A) : on l'ajoute à la liste avec une limite ×4 au moins de sa plus grosse ligne (02, 01, 04, 05,
  INVENTAIRE), on relance l'étape 0 ; on ne supprime jamais la ligne ;
- une ligne au-dessus du **quart** de sa limite (marge sous ×4, parties A et B) : on relève la limite de cette clé, même suite ;
- un prénom ou un nom au-dessus de 100 caractères (partie D) : on en parle à Lucas (aucune ligne n'est jamais coupée) ;
- un pré-requis « STOP » (partie H) : on s'arrête et on regarde.
À noter pour l'étape 5 : les 4 empreintes de la partie G et les lignes / empreintes de chaque clé (partie A).

### 2. Sauvegarde et comptage « avant »
- Sauvegarde complète juste avant : la sauvegarde automatique de la tâche 4 lancée à la main si elle est en place, sinon
  l'export habituel par `SELECT` (profils, donnees avec contenu, texte des règles, fonctions et déclencheurs), rangé dans
  `~/MHX-Code/sauvegardes/2026-10-13-avant-v78/` (hors dépôt), en vérifiant que les 7 clients y sont.
- Le comptage « avant » est le relevé de l'étape 1 (le relancer s'il date de plus d'une heure).
- De préférence à une heure calme (peu de clients connectés : moins d'écritures entre « avant » et « après »).

### 3. Répétition sur la vraie base (facultative, avec l'« ok » de Lucas)
Dans l'éditeur SQL, en un seul envoi : `begin; set local lock_timeout = '5s';` + le corps de `02-migration.sql` (entre
« DÉBUT DU CORPS » et « FIN DU CORPS ») + le corps de `04-tests.sql` (idem) + `rollback;`. Tout est annulé ; l'app attend
quelques secondes pendant l'envoi (verrous sur `profils` et `donnees` jusqu'à l'annulation). Attendu : `v78 : 66 / 66 tests OK, 8 sauté(s)` (la partie F demande un
superutilisateur, qu'on n'a pas sur Supabase : elle est couverte par l'étape 0). Les comptes des tests sont fictifs
(`@exemple.invalid`) et disparaissent avec l'annulation ; aucun vrai compte n'est lu ni écrit.

### 4. Application
`02-migration.sql` en entier (avec `apply_migration` si Lucas lève le refus, sinon Lucas dans l'éditeur SQL). Une seule
transaction : en cas d'erreur, **rien** n'est appliqué ; le message commence par « v78 : STOP — … » et dit pourquoi. Un verrou
attendu plus de 5 s annule tout aussi : on réessaie quelques minutes plus tard.

### 5. Vérifications et comptage « après »
`05-verifications.sql`, après avoir collé dans `avant` les 4 empreintes de la partie G du relevé. Attendu : aucune ligne
« ÉCHEC », dernière ligne « OK ». Comparer la partie E (lignes et empreinte par clé) à la partie A du relevé :
- identiques : parfait ;
- une clé diffère : seulement si l'app l'a écrite entre-temps (une personne connectée : `activite`, `coach_visite`,
  `checkins`, `journal`…). Une différence qu'on ne sait pas expliquer, ou une clé dont le nombre de lignes **baisse** : STOP,
  retour arrière (étape 7), on regarde avec Lucas. (La migration ne contient aucun `INSERT`, `UPDATE` ni `DELETE`.)
Puis relancer `04-tests.sql` (sur la vraie base, il est annulé) : attendu `66 / 66 tests OK, 8 sauté(s)`.

### 6. Dans l'app (Lucas, avec le compte de test `9df6bb84…`, jamais un vrai client)
Ouvrir l'app, noter une séance, cocher un repas, ajouter une mesure, envoyer un bilan ; côté coach, ouvrir la fiche du compte de
test et envoyer un programme ; un compte prospect de test : questionnaire, calculateur. Aucun message « refusée par la base ».

### 7. Si quelque chose ne va pas
- Urgence, sans rien supprimer (une ligne, réversible) : `alter table public.donnees disable trigger v78_donnees_limites;`
  (les limites de `donnees` ne s'appliquent plus ; `enable trigger` pour les remettre).
- Retour complet : `03-retour.sql` (retire les 5 objets de la v78 et rien d'autre), puis `01-releve-agregats.sql` : la partie G
  ne montre plus d'objet v78, les empreintes des règles et des fonctions sont celles d'avant.

### 8. Après
Mettre à jour `docs/HANDOFF-CLAUDE-CODE.md` (§2.2 : la liste des clés vit dans `public.v78_limite()`, 4e endroit à aligner ;
§2.3 : déclencheur et contraintes), `CLAUDE.md` (« Repères »), `docs/HISTORIQUE.md`, `supabase/README.md`.

## Critères d'arrêt (résumé)
Un test local rouge · une ligne « STOP » au relevé · la sauvegarde absente ou sans les 7 clients · une erreur à l'application ·
une ligne « ÉCHEC » aux vérifications · un écart de comptage inexpliqué · un message « refusée par la base » dans l'app.
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
  soumis).
- **Prénom / nom** : contraintes `CHECK` validées (100 caractères). Une inscription faite hors de l'app avec un prénom plus long
  échoue en entier (aucun compte créé) ; un accès créé par le coach avec un nom de plus de 100 caractères aussi (message
  d'erreur de Supabase, le champ du coach n'a pas de `maxlength`).
