# Dossier `supabase/`

## Ce qui reste
- `templates/` : les modèles des emails **du compte** envoyés par Supabase (confirmation d'inscription, mot de passe oublié, changement d'adresse), gardés pour plus tard. Ils ne servent pas aujourd'hui : l'app n'envoie aucun email (plan V2, ligne directrice, point 1). Pour les utiliser un jour : Supabase → Authentication → Emails → Templates, coller le contenu du fichier voulu.

## Ce qui a été retiré
- **Fonction d'emails de suivi v51 (« emails-prospects ») retirée le 28/09/2026** (v53, nettoyage) : le dossier `functions/emails-prospects/`, sa migration `migrations/20260927120000_emails_prospects.sql` et la page `desinscription.html`. Elle n'a jamais été déployée, sa migration jamais appliquée, et rien dans l'app ne l'appelait : aucune base ni aucune donnée n'a été touchée.
- Historique complet (code, tests, marche à suivre du déploiement) dans git : `git log -- supabase/functions/emails-prospects`, par exemple `git show f9e6b07:supabase/README.md`.
