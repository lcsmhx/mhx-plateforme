---
name: context-budget
description: Audite ce qui remplit le contexte (agents, skills, commandes, MCP, CLAUDE.md, mémoire, notes injectées) et propose des économies classées. /context-budget [--verbose]. Lecture seule.
metadata:
  origin: ECC (https://github.com/affaan-m/ECC, v2.2.2, licence MIT — .claude/LICENCE-ECC.txt), adapté pour MHX
---

# Budget de contexte

Réponds en français, simplement. **Audit en lecture seule** : tu ne supprimes, ne désactives et ne modifies rien. Les recommandations vont à Lucas, qui décide ; toucher à la configuration globale (`~/.claude/`) ou aux connecteurs de l'app Claude reste sa décision. Les règles de `CLAUDE.md` priment ; « la qualité passe avant l'économie de crédits » : ne propose jamais de retirer une règle de sécurité ou de données pour gagner de la place.

## Quand l'utiliser

- Les réponses ralentissent ou perdent le fil ; le contexte se remplit vite.
- Après l'ajout d'agents, de skills, de commandes ou de connecteurs MCP.
- Avant d'en ajouter d'autres : reste-t-il de la place ?

Commence par la commande intégrée `/context` si elle est disponible : elle donne les vrais chiffres ; cet audit sert à expliquer et à proposer.

## Étape 1 — Inventaire

Estimer les jetons : mots × 1,3 pour du texte, caractères ÷ 4 pour du code.

- **Agents** : `.claude/agents/*.md` du projet (et `~/.claude/agents/`, en lecture). La `description` de chaque agent est chargée à chaque session : signaler une description de plus de 30 mots, un fichier de plus de 200 lignes.
- **Skills** : `.claude/skills/*/SKILL.md` (et `~/.claude/skills/`) : la description est toujours chargée, le corps seulement à l'usage ; signaler plus de 400 lignes.
- **Commandes** : `.claude/commands/*.md` (chargées à l'usage).
- **Fichiers CLAUDE.md** : celui du projet, ceux des dossiers parents, `~/.claude/CLAUDE.md` ; signaler plus de 300 lignes au total.
- **Mémoire automatique** de Claude (`MEMORY.md` du projet) et **notes injectées au démarrage** par le hook `SessionStart` (3 000 caractères au plus, ≈ 750 jetons).
- **Serveurs MCP et connecteurs** : nombre d'outils (environ 500 jetons par schéma d'outil chargé). Les outils « différés » (chargés à la demande) ne coûtent presque rien tant qu'ils ne sont pas chargés. Signaler un serveur de plus de 20 outils toujours chargés, ou qui double un outil en ligne de commande déjà disponible (`git`, `gh`).

## Étape 2 — Classer

| Catégorie | Critère | Action proposée |
|---|---|---|
| Toujours utile | Cité dans CLAUDE.md, derrière une commande utilisée, adapté au projet | Garder |
| Parfois utile | Spécifique à une tâche, non cité dans CLAUDE.md | Charger à la demande |
| Rarement utile | Jamais utilisé, doublon, sans lien avec le projet | Proposer de retirer |

## Étape 3 — Repérer

- Descriptions trop longues (chargées à chaque session).
- Doublons : skill qui répète un agent, règle répétée entre CLAUDE.md, HANDOFF et les agents.
- Trop de connecteurs MCP toujours chargés.
- CLAUDE.md trop bavard ou avec des sections dépassées (à signaler à Lucas, sans le modifier).

## Étape 4 — Rapport

```
Budget de contexte
═══════════════════════════════════════
Surcoût estimé : ~XX XXX jetons (fenêtre de XXX XXX)
┌─────────────────┬────────┬───────────┐
│ Élément         │ Nombre │ Jetons    │
├─────────────────┼────────┼───────────┤
│ Agents          │ N      │ ~X XXX    │
│ Skills          │ N      │ ~X XXX    │
│ Commandes       │ N      │ ~X XXX    │
│ Outils MCP      │ N      │ ~XX XXX   │
│ CLAUDE.md       │ N      │ ~X XXX    │
│ Mémoire + notes │ N      │ ~X XXX    │
└─────────────────┴────────┴───────────┘
Points relevés (N), du plus gros gain au plus petit :
1. [action] → ~X XXX jetons
Gain possible : ~XX XXX jetons
```

Avec `--verbose` : détail par fichier, lignes en double côte à côte, liste des outils MCP avec leur taille estimée.
