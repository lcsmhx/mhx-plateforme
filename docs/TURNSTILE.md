# Vérification anti-robot (Cloudflare Turnstile) — mode d'emploi pour Lucas

Prête dans l'app depuis la v78, **éteinte** : tant que la clé n'est pas écrite, rien ne change pour personne.
Une fois la clé en ligne, un petit cadre « vérification » de Cloudflare apparaît sous le bouton de l'écran de connexion et
de celui de création de compte. Une fois le CAPTCHA allumé dans Supabase, il bloque les robots (faux comptes, essais de mots
de passe en série). Gratuit.

Ce qui ne change pas : la création d'un accès par toi (Mes clients → Créer un accès), les clients déjà connectés (ils
restent connectés), le reste de l'app (le module de Cloudflare n'est chargé nulle part ailleurs). **Une exception** :
« Changer mon mot de passe » dans le Profil, y compris pour le mot de passe provisoire d'un accès que tu as créé ou d'un
déblocage (voir l'étape 0).

**L'ordre compte** :
1. la confidentialité d'abord (étape 2) : Cloudflare reçoit des données dès que la clé est en ligne, avant même Supabase ;
2. la clé dans l'app (étape 3), puis la vérification sur le vrai site (étape 4) ;
3. au moins 1 à 2 jours plus tard (étape 5), le CAPTCHA dans Supabase (étape 6).

Pour éteindre : **Supabase d'abord** (étape 9). Dans l'autre ordre, plus personne ne peut se connecter ni s'inscrire.

## 0. Avant de commencer : le Profil (une décision à prendre)
« Changer mon mot de passe » (Profil) revérifie l'ancien mot de passe par une connexion. Une fois Supabase allumé :
- **profil: true (conseillé)** : le même cadre de vérification apparaît aussi dans ce bloc du Profil, et le changement
  marche pour tout le monde ;
- **profil: false** (réglage actuel) : plus personne ne peut changer son mot de passe depuis l'app (l'app dit de fermer et
  rouvrir l'app, puis d'écrire au coach). Surtout, un client ne peut plus remplacer le mot de passe provisoire que tu lui
  donnes (accès créé dans Mes clients, ou déblocage) : c'est toi qui choisis son mot de passe définitif, et tu le connais.

Si tu gardes false, trois textes deviennent faux et doivent changer dans la même mise en ligne que l'étape 6 :
- la note de Mes clients → Créer un accès (« Elle pourra changer son mot de passe et son adresse elle-même, depuis son
  profil ») ;
- le déblocage à la main de `docs/OUVERTURE-INSCRIPTION.md` (étape 7, point 6 : « Profil → Changer mon mot de passe ») ;
- la politique de confidentialité, §2 (« Le coach ne le voit jamais », « un mot de passe provisoire, que tu changes
  aussitôt dans ton Profil »), §8 et §12 (même idée).

Dis ton choix à Claude avant l'étape 3 : true se règle dans la même mise en ligne que la clé (et la politique dit alors
que le cadre sert aussi dans le Profil, étape 2).

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
   - la **Secret Key** (secrète, plus longue) : elle va **seulement** dans Supabase (étape 6). Jamais dans un message,
     jamais dans le dépôt (il est public).

## 2. Mettre à jour la confidentialité (AVANT la clé)
Dès que la clé est en ligne (étape 3), chaque visiteur de l'écran de connexion ou de création de compte envoie son adresse
IP et des informations sur son navigateur à Cloudflare (États-Unis), même si Supabase est encore éteint. La personne qui
s'inscrit doit en être informée avant. Donc, avant l'étape 3 :
1. relis et valide le paragraphe Cloudflare de `docs/CONFIDENTIALITE-BROUILLON.md` (§2.1, §3, §5, §6, §11, §12 et le point 19,
   avec la question CNIL à trancher), avec la ligne du Profil si tu choisis profil: true ;
2. demande à Claude de mettre à jour le texte court de l'app (`DECOUVERTE.confidentialite`, en français et en anglais,
   nouveau numéro de version) : ajouter Cloudflare, et retirer Google Fonts (les polices sont hébergées avec l'app depuis
   la v66) ;
3. mets à jour les PDF (dossier Drive « MHX legal »).

Le banc le vérifie : sur main, une clé remplie est refusée tant que le texte court de l'app ne cite pas Cloudflare (en
français et en anglais) ou cite encore Google Fonts.

À savoir : le module de Cloudflare tourne dans la page, avec les mêmes droits que l'app. Techniquement, il pourrait lire ce
qui est tapé sur ces écrans (email, mot de passe). Cloudflare s'engage à ne pas le faire : allumer Turnstile, c'est faire
confiance à Cloudflare sur ce point.

## 3. Mettre la clé de site dans l'app
Donne la **Site Key** à Claude (elle est publique : tu peux la coller dans la conversation), avec ton choix pour le
Profil. Il l'écrit dans `js/config.js` (`turnstile: { cle_site: "0x…", profil: true }`), le banc vérifie que ce n'est pas
une clé de test de Cloudflare ni une clé secrète, et que la confidentialité est à jour (étape 2), puis il met en ligne sur
ton « ok » (environ 10 minutes).

## 4. Vérifier sur le vrai site : la coche verte
Quand le pied de page de la connexion montre la nouvelle version, ouvre :
- https://lcsmhx.github.io/mhx-plateforme/#/connexion
- https://lcsmhx.github.io/mhx-plateforme/#/inscription

Le cadre de Cloudflare est sous le bouton. Il doit afficher la **coche verte « Réussite ! »** (« Success! » en anglais)
au bout d'une ou deux secondes. Vérifie-le :
- dans Safari sur ton iPhone ;
- dans le navigateur d'Instagram (le lien de ta bio) ;
- dans celui de TikTok (et de Facebook si tu y mets le lien) ;
- dans le Profil aussi, bloc « Changer mon mot de passe », si tu as choisi profil: true.

Si le cadre affiche « Erreur », un numéro (par exemple 110200 : nom de domaine pas déclaré chez Cloudflare ; 110100 ou
110110 : clé fausse), ou reste sur « Vérification… » : **on s'arrête là, pas d'étape 6**. Envoie une capture à Claude.
À ce stade, Supabase ne demande encore rien : tout le monde se connecte comme avant, même si le cadre est en erreur.

## 5. Attendre 1 à 2 jours
Les pages ouvertes avant l'étape 3 gardent l'ancienne version (onglet resté ouvert, app installée sur l'écran d'accueil,
navigateur d'Instagram mis en veille) : elles n'ont pas le cadre, et l'app ne se recharge pas toute seule. Laisse au moins
1 à 2 jours entre l'étape 3 et l'étape 6 : la plupart des appareils auront rouvert l'app entre-temps.

## 6. Allumer la vérification dans Supabase
Seulement si l'étape 4 est bonne.
1. Ouvre https://supabase.com/dashboard/project/nzynbuczmogifuidcjed/auth/protection
   (menu Authentication → « Attack Protection »).
2. Dans « Bot and Abuse Protection » : active « Enable Captcha protection ».
3. « Choose Captcha Provider » : **Turnstile by Cloudflare**.
4. « Captcha secret » : colle la **Secret Key** (pas la Site Key).
5. Clique « Save changes ».

## 7. Tester tout de suite
- Connecte-toi avec le compte client de test : ça doit marcher (le cadre se valide seul en une ou deux secondes).
- Crée un compte d'essai avec une adresse à toi (par exemple `mhx.coaching+essai@gmail.com`), puis supprime-le
  (Mes clients → Comptes).
- Profil → « Changer mon mot de passe » sur le compte de test : avec profil: true, le changement marche ; avec
  profil: false, l'app dit que ce n'est pas possible (normal, voir l'étape 0).

Un problème ? Retour arrière tout de suite (étape 9), puis dis-le à Claude.

## 8. Les jours suivants : ce que tes clients peuvent voir, et quoi répondre
| Ce que la personne voit | Pourquoi | Que faire |
|---|---|---|
| « Impossible pour le moment (vérification de sécurité). Ferme et rouvre l'app… » | une page ouverte avant l'étape 3, jamais rechargée | fermer complètement l'app (ou recharger la page), puis réessayer |
| Un texte anglais « captcha protection: request disallowed… », ou « Service momentanément indisponible, réessaie dans une minute. » qui revient à la connexion ; « Inscription impossible pour le moment. Réessaie dans une minute. » qui revient à la création de compte ; « Ton mot de passe actuel n'est pas le bon. » dans le Profil alors qu'il est bon | une page ouverte avec une version d'avant la v78 | même réponse : fermer complètement l'app (ou recharger la page), puis réessayer. Ce n'est pas son mot de passe |
| « La vérification anti-robot n'est pas encore terminée… » | téléphone lent, navigateur intégré, ou une case à cocher | attendre la coche verte sous le bouton (ou cocher la case), puis réessayer |
| « … n'a pas été acceptée » à chaque essai, chez tout le monde | souvent la Secret Key mal collée dans Supabase (par exemple la Site Key à sa place) | étape 9 (Supabase d'abord), puis recoller la bonne Secret Key et refaire les étapes 6 et 7 |
| « … a échoué » ou « … n'a pas pu se charger » chez tout le monde, ou plus personne ne passe | Cloudflare en panne, ou un réglage cassé | **étape 9 tout de suite (Supabase d'abord)** : tout le monde repasse aussitôt |

## 9. Retour arrière
1. **D'abord Supabase** : même page, désactive « Enable Captcha protection », puis « Save changes ». Tout redevient comme
   avant, tout de suite.
2. Ensuite seulement (si tu veux enlever le cadre) : demande à Claude de vider la clé dans `js/config.js`.

## À savoir
- Turnstile est gratuit. La protection CAPTCHA de Supabase : à confirmer sur le plan gratuit en ouvrant la page de
  l'étape 6 (si elle demande un plan payant, on s'arrête : rien ne bloque personne ; demande alors à Claude de vider la
  clé, qui ne sert à rien sans Supabase).
- Politique de confidentialité : à mettre à jour **avant la clé** (étape 2), pas seulement avant Supabase.
- Jamais une clé « de test » de Cloudflare (`1x0000…`, `2x0000…`, `3x0000…`) dans l'app : elle laisserait passer les
  robots ou bloquerait tout le monde. Le banc la refuse sur main.
- La Secret Key ne s'écrit jamais dans l'app ni dans un message. Collée par erreur dans un fichier, même sur une branche
  de travail (elle est publique elle aussi), elle est exposée : le banc devient rouge, et il faut la régénérer chez
  Cloudflare (le widget → « Rotate Secret Key »), puis mettre la nouvelle dans Supabase.
