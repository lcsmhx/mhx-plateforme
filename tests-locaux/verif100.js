/* verif100 — v100 (chantier 5 de la nuit du 10/11/2026, audit §8 : le menu du client), dans un vrai navigateur (Supabase
   simulé, gabarit de verif95 : coach et clients des fixtures, aucune donnée réelle).
   A. menu du client : Accueil · Mon programme · Nutrition · Ma progression · Mon suivi · Formation · Profil (ordinateur), Accueil ·
      Programme · Nutrition · Progression · Plus (téléphone) ; calculateur gardé pour un client sans diète ;
   B. « Mon journal » dans Programme (historique), « Mes compléments » sous Nutrition, rien d'écrit ;
   C. chaque ancienne adresse du client ouvre la même page qu'avant (relevé sur la v99) et marque son entrée parente ;
   D. le prospect et l'écran sans compte : exactement comme avant (relevé sur la v99) ;
   E. la fiche d'un client côté coach ne change pas ;
   Z. aucune erreur de console ni erreur JS, aucun dialogue natif, aucun appel vers l'extérieur.
   Usage : node verif100.js ../index.html
           VERIF100_PORT=10109 node verif100.js ../index.html     (autre port, si 10108 est pris)
           VERIF100_BLOCS="A.,C." node verif100.js …               (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF100_PORT || 10108;
const BLOCS = (process.env.VERIF100_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
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
/* le lundi de cette semaine à midi : les relevés de la v99 (blocs C et D) ont été faits un lundi (« Lundi aujourd'hui » sur
   #/nutrition et #/repas) ; sans cela le bloc C échouerait du mardi au dimanche */
const LUNDI0 = (() => { const d = new Date(T0); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d.getTime(); })();
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
  await c.clock.install({ time: opts.time || T0 });
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
/* relevés sur la v99 (même faux Supabase) : client, prospect, écran sans compte */
const AVANT_CLIENT = {"#/accueil": {"courant": "accueil", "hash": "#/accueil", "titres": ["Bonjour Thomas", "Cette semaine", "Bilan hebdomadaire"], "ids": ["acc-vue"], "nav": ["Accueil", "Mon programme", "Mon journal", "Nutrition", "Ma progression", "Calculateur", "Mon suivi", "Formation", "Mes compléments", "Profil"], "bas": ["Accueil", "Programme", "Nutrition", "Progression", "Plus"], "texte": "Accueil Mon programme Mon journal Nutrition Ma progression Calculateur Mon suivi Formation Mes compléments Profil Thomas Démo 🇫🇷 FR Se déconnecter Bonjour Thomas 3 séances sur 4, 2 repas cochés sur 4 : régularité 73/100 cette semaine. Cette semaine RÉGULARITÉ 73/100 semaine dernière : 58 POIDS 82,4kg −0,2 kg depuis la mesure d'avant ENTRAÎNEMENT 3/ 4 séances notées NUTRITION 2/ 4 repas respectés"}, "#/programme": {"courant": "programme", "hash": "#/programme", "titres": ["Le programme", "Bloc 1 — 4 semaines", "Séance A — Haut du corps"], "ids": ["prog-vue", "prog-nb", "seance-0", "jr-ok-0", "jr-msg-0", "seance-1"], "nav": ["Accueil", "Mon programme", "Mon journal", "Nutrition", "Ma progression", "Calculateur", "Mon suivi", "Formation", "Mes compléments", "Profil"], "bas": ["Accueil", "Programme", "Nutrition", "Progression", "Plus"], "texte": "Accueil Mon programme Mon journal Nutrition Ma progression Calculateur Mon suivi Formation Mes compléments Profil Thomas Démo 🇫🇷 FR Se déconnecter Le programme Les séances construites pour toi : les exercices, les séries, les répétitions et les temps de repos. CYCLE 01 · SEMAINE 4 — CYCLE TERMINÉ Bloc 1 — 4 semaines CETTE SEMAINE 3/ 4 séances notées Ce cycle est terminé : ton coach prépare la su"}, "#/journal": {"courant": "journal", "hash": "#/journal", "titres": ["Ton journal d'entraînement", "Mes séances du programme", "Séance A — Haut du corps"], "ids": ["jr-vue", "jr-noter", "jr-seance-0", "jr-ok-0", "jr-msg-0", "jr-seance-1"], "nav": ["Accueil", "Mon programme", "Mon journal", "Nutrition", "Ma progression", "Calculateur", "Mon suivi", "Formation", "Mes compléments", "Profil"], "bas": ["Accueil", "Programme", "Nutrition", "Progression", "Plus"], "texte": "Accueil Mon programme Mon journal Nutrition Ma progression Calculateur Mon suivi Formation Mes compléments Profil Thomas Démo 🇫🇷 FR Se déconnecter Ton journal d'entraînement Tes séances notées, tes charges et tes progrès, séance après séance. Mes séances du programme Choisis la séance que tu viens de faire et note tes répétitions et tes charges, série par série. Séance A — Haut du corps ✓ notée "}, "#/nutrition": {"courant": "nutrition", "hash": "#/nutrition", "titres": ["La journée type", "Lundi aujourd'hui", "Œufs brouillés, pain complet, fruit"], "ids": ["nu-vue", "nu-hist"], "nav": ["Accueil", "Mon programme", "Mon journal", "Nutrition", "Ma progression", "Calculateur", "Mon suivi", "Formation", "Mes compléments", "Profil"], "bas": ["Accueil", "Programme", "Nutrition", "Progression", "Plus"], "texte": "Accueil Mon programme Mon journal Nutrition Ma progression Calculateur Mon suivi Formation Mes compléments Profil Thomas Démo 🇫🇷 FR Se déconnecter La journée type Des repas construits sur tes calories et tes macros, avec des aliments qu'on trouve en France — et qui respectent ton régime et tes allergies. Mot du coach Bois 2 L d'eau par jour. Les grammages sont crus. Lundi 2 240 kcal Mardi 2 240 "}, "#/journal-alimentaire": {"courant": "accueil", "hash": "#/accueil", "titres": ["Bonjour Thomas", "Cette semaine", "Bilan hebdomadaire"], "ids": ["acc-vue"], "nav": ["Accueil", "Mon programme", "Mon journal", "Nutrition", "Ma progression", "Calculateur", "Mon suivi", "Formation", "Mes compléments", "Profil"], "bas": ["Accueil", "Programme", "Nutrition", "Progression", "Plus"], "texte": "Accueil Mon programme Mon journal Nutrition Ma progression Calculateur Mon suivi Formation Mes compléments Profil Thomas Démo 🇫🇷 FR Se déconnecter Bonjour Thomas 3 séances sur 4, 2 repas cochés sur 4 : régularité 73/100 cette semaine. Cette semaine RÉGULARITÉ 73/100 semaine dernière : 58 POIDS 82,4kg −0,2 kg depuis la mesure d'avant ENTRAÎNEMENT 3/ 4 séances notées NUTRITION 2/ 4 repas respectés"}, "#/mensurations": {"courant": "mensurations", "hash": "#/mensurations", "titres": ["Ta progression", "Poids", "Nouvelle mesure"], "ids": ["mens-ajouter", "k-poids", "k-poids-d", "k-depart", "k-depart-d", "k-delta"], "nav": ["Accueil", "Mon programme", "Mon journal", "Nutrition", "Ma progression", "Calculateur", "Mon suivi", "Formation", "Mes compléments", "Profil"], "bas": ["Accueil", "Programme", "Nutrition", "Progression", "Plus"], "texte": "Accueil Mon programme Mon journal Nutrition Ma progression Calculateur Mon suivi Formation Mes compléments Profil Thomas Démo 🇫🇷 FR Se déconnecter Ta progression Ton poids, tes mensurations et ta composition corporelle, semaine après semaine. Une mesure par semaine, toujours dans les mêmes conditions : c'est la tendance qui compte. Poids + Ajouter ma mesure POIDS ACTUEL 82,4 semaine 4 POIDS DE D"}, "#/calculateur": {"courant": "calculateur", "hash": "#/calculateur", "titres": ["Calculateur métabolique", "Tes données", "Ta maintenance"], "ids": ["sexe", "age", "taille", "poids", "pas", "heures"], "nav": ["Accueil", "Mon programme", "Mon journal", "Nutrition", "Ma progression", "Calculateur", "Mon suivi", "Formation", "Mes compléments", "Profil"], "bas": ["Accueil", "Programme", "Nutrition", "Progression", "Plus"], "texte": "Accueil Mon programme Mon journal Nutrition Ma progression Calculateur Mon suivi Formation Mes compléments Profil Thomas Démo 🇫🇷 FR Se déconnecter Calculateur métabolique Tes calories de maintenance et tes macros, calculées sur ta morphologie et ton niveau d'activité réel. Tout se met à jour en direct. Tes données Sexe Homme Femme Âge (ans) Taille (cm) Poids (kg) Pas par jour Entraînement (h / s"}, "#/suivi": {"courant": "suivi", "hash": "#/suivi", "titres": ["Ton suivi", "Bilan hebdomadaire", "Ta régularité"], "ids": ["suivi-fb-haut", "suivi-checkin", "suivi-fb-bas", "suivi-reg", "suivi-bilan"], "nav": ["Accueil", "Mon programme", "Mon journal", "Nutrition", "Ma progression", "Calculateur", "Mon suivi", "Formation", "Mes compléments", "Profil"], "bas": ["Accueil", "Programme", "Nutrition", "Progression", "Plus"], "texte": "Accueil Mon programme Mon journal Nutrition Ma progression Calculateur Mon suivi Formation Mes compléments Profil Thomas Démo 🇫🇷 FR Se déconnecter Ton suivi Comment se passe ton accompagnement : ta régularité, tes objectifs du mois et ton bilan des quatre dernières semaines. Bilan hebdomadaire ✓ envoyé Bilan de la semaine envoyé le 08/11/2026 — merci, ton coach le lit avant votre prochain échang"}, "#/bilan": {"courant": "bilan", "hash": "#/bilan", "titres": ["Ton bilan du mois", "Les 4 dernières semaines", "Ce qui a bougé"], "ids": ["bilan-vue"], "nav": ["Accueil", "Mon programme", "Mon journal", "Nutrition", "Ma progression", "Calculateur", "Mon suivi", "Formation", "Mes compléments", "Profil"], "bas": ["Accueil", "Programme", "Nutrition", "Progression", "Plus"], "texte": "Accueil Mon programme Mon journal Nutrition Ma progression Calculateur Mon suivi Formation Mes compléments Profil Thomas Démo 🇫🇷 FR Se déconnecter Ton bilan du mois Tes quatre dernières semaines en un coup d'œil : ce que tu as fait, ce qui a bougé et ce qu'on travaille ensuite. Les 4 dernières semaines Du 13/10/2026 au 09/11/2026 RÉGULARITÉ MOYENNE 62/100 4 semaines complètes SÉANCES NOTÉES 8/16"}, "#/formation": {"courant": "formation", "hash": "#/formation", "titres": ["Formation", "Ton parcours", "Le processus, étape par étape"], "ids": ["fo-vue"], "nav": ["Accueil", "Mon programme", "Mon journal", "Nutrition", "Ma progression", "Calculateur", "Mon suivi", "Formation", "Mes compléments", "Profil"], "bas": ["Accueil", "Programme", "Nutrition", "Progression", "Plus"], "texte": "Accueil Mon programme Mon journal Nutrition Ma progression Calculateur Mon suivi Formation Mes compléments Profil Thomas Démo 🇫🇷 FR Se déconnecter Formation Cours et ebooks : alimentation, entraînement, mindset BIBLIOTHÈQUE · 7 MODULES Ton parcours Une méthode simple pour poser les bases : ton alimentation, ton entraînement et tes habitudes, sans programme complexe ni séance interminable. Conçue"}, "#/complements": {"courant": "complements", "hash": "#/complements", "titres": ["Les compléments", "Ce que tu prends"], "ids": ["cp-vue"], "nav": ["Accueil", "Mon programme", "Mon journal", "Nutrition", "Ma progression", "Calculateur", "Mon suivi", "Formation", "Mes compléments", "Profil"], "bas": ["Accueil", "Programme", "Nutrition", "Progression", "Plus"], "texte": "Accueil Mon programme Mon journal Nutrition Ma progression Calculateur Mon suivi Formation Mes compléments Profil Thomas Démo 🇫🇷 FR Se déconnecter Les compléments Ce que tu prends, à quelle dose et à quel moment. Rien d'obligatoire : un complément complète une alimentation, il ne la remplace pas. Ce que tu prends Protéine whey 30 g compté dans tes repas Collation ou après la séance 117 kcal · 24"}, "#/profil": {"courant": "profil", "hash": "#/profil", "titres": ["Ton profil", "1 · Identité & logistique", "2 · Ton objectif"], "ids": ["q-nom", "q-age", "q-sexe", "q-ville", "q-fuseau", "q-email"], "nav": ["Accueil", "Mon programme", "Mon journal", "Nutrition", "Ma progression", "Calculateur", "Mon suivi", "Formation", "Mes compléments", "Profil"], "bas": ["Accueil", "Programme", "Nutrition", "Progression", "Plus"], "texte": "Accueil Mon programme Mon journal Nutrition Ma progression Calculateur Mon suivi Formation Mes compléments Profil Thomas Démo 🇫🇷 FR Se déconnecter Ton profil Plus tes réponses sont précises, plus ton programme sera adapté. Ne cherche pas la bonne réponse : cherche la vraie. Compte 10 à 15 minutes. 1 · Identité & logistique Prénom et nom * Âge * Sexe * Demandé uniquement pour le calcul du métabol"}, "#/repas": {"courant": "nutrition", "hash": "#/repas", "titres": ["La journée type", "Lundi aujourd'hui", "Œufs brouillés, pain complet, fruit"], "ids": ["nu-vue", "nu-hist"], "nav": ["Accueil", "Mon programme", "Mon journal", "Nutrition", "Ma progression", "Calculateur", "Mon suivi", "Formation", "Mes compléments", "Profil"], "bas": ["Accueil", "Programme", "Nutrition", "Progression", "Plus"], "texte": "Accueil Mon programme Mon journal Nutrition Ma progression Calculateur Mon suivi Formation Mes compléments Profil Thomas Démo 🇫🇷 FR Se déconnecter La journée type Des repas construits sur tes calories et tes macros, avec des aliments qu'on trouve en France — et qui respectent ton régime et tes allergies. Mot du coach Bois 2 L d'eau par jour. Les grammages sont crus. Lundi 2 240 kcal Mardi 2 240 "}, "#/progression": {"courant": "mensurations", "hash": "#/progression", "titres": ["Ta progression", "Poids", "Nouvelle mesure"], "ids": ["mens-ajouter", "k-poids", "k-poids-d", "k-depart", "k-depart-d", "k-delta"], "nav": ["Accueil", "Mon programme", "Mon journal", "Nutrition", "Ma progression", "Calculateur", "Mon suivi", "Formation", "Mes compléments", "Profil"], "bas": ["Accueil", "Programme", "Nutrition", "Progression", "Plus"], "texte": "Accueil Mon programme Mon journal Nutrition Ma progression Calculateur Mon suivi Formation Mes compléments Profil Thomas Démo 🇫🇷 FR Se déconnecter Ta progression Ton poids, tes mensurations et ta composition corporelle, semaine après semaine. Une mesure par semaine, toujours dans les mêmes conditions : c'est la tendance qui compte. Poids + Ajouter ma mesure POIDS ACTUEL 82,4 semaine 4 POIDS DE D"}, "#/home": {"courant": "accueil", "hash": "#/home", "titres": ["Bonjour Thomas", "Cette semaine", "Bilan hebdomadaire"], "ids": ["acc-vue"], "nav": ["Accueil", "Mon programme", "Mon journal", "Nutrition", "Ma progression", "Calculateur", "Mon suivi", "Formation", "Mes compléments", "Profil"], "bas": ["Accueil", "Programme", "Nutrition", "Progression", "Plus"], "texte": "Accueil Mon programme Mon journal Nutrition Ma progression Calculateur Mon suivi Formation Mes compléments Profil Thomas Démo 🇫🇷 FR Se déconnecter Bonjour Thomas 3 séances sur 4, 2 repas cochés sur 4 : régularité 73/100 cette semaine. Cette semaine RÉGULARITÉ 73/100 semaine dernière : 58 POIDS 82,4kg −0,2 kg depuis la mesure d'avant ENTRAÎNEMENT 3/ 4 séances notées NUTRITION 2/ 4 repas respectés"}}, AVANT_PROSPECT = {"#/accueil": {"courant": "accueil", "hash": "#/accueil", "titres": ["Bonjour Julien", "Ton questionnaire"], "ids": ["acc-vue", "q-probleme", "q-obstacle", "q-obstacle-max", "q-obstacle-precision", "q-projection"], "nav": ["Accueil", "Mon programme (verrouillé)", "Mon journal (verrouillé)", "Nutrition (verrouillé)", "Ma progression", "Calculateur", "Mon suivi (verrouillé)", "Formation", "Profil"], "bas": ["Accueil", "Calculateur", "Progression", "Formation", "Plus"], "texte": "Accueil Mon programme (verrouillé) Mon journal (verrouillé) Nutrition (verrouillé) Ma progression Calculateur Mon suivi (verrouillé) Formation Profil Julien Démo 🇫🇷 FR Se déconnecter Bonjour Julien 3 questions, 30 secondes : dis-nous où tu en es. Ton questionnaire Ton objectif numéro 1 ? Perdre du gras Affiner ma silhouette Prendre du muscle Me dessiner et gagner en force Me remettre en forme Re"}, "#/programme": {"courant": "programme", "hash": "#/programme", "titres": ["Le programme", "Choisis ton programme", "Mon programme"], "ids": ["pf-zone", "pf-choisir"], "nav": ["Accueil", "Mon programme (verrouillé)", "Mon journal (verrouillé)", "Nutrition (verrouillé)", "Ma progression", "Calculateur", "Mon suivi (verrouillé)", "Formation", "Profil"], "bas": ["Accueil", "Calculateur", "Progression", "Formation", "Plus"], "texte": "Accueil Mon programme (verrouillé) Mon journal (verrouillé) Nutrition (verrouillé) Ma progression Calculateur Mon suivi (verrouillé) Formation Profil Julien Démo 🇫🇷 FR Se déconnecter Le programme Les séances construites pour toi : les exercices, les séries, les répétitions et les temps de repos. Choisis ton programme Ton objectif et ton profil n'indiquent pas encore de programme : choisis celui "}, "#/journal": {"courant": "journal", "hash": "#/journal", "titres": ["Ton journal d'entraînement", "Séance A — Corps entier", "Mon journal"], "ids": ["ech-journal", "ech-journal-m"], "nav": ["Accueil", "Mon programme (verrouillé)", "Mon journal (verrouillé)", "Nutrition (verrouillé)", "Ma progression", "Calculateur", "Mon suivi (verrouillé)", "Formation", "Profil"], "bas": ["Accueil", "Calculateur", "Progression", "Formation", "Plus"], "texte": "Accueil Mon programme (verrouillé) Mon journal (verrouillé) Nutrition (verrouillé) Ma progression Calculateur Mon suivi (verrouillé) Formation Profil Julien Démo 🇫🇷 FR Se déconnecter Ton journal d'entraînement Tes séances notées, tes charges et tes progrès, séance après séance. EXEMPLE Un aperçu de cette page avec l'accompagnement : ce ne sont pas tes données. Séance A — Corps entier Séance noté"}, "#/nutrition": {"courant": "nutrition", "hash": "#/nutrition", "titres": ["La journée type", "Une journée type", "Nutrition"], "ids": ["ech-nutrition", "ech-nutrition-m", "ech-repas"], "nav": ["Accueil", "Mon programme (verrouillé)", "Mon journal (verrouillé)", "Nutrition (verrouillé)", "Ma progression", "Calculateur", "Mon suivi (verrouillé)", "Formation", "Profil"], "bas": ["Accueil", "Calculateur", "Progression", "Formation", "Plus"], "texte": "Accueil Mon programme (verrouillé) Mon journal (verrouillé) Nutrition (verrouillé) Ma progression Calculateur Mon suivi (verrouillé) Formation Profil Julien Démo 🇫🇷 FR Se déconnecter La journée type Des repas construits sur tes calories et tes macros, avec des aliments qu'on trouve en France — et qui respectent ton régime et tes allergies. EXEMPLE Un aperçu de cette page avec l'accompagnement : "}, "#/journal-alimentaire": {"courant": "accueil", "hash": "#/accueil", "titres": ["Bonjour Julien", "Ton questionnaire"], "ids": ["acc-vue", "q-probleme", "q-obstacle", "q-obstacle-max", "q-obstacle-precision", "q-projection"], "nav": ["Accueil", "Mon programme (verrouillé)", "Mon journal (verrouillé)", "Nutrition (verrouillé)", "Ma progression", "Calculateur", "Mon suivi (verrouillé)", "Formation", "Profil"], "bas": ["Accueil", "Calculateur", "Progression", "Formation", "Plus"], "texte": "Accueil Mon programme (verrouillé) Mon journal (verrouillé) Nutrition (verrouillé) Ma progression Calculateur Mon suivi (verrouillé) Formation Profil Julien Démo 🇫🇷 FR Se déconnecter Bonjour Julien 3 questions, 30 secondes : dis-nous où tu en es. Ton questionnaire Ton objectif numéro 1 ? Perdre du gras Affiner ma silhouette Prendre du muscle Me dessiner et gagner en force Me remettre en forme Re"}, "#/mensurations": {"courant": "mensurations", "hash": "#/mensurations", "titres": ["Ta progression", "Ton accord, une seule fois", "Poids"], "ids": ["sante-carte", "sante-oui", "sante-non", "sante-msg", "mens-ajouter", "k-poids"], "nav": ["Accueil", "Mon programme (verrouillé)", "Mon journal (verrouillé)", "Nutrition (verrouillé)", "Ma progression", "Calculateur", "Mon suivi (verrouillé)", "Formation", "Profil"], "bas": ["Accueil", "Calculateur", "Progression", "Formation", "Plus"], "texte": "Accueil Mon programme (verrouillé) Mon journal (verrouillé) Nutrition (verrouillé) Ma progression Calculateur Mon suivi (verrouillé) Formation Profil Julien Démo 🇫🇷 FR Se déconnecter Ta progression Ton poids, tes mensurations et ta composition corporelle, semaine après semaine. Une mesure par semaine, toujours dans les mêmes conditions : c'est la tendance qui compte. Ton accord, une seule fois P"}, "#/calculateur": {"courant": "calculateur", "hash": "#/calculateur", "titres": ["Calculateur métabolique", "Ton accord, une seule fois", "Tes données"], "ids": ["sante-carte", "sante-oui", "sante-non", "sante-msg", "sexe", "age"], "nav": ["Accueil", "Mon programme (verrouillé)", "Mon journal (verrouillé)", "Nutrition (verrouillé)", "Ma progression", "Calculateur", "Mon suivi (verrouillé)", "Formation", "Profil"], "bas": ["Accueil", "Calculateur", "Progression", "Formation", "Plus"], "texte": "Accueil Mon programme (verrouillé) Mon journal (verrouillé) Nutrition (verrouillé) Ma progression Calculateur Mon suivi (verrouillé) Formation Profil Julien Démo 🇫🇷 FR Se déconnecter Calculateur métabolique Tes calories de maintenance et tes macros, calculées sur ta morphologie et ton niveau d'activité réel. Tout se met à jour en direct. Ton accord, une seule fois Pour calculer tes calories et s"}, "#/suivi": {"courant": "suivi", "hash": "#/suivi", "titres": ["Ton suivi", "Ton suivi de la semaine", "Mon suivi"], "ids": ["ech-suivi", "ech-suivi-m"], "nav": ["Accueil", "Mon programme (verrouillé)", "Mon journal (verrouillé)", "Nutrition (verrouillé)", "Ma progression", "Calculateur", "Mon suivi (verrouillé)", "Formation", "Profil"], "bas": ["Accueil", "Calculateur", "Progression", "Formation", "Plus"], "texte": "Accueil Mon programme (verrouillé) Mon journal (verrouillé) Nutrition (verrouillé) Ma progression Calculateur Mon suivi (verrouillé) Formation Profil Julien Démo 🇫🇷 FR Se déconnecter Ton suivi Comment se passe ton accompagnement : ta régularité, tes objectifs du mois et ton bilan des quatre dernières semaines. EXEMPLE Un aperçu de cette page avec l'accompagnement : ce ne sont pas tes données. To"}, "#/bilan": {"courant": "bilan", "hash": "#/bilan", "titres": ["Ton bilan du mois", "Mon bilan"], "ids": [], "nav": ["Accueil", "Mon programme (verrouillé)", "Mon journal (verrouillé)", "Nutrition (verrouillé)", "Ma progression", "Calculateur", "Mon suivi (verrouillé)", "Formation", "Profil"], "bas": ["Accueil", "Calculateur", "Progression", "Formation", "Plus"], "texte": "Accueil Mon programme (verrouillé) Mon journal (verrouillé) Nutrition (verrouillé) Ma progression Calculateur Mon suivi (verrouillé) Formation Profil Julien Démo 🇫🇷 FR Se déconnecter Ton bilan du mois Tes quatre dernières semaines en un coup d'œil : ce que tu as fait, ce qui a bougé et ce qu'on travaille ensuite. Mon bilan Cette fonctionnalité est disponible avec l'accompagnement MHX. Réserver m"}, "#/formation": {"courant": "formation", "hash": "#/formation", "titres": ["Formation", "3 actions pour bien démarrer aujourd'hui", "Ce qui t'attend dans ta formation"], "ids": ["fo-vue", "fo-depart", "fo-apercu", "fo-presentation"], "nav": ["Accueil", "Mon programme (verrouillé)", "Mon journal (verrouillé)", "Nutrition (verrouillé)", "Ma progression", "Calculateur", "Mon suivi (verrouillé)", "Formation", "Profil"], "bas": ["Accueil", "Calculateur", "Progression", "Formation", "Plus"], "texte": "Accueil Mon programme (verrouillé) Mon journal (verrouillé) Nutrition (verrouillé) Ma progression Calculateur Mon suivi (verrouillé) Formation Profil Julien Démo 🇫🇷 FR Se déconnecter Formation Cours et ebooks : alimentation, entraînement, mindset COMMENCE ICI 3 actions pour bien démarrer aujourd'hui Regarde la vidéo de bienvenue Calcule tes calories (2 min) ✓ Note ton poids de départ (1 min) (fa"}, "#/complements": {"courant": "complements", "hash": "#/complements", "titres": ["Les compléments", "Mes compléments"], "ids": [], "nav": ["Accueil", "Mon programme (verrouillé)", "Mon journal (verrouillé)", "Nutrition (verrouillé)", "Ma progression", "Calculateur", "Mon suivi (verrouillé)", "Formation", "Profil"], "bas": ["Accueil", "Calculateur", "Progression", "Formation", "Plus"], "texte": "Accueil Mon programme (verrouillé) Mon journal (verrouillé) Nutrition (verrouillé) Ma progression Calculateur Mon suivi (verrouillé) Formation Profil Julien Démo 🇫🇷 FR Se déconnecter Les compléments Ce que tu prends, à quelle dose et à quel moment. Rien d'obligatoire : un complément complète une alimentation, il ne la remplace pas. Mes compléments Cette fonctionnalité est disponible avec l'accom"}, "#/profil": {"courant": "profil", "hash": "#/profil", "titres": ["Ton profil", "Ton questionnaire", "Newsletter"], "ids": ["mc-questionnaire", "mc-reponses", "mc-reponses-lien", "mc-emails-bloc", "mc-emails", "mc-emails-msg"], "nav": ["Accueil", "Mon programme (verrouillé)", "Mon journal (verrouillé)", "Nutrition (verrouillé)", "Ma progression", "Calculateur", "Mon suivi (verrouillé)", "Formation", "Profil"], "bas": ["Accueil", "Calculateur", "Progression", "Formation", "Plus"], "texte": "Accueil Mon programme (verrouillé) Mon journal (verrouillé) Nutrition (verrouillé) Ma progression Calculateur Mon suivi (verrouillé) Formation Profil Julien Démo 🇫🇷 FR Se déconnecter Ton profil Ton compte et tes réglages. Ton questionnaire Tes réponses au questionnaire sont enregistrées : ton coach les verra. Le questionnaire complet s'ouvrira au démarrage de ton accompagnement. Sexe Homme Âge 4"}, "#/repas": {"courant": "nutrition", "hash": "#/repas", "titres": ["La journée type", "Une journée type", "Nutrition"], "ids": ["ech-nutrition", "ech-nutrition-m", "ech-repas"], "nav": ["Accueil", "Mon programme (verrouillé)", "Mon journal (verrouillé)", "Nutrition (verrouillé)", "Ma progression", "Calculateur", "Mon suivi (verrouillé)", "Formation", "Profil"], "bas": ["Accueil", "Calculateur", "Progression", "Formation", "Plus"], "texte": "Accueil Mon programme (verrouillé) Mon journal (verrouillé) Nutrition (verrouillé) Ma progression Calculateur Mon suivi (verrouillé) Formation Profil Julien Démo 🇫🇷 FR Se déconnecter La journée type Des repas construits sur tes calories et tes macros, avec des aliments qu'on trouve en France — et qui respectent ton régime et tes allergies. EXEMPLE Un aperçu de cette page avec l'accompagnement : "}, "#/progression": {"courant": "mensurations", "hash": "#/progression", "titres": ["Ta progression", "Ton accord, une seule fois", "Poids"], "ids": ["sante-carte", "sante-oui", "sante-non", "sante-msg", "mens-ajouter", "k-poids"], "nav": ["Accueil", "Mon programme (verrouillé)", "Mon journal (verrouillé)", "Nutrition (verrouillé)", "Ma progression", "Calculateur", "Mon suivi (verrouillé)", "Formation", "Profil"], "bas": ["Accueil", "Calculateur", "Progression", "Formation", "Plus"], "texte": "Accueil Mon programme (verrouillé) Mon journal (verrouillé) Nutrition (verrouillé) Ma progression Calculateur Mon suivi (verrouillé) Formation Profil Julien Démo 🇫🇷 FR Se déconnecter Ta progression Ton poids, tes mensurations et ta composition corporelle, semaine après semaine. Une mesure par semaine, toujours dans les mêmes conditions : c'est la tendance qui compte. Ton accord, une seule fois P"}, "#/home": {"courant": "accueil", "hash": "#/home", "titres": ["Bonjour Julien", "Ton questionnaire"], "ids": ["acc-vue", "q-probleme", "q-obstacle", "q-obstacle-max", "q-obstacle-precision", "q-projection"], "nav": ["Accueil", "Mon programme (verrouillé)", "Mon journal (verrouillé)", "Nutrition (verrouillé)", "Ma progression", "Calculateur", "Mon suivi (verrouillé)", "Formation", "Profil"], "bas": ["Accueil", "Calculateur", "Progression", "Formation", "Plus"], "texte": "Accueil Mon programme (verrouillé) Mon journal (verrouillé) Nutrition (verrouillé) Ma progression Calculateur Mon suivi (verrouillé) Formation Profil Julien Démo 🇫🇷 FR Se déconnecter Bonjour Julien 3 questions, 30 secondes : dis-nous où tu en es. Ton questionnaire Ton objectif numéro 1 ? Perdre du gras Affiner ma silhouette Prendre du muscle Me dessiner et gagner en force Me remettre en forme Re"}}, AVANT_SANS = {"#/": {"courant": "accueil", "hash": "#/", "titres": ["Connexion à ton espace"], "ids": ["co-langue", "c-email", "c-mdp", "c-rester", "co-err", "c-go"], "nav": [], "bas": [], "texte": "🇫🇷 Français Connexion à ton espace Email Mot de passe Rester connecté Se connecter v2026-11-10 · 99 Mot de passe oublié ?Pas encore de compte ? Créer mon compte"}, "#/connexion": {"courant": "accueil", "hash": "#/connexion", "titres": ["Connexion à ton espace"], "ids": ["co-langue", "c-email", "c-mdp", "c-rester", "co-err", "c-go"], "nav": [], "bas": [], "texte": "🇫🇷 Français Connexion à ton espace Email Mot de passe Rester connecté Se connecter v2026-11-10 · 99 Mot de passe oublié ?Pas encore de compte ? Créer mon compte"}};
/* v104 (point 5) : changement voulu — la page Suivi a une zone de plus, #suivi-obj (les objectifs du mois que le coach modifie
   dans une fiche), entre la régularité et le bilan du mois ; chez le client elle reste vide (il garde ses cases ailleurs) :
   même page, mêmes titres, un id de plus avant suivi-bilan */
AVANT_CLIENT["#/suivi"].ids = ["suivi-fb-haut", "suivi-checkin", "suivi-fb-bas", "suivi-reg", "suivi-obj", "suivi-bilan"];
const C3 = F.IDS.c3;
const releve = page => page.evaluate(() => {
  const v = document.getElementById("vue") || document.body;
  const t = Array.from(v.querySelectorAll("h1, h2")).slice(0, 3).map(x => x.textContent.replace(/\s+/g, " ").trim());
  const ids = Array.from(v.querySelectorAll("[id]")).map(x => x.id).filter(x => !/^(etat|sortir-fiche|nu-complements)$/.test(x)).slice(0, 6);
  const nav = Array.from(document.querySelectorAll("#nav a")).map(x => x.textContent.replace(/\s+/g, " ").trim());
  const bas = Array.from(document.querySelectorAll("#barre-bas a, #barre-bas button")).map(x => x.textContent.replace(/\s+/g, " ").trim());
  return { courant: typeof courant !== "undefined" ? courant : null, hash: location.hash, titres: t, ids, nav, bas, texte: (document.body.innerText || "").replace(/\s+/g, " ").slice(0, 400) };
});
const sansIds = l => l.filter(x => x !== "nu-complements").slice(0, 6);
const marque = page => page.evaluate(() => ({ nav: (document.querySelector('#nav a[aria-current="page"]') || {}).textContent || null, bas: ((document.querySelector('#barre-bas a[aria-current="page"]') || {}).textContent || "").trim() || null }));
const prospect = db => { db.profils.find(p => p.id === C3).statut = "prospect"; return qui(C3, "julien@exemple.fr", { prenom: "Julien", nom: "Démo" }); };

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF100_PORT=10109 node verif100.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. le menu du client =================== */
  await bloc("A. menu du client", async () => {
    const db = base();
    const { page } = await contexte(b, THOMAS, db);
    await page.goto(URL0 + "#/accueil"); await pret(page, ".masthead"); await attendre(page, 800);
    const n = await page.evaluate(() => Array.from(document.querySelectorAll("#nav a")).map(a => a.textContent.trim()));
    ok("A1 : client avec une diète : Accueil · Mon programme · Nutrition · Ma progression · Mon suivi · Formation · Profil (plus Mon journal, Mes compléments, Calculateur)",
      JSON.stringify(n) === JSON.stringify(["Accueil", "Mon programme", "Nutrition", "Ma progression", "Mon suivi", "Formation", "Profil"]), JSON.stringify(n));
    const { page: tel } = await contexte(b, THOMAS, db, { viewport: MOBILE });
    await tel.goto(URL0 + "#/accueil"); await pret(tel, ".masthead"); await attendre(tel, 800);
    const bb = await tel.evaluate(() => Array.from(document.querySelectorAll("#barre-bas a, #barre-bas button")).map(a => a.textContent.trim()));
    await tel.click("#barre-bas [data-plus]"); await attendre(tel, 400);
    const vl = await tel.evaluate(() => Array.from(document.querySelectorAll(".volet .menu-plus a")).map(a => a.textContent.trim()));
    ok("A2 : téléphone : Accueil · Programme · Nutrition · Progression · Plus ; « Plus » : Mon suivi, Formation, Profil", JSON.stringify(bb) === JSON.stringify(["Accueil", "Programme", "Nutrition", "Progression", "Plus"]) && JSON.stringify(vl) === JSON.stringify(["Mon suivi", "Formation", "Profil"]), JSON.stringify([bb, vl]));
    /* un client sans diète : le calculateur reste */
    const db2 = base(); db2.donnees = db2.donnees.filter(x => !(x.user_id === C1 && x.outil === "repas"));
    const { page: p2 } = await contexte(b, THOMAS, db2);
    await p2.goto(URL0 + "#/accueil"); await pret(p2, ".masthead"); await attendre(p2, 800);
    const n2 = await p2.evaluate(() => Array.from(document.querySelectorAll("#nav a")).map(a => a.textContent.trim()));
    ok("A3 : client SANS diète : le Calculateur reste dans son menu", n2.includes("Calculateur") && !n2.includes("Mon journal"), JSON.stringify(n2));
  });

  /* =================== B. Mon journal dans Programme, compléments sous Nutrition =================== */
  await bloc("B. pages", async () => {
    const db = base();
    const { page } = await contexte(b, THOMAS, db);
    await page.goto(URL0 + "#/programme"); await pret(page, "#jr-historique");
    const h = await page.evaluate(() => ({ titre: (document.querySelector("#jr-historique h2") || {}).textContent, n: document.querySelectorAll("#jr-historique [data-jr-h]").length }));
    ok("B1 : « Mon programme » montre l'historique de « Mon journal » (Mes séances notées) sous le programme", /Mes séances notées/.test(h.titre || "") && h.n > 0, JSON.stringify(h));
    await page.goto(URL0 + "#/nutrition"); await pret(page, "#nu-complements a");
    await page.click("#nu-complements a"); await pret(page, "#cp-vue"); await attendre(page, 600);
    const m = await marque(page);
    ok("B2 : « Nutrition » mène à « Mes compléments » (#/complements), qui s'ouvre comme avant ; « Nutrition » reste marqué", (await page.evaluate(() => courant)) === "complements" && /Nutrition/.test(m.nav || ""), JSON.stringify(m));
    const ecrites = db.ecritures.filter(e => e.table === "donnees");
    ok("B3 : rien n'est écrit en parcourant ces pages", ecrites.length === 0, JSON.stringify(ecrites.map(e => e.outil)));
  });

  /* =================== C. chaque ancienne adresse du client : même page qu'avant =================== */
  await bloc("C. anciennes adresses du client", async () => {
    const parent = { "#/journal": "Mon programme", "#/complements": "Nutrition", "#/calculateur": "Nutrition" };
    for (const a of Object.keys(AVANT_CLIENT)) {
      const db = base();
      const { page, c } = await contexte(b, THOMAS, db, { time: LUNDI0 });
      await page.goto(URL0 + a); await pret(page); await attendre(page, 1800);
      const r = await releve(page), v = AVANT_CLIENT[a], m = parent[a] ? await marque(page) : null;
      ok("C : " + a + " ouvre la même page qu'avant (" + v.courant + ")" + (parent[a] ? " et marque « " + parent[a] + " »" : ""),
        r.courant === v.courant && r.hash === v.hash && JSON.stringify(r.titres) === JSON.stringify(v.titres) && JSON.stringify(r.ids) === JSON.stringify(sansIds(v.ids)) && (!m || (m.nav || "").includes(parent[a])),
        JSON.stringify([r.courant, r.titres, r.ids, m]));
      await c.close(); ouverts.pop();
    }
  });

  /* =================== D. le prospect et l'écran sans compte ne changent pas =================== */
  await bloc("D. prospect et sans compte", async () => {
    const diffs = [];
    for (const a of Object.keys(AVANT_PROSPECT)) {
      const db = base(); const who = prospect(db);
      const { page, c } = await contexte(b, who, db, { time: LUNDI0 });
      await page.goto(URL0 + a); await pret(page); await attendre(page, 1800);
      const r = await releve(page), v = AVANT_PROSPECT[a];
      if (!(r.courant === v.courant && JSON.stringify(r.titres) === JSON.stringify(v.titres) && JSON.stringify(r.ids) === JSON.stringify(sansIds(v.ids)) && JSON.stringify(r.nav) === JSON.stringify(v.nav) && JSON.stringify(r.bas) === JSON.stringify(v.bas))) diffs.push(a);
      await c.close(); ouverts.pop();
    }
    ok("D1 : un prospect : les " + Object.keys(AVANT_PROSPECT).length + " adresses montrent exactement la même page et le même menu qu'avant", diffs.length === 0, JSON.stringify(diffs));
    const d2 = [];
    for (const a of Object.keys(AVANT_SANS)) {
      const { page, c } = await contexte(b, null, base(), { time: LUNDI0 });
      await page.goto(URL0 + a); await attendre(page, 2500);
      const r = await releve(page);
      const sansV = s => String(s).replace(/v\d{4}-\d{2}-\d{2} · \d+/g, "v…");   // le numéro de version du pied de page change à chaque version
      if (sansV(r.texte) !== sansV(AVANT_SANS[a].texte) || JSON.stringify(r.titres) !== JSON.stringify(AVANT_SANS[a].titres)) d2.push(a + " : " + r.texte.slice(0, 80));
      await c.close(); ouverts.pop();
    }
    ok("D2 : l'écran sans compte (#/, #/connexion) : exactement le même texte qu'avant (hors numéro de version)", d2.length === 0, JSON.stringify(d2));
    /* le coach, sur SA page « Mon programme » : comme avant (pas d'historique ajouté) */
    const { page: co, c: cc } = await contexte(b, COACH, base());
    await co.goto(URL0 + "#/programme"); await pret(co); await attendre(co, 1500);
    const hc = await co.evaluate(() => !!document.getElementById("jr-historique"));
    ok("D3 : le coach, sur sa propre page « Mon programme » : rien d'ajouté (pas d'historique de séances)", !hc, String(hc));
    await cc.close(); ouverts.pop();
  });

  /* =================== E. la fiche du coach ne change pas =================== */
  await bloc("E. fiche du coach", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/client/" + C1 + "/programme"); await pret(page, ".fiche-onglets"); await attendre(page, 600);
    const p = await page.evaluate(() => Array.from(document.querySelectorAll("#vue > .fiche-entete a.b-act")).map(a => a.textContent.trim()));
    const n = await page.evaluate(() => Array.from(document.querySelectorAll("#nav a")).map(a => a.textContent.trim()));
    /* v104 (point 1) : changement voulu — la fiche n'a plus qu'une navigation, le bandeau .fiche-entete ; « son menu de fiche »
       = ses pages : Son journal (« Ses séances ») sous Entraînement, Calculateur (« Ses calories »)
       et Ses compléments sous Nutrition ; #nav = les 7 entrées du coach, sans aucun outil du client */
    await page.click('#vue > .fiche-entete .f-onglet[data-onglet-fiche="nutrition"]'); await pret(page); await attendre(page, 800);
    const pn = await page.evaluate(() => Array.from(document.querySelectorAll("#vue > .fiche-entete a.b-act")).map(a => [a.textContent.trim(), a.getAttribute("href")]));
    ok("E1 : la fiche d'un client (coach) garde « Ses séances » (Entraînement), « Ses calories » et « Ses compléments » (Nutrition) ; son menu de fiche garde Son journal (v104 : dans le bandeau de la fiche, #nav = le coach)",
      p.includes("Ses séances") && p.includes("Son programme") && pn.some(([t, h]) => t === "Ses calories" && h === "#/client/" + C1 + "/calculateur") && pn.some(([t, h]) => t === "Ses compléments" && h === "#/client/" + C1 + "/complements")
        && JSON.stringify(n) === JSON.stringify(["Aujourd'hui", "Clients", "Prospects", "Bibliothèque"]) /* v106 (lot 1) : les 4 entrées du coach */, JSON.stringify([p, pn, n]));
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
