/* verif58 — Chantier 4 (v53) : le côté coach sans score ni température, la coche « Bilan réservé », le suivi des visites
   des clients derrière l'interrupteur CONFIG.nouveautes.suivi_visites_clients, la liste newsletter en CSV et le compteur
   (chantier 2, §2 et §4). Vérifié de bout en bout dans un vrai navigateur.
   A. tableau de bord : 2 tuiles (Clients → #/clients, Prospects → #/prospects), urgences en badge (0 : neutre, 1,
      plusieurs : en couleur), info-bulle, « À traiter maintenant » (5 lignes au plus, dans l'ordre, un clic → la fiche sur
      le bon onglet ; absente quand rien n'est urgent), plus de tuile « Prospects en découverte » ni de Nouveautés (le badge
      de l'onglet Prospects est toujours calculé), aucune écriture ;
   B. Mes clients : retour de la semaine selon la règle de CHAQUE client (feedback du dimanche pour le compte de test : fait /
      à traiter ; bilan du vendredi pour Thomas : à lire), dernière note, dernier smiley, dernière visite et jours actifs sur
      30 jours (« — » pour un client dont les visites ne sont pas suivies, même avec une ancienne clé activite), 😞 et notes en
      chute en haut, puis les retours à traiter ; « Passer client » / « Repasser prospect » toujours là ; aucune température ;
   C. page Prospects : ni score, ni température, ni journal des emails (aucune requête emails_prospects) ; date
      d'inscription, 3 réponses, bilan réservé, newsletter, dernière visite, jours actifs ; « À traiter » (même définition
      que le badge), « Appel fait », « Tous » ; filtres bilan / newsletter / période, tri inscription / dernière visite,
      recherche ; compteur inscrits → 3 questions → bilans réservés → clients ; Nouveautés (case « J'ai réservé ») ;
   D. export CSV des prospects (colonnes à jour, relu comme un vrai CSV : BOM, guillemets, = + - @ neutralisés) ;
   E. « Bilan réservé » en un clic dans la fiche (sans fenêtre) : écriture EXACTE de suivi_prospect (PATCH conditionnel,
      bilan_le + événement historique, le reste gardé), annulation, création (POST), conflit rejoué, 409, verrou ; tous les
      lecteurs suivent la coche (fiche, carte, Mes clients, filtre, compteur, CSV, Nouveautés, à traiter) ; l'ancienne case
      du prospect reste lisible (« Le prospect a coché « J'ai réservé » le … ») ; ancien client : coche d'avant ignorée ;
   F. relances, issues (Signé / Perdu / Absent, annuler, Passer client), conflit, 409, 504, verrou, issues qui vieillissent,
      ancien client (blocs repris de verif49, sortie du banc avec le score et la température) ;
   G. suivi des visites : « test » (seul le compte de test écrit activite, son Accueil compté ; Thomas jamais), « off »
      (personne), « tous » (Thomas aussi) ; le coach jamais, une fiche consultée jamais ; « Inactif depuis N j » garde la
      dernière saisie ;
   H. liste newsletter (emails.newsletter === true seulement : retrait, ancien accord, valeurs piégées exclus ; prospects
      et clients), compteur, export CSV (BOM, colonnes, neutralisation) ;
   I. téléphone 390 px et ordi ; J. données piégées ; K. 1 000 prospects < 2 s ; L. prospect et client : pas de page coach,
      suivi_prospect illisible ; Z. aucun appel vers l'extérieur.
   Supabase simulé (gabarit de verif55, repris de verif57) : rien ne part vers la vraie base (routage par NOM D'HÔTE) ;
   règles de la base reproduites (HANDOFF §2.3, v49) ; appelant reconnu à son jeton ; chaque écriture appliquée en mémoire
   et notée (avec sa condition maj_le), chaque lecture aussi ; pannes simulées pour suivi_prospect (autre onglet qui écrit
   entre la lecture et l'écriture, ligne cachée à la lecture → 409, écriture lente, 504 sur le passage en client). Dates
   relatives au lancement. Chaque bloc tourne à part (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif58.js ../index.html
           VERIF58_PORT=9741 node verif58.js ../index.html     (autre port, si 9740 est pris)
           VERIF58_BLOCS="A.,E." node verif58.js …              (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF58_PORT || 9740;
const BLOCS = (process.env.VERIF58_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
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
const PID = k => "00000000-0000-4000-8000-0000000058" + String(k).padStart(2, "0");   // verif58 : …58kk (une plage par suite)

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

/* ---------- aides d'écran ---------- */
async function coachSur(b, db, hash, sel, opts){
  const x = await contexte(b, COACH, db, opts);
  await x.page.goto(URL0 + (hash || "")); await pret(x.page, sel || "#vue");
  return x;
}
const uids = page => page.$$eval("#pr-liste .sc-carte", l => l.map(e => e.dataset.uid)).catch(() => []);
const carte = (page, uid) => page.$eval(`#pr-liste .sc-carte[data-uid="${uid}"]`, e => e.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim()).catch(() => "");
const filtre = async (page, f) => { await page.click(`[data-filtre="${f}"]`); await attendre(page, 400); };
const choisir = async (page, sel, v) => { await page.selectOption(sel, v); await attendre(page, 400); };
const chercher = async (page, q) => { await page.fill("#pr-q", q); await attendre(page, 600); };
const bouton = async (page, txt) => { await page.click(`.modale button:has-text("${txt}")`); };
async function exporter(page, sel){
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 6000 }), page.click(sel || "#pr-csv")]);
  return { nom: dl.suggestedFilename(), t: fs.readFileSync(await dl.path(), "utf8") };
}
/* un vrai lecteur de CSV (guillemets, point-virgule, CRLF) */
function lireCSV(s){
  const L = []; let ligne = [], champ = "", dans = false;
  for (let i = 0; i < s.length; i++) { const ch = s[i];
    if (dans) { if (ch === '"') { if (s[i + 1] === '"') { champ += '"'; i++; } else dans = false; } else champ += ch; continue; }
    if (ch === '"') dans = true; else if (ch === ";") { ligne.push(champ); champ = ""; } else if (ch === "\r" && s[i + 1] === "\n") { ligne.push(champ); L.push(ligne); ligne = []; champ = ""; i++; } else champ += ch; }
  return L;
}
/* la ligne d'un compte dans Mes clients : { colonne (data-l) : texte } */
const ligneClient = (page, uid) => page.$eval(`#tb-clients [data-ouvrir="${uid}"]`, bt => { const o = {}; bt.closest("tr").querySelectorAll("td").forEach(td => { o[td.dataset.l || "_"] = td.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim(); }); return o; }).catch(() => ({}));
const ordreClients = page => page.$$eval("#tb-clients [data-ouvrir]", l => l.map(e => e.dataset.ouvrir)).catch(() => []);
const lignesFiche = (page, sel) => page.$$eval(sel + " ul.fiche-l > li", l => l.map(li => [li.querySelector("span") ? li.querySelector("span").textContent.replace(/\s+/g, " ").trim() : "", li.querySelector("b") ? li.querySelector("b").textContent.replace(/\s+/g, " ").trim() : ""])).catch(() => []);
const valeur = (L, k) => (L.find(x => x[0] === k) || [])[1];
async function ficheDe(page, uid, nom, sel){
  /* même adresse #/accueil d'une fiche à l'autre : on en sort d'abord (sinon aucun changement d'adresse, la fiche ne change pas) */
  if ((await page.evaluate(() => location.hash)) !== "#/clients"){ await page.evaluate(() => { location.hash = "#/clients"; }); await page.waitForSelector("#tb-clients [data-ouvrir]", { timeout: 10000 }); await attendre(page, 300); }
  await page.evaluate(([id, n]) => Clients.ouvrir(id, n, "accueil"), [uid, nom]);
  await page.waitForSelector(sel || "#fiche-reponses", { timeout: 10000 }); await attendre(page, 600);
}
const chrono = page => page.$$eval("#fiche-chrono .dc-chrono li span", l => l.map(e => e.textContent.trim())).catch(() => []);
const badgeNv = page => page.$$eval('#nav a[data-id="prospects"] .nav-badge', l => l.map(e => e.textContent.trim())).catch(() => []);
const tuileTb = (page, id) => page.$eval("#" + id, e => ({ href: e.getAttribute("href"), lbl: (e.querySelector(".t-lbl") || {}).textContent, val: ((e.querySelector(".t-val") || {}).textContent || "").trim(), badge: ((e.querySelector(".tb-badge") || {}).textContent || "").trim(), cls: (e.querySelector(".tb-badge") || {}).className || "", titre: e.getAttribute("title") || "" })).catch(() => null);
const aTraiterTb = page => page.$$eval("#tb-a-traiter .tb-liste li", l => l.map(li => ({ t: li.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim(), uid: (li.querySelector("[data-fiche]") || {}).dataset ? li.querySelector("[data-fiche]").dataset.fiche : "", cible: li.querySelector("[data-fiche]") ? li.querySelector("[data-fiche]").dataset.cible : "" }))).catch(() => []);
const injecte = page => page.evaluate(() => !!window.__xss || !!document.querySelector("[data-xss]")).catch(() => true);
const cacher = page => page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }); document.dispatchEvent(new Event("visibilitychange")); });
const montrer = page => page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" }); document.dispatchEvent(new Event("visibilitychange")); });
const toasts = page => page.evaluate(() => (window.__toasts || []).slice()).catch(() => []);
/* écritures de suivi_prospect chez un prospect, et la condition (maj_le=…) de chaque PATCH */
const ecrSuivi = (db, uid) => ecr(db, "suivi_prospect", uid);
const conds = (db, uid) => db.conditions.filter(x => x.uid === uid && x.outil === "suivi_prospect").map(x => x.maj_le);

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF58_PORT=9741 node verif58.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();
  URL0 = `http://localhost:${PORT}/`;

  /* =================== A. tableau de bord : 2 tuiles, urgences en badge, « À traiter maintenant » =================== */
  await bloc("A. tableau de bord, aucune urgence", async () => {
    /* v59 : dans le fichier, une seule valeur connue (off, test ou tous : Lucas peut passer « tous ») ; le banc la sert sur « test » (fichiers.js) */
    const sv = valeursNouveaute(SRC, "suivi_visites_clients");
    ok("A : le compte de test est lu dans le fichier servi ; l'interrupteur des visites des clients a une seule valeur connue dans le fichier (off, test ou tous) et il est servi sur « test »", !!TEST_ID && sv.length === 1 && ["off", "test", "tous"].includes(sv[0]) && JSON.stringify(valeursNouveaute(sourceServie(HTML), "suivi_visites_clients")) === '["test"]', String(TEST_ID) + " " + JSON.stringify(sv));
    /* Sarah seule (programme et diète à envoyer : des alertes « attention », pas des urgences), aucun prospect */
    const db = decor({ test: false, prospects: false, sans: [F.IDS.c1, F.IDS.c3], cles: [] });
    db.donnees = db.donnees.filter(d => !(d.user_id === F.IDS.c2 && d.outil === "checkins"));
    const { page } = await coachSur(b, db, "", "#tb-vue .tb-tiles");
    const tc = await tuileTb(page, "tb-t-clients"), tp = await tuileTb(page, "tb-t-prospects");
    ok("A : deux tuiles seulement, « Clients » → #/clients et « Prospects » → #/prospects", (await page.$$("#tb-vue .tb-tuile")).length === 2 && tc && tc.href === "#/clients" && tc.lbl === "Clients" && tp && tp.href === "#/prospects" && tp.lbl === "Prospects", JSON.stringify([tc, tp]));
    ok("A : Clients 1 (Sarah), Prospects 0 ; badges « 0 urgence » sans couleur (pastille neutre, ni « mauvais » ni « attention »)", tc.val === "1" && tp.val === "0" && tc.badge === "0 urgence" && tp.badge === "0 urgence" && !/mauvais|attention|accent|ok/.test(tc.cls + " " + tp.cls), JSON.stringify([tc, tp]));
    ok("A : aucune urgence : pas de liste « À traiter maintenant », « Rien d'urgent aujourd'hui. »", !(await page.$("#tb-a-traiter")) && (await texte(page, "#tb-vue .lede")) === "Rien d'urgent aujourd'hui.", await texte(page, "#tb-vue .lede"));
    const t = await texte(page, "#tb-vue");
    ok("A : plus de tuile « Prospects en découverte », ni « Clients actifs », ni Nouveautés, ni score, ni température", !/Prospects en découverte|Clients actifs|Bilans à traiter|Nouveautés|\/100|CHAUD|TIÈDE|FROID|NOUVEAU/.test(t) && !(await page.$("#tb-nouveautes, #tb-prospects, .attention-c")), t.slice(0, 300));
    ok("A : aucune écriture, aucune requête au journal des emails", db.ecritures.length === 0 && !db.chemins.some(x => /emails_prospects/.test(x)), resume(db));
  });
  await bloc("A. tableau de bord, une urgence", async () => {
    /* Sarah et Julien (inactif depuis 12 jours : une alerte « mauvais ») */
    const db = decor({ test: false, prospects: false, sans: [F.IDS.c1] });
    db.donnees = db.donnees.filter(d => !(d.user_id === F.IDS.c2 && d.outil === "checkins"));
    const { page } = await coachSur(b, db, "#/tableau", "#tb-vue .tb-tiles");
    const tc = await tuileTb(page, "tb-t-clients"), tp = await tuileTb(page, "tb-t-prospects"), L = await aTraiterTb(page);
    ok("A : 1 urgence client : badge « 1 urgence » en couleur (mauvais) ; Prospects « 0 urgence » neutre ; « 1 urgence aujourd'hui. »", tc.val === "2" && tc.badge === "1 urgence" && /\bmauvais\b/.test(tc.cls) && tp.badge === "0 urgence" && !/mauvais/.test(tp.cls) && (await texte(page, "#tb-vue .lede")) === "1 urgence aujourd'hui.", JSON.stringify([tc, tp]));
    ok("A : « À traiter maintenant » : une ligne, Julien « Inactif depuis 12 j », bouton vers sa fiche (vue d'ensemble)", L.length === 1 && L[0].uid === F.IDS.c3 && L[0].t.includes("Julien Démo") && L[0].t.includes("Inactif depuis 12 j") && L[0].cible === "accueil", JSON.stringify(L));
    ok("A : info-bulle des tuiles : ce qui compte comme urgence (clients : 😞, note en chute, retour à lire, inactivité ; prospects : 48 h, clic « Réserver »)", /😞/.test(tc.titre) && /note en chute/.test(tc.titre) && /48 h/.test(tp.titre) && /Réserver mon bilan/.test(tp.titre), tc.titre + " | " + tp.titre);
    await page.click(`#tb-a-traiter [data-fiche="${F.IDS.c3}"]`); await page.waitForSelector("#acc-vue .masthead h1", { timeout: 8000 }); await attendre(page, 800);
    ok("A : un clic sur « Ouvrir » → la fiche de Julien (bandeau de consultation, écran « accueil »)", (await page.evaluate(() => [courant, Store.idConsulte])).join("|") === "accueil|" + F.IDS.c3, JSON.stringify(await ou(page)));
    ok("A : aucune écriture", db.ecritures.length === 0, resume(db));
  });
  await bloc("A. tableau de bord, plusieurs urgences", async () => {
    const db = decor();
    const { page } = await coachSur(b, db, "#/tableau", "#tb-a-traiter");
    const tc = await tuileTb(page, "tb-t-clients"), tp = await tuileTb(page, "tb-t-prospects"), L = await aTraiterTb(page);
    ok("A : Clients 5 (Thomas, Sarah, Julien, le compte de test, Karim) « 4 urgences » ; Prospects 8 « 4 urgences » (Zoé signée, Inès case cochée, Léa clic, Marc 10 h) ; en couleur", tc.val === "5" && tc.badge === "4 urgences" && /mauvais/.test(tc.cls) && tp.val === "8" && tp.badge === "4 urgences" && /mauvais/.test(tp.cls) && (await texte(page, "#tb-vue .lede")) === "8 urgences aujourd'hui.", JSON.stringify([tc, tp]));
    const att = [TESTEUR.id, F.IDS.c2, F.IDS.c1, ZOE, INES];
    ok("A : « À traiter maintenant » : 5 lignes au plus, dans l'ordre : 😞 (compte de test, « Sans nom »), note en chute (Sarah), bilan à lire (Thomas), Zoé « Signé : à passer client », Inès « A coché « J'ai réservé » »", L.length === 5 && JSON.stringify(L.map(x => x.uid)) === JSON.stringify(att) && L[0].t.includes("Sans nom") && L[0].t.includes("😞 sur ta réponse — à traiter") && L[1].t.includes("Note en chute : 4/10") && L[2].t.includes("Bilan hebdo reçu — à lire") && L[3].t.includes("Signé : à passer client") && L[4].t.includes("A coché « J'ai réservé » : à vérifier"), JSON.stringify(L));
    ok("A : « Et 3 autres » (Léa, Marc, Julien) avec les liens Mes clients et Prospects ; boutons vers le bon onglet (😞 → Préparer le call, prospect → sa fiche)", (await texte(page, "#tb-a-traiter")).includes("Et 3 autres : Mes clients → · Prospects →") && L[0].cible === "bilan" && L[3].cible === "accueil", await texte(page, "#tb-a-traiter"));
    ok("A : le badge des Nouveautés de l'onglet Prospects est calculé sans panneau (inscriptions, questionnaires, clics, case d'Inès des 7 derniers jours)", JSON.stringify(await badgeNv(page)) === '["' + (await page.evaluate(() => Nouveautes.n)) + '"]' && (await page.evaluate(() => Nouveautes.n)) > 0 && !(await page.$("#tb-nouveautes")), JSON.stringify(await badgeNv(page)));
    await page.click(`#tb-a-traiter [data-fiche="${ZOE}"]`); await page.waitForSelector("#fiche-commercial", { timeout: 8000 }); await attendre(page, 600);
    ok("A : un clic → la fiche de Zoé, « Passer client » à portée de main", !!(await page.$('#fiche-commercial [data-sc="client"]')) && (await page.evaluate(() => Store.idConsulte)) === ZOE);
    await aller(page, "#/tableau", 1500);
    await page.click("#tb-t-prospects"); await page.waitForSelector("#pr-liste", { timeout: 8000 }); await attendre(page, 500);
    ok("A : la tuile Prospects mène à la page Prospects, « À traiter » : les 4 mêmes (même définition que le badge)", (await page.evaluate(() => courant)) === "prospects" && JSON.stringify((await uids(page)).slice().sort()) === JSON.stringify([ZOE, INES, LEA, MARC].sort()), JSON.stringify(await uids(page)));
    ok("A : aucune écriture (tableau de bord, fiche, Prospects)", db.ecritures.length === 0, resume(db));
  });

  /* =================== B. Mes clients =================== */
  await bloc("B. Mes clients : colonnes et ordre", async () => {
    const db = decor();
    const { page } = await coachSur(b, db, "#/clients", "#tb-clients [data-ouvrir]");
    const T = await ligneClient(page, TESTEUR.id), Th = await ligneClient(page, F.IDS.c1), S = await ligneClient(page, F.IDS.c2), Ju = await ligneClient(page, F.IDS.c3), Le = await ligneClient(page, LEA);
    ok("B : compte de test (feedback du dimanche, répondu) : retour « fait », note « 7/10 », smiley 😞, dernière visite « " + visiteTxt(ACT_TEST.derniere) + " », 2 jours actifs sur 30 (le jour d'il y a 40 jours ne compte pas)", T["Retour de la semaine"] === "fait" && T["Dernière note"] === "7/10" && T["Dernier smiley"] === "😞" && T["Dernière visite"] === visiteTxt(ACT_TEST.derniere) && T["Jours actifs (30 j)"] === "2", JSON.stringify(T));
    ok("B : Thomas (bilan du vendredi, sa règle) : retour « à lire », ni note ni smiley, visites « — » (non suivi, même avec une ancienne clé activite)", Th["Retour de la semaine"] === "à lire" && Th["Dernière note"] === "—" && Th["Dernier smiley"] === "—" && Th["Dernière visite"] === "—" && Th["Jours actifs (30 j)"] === "—", JSON.stringify(Th));
    ok("B : Sarah (note 4 : en chute) « 4/10 » ; Julien : visites « — », « Inactif depuis 12 j » gardé", S["Dernière note"] === "4/10" && Ju["Dernière visite"] === "—" && Ju["Jours actifs (30 j)"] === "—" && /12 j/.test(Ju["Activité"] || ""), JSON.stringify([S, Ju]));
    ok("B : prospecte Léa : visites suivies (« " + visiteTxt(avant(5 * H)) + " », 2 jours), pastilles « prospect » et « a cliqué Réserver », aucune température", Le["Dernière visite"] === visiteTxt(avant(5 * H)) && Le["Jours actifs (30 j)"] === "2" && /prospect/.test(Le.Client) && /a cliqué Réserver/.test(Le.Client) && !/CHAUD|TIÈDE|FROID|NOUVEAU/.test(Le.Client), JSON.stringify(Le));
    const o = await ordreClients(page);
    ok("B : en haut les 😞 non traités et les notes en chute (compte de test, Sarah), puis les retours à traiter (Thomas), puis le reste", JSON.stringify(o.slice(0, 2).sort()) === JSON.stringify([TESTEUR.id, F.IDS.c2].sort()) && o[2] === F.IDS.c1, JSON.stringify(o.slice(0, 5)));
    const t = await texte(page, "#vue");
    ok("B : aucune température (CHAUD, TIÈDE, FROID, NOUVEAU) ni score de prospect dans Mes clients", !/CHAUD|TIÈDE|FROID|NOUVEAU|Score/.test(t), (t.match(/.{0,30}(CHAUD|TIÈDE|FROID|NOUVEAU|Score).{0,30}/) || [""])[0]);
    const st = await page.$$eval("#liste-clients .client-l", l => l.map(e => ({ n: e.querySelector(".nom").textContent.trim(), b: (e.querySelector(".statut") || {}).textContent || "" }))).catch(() => []);
    ok("B : « Comptes » : « Passer client » pour chaque prospect, « Repasser prospect » pour chaque client", st.find(x => x.n === "Léa Martin").b === "Passer client" && st.find(x => x.n === "Thomas Démo").b === "Repasser prospect" && st.filter(x => x.b === "Passer client").length === 8, JSON.stringify(st.map(x => x.n + ":" + x.b)));
    ok("B : aucune écriture en affichant Mes clients", db.ecritures.length === 0, resume(db));
  });
  await bloc("B. Mes clients : feedback à traiter, « Passer client »", async () => {
    /* le compte de test sans réponse du coach : son feedback du dimanche est « à traiter » */
    const db = decor({ testOpts: { ck: ckTest(false), fb: null }, prospects: false });
    const { page } = await coachSur(b, db, "#/clients", "#tb-clients [data-ouvrir]");
    const T = await ligneClient(page, TESTEUR.id);
    ok("B : compte de test, feedback du dimanche sans réponse : « à traiter » (en couleur), pas de smiley", T["Retour de la semaine"] === "à traiter" && T["Dernier smiley"] === "—" && !!(await page.$(`#tb-clients [data-ouvrir="${TESTEUR.id}"]`).then(x => x.evaluate(bt => !!bt.closest("tr").querySelector('[data-l="Retour de la semaine"] .pastille.mauvais')))), JSON.stringify(T));
    const o = await ordreClients(page);
    ok("B : Sarah (note en chute) d'abord, puis les deux retours à traiter (compte de test, Thomas)", o[0] === F.IDS.c2 && JSON.stringify(o.slice(1, 3).sort()) === JSON.stringify([TESTEUR.id, F.IDS.c1].sort()), JSON.stringify(o.slice(0, 4)));
    /* « Passer client » depuis Comptes (inchangé) : un prospect ajouté */
    await page.close();
    const db2 = decor({ test: false, prospects: false, comptes: [prospect(2, "Marc", "Neuf", { cree: 10 * H })] });
    const { page: p2 } = await coachSur(b, db2, "#/clients", "#liste-clients .client-l");
    const bt = await p2.$$(".client-l .statut");
    let fait = false;
    for (const x of bt) { if ((await x.evaluate(e => e.closest(".client-l").textContent)).includes("Marc Neuf")) { await x.click(); fait = true; break; } }
    await attendre(p2, 400); await bouton(p2, "Passer client"); await attendre(p2, 1800);
    ok("B : « Passer client » (Comptes) : confirmation puis PATCH profils statut « client », Marc devient client", fait && db2.profils.find(p => p.id === MARC).statut === "client" && db2.ecritures.some(e => e.table === "profils" && e.id === MARC && e.corps && e.corps.statut === "client"), JSON.stringify(db2.ecritures.map(e => e.table + ":" + e.m)));
  });

  /* =================== C. page Prospects =================== */
  await bloc("C. page Prospects", async () => {
    const db = decor();
    const { page } = await coachSur(b, db, "#/prospects", "#pr-liste .sc-carte");
    const t = await texte(page, "#pr-vue");
    const TEMP = /score|\/100|qualification/i, TEMP2 = /CHAUD|TIÈDE|FROID|NOUVEAU|Chauds|Tièdes|Froids|Nouveaux/;   // en majuscules : « Nouveautés » reste
    ok("C : ni score, ni « /100 », ni température (CHAUD, TIÈDE, FROID, NOUVEAU), ni « Score moyen », ni « Chauds »", !TEMP.test(t) && !TEMP2.test(t), (t.match(/.{0,30}(score|\/100|CHAUD|TIÈDE|FROID|NOUVEAU).{0,30}/i) || [""])[0]);
    ok("C : aucune requête au journal des emails (emails_prospects), aucune fonction appelée", !db.chemins.some(x => /emails_prospects|functions\/v1/.test(x)), JSON.stringify(db.chemins.filter(x => /emails|functions/.test(x))));
    ok("C : en-tête « 8 comptes gratuits · 4 à traiter »", (await texte(page, "#pr-vue .masthead .lede")) === "8 comptes gratuits · 4 à traiter", await texte(page, "#pr-vue .masthead .lede"));
    ok("C : compteur « Inscrits 9 → 3 questions remplies 8 → bilans réservés 2 → clients 1 » (Karim, client passé par l'inscription, compte ; Thomas, Sarah, Julien et le compte de test non)", (await texte(page, "#pr-compteur")) === "Inscrits 9 → 3 questions remplies 8 → bilans réservés 2 → clients 1", await texte(page, "#pr-compteur"));
    ok("C : « À traiter » par défaut, dans l'ordre : Zoé (signée), Inès (case cochée), Léa (clic), Marc (10 h) ; Paul (relancé après son clic) et Hugo (bilan coché) n'y sont pas", JSON.stringify(await uids(page)) === JSON.stringify([ZOE, INES, LEA, MARC]), JSON.stringify(await uids(page)));
    const cpt = await page.$$eval("[data-filtre]", l => Object.fromEntries(l.map(e => [e.dataset.filtre, (e.querySelector(".meta") || {}).textContent])));
    ok("C : filtres « À traiter » 4, « Appel fait » 2 (Omar, Zoé), « Tous » 8", cpt.a_traiter === "4" && cpt.issues === "2" && cpt.tous === "8" && Object.keys(cpt).length === 3, JSON.stringify(cpt));
    const cl = await carte(page, LEA), cr = new Date(db.profils.find(p => p.id === LEA).cree_le);
    ok("C : carte de Léa : inscrite le " + frL(cr) + ", email, ses 3 réponses (Problème, Ce qui l'a bloqué, Dans 3 mois), bilan pas réservé, newsletter oui, dernière visite, 2 jours actifs, « à traiter », prochaine action",
      ["inscrit le " + frL(cr), "lea@exemple.fr", "Problème Perdre du gras", "Ce qui l'a bloqué « Le manque de temps »", "Dans 3 mois « Rentrer dans mon jean d'avant »", "Bilan pas réservé", "Newsletter oui", "Dernière visite " + visiteTxt(avant(5 * H)), "Jours actifs (30 j) 2", "à traiter A cliqué « Réserver mon bilan », pas de bilan coché", "Prochaine action : DM : il a cliqué « Réserver mon bilan » sans réserver, demande-lui ce qui le retient."].every(x => cl.includes(x)), cl);
    const ci = await carte(page, INES);
    ok("C : carte d'Inès (case « J'ai réservé » cochée, pas de coche du coach) : « bilan réservé » à vérifier, newsletter non, dernière visite « aucune », 0 jour actif, « Il a coché « J'ai réservé » … vérifie ton agenda »",
      ci.includes("bilan réservé") && ci.includes("Bilan à vérifier (case cochée le " + frL(avant(2 * J)) + ")") && ci.includes("Newsletter non") && ci.includes("Dernière visite aucune") && ci.includes("Jours actifs (30 j) 0") && ci.includes("vérifie ton agenda, puis coche « Bilan réservé »"), ci);
    await filtre(page, "tous");
    const cn = await carte(page, NINA), ch = await carte(page, HUGO), co = await carte(page, OMAR), cz = await carte(page, ZOE);
    ok("C : Nina (ancien questionnaire, bilan retiré par le coach) : « Anciennes réponses : dans sa fiche. », bilan pas réservé ; Hugo : « Bilan réservé le " + frL(HUGO_BILAN) + " », « Prépare le bilan »",
      cn.includes("Anciennes réponses : dans sa fiche.") && cn.includes("Bilan pas réservé") && !cn.includes("Obstacle") && ch.includes("Bilan réservé le " + frL(HUGO_BILAN)) && ch.includes("Prépare le bilan"), cn + " | " + ch);
    ok("C : issues gardées : Omar « PERDU » (relance prévue), Zoé « SIGNÉ » avec « Passer client »", co.includes("PERDU") && co.includes("Relance prévue dans 25 jours.") && cz.includes("SIGNÉ") && !!(await page.$(`#pr-liste .sc-carte[data-uid="${ZOE}"] [data-sc="client"]`)), co + " | " + cz);
    await choisir(page, "#pr-bilan", "oui");
    const bo = (await uids(page)).slice().sort();
    await choisir(page, "#pr-bilan", "non");
    const bn = (await uids(page)).length;
    await choisir(page, "#pr-bilan", "tout"); await choisir(page, "#pr-news", "oui");
    const no = await uids(page);
    await choisir(page, "#pr-news", "non");
    const nn = (await uids(page)).length;
    await choisir(page, "#pr-news", "tout");
    ok("C : filtre « Bilan réservé » : Inès et Hugo ; « pas réservé » : 6 ; « Newsletter : oui » : Léa ; « non » : 7", JSON.stringify(bo) === JSON.stringify([INES, HUGO].sort()) && bn === 6 && JSON.stringify(no) === JSON.stringify([LEA]) && nn === 7, JSON.stringify([bo, bn, no, nn]));
    await choisir(page, "#pr-periode", "24h");
    const p24 = await uids(page);
    await choisir(page, "#pr-periode", "7j");
    const p7 = (await uids(page)).length;
    await choisir(page, "#pr-periode", "tout");
    ok("C : période d'inscription : 24 h → Marc ; 7 jours → 5 (Marc, Léa, Paul, Inès, Zoé)", JSON.stringify(p24) === JSON.stringify([MARC]) && p7 === 5, JSON.stringify([p24, p7]));
    await choisir(page, "#pr-tri", "inscription");
    const ti = await uids(page);
    await choisir(page, "#pr-tri", "visite");
    const tv = await uids(page);
    ok("C : tri « inscription récente » : Marc, Léa, Paul, Inès, Zoé, Hugo, Omar, Nina ; « dernière visite » : Léa puis Hugo en tête", JSON.stringify(ti) === JSON.stringify([MARC, LEA, PAUL, INES, ZOE, HUGO, OMAR, NINA]) && tv[0] === LEA && tv[1] === HUGO, JSON.stringify([ti, tv]));
    await chercher(page, "dupre");
    ok("C : recherche « dupre » (sans accent) : Inès Dupré seule", JSON.stringify(await uids(page)) === JSON.stringify([INES]), JSON.stringify(await uids(page)));
    await chercher(page, "");
    const nv = await page.$$eval("#pr-nouveautes .nv-liste li .nv-txt", l => l.map(e => e.textContent.replace(/\s+/g, " ").trim())).catch(() => []);
    ok("C : Nouveautés (page Prospects) : « Inès Dupré · a coché « J'ai réservé » » ; la case de Hugo (bilan déjà coché par le coach) n'est plus une nouveauté", nv.includes("Inès Dupré · a coché « J'ai réservé »") && !nv.some(x => x.startsWith("Hugo Réservé · a coché")), JSON.stringify(nv));
    ok("C : aucune écriture (page, filtres, tri, recherche)", db.ecritures.length === 0, resume(db));
  });

  /* =================== D. export CSV des prospects =================== */
  await bloc("D. export CSV des prospects", async () => {
    const piege = prospect(10, "=cmd|' /C calc'!A0", "+1", { cree: 4 * J, q: 4 * J, rep: { probleme: "Perdre du gras", obstacle: "-2+3", projection: "@SUM(1+1)" }, email: "piege@exemple.fr" });
    const db = decor({ comptes: [piege] });
    const { page } = await coachSur(b, db, "#/prospects", "#pr-liste .sc-carte");
    await filtre(page, "tous");
    const { nom, t } = await exporter(page);
    const L = lireCSV(t.replace(/^﻿/, ""));
    const TETE = ["Nom", "Email", "Inscrit le", "Problème", "Ce qui l'a bloqué", "Dans 3 mois", "Questionnaire", "Bilan réservé", "Bilan réservé le", "Case « J'ai réservé » (prospect)", "Newsletter", "Dernière visite", "Jours actifs (30 j)", "Clics « Réserver mon bilan »", "Dernier clic", "Issue", "Relances", "Prochaine action"];
    ok("D : fichier « prospects-AAAA-MM-JJ.csv », BOM UTF-8, point-virgule, CRLF ; 18 colonnes à jour (ni statut, ni score, ni « Découverte »)", /^prospects-\d{4}-\d{2}-\d{2}\.csv$/.test(nom) && t.startsWith("﻿") && t.includes("\r\n") && JSON.stringify(L[0]) === JSON.stringify(TETE) && L.slice(1).every(l => l.length === 18), nom + " · " + JSON.stringify(L[0]));
    ok("D : une ligne par prospect filtré (« Tous » : 9)", L.length === 10, String(L.length));
    const lig = n => L.find(l => l[0] === n) || [];
    const lea = lig("Léa Martin"), ines = lig("Inès Dupré"), hugo = lig("Hugo Réservé"), nina = lig("Nina Ancienne"), zoe = lig("Zoé Signée");
    ok("D : Léa : email, inscrite le …, ses 3 réponses, questionnaire rempli, bilan « non », newsletter « oui », dernière visite, 2 jours actifs, 1 clic, issue vide",
      JSON.stringify(lea.slice(0, 7)) === JSON.stringify(["Léa Martin", "lea@exemple.fr", frL(db.profils.find(p => p.id === LEA).cree_le), "Perdre du gras", "Le manque de temps", "Rentrer dans mon jean d'avant", "rempli le " + frL(avant(3 * J))]) && lea[7] === "non" && lea[10] === "oui" && lea[11] === frL(avant(5 * H)) && lea[12] === "2" && lea[13] === "1" && lea[15] === "", JSON.stringify(lea));
    ok("D : Inès « à vérifier (case du prospect) » + dates ; Hugo « oui », coché le " + frL(HUGO_BILAN) + ", case du " + frL(HUGO_CASE) + " ; Nina « non » (retiré), anciennes réponses sans « Ce qui l'a bloqué » ; Zoé issue « Signé »",
      ines[7] === "à vérifier (case du prospect)" && ines[8] === frL(avant(2 * J)) && ines[9] === frL(avant(2 * J)) && hugo[7] === "oui" && hugo[8] === frL(HUGO_BILAN) && hugo[9] === frL(HUGO_CASE) && nina[7] === "non" && nina[4] === "" && nina[11] === "aucune" && zoe[15] === "Signé", JSON.stringify([ines.slice(7, 10), hugo.slice(7, 10), nina.slice(3, 12), zoe[15]]));
    const pg = L.find(l => l[1] === "piege@exemple.fr") || [];
    ok("D : cellules qui commencent par = + - @ neutralisées (apostrophe) : nom, « Ce qui l'a bloqué », « Dans 3 mois »", pg[0] === "'=cmd|' /C calc'!A0 +1" && pg[4] === "'-2+3" && pg[5] === "'@SUM(1+1)", JSON.stringify(pg.slice(0, 6)));
    await filtre(page, "a_traiter");
    const { t: t2 } = await exporter(page);
    ok("D : export filtré (« À traiter ») : 4 lignes + en-têtes", lireCSV(t2.replace(/^﻿/, "")).length === 5, String(lireCSV(t2.replace(/^﻿/, "")).length));
    ok("D : export : aucune écriture", db.ecritures.length === 0, resume(db));
  });

  /* =================== E. « Bilan réservé » coché par le coach =================== */
  await bloc("E. bilan réservé : création, retrait, remise", async () => {
    const db = decor();
    const { page } = await coachSur(b, db, "#/clients", "#tb-clients [data-ouvrir]");
    await ficheDe(page, LEA, "Léa Martin");
    ok("E : fiche de Léa : bouton « Bilan réservé » dans le suivi commercial ; plus de bloc « Score de qualification »", !!(await page.$('#fiche-commercial [data-sc="bilan"]')) && !(await page.$("#fiche-score")) && !(await texte(page, "#vue")).includes("Score"), await texte(page, "#fiche-commercial"));
    const n0 = db.ecritures.length;
    await page.click('#fiche-commercial [data-sc="bilan"]'); await attendre(page, 150);
    const modale = !!(await page.$(".modale"));
    await attendre(page, 1500);
    const E1 = ecrSuivi(db, LEA), S1 = SUIVI(db, LEA) || {};
    ok("E : un clic, sans fenêtre de confirmation : UNE écriture (POST, Léa n'avait pas de suivi), rien d'autre", !modale && db.ecritures.length === n0 + 1 && E1.length === 1 && E1[0].m === "POST", JSON.stringify(db.ecritures.slice(n0).map(e => e.outil + ":" + e.m)));
    ok("E : contenu EXACT de suivi_prospect : { bilan_le: instant, historique: [{ type: « bilan », valeur: « reserve », le: le même instant }], version: 1 }", egal(Object.keys(S1).sort(), ["bilan_le", "historique", "version"]) && /^\d{4}-\d{2}-\d{2}T/.test(S1.bilan_le || "") && egal(S1.historique, [{ type: "bilan", valeur: "reserve", le: S1.bilan_le }]) && S1.version === 1, JSON.stringify(S1));
    const dec = await lignesFiche(page, "#fiche-decouverte");
    ok("E : la fiche se redessine : « Retirer « Bilan réservé » », pastille « bilan réservé », « Bilan réservé : oui, coché par toi le … », chronologie « Tu as coché « Bilan réservé » », toast", !!(await page.$('#fiche-commercial [data-sc="bilan_non"]')) && !(await page.$('#fiche-commercial [data-sc="bilan"]')) && (await texte(page, "#fiche-commercial")).includes("bilan réservé") && valeur(dec, "Bilan réservé") === "oui, coché par toi le " + frL(S1.bilan_le) && (await chrono(page)).includes("Tu as coché « Bilan réservé »") && (await toasts(page)).some(x => x.includes("Bilan réservé noté pour Léa Martin.")), JSON.stringify(dec) + " " + JSON.stringify(await toasts(page)));
    const lu1 = db.donnees.find(d => d.user_id === LEA && d.outil === "suivi_prospect").maj_le;
    await page.click('#fiche-commercial [data-sc="bilan_non"]'); await attendre(page, 1500);
    const S2 = SUIVI(db, LEA) || {}, E2 = ecrSuivi(db, LEA);
    ok("E : « Retirer « Bilan réservé » » : un PATCH conditionnel (maj_le=eq.<date lue>), bilan_le null, historique [reserve, annule], version 1", E2.length === 2 && E2[1].m === "PATCH" && conds(db, LEA).slice(-1)[0] === "eq." + lu1 && S2.bilan_le === null && egal(S2.historique.map(e => e.type + ":" + e.valeur), ["bilan:reserve", "bilan:annule"]) && S2.version === 1 && egal(Object.keys(S2).sort(), ["bilan_le", "historique", "version"]), JSON.stringify([S2, conds(db, LEA)]));
    ok("E : de nouveau « Bilan réservé » ; fiche « non (tu l'as retiré le …) » ; chronologie « Tu as retiré « Bilan réservé » »", !!(await page.$('#fiche-commercial [data-sc="bilan"]')) && /^non \(tu l'as retiré le \d{2}\/\d{2}\/\d{4}\)$/.test(valeur(await lignesFiche(page, "#fiche-decouverte"), "Bilan réservé") || "") && (await chrono(page)).includes("Tu as retiré « Bilan réservé »"), JSON.stringify(await lignesFiche(page, "#fiche-decouverte")));
    await page.click('#fiche-commercial [data-sc="bilan"]'); await attendre(page, 1500);
    const S3 = SUIVI(db, LEA) || {};
    ok("E : remis : 3 événements, bilan_le posé ; le coach n'a jamais écrit challenge ni intake du prospect", ecrSuivi(db, LEA).length === 3 && S3.historique.length === 3 && /^\d{4}-/.test(S3.bilan_le || "") && ecr(db, "challenge").length === 0 && ecr(db, "intake").length === 0, JSON.stringify(S3));
    /* Hugo : un suivi déjà riche (relance, note) : le retrait garde tout le reste */
    const avantH = clone(SUIVI(db, HUGO));
    await ficheDe(page, HUGO, "Hugo Réservé");
    await page.click('#fiche-commercial [data-sc="bilan_non"]'); await attendre(page, 1500);
    const SH = SUIVI(db, HUGO);
    ok("E : Hugo (relance et note déjà là) : retrait = le suivi d'avant, bilan_le null, UN événement de plus (relances et note intactes)", egal(SH, Object.assign({}, avantH, { bilan_le: null, version: 1, historique: avantH.historique.concat([{ type: "bilan", valeur: "annule", le: SH.historique[SH.historique.length - 1].le }]) })), JSON.stringify([avantH, SH]));
    /* Inès : sa case compte tant que le coach n'a rien décidé ; « Retirer » la fait tomber (elle reste lisible) */
    await ficheDe(page, INES, "Inès Dupré");
    const di = await lignesFiche(page, "#fiche-decouverte");
    ok("E : Inès : « Bilan réservé : à vérifier : le prospect a coché sa case », case lisible « Le prospect a coché « J'ai réservé » le " + frL(avant(2 * J)) + " », boutons « Bilan réservé » et « Retirer »", valeur(di, "Bilan réservé") === "à vérifier : le prospect a coché sa case" && valeur(di, "Case « J'ai réservé mon bilan »") === "Le prospect a coché « J'ai réservé » le " + frL(avant(2 * J)) && !!(await page.$('#fiche-commercial [data-sc="bilan"]')) && !!(await page.$('#fiche-commercial [data-sc="bilan_non"]')), JSON.stringify(di));
    await page.click('#fiche-commercial [data-sc="bilan_non"]'); await attendre(page, 1500);
    const di2 = await lignesFiche(page, "#fiche-decouverte");
    ok("E : Inès, retiré : « non (tu l'as retiré …) », la case reste affichée comme info, clé challenge jamais touchée", /^non \(tu l'as retiré/.test(valeur(di2, "Bilan réservé") || "") && valeur(di2, "Case « J'ai réservé mon bilan »") === "Le prospect a coché « J'ai réservé » le " + frL(avant(2 * J)) && ecr(db, "challenge").length === 0 && contenu(db, "challenge", INES).reserve === avant(2 * J), JSON.stringify(di2));
    /* les lecteurs suivent la coche : page Prospects, compteur, Mes clients, tableau de bord */
    await aller(page, "#/prospects", 300); await page.waitForSelector("#pr-liste .sc-carte", { timeout: 8000 }); await attendre(page, 400);
    ok("E : page Prospects : Léa (bilan coché) sort de « À traiter » ; Hugo et Inès (bilan retiré, un clic sans bilan coché depuis) y entrent pour leur clic", JSON.stringify(await uids(page)) === JSON.stringify([ZOE, HUGO, INES, MARC]) && (await carte(page, INES)).includes("A cliqué « Réserver mon bilan », pas de bilan coché"), JSON.stringify(await uids(page)) + " " + await carte(page, INES));
    ok("E : compteur « … → bilans réservés 1 → … » (Léa ; Hugo et Inès retirés)", (await texte(page, "#pr-compteur")) === "Inscrits 9 → 3 questions remplies 8 → bilans réservés 1 → clients 1", await texte(page, "#pr-compteur"));
    await filtre(page, "tous"); await choisir(page, "#pr-bilan", "oui");
    ok("E : filtre « Bilan réservé » : Léa seule ; sa carte « Bilan réservé le … »", JSON.stringify(await uids(page)) === JSON.stringify([LEA]) && (await carte(page, LEA)).includes("Bilan réservé le " + frL(S3.bilan_le)), JSON.stringify(await uids(page)));
    await choisir(page, "#pr-bilan", "tout");
    const { t } = await exporter(page);
    const L = lireCSV(t.replace(/^﻿/, "")), lea = L.find(l => l[0] === "Léa Martin") || [], ines = L.find(l => l[0] === "Inès Dupré") || [];
    ok("E : CSV : Léa « oui » (coché le …), Inès « non » avec sa case datée", lea[7] === "oui" && lea[8] === frL(S3.bilan_le) && ines[7] === "non" && ines[8] === "" && ines[9] === frL(avant(2 * J)), JSON.stringify([lea.slice(7, 10), ines.slice(7, 10)]));
    await aller(page, "#/clients", 300); await page.waitForSelector("#tb-clients [data-ouvrir]", { timeout: 8000 }); await attendre(page, 400);
    const lL = await ligneClient(page, LEA), lI = await ligneClient(page, INES);
    ok("E : Mes clients : Léa « bilan réservé » (coché par le coach), Inès plus « bilan réservé » mais « a cliqué Réserver »", /bilan réservé/.test(lL.Client) && !/bilan réservé/.test(lI.Client) && /a cliqué Réserver/.test(lI.Client), JSON.stringify([lL.Client, lI.Client]));
    await aller(page, "#/tableau", 300); await page.waitForSelector("#tb-t-prospects", { timeout: 8000 }); await attendre(page, 400);
    ok("E : tableau de bord : Prospects « 4 urgences » (Zoé, Hugo et Inès pour leur clic, Marc)", (await tuileTb(page, "tb-t-prospects")).badge === "4 urgences", JSON.stringify(await tuileTb(page, "tb-t-prospects")));
    ok("E : seules des écritures de suivi_prospect (5 : Léa 3, Hugo 1, Inès 1), jamais d'autre clé", db.ecritures.length === 5 && db.ecritures.every(e => e.table === "donnees" && e.outil === "suivi_prospect"), resume(db));
  });
  await bloc("E. bilan réservé : conflit, 409, verrou", async () => {
    /* conflit : un autre onglet écrit le suivi de Paul entre la lecture et l'écriture → relu et rejoué, rien de perdu */
    const db = decor(); db.conflit = 1;
    const lu = db.donnees.find(d => d.user_id === PAUL && d.outil === "suivi_prospect").maj_le;
    const { page } = await coachSur(b, db, "#/clients", "#tb-clients [data-ouvrir]");
    await ficheDe(page, PAUL, "Paul Relancé");
    await page.click('#fiche-commercial [data-sc="bilan"]'); await attendre(page, 2200);
    const S = SUIVI(db, PAUL) || {}, C = conds(db, PAUL);
    ok("E : conflit (autre onglet) : le 1er PATCH (maj_le=eq.<date lue>) ne touche rien, relu puis rejoué avec la nouvelle date ; la relance de l'autre onglet est gardée (2 relances) et le bilan coché", C.length === 2 && C[0] === "eq." + lu && C[1] === "eq." + db.majAutreOnglet && S.relances.length === 2 && /^\d{4}-/.test(S.bilan_le || "") && S.historique.slice(-1)[0].type === "bilan" && ecrSuivi(db, PAUL).length === 1, JSON.stringify([C, lu, db.majAutreOnglet, S]));
    /* 409 : la ligne de Hugo existe, mais la première lecture ne la voit pas → POST refusé (409) → relue → PATCH */
    const db2 = decor(); db2.cacheLigne = 1;
    const avantH = clone(SUIVI(db2, HUGO));
    const { page: p2 } = await coachSur(b, db2, "#/clients", "#tb-clients [data-ouvrir]");
    await ficheDe(p2, HUGO, "Hugo Réservé");
    await p2.click('#fiche-commercial [data-sc="bilan_non"]'); await attendre(p2, 2200);
    const SH = SUIVI(db2, HUGO) || {};
    ok("E : création en course (409) : relue puis modifiée (PATCH conditionnel), rien de perdu (relance et historique d'avant gardés)", db2.chemins.filter(x => x === "POST /rest/v1/donnees").length === 1 && ecrSuivi(db2, HUGO).length === 1 && ecrSuivi(db2, HUGO)[0].m === "PATCH" && SH.bilan_le === null && egal(SH.relances, avantH.relances) && SH.historique.length === avantH.historique.length + 1, JSON.stringify([db2.chemins.filter(x => /donnees/.test(x) && !/^GET/.test(x)), SH]));
    /* verrou par prospect : écriture lente ; un 2e clic sur Léa pendant ce temps est ignoré avec un mot */
    const db3 = decor(); db3.retard.suivi_prospect = 2500;
    const { page: p3 } = await coachSur(b, db3, "#/clients", "#tb-clients [data-ouvrir]");
    await ficheDe(p3, LEA, "Léa Martin");
    await p3.evaluate(() => { document.querySelector('#fiche-commercial [data-sc="bilan"]').click(); });
    await attendre(p3, 200);
    await p3.evaluate(() => { const x = document.querySelector('#fiche-commercial [data-sc="bilan"]'); if (x){ x.disabled = false; x.click(); } });
    await attendre(p3, 300);
    const tt = (await toasts(p3)).join(" | ");
    await attendre(p3, 3500);
    ok("E : verrou : pendant l'écriture lente, le 2e clic est ignoré (« Une action est en cours pour Léa Martin »), une seule écriture, un seul événement", tt.includes("Une action est en cours pour Léa Martin") && ecrSuivi(db3, LEA).length === 1 && (SUIVI(db3, LEA) || {}).historique.length === 1, tt + " · " + resume(db3));
  });
  await bloc("E. bilan réservé : qui compte (Commercial.bilan)", async () => {
    const db = decor({ test: false, prospects: false });
    const { page } = await coachSur(b, db, "#/prospects", "#pr-vue");
    const r = await page.evaluate(() => {
      const J = n => new Date(Date.now() - n * 86400000).toISOString();
      const P = { statut: "prospect" }, C = n => ({ version: 1, cta: { clics: [] }, reserve: J(n) });
      const b = (S, Cc, p) => { const x = Commercial.bilan(S, Cc, p || P); return [x.reserve, x.source]; };
      return {
        rien: b({}, null), caseSeule: b({}, C(2)), coche: b({ bilan_le: J(1), historique: [{ type: "bilan", valeur: "reserve", le: J(1) }] }, null),
        retireAvecCase: b({ bilan_le: null, historique: [{ type: "bilan", valeur: "annule", le: J(1) }] }, C(2)),
        cleSansHistorique: b({ bilan_le: null }, C(2)),
        ancienClient: b({ issue: "signe", issue_le: J(60), client_le: J(59), bilan_le: J(61), historique: [{ type: "bilan", valeur: "reserve", le: J(61) }] }, C(62)),
        ancienClientCaseApres: b({ issue: "signe", issue_le: J(60), client_le: J(59), bilan_le: J(61) }, C(3)),
        clientAujourdhui: b({ bilan_le: J(61), client_le: J(59) }, null, { statut: "client" }),
        piege: b({ bilan_le: { a: 1 }, historique: "x" }, { reserve: { a: 1 } }),
        ancien7: b({}, { version: 1, jours: { "7": { reserve: J(3) } } })
      };
    });
    ok("E : Commercial.bilan : rien → non ; case seule → oui (source prospect) ; coche → oui (coach) ; coche retirée → non même avec la case ; clé bilan_le posée sans historique → le coach a décidé (non)",
      egal(r.rien, [false, null]) && egal(r.caseSeule, [true, "prospect"]) && egal(r.coche, [true, "coach"]) && egal(r.retireAvecCase, [false, null]) && egal(r.cleSansHistorique, [false, null]), JSON.stringify(r));
    ok("E : ancien client redevenu prospect : coche et case d'avant son passage en client ignorées ; une case d'après compte ; un client garde sa coche (compteur) ; valeurs piégées ignorées ; ancienne case du jour 7 du Challenge lue",
      egal(r.ancienClient, [false, null]) && egal(r.ancienClientCaseApres, [true, "prospect"]) && egal(r.clientAujourdhui, [true, "coach"]) && egal(r.piege, [false, null]) && egal(r.ancien7, [true, "prospect"]), JSON.stringify(r));
  });

  /* =================== F. relances, issues, conflits, verrou, passage client (repris de verif49) =================== */
  await bloc("F. actions sur les cartes", async () => {
    const db = decor();
    const { page } = await coachSur(b, db, "#/prospects", "#pr-liste .sc-carte");
    const clic = async (uid, act) => { await page.click(`#pr-liste .sc-carte[data-uid="${uid}"] [data-sc="${act}"]`); };
    await clic(LEA, "relance"); await attendre(page, 1800);
    const S = SUIVI(db, LEA) || {};
    ok("F : « J'ai relancé » (Léa) : suivi_prospect créé (1 relance datée, historique « relance », version 1), Léa sort de « À traiter » (relancée après son clic)", Array.isArray(S.relances) && S.relances.length === 1 && S.version === 1 && egal(S.historique.map(e => e.type), ["relance"]) && !(await uids(page)).includes(LEA), JSON.stringify(S) + " " + JSON.stringify(await uids(page)));
    await filtre(page, "tous");
    ok("F : carte de Léa : « Relancé aujourd'hui : attends sa réponse. », sous-titre « · 1 relance »", (await carte(page, LEA)).includes("Relancé aujourd'hui : attends sa réponse.") && (await carte(page, LEA)).includes("· 1 relance"), await carte(page, LEA));
    await clic(MARC, "perdu"); await attendre(page, 500); await page.fill(".modale input", "prix"); await bouton(page, "Perdu"); await attendre(page, 1800);
    const SM = SUIVI(db, MARC) || {};
    ok("F : « Perdu » (Marc) avec le motif « prix » : issue perdu datée, carte PERDU « Relance prévue dans 30 jours »", SM.issue === "perdu" && SM.note === "prix" && /^\d{4}-/.test(SM.issue_le || "") && (await carte(page, MARC)).includes("PERDU") && (await carte(page, MARC)).includes("Relance prévue dans 30 jours"), JSON.stringify(SM));
    await clic(INES, "absent"); await attendre(page, 500); await bouton(page, "Absent"); await attendre(page, 1800);
    ok("F : « Absent » (Inès) : issue absent, « Absent à l'appel : repropose-lui un créneau en DM. »", (SUIVI(db, INES) || {}).issue === "absent" && (await carte(page, INES)).includes("ABSENT") && (await carte(page, INES)).includes("repropose-lui un créneau"), await carte(page, INES));
    await clic(PAUL, "signe"); await attendre(page, 500); await bouton(page, "Signé"); await attendre(page, 1500); await bouton(page, "Plus tard"); await attendre(page, 1800);
    ok("F : « Signé » (Paul) puis « Plus tard » : issue signe, toujours prospect, carte SIGNÉ avec « Passer client », et à traiter", (SUIVI(db, PAUL) || {}).issue === "signe" && db.profils.find(p => p.id === PAUL).statut === "prospect" && (await carte(page, PAUL)).includes("SIGNÉ") && (await carte(page, PAUL)).includes("Signé : à passer client") && !!(await page.$(`#pr-liste .sc-carte[data-uid="${PAUL}"] [data-sc="client"]`)), await carte(page, PAUL));
    await clic(PAUL, "client"); await attendre(page, 500); await bouton(page, "Passer client"); await attendre(page, 2200);
    const sig = await page.$$eval("#pr-vue .tile", l => { const e = l.find(x => (x.querySelector(".t-lbl") || {}).textContent === "Signés"); return e ? e.querySelector(".t-val").textContent.trim() : ""; });
    ok("F : « Passer client » (Paul) : statut client en base, client_le noté, Paul quitte la liste des prospects, tuile « Signés » 2 (Zoé, Paul)", db.profils.find(p => p.id === PAUL).statut === "client" && /^\d{4}-/.test((SUIVI(db, PAUL) || {}).client_le || "") && !(await uids(page)).includes(PAUL) && sig === "2", sig + " " + JSON.stringify(SUIVI(db, PAUL)));
    await clic(MARC, "annuler"); await attendre(page, 500); await bouton(page, "Retirer l'issue"); await attendre(page, 1800);
    const SM2 = SUIVI(db, MARC) || {};
    ok("F : « Annuler « Perdu » » (Marc) : issue retirée, historique gardé (2 événements), Marc de nouveau à traiter (inscrit depuis moins de 48 h)", !SM2.issue && SM2.historique.length === 2 && !(await carte(page, MARC)).includes("PERDU") && (await carte(page, MARC)).includes("à traiter"), JSON.stringify(SM2) + " " + await carte(page, MARC));
    const patchs = db.ecritures.filter(e => e.table === "donnees" && e.m === "PATCH");
    ok("F : toutes les écritures sont suivi_prospect (et un passage client dans profils) ; chaque modification d'une ligne existante est un PATCH conditionnel", db.ecritures.every(e => (e.table === "donnees" && e.outil === "suivi_prospect") || (e.table === "profils" && e.m === "PATCH")) && patchs.length >= 3 && db.conditions.length === patchs.length && db.conditions.every(c => /^eq\.\d{4}-/.test(c.maj_le || "")), JSON.stringify(db.conditions));
  });
  await bloc("F. conflit, 409, 504, verrou", async () => {
    const db = decor(); db.conflit = 1;
    const lu = db.donnees.find(d => d.user_id === PAUL && d.outil === "suivi_prospect").maj_le;
    const { page } = await coachSur(b, db, "#/prospects", "#pr-liste .sc-carte");
    await filtre(page, "tous");
    await page.click(`#pr-liste .sc-carte[data-uid="${PAUL}"] [data-sc="relance"]`); await attendre(page, 2200);
    const C = conds(db, PAUL);
    ok("F : conflit d'écriture (autre onglet) : relu et rejoué, 3 relances gardées ; 1er PATCH maj_le=eq.<date lue>, le 2e sur la date de l'autre onglet", (SUIVI(db, PAUL) || {}).relances.length === 3 && C.length === 2 && C[0] === "eq." + lu && C[1] === "eq." + db.majAutreOnglet, JSON.stringify([C, SUIVI(db, PAUL)]));
    const db2 = decor(); db2.cacheLigne = 1;
    const { page: p2 } = await coachSur(b, db2, "#/prospects", "#pr-liste .sc-carte");
    await filtre(p2, "tous");
    await p2.click(`#pr-liste .sc-carte[data-uid="${PAUL}"] [data-sc="relance"]`); await attendre(p2, 2200);
    ok("F : création en course (409) : relue puis modifiée, les 2 relances gardées", ((SUIVI(db2, PAUL) || {}).relances || []).length === 2 && ecrSuivi(db2, PAUL).length === 1 && ecrSuivi(db2, PAUL)[0].m === "PATCH", JSON.stringify(SUIVI(db2, PAUL)));
    const db3 = decor(); db3.echecClient = true;
    const { page: p3 } = await coachSur(b, db3, "#/prospects", "#pr-liste .sc-carte");
    await filtre(p3, "tous");
    await p3.click(`#pr-liste .sc-carte[data-uid="${HUGO}"] [data-sc="signe"]`); await attendre(p3, 500); await bouton(p3, "Signé"); await attendre(p3, 1800); await bouton(p3, "Passer client"); await attendre(p3, 1800);
    const al = await texte(p3, ".modale");
    ok("F : « Signé » puis passage en client en échec (504) : « « Signé » est bien enregistré, mais le passage en client a échoué (erreur 504 du serveur) », issue en base, toujours prospect", al.includes("« Signé » est bien enregistré") && al.includes("(erreur 504 du serveur)") && (SUIVI(db3, HUGO) || {}).issue === "signe" && db3.profils.find(p => p.id === HUGO).statut === "prospect", al.slice(0, 200));
    await bouton(p3, "OK"); await attendre(p3, 1200);
    await filtre(p3, "tous");
    ok("F : … la carte de Hugo montre SIGNÉ avec « Passer client »", (await carte(p3, HUGO)).includes("SIGNÉ") && !!(await p3.$(`#pr-liste .sc-carte[data-uid="${HUGO}"] [data-sc="client"]`)), await carte(p3, HUGO));
    const db4 = decor(); db4.retard.suivi_prospect = 2500;
    const { page: p4 } = await coachSur(b, db4, "#/prospects", "#pr-liste .sc-carte");
    await filtre(p4, "tous");
    await p4.evaluate(k => { document.querySelector(`.sc-carte[data-uid="${k}"] [data-sc="relance"]`).click(); }, PAUL);
    await attendre(p4, 200);
    await p4.evaluate(k => { const x = document.querySelector(`.sc-carte[data-uid="${k}"] [data-sc="relance"]`); x.disabled = false; x.click(); }, PAUL);
    await attendre(p4, 300);
    const tt = (await toasts(p4)).join(" | ");
    await p4.evaluate(k => { document.querySelector(`.sc-carte[data-uid="${k}"] [data-sc="relance"]`).click(); }, MARC);
    await attendre(p4, 7000);
    ok("F : verrou par prospect : 2e clic sur Paul ignoré (« Une action est en cours pour Paul Relancé »), une seule relance de plus ; Marc relancé en parallèle", tt.includes("Une action est en cours pour Paul Relancé") && (SUIVI(db4, PAUL) || {}).relances.length === 2 && ((SUIVI(db4, MARC) || {}).relances || []).length === 1, tt + " · " + JSON.stringify([SUIVI(db4, PAUL), SUIVI(db4, MARC)].map(x => x && x.relances && x.relances.length)));
  });
  await bloc("F. issues qui vieillissent (Commercial.analyse)", async () => {
    const db = decor({ test: false, prospects: false });
    const { page } = await coachSur(b, db, "#/prospects", "#pr-vue");
    const r = await page.evaluate(() => {
      const J = n => new Date(Date.now() - n * 86400000).toISOString(), H = h => new Date(Date.now() - h * 3600000).toISOString();
      const p = n => ({ statut: "prospect", cree_le: J(n) }), ph = h => ({ statut: "prospect", cree_le: H(h) });
      const Q = n => ({ court_le: J(n), probleme: "Perdre du gras", repondues: 3, nb_questions: 3 });
      const C = o => { const x = { version: 1, jours: {}, cta: { clics: (o.clics || []).map(n => ({ jour: 1, source: "decouverte", date: typeof n === "string" ? n : J(n) })) } }; if (o.reserve != null) x.reserve = J(o.reserve); return x; };
      const a = (P, Cc, S, act, D) => { const z = Commercial.analyse(P, Cc, S, act, D); return { etat: z.etat, urgent: z.urgent, motif: z.motif, action: z.action, raisons: z.raisons.join(" "), rang: z.rang }; };
      return {
        cfg: Commercial.cfg(),
        n47: a(ph(47), null, {}, null, null), n49: a(ph(49), null, {}, null, null), nRelance: a(ph(10), null, { relances: [H(2)] }, null, null),
        clic: a(p(4), C({ clics: [1] }), {}, J(1), Q(4)), clicRelance: a(p(4), C({ clics: [2] }), { relances: [J(1)] }, J(2), Q(4)), clicPuisRelancePuisClic: a(p(6), C({ clics: [5, 1] }), { relances: [J(3)] }, J(1), Q(6)),
        caseP: a(p(4), C({ reserve: 1 }), {}, J(1), Q(4)), coche: a(p(4), C({ clics: [2] }), { bilan_le: J(1), historique: [{ type: "bilan", valeur: "reserve", le: J(1) }] }, J(1), Q(4)),
        coche8: a(p(12), null, { bilan_le: J(8), historique: [{ type: "bilan", valeur: "reserve", le: J(8) }] }, J(8), Q(12)),
        vieux: a(p(200), null, { relances: [J(40), J(30), J(20), J(10), J(5)] }, null, null),
        perdu: a(p(60), C({}), { issue: "perdu", issue_le: J(40), relances: [J(5)] }, J(41), Q(60)),
        perduClic: a(p(60), C({ clics: [1] }), { issue: "perdu", issue_le: J(10) }, J(1), Q(60)),
        absentCase: a(p(12), C({ reserve: 1 }), { issue: "absent", issue_le: J(4) }, J(1), Q(12)),
        vieuxClic: a(p(90), C({ clics: [10] }), { issue: "perdu", issue_le: J(60) }, J(10), Q(90)),
        ancienClient: a(p(200), C({ clics: [150] }), { issue: "signe", issue_le: J(120), client_le: J(119) }, J(100), Q(200)),
        futur: a(p(20), C({}), { relances: [J(8), J(7), J(6)] }, new Date(Date.now() + 5 * 86400000).toISOString(), Q(20)),
        oublie: a(p(80), C({}), { issue: "signe", issue_le: J(31) }, J(31), Q(80)),
        resigne: a(p(300), C({}), { issue: "signe", issue_le: J(0), client_le: J(200) }, J(0), Q(300)),
        client: a({ statut: "client", cree_le: J(30) }, null, { issue: "signe", issue_le: J(10) }, J(1), Q(30)),
        piege: a(p(4), { reserve: { a: 1 }, cta: { clics: "x" } }, { issue: { toString: 1 }, relances: "x", bilan_le: 5 }, J(0), { court_le: 5, repondues: "x" })
      };
    });
    ok("F : seuils de CONFIG.suivi : urgence 48 h, relances max 3, appel 7 j (plus de nouveau_heures, inactif_jours, motivation_forte)", r.cfg.urgence_heures === 48 && r.cfg.relances_max === 3 && r.cfg.appel_jours === 7 && !("nouveau_heures" in r.cfg) && !("inactif_jours" in r.cfg) && !("motivation_forte" in r.cfg), JSON.stringify(r.cfg));
    ok("F : inscrit il y a 47 h sans rien : à traiter « DM de bienvenue » ; 49 h : plus à traiter ; relancé : plus à traiter", r.n47.urgent && r.n47.motif === "nouveau" && r.n47.action === "Il vient de s'inscrire : envoie-lui un DM de bienvenue." && !r.n49.urgent && !r.nRelance.urgent && r.nRelance.action.startsWith("Relancé"), JSON.stringify([r.n47, r.n49, r.nRelance]));
    ok("F : clic sans bilan coché : à traiter (clic) ; relancé après le clic : non ; nouveau clic après la relance : de nouveau", r.clic.urgent && r.clic.motif === "clic" && !r.clicRelance.urgent && r.clicPuisRelancePuisClic.urgent && r.clicPuisRelancePuisClic.motif === "clic", JSON.stringify([r.clic, r.clicRelance, r.clicPuisRelancePuisClic]));
    ok("F : case « J'ai réservé » seule : à traiter (« vérifie ton agenda ») ; bilan coché : plus à traiter, « Prépare le bilan » ; coché il y a 8 jours : « l'appel a-t-il eu lieu ? »", r.caseP.urgent && r.caseP.motif === "case" && r.caseP.action.includes("vérifie ton agenda") && !r.coche.urgent && r.coche.action.startsWith("Prépare le bilan") && r.coche8.action.includes("l'appel a-t-il eu lieu ?"), JSON.stringify([r.caseP, r.coche, r.coche8]));
    ok("F : 5 relances sans réponse : « Sans réponse après 5 relances : classe-le « Perdu » », non urgent ; « Perdu » il y a 40 jours et relancé après : « laisse-le »", !r.vieux.urgent && r.vieux.action.includes("Sans réponse après 5 relances : classe-le « Perdu »") && r.perdu.etat === "perdu" && !r.perdu.urgent && r.perdu.action.includes("laisse-le"), JSON.stringify([r.vieux, r.perdu]));
    ok("F : « Perdu » puis reclic hier : revenu (« Revenu après l'issue « Perdu » »), à traiter pour son clic ; « Absent » puis case cochée hier : revenu, à vérifier ; clic 50 jours après « Perdu » (il y a 10 jours) : reste PERDU", r.perduClic.etat === "en_cours" && r.perduClic.raisons.includes("Revenu après l'issue « Perdu »") && r.perduClic.urgent && r.absentCase.etat === "en_cours" && r.absentCase.motif === "case" && r.vieuxClic.etat === "perdu", JSON.stringify([r.perduClic, r.absentCase, r.vieuxClic]));
    ok("F : ancien client redevenu prospect : ni SIGNÉ ni à traiter (ses clics d'avant ne comptent pas), « Ancien client redevenu prospect » ; activité dans le futur : les relances comptent ; « Signé » il y a 31 jours : rappel non urgent ; re-signé aujourd'hui : à passer client",
      r.ancienClient.etat !== "signe" && !r.ancienClient.urgent && r.ancienClient.action.includes("Ancien client redevenu prospect") && r.futur.action.includes("Sans réponse après 3 relances") && r.oublie.etat === "signe" && !r.oublie.urgent && r.oublie.action.includes("passe-le client, ou retire l'issue") && r.resigne.urgent && r.resigne.motif === "signe", JSON.stringify([r.ancienClient, r.futur, r.oublie, r.resigne]));
    ok("F : un client « Signé » : « C'est désormais un client. », non urgent ; données piégées : rien ne tombe, ni issue, ni réservation", r.client.action === "C'est désormais un client." && !r.client.urgent && !!r.piege && r.piege.etat === "en_cours" && !r.piege.raisons.includes("J'ai réservé") && !r.piege.raisons.includes("coché par toi"), JSON.stringify([r.client, r.piege]));
  });
  await bloc("F. fiche d'un client avec un ancien suivi", async () => {
    const db = decor({ test: false, prospects: false, cles: [[F.IDS.c1, "suivi_prospect", { version: 1, issue: "absent", issue_le: avant(3 * J), bilan_le: avant(4 * J) }, avant(3 * J)]] });
    const { page } = await coachSur(b, db, "#/clients", "#tb-clients [data-ouvrir]");
    await ficheDe(page, F.IDS.c1, "Thomas Démo", "#acc-vue .masthead h1");
    ok("F : fiche d'un client (ancien prospect « Absent ») : pas de « Suivi commercial », pas de bloc Découverte, pas de score, rien écrit", (await texte(page, "#vue")).includes("Fiche client") && !(await page.$("#fiche-commercial, #fiche-prospect, #fiche-score")) && db.ecritures.length === 0);
  });

  /* =================== G. suivi des visites des clients =================== */
  await bloc("G. visites : compte de test (« test »)", async () => {
    const db = decor({ prospects: false, testOpts: { act: null } });
    const { page } = await contexte(b, TESTEUR, db, { horloge: true });
    await page.goto(URL0 + "#/accueil"); await pret(page, "#acc-vue h1");
    await aller(page, "#/programme", 1200);
    await page.clock.fastForward(30000); await attendre(page, 600);
    const avantMin = ecr(db, "activite").length;
    await page.clock.fastForward(31000); await attendre(page, 2000);
    const E = ecr(db, "activite", TESTEUR.id), A = contenu(db, "activite", TESTEUR.id) || {};
    ok("G : compte de test (client, « test ») : rien à 30 s, puis UNE écriture de sa clé activite après la minute", avantMin === 0 && E.length === 1 && ecr(db, "activite").length === 1, resume(db));
    ok("G : … son Accueil compté (accueil 1, programme 1), le jour d'aujourd'hui, la dernière visite ; relue avant d'écrire", A.pages && A.pages.accueil === 1 && A.pages.programme === 1 && (A.jours || []).includes(ilYA(0)) && /^\d{4}-\d{2}-\d{2}T/.test(A.derniere || "") && db.journal.indexOf("L activite") > -1 && db.journal.indexOf("L activite") < db.journal.indexOf("E activite"), JSON.stringify(A));
    ok("G : rien d'autre écrit (seulement activite)", db.ecritures.every(e => e.outil === "activite"), resume(db));
  });
  await bloc("G. visites : Thomas (client hors test) et le coach", async () => {
    const db = decor({ prospects: false });
    const { page } = await contexte(b, THOMAS, db, { horloge: true });
    await page.goto(URL0); await pret(page, "#acc-vue h1");
    for (const h of ["#/programme", "#/nutrition", "#/suivi", "#/accueil"]) await aller(page, h, 1000);
    await cacher(page); await attendre(page, 1200); await montrer(page);
    await page.clock.fastForward(11 * MIN); await attendre(page, 1500); await cacher(page); await attendre(page, 1500);
    ok("G : Thomas (pas le compte de test) : pages, arrière-plan, 11 minutes : aucune écriture d'activite, aucune lecture de sa clé activite", ecr(db, "activite").length === 0 && lu(db, "activite") === 0 && db.ecritures.length === 0, resume(db) + " " + JSON.stringify(db.lectures.filter(x => /activite/.test(x.outil))));
    const db2 = decor({ prospects: false });
    const { page: p2 } = await contexte(b, COACH, db2, { horloge: true });
    await p2.goto(URL0 + "#/tableau"); await pret(p2, "#tb-vue .tb-tiles");
    for (const h of ["#/clients", "#/prospects", "#/tableau"]) await aller(p2, h, 1200);
    await p2.evaluate(id => Clients.ouvrir(id, "Sans nom", "accueil"), TESTEUR.id); await attendre(p2, 1500);
    await aller(p2, "#/programme", 1200);
    const consult = await p2.evaluate(() => Store.idConsulte);
    await cacher(p2); await attendre(p2, 1200); await montrer(p2);
    await p2.clock.fastForward(61000); await attendre(p2, 1500); await cacher(p2); await attendre(p2, 1500);
    ok("G : le coach (ses pages, puis la fiche du compte de test consultée) : aucune écriture d'activite (ni la sienne, ni celle du client), aucune lecture de la clé activite hors lecture de la fiche", consult === TESTEUR.id && ecr(db2, "activite").length === 0 && db2.ecritures.length === 0 && !contenu(db2, "activite", F.IDS.coach), consult + " " + resume(db2));
  });
  await bloc("G. visites : interrupteur « off » et « tous »", async () => {
    await avec([['suivi_visites_clients: "test"', 'suivi_visites_clients: "off"']], async () => {
      const db = decor({ prospects: false, testOpts: { act: null } });
      const { page } = await contexte(b, TESTEUR, db, { horloge: true });
      await page.goto(URL0 + "#/accueil"); await pret(page, "#acc-vue h1");
      await aller(page, "#/programme", 1000);
      await page.clock.fastForward(61000); await attendre(page, 1500); await cacher(page); await attendre(page, 1500);
      ok("G : « off » : même le compte de test n'écrit rien (activite), après la minute et en arrière-plan", ecr(db, "activite").length === 0 && db.ecritures.length === 0, resume(db));
      const dbc = decor();
      const { page: pc } = await coachSur(b, dbc, "#/clients", "#tb-clients [data-ouvrir]");
      const T = await ligneClient(pc, TESTEUR.id);
      ok("G : « off » : Mes clients montre « — » pour les visites du compte de test (clé activite présente)", T["Dernière visite"] === "—" && T["Jours actifs (30 j)"] === "—", JSON.stringify(T));
    });
    await avec([['suivi_visites_clients: "test"', 'suivi_visites_clients: "tous"']], async () => {
      const db = decor({ prospects: false, cles: [[F.IDS.c3, "activite", { version: 1, jours: [ilYA(0)], pages: { accueil: 1 }, temps_s: 30, derniere: avant(2 * H) }, avant(2 * H)]] });
      db.donnees = db.donnees.filter(d => !(d.user_id === F.IDS.c1 && d.outil === "activite"));
      const { page } = await contexte(b, THOMAS, db, { horloge: true });
      await page.goto(URL0); await pret(page, "#acc-vue h1");
      await page.clock.fastForward(61000); await attendre(page, 2000);
      const A = contenu(db, "activite", F.IDS.c1) || {};
      ok("G : « tous » : Thomas écrit sa clé activite (accueil compté)", ecr(db, "activite", F.IDS.c1).length === 1 && A.pages && A.pages.accueil === 1, resume(db) + " " + JSON.stringify(A));
      const { page: pc } = await coachSur(b, db, "#/clients", "#tb-clients [data-ouvrir]");
      const Ju = await ligneClient(pc, F.IDS.c3);
      ok("G : « tous » : Julien a une visite il y a 2 h (« " + visiteTxt(avant(2 * H)) + " », 1 jour actif) mais garde « Inactif depuis 12 j » (une visite n'est pas une saisie)", Ju["Dernière visite"] === visiteTxt(avant(2 * H)) && Ju["Jours actifs (30 j)"] === "1" && /12 j/.test(Ju["Activité"] || "") && (await pc.$eval(`#tb-clients [data-ouvrir="${F.IDS.c3}"]`, bt => bt.closest("tr").querySelector(".point").getAttribute("title"))).includes("Inactif depuis 12 j"), JSON.stringify(Ju));
    });
  });

  /* =================== H. liste newsletter =================== */
  await bloc("H. liste newsletter", async () => {
    const pieges = [
      prospect(11, "Tom", "Liste", { cree: 2 * J, emails: ["newsletter"] }),
      prospect(12, "Chloé", "Texte", { cree: 2 * J, emails: { newsletter: "true", maj: avant(J) } }),
      prospect(13, "=HYPERLINK(\"http://x\")", "@evil", { cree: 2 * J, q: 2 * J, rep: { probleme: "Perdre du gras" }, email: "-x@exemple.fr", emails: { newsletter: true, maj: PIEGE } })
    ];
    const db = decor({ comptes: pieges });
    const { page } = await coachSur(b, db, "#/prospects", "#pr-nl");
    const L = await page.$$eval("#pr-nl .nv-liste li", l => l.map(e => ({ uid: e.dataset.nl, t: e.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() }))).catch(() => []);
    ok("H : liste newsletter : Léa, Karim (client) et le compte piégé (accord actif) ; ni Inès (non), ni Nina (retirée dans son Profil), ni Omar (ancien accord « emails de suivi » seul), ni une clé liste ou « true » en texte ; compteur 3", egal(L.map(x => x.uid), [LEA, KARIM, PID(13)]) && (await texte(page, "#pr-nl-n")) === "3" && (await texte(page, "#pr-nl")).includes("3 personnes ont accepté la newsletter"), JSON.stringify(L));
    ok("H : chaque ligne : prénom nom, email, « depuis le … » (date de l'accord), « client » pour Karim ; date piégée : « date inconnue »", L[0].t === "Léa Martin · lea@exemple.fr depuis le " + frL(avant(3 * J)) && L[1].t === "Karim Client · karim@exemple.fr client depuis le " + frL(avant(35 * J)) && L[2].t.endsWith("date inconnue") && !(await injecte(page)), JSON.stringify(L));
    const { nom, t } = await exporter(page, "#pr-nl-csv");
    const C = lireCSV(t.replace(/^﻿/, ""));
    ok("H : export « newsletter-AAAA-MM-JJ.csv » : BOM, point-virgule, CRLF, en-têtes Prénom, Nom, Email, Date de l'accord ; 3 lignes", /^newsletter-\d{4}-\d{2}-\d{2}\.csv$/.test(nom) && t.startsWith("﻿") && t.includes("\r\n") && egal(C[0], ["Prénom", "Nom", "Email", "Date de l'accord"]) && C.length === 4 && C.every(l => l.length === 4), nom + " " + JSON.stringify(C));
    ok("H : CSV : Léa et Karim exacts ; cellules piégées neutralisées (= @ - → apostrophe), date illisible vide", egal(C[1], ["Léa", "Martin", "lea@exemple.fr", frL(avant(3 * J))]) && egal(C[2], ["Karim", "Client", "karim@exemple.fr", frL(avant(35 * J))]) && egal(C[3], ["'=HYPERLINK(\"http://x\")", "'@evil", "'-x@exemple.fr", ""]), JSON.stringify(C.slice(1)));
    ok("H : liste et export : aucune écriture", db.ecritures.length === 0, resume(db));
  });
  await bloc("H. liste newsletter : plus de 10, personne", async () => {
    const plus = []; for (let i = 0; i < 12; i++) plus.push(prospect(20 + i, "Abonné" + i, "N" + i, { cree: (10 + i) * J, news: true, newsLe: (10 + i) * J }));
    const db = decor({ comptes: plus });
    const { page } = await coachSur(b, db, "#/prospects", "#pr-nl");
    const vis = () => page.$$eval("#pr-nl .nv-liste li", l => l.filter(e => !e.closest("[hidden]")).length).catch(() => -1);
    const v0 = await vis();
    await page.click("#pr-nl-plus"); await attendre(page, 300);
    ok("H : 14 personnes : 10 affichées, « Voir les 4 autres » les déplie ; compteur 14", v0 === 10 && (await vis()) === 14 && (await texte(page, "#pr-nl-n")) === "14" && !(await page.$("#pr-nl-plus")), v0 + " / " + (await vis()));
    const db2 = decor({ prospects: false });
    const { page: p2 } = await coachSur(b, db2, "#/prospects", "#pr-nl");
    ok("H : personne : « Personne n'a encore accepté la newsletter. », pas de bouton d'export", (await texte(p2, "#pr-nl")).includes("Personne n'a encore accepté la newsletter.") && !(await p2.$("#pr-nl-csv")) && (await texte(p2, "#pr-nl-n")) === "0");
  });

  /* =================== I. téléphone 390 px et ordi =================== */
  for (const [format, viewport] of [["téléphone 390 px", MOBILE], ["ordi", ORDI]]) {
    await bloc("I. " + format, async () => {
      const db = decor();
      const { page } = await coachSur(b, db, "#/tableau", "#tb-a-traiter", { viewport });
      const d1 = !(await deborde(page));
      await aller(page, "#/clients", 300); await page.waitForSelector("#tb-clients [data-ouvrir]", { timeout: 8000 }); await attendre(page, 500);
      const d2 = !(await deborde(page)), carteMob = await page.$eval("#tb-clients tr", e => getComputedStyle(e).display).catch(() => "");
      await aller(page, "#/prospects", 300); await page.waitForSelector("#pr-liste .sc-carte", { timeout: 8000 }); await filtre(page, "tous");
      const d3 = !(await deborde(page));
      await ficheDe(page, LEA, "Léa Martin");
      const d4 = !(await deborde(page));
      ok(`I (${format}) : tableau de bord, Mes clients${viewport === MOBILE ? " (en cartes)" : ""}, page Prospects (cartes, newsletter), fiche : aucun défilement horizontal`, d1 && d2 && d3 && d4 && (viewport !== MOBILE || carteMob === "block"), [d1, d2, d3, d4, carteMob].join(",") + " " + await largeur(page));
      if (viewport === MOBILE) {
        const tailles = await page.$$eval('#fiche-commercial [data-sc]', l => l.map(e => Math.round(e.getBoundingClientRect().height)));
        ok("I (téléphone) : les boutons du suivi commercial (dont « Bilan réservé ») sont assez grands pour le doigt (≥ 30 px)", tailles.length >= 5 && tailles.every(h => h >= 30), JSON.stringify(tailles));
      }
    });
  }

  /* =================== J. données piégées =================== */
  await bloc("J. données piégées", async () => {
    const pieges = [
      prospect(40, PIEGE, PIEGE, { cree: 2 * J, q: 2 * J, rep: { probleme: PIEGE, obstacle: PIEGE, projection: PIEGE }, email: "p@exemple.fr", clics: [J], news: true,
        act: { version: 1, jours: "x", pages: { [PIEGE]: 3 }, temps_s: "9", derniere: { a: 1 } }, suivi: { version: 1, bilan_le: { a: 1 }, historique: "x", relances: [PIEGE], issue: PIEGE, note: PIEGE } }),
      prospect(41, "Nul", "", { cree: 2 * J, emails: null, act: ["x"], suivi: ["x"] })
    ];
    const db = decor({ comptes: pieges, cles: [[F.IDS.c3, "checkins", { liste: "x", avis: [{ semaine: 5, smiley: PIEGE }] }, avant(12 * J + 3 * H)]] });
    const { page } = await coachSur(b, db, "#/tableau", "#tb-vue .tb-tiles");
    const vues = [];
    for (const [h, sel] of [["#/tableau", "#tb-vue .tb-tiles"], ["#/clients", "#tb-clients [data-ouvrir]"], ["#/prospects", "#pr-liste"]]) { await aller(page, h, 300); await page.waitForSelector(sel, { timeout: 8000 }); await attendre(page, 600); if (h === "#/prospects") await filtre(page, "tous"); vues.push(await texte(page, "#vue")); }
    await ficheDe(page, PID(40), "piégé");
    vues.push(await texte(page, "#vue"));
    ok("J : prospect piégé (nom, réponses, activité, suivi) : tableau de bord, Mes clients, Prospects, fiche : aucune balise injectée, aucun script exécuté", !(await injecte(page)), "injection");
    ok("J : … ni « undefined », ni « null », ni « NaN », ni « [object » ; la carte piégée et « Nul » sont là", vues.every(v => !RIEN_DE_BRUT.test(v)) && vues[2].includes("Nul") && vues[2].includes(PIEGE.slice(0, 12)), vues.map(v => (v.match(/.{0,30}(undefined|null|NaN|\[object).{0,30}/) || [""])[0]).join(" | "));
    ok("J : données piégées : aucune écriture", db.ecritures.length === 0, resume(db));
  });

  /* =================== K. 1 000 prospects =================== */
  await bloc("K. 1 000 prospects", async () => {
    const gen = []; for (let i = 0; i < 1000; i++) gen.push(prospect(0, "Prospect", "N" + String(i).padStart(4, "0"), { cree: (i + 1) * H, q: i % 2 ? (i + 1) * H : null, rep: i % 2 ? { probleme: "Perdre du gras", obstacle: "Le temps", projection: "Courir" } : null, email: "p" + String(i).padStart(4, "0") + "@gen.fr", clics: i % 7 ? [] : [H], news: i % 3 === 0 }));
    gen.forEach((x, i) => { x.id = "00000000-0000-4000-8000-3" + String(i).padStart(11, "0"); });
    const db = decor({ comptes: gen });
    const { page } = await coachSur(b, db, "#/tableau", "#tb-vue .tb-tiles", {});
    const t0 = Date.now();
    await page.evaluate(() => { location.hash = "#/prospects"; });
    await page.waitForSelector("#pr-liste .sc-carte", { timeout: 15000 }); await page.waitForSelector("#pr-nl", { timeout: 15000 });
    const total = Date.now() - t0;
    const app = await page.evaluate(() => { const z = document.getElementById("pr-vue"); const t = performance.now(); outilProspects.rendre(z); return Math.round(performance.now() - t); }).catch(() => 99999);
    ok(`K : 1 008 prospects : page complète en ${total} ms depuis le changement d'adresse, construite en ${app} ms côté app (chacun < 2 000)`, total < 2000 && app < 2000, "complet " + total + " ms · app " + app + " ms");
    await filtre(page, "tous");
    ok("K : « Tous » : 50 cartes, « Afficher 50 de plus (958 restants) » ; « 1008 comptes gratuits »", (await page.$$("#pr-liste .sc-carte")).length === 50 && (await texte(page, "#pr-plus")) === "Afficher 50 de plus (958 restants)" && (await texte(page, "#pr-vue .masthead .lede")).startsWith("1008 comptes gratuits"), (await texte(page, "#pr-plus")) + " · " + (await texte(page, "#pr-vue .masthead .lede")));
    const { t } = await exporter(page);
    const L = lireCSV(t.replace(/^﻿/, ""));
    ok("K : export des 1 008 prospects : 1 009 lignes, 18 cellules chacune ; aucune écriture", L.length === 1009 && L.every(l => l.length === 18) && db.ecritures.length === 0, L.length + " lignes · " + resume(db));
  });

  /* =================== L. prospect et client : pas d'écran coach, suivi illisible =================== */
  await bloc("L. prospect et client", async () => {
    const db = decor();
    const { page } = await contexte(b, qui(LEA, "lea@exemple.fr"), db);
    await page.goto(URL0 + "#/prospects"); await pret(page, "#vue");
    await attendre(page, 800);
    const refus = await page.evaluate(() => Store.ecrire("suivi_prospect", { bilan_le: new Date().toISOString() }));
    await attendre(page, 1200);
    const corps = norm(await page.evaluate(() => document.body.innerText));
    ok("L : prospecte Léa : #/prospects ne montre pas la page coach, Store.ecrire refuse suivi_prospect, aucune requête ne nomme suivi_prospect, rien d'écrit dans suivi_prospect", !(await page.$("#pr-vue, #tb-vue")) && refus === false && !db.chemins.some(x => /suivi_prospect/.test(x)) && !db.lectures.some(x => /suivi_prospect/.test(x.outil)) && ecr(db, "suivi_prospect").length === 0, JSON.stringify({ refus, e: resume(db) }));
    ok("L : … ni « Bilan réservé » coché par le coach, ni urgence, ni compteur dans ce qu'elle voit", !/coché par toi|à traiter|Inscrits \d/.test(corps), (corps.match(/.{0,30}(coché par toi|à traiter|Inscrits \d).{0,30}/) || [""])[0]);
    const db2 = decor({ prospects: false });
    const { page: p2 } = await contexte(b, THOMAS, db2);
    await p2.goto(URL0 + "#/tableau"); await pret(p2, "#vue");
    ok("L : client Thomas : ni tableau de bord coach, ni onglet Prospects", !(await p2.$("#tb-vue")) && !(await p2.$('#nav a[data-id="prospects"]')));
    await aller(p2, "#/prospects", 1200);
    ok("L : client Thomas tape #/prospects : rien de la page coach, aucune écriture", !(await p2.$("#pr-vue, #pr-liste, #pr-nl")) && db2.ecritures.length === 0, resume(db2));
  });

  /* =================== Z. rien vers l'extérieur =================== */
  await bloc("Z. hôtes externes", async () => {
    const autres = Array.from(externes).filter(h => !/^fonts\.(googleapis|gstatic)\.com$/.test(h));
    ok("Z : aucune requête vers un autre hôte que la page, le faux Supabase et les polices (bloquées)", autres.length === 0, JSON.stringify(autres));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
