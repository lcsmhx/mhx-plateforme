/* v51 — dernière série de corrections (après verif53) vérifiée de bout en bout dans un vrai navigateur :
   A. activité du prospect, deux onglets du même navigateur (localStorage partagé) et la copie locale
      « mhx_activite_attente|<uid> » laissée par un onglet fermé : relectures lentes (800 ms), onglet 1 masqué puis
      onglet 2 100 ms plus tard (et en même temps) → la copie compte une fois (verrou-suivi 5, jamais 10 ; temps
      60 + 300 + temps visible, jamais + 600), copie retirée ; un onglet fermé qui ajoute à la copie pendant la relecture
      de cet onglet → rien de perdu, rien compté deux fois ;
   B. « Rester connecté » décoché (session dans sessionStorage) : la copie locale vit quand même dans localStorage
      (vrai rechargement, onglet fermé puis nouvel onglet), envoyée une seule fois ; onglet dupliqué (window.open copie
      le sessionStorage) : rien compté deux fois, masqué après l'autre ou en même temps ;
   C. Nouveautés, « Tout marquer comme vu » (horloge contrôlée) : un autre appareil a marqué vu plus tard → la date
      ne recule jamais ; un prospect inscrit entre l'affichage et le clic reste une nouveauté (vu = instant du
      chargement, pas du clic) ;
   D. bandeau de première connexion d'un client : 1 réponse obligatoire manque, 2, beaucoup ; jamais « Une question a
      été ajoutée » ; ancien prospect (court_debut ou questionnaire validé) et témoin sans court_debut ;
   E. fiche coach, chronologie : email de suivi « abandon » → « non délivré (adresse bloquée ou invalide) », « envoye »
      → « envoyé » ;
   F. Profil du prospect, « Emails de suivi » (v52 : « Newsletter ») : phrase sur la désinscription depuis la messagerie (FR / EN) ;
   G. déconnexion, double clic pendant un envoi d'activité (relecture lente) : une seule déconnexion, l'activité est
      écrite avant l'effacement de l'appareil.
   Supabase simulé (celui de verif53) : rien ne part vers la vraie base ; chaque écriture est appliquée en mémoire et
   notée, chaque lecture de « donnees » aussi ; lectures lentes par clé (db.retardLecture). Dates relatives au
   lancement. Chaque bloc tourne à part (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif54.js ../index.html
           VERIF54_PORT=9702 node verif54.js ../index.html     (autre port, si 9696 est pris)
           VERIF54_BLOCS="A.,G." node verif54.js …              (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const PORT = +process.env.VERIF54_PORT || 9696;
const BLOCS = (process.env.VERIF54_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const { servirFichier } = require("./fichiers");   // 52.1 : la page charge css/ et js/, servis depuis son dossier (fichiers.js)
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML)) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(fs.readFileSync(HTML, "utf8"));
});
const res = []; const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
const norm = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const T0 = Date.now(), H = 3600000, J = 86400000, MIN = 60000;
const avant = ms => new Date(T0 - ms).toISOString();
const ilYA = n => { const d = new Date(T0); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return iso(d); };
const midiIlYA = n => { const d = new Date(T0); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d.toISOString(); };
const fr = v => { const j = iso(new Date(v)); return j.slice(8, 10) + "/" + j.slice(5, 7) + "/" + j.slice(0, 4); };
const hm = v => { const d = new Date(v); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
const ajd = () => iso(new Date());   // « aujourd'hui » au moment du contrôle
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "donnees", f), "utf8"));
const CATALOGUE = Object.assign({}, F.catalogue, { aliments: lireDonnees("aliments.json"), recettes: lireDonnees("recettes.json") });
const PID = k => "00000000-0000-4000-8000-0000000054" + String(k).padStart(2, "0");
const COACH_SEUL = ["notes_coach", "suivi_prospect", "feedbacks"];

/* ---------- le faux Supabase (celui de verif53) ---------- */
const ouverts = [];
const MAX_LIGNES = 1000;
async function bloc(nom, fn){
  if (BLOCS.length && !BLOCS.some(x => nom.startsWith(x))) return;
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); }
}
/* profils et données de fixtures.js (clients Thomas, Sarah, Julien), plus les comptes du bloc (prospects ou clients) */
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  const donnees = clone(F.donnees);
  donnees.forEach(d => { if (d.user_id === F.IDS.c3) d.maj_le = avant(12 * J + 3 * H); });
  const db = { profils, donnees, emails_prospects: [], ecritures: [], lectures: [], journal: [], chemins: [], lectureKo: opts.lectureKo || [] };
  (opts.comptes || []).forEach(x => {
    profils.push({ id: x.id, prenom: x.prenom, nom: x.nom, role: "client", statut: x.statut || "prospect", cree_le: x.cree });
    (x.donnees || []).forEach(([outil, contenu, maj]) => donnees.push({ user_id: x.id, outil, contenu: clone(contenu), maj_le: maj }));
  });
  (opts.cles || []).forEach(([uid, outil, contenu, maj]) => donnees.push({ user_id: uid, outil, contenu: clone(contenu), maj_le: maj || avant(J) }));
  return db;
}
/* order=a.desc,b.asc (PostgREST) */
function ordonner(l, order){
  const cles = String(order || "").split(",").filter(Boolean).map(x => { const [k, sens] = x.split("."); return { k, desc: sens === "desc" }; });
  if (!cles.length) return l;
  const v = (x, k) => (x && typeof x === "object" && x[k] != null) ? String(x[k]) : "";
  return l.slice().sort((a, b) => { for (const { k, desc } of cles) { const x = v(a, k), y = v(b, k); if (x !== y) return (x < y ? -1 : 1) * (desc ? -1 : 1); } return 0; });
}
async function repondre(r, who, db){
  const req = r.request(); const u = req.url(); const host = new URL(u).hostname;
  if (host === "localhost") return r.continue();
  if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" });
  if (!host.endsWith(".supabase.co")) return r.abort();
  const url = new URL(u); const p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});   // page fermée entre-temps
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const estCoach = !!who && who.id === F.IDS.coach;
  db.chemins.push(m + " " + p);
  /* v53 : fonction supprimée — plus de fausse fonction « emails-prospects » (reprise de verif53, jamais appelée ici) */
  if (p.startsWith("/auth/v1/token")) return json(who ? who.session : { error: "invalid" }, who ? 200 : 400);
  if (p.startsWith("/auth/v1/logout")) { db.journal.push("LOGOUT"); db.ecritures.push({ table: p, m }); return json({}); }
  if (!["GET", "HEAD", "OPTIONS"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m });
  if (p.startsWith("/auth/v1/")) return json({});
  if (p === "/rest/v1/emails_prospects") {
    if (!estCoach) return json([]);
    let l = db.emails_prospects.slice();
    const sel = (q.get("select") || "*").split(","); l = plage(l); if (!sel.includes("*")) l = l.map(x => (x && typeof x === "object") ? Object.fromEntries(sel.map(k => [k, x[k]])) : x);
    return json(l);
  }
  if (p === "/rest/v1/profils") {
    if (m !== "GET") { db.ecritures.push({ table: "profils", m }); return json(null, 204); }
    const id = q.get("id"); const l = id ? db.profils.filter(x => x.id === id.slice(3)) : db.profils.slice();
    return json(plage(l));
  }
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "", mj = q.get("maj_le");
    const cleEq = o.startsWith("eq.") ? o.slice(3) : null;
    if (m === "PATCH") {
      let corps = {}; try { corps = JSON.parse(req.postData() || "{}"); } catch (e) { }
      if (!estCoach && (COACH_SEUL.includes(cleEq) || uid !== (who && who.id))) return json({ message: "rls" }, 403);
      const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj == null ? true : mj === "is.null" ? !x.maj_le : mj.startsWith("eq.") ? x.maj_le === decodeURIComponent(mj.slice(3)) : false));
      if (!row) return json([]);
      row.contenu = corps.contenu; row.maj_le = corps.maj_le;
      db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq, contenu: clone(corps.contenu) }); db.journal.push("E " + cleEq);
      return json([row]);
    }
    if (m === "POST") {
      let rows = []; try { rows = JSON.parse(req.postData() || "[]"); } catch (e) { }
      rows = Array.isArray(rows) ? rows : [rows];
      if (rows.some(row => !estCoach && (COACH_SEUL.includes(row.outil) || row.user_id !== (who && who.id)))) return json({ message: "rls" }, 403);
      const lent = Math.max(0, ...rows.map(row => (db.retard || {})[row.outil] || 0));
      if (lent){ db.journal.push("P " + rows.map(row => row.outil).join(",")); await new Promise(z => setTimeout(z, lent)); }
      const upsert = u.indexOf("on_conflict") > -1, out = [];
      for (const row of rows) {
        const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
        if (i > -1 && !upsert) return json({ code: "23505", message: "duplicate key" }, 409);
        const ligne = { user_id: row.user_id, outil: row.outil, contenu: row.contenu, maj_le: row.maj_le || new Date().toISOString() };
        if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        db.ecritures.push({ table: "donnees", m, user_id: row.user_id, outil: row.outil, contenu: clone(row.contenu), maj_le: ligne.maj_le }); db.journal.push("E " + row.outil);
        out.push(ligne);
      }
      return (req.headers()["prefer"] || "").indexOf("return=representation") > -1 ? json(out, 201) : json(null, 201);
    }
    if (m !== "GET") { db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq }); return json(null, 204); }
    db.lectures.push({ uid, outil: o, select: q.get("select") || "*" }); db.journal.push("L " + (cleEq || o));
    if (cleEq && (db.retardLecture || {})[cleEq]) await new Promise(z => setTimeout(z, db.retardLecture[cleEq]));   // réponse lente
    if (cleEq && db.lectureKo.includes(cleEq)) return json({ message: "panne" }, 500);
    let l = db.donnees;
    if (who && !estCoach) l = l.filter(x => x.user_id === who.id && !COACH_SEUL.includes(x.outil));
    if (uid) l = l.filter(x => x.user_id === uid);
    if (o.startsWith("eq.")) l = l.filter(x => x.outil === o.slice(3));
    if (o.startsWith("in.(")) { const k = o.slice(4, -1).split(","); l = l.filter(x => k.includes(x.outil)); }
    if (o.startsWith("not.in.(")) { const k = o.slice(8, -1).split(","); l = l.filter(x => !k.includes(x.outil)); }
    l = plage(l);
    const sel = (q.get("select") || "*").split(","); if (!sel.includes("*")) l = l.map(x => Object.fromEntries(sel.map(k => [k, x[k]])));
    return json(l);
  }
  const t = p.replace("/rest/v1/", "");
  if (CATALOGUE[t]) return json(plage(CATALOGUE[t]));
  return json([]);
}
/* opts.persistant === false : « Rester connecté » décoché, la session est rangée dans l'onglet (sessionStorage) */
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || { width: 1280, height: 900 } });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, who, db));
  await c.addInitScript(({ s, stock, langue, persistant }) => {
    if (!/^https?:$/.test(location.protocol)) return;   // about:blank (fermeture simulée) : pas de stockage
    /* ce que l'appareil (localStorage) et l'onglet (sessionStorage) gardent au chargement, avant que l'app ne tourne */
    const copies = m => { const o = {}; for (let i = 0; i < m.length; i++) { const k = m.key(i); if (/^mhx_(activite_)?attente\|/.test(k)) o[k] = m.getItem(k); } return o; };
    try { window.__auChargement = copies(localStorage); } catch (e) { window.__auChargement = null; }
    try { window.__auChargementSession = copies(sessionStorage); } catch (e) { window.__auChargementSession = null; }
    window.__toasts = [];
    try { new MutationObserver(ms => ms.forEach(mu => mu.addedNodes.forEach(n => { if (n.nodeType === 1 && n.classList && n.classList.contains("toast")) window.__toasts.push(n.textContent); }))).observe(document, { childList: true, subtree: true }); } catch (e) { }
    /* l'appareil (localStorage, partagé par tous les onglets du contexte) n'est préparé qu'une fois */
    if (!localStorage.getItem("__init")) {
      localStorage.setItem("__init", "1");
      if (s && persistant) localStorage.setItem("mhx_session", JSON.stringify(s));
      localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
      if (langue) localStorage.setItem("mhx_langue", langue);
      Object.keys(stock).forEach(k => localStorage.setItem(k, stock[k]));
    }
    /* session non persistante : un onglet neuf se reconnecte (sans « Rester connecté ») ; un onglet dupliqué
       (window.open) a reçu une copie du sessionStorage de l'autre, drapeau compris ; un rechargement garde le sien */
    if (s && !persistant && !sessionStorage.getItem("__init")) { sessionStorage.setItem("__init", "1"); sessionStorage.setItem("mhx_session", JSON.stringify(s)); }
  }, { s: who ? who.session : null, stock: opts.stockage || {}, langue: opts.langue || "", persistant: opts.persistant !== false });
  if (opts.horloge) await c.clock.install(opts.horloge === true ? undefined : { time: opts.horloge });   // horloge contrôlée (qui continue de tourner)
  const page = await nouvellePage(c);
  return { c, page };
}
function surveiller(page){
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF"); d.dismiss(); });
  return page;
}
async function nouvellePage(c){ return surveiller(await c.newPage()); }
const sessionDe = (id, email, expire) => { const s = F.session(id, email); if (expire) s.expire_le = expire; return s; };
const qui = (id, email, expire) => ({ id, email, session: sessionDe(id, email, expire) });
const coach = qui(F.IDS.coach, "c@e.fr");
const attendre = (page, ms) => page.waitForTimeout(ms);
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1600); };
const texte = async (page, sel) => norm(await page.textContent(sel || "#vue").catch(() => ""));
const filtre = async (page, f) => { await page.click(`[data-filtre="${f}"]`); await attendre(page, 350); };
const badge = page => page.$$eval('#nav a[data-id="prospects"] .nav-badge, #barre-bas a[data-id="prospects"] .nav-badge', l => l.map(e => e.textContent.trim())).catch(() => []);
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.outil === outil && (!uid || e.user_id === uid));
const contenu = (db, outil, uid) => (db.donnees.find(x => x.user_id === uid && x.outil === outil) || {}).contenu;
const couvre = (o, k) => {
  o = String(o || ""); if (!o) return true;
  const liste = t => t.replace(/^\(|\)$/g, "").split(",").map(x => x.trim().replace(/^"|"$/g, ""));
  if (o.startsWith("eq.")) return o.slice(3) === k;
  if (o.startsWith("in.")) return liste(o.slice(3)).includes(k);
  if (o.startsWith("not.in.")) return !liste(o.slice(7)).includes(k);
  return true;
};
/* lectures du CONTENU d'une clé (le Store relit aussi la seule date maj_le d'une copie en attente : ce n'est pas une lecture du contenu) */
const lu = (db, outil, depuis) => db.lectures.slice(depuis || 0).filter(x => couvre(x.outil, outil) && x.select !== "maj_le").length;
const luDirect = (db, outil, depuis) => db.lectures.slice(depuis || 0).filter(x => x.outil === "eq." + outil && x.select !== "maj_le").length;
const memes = (a, b) => { const t = o => JSON.stringify(Object.keys(o || {}).sort().map(k => [k, o[k]])); return t(a) === t(b); };
const cacher = page => page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }); document.dispatchEvent(new Event("visibilitychange")); });
const montrer = page => page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" }); document.dispatchEvent(new Event("visibilitychange")); });
const lireLocal = (page, k) => page.evaluate(k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return "illisible"; } }, k);
const lireSession = (page, k) => page.evaluate(k => { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return "illisible"; } }, k);
const enVol = page => page.evaluate(() => Activite._envoi).catch(() => null);
const journalAct = db => db.journal.filter(x => x.endsWith(" activite"));
async function ouvrirFiche(page, uid){
  if (!(await page.$("#pr-vue"))) await aller(page, "#/prospects", 2200);
  await page.waitForSelector("#pr-liste", { timeout: 8000 });
  await filtre(page, "tous");
  await page.click(`#pr-liste .sc-carte[data-uid="${uid}"] [data-sc="fiche"]`);
  await page.waitForSelector("#fiche-reponses", { timeout: 6000 }); await attendre(page, 500);   // v53 (chantier 4) : #fiche-score n'existe plus
}
const nvVisibles = (page, sel) => page.$$eval(sel + " .nv-liste li", l => l.filter(li => !li.closest("[hidden]")).map(li => li.querySelector(".nv-txt").textContent.replace(/\s+/g, " ").trim())).catch(() => []);
const complet = o => Object.assign({ sexe: "Homme", age: "35", taille: "178", poids: "82", objectif: "Perte de poids / sèche", seances: "3", essaye: "Rien de sérieux", obstacle: "Le temps", pourquoi: "Pour ma santé", motivation: "7" }, o);

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : relance plus tard ou choisis un autre port, VERIF54_PORT=9702 node verif54.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();
  const URL0 = `http://localhost:${PORT}/`;

  /* =================== A. Activité : deux onglets et la copie d'un onglet fermé =================== */
  const ACT = PID(20), EMAIL_ACT = "lea.martin@exemple.fr";
  const leaAct = qui(ACT, EMAIL_ACT);
  const seule = (donnees, extra) => [Object.assign({ id: ACT, prenom: "Léa", nom: "", cree: avant(2 * J), donnees: donnees || [] }, extra || {})];
  const CLE_LOCALE = "mhx_activite_attente|" + ACT, CLE_STORE = "mhx_attente|" + ACT + "|activite";
  const F0 = { version: 1, jours: [ilYA(2)], pages: { formation: 1 }, temps_s: 60, derniere: avant(2 * J) };
  const COPIE = { version: 1, jours: [ilYA(1)], pages: { "verrou-suivi": 5 }, temps_s: 300, derniere: avant(H) };
  /* v52 (Chantier 1, lot C) : la Découverte est prête quand ses 3 questions sont là (#q-probleme ; avant : #q-age) */
  const ouvrir = async (page) => { await page.goto(URL0); await page.waitForSelector("#q-probleme", { timeout: 8000 }); };

  /* deux onglets du même navigateur (localStorage partagé), la copie d'un onglet fermé, relectures de 800 ms :
     onglet 1 masqué, puis onglet 2 « ecart » ms plus tard */
  const deuxOnglets = async (ecart) => {
    const db = base({ comptes: seule([["activite", F0, avant(2 * J)]]) });
    const { c, page: p1 } = await contexte(b, leaAct, db, { stockage: { [CLE_LOCALE]: JSON.stringify(COPIE) } });
    const t0 = Date.now();
    await ouvrir(p1); await attendre(p1, 600);
    const p2 = await nouvellePage(c);
    await ouvrir(p2); await attendre(p2, 600);
    const c1 = await lireLocal(p1, CLE_LOCALE), c2 = await lireLocal(p2, CLE_LOCALE), avant0 = { l: lu(db, "activite"), e: db.ecritures.length };
    db.retardLecture = { activite: 800 };   // relecture de la base : 800 ms
    await cacher(p1); if (ecart) await attendre(p1, ecart); await cacher(p2);
    const tMasque = Date.now();
    const vol = [await enVol(p1), await enVol(p2)];
    await attendre(p1, 3500);
    const W = contenu(db, "activite", ACT) || {}, E = ecr(db, "activite");
    return { db, c, p1, p2, t0, tMasque, vol, c1, c2, avant0, W, E, plafond: 360 + 2 * Math.ceil((tMasque - t0) / 1000) + 2 };
  };
  /* ni compté deux fois, ni perdu : verrou-suivi 5, formation 1, decouverte-questionnaire 2, temps 60 + 300 + temps visible */
  const juste = x => !!x.W.pages && memes(x.W.pages, { formation: 1, "verrou-suivi": 5, "decouverte-questionnaire": 2 }) && x.W.temps_s >= 362 && x.W.temps_s <= x.plafond && x.W.temps_s < 660 && x.E.length === 2 && x.E.every(e => e.contenu && e.contenu.pages && e.contenu.pages["verrou-suivi"] === 5);

  await bloc("A. deux onglets masqués à 100 ms d'écart, copie locale d'un onglet fermé", async () => {
    const x = await deuxOnglets(100), { db, p1, p2, W, E } = x;
    ok("deux onglets ouverts (Découverte) : rien de lu ni d'écrit, les deux voient la même copie locale (verrou-suivi 5, 300 s)", x.avant0.l === 0 && x.avant0.e === 0 && !!x.c1 && memes(x.c1.pages, COPIE.pages) && x.c1.temps_s === 300 && JSON.stringify(x.c1) === JSON.stringify(x.c2), JSON.stringify(x));
    /* verrou entre onglets (navigator.locks) : le 2e onglet attend que le 1er ait relu PUIS écrit (écriture partie tout de suite) */
    ok("onglet 1 masqué, onglet 2 masqué 100 ms plus tard : les deux onglets passent l'un après l'autre (verrou) — relecture, écriture, relecture, écriture (L, E, L, E)", x.vol[0] === true && JSON.stringify(journalAct(db)) === JSON.stringify(["L activite", "E activite", "L activite", "E activite"]), JSON.stringify(x.vol) + " · " + JSON.stringify(journalAct(db)));
    ok("base finale : verrou-suivi exactement 5 (jamais 10), formation 1 de la base, decouverte-questionnaire 2 (une page par onglet) ; chaque écriture porte verrou-suivi 5", !!W.pages && W.pages["verrou-suivi"] === 5 && memes(W.pages, { formation: 1, "verrou-suivi": 5, "decouverte-questionnaire": 2 }) && E.length === 2 && E.every(e => e.contenu && e.contenu.pages && e.contenu.pages["verrou-suivi"] === 5), JSON.stringify(W.pages) + " · écritures " + JSON.stringify(E.map(e => e.contenu && e.contenu.pages)));
    ok("temps : 60 s de la base + 300 s de la copie + le temps visible des deux onglets (362 à " + x.plafond + " s), jamais + 600", W.temps_s >= 362 && W.temps_s <= x.plafond && W.temps_s < 660, "temps_s " + W.temps_s + " · écritures " + JSON.stringify(E.map(e => e.contenu && e.contenu.temps_s)));
    ok("jours : celui de la base, celui de la copie et aujourd'hui", JSON.stringify(W.jours) === JSON.stringify([ilYA(2), ilYA(1), ajd()]), JSON.stringify(W.jours));
    ok("à la fin, la copie locale est retirée de l'appareil (et la copie du Store aussi, une fois l'écriture arrivée)", (await lireLocal(p1, CLE_LOCALE)) === null && (await lireLocal(p2, CLE_LOCALE)) === null && (await lireLocal(p1, CLE_STORE)) === null, JSON.stringify({ locale: await lireLocal(p1, CLE_LOCALE), store: await lireLocal(p1, CLE_STORE) }));
    db.retardLecture = {};
    await montrer(p1); await montrer(p2); await attendre(p1, 1200); await cacher(p1); await attendre(p1, 1500); await cacher(p2); await attendre(p2, 1500);
    const W2 = contenu(db, "activite", ACT) || {};
    ok("nouvel arrière-plan des deux onglets : pages et jours inchangés (rien recompté), seul le temps visible s'ajoute", memes(W2.pages, W.pages) && JSON.stringify(W2.jours) === JSON.stringify(W.jours) && W2.temps_s >= W.temps_s && W2.temps_s <= W.temps_s + 8, JSON.stringify(W2));
  });

  /* même chose, les deux onglets masqués au même instant (écran verrouillé avec deux fenêtres visibles) : les deux
     relectures reviennent ensemble. Plusieurs essais : le résultat dépend de l'ordre d'arrivée, d'un onglet à l'autre,
     des changements de localStorage (propagés de façon asynchrone entre les processus des onglets) */
  await bloc("A. deux onglets masqués au même instant (4 essais)", async () => {
    const essais = [];
    for (let i = 0; i < 4; i++) {
      const x = await deuxOnglets(0);
      essais.push({ juste: juste(x), pages: x.W.pages, temps: x.W.temps_s, plafond: x.plafond, ecritures: x.E.map(e => e.contenu && e.contenu.pages), locale: await lireLocal(x.p1, CLE_LOCALE) });
      await x.c.close();
    }
    ok("4 essais, onglets masqués au même instant : à chaque fois verrou-suivi exactement 5 (jamais 10), temps 60 + 300 + temps visible (jamais + 600), decouverte-questionnaire 2 (la page d'aucun onglet perdue), copie retirée", essais.every(e => e.juste && e.locale === null), JSON.stringify(essais.map(e => ({ juste: e.juste, pages: e.pages, temps: e.temps, ecritures: e.ecritures }))));
  });

  await bloc("A. un onglet fermé ajoute à la copie locale pendant la relecture", async () => {
    const db = base({ comptes: seule([["activite", F0, avant(2 * J)]]) });
    const { c, page: p1 } = await contexte(b, leaAct, db, { stockage: { [CLE_LOCALE]: JSON.stringify(COPIE) } });
    const t0 = Date.now();
    await ouvrir(p1); await attendre(p1, 600);
    const p2 = await nouvellePage(c);
    await ouvrir(p2); await attendre(p2, 600);
    await aller(p2, "#/nutrition", 1200);
    db.retardLecture = { activite: 1500 };
    await cacher(p1); await attendre(p1, 250);
    const avantFermeture = await enVol(p1);
    /* l'onglet 2 se ferme pendant que l'onglet 1 relit la base : sa visite part dans la copie locale */
    await p2.goto("about:blank"); await attendre(p1, 150);
    const milieu = await lireLocal(p1, CLE_LOCALE), apresFermeture = await enVol(p1), eMilieu = ecr(db, "activite").length;
    ok("pendant la relecture de l'onglet 1, l'onglet 2 se ferme : sa visite s'ajoute à la copie locale (verrou-suivi 5, decouverte-questionnaire 1, verrou-nutrition 1, plus de 300 s), rien d'écrit encore", avantFermeture === true && apresFermeture === true && eMilieu === 0 && !!milieu && memes(milieu.pages, { "verrou-suivi": 5, "decouverte-questionnaire": 1, "verrou-nutrition": 1 }) && milieu.temps_s > 300, JSON.stringify({ avantFermeture, apresFermeture, eMilieu, milieu }));
    await attendre(p1, 3000);
    const tFin = Date.now();
    const W = contenu(db, "activite", ACT) || {};
    ok("écriture de l'onglet 1 : la copie relue après la réponse compte une fois (verrou-suivi 5, verrou-nutrition 1, decouverte-questionnaire 1 + 1, formation 1), une seule écriture", ecr(db, "activite").length === 1 && memes(W.pages, { formation: 1, "verrou-suivi": 5, "verrou-nutrition": 1, "decouverte-questionnaire": 2 }), JSON.stringify(W.pages) + " · écritures " + ecr(db, "activite").length);
    ok("temps : 60 + 300 + les deux onglets (rien de perdu, rien compté deux fois)", !!milieu && W.temps_s >= 60 + milieu.temps_s + 1 && W.temps_s <= 360 + 2 * Math.ceil((tFin - t0) / 1000) + 2, "temps_s " + W.temps_s + " · copie au milieu " + (milieu && milieu.temps_s));
    ok("copie locale retirée (elle était entièrement dans l'écriture)", (await lireLocal(p1, CLE_LOCALE)) === null, JSON.stringify(await lireLocal(p1, CLE_LOCALE)));
    db.retardLecture = {};
    await montrer(p1); await attendre(p1, 1200); await cacher(p1); await attendre(p1, 1800);
    const W2 = contenu(db, "activite", ACT) || {};
    ok("arrière-plan suivant : une écriture de plus (le temps visible), pages inchangées (rien recompté)", ecr(db, "activite").length === 2 && memes(W2.pages, W.pages), JSON.stringify(W2.pages));
  });

  /* =================== B. « Rester connecté » décoché =================== */
  const F1 = { version: 1, jours: [ilYA(1)], pages: { formation: 2 }, temps_s: 100, derniere: avant(J) };
  const etatSession = page => page.evaluate(() => ({ persistant: Auth.persistant, ls: !!localStorage.getItem("mhx_session"), ss: !!sessionStorage.getItem("mhx_session") })).catch(e => ({ err: String(e.message) }));
  const nonPersistante = e => e && e.persistant === false && e.ls === false && e.ss === true;

  await bloc("B. session non persistante : visite courte puis vrai rechargement", async () => {
    const db = base({ comptes: seule([["activite", F1, avant(J)]]) });
    const { page } = await contexte(b, leaAct, db, { persistant: false });
    const t0 = Date.now();
    await ouvrir(page); await attendre(page, 800);
    const s0 = await etatSession(page);
    ok("« Rester connecté » décoché : Auth.persistant false, session seulement dans sessionStorage", nonPersistante(s0), JSON.stringify(s0));
    await aller(page, "#/programme", 1400);
    await page.goto(URL0); await page.waitForSelector("#q-probleme", { timeout: 8000 }); await attendre(page, 1200);
    const snap = await page.evaluate(() => ({ l: window.__auChargement, s: window.__auChargementSession })).catch(() => ({}));
    let copie = null; try { copie = JSON.parse(snap.l[CLE_LOCALE]); } catch (e) { copie = null; }
    ok("vrai rechargement : rien lu ni écrit ; au chargement suivant, la visite est dans localStorage (decouverte-questionnaire 1, verrou-programme 1), rien dans sessionStorage", lu(db, "activite") === 0 && db.ecritures.length === 0 && !!copie && memes(copie.pages, { "decouverte-questionnaire": 1, "verrou-programme": 1 }) && !!snap.s && Object.keys(snap.s).length === 0, JSON.stringify(snap));
    const s1 = await etatSession(page);
    ok("… la session reste non persistante après le rechargement", nonPersistante(s1), JSON.stringify(s1));
    await cacher(page); await attendre(page, 1800); await montrer(page);
    const A1 = contenu(db, "activite", ACT) || {};
    ok("arrière-plan : base relue puis écrite une fois, la visite fermée compte une fois (formation 2, decouverte-questionnaire 1 + 1, verrou-programme 1, jours hier + aujourd'hui)", JSON.stringify(journalAct(db)) === '["L activite","E activite"]' && memes(A1.pages, { formation: 2, "decouverte-questionnaire": 2, "verrou-programme": 1 }) && JSON.stringify(A1.jours) === JSON.stringify([ilYA(1), ajd()]), JSON.stringify(journalAct(db)) + " · " + JSON.stringify(A1));
    ok("temps : 100 s + la visite fermée (" + (copie && copie.temps_s) + " s) + la visite en cours", !!copie && A1.temps_s >= 100 + copie.temps_s + 1 && A1.temps_s <= 100 + Math.ceil((Date.now() - t0) / 1000) + 1, "temps_s " + A1.temps_s);
    const restes = await page.evaluate(([a, b2]) => [localStorage.getItem(a), sessionStorage.getItem(a), localStorage.getItem(b2), sessionStorage.getItem(b2)], [CLE_LOCALE, CLE_STORE]);
    ok("copie locale retirée, copie du Store (rangée dans sessionStorage) retirée une fois l'écriture arrivée", restes.every(x => x === null), JSON.stringify(restes));
    await attendre(page, 800); await cacher(page); await attendre(page, 1800);
    const A2 = contenu(db, "activite", ACT) || {};
    ok("arrière-plan suivant : pages et jours inchangés", memes(A2.pages, A1.pages) && JSON.stringify(A2.jours) === JSON.stringify(A1.jours), JSON.stringify(A2));
  });

  await bloc("B. session non persistante : onglet fermé puis nouvel onglet", async () => {
    const db = base({ comptes: seule([["activite", F1, avant(J)]]) });
    const { c, page } = await contexte(b, leaAct, db, { persistant: false });
    await ouvrir(page); await attendre(page, 800);
    await aller(page, "#/formation", 1400);
    await page.goto("about:blank"); await page.close();   // l'onglet se ferme : son sessionStorage (et la session) disparaît
    const p2 = await nouvellePage(c);   // nouvel onglet : la personne se reconnecte, toujours sans « Rester connecté »
    await ouvrir(p2); await attendre(p2, 1200);
    const snap = await p2.evaluate(() => window.__auChargement).catch(() => null);
    let copie = null; try { copie = JSON.parse(snap[CLE_LOCALE]); } catch (e) { copie = null; }
    const s2 = await etatSession(p2);
    ok("onglet fermé sans rien écrire : sa visite l'attend dans localStorage à l'ouverture du nouvel onglet (decouverte-questionnaire 1, formation 1)", db.ecritures.length === 0 && !!copie && memes(copie.pages, { "decouverte-questionnaire": 1, formation: 1 }) && nonPersistante(s2), JSON.stringify(snap) + " · " + JSON.stringify(s2));
    await cacher(p2); await attendre(p2, 1800);
    const A = contenu(db, "activite", ACT) || {};
    ok("nouvel onglet en arrière-plan : une écriture, la visite fermée comptée une fois (formation 2 + 1, decouverte-questionnaire 1 + 1), copie retirée", ecr(db, "activite").length === 1 && memes(A.pages, { formation: 3, "decouverte-questionnaire": 2 }) && (await lireLocal(p2, CLE_LOCALE)) === null, JSON.stringify(A.pages));
  });

  for (const ensemble of [false, true]) {
    await bloc("B. session non persistante : onglet dupliqué (window.open)" + (ensemble ? ", masqués à 100 ms d'écart (relectures de 800 ms)" : ", masqué après l'autre"), async () => {
      const db = base({ comptes: seule([["activite", F1, avant(J)]]) });
      const { c, page } = await contexte(b, leaAct, db, { persistant: false });
      await ouvrir(page); await attendre(page, 800);
      await aller(page, "#/programme", 1400);
      await page.goto(URL0); await page.waitForSelector("#q-probleme", { timeout: 8000 }); await attendre(page, 1000);
      const [pB] = await Promise.all([c.waitForEvent("page"), page.evaluate(() => { window.open(location.href); })]);
      surveiller(pB);
      await pB.waitForSelector("#q-probleme", { timeout: 8000 }); await attendre(pB, 800);
      const sB = await etatSession(pB);
      /* ce que l'onglet dupliqué voit avant tout envoi (le script d'initialisation ne tourne pas dans une fenêtre ouverte par window.open) */
      const snapB = await pB.evaluate(k => { const copies = m => Object.keys(m).filter(x => /^mhx_(activite_)?attente\|/.test(x)); return { l: localStorage.getItem(k), s: copies(sessionStorage) }; }, CLE_LOCALE).catch(() => ({}));
      ok("onglet dupliqué : connecté grâce à la copie du sessionStorage (non persistant), la copie locale est partagée (localStorage) et n'a pas été copiée dans son sessionStorage", nonPersistante(sB) && !!snapB.l && Array.isArray(snapB.s) && snapB.s.length === 0 && db.ecritures.length === 0, JSON.stringify(sB) + " · " + JSON.stringify(snapB));
      if (ensemble) {
        db.retardLecture = { activite: 800 };
        await cacher(page); await attendre(page, 100); await cacher(pB);
        await attendre(page, 3500);
      } else {
        await cacher(page); await attendre(page, 1800);
        const W1 = contenu(db, "activite", ACT) || {};
        ok("onglet d'origine en arrière-plan : la visite fermée compte une fois (formation 2, decouverte-questionnaire 1 + 1, verrou-programme 1)", ecr(db, "activite").length === 1 && memes(W1.pages, { formation: 2, "decouverte-questionnaire": 2, "verrou-programme": 1 }), JSON.stringify(W1.pages));
        await cacher(pB); await attendre(pB, 1800);
      }
      const W = contenu(db, "activite", ACT) || {}, E = ecr(db, "activite");
      ok("onglet dupliqué en arrière-plan " + (ensemble ? "100 ms après l'autre, relectures de 800 ms" : "ensuite") + " : verrou-programme jamais compté deux fois (1 dans chaque écriture qui le porte)", E.length === 2 && E.every(e => !e.contenu || !e.contenu.pages || (e.contenu.pages["verrou-programme"] || 0) <= 1) && (W.pages || {})["verrou-programme"] !== 2, JSON.stringify(E.map(e => e.contenu && e.contenu.pages)));
      ok("… et rien de perdu : base finale formation 2, decouverte-questionnaire 3 (première visite, rechargement, onglet dupliqué), verrou-programme 1", memes(W.pages, { formation: 2, "decouverte-questionnaire": 3, "verrou-programme": 1 }), JSON.stringify(W.pages) + " · écritures " + JSON.stringify(E.map(e => e.contenu && e.contenu.pages)) + " · " + JSON.stringify(journalAct(db)));
      ok("copie locale retirée de l'appareil", (await lireLocal(page, CLE_LOCALE)) === null && (await lireLocal(pB, CLE_LOCALE)) === null, JSON.stringify(await lireLocal(page, CLE_LOCALE)));
    });
  }

  /* =================== C. Nouveautés, « Tout marquer comme vu » =================== */
  /* v53 (chantier 4) : le panneau des Nouveautés n'est plus sur le tableau de bord (qui garde le badge) : il est lu sur la
     page Prospects (#pr-nouveautes), la même fonction ; « vu » = l'instant du chargement de cette page */
  const NV1 = PID(40), NV2 = PID(41), NOUVEAU = PID(42);
  await bloc("C. « Tout marquer comme vu » après un autre appareil", async () => {
    const vu0 = avant(3 * H);
    const db = base({ comptes: [{ id: NV1, prenom: "Nina", nom: "Avant", cree: avant(2 * H) }, { id: NV2, prenom: "Noé", nom: "Avant", cree: avant(H) }], cles: [[F.IDS.coach, "coach_notifs", { vu: vu0 }, vu0]] });
    const { page } = await contexte(b, coach, db, { horloge: true });
    await page.goto(URL0 + "#/prospects"); await page.waitForSelector("#pr-nouveautes [data-nv-vu]", { timeout: 8000 }); await attendre(page, 500);
    const tCharge = await page.evaluate(() => Date.now());
    ok("page Prospects chargée (vu il y a 3 h) : 2 nouveautés, badge « 2 »", (await texte(page, "#pr-nouveautes .seance-c-tete .pastille")) === "2" && JSON.stringify(await badge(page)) === '["2"]', JSON.stringify(await badge(page)));
    await page.clock.fastForward(12 * MIN);
    /* un autre appareil du coach marque tout comme vu 10 minutes après ce chargement */
    const vuAutre = new Date(tCharge + 10 * MIN).toISOString();
    const row = db.donnees.find(x => x.user_id === F.IDS.coach && x.outil === "coach_notifs"); row.contenu = { vu: vuAutre }; row.maj_le = vuAutre;
    const n0 = luDirect(db, "coach_notifs");
    await page.click("#pr-nouveautes [data-nv-vu]"); await attendre(page, 1800);
    const N = contenu(db, "coach_notifs", F.IDS.coach) || {}, E = ecr(db, "coach_notifs");
    ok("« Tout marquer comme vu » sur la page chargée 12 min plus tôt : relu d'abord, puis une écriture, vu ≥ la date de l'autre appareil (" + hm(vuAutre) + ") — jamais l'instant du chargement (" + hm(tCharge) + ")", luDirect(db, "coach_notifs") === n0 + 1 && E.length === 1 && typeof N.vu === "string" && Date.parse(N.vu) >= Date.parse(vuAutre) && db.journal.lastIndexOf("L coach_notifs") < db.journal.indexOf("E coach_notifs"), JSON.stringify(N) + " · autre appareil " + vuAutre + " · chargement " + new Date(tCharge).toISOString());
    const pan = await texte(page, "#pr-nouveautes");
    ok("… panneau « Rien de nouveau … depuis ta dernière visite (" + fr(N.vu || 0) + " " + hm(N.vu || 0) + ") », badge retiré", pan.includes("Rien de nouveau chez tes prospects depuis ta dernière visite (" + fr(N.vu || 0) + " " + hm(N.vu || 0) + ").") && (await badge(page)).length === 0, pan.slice(0, 200));
    ok("seule écriture : coach_notifs", db.ecritures.length === 1, JSON.stringify(db.ecritures.map(e => e.outil || e.table)));
  });

  await bloc("C. « Tout marquer comme vu » : un prospect inscrit entre l'affichage et le clic", async () => {
    const vu0 = avant(3 * H);
    const db = base({ comptes: [{ id: NV1, prenom: "Nina", nom: "Avant", cree: avant(H) }], cles: [[F.IDS.coach, "coach_notifs", { vu: vu0 }, vu0]] });
    const { page } = await contexte(b, coach, db, { horloge: true });
    const tAvant = await page.evaluate(() => Date.now()).catch(() => Date.now());
    await page.goto(URL0 + "#/prospects"); await page.waitForSelector("#pr-nouveautes [data-nv-vu]", { timeout: 8000 }); await attendre(page, 500);
    const tCharge = await page.evaluate(() => Date.now());
    ok("page Prospects chargée : 1 nouveauté (Nina Avant)", JSON.stringify(await nvVisibles(page, "#pr-nouveautes")) === JSON.stringify(["Nina Avant · inscription"]), JSON.stringify(await nvVisibles(page, "#pr-nouveautes")));
    await page.clock.fastForward(5 * MIN);
    /* un prospect s'inscrit 4 minutes après l'affichage, avant le clic */
    const creeNouveau = new Date(tCharge + 4 * MIN).toISOString();
    db.profils.push({ id: NOUVEAU, prenom: "Zoé", nom: "Entre-deux", role: "client", statut: "prospect", cree_le: creeNouveau });
    await page.clock.fastForward(3 * MIN);
    const tClic = await page.evaluate(() => Date.now());
    await page.click("#pr-nouveautes [data-nv-vu]"); await attendre(page, 1800);
    const N = contenu(db, "coach_notifs", F.IDS.coach) || {};
    ok("vu écrit = l'instant du chargement de la page (" + hm(tCharge) + "), pas celui du clic (" + hm(tClic) + ") : avant l'inscription de Zoé (" + hm(creeNouveau) + ")", ecr(db, "coach_notifs").length === 1 && typeof N.vu === "string" && Date.parse(N.vu) >= tAvant - 1000 && Date.parse(N.vu) <= tCharge && Date.parse(N.vu) < Date.parse(creeNouveau), JSON.stringify(N) + " · chargement " + new Date(tCharge).toISOString() + " · clic " + new Date(tClic).toISOString());
    await aller(page, "#/tableau", 1500); await aller(page, "#/prospects", 2400); await page.waitForSelector("#pr-nouveautes .nv-panneau", { timeout: 8000 });
    const vis = await nvVisibles(page, "#pr-nouveautes");
    ok("visite suivante (page Prospects) : Zoé, inscrite entre l'affichage et le clic, est toujours une nouveauté (et elle seule), badge « 1 »", JSON.stringify(vis) === JSON.stringify(["Zoé Entre-deux · inscription"]) && JSON.stringify(await badge(page)) === '["1"]' && (await texte(page, "#pr-nouveautes")).includes("Depuis ta dernière visite (" + fr(N.vu || 0) + " " + hm(N.vu || 0) + ")"), JSON.stringify(vis) + " · " + JSON.stringify(await badge(page)) + " · " + (await texte(page, "#pr-nouveautes")).slice(0, 160));
    await page.goto(URL0 + "#/prospects"); await page.waitForSelector("#pr-nouveautes .nv-panneau", { timeout: 8000 }); await attendre(page, 500);
    ok("vrai rechargement (page Prospects) : Zoé toujours en nouveauté, badge « 1 »", JSON.stringify(await nvVisibles(page, "#pr-nouveautes")) === JSON.stringify(["Zoé Entre-deux · inscription"]) && JSON.stringify(await badge(page)) === '["1"]', JSON.stringify(await nvVisibles(page, "#pr-nouveautes")));
    ok("seule écriture : coach_notifs (une fois)", db.ecritures.length === 1 && ecr(db, "coach_notifs").length === 1, JSON.stringify(db.ecritures.map(e => e.outil || e.table)));
  });

  /* =================== D. bandeau de première connexion d'un client =================== */
  await bloc("D. bandeau de première connexion", async () => {
    const TOUT = { nom: "Camille Martin", age: "34", sexe: "Femme", taille: "165", poids: "60", objectif: "Perte de poids / sèche", niveau: "Débutant (0 à 6 mois)", lieu: "Salle complète", seances: "3", journee_type: "Tartines le matin, pâtes à midi, soupe le soir.", nb_repas: "3 repas", regime_type: "Omnivore" };
    const sans = (...k) => { const o = Object.assign({}, TOUT, { complet: false }); k.forEach(x => delete o[x]); return o; };
    const cas = [
      ["client à qui il manque 1 réponse obligatoire (regime_type)", sans("regime_type"), "Une réponse manque à ton profil.", "Complète-la et enregistre : ça prend dix secondes."],
      ["client à qui il manque 2 réponses obligatoires (nb_repas, regime_type)", sans("nb_repas", "regime_type"), "Deux réponses manquent à ton profil.", "Complète-les et enregistre : ça prend quelques secondes."],
      ["client à qui il manque 7 réponses obligatoires (seuls nom, âge, sexe, taille, poids)", sans("objectif", "niveau", "lieu", "seances", "journee_type", "nb_repas", "regime_type"), "Reprends ton profil là où tu t'es arrêté.", null],
      ["client sans nom, 2 réponses du questionnaire court, sans court_debut (témoin)", { sexe: "Femme", age: "31", complet: false }, "Bienvenue !", null],
      ["ancien prospect : sans nom, 2 réponses du questionnaire court et court_debut", { sexe: "Femme", age: "31", court_debut: avant(3 * J), complet: false }, "Bienvenue dans l'accompagnement !", null],
      ["ancien prospect : sans nom, questionnaire court validé (court_le) sans court_debut", complet({ sexe: "Femme", court_le: avant(3 * J), complet: false }), "Bienvenue dans l'accompagnement !", null]
    ];
    let i = 0;
    for (const [quoi, I, att, note] of cas) {
      const id = PID(50 + i++), mail = "client" + i + "@exemple.fr";
      const db = base({ comptes: [{ id, prenom: "Camille", nom: "", statut: "client", cree: avant(5 * J), donnees: [["intake", I, avant(2 * J)]] }] });
      const { c, page } = await contexte(b, qui(id, mail), db);
      await page.goto(URL0); await attendre(page, 3000);
      const tb = await texte(page, "#vue .bandeau strong"), tn = await texte(page, "#vue .bandeau .note");
      const tout = await page.evaluate(() => document.body.innerText + "\n" + document.documentElement.outerHTML).catch(() => "");
      ok(`${quoi} : Profil ouvert avec le bandeau « ${att} »${note ? " et la note « " + note + " »" : ""}${att === "Bienvenue !" ? " (pas celui d'un ancien prospect : il faut court_debut ou un questionnaire validé)" : ""}`, tb === att && (!note || tn === note) && /#\/profil/.test(page.url()), tb + " · " + tn + " · " + page.url());
      ok(`… nulle part « Une question a été ajoutée », aucune écriture`, !/Une question a été ajoutée/i.test(tout) && db.ecritures.length === 0, JSON.stringify(db.ecritures.map(e => e.outil || e.table)) + " · " + (/Une question a été ajoutée/i.test(tout) ? "texte trouvé" : ""));
      await c.close();
    }
  });

  /* =================== E. fiche coach : chronologie des emails de suivi =================== */
  /* v53 (chantier 4) : bloc retiré (4 vérifications) — la lecture du journal des emails (table emails_prospects, jamais
     créée ; fonction d'envoi v51 retirée) n'existe plus : la chronologie de la fiche n'a plus d'emails. */

  /* =================== F. Profil du prospect : « Emails de suivi » =================== */
  /* v52 (chantier 1, lot B) : le bloc pilote désormais la newsletter : son titre devient « Newsletter » (FR et EN) ;
     la phrase sur la désinscription depuis la messagerie reste */
  await bloc("F. Profil : note des emails de suivi (FR / EN)", async () => {
    const attendus = [["", "Newsletter", "Si tu t'es désabonné depuis ta messagerie, demande aussi à ton coach de te réinscrire."], ["en", "Newsletter", "If you unsubscribed from your mailbox, also ask your coach to re-subscribe you."]];
    for (const [langue, titre, phrase] of attendus) {
      const db = base({ comptes: seule([["emails", { suivi: true, maj: avant(J) }, avant(J)]]) });
      const { c, page } = await contexte(b, leaAct, db, { langue });
      await page.goto(URL0 + "#/profil"); await page.waitForSelector("#mc-emails-bloc", { timeout: 8000 }); await attendre(page, 800);
      const t = await texte(page, "#mc-emails-bloc h2"), n = await texte(page, "#mc-emails-bloc .note");
      ok(`Profil du prospect${langue ? " en anglais" : ""} : bloc « ${titre} », note « … ${phrase} »`, t === titre && n.includes(phrase), t + " · " + n);
      ok(`… affichage sans écriture${langue ? " (anglais)" : ""}`, db.ecritures.length === 0, JSON.stringify(db.ecritures.map(e => e.outil || e.table)));
      await c.close();
    }
  });

  /* =================== G. déconnexion : double clic pendant un envoi d'activité =================== */
  await bloc("G. double clic sur « Se déconnecter » pendant un envoi d'activité", async () => {
    const G0 = { version: 1, jours: [ilYA(1)], pages: { formation: 4 }, temps_s: 200, derniere: avant(J) };
    const db = base({ comptes: seule([["activite", G0, avant(J)]]) });
    const { page } = await contexte(b, leaAct, db);
    await page.exposeFunction("__journal54", x => { db.journal.push(String(x)); });
    await ouvrir(page); await attendre(page, 800);
    await aller(page, "#/formation", 1400);
    /* un autre onglet fermé entre-temps a laissé sa copie locale */
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [CLE_LOCALE, JSON.stringify({ version: 1, jours: [ajd()], pages: { "verrou-suivi": 2 }, temps_s: 30, derniere: new Date().toISOString() })]);
    /* chaque déconnexion commencée et l'effacement de l'appareil sont notés dans le journal du faux Supabase */
    await page.evaluate(() => {
      const seq = Auth.deconnecterUneFois.bind(Auth); Auth.deconnecterUneFois = function(){ window.__journal54("SEQUENCE"); return seq(); };
      const oub = Auth.oublier.bind(Auth); Auth.oublier = function(){ window.__journal54("EFFACEMENT"); return oub(); };
      UI.confirmer = async () => { window.__journal54("CONFIRMER"); return true; };
    });
    db.retardLecture = { activite: 1500 };   // réseau lent : la relecture de la base met 1,5 s
    await cacher(page); await attendre(page, 150); await montrer(page); await attendre(page, 150);   // un envoi commence (relecture en cours)
    const enCours = await enVol(page);
    const bouton = await page.isVisible("#deco").catch(() => false);
    if (bouton) await page.dblclick("#deco"); else await page.evaluate(() => { Auth.deconnecter(); setTimeout(() => Auth.deconnecter(), 60); });
    await attendre(page, 6000);
    const ordre = db.journal.filter(x => x === "LOGOUT" || x === "SEQUENCE" || x === "EFFACEMENT" || x === "CONFIRMER" || x.endsWith(" activite"));
    const A = contenu(db, "activite", ACT) || {};
    ok("double clic (" + (bouton ? "bouton « Se déconnecter »" : "Auth.deconnecter deux fois") + ") pendant la relecture de l'activité : une seule déconnexion (SEQUENCE, LOGOUT, EFFACEMENT une fois chacun), aucune alerte « modifications pas encore envoyées »", enCours === true && ordre.filter(x => x === "SEQUENCE").length === 1 && ordre.filter(x => x === "LOGOUT").length === 1 && ordre.filter(x => x === "EFFACEMENT").length === 1 && !ordre.includes("CONFIRMER"), "envoi en cours : " + enCours + " · " + JSON.stringify(ordre));
    ok("… l'activité est relue puis écrite une seule fois AVANT la déconnexion et l'effacement de l'appareil", JSON.stringify(ordre.filter(x => x !== "SEQUENCE")) === '["L activite","E activite","LOGOUT","EFFACEMENT"]' && ecr(db, "activite").length === 1, JSON.stringify(ordre));
    ok("… écriture complète : formation 4 + 1, decouverte-questionnaire 1, verrou-suivi 2 et 30 s de la copie de l'onglet fermé", memes(A.pages, { formation: 5, "decouverte-questionnaire": 1, "verrou-suivi": 2 }) && JSON.stringify(A.jours) === JSON.stringify([ilYA(1), ajd()]) && A.temps_s > 230, JSON.stringify(A));
    const apres = await page.evaluate(() => ({ cles: Object.keys(localStorage).concat(Object.keys(sessionStorage)).filter(k => /^mhx_(session|attente\||activite_attente\|)/.test(k)), connexion: !!document.querySelector("#c-go, #co-err, .carte-co") })).catch(() => ({}));
    ok("… puis l'appareil est vidé (ni session, ni copie en attente, ni copie d'activité), écran de connexion", Array.isArray(apres.cles) && apres.cles.length === 0 && apres.connexion, JSON.stringify(apres));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
function bilan(){
  const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length;
  console.log(res.join("\n")); console.log(nb + "/" + tot);
  if (nb < tot) process.exitCode = 1;
}
