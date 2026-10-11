\set ON_ERROR_STOP on
-- =====================================================================================================================
-- v78 — SOCLE DE TEST — POUR POSTGRES LOCAL SEULEMENT, JAMAIS SUR LA VRAIE BASE.
-- =====================================================================================================================
-- Recrée, dans une base locale VIDE nommée mhx_v78_local, le minimum de Supabase dont 04-tests.sql a besoin : rôles anon /
-- authenticated / service_role, schéma auth (auth.users, auth.uid() et auth.role() qui lisent request.jwt.claims), tables
-- profils et donnees, fonctions est_coach(), est_client(), creer_profil(), protege_role() et leurs déclencheurs, règles RLS
-- de profils et donnees. Texte des fonctions et des règles : l'état relevé sur la vraie base le 29/09/2026 (sauvegarde
-- hors dépôt 2026-09-29-avant-v56, « schema_avant ») = docs/HANDOFF-CLAUDE-CODE.md §2.3 ; droits copiés de ce relevé.
-- Ce socle est une IMITATION : colonnes réduites à ce que les tests utilisent ; la vraie base fait foi (relevé 01).
--
-- PAS ENCORE LANCÉ (12/10/2026) : ni Docker ni Postgres sur le Mac cette nuit. À lancer demain, sur un Postgres 15 ou 17 :
--   createdb mhx_v78_local
--   psql -d mhx_v78_local -f 00-socle-local.sql
--   psql -d mhx_v78_local -f 02-migration.sql
--   psql -d mhx_v78_local -f 04-tests.sql
-- Pour recommencer à zéro : dropdb mhx_v78_local (base locale de test seulement), puis les quatre lignes ci-dessus.
--
-- Trois garde-fous (le premier suffit) : la commande « \set » de la 1re ligne n'existe que dans psql (l'éditeur SQL de
-- Supabase refuse tout le fichier) ; la base doit s'appeler mhx_v78_local ; aucun rôle ni schéma de Supabase ne doit
-- exister. Ce fichier ne crée que des objets dans cette base (et trois rôles sans connexion, s'ils manquent au serveur).
-- =====================================================================================================================
begin;

do $$
begin
  if current_database() <> 'mhx_v78_local' then
    raise exception 'STOP : socle LOCAL seulement — base « % » refusée (créer une base vide : createdb mhx_v78_local)', current_database();
  end if;
  if exists (select 1 from pg_roles where rolname in ('supabase_admin', 'supabase_auth_admin', 'authenticator', 'supabase_storage_admin')) then
    raise exception 'STOP : des rôles de Supabase existent sur ce serveur : ce n''est pas un Postgres local nu';
  end if;
  if to_regnamespace('auth') is not null or to_regclass('public.donnees') is not null or to_regclass('public.profils') is not null then
    raise exception 'STOP : la base n''est pas vide (schéma auth ou tables déjà là) : repartir d''une base neuve (dropdb / createdb mhx_v78_local)';
  end if;
end $$;

-- ---------- rôles (communs à tout le serveur local ; sans mot de passe ni connexion) ----------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin noinherit; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin noinherit bypassrls; end if;
end $$;

-- ---------- schéma auth ----------
create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  id                 uuid primary key,
  instance_id        uuid,
  aud                varchar(255),
  role               varchar(255),
  email              varchar(255),
  raw_user_meta_data jsonb,
  created_at         timestamptz,
  updated_at         timestamptz
);

-- comme Supabase : le compte et le rôle viennent du jeton (request.jwt.claims), posé par les tests avec set_config(…, true)
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid
$$;
create function auth.role() returns text language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'))::text
$$;
grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;

-- ---------- tables de public ----------
create table public.profils (
  id      uuid primary key references auth.users (id) on delete cascade,
  prenom  text,
  nom     text,
  role    text not null default 'client',
  cree_le timestamptz default now(),
  statut  text not null default 'prospect',
  constraint profils_statut_valeurs check (statut in ('prospect', 'client'))
);
create table public.donnees (
  user_id uuid not null references auth.users (id) on delete cascade,
  outil   text not null,
  contenu jsonb,
  maj_le  timestamptz default now(),
  primary key (user_id, outil)          -- l'upsert de l'app : on_conflict=user_id,outil
);

-- ---------- fonctions (texte exact relevé le 29/09/2026) ----------
create or replace function public.est_coach()
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select exists (
    select 1 from public.profils
    where id = auth.uid() and role = 'coach'
  );
$function$;

create or replace function public.est_client()
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select exists (
    select 1 from public.profils
    where id = auth.uid() and role = 'client' and statut = 'client'
  );
$function$;

create or replace function public.creer_profil()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  insert into public.profils (id, prenom, nom)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'prenom', ''),
    coalesce(new.raw_user_meta_data->>'nom', '')
  );
  return new;
end;
$function$;

create or replace function public.protege_role()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  /* le role et le statut ne changent que par un coach, ou cote serveur avec la
     cle de service (fonctions creer-acces / supprimer-acces) : jamais par le
     compte lui-meme, sinon un prospect se passerait « client » par l'API */
  if (new.role is distinct from old.role or new.statut is distinct from old.statut)
     and not est_coach()
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Seul un coach peut changer un rôle ou un statut.';
  end if;
  return new;
end;
$function$;

-- droits d'exécution relevés le 29/09 : est_coach / est_client pour authenticated et service_role (pas anon) ;
-- creer_profil / protege_role pour service_role seulement (un déclencheur s'exécute sans ce droit)
revoke all on function public.est_coach(), public.est_client(), public.creer_profil(), public.protege_role() from public;
grant execute on function public.est_coach(), public.est_client() to authenticated, service_role;
grant execute on function public.creer_profil(), public.protege_role() to service_role;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.creer_profil();
create trigger profils_protege_role before update on public.profils for each row execute function public.protege_role();

-- ---------- droits et règles RLS (texte exact depuis la v49, relevé le 29/09/2026) ----------
grant usage on schema public to anon, authenticated, service_role;
grant all on table public.profils, public.donnees to anon, authenticated, service_role;   -- comme Supabase : la RLS filtre
alter table public.profils enable row level security;
alter table public.donnees enable row level security;

create policy "profil lisible par son proprietaire ou le coach" on public.profils
  for select using (((( select auth.uid()) = id) or ( select public.est_coach())));
create policy "profil modifiable par son proprietaire ou le coach" on public.profils
  for update using (((( select auth.uid()) = id) or ( select public.est_coach())));

create policy "donnees lisibles par leur proprietaire ou le coach" on public.donnees
  for select using ((((( select auth.uid()) = user_id) and (outil <> all (array['notes_coach'::text, 'suivi_prospect'::text]))) or ( select public.est_coach())));
create policy "donnees creees par leur proprietaire" on public.donnees
  for insert with check (((( select auth.uid()) = user_id) and (outil <> all (array['feedbacks'::text, 'notes_coach'::text, 'suivi_prospect'::text]))));
create policy "donnees modifiees par leur proprietaire" on public.donnees
  for update using (((( select auth.uid()) = user_id) and (outil <> all (array['feedbacks'::text, 'notes_coach'::text, 'suivi_prospect'::text]))));
create policy "donnees supprimees par leur proprietaire" on public.donnees
  for delete using (((( select auth.uid()) = user_id) and (outil <> all (array['feedbacks'::text, 'notes_coach'::text, 'suivi_prospect'::text]))));
create policy "le coach cree dans la fiche client" on public.donnees
  for insert to authenticated
  with check ((( select public.est_coach()) and (outil = any (array['programme'::text, 'repas'::text, 'calc'::text, 'complements'::text, 'hist_programme'::text, 'hist_repas'::text, 'feedbacks'::text, 'notes_coach'::text, 'suivi_prospect'::text]))));
create policy "le coach modifie la fiche client" on public.donnees
  for update to authenticated
  using ((( select public.est_coach()) and (outil = any (array['programme'::text, 'repas'::text, 'calc'::text, 'complements'::text, 'hist_programme'::text, 'hist_repas'::text, 'feedbacks'::text, 'notes_coach'::text, 'suivi_prospect'::text]))))
  with check ((( select public.est_coach()) and (outil = any (array['programme'::text, 'repas'::text, 'calc'::text, 'complements'::text, 'hist_programme'::text, 'hist_repas'::text, 'feedbacks'::text, 'notes_coach'::text, 'suivi_prospect'::text]))));

commit;
-- Suite : psql -d mhx_v78_local -f 02-migration.sql, puis -f 04-tests.sql
