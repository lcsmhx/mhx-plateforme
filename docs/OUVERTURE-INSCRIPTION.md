# Ouvrir l'inscription publique — marche à suivre pour Lucas

*V2, version sans email. Mise à jour le 28/09/2026 au soir.*

Fais les étapes **une à la fois, dans l'ordre**. Chacune dit quoi ouvrir, quoi vérifier et quoi faire si ce n'est pas bon. Compte environ une heure, test compris. Tout se referme en un clic (étape 8).

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

Il est désactivé aujourd'hui : c'est lui qui ferme l'inscription. À partir de maintenant, une inscription est possible même si l'écran de l'app est encore caché : enchaîne les étapes 3 à 6 le même jour.

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
- **ou toi-même** : https://github.com/lcsmhx/mhx-plateforme/edit/main/index.html → Cmd+F `calendly:` → remplace le lien entre les guillemets (garde les guillemets) → « Commit changes ». Si GitHub refuse de modifier ce gros fichier en ligne, passe par Claude.

Attends ensuite la coche verte (https://github.com/lcsmhx/mhx-plateforme/actions).

À savoir : prénom, nom et email se remplissent tout seuls avec un lien Calendly. Avec un autre outil de réservation, le bouton marche, mais les champs restent vides.

---

## Étape 5 — Ouvrir l'app (c'est toi qui le fais)

Il faut passer `inscription_libre: false` à `inscription_libre: true` dans `index.html`. Deux façons :
- **Conseillée** : demande à Claude « prépare le commit d'ouverture de l'inscription (`inscription_libre: true`) ». Il change cette seule ligne, relance les tests et **ne pousse pas**. Tu pousses toi-même avec la commande qu'il te donne (`git -C /Users/lucasmahaux/MHX-Code/mhx-plateforme push origin main`).
- **Sans le terminal** : https://github.com/lcsmhx/mhx-plateforme/edit/main/index.html → Cmd+F `inscription_libre: false` → remplace `false` par `true` → « Commit changes » (message : « ouverture de l'inscription »).

Ensuite :
1. Attends la coche verte « Tests puis publication » (une quinzaine de minutes) : https://github.com/lcsmhx/mhx-plateforme/actions
2. Ouvre https://lcsmhx.github.io/mhx-plateforme/#/inscription : tu dois voir l'écran **« Crée ton espace gratuit »**. Si tu vois encore la connexion, recharge la page (le téléphone garde parfois l'ancienne version quelques minutes).
3. **Ne mets pas encore le lien sur Instagram** : d'abord le test de l'étape 6.

Ne pousse jamais l'ancienne branche `ouverture-inscription` (v51) : elle effacerait la V2.

---

## Étape 6 — Le test prospect complet (par Grok)

Donne à Grok :
- le lien https://lcsmhx.github.io/mhx-plateforme/#/inscription ;
- une **adresse jetable à toi**, sans compte MHX : par exemple ton adresse Gmail avec `+grok1` juste avant le @. Jamais l'adresse de quelqu'un d'autre. Aucun email n'arrivera : c'est normal ;
- la liste ci-dessous, à faire sur téléphone, sans être connecté à un autre compte MHX. Il coche la case newsletter à l'inscription.

**Inscription**
- [ ] « Crée ton espace gratuit » : prénom, nom, email, mot de passe. Aucun « 7 jours », aucun prix.
- [ ] 3 cases, **aucune cochée d'avance** : « J'ai 18 ans ou plus et j'accepte les conditions d'utilisation et la politique de confidentialité » (obligatoire) ; données de santé (obligatoire) ; newsletter (facultative, finit par « Désinscription en 1 clic dans chaque email. »).
- [ ] Sans la case des conditions ou sans la case santé : un message clair, pas de compte.
- [ ] Le lien des conditions ouvre le texte : il ne parle ni de « 7 jours », ni d'emails de confirmation envoyés par Gmail.
- [ ] Après la création : directement les 3 questions, **sans « Vérifie ta boîte mail »** (sinon : revoir l'étape 1).

**Les 3 questions et la page du bilan**
- [ ] Objectif (perdre du gras / prendre du muscle / me remettre en forme), ce qui t'a bloqué, dans 3 mois.
- [ ] La page du bilan reprend la réponse « dans 3 mois ». Deux boutons de même taille : « Réserver mon bilan » et « Pas maintenant, découvrir mon espace ».
- [ ] « Réserver mon bilan » ouvre la page de réservation avec **prénom, nom et email déjà remplis**. Ne pas réserver de vrai créneau (ou annuler aussitôt).

**L'espace gratuit**
- [ ] Accueil : une seule action mise en avant, « Calcule tes calories (2 min) ».
- [ ] Calculateur : avec 17 ans, un message clair et rien d'enregistré ; avec un âge adulte, le résultat et la mention « pas un avis médical ».
- [ ] Ensuite : « Enregistre ta pesée de départ ». La pesée est toujours là après rechargement de la page.
- [ ] Speed Formation ouverte.
- [ ] Programme, Nutrition, Journal, Suivi : chacune montre un **exemple**, la phrase « … Réserve ton bilan. » et le bouton « Réserver mon bilan ». Aucun prix.

**Profil**
- [ ] Newsletter coupée dans le Profil : un message le confirme.
- [ ] Changer d'adresse email : le message « Écris-nous à mhx.coaching@gmail.com, on te débloque rapidement. »
- [ ] Déconnexion → « Mot de passe oublié ? » : le même message, aucun email. Reconnexion avec le mot de passe : ça marche.

**Côté coach (toi, avant la suppression du compte)**
- [ ] https://lcsmhx.github.io/mhx-plateforme/#/prospects → sa fiche : son **nom**, ses **3 réponses**, **newsletter** « oui » avant le retrait dans le Profil, « non » après.

**Suppression (en dernier)**
- [ ] Profil → « Mes données » → « Supprimer mon compte » → taper `SUPPRIMER` → « Ton compte est supprimé ». Reconnexion impossible. Le compte a disparu de Prospects et de https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/auth/users.

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
2. **Ensuite** : demande à Claude le commit `inscription_libre: false` (tu le pousses), ou fais-le sur GitHub comme à l'étape 5. Le bouton « Créer mon compte » disparaît après la publication. Pas besoin de la publication d'urgence : le point 1 a déjà tout arrêté.
3. Retire le lien d'Instagram.

Pour rouvrir : étape 2, puis étape 5.

---

## Historique (court)

- **27/09/2026 (v51)** : emails du compte par Brevo, accès découverte de 7 jours, relances automatiques. Abandonné.
- **28/09/2026 (matin)** : emails du compte par Gmail (SMTP), modèles d'email. Abandonné le soir même.
- **28/09/2026 (soir)** : version sans email : aucune vérification d'adresse, déblocage à la main, bouton bilan = simple lien. La branche `ouverture-inscription` (v51) est obsolète : ne jamais la pousser.
