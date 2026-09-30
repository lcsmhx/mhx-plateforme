-- Relevé en LECTURE SEULE de la base (v66, lot 2 ; 30/09/2026). Aucune écriture : que des SELECT.
-- But : comparer les règles réellement en place au texte de référence (docs/HANDOFF-CLAUDE-CODE.md §2.3, état du 25/09,
-- complété v49 et v56), et mesurer l'usage du plan gratuit avant la migration « limites d'écriture ».
-- Le résultat est rangé à côté (releve-resultat.md), sans aucune donnée de compte (pas d'email, pas de contenu).

-- 1. Règles RLS (public et storage)
select schemaname, tablename, policyname, permissive, cmd, roles::text, qual, with_check, md5(coalesce(qual,'') || '|' || coalesce(with_check,'')) as empreinte
from pg_policies where schemaname in ('public', 'storage') order by 1, 2, 3;

-- 2. RLS activée / forcée sur chaque table de public
select c.relname, c.relrowsecurity, c.relforcerowsecurity
from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' order by 1;

-- 3. Fonctions : texte complet, SECURITY DEFINER, search_path, droit d'exécution
select p.proname, p.prosecdef, p.proconfig::text,
       has_function_privilege('anon', p.oid, 'execute') as anon_exec,
       has_function_privilege('authenticated', p.oid, 'execute') as auth_exec,
       pg_get_functiondef(p.oid) as definition
from pg_proc p where p.pronamespace = 'public'::regnamespace order by 1;

-- 4. Déclencheurs (profils, donnees, auth.users)
select t.tgname, t.tgrelid::regclass::text, pg_get_triggerdef(t.oid)
from pg_trigger t
where not t.tgisinternal and t.tgrelid in ('public.profils'::regclass, 'public.donnees'::regclass, 'auth.users'::regclass)
order by 2, 1;

-- 5. Droits des rôles anon et authenticated sur les tables de public
select table_name, grantee, string_agg(privilege_type, ',' order by privilege_type)
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated') group by 1, 2 order by 1, 2;

-- 6. Contraintes de donnees
select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.donnees'::regclass order by 1;

-- 7. Réglages du stockage (bucket photos)
select id, public, file_size_limit, allowed_mime_types from storage.buckets order by 1;

-- 8. Usage du plan gratuit (limites : 500 Mo de base, 1 Go de stockage)
select pg_size_pretty(pg_database_size(current_database())) as base, pg_database_size(current_database()) as base_octets;
select c.oid::regclass::text as table_, pg_total_relation_size(c.oid) as octets
from pg_class c where c.relnamespace in ('public'::regnamespace, 'auth'::regnamespace, 'storage'::regnamespace) and c.relkind = 'r'
order by 2 desc limit 15;
select bucket_id, count(*) as fichiers, coalesce(sum((metadata->>'size')::bigint), 0) as octets,
       max((metadata->>'size')::bigint) as plus_gros
from storage.objects group by 1;

-- 9. Ce que les comptes écrivent aujourd'hui : par clé, nombre de lignes et taille (JSON texte, octets), selon qui
--    possède la ligne (coach, client, prospect). Sert à fixer les limites SANS refuser une seule ligne existante.
select coalesce(p.role, '?') as role, coalesce(p.statut, '?') as statut, d.outil, count(*) as lignes,
       max(octet_length(d.contenu::text)) as max_octets, sum(octet_length(d.contenu::text)) as total_octets
from public.donnees d left join public.profils p on p.id = d.user_id
group by 1, 2, 3 order by 1, 2, 3;

-- 10. Comptes par rôle et statut
select role, statut, count(*) from public.profils group by 1, 2 order by 1, 2;

-- 11. Photos : noms hors du modèle attendu, et comptes qui en ont (par statut)
select coalesce(p.statut, '?') as statut, count(*) as photos,
       count(*) filter (where o.name !~ '^[0-9a-f-]{36}/s[0-9]{3,4}-(face|profil|dos)[.]jpg$') as hors_modele
from storage.objects o left join public.profils p on p.id::text = (storage.foldername(o.name))[1]
where o.bucket_id = 'photos' group by 1;

-- 12. Colonnes et index de donnees (contenu peut-il être NULL ?)
select column_name, data_type, is_nullable, column_default from information_schema.columns
where table_schema = 'public' and table_name = 'donnees' order by ordinal_position;
select indexname, indexdef from pg_indexes where schemaname = 'public' and tablename = 'donnees' order by 1;

-- 13. Garde-fous de la migration v66, en simple lecture (tous doivent rendre 0)
select count(*) as cles_hors_liste from public.donnees where outil <> all (array['activite','atelier','calc','calc_perso','challenge',
  'checkins','coach_notifs','complements','emails','formation','hist_programme','hist_repas','intake','journal','mens','objectifs_faits',
  'perf','photos','prefs','programme','repas','repas_suivi','feedbacks','notes_coach','suivi_prospect']);
select count(*) as au_dessus_du_quart from public.donnees d left join public.profils p on p.id = d.user_id
where d.outil not in ('feedbacks','notes_coach','suivi_prospect')
  and coalesce(octet_length(d.contenu::text), 0) > case when p.role = 'coach' or (p.role = 'client' and p.statut = 'client') then 262144 else 32768 end;
select count(*) as contenu_vide from public.donnees where contenu is null;

-- 14. Profils : taille des prénoms et noms (risque signalé hors de ce lot)
select max(octet_length(prenom)) as prenom_max, max(octet_length(nom)) as nom_max from public.profils;

-- 15. Empreintes et comptages (avant / après ; méthode de sauvegardes/empreintes.sql), ligne par ligne sans contenu
select user_id, outil, maj_le, md5(contenu::text) from public.donnees order by 1, 2;
select id, role, statut, md5(row(id, prenom, nom, role, statut, cree_le)::text) from public.profils order by 1;
select md5(string_agg(policyname || ':' || coalesce(qual,'') || '|' || coalesce(with_check,''), ',' order by schemaname, tablename, policyname))
from pg_policies where schemaname in ('public', 'storage');
select md5(string_agg(pg_get_functiondef(p.oid), ',' order by p.proname)) from pg_proc p where p.pronamespace = 'public'::regnamespace;
