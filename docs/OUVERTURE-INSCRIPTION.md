# Ouvrir l'inscription publique (accès Découverte 7 jours) — marche à suivre (mise à jour le 27/09/2026)

Tout est prêt côté application : inscription simplifiée, écran « Découverte » (questionnaire court, résultat personnalisé, calories et macros, séance, recettes, Speed Formation pendant 7 jours, « Réserver mon bilan »), retour du lien de confirmation d'email (la personne arrive directement sur son questionnaire), écran « Vérifie ta boîte mail », suivi des prospects dans ta fiche coach (bloc « Découverte », pastilles, CHAUD / TIÈDE / FROID). Il reste **les réglages qui n'appartiennent qu'à toi** (Supabase, email) et un interrupteur dans l'app. Compte une à deux heures, **dans l'ordre ci-dessous** : l'ordre compte, parce que dès que Supabase autorise les inscriptions, le premier email envoyé doit déjà être le bon. Rien n'est irréversible : chaque étape se désactive de la même façon (§10).

## 0. Avant de commencer
- **La v51 est en ligne** : tu as poussé `main` (`git -C /Users/lucasmahaux/MHX-Code/mhx-plateforme push origin main`) et le pied de page de l'app affiche « 2026-09-27 · 51 ». L'inscription y est encore fermée.
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
Supabase → **Authentication → Emails → Templates**. Pour chacun des trois modèles ci-dessous : mets l'objet, puis, dans le corps (onglet **Source** / HTML), **efface tout et colle le contenu complet du fichier** indiqué (sur GitHub : ouvre le fichier → bouton **Raw** → tout sélectionner → copier). Les `{{ .ConfirmationURL }}`, `{{ .Email }}` et `{{ .NewEmail }}` sont remplis par Supabase : ne les modifie pas. **Save** après chacun.

| Modèle Supabase | Objet | Fichier à coller |
|---|---|---|
| **Confirm signup** (inscription) | `Confirme ton accès découverte MHX` | `supabase/templates/confirmation.html` |
| **Reset password** (mot de passe oublié, déjà utilisé par tes clients) | `Ton nouveau mot de passe MHX Coaching` | `supabase/templates/mot-de-passe.html` |
| **Change email address** (changement d'adresse depuis le Profil) | `Confirme ta nouvelle adresse MHX Coaching` | `supabase/templates/changement-email.html` |

Les trois ont la présentation des emails de suivi (fond clair, bouton doré, « MHX Coaching »), aucun prix, et l'adresse du lien en clair sous le bouton (pour les messageries qui bloquent les boutons). Supabase affiche un aperçu à droite : vérifie que le bouton apparaît.

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

**C'est déjà prêt** : la branche `ouverture-inscription` contient un seul commit par-dessus la v51 : `inscription_libre: true` (dans `CONFIG.marque`) et la version des conditions datée (`DECOUVERTE.confidentialite.version = "2026-09-27"`, enregistrée avec chaque inscription). Le banc a été rejoué dessus.

Juste avant : relis une dernière fois le texte des conditions (écran d'inscription → « Conditions d'utilisation et confidentialité »). Personne ne l'a encore accepté.

Puis, **seulement quand les étapes 1 à 4 sont faites et vérifiées**, une seule commande :

```bash
git -C /Users/lucasmahaux/MHX-Code/mhx-plateforme push origin ouverture-inscription:main
```

GitHub Pages met la nouvelle version en ligne en une à deux minutes. Tant que ce commit n'est pas poussé, l'écran « Créer mon compte » n'existe pas.

Autre façon, sans le terminal : sur GitHub, fichier `index.html` → crayon → `inscription_libre: false,` devient `inscription_libre: true,` → Commit changes.

## 6. Le test de bout en bout (avec l'adresse de test)
1. Sur ton téléphone, **déconnecté de l'app** (ou en navigation privée, mais le lien de l'email s'ouvrira dans le navigateur normal : déconnecte-toi aussi là) : `https://lcsmhx.github.io/mhx-plateforme/#/inscription` → prénom, adresse de test, mot de passe, case des conditions et case des données de santé → « Créer mon accès ».
2. Tu dois voir **« Vérifie ta boîte mail »** avec l'adresse.
3. Avant d'ouvrir l'email, essaie de te connecter avec ce compte : l'app doit dire « Ton email n'est pas encore confirmé : ouvre le lien reçu ».
4. Ouvre l'email (regarde dans les indésirables la première fois ; note dans quelle boîte il est arrivé, et où) → clique « Confirmer mon inscription » → l'app s'ouvre **directement sur « Découverte · Jour 1/7 »** avec le questionnaire et le mot « Ton email est confirmé (…). Bienvenue ! ». Remplis le questionnaire : ton résultat s'affiche, avec « Réserver mon bilan » (le lien Calendly doit contenir ton prénom et ton email).
5. Reclique le même lien dans l'email : « Ce lien n'est plus valable… » si tu es déconnecté, ou « …tu es déjà dans ton espace : rien à faire » si tu es connecté. Dans les deux cas, pas de boucle, pas de déconnexion.
6. Côté coach : Mes clients montre la nouvelle ligne avec « prospect » et « Découverte J1/7 » ; le tableau de bord compte 1 « Prospect en découverte » ; sa fiche montre le bloc « Découverte » (questionnaire rempli, réponses, clics « Réserver mon bilan »).
7. Contrôle en base (SQL Editor) : `select role, statut, count(*) from profils group by 1, 2;` → une ligne `client · prospect · 1` de plus, rien d'autre ne bouge.
8. Refais les étapes 1 à 4 avec l'adresse Outlook / Hotmail ou iCloud pour vérifier la réception (indésirables ?).
9. Supprime ensuite les comptes de test depuis **Comptes** dans l'app (jamais un vrai client).

Si l'email n'arrive pas : Supabase → **Logs → Auth** dit si l'envoi a échoué (identifiant SMTP faux, expéditeur non validé chez Brevo, limite atteinte) ; Brevo → **Statistiques** dit s'il est parti.

## 7. Ce qu'il ne faut PAS faire
- **CAPTCHA** : ne l'active jamais seul dans Supabase (Attack Protection → Captcha). L'app ne le gère pas encore : il bloquerait la connexion de tes clients. Si des comptes indésirables apparaissent, on ajoute d'abord le code (inscription + connexion + mot de passe oublié), puis on l'active.
- Ne désactive pas « Confirm email » après coup « pour aller plus vite » : c'est ce qui filtre les fausses adresses.
- Ne touche pas aux Row Level Security, aux fonctions ni à la table `profils`.
- Facultatif, si ton offre Supabase le permet (offre Pro) : **Authentication → Sign In / Providers → Email → « Prevent use of leaked passwords »** (refuse les mots de passe déjà apparus dans des fuites connues). Le conseiller de sécurité de Supabase le recommande ; rien ne change pour les comptes existants.

## 8. Le lien à mettre sur Instagram
`https://lcsmhx.github.io/mhx-plateforme/#/inscription` (bio, story, réponse automatique en DM). Le lien direct vers la connexion reste `https://lcsmhx.github.io/mhx-plateforme/`.

## 9. Et après l'ouverture : ce que tu regardes chaque jour
- **Mes clients** : les prospects portent « Découverte J n/7 » ou « Découverte terminée », « a cliqué Réserver », « bilan réservé ». Le tableau de bord compte les « Prospects en découverte ». La page **Prospects** les classe CHAUD / TIÈDE / FROID avec la prochaine action. (La liste est lue par pages de 1 000 lignes : elle reste complète même avec des centaines de prospects.)
- **La fiche d'un prospect** : bloc « Découverte » (jour, questionnaire court, ce qu'il a déjà essayé, son obstacle, sa motivation, ses clics, la case « J'ai réservé mon bilan »).
- Après le bilan, si la personne s'engage : **« Passer client »** dans Comptes → elle retrouve l'app complète, et ses premières réponses sont déjà dans son questionnaire.
- Les emails : compteur Brevo (300 par jour en gratuit), Supabase → Logs → Auth en cas de doute.
- Tu peux te tester toi-même à tout moment avec un compte prospect. Pour voir le jour 8 (Speed Formation verrouillée) sans attendre : `#/decouverte-jour/8` sur ton appareil ; `#/decouverte-jour/0` pour revenir au vrai jour. Rien n'est écrit en base.

## 9 bis. Les emails de suivi (facultatif, après l'ouverture)
L'app sait déjà demander l'accord (case facultative à l'inscription, interrupteur « Emails de suivi » dans le Profil du prospect). L'envoi lui-même (bienvenue, ton résultat après le questionnaire, relance à J3, via Brevo) est une fonction Supabase prête et testée mais **pas déployée** : marche à suivre complète dans `supabase/README.md` (clé API Brevo **et blocage des IP inconnues à désactiver chez Brevo**, table du journal, fonction, secrets, webhook des ouvertures, clics et désinscriptions, planification horaire, test). La page « Ne plus recevoir ces emails » (`desinscription.html`) est en ligne dès ton push, avec l'app. Tant qu'elle n'est pas déployée, aucun email de suivi ne part, et le score des prospects affiche « email ouvert : pas encore mesuré ».

## 10. Pour refermer (si besoin)
Dans l'ordre inverse : `inscription_libre: false` dans l'app (GitHub → `index.html` → crayon, ou demande-le-moi), puis « Allow new users to sign up » désactivé dans Supabase. Les comptes déjà créés restent et continuent de fonctionner.
