# HANDOFF — Refonte premium de la plateforme MHX Coaching → Claude Code

Rédigé le 25 septembre 2026 (matin, heure de Bali) par Claude (Cowork), à la demande de Lucas.
Objet : passer la main à Claude Code sur `index.html` sans rien casser. Lis ce fichier en entier avant de toucher au code, puis `NOTESCLAUDE.md` (journal des versions, aussi lu par Grok Bot) et `BRIEFHANDOVERPLATEFORMEMHX.md` (brief d'origine, toujours valable pour les pièges Supabase).

---

## 0. En une minute

- **Application** : un seul fichier `index.html` (≈ 9 000 lignes), sans framework ni build, hébergé sur GitHub Pages : https://lcsmhx.github.io/mhx-plateforme/ — déploiement = fichier poussé sur `main`.
- **Backend** : Supabase (ref `nzynbuczmogifuidcjed`, plan gratuit), appelé par `fetch` direct (client maison `Auth.appel`). **7 clients réels + 1 coach. Données de production.**
- **État en ligne** : **v42** (25/09/2026, poussée par Claude Code ; avant : 37.1 `4b35c81` correctif de sécurité, v38 `4277f6a`, v39 phase 15, v40 phase 16, v41 phase 13). **Les 20 phases sont faites.** Reste à Lucas : ses vérifications à l'écran (§11) et, quand il le décide, l'ouverture de l'inscription publique (prérequis en §7).
- **Règle n° 1 : ZÉRO PERTE DE DONNÉES.** Voir §3. Aucune migration destructive, backup + comptage avant/après, validation de Lucas à chaque étape sensible.
- **Règle n° 2 : rien ne part en production (GitHub ou base) sans le « oui » de Lucas.** Depuis le 25/09/2026, Claude Code commit et pousse lui-même sur `main`, et Lucas lui a donné l'autonomie pour les phases 10/18, 15, 16, 13 et 20 **sous garde-fous** : relecture par un sous-agent indépendant avant chaque migration et chaque push, backup vérifié et comptages avant/après, arrêt immédiat (rollback si besoin) au moindre écart de comptage, test en échec, réserve du relecteur ou opération qui demanderait DROP/DELETE/TRUNCATE ; l'ouverture de l'inscription publique reste à Lucas.
- **Règle n° 3 : on fait évoluer l'existant, on ne le réécrit pas.** Réutiliser `Regularite`, `Journal`, `Historique`, `Checkin`, `Clients`, le questionnaire, le générateur de diète, l'éditeur de programme… Ne pas changer un modèle de données sans nécessité ; ne jamais remplacer une fonctionnalité qui marche par une réimplémentation.
- **Grok Bot** (agent Cursor, machine externe) travaille **uniquement dans `donnees/`** (aliments, recettes, programmes, exercices). **Jamais `index.html`.** Coordination par fichiers : `NOTESCLAUDE.md` (Claude → Grok) et `NOTES-GROK.md` (Grok → Claude), plus la table Supabase `briefs` (lecture publique, écriture réservée).

> Note : le message de passation de Lucas parlait de « phase 2 en ligne (v33, commit 30b44b7), prochaine étape phase 3 ». C'est dépassé : Lucas a téléversé v34 (7be60e1), v35 (c910296), v36 (03531c5) et v37 (8dcbe7d) dans la foulée. Le site en ligne est bien la v37 (vérifié octet par octet).

---

## 1. Contexte produit et direction artistique validée

MHX Coaching = coaching sportif et alimentaire en ligne (perte de poids, recomposition), clientèle mixte, femmes 25-34 en priorité, tutoiement. L'app doit ressembler à une **plateforme de coaching premium** (références de qualité : WHOOP, Oura, Linear, Stripe, Notion), pas à une app de bodybuilding ni à un template. **Design neutre homme / femme** : données, typographie, graphiques, barres de progression, icônes ; aucune silhouette genrée, aucun visuel de salle. **Aucun prix dans l'application.**

**Design system v33 (livré, en ligne)** — section [A] et [B] du CSS :
- Thème **sombre par défaut** (`:root`), clair en option (`:root[data-theme="light"]`), bouton ☀/☾ dans la barre du haut et sur l'écran de connexion, choix rangé sur l'appareil (clé `localStorage` `mhx_theme`), objet `Theme` (`charger`, `appliquer`, `basculer`, `majBoutons`). Le thème ne suit plus l'OS : c'est voulu.
- Jetons : `--ground` (#07090d), `--surface`, `--sunken`, `--raised`, `--ink/-2/-3`, `--line/-strong`, `--accent` doré #d4a844 (**accent seulement** : CTA, actifs, chiffres clés — jamais un fond), `--accent-soft/-line`, `--good/-soft`, `--warn/-soft`, `--bad/-soft`, `--s1..s4` (séries de courbes), `--r-sm/--r/--r-lg` (rayons 6/10/14), `--vite/--doux` (durées).
- Typo : IBM Plex Sans (texte, titres en casse normale), IBM Plex Mono (chiffres, étiquettes en capitales espacées), Oswald réservé au nom de la marque. Google Fonts est la seule ressource externe.
- Composants (une seule famille, anciens noms conservés) : `.panel` (carte), `.tile` = `.tuile` (stat card : `.t-lbl / .t-val / .t-sub`, `.pos/.moyen/.neg` pour la couleur de sens), `.bar` = `.jauge` = `.fo-jauge` (barre), `.pastille` (+ `.ok .attention .mauvais .accent`), `.point` (feu vert/orange/rouge), `.btn` (+ `.ghost .danger .petit`), champs, `.seg` (segmenté), `.tab`, `.chip`, `.flag` (+ `.grave .info .bon`), `.empty`, `.verrou` (état verrouillé), `.avatar`, `.timeline`, `.objectif` (carte objectif), `.switch`, `.modale`, `.volet`, `.toast`, `.acces` (ligne d'accès rapide), `.reg-evo` (barres d'évolution), `.attention-c` (carte d'alerte), `.fiche-grille`.
- Objet `UI` (section [E]) : `UI.confirmer(texte, {ok, annuler, danger, titre})` → Promise<bool>, `UI.demander(texte, defaut, {type, placeholder, ok})` → Promise<string|null>, `UI.alerte(texte)`, `UI.toast(texte, "ok"|"attention"|"mauvais")`, `UI.volet({titre, corps(html)})`, `UI.verrou({titre, texte, lien, cta})` → html. **Interdit d'utiliser `alert / confirm / prompt` natifs** (les 29 anciens ont été remplacés). Annuler / Échap / clic à côté = rien ne se passe.
- Animations : apparition douce des `.panel`, transitions courtes, tout désactivé sous `prefers-reduced-motion`.
- Icônes : `ICONES` (SVG en trait, clé = id de l'outil) + `SVG` (soleil, lune, cadenas, croix). Plus d'emoji dans la navigation.
- Mobile-first : barre d'onglets fixe en bas (`#barre-bas`, 4 onglets + « Plus » qui ouvre un volet), `main` avec marge basse, tables du back-office en cartes sous 720 px (`td[data-l]`).
- i18n : l'app est écrite en français ; l'anglais est une couche (`I18N.en`, dictionnaire texte exact → anglais, + `Traduction` par MutationObserver). **Toute nouvelle chaîne visible côté client doit avoir son entrée `I18N.en`** (les écrans coach ne sont pas traduits, c'est voulu). Attention aux clés dupliquées : la dernière gagne (« Remplacer » = « Swap » pour le bouton repas, d'où « Oui, remplacer » pour les fenêtres). Script de contrôle en §8.

---

## 2. Architecture technique

### 2.1 `index.html` — ordre du fichier
`[A]` jetons de design · `[B]` styles communs / composants · `[C]` styles des outils · `[D]` `CONFIG` (marque, Supabase, calcul, mensurations, nutrition, régularité, bilan, entraînement) · `[E]` boîte à outils (helpers, `SVG`, `ICONES`, `Theme`, `UI`, `I18N`/`Traduction`/`Contenus`, `Auth`, `Store`, `Catalogue`, `Normaliser`, `Import`, `Graphique`, `ECHAUFFEMENTS`) · `[F]` outils (un objet par écran) · `[G]` navigation, connexion, démarrage.

Un **outil** = `{ id, cle, nom, icone, titre, accroche, html(), init(), role?, masque_client?, client_seul?, masque_nav?, principal?, principal_coach?, sans_entete? }`, listé dans `OUTILS` (l'ordre = la navigation). `afficher(id)` rend `html()` dans `#vue` puis `init()` (qui peut renvoyer une fonction de nettoyage). Routage par ancre `#/<id>` ; `ALIAS_ROUTES` (`progression` → `mensurations`, `repas` → `nutrition`, `home` → `accueil`). `outilParDefaut()` : coach → `tableau`, client → `accueil`.

Ordre client : `accueil` · `programme` · `nutrition` · `mensurations` (« Ma progression ») · `suivi` (« Mon suivi ») · `bilan` (masqué de la nav, reste à `#/bilan` = « Préparer le call ») · `formation` (« Speed Formation ») · `complements` · `profil`. Coach : `tableau` · `clients` · `atelier` · `bibliotheque` · `catalogue` · `calculateur` · `entrainement` (les deux derniers `masque_client`).

Mode **consultation** (coach dans la fiche d'un client) : `Store.idConsulte` + `Store.nomConsulte` ; page en `lecture-seule` sauf outils listés dans `MODIFIABLES` (`programme, nutrition, calculateur, complements, bilan, accueil` — la fiche `accueil` y est depuis la v38 pour les notes privées, son seul champ). Bandeau `bandeauConsultation()` : Fiche · Préparer le call · Son suivi · Son questionnaire · Son programme · Ses repas · Ses calories · Ses courbes · Ses séances · Revenir à mes clients.

### 2.2 Données — table `donnees(user_id, outil, contenu jsonb, maj_le)` (un document par clé)
`Store.lire(cle, defaut)` (1 GET, fusionne les défauts, pose le drapeau `charge`), `Store.ecrire(cle, valeur)` (débounce 700 ms, upsert `on_conflict=user_id,outil`, refuse d'écrire si la lecture a échoué), `Store.lireTout(cles, {dates})` (une requête `outil=in.(...)`, lecture seule, ne touche pas au cache).

| Clé | Propriétaire | Écrit par | Contenu (forme) |
|---|---|---|---|
| `intake` | client | client | questionnaire (`QUESTIONS`, 57 ids) + `complet` |
| `programme` | client | **coach** | `{nom, note, seances[{nom, note, exercices[{nom, series, reps, repos, note, lien, id}]}], maj (date fr), debut (ISO, posé à l'envoi), cycle, duree_semaines, objectifs:{mois, liste[3], statuts[3]}}` |
| `journal` | client | client | `{seances[{date, si, nom, exos[{nom, series[{r,c}]}]}]}` (400 max) |
| `repas` | client | **coach** (+ client via « Remplacer ») | `{nom, note, cible{kcal,prot,gluc,lip}, regime, allergenes[], nb_repas, maj, debut, jours[{nom, repas[carte], manquants, complement, diagnostic}]}` |
| `repas_suivi` | client | client | `{date, mange{"jour:i":bool}, courses{}, joursCourses{}, hist{iso:{c,p}}}` (70 j) |
| `mens` | client | client | `{dstart, pstart, zones[10], affichees[], compo_affichee, mesures[{sem, date, poids, vals{i:cm}, compo{mg,mm,eau,visc,os,mb,age}}]}` |
| `objectifs_faits` | client | client | `{mois, faits[bool]}` |
| `checkins` (v36) | client | client | `{liste[{semaine (lundi ISO), fin, envoye_le, envoye_a? (v38, instant ISO), reponses{id:valeur}}]}` (60 max) |
| `complements` | client | **coach** | `{liste[{ref, nom, dose, unite, moment, note, proteine, par100}], note}` |
| `calc` | client | **coach** | `{sexe, age, taille, poids, pas, heures, objectif}` |
| `formation` | client | client | `{coches{}, ouvert, lecon, challenge, defis{}, diete{}, semaine, jour, priorites{}, notes[], objectifs[]}` |
| `hist_programme` / `hist_repas` | client | **coach** | `{liste[{nom, du, au, contenu}]}` (24 max) |
| `prefs` | client | client | `{langue}` |
| `perf` | coach | coach | journal d'entraînement du coach |
| `atelier` | coach | coach | brouillon de programme modèle |
| `feedbacks` (phase 10, v38) | client | **coach seul** (le client lit) | `{liste[{semaine (lundi ISO), fin, date, texte, bilan?}]}` (60 max) — `bilan` = instant d'envoi du bilan auquel ce feedback répond (`envoye_a`, sinon `envoye_le`) |
| `notes_coach` (phase 18, v38) | client | **coach seul**, **illisible par le client** (RLS) | `{texte, maj, avant?}` — `avant` = la version trouvée à l'ouverture de la fiche |
| `photos` (phase 13, v41) | client | client | `{liste[{semaine, date, vues{face, profil, dos}}]}` — index des photos rangées dans Storage (bucket `photos`, fichier `<user_id>/s<NNN>-<vue>.jpg`) ; l'app ne suit qu'un chemin de cette forme exacte, dans le dossier du compte affiché (`Photos.valide`) |

Autres tables : `profils(id, prenom, nom, role 'client'|'coach', cree_le, statut 'prospect'|'client')` (`statut` depuis la v39 : NOT NULL, défaut `'prospect'` pour les comptes créés ensuite, contrainte `profils_statut_valeurs`, les 9 comptes existants ont été passés à `'client'`), `bibliotheque(id, coach_id, nom, note, contenu, cree_le)`, catalogue `aliments` (3 111), `recettes` (248), `programmes_types` (18), `exercices` (196, 130 avec vidéo) — toutes avec colonne `traductions` jsonb —, `briefs` (canal Grok).

**Les trois endroits à aligner** quand le coach doit écrire une nouvelle clé dans la fiche d'un client (sinon l'écriture échoue en silence) : (1) la liste dans `Store.ecrire` (`["programme","repas","calc","complements", …]`), (2) `MODIFIABLES` dans `afficher()`, (3) les policies RLS « le coach cree / modifie la fiche client ».
Exception v38 : `feedbacks` et `notes_coach` ne passent **pas** par `Store` (objet `CleCoach` : lecture de la ligne avec `maj_le`, puis **écriture conditionnelle** — `PATCH …&maj_le=eq.<valeur lue>` ou `POST` sans upsert, 0 ligne / 409 = conflit, rien n'est écrit — ; session vérifiée avant chaque appel ; message clair sur 401/403) ; `Store.clesCoachSeul` les refuse dans `ecrire`, `envoyer` et `importer`. Elles sont dans les policies coach et exclues des policies propriétaire.

### 2.3 Supabase — état exact au 25/09/2026
- Auth email + mot de passe. Confirmation d'email **désactivée** (décision de Lucas). Création de compte réservée au coach via l'edge function `creer-acces` (vérifie `est_coach`, crée l'utilisateur avec la clé service ; depuis la v39, pose elle-même `statut = 'client'` (et `role = 'coach'` pour un accès équipe) avec la clé de service ; renvoie `{id, email, role, statut}`) ; `supprimer-acces` (droit à l'effacement, mot « SUPPRIMER » revérifié serveur ; depuis la v41 : identifiant de compte vérifié (UUID) et **photos du dossier `<id>/` effacées d'abord** — si Storage ne répond pas, rien n'est effacé et la fonction renvoie 500 ; code avant/après et banc de la fonction dans la sauvegarde locale de Lucas `sauvegardes/2026-09-25-avant-v41/fonctions/`, hors dépôt). L'inscription publique est **coupée** dans le dashboard (vérifié par Lucas le 25/09/2026 : « Allow new users to sign up » désactivé) — Lucas la rouvrira lui-même, tout à la fin.
- Fonctions SQL : `est_coach()` (SECURITY DEFINER, `profils.role = 'coach'`), `creer_profil()` (trigger AFTER INSERT sur `auth.users` : insère `profils(id, prenom, nom)` depuis `raw_user_meta_data`), `protege_role()` (trigger BEFORE UPDATE sur `profils` : depuis la v39, `role` **et** `statut` ne changent que par un coach, ou avec la clé de service — `auth.role() = 'service_role'`, fonctions `creer-acces` / `supprimer-acces` ; un compte ne peut pas se passer lui-même « client » ; dans l'éditeur SQL, poser d'abord des `request.jwt.claims` de coach). Avant la v39, la clé de service était refusée : la création d'un compte « accès complet » par `creer-acces` restait un simple client, sans message. **Un compte créé hors de l'app** (dashboard Supabase → Authentication → Add user) naît « prospect » (défaut) : le passer « client » dans Mes clients → Comptes. `creer-acces` vérifie l'appelant avec son propre jeton, relit son rôle en base avec la clé de service, n'accepte que `role` = `client` ou `coach`, et pose le statut « client » côté serveur (v2, 25/09/2026, déployée avant la migration : sur l'ancienne base, elle se comporte comme la v1) ; elle renvoie le rôle et le statut réellement posés, et toujours l'id une fois le compte créé ; l'app repose le statut par sécurité et prévient le coach (fenêtre) si le statut ou l'accès complet n'a pas pu être posé. Code avant/après et banc de la fonction : sauvegarde locale de Lucas `sauvegardes/2026-09-25-avant-v39/fonctions/`, hors dépôt.
- Policies (texte exact, **depuis la v38 / 25/09/2026** ; `auth.uid()` et `est_coach()` sont écrits `(select …)` en base) :
  - `donnees` SELECT « donnees lisibles par leur proprietaire ou le coach » : `((auth.uid() = user_id) AND outil <> 'notes_coach') OR est_coach()`
  - `donnees` INSERT « donnees creees par leur proprietaire » with_check : `(auth.uid() = user_id) AND outil <> ALL (ARRAY['feedbacks','notes_coach'])`
  - `donnees` UPDATE « donnees modifiees par leur proprietaire » using : idem (pas de WITH CHECK : Postgres applique le USING à la nouvelle ligne, donc une ligne ne peut pas devenir `feedbacks` / `notes_coach`)
  - `donnees` DELETE « donnees supprimees par leur proprietaire » using : idem
  - `donnees` INSERT « le coach cree dans la fiche client » with_check : `est_coach() AND outil = ANY (ARRAY['programme','repas','calc','complements','hist_programme','hist_repas','feedbacks','notes_coach'])`
  - `donnees` UPDATE « le coach modifie la fiche client » using + with_check : idem
  - Avant la v38 : SELECT `(auth.uid() = user_id) OR est_coach()`, INSERT/UPDATE/DELETE propriétaire `auth.uid() = user_id`, listes coach sans `feedbacks`/`notes_coach` (texte exact, backup vérifié et rollback dans la sauvegarde locale de Lucas, hors dépôt).
  - `profils` SELECT / UPDATE : `auth.uid() = id OR est_coach()`
  - `bibliotheque` ALL : `auth.uid() = coach_id AND est_coach()`
  - catalogue (4 tables) : SELECT `true` pour `authenticated`, ALL `est_coach()`
  - `briefs` SELECT `true` (anon + authenticated)
- Storage (depuis la v41) : bucket privé `photos` (5 Mo max, `image/jpeg` seulement). Policies `storage.objects` : « photos : le proprietaire et le coach lisent » (SELECT : dossier `(storage.foldername(name))[1] = auth.uid()` ou `est_coach()`), « …depose dans son dossier » (INSERT) et « …remplace les siennes » (UPDATE) : son dossier **et** nom exact `^[0-9a-f-]{36}/s[0-9]{3,4}-(face|profil|dos)[.]jpg$` (ni sous-dossier ni autre fichier), « …retire les siennes » (DELETE : son dossier). Le coach lit, n'écrit rien. L'anonyme ne voit rien. Advisors : `est_coach()` exposé en RPC (sans risque), protection « mots de passe compromis » désactivée (réglage dashboard).
- PostgREST renvoie 1 000 lignes max : `Catalogue.lire` pagine avec l'en-tête `Range`.

### 2.4 Déploiement et versions
- `CONFIG.marque.version` (ex. `"2026-09-25 · 37"`) s'affiche en pied de page et sur l'écran de connexion : **incrémenter à chaque livraison**, c'est le seul moyen de savoir ce qui est en ligne. `<meta http-equiv="Cache-Control" content="no-cache">` : les clients rechargent la dernière version.
- Livraison = `index.html` (+ `NOTESCLAUDE.md` mis à jour) → commit et push sur `main` par Claude Code (depuis le 25/09/2026, sous les garde-fous de la règle n° 2 ; jusqu'à la v37, Lucas glissait les fichiers sur GitHub) → GitHub Pages met ~1 minute. Vérifier ensuite la version sur le site.
- Historique récent sur `main` : `3576aec` v32 (avant refonte) · `30b44b7` v33 · `7be60e1` v34 · `c910296` v35 · `03531c5` v36 · `8dcbe7d` v37 · `4b35c81` 37.1 (correctif de sécurité, Claude Code) · `4277f6a` v38 · puis v39 (Claude Code, `git log` pour les suivants). Le détail de chaque version se relit avec `git diff 3576aec..30b44b7` (v33), `30b44b7..7be60e1` (v34), etc.

---

## 3. RÈGLES ABSOLUES — zéro perte de données (posées par Lucas, non négociables)

Concerne tout : comptes, profils, questionnaire, programmes, diètes, repas suivis, historiques, poids, mensurations, composition, journal, objectifs, formation, compléments, préférences, toutes les clés `donnees` existantes et futures, catalogue, bibliothèque, données coach.

1. **Backup avant toute migration** (structure Supabase / SQL / RLS / trigger / Storage / profils) : export complet vérifiable (par SELECT : `profils`, `donnees` avec `contenu`, `bibliotheque`, catalogue, **et le texte des policies / fonctions / triggers actuels**), livré à Lucas en fichier, avec vérification que les 7 clients y sont. Procédure de rollback écrite avant de commencer.
2. **Migrations non destructives uniquement** : `ADD COLUMN`, `ALTER POLICY`, `CREATE OR REPLACE FUNCTION`, `CREATE POLICY`, backfill explicite, valeurs par défaut contrôlées. **Jamais** `DROP`, `DELETE`, `TRUNCATE`, `RESET`, recréation de table. L'ancien format de données doit rester lu.
3. **Ne pas modifier les données existantes sans nécessité.** Exemple appliqué : les objectifs — `P.objectifs.liste[]` et `objectifs_faits` continuent de fonctionner, le statut est un champ ajouté (`statuts[]`) et `Regularite.statutObjectif` lit les deux.
4. **Avant / après** pour toute migration : comptage (profils par rôle, lignes `donnees` par client et par clé, catalogue) identique après. **Écart inattendu = STOP**, on ne continue pas les phases suivantes.
5. **Tester d'abord avec un client existant** (compte de test désigné par Lucas ; ne jamais se connecter avec le compte d'un vrai client sans que Lucas donne lui-même l'accès) : connexion, profil, programme, repas, progression, mensurations, questionnaire, objectifs, formation, historique, journal. Puis seulement appliquer à tous.
6. **FREE / CLIENT (phase 15)** : logique de statut ajoutée sans rien changer au comportement ; les 7 clients restent `client`, le coach reste `coach` ; RLS vérifiées ; accès des clients existants strictement identiques ; test d'un prospect séparément ; un prospect n'accède jamais aux données ou fonctionnalités privées d'un client. Le défaut `prospect` ne doit jamais toucher les comptes existants (d'où : ADD COLUMN sans défaut → backfill `client` → SET DEFAULT `prospect`).
7. **RLS** : toute modification testée avec au minimum coach, client existant, prospect, et tentative d'accès croisé. Coach → accès prévu ; client → ses données seulement ; prospect → seulement le mode gratuit. Personne ne lit les données privées d'un autre.
8. **`notes_coach`** : strictement privées au coach, protégées **par la RLS**, pas seulement par l'interface (le client ne doit pas pouvoir les lire même en connaissant la clé).
9. **Photos** : bucket créé seulement après avoir défini et testé les règles d'accès ; privées ; un client ne voit jamais celles d'un autre ; le coach voit celles de ses clients.
10. **Phases sensibles 10, 13, 15, 18** : AVANT — expliquer la migration, montrer tables / colonnes / policies, expliquer la protection des données existantes et le rollback → validation de Lucas → backup → migration → tests → vérification → validation → suite.

Méthode de travail (validée) : une phase = un pré-brief (trouvé / à modifier / fichiers / conservé / risques) → implémentation → post-brief (ajouté / modifié / conservé / tests). Tests obligatoires après chaque modification importante : compile (syntaxe JS), routes, interactions, formulaires, données, authentification, permissions, responsive, fonctionnalités existantes concernées. Lucas a dit « n'attends pas mon go, fonce » pour les phases **sans base** ; les phases avec base attendent son « oui ». Il lit les livraisons avec des captures avant/après.

---

## 4. Les 20 phases — état et contenu

| # | Phase | État | Où c'est dans le code |
|---|---|---|---|
| 1 | Audit | fait | (rapport dans la conversation Cowork ; l'essentiel est ici) |
| 2 | Design system | **en ligne v33** | [A][B][C], `Theme`, `UI`, `SVG` |
| 3 | Navigation | **en ligne v34** | `OUTILS`, `outilsVisibles`, `outilParDefaut`, `outilsPrincipaux`, `construireNav`, `construireBarreBas`, `ALIAS_ROUTES`, `ICONES` ; bloc « Mes données » uniquement dans Profil ; bannière PWA sous le contenu |
| 4 | Accueil | **en ligne v34** | `outilAccueil` (client) ; `Store.lireTout` |
| 5 | Programme | **en ligne v35** | `outilProgramme.avancement / faitesCetteSemaine / vueLecture(P, J)` ; champs coach `pg-cycle`, `pg-duree` ; `P.debut` posé à l'envoi |
| 6 | Nutrition | **en ligne v35** | bouton `.respect` (« Respecté / Non respecté »), compteur du jour, préparation repliée ; même clé `repas_suivi` |
| 7 | Progression | **en ligne v35** | `outilMensurations.html()` réorganisé (ids conservés), saisie repliée (`#mens-saisie`, `#mens-ajouter`), tuile `k-depart` |
| 8 | Mon suivi | **en ligne v35** | `outilSuivi` = `Regularite.monterClient(zone, P, J, pre)` (évolution 5 semaines, objectifs en cartes) + `outilBilan.calculer/vue` ; `outilBilan.masque_nav` |
| 9 | Bilan hebdo | **en ligne v36** | `CONFIG.bilan`, objet `Checkin`, clé `checkins` ; formulaire dans Mon suivi, statut sur l'Accueil, lecture coach dans « Préparer le call » et la fiche |
| 10 | Feedback coach | **en ligne v38** (migration RLS appliquée) | objets `CleCoach`, `Feedback` ; éditeur dans « Préparer le call » (`outilBilan.init`), lecture dans Mon suivi (`#suivi-fb-haut/-bas`) et carte sur l'Accueil ; alerte `bilan_recu` éteinte seulement par un feedback écrit **sous ce bilan** (`Feedback.repond`) |
| 11 | Objectifs (statuts) | **en ligne v36** | `Regularite.statutObjectif / libelleStatut / classeStatut`, `objectifsCoach` (select par objectif), `P.objectifs.statuts` |
| 12 | Régularité paramétrable | **en ligne v36** | `CONFIG.regularite` (`poids`, `seuils`), `Regularite.poids` (getter), `niveau` |
| 13 | Photos | **en ligne v41** (bucket et règles Storage appliqués) | objet `Photos` (`reduire`, `envoyer`, `image`, `retirer`, `valide`, `html`, `monter`), section « Photos de progression » dans Ma progression, lecture seule pour le coach (« Ses courbes ») ; clé `photos` ; `supprimer-acces` efface les photos |
| 14 | Speed Formation | **en ligne v36** | `outilFormation.vue` (en-tête bibliothèque, modules numérotés) ; contenu intact |
| 15 | FREE / CLIENT | **en ligne v39** (migration appliquée) | `profils.statut`, `Auth.estProspect()`, `Auth.inscrire()` + écran « Créer mon compte » (derrière `CONFIG.marque.inscription_libre`, **false**), pastille et bouton « Passer client / Repasser prospect » dans Comptes, statut « client » posé après `creerAcces`, pas d'alerte de suivi pour un prospect |
| 16 | Locked states + Calendly | **en ligne v40** | `CONFIG.marque.calendly`, `CONFIG.marque.gratuit_ouverts` (liste blanche : accueil, formation, profil), `estVerrouille(o)`, `cadenasNav(o)`, `AVANTAGES`, `pageVerrouillee(o)` (dans `afficher()` : pas d'`init()`, aucune donnée lue), `outilAccueil.gratuit()` ; aucun prix |
| 17 | Back-office | **en ligne v37** | `outilTableau`, module `Clients` (`charger`, `resumer`, `alertes`, `ouvrir`), « Mes clients » en cartes sur mobile |
| 18 | Fiche client | **en ligne v37 + v38** (notes privées `NotesCoach`, état du feedback) ; « Calls » laissé de côté (décision de Lucas) | `outilAccueil.fiche()` (consultation), `accueil` dans `MODIFIABLES` |
| 19 | Alertes | **en ligne v37** | `Clients.alertes` |
| 20 | Tests complets + robustesse | **en ligne v42** | `Forme` (structure des données remise d'aplomb à la lecture), `Clients.resumer` isolé par client, filet de sécurité dans `afficher()` (`htmlSur`, `signalerIllisible`), `esc` échappe `'`, `idVideo`, `est_client()` (dépôt de photos réservé aux clients) ; `tests-locaux/verif42.js` |

Format à respecter pour chaque phase : **avant** — ce qui est trouvé dans le code, ce qui sera modifié, fichiers/sections concernés, ce qui est conservé, risques ; **après** — ajouté, modifié, conservé, tests effectués. Une version (`vNN`) par livraison, une note datée dans `NOTESCLAUDE.md`.

---

## 5. Les phases restantes — conception proposée à Lucas (en attente de son « oui »)

Tout par `ALTER / ADD / CREATE OR REPLACE`, dans une transaction, après backup et comptage. Le code applicatif peut être écrit avant la migration à condition de **détecter la capacité** (colonne présente ? écriture refusée 401/403 ? bucket absent ?) et d'afficher un message clair au lieu d'échouer en silence.

### A. Phases 10 (feedback) et 18 (notes privées) — table `donnees`, 6 policies par `ALTER POLICY` — **FAIT (v38, 25/09/2026)**
1. « le coach cree dans la fiche client » et « le coach modifie la fiche client » : liste des clés + `'feedbacks', 'notes_coach'`.
2. « donnees lisibles par leur proprietaire ou le coach » → `((auth.uid() = user_id) AND outil <> 'notes_coach') OR est_coach()`.
3. « donnees creees / modifiees / supprimees par leur proprietaire » → `(auth.uid() = user_id) AND outil NOT IN ('notes_coach','feedbacks')`.
Aucune ligne modifiée. Rollback = ré-appliquer les expressions du §2.3. Tests SQL en transaction annulée : `SET LOCAL ROLE authenticated; SET LOCAL request.jwt.claims = '{"sub":"<uuid>","role":"authenticated"}'` pour un coach, un client, un prospect ; vérifier lecture de `notes_coach` refusée au client, écriture feedback autorisée au coach, pas de lecture croisée.
**Ce qui a été livré (v38)** : objets `CleCoach` (lecture/écriture directes par `Auth.appel`, écriture conditionnelle sur `maj_le`, session vérifiée, messages 401/403/409 ; une mise à jour qui ne touche aucune ligne alors que la ligne n'a pas bougé = refus de la base, pas conflit), `Feedback` (clé `feedbacks`, une entrée par `semaine` = lundi du bilan, champ `bilan` = instant d'envoi du bilan auquel il répond (`envoye_a`, sinon `envoye_le`) ; éditeur dans « Préparer le call » sous chaque bilan reçu + un éditeur « sans bilan » pour la semaine visée ; conflit si l'entrée a changé depuis l'affichage ; si c'est une autre semaine qui a bougé entre la lecture et l'écriture, relecture et nouvel essai ; envois en file ; éditeurs fermés si la lecture échoue) et `NotesCoach` (clé `notes_coach` = `{texte, maj, avant?}`, zone auto-enregistrée dans la fiche, coach uniquement, écriture conditionnelle : si les notes ont changé ailleurs, rien n'est écrasé et les deux versions sont gardées ; une écriture dont la réponse s'est perdue est reconnue et reprise ; idem pour un feedback). Côté client : « Feedback de ton coach » dans Mon suivi (dernier + historique) et carte « Ton feedback est disponible » sur l'Accueil (moins de 7 jours). Alerte `bilan_recu` éteinte seulement par un feedback qui répond à ce bilan (`Feedback.repond`). `accueil` ajouté à `MODIFIABLES`. Les deux clés ne passent jamais par `Store.ecrire` / `envoyer` / `importer` (`Store.clesCoachSeul`).

### B. Phase 15 (FREE / CLIENT) — table `profils` — **FAIT (v39, 25/09/2026)**
1. `ALTER TABLE public.profils ADD COLUMN statut text;` (nullable, **sans défaut**).
2. `UPDATE public.profils SET statut = 'client' WHERE statut IS NULL;` — backfill explicite des 9 comptes (8 clients dont le compte de test, 1 coach), comptage avant/après ; puis `SET NOT NULL` (un statut vide serait lu « client » par l'app).
3. `ALTER TABLE public.profils ALTER COLUMN statut SET DEFAULT 'prospect';` (ne concerne que les comptes créés ensuite).
4. `CREATE OR REPLACE FUNCTION public.protege_role()` : ajouter `or new.statut is distinct from old.statut` à la condition « seul un coach peut changer » (sinon un prospect se passe `client` par l'API).
5. App : `Auth.estProspect()` = `profil.role !== 'coach' && profil.statut === 'prospect'` (colonne absente → personne n'est prospect : rien ne change). Après `Auth.creerAcces` (qui renvoie `{id}`), `PATCH profils?id=eq.<id> {statut:'client'}` (le coach a le droit d'UPDATE). Dans « Mes clients » : badge statut + bouton « Passer client / Repasser prospect », affiché seulement si la colonne existe (`"statut" in p`). KPI « Prospects » du tableau de bord (déjà codé, lit `p.statut`).
6. Inscription libre, en dernier : `Auth.inscrire(email, mdp, prenom, nom)` = `POST /auth/v1/signup` avec `data:{prenom, nom}` (le trigger `creer_profil` lit `raw_user_meta_data`), écran « Créer mon compte » sur le portail, visible seulement si `CONFIG.marque.inscription_libre === true` (drapeau à créer, `false` par défaut) ; Lucas active « Enable email signup » dans Supabase à ce moment-là. Un prospect ne possède que ses propres lignes (RLS inchangées).
Rollback : si seule la base pose problème, `rollback-v39.sql` suffit (l'app v39/v40 reste cohérente : tout y dépend de `statut === 'prospect'` et il n'y a plus de prospect après). Pour revenir à l'app v38 : `git revert <commit v40> <commit v39>` (du plus récent au plus ancien ; un revert de la v39 seule entre en conflit) puis la base. Le script : défaut remis à `'client'`, trigger d'avant (texte exact dans la sauvegarde locale de Lucas, hors dépôt), puis tout « prospect » repasse « client ». `creer-acces` v2 reste compatible avec la base remise en arrière.
**Livré (v39)** : exactement les étapes 1 à 5 (+ `NOT NULL`, + contrainte `check (statut in ('prospect','client'))`, + clé de service autorisée dans le trigger ; migration dans `begin … commit`) ; étape 6 codée mais **fermée** : pour ouvrir l'inscription, Lucas passe `inscription_libre: true` dans `CONFIG.marque` **et** active « Allow new users to sign up » dans Supabase (les deux) — prérequis en §7. 19 tests SQL (répétition annulée, puis sur l'état réel) + `tests-locaux/verif39.js` (34). Après relecture : le statut « client » est posé dès que `creer-acces` renvoie l'id (même si la liste n'a pas pu se charger ; seule l'absence de colonne, `PGRST204`, est ignorée) et un échec s'affiche dans une fenêtre ; un prospect n'apparaît ni dans les encadrés de « Mes clients » ni dans les alertes de sa fiche (la fiche relit son statut) ; « Repasser prospect » demande une confirmation en rouge ; un bouton de statut ou de rôle qui échoue retrouve son libellé.

### C. Phase 16 (locked states) — sans base, après 15 — **FAIT (v40, 25/09/2026)**
Livré : liste blanche `CONFIG.marque.gratuit_ouverts` (`accueil`, `formation`, `profil`) — tout autre onglet est verrouillé pour un prospect, y compris ceux ajoutés plus tard. `estVerrouille(o)` (faux pour le coach, en consultation, et quand la base n'a pas de colonne `statut`), `cadenasNav(o)` (cadenas + « (verrouillé) » pour les lecteurs d'écran), `pageVerrouillee(o)` = `UI.verrou` (« Cette fonctionnalité est disponible avec l'accompagnement MHX. », ce que l'onglet apporte (`AVANTAGES`), « Réserver mon appel » → `CONFIG.marque.calendly`, nouvel onglet) ; dans `afficher()`, une page verrouillée n'appelle pas `init()` : aucune donnée lue. Accueil du prospect : `outilAccueil.gratuit()`. Barre du bas d'un prospect : ses onglets ouverts d'abord, puis un onglet verrouillé. Premier enregistrement du questionnaire : vers l'accueil (Ma progression est verrouillée). **Aucun prix.**
Limites connues : le statut est lu à l'ouverture de l'application (un « Passer client » prend effet à la prochaine ouverture chez le client) ; si le profil ne se charge pas (panne), le prospect voit l'espace client le temps de la session — voulu : verrouiller dans ce cas bloquerait les vrais clients à la moindre erreur réseau, et il ne voit que ses propres données (RLS).

### D. Phase 13 (photos) — Storage — **FAIT (v41, 25/09/2026)**
Bucket privé `photos` (5 Mo max, `image/jpeg,image/png,image/webp`), chemin `<user_id>/s<NNN>-<face|profil|dos>.jpg`. Policies `storage.objects` : propriétaire (`(storage.foldername(name))[1] = auth.uid()::text`) SELECT / INSERT / UPDATE / DELETE, coach (`est_coach()`) SELECT. App : objet `Photos` — compression canvas (max 1080 px, JPEG 0,82, ≈ 200 Ko), envoi `POST /storage/v1/object/photos/<chemin>` (`x-upsert: true`, `Content-Type: image/jpeg`, Bearer), lecture `GET /storage/v1/object/authenticated/photos/<chemin>` → blob → `URL.createObjectURL`, index dans la clé client `photos` `{liste[{semaine, date, vues{face, profil, dos}}]}` ; section « Photos de progression » dans Ma progression (envoi pour la semaine choisie, comparaison Début / S4 / S8 / S12 ou deux semaines au choix, vue par vue), lecture seule pour le coach dans la fiche. Bucket absent → toast « Les photos ne sont pas encore activées ». Rollback : bucket conservé, nos policies retirées.
**Livré (v41)** : comme ci-dessus, avec trois durcissements : bucket en `image/jpeg` seul (l'app convertit tout en JPEG), nom de fichier imposé par les policies INSERT / UPDATE, et l'app ne suit que les chemins valides du compte affiché (l'index est écrit par le client). Comparaison : deux semaines au choix (première et dernière par défaut). Rollback sans DROP : `ALTER POLICY … USING (false) / WITH CHECK (false)` sur nos quatre règles ; le bucket et les fichiers restent. 18 tests SQL (répétition annulée, puis sur l'état réel) + `tests-locaux/verif41.js` (25) + banc de la fonction `supprimer-acces` (17). L'export RGPD (« Mes données ») contient l'index `photos`, pas les images (limite connue, voir §7).

### E. Phase 20 — tests complets — **FAIT (v42, 25/09/2026)**
Parcours client / prospect / coach, mobile / tablette / desktop, FR / EN, RLS (aucune lecture croisée, `notes_coach` illisible), non-régression : générateur de diète, import catalogue, export RGPD, suppression de compte, journal, historiques.
**Livré (v42)** :
- **Robustesse** (un client peut écrire n'importe quoi dans ses propres clés par l'API) : `Forme.cle(cle, contenu)` remet la **structure** d'aplomb à la lecture (`Store.lire`, `Store.lireTout`, `Clients.charger`) — un conteneur du mauvais type devient vide, une liste d'objets perd ses éléments qui n'en sont pas, les valeurs simples ne sont jamais touchées ; vérifié **sans effet** sur les 24 lignes réelles et les 20 lignes du banc (script local, seuls des comptages affichés ; c'est ce contrôle qui a montré que `mens.mesures[].vals` est parfois un tableau dans les vraies données : il est laissé tel quel). Si on ajoute une clé ou un conteneur à `Forme.modeles`, refaire ce contrôle sur une sauvegarde récente. `Clients.resumer` isole chaque client (données illisibles = une ligne avec l'alerte « Données illisibles — à vérifier », jamais un tableau de bord qui tombe). Filet de sécurité dans `afficher()` : une page qui ne peut pas s'afficher le dit (message, traduit côté client) au lieu de rester blanche ; l'erreur reste en console (`[MHX] page illisible`), donc visible pour le banc. **Changement de fiche pendant une opération** (défauts trouvés en relecture, présents avant la v42) : `Store.origines` (WeakMap objet → compte lu) — `Store.ecrire` refuse d'écrire chez le compte affiché un objet lu pour un autre et le dit (« Modification non enregistrée : la fiche a changé pendant l'opération. ») ; `Historique.avantRemplacement` abandonne dans ce cas (plus de diète de A rangée dans l'historique de B) ; les `init()` ne recopient plus leur objet dans `Store.cache` (la copie tombait dans la boîte du compte suivant : le calculateur de B s'ouvrait sur les chiffres de A) ; `Store.oublier` n'annule plus un envoi en attente (un « Programme envoyé » suivi d'un retour rapide à « Mes clients » n'était jamais écrit) ; `Store.ecrire` renvoie `true` / `false`, et les 7 remplacements (historique, bibliothèque, programmes prêts) n'affichent plus de succès si rien n'est écrit ; une écriture refusée après une lecture ratée est annoncée (« Non enregistré : … n'ont pas pu être chargées. Recharge la page. », une fois par 10 s) ; l'objet rendu par une lecture ratée est marqué (`Store.nonLus`, WeakSet) et n'est jamais écrit, même si une lecture plus ancienne réussit après coup et remet le drapeau à « lu » (sinon ses mesures vides écrasaient les vraies) ; aucun message de succès ne s'affiche si l'écriture est refusée (« Bilan envoyé », « Programme envoyé », « Semaine envoyée », « Séance enregistrée », « Semaine N enregistrée » — la saisie reste alors dans le formulaire —, « Profil enregistré », séance de l'outil Entraînement).
- **Sécurité** : `esc` échappe aussi `'` ; `idVideo` n'accepte qu'un identifiant YouTube de 11 caractères avant de construire une iframe (175 vidéos du catalogue et 7 de la formation vérifiées : toutes valides) ; migration Storage : déposer ou remplacer une photo est réservé aux comptes `role = 'client'` **et** `statut = 'client'` (`est_client()`, SECURITY DEFINER, mêmes droits qu'`est_coach`) — un futur prospect ne peut pas remplir le quota ; lire et retirer ses propres photos reste possible.
- **Tests** : banc complet en français et en anglais, thème sombre et clair, mobile et desktop ; `verif42.js` (3 clients aux données piégées : types faux, contenus bruts, listes piégées — tableau de bord, Mes clients, 27 pages de fiche coach, 27 pages client, sans erreur ni écriture ; filet de sécurité) ; point RLS final : les tests SQL des v38, v39, v41 et v42 rejoués sur l'état réel (transactions annulées).
- **Non fait, volontairement** : CSP par empreinte du script (Lucas modifie lui-même `index.html` : une empreinte oubliée casserait toute l'application) ; brouillon local des notes privées (les notes s'enregistrent déjà toutes seules et ne s'écrasent jamais ; à reconsidérer si le coach travaille souvent hors ligne).

---

## 6. Ce que Claude Code doit savoir pour ne rien casser

- **Un seul fichier, pas de build, pas de librairie.** Lucas doit pouvoir ouvrir et modifier `index.html` lui-même. Pas de découpage, pas de `npm`.
- **Ne pas toucher aux formules** (Mifflin-St Jeor, facteur d'activité, 2,2 g/kg, 1,0 g/kg, ajustement des portions) sans accord écrit de Lucas dans `NOTESCLAUDE.md`.
- **`Normaliser`** (régimes / allergènes recalculés à l'import) est le point le plus sensible de l'app : une erreur = un client vegan qui reçoit du lard. Ne pas y toucher sans tests sur `donnees/aliments.json`.
- **Clé Supabase** dans le fichier = clé *publishable* (publique). La clé `service_role` ne doit jamais entrer dans le dépôt.
- **Écriture coach** : trois endroits à aligner (§2.2). Oublier l'un des trois = écriture silencieusement perdue.
- **`Store.lire` refuse d'écrire après une lecture ratée** (drapeau `charge`) : un outil qui lit une clé via `lireTout` mais veut l'écrire doit d'abord la relire par `Store.lire` (cas de `checkins` dans `outilSuivi`).
- **`repas_suivi.mange` est remis à zéro chaque jour à l'ouverture** ; l'historique par jour vit dans `repas_suivi.hist` (70 jours) et c'est lui que lit `Regularite`.
- **`Regularite.bornes(decalage)`** : semaine lundi → dimanche, `0` = semaine en cours (jusqu'à aujourd'hui). Le score : séances notées (50), repas cochés (30), mesure de la semaine (20) ; une partie sans objet sort du calcul. C'est un indicateur de motivation, jamais présenté comme médical.
- **Objectifs** : `P.objectifs.mois` = mois en cours au moment où le coach tape un objectif ; `objectifs_faits.faits` n'est lu que si `mois` correspond.
- **`Checkin.semaineVisee()`** : du jour d'ouverture (vendredi, `CONFIG.bilan.jour_ouverture`) au dimanche suivant → la semaine en cours ; lundi → jeudi → la semaine précédente. Une entrée par lundi ISO. Jamais bloquant.
- **`Clients.charger`** télécharge toutes les lignes `donnees` (sauf historiques) : correct jusqu'à quelques dizaines de clients ; au-delà, paginer ou filtrer.
- **`Catalogue.lire`** pagine par 1 000 et bascule sur les JSON GitHub si la table est vide (`Catalogue.secours`).
- **Consultation** : `Store.oublier(uid)` en sortant d'une fiche ; le cache est par utilisateur (mélanger deux fiches était un bug historique).
- **Traduction** : `Traduction.noeud` traduit les blocs simples par `innerHTML` exact et les nœuds texte par correspondance exacte ; les `svg` ne sont pas « inline » pour lui, donc un `<a>` de nav avec SVG est traduit nœud par nœud (prévoir l'entrée du libellé seul). `data-notr` exclut un élément.
- **Version** : incrémenter `CONFIG.marque.version` à chaque livraison.
- **Tests** : rien n'est fini parce que l'écran s'affiche. Rejouer le banc de test (§8) : 0 erreur console, aucune écriture inattendue.

---

## 7. En suspens / à surveiller

- **Les 20 phases sont faites** (v42, 25/09/2026). Blocs A (10 + 18, v38), B (15, v39), C (16, v40), D (13, v41) et la phase 20 (v42), chacun avec backup vérifié, comptages avant/après et relecture par un sous-agent indépendant avant la migration et le push.
- **Photos — quota** : depuis la v42, seul un compte client (rôle et statut) peut déposer ou remplacer une photo : un prospect ne peut pas remplir le quota Storage du plan gratuit.
- **Photos — à vérifier en vrai par Lucas** (je ne me connecte pas) : sur le compte de test, envoyer une photo (iPhone : vérifier qu'une photo portrait reste droite et que « Choisir une photo » ouvre le sélecteur), la voir côté coach, la retirer ; puis supprimer depuis l'écran coach un compte jetable qui a une photo et vérifier `select count(*) from storage.objects where name like '<id>/%'` = 0.
- **Photos — limites connues** : l'export « Mes données » contient l'index `photos` mais pas les images (à ajouter si un client demande la portabilité de ses photos) ; une photo envoyée dont l'index n'a pas pu être écrit (réseau coupé entre les deux) reste dans le dossier du client sans apparaître : elle est remplacée au prochain envoi pour la même semaine et la même vue, et effacée avec le compte.
- **Inscription publique** : coupée (vérifié par Lucas le 25/09/2026, « Allow new users to sign up » désactivé). Elle reste coupée : Lucas la rouvrira lui-même, tout à la fin.
- **Compte de test** : un compte client de test dédié existe (créé par Lucas le 25/09/2026 ; adresse connue de Lucas, volontairement absente de ce dépôt public). Ne jamais utiliser le compte d'un vrai client. Claude ne se connecte pas avec un mot de passe : les tests SQL simulent ce compte (`set local role authenticated` + `request.jwt.claims`) dans des transactions annulées ; les essais à l'écran sur ce compte sont faits par Lucas.
- **KPI « Prospects »** du tableau de bord : compte les `profils.statut = 'prospect'` (0 tant que l'inscription libre est fermée : les accès créés par le coach sont passés « client »).
- **Avant d'ouvrir l'inscription publique** (Lucas, à la fin) : (1) la phase 16 en ligne (fait : v40) ; (2) la robustesse de `Clients.resumer` face aux données malformées (phase 20) doit être faite — sinon un inconnu inscrit pourrait faire tomber le tableau de bord du coach ; (3) activer la **confirmation d'email** dans Supabase (aujourd'hui désactivée : sinon n'importe qui pourrait s'inscrire avec l'adresse de quelqu'un d'autre ; sans risque pour les comptes existants, tous confirmés) ; un **CAPTCHA** est un chantier de code à faire AVANT (widget + `gotrue_meta_security.captcha_token` sur l'inscription, la connexion, « mot de passe oublié » et `changerMotDePasse`, qui revérifie l'ancien mot de passe par la route de connexion) : **ne jamais activer le CAPTCHA seul dans Supabase**, il vaut aussi pour la connexion et bloquerait tous les clients ; (4) savoir que le verrouillage du mode gratuit est un verrou d'**interface** : un prospect ne possède que ses propres lignes (RLS), il n'a donc rien de privé à atteindre, mais il peut techniquement écrire ses propres clés par l'API, comme un client. Contrôle après chaque ouverture ou création de compte : `select role, statut, count(*) from profils group by 1, 2`.
- **Fiche client** : « Calls » laissé de côté (décision de Lucas, 25/09/2026) : aucune source de données pour les appels. Notes privées et feedbacks : faits (v38).
- **Qualité des données catalogue — 14 aliments animaux étiquetés `vegetarien` + `vegan` à tort dans `donnees/aliments.json`** (relevé le 25/09/2026, inchangé depuis le dernier commit Grok Bot `a3f279d` du 30 août) : `graisse-de-dinde`, `huile-de-foie-de-morue`, `bouillon-de-viande-et-legumes-type-pot-au-feu-degraisse-deshydrate`, `bouillon-de-viande-et-legumes-type-pot-au-feu-non-degraisse-deshydrate`, `bouillon-de-viande-et-legumes-type-pot-au-feu-pret-a-consommer`, `saucisse-de-volaille-type-knack-contenant-du-soja-preemballee`, `biscuit-ou-cracker-aperitif-souffle-gout-bacon`, `pizza-au-chorizo-ou-salami-preemballee`, `pizza-kebab-preemballee`, `sandwich-baguette-merguez-ketchup-moutarde`, `sandwich-grec-ou-kebab-baguette-crudites`, `sandwich-grec-ou-kebab-pita-crudites`, `sandwich-pain-de-mie-complet-bacon-crudites-preemballe`, `sauce-kebab-preemballee`. Vérifié le 25/09 en exécutant le `Normaliser` de la v37 sur ces 14 fiches : **les 14 sont corrigées à l'import et dans le catalogue de secours** (`vegan`/`vegetarien` retirés, `pescetarien` conservé pour l'huile de foie de morue) — le filet fonctionne, mais la source JSON reste fausse. La correction du JSON appartient à **Grok Bot** (`donnees/`), pas à `index.html` ; à lui demander via `NOTESCLAUDE.md`. Autres restes signalés par Grok (30 août, `NOTES-GROK.md`) : produits laitiers sans allergène `lait` (C3), `beurre-de-cacahuete` sorti de vegan par le motif « beurre », `hot-dog-preemballe` encore `sans_porc`.
- **Fichiers dormants** : `CONFIG.marque.formulaire_bilan` (vide, jamais lu), `CONFIG.marque.programme` (vide), `donnees/echauffements.json` et `programme-auto.json` (l'app embarque ses propres `ECHAUFFEMENTS` ; pas de table), `aliments-usda.json` / `aliments-off.json` (jamais importés), `POURGROKBOTMAJ6/7.md`.
- **Speed Formation** : les widgets (diète, priorités, notes, objectifs, challenges) doublonnent des fonctions de l'app ; conservés volontairement (contenu historique de Notion, cases cochées des clients).
- **Sécurité (mineur)** : `est_coach()` exposé en RPC (renvoie un booléen) ; protection « mots de passe compromis » désactivée ; un client peut techniquement réécrire ses propres clés `programme` / `repas` par l'API (voulu : « Remplacer un repas »).
- **Bugs corrigés en route** : erreur console à la sortie de « Ma progression » (redimensionnement en attente) — garde ajoutée dans `tout()` ; « il y a -1 j » dans Mes clients (horloge en avance) — `jours()` ne renvoie plus de négatif.
- **Poids du fichier** : ≈ 650 Ko (≈ 150 Ko de base64 : logo, icônes, manifeste), rechargé à chaque visite (`no-cache`). Acceptable ; ne pas laisser grossir sans raison.
- **Journal `perf` du coach et « Entraînement »** : outil historique du coach, conservé, non refondu.
- **Robustesse face à des données client malformées** : traitée en v42 (voir §5.E) — structure remise d'aplomb à la lecture, un client illisible n'emporte plus le tableau de bord, filet de sécurité par page, `verif42.js`. Plus aucune injection HTML depuis la 37.1 (`verif-xss.js`). Écartés volontairement : CSP par empreinte, brouillon local des notes (§5.E).

---

## 8. Banc de test local (à réutiliser) — dossier `tests-locaux/` à la racine du dépôt

Playwright + Chromium, **Supabase simulé** (aucun appel à la vraie base ; toute écriture est interceptée et journalisée), données fictives et aucune clé (`fixtures.js` : 1 coach « Coach Démo », 3 clients — Thomas complet, Sarah sans programme ni diète, Julien inactif et questionnaire incomplet ; catalogue = fichiers `donnees/`).

```
# depuis le dossier tests-locaux/ (à la racine du dépôt ; donnees/ est lu dans le dossier parent)
export NODE_PATH=$(npm root -g)          # playwright installé globalement
node rig.js --html ../index.html --out captures/vNN [--theme light] [--only client|coach|anon] [--lang en]
      # rend ~64 pages (client, coach, fiche client, connexion) en mobile et desktop, capture, relève les erreurs console
node flux.js ../index.html captures/flux   # 19 tests : fenêtres UI (annuler = aucune écriture), thème, anglais
node verif34.js ../index.html              # navigation, accueil, bloc Mes données, alias
node verif35.js ../index.html              # programme (badge notée), nutrition (Respecté), suivi (objectif), progression (saisie repliée)
node verif36.js ../index.html              # bilan hebdo (envoi = clé checkins), statuts d'objectifs, Préparer le call
node verif37.js ../index.html              # tableau de bord (KPI, alertes), fiche, Mes clients en cartes
node verif38.js ../index.html              # feedback du coach, notes privées, RLS simulée, conflits, réponse perdue, refus 403, restauration (66)
node verif-xss.js ../index.html            # données client piégées : aucune injection dans les écrans coach et client (5)
node verif39.js ../index.html              # statut prospect / client, création d'accès, inscription libre fermée / ouverte (35)
node verif40.js ../index.html              # mode gratuit : cadenas, pages verrouillées sans lecture de données, Calendly, aucun prix, pas de débordement (26)
node verif41.js ../index.html              # photos : envoi réduit en JPEG, index, comparaison, retrait, coach en lecture seule, autre client refusé, index piégé, fichier disparu, index illisible (25)
node verif42.js ../index.html              # robustesse : 3 clients aux données piégées, tableau de bord et 54 pages sans erreur ; filet de sécurité, page quittée pendant son chargement, changement de fiche, lecture ratée (20)
```
Sur le Mac de Lucas (pas de Chromium Playwright) : Node 22 est installé dans `~/.local/node` (`export PATH="$HOME/.local/node/bin:$PATH"`), Playwright en global sans navigateur, et le banc tourne avec le Chrome du système : `NODE_OPTIONS="--require ./chrome-systeme.js" node rig.js …`. Attendu v42 : 64 pages, 0 erreur, 0 écriture ; 19 + 13 + 14 + 13 + 15 + 67 vérifications, verif-xss 5/5, verif39 35/35, verif40 26/26, verif41 25/25, verif42 20/20 ; `rig.js --lang en` et `--theme light` : 64 pages, 0 erreur chacun. **Règle des simulations** : router les requêtes par nom d'hôte (`new URL(u).hostname`), jamais par sous-chaîne — une URL Supabase contient `localhost` dans `redirect_to`.
Contrôles rapides sans navigateur :
```
node -e "const s=require('fs').readFileSync('index.html','utf8');const js=s.slice(s.indexOf('<script>')+8,s.lastIndexOf('</script>'));new Function(js);console.log('JS OK');
const css=s.slice(s.indexOf('<style>')+7,s.indexOf('</style>'));console.log('CSS',(css.match(/{/g)||[]).length,(css.match(/}/g)||[]).length);
const m=js.match(/I18N\.en = \{([\s\S]*?)\n\};/);const k=[...m[1].matchAll(/\"((?:[^\"\\\\]|\\\\.)*)\":/g)].map(x=>x[1]);console.log('clés I18N dupliquées:',k.filter((x,i)=>k.indexOf(x)!==i));"
```
Comparer les appels API entre deux versions (ils doivent rester identiques hors ajout voulu) :
```
grep -o '"/rest/v1/[^"]*"\|"/auth/v1/[^"]*"\|"/functions/v1/[^"]*"' index.html | sort | uniq -c
```
Comptages « avant / après » pour une migration (SQL, lecture seule) :
```sql
select role, count(*) from public.profils group by role;
select user_id, outil, length(contenu::text) as taille, maj_le from public.donnees order by user_id, outil;
select outil, count(*) from public.donnees group by outil order by outil;
select (select count(*) from aliments), (select count(*) from recettes), (select count(*) from programmes_types), (select count(*) from exercices), (select count(*) from bibliotheque);
select tablename, policyname, cmd, qual, with_check from pg_policies where schemaname='public' order by 1,2;
select proname, pg_get_functiondef(oid) from pg_proc where pronamespace='public'::regnamespace;
```

---

## 9. Coordination avec Grok Bot

- Grok Bot lit `NOTESCLAUDE.md` à chaque tour et écrit dans `NOTES-GROK.md` (messages courts et datés, une ligne par point). Il ne touche pas à `index.html` ; s'il teste la plateforme en ligne, ses retours QA vont dans ces fichiers.
- Chaque livraison de Claude Code = une section datée dans `NOTESCLAUDE.md` : version, phases, ce qui a changé, clés / champs ajoutés, tests. C'est aussi la mémoire du projet.
- Lucas veut que les deux agents travaillent **en équipe, pas en parallèle** : signaler à Grok Bot toute donnée dont l'app aurait besoin (ex. nouveaux champs dans `exercices.json`), et relire ses commits dans `donnees/` avant un import (`Catalogue` → « Importer le catalogue » dans l'onglet coach).
- Une conversation automatique Lucas × Claude × Grok existe aussi dans Notion (« CONVERSATION — LUCAS × CLAUDE × GROK ») et une revue hebdomadaire de la plateforme le lundi ; hors périmètre de Claude Code, mais Lucas peut y faire référence.

---

## 10. Checklist de reprise

1. Cloner `https://github.com/lcsmhx/mhx-plateforme` ; vérifier que `CONFIG.marque.version` du dépôt et le pied de page de https://lcsmhx.github.io/mhx-plateforme/ affichent la même version (v42 au 25/09/2026).
2. Lire `NOTESCLAUDE.md` en entier (sections du 25/09/2026 : v33 → v42).
3. Installer le banc de test (`tests-locaux/README.md`) et le lancer sur la version en ligne : attendu v42 = 64 pages, 0 erreur, 19 + 13 + 14 + 13 + 15 + 67 vérifications, verif-xss 5/5, verif39 35/35, verif40 26/26, verif41 25/25, verif42 20/20, toutes réussies (voir §8).
4. Pour la suite (phases sensibles) : rédiger le brief de migration (§5), attendre le « oui », faire le backup et les comptages, migrer dans une transaction, tester en SQL par rôle, tester sur le compte de test, comparer les comptages, livrer, noter dans `NOTESCLAUDE.md`.
5. Ne jamais pousser ni migrer hors du cadre donné par Lucas (règle n° 2 : autonomie sous garde-fous, relecteur indépendant avant chaque migration et chaque push). Ne jamais toucher `donnees/` (Grok Bot) ni les formules.

---

## 11. À vérifier par Lucas (à l'écran, avec le compte de test — Claude ne se connecte jamais)

1. **Version** : le pied de page affiche « · 42 » (recharger l'app sur chaque appareil ; l'app installée sur téléphone : la fermer complètement puis la rouvrir).
2. **Coach** : tableau de bord et « Mes clients » s'affichent ; ouvrir la fiche du compte de test ; « Préparer le call » → écrire un feedback sous un bilan ; « Notes privées » → taper une ligne, recharger : elle est là.
3. **Création d'accès** (si besoin d'un compte jetable) : créer un accès client → il apparaît « client » dans Comptes (pas « prospect ») ; `select role, statut, count(*) from profils group by 1, 2` ne doit montrer aucun « prospect » tant que l'inscription est fermée.
4. **Compte de test (client)** : Accueil, Mon programme, Nutrition, Ma progression, Mon suivi, Speed Formation, Profil s'ouvrent sans message d'erreur, en français puis en anglais.
5. **Photos** (compte de test) : Ma progression → envoyer une photo de face (sur iPhone : vérifier qu'une photo portrait reste droite et que « Choisir une photo » ouvre le sélecteur) ; comparer deux semaines ; côté coach, « Ses courbes » la montre ; retirer la photo.
6. **Mode gratuit** : dans Comptes, « Repasser prospect » le compte de test, fermer et rouvrir l'app sur ce compte → seuls Accueil, Speed Formation et Profil sont ouverts, les autres onglets montrent le cadenas et « Réserver mon appel » (Calendly) ; puis « Passer client » à nouveau.
7. **Suppression** (compte jetable seulement, jamais un vrai client) : lui ajouter une photo, le supprimer depuis Comptes, puis `select count(*) from storage.objects where name like '<son id>/%'` = 0.
8. **Avant d'ouvrir l'inscription publique** : lire les prérequis du §7 (confirmation d'email ; CAPTCHA = chantier de code d'abord, ne jamais l'activer seul), puis `inscription_libre: true` dans `CONFIG.marque` **et** « Allow new users to sign up » dans Supabase.
