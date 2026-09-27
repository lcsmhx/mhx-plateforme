-- v51 — Journal des emails de suivi envoyés aux prospects par la fonction « emails-prospects ».
-- NON APPLIQUÉE : à relire puis appliquer par Lucas (ou par Claude avec son accord explicite).
-- Non destructive : une table nouvelle, aucune table existante touchée, aucune donnée supprimée.
-- Une ligne par prospect et par modèle d'email : c'est ce qui empêche d'envoyer deux fois le même email.

create table if not exists public.emails_prospects (
  id              bigint generated always as identity primary key,
  user_id         uuid not null references auth.users(id) on delete cascade,  -- compte supprimé : son journal part avec
  modele          text not null check (modele in ('bienvenue', 'questionnaire', 'relance')),
  statut          text not null default 'en_cours' check (statut in ('en_cours', 'envoye', 'echec', 'abandon')),
  tentatives      integer not null default 0 check (tentatives >= 0),
  message_id      text,           -- identifiant Brevo (relie les ouvertures et les clics)
  derniere_erreur text,
  cree_le         timestamptz not null default now(),
  maj_le          timestamptz not null default now(),
  envoye_le       timestamptz,
  ouvert_le       timestamptz,    -- première ouverture (webhook Brevo)
  clique_le       timestamptz,    -- premier clic (webhook Brevo)
  unique (user_id, modele)
);

create index if not exists emails_prospects_message_id on public.emails_prospects (message_id);

alter table public.emails_prospects enable row level security;

-- Le coach lit le journal (score « email ouvert », chronologie de la fiche). Personne d'autre ne lit.
-- Aucune règle d'écriture : seule la fonction, avec la clé de service, écrit (la clé de service passe outre la RLS).
drop policy if exists "emails_prospects : lecture par le coach" on public.emails_prospects;
create policy "emails_prospects : lecture par le coach"
  on public.emails_prospects for select
  to authenticated
  using (public.est_coach());

comment on table public.emails_prospects is
  'MHX v51 — emails de suivi des prospects (bienvenue, questionnaire, relance) : un envoi par prospect et par modèle. Écrit par la fonction emails-prospects (clé de service), lu par le coach.';

-- Vérification après application (doit renvoyer 1 règle, en lecture, pour authenticated) :
--   select policyname, cmd, roles from pg_policies where tablename = 'emails_prospects';
-- Retour arrière (seulement si la table est vide ou si l'on accepte de perdre le journal) :
--   drop table public.emails_prospects;
