/* verif96 — v96 (chantier 1 de la nuit du 10/11/2026, plan-etape3 3a à 3c : le brouillon des programmes), dans un vrai
   navigateur (Supabase simulé, gabarit de verif95 : coach et clients des fixtures, aucune donnée réelle).
   A. données au format actuel, sans aucune action du coach : le client voit exactement le même programme, la même diète, le
      même historique ; le coach ouvre la fiche : « ✓ Publié », aucun brouillon fantôme, rien d'écrit (aucune conversion) ;
   B. le brouillon (clé brouillons_programme, sur le compte du coach) : rien chez le client avant « Publier les changements » ;
      rechargement, « Annuler le brouillon » ; publication : une écriture (tout ou rien), historique, identifiants fixes ;
      « Rien à publier » ; deux appareils : relire avant de publier (programme publié ailleurs, brouillon modifié ailleurs) ;
      changement de fiche pendant la saisie : le brouillon reste rangé pour le bon client ;
   C. le « ✓ notée » ne glisse jamais : ancienne séance notée (par sa place) après suppression ou déplacement d'une séance,
      nouvelle séance notée (identifiant fixe + place), accueil ;
   D. outils rapides : + / − (séries, répétitions, repos) et clavier, ↑ ↓, « Dupliquer », « Dernière fois », 44 px, 390 px ;
   E. « Nouveau bloc à partir de celui-ci » : cycle + 1, « ≈ identique », publication (semaine 1, historique), annonce chez le
      client jusqu'à « C'est noté » (rien d'écrit) ;
   F. coach en anglais ;
   G. relecture : deux pages sur deux clients (aucun brouillon effacé ni fantôme), séance notée par une ancienne version après
      la publication des identifiants (places_le, départage par le nom), séance en cours rangée par l'identifiant ;
   Z. aucune erreur de console ni erreur JS, aucun dialogue natif, aucun appel vers l'extérieur.
   Usage : node verif96.js ../index.html
           VERIF96_PORT=10099 node verif96.js ../index.html     (autre port, si 10096 est pris)
           VERIF96_BLOCS="A.,C." node verif96.js …               (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF96_PORT || 10096;
const BLOCS = (process.env.VERIF96_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
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
const F_REPAS = clone(F.donnees.find(x => x.user_id === C1 && x.outil === "repas").contenu);
const AUJ0 = new Date(T0).toISOString().slice(0, 10);
const COACH_ID = F.IDS.coach, C2 = F.IDS.c2;
const FICHE2 = outil => URL0 + "#/client/" + C2 + "/" + outil;
const PROG = () => clone(F.donnees.find(x => x.user_id === C1 && x.outil === "programme").contenu);
const nomsSeances = P => (P.seances || []).map(s => s.nom);
const seanceJ = (si, nom, extra) => Object.assign({ date: AUJ0, si, nom, exos: [{ nom: "Développé couché", series: [{ r: 8, c: 52.5 }, { r: 8, c: 52.5 }, { r: 8, c: 52.5 }, { r: 8, c: 52.5 }] }] }, extra || {});
const brouillons = db => { const l = db.donnees.find(x => x.user_id === COACH_ID && x.outil === "brouillons_programme"); return l ? l.contenu : null; };
const publie = (db, uid) => { const l = db.donnees.find(x => x.user_id === (uid || C1) && x.outil === "programme"); return l ? l.contenu : null; };
const statut = page => texte(page, "#pg-statut");
const ouvrirCoach = async (b, db, opts) => { const { page, c } = await contexte(b, COACH, db, opts); await page.goto(FICHE("programme")); await pret(page, "#pg-publier"); return { page, c }; };
const ouvrirClient = async (b, db, hash, sel, opts) => { const { page, c } = await contexte(b, THOMAS, db, opts); await page.goto(URL0 + (hash || "#/programme")); await pret(page, sel || "#prog-nb"); return { page, c }; };
/* la vue du client : séances (titre, pastille « notée »), exercices et chiffres, dans l'ordre affiché */
const vueClient = page => page.evaluate(() => Array.from(document.querySelectorAll("#prog-vue .seance-c")).map(s => ({
  nom: (s.querySelector("h2") || {}).textContent, notee: !!s.querySelector(".seance-c-tete .pastille.ok"),
  ex: Array.from(s.querySelectorAll(".ex-lecture .haut")).map(h => h.textContent.replace(/\s+/g, " ").trim()) })));
const attendreBrouillon = (db, f) => attendreQue(async () => { const B = brouillons(db); return !!(B && f(B)); }, 4000);
const publier = async (page) => {
  await page.click("#pg-publier");
  await attendreQue(() => page.evaluate(() => { const b = document.getElementById("pg-publier"), m = document.getElementById("pg-pub-msg"), f = document.querySelector(".fond .modale"); return !!f || (!!b && !b.disabled && !!m && m.textContent.trim() !== ""); }), 9000);
  return { msg: await texte(page, "#pg-pub-msg"), modale: await fenetre(page) };
};
const champ = (si, ei, f) => `[data-f="${f}"][data-s="${si}"][data-e="${ei}"]`;

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF96_PORT=10099 node verif96.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. données d'aujourd'hui : rien ne change sans action du coach =================== */
  await bloc("A. compatibilité", async () => {
    const db = base();
    const P0 = PROG();
    /* le client : programme, historique, diète, accueil — tels quels, aucune écriture */
    const { page: cl } = await ouvrirClient(b, db);
    const v = await vueClient(cl);
    const attendu = P0.seances.filter(s => (s.exercices || []).some(e => e.nom)).map(s => s.nom);
    const exosOk = P0.seances.every((s, i) => !v[i] || (s.exercices || []).filter(e => e.nom).every((e, k) => (v[i].ex[k] || "").startsWith(e.nom) && v[i].ex[k].includes(e.series) && v[i].ex[k].includes(e.reps)));
    ok("A1 : client, programme au format actuel (sans identifiants) : mêmes séances, mêmes exercices, mêmes chiffres, dans le même ordre",
      JSON.stringify(v.map(x => x.nom)) === JSON.stringify(attendu) && exosOk, JSON.stringify(v.map(x => x.nom)));
    await cl.goto(URL0 + "#/accueil"); await pret(cl, ".masthead");
    const annonce = await cl.evaluate(() => !!document.getElementById("bloc-annonce"));
    await cl.goto(URL0 + "#/nutrition"); await pret(cl); await attendre(cl, 800);
    const repas = await cl.evaluate(() => document.body.innerText);
    const R = F_REPAS, jour = R.jours[(new Date().getDay() + 6) % 7] || R.jours[0];
    await cl.goto(URL0 + "#/programme"); await pret(cl, "#prog-nb");
    await cl.click("[data-hist-ouvrir]").catch(() => {}); await attendre(cl, 800);
    const hist = await cl.evaluate(() => (document.getElementById("prog-hist") || {}).innerText || "");
    ok("A2 : client : sa diète (repas du jour), son historique (« Bloc 0 — mise en route ») et son accueil (aucune annonce « Nouveau bloc ») inchangés",
      jour.repas.every(x => repas.includes(x.nom)) && hist.includes("Bloc 0 — mise en route") && !annonce, JSON.stringify([jour.repas.map(x => x.nom), hist.slice(0, 120), annonce]));
    /* le coach ouvre la fiche : « Publié », aucun brouillon fantôme, rien d'écrit */
    const { page: co } = await ouvrirCoach(b, db);
    await attendre(co, 1500);
    const st = await statut(co);
    const ecrites = db.ecritures.filter(e => e.table === "donnees" && ["programme", "brouillons_programme", "hist_programme", "journal", "repas", "repas_suivi", "hist_repas"].includes(e.outil));
    ok("A3 : le coach ouvre le programme du client : « ✓ Publié », aucun brouillon fantôme ; ni le coach ni le client n'ont rien écrit (programme, brouillon, historique, journal, diète)",
      /Publié/.test(st || "") && !/Brouillon/.test(st || "") && ecrites.length === 0 && !brouillons(db), JSON.stringify([st, ecrites.map(e => e.user_id.slice(-4) + ":" + e.outil)]));
    ok("A4 : le programme en base n'a reçu aucun champ (pas d'identifiant posé à la lecture)",
      JSON.stringify(publie(db)) === JSON.stringify(P0), "modifié");
  });

  /* =================== B. le brouillon et « Publier » =================== */
  await bloc("B. brouillon", async () => {
    const db = base();
    const { page: co } = await ouvrirCoach(b, db);
    await co.fill(champ(0, 0, "series"), "5");
    await attendreBrouillon(db, B => B.clients && B.clients[C1]);
    await attendre(co, 300);
    const B1 = brouillons(db), e1 = B1 && B1.clients[C1];
    ok("B1 : une saisie part dans le brouillon, sur le compte du coach (brouillons_programme), pas chez le client ; « ● Brouillon non publié »",
      !!e1 && e1.programme.seances[0].exercices[0].series === "5" && ecr(db, "programme").length === 0 && publie(db).seances[0].exercices[0].series === "4" && /Brouillon non publié/.test(await statut(co) || "")
      && ecr(db, "brouillons_programme").every(x => x.user_id === COACH_ID), JSON.stringify([!!e1, ecr(db, "programme").length, await statut(co)]));
    const { page: cl } = await ouvrirClient(b, db);
    const v = await vueClient(cl);
    ok("B2 : pendant ce temps, le client voit toujours « 4 » séries (la version publiée)", /4 séries/.test(v[0].ex[0]), v[0].ex[0]);
    await co.reload(); await pret(co, "#pg-publier");
    ok("B3 : le coach recharge la page : son brouillon revient (5 séries, « Brouillon non publié »)",
      (await co.inputValue(champ(0, 0, "series"))) === "5" && /Brouillon non publié/.test(await statut(co) || ""), await co.inputValue(champ(0, 0, "series")));
    await co.click("#pg-annuler-brouillon"); await attendre(co, 300);
    const m = await fenetre(co); await toucherFenetre(co, "Annuler le brouillon");
    await attendreBrouillon(db, B => !B.clients[C1]); await attendre(co, 300);
    ok("B4 : « Annuler le brouillon » (avec confirmation) : le brouillon de ce client est retiré, l'éditeur montre la version publiée, « ✓ Publié », rien chez le client",
      /Tes changements non publiés seront perdus/.test(m || "") && !brouillons(db).clients[C1] && (await co.inputValue(champ(0, 0, "series"))) === "4" && /Publié/.test(await statut(co) || "") && ecr(db, "programme").length === 0, JSON.stringify([m, brouillons(db)]));
    /* publier : l'ancien dans l'historique, le nouveau d'un coup, le brouillon retiré */
    await co.fill(champ(0, 0, "reps"), "6-8");
    await attendreBrouillon(db, B => B.clients && B.clients[C1]);
    const avantHist = ecr(db, "hist_programme").length;
    const r = await publier(co);
    await attendreBrouillon(db, B => !B.clients[C1]); await attendre(co, 300);
    const P = publie(db), H = db.donnees.find(x => x.user_id === C1 && x.outil === "hist_programme").contenu;
    ok("B5 : « Publier les changements » : « Publié. … » ; une seule écriture du programme (tout ou rien) avec la modification, sa date et un identifiant fixe par séance ; l'ancien bloc entre dans l'historique ; le brouillon est retiré ; « ✓ Publié »",
      r.msg === "Publié. Ton client voit la nouvelle version dès sa prochaine ouverture." && ecr(db, "programme").length === 1 && P.seances[0].exercices[0].reps === "6-8" && !!P.maj
      && P.seances.every(s => typeof s.sid === "string" && s.sid) && new Set(P.seances.map(s => s.sid)).size === P.seances.length
      && ecr(db, "hist_programme").length === avantHist + 1 && H.liste[0].contenu.seances[0].exercices[0].reps === "8-10" && /Publié/.test(await statut(co) || ""),
      JSON.stringify([r, ecr(db, "programme").length, P && P.maj, H.liste.length]));
    ok("B6 : le programme publié garde sa forme (mêmes champs, plus seulement des ajouts : sid, places, publie_le) ; le client voit « 6-8 »",
      ["nom", "note", "debut", "maj", "seances"].every(k => k in P) && P.places && Object.keys(P.places).length === PROG().seances.length && /6-8 reps/.test((await (async () => { await cl.reload(); await pret(cl, "#prog-nb"); return (await vueClient(cl))[0].ex[0]; })()) || ""), JSON.stringify(Object.keys(P)));
    await co.click("#pg-publier"); await attendre(co, 400);
    ok("B7 : « Publier » sans changement : « Rien à publier : ton client voit déjà cette version. », rien d'écrit",
      (await texte(co, "#pg-pub-msg")) === "Rien à publier : ton client voit déjà cette version." && ecr(db, "programme").length === 1, await texte(co, "#pg-pub-msg"));
  });

  await bloc("B. deux appareils", async () => {
    const db = base();
    const { page: p1 } = await ouvrirCoach(b, db);
    const { page: p2 } = await ouvrirCoach(b, db);
    /* l'appareil 2 publie ; l'appareil 1, ouvert avant, publie ensuite */
    await p2.fill(champ(0, 0, "series"), "6"); await attendre(p2, 900);
    const r2 = await publier(p2);
    await p1.fill(champ(1, 0, "series"), "2"); await attendre(p1, 900);
    const r1 = await publier(p1);
    ok("B8 : deux appareils : la page ouverte avant une publication faite ailleurs demande « … modifié ailleurs … Le remplacer par ton brouillon ? » avant d'écrire",
      /^Publié/.test(r2.msg || "") && /modifié ailleurs/.test(r1.modale || "") && ecr(db, "programme").length === 1, JSON.stringify([r2.msg, r1.modale, ecr(db, "programme").length]));
    await toucherFenetre(p1, "Ne rien publier"); await attendre(p1, 600);
    ok("B9 : « Ne rien publier » : rien n'est écrit, le programme reste celui de l'autre appareil (6 séries)", ecr(db, "programme").length === 1 && publie(db).seances[0].exercices[0].series === "6", String(ecr(db, "programme").length));
    const r1b = await publier(p1);
    await toucherFenetre(p1, "Remplacer");
    await attendreQue(() => p1.evaluate(() => /^Publié/.test(document.getElementById("pg-pub-msg").textContent)), 6000);
    ok("B10 : « Remplacer » : la version de cet appareil est publiée (une écriture de plus)", /modifié ailleurs/.test(r1b.modale || "") && ecr(db, "programme").length === 2 && publie(db).seances[1].exercices[0].series === "2", String(ecr(db, "programme").length));
    /* le même brouillon modifié sur un autre appareil après cette page */
    const db2 = base();
    const { page: q1 } = await ouvrirCoach(b, db2);
    await q1.fill(champ(0, 0, "series"), "5"); await attendreBrouillon(db2, B => B.clients && B.clients[C1]);
    const { page: q2 } = await ouvrirCoach(b, db2);
    await q2.fill(champ(0, 0, "series"), "7"); await attendreBrouillon(db2, B => B.clients && B.clients[C1] && B.clients[C1].programme.seances[0].exercices[0].series === "7");
    const r = await publier(q1);
    ok("B11 : le même brouillon modifié depuis sur un autre appareil : « Ce brouillon a été modifié sur un autre appareil … » avant de publier",
      /modifié sur un autre appareil/.test(r.modale || "") && ecr(db2, "programme").length === 0, JSON.stringify(r));
    await toucherFenetre(q1, "Publier cette version");
    await attendreQue(() => q1.evaluate(() => /^Publié/.test(document.getElementById("pg-pub-msg").textContent)), 6000);
    ok("B12 : « Publier cette version » : c'est la version de cet appareil qui part (5 séries)", publie(db2).seances[0].exercices[0].series === "5", publie(db2).seances[0].exercices[0].series);
  });

  await bloc("B. changement de fiche", async () => {
    const db = base();
    const { page: co } = await ouvrirCoach(b, db);
    await co.fill(champ(0, 0, "series"), "9");
    await co.evaluate(h => { location.hash = h; }, "#/client/" + C2 + "/programme");
    await attendre(co, 2500);
    const B = brouillons(db) || { clients: {} };
    ok("B13 : saisie dans la fiche d'un client puis changement de fiche dans la seconde : le brouillon reste rangé pour CE client (9 séries), rien chez l'autre, rien de publié",
      !!B.clients[C1] && B.clients[C1].programme.seances[0].exercices[0].series === "9" && !B.clients[C2] && ecr(db, "programme").length === 0, JSON.stringify(Object.keys(B.clients || {})));
  });

  /* =================== C. le « ✓ notée » ne glisse jamais =================== */
  await bloc("C. séances notées", async () => {
    /* C1 : une séance notée AVANT (format actuel : rangée par sa place, sans identifiant) ; le coach retire la séance A */
    const db = base({ donnees: [[C1, "journal", { seances: [seanceJ(0, "Séance A — Haut du corps")] }]] });
    const { page: cl } = await ouvrirClient(b, db);
    const avant = await vueClient(cl);
    const { page: co } = await ouvrirCoach(b, db);
    await co.click('[data-suppr-s="0"]'); await attendre(co, 900);
    await publier(co);
    await cl.reload(); await pret(cl, "#prog-nb");
    const apres = await vueClient(cl), nb = await texte(cl, "#prog-nb");
    ok("C1 : séance A notée (ancien format, par sa place), puis retirée et publiée : le « ✓ notée » ne glisse PAS sur la séance B (aucune séance notée, compteur 0)",
      avant[0].notee && avant[0].nom === "Séance A — Haut du corps" && apres[0].nom === "Séance B — Bas du corps" && apres.every(x => !x.notee) && /^0/.test(nb || ""), JSON.stringify([avant.map(x => x.notee), apres.map(x => x.nom + ":" + x.notee), nb]));
    /* C2 : la séance B notée (ancien format) ; le coach monte la séance C au-dessus de B et publie */
    const db2 = base({ donnees: [[C1, "journal", { seances: [seanceJ(1, "Séance B — Bas du corps")] }]] });
    const { page: co2 } = await ouvrirCoach(b, db2);
    await co2.click('[data-monter-s="2"]'); await attendre(co2, 900);
    await publier(co2);
    const { page: cl2 } = await ouvrirClient(b, db2);
    const v2 = await vueClient(cl2);
    ok("C2 : séance B notée (ancien format), puis la séance C montée au-dessus et publiée : B reste notée, C non",
      JSON.stringify(v2.map(x => x.nom)) === JSON.stringify(["Séance A — Haut du corps", "Séance C — Corps entier", "Séance B — Bas du corps", "Séance D — Cardio / mobilité"]) && v2[2].notee && !v2[1].notee && !v2[0].notee,
      JSON.stringify(v2.map(x => x.nom + ":" + x.notee)));
    /* C3 : le client note une séance avec la nouvelle version : identifiant fixe ET place (lue par les anciennes versions) */
    await cl2.click('[data-jr="0"] [data-jr-ouvrir]');
    await cl2.fill('[data-jr="0"] [data-jr-ex="0"] [data-r="0"]', "8");
    await cl2.click('[data-jr-fin="0"]'); await attendre(cl2, 1500);
    const J = (db2.donnees.find(x => x.user_id === C1 && x.outil === "journal") || {}).contenu || { seances: [] }, der = J.seances[J.seances.length - 1] || {};
    const P2 = publie(db2);
    ok("C3 : une séance notée maintenant porte l'identifiant fixe de la séance (sid) ET sa place (si, pour une ancienne version de l'app)",
      der.sid === P2.seances[0].sid && der.si === 0 && der.date === AUJ0, JSON.stringify(der).slice(0, 200));
    /* C4 : le coach descend la séance A tout en bas et publie : A reste notée, à sa nouvelle place */
    await co2.reload(); await pret(co2, "#pg-publier");
    for (let i = 0; i < 3; i++){ await co2.click(`[data-descendre-s="${i}"]`); await attendre(co2, 300); }
    await attendre(co2, 800); await publier(co2);
    await cl2.reload(); await pret(cl2, "#prog-nb");
    const v4 = await vueClient(cl2);
    ok("C4 : la séance A (notée avec son identifiant) descendue en dernier et publiée : elle reste notée à sa nouvelle place ; B toujours notée ; rien d'autre",
      v4[3].nom === "Séance A — Haut du corps" && v4[3].notee && v4.find(x => x.nom === "Séance B — Bas du corps").notee && v4.filter(x => x.notee).length === 2, JSON.stringify(v4.map(x => x.nom + ":" + x.notee)));
    /* C5 : l'accueil du client (« Noter ma séance » : la prochaine à faire) suit la même règle */
    await cl2.goto(URL0 + "#/accueil"); await pret(cl2, ".masthead");
    const acc = await cl2.evaluate(() => document.body.innerText);
    ok("C5 : l'accueil propose la prochaine séance non notée (Séance C), jamais une séance déjà notée", /Séance C — Corps entier/.test(acc) && !/Noter ma séance\s*\n?\s*Séance A/.test(acc), acc.slice(0, 300));
  });

  /* =================== D. outils rapides de l'éditeur =================== */
  await bloc("D. outils rapides", async () => {
    const db = base({ donnees: [[C1, "journal", { seances: [Object.assign(seanceJ(0, "Séance A — Haut du corps"), { date: "2026-11-02" })] }]] });
    const { page: co } = await ouvrirCoach(b, db);
    const lire = async () => [await co.inputValue(champ(0, 0, "series")), await co.inputValue(champ(0, 0, "reps")), await co.inputValue(champ(0, 0, "repos"))];
    await co.click('[data-pm="0:0:series:1"]'); await co.click('[data-pm="0:0:reps:1"]'); await co.click('[data-pm="0:0:repos:1"]');
    const plus = await lire();
    await co.click('[data-pm="0:0:series:-1"]'); await co.click('[data-pm="0:0:repos:-1"]'); await co.click('[data-pm="0:0:repos:-1"]');
    const moins = await lire();
    await co.fill(champ(0, 0, "series"), "3");
    await attendreBrouillon(db, B => B.clients && B.clients[C1] && B.clients[C1].programme.seances[0].exercices[0].series === "3");
    const B = brouillons(db).clients[C1].programme;
    ok("D1 : + / − : séries 4 → 5 → 4, répétitions « 8-10 » → « 9-11 », repos « 90 s » → « 105 s » → « 75 s » ; le clavier marche toujours (3) ; tout va dans le brouillon",
      JSON.stringify(plus) === JSON.stringify(["5", "9-11", "105 s"]) && JSON.stringify(moins) === JSON.stringify(["4", "9-11", "75 s"]) && B.seances[0].exercices[0].series === "3" && ecr(db, "programme").length === 0,
      JSON.stringify([plus, moins, B.seances[0].exercices[0]]));
    const sid0 = B.seances[0].sid;
    await co.click('[data-dupliquer-s="0"]'); await attendre(co, 300);
    await co.click('[data-descendre-e="0:0"]'); await attendre(co, 300);
    await co.click('[data-dupliquer-e="1:0"]');
    await attendreBrouillon(db, B => B.clients && B.clients[C1] && B.clients[C1].programme.seances.length === 5 && B.clients[C1].programme.seances[1].exercices.length === 5);
    const B2 = brouillons(db).clients[C1].programme;
    ok("D2 : « Dupliquer » une séance (nouvel identifiant, « (copie) ») ; ↓ sur un exercice ; « Dupliquer » un exercice",
      B2.seances.length === 5 && B2.seances[1].nom === "Séance A — Haut du corps (copie)" && B2.seances[1].sid !== sid0 && B2.seances[0].sid === sid0
      && B2.seances[0].exercices[0].nom === "Tirage vertical" && B2.seances[0].exercices[1].nom === "Développé couché"
      && B2.seances[1].exercices.length === 5 && B2.seances[1].exercices[0].nom === B2.seances[1].exercices[1].nom,
      JSON.stringify(B2.seances.map(s => s.nom + ":" + (s.exercices || []).map(e => e.nom).join("/"))));
    const der = await co.evaluate(() => Array.from(document.querySelectorAll("[data-derniere]")).map(x => x.textContent.trim()));
    ok("D3 : sous l'exercice, ce que le client a fait la dernière fois : « Dernière fois : 4 × 8 à 52,5 kg (02/11) »",
      der.includes("Dernière fois : 4 × 8 à 52,5 kg (02/11)"), JSON.stringify(der));
    const tailles = await co.evaluate(() => Array.from(document.querySelectorAll(".outil-pg, .outils-ex .del")).slice(0, 40).map(x => { const r = x.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }));
    ok("D4 : les boutons ↑ ↓ ⧉ × de l'éditeur font au moins 44 px de haut (+ / − : 44 px de haut)", tailles.length > 10 && tailles.every(([w, h]) => h >= 44 && w >= 30), JSON.stringify(tailles.slice(0, 8)));
    await co.setViewportSize(MOBILE); await attendre(co, 300);
    const deborde = await co.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    ok("D5 : téléphone (390 px) : l'éditeur ne déborde pas sur le côté", !deborde, String(deborde));
  });

  /* =================== E. « Nouveau bloc à partir de celui-ci » =================== */
  await bloc("E. nouveau bloc", async () => {
    const db = base();
    const P0 = PROG();
    const { page: co } = await ouvrirCoach(b, db);
    await co.click("#pg-nouveau-bloc");
    await attendreBrouillon(db, B => B.clients && B.clients[C1] && B.clients[C1].nouveau_bloc); await attendre(co, 200);
    const marques = await co.evaluate(() => Array.from(document.querySelectorAll("[data-identique]")).filter(x => !x.hidden).length);
    const nbExos = P0.seances.reduce((n, s) => n + (s.exercices || []).filter(e => e.nom).length, 0);
    const e = brouillons(db) && brouillons(db).clients[C1];
    ok("E1 : « Nouveau bloc » : brouillon « Bloc 2 — 4 semaines », cycle 2, « Nouveau bloc en préparation » ; chaque exercice inchangé porte « ≈ identique au bloc d'avant » ; rien chez le client",
      !!e && e.programme.nom === "Bloc 2 — 4 semaines" && e.programme.cycle === 2 && !!e.nouveau_bloc && /Nouveau bloc en préparation/.test(await texte(co, "#pg-etat") || "") && marques === nbExos && ecr(db, "programme").length === 0,
      JSON.stringify([e && e.programme.nom, e && e.programme.cycle, marques, nbExos]));
    await co.click('[data-pm="0:0:reps:1"]'); await attendre(co, 900);
    const m2 = await co.evaluate(() => { const x = document.querySelector('[data-identique="0:0"]'); return x ? x.hidden : null; });
    ok("E2 : l'exercice modifié perd sa marque « ≈ identique » tout de suite", m2 === true, String(m2));
    const r = await publier(co);
    const P = publie(db), H = db.donnees.find(x => x.user_id === C1 && x.outil === "hist_programme").contenu;
    ok("E3 : publication du nouveau bloc : cycle 2, semaine 1 aujourd'hui, annonce « Nouveau bloc » pour le client ; « Bloc 1 » dans l'historique",
      /^Publié/.test(r.msg || "") && P.cycle === 2 && P.debut === AUJ0 && P.bloc_annonce && P.bloc_annonce.cycle === 2 && P.bloc_annonce.le === AUJ0 && H.liste[0].nom === "Bloc 1 — 4 semaines",
      JSON.stringify([r.msg, P.cycle, P.debut, P.bloc_annonce, H.liste[0].nom]));
    const { page: cl } = await ouvrirClient(b, db, "#/accueil", ".masthead");
    const a = await texte(cl, "#bloc-annonce");
    ok("E4 : le client, à sa prochaine ouverture : « Nouveau bloc · Cycle 02 » sur l'accueil", /Nouveau bloc/.test(a || "") && /Cycle 02/.test(a || ""), a);
    await cl.click("[data-bloc-vu]"); await attendre(cl, 300);
    await cl.reload(); await pret(cl, ".masthead");
    const encore = await cl.evaluate(() => !!document.getElementById("bloc-annonce"));
    await cl.goto(URL0 + "#/programme"); await pret(cl, "#prog-nb");
    const surProg = await cl.evaluate(() => !!document.getElementById("bloc-annonce"));
    const ecritClient = db.ecritures.filter(x => x.table === "donnees" && x.user_id === C1 && x.outil === "programme" && x.t > 0).length;
    ok("E5 : « C'est noté » : l'annonce ne revient plus (accueil rechargé, programme), sans rien écrire dans la base", !encore && !surProg && ecritClient === 1, JSON.stringify([encore, surProg, ecritClient]));
  });

  /* =================== G. relecture du 10/11 : deux appareils, ancienne version de l'app =================== */
  await bloc("G. relecture", async () => {
    /* G1 : deux pages ouvertes sur deux clients : le brouillon de l'un n'efface jamais celui de l'autre */
    const db = base({ donnees: [[C2, "programme", PROG()]] });
    const { page: p1 } = await ouvrirCoach(b, db);
    const { page: p2, c: c2 } = await contexte(b, COACH, db); await p2.goto(FICHE2("programme")); await pret(p2, "#pg-publier");
    await p2.fill(champ(0, 0, "series"), "7"); await attendre(p2, 1800);
    await p1.fill(champ(0, 0, "series"), "5"); await attendre(p1, 1800);
    const B = brouillons(db) || { clients: {} };
    ok("G1 : deux appareils, deux clients : le brouillon fait sur l'un (client 2) reste quand l'autre page (ouverte avant) écrit celui du client 1",
      !!B.clients[C1] && !!B.clients[C2] && B.clients[C1].programme.seances[0].exercices[0].series === "5" && B.clients[C2].programme.seances[0].exercices[0].series === "7", JSON.stringify(Object.keys(B.clients)));
    /* G2 : le client 2 est publié sur l'autre page ; la page du client 1 (qui avait lu l'ancien brouillon du client 2) publie : pas de brouillon fantôme */
    await publier(p2); await attendre(p2, 1500);
    await p1.fill(champ(0, 0, "reps"), "6-8"); await attendre(p1, 900);
    await publier(p1); await attendre(p1, 1800);
    const B2 = brouillons(db) || { clients: {} };
    ok("G2 : après les deux publications, plus aucun brouillon (aucun brouillon fantôme du client 2 remis par la page du client 1)",
      !B2.clients[C1] && !B2.clients[C2] && publie(db, C2).seances[0].exercices[0].series === "7" && publie(db).seances[0].exercices[0].reps === "6-8", JSON.stringify(Object.keys(B2.clients)));
    /* G3 / G4 : un téléphone resté sur l'ancienne version note une séance APRÈS la publication qui a posé les identifiants
       (sans sid, par sa place du moment) : le « ✓ notée » reste sur la séance qu'il a notée */
    const hier = new Date(T0 - J).toISOString().slice(0, 10);
    const P0 = PROG(), sA = "sA0001", sB = "sB0001";
    const prog = (le) => Object.assign(clone(P0), { seances: [Object.assign(clone(P0.seances[1]), { sid: sB }), Object.assign(clone(P0.seances[0]), { sid: sA })].concat(clone(P0.seances.slice(2)).map((s, i) => Object.assign(s, { sid: "sX" + i }))),
      places: { 0: sA, 1: sB, 2: "sX0", 3: "sX1" }, places_le: le });
    for (const [nom, le] of [["G3 : identifiants posés hier", hier], ["G4 : identifiants posés aujourd'hui (départage par le nom)", AUJ0]]){
      const dbx = base({ donnees: [[C1, "programme", prog(le)], [C1, "journal", { seances: [seanceJ(0, "Séance B — Bas du corps")] }]] });
      const { page: cl } = await ouvrirClient(b, dbx);
      const v = await vueClient(cl);
      ok(nom + " ; puis séance B notée par une ancienne version de l'app à sa nouvelle place (1re) : B est notée, A ne l'est pas",
        v[0].nom === "Séance B — Bas du corps" && v[0].notee && !v[1].notee, JSON.stringify(v.map(x => x.nom + ":" + x.notee)));
    }
    /* G5 : la séance en cours (pas encore terminée) est rangée par l'identifiant de sa séance */
    const dby = base({ donnees: [[C1, "programme", prog(hier)]] });
    const { page: cy } = await ouvrirClient(b, dby);
    await cy.click('[data-jr="0"] [data-jr-ouvrir]');
    await cy.fill('[data-jr="0"] [data-jr-ex="0"] [data-r="0"]', "9"); await attendre(cy, 300);
    const cles = await cy.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith("mhx_brouillon|")));
    ok("G5 : une séance commencée est gardée sur l'appareil sous l'identifiant de sa séance (pas sa place)", cles.length === 1 && cles[0].endsWith("|" + sB), JSON.stringify(cles));
  });

  /* =================== F. en anglais =================== */
  await bloc("F. anglais", async () => {
    const db = base(); avecPrefsEn(db, COACH_ID);
    const { page: co } = await contexte(b, COACH, db, { langue: "en" });
    await co.goto(FICHE("programme")); await pret(co, "#pg-publier");
    await co.fill(champ(0, 0, "series"), "5"); await attendre(co, 900);
    const t = { pub: await texte(co, "#pg-publier"), st: await statut(co), nb: await texte(co, "#pg-nouveau-bloc") };
    ok("F1 : coach en anglais : « Publish changes », « ● Unpublished draft », « New block from this one »",
      t.pub === "Publish changes" && /Unpublished draft/.test(t.st || "") && t.nb === "New block from this one", JSON.stringify(t));
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
