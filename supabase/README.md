# Emails de suivi des prospects — fonction Supabase « emails-prospects »

**État (27/09/2026) : prête et testée, PAS déployée.** Rien n'est envoyé tant que les étapes ci-dessous ne sont pas faites. Claude n'a pas pu les faire : elles demandent ton compte Brevo, une clé API, et des écritures dans Supabase que tes permissions (`.claude/settings.local.json`) lui interdisent, à juste titre.

À faire **après** l'ouverture de l'inscription (`OUVERTURE-INSCRIPTION.md`) : sans SMTP externe, les comptes ne sont de toute façon jamais confirmés, et la fonction n'écrit qu'aux comptes confirmés.

## Ce qu'elle fait
Trois emails en français, sans aucun prix, **uniquement aux prospects qui ont coché la case** « J'accepte de recevoir par email des rappels et conseils » à l'inscription (ou activé l'interrupteur « Emails de suivi » dans leur Profil) :

| Email | Quand | Objet |
|---|---|---|
| Bienvenue | dès que l'email du compte est confirmé | « Léa, ta découverte MHX Coaching commence » (« commence par ton questionnaire », ou « ton résultat est prêt » s'il est déjà rempli) |
| Ton résultat | questionnaire rempli après la bienvenue (dans les 48 h) : le prochain passage, au plus une heure après | « Léa, ton résultat est prêt » (aucun chiffre de santé dans l'email : tout reste dans l'app) |
| Relance | 3 jours après l'inscription, aucune action depuis 3 jours | « Léa, tu as oublié de regarder ton résultat ? » (ou « …ton questionnaire t'attend toujours ») |

- Chaque email part **une seule fois** par prospect (journal `emails_prospects`), au plus un par passage, et **jamais deux à moins de 20 h d'écart** (même pour un compte de quelques jours qui accepte tard), sauf « Ton résultat », qui répond à ce que le prospect vient de faire.
- Jamais après un bilan réservé, une issue « Signé » ou « Perdu », ni aux comptes créés plus de 8 jours avant (rien ne part aux anciens comptes le jour du déploiement).
- Un email refusé pour le prospect (adresse invalide…) est retenté au passage suivant, 3 fois au plus. Un refus de Brevo qui prouve que rien n'est parti (clé ou IP refusée, **crédits épuisés**, trop de requêtes, service indisponible, expéditeur non validé) ne compte pas : le passage s'arrête et tout repart au suivant, sans rien perdre. Un envoi **incertain** (Brevo ne répond pas à temps : il a pu prendre l'email) compte comme un essai et arrête le passage : jamais plus de 3 copies d'un même email, même pendant un incident chez Brevo. Au plus 50 emails par passage et **150 par jour** (le quota gratuit de Brevo, 300 par jour, est partagé avec les emails de confirmation de compte).
- Chaque email contient un lien « Ne plus recevoir ces emails » : il ouvre la page `desinscription.html` de l'app, où le prospect **confirme** d'un bouton (un antivirus qui visite les liens ne désinscrit personne). Le bouton « Se désabonner » que Gmail / Outlook affichent en haut de l'email est celui de **Brevo** (Brevo l'ajoute lui-même à tous les emails) : Brevo prévient la fonction (webhook « Désinscrit », étape 5), qui coupe aussi les emails de suivi dans l'app.
- Brevo renvoie les **ouvertures et les clics** : ils apparaissent dans la fiche du prospect (chronologie) et comptent dans son score (+5 « email ouvert »). Une désinscription faite chez Brevo, une plainte (spam) ou une adresse qui n'existe pas coupent les emails de suivi du prospect, comme le lien.

Tests (sans réseau) : `node supabase/functions/emails-prospects/test.mjs` → 88 vérifications.

## Fichiers
- `functions/emails-prospects/index.ts` — le point d'entrée (Deno).
- `functions/emails-prospects/logique.js` — toute la logique (règles, emails, Brevo, désinscription).
- `functions/emails-prospects/test.mjs` — les tests.
- `migrations/20260927120000_emails_prospects.sql` — la table du journal (non destructive).
- `../desinscription.html` — la page de confirmation « Ne plus recevoir ces emails » (à la racine de l'app : publiée par GitHub Pages avec le reste, dès ton push).

## Déploiement (compte une heure)

### 1. La table du journal
Supabase → **SQL Editor** → colle tout le contenu de `migrations/20260927120000_emails_prospects.sql` → **Run**. Vérifie ensuite : `select policyname, cmd from pg_policies where tablename = 'emails_prospects';` → une ligne (`SELECT`).

### 2. La clé API Brevo
Brevo → **SMTP et API** → onglet **Clés API** → **Générer une nouvelle clé API** (nom : « MHX emails de suivi »). Ce n'est **pas** la clé SMTP utilisée par Supabase pour les confirmations. Copie-la tout de suite ; ne la colle nulle part ailleurs que dans les secrets Supabase (étape 4).

**Indispensable :** Brevo → ton nom en haut à droite → **Sécurité** → **Adresses IP autorisées** → **désactive le blocage des adresses IP inconnues**. Les fonctions Supabase n'ont pas d'adresse IP fixe : sans ce réglage, Brevo refuse chaque envoi (erreur 401 « unrecognised IP address »). La fonction ne compte pas ces refus comme des essais, mais rien ne part tant que le réglage n'est pas fait.

### 3. La fonction
Supabase → **Edge Functions** → **Deploy a new function** → **Via Editor** → nom : `emails-prospects`. Crée deux fichiers et colle leur contenu : `index.ts` et `logique.js` (mêmes noms). Déploie. Puis, dans les réglages de la fonction, **désactive « Enforce JWT verification »** (la fonction est appelée par la tâche planifiée, par le lien de désinscription et par Brevo, sans connexion : elle vérifie elle-même ses secrets).

(En ligne de commande, c'est équivalent : `supabase functions deploy emails-prospects --no-verify-jwt --project-ref nzynbuczmogifuidcjed`.)

### 4. Les secrets de la fonction
Supabase → **Edge Functions** → **Secrets** → ajoute :

| Nom | Valeur |
|---|---|
| `BREVO_API_KEY` | la clé de l'étape 2 |
| `EXPEDITEUR_EMAIL` | `mhx.coaching+suivi@gmail.com` — **conseillé : une adresse d'expéditeur à part** pour les emails de suivi (voir ci-dessous) |
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

**Pourquoi un expéditeur à part.** Quand quelqu'un clique « Se désabonner » dans Gmail, Brevo bloque son adresse **pour cet expéditeur**. Si les emails de suivi partaient de `mhx.coaching@gmail.com`, l'expéditeur des emails de connexion de Supabase (§1 de `OUVERTURE-INSCRIPTION.md`), ce prospect ne recevrait plus non plus l'email « mot de passe oublié ». Avec `mhx.coaching+suivi@gmail.com` (Gmail dépose ces emails dans ta boîte habituelle), le blocage ne touche que les emails de suivi. Ajoute cette adresse dans Brevo → **Expéditeurs, domaines et IP dédiées → Expéditeurs → Ajouter un expéditeur** (nom « MHX Coaching ») et valide-la avec le lien ou le code que Brevo envoie dans ta boîte Gmail, avant l'étape 4.

**Débloquer quelqu'un** (il te demande de recevoir de nouveau tes emails) : dans Brevo, ouvre la liste des contacts bloqués des emails transactionnels (selon la version : menu **Transactionnel → Contacts bloqués**, ou ton nom en haut à droite → **Paramètres → Emails transactionnels**, ou tape « bloqués » dans la recherche de Brevo), ouvre son adresse → **Débloquer** ; puis, dans l'app, il réactive « Emails de suivi » dans son Profil. Tant qu'il est bloqué chez Brevo, ses emails partent « bloqués » et l'app recoupe l'interrupteur : sa fiche montre « non délivré ».

### 5. Les ouvertures et les clics (webhook Brevo)
Brevo → paramètres des **emails transactionnels** → **Webhooks** (selon la version : menu **Transactionnel → Paramètres → Webhook**, ou ton nom en haut à droite → **Paramètres → Emails transactionnels → Webhooks**) → **Ajouter un webhook** : URL `https://nzynbuczmogifuidcjed.supabase.co/functions/v1/emails-prospects?action=brevo&cle=<BREVO_WEBHOOK_SECRET>` (la valeur de l'étape 4), coche les événements **Ouvert** (ou « Première ouverture »), **Cliqué**, **Désinscrit**, **Spam / Plainte**, **Hard bounce**, **Email invalide** et **Bloqué** (les libellés peuvent varier un peu).

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
3. L'email « Bienvenue » arrive (regarde aussi dans les indésirables). Contrôle : `select modele, statut, envoye_le, derniere_erreur from emails_prospects;` → `bienvenue · envoye`. Remplis ensuite le questionnaire, relance un passage : l'email « Ton résultat est prêt » arrive (`resultat · envoye`).
4. Ouvre l'email puis, dans l'app (coach), la fiche du compte de test : la chronologie montre « Email de suivi « bienvenue » envoyé » puis « ouvert ».
5. Clique « Ne plus recevoir ces emails » : la page de l'app s'ouvre ; clique **Confirmer** → « C'est noté ». Dans le Profil du compte de test, l'interrupteur « Emails de suivi » est coupé. (Si la page dit « Pas de connexion » : la fonction n'est pas déployée, ou « Enforce JWT verification » est resté activé.)
6. Dans Gmail, sur l'email reçu : **⋮ → Afficher l'original** → regarde la ligne `From:`. Brevo remplace souvent une adresse `@gmail.com` par une adresse de son domaine (du type `…@…brevosend.com`) : vérifie seulement que la partie avant le `@` commence par `mhx.coaching+suivi` (celle des emails de connexion est `mhx.coaching`).
7. Supprime le compte de test depuis Comptes.

En cas de souci : Supabase → **Edge Functions** → `emails-prospects` → **Logs** : chaque passage écrit une ligne `[emails-prospects] passage {…}` (envoyés, échecs, reportés) et, s'il s'est arrêté, une ligne `passage arrêté : …` avec la raison donnée par Brevo ; la réponse complète des derniers passages : `select status_code, content from net._http_response order by created desc limit 5;` ; `select modele, statut, tentatives, derniere_erreur from emails_prospects order by maj_le desc limit 20;` ; Brevo → **Statistiques**.

## Pour tout arrêter
`select cron.unschedule('emails-prospects');` — plus aucun passage. Le journal et les choix des prospects restent.
