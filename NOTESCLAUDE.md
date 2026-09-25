# NOTES — canal de communication Claude ↔ Grok Bot

Ce dépôt est le terrain commun. Lucas ne relaie plus les fichiers à la main.

## Comment on se parle
- **Grok Bot** travaille dans Cursor sur ce dépôt, commit et push sur `main`.
- **Claude** lit le dépôt (clone public). Il **ne peut pas pousser** : son environnement bloque les accès GitHub authentifiés. Il rend ses retours à Lucas, qui les commit.
- Les messages passent par des fichiers, pas par les Issues (Claude ne peut pas les lire) :
  - `NOTES-GROK.md` → ce que Grok Bot a fait, ce qu'il a changé, ses questions. **À créer et tenir à jour par Grok Bot.**
  - `NOTES-CLAUDE.md` → ce fichier : retours de relecture de Claude.
- **Messages courts et datés.** Une ligne par point. On ne raconte pas, on liste.

## Règles de travail sur ce dépôt
1. **Un seul fichier applicatif : `index.html`.** Pas de découpage en plusieurs fichiers, pas de build, pas de `npm install`. Lucas doit pouvoir l'ouvrir et le modifier lui-même.
2. **Commits petits et décrits en français.** Un commit = un changement compréhensible. Pas de commit fourre-tout de 400 lignes.
3. **Ne jamais commiter de secret.** La clé Supabase présente dans le fichier est la clé *publishable*, publique par nature. La clé `service_role` ne doit jamais entrer dans ce dépôt, sous aucune forme.
4. **Ne pas toucher aux formules de calcul** (BMR, facteur d'activité, macros) sans accord écrit de Lucas dans ce fichier.
5. Le détail complet — architecture, schéma Supabase, pièges — est dans `BRIEFHANDOVERPLATEFORMEMHX.md`. **Le lire en entier avant de coder.**

## État au moment de l'ouverture du dépôt
- `index.html` poussé ici est **identique** à la version en ligne sur https://lcsmhxcoaching.netlify.app — empreinte vérifiée.
- Réglages Supabase faits par Lucas : `Confirm email` désactivé, Site URL et Redirect URLs correctes.
- Chantier principal restant : **suivi transversal de l'évolution** (voir §5 du brief). Rien d'autre n'est engagé.

## Retours de Claude
_(rien pour l'instant — première relecture après le premier push de Grok Bot)_

## 2026-09-25 — Refonte premium en 20 phases : Phase 2 livrée (index.html v33)
Contexte : Lucas a validé un plan de refonte « plateforme de coaching premium » en 20 phases (audit fait, design system, navigation, accueil, programme, nutrition, progression, suivi, bilan hebdo, feedback coach, objectifs, régularité, photos, formation, FREE/CLIENT, locked states + Calendly, back-office, fiche client, alertes, tests). Claude code les phases dans `index.html`, une par version, après validation de Lucas à chaque fois.

Règles absolues posées par Lucas (à respecter aussi côté Grok Bot) :
- ZÉRO PERTE DE DONNÉES : 7 clients + 1 coach réels dans Supabase. Aucune donnée existante supprimée, réinitialisée, écrasée ou rendue inaccessible.
- Avant toute migration BDD : backup vérifiable + comptage avant/après ; migrations non destructives uniquement (ADD COLUMN, CREATE POLICY, backfill explicite) ; jamais DROP / DELETE / TRUNCATE ; ancien format toujours lu.
- Phases sensibles (10 feedback coach, 13 photos, 15 FREE/CLIENT, 18 fiche client + notes coach) : brief de migration → validation Lucas → backup → migration → tests → vérification.
- Rien n'est poussé sur GitHub ni écrit en base sans le « oui » de Lucas. Réutiliser l'existant (Regularite, Journal, Historique, questionnaire, générateur, éditeur…), ne pas recréer.

Phase 2 (v33, ce commit) — visuel uniquement, aucune requête Supabase modifiée, aucune migration :
- Section [A] : sombre par défaut, clair en option (bouton ☀/☾, clé locale `mhx_theme`), palette premium, doré en accent seulement.
- Sections [B][C] : composants unifiés — stat card (`.tile` = `.tuile`), barre (`.bar` = `.jauge` = `.fo-jauge`), badges `.pastille.ok/.attention/.mauvais/.accent`, boutons `.btn/.ghost/.danger/.petit`, `.avatar`, `.timeline`, `.objectif`, `.switch`, `.verrou` (locked state), `.modale`, `.volet`, `.toast`. Anciens noms de classes conservés.
- Section [E] : objets `Theme` et `UI` (`UI.confirmer`, `UI.demander`, `UI.alerte`, `UI.toast`, `UI.volet`, `UI.verrou`). Les 29 `alert/confirm/prompt` natifs sont remplacés : **ne plus utiliser les dialogues natifs dans index.html**, passer par `await UI.confirmer(...)` etc.
- 19 entrées `I18N.en` ajoutées ; toute nouvelle chaîne visible doit avoir la sienne.
- Tests : 50 pages rendues (client, coach, fiche client) mobile/desktop, sombre/clair sur copie locale avec Supabase simulé, 0 erreur console ; 19 tests de flux (fenêtres, thème, anglais) OK.

Pour Grok Bot : rien à faire sur `index.html` (règle inchangée : Grok travaille dans `donnees/`). Si tu testes la v33 en ligne, note tes retours QA ici-même ou dans `NOTES-GROK.md` (thème, lisibilité, boutons au doigt, fenêtres). Prochaine étape : Phase 3 (navigation) après validation de Lucas.

## 2026-09-25 — Phases 3 et 4 livrées (index.html v34)
- Phase 3, navigation : ordre client Accueil · Mon programme · Nutrition · Ma progression · Mon bilan · Speed Formation · Mes compléments · Profil (ids/adresses inchangés ; alias `#/progression`, `#/suivi`, `#/repas`). Icônes SVG (`ICONES`) à la place des emojis. Sur téléphone : barre d'onglets en bas (4 onglets + « Plus » qui ouvre un volet). Le coach arrive sur « Mes clients » ; l'Accueil du client lui est visible en consultant une fiche (« Vue d'ensemble »). Le bloc « Mes données » (export / restauration / suppression) n'apparaît plus qu'au bas du Profil. Bannière PWA déplacée sous le contenu.
- Phase 4, accueil : nouvel outil `outilAccueil` (lecture seule) — « Bonjour Prénom » + résumé de la semaine, tuiles Régularité / Poids / Entraînement / Nutrition / Objectifs, « Aujourd'hui » (prochaine séance à noter, repas du jour, mesure de la semaine), objectifs du mois avec statut, lien vers le bilan. Réutilise `Regularite.calculer`, le journal, `repas_suivi.hist`, `mens`, `P.objectifs` + `objectifs_faits` : aucune nouvelle clé, aucune écriture.
- `Store.lireTout(cles)` : plusieurs clés en une requête (`outil=in.(...)`, lecture seule). Seule requête ajoutée.
- Tests : 58 pages rendues + 19 tests de flux + 13 vérifications de navigation (copie locale, Supabase simulé), 0 erreur.

## 2026-09-25 — Phases 5 à 8 livrées (index.html v35)
- Phase 5, programme : carte de tête « Cycle 01 · Semaine 2 sur 4 » (calculée depuis `P.debut`, posé à l'envoi ; le coach règle `P.cycle` et `P.duree_semaines` dans « Réglages du programme », défauts 1 et 4), compteur de séances notées cette semaine, cartes de séance avec badge « notée le … » / « à faire ». Éditeur coach intact. Le panneau « Ta semaine » a quitté le programme : il vit dans « Mon suivi » et l'Accueil.
- Phase 6, nutrition : bouton « Respecté / Non respecté » par repas (même clé `repas_suivi.mange`, même `Regularite.noterRepas`), compteur « x / y repas respectés » du jour, badge « aujourd'hui », préparation repliée côté client. Générateur et vue coach intacts.
- Phase 7, progression : page réorganisée — Poids (actuel, départ, variation, semaines, courbe) → Nouvelle mesure (repliée derrière « Ajouter ma mesure ») → Mensurations (cm perdus, courbes 4 max) → Composition corporelle → tableau → réglages (point de départ, zones). Tous les ids conservés, aucune logique modifiée.
- Phase 8, Mon suivi : nouvel outil `outilSuivi` = `Regularite.monterClient` (enrichi : évolution sur 5 semaines, objectifs en cartes à cocher — même clé `objectifs_faits`) + bilan des 28 jours (`outilBilan.calculer/vue`). « Mon bilan » sort de la barre (`masque_nav`) mais reste à `#/bilan` pour « Préparer le call ».
- Aucune nouvelle clé de données, aucune requête nouvelle, aucune migration. Tests : 62 pages, 19 flux, 27 vérifications ciblées — 0 erreur.

## 2026-09-25 — Phases 9, 11, 12, 14 livrées (index.html v36)
- Phase 9, bilan hebdomadaire : questions dans `CONFIG.bilan.questions` (modifiables sans toucher au code), objet `Checkin`, nouvelle clé **client** `checkins` = `{ liste: [{ semaine (lundi), fin, envoye_le, reponses{} }] }` (60 max). Disponible du vendredi (`CONFIG.bilan.jour_ouverture`) au dimanche suivant, jamais bloquant. Formulaire et historique dans « Mon suivi », statut + CTA sur l'Accueil, lecture coach dans « Préparer le call » (« Ses bilans hebdomadaires ») et « Son suivi ». Le feedback du coach (phase 10) s'accrochera à `semaine`.
- Phase 11, objectifs : le coach pose un statut par objectif dans « Son programme » (`P.objectifs.statuts[i]` = "" | atteint | non_atteint — champ **ajouté**, `liste[]` et `objectifs_faits` inchangés et toujours lus). Règle `Regularite.statutObjectif` : le statut du coach l'emporte quand il tranche, sinon la case du client. Badges En cours / Atteint / Non atteint partout (Mon suivi, Accueil, bilan, points à aborder).
- Phase 12, régularité : points et seuils dans `CONFIG.regularite` (`poids`, `seuils`) ; `Regularite.poids` / `niveau` les lisent. Formule inchangée par défaut (50 / 30 / 20 ; 70 / 40).
- Phase 14, formation : en-tête « Bibliothèque · 7 modules » avec tuile de progression, modules en cartes numérotées 00–06 avec objectif et barre par module ; contenu, vidéos, leçons, widgets et cases inchangés (`FORMATION`, `LECONS`, clé `formation`).
- Aucune migration : `checkins` est une clé client ordinaire (RLS propriétaire déjà en place). Tests : 62 pages, 19 flux, 40 vérifications ciblées — 0 erreur.

## 2026-09-25 — Phases 17, 19 et 18 (partie sans base) livrées (index.html v37)
- Module `Clients` : chargement partagé (profils + `donnees` sans historiques — les deux requêtes qu'utilisait déjà « Mes clients »), `resumer()` (le résumé par client et le tri par urgence, sortis de `outilClients.tableau` sans changement de logique) et `alertes()`.
- Phase 19, alertes (`Clients.alertes`) : calculateur ≠ questionnaire · jamais rien saisi / inactif ≥ 10 j · questionnaire / programme / diète manquants · régularité < seuil · bilan hebdo reçu (7 derniers jours, à lire) · bilan hebdo non complété (semaine visée passée) · objectif du mois « non atteint » · poids stable ≥ 21 j (objectif perte/prise). Chaque alerte pointe vers l'onglet de la fiche à ouvrir. Un point vert/orange/rouge par ligne dans « Mes clients ».
- Phase 17, `outilTableau` (page d'arrivée du coach) : Clients actifs · Prospects (`profils.statut = prospect`, 0 tant que la phase 15 n'est pas faite) · Bilans à traiter · Bilans non complétés · À surveiller ; « Qui nécessite ton attention aujourd'hui ? » (cartes par client, alertes cliquables) ; raccourcis. Barre du bas coach : Tableau de bord · Mes clients · Mes séances · Bibliothèque + Plus. « Mes clients » (tableau + comptes + création) inchangé, mais le tableau passe en cartes sur téléphone.
- Phase 18 (sans base) : « Fiche » = `outilAccueil.fiche()` en consultation — alertes, En bref (régularité, poids, séances, repas respectés 28 j, activité, bilan hebdo), Profil, Objectifs (statuts), Programme (cycle), Nutrition, Poids et mensurations, Bilan hebdomadaire (dernier reçu), Le reste (compléments, formation, historiques), lien vers chaque éditeur. « Ouvrir » un client mène à sa fiche. Notes privées, feedbacks et calls : phases 10 et 18 (base), à venir.
- `Store.lireTout(cles, { dates: true })` renvoie aussi `maj_le`. Aucune écriture nouvelle, aucune migration. Tests : 64 pages, 19 flux, 55 vérifications — 0 erreur.

## 2026-09-25 — Passation : Claude Code prend le relais sur `index.html`
- **Pour Grok Bot.** À partir de maintenant, la refonte de `index.html` (phases restantes 10, 13, 15, 16, 18-base, 20) est menée par **Claude Code**, connecté directement à ce dépôt. Le partage des rôles ne change pas : **toi, uniquement `donnees/`** (aliments, recettes, programmes, exercices, liens vidéo) ; **`index.html`, jamais**. Lucas garde le dernier mot sur tout ce qui part en production (GitHub et Supabase).
- La coordination continue **ici, par le dépôt** : Claude Code écrit ses notes de version dans ce fichier (`NOTESCLAUDE.md`), tu réponds dans `NOTES-GROK.md` comme avant. Rien ne change dans la table `briefs`.
- Tout ce que Claude Code doit savoir (état réel en ligne = **v37, commit `8dcbe7d`**, plan des 20 phases, règles « zéro perte de données », DA, architecture, Supabase, points ouverts) est dans **`HANDOFF-CLAUDE-CODE.md`** à la racine. Tu peux le lire pour connaître l'état de l'app ; il n'y a rien à faire dedans pour toi.
- Nouveau dossier **`tests-locaux/`** : banc de test Playwright de `index.html` avec Supabase simulé et données fictives (aucune clé, aucune donnée client). Il ne te concerne pas, ne pas le modifier.
- **Demande pour toi (données) :** 14 fiches de `donnees/aliments.json` portent encore `vegetarien` + `vegan` à tort — `graisse-de-dinde`, `huile-de-foie-de-morue`, les 3 `bouillon-de-viande-et-legumes-type-pot-au-feu-*`, `saucisse-de-volaille-type-knack-contenant-du-soja-preemballee`, `biscuit-ou-cracker-aperitif-souffle-gout-bacon`, `pizza-au-chorizo-ou-salami-preemballee`, `pizza-kebab-preemballee`, `sandwich-baguette-merguez-ketchup-moutarde`, `sandwich-grec-ou-kebab-baguette-crudites`, `sandwich-grec-ou-kebab-pita-crudites`, `sandwich-pain-de-mie-complet-bacon-crudites-preemballe`, `sauce-kebab-preemballee`. Le `Normaliser` de l'app les corrige à l'import (vérifié sur la v37), mais la source JSON doit être juste : retirer `vegan` et `vegetarien` sur les 14, garder `pescetarien` seulement pour l'huile de foie de morue. Un commit `donnees/` séparé, rien d'autre dedans.

## 2026-09-25 — Correctif de sécurité 37.1 (index.html) — Claude Code
- 14 endroits où une valeur écrite par un client (ses propres données, qu'il peut modifier par l'API) s'affichait sans échappement, dont 13 dans les écrans du coach (fiche, « Préparer le call », « Son suivi », « Ses courbes », « Ses repas », « Ses séances », « Son programme ») : valeurs échappées (`esc`, `fmt`, `Array.isArray`) ; `dateFr` n'insère plus jamais une valeur brute dans du HTML.
- Nouveau test d'attaque `tests-locaux/verif-xss.js` (données client piégées, écrans coach et client) : 15 exécutions de script détectées sur la v37, aucune sur la 37.1. Banc complet sans erreur (64 pages, 19 + 13 + 14 + 13 + 15 vérifications).
- Aucune donnée ni règle de la base modifiée. Pour Grok Bot : rien à faire.

## 2026-09-25 — Phases 10 et 18 (partie base) livrées (index.html v38) — Claude Code
- **Migration Supabase appliquée** (6 `ALTER POLICY` sur `donnees`, aucune ligne touchée, aucun DROP/DELETE) : le coach peut écrire `feedbacks` et `notes_coach` dans la fiche d'un client ; le client **lit** `feedbacks` mais ne peut ni l'écrire ni la modifier ni l'effacer ; `notes_coach` est **illisible** par le client (même par l'API). Backup vérifié ligne à ligne avant (hors dépôt), comptages et empreintes identiques avant/après sur toutes les tables, 33 tests RLS (client, coach, anonyme, accès croisé, transformation d'une ligne en `feedbacks`, changement de `user_id`) conformes, avant (répétition annulée) et après.
- **Nouvelles clés (chez le client, écrites par le coach seul)** : `feedbacks` = `{ liste: [{ semaine (lundi ISO), fin, date, texte, bilan? }] }`, une entrée par semaine de bilan (`bilan` = instant d'envoi du bilan auquel le feedback répond : `envoye_a`, sinon `envoye_le` pour les bilans plus anciens) ; `notes_coach` = `{ texte, maj, avant? }` (`avant` = la version trouvée à l'ouverture de la fiche, pour rattraper un effacement par erreur). Elles ne passent pas par `Store.ecrire` (objet `CleCoach` : écriture **conditionnelle** — la ligne n'est écrite que si elle n'a pas bougé depuis la lecture (`maj_le`), sinon rien n'est écrit ; « enregistré » seulement si la base renvoie la ligne ; envois de feedbacks l'un après l'autre) ; `Store.ecrire`, `Store.envoyer` et la restauration de sauvegarde les refusent (`Store.clesCoachSeul`).
- Phase 10 : éditeur de feedback sous chaque bilan hebdo reçu dans « Préparer le call » (+ un éditeur pour la semaine visée tant qu'elle n'a pas de bilan ; texte vidé = feedback retiré après confirmation ; éditeurs fermés si les feedbacks n'ont pas pu être lus) ; côté client, « Feedback de ton coach » dans Mon suivi (en tête s'il a moins de 7 jours) et carte « Ton feedback est disponible » sur l'Accueil ; l'alerte « Bilan hebdo reçu — à lire » s'éteint seulement quand un feedback a été écrit **sous ce bilan** (comparé à l'instant d'envoi `envoye_a`, nouveau champ des bilans ; un mot écrit avant son arrivée, ou avant qu'il soit renvoyé, ne compte pas : « feedback à relire ») ; entrées `I18N.en` ajoutées.
- Phase 18 : « Notes privées » dans la fiche client, enregistrées toutes seules (1 s après la dernière frappe, et tout de suite en quittant la fiche) ; si la lecture échoue, le champ reste fermé ; écriture conditionnelle : si les notes ont été modifiées ailleurs (autre onglet ou appareil), rien n'est écrasé et les deux versions sont gardées (celle du coach à la suite, datée) ; une écriture dont la réponse s'est perdue est reconnue et reprise ; la version trouvée à l'ouverture est gardée (`avant`). « accueil » ajouté à `MODIFIABLES`. Les écritures du coach (`feedbacks`, `notes_coach`) ne comptent plus comme activité du client. « Calls » : laissé de côté (décision de Lucas).
- Tests : banc local complet — 64 pages sans erreur ni écriture, 19 flux, 13 + 14 + 13 + 15 vérifications v34–v37, **66 vérifications v38** (`tests-locaux/verif38.js`, Supabase simulé avec les règles d'accès réelles et les écritures conditionnelles : conflits entre onglets, réponse perdue, bilan renvoyé, session perdue, refus silencieux, refus 403, lecture en panne, restauration, anglais, mobile) et le test d'attaque `verif-xss.js` (5/5). Le banc tourne aussi avec le Chrome du système (`tests-locaux/chrome-systeme.js`).
- **Pour Grok Bot** : rien à faire côté `donnees/`. Ne jamais écrire les clés `feedbacks` ni `notes_coach`. La demande du 25/09 sur les 14 fiches d'`aliments.json` reste valable. Prochaine phase : 15 (FREE / CLIENT, colonne `profils.statut`).

## 2026-09-25 — Phase 15 (FREE / CLIENT) livrée (index.html v39) — Claude Code
- **Migration Supabase appliquée** (table `profils`, aucune ligne supprimée) : colonne `statut` ajoutée sans défaut, les 9 comptes existants passés à `'client'`, puis `NOT NULL` et défaut `'prospect'` pour les comptes créés ensuite, contrainte `statut in ('prospect','client')`, trigger `protege_role` étendu : `role` et `statut` ne changent que par un coach (ou la clé de service des fonctions serveur) ; un compte ne peut pas se passer « client » lui-même. Backup vérifié (structure relevée juste avant), comptages identiques avant/après, 19 tests SQL (répétition annulée puis état réel).
- Au passage : la création d'un accès « complet » par la fonction `creer-acces` échouait en silence (le trigger refusait la clé de service) — corrigé par le même trigger.
- App : `Auth.estProspect()`, pastille « prospect » dans Mes clients, statut + bouton « Passer client / Repasser prospect » dans Comptes, statut « client » posé tout de suite après la création d'un accès (fenêtre d'alerte si ça échoue), pas d'alerte de suivi pour un prospect, KPI « Prospects ». Inscription libre codée (`Auth.inscrire`, écran « Créer mon compte ») mais **fermée** : `CONFIG.marque.inscription_libre = false` ; Lucas l'ouvrira lui-même à la fin (ce réglage + « Allow new users to sign up » dans Supabase). Bug corrigé : « Supprimer » sur un compte d'équipe déclenchait aussi « Ouvrir sa fiche ».
- v38 renforcée : un feedback retient toutes ses tentatives sans réponse (plus de faux conflit après deux échecs de suite).
- Tests : 64 pages sans erreur ; 19 + 13 + 14 + 13 + 15 + 67 vérifications, verif-xss 5/5, **verif39 34/34**. Les simulations routent désormais par nom d'hôte (une requête d'inscription de test était partie vers la vraie base : refusée par Supabase, aucune donnée créée).
- **Pour Grok Bot** : rien à faire côté `donnees/`. Prochaine phase : 16 (écrans verrouillés pour les prospects + Calendly).

