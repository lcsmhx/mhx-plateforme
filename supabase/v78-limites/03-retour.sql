-- =====================================================================================================================
-- v78 — RETOUR ARRIÈRE des limites d'écriture (02-migration.sql). PROJET, préparé le 12/10/2026.
-- Retire SEULEMENT les cinq objets que la migration v78 a ajoutés (tous nommés « v78_ ») :
--   le déclencheur v78_donnees_limites, les fonctions public.v78_donnees_limites() et public.v78_limite(text, boolean),
--   les contraintes v78_profils_prenom_longueur et v78_profils_nom_longueur.
-- AUCUNE LIGNE n'est lue, modifiée ni supprimée ; aucune règle RLS, aucune autre fonction, aucune colonne n'est touchée.
-- Les DROP … IF EXISTS ci-dessous ne visent que des objets créés par la v78 (vérifié d'abord par leur commentaire « v78 : ») ;
-- jamais de CASCADE. Après ce fichier, la base est exactement comme avant la v78 : l'app n'a rien à changer.
--
-- Arrêt d'urgence plus léger, SANS RIEN SUPPRIMER (une ligne, réversible) :
--     alter table public.donnees disable trigger v78_donnees_limites;   -- les limites de donnees ne s'appliquent plus
--     alter table public.donnees enable trigger v78_donnees_limites;    -- pour les remettre
--   (les contraintes de prénom et nom restent : elles ne refusent qu'un prénom ou un nom de plus de 100 caractères).
-- =====================================================================================================================
begin;
set local lock_timeout = '5s';

-- 0. Garde-fous : on ne retire que ce qui porte la marque de la v78 ; empreinte des règles RLS avant
do $$
begin
  if to_regprocedure('public.v78_limite(text, boolean)') is not null
     and coalesce(obj_description('public.v78_limite(text, boolean)'::regprocedure, 'pg_proc'), '') not like 'v78 :%' then
    raise exception 'v78 retour : STOP — public.v78_limite(text, boolean) n''est pas celle de la v78 (commentaire) : rien n''est retiré';
  end if;
  if to_regprocedure('public.v78_donnees_limites()') is not null
     and coalesce(obj_description('public.v78_donnees_limites()'::regprocedure, 'pg_proc'), '') not like 'v78 :%' then
    raise exception 'v78 retour : STOP — public.v78_donnees_limites() n''est pas celle de la v78 (commentaire) : rien n''est retiré';
  end if;
  if exists (select 1 from pg_constraint c
              where c.conrelid = 'public.profils'::regclass and c.conname in ('v78_profils_prenom_longueur', 'v78_profils_nom_longueur')
                and coalesce(obj_description(c.oid, 'pg_constraint'), '') not like 'v78 :%') then
    raise exception 'v78 retour : STOP — une contrainte v78_profils_… ne porte pas le commentaire de la v78 : rien n''est retiré';
  end if;
  perform set_config('v78.regles_avant', coalesce((
    select md5(string_agg(policyname || ':' || coalesce(qual, '') || '|' || coalesce(with_check, ''), ',' order by schemaname, tablename, policyname))
      from pg_policies where schemaname in ('public', 'storage')), ''), true);
end $$;

-- 1. Le déclencheur d'abord (la fonction ne se retire pas tant qu'il l'utilise : pas de CASCADE)
drop trigger if exists v78_donnees_limites on public.donnees;
drop function if exists public.v78_donnees_limites();
drop function if exists public.v78_limite(text, boolean);

-- 2. Les deux contraintes de longueur de profils
alter table public.profils drop constraint if exists v78_profils_prenom_longueur;
alter table public.profils drop constraint if exists v78_profils_nom_longueur;

-- 3. Contrôle : plus rien de la v78, règles RLS identiques
do $$
begin
  if exists (select 1 from pg_trigger where tgrelid = 'public.donnees'::regclass and tgname = 'v78_donnees_limites')
     or to_regprocedure('public.v78_donnees_limites()') is not null
     or to_regprocedure('public.v78_limite(text, boolean)') is not null
     or exists (select 1 from pg_constraint where conrelid = 'public.profils'::regclass and conname like 'v78\_%') then
    raise exception 'v78 retour : STOP — un objet de la v78 est encore là : rien n''est retiré';
  end if;
  if coalesce((select md5(string_agg(policyname || ':' || coalesce(qual, '') || '|' || coalesce(with_check, ''), ',' order by schemaname, tablename, policyname))
                 from pg_policies where schemaname in ('public', 'storage')), '') <> current_setting('v78.regles_avant') then
    raise exception 'v78 retour : STOP — les règles RLS ont changé : rien n''est retiré';
  end if;
end $$;

commit;
-- Après : relancer 01-releve-agregats.sql ; les empreintes (règles, fonctions sans « v78_ », lignes) doivent être celles
-- du relevé « avant » (aux écritures de l'app près, voir LISEZMOI), et la partie G ne doit plus montrer d'objet v78.
