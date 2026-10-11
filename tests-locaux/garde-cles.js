/* garde-cles — v78 (tâche 5, relecture du 12/10/2026). Une fois la v78 appliquée (supabase/v78-limites/02-migration.sql),
   la base n'accepte dans donnees que les clés de public.v78_limite(). Une clé ajoutée dans l'app sans être ajoutée là
   serait REFUSÉE EN PRODUCTION (la modification reste sur l'appareil, « mhx_refus », n'est jamais renvoyée toute seule
   et disparaît à la déconnexion), et les suites du banc ne le verraient pas : elles imitent Supabase. Cette vérification,
   sans navigateur, au banc (partie 10) :
   1. relève dans js/*.js les clés que l'app écrit ou lit : cle… : "…" (objets des outils, Contact.cle, VISITE.cle,
      cle_perso), outil : "…" (POST directs), Store.ecrire / envoyer / envoyerCle("…"), CleCoach.ecrireSi(…, "…"), les
      listes cles… = [ … ] (clesCoachSeul, clesSansOutil…), Historique.cles { … } et les filtres outil=eq.… / in.(…) ;
      rouge si l'une d'elles manque dans la liste de public.v78_limite de 02-migration.sql (sauf les noms qui ne sont pas
      des clés de donnees : stockage de l'appareil « mhx_… » et PAS_DES_CLES ci-dessous, chacun avec sa raison) ;
   2. rouge si les autres copies de la liste ne sont plus identiques à celle de 02 (clés et limites : 01, 04 test 3, 05 ;
      clés seules : INVENTAIRE-CLES.md ; plafond prospect et clés du coach : 01, 02, 04, 05) ;
   3. rouge si une même empreinte (règles RLS, fonctions, lignes, profils) n'a pas la même formule dans 01, 02, 03 et 05
      (sinon 05 dirait « ÉCART » ou « ÉCHEC » pour rien) ;
   4. rouge si 06-repetition.sql n'est plus exactement « begin ; set local … ; corps de 02 ; corps de 04 ; rollback »
      (il se refait avec : node garde-cles.js ../index.html --refaire-06), ou si un commit / rollback / begin de trop se
      glisse dans un fichier (06 n'a jamais de commit : la répétition ne peut rien appliquer) ; 01 et 05 restent une
      seule requête, sans contrôle de transaction.
   Une nouvelle clé : l'ajouter dans 02 (public.v78_limite) et dans les copies (01, 04, 05, INVENTAIRE), refaire 06,
   relancer les tests SQL locaux (LISEZMOI, étape 0) ; si la v78 est déjà en base, l'y ajouter AVANT de publier l'app
   (CREATE OR REPLACE FUNCTION, non destructif). Si une migration plus récente redéfinit public.v78_limite, faire
   pointer MIGRATION vers elle.
   Code de sortie 1 au moindre problème. Usage : node garde-cles.js ../index.html [--refaire-06] */
const fs = require("fs"), path = require("path");
const ARGS = process.argv.slice(2);
const REFAIRE = ARGS.includes("--refaire-06");
const HTML = path.resolve(ARGS.find(a => !a.startsWith("--")) || path.join(__dirname, "..", "index.html"));
const RACINE = path.dirname(HTML);
const DOSSIER = path.join(RACINE, "supabase", "v78-limites");
const MIGRATION = "02-migration.sql";
const INVENTAIRE = path.join(RACINE, "supabase", "releve-2026-09-30", "INVENTAIRE-CLES.md");
const problemes = [];
const pb = (x) => problemes.push(x);

/* noms trouvés par les motifs ci-dessous qui ne sont PAS des clés de donnees (une raison chacun) */
const PAS_DES_CLES = {
  sexe: "js/outilClients.js : nom d'une ligne du tableau de comparaison de la fiche (affichage seulement)"
};
const LOCAL = /^mhx_/;   // stockage de l'appareil (localStorage / sessionStorage : mhx_session, mhx_theme, mhx_langue…)

const lire = (f) => { try { return fs.readFileSync(f, "utf8"); } catch (e) { pb(path.relative(RACINE, f) + " illisible"); return ""; } };
const sql = (f) => lire(path.join(DOSSIER, f));

/* ---------- SQL : ce qui est au niveau haut (hors commentaires, chaînes, corps $…$) ---------- */
function niveauHaut(t) {
  let o = "", i = 0;
  while (i < t.length) {
    const c = t[i], d = t[i + 1];
    if (c === "-" && d === "-") { const j = t.indexOf("\n", i); i = j < 0 ? t.length : j; continue; }
    if (c === "/" && d === "*") { const j = t.indexOf("*/", i + 2); i = j < 0 ? t.length : j + 2; o += " "; continue; }
    if (c === "'") {
      let j = i + 1;
      for (;;) { const k = t.indexOf("'", j); if (k < 0) { j = t.length; break; } if (t[k + 1] === "'") { j = k + 2; continue; } j = k + 1; break; }
      o += "''"; i = j; continue;
    }
    if (c === '"') { const k = t.indexOf('"', i + 1); i = k < 0 ? t.length : k + 1; o += '""'; continue; }
    if (c === "$") {
      const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(t.slice(i, i + 80));
      if (m) { const k = t.indexOf(m[0], i + m[0].length); i = k < 0 ? t.length : k + m[0].length; o += " $$ "; continue; }
    }
    o += c; i++;
  }
  return o;
}
const instructions = (t) => niveauHaut(t).split(";").map(s => s.replace(/\s+/g, " ").trim()).filter(Boolean);
const TRANSACTION = /^(begin|start|commit|end|rollback|abort)\b/i;
const controles = (t) => instructions(t).filter(s => TRANSACTION.test(s)).map(s => s.split(" ")[0].toLowerCase());

/* ---------- 1. les clés de js/ ---------- */
const vues = new Map();
const noter = (c, ou) => { if (!/^[a-z][a-z0-9_]{0,39}$/.test(c)) return; if (!vues.has(c)) vues.set(c, []); vues.get(c).push(ou); };
const DOSSIER_JS = path.join(RACINE, "js");
let fichiersJs = [];
try { fichiersJs = fs.readdirSync(DOSSIER_JS).filter(f => f.endsWith(".js")).sort(); } catch (e) { pb("js/ illisible"); }
if (fichiersJs.length && fichiersJs.length < 10) pb("seulement " + fichiersJs.length + " fichiers dans js/ : ce n'est pas l'app");
for (const f of fichiersJs) {
  const t = lire(path.join(DOSSIER_JS, f));
  const ou = (i) => "js/" + f + ":" + t.slice(0, i).split("\n").length;
  for (const re of [/\bcle\w*\s*:\s*["']([^"'\n]{1,80})["']/g, /\boutil\s*:\s*["']([^"'\n]{1,80})["']/g,
                    /\bStore\.(?:ecrire|envoyer|envoyerCle)\(\s*["']([^"'\n]{1,80})["']/g,
                    /\bCleCoach\.ecrireSi\([^,()]+,\s*["']([^"'\n]{1,80})["']/g])
    for (const m of t.matchAll(re)) noter(m[1], ou(m.index));
  /* listes de clés (pas les tableaux de tableaux, comme les régimes du Catalogue) */
  for (const m of t.matchAll(/\bcles\w*\s*[:=]\s*\[(?!\s*\[)([^\]]*)\]/g))
    for (const s of m[1].matchAll(/["']([^"'\n]+)["']/g)) noter(s[1], ou(m.index));
  for (const m of t.matchAll(/\bcles\w*\s*[:=]\s*\{([^}]*)\}/g))
    for (const s of m[1].matchAll(/:\s*["']([^"'\n]+)["']/g)) noter(s[1], ou(m.index));
  for (const m of t.matchAll(/outil=(?:not\.)?(?:eq\.|in\.\()([a-z0-9_,]+)/g))
    for (const c of m[1].split(",").filter(Boolean)) noter(c, ou(m.index));
}

/* ---------- la liste de 02 (public.v78_limite) ---------- */
const t02 = sql(MIGRATION), t01 = sql("01-releve-agregats.sql"), t03 = sql("03-retour.sql"),
      t04 = sql("04-tests.sql"), t05 = sql("05-verifications.sql");
const entre = (t, debut, fin, nom) => {
  const a = t.indexOf(debut); const b = a < 0 ? -1 : t.indexOf(fin, a + debut.length);
  if (a < 0 || b < 0) { pb(nom + " : passage « " + debut + " … " + fin + " » introuvable"); return ""; }
  return t.slice(a, b);
};
const paires = (s) => { const m = new Map(); for (const x of s.matchAll(/\(\s*'([a-z0-9_]+)'\s*,\s*(\d+)\s*\)/g)) m.set(x[1], Number(x[2])); return m; };
const fonction02 = entre(t02, "create or replace function public.v78_limite", "comment on function public.v78_limite", MIGRATION);
const LISTE = new Map();
for (const x of fonction02.matchAll(/when\s+'([a-z0-9_]+)'\s+then\s+(\d+)/g)) {
  if (LISTE.has(x[1])) pb(MIGRATION + " : clé « " + x[1] + " » deux fois dans public.v78_limite");
  LISTE.set(x[1], Number(x[2]));
}
const plafond02 = (fonction02.match(/least\(\s*l\.octets\s*,\s*(\d+)\s*\)/) || [])[1];
if (LISTE.size < 20) pb(MIGRATION + " : seulement " + LISTE.size + " clés lues dans public.v78_limite (format changé ?)");
if (!plafond02) pb(MIGRATION + " : plafond prospect (least(l.octets, …)) introuvable");

/* 1. chaque clé de js/ est dans la liste */
let ignorees = 0;
for (const [c, ou] of [...vues].sort()) {
  if (LISTE.has(c)) continue;
  if (LOCAL.test(c) || PAS_DES_CLES[c]) { ignorees++; continue; }
  pb("clé « " + c + " » écrite ou lue par l'app (" + ou.slice(0, 3).join(", ") + (ou.length > 3 ? "…" : "") + ") mais absente de public.v78_limite ("
     + MIGRATION + ") : la base la refuserait en production — l'ajouter dans 02 et ses copies (en tête de garde-cles.js), ou dans PAS_DES_CLES si ce n'est pas une clé de donnees");
}
for (const c of Object.keys(PAS_DES_CLES)) if (LISTE.has(c)) pb("« " + c + " » est à la fois dans PAS_DES_CLES et dans public.v78_limite");
const sansApp = [...LISTE.keys()].filter(c => !vues.has(c));

/* 2. les copies de la liste */
const comparer = (nom, m) => {
  const manque = [...LISTE.keys()].filter(c => !m.has(c)), deTrop = [...m.keys()].filter(c => !LISTE.has(c)),
        autre = [...LISTE.keys()].filter(c => m.has(c) && m.get(c) !== LISTE.get(c));
  if (manque.length) pb(nom + " : clé(s) absente(s) par rapport à " + MIGRATION + " : " + manque.join(", "));
  if (deTrop.length) pb(nom + " : clé(s) de trop par rapport à " + MIGRATION + " : " + deTrop.join(", "));
  if (autre.length) pb(nom + " : limite(s) différente(s) de " + MIGRATION + " : " + autre.map(c => c + " " + m.get(c) + " au lieu de " + LISTE.get(c)).join(", "));
};
comparer("01-releve-agregats.sql (limites)", paires(entre(t01, "limites (outil, limite) as (values", "cles_coach (outil)", "01-releve-agregats.sql")));
comparer("04-tests.sql (test 3)", paires(entre(t04, "insert into t_res select 3,", "as a (outil, limite)", "04-tests.sql")));
comparer("05-verifications.sql (attendu)", paires(entre(t05, "attendu (outil, limite) as (values", "cles_coach (outil)", "05-verifications.sql")));
{
  const inv = lire(INVENTAIRE), cles = new Set();
  const debut = inv.search(/^## Les \d+ clés/m);
  if (debut < 0) pb("INVENTAIRE-CLES.md : tableau « ## Les … clés » introuvable");
  else {
    for (const l of inv.slice(debut).split("\n").slice(1)) {
      if (/^## /.test(l) || /^\*\*/.test(l)) break;
      const m = l.match(/^\|\s*\*{0,2}`([a-z0-9_]+)`/);
      if (m) cles.add(m[1]);
    }
    const n = Number((inv.slice(debut).match(/^## Les (\d+) clés/) || [])[1]);
    const manque = [...LISTE.keys()].filter(c => !cles.has(c)), deTrop = [...cles].filter(c => !LISTE.has(c));
    if (manque.length) pb("INVENTAIRE-CLES.md : clé(s) absente(s) du tableau : " + manque.join(", "));
    if (deTrop.length) pb("INVENTAIRE-CLES.md : clé(s) du tableau absente(s) de " + MIGRATION + " : " + deTrop.join(", "));
    if (n !== cles.size) pb("INVENTAIRE-CLES.md : le titre dit " + n + " clés, le tableau en a " + cles.size);
  }
}
/* plafond prospect : toutes les formes least(…, N) des fichiers */
for (const [nom, t] of [["01-releve-agregats.sql", t01], ["04-tests.sql", t04], ["05-verifications.sql", t05]]) {
  const vus = [...t.matchAll(/least\([^,()]+(?:\([^()]*\))?[^,()]*,\s*(\d+)\s*\)/g)].map(x => x[1]);
  if (!vus.length) pb(nom + " : plafond prospect (least(…, " + plafond02 + ")) introuvable");
  for (const v of vus) if (v !== plafond02) pb(nom + " : plafond prospect " + v + " au lieu de " + plafond02 + " (" + MIGRATION + ")");
}
/* clés écrites par le coach dans une fiche (exclues du plafond prospect dans les garde-fous et les relevés) */
{
  const liste = (s) => new Set([...s.matchAll(/'([a-z0-9_]+)'/g)].map(x => x[1]));
  const ref = liste(entre(t02, "cles_coach constant text[] := array[", "]", MIGRATION));
  for (const [nom, t] of [["01-releve-agregats.sql", t01], ["05-verifications.sql", t05]]) {
    const l = liste(entre(t, "cles_coach (outil) as (values", "))", nom));
    if ([...ref].sort().join() !== [...l].sort().join()) pb(nom + " : clés du coach (cles_coach) différentes de " + MIGRATION + " : " + [...l].sort().join(", "));
  }
  for (const c of ref) if (!LISTE.has(c)) pb(MIGRATION + " : clé du coach « " + c + " » absente de public.v78_limite");
}

/* 3. une même empreinte = une même formule dans 01, 02, 03, 05 (alias t. / d. du relevé et des vérifications confondus) */
{
  const groupes = new Map();
  for (const [nom, t] of [["01", t01], ["02", t02], ["03", t03], ["05", t05]])
    for (const m of t.matchAll(/md5\(string_agg\(([\s\S]*?),\s*','\s*order by ([^)]*)\)\)/g)) {
      const norme = (s) => s.replace(/\s+/g, " ").replace(/\b[td]\./g, "x.").trim();
      const cle = norme(m[2]);
      if (!groupes.has(cle)) groupes.set(cle, []);
      groupes.get(cle).push([nom, norme(m[1])]);
    }
  const attendus = { "schemaname, tablename, policyname": ["01", "02", "02", "03", "03", "05"], "p.proname, p.oid": ["01", "02", "02", "05"],
                     "x.user_id, x.outil": ["01", "05"], "x.user_id": ["01", "05"], "p.id": ["01", "05"] };
  for (const [ordre, fichiers] of Object.entries(attendus)) {
    const g = groupes.get(ordre) || [];
    if (g.map(x => x[0]).join() !== fichiers.join()) pb("empreinte « order by " + ordre + " » : trouvée dans " + (g.map(x => x[0]).join(", ") || "aucun fichier") + ", attendue dans " + fichiers.join(", "));
    const formules = new Set(g.map(x => x[1]));
    if (formules.size > 1) pb("empreinte « order by " + ordre + " » : formules différentes selon les fichiers (" + g.map(x => x[0]).join(", ") + ") — même formule partout, sinon 05 compare des choses différentes");
  }
  const regles = (groupes.get("schemaname, tablename, policyname") || [])[0];
  if (regles && !["cmd", "roles", "permissive", "qual", "with_check"].every(c => regles[1].includes(c)))
    pb("empreinte des règles RLS : la formule doit couvrir la commande, les rôles, le type (permissive), qual et with_check");
}

/* 4. 06-repetition.sql = begin ; set local … ; corps de 02 ; corps de 04 ; rollback — et aucun commit */
const corps = (t, nom) => {
  const l = t.split("\n");
  const a = l.map((x, i) => /^-- -+ DÉBUT DU CORPS\b/.test(x) ? i : -1).filter(i => i >= 0),
        b = l.map((x, i) => /^-- -+ FIN DU CORPS\b/.test(x) ? i : -1).filter(i => i >= 0);
  if (a.length !== 1 || b.length !== 1 || b[0] < a[0]) { pb(nom + " : il faut une ligne « -- ---------- DÉBUT DU CORPS » puis une « -- ---------- FIN DU CORPS », une seule de chaque"); return null; }
  return l.slice(a[0] + 1, b[0]).join("\n");
};
const c02 = corps(t02, MIGRATION), c04 = corps(t04, "04-tests.sql");
for (const [nom, c] of [[MIGRATION + " (corps)", c02], ["04-tests.sql (corps)", c04]])
  if (c != null && controles(c).length) pb(nom + " : contrôle de transaction dans le corps (" + controles(c).join(", ") + ") : il serait recopié dans la répétition");
const verifierEnveloppe = (nom, t, attendu) => { const c = controles(t); if (c.join() !== attendu.join()) pb(nom + " : contrôles de transaction « " + c.join(", ") + " » au lieu de « " + attendu.join(", ") + " »"); };
verifierEnveloppe(MIGRATION, t02, ["begin", "commit"]);
verifierEnveloppe("03-retour.sql", t03, ["begin", "commit"]);
verifierEnveloppe("04-tests.sql", t04, ["begin", "rollback"]);
for (const [nom, t] of [["01-releve-agregats.sql", t01], ["05-verifications.sql", t05]]) {
  const ins = instructions(t);
  if (ins.length !== 1 || !/^(with|select)\b/i.test(ins[0])) pb(nom + " : doit rester UNE seule requête (with … / select …) ; trouvé " + ins.length + " instruction(s)");
}

const ENTETE_06 = [
  "-- =====================================================================================================================",
  "-- v78 — RÉPÉTITION SUR LA VRAIE BASE (LISEZMOI, étape 3) : TOUT EST ANNULÉ, RIEN N'EST GARDÉ. Pas encore lancée.",
  "-- À coller TEL QUEL dans l'éditeur SQL de Supabase, en un seul envoi, avec l'« ok » de Lucas, à une heure calme.",
  "-- Ce fichier = begin ; set local … ; le corps de 02-migration.sql ; le corps de 04-tests.sql ; rollback.",
  "-- AUCUN commit : il ne peut pas appliquer la migration (02-migration.sql ne sert qu'à l'application réelle, étape 4).",
  "-- Le corps de 04 finit par une erreur VOULUE qui annule tout, même si l'éditeur ne lit pas la dernière ligne. Attendu :",
  "--   « v78 : 68 / 68 tests OK, 8 sauté(s) — aucun échec. Annulation forcée : rien n'est gardé. »",
  "--   (en local, superutilisateur : « 76 / 76 tests OK, 0 sauté(s) »). Une erreur « v78 : STOP — … » avant : rien n'est",
  "--   appliqué non plus ; on lit pourquoi et on s'arrête (LISEZMOI, critères d'arrêt).",
  "-- Pendant l'envoi, l'app peut se figer quelques secondes et afficher « Hors ligne — gardé sur cet appareil, renvoi",
  "-- automatique » : verrou sur profils et donnees jusqu'à l'annulation ; c'est normal, rien n'est perdu (LISEZMOI).",
  "-- NE PAS MODIFIER À LA MAIN : copie exacte des corps de 02 et de 04, vérifiée par le banc (tests-locaux/garde-cles.js).",
  "-- Après un changement de 02 ou de 04, depuis tests-locaux/ : node garde-cles.js ../index.html --refaire-06",
  "-- =====================================================================================================================",
  "begin;",
  "set local lock_timeout = '5s';         -- un verrou attendu plus de 5 s : tout est annulé, on réessaie plus tard",
  "set local statement_timeout = '120s';"
].join("\n");
const refaire06 = () => [ENTETE_06, "-- >>>>> corps de 02-migration.sql (copie exacte) >>>>>", c02,
  "-- >>>>> corps de 04-tests.sql (copie exacte) >>>>>", c04, "-- <<<<< fin des corps : tout ce qui précède est annulé <<<<<", "rollback;", ""].join("\n");
const F06 = path.join(DOSSIER, "06-repetition.sql");
if (c02 != null && c04 != null) {
  const attendu06 = refaire06();
  if (REFAIRE) { fs.writeFileSync(F06, attendu06); console.log("06-repetition.sql refait depuis " + MIGRATION + " et 04-tests.sql"); }
  const t06 = lire(F06);
  if (t06 && t06 !== attendu06) pb("06-repetition.sql n'est plus exactement « begin ; set local … ; corps de 02 ; corps de 04 ; rollback » : le refaire (node garde-cles.js ../index.html --refaire-06), jamais à la main");
  if (t06) verifierEnveloppe("06-repetition.sql", t06, ["begin", "rollback"]);   // un commit (ou end) ici appliquerait la migration
}

console.log(fichiersJs.length + " fichiers js/, " + vues.size + " noms relevés (" + ignorees + " hors donnees : stockage de l'appareil ou PAS_DES_CLES), "
  + LISTE.size + " clés dans public.v78_limite (" + MIGRATION + ", plafond prospect " + plafond02 + ")"
  + (sansApp.length ? " ; admises mais plus relevées dans js/ : " + sansApp.join(", ") : ""));
const uniques = Array.from(new Set(problemes));
uniques.forEach(x => console.log("  PROBLÈME " + x));
console.log(uniques.length ? uniques.length + " problème(s)"
  : "aucun problème : chaque clé de js/ est dans public.v78_limite, les copies de la liste et les empreintes concordent, 06 = 02 + 04 sans commit");
if (uniques.length) process.exitCode = 1;
