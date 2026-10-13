-- =====================================================================================================================
-- v78 — VÉRIFICATIONS APRÈS LA MIGRATION, LECTURE SEULE (une seule requête SELECT : elle ne peut rien écrire).
-- Préparé le 12/10/2026, pas encore lancé. À lancer juste après 02-migration.sql (éditeur SQL de Supabase, ou pendant la
-- séance), puis à comparer avec le relevé « avant » (01-releve-agregats.sql). Aucune donnée de client : que des nombres,
-- des noms d'objets et des empreintes md5 (mêmes formules que le relevé 01).
--
-- AVANT DE LANCER : coller dans « avant » (juste en dessous) les quatre valeurs du relevé 01 « avant » (partie G :
-- empreinte des règles RLS, empreinte des fonctions de public (hors v78_), empreinte de toutes les lignes de donnees,
-- empreinte des profils). Sans elles, ces lignes disent « À COMPARER ».
-- Attendu : aucune ligne « ÉCHEC ». Les lignes de la partie E se comparent une à une à la partie A du relevé 01 : mêmes
-- nombres de lignes et mêmes empreintes, sauf pour une clé que l'app a écrite entre les deux (activite, coach_visite,
-- checkins… : à vérifier, voir LISEZMOI, étape 5) ; un écart inexpliqué = STOP et retour arrière (03-retour.sql).
-- Les lignes « lignes de la table … » se comparent à la partie F du relevé 01 (bibliothèque et catalogue : identiques) ;
-- elles passent par query_to_xml('select count(*) …'), une lecture elle aussi.
-- Si la requête s'arrête sur « function public.v78_limite(…) does not exist » : la migration n'est pas en place.
-- =====================================================================================================================
with
avant (regles, fonctions, lignes_donnees, profils) as (values
  ('COLLER ICI', 'COLLER ICI', 'COLLER ICI', 'COLLER ICI')),
attendu (outil, limite) as (values
  ('hist_repas', 16777216), ('hist_programme', 8388608), ('journal', 4194304), ('perf', 4194304), ('checkins', 2097152),
  ('repas', 1048576), ('journal_alimentaire', 1048576), ('feedbacks', 1048576), ('programme', 524288), ('atelier', 524288), ('mens', 524288),
  ('formation', 524288), ('photos', 524288), ('notes_coach', 524288), ('intake', 262144), ('complements', 131072),
  ('repas_suivi', 131072), ('challenge', 131072), ('suivi_prospect', 131072), ('activite', 65536), ('seances_formation', 262144), ('calc', 16384),
  ('calc_perso', 16384), ('objectifs_faits', 16384), ('prefs', 16384), ('emails', 16384), ('contact', 16384),
  ('coach_notifs', 16384), ('coach_visite', 16384)),
cles_coach (outil) as (values ('programme'), ('repas'), ('calc'), ('complements'), ('hist_programme'), ('hist_repas'),
                              ('feedbacks'), ('notes_coach'), ('suivi_prospect')),
maintenant as (
  select
    coalesce((select md5(string_agg(schemaname || '.' || tablename || ':' || policyname || ':' || cmd || ':' || roles::text || ':' || permissive || ':' || coalesce(qual, '') || '|' || coalesce(with_check, ''), ',' order by schemaname, tablename, policyname))
                from pg_policies where schemaname in ('public', 'storage')), '') as regles,
    coalesce((select md5(string_agg(pg_get_functiondef(p.oid), ',' order by p.proname, p.oid))
                from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prokind in ('f', 'p') and p.proname !~ '^v78_'), '') as fonctions,
    coalesce((select md5(string_agg(d.user_id::text || '|' || d.outil || '|' || coalesce(extract(epoch from d.maj_le)::text, '') || '|' || md5(coalesce(d.contenu::text, '')),
                                    ',' order by d.user_id, d.outil)) from public.donnees d), '') as lignes_donnees,
    coalesce((select md5(string_agg(p.id::text || '|' || coalesce(md5(p.prenom), '') || '|' || coalesce(md5(p.nom), '') || '|' || coalesce(p.role, '')
                                    || '|' || coalesce(p.statut, '') || '|' || coalesce(extract(epoch from p.cree_le)::text, ''), ',' order by p.id))
                from public.profils p), '') as profils
),
v (partie, verification, resultat, detail) as (
  -- A. les objets de la v78
  select 'A objets'::text, 'fonction public.v78_limite(text, boolean), marquée « v78 », exécutable par anon et authenticated'::text,
         case when to_regprocedure('public.v78_limite(text, boolean)') is null then 'ÉCHEC'
              when coalesce(obj_description(to_regprocedure('public.v78_limite(text, boolean)'), 'pg_proc'), '') like 'v78 :%'
                   and has_function_privilege('authenticated', 'public.v78_limite(text, boolean)', 'execute')
                   and has_function_privilege('anon', 'public.v78_limite(text, boolean)', 'execute') then 'OK' else 'ÉCHEC' end,
         null::text
  union all
  select 'A objets', 'fonction public.v78_donnees_limites(), marquée « v78 », non appelable par anon ni authenticated',
         case when to_regprocedure('public.v78_donnees_limites()') is null then 'ÉCHEC'
              when coalesce(obj_description(to_regprocedure('public.v78_donnees_limites()'), 'pg_proc'), '') like 'v78 :%'
                   and not has_function_privilege('authenticated', 'public.v78_donnees_limites()', 'execute')
                   and not has_function_privilege('anon', 'public.v78_donnees_limites()', 'execute') then 'OK' else 'ÉCHEC' end, null
  union all
  select 'A objets', 'déclencheur v78_donnees_limites : donnees, BEFORE INSERT OR UPDATE, FOR EACH ROW, activé',
         case when exists (select 1 from pg_trigger t
                            where t.tgrelid = 'public.donnees'::regclass and t.tgname = 'v78_donnees_limites' and not t.tgisinternal
                              and t.tgenabled = 'O' and (t.tgtype::int & 1) = 1 and (t.tgtype::int & 2) = 2
                              and (t.tgtype::int & 4) = 4 and (t.tgtype::int & 16) = 16 and (t.tgtype::int & 8) = 0
                              and t.tgfoid = to_regprocedure('public.v78_donnees_limites()'))
              then 'OK' else 'ÉCHEC' end,
         (select string_agg(tgname || ' état ' || tgenabled, ', ') from pg_trigger where tgrelid = 'public.donnees'::regclass and not tgisinternal)
  union all
  select 'A objets', 'contraintes v78_profils_prenom_longueur et v78_profils_nom_longueur : présentes et validées',
         case when (select count(*) from pg_constraint where conrelid = 'public.profils'::regclass
                     and conname in ('v78_profils_prenom_longueur', 'v78_profils_nom_longueur') and contype = 'c' and convalidated) = 2
              then 'OK' else 'ÉCHEC' end,
         (select string_agg(conname || ' : ' || pg_get_constraintdef(oid), ' ; ') from pg_constraint
           where conrelid = 'public.profils'::regclass and conname like 'v78\_%')
  union all
  -- B. les limites sont celles prévues (29 clés), et une clé inconnue reste refusée
  select 'B limites', 'v78_limite : 29 clés aux valeurs prévues, plafond prospect 256 Ko, clé inconnue = null',
         case when to_regprocedure('public.v78_limite(text, boolean)') is null then 'ÉCHEC'
              when (select count(*) from attendu a
                     where public.v78_limite(a.outil) is distinct from a.limite
                        or public.v78_limite(a.outil, true) is distinct from least(a.limite, 262144)) = 0
                   and public.v78_limite('cle_inconnue_v78') is null and public.v78_limite('cle_inconnue_v78', true) is null
              then 'OK' else 'ÉCHEC' end, null
  union all
  -- C. aucune ligne existante en violation (la migration n'en a modifié aucune : elles sont toutes sous leur limite)
  select 'C données', 'lignes de donnees avec une clé hors liste', case when n = 0 then 'OK' else 'ÉCHEC' end, n || ' ligne(s)'
    from (select count(*) as n from public.donnees d where not exists (select 1 from attendu a where a.outil = d.outil)) x
  union all
  select 'C données', 'lignes de donnees au-dessus de leur limite', case when n = 0 then 'OK' else 'ÉCHEC' end, n || ' ligne(s)'
    from (select count(*) as n from public.donnees d join attendu a on a.outil = d.outil
           where coalesce(octet_length(d.contenu::text), 0) > a.limite) x
  union all
  select 'C données', 'lignes de prospects (hors clés du coach) au-dessus du plafond prospect', case when n = 0 then 'OK' else 'ÉCHEC' end, n || ' ligne(s)'
    from (select count(*) as n from public.donnees d join public.profils p on p.id = d.user_id join attendu a on a.outil = d.outil
           where p.role <> 'coach' and p.statut = 'prospect' and d.outil not in (select outil from cles_coach)
             and coalesce(octet_length(d.contenu::text), 0) > least(a.limite, 262144)) x
  union all
  select 'C données', 'marge : lignes au-dessus du quart de leur limite (0 attendu, comme le jour J)', case when n = 0 then 'OK' else 'À REGARDER' end, n || ' ligne(s)'
    from (select count(*) as n from public.donnees d join attendu a on a.outil = d.outil
           where coalesce(octet_length(d.contenu::text), 0) > a.limite / 4) x
  union all
  select 'C données', 'profils avec un prénom ou un nom de plus de 100 caractères', case when n = 0 then 'OK' else 'ÉCHEC' end, n || ' profil(s)'
    from (select count(*) as n from public.profils where char_length(prenom) > 100 or char_length(nom) > 100) x
  union all
  -- D. règles RLS, fonctions existantes et droits : inchangés
  select 'D inchangé', 'empreinte des règles RLS (public, storage) = celle du relevé « avant »',
         case when av.regles = 'COLLER ICI' then 'À COMPARER' when av.regles = m.regles then 'OK' else 'ÉCHEC' end,
         'maintenant ' || m.regles || ' · avant ' || av.regles
    from avant av, maintenant m
  union all
  -- le relevé 01 (partie G) s'arrête AVANT d'appliquer si la base n'a pas 6 + 2 : ici, un ÉCHEC veut donc dire qu'une règle
  -- a été ajoutée ou retirée entre le relevé et maintenant (la v78 n'en touche aucune : l'empreinte ci-dessus le dit aussi)
  select 'D inchangé', 'règles RLS : 6 sur donnees, 2 sur profils',
         case when (select count(*) from pg_policies where schemaname = 'public' and tablename = 'donnees') = 6
                   and (select count(*) from pg_policies where schemaname = 'public' and tablename = 'profils') = 2 then 'OK' else 'ÉCHEC' end, null
  union all
  select 'D inchangé', 'empreinte des fonctions de public hors v78_ = celle du relevé « avant »',
         case when av.fonctions = 'COLLER ICI' then 'À COMPARER' when av.fonctions = m.fonctions then 'OK' else 'ÉCHEC' end,
         'maintenant ' || m.fonctions || ' · avant ' || av.fonctions
    from avant av, maintenant m
  union all
  select 'D inchangé', 'Security Advisor : est_coach, est_client (et noter_connexion) toujours exécutables par authenticated',
         case when to_regprocedure('public.est_coach()') is null or to_regprocedure('public.est_client()') is null then 'ÉCHEC'
              when has_function_privilege('authenticated', 'public.est_coach()', 'execute')
                   and has_function_privilege('authenticated', 'public.est_client()', 'execute')
                   and (to_regprocedure('public.noter_connexion()') is null
                        or has_function_privilege('authenticated', 'public.noter_connexion()', 'execute')) then 'OK' else 'ÉCHEC' end, null
  union all
  select 'D inchangé', 'empreinte de toutes les lignes de donnees = celle du relevé « avant »',
         case when av.lignes_donnees = 'COLLER ICI' then 'À COMPARER' when av.lignes_donnees = m.lignes_donnees then 'OK'
              else 'ÉCART : comparer la partie E au relevé (écriture de l''app ?)' end,
         'maintenant ' || m.lignes_donnees || ' · avant ' || av.lignes_donnees
    from avant av, maintenant m
  union all
  select 'D inchangé', 'empreinte des profils = celle du relevé « avant »',
         case when av.profils = 'COLLER ICI' then 'À COMPARER' when av.profils = m.profils then 'OK'
              else 'ÉCART : un compte créé ou modifié entre-temps ?' end,
         'maintenant ' || m.profils || ' · avant ' || av.profils
    from avant av, maintenant m
  union all
  -- E. comptages et empreintes par clé et par rôle (à comparer ligne à ligne aux parties A et D du relevé « avant »)
  select 'E comptages', 'donnees · ' || left(d.outil, 40), 'INFO',
         count(*) || ' ligne(s) · empreinte '
         || md5(string_agg(d.user_id::text || '|' || coalesce(extract(epoch from d.maj_le)::text, '') || '|' || md5(coalesce(d.contenu::text, '')),
                           ',' order by d.user_id))
    from public.donnees d group by d.outil
  union all
  select 'E comptages', 'profils · ' || coalesce(role, '?') || ' / ' || coalesce(statut, '?'), 'INFO', count(*) || ' compte(s)'
    from public.profils group by role, statut
  union all
  -- mêmes nombres que la partie F du relevé 01 « lignes de la table … » (catalogue et bibliothèque : identiques attendus)
  select 'E comptages', 'lignes de la table ' || x.nom, 'INFO',
         case when to_regclass('public.' || x.nom) is null then 'table absente'
              else (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from public.%I', x.nom), false, true, '')))[1]::text || ' ligne(s)' end
    from (values ('profils'), ('donnees'), ('bibliotheque'), ('aliments'), ('recettes'), ('programmes_types'), ('exercices'),
                 ('briefs'), ('connexions')) as x (nom)
)
select * from v
union all
select 'Z bilan', 'verdict', case when exists (select 1 from v where resultat like 'ÉCHEC%') then 'ÉCHEC : retour arrière (03-retour.sql)'
                                  when exists (select 1 from v where resultat like 'À%' or resultat like 'ÉCART%') then 'À COMPARER / À REGARDER'
                                  else 'OK' end,
       to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
order by 1, 2;
