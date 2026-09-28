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

// v55 : texte collé dans la conversation (balises pasted_content), qui peut contenir des consignes que Lucas n'a pas
// écrites. Une seule zone, de la première balise ouvrante à la dernière fermante (jusqu'à la fin du message s'il n'y en
// a pas après la dernière ouvrante) : un texte collé qui contient lui-même « </pasted_content> … <pasted_content> » ne
// peut donc rien faire passer pour du texte de Lucas (ce qui se trouve entre deux collages est marqué aussi).
// Renvoie { avant, colle, apres } ; colle vaut null s'il n'y a pas de texte collé.
function separerColle(texte) {
  const egaree = t => t.replace(/<\/pasted_content[^>]*>/g, ' '); // balise fermante sans ouvrante avant elle
  const debut = texte.search(/<pasted_content[^>]*>/);
  if (debut < 0) return { avant: egaree(texte), colle: null, apres: '' };
  let apresFermante = -1; // fin de la dernière balise fermante
  const fermante = /<\/pasted_content[^>]*>/g;
  for (let m; (m = fermante.exec(texte));) apresFermante = m.index + m[0].length;
  const fin = apresFermante > debut && !/<pasted_content[^>]*>/.test(texte.slice(apresFermante)) ? apresFermante : texte.length;
  return {
    avant: egaree(texte.slice(0, debut)),
    colle: texte.slice(debut, fin).replace(/<\/?pasted_content[^>]*>/g, ' '),
    apres: texte.slice(fin)
  };
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
  // v55 : le texte collé reste lisible mais marqué [texte collé : …], crochets du collage changés en parenthèses (un « ] »
  // collé ne peut pas fermer la marque) ; commande (/nom arguments) et messages de service ne sont cherchés que dans le
  // reste, et seulement au début : une commande écrite dans un texte collé ne devient jamais une demande de Lucas.
  const { avant, colle, apres } = separerColle(texte);
  const reste = (avant + ' ' + apres).trim();
  const marque = colle === null ? '' : '[texte collé : ' + neutre(colle).replace(/\[/g, '(').replace(/\]/g, ')') + ' ]';
  let morceaux;
  const commande = /^<command-(name|message)>/.test(reste) && reste.match(/<command-name>\s*([^<]+?)\s*<\/command-name>/);
  if (commande) {
    const args = reste.match(/<command-args>([\s\S]*?)<\/command-args>/);
    morceaux = [commande[1] + (args && args[1].trim() ? ' ' + args[1].trim() : ''), marque];
  } else if (BRUIT.test(reste) || /^This session is being continued/.test(reste)) {
    return '';
  } else {
    morceaux = [avant, marque, apres];
  }
  texte = neutre(morceaux.join(' ')).replace(/\s+/g, ' ').trim();
  if (texte.length <= 160) return texte;
  const court = couper(texte, 159);
  const ouverte = court.lastIndexOf('[texte collé : ');
  // coupé au milieu du texte collé : la marque est refermée
  return ouverte >= 0 && court.indexOf(']', ouverte) < 0 ? couper(court, 156).trimEnd() + '… ]' : court + '…';
}

// Même fichier : chemins identiques, ou identiques une fois les liens symboliques suivis (ex. /tmp et /private/tmp).
function memeFichier(a, b) {
  if (path.resolve(a) === path.resolve(b)) return true;
  try { return fs.realpathSync(a) === fs.realpathSync(b); } catch (e) { return false; }
}

// Chemin relatif au projet, ou '' pour un fichier hors du projet.
function cheminDansProjet(fichier, projet) {
  const relatif = path.relative(projet, fichier);
  return relatif && !relatif.startsWith('..') && !path.isAbsolute(relatif) ? relatif : '';
}

// Texte écrit par un Edit / Write / MultiEdit, pour vérifier ensuite qu'il est toujours dans le fichier.
function texteEcrit(nom, input) {
  if (nom === 'Write') return [String(input.content || '')];
  if (nom === 'Edit') return [String(input.new_string || '')];
  if (nom === 'MultiEdit' && Array.isArray(input.edits)) return input.edits.map(e => String((e && e.new_string) || ''));
  return [];
}

function analyserJournal(cheminJournal) {
  const texte = cheminJournal ? lireJournal(cheminJournal) : null;
  if (!texte) return null;
  const demandes = [];
  const fichiers = new Map(); // dans l'ordre de la dernière modification ; valeur : le texte écrit la dernière fois
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
        fichiers.set(fichier, texteEcrit(bloc.name, bloc.input));
      }
    }
  }
  return { demandes, fichiers: [...fichiers.keys()], ecrits: fichiers, outils };
}

// Le texte écrit est-il toujours dans les notes ? Pour un Write du fichier entier, seul le bloc manuel compte.
function encorePresent(ecrit, contenu) {
  return ecrit.every(t => {
    const debut = t.indexOf(MANUEL_DEBUT);
    const fin = debut >= 0 ? t.indexOf(MANUEL_FIN, debut) : -1;
    const morceau = (fin >= 0 ? t.slice(debut, fin + MANUEL_FIN.length) : t).trim();
    return !morceau || contenu.indexOf(morceau) >= 0;
  });
}

// v55 : les hooks ne touchent jamais au résumé manuel. Cette ligne du bloc automatique dit seulement s'il a été écrit dans
// cette session (Edit / Write / MultiEdit sur le fichier de notes, texte toujours en place), pour qu'un résumé d'une
// session précédente ou d'une autre fenêtre ne passe pas pour celui de cette session. Le fichier n'est que lu ici.
function etatResumeManuel(analyse, projet) {
  const notes = cheminNotes(projet);
  const surNotes = analyse.fichiers.filter(f => memeFichier(path.resolve(projet, f), notes));
  if (!surNotes.length) return 'pas modifié dans cette session (Edit/Write) : il peut dater d\'une session précédente, vérifier sa date';
  return encorePresent(analyse.ecrits.get(surNotes[surNotes.length - 1]), lireFichier(notes) || '')
    ? 'mis à jour dans cette session (Edit/Write sur ce fichier)'
    : 'modifié dans cette session, puis remplacé ailleurs (autre fenêtre ?) : vérifier sa date';
}

function blocAuto(entree, projet, evenement) {
  const analyse = analyserJournal(entree.transcript_path);
  if (!analyse || analyse.demandes.length === 0) return null; // rien de neuf : les notes existantes restent telles quelles
  const l = [AUTO_DEBUT, '## Résumé automatique (hooks, ne pas modifier à la main)'];
  l.push('- Mis à jour : ' + horodatage() + ' — ' + neutre(evenement));
  const session = sessionCourte(entree);
  if (session) l.push('- Session : ' + session);
  l.push('- Résumé manuel : ' + etatResumeManuel(analyse, projet));
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

// Identifiant court de la session (8 premiers caractères), tel qu'écrit dans le bloc automatique ; '' s'il est inconnu.
function sessionCourte(entree) {
  const id = entree && entree.session_id;
  return typeof id === 'string' ? neutre(id.slice(0, 8)) : '';
}

// Position du bloc automatique (le dernier du fichier), ou null s'il n'y en a pas encore.
function zoneAuto(contenu) {
  const fin = contenu.lastIndexOf(AUTO_FIN);
  const debut = fin >= 0 ? contenu.lastIndexOf(AUTO_DEBUT, fin) : -1;
  return debut >= 0 ? { debut, fin: fin + AUTO_FIN.length } : null;
}

// v55 : session qui a écrit les notes, lue dans le bloc automatique seulement (une ligne « - Session : » du résumé
// manuel ne compte pas) ; '' s'il n'y a pas encore de bloc automatique.
function sessionDesNotes(contenu) {
  const zone = zoneAuto(contenu);
  const ligne = zone && contenu.slice(zone.debut, zone.fin).match(/^- Session : (\S+)/m);
  return ligne ? ligne[1] : '';
}

// Remplace le bloc automatique (ou l'ajoute à la fin) sans toucher au reste du fichier, dont le résumé manuel.
// Le fichier est relu juste avant d'écrire (après le journal et git) : un résumé manuel écrit entre-temps par une autre
// fenêtre n'est pas écrasé par une copie plus ancienne.
function ecrireResumeAuto(entree, evenement) {
  const projet = dossierProjet(entree);
  const bloc = blocAuto(entree, projet, evenement);
  if (!bloc) return false;
  const fichier = cheminNotes(projet);
  let contenu = lireFichier(fichier);
  if (!contenu || !contenu.trim()) contenu = modele(projet);
  const zone = zoneAuto(contenu);
  if (zone) contenu = contenu.slice(0, zone.debut) + bloc + contenu.slice(zone.fin);
  else contenu = contenu.replace(/\s*$/, '\n\n') + bloc + '\n';
  ecrireFichier(fichier, contenu);
  return true;
}

// Au démarrage d'une AUTRE session que celle des notes (nouvelle, reprise, bifurcation, /clear), copie des notes dans
// precedente-session.md avant qu'elles soient remplacées (filet de sécurité). Jamais après une compaction.
function archiverSiNouvelleSession(entree, projet) {
  if (!sessionCourte(entree) || entree.source === 'compact') return;
  const contenu = lireFichier(cheminNotes(projet));
  if (!contenu || !contenu.trim()) return;
  if (sessionDesNotes(contenu) === sessionCourte(entree)) return;
  ecrireFichier(cheminNotes(projet, 'precedente-session.md'), contenu);
}

module.exports = {
  MANUEL_DEBUT, MANUEL_FIN, AUTO_DEBUT, AUTO_FIN,
  lireEntree, dossierProjet, cheminNotes, lireFichier, couper, ecrireResumeAuto, archiverSiNouvelleSession
};
