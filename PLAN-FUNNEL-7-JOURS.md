# Funnel « 7-Day Challenge » — Étape A : audit, architecture, versions, textes

Rédigé le 25 septembre 2026 par Claude Code, à la demande de Lucas. Étape A validée par Lucas le 25/09 (ses réponses aux décisions de la section 5 sont reprises en section 7) ; l'étape B est en cours, version par version (suivi en section 7).

---

## 0. En deux minutes

- **Bonne nouvelle n° 1 : aucune migration Supabase n'est nécessaire.** La table `donnees` accepte n'importe quelle clé pour son propriétaire ; la progression du challenge sera une nouvelle clé `challenge`, écrite par le prospect, lue par le coach. Les règles d'accès actuelles la couvrent déjà. Zéro risque pour les données des 7 clients.
- **Bonne nouvelle n° 2 : presque tout existe déjà.** Statut prospect (v39), écrans verrouillés + Calendly (v40), inscription libre codée mais fermée (v39), questionnaire avec son rendu de champs, calcul calorique isolé en trois fonctions pures, bilan hebdo avec ses échelles 1 → 5, catalogue d'exercices avec vidéos, design system complet. Le chantier = un nouvel outil `challenge` + une inscription allégée + quelques branchements.
- **Ce qui ne colle pas avec le funnel aujourd'hui** : (1) un nouveau compte est envoyé d'office sur le questionnaire complet (57 questions, 10-15 min) — à contourner pour les prospects ; (2) l'inscription demande prénom + nom + mot de passe saisi deux fois — à simplifier ; (3) l'accueil du prospect et la Speed Formation ouverte forment une « bibliothèque gratuite » — à recentrer sur le challenge ; (4) pas de texte de confidentialité ni de case à cocher — à ajouter ; (5) le retour du lien de confirmation d'email n'est pas géré (la personne retombe sur l'écran de connexion) — à gérer avant l'ouverture.
- **Point de vigilance pour l'ouverture** : l'envoi d'emails intégré à Supabase (plan gratuit) est limité à quelques emails par heure. Avec la confirmation d'email activée, une campagne Instagram sature ça en minutes. Il faudra brancher un SMTP externe gratuit (Brevo, Resend…) dans Supabase avant d'ouvrir : détaillé en section 6.
- **4 versions** (v44 → v47), chacune livrable seule, invisible pour les clients et le coach tant que l'inscription reste fermée.

---

## 1. Audit de l'existant (état v43, vérifié dans le code et dans la base le 25/09/2026)

### 1.1 Inscription
- `Auth.inscrire(email, mdp, prenom, nom)` → `POST /auth/v1/signup` avec `data: { prenom, nom }`. Le déclencheur `creer_profil` (vérifié en base) crée `profils(id, prenom, nom)` ; `statut` prend le défaut `'prospect'` (colonne `NOT NULL DEFAULT 'prospect'`, vérifiée), `role` le défaut `'client'`.
- Écran `portail("inscription")` : champs prénom, nom, email, mot de passe, confirmation, « Rester connecté ». Règles : prénom obligatoire, mot de passe ≥ 8 caractères, les deux mots de passe identiques. N'apparaît que si `CONFIG.marque.inscription_libre === true` (aujourd'hui `false`) ; `#/inscription` ouvre alors cet écran.
- Si Supabase renvoie une session (confirmation d'email désactivée) → rechargement et entrée directe. Sinon → message « Compte créé. Ouvre le lien reçu par email… ».
- **Retour du lien de confirmation** : `demarrer()` ne traite que `type=recovery`. Un lien de confirmation renvoie `#access_token=…&type=signup` : ces jetons sont ignorés et la personne voit l'écran de connexion. À gérer (v47).
- Base : 9 comptes `auth.users`, tous confirmés. Activer la confirmation d'email n'aura aucun effet sur eux. Inscription publique coupée (confirmé par toi).
- Aucun texte de conditions / confidentialité dans l'application (seule mention : l'export RGPD art. 15 dans « Mes données »). Le bloc « Mes données » du Profil (export, restauration, suppression du compte) existe et vaut pour un prospect.

### 1.2 Statut prospect et mode gratuit (v39 + v40)
- `Auth.estProspect()` = `role !== 'coach' && statut === 'prospect'`. `estVerrouille(o)` verrouille tout onglet hors `CONFIG.marque.gratuit_ouverts` = `["accueil", "formation", "profil"]` (liste blanche : un onglet ajouté est verrouillé par défaut → il suffira d'ajouter `"challenge"`).
- `pageVerrouillee(o)` = `UI.verrou` (cadenas, « Cette fonctionnalité est disponible avec l'accompagnement MHX. », ce que l'onglet apporte via `AVANTAGES`, bouton « Réserver mon appel » → Calendly). Une page verrouillée ne lit aucune donnée.
- `outilAccueil.gratuit(zone)` : accueil du prospect (bienvenue, accès Formation + Profil, liste des avantages, bouton Calendly). C'est la page à transformer en **hub du challenge**.
- Barre du bas d'un prospect : ses onglets ouverts d'abord, puis un verrouillé (`outilsPrincipaux`). Le statut est lu à l'ouverture de l'app.
- Coach : pastille « prospect » dans Mes clients et dans la fiche, boutons « Passer client / Repasser prospect » (protégés par le trigger `protege_role`, vérifié), KPI « Prospects » du tableau de bord, aucune alerte de suivi pour un prospect (`Clients.alertes`).
- Photos : dépôt réservé aux comptes `role = client` **et** `statut = client` (`est_client()`, vérifié) : un prospect ne peut pas remplir le stockage.

### 1.3 Questionnaire (`QUESTIONS`, clé `intake`)
- 57 identifiants en 6 sections ; champs requis : `nom, age, sexe, taille, poids, objectif, niveau, lieu, seances, journee_type, nb_repas, regime_type`. `intake.complet` = tous les requis remplis.
- `outilProfil.champ(q, valeur)` rend n'importe quelle question (`texte, long, nombre, date, select, multi, echelle` 1 → 10) : **réutilisable tel quel** pour le diagnostic du jour 1.
- **Première connexion d'un client** (`demarrer()`) : si `intake.complet` est faux → redirection forcée vers `#/profil` avec bandeau « Bienvenue ! Commence par remplir ton profil ». Pour un prospect, c'est l'inverse de l'expérience voulue : à contourner (le prospect arrive sur le challenge ; le questionnaire complet s'ouvrira comme aujourd'hui quand tu le passeras « client »).
- La fiche coach lit `intake` (âge, sexe, taille, poids, objectif…) : les réponses du jour 1 y apparaîtront naturellement si on les range dans `intake`.

### 1.4 Calendly
- `CONFIG.marque.calendly = "https://calendly.com/mhx-coaching/30min"`, utilisé par `UI.verrou`, `pageVerrouillee`, `outilAccueil.gratuit` (lien `target="_blank" rel="noopener"`, passé par `lienSur`). Réutilisé tel quel pour les CTA du challenge.

### 1.5 Stockage et règles d'accès (vérifiés en base)
- `donnees(user_id, outil, contenu jsonb, maj_le)`, un document par clé. `Store.lire / ecrire / lireTout`, `Forme.modeles` (structure remise d'aplomb à la lecture, v42).
- Policies `donnees` : propriétaire → SELECT / INSERT / UPDATE / DELETE sur toute clé sauf `feedbacks`, `notes_coach` ; coach → SELECT tout, INSERT / UPDATE sur la liste `programme, repas, calc, complements, hist_programme, hist_repas, feedbacks, notes_coach`. **Une clé `challenge` écrite par le prospect est donc déjà autorisée**, et lisible par le coach, sans rien changer.
- `donnees.user_id` et `profils.id` → `auth.users(id) ON DELETE CASCADE` (vérifié) : la suppression d'un compte (edge function `supprimer-acces`, v41) emporte ses lignes, dont `challenge`.
- Comptages du jour : 9 profils (8 `client/client`, 1 `coach/client`), 28 lignes `donnees` (aucune clé `challenge`), 1 photo dans Storage. Ce sont les comptages de référence pour le « avant / après » de la v44.
- `Clients.charger` télécharge toutes les lignes `donnees` sauf historiques et notes : la clé `challenge` arrivera côté coach **sans requête supplémentaire**. Une écriture de `challenge` compte comme activité du prospect (clé écrite par lui).
- Consentement : `auth.users.raw_user_meta_data` garde tout ce qu'on envoie dans `data` à l'inscription (le déclencheur n'en lit que `prenom` et `nom`) → on peut y ranger la date d'acceptation des conditions, sans migration.

### 1.6 Speed Formation (`FORMATION`, clé `formation`)
- 7 modules (00 Introduction, 01 Mindset, 02 Alimentation, 03 Entraînement, 04 Organisation, 05 Les challenges — 5 challenges hebdomadaires c1…c5 —, 06 Accélérateurs), vidéos YouTube, cases à cocher, widgets (diète, priorités, notes, objectifs, défis).
- Ouverte aux prospects aujourd'hui. Attention au nom : le module 05 s'appelle déjà « Les challenges » (`D.challenge` dans la clé `formation`). Aucun conflit de stockage avec la nouvelle clé `challenge`, mais je nommerai l'onglet **« 7-Day Challenge »** (ou « Challenge 7 jours », à ton choix) pour ne pas mélanger.

### 1.7 Calcul calorique (`outilCalculateur`, `CONFIG.calcul`)
- Trois fonctions pures : `metabolismeDeBase(d)` (Mifflin-St Jeor), `facteurActivite(d)` (1,20 + pas + heures), `macros(kcal, poids)` (2,2 g/kg, 1,0 g/kg, glucides = reste). Formules **intouchées**, réutilisables depuis le challenge en passant `{sexe, age, taille, poids, pas, heures}`.
- Le calculateur part déjà du questionnaire (`intake.poids/taille/age/sexe/pas`, `heures = seances × 1,25`, objectif détecté sur `intake.objectif`). Je sortirai ce petit passage « questionnaire → données de calcul » dans une fonction partagée pour que le jour 1 et le jour 5 fassent **exactement** le même calcul que le coach (sans changer le comportement du calculateur, vérifié par le banc).

### 1.8 Design system (v33)
- Jetons `--accent` doré (accent seulement), `--good / --warn / --bad`, rayons, durées ; composants `.panel`, `.tile`, `.bar`, `.pastille`, `.acces`, `.objectif` (carte à cocher), `.seg.echelle5` (échelle 1 → 5 du bilan hebdo), `.timeline`, `.flag`, `.verrou`, `.btn / .ghost`, `UI.volet / toast / confirmer`, icônes SVG `ICONES` (à compléter d'une icône `challenge` dans la même famille). **Aucune couleur nouvelle** : le stepper des 7 jours et la carte du jour se font avec ces briques. Une dizaine de règles CSS ajoutées en section [C] (`.ch-…`).

### 1.9 Côté coach
- Fiche prospect (`outilAccueil.fiche`) : bandeau « Compte gratuit : pas de suivi à assurer… », blocs Profil / Objectifs / Programme / Nutrition… Aucune trace du challenge, évidemment.
- Proposition (section 5, à ton accord) : une pastille « Challenge J n/7 » dans Mes clients et un bloc « 7-Day Challenge » dans la fiche (jour atteint, dates, erreur / habitude choisies, « où en es-tu ? » du jour 6, clic sur Réserver). Lecture seule, zéro écriture coach.

### 1.10 Banc de test
- `tests-locaux/` : rig (64 pages), flux, verif34 → verif43, verif-xss. Personas : coach, 3 clients ; `verif39/40` ajoutent la prospecte « Léa ». Les tests à **mettre à jour** (ils échoueront volontairement sur la nouvelle inscription et le nouvel accueil prospect) : `verif39` (champs `c-nom`, `c-mdp2`), `verif40` (barre du bas du prospect, texte de l'accueil gratuit). Nouveaux : `verif44…47`, persona `prospect` dans `rig.js`.

---

## 2. Architecture proposée

### 2.1 Parcours
Instagram → `https://lcsmhx.github.io/mhx-plateforme/#/inscription` → écran « Rejoins le 7-Day Challenge » (prénom, email, mot de passe, case conditions) → compte créé, statut `prospect` (base) → arrivée directe sur **Jour 1** → un jour = une page : intro courte, contenu, **une action à valider**, félicitations, aperçu du lendemain → hub (accueil) = progression JOUR n/7 + carte du jour → J5 personnalisation → J6 projection → J7 « Réserver mon appel » (Calendly). Tout se passe dans les onglets ouverts au prospect ; le reste garde ses cadenas (v40).

### 2.2 Stockage
**Nouvelle clé client `challenge`** (écrite par le prospect, lue par le coach) :
```
challenge: {
  version: 1,
  debut: "2026-09-26",                       // date locale du jour 1 validé
  jours: {                                   // une entrée par jour validé
    "1": { fait: "2026-09-26T08:12:00Z" },
    "2": { fait: "…", erreur: "boire", ressenti: "moyen" },
    "3": { fait: "…", tours: 3, ressenti: 4 },
    "4": { fait: "…", habitude: "eau", quand: "au réveil", ou: "cuisine" },
    "5": { fait: "…", interet: "calories" },
    "6": { fait: "…", etat: "avancer" | "hesite" | "pas_maintenant" },
    "7": { fait: "…", reserve: true }
  },
  cta: { clics: [ { jour: 6, date: "…" } ] },  // clics sur « Réserver mon appel »
  termine: "2026-10-02T…" | null
}
```
`Forme.modeles.challenge = { jours: {}, cta: { clics: [] } }` (contrôle « sans effet » trivial : aucune ligne réelle n'existe).

**Réponses du jour 1 → clé `intake` existante** (mêmes identifiants : `sexe, age, taille, poids, poids_obj, objectif, niveau, seances, lieu, nb_repas, sommeil_h, energie`, + `pas` et `pourquoi` facultatifs). Avantages : le coach les voit dans la fiche et « Son questionnaire » ; si tu passes le prospect « client », son questionnaire complet s'ouvre **pré-rempli** comme aujourd'hui (`complet` reste faux tant que `nom, journee_type, regime_type` manquent). Aucune duplication.

**Consentement** : envoyé dans `data` à l'inscription (`consentement: "<date ISO>", conditions_version: "2026-09"`) → rangé par Supabase dans `auth.users.raw_user_meta_data`. Preuve horodatée, sans migration.

### 2.3 Règles d'accès et migration
- **Aucune migration.** `challenge` = clé propriétaire ordinaire (comme `checkins` en v36, `photos` en v41). Le coach ne l'écrit jamais : pas d'ajout dans `Store.ecrire`, `MODIFIABLES` ni les policies coach.
- Vérifications de non-régression malgré tout (protocole habituel) : backup de la base avant la v44 (même méthode : export + empreintes `sauvegardes/empreintes.sql`), comptages avant / après identiques (la v44 n'écrit rien en base par elle-même), tests RLS rejoués en transaction annulée avec un compte fictif : un prospect écrit `challenge` et `intake` chez lui seulement ; il ne lit rien d'un autre ; le coach lit `challenge` et ne peut pas l'écrire.
- Rollback = `git revert` de la version (aucune structure changée). Les lignes `challenge` d'éventuels prospects de test restent, inoffensives.

### 2.4 Navigation et démarrage
- Nouvel outil `outilChallenge` : `id "challenge"`, `cle "challenge"`, `nom "7-Day Challenge"`, `client_seul`, `principal`, `sans_entete`, nouveau drapeau `prospect_seul: true` (visible seulement si `Auth.estProspect()` ; un client accompagné n'a pas l'onglet). Route `#/challenge` (+ `#/challenge/3` pour un jour précis).
- `CONFIG.marque.gratuit_ouverts` = `["accueil", "challenge", "profil"]` (+ `"formation"` selon ta réponse, section 5).
- Accueil prospect (`outilAccueil.gratuit`) = **hub** : « Bonjour Prénom · Jour n / 7 », barre de progression, 7 étapes, carte « Aujourd'hui : … » → bouton vers le jour, puis (à partir du jour 5) le bloc accompagnement. Compact : la vraie page, c'est le challenge.
- Démarrage (`demarrer()`) : un prospect **n'est plus envoyé sur le questionnaire** ; s'il n'a encore rien validé, il arrive sur `#/challenge` (jour 1) ; sinon sur l'accueil (hub). Clients et coach : strictement inchangés (`!Auth.estCoach() && !Auth.estProspect()`).
- Profil d'un prospect : bloc « Mon compte » (email, mot de passe) + « Mes données » (export, suppression) + une ligne « Ton questionnaire complet sera à remplir au démarrage de l'accompagnement ». Le formulaire de 57 questions ne lui est pas montré.
- Barre du bas prospect : Accueil · 7-Day Challenge · Profil (· Formation) + un onglet verrouillé, comme en v40.

### 2.5 Déblocage des jours
- Le jour n+1 s'ouvre quand le jour n est validé **et** que la date locale a changé (`CONFIG.challenge.un_jour_par_jour: true`, modifiable par toi ; `false` = enchaîner librement). Un jour manqué ne remet rien à zéro : « Tu reprends là où tu t'es arrêté ». Le jour en cours affiche « Disponible demain » quand il est validé.
- Un jour déjà validé reste consultable (lecture, réponses affichées), non re-validable.

### 2.6 CTA progressifs (aucun prix, jamais)
| Jour | Ce qui apparaît |
|---|---|
| 1 → 3 | Rien vers le coaching. Une seule ligne de contact : Instagram `@lucasmhxcoaching` en pied de page (déjà là). |
| 4 | Carte d'information « Ce que change un coach à ce stade » — sans bouton. |
| 5 | Lien discret « Voir ce que comprend l'accompagnement » → volet (`UI.volet`) avec les `AVANTAGES` existants + bouton fantôme « Réserver mon appel ». |
| 6 | Bouton secondaire « Réserver mon appel » (Calendly) + « ou attends demain pour la dernière étape ». |
| 7 | Bouton principal **RÉSERVER MON APPEL** (Calendly) + case « J'ai réservé mon appel » (enregistrée, visible du coach). |
| après | Hub « Challenge terminé le … » avec le bouton principal en permanence. |
Chaque clic sur Calendly est enregistré dans `challenge.cta.clics` (jour + date) : tu vois qui a cliqué sans avoir réservé.

### 2.7 Réutilisations précises (pas de doublon)
| Besoin | Réutilisé |
|---|---|
| Champs du diagnostic | `outilProfil.champ(q, v)` + questions de `QUESTIONS` (mêmes ids) |
| Échelles ressenti 1 → 5 | `.seg.echelle5` de `Checkin.champ` |
| Calories, protéines | `outilCalculateur.metabolismeDeBase / facteurActivite / macros` + `CONFIG.calcul` (formules intouchées) |
| Vidéos de la mini-séance | `outilFormation.video(id)` + identifiants du catalogue `exercices` (squats, pompes, pompes murales, fentes arrière, pont fessier, gainage — tous « Aucun matériel », niveau Débutant, vidéo présente) ; échauffement = `ECHAUFFEMENTS` embarqué |
| Verrous, Calendly | `UI.verrou`, `pageVerrouillee`, `AVANTAGES`, `CONFIG.marque.calendly` |
| Fenêtres, messages | `UI.volet / toast / confirmer` (jamais `alert`) |
| Écriture / lecture | `Store.lire / ecrire`, `Forme`, `Store.lireTout` côté coach (`Clients.charger`) |
| Traduction | `trad()`, `I18N.en`, `Contenus.zip(fr, en)` (voir 2.8) |
| Fiche coach (si accord) | `outilAccueil.fiche` (bloc supplémentaire), `Clients.resumerUn` (pastille) |

### 2.8 Anglais
Les textes des 7 jours vivent dans une constante `CHALLENGE7` (section [D], modifiable par toi comme `CONFIG`), avec sa version anglaise `CHALLENGE7.en` de même forme. Au démarrage en anglais, `Contenus.zip(CHALLENGE7, CHALLENGE7.en)` alimente le dictionnaire : la couche de traduction existante fait le reste. Les phrases avec variables passent par `trad("…{n}…", {n})`. Règle du HANDOFF respectée : chaque chaîne visible a son entrée anglaise, livrée **dans la même version** que le français.

### 2.9 Tests (par version)
- Contrôles rapides : syntaxe JS, accolades CSS, clés `I18N.en` dupliquées, comparaison des appels API (`grep` du HANDOFF §8 : seule différence attendue = aucune nouvelle route ; `challenge` passe par les routes existantes de `donnees`).
- Banc complet sérialisé (rig FR / EN / thème clair, flux, verif34 → 43 mis à jour, verif-xss) : 0 erreur, 0 écriture inattendue.
- Nouveaux `verif44…47` : inscription (3 champs + case obligatoire, corps du `POST /auth/v1/signup` = `data.prenom`, `data.nom = ""`, consentement daté ; inscription fermée → rien ne change), démarrage prospect (jamais `#/profil`), jour 1 (écrit `intake` + `challenge`, rien d'autre), déblocage (jour suivant verrouillé le même jour, ouvert le lendemain — horloge simulée), aucun CTA avant le jour 4, Calendly au jour 7 (`target=_blank`), clic enregistré, aucun prix sur toutes les pages, aucune lecture de données sur les pages verrouillées (inchangé), mobile 390 px sans débordement, anglais, coach : fiche du prospect sans erreur (et bloc challenge si accord), client accompagné : onglet absent, parcours client strictement identique (captures avant / après).
- Chaque `verifNN` doit **échouer sur la v43** (preuve qu'il teste).
- Relecture par un sous-agent indépendant avant chaque push.

### 2.10 Backup et rollback
Backup base avant la v44 (`sauvegardes/2026-09-XX-avant-v44/`, hors dépôt, empreintes), même si aucune migration : c'est le protocole. Rollback = `git revert <commit>` ; base intacte par construction.

---

## 3. Découpage en versions

| Version | Contenu | Base | Visible par |
|---|---|---|---|
| **v44 — Socle** | Inscription simplifiée (prénom, email, mot de passe, case conditions + volet texte) · outil `challenge` (stepper 7 jours, déblocage, félicitations) · **Jour 1** (diagnostic + prise de conscience) · hub prospect · démarrage prospect sans questionnaire forcé · profil prospect allégé · `Forme` · anglais · `verif44` + mises à jour `verif39/40` + persona prospect dans le rig | aucune | personne (inscription fermée ; un prospect n'existe pas) |
| **v45 — Jours 2, 3, 4** | Nutrition (erreur + action), mini-séance (vidéos catalogue, échauffement, niveau), habitude (intention « quand / où ») · carte info jour 4 · anglais · `verif45` | aucune | personne |
| **v46 — Jours 5, 6, 7** | Personnalisation (calcul partagé avec le calculateur), projection 90 jours, conversion (Calendly, case « J'ai réservé »), CTA progressifs, clics enregistrés, état « terminé » · anglais · `verif46` | aucune | personne |
| **v47 — Finitions et ouverture** | Retour du lien de confirmation d'email (entrée directe après le clic) · écran « Vérifie ta boîte mail » · côté coach : pastille + bloc « 7-Day Challenge » (si accord) · `HANDOFF` + `NOTESCLAUDE` + **marche à suivre d'ouverture** · `verif47` | aucune | coach (bloc fiche) |

Chaque version : backup, banc complet, relecteur indépendant, commit + push seulement si tout passe, note datée dans `NOTESCLAUDE.md` pour Grok Bot, résumé court pour toi. Le tout derrière `inscription_libre: false` et `estProspect()` : **les 7 clients et toi ne verrez aucune différence** jusqu'à la v47 (bloc fiche) et ton ouverture.

---

## 4. Brouillon des textes des 7 jours (à valider : contenu et ton)

Tutoiement, phrases courtes, neutre homme / femme (formulations sans accord de genre), aucun chiffre promis, aucun conseil médical, aucun prix. Les [crochets] sont des valeurs calculées.

### Écran d'inscription
- Titre : **Rejoins le 7-Day Challenge**
- Sous-titre : « 7 jours, une action par jour, gratuit. Tu repars avec ton point de départ, tes chiffres et un plan clair pour la suite. »
- Champs : Ton prénom · Email · Mot de passe (8 caractères minimum, œil pour l'afficher)
- Case : « J'accepte les conditions d'utilisation et la politique de confidentialité » (lien → volet, brouillon en fin de section)
- Bouton : **Commencer le challenge**
- Sous le bouton : « J'ai déjà un compte » · Note : « Le challenge ne remplace pas un avis médical. Si tu as un doute sur ta santé, parles-en à un professionnel avant de commencer. »

### Hub (accueil du prospect)
- « Bonjour [Prénom] » · « 7-Day Challenge · Jour [n] / 7 » · barre de progression · 7 étapes (faites ✓ / en cours / à venir)
- Carte du jour : « Aujourd'hui : [titre du jour] » → bouton « Ouvrir le jour [n] » (ou « Disponible demain » / « Reprendre là où tu t'es arrêté »)
- À partir du jour 5 : bloc « Avec l'accompagnement MHX » (existant)

### Jour 1 — Ton point de départ
- Eyebrow : JOUR 1 / 7 · DIAGNOSTIC
- Intro : « Avant de changer quoi que ce soit, on regarde la réalité en face. 3 minutes, une douzaine de questions, et tu sauras d'où tu pars. Réponds vrai, pas "bien". »
- Questions (rendu du questionnaire existant) : Sexe (pour le calcul, comme dans le questionnaire) · Âge · Taille · Poids actuel · Poids objectif (facultatif) · Ton objectif principal (5 choix existants) · Ton niveau · Séances par semaine que tu peux VRAIMENT tenir · Où tu t'entraînes · Repas par jour · Heures de sommeil par nuit · Énergie dans la journée (1 → 10) · *facultatifs* : Pas par jour si tu le sais · « Pourquoi maintenant ? » (une phrase)
- Bouton : **Voir mon point de départ**
- Prise de conscience (après validation, en tuiles) :
  - « Ton écart : [x] kg entre aujourd'hui et ton objectif. » (si poids objectif)
  - « Ta dépense estimée : environ [N] kcal par jour. C'est une estimation à partir de tes réponses, pas une vérité : la vraie mesure, c'est la balance sur deux semaines. » (calcul du calculateur ; si les pas ne sont pas connus : « estimation basse, pas non renseignés »)
  - « Tes séances : [n] par semaine, c'est ton vrai rythme. Un plan qui en demande plus est un plan que tu abandonnes. »
  - Sommeil < 7 h : « [x] h de sommeil : c'est souvent le premier frein à la récupération et à l'énergie. On y reviendra. » Sinon : « [x] h de sommeil : une base solide. »
  - Énergie ≤ 5 : « Énergie [x]/10 : ça se règle plus souvent dans l'assiette et le sommeil que par plus d'entraînement. »
- Message : « Ce que tu viens de faire, la plupart des gens ne le font jamais : mesurer honnêtement leur point de départ. C'est déjà le premier pas. »
- Action à valider : « J'ai fait mon point de départ » → **Jour 1 validé ✓**
- Demain : « Jour 2 : l'erreur alimentaire qui bloque presque tout le monde. »

### Jour 2 — L'erreur qui bloque presque tout le monde
- Intro : « Tu n'as pas besoin d'un régime parfait. Tu as besoin de retirer l'erreur qui annule tes efforts. Laquelle te ressemble le plus ? »
- Choix (une seule) :
  1. **Sauter des repas, puis compenser le soir** — « Le corps réclame ce qu'on lui a refusé. Le soir, il gagne. »
  2. **Boire ses calories** — « Sodas, jus, cafés sucrés, alcool : des calories qui ne rassasient pas. »
  3. **Trop peu de protéines** — « Sans protéines à chaque repas, la faim revient vite et le muscle ne suit pas. »
  4. **Le tout ou rien** — « Parfait du lundi au vendredi, dérapage le week-end. Le week-end gagne aussi. »
  5. **Manger sans repère** — « Aucune idée des quantités : impossible de corriger ce qu'on ne voit pas. »
- Action du jour (selon le choix) :
  1. « Aujourd'hui, aucun repas sauté : un vrai déjeuner avec une source de protéines. »
  2. « Aujourd'hui, uniquement de l'eau, du café ou du thé sans sucre. Note ce que tu as remplacé. »
  3. « Aujourd'hui, une source de protéines à chaque repas : œufs, poisson, viande, tofu, légumineuses, laitages. »
  4. « Aujourd'hui, un repas volontairement "moyen" : ni parfait, ni craqué. Le juste milieu, ça s'entraîne. »
  5. « Aujourd'hui, prends en photo un repas complet avant de manger. Juste regarder, sans juger. »
- Pourquoi : « Corriger une seule erreur pendant 7 jours vaut plus qu'un régime parfait pendant 3 jours. »
- Validation : « Action faite » + « C'était : Facile · Moyen · Dur »
- Message : « Jour 2 validé. Tu viens de faire quelque chose de précis, pas "manger mieux". C'est toute la différence. »
- Demain : « Jour 3 : ta première séance, 15 minutes, sans matériel. »

### Jour 3 — Ta première séance, sans matériel
- Intro : « 15 minutes, chez toi, aucun matériel. Le but n'est pas de te détruire : c'est de faire, proprement. »
- Échauffement (3 min) : l'échauffement embarqué de l'app (mobilité, montées de genoux).
- Circuit — [2 / 3 / 4] tours selon ton niveau, 45 à 60 s de repos entre les tours (une vidéo du catalogue par exercice) :
  - Squats — 12 répétitions
  - Pompes — 8 à 12 (contre un mur ou sur les genoux si besoin)
  - Fentes arrière — 8 par jambe
  - Pont fessier — 15
  - Gainage — 30 secondes
- Sécurité : « Une gêne musculaire, c'est normal. Une douleur vive, non : arrête l'exercice. »
- Validation : « Séance faite » + tours réalisés + ressenti 1 → 5 (échelle du bilan hebdo)
- Message : « Jour 3 validé. Tu viens de faire ce que la plupart repoussent "à lundi". »
- Demain : « Jour 4 : ce qui fait tenir quand la motivation baisse. »

### Jour 4 — Ce qui fait tenir
- Intro : « La motivation va et vient. Ce qui reste, ce sont les habitudes que tu poses. Aujourd'hui : une seule, minuscule, mais ancrée. »
- Choix d'une habitude :
  1. Boire un grand verre d'eau au réveil
  2. Marcher 10 minutes après un repas
  3. Préparer mon repas de midi la veille
  4. Couper les écrans 30 minutes avant de dormir
  5. Noter mes repas de la journée (juste noter)
- Intention : « Je le ferai [quand] , [où] » (deux champs courts). « Une habitude sans moment ni lieu reste une intention. »
- Mindset : « Tu n'as pas besoin d'être motivé tous les jours. Tu as besoin d'un système qui ne dépend pas de ta motivation. C'est exactement ce qu'un plan construit. »
- Validation : « Habitude faite aujourd'hui »
- Carte info (sans bouton) : « Ce que change un coach à ce stade : il choisit avec toi les 2 ou 3 habitudes qui comptent vraiment pour TON objectif, et il vérifie chaque semaine qu'elles tiennent. »
- Demain : « Jour 5 : ce que tes réponses disent de toi. »

### Jour 5 — Ce que tes réponses disent de toi
- Intro : « Tout ce que tu lis ici vient de tes réponses des jours 1 à 4. Pas de conseil générique : ton cas. »
- Bloc **Ton objectif** : « [objectif] · écart [x] kg. » + « Un rythme durable, c'est en général 0,25 à 0,5 kg par semaine en perte, et plus lent encore en prise de muscle. Plus vite, ça se paie : faim, fatigue, reprise. »
- Bloc **Tes calories** : « Dépense estimée [N] kcal · pour ton objectif, une cible autour de [N ± 10 %] kcal · protéines : environ [2,2 × poids] g par jour. » + la note du calculateur (« estimation solide, pas une vérité absolue : la balance tranche en deux semaines »).
- Bloc **Ton entraînement** : selon séances : 2 → « deux séances corps entier » ; 3 → « corps entier ou haut / bas » ; 4 et plus → « haut / bas, avec une progression de charge ». + « La séance du jour 3 était la même pour tout le monde. Ton programme, lui, doit partir de ton niveau, ton matériel et tes créneaux. »
- Bloc **Ton alimentation** : « Ton premier levier : [erreur du jour 2]. Ton plan se construit sur [n] repas par jour, avec des aliments que tu manges vraiment. »
- Bloc **Tes habitudes** : « [habitude] · sommeil [x] h » (+ phrase adaptée si < 7 h ou énergie faible).
- Conclusion : « Tu vois le principe : chaque recommandation dépend de tes réponses. Et il reste ce qu'un questionnaire ne voit pas : tes journées réelles, tes goûts, ce que tu as déjà essayé. C'est là qu'un plan devient vraiment le tien. »
- Lien discret : « Voir ce que comprend l'accompagnement » (volet)
- Validation : « J'ai lu mes recommandations » + « Ce qui te parle le plus : Calories · Entraînement · Alimentation · Habitudes »
- Demain : « Jour 6 : dans 90 jours. »

### Jour 6 — Dans 90 jours
- Intro : « Six jours. Regarde ce que ça t'a demandé : peu. Regarde ce que ça a changé : un point de départ mesuré, une erreur corrigée, une séance faite, une habitude posée, tes chiffres compris. Maintenant, projette-toi. »
- Trois colonnes : **Aujourd'hui** ([poids], [séances] / sem, [sommeil] h) · **Ton objectif** ([poids objectif] · « [pourquoi maintenant] ») · **Avec 90 jours d'accompagnement** :
  - Semaines 1-2 : plan alimentaire construit sur ta journée type, programme adapté à ton niveau et ton matériel, calories fixées.
  - Semaines 3-8 : ajustements chaque semaine à partir de ton bilan (poids, mensurations, photos, ressenti).
  - Semaines 9-12 : consolidation : tu sais faire, le plan évolue, les habitudes restent.
- Fourchette prudente (si tu la veux, voir section 5) : « À un rythme durable, 12 semaines représentent en général [a] à [b] kg — à titre indicatif. Ça dépend de ton point de départ, de ta régularité et de ta vie. Personne ne peut te garantir un chiffre, et méfie-toi de ceux qui le font. »
- Question : « Où en es-tu ? » → « Je veux avancer avec un accompagnement » · « J'hésite encore » · « Pas maintenant »
- Bouton secondaire : « Réserver mon appel » · « ou attends demain pour la dernière étape. »
- Validation : « Projection faite »

### Jour 7 — Tu viens de terminer ton 7-Day Challenge
- Titre : **Tu viens de terminer ton 7-Day Challenge.**
- « 7 jours. 7 actions. Sans plan, sans suivi, avec des recommandations générales. Si tu as obtenu ça en 7 jours, imagine 90 jours avec un plan construit pour toi et quelqu'un qui le suit avec toi chaque semaine. »
- Récap en tuiles : Jours validés 7 / 7 · Ton écart · Ta cible estimée · Ton habitude · Ta séance (ressenti)
- **Maintenant, construisons ton plan personnalisé.**
- Bouton principal : **RÉSERVER MON APPEL** (Calendly, nouvel onglet)
- Sous le bouton : « Un appel de 30 minutes avec Lucas. On regarde ton point de départ, ton objectif, et on voit si l'accompagnement est fait pour toi. Sans engagement. »
- Case : « J'ai réservé mon appel » (enregistrée)
- « Pas encore le moment ? Tes réponses restent ici. Tu peux réserver quand tu veux. » · lien Instagram

### Brouillon du texte de confidentialité (volet, à relire par toi ou un conseil ; je ne suis pas juriste)
« **Conditions d'utilisation et confidentialité — MHX Coaching.** Le 7-Day Challenge est un programme gratuit d'information et d'entraînement général. Il ne remplace pas un avis médical. **Données** : ton prénom, ton email, tes réponses au challenge (âge, taille, poids, objectif, habitudes) et ta progression. **Usage** : te faire suivre le challenge, te proposer un appel avec le coach. Aucune revente, aucune publicité. **Hébergement** : Supabase, serveurs en Europe (Irlande). **Tes droits** : tu peux exporter ou supprimer ton compte et toutes tes données à tout moment depuis Profil → Mes données, ou écrire à [email]. **Conservation** : tant que ton compte existe. En cochant la case, tu acceptes ces conditions. »

---

## 5. Décisions à prendre (ma recommandation en premier)

1. **Speed Formation pour les prospects** : (a) **la fermer** pendant le challenge (le funnel reste un parcours, pas une bibliothèque ; l'onglet garde son cadenas comme les autres) — recommandé ; (b) la laisser ouverte comme aujourd'hui.
2. **Déblocage des jours** : (a) **un jour calendaire par jour** (7 vraies journées, 7 retours) — recommandé, réglable dans `CONFIG` ; (b) enchaîner librement.
3. **Chiffres montrés au prospect** : (a) **dépense estimée + cible calorique + protéines** aux jours 1 et 5, avec la mise en garde du calculateur — recommandé (c'est la « valeur » qui rend l'expertise concrète ; le plan repas reste dans l'accompagnement) ; (b) dépense estimée seulement ; (c) aucun chiffre.
4. **Projection du jour 6** : (a) **fourchette prudente** (0,25 à 0,5 kg / semaine en perte ; plus lent en prise) avec la phrase « personne ne peut te garantir un chiffre » — recommandé ; (b) uniquement qualitatif, aucun kilo affiché.
5. **Côté coach (v47)** : (a) **oui** : pastille « Challenge J n/7 » dans Mes clients + bloc « 7-Day Challenge » dans la fiche (jour, dates, choix des jours 2 / 4 / 5, réponse du jour 6, clic Réserver, case « J'ai réservé ») — lecture seule, aucune écriture coach ; (b) non, rien côté coach.
6. **Conditions / confidentialité** : (a) **texte intégré** dans l'app (brouillon ci-dessus, à relire par toi), dans un volet ; (b) lien vers une page externe (Notion) que tu me donnes. Dans les deux cas la case est obligatoire et la date d'acceptation est enregistrée.
7. **Nom affiché** : « 7-Day Challenge » (recommandé, c'est ton mot sur Instagram) ou « Challenge 7 jours ».
8. **Question du jour 6 « Où en es-tu ? »** avec l'option « Pas maintenant » : (a) **la garder** (honnêteté, et tu vois qui hésite pour relancer en DM) ; (b) la retirer.
9. **Liste des questions du jour 1** (section 4) : à raccourcir ou compléter ?
10. **Les textes** : ton, formulations, ce que tu veux changer (tu pourras aussi les modifier directement dans `CHALLENGE7` après livraison, comme `CONFIG`).

---

## 6. Ouverture de l'inscription (aperçu ; la marche à suivre détaillée arrive avec la v47)

1. `inscription_libre: true` dans `CONFIG.marque` (je le ferai dans un commit dédié quand tu le décides, ou toi-même).
2. Supabase → Authentication → Sign In / Providers → Email : « Allow new users to sign up » **et** « Confirm email » activés.
3. **SMTP externe** (Authentication → SMTP Settings) : le service d'email intégré de Supabase est limité à quelques envois par heure et réservé aux tests ; sans SMTP (Brevo, Resend, Mailjet… offres gratuites suffisantes), les confirmations n'arriveront pas dès que plusieurs personnes s'inscrivent dans la même heure. À préparer avant le premier post Instagram.
4. URL configuration : Site URL et Redirect URLs contiennent `https://lcsmhx.github.io/mhx-plateforme/` (déjà le cas pour le mot de passe oublié ; à revérifier).
5. Modèle d'email « Confirm signup » en français (objet + texte), facultatif mais premium.
6. Test avec une adresse jetable : inscription → email → clic → arrivée directe sur le jour 1 (v47) → contrôle `select role, statut, count(*) from profils group by 1, 2`.
7. CAPTCHA : reste un chantier de code séparé (inscription + connexion + mot de passe oublié) ; **ne jamais l'activer seul** dans Supabase (il bloquerait la connexion des clients). À décider après les premières inscriptions selon le volume de comptes indésirables.
8. Lien Instagram : `https://lcsmhx.github.io/mhx-plateforme/#/inscription`.

---

## 7. Suivi des livraisons (étape B)

**Décisions de Lucas (25/09/2026)** : 1 Speed Formation fermée pendant le challenge, débloquée après le jour 7 · 2 un jour calendaire par jour, avec rattrapage d'un jour manqué · 3 dépense estimée, cible calorique et protéines montrées · 4 jour 6 : fourchette prudente en kilos, réaliste et non garantie · 5 pastille et bloc « Challenge » dans la fiche coach · 6 texte de confidentialité intégré · 7 « Challenge 7 jours » en français, « 7-Day Challenge » en anglais · 8 « Pas maintenant » gardé au jour 6 · 9 les textes seront validés en testant dans l'app avec un compte prospect de test, jours débloqués · marche à suivre finale avec le SMTP externe gratuit.

### v44 — Socle (livrée le 25/09/2026)
- Inscription simplifiée (prénom, email, mot de passe avec « Afficher », case des conditions obligatoire, volet du texte de confidentialité, note médicale) ; consentement daté dans les métadonnées du compte.
- Outil « Challenge 7 jours » : stepper, barre, jour 1 complet (questions du questionnaire → clé `intake`, point de départ calculé avec les formules du calculateur, validation → clé `challenge`), jours 2 à 7 « bientôt ».
- Déblocage : un jour par jour calendaire ; **rattrapage** = en retard, on enchaîne dans l'ordre jusqu'au jour attendu (jour 1 lundi, retour jeudi → jours 2, 3 et 4 accessibles ce jour-là, l'un après l'autre) ; un jour fait reste consultable ; horloge reculée ou date illisible → rien de plus que ce qui est fait.
- Hub du prospect, profil allégé, démarrage sur le jour 1, Speed Formation verrouillée jusqu'à la fin, bloc « Avec l'accompagnement MHX » à partir du jour 5 ou à la fin (clic Calendly noté dans `challenge.cta`).
- **Mode test (décision 9)** : `#/challenge-libre` sur l'appareil de test → tous les jours ouverts, pastille « Mode test » ; `#/challenge-rythme` pour revenir au rythme normal. Compte prospect de test : Comptes → créer un accès jetable → « Repasser prospect ».
- Aucune migration ; sauvegarde vérifiée avant (28/28 lignes) et empreintes identiques après ; banc complet vert (78 pages) ; relecture indépendante (15 réserves corrigées : bornes et garde-fou santé au jour 1, touche Entrée, anglais, jour jamais bloqué, formation) ; inscription toujours fermée. À arbitrer par Lucas : âge minimum (18 par défaut) et Calendly sur les pages verrouillées dès le jour 1.
- À venir : v46 (jours 5, 6, 7 + CTA), v47 (retour du lien de confirmation, écran « Vérifie ta boîte mail », bloc coach, marche à suivre : SMTP externe, confirmation d'email, URL, test, Instagram).

### v45 — Jours 2, 3, 4 (livrée le 25/09/2026)
- Jour 2 nutrition (5 erreurs, action liée au choix, ressenti), jour 3 entraînement (échauffement embarqué, circuit de 5 exercices au poids du corps, tours selon le niveau, démonstrations vidéo du catalogue chargées au clic, sécurité, tours + ressenti), jour 4 habitudes (5 habitudes, intention quand / où, mindset, carte coach sans bouton).
- Relecture de la clé `challenge` avant chaque écriture (jeton renouvelé, écriture en attente envoyée d'abord, jour déjà validé ailleurs jamais réécrit, relecture ratée = rien n'est écrit) ; jours faits en lecture seule ; textes FR/EN de même forme (contrôle statique). Relecture indépendante : 13 réserves corrigées (dont félicitations des jours 2 à 4, quand / où obligatoires, accessibilité, une vidéo à la fois).
- Aucune migration ; banc complet vert (verif45 54/54, verif44 81/81, 78 pages FR/EN/clair) ; relecture indépendante ; inscription toujours fermée.

