/* verif57 — Chantier 3 (v53) : le feedback du dimanche, derrière l'interrupteur CONFIG.nouveautes.feedback_dimanche
   (« test » : le coach et le compte de test seulement ; les autres clients gardent le bilan du vendredi, avec seulement
   le texte du lundi corrigé), vérifié de bout en bout dans un vrai navigateur, horloge contrôlée.
   A. la règle de la semaine (Checkin.semaineVisee → { debut, fin, etat, limite, regle, prochain }) pour chaque jour,
      règle du dimanche (compte de test) et règle du vendredi (Thomas), passage de minuit dimanche → lundi, fuseaux
      UTC+8 et UTC−5 (jour LOCAL), jour d'ouverture 0 permis (plus de « || 5 »), la règle de chaque compte côté coach ;
   B. règle du vendredi (Thomas) : lundi → jeudi « tu as jusqu'à jeudi soir » (plus de « avant dimanche soir »), vendredi
      → dimanche le texte d'avant ; jamais le formulaire du dimanche ; semaine enregistrée = semaine AFFICHÉE (jeudi
      23:59 → vendredi 00:00) ; anglais ;
   C. règle du dimanche (compte de test) : le formulaire le dimanche (note 1-10 obligatoire, trois cases facultatives),
      écriture EXACTE de checkins (format, envoye_a, reponses), champs en plus gardés (entrée, réponses, document),
      note piégée jamais écrite, modification tant que c'est ouvert ; lundi : en retard s'il n'est pas fait (semaine
      affichée gardée à minuit), fermé s'il est fait ; mardi → samedi : fermé, « Prochain feedback : dimanche … » ;
   D. la réponse du coach dans « Préparer le call » : note et trois cases, éditeur juste en dessous, feedbacks écrit
      avec ecrit_a (champs inconnus d'une entrée gardés), jamais checkins ; le client la voit sous son feedback ;
   E. smiley sous la réponse (un clic, libellés texte) : checkins.avis exact, un avis par (semaine, réponse), 😞 → deux
      questions, envoye_a et la liste jamais touchés, jamais feedbacks ; le 😞 remonte chez le coach (fiche, Préparer
      le call) jusqu'à sa nouvelle réponse ;
   F. badge « ton coach a répondu » (barre du haut, bouton « Plus » et volet du téléphone, carte de l'accueil), fb_vu
      écrit UNE fois à l'ouverture de Mon suivi (jamais en boucle, jamais pour une vieille réponse, jamais en
      consultation), aucune lecture de plus pour Thomas ;
   G. rappel du dimanche (bandeau de l'accueil → Mon suivi) tant que le feedback n'est pas fait, cartes du lundi et de
      la semaine ;
   H. alertes du coach (Clients.alertes, niveau « mauvais » en haut) : 😞 non traité, note en chute (≤ 5, ou 2 points
      de moins : cas limites 6 et chute de 1), « Feedback du dimanche reçu — à lire », « non fait » dès le lundi ;
      bilan du vendredi inchangé ;
   I. anciens bilans (11 questions, sans envoye_a) toujours lisibles, client et coach ;
   J. interrupteur « off » (personne ne voit le formulaire, les entrées du nouveau format restent lisibles) et « tous »
      (Thomas le voit) ;
   K. accès (RLS simulée) : un client n'écrit jamais feedbacks, le coach jamais checkins ;
   L. données piégées (verif42, verif-xss) ; M. anglais ; N. téléphone 390 px et ordi ; O. naviguer n'écrit rien.
   Z. aucun appel vers l'extérieur.
   Supabase simulé (gabarit de verif55, carte 6 §15, repris de verif56) : rien ne part vers la vraie base (routage par
   NOM D'HÔTE, jamais par sous-chaîne) ; règles de la base reproduites (HANDOFF §2.3, v49 : le client lit feedbacks
   sans pouvoir l'écrire, le coach n'écrit pas checkins) ; appelant reconnu à son jeton ; chaque écriture est appliquée
   en mémoire et notée, chaque lecture de « donnees » aussi. Calendrier : un lundi 00:00 UTC quatre semaines avant la
   semaine du lancement (LUNDI0), jour k = LUNDI0 + k jours ; horloge du navigateur posée sur le jour voulu, fuseau
   fixé ; les données du décor sont construites depuis ce calendrier. Chaque bloc tourne à part (« ✗ BLOC
   INTERROMPU ») ; code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif57.js ../index.html
           VERIF57_PORT=9731 node verif57.js ../index.html     (autre port, si 9730 est pris)
           VERIF57_BLOCS="A.,C." node verif57.js …              (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF57_PORT || 9730;
const BLOCS = (process.env.VERIF57_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const MOBILE = { width: 390, height: 844 }, ORDI = { width: 1280, height: 900 };

/* ---------- la page servie : le fichier testé, retouché le temps d'un bloc (avec) ---------- */
let retouches = [];
/* 52.1 : les retouches valent pour la page et pour ses fichiers css/ et js/ (CONFIG est dans js/config.js) */
const retouche = h => { for (const [de, vers] of retouches) h = h.split(de).join(vers); return h; };
const { servirFichier, source, sourceServie, valeursNouveaute } = require("./fichiers");   // 52.1 : la page charge css/ et js/, servis depuis son dossier (fichiers.js)
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML, retouche)) return;
  let h = retouche(fs.readFileSync(HTML, "utf8"));
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(h);
});
/* une retouche dont le texte a disparu du fichier ne passe jamais en silence : le bloc s'interrompt */
async function avec(liste, fn){
  const h = sourceServie(HTML);   // v59 : ce que la suite sert (interrupteurs forcés sur « test », fichiers.js), pas le disque
  for (const [de] of liste) if (!h.includes(de)) throw new Error("retouche impossible, texte absent du fichier servi : " + de);
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
const PID = k => "00000000-0000-4000-8000-0000000057" + String(k).padStart(2, "0");   // verif57 : …57kk (une plage par suite)
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
    /* v52 (lot A) : mot de passe oublié et changement d'adresse (erreurs simulées), renouvellements de session */
    oublis: [], recover: {}, majUsers: [], majUser: {}, tokens: [] };
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

async function repondre(r, who, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue();
  if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" });
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

/* ---------- le décor du chantier 3 ---------- */
const SRC = source(HTML);
/* le compte de test est lu dans le fichier servi (CONFIG.nouveautes.comptes_test : un identifiant, jamais un email) */
const TEST_ID = (/comptes_test:\s*\[\s*"([0-9a-f-]{36})"/.exec(SRC) || [])[1] || null;
const TESTEUR = qui(TEST_ID || PID(1), "test@exemple.fr");
const PROG_THOMAS = clone(F.donnees.find(d => d.user_id === F.IDS.c1 && d.outil === "programme").contenu);
const PIEGE = '<img src="x" data-xss="1" onerror="window.__xss=(window.__xss||0)+1">';
/* le calendrier : LUNDI0 = un lundi 00:00 UTC, quatre semaines avant la semaine du lancement (tous les jours testés sont
   passés : la session reste valable) ; jour k = LUNDI0 + k jours (0 = lundi, 6 = dimanche, 7 = lundi suivant…) */
const LUNDI0 = (() => { const d = new Date(T0), j = (d.getUTCDay() + 6) % 7; return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - j - 28); })();
const isoJ = k => new Date(LUNDI0 + k * J).toISOString().slice(0, 10);
const fr = iso => iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4);   // dateFr
const us = iso => iso.slice(5, 7) + "/" + iso.slice(8, 10) + "/" + iso.slice(0, 4);   // dateFr en anglais
/* l'instant où il est h:m:s (heure locale d'un fuseau UTC+dec) le jour k */
const a = (k, h, m, s, dec) => LUNDI0 + k * J + (h || 0) * H + (m || 0) * MIN + (s || 0) * 1000 - (dec || 0) * H;
const isoA = (k, h, m) => new Date(a(k, h, m)).toISOString();
/* une entrée du feedback du dimanche pour la semaine qui commence le jour k (envoyée le dimanche à 18 h) */
const entreeDim = (k, note, rep, plus) => Object.assign({ semaine: isoJ(k), fin: isoJ(k + 6), envoye_le: isoJ(k + 6), envoye_a: isoA(k + 6, 18), format: "dimanche",
  reponses: Object.assign({ note: note, training: "", alimentation: "", autre: "" }, rep || {}) }, plus || {});
/* un ancien bilan du vendredi (11 questions), sans envoye_a comme celui de Thomas (v36-v37) */
const entreeVen = (k, plus) => Object.assign({ semaine: isoJ(k), fin: isoJ(k + 6), envoye_le: isoJ(k + 6),
  reponses: { semaine: "Bonne semaine, un peu fatigué jeudi.", energie: 4, motivation: 4, sommeil: 3, stress: 2, seances: 4, alimentation: "Bien, sauf samedi soir.", reussite: "4 séances tenues", difficulte: "Le sommeil", ajustement: "Non", ajustement_detail: "" } }, plus || {});
/* une réponse du coach à la semaine du jour k, écrite le lundi suivant à 9 h */
const fbk = (k, texte, plus) => Object.assign({ semaine: isoJ(k), fin: isoJ(k + 6), date: isoJ(k + 7), texte: texte, ecrit_a: isoA(k + 7, 9) }, plus || {});
/* le compte de test : client sans prénom ni nom (comme le vrai, Q2 du plan), questionnaire complet, un programme */
function compteTest(ck, fb, plus){
  const d = [["intake", INTAKE_THOMAS], ["programme", PROG_THOMAS], ["prefs", { langue: "fr" }]];
  if (ck) d.push(["checkins", ck]);
  if (fb) d.push(["feedbacks", fb]);
  return { id: TESTEUR.id, prenom: "", nom: "", statut: "client", cree: avant(40 * J), email: "test@exemple.fr", donnees: d.concat(plus || []) };
}
const contenu = (db, outil, uid) => (db.donnees.find(x => x.user_id === uid && x.outil === outil) || {}).contenu;
const poser = (db, uid, outil, contenu) => { const i = db.donnees.findIndex(d => d.user_id === uid && d.outil === outil); const l = { user_id: uid, outil, contenu: clone(contenu), maj_le: avant(J) }; if (i > -1) db.donnees[i] = l; else db.donnees.push(l); };
const egal = (x, y) => JSON.stringify(x) === JSON.stringify(y);
let URL0 = "";   // l'adresse de la page servie (posée au lancement)
/* un navigateur réglé sur le jour k à h:m (fuseau UTC par défaut) */
async function sur(b, who, db, k, h, m, hash, sel, opts){
  opts = Object.assign({ fuseau: "UTC" }, opts || {});
  const { c, page } = await contexte(b, who, db, Object.assign({ horloge: a(k, h, m, 0, opts.dec) }, opts));
  await page.goto(URL0 + (hash || "")); await pret(page, sel);
  return { c, page };
}
/* le coach ouvre la fiche du compte de test sur un onglet */
async function fiche(page, cible, sel){
  await page.evaluate(([id, cb]) => Clients.ouvrir(id, "Sans nom", cb), [TESTEUR.id, cible]);
  await page.waitForSelector(sel, { timeout: 10000, state: "attached" }); await attendre(page, 700);   // un éditeur peut être dans un bloc replié
}
const voir = async (page, id) => { await page.evaluate(x => afficher(x), id); await attendre(page, 700); };   // redessine l'écran (après un changement d'heure)
const heure = async (page, t) => { await page.clock.setSystemTime(t); };
/* espion : chaque appel de Store.ecrire (clé), y compris ceux que Store refuse avant le réseau */
const espion = page => page.evaluate(() => { if (window.__ecrits) return; window.__ecrits = []; const o = Store.ecrire.bind(Store); Store.ecrire = (cle, v) => { window.__ecrits.push(cle); return o(cle, v); }; });
const ecrits = page => page.evaluate(() => window.__ecrits || []);
const ckDe = db => contenu(db, "checkins", TESTEUR.id) || {};
const fbDe = db => contenu(db, "feedbacks", TESTEUR.id) || {};
/* les textes du chantier (FR) et leur anglais attendu */
const NOUVEAUX = ["Ton bilan de la semaine du {a} au {b} n'est pas encore fait : tu as jusqu'à {j} soir.", "Feedback de la semaine", "C'est dimanche : ton feedback de la semaine t'attend (2 minutes)",
  "Une note sur 10 et trois lignes : ton coach te répond au même endroit.", "Ton feedback de la semaine du {a} au {b} n'a pas été fait.", "Tu peux encore le faire aujourd'hui.", "Feedback de la semaine envoyé",
  "le {d} — ton coach te répond au même endroit, dans Mon suivi", "Prochain feedback : dimanche {d}", "Selon toi, comment as-tu travaillé cette semaine ?", "1 = très mal · 10 = parfaitement", "{n} sur 10",
  "Training", "Alimentation", "Autre", "Tes séances, ta forme, tes charges…", "Tes repas, tes écarts, ta faim…", "Sommeil, stress, moral, une question…", "La note est obligatoire ; les trois cases sont facultatives.",
  "Envoyer mon feedback", "Mettre à jour mon feedback", "Modifier mon feedback", "Choisis ta note, de 1 à 10.", "Feedback envoyé. Ton coach te répond ici, juste en dessous.",
  "Réponds simplement, avec tes mots : ton coach te répond juste en dessous.", "Note de la semaine", "Aucune réponse lisible.", "Réponse de ton coach", "Ton coach n'a pas encore répondu.", "Cette réponse t'a aidé ?",
  "Pas vraiment", "Moyen", "Oui", "Qu'est-ce qui ne t'a pas plu ?", "Qu'est-ce que je peux améliorer pour toi ?", "Envoyer", "Merci, c'est noté.", "Merci, ton coach le verra.", "Pas encore de feedback pour cette semaine.",
  "Ton premier feedback arrive dimanche : une note sur 10 et trois lignes.", "en retard", "à faire", "envoyé", "Mes feedbacks précédents", "note {n}/10", "pas de feedback envoyé", "réponse du coach", "nouveau", "Ton coach a répondu",
  "Semaine du {a} au {b} : sa réponse t'attend dans Mon suivi.", "Semaine du {a} au {b}", "écrit le {d}", "envoyé le {d}"];

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF57_PORT=9731 node verif57.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();
  URL0 = `http://localhost:${PORT}/`;

  /* =================== A. la règle de la semaine =================== */
  await bloc("A. règle de la semaine", async () => {
    /* v59 : dans le fichier, une seule valeur connue (off, test ou tous : Lucas peut passer « tous ») ; le banc la sert sur « test » (fichiers.js) */
    const fb = valeursNouveaute(SRC, "feedback_dimanche");
    ok("A : le compte de test est lu dans le fichier servi (un identifiant, aucun « @ » dans comptes_test) ; l'interrupteur a une seule valeur connue dans le fichier (off, test ou tous) et il est servi sur « test »", !!TEST_ID && !/comptes_test:[^\]]*@/.test(SRC) && fb.length === 1 && ["off", "test", "tous"].includes(fb[0]) && JSON.stringify(valeursNouveaute(sourceServie(HTML), "feedback_dimanche")) === '["test"]', String(TEST_ID) + " " + JSON.stringify(fb));
    const db = base({ comptes: [compteTest({ liste: [] }, null)] });
    const { page } = await sur(b, TESTEUR, db, 14, 10, 0, "", "#acc-vue h1");
    const R = async (t, uid, C) => { await heure(page, t); return page.evaluate(([C, uid]) => { const v = Checkin.semaineVisee(C, uid); return { debut: v.debut, fin: v.fin, etat: v.etat, limite: v.limite, regle: v.regle, prochain: v.prochain }; }, [C, uid]); };
    const vide = { liste: [] }, faite = { liste: [{ semaine: isoJ(7), fin: isoJ(13), envoye_le: isoJ(13), reponses: {} }] };
    const dim = (d, e, l, p) => ({ debut: isoJ(d), fin: isoJ(d + 6), etat: e, limite: isoJ(l), regle: "dimanche", prochain: isoJ(p) });
    const ven = (d, e, l) => ({ debut: isoJ(d), fin: isoJ(d + 6), etat: e, limite: isoJ(l), regle: "vendredi" });
    const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
    const attDim = k => k === 14 ? dim(7, "en_retard", 14, 20) : k < 20 ? dim(7, "ferme", 14, 20) : dim(14, "ouvert", 21, 20);
    const attVen = k => k <= 17 ? ven(7, "en_retard", 17) : ven(14, "ouvert", 20);
    for (let k = 14; k <= 20; k++) {
      const d = await R(a(k, 10), TESTEUR.id, vide), v = await R(a(k, 10), F.IDS.c1, vide);
      ok(`A : ${JOURS[k - 14]} ${fr(isoJ(k))} : règle du dimanche (compte de test) → ${attDim(k).etat}, semaine du ${fr(attDim(k).debut)}`, egal(d, attDim(k)), JSON.stringify(d));
      ok(`A : ${JOURS[k - 14]} ${fr(isoJ(k))} : règle du vendredi (Thomas) → ${attVen(k).etat}, semaine du ${fr(attVen(k).debut)}`, egal(v, attVen(k)), JSON.stringify(v));
    }
    const dL = await R(a(14, 10), TESTEUR.id, faite), vL = await R(a(16, 10), F.IDS.c1, faite);
    ok("A : lundi, règle du dimanche, semaine passée déjà faite → fermé (pas « en retard »), prochain feedback dimanche", egal(dL, dim(7, "ferme", 14, 20)), JSON.stringify(dL));
    ok("A : mercredi, règle du vendredi, semaine passée déjà faite → la même semaine, ouverte jusqu'au jeudi", egal(vL, ven(7, "ouvert", 17)), JSON.stringify(vL));
    /* minuit, dimanche → lundi (fuseau UTC) */
    const d1 = await R(a(20, 23, 59, 59), TESTEUR.id, vide), d2 = await R(a(21, 0, 0, 1), TESTEUR.id, vide);
    const v1 = await R(a(20, 23, 59, 59), F.IDS.c1, vide), v2 = await R(a(21, 0, 0, 1), F.IDS.c1, vide);
    ok("A : dimanche 23:59:59 → lundi 00:00:01, règle du dimanche : ouvert (semaine en cours) puis en retard (la même semaine, devenue passée)", egal(d1, dim(14, "ouvert", 21, 20)) && egal(d2, dim(14, "en_retard", 21, 27)), JSON.stringify([d1, d2]));
    ok("A : dimanche 23:59:59 → lundi 00:00:01, règle du vendredi : ouvert puis en retard jusqu'au jeudi", egal(v1, ven(14, "ouvert", 20)) && egal(v2, ven(14, "en_retard", 24)), JSON.stringify([v1, v2]));
    /* la règle de chaque compte, vue du coach */
    const dbc = base({ comptes: [compteTest({ liste: [] }, null)] });
    const { page: pc } = await sur(b, COACH, dbc, 14, 10, 0, "", null);
    const r = await pc.evaluate(([t, th, sa, co]) => [Checkin.regle(t), Checkin.regle(th), Checkin.regle(sa), Checkin.regle(co)], [TESTEUR.id, F.IDS.c1, F.IDS.c2, F.IDS.coach]);
    ok("A : côté coach, la règle de CHAQUE client : compte de test « dimanche », Thomas et Sarah « vendredi » ; le coach lui-même « dimanche » (en test)", egal(r, ["dimanche", "vendredi", "vendredi", "dimanche"]), JSON.stringify(r));
    const rt = await page.evaluate(() => Checkin.regle());
    ok("A : le compte de test connecté : « dimanche »", rt === "dimanche", rt);
    ok("A : aucune écriture (réglage de l'horloge, calculs)", db.ecritures.length === 0 && dbc.ecritures.length === 0, resume(db) + resume(dbc));
  });

  await bloc("A2. fuseaux UTC+8 et UTC−5 (jour local)", async () => {
    for (const [fuseau, dec] of [["Asia/Makassar", 8], ["America/Bogota", -5]]) {
      const db = base({ comptes: [compteTest({ liste: [] }, null)] });
      const { page } = await sur(b, TESTEUR, db, 20, 10, 0, "", "#acc-vue h1", { fuseau, dec });
      const R = async t => { await heure(page, t); return page.evaluate(() => { const v = Checkin.semaineVisee({ liste: [] }); return v.etat + " " + v.debut + " " + new Date().getDay(); }); };
      const s1 = await R(a(20, 23, 59, 0, dec)), s2 = await R(a(21, 0, 1, 0, dec));
      ok(`A2 : ${fuseau} : dimanche 23:59 heure locale → ouvert (semaine du ${fr(isoJ(14))}) ; lundi 00:01 heure locale → en retard`, s1 === "ouvert " + isoJ(14) + " 0" && s2 === "en_retard " + isoJ(14) + " 1", s1 + " | " + s2);
      /* le même instant UTC est un autre jour selon le fuseau : c'est l'heure de l'appareil qui compte */
      const t = dec > 0 ? a(21, 0, 30, 0, dec) : a(20, 23, 30, 0, dec);   // Makassar : lundi 00:30 (dimanche 16:30 UTC) ; Bogota : dimanche 23:30 (lundi 04:30 UTC)
      const s3 = await R(t);
      ok(`A2 : ${fuseau} : ${dec > 0 ? "lundi 00:30 locale (encore dimanche en UTC) → lundi" : "dimanche 23:30 locale (déjà lundi en UTC) → dimanche"}`, s3 === (dec > 0 ? "en_retard " + isoJ(14) + " 1" : "ouvert " + isoJ(14) + " 0"), s3);
    }
  });

  await bloc("A3. jour d'ouverture 0 permis (plus de « || 5 »), valeur du fichier inchangée", async () => {
    ok("A3 : le fichier garde jour_ouverture: 5", SRC.includes("jour_ouverture: 5,"), "");
    await avec([["jour_ouverture: 5,", "jour_ouverture: 0,"]], async () => {
      const db = base();
      const { page } = await sur(b, THOMAS, db, 14, 10, 0, "", "#acc-vue h1");
      const v = await page.evaluate(() => { const v = Checkin.semaineVisee({ liste: [] }); return v.etat + " " + v.debut; });
      ok("A3 : jour_ouverture 0 : lundi, la semaine en cours est ouverte (0 n'est plus remplacé par 5)", v === "ouvert " + isoJ(14), v);
    });
  });

  /* =================== B. règle du vendredi (Thomas) =================== */
  await bloc("B. règle du vendredi (Thomas)", async () => {
    const db = base(); poser(db, F.IDS.c1, "checkins", { liste: [] });
    const { page } = await sur(b, THOMAS, db, 14, 10, 0, "", "#acc-vue h1");
    let acc = await texte(page, "#acc-vue");
    const lundi = `Ton bilan de la semaine du ${fr(isoJ(7))} au ${fr(isoJ(13))} n'est pas encore fait : tu as jusqu'à jeudi soir.`;
    ok("B : lundi, accueil de Thomas : « … n'est pas encore fait : tu as jusqu'à jeudi soir. », plus de « avant dimanche soir »", acc.includes(lundi) && !acc.includes("avant dimanche soir") && acc.includes("Ton bilan de la semaine est disponible"), acc.slice(acc.indexOf("Bilan hebdomadaire"), acc.indexOf("Bilan hebdomadaire") + 260));
    ok("B : … Thomas garde l'accueil d'avant : ni rappel du dimanche, ni « Feedback de la semaine »", !(await page.$("[data-fbd-bandeau]")) && !acc.includes("Feedback de la semaine") && acc.includes("Bilan hebdomadaire"), "");
    await aller(page, "#/suivi", 1500);
    const f = await page.evaluate(() => { const f = document.querySelector("#suivi-checkin [data-checkin]"); return f ? { s: f.dataset.semaine, n: f.querySelectorAll(".checkin-q").length, dim: !!document.querySelector("[data-fbd]") } : null; });
    ok("B : lundi, Mon suivi : le bilan du vendredi (11 questions) sur la semaine passée, pas le feedback du dimanche", !!f && f.s === isoJ(7) && f.n === 11 && !f.dim, JSON.stringify(f));
    let mardiJeudi = true, detail = "";
    for (const k of [15, 16, 17]) { await heure(page, a(k, 10)); await voir(page, "accueil"); acc = await texte(page, "#acc-vue"); if (!acc.includes(lundi) || acc.includes("avant dimanche soir")) { mardiJeudi = false; detail += k + " "; } }
    ok("B : mardi, mercredi, jeudi : le même texte (jusqu'à jeudi soir)", mardiJeudi, detail);
    let vendDim = true; detail = "";
    for (const k of [18, 19, 20]) {
      await heure(page, a(k, 10)); await voir(page, "accueil"); acc = await texte(page, "#acc-vue");
      await voir(page, "suivi"); const s = await page.evaluate(() => { const f = document.querySelector("[data-checkin]"); return f ? f.dataset.semaine : null; });
      if (!acc.includes("5 minutes, avant dimanche soir : c'est ce qui permet à ton coach d'ajuster") || acc.includes("jusqu'à jeudi soir") || s !== isoJ(14) || (await page.$("[data-fbd]")) || (await page.$("[data-fbd-bandeau]"))) { vendDim = false; detail += k + ":" + s + " "; }
    }
    ok("B : vendredi, samedi, dimanche : le texte d'avant (« 5 minutes, avant dimanche soir… »), la semaine en cours, jamais le formulaire du dimanche", vendDim, detail);
    ok("B : aucune écriture en naviguant", db.ecritures.length === 0, resume(db));
  });

  await bloc("B2. semaine affichée gardée à minuit (jeudi → vendredi)", async () => {
    const db = base(); poser(db, F.IDS.c1, "checkins", { liste: [] });
    const { page } = await sur(b, THOMAS, db, 17, 23, 59, "#/suivi", "#suivi-checkin [data-checkin]");
    await heure(page, a(17, 23, 59, 30)); await voir(page, "suivi");
    const s0 = await page.$eval("[data-checkin]", f => f.dataset.semaine);
    await heure(page, a(18, 0, 0, 30));
    for (const g of await page.$$("[data-checkin] .echelle5")) { const bt = await g.$$("button"); await bt[3].click(); }
    await page.click("[data-checkin] button[type=submit]"); await attendre(page, 1500);
    const E = ecr(db, "checkins", F.IDS.c1), l = ((contenu(db, "checkins", F.IDS.c1) || {}).liste) || [];
    ok(`B2 : affiché jeudi 23:59:30 (semaine du ${fr(isoJ(7))}), envoyé vendredi 00:00:30 : enregistré sur la semaine AFFICHÉE, pas recalculée au clic`, s0 === isoJ(7) && E.length === 1 && l.length === 1 && l[0].semaine === isoJ(7) && l[0].fin === isoJ(13) && l[0].envoye_le === isoJ(18) && !("format" in l[0]), JSON.stringify(l));
  });

  await bloc("B3. règle du vendredi en anglais", async () => {
    const db = base(); poser(db, F.IDS.c1, "checkins", { liste: [] }); avecEn(db, F.IDS.c1);
    const { page } = await sur(b, THOMAS, db, 14, 10, 0, "", "#acc-vue h1", { langue: "en" });
    const acc = await texte(page, "#acc-vue");
    ok("B3 : lundi, en anglais : « Your check-in for the week of … isn't done yet: you have until Thursday evening. »", acc.includes(`Your check-in for the week of ${us(isoJ(7))} to ${us(isoJ(13))} isn't done yet: you have until Thursday evening.`) && !/Sunday evening/.test(acc), acc.slice(0, 400));
  });

  /* =================== C. règle du dimanche : le formulaire (compte de test) =================== */
  await bloc("C. feedback du dimanche : le formulaire et l'écriture exacte", async () => {
    const ancienne = entreeVen(0), passee = entreeDim(7, 8, { training: "Bien" }, { x_extra: "garde" });
    const CK0 = { liste: [ancienne, passee], autre_cle: "garde", avis: [], fb_vu: isoA(14, 9) };   // la réponse d'avant déjà vue : aucune écriture de fb_vu ici
    const db = base({ comptes: [compteTest(CK0, { liste: [fbk(7, "Bravo pour ta semaine.", { x_coach: "garde" })] })] });
    const { page } = await sur(b, TESTEUR, db, 20, 10, 0, "#/suivi", "#suivi-checkin [data-fbd]");
    const f = await page.evaluate(() => { const f = document.querySelector("[data-fbd]"); return { s: f.dataset.semaine, fin: f.dataset.fin, notes: Array.from(f.querySelectorAll(".note10 button")).map(x => x.dataset.v + ":" + x.getAttribute("aria-pressed")).join(","), lbl: Array.from(f.querySelectorAll("label")).map(x => x.textContent.trim()), ta: f.querySelectorAll("textarea").length, ven: !!document.querySelector("[data-checkin]") }; });
    ok("C : dimanche : le formulaire du dimanche (semaine en cours), « Selon toi, comment as-tu travaillé cette semaine ? », 10 boutons de 1 à 10, Training / Alimentation / Autre, pas le bilan du vendredi",
      f.s === isoJ(14) && f.fin === isoJ(20) && f.notes === "1:false,2:false,3:false,4:false,5:false,6:false,7:false,8:false,9:false,10:false" && egal(f.lbl, ["Selon toi, comment as-tu travaillé cette semaine ?", "Training", "Alimentation", "Autre"]) && f.ta === 3 && !f.ven, JSON.stringify(f));
    ok("C : … la semaine affichée et la phrase du dimanche", (await texte(page, "#suivi-checkin")).includes(`Semaine du ${fr(isoJ(14))} au ${fr(isoJ(20))} · Réponds simplement, avec tes mots : ton coach te répond juste en dessous.`), (await texte(page, "#suivi-checkin")).slice(0, 200));
    await page.click("[data-fbd] button[type=submit]"); await attendre(page, 1300);
    ok("C : sans note : « Choisis ta note, de 1 à 10. », rien d'écrit (la note est obligatoire)", db.ecritures.length === 0 && (await texte(page, "[data-fbd-msg]")) === "Choisis ta note, de 1 à 10.", resume(db));
    /* note piégée dans la page : jamais écrite */
    await page.evaluate(() => { const x = document.querySelector('.note10 [data-v="10"]'); x.dataset.v = "11"; x.click(); document.querySelector("[data-fbd] button[type=submit]").click(); x.dataset.v = "abc"; x.click(); document.querySelector("[data-fbd] button[type=submit]").click(); x.dataset.v = "10"; x.setAttribute("aria-pressed", "false"); });
    await attendre(page, 1300);
    ok("C : une note hors 1-10 ou non numérique n'est jamais écrite", db.ecritures.length === 0, resume(db));
    await page.click('.note10 [data-v="7"]');
    await page.fill("#fbd-training", "  Séances ok, 3 sur 4  "); await page.fill("#fbd-autre", "Genou un peu raide");
    const t1 = Date.now();
    await page.click("[data-fbd] button[type=submit]"); await attendre(page, 1500);
    const E = ecr(db, "checkins", TESTEUR.id), CK = ckDe(db), l = CK.liste || [];
    const n = l.find(x => x.semaine === isoJ(14)) || {};
    ok("C : envoyer = UNE écriture, clé checkins chez le compte de test, rien d'autre", db.ecritures.length === 1 && E.length === 1, resume(db));
    ok("C : l'entrée exacte : { semaine, fin, envoye_le, envoye_a, format: « dimanche », reponses: { note: 7 (nombre), training, alimentation, autre } }",
      egal(Object.keys(n).sort(), ["envoye_a", "envoye_le", "fin", "format", "reponses", "semaine"]) && n.semaine === isoJ(14) && n.fin === isoJ(20) && n.envoye_le === isoJ(20) && n.format === "dimanche"
      && egal(n.reponses, { note: 7, training: "Séances ok, 3 sur 4", alimentation: "", autre: "Genou un peu raide" }) && /^\d{4}-\d{2}-\d{2}T/.test(n.envoye_a || ""), JSON.stringify(n));
    ok("C : … envoye_a = l'instant de l'envoi (horloge de l'appareil)", Math.abs(Date.parse(n.envoye_a) - a(20, 10)) < 5 * MIN, n.envoye_a + " / " + new Date(a(20, 10)).toISOString() + " (" + (Date.now() - t1) + " ms)");
    ok("C : les autres entrées intactes (ancien bilan sans envoye_a, semaine passée et son champ en plus), le reste du document gardé (autre_cle, avis, fb_vu)",
      l.length === 3 && egal(l[0], ancienne) && egal(l[1], passee) && CK.autre_cle === "garde" && egal(CK.avis, []) && CK.fb_vu === isoA(14, 9), JSON.stringify(CK).slice(0, 400));
    const t = await texte(page, "#suivi-checkin");
    ok("C : après l'envoi : sa note et ses cases, « Ton coach n'a pas encore répondu. », « Modifier mon feedback », pastille « envoyé »",
      t.includes("Note de la semaine 7/10") && t.includes("Séances ok, 3 sur 4") && t.includes("Genou un peu raide") && t.includes("Ton coach n'a pas encore répondu.") && !!(await page.$("[data-fbd-modifier]")) && t.includes("✓ envoyé") && !(await page.$("[data-fbd]")), t.slice(0, 300));
    ok("C : la réponse du coach à la semaine d'avant reste lisible dans l'historique (« Mes feedbacks précédents »)", t.includes("Mes feedbacks précédents") && t.includes("Bravo pour ta semaine.") && t.includes("note 8/10"), t.slice(-400));
    ok("C : message « Feedback envoyé. Ton coach te répond ici, juste en dessous. »", (await page.evaluate(() => window.__toasts)).some(x => x.includes("Feedback envoyé. Ton coach te répond ici, juste en dessous.")), JSON.stringify(await page.evaluate(() => window.__toasts)));
    /* modifier tant que c'est ouvert */
    await page.click("[data-fbd-modifier]"); await attendre(page, 300);
    const pre = await page.evaluate(() => ({ n: (document.querySelector('.note10 [aria-pressed="true"]') || {}).textContent, t: document.querySelector("#fbd-training").value, bouton: document.querySelector("[data-fbd] button[type=submit]").textContent }));
    ok("C : « Modifier mon feedback » : le formulaire repris (note 7, cases), bouton « Mettre à jour mon feedback »", pre.n === "7" && pre.t === "Séances ok, 3 sur 4" && pre.bouton === "Mettre à jour mon feedback", JSON.stringify(pre));
    await page.click('.note10 [data-v="9"]'); await page.click("[data-fbd] button[type=submit]"); await attendre(page, 1500);
    const l2 = ckDe(db).liste || [], n2 = l2.find(x => x.semaine === isoJ(14)) || {};
    ok("C : mise à jour : une écriture de plus, toujours UNE entrée pour la semaine, note 9, cases gardées", ecr(db, "checkins").length === 2 && l2.length === 3 && n2.reponses && n2.reponses.note === 9 && n2.reponses.training === "Séances ok, 3 sur 4" && n2.format === "dimanche", JSON.stringify(n2));
  });

  await bloc("C2. modifier garde les champs en plus", async () => {
    const cette = entreeDim(14, 6, { training: "a", alimentation: "b", autre: "c", extra_rep: "r" }, { x_extra: "garde", envoye_a: isoA(20, 8) });
    const db = base({ comptes: [compteTest({ liste: [cette], fb_vu: "2000-01-01", avis: [{ semaine: isoJ(7), fb: "x", smiley: "content", le: isoA(14, 9) }] }, null)] });
    const { page } = await sur(b, TESTEUR, db, 20, 10, 0, "#/suivi", "#suivi-checkin [data-fbd-modifier]");
    ok("C2 : dimanche, déjà envoyé : son feedback (note 6) et « Modifier mon feedback », pas de formulaire", !(await page.$("[data-fbd]")) && (await texte(page, "#suivi-checkin")).includes("Note de la semaine 6/10"), "");
    await page.click("[data-fbd-modifier]"); await attendre(page, 300);
    await page.click('.note10 [data-v="8"]'); await page.click("[data-fbd] button[type=submit]"); await attendre(page, 1500);
    const CK = ckDe(db), n = (CK.liste || [])[0] || {};
    ok("C2 : l'entrée garde ses champs en plus (x_extra, reponses.extra_rep), note 8, les autres cases, envoye_a renouvelé", n.x_extra === "garde" && n.reponses && n.reponses.extra_rep === "r" && n.reponses.note === 8 && n.reponses.training === "a" && n.reponses.alimentation === "b" && n.reponses.autre === "c" && n.format === "dimanche" && n.envoye_a > isoA(20, 8), JSON.stringify(n));
    ok("C2 : le document garde fb_vu et avis tels quels", CK.fb_vu === "2000-01-01" && egal(CK.avis, [{ semaine: isoJ(7), fb: "x", smiley: "content", le: isoA(14, 9) }]), JSON.stringify(CK).slice(0, 300));
  });

  await bloc("C3. lundi : en retard, puis minuit", async () => {
    const db = base({ comptes: [compteTest({ liste: [entreeDim(7, 7)] }, null)] });
    const { page } = await sur(b, TESTEUR, db, 21, 23, 59, "#/suivi", "#suivi-checkin [data-fbd]");
    await heure(page, a(21, 23, 59, 40)); await voir(page, "suivi");
    const t = await texte(page, "#suivi-checkin"), s = await page.$eval("[data-fbd]", f => f.dataset.semaine);
    ok(`C3 : lundi, pas fait : le formulaire de la semaine passée (${fr(isoJ(14))}) et « Ton feedback de la semaine du … n'a pas été fait. Tu peux encore le faire aujourd'hui. », pastille « en retard »`,
      s === isoJ(14) && t.includes(`Ton feedback de la semaine du ${fr(isoJ(14))} au ${fr(isoJ(20))} n'a pas été fait. Tu peux encore le faire aujourd'hui.`) && t.includes("en retard"), s + " · " + t.slice(0, 240));
    await heure(page, a(22, 0, 0, 20));
    await page.click('.note10 [data-v="5"]'); await page.click("[data-fbd] button[type=submit]"); await attendre(page, 1500);
    const l = ckDe(db).liste || [];
    ok("C3 : affiché lundi 23:59:40, envoyé mardi 00:00:20 : enregistré sur la semaine affichée", l.length === 2 && l[1].semaine === isoJ(14) && l[1].envoye_le === isoJ(22) && l[1].reponses.note === 5, JSON.stringify(l[1]));
  });

  await bloc("C4. lundi fait, puis mardi → samedi : fermé", async () => {
    const db = base({ comptes: [compteTest({ liste: [entreeDim(7, 7), entreeDim(14, 6, { training: "Trois séances" })] }, { liste: [fbk(14, "Belle régularité, on garde le cap.")] })] });
    const { page } = await sur(b, TESTEUR, db, 21, 10, 0, "#/suivi", "#suivi-checkin .fbd");
    let t = await texte(page, "#suivi-checkin");
    ok(`C4 : lundi, déjà fait : fermé, « Prochain feedback : dimanche ${fr(isoJ(27))} », pastille « envoyé », aucun formulaire`, !(await page.$("[data-fbd]")) && t.includes(`Prochain feedback : dimanche ${fr(isoJ(27))}`) && t.includes("✓ envoyé"), t.slice(0, 200));
    let ferme = true, detail = "";
    for (const k of [22, 23, 24, 25, 26]) {
      await heure(page, a(k, 10)); await voir(page, "suivi"); t = await texte(page, "#suivi-checkin");
      if ((await page.$("[data-fbd]")) || !t.includes(`Prochain feedback : dimanche ${fr(isoJ(27))}`) || !t.includes("Note de la semaine 6/10") || !t.includes("Belle régularité, on garde le cap.")) { ferme = false; detail += k + " "; }
    }
    ok("C4 : mardi, mercredi, jeudi, vendredi, samedi : pas de formulaire ; le dernier feedback, la réponse du coach juste en dessous et « Prochain feedback : dimanche … »", ferme, detail);
    ok("C4 : … l'historique visible (la semaine d'avant, note 7/10)", t.includes("Mes feedbacks précédents") && t.includes("note 7/10"), t.slice(-200));
    const ordre = await page.evaluate(() => { const s = document.querySelector(".fbd-semaine"), r = document.querySelector(".fbd-reponse"); return !!(s && r && (s.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING)); });
    ok("C4 : la réponse du coach est au même endroit, juste sous le feedback de la semaine", ordre, "");
    const CK = ckDe(db);
    ok("C4 : la réponse du coach est maintenant vue : fb_vu écrit UNE fois malgré six ouvertures de Mon suivi, la liste intacte", ecr(db, "checkins").length === 1 && db.ecritures.length === 1 && CK.fb_vu === isoA(21, 9) && (CK.liste || []).length === 2 && (CK.liste || [])[1].reponses.note === 6, resume(db) + " " + CK.fb_vu);
  });

  /* =================== D. la réponse du coach (Préparer le call) =================== */
  await bloc("D. réponse du coach au même endroit, avec ecrit_a", async () => {
    const e7 = entreeDim(7, 7, { training: "Quatre séances" }), e14 = entreeDim(14, 4, { training: "Deux séances sautées", alimentation: "Trop de sucre", autre: "Fatigué" });
    const f7 = fbk(7, "Bien joué.", { x_coach: "garde", bilan: e7.envoye_a });
    const db = base({ comptes: [compteTest({ liste: [e7, e14] }, { liste: [f7] })] });
    const { page } = await sur(b, COACH, db, 21, 10, 0, "", null);
    await espion(page);
    await fiche(page, "bilan", `#bilan-vue [data-fb-semaine="${isoJ(14)}"]`);
    const t = await texte(page, "#bilan-vue");
    ok("D : Préparer le call : « Ses feedbacks du dimanche et ta réponse », note 4/10 et les trois cases de la semaine", t.includes("Ses feedbacks du dimanche et ta réponse") && t.includes("note 4/10") && t.includes("Note de la semaine 4/10") && t.includes("Deux séances sautées") && t.includes("Trop de sucre") && t.includes("Fatigué"), t.slice(t.indexOf("Ses feedbacks"), t.indexOf("Ses feedbacks") + 300));
    const place = await page.evaluate(s => { const ed = document.querySelector(`[data-fb-semaine="${s}"]`), d = ed && ed.closest("details"); return !!(d && d.open && d.textContent.includes("Deux séances sautées")); }, isoJ(14));
    ok("D : l'éditeur de réponse juste sous le feedback de la semaine (même bloc, ouvert)", place, "");
    await page.fill(`[data-fb-semaine="${isoJ(14)}"] textarea`, "Pas grave, on ajuste : 3 séances cette semaine.");
    await page.click(`[data-fb-semaine="${isoJ(14)}"] [data-fb-enregistrer]`); await attendre(page, 1200);
    const E = ecr(db, "feedbacks", TESTEUR.id), L = (fbDe(db).liste || []), r14 = L.find(x => x.semaine === isoJ(14)) || {}, r7 = L.find(x => x.semaine === isoJ(7)) || {};
    ok("D : la réponse est écrite dans feedbacks (chez le client), une écriture", E.length === 1, resume(db));
    ok("D : l'entrée : { semaine, fin, date, texte, bilan = envoye_a du feedback, ecrit_a = l'instant (ISO) }",
      egal(Object.keys(r14).sort(), ["bilan", "date", "ecrit_a", "fin", "semaine", "texte"]) && r14.fin === isoJ(20) && r14.date === isoJ(21) && r14.texte === "Pas grave, on ajuste : 3 séances cette semaine." && r14.bilan === e14.envoye_a && Math.abs(Date.parse(r14.ecrit_a) - a(21, 10)) < 5 * MIN, JSON.stringify(r14));
    ok("D : l'autre semaine intacte, son champ inconnu compris (x_coach)", egal(r7, f7), JSON.stringify(r7));
    await page.evaluate(s => { document.querySelector(`[data-fb-semaine="${s}"]`).closest("details").open = true; }, isoJ(7));   // la semaine d'avant est repliée
    await page.fill(`[data-fb-semaine="${isoJ(7)}"] textarea`, "Bien joué, continue.");
    await page.click(`[data-fb-semaine="${isoJ(7)}"] [data-fb-enregistrer]`); await attendre(page, 1200);
    const r7b = ((fbDe(db).liste || []).find(x => x.semaine === isoJ(7))) || {};
    ok("D : mise à jour d'une réponse : texte nouveau, ecrit_a renouvelé, champ inconnu (x_coach) recopié, bilan gardé", r7b.texte === "Bien joué, continue." && r7b.x_coach === "garde" && r7b.bilan === e7.envoye_a && r7b.ecrit_a > f7.ecrit_a && r7b.date === isoJ(21), JSON.stringify(r7b));
    const es = await ecrits(page);
    ok("D : le coach n'écrit jamais checkins (ni appel à Store.ecrire, ni requête, ni refus de la base)", ecr(db, "checkins").length === 0 && es.indexOf("checkins") === -1 && db.refus.length === 0, JSON.stringify(es) + " " + JSON.stringify(db.refus));
    await voir(page, "accueil");
    const fi = await texte(page, "#acc-vue");
    ok("D : fiche : « Feedback du dimanche » (tuile et bloc), « reçu », sa note", fi.includes("Feedback du dimanche") && fi.includes("reçu") && fi.includes("Note de la semaine 4/10"), fi.slice(fi.indexOf("Feedback du dimanche"), fi.indexOf("Feedback du dimanche") + 200));
    /* le client voit la réponse sous son feedback */
    const { page: pc } = await sur(b, TESTEUR, db, 22, 10, 0, "#/suivi", "#suivi-checkin .fbd-reponse");
    const tc = await texte(pc, "#suivi-checkin");
    ok("D : mardi, le client : sous son feedback, « Réponse de ton coach » et le texte ; la semaine d'avant dans l'historique", tc.includes("Réponse de ton coach") && tc.includes("Pas grave, on ajuste : 3 séances cette semaine.") && tc.includes("Bien joué, continue.") && tc.indexOf("Deux séances sautées") < tc.indexOf("Pas grave, on ajuste"), tc.slice(0, 400));
  });

  /* =================== E. le smiley =================== */
  await bloc("E. smiley sur la réponse du coach", async () => {
    const e14 = entreeDim(14, 6, { training: "ok" }, { envoye_a: isoA(20, 18) });
    const f14 = fbk(14, "Voici ta réponse de la semaine.", { bilan: e14.envoye_a });
    const db = base({ comptes: [compteTest({ liste: [e14], fb_vu: f14.ecrit_a }, { liste: [f14] })] });
    const { page } = await sur(b, TESTEUR, db, 22, 10, 0, "#/suivi", "#suivi-checkin [data-smiley]");
    await espion(page);
    const sm = await page.evaluate(() => Array.from(document.querySelectorAll(".fbd-reponse [data-smiley]")).map(x => x.dataset.smiley + ":" + x.textContent.trim() + ":" + x.getAttribute("aria-pressed") + ":" + (x.querySelector(".emo") || {}).getAttribute("aria-hidden")));
    ok("E : sous la réponse du coach : « Cette réponse t'a aidé ? » et trois boutons avec un libellé texte (😞 Pas vraiment, 😐 Moyen, 😊 Oui), aucun choisi",
      egal(sm, ["triste:😞Pas vraiment:false:true", "neutre:😐Moyen:false:true", "content:😊Oui:false:true"]) && (await texte(page, ".fbd-reponse")).includes("Cette réponse t'a aidé ?"), JSON.stringify(sm));
    ok("E : ouvrir Mon suivi (réponse déjà vue) n'écrit rien", db.ecritures.length === 0, resume(db));
    await page.click('.fbd-reponse [data-smiley="content"]'); await attendre(page, 1300);
    let CK = ckDe(db), av = CK.avis || [];
    ok("E : un clic sur 😊 : une écriture de checkins, avis = [{ semaine, fb = ecrit_a de la réponse, smiley: « content », le }]", ecr(db, "checkins").length === 1 && av.length === 1 && egal(Object.keys(av[0]).sort(), ["fb", "le", "semaine", "smiley"]) && av[0].semaine === isoJ(14) && av[0].fb === f14.ecrit_a && av[0].smiley === "content" && /^\d{4}-\d{2}-\d{2}T/.test(av[0].le), JSON.stringify(av));
    ok("E : … la liste des feedbacks intacte (envoye_a jamais touché), fb_vu inchangé ; confirmation « Merci, c'est noté. »", egal(CK.liste, [e14]) && CK.fb_vu === f14.ecrit_a && (await texte(page, ".fbd-reponse [data-avis-msg]")) === "Merci, c'est noté.", JSON.stringify(CK.liste));
    ok("E : les questions du 😞 restent cachées", await page.$eval(".fbd-reponse .fbd-triste", x => x.hidden), "");
    await page.click('.fbd-reponse [data-smiley="triste"]'); await attendre(page, 1300);
    const q = await page.evaluate(() => { const t = document.querySelector(".fbd-reponse .fbd-triste"); return { vis: !t.hidden, lbl: Array.from(t.querySelectorAll("label")).map(x => x.textContent.trim()), pressed: Array.from(document.querySelectorAll(".fbd-reponse [data-smiley]")).map(x => x.getAttribute("aria-pressed")).join(",") }; });
    av = ckDe(db).avis || [];
    ok("E : 😞 : les deux questions (« Qu'est-ce qui ne t'a pas plu ? », « Qu'est-ce que je peux améliorer pour toi ? »), le même avis changé (un seul par semaine et réponse)", q.vis && egal(q.lbl, ["Qu'est-ce qui ne t'a pas plu ?", "Qu'est-ce que je peux améliorer pour toi ?"]) && q.pressed === "true,false,false" && av.length === 1 && av[0].smiley === "triste", JSON.stringify(q) + " " + JSON.stringify(av));
    await page.fill('.fbd-reponse [data-avis-q="deplu"]', "Trop court"); await page.fill('.fbd-reponse [data-avis-q="ameliorer"]', "Plus de détails sur les séances");
    await page.click(".fbd-reponse [data-avis-envoyer]"); await attendre(page, 1300);
    CK = ckDe(db); av = CK.avis || [];
    ok("E : « Envoyer » : l'avis porte les deux réponses ; toujours un seul avis ; la liste et envoye_a intacts ; « Merci, ton coach le verra. »",
      av.length === 1 && av[0].smiley === "triste" && av[0].deplu === "Trop court" && av[0].ameliorer === "Plus de détails sur les séances" && av[0].fb === f14.ecrit_a && egal(CK.liste, [e14]) && (await texte(page, ".fbd-reponse [data-avis-msg]")) === "Merci, ton coach le verra.", JSON.stringify(CK));
    const es = await ecrits(page);
    ok("E : le client n'écrit jamais feedbacks (ni Store.ecrire, ni requête, ni refus) : le smiley vit dans checkins", ecr(db, "feedbacks").length === 0 && es.every(x => x === "checkins") && db.refus.length === 0, JSON.stringify(es) + " " + JSON.stringify(db.refus));
    await page.reload(); await pret(page, "#suivi-checkin [data-smiley]");
    const rel = await page.evaluate(() => ({ p: (document.querySelector('.fbd-reponse [data-smiley="triste"]') || {}).getAttribute("aria-pressed"), vis: !document.querySelector(".fbd-reponse .fbd-triste").hidden, d: document.querySelector('.fbd-reponse [data-avis-q="deplu"]').value }));
    ok("E : rechargé : 😞 choisi, les deux réponses reprises", rel.p === "true" && rel.vis && rel.d === "Trop court", JSON.stringify(rel));
    /* le 😞 remonte chez le coach */
    const { page: pc } = await sur(b, COACH, db, 22, 11, 0, "", null);
    await fiche(pc, "accueil", "#acc-vue .attention-alertes");
    const alertes = await pc.$$eval("#acc-vue .attention-alertes .pastille", l => l.map(x => x.className.replace("pastille", "").trim() + "|" + x.textContent.trim()));
    ok("E : fiche du coach : l'alerte « 😞 sur ta réponse — à traiter » (niveau mauvais), en tête", alertes.length > 0 && alertes[0] === "mauvais|😞 sur ta réponse — à traiter", JSON.stringify(alertes));
    await voir(pc, "bilan"); await pc.waitForSelector("#bilan-vue [data-avis-triste]");
    const tb = await texte(pc, "#bilan-vue");
    ok("E : Préparer le call : le 😞 en évidence (« à traiter en priorité »), ses deux réponses, « 😞 à traiter » dans le résumé", !!(await pc.$('#bilan-vue [data-avis-triste="a-traiter"]')) && tb.includes("Ta réponse ne l'a pas aidé — à traiter en priorité") && tb.includes("Trop court") && tb.includes("Plus de détails sur les séances") && tb.includes("😞 à traiter"), tb.slice(tb.indexOf("Ses feedbacks"), tb.indexOf("Ses feedbacks") + 400));
    await pc.fill(`[data-fb-semaine="${isoJ(14)}"] textarea`, "Tu as raison : voici le détail de tes séances.");
    await pc.click(`[data-fb-semaine="${isoJ(14)}"] [data-fb-enregistrer]`); await attendre(pc, 1200);
    await voir(pc, "bilan"); await pc.waitForSelector("#bilan-vue [data-avis-triste]");
    ok("E : après sa nouvelle réponse : « Ta réponse ne l'a pas aidé — tu lui as répondu depuis »", !!(await pc.$('#bilan-vue [data-avis-triste="traite"]')) && (await texte(pc, "#bilan-vue")).includes("tu lui as répondu depuis"), "");
    await voir(pc, "accueil");
    const al2 = await pc.$$eval("#acc-vue .attention-alertes .pastille", l => l.map(x => x.textContent.trim())).catch(() => []);
    ok("E : fiche rouverte : l'alerte 😞 a disparu (traitée par la nouvelle réponse)", !al2.some(x => x.includes("😞")), JSON.stringify(al2));
  });

  /* =================== F. badge et fb_vu =================== */
  await bloc("F. badge « ton coach a répondu » et fb_vu", async () => {
    const e14 = entreeDim(14, 7);
    const f14 = fbk(14, "Réponse toute récente.", { date: isoJ(22), ecrit_a: isoA(22, 9), bilan: e14.envoye_a });
    const db = base({ comptes: [compteTest({ liste: [e14] }, { liste: [f14] })] });
    const { page } = await sur(b, TESTEUR, db, 23, 10, 0, "#/programme", null);
    await attendre(page, 1500);
    const bd = await page.evaluate(() => { const x = document.querySelector('#nav a[data-id="suivi"] .fbd-badge'); return x ? x.textContent + "|" + x.getAttribute("aria-label") : null; });
    ok("F : arrivée sur une autre page (Mon programme) : le badge « 1 » sur « Mon suivi » (barre du haut), sans écriture", bd === "1|Ton coach a répondu" && db.ecritures.length === 0, bd + " " + resume(db));
    await aller(page, "#/accueil", 1500);
    const carte = await page.evaluate(() => { const x = document.querySelector("#acc-fbd .fbd-repondu"); return x ? { h: x.getAttribute("href"), b: x.querySelector("b").textContent, s: x.querySelector("small").textContent } : null; });
    ok("F : accueil : la carte « Ton coach a répondu » → Mon suivi, sans écriture", !!carte && carte.h === "#/suivi" && carte.b === "Ton coach a répondu" && carte.s === `Semaine du ${fr(isoJ(14))} au ${fr(isoJ(20))} : sa réponse t'attend dans Mon suivi.` && db.ecritures.length === 0, JSON.stringify(carte));
    await aller(page, "#/suivi", 1600);
    let CK = ckDe(db);
    ok("F : ouvrir Mon suivi : UNE écriture, fb_vu = ecrit_a de la réponse, la liste intacte", ecr(db, "checkins").length === 1 && db.ecritures.length === 1 && CK.fb_vu === f14.ecrit_a && egal(CK.liste, [e14]), resume(db) + " " + JSON.stringify(CK).slice(0, 200));
    ok("F : … le badge a disparu", !(await page.$(".fbd-badge")), "");
    await aller(page, "#/programme", 300); await aller(page, "#/suivi", 300); await aller(page, "#/accueil", 1400); await aller(page, "#/suivi", 1500);
    await page.reload(); await pret(page, null); await aller(page, "#/accueil", 1500);
    const sansCarte = !(await page.$("#acc-fbd .fbd-repondu")) && !!(await page.$("#acc-fbd"));
    await aller(page, "#/suivi", 1500);
    ok("F : revenir sur Mon suivi (même tout de suite), recharger : aucune autre écriture (jamais en boucle), ni badge ni carte « Ton coach a répondu »", ecr(db, "checkins").length === 1 && !(await page.$(".fbd-badge")) && sansCarte, resume(db));
    /* téléphone : bouton « Plus » et volet */
    const db2 = base({ comptes: [compteTest({ liste: [e14] }, { liste: [f14] })] });
    const { page: pm } = await sur(b, TESTEUR, db2, 23, 10, 0, "#/accueil", "#acc-vue h1", { viewport: MOBILE });
    await attendre(pm, 800);
    ok("F : téléphone : le badge sur le bouton « Plus » (Mon suivi est derrière lui)", !!(await pm.$("#barre-bas [data-plus] .fbd-badge")) && !(await pm.$('#barre-bas a[data-id="suivi"]')), "");
    await pm.click("#barre-bas [data-plus]"); await attendre(pm, 500);
    ok("F : … et sur « Mon suivi » dans le volet « Plus »", !!(await pm.$('.menu-plus a[data-id="suivi"] .fbd-badge')), "");
    ok("F : téléphone : rien d'écrit avant d'ouvrir Mon suivi", db2.ecritures.length === 0, resume(db2));
    /* une vieille réponse (plus de 14 jours) : ni badge, ni écriture */
    const db3 = base({ comptes: [compteTest({ liste: [entreeDim(0, 7)] }, { liste: [fbk(0, "Vieille réponse.")] })] });
    const { page: pv } = await sur(b, TESTEUR, db3, 23, 10, 0, "#/programme", null);
    await attendre(pv, 1200); await aller(pv, "#/suivi", 1600);
    ok("F : une réponse de plus de 14 jours jamais marquée vue : ni badge, ni écriture en ouvrant Mon suivi", !(await pv.$(".fbd-badge")) && db3.ecritures.length === 0, resume(db3));
    /* le coach en consultation : jamais d'écriture de fb_vu */
    const db4 = base({ comptes: [compteTest({ liste: [e14] }, { liste: [f14] })] });
    const { page: pc } = await sur(b, COACH, db4, 23, 10, 0, "", null);
    await espion(pc);
    await fiche(pc, "suivi", "#suivi-checkin .fbd"); await attendre(pc, 1200);
    const tc = await texte(pc, "#suivi-checkin"), es = await ecrits(pc);
    ok("F : Son suivi (coach) : la même page en lecture (réponse, smiley du client), aucune écriture de fb_vu (ni tentative)", tc.includes("Réponse toute récente.") && db4.ecritures.length === 0 && es.length === 0 && !(await pc.$("[data-smiley]")), JSON.stringify(es) + resume(db4));
    /* Thomas : rien de tout cela, aucune lecture de plus au démarrage */
    const db5 = base();
    const { page: pt } = await sur(b, THOMAS, db5, 23, 10, 0, "#/programme", null);
    await attendre(pt, 1200);
    ok("F : Thomas (bilan du vendredi) : pas de badge, aucune lecture de checkins ni de feedbacks sur Mon programme", !(await pt.$(".fbd-badge")) && lu(db5, "checkins") === 0 && lu(db5, "feedbacks") === 0, JSON.stringify(db5.lectures.map(x => x.outil)));
  });

  /* =================== G. le rappel du dimanche =================== */
  await bloc("G. rappel du dimanche (bandeau de l'accueil)", async () => {
    const db = base({ comptes: [compteTest({ liste: [entreeDim(7, 7)] }, null)] });
    const { page } = await sur(b, TESTEUR, db, 20, 10, 0, "", "#acc-vue h1");
    const bd = await page.evaluate(() => { const x = document.querySelector("#acc-vue [data-fbd-bandeau]"); return x ? { cls: x.className, href: x.getAttribute("href"), t: x.querySelector("strong").textContent, n: x.querySelector(".note").textContent } : null; });
    ok("G : dimanche, pas encore fait : le bandeau (.bandeau) « C'est dimanche : ton feedback de la semaine t'attend (2 minutes) » → #/suivi",
      !!bd && /\bbandeau\b/.test(bd.cls) && bd.href === "#/suivi" && bd.t === "C'est dimanche : ton feedback de la semaine t'attend (2 minutes)" && bd.n === "Une note sur 10 et trois lignes : ton coach te répond au même endroit.", JSON.stringify(bd));
    const acc = await texte(page, "#acc-vue");
    ok("G : … et la carte « Feedback de la semaine » à faire", acc.includes("Feedback de la semaine") && (await page.$('#acc-fbd [data-fbd-statut="ouvert"].attention')) !== null, acc.slice(0, 300));
    await page.click("#acc-vue [data-fbd-bandeau]"); await pret(page, "#suivi-checkin [data-fbd]");
    ok("G : un clic sur le bandeau ouvre Mon suivi, sur le formulaire", (await page.evaluate(() => courant)) === "suivi", "");
    await page.click('.note10 [data-v="8"]'); await page.click("[data-fbd] button[type=submit]"); await attendre(page, 1500);
    await aller(page, "#/accueil", 1500);
    ok("G : fait : plus de bandeau ; « Feedback de la semaine envoyé »", !(await page.$("[data-fbd-bandeau]")) && (await texte(page, "#acc-fbd")).includes("Feedback de la semaine envoyé") && (await texte(page, "#acc-fbd")).includes(`le ${fr(isoJ(20))} — ton coach te répond au même endroit, dans Mon suivi`), await texte(page, "#acc-fbd"));
    const db2 = base({ comptes: [compteTest({ liste: [entreeDim(7, 7)] }, null)] });
    const { page: p2 } = await sur(b, TESTEUR, db2, 21, 10, 0, "", "#acc-vue h1");
    let t2 = await texte(p2, "#acc-fbd");
    ok("G : lundi, pas fait : pas de bandeau ; « Ton feedback de la semaine du … n'a pas été fait. » « Tu peux encore le faire aujourd'hui. »", !(await p2.$("[data-fbd-bandeau]")) && t2.includes(`Ton feedback de la semaine du ${fr(isoJ(14))} au ${fr(isoJ(20))} n'a pas été fait.`) && t2.includes("Tu peux encore le faire aujourd'hui."), t2);
    await heure(p2, a(23, 10)); await voir(p2, "accueil"); t2 = await texte(p2, "#acc-fbd");
    ok(`G : mercredi : pas de bandeau ; « Prochain feedback : dimanche ${fr(isoJ(27))} »`, !(await p2.$("[data-fbd-bandeau]")) && t2.includes(`Prochain feedback : dimanche ${fr(isoJ(27))}`), t2);
    ok("G : l'accueil n'écrit rien", db2.ecritures.length === 0, resume(db2));
    const { page: pm } = await sur(b, TESTEUR, base({ comptes: [compteTest({ liste: [] }, null)] }), 20, 10, 0, "", "#acc-vue [data-fbd-bandeau]", { viewport: MOBILE });
    ok("G : téléphone 390 px : le bandeau sans débordement", !(await deborde(pm)), await largeur(pm));
    const dbT = base();
    const { page: pt } = await sur(b, THOMAS, dbT, 20, 10, 0, "", "#acc-vue h1");
    const at = await texte(pt, "#acc-vue");
    ok("G : Thomas, dimanche : ni bandeau, ni « Feedback de la semaine » : son accueil d'avant (« Ton bilan de la semaine est disponible »)", !(await pt.$("[data-fbd-bandeau]")) && !at.includes("Feedback de la semaine") && at.includes("Ton bilan de la semaine est disponible"), "");
  });

  /* =================== H. les alertes du coach =================== */
  await bloc("H. alertes du coach", async () => {
    const db = base({ comptes: [compteTest({ liste: [] }, null)] });
    const { page } = await sur(b, COACH, db, 22, 10, 0, "", null);
    const AL = async (c, uid, t) => { if (t) await heure(page, t); return page.evaluate(([c, uid]) => Clients.resumerUn({ id: uid, prenom: "", nom: "", role: "client", statut: "client" }, c, new Date().toISOString()).alertes.map(a => a.type + "|" + a.niveau + "|" + a.texte), [c, uid]); };
    const P = { programme: PROG_THOMAS };
    const avec = (liste, plus) => Object.assign({}, P, { checkins: Object.assign({ liste: liste }, plus || {}) });
    const note = l => l.filter(x => x.startsWith("note_chute"));
    const cas = [
      ["note 5 seule", [entreeDim(14, 5)], ["note_chute|mauvais|Note en chute : 5/10"]],
      ["note 6 seule (cas limite)", [entreeDim(14, 6)], []],
      ["8 → 6 (2 points de moins)", [entreeDim(7, 8), entreeDim(14, 6)], ["note_chute|mauvais|Note en chute : 8 → 6/10"]],
      ["8 → 7 (chute de 1, cas limite)", [entreeDim(7, 8), entreeDim(14, 7)], []],
      ["7 → 5", [entreeDim(7, 7), entreeDim(14, 5)], ["note_chute|mauvais|Note en chute : 7 → 5/10"]],
      ["6 → 9 (en hausse)", [entreeDim(7, 6), entreeDim(14, 9)], []],
      ["note 3 d'il y a deux semaines (plus la dernière)", [entreeDim(7, 3)], []]
    ];
    for (const [nom, liste, att] of cas) { const r = note(await AL(avec(liste), TESTEUR.id, a(22, 10))); ok("H : note en chute, " + nom + " → " + (att.length ? att[0].split("|")[2] : "aucune alerte"), egal(r, att), JSON.stringify(r)); }
    const e14 = entreeDim(14, 7), f = fbk(14, "Réponse", { ecrit_a: isoA(21, 9) });
    const triste = { semaine: isoJ(14), fb: f.ecrit_a, smiley: "triste", le: isoA(21, 12), deplu: "x" };
    let r = await AL(Object.assign(avec([e14], { avis: [triste] }), { feedbacks: { liste: [f] } }), TESTEUR.id);
    ok("H : 😞 plus récent que la réponse → « 😞 sur ta réponse — à traiter », niveau mauvais, en tête", r[0] === "avis_triste|mauvais|😞 sur ta réponse — à traiter", JSON.stringify(r));
    r = await AL(Object.assign(avec([e14], { avis: [triste] }), { feedbacks: { liste: [Object.assign({}, f, { ecrit_a: isoA(21, 15) })] } }), TESTEUR.id);
    ok("H : 😞 suivi d'une nouvelle réponse du coach (ecrit_a plus récent) → traité, plus d'alerte", !r.some(x => x.startsWith("avis_triste")), JSON.stringify(r));
    r = await AL(Object.assign(avec([e14], { avis: [Object.assign({}, triste, { smiley: "neutre" })] }), { feedbacks: { liste: [f] } }), TESTEUR.id);
    ok("H : 😐 → aucune alerte", !r.some(x => x.startsWith("avis_triste")), JSON.stringify(r));
    r = await AL(Object.assign(avec([e14], { avis: [triste, { semaine: isoJ(14), fb: "autre", smiley: "content", le: isoA(21, 13) }] }), { feedbacks: { liste: [f] } }), TESTEUR.id);
    ok("H : 😞 puis 😊 plus tard sur la même semaine → aucune alerte (le dernier avis compte)", !r.some(x => x.startsWith("avis_triste")), JSON.stringify(r));
    r = await AL({ checkins: { liste: [entreeDim(14, 8)] } }, TESTEUR.id);
    ok("H : feedback du dimanche reçu, sans réponse → « Feedback du dimanche reçu — à lire » (info), même sans programme", r.includes("bilan_recu|info|Feedback du dimanche reçu — à lire"), JSON.stringify(r));
    r = await AL(avec([entreeDim(7, 8)]), TESTEUR.id, a(21, 10));
    ok("H : lundi, semaine passée sans feedback → « Feedback du dimanche non fait » (attention) dès le lundi", r.includes("bilan_manque|attention|Feedback du dimanche non fait"), JSON.stringify(r));
    r = await AL(avec([entreeDim(7, 8)]), TESTEUR.id, a(24, 10));
    ok("H : jeudi, toujours pas fait → toujours « non fait »", r.includes("bilan_manque|attention|Feedback du dimanche non fait"), JSON.stringify(r));
    r = await AL(avec([entreeDim(7, 8)]), TESTEUR.id, a(20, 10));
    ok("H : dimanche (feedback ouvert) → pas de « non fait »", !r.some(x => x.startsWith("bilan_manque")), JSON.stringify(r));
    r = await AL(avec([]), F.IDS.c1, a(21, 10));
    const r2 = await AL(avec([]), F.IDS.c1, a(25, 10));
    ok("H : Thomas (bilan du vendredi), inchangé : « Bilan hebdo non complété » le lundi, rien le vendredi", r.includes("bilan_manque|attention|Bilan hebdo non complété") && !r2.some(x => x.startsWith("bilan_manque")), JSON.stringify([r, r2]));
    r = await AL(avec([entreeVen(14, { envoye_le: isoJ(20) })]), F.IDS.c1, a(21, 10));
    ok("H : Thomas, bilan du vendredi reçu → « Bilan hebdo reçu — à lire » (texte d'avant)", r.includes("bilan_recu|info|Bilan hebdo reçu — à lire"), JSON.stringify(r));
    /* à l'écran : la fiche du compte de test, note basse et 😞, alertes « mauvais » en tête */
    poser(db, TESTEUR.id, "checkins", { liste: [entreeDim(7, 8), entreeDim(14, 4)], avis: [triste] });
    poser(db, TESTEUR.id, "feedbacks", { liste: [f] });
    await heure(page, a(22, 10));
    await fiche(page, "accueil", "#acc-vue .attention-alertes");
    const al = await page.$$eval("#acc-vue .attention-alertes .pastille", l => l.map(x => x.className.replace("pastille", "").trim() + "|" + x.textContent.trim()));
    ok("H : fiche : « 😞 sur ta réponse — à traiter » et « Note en chute : 8 → 4/10 » en tête (mauvais), liens vers Préparer le call", al[0] && al[1] && al.slice(0, 2).sort().join(" / ") === "mauvais|Note en chute : 8 → 4/10 / mauvais|😞 sur ta réponse — à traiter" && (await page.$$eval('#acc-vue .attention-alertes .pastille.mauvais[href="#/bilan"]', l => l.length)) === 2, JSON.stringify(al));
    ok("H : les alertes sont calculées à l'affichage : rien n'est écrit", db.ecritures.length === 0, resume(db));
  });

  /* =================== I. anciens bilans =================== */
  await bloc("I. anciens bilans toujours lisibles", async () => {
    const db = base({ comptes: [compteTest({ liste: [entreeVen(7), entreeDim(14, 7, { training: "Séances tenues" })] }, null)] });
    const { page } = await sur(b, TESTEUR, db, 22, 10, 0, "#/suivi", "#suivi-checkin .fbd");
    const t = await texte(page, "#suivi-checkin");
    ok("I : client (feedback du dimanche) : l'ancien bilan (11 questions, sans envoye_a) dans l'historique, ses réponses lisibles", t.includes("Mes feedbacks précédents") && t.includes("4 séances tenues") && t.includes("Énergie 4/5") && t.includes("Comment s'est passée ta semaine ?") && t.includes(`Semaine du ${fr(isoJ(7))} au ${fr(isoJ(13))}`), t.slice(-500));
    const { page: pc } = await sur(b, COACH, db, 22, 10, 0, "", null);
    await fiche(pc, "bilan", `#bilan-vue [data-fb-semaine="${isoJ(7)}"]`);
    const tb = await texte(pc, "#bilan-vue");
    ok("I : coach, Préparer le call : l'ancien bilan (11 questions) et le nouveau format côte à côte, un éditeur sous chacun", tb.includes("4 séances tenues") && tb.includes("Note de la semaine 7/10") && tb.includes("Séances tenues") && (await pc.$$("#bilan-vue [data-fb-semaine]")).length >= 2, tb.slice(tb.indexOf("Ses feedbacks"), tb.indexOf("Ses feedbacks") + 300));
    const dbT = base();
    const { page: pt } = await sur(b, THOMAS, dbT, 22, 10, 0, "#/suivi", "#suivi-checkin .panel");
    ok("I : Thomas : son bilan (sans envoye_a) lisible comme avant dans Mon suivi", (await texte(pt, "#suivi-checkin")).includes("4 séances tenues"), (await texte(pt, "#suivi-checkin")).slice(0, 300));
  });

  /* =================== J. l'interrupteur =================== */
  await bloc("J. interrupteur « off » et « tous »", async () => {
    await avec([['feedback_dimanche: "test"', 'feedback_dimanche: "off"']], async () => {
      const db = base({ comptes: [compteTest({ liste: [entreeDim(7, 8, { training: "Séances faites" })] }, { liste: [fbk(7, "Réponse de la semaine d'avant.")] })] });
      const { page } = await sur(b, TESTEUR, db, 20, 10, 0, "", "#acc-vue h1");
      ok("J : off : le compte de test, dimanche : ni bandeau, ni « Feedback de la semaine » (le bilan du vendredi)", !(await page.$("[data-fbd-bandeau]")) && !(await texte(page, "#acc-vue")).includes("Feedback de la semaine") && (await page.evaluate(() => Checkin.regle())) === "vendredi", "");
      await aller(page, "#/suivi", 1500);
      const t = await texte(page, "#suivi-checkin");
      ok("J : off : Mon suivi = le bilan du vendredi (11 questions), jamais le formulaire du dimanche", !!(await page.$("[data-checkin]")) && !(await page.$("[data-fbd]")) && (await page.$$("[data-checkin] .checkin-q")).length === 11, "");
      ok("J : off : son feedback du dimanche déjà écrit reste lisible (note, case), la réponse du coach aussi", t.includes("Mes bilans précédents") && t.includes("Note de la semaine 8/10") && t.includes("Séances faites") && (await texte(page, "#vue")).includes("Réponse de la semaine d'avant."), t.slice(-300));
      const { page: pc } = await sur(b, COACH, db, 20, 10, 0, "", null);
      const rc = await pc.evaluate(id => [Checkin.regle(id), Checkin.regle()], TESTEUR.id);
      await fiche(pc, "bilan", `#bilan-vue [data-fb-semaine="${isoJ(7)}"]`);
      const tb = await texte(pc, "#bilan-vue");
      ok("J : off : le coach (et le compte de test) sur la règle du vendredi ; Préparer le call lit le nouveau format", egal(rc, ["vendredi", "vendredi"]) && tb.includes("Ses bilans hebdomadaires et ton feedback") && tb.includes("Note de la semaine 8/10") && tb.includes("Séances faites"), JSON.stringify(rc));
    });
    await avec([['feedback_dimanche: "test"', 'feedback_dimanche: "tous"']], async () => {
      const db = base();
      const { page } = await sur(b, THOMAS, db, 20, 10, 0, "", "#acc-vue h1");
      ok("J : tous : Thomas, dimanche : le bandeau du dimanche", !!(await page.$("[data-fbd-bandeau]")), "");
      await aller(page, "#/suivi", 1500);
      ok("J : tous : Thomas voit le formulaire du dimanche ; son ancien bilan reste lisible", !!(await page.$("[data-fbd]")) && !(await page.$("[data-checkin]")) && (await texte(page, "#suivi-checkin")).includes("4 séances tenues"), "");
    });
    const db = base({ comptes: [compteTest({ liste: [] }, null)] });
    const { page: ps } = await sur(b, qui(F.IDS.c2, "sarah@exemple.fr"), db, 20, 10, 0, "#/suivi", "#suivi-checkin .panel");
    ok("J : test : un autre client (Sarah), dimanche : jamais le formulaire du dimanche", !(await ps.$("[data-fbd]")) && !!(await ps.$("[data-checkin]")), "");
  });

  /* =================== K. accès (RLS simulée) =================== */
  await bloc("K. accès : client ≠ feedbacks, coach ≠ checkins", async () => {
    const db = base({ comptes: [compteTest({ liste: [entreeDim(7, 7)] }, { liste: [fbk(7, "R")] })] });
    const { page } = await sur(b, TESTEUR, db, 22, 10, 0, "#/suivi", "#suivi-checkin .fbd");
    const r = await page.evaluate(async () => {
      const uid = Auth.utilisateur().id, s = Store.ecrire("feedbacks", { liste: [] });
      let p; try { await Auth.appel("/rest/v1/donnees?on_conflict=user_id,outil", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: [{ user_id: uid, outil: "feedbacks", contenu: { liste: [] }, maj_le: new Date().toISOString() }] }); p = "passé"; } catch (e) { p = e.statut; }
      return { s, p };
    });
    await attendre(page, 1000);
    ok("K : le client ne peut pas écrire feedbacks : Store.ecrire refuse, la base aussi (403), rien de changé", r.s === false && r.p === 403 && egal(fbDe(db), { liste: [fbk(7, "R")] }) && db.refus.length === 1, JSON.stringify(r) + JSON.stringify(db.refus));
    const { page: pc } = await sur(b, COACH, db, 22, 10, 0, "", null);
    await fiche(pc, "suivi", "#suivi-checkin .fbd");
    const r2 = await pc.evaluate(async id => {
      const s = Store.ecrire("checkins", { liste: [] });
      let p; try { await Auth.appel("/rest/v1/donnees?on_conflict=user_id,outil", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: [{ user_id: id, outil: "checkins", contenu: { liste: [] }, maj_le: new Date().toISOString() }] }); p = "passé"; } catch (e) { p = e.statut; }
      return { s, p };
    }, TESTEUR.id);
    await attendre(pc, 1000);
    ok("K : le coach ne peut pas écrire checkins : Store.ecrire refuse en consultation, la base aussi (403), rien de changé", r2.s === false && r2.p === 403 && (ckDe(db).liste || []).length === 1 && db.refus.length === 2, JSON.stringify(r2) + JSON.stringify(db.refus));
  });

  /* =================== L. données piégées =================== */
  await bloc("L. données piégées", async () => {
    const CK = { liste: [ { semaine: 3, envoye_le: {}, reponses: "x", format: "dimanche" },
      { semaine: isoJ(7), fin: isoJ(13), envoye_le: isoJ(13), format: "dimanche", reponses: { note: 99, autre: PIEGE } },
      { semaine: isoJ(14), fin: isoJ(20), envoye_le: isoJ(20), envoye_a: isoA(20, 18), format: "dimanche", reponses: { note: "7", training: PIEGE, alimentation: 99, autre: null } } ],
      avis: [null, 5, "x", { semaine: isoJ(14), smiley: "<img>" }, { semaine: isoJ(14), fb: PIEGE, smiley: "triste", deplu: PIEGE, ameliorer: PIEGE, le: PIEGE }], fb_vu: { x: 1 } };
    const FB = { liste: [{ semaine: isoJ(14), fin: PIEGE, date: PIEGE, texte: PIEGE, ecrit_a: 5, bilan: PIEGE }, "x", null] };
    const db = base({ comptes: [compteTest(CK, FB)] });
    const xss = async p => p.evaluate(() => (window.__xss || 0) + document.querySelectorAll("img[data-xss]").length);
    let n = 0, detail = "";
    const { page } = await sur(b, TESTEUR, db, 22, 10, 0, "", "#acc-vue h1");
    for (const h of ["#/accueil", "#/suivi", "#/programme", "#/suivi"]) { await aller(page, h, 1400); const x = await xss(page); n += x; if (x) detail += h + " "; }
    const t = await texte(page, "#suivi-checkin");
    ok("L : client : checkins et feedbacks piégés : les pages s'affichent, rien ne s'exécute, les textes restent du texte", n === 0 && t.includes('<img src="x"') && !(await page.$("#page-illisible")), detail + " " + t.slice(0, 200));
    ok("L : une note écrite hors des règles (« 7 » en texte, 99) n'est jamais affichée comme note", !/Note de la semaine (7|99)\/10/.test(t) && !t.includes("note 99/10") && !t.includes("note 7/10"), t.slice(0, 400));
    await heure(page, a(27, 10)); await voir(page, "suivi");
    ok("L : dimanche suivant, avec ces données : le formulaire s'affiche", !!(await page.$("[data-fbd]")) && (await xss(page)) === 0, "");
    const { page: pc } = await sur(b, COACH, db, 22, 10, 0, "", null);
    for (const [cb, sel] of [["accueil", "#acc-vue .masthead"], ["bilan", "#bilan-vue .panel"], ["suivi", "#suivi-checkin .panel"]]) { await fiche(pc, cb, sel); const x = await xss(pc); n += x; if (x) detail += cb + " "; }
    await aller(pc, "#/tableau", 1800); n += await xss(pc); await aller(pc, "#/clients", 1800); n += await xss(pc);
    ok("L : coach : fiche, Préparer le call, Son suivi, tableau de bord, Mes clients : rien ne s'exécute, aucune page illisible", n === 0 && !(await pc.$("#page-illisible")), detail);
    /* un avis qui n'est pas une liste : le smiley la remplace par une vraie liste, la liste des feedbacks intacte */
    const e14 = entreeDim(14, 6), f14 = fbk(14, "Réponse", { bilan: e14.envoye_a });
    const db2 = base({ comptes: [compteTest({ liste: [e14], avis: "pas une liste", fb_vu: f14.ecrit_a }, { liste: [f14] })] });
    const { page: p2 } = await sur(b, TESTEUR, db2, 22, 10, 0, "#/suivi", "#suivi-checkin [data-smiley]");
    await p2.click('.fbd-reponse [data-smiley="neutre"]'); await attendre(p2, 1300);
    const C2 = ckDe(db2);
    ok("L : avis piégé (pas une liste) : le smiley écrit une vraie liste, rien d'autre ne bouge", Array.isArray(C2.avis) && C2.avis.length === 1 && C2.avis[0].smiley === "neutre" && egal(C2.liste, [e14]), JSON.stringify(C2));
    const db3 = base({ comptes: [compteTest({ liste: [e14] }, { liste: "pas une liste" })] });
    const { page: p3 } = await sur(b, TESTEUR, db3, 22, 10, 0, "#/suivi", "#suivi-checkin .fbd");
    ok("L : feedbacks piégé (liste qui n'en est pas une) : Mon suivi s'affiche, « Ton coach n'a pas encore répondu. »", (await texte(p3, "#suivi-checkin")).includes("Ton coach n'a pas encore répondu.") && !(await p3.$("#page-illisible")), "");
  });

  /* =================== M. anglais =================== */
  await bloc("M. anglais", async () => {
    const manque = await (async () => { const db = base(); const { page } = await sur(b, THOMAS, db, 22, 10, 0, "", null); return page.evaluate(l => l.filter(k => !I18N.en[k]), NOUVEAUX); })();
    ok("M : chaque phrase du feedback du dimanche a son anglais dans I18N.en", manque.length === 0, JSON.stringify(manque));
    const db = base({ comptes: [compteTest({ liste: [entreeDim(7, 8, { training: "x" })] }, { liste: [fbk(7, "Réponse du coach.")] })] }); avecEn(db, TESTEUR.id);
    const { page } = await sur(b, TESTEUR, db, 20, 10, 0, "", "#acc-vue [data-fbd-bandeau]", { langue: "en" });
    const acc = await texte(page, "#acc-vue");
    ok("M : accueil en anglais : « It's Sunday: your weekly feedback is waiting for you (2 minutes) », « Weekly feedback »", acc.includes("It's Sunday: your weekly feedback is waiting for you (2 minutes)") && acc.includes("A score out of 10 and three lines: your coach replies in the same place.") && acc.includes("Weekly feedback"), acc.slice(0, 300));
    await aller(page, "#/suivi", 1600);
    const t = await texte(page, "#suivi-checkin");   // textContent : les libellés en capitales (CSS) gardent leur casse
    const aria = await page.$eval('.note10 [data-v="7"]', x => x.getAttribute("aria-label"));
    ok("M : Mon suivi en anglais : la question, Training / Nutrition / Other, « Send my feedback », « 7 out of 10 »", t.includes("How well do you think you worked this week?") && t.includes("Training") && t.includes("Nutrition") && t.includes("Other") && t.includes("Send my feedback") && t.includes("The score is required; the three boxes are optional.") && aria === "7 out of 10", t.slice(0, 500) + " " + aria);
    ok("M : l'historique en anglais : « My previous feedback », « score 8/10 », « Your coach's reply », smileys « Not really / So-so / Yes »", t.includes("My previous feedback") && t.includes("score 8/10") && t.includes("Your coach's reply") && t.includes("Did this reply help you?") && t.includes("Not really") && t.includes("So-so") && t.includes("Yes"), t.slice(-500));
    const restes = ["Selon toi", "Réponse de ton coach", "Prochain feedback", "Cette réponse", "Pas vraiment", "Mes feedbacks précédents", "n'a pas été fait", "Envoyer mon feedback", "Feedback de la semaine", "C'est dimanche", "La note est obligatoire"].filter(x => t.includes(x) || acc.includes(x));
    ok("M : aucune phrase du chantier restée en français", restes.length === 0, JSON.stringify(restes));
    await heure(page, a(23, 10)); await voir(page, "suivi");
    const t2 = await texte(page, "#suivi-checkin");
    await heure(page, a(21, 10)); await voir(page, "accueil");
    const t3 = await texte(page, "#acc-fbd");
    ok("M : « Next feedback: Sunday … » (mercredi), « Your feedback for the week of … wasn't done. » « You can still do it today. » (lundi)", t2.includes(`Next feedback: Sunday ${us(isoJ(27))}`) && t3.includes(`Your feedback for the week of ${us(isoJ(14))} to ${us(isoJ(20))} wasn't done.`) && t3.includes("You can still do it today."), t2.slice(0, 120) + " | " + t3);
  });

  /* =================== N. téléphone 390 px et ordi =================== */
  await bloc("N. téléphone 390 px et ordi", async () => {
    const donnees = () => base({ comptes: [compteTest({ liste: [entreeDim(7, 8, { training: "Une phrase assez longue pour voir si le texte passe à la ligne sur un petit écran de téléphone." })] }, { liste: [fbk(7, "Une réponse du coach, elle aussi assez longue pour passer à la ligne.")] })] });
    const { page } = await sur(b, TESTEUR, donnees(), 20, 10, 0, "#/suivi", "#suivi-checkin [data-fbd]", { viewport: MOBILE });
    const g = await page.evaluate(() => { const l = Array.from(document.querySelectorAll(".note10 button")).map(x => x.getBoundingClientRect()); return { n: l.length, rangs: new Set(l.map(r => Math.round(r.top))).size, h: Math.min(...l.map(r => r.height)), dedans: l.every(r => r.left >= 0 && r.right <= innerWidth) }; });
    ok("N : téléphone : 10 boutons de note tactiles (deux rangées de 5, 44 px de haut au moins), dans l'écran", g.n === 10 && g.rangs === 2 && g.h >= 44 && g.dedans, JSON.stringify(g));
    ok("N : téléphone : Mon suivi (formulaire, historique, smileys) sans débordement", !(await deborde(page)), await largeur(page));
    const sm = await page.evaluate(() => { const h = Array.from(document.querySelectorAll("[data-smiley]")).map(x => x.getBoundingClientRect().height).filter(x => x > 0); return h.length >= 3 ? Math.min(...h) : 0; });
    ok("N : téléphone : smileys tactiles (44 px au moins)", sm >= 44, String(sm));
    await aller(page, "#/accueil", 1500);
    ok("N : téléphone : l'accueil (bandeau, carte) sans débordement", !(await deborde(page)) && !!(await page.$("[data-fbd-bandeau]")), await largeur(page));
    const { page: po } = await sur(b, TESTEUR, donnees(), 20, 10, 0, "#/suivi", "#suivi-checkin [data-fbd]");
    const go = await po.evaluate(() => new Set(Array.from(document.querySelectorAll(".note10 button")).map(x => Math.round(x.getBoundingClientRect().top))).size);
    ok("N : ordi : les 10 boutons sur une rangée, sans débordement", go === 1 && !(await deborde(po)), String(go));
    const { page: pc } = await sur(b, COACH, donnees(), 21, 10, 0, "", null, { viewport: MOBILE });
    await fiche(pc, "bilan", "#bilan-vue [data-fb-semaine]");
    ok("N : téléphone : Préparer le call du coach sans débordement", !(await deborde(pc)), await largeur(pc));
  });

  /* =================== O. naviguer n'écrit rien =================== */
  await bloc("O. naviguer n'écrit rien (compte de test)", async () => {
    const db = base({ comptes: [compteTest({ liste: [entreeDim(7, 8), entreeDim(14, 7)], fb_vu: isoA(21, 9) }, { liste: [fbk(14, "Vue.")] })] });
    const { page } = await sur(b, TESTEUR, db, 22, 10, 0, "", "#acc-vue h1");
    for (const h of ["#/programme", "#/nutrition", "#/mensurations", "#/suivi", "#/profil", "#/accueil", "#/suivi"]) await aller(page, h, 1200);
    await attendre(page, 1000);
    ok("O : accueil, programme, nutrition, progression, Mon suivi (réponse déjà vue), profil : aucune écriture, aucune lecture de notes_coach", db.ecritures.length === 0 && lu(db, "notes_coach") === 0, resume(db));
  });

  /* =================== Z. rien vers l'extérieur =================== */
  await bloc("Z. hôtes externes", async () => {
    const autres = Array.from(externes).filter(h => !/^img\.youtube\.com$/.test(h));   // v66 : plus d'exception pour Google Fonts (polices hébergées)
    ok("aucune requête vers un autre hôte que la page, le faux Supabase et les aperçus YouTube (bloqués) ; plus aucune vers Google Fonts", autres.length === 0, JSON.stringify(autres));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
