---
description: Enregistre le résumé de la séance (phase en cours, fichiers modifiés, reste à faire, décisions) dans .claude/session-notes/derniere-session.md pour reprendre à la session suivante.
---

<!-- Adapté de la commande save-session d'ECC (https://github.com/affaan-m/ECC, v2.2.2), licence MIT : .claude/LICENCE-ECC.txt.
     Différence voulue : un seul fichier dans le projet (ignoré par git) au lieu de ~/.claude/session-data/. -->

# /save-session — enregistrer la séance

Réponds en français. Écris un résumé honnête de la séance pour que la prochaine session reprenne exactement là où celle-ci s'arrête. Il est injecté automatiquement au démarrage de la session suivante (3 000 caractères au plus, avec le résumé automatique des hooks) : **vise 2 000 caractères au plus**, des lignes courtes.

## Quand

- En fin de séance, avant de fermer Claude Code.
- Avant un `/compact`, ou quand le contexte approche de sa limite.
- Après une étape importante (chantier poussé, problème difficile résolu).

## Étape 1 — Rassembler

- `git status --short`, `git log --oneline -5`, `git diff --stat` : l'état réel, pas le souvenir.
- Ce qui a été demandé, essayé, décidé (et par qui) dans la conversation.
- Les tests : le résultat réellement obtenu (suite, nombre de ✓, passage GitHub), jamais supposé.

## Étape 2 — Écrire le fichier

Fichier : `.claude/session-notes/derniere-session.md` (dossier local, ignoré par git).

- S'il existe : **lis-le d'abord**, puis remplace **uniquement** ce qui se trouve entre `<!-- RESUME-MANUEL:DEBUT -->` et `<!-- RESUME-MANUEL:FIN -->`. Ne touche jamais au bloc `RESUME-AUTO` : il est tenu par les hooks.
- Écris avec l'outil Edit ou Write (pas avec Bash) : c'est ce qui permet au bloc automatique d'afficher « Résumé manuel : mis à jour dans cette session ».
- S'il n'existe pas : crée-le avec seulement le bloc manuel ci-dessous ; les hooks ajouteront le bloc automatique à la fin de ta réponse.

```markdown
<!-- RESUME-MANUEL:DEBUT -->
## Résumé de séance — AAAA-MM-JJ HH:MM (/save-session)
**Phase en cours :** chantier, étape, branche.
**Fait et vérifié :**
- quoi — preuve : test vert (suite, n/n), commit abc1234, passage GitHub vert, capture…
**Ce qui n'a pas marché (ne pas retenter) :**
- piste — pourquoi, message d'erreur exact.
**Fichiers modifiés :**
- `chemin` — fini / en cours / cassé ; commité ou non.
**Reste à faire :**
1. Prochaine étape exacte : …
2. …
**Décisions :**
- décision — raison — décidé par Lucas / choix technique.
**Questions ouvertes / blocages :** … (ou « aucun »)
<!-- RESUME-MANUEL:FIN -->
```

Règles :
- Remplis chaque rubrique ; écris « rien » quand elle est vide. Une rubrique vide honnête vaut mieux qu'un trou.
- « Ce qui n'a pas marché » est la rubrique la plus utile : sans elle, la session suivante retente les mêmes impasses.
- N'écris « vérifié » que pour ce que tu as vérifié toi-même (règle de CLAUDE.md).
- Aucun secret, mot de passe ni jeton ; aucune donnée personnelle d'un vrai client (compte de test : son identifiant Supabase seulement).
- Un seul fichier, réécrit à chaque fois ; ses notes sont copiées automatiquement dans `precedente-session.md` quand une autre session démarre. Les hooks ne touchent jamais au résumé manuel : il reste en place jusqu'au prochain `/save-session`, même s'il date d'une autre session. La ligne « Résumé manuel » du bloc automatique dit s'il a été mis à jour dans la session en cours : relance `/save-session` à chaque fin de séance.

## Étape 3 — Montrer

Donne à Lucas le chemin du fichier et le résumé en 3 à 5 lignes simples, puis demande s'il veut corriger ou ajouter quelque chose. Corrige si besoin ; ne bloque pas la fin de séance.
