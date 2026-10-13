/* verif87 — v85 (bloc 4 de la mission du 13/10/2026) : les programmes de la formation, dans un vrai navigateur, Supabase simulé.
   A. attribution : chaque objectif × sexe (Perdre du gras, Prendre du muscle avec la séance 6 « Facultative », Me remettre en
      forme : la maison), un client (questionnaire complet) ; sans objectif ni sexe : la personne choisit (rien n'est écrit avant
      son choix ; son choix est rangé dans prefs.prog_formation, la langue gardée) ;
   B. « Changer de programme » et la phase du moment d'après la date de début (bornes 27 / 28 / 55 / 56 / 84 jours, date à venir,
      début = le jour du parcours sans choix rangé), onglets de phase ;
   C. chaque séance des 3 programmes s'ouvre, avec le bon nombre d'exercices (docs/maj-bloc-4/programmes-formation.json fait foi) ;
   D. supersets (2 lignes du même groupe dans un même cadre), dropsets, note, HIIT, HIIT à 3 options, cardio, circuit,
      échauffement commun replié ;
   E. le bouton vidéo est là si l'exercice a un lien (YouTube), absent sans lien ; il ouvre la vidéo (youtube-nocookie), une à la
      fois ; les noms de l'app (« Squat arrière » → « Squat barre »…) ;
   F. le programme d'un client fait par le coach est inchangé (et toujours en premier), les programmes de la formation en plus ;
      la carte « Ton programme » de l'accueil (prospect ; client sans programme du coach) ; l'éditeur du coach inchangé ;
   G. plus de badge « Bientôt » sur Programmes (parcours) ; plus aucun « Speed Formation » (écrans et fichiers servis) ;
      « Formation » et son sous-titre, en français et en anglais ;
   H. anglais (US) ; I. largeurs 360, 390 et 430 px (aucun débordement, zones de toucher de 44 px) ; W. moteur WebKit (Safari),
      si installé (banc GitHub ; VERIF87_WEBKIT=0 pour s'en passer en local — le nombre de ✓ change alors) ; Z. aucun autre hôte.
   Comptes fictifs (@exemple.fr). Aucun vrai compte, aucune écriture dans Supabase.
   Usage : node verif87.js ../index.html
           VERIF87_PORT=10031 node verif87.js ../index.html     (autre port, si 10030 est pris)
           VERIF87_BLOCS="A,C" node verif87.js …                 (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const FT = require("./fichiers");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF87_PORT || 10030;
const BLOCS = (process.env.VERIF87_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const MOBILE = { width: 390, height: 844 }, ETROIT = { width: 360, height: 740 }, GRAND = { width: 430, height: 932 };
const JSON_PF = JSON.parse(fs.readFileSync(path.join(path.dirname(HTML), "docs", "maj-bloc-4", "programmes-formation.json"), "utf8"));
const EXOS_APP = JSON.parse(fs.readFileSync(path.join(path.dirname(HTML), "donnees", "exercices.json"), "utf8"));
/* v87 (mission de nuit du 14/10, lot 2) : les noms sans équivalent dans l'app qui portent une vidéo de la chaîne AZEOO (titre vérifié
   par oEmbed : auteur « AZEOO ») — nom affiché → identifiant YouTube ; tout autre nom sans équivalent reste sans vidéo */
const AZEOO_V87 = { "Soulevé de terre jambes tendues": "Rtwy_BbAhgQ", "Hip thrust à l'haltère": "2KaDiDFL0HY", "Développé militaire avec haltères": "WuHq01Jnf8I",
  "Squat avec haltères": "0MOw1B2YysY", "Fentes avant": "LphXqrsgLUI", "Fentes latérales": "XOAzj8Vu-EU", "Peck deck": "OrkQU-f0mEY",
  "Triceps kickback avec haltères": "dgjl5H-TK3g", "High knees": "G4TXQzNMZEY", "High knees rapides": "G4TXQzNMZEY", "Fentes sautées": "-g1shAUmIws" };

/* la page servie : inscription ouverte et textes légaux de test (le parcours du bloc G s'affiche comme en ligne) */
const retouche = h => FT.forcerLegaux(FT.forcerInscription(h, true));
const server = http.createServer((req, res) => {
  if (FT.servirFichier(req, res, HTML, retouche)) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(retouche(fs.readFileSync(HTML, "utf8")));
});

/* ---------- résultats ---------- */
const res = [];
const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
function bilan(){
  const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length;
  console.log(res.join("\n")); console.log(nb + "/" + tot);
  if (nb < tot || tot === 0) process.exitCode = 1;
}
const ouverts = [];
async function bloc(nom, fn){
  if (BLOCS.length && !BLOCS.some(x => nom.startsWith(x))) return;
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); }
}

/* ---------- dates, petites aides ---------- */
const T0 = Date.now(), H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
/* le jour local d'il y a n jours (AAAA-MM-JJ), comme aujourdhui() de l'app (même fuseau que le navigateur) */
const jour = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const norm = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();

/* ---------- les personnes ---------- */
const session = (id, email) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + J, user: { id, email, role: "authenticated" } });
const PID = k => "00000000-0000-4000-8000-0000000087" + String(k).padStart(2, "0");   // verif87 : …87kk
const COACH = { id: F.IDS.coach, email: "coach@exemple.fr" };
const THOMAS = { id: F.IDS.c1, email: "thomas@exemple.fr" }, SARAH = { id: F.IDS.c2, email: "sarah@exemple.fr" };
const intakeV81 = (probleme, sexe, parcours, email) => ({ probleme, obstacle: "Le manque de temps", obstacle_choix: ["temps"], projection: "Avoir de l'énergie toute la journée", projection_choix: ["energie"],
  sexe, court_debut: parcours, court_le: parcours, parcours_le: parcours, email_compte: email });
/* les prospects : un par objectif × sexe (parcours v81), un sans réponse (ancien compte), un « Me remettre en forme » sans sexe */
const P = {
  GH: { id: PID(1), prenom: "Gaspard", email: "gaspard@exemple.fr", probleme: "Perdre du gras", sexe: "Homme" }, GF: { id: PID(2), prenom: "Gaëlle", email: "gaelle@exemple.fr", probleme: "Perdre du gras", sexe: "Femme" },
  MH: { id: PID(3), prenom: "Malo", email: "malo@exemple.fr", probleme: "Prendre du muscle", sexe: "Homme" }, MF: { id: PID(4), prenom: "Maya", email: "maya@exemple.fr", probleme: "Prendre du muscle", sexe: "Femme" },
  FH: { id: PID(5), prenom: "Fabien", email: "fabien@exemple.fr", probleme: "Me remettre en forme", sexe: "Homme" }, FF: { id: PID(6), prenom: "Flora", email: "flora@exemple.fr", probleme: "Me remettre en forme", sexe: "Femme" },
  SANS: { id: PID(7), prenom: "Sacha", email: "sacha@exemple.fr" }, FS: { id: PID(8), prenom: "Félix", email: "felix@exemple.fr", probleme: "Me remettre en forme" }
};
const LOU = { id: PID(9), prenom: "Lou", email: "lou@exemple.fr" }, RIC = { id: PID(10), prenom: "Ricardo", email: "ricardo@exemple.fr" };   // clients : Lou sans programme du coach (Prise de muscle, Homme) ; Ricardo (Recomposition)

function base(){
  const profils = clone(F.profils); profils.forEach(p => { if (p.role !== "coach") p.statut = "client"; });
  const donnees = clone(F.donnees);
  const d = (user_id, outil, contenu, quand) => donnees.push({ user_id, outil, contenu, maj_le: quand || avant(H) });
  for (const k of Object.keys(P)){
    const x = P[k];
    profils.push({ id: x.id, prenom: x.prenom, nom: "Exemple", role: "client", statut: "prospect", cree_le: avant(3 * J) });
    if (x.probleme) d(x.id, "intake", intakeV81(x.probleme, x.sexe, avant(2 * H), x.email));
  }
  profils.push({ id: LOU.id, prenom: "Lou", nom: "Exemple", role: "client", statut: "client", cree_le: avant(40 * J) });
  d(LOU.id, "intake", { nom: "Lou Exemple", complet: true, sexe: "Homme", age: 30, objectif: "Prise de muscle" });
  profils.push({ id: RIC.id, prenom: "Ricardo", nom: "Exemple", role: "client", statut: "client", cree_le: avant(40 * J) });
  d(RIC.id, "intake", { nom: "Ricardo Exemple", complet: true, sexe: "Homme", age: 41, objectif: "Recomposition (perdre du gras + prendre du muscle)" });
  return { profils, donnees, ecritures: [], lectures: [], chemins: [], emails: {}, meta: {} };
}
const prefsDe = (db, uid) => { const l = db.donnees.find(x => x.user_id === uid && x.outil === "prefs"); return l ? l.contenu : null; };
const poserPrefs = (db, uid, c) => { const i = db.donnees.findIndex(x => x.user_id === uid && x.outil === "prefs"); const l = { user_id: uid, outil: "prefs", contenu: c, maj_le: avant(5 * J) }; if (i > -1) db.donnees[i] = l; else db.donnees.push(l); };
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.table === "donnees" && e.outil === outil && !e.refus && (!uid || e.user_id === uid));
const ecrituresDonnees = db => db.ecritures.filter(e => e.table === "donnees" && !e.refus);

/* ---------- le faux Supabase (gabarit de verif86) ---------- */
const MAX_LIGNES = 1000;
const ILLISIBLES_PROPRIO = ["notes_coach", "suivi_prospect"];
const INTERDITES_PROPRIO = ["feedbacks", "notes_coach", "suivi_prospect"];
const ECRITES_PAR_COACH = ["programme", "repas", "calc", "complements", "hist_programme", "hist_repas", "feedbacks", "notes_coach", "suivi_prospect"];
const permis = (moi, coach, row) => !!moi && (row.user_id === moi ? (coach || !INTERDITES_PROPRIO.includes(row.outil)) : (coach && ECRITES_PAR_COACH.includes(row.outil)));
const externes = new Set();
function ordonner(l, order){
  const cles = String(order || "").split(",").filter(Boolean).map(x => { const [k, sens] = x.split("."); return { k, desc: sens === "desc" }; });
  if (!cles.length) return l;
  const v = (x, k) => (x && typeof x === "object" && x[k] != null) ? String(x[k]) : "";
  return l.slice().sort((a, b) => { for (const { k, desc } of cles) { const x = v(a, k), y = v(b, k); if (x !== y) return (x < y ? -1 : 1) * (desc ? -1 : 1); } return 0; });
}
const liste = t => String(t).replace(/^\(|\)$/g, "").split(",").map(x => x.trim().replace(/^"|"$/g, ""));
function parOutil(l, o){
  if (o.startsWith("eq.")) return l.filter(x => x.outil === o.slice(3));
  if (o.startsWith("in.")) { const k = liste(o.slice(3)); return l.filter(x => k.includes(x.outil)); }
  if (o.startsWith("not.in.")) { const k = liste(o.slice(7)); return l.filter(x => !k.includes(x.outil)); }
  return l;
}
const colonnes = (l, q) => { const sel = (q.get("select") || "*").split(","); return sel.includes("*") ? l : l.map(x => Object.fromEntries(sel.map(k => [k, x[k]]))); };
const appelant = req => { const m = /^Bearer (?:jeton-)([0-9a-f-]{36})/.exec(req.headers()["authorization"] || ""); return m ? m[1] : null; };
async function repondre(r, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue();
  if (host === "www.youtube-nocookie.com") { db.videos = (db.videos || []).concat([u]); return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" }); }   // le lecteur d'une démonstration (comme verif56)
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort(); }
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req);
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  db.chemins.push(m + " " + p);
  if (p.startsWith("/auth/v1/token")) { const c = corps() || {}, r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || "")); return r1 ? json(session(r1[1], db.emails[r1[1]] || "")) : json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400); }
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  if (p.startsWith("/auth/v1/logout")) return json(null, 204);
  if (p.startsWith("/auth/v1/user")) return moi ? json({ id: moi, email: db.emails[moi] || "", role: "authenticated" }) : json({ msg: "invalid JWT" }, 401);
  if (p.startsWith("/auth/v1/")) return json({});
  if (!["GET", "HEAD"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m, corps: corps() });
  if (p.startsWith("/functions/v1/")) return json({ ok: true });
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/connexions") return json([]);
  if (p === "/rest/v1/profils") {
    const id = (q.get("id") || "").replace(/^eq\./, "");
    if (m === "GET" || m === "HEAD") { let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(colonnes(plage(l), q)); }
    db.ecritures.push({ table: "profils", m, id, corps: corps() });
    return json([]);
  }
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "", mj = q.get("maj_le");
    const cleEq = o.startsWith("eq.") ? o.slice(3) : null;
    if (m === "GET" || m === "HEAD") {
      db.lectures.push({ par: moi, uid, outil: o });
      let l = db.donnees.filter(x => coach || (x.user_id === moi && !ILLISIBLES_PROPRIO.includes(x.outil)));
      if (uid) l = l.filter(x => x.user_id === uid);
      return json(colonnes(plage(parOutil(l, o)), q));
    }
    if (m === "POST") {
      let rows = corps(); rows = Array.isArray(rows) ? rows : rows ? [rows] : [];
      const refuse = rows.find(row => !permis(moi, coach, row));
      if (refuse) { db.ecritures.push({ table: "donnees", m, refus: true, outil: refuse.outil, user_id: refuse.user_id }); return json({ code: "42501", message: 'new row violates row-level security policy for table "donnees"' }, 403); }
      const upsert = q.has("on_conflict"), out = [];
      for (const row of rows) {
        const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
        if (i > -1 && !upsert) return json({ code: "23505", message: "duplicate key value violates unique constraint" }, 409);
        const ligne = { user_id: row.user_id, outil: row.outil, contenu: clone(row.contenu), maj_le: row.maj_le || new Date().toISOString() };
        if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        db.ecritures.push(Object.assign({ table: "donnees", m, upsert }, clone(ligne)));
        out.push(ligne);
      }
      return (req.headers()["prefer"] || "").includes("return=representation") ? json(out, 201) : json(null, 201);
    }
    if (m === "PATCH") {
      const c = corps() || {};
      const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj == null || (mj === "is.null" ? !x.maj_le : (mj.startsWith("eq.") && x.maj_le === mj.slice(3)))));
      if (!row || !permis(moi, coach, row)) return json([]);
      Object.assign(row, { contenu: clone(c.contenu), maj_le: c.maj_le || new Date().toISOString() });
      db.ecritures.push(Object.assign({ table: "donnees", m }, clone(row)));
      return json([row]);
    }
    db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq });
    return json(null, 204);
  }
  if (p === "/rest/v1/bibliotheque") return m === "GET" ? json(coach ? colonnes(plage(clone(F.bibliotheque)), q) : []) : json(null, 204);
  const t = p.replace("/rest/v1/", "");
  if (F.catalogue[t]) return m === "GET" ? json(colonnes(plage(F.catalogue[t]), q)) : json(null, 201);
  return json([]);
}

/* ---------- un navigateur : opts.qui (le compte connecté, le coach par défaut), viewport, langue ---------- */
async function contexte(b, db, opts){
  opts = opts || {};
  const qui = opts.qui || COACH;
  const c = await b.newContext({ viewport: opts.viewport || MOBILE });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, db));
  db.emails[qui.id] = qui.email || (qui.prenom || "x").toLowerCase() + "@exemple.fr";
  await c.addInitScript(({ langue, s }) => {
    if (!/^https?:$/.test(location.protocol)) return;
    if (!localStorage.getItem("__init")) {
      localStorage.setItem("__init", "1");
      if (s){ localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); }   // neuf : aucune trace, le parcours s'ouvre
      if (langue) localStorage.setItem("mhx_langue", langue);
      if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
    }
  }, { langue: opts.langue || "", s: opts.neuf ? null : session(qui.id, db.emails[qui.id]) });
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return { c, page };
}
const URL0 = "http://localhost:" + PORT + "/";
const attendre = (page, ms) => page.waitForTimeout(ms);
const pret = async page => { await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 }); await attendre(page, 300); };
const aller = async (page, h) => { await page.evaluate(x => { location.hash = x; }, h); await pret(page); };
/* une page du programme dessinée (ou l'écran de choix, ou une séance) */
const surPf = async (page, sel) => { await page.waitForSelector(sel || "#pf-tete, #pf-choisir, #pf-seance", { timeout: 8000 }); await attendre(page, 200); };
/* l'écran d'avant perd ses repères avant le changement d'adresse : on attend toujours l'écran neuf */
const ouvrirPf = async (page, h, sel) => { await page.evaluate(() => document.querySelectorAll("#pf-tete, #pf-choisir, #pf-seance").forEach(e => e.removeAttribute("id"))); await aller(page, h); await surPf(page, sel); };
const txt = (page, sel) => page.$eval(sel, e => e.textContent).then(norm).catch(() => null);
const txts = (page, sel) => page.$$eval(sel, l => l.map(e => e.textContent)).then(l => l.map(norm)).catch(() => []);
const deborde = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
const petits = page => page.evaluate(() => Array.from(document.querySelectorAll(".pf a, .pf button, .pf summary"))
  .filter(e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; })
  .filter(e => e.getBoundingClientRect().height < 43.5).map(e => (e.id || e.className || e.tagName) + " " + Math.round(e.getBoundingClientRect().height) + "px « " + e.textContent.trim().slice(0, 24) + " »"));
/* ce que montre la page du programme */
const lirePage = page => page.evaluate(() => ({ nom: (document.getElementById("pf-nom") || {}).textContent || "",
  semaine: (document.getElementById("pf-semaine") || {}).textContent || "",
  onglets: Array.from(document.querySelectorAll("[data-pf-phase]")).map(b => b.getAttribute("aria-label") + (b.getAttribute("aria-selected") === "true" ? "*" : "")),
  visible: Array.from(document.querySelectorAll(".pf-phase")).filter(x => !x.hidden).map(x => x.id),
  seances: Array.from(document.querySelectorAll(".pf-phase:not([hidden]) .pf-seance-l")).map(a => ({ nom: a.querySelector("b").textContent, fac: !!a.querySelector(".pf-fac"), href: a.getAttribute("href") })),
  facs: document.querySelectorAll(".pf-fac").length, methode: Array.from(document.querySelectorAll("#pf-methode li")).map(x => x.textContent),
  changer: (document.getElementById("pf-changer") || {}).getAttribute ? document.getElementById("pf-changer").getAttribute("href") : null,
  combien: !!document.querySelector("details#pf-combien") && !document.querySelector("details#pf-combien").open }));
/* les exercices attendus d'une séance (le JSON fait foi) */
const nbAttendu = sc => sc.options ? sc.options.map(o => o.exercices.length) : (sc.exercices || []).length;

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF87_PORT=10031 node verif87.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. attribution =================== */
  await bloc("A. attribution", async () => {
    const db = base();
    const vu = {};
    for (const k of ["GH", "GF", "MH", "MF", "FH", "FF", "FS"]){
      const { c, page } = await contexte(b, db, { qui: P[k] });
      await page.goto(URL0 + "#/programme"); await pret(page); await surPf(page);
      vu[k] = await lirePage(page);
      await c.close(); ouverts.pop();
    }
    const H = "Programme salle 12 semaines · Homme", Fe = "Programme salle 12 semaines · Femme", M = "Full body à la maison";
    ok("A1 : « Perdre du gras » : homme → « Programme salle 12 semaines · Homme », femme → « … · Femme », toutes les séances (aucune « Facultative ») ; 3 onglets Semaines 1-4 (choisi), 5-8, 9-12 ; 6 séances",
      vu.GH.nom === H && vu.GF.nom === Fe && vu.GH.facs === 0 && vu.GF.facs === 0 && JSON.stringify(vu.GH.onglets) === '["Semaines 1-4*","Semaines 5-8","Semaines 9-12"]' && vu.GH.seances.length === 6 && vu.GF.seances.length === 6, JSON.stringify({ GH: vu.GH, GF: vu.GF }));
    ok("A2 : « Prendre du muscle » : homme → salle homme, femme → salle femme ; la séance 6 (et elle seule) marquée « Facultative », dans chacune des 3 phases",
      vu.MH.nom === H && vu.MF.nom === Fe && vu.MH.facs === 3 && vu.MF.facs === 3 && vu.MH.seances.filter(s => s.fac).map(s => s.nom).join() === "Séance 6 — HIIT cardio" && vu.MF.seances.filter(s => s.fac).map(s => s.nom).join() === "Séance 6 — Cardio", JSON.stringify({ MH: vu.MH, MF: vu.MF }));
    ok("A3 : « Me remettre en forme » : homme, femme (et sans sexe connu) → « Full body à la maison » : la méthode en 3 phrases en haut, pas d'onglets, 4 séances (dont la bonus)",
      [vu.FH, vu.FF, vu.FS].every(v => v.nom === M && v.methode.length === 3 && !v.onglets.length && v.seances.length === 4 && v.facs === 0) && vu.FH.methode[0] === JSON_PF.programmes[2].methode[0], JSON.stringify({ FH: vu.FH, FS: vu.FS }));
    ok("A4 : afficher son programme n'écrit rien (aucune écriture pour ces 7 prospects)", ecrituresDonnees(db).length === 0, JSON.stringify(ecrituresDonnees(db)));
    /* sans objectif ni sexe (ancien compte) : la personne choisit */
    poserPrefs(db, P.SANS.id, { langue: "fr" });
    const { page } = await contexte(b, db, { qui: P.SANS });
    await page.goto(URL0 + "#/programme"); await pret(page); await surPf(page, "#pf-choisir");
    const ch = await page.evaluate(() => ({ titre: document.querySelector("#pf-choisir h2").textContent, choix: Array.from(document.querySelectorAll(".pf-choix-l")).map(l => l.querySelector("b").textContent + " | " + l.querySelector("small").textContent),
      boutons: document.querySelectorAll("[data-pf-choisir]").length, actuel: document.querySelectorAll(".pf-choix-l.actuel").length, verrou: !!document.querySelector(".ech-appel .verrou") }));
    const avantChoix = ecrituresDonnees(db).length;
    ok("A5 : sans objectif ni sexe (ancien compte) : « Choisis ton programme » avec les 3 programmes (salle homme, salle femme, maison) et « Choisir », aucun « actuel » ; rien n'est écrit avant le choix",
      ch.titre === "Choisis ton programme" && JSON.stringify(ch.choix) === JSON.stringify(["Programme salle 12 semaines · Homme | À la salle · Homme", "Programme salle 12 semaines · Femme | À la salle · Femme", "Full body à la maison | À la maison · Homme ou femme"]) && ch.boutons === 3 && ch.actuel === 0 && avantChoix === 0, JSON.stringify(ch));
    await page.click('[data-pf-choisir="maison"]'); await surPf(page, "#pf-tete"); await attendre(page, 400);
    const apres = await lirePage(page), w = ecr(db, "prefs", P.SANS.id), pr = prefsDe(db, P.SANS.id) || {};
    ok("A6 : son choix est rangé dans prefs (une écriture) : { langue gardée, prog_formation: { id: \"maison\", debut: aujourd'hui } } ; la page montre son programme",
      apres.nom === "Full body à la maison" && w.length === 1 && pr.langue === "fr" && JSON.stringify(pr.prog_formation) === JSON.stringify({ id: "maison", debut: jour(0) }) && ecrituresDonnees(db).length === 1, JSON.stringify({ apres, w, pr }));
    /* un client : son objectif du questionnaire complet (« Prise de muscle », homme) ; « Recomposition » : il choisit */
    const x = await contexte(b, db, { qui: LOU });
    await x.page.goto(URL0 + "#/programme/formation"); await pret(x.page); await surPf(x.page);
    const lou = await lirePage(x.page);
    await ouvrirPf(x.page, "#/accueil", "#pf-carte").catch(() => {});
    const y = await contexte(b, db, { qui: RIC });
    await y.page.goto(URL0 + "#/programme/formation"); await pret(y.page); await surPf(y.page);
    const ric = !!(await y.page.$("#pf-choisir"));
    ok("A7 : un client (questionnaire complet « Prise de muscle », homme) : salle homme, séance 6 « Facultative » ; un objectif sans programme attribué (« Recomposition ») : il choisit",
      lou.nom === "Programme salle 12 semaines · Homme" && lou.facs === 3 && ric, JSON.stringify({ lou, ric }));
  });

  /* =================== B. changer de programme, phase du moment =================== */
  await bloc("B. changer, phase", async () => {
    const db = base();
    const cas = [[27, 0, "Semaine 4 sur 12"], [28, 1, "Semaine 5 sur 12"], [55, 1, "Semaine 8 sur 12"], [56, 2, "Semaine 9 sur 12"], [83, 2, "Semaine 12 sur 12"], [84, 2, "Tes 12 semaines sont faites : recommence ou change de programme."], [-3, 0, ""]];
    const vus = [];
    const { page } = await contexte(b, db, { qui: P.GF });
    for (const [n, ph, s] of cas){
      poserPrefs(db, P.GF.id, { langue: "fr", prog_formation: { id: "salle-homme", debut: jour(n) } });
      await page.goto(URL0 + "#/accueil"); await page.reload(); await pret(page);
      await ouvrirPf(page, "#/programme", "#pf-tete");
      const v = await lirePage(page);
      vus.push({ n, attendu: [ph, s], nom: v.nom, onglets: v.onglets, visible: v.visible, semaine: norm(v.semaine) });
    }
    const bon = vus.every(v => v.nom === "Programme salle 12 semaines · Homme" && v.onglets[v.attendu[0]].endsWith("*") && v.onglets.filter(o => o.endsWith("*")).length === 1 && JSON.stringify(v.visible) === JSON.stringify(["pf-ph-" + v.attendu[0]]) && v.semaine === v.attendu[1]);
    ok("B1 : le programme choisi (rangé) l'emporte sur l'attribution ; la phase du moment d'après la date de début : 27 j → Semaines 1-4 (semaine 4), 28 j → 5-8, 55 j → 5-8, 56 j → 9-12, 83 j → 9-12 (semaine 12), 84 j → 9-12 (« Tes 12 semaines sont faites »), date à venir → 1-4",
      bon, JSON.stringify(vus));
    /* sans choix rangé : le début = le jour du parcours (intake.parcours_le) */
    db.donnees = db.donnees.filter(x => !(x.user_id === P.MH.id && x.outil === "intake")); db.donnees.push({ user_id: P.MH.id, outil: "intake", contenu: intakeV81("Prendre du muscle", "Homme", avant(40 * J), P.MH.email), maj_le: avant(40 * J) });
    const x = await contexte(b, db, { qui: P.MH });
    await x.page.goto(URL0 + "#/programme"); await pret(x.page); await surPf(x.page);
    const v2 = await lirePage(x.page);
    ok("B2 : sans programme choisi, le début est le jour du parcours (il y a 40 j : Semaines 5-8 ouvert, « Semaine 6 sur 12 »)", v2.onglets[1] === "Semaines 5-8*" && norm(v2.semaine) === "Semaine 6 sur 12", JSON.stringify(v2));
    await x.page.click('[data-pf-phase="2"]'); await attendre(x.page, 200);
    const v3 = await lirePage(x.page);
    ok("B3 : la personne peut ouvrir une autre phase (Semaines 9-12 : ses 6 séances, la 6e « Facultative »)", v3.onglets[2] === "Semaines 9-12*" && JSON.stringify(v3.visible) === '["pf-ph-2"]' && v3.seances.length === 6 && v3.seances[5].fac && v3.seances[0].href === "#/programme/seance/salle-homme/2/0", JSON.stringify(v3));
    /* « Changer de programme » */
    poserPrefs(db, P.GF.id, { langue: "fr", autre: "garde", prog_formation: { id: "salle-homme", debut: jour(35) } });
    const ecr0 = ecrituresDonnees(db).length;
    await page.goto(URL0 + "#/accueil"); await pret(page);
    await ouvrirPf(page, "#/programme", "#pf-tete");
    await page.click("#pf-changer"); await surPf(page, "#pf-choisir");
    const ch = await page.evaluate(() => ({ hash: location.hash, actuel: Array.from(document.querySelectorAll(".pf-choix-l.actuel b")).map(x => x.textContent), pastille: (document.querySelector(".pf-choix-l.actuel .pastille") || {}).textContent, retour: !!document.getElementById("pf-retour") }));
    await page.click('[data-pf-choisir="salle-femme"]'); await surPf(page, "#pf-tete"); await attendre(page, 400);
    const v4 = await lirePage(page), pr = prefsDe(db, P.GF.id) || {}, w = ecrituresDonnees(db).slice(ecr0);
    ok("B4 : « Changer de programme » (#/programme/choisir) : l'actuel est marqué « Programme actuel » ; un autre choix → rangé dans prefs (les autres champs gardés), le nouveau programme recommence à la semaine 1 (Semaines 1-4)",
      ch.hash === "#/programme/choisir" && JSON.stringify(ch.actuel) === '["Programme salle 12 semaines · Homme"]' && ch.pastille === "Programme actuel" && ch.retour
        && v4.nom === "Programme salle 12 semaines · Femme" && v4.onglets[0] === "Semaines 1-4*" && norm(v4.semaine) === "Semaine 1 sur 12"
        && w.length === 1 && w[0].outil === "prefs" && pr.langue === "fr" && pr.autre === "garde" && JSON.stringify(pr.prog_formation) === JSON.stringify({ id: "salle-femme", debut: jour(0) }), JSON.stringify({ ch, v4, pr, w }));
    /* changer de langue garde le programme choisi (prefs lue puis fusionnée) */
    await page.click("#langue");
    for (let i = 0; i < 40 && (prefsDe(db, P.GF.id) || {}).langue !== "en"; i++) await attendre(page, 150);
    await attendre(page, 800);
    const pr2 = prefsDe(db, P.GF.id) || {};
    ok("B5 : changer de langue garde le programme choisi (prefs : { langue: \"en\", prog_formation gardé })", pr2.langue === "en" && pr2.prog_formation && pr2.prog_formation.id === "salle-femme" && pr2.autre === "garde", JSON.stringify(pr2));
  });

  /* =================== C. chaque séance s'ouvre, avec le bon nombre d'exercices =================== */
  await bloc("C. séances", async () => {
    const db = base();
    const { page } = await contexte(b, db, { qui: P.GH });
    await page.goto(URL0 + "#/accueil"); await pret(page);
    for (const p of JSON_PF.programmes){
      const ecarts = []; let n = 0;
      for (let ph = 0; ph < p.phases.length; ph++) for (let si = 0; si < p.phases[ph].seances.length; si++){
        const sc = p.phases[ph].seances[si];
        await ouvrirPf(page, "#/programme/seance/" + p.id + "/" + ph + "/" + si, "#pf-seance");
        const v = await page.evaluate(() => ({ nom: document.getElementById("pf-seance-nom").textContent, type: document.getElementById("pf-seance").dataset.type,
          options: Array.from(document.querySelectorAll(".pf-option")).map(o => o.querySelectorAll(".pf-exo").length), exos: document.querySelectorAll("#pf-seance .pf-exo").length }));
        const att = nbAttendu(sc), vu = sc.options ? v.options : v.exos;
        if (v.nom !== sc.nom || v.type !== sc.type || JSON.stringify(vu) !== JSON.stringify(att)) ecarts.push(p.id + " " + ph + "/" + si + " : " + JSON.stringify({ v, att }));
        n++;
      }
      ok("C : « " + p.nom + " » : ses " + n + " séances s'ouvrent, chacune avec son nom, son type et le bon nombre d'exercices (options comprises)", !ecarts.length && n === p.phases.reduce((s, f) => s + f.seances.length, 0), ecarts.join(" | ").slice(0, 600));
    }
    ok("C4 : ouvrir les séances n'écrit rien", ecrituresDonnees(db).length === 0, JSON.stringify(ecrituresDonnees(db)));
  });

  /* =================== D. supersets, dropsets, HIIT, options, cardio, circuit, échauffement =================== */
  await bloc("D. séances en détail", async () => {
    const db = base();
    const { page } = await contexte(b, db, { qui: P.GF });
    await page.goto(URL0 + "#/accueil"); await pret(page);
    await ouvrirPf(page, "#/programme/seance/salle-femme/1/1", "#pf-seance");
    const s = await page.evaluate(() => ({ groupes: Array.from(document.querySelectorAll(".pf-superset")).map(g => Array.from(g.querySelectorAll(".pf-exo-nom")).map(x => x.textContent)),
      pastilles: Array.from(document.querySelectorAll(".pf-tech")).map(x => x.textContent), seules: Array.from(document.querySelectorAll("#pf-seance > .pf-exos > .pf-exo .pf-exo-nom")).map(x => x.textContent),
      chiffres: Array.from(document.querySelectorAll(".pf-superset .pf-chiffres span")).slice(0, 2).map(x => x.textContent).join(" | ") }));
    ok("D1 : supersets : 2 lignes du même groupe dans un même cadre (« Développé couché » + « Pompes », « Tirage vertical » + « Tirage horizontal », « Développé militaire » + « Élévations latérales »), pastille « Superset » sur chacune ; les autres seules ; séries × reps et repos",
      JSON.stringify(s.groupes) === JSON.stringify([["Développé couché", "Pompes"], ["Tirage vertical", "Tirage horizontal"], ["Développé militaire", "Élévations latérales"]]) && s.pastilles.length === 6 && s.pastilles.every(x => x === "Superset")
        && JSON.stringify(s.seules) === JSON.stringify(["Dips", "Curl barre EZ", "Extension triceps poulie"]) && norm(s.chiffres) === "4 × 12 | Repos 90-120 s", JSON.stringify(s));
    await ouvrirPf(page, "#/programme/seance/salle-femme/2/0", "#pf-seance");
    const d = await page.evaluate(() => Array.from(document.querySelectorAll(".pf-exo")).map(e => ({ nom: e.querySelector(".pf-exo-nom").textContent, tech: (e.querySelector(".pf-tech") || {}).textContent || "", note: (e.querySelector(".pf-note") || {}).textContent || "" })));
    ok("D2 : dropset : pastille « Dropset » et sa note (« Dropset sur la dernière série ») sur le squat ; les supersets de la séance aussi",
      d[0].nom === "Squat barre" && d[0].tech === "Dropset" && d[0].note === "Dropset sur la dernière série" && d.filter(x => x.tech === "Superset").length === 4, JSON.stringify(d));
    await ouvrirPf(page, "#/programme/seance/salle-homme/0/5", "#pf-seance");
    const h = await page.evaluate(() => ({ consigne: (document.getElementById("pf-consigne") || {}).textContent, l: Array.from(document.querySelectorAll(".pf-exo")).map(e => e.querySelector(".pf-exo-nom").textContent + " | " + (e.querySelector(".pf-chiffres") || {}).textContent) }));
    ok("D3 : HIIT : la consigne (« Circuit à répéter 4 à 5 fois selon le niveau. ») puis la liste avec le temps de travail et de repos",
      h.consigne === "Circuit à répéter 4 à 5 fois selon le niveau." && h.l.length === 5 && h.l.every(x => / \| 30 s travail \/ 30 s repos$/.test(norm(x))), JSON.stringify(h));
    await ouvrirPf(page, "#/programme/seance/salle-femme/0/3", "#pf-seance");
    const o1 = await page.evaluate(() => ({ consigne: (document.getElementById("pf-consigne") || {}).textContent, onglets: Array.from(document.querySelectorAll("[data-pf-option]")).map(b => b.textContent + (b.getAttribute("aria-selected") === "true" ? "*" : "")),
      vis: Array.from(document.querySelectorAll(".pf-option")).filter(x => !x.hidden).map(x => x.id), exos: Array.from(document.querySelectorAll(".pf-option:not([hidden]) .pf-exo-nom")).map(x => x.textContent), ech: (document.querySelector(".pf-option:not([hidden]) > .note") || {}).textContent }));
    await page.click('[data-pf-option="1"]'); await attendre(page, 200);
    const o2 = await page.evaluate(() => ({ vis: Array.from(document.querySelectorAll(".pf-option")).filter(x => !x.hidden).map(x => x.id), exos: Array.from(document.querySelectorAll(".pf-option:not([hidden]) .pf-exo-nom")).map(x => x.textContent), sel: Array.from(document.querySelectorAll("[data-pf-option]")).map(b => b.getAttribute("aria-selected")) }));
    ok("D4 : HIIT à options : la consigne, puis 3 onglets Option 1 (ouvert), Option 2, Option 3 ; chacun son échauffement et ses 4 exercices ; Option 2 au toucher",
      /^30 s travail \/ 30 s repos — 3 tours/.test(o1.consigne) && JSON.stringify(o1.onglets) === '["Option 1*","Option 2","Option 3"]' && JSON.stringify(o1.vis) === '["pf-op-0"]' && o1.exos.length === 4 && o1.ech === "5 min : Jumping jacks, Mountain climbers"
        && JSON.stringify(o2.vis) === '["pf-op-1"]' && o2.exos.length === 4 && o2.exos[0] === "Jumping jacks" && JSON.stringify(o2.sel) === '["false","true","false"]', JSON.stringify({ o1, o2 }));
    await ouvrirPf(page, "#/programme/seance/salle-femme/0/5", "#pf-seance");
    const c = await page.evaluate(() => ({ consigne: (document.getElementById("pf-consigne") || {}).textContent, exos: document.querySelectorAll("#pf-seance .pf-exo").length, type: document.getElementById("pf-seance").dataset.type }));
    ok("D5 : cardio : la consigne seule (« 30 min à intensité moyenne … »), aucun exercice", c.type === "cardio" && c.consigne === "30 min à intensité moyenne (marche rapide en pente, vélo elliptique…)." && c.exos === 0, JSON.stringify(c));
    await ouvrirPf(page, "#/programme/seance/maison/0/3", "#pf-seance");
    const ci = await page.evaluate(() => ({ consigne: (document.getElementById("pf-consigne") || {}).textContent, exos: Array.from(document.querySelectorAll(".pf-exo-nom")).map(x => x.textContent),
      ech: (() => { const e = document.getElementById("pf-echauffement"); return e ? { ouvert: e.open, tag: e.tagName, li: e.querySelectorAll("li").length, h4: Array.from(e.querySelectorAll("h4")).map(x => x.textContent), duree: e.querySelector("summary .note").textContent } : null; })() }));
    ok("D6 : circuit (séance bonus de la maison) : la consigne puis les 5 exercices ; l'échauffement commun, replié, en haut (5 min de cardio + 5 min d'ostéo-articulaire ; Cardio, Haut du corps, Bas du corps : 19 mouvements)",
      /^4 à 8 tours\./.test(ci.consigne) && ci.exos.length === 5 && ci.ech && ci.ech.tag === "DETAILS" && !ci.ech.ouvert && ci.ech.li === 19 && JSON.stringify(ci.ech.h4) === '["Cardio","Haut du corps","Bas du corps"]' && ci.ech.duree === JSON_PF.echauffement.duree, JSON.stringify(ci));
  });

  /* =================== E. vidéos et noms de l'app =================== */
  await bloc("E. vidéos", async () => {
    const db = base();
    const { page } = await contexte(b, db, { qui: P.GH });
    await page.goto(URL0 + "#/accueil"); await pret(page);
    /* la donnée de l'app (PF_DONNEES) : chaque exercice relié a l'id d'un exercice de donnees/exercices.json et son nom ; un nom sans
       équivalent garde le nom du PDF */
    const relies = await page.evaluate(() => { const out = []; PF_DONNEES.programmes.forEach(p => p.phases.forEach(f => f.seances.forEach(sc => (sc.exercices || []).concat(...(sc.options || []).map(o => o.exercices)).forEach(x => out.push(x))))); return out; });
    const ids = new Set(EXOS_APP.map(e => e.id)), noms = Object.fromEntries(EXOS_APP.map(e => [e.id, e.nom]));
    const faux = relies.filter(x => x.ex && (!ids.has(x.ex) || noms[x.ex] !== x.nom));
    /* v87 : un nom sans équivalent n'a une vidéo que s'il est dans AZEOO_V87, avec exactement cet identifiant ; chaque nom de la liste est présent */
    const sansId = relies.filter(x => !x.ex), azeooFaux = sansId.filter(x => x.yt && AZEOO_V87[x.nom] !== x.yt).concat(Object.keys(AZEOO_V87).filter(n => !sansId.some(x => x.nom === n && x.yt === AZEOO_V87[n])));
    ok("E1 : chaque exercice relié l'est à un exercice de l'app (id de donnees/exercices.json) et s'affiche sous son nom ; 234 lignes, dont des noms sans équivalent sûr (sans id), sans vidéo sauf les 11 noms à vidéo AZEOO de la v87 (identifiant exact)",
      relies.length === 234 && !faux.length && sansId.length > 0 && !azeooFaux.length && sansId.some(x => !x.yt), JSON.stringify(faux).slice(0, 400) + " " + JSON.stringify(azeooFaux).slice(0, 400));
    await ouvrirPf(page, "#/programme/seance/salle-homme/2/0", "#pf-seance");
    const v = await page.evaluate(() => Array.from(document.querySelectorAll(".pf-exo")).map(e => ({ nom: e.querySelector(".pf-exo-nom").textContent, ex: e.dataset.ex || "", yt: (e.querySelector("[data-yt]") || {}).dataset ? (e.querySelector("[data-yt]") || { dataset: {} }).dataset.yt || "" : "" })));
    const att = JSON_PF.programmes[0].phases[2].seances[0].exercices.map(x => x.nom);
    ok("E2 : les noms de l'app : « Squat arrière » → « Squat barre », « Presse à cuisses », « Fentes statiques haltères » (sans équivalent : nom du PDF), « Leg extensions » → « Leg extension », « Mollets debout »",
      JSON.stringify(v.map(x => x.nom)) === JSON.stringify(["Squat barre", "Presse à cuisses", "Fentes statiques haltères", "Leg extension", "Mollets debout"]) && att[0] === "Squat arrière", JSON.stringify(v));
    ok("E3 : le bouton vidéo est là quand l'exercice a un lien (YouTube, 11 caractères), absent sans lien (« Fentes statiques haltères »)",
      v.filter(x => x.ex).every(x => /^[A-Za-z0-9_-]{11}$/.test(x.yt)) && v.find(x => x.nom === "Fentes statiques haltères").yt === "" && v.filter(x => x.yt).length === 4, JSON.stringify(v));
    /* les fusions de la mission */
    await ouvrirPf(page, "#/programme/seance/salle-femme/0/2", "#pf-seance");
    const bulg = await txt(page, ".pf-exo-nom");
    await ouvrirPf(page, "#/programme/seance/salle-homme/2/2", "#pf-seance");
    const bulg2 = (await txts(page, ".pf-exo-nom"))[2];
    await ouvrirPf(page, "#/programme/seance/salle-homme/0/3", "#pf-seance");
    const planche = (await txts(page, ".pf-exo-nom"))[4];
    await ouvrirPf(page, "#/programme/seance/salle-femme/2/4", "#pf-seance");
    const planche2 = (await txts(page, ".pf-exo-nom"))[7];
    /* sans équivalent dans l'app, un seul nom aussi : « Jump squats » = « Squats sautés », « Pompes avec clap » = « Pompes avec claquement » */
    await ouvrirPf(page, "#/programme/seance/salle-femme/1/0", "#pf-seance");
    const jump = (await txts(page, ".pf-exo-nom"))[2];
    await ouvrirPf(page, "#/programme/seance/salle-femme/1/3", "#pf-seance");
    await page.click('[data-pf-option="1"]'); await attendre(page, 200);
    const clap = await txt(page, ".pf-option:not([hidden]) .pf-exo-nom");
    ok("E4 : un seul nom par exercice : « Squat bulgare » et « Fentes bulgares » → « Fentes bulgares » ; « Planche statique » et « Planche abdominale » → « Planche » ; sans équivalent dans l'app : « Jump squats » → « Squats sautés », « Pompes avec clap » → « Pompes avec claquement »",
      bulg === "Fentes bulgares" && bulg2 === "Fentes bulgares" && planche === "Planche" && planche2 === "Planche" && jump === "Squats sautés" && clap === "Pompes avec claquement", JSON.stringify([bulg, bulg2, planche, planche2, jump, clap]));
    /* v87 (mission de nuit du 14/10, lot 2) : « Burpees » du PDF (classique, avec saut) n'est plus « Burpees contrôlés » (sans saut) ; « Tractions
       assistées » et « Curl barre EZ » (avec « Curl biceps barre EZ ») ne sont plus reliés : nom du PDF, sans id ni vidéo */
    const delies = n => relies.filter(x => x.nom === n);
    ok("E6 : « Burpees » (10 lignes, HIIT, circuits, full body), « Tractions assistées » (4) et « Curl barre EZ » (4) : nom du PDF, sans id ni vidéo ; plus aucun « Burpees contrôlés » ni « Tractions » ni « Curl barre » dans les programmes",
      delies("Burpees").length === 10 && delies("Tractions assistées").length === 4 && delies("Curl barre EZ").length === 4 && ["Burpees", "Tractions assistées", "Curl barre EZ"].every(n => delies(n).every(x => !x.ex && !x.yt))
        && !relies.some(x => ["burpees-controles", "tractions", "curl-barre"].includes(x.ex)), JSON.stringify(["Burpees", "Tractions assistées", "Curl barre EZ"].map(n => [n, delies(n).length])));
    await ouvrirPf(page, "#/programme/seance/salle-homme/0/0", "#pf-seance");
    const b1 = await page.$$("[data-yt]");
    await b1[0].click(); await attendre(page, 300);
    const f1 = await page.evaluate(() => ({ src: (document.querySelector(".video-cadre iframe") || {}).src || "", cadres: document.querySelectorAll(".video-cadre").length, boutons: document.querySelectorAll("[data-yt]").length }));
    await page.click("[data-yt]"); await attendre(page, 300);
    const f2 = await page.evaluate(() => ({ cadres: document.querySelectorAll(".video-cadre").length, boutons: document.querySelectorAll("[data-yt]").length }));
    ok("E5 : « Vidéo » ouvre la démonstration à sa place (youtube-nocookie, l'id de l'exercice), une seule à la fois ; rien n'est écrit",
      /^https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}\?rel=0&autoplay=1$/.test(f1.src) && f1.cadres === 1 && f2.cadres === 1 && f2.boutons === f1.boutons && ecrituresDonnees(db).length === 0, JSON.stringify({ f1, f2 }));
  });

  /* =================== F. client : son programme inchangé ; accueil ; coach =================== */
  await bloc("F. client, accueil, coach", async () => {
    const db = base();
    const { page } = await contexte(b, db, { qui: THOMAS });
    await page.goto(URL0 + "#/programme"); await pret(page); await page.waitForSelector("#prog-vue .seance-c"); await attendre(page, 400);
    const t = await page.evaluate(() => ({ seances: Array.from(document.querySelectorAll("#prog-vue .seance-c h2")).map(x => x.textContent), exos: Array.from(document.querySelectorAll("#prog-vue .ex-lecture .nom")).map(x => x.textContent),
      ordre: (() => { const s = document.querySelector("#prog-vue .seance-c"), l = document.getElementById("pf-lien"); return !!(s && l && (s.compareDocumentPosition(l) & 4)); })(), lien: (document.getElementById("pf-lien-go") || {}).getAttribute ? document.getElementById("pf-lien-go").getAttribute("href") : null }));
    const P1 = db.donnees.find(x => x.user_id === THOMAS.id && x.outil === "programme").contenu;
    ok("F1 : le programme d'un client fait par le coach est inchangé et en premier (ses séances et ses exercices, comme dans la clé programme) ; dessous, « Les programmes de la formation » → #/programme/formation",
      JSON.stringify(t.seances) === JSON.stringify(P1.seances.map(s => s.nom)) && JSON.stringify(t.exos) === JSON.stringify([].concat(...P1.seances.map(s => s.exercices.map(e => e.nom)))) && t.ordre && t.lien === "#/programme/formation", JSON.stringify(t));
    await page.click("#pf-lien-go"); await pret(page); await surPf(page);
    const tf = await lirePage(page);
    await ouvrirPf(page, "#/programme/seance/salle-homme/0/0", "#pf-seance");
    const retour = await page.$eval("#pf-retour", a => a.getAttribute("href"));
    await page.goto(URL0 + "#/accueil"); await pret(page); await page.waitForSelector("#acc-vue .masthead h1"); await attendre(page, 400);
    const carteThomas = !!(await page.$("#pf-carte"));
    ok("F2 : en plus, les programmes de la formation (Thomas : « Perte de poids / sèche », homme → salle homme ; retour vers #/programme/formation) ; sur son accueil, pas de carte « Ton programme » (il a celui de son coach) ; rien n'est écrit dans sa clé programme",
      tf.nom === "Programme salle 12 semaines · Homme" && retour === "#/programme/formation" && !carteThomas && ecr(db, "programme").length === 0 && ecrituresDonnees(db).length === 0, JSON.stringify({ tf, retour, carteThomas }));
    const x = await contexte(b, db, { qui: SARAH });
    await x.page.goto(URL0 + "#/accueil"); await pret(x.page); await x.page.waitForSelector("#pf-carte"); await attendre(x.page, 300);
    const cs = await x.page.evaluate(() => ({ t: document.querySelector("#pf-carte h2").textContent, nom: document.querySelector("#pf-carte .pf-carte-nom b").textContent, phase: (document.querySelector("#pf-carte .pf-carte-nom .note") || {}).textContent, go: document.getElementById("pf-carte-go").getAttribute("href"), b: document.getElementById("pf-carte-go").textContent }));
    ok("F3 : accueil d'un client sans programme du coach : la carte « Ton programme » (nom, phase, « Voir mes séances » → #/programme/formation)",
      cs.t === "Ton programme" && cs.nom === "Programme salle 12 semaines · Femme" && cs.phase === "Semaines 1 à 4" && cs.go === "#/programme/formation" && cs.b === "Voir mes séances", JSON.stringify(cs));
    const y = await contexte(b, db, { qui: P.MF });
    await y.page.goto(URL0 + "#/accueil"); await pret(y.page); await y.page.waitForSelector("#pf-carte"); await attendre(y.page, 300);
    const cp = await y.page.evaluate(() => ({ nom: document.querySelector("#pf-carte .pf-carte-nom b").textContent, go: document.getElementById("pf-carte-go").getAttribute("href"),
      apresEtape: (() => { const e = document.getElementById("dc-etape"), c = document.getElementById("pf-carte"); return !e || !!(e.compareDocumentPosition(c) & 4); })() }));
    await y.page.click("#pf-carte-go"); await pret(y.page); await surPf(y.page);
    const yh = await y.page.evaluate(() => location.hash);
    ok("F4 : accueil du prospect : la carte « Ton programme » après l'étape du moment ; « Voir mes séances » ouvre son onglet Programme", cp.nom === "Programme salle 12 semaines · Femme" && cp.go === "#/programme" && cp.apresEtape && yh === "#/programme", JSON.stringify({ cp, yh }));
    const z = await contexte(b, db);
    await z.page.goto(URL0 + "#/tableau"); await pret(z.page);
    await z.page.evaluate(id => Clients.ouvrir(id, "Thomas Démo", "programme"), THOMAS.id); await pret(z.page); await attendre(z.page, 800);
    const co = await z.page.evaluate(() => ({ editeur: !!document.querySelector("#prog-vue input, #prog-vue textarea"), lien: !!document.getElementById("pf-lien"), pf: !!document.getElementById("pf-zone") }));
    ok("F5 : le coach dans la fiche de Thomas : l'éditeur de son programme comme avant, sans les programmes de la formation", co.editeur && !co.lien && !co.pf, JSON.stringify(co));
    const y2 = await y.page.evaluate(() => ({ verrou: !!document.querySelector(".ech-appel .verrou"), texte: (document.querySelector(".ech-appel .verrou p") || {}).textContent || "", ex: !!document.getElementById("ech-programme"), cal: (document.querySelector(".ech-appel .verrou a[target=_blank]") || {}).href || "" }));
    ok("F6 : l'onglet Programme du prospect : son programme, puis dessous la carte 🔒 « Après ton bilan : ton programme sur mesure, avec ton coach. » (réserver : Calendly, origine verrou_programme) ; plus l'exemple d'avant",
      y2.verrou && norm(y2.texte) === "Après ton bilan : ton programme sur mesure, avec ton coach." && !y2.ex && /verrou_programme/.test(decodeURIComponent(y2.cal)), JSON.stringify(y2));
  });

  /* =================== G. « Bientôt », « Speed Formation » =================== */
  await bloc("G. Bientôt, Formation", async () => {
    const db = base();
    const { page } = await contexte(b, db, { qui: P.GH, neuf: true });
    await page.goto(URL0); await page.waitForSelector("#pc", { timeout: 10000 }); await attendre(page, 400);
    const sc = await page.evaluate(() => ({ dispo: CONFIG.parcours.disponibles.programme, etiquettes: Array.from(document.querySelectorAll(".pc-et")).map(e => e.textContent.replace(/\s+/g, " ").trim()) }));
    ok("G1 : CONFIG.parcours.disponibles.programme vaut true : plus de badge « Bientôt » sur « Programmes homme ou femme » (les recettes le gardent)",
      sc.dispo === true && sc.etiquettes.some(t => t === "Programmes homme ou femme") && !sc.etiquettes.some(t => /Programmes.*Bientôt/.test(t)) && sc.etiquettes.some(t => /Recettes.*Bientôt/.test(t)), JSON.stringify(sc));
    const x = await contexte(b, db, { qui: P.GH });
    await x.page.goto(URL0 + "#/accueil"); await pret(x.page); await attendre(x.page, 600);
    const acc = await x.page.evaluate(() => document.body.innerText);
    await aller(x.page, "#/formation"); await attendre(x.page, 400);
    const fo = await x.page.evaluate(() => ({ h1: (document.querySelector(".masthead h1") || {}).textContent, lede: (document.querySelector(".masthead .lede") || {}).textContent, nav: Array.from(document.querySelectorAll("#barre-bas a, #nav a")).map(a => a.textContent.trim()), tout: document.body.innerText }));
    const fichiers = await x.page.evaluate(async () => { const out = []; for (const f of MHX_JS.concat(MHX_CSS)) { const t = await (await fetch(f + "?v=" + MHX_FICHIERS)).text(); if (/speed\s*formation/i.test(t)) out.push(f); } return out; });
    const idx = await (await x.page.request.get(URL0)).text();
    ok("G2 : plus aucun « Speed Formation » : accueil du prospect, page « Formation » (titre « Formation », sous-titre « Cours et ebooks : alimentation, entraînement, mindset »), navigation, et aucun fichier servi (index.html, js, css)",
      !/speed\s*formation/i.test(acc + fo.tout + idx) && !fichiers.length && fo.h1 === "Formation" && fo.lede === "Cours et ebooks : alimentation, entraînement, mindset" && fo.nav.some(t => t === "Formation"), JSON.stringify({ h1: fo.h1, lede: fo.lede, fichiers, nav: fo.nav }));
    const y = await contexte(b, db, { qui: P.GF, langue: "en" });
    poserPrefs(db, P.GF.id, { langue: "en" });
    await y.page.goto(URL0 + "#/formation"); await pret(y.page); await attendre(y.page, 500);
    const en = await y.page.evaluate(() => ({ h1: (document.querySelector(".masthead h1") || {}).textContent, lede: (document.querySelector(".masthead .lede") || {}).textContent, nav: Array.from(document.querySelectorAll("#barre-bas a")).map(a => a.textContent.trim()), tout: document.body.innerText }));
    ok("G3 : en anglais : « Course », sous-titre « Courses and ebooks: nutrition, training, mindset », « Course » dans la barre du bas",
      en.h1 === "Course" && en.lede === "Courses and ebooks: nutrition, training, mindset" && en.nav.some(t => t === "Course") && !/speed\s*formation/i.test(en.tout), JSON.stringify({ h1: en.h1, lede: en.lede, nav: en.nav }));
  });

  /* =================== H. anglais =================== */
  await bloc("H. anglais", async () => {
    const db = base(); poserPrefs(db, P.MF.id, { langue: "en" });
    const { page } = await contexte(b, db, { qui: P.MF, langue: "en" });
    await page.goto(URL0 + "#/programme"); await pret(page); await surPf(page);
    const MOTS_FR = /\b(Séance|Semaines?|Changer|Combien|Facultative|exercices|Retour|Échauffement|Repos|travail|Choisir|Ton programme|Voir mes)\b/;
    const p1 = await page.evaluate(() => document.querySelector(".pf").innerText);
    const v = await lirePage(page);
    await ouvrirPf(page, "#/programme/seance/salle-femme/1/0", "#pf-seance");
    const p2 = await page.evaluate(() => document.querySelector(".pf").innerText.replace(/^(?:.*\n)?/, ""));
    const exos = await txts(page, ".pf-exo-nom");
    const p2sansNoms = exos.reduce((t, n) => t.split(n).join(""), p2);
    ok("H1 : en anglais (US) : « 12-week gym program · Women », « Change program », « How many workouts? », onglets « Weeks 1-4 », séances « Workout 1 — Lower body », « Optional », « Warm-up », « Rest 90 s », « Superset » ; aucun mot français hors noms d'exercices (ceux de l'app)",
      v.nom === "12-week gym program · Women" && /Change program/.test(p1) && /How many workouts\?/.test(p1) && v.onglets[0] === "Weeks 1-4*" && v.seances[0].nom === "Workout 1 — Lower body" && v.seances[5].fac && /Optional/.test(p1)
        && /Warm-up/.test(p2) && /Rest 90 s/.test(p2) && /Superset/.test(p2) && !MOTS_FR.test(p1) && !MOTS_FR.test(p2sansNoms), JSON.stringify({ p1: p1.slice(0, 300), p2: p2sansNoms.match(MOTS_FR), v }));
    await ouvrirPf(page, "#/programme/seance/maison/0/3", "#pf-seance");
    const p3 = await page.evaluate(() => (document.getElementById("pf-consigne") || {}).textContent);
    await ouvrirPf(page, "#/programme/choisir", "#pf-choisir");
    const p4 = await page.evaluate(() => document.querySelector("#pf-choisir").innerText);
    ok("H2 : consignes et choix en anglais (« 4 to 8 rounds. … », « Choose your program », « Gym · Men », « At home · Men or women », « Current program », « Choose »)",
      /^4 to 8 rounds\./.test(p3) && /Choose your program/.test(p4) && /Gym · Men/.test(p4) && /At home · Men or women/.test(p4) && /Current program/.test(p4) && /Choose/.test(p4) && !MOTS_FR.test(p4), JSON.stringify({ p3, p4 }));
  });

  /* =================== I. largeurs, zones de toucher =================== */
  await bloc("I. largeurs et 44 px", async () => {
    const db = base();
    for (const vp of [ETROIT, MOBILE, GRAND]){
      const { c, page } = await contexte(b, db, { qui: P.MF, viewport: vp });
      const defauts = [];
      for (const h of ["#/programme", "#/programme/seance/salle-femme/1/0", "#/programme/seance/salle-femme/0/3", "#/programme/choisir"]){
        if (h === "#/programme") { await page.goto(URL0 + h); await pret(page); await surPf(page); } else await ouvrirPf(page, h);
        if (await deborde(page)) defauts.push(h + " déborde");
        const p = await petits(page); if (p.length) defauts.push(h + " : " + p.join(", "));
      }
      ok("I : " + vp.width + " px : page du programme, séance (supersets), HIIT à options, choix : aucun débordement, zones de toucher d'au moins 44 px", !defauts.length, defauts.join(" ; ").slice(0, 600));
      await c.close(); ouverts.pop();
    }
  });

  /* =================== W. moteur WebKit (Safari) =================== */
  await bloc("W. WebKit", async () => {
    if (process.env.VERIF87_WEBKIT === "0") return;
    const db = base();
    const wb = await require("playwright").webkit.launch();
    try {
      const c = await wb.newContext({ viewport: MOBILE, isMobile: true, hasTouch: true });
      await c.route("**/*", r => repondre(r, db));
      db.emails[P.MH.id] = "malo@exemple.fr";
      await c.addInitScript(s => { if (!/^https?:$/.test(location.protocol)) return; if (!localStorage.getItem("__init")) { localStorage.setItem("__init", "1"); localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); localStorage.setItem("mhx_session", JSON.stringify(s)); } }, session(P.MH.id, "malo@exemple.fr"));
      const page = await c.newPage(); const err = [];
      page.on("pageerror", e => err.push(String(e).slice(0, 200)));
      await page.goto(URL0 + "#/programme"); await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 15000 }); await page.waitForSelector("#pf-tete", { timeout: 10000 }); await page.waitForTimeout(400);
      const v = await page.evaluate(() => ({ nom: document.getElementById("pf-nom").textContent, facs: document.querySelectorAll(".pf-fac").length, deb: document.documentElement.scrollWidth > window.innerWidth + 1 }));
      await page.tap('[data-pf-phase="1"]'); await page.waitForTimeout(200);
      const o = await page.evaluate(() => Array.from(document.querySelectorAll(".pf-phase")).filter(x => !x.hidden).map(x => x.id));
      ok("W1 : WebKit : le programme (salle homme, séance 6 « Facultative » × 3), les onglets de phase au toucher, aucun débordement", v.nom === "Programme salle 12 semaines · Homme" && v.facs === 3 && !v.deb && JSON.stringify(o) === '["pf-ph-1"]' && !err.length, JSON.stringify({ v, o, err }));
      await page.evaluate(() => { location.hash = "#/programme/seance/salle-homme/1/0"; }); await page.waitForSelector("#pf-seance", { timeout: 10000 }); await page.waitForTimeout(400);
      await page.tap("[data-yt]"); await page.waitForTimeout(300);
      const s = await page.evaluate(() => ({ sup: document.querySelectorAll(".pf-superset").length, cadre: !!document.querySelector(".video-cadre iframe"), deb: document.documentElement.scrollWidth > window.innerWidth + 1 }));
      ok("W2 : WebKit : la séance (superset), la vidéo au toucher, aucun débordement", s.sup === 1 && s.cadre && !s.deb && !err.length, JSON.stringify({ s, err }));
    } finally { await wb.close(); }
  });

  /* =================== Z. rien vers l'extérieur =================== */
  await bloc("Z. hôtes externes", async () => {
    /* comme verif56 : la page Formation (bloc G) montre les vignettes de ses vidéos (img.youtube.com, bloquées ici) ; les
       programmes de la formation, eux, n'affichent aucune vignette (un bouton, puis le lecteur youtube-nocookie au toucher) */
    const autres = Array.from(externes).filter(h => h !== "img.youtube.com");
    ok("Z : aucune requête vers un autre hôte que la page, le faux Supabase, le lecteur youtube-nocookie d'une démonstration ouverte et les vignettes de la page Formation (bloquées)", autres.length === 0, JSON.stringify(autres));
  });

  await b.close(); server.close(); bilan();
})().catch(e => { console.log("ERREUR " + (e && e.stack || e)); process.exit(1); });
