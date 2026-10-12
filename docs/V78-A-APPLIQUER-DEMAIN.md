# v78 — à appliquer demain avec Claude (séance du 13/10/2026)

Préparé la nuit du 12/10/2026. **Rien de ce fichier n'a encore été lancé.** Deux parties :
- **Tâche 5 — limites d'écriture dans la base** : procédure complète, étape par étape.
- **Tâche 6 — nettoyage de l'historique du dépôt** : procédure ; cette nuit, inventaire et essai à blanc faits et vérifiés, réécriture du miroir PAS faite (refusée par le contrôle de permissions).

Référence de la tâche 5 : `supabase/v78-limites/LISEZMOI.md` (il fait foi en cas d'écart avec ce fichier).

---

## Les règles de la séance (`CLAUDE.md`)

- **Une étape à la fois.** Claude fait l'étape, fait un rapport court, puis **STOP** : il attend l'« ok » de Lucas.
- **Toute écriture dans la vraie base demande l'« ok » de Lucas, juste avant** : la répétition (06), la migration (02),
  `04-tests.sql` relancé à l'étape 5 (écriture annulée, comme 06), le retour arrière (03), et même l'arrêt d'urgence.
- **Jamais `DROP`, `DELETE` ni `TRUNCATE` sur les données.** Le seul fichier avec des `DROP` est `03-retour.sql` : il ne
  retire que les 5 objets ajoutés par la v78 (vérifiés par leur commentaire), jamais une ligne.
- **Sauvegarde et comptage avant, répétition annulée, comptage après.** Un écart qu'on ne sait pas expliquer = **STOP**.
- **Agent `database-reviewer` obligatoire avant la migration** (étape 2 bis).
- **Compte de test seulement** (`9df6bb84…`), jamais un vrai client.
- `apply_migration` reste refusé. On ne juge jamais sur le message d'un outil, seulement sur `05-verifications.sql`.
- Ce qui n'est pas vérifié s'écrit « à vérifier ». Au moindre doute : STOP. Rien n'est perdu (la migration ne touche
  aucune ligne).

## Avant de commencer

**1. Les décisions de Lucas** (voir la liste à la fin de la partie 5). Décisions 1 à 5 **avant l'étape 0** (elles changent
02 et 04, donc le test local, et le plafond est aussi dans 01) ; 7 avant l'étape 1 ; 8 et 9 avant l'étape 2 ; 6 avant
l'étape 3.

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
| 3 | répétition (`06`, tout annulé) — obligatoire | vraie base | **oui, puis annulé** (« ok » de Lucas) |
| 4 | application (`02`) | vraie base | **oui** |
| 5 | vérifications (`05`) et comptage « après », puis `04` relancé | vraie base | `05` : non ; `04` : **oui, puis annulé** (« ok » de Lucas) |
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

**Attention : ce sera la 1re vraie sauvegarde** (la CLI Supabase, Docker et le pooler n'ont encore jamais tourné sur la vraie
base). Comptages identiques **obligatoires**. Qu'on puisse la remettre en place n'est pas encore prouvé : la restauration
d'essai du `README.md` de `mhx-prive` (« Mise en service : trois vérifications », point 2 ; `RESTAURATION.md`, partie D1)
reste à faire (à vérifier). Proposer à Lucas, au choix, de faire cette restauration d'essai avant l'étape 4.

**Façon B — export par `SELECT`** (si les secrets ne sont pas posés ; demande la façon B de l'étape 1) : comme la
sauvegarde du 29/09 (`~/MHX-Code/sauvegardes/2026-09-29-avant-v56/`, son `LISEZMOI.md`) : `profils`, `donnees` avec
`contenu`, `bibliotheque`, le catalogue, `briefs`, `connexions`, et le texte des règles, des fonctions et des déclencheurs ;
résultats relus dans le journal de la session par `extraire.py` (chemin du journal à adapter), jamais recopiés à la main ;
contrôle ligne par ligne comme `verifier.py`. Rangé dans `~/MHX-Code/sauvegardes/2026-10-13-avant-v78/` (droits 700 / 600,
jamais commité).

**Comptage « avant »** : c'est le relevé de l'étape 1. Le relancer s'il a plus d'une heure. **Une sauvegarde de plus d'une
heure** : relancer aussi la sauvegarde (façon A : Run workflow ; façon B : refaire l'export), pas seulement le relevé, puis
refaire la comparaison ci-dessus (les saisies des clients faites entre-temps n'y seraient pas).

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

## Étape 3 — Répétition sur la vraie base (obligatoire, « ok » de Lucas juste avant)

**But** : jouer la migration et les tests sur la vraie base, puis **tout annuler**. `06-repetition.sql` n'a aucun `commit`.

**Obligatoire** : `CLAUDE.md`, « Les garde-fous » (« répétition annulée »). L'étape 0 ne la remplace pas : le Postgres local
ne voit ni les vraies règles d'accès, ni les vrais déclencheurs de `auth.users`, ni les vraies tailles. La sauter serait une
exception à cette règle : seulement sur un « ok » écrit de Lucas pour cette exception précise.

**Sauvegarde** : celle de l'étape 2, de moins d'une heure ; sinon relancer la sauvegarde **et** le relevé (étape 2).

**Commande** : coller **`06-repetition.sql` tel quel, en entier, en un seul envoi** dans l'éditeur SQL (Lucas), ou Claude
par `execute_sql` avec tout le fichier. **Jamais un morceau de 02 ou de 04** : 02 a un `commit`, il appliquerait la
migration pour de bon. Si l'éditeur affiche un avertissement : le lire et le dire à Claude avant de confirmer.

**Pendant l'envoi**, l'app peut se figer quelques secondes et afficher, en haut :
- « Hors ligne — gardé sur cet appareil, renvoi automatique » (« Rester connecté » coché) ;
- ou « Hors ligne — gardé dans cet onglet seulement : ne le ferme pas » (« Rester connecté » décoché, `js/auth-store.js`).

C'est normal (verrou le temps des tests) : l'app réessaie seule, et rien n'est perdu **tant que l'onglet reste ouvert**. Un
client qui ferme l'onglet à ce moment, sans « Rester connecté », perd sa saisie : d'où l'**heure calme** (décision 9).

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

**Sauvegarde** : celle de l'étape 2, de moins d'une heure, avec un relevé de moins d'une heure. Sinon (la relecture et la
répétition peuvent prendre plusieurs heures) : relancer la sauvegarde **et** le relevé (étape 2) ; les empreintes à coller à
l'étape 5 sont alors celles de ce dernier relevé.

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

**On doit lire** : aucune ligne « ÉCHEC », et une dernière ligne (« Z bilan / verdict ») :
- **« OK »** ;
- ou **« À COMPARER / À REGARDER »** : acceptable **seulement** si les seules lignes ni « OK » ni « INFO » sont en « ÉCART » sur
  « empreinte de toutes les lignes de donnees » et / ou « empreinte des profils », et que la partie E explique la différence
  (une écriture de l'app entre-temps, voir ci-dessous). Une ligne « À COMPARER » = une empreinte pas collée : la coller et
  relancer. Une ligne « À REGARDER » (marge au-dessus du quart de la limite) : STOP, on regarde avec Lucas.
- Une ligne « ÉCHEC » = étape 7.

Puis comparer :
- partie E (lignes et empreinte par clé, lignes de chaque table, comptes par rôle) aux parties A, D et F du relevé : les
  mêmes ;
- une clé de `donnees` différente : seulement si l'app l'a écrite entre-temps (`activite`, `coach_visite`, `checkins`,
  `journal`…) ; catalogue et bibliothèque : identiques.

Puis, **avec l'« ok » de Lucas**, relancer `04-tests.sql` en entier : il écrit des comptes fictifs (`@exemple.invalid`) dans
`auth.users` et des lignes dans `donnees`, puis annule tout (écriture annulée, comme 06). On doit lire
`68 / 68 tests OK, 8 sauté(s)`. Facultatif : relancer `01` et
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
compte de test, envoyer un programme. Avec un compte prospect de test : questionnaire, calculateur. **Compte prospect de
test : à vérifier** (aucun n'est noté dans le dépôt : lequel ? à décider avec Lucas). C'est pourtant là qu'un refus est le
plus probable (plafond prospect).

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
Dans tous les cas : on s'arrête, rien n'est perdu, on en parle à Lucas. Et si la façon B a servi : **remettre le refus
`execute_sql`** (étape 8), même en cas d'arrêt.

## Décisions à trancher par Lucas (1 à 5 avant l'étape 0 ; 7 avant l'étape 1 ; 8 et 9 avant l'étape 2 ; 6 avant l'étape 3)

Détail et raisons : `supabase/v78-limites/LISEZMOI.md`, « Décisions prises dans ce projet ».
1. **Plafond d'un prospect : 256 Ko par clé (prévu) ou 512 Ko.** Avec 256 Ko : un client que le coach « repasse
   prospect » et qui a déjà une clé plus lourde (journal, bilans) ne peut plus la faire grossir (ses nouvelles saisies
   restent sur l'appareil, « Préviens ton coach ») ; `formation` n'a que ×3,7 de marge pour un prospect lourd. Avec 512 Ko :
   environ 6,3 Mo au plus par compte prospect au lieu de 3,6 Mo. Si 512 Ko : changer la valeur dans 02 et ses copies (01,
   04, 05), adapter les tests 3, 25, 55, 56, 65 et 71 de 04, refaire 06, relancer l'étape 0. **Ne pas remplacer 262144
   partout** : c'est aussi la limite propre de la clé `intake`.
2. **Les limites par clé** (16 Mo pour l'historique des diètes, 8 Mo des programmes, 4 Mo pour le journal, … 16 Ko pour les
   petites clés) : tableau et raisons dans `supabase/releve-2026-09-30/INVENTAIRE-CLES.md`. D'accord ?
3. **Prénom et nom : 100 caractères au plus.** Une inscription faite hors de l'app avec un prénom plus long échoue en
   entier ; un accès créé par le coach avec un nom de plus de 100 caractères aussi (le champ du coach n'a pas de limite).
4. **Un déclencheur plutôt que de modifier les règles d'accès (RLS)** : il couvre aussi les écritures du coach, ne touche
   aucune règle, et s'agrandit sans `DROP` quand une clé arrive.
5. **Une ancienne ligne plus grosse que sa limite** (impossible le jour J) : lisible, modifiable sans grossir, ne peut plus
   grossir. Personne n'est bloqué, la base ne coupe ni n'efface rien.
6. **La répétition sur la vraie base (étape 3)** : obligatoire (`CLAUDE.md`, « Les garde-fous »). La sauter = une exception
   à cette règle, seulement sur un « ok » écrit de Lucas pour cette exception précise.
7. **Qui lance le SQL** : Lucas dans l'éditeur (façon A) ou Claude par `execute_sql`, refus levé pour la séance (façon B).
8. **La sauvegarde** : par le dépôt privé (poser d'abord les 2 secrets) ou par export `SELECT`. Avec le dépôt privé : faire
   ou non la restauration d'essai avant l'étape 4 (étape 2).
9. **L'heure de la séance** : une heure calme.

**Ce que ce lot ne règle pas** : après la v78, environ 140 faux comptes suffiraient encore à remplir les 500 Mo. C'est le
rôle du CAPTCHA (tâche 3, prête mais éteinte : `docs/TURNSTILE.md`) et des limites d'inscription de Supabase Auth, à
décider par Lucas.

---

# Partie 6 — Nettoyage de l'historique du dépôt public

**But** : les fichiers retirés à la tâche 1 (le programme nominatif d'une cliente, `donnees/audit-coherence.md`), les
prénoms et noms de clients et les adresses email réelles sont sortis de l'arbre actuel, mais restent dans l'**historique**
git du dépôt public (et dans la pull request #1). On réécrit cet historique sur une copie, on vérifie, puis **Lucas** pousse.

**Où est tout** (hors dépôt, sur le Mac de Lucas, droits réservés à son compte) : `~/MHX-prive/nettoyage/`
- `mhx-plateforme.git` : le **miroir de travail** (clone `--mirror` de GitHub du 12/10 08:42 ; envoi désactivé :
  `pushurl = NE-PAS-POUSSER`) ; `sauvegarde-avant-nettoyage.git` : une 2e copie, intacte, du même miroir.
- `outils/git-filter-repo` (git-filter-repo **2.47.0**, paquet officiel PyPI, installé dans `outils/pylib/` seulement) ;
  `outils/nettoyer.sh` (la réécriture, avec ses garde-fous) ; `outils/inventaire.py`, `outils/verifier-essai.py`,
  `outils/releve.py` (comptages et comparaisons, sans afficher de nom).
- `regles-remplacement.json` et `plan-remplacement.md` : **la liste des noms, des adresses et des marqueurs neutres**
  (jamais dans le dépôt) ; `avant.txt` (+ `.catalogue.json`) : le relevé d'avant (références, arbre de `main`,
  empreintes du catalogue à chaque version).

## Ce qui a été fait cette nuit (12/10)

| Étape | Résultat |
|---|---|
| Inventaire de tout l'historique | 37 références (`main`, 35 branches `v2/*`, `refs/pull/1/head`, aucune étiquette), 379 commits. Les 2 fichiers de la tâche 1 sont encore à la pointe de 33 références (dont la pull request #1). 6 adresses email réelles, des noms dans 8 chemins (anciennes versions de `NOTES-GROK.md`, `docs/PLAN-V2.md`, `index.html`, `donnees/README.md`, `donnees/liens-youtube.md`, du brief d'origine, un commentaire de `tests-locaux/verif72.js`) et dans 3 messages de commit. |
| Règles | 2 chemins retirés de tout l'historique ; 21 règles de remplacement actives, **par chemin** : jamais dans les fichiers du catalogue (identiques au bit près), jamais sur le prénom d'un prospect **fictif** des tests (il reste). |
| Essai à blanc (`--dry-run`, rien de réécrit) | 31,7 s, code 0 : 65 versions de fichiers réécrites dans 8 chemins, 3 messages de commit. |
| Vérification de l'essai | **OK sur les 5 points** : 0 chemin retiré restant, 0 nom ni adresse réelle restants (hors prospect fictif et produit du catalogue) ; arbre de `main` **identique au bit près** (`bae9940c…`, rien de l'app ne change) ; catalogue identique (4 287 couples commit-fichier comparés, 0 écart) ; 379 commits, mêmes auteurs et dates ; le commit de l'ouverture de l'inscription garde son message (verif52 en dépend). |
| **Réécriture du miroir** | **PAS faite** : la commande a été refusée par le contrôle de permissions de la session. Rien n'a été contourné ; le miroir est intact (`main` = `0727aed`, envoi toujours désactivé). |
| Banc | Pas relancé : l'arbre de `main` nettoyé est celui de `0727aed`, banc local 10/10 et GitHub verts. Seule verif52 lit l'historique : à relancer après la vraie réécriture (étape 3). |

## Étapes pour la séance

**0. Décisions de Lucas, avant tout**
- Ajouter ou non à la liste le prénom et le nom de la **2e personne qui a eu l'accès coach** (présents dans d'anciennes
  versions de `NOTES-GROK.md`) : une règle est prête, inactive.
- Son **adresse personnelle d'auteur** reste dans les métadonnées de 344 commits (la demande ne visait que fichiers et
  messages). La changer aussi (option `--mailmap`, un fichier de plus) : oui / non.
- L'**ancienne adresse de contact de la marque** est remplacée comme les autres (cohérent avec la tâche 1) : à confirmer.
- Les **branches `v2/*`** de GitHub (35) : les réécrire et les repousser aussi (recommandé, elles contiennent les
  fichiers), ou les supprimer de GitHub (suppression = « ok » écrit de Lucas).

**1. Sauvegarde et relevé**
```bash
cd ~/MHX-Code/mhx-plateforme && git fetch origin && git bundle create ~/MHX-prive/sauvegardes-depot/mhx-plateforme-AAAA-MM-JJ-avant-nettoyage.bundle --all && git bundle verify ~/MHX-prive/sauvegardes-depot/mhx-plateforme-AAAA-MM-JJ-avant-nettoyage.bundle
```
On doit lire « The bundle records a complete history ». Si GitHub a changé depuis le 12/10 (nouveau commit sur `main`) :
refaire le miroir (`git clone --mirror` dans un dossier neuf, `git remote set-url --push origin NE-PAS-POUSSER` tout de
suite), relancer `outils/inventaire.py` et l'essai : `nettoyer.sh` refuse de tourner si `main` n'est plus `0727aed`.

**2. Essai à blanc, puis réécriture du miroir** (Lucas autorise la commande pour la séance)
```bash
bash ~/MHX-prive/nettoyage/outils/nettoyer.sh --essai
```
```bash
bash ~/MHX-prive/nettoyage/outils/nettoyer.sh
```
Le script vérifie d'abord : miroir nu, `pushurl = NE-PAS-POUSSER`, `main` = celui du relevé, sauvegarde présente ;
pendant la réécriture, git n'a accès à aucun réseau. Il remet ensuite `url = NE-PAS-RECUPERER` et
`pushurl = NE-PAS-POUSSER` (git-filter-repo retire le remote) et garde la table anciens → nouveaux commits
(`filter-repo/commit-map`). Critère d'arrêt : code de sortie différent de 0, ou nombres différents de l'essai.
Retour arrière : rien n'est parti ; supprimer le miroir réécrit et repartir de `sauvegarde-avant-nettoyage.git`.

**3. Vérifications sur le miroir réécrit** (avant tout push)
- Relancer `outils/inventaire.py` sur le miroir (copier d'abord `inventaire-resultats.json` et
  `remplacements-emails.txt` d'avant, qu'il réécrit) : **0** chemin retiré, **0** nom de la liste (hors prospect fictif
  des tests et produit du catalogue), **0** adresse réelle, dans toutes les références et tous les messages.
- `git -C ~/MHX-prive/nettoyage/mhx-plateforme.git rev-parse main^{tree}` doit donner l'arbre noté dans `avant.txt`
  (`bae9940c…`, le même que `0727aed`).
- Catalogue : `outils/releve.py` (comparaison avec `avant.txt.catalogue.json`) : 0 écart.
- Banc : une copie de travail de `main` du miroir nettoyé (`git clone ~/MHX-prive/nettoyage/mhx-plateforme.git`
  dans un dossier temporaire), puis le banc complet, `VERIF52_REF` = le `main~1` nettoyé : tout vert.
Critère d'arrêt : un seul écart. Retour arrière : comme à l'étape 2.

**4. Push forcé — par Lucas seulement**, à une heure calme, après son « ok » écrit
- Avant : dire à Grok Bot de ne rien pousser pendant l'opération ; noter que **tous les identifiants de commits
  changent** (ceux cités dans CLAUDE.md, HISTORIQUE, NOTESCLAUDE et la mémoire de Claude deviennent anciens : la table
  `commit-map` fait la correspondance) ; les 53 commits faits sur GitHub perdent leur signature « Verified ».
- La commande (dans le miroir réécrit ; le push forcé reste refusé à Claude) : pousser les **branches seulement**, vers
  l'adresse écrite en entier (le remote du miroir garde `NE-PAS-POUSSER` et son réglage `mirror`, qui refuserait une
  liste de branches ; GitHub refuse d'écrire `refs/pull/*`) :
```bash
cd ~/MHX-prive/nettoyage/mhx-plateforme.git && git push --force https://github.com/lcsmhx/mhx-plateforme 'refs/heads/*:refs/heads/*'
```
- Après : « Tests puis publication » rejoue le banc sur le nouveau `main` (même arbre : le site ne change pas, pied de
  page « · 78.2 »).
- Retour arrière : repousser l'ancien historique depuis le bundle de l'étape 1 (même commande, depuis un clone du bundle).

**5. GitHub Support — seulement après l'étape 4**
- La pull request #1 garde les anciens commits (`refs/pull/1/head`) et GitHub garde en cache les vues des anciens commits :
  seul le support peut les purger. Formulaire : https://support.github.com/contact (rubrique sur les données sensibles ;
  guide : https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).
- Texte proposé : « Repository lcsmhx/mhx-plateforme (public). I rewrote the history to remove personal data of my clients
  (files and names) and force-pushed all branches. Please remove the cached views of the old commits and the references
  of pull request #1 (refs/pull/1/head), which still point to the old history. I can provide the list of affected old
  commit IDs. » (joindre la liste des anciens identifiants tirée de `commit-map`, jamais les noms).

**6. Autres copies** (relevé du 12/10, rien supprimé ; supprimer = décision de Lucas)
- `~/MHX-Code/mhx-plateforme` : son `.git` garde l'ancien historique (96 références, dont des branches locales jamais
  poussées). Après l'étape 4 : le remplacer par un clone neuf (garder l'ancien dans `~/MHX-prive/` le temps de vérifier).
- 2 copies de travail d'une session Claude du 11/10 dans un dossier temporaire du Mac (`/private/tmp/claude-501/…`) :
  elles contiennent les 2 fichiers de la tâche 1 ; les copies de cette nuit (`wt-*`) partagent le `.git` du dépôt.
- `~/MHX-prive/` : le bundle d'avant la v78, `sauvegarde-avant-nettoyage.git`, le miroir, `archives/` (les 2 fichiers en
  clair, voulu) et le dépôt privé `mhx-prive` (archive chiffrée).
- `~/MHX-Code/sauvegardes/` (copies de la base du 25/09 au 01/10) : des noms et des adresses réelles, hors dépôt.
- Time Machine configurée (disque non branché au moment du relevé) et instantanés locaux du Mac : ceux d'avant le
  12/10 04:26 contiennent l'ancien dépôt.
- Journaux de session de Claude (`~/.claude/projects`, `~/.claude/file-history`) : des extraits avec des noms.
- La copie de Grok Bot (autre machine) et d'éventuels forks : à recloner après l'étape 4.
- Non vérifiés (accès refusé par macOS) : Bureau, Documents, iCloud Drive.
- Artefacts GitHub : 28, tous du 05/10 au 11/10, aucun d'avant la v67 (relevé du 12/10).

**À savoir aussi** : `tests-locaux/verif72.js` (sur `main`) contient des **empreintes SHA-256** de noms et d'adresses
retirés ; un prénom se retrouve à partir de son empreinte avec une liste de prénoms. Les remplacer demande de modifier la
suite (décision à part). Un commentaire de `js/outilClients.js` cite les mesures (sans nom) d'un cas réel.
