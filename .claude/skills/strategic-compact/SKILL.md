---
name: strategic-compact
description: Choisir le bon moment pour /compact (frontières de phases plutôt que compaction automatique) et sauvegarder l'état avant. Quand une longue session approche de la limite de contexte ou change de phase.
metadata:
  origin: ECC (https://github.com/affaan-m/ECC, v2.2.2, licence MIT — .claude/LICENCE-ECC.txt), adapté pour MHX
---

# Compacter au bon moment

Réponds en français. Les règles de `CLAUDE.md` priment.

La compaction automatique se déclenche n'importe quand, souvent en plein milieu d'une tâche. Mieux vaut proposer `/compact` à une frontière logique : après l'exploration et avant l'exécution, après une étape terminée, avant de changer de sujet.

## Quand y penser

- Longue session proche de la limite de contexte, ou réponses qui ralentissent ou perdent le fil.
- Tâche en plusieurs phases (lecture → plan → code → tests) : entre deux phases.
- Changement de sujet sans lien avec le précédent.

## Dans ce projet

- Aucun hook de suggestion n'est installé (sélection minimale) : c'est Claude qui propose `/compact` à Lucas au bon moment ; Lucas décide.
- Les hooks du projet sauvegardent automatiquement un résumé **avant** chaque compaction (`PreCompact`) et le réinjectent **juste après** (`SessionStart`), 3 000 caractères au plus : `.claude/session-notes/derniere-session.md`.
- Ce résumé automatique est mécanique (demandes, fichiers, git status). **Avant de compacter, lance `/save-session`** pour écrire ce qui compte vraiment : phase, décisions, reste à faire, ce qui n'a pas marché.
- Après la compaction : relire `CLAUDE.md`, puis `docs/PLAN-V2.md` (section « Reprise ») si un chantier du plan est en cours.

## Faut-il compacter ?

| Passage | Compacter ? | Pourquoi |
|---|---|---|
| Exploration → plan | Oui | La lecture est volumineuse ; le plan en est le résumé |
| Plan → code | Oui, si le plan est écrit dans un fichier | Libère de la place pour le code |
| Code → tests | Peut-être | Garder si les tests portent sur le code tout juste écrit |
| Débogage → sujet suivant | Oui | Les traces de débogage encombrent |
| En plein milieu d'une modification | Non | Noms, chemins et état partiel perdus |
| Après une piste abandonnée | Oui | Repartir propre, en notant pourquoi elle a échoué |

## Ce qui survit à la compaction

| Reste | Se perd |
|---|---|
| `CLAUDE.md` | Le raisonnement intermédiaire |
| Les fichiers sur le disque | Le contenu des fichiers déjà lus |
| Le résumé réinjecté (`derniere-session.md`) | Le détail de la conversation |
| La mémoire automatique de Claude | Les nuances dites seulement à l'oral |
| L'état de git (commits, branches) | L'historique des appels d'outils |

Ne compte pas sur une liste de tâches pour survivre : selon la version de Claude Code et le modèle, elle peut ne pas exister. **Écris l'état dans un fichier avant de compacter** (`/save-session`, ou `docs/PLAN-V2.md` pour le plan validé).

## Bonnes pratiques

1. Compacter après un plan **écrit dans un fichier**.
2. Compacter après un débogage terminé.
3. Ne pas compacter au milieu d'une modification.
4. Écrire avant de compacter : `/save-session`.
5. Donner une consigne à la compaction : `/compact garder : chantier v55, fichiers js/outilSuivi.js et tests-locaux/verif61.js, prochaine étape : tests`.
6. Pour savoir ce qui remplit le contexte : `/context`, ou `/context-budget` pour un audit détaillé.
