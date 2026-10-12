# v78 — à appliquer demain avec Claude (séance du 13/10/2026)

Préparé la nuit du 12/10/2026. **Rien de ce fichier n'a encore été lancé.** Deux parties :
- **Tâche 5 — limites d'écriture dans la base** : procédure complète, étape par étape.
- **Tâche 6 — nettoyage de l'historique du dépôt** : squelette, à compléter après la répétition de cette nuit.

Référence de la tâche 5 : `supabase/v78-limites/LISEZMOI.md` (il fait foi en cas d'écart avec ce fichier).

---

## Les règles de la séance (`CLAUDE.md`)

- **Une étape à la fois.** Claude fait l'étape, fait un rapport court, puis **STOP** : il attend l'« ok » de Lucas.
- **Toute écriture dans la vraie base demande l'« ok » de Lucas, juste avant** : la répétition (06), la migration (02), le
  retour arrière (03), et même l'arrêt d'urgence.
- **Jamais `DROP`, `DELETE` ni `TRUNCATE` sur les données.** Le seul fichier avec des `DROP` est `03-retour.sql` : il ne
  retire que les 5 objets ajoutés par la v78 (vérifiés par leur commentaire), jamais une ligne.
- **Sauvegarde et comptage avant, répétition annulée, comptage après.** Un écart qu'on ne sait pas expliquer = **STOP**.
- **Agent `database-reviewer` obligatoire avant la migration** (étape 2 bis).
- **Compte de test seulement** (`9df6bb84…`), jamais un vrai client.
- `apply_migration` reste refusé. On ne juge jamais sur le message d'un outil, seulement sur `05-verifications.sql`.
- Ce qui n'est pas vérifié s'écrit « à vérifier ». Au moindre doute : STOP. Rien n'est perdu (la migration ne touche
  aucune ligne).

## Avant de commencer

**1. Les décisions de Lucas** (voir la liste à la fin de la partie 5). Elles se prennent avant l'étape 3.

**2. Le dossier de la séance**, hors dépôt (il reçoit le relevé, la sauvegarde, les journaux) :
```bash
mkdir -p ~/MHX-Code/sauvegardes/2026-10-13-avant-v78
chmod 700 ~/MHX-Code/sauvegardes/2026-10-13-avant-v78
```

**3. Les fichiers à jour.** `supabase/v78-limites/` doit être sur `main` après la fin de mission (sinon : branche
`v2/v78-fin`, à vérifier).
```bash
cd ~/MHX-Code/mhx-plateforme
git log -1 --oneline
ls supabase/v78-limites/
```
On doit lire 8 fichiers : `00-socle-local.sql` à `06-repetition.sql` et `LISEZMOI.md`.

**4. Le banc des clés** (sans navigateur, ne touche à rien) :
```bash
cd ~/MHX-Code/mhx-plateforme/tests-locaux
PATH="$HOME/.local/node/bin:$PATH" node garde-cles.js ../index.html
```
On doit lire : « 27 clés dans public.v78_limite » puis « aucun problème : … 06 = 02 + 04 sans commit ».
**Arrêt si** une ligne « PROBLÈME » : on corrige d'abord.

---

# Partie 5 — Limites d'écriture dans la base (lot 2 de la v66)

**En deux phrases.** Aujourd'hui, un inscrit peut écrire par l'API n'importe quelle clé, de n'importe quelle taille, dans
ses propres lignes : un seul compte pourrait remplir les 500 Mo gratuits. La migration n'accepte plus que les 27 clés de
l'app, chacune avec une taille maximale (256 Ko au plus par clé pour un prospect), et limite prénom et nom à 100 caractères.

**Ce qu'elle ne change pas** : aucune ligne modifiée ni supprimée ; règles d'accès, fonctions, colonnes, lecture : identiques.
Rien à changer dans l'app.

**L'ordre** :

| Étape | Quoi | Où | Écrit dans la vraie base ? |
|---|---|---|---|
| 0 | tests sur un Postgres local | Mac de Lucas | non |
| 1 | relevé en agrégats (`01`) | vraie base | non (lecture seule) |
| 2 | sauvegarde et comptage « avant » | GitHub (dépôt privé) ou vraie base | non |
| 2 bis | relecture `database-reviewer` | dépôt | non |
| 3 | répétition (`06`, tout annulé) — facultative | vraie base | non (annulée) |
| 4 | application (`02`) | vraie base | **oui** |
| 5 | vérifications (`05`) et comptage « après » | vraie base | non |
| 6 | essai dans l'app, compte de test | app | non (saisies de test) |
| 7 | si besoin : arrêt d'urgence ou retour arrière (`03`) | vraie base | **oui** |
| 8 | après : repères et historique | dépôt | non |

---

## Étape 0 — Tests sur un Postgres local (sans la vraie base)

**But** : faire tourner les tests une première fois. Ces fichiers n'ont encore jamais tourné nulle part.

**Sauvegarde** : aucune. Base locale de test, vide, rien de réel. `psql` ici ne connaît que le Postgres du Mac : il n'a
aucune adresse de la vraie base.

**0.a — Installer Postgres.app (Lucas, gratuit, une fois).** Claude ne télécharge rien sans l'accord de Lucas.
1. Sur https://postgresapp.com, page « Downloads » : télécharger Postgres.app (prendre une version qui contient
   **PostgreSQL 17**, la même famille que Supabase ; nom exact du téléchargement : à vérifier).
2. Glisser **Postgres.app** dans le dossier **Applications**, puis l'ouvrir.
3. Cliquer **Initialize** (crée le serveur local). Si on peut choisir la version : **17**.
4. Si une fenêtre demande d'autoriser le Terminal à se connecter : **OK** (selon la version, à vérifier).

Rien d'autre à régler sur le Mac : le chemin des commandes se donne dans le Terminal, pour la séance seulement.

**0.b — Vérifier l'outil** :
```bash
export PATH="/Applications/Postgres.app/Contents/Versions/17/bin:$PATH"
psql --version
```
On doit lire : `psql (PostgreSQL) 17.…` (si le dossier `17` n'existe pas : `Versions/latest/bin`, et noter la version).

**0.c — Les tests** (mêmes commandes que `LISEZMOI.md`, étape 0, avec deux options : `-X` ignore les réglages personnels
de psql, `-P pager=off` évite un écran qui attend une touche ; tout est aussi noté dans un journal) :
```bash
export PATH="/Applications/Postgres.app/Contents/Versions/17/bin:$PATH"
cd ~/MHX-Code/mhx-plateforme/supabase/v78-limites
J="$HOME/MHX-Code/sauvegardes/2026-10-13-avant-v78/etape0-local.txt"
createdb mhx_v78_local
psql -X -d mhx_v78_local -c "show is_superuser"
psql -X -P pager=off -d mhx_v78_local -f 00-socle-local.sql 2>&1 | tee -a "$J"
psql -X -P pager=off -d mhx_v78_local -f 06-repetition.sql 2>&1 | tee -a "$J"
psql -X -P pager=off -d mhx_v78_local -f 01-releve-agregats.sql 2>&1 | tee -a "$J"
psql -X -P pager=off -d mhx_v78_local -f 02-migration.sql 2>&1 | tee -a "$J"
psql -X -P pager=off -d mhx_v78_local -f 04-tests.sql 2>&1 | tee -a "$J"
psql -X -P pager=off -d mhx_v78_local -f 05-verifications.sql 2>&1 | tee -a "$J"
psql -X -P pager=off -d mhx_v78_local -f 02-migration.sql 2>&1 | tee -a "$J"
psql -X -P pager=off -d mhx_v78_local -f 04-tests.sql 2>&1 | tee -a "$J"
psql -X -P pager=off -d mhx_v78_local -f 03-retour.sql 2>&1 | tee -a "$J"
psql -X -P pager=off -d mhx_v78_local -f 03-retour.sql 2>&1 | tee -a "$J"
psql -X -P pager=off -d mhx_v78_local -f 01-releve-agregats.sql 2>&1 | tee -a "$J"
psql -X -P pager=off -d mhx_v78_local -f 02-migration.sql 2>&1 | tee -a "$J"
grep -n -E "ERROR|ÉCHEC|STOP" "$J"
```

**On doit lire** :
- `show is_superuser` : `on` (Postgres.app : on est superutilisateur ; sinon la partie F des tests est sautée) ;
- `00` : finit par `COMMIT`, sans `ERROR` ;
- `06` et les deux `04` : la liste des tests, tous « OK », puis l'erreur **voulue**
  `v78 : 76 / 76 tests OK, 0 sauté(s) — aucun échec. Annulation forcée : rien n'est gardé.` ;
- `01` (deux fois) : « objets v78 déjà là » = 0, dernière ligne « OK pour appliquer » (les tables du catalogue y sont
  « absente » : normal en local) ;
- `02` (trois fois) : `COMMIT`, sans `ERROR` (la 2e fois prouve qu'on peut la relancer) ;
- `05` : aucune ligne « ÉCHEC » ; ici « À COMPARER » est normal (pas de relevé « avant » collé) ;
- `03` deux fois de suite : `COMMIT` sans erreur (la 2e fois, seulement des avis « does not exist, skipping ») ;
- le `grep` final (à vérifier, c'est le premier passage) : seulement les 3 erreurs voulues « 76 / 76 tests OK » et les
  lignes « lignes STOP : aucune » des relevés. Toute autre ligne : on la lit.

**Retour arrière** : rien à défaire sur la vraie base. Pour repartir d'une base locale neuve :
```bash
dropdb mhx_v78_local      # base LOCALE de test seulement
createdb mhx_v78_local
```

**Arrêt si** : un seul « ÉCHEC », une autre erreur, ou un résultat différent de ce qui est écrit ci-dessus. On corrige les
fichiers (02 et 04, puis `node garde-cles.js ../index.html --refaire-06` depuis `tests-locaux/`, jamais 06 à la main),
`garde-cles.js` vert, commit sur une branche `v2/…`, et on refait toute l'étape 0 depuis une base neuve.

Rapport court à Lucas (nombres lus, chemin du journal), puis **STOP**.

---

## Étape 1 — Relevé en agrégats sur la vraie base (lecture seule)

**But** : voir la vraie base avant de rien faire. Une seule requête `SELECT` : elle ne peut rien écrire. Que des nombres,
des tailles, des noms de clés et des empreintes : aucune donnée de client.

**Sauvegarde** : aucune (lecture seule). Seulement si la façon B est choisie : la copie du fichier de réglages (ci-dessous).

**Façon A — Lucas, dans l'éditeur SQL de Supabase (conseillée)** :
1. Supabase → projet MHX (`nzynbuczmogifuidcjed`) → **SQL Editor** → nouvelle requête.
2. Coller **tout** le fichier `supabase/v78-limites/01-releve-agregats.sql` → **Run**.
3. Exporter le tableau en CSV (bouton d'export du résultat, libellé à vérifier) et l'enregistrer sous
   `~/MHX-Code/sauvegardes/2026-10-13-avant-v78/releve-avant.csv`. Claude le lit là.

**Façon B — Claude lance le relevé** (`execute_sql`) : Lucas lève le refus **pour la séance seulement**. C'est Lucas qui
modifie le fichier, pas Claude. Le refus est dans `~/MHX-Code/mhx-plateforme/.claude/settings.local.json` (à vérifier : la
séance doit s'ouvrir dans `mhx-plateforme`, comme le demande `CLAUDE.md`).
```bash
cd ~/MHX-Code/mhx-plateforme
cp .claude/settings.local.json ~/MHX-Code/sauvegardes/2026-10-13-avant-v78/settings.local.json.avant
```
Puis, dans `.claude/settings.local.json`, partie `"deny"`, supprimer **cette ligne et rien d'autre** :
```
      "mcp__3e33c859-98c2-4e0a-9811-ba419d6b88c8__execute_sql",
```
(Le début du nom, `mcp__3e33c859-…`, est celui de l'outil Supabase dans Claude Code ce 12/10 ; s'il a changé : la ligne
qui finit par `__execute_sql`.) **Garder** la ligne `…__apply_migration`. Vérifier :
```bash
grep -c "__execute_sql" .claude/settings.local.json        # attendu : 0
grep -c "__apply_migration" .claude/settings.local.json    # attendu : 1
python3 -m json.tool .claude/settings.local.json > /dev/null && echo "JSON OK"
```
Si le refus reste, rouvrir la session Claude Code (à vérifier). L'outil n'étant pas dans « allow », chaque appel devrait
demander une confirmation à Lucas (à vérifier). **Remettre le refus à la fin de la séance** (étape 8).

**On doit lire** : dernière ligne « Z bilan / verdict » = **« OK pour appliquer »**, avec « lignes STOP : aucune ».
À noter pour la suite (Claude, dans son rapport) :
- partie **G** : les 4 empreintes (règles RLS, fonctions de public hors v78_, toutes les lignes de donnees, profils) →
  pour l'étape 5 ;
- partie **A** : lignes et empreinte de chaque clé ; partie **F** : nombre de lignes de chaque table (pour l'étape 2) ;
- partie **D** : les comptes par rôle et statut (les comptes « client / client », dont les 7 vrais clients, et le coach) ;
- partie **G**, « déclencheurs de auth.users » : on doit y voir celui de `creer_profil` ; un autre = on regarde ce qu'il
  fait avant la répétition ;
- partie **H** : la version de Postgres de la vraie base (comparer à celle de l'étape 0).

**Retour arrière** : rien à défaire.

**Arrêt si** la dernière ligne n'est pas « OK pour appliquer » (`LISEZMOI.md`, étape 1) :
- une clé hors liste (partie A) : on l'ajoute à la liste avec une limite ×4 au moins de sa plus grosse ligne (02, puis ses
  copies 01, 04, 05, `INVENTAIRE-CLES.md`), on refait 06, on relance l'étape 0. **On ne supprime jamais la ligne** ;
- une ligne au-dessus du quart de sa limite (parties A et B) : on relève la limite de cette clé, même suite ;
- un prénom ou un nom de plus de 100 caractères (partie D) : on en parle à Lucas (aucune ligne n'est jamais coupée) ;
- pas **6 règles sur `donnees` et 2 sur `profils`** (partie G) : on compare au HANDOFF §2.3 avec Lucas ;
- un pré-requis « STOP » (partie H).

Rapport court, puis **STOP**.

---

## Étape 2 — Sauvegarde complète et comptage « avant »

**But** : une copie complète de la base, vérifiée, juste avant. De préférence à une heure calme (peu de clients connectés).

**Façon A — la sauvegarde automatique de la tâche 4 (conseillée).** Elle copie toute la base (méthode officielle de
Supabase), chiffrée, gardée 90 jours sur GitHub. Il lui manque deux secrets, que **Lucas** pose (jamais Claude) :
1. https://github.com/lcsmhx/mhx-prive/settings/secrets/actions → « New repository secret ».
2. `SUPABASE_DB_URL` et `SUPABASE_SERVICE_ROLE_KEY` : noms exacts et où trouver les valeurs dans le `README.md` du dépôt
   `mhx-prive` (partie « Les secrets à créer »). `PHRASE_SAUVEGARDE` est déjà posé.
3. Onglet **Actions** de `mhx-prive` → **Sauvegarde de la base** → **Run workflow**. Attendre 5 à 10 minutes.

**On doit lire** : coche verte ; dans le journal, le nombre de lignes de chaque table ; en bas, l'artefact
`mhx-base-AAAA-MM-JJ-HHMM`. Comparer **table par table** avec la partie F du relevé (« lignes de la table … ») : mêmes
nombres pour `profils`, `donnees`, `bibliotheque`, `aliments`, `recettes`, `programmes_types`, `exercices`, `briefs`,
`connexions`. Le nombre de `profils` doit aussi être la somme des comptes de la partie D. (Ouvrir la sauvegarde sur le Mac,
si besoin : `RESTAURATION.md` du dépôt privé, parties A et B ; c'est Lucas qui tape la phrase secrète.)

**Façon B — export par `SELECT`** (si les secrets ne sont pas posés ; demande la façon B de l'étape 1) : comme la
sauvegarde du 29/09 (`~/MHX-Code/sauvegardes/2026-09-29-avant-v56/`, son `LISEZMOI.md`) : `profils`, `donnees` avec
`contenu`, `bibliotheque`, le catalogue, `briefs`, `connexions`, et le texte des règles, des fonctions et des déclencheurs ;
résultats relus dans le journal de la session par `extraire.py` (chemin du journal à adapter), jamais recopiés à la main ;
contrôle ligne par ligne comme `verifier.py`. Rangé dans `~/MHX-Code/sauvegardes/2026-10-13-avant-v78/` (droits 700 / 600,
jamais commité).

**Comptage « avant »** : c'est le relevé de l'étape 1. Le relancer s'il a plus d'une heure.

**Retour arrière** : rien à défaire (une sauvegarde n'écrit rien dans la base).

**Arrêt si** : sauvegarde absente ou en échec, un nombre de lignes différent du relevé, ou les comptes de la partie D
absents. Un écart : on relance le relevé puis la sauvegarde (une inscription a pu arriver entre les deux) ; un écart qui
reste = **STOP**.

Rapport court (chemin ou nom de la sauvegarde, nombres comparés), puis **STOP**.

---

## Étape 2 bis — Relecture `database-reviewer` (obligatoire)

**But** : la relecture que `CLAUDE.md` impose avant toute migration Supabase.

Claude lance l'agent `database-reviewer` sur `supabase/v78-limites/` (02, 03, 05, 06), sur ce fichier et sur le relevé et
la sauvegarde des étapes 1 et 2 : SQL, sauvegarde, comptages, retour arrière.

**Arrêt si** une réserve : on la règle d'abord (fichiers corrigés, 06 refait, étape 0 relancée). Rapport, puis **STOP**.

---

## Étape 3 — Répétition sur la vraie base (facultative, « ok » de Lucas)

**But** : jouer la migration et les tests sur la vraie base, puis **tout annuler**. `06-repetition.sql` n'a aucun `commit`.

**Sauvegarde** : celle de l'étape 2 (moins d'une heure, sinon relancer le relevé).

**Commande** : coller **`06-repetition.sql` tel quel, en entier, en un seul envoi** dans l'éditeur SQL (Lucas), ou Claude
par `execute_sql` avec tout le fichier. **Jamais un morceau de 02 ou de 04** : 02 a un `commit`, il appliquerait la
migration pour de bon. Si l'éditeur affiche un avertissement : le lire et le dire à Claude avant de confirmer.

**Pendant l'envoi**, l'app peut se figer quelques secondes et afficher « Hors ligne — gardé sur cet appareil, renvoi
automatique » : c'est normal (verrou le temps des tests), l'app réessaie seule, rien n'est perdu.

**On doit lire** l'erreur **voulue** :
`v78 : 68 / 68 tests OK, 8 sauté(s) — aucun échec. Annulation forcée : rien n'est gardé.`
(les 8 tests de la partie F demandent un superutilisateur : couverts par l'étape 0). Puis relancer `01` : « objets v78
déjà là » = **0**, et les empreintes de la partie G égales à celles du relevé « avant » (aux écritures de l'app près).

**Retour arrière** : rien (tout est annulé). Si `01` montrait quand même des objets v78 : STOP, on regarde avec Lucas
(`03-retour.sql` avec son « ok »).

**Arrêt si** : « ÉCHECS : … » dans le message, une erreur « v78 : STOP — … », toute autre erreur, ou des objets v78
restés après. Rien n'est appliqué dans ces cas-là : on lit pourquoi et on s'arrête.

Rapport court, puis **STOP**.

---

## Étape 4 — Application (« ok » de Lucas juste avant)

**Sauvegarde** : celle de l'étape 2 (et le relevé de moins d'une heure).

**Commande** : **`02-migration.sql` en entier**, dans l'éditeur SQL (Lucas), ou Claude par `execute_sql` avec tout le
fichier. Le fichier ouvre et ferme lui-même sa transaction. **Pas `apply_migration`.**

**On doit lire** : un succès, sans erreur. On ne s'y fie pas : seule l'étape 5 dit si c'est appliqué.

**Retour arrière** : étape 7.

**Arrêt si** :
- un message qui commence par « v78 : STOP — … » : **rien n'est appliqué** (une seule transaction) ; on lit pourquoi, on
  corrige, on repart de l'étape 0 ;
- un verrou attendu plus de 5 s (« lock timeout ») : rien n'est appliqué ; on réessaie quelques minutes plus tard ;
- toute autre erreur : STOP, on lance `05` pour savoir où on en est, on regarde avec Lucas.

Pas de rapport long : on enchaîne sur l'étape 5 tout de suite, dans la même séance.

---

## Étape 5 — Vérifications et comptage « après »

**Commande** : une copie de `05-verifications.sql`, hors dépôt
(`~/MHX-Code/sauvegardes/2026-10-13-avant-v78/05-verifications-rempli.sql`), où les 4 `'COLLER ICI'` de la ligne `avant`
sont remplacés, dans cet ordre, par les 4 empreintes de la partie G du relevé « avant » : règles RLS, fonctions de public
(hors v78_), toutes les lignes de donnees, profils. La coller dans l'éditeur (ou `execute_sql`).

**On doit lire** : aucune ligne « ÉCHEC », dernière ligne **« OK »**. Puis comparer :
- partie E (lignes et empreinte par clé, lignes de chaque table, comptes par rôle) aux parties A, D et F du relevé : les
  mêmes ;
- une clé de `donnees` différente : seulement si l'app l'a écrite entre-temps (`activite`, `coach_visite`, `checkins`,
  `journal`…) ; catalogue et bibliothèque : identiques.

Puis relancer `04-tests.sql` (annulé) : on doit lire `68 / 68 tests OK, 8 sauté(s)`. Facultatif : relancer `01` et
l'enregistrer en `releve-apres.csv` (mêmes nombres en partie F, « objets v78 déjà là » = 5).

**Le jour même, dès que 05 dit « OK »** (`LISEZMOI.md`, étape 5) :
- `docs/HANDOFF-CLAUDE-CODE.md` : §2.2, « PAS ENCORE APPLIQUÉE » → « appliquée le 13/10/2026 » ; §2.3, ajouter le
  déclencheur `v78_donnees_limites` et les deux contraintes de `profils` ;
- `CLAUDE.md`, « Repères », la ligne « **Limites d'écriture (v78, appliquée le …)** » dont le texte est dans `LISEZMOI.md`
  (une nouvelle clé s'ajoute d'abord en base, puis l'app).

**Retour arrière** : étape 7.

**Arrêt si** : une ligne « ÉCHEC », un nombre de lignes qui **baisse**, ou une différence qu'on ne sait pas expliquer :
**STOP**, retour arrière (étape 7) avec l'« ok » de Lucas, on regarde ensemble.

Rapport (comptage avant / après, chemin de la sauvegarde), puis **STOP**.

---

## Étape 6 — Essai dans l'app (Lucas, compte de test `9df6bb84…`, jamais un vrai client)

Ouvrir l'app, noter une séance, cocher un repas, ajouter une mesure, envoyer un bilan. Côté coach : ouvrir la fiche du
compte de test, envoyer un programme. Avec un compte prospect de test : questionnaire, calculateur.

**On doit lire** : aucun message « Non enregistré : la base a refusé cette modification. » (côté client et prospect,
suivi de « Préviens ton coach. »).

**Arrêt si** ce message apparaît : arrêt d'urgence (étape 7), puis on regarde quelle clé et quelle taille.

---

## Étape 7 — Si quelque chose ne va pas (« ok » de Lucas, même en urgence)

**Arrêt d'urgence, sans rien supprimer** (une ligne, réversible) : les limites de `donnees` ne s'appliquent plus.
```sql
alter table public.donnees disable trigger v78_donnees_limites;
```
Vérifier :
```sql
select tgname, tgenabled from pg_trigger where tgname = 'v78_donnees_limites';
```
On doit lire `tgenabled` = `D` (désactivé). Pour remettre les limites :
```sql
alter table public.donnees enable trigger v78_donnees_limites;
```
(`tgenabled` = `O`). Les contraintes de prénom et nom restent : elles ne refusent qu'un texte de plus de 100 caractères.

**Retour complet** : `03-retour.sql` en entier (éditeur ou `execute_sql`). Il retire les 5 objets de la v78 et rien
d'autre, aucune ligne. On peut le relancer sans risque (la 2e fois, il ne trouve rien et passe sans erreur).
Puis relancer `01` : partie G, « objets v78 déjà là » = 0, et les empreintes des règles et des fonctions égales à celles
d'avant.

**Arrêt si** `03` affiche « v78 retour : STOP — … » : rien n'est retiré ; on lit pourquoi, avec Lucas.

---

## Étape 8 — Après

- `docs/HISTORIQUE.md` (une ligne) et `supabase/README.md` ; commits sur une branche `v2/…`, `main` sur l'« ok » de Lucas.
- **Remettre le refus `execute_sql`** si la façon B a servi :
  ```bash
  cd ~/MHX-Code/mhx-plateforme
  cp ~/MHX-Code/sauvegardes/2026-10-13-avant-v78/settings.local.json.avant .claude/settings.local.json
  grep -c "__execute_sql" .claude/settings.local.json    # attendu : 1
  ```
- Facultatif : `dropdb mhx_v78_local` (la base locale de test de l'étape 0).

## Critères d'arrêt (résumé)

Un test local rouge · `garde-cles.js` rouge · une ligne « STOP » au relevé · une sauvegarde absente ou avec un nombre de
lignes différent du relevé · une réserve du `database-reviewer` · une erreur à l'application · une ligne « ÉCHEC » aux
vérifications · un écart de comptage inexpliqué · un message « refusée par la base » dans l'app.
Dans tous les cas : on s'arrête, rien n'est perdu, on en parle à Lucas.

## Décisions à trancher par Lucas (avant l'étape 3)

Détail et raisons : `supabase/v78-limites/LISEZMOI.md`, « Décisions prises dans ce projet ».
1. **Plafond d'un prospect : 256 Ko par clé (prévu) ou 512 Ko.** Avec 256 Ko : un client que le coach « repasse
   prospect » et qui a déjà une clé plus lourde (journal, bilans) ne peut plus la faire grossir (ses nouvelles saisies
   restent sur l'appareil, « Préviens ton coach ») ; `formation` n'a que ×3,7 de marge pour un prospect lourd. Avec 512 Ko :
   environ 6,3 Mo au plus par compte prospect au lieu de 3,6 Mo. Si 512 Ko : changer la valeur dans 02 et ses copies (01,
   04, 05), adapter les tests 25, 55, 56, 65 et 71 de 04, refaire 06, relancer l'étape 0.
2. **Les limites par clé** (16 Mo pour l'historique des diètes, 8 Mo des programmes, 4 Mo pour le journal, … 16 Ko pour les
   petites clés) : tableau et raisons dans `supabase/releve-2026-09-30/INVENTAIRE-CLES.md`. D'accord ?
3. **Prénom et nom : 100 caractères au plus.** Une inscription faite hors de l'app avec un prénom plus long échoue en
   entier ; un accès créé par le coach avec un nom de plus de 100 caractères aussi (le champ du coach n'a pas de limite).
4. **Un déclencheur plutôt que de modifier les règles d'accès (RLS)** : il couvre aussi les écritures du coach, ne touche
   aucune règle, et s'agrandit sans `DROP` quand une clé arrive.
5. **Une ancienne ligne plus grosse que sa limite** (impossible le jour J) : lisible, modifiable sans grossir, ne peut plus
   grossir. Personne n'est bloqué, la base ne coupe ni n'efface rien.
6. **La répétition sur la vraie base (étape 3)** : la faire ou non.
7. **Qui lance le SQL** : Lucas dans l'éditeur (façon A) ou Claude par `execute_sql`, refus levé pour la séance (façon B).
8. **La sauvegarde** : par le dépôt privé (poser d'abord les 2 secrets) ou par export `SELECT`.
9. **L'heure de la séance** : une heure calme.

**Ce que ce lot ne règle pas** : après la v78, environ 140 faux comptes suffiraient encore à remplir les 500 Mo. C'est le
rôle du CAPTCHA (tâche 3, en ligne mais éteint : `docs/TURNSTILE.md`) et des limites d'inscription de Supabase Auth, à
décider par Lucas.

---

# Partie 6 — Nettoyage de l'historique du dépôt public

> **SQUELETTE — À COMPLÉTER APRÈS LA RÉPÉTITION DE CETTE NUIT** (Claude principal le remplira : commandes, nombres,
> résultats). Rien n'est fait ni décidé ici. **Le push forcé est fait par Lucas seulement**, avec son « ok » ; il reste
> refusé à Claude par `.claude/settings.local.json`.

**But** : les fichiers retirés à la tâche 1 (programme nominatif d'une cliente, `donnees/audit-coherence.md`, prénoms,
ancienne adresse) sont sortis de l'arbre actuel, mais restent dans l'historique git du dépôt public. Liste des noms à
chercher : hors dépôt (`~/MHX-prive/`), jamais recopiée ici.

1. **Sauvegarde** — un `git bundle` complet du dépôt (toutes les branches et étiquettes), vérifié, rangé dans
   `~/MHX-prive/sauvegardes-depot/` (modèle : `mhx-plateforme-2026-10-12-avant-v78.bundle`). *À compléter.*
2. **Dépôt miroir nettoyé** — une copie miroir hors du dépôt (scratchpad), nettoyée avec l'outil choisi pendant la
   répétition ; jamais dans la copie de travail de Lucas. *À compléter : outil, commandes, liste des chemins et des textes.*
3. **Vérifications** — sur le miroir nettoyé : plus aucun fichier retiré dans aucun commit, plus aucun prénom de la liste
   ni l'ancienne adresse ; l'arbre de `main` identique à celui d'avant (rien de l'app ne change) ; le banc vert. Critère
   d'arrêt : un seul écart. *À compléter : commandes et nombres attendus.*
4. **Push forcé — par Lucas seulement** — après son « ok », à une heure calme ; ce qu'il faut savoir avant (identifiants
   des commits changés, banc et publication relancés, copies locales à remplacer). Retour arrière : le bundle de l'étape 1.
   *À compléter.*
5. **GitHub Support** — demander la purge du cache (vues des anciens commits) et de la pull request #1, qui garde les
   anciens commits même après le push forcé. *À compléter : texte de la demande.*
6. **Autres copies** — les copies locales (Mac de Lucas, copies de travail), celle de Grok Bot, d'éventuels forks, les
   artefacts GitHub (28, du 05/10 au 11/10, aucun d'avant la v67 : relevé le 12/10), les bundles (à garder dans
   `~/MHX-prive/` seulement). *À compléter.*
