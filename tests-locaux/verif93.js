/* verif93 — v93 (traductions, 09/11/2026) : la langue et les textes, dans un vrai navigateur (infrastructure de verif91 : Supabase
   simulé, comptes fictifs « pNN@exemple.fr » et clients des fixtures, aucune donnée réelle).
   A. la langue du coach est celle de SON compte, jamais celle laissée sur l'appareil : sur un appareil resté en anglais, sans
      choix sur son compte, son espace s'ouvre en français (lang="fr") et identique à celui d'un appareil en français (menu,
      tableau de bord, fiche, diète, programme, suivi, atelier), fenêtres de l'objet UI, témoin, « Pas de connexion » en
      français ; dans une fiche, son bouton de langue explique où la changer ; depuis son tableau de bord, son choix de
      l'anglais est rangé sur son compte et gardé ;
   B. C. D. E. client, prospect, compte de test et écrans sans compte, EN ANGLAIS : chaque page parcourue, aucun texte visible de
      l'app resté en français (les données — recettes, aliments, exercices, notes, saisies — sont retirées avant de juger ; la
      Formation est hors de cette suite : sa traduction est un chantier à part) ; un nouveau texte visible sans sa paire dans
      I18N.en fait échouer la suite ;
   Z. aucune erreur de console ni erreur JS, aucun dialogue natif, aucun appel vers l'extérieur.
   Usage : node verif93.js ../index.html
           VERIF93_PORT=10094 node verif93.js ../index.html     (autre port, si 10093 est pris)
           VERIF93_BLOCS="B.,C." node verif93.js …               (seulement les blocs dont le nom commence ainsi)
           VERIF93_TOUT=1 node verif93.js …                      (liste complète des textes trouvés, sur la sortie d'erreur) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF93_PORT || 10093;
const BLOCS = (process.env.VERIF93_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
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
const PID = k => "00000000-0000-4000-8000-0000000093" + String(k).padStart(2, "0");   // verif93 : …93kk (une plage par suite)
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
    if (process.env.VERIF93_TOUT && fr.length) console.error("TROUVÉS " + r + " " + JSON.stringify(fr));
  }
  return trouves;
}
const dataDe = db => { const d = new Set(DATA); const add = x => { if (typeof x === "string"){ const t = norm(x); if (t.length >= 3) d.add(t); } else if (Array.isArray(x)) x.forEach(add); else if (x && typeof x === "object") Object.values(x).forEach(add); }; add(db.donnees); add(db.profils); add(db.meta); return d; };
const resumeTrouves = T => Object.keys(T).map(k => k + " : " + T[k].map(t => "« " + t.slice(0, 90) + " »").join(" ; ")).join(" || ");
const nbTrouves = T => Object.values(T).reduce((n, l) => n + l.length, 0);
const ROUTES_CLIENT = ["#/accueil", "#/programme", "#/journal", "#/nutrition", "#/mensurations", "#/calculateur", "#/suivi", "#/bilan", "#/complements", "#/profil"];
const ROUTES_PROSPECT = ["#/decouverte", "#/programme", "#/journal", "#/nutrition", "#/mensurations", "#/calculateur", "#/suivi", "#/complements", "#/profil", "#/journal-alimentaire"];
const avecPrefsEn = (db, uid) => { const pr = db.donnees.find(d => d.user_id === uid && d.outil === "prefs"); if (pr) pr.contenu = Object.assign({}, pr.contenu, { langue: "en" }); else db.donnees.push({ user_id: uid, outil: "prefs", contenu: { langue: "en" }, maj_le: avant(J) }); };

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF93_PORT=10094 node verif93.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. le coach : toujours en français =================== */
  await bloc("A. coach en français", async () => {
    const db = base();
    /* l'appareil est resté en anglais (un compte client essayé en anglais) ; le coach n'a aucune préférence en base */
    const { page } = await contexte(b, COACH, db, { langue: "en", viewport: ORDI });
    await page.goto(URL0 + "#/tableau"); await pret(page, "#tb-vue"); await attendre(page, 800);
    const etat = await page.evaluate(() => ({ lang: document.documentElement.lang, langue: I18N.langue, appareil: localStorage.getItem("mhx_langue"), bouton: (document.getElementById("langue") || {}).textContent }));
    ok("A1 : coach sur un appareil resté en anglais : son espace s'ouvre en français (lang=\"fr\", choix de l'appareil remis à fr, bouton « 🇫🇷 FR » : la langue actuelle, v95)",
      etat.lang === "fr" && etat.langue === "fr" && etat.appareil === "fr" && etat.bouton === "🇫🇷 FR", JSON.stringify(etat));
    /* les mêmes pages, sur un appareil en français : le coach dont l'appareil était en anglais doit voir exactement les mêmes textes */
    const ROUTES_COACH = ["#/tableau", "#/clients", "#/prospects", "#/atelier", "#/client/" + F.IDS.c1 + "/accueil", "#/client/" + F.IDS.c1 + "/nutrition", "#/client/" + F.IDS.c1 + "/programme", "#/client/" + F.IDS.c1 + "/suivi"];
    const lire = async pg => { const o = {}; for (const r of ROUTES_COACH){ await aller(pg, r, 2200); o[r] = new Set((await visibles(pg)).textes); } return o; };
    const enV = await lire(page);
    const { page: pFr } = await contexte(b, COACH, base(), { viewport: ORDI });
    await pFr.goto(URL0 + "#/tableau"); await pret(pFr, "#tb-vue"); await attendre(pFr, 800);
    const frV = await lire(pFr);
    const vus = {};
    for (const r of ROUTES_COACH){ const d = Array.from(enV[r]).filter(t => !frV[r].has(t)); if (d.length) vus[r] = d; }
    ok("A2 : le coach dont l'appareil était en anglais voit exactement les textes d'un coach en français (tableau de bord, clients, prospects, atelier, fiche, diète, programme, suivi) : plus de « Dashboard », « Home », « Their progress »…",
      nbTrouves(vus) === 0 && Object.values(frV).every(x => x.size > 5), resumeTrouves(vus));
    /* une fenêtre de l'objet UI : « Annuler » et le bouton d'accord en français */
    const f = await page.evaluate(async () => { const p = UI.confirmer("Remplacer ?", { ok: "Oui, remplacer" }); await new Promise(k => setTimeout(k, 60)); const t = Array.from(document.querySelectorAll(".fond .modale [data-ui-b]")).map(x => x.textContent.trim()); UI.fermer(false); await p; return t; });
    ok("A3 : fenêtre de confirmation chez le coach : « Annuler » et « Oui, remplacer » (plus « Cancel », « Yes, replace »)", JSON.stringify(f) === '["Annuler","Oui, remplacer"]', JSON.stringify(f));
    /* témoin et « Pas de connexion » */
    const t = await page.evaluate(() => { const r = []; ["enregistrement", "enregistre", "erreur"].forEach(e => { majEtat(e); r.push(document.getElementById("etat").textContent); }); majEtat(""); return r.concat([flagHorsLigne().replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()]); });
    ok("A4 : chez le coach, témoin « Enregistrement… », « Enregistré », « Hors ligne — gardé sur cet appareil, renvoi automatique » et « Pas de connexion … Réessayer » en français",
      t[0] === "Enregistrement…" && t[1] === "Enregistré" && t[2] === "Hors ligne — gardé sur cet appareil, renvoi automatique" && /^Pas de connexion.*Réessayer$/.test(t[3]), JSON.stringify(t));
    /* dans la fiche d'un client (la page est encore sur sa fiche) : le choix ne peut pas être rangé sur le compte du coach, le bouton le dit */
    const prefsCoach = () => db.ecritures.filter(e => e.table === "donnees" && e.outil === "prefs" && e.user_id === F.IDS.coach);
    /* v106 (lot 1) : la langue du coach est dans le volet du rond de profil */
    await page.click("#rond-profil"); await attendre(page, 400); await page.click(".volet [data-mp-langue]"); await attendre(page, 600);
    const apres = await page.evaluate(() => ({ langue: I18N.langue, consulte: !!Store.idConsulte, toast: Array.from(document.querySelectorAll("#toasts .toast")).map(x => x.textContent).join(" | ") }));
    ok("A5 : dans la fiche d'un client, le bouton de langue du coach ne bascule pas : « Change la langue de ton espace hors de la fiche d'un client. » (v106), rien d'écrit",
      apres.consulte && apres.langue === "fr" && /hors de la fiche d'un client/.test(apres.toast) && prefsCoach().length === 0, JSON.stringify(apres));
    /* depuis son tableau de bord : le choix est rangé sur SON compte (prefs.langue), et il le garde (verif86, bloc I) */
    await aller(page, "#/tableau", 1500);
    await page.click("#rond-profil"); await attendre(page, 400);   // v106 (lot 1)
    await Promise.all([page.waitForEvent("load", { timeout: 10000 }).catch(() => {}), page.click(".volet [data-mp-langue]")]);
    await pret(page, "#tb-vue"); await attendre(page, 800);
    const en = await page.evaluate(() => ({ langue: I18N.langue, h1: (document.querySelector("#tb-vue h1") || {}).textContent }));
    const pc = prefsCoach().pop();
    ok("A6 : depuis son tableau de bord, le coach choisit l'anglais : rangé sur son compte (prefs { langue: \"en\" }), son espace passe en anglais (« Dashboard ») et le reste après le rechargement",
      en.langue === "en" && en.h1 === "Dashboard" && !!pc && pc.contenu && pc.contenu.langue === "en", JSON.stringify([en, pc && pc.contenu]));
  });

  /* =================== B. client en anglais : aucune phrase de l'app restée en français =================== */
  await bloc("B. client en anglais", async () => {
    const db = base(); avecPrefsEn(db, F.IDS.c1);
    const { page } = await contexte(b, THOMAS, db, { langue: "en", viewport: ORDI });
    await page.goto(URL0 + "#/accueil"); await pret(page); await attendre(page, 1000);
    const lang = await page.evaluate(() => document.documentElement.lang);
    const T = await parcourir(page, ROUTES_CLIENT, dataDe(db));
    ok("B1 : client en anglais (lang=\"en\") : toutes ses pages (accueil, programme, journal, repas, progression, calculateur, suivi, bilan, compléments, profil) sans phrase de l'app restée en français",
      lang === "en" && nbTrouves(T) === 0, lang + " · " + nbTrouves(T) + " : " + resumeTrouves(T));
  });
  await bloc("B. client en anglais sur téléphone", async () => {
    const db = base(); avecPrefsEn(db, F.IDS.c1);
    const { page } = await contexte(b, THOMAS, db, { langue: "en", viewport: MOBILE });
    await page.goto(URL0 + "#/accueil"); await pret(page); await attendre(page, 1000);
    const T = await parcourir(page, ["#/accueil"], dataDe(db));
    const plus = await page.$("#barre-bas [data-plus]");
    if (plus){ await plus.click(); await attendre(page, 900); const v = await visibles(page); const fr = v.textes.filter(t => resteFrancais(norm(t), dataDe(db))); if (fr.length) T["volet Plus"] = fr; }
    ok("B2 : client en anglais sur téléphone : accueil, barre du bas et volet « Plus » sans phrase restée en français", nbTrouves(T) === 0, nbTrouves(T) + " : " + resumeTrouves(T));
  });

  await bloc("B. client sans données en anglais", async () => {
    /* un client qui commence (questionnaire incomplet, ni programme ni repas) : les états vides de chaque page */
    const db = base(); avecPrefsEn(db, F.IDS.c3);
    const JULIEN = qui(F.IDS.c3, "julien@exemple.fr", { prenom: "Julien", nom: "Démo" });
    const { page } = await contexte(b, JULIEN, db, { langue: "en", viewport: MOBILE });
    await page.goto(URL0 + "#/accueil"); await pret(page); await attendre(page, 1000);
    const T = await parcourir(page, ROUTES_CLIENT, dataDe(db));
    ok("B3 : client qui commence (sans programme ni repas), en anglais, sur téléphone : les pages vides sans phrase restée en français",
      nbTrouves(T) === 0, nbTrouves(T) + " : " + resumeTrouves(T));
  });

  /* =================== C. prospect en anglais =================== */
  await bloc("C. prospect en anglais", async () => {
    const k = 1, db = base({ comptes: [compte(k, { donnees: [["prefs", { langue: "en" }]] })] });
    const { page } = await contexte(b, quiP(k), db, { langue: "en", viewport: ORDI });
    await page.goto(URL0 + ACCUEIL); await pret(page); await attendre(page, 1000);
    const T = await parcourir(page, ROUTES_PROSPECT, dataDe(db));
    /* sur téléphone : la barre du bas et le volet « Tout mon espace » */
    const { page: p2 } = await contexte(b, quiP(k), db, { langue: "en", viewport: MOBILE });
    await p2.goto(URL0 + ACCUEIL); await pret(p2); await attendre(p2, 1000);
    const plus = await p2.$("#barre-bas [data-plus]");
    if (plus){ await plus.click(); await attendre(p2, 900); const v = await visibles(p2); const fr = v.textes.filter(t => resteFrancais(norm(t), dataDe(db))); if (fr.length) T["volet Plus (téléphone)"] = fr; }
    ok("C1 : prospect en anglais : ses pages (accueil, programme, journal, repas, progression, calculateur, suivi, compléments, profil, journal alimentaire) et son volet « Tout mon espace » sans phrase de l'app restée en français",
      nbTrouves(T) === 0, nbTrouves(T) + " : " + resumeTrouves(T));
  });

  /* =================== D. compte client de test en anglais (journal alimentaire) =================== */
  await bloc("D. compte de test en anglais", async () => {
    if (!TEST_ID){ ok("D1 : identifiant du compte de test lu dans CONFIG.nouveautes.comptes_test", false, "introuvable"); return; }
    const db = base({ comptes: [{ id: TEST_ID, prenom: "", nom: "", statut: "client", cree: avant(30 * J), email: "test@exemple.fr", meta: {}, donnees: [["prefs", { langue: "en" }], ["intake", { complet: true, age: 30, sexe: "Homme", taille: 180, poids: 80 }]] }] });
    const { page } = await contexte(b, qui(TEST_ID, "test@exemple.fr", {}), db, { langue: "en", viewport: ORDI });
    await page.goto(URL0 + "#/accueil"); await pret(page); await attendre(page, 1000);
    const T = await parcourir(page, ["#/journal-alimentaire", "#/accueil"], dataDe(db));
    ok("D1 : compte de test en anglais : journal alimentaire et accueil sans phrase de l'app restée en français", nbTrouves(T) === 0, nbTrouves(T) + " : " + resumeTrouves(T));
  });

  /* =================== E. écran d'entrée et de connexion en anglais (sans compte) =================== */
  await bloc("E. entrée en anglais", async () => {
    const db = base();
    const { page } = await contexte(b, null, db, { langue: "en", viewport: MOBILE });
    await page.goto(URL0); await attendre(page, 2500);
    const T = {};
    let v = await visibles(page); let fr = v.textes.filter(t => resteFrancais(norm(t), DATA)); if (fr.length) T["entrée"] = fr;
    await page.goto(URL0 + "#/connexion"); await attendre(page, 2500);
    v = await visibles(page); fr = v.textes.filter(t => resteFrancais(norm(t), DATA)); if (fr.length) T["connexion"] = fr;
    ok("E1 : sans compte, en anglais : écran d'entrée et écran de connexion sans phrase restée en français", nbTrouves(T) === 0, nbTrouves(T) + " : " + resumeTrouves(T));
  });

  /* =================== S. le code : chaque trad("…") a sa traduction =================== */
  await bloc("S. trad() du code", async () => {
    /* les textes passés tels quels à trad() dans js/ (hors i18n.js), avec leur fichier et leur ligne */
    const L = [];
    for (const f of fs.readdirSync(path.join(path.dirname(HTML), "js"))) {
      if (!f.endsWith(".js") || f === "i18n.js") continue;
      const t = fs.readFileSync(path.join(path.dirname(HTML), "js", f), "utf8");
      const re = /\btrad\(\s*("(?:[^"\\]|\\.)*")/g; let m;
      while ((m = re.exec(t))) { let x; try { x = JSON.parse(m[1]); } catch (e) { continue; } if (/[a-zàâçéèêëîïôûùüœ]/i.test(x)) L.push([f + ":" + t.slice(0, m.index).split("\n").length, x]); }
    }
    const db = base(); avecPrefsEn(db, F.IDS.c1);
    const { page } = await contexte(b, THOMAS, db, { langue: "en", viewport: ORDI });
    await page.goto(URL0 + "#/accueil"); await pret(page); await attendre(page, 800);
    const sans = (await page.evaluate(L => L.filter(([, x]) => { const n = Traduction.norm(x), a = k => Object.prototype.hasOwnProperty.call(I18N.en, k); return !a(x) && !a(n) && !I18N.motifs.some(([re]) => re.test(n)); }), L))
      .filter(([, x]) => !SANS_TRADUCTION.has(x));
    if (process.env.VERIF93_TOUT && sans.length) console.error("SANS PAIRE " + JSON.stringify(sans));
    ok("S1 : chaque texte passé à trad() dans le code (" + L.length + ") a sa traduction dans I18N.en (dictionnaire complet de la page, programmes de la formation compris)",
      L.length > 100 && sans.length === 0, sans.length + " : " + sans.map(([o, x]) => o + " « " + x.slice(0, 70) + " »").join(" ; "));
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
