/* verif99 — v99 (chantier 4 de la nuit du 10/11/2026, plan-fiche-client : la fiche d'un client en 5 onglets), dans un vrai
   navigateur (Supabase simulé, gabarit de verif95 : coach et clients des fixtures, aucune donnée réelle).
   A. un seul en-tête : 5 onglets (Aperçu · Entraînement · Nutrition · Suivi · Profil), les pages de l'onglet ouvert, WhatsApp
      toujours visible, « Revenir … » ; ouverture sur Aperçu ; Préparer le call dans Suivi ; Profil › Son compte ; 44 px ;
   B. chaque ancienne adresse #/client/<id>/<page> ouvre la même page qu'avant (relevé sur la v98), dans le bon onglet ;
   C. une écriture commencée (brouillon, publication lente) ne part jamais chez un autre client quand on change d'onglet et de
      client pendant l'envoi ;
   D. « Pas de connexion » par onglet ; ce qui était en lecture seule le reste ;
   E. téléphone 390 px sans débordement, coach en anglais ;
   Z. aucune erreur de console ni erreur JS, aucun dialogue natif, aucun appel vers l'extérieur.
   Usage : node verif99.js ../index.html
           VERIF99_PORT=10107 node verif99.js ../index.html     (autre port, si 10106 est pris)
           VERIF99_BLOCS="A.,C." node verif99.js …               (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF99_PORT || 10106;
const BLOCS = (process.env.VERIF99_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
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
const AVANT = {"accueil": ["accueil", ["Thomas Démo", "En bref", "Notes privées"], ["acc-vue", "fc-fermer", "fc-call", "fc-appeler", "fc-tab-suivi", "fc-tab-compte"]], "accueil/compte": ["accueil", ["Thomas Démo", "En bref", "Notes privées"], ["acc-vue", "fc-fermer", "fc-call", "fc-appeler", "fc-tab-suivi", "fc-tab-compte"]], "programme": ["programme", ["Son programme", "Bloc 1 — 4 semaines", "Réglages du programme"], ["prog-vue", "pg-etat", "pg-statut", "pg-publier", "pg-nouveau-bloc", "pg-pub-msg"]], "journal": ["journal", ["Son journal", "Séances notées par ton client"], ["jr-vue", "jr-noter", "jr-hist", "jr-historique", "jr-nb"]], "nutrition": ["nutrition", ["Nutrition", "Sa diète", "Composer la semaine"], ["nu-vue", "nu-etat", "nu-statut", "nu-publier", "nu-nouveau-bloc", "nu-pub-msg"]], "calculateur": ["calculateur", ["Calculateur", "Tes données", "Ta maintenance"], ["sexe", "age", "taille", "poids", "pas", "heures"]], "complements": ["complements", ["Ses compléments", "Ajouter un complément", "Sa liste"], ["cp-vue", "cp-libre", "cp-note"]], "suivi": ["suivi", ["Son suivi", "Bilan hebdomadaire", "Ta régularité"], ["suivi-fb-haut", "suivi-checkin", "suivi-fb-bas", "suivi-reg", "suivi-bilan"]], "bilan": ["bilan", ["Son bilan", "Points à aborder pendant le call", "Les 4 dernières semaines"], ["bilan-vue"]], "mensurations": ["mensurations", ["Sa progression", "Poids", "Nouvelle mesure"], ["k-poids", "k-poids-d", "k-depart", "k-depart-d", "k-delta", "k-sem"]], "formation": ["formation", ["Formation", "Ton parcours", "Le processus, étape par étape"], ["fo-vue"]], "profil": ["profil", ["Profil", "1 · Identité & logistique", "2 · Ton objectif"], ["q-nom", "q-age", "q-sexe", "q-ville", "q-fuseau", "q-email"]], "repas": ["nutrition", ["Nutrition", "Sa diète", "Composer la semaine"], ["nu-vue", "nu-etat", "nu-statut", "nu-publier", "nu-nouveau-bloc", "nu-pub-msg"]], "progression": ["mensurations", ["Sa progression", "Poids", "Nouvelle mesure"], ["k-poids", "k-poids-d", "k-depart", "k-depart-d", "k-delta", "k-sem"]]};   // relevé sur la v98 (même faux Supabase) : [outil, titres, identifiants]
/* v104 (point 4) : changement voulu — l'Aperçu a l'en-tête des autres onglets : le titre de page (« Fiche » ; « Son compte »
   sous Profil) passe avant le nom (h2), plus de croix (fc-fermer) ni de boutons Suivi / Compte (fc-tab-*), l'identité et les
   actions sont dans #fc-ident ; « Préparer le call » (fc-call) et Appeler (fc-appeler) restent */
const IDS104 = ["acc-vue", "fc-ident", "fc-call", "fc-appeler", "fc-suivi", "fc-retour"];
AVANT.accueil = ["accueil", ["Fiche", "Thomas Démo", "En bref"], IDS104];
AVANT["accueil/compte"] = ["accueil", ["Son compte", "Thomas Démo", "En bref"], IDS104];
const C2 = F.IDS.c2, TEL = "+33639980001";
const ONGLET = { accueil: "Aperçu", "accueil/compte": "Profil", programme: "Entraînement", journal: "Entraînement", nutrition: "Nutrition", repas: "Nutrition", calculateur: "Nutrition", complements: "Nutrition", suivi: "Suivi", bilan: "Suivi", mensurations: "Suivi", progression: "Suivi", formation: "Suivi", profil: "Profil" };
const avecTel = db => db.donnees.push({ user_id: C1, outil: "contact", contenu: { telephone: TEL }, maj_le: avant(J) });
const lireTete = page => page.evaluate(() => ({
  onglets: Array.from(document.querySelectorAll(".fiche-onglets .f-onglet")).map(a => a.textContent.trim()),
  ici: (document.querySelector('.fiche-onglets .f-onglet[aria-current="page"]') || {}).textContent || null,
  pages: Array.from(document.querySelectorAll("#vue > .fiche-entete .bandeau-actions a.b-act")).map(a => a.textContent.trim()),
  wa: (document.querySelector("[data-fiche-wa] a") || {}).href || null, sortir: !!document.getElementById("sortir-fiche") }));
const marques = page => page.evaluate(() => {
  const v = document.getElementById("vue") || document.body;
  const t = Array.from(v.querySelectorAll("h1, h2")).slice(0, 3).map(x => x.textContent.replace(/\s+/g, " ").trim()).filter(x => !/^Fiche (de|—)/.test(x));
  const ids = Array.from(v.querySelectorAll("[id]")).map(x => x.id).filter(x => !/^(etat|sortir-fiche)$/.test(x)).slice(0, 6);
  return { courant: typeof courant !== "undefined" ? courant : null, titres: t, ids };
});
const ouvrir = async (page, chemin, sel) => { await page.goto(URL0 + "#/client/" + C1 + "/" + chemin); await pret(page, sel); await attendre(page, 900); };

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF99_PORT=10107 node verif99.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. l'en-tête et les 5 onglets =================== */
  await bloc("A. en-tête", async () => {
    const db = base(); avecTel(db);
    const { page } = await contexte(b, COACH, db);
    await ouvrir(page, "programme", ".fiche-onglets");
    const t = await lireTete(page);
    ok("A1 : un seul en-tête : 5 onglets Aperçu · Entraînement · Nutrition · Suivi · Profil ; « Entraînement » ouvert (Son programme, Ses séances) ; WhatsApp ; « Revenir … »",
      JSON.stringify(t.onglets) === JSON.stringify(["Aperçu", "Entraînement", "Nutrition", "Suivi", "Profil"]) && t.ici === "Entraînement" && JSON.stringify(t.pages) === JSON.stringify(["Son programme", "Ses séances"])
        && /^https:\/\/wa\.me\/33639980001/.test(t.wa || "") && t.sortir, JSON.stringify(t));
    await ouvrir(page, "suivi", ".fiche-onglets");
    const s = await lireTete(page);
    ok("A2 : Suivi : Son suivi, Préparer le call, Ses courbes, Sa formation", s.ici === "Suivi" && JSON.stringify(s.pages) === JSON.stringify(["Son suivi", "Préparer le call", "Ses courbes", "Sa formation"]), JSON.stringify(s));
    await ouvrir(page, "nutrition", ".fiche-onglets");
    const n = await lireTete(page);
    ok("A3 : Nutrition : Ses repas, Ses calories, Ses compléments (absents du bandeau avant)", n.ici === "Nutrition" && JSON.stringify(n.pages) === JSON.stringify(["Ses repas", "Ses calories", "Ses compléments"]), JSON.stringify(n));
    /* depuis la liste : la fiche s'ouvre sur Aperçu */
    await page.goto(URL0 + "#/clients"); await pret(page, `[data-uid="${C1}"], [data-ouvrir="${C1}"], #lc-liste`);
    await page.goto(URL0 + "#/client/" + C1); await pret(page, "#fc-suivi"); await attendre(page, 900);
    /* v104 (point 4) : changement voulu — le WhatsApp de l'Aperçu est celui du bandeau commun (#vue > .fiche-entete), plus
       celui des actions (.fc-actions) : un seul lien WhatsApp pour un client */
    const a = await page.evaluate(() => ({ hash: location.hash, ici: (document.querySelector('.fiche-onglets .f-onglet[aria-current="page"]') || {}).textContent || null, wa: !!document.querySelector("#vue > .fiche-entete [data-fiche-wa] a"),
      nbWa: Array.from(document.querySelectorAll('#vue a[href*="wa.me"]')).filter(x => x.getClientRects().length > 0).length }));   // visibles (celui du panneau Compte, caché, compte à part)
    ok("A4 : la fiche s'ouvre sur « Aperçu » (la fiche : alertes, régularité, poids…), avec WhatsApp dans son en-tête (une seule fois)", (/\/accueil$/.test(a.hash) || a.hash.endsWith(C1)) && a.ici === "Aperçu" && a.wa && a.nbWa === 1, JSON.stringify(a));
    /* Profil › Son compte : l'onglet Compte de la fiche */
    await page.click('.fiche-onglets .f-onglet[data-onglet-fiche="profil"]'); await pret(page); await attendre(page, 900);
    const p = await lireTete(page);
    await page.click('#vue > .fiche-entete a.b-act:nth-of-type(2)'); await pret(page, "#fc-compte"); await attendre(page, 900);
    const c = await page.evaluate(() => ({ hash: location.hash, compte: !document.getElementById("fc-compte").hidden, ici: (document.querySelector('.fiche-onglets .f-onglet[aria-current="page"]') || {}).textContent || null }));
    ok("A5 : Profil : Son questionnaire, Son compte ; « Son compte » ouvre l'onglet Compte de la fiche (Profil reste marqué)",
      JSON.stringify(p.pages) === JSON.stringify(["Son questionnaire", "Son compte"]) && /\/accueil\/compte$/.test(c.hash) && c.compte && c.ici === "Profil", JSON.stringify([p.pages, c]));
    /* relecture : depuis Aperçu, le Compte, puis Entraînement, puis Aperçu : Aperçu rouvre le Suivi.
       v104 (point 4) : changement voulu — plus de bouton interne « Compte » (#fc-tab-compte) : depuis Aperçu, le Compte s'ouvre
       par Profil › « Son compte » (bandeau commun) ; mêmes vérifications ensuite (adresse, onglet marqué, Aperçu rouvre le Suivi) */
    await page.goto(URL0 + "#/client/" + C1 + "/accueil"); await pret(page, "#fc-suivi"); await attendre(page, 600);
    const sansBoutons = await page.evaluate(() => !document.querySelector('[id^="fc-tab-"], [data-onglet]'));
    await page.click('#vue > .fiche-entete .f-onglet[data-onglet-fiche="profil"]'); await pret(page); await attendre(page, 600);
    await page.click('#vue > .fiche-entete a.b-act:nth-of-type(2)'); await pret(page, "#fc-compte"); await attendre(page, 600);
    const apresCompte = await page.evaluate(() => ({ hash: location.hash, compte: !document.getElementById("fc-compte").hidden, ici: (document.querySelector('.fiche-onglets .f-onglet[aria-current="page"]') || {}).textContent || null }));
    await page.click('.fiche-onglets .f-onglet[data-onglet-fiche="entrainement"]'); await pret(page, "#pg-publier");
    await page.click('#vue > .fiche-entete .f-onglet[data-onglet-fiche="apercu"]'); await pret(page, "#fc-suivi"); await attendre(page, 600);
    const r = await page.evaluate(() => ({ suivi: !document.getElementById("fc-suivi").hidden, ici: (document.querySelector('.fiche-onglets .f-onglet[aria-current="page"]') || {}).textContent || null }));
    ok("A5b : depuis Aperçu (sans boutons internes Suivi / Compte), Profil › Son compte met l'adresse et l'onglet à jour (…/accueil/compte, Profil) ; puis Entraînement puis Aperçu : le Suivi s'ouvre, Aperçu marqué",
      sansBoutons && /\/accueil\/compte$/.test(apresCompte.hash) && apresCompte.compte && apresCompte.ici === "Profil" && r.suivi && r.ici === "Aperçu", JSON.stringify([sansBoutons, apresCompte, r]));
    const tailles = await page.evaluate(() => Array.from(document.querySelectorAll(".f-onglet")).map(x => Math.round(x.getBoundingClientRect().height)));
    ok("A6 : onglets à 44 px", tailles.length === 5 && tailles.every(h => h >= 44), JSON.stringify(tailles));
    const db3 = base(); avecTel(db3);
    const { page: p3 } = await contexte(b, COACH, db3);
    await ouvrir(p3, "programme", "[data-fiche-wa] a");
    const hw = await p3.evaluate(() => Math.round(document.querySelector("[data-fiche-wa] a").getBoundingClientRect().height));
    ok("A7 : le bouton WhatsApp de l'en-tête fait 44 px (ordinateur)", hw >= 44, String(hw));
  });

  /* =================== B. chaque ancienne adresse de la fiche : même page, bon onglet =================== */
  await bloc("B. anciennes adresses", async () => {
    for (const k of Object.keys(AVANT)) {
      const db = base();
      const { page, c } = await contexte(b, COACH, db);
      await page.goto(URL0 + "#/client/" + C1 + "/" + k); await pret(page); await attendre(page, 1800);
      const m = await marques(page), [co, t, ids] = AVANT[k];
      const ici = await page.evaluate(() => (document.querySelector('.fiche-onglets .f-onglet[aria-current="page"]') || {}).textContent || null);
      const attendu = co === "accueil" && k !== "accueil/compte" ? "Aperçu" : ONGLET[k];
      ok("B : #/client/…/" + k + " ouvre la même page qu'avant (" + co + ") dans l'onglet « " + attendu + " »", m.courant === co && JSON.stringify(m.titres) === JSON.stringify(t.filter(x => !/^Fiche (de|—)/.test(x))) && JSON.stringify(m.ids) === JSON.stringify(ids) && ici === attendu, JSON.stringify([m, ici]));
      await c.close(); ouverts.pop();
    }
  });

  /* =================== C. une écriture commencée ne part jamais chez un autre client =================== */
  await bloc("C. écritures et changement de fiche", async () => {
    const db = base({ donnees: [[C2, "programme", clone(F.donnees.find(x => x.user_id === C1 && x.outil === "programme").contenu)]] });
    const { page } = await contexte(b, COACH, db);
    await ouvrir(page, "programme", "#pg-publier");
    await page.fill('[data-f="series"][data-s="0"][data-e="0"]', "6");
    await page.click('.fiche-onglets .f-onglet[data-onglet-fiche="nutrition"]');
    await page.evaluate(h => { location.hash = h; }, "#/client/" + C2 + "/programme");
    await attendre(page, 2500);
    const B = (db.donnees.find(x => x.user_id === F.IDS.coach && x.outil === "brouillons_programme") || {}).contenu || { clients: {} };
    ok("C1 : saisie dans l'onglet Entraînement, puis onglet Nutrition et autre client dans la seconde : le brouillon est rangé pour le 1er client seulement ; rien chez l'autre",
      !!B.clients[C1] && B.clients[C1].programme.seances[0].exercices[0].series === "6" && !B.clients[C2] && db.ecritures.filter(e => e.table === "donnees" && e.user_id === C2).length === 0, JSON.stringify(Object.keys(B.clients)));
    /* une publication lente, puis changement d'onglet et de client pendant l'envoi */
    db.lentEcriture = { outil: "programme", ms: 2000 };
    await ouvrir(page, "programme", "#pg-publier");
    await page.click("#pg-publier"); await attendre(page, 400);
    await page.click('.fiche-onglets .f-onglet[data-onglet-fiche="suivi"]'); await attendre(page, 200);
    await page.evaluate(h => { location.hash = h; }, "#/client/" + C2 + "/programme");
    await attendre(page, 4000);
    const e1 = ecr(db, "programme", C1), e2 = ecr(db, "programme", C2), msg = await texte(page, "#pg-pub-msg");
    ok("C2 : « Publier » lent, puis onglet Suivi et autre client pendant l'envoi : le programme part chez le 1er client (6 séries), jamais chez l'autre ; aucun message « Publié » sur la page de l'autre",
      e1.length === 1 && e1[0].contenu.seances[0].exercices[0].series === "6" && e2.length === 0 && !/Publié/.test(msg || ""), JSON.stringify([e1.length, e2.length, msg]));
  });

  /* =================== D. « Pas de connexion » par onglet, lecture seule =================== */
  await bloc("D. pas de connexion et lecture seule", async () => {
    const db = base(); db.panneLecture = "programme";
    const { page } = await contexte(b, COACH, db);
    await ouvrir(page, "programme", ".fiche-onglets");
    const p = await horsLigne(page);
    await page.click('.fiche-onglets .f-onglet[data-onglet-fiche="nutrition"]'); await pret(page, "#nu-publier"); await attendre(page, 600);
    const nu = await page.evaluate(() => !!document.getElementById("nu-publier") && !document.getElementById("page-hors-ligne"));
    ok("D1 : son programme illisible : « Pas de connexion » + Réessayer dans l'onglet Entraînement ; l'onglet Nutrition s'ouvre normalement", !!p && p.reessayer && nu, JSON.stringify([p, nu]));
    const ls = [];
    for (const k of ["journal", "suivi", "mensurations", "profil", "formation"]) { await ouvrir(page, k, ".fiche-onglets"); ls.push(k + ":" + (await page.evaluate(() => document.getElementById("vue").classList.contains("lecture-seule")))); }
    ok("D2 : ce qui était en lecture seule le reste (Ses séances, Son suivi, Ses courbes, Son questionnaire, Sa formation)", ls.every(x => x.endsWith(":true")), JSON.stringify(ls));
  });

  /* =================== E. téléphone, anglais =================== */
  await bloc("E. téléphone et anglais", async () => {
    const db = base(); avecTel(db);
    const { page } = await contexte(b, COACH, db, { viewport: MOBILE });
    const deb = [];
    for (const k of ["accueil", "programme", "nutrition", "suivi"]) { await ouvrir(page, k, ".fiche-onglets"); deb.push(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)); }
    ok("E1 : téléphone (390 px) : la fiche ne déborde pas sur le côté (Aperçu, Entraînement, Nutrition, Suivi)", deb.every(x => !x), JSON.stringify(deb));
    const db2 = base(); avecPrefsEn(db2, F.IDS.coach);
    const { page: en } = await contexte(b, COACH, db2, { langue: "en" });
    await en.goto(URL0 + "#/client/" + C1 + "/programme"); await pret(en, ".fiche-onglets"); await attendre(en, 800);
    const o = await en.evaluate(() => Array.from(document.querySelectorAll("#vue > .fiche-entete .f-onglet")).map(a => a.textContent.trim()));
    ok("E2 : coach en anglais : Overview · Training · Nutrition · Follow-up · Profile", JSON.stringify(o) === JSON.stringify(["Overview", "Training", "Nutrition", "Follow-up", "Profile"]), JSON.stringify(o));
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
