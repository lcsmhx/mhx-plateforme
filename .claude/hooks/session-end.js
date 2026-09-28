#!/usr/bin/env node
'use strict';
/* Hooks Stop (fin de chaque réponse de Claude) et SessionEnd (fin de session) : met à jour le résumé automatique de
   .claude/session-notes/derniere-session.md (demandes, fichiers modifiés, git status, outils), sans toucher au résumé
   manuel écrit par /save-session. v55 : une ligne du résumé automatique dit si le résumé manuel a été modifié dans cette
   session. Rien n'est écrit si la conversation ne contient encore aucune demande.
   Adapté d'ECC scripts/hooks/session-end.js ; licence MIT : .claude/LICENCE-ECC.txt. Voir utils.js. */

const u = require('./utils');

u.lireEntree().then(entree => {
  try {
    const evenement = entree.hook_event_name === 'SessionEnd'
      ? 'fin de session' + (entree.reason ? ' (' + entree.reason + ')' : '')
      : 'fin de réponse';
    u.ecrireResumeAuto(entree, evenement);
  } catch (e) {
    process.stderr.write('[notes de session] ' + e.message + '\n');
  }
}).catch(() => {});
