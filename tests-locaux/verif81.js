/* v72 — côté coach : « Nouveaux depuis ta dernière visite » (sujet E) et la source des inscrits (sujet F, côté coach).
   E. Tableau de bord du coach :
     E1  première visite (aucune clé coach_visite) : le panneau en haut (entre l'en-tête et les tuiles), « Première visite
         enregistrée : les inscrits des 7 derniers jours. », les prospects de moins de 7 jours du plus récent au plus ancien
         (prénom, « inscrit le jj/mm à hh:mm », numéro, Appeler / WhatsApp ou « — »), jamais un client ; UNE écriture, du
         coach chez lui-même, exactement { le, jusqua (inscription la plus récente), avant: null, avant_le: null } ;
     E2  rechargement dans les 30 min : même liste, aucune écriture ;
     E3  31 min plus tard : nouvelle visite (« Ta dernière visite : le … »), seuil = l'inscription la plus récente vue à la
         visite précédente : liste vide (« Aucun nouvel inscrit depuis ta dernière visite. ») puis un inscrit arrivé entre-temps
         apparaît (rechargement) ; une écriture { le, jusqua, avant = jusqua d'avant, avant_le = le d'avant } ;
     E4  visite des données fictives (récente) : aucune écriture ; une clé piégée est ignorée (première visite) ;
     E5  plus de 10 nouveaux : 10 lignes et « Et N autres : Prospects → » (ouvre Prospects sur « Tous ») ; 320 px ; prénom
         piégé échappé ; deux tuiles toujours, aucun bouton « Ouvrir » dans le panneau ;
     E6  Mes clients, Prospects, fiche : aucune écriture de visite ; Prospects triés du plus récent au plus ancien par défaut.
   Supabase simulé (gabarit de verif70 / verif80) : rien ne part vers la vraie base ; chaque écriture est notée. Comptes et
   numéros fictifs. Chaque bloc tourne à part (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif81.js ../index.html
           VERIF81_PORT=9971 node verif81.js ../index.html     (autre port, si 9970 est pris)
           VERIF81_BLOCS="E1,E3" node verif81.js …              (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const FT = require("./fichiers");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF81_PORT || 9970;
const BLOCS = (process.env.VERIF81_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const MOBILE = { width: 390, height: 844 }, PETIT = { width: 320, height: 640 }, LARGE = { width: 1280, height: 900 };

/* ---------- la page servie : comme les autres suites (téléphone obligatoire éteint, inscription du fichier) ---------- */
const server = http.createServer((req, res) => {
  if (FT.servirFichier(req, res, HTML)) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(fs.readFileSync(HTML, "utf8"));
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
const T0 = Date.now(), MIN = 60000, H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const norm = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const isoPres = (x, t) => typeof x === "string" && !isNaN(Date.parse(x)) && new Date(x).toISOString() === x && Math.abs(Date.parse(x) - t) < 20000;
const p2 = n => String(n).padStart(2, "0");
const quand = iso => { const d = new Date(iso); return p2(d.getDate()) + "/" + p2(d.getMonth() + 1) + " à " + p2(d.getHours()) + ":" + p2(d.getMinutes()); };

/* ---------- les personnes ---------- */
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: meta } : {}) });
const PID = k => "00000000-0000-4000-8000-0000000081" + String(k).padStart(2, "0");   // verif81 : …81kk
const COACH = { id: F.IDS.coach, email: "coach@exemple.fr" };
/* prospects : Zoé (2 h, numéro), Hugo (3 j, sans numéro), Ana (10 j), et un client récent (Thomas est client) */
const ZOE = PID(1), HUGO = PID(2), ANA = PID(3);
const TEL_ZOE = "+33639980011";

/* ---------- le décor : fixtures.js (coach, clients) + prospects ; visite : la clé coach_visite des fixtures gardée ou non ---------- */
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  profils.push({ id: ZOE, prenom: "Zoé", nom: "Martin", role: "client", statut: "prospect", cree_le: avant(2 * H) });
  profils.push({ id: HUGO, prenom: "Hugo", nom: "Bernard", role: "client", statut: "prospect", cree_le: avant(3 * J) });
  profils.push({ id: ANA, prenom: "Ana", nom: "Lopez", role: "client", statut: "prospect", cree_le: avant(10 * J) });
  (opts.profils || []).forEach(p => profils.push(p));
  let donnees = clone(F.donnees).concat([{ user_id: ZOE, outil: "contact", contenu: { telephone: TEL_ZOE, inscrit_le: avant(2 * H) }, maj_le: avant(2 * H) }], opts.extra || []);
  if (!opts.visite) donnees = donnees.filter(d => d.outil !== "coach_visite");
  return { profils, donnees, ecritures: [], lectures: [], chemins: [], inscriptions: [], emails: {}, meta: {}, inscription: {}, ko: {}, perdre: {} };
}

/* ---------- le faux Supabase (gabarit de verif70) ---------- */
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
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort(); }
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req);
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  db.chemins.push(m + " " + p);
  if (p.startsWith("/auth/v1/signup")) {   // déclencheur creer_profil : un profil prospect ; la session porte data en user_metadata
    const c = corps() || {}, data = c.data || {}; db.inscriptions.push(clone(c));
    const id = db.inscription.id || PID(99); db.emails[id] = c.email; db.meta[id] = clone(data);
    db.profils.push({ id, prenom: data.prenom || "", nom: data.nom || "", role: "client", statut: "prospect", cree_le: new Date().toISOString() });
    return json(session(id, c.email, data));
  }
  if (p.startsWith("/auth/v1/token")) {
    const c = corps() || {}, r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || ""));
    const id = r1 && r1[1];
    if (!id) return json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
    return json(session(id, db.emails[id] || "", db.meta[id]));
  }
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  if (p.startsWith("/auth/v1/logout")) return json(null, 204);
  if (p.startsWith("/auth/v1/user")) return moi ? json(Object.assign({ id: moi, email: db.emails[moi] || "", role: "authenticated" }, db.meta[moi] ? { user_metadata: clone(db.meta[moi]) } : {})) : json({ msg: "invalid JWT" }, 401);
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
      db.lectures.push({ par: moi, uid, outil: o, select: q.get("select") || "*" });
      if (cleEq && db.ko[cleEq]) return json({ message: "panne simulée" }, 500);
      let l = db.donnees.filter(x => coach || (x.user_id === moi && !ILLISIBLES_PROPRIO.includes(x.outil)));
      if (uid) l = l.filter(x => x.user_id === uid);
      return json(colonnes(plage(parOutil(l, o)), q));
    }
    if (m === "POST") {
      let rows = corps(); rows = Array.isArray(rows) ? rows : rows ? [rows] : [];
      const refuse = rows.find(row => !permis(moi, coach, row));
      if (refuse) { db.ecritures.push({ table: "donnees", m, refus: true, outil: refuse.outil, user_id: refuse.user_id }); return json({ code: "42501", message: 'new row violates row-level security policy for table "donnees"' }, 403); }
      if (rows.some(x => db.perdre[x.outil] > 0)) { rows.forEach(x => { if (db.perdre[x.outil] > 0) db.perdre[x.outil]--; }); db.ecritures.push({ table: "donnees", m, perdue: true, outil: rows[0].outil }); return r.abort("failed"); }
      const upsert = q.has("on_conflict"), out = [];
      for (const row of rows) {
        const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
        if (i > -1 && !upsert) return json({ code: "23505", message: "duplicate key value violates unique constraint" }, 409);
        const ligne = { user_id: row.user_id, outil: row.outil, contenu: clone(row.contenu), maj_le: row.maj_le || new Date().toISOString() };
        if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        db.ecritures.push(Object.assign({ table: "donnees", m }, clone(ligne)));
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

/* ---------- un navigateur (contexte) ----------
   opts : viewport (MOBILE par défaut), langue ("en"), qui (compte connecté : { id, email }), stockage ({ clé: valeur }),
   neuf (appareil sans aucune trace : ni mhx_installe ni mhx_visites), autonome (app lancée depuis l'écran d'accueil) */
async function contexte(b, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || MOBILE });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  if (opts.horloge) await c.clock.install({ time: Date.now() });   // horloge contrôlée (qui continue de tourner) : avancer de 31 min
  await c.route("**/*", r => repondre(r, db));
  if (opts.qui) db.emails[opts.qui.id] = opts.qui.email;
  await c.addInitScript(({ langue, s, stockage, neuf, autonome }) => {
    if (!/^https?:$/.test(location.protocol)) return;
    if (autonome) Object.defineProperty(navigator, "standalone", { get: () => true });
    if (!localStorage.getItem("__init")) {   // l'appareil n'est préparé qu'une fois : un rechargement le garde
      localStorage.setItem("__init", "1");
      if (!neuf){ localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); }
      if (langue) localStorage.setItem("mhx_langue", langue);
      if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
      Object.keys(stockage || {}).forEach(k => localStorage.setItem(k, stockage[k]));
    }
  }, { langue: opts.langue || "", s: opts.qui ? session(opts.qui.id, opts.qui.email) : null, stockage: opts.stockage || null, neuf: !!opts.neuf, autonome: !!opts.autonome });
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return { c, page };
}
const attendre = (page, ms) => page.waitForTimeout(ms);
const pret = async page => { await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 }); await attendre(page, 400); };
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.table === "donnees" && e.outil === outil && !e.refus && !e.perdue && (!uid || e.user_id === uid));
const resume = db => JSON.stringify(db.ecritures.map(e => (e.table === "donnees" ? e.outil : e.table) + ":" + e.m));
const ligne0 = (db, uid, outil) => db.donnees.find(d => d.user_id === uid && d.outil === outil) || null;
const visites = db => ecr(db, "coach_visite");
/* le panneau tel qu'affiché */
const panneau = page => page.evaluate(() => {
  const s = document.getElementById("tb-nouveaux"); if (!s) return null;
  const head = document.querySelector("#tb-vue header.masthead"), tuiles = document.querySelector("#tb-vue .tb-tiles");
  return { h2: (s.querySelector("h2") || {}).textContent, note: ((s.querySelector("p.note") || {}).textContent || "").replace(/[  ]/g, " ").trim(),
    vide: ((s.querySelector("p.empty") || {}).textContent || "").trim(),
    lignes: Array.from(s.querySelectorAll(".tb-liste li")).map(li => ({ prenom: (li.querySelector("b") || {}).textContent, quand: ((li.querySelector("small") || {}).textContent || "").trim(),
      tel: ((li.querySelector(".tb-nv-tel") || {}).textContent || "").replace(/\s+/g, " ").trim(), liens: Array.from(li.querySelectorAll("a")).map(a => a.getAttribute("href")) })),
    autres: ((s.querySelector("[data-tb-tous]") || {}).textContent || "").trim(), autresTexte: ((s.querySelector("[data-tb-tous]") || { parentNode: {} }).parentNode.textContent || "").replace(/\s+/g, " ").trim(),
    ordre: !!(head && tuiles && (head.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING) && (s.compareDocumentPosition(tuiles) & Node.DOCUMENT_POSITION_FOLLOWING)),
    nTuiles: document.querySelectorAll("#tb-vue .tb-tuile").length, ouvrir: s.querySelectorAll("[data-fiche], button").length, img: !!s.querySelector("img"),
    sw: document.documentElement.scrollWidth, iw: window.innerWidth };
});
const PREMIERE = "Première visite enregistrée : les inscrits des 7 derniers jours.", VIDE = "Aucun nouvel inscrit depuis ta dernière visite.", H2 = "Nouveaux depuis ta dernière visite";

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF81_PORT=9971 node verif81.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();
  const URL0 = `http://localhost:${PORT}/`;

  /* =================== E. Nouveaux depuis ta dernière visite =================== */
  await bloc("E1. première visite, rechargement, visite suivante", async () => {
    const db = base();
    const { page } = await contexte(b, db, { qui: COACH, viewport: LARGE, horloge: true });
    const t1 = Date.now();
    await page.goto(URL0); await pret(page); await page.waitForSelector("#tb-nouveaux"); await attendre(page, 600);
    const p1 = await panneau(page), V1 = visites(db);
    ok("E1 : première visite : « Nouveaux depuis ta dernière visite » en haut du tableau de bord (entre l'en-tête et les tuiles, deux tuiles toujours, aucun bouton « Ouvrir »), « " + PREMIERE + " »",
      !!p1 && p1.h2 === H2 && p1.note === PREMIERE && p1.ordre && p1.nTuiles === 2 && p1.ouvrir === 0, JSON.stringify(p1));
    ok("E1 : les prospects inscrits depuis moins de 7 jours, du plus récent au plus ancien (Zoé il y a 2 h, Hugo il y a 3 j ; pas Ana, 10 j ; jamais un client) : prénom, « inscrit le jj/mm à hh:mm », numéro + Appeler / WhatsApp (Zoé) ou « — » (Hugo)",
      !!p1 && JSON.stringify(p1.lignes.map(l => l.prenom)) === '["Zoé","Hugo"]' && p1.lignes[0].quand === "inscrit le " + quand(avant(2 * H)) && p1.lignes[1].quand === "inscrit le " + quand(avant(3 * J))
        && p1.lignes[0].tel === TEL_ZOE + " Appeler WhatsApp" && JSON.stringify(p1.lignes[0].liens) === JSON.stringify(["tel:" + TEL_ZOE, "https://wa.me/33639980011"]) && p1.lignes[1].tel === "—" && !p1.lignes[1].liens.length,
      JSON.stringify(p1 && p1.lignes));
    const c1 = V1[0] && V1[0].contenu;
    ok("E1 : UNE écriture, du coach chez lui-même (clé coach_visite), exactement { le: maintenant, jusqua: l'inscription la plus récente (Zoé), avant: null, avant_le: null }",
      V1.length === 1 && V1[0].user_id === COACH.id && JSON.stringify(Object.keys(c1)) === '["le","jusqua","avant","avant_le"]' && isoPres(c1.le, t1) && c1.jusqua === avant(2 * H) && c1.avant === null && c1.avant_le === null
        && db.ecritures.length === 1,
      JSON.stringify(V1) + " · " + resume(db));
    await page.reload(); await pret(page); await page.waitForSelector("#tb-nouveaux"); await attendre(page, 500);
    const p2_ = await panneau(page);
    ok("E2 : rechargement dans les 30 min : la même visite, la même liste, aucune écriture", !!p2_ && p2_.note === PREMIERE && JSON.stringify(p2_.lignes.map(l => l.prenom)) === '["Zoé","Hugo"]' && visites(db).length === 1 && db.ecritures.length === 1,
      JSON.stringify({ p2_, ecr: resume(db) }));
    await page.clock.fastForward(31 * MIN); await page.reload(); await pret(page); await page.waitForSelector("#tb-nouveaux"); await attendre(page, 500);
    const t3 = await page.evaluate(() => Date.now());
    const p3 = await panneau(page), V3 = visites(db);
    ok("E3 : 31 min plus tard : nouvelle visite, « Ta dernière visite : le jj/mm à hh:mm. », aucun inscrit depuis : « " + VIDE + " »",
      !!p3 && p3.note === "Ta dernière visite : le " + quand(c1.le) + "." && !p3.lignes.length && p3.vide === VIDE, JSON.stringify(p3));
    const c3 = V3[1] && V3[1].contenu;
    ok("E3 : … une écriture de plus : { le: maintenant, jusqua: la même inscription la plus récente, avant: l'ancien jusqua, avant_le: l'ancien le }",
      V3.length === 2 && isoPres(c3.le, t3) && c3.jusqua === avant(2 * H) && c3.avant === c1.jusqua && c3.avant_le === c1.le, JSON.stringify(V3.map(x => x.contenu)));
    db.profils.push({ id: PID(4), prenom: "Inès", nom: "Moreau", role: "client", statut: "prospect", cree_le: new Date(t3 - MIN).toISOString() });
    await page.reload(); await pret(page); await page.waitForSelector("#tb-nouveaux"); await attendre(page, 500);
    const p4 = await panneau(page);
    ok("E3 : un prospect inscrit pendant la visite apparaît au rechargement (Inès), sans nouvelle écriture", !!p4 && JSON.stringify(p4.lignes.map(l => l.prenom)) === '["Inès"]' && visites(db).length === 2, JSON.stringify({ p4, ecr: resume(db) }));
  });
  await bloc("E4. visite récente, clé piégée", async () => {
    { const db = base({ visite: true });
      const { page } = await contexte(b, db, { qui: COACH, viewport: LARGE });
      await page.goto(URL0); await pret(page); await page.waitForSelector("#tb-nouveaux"); await attendre(page, 800);
      const p = await panneau(page), V = ligne0(db, COACH.id, "coach_visite").contenu;
      ok("E4 : visite récente (données fictives, au lancement de la suite) : même visite, aucune écriture ; seuil = sa valeur « avant » : aucun nouvel inscrit (Zoé est plus ancienne)",
        !!p && p.note === "Ta dernière visite : le " + quand(V.avant_le) + "." && p.vide === VIDE && db.ecritures.length === 0, JSON.stringify({ p, ecr: resume(db) })); }
    { const db = base({ extra: [{ user_id: COACH.id, outil: "coach_visite", contenu: { le: "<img src=x onerror=alert(1)>", jusqua: 3, avant: "demain" }, maj_le: avant(J) }] });
      const { page } = await contexte(b, db, { qui: COACH, viewport: LARGE });
      await page.goto(URL0); await pret(page); await page.waitForSelector("#tb-nouveaux"); await attendre(page, 600);
      const p = await panneau(page), V = visites(db);
      ok("E4 : clé de visite piégée ou illisible : ignorée (première visite, aucune balise injectée), puis remplacée par une visite propre",
        !!p && p.note === PREMIERE && !p.img && V.length === 1 && Object.values(V[0].contenu).every(x => x === null || /^\d{4}-\d{2}-\d{2}T/.test(x)), JSON.stringify({ p, V })); }
  });
  await bloc("E5. beaucoup d'inscrits, 320 px", async () => {
    const plus = Array.from({ length: 13 }, (_, k) => ({ id: PID(20 + k), prenom: k === 0 ? "<img src=x onerror=alert(1)>" : "Prospect" + k, nom: "Test", role: "client", statut: "prospect", cree_le: avant((k + 1) * 10 * MIN) }));
    const db = base({ profils: plus });
    const { page } = await contexte(b, db, { qui: COACH, viewport: PETIT });
    await page.goto(URL0); await pret(page); await page.waitForSelector("#tb-nouveaux"); await attendre(page, 600);
    const p = await panneau(page);
    ok("E5 : 15 nouveaux : 10 lignes, puis « Et 5 autres : Prospects → » ; prénom piégé affiché comme du texte ; 320 px sans défilement horizontal",
      !!p && p.lignes.length === 10 && p.autresTexte === "Et 5 autres : Prospects →" && p.lignes[0].prenom === "<img src=x onerror=alert(1)>" && !p.img && p.sw <= p.iw, JSON.stringify(p));
    await page.click("#tb-nouveaux [data-tb-tous]"); await pret(page); await page.waitForSelector(".sc-carte"); await attendre(page, 400);
    const f = await page.evaluate(() => ({ hash: location.hash, filtre: (document.querySelector('[data-filtre][aria-pressed="true"]') || {}).dataset, tri: (document.getElementById("pr-tri") || {}).value }));
    ok("E5 : « Prospects → » ouvre Prospects sur « Tous », triés par inscription récente", f.hash === "#/prospects" && f.filtre && f.filtre.filtre === "tous" && f.tri === "inscription", JSON.stringify(f));
  });
  await bloc("E6. autres pages, tri des Prospects", async () => {
    const db = base();
    const { page } = await contexte(b, db, { qui: COACH, viewport: LARGE });
    await page.goto(URL0 + "#/clients"); await pret(page); await page.waitForSelector("#tb-clients [data-ouvrir]");
    await page.evaluate(() => { location.hash = "#/prospects"; }); await pret(page); await page.waitForSelector("#pr-liste"); await attendre(page, 400);
    await page.click('[data-filtre="tous"]'); await attendre(page, 500);
    const o = await page.evaluate(() => ({ tri: document.getElementById("pr-tri").value, uids: Array.from(document.querySelectorAll(".sc-carte")).map(c => c.dataset.uid) }));
    await page.evaluate(id => Clients.ouvrir(id, "Zoé Martin", "accueil"), ZOE); await attendre(page, 2000);
    ok("E6 : Mes clients, Prospects et une fiche (sans passer par le tableau de bord) : aucune écriture de visite", visites(db).length === 0 && db.ecritures.length === 0, resume(db));
    ok("E6 : Prospects (« Tous ») : tri par défaut « inscription récente », du plus récent au plus ancien (Zoé, Hugo, Ana)", o.tri === "inscription" && JSON.stringify(o.uids) === JSON.stringify([ZOE, HUGO, ANA]), JSON.stringify(o));
  });

  /* =================== F. la source des inscrits (côté coach) =================== */
  await bloc("F. source", async () => {
    const pros = [
      { id: PID(40), prenom: "Paul", nom: "Ancien", role: "client", statut: "prospect", cree_le: avant(40 * J) },
      { id: PID(41), prenom: "Testeur", nom: "Interne", role: "client", statut: "prospect", cree_le: avant(5 * J) },
      { id: PID(42), prenom: "Léon", nom: "Client", role: "client", statut: "client", cree_le: avant(20 * J) },
      { id: PID(43), prenom: "Piège", nom: "Code", role: "client", statut: "prospect", cree_le: avant(45 * J) }
    ];
    const extra = [
      { user_id: HUGO, outil: "contact", contenu: { inscrit_le: avant(3 * J) }, maj_le: avant(3 * J) },
      { user_id: ANA, outil: "contact", contenu: { ref: "tiktok", inscrit_le: avant(10 * J) }, maj_le: avant(10 * J) },
      { user_id: PID(40), outil: "contact", contenu: { ref: "insta" }, maj_le: avant(40 * J) },
      { user_id: PID(41), outil: "contact", contenu: { ref: "insta" }, maj_le: avant(5 * J) },
      { user_id: PID(41), outil: "intake", contenu: { email_compte: "lucas+test@exemple.fr", court_debut: avant(5 * J) }, maj_le: avant(5 * J) },
      { user_id: PID(42), outil: "contact", contenu: { ref: "salon" }, maj_le: avant(20 * J) },
      { user_id: PID(42), outil: "intake", contenu: { court_le: avant(20 * J), court_debut: avant(20 * J) }, maj_le: avant(20 * J) },
      { user_id: PID(43), outil: "contact", contenu: { ref: "<b>x</b>" }, maj_le: avant(45 * J) }
    ];
    const db = base({ profils: pros, extra });
    const zoe = db.donnees.find(d => d.user_id === ZOE && d.outil === "contact"); zoe.contenu.ref = "insta";
    const { page } = await contexte(b, db, { qui: COACH, viewport: LARGE });
    await page.goto(URL0); await pret(page); await page.waitForSelector("#tb-sources");
    const s = await page.evaluate(() => { const S = document.getElementById("tb-sources");
      return { h2: S.querySelector("h2").textContent, lignes: Array.from(S.querySelectorAll("tbody tr")).map(tr => Array.from(tr.querySelectorAll("td")).map(td => td.textContent.trim())),
        total: Array.from(S.querySelectorAll("tfoot td")).map(td => td.textContent.trim()) }; });
    ok("F : tableau de bord « Inscrits par source » (30 derniers jours, hors comptes de test) : insta 1 (Zoé ; pas Paul, 40 j, ni le compte de test), salon 1 (Léon, passé client), tiktok 1 (Ana), — 1 (Hugo, sans code) ; total 4",
      s.h2 === "Inscrits par source" && JSON.stringify(s.lignes) === JSON.stringify([["insta", "1"], ["salon", "1"], ["tiktok", "1"], ["—", "1"]]) && JSON.stringify(s.total) === '["Total","4"]',
      JSON.stringify(s));
    await page.evaluate(() => { location.hash = "#/prospects"; }); await pret(page); await page.waitForSelector("#pr-liste"); await page.click('[data-filtre="tous"]'); await attendre(page, 500);
    const c = await page.evaluate(ids => ids.map(id => { const x = document.querySelector('.sc-carte[data-uid="' + id + '"] .sc-source'); return x ? x.textContent.replace(/\s+/g, " ").trim() : null; }), [ZOE, HUGO, PID(43)]);
    ok("F : cartes Prospects : « Source : insta » (Zoé), « Source : — » (Hugo, sans code ; code piégé : « — », aucune balise)", JSON.stringify(c) === JSON.stringify(["Source : insta", "Source : —", "Source : —"]), JSON.stringify(c));
    await page.evaluate(id => Clients.ouvrir(id, "Zoé Martin", "accueil"), ZOE); await attendre(page, 2000);
    const f1 = await page.evaluate(() => (document.getElementById("fiche-source") || {}).textContent);
    await page.evaluate(id => Clients.ouvrir(id, "Thomas Démo", "accueil"), F.IDS.c1); await attendre(page, 2000);
    const f2 = await page.evaluate(() => (document.getElementById("fiche-source") || {}).textContent);
    ok("F : fiche : « Source : insta » (Zoé) ; « Source : — » (Thomas, sans code)", f1 === "Source : insta" && f2 === "Source : —", JSON.stringify({ f1, f2 }));
    const d0 = base({ profils: [] }); d0.profils = d0.profils.filter(p => p.statut !== "prospect"); d0.donnees = d0.donnees.filter(d => d.outil !== "contact");
    const { page: p0 } = await contexte(b, d0, { qui: COACH, viewport: PETIT });
    await p0.goto(URL0); await pret(p0); await p0.waitForSelector("#tb-sources");
    const v = await p0.evaluate(() => ({ t: ((document.querySelector("#tb-sources .empty") || {}).textContent || "").trim(), sw: document.documentElement.scrollWidth, iw: innerWidth }));
    ok("F : aucun inscrit sur 30 jours : « Aucun inscrit sur les 30 derniers jours. » ; 320 px sans défilement horizontal", v.t === "Aucun inscrit sur les 30 derniers jours." && v.sw <= v.iw, JSON.stringify(v));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
