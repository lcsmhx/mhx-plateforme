# Ouvrir l'inscription publique — marche à suivre pour Lucas (V2, mise à jour le 28/09/2026)

**Ce que ça change.** N'importe qui pourra créer son espace gratuit depuis ton lien Instagram. Il recevra un email de confirmation, répondra aux 3 questions, verra la proposition de bilan, puis son espace (calculateur, suivi du poids et des mensurations, Speed Formation).

**Les emails.** Seuls les emails du compte partent automatiquement : confirmation d'inscription, mot de passe oublié, changement d'adresse. Ils partent de **mhx.coaching@gmail.com, par Gmail**. Il n'y a aucun autre email automatique : pas de relance. La newsletter, c'est toi qui l'enverras plus tard, avec l'outil de ton choix (voir §7).

**Combien de temps.** Compte **une à deux heures**, dans l'ordre ci-dessous. L'ordre compte : dès que Supabase accepte les inscriptions, le premier email envoyé doit déjà être le bon. Rien n'est irréversible : tout se referme en deux clics (§8).

**Les liens Supabase.** Ils ouvrent directement la bonne page du projet `nzynbuczmogifuidcjed`. S'il te demande de te connecter, connecte-toi, puis rouvre le lien. S'il n'arrive pas au bon endroit, suis le chemin indiqué entre parenthèses (menu de gauche).

---

## 0. Avant de commencer (prérequis)

- [ ] **La V2 est en ligne** : le pied de page de l'app (https://lcsmhx.github.io/mhx-plateforme/) affiche une version **52 ou plus**. Il faut au moins la version qui termine la partie code du chantier 2 : Claude te dira laquelle. L'inscription y est encore fermée.
- [ ] **Les tests sont verts** : sur https://github.com/lcsmhx/mhx-plateforme/actions, la dernière ligne « Tests puis publication » a une coche verte.
- [ ] **Les textes légaux sont prêts** : `docs/CONFIDENTIALITE-BROUILLON.md` et `docs/MENTIONS-LEGALES-BROUILLON.md` sont complétés et relus. Leur version finale est publiée dans l'app, et le texte court de l'app dit la même chose (nouvelle version datée). Tant que ce n'est pas fait, n'ouvre pas.
- [ ] Tu as accès au **projet Supabase**, à la **boîte Gmail mhx.coaching@gmail.com** et au **téléphone** qui sert à la validation en 2 étapes de Google.
- [ ] Tu as **deux adresses email de test** que tu peux lire et qui n'ont pas de compte MHX. **Pas mhx.coaching@gmail.com**, puisque c'est elle qui envoie. Par exemple : un alias « +grok1 » de ton autre boîte Gmail, et si possible une adresse Outlook, Hotmail ou iCloud (leurs filtres anti-spam sont différents).
- [ ] Dans Supabase, tu ne touches qu'à **Authentication**. Rien d'autre : base, règles, fonctions.

---

## 1. Google : validation en 2 étapes, puis mot de passe d'application

Pourquoi : Supabase va envoyer les emails du compte **par ta boîte Gmail**. Pour ça, Google demande un « mot de passe d'application » : un code de 16 lettres réservé à Supabase. Ce n'est pas ton vrai mot de passe. Et Google ne le donne que si la validation en 2 étapes est active.

1. Connecte-toi à Google avec **mhx.coaching@gmail.com**. Vérifie en haut à droite que c'est bien ce compte, pas un compte personnel.
2. **Validation en 2 étapes** : https://myaccount.google.com/signinoptions/two-step-verification → « Activer », puis suis les étapes (ton téléphone). Si elle est déjà active, passe à la suite.
3. **Mot de passe d'application** : https://myaccount.google.com/apppasswords → nom : `Supabase MHX` → « Créer ».
   - Google affiche **16 lettres** en 4 groupes. Copie-les **sans les espaces**.
   - Elles ne s'affichent **qu'une fois**. Garde-les dans ton gestionnaire de mots de passe le temps de l'étape 2.
   - Ne les colle **nulle part ailleurs que dans Supabase** : ni dans l'app, ni dans le dépôt, ni dans un message (WhatsApp, Claude, Grok).
   - Si Google dit que ce réglage « n'est pas disponible pour votre compte » : la validation en 2 étapes n'est pas encore active (refais le point 2), ou ton compte n'utilise que des clés de sécurité.

À savoir : **si tu changes un jour le mot de passe de ce compte Google, les mots de passe d'application sont supprimés**. Les emails du compte ne partent plus. Il faut alors refaire le point 3, puis l'étape 2.

---

## 2. Supabase : envoyer les emails par Gmail (SMTP personnalisé)

Pourquoi : sans ce réglage, Supabase n'envoie des emails qu'aux membres de l'équipe du projet (toi). Aucun prospect ne recevrait son lien de confirmation.

1. Ouvre https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/auth/smtp (Authentication → Emails → SMTP Settings).
2. Active **Enable Custom SMTP**, puis remplis :

   | Champ | Valeur |
   |---|---|
   | Sender email | `mhx.coaching@gmail.com` |
   | Sender name | `MHX Coaching` |
   | Host | `smtp.gmail.com` |
   | Port number | `465` |
   | Username | `mhx.coaching@gmail.com` |
   | Password | les 16 lettres de l'étape 1 (sans espaces) |

   Laisse les autres champs comme ils sont, puis **Save**.
3. **Limite d'envoi** : https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/auth/rate-limits (Authentication → Rate Limits) → « Rate limit for sending emails » → **20 par heure** → Save.
   - Pourquoi 20 : un compte Gmail personnel peut écrire à **environ 500 destinataires par jour**. C'est à vérifier sur https://support.google.com/mail/answer/22839. Tes propres emails comptent dans ces 500. Avec 20 par heure, on reste en dessous (480 par jour au plus).
   - Au-delà de la limite, la personne voit dans l'app « Trop de demandes d'un coup : réessaie dans une minute ». C'est bien moins grave qu'un Gmail bloqué 24 heures, qui empêcherait aussi tes clients de recevoir « mot de passe oublié ».

---

## 3. Les modèles d'email (en français, à ton nom)

1. Ouvre https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/auth/templates (Authentication → Emails → Templates).
2. Pour chacun des trois modèles ci-dessous :
   - mets l'**objet** (Subject) ;
   - ouvre le lien du fichier (texte brut sur GitHub), sélectionne tout (Cmd+A) et copie (Cmd+C) ;
   - dans Supabase, dans le corps du modèle (onglet **Source** ou HTML), sélectionne tout, efface, colle ;
   - **Save**.

   | Modèle Supabase | Objet | Fichier à coller |
   |---|---|---|
   | **Confirm signup** (inscription) | `Confirme ton inscription MHX Coaching` | https://raw.githubusercontent.com/lcsmhx/mhx-plateforme/main/supabase/templates/confirmation.html |
   | **Reset Password** (mot de passe oublié, déjà utilisé par tes clients) | `Ton nouveau mot de passe MHX Coaching` | https://raw.githubusercontent.com/lcsmhx/mhx-plateforme/main/supabase/templates/mot-de-passe.html |
   | **Change Email Address** (changement d'adresse depuis le Profil) | `Confirme ta nouvelle adresse MHX Coaching` | https://raw.githubusercontent.com/lcsmhx/mhx-plateforme/main/supabase/templates/changement-email.html |

   - Les morceaux entre doubles accolades, comme `{{ .ConfirmationURL }}`, sont remplis par Supabase : **ne les modifie pas**.
   - Avant de coller, lis le texte : il ne doit parler ni de « 7 jours » ni d'« accès découverte ». Sinon, demande d'abord à Claude de mettre le fichier à jour.
   - L'aperçu à droite doit montrer le bouton doré.
   - Les autres modèles (Magic Link, Invite user, Reauthentication) ne servent pas : laisse-les.
3. **Durée de validité du lien** : https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/auth/providers (Authentication → Sign In / Providers) → panneau **Email** → « Email OTP Expiration » → `86400` (24 heures, pour ceux qui ouvrent leurs emails le soir) → Save.
4. **Premier essai d'envoi** : sur l'écran de connexion de l'app, « Mot de passe oublié » avec l'adresse du compte client de test. L'email doit arriver en moins de 5 minutes, de « MHX Coaching », avec le bon objet. Tu n'es pas obligé de changer le mot de passe.
   - S'il n'arrive pas : https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/logs/auth-logs (Logs → Auth). Un message avec « smtp » ou « authentication » veut dire que le mot de passe d'application est faux, ou qu'il a gardé des espaces : refais l'étape 1.3 puis l'étape 2.

---

## 4. Autoriser les inscriptions et exiger la confirmation d'email

1. **Vérification avant** : https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/sql/new (SQL Editor) → colle, puis **Run** :
   ```sql
   select count(*) from auth.users where email_confirmed_at is null;
   ```
   Le résultat doit être `0`. Sinon, arrête-toi et dis-le à Claude : ce compte-là ne pourrait plus se connecter.
2. **Adresses de retour** : https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/auth/url-configuration (Authentication → URL Configuration) :
   - **Site URL** : `https://lcsmhx.github.io/mhx-plateforme/`
   - **Redirect URLs** : `https://lcsmhx.github.io/mhx-plateforme/**`, s'il n'y est pas déjà. Les deux étoiles comptent : Supabase n'accepte de renvoyer le lien de l'email que vers les adresses de cette liste.
   - Save.
3. **Inscriptions** : https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/auth/providers (Authentication → Sign In / Providers) :
   - en haut, **Allow new users to sign up** : **activé** (il est désactivé aujourd'hui : c'est ce qui ferme l'inscription) ;
   - panneau **Email** : **Confirm email** : **activé** (sans ça, une adresse inventée créerait un compte) ; **Secure email change** : laisse-le activé ;
   - Save.
4. **Contrôle côté coach** : dans l'app, Comptes → « Créer le compte » avec ta deuxième adresse de test. Ce compte doit pouvoir se connecter tout de suite, sans email de confirmation (la fonction qui crée les comptes de tes clients confirme l'email elle-même). Supprime ensuite ce compte depuis Comptes.

À partir d'ici, une inscription est techniquement possible par Supabase, même si l'écran de l'app est encore caché. Enchaîne les étapes 5 et 6 dans la même journée.

---

## 5. Le test prospect complet (par Grok, avec un compte jetable)

Tant que l'étape 6 n'est pas faite, l'écran « Créer mon compte » n'existe pas sur le site en ligne. Deux façons de tester avant :

- **Méthode A (conseillée, rien n'est publié)** : demande à Claude d'ouvrir sur ton Mac une copie de la version en ligne, avec l'inscription ouverte. Elle utilise la vraie base, et seul ton Mac la voit. Claude te donne son adresse (du type `http://localhost:…`). Ajoute temporairement cette adresse suivie de `/**` dans **Redirect URLs** (étape 4.2), et **retire-la après le test**. Si Grok ne peut pas ouvrir cette adresse, fais le test toi-même avec la liste ci-dessous.
- **Méthode B (ouverture discrète)** : fais l'étape 6 sans partager le lien, lance le test dans l'heure, et ne mets le lien sur Instagram que si tout est bon. Sinon, passe à l'étape 8.

Donne à Grok une adresse de test qu'il peut lire. Sur téléphone, **déconnecté de l'app**. Le lien de l'email s'ouvre dans le navigateur habituel : si un autre compte y est connecté, l'app le dit et ne bascule pas. Il suffit alors de se déconnecter, puis de se connecter avec le compte de test.

**Inscription**
- [ ] L'écran « Crée ton espace gratuit » : prénom, nom, email, mot de passe. Aucun « 7 jours », aucun prix.
- [ ] 3 cases, **aucune cochée d'avance** :
  - « J'ai 18 ans ou plus et j'accepte les conditions d'utilisation et la politique de confidentialité » (obligatoire) ;
  - données de santé (obligatoire) ;
  - newsletter (facultative ; son texte finit par « … et j'accepte la mesure de leur ouverture. Désinscription en 1 clic dans chaque email. »).
- [ ] Sans la case des conditions, ou sans la case santé : un message clair, pas de compte. Sans la case newsletter : l'inscription passe.
- [ ] Le lien des conditions ouvre le texte. Il parle de Gmail pour les emails du compte, du suivi d'activité et de la newsletter.
- [ ] Après « Créer mon accès » : « Vérifie ta boîte mail », avec la bonne adresse.
- [ ] Connexion avant d'ouvrir l'email : « Ton email n'est pas encore confirmé… ».

**L'email**
- [ ] Il arrive en moins de 5 minutes. Noter dans quelle boîte : principale, promotions, indésirables. Tester Gmail et Outlook, Hotmail ou iCloud.
- [ ] Expéditeur « MHX Coaching » (mhx.coaching@gmail.com), objet « Confirme ton inscription MHX Coaching ».
- [ ] Texte en français, bouton visible, adresse du lien écrite en clair sous le bouton.

**Le lien**
- [ ] Un clic : l'app s'ouvre avec « Ton email est confirmé… Bienvenue ! », directement sur les 3 questions.
- [ ] Deuxième clic sur le même lien : « Ce lien n'est plus valable… » (ou « …tu es déjà dans ton espace »). Pas de boucle, pas de déconnexion.

**Les 3 questions**
- [ ] Objectif (perdre du gras, prendre du muscle, me remettre en forme), ce qui t'a bloqué, dans 3 mois. Les trois sont obligatoires.
- [ ] Recharger la page pendant la saisie : ce qui était écrit est toujours là.

**La page du bilan**
- [ ] Elle reprend la réponse « Dans 3 mois », avec le texte du bilan offert de 30 minutes, jusqu'à « Tu es libre de dire non ».
- [ ] Deux boutons de même taille : « Réserver mon bilan » et « Pas maintenant, découvrir mon espace ».

**Calendly**
- [ ] « Réserver mon bilan » ouvre Calendly dans un nouvel onglet, avec **prénom, nom et email déjà remplis**.
- [ ] Ne pas réserver de vrai créneau (ou réserver, puis annuler aussitôt en te prévenant).

**Accueil, calculateur, pesée**
- [ ] Une seule action mise en avant : « Calcule tes calories (2 min) ».
- [ ] Calculateur : avec un âge de 17 ans, un message clair et rien d'enregistré. Avec un âge adulte : le résultat, et la mention « pas un avis médical ».
- [ ] Ensuite, l'accueil propose « Enregistre ta pesée de départ ». La pesée est toujours là après rechargement de la page.
- [ ] Speed Formation ouverte.

**Pages verrouillées**
- [ ] Programme, Nutrition, Journal, Suivi : chacune montre un **exemple** marqué « Exemple », la phrase « Tu veux un programme construit pour toi, qui évolue chaque semaine ? Réserve ton bilan. » et le bouton « Réserver mon bilan ». Aucun prix nulle part.

**Langue et écran**
- [ ] L'app passée en anglais : tout est traduit.
- [ ] Sur téléphone, rien ne dépasse de l'écran. Sur ordinateur, tout est lisible.

**Côté coach** (toi)
- [ ] Page Prospects : la nouvelle personne, avec sa date d'inscription, ses 3 réponses, newsletter oui ou non, dernière visite et jours actifs. Le compteur « inscrits → 3 questions → bilans réservés → clients » a bougé.
- [ ] Sa fiche : le bouton « Bilan réservé » se coche, puis s'annule.
- [ ] Contrôle en base (SQL Editor) : `select role, statut, count(*) from profils group by 1, 2;` → une ligne `client · prospect` avec 1 de plus. Rien d'autre ne bouge.

**Newsletter : se désinscrire**
- [ ] Profil → couper l'interrupteur de la newsletter : un message le confirme. Côté coach : newsletter « non ». La personne ne figure plus dans l'export de la liste (§7). Le rallumer : de nouveau « oui ».

**Mot de passe oublié**
- [ ] « Mot de passe oublié » avec le compte de test : l'email arrive, le lien permet de choisir un nouveau mot de passe, et la connexion marche avec lui.

**Mes données et suppression**
- [ ] Profil → « Mes données » → « Télécharger toutes mes données » : un fichier se télécharge.
- [ ] « Supprimer mon compte » → taper `SUPPRIMER` → « Ton compte est supprimé ». La reconnexion est impossible. Le compte a disparu côté coach et dans https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/auth/users (Authentication → Users).

Refais au moins l'inscription et la réception de l'email avec la deuxième adresse (Outlook, Hotmail ou iCloud). Supprime ensuite tous les comptes de test (jamais un vrai client). Méthode A : retire l'adresse locale des Redirect URLs.

Si quelque chose ne va pas : note ce que tu vois (capture d'écran), n'ouvre pas, et donne-le à Claude.

---

## 6. Ouvrir l'inscription (c'est toi qui le fais)

Seulement quand les étapes 0 à 5 sont faites et bonnes. Il s'agit de passer `inscription_libre: false` à `inscription_libre: true` dans `index.html`. Deux façons :

- **Conseillée** : demande à Claude « prépare le commit d'ouverture de l'inscription ». Il change cette seule ligne, relance les tests, et **ne pousse pas**. Tu le pousses toi-même avec la commande qu'il te donne (`git -C /Users/lucasmahaux/MHX-Code/mhx-plateforme push origin main`).
- **Sans le terminal** : https://github.com/lcsmhx/mhx-plateforme/edit/main/index.html → cherche `inscription_libre: false` (Cmd+F) → remplace `false` par `true` → « Commit changes » (message : « ouverture de l'inscription »). Si GitHub dit que le fichier est trop gros pour être modifié en ligne, utilise la première façon.

Ensuite :
- GitHub relance les tests, puis publie **en 15 minutes environ**, et seulement si tout est vert : https://github.com/lcsmhx/mhx-plateforme/actions.
- Contrôle : sur l'écran de connexion de l'app, « Créer mon compte » apparaît, et https://lcsmhx.github.io/mhx-plateforme/#/inscription ouvre l'inscription.
- **Ne pousse jamais l'ancienne branche `ouverture-inscription`** : elle date de la v51 et effacerait la V2.

**Le lien à mettre sur Instagram** (bio, story, réponse automatique en message privé) : `https://lcsmhx.github.io/mhx-plateforme/#/inscription`

---

## 7. Après l'ouverture : ce que tu surveilles

**Chaque jour, la première semaine**
- **Page Prospects** : les nouveaux inscrits, leurs 3 réponses, le compteur « inscrits → 3 questions → bilans réservés → clients ».
- **Calendly** : à chaque bilan réservé, coche « Bilan réservé » dans la fiche du prospect. Après le bilan, si la personne s'engage : **« Passer client »** dans Comptes. Elle retrouve alors l'app complète.
- **Les emails** :
  - https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/logs/auth-logs : cherche « error sending » ou « smtp ».
  - Dans Gmail : le dossier « Envoyés » se remplit des emails de confirmation (c'est normal ; supprime-les tous les 3 mois, comme le prévoit la politique de confidentialité).
  - Un email « Mail Delivery Subsystem » veut dire qu'une adresse n'existe pas.
  - Surveille aussi les alertes de sécurité de Google.
- **Le volume** : au-delà de 20 emails par heure (§2.3), certaines inscriptions sont refusées pour une minute. Si ça arrive souvent, dis-le à Claude avant de monter la limite : Gmail personnel reste plafonné à environ 500 destinataires par jour.
- **Les faux comptes** (noms étranges, rafales) : n'active pas le CAPTCHA seul (voir plus bas). Dis-le à Claude.

**La newsletter**
- Rien ne part automatiquement. La liste des personnes qui ont coché la newsletter **s'exporte en CSV depuis l'espace coach** (prénom, nom, email, date de l'accord), pour l'outil d'envoi que tu choisiras.
- Avant chaque envoi, refais un export neuf : une personne qui s'est désinscrite dans l'app n'y est plus. Supprime le fichier de ton ordinateur une fois importé.
- Tant que l'outil n'est pas choisi, la politique de confidentialité le laisse « [À PRÉCISER] ». Complète-la avant le premier envoi.

**Les demandes des personnes**
- « Supprime mes données », « envoie-moi mes données » par email : réponds **dans le mois**. Pour supprimer : Comptes → supprimer le compte. Supprime aussi la réservation Calendly et le contact dans l'outil de la newsletter.

**Ce qu'il ne faut PAS faire**
- **CAPTCHA** : ne l'active jamais seul dans Supabase (Attack Protection → Captcha). L'app ne le gère pas encore : il bloquerait la connexion de tes clients. Si des faux comptes arrivent, Claude ajoute d'abord le code, puis tu l'actives.
- Ne désactive pas « Confirm email » pour aller plus vite : c'est lui qui filtre les fausses adresses.
- Ne désactive pas « Enable Custom SMTP » : tes clients ne recevraient plus « mot de passe oublié ».
- Ne touche pas aux règles de sécurité de la base (Row Level Security), aux fonctions ni à la table `profils`.
- Ne change pas le mot de passe du compte Google sans refaire les étapes 1.3 et 2 juste après.

---

## 8. Refermer en urgence

1. **Tout de suite, effet immédiat** : https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/auth/providers → **Allow new users to sign up** : **désactivé** → Save. Plus personne ne peut créer de compte. Les comptes déjà créés (prospects et clients) continuent de marcher.
2. **Ensuite, dans l'app** : `inscription_libre: true` redevient `false`. Soit Claude prépare le commit (tu le pousses), soit tu le fais sur GitHub comme à l'étape 6. Le bouton « Créer mon compte » disparaît une fois la publication faite (15 minutes environ). Pas besoin de la publication d'urgence : l'étape 1 a déjà tout arrêté.
3. **Si le problème vient des emails** (Gmail bloqué, mot de passe d'application refusé) : fais l'étape 1, puis regarde les journaux (§7). Tant que Gmail bloque, tes clients ne reçoivent pas non plus « mot de passe oublié » : préviens-les s'ils en ont besoin. Un blocage Gmail dure en général 24 heures.

Pour rouvrir : refais l'étape 4.3, puis l'étape 6.

---

## Historique (court)

- **27/09/2026 (v51)** : cette marche à suivre faisait passer les emails du compte par le SMTP de Brevo, et parlait d'un accès découverte de 7 jours, d'emails de suivi automatiques et d'un classement CHAUD / TIÈDE / FROID. Tout cela est abandonné en V2.
- **28/09/2026 (V2)** : emails du compte par Gmail, espace gratuit sans limite de durée, 3 questions et page de bilan. Aucun email automatique en dehors des emails du compte ; la newsletter est envoyée par Lucas lui-même, avec l'outil qu'il choisira, à partir de l'export CSV. La branche `ouverture-inscription` (v51) est obsolète : ne jamais la pousser.
