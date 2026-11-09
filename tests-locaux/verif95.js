/* verif95 — v95 (décisions de Lucas du 10/11/2026), dans un vrai navigateur (Supabase simulé, gabarit de verif92 : coach et
   clients des fixtures, aucune donnée réelle).
   A. le bouton de langue montre la langue ACTUELLE (« 🇫🇷 FR » quand l'app est en français, « 🇺🇸 EN » en anglais ; avant :
      l'inverse) avec un aria-label clair (« Langue : français. Passer en anglais » / « Language: English. Switch to French ») :
      barre du haut, écran de connexion, accueil du parcours ; un clic bascule toujours ;
   B. diète du coach, « Valider et envoyer au client » : « Semaine envoyée » seulement après la réponse de la base (comme
      « Programme envoyé » en v91) ; panne ou refus : « Pas envoyé : vérifie ta connexion et réessaie » avec le témoin du haut,
      un message qui reste ; la copie gardée sur l'appareil repart toute seule ; « Envoi… » et bouton désactivé pendant l'envoi ;
   C. jours abrégés de « Organise ta diète » dans la langue de l'app (Mon, Tue… / Lun, Mar…), seulement ces étiquettes : aucune
      traduction automatique de « Sam », « Mar »… (un prénom « Sam » écrit seul reste « Sam » en anglais) ;
   Z. aucune erreur de console ni erreur JS, aucun dialogue natif, aucun appel vers l'extérieur.
   Usage : node verif95.js ../index.html
           VERIF95_PORT=10098 node verif95.js ../index.html     (autre port, si 10097 est pris)
           VERIF95_BLOCS="A.,C." node verif95.js …               (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF95_PORT || 10097;
const BLOCS = (process.env.VERIF95_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
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

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF95_PORT=10098 node verif95.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. le bouton de langue =================== */
  await bloc("A. bouton de langue", async () => {
    const db = base();
    const { page } = await contexte(b, THOMAS, db);
    await page.goto(URL0 + "#/accueil"); await pret(page, "#langue");
    const fr = await bouton(page, "#langue");
    ok("A1 : app en français : le bouton montre « 🇫🇷 FR » (la langue actuelle) ; aria-label et bulle « " + FR + " »",
      !!fr && fr.txt === "🇫🇷 FR" && fr.aria === FR && fr.title === FR, JSON.stringify(fr));
    /* un clic bascule toujours : l'app passe en anglais, le bouton montre alors « 🇺🇸 EN » */
    await Promise.all([page.waitForEvent("load", { timeout: 10000 }).catch(() => {}), page.click("#langue")]);
    await pret(page, "#langue"); await attendre(page, 600);
    const en = await bouton(page, "#langue"), l = await page.evaluate(() => ({ langue: I18N.langue, lang: document.documentElement.lang }));
    ok("A2 : un clic passe l'app en anglais (lang=\"en\") ; le bouton montre « 🇺🇸 EN », aria-label et bulle « " + EN + " » (pas retouchés par la traduction)",
      l.langue === "en" && l.lang === "en" && !!en && en.txt === "🇺🇸 EN" && en.aria === EN && en.title === EN, JSON.stringify([l, en]));
    /* client dont le compte est en anglais, sur un appareil en anglais : même chose dès l'ouverture */
    const db2 = base(); avecPrefsEn(db2, C1);
    const { page: p2 } = await contexte(b, THOMAS, db2, { langue: "en" });
    await p2.goto(URL0 + "#/accueil"); await pret(p2, "#langue");
    const en2 = await bouton(p2, "#langue");
    ok("A3 : client en anglais dès l'ouverture : « 🇺🇸 EN », « " + EN + " »", !!en2 && en2.txt === "🇺🇸 EN" && en2.aria === EN, JSON.stringify(en2));
    /* sans compte : l'écran de connexion (mot entier) et l'accueil du parcours (rendu seul : l'inscription reste fermée) */
    const { page: p3 } = await contexte(b, null, base());
    await p3.goto(URL0 + "#/connexion"); await p3.waitForSelector("#c-go"); await attendre(p3, 400);
    const co = await bouton(p3, "#co-langue");
    const pc = await p3.evaluate(() => { try { const d = document.createElement("div"); d.innerHTML = Parcours.html_accueil(); const x = d.querySelector("#pc-langue"); return x ? { txt: x.textContent.trim(), aria: x.getAttribute("aria-label") } : null; } catch (e) { return { erreur: String(e) }; } });
    const { page: p4 } = await contexte(b, null, base(), { langue: "en" });
    await p4.goto(URL0 + "#/connexion"); await p4.waitForSelector("#c-go"); await attendre(p4, 400);
    const coEn = await bouton(p4, "#co-langue");
    ok("A4 : écran de connexion : « 🇫🇷 Français » en français, « 🇺🇸 English » en anglais, avec le même aria-label clair ; accueil du parcours : « 🇫🇷 FR », « " + FR + " »",
      !!co && co.txt === "🇫🇷 Français" && co.aria === FR && !!coEn && coEn.txt === "🇺🇸 English" && coEn.aria === EN && !!pc && pc.txt === "🇫🇷 FR" && pc.aria === FR,
      JSON.stringify([co, coEn, pc]));
  });

  /* =================== B. « Semaine envoyée » =================== */
  const envoyerSemaine = async page => {
    await page.click("#nu-save");
    await attendreQue(() => page.evaluate(() => { const b = document.getElementById("nu-save"), m = document.getElementById("nu-msg2"); return !!b && !b.disabled && !!m && m.textContent.trim() !== ""; }), 9000);
    return { msg: await texte(page, "#nu-msg2"), bouton: await texte(page, "#nu-save") };
  };
  await bloc("B. semaine envoyée : panne puis renvoi", async () => {
    const db = base(); db.panneEcriture = "repas";
    const { c, page } = await contexte(b, COACH, db);
    await page.goto(FICHE("nutrition")); await pret(page, "#nu-save");
    const r = await envoyerSemaine(page);
    await attendre(page, 4500);   // un flash s'efface après 3,2 s : celui-ci reste
    const plusTard = await texte(page, "#nu-msg2");
    ok("B1 : écriture de la diète en panne (500) : jamais « Semaine envoyée » ; « Pas envoyé : vérifie ta connexion et réessaie. » avec le témoin du haut (« Hors ligne … »), toujours là 4,5 s après ; le bouton redevient « Valider et envoyer au client »",
      /^Pas envoyé : vérifie ta connexion et réessaie\. \(Hors ligne/.test(r.msg || "") && plusTard === r.msg && !/Semaine envoyée/.test(r.msg || "") && r.bouton === "Valider et envoyer au client" && db.refus.length > 0,
      JSON.stringify([r, plusTard, db.refus.length]));
    /* la base revient : la copie gardée sur l'appareil repart toute seule (reprise après 30 s), sans nouveau clic */
    const copie = await page.evaluate(id => Store.aUneCopie(id, "repas"), C1);
    db.panneEcriture = null;
    const n0 = ecr(db, "repas", C1).length;
    await c.clock.fastForward(31000);
    const renvoye = await attendreQue(() => ecr(db, "repas", C1).length > n0, 8000);
    const e = ecr(db, "repas", C1).pop(), apres = await page.evaluate(id => Store.aUneCopie(id, "repas"), C1);
    ok("B2 : la copie de la semaine est gardée sur l'appareil, puis renvoyée automatiquement quand la base répond (sans nouveau clic), avec sa date d'envoi ; plus de copie en attente",
      copie === true && renvoye && !!(e && e.contenu && e.contenu.maj) && apres === false, JSON.stringify({ copie, renvoye, maj: e && e.contenu && e.contenu.maj, apres }));
  });
  await bloc("B. semaine envoyée : refus", async () => {
    const db = base(); db.refusEcriture = "repas";
    const { page } = await contexte(b, COACH, db);
    await page.goto(FICHE("nutrition")); await pret(page, "#nu-save");
    const r = await envoyerSemaine(page);
    ok("B3 : écriture refusée par la base (403) : jamais « Semaine envoyée » ; « Pas envoyé : vérifie ta connexion et réessaie. (Non enregistré — modification refusée) » ; rien d'écrit",
      /^Pas envoyé : vérifie ta connexion et réessaie\. \(Non enregistré — modification refusée\)/.test(r.msg || "") && !/Semaine envoyée/.test(r.msg || "") && ecr(db, "repas").length === 0, JSON.stringify([r, ecr(db, "repas").length]));
  });
  await bloc("B. semaine envoyée : réponse lente", async () => {
    const db = base(); db.lentEcriture = { outil: "repas", ms: 2000 };
    const { page } = await contexte(b, COACH, db);
    await page.goto(FICHE("nutrition")); await pret(page, "#nu-save");
    await page.click("#nu-save"); await attendre(page, 500);
    const pendant = await page.evaluate(() => ({ dis: document.getElementById("nu-save").disabled, txt: document.getElementById("nu-save").textContent.trim(), msg: document.getElementById("nu-msg2").textContent.trim() }));
    await attendreQue(() => page.evaluate(() => /Semaine envoyée/.test(document.getElementById("nu-msg2").textContent)), 6000);
    const e = ecr(db, "repas", C1).pop(), apres = { msg: await texte(page, "#nu-msg2"), bouton: await texte(page, "#nu-save") };
    const nb = e && e.contenu && Array.isArray(e.contenu.jours) ? e.contenu.jours.length : -1;
    ok("B4 : pendant l'envoi (base lente) : « Envoi… », bouton désactivé, pas encore « Semaine envoyée » ; après la réponse : « Semaine envoyée — N jours. Ton client la voit dès sa prochaine ouverture. », la semaine écrite porte sa date",
      pendant.dis === true && pendant.txt === "Envoi…" && !/Semaine envoyée/.test(pendant.msg)
        && apres.msg === "Semaine envoyée — " + nb + " jour" + (nb > 1 ? "s" : "") + ". Ton client la voit dès sa prochaine ouverture." && apres.bouton === "Valider et envoyer au client" && !!(e && e.contenu && e.contenu.maj),
      JSON.stringify([pendant, apres, nb]));
  });

  /* =================== C. jours abrégés =================== */
  await bloc("C. jours abrégés", async () => {
    const jours = async langue => {
      const db = base(); if (langue === "en") avecPrefsEn(db, C1);
      const { page } = await contexte(b, THOMAS, db, { langue });
      await page.goto(URL0 + "#/accueil"); await pret(page);
      await page.evaluate(() => { location.hash = "#/formation"; }); await pret(page, ".fo-tete[data-mod=\"m2\"]"); await attendre(page, 800);
      const t = await page.$(".fo-tete[data-mod=\"m2\"]"); if (t && (await t.getAttribute("aria-expanded")) !== "true") { await t.click(); await attendre(page, 800); }
      return { page, l: await page.evaluate(() => Array.from(document.querySelectorAll("[data-fj]")).map(x => ({ t: x.textContent.trim(), a: x.getAttribute("aria-label") }))) };
    };
    const en = await jours("en"), fr = await jours("");
    ok("C1 : « Organise ta diète » en anglais : Mon, Tue, Wed, Thu, Fri, Sat, Sun (noms entiers lus par l'aria-label : Monday…)",
      en.l.map(x => x.t).join(",") === "Mon,Tue,Wed,Thu,Fri,Sat,Sun" && en.l[0].a === "Monday" && en.l[6].a === "Sunday", JSON.stringify(en.l));
    ok("C2 : en français, inchangé : Lun, Mar, Mer, Jeu, Ven, Sam, Dim (aria-label : Lundi…)",
      fr.l.map(x => x.t).join(",") === "Lun,Mar,Mer,Jeu,Ven,Sam,Dim" && fr.l[0].a === "Lundi" && fr.l[6].a === "Dimanche", JSON.stringify(fr.l));
    /* aucune traduction automatique : un prénom « Sam » (ou « Mar », « Dim »…) écrit seul dans la page reste tel quel en anglais */
    const r = await en.page.evaluate(async () => {
      const ABR = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"], a = k => Object.prototype.hasOwnProperty.call(I18N.en, k);
      const cles = ABR.filter(k => a(k) || a(k.toLowerCase()) || I18N.motifs.some(([re]) => re.test(k)));
      const v = document.getElementById("vue"), d = document.createElement("div"); d.id = "essai-prenoms";
      d.innerHTML = ABR.map(k => "<p>" + k + "</p>").join("") + "<p title=\"Sam\">Sam Démo</p>";
      v.appendChild(d); await new Promise(k => setTimeout(k, 400));
      const vus = Array.from(d.querySelectorAll("p")).map(p => p.textContent), titre = d.querySelector("[title]").getAttribute("title");
      d.remove();
      return { langue: I18N.langue, cles, vus, titre, texte: Traduction.texte("Sam") };   // null : aucune traduction
    });
    ok("C3 : en anglais, « Sam », « Mar », « Dim »… écrits seuls dans la page restent tels quels (aucune clé ni motif pour eux dans I18N : seules les étiquettes des jours changent)",
      r.langue === "en" && r.cles.length === 0 && r.vus.join(",") === "Lun,Mar,Mer,Jeu,Ven,Sam,Dim,Sam Démo" && r.titre === "Sam" && (r.texte == null || r.texte === "Sam"), JSON.stringify(r));
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
