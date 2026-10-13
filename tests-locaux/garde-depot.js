/* garde-depot — v78 (mission de nuit du 12/10/2026, tâche 1) : le dépôt est PUBLIC (code, notes, donnees/ lu par l'onglet
   Catalogue sur raw.githubusercontent.com). Cette vérification, sans navigateur, au banc (partie 10) :
   1. donnees/ en liste blanche : chaque fichier suivi de donnees/ doit être dans LISTE_BLANCHE (le catalogue et la
      documentation de Grok Bot). Tout autre fichier — un programme de client, un relevé, un export — arrête la
      publication. Un nouveau fichier de catalogue s'ajoute ici dans le même commit, après avoir vérifié qu'il ne contient
      aucune donnée personnelle (CLAUDE.md, « Données : zéro perte »). Un fichier de la liste peut manquer (rien n'oblige
      à le garder).
   2. aucun email réel dans les fichiers suivis (donnees/ compris) : seules passent les adresses des domaines d'exemple
      des tests (DOMAINES_EXEMPLE, et tout domaine en .invalid, .test, .example ou .localhost) et l'adresse de la marque
      (CONFIG.marque.email de js/config.js, avec ou sans « +étiquette »). Aucune adresse refusée n'est recopiée dans le
      journal : seulement le fichier, la ligne et le domaine (et pour donnees/, le début du nom du fichier).
      Mission blocs 1-2 (13/10/2026) : + les textes d'exemple EXACTS du champ email du parcours prospect (ADRESSES_EXEMPLE,
      « ton@email.com » de docs/maj-blocs-1-2/TEXTES.md, et sa version anglaise) : un texte d'exemple, pas l'adresse de
      quelqu'un ; toute autre adresse de ces domaines reste refusée.
   Le 12/10, avant la tâche 1 : 2 fichiers hors liste dans donnees/ et 1 adresse hors marque (docs/archive/) → code 1.
   Code de sortie 1 au moindre problème. Usage : node garde-depot.js ../index.html */
const fs = require("fs"), path = require("path");
const { execFileSync } = require("child_process");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const RACINE = path.dirname(HTML);
const problemes = [];

const LISTE_BLANCHE = [
  "donnees/README.md", "donnees/aliments.json", "donnees/aliments-off.json", "donnees/aliments-usda.json",
  "donnees/correspondances-ids.json", "donnees/echauffements.json", "donnees/exercices.json", "donnees/generateur.md",
  "donnees/liens-exercices.json", "donnees/liens-youtube.md", "donnees/liensexercices.json", "donnees/plan-semaine.md",
  "donnees/plans-exemple.json", "donnees/programme-auto.json", "donnees/programmes.json", "donnees/rayons.json",
  "donnees/recettes.json"
];
const DOMAINES_EXEMPLE = ["exemple.fr", "exemple.org", "exemple.com", "exemple.net", "example.com", "example.org", "example.net",
  "e.fr", "gen.fr"];
const SUFFIXES_EXEMPLE = [".invalid", ".test", ".example", ".localhost"];
const ADRESSES_EXEMPLE = ["ton@email.com", "you@email.com"];

let suivis;
try { suivis = execFileSync("git", ["-C", RACINE, "ls-files", "-z"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).split("\0").filter(Boolean); }
catch (e) { console.log("  PROBLÈME liste des fichiers suivis illisible (git ls-files) : " + String(e.message).split("\n")[0]); process.exit(1); }
if (suivis.length < 50) { console.log("  PROBLÈME seulement " + suivis.length + " fichiers suivis : ce n'est pas le dépôt de l'app"); process.exit(1); }

/* 1. donnees/ : liste blanche */
const dansDonnees = suivis.filter(f => f.startsWith("donnees/"));
/* le nom du fichier n'est pas recopié en entier (journal public du banc : un nom de fichier peut contenir un prénom) :
   ses 3 premiers caractères et son extension ; « git ls-files donnees/ » le donne en entier sur la machine */
const masque = (f) => { const n = f.slice("donnees/".length), e = path.extname(n); return "donnees/" + n.slice(0, 3) + "…" + e + " (" + n.length + " caractères)"; };
for (const f of dansDonnees) if (!LISTE_BLANCHE.includes(f)) problemes.push(masque(f) + " n'est pas dans la liste blanche (garde-depot.js) — fichier à sortir du dépôt public, ou à ajouter à la liste après vérification");

/* 2. emails : l'adresse de la marque, lue dans js/config.js */
let marque = "";
try {
  const m = fs.readFileSync(path.join(RACINE, "js", "config.js"), "utf8").match(/^\s*email:\s*"([^"]+@[^"]+)"/m);
  marque = m ? m[1].toLowerCase() : "";
} catch (e) {}
if (!/^[a-z0-9._%-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(marque)) problemes.push("js/config.js : adresse de la marque (CONFIG.marque.email) introuvable");
const [marqueLocal, marqueDomaine] = marque.split("@");
const permise = (adresse) => {
  if (ADRESSES_EXEMPLE.includes(adresse.toLowerCase())) return true;
  const [local, domaine] = adresse.toLowerCase().split("@");
  if (DOMAINES_EXEMPLE.includes(domaine) || SUFFIXES_EXEMPLE.some(s => domaine.endsWith(s))) return true;
  return !!marque && domaine === marqueDomaine && (local === marqueLocal || local.startsWith(marqueLocal + "+"));
};
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
let lus = 0, adresses = 0;
for (const f of suivis) {
  if (/\.(woff2?|png|jpe?g|gif|ico|pdf|zip|gz)$/i.test(f)) continue;
  let t; try { t = fs.readFileSync(path.join(RACINE, f), "utf8"); } catch (e) { continue; }   // fichier supprimé du disque, lien…
  lus++;
  t.split("\n").forEach((ligne, i) => {
    for (const a of ligne.match(EMAIL) || []) {
      adresses++;
      if (!permise(a.replace(/\.+$/, ""))) problemes.push(f + ":" + (i + 1) + " : adresse email hors exemple et hors marque (domaine « " + a.split("@")[1].toLowerCase() + " »)");
    }
  });
}

console.log(suivis.length + " fichiers suivis, " + dansDonnees.length + " dans donnees/ (" + LISTE_BLANCHE.length + " permis), " + lus + " lus, " + adresses + " adresses email relevées");
const uniques = Array.from(new Set(problemes));
uniques.forEach(x => console.log("  PROBLÈME " + x));
console.log(uniques.length ? uniques.length + " problème(s)" : "aucun problème : donnees/ dans la liste blanche, aucune adresse email hors exemple ni hors marque");
if (uniques.length) process.exitCode = 1;
