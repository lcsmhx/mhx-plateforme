-- =====================================================================================================================
-- v78 — RELEVÉ EN AGRÉGATS, LECTURE SEULE, sur la vraie base (avant la migration, et pour le comptage « avant »).
-- Préparé le 12/10/2026 ; PAS ENCORE LANCÉ (refus execute_sql cette nuit). À coller tel quel dans l'éditeur SQL de
-- Supabase (ou à lancer pendant la séance, si Lucas lève le refus execute_sql) : UNE SEULE requête SELECT, qui ne peut
-- rien écrire ; un seul tableau de résultat (exportable en CSV), à ranger hors dépôt avec la sauvegarde du jour.
--
-- AUCUNE DONNÉE DE CLIENT : que des nombres de lignes, des tailles (octets, caractères), des noms de clés, des noms
-- d'objets de la base et des empreintes md5 (une empreinte ne permet pas de retrouver le contenu). Ni identifiant de
-- compte, ni email, ni prénom, ni contenu. Seule exception possible : le nom d'une clé INCONNUE (écrite hors de l'app par
-- l'API), coupé à 40 caractères ; elle doit être absente.
--
-- Ce qu'on attend pour appliquer la migration (dernière ligne, « Z bilan / verdict » = « OK pour appliquer ») :
--   A  par clé : aucune clé hors liste, aucune ligne au-dessus de sa limite, ni du QUART de sa limite (marge ≥ ×4) ;
--   B  comptes prospects : pareil avec le plafond prospect (256 Ko) ;
--   D  prénoms et noms : aucun au-dessus de 100 caractères ;
--   H  pré-requis : est_coach / est_client en place, Postgres ≥ 14, clé unique (user_id, outil).
-- Une ligne « STOP » = on n'applique pas ; on relève la limite concernée dans 02-migration.sql (et 04, 05, ce fichier :
-- les quatre listes sont identiques), on relance les tests locaux, puis ce relevé.
-- Les limites ci-dessous : celles de public.v78_limite() (02-migration.sql) ; détail et raisons : INVENTAIRE-CLES.md.
-- =====================================================================================================================
with
limites (outil, limite) as (values
  ('hist_repas', 16777216), ('hist_programme', 8388608), ('journal', 4194304), ('perf', 4194304), ('checkins', 2097152),
  ('repas', 1048576), ('feedbacks', 1048576), ('programme', 524288), ('atelier', 524288), ('mens', 524288),
  ('formation', 524288), ('photos', 524288), ('notes_coach', 524288), ('intake', 262144), ('complements', 131072),
  ('repas_suivi', 131072), ('challenge', 131072), ('suivi_prospect', 131072), ('activite', 65536), ('calc', 16384),
  ('calc_perso', 16384), ('objectifs_faits', 16384), ('prefs', 16384), ('emails', 16384), ('contact', 16384),
  ('coach_notifs', 16384), ('coach_visite', 16384)),
cles_coach (outil) as (values ('programme'), ('repas'), ('calc'), ('complements'), ('hist_programme'), ('hist_repas'),
                              ('feedbacks'), ('notes_coach'), ('suivi_prospect')),   -- écrites par le coach dans une fiche
t as (
  select d.user_id, d.outil, d.maj_le, d.contenu,
         coalesce(octet_length(d.contenu::text), 0)::bigint as taille,
         case when p.id is null then 'sans profil'
              when p.role = 'coach' then 'coach'
              when p.role = 'client' and p.statut = 'client' then 'client'
              else 'prospect' end as compte
    from public.donnees d left join public.profils p on p.id = d.user_id
),
a as (
  select coalesce(t.outil, l.outil) as outil, count(t.outil) as lignes, max(t.taille) as mx,
         round(avg(t.taille))::bigint as moy, percentile_disc(0.95) within group (order by t.taille) as p95,
         max(l.limite)::bigint as limite,
         md5(string_agg(t.user_id::text || '|' || coalesce(extract(epoch from t.maj_le)::text, '') || '|' || md5(coalesce(t.contenu::text, '')),
                        ',' order by t.user_id)) as empreinte
    from t full join limites l on l.outil = t.outil
   group by coalesce(t.outil, l.outil)
),
b as (
  select t.outil, count(*) as lignes, max(t.taille) as mx, round(avg(t.taille))::bigint as moy,
         percentile_disc(0.95) within group (order by t.taille) as p95,
         case when max(l.limite) is null then null else least(max(l.limite), 262144) end::bigint as limite
    from t left join limites l on l.outil = t.outil
   where t.compte = 'prospect' and t.outil not in (select outil from cles_coach)
   group by t.outil
),
r (partie, element, lignes, octets_max, octets_moyen, octets_p95, limite, marge, verdict, detail) as (
  -- A. par clé, tous comptes (la marge = limite / taille de la plus grosse ligne)
  select 'A donnees par clé'::text, left(a.outil, 40)::text, a.lignes, a.mx, a.moy, a.p95, a.limite,
         round(a.limite::numeric / nullif(a.mx, 0), 1),
         case when a.limite is null then 'STOP : clé hors de la liste'
              when a.mx > a.limite then 'STOP : au-dessus de la limite'
              when a.mx > a.limite / 4 then 'STOP : marge sous ×4 (relever la limite)'
              when a.lignes = 0 then 'OK (aucune ligne)'
              else 'OK' end,
         'empreinte ' || coalesce(a.empreinte, '—')
    from a
  union all
  -- B. lignes des comptes prospects (hors clés écrites par le coach), face au plafond prospect
  select 'B donnees des prospects', left(b.outil, 40), b.lignes, b.mx, b.moy, b.p95, b.limite,
         round(b.limite::numeric / nullif(b.mx, 0), 1),
         case when b.limite is null then 'STOP : clé hors de la liste'
              when b.mx > b.limite then 'STOP : au-dessus du plafond prospect'
              when b.mx > b.limite / 4 then 'STOP : marge sous ×4 (relever le plafond)'
              else 'OK' end,
         'plafond prospect 262144 octets par clé'
    from b
  union all
  -- C. par catégorie de compte (propriétaire de la ligne)
  select 'C donnees par compte', t.compte, count(*), max(t.taille), round(avg(t.taille))::bigint,
         percentile_disc(0.95) within group (order by t.taille), null::bigint, null::numeric, 'INFO',
         'total ' || sum(t.taille) || ' octets'
    from t group by t.compte
  union all
  -- D. profils : comptes par rôle et statut ; longueur des prénoms et des noms (caractères)
  select 'D profils', 'comptes ' || coalesce(role, '?') || ' / ' || coalesce(statut, '?'), count(*), null::bigint, null::bigint,
         null::bigint, null::bigint, null::numeric, 'INFO', null::text
    from public.profils group by role, statut
  union all
  select 'D profils', 'prénom (caractères)', count(*), max(char_length(prenom))::bigint, round(avg(char_length(prenom)))::bigint,
         (percentile_disc(0.95) within group (order by char_length(prenom)))::bigint, 100::bigint,
         round(100::numeric / nullif(max(char_length(prenom)), 0), 1),
         case when max(char_length(prenom)) > 100 then 'STOP : au-dessus de 100 caractères' else 'OK' end,
         'au-dessus de 60 (le maximum de l''app à l''inscription) : ' || count(*) filter (where char_length(prenom) > 60)
    from public.profils
  union all
  select 'D profils', 'nom (caractères)', count(*), max(char_length(nom))::bigint, round(avg(char_length(nom)))::bigint,
         (percentile_disc(0.95) within group (order by char_length(nom)))::bigint, 100::bigint,
         round(100::numeric / nullif(max(char_length(nom)), 0), 1),
         case when max(char_length(nom)) > 100 then 'STOP : au-dessus de 100 caractères' else 'OK' end,
         'au-dessus de 60 : ' || count(*) filter (where char_length(nom) > 60)
    from public.profils
  union all
  -- E. forme des contenus (l'app lit un contenu qui n'est pas un objet comme absent : information seulement)
  select 'E contenu', 'contenu NULL', count(*) filter (where contenu is null), null::bigint, null::bigint, null::bigint,
         null::bigint, null::numeric, 'INFO', null::text from t
  union all
  select 'E contenu', 'contenu qui n''est pas un objet JSON', count(*) filter (where contenu is not null and jsonb_typeof(contenu) <> 'object'),
         null::bigint, null::bigint, null::bigint, null::bigint, null::numeric, 'INFO', null::text from t
  union all
  -- F. place occupée (plan gratuit : 500 Mo de base)
  select 'F base', 'taille de la base', null::bigint, pg_database_size(current_database()), null::bigint, null::bigint,
         524288000::bigint, round(524288000::numeric / nullif(pg_database_size(current_database()), 0), 1), 'INFO',
         pg_size_pretty(pg_database_size(current_database()))
  union all
  select 'F base', 'table donnees (index et TOAST compris)', (select count(*) from public.donnees), pg_total_relation_size('public.donnees'),
         null::bigint, null::bigint, null::bigint, null::numeric, 'INFO', pg_size_pretty(pg_total_relation_size('public.donnees'))
  union all
  -- G. structure et empreintes « avant » (à comparer avec 05-verifications.sql après la migration)
  select 'G structure', 'empreinte des règles RLS (public, storage)', count(*), null::bigint, null::bigint, null::bigint, null::bigint,
         null::numeric, 'INFO',
         coalesce(md5(string_agg(policyname || ':' || coalesce(qual, '') || '|' || coalesce(with_check, ''), ',' order by schemaname, tablename, policyname)), '')
    from pg_policies where schemaname in ('public', 'storage')
  union all
  select 'G structure', 'règles RLS de donnees et profils', count(*), null::bigint, null::bigint, null::bigint, null::bigint, null::numeric,
         case when count(*) filter (where tablename = 'donnees') = 6 and count(*) filter (where tablename = 'profils') = 2
              then 'OK (6 + 2, comme au 29/09)' else 'À REGARDER : pas 6 + 2 (comparer au HANDOFF §2.3)' end,
         string_agg(tablename || ':' || cmd || ':' || policyname, ' ; ' order by tablename, cmd, policyname)
    from pg_policies where schemaname = 'public' and tablename in ('donnees', 'profils')
  union all
  select 'G structure', 'empreinte des fonctions de public (hors v78_)', count(*), null::bigint, null::bigint, null::bigint, null::bigint,
         null::numeric, 'INFO', coalesce(md5(string_agg(pg_get_functiondef(p.oid), ',' order by p.proname, p.oid)), '')
    from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prokind in ('f', 'p') and p.proname !~ '^v78_'
  union all
  select 'G structure', 'déclencheurs de donnees et profils', count(*), null::bigint, null::bigint, null::bigint, null::bigint, null::numeric,
         'INFO', string_agg(tg.tgrelid::regclass::text || ':' || tg.tgname || ':' || tg.tgenabled, ' ; ' order by tg.tgrelid::regclass::text, tg.tgname)
    from pg_trigger tg where not tg.tgisinternal and tg.tgrelid in ('public.donnees'::regclass, 'public.profils'::regclass)
  union all
  select 'G structure', 'contraintes de donnees et profils', count(*), null::bigint, null::bigint, null::bigint, null::bigint, null::numeric,
         'INFO', string_agg(c.conrelid::regclass::text || ':' || c.conname || ':' || c.contype, ' ; ' order by c.conrelid::regclass::text, c.conname)
    from pg_constraint c where c.conrelid in ('public.donnees'::regclass, 'public.profils'::regclass)
  union all
  select 'G structure', 'objets v78 déjà là (fonctions, déclencheurs, contraintes)',
         (select count(*) from pg_proc where pronamespace = 'public'::regnamespace and proname ~ '^v78_')
         + (select count(*) from pg_trigger where tgname ~ '^v78_')
         + (select count(*) from pg_constraint where conname ~ '^v78_'),
         null::bigint, null::bigint, null::bigint, null::bigint, null::numeric, 'INFO (0 avant la migration, 5 après)', null::text
  union all
  select 'G structure', 'empreinte de toutes les lignes de donnees', count(*), null::bigint, null::bigint, null::bigint, null::bigint,
         null::numeric, 'INFO',
         coalesce(md5(string_agg(t.user_id::text || '|' || t.outil || '|' || coalesce(extract(epoch from t.maj_le)::text, '') || '|' || md5(coalesce(t.contenu::text, '')),
                                 ',' order by t.user_id, t.outil)), '')
    from t
  union all
  select 'G structure', 'empreinte des profils', count(*), null::bigint, null::bigint, null::bigint, null::bigint, null::numeric, 'INFO',
         coalesce(md5(string_agg(p.id::text || '|' || coalesce(md5(p.prenom), '') || '|' || coalesce(md5(p.nom), '') || '|' || coalesce(p.role, '')
                                 || '|' || coalesce(p.statut, '') || '|' || coalesce(extract(epoch from p.cree_le)::text, ''), ',' order by p.id)), '')
    from public.profils p
  union all
  -- H. pré-requis de la migration
  select 'H pré-requis', 'est_coach() : SECURITY DEFINER, exécutable par authenticated', null::bigint, null::bigint, null::bigint, null::bigint,
         null::bigint, null::numeric,
         case when to_regprocedure('public.est_coach()') is null then 'STOP : absente'
              when (select prosecdef from pg_proc where oid = to_regprocedure('public.est_coach()'))
                   and has_function_privilege('authenticated', 'public.est_coach()', 'execute') then 'OK' else 'STOP' end, null::text
  union all
  select 'H pré-requis', 'est_client() : SECURITY DEFINER, rôle ET statut « client », exécutable par authenticated', null::bigint, null::bigint,
         null::bigint, null::bigint, null::bigint, null::numeric,
         case when to_regprocedure('public.est_client()') is null then 'STOP : absente'
              when (select prosecdef from pg_proc where oid = to_regprocedure('public.est_client()'))
                   and pg_get_functiondef(to_regprocedure('public.est_client()')) ~ 'statut\s*=\s*''client'''
                   and has_function_privilege('authenticated', 'public.est_client()', 'execute') then 'OK' else 'STOP' end, null::text
  union all
  select 'H pré-requis', 'noter_connexion() exécutable par authenticated (ne pas retirer : Security Advisor)', null::bigint, null::bigint,
         null::bigint, null::bigint, null::bigint, null::numeric,
         case when to_regprocedure('public.noter_connexion()') is null then 'INFO : absente'
              when has_function_privilege('authenticated', 'public.noter_connexion()', 'execute') then 'OK' else 'À REGARDER' end, null::text
  union all
  select 'H pré-requis', 'Postgres 14 ou plus (CREATE OR REPLACE TRIGGER)', current_setting('server_version_num')::bigint, null::bigint,
         null::bigint, null::bigint, null::bigint, null::numeric,
         case when current_setting('server_version_num')::int >= 140000 then 'OK' else 'STOP' end, current_setting('server_version')
  union all
  select 'H pré-requis', 'colonne donnees.contenu en jsonb', null::bigint, null::bigint, null::bigint, null::bigint, null::bigint, null::numeric,
         case when (select data_type from information_schema.columns
                     where table_schema = 'public' and table_name = 'donnees' and column_name = 'contenu') = 'jsonb' then 'OK' else 'STOP' end, null::text
  union all
  select 'H pré-requis', 'clé unique (user_id, outil) de donnees (l''upsert de l''app)', null::bigint, null::bigint, null::bigint, null::bigint,
         null::bigint, null::numeric,
         case when exists (select 1 from pg_index i
                            where i.indrelid = 'public.donnees'::regclass and i.indisunique
                              and (select array_agg(a.attname::text order by a.attname)
                                     from pg_attribute a where a.attrelid = i.indrelid and a.attnum = any (i.indkey)) = array['outil', 'user_id'])
              then 'OK' else 'STOP' end, null::text
)
select * from r
union all
select 'Z bilan', 'heure du relevé (UTC)', null::bigint, null::bigint, null::bigint, null::bigint, null::bigint, null::numeric, 'INFO',
       to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
union all
select 'Z bilan', 'verdict', (select count(*) from r where verdict like 'STOP%'), null::bigint, null::bigint, null::bigint, null::bigint,
       null::numeric,
       case when exists (select 1 from r where verdict like 'STOP%') then 'STOP : ne pas appliquer (voir les lignes STOP)' else 'OK pour appliquer' end,
       'lignes STOP : ' || coalesce((select string_agg(partie || ' / ' || element, ' ; ') from r where verdict like 'STOP%'), 'aucune')
order by 1, 2;
