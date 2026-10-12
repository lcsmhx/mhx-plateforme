-- =====================================================================================================================
-- v79 — TESTS des règles d'accès autour de la clé « journal_alimentaire » (journal alimentaire), sur la vraie base.
--
-- TOUJOURS DANS UNE TRANSACTION ANNULÉE (begin … rollback, et une erreur voulue juste avant) : rien de ce que fait ce
-- fichier n'est gardé. Comptes : trois comptes FICTIFS créés dans la transaction (un client « de test », un coach, un
-- prospect ; adresses @exemple.invalid), annulés avec elle. Aucun vrai compte n'est lu ni écrit. Le 13/10/2026, l'ancien
-- compte client de test (9df6bb84…) n'existait plus en base : le client « de test » est donc fictif lui aussi.
-- Contenus marqués « test_v79 : s9999 ». Rôles simulés comme dans supabase/v78-limites/04-tests.sql :
-- SET LOCAL ROLE anon / authenticated + request.jwt.claims.
--
-- Ce qu'on vérifie (règles RLS du 26/09, inchangées : HANDOFF §2.3) :
--   le client de test écrit et relit son journal ; il écrit toujours une clé existante (mens) ;
--   un autre compte ne lit, n'écrit ni ne modifie son journal ; il peut tenir le sien ;
--   le coach lit le journal du client de test (et celui d'un prospect) mais ne l'écrit pas ; l'anonyme ne lit rien.
-- Résultat attendu, en erreur VOULUE à la fin : « v79 : 15 / 15 tests OK — aucun échec. Annulation forcée : rien n'est gardé. »
-- Lancé le 13/10/2026 (execute_sql, refus levé par Lucas pour la séance) : résultat dans le LISEZMOI de ce dossier.
-- =====================================================================================================================
begin;

create temp table t_res (n int, test text, ok boolean, detail text) on commit drop;
grant all on t_res to anon, authenticated;

-- lance une requête avec les droits du moment et range le résultat : ok, zero, droits, erreur …
create function pg_temp.essai(p_n int, p_test text, p_sql text, p_attendu text) returns void language plpgsql as $f$
declare v_n bigint; v_etat text; v_msg text;
begin
  begin
    execute p_sql;
    get diagnostics v_n = row_count;
    v_etat := case when v_n = 0 then 'zero' else 'ok' end;
    v_msg := v_n || ' ligne(s)';
  exception
    when insufficient_privilege then v_etat := 'droits'; v_msg := sqlerrm;
    when others then v_etat := 'erreur ' || sqlstate; v_msg := sqlerrm;
  end;
  insert into t_res values (p_n, p_test, v_etat = any (string_to_array(p_attendu, '|')),
    'attendu ' || p_attendu || ' · obtenu ' || v_etat || ' (' || left(coalesce(v_msg, ''), 160) || ')');
end $f$;
-- écrire comme l'app : upsert (POST on_conflict=user_id,outil, resolution=merge-duplicates)
create function pg_temp.ecrire(p_n int, p_test text, p_compte text, p_cle text, p_attendu text) returns void language plpgsql as $f$
begin
  perform pg_temp.essai(p_n, p_test, format(
    'insert into public.donnees (user_id, outil, contenu, maj_le) values (%L::uuid, %L, %L::jsonb, now()) '
    || 'on conflict (user_id, outil) do update set contenu = excluded.contenu, maj_le = excluded.maj_le',
    current_setting(p_compte), p_cle,
    '{"test_v79":"s9999","v":1,"a":[["poulet-blanc-grille",165,31,0,3.6,"Blanc de poulet"]],"j":{"2026-10-13":[[1,0,150],[3,-1,250]]}}'), p_attendu);
end $f$;
-- modifier comme un PATCH : UPDATE d'une ligne existante
create function pg_temp.modifier(p_n int, p_test text, p_compte text, p_cle text, p_attendu text) returns void language plpgsql as $f$
begin
  perform pg_temp.essai(p_n, p_test, format(
    'update public.donnees set contenu = contenu || ''{"test_v79":"s9999"}''::jsonb, maj_le = now() where user_id = %L::uuid and outil = %L',
    current_setting(p_compte), p_cle), p_attendu);
end $f$;
-- compter ce que le rôle du moment peut lire
create function pg_temp.lues(p_compte text, p_cle text) returns bigint language sql as $f$
  select count(*) from public.donnees where user_id = current_setting(p_compte)::uuid and outil = p_cle and contenu ->> 'test_v79' = 's9999'
$f$;
grant execute on function pg_temp.essai(int, text, text, text), pg_temp.ecrire(int, text, text, text, text),
  pg_temp.modifier(int, text, text, text, text), pg_temp.lues(text, text) to anon, authenticated;

do $t$
begin
  perform set_config('t.test',     '00000000-0000-4000-8000-0000000079a1', true);   -- fictif (client « de test »)
  perform set_config('t.coach',    '00000000-0000-4000-8000-0000000079c0', true);   -- fictif
  perform set_config('t.prospect', '00000000-0000-4000-8000-0000000079b1', true);   -- fictif
  if exists (select 1 from auth.users where id in (current_setting('t.test')::uuid, current_setting('t.coach')::uuid, current_setting('t.prospect')::uuid)) then
    raise exception 'v79 tests : identifiants fictifs déjà pris, arrêt';
  end if;
end $t$;

-- ---------- décor : un client, un coach et un prospect fictifs (creer_profil pose leur profil) ----------
insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at) values
  (current_setting('t.test')::uuid,     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'client-fictif-v79@exemple.invalid',   '{"prenom":"Client fictif v79"}', now(), now()),
  (current_setting('t.coach')::uuid,    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'coach-fictif-v79@exemple.invalid',    '{"prenom":"Coach fictif v79"}', now(), now()),
  (current_setting('t.prospect')::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'prospect-fictif-v79@exemple.invalid', '{"prenom":"Prospect fictif v79"}', now(), now());
do $t$
begin
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);   -- comme creer-acces : protege_role l'accepte
  update public.profils set role = 'coach', statut = 'client' where id = current_setting('t.coach')::uuid;
  update public.profils set statut = 'client' where id = current_setting('t.test')::uuid;
  perform set_config('request.jwt.claims', '', true);
end $t$;
insert into t_res select 0, 'décor : client, coach et prospect fictifs en place, aucune ligne de donnees pour eux',
  (select count(*) from public.profils where id = current_setting('t.test')::uuid and role = 'client' and statut = 'client') = 1
  and (select count(*) from public.profils where id = current_setting('t.coach')::uuid and role = 'coach') = 1
  and (select count(*) from public.profils where id = current_setting('t.prospect')::uuid and role = 'client' and statut = 'prospect') = 1
  and not exists (select 1 from public.donnees where user_id in (current_setting('t.test')::uuid, current_setting('t.coach')::uuid, current_setting('t.prospect')::uuid)), null;

-- ---------- A. le client « de test » (fictif) ----------
set local role authenticated;
do $t$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', current_setting('t.test'), 'role', 'authenticated')::text, true);
  perform pg_temp.ecrire(1, 'client de test : écrit son journal_alimentaire (upsert comme l''app)', 't.test', 'journal_alimentaire', 'ok');
  insert into t_res select 2, 'client de test : relit son journal_alimentaire', pg_temp.lues('t.test', 'journal_alimentaire') = 1, null;
  perform pg_temp.ecrire(3, 'client de test : le réécrit (2e upsert, ligne déjà là)', 't.test', 'journal_alimentaire', 'ok');
  perform pg_temp.ecrire(4, 'client de test : écrit toujours une clé existante (mens)', 't.test', 'mens', 'ok');
  insert into t_res select 5, 'client de test : relit sa clé mens', pg_temp.lues('t.test', 'mens') = 1, null;
end $t$;

-- ---------- B. un autre compte (prospect fictif) ----------
do $t$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', current_setting('t.prospect'), 'role', 'authenticated')::text, true);
  insert into t_res select 6, 'autre compte : ne lit pas le journal du client de test', pg_temp.lues('t.test', 'journal_alimentaire') = 0, null;
  perform pg_temp.ecrire(7, 'autre compte : n''écrit pas dans le journal du client de test', 't.test', 'journal_alimentaire', 'droits');
  perform pg_temp.modifier(8, 'autre compte : ne modifie pas le journal du client de test', 't.test', 'journal_alimentaire', 'zero');
  perform pg_temp.ecrire(9, 'prospect : tient son propre journal_alimentaire', 't.prospect', 'journal_alimentaire', 'ok');
end $t$;

-- ---------- C. le coach (fictif) ----------
do $t$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', current_setting('t.coach'), 'role', 'authenticated')::text, true);
  insert into t_res select 10, 'coach : lit le journal du client de test', pg_temp.lues('t.test', 'journal_alimentaire') = 1, null;
  insert into t_res select 11, 'coach : lit le journal d''un prospect', pg_temp.lues('t.prospect', 'journal_alimentaire') = 1, null;
  perform pg_temp.modifier(12, 'coach : ne modifie pas le journal du client de test (lecture seule)', 't.test', 'journal_alimentaire', 'zero');
end $t$;

-- ---------- D. l'anonyme ----------
reset role;
set local role anon;
do $t$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform pg_temp.essai(13, 'anonyme : ne lit aucun journal_alimentaire',
    'select 1 from public.donnees where outil = ''journal_alimentaire''', 'zero|droits');
end $t$;

-- ---------- E. rien d'autre n'a été écrit ----------
reset role;
do $t$ begin perform set_config('request.jwt.claims', '', true); end $t$;
insert into t_res select 14, 'contrôle : les lignes marquées « test_v79 » sont celles des comptes fictifs',
  not exists (select 1 from public.donnees where contenu ->> 'test_v79' = 's9999'
               and user_id not in (current_setting('t.test')::uuid, current_setting('t.coach')::uuid, current_setting('t.prospect')::uuid)), null;

-- ---------- le résultat, puis l'annulation forcée de tout ce qui précède ----------
do $t$
declare total int; bons int; rates text;
begin
  select count(*), count(*) filter (where ok),
         string_agg(n || ' ' || test || ' [' || coalesce(detail, 'sans réponse') || ']', ' | ' order by n) filter (where ok is not true)
    into total, bons, rates from t_res;
  raise exception 'v79 : % / % tests OK%. Annulation forcée : rien n''est gardé.',
    bons, total, coalesce(' — ÉCHECS : ' || rates, ' — aucun échec');
end $t$;
rollback;
