# Ouvrir l'inscription publique — marche à suivre pour Lucas

*V2, version sans email. Mise à jour le 28/09/2026 (v55).*

Fais les étapes **une à la fois, dans l'ordre**. Chacune dit quoi ouvrir, quoi vérifier et quoi faire si ce n'est pas bon. Compte environ une heure, test compris. Tout se referme en un clic (étape 8).

**Où on en est** : l'inscription est **ouverte depuis la v54** (28/09/2026) : tu as fait les étapes 1 et 2 dans Supabase, et `inscription_libre` vaut `true` dans `js/config.js`. Pour la refermer : étape 8. Pour la rouvrir plus tard : étape 2, puis étape 5.

**Ce que la version sans email implique** (à savoir avant d'ouvrir)
- L'app n'envoie **aucun email** : ni confirmation d'inscription, ni lien « mot de passe oublié », ni newsletter.
- **L'adresse n'est pas vérifiée** : n'importe qui peut s'inscrire avec une adresse qui n'est pas la sienne. Tu verras peut-être des adresses fausses dans Prospects. Si quelqu'un te dit « je n'ai jamais créé ce compte », supprime-le (étape 7). Avant le premier envoi de newsletter (plus tard), il faudra vérifier les adresses.
- **Mot de passe oublié** et **changement d'adresse** : l'app affiche « Écris-nous à mhx.coaching@gmail.com, on te débloque rapidement. » C'est toi qui débloques, à la main (étape 7).
- **« Réserver mon bilan »** est un simple lien vers ta page de réservation (aujourd'hui Calendly), avec prénom, nom et email déjà remplis. L'app n'est pas reliée à Calendly : quand quelqu'un réserve, tu coches toi-même « Bilan réservé » dans sa fiche.

**Les liens Supabase** ouvrent la bonne page du projet `nzynbuczmogifuidcjed`. Si Supabase te demande de te connecter, connecte-toi puis rouvre le lien. Dans Supabase, tu ne touches qu'à **Authentication**. Si un bouton n'a pas exactement le nom indiqué, arrête-toi et demande à Claude.

---

## Étape 0 — Prérequis (2 minutes)

1. Ouvre https://lcsmhx.github.io/mhx-plateforme/ : le pied de page finit par **« · 52 »** (ou plus).
2. Ouvre https://github.com/lcsmhx/mhx-plateforme/actions : la dernière ligne **« Tests puis publication »** a une **coche verte**.

Pas de « · 52 » ou pas de coche verte : n'avance pas, dis-le à Claude.

*À savoir : la politique de confidentialité complète est encore un brouillon (`docs/CONFIDENTIALITE-BROUILLON.md`) ; l'app affiche déjà un texte court. Ce n'est pas bloquant pour ouvrir, mais complète-la dès que possible.*

---

## Étape 1 — « Confirm email » doit être DÉSACTIVÉ

1. Ouvre https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/auth/providers (Authentication → Sign In / Providers).
2. Trouve **Confirm email** : en haut de la page (section « User Signups ») ou, selon la version, en cliquant sur la ligne **Email**.
3. Il doit être **désactivé**. S'il est activé : désactive-le, puis **Save**.

Pourquoi : s'il reste activé, Supabase essaie d'envoyer un email de confirmation que personne ne recevra (son service d'email gratuit n'écrit qu'aux membres de ton équipe Supabase). Le prospect resterait bloqué sur « Vérifie ta boîte mail », sans pouvoir entrer.

Tes clients ne sont pas touchés : leurs comptes sont déjà confirmés.

---

## Étape 2 — Autoriser les inscriptions

1. Même page : https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/auth/providers
2. **Allow new users to sign up** : **activé**, puis **Save**.

Il est désactivé tant que l'inscription est fermée (après l'étape 8) : c'est lui qui ferme l'inscription. À partir de maintenant, une inscription est possible même si l'écran de l'app est encore caché : enchaîne les étapes 3 à 6 le même jour.

---

## Étape 3 — L'adresse du site (vérifier seulement)

1. Ouvre https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/auth/url-configuration (Authentication → URL Configuration).
2. **Site URL** doit être exactement `https://lcsmhx.github.io/mhx-plateforme/`.

C'est bon : ne touche à rien. C'est différent : ne change rien et dis-le à Claude.

---

## Étape 4 — Le lien du bilan

1. Le bouton « Réserver mon bilan » mène aujourd'hui à https://calendly.com/mhx-coaching/30min : ouvre-le.
2. Tu dois voir **ta page de bilan offert de 30 minutes**, avec des créneaux libres.

C'est bon : rien à faire. Ce n'est pas le bon lien :
- **le plus simple** : donne le bon lien à Claude. Il le met dans `CONFIG.marque.calendly`, relance les tests et publie ;
- **ou toi-même** : https://github.com/lcsmhx/mhx-plateforme/edit/main/js/config.js → Cmd+F `calendly:` → remplace le lien entre les guillemets (garde les guillemets) → « Commit changes ». Si GitHub refuse de modifier ce fichier en ligne, passe par Claude.

Attends ensuite la coche verte (https://github.com/lcsmhx/mhx-plateforme/actions).

À savoir : prénom, nom et email se remplissent tout seuls avec un lien Calendly. Avec un autre outil de réservation, le bouton marche, mais les champs restent vides.

---

## Étape 5 — Ouvrir ou rouvrir l'app (c'est toi qui le fais)

Il faut passer `inscription_libre: false` à `inscription_libre: true` dans `js/config.js` (fait en v54 : cette étape ne sert plus qu'à rouvrir après une fermeture).

**Le message du commit qui passe la valeur à `true` doit contenir « ouverture de l'inscription »** : sans ces mots, le banc de tests est rouge et rien n'est publié (c'est une sécurité contre une ouverture par erreur). Fermer (`false`) passe toujours, avec n'importe quel message. Deux façons :
- **Conseillée** : demande à Claude « prépare le commit d'ouverture de l'inscription (`inscription_libre: true`) ». Il change cette seule ligne, met « ouverture de l'inscription » dans le message, relance les tests et **ne pousse pas**. Tu pousses toi-même avec la commande qu'il te donne (`git -C /Users/lucasmahaux/MHX-Code/mhx-plateforme push origin main`).
- **Sans le terminal** : https://github.com/lcsmhx/mhx-plateforme/edit/main/js/config.js → Cmd+F `inscription_libre: false` → remplace `false` par `true` → « Commit changes » (message : « ouverture de l'inscription », obligatoire).

**Message oublié** (banc rouge, rien n'est publié) : remets `inscription_libre: false` (n'importe quel message), puis de nouveau `true` dans un commit dont le message contient « ouverture de l'inscription ». Ne rouvre jamais en annulant la fermeture (`git revert`) ni par une fusion de branches : le banc les refuse toujours.

Ensuite :
1. Attends la coche verte « Tests puis publication » (une quinzaine de minutes) : https://github.com/lcsmhx/mhx-plateforme/actions
2. Ouvre https://lcsmhx.github.io/mhx-plateforme/#/inscription : tu dois voir l'écran **« Crée ton espace gratuit »**. Si tu vois encore la connexion, recharge la page (le téléphone garde parfois l'ancienne version quelques minutes).
3. **Ne mets pas encore le lien sur Instagram** : d'abord le test d'inscription de l'étape 6.

Ne pousse jamais l'ancienne branche `ouverture-inscription` (v51) : elle effacerait la V2.

---

## Étape 6 — Le test d'inscription

Le test d'inscription est fait par Lucas ou par le banc Playwright local. Grok ne crée aucun compte (décision de Lucas du 28/09/2026).

Quelque chose ne va pas : capture d'écran, ne partage pas le lien, donne-la à Claude. Si c'est grave (un client voit une erreur, une donnée manque) : referme tout de suite (étape 8).

Tout est bon : mets le lien sur Instagram (bio, story, réponse automatique) : `https://lcsmhx.github.io/mhx-plateforme/#/inscription`

---

## Étape 7 — Après l'ouverture : ce que tu surveilles

**Chaque jour, la première semaine**
- **Prospects** (https://lcsmhx.github.io/mhx-plateforme/#/prospects) : les nouveaux inscrits et leurs 3 réponses. **Mes clients** (https://lcsmhx.github.io/mhx-plateforme/#/clients) : rien ne change pour tes clients.
- **À chaque réservation** reçue sur Calendly : coche « Bilan réservé » dans la fiche du prospect. Après le bilan, si la personne s'engage : **« Passer client »** (Mes clients → Comptes).
- **Ta boîte mhx.coaching@gmail.com** : les demandes de déblocage (réponds vite) et les demandes sur les données (réponds dans le mois au plus).
- **Faux comptes** (noms étranges, rafales) ou adresse de quelqu'un d'autre : supprime ce compte de prospect (Mes clients → Comptes), jamais un client. S'il y en a beaucoup : referme (étape 8) et dis-le à Claude. N'active pas le CAPTCHA seul dans Supabase : il bloquerait la connexion de tes clients.
- **Si besoin, le comptage en base** : https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/sql/new → colle la ligne ci-dessous → **Run**. Les prospects sont sur la ligne `client · prospect`. Le nombre de tes clients ne doit pas bouger.
  ```sql
  select role, statut, count(*) from profils group by 1, 2;
  ```

**Débloquer un mot de passe oublié, à la main** (*à vérifier dans ton tableau de bord : le nom des boutons change selon les versions*)
1. Vérifie que l'email vient bien de **l'adresse du compte**. Sinon, confirme par un moyen que tu connais déjà (le WhatsApp d'un client, par exemple).
2. https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/auth/users → cherche son email → clique sur sa ligne.
3. **N'utilise pas** les boutons qui envoient un email (« Send password recovery », « Send magic link »…) : ils passent par l'email de Supabase, limité et réservé à ton équipe. La personne ne recevrait rien.
4. Cherche l'option qui te laisse **taper toi-même** un nouveau mot de passe (« Reset password », « Update password »… à vérifier). Mets un mot de passe provisoire (12 caractères au moins, jamais utilisé ailleurs), puis enregistre.
5. Envoie-le par un **canal sûr** : en réponse à son email (s'il vient bien de l'adresse du compte) ou par WhatsApp à un numéro que tu connais. Jamais en commentaire ni en story.
6. Demande-lui de le changer tout de suite : Profil → « Changer mon mot de passe ».
7. Tu ne trouves pas l'option : **ne supprime pas le compte** (un client perdrait ses données). Dis-le à Claude : il te prépare une autre façon de faire.

**Changer l'adresse de quelqu'un** : même principe, sur demande par email. Demande d'abord la marche à suivre à Claude (à vérifier dans ton tableau de bord).

---

## Étape 8 — Refermer en urgence

1. **Effet immédiat** : https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/auth/providers → **Allow new users to sign up** : **désactivé** → **Save**. Plus personne ne peut créer de compte. Les comptes existants (prospects et clients) continuent de marcher.
2. **Ensuite** : passe `inscription_libre: true` à `inscription_libre: false` dans `js/config.js`. Demande le commit à Claude (tu le pousses), ou fais-le toi-même : https://github.com/lcsmhx/mhx-plateforme/edit/main/js/config.js → Cmd+F `inscription_libre: true` → remplace `true` par `false` → « Commit changes ». N'importe quel message convient : le banc ne bloque jamais une fermeture. Le bouton « Créer mon compte » disparaît après la publication. Pas besoin de la publication d'urgence : le point 1 a déjà tout arrêté.
3. Retire le lien d'Instagram.

Pour rouvrir : étape 2, puis étape 5 (message « ouverture de l'inscription »).

---

## Historique (court)

- **27/09/2026 (v51)** : emails du compte par Brevo, accès découverte de 7 jours, relances automatiques. Abandonné.
- **28/09/2026 (matin)** : emails du compte par Gmail (SMTP), modèles d'email. Abandonné le soir même.
- **28/09/2026 (soir)** : version sans email : aucune vérification d'adresse, déblocage à la main, bouton bilan = simple lien. La branche `ouverture-inscription` (v51) est obsolète : ne jamais la pousser.
