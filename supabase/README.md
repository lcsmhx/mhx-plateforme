# Dossier `supabase/`

## Ce qui reste
- `templates/` : les modèles des emails **du compte** envoyés par Supabase (confirmation d'inscription, mot de passe oublié, changement d'adresse), gardés pour plus tard. Ils ne servent pas aujourd'hui : l'app n'envoie aucun email (plan V2, ligne directrice, point 1). Pour les utiliser un jour : Supabase → Authentication → Emails → Templates, coller le contenu du fichier voulu.

## v56 — compteur de connexions (préparé le 28/09/2026, **pas encore appliqué**)
- `migrations/20260928220000_v56_compteur_connexions.sql` : une table nouvelle `connexions` (une ligne par compte : nombre de connexions, une par jour au plus au calendrier de Paris ; première et dernière connexion) et une fonction nouvelle `noter_connexion()` (sans paramètre : elle note la connexion du compte connecté, jamais celle d'un autre). Lecture : le coach seul. Écriture directe : personne. Rien d'existant n'est modifié.
- `tests/v56_connexions_rls.sql` : 23 tests des règles (coach, client de test, prospect fictif, anonyme, tentatives croisées), toujours dans une transaction annulée (`begin; … rollback;`).
- `v56_retour.sql` : retour arrière sans rien supprimer (on retire les droits d'appel et de lecture ; la table et la fonction restent).
- Marche à suivre et risques : `docs/BRIEF-V56-CONNEXIONS.md`.

## Ce qui a été retiré
- **Fonction d'emails de suivi v51 (« emails-prospects ») retirée le 28/09/2026** (v53, nettoyage) : le dossier `functions/emails-prospects/`, sa migration `migrations/20260927120000_emails_prospects.sql` et la page `desinscription.html`. Elle n'a jamais été déployée, sa migration jamais appliquée, et rien dans l'app ne l'appelait : aucune base ni aucune donnée n'a été touchée.
- Historique complet (code, tests, marche à suivre du déploiement) dans git : `git log -- supabase/functions/emails-prospects`, par exemple `git show f9e6b07:supabase/README.md`.
