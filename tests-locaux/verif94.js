/* verif94 — v94 (BROUILLON : traduction de la Formation, à relire par Lucas, 09/11/2026) : la Formation en anglais, dans un vrai
   navigateur (infrastructure de verif93 : Supabase simulé, comptes fictifs, aucune donnée réelle).
   A. client en anglais : #/formation parcourue module par module (0 à 6), chaque leçon ouverte, chaque challenge ouvert :
      aucun texte visible resté en français (données retirées) ;
   B. prospect en anglais : les cartes du haut (« Start here », aperçu) et les modules : même chose ;
   C. les 2 leçons : en anglais, leur version anglaise (html_en) ; en français, le texte d'origine, inchangé ; la version
      anglaise a la même structure (titres, paragraphes, listes, tableaux, questions) ;
   D. le dictionnaire : chaque texte de FORMATION et de LECONS (hors identifiants, liens et vidéos) a sa traduction ;
   Z. aucune erreur de console ni erreur JS, aucun dialogue natif, aucun appel vers l'extérieur.
   Usage : node verif94.js ../index.html     (VERIF94_PORT=10096 si 10094 est pris ; VERIF94_BLOCS="A.,C." ; VERIF94_TOUT=1) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF94_PORT || 10094;
const BLOCS = (process.env.VERIF94_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const MOBILE = { width: 390, height: 844 }, ORDI = { width: 1280, height: 900 };

/* ---------- les textes légaux SERVIS (CONFIG.textes_legaux de js/config.js) : la suite remplace les 3 valeurs dans le
   fichier servi (jamais sur le disque) ; les valeurs de test ---------- */
const NOMS_LEGAUX = ["cgu_pdf", "confidentialite_pdf", "cgu_version"];
/* verif88 (bloc F) : le lien Instagram de la marque servi tel quel (null) ou remplacé dans le config.js servi (jamais sur le disque) */
let INSTA = null;
const LEGAUX_TEST = { cgu_pdf: "https://drive.google.com/file/d/TEST-CGU-91/view", confidentialite_pdf: "https://drive.google.com/file/d/TEST-POLITIQUE-91/view", cgu_version: "2026-10-15" };
let LEGAUX = LEGAUX_TEST;
/* la valeur entre guillemets collée à « nom: » (la première occurrence : il n'y en a qu'une, bloc 0) */
const motifLegal = (n, g) => new RegExp("\\b(" + n + ": )\"([^\"\\n]*)\"", g ? "g" : "");
function poserLegaux(texte, valeurs){ let t = String(texte); for (const n of NOMS_LEGAUX) t = t.replace(motifLegal(n), (x, a) => a + JSON.stringify(String(valeurs[n]))); return t; }

/* ---------- la page servie : le fichier testé (page, css/ et js/), config.js avec les textes légaux de la suite ---------- */
const { servirFichier, source } = require("./fichiers");
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML, t => { t = poserLegaux(t, LEGAUX); if (INSTA !== null) t = t.replace(/(\binstagram: )"https:[^"]*"/, (x, a) => a + JSON.stringify(INSTA)); return t; })) return;
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
const ouverts = [];   // les contextes du bloc en cours : fermés à la fin du bloc, même s'il s'arrête en route
const blocsLances = [];
async function bloc(nom, fn){
  if (BLOCS.length && !BLOCS.some(x => nom.startsWith(x))) return;
  blocsLances.push(nom);
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); LEGAUX = LEGAUX_TEST; }
}

/* ---------- dates : l'horloge de chaque navigateur part de T0 = midi (heure locale) du jour du lancement ---------- */
const T0 = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d.getTime(); })(), MIN = 60000, H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
/* texte comparé : espaces (insécables comprises) resserrées */
const norm = t => String(t == null ? "" : t).replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim();


/* ---------- les personnes ---------- */
const MDP = "MotDePasse-fictif-91";
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + 90 * J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: clone(meta) } : {}) });
const qui = (id, email, meta) => ({ id, email, session: session(id, email, meta) });
const COACH = qui(F.IDS.coach, "coach@exemple.fr", { prenom: "Coach", nom: "Démo" }), THOMAS = qui(F.IDS.c1, "thomas@exemple.fr", { prenom: "Thomas", nom: "Démo" });
const PID = k => "00000000-0000-4000-8000-0000000094" + String(k).padStart(2, "0");   // verif94 : …94kk (une plage par suite)
const EMAIL = k => "p" + k + "@exemple.fr";
/* métadonnées d'un prospect inscrit en v64 (une seule case : conditions, newsletter non cochée ; AUCUN accord santé) */
const META_V64 = () => ({ prenom: "Léa", nom: "Martin", consentement: avant(3 * J), conditions_version: "2026-10-01", newsletter: null, newsletter_version: "2026-09-30" });
/* le choix de la newsletter déjà recopié dans la clé emails (Accords.copierEmails n'écrit donc rien au démarrage) */
const EMAILS0 = { newsletter: false, maj: avant(3 * J), version: "2026-09-30", source: "inscription" };
const AVEC_CHOIX = k => ({ probleme: "Perdre du gras", obstacle_choix: ["temps", "craquages"], obstacle: "Le manque de temps · Je craque sur la nourriture",
  projection_choix: ["photos"], projection: "M'aimer sur les photos", objectif: "Perte de poids / sèche", objectif_auto: "Perte de poids / sèche",
  court_debut: avant(3 * J), court_le: avant(3 * J - 5 * MIN), email_compte: EMAIL(k), bilan_propose: { choix: "plus_tard", le: avant(3 * J - 4 * MIN) } });
/* un prospect : opts.meta (métadonnées du compte en base ; META_V64 par défaut), opts.intake (ajouté au questionnaire),
   opts.donnees (en plus de intake et emails) */
const compte = (k, opts) => { opts = opts || {}; return { id: PID(k), prenom: "Léa", nom: "Martin", cree: avant(4 * J), email: EMAIL(k), meta: opts.meta === undefined ? META_V64() : opts.meta,
  donnees: [["intake", Object.assign(AVEC_CHOIX(k), opts.intake || {})], ["emails", EMAILS0]].concat(opts.donnees || []) }; };
/* la session de l'appareil : par défaut, les métadonnées d'un inscrit v64 (sans accord) */
const quiP = (k, meta) => qui(PID(k), EMAIL(k), meta === undefined ? META_V64() : meta);
/* le compte client de test est lu dans le fichier servi (CONFIG.nouveautes.comptes_test : un identifiant, jamais un email) */
const SRC = source(HTML);
const TEST_ID = (/comptes_test:\s*\[\s*"([0-9a-f-]{36})"/.exec(SRC) || [])[1] || null;

/* ---------- le décor : fixtures.js (coach, clients) + les comptes du bloc ----------
   comptes : [{ id, prenom, nom, statut ("prospect" par défaut), cree, email, meta, donnees: [[outil, contenu, maj_le]] }] */
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { if (p.role !== "coach") p.statut = "client"; });
  const donnees = clone(F.donnees);
  const db = { profils, donnees, ecritures: [], refus: [], lectures: [], authUser: [], connexions: [], renouvellements: [], bloquees: [],
    emails: { [F.IDS.coach]: "coach@exemple.fr", [F.IDS.c1]: "thomas@exemple.fr", [F.IDS.c2]: "sarah@exemple.fr", [F.IDS.c3]: "julien@exemple.fr" },
    meta: { [F.IDS.coach]: { prenom: "Coach", nom: "Démo" }, [F.IDS.c1]: { prenom: "Thomas", nom: "Démo" }, [F.IDS.c2]: { prenom: "Sarah", nom: "Démo" }, [F.IDS.c3]: { prenom: "Julien", nom: "Démo" } },
    panneToken: false, panneLecture: null, panneEcriture: null, retardEcriture: 0, ecrituresRatees: [],
    panneGet: null, pannePut: null, retardPut: 0, retardGet: 0, retardMajLe: null, majLeLents: [],
    /* n : numéro d'ordre commun aux lectures et aux écritures de donnees (qui passe avant qui) ; getsLents : les réponses
       des GET /auth/v1/user retardés (métadonnées LUES À L'ARRIVÉE de la requête) ; putsFinis : l'instant de chaque réponse
       réussie d'un PUT /auth/v1/user */
    n: 0, getsLents: [], putsFinis: [] };
  for (const x of opts.comptes || []) {
    profils.push({ id: x.id, prenom: x.prenom, nom: x.nom || "", role: "client", statut: x.statut || "prospect", cree_le: x.cree || avant(J) });
    if (x.email) db.emails[x.id] = x.email;
    db.meta[x.id] = clone(x.meta || {});
    for (const [outil, contenu, maj] of x.donnees || []) donnees.push({ user_id: x.id, outil, contenu: clone(contenu), maj_le: maj || avant(H) });
  }
  return db;
}

/* ---------- le faux Supabase (gabarit de verif68) + les métadonnées du compte ---------- */
const MAX_LIGNES = 1000;
/* règles de la base (HANDOFF §2.3, policies v49). Une migration qui change une règle change ces listes dans le même chantier. */
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
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "donnees", f), "utf8"));
const CATALOGUE = Object.assign({}, F.catalogue, { aliments: lireDonnees("aliments.json"), recettes: lireDonnees("recettes.json") });
async function repondre(r, who, db, appareil){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue();
  if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" }).catch(() => {});
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort().catch(() => {}); }   // polices, vignettes… : rien ne sort
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  /* appareil hors ligne (couper) : la requête ne part pas (le gestionnaire de routes de Playwright répond même quand le
     contexte est hors ligne : c'est donc ici qu'elle échoue, sans jamais atteindre le serveur) */
  if (appareil && appareil.horsLigne) { db.bloquees.push(m + " " + p); return r.abort("internetdisconnected").catch(() => {}); }
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req) || (who && who.id) || null;
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  /* jetons : connexion par mot de passe (les métadonnées de la base) ; renouvellement (idem) — jamais comptés comme écriture */
  if (p.startsWith("/auth/v1/token")) {
    const c = corps() || {};
    if (q.get("grant_type") === "password") {
      /* verif91 (bloc H) : la vérification du mot de passe en panne (500) tant que db.panneToken est vrai */
      if (db.panneToken) return json({ message: "panne simulée" }, 500);
      const e = String(c.email || "").trim().toLowerCase(); db.connexions.push(e);
      const id = Object.keys(db.emails).find(x => db.emails[x] === e);
      if (!id || c.password !== MDP) return json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
      return json(session(id, db.emails[id], db.meta[id]));
    }
    const r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || "")), id = r1 && r1[1];
    db.renouvellements.push(id);
    if (!id) return json({ error: "invalid_grant", error_description: "Invalid Refresh Token" }, 400);
    return json(session(id, db.emails[id] || "", db.meta[id]));
  }
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  /* le compte : GET rend les métadonnées de la base ; PUT { data } les FUSIONNE (null supprime la clé) et les rend. Pannes :
     un statut (400, 500…), "coupure" (réseau coupé), pour le GET "vide" ({}) ou "sans" (sans user_metadata), pour le PUT
     "sans accord" (200, les métadonnées du compte SANS rien fusionner). Lenteurs : retardPut (fusion à la fin du délai),
     retardGet (métadonnées lues à l'ARRIVÉE de la requête, rendues à la fin du délai : une réponse périmée) */
  if (p === "/auth/v1/user") {
    const c = corps();
    db.authUser.push({ m, par: moi, corps: clone(c), q: url.search });
    if (!moi) return json({ msg: "invalid JWT" }, 401);
    const panne = m === "GET" ? db.panneGet : db.pannePut;
    if (panne === "coupure") return r.abort("failed").catch(() => {});
    if (typeof panne === "number") return json({ msg: "panne simulée", code: panne }, panne);
    if (m === "GET" && db.retardGet) {
      const lu = clone(db.meta[moi] || {}), ms = db.retardGet;
      await new Promise(k => setTimeout(k, ms));
      db.getsLents.push({ meta: clone(lu), t: Date.now() });
      return json({ id: moi, email: db.emails[moi] || "", role: "authenticated", user_metadata: lu });
    }
    if (m === "PUT" && db.retardPut) await new Promise(k => setTimeout(k, db.retardPut));
    const meta = db.meta[moi] || (db.meta[moi] = {});
    const uu = { id: moi, email: db.emails[moi] || "", role: "authenticated" };
    if (m === "PUT" && panne === "sans accord") return json(Object.assign(uu, { user_metadata: clone(meta) }));
    if (m === "PUT" && c && c.data && typeof c.data === "object") Object.keys(c.data).forEach(k => { if (c.data[k] === null) delete meta[k]; else meta[k] = clone(c.data[k]); });
    if (m === "PUT") db.putsFinis.push(Date.now());
    if (m === "GET" && panne === "vide") return json({});
    if (m === "GET" && panne === "sans") return json(uu);
    return json(Object.assign(uu, { user_metadata: clone(meta) }));
  }
  if (p.startsWith("/auth/v1/")) return json({});   // logout…
  if (!["GET", "HEAD"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m, corps: corps() });
  if (p.startsWith("/functions/v1/")) return json({ ok: true });
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/emails_prospects") return json([]);
  if (p === "/rest/v1/profils") {
    const id = (q.get("id") || "").replace(/^eq\./, "");
    if (m === "GET" || m === "HEAD") { let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(colonnes(plage(l), q)); }
    const c = corps() || {}, cible = db.profils.find(x => x.id === id);
    db.ecritures.push({ table: "profils", m, id, corps: clone(c) });
    if (!cible || !(coach || id === moi)) { db.refus.push({ table: "profils", m, id }); return json([]); }
    if (!coach && (("role" in c && c.role !== cible.role) || ("statut" in c && c.statut !== cible.statut))) { db.refus.push({ table: "profils", m, id }); return json({ code: "P0001", message: "Seul un coach peut changer un rôle ou un statut." }, 400); }
    Object.assign(cible, c);
    return json((req.headers()["prefer"] || "").includes("return=representation") ? [cible] : null, 200);
  }
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "", mj = q.get("maj_le");
    const cleEq = o.startsWith("eq.") ? o.slice(3) : null;
    if (m === "GET" || m === "HEAD") {
      db.lectures.push({ par: moi, uid, outil: o, select: q.get("select") || "*", n: ++db.n });
      /* verif88 (bloc A) : toute lecture d'une clé en panne (500) tant que db.panneLecture porte son nom */
      if (db.panneLecture && o.includes(db.panneLecture)) return json({ message: "panne simulée" }, 500);
      /* reprise lente (bloc V) : la lecture maj_le d'une clé (celle de Store.reprendre) répond après ms (minuteur qui ne
         retient pas la fin de la suite) ; majLeLents : l'instant de chaque réponse */
      if (db.retardMajLe && (q.get("select") || "") === "maj_le" && o === "eq." + db.retardMajLe.outil) {
        const ms = db.retardMajLe.ms; await new Promise(k => setTimeout(k, ms).unref()); db.majLeLents.push(Date.now());
      }
      let l = db.donnees.filter(x => coach || (x.user_id === moi && !ILLISIBLES_PROPRIO.includes(x.outil)));
      if (uid) l = l.filter(x => x.user_id === uid);
      return json(colonnes(plage(parOutil(l, o)), q));
    }
    /* verif88 (blocs B et C) : toute écriture d'une clé en panne (500, après db.retardEcriture ms) tant que db.panneEcriture porte son nom */
    if ((m === "POST" || m === "PATCH") && db.panneEcriture && (cleEq === db.panneEcriture || String(req.postData() || "").includes('"outil":"' + db.panneEcriture + '"'))) {
      db.ecrituresRatees.push({ m, outil: db.panneEcriture }); if (db.retardEcriture) await new Promise(k => setTimeout(k, db.retardEcriture));
      return json({ message: "panne simulée" }, 500);
    }
    if (m === "POST") {
      let rows = corps(); rows = Array.isArray(rows) ? rows : rows ? [rows] : [];
      const refuse = rows.find(row => !permis(moi, coach, row));
      if (refuse) { db.refus.push({ table: "donnees", m, user_id: refuse.user_id, outil: refuse.outil }); return json({ code: "42501", message: 'new row violates row-level security policy for table "donnees"' }, 403); }
      const upsert = q.has("on_conflict"), out = [];
      for (const row of rows) {
        const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
        if (i > -1 && !upsert) return json({ code: "23505", message: "duplicate key value violates unique constraint" }, 409);
        const ligne = { user_id: row.user_id, outil: row.outil, contenu: clone(row.contenu), maj_le: row.maj_le || new Date().toISOString() };
        if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        db.ecritures.push(Object.assign({ table: "donnees", m, n: ++db.n }, clone(ligne)));
        out.push(ligne);
      }
      return (req.headers()["prefer"] || "").includes("return=representation") ? json(out, 201) : json(null, 201);
    }
    if (m === "PATCH") {
      const c = corps() || {};
      const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj == null || (mj === "is.null" ? !x.maj_le : (mj.startsWith("eq.") && x.maj_le === mj.slice(3)))));
      if (!row) return json([]);
      if (!permis(moi, coach, row)) { db.refus.push({ table: "donnees", m, user_id: uid, outil: cleEq }); return json([]); }
      Object.assign(row, { contenu: clone(c.contenu), maj_le: c.maj_le || new Date().toISOString() });
      db.ecritures.push(Object.assign({ table: "donnees", m }, clone(row)));
      return json([row]);
    }
    db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq });   // DELETE : jamais attendu (zéro perte), noté
    db.donnees = db.donnees.filter(x => !(x.user_id === uid && x.outil === cleEq && permis(moi, coach, x)));
    return json(null, 204);
  }
  if (p === "/rest/v1/bibliotheque") return m === "GET" ? json(coach ? colonnes(plage(clone(F.bibliotheque)), q) : []) : json(null, 204);
  const t = p.replace("/rest/v1/", "");
  if (CATALOGUE[t]) return m === "GET" ? json(colonnes(plage(CATALOGUE[t]), q)) : json(null, 201);
  return json([]);
}

/* ---------- un navigateur (contexte) pour une personne, horloge contrôlée ----------
   opts : viewport (MOBILE par défaut : 390 px), langue ("en"), theme ("light" : un ancien choix « clair » rangé dans
   mhx_theme, que la v80 ignore — tout en sombre ; rien de rangé par défaut), rangement ("session" :
   « Rester connecté » décoché, la session dans sessionStorage) */
const ERREURS = [];   // erreurs de console et erreurs JS de toute la suite (bloc Z)
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || MOBILE });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  const appareil = { horsLigne: false };
  await c.route("**/*", r => repondre(r, who, db, appareil));
  await c.addInitScript(({ s, langue, theme, rangement }) => {
    if (!/^https?:$/.test(location.protocol) || location.hostname !== "localhost") return;
    if (!localStorage.getItem("__init")) {
      localStorage.setItem("__init", "1");
      if (s) (rangement === "session" ? sessionStorage : localStorage).setItem("mhx_session", JSON.stringify(s));
      localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
      if (langue) localStorage.setItem("mhx_langue", langue);
      if (theme) localStorage.setItem("mhx_theme", theme);
    }
  }, { s: who ? who.session : null, langue: opts.langue || "", theme: opts.theme || "", rangement: opts.rangement || "" });
  await c.clock.install({ time: T0 });   // midi du jour du lancement, puis l'horloge tourne
  const page = surveiller(await c.newPage());
  return { c, page, appareil };
}
function surveiller(page){
  page.on("pageerror", e => { ERREURS.push("JS " + String(e).slice(0, 200)); res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)); });
  /* une ressource refusée (4xx/5xx simulés), une requête coupée ou hors ligne (simulés) : le navigateur le note, ce n'est
     pas une erreur de l'app */
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|ERR_INTERNET_DISCONNECTED|status of [45]\d\d/.test(msg.text())) { ERREURS.push("CONSOLE " + msg.text().slice(0, 200)); res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); } });
  page.on("dialog", d => { ERREURS.push("DIALOGUE " + d.message().slice(0, 80)); res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return page;
}

/* ---------- aides ---------- */
const attendre = (page, ms) => page.waitForTimeout(ms);
/* attend (côté suite) qu'une condition sur le faux Supabase devienne vraie ; faux au bout de ms */
const attendreQue = async (f, ms) => { const fin = Date.now() + (ms || 5000); while (Date.now() < fin) { if (f()) return true; await new Promise(r => setTimeout(r, 100)); } return !!f(); };
async function pret(page, sel){
  await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 });
  if (sel) await page.waitForSelector(sel, { timeout: 10000 });
  await attendre(page, 400);
}
const URL0 = `http://localhost:${PORT}/`;
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1500); };
const ACCUEIL = "#/decouverte";   // l'accueil du prospect (#/accueil le mène là)

/* ---------- verif93 : la recherche des textes restés en français ----------
   Ce qui vient des DONNÉES (fixtures, catalogue d'aliments, de recettes, d'exercices et de programmes, saisies des comptes) n'est
   pas un texte de l'app : retiré avant de juger (un nom de recette, une note du coach restent en français, c'est voulu). */
const DATA = new Set();
const ramasser = x => { if (typeof x === "string"){ const t = norm(x); if (t.length >= 3) DATA.add(t); } else if (Array.isArray(x)) x.forEach(ramasser); else if (x && typeof x === "object") Object.values(x).forEach(ramasser); };
ramasser(F.donnees); ramasser(F.profils); ramasser(CATALOGUE); ramasser(F.bibliotheque);
const FR_ACC = /[àâçéèêëîïôûùüœ]/i;
const FR_MOTS = /(^|[\s(«"“])(le|la|les|des|du|une|et|ton|ta|tes|tu|est|pour|avec|dans|sur|pas|vous|votre|cette|mes|mon|ma|ses|aux|au|qui|que|ou|en|ce|de|ça|toi|ici|chez|sans|tous|toutes|semaine|jours?|séances?|repas)(?=$|[\s,.;:!?)»"”…])/i;
const FR_ELISION = /(^|[^a-z])[ldjcnsqt]['’][a-zàâçéèêëîïôûùüœ]/i;
const francais = t => FR_ACC.test(t) || FR_MOTS.test(t) || FR_ELISION.test(t);
/* le texte, une fois retirées les données qu'il contient (les plus longues d'abord), est-il encore du français ? */
function resteFrancais(t, data){
  for (const n of NOMS) t = t.split(n).join(" ");
  if (!francais(t)) return false;
  if (data.has(t)) return false;
  let r = t;
  const dedans = Array.from(data).filter(d => d.length >= 3 && r.includes(d)).sort((a, b) => b.length - a.length);
  for (const d of dedans) r = r.split(d).join(" ");
  r = norm(r);
  return !!r && francais(r);
}
/* textes affichés permis tels quels en anglais, avec leur raison */
const PERMIS = new Map([
  ["Réunion (+262)", "indicatif téléphonique : « Réunion » s'écrit de même en anglais"]
]);
/* noms propres retirés avant de juger un texte (ils restent en français dans une phrase anglaise, c'est voulu) */
const NOMS = ["Organise ta diète"];   // un outil de la Formation, cité par son nom dans le texte de l'accord santé (texte légal versionné)
/* trad("…") du code sans entrée dans I18N.en, avec leur raison */
const SANS_TRADUCTION = new Map([
  ["Fiche client", "écran du coach (toujours en français, v93)"],
  ["dernier : {d}", "écran du coach (fiche)"],
  ["Source", "écran du coach (fiche)"],
  ["WhatsApp", "nom de marque, identique en anglais"],
  ["3. Maintenance", "identique en anglais"]
]);
/* les textes visibles de la page (nœuds de texte et attributs placeholder / aria-label / title), hors [data-notr], champs de
   saisie, toasts ; seulement ce qui est affiché */
const visibles = page => page.evaluate(() => {
  const vis = el => { if (!el || !el.getClientRects().length) return false; const s = getComputedStyle(el); return s.visibility !== "hidden" && s.display !== "none"; };
  const excl = el => !!el.closest("[data-notr],script,style,textarea,noscript,#toasts,select");
  const out = new Set();
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n; while ((n = w.nextNode())){ const p = n.parentElement; if (!p || excl(p) || !vis(p)) continue; const t = n.nodeValue.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim(); if (t) out.add(t); }
  document.querySelectorAll("[placeholder],[aria-label],[title]").forEach(el => { if (excl(el) || !vis(el)) return; ["placeholder", "aria-label", "title"].forEach(a => { const v = el.getAttribute(a); if (v && v.trim()) out.add(v.replace(/\s+/g, " ").trim()); }); });
  document.querySelectorAll("select:not([data-notr]) option").forEach(o => { const s = o.closest("select"); if (s && !s.closest("[data-notr]") && vis(s)){ const t = o.textContent.replace(/\s+/g, " ").trim(); if (t) out.add(t); } });
  return { textes: Array.from(out), lang: document.documentElement.lang, hash: location.hash };
});
/* parcourt des pages ; rend { route: [textes restés en français] } */
async function parcourir(page, routes, data){
  const trouves = {};
  for (const r of routes){
    await aller(page, r, 2200);
    const v = await visibles(page);
    const fr = v.textes.filter(t => !PERMIS.has(t) && resteFrancais(norm(t), data));
    if (fr.length) trouves[r + (v.hash !== r ? " (→ " + v.hash + ")" : "")] = fr;
    if (process.env.VERIF94_TOUT && fr.length) console.error("TROUVÉS " + r + " " + JSON.stringify(fr));
  }
  return trouves;
}
const dataDe = db => { const d = new Set(DATA); const add = x => { if (typeof x === "string"){ const t = norm(x); if (t.length >= 3) d.add(t); } else if (Array.isArray(x)) x.forEach(add); else if (x && typeof x === "object") Object.values(x).forEach(add); }; add(db.donnees); add(db.profils); add(db.meta); return d; };
const resumeTrouves = T => Object.keys(T).map(k => k + " : " + T[k].map(t => "« " + t.slice(0, 90) + " »").join(" ; ")).join(" || ");
const nbTrouves = T => Object.values(T).reduce((n, l) => n + l.length, 0);
const ROUTES_CLIENT = ["#/accueil", "#/programme", "#/journal", "#/nutrition", "#/mensurations", "#/calculateur", "#/suivi", "#/bilan", "#/complements", "#/profil"];
const ROUTES_PROSPECT = ["#/decouverte", "#/programme", "#/journal", "#/nutrition", "#/mensurations", "#/calculateur", "#/suivi", "#/complements", "#/profil", "#/journal-alimentaire"];
const avecPrefsEn = (db, uid) => { const pr = db.donnees.find(d => d.user_id === uid && d.outil === "prefs"); if (pr) pr.contenu = Object.assign({}, pr.contenu, { langue: "en" }); else db.donnees.push({ user_id: uid, outil: "prefs", contenu: { langue: "en" }, maj_le: avant(J) }); };

const ouvrir = async (page, sel) => { const b = await page.$(sel); if (!b) return false; if ((await b.getAttribute("aria-expanded")) !== "true") { await b.click(); await attendre(page, 700); } return true; };
/* la Formation entière, module par module (et chaque leçon, chaque challenge) : { étape: [textes restés en français] } */
async function parcourirFormation(page, data){
  const T = {};
  const noter = async nom => { const v = await visibles(page); const fr = v.textes.filter(t => !PERMIS.has(t) && resteFrancais(norm(t), data)); if (fr.length) T[nom] = fr; if (process.env.VERIF94_TOUT && fr.length) console.error("TROUVÉS " + nom + " " + JSON.stringify(fr)); };
  await noter("formation (haut)");
  const mods = await page.$$eval(".fo-tete[data-mod]", l => l.map(x => x.dataset.mod));
  for (const m of mods){
    await ouvrir(page, `.fo-tete[data-mod="${m}"]`);
    await noter("module " + m);
    const lecons = await page.$$eval(`.fo-tete[data-mod="${m}"]`, l => { const s = l[0] && l[0].closest(".fo-mod"); return s ? Array.from(s.querySelectorAll("[data-lecon]")).map(x => x.dataset.lecon) : []; });
    for (const k of lecons){ await ouvrir(page, `[data-lecon="${k}"]`); await page.evaluate(() => document.querySelectorAll(".fo-lecon-corps details").forEach(d => { d.open = true; })); await noter("module " + m + " · leçon " + k); }
    const chals = await page.$$eval("[data-chal]", l => l.map(x => x.dataset.chal));
    for (const c of chals){ await page.click(`[data-chal="${c}"]`); await attendre(page, 500); await noter("module " + m + " · challenge " + c); }
  }
  return { T, mods };
}

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris : VERIF94_PORT=10096 node verif94.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. client en anglais =================== */
  await bloc("A. Formation, client en anglais", async () => {
    const db = base(); avecPrefsEn(db, F.IDS.c1);
    const { page } = await contexte(b, THOMAS, db, { langue: "en", viewport: ORDI });
    await page.goto(URL0 + "#/accueil"); await pret(page); await attendre(page, 600);
    await aller(page, "#/formation", 2200);
    const nDonnees = () => db.ecritures.filter(e => e.table === "donnees").length, n0 = nDonnees(), e0 = db.ecritures.length;
    const { T, mods } = await parcourirFormation(page, dataDe(db));
    ok("A1 : client en anglais, la Formation entière (" + mods.length + " modules, leçons et challenges ouverts) : aucun texte de l'app resté en français",
      mods.length === 7 && nbTrouves(T) === 0, mods.length + " modules · " + nbTrouves(T) + " : " + resumeTrouves(T));
    ok("A2 : parcourir la Formation (ouvrir modules, leçons, challenges) n'écrit rien en base", nDonnees() === n0, JSON.stringify(db.ecritures.slice(e0).map(e => e.outil || e.table)));
  });

  /* =================== B. prospect en anglais =================== */
  await bloc("B. Formation, prospect en anglais", async () => {
    const k = 1, db = base({ comptes: [compte(k, { donnees: [["prefs", { langue: "en" }]] })] });
    const { page } = await contexte(b, quiP(k), db, { langue: "en", viewport: MOBILE });
    await page.goto(URL0 + ACCUEIL); await pret(page); await attendre(page, 600);
    await aller(page, "#/formation", 2200);
    const { T, mods } = await parcourirFormation(page, dataDe(db));
    ok("B1 : prospect en anglais (téléphone), la Formation entière (cartes du haut, " + mods.length + " modules, leçons, challenges) : aucun texte de l'app resté en français",
      mods.length === 7 && nbTrouves(T) === 0, mods.length + " modules · " + nbTrouves(T) + " : " + resumeTrouves(T));
  });

  /* =================== C. les deux leçons =================== */
  await bloc("C. leçons", async () => {
    const lecon = async (langue, cle, mod) => {
      const db = base(); if (langue === "en") avecPrefsEn(db, F.IDS.c1);
      const { page } = await contexte(b, THOMAS, db, { langue, viewport: ORDI });
      await page.goto(URL0 + "#/accueil"); await pret(page); await aller(page, "#/formation", 2200);
      await ouvrir(page, `.fo-tete[data-mod="${mod}"]`); await ouvrir(page, `[data-lecon="${cle}"]`);
      return page.evaluate(() => { const c = document.querySelector(".fo-lecon-corps"); return c ? { h4: Array.from(c.querySelectorAll("h4")).map(x => x.textContent.trim()), texte: c.textContent.replace(/\s+/g, " ").trim() } : null; });
    };
    const mFr = await lecon("", "mindset", "m1"), mEn = await lecon("en", "mindset", "m1");
    const aFr = await lecon("", "alimentation", "m2"), aEn = await lecon("en", "alimentation", "m2");
    ok("C1 : leçon Mindset : en anglais « The map at a glance » … « Quick answers » ; en français, inchangée (« La carte en un coup d'œil » … « Les réponses rapides »)",
      !!mFr && !!mEn && mEn.h4[0] === "The map at a glance" && mEn.h4[mEn.h4.length - 1] === "Quick answers" && mFr.h4[0] === "La carte en un coup d'œil" && mFr.h4[mFr.h4.length - 1] === "Les réponses rapides" && mEn.h4.length === mFr.h4.length,
      JSON.stringify([mFr && mFr.h4, mEn && mEn.h4]));
    ok("C2 : leçon Alimentation : en anglais « Chapter 1 — The basics » … « The math, in practice » ; en français, inchangée",
      !!aFr && !!aEn && aEn.h4[0] === "Chapter 1 — The basics" && aEn.h4[aEn.h4.length - 1] === "The math, in practice" && aFr.h4[0] === "Chapitre 1 — Les bases" && aEn.h4.length === aFr.h4.length,
      JSON.stringify([aFr && aFr.h4, aEn && aEn.h4]));
    /* même structure : les balises dans l'ordre (sans le texte) */
    const db = base(); const { page } = await contexte(b, THOMAS, db, { viewport: ORDI });
    await page.goto(URL0 + "#/accueil"); await pret(page);
    const st = await page.evaluate(() => Object.keys(LECONS).map(k => { const f = h => { const d = document.createElement("div"); d.innerHTML = h || ""; return Array.from(d.querySelectorAll("*")).map(x => x.tagName + (x.className ? "." + x.className : "")).join(" "); }; return { k, egal: !!LECONS[k].html_en && f(LECONS[k].html) === f(LECONS[k].html_en), fr: f(LECONS[k].html).length, en: f(LECONS[k].html_en).length }; }));
    ok("C3 : chaque leçon a sa version anglaise avec exactement la même structure (mêmes balises, mêmes classes, dans le même ordre)", st.length === 2 && st.every(x => x.egal), JSON.stringify(st));
  });

  /* =================== D. le dictionnaire =================== */
  await bloc("D. dictionnaire de la Formation", async () => {
    const db = base(); avecPrefsEn(db, F.IDS.c1);
    const { page } = await contexte(b, THOMAS, db, { langue: "en", viewport: ORDI });
    await page.goto(URL0 + "#/accueil"); await pret(page);
    const r = await page.evaluate(() => {
      const out = [], vus = new Set(), a = k => Object.prototype.hasOwnProperty.call(I18N.en, k);
      const ok = s => { const n = Traduction.norm(s); return a(s) || a(n) || I18N.motifs.some(([re]) => re.test(n)); };
      const IGNORES = /^(id|video|lecons|widgets|lien|html|html_en|url)$/;
      const walk = (x, chemin, cle) => {
        if (typeof x === "string"){ if (IGNORES.test(cle || "") || /^https?:/.test(x) || /^[a-z]{1,2}\d+[a-z]?$/.test(x) || !/[a-zàâçéèêëîïôûùüœ]/i.test(x) || vus.has(x)) return; vus.add(x); if (!ok(x)) out.push(chemin); }
        else if (Array.isArray(x)) x.forEach((y, i) => walk(y, chemin + "[" + i + "]", cle));
        else if (x && typeof x === "object") Object.keys(x).forEach(k => walk(x[k], chemin + "." + k, k));
      };
      walk(FORMATION, "FORMATION"); walk(LECONS, "LECONS"); walk(JOURS_SEM, "JOURS_SEM"); walk(REPAS_SEM, "REPAS_SEM");
      return out;
    });
    ok("D1 : chaque texte de FORMATION et de LECONS (hors identifiants, liens, vidéos et contenu des leçons) a sa traduction", r.length === 0, r.length + " : " + r.slice(0, 15).join(" ; "));
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
