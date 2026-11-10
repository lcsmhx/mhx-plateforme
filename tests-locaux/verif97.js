/* verif97 — v97 (chantier 2 de la nuit du 10/11/2026, plan-etape4 : le brouillon des diètes), dans un vrai navigateur
   (Supabase simulé, gabarit de verif95 : coach et clients des fixtures, aucune donnée réelle).
   A. données au format actuel, sans action du coach : le client voit la même diète, garde sa liste de courses et ses repas
      cochés ; le coach ouvre la diète : « ✓ Publié », aucun brouillon fantôme (pré-remplissage compris), rien d'écrit ;
   B. le brouillon (brouillons_repas, compte du coach) : rien chez le client avant « Publier » ; rechargement, « Annuler le
      brouillon », fenêtre « Publier », une écriture, historique, forme du document ;
   C. liste de courses et repas cochés : remis à zéro seulement à la publication ;
   D. le client garde « Remplacer » ; la fenêtre « Publier » dit qu'il a changé un repas entre-temps ;
   E. « Changer ce repas » : 3 propositions du même moment, toutes compatibles régime + allergènes ; questionnaire illisible :
      aucune proposition ;
   F. ↑ ↓, « Dupliquer sur », écart avec « Ses calories » (simple avertissement, « Reprendre »), nouvelle semaine ;
   G. coach en anglais ;
   H. relecture : propositions retirées quand un réglage change ou qu'un repas bouge, nouvelle semaine pré-remplie, copies sans
      la marque « Changé par ton client » ;
   Z. aucune erreur de console ni erreur JS, aucun dialogue natif, aucun appel vers l'extérieur.
   Usage : node verif97.js ../index.html
           VERIF97_PORT=10103 node verif97.js ../index.html     (autre port, si 10102 est pris)
           VERIF97_BLOCS="A.,C." node verif97.js …               (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF97_PORT || 10102;
const BLOCS = (process.env.VERIF97_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const MOBILE = { width: 390, height: 844 }, ORDI = { width: 1280, height: 900 };

/* ---------- la page servie : le fichier testé (page, css/ et js/) ---------- */
const { servirFichier } = require("./fichiers");
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML)) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(fs.readFileSync(HTML, "utf8"));
});

/* ---------- résultats ---------- */
const res = [];
const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + String(d || "").replace(/[✓✗]/g, "·").replace(/\s+/g, " ").trim().slice(0, 1200)));
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

/* ---------- dates ---------- */
const T0 = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d.getTime(); })(), H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const norm = t => String(t == null ? "" : t).replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();

/* ---------- les personnes ---------- */
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + 90 * J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: clone(meta) } : {}) });
const qui = (id, email, meta) => ({ id, email, session: session(id, email, meta) });
const COACH = qui(F.IDS.coach, "coach@exemple.fr", { prenom: "Coach", nom: "Démo" }), THOMAS = qui(F.IDS.c1, "thomas@exemple.fr", { prenom: "Thomas", nom: "Démo" });
const C1 = F.IDS.c1;
const SEANCES = () => clone(F.donnees.find(x => x.user_id === C1 && x.outil === "programme").contenu.seances.slice(0, 2));
/* le brouillon de l'atelier du coach (clé « atelier ») */
const ATELIER = (nom, seances) => ({ nom, note: "Note de l'atelier", lieu: "Salle complète", seances_semaine: 3, niveau: "Debutant", objectif: "Prise de muscle", seances: seances || SEANCES() });

/* ---------- le décor : fixtures.js (coach, clients) ; opts.donnees : [[user_id, outil, contenu]] en plus ---------- */
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { if (p.role !== "coach") p.statut = "client"; });
  const donnees = clone(F.donnees);
  for (const [uid, outil, contenu] of opts.donnees || []) {
    const i = donnees.findIndex(x => x.user_id === uid && x.outil === outil), l = { user_id: uid, outil, contenu: clone(contenu), maj_le: avant(H) };
    if (i > -1) donnees[i] = l; else donnees.push(l);
  }
  return { profils, donnees, ecritures: [], refus: [], lectures: [],
    emails: { [F.IDS.coach]: "coach@exemple.fr", [C1]: "thomas@exemple.fr", [F.IDS.c2]: "sarah@exemple.fr", [F.IDS.c3]: "julien@exemple.fr" },
    meta: { [F.IDS.coach]: { prenom: "Coach", nom: "Démo" }, [C1]: { prenom: "Thomas", nom: "Démo" }, [F.IDS.c2]: { prenom: "Sarah", nom: "Démo" }, [F.IDS.c3]: { prenom: "Julien", nom: "Démo" } },
    /* pannes : panneLecture (GET donnees dont le filtre outil contient ce nom → 500), panneEcriture (POST de cette clé → 500),
       refusEcriture (POST de cette clé → 403, refus définitif), lentEcriture { outil, ms } (POST retardé, puis réussi),
       panneBiblio (POST bibliotheque → 500), pannePrets (relecture de programmes_types par l'atelier → 500) */
    panneLecture: null, panneEcriture: null, refusEcriture: null, lentEcriture: null, panneBiblio: false, pannePrets: false,
    programmes: clone(F.catalogue.programmes_types || []) };
}

/* ---------- le faux Supabase (gabarit de verif91) ---------- */
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
  return l;
}
const colonnes = (l, q) => { const sel = (q.get("select") || "*").split(","); return sel.includes("*") ? l : l.map(x => Object.fromEntries(sel.map(k => [k, x[k]]))); };
const appelant = req => { const m = /^Bearer (?:jeton-|lien\.)([0-9a-f-]{36})/.exec(req.headers()["authorization"] || ""); return m ? m[1] : null; };
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "donnees", f), "utf8"));
const CATALOGUE = Object.assign({}, F.catalogue, { aliments: lireDonnees("aliments.json"), recettes: lireDonnees("recettes.json") });
async function repondre(r, who, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue();
  if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" }).catch(() => {});
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort().catch(() => {}); }
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req) || (who && who.id) || null;
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  if (p.startsWith("/auth/v1/token")) {
    const c = corps() || {}, r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || "")), id = r1 && r1[1];
    if (!id) return json({ error: "invalid_grant", error_description: "Invalid Refresh Token" }, 400);
    return json(session(id, db.emails[id] || "", db.meta[id]));
  }
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  if (p === "/auth/v1/user") {
    if (!moi) return json({ msg: "invalid JWT" }, 401);
    return json({ id: moi, email: db.emails[moi] || "", role: "authenticated", user_metadata: clone(db.meta[moi] || {}) });
  }
  if (p.startsWith("/auth/v1/")) return json({});
  if (p.startsWith("/functions/v1/")) return json({ ok: true });
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/emails_prospects") return json([]);
  if (p === "/rest/v1/profils") {
    const id = (q.get("id") || "").replace(/^eq\./, "");
    if (m === "GET" || m === "HEAD") { let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(colonnes(plage(l), q)); }
    db.ecritures.push({ table: "profils", m, id, corps: corps() });
    return json(null, 200);
  }
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "";
    if (m === "GET" || m === "HEAD") {
      db.lectures.push({ par: moi, uid, outil: o });
      if (db.panneLecture && o.includes(db.panneLecture)) return json({ message: "panne simulée" }, 500);
      let l = db.donnees.filter(x => coach || (x.user_id === moi && !ILLISIBLES_PROPRIO.includes(x.outil)));
      if (uid) l = l.filter(x => x.user_id === uid);
      return json(colonnes(plage(parOutil(l, o)), q));
    }
    if (m === "POST") {
      let rows = corps(); rows = Array.isArray(rows) ? rows : rows ? [rows] : [];
      if (db.panneEcriture && rows.some(x => x && x.outil === db.panneEcriture)) { db.refus.push({ panne: db.panneEcriture }); return json({ message: "panne simulée" }, 500); }
      if (db.refusEcriture && rows.some(x => x && x.outil === db.refusEcriture)) { db.refus.push({ refus: db.refusEcriture }); return json({ code: "42501", message: "refus simulé" }, 403); }
      if (db.lentEcriture && rows.some(x => x && x.outil === db.lentEcriture.outil)) await new Promise(k => setTimeout(k, db.lentEcriture.ms));
      const refuse = rows.find(row => !permis(moi, coach, row));
      if (refuse) { db.refus.push({ user_id: refuse.user_id, outil: refuse.outil }); return json({ code: "42501", message: 'new row violates row-level security policy for table "donnees"' }, 403); }
      for (const row of rows) {
        const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
        const ligne = { user_id: row.user_id, outil: row.outil, contenu: clone(row.contenu), maj_le: row.maj_le || new Date().toISOString() };
        if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        db.ecritures.push(Object.assign({ table: "donnees", m, t: Date.now() }, clone(ligne)));
      }
      return json(null, 201);
    }
    db.ecritures.push({ table: "donnees", m, user_id: uid, outil: o });   // PATCH / DELETE : jamais attendus ici, notés
    return json([]);
  }
  if (p === "/rest/v1/bibliotheque") {
    if (m === "GET") return json(coach ? colonnes(plage(clone(F.bibliotheque)), q) : []);
    db.ecritures.push({ table: "bibliotheque", m, corps: corps() });
    if (db.panneBiblio) return json({ message: "panne simulée" }, 500);
    return json(null, 201);
  }
  if (p === "/rest/v1/programmes_types") {
    if (m === "GET") {
      const id = q.get("id");
      /* la relecture de l'atelier (select=id,nom ; v91 : id=eq.…) en panne ; la liste complète de la page (select=*) répond */
      if (db.pannePrets && (q.get("select") || "*") !== "*") return json({ message: "panne simulée" }, 500);
      let l = db.programmes; if (id && id.startsWith("eq.")) l = l.filter(x => x.id === id.slice(3));
      return json(colonnes(plage(clone(l)), q));
    }
    const rows = [].concat(corps() || []);
    db.ecritures.push({ table: "programmes_types", m, corps: clone(rows) });
    rows.forEach(row => { const i = db.programmes.findIndex(x => x.id === row.id); if (i > -1) db.programmes[i] = clone(row); else db.programmes.push(clone(row)); });
    return json(null, 201);
  }
  const t = p.replace("/rest/v1/", "");
  if (CATALOGUE[t]) return m === "GET" ? json(colonnes(plage(CATALOGUE[t]), q)) : json(null, 201);
  return json([]);
}

/* ---------- un navigateur (contexte) pour une personne, horloge contrôlée ---------- */
const ERREURS = [];
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || ORDI });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, who, db));
  await c.addInitScript(({ s, langue }) => {
    if (!/^https?:$/.test(location.protocol) || location.hostname !== "localhost") return;
    if (!localStorage.getItem("__init")) {
      localStorage.setItem("__init", "1");
      if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
      localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
      if (langue) localStorage.setItem("mhx_langue", langue);
    }
  }, { s: who ? who.session : null, langue: opts.langue || "" });
  await c.clock.install({ time: T0 });
  const page = surveiller(await c.newPage());
  return { c, page };
}
function surveiller(page){
  page.on("pageerror", e => { ERREURS.push("JS " + String(e).slice(0, 200)); res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)); });
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|ERR_INTERNET_DISCONNECTED|status of [45]\d\d/.test(msg.text())) { ERREURS.push("CONSOLE " + msg.text().slice(0, 200)); res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); } });
  page.on("dialog", d => { ERREURS.push("DIALOGUE " + d.message().slice(0, 80)); res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return page;
}

/* ---------- aides ---------- */
const attendre = (page, ms) => page.waitForTimeout(ms);
const attendreQue = async (f, ms) => { const fin = Date.now() + (ms || 5000); while (Date.now() < fin) { if (await f()) return true; await new Promise(r => setTimeout(r, 100)); } return !!(await f()); };
async function pret(page, sel){
  await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 });
  if (sel) { try { await page.waitForSelector(sel, { timeout: 10000 }); } catch (e) {} }
  await attendre(page, 500);
}
const URL0 = `http://localhost:${PORT}/`;
const FICHE = outil => URL0 + "#/client/" + C1 + "/" + outil;
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.table === "donnees" && e.outil === outil && (!uid || e.user_id === uid));
const table = (db, t) => db.ecritures.filter(e => e.table === t && e.m !== "GET");
const texte = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null; }, sel);
/* la fenêtre UI.confirmer ouverte (texte), ou null ; repondre(page, libellé) touche son bouton */
const fenetre = page => page.evaluate(() => { const m = document.querySelector(".fond .modale"); return m ? m.textContent.replace(/\s+/g, " ").trim() : null; });
const toucherFenetre = (page, libelle) => page.evaluate(l => { const b = Array.from(document.querySelectorAll(".fond .modale [data-ui-b]")).find(x => x.textContent.trim() === l); if (b) b.click(); return !!b; }, libelle);
const horsLigne = page => page.evaluate(() => { const f = document.getElementById("page-hors-ligne"); return f ? { texte: f.textContent.replace(/\s+/g, " ").trim(), reessayer: !!f.querySelector("[data-reessayer]") } : null; });


const avecPrefsEn = (db, uid) => { const pr = db.donnees.find(d => d.user_id === uid && d.outil === "prefs"); if (pr) pr.contenu = Object.assign({}, pr.contenu, { langue: "en" }); else db.donnees.push({ user_id: uid, outil: "prefs", contenu: { langue: "en" }, maj_le: avant(J) }); };
const bouton = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return e ? { txt: e.textContent.trim(), aria: e.getAttribute("aria-label"), title: e.getAttribute("title") } : null; }, sel);
const FR = "Langue : français. Passer en anglais", EN = "Language: English. Switch to French";
const COACH_ID = F.IDS.coach;
const AUJ0 = new Date(T0).toISOString().slice(0, 10);
const REPAS = () => clone(F.donnees.find(x => x.user_id === C1 && x.outil === "repas").contenu);
const SUIVI = () => clone(F.donnees.find(x => x.user_id === C1 && x.outil === "repas_suivi").contenu);
const IDX = (new Date(T0).getDay() + 6) % 7;
const brouillons = db => { const l = db.donnees.find(x => x.user_id === COACH_ID && x.outil === "brouillons_repas"); return l ? l.contenu : null; };
const publiee = db => { const l = db.donnees.find(x => x.user_id === C1 && x.outil === "repas"); return l ? l.contenu : null; };
const suivi = db => { const l = db.donnees.find(x => x.user_id === C1 && x.outil === "repas_suivi"); return l ? l.contenu : null; };
const attendreB = (db, f) => attendreQue(async () => { const B = brouillons(db); return !!(B && f(B)); }, 5000);
const ouvrirCoach = async (b, db) => { const { page, c } = await contexte(b, COACH, db); await page.goto(FICHE("nutrition")); await pret(page, "#nu-publier"); return { page, c }; };
const ouvrirClient = async (b, db) => { const { page, c } = await contexte(b, THOMAS, db); await page.goto(URL0 + "#/nutrition"); await pret(page, ".repas-c"); return { page, c }; };
const statut = page => texte(page, "#nu-statut");
/* la vue du client : jour affiché, repas (nom, grammages), articles cochés de la liste de courses, repas « respectés » */
const vueClient = page => page.evaluate(() => ({
  repas: Array.from(document.querySelectorAll(".repas-c")).map(s => (s.querySelector("h2") || {}).textContent + " | " + Array.from(s.querySelectorAll(".ingr li")).map(l => l.textContent.replace(/\s+/g, " ").trim()).join(", ")),
  courses: Array.from(document.querySelectorAll("[data-course]")).filter(x => x.checked).length,
  articles: document.querySelectorAll("[data-course]").length,
  respectes: Array.from(document.querySelectorAll("[data-mange]")).filter(x => x.getAttribute("aria-pressed") === "true").length }));
const changerGr = async (page, delta) => {
  await page.evaluate(d => { const i = document.querySelector("[data-gr]"); i.value = String((+i.value || 0) + d); i.dispatchEvent(new Event("change", { bubbles: true })); }, delta || 5);
};
const publier = async (page, choix) => {
  await page.click("#nu-publier");
  await attendreQue(() => fenetre(page), 5000);
  const m = await fenetre(page);
  await toucherFenetre(page, choix || "Publier");
  if ((choix || "Publier") === "Publier") await attendreQue(() => page.evaluate(() => { const b = document.getElementById("nu-publier"), x = document.getElementById("nu-pub-msg"); return !!b && !b.disabled && !!x && x.textContent.trim() !== ""; }), 9000);
  else await attendre(page, 600);
  return { modale: m, msg: await texte(page, "#nu-pub-msg") };
};
const regimeCle = { "Omnivore": "omnivore", "Végétarien": "vegetarien", "Végétalien (vegan)": "vegan", "Pescétarien": "pescetarien", "Paléo": "paleo", "Sans gluten": "sans_gluten", "Sans lactose": "sans_lactose", "Sans porc ni alcool": "sans_porc" };

/* v102 : un brouillon retiré laisse une marque datée sans programme (retire_le) : « aucun brouillon » = pas d'entrée ou cette marque */
const sansBrouillon = (B, k) => !B || !B.clients || !B.clients[k] || !B.clients[k].programme;
(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF97_PORT=10103 node verif97.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. données d'aujourd'hui : rien ne change sans action du coach =================== */
  await bloc("A. compatibilité", async () => {
    const db = base({ donnees: [[C1, "repas_suivi", Object.assign(SUIVI(), { courses: { "x-skyr": true }, courses_pour: REPAS().maj })]] });
    const R0 = REPAS();
    const { page: cl } = await ouvrirClient(b, db);
    const v = await vueClient(cl);
    const jour = R0.jours[IDX];
    ok("A1 : client, diète au format actuel : les repas du jour, dans l'ordre, avec les mêmes grammages ; sa liste de courses garde son article coché ; ses 2 repas « respectés » restent",
      v.repas.length === jour.repas.length && jour.repas.every((x, i) => v.repas[i].startsWith(x.nom) && x.ingredients.every(g => v.repas[i].includes(g.nom))) && v.courses === 1 && v.respectes === 2,
      JSON.stringify([v.repas.map(x => x.slice(0, 30)), v.courses, v.respectes]));
    const { page: co } = await ouvrirCoach(b, db);
    await attendre(co, 1500);
    const st = await statut(co);
    const ecrites = db.ecritures.filter(e => e.table === "donnees" && ["repas", "brouillons_repas", "repas_suivi", "hist_repas"].includes(e.outil));
    ok("A2 : le coach ouvre la diète : « ✓ Publié », aucun brouillon fantôme ; ni lui ni le client n'ont rien écrit (diète, brouillon, suivi, historique)",
      /Publié/.test(st || "") && !/Brouillon/.test(st || "") && ecrites.length === 0 && !brouillons(db) && JSON.stringify(publiee(db)) === JSON.stringify(R0), JSON.stringify([st, ecrites.map(e => e.outil)]));
    /* une diète sans allergènes alors que le questionnaire en déclare : pré-rempli à l'écran, jamais un brouillon ni une écriture */
    const R1 = Object.assign(REPAS(), { allergenes: [] });
    const db1 = base({ donnees: [[C1, "repas", R1]] });
    const { page: co1 } = await ouvrirCoach(b, db1);
    await attendre(co1, 1500);
    const coche = await co1.evaluate(() => { const c = document.querySelector('#nu-allerg input[value="gluten"]'); return c ? c.checked : null; });
    ok("A3 : diète sans allergènes, questionnaire « Gluten » : la case est pré-cochée à l'écran, mais « ✓ Publié » et rien d'écrit",
      coche === true && /Publié/.test(await statut(co1) || "") && db1.ecritures.filter(e => e.table === "donnees" && ["repas", "brouillons_repas"].includes(e.outil)).length === 0, JSON.stringify([coche, await statut(co1)]));
  });

  /* =================== B. brouillon et « Publier » =================== */
  await bloc("B. brouillon", async () => {
    const db = base();
    const g0 = REPAS().jours[0].repas[0].ingredients[0].grammes;
    const { page: co } = await ouvrirCoach(b, db);
    await changerGr(co, 5);
    await attendreB(db, B => B.clients && B.clients[C1]);
    const e = brouillons(db).clients[C1];
    ok("B1 : une quantité changée part dans le brouillon (brouillons_repas, compte du coach), jamais chez le client ; « ● Brouillon non publié »",
      e.programme.jours[0].repas[0].ingredients[0].grammes === g0 + 5 && ecr(db, "repas").length === 0 && /Brouillon non publié/.test(await statut(co) || "") && ecr(db, "brouillons_repas").every(x => x.user_id === COACH_ID),
      JSON.stringify([e.programme.jours[0].repas[0].ingredients[0].grammes, ecr(db, "repas").length]));
    await co.reload(); await pret(co, "#nu-publier");
    const gr = await co.evaluate(() => (document.querySelector("[data-gr]") || {}).value);
    ok("B2 : rechargement : le brouillon revient", gr === String(g0 + 5) && /Brouillon non publié/.test(await statut(co) || ""), gr);
    await co.click("#nu-annuler-brouillon"); await attendre(co, 300);
    await toucherFenetre(co, "Annuler le brouillon");
    await attendreB(db, B => sansBrouillon(B, C1)); await attendre(co, 300);
    ok("B3 : « Annuler le brouillon » : retiré, la version publiée revient, rien chez le client", (await co.evaluate(() => (document.querySelector("[data-gr]") || {}).value)) === String(g0) && ecr(db, "repas").length === 0 && /Publié/.test(await statut(co) || ""), "");
    await changerGr(co, 10);
    await attendreB(db, B => B.clients && B.clients[C1]);
    const h0 = ecr(db, "hist_repas").length;
    const r = await publier(co);
    await attendreB(db, B => sansBrouillon(B, C1));
    const R = publiee(db), H = db.donnees.find(x => x.user_id === C1 && x.outil === "hist_repas").contenu;
    ok("B4 : la fenêtre « Publier » prévient (liste de courses et repas cochés à zéro) ; « Publié » ; une seule écriture de la diète, datée (maj, publie_le) ; l'ancienne semaine dans l'historique ; brouillon retiré",
      /sa liste de courses et ses repas cochés repartiront de zéro/.test(r.modale || "") && /^Publié/.test(r.msg || "") && ecr(db, "repas").length === 1 && R.jours[0].repas[0].ingredients[0].grammes === g0 + 10 && !!R.maj && !!R.publie_le
        && ecr(db, "hist_repas").length === h0 + 1 && H.liste[0].contenu.jours[0].repas[0].ingredients[0].grammes === g0, JSON.stringify([r, ecr(db, "repas").length, H.liste.length]));
    const champs = ["nom", "note", "cible", "regime", "allergenes", "nb_repas", "maj", "jours"].every(k => k in R) && !("repas" in R && !Array.isArray(R.repas));
    ok("B5 : la diète publiée garde sa forme (mêmes champs ; seulement publie_le en plus)", champs, JSON.stringify(Object.keys(R)));
  });

  /* =================== C. liste de courses et repas cochés : seulement à la publication =================== */
  await bloc("C. courses", async () => {
    const db = base({ donnees: [[C1, "repas_suivi", Object.assign(SUIVI(), { courses: { "x-skyr": true, "x-banane": true }, courses_pour: REPAS().maj })]] });
    const { page: co } = await ouvrirCoach(b, db);
    await co.click("#nu-gen"); await attendreB(db, B => B.clients && B.clients[C1]); await attendre(co, 500);
    const { page: cl } = await ouvrirClient(b, db);
    const v1 = await vueClient(cl);
    ok("C1 : le coach régénère la semaine (brouillon) : chez le client, rien ne bouge — même diète, 2 articles cochés, 2 repas respectés",
      v1.courses === 2 && v1.respectes === 2 && ecr(db, "repas").length === 0 && v1.repas[0].startsWith(REPAS().jours[IDX].repas[0].nom), JSON.stringify(v1));
    await publier(co);
    await cl.reload(); await pret(cl, ".repas-c");
    const v2 = await vueClient(cl);
    ok("C2 : après « Publier » : sa liste de courses et ses repas cochés repartent de zéro, sans rien écrire à l'ouverture",
      v2.courses === 0 && v2.respectes === 0 && ecr(db, "repas_suivi").length === 0, JSON.stringify([v2.courses, v2.respectes, ecr(db, "repas_suivi").length]));
  });

  /* =================== D. le client change un repas pendant le brouillon =================== */
  await bloc("D. remplacer pendant le brouillon", async () => {
    const db = base();
    const { page: co } = await ouvrirCoach(b, db);
    await changerGr(co, 5); await attendreB(db, B => B.clients && B.clients[C1]);
    const { page: cl } = await ouvrirClient(b, db);
    const avant = ecr(db, "repas", C1).length;
    await cl.click("[data-remplacer]"); await attendreQue(() => ecr(db, "repas", C1).length > avant, 8000);
    const remplace = ecr(db, "repas", C1).length > avant;
    const r = await publier(co, "Ne rien publier");
    ok("D1 : le client garde « Remplacer » (sa diète publiée change) ; la fenêtre « Publier » du coach dit « ton client a changé 1 repas depuis le début de ton brouillon » ; « Ne rien publier » : rien n'est écrit",
      remplace && /ton client a changé 1 repas depuis le début de ton brouillon/.test(r.modale || "") && ecr(db, "repas", C1).length === avant + 1, JSON.stringify([remplace, r.modale]));
  });

  /* =================== E. « Changer ce repas » : 3 propositions, toujours compatibles =================== */
  await bloc("E. changer ce repas", async () => {
    const db = base();
    const R0 = REPAS();
    const { page: co } = await ouvrirCoach(b, db);
    await co.click('[data-autre="0:0"]'); await attendreQue(() => co.evaluate(() => document.querySelectorAll("[data-choisir]").length > 0), 6000);
    const noms = await co.evaluate(() => Array.from(document.querySelectorAll('[data-props="0:0"] .res-l .nom')).map(x => x.textContent));
    /* la fiche de chaque recette telle que l'app la connaît (régimes et allergènes déduits des ingrédients : Catalogue.recettes) */
    const fiches = async (page, l) => page.evaluate(async l => { const toutes = await Catalogue.recettes(); return l.map(n => { const r = toutes.find(x => x.nom === n); return r ? { moment: r.moment, regimes: r.regimes || [], allergenes: r.allergenes || [] } : null; }); }, l);
    const rec = await fiches(co, noms);
    const okRegime = rec.every(r => r && r.moment === "petit_dejeuner" && !(r.allergenes || []).some(a => R0.allergenes.includes(a)) && (R0.regime === "Omnivore" || (r.regimes || []).includes(regimeCle[R0.regime])));
    ok("E1 : « Changer ce repas » : 3 propositions du même moment (petit-déjeuner), toutes sans gluten (allergène de la diète) et compatibles avec son régime", noms.length === 3 && okRegime && new Set(noms).size === 3, JSON.stringify(noms));
    await co.click('[data-choisir="0:0:1"]'); await attendreB(db, B => B.clients && B.clients[C1]);
    ok("E2 : « Choisir » : le repas est remplacé dans le brouillon seulement", brouillons(db).clients[C1].programme.jours[0].repas[0].nom === noms[1] && ecr(db, "repas").length === 0, "");
    /* régime végétalien + allergène arachide (diète) : toutes les propositions le respectent */
    const R2 = Object.assign(REPAS(), { regime: "Végétalien (vegan)", allergenes: ["gluten", "arachide"] });
    const db2 = base({ donnees: [[C1, "repas", R2]] });
    const { page: c2 } = await ouvrirCoach(b, db2);
    await c2.click('[data-autre="0:1"]'); await attendre(c2, 2500);
    const n2 = await c2.evaluate(() => Array.from(document.querySelectorAll('[data-props="0:1"] .res-l .nom')).map(x => x.textContent));
    const r2 = await fiches(c2, n2);
    ok("E3 : diète végétalienne, sans gluten ni arachide : chaque proposition est végétalienne, sans gluten, sans arachide (ou aucune, avec un message)",
      r2.every(r => r && (r.regimes || []).includes("vegan") && !(r.allergenes || []).some(a => ["gluten", "arachide"].includes(a))) && (n2.length > 0 || /Pas d'autre recette compatible/.test(await texte(c2, "#nu-msg") || "")), JSON.stringify(n2));
    /* questionnaire illisible : aucune proposition */
    const db3 = base(); db3.panneLecture = "intake";
    const { page: c3 } = await ouvrirCoach(b, db3);
    await c3.evaluate(() => { const a = document.querySelector('[data-autre="0:0"]'); if (a){ a.disabled = false; a.click(); } }); await attendre(c3, 2000);
    const n3 = await c3.evaluate(() => document.querySelectorAll("[data-choisir]").length);
    ok("E4 : questionnaire illisible : « Changer ce repas » ne propose rien (bloqué, « vérifie ses allergies »)", n3 === 0 && /Questionnaire illisible/.test(await texte(c3, "#nu-msg") || ""), String(n3));
  });

  /* =================== H. relecture : propositions jamais périmées, nouvelle semaine pré-remplie, copies sans marque =================== */
  await bloc("H. relecture", async () => {
    const db = base();
    const { page: co } = await ouvrirCoach(b, db);
    const ouvrirProps = async (cle) => { await co.click(`[data-autre="${cle}"]`); await attendreQue(() => co.evaluate(c => document.querySelectorAll(`[data-props="${c}"] [data-choisir]`).length > 0, cle), 6000); };
    await ouvrirProps("0:0");
    await co.click('#nu-allerg input[value="lait"]').catch(async () => { await co.click("#nu-allerg input:not(:checked)"); });
    await attendre(co, 400);
    const n1 = await co.evaluate(() => document.querySelectorAll("[data-choisir]").length);
    ok("H1 : un allergène coché pendant que les 3 propositions sont affichées : elles disparaissent (elles ne valaient que pour les réglages d'avant)", n1 === 0, String(n1));
    await ouvrirProps("0:1");
    await co.click('[data-descendre-r="0:1"]'); await attendre(co, 600);
    const n2 = await co.evaluate(() => document.querySelectorAll("[data-choisir]").length);
    ok("H2 : un repas déplacé (↓) pendant que ses propositions sont affichées : elles disparaissent (jamais sous un autre repas)", n2 === 0, String(n2));
    /* « Nouvelle semaine » : la diète publiée sans allergènes, le questionnaire dit « Gluten » : la case reste cochée */
    const R1 = Object.assign(REPAS(), { allergenes: [] });
    const db1 = base({ donnees: [[C1, "repas", R1]] });
    const { page: c1 } = await ouvrirCoach(b, db1);
    await c1.click("#nu-nouveau-bloc"); await attendreB(db1, B => B.clients && B.clients[C1] && B.clients[C1].nouveau_bloc); await attendre(c1, 300);
    const coche = await c1.evaluate(() => { const c = document.querySelector('#nu-allerg input[value="gluten"]'); return c ? c.checked : null; });
    ok("H3 : « Nouvelle semaine » garde les allergènes pris du questionnaire (Gluten coché, et dans le brouillon)", coche === true && (brouillons(db1).clients[C1].programme.allergenes || []).includes("gluten"), JSON.stringify([coche, brouillons(db1).clients[C1].programme.allergenes]));
    /* « Dupliquer sur » un repas changé par le client : la copie n'a pas la marque « Changé par ton client » */
    const R2 = REPAS(); R2.jours[0].repas[2].change_client = AUJ0;
    const db2 = base({ donnees: [[C1, "repas", R2]] });
    const { page: c2 } = await ouvrirCoach(b, db2);
    await c2.selectOption('[data-dup-sur="0:2"]', "tous");
    await attendreB(db2, B => B.clients && B.clients[C1]);
    const marques = brouillons(db2).clients[C1].programme.jours.reduce((n, j) => n + j.repas.filter(x => x.change_client).length, 0);
    ok("H4 : « Dupliquer sur » tous les jours un repas changé par le client : seul l'original garde « Changé par ton client » (le bilan ne compte pas 7 remplacements)", marques === 1, String(marques));
  });

  /* =================== F. ↑ ↓, « Dupliquer sur », écart de calories, nouvelle semaine =================== */
  await bloc("F. outils", async () => {
    const db = base();
    const R0 = REPAS();
    const { page: co } = await ouvrirCoach(b, db);
    await co.click('[data-descendre-r="0:0"]'); await attendreB(db, B => B.clients && B.clients[C1]);
    let j0 = brouillons(db).clients[C1].programme.jours[0].repas.map(x => x.nom);
    ok("F1 : ↓ sur le petit-déjeuner du lundi : il passe après le déjeuner (brouillon)", j0[0] === R0.jours[0].repas[1].nom && j0[1] === R0.jours[0].repas[0].nom, JSON.stringify(j0));
    await co.selectOption('[data-dup-sur="0:2"]', "1");
    await attendreB(db, B => B.clients[C1].programme.jours[1].repas.length === R0.jours[1].repas.length + 1);
    const j1 = brouillons(db).clients[C1].programme.jours[1].repas.map(x => x.nom);
    ok("F2 : « Dupliquer sur » Mardi : la collation du lundi est copiée dans le mardi, à sa place (par moment)", j1.length === R0.jours[1].repas.length + 1 && j1.filter(n => n === R0.jours[0].repas[2].nom).length >= 1, JSON.stringify(j1));
    const flag = await texte(co, "#nu-ecart-kcal");
    ok("F3 : « Ses calories » ≠ la diète (2 240) : un simple avertissement avec « Reprendre … kcal », rien n'est recalculé tout seul", /Ses calories \(.+\) ≠ cette diète \(2\s?240\)/.test(flag || "") && brouillons(db).clients[C1].programme.cible.kcal === 2240, flag);
    await co.click("#nu-reprendre-kcal");
    await attendreB(db, B => B.clients[C1].programme.cible.kcal !== 2240);
    ok("F4 : « Reprendre » : la cible du brouillon prend celle de « Ses calories »", brouillons(db).clients[C1].programme.cible.kcal !== 2240 && !(await co.evaluate(() => !!document.getElementById("nu-ecart-kcal"))), String(brouillons(db).clients[C1].programme.cible.kcal));
    /* nouvelle semaine */
    const dbn = base();
    const { page: cn } = await ouvrirCoach(b, dbn);
    await cn.click("#nu-nouveau-bloc"); await attendreB(dbn, B => B.clients && B.clients[C1] && B.clients[C1].nouveau_bloc); await attendre(cn, 300);
    const marques = await cn.evaluate(() => document.querySelectorAll("[data-repas-identique]").length);
    ok("F5 : « Nouvelle semaine à partir de celle-ci » : brouillon marqué, chaque repas du jour affiché porte « ≈ identique à la semaine d'avant », rien chez le client",
      marques === R0.jours[0].repas.length && ecr(dbn, "repas").length === 0 && /Nouvelle semaine type en préparation/.test(await texte(cn, "#nu-etat") || ""), String(marques));
    const r = await publier(cn);
    ok("F6 : publiée : une nouvelle semaine qui commence aujourd'hui", /^Publié/.test(r.msg || "") && publiee(dbn).debut === AUJ0, JSON.stringify([r.msg, publiee(dbn).debut]));
  });

  /* =================== G. en anglais =================== */
  await bloc("G. anglais", async () => {
    const db = base(); avecPrefsEn(db, COACH_ID);
    const { page: co } = await contexte(b, COACH, db, { langue: "en" });
    await co.goto(FICHE("nutrition")); await pret(co, "#nu-publier");
    const t = { pub: await texte(co, "#nu-publier"), nb: await texte(co, "#nu-nouveau-bloc"), autre: await texte(co, "[data-autre]") };
    ok("G1 : coach en anglais : « Publish changes », « New week from this one », « Change this meal »", t.pub === "Publish changes" && t.nb === "New week from this one" && t.autre === "Change this meal", JSON.stringify(t));
  });

  /* =================== Z. console, hôtes externes =================== */
  await bloc("Z. console et hôtes externes", async () => {
    const autres = Array.from(externes).filter(h => !/^(fonts\.(googleapis|gstatic)\.com|i\.ytimg\.com|img\.youtube\.com|www\.youtube-nocookie\.com)$/.test(h));
    ok("Z1 : aucune erreur de console ni erreur JS ni dialogue natif pendant la suite, aucun appel vers l'extérieur",
      ERREURS.length === 0 && autres.length === 0, JSON.stringify(ERREURS.slice(0, 5)) + " " + JSON.stringify(autres));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
