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
