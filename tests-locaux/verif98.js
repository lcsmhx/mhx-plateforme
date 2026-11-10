/* verif98 — v98 (chantier 3 de la nuit du 10/11/2026, plan-menu-coach : le menu du coach en 7 entrées), dans un vrai
   navigateur (Supabase simulé, gabarit de verif95 : coach et clients des fixtures, aucune donnée réelle).
   A. le menu du coach : 7 entrées dans l'ordre (ordinateur), Tableau · Clients · Prospects · Programmes · Plus (téléphone) ;
      la fiche d'un client et le menu d'un client ne changent pas ;
   B. Clients et Prospects ouvrent les vues d'avant (Vue tableau, Comptes, Vue détaillée, Exporter la newsletter), 44 px ;
   C. « Mes programmes » : Mes séances (l'atelier), Ma base (Modifier, Dupliquer), Ma bibliothèque ; rien d'écrit en parcourant ;
   D. chaque ancienne adresse du coach (27) ouvre la même page qu'avant : même outil, mêmes titres, mêmes éléments (relevé
      fait sur la v97 avec le même faux Supabase) — un test par adresse ;
   Z. aucune erreur de console ni erreur JS, aucun dialogue natif, aucun appel vers l'extérieur.
   Usage : node verif98.js ../index.html
           VERIF98_PORT=10105 node verif98.js ../index.html     (autre port, si 10104 est pris)
           VERIF98_BLOCS="A.,D." node verif98.js …               (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF98_PORT || 10104;
const BLOCS = (process.env.VERIF98_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
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
/* le lundi de cette semaine à midi : le relevé de « #/suivi » a été fait un lundi (formulaire du dimanche affiché, « en retard ») ;
   sans cela le test D échouerait du mardi au samedi */
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
/* ce que chaque adresse montrait avant la v98 (relevé sur la v97, même faux Supabase) : [outil, adresse, titres, identifiants] */
const AVANT = {"#/tableau": ["tableau", "#/tableau", ["Tableau de bord", "À traiter maintenant", "Nouveaux depuis ta dernière visite"], ["tb-vue", "tb-t-clients", "tb-t-traiter", "tb-t-prospects", "tb-a-traiter", "tb-nouveaux"]], "#/clients": ["clients", "#/clients", ["Clients"], ["lc-zone", "lc-clients", "lc-compte", "lc-q", "lc-liste"]], "#/prospects": ["prospects", "#/prospects", ["Prospects", "Nouveautés"], ["pr-vue", "lc-zone", "lc-prospects", "lc-compte", "lc-q", "lc-liste"]], "#/suivi-clients": ["suivi-clients", "#/suivi-clients", ["Suivi détaillé", "Suivi de mes clients"], ["alertes-clients", "tb-clients"]], "#/comptes": ["comptes", "#/comptes", ["Comptes", "Comptes"], ["liste-clients"]], "#/suivi-commercial": ["suivi-commercial", "#/suivi-commercial", ["Suivi commercial", "Mesure"], ["pr-vue", "pr-compteur", "pr-mesure", "pr-mesure-periode", "pr-mesure-chiffres", "pr-mesure-vide"]], "#/newsletter": ["newsletter", "#/newsletter", ["Newsletter", "Newsletter"], ["pr-vue", "pr-newsletter", "pr-nl", "pr-nl-n"]], "#/atelier": ["atelier", "#/atelier", ["L'atelier", "Le modèle"], ["at-vue", "at-nom", "at-lieu", "at-seances", "at-niveau", "at-objectif"]], "#/bibliotheque": ["bibliotheque", "#/bibliotheque", ["Ma bibliothèque", "Mes entraînements", "Mes journées types"], ["bib-entrainements", "bib-repas"]], "#/catalogue": ["catalogue", "#/catalogue", ["Le catalogue", "Ce que contient ton catalogue", "Recharger depuis le dépôt"], ["cat-compteurs", "cat-n-aliments", "cat-n-recettes", "cat-n-programmes", "cat-n-vegan", "cat-couverture"]], "#/entrainement": ["entrainement", "#/entrainement", ["Journal d'entraînement", "Tes exercices", "Historique"], ["tabs", "snom", "sdate", "k-vol", "k-set", "k-cmp"]], "#/profil": ["profil", "#/profil", ["Ton profil", "1 · Identité & logistique", "2 · Ton objectif"], ["q-nom", "q-age", "q-sexe", "q-ville", "q-fuseau", "q-email"]], "#/programme": ["programme", "#/programme", ["Le programme", "Les programmes de la formation", "Mes anciens programmes"], ["prog-vue", "pf-lien", "pf-lien-go", "prog-obj", "prog-jr", "prog-hist"]], "#/nutrition": ["nutrition", "#/nutrition", ["La journée type", "Mes anciennes diètes"], ["nu-vue", "nu-hist"]], "#/mensurations": ["mensurations", "#/mensurations", ["Ta progression", "Poids", "Nouvelle mesure"], ["mens-ajouter", "k-poids", "k-poids-d", "k-depart", "k-depart-d", "k-delta"]], "#/calculateur": ["calculateur", "#/calculateur", ["Calculateur métabolique", "Tes données", "Ta maintenance"], ["sexe", "age", "taille", "poids", "pas", "heures"]], "#/suivi": ["suivi", "#/suivi", ["Ton suivi", "Feedback de la semaine", "Ta régularité"], ["suivi-fb-haut", "suivi-checkin", "fbd-note-lbl", "fbd-training", "fbd-alimentation", "fbd-autre"]], "#/formation": ["formation", "#/formation", ["Formation", "Ton parcours", "Le processus, étape par étape"], ["fo-vue"]], "#/complements": ["complements", "#/complements", ["Les compléments"], ["cp-vue"]], "#/accueil": ["tableau", "#/tableau", ["Tableau de bord", "À traiter maintenant", "Nouveaux depuis ta dernière visite"], ["tb-vue", "tb-t-clients", "tb-t-traiter", "tb-t-prospects", "tb-a-traiter", "tb-nouveaux"]], "#/journal": ["tableau", "#/tableau", ["Tableau de bord", "À traiter maintenant", "Nouveaux depuis ta dernière visite"], ["tb-vue", "tb-t-clients", "tb-t-traiter", "tb-t-prospects", "tb-a-traiter", "tb-nouveaux"]], "#/bilan": ["bilan", "#/bilan", ["Ton bilan du mois"], ["bilan-vue"]], "#/clients/nouveau": ["clients", "#/clients/nouveau", ["Créer un accès"], ["acces-vue", "acces-fermer", "n-prenom", "n-nom", "n-email", "n-mdp"]], "#/prospects/nouveau": ["prospects", "#/prospects/nouveau", ["Créer un accès"], ["acces-vue", "acces-fermer", "n-prenom", "n-nom", "n-email", "n-mdp"]], "#/repas": ["nutrition", "#/repas", ["La journée type", "Mes anciennes diètes"], ["nu-vue", "nu-hist"]], "#/progression": ["mensurations", "#/progression", ["Ta progression", "Poids", "Nouvelle mesure"], ["mens-ajouter", "k-poids", "k-poids-d", "k-depart", "k-depart-d", "k-delta"]], "#/home": ["tableau", "#/tableau", ["Tableau de bord", "À traiter maintenant", "Nouveaux depuis ta dernière visite"], ["tb-vue", "tb-t-clients", "tb-t-traiter", "tb-t-prospects", "tb-a-traiter", "tb-nouveaux"]]};
const marques = page => page.evaluate(() => {
  const v = document.getElementById("vue") || document.body;
  const t = Array.from(v.querySelectorAll("h1, h2")).slice(0, 3).map(x => x.textContent.replace(/\s+/g, " ").trim());
  const ids = Array.from(v.querySelectorAll("[id]")).map(x => x.id).filter(x => !/^(etat|sortir-fiche|vues-clients|vues-prospects)$/.test(x)).slice(0, 6);
  return { courant: typeof courant !== "undefined" ? courant : null, hash: location.hash, titres: t, ids };
});
const navOrdi = page => page.evaluate(() => Array.from(document.querySelectorAll("#nav a")).map(a => a.textContent.replace(/\s+/g, " ").trim()));
const barre = page => page.evaluate(() => Array.from(document.querySelectorAll("#barre-bas a, #barre-bas button")).map(a => a.textContent.replace(/\s+/g, " ").trim()));
const volet = async page => { await page.click("#barre-bas [data-plus]"); await attendre(page, 500); const l = await page.evaluate(() => Array.from(document.querySelectorAll(".volet .menu-plus a")).map(a => a.textContent.replace(/\s+/g, " ").trim())); await page.keyboard.press("Escape"); await attendre(page, 300); return l; };

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF98_PORT=10105 node verif98.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. le menu du coach =================== */
  await bloc("A. menu du coach", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/tableau"); await pret(page, "#tb-vue");
    const n = await navOrdi(page);
    ok("A1 : ordinateur : 7 entrées, dans l'ordre : Tableau de bord · Clients · Prospects · Mes programmes · Catalogue · Mon entraînement · Réglages",
      JSON.stringify(n) === JSON.stringify(["Tableau de bord", "Clients", "Prospects", "Mes programmes", "Catalogue", "Mon entraînement", "Réglages"]), JSON.stringify(n));
    const { page: tel } = await contexte(b, COACH, db, { viewport: MOBILE });
    await tel.goto(URL0 + "#/tableau"); await pret(tel, "#tb-vue");
    const bb = await barre(tel), vl = await volet(tel);
    /* relecture : une page sortie du menu marque son entrée parente (jamais « Plus » vide) */
    await tel.goto(URL0 + "#/suivi-clients"); await pret(tel); await attendre(tel, 600);
    const marque = await tel.evaluate(() => ({ cur: (document.querySelector('#barre-bas a[aria-current="page"]') || {}).textContent || "", plus: document.querySelector("#barre-bas [data-plus]").classList.contains("ici") }));
    ok("A2b : téléphone, « Vue tableau » (#/suivi-clients) : « Clients » reste marqué, pas « Plus »", /Clients/.test(marque.cur) && !marque.plus, JSON.stringify(marque));
    ok("A2 : téléphone : barre du bas Tableau · Clients · Prospects · Programmes · Plus ; « Plus » : Catalogue, Mon entraînement, Réglages",
      JSON.stringify(bb) === JSON.stringify(["Tableau", "Clients", "Prospects", "Programmes", "Plus"]) && JSON.stringify(vl) === JSON.stringify(["Catalogue", "Mon entraînement", "Réglages"]), JSON.stringify([bb, vl]));
    /* le coach dans la fiche d'un client : la navigation de la fiche ne change pas (les onglets du client) */
    await page.goto(FICHE("programme")); await pret(page, "#pg-publier");
    const nf = await navOrdi(page);
    const coachF = ["Tableau de bord", "Clients", "Prospects", "Mes programmes", "Catalogue"];
    ok("A3 : dans la fiche d'un client : ses onglets d'abord (Son programme, Nutrition…), puis les entrées du coach (Tableau de bord, Clients, Prospects, Mes programmes, Catalogue), plus Suivi détaillé ni Bibliothèque",
      nf.includes("Son programme") && nf.includes("Nutrition") && JSON.stringify(nf.slice(-coachF.length)) === JSON.stringify(coachF) && !nf.includes("Suivi détaillé") && !nf.includes("Bibliothèque"), JSON.stringify(nf));
    /* un client : son menu ne change pas */
    const { page: cl } = await contexte(b, THOMAS, db);
    await cl.goto(URL0 + "#/accueil"); await pret(cl, ".masthead");
    const nc = await navOrdi(cl);
    ok("A4 : un client : son menu ne contient aucune entrée du coach (Clients, Prospects, Mes programmes, Réglages…) et garde Accueil, Mon programme, Nutrition",
      nc.includes("Accueil") && nc.includes("Mon programme") && nc.includes("Nutrition") && !nc.some(x => /^(Clients|Prospects|Mes programmes|Réglages|Catalogue|Tableau de bord)$/.test(x)), JSON.stringify(nc));
  });

  /* =================== B. Clients et Prospects : les vues d'avant =================== */
  await bloc("B. vues d'avant", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db);
    const suivre = async (depart, sel, attendu) => { await page.goto(URL0 + depart); await pret(page, sel); await page.click(sel); await attendre(page, 1500); return (await marques(page)).courant === attendu; };
    const r = [await suivre("#/clients", '#vues-clients a[href="#/suivi-clients"]', "suivi-clients"), await suivre("#/clients", '#vues-clients a[href="#/comptes"]', "comptes"),
               await suivre("#/prospects", '#vues-prospects a[href="#/suivi-commercial"]', "suivi-commercial"), await suivre("#/prospects", '#vues-prospects a[href="#/newsletter"]', "newsletter")];
    ok("B1 : Clients : « Vue tableau » ouvre Suivi détaillé, « Comptes » ouvre Comptes ; Prospects : « Vue détaillée » ouvre Suivi commercial, « Exporter la newsletter » ouvre Newsletter", r.every(Boolean), JSON.stringify(r));
    await page.goto(URL0 + "#/clients"); await pret(page, "#vues-clients .btn");
    const t = await page.evaluate(() => Array.from(document.querySelectorAll(".vues-coach .btn")).map(x => x.getBoundingClientRect().height));
    ok("B2 : ces boutons font au moins 44 px de haut", t.length > 0 && t.every(h => h >= 44), JSON.stringify(t));
  });

  /* =================== C. « Mes programmes » =================== */
  await bloc("C. mes programmes", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/mes-programmes"); await pret(page, "#at-vue #at-nom");
    const onglets = await page.evaluate(() => Array.from(document.querySelectorAll(".mp-onglets a")).map(a => a.textContent.trim()));
    ok("C1 : « Mes programmes » s'ouvre sur « Mes séances » (l'atelier) ; onglets Mes séances · Ma base · Ma bibliothèque",
      JSON.stringify(onglets) === JSON.stringify(["Mes séances", "Ma base", "Ma bibliothèque"]) && !!(await page.$("#at-vue #at-nom")), JSON.stringify(onglets));
    await page.click('.mp-onglets a[data-mp="base"]'); await pret(page, "[data-mp-prog]");
    const nb = await page.evaluate(() => document.querySelectorAll("[data-mp-prog]").length);
    ok("C2 : « Ma base » liste les programmes prêts à l'emploi (" + db.programmes.length + ")", nb === db.programmes.length && nb > 0, String(nb));
    const p0 = db.programmes[0];
    await page.click(`[data-mp-dupliquer="${p0.id}"]`); await pret(page, "#at-vue #at-nom"); await attendre(page, 1200);
    const nom = await page.inputValue("#at-nom");
    ok("C3 : « Dupliquer » reprend le programme dans « Mes séances » sous « … (copie) » (nouveau programme à l'enregistrement)", nom === p0.nom + " (copie)", nom);
    await page.goto(URL0 + "#/mes-programmes/base"); await pret(page, "[data-mp-prog]");
    await page.click(`[data-mp-modifier="${p0.id}"]`); await pret(page, "#at-vue #at-nom"); await attendre(page, 600);
    const m = await fenetre(page); if (m) await toucherFenetre(page, "Oui, remplacer"); await attendre(page, 900);
    const h = await page.evaluate(() => Array.from(document.querySelectorAll("[data-mp-prog] button")).map(x => x.getBoundingClientRect().height));
    ok("C4 : « Modifier » reprend le programme sous son nom (après « Remplacer ce que tu as commencé ? » si un brouillon est en cours)", (await page.inputValue("#at-nom")) === p0.nom, await page.inputValue("#at-nom"));
    await page.goto(URL0 + "#/mes-programmes/base"); await pret(page, "[data-mp-prog]");
    const hb = await page.evaluate(() => Array.from(document.querySelectorAll("[data-mp-prog] button")).map(x => x.getBoundingClientRect().height));
    ok("C4b : les boutons « Modifier » et « Dupliquer » de Ma base font 44 px", hb.length > 0 && hb.every(x => x >= 44), JSON.stringify(hb.slice(0, 4)));
    /* relecture : « Dupliquer » puis « Annuler » sur « Remplacer ce que tu as commencé ? » : le choix suivant n'est pas une copie */
    await page.click(`[data-mp-dupliquer="${p0.id}"]`); await pret(page, "#at-vue #at-nom"); await attendre(page, 800);
    if (await fenetre(page)) await toucherFenetre(page, "Annuler"); await attendre(page, 500);
    await page.selectOption("#at-charger", p0.id); await attendre(page, 500);
    if (await fenetre(page)) await toucherFenetre(page, "Oui, remplacer"); await attendre(page, 800);
    ok("C4c : « Dupliquer » annulé, puis le même programme repris : il garde son nom (pas « (copie) »)", (await page.inputValue("#at-nom")) === p0.nom, await page.inputValue("#at-nom"));
    await page.goto(URL0 + "#/mes-programmes/bibliotheque"); await pret(page, "#bib-entrainements .biblio-l");
    ok("C5 : « Ma bibliothèque » montre les entraînements et les journées types", !!(await page.$("#bib-entrainements .biblio-l")) && !!(await page.$("#bib-repas")), "");
    const ecr = db.ecritures.filter(e => e.table === "programmes_types" || e.table === "bibliotheque");
    ok("C6 : rien n'est écrit dans la base de programmes ni dans la bibliothèque en parcourant ces écrans", ecr.length === 0, JSON.stringify(ecr.map(e => e.table)));
  });

  /* =================== D. chaque ancienne adresse ouvre la même page qu'avant =================== */
  await bloc("D. anciennes adresses", async () => {
    for (const a of Object.keys(AVANT)) {
      const db = base();
      const { page, c } = await contexte(b, COACH, db, a === "#/suivi" ? { time: LUNDI0 } : {});
      await page.goto(URL0 + a); await pret(page); await attendre(page, 1800);
      const m = await marques(page), [co, h, t, ids] = AVANT[a];
      ok("D : " + a + " ouvre la même page qu'avant (" + co + " : « " + (t[0] || "") + " »)", m.courant === co && m.hash === h && JSON.stringify(m.titres) === JSON.stringify(t) && JSON.stringify(m.ids) === JSON.stringify(ids), JSON.stringify(m));
      await c.close(); ouverts.pop();
    }
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
