/* verif101 — v101 (chantier 6 de la nuit du 10/11/2026, audit §9 : finitions), dans un vrai navigateur (Supabase simulé,
   gabarit de verif95 : coach et clients des fixtures, aucune donnée réelle).
   A. « Supprimé : … · Annuler » 10 s : exercice, séance (brouillon du programme), repas, ligne (brouillon de la diète), complément ;
   B. un échec dit quoi faire (bibliothèque) ;
   C. écran de chargement (squelette) ;
   D. la croix du volet : visible, 44 px, sans chevaucher le titre ;
   E. le client ne télécharge plus le code de l'espace du coach ; le coach le reçoit (appareil neuf, puis d'emblée) ; hors ligne
      (page ouverte), client et coach naviguent comme avant ;
   Z. aucune erreur de console ni erreur JS, aucun dialogue natif, aucun appel vers l'extérieur.
   Usage : node verif101.js ../index.html
           VERIF101_PORT=10111 node verif101.js ../index.html     (autre port, si 10110 est pris)
           VERIF101_BLOCS="A.,E." node verif101.js …               (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF101_PORT || 10110;
const BLOCS = (process.env.VERIF101_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
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
const FICHIERS_COACH = ["js/outilBibliotheque.js", "js/outilCatalogue.js", "js/outilTableau.js", "js/outilAtelier.js"];
const toast = page => page.evaluate(() => { const t = document.querySelector(".toast.annulable"); return t ? t.textContent.replace(/\s+/g, " ").trim() : null; });
const annuler = page => page.click(".toast.annulable .ja-annuler");
const brouillonsP = db => (db.donnees.find(x => x.user_id === COACH_ID && x.outil === "brouillons_programme") || {}).contenu || null;
const brouillonsR = db => (db.donnees.find(x => x.user_id === COACH_ID && x.outil === "brouillons_repas") || {}).contenu || null;
const attendreQueDb = (f, ms) => attendreQue(async () => { try { return !!f(); } catch(e){ return false; } }, ms || 5000);

/* v104 (point 7) : dans la fiche d'un client, chaque exercice est replié en une ligne : le coach l'ouvre avant d'y toucher */
const ouvrirEx = async (page, si, ei) => { const d = `details[data-pli="${si}:${ei}"]`; if (await page.$(d) && !(await page.$eval(d, x => x.open))) await page.click(d + " > summary"); };
(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF101_PORT=10111 node verif101.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. « Annuler » 10 s après une suppression =================== */
  await bloc("A. annuler", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db);
    await page.goto(FICHE("programme")); await pret(page, "#pg-publier");
    await ouvrirEx(page, 0, 0); await page.click('[data-suppr-e="0:0"]'); await attendre(page, 300);
    const t1 = await toast(page);   // (A1 à A3 : le brouillon du programme)
    await attendreQueDb(() => brouillonsP(db) && brouillonsP(db).clients[C1] && brouillonsP(db).clients[C1].programme.seances[0].exercices[0].nom === "Tirage vertical");
    await annuler(page);
    await attendreQueDb(() => brouillonsP(db).clients[C1].programme.seances[0].exercices[0].nom === "Développé couché");
    const ex = await page.inputValue('[data-f="nom"][data-s="0"][data-e="0"]');
    ok("A1 : un exercice supprimé : « Supprimé : Développé couché · Annuler » ; « Annuler » le remet à sa place (brouillon compris), rien chez le client",
      /^Supprimé : Développé couché Annuler$/.test(t1 || "") && ex === "Développé couché" && ecr(db, "programme").length === 0, JSON.stringify([t1, ex]));
    await page.click('[data-suppr-s="1"]'); await attendre(page, 300);
    const t2 = await toast(page);
    await annuler(page); await attendre(page, 900);
    const noms = await page.evaluate(() => Array.from(document.querySelectorAll('[data-f="nom"][data-s]:not([data-e])')).map(x => x.value));
    ok("A2 : une séance supprimée puis « Annuler » : elle revient à sa place (Séance B en 2e)", /Supprimé : Séance B/.test(t2 || "") && noms[1] === "Séance B — Bas du corps", JSON.stringify([t2, noms]));
    /* relecture : séance supprimée, puis un autre programme chargé, puis « Annuler » : rien ne s'ajoute au programme chargé */
    await page.click('[data-suppr-s="1"]'); await attendre(page, 300);
    await page.evaluate(() => { const s = document.getElementById("pg-prets"); s.value = s.querySelector("option[value]:not([value=''])").value; s.dispatchEvent(new Event("change")); });
    await attendreQue(() => fenetre(page), 3000); await toucherFenetre(page, "Charger"); await attendre(page, 900);
    const avantAnnuler = await page.evaluate(() => document.querySelectorAll('[data-f="nom"][data-s]:not([data-e])').length);
    if (await toast(page)) await annuler(page); await attendre(page, 900);
    const apresAnnuler = await page.evaluate(() => Array.from(document.querySelectorAll('[data-f="nom"][data-s]:not([data-e])')).map(x => x.value));
    ok("A2b : séance supprimée, puis un programme prêt à l'emploi chargé, puis « Annuler » : la séance n'est pas ajoutée au programme chargé", apresAnnuler.length === avantAnnuler && !apresAnnuler.includes("Séance B — Bas du corps"), JSON.stringify([avantAnnuler, apresAnnuler]));
    await page.click("#pg-annuler-brouillon").catch(() => {}); await attendre(page, 300); if (await fenetre(page)) await toucherFenetre(page, "Annuler le brouillon"); await attendre(page, 900);
    /* le message reste 10 s, puis disparaît */
    await ouvrirEx(page, 0, 0); await page.click('[data-suppr-e="0:0"]'); await attendre(page, 9000);
    const encore = !!(await toast(page)); await attendre(page, 1800);
    const parti = !(await toast(page));
    ok("A3 : « Annuler » reste proposé 10 s (encore là à 9 s, parti à 11 s)", encore && parti, JSON.stringify([encore, parti]));
    /* diète : un repas, puis une ligne d'ingrédient */
    await page.goto(FICHE("nutrition")); await pret(page, "#nu-publier");
    /* v104 (point 6) : les repas du coach sont repliés : il les ouvre (clic sur leur résumé) avant de s'en servir */
    await page.evaluate(() => document.querySelectorAll("#nu-vue details.nu-pli:not([open]) > summary").forEach(s => s.click())); await attendre(page, 150);
    const n0 =await page.evaluate(() => document.querySelectorAll(".repas-c").length);
    await page.click('[data-retirer="0:1"]'); await attendre(page, 300);
    const t3 = await toast(page);
    await annuler(page); await attendre(page, 900);
    const n1 = await page.evaluate(() => document.querySelectorAll(".repas-c h2")[1].textContent);
    ok("A4 : un repas retiré puis « Annuler » : il revient (2e repas du jour)", /^Supprimé : /.test(t3 || "") && (await page.evaluate(() => document.querySelectorAll(".repas-c").length)) === n0 && /Saumon|Poulet/.test(n1), JSON.stringify([t3, n1]));
    const g0 = await page.evaluate(() => document.querySelectorAll('[data-suppr-i^="0:0:"]').length);
    await page.click('[data-suppr-i="0:0:0"]'); await attendre(page, 500);
    await annuler(page); await attendre(page, 900);
    const g1 = await page.evaluate(() => document.querySelectorAll('[data-suppr-i^="0:0:"]').length);
    ok("A5 : une ligne d'ingrédient retirée puis « Annuler » : elle revient", g1 === g0 && g0 > 0, JSON.stringify([g0, g1]));
    await page.goto(FICHE("complements")); await pret(page, "[data-suppr-c]");
    const c0 = await page.evaluate(() => document.querySelectorAll("[data-suppr-c]").length);
    await page.click('[data-suppr-c="0"]'); await attendre(page, 400);
    const t5 = await toast(page);
    await annuler(page); await attendre(page, 1200);
    const c1 = await page.evaluate(() => document.querySelectorAll("[data-suppr-c]").length);
    const der = ecr(db, "complements", C1).pop();
    ok("A6 : un complément retiré puis « Annuler » : il revient, et la dernière écriture le contient", /^Supprimé : /.test(t5 || "") && c1 === c0 && der && der.contenu.liste.length === c0, JSON.stringify([t5, c0, c1, der && der.contenu.liste.length]));
    const h = await page.evaluate(() => { document.querySelector('[data-suppr-c="0"]').click(); const b = document.querySelector(".toast.annulable .ja-annuler"); return b ? Math.round(b.getBoundingClientRect().height) : 0; });
    ok("A7 : le bouton « Annuler » fait 44 px", h >= 44, String(h));
    await annuler(page);
  });

  /* =================== B. des messages qui disent quoi faire =================== */
  await bloc("B. messages", async () => {
    const db = base(); db.panneBiblio = true;
    const { page } = await contexte(b, COACH, db);
    await page.goto(FICHE("programme")); await pret(page, "#pg-biblio-save");
    await page.click("#pg-biblio-save"); await attendreQue(() => fenetre(page), 3000); await toucherFenetre(page, "Enregistrer"); await attendre(page, 1500);
    const m = await texte(page, "#pg-msg"); await attendre(page, 3500);
    /* v106 (lot 1) : « Ma bibliothèque » s'appelle « Mes modèles » */
    ok("B1 : modèles en panne : « Pas enregistré dans tes modèles : vérifie ta connexion et réessaie. », un message qui reste", m === "Pas enregistré dans tes modèles : vérifie ta connexion et réessaie." && (await texte(page, "#pg-msg")) === m, m);
  });

  /* =================== C. écrans de chargement =================== */
  await bloc("C. squelettes", async () => {
    const db = base(); db.lentLecture = "programme";
    const { page, c } = await contexte(b, THOMAS, db);
    await c.route(/\/rest\/v1\/donnees\?.*outil=eq\.programme/, async r => { await new Promise(k => setTimeout(k, 2500)); return r.fallback(); });
    await page.goto(URL0 + "#/programme"); await page.waitForSelector(".squelette", { timeout: 8000 });
    const s = await page.evaluate(() => { const q = document.querySelector(".squelette"); return { barres: q.querySelectorAll(".sq-l").length, lu: (q.querySelector(".sr-only") || {}).textContent, busy: q.getAttribute("aria-busy"), h: Math.round(q.getBoundingClientRect().height) }; });
    await pret(page, "#prog-nb");
    const fini = await page.evaluate(() => !document.querySelector("#prog-vue .squelette"));
    ok("C1 : pendant le chargement : des barres grises (squelette, « Chargement… » pour les lecteurs d'écran), puis la page remplie", s.barres >= 3 && s.lu === "Chargement…" && s.busy === "true" && s.h >= 100 && fini, JSON.stringify([s, fini]));
  });

  /* =================== D. la croix des volets =================== */
  await bloc("D. croix du volet", async () => {
    const db = base();
    const { page } = await contexte(b, THOMAS, db, { viewport: MOBILE });
    await page.goto(URL0 + "#/accueil"); await pret(page, ".masthead");
    await page.click("#barre-bas [data-plus]"); await attendre(page, 500);
    const x = await page.evaluate(() => { const b = document.querySelector(".volet .fermer-volet"), t = document.querySelector(".volet h2"), r = b.getBoundingClientRect(), rt = t.getBoundingClientRect(), s = b.querySelector("svg"), cs = getComputedStyle(s);
      const titreR = (() => { const rg = document.createRange(); rg.selectNodeContents(t); const q = rg.getBoundingClientRect(); return q; })();
      return { w: Math.round(r.width), h: Math.round(r.height), trait: cs.stroke, larg: Math.round(s.getBoundingClientRect().width), chevauche: !(titreR.right <= r.left || titreR.left >= r.right || titreR.bottom <= r.top || titreR.top >= r.bottom) }; });
    ok("D1 : la croix du volet « Tout mon espace » : visible (trait dessiné), 44 × 44 px, sans chevaucher le titre", x.w >= 44 && x.h >= 44 && x.trait && x.trait !== "none" && x.larg >= 16 && !x.chevauche, JSON.stringify(x));
    await page.click(".volet .fermer-volet"); await attendre(page, 400);
    ok("D2 : elle ferme le volet", !(await page.$(".volet")), "");
  });

  /* =================== E. le code de l'espace du coach =================== */
  await bloc("E. code du coach", async () => {
    const charges = page => page.evaluate(() => Array.from(document.scripts).map(s => (s.getAttribute("src") || "").split("?")[0]).filter(Boolean));
    const db = base();
    const { page: cl, c: cc } = await contexte(b, THOMAS, db);
    const demandes = []; cl.on("request", r => { const u = new URL(r.url()); if (u.hostname === "localhost") demandes.push(u.pathname.replace(/^\//, "")); });
    await cl.goto(URL0 + "#/accueil"); await pret(cl, ".masthead");
    for (const h of ["#/programme", "#/nutrition", "#/mensurations", "#/suivi", "#/formation", "#/profil"]){ await cl.goto(URL0 + h); await pret(cl); }
    ok("E1 : un client ne télécharge aucun des 4 fichiers de l'espace du coach (Tableau, Mes séances, Bibliothèque, Catalogue) ; ses pages s'ouvrent", FICHIERS_COACH.every(f => !demandes.includes(f)) && demandes.includes("js/outilProgramme.js"), JSON.stringify(demandes.filter(f => f.startsWith("js/")).length));
    /* hors ligne, après l'ouverture : le client passe d'une page à l'autre comme avant */
    await cc.setOffline(true);
    for (const h of ["#/accueil", "#/programme", "#/nutrition"]){ await cl.evaluate(x => { location.hash = x; }, h); await attendre(cl, 1200); }
    const hl = await cl.evaluate(() => courant);
    await cc.setOffline(false);
    ok("E2 : hors ligne (page déjà ouverte), le client navigue sans erreur (la page dit « Pas de connexion » au besoin)", hl === "nutrition", hl);
    /* le coach sur un appareil neuf : les fichiers arrivent après sa connexion, avant le premier affichage */
    const { page: co, c: c2 } = await contexte(b, COACH, db);
    await co.goto(URL0 + "#/tableau"); await pret(co, "#tb-vue");
    const l1 = await charges(co), marque = await co.evaluate(() => localStorage.getItem("mhx_coach_fichiers"));
    const pages = [];
    /* v106 (lot 1) : #/bibliotheque et #/atelier mènent aux onglets de la Bibliothèque (« Mes modèles », « Mes séances ») : la page
       est vérifiée par son contenu (#bib-entrainements, #at-vue) */
    const CONTENU = { "#/mes-programmes": "#at-vue", "#/catalogue": "#cat-compteurs", "#/bibliotheque": "#bib-entrainements", "#/atelier": "#at-vue", "#/tableau": "#tb-vue" };
    for (const h of ["#/mes-programmes", "#/catalogue", "#/bibliotheque", "#/atelier", "#/tableau"]){ await co.goto(URL0 + h); await pret(co); await attendre(co, 600); pages.push(await co.evaluate(s => courant + (document.querySelector("#vue " + s) ? "" : ":vide"), CONTENU[h])); }
    ok("E3 : le coach (appareil neuf) : les 4 fichiers sont chargés à sa connexion, marque posée ; Tableau, Mes programmes, Catalogue, Bibliothèque, Mes séances s'ouvrent",
      FICHIERS_COACH.every(f => l1.includes(f)) && marque === "1" && JSON.stringify(pages) === JSON.stringify(["mes-programmes", "catalogue", "mes-programmes", "mes-programmes", "tableau"]), JSON.stringify([marque, pages]));
    await co.reload(); await pret(co, "#tb-vue");
    const l2 = await co.evaluate(() => Array.from(document.querySelectorAll("script[defer]")).map(s => (s.getAttribute("src") || "").split("?")[0]));
    ok("E4 : ouverture suivante du coach : les 4 fichiers sont chargés d'emblée, comme avant (la marque)", FICHIERS_COACH.every(f => l2.includes(f)), JSON.stringify(l2.length));
    /* un client qui ouvre ensuite l'app sur un appareil où la marque est posée : elle est retirée à son ouverture */
    await cl.evaluate(() => { localStorage.setItem("mhx_coach_fichiers", "1"); });
    await cl.reload(); await pret(cl, ".masthead");
    const marqueClient = await cl.evaluate(() => { try { return localStorage.getItem("mhx_coach_fichiers"); } catch(e){ return "?"; } });
    await cl.reload(); await pret(cl, ".masthead");
    const apres = await charges(cl);
    ok("E4b : la marque « fichiers du coach » posée sur l'appareil d'un client est retirée à son ouverture ; à l'ouverture suivante, il ne charge plus les 4 fichiers", marqueClient === null && FICHIERS_COACH.every(f => !apres.includes(f)), JSON.stringify([marqueClient, apres.filter(f => FICHIERS_COACH.includes(f))]));
    await c2.setOffline(true);
    for (const h of ["#/mes-programmes", "#/clients", "#/tableau"]){ await co.evaluate(x => { location.hash = x; }, h); await attendre(co, 1200); }
    const hc = await co.evaluate(() => courant);
    await c2.setOffline(false);
    ok("E5 : hors ligne (page déjà ouverte), le coach navigue entre ses pages sans erreur", hc === "tableau", hc);
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
