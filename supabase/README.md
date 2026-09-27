# Emails de suivi des prospects — fonction Supabase « emails-prospects »

**État (27/09/2026) : prête et testée, PAS déployée.** Rien n'est envoyé tant que les étapes ci-dessous ne sont pas faites. Claude n'a pas pu les faire : elles demandent ton compte Brevo, une clé API, et des écritures dans Supabase que tes permissions (`.claude/settings.local.json`) lui interdisent, à juste titre.

À faire **après** l'ouverture de l'inscription (`OUVERTURE-INSCRIPTION.md`) : sans SMTP externe, les comptes ne sont de toute façon jamais confirmés, et la fonction n'écrit qu'aux comptes confirmés.

## Ce qu'elle fait
Trois emails en français, sans aucun prix, **uniquement aux prospects qui ont coché la case** « J'accepte de recevoir par email des rappels et conseils » à l'inscription (ou activé l'interrupteur « Emails de suivi » dans leur Profil) :

| Email | Quand | Objet |
|---|---|---|
| Bienvenue | dès que l'email du compte est confirmé | « Léa, ta découverte MHX Coaching commence » |
| Rappel du questionnaire | 24 h après l'inscription, questionnaire pas rempli | « Léa, ton résultat personnalisé t'attend » |
| Relance | 3 jours après l'inscription, aucune action depuis 3 jours | « Léa, tu as oublié de regarder ton résultat ? » (ou « …ton questionnaire t'attend toujours ») |

- Chaque email part **une seule fois** par prospect (journal `emails_prospects`), au plus un par passage.
- Jamais après un bilan réservé, une issue « Signé » ou « Perdu », ni aux comptes créés plus de 8 jours avant (rien ne part aux anciens comptes le jour du déploiement).
- Un envoi qui échoue est retenté au passage suivant, 3 fois au plus ; au plus 50 emails par passage et **150 par jour** (le quota gratuit de Brevo, 300 par jour, est partagé avec les emails de confirmation de compte).
- Chaque email contient un lien « Ne plus recevoir ces emails » (signé, sans connexion) et les en-têtes de désinscription en un clic de Gmail / Outlook.
- Brevo renvoie les **ouvertures et les clics** : ils apparaissent dans la fiche du prospect (chronologie) et comptent dans son score (+5 « email ouvert »).

Tests (sans réseau) : `node supabase/functions/emails-prospects/test.mjs` → 54 vérifications.

## Fichiers
- `functions/emails-prospects/index.ts` — le point d'entrée (Deno).
- `functions/emails-prospects/logique.js` — toute la logique (règles, emails, Brevo, désinscription).
- `functions/emails-prospects/test.mjs` — les tests.
- `migrations/20260927120000_emails_prospects.sql` — la table du journal (non destructive).

## Déploiement (compte une heure)

### 1. La table du journal
Supabase → **SQL Editor** → colle tout le contenu de `migrations/20260927120000_emails_prospects.sql` → **Run**. Vérifie ensuite : `select policyname, cmd from pg_policies where tablename = 'emails_prospects';` → une ligne (`SELECT`).

### 2. La clé API Brevo
Brevo → **SMTP et API** → onglet **Clés API** → **Générer une nouvelle clé API** (nom : « MHX emails de suivi »). Ce n'est **pas** la clé SMTP utilisée par Supabase pour les confirmations. Copie-la tout de suite ; ne la colle nulle part ailleurs que dans les secrets Supabase (étape 4).

### 3. La fonction
Supabase → **Edge Functions** → **Deploy a new function** → **Via Editor** → nom : `emails-prospects`. Crée deux fichiers et colle leur contenu : `index.ts` et `logique.js` (mêmes noms). Déploie. Puis, dans les réglages de la fonction, **désactive « Enforce JWT verification »** (la fonction est appelée par la tâche planifiée, par le lien de désinscription et par Brevo, sans connexion : elle vérifie elle-même ses secrets).

(En ligne de commande, c'est équivalent : `supabase functions deploy emails-prospects --no-verify-jwt --project-ref nzynbuczmogifuidcjed`.)

### 4. Les secrets de la fonction
Supabase → **Edge Functions** → **Secrets** → ajoute :

| Nom | Valeur |
|---|---|
| `BREVO_API_KEY` | la clé de l'étape 2 |
| `EXPEDITEUR_EMAIL` | `mhx.coaching@gmail.com` (l'expéditeur validé dans Brevo) |
| `EXPEDITEUR_NOM` | `MHX Coaching` |
| `REPONSE_EMAIL` | `mhx.coaching@gmail.com` |
| `SIGNATAIRE` | `Lucas` |
| `CONTACT` | `mhx.coaching@gmail.com` |
| `APP_URL` | `https://lcsmhx.github.io/mhx-plateforme/` |
| `FONCTION_URL` | `https://nzynbuczmogifuidcjed.supabase.co/functions/v1/emails-prospects` |
| `CRON_SECRET` | une suite de 40 caractères au hasard (générateur de mots de passe) |
| `DESINSCRIPTION_SECRET` | une autre suite de 40 caractères au hasard |
| `BREVO_WEBHOOK_SECRET` | une troisième suite de 40 caractères au hasard |

Ne change plus `DESINSCRIPTION_SECRET` ensuite : les liens déjà envoyés ne marcheraient plus.

### 5. Les ouvertures et les clics (webhook Brevo)
Brevo → **Transactionnel** → **Paramètres** → **Webhook** → **Ajouter un webhook** : URL `https://nzynbuczmogifuidcjed.supabase.co/functions/v1/emails-prospects?action=brevo&cle=<BREVO_WEBHOOK_SECRET>` (la valeur de l'étape 4), événements **Ouvert** et **Cliqué**.

### 6. La planification (toutes les heures)
Supabase → **Database** → **Extensions** : active `pg_cron` et `pg_net`. Puis **SQL Editor** (remplace `<CRON_SECRET>` par la valeur de l'étape 4) :

```sql
select vault.create_secret('<CRON_SECRET>', 'mhx_cron_secret');

select cron.schedule('emails-prospects', '7 * * * *', $$
  select net.http_post(
    url := 'https://nzynbuczmogifuidcjed.supabase.co/functions/v1/emails-prospects',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-mhx-cron', (select decrypted_secret from vault.decrypted_secrets where name = 'mhx_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$$);
```

### 7. Le test
1. Avec une adresse de test, inscris-toi en **cochant la case des emails de suivi**, confirme l'email.
2. Lance un passage tout de suite (au lieu d'attendre l'heure) : SQL Editor → la partie `select net.http_post(…)` seule.
3. L'email « Bienvenue » arrive (regarde aussi dans les indésirables). Contrôle : `select modele, statut, envoye_le, derniere_erreur from emails_prospects;` → `bienvenue · envoye`.
4. Ouvre l'email puis, dans l'app (coach), la fiche du compte de test : la chronologie montre « Email de suivi « bienvenue » envoyé » puis « ouvert ».
5. Clique « Ne plus recevoir ces emails » : la page « C'est noté » s'affiche ; dans le Profil du compte de test, l'interrupteur « Emails de suivi » est coupé.
6. Supprime le compte de test depuis Comptes.

En cas de souci : Supabase → **Edge Functions** → `emails-prospects` → **Logs** ; Brevo → **Statistiques**.

## Pour tout arrêter
`select cron.unschedule('emails-prospects');` — plus aucun passage. Le journal et les choix des prospects restent.
