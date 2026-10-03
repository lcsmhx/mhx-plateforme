/* verif60 — v53, lot D-clients (partie clients et coach du lot D, reportée de la v52), vérifié de bout en bout dans un vrai
   navigateur. Petits ajouts, sans interrupteur :
   A. client Thomas : sa navigation gagne « Mon journal » (après le programme) et le calculateur (après Ma progression),
      ses pages s'ouvrent (#/calculateur et #/journal gardent leur adresse), #/entrainement (l'outil du coach) reste
      fermé, rien n'est écrit à l'ouverture ;
   B. calculateur du client : sa clé à lui, calc_perso ; départ = le calc préparé par son coach, LU seulement ; rien
      d'écrit avant son accord ; calc JAMAIS écrit par le client (ni chez lui, ni chez personne), le calc du coach
      intact ; mêmes formules ; rechargé : ses chiffres à lui ;
   C. mêmes garde-fous que le prospect : âge 17 refusé (message, rien d'écrit), mineur ensuite (calc_perso retiré),
      IMC < 18,5 (pas d'objectif de perte, phrase de prudence, maintien enregistré) ; le calc du coach jamais touché ;
   D. client sans calc du coach : départ depuis son questionnaire, rien d'écrit sans son accord ; restauration d'une
      sauvegarde : calc refusé, calc_perso accepté ;
   E. « Mon journal » : l'historique de ses séances notées (les plus récentes d'abord, exercices et séries), « Noter ma
      séance » pour chaque séance de son programme (formulaire replié), une séance notée s'ajoute (zéro perte, seule la
      clé journal est écrite), la liste et la pastille suivent, « Mon programme » la voit ; longue liste : 20 d'abord,
      « Afficher les séances plus anciennes » ;
   F. sans programme : message clair, pas de « Noter ma séance », l'historique reste lisible ;
   G. coach : « Ses séances » de la fiche mène au journal du client (#/journal en consultation, « Son journal »), en
      lecture seule (ni formulaire ni champ, journal lu, perf jamais), aucune écriture (même forcée : refusée) ; hors
      fiche, pas d'onglet journal ;
   H. coach : calc comme avant (son compte, fiche de Thomas « Ses calories »), jamais calc_perso ; l'alerte d'écart
      (Mes clients) et le générateur de diète (« Ses repas ») lisent calc, jamais calc_perso ; v59 : fiche d'un prospect
      sans calc, « Ses calories » part de son calc_perso (complet et adulte), lu sans être écrit ; client sans calc,
      prospect avec calc, calc_perso mineur ou incomplet : départ d'avant ; v71 (D) : un prospect n'a plus de ligne
      dans Mes clients, sa fiche s'ouvre par Clients.ouvrir (ouvrirFiche) ;
   I. prospect inchangé (navigation, #/journal verrouillé avec son exemple et sans lecture, calculateur sur calc_perso,
      barre du bas) ;
   J. téléphone 390 px (barre du bas du client inchangée, « Plus », pas de débordement, bouton tactile) ;
   K. anglais ; v59 : Speed Formation (titres courts, objectifs et contenu des modules, « Goal: », « Your to-do list »,
      bouton de la vidéo, note du module 3 ; les challenges du module 5, pas encore traduits, restent en français, leur
      « Objectif : » compris) ; v60 (brief V2, J3 et J5) : objectif du module 1 réécrit (« Build the mindset that makes a
      transformation last. ») ; les 5 axes des challenges remplacés ont leur anglais (« Goal: » + objectif et défi
      anglais), les 10 autres restent entièrement en français (« Objectif : » compris) ;
   L. données piégées (journal et programme écrits hors de l'app) : aucune injection, aucune erreur, aucune écriture ;
   Z. aucun appel vers l'extérieur.
   Supabase simulé (gabarit de verif56, carte 6 §15) : rien ne part vers la vraie base (routage par NOM D'HÔTE, jamais
   par sous-chaîne) ; règles de la base reproduites (HANDOFF §2.3, v49) ; appelant reconnu à son jeton ; chaque écriture
   est appliquée en mémoire et notée, chaque lecture de « donnees » aussi. Dates relatives au lancement. Chaque bloc
   tourne à part (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif60.js ../index.html
           VERIF60_PORT=9761 node verif60.js ../index.html     (autre port, si 9760 est pris)
           VERIF60_BLOCS="B.,G." node verif60.js …              (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF60_PORT || 9760;
const BLOCS = (process.env.VERIF60_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
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
const PID = k => "00000000-0000-4000-8000-0000000060" + String(k).padStart(2, "0");   // verif60 : …60kk (une plage par suite)
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
  /* v56 : la connexion notée par la base (fonction noter_connexion, au démarrage d'un prospect ou d'un compte suivi) n'est
     pas une écriture de l'app dans les données : elle est testée à part (verif61) */
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
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

/* ---------- aides propres à cette suite ---------- */
const URL0 = `http://localhost:${PORT}/`;
const SARAH = qui(F.IDS.c2, "sarah@exemple.fr");
/* un client de plus (statut « client », questionnaire complet : pas d'arrivée forcée sur le Profil), et son navigateur */
const INTAKE_OK = Object.assign({}, INTAKE_THOMAS, { nom: "Client Essai" });
const CLIENT = (k, prenom, extra) => ({ id: PID(k), prenom, nom: "Essai", statut: "client", cree: avant(40 * J), email: "c" + k + "@exemple.fr", donnees: [["intake", INTAKE_OK]].concat(extra || []) });
const quiC = k => qui(PID(k), "c" + k + "@exemple.fr");
const deFixture = (uid, outil) => clone((F.donnees.find(d => d.user_id === uid && d.outil === outil) || {}).contenu);
const CALC_T = deFixture(F.IDS.c1, "calc"), JOURNAL_T = deFixture(F.IDS.c1, "journal"), PROG_T = deFixture(F.IDS.c1, "programme");
const contenuDe = (db, uid, outil) => (db.donnees.find(d => d.user_id === uid && d.outil === outil) || {}).contenu;
/* deux objets égaux, quel que soit l'ordre de leurs clés */
const memes = (a, b) => { const t = o => JSON.stringify(Object.keys(o || {}).sort().map(k => [k, o[k]])); return !!a && t(a) === t(b); };
/* les écritures de données, hors compteur de visites du prospect (clé activite) */
const saisies = db => ecrDonnees(db).filter(e => e.outil !== "activite");
const valeurs = page => page.evaluate(() => ["age", "taille", "poids", "pas", "heures"].map(i => (document.getElementById(i) || {}).value));
const sexeChoisi = page => page.$eval('#sexe [aria-pressed="true"]', x => x.dataset.v).catch(() => "");
const objectifChoisi = page => page.$eval('#objs [aria-pressed="true"]', x => x.dataset.k).catch(() => "");
const isoJ = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const jourIlYA = n => { const d = new Date(T0); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return isoJ(d); };
const frDate = s => s.slice(8, 10) + "/" + s.slice(5, 7) + "/" + s.slice(0, 4), usDate = s => s.slice(5, 7) + "/" + s.slice(8, 10) + "/" + s.slice(0, 4);
/* l'historique affiché : [nom, date] de chaque séance, dans l'ordre de la page */
const historique = page => page.$$eval("#jr-historique [data-jr-h]", l => l.map(x => [(x.querySelector("h3") || {}).textContent.replace(/\s+/g, " ").trim(), (x.querySelector(".pastille") || {}).textContent.trim()])).catch(() => []);
/* l'ordre attendu : date décroissante, puis la dernière enregistrée d'abord */
const attenduHist = (Jr, dt) => Jr.seances.map((x, i) => ({ x, i })).sort((a, b) => a.x.date < b.x.date ? 1 : a.x.date > b.x.date ? -1 : b.i - a.i).map(o => [o.x.nom, (dt || frDate)(o.x.date)]);
const valeurDe = (page, sel) => page.$eval(sel, e => e.value).catch(() => null);
/* v71 (D) : Mes clients ne liste plus les prospects ; un client s'ouvre toujours par son bouton « Ouvrir », un prospect (sans
   bouton [data-ouvrir]) par Clients.ouvrir, comme le fait la page Prospects ; nom : celui du compte (nomDe), "" sinon */
const nomDe = (db, id) => { const p = db.profils.find(x => x.id === id); return p ? ((p.prenom || "") + " " + (p.nom || "")).trim() : ""; };
async function ouvrirFiche(page, id, nom){
  await aller(page, "#/clients", 2000); await page.waitForSelector("#tb-clients [data-ouvrir]", { timeout: 8000 });
  if (await page.$(`[data-ouvrir="${id}"]`)) await page.click(`[data-ouvrir="${id}"]`);
  else await page.evaluate(([i, n]) => Clients.ouvrir(i, n, "accueil"), [id, nom || ""]);
  await page.waitForSelector("#vue .bandeau", { timeout: 8000 }); await attendre(page, 800);
}
const NAV_CLIENT = ["accueil", "programme", "journal", "nutrition", "mensurations", "calculateur", "suivi", "formation", "complements", "profil"];
const TXD = {
  avis: "Ces chiffres sont une estimation générale, pas un avis médical. Si tu as un doute sur ta santé, parles-en à un professionnel.",
  avis_en: "These numbers are a general estimate, not medical advice. If you have any doubt about your health, talk to a professional.",
  mineur: "Le calculateur est réservé aux adultes (18 ans et plus) : rien n'est enregistré.",
  mineur_en: "The calculator is for adults only (18 and over): nothing is saved.",
  retire: "Ce que tu avais enregistré ici a été retiré.",
  imc: "Ton poids est en dessous d'un poids de forme habituel pour ta taille. Viser une perte n'est pas l'objectif ici : parles-en d'abord à un professionnel de santé.",
  sans: "Ton coach n'a pas encore déposé ton programme : dès qu'il sera prêt, tu pourras noter tes séances ici.",
  sans_en: "Your coach hasn't added your program yet: once it's ready, you'll be able to log your workouts here.",
  vide: "Aucune séance notée pour le moment."
};
/* un prospect qui a validé les 3 questions et vu la page bilan (gabarit de verif56) */
const NOUVEAU = { probleme: "Perdre du gras", obstacle: "Le manque de temps avec le travail", projection: "Courir 10 km sans m'arrêter",
  objectif: "Perte de poids / sèche", objectif_auto: "Perte de poids / sèche", court_debut: avant(2 * H), court_le: avant(H), bilan_propose: { choix: "plus_tard", le: avant(MIN) } };

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF60_PORT=9761 node verif60.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. client Thomas : navigation =================== */
  await bloc("A. client Thomas : navigation", async () => {
    const db = base();
    const { c, page } = await contexte(b, THOMAS, db);
    await page.goto(URL0); await pret(page, "#acc-vue");
    const nav = await page.$$eval("#nav a", l => l.map(a => a.dataset.id));
    ok("ordinateur : navigation du client = accueil, programme, journal, nutrition, progression, calculateur, suivi, formation, compléments, profil (v53 : journal et calculateur en plus), aucun cadenas", JSON.stringify(nav) === JSON.stringify(NAV_CLIENT) && (await page.$$("#nav .nav-cadenas")).length === 0, JSON.stringify(nav));
    const noms = await page.$$eval('#nav a[data-id="journal"], #nav a[data-id="calculateur"]', l => l.map(a => a.textContent.replace(/\s+/g, " ").trim()));
    ok("… onglets « Mon journal » et « Calculateur »", JSON.stringify(noms) === '["Mon journal","Calculateur"]', JSON.stringify(noms));
    const vus = [];
    for (const h of ["#/calculateur", "#/journal", "#/entrainement"]) { await aller(page, h, 1600); vus.push([h, await ou(page), await texte(page, "#vue .masthead h1")]); }
    ok("#/calculateur et #/journal : ses pages, l'adresse gardée ; #/entrainement (l'outil du coach, clé perf) reste fermé : son accueil", vus[0][1].courant === "calculateur" && vus[0][1].hash === "#/calculateur" && vus[0][2] === "Calculateur métabolique"
      && vus[1][1].courant === "journal" && vus[1][1].hash === "#/journal" && vus[1][2] === "Ton journal d'entraînement" && vus[2][1].courant === "accueil" && vus[2][1].hash === "#/accueil", JSON.stringify(vus));
    ok("accueil, calculateur, journal : aucune écriture, perf jamais lu", db.ecritures.length === 0 && lu(db, "perf") === 0, resume(db));
    await c.close();
  });

  /* =================== B. calculateur du client : calc_perso, jamais calc =================== */
  await bloc("B. client Thomas : calculateur sur calc_perso, jamais calc", async () => {
    const db = base(), ID = F.IDS.c1;
    const { c, page } = await contexte(b, THOMAS, db);
    await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 1200);
    const v0 = await valeurs(page);
    ok("départ : le calcul préparé par son coach (calc), lu : 32 ans, 180 cm, 83 kg, 8 000 pas, 5 h, homme, objectif perte", JSON.stringify(v0) === '["32","180","83","8000","5"]' && (await sexeChoisi(page)) === "H" && (await objectifChoisi(page)) === "perte" && lu(db, "calc") >= 1, JSON.stringify(v0));
    ok("… son calculateur à lui (mention « pas un avis médical », bouton « Enregistrer mes chiffres ») ; à l'ouverture, rien d'écrit (ni calc_perso, ni calc)", (await texte(page, "#calc-avis")) === TXD.avis && await page.isVisible("#calc-ok") && saisies(db).length === 0, resume(db));
    await page.click("#calc-ok"); await attendre(page, 1400);
    ok("« Enregistrer mes chiffres » : calc_perso écrit chez lui (les mêmes chiffres), calc jamais écrit, le calc du coach intact", memes(contenuDe(db, ID, "calc_perso"), CALC_T) && ecr(db, "calc").length === 0 && memes(contenuDe(db, ID, "calc"), CALC_T), resume(db));
    await page.fill("#poids", "81"); await attendre(page, 1400);
    ok("poids 81 kg : calc_perso suit (81 kg), calc reste celui du coach (83 kg), toujours jamais écrit", (contenuDe(db, ID, "calc_perso") || {}).poids === 81 && contenuDe(db, ID, "calc").poids === 83 && ecr(db, "calc").length === 0, resume(db));
    const att = await page.evaluate(() => { const d = { sexe: "H", age: 32, taille: 180, poids: 81, pas: 8000, heures: 5 }; return Math.round(outilCalculateur.metabolismeDeBase(d) * outilCalculateur.facteurActivite(d).total); });
    ok("… mêmes formules que le coach : maintenance " + att + " kcal", (await texte(page, "#tdee")).replace(/\D/g, "") === String(att), await texte(page, "#tdee"));
    const n0 = ecr(db, "calc_perso", ID).length;
    await page.reload(); await pret(page, "#tdee"); await attendre(page, 1400);
    ok("rechargé : ses chiffres à lui reviennent (calc_perso : 81 kg, pas les 83 kg du coach), rien de réécrit", (await valeurs(page))[2] === "81" && ecr(db, "calc_perso", ID).length === n0 && !(await page.isVisible("#calc-ok")), JSON.stringify(await valeurs(page)));
    ok("tout le bloc : le client n'a écrit que calc_perso, chez lui ; calc jamais (ni chez lui, ni chez personne), aucun refus de la base", saisies(db).length >= 2 && saisies(db).every(e => e.table === "donnees" && e.outil === "calc_perso" && e.user_id === ID) && ecr(db, "calc").length === 0 && db.refus.length === 0, resume(db));
    await c.close();
  });

  /* =================== C. garde-fous 18 ans et IMC (client) =================== */
  await bloc("C. client : garde-fou 18 ans et IMC", async () => {
    const db = base(), ID = F.IDS.c1;
    const { c, page } = await contexte(b, THOMAS, db);
    await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 1200);
    await page.fill("#age", "17"); await page.press("#age", "Tab"); await attendre(page, 1500);
    ok("âge 17 : « réservé aux adultes (18 ans et plus) : rien n'est enregistré », aucun chiffre, rien d'écrit (ni calc_perso, ni calc)", (await texte(page, "#calc-etat")) === TXD.mineur && (await texte(page, "#tdee")) === "—" && saisies(db).length === 0, await texte(page, "#calc-etat") + " " + resume(db));
    await page.fill("#age", "30"); await attendre(page, 1400);
    ok("âge 30 : enregistré dans calc_perso", (contenuDe(db, ID, "calc_perso") || {}).age === 30, resume(db));
    await page.fill("#age", "16"); await page.press("#age", "Tab"); await attendre(page, 1500);
    ok("âge 16 ensuite : ce que ce formulaire avait enregistré est retiré (calc_perso vide) et il le dit ; aucune écriture n'a porté un âge mineur", JSON.stringify(contenuDe(db, ID, "calc_perso")) === "{}" && (await texte(page, "#calc-etat")) === TXD.mineur + " " + TXD.retire && ecr(db, "calc_perso").every(e => !(e.contenu && typeof e.contenu.age === "number" && e.contenu.age < 18)), JSON.stringify(contenuDe(db, ID, "calc_perso")) + " " + await texte(page, "#calc-etat"));
    ok("… le calc du coach n'est jamais touché (ni écrit, ni vidé)", ecr(db, "calc").length === 0 && memes(contenuDe(db, ID, "calc"), CALC_T), resume(db));
    await page.fill("#age", "30"); await page.fill("#poids", "55"); await attendre(page, 1500);   // IMC 17
    ok("IMC 17 (< 18,5) : pas d'objectif de perte proposé, maintien, la phrase de prudence", !(await page.isVisible('#objs [data-k="perte"]')) && (await objectifChoisi(page)) === "maintien" && (await texte(page, "#calc-imc")) === TXD.imc, await texte(page, "#calc-imc"));
    ok("… enregistré en maintien dans calc_perso (jamais en perte), calc toujours intact", (contenuDe(db, ID, "calc_perso") || {}).objectif === "maintien" && (contenuDe(db, ID, "calc_perso") || {}).poids === 55 && ecr(db, "calc").length === 0 && memes(contenuDe(db, ID, "calc"), CALC_T), JSON.stringify(contenuDe(db, ID, "calc_perso")));
    await c.close();
  });

  /* =================== D. client sans calc du coach ; restauration =================== */
  await bloc("D. client sans calcul du coach, restauration d'une sauvegarde", async () => {
    const db = base(), ID = F.IDS.c2;
    const { c, page } = await contexte(b, SARAH, db);
    await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 1200);
    const v = await valeurs(page);
    ok("Sarah (aucun calc préparé par le coach) : départ depuis son questionnaire (29 ans, 165 cm, 68,2 kg, 6 000 pas, 4 séances → 5 h, femme), rien d'écrit sans son accord", JSON.stringify(v) === '["29","165","68.2","6000","5"]' && (await sexeChoisi(page)) === "F" && await page.isVisible("#calc-ok") && saisies(db).length === 0, JSON.stringify(v) + " " + resume(db));
    await aller(page, "#/profil", 1500);
    const r = await page.evaluate(async () => {
      try { await Store.importer(JSON.stringify({ plateforme: "mhx", version: 2, donnees: {
        calc: { sexe: "F", age: 40, taille: 150, poids: 90, pas: 2000, heures: 0, objectif: "prise" },
        calc_perso: { sexe: "F", age: 29, taille: 165, poids: 67, pas: 6000, heures: 5, objectif: "perte" } } })); return "ok"; }
      catch (e) { return String(e && e.message); }
    });
    await attendre(page, 1200);
    ok("restauration d'une sauvegarde par le client : calc (la clé du coach) jamais restauré, calc_perso (la sienne) restauré", r === "ok" && ecr(db, "calc").length === 0 && !contenuDe(db, ID, "calc") && (contenuDe(db, ID, "calc_perso") || {}).poids === 67 && saisies(db).every(e => e.outil === "calc_perso"), r + " " + resume(db));
    await c.close();
  });

  /* =================== E. « Mon journal » du client =================== */
  await bloc("E. client Thomas : Mon journal", async () => {
    const db = base(), ID = F.IDS.c1;
    const { c, page } = await contexte(b, THOMAS, db);
    await page.goto(URL0 + "#/journal"); await pret(page, "#jr-historique"); await attendre(page, 600);
    const h = await historique(page);
    ok("#/journal : ses 10 séances notées, les plus récentes d'abord (nom, date)", h.length === 10 && JSON.stringify(h) === JSON.stringify(attenduHist(JOURNAL_T)) && (await texte(page, "#jr-nb")) === "10", JSON.stringify(h));
    const detail = await page.$$eval("#jr-historique [data-jr-h]", l => Array.from(l[0].querySelectorAll("li")).map(li => [li.querySelector("span").textContent.trim(), li.querySelector("b").textContent.trim()])).catch(() => []);
    ok("… chaque séance avec ses exercices et ses séries (la plus récente : Soulevé de terre roumain, 10 × 62,5 kg · 10 × 62,5 kg)", JSON.stringify(detail) === JSON.stringify([["Soulevé de terre roumain", "10 × 62,5 kg · 10 × 62,5 kg"]]), JSON.stringify(detail));
    const sc = await page.$$eval("#jr-noter .seance-c", l => l.map(s => [s.querySelector("h2").textContent.trim(), (s.querySelector("[data-jr-ouvrir]") || {}).textContent, !!s.querySelector("[data-jr-form][hidden]")]));
    ok("« Mes séances du programme » : ses 4 séances, chacune avec « Noter ma séance » (formulaire replié)", JSON.stringify(sc) === JSON.stringify(PROG_T.seances.map(s => [s.nom, "Noter ma séance", true])), JSON.stringify(sc));
    ok("à l'affichage : aucune écriture ; son programme et son journal sont lus", db.ecritures.length === 0 && lu(db, "journal") >= 1 && lu(db, "programme") >= 1, resume(db));
    /* noter la séance D (jamais notée) : Wall angels, 2 séries */
    await page.click('[data-jr-ouvrir="3"]'); await attendre(page, 300);
    await page.fill('#jr-seance-3 [data-jr-ex="1"] [data-r="0"]', "10"); await page.fill('#jr-seance-3 [data-jr-ex="1"] [data-r="1"]', "12");
    await page.click('[data-jr-fin="3"]'); await attendre(page, 1600);
    const J2 = contenuDe(db, ID, "journal") || { seances: [] }, der = J2.seances[J2.seances.length - 1] || {};
    ok("« Noter ma séance » (Séance D) puis « Séance terminée » : la séance s'ajoute à son journal (date du jour, 4e séance du programme, séries notées)", der.date === isoJ(new Date()) && der.si === 3 && der.nom === PROG_T.seances[3].nom && JSON.stringify(der.exos) === JSON.stringify([{ nom: "Wall angels", series: [{ r: 10, c: 0 }, { r: 12, c: 0 }] }]), JSON.stringify(der));
    ok("… zéro perte : ses 10 séances d'avant intactes ; seule la clé journal est écrite, une fois, chez lui", J2.seances.length === 11 && JSON.stringify(J2.seances.slice(0, 10)) === JSON.stringify(JOURNAL_T.seances) && saisies(db).length === 1 && saisies(db)[0].outil === "journal" && saisies(db)[0].user_id === ID, resume(db));
    const h2 = await historique(page);
    ok("… l'historique la montre tout de suite (11 séances, même ordre), « Séance enregistrée. Bravo ! », la séance D passe « notée le … »", JSON.stringify(h2) === JSON.stringify(attenduHist(J2)) && (await texte(page, "#jr-ok-3")) === "Séance enregistrée. Bravo !" && (await texte(page, "#jr-seance-3 .seance-c-tete .pastille")) === "✓ notée le " + frDate(isoJ(new Date())), JSON.stringify(h2.slice(0, 3)) + " · " + await texte(page, "#jr-ok-3") + " · " + await texte(page, "#jr-seance-3 .seance-c-tete .pastille"));
    await aller(page, "#/programme", 1800);
    ok("« Mon programme » voit la même séance notée (même clé journal) ; toujours une seule écriture", (await texte(page, "#seance-3 .seance-c-tete .pastille")) === "✓ notée le " + frDate(isoJ(new Date())) && saisies(db).length === 1, await texte(page, "#seance-3 .seance-c-tete .pastille"));
    await c.close();
  });

  await bloc("E. client : longue liste, « Afficher les séances plus anciennes »", async () => {
    const L = { seances: Array.from({ length: 25 }, (_, i) => ({ date: jourIlYA(60 - 2 * i), si: 0, nom: "Séance " + (i + 1), exos: [{ nom: "Pompes", series: [{ r: 10 + (i % 3), c: 0 }] }] })) };
    const db = base({ comptes: [CLIENT(2, "Hugo", [["journal", L]])] });
    const { c, page } = await contexte(b, quiC(2), db);
    await page.goto(URL0 + "#/journal"); await pret(page, "#jr-historique"); await attendre(page, 500);
    const h = await historique(page);
    ok("25 séances : les 20 plus récentes d'abord (« Séance 25 » en tête), le total (25) et « Afficher les séances plus anciennes »", h.length === 20 && h[0][0] === "Séance 25" && h[19][0] === "Séance 6" && (await texte(page, "#jr-nb")) === "25" && (await texte(page, "#jr-plus")) === "Afficher les séances plus anciennes", JSON.stringify([h.length, h[0], h[19]]));
    await page.click("#jr-plus"); await attendre(page, 400);
    const h2 = await historique(page);
    ok("… un clic : les 25, jusqu'à la plus ancienne (« Séance 1 »), plus de bouton ; aucune écriture", h2.length === 25 && h2[24][0] === "Séance 1" && !(await page.$("#jr-plus")) && db.ecritures.length === 0, JSON.stringify([h2.length, h2[24]]) + " " + resume(db));
    await c.close();
  });

  /* =================== F. sans programme =================== */
  await bloc("F. client sans programme : message clair", async () => {
    const S1 = { seances: [{ date: jourIlYA(3), si: 0, nom: "Séance A", exos: [{ nom: "Pompes", series: [{ r: 12, c: 0 }, { r: 10, c: 0 }] }] }] };
    const db = base({ cles: [[F.IDS.c2, "journal", S1]], comptes: [CLIENT(3, "Hugo")] });
    let { c, page } = await contexte(b, SARAH, db);
    await page.goto(URL0 + "#/journal"); await pret(page, "#jr-historique"); await attendre(page, 500);
    const d = await page.$$eval("#jr-historique [data-jr-h] li", l => l.map(li => [li.querySelector("span").textContent.trim(), li.querySelector("b").textContent.trim()])).catch(() => []);
    ok("Sarah (aucun programme) : « " + TXD.sans + " », aucun « Noter ma séance »", (await texte(page, "#jr-sans-programme")) === TXD.sans && !(await page.$("#vue [data-jr-ouvrir], #vue [data-jr-place], #vue [data-jr-form]")), await texte(page, "#jr-sans-programme"));
    ok("… ses séances déjà notées restent lisibles (Séance A : Pompes, 12 reps · 10 reps)", JSON.stringify(await historique(page)) === JSON.stringify([["Séance A", frDate(S1.seances[0].date)]]) && JSON.stringify(d) === '[["Pompes","12 reps · 10 reps"]]', JSON.stringify(d));
    await c.close();
    ({ c, page } = await contexte(b, quiC(3), db));
    await page.goto(URL0 + "#/journal"); await pret(page, "#jr-historique"); await attendre(page, 500);
    ok("Hugo (ni programme, ni séance) : le message, puis « " + TXD.vide + " » ; aucune écriture", (await texte(page, "#jr-sans-programme")) === TXD.sans && (await texte(page, "#jr-historique .empty")) === TXD.vide && !(await page.$("#jr-nb")) && db.ecritures.length === 0, (await texte(page, "#jr-historique")) + " " + resume(db));
    await c.close();
  });

  /* =================== G. coach : « Ses séances » → le journal du client =================== */
  await bloc("G. coach : « Ses séances » → le journal du client, en lecture seule", async () => {
    const db = base();
    const { c, page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/tableau"); await pret(page); await attendre(page, 800);
    const navCoach = await page.$$eval("#nav a", l => l.map(a => a.dataset.id));
    await aller(page, "#/journal", 1500); const hors = await ou(page);
    ok("coach hors fiche : pas d'onglet journal ; #/journal → son tableau de bord", !navCoach.includes("journal") && hors.courant === "tableau", JSON.stringify(navCoach) + " " + JSON.stringify(hors));
    await ouvrirFiche(page, F.IDS.c1);
    const actions = await page.$$eval("#vue .bandeau-actions a", l => l.map(a => [a.textContent.trim(), a.getAttribute("href")]));
    ok("fiche de Thomas : « Ses séances » → #/journal (plus #/entrainement), « Ses calories » → #/calculateur", actions.some(([t, hr]) => t === "Ses séances" && hr === "#/journal") && !actions.some(([, hr]) => hr === "#/entrainement") && actions.some(([t, hr]) => t === "Ses calories" && hr === "#/calculateur"), JSON.stringify(actions));
    const navF = await page.$$eval("#nav a", l => l.map(a => [a.dataset.id, a.textContent.replace(/\s+/g, " ").trim()]));
    const iJ = navF.findIndex(x => x[0] === "journal");
    ok("… sa navigation (fiche) : « Son journal » juste après « Son programme »", iJ > 0 && navF[iJ][1] === "Son journal" && navF[iJ - 1][0] === "programme", JSON.stringify(navF.map(x => x[0])));
    const L0 = db.lectures.length;
    await page.click('#vue .bandeau-actions a[href="#/journal"]'); await attendre(page, 1800);
    const etat = await page.evaluate(() => ({ consulte: Store.idConsulte, hash: location.hash, courant, lecture: $("vue").classList.contains("lecture-seule"), h1: ($("vue").querySelector(".masthead h1") || {}).textContent }));
    const h = await historique(page);
    ok("clic « Ses séances » : #/journal dans sa fiche (« Son journal », lecture seule) : ses 10 séances, les plus récentes d'abord", etat.consulte === F.IDS.c1 && etat.hash === "#/journal" && etat.courant === "journal" && etat.lecture && etat.h1 === "Son journal" && JSON.stringify(h) === JSON.stringify(attenduHist(JOURNAL_T)), JSON.stringify(etat) + " " + JSON.stringify(h.slice(0, 2)));
    const champs = await page.$$eval("#vue .masthead ~ * input, #vue .masthead ~ * textarea, #vue .masthead ~ * select, #vue [data-jr-ouvrir], #vue [data-jr-fin], #vue [data-jr-place], #jr-noter *", l => l.length);
    ok("… ni « Noter ma séance », ni champ, ni formulaire : l'historique seul ; lu chez Thomas : son journal (jamais perf)", champs === 0 && db.lectures.slice(L0).some(x => x.uid === F.IDS.c1 && x.outil === "eq.journal") && lu(db, "perf", L0) === 0, champs + " · " + JSON.stringify(db.lectures.slice(L0).map(x => x.outil)));
    await attendre(page, 800);
    const force = await page.evaluate(() => Store.ecrire("journal", { seances: [] }));
    await attendre(page, 1200);
    ok("… aucune écriture ; même forcée depuis la page, une écriture du journal est refusée en consultation", force === false && db.ecritures.length === 0 && JSON.stringify(contenuDe(db, F.IDS.c1, "journal")) === JSON.stringify(JOURNAL_T), String(force) + " " + resume(db));
    await c.close();
  });

  /* =================== H. coach : calc comme avant =================== */
  await bloc("H. coach : calc comme avant, générateur de diète et alerte d'écart inchangés", async () => {
    const PERSO_T = { sexe: "H", age: 50, taille: 170, poids: 60, pas: 3000, heures: 1, objectif: "prise" };   // loin de son questionnaire
    const CALC_S = { sexe: "F", age: 29, taille: 165, poids: 68.2, pas: 7000, heures: 4, objectif: "perte" };
    const PERSO_S = { sexe: "F", age: 29, taille: 165, poids: 90, pas: 15000, heures: 10, objectif: "prise" };
    const CALC_J = { sexe: "H", age: 41, taille: 176, poids: 70, pas: 8000, heures: 3, objectif: "perte" };   // Julien : 91,2 kg au questionnaire
    const db = base({ cles: [[F.IDS.c1, "calc_perso", PERSO_T], [F.IDS.c2, "calc", CALC_S], [F.IDS.c2, "calc_perso", PERSO_S], [F.IDS.c3, "calc", CALC_J]] });
    const { c, page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 1000);
    ok("coach, son compte : son calculateur d'avant (âge dès 14 ans, sans les garde-fous ni la mention du client)", await page.$eval("#age", x => x.min === "14") && !(await page.$("#calc-etat, #calc-avis, #calc-imc, #calc-ok")), "");
    await page.fill("#poids", "81"); await attendre(page, 1400);
    ok("… il écrit calc chez lui, jamais calc_perso", ecr(db, "calc", F.IDS.coach).length >= 1 && ecr(db, "calc_perso").length === 0, resume(db));
    await aller(page, "#/clients", 2400);
    const ligne = id => page.$eval(`[data-ouvrir="${id}"]`, bt => bt.closest("tr").textContent.replace(/\s+/g, " ")).catch(() => "");
    const lT = await ligne(F.IDS.c1), lJ = await ligne(F.IDS.c3);
    ok("Mes clients : l'alerte d'écart lit calc, jamais calc_perso (Thomas : pas de « chiffres à vérifier » malgré un calc_perso très loin ; Julien, calc loin de son questionnaire : l'alerte)", lT.includes("Thomas") && !/chiffres à vérifier/.test(lT) && /chiffres à vérifier/.test(lJ), lT.slice(0, 120) + " | " + lJ.slice(0, 120));
    await ouvrirFiche(page, F.IDS.c1); await aller(page, "#/calculateur", 1800);
    ok("fiche de Thomas, « Ses calories » : son calc (celui du coach) en départ, pas son calc_perso", JSON.stringify(await valeurs(page)) === '["32","180","83","8000","5"]', JSON.stringify(await valeurs(page)));
    const n0 = ecr(db, "calc", F.IDS.c1).length;
    await page.fill("#heures", "6"); await attendre(page, 1400);
    ok("… le coach écrit calc chez Thomas (comme avant), jamais calc_perso ; son calc_perso intact", ecr(db, "calc", F.IDS.c1).length === n0 + 1 && ecr(db, "calc", F.IDS.c1).slice(-1)[0].contenu.heures === 6 && ecr(db, "calc_perso").length === 0 && memes(contenuDe(db, F.IDS.c1, "calc_perso"), PERSO_T), resume(db));
    await ouvrirFiche(page, F.IDS.c2); await aller(page, "#/nutrition", 2400);
    const kc = await page.evaluate(([a, p]) => { const k = d => { const T = outilCalculateur.metabolismeDeBase(d) * outilCalculateur.facteurActivite(d).total; return Math.round(d.objectif === "perte" ? T * (1 - CONFIG.calcul.deficit_perte) : d.objectif === "prise" ? T * (1 + CONFIG.calcul.surplus_prise) : T); }; return [k(a), k(p)]; }, [CALC_S, PERSO_S]);
    const vk = await valeurDe(page, "#nu-kcal");
    ok("générateur de diète (fiche de Sarah, « Ses repas ») : calories visées calculées sur son calc (" + kc[0] + " kcal), jamais sur son calc_perso (" + kc[1] + " kcal)", vk === String(kc[0]) && kc[0] !== kc[1], vk + " / " + JSON.stringify(kc));
    await c.close();
  });

  /* v59 (lot E, remarque c de la relecture v52) : fiche d'un PROSPECT qui n'a pas de calc (le coach ne lui a encore rien
     calculé) : « Ses calories » part de son propre calcul (calc_perso, complet et adulte), lu sans rien écrire ; avant, le
     coach voyait des valeurs inventées (homme, 25 ans, 178 cm, 80 kg…). Rien ne change pour un client sans calc (son
     questionnaire), un compte qui a un calc (son calc), un calc_perso mineur ou incomplet (départ d'avant). */
  await bloc("H. coach : « Ses calories » d'un prospect sans calc", async () => {
    const CP = { sexe: "F", age: 30, taille: 165, poids: 60, pas: 6000, heures: 3, objectif: "perte" };
    const CC = { sexe: "H", age: 41, taille: 181, poids: 88, pas: 9000, heures: 4, objectif: "maintien" };
    const PERSO_S = { sexe: "H", age: 50, taille: 170, poids: 60, pas: 3000, heures: 1, objectif: "prise" };
    const pr = (k, prenom, donnees) => ({ id: PID(k), prenom, nom: "Essai", statut: "prospect", cree: avant(2 * J), email: "p" + k + "@exemple.fr", donnees: [["intake", NOUVEAU]].concat(donnees) });
    const db = base({ comptes: [pr(10, "Léa", [["calc_perso", CP]]), pr(11, "Inès", [["calc_perso", Object.assign({}, CP, { age: 16 })]]), pr(12, "Paul", [["calc_perso", { sexe: "H", age: 40, poids: 80 }]]), pr(13, "Marc", [["calc", CC], ["calc_perso", CP]])],
      cles: [[F.IDS.c2, "calc_perso", PERSO_S]] });
    const { c, page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/tableau"); await pret(page); await attendre(page, 600);
    /* v71 (D) : les quatre prospects n'ont plus de ligne dans Mes clients : ouvrirFiche passe par Clients.ouvrir, avec leur nom */
    const calories = async id => { await ouvrirFiche(page, id, nomDe(db, id)); await aller(page, "#/calculateur", 1800); return { v: JSON.stringify(await valeurs(page)), s: await sexeChoisi(page), o: await objectifChoisi(page), note: await page.isVisible("#calc-depart").catch(() => false) }; };
    const r1 = await calories(PID(10));
    ok("fiche d'un prospect sans calc, « Ses calories » : départ = son propre calcul (calc_perso : 30 ans, 165 cm, 60 kg, 6 000 pas, 3 h, femme, perte), la note « Départ : son propre calcul » affichée",
      r1.v === '["30","165","60","6000","3"]' && r1.s === "F" && r1.o === "perte" && r1.note && (await texte(page, "#calc-depart")).startsWith("Départ : son propre calcul"), JSON.stringify(r1));
    ok("… à l'ouverture, rien d'écrit chez lui (ni calc, ni calc_perso)", saisies(db).length === 0, resume(db));
    await page.fill("#heures", "4"); await attendre(page, 1400);
    const e1 = ecr(db, "calc", PID(10));
    ok("… un champ touché : le coach écrit calc chez le prospect (ses chiffres, 4 h), jamais calc_perso ; son calc_perso intact", e1.length === 1 && memes(e1[0].contenu, Object.assign({}, CP, { heures: 4 })) && ecr(db, "calc_perso").length === 0 && memes(contenuDe(db, PID(10), "calc_perso"), CP), resume(db) + " " + JSON.stringify(e1.map(e => e.contenu)));
    const r2 = await calories(PID(11)), r3 = await calories(PID(12));
    const avant59 = '["25","178","80","10000","10"]';   // CONFIG.calcul.valeurs_depart : le questionnaire court n'a ni âge, ni taille, ni poids
    ok("prospect au calc_perso mineur (16 ans) ou incomplet : départ d'avant (valeurs de départ, objectif de sa réponse), note cachée", r2.v === avant59 && r3.v === avant59 && r2.o === "perte" && !r2.note && !r3.note, JSON.stringify([r2, r3]));
    const r4 = await calories(PID(13));
    ok("prospect qui a déjà un calc (préparé par le coach) : son calc, pas son calc_perso ; note cachée", r4.v === '["41","181","88","9000","4"]' && r4.s === "H" && r4.o === "maintien" && !r4.note, JSON.stringify(r4));
    const r5 = await calories(F.IDS.c2);
    ok("client sans calc (Sarah) : départ depuis son questionnaire comme avant (29 ans, 165 cm, 68,2 kg, 5 h ; pas : 10 000, la valeur de départ du coach), jamais son calc_perso ; note cachée", r5.v === '["29","165","68.2","10000","5"]' && r5.s === "F" && !r5.note, JSON.stringify(r5));
    ok("tout le bloc : seule écriture, le calc du premier prospect (champ touché) ; aucun refus de la base", saisies(db).length === 1 && db.refus.length === 0, resume(db));
    await c.close();
  });

  /* =================== I. prospect inchangé =================== */
  await bloc("I. prospect inchangé", async () => {
    const ID = PID(1);
    const db = base({ comptes: [{ id: ID, prenom: "Léa", nom: "Martin", cree: avant(2 * J), email: "p1@exemple.fr", donnees: [["intake", NOUVEAU]] }] });
    let { c, page } = await contexte(b, qui(ID, "p1@exemple.fr"), db);
    await page.goto(URL0); await pret(page, "#vue"); await attendre(page, 1200);
    const nav = await page.$$eval("#nav a", l => l.map(a => a.dataset.id + (a.querySelector(".nav-cadenas") ? "🔒" : "")));
    ok("prospect (ordinateur) : navigation de la v52 (journal dans la vitrine, verrouillé ; calculateur ouvert)", JSON.stringify(nav) === JSON.stringify(["accueil", "programme🔒", "journal🔒", "nutrition🔒", "mensurations", "calculateur", "suivi🔒", "formation", "profil"]), JSON.stringify(nav));
    const L0 = db.lectures.length;
    await aller(page, "#/journal", 1600);
    ok("#/journal : toujours la page verrouillée avec son exemple (rien de l'onglet du client), aucune clé lue", !!(await page.$("#vue #ech-journal.echantillon")) && !!(await page.$("#vue .verrou")) && !(await page.$("#jr-vue")) && db.lectures.slice(L0).filter(l => l.outil !== "eq.challenge").length === 0, JSON.stringify(db.lectures.slice(L0).map(l => l.outil)));
    await aller(page, "#/calculateur", 1600);
    ok("#/calculateur : son calculateur (calc_perso, garde-fous), rien d'écrit à l'ouverture", !!(await page.$("#calc-etat")) && (await texte(page, "#calc-avis")) === TXD.avis && saisies(db).length === 0, resume(db));
    await c.close();
    ({ c, page } = await contexte(b, qui(ID, "p1@exemple.fr"), db, { viewport: MOBILE }));
    await page.goto(URL0); await pret(page, "#vue"); await attendre(page, 1000);
    ok("prospect (téléphone) : barre du bas inchangée (Accueil, Calculateur, Progression, Speed Formation + Plus)", JSON.stringify(await page.$$eval("#barre-bas a[data-id]", l => l.map(a => a.dataset.id))) === '["accueil","calculateur","mensurations","formation"]' && !!(await page.$("#barre-bas [data-plus]")), "");
    await c.close();
  });

  /* =================== J. téléphone 390 px =================== */
  await bloc("J. client Thomas : téléphone 390 px", async () => {
    const db = base();
    const { c, page } = await contexte(b, THOMAS, db, { viewport: MOBILE });
    await page.goto(URL0); await pret(page, "#acc-vue");
    ok("barre du bas du client inchangée : Accueil, Programme, Nutrition, Progression (+ Plus)", JSON.stringify(await page.$$eval("#barre-bas a[data-id]", l => l.map(a => a.dataset.id))) === '["accueil","programme","nutrition","mensurations"]' && !!(await page.$("#barre-bas [data-plus]")), "");
    await page.click("#barre-bas [data-plus]"); await attendre(page, 500);
    const plus = await page.$$eval(".menu-plus a", l => l.map(a => [a.dataset.id, a.textContent.replace(/\s+/g, " ").trim()]));
    ok("« Plus » : Mon journal et le Calculateur, puis le reste (suivi, formation, compléments, profil)", JSON.stringify(plus.map(x => x[0])) === '["journal","calculateur","suivi","formation","complements","profil"]' && plus[0][1] === "Mon journal" && plus[1][1] === "Calculateur", JSON.stringify(plus));
    await page.click('.menu-plus a[data-id="journal"]'); await attendre(page, 1800);
    const bt = await page.$eval('[data-jr-ouvrir="0"]', x => x.getBoundingClientRect().height).catch(() => 0);
    ok("#/journal (depuis « Plus ») : sans débordement horizontal, « Plus » marqué, bouton « Noter ma séance » tactile (" + Math.round(bt) + " px)", (await ou(page)).courant === "journal" && !(await deborde(page)) && await page.$eval("#barre-bas [data-plus]", x => x.classList.contains("ici")) && bt >= 40, (await largeur(page)) + " · " + bt);
    await page.click('[data-jr-ouvrir="0"]'); await attendre(page, 400);
    ok("… formulaire de la séance ouvert : toujours sans débordement", await page.isVisible("#jr-seance-0 [data-jr-form]") && !(await deborde(page)), await largeur(page));
    await aller(page, "#/calculateur", 1800);
    ok("#/calculateur : sans débordement horizontal ; rien d'écrit dans tout le bloc", (await ou(page)).courant === "calculateur" && !(await deborde(page)) && db.ecritures.length === 0, (await largeur(page)) + " " + resume(db));
    await c.close();
  });

  /* =================== K. anglais =================== */
  await bloc("K. anglais", async () => {
    const db = base(); avecEn(db, F.IDS.c1); avecEn(db, F.IDS.c2);
    let { c, page } = await contexte(b, THOMAS, db, { langue: "en" });
    await page.goto(URL0 + "#/journal"); await pret(page, "#jr-historique"); await attendre(page, 900);
    const t = await page.evaluate(() => ({ h2: Array.from(document.querySelectorAll("#jr-vue h2")).map(x => x.textContent.replace(/\s+/g, " ").trim()), intro: (document.querySelector("#jr-noter .note") || {}).textContent, hist: (document.querySelector("#jr-historique .note") || {}).textContent, boutons: Array.from(document.querySelectorAll("[data-jr-ouvrir]")).map(x => x.textContent.trim()), h1: (document.querySelector("#vue .masthead h1") || {}).textContent, nav: Array.from(document.querySelectorAll('#nav a[data-id="journal"], #nav a[data-id="calculateur"]')).map(a => a.textContent.replace(/\s+/g, " ").trim()) }));
    const h = await historique(page);
    ok("anglais, #/journal : « My program workouts », « My logged workouts », « Most recent first. », « Log my workout », dates au format américain ; onglets « My training log » et « Calculator »", t.h2[0] === "My program workouts" && t.h2[t.h2.length - 1].startsWith("My logged workouts") && norm(t.intro) === "Pick the workout you just did and log your reps and weights, set by set." && norm(t.hist) === "Most recent first." && t.boutons.length === 4 && t.boutons.every(x => x === "Log my workout") && JSON.stringify(t.nav) === '["My training log","Calculator"]' && JSON.stringify(h) === JSON.stringify(attenduHist(JOURNAL_T, usDate)), JSON.stringify(t) + " " + JSON.stringify(h.slice(0, 1)));
    await aller(page, "#/calculateur", 1800);
    ok("anglais, #/calculateur : « Save my numbers », « not medical advice »", (await texte(page, "#calc-ok")) === "Save my numbers" && (await texte(page, "#calc-avis")) === TXD.avis_en, (await texte(page, "#calc-ok")) + " · " + await texte(page, "#calc-avis"));
    await page.fill("#age", "17"); await page.press("#age", "Tab"); await attendre(page, 900);
    ok("anglais : âge 17 → « The calculator is for adults only (18 and over): nothing is saved. », rien d'écrit", (await texte(page, "#calc-etat")) === TXD.mineur_en && saisies(db).length === 0, await texte(page, "#calc-etat"));
    await c.close();
    ({ c, page } = await contexte(b, SARAH, db, { langue: "en" }));
    await page.goto(URL0 + "#/journal"); await pret(page, "#jr-historique"); await attendre(page, 900);
    ok("anglais, sans programme : « " + TXD.sans_en + " » puis « No workouts logged yet. »", (await texte(page, "#jr-sans-programme")) === TXD.sans_en && (await texte(page, "#jr-historique .empty")) === "No workouts logged yet.", (await texte(page, "#jr-sans-programme")) + " · " + await texte(page, "#jr-historique .empty"));
    await c.close();
    /* v59 (lot E, remarque b de la relecture v52) : la Speed Formation en anglais — titres courts (la carte retire
       « Module n — »), objectifs, contenu des modules, note du module 3, « Goal: », « Your to-do list », bouton de la vidéo.
       Traductions du cours écrites par Claude (I18N.en, bloc « v59 — Speed Formation ») ; tâches, défis et leçons : plus tard */
    /* v60 (brief V2, J3) : objectif du module 1 réécrit (« …pour garantir une transformation durable » retiré) */
    const CARTES_EN = [["m0", "Introduction", "Lay the foundations and set expectations."], ["m1", "Mindset", "Build the mindset that makes a transformation last."],
      ["m2", "Nutrition", "Keep nutrition simple to get results without frustration."], ["m3", "Training", "Get training that fits you, whatever your level."],
      ["m4", "Organization", "Organize your days to make the most progress."], ["m5", "Challenges", "Push past your limits to progress faster."], ["m6", "Boosters and resources", "Extra resources to boost your results."]];
    ({ c, page } = await contexte(b, THOMAS, db, { langue: "en" }));
    await page.goto(URL0 + "#/formation"); await pret(page, ".fo-tete"); await attendre(page, 900);
    const cartes = await page.$$eval(".fo-tete", l => l.map(x => [x.dataset.mod, (x.querySelector(".fo-nom") || {}).textContent.replace(/\s+/g, " ").trim(), (x.querySelector(".fo-obj-court") || {}).textContent.replace(/\s+/g, " ").trim()]));
    ok("anglais, Speed Formation : les 7 cartes des modules avec leur titre court et leur objectif en anglais (Nutrition, Training… ; « Lay the foundations and set expectations. »…)", JSON.stringify(cartes) === JSON.stringify(CARTES_EN), JSON.stringify(cartes));
    const mods = [];
    for (const [m] of CARTES_EN) {
      if (!(await page.$(`.fo-mod.ouvert .fo-tete[data-mod="${m}"]`))) { await page.click(`.fo-tete[data-mod="${m}"]`); await attendre(page, 500); }
      mods.push(await page.$eval(".fo-mod.ouvert", s => { const n = x => x ? x.textContent.replace(/\s+/g, " ").trim() : null, corps = s.querySelector(".fo-corps");
        return { id: s.querySelector(".fo-tete").dataset.mod, obj: n(corps.querySelector(".fo-obj")), contenu: Array.from(corps.querySelectorAll(".fo-contenu li")).map(n), h3: Array.from(corps.querySelectorAll("h3")).map(n),
          video: n(corps.querySelector(":scope > .video-boite .jouer")), note: n(corps.querySelector(":scope > p.note:last-child")),
          axes: Array.from(corps.querySelectorAll(".fo-axe")).map(x => [n(x.querySelector("i")), n(x.querySelector("p.note")), n(x.querySelector("p:not(.note)"))]) }; }).catch(() => ({ id: m })));
    }
    const attendu = await page.evaluate(() => FORMATION.modules.map(m => ({ id: m.id, obj: I18N.en[m.objectif] || null, contenu: m.contenu.map(t => I18N.en[t] || null), fr: [m.objectif].concat(m.contenu, m.note ? [m.note] : []) })));
    const FR = attendu.reduce((a, x) => a.concat(x.fr), []);
    const restes = mods.reduce((a, x) => a.concat([x.obj].concat(x.contenu || [], [x.note]).filter(t => t && FR.some(f => t.includes(f)))), []);
    const m2 = mods.find(x => x.id === "m2") || {}, m3 = mods.find(x => x.id === "m3") || {};
    ok("… chaque module ouvert : son objectif et son contenu en anglais (module 2 : « Nutrition basics: macronutrients and habits to adopt. »…), la note du module 3 en anglais, plus aucun de ces textes en français",
      mods.length === 7 && mods.every((x, i) => attendu[i] && x.id === attendu[i].id && !!attendu[i].obj && x.obj === "Goal: " + attendu[i].obj && JSON.stringify(x.contenu) === JSON.stringify(attendu[i].contenu) && attendu[i].contenu.every(Boolean))
      && JSON.stringify(m2.contenu) === JSON.stringify(["Nutrition basics: macronutrients and habits to adopt.", "Simple, practical meal plans.", "Avoiding common food traps."])
      && m3.note === "Video demos of every move are right in your program: open “How to do it” under an exercise." && restes.length === 0, JSON.stringify(restes.length ? restes : mods).slice(0, 400));
    const top = await page.$eval(".video-vignette .jouer", x => x.textContent.replace(/\s+/g, " ").trim()).catch(() => "");
    ok("… « Goal: », « Your to-do list » (au-dessus des tâches) et « ▶ Watch the video » dans chaque module qui en a ; en tête, « ▶ Watch the course intro »",
      mods.every(x => (x.obj || "").startsWith("Goal: ") && (x.h3 || []).includes("Your to-do list") && !(x.h3 || []).includes("Ta to-do list")) && mods.filter(x => x.id !== "m6").every(x => x.video === "▶ Watch the video") && top === "▶ Watch the course intro",
      JSON.stringify(mods.map(x => [x.id, x.h3 && x.h3[0], x.video])) + " " + top);
    /* v59 (suite de la relecture) : les challenges du module 5 ne sont pas encore traduits : leur étiquette « Objectif : »
       reste en français (pas de ligne moitié anglais « Goal: » + objectif en français)
       v60 (brief V2, J5) : les 5 axes remplacés ont leur anglais (I18N.en) : « Goal: » + objectif anglais, puis le défi
       anglais ; les 10 autres restent entièrement en français (« Objectif : », objectif et défi). Attendu calculé depuis
       FORMATION et I18N.en ; les 5 axes traduits sont exactement ceux du brief. */
    const axes = (mods.find(x => x.id === "m5") || {}).axes || [], CH = await page.evaluate(() => FORMATION.challenges.reduce((a, c) => a.concat(c.axes.map(x => {
      const n = t => String(t).replace(/\s+/g, " ").trim(), en = t => Object.prototype.hasOwnProperty.call(I18N.en, n(t)) ? I18N.en[n(t)] : null;
      return { cle: c.id + "|" + x.nom, obj: n(x.objectif), defi: n(x.defi), objEn: en(x.objectif), defiEn: en(x.defi) }; })), []));
    const TRAD5 = ["c1|Discipline", "c2|Perte de gras", "c3|Perte de gras", "c4|Perte de gras", "c4|Séances de sport"];
    const attenduAxe = x => x.objEn ? ["Goal:", "Goal: " + x.objEn, x.defiEn] : ["Objectif :", "Objectif : " + x.obj, x.defi];
    const ecartsAxes = axes.map((x, i) => [x, attenduAxe(CH[i] || {})]).filter(([x, y]) => JSON.stringify(x) !== JSON.stringify(y));
    ok("… module 5 : les 5 axes remplacés (brief J5) en anglais, « Goal: » + objectif anglais puis défi anglais ; les 10 autres, pas encore traduits, restent entièrement en français, étiquette « Objectif : » comprise (jamais « Goal: » devant un objectif en français)",
      axes.length === 15 && axes.length === CH.length && JSON.stringify(CH.filter(x => x.objEn).map(x => x.cle)) === JSON.stringify(TRAD5) && CH.every(x => !x.objEn === !x.defiEn)
      && ecartsAxes.length === 0, axes.length + " axes · traduits : " + JSON.stringify(CH.filter(x => x.objEn).map(x => x.cle)) + " · écarts : " + JSON.stringify(ecartsAxes.slice(0, 3)));
    await c.close();
  });

  /* =================== L. données piégées =================== */
  await bloc("L. données piégées", async () => {
    const XSS = "<img src=x onerror=\"window.__xss=1\">";
    const JP = { seances: [{ date: XSS, si: 0, nom: XSS, exos: [{ nom: XSS, series: [{ r: XSS, c: XSS }, { r: 8, c: "<b>" }] }, "texte", null] }, "pas un objet",
      { date: "2026-09-01", si: "x", nom: { a: 1 }, exos: { length: 3 } }, { date: jourIlYA(1), si: 0, nom: "Séance A", exos: [{ nom: "Squat", series: "12x" }] }] };
    const PP = { nom: XSS, seances: [{ nom: XSS, exercices: [{ nom: XSS, series: "3", reps: XSS }] }, "rien", { nom: "Vide", exercices: {} }] };
    const db = base({ comptes: [CLIENT(4, "Hugo", [["journal", JP], ["programme", PP]])] });
    let { c, page } = await contexte(b, quiC(4), db);
    await page.goto(URL0 + "#/journal"); await pret(page, "#jr-historique"); await attendre(page, 800);
    const vu = async p => ({ xss: await p.evaluate(() => window.__xss), img: !!(await p.$("#vue img[src='x']")), items: (await p.$$("#jr-historique [data-jr-h]")).length });
    const v1 = await vu(page);
    ok("client (journal et programme piégés) : la page s'affiche (3 séances lisibles, 1 séance du programme à noter), aucune injection, rien d'écrit", !v1.xss && !v1.img && v1.items === 3 && (await page.$$("#jr-noter [data-jr-ouvrir]")).length === 1 && db.ecritures.length === 0, JSON.stringify(v1) + " " + resume(db));
    await c.close();
    ({ c, page } = await contexte(b, COACH, db));
    await page.goto(URL0 + "#/tableau"); await pret(page); await ouvrirFiche(page, PID(4));
    await page.click('#vue .bandeau-actions a[href="#/journal"]'); await attendre(page, 1800);
    const v2 = await vu(page);
    ok("coach, fiche de ce client, « Ses séances » : même chose, aucune injection, aucune écriture", !v2.xss && !v2.img && v2.items === 3 && db.ecritures.length === 0, JSON.stringify(v2) + " " + resume(db));
    await c.close();
  });

  /* =================== Z. hôtes externes =================== */
  await bloc("Z. hôtes externes", async () => {
    const autres = Array.from(externes).filter(h => !/^(fonts\.(googleapis|gstatic)\.com|img\.youtube\.com)$/.test(h));
    ok("aucune requête vers un autre hôte que la page, le faux Supabase, les polices et les vignettes des vidéos (bloquées)", autres.length === 0, JSON.stringify(autres));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
