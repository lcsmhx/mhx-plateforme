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
