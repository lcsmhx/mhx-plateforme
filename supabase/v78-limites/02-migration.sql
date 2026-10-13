-- =====================================================================================================================
-- v78 — LIMITES D'ÉCRITURE (lot 2 de la v66) — PROJET, NON APPLIQUÉ (préparé la nuit du 12/10/2026).
-- À appliquer seulement avec Lucas, dans l'ordre de supabase/v78-limites/LISEZMOI.md (relevé 01 d'abord, sauvegarde,
-- tests 04 verts sur un Postgres local). Jamais sans son « ok ».
-- Application : ce fichier TEL QUEL dans l'éditeur SQL de Supabase (il ouvre et ferme lui-même sa transaction). Pas par
-- apply_migration (l'outil peut ajouter sa propre transaction autour et note une ligne d'historique : sa réponse peut
-- tromper) ; dans tous les cas, on ne juge que sur 05-verifications.sql. La répétition (tout annulé) est
-- 06-repetition.sql, jamais un morceau de ce fichier.
--
-- NON DESTRUCTIVE : aucune ligne n'est modifiée ni supprimée, aucune règle RLS, aucune fonction existante, aucune colonne
-- n'est touchée (ni DROP, ni DELETE, ni TRUNCATE, ni UPDATE). Elle AJOUTE seulement cinq objets, tous nommés « v78_ » :
--   1. public.v78_limite(outil, prospect)  la taille maximale d'une clé (octets du JSON tel que la base l'écrit,
--                                          octet_length(contenu::text)) ; null = clé inconnue ;
--   2. public.v78_donnees_limites()        la fonction du déclencheur ;
--   3. le déclencheur v78_donnees_limites  BEFORE INSERT OR UPDATE sur public.donnees : refuse (erreur 23514,
--                                          check_violation, HTTP 400 côté app) une clé inconnue ou un contenu trop gros ;
--   4. deux contraintes CHECK de profils   v78_profils_prenom_longueur et v78_profils_nom_longueur : 100 caractères au plus
--                                          (ajoutées NOT VALID, puis VALIDATE : la base vérifie elle-même les lignes déjà là).
-- Les règles :
--   * clé : seulement les 29 clés que l'app écrit (inventaire : supabase/releve-2026-09-30/INVENTAIRE-CLES.md) ;
--   * taille : une limite par clé, pour tout le monde (coach, client, clé de service, éditeur SQL) ; en plus, un compte
--     PROSPECT (connecté, ni coach ni client : l'inscription libre) écrit 256 Ko au plus par clé ;
--   * une ligne qui existe déjà et dépasse sa limite (cas qui ne peut pas exister le jour J : les garde-fous ci-dessous
--     arrêtent tout si une ligne dépasse le QUART de sa limite) reste lisible et peut toujours être réécrite SANS GROSSIR
--     (même taille ou plus petite) ; elle ne peut plus grossir ;
--   * lecture : rien ne change (aucune règle de lecture n'est touchée).
-- Ce que voit l'app quand la base refuse : Store.envoyer garde la modification sur l'appareil (« mhx_refus|… ») et
-- affiche « Non enregistré : la base a refusé cette modification. Préviens ton coach. » (rien n'est perdu sur l'appareil).
--
-- Une transaction : si une étape échoue (garde-fou, verrou attendu plus de 5 s, contrôle final), RIEN n'est appliqué.
-- Idempotente : relancée, elle remplace les deux fonctions et le déclencheur à l'identique et saute les contraintes déjà là.
-- Retour arrière : 03-retour.sql (retire ces cinq objets, rien d'autre). Tests : 04-tests.sql. Vérifications : 05.
-- Postgres 14 au moins (CREATE OR REPLACE TRIGGER) ; Supabase est en 15 ou 17.
-- =====================================================================================================================
begin;
set local lock_timeout = '5s';          -- un verrou attendu plus de 5 s : on abandonne (rien n'est appliqué), on réessaie
set local statement_timeout = '120s';

-- ---------- DÉBUT DU CORPS (recopié tel quel dans 06-repetition.sql, la répétition : ne rien recopier à la main) ----------

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
                   when 'seances_formation' then 262144   -- 256 Ko : séances faites des programmes de la formation (v90), 400 au plus (~36 Ko : marge ×7)
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

-- ---------- FIN DU CORPS ----------
commit;
