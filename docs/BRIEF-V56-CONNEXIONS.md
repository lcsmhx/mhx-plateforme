# Brief v56 — compteur de connexions côté coach (préparé le 28/09/2026)

Demande de Lucas : dans le tableau de bord coach, voir pour chaque client et chaque prospect le nombre de connexions et la
date de la dernière connexion. Préparé sur la branche `v2/compteur-connexions` le 28/09 ; **« oui » de Lucas le 29/09**
(« oui, dès la mise en ligne, clients et prospects comptés tout de suite ») : clients et prospects comptés dès la mise
en ligne, sans message, notification ni mention pour eux (couvert par leur contrat).

## Ce que ça fait
- **Une connexion** = une ouverture de l'app avec une session valide : connexion automatique (session enregistrée),
  connexion avec le mot de passe, ou l'app revenue au premier plan après 10 minutes ou plus en arrière-plan (sur téléphone,
  l'app installée ne se recharge presque jamais). **Une par jour au plus**, au calendrier de Paris.
- **Dernière connexion** = la date et l'heure de la dernière ouverture, affichées à l'heure de l'appareil du coach.
- **Coach** : deux colonnes de plus dans « Mes clients » (« Connexions », « Dernière connexion »), deux lignes de plus
  dans chaque carte de la page « Prospects ». Pas de nouvelle page.
- **Qui est compté** : tous les clients et tous les prospects, dès la mise en ligne (décision de Lucas du 29/09) ; pas
  l'interrupteur des visites. Jamais le coach, jamais une fiche consultée par le coach.
- **Client et prospect** : rien de visible, rien n'attend la réponse de la base.
- Le comptage commence à la migration : avant, rien n'était enregistré (« 0 » et « aucune » pour quelqu'un qui n'a pas
  rouvert l'app depuis ; l'info-bulle dit depuis quand ses connexions sont comptées).

## Trouvé
- « Mes clients » et la page « Prospects » montrent déjà « Dernière visite » et « Jours actifs (30 j) » : ils viennent de
  la clé `activite` de la table `donnees`, **écrite par la personne elle-même** (elle peut donc la modifier). Pour les
  clients, ce suivi est derrière l'interrupteur `suivi_visites_clients` en « test » (décision Q4 : tes clients doivent être
  prévenus d'abord).
- Toute ouverture de l'app passe par `demarrer()` (`js/demarrage.js`) : la connexion automatique, et la connexion avec le
  mot de passe (la page se recharge).
- Base au 28/09 (lecture seule) : 16 comptes (1 coach, 12 clients, 3 prospects), 8 tables, 18 règles d'accès,
  4 fonctions (`creer_profil`, `est_client`, `est_coach`, `protege_role`). Supabase donne par défaut **tous les droits**
  d'une nouvelle table à l'anonyme et aux comptes connectés : il faut les reprendre (c'est fait dans la migration).
- Aucune donnée existante ne permet de compter les connexions (Supabase ne note que la dernière connexion par mot de
  passe, pas les connexions automatiques, et l'app ne peut pas la lire).

## Modifié (branche `v2/compteur-connexions`)
**Base (migration écrite, pas appliquée)** : une table **nouvelle** `connexions` (une ligne par compte : `nombre`,
`premiere`, `derniere`, `dernier_jour`) et une fonction **nouvelle** `noter_connexion()`.
- La fonction ne prend **aucun paramètre** : elle note la connexion du compte du jeton, jamais celle d'un autre.
- Même jour : la dernière connexion avance, le nombre ne bouge pas. Nouveau jour (Paris) : +1.
- Lecture de la table : **le coach seul**. Écriture directe : **aucun compte** (ni client, ni prospect, ni coach) ; seule la clé de service (fonctions serveur, jamais dans l'app) garde tous les droits, comme sur toutes les tables.
- L'anonyme n'a accès à rien.
- Compte supprimé : sa ligne part avec lui, la suppression n'est jamais bloquée.

**App (version 56)** :
- `Connexions` (`js/outilDecouverte.js`, à côté du suivi des visites) : l'appel en arrière-plan.
- `demarrer()` : l'appel à l'ouverture.
- `Clients.charger` : lecture de la table, en même temps que le reste (8 s au plus, sinon « — ») ; pas pour le tableau de bord, qui ne l'affiche pas.
- Les deux colonnes de « Mes clients » et les deux lignes des cartes « Prospects ».

**Tests** :
- `tests-locaux/verif61.js` : 48 vérifications, dont démarrage, reprise, jeton expiré au retour, base sans migration, retour arrière, réseau coupé, coach, téléphone, interrupteur et données piégées. Elle échoue sur la v55 (13/47).
- Simulations de verif40, 51 à 58 et 60 : l'appel est mis à part, car ce n'est pas une écriture de l'app dans les données.
- `verif52` : la comparaison de « Mes clients » avec `main` ignore les 2 nouvelles colonnes.
- `supabase/tests/v56_connexions_rls.sql` : 23 tests des règles (coach, client de test, prospect fictif, anonyme, tentatives croisées). Le fichier finit toujours par une erreur voulue (« v56 : 23 / 23 tests ok… Annulation forcée ») : rien ne peut être gardé, même lancé sans `begin` / `rollback`.

## Fichiers
- `supabase/migrations/20260928220000_v56_compteur_connexions.sql` : la migration.
- `supabase/v56_retour.sql` : le retour arrière.
- `supabase/tests/v56_connexions_rls.sql` : les tests des règles.
- `supabase/README.md`.
- `js/outilDecouverte.js`, `js/demarrage.js`, `js/outilClients.js`, `js/outilProspects.js`, `js/outilTableau.js`.
- `js/config.js` et `index.html` : version 56.
- `tests-locaux/verif61.js` (nouveau), `verif40.js`, `verif51.js` à `verif58.js`, `verif60.js`, `banc.sh`, `README.md`.
- Ce brief.

## Conservé
- Aucune table, ligne, règle ou fonction existante n'est modifiée. Aucun `DROP`, `DELETE`, `TRUNCATE`.
- « Dernière visite », « Jours actifs », « Activité » : inchangés.
- Les exports CSV sont inchangés.
- Le tableau de bord (2 tuiles) et les fiches sont inchangés.
- Côté client et prospect, aucun écran ne change.

## Risques
1. **Tes clients** : ce qu'ils voient ne change pas, mais leurs ouvertures sont enregistrées dès la mise en ligne. **Tranché par Lucas le 29/09** : oui, clients et prospects comptés tout de suite, sans message ni mention (couvert par leur contrat) ; l'interrupteur `suivi_visites_clients` ne concerne que les visites et reste sur « test ».
2. Un compte peut appeler la fonction à la main : au plus +1 par jour sur **son propre** compteur, jamais sur celui d'un autre.
3. « Un jour » = le calendrier de Paris. Pour un client très loin (Bali), le jour change à 6 h du matin chez lui (7 h après le passage à l'heure d'hiver, le 25/10).
4. Si l'app part en ligne avant la migration : rien ne casse. Le coach voit « — », et chaque ouverture fait une demande refusée, invisible, qui n'est plus répétée. Ordre prévu : migration d'abord.
5. Gratuit : une ligne par compte et une petite requête par ouverture. Rien de payant.
6. Si le profil ne se charge pas au démarrage (réseau coupé à ce moment-là), cette ouverture n'est pas comptée : la suivante le sera.
7. Le « Security Advisor » de Supabase signalera `noter_connexion` (fonction SECURITY DEFINER appelable par les comptes connectés) : c'est voulu, comme pour `est_coach`.
8. La migration pose un court verrou sur la table des comptes : au-delà de 5 s d'attente, elle abandonne sans rien appliquer (on réessaie), pour ne jamais bloquer les connexions.
9. Relevés avant / après : un vrai client peut écrire pendant la migration (inscription ouverte, clients actifs). Un écart sur `donnees` ou `profils` se vérifie ligne par ligne. Seule une ligne dont `maj_le` est postérieure au relevé « avant » (modifiée par son propriétaire) est acceptée. Tout autre écart = STOP.

## Sauvegarde (avant la migration, par Claude, lecture seule)
Dossier `~/MHX-Code/sauvegardes/2026-09-XX-avant-v56/`, hors dépôt (droits 600), comme pour la v49 :
```sql
select json_agg(p order by p.id) from public.profils p;                                   -- profils.json
select json_agg(d order by d.user_id, d.outil) from public.donnees d;                     -- donnees.json (avec contenu)
select md5(contenu::text), user_id, outil, maj_le from public.donnees order by 2, 3;      -- md5-lignes-avant.json
select tablename, policyname, cmd, roles, qual, with_check from pg_policies where schemaname = 'public' order by 1, 2;
select proname, pg_get_functiondef(oid) from pg_proc where pronamespace = 'public'::regnamespace order by 1;
```
Contrôle : chaque ligne relue a le même md5 que la base, et les 16 comptes (profils) y sont avec toutes leurs lignes.

## Comptage avant / après
- Les empreintes de `~/MHX-Code/sauvegardes/empreintes.sql` : nombre de lignes et md5 de chaque table, `auth.users`, Storage, rôles.
- Rôles et statuts : `select role, statut, count(*) from profils group by 1, 2`.
- Nombre de règles par table (`pg_policies`) et de fonctions de `public`.

Attendu après la migration :
- Tout est identique, avec 1 table, 1 règle et 1 fonction de plus.
- `select count(*) from public.connexions` = 0, tant que l'app v56 n'est pas en ligne.

## Ordre après le « oui » (29/09 : Claude enchaîne seul, un seul rapport à la fin)
1. Sauvegarde et relevé « avant ».
2. Répétition : `begin;` puis la migration, puis les 23 tests (qui créent un prospect fictif dans la table des comptes, annulé avec tout le reste). Attendu : « 23 / 23 tests ok… Annulation forcée », et une base inchangée (empreintes, aucune table `connexions`).
3. Migration réelle (`apply_migration`, nom `v56_compteur_connexions`).
4. Les 23 tests de nouveau (annulés de la même façon), puis le relevé « après ». Un écart = STOP et retour arrière.
5. Relecture indépendante, puis `git push origin main` (v56). GitHub rejoue le banc et publie s'il est vert.
6. Vérification en ligne : pied de page « · 56 », « Mes clients » et « Prospects » sur téléphone. Tu vérifies ensuite avec ton compte de test : ouvre l'app avec, puis regarde sa ligne dans « Mes clients ».

## Fait (28/09/2026, heures de Paris)
- 18 h 24 : sauvegarde (`~/MHX-Code/sauvegardes/2026-09-29-avant-v56/` : 16 profils, 53 lignes de `donnees` avec leur contenu exact, règles, fonctions, droits ; `python3 verifier.py` → 53/53 identiques à la base) et relevé « avant ».
- 18 h 31 : répétition (migration + tests dans une transaction annulée) : **23 / 23**, puis base inchangée (aucun écart, pas de table `connexions`, prospect fictif absent).
- 18 h 32 : migration réelle (`20260928163252 v56_compteur_connexions`) ; corps de la fonction identique au fichier (md5).
- 18 h 34 : tests de nouveau : **23 / 23** (annulés) ; relevé « après » : 14 empreintes, 53 lignes, 16 profils, rôles et statuts, règles, fonctions, droits et déclencheurs existants **identiques** ; en plus : 1 table, 1 règle (19), 1 fonction (5) ; 0 ligne dans `connexions`.

## Retour arrière
- Base, sans rien supprimer : `supabase/v56_retour.sql`. On retire les droits d'appel et de lecture ; la table et la fonction restent. L'app affiche « — » et ne réessaie plus.
- App : `git revert` du commit v56, puis push.

## Décision de Lucas (29/09)
« Oui, dès la mise en ligne, clients et prospects comptés tout de suite. » Aucun message, notification ni mention ajoutée
pour les clients. Fait dans `Connexions.suivi` / `suiviPour` (`js/outilDecouverte.js`) : tous les comptes sauf le coach
et une fiche consultée ; l'interrupteur `suivi_visites_clients` n'est pas touché (il reste sur « test », pour les
visites seulement). `verif61` vérifie un client hors de cet interrupteur (Thomas) : noté et affiché.
