/* verif105 — v105 (finitions), 3 points, dans un vrai navigateur (Supabase simulé : coach et clients des fixtures, prospects
   fictifs ajoutés ; aucune donnée réelle, aucun appel réseau ; gabarit de verif104) :
   A. le badge de l'onglet Prospects (barre du haut, barre du bas, menu Plus) compte les urgences prospects du tableau de bord
      (tuile Prospects, lignes « prospect » de « À traiter maintenant »), plus les nouveautés : « Tout marquer comme vu » n'y
      touche pas ; aucun badge sans urgence ; « 99+ » au-delà de 99 ; aria-label traduit ;
   B. fiche d'un client (client et prospect, 390 et 1280 px, et en anglais) : un seul en-tête, le bandeau « Fiche de … » : le
      nom une seule fois, plus de bouton ni de grand titre « Fiche » (h1 gardé pour les lecteurs d'écran), le reste intact ;
   C. profil d'un client vu par le coach : « 2 · Son objectif » (« 2 · Their goal ») et les autres titres du questionnaire à
      la 3e personne ; le client garde « Ton objectif » chez lui.
   Usage : node verif105.js [../index.html]   (l'argument est ignoré)
           VERIF105_RACINE=/chemin/vers/une/copie node verif105.js   (preuve : la même suite contre une autre version, ex. main) */
const fs = require("fs"); const path = require("path");
const RACINE = process.env.VERIF105_RACINE ? path.resolve(process.env.VERIF105_RACINE) : path.join(__dirname, "..");
const res = [];
const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + String(d || "").replace(/[✓✗]/g, "·").replace(/\s+/g, " ").trim().slice(0, 1200)));
function bilan(){
  const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length;
  console.log(res.join("\n")); console.log(nb + "/" + tot);
  if (nb < tot || tot === 0) process.exitCode = 1;
}
const http = require("http");
const TL = __dirname;
const { chromium } = require("playwright");
const F = require(path.join(TL, "fixtures"));
const HTML = path.join(RACINE, "index.html");   // VERIF105_RACINE : la même suite contre une autre version
const PORT = +process.env.VERIF105_PORT || 10150;
const MOBILE = { width: 390, height: 844 }, ORDI = { width: 1280, height: 900 }, PETIT = { width: 360, height: 560 };

/* ---------- la page servie : le fichier testé (page, css/ et js/) ---------- */
const { servirFichier } = require(path.join(TL, "fichiers"));
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML)) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(fs.readFileSync(HTML, "utf8"));
});

const ouverts = [];
async function bloc(nom, fn){
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); }
}

/* ---------- dates ---------- */
const T0 = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d.getTime(); })(), H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));

/* ---------- les personnes ---------- */
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + 90 * J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: clone(meta) } : {}) });
const qui = (id, email, meta) => ({ id, email, session: session(id, email, meta) });
const COACH = qui(F.IDS.coach, "coach@exemple.fr", { prenom: "Coach", nom: "Démo" });
const C1 = F.IDS.c1, C2 = F.IDS.c2, TEL1 = "+33639980001", TEL2 = "+33639980002";
const EXTRA = n => "00000000-0000-4000-8000-0000000e" + String(n).padStart(4, "0");

/* ---------- le décor : fixtures.js ; Sarah (c2) est une prospecte ; opts.nombreux : 30 clients de plus (liste longue) ---------- */
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { if (p.role !== "coach") p.statut = p.id === C2 ? "prospect" : "client"; });
  const donnees = clone(F.donnees);
  donnees.push({ user_id: C1, outil: "contact", contenu: { telephone: TEL1 }, maj_le: avant(J) });
  donnees.push({ user_id: C2, outil: "contact", contenu: { telephone: TEL2 }, maj_le: avant(J) });
  if (opts.nombreux) for (let i = 1; i <= 30; i++) profils.push({ id: EXTRA(i), prenom: "Client" + String(i).padStart(2, "0"), nom: "Démo", role: "client", statut: "client", cree_le: avant((40 + i) * J) });
  return { profils, donnees, ecritures: [],
    emails: { [F.IDS.coach]: "coach@exemple.fr", [C1]: "thomas@exemple.fr", [C2]: "sarah@exemple.fr", [F.IDS.c3]: "julien@exemple.fr" },
    meta: { [F.IDS.coach]: { prenom: "Coach", nom: "Démo" }, [C1]: { prenom: "Thomas", nom: "Démo" }, [C2]: { prenom: "Sarah", nom: "Démo" }, [F.IDS.c3]: { prenom: "Julien", nom: "Démo" } },
    programmes: clone(F.catalogue.programmes_types || []) };
}

/* ---------- le faux Supabase (gabarit de verif99 : lectures, écritures notées, refus RLS) ---------- */
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
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(TL, "..", "donnees", f), "utf8"));   // le catalogue public de la branche (lecture seule)
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
      let l = db.donnees.filter(x => coach || (x.user_id === moi && !ILLISIBLES_PROPRIO.includes(x.outil)));
      if (uid) l = l.filter(x => x.user_id === uid);
      return json(colonnes(plage(parOutil(l, o)), q));
    }
    if (m === "POST") {
      let rows = corps(); rows = Array.isArray(rows) ? rows : rows ? [rows] : [];
      const refuse = rows.find(row => !permis(moi, coach, row));
      if (refuse) return json({ code: "42501", message: 'new row violates row-level security policy for table "donnees"' }, 403);
      for (const row of rows) {
        const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
        const ligne = { user_id: row.user_id, outil: row.outil, contenu: clone(row.contenu), maj_le: row.maj_le || new Date().toISOString() };
        if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        db.ecritures.push(Object.assign({ table: "donnees", m, t: Date.now() }, clone(ligne)));
      }
      return json(null, 201);
    }
    db.ecritures.push({ table: "donnees", m, user_id: uid, outil: o });
    return json([]);
  }
  if (p === "/rest/v1/bibliotheque") return m === "GET" ? json(coach ? colonnes(plage(clone(F.bibliotheque)), q) : []) : json(null, 201);
  if (p === "/rest/v1/programmes_types") {
    if (m === "GET") { const id = q.get("id"); let l = db.programmes; if (id && id.startsWith("eq.")) l = l.filter(x => x.id === id.slice(3)); return json(colonnes(plage(clone(l)), q)); }
    return json(null, 201);
  }
  const t = p.replace("/rest/v1/", "");
  if (CATALOGUE[t]) return m === "GET" ? json(colonnes(plage(CATALOGUE[t]), q)) : json(null, 201);
  return json([]);
}

/* ---------- un navigateur (contexte) pour le coach, horloge contrôlée ---------- */
const ERREURS = [];
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || ORDI });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, who, db));
  await c.addInitScript(({ s, lg }) => {
    if (!/^https?:$/.test(location.protocol) || location.hostname !== "localhost") return;
    if (!localStorage.getItem("__init")) {
      localStorage.setItem("__init", "1");
      if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
      localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
      if (lg) localStorage.setItem("mhx_langue", lg);   // partie 2 : opts.langue (avec prefs.langue du compte : avecPrefsEnTous)
    }
  }, { s: who ? who.session : null, lg: opts.langue || null });
  await c.clock.install({ time: T0 });
  const page = await c.newPage();
  page.on("pageerror", e => { ERREURS.push("JS " + String(e).slice(0, 200)); res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)); });
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|ERR_INTERNET_DISCONNECTED|status of [45]\d\d/.test(msg.text())) { ERREURS.push("CONSOLE " + msg.text().slice(0, 200)); res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); } });
  page.on("dialog", d => { ERREURS.push("DIALOGUE " + d.message().slice(0, 80)); res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  page.on("popup", p => p.close().catch(() => {}));
  return { c, page };
}

/* ---------- aides ---------- */
const attendre = (page, ms) => page.waitForTimeout(ms);
async function pret(page, sel){
  await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 });
  if (sel) { try { await page.waitForSelector(sel, { timeout: 10000 }); } catch (e) {} }
  await attendre(page, 500);
}
const URL0 = `http://localhost:${PORT}/`;
const ouvrir = async (page, uid, chemin, sel) => { await page.goto(URL0 + "#/client/" + uid + "/" + chemin); await pret(page, sel); await attendre(page, 900); };
const avecPrefsEnTous = db => { [F.IDS.coach, C1, C2, F.IDS.c3].forEach(id => { const pr = db.donnees.find(d => d.user_id === id && d.outil === "prefs"); if (pr) pr.contenu = Object.assign({}, pr.contenu, { langue: "en" }); else db.donnees.push({ user_id: id, outil: "prefs", contenu: { langue: "en" }, maj_le: avant(40 * J) }); }); };
/* les prospects ajoutés : n « nouveaux » (inscrits il y a 2 h : urgence « DM de bienvenue ») et m « anciens » (inscrits il y a
   3 à 5 jours, rien d'autre : une nouveauté des 7 derniers jours, pas une urgence) */
const NV = n => "00000000-0000-4000-8000-0000000a" + String(n).padStart(4, "0");
const ANC = n => "00000000-0000-4000-8000-0000000b" + String(n).padStart(4, "0");
function avecProspects(db, n, m){
  for (let i = 1; i <= n; i++) db.profils.push({ id: NV(i), prenom: "Nouveau" + i, nom: "Test", role: "client", statut: "prospect", cree_le: avant(2 * H + i * 60000) });
  for (let i = 1; i <= m; i++) db.profils.push({ id: ANC(i), prenom: "Ancien" + i, nom: "Test", role: "client", statut: "prospect", cree_le: avant((3 + (i % 3)) * J) });
  return db;
}
/* le badge de l'onglet Prospects : ses copies (barre du haut, barre du bas, menu Plus) ; le texte de la copie visible ; son aria-label */
const badges = page => page.$$eval('#nav a[data-id="prospects"] .nav-badge, #barre-bas a[data-id="prospects"] .nav-badge, .menu-plus a[data-id="prospects"] .nav-badge',
  l => l.map(e => ({ t: e.textContent.trim(), aria: e.getAttribute("aria-label"), vis: e.getClientRects().length > 0 }))).catch(() => []);
/* le tableau de bord : le nombre de la pastille de la tuile Prospects, et les lignes « prospect » de « À traiter maintenant » */
/* v106 (lot 5) : changement voulu — plus de tuile Prospects : « Aujourd'hui » groupe les prospects (Nouveaux prospects, Bilans
   réservés, À relancer) ; chaque groupe dit combien de ses lignes sont des urgences (data-urgences) ; tuile = leur somme ; lignes =
   les lignes de la colonne Prospects (dépliées) dont la raison est une urgence ; total = le chiffre « À traiter » */
const tableau = async page => {
  for (const b of await page.$$('#tb-col-prospects [data-tb-deplier][aria-expanded="false"]')) { await b.click(); await new Promise(r => setTimeout(r, 200)); }
  return page.evaluate(() => {
    const gs = Array.from(document.querySelectorAll("#tb-col-prospects .tb-groupe"));
    const urgent = /DM de bienvenue|réservé|clic|Absent|Signé/i;
    return { tuile: gs.length ? gs.reduce((n, g) => n + parseInt(g.dataset.urgences || "0", 10), 0) : null,
      lignes: Array.from(document.querySelectorAll("#tb-col-prospects .tb-l")).filter(li => urgent.test(li.textContent)).length,
      total: parseInt((document.querySelector("#tb-c-traiter .t-val") || {}).textContent, 10) };
  });
};
/* les textes visibles de #vue (nœuds texte) */
const textesVisibles = page => page.evaluate(() => {
  const v = document.getElementById("vue"), out = [], w = document.createTreeWalker(v, NodeFilter.SHOW_TEXT); let x;
  while ((x = w.nextNode())) { const p = x.parentElement; if (!p || p.closest("[hidden]") || !p.getClientRects().length || p.getBoundingClientRect().width <= 2) continue; const t = x.nodeValue.replace(/\s+/g, " ").trim(); if (t) out.push(t); }
  return out;
});

async function principal(){
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris : VERIF105_PORT=10151 node verif105.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. point 1 : le badge de l'onglet Prospects = les urgences du tableau de bord =================== */
  await bloc("A. badge Prospects", async () => {
    const db = avecProspects(base(), 3, 6);
    /* un 4e nouvel inscrit, archivé par le coach : ni urgence ni nouveauté, nulle part */
    db.profils.push({ id: NV(50), prenom: "Archive", nom: "Test", role: "client", statut: "prospect", cree_le: avant(H) });
    db.donnees.push({ user_id: NV(50), outil: "suivi_prospect", contenu: { version: 1, archive_le: avant(30 * 60000) }, maj_le: avant(30 * 60000) });
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/tableau"); await pret(page, "#tb-vue .tb-chiffres"); await attendre(page, 800);
    const T = await tableau(page), B1 = await badges(page);
    ok("A1 : tableau de bord : le badge de l'onglet Prospects (barre du haut et barre du bas) = les urgences des groupes de prospects d'« Aujourd'hui » = leurs lignes urgentes (v106) (3 nouveaux inscrits, pas l'archivé)",
      T.tuile === 3 && T.lignes === 3 && B1.length === 2 && B1.every(x => x.t === "3"), JSON.stringify({ T, B1 }));
    await page.goto(URL0 + "#/prospects"); await pret(page, "#pr-nouveautes .nv-panneau"); await attendre(page, 800);
    const nv = parseInt(await page.$eval("#pr-nouveautes .seance-c-tete .pastille", e => e.textContent).catch(() => "-1"), 10), B2 = await badges(page);
    ok("A2 : page Prospects : 9 nouveautés dans le panneau (les 3 nouveaux et les 6 inscrits de la semaine), mais le badge reste « 3 » (les urgences, pas les nouveautés ; l'inscrit archivé ne compte pas non plus, calculé depuis cette page)",
      nv === 9 && B2.length === 2 && B2.every(x => x.t === "3"), JSON.stringify({ nv, B2 }));
    await page.click("#pr-nouveautes [data-nv-vu]"); await attendre(page, 1800);
    const B3 = await badges(page), pan = await page.$eval("#pr-nouveautes", e => e.textContent).catch(() => "");
    ok("A3 : « Tout marquer comme vu » vide le panneau des Nouveautés mais ne touche pas au badge des urgences (toujours « 3 »)",
      /Rien de nouveau chez tes prospects/.test(pan) && B3.length === 2 && B3.every(x => x.t === "3"), JSON.stringify({ B3, pan: pan.slice(0, 120) }));
    await page.goto(URL0 + "#/tableau"); await pret(page, "#tb-vue .tb-chiffres"); await attendre(page, 800);
    const B4 = await badges(page);
    ok("A4 : retour au tableau de bord : toujours « 3 », avec l'aria-label « 3 urgences chez tes prospects »",
      B4.length === 2 && B4.every(x => x.t === "3" && x.aria === "3 urgences chez tes prospects"), JSON.stringify(B4));
    /* un prospect de plus, inscrit maintenant : une urgence de plus, au prochain affichage */
    db.profils.push({ id: NV(99), prenom: "Nouveau99", nom: "Test", role: "client", statut: "prospect", cree_le: avant(10 * 60000) });
    await page.goto(URL0 + "#/prospects"); await pret(page, "#pr-nouveautes .nv-panneau"); await attendre(page, 800);
    const B5 = await badges(page);
    ok("A5 : un nouvel inscrit : la page Prospects recompte, badge « 4 »", B5.length === 2 && B5.every(x => x.t === "4"), JSON.stringify(B5));
    ok("A6 : seule écriture : coach_notifs (« Tout marquer comme vu »)", db.ecritures.length === 1 && db.ecritures[0].outil === "coach_notifs", JSON.stringify(db.ecritures.map(e => e.outil || e.table)));
  });
  await bloc("A. aucune urgence", async () => {
    const db = avecProspects(base(), 0, 6);
    db.profils.find(p => p.id === C2).cree_le = avant(20 * J);   // Sarah : inscrite il y a longtemps
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/tableau"); await pret(page, "#tb-vue .tb-chiffres"); await attendre(page, 800);
    const T = await tableau(page), B1 = await badges(page);
    await page.goto(URL0 + "#/prospects"); await pret(page, "#pr-nouveautes .nv-panneau"); await attendre(page, 800);
    const nv = parseInt(await page.$eval("#pr-nouveautes .seance-c-tete .pastille", e => e.textContent).catch(() => "-1"), 10), B2 = await badges(page);
    ok("A7 : aucune urgence prospect (v106 : 0 dans les groupes) mais 6 nouveautés : aucun badge, ni au tableau de bord ni sur la page Prospects",
      T.tuile === 0 && B1.length === 0 && nv >= 6 && B2.length === 0, JSON.stringify({ T, B1, nv, B2 }));
  });
  await bloc("A. 120 urgences, téléphone, anglais", async () => {
    const db = avecProspects(base(), 120, 0);
    const { page } = await contexte(b, COACH, db, { viewport: MOBILE });
    await page.goto(URL0 + "#/tableau"); await pret(page, "#tb-vue .tb-chiffres"); await attendre(page, 1200);
    const T = await tableau(page), B = await badges(page);
    ok("A8 : 120 urgences (téléphone 390 px) : les groupes en comptent 120 (v106), le badge de la barre du bas « 99+ » (visible)",
      T.tuile === 120 && B.length >= 1 && B.every(x => x.t === "99+") && B.some(x => x.vis), JSON.stringify({ T, B }));
    const db2 = avecProspects(base(), 2, 3); avecPrefsEnTous(db2);
    const { page: p2 } = await contexte(b, COACH, db2, { langue: "en" });
    await p2.goto(URL0 + "#/tableau"); await pret(p2, "#tb-vue .tb-chiffres"); await attendre(p2, 1000);
    const B2 = await badges(p2);
    ok("A9 : en anglais : badge « 2 », aria-label « 2 urgent items among your prospects »", B2.length === 2 && B2.every(x => x.t === "2" && x.aria === "2 urgent items among your prospects"), JSON.stringify(B2));
  });

  /* =================== B. point 2 : la fiche d'un client, un seul en-tête =================== */
  for (const [qui, uid, nom] of [["client", C1, "Thomas Démo"], ["prospect", C2, "Sarah Démo"]]) for (const [taille, vp] of [["390", MOBILE], ["1280", ORDI]]) {
    await bloc("B. " + qui + " " + taille, async () => {
      const db = base();
      const { page } = await contexte(b, COACH, db, { viewport: vp });
      await ouvrir(page, uid, "accueil", "#fc-suivi");
      const t = await textesVisibles(page);
      const d = await page.evaluate(() => { const v = document.getElementById("vue");
        /* v106 (lot 2) : l'en-tête sur une ligne — le prénom (nom entier en bulle), le statut, WhatsApp et Appeler y sont */
        return { tete: (v.querySelector(".fiche-entete .fe-nom") || {}).title, prenom: (v.querySelector(".fiche-entete .fe-nom") || {}).textContent, bAct: v.querySelectorAll(".fiche-entete a.b-act").length, bActIci: (v.querySelector('.fiche-entete a.b-act[aria-current="page"]') || {}).textContent || null,
          h1: Array.from(v.querySelectorAll("h1")).map(h => [h.textContent, h.className, Math.round(h.getBoundingClientRect().width)]),
          ident: !!v.querySelector("#fc-ident"), h2Ident: !!v.querySelector("#fc-ident h2"), avatar: !!v.querySelector("#fc-ident .avatar"), role: (v.querySelector(".fiche-entete .fe-statut") || {}).textContent,
          call: !!v.querySelector("#fc-call"), wa: !!v.querySelector('.fiche-entete [data-fiche-wa] a[href*="?text="]'), appeler: !!v.querySelector(".fiche-entete #fc-appeler"), sortir: v.querySelectorAll("#sortir-fiche").length,
          deborde: document.documentElement.scrollWidth > window.innerWidth + 1 }; });
      /* v106 (lot 2) : changement voulu — le prénom une seule fois (en-tête), le nom entier en bulle ; « Aperçu » et « Son
         questionnaire » dans la rangée des pages ; le h1 caché porte le nom de la page, « Aperçu » */
      const prenom = nom.split(" ")[0];
      ok("B1 (" + qui + ", " + taille + " px) : le prénom « " + prenom + " » une seule fois à l'écran, dans l'en-tête (nom entier en bulle) ; plus de nom ni d'initiales sous l'en-tête",
        t.filter(x => x.includes(prenom)).length === 1 && d.prenom === prenom && d.tete === nom && !d.h2Ident && !d.avatar, JSON.stringify({ noms: t.filter(x => x.includes(prenom)), d }));
      ok("B2 (" + qui + ", " + taille + " px) : « Fiche » n'est plus ni un bouton ni un grand titre (aucun texte « Fiche » seul visible) ; un seul h1, « Aperçu » (le nom de son lien), pour les lecteurs d'écran",
        !t.includes("Fiche") && d.bAct === 2 && d.bActIci === "Aperçu" && d.h1.length === 1 && d.h1[0][0] === "Aperçu" && d.h1[0][1] === "sr-only" && d.h1[0][2] <= 1, JSON.stringify({ d, fiche: t.filter(x => /^Fiche$/.test(x)) }));
      ok("B3 (" + qui + ", " + taille + " px) : le reste de l'en-tête et de l'identité reste : « Revenir à mes clients » (une fois), la pastille « " + (qui === "client" ? "Client" : "Prospect") + " », " + (qui === "client" ? "plus de bouton « Préparer le call » (v106)" : "le message WhatsApp prêt") + ", Appeler ; pas de débordement",
        d.sortir === 1 && (await page.$eval("#sortir-fiche", e => e.getAttribute("aria-label"))) === "Revenir à mes clients" /* v106 : la flèche, au nom lu par les lecteurs d'écran */ && d.ident && d.role === (qui === "client" ? "Client" : "Prospect") && (qui === "client" ? !d.call /* v106 (lot 4) : plus de bouton « Bilans » sur l'Aperçu (la carte du dernier retour et l'onglet Suivi y mènent) */ : d.wa) && d.appeler && !d.deborde, JSON.stringify(d));
      /* les onglets à plusieurs pages gardent leurs boutons de page */
      await ouvrir(page, uid, "profil", "#q-age");
      const pr = await page.$$eval("#vue .fiche-entete a.b-act", l => l.map(a => a.textContent.trim()));
      /* v106 (lot 2) : « Son questionnaire » est une page d'Aperçu ; « Son compte » est dans le menu « ⋯ » de l'en-tête */
      const compte = await page.$$eval("#fiche-points a[data-fe-compte]", l => l.map(a => a.textContent.trim()));
      ok("B4 (" + qui + ", " + taille + " px) : « Son questionnaire » garde sa page (sous Aperçu : « Aperçu », « Son questionnaire ») et « Son compte » reste joignable (menu « ⋯ »)", JSON.stringify(pr) === '["Aperçu","Son questionnaire"]' && JSON.stringify(compte) === '["Son compte"]', JSON.stringify([pr, compte]));
      ok("B5 (" + qui + ", " + taille + " px) : aucune écriture", db.ecritures.length === 0, JSON.stringify(db.ecritures));
    });
  }
  await bloc("B. anglais", async () => {
    const db = base(); avecPrefsEnTous(db);
    const { page } = await contexte(b, COACH, db, { langue: "en", viewport: MOBILE });
    await ouvrir(page, C1, "accueil", "#fc-suivi");
    const t = await textesVisibles(page);
    const d = await page.evaluate(() => ({ tete: (document.querySelector("#vue .fiche-entete .fe-nom") || {}).title, bAct: Array.from(document.querySelectorAll("#vue .fiche-entete a.b-act")).map(a => a.textContent.trim()), h1: Array.from(document.querySelectorAll("#vue h1")).map(h => h.textContent + "|" + h.className) }));
    ok("B6 (anglais, 390 px) : le prénom une seule fois (nom entier en bulle, jamais traduit), aucun bouton « Profile » (« Fiche ») ; pages « Overview », « Their questionnaire » ; un seul h1 (« Overview », caché à l'écran) (v106)",
      t.filter(x => x.includes("Thomas")).length === 1 && d.tete === "Thomas Démo" && JSON.stringify(d.bAct) === '["Overview","Their questionnaire"]' && JSON.stringify(d.h1) === '["Overview|sr-only"]', JSON.stringify({ noms: t.filter(x => x.includes("Thomas")), d }));
  });

  /* =================== C. point 3 : les titres du questionnaire à la 3e personne dans la fiche =================== */
  const lireProfil = async page => page.evaluate(() => {
    const v = document.getElementById("vue"), n = x => String(x || "").replace(/\s+/g, " ").trim();
    /* v106 (lot 4) : dans la fiche, chaque thème du questionnaire est un <details> replié (son h2 dans le <summary>) : on l'ouvre
       pour tout lire, et le <summary> qui porte un h2 n'est pas compté deux fois */
    v.querySelectorAll("details.q-theme").forEach(d => { d.open = true; });
    const titres = Array.from(v.querySelectorAll("h1,h2,h3,h4,legend,label,summary,th,dt,.sec-titre")).filter(e => e.getClientRects().length && !e.closest("[hidden]") && !(e.tagName === "SUMMARY" && e.querySelector("h2"))).map(e => n(e.textContent));
    return { titres, sections: titres.filter(x => /^\d+ · /.test(x)) };
  });
  await bloc("C. français", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db);
    await ouvrir(page, C1, "profil", "#q-age");
    const c = await lireProfil(page);
    ok("C1 : profil de Thomas vu par le coach : « 2 · Son objectif » (plus « 2 · Ton objectif »), les 6 sections du questionnaire",
      c.sections.includes("2 · Son objectif") && !c.sections.includes("2 · Ton objectif") && c.sections.length === 6, JSON.stringify(c.sections));
    ok("C2 : aucun titre du questionnaire (sections, questions) ne commence par « Ta / Tes / Ton », numéroté ou non",
      !c.titres.some(x => /^(\d+ · )?(Ta|Tes|Ton) /.test(x)), JSON.stringify(c.titres.filter(x => /^(\d+ · )?(Ta|Tes|Ton) /.test(x))));
    const CL = qui(C1, "thomas@exemple.fr", { prenom: "Thomas", nom: "Démo" });
    const { page: p2 } = await contexte(b, CL, base());
    await p2.goto(URL0 + "#/profil"); await pret(p2, "#q-age"); await attendre(p2, 600);
    const c2 = await lireProfil(p2);
    ok("C3 : le client, chez lui, garde « 2 · Ton objectif »", c2.sections.includes("2 · Ton objectif") && !c2.sections.includes("2 · Son objectif"), JSON.stringify(c2.sections));
  });
  await bloc("C. anglais", async () => {
    const db = base(); avecPrefsEnTous(db);
    const { page } = await contexte(b, COACH, db, { langue: "en" });
    await ouvrir(page, C1, "profil", "#q-age");
    const c = await lireProfil(page);
    ok("C4 : en anglais, dans la fiche : « 2 · Their goal », « Other allergies, intolerances or foods they avoid », « Supplements they currently take » (plus « your » ni « you » dans ces titres)",
      c.sections.includes("2 · Their goal") && !c.sections.includes("2 · Your goal") && c.titres.some(x => x.startsWith("Other allergies, intolerances or foods they avoid")) && c.titres.some(x => x.startsWith("Supplements they currently take"))
        && !c.titres.some(x => /foods you avoid|Supplements you currently/.test(x)), JSON.stringify(c.titres.filter(x => /goal|allergies|Supplements/i.test(x))));
    const db2 = base(); avecPrefsEnTous(db2);
    const CL = qui(C1, "thomas@exemple.fr", { prenom: "Thomas", nom: "Démo" });
    const { page: p2 } = await contexte(b, CL, db2, { langue: "en" });
    await p2.goto(URL0 + "#/profil"); await pret(p2, "#q-age"); await attendre(p2, 600);
    const c2 = await lireProfil(p2);
    ok("C5 : le client en anglais garde « 2 · Your goal » et « … you avoid »", c2.sections.includes("2 · Your goal") && c2.titres.some(x => x.startsWith("Other allergies, intolerances or foods you avoid")), JSON.stringify(c2.titres.filter(x => /goal|allergies/i.test(x))));
  });

  /* =================== Z. console, hôtes externes =================== */
  await bloc("Z. console et hôtes externes", async () => {
    const autres = Array.from(externes).filter(h => !/^(fonts\.(googleapis|gstatic)\.com|i\.ytimg\.com|img\.youtube\.com|www\.youtube-nocookie\.com)$/.test(h));
    ok("Z1 : aucune erreur de console ni erreur JS ni dialogue natif pendant la suite, aucun appel vers l'extérieur",
      ERREURS.length === 0 && autres.length === 0, JSON.stringify(ERREURS.slice(0, 5)) + " " + JSON.stringify(autres));
  });
  await b.close(); server.close();
}

principal().then(bilan).catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exitCode = 1; });
