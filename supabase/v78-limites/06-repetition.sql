-- =====================================================================================================================
-- v78 — RÉPÉTITION SUR LA VRAIE BASE (LISEZMOI, étape 3) : TOUT EST ANNULÉ, RIEN N'EST GARDÉ. Pas encore lancée.
-- À coller TEL QUEL dans l'éditeur SQL de Supabase, en un seul envoi, avec l'« ok » de Lucas, à une heure calme.
-- Ce fichier = begin ; set local … ; le corps de 02-migration.sql ; le corps de 04-tests.sql ; rollback.
-- AUCUN commit : il ne peut pas appliquer la migration (02-migration.sql ne sert qu'à l'application réelle, étape 4).
-- Le corps de 04 finit par une erreur VOULUE qui annule tout, même si l'éditeur ne lit pas la dernière ligne. Attendu :
--   « v78 : 68 / 68 tests OK, 8 sauté(s) — aucun échec. Annulation forcée : rien n'est gardé. »
--   (en local, superutilisateur : « 76 / 76 tests OK, 0 sauté(s) »). Une erreur « v78 : STOP — … » avant : rien n'est
--   appliqué non plus ; on lit pourquoi et on s'arrête (LISEZMOI, critères d'arrêt).
-- Pendant l'envoi, l'app peut se figer quelques secondes et afficher « Hors ligne — gardé sur cet appareil, renvoi
-- automatique » : verrou sur profils et donnees jusqu'à l'annulation ; c'est normal, rien n'est perdu (LISEZMOI).
-- NE PAS MODIFIER À LA MAIN : copie exacte des corps de 02 et de 04, vérifiée par le banc (tests-locaux/garde-cles.js).
-- Après un changement de 02 ou de 04, depuis tests-locaux/ : node garde-cles.js ../index.html --refaire-06
-- =====================================================================================================================
begin;
set local lock_timeout = '5s';         -- un verrou attendu plus de 5 s : tout est annulé, on réessaie plus tard
set local statement_timeout = '120s';
-- >>>>> corps de 02-migration.sql (copie exacte) >>>>>

-- 0. Empreintes « avant », dans la transaction : règles RLS (même formule que le relevé), fonctions existantes, droits
--    d'exécution que le Security Advisor voudrait retirer (et qu'il ne faut PAS retirer, CLAUDE.md « Repères »)
do $$
begin
  perform set_config('v78.regles_avant', coalesce((
    select md5(string_agg(schemaname || '.' || tablename || ':' || policyname || ':' || cmd || ':' || roles::text || ':' || permissive || ':' || coalesce(qual, '') || '|' || coalesce(with_check, ''), ',' order by schemaname, tablename, policyname))
      from pg_policies where schemaname in ('public', 'storage')), ''), true);
  perform set_config('v78.fonctions_avant', coalesce((
    select md5(string_agg(pg_get_functiondef(p.oid), ',' order by p.proname, p.oid))
      from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prokind in ('f', 'p') and p.proname !~ '^v78_'), ''), true);
  perform set_config('v78.droits_avant', concat_ws(',',
    case when to_regprocedure('public.est_coach()') is not null then has_function_privilege('authenticated', 'public.est_coach()', 'execute')::text end,
    case when to_regprocedure('public.est_client()') is not null then has_function_privilege('authenticated', 'public.est_client()', 'execute')::text end,
    case when to_regprocedure('public.noter_connexion()') is not null then has_function_privilege('authenticated', 'public.noter_connexion()', 'execute')::text end), true);
end $$;

-- 1. Les limites, en un seul endroit. Ajouter une clé dans l'app = l'ajouter ICI d'abord (CREATE OR REPLACE FUNCTION,
--    non destructif), sinon la base refuse son écriture. Les valeurs : INVENTAIRE-CLES.md (taille réaliste lourde × 5 à ×10).
create or replace function public.v78_limite(p_outil text, p_prospect boolean default false)
  returns integer
  language sql
  immutable
  parallel safe
  set search_path = ''
as $$
  select case
           when l.octets is null then null                     -- clé inconnue : null, aussi pour un prospect (least() ignorerait le null)
           when p_prospect then least(l.octets, 262144)        -- plafond d'un compte prospect : 256 Ko par clé
           else l.octets
         end
    from (select case p_outil
                   when 'hist_repas'      then 16777216   -- 16 Mo : 24 diètes archivées
                   when 'hist_programme'  then 8388608    --  8 Mo : 24 programmes archivés
                   when 'journal'         then 4194304    --  4 Mo : 400 séances
                   when 'perf'            then 4194304    --  4 Mo : journal du coach (sans borne dans le code)
                   when 'checkins'        then 2097152    --  2 Mo : 60 bilans, 200 avis
                   when 'repas'           then 1048576    --  1 Mo
                   when 'journal_alimentaire' then 1048576  --  1 Mo : journal alimentaire (v79), ~130 Ko par an au plus
                   when 'feedbacks'       then 1048576    --  1 Mo : 60 réponses du coach
                   when 'programme'       then 524288     -- 512 Ko
                   when 'atelier'         then 524288
                   when 'mens'            then 524288
                   when 'formation'       then 524288
                   when 'photos'          then 524288
                   when 'notes_coach'     then 524288
                   when 'intake'          then 262144     -- 256 Ko
                   when 'complements'     then 131072     -- 128 Ko
                   when 'repas_suivi'     then 131072
                   when 'challenge'       then 131072
                   when 'suivi_prospect'  then 131072
                   when 'activite'        then 65536      --  64 Ko
                   when 'seances_formation' then 65536    --  64 Ko : séances faites des programmes de la formation (v90), 400 au plus (~32 Ko)
                   when 'calc'            then 16384      --  16 Ko : les petites clés
                   when 'calc_perso'      then 16384
                   when 'objectifs_faits' then 16384
                   when 'prefs'           then 16384
                   when 'emails'          then 16384
                   when 'contact'         then 16384      -- v72 : oubliée dans la liste du 30/09
                   when 'coach_notifs'    then 16384
                   when 'coach_visite'    then 16384      -- v72 E : oubliée dans la liste du 30/09
                 end as octets) l
$$;
comment on function public.v78_limite(text, boolean) is
  'v78 : taille maximale (octets de contenu::text) d''une clé de donnees ; null = clé inconnue. p_prospect : plafond de 256 Ko d''un compte prospect. Seule liste des clés admises : une nouvelle clé de l''app s''ajoute ici d''abord.';
-- appelée par le déclencheur avec les droits de la personne qui écrit : exécutable par les rôles de l'app (fonction pure,
-- sans accès aux données, SECURITY INVOKER : rien à protéger)
revoke all on function public.v78_limite(text, boolean) from public;
grant execute on function public.v78_limite(text, boolean) to anon, authenticated, service_role;

-- 2. Garde-fous, en lecture seule : un seul échoue, rien n'est appliqué (le message dit lequel)
do $$
declare
  n bigint;
  cles_coach constant text[] := array['programme', 'repas', 'calc', 'complements', 'hist_programme', 'hist_repas',
                                      'feedbacks', 'notes_coach', 'suivi_prospect'];   -- clés écrites par le coach dans une fiche
begin
  if to_regprocedure('public.est_client()') is null or to_regprocedure('public.est_coach()') is null then
    raise exception 'v78 : STOP — public.est_client() ou public.est_coach() absente : rien n''est appliqué';
  end if;
  if to_regclass('public.donnees') is null or to_regclass('public.profils') is null then
    raise exception 'v78 : STOP — table public.donnees ou public.profils absente : rien n''est appliqué';
  end if;
  select count(*) into n from public.donnees where public.v78_limite(outil) is null;
  if n > 0 then
    raise exception 'v78 : STOP — % ligne(s) avec une clé hors de la liste (relevé 01, partie A) : ajouter la clé dans v78_limite, jamais supprimer la ligne', n;
  end if;
  select count(*) into n from public.donnees where coalesce(octet_length(contenu::text), 0) > public.v78_limite(outil) / 4;
  if n > 0 then
    raise exception 'v78 : STOP — % ligne(s) au-dessus du quart de leur limite (marge sous ×4, relevé 01 partie A) : relever la limite de la clé, relancer les tests', n;
  end if;
  select count(*) into n
    from public.donnees d join public.profils p on p.id = d.user_id
   where p.role <> 'coach' and p.statut = 'prospect' and d.outil <> all (cles_coach)
     and coalesce(octet_length(d.contenu::text), 0) > public.v78_limite(d.outil, true) / 4;
  if n > 0 then
    raise exception 'v78 : STOP — % ligne(s) de prospect au-dessus du quart du plafond prospect (relevé 01, partie B)', n;
  end if;
  select count(*) into n from public.profils where char_length(prenom) > 100 or char_length(nom) > 100;
  if n > 0 then
    raise exception 'v78 : STOP — % profil(s) avec un prénom ou un nom de plus de 100 caractères (relevé 01, partie D)', n;
  end if;
end $$;

-- 3. La fonction du déclencheur (SECURITY INVOKER : elle lit avec les droits de la personne qui écrit, règles RLS comprises)
create or replace function public.v78_donnees_limites()
  returns trigger
  language plpgsql
  set search_path = ''
as $$
declare
  v_taille   bigint  := coalesce(octet_length(new.contenu::text), 0);
  v_prospect boolean := false;
  v_limite   integer;
  v_avant    bigint;
begin
  -- sous le plafond prospect et sous la limite de la clé : accepté pour tout le monde, sans rien lire (presque toutes les écritures)
  if public.v78_limite(new.outil, true) is not null and v_taille <= public.v78_limite(new.outil, true) then
    return new;
  end if;
  -- au-delà : l'auteur compte. Prospect = compte connecté qui n'est ni coach ni client. Sans session (clé de service,
  -- éditeur SQL, anonyme) : la limite de la clé seule (l'anonyme est de toute façon refusé par les règles RLS).
  if auth.uid() is not null then
    v_prospect := not (public.est_coach() or public.est_client());
  end if;
  v_limite := public.v78_limite(new.outil, v_prospect);
  if v_limite is not null and v_taille <= v_limite then
    return new;
  end if;
  -- seule exception : la ligne existe déjà, même compte et même clé, et ne grossit pas (même taille ou plus petite).
  -- UPSERT de l'app (POST on_conflict=user_id,outil) : ce déclencheur passe d'abord en INSERT, avant que la base voie la
  -- ligne existante, d'où la lecture (avec les droits de l'auteur : il ne voit que les lignes qu'il a le droit de voir).
  if tg_op = 'UPDATE' then
    if old.user_id = new.user_id and old.outil = new.outil then
      v_avant := coalesce(octet_length(old.contenu::text), 0);
    end if;
  else
    select coalesce(octet_length(d.contenu::text), 0) into v_avant
      from public.donnees d
     where d.user_id = new.user_id and d.outil = new.outil;
  end if;
  if v_avant is not null and v_taille <= v_avant then
    return new;
  end if;
  if v_limite is null then
    raise exception using
      errcode = 'check_violation',
      message = format('v78 : clé « %s » inconnue : la base ne l''enregistre pas', left(new.outil, 60)),
      hint    = 'Une nouvelle clé de l''app s''ajoute d''abord dans public.v78_limite() (supabase/v78-limites/LISEZMOI.md).';
  end if;
  raise exception using
    errcode = 'check_violation',
    message = format('v78 : contenu trop gros pour la clé « %s » : %s octets, limite %s%s', new.outil, v_taille, v_limite,
                     case when v_prospect then ' (plafond d''un compte prospect)' else '' end),
    hint    = 'Rien n''est enregistré en base ; l''app garde la modification sur l''appareil.';
end;
$$;
comment on function public.v78_donnees_limites() is
  'v78 : déclencheur BEFORE INSERT OR UPDATE de donnees : refuse une clé inconnue ou un contenu au-dessus de v78_limite (une ligne déjà là peut être réécrite sans grossir).';
-- comme creer_profil et protege_role : personne ne l'appelle directement (un déclencheur s'exécute sans ce droit)
revoke all on function public.v78_donnees_limites() from public, anon, authenticated;

-- 4. Le déclencheur
create or replace trigger v78_donnees_limites
  before insert or update on public.donnees
  for each row execute function public.v78_donnees_limites();
comment on trigger v78_donnees_limites on public.donnees is
  'v78 : limites d''écriture (clés admises, taille par clé, plafond prospect). Arrêt d''urgence sans rien supprimer : alter table public.donnees disable trigger v78_donnees_limites;';

-- 5. Prénom et nom : 100 caractères au plus (l'app en écrit 60 au plus à l'inscription). NOT VALID d'abord (aucune ligne
--    lue), puis VALIDATE : la base vérifie les lignes déjà là sans en modifier aucune (échec = rien n'est appliqué).
do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.profils'::regclass and conname = 'v78_profils_prenom_longueur') then
    alter table public.profils add constraint v78_profils_prenom_longueur check (char_length(prenom) <= 100) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.profils'::regclass and conname = 'v78_profils_nom_longueur') then
    alter table public.profils add constraint v78_profils_nom_longueur check (char_length(nom) <= 100) not valid;
  end if;
end $$;
alter table public.profils validate constraint v78_profils_prenom_longueur;
alter table public.profils validate constraint v78_profils_nom_longueur;
comment on constraint v78_profils_prenom_longueur on public.profils is 'v78 : prénom de 100 caractères au plus';
comment on constraint v78_profils_nom_longueur on public.profils is 'v78 : nom de 100 caractères au plus';

-- 6. Contrôle final : un écart, et toute la transaction est annulée
do $$
declare
  regles text;
  fonctions text;
  droits text;
begin
  select coalesce(md5(string_agg(schemaname || '.' || tablename || ':' || policyname || ':' || cmd || ':' || roles::text || ':' || permissive || ':' || coalesce(qual, '') || '|' || coalesce(with_check, ''), ',' order by schemaname, tablename, policyname)), '')
    into regles from pg_policies where schemaname in ('public', 'storage');
  if regles <> current_setting('v78.regles_avant') then
    raise exception 'v78 : STOP — les règles RLS ont changé pendant la migration : rien n''est appliqué';
  end if;
  select coalesce(md5(string_agg(pg_get_functiondef(p.oid), ',' order by p.proname, p.oid)), '')
    into fonctions from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prokind in ('f', 'p') and p.proname !~ '^v78_';
  if fonctions <> current_setting('v78.fonctions_avant') then
    raise exception 'v78 : STOP — une fonction existante a changé pendant la migration : rien n''est appliqué';
  end if;
  droits := concat_ws(',',
    case when to_regprocedure('public.est_coach()') is not null then has_function_privilege('authenticated', 'public.est_coach()', 'execute')::text end,
    case when to_regprocedure('public.est_client()') is not null then has_function_privilege('authenticated', 'public.est_client()', 'execute')::text end,
    case when to_regprocedure('public.noter_connexion()') is not null then has_function_privilege('authenticated', 'public.noter_connexion()', 'execute')::text end);
  if droits <> current_setting('v78.droits_avant') then
    raise exception 'v78 : STOP — les droits d''exécution de est_coach / est_client / noter_connexion ont changé : rien n''est appliqué';
  end if;
  if not exists (select 1 from pg_trigger
                  where tgrelid = 'public.donnees'::regclass and tgname = 'v78_donnees_limites' and tgenabled = 'O'
                    and tgfoid = 'public.v78_donnees_limites()'::regprocedure) then
    raise exception 'v78 : STOP — le déclencheur v78_donnees_limites n''est pas en place';
  end if;
  if (select count(*) from pg_constraint
       where conrelid = 'public.profils'::regclass and conname in ('v78_profils_prenom_longueur', 'v78_profils_nom_longueur') and convalidated) <> 2 then
    raise exception 'v78 : STOP — les contraintes de longueur de profils ne sont pas validées';
  end if;
  if public.v78_limite('cle_inconnue_v78', true) is not null or public.v78_limite('cle_inconnue_v78', false) is not null then
    raise exception 'v78 : STOP — v78_limite accepte une clé inconnue';
  end if;
end $$;

-- >>>>> corps de 04-tests.sql (copie exacte) >>>>>
do $t$
begin
  if to_regprocedure('public.v78_limite(text, boolean)') is null or to_regprocedure('public.v78_donnees_limites()') is null then
    raise exception 'v78 tests : la migration n''est pas là (02-migration.sql d''abord ; répétition : voir LISEZMOI)';
  end if;
end $t$;

create temp table t_res (n int, test text, ok boolean, detail text) on commit drop;
grant all on t_res to anon, authenticated;

-- ---------- outils des tests (fonctions temporaires, disparaissent avec la transaction) ----------
-- un contenu JSON dont la taille, comptée comme la base la compte (octet_length(contenu::text)), vaut exactement p_octets
create function pg_temp.json_de(p_octets int) returns jsonb language sql immutable as $f$
  select jsonb_build_object('test_v78', 's9999', 'bourrage',
           repeat('x', greatest(0, p_octets - octet_length(jsonb_build_object('test_v78', 's9999', 'bourrage', '')::text))))
$f$;
-- lance une requête avec les droits du moment et range le résultat : ok, zero, taille, droits, refus, erreur …
create function pg_temp.essai(p_n int, p_test text, p_sql text, p_attendu text) returns void language plpgsql as $f$
declare v_n bigint; v_etat text; v_msg text;
begin
  begin
    execute p_sql;
    get diagnostics v_n = row_count;
    v_etat := case when v_n = 0 then 'zero' else 'ok' end;
    v_msg := v_n || ' ligne(s)';
  exception
    when check_violation then v_etat := 'taille'; v_msg := sqlerrm;
    when insufficient_privilege then v_etat := 'droits'; v_msg := sqlerrm;
    when raise_exception then v_etat := 'refus'; v_msg := sqlerrm;
    when others then v_etat := 'erreur ' || sqlstate; v_msg := sqlerrm;
  end;
  insert into t_res values (p_n, p_test, v_etat = any (string_to_array(p_attendu, '|')),
    'attendu ' || p_attendu || ' · obtenu ' || v_etat || ' (' || left(coalesce(v_msg, ''), 160) || ')');
end $f$;
-- écrire comme l'app : upsert (POST on_conflict=user_id,outil, resolution=merge-duplicates)
create function pg_temp.ecrire(p_n int, p_test text, p_compte text, p_cle text, p_octets int, p_attendu text) returns void language plpgsql as $f$
begin
  perform pg_temp.essai(p_n, p_test, format(
    'insert into public.donnees (user_id, outil, contenu, maj_le) values (%L::uuid, %L, pg_temp.json_de(%s), now()) '
    || 'on conflict (user_id, outil) do update set user_id = excluded.user_id, outil = excluded.outil, '
    || 'contenu = excluded.contenu, maj_le = excluded.maj_le',
    current_setting(p_compte), p_cle, p_octets), p_attendu);
end $f$;
-- modifier comme CleCoach.ecrireSi : PATCH (UPDATE) d'une ligne existante
create function pg_temp.modifier(p_n int, p_test text, p_compte text, p_cle text, p_octets int, p_attendu text) returns void language plpgsql as $f$
begin
  perform pg_temp.essai(p_n, p_test, format(
    'update public.donnees set contenu = pg_temp.json_de(%s), maj_le = now() where user_id = %L::uuid and outil = %L',
    p_octets, current_setting(p_compte), p_cle), p_attendu);
end $f$;
-- lire les lignes d'un compte (une clé, ou toutes si p_cle est null)
create function pg_temp.lire(p_n int, p_test text, p_compte text, p_cle text, p_attendu text) returns void language plpgsql as $f$
begin
  perform pg_temp.essai(p_n, p_test,
    format('select 1 from public.donnees where user_id = %L::uuid', current_setting(p_compte))
    || case when p_cle is null then '' else format(' and outil = %L', p_cle) end, p_attendu);
end $f$;
-- changer un champ de profils (prenom, nom, role, statut)
create function pg_temp.profil(p_n int, p_test text, p_compte text, p_champ text, p_valeur text, p_attendu text) returns void language plpgsql as $f$
begin
  perform pg_temp.essai(p_n, p_test,
    format('update public.profils set %I = %L where id = %L::uuid', p_champ, p_valeur, current_setting(p_compte)), p_attendu);
end $f$;
grant execute on function pg_temp.json_de(int), pg_temp.essai(int, text, text, text),
  pg_temp.ecrire(int, text, text, text, int, text), pg_temp.modifier(int, text, text, text, int, text),
  pg_temp.lire(int, text, text, text, text), pg_temp.profil(int, text, text, text, text, text) to anon, authenticated;

-- ---------- A. le décor (comptes fictifs) et la structure — en tant que propriétaire de la base ----------
do $t$
begin
  perform set_config('t.coach',    '00000000-0000-4000-8000-0000000078c0', true);
  perform set_config('t.client',   '00000000-0000-4000-8000-0000000078a1', true);
  perform set_config('t.client2',  '00000000-0000-4000-8000-0000000078a2', true);
  perform set_config('t.prospect', '00000000-0000-4000-8000-0000000078b1', true);
end $t$;

-- les comptes : le déclencheur creer_profil crée chaque profil (« prospect » par défaut)
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
  (current_setting('t.coach')::uuid,    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'coach-fictif-v78@exemple.invalid',    '{"prenom":"Coach fictif v78"}', now(), now()),
  (current_setting('t.client')::uuid,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'thomas-fictif-v78@exemple.invalid',   '{"prenom":"Thomas","nom":"Test v78"}', now(), now()),
  (current_setting('t.client2')::uuid,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'camille-fictive-v78@exemple.invalid', '{"prenom":"Camille","nom":"Test v78"}', now(), now()),
  (current_setting('t.prospect')::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prospect-fictif-v78@exemple.invalid', '{"prenom":"Prospect fictif v78"}', now(), now());

-- rôle et statuts posés comme creer-acces le fait (clé de service : protege_role l'accepte)
do $t$
begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  update public.profils set role = 'coach', statut = 'client' where id = current_setting('t.coach')::uuid;
  update public.profils set statut = 'client' where id in (current_setting('t.client')::uuid, current_setting('t.client2')::uuid);
  perform set_config('request.jwt.claims', '', true);
  -- trois lignes de départ : le journal de l'autre client, une note du coach chez le client, le suivi du prospect
  insert into public.donnees (user_id, outil, contenu, maj_le) values
    (current_setting('t.client2')::uuid,  'journal',        '{"test_v78":"s9999","seances":[]}', now()),
    (current_setting('t.client')::uuid,   'notes_coach',    '{"test_v78":"s9999","texte":"note fictive"}', now()),
    (current_setting('t.prospect')::uuid, 'suivi_prospect', '{"test_v78":"s9999","version":1}', now());
end $t$;

insert into t_res select 0, 'décor : un coach, deux clients et un prospect fictifs ; trois lignes de départ',
  (select count(*) from public.profils where id = current_setting('t.coach')::uuid and role = 'coach' and statut = 'client') = 1
  and (select count(*) from public.profils where id in (current_setting('t.client')::uuid, current_setting('t.client2')::uuid) and role = 'client' and statut = 'client') = 2
  and (select count(*) from public.profils where id = current_setting('t.prospect')::uuid and role = 'client' and statut = 'prospect') = 1
  and (select count(*) from public.donnees where contenu ->> 'test_v78' = 's9999') = 3, null;

insert into t_res select 1, 'structure : déclencheur v78_donnees_limites BEFORE INSERT OR UPDATE, FOR EACH ROW, activé, sur donnees',
  exists (select 1 from pg_trigger t
           where t.tgrelid = 'public.donnees'::regclass and t.tgname = 'v78_donnees_limites' and not t.tgisinternal
             and t.tgenabled = 'O' and t.tgfoid = 'public.v78_donnees_limites()'::regprocedure
             and (t.tgtype::int & 1) = 1 and (t.tgtype::int & 2) = 2 and (t.tgtype::int & 4) = 4
             and (t.tgtype::int & 16) = 16 and (t.tgtype::int & 8) = 0),
  (select string_agg(tgname || ' type ' || tgtype || ' état ' || tgenabled, ', ') from pg_trigger where tgrelid = 'public.donnees'::regclass and not tgisinternal);

insert into t_res select 2, 'structure : contraintes v78_profils_prenom_longueur et v78_profils_nom_longueur présentes et validées',
  (select count(*) from pg_constraint where conrelid = 'public.profils'::regclass
     and conname in ('v78_profils_prenom_longueur', 'v78_profils_nom_longueur') and contype = 'c' and convalidated) = 2, null;

insert into t_res select 3, 'limites : les 29 clés de l''inventaire aux valeurs prévues ; prospect 256 Ko au plus ; clé inconnue = null (aussi pour un prospect)',
  (select count(*) = 29 and bool_and(public.v78_limite(a.outil) = a.limite) and bool_and(public.v78_limite(a.outil, true) = least(a.limite, 262144))
     from (values ('hist_repas', 16777216), ('hist_programme', 8388608), ('journal', 4194304), ('perf', 4194304),
                  ('checkins', 2097152), ('repas', 1048576), ('journal_alimentaire', 1048576), ('feedbacks', 1048576), ('programme', 524288), ('atelier', 524288),
                  ('mens', 524288), ('formation', 524288), ('photos', 524288), ('notes_coach', 524288), ('intake', 262144),
                  ('complements', 131072), ('repas_suivi', 131072), ('challenge', 131072), ('suivi_prospect', 131072),
                  ('activite', 65536), ('seances_formation', 65536), ('calc', 16384), ('calc_perso', 16384), ('objectifs_faits', 16384), ('prefs', 16384),
                  ('emails', 16384), ('contact', 16384), ('coach_notifs', 16384), ('coach_visite', 16384)) as a (outil, limite))
  and public.v78_limite('cle_inconnue_v78') is null and public.v78_limite('cle_inconnue_v78', true) is null
  and public.v78_limite(null) is null, null;

insert into t_res select 4, 'règles RLS : 6 sur donnees, 2 sur profils, aucune ne parle de la v78 (la migration n''y touche pas)',
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'donnees') = 6
  and (select count(*) from pg_policies where schemaname = 'public' and tablename = 'profils') = 2
  and not exists (select 1 from pg_policies where schemaname = 'public' and coalesce(qual, '') || coalesce(with_check, '') like '%v78%'),
  (select string_agg(tablename || ':' || cmd, ', ' order by tablename, cmd) from pg_policies where schemaname = 'public' and tablename in ('donnees', 'profils'));

insert into t_res select 5, 'Security Advisor : est_coach, est_client (et noter_connexion si elle existe) restent exécutables par authenticated',
  has_function_privilege('authenticated', 'public.est_coach()', 'execute')
  and has_function_privilege('authenticated', 'public.est_client()', 'execute')
  and (to_regprocedure('public.noter_connexion()') is null or has_function_privilege('authenticated', 'public.noter_connexion()', 'execute')), null;

insert into t_res select 6, 'droits : la fonction du déclencheur n''est appelable ni par anon ni par authenticated ; v78_limite l''est (le déclencheur l''appelle)',
  not has_function_privilege('anon', 'public.v78_donnees_limites()', 'execute')
  and not has_function_privilege('authenticated', 'public.v78_donnees_limites()', 'execute')
  and has_function_privilege('authenticated', 'public.v78_limite(text, boolean)', 'execute')
  and has_function_privilege('anon', 'public.v78_limite(text, boolean)', 'execute'), null;

do $t$
begin
  perform pg_temp.essai(7, 'inscription par l''API (hors de l''app) avec un prénom de 101 caractères : refusée, aucun compte créé',
    $q$insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
       values ('00000000-0000-4000-8000-0000000078d1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
               'trop-long-v78@exemple.invalid', jsonb_build_object('prenom', repeat('a', 101)), now(), now())$q$, 'taille');
  perform pg_temp.essai(8, 'inscription avec un prénom de 60 caractères (le maximum de l''app) : acceptée',
    $q$insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
       values ('00000000-0000-4000-8000-0000000078d2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
               'soixante-v78@exemple.invalid', jsonb_build_object('prenom', repeat('é', 60)), now(), now())$q$, 'ok');
end $t$;

-- ---------- B. l'anonyme (clé publique, sans session) ----------
set local role anon;
do $t$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform pg_temp.lire(10, 'anonyme : lire les lignes d''un client : rien', 't.client', null, 'zero|droits');
  perform pg_temp.ecrire(11, 'anonyme : écrire chez un client : refusé', 't.client', 'journal', 2000, 'droits');
  perform pg_temp.modifier(12, 'anonyme : modifier la ligne d''un client : rien', 't.client2', 'journal', 2000, 'zero|droits');
  perform pg_temp.profil(13, 'anonyme : changer un prénom : rien', 't.client', 'prenom', 'Pirate', 'zero|droits');
  perform pg_temp.ecrire(14, 'anonyme : écrire une clé inconnue : refusé', 't.client', 'piratage', 2000, 'droits|taille');
end $t$;

-- ---------- C. le client (fictif) ----------
set local role authenticated;
do $t$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', current_setting('t.client'), 'role', 'authenticated')::text, true);
  perform pg_temp.ecrire(20, 'client : son journal, taille normale (2 Ko) : accepté', 't.client', 'journal', 2000, 'ok');
  perform pg_temp.ecrire(21, 'client : journal lourd réaliste (624 Ko : 400 séances de 8 exercices) : accepté', 't.client', 'journal', 623613, 'ok');
  perform pg_temp.ecrire(22, 'client : journal exactement à sa limite (4 194 304 octets) : accepté', 't.client', 'journal', 4194304, 'ok');
  perform pg_temp.ecrire(23, 'client : journal à sa limite + 1 octet : refusé (trop gros)', 't.client', 'journal', 4194305, 'taille');
  perform pg_temp.ecrire(24, 'client : bilans lourds réalistes (checkins 288 Ko : 60 bilans, 200 avis) : acceptés', 't.client', 'checkins', 287658, 'ok');
  perform pg_temp.ecrire(25, 'client : formation de 300 Ko (au-dessus du plafond prospect, sous sa limite de 512 Ko) : acceptée', 't.client', 'formation', 300000, 'ok');
  perform pg_temp.ecrire(26, 'client : contact (clé v72 oubliée dans la liste du 30/09) : accepté', 't.client', 'contact', 118, 'ok');
  perform pg_temp.ecrire(27, 'client : clé inconnue : refusée', 't.client', 'piratage', 2000, 'taille');
  perform pg_temp.ecrire(28, 'client : clé du coach seul (feedbacks) chez lui : refusée par les règles RLS (inchangé)', 't.client', 'feedbacks', 2000, 'droits');
  perform pg_temp.lire(29, 'client : lire ses notes_coach : rien (inchangé)', 't.client', 'notes_coach', 'zero');
  perform pg_temp.modifier(30, 'client : modifier (PATCH) son journal au-dessus de sa limite : refusé', 't.client', 'journal', 4194305, 'taille');
  perform pg_temp.lire(31, 'client → autre client : lire ses lignes : rien', 't.client2', null, 'zero');
  perform pg_temp.ecrire(32, 'client → autre client : écrire une clé chez lui : refusé', 't.client2', 'mens', 2000, 'droits');
  perform pg_temp.modifier(33, 'client → autre client : modifier son journal : rien', 't.client2', 'journal', 2000, 'zero');
  perform pg_temp.ecrire(34, 'client → autre client : upsert sur son journal existant : refusé', 't.client2', 'journal', 2000, 'droits');
  perform pg_temp.profil(35, 'client : son prénom « Thomas » : accepté', 't.client', 'prenom', 'Thomas', 'ok');
  perform pg_temp.profil(36, 'client : un prénom de 101 caractères : refusé', 't.client', 'prenom', repeat('a', 101), 'taille');
  perform pg_temp.profil(37, 'client : un nom de 101 caractères : refusé', 't.client', 'nom', repeat('a', 101), 'taille');
  perform pg_temp.profil(38, 'client : un prénom de 100 caractères accentués (200 octets) : accepté (la limite compte des caractères)', 't.client', 'prenom', repeat('é', 100), 'ok');
  perform pg_temp.profil(39, 'client → autre client : changer son prénom : rien', 't.client2', 'prenom', 'Pirate', 'zero');
  perform pg_temp.profil(40, 'client : se donner le rôle coach : refusé (protege_role, inchangé)', 't.client', 'role', 'coach', 'refus');
end $t$;

-- ---------- D. le prospect (fictif, inscription libre) ----------
do $t$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', current_setting('t.prospect'), 'role', 'authenticated')::text, true);
  perform pg_temp.ecrire(50, 'prospect : questionnaire court (intake 3 Ko) : accepté', 't.prospect', 'intake', 3000, 'ok');
  perform pg_temp.ecrire(51, 'prospect : challenge lourd (13 Ko : 50 clics, 50 « Plus tard ») : accepté', 't.prospect', 'challenge', 12651, 'ok');
  perform pg_temp.ecrire(52, 'prospect : activite (2 Ko : 60 jours) : acceptée', 't.prospect', 'activite', 1446, 'ok');
  perform pg_temp.ecrire(53, 'prospect : contact (numéro, code ?ref=) : accepté', 't.prospect', 'contact', 118, 'ok');
  perform pg_temp.ecrire(54, 'prospect : mensurations sur 5 ans (72 Ko) : acceptées', 't.prospect', 'mens', 71725, 'ok');
  perform pg_temp.ecrire(55, 'prospect : formation exactement au plafond prospect (262 144 octets) : acceptée', 't.prospect', 'formation', 262144, 'ok');
  perform pg_temp.ecrire(56, 'prospect : formation au plafond prospect + 1 octet : refusée', 't.prospect', 'formation', 262145, 'taille');
  perform pg_temp.ecrire(57, 'prospect : clé inconnue : refusée', 't.prospect', 'piratage', 2000, 'taille');
  perform pg_temp.ecrire(58, 'prospect → clé du coach : écrire son suivi_prospect : refusé (inchangé)', 't.prospect', 'suivi_prospect', 2000, 'droits');
  perform pg_temp.lire(59, 'prospect → clé du coach : lire son suivi_prospect : rien (inchangé)', 't.prospect', 'suivi_prospect', 'zero');
  perform pg_temp.ecrire(60, 'prospect → clé du coach : écrire un programme chez un client : refusé', 't.client', 'programme', 2000, 'droits');
  perform pg_temp.ecrire(61, 'prospect → clé du coach : écrire des notes_coach chez un client : refusé', 't.client', 'notes_coach', 2000, 'droits');
  perform pg_temp.lire(62, 'prospect → client : lire ses lignes : rien', 't.client', null, 'zero');
  perform pg_temp.profil(63, 'prospect : se passer client : refusé (protege_role, inchangé)', 't.prospect', 'statut', 'client', 'refus');
  perform pg_temp.profil(64, 'prospect : un prénom de 101 caractères : refusé', 't.prospect', 'prenom', repeat('a', 101), 'taille');
end $t$;

-- ---------- D bis. sans session (clé de service, éditeur SQL) — en tant que propriétaire de la base ----------
-- Le déclencheur ne voit aucun compte (auth.uid() vide) : la limite de la clé seule, sans le plafond prospect, quel que
-- soit le compte dont c'est la ligne. (Le prospect est encore « prospect » ici : le coach le passe client en E, test 84.)
reset role;
do $t$
begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  perform pg_temp.ecrire(65, 'sans session (clé de service) : formation de 300 000 octets chez le prospect : acceptée (pas de plafond prospect ; limite de la clé : 512 Ko)', 't.prospect', 'formation', 300000, 'ok');
  perform pg_temp.ecrire(66, 'sans session (clé de service) : journal de 4 194 305 octets (sa limite + 1) chez le prospect : refusé (trop gros)', 't.prospect', 'journal', 4194305, 'taille');
  perform set_config('request.jwt.claims', '', true);
end $t$;
set local role authenticated;

-- ---------- E. le coach (fictif) ----------
do $t$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', current_setting('t.coach'), 'role', 'authenticated')::text, true);
  perform pg_temp.ecrire(70, 'coach : programme chez le client (20 Ko) : accepté', 't.client', 'programme', 20000, 'ok');
  perform pg_temp.ecrire(71, 'coach : programme de 300 Ko chez le PROSPECT : accepté (le plafond prospect vise le prospect, pas le coach)', 't.prospect', 'programme', 300000, 'ok');
  perform pg_temp.ecrire(72, 'coach : historique des diètes lourd réaliste (hist_repas 2,9 Mo : 24 diètes) chez le client : accepté', 't.client', 'hist_repas', 2972435, 'ok');
  perform pg_temp.ecrire(73, 'coach : hist_repas à sa limite + 1 octet (16 Mo + 1) : refusé', 't.client', 'hist_repas', 16777217, 'taille');
  perform pg_temp.ecrire(74, 'coach : programme au-dessus de sa limite (512 Ko + 1) chez le client : refusé', 't.client', 'programme', 524289, 'taille');
  perform pg_temp.ecrire(75, 'coach : feedbacks chez le client : accepté', 't.client', 'feedbacks', 5000, 'ok');
  perform pg_temp.ecrire(76, 'coach : notes_coach chez le client (ligne déjà là) : acceptées', 't.client', 'notes_coach', 5000, 'ok');
  perform pg_temp.ecrire(77, 'coach : suivi_prospect chez le prospect (ligne déjà là) : accepté', 't.prospect', 'suivi_prospect', 10054, 'ok');
  perform pg_temp.ecrire(78, 'coach : coach_visite chez lui (clé v72 E oubliée dans la liste du 30/09) : acceptée', 't.coach', 'coach_visite', 149, 'ok');
  perform pg_temp.ecrire(79, 'coach : son journal d''entraînement lourd (perf 637 Ko : 3 ans) : accepté', 't.coach', 'perf', 636932, 'ok');
  perform pg_temp.ecrire(80, 'coach : clé inconnue chez lui : refusée', 't.coach', 'piratage', 2000, 'taille');
  perform pg_temp.ecrire(81, 'coach : clé inconnue chez le client : refusée', 't.client', 'piratage', 2000, 'taille|droits');
  perform pg_temp.lire(82, 'coach : lire les notes_coach du client : 1 ligne (inchangé)', 't.client', 'notes_coach', 'ok');
  perform pg_temp.profil(83, 'coach : prénom du client à 101 caractères : refusé', 't.client', 'prenom', repeat('a', 101), 'taille');
  perform pg_temp.profil(84, 'coach : passer le prospect client : accepté (les contraintes de longueur ne gênent pas un changement de statut)', 't.prospect', 'statut', 'client', 'ok');
end $t$;

-- ---------- F. une ANCIENNE ligne plus grosse que sa limite (ne peut pas exister le jour J : les garde-fous de la
--            migration l'interdisent ; elle apparaîtrait si une limite était un jour abaissée) ----------
-- Décision : elle reste LISIBLE et MODIFIABLE TANT QU'ELLE NE GROSSIT PAS (même taille ou plus petite, même par upsert) ;
-- elle ne peut plus grossir ; revenue sous sa limite, elle suit la règle normale. Personne n'est bloqué sur sa propre
-- donnée, rien n'est jamais coupé ni effacé par la base, et aucun nouveau contenu ne dépasse la limite.
reset role;
do $t$
begin
  if current_setting('is_superuser') = 'on' then
    -- posée SANS le déclencheur (réservé au superutilisateur : Postgres local), dans la transaction annulée
    perform set_config('session_replication_role', 'replica', true);
    insert into public.donnees (user_id, outil, contenu, maj_le)
      values (current_setting('t.client')::uuid, 'mens', pg_temp.json_de(600000), now())
      on conflict (user_id, outil) do update set contenu = excluded.contenu, maj_le = excluded.maj_le;
    perform set_config('session_replication_role', 'origin', true);
    perform set_config('t.ancienne', 'oui', true);
    insert into t_res select 90, 'décor : une ligne « mens » de 600 000 octets chez le client (au-dessus de sa limite de 524 288)',
      (select octet_length(contenu::text) from public.donnees where user_id = current_setting('t.client')::uuid and outil = 'mens') = 600000, null;
  else
    perform set_config('t.ancienne', 'non', true);
    insert into t_res values (90, 'décor : une ligne « mens » de 600 000 octets chez le client', null,
      'SAUTÉ : il faut un superutilisateur (Postgres local) pour poser une ligne sans le déclencheur');
  end if;
end $t$;

set local role authenticated;
do $t$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', current_setting('t.client'), 'role', 'authenticated')::text, true);
  if current_setting('t.ancienne') = 'oui' then
    perform pg_temp.lire(91, 'ancienne ligne trop grosse : le client la lit', 't.client', 'mens', 'ok');
    perform pg_temp.ecrire(92, 'ancienne ligne trop grosse : réécrite à l''identique (upsert, même taille) : acceptée', 't.client', 'mens', 600000, 'ok');
    perform pg_temp.ecrire(93, 'ancienne ligne trop grosse : réécrite plus petite mais encore au-dessus (550 000, upsert) : acceptée', 't.client', 'mens', 550000, 'ok');
    perform pg_temp.modifier(94, 'ancienne ligne trop grosse : réécrite plus petite encore (540 000, PATCH) : acceptée', 't.client', 'mens', 540000, 'ok');
    perform pg_temp.ecrire(95, 'ancienne ligne trop grosse : la faire grossir (545 000) : refusé', 't.client', 'mens', 545000, 'taille');
    perform pg_temp.ecrire(96, 'ancienne ligne trop grosse : ramenée sous sa limite (100 000) : acceptée', 't.client', 'mens', 100000, 'ok');
    perform pg_temp.ecrire(97, 'ancienne ligne : revenue sous sa limite, la refaire passer au-dessus (600 000) : refusé', 't.client', 'mens', 600000, 'taille');
  else
    insert into t_res select k, 'ancienne ligne trop grosse (test ' || k || ')', null, 'SAUTÉ : pas de ligne de départ (voir test 90)'
      from generate_series(91, 97) as k;
  end if;
end $t$;

-- ---------- G. rien d'autre n'a été écrit ----------
reset role;
insert into t_res select 99, 'contrôle : toutes les lignes marquées « test_v78 » sont celles des comptes fictifs',
  not exists (select 1 from public.donnees
               where contenu ->> 'test_v78' = 's9999'
                 and user_id not in (current_setting('t.coach')::uuid, current_setting('t.client')::uuid,
                                     current_setting('t.client2')::uuid, current_setting('t.prospect')::uuid)), null;

-- ---------- le résultat, puis l'annulation forcée de tout ce qui précède ----------
select n as "n°", case when ok then 'OK' when ok is null and detail like 'SAUTÉ%' then 'SAUTÉ' else 'ÉCHEC' end as "résultat", test, detail
  from t_res order by n;
do $t$
declare total int; bons int; sautes int; rates text;
begin
  select count(*), count(*) filter (where ok), count(*) filter (where ok is null and detail like 'SAUTÉ%'),
         string_agg(n || ' ' || test || ' [' || coalesce(detail, 'sans réponse') || ']', ' | ' order by n)
           filter (where ok is not true and not (ok is null and detail like 'SAUTÉ%'))
    into total, bons, sautes, rates from t_res;
  raise exception 'v78 : % / % tests OK, % sauté(s)%. Annulation forcée : rien n''est gardé.',
    bons, total - sautes, sautes, coalesce(' — ÉCHECS : ' || rates, ' — aucun échec');
end $t$;
-- <<<<< fin des corps : tout ce qui précède est annulé <<<<<
rollback;
