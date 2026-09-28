#!/usr/bin/env node
'use strict';
/* Hook PreCompact (juste avant une compaction du contexte, manuelle ou automatique) : met à jour le résumé automatique de
   .claude/session-notes/derniere-session.md ; le hook SessionStart le réinjecte juste après la compaction.
   Adapté d'ECC scripts/hooks/pre-compact.js ; licence MIT : .claude/LICENCE-ECC.txt. Voir utils.js. */

const u = require('./utils');

u.lireEntree().then(entree => {
  try {
    const declencheur = { manual: 'manuelle', auto: 'automatique' }[entree.trigger] || entree.trigger || '?';
    u.ecrireResumeAuto(entree, 'avant compaction (' + declencheur + ')');
  } catch (e) {
    process.stderr.write('[notes de session] ' + e.message + '\n');
  }
}).catch(() => {});
