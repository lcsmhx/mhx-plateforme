/* verif62 — v57 : deux retouches après la vérification en ligne de la v56 par Lucas (29/09), vérifiées dans un vrai navigateur
   avec le faux Supabase de verif61 (migration v56 comprise) :
   A. Mes clients sur ordinateur (1280 px, thème sombre de l'app et thème clair) : « Connexions » et « Dernière connexion »
      juste après « Visite » (dernière visite), avant « Jours actifs » ; date courte « 29/09 10:53 » (l'année seulement si ce
      n'est pas l'année en cours), à l'heure de l'appareil du coach ; les deux colonnes visibles sans défiler ; la colonne du
      nom fixe (sticky), de la couleur du panneau, et grisée avec la ligne survolée ; la page Prospects garde la date longue ;
   B. Mes clients sur tablette (820 px) : le tableau défile de côté ; défilé jusqu'au bout, les noms et l'en-tête « Client »
      restent à gauche, par-dessus les autres cellules, et la dernière colonne reste utilisable ;
   C. Mes clients sur téléphone (375 px) : les cartes (rien de fixe), les lignes dans le nouvel ordre, la date courte, la page
      ne déborde pas ; v58 : une valeur en plusieurs morceaux (« 7/10 », « 0/100 (en cours : 0) », « 83 kg (départ …) »)
      reste d'un seul tenant, collée à droite (avant : les morceaux étalés sur toute la ligne) ; aucune carte ne déborde (le nom et
      les pastilles passent à la ligne), à 375 et à 320 px ; v59 : à 320 px, la page ne déborde plus (barre du haut) ;
      v71 (D) : le tableau ne liste plus les prospects (ligne « Les prospects sont dans Prospects → (n comptes gratuits). ») :
      Léa et Marc se lisent sur leur carte de la page Prospects, les mesures du tableau portent sur les clients ;
   D. la connexion ouvre la page d'arrivée : un client, un prospect et le coach dont l'adresse gardait une page (#/formation,
      #/prospects : dernière page ouverte sur l'appareil quand la session a pris fin sans « Se déconnecter ») arrivent sur
      leur page d'arrivée ; « Me reconnecter » (session perdue en cours d'utilisation) ramène sur la page ouverte ;
      « Se déconnecter » puis connexion : l'accueil (comme avant) ; la connexion par mot de passe est toujours notée ;
   E. v59 : la barre du haut sur téléphone (320, 359, 360, 375 et 390 px) : le coach (#/clients), le témoin d'enregistrement
      « Enregistrement… » affiché, un client, le compte de test (sans nom : son email), un prospect au nom de 60 + 60 caractères,
      l'anglais : la page ne déborde pas, la marque et la ligne du compte restent dans la barre, ☀, EN et « Se déconnecter »
      entiers, sur une ligne, cliquables, 32 px de haut au moins ; c'est le nom (et « Enregistrement… ») qui se raccourcit avec
      « … » ; une alerte du témoin (« Hors ligne — gardé… », « Hors ligne — modification non enregistrée », « Non enregistré — … »,
      jusqu'à 414 px) n'est jamais raccourcie : entière, sur sa ligne au-dessus du nom et des boutons, puis la barre redevient la
      même ; sans :has (règle des alertes retirée), elle se raccourcit sans faire déborder la page ; écarts et marges resserrés
      sous 360 px seulement ; avec un nom normal à 360 px et plus, la barre est celle de la v58 au dixième de pixel (la même page
      mesurée sans la règle v59 de css/communs.css) ;
   Z. aucun appel vers l'extérieur.
   Infrastructure (serveur, faux Supabase, personnes, décor) reprise de verif61. Dates relatives au lancement. Chaque bloc
   tourne à part (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif62.js ../index.html
           VERIF62_PORT=9781 node verif62.js ../index.html     (autre port, si 9780 est pris)
           VERIF62_BLOCS="A.,D." node verif62.js …              (seulement les blocs dont le nom commence ainsi)
           VERIF62_CAPTURES=<dossier> node verif62.js …         (captures d'écran des tableaux, pour les regarder) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF62_PORT || 9780;
const BLOCS = (process.env.VERIF62_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
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
     cx401 (jeton expiré : n refus 401 avant d'accepter) ; les instants sont rendus comme PostgREST (…123456+00:00) ;
     profilRate (n premières lectures de SON profil coupées : réseau coupé au démarrage), profilRetard (ms, lecture lente),
     profilRelus (relectures de son rôle au retour au premier plan : select=id,role) */
  const db = { profils, donnees, cx: {}, notees: [], cxLectures: [], cxAbsente: false, cxRefusee: false, cxPanne: false, cxRetard: 0, cx401: 0, profilRate: 0, profilRetard: 0, profilRelus: 0, emails_prospects: [], sansJournal: false, ecritures: [], refus: [], lectures: [], journal: [], chemins: [],
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
    if ((m === "GET" || m === "HEAD") && id && id === moi && db.profilRate > 0) { db.profilRate--; return r.abort().catch(() => {}); }   // v56
    if ((m === "GET" || m === "HEAD") && id && id === moi && db.profilRetard) await new Promise(z => setTimeout(z, db.profilRetard));   // v56
    if ((m === "GET" || m === "HEAD") && id && id === moi && q.get("select") === "id,role") db.profilRelus++;   // v56
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
const jourPasse = () => jourParis(Date.now() - 2 * J);   // un jour de Paris forcément antérieur (le jour du changement d'heure dure 25 h)
const TEXTE_CX = /Connexions|Dernière connexion|connexions? (notée|comptée)/i;
/* le décor du coach : des lignes dans la table (le compte de test, Thomas, Léa ; Marc et Karim n'en ont pas) */
const CX_TEST = { nombre: 12, derniere: avant(3 * H), premiere: avant(20 * J) };
const CX_THOMAS = { nombre: 5, derniere: avant(H), premiere: avant(10 * J) };
const CX_LEA = { nombre: 3, derniere: avant(26 * H), premiere: avant(3 * J) };
function avecLignes(db){
  const l = (uid, o) => { db.cx[uid] = Object.assign({ user_id: uid, dernier_jour: jourParis(Date.parse(o.derniere)) }, o, { derniere: pgInstant(o.derniere), premiere: pgInstant(o.premiere) }); };
  l(TESTEUR.id, CX_TEST); l(F.IDS.c1, CX_THOMAS); l(LEA, CX_LEA);
  return db;
}
/* les faits d'une carte de la page Prospects : { libellé : valeur } */
const faits = (page, uid) => page.$eval(`#pr-liste .sc-carte[data-uid="${uid}"]`, e => { const o = {}, k = []; e.querySelectorAll(".sc-faits li").forEach(li => { const a = (li.querySelector("span") || {}).textContent || "", v = (li.querySelector("b") || {}).textContent || ""; o[a.trim()] = v.trim(); k.push(a.trim()); }); o._ordre = k; return o; }).catch(() => ({}));
const titre = (page, uid, col) => page.$eval(`#tb-clients [data-ouvrir="${uid}"]`, (bt, c) => { const td = bt.closest("tr").querySelector(`td[data-l="${c}"] [title]`); return td ? td.getAttribute("title") : ""; }, col).catch(() => "");

/* ---------- aides de la v57 ---------- */
const TABLETTE = { width: 820, height: 1180 }, TEL = { width: 375, height: 812 };
const CAPT = process.env.VERIF62_CAPTURES ? path.resolve(process.env.VERIF62_CAPTURES) : null;
const capture = async (page, nom) => { if (CAPT) { fs.mkdirSync(CAPT, { recursive: true }); await page.screenshot({ path: path.join(CAPT, nom + ".png") }).catch(() => {}); } };
/* la date courte attendue (jj/mm hh:mm, jj/mm/aaaa hh:mm si ce n'est pas l'année en cours), à l'heure de l'appareil du coach */
const quandCourt = v => { const q = quandCoach(v), an = quandCoach(new Date().toISOString()).slice(6, 10); return q.slice(6, 10) === an ? q.slice(0, 5) + q.slice(10) : q; };
const COURT = /^\d{2}\/\d{2}(\/\d{4})? \d{2}:\d{2}$/;
const ORDRE_TH = ["Client", "Retour", "Note", "Smiley", "Visite", "Connexions", "Dernière connexion", "Jours actifs", "Activité"];
const ORDRE_TD = ["Client", "Retour de la semaine", "Dernière note", "Dernier smiley", "Dernière visite", "Connexions", "Dernière connexion", "Jours actifs (30 j)", "Activité"];
const ordreTd = (page, uid) => page.$eval(`#tb-clients [data-ouvrir="${uid}"]`, bt => Array.from(bt.closest("tr").querySelectorAll("td")).map(td => td.dataset.l)).catch(() => []);
/* le tableau défilé de côté (scrollLeft) : pour chaque nom, sa place dans le cadre qui défile, s'il est par-dessus les autres
   cellules (elementFromPoint), sa position CSS et son fond ; l'en-tête « Client » ; la colonne « Dernière connexion » */
async function geo(page, uids, gauche){
  return page.evaluate(({ ids, gauche }) => {
    const sc = document.querySelector(".tb-clients-table").closest(".scroll");
    if (gauche === "fin") sc.scrollLeft = sc.scrollWidth; else if (typeof gauche === "number") sc.scrollLeft = gauche;
    const r0 = sc.getBoundingClientRect();
    const place = e => { const r = e.getBoundingClientRect(); window.scrollTo(0, window.scrollY + r.top - window.innerHeight / 2); return e.getBoundingClientRect(); };
    const nom = id => {
      const bt = document.querySelector(`#tb-clients [data-ouvrir="${id}"]`); if (!bt) return null;
      const td = bt.closest("tr").querySelector("td"), r = place(td), cs = getComputedStyle(td);
      const x = r.left + Math.min(30, r.width / 2), y = r.top + r.height / 2, e = document.elementFromPoint(x, y);
      const o = bt.getBoundingClientRect(), eo = document.elementFromPoint(o.left + o.width / 2, o.top + o.height / 2);
      return { gauche: Math.round(r.left - r0.left), dessus: !!(e && td.contains(e)), pos: cs.position, fond: cs.backgroundColor, nom: ((td.querySelector("b") || {}).textContent || "").trim(), ouvrir: eo === bt };
    };
    const th = document.querySelector(".tb-clients-table thead th"), rt = th.getBoundingClientRect();
    const hc = Array.from(document.querySelectorAll(".tb-clients-table thead th")).find(e => e.textContent.trim() === "Dernière connexion"), rc = hc.getBoundingClientRect();
    return { deborde: sc.scrollWidth > sc.clientWidth + 1, defile: Math.round(sc.scrollLeft), noms: ids.map(nom),
      th: { gauche: Math.round(rt.left - r0.left), pos: getComputedStyle(th).position, fond: getComputedStyle(th).backgroundColor },
      panneau: getComputedStyle(sc.closest(".panel")).backgroundColor, cx: { droite: Math.round(rc.right - r0.left), cadre: sc.clientWidth } };
  }, { ids: uids, gauche });
}
const TRANSPARENT = /^(transparent|rgba\(0, 0, 0, 0\))$/;

/* ---------- aides de la v59 (lot D) : la barre du haut sur téléphone ----------
   jamais une largeur de texte comparée en pixels (les polices de Google sont bloquées ici : polices de secours, qui changent
   d'une machine à l'autre) : seulement des bords (dans la barre, dans l'écran), des hauteurs, des styles calculés, et la
   même page mesurée avec et sans la règle v59 (bloc E, « identique à la v58 ») */
const LARGEURS = [320, 359, 360, 375, 390], LARGEURS_ALERTE = LARGEURS.concat(414);
const HAUT_ALERTE = 160;   // barre avec une alerte du témoin : une ligne de plus, deux jusqu'à 390 px pour « Hors ligne — gardé… » (126 à 145 px ici)
const LONG_P = "Marie-Christine-Alexandra-Joséphine-Éléonore-Victoire-Annaël", LONG_N = "Delacroix-Beaumont de la Fontaine-Saint-Julien-des-Prés-Loir";   // 60 + 60 caractères (maxlength de l'inscription)
/* la barre : zone utile (sans ses marges), bords, hauteur et état de la marque et de chaque élément du compte ; ici = l'élément
   est bien celui qu'on touche en son centre (rien par-dessus) ; coupe = son texte ne tient pas dans sa largeur */
const barre = page => page.evaluate(() => {
  const w = document.querySelector(".topbar .wrap"), cw = getComputedStyle(w), rw = w.getBoundingClientRect(), a = v => Math.round(v * 10) / 10;
  const m = e => {
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    const x = r.width ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
    return { g: a(r.left), d: a(r.right), t: a(r.top), b: a(r.bottom), l: a(r.width), h: a(r.height), vu: cs.display !== "none" && r.width > 0, coupe: e.scrollWidth > e.clientWidth + 1, to: cs.textOverflow, txt: e.textContent, ici: !!x && e.contains(x) };
  };
  const o = { brand: m(w.querySelector(".brand")) }; ["compte", "etat", "qui", "theme", "langue", "deco"].forEach(id => { o[id] = m(document.getElementById(id)); });
  return { deb: a(rw.left + parseFloat(cw.paddingLeft)), fin: a(rw.right - parseFloat(cw.paddingRight)), o, haut: Math.round(document.querySelector(".topbar").getBoundingClientRect().height),
    page: document.documentElement.scrollWidth, ecran: window.innerWidth };
});
/* les défauts d'une mesure (vide : rien à redire) : page qui déborde, marque ou élément hors de la zone utile, bouton coupé, sur deux
   lignes (44 px), plus bas que 32 px, caché ou pas sur la ligne de « Se déconnecter », texte coupé sans « … », barre sur 3 lignes ;
   alerte : le témoin montre une alerte (« Hors ligne — … », « Non enregistré — … ») : elle doit être entière (non raccourcie),
   visible, sur sa ligne à elle au-dessus des boutons, le nom restant sur la ligne des boutons (la barre a une ligne de plus) */
function defautsBarre(B, L, alerte){
  const p = [], o = B.o;
  if (B.page > B.ecran + 1) p.push("page de " + B.page + " px");
  ["brand", "compte", "qui", "theme", "langue", "deco"].concat(o.etat.vu ? ["etat"] : []).forEach(k => { if (o[k].g < B.deb - 0.5 || o[k].d > B.fin + 0.5) p.push(k + " hors de la barre (" + o[k].g + "-" + o[k].d + " pour " + B.deb + "-" + B.fin + ")"); });
  ["theme", "langue", "deco"].forEach(k => {
    const x = o[k];
    if (x.h < 32 || x.h >= 40 || x.coupe || !x.ici) p.push(k + " « " + x.txt + " » " + x.l + " x " + x.h + (x.coupe ? " coupé" : "") + (x.ici ? "" : " caché"));
    if (Math.abs(x.t - o.deco.t) > 2) p.push(k + " pas sur la ligne de « Se déconnecter »");
  });
  ["qui", "etat"].forEach(k => { if (o[k].coupe && o[k].to !== "ellipsis") p.push(k + " coupé sans « … »"); });
  if (alerte) {
    const e = o.etat;
    if (!e.vu || e.coupe || !e.ici) p.push("alerte « " + e.txt + " »" + (e.vu ? "" : " cachée") + (e.coupe ? " raccourcie (" + e.l + " px)" : "") + (e.ici ? "" : " recouverte"));
    if (e.b > o.deco.t + 0.5) p.push("alerte pas au-dessus des boutons (" + e.t + "-" + e.b + ", boutons à " + o.deco.t + ")");
    if (Math.abs(o.qui.t + o.qui.h / 2 - (o.deco.t + o.deco.h / 2)) > 2) p.push("nom pas sur la ligne des boutons");
  }
  if (B.haut > (alerte ? HAUT_ALERTE : 110)) p.push("barre de " + B.haut + " px de haut");
  return p.length ? L + " px : " + p.join(", ") : "";
}
/* la barre à chaque largeur (même page, fenêtre redimensionnée) ; avant(page) : juste avant chaque mesure (témoin…) ; alerte : voir
   defautsBarre (largeurs : LARGEURS_ALERTE) */
async function tourBarre(page, avant, alerte){
  const trop = [], vus = {};
  for (const L of alerte ? LARGEURS_ALERTE : LARGEURS) {
    await page.setViewportSize({ width: L, height: 700 }); await attendre(page, 250);
    if (avant) await avant(page);
    const B = await barre(page); vus[L] = B;
    const d = defautsBarre(B, L, alerte); if (d) trop.push(d);
  }
  return { trop, vus };
}
/* position et taille de chaque élément de la barre (au dixième de pixel), pour comparer deux feuilles de style sur la même machine */
const geoBarre = page => page.evaluate(() => [".topbar", ".topbar .brand", "#compte", "#etat", "#qui", "#theme", "#langue", "#deco"].map(s => {
  const r = document.querySelector(s).getBoundingClientRect(); return s + " " + [r.left, r.top, r.width, r.height].map(v => Math.round(v * 10) / 10).join(",");
}).join(" | "));
const styleBarre = page => page.evaluate(() => { const g = id => getComputedStyle(document.getElementById(id));
  return [g("compte").columnGap, g("deco").paddingLeft + " " + g("deco").paddingRight, g("langue").paddingLeft, g("etat").display, g("theme").width + " " + g("theme").paddingLeft].join("|"); });
/* la règle v59 telle qu'elle est dans le fichier servi (css/communs.css) : retirée le temps d'une mesure, la feuille redevient
   celle de la v58. Absente (fichier de la v58) : la page est sa propre référence. */
const BLOC59 = (/\/\* v59 : barre du haut sur téléphone[\s\S]*?@media \(max-width:359px\)\{(?:\s*[^{}]+\{[^{}]*\})*\s*\}\n/.exec(SRC) || [])[0] || null;
/* dans la règle v59, la partie des alertes du témoin (@supports selector(:has(*))) : retirée, c'est un navigateur sans :has */
const ALERTE59 = (/\n  @supports selector\(:has\(\*\)\)\{[\s\S]*?\n  \}\n/.exec(BLOC59 || "") || [])[0] || null;

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF62_PORT=9781 node verif62.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();
  URL0 = `http://localhost:${PORT}/`;

  /* =================== A. Mes clients sur ordinateur =================== */
  for (const theme of ["sombre", "clair"]) await bloc("A. Mes clients sur ordinateur (thème " + theme + ")", async () => {
    const db = avecLignes(decor());
    const { page } = await coachSur(b, db, "#/clients", "#tb-clients [data-ouvrir]", Object.assign({ fuseau: FUSEAU }, theme === "clair" ? { stockage: { mhx_theme: "light" } } : {}));
    const t = " (" + theme + ")";
    if (theme === "sombre") {
      const th = await page.$$eval(".tb-clients-table thead th", l => l.map(e => e.textContent.trim()));
      ok("A : en-têtes : Client, Retour, Note, Smiley, Visite, puis « Connexions » et « Dernière connexion », puis « Jours actifs » et « Activité »", egal(th.slice(0, ORDRE_TH.length), ORDRE_TH) && th.length === 17, JSON.stringify(th));
      const o = await ordreTd(page, TESTEUR.id), o2 = await ordreTd(page, F.IDS.c1);   // v71 (D) : Thomas (Léa, prospecte, n'est plus dans le tableau)
      ok("A : les cellules d'une ligne suivent le même ordre (compte de test, Thomas)", egal(o.slice(0, ORDRE_TD.length), ORDRE_TD) && egal(o2, o), JSON.stringify(o));
      const T = await ligneClient(page, TESTEUR.id), Th = await ligneClient(page, F.IDS.c1);
      /* v71 (D) : Léa et Marc (prospects) n'ont plus de ligne dans le tableau : la ligne sous le titre renvoie à la page Prospects,
         où leurs connexions se lisent sur leur carte (date longue) — lue ici dans un second navigateur du coach */
      const absents = await page.evaluate(ids => ids.map(id => !document.querySelector(`#tb-clients [data-ouvrir="${id}"]`)), [LEA, MARC]);
      const notePr = await page.$eval("#clients-prospects", e => { const a = e.querySelector("a.link-a"); return { t: e.textContent, lien: a ? a.getAttribute("href") : "", cache: e.hidden }; }).catch(() => ({}));
      const NB_PR = prospects().filter(p => p.statut === "prospect").length;
      const xp = await coachSur(b, db, "#/prospects", "#pr-liste", { fuseau: FUSEAU }); await filtre(xp.page, "tous");
      const Le = await faits(xp.page, LEA), Ma = await faits(xp.page, MARC);
      ok("A : date courte à l'heure du coach : compte de test « " + quandCourt(CX_TEST.derniere) + " », Thomas « " + quandCourt(CX_THOMAS.derniere) + " » ; Léa (prospecte) n'est plus dans le tableau, la ligne « Les prospects sont dans Prospects → (" + NB_PR + " comptes gratuits). » y renvoie, sa carte Prospects garde la date longue « " + quandCoach(CX_LEA.derniere) + " »",
        T["Dernière connexion"] === quandCourt(CX_TEST.derniere) && Th["Dernière connexion"] === quandCourt(CX_THOMAS.derniere) && COURT.test(T["Dernière connexion"]) && absents[0] && norm(notePr.t) === "Les prospects sont dans Prospects → (" + NB_PR + " comptes gratuits)." && notePr.lien === "#/prospects" && !notePr.cache && Le["Dernière connexion"] === quandCoach(CX_LEA.derniere), JSON.stringify([T["Dernière connexion"], Th["Dernière connexion"], absents, notePr, Le["Dernière connexion"]]));
      ok("A : nombres et « aucune » inchangés (12, 5 ; sur leurs cartes Prospects : Léa 3, Marc « 0 » et « aucune »), info-bulle inchangée", T["Connexions"] === "12" && Th["Connexions"] === "5" && Le["Connexions"] === "3" && Ma["Connexions"] === "0" && Ma["Dernière connexion"] === "aucune" && absents[1] && (await titre(page, TESTEUR.id, "Connexions")) === "Une connexion par jour au plus, comptées depuis le " + jourCoach(CX_TEST.premiere), JSON.stringify([T["Connexions"], Th["Connexions"], Le["Connexions"], Ma]));
    }
    const g0 = await geo(page, [TESTEUR.id, F.IDS.c1], 0);
    await capture(page, "A-1280-" + theme + "-debut");
    ok("A : 1280 px : « Connexions » et « Dernière connexion » visibles sans défiler" + t, g0.cx.droite <= g0.cx.cadre, JSON.stringify(g0.cx));
    ok("A : la colonne du nom et l'en-tête « Client » sont fixes (sticky), du fond du panneau" + t, g0.noms.every(n => n && n.pos === "sticky" && n.fond === g0.panneau) && g0.th.pos === "sticky" && g0.th.fond === g0.panneau && !TRANSPARENT.test(g0.panneau), JSON.stringify([g0.noms, g0.th, g0.panneau]));
    const g1 = await geo(page, [TESTEUR.id, F.IDS.c1], "fin");
    await capture(page, "A-1280-" + theme + "-fin");
    ok("A : tableau défilé jusqu'au bout : les noms restent à gauche, par-dessus les autres colonnes" + t, (!g1.deborde || g1.defile > 0) && g1.noms.every(n => n && Math.abs(n.gauche) <= 1 && n.dessus) && Math.abs(g1.th.gauche) <= 1 && g1.noms[1].nom === "Thomas Démo", JSON.stringify(g1));
    /* la ligne survolée : la cellule du nom prend le même fond que les autres cellules de la ligne */
    const survol = await page.evaluate(id => { const tr = document.querySelector(`#tb-clients [data-ouvrir="${id}"]`).closest("tr"); const td = tr.querySelectorAll("td"); const r = td[td.length - 2].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, F.IDS.c1);
    await page.mouse.move(survol.x, survol.y); await attendre(page, 250);
    const fonds = await page.evaluate(id => { const td = document.querySelector(`#tb-clients [data-ouvrir="${id}"]`).closest("tr").querySelectorAll("td"); return [getComputedStyle(td[0]).backgroundColor, getComputedStyle(td[td.length - 2]).backgroundColor]; }, F.IDS.c1);
    ok("A : ligne survolée : la cellule du nom a le fond des autres cellules, opaque" + t, fonds[0] === fonds[1] && !TRANSPARENT.test(fonds[0]) && fonds[0] !== g0.panneau, JSON.stringify(fonds));
    await page.mouse.move(1, 1);
    ok("A : la page ne déborde pas en largeur" + t, !(await deborde(page)), await largeur(page));
    if (theme === "sombre") {
      await aller(page, "#/prospects", 1800); await filtre(page, "tous");
      const fl = await faits(page, LEA);
      ok("A : page Prospects : la carte de Léa garde la date longue (" + quandCoach(CX_LEA.derniere) + ")", fl["Dernière connexion"] === quandCoach(CX_LEA.derniere), JSON.stringify(fl));
      ok("A : aucune écriture, aucune connexion notée pour le coach", db.ecritures.length === 0 && notees(db).length === 0, resume(db));
    }
  });

  /* =================== B. Mes clients sur tablette =================== */
  await bloc("B. Mes clients sur tablette", async () => {
    const db = avecLignes(decor());
    const { page } = await coachSur(b, db, "#/clients", "#tb-clients [data-ouvrir]", { viewport: TABLETTE, fuseau: FUSEAU });
    const ids = [TESTEUR.id, F.IDS.c1, F.IDS.c2];   // v71 (D) : Sarah à la place de Léa (prospecte, plus dans le tableau)
    const g0 = await geo(page, ids, 0);
    await capture(page, "B-820-debut");
    ok("B : 820 px : le tableau est plus large que l'écran (il défile de côté)", g0.deborde, JSON.stringify(g0));
    const g1 = await geo(page, ids, 300);
    await capture(page, "B-820-milieu");
    ok("B : défilé de 300 px : les noms (compte de test, Thomas, Sarah) et « Client » restent à gauche, par-dessus", g1.defile > 0 && g1.noms.every(n => n && Math.abs(n.gauche) <= 1 && n.dessus) && Math.abs(g1.th.gauche) <= 1 && g1.noms[2].nom === "Sarah Démo", JSON.stringify(g1));
    const g2 = await geo(page, ids, "fin");
    await capture(page, "B-820-fin");
    ok("B : défilé jusqu'au bout : les noms restent lisibles, et « Ouvrir » (dernière colonne) reste cliquable", g2.defile > g1.defile && g2.noms.every(n => n && Math.abs(n.gauche) <= 1 && n.dessus && n.ouvrir), JSON.stringify(g2));
    ok("B : la page ne déborde pas en largeur", !(await deborde(page)), await largeur(page));
  });

  /* =================== C. Mes clients sur téléphone =================== */
  await bloc("C. Mes clients sur téléphone", async () => {
    const db = avecLignes(decor());
    const { page } = await coachSur(b, db, "#/clients", "#tb-clients [data-ouvrir]", { viewport: TEL, fuseau: FUSEAU });
    await page.$eval(`#tb-clients [data-ouvrir="${TESTEUR.id}"]`, bt => bt.closest("tr").scrollIntoView({ block: "center" }));
    await capture(page, "C-375");
    const c = await page.$eval(`#tb-clients [data-ouvrir="${TESTEUR.id}"]`, bt => { const tr = bt.closest("tr"); return { l: Array.from(tr.querySelectorAll("td")).filter(td => td.getBoundingClientRect().height > 0).map(td => ({ l: td.dataset.l, avant: getComputedStyle(td, "::before").content, t: td.textContent.trim() })), pos: getComputedStyle(tr.querySelector("td")).position }; });
    const L = c.l.map(x => x.l), i = L.indexOf("Dernière visite");
    ok("C : 375 px : carte du compte de test : « Dernière visite », « Connexions », « Dernière connexion », « Jours actifs (30 j) », à la suite, avec leur libellé", i > 0 && egal(L.slice(i, i + 4), ORDRE_TD.slice(4, 8)) && c.l.slice(i, i + 4).every(x => x.avant.includes(x.l)), JSON.stringify(c.l.slice(i, i + 4)));
    ok("C : … « 12 » et la date courte « " + quandCourt(CX_TEST.derniere) + " » ; rien de fixe dans les cartes", c.l[i + 1].t === "12" && c.l[i + 2].t === quandCourt(CX_TEST.derniere) && c.pos === "static", JSON.stringify([c.l[i + 1], c.l[i + 2], c.pos]));
    ok("C : la page ne déborde pas en largeur", !(await deborde(page)), await largeur(page));
    /* v58 : les morceaux de chaque valeur (texte et éléments, hors libellé) : écart le plus grand entre deux morceaux d'une même
       ligne, et distance entre le dernier morceau et le bord droit de la cellule (le nom, aligné à gauche, et les boutons à part) */
    const morceaux = await page.evaluate(() => Array.from(document.querySelectorAll("#tb-clients tr")).flatMap(tr => Array.from(tr.querySelectorAll("td")).filter((td, i) => i > 0 && td.dataset.l && !td.classList.contains("td-actions")).map(td => {
      const rg = document.createRange(); rg.selectNodeContents(td);
      const rs = Array.from(rg.getClientRects()).filter(r => r.width > 0 && r.height > 0).sort((a, b) => a.left - b.left);
      if (!rs.length) return null;
      const ligne = rs.filter(r => Math.abs((r.top + r.bottom) / 2 - (rs[0].top + rs[0].bottom) / 2) < 6);
      let fin = ligne[0].right, ecart = 0; ligne.slice(1).forEach(r => { ecart = Math.max(ecart, r.left - fin); fin = Math.max(fin, r.right); });
      const tdR = td.getBoundingClientRect(), pad = parseFloat(getComputedStyle(td).paddingRight) || 0;
      return { nom: (tr.querySelector("td b") || {}).textContent, l: td.dataset.l, t: td.textContent.replace(/\s+/g, " ").trim(), ecart: Math.round(ecart), bord: Math.round(tdR.right - pad - Math.max(...rs.map(r => r.right))) };
    })).filter(Boolean));
    const ecartes = morceaux.filter(m => m.ecart > 8 || m.bord > 2);
    /* v71 (D) : les prospects ne sont plus dans le tableau : 5 clients (Thomas, Sarah, Julien, compte de test, Karim) × 15 valeurs = 75 */
    ok("C : v58 : dans toutes les cartes, chaque valeur reste d'un seul tenant et collée à droite (" + morceaux.length + " valeurs mesurées)", morceaux.length >= 75 && ecartes.length === 0, JSON.stringify(ecartes.slice(0, 6)));
    const M = (nom, l) => morceaux.find(m => m.nom === nom && m.l === l) || {};
    const tNote = M("Sans nom", "Dernière note"), tReg = M("Sans nom", "Régularité");
    ok("C : v58 : compte de test : « 7/10 » et « 0/100 (en cours : 0) » d'un seul tenant", tNote.t === "7/10" && tNote.ecart <= 1 && /^\d+\/100 \(en cours : \d+\)$/.test(tReg.t) && tReg.ecart <= 8, JSON.stringify([tNote, tReg]));
    /* v58 : rien ne dépasse d'une carte (le cadre du tableau ne défile pas de côté, aucune cellule plus large que sa place) */
    const cartes = pg => pg.evaluate(() => { const sc = document.querySelector(".tb-clients-table").closest(".scroll"); const trop = Array.from(document.querySelectorAll("#tb-clients td")).filter(td => td.scrollWidth > td.clientWidth + 1).map(td => ((td.closest("tr").querySelector("td b") || {}).textContent || "?") + " / " + (td.dataset.l || "Client") + " : " + td.scrollWidth + " pour " + td.clientWidth); return { cadre: sc.scrollWidth + "/" + sc.clientWidth, defile: sc.scrollWidth > sc.clientWidth + 1, trop }; });
    const k375 = await cartes(page);
    ok("C : v58 : 375 px : aucune carte ne déborde (nom et pastilles repliés dans la carte), le tableau ne défile pas de côté", !k375.defile && k375.trop.length === 0, JSON.stringify(k375).slice(0, 400));
    const x320 = await coachSur(b, db, "#/clients", "#tb-clients [data-ouvrir]", { viewport: { width: 320, height: 700 }, fuseau: FUSEAU });
    const k320 = await cartes(x320.page);
    await x320.page.$eval(`#tb-clients [data-ouvrir="${TESTEUR.id}"]`, bt => bt.closest("tr").scrollIntoView({ block: "start" })); await capture(x320.page, "C-320-test");   // v71 (D) : le compte de test (Léa, prospecte, n'a plus de ligne)
    ok("C : v58 : 320 px : aucune carte ne déborde (pastilles repliées), le tableau ne défile pas de côté", !k320.defile && k320.trop.length === 0, JSON.stringify(k320).slice(0, 400));
    /* v59 : jusqu'à la v58, la page débordait à 320 px à cause de la barre du haut du coach (nom, EN, « Se déconnecter ») ; le détail au bloc E */
    ok("C : v59 : 320 px : la page ne déborde pas en largeur (barre du haut du coach comprise)", !(await deborde(x320.page)), await largeur(x320.page));
    const thP = M("Thomas Démo", "Poids"), th4 = M("Thomas Démo", "4 dernières sem.");
    ok("C : v58 : Thomas : poids « " + thP.t + " » et « 4 dernières sem. » « " + th4.t + " » d'un seul tenant", /^\d+(,\d)? kg \(départ \d+(,\d)?\)$/.test(thP.t || "") && thP.ecart <= 8 && / kg/.test(th4.t || "") && th4.ecart <= 8, JSON.stringify([thP, th4]));
  });

  /* =================== D. la connexion ouvre la page d'arrivée =================== */
  const connecter = async (page, email) => { await page.waitForSelector("#c-email"); await page.fill("#c-email", email); await page.fill("#c-mdp", "motdepasse1"); await page.click("#c-go"); await pret(page, "#vue"); await attendre(page, 800); };
  await bloc("D. connexion : page d'arrivée", async () => {
    const db = decor();
    db.connexions["test@exemple.fr"] = TESTEUR.id; db.connexions["lea@exemple.fr"] = LEA; db.connexions["coach@exemple.fr"] = COACH.id;
    /* le compte de test (client) : l'appareil n'a plus de session, l'adresse garde la Speed Formation (dernière page ouverte) */
    const x1 = await contexte(b, null, db);
    await x1.page.goto(URL0 + "#/formation"); await x1.page.waitForSelector("#c-email");
    ok("D : appareil sans session, adresse #/formation : l'écran de connexion", !!(await x1.page.$("#c-go")) && (await x1.page.evaluate(() => location.hash)) === "#/formation", await x1.page.evaluate(() => location.href));
    await connecter(x1.page, "test@exemple.fr");
    const d1 = await ou(x1.page);
    ok("D : client connecté par mot de passe : son accueil, pas la Speed Formation", d1.courant === "accueil" && ["", "#/accueil"].includes(d1.hash) && !!(await x1.page.$("#acc-vue")), JSON.stringify(d1));
    ok("D : … la connexion est notée pour lui (une fois)", notees(db, TESTEUR.id).length === 1 && db.tokens.includes("password"), JSON.stringify(notees(db)));
    /* « Se déconnecter » depuis la Speed Formation, puis connexion : l'accueil (comme avant la v57) */
    await aller(x1.page, "#/formation", 1500);
    const f1 = await ou(x1.page);
    await x1.page.click("#deco"); await x1.page.waitForSelector("#c-email"); await attendre(x1.page, 300);
    await connecter(x1.page, "test@exemple.fr");
    const d2 = await ou(x1.page);
    ok("D : « Se déconnecter » depuis la Speed Formation, puis connexion : l'accueil", f1.courant === "formation" && d2.courant === "accueil", JSON.stringify([f1, d2]));
    /* « Me reconnecter » : session perdue en cours d'utilisation, sur la Speed Formation */
    await aller(x1.page, "#/formation", 1500);
    await x1.page.evaluate(() => sessionPerdue()); await x1.page.waitForSelector("#session-perdue button");
    await x1.page.click("#session-perdue button"); await x1.page.waitForSelector("#c-email"); await attendre(x1.page, 300);
    await connecter(x1.page, "test@exemple.fr");
    const d3 = await ou(x1.page);
    ok("D : « Me reconnecter » (session perdue sur la Speed Formation) : retour sur la Speed Formation", d3.courant === "formation" && d3.hash === "#/formation", JSON.stringify(d3));
    /* un prospect : sa page d'arrivée (jamais la Speed Formation gardée dans l'adresse) */
    const x2 = await contexte(b, null, db);
    await x2.page.goto(URL0 + "#/formation"); await connecter(x2.page, "lea@exemple.fr");
    const d4 = await ou(x2.page), dp = await x2.page.evaluate(() => outilParDefaut()).catch(() => "?");
    ok("D : prospecte, adresse #/formation : sa page d'arrivée (" + dp + ")", d4.courant === dp && d4.courant !== "formation" && !String(d4.hash).includes("formation"), JSON.stringify([d4, dp]));
    /* le coach : adresse #/prospects gardée : son tableau de bord */
    const x3 = await contexte(b, null, db);
    await x3.page.goto(URL0 + "#/prospects"); await connecter(x3.page, "coach@exemple.fr");
    const d5 = await ou(x3.page);
    ok("D : coach, adresse #/prospects : son tableau de bord", d5.courant === "tableau" && !!(await x3.page.$("#tb-vue")), JSON.stringify(d5));
    ok("D : aucune écriture dans les données pendant ces connexions (hors activité du prospect)", ecrDonnees(db).filter(e => e.outil !== "activite").length === 0, resume(db));
  });

  /* =================== E. v59 : la barre du haut sur téléphone =================== */
  await bloc("E. barre du haut sur téléphone", async () => {
    const TEL0 = { viewport: { width: 320, height: 700 } };
    const LIB = "à " + LARGEURS.join(", ").replace(/, (\d+)$/, " et $1") + " px";
    const resultat = r => r.trop.join(" ; ").slice(0, 700);
    const nomVu = (r, n) => Object.values(r.vus).every(B => B.o.qui.txt === n);
    /* le coach (#/clients), son nom suivi de « · coach » ; puis le témoin d'enregistrement affiché (il ne s'efface pas seul) */
    const x1 = await coachSur(b, decor(), "#/clients", "#tb-clients [data-ouvrir]", TEL0);
    const r1 = await tourBarre(x1.page, pg => pg.evaluate(() => majEtat("")));
    ok("E : coach (#/clients) " + LIB + " : la page ne déborde pas ; ☀, EN et « Se déconnecter » entiers, sur une ligne, dans la barre, cliquables, 32 px de haut au moins ; le nom se raccourcit avec « … »", r1.trop.length === 0 && nomVu(r1, "Coach Démo · coach"), resultat(r1));
    const r1a = await tourBarre(x1.page, pg => pg.evaluate(() => majEtat("enregistrement")));
    const temoin = (r, t) => Object.values(r.vus).every(B => B.o.etat.vu && B.o.etat.txt === t);
    ok("E : témoin « Enregistrement… » affiché (coach) " + LIB + " : même chose, le témoin et le nom se raccourcissent avec « … »",
      r1a.trop.length === 0 && temoin(r1a, "Enregistrement…"), resultat(r1a));
    /* une alerte du témoin n'est jamais raccourcie : « Hors ligne — gardé sur cet appareil… » et « Hors ligne — modification
       non enregistrée » commencent pareil (raccourcies, toutes deux « Hors ligne… ») ; elle a sa ligne, au-dessus du nom et des boutons */
    const LIB_A = "à " + LARGEURS_ALERTE.join(", ").replace(/, (\d+)$/, " et $1") + " px";
    const H_ERR = "Hors ligne — gardé sur cet appareil, renvoi automatique", H_PERDU = "Hors ligne — modification non enregistrée", H_REFUS = "Non enregistré — modification refusée";
    const hauts = rs => rs.map(r => Object.keys(r.vus).map(L => L + ":" + r.vus[L].haut).join(" ")).join(" / ");
    const r1b = await tourBarre(x1.page, pg => pg.evaluate(() => majEtat("erreur")), true);
    ok("E : alerte « " + H_ERR + " » (coach) " + LIB_A + " : texte entier (non raccourci), sur sa ligne au-dessus du nom et des boutons ; la page ne déborde pas, ☀, EN et « Se déconnecter » entiers sur une ligne, cliquables ; le nom se raccourcit avec « … » sur la ligne des boutons",
      r1b.trop.length === 0 && temoin(r1b, H_ERR) && r1b.vus[320].o.qui.coupe, resultat(r1b) + " hauteurs " + hauts([r1b]));
    /* un client (Thomas) ; le compte de test (client sans prénom ni nom : son email dans la barre) */
    const x2 = await contexte(b, THOMAS, decor(), TEL0);
    await x2.page.goto(URL0 + "#/accueil"); await pret(x2.page, "#vue");
    const r2 = await tourBarre(x2.page, pg => pg.evaluate(() => majEtat("")));
    ok("E : client Thomas (#/accueil) " + LIB + " : la page ne déborde pas, les trois boutons entiers sur une ligne, dans la barre, 32 px de haut au moins", r2.trop.length === 0 && nomVu(r2, "Thomas Démo"), resultat(r2));
    /* ses trois alertes (hors ligne gardée, hors ligne perdue, refusée), puis l'alerte passée : la barre redevient celle sans témoin */
    const geo0 = await (async () => { await x2.page.setViewportSize({ width: 375, height: 700 }); await attendre(x2.page, 250); await x2.page.evaluate(() => majEtat("")); return geoBarre(x2.page); })();
    const rA = [];
    for (const [etat, t] of [["erreur", H_ERR], ["perdu", H_PERDU], ["refuse", H_REFUS]]) { const r = await tourBarre(x2.page, pg => pg.evaluate(e => majEtat(e), etat), true); rA.push([etat, t, r]); }
    await x2.page.setViewportSize({ width: 375, height: 700 }); await attendre(x2.page, 250);
    await x2.page.evaluate(() => { majEtat("enregistrement"); majEtat(""); }); await attendre(x2.page, 100);
    const geo1 = await geoBarre(x2.page);
    const lus = L => rA.map(([, , r]) => r.vus[L].o.etat.txt);
    ok("E : client Thomas, ses trois alertes (« " + H_ERR + " », « " + H_PERDU + " », « " + H_REFUS + " ») " + LIB_A + " : chacune entière sur sa ligne (les deux « Hors ligne — » se distinguent), mêmes garanties ; l'alerte passée, la barre redevient la même au dixième de pixel",
      rA.every(([, t, r]) => r.trop.length === 0 && temoin(r, t) && nomVu(r, "Thomas Démo")) && LARGEURS_ALERTE.every(L => new Set(lus(L)).size === 3) && geo1 === geo0,
      rA.map(([e, , r]) => e + " : " + (resultat(r) || "ok")).join(" ; ").slice(0, 700) + " hauteurs " + hauts(rA.map(x => x[2])) + (geo1 === geo0 ? "" : " ; après l'alerte : " + geo1 + " au lieu de " + geo0));
    const x3 = await contexte(b, TESTEUR, decor(), TEL0);
    await x3.page.goto(URL0 + "#/accueil"); await pret(x3.page, "#vue");
    const r3 = await tourBarre(x3.page, pg => pg.evaluate(() => majEtat("")));
    ok("E : compte de test (client sans nom : « test@exemple.fr » dans la barre) " + LIB + " : même chose", r3.trop.length === 0 && nomVu(r3, "test@exemple.fr"), resultat(r3));
    /* un prospect au nom de 60 + 60 caractères (le plus long que permet l'inscription) */
    const x4 = await contexte(b, qui(PID(20), "mc@exemple.fr"), decor({ comptes: [prospect(20, LONG_P, LONG_N, { cree: 2 * J, q: 2 * J, rep: { probleme: "Perdre du gras", obstacle: "Le temps", projection: "Courir" }, email: "mc@exemple.fr" })] }), TEL0);
    await x4.page.goto(URL0); await pret(x4.page, "#vue");
    const r4 = await tourBarre(x4.page, pg => pg.evaluate(() => majEtat("")));
    ok("E : prospect au nom de 60 + 60 caractères " + LIB + " : même chose", r4.trop.length === 0 && nomVu(r4, LONG_P + " " + LONG_N), resultat(r4));
    /* c'est le nom qui se raccourcit, jamais les boutons (le texte entier reste dans la barre) */
    const n4 = r4.vus[320].o, n3 = r3.vus[320].o;
    ok("E : 320 px : c'est le nom qui se raccourcit avec « … » (prospect au nom long ; compte de test : son email), texte entier gardé ; les boutons gardent leur libellé entier",
      n4.qui.coupe && n4.qui.to === "ellipsis" && n4.qui.txt === LONG_P + " " + LONG_N && n3.qui.coupe && n3.qui.to === "ellipsis" && n3.qui.txt === "test@exemple.fr" && [n4, n3].every(o => !o.deco.coupe && !o.langue.coupe && o.deco.txt === "Se déconnecter" && o.langue.txt === "🇺🇸 EN"),
      JSON.stringify([n4.qui, n3.qui, n4.deco]).slice(0, 500));
    /* en anglais (« Log out », « 🇫🇷 FR ») : le compte de test, sans puis avec le témoin (« Offline — kept on this device… ») */
    const db5 = decor(); avecEn(db5, TESTEUR.id);
    const x5 = await contexte(b, TESTEUR, db5, TEL0);
    await x5.page.goto(URL0 + "#/accueil"); await pret(x5.page, "#vue");
    const r5 = await tourBarre(x5.page, pg => pg.evaluate(() => majEtat("")));
    const r5b = await tourBarre(x5.page, pg => pg.evaluate(() => majEtat("erreur")), true);
    const en = Object.values(r5.vus).every(B => B.o.deco.txt === "Log out" && B.o.langue.txt === "🇫🇷 FR");
    ok("E : en anglais (compte de test : « Log out », « 🇫🇷 FR ») " + LIB + " : même chose ; avec l'alerte « Offline — kept on this device, will resend automatically » " + LIB_A + " : entière sur sa ligne, comme en français",
      en && r5.trop.length === 0 && r5b.trop.length === 0 && temoin(r5b, "Offline — kept on this device, will resend automatically"), resultat({ trop: (en ? [] : ["libellés : " + r5.vus[320].o.deco.txt + " / " + r5.vus[320].o.langue.txt]).concat(r5.trop, r5b.trop) }));
    /* navigateur sans :has (règle des alertes retirée) : l'alerte se raccourcit avec « … » comme le reste, la page ne déborde pas */
    let rS = null;
    if (ALERTE59) await avec([[ALERTE59, "\n"]], async () => { await x2.page.reload(); await pret(x2.page, "#vue"); rS = await tourBarre(x2.page, pg => pg.evaluate(() => majEtat("perdu"))); });
    await x2.page.reload(); await pret(x2.page, "#vue");
    ok("E : navigateur sans :has (règle des alertes retirée), Thomas, alerte « " + H_PERDU + " » " + LIB + " : la page ne déborde pas, les boutons entiers ; l'alerte et le nom se raccourcissent avec « … »",
      !!rS && rS.trop.length === 0 && temoin(rS, H_PERDU) && rS.vus[320].o.etat.coupe && rS.vus[320].o.etat.to === "ellipsis",
      rS ? resultat(rS) : "règle des alertes introuvable dans css/communs.css (« @supports selector(:has(*)) » dans la règle v59)");
    /* les écarts et les marges ne se resserrent que sous 360 px (Thomas, témoin vide) */
    const st = {};
    for (const L of LARGEURS) { await x2.page.setViewportSize({ width: L, height: 700 }); await attendre(x2.page, 250); await x2.page.evaluate(() => majEtat("")); st[L] = await styleBarre(x2.page); }
    const SERRE = "6px|9px 9px|9px|none|32px 0px", NORMAL = "8px|12px 12px|12px|block|32px 0px";
    ok("E : sous 360 px seulement : écarts de 6 px, témoin vide retiré, boutons moins larges (☀ reste de 32 px) ; à 360 px et plus : 8 px, témoin vide gardé, marges de la v58",
      st[320] === SERRE && st[359] === SERRE && st[360] === NORMAL && st[375] === NORMAL && st[390] === NORMAL, JSON.stringify(st));
    /* nom normal à 360, 375 et 390 px : la barre est celle de la v58 (même page, même machine, sans la règle v59), chaque fois
       que la ligne tenait déjà avec la v58 (sinon, avec la v58, « Se déconnecter » passait sur deux lignes ou la page débordait) */
    const comparer = [], ecarts = [], nonComparables = [];
    let v59sansBloc = false, refV58 = true;
    const normaux = [["Thomas", THOMAS, decor(), "#/accueil"], ["Léa (prospecte)", qui(LEA, "lea@exemple.fr"), decor(), ""], ["Thomas en anglais", THOMAS, (() => { const d = decor(); avecEn(d, THOMAS.id); return d; })(), "#/accueil"]];
    for (const [nom, who, db, hash] of normaux) {
      const x = await contexte(b, who, db, { viewport: { width: 360, height: 700 } });
      await x.page.goto(URL0 + hash); await pret(x.page, "#vue");
      const mesure = async () => { const g = {}; for (const L of [360, 375, 390]) { await x.page.setViewportSize({ width: L, height: 700 }); await attendre(x.page, 250); await x.page.evaluate(() => majEtat("")); g[L] = { geo: await geoBarre(x.page), B: await barre(x.page) }; } return g; };
      const g59 = await mesure();
      if (!BLOC59 && g59[375].B.o.qui.to === "ellipsis") v59sansBloc = true;   // la règle v59 est là, mais pas sous la forme attendue
      let g58 = g59;
      if (BLOC59) await avec([[BLOC59, ""]], async () => { await x.page.reload(); await pret(x.page, "#vue"); g58 = await mesure(); });
      if (BLOC59 && g58[375].B.o.qui.to !== "clip") refV58 = false;   // la référence n'est pas la feuille de la v58 (règle toujours là)
      for (const L of [360, 375, 390]) {
        const B = g58[L].B;
        if (defautsBarre(B, L)) { nonComparables.push(nom + " " + L); continue; }
        comparer.push(L);
        if (g58[L].geo !== g59[L].geo) ecarts.push(nom + " " + L + " px : v58 " + g58[L].geo + " / v59 " + g59[L].geo);
      }
    }
    ok("E : nom normal (Thomas, Léa, Thomas en anglais) à 360, 375 et 390 px : barre identique à la v58, au dixième de pixel (même page sans la règle v59) — " + comparer.length + " mesures comparées",
      !v59sansBloc && refV58 && ecarts.length === 0 && [360, 375, 390].every(L => comparer.includes(L)), (v59sansBloc ? "règle v59 introuvable dans css/communs.css (commentaire « v59 : barre du haut sur téléphone ») ; " : "") + (refV58 ? "" : "la règle v59 n'a pas pu être retirée ; ") + ecarts.join(" ; ").slice(0, 600) + " non comparables : " + nonComparables.join(", "));
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
