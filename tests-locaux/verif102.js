/* verif102 — v102 (chantier 8 de la nuit du 10/11/2026 : finitions et robustesse), dans un vrai navigateur (Supabase simulé,
   gabarit de verif95 : coach et clients des fixtures, aucune donnée réelle).
   A. une copie des brouillons gardée sur l'appareil est réunie à la base client par client (rien d'écrasé, rien de ressuscité) ;
   B. objectifs du mois : jamais par-dessus une publication faite ailleurs ; « Publier » attend un objectif en attente ;
   C. « Séance terminée » relit le journal (une séance notée ailleurs reste) ;
   D. éditeur inerte pendant la publication, échec annoncé après avoir quitté la fiche, catalogue illisible = « Pas de connexion » ;
   E. compte supprimé : ses brouillons partent aussi ; message de suppression hors ligne en français ; Mon entraînement illisible ;
   F. volet au clavier, 44 px, Ma progression (zone renommée), « Missing: » en anglais ;
   Z. aucune erreur de console ni erreur JS, aucun dialogue natif, aucun appel vers l'extérieur.
   Usage : node verif102.js ../index.html
           VERIF102_PORT=10113 node verif102.js ../index.html     (autre port, si 10112 est pris)
           VERIF102_BLOCS="A.,C." node verif102.js …               (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF102_PORT || 10112;
const BLOCS = (process.env.VERIF102_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
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
const COACH_ID = F.IDS.coach, C2 = F.IDS.c2;
const PROG = () => clone(F.donnees.find(x => x.user_id === C1 && x.outil === "programme").contenu);
const ligne = (db, uid, outil) => db.donnees.find(x => x.user_id === uid && x.outil === outil);
const brouillons = db => (ligne(db, COACH_ID, "brouillons_programme") || {}).contenu || null;
const avecProgramme = (B) => !!(B && B.programme);
const AUJ0 = new Date(T0).toISOString().slice(0, 10);
const ouvrirCoach = async (b, db, chemin, sel, opts) => { const { page, c } = await contexte(b, COACH, db, opts); await page.goto(FICHE(chemin || "programme")); await pret(page, sel || "#pg-publier"); return { page, c }; };

/* v104 (point 7) : dans la fiche d'un client, chaque exercice est replié en une ligne : le coach l'ouvre avant d'y toucher */
const ouvrirEx = async (page, si, ei) => { const d = `details[data-pli="${si}:${ei}"]`; if (await page.$(d) && !(await page.$eval(d, x => x.open))) await page.click(d + " > summary"); };
(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF102_PORT=10113 node verif102.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. brouillons : une copie gardée sur l'appareil n'écrase jamais les brouillons faits ailleurs =================== */
  await bloc("A. reprise des brouillons", async () => {
    const maintenant = new Date(T0 + 3600000).toISOString(), avant1 = new Date(T0 - 3600000).toISOString();
    const P = PROG(); P.seances[0].exercices[0].series = "7";
    /* la base : un brouillon du client 2 (autre appareil, récent) et une marque de retrait du client 3 (publié ailleurs, récent) */
    const db = base({ donnees: [[COACH_ID, "brouillons_programme", { v: 1, clients: { [C2]: { programme: P, ecrit_le: maintenant, appareil: "autre" }, [F.IDS.c3]: { retire_le: maintenant, ecrit_le: maintenant, appareil: "autre" } } }]] });
    ligne(db, COACH_ID, "brouillons_programme").maj_le = maintenant;
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/tableau"); await pret(page);
    /* la copie de CET appareil (faite hors ligne, plus tard que la base) : le client 1, et une vieille version du client 3 */
    const P1 = PROG(); P1.seances[0].exercices[0].series = "5";
    const P3 = PROG(); P3.nom = "ANCIEN BROUILLON";
    await page.evaluate(([moi, c1, c3, p1, p3, t, vieux]) => {
      localStorage.setItem("mhx_attente|" + moi + "|brouillons_programme", JSON.stringify({ a: moi, t: t, v: { v: 1, clients: { [c1]: { programme: p1, ecrit_le: t, appareil: "ici" }, [c3]: { programme: p3, ecrit_le: vieux, appareil: "ici" } } } }));
    }, [COACH_ID, C1, F.IDS.c3, P1, P3, new Date(T0 + 7200000).toISOString(), avant1]);
    await page.evaluate(() => Store.reprendre());
    await attendreQue(() => { const B = brouillons(db); return !!(B && B.clients && B.clients[C1]); }, 6000);
    const B = brouillons(db) || { clients: {} };
    ok("A1 : une copie des brouillons gardée sur l'appareil est réunie à la base, client par client : le brouillon du client 1 arrive, celui du client 2 (fait ailleurs) reste, la vieille version du client 3 ne revient pas",
      avecProgramme(B.clients[C1]) && B.clients[C1].programme.seances[0].exercices[0].series === "5" && avecProgramme(B.clients[C2]) && B.clients[C2].programme.seances[0].exercices[0].series === "7" && !avecProgramme(B.clients[F.IDS.c3]),
      JSON.stringify(Object.keys(B.clients).map(k => k.slice(-3) + ":" + (B.clients[k].programme ? "brouillon" : "retiré"))));
  });

  /* =================== B. objectifs du mois : jamais par-dessus une publication faite ailleurs =================== */
  /* v104 (point 5) : changement voulu — les objectifs du mois d'un client se tapent dans l'onglet Suivi de sa fiche
     (#/client/<id>/suivi, mêmes champs #obj-0..2, même écriture, ObjectifsCoach) et plus sur la page Programme (lecture seule) ;
     « Publier les changements » reste sur Programme. Mêmes scénarios : l'objectif est tapé dans Suivi ; pour B3 et B4, on passe
     de Suivi à Programme (navigation dans la page, comme le coach) avant « Publier » ; B4 garde « dans la seconde ». */
  const versPage = async (page, outil, sel) => { await page.evaluate(h => { location.hash = h; }, "#/client/" + C1 + "/" + outil); await page.waitForSelector(sel, { timeout: 8000 }); };
  await bloc("B. objectifs du mois", async () => {
    const db = base();
    const { page } = await ouvrirCoach(b, db, "suivi", "#obj-0");
    /* un autre appareil publie pendant que cette page est ouverte */
    const l = ligne(db, C1, "programme"); l.contenu = clone(l.contenu); l.contenu.seances[0].exercices[0].series = "6"; l.maj_le = new Date(T0 + 60000).toISOString();
    const n0 = ecr(db, "programme", C1).length;
    await page.fill("#obj-0", "Marcher 8 000 pas"); await attendre(page, 2000);
    const t = await page.evaluate(() => Array.from(document.querySelectorAll(".toast")).map(x => x.textContent).join(" | "));
    ok("B1 : un objectif tapé après une publication faite ailleurs : rien n'est écrit (la publication reste), le coach est prévenu",
      ecr(db, "programme", C1).length === n0 && ligne(db, C1, "programme").contenu.seances[0].exercices[0].series === "6" && /publié ailleurs/.test(t), JSON.stringify([ecr(db, "programme", C1).length - n0, t]));
    const db2 = base();
    const { page: p2 } = await ouvrirCoach(b, db2, "suivi", "#obj-0");
    await p2.fill("#obj-0", "Marcher 8 000 pas"); await attendre(p2, 2200);
    const e = ecr(db2, "programme", C1).pop();
    ok("B2 : sans publication ailleurs : l'objectif est écrit dans le programme publié, le reste inchangé", !!e && e.contenu.objectifs && e.contenu.objectifs.liste[0] === "Marcher 8 000 pas" && e.contenu.seances[0].exercices[0].series === "4", JSON.stringify(e && e.contenu.objectifs));
    /* un objectif qui attend son envoi (panne) bloque la publication */
    const db3 = base(); db3.panneEcriture = "programme";
    const { page: p3 } = await ouvrirCoach(b, db3, "suivi", "#obj-0");
    await p3.fill("#obj-0", "Dormir 8 h"); await attendre(p3, 2200);
    await versPage(p3, "programme", "#pg-publier"); await attendre(p3, 800);
    await ouvrirEx(p3, 0, 0); await p3.fill('[data-f="series"][data-s="0"][data-e="0"]', "5"); await attendre(p3, 1500);
    await p3.click("#pg-publier"); await attendreQue(() => p3.evaluate(() => (document.getElementById("pg-pub-msg") || {}).textContent.trim() !== ""), 8000);
    const m3 = await texte(p3, "#pg-pub-msg");
    ok("B3 : un objectif qui attend son envoi : « Publier » ne passe pas par-dessus (« … attend son envoi : réessaie dans un instant. »)", /attend son envoi/.test(m3 || ""), m3);
    /* relecture : un objectif tapé, puis « Publier » dans la seconde : la nouvelle version reste en ligne, avec l'objectif */
    const db4 = base();
    const { page: p4 } = await ouvrirCoach(b, db4);
    await ouvrirEx(p4, 0, 0); await p4.fill('[data-f="series"][data-s="0"][data-e="0"]', "5"); await attendre(p4, 1300);
    await versPage(p4, "suivi", "#obj-0");
    await p4.fill("#obj-0", "Boire 2 L");
    await versPage(p4, "programme", "#pg-publier");
    await p4.click("#pg-publier");
    await attendreQue(() => p4.evaluate(() => /^Publié/.test((document.getElementById("pg-pub-msg") || {}).textContent || "")), 8000); await attendre(p4, 2500);
    const fin4 = ligne(db4, C1, "programme").contenu;
    /* relecture 2 : une vieille copie d'objectifs (tapés hors ligne le mois d'avant) ne remplace pas ceux posés ensuite ailleurs */
    const db5 = base(); const l5 = ligne(db5, C1, "programme");
    l5.contenu = Object.assign(clone(l5.contenu), { objectifs: { mois: AUJ0.slice(0, 7), liste: ["Novembre", "", ""], statuts: ["", "", ""] } }); l5.maj_le = avant(H);
    const { page: p5 } = await ouvrirCoach(b, db5, "suivi", "#obj-0");
    await p5.evaluate(([T, C, v, t]) => { localStorage.setItem("mhx_attente|" + T + "|programme", JSON.stringify({ o: 1, a: C, t, v })); },
      [C1, COACH_ID, Object.assign(clone(l5.contenu), { objectifs: { mois: "2000-10", liste: ["Octobre", "", ""], statuts: ["", "", ""] } }), avant(2 * H)]);
    const n5 = ecr(db5, "programme", C1).length;
    await p5.reload(); await pret(p5, "#obj-0"); await attendre(p5, 2500);
    const v5 = await p5.$eval("#obj-0", e => e.value).catch(() => null);
    const reste5 = await p5.evaluate(T => !!localStorage.getItem("mhx_attente|" + T + "|programme"), C1);
    ok("B5 : une vieille copie d'objectifs (plus ancienne que la base) n'est ni affichée ni envoyée, puis retirée : « Novembre » reste",
      v5 === "Novembre" && ecr(db5, "programme", C1).length === n5 && ligne(db5, C1, "programme").contenu.objectifs.liste[0] === "Novembre" && !reste5,
      JSON.stringify([v5, ecr(db5, "programme", C1).length - n5, reste5]));
    ok("B4 : un objectif tapé puis « Publier » dans la seconde : la version publiée reste en ligne (5 séries) et garde l'objectif",
      fin4.seances[0].exercices[0].series === "5" && fin4.objectifs && fin4.objectifs.liste[0] === "Boire 2 L", JSON.stringify([fin4.seances[0].exercices[0].series, fin4.objectifs && fin4.objectifs.liste]));
  });

  /* =================== C. « Séance terminée » relit le journal =================== */
  await bloc("C. journal relu", async () => {
    const db = base({ donnees: [[C1, "journal", { seances: [] }]] });
    const { page } = await contexte(b, THOMAS, db);
    await page.goto(URL0 + "#/programme"); await pret(page, "#prog-nb");
    /* une séance notée sur un autre appareil pendant que cette page est ouverte */
    ligne(db, C1, "journal").contenu = { seances: [{ date: AUJ0, si: 1, nom: "Séance B — Bas du corps", exos: [{ nom: "Squat barre", series: [{ r: 8, c: 60 }] }] }] };
    ligne(db, C1, "journal").maj_le = new Date(T0 + 60000).toISOString();
    await page.click('[data-jr="0"] [data-jr-ouvrir]');
    await page.fill('[data-jr="0"] [data-jr-ex="0"] [data-r="0"]', "8");
    await page.click('[data-jr-fin="0"]'); await attendre(page, 2000);
    const J = ligne(db, C1, "journal").contenu;
    ok("C1 : une séance notée ailleurs depuis l'ouverture de la page n'est pas effacée par « Séance terminée » (les deux restent)",
      J.seances.length === 2 && J.seances.some(x => x.nom === "Séance B — Bas du corps") && J.seances.some(x => x.si === 0), JSON.stringify(J.seances.map(x => x.si)));
    /* relecture : sans réseau (lectures et écritures coupées), « Séance terminée » enregistre sur l'appareil, comme avant */
    const db2 = base({ donnees: [[C1, "journal", { seances: [] }]] });
    const { page: p2, c: c2 } = await contexte(b, THOMAS, db2);
    await p2.goto(URL0 + "#/programme"); await pret(p2, "#prog-nb");
    await c2.route(/\/rest\/v1\/donnees/, r => r.abort());
    await p2.click('[data-jr="0"] [data-jr-ouvrir]');
    await p2.fill('[data-jr="0"] [data-jr-ex="0"] [data-r="0"]', "9");
    await p2.click('[data-jr-fin="0"]'); await attendre(p2, 2000);
    const hors = await p2.evaluate(() => { const k = Object.keys(localStorage).find(x => x.startsWith("mhx_attente|") && x.endsWith("|journal")); const v = k ? JSON.parse(localStorage.getItem(k)).v : null; return { copie: !!v && v.seances.length === 1, msg: (document.querySelector("[id^=jr-ok-]") || {}).textContent || "" }; });
    await c2.unroute(/\/rest\/v1\/donnees/);
    ok("C2 : sans réseau, « Séance terminée » garde la séance sur l'appareil (« Séance enregistrée »), elle repartira seule", hors.copie && /Séance enregistrée/.test(hors.msg), JSON.stringify(hors));
  });

  /* =================== D. publication : éditeur inerte, page quittée, catalogue illisible =================== */
  await bloc("D. publication et catalogue", async () => {
    const db = base(); db.lentEcriture = { outil: "programme", ms: 2500 };
    const { page } = await ouvrirCoach(b, db);
    await ouvrirEx(page, 0, 0); await page.fill('[data-f="series"][data-s="0"][data-e="0"]', "5"); await attendre(page, 1200);
    await page.click("#pg-publier"); await attendre(page, 700);
    const inerte = await page.evaluate(() => document.querySelectorAll("#prog-vue > section[inert]").length);
    await attendreQue(() => page.evaluate(() => /^Publié/.test((document.getElementById("pg-pub-msg") || {}).textContent || "")), 8000);
    const apres = await page.evaluate(() => document.querySelectorAll("#prog-vue [inert]").length);
    ok("D1 : pendant « Publication… », l'éditeur ne prend aucune frappe (inerte) ; après, il revient", inerte > 0 && apres === 0, JSON.stringify([inerte, apres]));
    /* hors ligne, « Publier », puis la fiche quittée : le coach est prévenu */
    const db2 = base(); db2.panneEcriture = "programme";
    const { page: p2, c: cp2 } = await ouvrirCoach(b, db2);
    await cp2.route(/outil=eq\.programme&select=contenu,maj_le/, async r => { await new Promise(k => setTimeout(k, 1500)); return r.fallback(); });   // la relecture d'avant la publication prend du temps
    await ouvrirEx(p2, 0, 0); await p2.fill('[data-f="series"][data-s="0"][data-e="0"]', "5"); await attendre(p2, 1200);
    db2.lentEcriture = { outil: "programme", ms: 1500 };
    await p2.click("#pg-publier"); await attendre(p2, 300);
    await p2.evaluate(() => { location.hash = "#/clients"; }); await attendre(p2, 3500);
    const t2 = await p2.evaluate(() => Array.from(document.querySelectorAll(".toast")).map(x => x.textContent).join(" | "));
    ok("D2 : « Publier » qui échoue après que le coach a quitté la fiche : « Programme non publié : ton brouillon est gardé. »", /Programme non publié : ton brouillon est gardé/.test(t2), t2);
    /* Mes programmes › Ma base, catalogue illisible : « Pas de connexion », jamais « aucun programme » */
    const { page: p3, c: c3 } = await contexte(b, COACH, base());
    await c3.route(/\/rest\/v1\/programmes_types/, r => r.abort());
    await c3.route(/raw\.githubusercontent\.com|\/donnees\/programmes/, r => r.abort());
    await p3.goto(URL0 + "#/mes-programmes/base"); await pret(p3); await attendre(p3, 2500);
    const hl = await p3.evaluate(() => ({ hl: !!document.getElementById("page-hors-ligne"), vide: /Aucun programme dans ta base/.test(document.body.innerText) }));
    ok("D3 : « Ma base » quand le catalogue ne se lit pas : « Pas de connexion » (jamais « Aucun programme dans ta base »)", hl.hl && !hl.vide, JSON.stringify(hl));
    /* « Changer ce repas » quand les recettes ne se lisent pas */
    const { page: p4, c: c4 } = await contexte(b, COACH, base());
    await c4.route(/\/rest\/v1\/recettes/, r => r.abort());
    await p4.goto(FICHE("nutrition")); await pret(p4, "#nu-publier");
    /* v104 (point 6) : les repas du coach sont repliés : il ouvre le premier (clic sur son résumé) avant « Changer ce repas » */
    await p4.evaluate(() => { const s = document.querySelector('#nu-vue details[data-pli-repas="0:0"] > summary'); if (s) s.click(); }); await attendre(p4, 150);
    await p4.click('[data-autre="0:0"]'); await attendre(p4, 2500);
    const m4 = await texte(p4, "#nu-msg");
    ok("D4 : « Changer ce repas » sans catalogue : « Pas de connexion : les recettes n'ont pas pu être lues… », jamais « pas d'autre recette »", /^Pas de connexion : les recettes/.test(m4 || ""), m4);
  });

  /* =================== E. compte supprimé, messages, Mon entraînement =================== */
  await bloc("E. suppression et messages", async () => {
    const P = PROG();
    const db = base({ donnees: [[COACH_ID, "brouillons_programme", { v: 1, clients: { [C2]: { programme: P, ecrit_le: new Date(T0).toISOString(), appareil: "x" } } }]] });
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/comptes"); await pret(page); await attendre(page, 800);
    const fait = page.evaluate(id => Acces.supprimer({ id, prenom: "Sarah", nom: "Démo" }), C2);
    await attendreQue(() => fenetre(page), 4000); await toucherFenetre(page, "Continuer");
    await attendreQue(() => page.evaluate(() => !!document.getElementById("ui-champ")), 4000);
    await page.fill("#ui-champ", "SUPPRIMER"); await toucherFenetre(page, "Supprimer définitivement");
    const r = await fait; await attendre(page, 1500);
    const B = brouillons(db) || { clients: {} };
    ok("E1 : un compte supprimé par le coach : son brouillon quitte aussi le compte du coach (droit à l'effacement)", r === "fait" && !avecProgramme(B.clients[C2]), JSON.stringify([r, B.clients[C2]]));
    /* le client supprime son compte hors ligne : un message en français qui dit quoi faire (pas « Failed to fetch ») */
    const { page: cl, c: cc } = await contexte(b, THOMAS, base());
    await cc.route(/\/functions\/v1\//, r2 => r2.abort());
    await cl.goto(URL0 + "#/profil"); await pret(cl, "#sv-suppr");
    await cl.click("#sv-suppr"); await attendreQue(() => fenetre(cl), 4000); await toucherFenetre(cl, "Continuer");
    await attendreQue(() => cl.evaluate(() => !!document.getElementById("ui-champ")), 4000);
    await cl.fill("#ui-champ", "SUPPRIMER"); await toucherFenetre(cl, "Supprimer définitivement"); await attendre(cl, 2500);
    const m = await texte(cl, "#sv-suppr-msg");
    ok("E2 : suppression de compte hors ligne : « Suppression impossible : vérifie ta connexion et réessaie. … » (jamais un message technique en anglais)", /^Suppression impossible : vérifie ta connexion/.test(m || ""), m);
    /* Mon entraînement (coach) : lecture ratée = « Pas de connexion » */
    const db3 = base(); db3.panneLecture = "perf";
    const { page: p3 } = await contexte(b, COACH, db3);
    await p3.goto(URL0 + "#/entrainement"); await pret(p3); await attendre(p3, 1500);
    ok("E3 : « Mon entraînement » qui ne se lit pas : « Pas de connexion », pas « aucune séance »", await p3.evaluate(() => !!document.getElementById("page-hors-ligne")), "");
  });

  /* =================== F. accessibilité et traductions =================== */
  await bloc("F. accessibilité", async () => {
    const db = base();
    const { page } = await contexte(b, THOMAS, db, { viewport: MOBILE });
    await page.goto(URL0 + "#/accueil"); await pret(page, ".masthead");
    await page.click("#rond-profil");   // v106 (lot 6) : plus de « Plus » pour le client : le volet de son rond de profil (« Mon profil ») await attendre(page, 400);
    const f1 = await page.evaluate(() => ({ focus: document.activeElement && document.activeElement.matches("[data-ui-fermer]"), nom: !!document.querySelector(".volet[aria-labelledby]") }));
    for (let i = 0; i < 12; i++) await page.keyboard.press("Tab");
    const dedans = await page.evaluate(() => !!(document.activeElement && document.activeElement.closest(".volet")));
    ok("F1 : le volet « Mon profil » (v106 ; avant : « Tout mon espace ») : le focus clavier y entre (sur la croix), il porte le nom de son titre, et Tab reste dedans", f1.focus && f1.nom && dedans, JSON.stringify([f1, dedans]));
    await page.keyboard.press("Escape"); await attendre(page, 300);
    await page.goto(URL0 + "#/nutrition"); await pret(page, ".repas-c");
    const h = await page.evaluate(() => Array.from(document.querySelectorAll(".repas-c .repas-tete button")).map(x => Math.round(x.getBoundingClientRect().height)));
    ok("F2 : « Respecté ? » et « Remplacer » : 44 px", h.length > 0 && h.every(x => x >= 44), JSON.stringify(h.slice(0, 4)));
    /* Ma progression : renommer une zone n'efface plus les centimètres tapés */
    await page.goto(URL0 + "#/mensurations"); await pret(page, "#ez0");
    await page.evaluate(() => { const x = document.getElementById("ez0"); x.value = "88"; x.dispatchEvent(new Event("input", { bubbles: true })); });
    await page.evaluate(() => { const z = document.getElementById("z0"); z.value = "Tour de taille"; z.dispatchEvent(new Event("input", { bubbles: true })); z.dispatchEvent(new Event("change", { bubbles: true })); }); await attendre(page, 600);
    ok("F3 : Ma progression : renommer une zone (frappe puis sortie du champ) n'efface plus les centimètres tapés dans « Nouvelle mesure »", (await page.inputValue("#ez0")) === "88", await page.inputValue("#ez0"));
    /* en anglais : « Il manque : … » et la bascule de la bannière d'installation */
    const db2 = base(); const pr = db2.donnees.find(d => d.user_id === C1 && d.outil === "prefs"); if (pr) pr.contenu = Object.assign({}, pr.contenu, { langue: "en" }); else db2.donnees.push({ user_id: C1, outil: "prefs", contenu: { langue: "en" }, maj_le: avant(J) });
    const it = db2.donnees.find(d => d.user_id === C1 && d.outil === "intake"); it.contenu = Object.assign({}, it.contenu); delete it.contenu.ville; delete it.contenu.age;
    const { page: en } = await contexte(b, THOMAS, db2, { langue: "en" });
    await en.goto(URL0 + "#/profil"); await pret(en, "#p-save");
    await en.click("#p-save"); await attendre(en, 600);
    const pm = await texte(en, "#p-msg");
    ok("F4 : en anglais, profil incomplet : « Missing: … » (plus « Il manque : … »)", /^Missing: /.test(pm || ""), pm);
  });

  /* =================== Z. console, hôtes externes =================== */
  await bloc("Z. console et hôtes externes", async () => {
    const autres = Array.from(externes).filter(h => !/^(fonts\.(googleapis|gstatic)\.com|i\.ytimg\.com|img\.youtube\.com|www\.youtube-nocookie\.com|raw\.githubusercontent\.com)$/.test(h));
    const erreurs = ERREURS.filter(e => !/ERR_FAILED|Failed to load resource|net::/.test(e));
    ok("Z1 : aucune erreur de console ni erreur JS ni dialogue natif pendant la suite (hors les requêtes coupées exprès), aucun appel vers l'extérieur",
      erreurs.length === 0 && autres.length === 0, JSON.stringify(erreurs.slice(0, 5)) + " " + JSON.stringify(autres));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
