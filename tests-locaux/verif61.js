/* verif61 — v56 : le compteur de connexions côté coach (Mes clients, page Prospects), vérifié de bout en bout dans un vrai
   navigateur, avec un faux Supabase qui reproduit la migration v56 (supabase/migrations/20260928220000_v56_compteur_connexions.sql) :
   la fonction noter_connexion() note la connexion du compte du JETON (sans paramètre), une par jour au plus (calendrier de
   Paris), et avance la dernière connexion ; la table connexions est lue par le coach seul et jamais écrite directement.
   A. démarrage avec une session enregistrée (connexion automatique) : le compte de test (client, interrupteur « test ») et un
      prospect sont notés UNE fois, par un POST sans paramètre (« {} ») portant leur propre jeton, sans rien écrire d'autre ni
      rien attendre ; un client hors interrupteur, le coach (fiche consultée comprise) et l'écran de connexion : jamais ;
      connexion par mot de passe (rechargement) : notée ; même jour : une connexion (la dernière avance), autre jour : +1 ;
   B. l'app revenue au premier plan : après 10 min ou plus en arrière-plan, une nouvelle ouverture ; moins : rien ;
   C. base sans la migration (404), retour arrière (403), réseau coupé : rien d'affiché, aucune erreur, l'app marche ;
      404 / 403 : plus d'essai avant le prochain chargement ; réseau coupé : nouvel essai à la prochaine ouverture ; côté
      coach : Mes clients et Prospects s'affichent, « — » dans les deux colonnes ;
   D. Mes clients : colonnes « Connexions » et « Dernière connexion » (après « Jours actifs »), nombre, date et heure (heure
      de l'appareil du coach), « 0 » / « aucune » pour un compte suivi jamais connecté, « — » pour un compte non suivi même
      s'il a une ligne, info-bulle « comptées depuis le … », téléphone 390 px ;
   E. page Prospects : les deux lignes dans chaque carte, la phrase d'aide ;
   F. rien côté client ni prospect : aucun texte du compteur, aucune lecture de la table ;
   G. interrupteur suivi_visites_clients « tous » (Thomas noté et affiché) et « off » (compte de test ni noté ni affiché,
      prospects toujours) ;
   H. données piégées dans la table (types faux, dates illisibles, balises) : rien ne tombe, rien n'est injecté ;
   Z. aucun appel vers l'extérieur.
   Infrastructure (serveur, faux Supabase, personnes, décor) reprise de verif58. Dates relatives au lancement. Chaque bloc
   tourne à part (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif61.js ../index.html
           VERIF61_PORT=9771 node verif61.js ../index.html     (autre port, si 9770 est pris)
           VERIF61_BLOCS="A.,D." node verif61.js …              (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF61_PORT || 9770;
const BLOCS = (process.env.VERIF61_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const MOBILE = { width: 390, height: 844 }, ORDI = { width: 1280, height: 900 };

/* ---------- la page servie : le fichier testé, retouché le temps d'un bloc (avec) ---------- */
let retouches = [];
/* 52.1 : les retouches valent pour la page et pour ses fichiers css/ et js/ (CONFIG est dans js/config.js) */
const retouche = h => { for (const [de, vers] of retouches) h = h.split(de).join(vers); return h; };
const { servirFichier, source } = require("./fichiers");   // 52.1 : la page charge css/ et js/, servis depuis son dossier (fichiers.js)
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML, retouche)) return;
  let h = retouche(fs.readFileSync(HTML, "utf8"));
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(h);
});
/* une retouche dont le texte a disparu du fichier ne passe jamais en silence : le bloc s'interrompt */
async function avec(liste, fn){
  const h = source(HTML);   // 52.1 : la page et tous ses fichiers
  for (const [de] of liste) if (!h.includes(de)) throw new Error("retouche impossible, texte absent du fichier : " + de);
  retouches = liste;
  try { await fn(); } finally { retouches = []; }
}

/* ---------- résultats ---------- */
const res = [];
const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + String(d || "").replace(/[✓✗]/g, "·")));   // un détail recopié d'une page ne doit jamais contenir ✓ / ✗ (banc.sh compte les lignes)
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

/* ---------- dates : toujours relatives au lancement ---------- */
const T0 = Date.now(), MIN = 60000, H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const norm = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "donnees", f), "utf8"));
const CATALOGUE = Object.assign({}, F.catalogue, { aliments: lireDonnees("aliments.json"), recettes: lireDonnees("recettes.json") });

/* ---------- les personnes ---------- */
/* un jeton par compte : le faux Supabase reconnaît l'appelant à son en-tête Authorization, comme la vraie base */
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: meta } : {}) });
const qui = (id, email, meta) => ({ id, email, session: session(id, email, meta) });
const COACH = qui(F.IDS.coach, "coach@exemple.fr"), THOMAS = qui(F.IDS.c1, "thomas@exemple.fr");
const PID = k => "00000000-0000-4000-8000-0000000058" + String(k).padStart(2, "0");   // les prospects du décor de verif58 (…58kk), repris tels quels

/* ---------- le décor : fixtures.js (coach, Thomas, Sarah, Julien, tous « client ») + les comptes du bloc ----------
   comptes : [{ id, prenom, nom, statut ("prospect" par défaut), cree (instant ISO), email, donnees: [[outil, contenu, maj_le]] }]
   cles : [[user_id, outil, contenu, maj_le]] ajoutées à un compte existant */
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  const donnees = clone(F.donnees);
  donnees.forEach(d => { if (d.user_id === F.IDS.c3) d.maj_le = avant(12 * J + 3 * H); });   // Julien : 12 j entiers pendant toute la suite
  /* verif61 : cx = la table connexions (par compte), notees = chaque appel de noter_connexion, cxLectures = chaque accès à la table ;
     cxAbsente (base sans la migration : 404), cxRefusee (retour arrière : 403), cxPanne (réseau coupé), cxRetard (ms),
     cx401 (jeton expiré : n refus 401 avant d'accepter) ; les instants sont rendus comme PostgREST (…123456+00:00) */
  const db = { profils, donnees, cx: {}, notees: [], cxLectures: [], cxAbsente: false, cxRefusee: false, cxPanne: false, cxRetard: 0, cx401: 0, emails_prospects: [], sansJournal: false, ecritures: [], refus: [], lectures: [], journal: [], chemins: [],
    fonctions: [], inscriptions: [], emails: {}, connexions: {}, inscription: {}, lectureKo: opts.lectureKo || [], retardLecture: {}, retard: {},
    reponseFonction: { status: 200, body: { ok: true } },
    /* v52 (lot A) : mot de passe oublié et changement d'adresse (erreurs simulées), renouvellements de session, polices lentes */
    oublis: [], recover: {}, majUsers: [], majUser: {}, tokens: [], polices: null,
    /* verif58 : pannes de suivi_prospect (autre onglet qui écrit entre la lecture et l'écriture, ligne cachée à la première
       lecture → 409), 504 sur le passage en client, condition maj_le de chaque PATCH */
    conflit: 0, cacheLigne: 0, echecClient: false, conditions: [], majAutreOnglet: null };
  for (const x of opts.comptes || []) {
    profils.push({ id: x.id, prenom: x.prenom, nom: x.nom || "", role: "client", statut: x.statut || "prospect", cree_le: x.cree || avant(J) });
    if (x.email) db.emails[x.id] = x.email;
    for (const [outil, contenu, maj] of x.donnees || []) donnees.push({ user_id: x.id, outil, contenu: clone(contenu), maj_le: maj || avant(H) });
  }
  for (const [uid, outil, contenu, maj] of opts.cles || []) donnees.push({ user_id: uid, outil, contenu: clone(contenu), maj_le: maj || avant(J) });
  return db;
}

/* ---------- le faux Supabase ---------- */
const MAX_LIGNES = 1000;
/* règles de la base (HANDOFF §2.3, policies v49). Une migration qui change une règle change ces listes dans le même chantier. */
const ILLISIBLES_PROPRIO = ["notes_coach", "suivi_prospect"];                 // SELECT : le propriétaire ne les lit pas
const INTERDITES_PROPRIO = ["feedbacks", "notes_coach", "suivi_prospect"];     // INSERT / UPDATE / DELETE du propriétaire
const ECRITES_PAR_COACH = ["programme", "repas", "calc", "complements", "hist_programme", "hist_repas", "feedbacks", "notes_coach", "suivi_prospect"];
const permis = (moi, coach, row) => !!moi && (row.user_id === moi ? (coach || !INTERDITES_PROPRIO.includes(row.outil)) : (coach && ECRITES_PAR_COACH.includes(row.outil)));
const externes = new Set();
function ordonner(l, order){   // order=a.desc,b.asc (PostgREST)
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

/* polices simulées (db.polices = { css: ms, fichiers: ms }) : une feuille de style comme celle de Google Fonts, dont les
   fichiers de police (fonts.gstatic.com) répondent après « fichiers » ms (404 : le texte garde la police de secours) */
const POLICES_CSS = ["IBM Plex Sans", "IBM Plex Mono", "Oswald"].map((f, i) => "@font-face{font-family:'" + f + "';font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/police" + i + "/v1/fausse.woff2) format('woff2')}").join("\n");
async function repondre(r, who, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue();
  if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" });
  /* polices lentes (réseau mobile) : la feuille de style après db.polices.css ms, les fichiers après db.polices.fichiers ms */
  if (host === "fonts.googleapis.com" && db.polices) { externes.add(host); if (db.polices.css) await new Promise(z => setTimeout(z, db.polices.css)); return r.fulfill({ status: 200, contentType: "text/css", body: POLICES_CSS }).catch(() => {}); }
  if (host === "fonts.gstatic.com" && db.polices) { externes.add(host); if (db.polices.fichiers) await new Promise(z => setTimeout(z, db.polices.fichiers)); return r.fulfill({ status: 404, contentType: "text/plain", body: "" }).catch(() => {}); }
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort(); }   // polices, Calendly, Instagram… : rien ne sort
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});   // page fermée entre-temps
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req) || (who && who.id) || null;
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  db.chemins.push(m + " " + p);

  /* --- comptes --- */
  if (p.startsWith("/auth/v1/signup")) {
    const c = corps() || {}, data = c.data || {}; db.inscriptions.push(clone(c));
    if (db.inscription.erreur) return json({ msg: db.inscription.erreur.msg }, db.inscription.erreur.status);
    const id = db.inscription.id || PID(99); db.emails[id] = c.email;
    db.profils.push({ id, prenom: data.prenom || "", nom: data.nom || "", role: "client", statut: "prospect", cree_le: new Date().toISOString() });   // déclencheur creer_profil
    if (db.inscription.confirmation) return json({ id, email: c.email, user_metadata: data });   // « Confirm email » : pas de session
    return json(session(id, c.email, data));
  }
  if (p.startsWith("/auth/v1/token")) {   // mot de passe ou renouvellement : jamais compté comme écriture
    const c = corps() || {}, r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || ""));
    db.tokens.push(q.get("grant_type") || "?");
    const id = (r1 && r1[1]) || (c.email && db.connexions[c.email]) || (who && who.id);
    if (!id) return json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
    /* renouvellement : la session porte l'adresse que la base connaît à cet instant (db.emails, ex. après un changement d'adresse) */
    return json(who && id === who.id && !db.emails[id] ? who.session : session(id, db.emails[id] || (who && id === who.id ? who.email : "") || c.email || ""));
  }
  /* toute autre écriture vers la base (compte, fonctions, Storage, bibliothèque, catalogue…) est notée ;
     donnees et profils le sont plus bas, avec leur contenu */
  /* --- v56 : la fonction noter_connexion() et la table connexions, comme la migration v56 : la fonction note la connexion
     du compte du JETON (aucun paramètre), une par jour au plus (calendrier de Paris), et avance la dernière connexion ;
     la table : lue par le coach seul, jamais écrite directement (403) --- */
  if (p === "/rest/v1/rpc/noter_connexion") {
    db.notees.push({ par: appelant(req), m, corps: req.postData() || "", jeton: req.headers()["authorization"] || "", t: Date.now() });
    if (db.cxRetard) await new Promise(z => setTimeout(z, db.cxRetard));
    if (db.cxPanne) return r.abort().catch(() => {});
    if (db.cxAbsente) return json({ code: "PGRST202", message: "Could not find the function public.noter_connexion without parameters in the schema cache" }, 404);
    if (db.cxRefusee) return json({ code: "42501", message: "permission denied for function noter_connexion" }, 403);
    if (db.cx401 > 0) { db.cx401--; return json({ code: "PGRST303", message: "JWT expired" }, 401); }
    const par = appelant(req);
    if (m !== "POST" || !par) return json({ code: "42501", message: "permission denied for function noter_connexion" }, 401);
    const jour = jourParis(Date.now()), maint = pgInstant(new Date().toISOString()), l = db.cx[par];
    if (!l) db.cx[par] = { user_id: par, nombre: 1, premiere: maint, derniere: maint, dernier_jour: jour };
    else { if (jour > l.dernier_jour) { l.nombre++; l.dernier_jour = jour; } if (maint > l.derniere) l.derniere = maint; }
    return json(null, 204);
  }
  if (p === "/rest/v1/connexions") {
    db.cxLectures.push({ par: moi, m });
    if (!["GET", "HEAD"].includes(m)) { db.refus.push({ table: "connexions", m }); return json({ code: "42501", message: "permission denied for table connexions" }, 403); }
    if (db.cxAbsente) return json({ code: "PGRST205", message: "Could not find the table 'public.connexions' in the schema cache" }, 404);
    if (db.cxRefusee) return json({ code: "42501", message: "permission denied for table connexions" }, 403);
    return json(coach ? colonnes(plage(Object.values(db.cx)), q) : []);
  }
  if (!["GET", "HEAD"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m, corps: corps() });
  if (p.startsWith("/auth/v1/logout")) { db.journal.push("LOGOUT"); return json({}); }
  if (p.startsWith("/auth/v1/recover")) {   // mot de passe oublié (erreur simulée : db.recover.erreur)
    db.oublis.push(corps());
    if (db.recover.erreur) return json({ msg: db.recover.erreur.msg }, db.recover.erreur.status);
    return json({});
  }
  if (p.startsWith("/auth/v1/user") && m === "PUT") {   // changement d'adresse ou de mot de passe (erreur simulée : db.majUser.erreur)
    const c = corps() || {}; db.majUsers.push(clone(c));
    if (db.majUser.erreur) return json({ msg: db.majUser.erreur.msg }, db.majUser.erreur.status);
    return json({ id: moi, email: db.emails[moi] || (who && who.id === moi ? who.email : ""), new_email: c.email || undefined, role: "authenticated" });
  }
  if (p.startsWith("/auth/v1/user")) return moi ? json({ id: moi, email: db.emails[moi] || (who && who.id === moi ? who.email : ""), role: "authenticated" }) : json({ msg: "invalid JWT" }, 401);
  if (p.startsWith("/auth/v1/")) return json({});
  /* --- fonctions serveur et Storage : jamais appelés pour de vrai --- */
  if (p.startsWith("/functions/v1/")) { db.fonctions.push({ nom: p.slice(14), m, action: q.get("action"), corps: corps() }); const rf = db.reponseFonction; return rf.abort ? r.abort() : json(rf.body, rf.status); }
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/emails_prospects") {
    if (db.sansJournal) return json({ code: "42P01", message: 'relation "public.emails_prospects" does not exist' }, 404);
    return json(coach ? colonnes(plage(db.emails_prospects.slice()), q) : []);
  }
  /* --- profils : chacun le sien, le coach tous ; rôle et statut changés par le coach seul (déclencheur protege_role) --- */
  if (p === "/rest/v1/profils") {
    const id = (q.get("id") || "").replace(/^eq\./, "");
    if (m === "GET" || m === "HEAD") { let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(colonnes(plage(l), q)); }
    const c = corps() || {}, cible = db.profils.find(x => x.id === id);
    db.ecritures.push({ table: "profils", m, id, corps: clone(c) });
    if (!cible || !(coach || id === moi)) { db.refus.push({ table: "profils", m, id }); return json([]); }
    if (!coach && (("role" in c && c.role !== cible.role) || ("statut" in c && c.statut !== cible.statut))) { db.refus.push({ table: "profils", m, id }); return json({ code: "P0001", message: "Seul un coach peut changer un rôle ou un statut." }, 400); }
    if (coach && db.echecClient && "statut" in c) return json({ message: "upstream timeout" }, 504);   // verif58 : passage en client en échec
    Object.assign(cible, c);
    return json((req.headers()["prefer"] || "").includes("return=representation") ? [cible] : null, 200);
  }
  /* --- donnees --- */
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "", mj = q.get("maj_le");
    const cleEq = o.startsWith("eq.") ? o.slice(3) : null;
    if (m === "GET" || m === "HEAD") {
      db.lectures.push({ par: moi, uid, outil: o, select: q.get("select") || "*" }); db.journal.push("L " + (cleEq || o));
      if (cleEq && db.retardLecture[cleEq]) await new Promise(z => setTimeout(z, db.retardLecture[cleEq]));   // réponse lente
      if (cleEq && db.lectureKo.includes(cleEq)) return json({ message: "panne simulée" }, 500);
      if (cleEq === "suivi_prospect" && db.cacheLigne > 0) { db.cacheLigne--; return json([]); }   // verif58 : la ligne existe, notre lecture arrive avant (course)
      let l = db.donnees.filter(x => coach || (x.user_id === moi && !ILLISIBLES_PROPRIO.includes(x.outil)));
      if (uid) l = l.filter(x => x.user_id === uid);
      return json(colonnes(plage(parOutil(l, o)), q));
    }
    if (m === "POST") {
      let rows = corps(); rows = Array.isArray(rows) ? rows : rows ? [rows] : [];
      const refuse = rows.find(row => !permis(moi, coach, row));
      if (refuse) { db.refus.push({ table: "donnees", m, user_id: refuse.user_id, outil: refuse.outil }); return json({ code: "42501", message: 'new row violates row-level security policy for table "donnees"' }, 403); }
      const lent = Math.max(0, ...rows.map(row => db.retard[row.outil] || 0));
      if (lent) { db.journal.push("P " + rows.map(row => row.outil).join(",")); await new Promise(z => setTimeout(z, lent)); }
      const upsert = q.has("on_conflict"), out = [];
      for (const row of rows) {
        const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
        if (i > -1 && !upsert) return json({ code: "23505", message: "duplicate key value violates unique constraint" }, 409);
        const ligne = { user_id: row.user_id, outil: row.outil, contenu: clone(row.contenu), maj_le: row.maj_le || new Date().toISOString() };
        if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        db.ecritures.push(Object.assign({ table: "donnees", m }, clone(ligne))); db.journal.push("E " + row.outil);
        out.push(ligne);
      }
      return (req.headers()["prefer"] || "").includes("return=representation") ? json(out, 201) : json(null, 201);
    }
    if (m === "PATCH") {   // écriture conditionnelle (CleCoach) : maj_le=eq.<valeur lue> ou is.null
      const c = corps() || {};
      db.conditions.push({ uid, outil: cleEq, maj_le: mj });
      if (cleEq && db.retard[cleEq]) await new Promise(z => setTimeout(z, db.retard[cleEq]));   // écriture lente
      if (cleEq === "suivi_prospect" && db.conflit > 0) {
        /* verif58 : un autre onglet écrit juste avant nous (une relance de plus, nouvelle maj_le) : notre PATCH, conditionnel,
           ne touche alors aucune ligne ; sans condition, il écraserait la relance de l'autre onglet */
        db.conflit--; const r0 = db.donnees.find(x => x.user_id === uid && x.outil === cleEq);
        if (r0) { r0.contenu = Object.assign({}, r0.contenu, { relances: ((r0.contenu && r0.contenu.relances) || []).concat(new Date().toISOString()) }); r0.maj_le = new Date(Date.now() - 5000).toISOString(); db.majAutreOnglet = r0.maj_le; }
      }
      const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj == null || (mj === "is.null" ? !x.maj_le : (mj.startsWith("eq.") && x.maj_le === mj.slice(3)))));
      if (!row) return json([]);   // la ligne a bougé : 0 ligne (conflit)
      if (!permis(moi, coach, row)) { db.refus.push({ table: "donnees", m, user_id: uid, outil: cleEq }); return json([]); }   // RLS d'une mise à jour : 0 ligne, sans erreur
      Object.assign(row, { contenu: clone(c.contenu), maj_le: c.maj_le || new Date().toISOString() });
      db.ecritures.push(Object.assign({ table: "donnees", m }, clone(row))); db.journal.push("E " + cleEq);
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

/* ---------- un navigateur (contexte) pour une personne ----------
   opts : viewport (ORDI par défaut, MOBILE), langue ("en" ; la ligne prefs en base l'emporte), stockage ({ clé: valeur }
   posés sur l'appareil), persistant (false : « Rester connecté » décoché), horloge (instant : l'horloge part de là et
   tourne ; true : maintenant), horlogeFixe (instant figé), fuseau ("Asia/Makassar"…) */
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext(Object.assign({ viewport: opts.viewport || ORDI }, opts.fuseau ? { timezoneId: opts.fuseau } : {}));
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, who, db));
  await c.addInitScript(({ s, stock, langue, persistant }) => {
    if (!/^https?:$/.test(location.protocol)) return;   // about:blank (fermeture simulée)
    window.__toasts = [];
    try { new MutationObserver(ms => ms.forEach(mu => mu.addedNodes.forEach(n => { if (n.nodeType === 1 && n.classList && n.classList.contains("toast")) window.__toasts.push(n.textContent); }))).observe(document, { childList: true, subtree: true }); } catch (e) { }
    /* l'appareil (localStorage, partagé par les onglets du contexte) n'est préparé qu'une fois : un rechargement ou un 2e onglet le garde */
    if (!localStorage.getItem("__init")) {
      localStorage.setItem("__init", "1");
      if (s && persistant) localStorage.setItem("mhx_session", JSON.stringify(s));
      localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
      if (langue) localStorage.setItem("mhx_langue", langue);
      Object.keys(stock).forEach(k => localStorage.setItem(k, stock[k]));
    }
    if (s && !persistant && !sessionStorage.getItem("__init")) { sessionStorage.setItem("__init", "1"); sessionStorage.setItem("mhx_session", JSON.stringify(s)); }
  }, { s: who ? who.session : null, stock: opts.stockage || {}, langue: opts.langue || "", persistant: opts.persistant !== false });
  if (opts.horloge) await c.clock.install(opts.horloge === true ? undefined : { time: opts.horloge });
  if (opts.horlogeFixe) await c.clock.setFixedTime(opts.horlogeFixe);
  const page = await nouvellePage(c);
  return { c, page };
}
function surveiller(page){
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return page;
}
async function nouvellePage(c){ return surveiller(await c.newPage()); }

/* ---------- aides ---------- */
const attendre = (page, ms) => page.waitForTimeout(ms);
/* l'app a fini de démarrer (appPrete, index.html [G]) et l'écran attendu est là */
async function pret(page, sel){
  await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 });
  if (sel) await page.waitForSelector(sel, { timeout: 10000 });
  await attendre(page, 400);
}
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1500); };
const texte = async (page, sel) => norm(await page.textContent(sel || "#vue").catch(() => ""));
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.table === "donnees" && e.outil === outil && (!uid || e.user_id === uid));
const ecrDonnees = db => db.ecritures.filter(e => e.table === "donnees" || e.table === "profils");
const couvre = (o, k) => { o = String(o || ""); if (!o) return true; if (o.startsWith("eq.")) return o.slice(3) === k; if (o.startsWith("in.")) return liste(o.slice(3)).includes(k); if (o.startsWith("not.in.")) return !liste(o.slice(7)).includes(k); return true; };
const lu = (db, outil, depuis) => db.lectures.slice(depuis || 0).filter(x => couvre(x.outil, outil) && x.select !== "maj_le").length;   // lectures du CONTENU de la clé
const resume = db => JSON.stringify(db.ecritures.map(e => (e.table === "donnees" ? e.outil : e.table) + ":" + e.m));
const deborde = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
const largeur = page => page.evaluate(() => document.documentElement.scrollWidth + " px pour " + window.innerWidth).catch(() => "?");
const ou = page => page.evaluate(() => ({ courant: typeof courant !== "undefined" ? courant : null, hash: location.hash })).catch(() => ({}));
const avecEn = (db, uid) => { const pr = db.donnees.find(d => d.user_id === uid && d.outil === "prefs"); if (pr) pr.contenu = Object.assign({}, pr.contenu, { langue: "en" }); else db.donnees.push({ user_id: uid, outil: "prefs", contenu: { langue: "en" }, maj_le: avant(J) }); };



/* ---------- le décor du chantier 4 ---------- */
const SRC = source(HTML);
/* le compte de test est lu dans le fichier servi (CONFIG.nouveautes.comptes_test : un identifiant, jamais un email) */
const TEST_ID = (/comptes_test:\s*\[\s*"([0-9a-f-]{36})"/.exec(SRC) || [])[1] || null;
const TESTEUR = qui(TEST_ID || PID(90), "test@exemple.fr");
const INTAKE_THOMAS = clone(F.donnees.find(d => d.user_id === F.IDS.c1 && d.outil === "intake").contenu);
const PROG_THOMAS = clone(F.donnees.find(d => d.user_id === F.IDS.c1 && d.outil === "programme").contenu);
const PIEGE = '<img src="x" data-xss="1" onerror="window.__xss=(window.__xss||0)+1">';
const RIEN_DE_BRUT = /\bundefined\b|\bnull\b|\bNaN\b|\[object /;
const pad = n => String(n).padStart(2, "0");
const isoL = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const ilYA = n => { const d = new Date(T0); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return isoL(d); };
const LUNDI = (() => { const d = new Date(T0); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; })();
const jourSem = k => { const d = new Date(LUNDI); d.setDate(LUNDI.getDate() + k); return isoL(d); };
const LUNDI_P = jourSem(-7), DIM_P = jourSem(-1);
const aHeure = (jour, h, m) => new Date(jour + "T" + pad(h) + ":" + pad(m || 0) + ":00").toISOString();   // heure locale
const frL = v => { const d = new Date(v); return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear(); };   // dateFr d'un instant (date locale)
/* jours calendaires locaux depuis un instant ; la dernière visite en clair, comme l'app (Activite.texteVisite) */
const joursDepuis = v => { const a = new Date(T0); a.setHours(12, 0, 0, 0); const d = new Date(v); d.setHours(12, 0, 0, 0); return Math.round((a - d) / J); };
const visiteTxt = v => { const n = joursDepuis(v); return n <= 0 ? "aujourd'hui" : n === 1 ? "hier" : "il y a " + n + " j"; };

/* le compte de test (client, sans prénom ni nom comme le vrai) : feedback du dimanche de la semaine passée (note 7),
   la réponse du coach, puis un 😞 du client sur cette réponse (non traité : pas de nouvelle réponse depuis) ; visites */
const ENV_T = aHeure(DIM_P, 18), ECRIT_T = aHeure(DIM_P, 20), AVIS_T = aHeure(DIM_P, 21);
const ckTest = avis => ({ liste: [{ semaine: LUNDI_P, fin: DIM_P, envoye_le: DIM_P, envoye_a: ENV_T, format: "dimanche", reponses: { note: 7, training: "Trois séances", alimentation: "", autre: "" } }],
  avis: avis === false ? [] : [{ semaine: LUNDI_P, fb: ECRIT_T, smiley: "triste", le: AVIS_T, deplu: "Trop court", ameliorer: "Plus de détails" }] });
const fbTest = () => ({ liste: [{ semaine: LUNDI_P, fin: DIM_P, date: DIM_P, texte: "Belle semaine, continue.", ecrit_a: ECRIT_T, bilan: ENV_T }] });
const ACT_TEST = { version: 1, jours: [ilYA(0), ilYA(3), ilYA(40)], pages: { accueil: 3, programme: 2 }, temps_s: 300, derniere: avant(10 * MIN) };
function compteTest(o){
  o = o || {};
  const d = [["intake", INTAKE_THOMAS], ["programme", PROG_THOMAS], ["prefs", { langue: "fr" }]];
  if (o.ck !== null) d.push(["checkins", o.ck || ckTest()]);
  if (o.fb !== null) d.push(["feedbacks", o.fb || fbTest()]);
  if (o.act !== null) d.push(["activite", o.act || ACT_TEST]);
  return { id: TESTEUR.id, prenom: "", nom: "", statut: "client", cree: avant(40 * J), email: "test@exemple.fr", donnees: d };
}
/* Sarah : un feedback du dimanche noté 4 (note en chute) ; Thomas : une ancienne clé activite (il n'est pas suivi) */
const CK_SARAH = { liste: [{ semaine: LUNDI_P, fin: DIM_P, envoye_le: DIM_P, envoye_a: aHeure(DIM_P, 19), format: "dimanche", reponses: { note: 4, training: "", alimentation: "", autre: "" } }] };
const ACT_THOMAS = { version: 1, jours: [ilYA(0)], pages: { accueil: 1 }, temps_s: 60, derniere: avant(H) };

/* un prospect : k (plage …58kk), cree / q (questionnaire validé) / clics / caseP / newsLe en ms avant le lancement */
function prospect(k, prenom, nom, o){
  const d = [];
  if (o.intake) d.push(["intake", o.intake, avant(o.cree - H)]);
  else if (o.rep || o.q != null) d.push(["intake", Object.assign({}, o.rep || {}, o.q != null ? { court_debut: avant(o.q + 10 * MIN), court_le: avant(o.q) } : {}, o.email ? { email_compte: o.email } : {}), avant(o.q != null ? o.q : H)]);
  if ((o.clics && o.clics.length) || o.caseP != null){
    const C = { version: 1, jours: {}, cta: { clics: (o.clics || []).map(t => ({ jour: 1, source: "decouverte", date: avant(t) })) } };
    if (o.caseP != null) C.reserve = avant(o.caseP);
    d.push(["challenge", C, avant(Math.min.apply(null, (o.clics || []).concat(o.caseP != null ? [o.caseP] : [])))]);
  }
  if (o.emails !== undefined) d.push(["emails", o.emails, avant(J)]);
  else if (o.news != null) d.push(["emails", { newsletter: o.news, maj: avant(o.newsLe || o.cree), version: "2026-09-28c", source: "inscription" }, avant(o.newsLe || o.cree)]);
  if (o.act) d.push(["activite", o.act, avant(H)]);
  if (o.suivi) d.push(["suivi_prospect", o.suivi, avant(o.suiviLe || H)]);
  (o.extra || []).forEach(x => d.push(x));
  return { id: PID(k), prenom, nom: nom || "", statut: o.statut || "prospect", cree: avant(o.cree), email: o.email, donnees: d };
}
const LEA = PID(1), MARC = PID(2), INES = PID(3), HUGO = PID(4), OMAR = PID(5), NINA = PID(6), PAUL = PID(7), ZOE = PID(8), KARIM = PID(9);
const ANCIEN = { sexe: "Femme", age: "36", taille: "164", poids: "70", objectif: "Santé & énergie au quotidien", seances: "3", essaye: "Des régimes", obstacle: "Je lâche au bout de 2 semaines", pourquoi: "Mon mariage", motivation: "8", court_debut: avant(29 * J), court_le: avant(29 * J), email_compte: "nina@exemple.fr" };
const HUGO_BILAN = avant(J), HUGO_CASE = avant(36 * H);
const ZOE_SIGNE = avant(2 * J);
const prospects = () => [
  prospect(1, "Léa", "Martin", { cree: 3 * J, q: 3 * J, rep: { probleme: "Perdre du gras", obstacle: "Le manque de temps", projection: "Rentrer dans mon jean d'avant" }, email: "lea@exemple.fr", clics: [J], news: true,
    act: { version: 1, jours: [ilYA(0), ilYA(1)], pages: { "decouverte-questionnaire": 1, formation: 2 }, temps_s: 600, derniere: avant(5 * H) } }),
  prospect(2, "Marc", "Neuf", { cree: 10 * H }),
  prospect(3, "Inès", "Dupré", { cree: 5 * J, q: 5 * J, rep: { probleme: "Prendre du muscle", obstacle: "Mes horaires", projection: "Tenir 3 séances par semaine" }, email: "ines@exemple.fr", clics: [2 * J + H], caseP: 2 * J, news: false, newsLe: J }),
  prospect(4, "Hugo", "Réservé", { cree: 8 * J, q: 8 * J, rep: { probleme: "Me remettre en forme", obstacle: "La motivation", projection: "Courir 5 km" }, email: "hugo@exemple.fr", clics: [3 * J], caseP: 36 * H,
    act: { version: 1, jours: [ilYA(2)], pages: { formation: 1 }, temps_s: 60, derniere: avant(2 * J) },
    suivi: { version: 1, bilan_le: HUGO_BILAN, relances: [avant(4 * J)], note: "", historique: [{ type: "relance", le: avant(4 * J) }, { type: "bilan", valeur: "reserve", le: HUGO_BILAN }] }, suiviLe: J }),
  prospect(5, "Omar", "Perdu", { cree: 20 * J, q: 19 * J, rep: { probleme: "Perdre du gras", obstacle: "Le prix", projection: "Me sentir mieux" }, email: "omar@exemple.fr", clics: [18 * J], emails: { suivi: true, maj: avant(19 * J) },
    suivi: { version: 1, issue: "perdu", issue_le: avant(5 * J), note: "timing", historique: [{ type: "issue", valeur: "perdu", le: avant(5 * J), note: "timing" }] }, suiviLe: 5 * J }),
  prospect(6, "Nina", "Ancienne", { cree: 31 * J, intake: ANCIEN, caseP: 20 * J, emails: { newsletter: false, maj: avant(10 * J), version: "2026-09-28c", source: "profil", historique: [{ newsletter: true, le: avant(31 * J) }, { newsletter: false, le: avant(10 * J) }] },
    suivi: { version: 1, bilan_le: null, historique: [{ type: "bilan", valeur: "reserve", le: avant(21 * J) }, { type: "bilan", valeur: "annule", le: avant(15 * J) }] }, suiviLe: 15 * J }),
  prospect(7, "Paul", "Relancé", { cree: 3 * J + 2 * H, q: 2 * J, rep: { probleme: "Prendre du muscle", obstacle: "Le temps", projection: "Prendre 3 kg" }, email: "paul@exemple.fr", clics: [2 * J],
    suivi: { version: 1, relances: [avant(J)], historique: [{ type: "relance", le: avant(J) }] }, suiviLe: J }),
  prospect(8, "Zoé", "Signée", { cree: 6 * J, q: 6 * J, rep: { probleme: "Perdre du gras", obstacle: "Le sucre", projection: "Perdre 5 kg" }, email: "zoe@exemple.fr",
    suivi: { version: 1, issue: "signe", issue_le: ZOE_SIGNE, note: "", historique: [{ type: "issue", valeur: "signe", le: ZOE_SIGNE, note: "" }] }, suiviLe: 2 * J }),
  prospect(9, "Karim", "Client", { statut: "client", cree: 50 * J, q: 49 * J, rep: { probleme: "Prendre du muscle", obstacle: "Seul", projection: "Être régulier" }, email: "karim@exemple.fr", news: true, newsLe: 35 * J,
    suivi: { version: 1, issue: "signe", issue_le: avant(40 * J), client_le: avant(40 * J - H), historique: [{ type: "issue", valeur: "signe", le: avant(40 * J), note: "" }] }, suiviLe: 40 * J,
    extra: [["formation", { coches: { p1a: true }, ouvert: "", lecon: "", challenge: "", defis: {}, diete: {}, semaine: 1, jour: 0, priorites: { semaine: [], demain: [] }, notes: [], objectifs: [] }, avant(2 * J)]] })
];
/* le décor complet : fixtures (Thomas, Sarah, Julien) + compte de test + prospects ; opts.sans : comptes retirés */
function decor(opts){
  opts = opts || {};
  const db = base({ comptes: (opts.test === false ? [] : [compteTest(opts.testOpts)]).concat(opts.prospects === false ? [] : prospects()).concat(opts.comptes || []),
    cles: [[F.IDS.c2, "checkins", CK_SARAH, avant(J)], [F.IDS.c1, "activite", ACT_THOMAS, avant(H)]].concat(opts.cles || []) });
  if (opts.sans) { db.profils = db.profils.filter(p => opts.sans.indexOf(p.id) === -1); db.donnees = db.donnees.filter(d => opts.sans.indexOf(d.user_id) === -1); }
  return db;
}
const contenu = (db, outil, uid) => (db.donnees.find(x => x.user_id === uid && x.outil === outil) || {}).contenu;
const egal = (x, y) => JSON.stringify(x) === JSON.stringify(y);
let URL0 = "";   // l'adresse de la page servie (posée au lancement)
const SUIVI = (db, uid) => contenu(db, "suivi_prospect", uid);

/* ---------- aides d'écran (reprises de verif58) ---------- */
async function coachSur(b, db, hash, sel, opts){
  const x = await contexte(b, COACH, db, opts);
  await x.page.goto(URL0 + (hash || "")); await pret(x.page, sel || "#vue");
  return x;
}
const carte = (page, uid) => page.$eval(`#pr-liste .sc-carte[data-uid="${uid}"]`, e => e.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim()).catch(() => "");
const ligneClient = (page, uid) => page.$eval(`#tb-clients [data-ouvrir="${uid}"]`, bt => { const o = {}; bt.closest("tr").querySelectorAll("td").forEach(td => { o[td.dataset.l || "_"] = td.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim(); }); return o; }).catch(() => ({}));
const injecte = page => page.evaluate(() => !!window.__xss || !!document.querySelector("[data-xss]")).catch(() => true);
const cacher = page => page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }); document.dispatchEvent(new Event("visibilitychange")); });
const montrer = page => page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" }); document.dispatchEvent(new Event("visibilitychange")); });
const filtre = async (page, f) => { await page.click(`[data-filtre="${f}"]`); await attendre(page, 400); };
const toasts = page => page.evaluate(() => (window.__toasts || []).slice()).catch(() => []);
/* ---------- aides du compteur ---------- */
const jourParis = t => { const P = {}; new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(t)).forEach(x => { P[x.type] = x.value; }); return P.year + "-" + P.month + "-" + P.day; };
/* un instant tel que PostgREST le rend (timestamptz) : microsecondes et « +00:00 » */
const pgInstant = iso => String(iso).replace(/\.(\d{3})Z$/, ".$1456+00:00");
const FUSEAU = "Asia/Makassar";   // l'appareil du coach (Bali) : la date et l'heure s'affichent à son heure
/* la date et l'heure attendues (jj/mm/aaaa hh:mm à l'heure de l'appareil du coach), calculées sans l'app */
const quandCoach = v => { const P = {}; new Intl.DateTimeFormat("en-GB", { timeZone: FUSEAU, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(v)).forEach(x => { P[x.type] = x.value; }); return P.day + "/" + P.month + "/" + P.year + " " + P.hour + ":" + P.minute; };
const jourCoach = v => quandCoach(v).slice(0, 10);
const notees = (db, uid) => db.notees.filter(x => !uid || x.par === uid);
const hier = () => jourParis(Date.now() - J);
const TEXTE_CX = /Connexions|Dernière connexion|connexions? (notée|comptée)/i;
/* le décor du coach : des lignes dans la table (le compte de test, Thomas — non suivi —, Léa ; Marc n'en a pas) */
const CX_TEST = { nombre: 12, derniere: avant(3 * H), premiere: avant(20 * J) };
const CX_LEA = { nombre: 3, derniere: avant(26 * H), premiere: avant(3 * J) };
function avecLignes(db){
  const l = (uid, o) => { db.cx[uid] = Object.assign({ user_id: uid, dernier_jour: jourParis(Date.parse(o.derniere)) }, o, { derniere: pgInstant(o.derniere), premiere: pgInstant(o.premiere) }); };
  l(TESTEUR.id, CX_TEST); l(F.IDS.c1, { nombre: 5, derniere: avant(H), premiere: avant(10 * J) }); l(LEA, CX_LEA);
  return db;
}
/* les faits d'une carte de la page Prospects : { libellé : valeur } */
const faits = (page, uid) => page.$eval(`#pr-liste .sc-carte[data-uid="${uid}"]`, e => { const o = {}, k = []; e.querySelectorAll(".sc-faits li").forEach(li => { const a = (li.querySelector("span") || {}).textContent || "", v = (li.querySelector("b") || {}).textContent || ""; o[a.trim()] = v.trim(); k.push(a.trim()); }); o._ordre = k; return o; }).catch(() => ({}));
const titre = (page, uid, col) => page.$eval(`#tb-clients [data-ouvrir="${uid}"]`, (bt, c) => { const td = bt.closest("tr").querySelector(`td[data-l="${c}"] [title]`); return td ? td.getAttribute("title") : ""; }, col).catch(() => "");

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF61_PORT=9771 node verif61.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();
  URL0 = `http://localhost:${PORT}/`;

  /* =================== A. démarrage =================== */
  await bloc("A. démarrage : compte de test et prospect", async () => {
    const db = decor();
    db.cxRetard = 4000;   // la base répond lentement : l'app ne l'attend pas
    const { page } = await contexte(b, TESTEUR, db);
    const t0 = Date.now();
    await page.goto(URL0 + "#/accueil"); await pret(page, "#acc-vue h1");
    const duree = Date.now() - t0;
    await attendre(page, 4500);
    const N = notees(db);
    ok("A : compte de test (client, « test »), session enregistrée : UNE connexion notée, par un POST sans paramètre (« {} ») avec SON jeton", N.length === 1 && N[0].par === TESTEUR.id && N[0].m === "POST" && N[0].corps === "{}" && N[0].jeton === "Bearer jeton-" + TESTEUR.id, JSON.stringify(N));
    ok("A : … l'accueil s'affiche sans attendre la réponse (base lente : 4 s)", duree < 3800, duree + " ms");
    ok("A : … la base range 1 connexion, le jour de Paris, la dernière connexion", db.cx[TESTEUR.id] && db.cx[TESTEUR.id].nombre === 1 && db.cx[TESTEUR.id].dernier_jour === jourParis(Date.now()) && /^\d{4}-\d{2}-\d{2}T/.test(db.cx[TESTEUR.id].derniere), JSON.stringify(db.cx));
    ok("A : … rien d'autre n'est écrit, et il ne lit jamais la table", db.ecritures.length === 0 && db.cxLectures.length === 0, resume(db) + " " + JSON.stringify(db.cxLectures));
    const db2 = decor();
    const { page: p2 } = await contexte(b, qui(LEA, "lea@exemple.fr"), db2);
    await p2.goto(URL0); await pret(p2, "#vue"); await attendre(p2, 800);
    ok("A : prospecte Léa, session enregistrée : UNE connexion notée, avec son jeton ; rien d'autre écrit", notees(db2).length === 1 && notees(db2, LEA).length === 1 && db2.cx[LEA] && db2.cx[LEA].nombre === 1 && db2.ecritures.length === 0, JSON.stringify(notees(db2)) + " " + resume(db2));
  });

  await bloc("A. démarrage : jamais pour Thomas, le coach, l'écran de connexion", async () => {
    const db = decor();
    const { page } = await contexte(b, THOMAS, db);
    await page.goto(URL0); await pret(page, "#acc-vue h1");
    for (const h of ["#/programme", "#/suivi", "#/accueil"]) await aller(page, h, 900);
    ok("A : Thomas (client hors interrupteur) : aucune connexion notée", notees(db).length === 0, JSON.stringify(notees(db)));
    const dbc = decor();
    const { page: pc } = await coachSur(b, dbc, "#/tableau", "#tb-vue");
    for (const h of ["#/clients", "#/prospects"]) await aller(pc, h, 1200);
    await pc.evaluate(id => Clients.ouvrir(id, "Sans nom", "accueil"), TESTEUR.id); await attendre(pc, 1500);
    await aller(pc, "#/programme", 1000);
    await pc.reload(); await pret(pc, "#vue");
    ok("A : le coach (ses pages, la fiche du compte de test consultée, un rechargement) : aucune connexion notée", notees(dbc).length === 0, JSON.stringify(notees(dbc)));
    const dbn = decor();
    const { page: pn } = await contexte(b, null, dbn);
    await pn.goto(URL0); await pn.waitForSelector("#c-email"); await attendre(pn, 800);
    ok("A : écran de connexion (aucune session) : rien n'est noté", notees(dbn).length === 0, JSON.stringify(notees(dbn)));
  });

  await bloc("A. connexion par mot de passe, même jour, autre jour", async () => {
    const db = decor();
    db.connexions["lea@exemple.fr"] = LEA;
    const { page } = await contexte(b, null, db);
    await page.goto(URL0); await page.waitForSelector("#c-email");
    await page.fill("#c-email", "lea@exemple.fr"); await page.fill("#c-mdp", "motdepasse1"); await page.click("#c-go");
    await pret(page, "#vue"); await attendre(page, 800);
    ok("A : Léa se connecte avec son mot de passe : après le rechargement, UNE connexion notée pour elle", notees(db).length === 1 && notees(db, LEA).length === 1 && db.tokens.includes("password") && db.cx[LEA] && db.cx[LEA].nombre === 1, JSON.stringify(notees(db)) + " " + JSON.stringify(db.tokens));
    const d1 = db.cx[LEA].derniere;
    await attendre(page, 1100);
    await page.reload(); await pret(page, "#vue"); await attendre(page, 800);
    ok("A : elle rouvre l'app le même jour : notée de nouveau, mais toujours 1 connexion ; la dernière connexion avance", notees(db, LEA).length === 2 && db.cx[LEA].nombre === 1 && db.cx[LEA].derniere > d1, JSON.stringify(db.cx[LEA]));
    db.cx[LEA].dernier_jour = hier();
    await page.reload(); await pret(page, "#vue"); await attendre(page, 800);
    ok("A : elle rouvre l'app un autre jour : 2 connexions", notees(db, LEA).length === 3 && db.cx[LEA].nombre === 2 && db.cx[LEA].dernier_jour === jourParis(Date.now()), JSON.stringify(db.cx[LEA]));
  });

  /* =================== B. l'app revenue au premier plan =================== */
  await bloc("B. premier plan après 10 min", async () => {
    const db = decor();
    const { page } = await contexte(b, qui(LEA, "lea@exemple.fr"), db, { horloge: true });
    await page.goto(URL0); await pret(page, "#vue"); await attendre(page, 600);
    const n0 = notees(db, LEA).length;
    await cacher(page); await page.clock.fastForward(5 * MIN); await montrer(page); await attendre(page, 800);
    ok("B : l'app 5 min en arrière-plan puis revenue : rien de plus", n0 === 1 && notees(db, LEA).length === 1, n0 + " puis " + notees(db, LEA).length);
    await cacher(page); await page.clock.fastForward(4 * MIN); await cacher(page); await page.clock.fastForward(7 * MIN); await montrer(page); await attendre(page, 800);
    ok("B : 11 min en arrière-plan (deux « masquée » de suite comptent depuis la première) puis revenue : une nouvelle ouverture notée", notees(db, LEA).length === 2, String(notees(db, LEA).length));
    await montrer(page); await attendre(page, 500);
    ok("B : « visible » une deuxième fois sans être passée en arrière-plan : rien de plus", notees(db, LEA).length === 2, String(notees(db, LEA).length));
    const dbt = decor();
    const { page: pt } = await contexte(b, THOMAS, dbt, { horloge: true });
    await pt.goto(URL0); await pret(pt, "#acc-vue h1");
    await cacher(pt); await pt.clock.fastForward(11 * MIN); await montrer(pt); await attendre(pt, 800);
    ok("B : Thomas (non suivi) : 11 min en arrière-plan puis revenue : toujours rien", notees(dbt).length === 0, JSON.stringify(notees(dbt)));
  });

  await bloc("B. jeton expiré au retour", async () => {
    /* le cas le plus courant sur téléphone : l'app revient après plus d'une heure, le jeton a expiré (401) : l'app renouvelle
       la session et réessaie une fois, sans bandeau « session perdue » */
    const db = decor();
    const { page } = await contexte(b, qui(LEA, "lea@exemple.fr"), db, { horloge: true });
    await page.goto(URL0); await pret(page, "#vue"); await attendre(page, 600);
    const d1 = db.cx[LEA] && db.cx[LEA].derniere;
    db.cx401 = 1;
    await cacher(page); await page.clock.fastForward(70 * MIN); await montrer(page); await attendre(page, 1500);
    ok("B : revenue après 70 min, jeton refusé (401) : session renouvelée, la connexion est notée au 2e essai, sans bandeau « session perdue »", notees(db, LEA).length === 3 && db.tokens.includes("refresh_token") && db.cx[LEA].nombre === 1 && db.cx[LEA].derniere > d1 && !(await page.$("#session-perdue")), notees(db, LEA).length + " " + JSON.stringify(db.tokens) + " " + JSON.stringify(db.cx[LEA]));
  });

  /* =================== C. base sans la migration, retour arrière, réseau coupé =================== */
  await bloc("C. base sans la migration (404)", async () => {
    const db = decor(); db.cxAbsente = true;
    const { page } = await contexte(b, qui(LEA, "lea@exemple.fr"), db, { horloge: true });
    await page.goto(URL0); await pret(page, "#vue"); await attendre(page, 800);
    const vu = norm(await page.evaluate(() => document.body.innerText));
    ok("C : fonction absente (404) : un seul essai, son accueil s'affiche, aucun message", notees(db).length === 1 && !!(await page.$("#dc-vue, #acc-vue")) && !/erreur|indisponible|connexion/i.test(vu) && (await toasts(page)).length === 0, notees(db).length + " | " + vu.slice(0, 200) + " | " + JSON.stringify(await toasts(page)));
    await cacher(page); await page.clock.fastForward(11 * MIN); await montrer(page); await attendre(page, 800);
    ok("C : … revenue après 11 min : plus d'essai avant le prochain chargement", notees(db).length === 1, String(notees(db).length));
    const { page: pc } = await coachSur(b, db, "#/clients", "#tb-clients [data-ouvrir]");
    const T = await ligneClient(pc, TESTEUR.id), Le = await ligneClient(pc, LEA);
    ok("C : coach, table absente : Mes clients s'affiche, « — » dans les deux colonnes (compte de test et Léa), info-bulle « indisponibles »", T["Connexions"] === "—" && T["Dernière connexion"] === "—" && Le["Connexions"] === "—" && Le["Dernière connexion"] === "—" && /indisponibles/.test(await titre(pc, LEA, "Connexions")), JSON.stringify([T["Connexions"], T["Dernière connexion"], Le["Connexions"]]) + " " + (await titre(pc, LEA, "Connexions")));
    await aller(pc, "#/prospects", 1800);
    const fm = await faits(pc, MARC);
    ok("C : … la page Prospects s'affiche, cartes avec « Connexions — » et « Dernière connexion — »", (await pc.$$("#pr-liste .sc-carte")).length > 0 && fm["Connexions"] === "—" && fm["Dernière connexion"] === "—", JSON.stringify(fm));
  });

  await bloc("C. retour arrière (403) et réseau coupé", async () => {
    const db = decor(); db.cxRefusee = true;
    const { page } = await contexte(b, TESTEUR, db, { horloge: true });
    await page.goto(URL0 + "#/accueil"); await pret(page, "#acc-vue h1"); await attendre(page, 600);
    await cacher(page); await page.clock.fastForward(11 * MIN); await montrer(page); await attendre(page, 800);
    ok("C : fonction refusée (403, retour arrière) : un seul essai, l'accueil s'affiche, pas d'autre essai au retour", notees(db).length === 1 && !!(await page.$("#acc-vue h1")) && (await toasts(page)).length === 0, notees(db).length + " " + JSON.stringify(await toasts(page)));
    const { page: pc } = await coachSur(b, db, "#/clients", "#tb-clients [data-ouvrir]");
    const T = await ligneClient(pc, TESTEUR.id);
    ok("C : … coach, lecture refusée : « — » dans les deux colonnes", T["Connexions"] === "—" && T["Dernière connexion"] === "—", JSON.stringify(T));
    const dbp = decor(); dbp.cxPanne = true;
    const { page: pp } = await contexte(b, qui(LEA, "lea@exemple.fr"), dbp, { horloge: true });
    await pp.goto(URL0); await pret(pp, "#vue"); await attendre(pp, 600);
    await cacher(pp); await pp.clock.fastForward(11 * MIN); await montrer(pp); await attendre(pp, 800);
    ok("C : réseau coupé pendant l'envoi : rien d'affiché, et nouvel essai à l'ouverture suivante (2 essais)", notees(dbp).length === 2 && (await toasts(pp)).length === 0, notees(dbp).length + " " + JSON.stringify(await toasts(pp)));
  });

  /* =================== D. Mes clients =================== */
  await bloc("D. Mes clients", async () => {
    const db = avecLignes(decor());
    const { page } = await coachSur(b, db, "#/clients", "#tb-clients [data-ouvrir]", { fuseau: FUSEAU });
    const th = await page.$$eval(".tb-clients-table thead th", l => l.map(e => e.textContent.trim()));
    const i = th.indexOf("Connexions");
    ok("D : en-têtes « Connexions » puis « Dernière connexion », juste après « Jours actifs », avant « Activité »", i > 0 && th[i - 1] === "Jours actifs" && th[i + 1] === "Dernière connexion" && th[i + 2] === "Activité", JSON.stringify(th));
    const T = await ligneClient(page, TESTEUR.id);
    ok("D : compte de test : « 12 » et la date et l'heure de sa dernière connexion (" + quandCoach(CX_TEST.derniere) + ", heure de l'appareil du coach)", T["Connexions"] === "12" && T["Dernière connexion"] === quandCoach(CX_TEST.derniere), JSON.stringify([T["Connexions"], T["Dernière connexion"]]));
    ok("D : … info-bulle « comptées depuis le " + jourCoach(CX_TEST.premiere) + " »", (await titre(page, TESTEUR.id, "Connexions")) === "Une connexion par jour au plus, comptées depuis le " + jourCoach(CX_TEST.premiere), await titre(page, TESTEUR.id, "Connexions"));
    const Th = await ligneClient(page, F.IDS.c1);
    ok("D : Thomas (non suivi) : « — » dans les deux colonnes, même avec une ligne dans la table ; info-bulle « non suivies »", Th["Connexions"] === "—" && Th["Dernière connexion"] === "—" && /non suivies/.test(await titre(page, F.IDS.c1, "Connexions")), JSON.stringify([Th["Connexions"], Th["Dernière connexion"]]));
    const Le = await ligneClient(page, LEA), Ma = await ligneClient(page, MARC), Ka = await ligneClient(page, KARIM);
    ok("D : prospecte Léa : « 3 » et " + quandCoach(CX_LEA.derniere) + " ; Marc (prospect, jamais connecté depuis) : « 0 » et « aucune »", Le["Connexions"] === "3" && Le["Dernière connexion"] === quandCoach(CX_LEA.derniere) && Ma["Connexions"] === "0" && Ma["Dernière connexion"] === "aucune" && /Aucune connexion notée/.test(await titre(page, MARC, "Connexions")), JSON.stringify([Le["Connexions"], Le["Dernière connexion"], Ma["Connexions"], Ma["Dernière connexion"]]));
    ok("D : Karim (client hors interrupteur, sans ligne) : « — »", Ka["Connexions"] === "—" && Ka["Dernière connexion"] === "—", JSON.stringify([Ka["Connexions"], Ka["Dernière connexion"]]));
    ok("D : la phrase sous le tableau explique les deux colonnes", /« Connexions » : le nombre de jours où il a ouvert l'app connecté/.test(await texte(page, "#vue")) && /« Dernière connexion » : la date et l'heure/.test(await texte(page, "#vue")), "");
    ok("D : la table est lue une fois par le coach, sans écriture", db.cxLectures.length === 1 && db.cxLectures[0].par === COACH.id && db.cxLectures[0].m === "GET" && db.ecritures.length === 0, JSON.stringify(db.cxLectures) + " " + resume(db));
    ok("D : aucune connexion notée pour le coach", notees(db).length === 0, JSON.stringify(notees(db)));
  });

  await bloc("D. Mes clients sur téléphone", async () => {
    const db = avecLignes(decor());
    const { page } = await coachSur(b, db, "#/clients", "#tb-clients [data-ouvrir]", { viewport: MOBILE, fuseau: FUSEAU });
    const lbl = await page.$eval(`#tb-clients [data-ouvrir="${TESTEUR.id}"]`, bt => { const tr = bt.closest("tr"); const g = l => { const td = tr.querySelector(`td[data-l="${l}"]`); return td ? { t: td.textContent.trim(), avant: getComputedStyle(td, "::before").content, vis: td.getBoundingClientRect().width > 0 } : null; }; return [g("Connexions"), g("Dernière connexion")]; });
    ok("D : téléphone 390 px : les deux lignes de la carte portent leur libellé et leur valeur", lbl[0] && lbl[1] && lbl[0].vis && lbl[1].vis && /Connexions/.test(lbl[0].avant) && /Dernière connexion/.test(lbl[1].avant) && lbl[0].t === "12", JSON.stringify(lbl));
    ok("D : … la page ne déborde pas en largeur", !(await deborde(page)), await largeur(page));
  });

  /* =================== E. page Prospects =================== */
  await bloc("E. page Prospects", async () => {
    const db = avecLignes(decor());
    const { page } = await coachSur(b, db, "#/prospects", "#pr-liste", { fuseau: FUSEAU });
    await filtre(page, "tous");
    const fl = await faits(page, LEA), fm = await faits(page, MARC), o = fl._ordre || [];
    ok("E : carte de Léa : « Connexions 3 » et « Dernière connexion " + quandCoach(CX_LEA.derniere) + " », juste après les jours actifs", fl["Connexions"] === "3" && fl["Dernière connexion"] === quandCoach(CX_LEA.derniere) && o.indexOf("Connexions") === o.indexOf("Jours actifs (30 j)") + 1 && o.indexOf("Dernière connexion") === o.indexOf("Connexions") + 1, JSON.stringify(fl));
    ok("E : carte de Marc (jamais connecté depuis) : « Connexions 0 » et « Dernière connexion aucune »", fm["Connexions"] === "0" && fm["Dernière connexion"] === "aucune", JSON.stringify(fm));
    ok("E : la phrase d'aide explique les deux lignes", /« Connexions » : le nombre de jours où il a ouvert l'app connecté/.test(await texte(page, "#vue")), "");
    ok("E : aucune écriture, aucune connexion notée pour le coach", db.ecritures.length === 0 && notees(db).length === 0, resume(db));
  });

  /* =================== F. rien côté client ni prospect =================== */
  await bloc("F. rien côté client ni prospect", async () => {
    const db = avecLignes(decor());
    const { page } = await contexte(b, TESTEUR, db);
    await page.goto(URL0 + "#/accueil"); await pret(page, "#acc-vue h1");
    const vus = [];
    for (const h of ["#/accueil", "#/programme", "#/suivi", "#/mensurations", "#/profil"]) { await aller(page, h, 1100); vus.push(norm(await page.evaluate(() => document.body.innerText))); }
    ok("F : compte de test (client) : aucune de ses pages ne parle du compteur ; il ne lit jamais la table", vus.every(t => !TEXTE_CX.test(t)) && db.cxLectures.length === 0, (vus.find(t => TEXTE_CX.test(t)) || "").slice(0, 160) + " " + JSON.stringify(db.cxLectures));
    const { page: pl } = await contexte(b, qui(LEA, "lea@exemple.fr"), db);
    await pl.goto(URL0); await pret(pl, "#vue");
    const vl = [];
    for (const h of ["#/accueil", "#/formation", "#/calculateur", "#/profil", "#/clients", "#/prospects"]) { await aller(pl, h, 1100); vl.push(norm(await pl.evaluate(() => document.body.innerText))); }
    ok("F : prospecte Léa (même en tapant #/clients ou #/prospects) : rien du compteur, aucune lecture de la table", vl.every(t => !TEXTE_CX.test(t)) && db.cxLectures.length === 0, (vl.find(t => TEXTE_CX.test(t)) || "").slice(0, 160) + " " + JSON.stringify(db.cxLectures));
    const lecture = await pl.evaluate(() => Clients.lireConnexions());
    ok("F : … même en appelant la lecture elle-même, la base ne lui rend aucune ligne", lecture && typeof lecture === "object" && Object.keys(lecture).length === 0, JSON.stringify(lecture));
  });

  /* =================== G. interrupteur suivi_visites_clients =================== */
  await bloc("G. interrupteur « tous » et « off »", async () => {
    await avec([['suivi_visites_clients: "test"', 'suivi_visites_clients: "tous"']], async () => {
      const db = avecLignes(decor());
      const { page } = await contexte(b, THOMAS, db);
      await page.goto(URL0); await pret(page, "#acc-vue h1"); await attendre(page, 600);
      ok("G : « tous » : Thomas est noté à l'ouverture", notees(db, F.IDS.c1).length === 1, JSON.stringify(notees(db)));
      const { page: pc } = await coachSur(b, db, "#/clients", "#tb-clients [data-ouvrir]", { fuseau: FUSEAU });
      const Th = await ligneClient(pc, F.IDS.c1);
      ok("G : « tous » : Mes clients montre ses connexions (5)", Th["Connexions"] === "5" && /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(Th["Dernière connexion"] || ""), JSON.stringify([Th["Connexions"], Th["Dernière connexion"]]));
    });
    await avec([['suivi_visites_clients: "test"', 'suivi_visites_clients: "off"']], async () => {
      const db = avecLignes(decor());
      const { page } = await contexte(b, TESTEUR, db);
      await page.goto(URL0 + "#/accueil"); await pret(page, "#acc-vue h1"); await attendre(page, 600);
      const { page: pl } = await contexte(b, qui(LEA, "lea@exemple.fr"), db);
      await pl.goto(URL0); await pret(pl, "#vue"); await attendre(pl, 600);
      ok("G : « off » : le compte de test n'est pas noté ; la prospecte Léa, si", notees(db, TESTEUR.id).length === 0 && notees(db, LEA).length === 1, JSON.stringify(notees(db)));
      const { page: pc } = await coachSur(b, db, "#/clients", "#tb-clients [data-ouvrir]");
      const T = await ligneClient(pc, TESTEUR.id), Le = await ligneClient(pc, LEA);
      ok("G : « off » : Mes clients montre « — » pour le compte de test ; Léa : 4 (ses 3, plus son ouverture d'aujourd'hui)", T["Connexions"] === "—" && Le["Connexions"] === "4", JSON.stringify([T["Connexions"], Le["Connexions"]]));
    });
  });

  /* =================== H. données piégées =================== */
  await bloc("H. données piégées", async () => {
    const db = decor();
    db.cx[TESTEUR.id] = { user_id: TESTEUR.id, nombre: "12" + PIEGE, derniere: PIEGE, premiere: "pas une date" };
    db.cx[LEA] = { user_id: LEA, nombre: -4, derniere: 1234, premiere: null };
    db.cx[MARC] = { user_id: MARC, nombre: 2.7, derniere: { a: 1 }, premiere: [PIEGE] };
    db.cx["pas-un-compte"] = { user_id: "pas-un-compte", nombre: 99, derniere: avant(H), premiere: avant(J) };
    const { page } = await coachSur(b, db, "#/clients", "#tb-clients [data-ouvrir]", { fuseau: FUSEAU });
    const T = await ligneClient(page, TESTEUR.id), Le = await ligneClient(page, LEA), Ma = await ligneClient(page, MARC);
    const tout = norm(await page.evaluate(() => document.body.innerText));
    ok("H : nombre et dates piégés : « 0 » / « aucune » (nombre décimal : arrondi à 2), rien de brut, rien d'injecté", T["Connexions"] === "0" && T["Dernière connexion"] === "aucune" && Le["Connexions"] === "0" && Le["Dernière connexion"] === "aucune" && Ma["Connexions"] === "2" && Ma["Dernière connexion"] === "aucune" && !RIEN_DE_BRUT.test(tout) && !(await injecte(page)), JSON.stringify([T["Connexions"], T["Dernière connexion"], Le["Connexions"], Ma["Connexions"], Ma["Dernière connexion"]]));
    await aller(page, "#/prospects", 1800); await filtre(page, "tous");
    ok("H : … la page Prospects s'affiche aussi, sans injection", (await page.$$("#pr-liste .sc-carte")).length > 0 && !(await injecte(page)) && !RIEN_DE_BRUT.test(norm(await page.evaluate(() => document.body.innerText))), "");
  });

  /* =================== Z. rien vers l'extérieur =================== */
  await bloc("Z. hôtes externes", async () => {
    /* polices et vignettes des vidéos de la Speed Formation : chargées par l'app (conditions), bloquées ici */
    const autres = Array.from(externes).filter(h => !/^(fonts\.(googleapis|gstatic)\.com|img\.youtube\.com)$/.test(h));
    ok("Z : aucune requête vers un autre hôte que la page, le faux Supabase, les polices et les vignettes YouTube (bloquées)", autres.length === 0, JSON.stringify(autres));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
