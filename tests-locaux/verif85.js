/* verif85 — v81 (bloc 2 de la mission du 13/10/2026) : le parcours du prospect en 11 écrans (js/parcours.js), de bout en bout
   dans un vrai navigateur, Supabase simulé, inscription OUVERTE et téléphone obligatoire ALLUMÉ (comme en ligne).
   A. parcours complet, 1 blocage (390 px) : progression 10 → 100 %, textes exacts de TEXTES.md, rien de pré-coché, un toucher
      = écran suivant (objectif, « Tu es ? »), chargement (4 coches puis seul à l'écran Compte), compte créé au toucher de
      « Débloquer mon espace » (corps de /signup : mêmes métadonnées qu'avant, newsletter 2026-10-13), clé contact une fois,
      puis « Ton espace » (pastilles, 5 cartes, « Bientôt » d'après CONFIG.parcours.disponibles), réponses rangées UNE fois
      dans intake au format de la v60 (+ sexe), aucune bannière d'installation, cadeau (texte avec le blocage, photo du
      coach, Calendly pré-rempli « cadeau »), clic noté (date) → l'accueil, sans carte cadeau ; le coach voit les réponses ;
   B. 2 blocages : la 3e case décoche la plus ancienne, réaction de la dernière cochée ; cadeau « a et b » ; « Plus tard »
      noté → l'accueil AVEC la carte « Ton cadeau t'attend », touchée : clic noté (accueil_cadeau), la carte s'en va (aussi
      après rechargement) ;
   C. texte libre seul : « Continuer » actif, chargement (40 caractères + « … »), intake (texte libre, sans clés), cadeau
      sans blocage ;
   D. retour arrière et rechargement : chaque bouton retour, réponses gardées, page rechargée = même écran, mot de passe
      jamais rangé (rechargée à l'écran WhatsApp : retour à l'écran Compte) ;
   E. erreurs : email invalide, mot de passe court, case des conditions, numéro invalide (rien d'envoyé), email déjà utilisé
      (retour à l'écran Compte, « Se connecter » → connexion, email déjà tapé), réseau coupé ;
   F. compte à rebours (heure de Paris) : 14/11, 15/11, 16/11, minuit de Paris, changement d'heure du 25/10 ; à l'écran ;
   G. comptes existants inchangés : client, coach, prospect d'avant (sans carte cadeau, page « Ton plan d'action » et ancien
      questionnaire toujours là), connexion d'un appareil déjà venu ;
   H. largeurs 360, 390 et 430 px : chaque écran sans débordement, boutons d'au moins 44 px, bouton du bas visible ;
   I. anglais : textes exacts, aucun mot français ; J. moins de mouvement : animation immobile (1re scène) ;
   W. moteur WebKit (Safari) : le parcours jusqu'à « Ton espace » (si WebKit est installé : banc GitHub ; VERIF85_WEBKIT=0
      pour s'en passer en local — le nombre de ✓ change alors).
   Comptes fictifs (@exemple.fr), numéros de la plage réservée à la fiction (06 39 98 …). Aucun vrai compte créé.
   Usage : node verif85.js ../index.html
           VERIF85_PORT=10011 node verif85.js ../index.html     (autre port, si 10010 est pris)
           VERIF85_BLOCS="A,F" node verif85.js …                 (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const FT = require("./fichiers");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF85_PORT || 10010;
const BLOCS = (process.env.VERIF85_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const MOBILE = { width: 390, height: 844 }, ETROIT = { width: 360, height: 740 }, GRAND = { width: 430, height: 932 }, LARGE = { width: 1280, height: 900 };

/* ---------- la page servie : inscription ouverte, téléphone obligatoire allumé, textes légaux de test ---------- */
let telephone = true;
const retouche = h => FT.forcerLegaux(FT.forcerTelephone(FT.forcerInscription(h, true), telephone));
const server = http.createServer((req, res) => {
  if (FT.servirFichier(req, res, HTML, retouche)) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(retouche(fs.readFileSync(HTML, "utf8")));
});
async function avecTelephone(v, fn){ const a = telephone; telephone = v; try { await fn(); } finally { telephone = a; } }

/* ---------- résultats ---------- */
const res = [];
const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
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

/* ---------- dates, petites aides ---------- */
const T0 = Date.now(), H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const norm = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const isoPres = (x, t) => typeof x === "string" && !isNaN(Date.parse(x)) && new Date(x).toISOString() === x && Math.abs(Date.parse(x) - t) < 20000;

/* ---------- les personnes ---------- */
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: meta } : {}) });
const PID = k => "00000000-0000-4000-8000-0000000085" + String(k).padStart(2, "0");   // verif85 : …85kk
const COACH = { id: F.IDS.coach, email: "coach@exemple.fr" }, THOMAS = { id: F.IDS.c1, email: "thomas@exemple.fr" };
const INES = { id: PID(1), email: "ines@exemple.fr" }, NOAH = { id: PID(2), email: "noah@exemple.fr" }, MAEL = { id: PID(3), email: "mael@exemple.fr" };
const TEL_NOAH = "+33639980002", TEL_THOMAS = "+33639980001";

/* ---------- le décor : fixtures.js (coach, clients) + 3 prospects ; extra : lignes en plus ---------- */
function base(extra){
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  profils.push({ id: INES.id, prenom: "Inès", nom: "Morel", role: "client", statut: "prospect", cree_le: avant(3 * J) });
  profils.push({ id: NOAH.id, prenom: "Noah", nom: "Petit", role: "client", statut: "prospect", cree_le: avant(2 * J) });
  profils.push({ id: MAEL.id, prenom: "Maël", nom: "Roux", role: "client", statut: "prospect", cree_le: avant(1 * J) });
  const donnees = clone(F.donnees).concat([
    { user_id: NOAH.id, outil: "contact", contenu: { telephone: TEL_NOAH, ref: "insta", inscrit_le: avant(2 * J) }, maj_le: avant(2 * J) },
    /* v72 (C) : Noah a répondu à ses 3 questions et choisi « Plus tard » : son accueil montre la carte de l'accompagnement */
    { user_id: NOAH.id, outil: "intake", contenu: { court_debut: avant(2 * J), court_le: avant(2 * J), probleme: "Perdre du ventre", obstacle: "Le manque de temps",
      projection: "Avoir plus d'énergie", bilan_propose: { choix: "plus_tard", le: avant(2 * J) } }, maj_le: avant(2 * J) },
    { user_id: INES.id, outil: "contact", contenu: { telephone: "+33639980003" }, maj_le: avant(3 * J) },
    { user_id: F.IDS.c1, outil: "contact", contenu: { telephone: TEL_THOMAS }, maj_le: avant(30 * J) },
    { user_id: MAEL.id, outil: "contact", contenu: { telephone: "+33639980004" }, maj_le: avant(1 * J) }
  ], extra || []);
  return { profils, donnees, ecritures: [], lectures: [], chemins: [], inscriptions: [], emails: {}, meta: {}, inscription: {}, ko: {}, perdre: {} };
}

/* ---------- le faux Supabase (gabarit de verif70) ---------- */
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
  if (o.startsWith("not.in.")) { const k = liste(o.slice(7)); return l.filter(x => !k.includes(x.outil)); }
  return l;
}
const colonnes = (l, q) => { const sel = (q.get("select") || "*").split(","); return sel.includes("*") ? l : l.map(x => Object.fromEntries(sel.map(k => [k, x[k]]))); };
const appelant = req => { const m = /^Bearer (?:jeton-)([0-9a-f-]{36})/.exec(req.headers()["authorization"] || ""); return m ? m[1] : null; };
async function repondre(r, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue();
  if (host === "calendly.com") { db.calendly = (db.calendly || []).concat(u); return r.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>Calendly</title>" }).catch(() => {}); }
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort(); }
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req);
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  db.chemins.push(m + " " + p);
  if (p.startsWith("/auth/v1/signup")) {   // déclencheur creer_profil : un profil prospect ; la session porte data en user_metadata
    const c = corps() || {}, data = c.data || {}; db.inscriptions.push(clone(c));
    if (db.inscription.coupure) return r.abort("failed");   // réseau coupé
    if (db.inscription.erreur) return json(db.inscription.erreur.corps, db.inscription.erreur.statut);   // refus du serveur
    const id = db.inscription.id || PID(99); db.emails[id] = c.email; db.meta[id] = clone(data);
    db.profils.push({ id, prenom: data.prenom || "", nom: data.nom || "", role: "client", statut: "prospect", cree_le: new Date().toISOString() });
    return json(session(id, c.email, data));
  }
  if (p.startsWith("/auth/v1/token")) {
    const c = corps() || {}, r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || ""));
    if (c.email && c.password){ const idm = Object.keys(db.emails).find(k => db.emails[k] === c.email); return idm ? json(session(idm, c.email, db.meta[idm])) : json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400); }   // connexion par mot de passe
    const id = r1 && r1[1];
    if (!id) return json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
    return json(session(id, db.emails[id] || "", db.meta[id]));
  }
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  if (p.startsWith("/auth/v1/logout")) return json(null, 204);
  if (p.startsWith("/auth/v1/user")) return moi ? json(Object.assign({ id: moi, email: db.emails[moi] || "", role: "authenticated" }, db.meta[moi] ? { user_metadata: clone(db.meta[moi]) } : {})) : json({ msg: "invalid JWT" }, 401);
  if (p.startsWith("/auth/v1/")) return json({});
  if (!["GET", "HEAD"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m, corps: corps() });
  if (p.startsWith("/functions/v1/")) return json({ ok: true });
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/connexions") return json([]);
  if (p === "/rest/v1/profils") {
    const id = (q.get("id") || "").replace(/^eq\./, "");
    if (m === "GET" || m === "HEAD") { let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(colonnes(plage(l), q)); }
    db.ecritures.push({ table: "profils", m, id, corps: corps() });
    return json([]);
  }
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "", mj = q.get("maj_le");
    const cleEq = o.startsWith("eq.") ? o.slice(3) : null;
    if (m === "GET" || m === "HEAD") {
      db.lectures.push({ par: moi, uid, outil: o, select: q.get("select") || "*" });
      if (cleEq && db.ko[cleEq]) return json({ message: "panne simulée" }, 500);
      let l = db.donnees.filter(x => coach || (x.user_id === moi && !ILLISIBLES_PROPRIO.includes(x.outil)));
      if (uid) l = l.filter(x => x.user_id === uid);
      return json(colonnes(plage(parOutil(l, o)), q));
    }
    if (m === "POST") {
      let rows = corps(); rows = Array.isArray(rows) ? rows : rows ? [rows] : [];
      const refuse = rows.find(row => !permis(moi, coach, row));
      if (refuse) { db.ecritures.push({ table: "donnees", m, refus: true, outil: refuse.outil, user_id: refuse.user_id }); return json({ code: "42501", message: 'new row violates row-level security policy for table "donnees"' }, 403); }
      if (rows.some(x => db.perdre[x.outil] > 0)) { rows.forEach(x => { if (db.perdre[x.outil] > 0) db.perdre[x.outil]--; }); db.ecritures.push({ table: "donnees", m, perdue: true, outil: rows[0].outil }); return r.abort("failed"); }
      const upsert = q.has("on_conflict"), out = [];
      for (const row of rows) {
        const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
        if (i > -1 && !upsert) return json({ code: "23505", message: "duplicate key value violates unique constraint" }, 409);
        const ligne = { user_id: row.user_id, outil: row.outil, contenu: clone(row.contenu), maj_le: row.maj_le || new Date().toISOString() };
        if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        db.ecritures.push(Object.assign({ table: "donnees", m }, clone(ligne)));
        out.push(ligne);
      }
      return (req.headers()["prefer"] || "").includes("return=representation") ? json(out, 201) : json(null, 201);
    }
    if (m === "PATCH") {
      const c = corps() || {};
      const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj == null || (mj === "is.null" ? !x.maj_le : (mj.startsWith("eq.") && x.maj_le === mj.slice(3)))));
      if (!row || !permis(moi, coach, row)) return json([]);
      Object.assign(row, { contenu: clone(c.contenu), maj_le: c.maj_le || new Date().toISOString() });
      db.ecritures.push(Object.assign({ table: "donnees", m }, clone(row)));
      return json([row]);
    }
    db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq });
    return json(null, 204);
  }
  if (p === "/rest/v1/bibliotheque") return m === "GET" ? json(coach ? colonnes(plage(clone(F.bibliotheque)), q) : []) : json(null, 204);
  const t = p.replace("/rest/v1/", "");
  if (F.catalogue[t]) return m === "GET" ? json(colonnes(plage(F.catalogue[t]), q)) : json(null, 201);
  return json([]);
}

/* ---------- un navigateur (contexte) ----------
   opts : viewport (MOBILE par défaut), langue ("en"), qui (compte connecté : { id, email }), stockage ({ clé: valeur }),
   neuf (appareil sans aucune trace : ni mhx_installe ni mhx_visites), autonome (app lancée depuis l'écran d'accueil) */
async function contexte(b, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || MOBILE, reducedMotion: opts.mouvement === false ? "reduce" : "no-preference" });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, db));
  if (opts.qui) db.emails[opts.qui.id] = opts.qui.email;
  await c.addInitScript(({ langue, s, stockage, neuf, autonome }) => {
    if (!/^https?:$/.test(location.protocol)) return;
    if (autonome) Object.defineProperty(navigator, "standalone", { get: () => true });
    if (!localStorage.getItem("__init")) {   // l'appareil n'est préparé qu'une fois : un rechargement le garde
      localStorage.setItem("__init", "1");
      if (!neuf){ localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); }
      if (langue) localStorage.setItem("mhx_langue", langue);
      if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
      Object.keys(stockage || {}).forEach(k => localStorage.setItem(k, stockage[k]));
    }
  }, { langue: opts.langue || "", s: opts.qui ? session(opts.qui.id, opts.qui.email) : null, stockage: opts.stockage || null, neuf: !!opts.neuf, autonome: !!opts.autonome });
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("popup", p => { db.onglets = (db.onglets || 0) + 1; p.close().catch(() => {}); });   // le lien Calendly (nouvel onglet)
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return { c, page };
}
const attendre = (page, ms) => page.waitForTimeout(ms);
const pret = async page => { await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 }); await attendre(page, 400); };
/* ======================================================================================================================
   v81 — le parcours : aides, textes attendus (docs/maj-blocs-1-2/TEXTES.md, mot pour mot)
   ====================================================================================================================== */
const URL0 = "http://localhost:" + PORT + "/";
const CAL = "https://calendly.com/mhx-coaching/ton-plan-d-action-offert-15-min-avec-lucas";
const UID_NOUVEAU = PID(50);
const etape = page => page.$eval("#pc", e => e.dataset.etape).catch(() => "");
const progres = page => page.$eval(".pc-progres", e => e.getAttribute("aria-valuenow")).catch(() => null);
const txt = (page, sel) => page.$eval(sel, e => e.textContent).then(norm).catch(() => null);
/* vu = le texte tel qu'il s'affiche (innerText : titre et sous-titre d'une carte séparés) ; sinon textContent */
const txts = (page, sel, vu) => page.$$eval(sel, (l, vu) => l.map(e => vu ? e.innerText : e.textContent), !!vu).then(l => l.map(norm)).catch(() => []);
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.table === "donnees" && e.outil === outil && !e.refus && !e.perdue && (!uid || e.user_id === uid));
const resume = db => JSON.stringify(db.ecritures.map(e => (e.table === "donnees" ? e.outil : e.table) + ":" + e.m));
const ligne0 = (db, uid, outil) => db.donnees.find(d => d.user_id === uid && d.outil === outil) || null;
const coches = page => page.$$eval(".pc-opt", l => l.filter(b => b.getAttribute("aria-checked") === "true").map(b => b.dataset.k)).catch(() => []);
const inactif = (page, sel) => page.$eval(sel, b => b.getAttribute("aria-disabled") === "true").catch(() => null);
const sur = async (page, e, ms) => { await page.waitForSelector('#pc[data-etape="' + e + '"]', { timeout: ms || 8000 }); await attendre(page, 120); };
const deborde = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
const stock = page => page.evaluate(() => { try { return sessionStorage.getItem("mhx_parcours") || ""; } catch(e){ return "!"; } });
const intakeDe = (db, uid) => (ligne0(db, uid, "intake") || {}).contenu || null;
const challengeDe = (db, uid) => (ligne0(db, uid, "challenge") || {}).contenu || null;
/* un appareil neuf, sans session : le parcours s'ouvre à l'adresse vide */
async function neuf(b, db, opts){ const x = await contexte(b, db, Object.assign({ neuf: true }, opts || {})); await x.page.goto(URL0); await x.page.waitForSelector("#pc", { timeout: 10000 }); return x; }
const TX = {
  accueil: { titre: "Combien de lundis tu as dit « je commence » ?", sous: "Séances prêtes, journal alimentaire, recettes, suivi. Gratuit à vie pour les inscrits.",
    bouton: "Créer mon espace gratuit", connexion: "Déjà un compte ? Se connecter",
    scenes: ["Journal alimentaire", "Programmes homme ou femme Bientôt", "Recettes Bientôt", "Calculateur de calories", "Suivi de tes progrès"] },
  objectif: { titre: "Ton objectif ?", options: ["Perdre du gras Affiner ma silhouette", "Prendre du muscle Me dessiner et gagner en force", "Me remettre en forme Retrouver de l’énergie et une routine"], bas: "Ça prend 1 minute." },
  coince: { titre: "Jusqu’ici, qu’est-ce qui a coincé ?", sous: "Jusqu’à 2 réponses.",
    options: ["Le manque de temps", "Je craque sur la nourriture", "Je ne sais pas quoi faire exactement", "La motivation retombe vite", "J’ai déjà tout essayé, rien ne dure", "Personne pour me suivre et me recadrer"],
    reactions: { temps: "On y a pensé. Ton programme avance par petites étapes, faciles à glisser dans une journée chargée.",
      craquages: "Ça arrive, et ce n’est pas un manque de volonté. On commence par des bases simples pour reprendre la main.",
      quoi_faire: "Justement, c’est le rôle de ton programme : tu sauras quoi faire, et dans quel ordre.",
      motivation: "Normal. Tu avances par petites étapes, pas besoin d’avoir la motivation tous les jours.",
      suivi: "Ici, tu as du soutien : ton coach est là pour faire le point avec toi et t’aider à tenir le cap." },
    autre: "Autre chose ? Dis-le avec tes mots", exemple: "Écris-le ici, en quelques mots", bouton: "Continuer" },
  projection: { titre: "Dans 3 mois, qu’est-ce qui changerait tout pour toi ?",
    options: ["Rentrer à nouveau dans mes vêtements préférés", "M’aimer sur les photos", "Avoir de l’énergie toute la journée", "Tenir une routine sans me forcer", "Retrouver confiance en moi"],
    energie: "L’énergie, ça se travaille. On commence par les bases qui comptent le plus." },
  sexe: { titre: "Tu es ?", sous: "Pour te proposer le bon programme.", options: ["Un homme", "Une femme"] },
  prenom: { titre: "On t’appelle comment ?", etiquette: "Ton prénom" },
  compte: { titre: "Ton espace est prêt 🔒", sous: "Crée ton compte pour le débloquer et le garder.", email: "Email", mdp: "Mot de passe (8 caractères minimum)",
    cgu: "J'ai 18 ans ou plus et j'accepte les CGU et la politique de confidentialité.", newsletter: "Je veux recevoir les conseils et les offres de MHX Coaching par email." },
  whatsapp: { surtitre: "Ton espace est prêt 🔒", titre: "Ton numéro WhatsApp ?", etiquette: "Ton numéro (WhatsApp)",
    aide: "Ton coach s’en sert pour t’appeler ou t’écrire sur WhatsApp. Jamais revendu.",
    note: "L’app ne remplace pas un avis médical. Si tu as un doute sur ta santé, parles-en à un professionnel avant de commencer.", bouton: "Débloquer mon espace",
    pays: ["France (+33)", "Belgique (+32)", "Suisse (+41)", "Luxembourg (+352)", "Canada (+1)", "La Réunion (+262)", "Guadeloupe (+590)", "Martinique (+596)", "Guyane (+594)",
      "Côte d'Ivoire (+225)", "Sénégal (+221)", "Maroc (+212)", "Algérie (+213)", "Tunisie (+216)", "Cameroun (+237)", "Australie (+61)", "Autre (indicatif à saisir)"] },
  espace: { cartes: ["Ton programme Bientôt Des séances toutes prêtes, avec la vidéo de chaque exercice.", "Ton journal alimentaire Note tes repas et suis ta journée.",
    "Tes recettes Bientôt Des recettes simples pour manger mieux.", "Ton calculateur Combien manger pour ton objectif.", "Ton suivi Poids et mensurations, pour voir ce qui bouge."],
    verrou: "🔒 Après ton bilan : ton programme sur mesure, avec ton coach.", bouton: "Entrer dans mon espace" },
  cadeau: { surtitre: "🎁 Cadeau de bienvenue", titre: "Ton plan d’action sur mesure, offert", reperes: ["15 min", "par téléphone", "sans engagement"], coach: "Ton coach",
    bouton: "Je réserve mon créneau offert", plus_tard: "Plus tard" },
  carte: { titre: "🎁 Ton cadeau t’attend", texte: "15 min avec ton coach pour construire ton plan d’action.", bouton: "Je réserve mon créneau offert" },
  erreurs: { email: "Vérifie ton email.", mdp: "8 caractères minimum.", pris: "Cet email a déjà un compte. Se connecter", tel: "Vérifie ton numéro.", reseau: "Pas de connexion. Réessaie dans un instant." }
};
const REBOURS = /^La bêta ferme le 15 novembre · (plus que \d+ jours|plus qu’un jour|dernier jour)$/;
const ISO = x => typeof x === "string" && !isNaN(Date.parse(x)) && new Date(x).toISOString() === x;
/* captures des écrans (VERIF85_CAPTURES=<dossier>), sinon rien */
const CAPT = process.env.VERIF85_CAPTURES || "";
const capture = async (page, nom) => { if (!CAPT) return; try { fs.mkdirSync(CAPT, { recursive: true }); await attendre(page, 350); await page.screenshot({ path: path.join(CAPT, nom + ".png"), fullPage: true }); } catch (e) {} };
/* un écran : ses textes principaux */
const ecran = page => page.evaluate(() => {
  const n = s => String(s || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
  const t = s => { const e = document.querySelector(s); return e ? n(e.textContent) : null; };
  return { etape: (document.getElementById("pc") || {}).dataset ? document.getElementById("pc").dataset.etape : null, h1: t("#pc h1"), sous: t(".pc-sous-titre"), surtitre: t(".pc-surtitre"),
    progres: (document.querySelector(".pc-progres") || { getAttribute(){ return null; } }).getAttribute("aria-valuenow"), retour: !!document.querySelector(".pc-retour"),
    nav: !!document.querySelector(".topbar, #barre-bas, nav.nav"), installe: !!document.getElementById("installe") };
});

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris : VERIF85_PORT=10011 node verif85.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. parcours complet, 1 blocage =================== */
  await bloc("A. parcours complet, 1 blocage (390 px)", async () => {
    const db = base(); db.inscription.id = UID_NOUVEAU;
    const { page } = await neuf(b, db);
    await capture(page, "parcours-01-accueil");
    const e0 = await ecran(page);
    const sc = await txts(page, ".pc-et"), bientot = await page.$$eval(".pc-et", l => l.map(e => !!e.querySelector(".pc-bientot")));
    const reb = await txt(page, "#pc-rebours");
    ok("A1 : accueil (appareil neuf, adresse vide) : sans barre de progression ; titre, sous-titre, bouton, « Déjà un compte ? Se connecter » exacts ; compte à rebours ; 5 scènes dans l'ordre, « Bientôt » sur les programmes et les recettes seulement ; aucune navigation de l'app",
      e0.etape === "accueil" && e0.progres === null && e0.h1 === TX.accueil.titre && (await txt(page, ".pc-sous")) === TX.accueil.sous && (await txt(page, "#pc-go")) === TX.accueil.bouton
      && (await txt(page, "#pc-connexion")) === TX.accueil.connexion && REBOURS.test(reb || "") && JSON.stringify(sc) === JSON.stringify(TX.accueil.scenes) && JSON.stringify(bientot) === "[false,true,true,false,false]" && !e0.nav,
      JSON.stringify([e0, reb, sc, bientot]));
    await page.click("#pc-go"); await sur(page, "objectif");
    await capture(page, "parcours-02-objectif");
    const e1 = await ecran(page), o1 = await txts(page, ".pc-carte-choix", true);
    ok("A2 : objectif (10 %) : « Ton objectif ? », les 3 choix (titre + sous-titre), « Ça prend 1 minute. », bouton retour", e1.progres === "10" && e1.h1 === TX.objectif.titre && JSON.stringify(o1) === JSON.stringify(TX.objectif.options) && (await txt(page, ".pc-bas")) === TX.objectif.bas && e1.retour, JSON.stringify([e1, o1]));
    await page.click('[data-objectif="Perdre du gras"]'); await sur(page, "coince");
    await capture(page, "parcours-03-coince");
    const e2 = await ecran(page), o2 = await txts(page, ".pc-opt");
    ok("A3 : un toucher sur « Perdre du gras » = écran suivant (20 %) : titre, « Jusqu’à 2 réponses. », 6 cases, rien de coché, pas de réaction, « Continuer » inactif",
      e2.progres === "20" && e2.h1 === TX.coince.titre && e2.sous === TX.coince.sous && JSON.stringify(o2) === JSON.stringify(TX.coince.options) && !(await coches(page)).length && (await page.isHidden("#pc-reaction")) && (await inactif(page, "#pc-suivant")) === true,
      JSON.stringify([e2, o2, await coches(page)]));
    await page.click('.pc-opt[data-k="temps"]');
    await capture(page, "parcours-04-coince-1-reponse");
    ok("A4 : « Le manque de temps » cochée : sa réaction exacte s'affiche, « Continuer » actif", JSON.stringify(await coches(page)) === '["temps"]' && (await txt(page, "#pc-reaction")) === TX.coince.reactions.temps && (await inactif(page, "#pc-suivant")) === false, await txt(page, "#pc-reaction"));
    await page.click("#pc-suivant"); await sur(page, "projection");
    await capture(page, "parcours-05-projection");
    const e3 = await ecran(page), o3 = await txts(page, ".pc-opt"), av = await coches(page), b3 = await inactif(page, "#pc-suivant");
    await page.click('.pc-opt[data-k="energie"]');
    ok("A5 : dans 3 mois (30 %) : titre, 5 réponses, rien de pré-coché, « Continuer » inactif ; « Avoir de l’énergie toute la journée » touchée : cochée seule, sa réaction, « Continuer » actif",
      e3.progres === "30" && e3.h1 === TX.projection.titre && JSON.stringify(o3) === JSON.stringify(TX.projection.options) && !av.length && b3 === true && JSON.stringify(await coches(page)) === '["energie"]' && (await txt(page, "#pc-reaction")) === TX.projection.energie && (await inactif(page, "#pc-suivant")) === false,
      JSON.stringify([e3, o3, av, b3]));
    await page.click("#pc-suivant"); await sur(page, "sexe");
    await capture(page, "parcours-06-sexe");
    const e4 = await ecran(page), o4 = await txts(page, ".pc-carte-choix", true);
    await page.click('[data-sexe="Femme"]'); await sur(page, "prenom");
    await capture(page, "parcours-07-prenom");
    const e5 = await ecran(page), b5 = await inactif(page, "#pc-suivant");
    await page.fill("#pc-prenom", "Zoé");
    ok("A6 : « Tu es ? » (40 %) : sous-titre, « Un homme » / « Une femme » ; un toucher = écran suivant ; prénom (50 %) : « On t’appelle comment ? », « Ton prénom », « Continuer » inactif tant que le champ est vide",
      e4.progres === "40" && e4.h1 === TX.sexe.titre && e4.sous === TX.sexe.sous && JSON.stringify(o4) === JSON.stringify(TX.sexe.options) && e5.progres === "50" && e5.h1 === TX.prenom.titre && (await txt(page, 'label[for="pc-prenom"]')) === TX.prenom.etiquette && b5 === true && (await inactif(page, "#pc-suivant")) === false,
      JSON.stringify([e4, o4, e5, b5]));
    await page.click("#pc-suivant"); await sur(page, "chargement");
    const t0 = Date.now(), e6 = await ecran(page);
    const lignes = await page.$$eval(".pc-coche-ligne", l => l.map(x => [x.querySelector("small").textContent, x.querySelector("b").textContent, getComputedStyle(x.querySelector(".pc-coche > span")).animationDelay]));
    ok("A7 : chargement (60 %) : « Zoé, on prépare ton espace… », sans bouton retour ; les 4 lignes exactes (objectif, ce qui a coincé, dans 3 mois, profil), coches à 0,6 / 1,4 / 2,2 / 3 s",
      e6.progres === "60" && e6.h1 === "Zoé, on prépare ton espace…" && !e6.retour && JSON.stringify(lignes.map(l => [norm(l[0]), norm(l[1]), l[2]])) === JSON.stringify([["Ton objectif", "Perdre du gras", "0.6s"], ["Ce qui a coincé", "Le manque de temps", "1.4s"], ["Dans 3 mois", "Avoir de l’énergie toute la journée", "2.2s"], ["Ton profil", "Une femme", "3s"]]) && (await txt(page, "#pc-suite")) === "Suite →",
      JSON.stringify([e6, lignes]));
    if (CAPT) { await attendre(page, Math.max(0, 2300 - (Date.now() - t0))); await page.screenshot({ path: path.join(CAPT, "parcours-08-chargement.png") }).catch(() => {}); }
    await attendre(page, Math.max(0, 3050 - (Date.now() - t0)));
    const encore = await etape(page);
    await sur(page, "compte", 3000); const duree = Date.now() - t0;
    ok("A8 : sans rien toucher, encore là à 3 s, puis seul à l'écran Compte juste après la dernière coche (" + duree + " ms)", encore === "chargement" && duree < 4800, encore + " " + duree);
    await capture(page, "parcours-09-compte");
    const e7 = await ecran(page);
    const c7 = { email: await txt(page, 'label[for="c-email"]'), mdp: await txt(page, 'label[for="c-mdp"]'), ex: await page.getAttribute("#c-email", "placeholder"),
      cgu: await txt(page, ".co-cgu span"), nl: await txt(page, ".co-newsletter span"), coches: await page.$$eval(".pc-case input", l => l.map(i => i.checked)), b: await inactif(page, "#pc-suivant") };
    await page.fill("#c-email", "zoe@exemple.fr"); await page.fill("#c-mdp", "motdepasse1"); const b7a = await inactif(page, "#pc-suivant");
    await page.check("#c-cgu");
    ok("A9 : compte (70 %) : « Ton espace est prêt 🔒 », sous-titre, « Email » (exemple « ton@email.com »), « Mot de passe (8 caractères minimum) », case des conditions et case newsletter (nom de la marque) décochées ; « Continuer » actif seulement avec email valide + 8 caractères + case des conditions",
      e7.progres === "70" && e7.h1 === TX.compte.titre && e7.sous === TX.compte.sous && c7.email === TX.compte.email && c7.mdp === TX.compte.mdp && c7.ex === "ton@email.com" && c7.cgu === TX.compte.cgu && c7.nl === TX.compte.newsletter
      && JSON.stringify(c7.coches) === "[false,false]" && c7.b === true && b7a === true && (await inactif(page, "#pc-suivant")) === false, JSON.stringify([e7, c7, b7a]));
    await page.click("#pc-suivant"); await sur(page, "whatsapp");
    await capture(page, "parcours-10-whatsapp");
    const e8 = await ecran(page), pays = await page.$$eval("#c-tel-ind option", l => l.map(o => o.textContent)), choisi = await page.$eval("#c-tel-ind", s => s.value);
    ok("A10 : WhatsApp (80 %) : sur-titre, « Ton numéro WhatsApp ? », « Ton numéro (WhatsApp) », aide, avertissement médical, « Débloquer mon espace » ; les pays de TEXTES.md dans l'ordre, France par défaut, « Autre (indicatif à saisir) » ; aucune inscription envoyée avant le toucher",
      e8.progres === "80" && e8.surtitre === TX.whatsapp.surtitre && e8.h1 === TX.whatsapp.titre && (await txt(page, 'label[for="c-tel"]')) === TX.whatsapp.etiquette && (await txt(page, ".pc-aide")) === TX.whatsapp.aide && (await txt(page, ".pc-note")) === TX.whatsapp.note && (await txt(page, "#c-go")) === TX.whatsapp.bouton
      && JSON.stringify(pays.map(norm)) === JSON.stringify(TX.whatsapp.pays) && choisi === "33" && db.inscriptions.length === 0, JSON.stringify([e8, pays, choisi, db.inscriptions.length]));
    await page.fill("#c-tel", "06 39 98 00 99"); const tClic = Date.now();
    await page.click("#c-go");
    await sur(page, "espace", 12000);
    const ins = db.inscriptions[0] || {}, d = ins.data || {}, contact = ecr(db, "contact", UID_NOUVEAU);
    ok("A11 : « Débloquer mon espace » : le compte est créé (un seul /signup : email, mot de passe, data { prenom « Zoé », nom vide, consentement daté, conditions_version, newsletter null, newsletter_version 2026-10-13 }) ; clé contact écrite UNE fois { telephone +33639980099, inscrit_le }",
      db.inscriptions.length === 1 && ins.email === "zoe@exemple.fr" && ins.password === "motdepasse1" && JSON.stringify(Object.keys(d)) === JSON.stringify(["prenom", "nom", "consentement", "conditions_version", "newsletter", "newsletter_version"])
      && d.prenom === "Zoé" && d.nom === "" && ISO(d.consentement) && Math.abs(Date.parse(d.consentement) - tClic) < 20000 && d.conditions_version === FT.LEGAUX_TEST.cgu_version && d.newsletter === null && d.newsletter_version === "2026-10-13"
      && contact.length === 1 && contact[0].contenu.telephone === "+33639980099" && ISO(contact[0].contenu.inscrit_le), JSON.stringify([db.inscriptions, contact]).slice(0, 600));
    await capture(page, "parcours-11-ton-espace");
    const e9 = await ecran(page), pas = await txts(page, ".pc-pastilles-espace .pastille"), cartes = await txts(page, ".pc-fonction", true), bt = await page.$$eval(".pc-fonction", l => l.filter(x => x.querySelector(".pc-bientot")).map(x => x.dataset.fonction));
    ok("A12 : après la création (page rechargée, session ouverte) : « Ton espace » (90 %) : « Zoé, voici ce qui t’attend dans ton espace. », pastilles « Objectif : perdre du gras » et « Profil : femme », les 5 cartes exactes, « Bientôt » sur le programme et les recettes, carte « Après ton bilan » ; ni navigation, ni bannière d'installation",
      e9.progres === "90" && e9.h1 === "Zoé, voici ce qui t’attend dans ton espace." && JSON.stringify(pas) === '["Objectif : perdre du gras","Profil : femme"]' && JSON.stringify(cartes) === JSON.stringify(TX.espace.cartes) && JSON.stringify(bt) === '["programme","recettes"]'
      && (await txt(page, ".pc-verrou")) === TX.espace.verrou && (await txt(page, "#pc-suivant")) === TX.espace.bouton && !e9.nav && !e9.installe && !e9.retour, JSON.stringify([e9, pas, cartes, bt]));
    const I = intakeDe(db, UID_NOUVEAU) || {}, ei = ecr(db, "intake", UID_NOUVEAU);
    ok("A13 : réponses rangées UNE fois dans intake, au format des 3 questions (v60) + le sexe : probleme, obstacle (texte français) + obstacle_choix, projection + projection_choix, sexe « Femme », court_debut / court_le / parcours_le datés, email_compte, objectif du calculateur ; aucun champ vide",
      ei.length === 1 && I.probleme === "Perdre du gras" && I.obstacle === "Le manque de temps" && JSON.stringify(I.obstacle_choix) === '["temps"]' && !("obstacle_precision" in I)
      && I.projection === "Avoir de l'énergie toute la journée" && JSON.stringify(I.projection_choix) === '["energie"]' && I.sexe === "Femme" && ISO(I.court_debut) && ISO(I.court_le) && ISO(I.parcours_le)
      && I.email_compte === "zoe@exemple.fr" && I.objectif === "Perte de poids / sèche" && I.objectif_auto === "Perte de poids / sèche" && !Object.keys(I).some(k => I[k] === "" || (Array.isArray(I[k]) && !I[k].length)), JSON.stringify([ei.length, I]));
    await page.click("#pc-suivant"); await sur(page, "cadeau");
    await capture(page, "parcours-12-cadeau");
    const e10 = await ecran(page), forts = await page.$$eval(".pc-cadeau-texte strong", l => l.map(x => x.textContent));
    const lien = await page.getAttribute("#pc-reserver", "href"), photo = await page.$eval(".pc-photo", i => i.tagName === "IMG" && /^data:image\/jpeg;base64,/.test(i.getAttribute("src")) && i.naturalWidth === 192).catch(() => false);
    ok("A14 : cadeau (100 %) plein écran sans croix ni retour : sur-titre, titre, « 15 min avec ton coach pour construire ton plan selon ton objectif (perdre du gras) et ce qui te bloque (le manque de temps). » (valeurs en gras), 3 repères, photo du coach (192 px), « Ton coach » ; « Je réserve mon créneau offert » = Calendly pré-rempli (cadeau, prénom, email, numéro), « Plus tard »",
      e10.progres === "100" && !e10.retour && !(await page.$(".fermer, [aria-label='Fermer']")) && e10.surtitre === TX.cadeau.surtitre && e10.h1 === TX.cadeau.titre
      && (await txt(page, ".pc-cadeau-texte")) === "15 min avec ton coach pour construire ton plan selon ton objectif (perdre du gras) et ce qui te bloque (le manque de temps)." && JSON.stringify(forts) === '["perdre du gras","le manque de temps"]'
      && JSON.stringify(await txts(page, ".pc-reperes > div", true)) === JSON.stringify(TX.cadeau.reperes) && photo && (await txt(page, ".pc-coach")) === TX.cadeau.coach
      && !!lien && lien.indexOf(CAL + "?") === 0 && /utm_content=cadeau(&|$)/.test(lien) && /[?&]name=Zo%C3%A9(&|$)/.test(lien) && /[?&]email=zoe%40exemple\.fr(&|$)/.test(lien) && /[?&]location=%2B33639980099(&|$)/.test(lien)
      && (await txt(page, "#pc-reserver")) === TX.cadeau.bouton && (await txt(page, "#pc-plus-tard")) === TX.cadeau.plus_tard && !e10.nav && !e10.installe, JSON.stringify([e10, forts, lien, photo]));
    await page.click("#pc-reserver");
    await page.waitForFunction(() => location.hash === "#/accueil" && typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 12000 }); await attendre(page, 800);
    const C = challengeDe(db, UID_NOUVEAU) || {}, cl = (C.cta && C.cta.clics) || [], I2 = intakeDe(db, UID_NOUVEAU) || {};
    ok("A15 : « Je réserve » : Calendly s'ouvre (nouvel onglet), le clic est noté avec sa date (challenge, origine « cadeau »), intake.bilan_propose « reserver » ; puis l'accueil de l'app : « Bonjour Zoé », sans carte cadeau, sans l'ancienne page « Ton plan d'action », ni questionnaire, ni écran du parcours ; le parcours est oublié de l'onglet",
      db.onglets === 1 && cl.length === 1 && cl[0].source === "cadeau" && ISO(cl[0].date) && I2.bilan_propose && I2.bilan_propose.choix === "reserver" && !(await page.$("#pc")) && /Bonjour Zoé/.test(norm(await txt(page, ".masthead h1")))
      && !(await page.$("#dc-cadeau")) && !(await page.$("#dc-bilan")) && !(await page.$("#q-probleme")) && (await stock(page)) === "", JSON.stringify([db.onglets, cl, I2.bilan_propose, await stock(page)]));
    /* le coach : les réponses du nouveau prospect au même endroit qu'avant (carte Prospects, fiche), texte libre et sexe compris */
    const x2 = await contexte(b, db, { qui: COACH, viewport: LARGE });
    /* v84 (ménage du bloc 3) : les cartes des prospects (.sc-carte) ont quitté la page Prospects pour « Suivi commercial »
       (menu Plus, #/suivi-commercial), telles quelles : la carte est lue à sa nouvelle place */
    await x2.page.goto(URL0 + "#/suivi-commercial"); await pret(x2.page); await attendre(x2.page, 800);
    const carte = norm(await x2.page.evaluate(id => { const e = Array.from(document.querySelectorAll(".sc-carte")).find(c => c.innerHTML.indexOf(id) > -1 || /Zoé/.test(c.textContent)); return e ? e.textContent : ""; }, UID_NOUVEAU));
    await x2.page.goto(URL0 + "#/client/" + UID_NOUVEAU + "/accueil"); await pret(x2.page); await attendre(x2.page, 800);
    const fiche = norm(await x2.page.evaluate(() => document.getElementById("vue").textContent));
    ok("A16 : le coach voit les réponses au même endroit qu'avant : carte Prospects (v84 : dans « Suivi commercial ») (problème, ce qui l'a bloqué, dans 3 mois) et fiche (les 3 réponses, et « Sexe : Femme »)",
      /Perdre du gras/.test(carte) && /Le manque de temps/.test(carte) && /Avoir de l'énergie toute la journée/.test(carte) && /Perdre du gras/.test(fiche) && /Le manque de temps/.test(fiche) && /Sexe\s*Femme/.test(fiche), (carte.slice(0, 300) + " | " + fiche.slice(0, 300)));
  });

  /* =================== B. deux blocages, « Plus tard », carte cadeau de l'accueil =================== */
  await bloc("B. deux blocages, « Plus tard », carte cadeau", async () => {
    const db = base(); db.inscription.id = PID(51);
    const { page } = await neuf(b, db);
    await FT.parcours(page, { objectif: "Prendre du muscle" }, "coince");
    for (const k of ["temps", "craquages", "motivation"]) await page.click('.pc-opt[data-k="' + k + '"]');
    const c1 = await coches(page), r1 = await txt(page, "#pc-reaction");
    ok("B1 : 3 cases touchées (temps, craquages, motivation) : la 3e décoche la plus ancienne (temps) ; la réaction est celle de la dernière cochée", JSON.stringify(c1) === '["craquages","motivation"]' && r1 === TX.coince.reactions.motivation, JSON.stringify([c1, r1]));
    await page.click('.pc-opt[data-k="craquages"]'); const c2 = await coches(page), r2 = await txt(page, "#pc-reaction");
    await page.click('.pc-opt[data-k="quoi_faire"]'); const c3 = await coches(page), r3 = await txt(page, "#pc-reaction");
    ok("B2 : décocher « craquages » : reste « motivation » et sa réaction ; puis « quoi faire » : les deux cochées, la réaction de « quoi faire »", JSON.stringify(c2) === '["motivation"]' && r2 === TX.coince.reactions.motivation && JSON.stringify(c3) === '["quoi_faire","motivation"]' && r3 === TX.coince.reactions.quoi_faire, JSON.stringify([c2, r2, c3, r3]));
    await page.click("#pc-suivant");
    await FT.parcours(page, { projection: "photos", sexe: "Homme", prenom: "Léo", email: "leo@exemple.fr", newsletter: true, tel: "0639980098" }, "cree");
    await sur(page, "espace", 12000);
    const I = intakeDe(db, PID(51)) || {}, d = (db.inscriptions[0] || {}).data || {};
    ok("B3 : intake : obstacle « Je ne sais pas quoi faire exactement · La motivation retombe vite » (ordre de la question), obstacle_choix [quoi_faire, motivation], projection « M'aimer sur les photos », sexe « Homme » ; newsletter cochée : son instant dans les métadonnées",
      I.obstacle === "Je ne sais pas quoi faire exactement · La motivation retombe vite" && JSON.stringify(I.obstacle_choix) === '["quoi_faire","motivation"]' && I.projection === "M'aimer sur les photos" && I.sexe === "Homme" && I.probleme === "Prendre du muscle" && ISO(d.newsletter) && d.newsletter_version === "2026-10-13",
      JSON.stringify([I, d]));
    await page.click("#pc-suivant"); await sur(page, "cadeau");
    const t4 = await txt(page, ".pc-cadeau-texte"), f4 = await page.$$eval(".pc-cadeau-texte strong", l => l.map(x => x.textContent));
    ok("B4 : cadeau avec 2 blocages : « … ton objectif (prendre du muscle) et ce qui te bloque (ne pas savoir quoi faire et la motivation qui retombe). », valeurs en gras",
      t4 === "15 min avec ton coach pour construire ton plan selon ton objectif (prendre du muscle) et ce qui te bloque (ne pas savoir quoi faire et la motivation qui retombe)." && JSON.stringify(f4) === '["prendre du muscle","ne pas savoir quoi faire","la motivation qui retombe"]', JSON.stringify([t4, f4]));
    await page.click("#pc-plus-tard");
    await page.waitForFunction(() => location.hash === "#/accueil" && typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 12000 });
    await page.waitForSelector("#dc-cadeau", { timeout: 8000 }); await attendre(page, 300);
    const C = challengeDe(db, PID(51)) || {}, pt = (C.cta && C.cta.plus_tard) || [], I2 = intakeDe(db, PID(51)) || {};
    const place = await page.evaluate(() => { const c = document.getElementById("dc-cadeau"), h = document.querySelector(".masthead"); return !!c && !!h && h.nextElementSibling && (h.nextElementSibling === c || h.nextElementSibling.contains(c) || c.parentElement.firstElementChild === c); });
    const lien = await page.getAttribute("#dc-cadeau-go", "href");
    await capture(page, "parcours-13-accueil-carte-cadeau");
    ok("B5 : « Plus tard » : noté (challenge, cta.plus_tard, origine « cadeau »), intake.bilan_propose « plus_tard » ; l'accueil montre en haut la carte « 🎁 Ton cadeau t’attend » (texte et bouton exacts, Calendly « accueil_cadeau »), aucune bannière d'installation",
      pt.length === 1 && pt[0].source === "cadeau" && I2.bilan_propose && I2.bilan_propose.choix === "plus_tard" && (await txt(page, "#dc-cadeau h2")) === TX.carte.titre && (await txt(page, "#dc-cadeau p")) === TX.carte.texte && (await txt(page, "#dc-cadeau-go")) === TX.carte.bouton
      && !!lien && /utm_content=accueil_cadeau(&|$)/.test(lien) && place && !(await page.$("#installe")) && !(C.cta && C.cta.clics && C.cta.clics.length), JSON.stringify([pt, I2.bilan_propose, lien, place]));
    await page.click("#dc-cadeau-go"); await attendre(page, 1500);
    const C2 = challengeDe(db, PID(51)) || {}, cl = (C2.cta && C2.cta.clics) || [], parti = !(await page.$("#dc-cadeau"));
    await page.reload(); await pret(page); await attendre(page, 600);
    ok("B6 : la carte touchée : Calendly s'ouvre, clic noté (origine « accueil_cadeau », daté), la carte s'en va ; rechargée, l'accueil ne la montre plus",
      db.onglets === 1 && cl.length === 1 && cl[0].source === "accueil_cadeau" && ISO(cl[0].date) && parti && !(await page.$("#dc-cadeau")) && !!(await page.$(".masthead")), JSON.stringify([db.onglets, cl, parti]));
  });

  /* =================== C. texte libre seul =================== */
  await bloc("C. texte libre seul", async () => {
    const db = base(); db.inscription.id = PID(52);
    const { page } = await neuf(b, db);
    await FT.parcours(page, {}, "coince");
    const avant = await page.isVisible("#pc-libre");
    await page.click("#pc-autre");
    const t = await page.$eval("#pc-libre", e => ({ max: e.maxLength, ex: e.placeholder, vu: e.offsetParent !== null }));
    const libre = "Je travaille de nuit et je mange à des heures très irrégulières le week-end";
    const b0 = await inactif(page, "#pc-suivant"); await page.fill("#pc-libre", libre);
    ok("C1 : « Autre chose ? Dis-le avec tes mots » ouvre le champ (200 caractères, exemple « Écris-le ici, en quelques mots ») ; « Continuer » s'active avec le texte seul, sans case ni réaction",
      !avant && t.vu && t.max === 200 && t.ex === TX.coince.exemple && b0 === true && (await inactif(page, "#pc-suivant")) === false && !(await coches(page)).length && (await page.isHidden("#pc-reaction")), JSON.stringify([avant, t, b0]));
    await page.click("#pc-suivant");
    await FT.parcours(page, { libre }, "chargement");
    const l2 = await page.$$eval(".pc-coche-ligne b", l => l.map(x => x.textContent));
    ok("C2 : chargement : « Ce qui a coincé » = les 40 premiers caractères du texte, puis « … »", norm(l2[1]) === Array.from(libre).slice(0, 40).join("").trim() + "…", JSON.stringify(l2));
    await FT.parcours(page, { libre, email: "libre@exemple.fr", tel: "0639980097" }, "cree"); await sur(page, "espace", 12000);
    const I = intakeDe(db, PID(52)) || {};
    await page.click("#pc-suivant"); await sur(page, "cadeau");
    ok("C3 : intake : obstacle = le texte, obstacle_precision = le texte, pas de clés ; cadeau sans blocage : « 15 min avec ton coach pour construire ton plan selon ton objectif (perdre du gras). »",
      I.obstacle === libre && I.obstacle_precision === libre && !("obstacle_choix" in I) && (await txt(page, ".pc-cadeau-texte")) === "15 min avec ton coach pour construire ton plan selon ton objectif (perdre du gras).", JSON.stringify(I));
  });

  /* =================== D. retour arrière et rechargement =================== */
  await bloc("D. retour arrière et rechargement", async () => {
    const db = base();
    const { page } = await neuf(b, db);
    await FT.parcours(page, { objectif: "Me remettre en forme", obstacle: ["suivi"] }, "projection");
    await page.click(".pc-retour"); await sur(page, "coince");
    const c1 = await coches(page), r1 = await txt(page, "#pc-reaction");
    await page.click(".pc-retour"); await sur(page, "objectif"); await page.click(".pc-retour"); await sur(page, "accueil");
    ok("D1 : retours : projection → coincé (« suivi » toujours coché, sa réaction) → objectif → accueil", JSON.stringify(c1) === '["suivi"]' && r1 === TX.coince.reactions.suivi, JSON.stringify([c1, r1]));
    await FT.parcours(page, { objectif: "Me remettre en forme", obstacle: ["suivi"] }, "projection");
    await page.click('.pc-opt[data-k="confiance"]'); await page.reload(); await page.waitForSelector("#pc");
    ok("D2 : page rechargée sur « Dans 3 mois » : même écran (30 %), « Retrouver confiance en moi » toujours cochée", (await etape(page)) === "projection" && (await progres(page)) === "30" && JSON.stringify(await coches(page)) === '["confiance"]', (await etape(page)) + " " + JSON.stringify(await coches(page)));
    await page.click("#pc-suivant"); await FT.parcours(page, { prenom: "Noé" }, "prenom"); await page.fill("#pc-prenom", "Noé"); await page.reload(); await page.waitForSelector("#pc");
    const p3 = await page.$eval("#pc-prenom", e => e.value).catch(() => null);
    await page.click("#pc-suivant"); await FT.parcours(page, { email: "noe@exemple.fr", mdp: "secret-de-noe" }, "whatsapp");
    await page.reload(); await page.waitForSelector("#pc");
    const e4 = await etape(page), v4 = await page.evaluate(() => ({ email: document.getElementById("c-email").value, mdp: document.getElementById("c-mdp").value, cgu: document.getElementById("c-cgu").checked })), s4 = await stock(page);
    ok("D3 : prénom gardé au rechargement ; rechargée à l'écran WhatsApp : retour à l'écran Compte (email et case gardés, mot de passe vide) ; le mot de passe n'est jamais rangé dans l'onglet",
      p3 === "Noé" && e4 === "compte" && v4.email === "noe@exemple.fr" && v4.mdp === "" && v4.cgu === true && s4.indexOf("secret-de-noe") === -1 && /"email":"noe@exemple\.fr"/.test(s4), JSON.stringify([p3, e4, v4, s4]));
    await page.fill("#c-mdp", "secret-de-noe"); await page.click("#pc-suivant"); await sur(page, "whatsapp");
    await page.click(".pc-retour"); await sur(page, "compte"); const m5 = await page.$eval("#c-mdp", e => e.value);
    await page.click(".pc-retour"); await sur(page, "prenom");
    ok("D4 : retour de WhatsApp → Compte (mot de passe encore là, en mémoire) ; retour de Compte → Prénom (le chargement est sauté)", m5 === "secret-de-noe" && (await page.$eval("#pc-prenom", e => e.value)) === "Noé", m5);
  });

  /* =================== E. erreurs =================== */
  await bloc("E. erreurs", async () => {
    const db = base(); db.inscription.id = PID(53);
    const { page } = await neuf(b, db);
    await FT.parcours(page, {}, "compte");
    await page.fill("#c-email", "zoe@exemple"); await page.focus("#c-mdp"); const e1 = await txt(page, "#pc-err-email");
    await page.fill("#c-mdp", "court"); await page.focus("#c-email"); const e2 = await txt(page, "#pc-err-mdp");
    await page.fill("#c-email", "zoe@exemple.fr"); await page.fill("#c-mdp", "motdepasse1"); await page.click("#pc-suivant", { force: true }); await attendre(page, 200);   // inactif (aria-disabled) : touché quand même, il dit ce qui manque
    const e3 = await txt(page, "#pc-err-cgu"), ici3 = await etape(page);
    ok("E1 : email invalide : « Vérifie ton email. » ; mot de passe court : « 8 caractères minimum. » ; « Continuer » sans la case des conditions : le message des conditions, on reste sur l'écran Compte",
      e1 === TX.erreurs.email && e2 === TX.erreurs.mdp && e3 === "Coche la case des conditions pour continuer." && ici3 === "compte", JSON.stringify([e1, e2, e3, ici3]));
    await page.check("#c-cgu"); await page.click("#pc-suivant"); await sur(page, "whatsapp");
    await page.fill("#c-tel", "12"); await page.click("#c-go"); await attendre(page, 300);
    ok("E2 : numéro invalide : « Vérifie ton numéro. », champ marqué, aucune inscription envoyée", (await txt(page, "#pc-err-tel")) === TX.erreurs.tel && (await page.$eval("#c-tel", e => e.getAttribute("aria-invalid"))) === "true" && db.inscriptions.length === 0, String(db.inscriptions.length));
    db.inscription.erreur = { statut: 422, corps: { code: 422, error_code: "user_already_exists", msg: "User already registered" } };
    await page.fill("#c-tel", "0639980096"); await page.click("#c-go"); await sur(page, "compte");
    const e4 = await txt(page, "#pc-err-email");
    await page.click("#pc-se-connecter"); await page.waitForSelector(".carte-co #c-go");
    ok("E3 : email déjà utilisé : retour à l'écran Compte, « Cet email a déjà un compte. Se connecter » ; « Se connecter » ouvre la connexion, l'email déjà tapé, l'adresse #/connexion",
      e4 === TX.erreurs.pris && (await page.$eval("#c-email", e => e.value)) === "zoe@exemple.fr" && (await txt(page, ".carte-co h2")) === "Connexion à ton espace" && (await page.evaluate(() => location.hash)) === "#/connexion", JSON.stringify([e4]));
    db.inscription.erreur = null; db.inscription.coupure = true;
    await page.evaluate(() => { location.hash = "#/inscription"; location.reload(); }); await page.waitForSelector("#pc");   // le parcours reprend (écran Compte : le mot de passe n'est pas gardé)
    await FT.parcours(page, { tel: "0639980096" }, "cree"); await attendre(page, 1500);
    ok("E4 : réseau coupé pendant la création : on reste sur l'écran WhatsApp, « Pas de connexion. Réessaie dans un instant. », le bouton revient", (await etape(page)) === "whatsapp" && (await txt(page, "#co-err")) === TX.erreurs.reseau && (await txt(page, "#c-go")) === TX.whatsapp.bouton && !(await page.$eval("#c-go", x => x.disabled)), await txt(page, "#co-err"));
  });

  /* =================== F. compte à rebours, heure de Paris =================== */
  await bloc("F. compte à rebours", async () => {
    const db = base();
    const { page } = await neuf(b, db);
    const cas = [["2026-10-13T10:00:00Z", "La bêta ferme le 15 novembre · plus que 33 jours"], ["2026-11-13T12:00:00Z", "La bêta ferme le 15 novembre · plus que 2 jours"],
      ["2026-11-13T22:59:59Z", "La bêta ferme le 15 novembre · plus que 2 jours"], ["2026-11-13T23:00:00Z", "La bêta ferme le 15 novembre · plus qu’un jour"],
      ["2026-11-14T22:59:59Z", "La bêta ferme le 15 novembre · plus qu’un jour"], ["2026-11-14T23:00:00Z", "La bêta ferme le 15 novembre · dernier jour"],
      ["2026-11-15T22:59:59Z", "La bêta ferme le 15 novembre · dernier jour"], ["2026-11-15T23:00:00Z", ""], ["2026-11-16T12:00:00Z", ""], ["2027-01-01T00:00:00Z", ""]];
    const vus = await page.evaluate(c => c.map(([t]) => Parcours.rebours(new Date(t))), cas);
    ok("F1 : à l'heure de Paris : 14/11 « plus qu’un jour » (de minuit à 23:59:59), 15/11 « dernier jour » jusqu'à 23:59:59, puis plus rien (16/11 et après) ; la veille, « plus que 2 jours »",
      JSON.stringify(vus) === JSON.stringify(cas.map(x => x[1])), JSON.stringify(vus));
    const ete = await page.evaluate(() => [Parcours.rebours(new Date("2026-10-24T21:30:00Z")), Parcours.rebours(new Date("2026-10-24T22:30:00Z")), Parcours.rebours(new Date("2026-10-25T00:30:00Z")), Parcours.rebours(new Date("2026-10-25T01:30:00Z")), Parcours.rebours(new Date("2026-10-25T22:30:00Z")), Parcours.rebours(new Date("2026-10-25T23:30:00Z"))]);
    ok("F2 : changement d'heure du 25/10 (heure d'été → heure d'hiver à 3 h) : 23:30 le 24/10 → 22 jours ; de 00:30 à 23:30 le 25/10 (avant et après le changement) → 21 jours ; 00:30 le 26/10 → 20 jours",
      JSON.stringify(ete) === JSON.stringify(["…22", "…21", "…21", "…21", "…21", "…20"].map(x => "La bêta ferme le 15 novembre · plus que " + x.slice(1) + " jours")), JSON.stringify(ete));
    const ecranA = async (t, langue) => {
      const x = await contexte(b, base(), { neuf: true, langue });
      await x.page.clock.install({ time: new Date(t) }); await x.page.goto(URL0); await x.page.waitForSelector("#pc-go");
      return { reb: await txt(x.page, "#pc-rebours"), titre: await txt(x.page, "#pc h1"), bouton: await txt(x.page, "#pc-go") };
    };
    const le15 = await ecranA("2026-11-15T09:00:00Z"), le16 = await ecranA("2026-11-16T00:00:01+01:00");
    ok("F3 : à l'écran : le 15/11, « La bêta ferme le 15 novembre · dernier jour » ; le 16/11, la ligne a disparu et rien d'autre ne change (titre, bouton)",
      le15.reb === "La bêta ferme le 15 novembre · dernier jour" && le16.reb === null && le16.titre === TX.accueil.titre && le16.bouton === TX.accueil.bouton, JSON.stringify([le15, le16]));
    const en = await ecranA("2026-11-14T12:00:00Z", "en");
    ok("F4 : en anglais, le 14/11 : « The beta closes on November 15 · only one day left »", en.reb === "The beta closes on November 15 · only one day left", JSON.stringify(en));
  });

  /* =================== G. comptes existants inchangés =================== */
  await bloc("G. comptes existants inchangés", async () => {
    /* Inès : questionnaire rempli avant la v81, pas encore de choix sur la page « Ton plan d'action » */
    const db = base([{ user_id: INES.id, outil: "intake", contenu: { court_debut: avant(3 * J), court_le: avant(3 * J), probleme: "Prendre du muscle", obstacle: "Le manque de temps", obstacle_choix: ["temps"], projection: "Retrouver confiance en moi", projection_choix: ["confiance"] }, maj_le: avant(3 * J) }]);
    const v = async (qui, hash) => { const x = await contexte(b, db, { qui }); await x.page.goto(URL0 + (hash || "")); await pret(x.page); await attendre(x.page, 500);
      return { pc: !!(await x.page.$("#pc")), nav: !!(await x.page.$(".topbar")), cadeau: !!(await x.page.$("#dc-cadeau")), bilan: !!(await x.page.$("#dc-bilan")), q: !!(await x.page.$("#q-probleme")), h: await x.page.evaluate(() => location.hash), page: x.page }; };
    const th = await v(THOMAS), co = await v(COACH);
    ok("G1 : client (Thomas) et coach : l'app s'ouvre comme avant (barre du haut, accueil du client, tableau de bord du coach), jamais le parcours ni la carte cadeau",
      !th.pc && th.nav && !th.cadeau && !!(await th.page.$("#vue .masthead")) && !co.pc && co.nav && !co.cadeau && (await co.page.evaluate(() => courant)) === "tableau", JSON.stringify([th.h, co.h]));
    const no = await v(NOAH), ma = await v(MAEL), ine = await v(INES);
    ok("G2 : prospects d'avant la v81 : Noah (réponses + choix faits) → son accueil, sans carte cadeau ; Maël (sans réponse) → l'ancien questionnaire dans l'app ; Inès (réponses, pas de choix) → l'ancienne page « Ton plan d'action » ; jamais le parcours",
      !no.pc && !no.cadeau && !no.bilan && !no.q && !ma.pc && ma.q && !ine.pc && ine.bilan && !ine.cadeau, JSON.stringify([no, ma, ine].map(x => ({ pc: x.pc, cadeau: x.cadeau, bilan: x.bilan, q: x.q }))));
    ok("G3 : aucune écriture des comptes existants à l'ouverture (hors compteur de visites et copie de la newsletter, comme avant)",
      !db.ecritures.some(e => e.table === "donnees" && ["intake", "challenge", "contact"].includes(e.outil)), resume(db));
    /* un appareil déjà venu, sans session : la connexion, comme avant ; « Créer mon compte » → le parcours */
    const x = await contexte(b, db, {}); await x.page.goto(URL0); await x.page.waitForSelector(".carte-co #c-go");
    const h2 = await txt(x.page, ".carte-co h2");
    await x.page.click('[data-mode="inscription"]'); await x.page.waitForSelector('#pc[data-etape="accueil"]');
    await x.page.click("#pc-connexion"); await x.page.waitForSelector(".carte-co #c-go");
    await x.page.fill("#c-email", "noah@exemple.fr"); await x.page.fill("#c-mdp", "motdepasse1"); db.emails[NOAH.id] = NOAH.email;
    await x.page.click("#c-go"); await pret(x.page); await attendre(x.page, 500);
    ok("G4 : appareil déjà venu : l'écran de connexion (« Connexion à ton espace ») ; « Pas encore de compte ? Créer mon compte » ouvre l'accueil du parcours, « Déjà un compte ? Se connecter » y ramène ; la connexion de Noah ouvre son app, pas le parcours",
      h2 === "Connexion à ton espace" && !(await x.page.$("#pc")) && !!(await x.page.$(".topbar")), h2);
  });

  /* =================== H. largeurs 360, 390 et 430 px =================== */
  for (const vp of [ETROIT, MOBILE, GRAND]) await bloc("H. " + vp.width + " px : chaque écran", async () => {
    const db = base(); db.inscription.id = PID(60 + vp.width % 7);
    const { page } = await neuf(b, db, { viewport: vp });
    const defauts = [];
    const mesurer = async () => {
      const e = await etape(page);
      const m = await page.evaluate(() => {
        const petits = Array.from(document.querySelectorAll("#pc button, #pc a, #pc input:not([type=checkbox]), #pc select, #pc .pc-case")).filter(x => x.offsetParent !== null && !x.closest(".pc-case span, .pc-erreur") && !(x.tagName === "A" && x.closest("p")))
          .map(x => [x.id || x.className, Math.round(x.getBoundingClientRect().height)]).filter(x => x[1] < 44);
        return { large: document.documentElement.scrollWidth > window.innerWidth + 1, petits };
      });
      if (m.large) defauts.push(e + " déborde"); if (m.petits.length) defauts.push(e + " : " + JSON.stringify(m.petits));
    };
    for (const e of ["accueil", "objectif", "coince", "projection", "sexe", "prenom", "chargement", "compte", "whatsapp"]) { await FT.parcours(page, { email: "l" + vp.width + "@exemple.fr", tel: "06399800" + String(vp.width).slice(1) }, e); await mesurer(); }
    await FT.parcours(page, { email: "l" + vp.width + "@exemple.fr", tel: "06399800" + String(vp.width).slice(1) }, "cree"); await sur(page, "espace", 12000); await mesurer();
    await page.click("#pc-suivant"); await sur(page, "cadeau"); await mesurer();
    const basVu = await page.evaluate(() => { const r = document.getElementById("pc-plus-tard").getBoundingClientRect(); return r.bottom <= window.innerHeight + 1 || document.documentElement.scrollHeight > window.innerHeight; });
    ok("H : " + vp.width + " px : les 11 écrans sans débordement de côté, chaque bouton, champ et case d'au moins 44 px ; le cadeau tient à l'écran (bouton et « Plus tard » atteignables)", !defauts.length && basVu, defauts.join(" ; ").slice(0, 600));
  });

  /* =================== I. anglais =================== */
  await bloc("I. anglais", async () => {
    const db = base(); db.inscription.id = PID(54);
    const { page } = await neuf(b, db, { langue: "en" });
    const MOTS_FR = /\b(Ton|Tes|Tu|ton|tes|Créer|Continuer|Déjà|Bientôt|objectif|coincé|réponses|prénom|chargement|Débloquer|Entrer|Cadeau|créneau|semaine|Journal alimentaire|Recettes)\b/;
    const fr = [];
    const vu = async () => { const t = norm(await page.evaluate(() => document.getElementById("pc").innerText)); if (MOTS_FR.test(t)) fr.push((await etape(page)) + " : " + t.match(MOTS_FR)[0]); return t; };
    const a = await vu();
    ok("I1 : accueil en anglais : « How many Mondays have you said “I’ll start”? », « Create my free space », « Already have an account? Log in », « Coming soon » ; aucun mot français",
      (await txt(page, "#pc h1")) === "How many Mondays have you said “I’ll start”?" && (await txt(page, "#pc-go")) === "Create my free space" && (await txt(page, "#pc-connexion")) === "Already have an account? Log in" && /Coming soon/.test(a) && !fr.length, fr.join(" | ") + " " + a.slice(0, 200));
    const textes = {};
    for (const e of ["objectif", "coince", "projection", "sexe", "prenom", "chargement", "compte", "whatsapp"]) { await FT.parcours(page, { obstacle: ["temps"] }, e); await vu(); textes[e] = await txt(page, "#pc h1"); if (e === "coince"){ await page.click('.pc-opt[data-k="temps"]'); textes.reaction = await txt(page, "#pc-reaction"); await vu(); } }
    ok("I2 : les écrans en anglais (titres exacts, réaction), sans mot français : « Your goal? », « What’s held you back so far? », « In 3 months, what would change everything for you? », « You are…? », « What should we call you? », « Zoé, we’re getting your space ready… », « Your space is ready 🔒 », « Your WhatsApp number? »",
      JSON.stringify(textes) === JSON.stringify({ objectif: "Your goal?", coince: "What’s held you back so far?", reaction: "We’ve thought of that. Your program moves in small steps that are easy to fit into a busy day.", projection: "In 3 months, what would change everything for you?", sexe: "You are…?", prenom: "What should we call you?", chargement: "Zoé, we’re getting your space ready…", compte: "Your space is ready 🔒", whatsapp: "Your WhatsApp number?" }) && !fr.length,
      JSON.stringify(textes) + " " + fr.join(" | "));
    await FT.parcours(page, { obstacle: ["temps"], email: "en@exemple.fr", tel: "0639980095" }, "cree"); await sur(page, "espace", 12000); await vu();
    const pas = await txts(page, ".pc-pastilles-espace .pastille");
    await page.click("#pc-suivant"); await sur(page, "cadeau"); await vu();
    const cad = await txt(page, ".pc-cadeau-texte"), I = intakeDe(db, PID(54)) || {};
    ok("I3 : « Ton espace » et cadeau en anglais (« Goal: lose fat », « Profile: woman », « 15 min with your coach to build your plan around your goal (lose fat) and what’s holding you back (lack of time). »), sans mot français ; les réponses restent rangées en français (coach, CSV)",
      JSON.stringify(pas) === '["Goal: lose fat","Profile: woman"]' && cad === "15 min with your coach to build your plan around your goal (lose fat) and what’s holding you back (lack of time)." && !fr.length && I.probleme === "Perdre du gras" && I.obstacle === "Le manque de temps" && I.sexe === "Femme",
      JSON.stringify([pas, cad, fr, I.probleme]));
  });

  /* =================== J. moins de mouvement =================== */
  await bloc("J. moins de mouvement", async () => {
    const etat = async mouvement => { const x = await neuf(b, base(), { mouvement }); await attendre(x.page, 700);
      return x.page.evaluate(() => { const g = s => getComputedStyle(document.querySelector(s)); const sc = Array.from(document.querySelectorAll(".pc-sc")).map(e => getComputedStyle(e).opacity);
        return { anim: g(".pc-sc-1").animationName, flotte: g(".pc-tel-flotte").animationName, scan: g(".pc-scan").opacity, sc, et: Array.from(document.querySelectorAll(".pc-et")).map(e => getComputedStyle(e).opacity) }; }); };
    const fixe = await etat(false), anime = await etat(true);
    ok("J1 : l'appareil demande moins de mouvement : image fixe — aucune animation, la 1re scène (journal) et son étiquette seules visibles, pas de ligne de balayage",
      fixe.anim === "none" && fixe.flotte === "none" && fixe.scan === "0" && JSON.stringify(fixe.sc) === '["1","0","0","0","0"]' && JSON.stringify(fixe.et) === '["1","0","0","0","0"]', JSON.stringify(fixe));
    ok("J2 : sinon, l'animation tourne (scènes, téléphone qui flotte)", anime.anim === "pc-scene" && anime.flotte === "pc-flotte", JSON.stringify(anime));
  });

  /* =================== W. moteur WebKit (Safari) =================== */
  await bloc("W. WebKit", async () => {
    if (process.env.VERIF85_WEBKIT === "0") return;
    const { webkit } = require("playwright");
    const wb = await webkit.launch();
    try {
      const db = base(); db.inscription.id = PID(55);
      const c = await wb.newContext({ viewport: MOBILE, isMobile: true, hasTouch: true }); ouverts.push(c);
      await c.route("**/*", r => repondre(r, db)); const page = await c.newPage(); const err = [];
      page.on("pageerror", e => err.push(String(e))); page.on("popup", p => p.close().catch(() => {}));
      await page.goto(URL0); await page.waitForSelector("#pc");
      await FT.parcours(page, { obstacle: ["temps", "suivi"], email: "safari@exemple.fr", tel: "0639980094" }, "cree"); await sur(page, "espace", 15000);
      const I = intakeDe(db, PID(55)) || {};
      ok("W1 : WebKit (moteur de Safari sur iPhone) : le parcours de bout en bout jusqu'à « Ton espace », compte créé, réponses rangées, aucune erreur", db.inscriptions.length === 1 && I.probleme === "Perdre du gras" && JSON.stringify(I.obstacle_choix) === '["temps","suivi"]' && !err.length, JSON.stringify([db.inscriptions.length, I, err]));
    } finally { await wb.close().catch(() => {}); }
  });

  /* =================== Z. rien vers l'extérieur =================== */
  await bloc("Z. hôtes externes", async () => {
    ok("Z : aucune requête vers un autre hôte que la page, le faux Supabase et le faux Calendly", externes.size === 0, JSON.stringify(Array.from(externes)));
  });

  await b.close(); server.close(); bilan();
})().catch(e => { console.log("ERREUR " + (e && e.stack || e)); process.exit(1); });
