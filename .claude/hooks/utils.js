'use strict';
/* Outils communs aux hooks de notes de session de la plateforme MHX.
   Version simplifiée et autonome des hooks « memory persistence » d'ECC (https://github.com/affaan-m/ECC, v2.2.2 :
   scripts/hooks/session-start.js, session-end.js, pre-compact.js et scripts/lib/utils.js ; licence MIT, voir
   .claude/LICENCE-ECC.txt). Même principe : demandes, outils et fichiers modifiés tirés du journal de la conversation,
   dans un bloc délimité qui préserve le reste du fichier. Différences voulues : Node seul, aucune dépendance, aucun appel
   réseau ni résumé par IA (ECC lance `claude -p`), rien écrit hors du projet (ECC écrit dans ~/.claude/) : un seul
   fichier, .claude/session-notes/derniere-session.md, ignoré par git.
   Un hook ne bloque jamais Claude : toute erreur est ignorée et le code de sortie reste 0. */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const MANUEL_DEBUT = '<!-- RESUME-MANUEL:DEBUT -->';
const MANUEL_FIN = '<!-- RESUME-MANUEL:FIN -->';
const AUTO_DEBUT = '<!-- RESUME-AUTO:DEBUT -->';
const AUTO_FIN = '<!-- RESUME-AUTO:FIN -->';
const MAX_JOURNAL = 30 * 1024 * 1024; // au-delà, seule la fin du journal de la conversation est lue
const OUTILS_ECRITURE = ['Edit', 'Write', 'MultiEdit', 'NotebookEdit'];
// Messages de service glissés dans la conversation, qui ne sont pas des demandes de Lucas
const BRUIT = /^<(system-reminder|local-command-caveat|local-command-stdout|local-command-stderr|command-message|task-notification|ci-monitor-event|bash-input|bash-stdout|bash-stderr|user-prompt-submit-hook)/i;

// Entrée du hook : le JSON envoyé par Claude Code sur l'entrée standard ({} si absente ou illisible).
function lireEntree() {
  return new Promise(resolve => {
    if (process.stdin.isTTY) return resolve({});
    let brut = '';
    let fini = false;
    const fin = () => {
      if (fini) return;
      fini = true;
      clearTimeout(minuteur);
      process.stdin.destroy();
      let entree = {};
      try { entree = JSON.parse(brut); } catch (e) { /* entrée vide ou illisible */ }
      resolve(entree && typeof entree === 'object' ? entree : {});
    };
    const minuteur = setTimeout(fin, 3000);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', morceau => { if (brut.length < 1024 * 1024) brut += morceau; });
    process.stdin.on('end', fin);
    process.stdin.on('error', fin);
  });
}

function dossierProjet(entree) {
  return process.env.CLAUDE_PROJECT_DIR || (entree && entree.cwd) || process.cwd();
}

function cheminNotes(projet, nom) {
  return path.join(projet, '.claude', 'session-notes', nom || 'derniere-session.md');
}

function horodatage(d) {
  d = d || new Date();
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

function git(projet, args) {
  try {
    return execFileSync('git', args, { cwd: projet, encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (e) {
    return '';
  }
}

function lireFichier(fichier) {
  try { return fs.readFileSync(fichier, 'utf8'); } catch (e) { return null; }
}

// Texte venu de l'extérieur (demande, commit, chemin…) : retire tout début ou fin de commentaire HTML, même imbriqué,
// pour qu'il ne puisse jamais former un des marqueurs du fichier de notes.
function neutre(texte) {
  let t = String(texte == null ? '' : texte);
  let avant;
  do { avant = t; t = t.replace(/<!--|-->/g, ''); } while (t !== avant);
  return t;
}

// Coupe à n caractères sans laisser une moitié d'émoji (paire UTF-16) à la fin.
function couper(texte, n) {
  let t = String(texte).slice(0, n);
  if (/[\uD800-\uDBFF]$/.test(t)) t = t.slice(0, -1);
  return t;
}

// Écriture en deux temps (fichier temporaire puis renommage) : jamais de fichier à moitié écrit.
function ecrireFichier(fichier, contenu) {
  fs.mkdirSync(path.dirname(fichier), { recursive: true });
  const temporaire = fichier + '.' + process.pid + '.tmp';
  fs.writeFileSync(temporaire, contenu, 'utf8');
  fs.renameSync(temporaire, fichier);
}

// Journal de la conversation (JSONL) ; pour un très gros journal, seulement la fin (première ligne partielle retirée).
function lireJournal(chemin) {
  let taille;
  try { taille = fs.statSync(chemin).size; } catch (e) { return null; }
  if (taille <= MAX_JOURNAL) return lireFichier(chemin);
  const fd = fs.openSync(chemin, 'r');
  try {
    const tampon = Buffer.alloc(MAX_JOURNAL);
    fs.readSync(fd, tampon, 0, MAX_JOURNAL, taille - MAX_JOURNAL);
    const texte = tampon.toString('utf8');
    return texte.slice(texte.indexOf('\n') + 1);
  } finally {
    fs.closeSync(fd);
  }
}

// Texte d'une demande de Lucas, ou '' pour tout le reste (résultats d'outils, messages de service, résumé de compaction).
function texteDemande(ligne) {
  if (!ligne || ligne.type !== 'user' || ligne.isSidechain || ligne.isCompactSummary || ligne.isVisibleInTranscriptOnly) return '';
  if (ligne.origin && ligne.origin.kind) {
    if (ligne.origin.kind !== 'human') return '';
  } else if (ligne.isMeta) {
    return '';
  }
  const contenu = ligne.message && ligne.message.content;
  let texte = '';
  if (typeof contenu === 'string') {
    texte = contenu;
  } else if (Array.isArray(contenu)) {
    if (contenu.some(b => b && b.type === 'tool_result')) return '';
    texte = contenu.filter(b => b && b.type === 'text' && typeof b.text === 'string').map(b => b.text).join(' ');
  }
  texte = texte.trim();
  const commande = texte.match(/<command-name>\s*([^<]+?)\s*<\/command-name>/);
  if (commande) {
    const args = texte.match(/<command-args>([\s\S]*?)<\/command-args>/);
    texte = commande[1] + (args && args[1].trim() ? ' ' + args[1].trim() : '');
  } else if (BRUIT.test(texte) || /^This session is being continued/.test(texte)) {
    return '';
  }
  texte = neutre(texte.replace(/<\/?pasted_content[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
  return texte.length > 160 ? couper(texte, 159) + '…' : texte;
}

// Chemin relatif au projet, ou '' pour un fichier hors du projet.
function cheminDansProjet(fichier, projet) {
  const relatif = path.relative(projet, fichier);
  return relatif && !relatif.startsWith('..') && !path.isAbsolute(relatif) ? relatif : '';
}

function analyserJournal(cheminJournal) {
  const texte = cheminJournal ? lireJournal(cheminJournal) : null;
  if (!texte) return null;
  const demandes = [];
  const fichiers = new Map(); // dans l'ordre de la dernière modification
  const outils = new Map();
  for (const brut of texte.split('\n')) {
    if (!brut || (brut.indexOf('"user"') < 0 && brut.indexOf('tool_use') < 0)) continue;
    let ligne;
    try { ligne = JSON.parse(brut); } catch (e) { continue; }
    const demande = texteDemande(ligne);
    if (demande) demandes.push(demande);
    if (ligne.type !== 'assistant' || ligne.isSidechain || !ligne.message || !Array.isArray(ligne.message.content)) continue;
    for (const bloc of ligne.message.content) {
      if (!bloc || bloc.type !== 'tool_use' || !bloc.name) continue;
      outils.set(bloc.name, (outils.get(bloc.name) || 0) + 1);
      const fichier = bloc.input && (bloc.input.file_path || bloc.input.notebook_path);
      if (fichier && OUTILS_ECRITURE.includes(bloc.name)) {
        fichiers.delete(fichier);
        fichiers.set(fichier, true);
      }
    }
  }
  return { demandes, fichiers: [...fichiers.keys()], outils };
}

function blocAuto(entree, projet, evenement) {
  const analyse = analyserJournal(entree.transcript_path);
  if (!analyse || analyse.demandes.length === 0) return null; // rien de neuf : les notes existantes restent telles quelles
  const l = [AUTO_DEBUT, '## Résumé automatique (hooks, ne pas modifier à la main)'];
  l.push('- Mis à jour : ' + horodatage() + ' — ' + neutre(evenement));
  if (entree.session_id) l.push('- Session : ' + neutre(String(entree.session_id).slice(0, 8)));
  const branche = neutre(git(projet, ['rev-parse', '--abbrev-ref', 'HEAD']));
  if (branche) l.push('- Branche : ' + branche + ' — dernier commit : ' + couper(neutre(git(projet, ['log', '-1', '--format=%h %s'])), 110));
  l.push('', '### Dernières demandes (' + analyse.demandes.length + ' au total)');
  analyse.demandes.slice(-5).forEach(d => l.push('- ' + d));
  const dansProjet = analyse.fichiers.map(f => neutre(cheminDansProjet(f, projet))).filter(Boolean);
  const horsProjet = analyse.fichiers.length - dansProjet.length;
  if (analyse.fichiers.length) {
    l.push('', '### Fichiers modifiés par Claude (Edit / Write)');
    dansProjet.slice(-12).forEach(f => l.push('- ' + f));
    if (dansProjet.length > 12) l.push('- … et ' + (dansProjet.length - 12) + ' autres dans le projet');
    if (horsProjet) l.push('- (+ ' + horsProjet + ' hors du projet : brouillons, mémoire de Claude…)');
  }
  const etat = git(projet, ['--no-optional-locks', 'status', '--short']);
  if (etat) {
    const lignes = etat.split('\n');
    l.push('', '### Non commité (git status)');
    lignes.slice(0, 10).forEach(x => l.push('- `' + neutre(x.trim()) + '`'));
    if (lignes.length > 10) l.push('- … et ' + (lignes.length - 10) + ' autres');
  }
  const outils = [...analyse.outils.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([nom, n]) => nom + ' ×' + n).join(' · ');
  if (outils) l.push('', '### Outils utilisés', outils);
  l.push(AUTO_FIN);
  return l.join('\n');
}

function modele(projet) {
  return '# Notes de session — ' + path.basename(projet) + '\n\n' +
    'Fichier local (ignoré par git), injecté au démarrage de chaque session par .claude/hooks/session-start.js (3 000 caractères au plus).\n' +
    '/save-session remplit le résumé manuel ; les hooks (fin de réponse, fin de session, avant compaction) tiennent le résumé automatique.\n\n' +
    MANUEL_DEBUT + '\n_Aucun résumé manuel pour l\'instant : lancer /save-session en fin de séance._\n' + MANUEL_FIN + '\n';
}

// Remplace le bloc automatique (ou l'ajoute à la fin) sans toucher au reste du fichier, dont le résumé manuel.
function ecrireResumeAuto(entree, evenement) {
  const projet = dossierProjet(entree);
  const bloc = blocAuto(entree, projet, evenement);
  if (!bloc) return false;
  const fichier = cheminNotes(projet);
  let contenu = lireFichier(fichier);
  if (!contenu || !contenu.trim()) contenu = modele(projet);
  const fin = contenu.lastIndexOf(AUTO_FIN);
  const debut = fin >= 0 ? contenu.lastIndexOf(AUTO_DEBUT, fin) : -1;
  if (debut >= 0) contenu = contenu.slice(0, debut) + bloc + contenu.slice(fin + AUTO_FIN.length);
  else contenu = contenu.replace(/\s*$/, '\n\n') + bloc + '\n';
  ecrireFichier(fichier, contenu);
  return true;
}

// Au démarrage d'une AUTRE session que celle des notes (nouvelle, reprise, bifurcation, /clear), copie des notes dans
// precedente-session.md avant qu'elles soient remplacées (filet de sécurité). Jamais après une compaction.
function archiverSiNouvelleSession(entree, projet) {
  if (!entree.session_id || entree.source === 'compact') return;
  const contenu = lireFichier(cheminNotes(projet));
  if (!contenu || !contenu.trim()) return;
  const session = contenu.match(/^- Session : (\S+)/m);
  if (session && session[1] === String(entree.session_id).slice(0, 8)) return;
  ecrireFichier(cheminNotes(projet, 'precedente-session.md'), contenu);
}

module.exports = {
  MANUEL_DEBUT, MANUEL_FIN, AUTO_DEBUT, AUTO_FIN,
  lireEntree, dossierProjet, cheminNotes, lireFichier, couper, ecrireResumeAuto, archiverSiNouvelleSession
};
