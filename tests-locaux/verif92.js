/* verif92 — v91 (étape 1 « corrections sûres », 09/11/2026) : chaque correction vérifiée dans un vrai navigateur (Supabase
   simulé, gabarit de verif91 : coach et clients des fixtures, aucune donnée réelle).
   A. diète du coach, questionnaire illisible : bandeau « Questionnaire illisible : vérifie ses allergies avant de générer »
      + Réessayer, « Générer la semaine », « Refaire … » et « Autre proposition » bloqués (rien n'est composé ni écrit), la diète
      existante reste affichée et modifiable à la main ; après « Réessayer » (questionnaire relu) : débloqué ;
   B. programme (v96 : « Publier les changements », avant : « Envoyer au client ») : « Publié » seulement après la réponse de
      la base ; écriture en panne ou refusée : « Pas publié : … Ton brouillon est gardé. », un message qui reste ;
      « Publication… » et bouton désactivé pendant l'envoi ;
   C. atelier, « Enregistrer dans ma bibliothèque » : une écriture bibliotheque { type: "entrainement", seances } sous le nom
      du programme ; séance vide : rien d'écrit ; panne : message d'échec ;
   D. atelier, « Enregistrer dans ma base » : un programme du même identifiant ajouté APRÈS l'ouverture de la page demande
      « Le remplacer ? » (Annuler : rien d'écrit ; « Oui, remplacer » : une écriture) ; base illisible : rien d'écrit ;
      v92 : un programme du catalogue repris puis enregistré sous le même nom (identifiant différent de celui tiré du nom) :
      « Le remplacer ? », puis c'est lui qui est remplacé, sans copie ;
   E. « Pas de connexion » + Réessayer : fiche d'un client, calculateur du coach, atelier ; une case qui n'est pas
      enregistrée ne reste pas cochée (objectifs du mois, Formation, vus par le coach) ; zones de toucher à 44 px (échelles
      1-5 du bilan sur téléphone, croix de la bannière d'installation, flèche de retour du volet) ;
   Z. aucune erreur de console ni erreur JS, aucun dialogue natif, aucun appel vers l'extérieur.
   Usage : node verif92.js ../index.html
           VERIF92_PORT=10095 node verif92.js ../index.html     (autre port, si 10092 est pris)
           VERIF92_BLOCS="A.,D." node verif92.js …               (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF92_PORT || 10092;
const BLOCS = (process.env.VERIF92_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
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
  await c.addInitScript(({ s }) => {
    if (!/^https?:$/.test(location.protocol) || location.hostname !== "localhost") return;
    if (!localStorage.getItem("__init")) {
      localStorage.setItem("__init", "1");
      if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
      localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
    }
  }, { s: who ? who.session : null });
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

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF92_PORT=10095 node verif92.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. diète du coach : questionnaire illisible =================== */
  await bloc("A. diète et questionnaire illisible", async () => {
    const db = base(); db.panneLecture = "intake";
    const { page } = await contexte(b, COACH, db);
    await page.goto(FICHE("nutrition")); await pret(page, "#nu-gen"); await attendre(page, 800);
    const r = await page.evaluate(() => {
      const f = document.getElementById("nu-intake-illisible"), g = document.getElementById("nu-gen"), gj = document.getElementById("nu-gen-jour");
      return { bandeau: f ? f.textContent.replace(/\s+/g, " ").trim() : null, reessayer: !!(f && f.querySelector("[data-reessayer]")),
        gen: g ? g.disabled : null, jour: gj ? gj.disabled : null,
        autres: Array.from(document.querySelectorAll("[data-autre]")).map(x => x.disabled),
        grammes: document.querySelectorAll("[data-gr]").length };
    });
    ok("A1 : questionnaire illisible : bandeau « Questionnaire illisible : vérifie ses allergies avant de générer » avec Réessayer ; « Générer la semaine », « Refaire … » et « Autre proposition » désactivés ; la diète existante reste affichée (quantités modifiables)",
      /^Questionnaire illisible : vérifie ses allergies avant de générer\./.test(r.bandeau || "") && r.reessayer && r.gen === true && r.jour === true
        && r.autres.length > 0 && r.autres.every(Boolean) && r.grammes > 0, JSON.stringify(r));
    const n0 = ecr(db, "repas").length;
    /* même si le bouton était réactivé (ou touché autrement) : la garde du gestionnaire refuse, rien n'est composé ni écrit */
    await page.evaluate(() => { ["nu-gen", "nu-gen-jour"].forEach(id => { const x = document.getElementById(id); if (x){ x.click(); x.disabled = false; x.click(); } }); const a = document.querySelector("[data-autre]"); if (a){ a.disabled = false; a.click(); } });
    await attendre(page, 2500);
    const msg = await texte(page, "#nu-msg");
    ok("A2 : « Générer la semaine », « Refaire … » et « Autre proposition » touchés quand même : rien n'est composé ni écrit (repas), le message redit de vérifier ses allergies",
      ecr(db, "repas").length === n0 && /Questionnaire illisible/.test(msg || ""), JSON.stringify([ecr(db, "repas").length - n0, msg]));
    /* modification à la main : toujours permise */
    await page.evaluate(() => { const i = document.querySelector("[data-gr]"); i.value = String((+i.value || 0) + 5); i.dispatchEvent(new Event("change", { bubbles: true })); });
    /* v97 : la diète du coach est un brouillon (brouillons_repas, sur son compte) : la quantité y est enregistrée */
    const ecrit = await attendreQue(() => ecr(db, "brouillons_repas", F.IDS.coach).some(e => e.contenu && e.contenu.clients && e.contenu.clients[C1]), 4000);
    ok("A3 : une quantité changée à la main est enregistrée (la diète reste modifiable)", ecrit && ecr(db, "repas").length === n0, JSON.stringify([ecr(db, "brouillons_repas").length, ecr(db, "repas").length]));
    /* Réessayer, la lecture refonctionne : bandeau retiré, boutons actifs */
    db.panneLecture = null;
    await page.click("#nu-intake-illisible [data-reessayer]");
    await attendreQue(() => page.evaluate(() => !document.getElementById("nu-intake-illisible") && !!document.getElementById("nu-gen")), 6000);
    await attendre(page, 500);
    const r2 = await page.evaluate(() => ({ bandeau: !!document.getElementById("nu-intake-illisible"), gen: (document.getElementById("nu-gen") || {}).disabled, hash: location.hash }));
    ok("A4 : « Réessayer », questionnaire relu : plus de bandeau, « Générer la semaine » actif, même page", !r2.bandeau && r2.gen === false && /\/nutrition$/.test(r2.hash), JSON.stringify(r2));
  });

  /* =================== B. « Envoyer au client » =================== */
  /* v96 : « Envoyer au client » est devenu « Publier les changements » (brouillon sur le compte du coach, rien chez le
     client avant la publication). Ce que B protège ne change pas : jamais « publié » avant la réponse de la base, un message
     qui dit d'agir et qui reste, le bouton désactivé pendant l'envoi. Un changement est d'abord fait dans le brouillon. */
  const changer = async (page) => {
    await page.fill('[data-f="series"][data-s="0"][data-e="0"]', "5");
    await attendreQue(() => page.evaluate(() => /Brouillon non publié/.test((document.getElementById("pg-statut") || {}).textContent || "")), 3000);
    await attendre(page, 900);   // le brouillon part (700 ms)
  };
  const envoyer = async (page) => {
    await changer(page);
    await page.click("#pg-publier");
    await attendreQue(() => page.evaluate(() => { const b = document.getElementById("pg-publier"), m = document.getElementById("pg-pub-msg"); return !!b && !b.disabled && !!m && m.textContent.trim() !== ""; }), 9000);
    return { msg: await texte(page, "#pg-pub-msg"), bouton: await texte(page, "#pg-publier"), statut: await texte(page, "#pg-statut") };
  };
  await bloc("B. programme envoyé : panne", async () => {
    const db = base(); db.panneEcriture = "programme";
    const { page } = await contexte(b, COACH, db);
    await page.goto(FICHE("programme")); await pret(page, "#pg-publier");
    const r = await envoyer(page);
    await attendre(page, 4000);   // le message reste (flashFixe)
    const reste = await texte(page, "#pg-pub-msg");
    ok("B1 : écriture du programme en panne (500) : jamais « Publié » ; « Pas publié : vérifie ta connexion et réessaie. Ton brouillon est gardé. », un message qui reste ; le bouton redevient « Publier les changements », le brouillon reste « non publié »",
      /^Pas publié : vérifie ta connexion et réessaie\. Ton brouillon est gardé\./.test(r.msg || "") && !/^Publié/.test(r.msg || "") && reste === r.msg && r.bouton === "Publier les changements" && /Brouillon non publié/.test(r.statut || "") && db.refus.length > 0, JSON.stringify([r, reste, db.refus]));
  });
  await bloc("B. programme envoyé : refus", async () => {
    const db = base(); db.refusEcriture = "programme";
    const { page } = await contexte(b, COACH, db);
    await page.goto(FICHE("programme")); await pret(page, "#pg-publier");
    const r = await envoyer(page);
    ok("B2 : écriture refusée par la base (403) : jamais « Publié » ; « Pas publié : la base a refusé cette modification. Ton brouillon est gardé. », rien d'écrit chez le client",
      r.msg === "Pas publié : la base a refusé cette modification. Ton brouillon est gardé." && ecr(db, "programme").length === 0, JSON.stringify([r, ecr(db, "programme").length]));
  });
  await bloc("B. programme envoyé : réponse lente", async () => {
    const db = base(); db.lentEcriture = { outil: "programme", ms: 2000 };
    const { page } = await contexte(b, COACH, db);
    await page.goto(FICHE("programme")); await pret(page, "#pg-publier");
    await changer(page);
    await page.click("#pg-publier"); await attendre(page, 500);
    const pendant = await page.evaluate(() => ({ dis: document.getElementById("pg-publier").disabled, txt: document.getElementById("pg-publier").textContent.trim(), msg: document.getElementById("pg-pub-msg").textContent.trim() }));
    ok("B3 : pendant la publication (base lente) : « Publication… », bouton désactivé, pas encore « Publié »",
      pendant.dis === true && pendant.txt === "Publication…" && !/Publié/.test(pendant.msg), JSON.stringify(pendant));
    await attendreQue(() => page.evaluate(() => /^Publié/.test(document.getElementById("pg-pub-msg").textContent)), 6000);
    const e = ecr(db, "programme", C1).pop(), apres = { msg: await texte(page, "#pg-pub-msg"), bouton: await texte(page, "#pg-publier") };
    ok("B4 : la base a répondu : « Publié. Ton client voit la nouvelle version dès sa prochaine ouverture. », le programme écrit porte sa date, le bouton revient",
      apres.msg === "Publié. Ton client voit la nouvelle version dès sa prochaine ouverture." && apres.bouton === "Publier les changements" && !!(e && e.contenu && e.contenu.maj) && !!(e && e.t) && e.contenu.seances[0].exercices[0].series === "5", JSON.stringify([apres, e && e.contenu && e.contenu.maj]));
  });

  /* =================== C. atelier : « Enregistrer dans ma bibliothèque » =================== */
  await bloc("C. atelier et bibliothèque", async () => {
    const db = base({ donnees: [[F.IDS.coach, "atelier", ATELIER("Atelier 92")]] });
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/atelier"); await pret(page, "#pg-biblio-save");
    await page.click("#pg-biblio-save");
    await attendreQue(() => table(db, "bibliotheque").length > 0 && page.evaluate(() => /bibliothèque/.test(document.getElementById("pg-msg").textContent)), 6000);
    const l = table(db, "bibliotheque"), c = l[0] && [].concat(l[0].corps)[0], msg = await texte(page, "#pg-msg");
    ok("C1 : « Enregistrer dans ma bibliothèque » : une écriture bibliotheque (nom du programme, coach, { type: \"entrainement\", seances }), message de succès",
      l.length === 1 && !!c && c.nom === "Atelier 92" && c.coach_id === F.IDS.coach && c.contenu && c.contenu.type === "entrainement"
        && JSON.stringify(c.contenu.seances) === JSON.stringify(ATELIER("x").seances) && /enregistré dans ta bibliothèque/.test(msg || ""), JSON.stringify([l.length, c && c.nom, c && c.contenu && c.contenu.type, msg]));
    /* une séance vide (« + Ajouter une séance ») : même contrôle qu'« Enregistrer dans ma base », rien n'est écrit */
    await page.click("#pg-ajout-s"); await attendre(page, 800);
    await page.click("#pg-biblio-save"); await attendre(page, 1200);
    const msg2 = await texte(page, "#pg-msg");
    ok("C2 : une séance sans exercice : « Une séance n'a aucun exercice. Complète-la ou supprime-la. », rien n'est écrit",
      table(db, "bibliotheque").length === 1 && msg2 === "Une séance n'a aucun exercice. Complète-la ou supprime-la.", JSON.stringify([table(db, "bibliotheque").length, msg2]));
  });
  await bloc("C. atelier et bibliothèque en panne", async () => {
    const db = base({ donnees: [[F.IDS.coach, "atelier", ATELIER("Atelier 92 bis")]] }); db.panneBiblio = true;
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/atelier"); await pret(page, "#pg-biblio-save");
    await page.click("#pg-biblio-save");
    await attendreQue(() => page.evaluate(() => /^Pas enregistré/.test(document.getElementById("pg-msg").textContent)), 6000);
    const r = { msg: await texte(page, "#pg-msg"), dis: await page.evaluate(() => document.getElementById("pg-biblio-save").disabled) };
    ok("C3 : bibliothèque en panne : « Pas enregistré dans ta bibliothèque : vérifie ta connexion et réessaie. », le bouton reste utilisable",
      r.msg === "Pas enregistré dans ta bibliothèque : vérifie ta connexion et réessaie." && r.dis === false, JSON.stringify(r));
  });

  /* =================== D. atelier : un programme du même nom ajouté entre-temps =================== */
  await bloc("D. atelier et nom déjà pris", async () => {
    const db = base({ donnees: [[F.IDS.coach, "atelier", ATELIER("Programme Atelier 92")]] });
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/atelier"); await pret(page, "#at-base"); await attendre(page, 500);
    /* ajouté APRÈS l'ouverture de la page (autre onglet, autre appareil) */
    const autre = { id: "programme-atelier-92", nom: "Programme Atelier 92", niveau: "Avance", seances_semaine: 4, lieu: "Maison", objectif: "Performance", note: "Version de l'autre onglet", seances: [{ nom: "Autre", exercices: [{ nom: "Pompes", series: "3", reps: "10" }] }] };
    db.programmes.push(clone(autre));
    await page.click("#at-base");
    const vue = await attendreQue(async () => /existe déjà/.test((await fenetre(page)) || ""), 5000);
    ok("D1 : un programme du même identifiant ajouté après l'ouverture de la page : « Un programme du même nom existe déjà dans ta base. Le remplacer ? », rien n'est écrit avant la réponse",
      vue && table(db, "programmes_types").length === 0, JSON.stringify([await fenetre(page), table(db, "programmes_types").length]));
    await toucherFenetre(page, "Annuler"); await attendre(page, 1200);
    const garde = db.programmes.find(x => x.id === autre.id);
    ok("D2 : « Annuler » : rien n'est écrit, le programme de l'autre onglet reste tel quel",
      table(db, "programmes_types").length === 0 && JSON.stringify(garde) === JSON.stringify(autre), JSON.stringify([table(db, "programmes_types").length, garde && garde.note]));
    await page.click("#at-base");
    await attendreQue(async () => /existe déjà/.test((await fenetre(page)) || ""), 5000);
    await toucherFenetre(page, "Oui, remplacer");
    await attendreQue(() => table(db, "programmes_types").length > 0, 5000); await attendre(page, 800);
    const w = table(db, "programmes_types"), c = w[0] && w[0].corps[0];
    ok("D3 : « Oui, remplacer » : une seule écriture, sous cet identifiant, avec les séances de l'atelier",
      w.length === 1 && !!c && c.id === autre.id && JSON.stringify(c.seances) === JSON.stringify(ATELIER("x").seances), JSON.stringify([w.length, c && c.id]));
    /* la base ne se relit pas : rien n'est écrit, on le dit */
    db.pannePrets = true;
    await page.click("#at-base");
    await attendreQue(() => page.evaluate(() => /^Pas enregistré/.test(document.getElementById("pg-msg").textContent)), 5000);
    const r = { msg: await texte(page, "#pg-msg"), fen: await fenetre(page), dis: await page.evaluate(() => document.getElementById("at-base").disabled) };
    ok("D4 : la base ne peut pas être relue : « Pas enregistré : ta base n'a pas pu être relue. Vérifie ta connexion et réessaie. », aucune écriture de plus, bouton utilisable",
      r.msg === "Pas enregistré : ta base n'a pas pu être relue. Vérifie ta connexion et réessaie." && !r.fen && r.dis === false && table(db, "programmes_types").length === 1, JSON.stringify([r, table(db, "programmes_types").length]));
  });

  /* v92 : le cas vu par Lucas le 09/11 — un programme du CATALOGUE (identifiant « corps-entier-2j-debutant ») repris dans
     l'atelier puis enregistré sous le même nom : avant, l'atelier cherchait seulement « corps-entier-2-seances » (tiré du nom),
     ne trouvait rien et créait une copie sans question */
  await bloc("D. atelier et programme repris du catalogue", async () => {
    const db = base({ donnees: [[F.IDS.coach, "atelier", ATELIER("Brouillon 92")]] });
    const ORIG = "corps-entier-2j-debutant", orig = clone(db.programmes.find(x => x.id === ORIG) || null), nb0 = db.programmes.length;
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/atelier"); await pret(page, "#at-base"); await attendre(page, 500);
    await page.selectOption("#at-charger", ORIG);
    await attendreQue(async () => /Remplacer ce que tu as commencé/.test((await fenetre(page)) || ""), 5000);
    await toucherFenetre(page, "Oui, remplacer"); await attendre(page, 1200);
    const nom = await page.evaluate(() => (document.getElementById("at-nom") || {}).value);
    await page.click("#at-base");
    const vue = await attendreQue(async () => /existe déjà/.test((await fenetre(page)) || ""), 5000);
    ok("D5 : « Corps entier — 2 séances » repris du catalogue (identifiant corps-entier-2j-debutant) puis enregistré sous le même nom : « Le remplacer ? » est demandé, rien n'est écrit avant la réponse",
      !!orig && nom === orig.nom && vue && table(db, "programmes_types").length === 0, JSON.stringify([!!orig, nom, await fenetre(page), table(db, "programmes_types").map(e => e.corps[0] && e.corps[0].id)]));
    await toucherFenetre(page, "Oui, remplacer");
    await attendreQue(() => table(db, "programmes_types").length > 0, 5000); await attendre(page, 800);
    const w = table(db, "programmes_types"), c = w[0] && w[0].corps[0];
    ok("D6 : « Oui, remplacer » : c'est CE programme qui est remplacé (identifiant corps-entier-2j-debutant gardé), aucune copie « corps-entier-2-seances », le catalogue garde le même nombre de programmes",
      w.length === 1 && !!c && c.id === ORIG && !db.programmes.some(x => x.id === "corps-entier-2-seances") && db.programmes.length === nb0, JSON.stringify([w.map(e => e.corps[0] && e.corps[0].id), db.programmes.length, nb0]));
  });

  /* =================== E. hors connexion, cases, zones de toucher =================== */
  await bloc("E. fiche hors connexion", async () => {
    const db = base(); db.panneLecture = "seances_formation";
    const { page } = await contexte(b, COACH, db);
    await page.goto(FICHE("accueil")); await pret(page); await attendre(page, 1500);
    const r = await horsLigne(page), corps = await texte(page, "#vue");
    ok("E1 : fiche d'un client, lecture groupée ratée : « Pas de connexion : les données de ce client n'ont pas pu être chargées. » + Réessayer (plus « Rien à signaler : tout est en ordre »)",
      !!r && /^Pas de connexion : les données de ce client/.test(r.texte) && r.reessayer && !/Rien à signaler/.test(corps || ""), JSON.stringify([r, (corps || "").slice(0, 200)]));
  });
  await bloc("E. calculateur hors connexion", async () => {
    const db = base(); db.panneLecture = "calc";
    const { page } = await contexte(b, COACH, db);
    await page.goto(FICHE("calculateur")); await pret(page); await attendre(page, 1500);
    const r = await horsLigne(page);
    ok("E2 : calculateur du coach, son calcul illisible : « Pas de connexion » + Réessayer (plus des chiffres de départ présentés comme les siens), rien n'est écrit",
      !!r && /^Pas de connexion/.test(r.texte) && r.reessayer && ecr(db, "calc").length === 0, JSON.stringify([r, ecr(db, "calc").length]));
  });
  await bloc("E. atelier hors connexion", async () => {
    const db = base({ donnees: [[F.IDS.coach, "atelier", ATELIER("Atelier 92")]] }); db.panneLecture = "atelier";
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/atelier"); await pret(page); await attendre(page, 1500);
    const r = await horsLigne(page), base0 = await page.$("#at-base");
    ok("E3 : atelier, brouillon illisible : « Pas de connexion » + Réessayer à la place d'un brouillon vide",
      !!r && /^Pas de connexion/.test(r.texte) && r.reessayer && !base0, JSON.stringify(r));
  });
  await bloc("E. cases non enregistrées", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db);
    await page.goto(FICHE("suivi")); await pret(page, "[data-obj]"); await attendre(page, 800);
    const avantO = await page.evaluate(() => { const c = document.querySelector('[data-obj="1"]'); return c ? { coche: c.checked, dis: c.disabled } : null; });
    await page.evaluate(() => { const c = document.querySelector('[data-obj="1"]'); (c.closest("label") || c).click(); });
    await attendre(page, 1200);
    const apresO = await page.evaluate(() => { const c = document.querySelector('[data-obj="1"]'); return c ? c.checked : null; });
    ok("E4 : coach, objectif du mois touché dans « Son suivi » (lecture seule) : rien n'est enregistré et la case ne reste pas cochée",
      !!avantO && avantO.coche === false && avantO.dis === false && apresO === false && ecr(db, "objectifs_faits").length === 0, JSON.stringify([avantO, apresO, ecr(db, "objectifs_faits").length]));
    await page.goto(FICHE("formation")); await pret(page, "[data-coche]"); await attendre(page, 800);
    const id = await page.evaluate(() => { const c = Array.from(document.querySelectorAll("[data-coche]")).find(x => !x.checked && !x.disabled); if (!c) return null; (c.closest("label") || c).click(); return c.dataset.coche; });
    await attendre(page, 1200);
    const apresF = id ? await page.evaluate(k => { const c = document.querySelector('[data-coche="' + k + '"]'); return c ? c.checked : null; }, id) : null;
    ok("E5 : coach, case de la Formation touchée (lecture seule) : rien n'est enregistré et la case ne reste pas cochée",
      !!id && apresF === false && ecr(db, "formation").length === 0, JSON.stringify([id, apresF, ecr(db, "formation").length]));
  });
  await bloc("E. zones de toucher", async () => {
    const db = base();
    const { page } = await contexte(b, THOMAS, db, { viewport: MOBILE });
    await page.goto(URL0 + "#/accueil"); await pret(page);
    const r = await page.evaluate(() => {
      const d = document.createElement("div");
      d.innerHTML = '<div class="seg echelle5"><button type="button">3</button></div><div class="installe"><button type="button" class="fermer">×</button></div><div class="volet-tete"><a class="retour-volet" href="#/accueil">←</a><h2>T</h2></div>';
      document.body.appendChild(d);
      const s = sel => getComputedStyle(d.querySelector(sel));
      const out = { echelle: s(".echelle5 button").minHeight, croix: [s(".installe .fermer").minWidth, s(".installe .fermer").minHeight], retour: [s(".retour-volet").width, s(".retour-volet").height] };
      d.remove(); return out;
    });
    ok("E6 : zones de toucher à 44 px sur téléphone : échelles 1-5 du bilan, croix « Plus tard » de la bannière d'installation, flèche de retour du volet",
      r.echelle === "44px" && r.croix.join() === "44px,44px" && r.retour.join() === "44px,44px", JSON.stringify(r));
  });

  /* =================== Z. console, hôtes externes =================== */
  await bloc("Z. console et hôtes externes", async () => {
    const autres = Array.from(externes).filter(h => !/^(fonts\.(googleapis|gstatic)\.com|i\.ytimg\.com|img\.youtube\.com)$/.test(h));
    ok("Z1 : aucune erreur de console ni erreur JS ni dialogue natif pendant la suite, aucun appel vers l'extérieur",
      ERREURS.length === 0 && autres.length === 0, JSON.stringify(ERREURS.slice(0, 5)) + " " + JSON.stringify(autres));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
