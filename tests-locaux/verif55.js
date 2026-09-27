/* verif55 — Chantier 1 (v52) : le parcours prospect et ses corrections, vérifiés de bout en bout dans un vrai navigateur.
   Lot A :
   A. interrupteurs des nouveautés (CONFIG.nouveautes, objet Interrupteurs) : « test » = le coach et les comptes de test
      seulement, « tous » = tout le monde, « off » ou valeur inconnue = personne ; comptes de test = identifiants, jamais
      d'email ; l'objet Nouveautes (notifications du coach) est toujours là, à part ;
   B. corrections de la nuit du 28/09 : erreurs d'envoi d'email en français (et en anglais), jamais le texte brut de
      Supabase (inscription, mot de passe oublié, changement d'adresse dans le Profil) ; changement d'adresse en deux
      liens (premier lien, dernier lien, connecté ou non, session renouvelée après le dernier lien) ;
   C. adresse réécrite quand la page demandée n'est pas pour la personne (client, prospect, coach), sans boucle ; le
      coach sur #/accueil hors fiche : « Ouvrir » du tableau de bord ouvre bien la fiche ;
   D. première connexion d'un client sur téléphone : le Profil s'ouvre en haut (écran de connexion défilé, polices
      lentes), l'encadré « Bienvenue ! » sous l'en-tête, un seul affichage (intake lu 2 fois) ; l'encadré en anglais ;
   Z. aucun appel vers l'extérieur.
   Supabase simulé (gabarit de tests-locaux, carte 6 §15) : rien ne part vers la vraie base (routage par NOM D'HÔTE,
   jamais par sous-chaîne : README, « Règle d'or ») ; règles de la base reproduites (HANDOFF §2.3, v49) ; appelant
   reconnu à son jeton ; chaque écriture est appliquée en mémoire et notée, chaque lecture de « donnees » aussi ;
   réponses coupées à 1 000 lignes, Range et order= respectés. Dates relatives au lancement. Chaque bloc tourne à part
   (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif55.js ../index.html
           VERIF55_PORT=9711 node verif55.js ../index.html     (autre port, si 9710 est pris)
           VERIF55_BLOCS="A.,C." node verif55.js …              (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF55_PORT || 9710;
const BLOCS = (process.env.VERIF55_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const MOBILE = { width: 390, height: 844 }, ORDI = { width: 1280, height: 900 };

/* ---------- la page servie : le fichier testé, retouché le temps d'un bloc (avec) ---------- */
let retouches = [];
const server = http.createServer((req, res) => {
  let h = fs.readFileSync(HTML, "utf8");
  for (const [de, vers] of retouches) h = h.split(de).join(vers);
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(h);
});
/* une retouche dont le texte a disparu du fichier ne passe jamais en silence : le bloc s'interrompt */
async function avec(liste, fn){
  const h = fs.readFileSync(HTML, "utf8");
  for (const [de] of liste) if (!h.includes(de)) throw new Error("retouche impossible, texte absent du fichier : " + de);
  retouches = liste;
  try { await fn(); } finally { retouches = []; }
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
const PID = k => "00000000-0000-4000-8000-0000000055" + String(k).padStart(2, "0");   // verif55 : …55kk (une plage par suite)
const INTAKE_THOMAS = clone(F.donnees.find(d => d.user_id === F.IDS.c1 && d.outil === "intake").contenu);

/* ---------- le décor : fixtures.js (coach, Thomas, Sarah, Julien, tous « client ») + les comptes du bloc ----------
   comptes : [{ id, prenom, nom, statut ("prospect" par défaut), cree (instant ISO), email, donnees: [[outil, contenu, maj_le]] }]
   cles : [[user_id, outil, contenu, maj_le]] ajoutées à un compte existant */
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  const donnees = clone(F.donnees);
  donnees.forEach(d => { if (d.user_id === F.IDS.c3) d.maj_le = avant(12 * J + 3 * H); });   // Julien : 12 j entiers pendant toute la suite
  const db = { profils, donnees, emails_prospects: [], sansJournal: false, ecritures: [], refus: [], lectures: [], journal: [], chemins: [],
    fonctions: [], inscriptions: [], emails: {}, connexions: {}, inscription: {}, lectureKo: opts.lectureKo || [], retardLecture: {}, retard: {},
    reponseFonction: { status: 200, body: { ok: true } },
    /* v52 (lot A) : mot de passe oublié et changement d'adresse (erreurs simulées), renouvellements de session, polices lentes */
    oublis: [], recover: {}, majUsers: [], majUser: {}, tokens: [], polices: null };
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

/* ---------- les textes attendus (FR et EN), repris de DECOUVERTE.inscription (v51, corrections de la nuit du 28/09) ---------- */
const TX = {
  envoi_rate: "L'email n'a pas pu partir (souci de notre côté). Réessaie dans un moment ; si ça continue, écris-moi sur Instagram (@lucasmhxcoaching).",
  envoi_rate_en: "The email could not be sent (a problem on our side). Try again in a moment; if it keeps happening, message me on Instagram (@lucasmhxcoaching).",
  trop_emails: "Beaucoup d'inscriptions en ce moment : réessaie dans une heure.",
  trop_demandes: "Trop de demandes d'un coup : réessaie dans une minute.",
  trop_emails_compte: "Trop d'emails envoyés en peu de temps : réessaie dans une heure.",
  trop_emails_compte_en: "Too many emails sent in a short time: try again in an hour.",
  premier_lien: "Premier lien accepté : clique maintenant celui reçu sur ton autre adresse. Le changement d'email est fait au deuxième clic.",
  premier_lien_en: "First link accepted: now click the one sent to your other address. The email change is done on the second click.",
  email_change: "Ton adresse email est changée : utilise la nouvelle pour te connecter.",
  email_change_en: "Your email address has been changed: use the new one to sign in.",
  profil_ok: e => "Un lien de confirmation part sur " + e + ", et par sécurité un autre sur ton adresse actuelle : clique les deux. Le changement est fait au dernier clic.",
  profil_ok_en: e => "A confirmation link is on its way to " + e + ", and for security another one to your current address: click both. The change is done on the last click.",
  profil_note: "Un lien de confirmation part sur la nouvelle adresse (et, par sécurité, un autre sur l'ancienne : clique les deux).",
  profil_note_en: "A confirmation link is sent to the new address (and, for security, another one to the old address: click both)."
};
const LIEN_DERNIER = "#access_token=abc.def.ghi&expires_in=3600&refresh_token=xyz&token_type=bearer&type=email_change";
const LIEN_PREMIER = "#message=Confirmation+link+accepted.++Please+proceed+to+confirm+link+sent+to+the+other+email";

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF55_PORT=9711 node verif55.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();
  const URL0 = `http://localhost:${PORT}/`;

  /* =================== A. interrupteurs des nouveautés =================== */
  await bloc("A. interrupteurs", async () => {
    /* le compte de test est lu dans le fichier servi (dépôt public : jamais recopié ici, jamais d'email) */
    const src = fs.readFileSync(HTML, "utf8");
    const conf = (/\n  nouveautes: \{([\s\S]*?)\n  \},/.exec(src) || [, ""])[1];
    const tab = (/comptes_test:\s*\[([^\]]*)\]/.exec(conf) || [, ""])[1];
    const ids = (tab.match(/"[^"]*"/g) || []).map(x => JSON.parse(x));
    const TEST = ids[0] || null;
    ok("CONFIG.nouveautes dans le fichier : feedback_dimanche sur « test », au moins un compte de test, que des identifiants Supabase (aucun « @ »)",
      /feedback_dimanche:\s*"test"/.test(conf) && ids.length >= 1 && ids.every(x => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(x)) && tab.indexOf("@") === -1, JSON.stringify(conf.slice(0, 300)));

    /* coach */
    {
      const db = base();
      const { c, page } = await contexte(b, COACH, db);
      await page.goto(URL0); await pret(page, "#tb-vue");
      const r = await page.evaluate(({ t, th }) => ({
        etat: Interrupteurs.etat("feedback_dimanche"), visible: Interrupteurs.visible("feedback_dimanche"),
        pourTest: Interrupteurs.pourCompte("feedback_dimanche", t), pourThomas: Interrupteurs.pourCompte("feedback_dimanche", th),
        pourRien: Interrupteurs.pourCompte("feedback_dimanche", "") || Interrupteurs.pourCompte("feedback_dimanche", null),
        inconnu: Interrupteurs.etat("pas_une_nouveaute"), visibleInconnu: Interrupteurs.visible("pas_une_nouveaute"), pourInconnu: Interrupteurs.pourCompte("pas_une_nouveaute", t),
        sansArobase: Array.isArray(CONFIG.nouveautes.comptes_test) && CONFIG.nouveautes.comptes_test.every(x => typeof x === "string" && x.indexOf("@") === -1),
        notifs: typeof Nouveautes === "object" && typeof Nouveautes.monter === "function" && typeof Nouveautes.badge === "function" && Nouveautes !== Interrupteurs
      }), { t: TEST, th: F.IDS.c1 });
      ok("coach : « test » → la nouveauté lui est visible (Interrupteurs.visible)", r.etat === "test" && r.visible === true, JSON.stringify(r));
      ok("pourCompte en « test » : vrai pour le compte de test, faux pour Thomas et sans identifiant", r.pourTest === true && r.pourThomas === false && r.pourRien === false, JSON.stringify(r));
      ok("nouveauté inconnue : « off », invisible même pour le coach ; aucun « @ » dans comptes_test (page)", r.inconnu === "off" && r.visibleInconnu === false && r.pourInconnu === false && r.sansArobase, JSON.stringify(r));
      ok("les Nouveautés du coach (objet Nouveautes, notifications) sont toujours là, à part des interrupteurs", r.notifs === true, JSON.stringify(r));
      const v = await page.evaluate(({ t }) => {
        const out = {};
        for (const x of ["Tous", "TEST", "on", "oui", "", null, undefined, true, 1]) {
          CONFIG.nouveautes.feedback_dimanche = x;
          out[JSON.stringify(x === undefined ? "undefined" : x)] = [Interrupteurs.etat("feedback_dimanche"), Interrupteurs.visible("feedback_dimanche"), Interrupteurs.pourCompte("feedback_dimanche", t)];
        }
        CONFIG.nouveautes.feedback_dimanche = "off"; out.off = [Interrupteurs.etat("feedback_dimanche"), Interrupteurs.visible("feedback_dimanche"), Interrupteurs.pourCompte("feedback_dimanche", t)];
        CONFIG.nouveautes.feedback_dimanche = "tous"; out.tous = [Interrupteurs.etat("feedback_dimanche"), Interrupteurs.visible("feedback_dimanche"), Interrupteurs.pourCompte("feedback_dimanche", "n-importe-qui")];
        CONFIG.nouveautes.feedback_dimanche = "test";
        return out;
      }, { t: TEST });
      const inconnues = Object.keys(v).filter(k => k !== "off" && k !== "tous");
      ok("valeur inconnue (« Tous », « TEST », « on », « oui », vide, null, absente, true, 1) : « off », invisible même pour le coach et le compte de test",
        inconnues.length === 9 && inconnues.every(k => v[k][0] === "off" && v[k][1] === false && v[k][2] === false), JSON.stringify(v));
      ok("« off » : invisible pour le coach et le compte de test ; « tous » : visible, et pour n'importe quel compte", JSON.stringify(v.off) === '["off",false,false]' && JSON.stringify(v.tous) === '["tous",true,true]', JSON.stringify(v));
      ok("coach : aucune écriture", db.ecritures.length === 0, resume(db));
      await c.close();
    }

    /* Thomas (client, pas compte de test), puis ajouté à comptes_test à chaud */
    {
      const db = base();
      const { c, page } = await contexte(b, THOMAS, db);
      await page.goto(URL0); await pret(page, "#acc-vue");
      const r = await page.evaluate(() => {
        const nom = "feedback_dimanche", uid = Auth.utilisateur().id;
        const a = { visible: Interrupteurs.visible(nom), pour: Interrupteurs.pourCompte(nom, uid) };
        CONFIG.nouveautes.comptes_test.push(uid);
        const b2 = { visible: Interrupteurs.visible(nom), pour: Interrupteurs.pourCompte(nom, uid) };
        CONFIG.nouveautes.comptes_test.pop();
        const c2 = { visible: Interrupteurs.visible(nom), pour: Interrupteurs.pourCompte(nom, uid) };
        return { a, b: b2, c: c2 };
      });
      ok("Thomas (client, pas compte de test) en « test » : la nouveauté ne lui est pas visible", r.a.visible === false && r.a.pour === false, JSON.stringify(r));
      ok("Thomas ajouté à comptes_test à chaud : visible, pourCompte vrai ; retiré : plus visible", r.b.visible === true && r.b.pour === true && r.c.visible === false && r.c.pour === false, JSON.stringify(r));
      ok("Thomas : aucune écriture", db.ecritures.length === 0, resume(db));
      await c.close();
    }

    /* le compte de test lui-même (sans prénom ni nom, comme le vrai) */
    if (TEST) {
      const db = base({ comptes: [{ id: TEST, prenom: "", nom: "", statut: "client", cree: avant(3 * J), donnees: [["intake", INTAKE_THOMAS, avant(2 * J)]] }] });
      const { c, page } = await contexte(b, qui(TEST, "test@exemple.fr"), db);
      await page.goto(URL0); await pret(page, "#acc-vue");
      const r = await page.evaluate(() => ({ coach: Auth.estCoach(), visible: Interrupteurs.visible("feedback_dimanche"), pour: Interrupteurs.pourCompte("feedback_dimanche", Auth.utilisateur().id) }));
      ok("compte client de test (son identifiant dans comptes_test) en « test » : la nouveauté lui est visible", r.coach === false && r.visible === true && r.pour === true, JSON.stringify(r));
      await c.close();
    } else ok("compte client de test : identifiant introuvable dans le fichier", false, conf);

    /* le fichier servi retouché : « tous », « off », valeur mal tapée */
    await avec([['feedback_dimanche: "test"', 'feedback_dimanche: "tous"']], async () => {
      const db = base();
      const { c, page } = await contexte(b, THOMAS, db);
      await page.goto(URL0); await pret(page, "#acc-vue");
      const r = await page.evaluate(() => [Interrupteurs.etat("feedback_dimanche"), Interrupteurs.visible("feedback_dimanche")]);
      ok("fichier sur « tous » : Thomas voit la nouveauté", JSON.stringify(r) === '["tous",true]', JSON.stringify(r));
      await c.close();
    });
    for (const [valeur, quoi] of [["off", "« off »"], ["Tous", "valeur mal tapée « Tous »"]]) {
      await avec([['feedback_dimanche: "test"', 'feedback_dimanche: "' + valeur + '"']], async () => {
        const db = base();
        const { c, page } = await contexte(b, COACH, db);
        await page.goto(URL0); await pret(page, "#tb-vue");
        const r = await page.evaluate(t => [Interrupteurs.etat("feedback_dimanche"), Interrupteurs.visible("feedback_dimanche"), Interrupteurs.pourCompte("feedback_dimanche", t)], TEST);
        ok("fichier sur " + quoi + " : personne, pas même le coach ni le compte de test", JSON.stringify(r) === '["off",false,false]', JSON.stringify(r));
        await c.close();
      });
    }

    /* une prospecte en « test » : rien */
    {
      const LEA = PID(1);
      const db = base({ comptes: [{ id: LEA, prenom: "Léa", nom: "", cree: avant(2 * J), email: "lea@exemple.fr" }] });
      const { c, page } = await contexte(b, qui(LEA, "lea@exemple.fr"), db);
      await page.goto(URL0); await pret(page);
      const r = await page.evaluate(() => [Auth.estProspect(), Interrupteurs.visible("feedback_dimanche")]);
      ok("prospecte en « test » : la nouveauté ne lui est pas visible", JSON.stringify(r) === "[true,false]", JSON.stringify(r));
      await c.close();
    }

    /* déconnecté (écran de connexion) : rien, sans erreur */
    {
      const db = base();
      const { c, page } = await contexte(b, null, db);
      await page.goto(URL0); await page.waitForSelector("#c-go"); await attendre(page, 300);
      const r = await page.evaluate(() => [Interrupteurs.etat("feedback_dimanche"), Interrupteurs.visible("feedback_dimanche")]);
      ok("déconnecté : invisible (aucune session)", JSON.stringify(r) === '["test",false]', JSON.stringify(r));
      await c.close();
    }
  });

  /* =================== B. corrections de la nuit : emails du compte =================== */
  await bloc("B. emails du compte", async () => {
    /* inscription (page servie avec inscription_libre: true) : erreurs d'envoi et limites */
    await avec([["inscription_libre: false", "inscription_libre: true"]], async () => {
      for (const [quoi, err, attendu, langue] of [
        ["serveur d'emails en panne", { status: 500, msg: "Error sending confirmation email" }, TX.envoi_rate, ""],
        ["limite horaire d'emails du projet", { status: 429, msg: "email rate limit exceeded" }, TX.trop_emails, ""],
        ["limite par adresse (inchangée)", { status: 429, msg: "For security purposes, you can only request this after 42 seconds." }, TX.trop_demandes, ""],
        ["serveur d'emails en panne, en anglais", { status: 500, msg: "Error sending confirmation email" }, TX.envoi_rate_en, "en"]]) {
        const db = base(); db.inscription.erreur = err;
        const { c, page } = await contexte(b, null, db, { langue });
        await page.goto(URL0 + "#/inscription"); await page.waitForSelector("#c-go"); await attendre(page, 300);
        await page.fill("#c-prenom", "Zoé"); if (await page.$("#c-nom")) await page.fill("#c-nom", "Martin");
        await page.fill("#c-email", "zoe@exemple.fr"); await page.fill("#c-mdp", "motdepasse1");
        await page.check("#c-cgu"); await page.check("#c-sante");
        await page.click("#c-go"); await attendre(page, 900);
        const t = norm(await page.textContent("#co-err").catch(() => ""));
        ok("inscription, " + quoi + " (« " + err.msg + " ») : « " + attendu.slice(0, 60) + "… », jamais le texte brut", db.inscriptions.length === 1 && t.includes(attendu) && !t.includes(err.msg), t);
        await c.close();
      }
    });
    /* mot de passe oublié */
    for (const [quoi, err, attendu, interdit, langue] of [
      ["serveur d'emails en panne (« Error sending recovery email »)", { status: 500, msg: "Error sending recovery email" }, TX.envoi_rate, /Error sending/, ""],
      ["limite horaire d'emails du projet : message neutre (pas « Beaucoup d'inscriptions »)", { status: 429, msg: "email rate limit exceeded" }, TX.trop_emails_compte, /inscriptions|rate limit/i, ""],
      ["limite horaire d'emails, en anglais", { status: 429, msg: "email rate limit exceeded" }, TX.trop_emails_compte_en, /sign-ups|rate limit/i, "en"]]) {
      const db = base(); db.recover.erreur = err;
      const { c, page } = await contexte(b, null, db, { langue });
      await page.goto(URL0); await page.waitForSelector("#c-go"); await attendre(page, 300);
      await page.click('[data-mode="oubli"]'); await attendre(page, 300);
      await page.fill("#c-email", "client@exemple.fr"); await page.click("#c-go"); await attendre(page, 900);
      const t = norm(await page.textContent("#co-err").catch(() => ""));
      ok("mot de passe oublié, " + quoi + " : message traduit", db.oublis.length === 1 && t.includes(attendu) && !interdit.test(t), t);
      await c.close();
    }
    /* liens de changement d'adresse, déconnecté */
    for (const [quoi, lien, attendu, langue] of [
      ["dernier lien cliqué (#access_token=…&type=email_change)", LIEN_DERNIER, TX.email_change, ""],
      ["premier lien cliqué (#message=Confirmation link accepted…)", LIEN_PREMIER, TX.premier_lien, ""],
      ["premier lien cliqué, en anglais", LIEN_PREMIER, TX.premier_lien_en, "en"]]) {
      const db = base();
      const { c, page } = await contexte(b, null, db, { langue });
      await page.goto(URL0 + lien); await page.waitForSelector("#c-go"); await attendre(page, 700);
      const t = norm(await page.textContent("#co-err").catch(() => "")), corpsPage = await page.textContent("body").catch(() => "");
      ok("changement d'adresse, " + quoi + ", déconnecté : « " + attendu.slice(0, 50) + "… », adresse nettoyée (ni jeton ni message), jamais l'anglais brut",
        t.includes(attendu) && !/access_token|message=/.test(page.url()) && !/Confirmation link accepted/.test(corpsPage), t + " · " + page.url());
      await c.close();
    }
    /* liens de changement d'adresse, connecté (Thomas) : un mot, et après le dernier lien la session est renouvelée tout de suite */
    {
      const db = base(); db.emails[F.IDS.c1] = "thomas.nouveau@exemple.fr";   // la base connaît déjà la nouvelle adresse
      const { c, page } = await contexte(b, THOMAS, db);
      await page.goto(URL0 + LIEN_DERNIER); await pret(page, "#acc-vue"); await attendre(page, 900);
      const r = await page.evaluate(() => ({ toasts: window.__toasts || [], email: (Auth.utilisateur() || {}).email }));
      ok("dernier lien, connecté : « " + TX.email_change + " », adresse nettoyée", r.toasts.some(x => norm(x).includes(TX.email_change)) && !/access_token/.test(page.url()), JSON.stringify(r.toasts) + " · " + page.url());
      ok("… session renouvelée tout de suite (Auth.rafraichir) : l'app connaît la nouvelle adresse, et le Profil l'affiche", db.tokens.includes("refresh_token") && r.email === "thomas.nouveau@exemple.fr" && await (async () => { await aller(page, "#/profil", 1800); return (await texte(page, "#vue")).includes("Adresse actuelle : thomas.nouveau@exemple.fr"); })(), JSON.stringify(db.tokens) + " · " + r.email);
      ok("… aucune écriture de données", ecrDonnees(db).length === 0, resume(db));
      await c.close();
    }
    {
      const db = base();
      const { c, page } = await contexte(b, THOMAS, db);
      await page.goto(URL0 + LIEN_PREMIER); await pret(page, "#acc-vue"); await attendre(page, 900);
      const toasts = await page.evaluate(() => window.__toasts || []);
      ok("premier lien, connecté : « Premier lien accepté… », adresse nettoyée, pas de renouvellement de session", toasts.some(x => norm(x).includes(TX.premier_lien)) && !/message=/.test(page.url()) && !db.tokens.includes("refresh_token"), JSON.stringify(toasts) + " · " + page.url() + " · " + JSON.stringify(db.tokens));
      await c.close();
    }
    /* Profil : changement d'adresse en deux liens (texte, réussite, erreurs), FR puis EN */
    for (const langue of ["", "en"]) {
      const db = base(); if (langue) avecEn(db, F.IDS.c1);
      const { c, page } = await contexte(b, THOMAS, db, { langue });
      await page.goto(URL0 + "#/profil"); await pret(page, "#mc-maj-email");
      const note = await texte(page, "#vue");
      ok(`Profil${langue ? " (anglais)" : ""} : la note dit qu'un lien part aussi sur l'ancienne adresse (cliquer les deux)`, note.includes(langue ? TX.profil_note_en : TX.profil_note), note.slice(note.indexOf(langue ? "A confirmation" : "Un lien de confirmation"), 200));
      await page.fill("#mc-email", "thomas.b@exemple.fr"); await page.click("#mc-maj-email"); await attendre(page, 700);
      const t1 = await texte(page, "#mc-email-msg");
      ok(`Profil${langue ? " (anglais)" : ""}, changement d'adresse demandé : « ${(langue ? TX.profil_ok_en : TX.profil_ok)("thomas.b@exemple.fr").slice(0, 70)}… »`, db.majUsers.length === 1 && db.majUsers[0].email === "thomas.b@exemple.fr" && t1 === (langue ? TX.profil_ok_en : TX.profil_ok)("thomas.b@exemple.fr"), t1 + " · " + JSON.stringify(db.majUsers));
      const cas = langue ? [["limite horaire d'emails", { status: 429, msg: "email rate limit exceeded" }, TX.trop_emails_compte_en]]
        : [["limite horaire d'emails", { status: 429, msg: "email rate limit exceeded" }, TX.trop_emails_compte],
           ["serveur d'emails en panne", { status: 500, msg: "Error sending email change email" }, TX.envoi_rate],
           ["limite par adresse", { status: 429, msg: "For security purposes, you can only request this after 37 seconds." }, TX.trop_demandes]];
      for (const [quoi, err, attendu] of cas) {
        db.majUser.erreur = err; await attendre(page, 3400);   // le mot précédent s'efface au bout de 3,2 s
        await page.click("#mc-maj-email"); await attendre(page, 700);
        const t = await texte(page, "#mc-email-msg");
        ok(`Profil${langue ? " (anglais)" : ""}, changement d'adresse, ${quoi} (« ${err.msg} ») : « ${attendu.slice(0, 55)}… », jamais le texte brut`, t === attendu && !t.includes(err.msg), t);
      }
      ok(`Profil${langue ? " (anglais)" : ""} : aucune écriture de données`, ecrDonnees(db).length === 0, resume(db));
      await c.close();
    }
  });

  /* =================== C. adresse réécrite quand la page n'est pas pour la personne =================== */
  await bloc("C. adresse", async () => {
    /* client Thomas */
    {
      const db = base();
      const { c, page } = await contexte(b, THOMAS, db);
      await page.goto(URL0); await pret(page, "#acc-vue");
      const d0 = await ou(page);
      ok("client, adresse vide : son accueil, l'adresse n'est pas réécrite", d0.courant === "accueil" && d0.hash === "", JSON.stringify(d0));
      await page.evaluate(() => { window.__hc = 0; window.__hl = history.length; addEventListener("hashchange", () => { window.__hc++; }); });
      const vus = [];
      for (const h of ["#/calculateur", "#/tableau", "#/clients", "#/decouverte", "#/inconnu"]) { await aller(page, h, 1200); vus.push([h, await ou(page)]); }
      const boucle = await page.evaluate(() => ({ hc: window.__hc, entrees: history.length - window.__hl }));
      ok("client : #/calculateur, #/tableau, #/clients, #/decouverte, #/inconnu → son accueil ET l'adresse #/accueil", vus.every(([, d]) => d.courant === "accueil" && d.hash === "#/accueil"), JSON.stringify(vus));
      ok("… sans boucle : un seul hashchange par adresse tapée, une seule entrée d'historique", boucle.hc === 5 && boucle.entrees === 5, JSON.stringify(boucle));
      await aller(page, "#/progression", 1400); const dp = await ou(page);
      await aller(page, "#/programme", 1400); const dg = await ou(page);
      ok("client : une page à lui garde son adresse (#/programme), un alias aussi (#/progression → Ma progression)", dp.courant === "mensurations" && dp.hash === "#/progression" && dg.courant === "programme" && dg.hash === "#/programme", JSON.stringify([dp, dg]));
      const p2 = await nouvellePage(c);
      await p2.goto(URL0 + "#/calculateur"); await pret(p2, "#acc-vue");
      const d2 = await ou(p2);
      ok("client, ouverture directe sur #/calculateur : accueil, adresse #/accueil", d2.courant === "accueil" && d2.hash === "#/accueil", JSON.stringify(d2));
      ok("client : aucune écriture", db.ecritures.length === 0, resume(db));
      await c.close();
    }
    /* prospecte Léa */
    {
      const LEA = PID(2);
      const db = base({ comptes: [{ id: LEA, prenom: "Léa", nom: "", cree: avant(2 * J), email: "lea@exemple.fr" }] });
      const { c, page } = await contexte(b, qui(LEA, "lea@exemple.fr"), db, { viewport: MOBILE });
      await page.goto(URL0); await pret(page);
      await aller(page, "#/clients", 1500); const d1 = await ou(page);
      await aller(page, "#/programme", 1500); const d2 = await ou(page); const verrou = !!(await page.$("#vue .verrou"));
      ok("prospecte : #/clients → son accueil, adresse #/accueil ; #/programme (vitrine) garde son adresse, page verrouillée", d1.courant === "accueil" && d1.hash === "#/accueil" && d2.courant === "programme" && d2.hash === "#/programme" && verrou, JSON.stringify([d1, d2, verrou]));
      ok("prospecte : aucune écriture, aucun défilement horizontal", db.ecritures.length === 0 && !(await deborde(page)), resume(db) + " · " + await largeur(page));
      await c.close();
    }
    /* coach : #/accueil hors fiche (ex. rechargement dans une fiche), puis « Ouvrir » du tableau de bord */
    for (const viewport of [ORDI, MOBILE]) {
      const db = base();
      const { c, page } = await contexte(b, COACH, db, { viewport });
      await page.goto(URL0 + "#/accueil"); await pret(page, "#tb-vue");
      const d0 = await ou(page);
      ok(`coach (${viewport.width} px) sur #/accueil hors fiche : tableau de bord, adresse #/tableau`, d0.courant === "tableau" && d0.hash === "#/tableau", JSON.stringify(d0));
      await page.waitForSelector('#tb-vue button[data-fiche][data-cible="accueil"]', { timeout: 8000 });
      const cible = await page.$eval('#tb-vue button[data-fiche][data-cible="accueil"]', x => ({ id: x.dataset.fiche, nom: x.dataset.nom }));
      await page.click(`#tb-vue button[data-fiche="${cible.id}"][data-cible="accueil"]`);
      await page.waitForSelector("#vue .bandeau strong", { timeout: 8000 }).catch(() => {}); await attendre(page, 900);
      const d1 = await ou(page), fiche = await page.evaluate(() => Store.idConsulte), titre = await texte(page, "#vue .bandeau strong");
      ok(`coach (${viewport.width} px) : « Ouvrir » (${cible.nom}) ouvre bien sa fiche (Store.idConsulte, #/accueil, bandeau « Fiche de ${cible.nom} »)`, fiche === cible.id && d1.courant === "accueil" && d1.hash === "#/accueil" && titre === "Fiche de " + cible.nom, JSON.stringify([d1, fiche, titre]));
      await aller(page, "#/clients", 1500); const d2 = await ou(page);
      ok(`coach (${viewport.width} px) : une page du coach garde son adresse (#/clients) et quitte la fiche`, d2.courant === "clients" && d2.hash === "#/clients" && (await page.evaluate(() => Store.idConsulte)) === null, JSON.stringify(d2));
      ok(`coach (${viewport.width} px) : aucune écriture`, db.ecritures.length === 0, resume(db));
      await c.close();
    }
  });

  /* =================== D. première connexion d'un client sur téléphone =================== */
  await bloc("D. Profil sur téléphone", async () => {
    /* 390 px, clavier ouvert (fenêtre de 380 px de haut) : l'écran de connexion est défilé jusqu'au bouton (230 px), puis
       « Se connecter » recharge la page. Le navigateur remettait l'ancien défilement à la FIN du chargement : quand les
       fichiers de police arrivent après l'affichage du Profil (réseau mobile), le Profil sautait à 230 px, l'encadré caché
       sous l'en-tête (mesuré sur la v51). Feuille de style elle-même retenue : les scripts attendent, même contrôle. */
    let k = 0;
    for (const [quoi, polices] of [["fichiers de police retardés de 2,5 s", { fichiers: 2500 }], ["feuille des polices (fonts.googleapis.com) retenue 2,5 s", { css: 2500 }], ["polices immédiates", {}]]) {
      const CAM = PID(20 + k), mail = "camille" + k++ + "@exemple.fr";
      const db = base({ comptes: [{ id: CAM, prenom: "Camille", nom: "Martin", statut: "client", cree: avant(J), email: mail }] });
      db.connexions[mail] = CAM; db.polices = polices;
      const { c, page } = await contexte(b, null, db, { viewport: { width: 390, height: 380 } });
      await page.goto(URL0); await page.waitForSelector("#c-go", { timeout: 15000 }); await attendre(page, 300);
      await page.fill("#c-email", mail); await page.fill("#c-mdp", "motdepasse1");
      const y0 = await page.evaluate(() => { window.scrollTo(0, document.documentElement.scrollHeight); return window.scrollY; });
      const n0 = db.lectures.length;
      await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 20000 }), page.click("#c-go")]);
      await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true && !!document.querySelector("#vue .bandeau"), null, { timeout: 15000 });
      await attendre(page, 1500);   // la fin du chargement est passée : une remise en place du navigateur aurait eu lieu
      const m = await page.evaluate(() => {
        const bd = document.querySelector("#vue .bandeau"), tb = document.querySelector(".topbar");
        return { y: window.scrollY, haut: bd ? Math.round(bd.getBoundingClientRect().top) : null, entete: tb ? Math.round(tb.getBoundingClientRect().bottom) : null,
          texte: bd ? bd.querySelector("strong").textContent : "", nb: document.querySelectorAll("#vue .bandeau").length, restauration: history.scrollRestoration,
          courant, hash: location.hash, hauteur: innerHeight };
      });
      ok(`première connexion (${quoi}) : l'écran de connexion était défilé (${y0} px)`, y0 > 50, String(y0));
      ok(`… le Profil s'ouvre tout en haut (défilement 0), l'encadré « Bienvenue ! » visible sous l'en-tête`, m.y === 0 && m.haut !== null && m.entete !== null && m.haut >= m.entete - 1 && m.haut < m.hauteur && m.texte === "Bienvenue !", JSON.stringify(m));
      ok(`… un seul affichage du Profil : intake lu 2 fois (démarrage + page), un seul encadré, adresse #/profil, défilement géré par l'app`, lu(db, "intake", n0) === 2 && m.nb === 1 && m.courant === "profil" && m.hash === "#/profil" && m.restauration === "manual", "intake lu " + lu(db, "intake", n0) + " fois · " + JSON.stringify(m));
      ok(`… aucune écriture`, ecrDonnees(db).length === 0, resume(db));
      await c.close();
    }
    /* l'encadré en anglais : les variantes « une / deux réponses manquent » et « reprends ton profil » */
    const TOUT = { nom: "Camille Martin", age: "34", sexe: "Femme", taille: "165", poids: "60", objectif: "Perte de poids / sèche", niveau: "Débutant (0 à 6 mois)", lieu: "Salle complète", seances: "3", journee_type: "Tartines le matin, pâtes à midi, soupe le soir.", nb_repas: "3 repas", regime_type: "Omnivore" };
    const sans = (...k) => { const o = Object.assign({}, TOUT, { complet: false }); k.forEach(x => delete o[x]); return o; };
    let i = 0;
    for (const [quoi, I, titre, note] of [
      ["1 réponse obligatoire manque", sans("regime_type"), "One answer is missing from your profile.", "Fill it in and save: it takes ten seconds."],
      ["2 réponses obligatoires manquent", sans("nb_repas", "regime_type"), "Two answers are missing from your profile.", "Fill them in and save: it takes a few seconds."],
      ["7 réponses obligatoires manquent", sans("objectif", "niveau", "lieu", "seances", "journee_type", "nb_repas", "regime_type"), "Pick up your profile where you left off.", "Your first answers are saved: complete the rest and save."]]) {
      const id = PID(30 + i++), mail = "client" + i + "@exemple.fr";
      const db = base({ comptes: [{ id, prenom: "Camille", nom: "Martin", statut: "client", cree: avant(5 * J), donnees: [["intake", I, avant(2 * J)], ["prefs", { langue: "en" }, avant(2 * J)]] }] });
      const { c, page } = await contexte(b, qui(id, mail), db, { langue: "en", viewport: MOBILE });
      await page.goto(URL0); await pret(page, "#vue .bandeau");
      const tb = await texte(page, "#vue .bandeau strong"), tn = await texte(page, "#vue .bandeau .note");
      ok(`encadré de première connexion en anglais, ${quoi} : « ${titre} » + « ${note} »`, tb === titre && tn === note, tb + " · " + tn);
      await c.close();
    }
  });

  /* =================== Z. rien vers l'extérieur =================== */
  await bloc("Z. hôtes externes", async () => {
    const autres = Array.from(externes).filter(h => !/^fonts\.(googleapis|gstatic)\.com$/.test(h));
    ok("aucune requête vers un autre hôte que la page, le faux Supabase et les polices (bloquées ou simulées)", autres.length === 0, JSON.stringify(autres));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
