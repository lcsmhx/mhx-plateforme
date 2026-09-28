/* verif56 — Chantier 1 (v52), lot C : les 3 questions et la page de proposition de bilan, vérifiées de bout en bout
   dans un vrai navigateur.
   A. réglages et définitions : 3 questions (probleme, obstacle, projection) requises, mêmes définitions en français et
      en anglais (même ordre), anciennes définitions gardées pour l'affichage, table problème → objectif vers des options
      EXACTES du questionnaire complet (/perte|s[èe]che/, /prise|masse/, santé), jamais par-dessus un objectif choisi ;
   B. arrivée juste après la vérification d'email (faux lien de confirmation) sur les 3 questions : plus d'âge, « 3
      questions, 1 minute », « pas un avis médical » sous le formulaire, réponses requises (espaces seuls = vide),
      brouillon pendant la frappe (court_debut, email_compte, objectif), rechargement, validation (court_le) ;
   C. page de proposition de bilan : sa réponse « projection » reprise (échappée, tronquée proprement), texte exact,
      deux boutons de même taille et de même poids, lien Calendly exact (prénom, nom, email ; source bilan-propose),
      clic compté, intake.bilan_propose écrit UNE fois (« reserver » / « plus_tard »), relu avant si le cache n'est pas
      chargé, puis l'accueil ; page rouverte par #/decouverte/bilan sans rien réécrire ; données piégées ; anglais ;
      téléphone 390 px ;
   D. ancien prospect (10 réponses, court_le, pas de bilan_propose) : la page bilan une fois (phrase neutre, jamais
      « undefined »), puis l'accueil ; ses anciennes réponses intactes et lisibles (Profil, fiche du coach, « 10 / 10 ») ;
      un ancien questionnaire commencé reste compté sur 10 ;
   E. Profil du prospect : ses réponses, « Modifier mes réponses » (#/decouverte/reponses : rien ne part avant la
      validation, « Annuler les modifications »), objectif suivi quand il venait de la réponse « problème » ;
   F. coach : fiche d'un nouveau prospect (« 3 / 3 réponses », les 3 réponses, les anciennes qui ont une valeur, clic
      depuis la page de proposition du bilan), aucune injection, aucune écriture ;
   G. l'ancien écran « résultat » n'est plus affiché (ni calories, ni séance, ni recettes, aucune lecture du catalogue),
      son code est gardé ; client Thomas : rien de tout cela ;
   H. la garde d'âge du formulaire, inerte sans question « age », marche toujours si une question d'âge revient (page
      servie retouchée) ;
   Z. aucun appel vers l'extérieur.
   Le garde-fou 18 ans n'est plus dans le questionnaire court (plus d'âge demandé) : il passe au calculateur (lot D).
   Supabase simulé (gabarit de verif55, carte 6 §15) : rien ne part vers la vraie base (routage par NOM D'HÔTE, jamais
   par sous-chaîne) ; règles de la base reproduites (HANDOFF §2.3, v49) ; appelant reconnu à son jeton ; chaque écriture
   est appliquée en mémoire et notée, chaque lecture de « donnees » aussi. Dates relatives au lancement. Chaque bloc
   tourne à part (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif56.js ../index.html
           VERIF56_PORT=9721 node verif56.js ../index.html     (autre port, si 9720 est pris)
           VERIF56_BLOCS="A.,C." node verif56.js …              (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF56_PORT || 9720;
const BLOCS = (process.env.VERIF56_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
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
const PID = k => "00000000-0000-4000-8000-0000000056" + String(k).padStart(2, "0");   // verif56 : …56kk (une plage par suite)
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

/* ---------- les textes attendus (FR et EN) : cahier des charges du lot C ---------- */
const TX = {
  labels: ["Quel est ton objectif principal ?", "Qu'est-ce qui t'a bloqué jusqu'ici ?", "Dans 3 mois, qu'est-ce qui aurait changé pour toi ?"],
  labels_en: ["What's your main goal?", "What has held you back so far?", "In 3 months, what would have changed for you?"],
  options: ["Perdre du gras", "Prendre du muscle", "Me remettre en forme"],
  options_en: ["Lose fat", "Build muscle", "Get back in shape"],
  lede: "3 questions, 1 minute : dis-nous où tu en es.",
  lede_en: "3 questions, 1 minute: tell us where you stand.",
  note: "Ce questionnaire ne remplace pas un avis médical. Si tu as un doute sur ta santé, parles-en à un professionnel.",
  bouton: "Valider mes réponses", bouton_en: "Submit my answers",
  titre: "Ta prochaine étape", titre_en: "Your next step",
  bilan: "Ton bilan offert de 30 minutes avec un coach MHX. On fait le point sur ton objectif, ce qui te bloque et ce que tu as déjà essayé. Tu repars avec 2 ou 3 actions concrètes. Si l'accompagnement personnalisé te correspond, on te le présente à la fin de l'appel. Tu es libre de dire non.",
  bilan_en: "Your free 30-minute assessment with an MHX coach. We review your goal, what's holding you back and what you've already tried. You leave with 2 or 3 concrete actions. If personal coaching suits you, we'll present it at the end of the call. You're free to say no.",
  projection: p => "Dans 3 mois, pour toi : « " + p + " »",
  projection_en: p => "In 3 months, for you: “" + p + "”",
  neutre: "Faisons le point ensemble sur ton objectif.",
  reserver: "Réserver mon bilan", reserver_en: "Book my assessment",
  plus_tard: "Pas maintenant, découvrir mon espace", plus_tard_en: "Not now, explore my space",
  modifier: "Modifier mes réponses", modifier_en: "Edit my answers",
  annuler: "Annuler les modifications"
};
const OBJ = { "Perdre du gras": "Perte de poids / sèche", "Prendre du muscle": "Prise de muscle", "Me remettre en forme": "Santé & énergie au quotidien" };
/* un nouveau prospect qui a validé les 3 questions */
const NOUVEAU = (extra) => Object.assign({ probleme: "Perdre du gras", obstacle: "Le manque de temps avec le travail", projection: "Courir 10 km sans m'arrêter",
  objectif: "Perte de poids / sèche", court_debut: avant(2 * H), court_le: avant(H) }, extra || {});
/* un ancien prospect (v51) : les 10 réponses de l'ancien questionnaire court, validé, pas de choix sur la page bilan */
const ANCIEN = { sexe: "Femme", age: "30", taille: "165", poids: "70", objectif: "Perte de poids / sèche", seances: "3", essaye: "Des régimes trop stricts.",
  obstacle: "Je manque de temps avec le travail", pourquoi: "Me sentir mieux cet été", motivation: "8", court_debut: avant(3 * J), court_le: avant(3 * J - H), email_compte: "ancienne@exemple.fr" };
const LIEN = (id, type) => "#access_token=lien." + id + ".x&refresh_token=renouvellement-" + id + "&expires_in=3600&token_type=bearer&type=" + (type || "signup");
/* un prospect : son compte (statut « prospect »), ses données, puis son navigateur, ouvert sur h (accueil par défaut) */
const compte = (k, prenom, nom, donnees, extra) => Object.assign({ id: PID(k), prenom, nom, cree: avant(2 * J), email: "p" + k + "@exemple.fr", donnees: donnees || [] }, extra || {});
async function ouvrir(b, db, k, h, sel, opts){
  const x = db.profils.find(p => p.id === PID(k));
  const { c, page } = await contexte(b, qui(PID(k), db.emails[PID(k)] || ("p" + k + "@exemple.fr")), db, opts);
  await page.goto(URL0 + (h || "")); await pret(page, sel || "#vue .masthead");
  return { c, page, x };
}
/* un clic sur un lien vers Calendly sans l'ouvrir (le clic est noté par l'app ; aucun onglet vers l'extérieur) */
const cliquerSansOuvrir = (page, sel) => page.evaluate(s => { const a = document.querySelector(s); if (!a) return false; a.addEventListener("click", e => e.preventDefault(), { once: true }); a.click(); return true; }, sel).catch(() => false);
const lignes = (page, sel) => page.$$eval(sel + " li", l => l.map(li => [li.querySelector("span") ? li.querySelector("span").textContent.replace(/\s+/g, " ").trim() : "", li.querySelector("b") ? li.querySelector("b").textContent.replace(/\s+/g, " ").trim() : ""])).catch(() => []);
const valeurDe = (page, sel) => page.$eval(sel, e => e.value).catch(() => null);
/* les écritures de données, hors compteur de visites du prospect (clé activite, écrite au plus une fois par minute) */
const saisies = db => ecrDonnees(db).filter(e => e.outil !== "activite");
const URL0 = `http://localhost:${PORT}/`;
const intakeDe = (db, uid) => (db.donnees.find(d => d.user_id === uid && d.outil === "intake") || {}).contenu;
/* le lien Calendly de la page bilan : exact (paramètres attendus, rien d'autre), prénom + nom si l'app les envoie (lot B) */
function lienOk(href, base, attendu){
  let u; try { u = new URL(href); } catch (e) { return "adresse illisible"; }
  if (href.split("?")[0] !== base) return "base " + href.split("?")[0];
  const p = [...u.searchParams.entries()], k = p.map(x => x[0]), v = Object.fromEntries(p);
  const permis = ["utm_source", "utm_medium", "utm_content", "name", "first_name", "last_name", "email"];
  if (k.some(x => !permis.includes(x)) || new Set(k).size !== k.length) return "paramètres " + k.join(",");
  if (v.utm_source !== "app-mhx" || v.utm_medium !== "app" || v.utm_content !== attendu.source) return "utm " + JSON.stringify(v);
  if (v.first_name !== attendu.prenom || v.email !== attendu.email) return "prénom / email " + JSON.stringify(v);
  const complet = attendu.prenom + " " + attendu.nom;
  if (!(v.name === attendu.prenom || v.name === complet)) return "name " + v.name;
  if ("last_name" in v && v.last_name !== attendu.nom) return "last_name " + v.last_name;
  if (v.name === complet && v.last_name !== attendu.nom) return "name complet sans last_name";
  if (!href.startsWith(base + "?utm_source=app-mhx&utm_medium=app&utm_content=" + attendu.source + "&")) return "ordre utm";
  return "";
}

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF56_PORT=9721 node verif56.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. réglages et définitions =================== */
  await bloc("A. réglages", async () => {
    const db = base({ comptes: [compte(1, "Léa", "Martin")] });
    const { c, page } = await ouvrir(b, db, 1, "", "#q-probleme");
    const r = await page.evaluate(() => {
      const D = CONFIG.decouverte, fr = DECOUVERTE.questions, en = DECOUVERTE.en.questions;
      const obj = QUESTIONS.find(q => q.id === "objectif");
      return {
        questions: D.questions, requis: D.requis, avant: D.questions_avant,
        fr: fr.map(q => [q.id, q.type, q.label, q.options || null]), en: en.map(q => [q.id, q.type, q.label, q.options || null]),
        avantFr: (DECOUVERTE.questions_avant || []).map(q => [q.id, q.type, q.label]), avantEn: ((DECOUVERTE.en || {}).questions_avant || []).map(q => [q.id, q.type, q.label]),
        pasDansQuestions: ["probleme", "projection"].every(id => !QUESTIONS.some(q => q.id === id)),
        table: D.objectif_depuis, options: obj ? obj.options : [],
        depuis: ["Perdre du gras", "Prendre du muscle", "Me remettre en forme", "autre", "", null, 5].map(v => Decouverte.objectifDepuis(v)),
        sens: ["Perdre du gras", "Prendre du muscle", "Me remettre en forme"].map(v => outilCalculateur.departDepuis({ objectif: Decouverte.objectifDepuis(v), poids: "70", taille: "170", age: "30", sexe: "Femme", seances: "3" }).objectif)
      };
    });
    ok("CONFIG : questions = requis = probleme, obstacle, projection ; l'ancienne liste de 10 gardée (questions_avant)", JSON.stringify(r.questions) === '["probleme","obstacle","projection"]' && JSON.stringify(r.requis) === '["probleme","obstacle","projection"]' && JSON.stringify(r.avant) === '["sexe","age","taille","poids","objectif","seances","essaye","obstacle","pourquoi","motivation"]', JSON.stringify(r));
    ok("DECOUVERTE.questions : probleme (liste « Perdre du gras / Prendre du muscle / Me remettre en forme »), obstacle et projection (texte libre), libellés exacts", JSON.stringify(r.fr) === JSON.stringify([["probleme", "select", TX.labels[0], TX.options], ["obstacle", "long", TX.labels[1], null], ["projection", "long", TX.labels[2], null]]), JSON.stringify(r.fr));
    ok("DECOUVERTE.en.questions : mêmes identifiants, même ordre, mêmes types, en anglais", JSON.stringify(r.en) === JSON.stringify([["probleme", "select", TX.labels_en[0], TX.options_en], ["obstacle", "long", TX.labels_en[1], null], ["projection", "long", TX.labels_en[2], null]]), JSON.stringify(r.en));
    ok("« probleme » et « projection » sont de nouveaux identifiants (absents du questionnaire complet : aucune option d'« objectif » réutilisée)", r.pasDansQuestions, "");
    ok("anciennes définitions gardées pour l'affichage (essaye, obstacle avec son ancien libellé, motivation), en français et en anglais, même ordre", JSON.stringify(r.avantFr) === JSON.stringify([["essaye", "long", "Qu'as-tu déjà essayé pour atteindre cet objectif ?"], ["obstacle", "long", "Quel est ton principal obstacle aujourd'hui ?"], ["motivation", "echelle", "Ta motivation pour t'y mettre maintenant"]]) && JSON.stringify(r.avantEn.map(x => x[0])) === '["essaye","obstacle","motivation"]' && r.avantEn[1][2] === "What is your main obstacle today?", JSON.stringify([r.avantFr, r.avantEn]));
    ok("table problème → objectif : chaque cible est une option EXACTE du questionnaire complet", JSON.stringify(r.table) === JSON.stringify(OBJ) && Object.values(r.table).every(o => r.options.includes(o)), JSON.stringify([r.table, r.options]));
    ok("« Perdre du gras » → option perte (/perte|s[èe]che/), « Prendre du muscle » → option prise (/prise|masse/), « Me remettre en forme » → santé & énergie ; toute autre valeur → rien", /perte|s[èe]che/i.test(r.depuis[0]) && /prise|masse/i.test(r.depuis[1]) && r.depuis[2] === "Santé & énergie au quotidien" && r.depuis.slice(3).every(x => x === ""), JSON.stringify(r.depuis));
    ok("… le calcul des calories en profite : perte, prise, maintien (mêmes formules)", JSON.stringify(r.sens) === '["perte","prise","maintien"]', JSON.stringify(r.sens));
    const p = await page.evaluate(() => {
      const t = (I, prec) => { const x = Object.assign({}, I); const ch = Decouverte.poserObjectif(x, prec); return [ch, x.objectif === undefined ? null : x.objectif]; };
      const out = {
        vide: t({ probleme: "Perdre du gras" }), videChaine: t({ probleme: "Prendre du muscle", objectif: "  " }),
        choisi: t({ probleme: "Perdre du gras", objectif: "Recomposition (perdre du gras + prendre du muscle)" }),
        suivi: t({ probleme: "Prendre du muscle", objectif: "Perte de poids / sèche" }, "Perdre du gras"),
        pasSuiviSiChoisi: t({ probleme: "Prendre du muscle", objectif: "Perte de poids / sèche" }, "Me remettre en forme"),
        sansProbleme: t({ objectif: "" }), inconnu: t({ probleme: "<b>x</b>" })
      };
      /* une cible qui n'est plus une option du questionnaire complet : jamais posée */
      const avantT = CONFIG.decouverte.objectif_depuis["Me remettre en forme"];
      CONFIG.decouverte.objectif_depuis["Me remettre en forme"] = "Option disparue";
      out.disparue = [Decouverte.objectifDepuis("Me remettre en forme"), t({ probleme: "Me remettre en forme" })];
      CONFIG.decouverte.objectif_depuis["Me remettre en forme"] = avantT;
      return out;
    });
    ok("objectif vide (ou espaces) : posé depuis la réponse « problème »", JSON.stringify(p.vide) === '[true,"Perte de poids / sèche"]' && JSON.stringify(p.videChaine) === '[true,"Prise de muscle"]', JSON.stringify(p));
    ok("objectif déjà choisi dans le questionnaire complet : jamais remplacé", JSON.stringify(p.choisi) === '[false,"Recomposition (perdre du gras + prendre du muscle)"]' && JSON.stringify(p.pasSuiviSiChoisi) === '[false,"Perte de poids / sèche"]', JSON.stringify(p));
    ok("objectif posé par la table puis réponse « problème » changée : il suit (« Perdre du gras » → « Prendre du muscle »)", JSON.stringify(p.suivi) === '[true,"Prise de muscle"]', JSON.stringify(p.suivi));
    ok("sans réponse « problème », réponse inconnue, ou cible absente du questionnaire complet : rien n'est posé", JSON.stringify(p.sansProbleme) === '[false,""]' && JSON.stringify(p.inconnu) === "[false,null]" && JSON.stringify(p.disparue) === '["",[false,null]]', JSON.stringify(p));
    const e = await page.evaluate(() => [Decouverte.extrait("  Courir   10 km  "), Decouverte.extrait(5), Decouverte.extrait({ a: 1 }), Decouverte.extrait(null), Decouverte.extrait(undefined),
      Decouverte.extrait("mot ".repeat(80), 160), Decouverte.extrait("😀".repeat(200), 160)]);
    ok("réponse citée : espaces resserrés ; nombre → texte ; objet, null, absent → rien", e[0] === "Courir 10 km" && e[1] === "5" && e[2] === "" && e[3] === "" && e[4] === "", JSON.stringify(e.slice(0, 5)));
    ok("réponse longue : 160 caractères au plus, coupée à un espace (jamais au milieu d'un mot), « … » ; emojis jamais coupés en deux", Array.from(e[5]).length <= 161 && e[5].endsWith("mot…") && !/\s…$/.test(e[5]) && Array.from(e[6]).length === 161 && e[6].endsWith("😀…") && !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(e[6]), JSON.stringify([e[5].slice(-12), Array.from(e[6]).length]));
    ok("réglages : aucune écriture", db.ecritures.length === 0, resume(db));
    await c.close();
  });

  /* =================== B. les 3 questions, juste après la vérification d'email =================== */
  await bloc("B. arrivée par le lien", async () => {
    const ID = PID(10), mail = "lea@exemple.fr";
    const db = base({ comptes: [{ id: ID, prenom: "Léa", nom: "Martin", cree: avant(5 * MIN), email: mail }] });
    const { c, page } = await contexte(b, null, db);
    await page.goto(URL0 + LIEN(ID)); await pret(page, "#q-probleme");
    const d = await ou(page), v = await texte(page, "#vue");
    ok("clic dans l'email de confirmation : connecté, adresse nettoyée, l'accueil est le questionnaire court", d.courant === "accueil" && !/access_token/.test(page.url()) && !!(await page.$("#vue #q-probleme")), JSON.stringify(d) + " · " + page.url());
    const champs = await page.$$eval("#vue [id^='q-']", l => l.map(e => e.id + ":" + e.tagName)).catch(() => []);
    ok("exactement 3 questions : #q-probleme (liste), #q-obstacle et #q-projection (texte libre) ; plus aucune question d'âge", JSON.stringify(champs) === '["q-probleme:SELECT","q-obstacle:TEXTAREA","q-projection:TEXTAREA"]' && !(await page.$("#q-age")) && !v.includes("À partir de"), JSON.stringify(champs));
    const opts = await page.$$eval("#q-probleme option", l => l.map(o => o.value)).catch(() => []);
    ok("« Quel est ton objectif principal ? » : Perdre du gras / Prendre du muscle / Me remettre en forme", JSON.stringify(opts) === JSON.stringify([""].concat(TX.options)), JSON.stringify(opts));
    const libs = await page.$$eval("#vue label[for^='q-']", l => l.map(e => e.textContent.replace(/\s+/g, " ").trim())).catch(() => []);
    ok("libellés exacts, les 3 marqués requis (« * »)", JSON.stringify(libs) === JSON.stringify(TX.labels.map(x => x + " *")), JSON.stringify(libs));
    ok("en-tête « 3 questions, 1 minute » (plus de « 10 questions »), « Valider mes réponses », « pas un avis médical » sous le formulaire, aucun bouton Calendly", (await texte(page, "#vue .masthead .lede")) === TX.lede && !/10 questions/.test(v) && (await texte(page, "#dc-voir")) === TX.bouton && (await texte(page, "#vue .panel .note:last-child")) === TX.note && !(await page.$("#vue a[href*='calendly']")), (await texte(page, "#vue .masthead .lede")) + " · " + (await texte(page, "#vue .panel .note:last-child")));
    ok("arrivée : aucune écriture de données", saisies(db).length === 0, resume(db));
    /* réponses requises */
    await page.click("#dc-voir"); await attendre(page, 300);
    const msg = await texte(page, "#dc-msg"), manque = await page.$$eval("#vue .manque", l => l.map(e => e.id)).catch(() => []);
    await attendre(page, 1000);
    ok("« Valider » sans rien remplir : « Il manque : » les 3 questions, les 3 signalées, rien d'écrit", msg === "Il manque : " + TX.labels.join(", ") && JSON.stringify(manque) === '["q-probleme","q-obstacle","q-projection"]' && saisies(db).length === 0, msg + " · " + JSON.stringify(manque));
    /* brouillon pendant la frappe */
    await page.selectOption("#q-probleme", "Perdre du gras"); await attendre(page, 1300);
    const I1 = clone(intakeDe(db, ID)) || {};
    ok("brouillon : la réponse « problème » part tout de suite, avec court_debut, email_compte et l'objectif posé (« Perte de poids / sèche »), sans court_le", I1.probleme === "Perdre du gras" && I1.objectif === OBJ["Perdre du gras"] && typeof I1.court_debut === "string" && !isNaN(Date.parse(I1.court_debut)) && I1.email_compte === mail && !I1.court_le, JSON.stringify(I1));
    await page.click("#q-obstacle"); await page.keyboard.type("Le manque de temps", { delay: 25 }); await attendre(page, 1300);
    const I2 = clone(intakeDe(db, ID)) || {}, focus = await page.evaluate(() => document.activeElement && document.activeElement.id);
    ok("brouillon : l'obstacle tapé part pendant la frappe, sans quitter le champ ; court_debut inchangé", I2.obstacle === "Le manque de temps" && focus === "q-obstacle" && I2.court_debut === I1.court_debut && !I2.court_le, JSON.stringify(I2) + " · " + focus);
    await page.reload(); await pret(page, "#q-probleme");
    ok("après rechargement : les réponses sont là, le questionnaire reste ouvert", (await valeurDe(page, "#q-probleme")) === "Perdre du gras" && (await valeurDe(page, "#q-obstacle")) === "Le manque de temps" && !(await page.$("#dc-bilan")), "");
    await page.fill("#q-projection", "    "); await page.click("#dc-voir"); await attendre(page, 300);
    const msg2 = await texte(page, "#dc-msg"); await attendre(page, 1000);
    ok("une réponse faite d'espaces seulement : « Il manque : Dans 3 mois… », pas de court_le", msg2 === "Il manque : " + TX.labels[2] && !(intakeDe(db, ID) || {}).court_le, msg2);
    await page.fill("#q-projection", "Courir 10 km sans m'arrêter");
    const t0 = Date.now(); await page.click("#dc-voir"); await attendre(page, 1600);
    const I3 = clone(intakeDe(db, ID)) || {}, fin = ecr(db, "intake", ID).filter(e => e.contenu && e.contenu.court_le);
    ok("validation : court_le (maintenant), les 3 réponses, l'objectif, court_debut du premier brouillon, email du compte ; une seule date de validation", typeof I3.court_le === "string" && Math.abs(Date.parse(I3.court_le) - t0) < 10000 && I3.probleme === "Perdre du gras" && I3.obstacle === "Le manque de temps" && I3.projection === "Courir 10 km sans m'arrêter" && I3.objectif === OBJ["Perdre du gras"] && I3.court_debut === I1.court_debut && I3.email_compte === mail && new Set(fin.map(e => e.contenu.court_le)).size === 1, JSON.stringify(I3));
    ok("… puis la page de proposition de bilan s'affiche (plus le questionnaire)", !!(await page.$("#dc-bilan")) && !(await page.$("#q-probleme")), await texte(page, "#vue"));
    ok("… aucune autre clé écrite que intake (pas de challenge, pas de profil)", saisies(db).every(e => e.table === "donnees" && e.outil === "intake" && e.user_id === ID), resume(db));
    await c.close();
  });
  await bloc("B. questionnaire en anglais", async () => {
    const db = base({ comptes: [compte(11, "Léa", "Martin")] });
    const { c, page } = await ouvrir(b, db, 11, "", "#q-probleme", { langue: "en" });
    await attendre(page, 400);
    const libs = await page.$$eval("#vue label[for^='q-']", l => l.map(e => e.textContent.replace(/\s+/g, " ").trim())).catch(() => []);
    const opts = await page.$$eval("#q-probleme option", l => l.slice(1).map(o => o.textContent.trim() + "=" + o.value)).catch(() => []);
    ok("anglais : libellés traduits (« What's your main goal? * »…), choix affichés en anglais, valeurs gardées en français", JSON.stringify(libs) === JSON.stringify(TX.labels_en.map(x => x + " *")) && JSON.stringify(opts) === JSON.stringify(TX.options_en.map((x, i) => x + "=" + TX.options[i])), JSON.stringify([libs, opts]));
    const v = await texte(page, "#vue");
    ok("anglais : « 3 questions, 1 minute: tell us where you stand. », « Submit my answers », note médicale en anglais, aucun texte français du questionnaire", (await texte(page, "#vue .masthead .lede")) === TX.lede_en && (await texte(page, "#dc-voir")) === TX.bouton_en && v.includes("This questionnaire is not medical advice.") && !v.includes("Valider mes réponses") && !v.includes("Il manque") && !TX.labels.some(x => v.includes(x)), v.slice(0, 300));
    await page.click("#dc-voir"); await attendre(page, 300);
    ok("anglais : « Missing: » + les 3 questions en anglais", (await texte(page, "#dc-msg")) === "Missing: " + TX.labels_en.join(", "), await texte(page, "#dc-msg"));
    await c.close();
  });

  /* =================== C. la page de proposition de bilan =================== */
  await bloc("C. page bilan", async () => {
    for (const viewport of [ORDI, MOBILE]) {
      const k = viewport === ORDI ? 20 : 21, ID = PID(k);
      const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU({ email_compte: "p" + k + "@exemple.fr" })]])] });
      const { c, page } = await ouvrir(b, db, k, "", "#dc-bilan", { viewport });
      const w = viewport.width + " px";
      ok(`${w} : questionnaire validé sans choix → la page de proposition de bilan (ni questionnaire, ni accueil, ni ancien résultat)`, !!(await page.$("#dc-bilan")) && !(await page.$("#q-probleme, #dc-accomp, #dc-resultat, #dc-calcul, #dc-seance, #dc-recettes")), "");
      ok(`${w} : sa réponse « projection » reprise : « Dans 3 mois, pour toi : « Courir 10 km sans m'arrêter » »`, (await texte(page, "#dc-projection")) === TX.projection("Courir 10 km sans m'arrêter"), await texte(page, "#dc-projection"));
      ok(`${w} : texte EXACT du bilan offert`, (await texte(page, "#dc-bilan-texte")) === TX.bilan, await texte(page, "#dc-bilan-texte"));
      const bt = await page.evaluate(() => {
        const f = e => { if (!e) return null; const r = e.getBoundingClientRect(), s = getComputedStyle(e); return { tag: e.tagName, txt: e.textContent.trim(), w: r.width, h: r.height, style: [s.backgroundColor, s.color, s.fontSize, s.fontWeight, s.fontFamily, s.borderTopWidth, s.borderTopStyle, s.borderTopColor, s.borderTopLeftRadius, s.paddingTop, s.paddingLeft, s.opacity, s.textDecorationLine].join("|") }; };
        return { r: f(document.querySelector("#dc-bilan-reserver")), t: f(document.querySelector("#dc-bilan-plus-tard")), nCal: document.querySelectorAll("#vue a[href*='calendly']").length, nBtn: document.querySelectorAll("#dc-bilan .btn").length };
      });
      ok(`${w} : deux boutons « ${TX.reserver} » et « ${TX.plus_tard} », seul lien Calendly de la page`, !!bt.r && !!bt.t && bt.r.txt === TX.reserver && bt.t.txt === TX.plus_tard && bt.nCal === 1 && bt.nBtn === 2, JSON.stringify(bt));
      ok(`${w} : même taille (largeur et hauteur) et même poids visuel (couleurs, police, graisse, bordure, marges intérieures)`, !!bt.r && !!bt.t && Math.abs(bt.r.w - bt.t.w) <= 1 && Math.abs(bt.r.h - bt.t.h) <= 1 && bt.r.style === bt.t.style && bt.r.w >= 120 && bt.r.h >= 40, JSON.stringify([bt.r && [bt.r.w, bt.r.h, bt.r.style], bt.t && [bt.t.w, bt.t.h, bt.t.style]]));
      const a = await page.$eval("#dc-bilan-reserver", e => ({ href: e.getAttribute("href"), target: e.getAttribute("target"), rel: e.getAttribute("rel") })).catch(() => ({}));
      const lien = await page.evaluate(() => ({ base: CONFIG.marque.calendly, fn: lienCalendly("bilan-propose") }));
      const pb = lienOk(a.href || "", lien.base, { source: "bilan-propose", prenom: "Léa", nom: "Martin", email: "p" + k + "@exemple.fr" });
      ok(`${w} : « Réserver mon bilan » = lien Calendly pré-rempli exact (utm_content=bilan-propose, prénom, nom si envoyé, email), nouvel onglet`, !pb && a.href === lien.fn && a.target === "_blank" && /noopener/.test(a.rel || ""), pb + " · " + a.href);
      ok(`${w} : aucun défilement horizontal ; aucune écriture à l'affichage`, !(await deborde(page)) && saisies(db).length === 0, (await largeur(page)) + " · " + resume(db));
      if (viewport === MOBILE) { try { fs.mkdirSync(path.join(__dirname, "captures", "v56"), { recursive: true }); } catch (e) { } await page.screenshot({ path: path.join(__dirname, "captures", "v56", "bilan-mobile.png"), fullPage: true }).catch(() => {}); }
      await c.close();
    }
  });
  await bloc("C. « Réserver mon bilan »", async () => {
    const k = 22, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU()]])] });
    const { c, page } = await ouvrir(b, db, k, "", "#dc-bilan");
    const n0 = db.ecritures.length, t0 = Date.now();
    await cliquerSansOuvrir(page, "#dc-bilan-reserver"); await attendre(page, 2200);
    const I = clone(intakeDe(db, ID)) || {}, C = (db.donnees.find(d => d.user_id === ID && d.outil === "challenge") || {}).contenu || {};
    const wI = ecr(db, "intake", ID), cl = ((C.cta || {}).clics || []);
    ok("clic « Réserver mon bilan » : noté une fois dans challenge (source bilan-propose)", cl.length === 1 && cl[0].source === "bilan-propose" && ecr(db, "challenge", ID).length === 1, JSON.stringify(C));
    ok("… choix mémorisé en UNE écriture : intake.bilan_propose = { choix: « reserver », le: maintenant }, les réponses intactes", wI.length === 1 && I.bilan_propose && I.bilan_propose.choix === "reserver" && Math.abs(Date.parse(I.bilan_propose.le) - t0) < 10000 && Object.keys(I.bilan_propose).sort().join() === "choix,le" && I.projection === NOUVEAU().projection && I.court_le === NOUVEAU().court_le, JSON.stringify(I));
    ok("… puis l'accueil du prospect (Speed Formation, « Réserver mon bilan »), plus la page bilan", !!(await page.$("#dc-accomp")) && !!(await page.$("#dc-formation")) && !(await page.$("#dc-bilan")), await texte(page, "#vue"));
    ok("… événement local « call_cta_clicked » (Calendly) noté", (await page.evaluate(() => { try { return JSON.parse(localStorage.getItem("mhx_tracking") || "[]").map(x => x.event); } catch (e) { return []; } })).includes("call_cta_clicked"), "");
    await page.reload(); await pret(page, "#dc-accomp");
    ok("rechargement : l'accueil directement, la page bilan ne revient pas, rien de réécrit", !(await page.$("#dc-bilan")) && ecr(db, "intake", ID).length === 1 && ecr(db, "challenge", ID).length === 1 && saisies(db).length === n0 + 2, resume(db));
    await c.close();
  });
  await bloc("C. « Pas maintenant »", async () => {
    const k = 23, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU()]])] });
    const { c, page } = await ouvrir(b, db, k, "", "#dc-bilan");
    /* deux clics coup sur coup (double tape) */
    await page.evaluate(() => { const t = document.querySelector("#dc-bilan-plus-tard"); t.click(); t.click(); }); await attendre(page, 1800);
    const I = clone(intakeDe(db, ID)) || {}, wI = ecr(db, "intake", ID);
    ok("« Pas maintenant, découvrir mon espace » (deux clics) : UNE écriture, bilan_propose = { choix: « plus_tard », le }, aucun clic Calendly noté", wI.length === 1 && I.bilan_propose && I.bilan_propose.choix === "plus_tard" && typeof I.bilan_propose.le === "string" && ecr(db, "challenge", ID).length === 0, JSON.stringify(I.bilan_propose) + " · " + resume(db));
    ok("… l'accueil s'affiche en haut de page", !!(await page.$("#dc-accomp")) && !(await page.$("#dc-bilan")) && (await page.evaluate(() => window.scrollY)) === 0, "");
    const pages = await page.evaluate(() => Object.keys((Activite._delta && Activite._delta.pages) || {}).sort());
    ok("pages vues notées pour le coach : decouverte-bilan puis decouverte-accueil", pages.includes("decouverte-bilan") && pages.includes("decouverte-accueil") && !pages.includes("decouverte-resultat"), JSON.stringify(pages));
    /* la page reste accessible par son adresse ; y revenir n'écrit plus rien */
    await aller(page, "#/decouverte/bilan", 1500);
    ok("#/decouverte/bilan : la page de proposition, toujours accessible (réponse « projection » reprise)", !!(await page.$("#dc-bilan")) && (await texte(page, "#dc-projection")) === TX.projection(NOUVEAU().projection), "");
    await page.click("#dc-bilan-plus-tard"); await attendre(page, 1600);
    const d = await ou(page);
    ok("… « Pas maintenant » : l'accueil, adresse #/decouverte, le premier choix gardé (rien de réécrit)", !!(await page.$("#dc-accomp")) && d.hash === "#/decouverte" && ecr(db, "intake", ID).length === 1 && (intakeDe(db, ID).bilan_propose || {}).le === I.bilan_propose.le, JSON.stringify(d) + " · " + resume(db));
    await aller(page, "#/decouverte/bilan", 1500);
    await cliquerSansOuvrir(page, "#dc-bilan-reserver"); await attendre(page, 2200);
    const cl = (((db.donnees.find(x => x.user_id === ID && x.outil === "challenge") || {}).contenu || {}).cta || {}).clics || [];
    ok("… « Réserver » plus tard depuis cette page : le clic est noté (bilan-propose), le premier choix reste « plus_tard »", cl.length === 1 && cl[0].source === "bilan-propose" && ecr(db, "intake", ID).length === 1 && intakeDe(db, ID).bilan_propose.choix === "plus_tard", JSON.stringify(cl) + " · " + resume(db));
    await c.close();
  });
  await bloc("C. relecture avant le choix", async () => {
    /* le cache d'intake n'est pas chargé (drapeau de lecture effacé) : relu juste avant d'écrire */
    const k = 24, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU()]])] });
    const { c, page } = await ouvrir(b, db, k, "", "#dc-bilan");
    /* entre-temps, un autre appareil a ajouté une réponse : la relecture la garde */
    intakeDe(db, ID).seances = "4";
    await page.evaluate(() => { delete Store.charge[Store.cible() + "|intake"]; });
    const l0 = lu(db, "intake");
    await page.click("#dc-bilan-plus-tard"); await attendre(page, 1600);
    const I = clone(intakeDe(db, ID)) || {};
    ok("cache non chargé : intake relu une fois avant l'écriture, puis une écriture (la réponse venue d'ailleurs gardée)", lu(db, "intake") === l0 + 1 && ecr(db, "intake", ID).length === 1 && I.seances === "4" && (I.bilan_propose || {}).choix === "plus_tard", "lectures +" + (lu(db, "intake") - l0) + " · " + JSON.stringify(I));
    await c.close();
    /* lecture ratée au moment du choix : rien n'est écrit, il découvre quand même son espace ; la page revient à la visite suivante */
    const db2 = base({ comptes: [compte(25, "Léa", "Martin", [["intake", NOUVEAU()]])] });
    const o2 = await ouvrir(b, db2, 25, "", "#dc-bilan");
    db2.lectureKo = ["intake"];
    await o2.page.evaluate(() => { delete Store.charge[Store.cible() + "|intake"]; });
    await o2.page.click("#dc-bilan-plus-tard"); await attendre(o2.page, 1600);
    ok("lecture ratée au moment du choix : aucune écriture, l'accueil s'affiche quand même (rien de bloquant)", saisies(db2).length === 0 && !!(await o2.page.$("#dc-accomp")), resume(db2));
    db2.lectureKo = [];
    await o2.page.reload(); await pret(o2.page, "#dc-bilan");
    ok("… à la visite suivante, la page de proposition revient (le choix n'avait pas été enregistré)", !!(await o2.page.$("#dc-bilan")) && saisies(db2).length === 0, "");
    await o2.c.close();
  });
  await bloc("C. données piégées", async () => {
    const cas = [
      ["HTML dans la réponse", "<img src=x onerror=\"window.__xss=1\"> <script>window.__xss=2</script>", TX.projection("<img src=x onerror=\"window.__xss=1\"> <script>window.__xss=2</script>")],
      ["réponse très longue", "Je veux enfin courir mon premier semi-marathon en moins de deux heures et me sentir fier de moi chaque matin devant la glace, avec plus d'énergie au travail et le soir avec mes enfants, sans douleurs", null],
      ["réponse objet", { a: 1 }, TX.neutre], ["réponse nombre", 42, TX.projection("42")], ["réponse vide", "   ", TX.neutre]
    ];
    let k = 30;
    for (const [quoi, projection, attendu] of cas) {
      const db = base({ comptes: [compte(k, "<b>Léa</b>", "Martin", [["intake", NOUVEAU({ projection })]])] });
      const { c, page } = await ouvrir(b, db, k++, "", "#dc-bilan");
      const t = await texte(page, "#dc-projection"), v = await texte(page, "#vue");
      const sain = !(await page.evaluate(() => window.__xss)) && !(await page.$("#vue img[src='x'], #vue script, #vue b"));
      if (attendu) ok(`page bilan, ${quoi} : « ${attendu.length > 70 ? attendu.slice(0, 70) + "…" : attendu} », affichée comme du texte, aucune injection, jamais « undefined » / « [object Object] »`, t === attendu && sain && !/undefined|\[object|null/.test(v), t);
      else {
        const x = t.replace(/^Dans 3 mois, pour toi : « /, "").replace(/ »$/, "");
        ok(`page bilan, ${quoi} : tronquée proprement (160 caractères au plus, coupée à un espace, « … »)`, t.startsWith("Dans 3 mois, pour toi : « Je veux enfin courir") && Array.from(x).length <= 161 && x.endsWith("…") && projection.startsWith(x.slice(0, -1)) && /[\s,]/.test(projection.charAt(x.length - 1)) && sain, t);
      }
      await c.close();
    }
    /* bilan_propose piégé : la page s'affiche, le choix le remplace par une valeur propre */
    const db = base({ comptes: [compte(36, "Léa", "Martin", [["intake", NOUVEAU({ bilan_propose: "<script>x</script>" })]])] });
    const { c, page } = await ouvrir(b, db, 36, "", "#dc-bilan");
    await page.click("#dc-bilan-plus-tard"); await attendre(page, 1600);
    const B = (intakeDe(db, PID(36)) || {}).bilan_propose;
    ok("bilan_propose piégé (texte) : la page bilan s'affiche, le choix écrit une valeur propre { choix, le }", !!B && B.choix === "plus_tard" && typeof B.le === "string" && ecr(db, "intake", PID(36)).length === 1, JSON.stringify(B));
    await c.close();
  });
  await bloc("C. anglais", async () => {
    const k = 40, db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU()]])] });
    const { c, page } = await ouvrir(b, db, k, "", "#dc-bilan", { langue: "en" });
    await attendre(page, 400);
    const v = await texte(page, "#vue");
    ok("anglais : « Your next step », sa réponse reprise (« In 3 months, for you: “…” »), texte du bilan en anglais", (await texte(page, "#dc-bilan h2")) === TX.titre_en && (await texte(page, "#dc-projection")) === TX.projection_en(NOUVEAU().projection) && (await texte(page, "#dc-bilan-texte")) === TX.bilan_en, v.slice(0, 400));
    ok("anglais : « Book my assessment » et « Not now, explore my space », aucun texte français de la page", (await texte(page, "#dc-bilan-reserver")) === TX.reserver_en && (await texte(page, "#dc-bilan-plus-tard")) === TX.plus_tard_en && ![TX.bilan, TX.reserver, TX.plus_tard, TX.titre].some(x => v.includes(x)), v.slice(0, 300));
    await c.close();
  });

  /* =================== D. ancien prospect (10 réponses, court_le, pas de choix) =================== */
  await bloc("D. ancien prospect", async () => {
    const k = 50, ID = PID(k);
    const db = base({ comptes: [compte(k, "Nina", "", [["intake", ANCIEN]], { cree: avant(4 * J), email: "ancienne@exemple.fr" })] });
    const { c, page } = await ouvrir(b, db, k, "", "#dc-bilan");
    const v = await texte(page, "#vue");
    ok("ancien prospect (10 réponses, sans « projection ») : la page bilan, avec une phrase neutre, jamais « undefined » ni guillemets vides", (await texte(page, "#dc-projection")) === TX.neutre && !/undefined|null|« »|\{p\}/.test(v) && (await texte(page, "#dc-bilan-texte")) === TX.bilan, await texte(page, "#dc-projection"));
    ok("… ni ancien résultat, ni questionnaire ; aucune écriture à l'affichage", !(await page.$("#dc-resultat, #dc-calcul, #q-probleme, #q-age")) && saisies(db).length === 0, resume(db));
    await page.click("#dc-bilan-plus-tard"); await attendre(page, 1600);
    const I = clone(intakeDe(db, ID)) || {};
    ok("… « Pas maintenant » : une écriture (bilan_propose), ses 13 anciennes valeurs intactes, aucune nouvelle réponse inventée", ecr(db, "intake", ID).length === 1 && Object.keys(ANCIEN).every(x => I[x] === ANCIEN[x]) && Object.keys(I).sort().join() === Object.keys(ANCIEN).concat(["bilan_propose"]).sort().join(), JSON.stringify(I));
    await page.reload(); await pret(page, "#dc-accomp");
    ok("… à la visite suivante : l'accueil directement (la page bilan n'est vue qu'une fois), rien de réécrit", !(await page.$("#dc-bilan")) && ecr(db, "intake", ID).length === 1, resume(db));
    /* ses anciennes réponses, lisibles dans son Profil */
    await aller(page, "#/profil", 1800); await page.waitForSelector("#mc-reponses li", { timeout: 6000 }).catch(() => {});
    const rp = await lignes(page, "#mc-reponses");
    const att = [["Sexe", "Femme"], ["Âge", "30"], ["Taille (cm)", "165"], ["Poids actuel (kg)", "70"], ["Quel est ton objectif principal ?", "Perte de poids / sèche"], ["Combien de séances par semaine peux-tu RÉELLEMENT tenir ?", "3"], ["Qu'as-tu déjà essayé pour atteindre cet objectif ?", "Des régimes trop stricts."], ["Quel est ton principal obstacle aujourd'hui ?", "Je manque de temps avec le travail"], ["Pourquoi maintenant ? Qu'est-ce qui a déclenché ta décision ?", "Me sentir mieux cet été"], ["Ta motivation pour t'y mettre maintenant", "8 / 10"]];
    ok("Profil : ses 10 anciennes réponses lisibles, avec les anciens libellés (obstacle d'avant, motivation « 8 / 10 »)", JSON.stringify(rp) === JSON.stringify(att), JSON.stringify(rp));
    ok("Profil : « Modifier mes réponses » (#/decouverte/reponses) ; aucune écriture", (await page.$eval("#mc-reponses-lien a", a => a.getAttribute("href") + "|" + a.textContent.trim()).catch(() => "")) === "#/decouverte/reponses|" + TX.modifier && ecr(db, "intake", ID).length === 1, resume(db));
    await c.close();
    /* vues par le coach */
    const { c: c2, page: p2 } = await contexte(b, COACH, db);
    await p2.goto(URL0 + "#/clients"); await pret(p2, `[data-ouvrir="${ID}"]`);
    await p2.click(`[data-ouvrir="${ID}"]`); await p2.waitForSelector("#fiche-reponses", { timeout: 8000 }); await attendre(p2, 500);
    const note = await texte(p2, "#fiche-reponses p.note"), rf = await lignes(p2, "#fiche-reponses");
    ok("coach, fiche de l'ancien prospect : « 10 / 10 réponses, validé le … », ses 10 réponses avec les anciens libellés (+ email)", note.startsWith("10 / 10 réponses, validé le ") && rf.length === 11 && JSON.stringify(rf.slice(1)) === JSON.stringify(att) && rf[0][1] === "ancienne@exemple.fr", note + " · " + JSON.stringify(rf));
    ok("coach : aucune écriture", saisies(db).filter(e => e.user_id !== ID || e.outil !== "intake").length === 0, resume(db));
    await c2.close();
  });
  await bloc("D. ancien questionnaire commencé", async () => {
    /* 4 réponses de l'ancien questionnaire, jamais validé : il répond maintenant aux 3 questions ; le coach le compte sur 10 */
    const k = 51, ID = PID(k), I0 = { sexe: "Homme", age: "34", taille: "180", poids: "85", court_debut: avant(5 * H) };
    const db = base({ comptes: [compte(k, "Hugo", "", [["intake", I0]], { cree: avant(8 * H) })] });
    const { c, page } = await ouvrir(b, db, k, "", "#q-probleme");
    ok("ancien questionnaire commencé : les 3 nouvelles questions (pas l'âge ni le poids), rien d'écrit à l'affichage", !(await page.$("#q-age, #q-poids")) && !!(await page.$("#q-projection")) && saisies(db).length === 0, "");
    await c.close();
    const { c: c2, page: p2 } = await contexte(b, COACH, db);
    await p2.goto(URL0 + "#/clients"); await pret(p2, `[data-ouvrir="${ID}"]`);
    await p2.click(`[data-ouvrir="${ID}"]`); await p2.waitForSelector("#fiche-reponses", { timeout: 8000 }); await attendre(p2, 500);
    const sc = await lignes(p2, "#fiche-score");
    ok("coach : « 4 / 10 réponses, pas encore validé. », score « Questionnaire en cours (4/10 réponses) » (compté sur l'ancien questionnaire)", (await texte(p2, "#fiche-reponses p.note")) === "4 / 10 réponses, pas encore validé." && sc.some(([x, y]) => x === "Questionnaire en cours (4/10 réponses)" && y === "8 / 30"), (await texte(p2, "#fiche-reponses p.note")) + " · " + JSON.stringify(sc));
    await c2.close();
  });

  /* =================== E. Profil du prospect et « Modifier mes réponses » =================== */
  await bloc("E. Profil et modification", async () => {
    const k = 60, ID = PID(k), I0 = NOUVEAU({ bilan_propose: { choix: "plus_tard", le: avant(30 * MIN) }, email_compte: "p60@exemple.fr" });
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", I0]])] });
    const { c, page } = await ouvrir(b, db, k, "#/profil", "#mc-questionnaire");
    await page.waitForSelector("#mc-reponses li", { timeout: 6000 }).catch(() => {});
    const rp = await lignes(page, "#mc-reponses");
    ok("Profil : ses 3 réponses, libellés exacts (pas l'objectif posé par l'app en doublon)", JSON.stringify(rp) === JSON.stringify([[TX.labels[0], "Perdre du gras"], [TX.labels[1], I0.obstacle], [TX.labels[2], I0.projection]]), JSON.stringify(rp));
    ok("Profil : « Modifier mes réponses » → #/decouverte/reponses ; aucune écriture", (await page.$eval("#mc-reponses-lien a", a => a.getAttribute("href") + "|" + a.textContent.trim()).catch(() => "")) === "#/decouverte/reponses|" + TX.modifier && saisies(db).length === 0, resume(db));
    await page.click("#mc-reponses-lien a"); await page.waitForSelector("#q-probleme", { timeout: 6000 }); await attendre(page, 500);
    ok("« Modifier mes réponses » : le questionnaire pré-rempli, « Annuler les modifications »", (await valeurDe(page, "#q-probleme")) === "Perdre du gras" && (await valeurDe(page, "#q-projection")) === I0.projection && (await texte(page, "#dc-annuler")) === TX.annuler, "");
    await page.selectOption("#q-probleme", "Prendre du muscle"); await page.fill("#q-obstacle", "Autre chose"); await attendre(page, 1500);
    ok("en modification : rien ne part pendant la saisie", saisies(db).length === 0, resume(db));
    await page.click("#dc-annuler"); await attendre(page, 1300);
    const d1 = await ou(page);
    ok("« Annuler les modifications » : son accueil, adresse #/decouverte, rien d'écrit", !!(await page.$("#dc-accomp")) && d1.hash === "#/decouverte" && saisies(db).length === 0, JSON.stringify(d1));
    await aller(page, "#/decouverte/reponses", 1500);
    ok("… rouvert : les réponses d'avant (pas celles abandonnées)", (await valeurDe(page, "#q-probleme")) === "Perdre du gras" && (await valeurDe(page, "#q-obstacle")) === I0.obstacle, "");
    await page.selectOption("#q-probleme", "Prendre du muscle"); await page.fill("#q-projection", "Prendre 4 kg de muscle");
    await page.click("#dc-voir"); await attendre(page, 1600);
    const I = clone(intakeDe(db, ID)) || {}, d2 = await ou(page);
    ok("« Valider mes réponses » : une écriture, réponses changées, court_le et bilan_propose inchangés", ecr(db, "intake", ID).length === 1 && I.probleme === "Prendre du muscle" && I.projection === "Prendre 4 kg de muscle" && I.obstacle === I0.obstacle && I.court_le === I0.court_le && JSON.stringify(I.bilan_propose) === JSON.stringify(I0.bilan_propose), JSON.stringify(I));
    ok("… l'objectif posé par l'app suit la nouvelle réponse (« Prise de muscle »)", I.objectif === OBJ["Prendre du muscle"], I.objectif);
    ok("… puis son accueil (choix déjà fait), adresse #/decouverte", !!(await page.$("#dc-accomp")) && !(await page.$("#dc-bilan")) && d2.hash === "#/decouverte", JSON.stringify(d2));
    await c.close();
    /* Profil en anglais */
    const db2 = base({ comptes: [compte(61, "Léa", "Martin", [["intake", I0]])] });
    const o2 = await ouvrir(b, db2, 61, "#/profil", "#mc-questionnaire", { langue: "en" });
    await o2.page.waitForSelector("#mc-reponses li", { timeout: 6000 }).catch(() => {}); await attendre(o2.page, 400);
    const re = await lignes(o2.page, "#mc-reponses");
    ok("Profil en anglais : « Your questionnaire », libellés et choix traduits (« Lose fat »), « Edit my answers »", (await texte(o2.page, "#mc-questionnaire h2")) === "Your questionnaire" && re.length === 3 && re[0][0] === TX.labels_en[0] && re[0][1] === "Lose fat" && re[2][0] === TX.labels_en[2] && (await texte(o2.page, "#mc-reponses-lien a")) === TX.modifier_en, JSON.stringify(re));
    await o2.c.close();
    /* questionnaire pas encore validé : pas de liste, le lien mène aux 3 questions */
    const db3 = base({ comptes: [compte(62, "Léa", "Martin")] });
    const o3 = await ouvrir(b, db3, 62, "#/profil", "#mc-questionnaire", { viewport: MOBILE });
    await attendre(o3.page, 800);
    ok("Profil sans réponse : aucune liste, « Répondre aux 3 questions » (#/decouverte) ; 390 px sans débordement ; aucune écriture", !(await o3.page.$("#mc-reponses li")) && (await o3.page.$eval("#mc-reponses-lien a", a => a.getAttribute("href") + "|" + a.textContent.trim()).catch(() => "")) === "#/decouverte|Répondre aux 3 questions" && !(await deborde(o3.page)) && saisies(db3).length === 0, resume(db3));
    await o3.c.close();
  });

  /* =================== F. coach : fiche d'un nouveau prospect =================== */
  await bloc("F. coach", async () => {
    const k = 70, ID = PID(k);
    const XSS = "<img src=x onerror=\"window.__xss=1\">";
    const I0 = NOUVEAU({ projection: "Tenir " + XSS, email_compte: "p70@exemple.fr", sexe: "Femme", poids: "64", bilan_propose: { choix: "reserver", le: avant(20 * MIN) } });
    const C0 = { version: 1, jours: {}, cta: { clics: [{ jour: 3, source: "bilan-propose", date: avant(20 * MIN) }] } };
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", I0], ["challenge", C0]])] });
    const { c, page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/clients"); await pret(page, `[data-ouvrir="${ID}"]`);
    await page.click(`[data-ouvrir="${ID}"]`); await page.waitForSelector("#fiche-reponses", { timeout: 8000 }); await attendre(page, 600);
    const note = await texte(page, "#fiche-reponses p.note"), rf = await lignes(page, "#fiche-reponses");
    ok("fiche : « 3 / 3 réponses, validé le … »", note.startsWith("3 / 3 réponses, validé le "), note);
    ok("fiche : email, puis les 3 réponses (problème, ce qui l'a bloqué, dans 3 mois), puis les anciennes qui ont une valeur (sexe, poids) — pas l'objectif posé par l'app", JSON.stringify(rf) === JSON.stringify([["Email", "p70@exemple.fr"], [TX.labels[0], "Perdre du gras"], [TX.labels[1], I0.obstacle], [TX.labels[2], "Tenir " + XSS], ["Sexe", "Femme"], ["Poids actuel (kg)", "64"]]), JSON.stringify(rf));
    const chrono = await texte(page, "#fiche-chrono");
    ok("chronologie : « Clic « Réserver mon bilan » (page de proposition du bilan) »", chrono.includes("Clic « Réserver mon bilan » (page de proposition du bilan)"), chrono.slice(0, 300));
    ok("fiche : sa réponse piégée reste du texte (aucune injection), aucune écriture", !(await page.evaluate(() => window.__xss)) && !(await page.$("#vue img[src='x']")) && db.ecritures.length === 0, resume(db));
    await c.close();
  });

  /* =================== G. l'ancien écran « résultat » retiré, client Thomas =================== */
  await bloc("G. ancien résultat retiré", async () => {
    const k = 80, ID = PID(k);
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", NOUVEAU({ sexe: "Femme", age: "30", taille: "165", poids: "70", seances: "3", bilan_propose: { choix: "plus_tard", le: avant(MIN) } })]])] });
    const { c, page } = await ouvrir(b, db, k, "", "#dc-accomp");
    await attendre(page, 800);
    const v = await texte(page, "#vue");
    ok("accueil d'un nouveau prospect (même avec âge, taille, poids) : ni résultat, ni calories, ni séance, ni recettes", !(await page.$("#dc-resultat, #dc-calcul, #dc-seance, #dc-recettes, #dc-modifier")) && !/Ton résultat|Tes 3 priorités|Tes calories et tes macros|Ta séance découverte|3 recettes pour commencer/.test(v), v.slice(0, 300));
    ok("… aucune lecture du catalogue (recettes, aliments) ni d'autre clé que intake, challenge et prefs (langue)", !db.chemins.some(x => /\/rest\/v1\/(recettes|aliments)/.test(x)) && db.lectures.every(l => ["eq.intake", "eq.challenge", "eq.prefs"].includes(l.outil)), JSON.stringify(db.lectures.map(l => l.outil)));
    ok("… « Réserver mon bilan » en haut (source decouverte) et dans le bloc accompagnement, case « J'ai réservé mon bilan »", !!(await page.$('#vue .masthead a[data-dc-cal="decouverte"]')) && !!(await page.$('#dc-accomp a[data-dc-cal="decouverte-accompagnement"]')) && !!(await page.$("#dc-reserve-case")), "");
    const code = await page.evaluate(() => ["chiffres", "calculHTML", "seanceHTML", "recettesHTML", "chargerRecettes", "resultatHTML", "prioriteObstacle", "formationHTML", "accompHTML"].filter(f => typeof outilDecouverte[f] !== "function"));
    ok("le code encore utile est gardé (garde-fou IMC, séance découverte, recettes : lots D et E)", code.length === 0, JSON.stringify(code));
    ok("aucune écriture", saisies(db).length === 0, resume(db));
    await c.close();
  });
  await bloc("G. client Thomas", async () => {
    const db = base();
    const { c, page } = await contexte(b, THOMAS, db);
    await page.goto(URL0); await pret(page, "#acc-vue");
    const vus = [];
    for (const h of ["#/decouverte/bilan", "#/decouverte/reponses", "#/decouverte"]) { await aller(page, h, 1300); vus.push([h, await ou(page), !!(await page.$("#dc-vue, #dc-bilan, #q-probleme, [data-dc-cal]"))]); }
    ok("client Thomas : #/decouverte/bilan, #/decouverte/reponses, #/decouverte → son accueil (#/accueil), rien de la Découverte", vus.every(([, d, dc]) => d.courant === "accueil" && d.hash === "#/accueil" && !dc), JSON.stringify(vus));
    await aller(page, "#/profil", 1600);
    ok("client Thomas : son Profil complet (questionnaire), pas la liste du prospect ; aucune écriture", !!(await page.$("#p-save")) && !(await page.$("#mc-questionnaire, #mc-reponses")) && db.ecritures.length === 0, resume(db));
    await c.close();
  });

  /* =================== H. la garde d'âge du formulaire, inerte sans question « age » ===================
     Le questionnaire court ne demande plus l'âge (le garde-fou 18 ans passe au calculateur, lot D). La garde reste dans le
     code du formulaire : page servie avec une question « age » remise en tête de la liste, elle marche toujours. */
  await bloc("H. garde d'âge (page retouchée)", async () => {
    await avec([['questions: ["probleme", "obstacle", "projection"],', 'questions: ["age", "probleme", "obstacle", "projection"],']], async () => {
      const k = 90, ID = PID(k);
      const db = base({ comptes: [compte(k, "Léa", "Martin")] });
      const { c, page } = await ouvrir(b, db, k, "", "#q-age");
      await page.selectOption("#q-probleme", "Perdre du gras"); await page.fill("#q-obstacle", "Le temps"); await attendre(page, 1300);
      ok("page retouchée (question « age » remise) : « À partir de 18 ans. », et rien ne part tant que l'âge n'est pas saisi", (await texte(page, "#vue")).includes("À partir de 18 ans.") && ecr(db, "intake", ID).length === 0, resume(db));
      await page.fill("#q-age", "15"); await page.press("#q-age", "Tab"); await attendre(page, 1300);
      ok("… âge 15 à la sortie du champ : toujours rien", ecr(db, "intake", ID).length === 0, resume(db));
      await page.fill("#q-age", "30"); await page.press("#q-age", "Tab"); await attendre(page, 1400);
      const I1 = clone(intakeDe(db, ID)) || {};
      ok("… âge 30 : le brouillon part avec les réponses déjà saisies (et l'objectif posé depuis la réponse « problème »)", I1.age === "30" && I1.probleme === "Perdre du gras" && I1.obstacle === "Le temps" && I1.objectif === OBJ["Perdre du gras"], JSON.stringify(I1));
      await page.fill("#q-age", "15"); await page.press("#q-age", "Tab"); await attendre(page, 1400);
      ok("… âge 15 ensuite : tout ce que le formulaire avait envoyé est retiré, objectif posé compris (intake = {})", JSON.stringify(intakeDe(db, ID)) === "{}", JSON.stringify(intakeDe(db, ID)));
      await c.close();
    });
  });

  /* =================== Z. rien vers l'extérieur =================== */
  await bloc("Z. hôtes externes", async () => {
    const autres = Array.from(externes).filter(h => !/^fonts\.(googleapis|gstatic)\.com$/.test(h));
    ok("aucune requête vers un autre hôte que la page, le faux Supabase et les polices (bloquées)", autres.length === 0, JSON.stringify(autres));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
