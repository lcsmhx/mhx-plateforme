# Vérification anti-robot (Cloudflare Turnstile) — mode d'emploi pour Lucas

Prête dans l'app depuis la v78, **éteinte** : tant que la clé n'est pas écrite, rien ne change pour personne.
Une fois allumée, un petit cadre « vérification » de Cloudflare apparaît sur l'écran de connexion et sur celui de création
de compte. Il bloque les robots (faux comptes, essais de mots de passe en série). Gratuit.

Ce qui ne change jamais : les comptes que tu crées toi-même (Mes clients), les clients déjà connectés (ils restent
connectés), le reste de l'app (le module de Cloudflare n'est chargé nulle part ailleurs).

**L'ordre compte** : d'abord la clé dans l'app (en ligne), ensuite Supabase. Pour éteindre : Supabase d'abord.
Dans l'autre ordre, plus personne ne peut se connecter ni s'inscrire (l'app dit alors « écris à ton coach »).

## 0. Avant de commencer : une décision à prendre
« Changer mon mot de passe » (Profil) revérifie l'ancien mot de passe par une connexion. Une fois Supabase allumé :
- **profil: false** (réglage actuel) : ce changement n'est plus possible depuis l'app ; l'app dit d'écrire au coach, et tu
  changes le mot de passe à la main ;
- **profil: true** : le même cadre de vérification apparaît aussi dans ce bloc du Profil, et le changement marche.

Dis à Claude ton choix (ou garde false).

## 1. Créer le widget chez Cloudflare (10 minutes)
1. Crée toi-même un compte gratuit : https://dash.cloudflare.com/sign-up (pas besoin d'ajouter de site).
2. Ouvre Turnstile : https://dash.cloudflare.com/?to=/:account/turnstile
3. Clique « Add widget », puis remplis :
   - « Widget name » : MHX Coaching – connexion ;
   - « Hostname management » → « Add Hostnames » : `lcsmhx.github.io` (sans https:// ni la suite) ;
   - « Widget mode » : **Managed** ;
   - « Pre-clearance support » : laisse sur non.
4. Clique « Create ». Tu obtiens deux clés :
   - la **Site Key** (publique, commence par `0x…`, environ 24 caractères) : elle va dans l'app ;
   - la **Secret Key** (secrète, plus longue) : elle va **seulement** dans Supabase (étape 4). Jamais dans un message,
     jamais dans le dépôt (il est public).

## 2. Mettre la clé de site dans l'app
Donne la **Site Key** à Claude (elle est publique : tu peux la coller dans la conversation). Il l'écrit dans
`js/config.js` (`turnstile: { cle_site: "0x…", profil: false }`), le banc vérifie que ce n'est pas une clé de test de
Cloudflare, puis il met en ligne sur ton « ok » (environ 10 minutes).

## 3. Vérifier que le cadre s'affiche
Quand le pied de page montre la nouvelle version :
- https://lcsmhx.github.io/mhx-plateforme/#/connexion : le cadre de Cloudflare est au-dessus du bouton « Se connecter » ;
- https://lcsmhx.github.io/mhx-plateforme/#/inscription : pareil, au-dessus de « Créer mon espace gratuit ».

Essaie aussi sur ton iPhone, et depuis le navigateur d'Instagram (lien en bio). À ce stade, Supabase ne demande encore
rien : tout le monde se connecte comme avant, même si le cadre ne s'affichait pas chez quelqu'un.

## 4. Allumer la vérification dans Supabase
Seulement si l'étape 3 est bonne.
1. Ouvre https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/auth/protection
   (menu Authentication → « Attack Protection »).
2. Dans « Bot and Abuse Protection » : active « Enable Captcha protection ».
3. « Choose Captcha Provider » : **Turnstile by Cloudflare**.
4. « Captcha secret » : colle la **Secret Key**.
5. Clique « Save changes ».

## 5. Tester tout de suite
- Connecte-toi avec le compte client de test : ça doit marcher (le cadre se valide seul en une ou deux secondes).
- Crée un compte d'essai avec une adresse à toi (par exemple `mhx.coaching+essai@gmail.com`), puis supprime-le
  (Mes clients → Comptes).
- Profil → « Changer mon mot de passe » sur le compte de test : avec profil: false, l'app dit d'écrire au coach (normal) ;
  avec profil: true, le changement marche.

Un problème ? Retour arrière tout de suite (étape 6), puis dis-le à Claude.

## 6. Retour arrière
1. **D'abord Supabase** : même page, désactive « Enable Captcha protection », puis « Save changes ». Tout redevient comme
   avant, tout de suite.
2. Ensuite seulement (si tu veux enlever le cadre) : demande à Claude de vider la clé dans `js/config.js`.

## À savoir
- Turnstile est gratuit. La protection CAPTCHA de Supabase : à confirmer sur le plan gratuit en ouvrant la page de
  l'étape 4 (si elle demande un plan payant, on s'arrête : rien n'est allumé).
- Politique de confidentialité : le paragraphe Cloudflare est prêt dans `docs/CONFIDENTIALITE-BROUILLON.md` (§5, §6,
  §11, §12 et le point 19, avec la question CNIL à trancher) : à valider, et le texte court de l'app à mettre à jour,
  avant l'étape 4.
- Jamais une clé « de test » de Cloudflare (`1x0000…`, `2x0000…`, `3x0000…`) dans l'app : elle laisserait passer les
  robots ou bloquerait tout le monde. Le banc la refuse sur main.
