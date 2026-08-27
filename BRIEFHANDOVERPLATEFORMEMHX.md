# BRIEF DE HANDOVER — Plateforme MHX Coaching

## 1. L'app en une phrase
Plateforme web de coaching pour MHX Coaching : **un seul fichier HTML autonome** (~110 Ko, aucune dépendance JS externe) qui sert d'espace client — questionnaire de démarrage, programme d'entraînement, calculateur métabolique, suivi des mensurations, journal d'entraînement — avec comptes individuels et données stockées dans **Supabase**, hébergé sur **Netlify** à `https://lcsmhxcoaching.netlify.app`.

## 2. Où est le code
- **Fichier :** `index.html`, un fichier unique et autonome. Tout est dedans (HTML, CSS, JS).
- **Sur le Mac de Lucas :** dans son dossier **Téléchargements / Downloads**. Attention : macOS a nommé une des copies **`index copie.html`** — il peut y avoir plusieurs copies téléchargées à des dates différentes. **Vérifier la date de modification et prendre la plus récente** avant de travailler dessus.
- **Dépôt Git : il n'y en a pas.** Aucun repo GitHub, aucun projet Cursor existant. Le déploiement se fait par glisser-déposer sur Netlify, pas par Git.
- **Version en ligne (référence fiable) :** la page servie à `https://lcsmhxcoaching.netlify.app/` est exactement la dernière version déployée. En cas de doute sur quelle copie locale est la bonne, télécharger le HTML depuis cette URL et repartir de là.
- Les copies de travail de l'assistant précédent étaient dans un bac à sable cloud (`/home/claude/mhx/plateforme/`) — **cet emplacement n'existe pas sur le Mac et n'est pas accessible.**

## 3. Architecture du fichier (à respecter)
Un commentaire en tête de fichier donne la carte des sections, dans l'ordre :

```
[A] JETONS DE DESIGN .... couleurs, ombres, thème clair/sombre
[B] STYLES COMMUNS ...... mise en page, boutons, champs, tableaux
[C] STYLES DES OUTILS ... styles propres à chaque outil
[D] CONFIG .............. textes de marque + TOUTES les constantes de calcul
[E] BOÎTE À OUTILS ...... helpers, stockage (Auth, Store), composant graphique
[F] OUTILS .............. un objet par outil : id, nom, html, init
[G] NAVIGATION .......... barre du haut + routage par #ancre
```

**Règle d'extension (déjà documentée dans le fichier) :** pour ajouter un outil, copier un objet de la section [F], changer `id / nom / icone / html() / init()`, et l'ajouter au tableau `OUTILS`. La navigation se construit toute seule. Ne pas réorganiser le fichier ni le découper en plusieurs fichiers : Lucas doit pouvoir le glisser tel quel sur Netlify, et il n'y a pas de build.

### Les 7 outils (tableau `OUTILS`, dans cet ordre)
| objet | `id` (route `#/id`) | `cle` (clé Supabase) | nom affiché | visible par |
|---|---|---|---|---|
| `outilProfil` | `profil` | `intake` | Mon profil | tous |
| `outilProgramme` | `programme` | `programme` | Mon programme | tous (édition = coach) |
| `outilCalculateur` | `calculateur` | `calc` | Calculateur | tous |
| `outilMensurations` | `mensurations` | `mens` | Mensurations | tous |
| `outilEntrainement` | `entrainement` | `perf` | Entraînement | tous |
| `outilBibliotheque` | `bibliotheque` | — | Bibliothèque | `role:"coach"` |
| `outilClients` | `clients` | — | Mes clients | `role:"coach"` |

### Les deux seuls points de contact avec le serveur
- **`Auth`** (section [E]) : session Supabase GoTrue conservée dans `localStorage` sous la clé `mhx_session`. Endpoints utilisés : `/auth/v1/token`, `/auth/v1/signup`, `/auth/v1/recover`, `/auth/v1/logout`, `PUT /auth/v1/user`.
- **`Store`** (section [E]) : lecture/écriture des données. `Store.lire(cle, defaut)` fait un `GET /rest/v1/donnees?user_id=eq.X&outil=eq.Y` ; `Store.ecrire(cle, valeur)` met en cache, **débounce 700 ms**, puis `POST` en upsert avec l'en-tête `Prefer: resolution=merge-duplicates`. `Store.idConsulte` non nul = le coach consulte la fiche d'un client → mode **lecture seule** (aucune écriture, sauf le `programme` écrit par le coach).

**C'est le seul endroit qui parle à la base.** Toute nouvelle donnée persistée doit passer par `Store`, jamais par un `fetch` écrit dans un outil.

### CONFIG (section [D]) — tout ce qui se change sans toucher au code
- `marque` : nom, programme (`SPEEDFORM 1.0`), instagram, pseudo, email `contact@lcsmhxcoaching.com`, `formulaire_bilan` (vide, non utilisé).
- `supabase` : `url` + `cle` **publishable** (voir §7).
- `calcul` : `proteines_g_par_kg:2.2`, `lipides_g_par_kg:1.0`, `deficit_perte:0.10`, `surplus_prise:0.10`, `facteur_base:1.20`, `bonus_10000_pas:0.15`, `plafond_pas:16670`, `bonus_par_heure:0.03`, `plafond_heures:15`, `seuil_alerte_glucides:50`, `valeurs_depart`.
- `mensurations` : 10 zones, 2 affichées au départ, `max_courbes:4`.
- `entrainement` : `nb_seances:5`, plages de reps, `modele_seance` (7 exercices), `nb_series:4`.

### Formules (ne pas les modifier sans accord de Lucas)
- BMR : **Mifflin-St Jeor**.
- Facteur d'activité = `1.20 + (pas/10000 × 0.15, plafonné à 16 670 pas) + (heures par semaine × 0.03, plafonné à 15 h)`.
- Objectifs : maintenance **±10 %**.
- Macros : `2.2 g` protéines/kg, `1.0 g` lipides/kg, **glucides = le reste des kcal cibles ÷ 4**. Les macros somment toujours exactement à l'objectif sélectionné — c'était une correction volontaire d'une incohérence de l'ancien Google Sheet, ne pas « rétablir » l'ancien calcul.

## 4. Ce qui est fait et fonctionne (vérifié)
- Portail de connexion / inscription / mot de passe oublié. **Mot de passe saisi deux fois** à l'inscription, avec message d'erreur s'ils diffèrent.
- Réinitialisation par email : la page détecte `#access_token=...&type=recovery` dans l'URL et affiche l'écran de nouveau mot de passe.
- **Première connexion client → questionnaire de démarrage** affiché d'office. C'est le questionnaire réel de Lucas (49 questions, 6 sections, verbatim), types `texte | long | nombre | date | select | echelle`. Enregistré dans `donnees` sous `outil='intake'`, marqué `complet:true` quand les champs requis sont remplis. Une fois rempli, plus de blocage aux connexions suivantes.
- **Sauvegarde automatique** : toute saisie est écrite en base après 700 ms, sans bouton. Un témoin d'état s'affiche.
- **Côté coach** : onglet « Mes clients » (liste + date de dernière donnée), ouverture d'une fiche client → vue **lecture seule** de ses courbes, charges et macros, avec bandeau et bouton de sortie.
- **Programme** : le coach construit séances / exercices (nom, séries, reps, repos, tempo, note, lien), enregistre → le client le voit en lecture seule dans son onglet « Mon programme ». Le client ne peut pas l'écrire (vérifié : 0 écriture côté client).
- **Bibliothèque** : le coach enregistre un programme sous un nom, le retrouve dans l'onglet « Bibliothèque », le recharge sur un autre client.
- **Graphiques** : SVG inline maison (pas de librairie), avec curseur/tooltip. Courbes de poids et de mensurations.
- Thème clair/sombre automatique, responsive (0 px de débordement horizontal testé en 390×844).
- Tests Playwright passés sans erreur console ni `pageerror` sur : auth, questionnaire, reset, programmes, bibliothèque, vue coach.
- **En production, la boucle complète a tourné pour de vrai** : compte coach `lucasmahauxpro@gmail.com` (role `coach`) et un compte client de test, tous deux connectés au moins une fois, chacun avec une ligne de données en base.

## 5. Ce qui reste à faire, dans l'ordre
1. **Réglages Supabase côté Lucas (bloquant pour les vrais clients)** — à faire par lui dans le dashboard, pas par code :
   - désactiver **« Confirm email »** (`Authentication → Providers → Email`) pour que les comptes créés soient utilisables immédiatement ;
   - vérifier que **Site URL** et **Redirect URLs** pointent bien sur `https://lcsmhxcoaching.netlify.app` (elles pointaient au départ sur `localhost:3000`, ce qui cassait le lien de confirmation) ;
   - supprimer le compte de test `lucasmahaux@hotmail.com`.
2. **Suivi de l'évolution dans le temps — partie non faite.** Aujourd'hui le coach voit les courbes d'**un** client à la fois quand il ouvre sa fiche. Il manque : un tableau de bord transversal (tous les clients, variation de poids/mensurations sur 4 semaines) et une alerte d'inactivité (client sans nouvelle donnée depuis X jours). C'est le chantier principal restant.
3. **Améliorations possibles ensuite** (pas demandées explicitement, à valider avec Lucas avant de coder) : historique des programmes envoyés, export PDF d'un programme, notes du coach sur une fiche client.

⚠️ **Ne pas ajouter de fonctionnalité hors de cette liste sans validation.** Lucas tient au fichier unique, simple et modifiable par lui-même.

## 6. Boucle de déploiement
1. Modifier `index.html` (le fichier local le plus récent).
2. Ouvrir la page de déploiement Netlify du site `lcsmhxcoaching`.
3. **Glisser le fichier — il doit s'appeler exactement `index.html`.** Si macOS l'a renommé `index copie.html`, Netlify propose « Rename and deploy » : accepter, sinon le site sert autre chose.
4. Vérifier en ligne : le titre de la page doit être **« Plateforme MHX Coaching »**.

Il n'y a **pas** de build, pas de `npm install`, pas de CI. Ouvrir le fichier en `file://` dans un navigateur suffit pour tester l'interface (les appels réseau échoueront, ce qui est normal en local sans stub).

## 7. APIs, comptes, clés
- **Supabase**, projet ref **`nzynbuczmogifuidcjed`**, région eu-west-1, URL `https://nzynbuczmogifuidcjed.supabase.co`. La clé présente dans `CONFIG.supabase.cle` est la clé **publishable** — elle est publique par nature, c'est normal qu'elle soit dans le HTML.
- 🔒 **La clé `service_role` ne doit JAMAIS être mise dans le site, ni dans un fichier livré, ni demandée à Lucas.** Elle contourne toutes les règles de sécurité. Cette consigne est absolue.
- **Schéma** (3 migrations déjà appliquées) :
  - `public.profils(id uuid PK → auth.users, prenom, nom, role text default 'client', cree_le)`
  - `public.donnees(user_id uuid, outil text, contenu jsonb, maj_le, PK(user_id, outil))`
  - `public.bibliotheque(id uuid PK, coach_id uuid → auth.users, nom, note, contenu jsonb, cree_le)`
  - fonctions `SECURITY DEFINER` : `creer_profil()` (trigger sur insert dans `auth.users`) et `est_coach()`.
- **RLS activée partout.** Chaque utilisateur lit/écrit ses propres lignes ; le coach a un `select` sur tout, plus `insert`/`update` sur `donnees` limités à `outil = 'programme'`. `execute` sur `est_coach()` est révoqué pour `public`/`anon` et accordé à `authenticated`.
- Un avertissement de l'advisor Supabase subsiste sur `est_coach()` — **il est volontaire** : `authenticated` doit pouvoir l'appeler pour que les policies s'évaluent. Ne pas « corriger » ça, ça casserait l'accès coach.
- **Netlify** : hébergement gratuit, déploiement par glisser-déposer, site `lcsmhxcoaching.netlify.app`.
- Contrainte de Lucas : **coût zéro**. Rester sur les offres gratuites Supabase + Netlify, ne pas introduire de service payant.

## 8. Pièges (tous rencontrés pour de vrai)
1. **Ne jamais réécrire `$("vue").innerHTML` depuis le `init()` d'un outil.** Ça détruit les blocs déjà rendus autour et fait planter le code suivant (`Cannot read properties of null (reading 'addEventListener')`). L'outil `programme` rend son contenu dans un conteneur dédié `#prog-vue` — suivre ce modèle. Garder aussi les gardes du type `if (!$("id")) return;`.
2. **`await afficher(...)` avant de toucher au DOM.** Insérer un élément avant que `afficher()` ait fini le fait effacer (bug du bandeau de bienvenue à la première connexion).
3. **Pas d'écouteur `hashchange` avant la connexion.** Changer le `#` dans un onglet déjà ouvert ne fait rien tant qu'on n'est pas connecté → il faut recharger la page (Cmd+R). Ce n'est pas un bug à « corriger » à la légère : le routage complet se met en place après login.
4. **Le mode lecture seule doit rester étanche.** Quand `Store.idConsulte` est défini, `Store.ecrire` ne poste rien (sauf `programme` pour le coach). Toute nouvelle écriture ajoutée doit passer par `Store` pour hériter de cette protection.
5. **Offre gratuite Supabase : le projet se met en pause après 7 jours sans activité.** Si l'app « ne se connecte plus » sans raison, vérifier d'abord l'état du projet dans le dashboard.
6. **Le débounce de 700 ms** : dans un test automatisé, attendre ≥ 1 s après une saisie avant de vérifier qu'une écriture est partie.
7. Les copies multiples dans Downloads (`index copie.html`) sont la première source d'erreur : travailler sur une seule copie, clairement identifiée.

## 9. Comment tester sans toucher à la vraie base
Des scripts Playwright existent et interceptent toutes les requêtes vers `nzynbuczmogifuidcjed.supabase.co` pour les remplacer par des réponses simulées (auth, profils, donnees, bibliotheque). Le principe à reproduire :
- `chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })` dans le bac à sable d'origine — **sur le Mac, utiliser le Chromium installé par Playwright localement**.
- `page.route('**/nzynbuczmogifuidcjed.supabase.co/**', ...)` et répondre en JSON selon l'URL : `/auth/v1/token` → session factice, `/rest/v1/profils?id=eq.` → profil avec `role`, `/rest/v1/donnees` → contenu par `outil=eq.X`, `POST` → 201 en enregistrant l'écriture.
- Écouter `pageerror` et `console` type `error` : le critère de succès est **zéro erreur**.
- Toujours tester les deux rôles (coach et client) et vérifier le débordement horizontal en 390×844.

## 10. Contexte utile
Lucas n'est pas développeur. Il attend **une action claire à la fois**, en français, sans jargon. Le fichier est volontairement commenté en français pour qu'il puisse changer lui-même un texte, une couleur ou une constante de calcul. Toute modification qui rendrait le fichier illisible pour lui, ou qui le découperait en plusieurs fichiers / ajouterait un build, va contre le besoin exprimé.
