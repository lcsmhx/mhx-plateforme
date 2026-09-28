-- v56 (28/09/2026) : compteur de connexions côté coach (Mes clients, page Prospects).
-- Une connexion = une ouverture de l'app avec une session valide (connexion automatique comprise), comptée au plus une
-- fois par jour (calendrier de Paris) ; la dernière connexion = l'instant de la dernière ouverture.
--
-- NON DESTRUCTIF : une table NOUVELLE et une fonction NOUVELLE. Aucune table, aucune ligne, aucune règle, aucune fonction
-- existante n'est modifiée. Ni DROP, ni DELETE, ni TRUNCATE. Retour arrière sans rien supprimer : supabase/v56_retour.sql.
-- Appliquée d'un bloc (apply_migration : une seule transaction) ; tests : supabase/tests/v56_connexions_rls.sql.
--
-- Qui peut quoi :
--   * la personne connectée (client, prospect, coach) : appeler noter_connexion(), qui ne touche QUE sa propre ligne (le
--     compte est lu dans son jeton, auth.uid() ; la fonction ne prend aucun paramètre) ; elle ne peut ni lire la table, ni
--     y écrire directement (aucun droit INSERT / UPDATE / DELETE / TRUNCATE, aucune règle d'écriture) ;
--   * le coach (est_coach()) : lire toute la table ; il n'y écrit pas directement non plus ;
--   * la clé de service (fonctions serveur, jamais dans l'app) garde tous les droits, comme sur toutes les tables ;
--   * l'anonyme (clé publique, sans session) : rien, ni la table, ni la fonction.
-- Suppression d'un compte (fonction supprimer-acces) : sa ligne part avec lui (clé étrangère ON DELETE CASCADE, comme
-- donnees et profils) : la suppression d'un compte n'est jamais bloquée par cette table.

-- La clé étrangère vers auth.users pose un court verrou sur auth.users jusqu'à la fin de la transaction : si une autre
-- transaction le tient, on abandonne au bout de 5 s (rien n'est appliqué, on réessaie) au lieu de faire attendre les
-- connexions et les inscriptions derrière nous.
set local lock_timeout = '5s';

create table public.connexions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nombre integer not null default 0 check (nombre >= 0),                              -- jours (Paris) avec au moins une ouverture
  premiere timestamptz not null default now(),                                        -- première connexion notée : début du comptage
  derniere timestamptz not null default now(),                                        -- dernière ouverture (date et heure)
  dernier_jour date not null default ((now() at time zone 'Europe/Paris')::date)      -- jour (Paris) de la dernière ouverture
);
comment on table public.connexions is 'v56 : compteur de connexions par compte (une par jour au plus, calendrier de Paris) et dernière connexion. Écrite seulement par la fonction noter_connexion() (le compte connecté, pour lui-même) ; lue par le coach seul.';

alter table public.connexions enable row level security;

-- Supabase donne par défaut tous les droits d'une nouvelle table à anon et authenticated : on les reprend, puis on rend
-- la seule lecture (filtrée par la règle ci-dessous : le coach seul voit des lignes)
revoke all on table public.connexions from anon, authenticated;
grant select on table public.connexions to authenticated;

create policy "connexions lisibles par le coach" on public.connexions
  for select to authenticated
  using (( select public.est_coach() ));

-- La seule façon d'écrire : pour soi-même. Même jour (Paris) : la dernière connexion avance, le nombre ne bouge pas ;
-- nouveau jour : +1. Deux appels en même temps (deux onglets) : la clé primaire les range sur la même ligne.
create function public.noter_connexion() returns void
  language sql
  volatile
  security definer
  set search_path = ''
as $$
  insert into public.connexions as c (user_id, nombre, premiere, derniere, dernier_jour)
  select auth.uid(), 1, now(), now(), (now() at time zone 'Europe/Paris')::date
  where auth.uid() is not null
  on conflict (user_id) do update
    set nombre = c.nombre + (case when excluded.dernier_jour > c.dernier_jour then 1 else 0 end),
        derniere = greatest(c.derniere, excluded.derniere),
        dernier_jour = greatest(c.dernier_jour, excluded.dernier_jour);
$$;
comment on function public.noter_connexion() is 'v56 : note une ouverture de l''app pour le compte connecté (auth.uid()), une fois par jour au plus (Paris) ; met à jour la dernière connexion. Aucun paramètre : personne ne peut noter pour un autre.';

-- Supabase donne aussi l'exécution des nouvelles fonctions à anon : reprise ; seuls les comptes connectés l'appellent
revoke all on function public.noter_connexion() from public, anon;
grant execute on function public.noter_connexion() to authenticated;
