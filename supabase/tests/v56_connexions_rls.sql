-- v56 : tests des règles d'accès de la table connexions et de la fonction noter_connexion() — coach, client, prospect,
-- anonyme, tentatives croisées.
-- TOUJOURS DANS UNE TRANSACTION ANNULÉE : rien de ce que fait ce fichier n'est gardé. Deux usages :
--   1. répétition, AVANT la migration : begin; <texte de la migration v56> ; <ce fichier> ; rollback;
--   2. après la migration :          begin; <ce fichier> ; rollback;
-- Comptes utilisés : le coach (lu dans profils), le compte client de TEST 9df6bb84… (jamais un vrai client) et un prospect
-- FICTIF créé dans la transaction (annulé avec elle). Les vrais clients ne sont jamais touchés : les tests ne lisent et
-- n'écrivent que les lignes de ces trois comptes.
-- Résultat : le fichier finit TOUJOURS par une erreur voulue, « v56 : N / 23 tests ok … annulation forcée » : rien ne peut
-- être gardé, même lancé seul sans begin / rollback (sinon le prospect fictif resterait dans auth.users). Le message
-- donne le total et, s'il y en a, les tests qui ne passent pas (un test sans réponse, NULL, compte comme raté).

create temp table t_res (n int, test text, ok boolean, detail text);
grant all on t_res to anon, authenticated;

-- les comptes (lus avant de changer de rôle) ; attendu = le nombre du compte de test après son premier appel du jour
-- (il a peut-être déjà une ligne si l'app est déjà en ligne)
select set_config('t.coach', (select id::text from public.profils where role = 'coach' order by cree_le limit 1), true),
       set_config('t.client', '9df6bb84-5a09-4bb0-a77a-b2633d842ed9', true),
       set_config('t.prospect', '00000000-0000-4000-8000-00000000f556', true),
       set_config('t.jour', ((now() at time zone 'Europe/Paris')::date)::text, true);
select set_config('t.attendu', coalesce((select (nombre + case when dernier_jour < current_setting('t.jour')::date then 1 else 0 end)::text
                                         from public.connexions where user_id = current_setting('t.client')::uuid), '1'), true);

insert into t_res select 0, 'décor : un coach, et le compte de test est bien un client',
  (select count(*) from public.profils where id = current_setting('t.coach')::uuid and role = 'coach') = 1
  and (select count(*) from public.profils where id = current_setting('t.client')::uuid and role = 'client' and statut = 'client') = 1, null;

-- le prospect fictif : un compte créé dans la transaction (le déclencheur creer_profil lui crée son profil « prospect »)
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values (current_setting('t.prospect')::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        'prospect-fictif-v56@exemple.invalid', '{"prenom":"Fictif v56"}'::jsonb, now(), now());
insert into t_res select 1, 'décor : le prospect fictif a son profil « prospect »',
  (select statut from public.profils where id = current_setting('t.prospect')::uuid) = 'prospect', null;

-- ---------- la structure ----------
insert into t_res select 2, 'table : règles d''accès activées, une seule règle (lecture), aucune règle d''écriture',
  (select relrowsecurity from pg_class where oid = 'public.connexions'::regclass)
  and (select count(*) from pg_policies where schemaname = 'public' and tablename = 'connexions') = 1
  and (select count(*) from pg_policies where schemaname = 'public' and tablename = 'connexions' and cmd <> 'SELECT') = 0,
  (select string_agg(policyname || ':' || cmd, ', ') from pg_policies where schemaname = 'public' and tablename = 'connexions');
insert into t_res select 3, 'droits : les comptes connectés lisent seulement (ni INSERT, ni UPDATE, ni DELETE, ni TRUNCATE) ; l''anonyme rien',
  has_table_privilege('authenticated', 'public.connexions', 'SELECT')
  and not has_table_privilege('authenticated', 'public.connexions', 'INSERT') and not has_table_privilege('authenticated', 'public.connexions', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.connexions', 'DELETE') and not has_table_privilege('authenticated', 'public.connexions', 'TRUNCATE')
  and not has_table_privilege('anon', 'public.connexions', 'SELECT') and not has_table_privilege('anon', 'public.connexions', 'INSERT')
  and not has_table_privilege('anon', 'public.connexions', 'UPDATE') and not has_table_privilege('anon', 'public.connexions', 'DELETE'), null;
insert into t_res select 4, 'fonction : sans paramètre, SECURITY DEFINER, search_path vide ; appelable par les comptes connectés, pas par l''anonyme',
  pg_get_function_identity_arguments('public.noter_connexion()'::regprocedure) = ''
  and (select prosecdef from pg_proc where oid = 'public.noter_connexion()'::regprocedure)
  and (select proconfig from pg_proc where oid = 'public.noter_connexion()'::regprocedure)::text in ('{search_path=""}', '{"search_path=\"\""}')
  and has_function_privilege('authenticated', 'public.noter_connexion()', 'EXECUTE')
  and not has_function_privilege('anon', 'public.noter_connexion()', 'EXECUTE'),
  (select proconfig::text from pg_proc where oid = 'public.noter_connexion()'::regprocedure);
insert into t_res select 5, 'compte supprimé : sa ligne part avec lui (ON DELETE CASCADE), la suppression n''est jamais bloquée',
  (select confdeltype from pg_constraint where conrelid = 'public.connexions'::regclass and contype = 'f') = 'c', null;

-- ---------- l'anonyme (clé publique, sans session) ----------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
do $$ begin
  perform public.noter_connexion();
  insert into t_res values (10, 'anonyme : noter_connexion() refusée', false, 'acceptée');
exception when insufficient_privilege then insert into t_res values (10, 'anonyme : noter_connexion() refusée', true, sqlerrm);
          when others then insert into t_res values (10, 'anonyme : noter_connexion() refusée', false, sqlstate || ' ' || sqlerrm);
end $$;
do $$ declare n int; begin
  select count(*) into n from public.connexions;
  insert into t_res values (11, 'anonyme : lecture de la table refusée', false, n || ' ligne(s) lues');
exception when insufficient_privilege then insert into t_res values (11, 'anonyme : lecture de la table refusée', true, sqlerrm);
          when others then insert into t_res values (11, 'anonyme : lecture de la table refusée', false, sqlstate || ' ' || sqlerrm);
end $$;

-- ---------- le client (compte de test) ----------
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.client'), 'role', 'authenticated')::text, true);
do $$ begin
  perform public.noter_connexion();
  insert into t_res values (20, 'client : noter_connexion() acceptée', true, null);
exception when others then insert into t_res values (20, 'client : noter_connexion() acceptée', false, sqlstate || ' ' || sqlerrm);
end $$;
do $$ declare n int; begin
  select count(*) into n from public.connexions;
  insert into t_res values (21, 'client : ne lit aucune ligne, pas même la sienne', n = 0, n || ' ligne(s) lues');
exception when others then insert into t_res values (21, 'client : ne lit aucune ligne, pas même la sienne', false, sqlstate || ' ' || sqlerrm);
end $$;
do $$ begin
  update public.connexions set nombre = 999 where user_id = current_setting('t.client')::uuid;
  insert into t_res values (22, 'client : modifier SON compteur directement : refusé', false, 'accepté');
exception when insufficient_privilege then insert into t_res values (22, 'client : modifier SON compteur directement : refusé', true, sqlerrm);
          when others then insert into t_res values (22, 'client : modifier SON compteur directement : refusé', false, sqlstate || ' ' || sqlerrm);
end $$;
do $$ begin
  insert into public.connexions (user_id, nombre) values (current_setting('t.prospect')::uuid, 500);
  insert into t_res values (23, 'client : créer le compteur d''un AUTRE (le prospect) : refusé', false, 'accepté');
exception when insufficient_privilege then insert into t_res values (23, 'client : créer le compteur d''un AUTRE (le prospect) : refusé', true, sqlerrm);
          when others then insert into t_res values (23, 'client : créer le compteur d''un AUTRE (le prospect) : refusé', false, sqlstate || ' ' || sqlerrm);
end $$;
do $$ begin
  delete from public.connexions where user_id = current_setting('t.client')::uuid;
  insert into t_res values (24, 'client : effacer une ligne : refusé', false, 'accepté');
exception when insufficient_privilege then insert into t_res values (24, 'client : effacer une ligne : refusé', true, sqlerrm);
          when others then insert into t_res values (24, 'client : effacer une ligne : refusé', false, sqlstate || ' ' || sqlerrm);
end $$;
do $$ begin
  execute 'select public.noter_connexion($1::uuid)' using current_setting('t.prospect');
  insert into t_res values (25, 'client : noter une connexion POUR un autre (identifiant en paramètre) : impossible', false, 'accepté');
exception when undefined_function then insert into t_res values (25, 'client : noter une connexion POUR un autre (identifiant en paramètre) : impossible', true, sqlerrm);
          when others then insert into t_res values (25, 'client : noter une connexion POUR un autre (identifiant en paramètre) : impossible', false, sqlstate || ' ' || sqlerrm);
end $$;

-- ---------- le prospect (fictif) ----------
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.prospect'), 'role', 'authenticated')::text, true);
do $$ begin
  perform public.noter_connexion();
  insert into t_res values (30, 'prospect : noter_connexion() acceptée', true, null);
exception when others then insert into t_res values (30, 'prospect : noter_connexion() acceptée', false, sqlstate || ' ' || sqlerrm);
end $$;
do $$ declare n int; begin
  select count(*) into n from public.connexions;
  insert into t_res values (31, 'prospect : ne lit aucune ligne', n = 0, n || ' ligne(s) lues');
exception when others then insert into t_res values (31, 'prospect : ne lit aucune ligne', false, sqlstate || ' ' || sqlerrm);
end $$;
do $$ begin
  update public.connexions set nombre = 0, derniere = now() - interval '1 year' where user_id = current_setting('t.client')::uuid;
  insert into t_res values (32, 'prospect : modifier le compteur du CLIENT (tentative croisée) : refusé', false, 'accepté');
exception when insufficient_privilege then insert into t_res values (32, 'prospect : modifier le compteur du CLIENT (tentative croisée) : refusé', true, sqlerrm);
          when others then insert into t_res values (32, 'prospect : modifier le compteur du CLIENT (tentative croisée) : refusé', false, sqlstate || ' ' || sqlerrm);
end $$;
do $$ begin
  perform public.noter_connexion();   -- deuxième ouverture du même jour
  insert into t_res values (33, 'prospect : deuxième ouverture du jour acceptée', true, null);
exception when others then insert into t_res values (33, 'prospect : deuxième ouverture du jour acceptée', false, sqlstate || ' ' || sqlerrm);
end $$;

-- ---------- le coach ----------
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.coach'), 'role', 'authenticated')::text, true);
do $$ declare c record; p record; begin
  select * into c from public.connexions where user_id = current_setting('t.client')::uuid;
  select * into p from public.connexions where user_id = current_setting('t.prospect')::uuid;
  insert into t_res values (40, 'coach : lit le compteur du client (' || current_setting('t.attendu') || ') et celui du prospect (1 : deux ouvertures le même jour = une connexion), jour de Paris',
    c.nombre = current_setting('t.attendu')::int and c.dernier_jour = current_setting('t.jour')::date and c.derniere is not null
    and p.nombre = 1 and p.dernier_jour = current_setting('t.jour')::date and p.derniere is not null and p.premiere is not null,
    'client ' || coalesce(c.nombre::text, 'absent') || ' · prospect ' || coalesce(p.nombre::text, 'absent'));
exception when others then insert into t_res values (40, 'coach : lit les compteurs', false, sqlstate || ' ' || sqlerrm);
end $$;
do $$ begin
  update public.connexions set nombre = 0 where user_id = current_setting('t.prospect')::uuid;
  insert into t_res values (41, 'coach : modifier un compteur directement : refusé (il lit seulement)', false, 'accepté');
exception when insufficient_privilege then insert into t_res values (41, 'coach : modifier un compteur directement : refusé (il lit seulement)', true, sqlerrm);
          when others then insert into t_res values (41, 'coach : modifier un compteur directement : refusé (il lit seulement)', false, sqlstate || ' ' || sqlerrm);
end $$;
do $$ begin
  insert into public.connexions (user_id, nombre) values (current_setting('t.coach')::uuid, 7);
  insert into t_res values (42, 'coach : créer une ligne directement : refusé', false, 'accepté');
exception when insufficient_privilege then insert into t_res values (42, 'coach : créer une ligne directement : refusé', true, sqlerrm);
          when others then insert into t_res values (42, 'coach : créer une ligne directement : refusé', false, sqlstate || ' ' || sqlerrm);
end $$;

-- ---------- un nouveau jour (Paris) pour le prospect fictif : +1 ----------
-- (en tant que propriétaire de la base, sur la seule ligne du prospect fictif : on la recule d'un jour)
set local role postgres;
update public.connexions set dernier_jour = dernier_jour - 1 where user_id = current_setting('t.prospect')::uuid;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.prospect'), 'role', 'authenticated')::text, true);
do $$ begin perform public.noter_connexion(); exception when others then null; end $$;
set local role postgres;
insert into t_res select 50, 'prospect : ouverture un autre jour : 2 connexions, jour de Paris à jour ; le client n''a pas bougé',
  (select nombre from public.connexions where user_id = current_setting('t.prospect')::uuid) = 2
  and (select dernier_jour from public.connexions where user_id = current_setting('t.prospect')::uuid) = current_setting('t.jour')::date
  and (select nombre from public.connexions where user_id = current_setting('t.client')::uuid) = current_setting('t.attendu')::int,
  (select nombre::text from public.connexions where user_id = current_setting('t.prospect')::uuid);
insert into t_res select 51, 'aucune autre ligne créée ou modifiée par ces tests que celles du client de test et du prospect fictif',
  not exists (select 1 from public.connexions where (premiere = now() or derniere = now())
                and user_id not in (current_setting('t.client')::uuid, current_setting('t.prospect')::uuid)), null;

-- le résultat, puis l'annulation forcée de tout ce qui précède (voir en tête)
do $$ declare total int; bons int; rates text; begin
  select count(*), count(*) filter (where ok is true), string_agg(n || ' ' || test || coalesce(' [' || detail || ']', ''), ' | ' order by n) filter (where ok is not true)
    into total, bons, rates from t_res;
  raise exception 'v56 : % / % tests ok (attendu : 23 / 23)%. Annulation forcée : rien n''est gardé.', bons, total, coalesce(' — RATÉS : ' || rates, '');
end $$;
