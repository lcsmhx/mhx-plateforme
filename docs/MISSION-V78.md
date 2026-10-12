# Mission de nuit v78 — sécurité + navigateur Instagram (12/10/2026)

Demande de Lucas du 12/10/2026, début 04:18 (heure de Bali), fin au plus tard vers 12:18 (8 h).
Autonomie complète (push et mise en ligne compris) pour les tâches 1 à 4 ; tâches 5 et 6 en **préparation seulement**
(appliquées avec Lucas le lendemain). Toutes les autres règles de `CLAUDE.md` restent valables, surtout zéro perte de données.
Ce fichier sert à reprendre si la session repart : relire « Avancement » d'abord.

## Départ
- `main` = `85973aa` (v77 en ligne, banc vert). Sauvegarde du dépôt : `~/MHX-prive/sauvegardes-depot/mhx-plateforme-2026-10-12-avant-v78.bundle` (vérifiée).
- Liste des prénoms et noms de clients à retirer : hors dépôt (`~/MHX-prive/`), jamais recopiée ici ni dans un commit.

## Règles de la nuit
- Une branche `v2/v78-<sujet>` par tâche, banc complet vert en local (TZ=UTC), fusion dans `main`, push, attente de
  « Tests puis publication » vert, puis site vérifié (la page s'ouvre, pied de page « · 78 ») avant la tâche suivante.
- Toujours rouge après 2 essais : `git revert` poussé sur `main`, noté ici, tâche suivante.
- Chaque nouveauté visible a un interrupteur dans `CONFIG`.
- Interdit : réglages Supabase / GitHub / Cloudflare (sauf le dépôt privé de la tâche 4 et son secret), `inscription_libre`,
  mots de passe et clés, toute écriture dans la vraie base, push forcé, réécriture de l'historique du vrai dépôt, prénom de
  client / email réel / secret dans le dépôt public, un commit, un log ou le rapport.
- Une commande qui attend une autorisation, ou un doute : STOP sur la tâche, état d'avant remis, noté ici, tâche suivante.

## Tâches
1. **Données personnelles hors du dépôt public** — le programme nominatif d'une cliente et `donnees/audit-coherence.md`
   déplacés dans `~/MHX-prive/archives/` ; prénoms de clients retirés du reste de l'arbre (`donnees/README.md`,
   `donnees/liens-youtube.md`) ; l'import du Catalogue n'utilise aucun fichier retiré ; garde-fou au banc (liste blanche
   des fichiers de `donnees/`, aucun email réel dans les fichiers suivis) ; règle dans `CLAUDE.md` ; anciens artefacts
   GitHub d'avant la v67 qui contiennent `donnees/` supprimés et listés.
2. **Prospects inscrits depuis le navigateur d'Instagram, TikTok ou Facebook** — détection (iPhone et Android) sans jamais
   bloquer l'inscription ; « Dernière étape : mets l'app sur ton téléphone » à la première arrivée sur l'accueil (après la
   page plan d'action) ; Android : bouton vers Chrome (`intent://`) ; l'adresse ouverte ensuite mène à `#/connexion` ;
   bandeau d'installation adapté ; FR + EN ; aucune écriture en base ; tests avec de vrais user agents.
3. **CAPTCHA Cloudflare Turnstile, en ligne mais éteint** — inscription et connexion, jeton envoyé à Supabase Auth ; clé de
   site vide = comportement actuel exact ; script chargé seulement si la clé est remplie et seulement sur ces écrans ;
   erreurs FR/EN, bouton jamais bloqué ; tests avec les clés de test officielles ; paragraphe dans
   `docs/CONFIDENTIALITE-BROUILLON.md`.
4. **Sauvegarde automatique de la base** — dépôt privé `lcsmhx/mhx-prive` (archives de la tâche 1), workflow chaque
   dimanche 12:00 UTC + manuel, méthode officielle Supabase via le Session pooler, chiffrée AES-256, 90 jours, sous 500 Mo,
   arrêt clair sans secrets ; phrase secrète en secret du dépôt et dans `~/MHX-prive/A-GARDER-phrase-secrete.txt` ;
   `RESTAURATION.md`.
5. **Limites d'écriture (lot 2 de la v66)** [préparation] — inventaire des clés à jour, limites de longueur prénom / nom,
   `supabase/v78-limites/` (migration non destructive, retour arrière, tests, vérifications) ; relevé en agrégats en lecture
   seule sur la vraie base.
6. **Nettoyage de l'historique** [répétition, aucun push] — seulement si 1 à 3 sont en ligne et qu'il reste au moins 1 h.

Fin de mission : `docs/V78-A-APPLIQUER-DEMAIN.md`, HISTORIQUE, HANDOFF, `CLAUDE.md` (exception retirée), push, rapport court.

## Avancement
- 04:18 — départ, `caffeinate`, lecture de CLAUDE.md / HISTORIQUE / HANDOFF, sauvegarde du dépôt vérifiée, v77 constatée en
  ligne (`85973aa`, pull request #1, banc vert).
- Artefacts GitHub du dépôt public relevés à 04:25 : 28, tous du 05/10 au 11/10 (après la v67) ; aucun d'avant la v67.
- Vers 05:30 — **tâche 1 en ligne** (`main` `2f908ff`, version 78 ; banc local 10/10 et GitHub verts ; site « v2026-10-12 · 78 »
  vu) : le programme nominatif d'une cliente et `donnees/audit-coherence.md` archivés hors dépôt (`~/MHX-prive/archives/`,
  puis chiffrés dans le dépôt privé) et retirés (404 sur raw.githubusercontent.com) ; prénom retiré de `donnees/README.md` et
  `donnees/liens-youtube.md` ; ancienne adresse de contact retirée de `docs/archive/BRIEFHANDOVERPLATEFORMEMHX.md` ;
  `tests-locaux/garde-depot.js` au banc (partie 10) ; règle « Dépôt public » dans `CLAUDE.md`. Artefacts GitHub d'avant la
  v67 : aucun, rien supprimé. Laissés : le prospect fictif « Paul » des tests ; un produit du catalogue qui porte un prénom
  (catalogue intact).
- Vers 05:55 — **tâche 4 faite** : dépôt privé `lcsmhx/mhx-prive` (README, RESTAURATION.md, workflows `sauvegarde.yml` —
  dimanche 12:00 UTC et à la main —, `restauration-essai.yml`, `essai-sans-secrets.yml`) ; secret `PHRASE_SAUVEGARDE` posé,
  phrase dans `~/MHX-prive/A-GARDER-phrase-secrete.txt` ; archive chiffrée `archives/donnees-retirees-2026-10-12.tar.enc`
  (relue identique) ; sans les secrets de la base, la sauvegarde s'arrête au 1er pas avec un message clair (vu sur GitHub) ;
  « Essai sans secrets » vert. Restent à Lucas : `SUPABASE_DB_URL` et `SUPABASE_SERVICE_ROLE_KEY`, la 1re sauvegarde à la
  main, une restauration d'essai dans un 2e projet.
- Vers 06:00 — **tâche 5 préparée, rien appliqué** : `supabase/v78-limites/` (LISEZMOI, 00 à 06),
  `supabase/releve-2026-09-30/INVENTAIRE-CLES.md`, `tests-locaux/garde-cles.js` au banc (partie 10). Relevé en agrégats sur
  la vraie base **pas lancé** (`execute_sql` refusé par `.claude/settings.local.json`) ; pas de Postgres sur le Mac :
  `04-tests.sql` écrit, pas exécuté.
- Vers 07:58 — **tâche 2 poussée** (`main` `9bd42ea`, version 78.1 ; banc local 10/10 et GitHub verts) : `Integre`
  (`js/installation.js`), réglage `CONFIG.marque.navigateur_integre` (true), textes `DECOUVERTE.integre` (FR et EN),
  `?ouvrir=connexion`, carte « Dernière étape : mets l'app sur ton téléphone », bouton `intent://` vers Chrome, bannière
  adaptée, `verif82` (56, partie 8). Publication en cours à la rédaction : en ligne si « Tests puis publication » est vert
  (à confirmer).
- **Tâche 3 en cours** : branche `v2/v78-turnstile` (`0727aed`, contient la tâche 2 ; banc GitHub vert ; banc local en
  cours), version 78.2 : `CONFIG.turnstile { cle_site: "", profil: false }` (vide = comportement d'avant exact), objet
  `Captcha` (`js/connexion.js`), `verif83` (54, partie 1), `docs/TURNSTILE.md`, paragraphe dans
  `docs/CONFIDENTIALITE-BROUILLON.md`, ligne dans `CLAUDE.md`.
- **Tâche 6 pas encore faite** (répétition prévue après la mise en ligne de la tâche 3).
- Fin de mission, branche `v2/v78-fin` (commits locaux) : `docs/V78-A-APPLIQUER-DEMAIN.md`, ligne v78 de `docs/HISTORIQUE.md`,
  HANDOFF, « État actuel » de `CLAUDE.md`, note pour Grok Bot dans `NOTESCLAUDE.md`.
