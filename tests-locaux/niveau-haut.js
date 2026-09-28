/* niveau-haut — 52.1 (chantier 1 bis) : les fichiers js/ se chargent l'un après l'autre (scripts classiques, dans l'ordre
   de MHX_JS). Une fonction ou une const d'un fichier SUIVANT n'existe pas encore quand un fichier s'exécute : le code
   exécuté AU CHARGEMENT d'un fichier (hors corps de fonctions) ne doit utiliser que ce qui est déclaré dans ce fichier
   ou avant. Cette vérification, sans navigateur :
   1. chaque fichier se compile seul comme script classique (V8), sans « use strict » en tête (l'app n'en a jamais eu) ;
   2. aucun nom déclaré deux fois au niveau haut (deux fichiers ne peuvent pas déclarer la même const) ;
   3. le code exécuté au chargement de chaque fichier, et (par excès) tout le corps des fonctions qu'il appelle
      (fonction déclarée, const flèche, méthode ou getter d'un objet littéral de niveau haut, rappel de forEach / map…),
      n'utilise aucun nom déclaré dans un fichier chargé plus tard ;
   4. relevé (pour information) du code programmé pour plus tard au chargement (écouteurs, minuteries, promesses,
      fonctions async) : entre deux fichiers, le navigateur peut l'exécuter ; aujourd'hui seulement 3 écouteurs de
      js/navigation.js (qui n'appellent que majFondus, du même fichier) et js/demarrage.js (le dernier fichier).
   Analyse par l'analyseur JavaScript (Babel) livré avec Playwright. Code de sortie 1 au moindre problème.
   Usage : node niveau-haut.js ../index.html */
const fs = require("fs"), path = require("path"), vm = require("vm");
const { listes } = require("./fichiers");
const B = require(path.join(path.dirname(require.resolve("playwright/package.json")), "lib", "transform", "babelBundle.js"));
const traverse = B.traverse.default || B.traverse;
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const FICHIERS = listes(fs.readFileSync(HTML, "utf8")).filter(f => f.endsWith(".js"));
const problemes = [], differes = [];
if (!FICHIERS.length) { console.log("aucun fichier js/ dans MHX_JS (" + HTML + ") : rien à vérifier"); process.exit(1); }

/* 1. compilation seule, mode non strict */
const src = FICHIERS.map(f => fs.readFileSync(path.join(path.dirname(HTML), f), "utf8"));
src.forEach((t, k) => {
  try { new vm.Script(t, { filename: FICHIERS[k] }); } catch (e) { problemes.push(FICHIERS[k] + " ne se compile pas seul : " + e.message); }
  if (/^(\s|\/\*[\s\S]*?\*\/|\/\/[^\n]*\n)*["']use strict["']/.test(t)) problemes.push(FICHIERS[k] + " commence par « use strict » (l'app n'est pas en mode strict)");
});

/* 2. déclarations de niveau haut */
const asts = src.map((t, k) => B.babelParse(t, FICHIERS[k], false));
const ou = new Map(), decl = new Map();
asts.forEach((a, k) => {
  for (const s of (a.program || a).body) {
    const noms = s.type === "VariableDeclaration" ? s.declarations.map(d => [d.id.name, d.init]) : (s.type === "FunctionDeclaration" || s.type === "ClassDeclaration") ? [[s.id.name, s]] : [];
    for (const [n, node] of noms) {
      if (!n) continue;
      if (ou.has(n)) problemes.push("« " + n + " » déclaré deux fois au niveau haut (" + FICHIERS[ou.get(n)] + ", " + FICHIERS[k] + ")");
      ou.set(n, k); decl.set(n, node);
    }
  }
});

/* 3. le code exécuté au chargement */
const estFonction = n => n && /^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression|ObjectMethod|ClassMethod)$/.test(n.type);
const DIFFERE = /^(addEventListener|setTimeout|setInterval|requestAnimationFrame|requestIdleCallback|queueMicrotask|then|catch|finally)$/;
const nomAppel = c => c.type === "MemberExpression" ? (c.property.name || "") : (c.name || "");
/* la fonction désignée par f, Obj.m ou Obj.getter (objets littéraux de niveau haut) */
function cible(node){
  if (node.type === "Identifier" && estFonction(decl.get(node.name))) return { fn: decl.get(node.name), nom: node.name };
  if (node.type === "MemberExpression" && !node.computed && node.object.type === "Identifier" && decl.get(node.object.name) && decl.get(node.object.name).type === "ObjectExpression") {
    const p = decl.get(node.object.name).properties.find(p => p.key && (p.key.name || p.key.value) === node.property.name);
    if (p && p.type === "ObjectMethod") return { fn: p, nom: node.object.name + "." + node.property.name, getter: p.kind === "get" };
    if (p && p.type === "ObjectProperty" && estFonction(p.value)) return { fn: p.value, nom: node.object.name + "." + node.property.name };
  }
  return null;
}
const global = p => { const b = p.scope.getBinding(p.node.name); return !b || b.scope.path.type === "Program"; };
const vus = new Set();
function verifierNom(p, k, ou_) {
  const n = p.node.name;
  if (global(p) && ou.has(n) && ou.get(n) > k) problemes.push(FICHIERS[k] + " : au chargement, " + ou_ + " utilise « " + n + " » de " + FICHIERS[ou.get(n)] + ", chargé plus tard");
}
function suivre(c, k, chemin){
  const cle = k + "|" + c.nom;
  if (vus.has(cle)) return;
  vus.add(cle);
  if (c.fn.async) differes.push(FICHIERS[k] + " : fonction async " + c.nom + " appelée au chargement (" + chemin + ")");
  const kf = ou.get(c.nom.split(".")[0]);
  traverse(asts[kf], { enter(q){ if (q.node === c.fn) { corps(q, k, chemin + " → " + c.nom); q.stop(); } } });
}
/* corps d'une fonction appelée au chargement : tout, par excès (fonctions internes comprises) */
function corps(fp, k, chemin){
  fp.get("body").traverse({
    ReferencedIdentifier(p){ verifierNom(p, k, chemin); },
    CallExpression(p){
      if (DIFFERE.test(nomAppel(p.node.callee))) differes.push(FICHIERS[k] + " : " + nomAppel(p.node.callee) + "(…) dans " + chemin);
      const c = cible(p.node.callee); if (c) suivre(c, k, chemin);
    }
  });
}
asts.forEach((a, k) => traverse(a, { Program(prog){
  for (const s of prog.get("body")) {
    if (s.isFunctionDeclaration()) continue;   // corps exécuté seulement quand on l'appelle
    s.traverse({
      Function(p){
        const par = p.parentPath;
        if ((par.isCallExpression() || par.isNewExpression()) && par.node.callee === p.node) {   // appelée tout de suite
          if (p.node.async) differes.push(FICHIERS[k] + " : fonction async appelée au chargement (ligne " + p.node.loc.start.line + ")");
          return;
        }
        if (par.isCallExpression() && par.node.arguments.includes(p.node)) {
          if (!DIFFERE.test(nomAppel(par.node.callee))) return;   // rappel de forEach, map, Object.assign… : exécuté tout de suite
          differes.push(FICHIERS[k] + " : " + nomAppel(par.node.callee) + "(…) au chargement (ligne " + p.node.loc.start.line + ")");
        }
        p.skip();
      },
      ReferencedIdentifier(p){ verifierNom(p, k, "le niveau haut (ligne " + p.node.loc.start.line + ")"); },
      CallExpression(p){ const c = cible(p.node.callee); if (c) suivre(c, k, "ligne " + p.node.loc.start.line); },
      MemberExpression(p){
        if (p.parentPath.isCallExpression() && p.parentPath.node.callee === p.node) return;
        const c = cible(p.node); if (c && c.getter) suivre(c, k, "ligne " + p.node.loc.start.line);
      }
    });
  }
  prog.stop();
}}));

console.log(FICHIERS.length + " fichiers js/ dans l'ordre de MHX_JS, " + ou.size + " noms de niveau haut, " + vus.size + " fonctions suivies depuis le chargement");
/* le code programmé par le DERNIER fichier ne peut rien trouver « pas encore chargé » : seuls les autres sont listés */
const avantDernier = Array.from(new Set(differes)).filter(x => !x.startsWith(FICHIERS[FICHIERS.length - 1] + " "));
console.log("code programmé pour plus tard au chargement, hors " + FICHIERS[FICHIERS.length - 1] + " (information : il peut s'exécuter entre deux fichiers) : " + avantDernier.length);
avantDernier.forEach(x => console.log("  · " + x));
const uniques = Array.from(new Set(problemes));
uniques.forEach(x => console.log("  PROBLÈME " + x));
console.log(uniques.length ? uniques.length + " problème(s)" : "aucun problème : aucun fichier n'utilise au chargement un nom d'un fichier chargé plus tard");
if (uniques.length) process.exitCode = 1;
