/* verif70 — v64 (brief V2, lot 5, section A ; scénario 1a de la section 8) : l'inscription à UNE seule case obligatoire,
   vérifiée de bout en bout dans un vrai navigateur, et le VERROU de publication des textes légaux.
   v81 (bloc 2, mission du 13/10/2026) : l'inscription passe par le parcours du prospect en 11 écrans (js/parcours.js) ;
   A1 et A2 portent sur ses écrans Compte et WhatsApp (voir plus bas), A0 inchangé.
   A0. verrou de publication (sans navigateur) : les 3 emplacements de js/config.js (CONFIG.textes_legaux : cgu_pdf,
      confidentialite_pdf, cgu_version), LUS SUR LE DISQUE (fichiers servis, jamais retouchés) ET js/config.js EXÉCUTÉ
      dans un bac à sable (vm) : ✗ tant qu'une valeur manque ou n'est pas publiable, ou que la valeur exécutée n'est pas
      celle qui est lue (verrouLegaux, fichiers.js : 2 liens https Google Drive de document — ou, décision de Lucas du 30/09,
      le même dossier Drive pour les deux (drive.google.com/drive/folders/<id>) —, identifiants d'au moins 25
      caractères, ni valeur de test d'une suite ni identifiant TEST…, ni identifiant « modèle » (sans minuscule, sans
      majuscule ou sans chiffre, 5 caractères identiques, suite de 6, mot de gabarit), ni le document d'un autre lien du
      site (ressource de la formation), rien hors de \x21-\x7E ; version après le 2026-09-30 et au plus aujourd'hui + 366
      jours ; CONFIG.textes_legaux jamais modifié hors de js/config.js), SAUF sur une branche de travail v2/* (hors
      v2/simu-main et v2/simu-main-*)
      où la ligne reste ✓ en disant ce qui manque (modeLegaux, fichiers.js : BANC_LEGAUX=strict, sinon GITHUB_REF, sinon
      la branche git de la copie ; main, tag, HEAD détaché → strict). Toujours UNE ligne : le nombre de ✓ ne change pas
      d'un mode à l'autre. Puis la règle elle-même, sur des js/config.js fabriqués et exécutables (valeurs refusées,
      chacune pour sa raison ; liens réalistes tirés à chaque passage, acceptés ; les deux modes) et sur le config.js de
      la page : servi avec les valeurs de test des suites (forcerLegaux) → refusé pour ses 2 liens de test ; avec des
      liens réalistes → complet ; enfin la page entière (disque) avec des liens réalistes → complète, et chaque lien
      Google Drive écrit ailleurs dans le site (PDF de la formation) : publiable seul, refusé comme lien des CGU ;
   A1. v81 (bloc 2) : l'écran unique « Crée ton espace gratuit » n'existe plus (#/inscription ouvre le parcours du prospect
      en 11 écrans, js/parcours.js) ; ce qu'il portait est vérifié, avec la même exigence, sur l'écran du parcours qui le
      porte maintenant : l'écran Compte (70 %, #pc[data-etape="compte"], atteint par FT.parcours depuis #/inscription) et,
      pour le bouton qui crée le compte et la mention médicale, l'écran WhatsApp (80 %). Français et anglais, thème sombre
      et ancien choix « clair » rangé sur l'appareil (mhx_theme = light), ignoré (v80 : tout en sombre, data-theme
      absent), 390 px et 320 px (config servie avec les 3 valeurs de test valides, LEGAUX_TEST) : textes EXACTS de
      docs/maj-blocs-1-2/TEXTES.md (Compte : titre « Ton espace est prêt 🔒 », sous-titre, case des conditions INCHANGÉE,
      case newsletter au nouveau texte, bouton « Continuer » ; WhatsApp : bouton « Débloquer mon espace », mention
      médicale) ; plus de « Rester connecté » (v76) ni de « 14 jours » ; exactement 2 cases (conditions et newsletter, non
      cochées, sans attribut checked), #c-sante absente, aucun « données de santé » / « health data » ; « CGU » et
      « politique de confidentialité » (« Terms of Use », « Privacy Policy ») = 2 liens distincts (href = les 2 PDF de la
      config servie, target=_blank, rel=noopener ; jamais cliqués : aucun appel vers Google Drive) ; le point final collé
      au 2e lien et, mesuré par Range à 414, 390, 375, 360 et 320 px, sur la MÊME ligne que la dernière lettre de ce
      lien (le point orphelin du brief), dans la case, sans défilement horizontal ; les 2 liens visibles dans le thème
      (couleur dorée du thème, soulignés, en ligne, contraste ≥ 3 avec le fond réellement vu : chaque fond du lien et de
      ses parents, alpha compris — la case en verre du parcours comprise —, composé sur le fond opaque de la page ;
      l'ancien choix « clair » ignoré : le doré du thème sombre, rgb(212, 168, 68)). La zone de tap n'est pas mesurée
      ici : la case entière (.pc-case, 44 px au moins) l'est par verif85 H ;
      config « à compléter » (la branche de travail), et un lien « javascript: » : les 2 mots sont des span.lien-absent,
      sans lien, même texte, point collé (écran Compte du parcours) ;
   A2. inscription par le parcours, en français (sans newsletter, 390 px, thème sombre) et en anglais (avec newsletter,
      390 px, ancien choix « clair » rangé sur l'appareil, ignoré (v80), une autre version servie, 2026-10-15) : prénom
      « Zoé » à l'écran Prénom ; à l'écran Compte, sans la case des conditions, « Continuer » (inactif, touché quand même)
      → message exact (« Coche la case des conditions pour continuer. » / « Tick the terms box to continue. »), on reste
      sur l'écran Compte, aucun appel, même avec la newsletter cochée ; un tap sur le texte de la case la coche ; cette
      seule case suffit : à l'écran WhatsApp, « Débloquer mon espace » crée le compte SANS accord santé, la page se
      recharge avec la session et arrive sur l'écran « Ton espace » (plus sur le questionnaire de l'app) ;
      POST /auth/v1/signup data = EXACTEMENT prenom, nom, consentement (instant ISO du clic), conditions_version (= la
      valeur de config servie = CONFIG.textes_legaux.cgu_version = DECOUVERTE.accords.conditions), newsletter (instant
      ISO si cochée, sinon null), newsletter_version « 2026-10-13 » (= DECOUVERTE.accords.newsletter, v81 : nouveau texte
      de la case) ; à la première ouverture, la clé emails recopiée comme avant (Accords.copierEmails : { newsletter, maj,
      version « 2026-10-13 », source « inscription » }, une fois), aucune donnée de santé écrite ni aucune métadonnée
      santé demandée ; le Profil (atteint après « Ton espace » et le cadeau, « Plus tard », à l'accueil de l'app) garde
      son interrupteur (état d'après la copie ; un changement écrit version « 2026-09-28c »,
      DECOUVERTE.accords.newsletter_profil, source « profil »).
   v74 (décision de Lucas du 04/10) : plus de champ Nom à l'inscription : data.nom = "" (profils.nom vide). Même nombre.
   v81 (bloc 2) : A1 et A2 portés sur le parcours, même nombre de ✓ (32) ; dans chaque bloc A1, la ligne des textes vient
   en dernier (elle attend l'écran WhatsApp, atteint après les mesures de l'écran Compte).
   Supabase simulé (gabarit de verif55) : rien ne part vers la vraie base (routage par NOM D'HÔTE) ; chaque écriture est
   notée. Dates relatives au lancement. Chaque bloc tourne à part (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un ✗
   apparaît. Comptes fictifs (@exemple.fr).
   Usage : node verif70.js ../index.html
           VERIF70_PORT=9861 node verif70.js ../index.html     (autre port, si 9860 est pris)
           VERIF70_BLOCS="A0.,A2." node verif70.js …            (seulement les blocs dont le nom commence ainsi)
           BANC_LEGAUX=strict VERIF70_BLOCS="A0." node verif70.js …   (preuve locale : le verrou rougit sur une branche v2/*) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const FT = require("./fichiers");   // 52.1 : la page charge css/ et js/, servis depuis son dossier ; v64 : verrou et valeurs de test
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF70_PORT || 9860;
const BLOCS = (process.env.VERIF70_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const MOBILE = { width: 390, height: 844 }, PETIT = { width: 320, height: 640 };
const LARGEURS = [414, 390, 375, 360, 320];

/* ---------- la page servie : inscription ouverte, textes légaux forcés (legaux) ----------
   Toute la suite teste l'inscription : inscription_libre est servie ouverte (forcerInscription, fichiers.js), que le
   fichier la porte ouverte ou fermée. legaux : les 3 valeurs de CONFIG.textes_legaux servies (forcerLegaux) ; null : le
   fichier tel quel. Un fichiers.js sans forcerLegaux (copie d'avant la v64) sert le fichier tel quel : les vérifications
   des liens (href = valeur servie) rougissent alors d'elles-mêmes. */
const forcerLegaux = typeof FT.forcerLegaux === "function" ? FT.forcerLegaux : (t => t);
const LEGAUX_TEST = FT.LEGAUX_TEST || { cgu_pdf: "https://drive.google.com/file/d/TEST-CGU/view", confidentialite_pdf: "https://drive.google.com/file/d/TEST-POLITIQUE/view", cgu_version: "2026-10-01" };
const LEGAUX_A_COMPLETER = { cgu_pdf: "à compléter", confidentialite_pdf: "à compléter", cgu_version: "à compléter" };
let legaux = LEGAUX_TEST;
const retouche = h => { h = FT.forcerInscription(h, true); return legaux ? forcerLegaux(h, legaux) : h; };
const server = http.createServer((req, res) => {
  if (FT.servirFichier(req, res, HTML, retouche)) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(retouche(fs.readFileSync(HTML, "utf8")));
});
async function avecLegaux(valeurs, fn){
  const avant = legaux; legaux = valeurs;
  try { await fn(); } finally { legaux = avant; }
}

/* ---------- résultats ---------- */
const res = [];
const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
function bilan(){
  const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length;
  console.log(res.join("\n")); console.log(nb + "/" + tot);
  if (nb < tot || tot === 0) process.exitCode = 1;
}
const ouverts = [];   // les contextes du bloc en cours : fermés à la fin du bloc, même s'il s'arrête en route
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
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "donnees", f), "utf8"));
const CATALOGUE = Object.assign({}, F.catalogue, { aliments: lireDonnees("aliments.json"), recettes: lireDonnees("recettes.json") });
/* un instant ISO exact (toISOString), au plus 15 s du clic */
const isoPres = (x, t) => typeof x === "string" && !isNaN(Date.parse(x)) && new Date(x).toISOString() === x && Math.abs(Date.parse(x) - t) < 15000;

/* ---------- les personnes ---------- */
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: meta } : {}) });
const PID = k => "00000000-0000-4000-8000-0000000070" + String(k).padStart(2, "0");   // verif70 : …70kk (une plage par suite)

/* ---------- le décor : fixtures.js (coach, clients) ; le compte créé par l'inscription s'y ajoute ---------- */
function base(){
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  return { profils, donnees: clone(F.donnees), ecritures: [], lectures: [], chemins: [], inscriptions: [], majUsers: [], emails: {}, meta: {},
    inscription: {} };
}

/* ---------- le faux Supabase (gabarit de verif55, réduit à ce que l'inscription et l'ouverture utilisent) ---------- */
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
const appelant = req => { const m = /^Bearer (?:jeton-|lien\.)([0-9a-f-]{36})/.exec(req.headers()["authorization"] || ""); return m ? m[1] : null; };
async function repondre(r, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue();
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort(); }   // polices, Google Drive, Calendly… : rien ne sort
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req);
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  db.chemins.push(m + " " + p);

  /* --- comptes --- */
  if (p.startsWith("/auth/v1/signup")) {   // déclencheur creer_profil : un profil prospect ; la session porte data en user_metadata
    const c = corps() || {}, data = c.data || {}; db.inscriptions.push(clone(c));
    const id = db.inscription.id || PID(99); db.emails[id] = c.email; db.meta[id] = clone(data);
    db.profils.push({ id, prenom: data.prenom || "", nom: data.nom || "", role: "client", statut: "prospect", cree_le: new Date().toISOString() });
    return json(session(id, c.email, data));
  }
  if (p.startsWith("/auth/v1/token")) {
    const c = corps() || {}, r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || ""));
    const id = r1 && r1[1];
    if (!id) return json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
    return json(session(id, db.emails[id] || "", db.meta[id]));
  }
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);   // v56 : testée à part (verif61)
  if (!["GET", "HEAD"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m, corps: corps() });
  if (p.startsWith("/auth/v1/user") && m === "PUT") {   // métadonnées (accord santé) : jamais attendu pendant l'inscription
    const c = corps() || {}; db.majUsers.push(clone(c));
    if (moi && c.data && typeof c.data === "object") db.meta[moi] = Object.assign({}, db.meta[moi] || {}, clone(c.data));
    return json(Object.assign({ id: moi, email: db.emails[moi] || "", role: "authenticated" }, db.meta[moi] ? { user_metadata: clone(db.meta[moi]) } : {}));
  }
  if (p.startsWith("/auth/v1/user")) return moi ? json(Object.assign({ id: moi, email: db.emails[moi] || "", role: "authenticated" }, db.meta[moi] ? { user_metadata: clone(db.meta[moi]) } : {})) : json({ msg: "invalid JWT" }, 401);
  if (p.startsWith("/auth/v1/")) return json({});
  if (p.startsWith("/functions/v1/")) return json({ ok: true });
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/emails_prospects") return json([]);
  /* --- profils : chacun le sien, le coach tous --- */
  if (p === "/rest/v1/profils") {
    const id = (q.get("id") || "").replace(/^eq\./, "");
    if (m === "GET" || m === "HEAD") { let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(colonnes(plage(l), q)); }
    const c = corps() || {}, cible = db.profils.find(x => x.id === id);
    db.ecritures.push({ table: "profils", m, id, corps: clone(c) });
    if (!cible || !(coach || id === moi)) return json([]);
    if (!coach && (("role" in c && c.role !== cible.role) || ("statut" in c && c.statut !== cible.statut))) return json({ code: "P0001", message: "Seul un coach peut changer un rôle ou un statut." }, 400);
    Object.assign(cible, c);
    return json((req.headers()["prefer"] || "").includes("return=representation") ? [cible] : null, 200);
  }
  /* --- donnees --- */
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "", mj = q.get("maj_le");
    const cleEq = o.startsWith("eq.") ? o.slice(3) : null;
    if (m === "GET" || m === "HEAD") {
      db.lectures.push({ par: moi, uid, outil: o, select: q.get("select") || "*" });
      let l = db.donnees.filter(x => coach || (x.user_id === moi && !ILLISIBLES_PROPRIO.includes(x.outil)));
      if (uid) l = l.filter(x => x.user_id === uid);
      return json(colonnes(plage(parOutil(l, o)), q));
    }
    if (m === "POST") {
      let rows = corps(); rows = Array.isArray(rows) ? rows : rows ? [rows] : [];
      const refuse = rows.find(row => !permis(moi, coach, row));
      if (refuse) return json({ code: "42501", message: 'new row violates row-level security policy for table "donnees"' }, 403);
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
    db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq });   // DELETE : jamais attendu, noté
    return json(null, 204);
  }
  if (p === "/rest/v1/bibliotheque") return m === "GET" ? json(coach ? colonnes(plage(clone(F.bibliotheque)), q) : []) : json(null, 204);
  const t = p.replace("/rest/v1/", "");
  if (CATALOGUE[t]) return m === "GET" ? json(colonnes(plage(CATALOGUE[t]), q)) : json(null, 201);
  return json([]);
}

/* ---------- un navigateur (contexte), personne de connectée au départ ----------
   opts : viewport (MOBILE par défaut), langue ("en"), theme ("clair" : mhx_theme = light rangé sur l'appareil, l'ancien
   choix « clair », ignoré depuis la v80 ; sombre par défaut) */
async function contexte(b, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || MOBILE });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, db));
  await c.addInitScript(({ langue, clair }) => {
    if (!/^https?:$/.test(location.protocol)) return;
    if (!localStorage.getItem("__init")) {   // l'appareil n'est préparé qu'une fois : le rechargement après l'inscription le garde
      localStorage.setItem("__init", "1");
      localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
      if (langue) localStorage.setItem("mhx_langue", langue);
      if (clair) localStorage.setItem("mhx_theme", "light");
    }
  }, { langue: opts.langue || "", clair: opts.theme === "clair" });
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return { c, page };
}
const attendre = (page, ms) => page.waitForTimeout(ms);
async function pret(page){
  await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 });
  await attendre(page, 400);
}
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.table === "donnees" && e.outil === outil && (!uid || e.user_id === uid));
const resume = db => JSON.stringify(db.ecritures.map(e => (e.table === "donnees" ? e.outil : e.table) + ":" + e.m));
const contenu0 = (db, uid, outil) => (db.donnees.find(d => d.user_id === uid && d.outil === outil) || {}).contenu;
const drive = () => Array.from(externes).filter(h => /(^|\.)google\.com$/.test(h));
const autresHotes = () => Array.from(externes).filter(h => !/^fonts\.(googleapis|gstatic)\.com$/.test(h));

/* ---------- les textes attendus : brief V2, section A, puis v81 docs/maj-blocs-1-2/TEXTES.md (font foi), mot pour mot ----------
   v81 : titre et sous-titre = ceux de l'écran Compte du parcours ; la case des conditions et son message inchangés ;
   newsletter : le nouveau texte de la case (version 2026-10-13) ; suivant : le bouton de l'écran Compte ; bouton (celui
   qui crée le compte) et note (mention médicale) : l'écran WhatsApp ; jours : plus aucun « 14 jours » (TEXTES.md) */
const TXA = {
  fr: {
    titre: "Ton espace est prêt 🔒",
    sous: "Crée ton compte pour le débloquer et le garder.",
    cgu: "J'ai 18 ans ou plus et j'accepte les CGU et la politique de confidentialité.",
    lien_cgu: "CGU", lien_politique: "politique de confidentialité",
    news: "Je veux recevoir les conseils et les offres de MHX Coaching par email.",
    rester: "Rester connecté",
    suivant: "Continuer",
    bouton: "Débloquer mon espace",
    note: "L’app ne remplace pas un avis médical. Si tu as un doute sur ta santé, parles-en à un professionnel avant de commencer.",
    manque: "Coche la case des conditions pour continuer.",
    jours: /14 jours/i,
    sante: /données de santé|traitement de mes données/i
  },
  en: {
    titre: "Your space is ready 🔒",
    sous: "Create your account to unlock it and keep it.",
    cgu: "I'm 18 or older and I accept the Terms of Use and the Privacy Policy.",
    lien_cgu: "Terms of Use", lien_politique: "Privacy Policy",
    news: "I want to get tips and offers from MHX Coaching by email.",
    rester: "Stay logged in",
    suivant: "Continue",
    bouton: "Unlock my space",
    note: "The app doesn’t replace medical advice. If you have any doubt about your health, talk to a professional before you start.",
    manque: "Tick the terms box to continue.",
    jours: /14 days|14 jours/i,
    sante: /health data|données de santé/i
  }
};
const V_NEWS = "2026-10-13", V_NEWS_PROFIL = "2026-09-28c";   // v76 : case newsletter « MHX Coaching » ; v81 : texte de la case du parcours (2026-10-13)
const CLES_DATA = "conditions_version,consentement,newsletter,newsletter_version,nom,prenom";

/* l'écran du parcours affiché (v81 : l'écran Compte porte ce que portait l'écran unique d'inscription ; #pc, data-etape) */
const ecran = page => page.evaluate(() => {
  const t = s => { const x = document.querySelector(s); return x ? x.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null; };
  const lab = id => { const x = document.getElementById(id), l = x && x.closest("label"); return l ? l.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null; };
  const lien = id => { const x = document.getElementById(id); if (!x) return null;
    return { tag: x.tagName, cls: x.className, t: x.textContent, href: x.getAttribute("href"), target: x.getAttribute("target"), rel: x.getAttribute("rel"),
      dans: !!x.closest("label.co-cgu > span") }; };
  const span = document.querySelector("label.co-cgu > span"), pc = document.getElementById("pc"), pg = document.querySelector("#pc .pc-progres");
  const cases = Array.from(document.querySelectorAll("#pc input[type=checkbox]")).map(i => ({ id: i.id, coche: i.checked, attr: i.hasAttribute("checked") }));
  return { etape: pc ? pc.getAttribute("data-etape") : null, progres: pg ? pg.getAttribute("aria-valuenow") : null,
    titre: t("#pc h1"), sous: t("#pc .pc-sous-titre"), cgu: lab("c-cgu"), news: lab("c-newsletter"), rester: lab("c-rester"), suivant: t("#pc-suivant"),
    cases, sante: !!document.getElementById("c-sante"), liens: [lien("c-cgu-lien"), lien("c-politique-lien")],
    dansCase: span ? Array.from(span.querySelectorAll("a, button, span")).map(x => x.tagName + "#" + x.id) : null,
    fin: span && span.lastChild ? { type: span.lastChild.nodeType, data: span.lastChild.nodeType === 3 ? span.lastChild.data : null, avant: span.lastChild.previousSibling ? span.lastChild.previousSibling.id || span.lastChild.previousSibling.nodeName : null } : null,
    theme: document.documentElement.getAttribute("data-theme"), texte: document.body.innerText };
});
/* v81 : l'écran WhatsApp du parcours (le bouton qui crée le compte, la mention médicale) */
const ecranWhatsapp = page => page.evaluate(() => {
  const t = s => { const x = document.querySelector(s); return x ? x.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null; };
  const pc = document.getElementById("pc"), pg = document.querySelector("#pc .pc-progres");
  return { etape: pc ? pc.getAttribute("data-etape") : null, progres: pg ? pg.getAttribute("aria-valuenow") : null, bouton: t("#c-go"), note: t("#pc .pc-note") };
});
/* v81 : le parcours ouvert à #/inscription (adresse de l'ancien écran unique), mené par FT.parcours jusqu'à l'écran Compte,
   sans rien toucher sur lui */
async function versCompte(page, url, r){
  await page.goto(url + "#/inscription");
  await FT.parcours(page, Object.assign({ prenom: "Zoé" }, r || {}), "compte");
  await page.waitForSelector('#pc[data-etape="compte"] #c-cgu');
}

/* le point final et la dernière lettre du 2e lien : même ligne ? (Range), défilement horizontal ?
   v81 : « dans la carte » = dans la case des conditions de l'écran Compte (label.co-cgu, la boîte en verre qui porte le texte,
   à l'intérieur de #pc) au lieu de .carte-co (l'ancien écran unique) */
async function mesurer(page, largeur){
  const vp = page.viewportSize();
  await page.setViewportSize({ width: largeur, height: vp ? vp.height : 844 });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  return page.evaluate(() => {
    const a = document.getElementById("c-politique-lien");
    if (!a) return { absent: true };
    const dernier = n => { for (let i = n.childNodes.length - 1; i >= 0; i--) { const c = n.childNodes[i]; if (c.nodeType === 3 && c.data.length) return c; if (c.nodeType === 1) { const d = dernier(c); if (d) return d; } } return null; };
    const tn = dernier(a), pt = a.nextSibling;
    if (!tn || !pt || pt.nodeType !== 3 || !pt.data.length) return { sansPoint: true, apres: pt ? pt.nodeName : null };
    const rect = (n, i, j) => { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, j); const l = Array.from(r.getClientRects()).filter(x => x.width > 0 || x.height > 0); const q = l[l.length - 1]; return q ? { top: Math.round(q.top * 10) / 10, bottom: Math.round(q.bottom * 10) / 10, left: Math.round(q.left * 10) / 10, right: Math.round(q.right * 10) / 10 } : null; };
    const lettre = rect(tn, tn.data.length - 1, tn.data.length), point = rect(pt, 0, 1);
    const boite = a.closest("#pc label.co-cgu");
    if (!boite) return { horsCase: true, lettre, point, texte: pt.data };
    const carte = boite.getBoundingClientRect();
    return { lettre, point, texte: pt.data, carteD: Math.round(carte.right), sw: document.documentElement.scrollWidth, iw: window.innerWidth };
  });
}
const memeLigne = m => !!(m && m.lettre && m.point && m.texte === "." && Math.abs(m.lettre.top - m.point.top) <= 2 && Math.abs(m.lettre.bottom - m.point.bottom) <= 2
  && m.point.left >= m.lettre.right - 1 && m.point.right <= m.carteD && m.sw <= m.iw);

/* couleurs : le lien doré du thème, souligné, lisible sur ce qu'il y a derrière lui
   v80 : la carte est en verre semi-transparent (rgba, transparente sur téléphone) : le fond comparé est la couleur
   réellement vue, chaque fond de la carte et de ses parents (alpha compris) composé sur le fond opaque du body (#07090d).
   v81 : plus de .carte-co ; les couches partent du lien lui-même et remontent jusqu'au body exclu (le lien, sa phrase, la
   case en verre .pc-case de l'écran Compte, #pc…), chacune avec son alpha, composées sur le fond opaque du body : la case
   en verre éclaircit le fond, la règle n'en est pas plus facile */
const couleurs = page => page.evaluate(() => {
  const rgb = s => { const m = /rgba?\(([^)]+)\)/.exec(s || ""); return m ? m[1].split(",").slice(0, 3).map(x => +x.trim()) : null; };
  const rgba = s => { const m = /rgba?\(([^)]+)\)/.exec(s || ""); if (!m) return null; const p = m[1].split(",").map(x => +x.trim()); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const hex = s => { const m = /^#([0-9a-f]{6})$/i.exec(String(s || "").trim()); return m ? [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)) : null; };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const fondVu = x => {
    const couches = [];   // du lien jusqu'au body exclu
    for (let n = x; n && n !== document.body && n !== document.documentElement; n = n.parentElement) couches.push(rgba(getComputedStyle(n).backgroundColor));
    let fond = rgb(getComputedStyle(document.body).backgroundColor);   // le fond opaque de la page
    if (fond) for (const k of couches.reverse()) if (k) fond = fond.map((v, i) => k[i] * k[3] + v * (1 - k[3]));
    return fond;
  };
  const accent = hex(getComputedStyle(document.documentElement).getPropertyValue("--accent"));
  return ["c-cgu-lien", "c-politique-lien"].map(id => {
    const x = document.getElementById(id); if (!x) return null;
    const cs = getComputedStyle(x), c = rgb(cs.color), fond = fondVu(x);
    const L1 = c ? lum(c) : 0, L2 = fond ? lum(fond) : 0, contraste = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    return { id, couleur: c, accent, dore: !!c && !!accent && c.join() === accent.join(), souligne: /underline/.test(cs.textDecorationLine), contraste: Math.round(contraste * 100) / 100, display: cs.display,
      dansPc: !!x.closest("#pc label.pc-case"), fond: fond ? fond.map(v => Math.round(v * 10) / 10) : null };
  });
});

/* remplit l'écran Compte du parcours (email, mot de passe), sans toucher aux cases ; v74 : plus de champ Nom ; v81 : le
   prénom est donné à l'écran Prénom (versCompte) */
async function remplir(page, f){
  await page.fill("#c-email", f.email); await page.fill("#c-mdp", f.mdp || "motdepasse1");
}

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF70_PORT=9861 node verif70.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();
  const URL0 = `http://localhost:${PORT}/`;

  /* =================== A0. verrou de publication (sans navigateur) =================== */
  await bloc("A0. verrou de publication", async () => {
    const fonctions = ["verrouLegaux", "legauxManquants", "legauxEcarts", "problemeLien", "modeLegaux", "brancheGit", "forcerLegaux", "valeursLegales", "listes"].filter(n => typeof FT[n] !== "function");
    const dossier = path.dirname(HTML);
    /* js/config.js tel qu'il est sur le disque (jamais une retouche de suite) */
    let conf = "", confIllisible = "";
    try { conf = fs.readFileSync(path.join(dossier, "js", "config.js"), "utf8"); } catch (e) { confIllisible = "js/config.js illisible (" + (e.code || e.message) + ")"; }
    /* le verrou : le texte de la page et de ses fichiers (source) ET js/config.js exécuté dans un bac à sable (valeurs réelles = valeurs lues) */
    {
      const pb = fonctions.length ? ["fichiers.js sans " + fonctions.join(", ")]
        : FT.verrouLegaux(FT.source(HTML), conf).concat(confIllisible ? [confIllisible] : [],
          FT.listes(fs.readFileSync(HTML, "utf8")).includes("js/config.js") ? [] : ["la page ne charge plus js/config.js (MHX_JS)"]);
      const branche = fonctions.length ? "" : FT.brancheGit(dossier), mode = fonctions.length ? "strict" : FT.modeLegaux(process.env, branche);
      const tolere = !fonctions.length && mode === "branche" && pb.length > 0;
      ok("A0 : verrou de publication — liens des 2 PDF (CGU, politique de confidentialité) et version des CGU renseignés et valides dans js/config.js, lus sur le disque, et les mêmes quand js/config.js est exécuté"
        + (tolere ? " — branche de travail « " + (String(process.env.GITHUB_REF || "").replace(/^refs\/heads\//, "") || branche) + " » : toléré ; à compléter avant de publier (main : rouge) : " + pb.join(" ; ") : ""),
        !fonctions.length && (pb.length === 0 || mode === "branche"),
        "mode " + mode + " (" + (String(process.env.BANC_LEGAUX || "").trim() ? "BANC_LEGAUX=" + String(process.env.BANC_LEGAUX).trim()
          : String(process.env.GITHUB_REF || "").trim() ? "GITHUB_REF=" + String(process.env.GITHUB_REF).trim() : "branche git « " + (branche || "illisible") + " »") + ") : " + pb.join(" ; "));
    }
    /* la règle, sur des js/config.js fabriqués (exécutables) et sur le config.js de la page (disque) */
    {
      /* identifiants réalistes (25 à 44 caractères), tirés à chaque passage : écrits dans aucun fichier des suites */
      const idReel = n => ("1" + require("crypto").randomBytes(48).toString("base64url")).slice(0, n);
      const [I1, I2, I3, I4, I5, I6, I7, I8] = [33, 44, 33, 25, 28, 24, 33, 33].map(idReel);
      const DRIVE = "https://drive.google.com/file/d/";
      /* cgu_version : au plus aujourd'hui (UTC, au lancement : T0) + 366 jours, calculé ici sans fichiers.js */
      const jourPlus = n => new Date(Math.floor(T0 / J) * J + n * J).toISOString().slice(0, 10), BORNE = jourPlus(366), APRES_BORNE = jourPlus(367);
      const C = DRIVE + I1 + "/view?usp=sharing", P = "https://docs.google.com/document/d/" + I2 + "/edit?usp=sharing", V = "2026-10-01";
      /* un lien réaliste écrit dans CETTE suite (30 caractères, sans TEST) : une valeur de test des suites, jamais publiable */
      const LEURRE = "https://drive.google.com/file/d/1LeUrReVeRiF70NeJaMaIsPuBlIeR0/view";
      const LEGAUX_71 = { cgu_pdf: "https://drive.google.com/file/d/TEST-CGU-71/view", confidentialite_pdf: "https://drive.google.com/file/d/TEST-POLITIQUE-71/view", cgu_version: "2026-10-01" };
      /* un js/config.js complet et exécutable : corps de textes_legaux, texte avant la clé, code après l'objet */
      const prog = (corps, avant, apres) => "const CONFIG = {\n  marque: { nom: \"MHX Coaching\" },\n" + (avant || "") + "  textes_legaux: {\n" + corps + "\n  },\n  gratuit_barre: [\"accueil\"]\n};\n" + (apres || "");
      const corps = (a, b2, c, q) => [["cgu_pdf", a], ["confidentialite_pdf", b2], ["cgu_version", c]].map(([k, v]) => "    " + (q ? q(k, v) : k + ": " + JSON.stringify(v))).join(",\n");
      const texte = (a, b2, c, apres) => prog(corps(a, b2, c), "", apres);
      const commentaire = "  // cgu_pdf: " + JSON.stringify(C) + ", confidentialite_pdf: " + JSON.stringify(P) + ", cgu_version: " + JSON.stringify(V) + "\n";
      /* Vr(t) : le verrou sur un js/config.js seul ; Vr(t, conf) : t = la source d'une page, conf = son js/config.js */
      const d = {}, Vr = (x, conf) => fonctions.length ? ["?"] : FT.verrouLegaux(x, conf === undefined ? x : conf, T0);
      /* du code d'un AUTRE fichier de la page qui LIT CONFIG.textes_legaux sans le modifier (comparaisons, lecture prudente) */
      const lecteur = "\nconst v = CONFIG.textes_legaux.cgu_version, o = { a: (CONFIG.textes_legaux || {}).cgu_pdf, b: 1 };\n"
        + "if (CONFIG.textes_legaux.cgu_version >= \"2026-10-01\" && CONFIG.textes_legaux.cgu_pdf !== \"\" && CONFIG[\"textes_legaux\"].cgu_version == v && x <= CONFIG.textes_legaux.cgu_version) {}\n";
      /* décision de Lucas du 30/09 (en attendant un lien par fichier) : le lien du DOSSIER Drive qui contient les 2 PDF, le même
         pour les deux emplacements (drive.google.com/drive/folders/<id>, avec ou sans ?usp=…, ou suivi d'un « / ») */
      const DOSSIER = id => "https://drive.google.com/drive/folders/" + id;
      d.complet = [[texte(C, P, V)], [texte("https://drive.google.com/open?id=" + I3, "https://drive.google.com/uc?id=" + I5 + "&export=download", "2027-01-15")],
        [texte(DRIVE + I4, "https://docs.google.com/document/d/" + I2, BORNE)], [texte(C, P, V) + lecteur, texte(C, P, V)],
        [texte(DOSSIER(I3) + "?usp=drive_link", DOSSIER(I3) + "?usp=drive_link", V)], [texte(DOSSIER(I3), DOSSIER(I3) + "/", V)]]
        .map(([t, conf]) => Vr(t, conf)).filter(pb => pb.length);   // [] attendu (version = la borne : acceptée ; un autre fichier qui lit seulement)
      d.aCompleter = Vr(texte("à compléter", "à compléter", "à compléter")).length;   // 3 attendus
      const deuxTests = pb => pb.length === 2 && /^cgu_pdf « .* lien de test/.test(pb[0]) && /^confidentialite_pdf « .* lien de test/.test(pb[1]);
      /* chaque cas : [js/config.js (ou la source de la page), la raison attendue dans ce que le verrou refuse, js/config.js
         de cette page si la source est plus que lui] */
      const modele = (id, raison) => [texte(DRIVE + id + "/view", P, V), new RegExp("^cgu_pdf « .* ressemble à un exemple .*" + raison)];
      const insere = x => I7.slice(0, 11) + "-" + x + "-" + I7.slice(12);   // « -x- » au milieu d'un identifiant réaliste : le « - » (ni lettre ni chiffre) empêche le motif de déborder sur le tirage aléatoire
      const t0 = texte(C, P, V), ailleurs = code => [t0 + "\n" + code + "\n", /CONFIG\.textes_legaux modifié hors de js\/config\.js/, t0];
      const refuses = {
        http: [texte(C.replace("https:", "http:"), P, V), /pas un lien https/], autreHote: [texte("https://exemple.fr/cgu.pdf", P, V), /pas un lien https/],
        sosie: [texte("https://drive.google.com.exemple.fr/file/d/" + I3 + "/view", P, V), /pas un lien https/], javascript: [texte("javascript:alert(1)", P, V), /pas un lien/],
        /* le dossier Drive (décision de Lucas du 30/09) : accepté (d.complet), mais jamais celui d'un compte (/u/0/), ni sur
           docs.google.com, ni un sous-chemin ; mêmes refus que pour un fichier (test, trop court, modèle, déjà lié ailleurs) ;
           le même identifiant en dossier ET en fichier (ou 2 fichiers identiques : identiques, memeDocument) reste refusé */
        dossierCompte: [texte("https://drive.google.com/drive/u/0/folders/" + I3, P, V), /chemin non accepté/],
        dossierDocs: [texte("https://docs.google.com/drive/folders/" + I3, P, V), /chemin non accepté/],
        dossierSousChemin: [texte(DOSSIER(I3) + "/x", P, V), /chemin non accepté/], dossierVide: [texte(DOSSIER(""), P, V), /identifiant de document illisible/],
        dossierTest: [texte(DOSSIER("TEST-" + I1), DOSSIER("TEST-" + I1), V), deuxTests], dossierCourt: [texte(DOSSIER(I6), DOSSIER(I6), V), /^cgu_pdf « .* trop court.* \| confidentialite_pdf « .* trop court/],
        dossierModele: [texte(DOSSIER("REMPLACER-PAR-LE-LIEN-DU-DOSSIER"), P, V), /^cgu_pdf « .* ressemble à un exemple .*aucune minuscule/],
        dossierEtFichier: [texte(DOSSIER(I1), DRIVE + I1 + "/view", V), /même document/], fichierEtDossier: [texte(C, DOSSIER(I1) + "?usp=drive_link", V), /même document/],
        /* relecture : un dossier seulement s'il est le MÊME pour les deux (ni 2 dossiers différents, ni un dossier avec un fichier) */
        dossierEtAutreFichier: [texte(DOSSIER(I3) + "?usp=sharing", P, V), pb => pb.length === 1 && /un dossier Drive n'est accepté que le MÊME .* un dossier et un fichier/.test(pb[0])],
        fichierEtAutreDossier: [texte(C, DOSSIER(I3), V), pb => pb.length === 1 && /un dossier Drive n'est accepté que le MÊME .* un dossier et un fichier/.test(pb[0])],
        deuxDossiers: [texte(DOSSIER(I3), DOSSIER(I8) + "?usp=drive_link", V), pb => pb.length === 1 && /un dossier Drive n'est accepté que le MÊME .* 2 dossiers différents/.test(pb[0])],
        dossierRessource: [texte(DOSSIER(I7), DOSSIER(I7), V) + "\nconst GUIDE = " + JSON.stringify(DRIVE + I7 + "/view") + ";\n", pb => pb.length === 2 && pb.every(x => / : ce document .* déjà lié ailleurs dans le site/.test(x)), texte(DOSSIER(I7), DOSSIER(I7), V)],
        formulaire: [texte("https://docs.google.com/forms/d/" + I3 + "/viewform", P, V), /chemin non accepté/],
        horsNorme: [texte("https://Drive.google.com/file/d/" + I3 + "/view", P, V), /forme non standard/],
        espace: [texte(" " + C, P, V), /caractère interdit/], insecable: [texte(C.replace("/view", " /view"), P, V), /caractère interdit/],
        invisible: [texte(DRIVE + I1.slice(0, 9) + "​" + I1.slice(9) + "/view", P, V), /caractère interdit/],
        invisibleEncode: [texte(DRIVE + I1 + "%E2%80%8B/view", P, V), /identifiant de document illisible/],
        idCourt: [texte(DRIVE + I6 + "/view", P, V), /trop court/], idUneLettre: [texte(DRIVE + "x" + "/view", P, V), /trop court/],
        /* relecture du verrou : identifiants « modèles » (écrits à la main, jamais donnés par Google Drive), chacun pour sa raison */
        modeleMajuscules: modele("REMPLACER-PAR-LE-LIEN-DU-PDF", "aucune minuscule"), modeleACompleter: modele("ID_DU_PDF_DES_CGU_A_COMPLETER", "aucune minuscule"),
        modeleChiffres: modele("1".repeat(25), "aucune minuscule"), modeleSoulignes: modele("_".repeat(25), "aucune minuscule"),
        sansMinuscule: modele(I7.toUpperCase(), "aucune minuscule"), modeleRepete: modele("x".repeat(33), "aucune majuscule"),
        sansMajuscule: modele(I7.toLowerCase(), "aucune majuscule"), modeleVotre: modele("VotreIdentifiantDeDocumentIci", "aucun chiffre"),
        sansChiffre: modele(I7.replace(/[0-9]/g, "k"), "aucun chiffre"), repete: modele(insere("QQQQQ"), "5 caractères identiques"),
        suiteLettres: modele(insere("AbCdEf"), "suite « AbCdEf »"), suiteInverse: modele(insere("zYxWvU"), "suite « zYxWvU »"),
        suiteChiffres: modele(insere("456789"), "suite « 456789 »"), suiteChiffresInverse: modele(insere("987654"), "suite « 987654 »"),
        ancienExemple: modele("1AbCdEfGhIjKlMnOpQrStUvWxYz012345", "suite"), ancienExemple2: modele("9ZyXwVuTsRqPoNmLkJiHgFeDcBa98765", "suite"),
        exemplePrefixe: modele("EXEMPLE-" + I7, "mot « EXEMPLE »"),
        ...Object.fromEntries(["Example", "sample", "Complet", "REMPLAC", "PlaceHolder", "votre", "COLLER", "paste", "Dummy", "Identifiant", "DOCUMENT", "qwerty", "AZERTY"]
          .map(w => ["mot" + w, modele(insere(w), "mot « " + w.toUpperCase() + " »")])),
        suffixeTest: [texte(C, DRIVE + I8 + "-TEST/view", V), /^confidentialite_pdf « .* lien de test/], testColle: [texte(DRIVE + "TESTCGU" + I8 + "/view", P, V), /^cgu_pdf « .* lien de test/],
        /* relecture du verrou : le document d'une ressource de la formation (ou de tout autre lien du site) */
        ressourceDuSite: [prog(corps(DRIVE + I7 + "/view", P, V), "  ressources: [{ u: " + JSON.stringify(DRIVE + I7 + "/view?usp=sharing") + " }],\n"),
          pb => pb.length === 1 && /^cgu_pdf : ce document .* déjà lié ailleurs dans le site/.test(pb[0])],
        ressourceAutreFichier: [t0 + "\nconst GUIDE = " + JSON.stringify("https://drive.google.com/open?id=" + I2) + ";\n",
          pb => pb.length === 1 && /^confidentialite_pdf : ce document .* déjà lié ailleurs dans le site/.test(pb[0]), t0],
        /* relecture du verrou : CONFIG.textes_legaux modifié dans un AUTRE fichier de la page (ou un <script> de index.html) */
        reaffectationAutreFichier: ailleurs('CONFIG.textes_legaux.cgu_pdf = "à compléter";'), reaffectationCrochets: ailleurs('CONFIG["textes_legaux"]["cgu_version"] = "2026-10-02";'),
        reaffectationAjout: ailleurs('CONFIG.textes_legaux.cgu_pdf += "&x=1";'), alias: ailleurs('const T = CONFIG.textes_legaux; T.confidentialite_pdf = "à compléter";'),
        objetRemplace: ailleurs("CONFIG.textes_legaux = {};"), assignAilleurs: ailleurs("Object.assign(CONFIG.textes_legaux, { cgu_version: v });"),
        definePropertyAilleurs: ailleurs('Object.defineProperty(CONFIG, "textes_legaux", { value: {} });'), reflectSet: ailleurs('Reflect.set(CONFIG.textes_legaux, "cgu_pdf", "");'),
        suppression: ailleurs("delete CONFIG.textes_legaux;"), configRemplace: ailleurs("window.CONFIG = Object.assign({}, CONFIG, { textes_legaux: {} });"),
        assignAlias: ailleurs("const T = CONFIG.textes_legaux;\nObject.assign(T, { cgu_version: v });"), configRemplaceSeul: ailleurs("window.CONFIG = JSON.parse(s);"),
        valeursDeTest: [texte(LEGAUX_TEST.cgu_pdf, LEGAUX_TEST.confidentialite_pdf, V), deuxTests],
        valeursDeTest71: [texte(LEGAUX_71.cgu_pdf, LEGAUX_71.confidentialite_pdf, V), deuxTests],
        copieDUneSuite: [texte(C, LEURRE, V), /confidentialite_pdf .*lien de test .*verif70\.js/],
        prefixeTest: [texte(DRIVE + "TEST-" + I1 + "/view", P, V), /lien de test/], prefixeTestMinuscules: [texte(C, DRIVE + "test_" + I2 + "/view", V), /lien de test/],
        identiques: [texte(C, C, V), /même document/], memeDocument: [texte(C, DRIVE + I1 + "/preview", V), /même document/],
        veille: [texte(C, P, "2026-09-30"), /cgu_version/], an2100: [texte(C, P, "2100-01-01"), /cgu_version/], lointaine: [texte(C, P, "9999-12-31"), /cgu_version/],
        apresLaBorne: [texte(C, P, APRES_BORNE), /^cgu_version « .* au plus tard le /], an2099: [texte(C, P, "2099-12-31"), /^cgu_version « /],   // relecture : aujourd'hui + 366 jours au plus
        dateImpossible: [texte(C, P, "2026-02-30"), /cgu_version/], dateCourte: [texte(C, P, "2026-10-1"), /cgu_version/],
        dateEnLettres: [texte(C, P, "1er octobre 2026"), /cgu_version/], vide: [texte(C, P, ""), /cgu_version/],
        deuxFois: [texte(C, P, V).replace('cgu_version: "' + V + '"', 'cgu_version: "' + V + '",\n    cgu_version: "2026-10-02"'), /cgu_version : 2 valeur/],
        absente: [texte(C, P, V).replace(/,\n *cgu_version: "[^"]*"/, ""), /cgu_version : 0 valeur/],
        apostrophes: [texte(C, P, V).replace(/cgu_pdf: "([^"]*)"/, "cgu_pdf: '$1'"), /cgu_pdf : 0 valeur/],
        commentaireApostrophes: [prog(corps("à compléter", "à compléter", "à compléter", (k, v) => k + ": '" + v + "'"), commentaire), /cgu_pdf : valeur exécutée/],
        commentaireSansEspace: [prog(corps("à compléter", "à compléter", "à compléter", (k, v) => k + ":" + JSON.stringify(v)), commentaire), /cgu_pdf : valeur exécutée/],
        commentaireCleGuillemets: [prog(corps("à compléter", "à compléter", "à compléter", (k, v) => JSON.stringify(k) + ": " + JSON.stringify(v)), commentaire), /cgu_version : valeur exécutée/],
        reaffectation: [texte(C, P, V, 'CONFIG.textes_legaux.cgu_pdf = "à compléter";\n'), /cgu_pdf : valeur exécutée/],
        reaffectationObjet: [texte(C, P, V, "Object.assign(CONFIG.textes_legaux, { cgu_version: 'à compléter' });\n"), /cgu_version : valeur exécutée/],
        echappement: [texte(C, P, V).replace(I1 + "/view", I1 + "\\u002Fview"), /cgu_pdf : valeur exécutée/],
        nonExecutable: [texte(C, P, V, "}\n"), /bac à sable/]
      };
      d.refuses = Object.keys(refuses).filter(k => { const [t, att, conf] = refuses[k], pb = Vr(t, conf); return !pb.length || !(typeof att === "function" ? att(pb) : att.test(pb.join(" | "))); })
        .map(k => k + " → " + JSON.stringify(Vr(refuses[k][0], refuses[k][2])));   // chacun refusé pour la bonne raison : liste vide attendue
      /* les deux modes */
      const Mo = (env, br) => fonctions.length ? "?" : FT.modeLegaux(env, br);
      const modes = [
        [{ GITHUB_REF: "refs/heads/main" }, "v2/v64", "strict"], [{ GITHUB_REF: "refs/heads/v2/v64" }, "main", "branche"],
        [{ GITHUB_REF: "refs/heads/v2/simu-main-verrou" }, undefined, "strict"], [{ GITHUB_REF: "refs/heads/v2/simu-main" }, undefined, "strict"],
        [{ GITHUB_REF: "refs/heads/v2/SIMU-MAIN-x" }, undefined, "strict"], [{ GITHUB_REF: "refs/tags/v64" }, undefined, "strict"],
        [{ GITHUB_REF: "refs/pull/3/merge" }, undefined, "strict"], [{ GITHUB_REF: "refs/heads/v2/v64", BANC_LEGAUX: "strict" }, undefined, "strict"],
        [{ BANC_LEGAUX: "strict" }, "v2/v64", "strict"], [{ BANC_LEGAUX: "branche" }, "v2/v64", "strict"], [{ BANC_LEGAUX: "branche" }, "main", "strict"],
        [{}, "main", "strict"], [{}, "HEAD", "strict"], [{}, "", "strict"], [{}, "v2/v64", "branche"], [{ GITHUB_REF: "" }, "v2/v64", "branche"],
        [{}, "v2/simu-main-x", "strict"], [{}, "v2/simu-main", "strict"], [{}, "v2/Simu-Main-y", "strict"], [{}, "v2/", "strict"], [{}, "v2", "strict"], [{}, "travail/v2/x", "strict"]
      ];
      d.modes = modes.filter(([env, br, att]) => Mo(env, br) !== att).map(([env, br, att]) => JSON.stringify(env) + " " + br + " → " + Mo(env, br) + " (attendu " + att + ")");
      /* le config.js de la page (disque) : servi avec les valeurs de test des suites (forcerLegaux) → refusé pour ses 2 liens de
         test, et seulement pour eux ; avec des liens réalistes → complet (il s'exécute seul dans le bac à sable) ; « à compléter » → 3 */
      const servi = forcerLegaux(conf, LEGAUX_TEST);
      d.servi = fonctions.length ? null : { test: Vr(servi), test71: Vr(forcerLegaux(conf, LEGAUX_71)), reel: Vr(forcerLegaux(conf, { cgu_pdf: C, confidentialite_pdf: P, cgu_version: V })),
        aCompleter: Vr(forcerLegaux(conf, LEGAUX_A_COMPLETER)).length,
        lus: FT.LEGAUX.every(n => JSON.stringify(FT.valeursLegales(servi, n)) === JSON.stringify([LEGAUX_TEST[n]]) && FT.valeursLegales(conf, n).length === 1) };
      const serviOk = !!d.servi && deuxTests(d.servi.test) && deuxTests(d.servi.test71) && d.servi.reel.length === 0 && d.servi.aCompleter === 3 && d.servi.lus;
      /* la page ENTIÈRE (index.html et tous ses fichiers, lus sur le disque) avec son js/config.js rempli : des liens réalistes →
         complet (aucun faux refus des règles « ressemble à un exemple », « déjà lié ailleurs », « modifié hors de js/config.js ») ;
         chaque lien Google Drive écrit ailleurs dans le site (les PDF de la formation) : un vrai identifiant, publiable seul
         (problemeLien : aucun faux refus), mais refusé comme lien des CGU, pour cette seule raison */
      let siteOk = false;
      if (!fonctions.length) {
        const avec = v => { const c2 = forcerLegaux(conf, v);
          return { c2, src: FT.source(HTML, f => f === "js/config.js" ? c2 : fs.readFileSync(f === "index.html" ? HTML : path.join(dossier, f), "utf8")) }; };
        const vide = avec(LEGAUX_A_COMPLETER).src;
        const liens = Array.from(new Set(Array.from(vide.matchAll(/https:\/\/(?:drive|docs)\.google\.com\/[A-Za-z0-9._~:\/?#=&%+-]*/g), m => m[0])));
        const r = avec({ cgu_pdf: C, confidentialite_pdf: P, cgu_version: V });
        d.site = { reel: FT.verrouLegaux(r.src, r.c2, T0), liens: liens.length,
          refusSeul: liens.map(l => [l, FT.problemeLien(l)]).filter(x => x[1]),
          accepteCommeCgu: liens.map(l => { const a = avec({ cgu_pdf: l, confidentialite_pdf: P, cgu_version: V }), pb = FT.verrouLegaux(a.src, a.c2, T0); return [l, pb]; })
            .filter(([l, pb]) => !(pb.length === 1 && /^cgu_pdf : ce document .* déjà lié ailleurs dans le site/.test(pb[0]))) };
        siteOk = d.site.liens > 0 && d.site.reel.length === 0 && !d.site.refusSeul.length && !d.site.accepteCommeCgu.length;   // des liens Drive du site trouvés (sinon la règle « déjà lié ailleurs » ne protégerait rien)
      }
      ok("A0 : règle du verrou — liens réalistes acceptés (…/file/d/, …/document/d/, open?id=, uc?id=, identifiants de 25 à 44 caractères ; version jusqu'à aujourd'hui + 366 jours inclus ; un autre fichier qui lit seulement CONFIG.textes_legaux) ; refusés, chacun pour sa raison : « à compléter », http://, autre hôte (même sosie), javascript:, dossier Drive d'un compte (/u/0/), sur docs.google.com, sous-chemin, vide, de test, trop court, modèle, déjà lié ailleurs, même identifiant qu'un fichier, 2 dossiers différents, un dossier avec un autre fichier (v64 : seul le MÊME dossier Drive pour les deux est accepté — décision de Lucas du 30/09), formulaire, forme non standard, espace, espace insécable, caractère invisible (U+200B, même encodé), identifiant court (24 caractères, 1 lettre), identifiant « modèle » (sans minuscule, sans majuscule ou sans chiffre, 5 caractères identiques, suite abcdef / zyxwvu / 456789 / 987654, mots EXEMPLE, EXAMPLE, SAMPLE, COMPLET, REMPLAC, PLACEHOLDER, VOTRE, COLLER, PASTE, DUMMY, IDENTIFIANT, DOCUMENT, QWERTY, AZERTY, anciens exemples de cette suite), valeurs de test des suites (LEGAUX_TEST, TEST-…-71, lien écrit dans une suite, identifiant TEST-/test_/…-TEST/TESTxxx), document d'un autre lien du site (ressource de la formation, dans config.js ou un autre fichier), CONFIG.textes_legaux modifié dans un autre fichier de la page (réaffectation, crochets, +=, alias, objet remplacé, Object.assign, même sur un alias, defineProperty, Reflect.set, delete, window.CONFIG), 2 liens vers le même document, version 2026-09-30 / aujourd'hui + 367 jours / 2099-12-31 / 2100-01-01 / impossible / mal écrite / vide, emplacement écrit 2 fois ou absent, apostrophes, commentaire valide + vraie clé écrite autrement (apostrophes, sans espace, entre guillemets), réaffectation plus loin, échappement, config.js qui ne s'exécute pas ; strict sur main, tag, pull request, v2/simu-main et v2/simu-main-* (toute casse), HEAD détaché, git en échec, BANC_LEGAUX posée ; toléré seulement sur une branche v2/* ; le config.js de la page servi avec les valeurs de test des suites : refusé pour ses 2 liens de test, avec des liens réalistes : complet (exécuté dans le bac à sable) ; la page ENTIÈRE (disque) avec des liens réalistes : complète, et chaque lien Drive du site (PDF de la formation) publiable seul mais refusé comme lien des CGU",
        !fonctions.length && !d.complet.length && d.aCompleter === 3 && !d.refuses.length && !d.modes.length && serviOk && siteOk, fonctions.length ? "fichiers.js sans " + fonctions.join(", ") : JSON.stringify(d));
    }
  });

  /* =================== A1. inscription : écran Compte du parcours (config de test) ===================
     v81 (bloc 2) : l'écran unique « Crée ton espace gratuit » n'existe plus ; #/inscription ouvre le parcours, mené jusqu'à
     l'écran Compte (FT.parcours, versCompte) : textes, cases, liens, couleurs et mesures y sont vérifiés comme avant sur
     l'écran unique ; le bouton qui crée le compte et la mention médicale, à l'écran WhatsApp, atteint à la fin du bloc (la
     ligne des textes vient donc en dernier). */
  /* theme "clair" : l'ancien choix « clair » rangé sur l'appareil (mhx_theme = light), ignoré depuis la v80 (tout en sombre) */
  for (const [langue, theme, vp] of [["fr", "sombre", MOBILE], ["fr", "clair", PETIT], ["en", "sombre", PETIT], ["en", "clair", MOBILE]]) {
    const T = TXA[langue], L = (langue === "en" ? "anglais" : "français") + ", " + (theme === "clair" ? "ancien choix « clair » ignoré (v80)" : "thème " + theme) + ", " + vp.width + " px";
    await bloc("A1. écran d'inscription, écran Compte du parcours (" + L + ")", async () => {
      const db = base();
      const { page } = await contexte(b, db, { viewport: vp, langue: langue === "en" ? "en" : "", theme });
      await versCompte(page, URL0); await attendre(page, 500);
      const e = await ecran(page);
      ok(`inscription (${L}) : écran Compte du parcours — UNE case obligatoire (conditions) + newsletter — exactement ces 2 cases, dans cet ordre, non cochées (sans attribut checked), plus de « ${T.rester} » (v76 : la session reste gardée) ; #c-sante absente, aucun « données de santé » / « health data » à l'écran`,
        JSON.stringify(e.cases) === JSON.stringify([{ id: "c-cgu", coche: false, attr: false }, { id: "c-newsletter", coche: false, attr: false }]) && !e.sante && !T.sante.test(e.texte),
        JSON.stringify(e.cases) + " santé " + e.sante + " " + ((T.sante.exec(e.texte) || [""])[0]));
      const [l1, l2] = e.liens;
      const lienOk = (l, t, href) => !!l && l.tag === "A" && l.t === t && l.href === href && l.target === "_blank" && /(^|\s)noopener(\s|$)/.test(l.rel || "") && l.dans;
      ok(`inscription (${L}) : écran Compte — « ${T.lien_cgu} » et « ${T.lien_politique} » = 2 liens distincts dans la case (href = les 2 PDF de la config servie, target=_blank, rel=noopener), rien d'autre de cliquable dans la case, le point final collé au 2e lien (dernier nœud « . ») ; aucun lien suivi (aucun appel vers Google Drive)`,
        lienOk(l1, T.lien_cgu, LEGAUX_TEST.cgu_pdf) && lienOk(l2, T.lien_politique, LEGAUX_TEST.confidentialite_pdf) && l1.href !== l2.href
          && JSON.stringify(e.dansCase) === '["A#c-cgu-lien","A#c-politique-lien"]' && !!e.fin && e.fin.type === 3 && e.fin.data === "." && e.fin.avant === "c-politique-lien" && !drive().length,
        JSON.stringify({ liens: e.liens, dansCase: e.dansCase, fin: e.fin, drive: drive() }));
      const coul = await couleurs(page);
      ok(`inscription (${L}) : écran Compte — thème sombre appliqué (data-theme absent${theme === "clair" ? ", l'ancien choix « clair » rangé sur l'appareil ignoré" : ""}) ; les 2 liens dorés du thème (--accent${theme === "clair" ? " = le doré du thème sombre, rgb(212, 168, 68)" : ""}), soulignés, en ligne (display inline), contraste ≥ 3 avec le fond réellement vu (chaque fond du lien et de ses parents, la case en verre comprise, composé sur le fond de la page)`,
        e.theme === null && coul.every(x => x && x.dansPc && x.dore && x.souligne && x.display === "inline" && x.contraste >= 3 && (theme !== "clair" || (!!x.accent && x.accent.join() === "212,168,68"))), JSON.stringify({ theme: e.theme, coul }));
      const mesures = {};
      for (const w of LARGEURS) mesures[w] = await mesurer(page, w);
      await page.setViewportSize(vp);
      const faux = LARGEURS.filter(w => !memeLigne(mesures[w]));
      ok(`inscription (${L}) : écran Compte — à ${LARGEURS.join(", ")} px, le point final sur la MÊME ligne que la fin de « ${T.lien_politique} » (Range : même haut et même bas de ligne, juste après), dans la case, aucun défilement horizontal`,
        !faux.length, JSON.stringify(faux.map(w => [w, mesures[w]])));
      /* l'écran WhatsApp (80 %) : le bouton qui crée le compte (jamais touché ici) et la mention médicale */
      await FT.parcours(page, { email: "zoe@exemple.fr" }, "whatsapp"); await attendre(page, 300);
      const w = await ecranWhatsapp(page);
      ok(`inscription (${L}) : textes exacts (TEXTES.md) — écran Compte (70 %) : titre « ${T.titre} », sous-titre « ${T.sous} », case des conditions « ${T.cgu} » (inchangée), newsletter « ${T.news} », bouton « ${T.suivant} », plus de « ${T.rester} » (v76) ni de « 14 jours » ; écran WhatsApp (80 %) : bouton qui crée le compte « ${T.bouton} » (rien d'envoyé sans le toucher), mention médicale « ${T.note.slice(0, 40)}… »`,
        e.etape === "compte" && e.progres === "70" && e.titre === T.titre && e.sous === T.sous && e.cgu === T.cgu && e.news === T.news && e.suivant === T.suivant
          && e.rester === null && !e.texte.includes(T.rester) && !T.jours.test(e.texte)
          && w.etape === "whatsapp" && w.progres === "80" && w.bouton === T.bouton && w.note === T.note && db.inscriptions.length === 0,
        JSON.stringify({ etape: e.etape, progres: e.progres, titre: e.titre, sous: e.sous, cgu: e.cgu, news: e.news, suivant: e.suivant, rester: e.rester, jours: (T.jours.exec(e.texte) || [""])[0], whatsapp: w, inscriptions: db.inscriptions.length }));
    });
  }

  /* =================== A1. config « à compléter » (branche de travail) : les mots sans lien (écran Compte du parcours) =================== */
  for (const langue of ["fr", "en"]) {
    const T = TXA[langue], L = langue === "en" ? "anglais" : "français";
    await bloc("A1. écran d'inscription « à compléter », écran Compte du parcours (" + L + ")", async () => {
      const vus = [];
      for (const valeurs of langue === "fr" ? [LEGAUX_A_COMPLETER, Object.assign({}, LEGAUX_A_COMPLETER, { cgu_pdf: "javascript:alert(document.domain)", confidentialite_pdf: "data:text/html,x" })] : [LEGAUX_A_COMPLETER]) {
        await avecLegaux(valeurs, async () => {
          const db = base();
          const { c, page } = await contexte(b, db, { viewport: PETIT, langue: langue === "en" ? "en" : "" });
          await versCompte(page, URL0); await attendre(page, 500);
          const e = await ecran(page), m = await mesurer(page, 320);
          vus.push({ valeurs: valeurs.cgu_pdf, etape: e.etape, cgu: e.cgu, liens: e.liens, dansCase: e.dansCase, fin: e.fin, m, cases: e.cases.map(x => x.id), a: await page.evaluate(() => document.querySelectorAll("label.co-cgu a").length) });
          await c.close();
        });
      }
      const spanOk = (l, t) => !!l && l.tag === "SPAN" && /(^|\s)lien-absent(\s|$)/.test(l.cls) && l.t === t && l.href === null && l.target === null && l.dans;
      ok(`inscription (${L}, 320 px) : écran Compte du parcours, liens « à compléter »${langue === "fr" ? " (ou javascript: / data:)" : ""} → « ${T.lien_cgu} » et « ${T.lien_politique} » sans lien (span.lien-absent, mêmes id, même texte « ${T.cgu} »), aucun <a> dans la case, point final collé et sur la même ligne, une seule case obligatoire`,
        vus.length > 0 && vus.every(v => v.etape === "compte" && v.cgu === T.cgu && spanOk(v.liens[0], T.lien_cgu) && spanOk(v.liens[1], T.lien_politique) && v.a === 0 && !!v.fin && v.fin.data === "." && v.fin.avant === "c-politique-lien"
          && memeLigne(v.m) && JSON.stringify(v.cases) === '["c-cgu","c-newsletter"]'),
        JSON.stringify(vus));
    });
  }

  /* =================== A2. inscription de bout en bout par le parcours : une seule case, data exact, copie emails, Profil ===================
     (theme "clair" : l'ancien choix « clair » rangé sur l'appareil, ignoré depuis la v80)
     v81 (bloc 2) : prénom à l'écran Prénom, cases à l'écran Compte (« Continuer »), compte créé à l'écran WhatsApp
     (« Débloquer mon espace »), arrivée sur « Ton espace » (page rechargée, session ouverte : plus le questionnaire de
     l'app) ; le Profil, après « Ton espace » et le cadeau (« Plus tard »), depuis l'accueil de l'app */
  for (const [langue, news, theme, version, k] of [["fr", false, "sombre", LEGAUX_TEST.cgu_version, 1], ["en", true, "clair", "2026-10-15", 2]]) {
    const T = TXA[langue], L = langue === "en" ? "anglais" : "français", Q = news ? "avec la newsletter" : "sans la newsletter";
    await bloc("A2. inscription en " + L, async () => {
      await avecLegaux(Object.assign({}, LEGAUX_TEST, { cgu_version: version }), async () => {
        const ZID = PID(10 + k), mail = "zoe" + k + "@exemple.fr";
        const db = base(); db.inscription.id = ZID;
        const { page } = await contexte(b, db, { viewport: MOBILE, langue: langue === "en" ? "en" : "", theme });
        await versCompte(page, URL0, { prenom: "Zoé" }); await attendre(page, 400);   // v81 : le prénom à l'écran Prénom
        await remplir(page, { email: mail });   // v74 : plus de champ Nom
        /* sans la case des conditions : refus, message exact, on reste sur l'écran Compte, aucun appel ; même refus avec la
           seule newsletter (« Continuer » a l'air inactif, aria-disabled : touché quand même, force) */
        const sansCgu = async () => {
          await page.click("#pc-suivant", { force: true }); await attendre(page, 300);
          return { m: norm(await page.textContent("#pc-err-cgu").catch(() => "")), ici: await page.$eval("#pc", x => x.dataset.etape).catch(() => "") };
        };
        const r1 = await sansCgu();
        await page.check("#c-newsletter");
        const r2 = await sansCgu();
        const refus = { m1: r1.m, m2: r2.m, ici: [r1.ici, r2.ici], appels: db.chemins.filter(x => /\/auth\/v1\//.test(x)), inscriptions: db.inscriptions.length };
        if (!news) await page.uncheck("#c-newsletter");
        /* un tap sur le TEXTE de la case (pas sur un lien) la coche */
        await page.click("label.co-cgu > span", { position: { x: 4, y: 6 } }); await attendre(page, 150);
        const coche = await page.evaluate(() => { const x = document.getElementById("c-cgu"); return x ? x.checked : null; });
        if (!coche) await page.check("#c-cgu").catch(() => {});
        const cases = await page.evaluate(() => Array.from(document.querySelectorAll("#pc input[type=checkbox]")).filter(i => i.checked).map(i => i.id));
        /* « Continuer » → l'écran WhatsApp ; « Débloquer mon espace » (FT.parcours : France, un numéro de la plage réservée à
           la fiction) crée le compte ; l'app recharge la page (location.reload) : un nouveau document, sans la marque posée
           ici, sur l'écran « Ton espace » */
        await page.click("#pc-suivant"); await page.waitForSelector('#pc[data-etape="whatsapp"] #c-go');
        const avantCreation = db.inscriptions.length;
        await page.evaluate(() => { window.__avantInscription = true; });
        const t0 = Date.now();
        await FT.parcours(page, { tel: "063998007" + k }, "cree");
        const recharge = await page.waitForFunction(() => !window.__avantInscription && !!document.querySelector('#pc[data-etape="espace"]'), null, { timeout: 12000 }).then(() => true, () => false);
        await attendre(page, 2500);
        const apres = await page.evaluate(() => ({ etape: (document.getElementById("pc") || { dataset: {} }).dataset.etape || null, connecte: Auth.connecte(), prospect: Auth.estProspect(), id: (Auth.utilisateur() || {}).id,
          local: (JSON.parse(localStorage.getItem("mhx_session") || "null") || { user: {} }).user.id || null, erreur: (document.getElementById("co-err") || {}).textContent || "" })).catch(e => ({ erreur: String(e) }));
        ok(`inscription en ${L} (parcours) : à l'écran Compte, sans la case des conditions, « ${T.suivant} » → « ${T.manque} », on reste sur l'écran Compte, aucun appel, même avec la newsletter cochée ; un tap sur le texte de la case la coche ; cette SEULE case obligatoire suffit (${Q} ; plus de « ${T.rester} », v76) : à l'écran WhatsApp, « ${T.bouton} » crée le compte sans accord santé (1 appel, aucun avant ce toucher), la page rechargée arrive sur « Ton espace » (prospect connecté, session gardée sur l'appareil)`,
          refus.m1 === T.manque && refus.m2 === T.manque && refus.ici.every(x => x === "compte") && refus.appels.length === 0 && refus.inscriptions === 0 && coche === true
            && JSON.stringify(cases) === JSON.stringify(news ? ["c-cgu", "c-newsletter"] : ["c-cgu"])
            && avantCreation === 0 && db.inscriptions.length === 1 && recharge === true && apres.etape === "espace" && apres.connecte === true && apres.prospect === true && apres.id === ZID && apres.local === ZID,
          JSON.stringify({ refus, coche, cases, avantCreation, inscriptions: db.inscriptions.length, recharge, apres }));

        const c0 = db.inscriptions[0] || {}, md = c0.data || {}, cles = Object.keys(md).sort().join(",");
        const vus = await page.evaluate(() => ({ cgu: (CONFIG.textes_legaux || {}).cgu_version, conditions: (DECOUVERTE.accords || {}).conditions, news: (DECOUVERTE.accords || {}).newsletter })).catch(e => ({ erreur: String(e) }));
        ok(`… POST /auth/v1/signup : data = EXACTEMENT ${CLES_DATA} — prénom « Zoé » (écran Prénom), nom vide (v74 : plus de champ Nom), consentement = instant ISO du clic sur « ${T.bouton} », conditions_version « ${version} » (valeur servie = CONFIG.textes_legaux.cgu_version = DECOUVERTE.accords.conditions), newsletter ${news ? "= le même instant ISO" : "null"}, newsletter_version « ${V_NEWS} » (= DECOUVERTE.accords.newsletter, v81) ; ni consentement_sante ni sante_version ; aucun appel hors de la page, du faux Supabase et des polices`,
          cles === CLES_DATA && c0.email === mail && c0.password === "motdepasse1" && md.prenom === "Zoé" && md.nom === "" && isoPres(md.consentement, t0)
            && md.conditions_version === version && vus.cgu === version && vus.conditions === version
            && (news ? (isoPres(md.newsletter, t0) && md.newsletter === md.consentement) : md.newsletter === null)
            && md.newsletter_version === V_NEWS && vus.news === V_NEWS && !autresHotes().length,
          JSON.stringify({ cles, email: c0.email, md, vus, hotes: autresHotes() }));

        const E1 = ecr(db, "emails", ZID), att = { newsletter: news, maj: news ? md.newsletter : md.consentement, version: V_NEWS, source: "inscription" };
        const sante = db.ecritures.filter(x => x.table === "donnees" && ["mens", "calc_perso", "calc"].includes(x.outil));
        ok(`… première ouverture (« Ton espace ») : la clé emails recopiée comme avant (Accords.copierEmails), une fois, exactement ${JSON.stringify(Object.assign({}, att, { maj: news ? "<instant de la newsletter>" : "<instant du consentement>" }))} ; aucune donnée de santé écrite, aucune métadonnée santé envoyée (aucun PUT /auth/v1/user)`,
          E1.length === 1 && JSON.stringify(E1[0].contenu) === JSON.stringify(att) && !sante.length && db.majUsers.length === 0 && !db.chemins.some(x => x === "PUT /auth/v1/user"),
          JSON.stringify({ emails: E1.map(x => x.contenu), sante: sante.length, majUsers: db.majUsers }) + " · " + resume(db));

        /* le Profil garde son interrupteur : état d'après la copie, un changement écrit la version du Profil
           v81 : « Ton espace » (« Entrer dans mon espace ») puis le cadeau (« Plus tard ») : la page rechargée sur l'accueil de
           l'app (appPrete) ; puis le Profil */
        await page.click("#pc-suivant").catch(() => {});
        await page.waitForSelector('#pc[data-etape="cadeau"] #pc-plus-tard', { timeout: 8000 }).catch(() => {});
        await page.click("#pc-plus-tard").catch(() => {});
        const accueil = await page.waitForFunction(() => location.hash === "#/accueil" && !document.getElementById("pc") && typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 12000 }).then(() => true, () => false);
        await attendre(page, 400);
        await page.evaluate(() => { location.hash = "#/profil"; });
        await page.waitForSelector("#mc-emails-bloc", { timeout: 10000 }).catch(() => {});
        await page.waitForFunction(() => { const x = document.getElementById("mc-emails"); return !!x && !x.disabled; }, null, { timeout: 8000 }).catch(() => {});
        const etat0 = await page.$eval("#mc-emails", x => ({ c: x.checked, d: x.disabled })).catch(() => null);
        const n0 = ecr(db, "emails", ZID).length, tBascule = Date.now();
        await page.click("#mc-emails-bloc label.switch").catch(() => {}); await attendre(page, 1500);
        const E2 = contenu0(db, ZID, "emails") || {}, etat1 = await page.$eval("#mc-emails", x => ({ c: x.checked, d: x.disabled })).catch(() => null);
        const vp2 = await page.evaluate(() => (DECOUVERTE.accords || {}).newsletter_profil).catch(() => null);
        const attendu2 = Object.assign({ newsletter: !news, maj: E2.maj, version: V_NEWS_PROFIL, source: "profil" }, news ? { suivi: false } : {});
        ok(`… Profil (atteint après « Ton espace » et le cadeau, « Plus tard », depuis l'accueil de l'app) : l'interrupteur « Newsletter » garde son rôle — ${news ? "coché" : "décoché"} d'après la copie de l'inscription (version ${V_NEWS}), un tap écrit { newsletter: ${!news}, maj, version « ${V_NEWS_PROFIL} » (DECOUVERTE.accords.newsletter_profil), source « profil »${news ? ", suivi: false" : ""} }, une écriture`,
          accueil === true && !!etat0 && etat0.c === news && etat0.d === false && E1.length === 1 && (E1[0].contenu || {}).version === V_NEWS && vp2 === V_NEWS_PROFIL
            && ecr(db, "emails", ZID).length === n0 + 1 && JSON.stringify(E2) === JSON.stringify(attendu2) && isoPres(E2.maj, tBascule) && !!etat1 && etat1.c === !news,
          JSON.stringify({ accueil, hash: await page.evaluate(() => location.hash).catch(() => null), etat0, etat1, E2, vp2, n: ecr(db, "emails", ZID).length - n0 }));
      });
    });
  }

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
