# Ouvrir l'inscription publique au Challenge 7 jours — marche à suivre (v47, 26/09/2026)

Tout est prêt côté application : inscription simplifiée, challenge complet (7 jours), retour du lien de confirmation d'email (la personne arrive directement sur son jour 1), écran « Vérifie ta boîte mail », pastilles et bloc « Challenge 7 jours » dans ta fiche coach. Il reste **les réglages qui n'appartiennent qu'à toi** (Supabase, email) et un interrupteur dans l'app. Compte une à deux heures, **dans l'ordre ci-dessous** : l'ordre compte, parce que dès que Supabase autorise les inscriptions, le premier email envoyé doit déjà être le bon. Rien n'est irréversible : chaque étape se désactive de la même façon (§10).

## 0. Avant de commencer
- Tu as la main sur le projet Supabase `nzynbuczmogifuidcjed` (tableau de bord → Authentication) et sur la boîte `mhx.coaching@gmail.com`.
- Prévois **deux adresses email de test** que tu contrôles et qui n'ont pas de compte MHX : un alias Gmail (`mhx.coaching+test1@gmail.com`) et, si tu peux, une adresse Outlook / Hotmail ou iCloud (les filtres anti-spam y sont différents).
- Ne touche à rien d'autre dans Supabase (base, règles, fonctions) : ce guide ne concerne que **Authentication**.
- À savoir pour tes tests : le lien de l'email s'ouvre dans ton navigateur habituel. **Si un autre compte y est déjà connecté (le tien, coach), l'app ne bascule pas** : elle te le dit (« Un autre compte est déjà connecté sur cet appareil… »), l'email du compte de test est quand même confirmé, et il te suffit de te déconnecter puis de te connecter avec le compte de test. C'est voulu : un lien envoyé par un inconnu ne doit jamais faire entrer quelqu'un dans un autre compte.

## 1. Un service d'envoi d'emails (SMTP externe, gratuit) — à faire en premier
Pourquoi : le service d'email intégré de Supabase **n'envoie qu'aux adresses de l'équipe du projet** (toi). Sans SMTP externe, aucun prospect ne recevrait jamais son lien de confirmation. Une offre gratuite suffit largement.

**Brevo** (ex-Sendinblue, offre gratuite : 300 emails par jour, sans carte bancaire) est le plus simple quand on envoie depuis une adresse Gmail. Resend est très bien aussi mais demande un nom de domaine à toi (pas une adresse Gmail).

1. Crée un compte sur brevo.com avec `mhx.coaching@gmail.com`. Confirme ton email, remplis le profil (nom : MHX Coaching, adresse postale demandée par la loi anti-spam).
2. Dans Brevo : **Expéditeurs et IP → Expéditeurs → Ajouter un expéditeur** : nom « MHX Coaching », email `mhx.coaching@gmail.com`. Brevo t'envoie un email de validation : clique le lien.
   - Limite à connaître : un expéditeur `@gmail.com` envoyé par Brevo n'est pas « aligné » avec Gmail, donc **une partie des emails peut partir en indésirables** (surtout chez Outlook / Hotmail). D'où le test de réception du §6 sur plusieurs boîtes, et la mention « regarde dans les indésirables » déjà dans l'app. La solution durable, quand tu voudras : un nom de domaine à toi (par exemple `mhx-coaching.fr`, quelques euros par an) comme adresse d'envoi.
3. Dans Brevo : **SMTP et API → SMTP** : note les quatre valeurs affichées sur cette page :
   - serveur : `smtp-relay.brevo.com`
   - port : `587`
   - **identifiant : celui affiché sur la page** (souvent de la forme `xxxxx@smtp-brevo.com` ; ce n'est pas forcément l'email de ton compte Brevo, et avec le mauvais rien ne part)
   - mot de passe : la **clé SMTP** (bouton « Générer une nouvelle clé SMTP » ; copie-la tout de suite, elle n'est montrée qu'une fois ; ne la colle jamais dans l'app ni dans le dépôt).
4. Dans Supabase : **Authentication → Emails → SMTP Settings** (ou *Project Settings → Authentication → SMTP*, selon la version du tableau de bord) : active **Enable Custom SMTP** puis :
   - Sender email : `mhx.coaching@gmail.com`
   - Sender name : `MHX Coaching`
   - Host : `smtp-relay.brevo.com` · Port : `587`
   - Username : l'identifiant de l'étape 3 · Password : la clé SMTP
   - Save.
5. Toujours dans Supabase, **Authentication → Rate Limits** : « Rate limit for sending emails » → **100 par heure** (possible dès qu'un SMTP externe est actif ; une story Instagram peut amener beaucoup d'inscriptions d'un coup, et au-delà de la limite l'inscription est refusée avec le message « Trop de demandes d'un coup : réessaie dans une minute »). Brevo gratuit = 300 par jour : surveille le compteur Brevo les premiers jours.

## 2. Les adresses de retour (le lien de l'email doit revenir dans l'app)
Supabase → **Authentication → URL Configuration** :
- **Site URL** : `https://lcsmhx.github.io/mhx-plateforme/`
- **Redirect URLs** : ajoute `https://lcsmhx.github.io/mhx-plateforme/**` (les deux étoiles comptent) si ce n'est pas déjà là. L'app envoie elle-même son adresse exacte à chaque inscription ; Supabase n'accepte que les adresses de cette liste.
- Save.

## 3. Les modèles d'email (en français, à ton nom)
Supabase → **Authentication → Emails → Templates**.

**Confirm signup** — objet : `Confirme ton inscription au Challenge 7 jours` ; corps (le `{{ .ConfirmationURL }}` est obligatoire, ne le modifie pas) :

```html
<h2>Bienvenue dans le Challenge 7 jours</h2>
<p>Un clic et tu arrives directement sur ton jour 1 :</p>
<p><a href="{{ .ConfirmationURL }}">Confirmer mon inscription</a></p>
<p>Ce lien ne sert qu'une fois. Si tu n'es pas à l'origine de cette inscription, ignore simplement cet email.</p>
<p>À tout de suite,<br>Lucas — MHX Coaching</p>
```

**Reset password** (mot de passe oublié, déjà utilisé par tes clients) — objet : `Ton nouveau mot de passe MHX Coaching` ; corps :

```html
<h2>Nouveau mot de passe</h2>
<p>Tu as demandé à changer ton mot de passe. Clique ici pour en choisir un nouveau :</p>
<p><a href="{{ .ConfirmationURL }}">Choisir mon nouveau mot de passe</a></p>
<p>Si tu n'as rien demandé, ignore cet email : ton mot de passe reste le même.</p>
<p>Lucas — MHX Coaching</p>
```

Durée de validité du lien : **Authentication → Sign In / Providers → Email → « Email OTP Expiration »** (c'est là, pas dans Emails) : mets `86400` secondes (24 h) plutôt que l'heure par défaut, pour les gens qui ouvrent leur boîte mail le soir. Un lien ne sert qu'une fois : un deuxième clic affiche « Ce lien n'est plus valable » et propose de se connecter (c'est normal).

## 4. Autoriser les inscriptions et exiger la confirmation d'email
Avant d'activer, une vérification dans **SQL Editor** :

```sql
select count(*) from auth.users where email_confirmed_at is null;
```
Le résultat doit être `0` (tous les comptes existants sont déjà confirmés ; sinon, dis-le-moi avant de continuer : ce compte-là ne pourrait plus se connecter).

Puis Supabase → **Authentication → Sign In / Providers** :
- en haut, section **User Signups** : **Allow new users to sign up** : activé (aujourd'hui désactivé : c'est ce qui ferme l'inscription) ;
- plus bas, panneau **Email** : **Confirm email** : activé (sans ça, n'importe quelle adresse fausse créerait un compte) ; **Secure email change** : laisse activé ;
- Save.

Contrôle juste après : dans l'app, **Comptes → Créer le compte** avec ta deuxième adresse de test → ce compte doit pouvoir se connecter tout de suite, sans email de confirmation (la fonction serveur `creer-acces` marque l'email comme confirmé : vérifié le 26/09/2026 dans son code, côté Supabase ; ce contrôle le reteste de toute façon). Supprime ensuite ce compte de test depuis Comptes.

À partir de cette étape, l'inscription est techniquement possible par l'API Supabase même si l'écran de l'app n'existe pas encore : c'est pour ça que les étapes 1 à 3 viennent avant.

## 5. Ouvrir l'inscription dans l'application (en dernier)
Dans `index.html`, une seule ligne, dans `CONFIG.marque` (vers la ligne 990) :

```js
inscription_libre: false,
```
devient
```js
inscription_libre: true,
```

Deux façons : (a) tu me le demandes (commit dédié « ouverture », avec le banc rejoué) — recommandé ; (b) tu le fais toi-même sur GitHub (fichier `index.html` → crayon → modifier la ligne → Commit changes). GitHub Pages met la nouvelle version en ligne en une à deux minutes (le pied de page de l'app affiche la version).

Tant que cette ligne vaut `false`, l'écran « Créer mon compte » n'existe pas.

## 6. Le test de bout en bout (avec l'adresse de test)
1. Sur ton téléphone, **déconnecté de l'app** (ou en navigation privée, mais le lien de l'email s'ouvrira dans le navigateur normal : déconnecte-toi aussi là) : `https://lcsmhx.github.io/mhx-plateforme/#/inscription` → prénom, adresse de test, mot de passe, case des conditions → « Commencer le challenge ».
2. Tu dois voir **« Vérifie ta boîte mail »** avec l'adresse.
3. Avant d'ouvrir l'email, essaie de te connecter avec ce compte : l'app doit dire « Ton email n'est pas encore confirmé : ouvre le lien reçu ».
4. Ouvre l'email (regarde dans les indésirables la première fois ; note dans quelle boîte il est arrivé, et où) → clique « Confirmer mon inscription » → l'app s'ouvre **directement sur « Jour 1 / 7 · Ton point de départ »** avec le mot « Ton email est confirmé (…). Bienvenue dans le challenge ! ».
5. Reclique le même lien dans l'email : « Ce lien n'est plus valable… » si tu es déconnecté, ou « …tu es déjà dans ton espace : rien à faire » si tu es connecté. Dans les deux cas, pas de boucle, pas de déconnexion.
6. Côté coach : Mes clients montre la nouvelle ligne avec « prospect » et « Challenge 0/7 » ; sa fiche dit « Challenge 7 jours : pas encore commencé ».
7. Contrôle en base (SQL Editor) : `select role, statut, count(*) from profils group by 1, 2;` → une ligne `client · prospect · 1` de plus, rien d'autre ne bouge.
8. Refais les étapes 1 à 4 avec l'adresse Outlook / Hotmail ou iCloud pour vérifier la réception (indésirables ?).
9. Supprime ensuite les comptes de test depuis **Comptes** dans l'app (jamais un vrai client).

Si l'email n'arrive pas : Supabase → **Logs → Auth** dit si l'envoi a échoué (identifiant SMTP faux, expéditeur non validé chez Brevo, limite atteinte) ; Brevo → **Statistiques** dit s'il est parti.

## 7. Ce qu'il ne faut PAS faire
- **CAPTCHA** : ne l'active jamais seul dans Supabase (Attack Protection → Captcha). L'app ne le gère pas encore : il bloquerait la connexion de tes clients. Si des comptes indésirables apparaissent, on ajoute d'abord le code (inscription + connexion + mot de passe oublié), puis on l'active.
- Ne désactive pas « Confirm email » après coup « pour aller plus vite » : c'est ce qui filtre les fausses adresses.
- Ne touche pas aux Row Level Security, aux fonctions ni à la table `profils`.

## 8. Le lien à mettre sur Instagram
`https://lcsmhx.github.io/mhx-plateforme/#/inscription` (bio, story, réponse automatique en DM). Le lien direct vers la connexion reste `https://lcsmhx.github.io/mhx-plateforme/`.

## 9. Et après l'ouverture : ce que tu regardes chaque jour
- **Mes clients** : les prospects portent « Challenge n/7 », « Challenge terminé », « a cliqué Réserver », « appel réservé ». Le tableau de bord compte les challenges terminés. (La liste est lue par pages de 1 000 lignes : elle reste complète même avec des centaines de prospects.)
- **La fiche d'un prospect** : bloc « Challenge 7 jours » (ses choix des jours 2 à 6, ses clics, la case « J'ai réservé »), ses réponses du jour 1 dans le questionnaire.
- Après l'appel, si la personne s'engage : **« Passer client »** dans Comptes → elle retrouve l'app complète, ses réponses du challenge restent (et son bloc « Challenge 7 jours » reste dans sa fiche).
- Les emails : compteur Brevo (300 par jour en gratuit), Supabase → Logs → Auth en cas de doute.
- Tu peux te tester toi-même à tout moment avec un compte prospect et le mode test `#/challenge-libre` (jours débloqués sur cet appareil ; `#/challenge-rythme` pour revenir au rythme normal).

## 10. Pour refermer (si besoin)
Dans l'ordre inverse : `inscription_libre: false` dans l'app, puis « Allow new users to sign up » désactivé dans Supabase. Les comptes déjà créés restent et continuent de fonctionner.
