/* verif106 — v106 (ergonomie de l'espace coach), dans un vrai navigateur (Supabase simulé : coach et clients des fixtures,
   prospects fictifs ajoutés ; aucune donnée réelle, aucun appel réseau ; gabarit de verif106) :
   A. lot 1 : 4 entrées (Aujourd'hui, Clients, Prospects, Bibliothèque), pas de « Plus » ; rond de profil (Réglages, Mon
      entraînement, Langue, Partager l'app, Se déconnecter avec confirmation) ; anciennes adresses redirigées ; barre latérale ;
   B. lot 2 : en-tête de la fiche sur une ligne, collé en haut ; « ⋯ » (Son compte et les actions du compte) ; Notes en volet ;
      …/suivi → Bilans ; le témoin de connexion recopié ;
   C. lot 3 : Bilans (retours en haut, objectifs, points du call, régularité) ;
   D. lot 4 : Aperçu sans doublons (client, prospecte) ;
   E. lot 5 : « Aujourd'hui » (4 chiffres, 5 groupes, « Tout voir », WhatsApp prêt, un chiffre mène à son groupe) ;
   F. WhatsApp du coach : toujours le message prêt ; G. anglais ; Z. console et hôtes.
   Usage : node verif106.js [../index.html]   (l'argument est ignoré)
           VERIF106_RACINE=/chemin/vers/une/copie node verif106.js   (preuve : la même suite contre une autre version, ex. main) */
const fs = require("fs"); const path = require("path");
const RACINE = process.env.VERIF106_RACINE ? path.resolve(process.env.VERIF106_RACINE) : path.join(__dirname, "..");
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
const HTML = path.join(RACINE, "index.html");   // VERIF106_RACINE : la même suite contre une autre version
const PORT = +process.env.VERIF106_PORT || 10160;
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
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris : VERIF106_PORT=10161 node verif106.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();
  const MENU4 = '["tableau","clients","prospects","mes-programmes"]';
  const vis = (page, sel) => page.$$eval(sel, l => l.filter(e => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== "hidden").length).catch(() => 0);
  const deborde = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);

  /* =================== A. lot 1 : la navigation du coach =================== */
  await bloc("A. navigation du coach", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db, { viewport: MOBILE });
    await page.goto(URL0 + "#/tableau"); await pret(page, "#tb-vue .tb-chiffres");
    const m = await page.evaluate(() => ({ nav: Array.from(document.querySelectorAll("#nav a")).map(a => a.dataset.id), bas: Array.from(document.querySelectorAll("#barre-bas a[data-id]")).map(a => a.dataset.id),
      plus: !!document.querySelector("#barre-bas [data-plus]"), noms: Array.from(document.querySelectorAll("#barre-bas a[data-id]")).map(a => a.textContent.replace(/\s+/g, " ").trim()),
      titre: ((document.getElementById("titre-page") || {}).textContent || "").trim(), rond: !!document.getElementById("rond-profil") }));
    ok("A1 : 390 px : 4 entrées (Aujourd'hui, Clients, Prospects, Bibliothèque) dans la barre du bas et le menu, pas de « Plus » ; le titre de la page dans la ligne du haut ; le rond de profil",
      JSON.stringify(m.nav) === MENU4 && JSON.stringify(m.bas) === MENU4 && !m.plus && JSON.stringify(m.noms.map(t => t.replace(/\d+$/, "").trim())) === '["Aujourd\'hui","Clients","Prospects","Bibliothèque"]' && m.titre === "Aujourd'hui" && m.rond && !(await deborde(page)), JSON.stringify(m));
    const rr = await page.$eval("#rond-profil", e => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }).catch(() => [0, 0]);
    await page.click("#rond-profil"); await attendre(page, 500);
    const v = await page.evaluate(() => Array.from(document.querySelectorAll(".volet-profil #menu-profil li")).map(li => { const a = li.querySelector("a, button"); return (a.dataset.id || Object.keys(a.dataset)[0] || "") + ":" + li.textContent.replace(/\s+/g, " ").trim(); }));
    ok("A2 : le rond de profil (44 × 44) ouvre « Mon profil » : Réglages, Mon entraînement, Langue, Partager l'app, Se déconnecter",
      rr[0] >= 44 && rr[1] >= 44 && v.length === 5 && /^profil:Réglages/.test(v[0]) && /^entrainement:Mon entraînement/.test(v[1]) && /^mpLangue:Langue/.test(v[2]) && /^mpPartager:Partager l'app/.test(v[3]) && /^mpDeco:Se déconnecter/.test(v[4]), JSON.stringify([rr, v]));
    await page.click(".volet-profil [data-mp-deco]"); await attendre(page, 500);
    const conf = await page.evaluate(() => ({ modale: ((document.querySelector(".modale") || {}).textContent || "").replace(/\s+/g, " ").trim() }));
    await page.click('.modale [data-ui-b="0"]').catch(() => {}); await attendre(page, 400);
    ok("A3 : « Se déconnecter » demande une confirmation (fenêtre de l'app, pas native) ; « Annuler » garde la session", /Te déconnecter de ton espace \?/.test(conf.modale) && (await page.evaluate(() => !!Auth.utilisateur())), JSON.stringify(conf));
    /* anciennes adresses */
    const adr = [];
    for (const [h, att] of [["#/atelier", "#/mes-programmes"], ["#/bibliotheque", "#/mes-programmes/bibliotheque"], ["#/catalogue", "#/catalogue"], ["#/profil", "#/profil"], ["#/entrainement", "#/entrainement"], ["#/suivi-clients", "#/suivi-clients"], ["#/suivi-commercial", "#/suivi-commercial"]]) {
      await page.evaluate(x => { location.hash = x; }, h); await attendre(page, 1300);
      adr.push([h].concat(await page.evaluate(() => [location.hash, ((document.getElementById("titre-page") || {}).textContent || "").trim()])));
    }
    ok("A4 : anciennes adresses : #/atelier → Bibliothèque, #/bibliotheque → Bibliothèque › Mes modèles ; Catalogue (Bibliothèque), Réglages, Mon entraînement, Vue tableau, Vue détaillée s'ouvrent",
      JSON.stringify(adr.map(x => x[1])) === JSON.stringify(["#/mes-programmes", "#/mes-programmes/bibliotheque", "#/catalogue", "#/profil", "#/entrainement", "#/suivi-clients", "#/suivi-commercial"])
        && JSON.stringify(adr.map(x => x[2])) === JSON.stringify(["Bibliothèque", "Bibliothèque", "Bibliothèque", "Réglages", "Mon entraînement", "Vue tableau", "Vue détaillée"]), JSON.stringify(adr));
    await page.setViewportSize(ORDI); await page.evaluate(() => { location.hash = "#/tableau"; }); await attendre(page, 1200);
    const o = await page.evaluate(() => { const t = document.querySelector(".topbar"), r = t.getBoundingClientRect(); return { l: Math.round(r.width), h: Math.round(r.height), bas: !!document.querySelector("#barre-bas") && getComputedStyle(document.getElementById("barre-bas")).display !== "none" }; });
    ok("A5 : 1280 px : la barre de navigation est sur le côté (≤ 240 px de large, toute la hauteur), pas de barre du bas", o.l <= 240 && o.h >= 800 && !o.bas, JSON.stringify(o));
    ok("A6 : la navigation n'écrit rien", db.ecritures.length === 0, JSON.stringify(db.ecritures.slice(0, 3)));
  });

  /* =================== B. lot 2 : l'en-tête de la fiche =================== */
  await bloc("B. en-tête de la fiche", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db, { viewport: MOBILE });
    await ouvrir(page, C1, "accueil", "#fiche-entete [data-fiche-tel] a");
    await page.waitForSelector("#fiche-entete [data-fe-statut] .fe-statut", { timeout: 8000 }).catch(() => {});
    const e = await page.evaluate(() => { const h = document.getElementById("fiche-entete"), l = h.querySelector(".fe-ligne"), r = l.getBoundingClientRect();
      const tops = Array.from(l.children).map(x => Math.round(x.getBoundingClientRect().top));
      return { prenom: h.querySelector(".fe-nom").textContent, bulle: h.querySelector(".fe-nom").title, statut: h.querySelector(".fe-statut").textContent.trim(), retour: !!h.querySelector("#sortir-fiche"),
        wa: (h.querySelector("[data-fiche-wa] a") || {}).href || "", tel: (h.querySelector("[data-fiche-tel] a") || { getAttribute: () => "" }).getAttribute("href"), notes: !!h.querySelector("#fe-notes"),
        points: !!h.querySelector("#fiche-points"), uneLigne: Math.max(...tops) - Math.min(...tops) <= 8, h: Math.round(r.height),
        onglets: Array.from(h.querySelectorAll(".fiche-onglets a")).map(a => a.textContent.trim() + (a.getAttribute("aria-current") ? ":ici" : "")), topbar: getComputedStyle(document.querySelector(".topbar")).display }; });
    ok("B1 : 390 px : une ligne — retour, « Thomas D. » (nom entier en bulle), « Client », WhatsApp (message prêt), Appeler, Notes, ⋯ — puis les 4 onglets (Aperçu marqué) ; la barre du haut cachée",
      e.prenom === "Thomas D." /* revue UX : l'initiale du nom */ && e.bulle === "Thomas Démo" && e.statut === "Client" && e.retour && /^https:\/\/wa\.me\/33639980001\?text=Salut%20Thomas/.test(e.wa) && e.tel === "tel:" + TEL1 && e.notes && e.points && e.uneLigne
        && JSON.stringify(e.onglets) === '["Aperçu:ici","Programme","Nutrition","Suivi"]' && e.topbar === "none", JSON.stringify(e));
    await page.evaluate(() => window.scrollTo(0, 1500)); await attendre(page, 500);
    const c = await page.evaluate(() => { const r = document.getElementById("fiche-entete").getBoundingClientRect(); return { top: Math.round(r.top), vis: r.bottom > 0 }; });
    ok("B2 : en descendant, l'en-tête reste collé en haut", c.top <= 1 && c.vis, JSON.stringify(c));
    await page.click("#fiche-points > summary").catch(() => {}); await attendre(page, 300);
    const p = await page.$$eval("#fiche-points a, #fiche-points button", l => l.map(x => (x.id || (x.hasAttribute("data-fe-compte") ? "compte" : "")) + ":" + x.textContent.trim())).catch(() => []);
    ok("B3 : « ⋯ » : Son compte, puis les actions du compte (mêmes boutons qu'avant : changer de statut, accès, archiver, supprimer)",
      p.length >= 5 && /^compte:Son compte$/.test(p[0]) && ["fc-changer", "fc-acces", "fc-archiver", "fc-supprimer"].every(id => p.some(x => x.startsWith(id + ":"))), JSON.stringify(p));
    await page.keyboard.press("Escape"); await page.evaluate(() => { const d = document.getElementById("fiche-points"); if (d) d.open = false; window.scrollTo(0, 0); });
    await page.click("#fe-notes"); await attendre(page, 600);
    ok("B4 : « Notes » ouvre le volet des notes privées", !!(await page.$(".volet-notes #nc-texte")), "");
    await page.keyboard.press("Escape"); await attendre(page, 400);
    /* l'ancienne adresse …/suivi mène à Bilans, dans l'onglet Suivi */
    await page.evaluate(id => { location.hash = "#/client/" + id + "/suivi"; }, C1); await attendre(page, 1600);
    const s = await page.evaluate(() => ({ h: location.hash, ici: ((document.querySelector(".fiche-onglets a[aria-current]") || {}).textContent || "").trim(), bilan: !!document.getElementById("bilan-vue") }));
    ok("B5 : #/client/<id>/suivi (ancienne adresse) ouvre « Bilans » (onglet Suivi marqué)", /\/bilan$/.test(s.h) && s.ici === "Suivi" && s.bilan, JSON.stringify(s));
    /* le témoin (en ligne / hors ligne) reste visible dans la fiche */
    await page.evaluate(() => { const e = document.getElementById("etat"); if (e) { e.textContent = "Hors ligne"; if (typeof miroirEtat === "function") miroirEtat(); } });
    const t = await page.evaluate(() => { const m = document.querySelector("#fiche-entete [data-etat-miroir]"); return m ? { t: m.textContent.trim(), vis: m.getClientRects().length > 0 } : null; });
    ok("B6 : dans la fiche (barre du haut cachée), le témoin de connexion est recopié dans l'en-tête", !!t && t.t === "Hors ligne", JSON.stringify(t));
    ok("B7 : l'en-tête n'écrit rien ; pas de défilement horizontal", db.ecritures.length === 0 && !(await deborde(page)), JSON.stringify(db.ecritures.slice(0, 3)));
  });

  /* =================== C. lot 3 : Bilans =================== */
  await bloc("C. Bilans", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db, { viewport: ORDI });
    await ouvrir(page, C1, "bilan", "#bilan-retours");
    await page.waitForSelector("#suivi-obj #obj-0", { timeout: 8000 }).catch(() => {});
    const o = await page.evaluate(() => { const ids = ["bilan-retours", "suivi-obj", "suivi-reg"].map(id => document.getElementById(id)); const pts = document.querySelector("#bilan-vue .bilan-points");
      const avant = (a, b) => !!(a && b && (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING));
      return { tous: ids.every(Boolean), ordre: avant(ids[0], ids[1]) && avant(ids[1], pts || ids[2]) && avant(pts || ids[1], ids[2]), retoursHaut: Math.round(ids[0] ? ids[0].getBoundingClientRect().top : 9999), objectifs: document.querySelectorAll("#suivi-obj #obj-0").length }; });
    ok("C1 : Bilans : ses retours et la réponse du coach en haut (au premier écran), puis les objectifs du mois (l'éditeur, une fois), puis les points du call et la régularité",
      o.tous && o.ordre && o.retoursHaut < 900 && o.objectifs === 1, JSON.stringify(o));
    ok("C2 : Bilans n'écrit rien à l'affichage", db.ecritures.length === 0, JSON.stringify(db.ecritures.slice(0, 3)));
  });

  /* =================== D. lot 4 : l'Aperçu sans doublons =================== */
  await bloc("D. Aperçu", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db, { viewport: MOBILE });
    await ouvrir(page, C1, "accueil", "#fc-etat");
    const a = await page.evaluate(() => { const v = document.getElementById("acc-vue"), t = v.textContent;
      return { cartes: ["fc-retour", "fc-poids", "fc-regularite", "fc-etat"].every(id => !!document.getElementById(id)), enBref: /En bref/.test(t), grille: !!v.querySelector(".fiche-grille"),
        h2: Array.from(v.querySelectorAll("h2")).map(h => h.textContent.trim()), tout: (document.getElementById("fc-questionnaire") || {}).getAttribute ? document.getElementById("fc-questionnaire").getAttribute("href") : "",
        formation: !!document.getElementById("fc-pf-faites"), fb: ((v.querySelector(".fc-fb-etat") || {}).textContent || "").trim() }; });
    ok("D1 : Aperçu d'un client : dernier retour, poids, régularité, état (Questionnaire « Tout voir » → Son questionnaire, séances de la formation) ; plus de « En bref » ni de cartes répétées",
      a.cartes && !a.enBref && !a.grille && /\/profil$/.test(a.tout) && a.formation && /^Ton feedback sur ce bilan/.test(a.fb), JSON.stringify(a));
    await ouvrir(page, C2, "accueil", "#fiche-reponses");
    const p = await page.evaluate(() => ({ rep: document.querySelectorAll("#fiche-reponses").length, dc: !!document.querySelector("details#fiche-decouverte"), dcOuvert: !!(document.querySelector("details#fiche-decouverte") || {}).open,
      chrono: !!document.querySelector("details#fiche-chrono"), contacter: !!document.getElementById("fiche-actions"), questDansDc: /Problème|Ce qui l'a bloqué/.test(((document.querySelector("#fiche-decouverte") || {}).textContent) || "") }));
    ok("D2 : fiche d'une prospecte : ses réponses une seule fois (#fiche-reponses), « Contacter », Découverte et Chronologie repliées, sans les réponses répétées",
      p.rep === 1 && p.dc && !p.dcOuvert && p.chrono && p.contacter && !p.questDansDc, JSON.stringify(p));
    ok("D3 : l'Aperçu n'écrit rien ; pas de défilement horizontal à 390 px", db.ecritures.length === 0 && !(await deborde(page)), JSON.stringify(db.ecritures.slice(0, 3)));
  });

  /* =================== E. lot 5 : « Aujourd'hui » =================== */
  await bloc("E. Aujourd'hui", async () => {
    const db = avecProspects(base(), 7, 0);
    for (let i = 1; i <= 7; i++) db.donnees.push({ user_id: NV(i), outil: "contact", contenu: { telephone: "+3363998" + String(1000 + i) }, maj_le: avant(H) });
    const { page } = await contexte(b, COACH, db, { viewport: MOBILE });
    await page.goto(URL0 + "#/tableau"); await pret(page, "#tb-vue .tb-chiffres"); await attendre(page, 600);
    const e = await page.evaluate(() => ({ ch: Array.from(document.querySelectorAll("#tb-vue .tb-chiffre")).map(x => x.id + "→" + x.dataset.tbAller), tuiles: document.querySelectorAll("#tb-vue .tb-tuile, #tb-vue .tiles").length,
      raccourcis: /Raccourcis/.test(document.getElementById("tb-vue").textContent), sources: !!document.getElementById("tb-sources"),
      groupes: Array.from(document.querySelectorAll("#tb-a-traiter .tb-groupe")).map(g => g.id),
      nv: { n: document.querySelectorAll("#tb-g-nouveaux .tb-l").length, tout: ((document.querySelector("#tb-g-nouveaux [data-tb-deplier]") || {}).textContent || "").trim() } }));
    ok("E1 : 4 chiffres-boutons vers leur groupe ; plus de tuiles, de « Raccourcis » ni d'« Inscrits par source » ; 5 groupes ; 7 nouveaux : 5 lignes et « Tout voir (7) »",
      JSON.stringify(e.ch) === '["tb-c-traiter→tb-a-traiter","tb-c-retours→tb-g-retours","tb-c-nouveaux→tb-g-nouveaux","tb-c-inactifs→tb-g-inactifs"]' && e.tuiles === 0 && !e.raccourcis && !e.sources
        && e.groupes.length === 5 && e.nv.n === 5 && e.nv.tout === "Tout voir (7)", JSON.stringify(e));
    const l = await page.$$eval("#tb-g-nouveaux .tb-l", l => l.map(li => { const b = li.querySelector("button[data-fiche]"), r = b.getBoundingClientRect(), wa = li.querySelector('a[href*="wa.me"]');
      return { fiche: !!b, haut: Math.round(r.height), wa: wa ? wa.getAttribute("href") : "", waT: wa ? Math.round(wa.getBoundingClientRect().height) : 0, tel: !!li.querySelector('a[href^="tel:"]') }; }));
    ok("E2 : chaque ligne d'un nouveau prospect s'ouvre en entier (bouton ≥ 44 px) ; Appeler et WhatsApp (wa.me…?text= : le message prêt), 44 px",
      l.length === 5 && l.every(x => x.fiche && x.haut >= 44 && /^https:\/\/wa\.me\/\d+\?text=./.test(x.wa) && x.waT >= 44 && x.tel), JSON.stringify(l));
    await page.click("#tb-c-nouveaux"); await attendre(page, 700);
    const g = await page.evaluate(() => { const r = document.getElementById("tb-g-nouveaux").getBoundingClientRect(); return { top: Math.round(r.top), n: document.querySelectorAll("#tb-g-nouveaux .tb-l").length }; });
    ok("E3 : le chiffre « Nouveaux » amène son groupe en haut de l'écran (sous la barre, pas dessous) et le déplie (7 lignes)", g.top >= 50 && g.top < 300 && g.n === 7, JSON.stringify(g));
    await page.click("#tb-g-nouveaux .tb-l button[data-fiche]"); await attendre(page, 1500);
    ok("E4 : toucher une ligne ouvre la fiche du prospect (Aperçu)", await page.evaluate(id => Store.idConsulte && Store.idConsulte.indexOf("0000000a") > -1 && /\/accueil$/.test(location.hash), NV(1)), await page.evaluate(() => location.hash));
    await page.evaluate(() => sortirFiche()); await attendre(page, 600);
    await page.evaluate(() => { location.hash = "#/suivi-commercial"; }); await attendre(page, 1800);
    ok("E5 : « Inscrits par source » est dans Prospects › Vue détaillée", !!(await page.$("#pr-vue #tb-sources")), "");
    ok("E6 : seule écriture possible : la visite du coach (coach_visite, une fois au plus)", db.ecritures.length <= 1 && db.ecritures.every(x => x.outil === "coach_visite"), JSON.stringify(db.ecritures.map(x => x.outil)));
  });

  /* =================== F. WhatsApp : toujours le message prêt (coach) =================== */
  await bloc("F. WhatsApp message prêt", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db, { viewport: ORDI });
    const liens = [];
    for (const [h, sel] of [["#/prospects", "#lc-prospects .lc-ligne"], ["#/suivi-commercial", "#pr-liste .sc-carte"], ["#/client/" + C2 + "/accueil", "#fiche-entete [data-fiche-wa] a"], ["#/client/" + C1 + "/accueil", "#fiche-entete [data-fiche-wa] a"]]) {
      await page.goto(URL0 + h); await pret(page, sel); await attendre(page, 800);
      liens.push(...await page.$$eval('#vue a[href*="wa.me"], #fiche-entete a[href*="wa.me"]', l => l.map(a => a.getAttribute("href"))).catch(() => []));
    }
    ok("F1 : chaque lien WhatsApp du coach (Prospects, Vue détaillée, en-tête des fiches) porte un message prêt (?text=…)", liens.length >= 2 && liens.every(x => /\?text=./.test(x)), JSON.stringify(liens));
  });

  /* =================== G. anglais =================== */
  await bloc("G. anglais", async () => {
    const db = base(); avecPrefsEnTous(db);
    const { page } = await contexte(b, COACH, db, { viewport: MOBILE, langue: "en" });
    await page.goto(URL0 + "#/tableau"); await pret(page, "#tb-vue .tb-chiffres"); await attendre(page, 600);
    const t = await page.evaluate(() => ({ bas: Array.from(document.querySelectorAll("#barre-bas a[data-id]")).map(a => a.textContent.replace(/\d+$/, "").replace(/\s+/g, " ").trim()),
      ch: Array.from(document.querySelectorAll("#tb-vue .tb-chiffre .t-lbl")).map(x => x.textContent.trim()), g: Array.from(document.querySelectorAll("#tb-a-traiter .tb-groupe h3")).map(h => h.firstChild.textContent.trim()) }));
    ok("G1 : en anglais : la barre du bas, les 4 chiffres et les titres des groupes sont traduits", !t.bas.some(x => /Aujourd'hui|Bibliothèque/.test(x)) && !t.ch.some(x => /traiter|Retours|Nouveaux|Inactifs/.test(x)) && !t.g.some(x => /Retours|Clients inactifs|Nouveaux prospects|Bilans réservés|À relancer/.test(x)), JSON.stringify(t));
    await ouvrir(page, C1, "accueil", "#fiche-entete .fiche-onglets");
    const f = await page.$$eval("#fiche-entete .fiche-onglets a, #fiche-entete .fiche-pages a", l => l.map(a => a.textContent.trim())).catch(() => []);
    ok("G2 : en anglais : les onglets et les pages de la fiche sont traduits", f.length >= 4 && !f.some(x => /Aperçu|Son questionnaire|Nutrition$/.test(x) && x !== "Nutrition") && !f.includes("Aperçu"), JSON.stringify(f));
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
