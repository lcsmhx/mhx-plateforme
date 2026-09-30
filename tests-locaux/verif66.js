/* verif66 — v60, lot 1 du brief V2 (parcours prospect), sections J et I de la Speed Formation (#/formation), vérifiées de
   bout en bout dans un vrai navigateur, en français et en anglais, à 390 px, en thème sombre et clair :
   J1. prospect, français (390 px, sombre) : les nouveaux textes (J1 intro « Ton parcours », J2 puce du module 0, J3
       objectif du module 1 — carte et ligne « Objectif : » —, J5 les 5 axes remplacés des challenges, J6 les 6 défis
       réécrits), typographie française lue SANS normalisation (espace insécable avant « : » dans l'intro, le contenu du
       module 0, les défis c1, c3, c4 et la description de d9 ; l'étiquette « Objectif » suivie d'une espace insécable dans
       les 7 modules et les 15 axes ; aucune espace simple avant « : ; ? ! » dans tous les textes passés par typoFr), 5
       challenges, 15 axes et 10 défis, les 10 autres axes et d3, d4, d8, d10 inchangés (écrits dans la suite tels qu'en
       c800fe0, jamais relus dans le code testé) ; ses données d'AVANT le changement (d6 et d7 cochés, challenge c3
       choisi) toujours cochées / choisies, et intactes en base après les 7 modules ouverts ; plus aucun ancien texte (« perdre tes premiers kilos »,
       « garantir », jeûne, à jeun, double séance, « limite le stockage », « glucides après 17 h », « journée pauvre en
       glucides »…) dans toute la page ; aucun prix ;
   J2. client Thomas, français (390 px) : les mêmes textes (étiquettes « Objectif » + espace insécable), 15 axes et 10
       défis, aucun ancien texte, son challenge gardé ;
   J3. prospect, anglais (390 px, clair) : J1, J2, J3 en anglais ; les 5 axes remplacés « Goal: » + objectif et défi
       anglais, les 10 autres entièrement en français (« Objectif : » inchangé, espace simple) ; les 6 défis réécrits en
       anglais, les 4 autres en français ; aucune espace insécable avant la ponctuation (typoFr ne fait rien en anglais) ;
       d6, d7, c3 gardés ; aucun ancien texte (anglais ni français) ; aucun prix ;
   I1. prospect, français (390 px, sombre) : #fo-depart puis #fo-apercu, au-dessus de « Ton parcours » ; « Commence
       ici » sans durée (affiché en capitales), titre, les 3 actions (liens, rien de fait, tactiles), les 4 tuiles
       7 / 7 / 15 / 25 (= comptées dans FORMATION et LECONS ; v63 : « guides et documents », plus de « à télécharger »),
       les 2 lignes, compteur « 0 / 49 étapes » ; les liens mènent au calculateur et à Ma progression ; pas de débordement ; une simple visite n'écrit rien et ne lit
       calc_perso et mens qu'en UNE lecture groupée ; aucun prix ;
   I2. états des 3 actions selon la base : calc_perso valide et adulte (fait), mineur ou incomplet (pas fait), pesée
       (pstart ou une mesure avec un poids), vidéo déjà lancée (formation.depart.video) ; « ✓ » et « (fait) » (lecteurs
       d'écran) sur les seules actions faites ; les 3 faites : une seule ligne « Départ lancé ✓ », suivie (v62, brief V2,
       H4) de l'invitation « Bien joué, ton départ est lancé. » (structure commune dans l'ordre, ses 6 textes et rien
       d'autre — aucune valeur saisie —, lien Calendly de 15 min vérifié sans l'app, utm_content=formation_commence_ici,
       noopener, « Plus tard ») ; aucune invitation tant qu'une action manque (aussi à 2 sur 3), ni lecture groupée
       d'intake et challenge (au plus une pour les 3 faites) ; compteur inchangé ;
       aucune écriture, une lecture groupée par visite ; un calcul enregistré dans le calculateur et pas encore arrivé
       au serveur (saisie en attente, puis envoi en vol : outilDecouverte.saisiesLocales) compte déjà, sans rien écrire
       de plus ;
   I3. la vidéo de bienvenue : clic sur l'action → même adresse, défile jusqu'à la vidéo (hors de l'écran avant,
       entièrement à l'écran après), iframe youtube-nocookie à la place de la vignette, formation.depart.video écrit UNE
       fois (le reste de la clé intact), seule la carte « Commence ici » redessinée (« Ce qui t'attend », l'iframe et
       « Ton parcours » restent), compteur inchangé ; 2e clic et rechargement : plus aucune écriture ; clic sur la
       vignette elle-même : même effet ; v62 (H4) : la vidéo qui complète les 3 (calcul et pesée déjà faits) → UNE
       écriture, carte repliée et l'invitation juste après #fo-depart ; écriture de formation refusée → action non cochée,
       rien de déclenché (ni invitation, ni lecture, ni mémoire sur l'appareil) ;
   I4. client Thomas et coach (fiche d'un prospect) : aucune des deux cartes, « Ton parcours » en premier, aucune
       lecture de calc_perso ni de mens (quel que soit l'ordre ou le découpage) ; la vignette de Thomas n'écrit rien ;
   I5. page servie retouchée (FORMATION.video_minutes à 4, une ressource de plus dans le module 6) : « Commence ici ·
       7 min » / « Start here · 7 min », tuile des documents à 16 (rien d'écrit en dur) ;
   I6. prospect, anglais (390 px, clair) : les deux cartes en anglais (« Start here », actions, tuiles, lignes,
       « 0 / 49 steps », « (done) », « You're off ✓ » et, v62, l'invitation anglaise du brief H), pas de débordement ;
   T. thèmes sombre et clair (390 px) : thème appliqué, chaque texte des deux cartes, et l'état replié « Départ lancé ✓ »
      suivi de son invitation (v62), se détache de son fond (contraste d'au moins 4,5:1 ; 3:1 pour les seules exceptions
      nommées, à la couleur exacte de leur jeton : EXCEPTIONS_CONTRASTE), fond des cartes différent d'un thème à l'autre, rien ne sort de l'écran,
      actions d'au moins 44 px (v62 : le bouton et « Plus tard » de l'invitation aussi) ;
   Z. aucun appel vers l'extérieur.
   Supabase simulé (gabarit de verif60, carte 6 §15) : rien ne part vers la vraie base (routage par NOM D'HÔTE, jamais
   par sous-chaîne) ; règles de la base reproduites (HANDOFF §2.3, v49) ; appelant reconnu à son jeton ; chaque écriture
   est appliquée en mémoire et notée, chaque lecture de « donnees » aussi. Données fictives (fixtures.js et comptes de la
   suite). Dates relatives au lancement. Chaque bloc tourne à part (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un
   ✗ apparaît.
   Usage : node verif66.js ../index.html
           VERIF66_PORT=9821 node verif66.js ../index.html     (autre port, si 9820 est pris)
           VERIF66_BLOCS="I3.,Z." node verif66.js …              (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF66_PORT || 9820;
const BLOCS = (process.env.VERIF66_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
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
const norm = t => String(t || "").replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim();
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "donnees", f), "utf8"));
const CATALOGUE = Object.assign({}, F.catalogue, { aliments: lireDonnees("aliments.json"), recettes: lireDonnees("recettes.json") });

/* ---------- les personnes ---------- */
/* un jeton par compte : le faux Supabase reconnaît l'appelant à son en-tête Authorization, comme la vraie base */
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: meta } : {}) });
const qui = (id, email, meta) => ({ id, email, session: session(id, email, meta) });
const COACH = qui(F.IDS.coach, "coach@exemple.fr"), THOMAS = qui(F.IDS.c1, "thomas@exemple.fr");
const PID = k => "00000000-0000-4000-8000-0000000066" + String(k).padStart(2, "0");   // verif66 : …66kk (une plage par suite)
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
const saisies = db => ecrDonnees(db).filter(e => e.outil !== "activite");   // hors compteur de visites du prospect (clé activite)
const contenuDe = (db, uid, outil) => (db.donnees.find(d => d.user_id === uid && d.outil === outil) || {}).contenu;
const isoJ = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const jourIlYA = n => { const d = new Date(T0); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return isoJ(d); };
/* un prospect qui a validé les 3 questions et vu la page bilan (gabarit de verif56 et verif60) */
const NOUVEAU = { probleme: "Perdre du gras", obstacle: "Le manque de temps", projection: "Avoir de l'énergie toute la journée",
  objectif: "Perte de poids / sèche", objectif_auto: "Perte de poids / sèche", court_debut: avant(2 * H), court_le: avant(H), bilan_propose: { choix: "plus_tard", le: avant(MIN) } };
const PROSPECT = (k, prenom, donnees) => ({ id: PID(k), prenom, nom: "Essai", statut: "prospect", cree: avant(2 * J), email: "p" + k + "@exemple.fr", donnees: [["intake", NOUVEAU]].concat(donnees || []) });
/* v64 (lot 5, B) : ces prospects sont inscrits entre la v52 et la v63, case santé cochée à l'inscription : l'accord est dans
   les métadonnées de leur compte (sans clé newsletter : rien d'autre ne change), donc aucune carte d'accord santé dans le
   calculateur ni dans Ma progression (l'accord au premier usage est vérifié ailleurs) ; quiP(k, meta) : d'autres métadonnées */
const ACCORD_SANTE = { consentement_sante: "2026-09-28T09:00:00.000Z", sante_version: "2026-09-28b" };
const quiP = (k, meta) => qui(PID(k), "p" + k + "@exemple.fr", meta === undefined ? ACCORD_SANTE : meta);
/* son calcul (calc_perso) et sa pesée (mens) */
const CP = { sexe: "F", age: 30, taille: 165, poids: 60, pas: 6000, heures: 3, objectif: "perte" };
const CP_MINEUR = Object.assign({}, CP, { age: 16 }), CP_INCOMPLET = { sexe: "F", age: 30, taille: 165, poids: 60 };
const ZONES = ["Poitrine", "Épaules", "Bras gauche", "Bras droit", "Taille", "Ventre", "Hanches", "Cuisse gauche", "Cuisse droite", "Mollet"];
const MENS_DEPART = { dstart: jourIlYA(3), pstart: 70.5, zones: ZONES, affichees: [4, 5], compo_affichee: "mg", mesures: [] };
const MENS_MESURE = { dstart: jourIlYA(10), zones: ZONES, affichees: [4, 5], compo_affichee: "mg", mesures: [{ sem: 1, date: jourIlYA(2), poids: 70.4, vals: {} }] };
const MENS_VIDE = { dstart: jourIlYA(3), zones: ZONES, affichees: [4, 5], compo_affichee: "mg", mesures: [] };
/* sa Speed Formation enregistrée AVANT le changement de textes : d6 (« 3 jours sans grignotage ») et d7 (« 20 minutes de
   méditation… ») cochés, le challenge c3 (celui du jeûne intermittent) choisi, 3 étapes cochées */
const FORM_AVANT = ouvert => ({ coches: { p1a: true, p2a: true, m5a: true }, ouvert: ouvert || "", lecon: "", challenge: "c3", defis: { d6: true, d7: true },
  diete: {}, semaine: 1, jour: 0, priorites: { semaine: [], demain: [] }, notes: [], objectifs: [] });

/* ---------- les textes du brief (V2, section J), mot pour mot ---------- */
const TX = {
  intro: "Une méthode simple pour poser les bases en 14 jours : ton alimentation, ton entraînement et tes habitudes, sans programme complexe ni séance interminable. Conçue pour les personnes occupées : le plan s'intègre dans ta routine, entre le travail et la famille.",
  intro_en: "A simple method to lay the foundations in 14 days: your nutrition, your training and your habits, with no complicated program or endless workouts. Built for busy people: the plan fits into your routine, between work and family.",
  m0: "Des objectifs réalistes : ce qu'on peut viser en 14 jours, et ce qui demande plus de temps.",
  m0_en: "Realistic goals: what you can aim for in 14 days, and what takes longer.",
  m1: "Travailler l'état d'esprit qui fait tenir une transformation dans la durée.",
  m1_en: "Build the mindset that makes a transformation last."
};
/* J5 : challenge|axe → [objectif, défi, objectif anglais, défi anglais] */
const J5 = {
  "c1|Discipline": ["Développer une routine matinale.", "Un rituel de 10 minutes chaque matin, sans te lever plus tôt : un grand verre d'eau, 5 minutes de respiration, relire ton objectif.",
    "Build a morning routine.", "A 10-minute ritual every morning, without getting up earlier: a big glass of water, 5 minutes of breathing, reread your goal."],
  "c2|Perte de gras": ["Garder la faim sous contrôle.", "Une source de protéines à chaque repas (œufs, poisson, viande, laitages, tofu ou légumineuses) et la moitié de l'assiette en légumes, le midi et le soir.",
    "Keep hunger under control.", "A protein source at every meal (eggs, fish, meat, dairy, tofu or legumes) and half your plate as vegetables, at lunch and dinner."],
  "c3|Perte de gras": ["Profiter sans tout dérégler.", "Prévoir à l'avance ton repas plaisir de la semaine et le savourer, sans compenser le lendemain : pas de repas sauté, pas de séance punition.",
    "Enjoy without derailing.", "Plan your treat meal of the week in advance and enjoy it, without compensating the next day: no skipped meals, no punishment workouts."],
  "c4|Perte de gras": ["Bouger plus au quotidien.", "Ajouter 2 000 pas par jour à ta moyenne habituelle : escaliers, trajets à pied, marche après le repas.",
    "Move more every day.", "Add 2,000 steps a day to your usual average: stairs, walking commutes, a walk after meals."],
  "c4|Séances de sport": ["Tenir le rythme de 3 séances.", "Faire 3 séances dans la semaine (20 minutes suffisent), avec au moins un jour de repos entre deux séances intenses.",
    "Keep up 3 workouts a week.", "Do 3 workouts this week (20 minutes is enough), with at least one rest day between two intense sessions."]
};
/* J6 : défi → [titre, description, titre anglais, description anglaise] ; d3, d4, d8, d10 : titre inchangé, en français aussi en anglais */
const J6 = {
  d1: ["7 jours sans sucres ajoutés", "Éliminer les sucres ajoutés dans les boissons, desserts et en-cas industriels. Les fruits restent au menu.", "7 days without added sugar", "Cut added sugar from drinks, desserts and packaged snacks. Fruit stays on the menu."],
  d2: ["1,5 litre d'eau par jour", "Garder une bouteille à portée de main et boire au moins 1,5 litre d'eau par jour.", "1.5 liters of water a day", "Keep a bottle within reach and drink at least 1.5 liters of water a day."],
  d5: ["30 minutes de marche rapide, 3 fois", "Marche rapide ou vélo, au moment de la journée qui te va le mieux.", "30 minutes of brisk walking, 3 times", "Brisk walking or cycling, whenever suits you best."],
  d6: ["Des collations prévues, pas subies", "Pendant 3 jours, prévoir tes collations à l'avance (un fruit, un yaourt, une poignée d'oléagineux) au lieu de grignoter au hasard.", "Planned snacks, not random ones", "For 3 days, plan your snacks ahead (a piece of fruit, a yogurt, a handful of nuts) instead of grazing at random."],
  d7: ["10 minutes de respiration ou de méditation par jour", "Réduire le stress aide à tenir tes bonnes habitudes.", "10 minutes of breathing or meditation a day", "Lowering stress helps you stick to your good habits."],
  d9: ["30 minutes de sommeil en plus chaque nuit", "Se coucher 30 minutes plus tôt : bien dormir aide à récupérer et à mieux gérer la faim.", "30 more minutes of sleep every night", "Go to bed 30 minutes earlier: good sleep helps you recover and manage hunger."]
};
/* relecture : les 10 axes non remplacés et les 4 défis non réécrits, ÉCRITS ICI tels qu'ils étaient en c800fe0 (v59,
   js/outilFormation.js), jamais relus dans le code testé : un changement hors brief de l'un d'eux fait échouer la suite.
   Challenge|axe → [objectif, défi] ; défi → [titre, description] */
const AXES_INCHANGES = {
  "c1|Perte de gras": ["Introduire un déficit calorique léger.", "Suivre un plan alimentaire basique : réduire les portions de sucre, augmenter les légumes dans chaque repas."],
  "c1|Séances de sport": ["Augmenter la fréquence d'entraînement.", "Ajouter une séance légère dans la semaine : marche rapide ou 15 minutes de cardio léger."],
  "c2|Discipline": ["Renforcer la gestion du temps.", "Planifier la journée la veille au soir, repas et entraînements compris."],
  "c2|Séances de sport": ["Augmenter le volume d'entraînement.", "Ajouter une deuxième séance : un circuit rapide au poids de corps."],
  "c3|Discipline": ["Suivre une routine stricte.", "Réduire une mauvaise habitude : limiter les distractions numériques pendant les repas ou le travail."],
  "c3|Séances de sport": ["Ajouter de la diversité.", "Intégrer une séance de renforcement sur un groupe musculaire précis : jambes, dos…"],
  "c4|Discipline": ["Rehausser la résilience mentale.", "Se fixer un mini-objectif quotidien : méditer 10 minutes, lire 10 pages d'un livre de développement personnel."],
  "c5|Perte de gras": ["Évaluer les progrès.", "Faire un bilan complet des habitudes alimentaires et des performances, puis ajuster."],
  "c5|Discipline": ["Consolider les habitudes créées.", "Se donner une récompense en fin de semaine : un repas plaisir équilibré."],
  "c5|Séances de sport": ["Ajuster et faire évoluer.", "Revoir le programme pour l'adapter aux progrès : plus de poids ou plus de répétitions."]
};
/* les 15 axes dans l'ordre d'affichage : 5 challenges, chacun Perte de gras, Discipline, Séances de sport */
const AXES_ORDRE = ["c1", "c2", "c3", "c4", "c5"].reduce((a, c) => a.concat(["Perte de gras", "Discipline", "Séances de sport"].map(n => c + "|" + n)), []);
const J6_INCHANGES = {
  d3: ["5 séances de circuit abdos", "Réaliser un circuit abdos 5 fois dans la semaine : 3 à 5 exercices (crunch, gainage, relevés de jambes, obliques), 3 séries de 15 répétitions."],
  d4: ["Une portion de légumes à chaque repas", "Inclure des légumes, crus ou cuits, dans chacun de tes repas."],
  d8: ["Aucune boisson calorique de la semaine", "Éviter jus de fruits, sodas, alcool et café sucré : les calories liquides sont les plus souvent oubliées."],
  d10: ["Écrire ses objectifs chaque matin", "Quelques minutes chaque matin pour écrire ou relire tes objectifs, et rester concentré toute la journée."]
};
const DEFIS_ORDRE = ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "d9", "d10"];
/* typographie française (typoFr) : une espace SIMPLE avant « : ; ? ! » » ou après « « » dans un texte affiché en français */
const ESPACE_SIMPLE = / [:;?!»]|« /;
const INSECABLE = /\u00a0[:;?!»]|«\u00a0/;
/* les anciens textes (promesses de résultat, défis risqués ou idées reçues) : plus nulle part */
const ANCIENS = [/perdre tes premiers kilos/i, /garanti/i, /jeûne/i, /à jeun\b/i, /double séance/i, /limite le stockage/i, /glucides après 17/i, /journée pauvre en glucides/i, /3 jours sans grignotage/i, /se lever 30 minutes plus tôt/i];
const ANCIENS_EN = [/lose your first/i, /guarantee/i, /\bfast(ed|ing)\b/i, /double (session|workout)/i];
const anciensVus = (t, l) => l.filter(re => re.test(t)).map(String);
const PRIX = /€|\$|\beuros?\b|\bEUR\b|\bprix\b|\bprices?\b|\btarifs?\b/i;
/* v63 (lot 4, point 3) : l'ancien libellé de la tuile documents (« guides et documents à télécharger » / « guides and downloads ») : plus nulle part dans la carte */
const TELECHARGER = /télécharg|download/i;
/* I (brief V2) : les deux cartes */
const I_FR = { etiquette: "Commence ici", titre: "3 actions pour bien démarrer aujourd'hui",
  actions: [["video", "#fo-presentation", "Regarde la vidéo de bienvenue"], ["calcul", "#/calculateur", "Calcule tes calories (2 min)"], ["pesee", "#/mensurations", "Note ton poids de départ (1 min)"]],
  fait: "(fait)", fini: "Départ lancé ✓", apercu: "Ce qui t'attend dans ta formation", tuiles: ["modules", "vidéos avec Lucas", "guides et documents", "défis"],
  lignes: ["Dont 3 programmes d'entraînement (12 semaines femme, 12 semaines homme, full body maison) et 3 plans alimentaires (sans restriction, sans gluten, vegan).",
    "Plus tes outils : organisation de la diète, priorités, notes et objectifs. Gratuit, sans limite de temps."], compteur: "0 / 49 étapes" };
const I_EN = { etiquette: "Start here", titre: "3 actions to get started today",
  actions: [["video", "#fo-presentation", "Watch the welcome video"], ["calcul", "#/calculateur", "Calculate your calories (2 min)"], ["pesee", "#/mensurations", "Log your starting weight (1 min)"]],
  fait: "(done)", fini: "You're off ✓", apercu: "What's inside your course", tuiles: ["modules", "videos with Lucas", "guides and documents", "challenges"],
  lignes: ["Including 3 workout programs (12 weeks for women, 12 weeks for men, full body at home) and 3 meal plans (no restrictions, gluten-free, vegan).",
    "Plus your tools: meal organizer, priorities, notes and goals. Free, with no time limit."], compteur: "0 / 49 steps" };

/* ---------- lectures de la page ---------- */
async function ouvrirFormation(page, url){ await page.goto(url || URL0 + "#/formation"); await pret(page, "#fo-vue .prog-compteur"); await attendre(page, 500); }
/* la carte « Commence ici » telle qu'affichée */
const carteDepart = page => page.evaluate(() => {
  const n = x => x ? x.textContent.replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim() : null;
  const s = document.getElementById("fo-depart"); if (!s) return null;
  const e = s.querySelector(".eyebrow");
  return { classes: s.className, tag: s.tagName, enfants: Array.from(s.children).map(x => x.tagName + (x.className ? "." + x.className.split(" ").join(".") : "")), eyebrow: n(e), capitales: e ? e.innerText.trim() : null,
    h2: n(s.querySelector("h2")), ligne: n(s.querySelector("p.fo-depart-ligne")), ol: s.querySelectorAll("ol.fo-depart-l").length,
    actions: Array.from(s.querySelectorAll("ol.fo-depart-l > li")).map(li => { const a = li.querySelector("a[data-depart]");
      return { k: a && a.dataset.depart, href: a && a.getAttribute("href"), fait: li.classList.contains("fait"), c: n(a && a.querySelector(".fo-depart-c")), t: n(a && a.querySelector(".fo-depart-t")),
        sr: n(a && a.querySelector(".sr-only")), h: a ? Math.round(a.getBoundingClientRect().height) : 0 }; }) };
});
/* la carte « Ce qui t'attend dans ta formation » */
const carteApercu = page => page.evaluate(() => {
  const n = x => x ? x.textContent.replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim() : null;
  const s = document.getElementById("fo-apercu"); if (!s) return null;
  return { classes: s.className, h2: n(s.querySelector("h2")), tuiles: Array.from(s.querySelectorAll(".tiles > .tile")).map(t => [n(t.querySelector(".t-val.readout")), n(t.querySelector(".t-sub"))]),
    lignes: Array.from(s.querySelectorAll(":scope > p")).map(n), brut: s.textContent };
});
/* les 3 premiers enfants de #fo-vue (id, sinon le titre de la carte) ; n : les n premiers */
const ordre = (page, n) => page.evaluate(n => Array.from((document.getElementById("fo-vue") || { children: [] }).children).slice(0, n).map(e => e.id || ((e.querySelector("h2") || {}).textContent || "").trim()), n || 3);
/* v62 (brief V2, H) : une invitation telle qu'affichée (section.panel.invitation#invitation-<code>), son voisin d'avant,
   le lien attendu (lienCalendly de la page, code d'origine = le code) et le nombre d'invitations de la page */
const carteInvitation = (page, code) => page.evaluate(code => {
  const n = x => x ? x.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null;
  const nom = x => x.tagName + (x.className ? "." + String(x.className).trim().split(/\s+/).join(".") : "");
  const s = document.getElementById("invitation-" + code); if (!s) return null;
  const a = s.querySelector(":scope > .dc-cta > a.btn[data-inv-cal]"), t = s.querySelector(":scope > .dc-cta > button.lien-discret[data-inv-tard]"), cta = s.querySelector(":scope > .dc-cta");
  let utm = null; try { utm = a ? new URL(a.getAttribute("href")).searchParams.get("utm_content") : null; } catch (e) { utm = "illisible"; }
  /* relecture : chaque morceau de texte de la carte, dans l'ordre du document (aucun texte en plus, nulle part) */
  const textes = [], w = document.createTreeWalker(s, NodeFilter.SHOW_TEXT);
  for (let x = w.nextNode(); x; x = w.nextNode()) { const v = x.nodeValue.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim(); if (v) textes.push(v); }
  return { tag: s.tagName, classes: s.className, data: s.dataset.invitation, avant: s.previousElementSibling ? s.previousElementSibling.id : null,
    enfants: Array.from(s.children).map(nom), cta: cta ? Array.from(cta.children).map(nom) : null, nEl: s.querySelectorAll("*").length, textes, html: s.outerHTML,
    h2: n(s.querySelector("h2")), objectif: n(s.querySelector("p.inv-objectif")), texte: n(s.querySelector("p.inv-texte")),
    lien: a ? { href: a.getAttribute("href"), attendu: lienCalendly(code), utm, cible: a.getAttribute("target"), rel: a.getAttribute("rel"), code: a.dataset.invCal, t: n(a) } : null,
    sous: n(s.querySelector(":scope > .dc-cta > p.dc-cta-sous")), tard: t ? { t: n(t), code: t.dataset.invTard } : null, nb: document.querySelectorAll("section.invitation").length };
}, code);
const INV_DEPART = { code: "formation_commence_ici", h2: "Bien joué, ton départ est lancé.", objectif: "Ton objectif : « " + NOUVEAU.projection + " »",
  texte: "Prochaine étape : ton plan d'action personnalisé, offert, en 15 min avec Lucas.", bouton: "Récupérer mon plan d'action", sous: "15 min avec Lucas · offert", tard: "Plus tard" };
/* relecture : les textes anglais du brief H (4. « Commence ici » terminé), mot pour mot */
const INV_DEPART_EN = { code: "formation_commence_ici", h2: "Nice work, you're off to a start.", objectif: "Your goal: “" + NOUVEAU.projection + "”",
  texte: "Next step: your personalized action plan, free, in 15 min with Lucas.", bouton: "Get my action plan", sous: "15 min with Lucas · free", tard: "Later" };
/* relecture : le lien d'une invitation vérifié SANS l'app (gabarit de lienOk, verif56) : l'événement de 15 min,
   utm_source=app, utm_medium=bouton, utm_content=<code>, dans cet ordre, puis le nom, le prénom et l'email du prospect
   (qui : { prenom, nom, email }), rien d'autre ; "" si tout est bon, sinon ce qui ne va pas */
const CAL15 = "https://calendly.com/mhx-coaching/ton-plan-d-action-offert-15-min-avec-lucas";
function lienInvOk(href, code, qui){
  let u; try { u = new URL(href); } catch (e) { return "adresse illisible"; }
  if (href.split("?")[0] !== CAL15) return "base " + href.split("?")[0];
  const p = [...u.searchParams.entries()], k = p.map(x => x[0]), v = Object.fromEntries(p);
  const admis = ["utm_source", "utm_medium", "utm_content", "name", "first_name", "last_name", "email"];
  if (k.some(x => !admis.includes(x)) || new Set(k).size !== k.length) return "paramètres " + k.join(",");
  if (v.utm_source !== "app" || v.utm_medium !== "bouton" || v.utm_content !== code) return "utm " + JSON.stringify(v);
  if (!href.startsWith(CAL15 + "?utm_source=app&utm_medium=bouton&utm_content=" + code + "&")) return "ordre utm";
  if (v.name !== qui.prenom + " " + qui.nom || v.first_name !== qui.prenom || v.last_name !== qui.nom || v.email !== qui.email) return "nom / prénom / email " + JSON.stringify(v);
  return "";
}
/* le prospect k de cette suite (PROSPECT : nom « Essai », email pk@exemple.fr) */
const quiLien = (k, prenom) => ({ prenom, nom: "Essai", email: "p" + k + "@exemple.fr" });
/* relecture : une valeur saisie du prospect (poids 60 kg du calcul, 70,4 / 70,5 kg des pesées, calories) : jamais dans une
   invitation (texte ni attribut) */
const VALEURS = /\b60\b|\b70[.,]\s?[45]\b|\bkg\b|kcal/i;
/* relecture (brief H, « STRUCTURE COMMUNE, dans cet ordre ») : une invitation conforme — section.panel.invitation
   #invitation-<code>[data-invitation], seule de la page, juste après l'élément d'id « avant » ; enfants EXACTS h2,
   p.inv-objectif, p.inv-texte, div.dc-cta ; dans div.dc-cta : a.btn, p.dc-cta-sous, button.lien-discret ; 7 éléments en
   tout et ses 6 textes exacts, dans l'ordre, rien d'autre (aucun élément, texte ou valeur saisie en plus) ; lien vérifié
   sans l'app (lienInvOk) et égal à lienCalendly(code), data-inv-cal, nouvel onglet, rel=noopener ; « Plus tard »
   data-inv-tard. Renvoie la liste de ce qui ne va pas (vide : conforme) */
function invitationKo(iv, A, avant, qui){
  if (!iv) return ["absente"];
  const e = [], si = (c, m) => { if (!c) e.push(m); }, l = iv.lien || {};
  si(iv.tag === "SECTION" && /\bpanel\b/.test(iv.classes) && /\binvitation\b/.test(iv.classes), "section " + iv.tag + "." + iv.classes);
  si(iv.data === A.code, "data-invitation " + iv.data);
  si(iv.avant === avant, "juste après " + iv.avant);
  si(iv.nb === 1, iv.nb + " invitations");
  si(egal(iv.enfants, ["H2", "P.inv-objectif", "P.inv-texte", "DIV.dc-cta"]), "enfants " + JSON.stringify(iv.enfants));
  si(egal(iv.cta, ["A.btn", "P.dc-cta-sous", "BUTTON.lien-discret"]), "dc-cta " + JSON.stringify(iv.cta));
  si(iv.nEl === 7, iv.nEl + " éléments");
  si(egal(iv.textes, [A.h2, A.objectif, A.texte, A.bouton, A.sous, A.tard]), "textes " + JSON.stringify(iv.textes));
  si(iv.h2 === A.h2 && iv.objectif === A.objectif && iv.texte === A.texte && l.t === A.bouton && iv.sous === A.sous && !!iv.tard && iv.tard.t === A.tard, "textes par élément");
  si(!VALEURS.test(iv.html || ""), "valeur saisie dans la carte");
  si(!!l.href && l.href === l.attendu, "lien ≠ lienCalendly(code) : " + l.href);
  const pb = lienInvOk(l.href || "", A.code, qui); si(!pb, "lien : " + pb);
  si(l.utm === A.code && l.code === A.code, "utm_content / data-inv-cal " + l.utm + " " + l.code);
  si(l.cible === "_blank" && /(^|\s)noopener(\s|$)/.test(l.rel || ""), "target / rel " + l.cible + " " + l.rel);
  si(!!iv.tard && iv.tard.code === A.code, "data-inv-tard " + (iv.tard && iv.tard.code));
  return e;
}
/* relecture (contrat H : « UNE lecture groupée au déclencheur, jamais à la simple ouverture d'une page ») : les lectures
   de ce compte qui portent À LA FOIS intake et challenge (la lecture groupée de l'invitation, quel que soit l'ordre) */
const lecturesInvitation = (db, uid, depuis) => db.lectures.slice(depuis || 0).filter(x => x.par === uid && /^in\./.test(x.outil) && couvre(x.outil, "intake") && couvre(x.outil, "challenge"));
const compteur = page => page.$eval("#fo-vue .prog-compteur .t-sub", x => x.textContent.replace(/\s+/g, " ").trim()).catch(() => "");
/* les chiffres attendus, comptés par la suite elle-même dans FORMATION et LECONS (modules ; vidéos : la bienvenue + celles
   des modules ; documents : ressources + leçons des modules ; défis : axes des challenges + défis) */
const chiffresAttendus = page => page.evaluate(() => { const M = FORMATION.modules, v = x => typeof x === "string" && /^[A-Za-z0-9_-]{11}$/.test(x);
  return [M.length, [FORMATION.video].concat(M.map(m => m.video)).filter(v).length, M.reduce((a, m) => a + (m.ressources || []).length + (m.lecons || []).filter(k => !!LECONS[k]).length, 0),
    FORMATION.challenges.reduce((a, c) => a + c.axes.length, 0) + FORMATION.defis.length].map(String); });
/* les lectures qui portent calc_perso ou mens pour ce compte (hors simple date de mise à jour) */
const lecturesDepart = (db, uid, depuis) => db.lectures.slice(depuis || 0).filter(x => x.par === uid && (couvre(x.outil, "calc_perso") || couvre(x.outil, "mens")) && x.select !== "maj_le");
/* relecture : toute lecture (de n'importe qui, contenu ou date) qui porte calc_perso ou mens, quel que soit l'ordre de la
   liste « in.(…) » ou le découpage en plusieurs lectures ; une lecture sans filtre d'outil les porte aussi (couvre) */
const lecturesCalcMens = (db, depuis) => db.lectures.slice(depuis || 0).filter(x => couvre(x.outil, "calc_perso") || couvre(x.outil, "mens"));
const uneLectureGroupee = (db, uid, depuis) => { const l = lecturesDepart(db, uid, depuis); return l.length === 1 && l[0].outil === "in.(calc_perso,mens)" && /contenu/.test(l[0].select); };
/* le module 5 ouvert : les challenges (id, choisi, pastille, axes [nom, étiquette, objectif, défi]) et les 10 défis ;
   brut : les mêmes textes SANS normalisation (typographie : espace insécable), axes [étiquette, ligne objectif, défi],
   défis [titre, description] */
const module5 = page => page.evaluate(() => {
  const n = x => x ? x.textContent.replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim() : null, br = x => x ? x.textContent : null;
  return { chal: Array.from(document.querySelectorAll(".fo-chal")).map(c => { const b = c.querySelector("[data-chal]");
      return { id: b && b.dataset.chal, choisi: c.classList.contains("fo-chal-on") && b.getAttribute("aria-pressed") === "true", pastille: n(c.querySelector(".fo-chal-tete .pastille")),
        axes: Array.from(c.querySelectorAll(".fo-axe")).map(x => [n(x.querySelector("b")), n(x.querySelector("i")), n(x.querySelector("p.note")), n(x.querySelector("p:not(.note)"))]),
        brut: Array.from(c.querySelectorAll(".fo-axe")).map(x => [br(x.querySelector("i")), br(x.querySelector("p.note")), br(x.querySelector("p:not(.note)"))]) }; }),
    defis: Array.from(document.querySelectorAll(".fo-defis li")).map(li => { const i = li.querySelector("input[data-defi]"); return [i && i.dataset.defi, !!(i && i.checked), n(li.querySelector("b")), n(li.querySelector(".note"))]; }),
    defisBrut: Array.from(document.querySelectorAll(".fo-defis li")).map(li => [br(li.querySelector("b")), br(li.querySelector(".note"))]),
    pastille: n(document.querySelector(".fo-outil h4 .pastille")) };
});
/* dans FORMATION : les clés des axes (garde : autant d'axes que la page en montre) et, en anglais, le nom d'un des 5 axes
   remplacés tel que le dictionnaire le rend (le contrat ne dit rien de ces 5 noms) */
const sourceChallenges = page => page.evaluate(() => { const n = t => String(t).replace(/\s+/g, " ").trim();
  return { axes: FORMATION.challenges.reduce((a, c) => a.concat(c.axes.map(x => ({ cle: c.id + "|" + x.nom, nomEn: I18N.en[n(x.nom)] || n(x.nom) }))), []), defis: FORMATION.defis.length }; });
/* [challenge, nom de l'axe affiché, étiquette, objectif, défi] : les 5 axes remplacés d'après le brief (J5), les 10 autres
   d'après AXES_INCHANGES (c800fe0), entièrement en français en anglais aussi (nom compris) */
function axesAttendus(S, en){
  return AXES_ORDRE.map(cle => { const [id, nom] = cle.split("|"), j = J5[cle], x = S.axes.find(a => a.cle === cle);
    if (j) return en ? [id, x ? x.nomEn : "?", "Goal:", "Goal: " + j[2], j[3]] : [id, nom, "Objectif :", "Objectif : " + j[0], j[1]];
    const v = AXES_INCHANGES[cle];
    return [id, nom, "Objectif :", "Objectif : " + v[0], v[1]]; });
}
const axesVus = m5 => m5.chal.reduce((a, c) => a.concat(c.axes.map(x => [c.id, x[0], x[1], x[2], x[3]])), []);
const axesBruts = m5 => m5.chal.reduce((a, c) => a.concat(c.brut), []);
/* [défi, coché, titre, description] : les 6 réécrits d'après le brief (J6), d3, d4, d8, d10 d'après J6_INCHANGES (c800fe0) */
function defisAttendus(S, en, coches){
  return DEFIS_ORDRE.map(id => { const j = J6[id], k = !!(coches || {})[id];
    if (j) return en ? [id, k, j[2], j[3]] : [id, k, j[0], j[1]];
    return [id, k].concat(J6_INCHANGES[id]); });
}
/* tous les textes de la formation qui passent par typoFr (contrat, « Typographie ») tels qu'affichés, sans normalisation :
   module 5 (étiquettes, lignes objectif et défis des axes, titres et descriptions des défis) + les modules lus par objModule */
const textesTypo = (m5, mods) => axesBruts(m5).reduce((a, x) => a.concat(x), []).concat(m5.defisBrut.reduce((a, x) => a.concat(x), []))
  .concat(mods.reduce((a, o) => a.concat([o.courtBrut, o.etiq, o.objBrut].concat(o.contenuBrut)), [])).filter(t => t != null);
/* ouvre un module (s'il ne l'est pas) et rend le texte de toute la page de la formation */
async function ouvrirModule(page, m){
  if (!(await page.$(`.fo-mod.ouvert .fo-tete[data-mod="${m}"]`))) { await page.click(`.fo-tete[data-mod="${m}"]`); await attendre(page, 650); }
  return page.$eval("#fo-vue", x => x.textContent.replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ")).catch(() => "");
}
/* un module : sa ligne courte (carte), sa ligne « Objectif : » et son contenu, normalisés ; et les mêmes SANS normalisation
   (courtBrut, etiq : l'étiquette « Objectif : » seule, objBrut, contenuBrut) */
const objModule = (page, m) => page.evaluate(m => { const n = x => x ? x.textContent.replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim() : null, br = x => x ? x.textContent : null;
  const t = document.querySelector(`.fo-tete[data-mod="${m}"]`), s = t && t.closest(".fo-mod"), li = Array.from((s && s.querySelectorAll(".fo-corps .fo-contenu li")) || []);
  return { court: n(t && t.querySelector(".fo-obj-court")), obj: n(s && s.querySelector(".fo-corps .fo-obj")), contenu: li.map(n),
    courtBrut: br(t && t.querySelector(".fo-obj-court")), etiq: br(s && s.querySelector(".fo-corps .fo-obj > b")), objBrut: br(s && s.querySelector(".fo-corps .fo-obj")), contenuBrut: li.map(br) }; }, m);
const introParcours = page => page.evaluate(() => { const h = Array.from(document.querySelectorAll("#fo-vue h2")).find(x => /^(Ton parcours|Your journey)$/.test(x.textContent.trim()));
  const p = h && h.parentElement.querySelector("p"); return p ? { brut: p.textContent, n: p.textContent.replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim() } : { brut: "", n: "" }; });
/* rien ne sort de l'écran : ni la page, ni un élément des deux cartes (texte pour lecteurs d'écran à part) ; bon : et les
   cartes sont bien là (au moins 10 éléments mesurés) ; relecture (v62) : inv = le sélecteur d'une invitation mesurée aussi
   (bon : ses 8 éléments, la section comprise, tous mesurés) */
const INV_SEL = "#invitation-formation_commence_ici";
const horsEcran = (page, inv) => page.evaluate(inv => { const w = window.innerWidth, l = []; let n = 0, ni = 0;
  document.querySelectorAll("#fo-depart, #fo-depart *, #fo-apercu, #fo-apercu *" + (inv ? ", " + inv + ", " + inv + " *" : "")).forEach(e => { if (e.closest(".sr-only")) return; const r = e.getBoundingClientRect(); if (r.width) { n++; if (inv && e.closest(inv)) ni++; }
    if (r.width && (r.left < -1 || r.right > w + 1)) l.push((e.className || e.tagName) + " " + Math.round(r.left) + "-" + Math.round(r.right)); });
  const page = document.documentElement.scrollWidth > w + 1;
  return { page, l, n, ni, bon: !page && l.length === 0 && n >= 10 && (!inv || ni === 8) }; }, inv || "");
/* relecture : contraste d'au moins 4,5:1 par défaut ; 3:1 (celui des tuiles de l'app) seulement pour ces exceptions
   NOMMÉES, et seulement quand le texte a exactement la couleur du jeton de l'app nommé (un texte passé à une autre couleur
   retombe sous le seuil de 4,5:1) : [sélecteur, jeton] */
const CONTRASTE = 4.5, CONTRASTE_EXC = 3;
const EXCEPTIONS_CONTRASTE = [
  [".t-sub", "--ink-3"],   // libellés des tuiles : le texte secondaire de toute l'app (environ 3,9 à 4:1 dans les deux thèmes)
  [".note", "--ink-3"],    // notes : le même texte secondaire
  /* thème clair seulement : la couleur d'accent de l'app (--accent #9a7420 sur blanc : 4,29:1) — l'étiquette « Commence ici »
     (comme toutes les étiquettes .eyebrow de l'app), « Départ lancé ✓ » et la coche ✓ (icône d'état, aria-hidden, blanche
     sur son disque d'accent) ; en thème sombre, ces textes doivent atteindre 4,5:1 */
  [".eyebrow", "--accent", "light"],
  [".fo-depart-ligne", "--accent", "light"],
  [".fo-depart-c", "--accent-ink", "light"],
  /* relecture (v62) : l'invitation « Bien joué, ton départ est lancé. », mesurée aussi, reprend le bloc d'appel de la page
     « Ton plan d'action » et de l'accueil (div.dc-cta) : sa ligne « 15 min avec Lucas · offert » et « Plus tard » sont le
     même texte secondaire (--ink-3 : 3,99:1 en sombre, 4,27:1 en clair), et en thème clair seulement le bouton doré de
     l'app (blanc sur --accent : 4,29:1, comme la coche ✓ ci-dessus) ; limitées à l'invitation */
  [".invitation .dc-cta-sous", "--ink-3"],
  [".invitation .lien-discret", "--ink-3"],
  [".invitation a.btn", "--accent-ink", "light"]
];
const tropFaibles = k => k.out.filter(x => !(x.r >= (x.exc ? CONTRASTE_EXC : CONTRASTE)));
/* contraste de chaque texte des deux cartes avec son fond réel (fonds semi-transparents composés jusqu'au corps de la page) ;
   relecture (v62) : inv = le sélecteur d'une invitation mesurée aussi (ses textes marqués inv) */
const contrastes = (page, inv) => page.evaluate(([EXC, inv]) => {
  const rgb = s => { const m = /rgba?\(([^)]+)\)/.exec(s || ""); if (!m) return null; const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const sur = (h, b) => ({ r: h.r * h.a + b.r * (1 - h.a), g: h.g * h.a + b.g * (1 - h.a), b: h.b * h.a + b.b * (1 - h.a), a: 1 });
  const fond = el => { const pile = []; for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { pile.push(c); if (c.a >= 1) break; } }
    let f = { r: 255, g: 255, b: 255, a: 1 }; for (let i = pile.length - 1; i >= 0; i--) f = sur(pile[i], f); return f; };
  const L = c => { const k = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * k(c.r) + 0.7152 * k(c.g) + 0.0722 * k(c.b); };
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  /* la couleur calculée d'un jeton (--ink-3…) : celle d'un élément témoin coloré par var(jeton) */
  const jeton = v => { const s = document.createElement("span"); s.style.color = "var(" + v + ")"; document.body.appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c; };
  const out = [];
  document.querySelectorAll("#fo-depart *, #fo-apercu *" + (inv ? ", " + inv + " *" : "")).forEach(el => {
    if (el.closest(".sr-only")) return;
    const t = Array.from(el.childNodes).filter(x => x.nodeType === 3).map(x => x.nodeValue).join("").trim(); if (!t) return;
    const cs = getComputedStyle(el).color, f = fond(el), c = rgb(cs);
    /* exception nommée : l'élément porte la classe ET a exactement la couleur du jeton (et, si elle le dit, dans ce thème) */
    const theme = document.documentElement.getAttribute("data-theme"), exc = EXC.find(([sel, v, th]) => el.matches(sel) && cs === jeton(v) && (!th || th === theme));
    const dansInv = !!inv && !!el.closest(inv);
    if (!c) { out.push({ t: t.slice(0, 24), r: 0, exc: null, inv: dansInv }); return; }
    out.push({ t: t.slice(0, 24), cls: String(el.className || el.tagName), r: Math.round(ratio(sur(c, f), f) * 100) / 100, exc: exc ? exc[0] : null, inv: dansInv });
  });
  return { out, fond: getComputedStyle(document.getElementById("fo-depart")).backgroundColor, theme: document.documentElement.getAttribute("data-theme") };
}, [EXCEPTIONS_CONTRASTE, inv || ""]);
const egal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z$/;

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF66_PORT=9821 node verif66.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== J1. prospect, français =================== */
  await bloc("J1. prospect, français (390 px, sombre) : textes J, 15 axes et 10 défis, progression d'avant gardée", async () => {
    const ID = PID(1);
    const db = base({ comptes: [PROSPECT(1, "Léa", [["formation", FORM_AVANT("m5")]])] });
    const { page } = await contexte(b, quiP(1), db, { viewport: MOBILE });
    await ouvrirFormation(page);
    const intro = await introParcours(page);
    ok("J1 : « Ton parcours » : « Une méthode simple pour poser les bases en 14 jours : ton alimentation… » (texte du brief), espace insécable avant « : »",
      intro.n === TX.intro && intro.brut.includes("jours\u00a0: ton alimentation") && intro.brut.includes("occupées\u00a0: le plan"), JSON.stringify(intro.brut.slice(0, 120)));
    const S = await sourceChallenges(page), m5 = await module5(page);
    const vus = axesVus(m5), att = axesAttendus(S, false), bruts = axesBruts(m5), brutDe = cle => bruts[AXES_ORDRE.indexOf(cle)] || [];
    ok("J5 : module 5 : 5 challenges, 15 axes ; les 5 axes remplacés avec l'objectif et le défi du brief (« Garder la faim sous contrôle. »…), les 10 autres inchangés (tels qu'en c800fe0) ; espace insécable dans « plus tôt : un grand verre », « lendemain : pas de repas », « 2 000 pas »",
      m5.chal.length === 5 && vus.length === 15 && S.axes.length === 15 && egal(vus, att) && egal(S.axes.map(x => x.cle), AXES_ORDRE)
      && (brutDe("c1|Discipline")[2] || "").includes("plus tôt\u00a0: un grand verre") && (brutDe("c3|Perte de gras")[2] || "").includes("lendemain\u00a0: pas de repas") && (brutDe("c4|Perte de gras")[2] || "").includes("2\u00a0000 pas"),
      JSON.stringify(vus.filter((x, i) => !egal(x, att[i])).slice(0, 2)) + " " + JSON.stringify(["c1|Discipline", "c3|Perte de gras", "c4|Perte de gras"].map(k => brutDe(k)[2])));
    const df = m5.defis, attD = defisAttendus(S, false, { d6: true, d7: true });
    ok("J6 : 10 défis ; les 6 réécrits (« Des collations prévues, pas subies », « 10 minutes de respiration ou de méditation par jour »…) avec la description du brief, d3, d4, d8, d10 inchangés (tels qu'en c800fe0) ; espace insécable dans « plus tôt : bien dormir »",
      df.length === 10 && S.defis === 10 && egal(df.map(x => x.slice(0, 1).concat(x.slice(2))), attD.map(x => x.slice(0, 1).concat(x.slice(2))))
      && ((m5.defisBrut[DEFIS_ORDRE.indexOf("d9")] || [])[1] || "").includes("tôt\u00a0: bien dormir"),
      JSON.stringify(df.filter((x, i) => !egal(x.slice(2), (attD[i] || []).slice(2))).slice(0, 2)) + " " + JSON.stringify((m5.defisBrut[8] || [])[1]));
    ok("progression d'avant le changement : d6 et d7 toujours cochés (et eux seuls, « 2/10 »), le challenge c3 toujours choisi (et lui seul)",
      egal(df.map(x => x[1]), attD.map(x => x[1])) && m5.pastille === "2/10" && egal(m5.chal.map(c => [c.id, c.choisi]), [["c1", false], ["c2", false], ["c3", true], ["c4", false], ["c5", false]]) && m5.chal[2].pastille === "Choisi",
      JSON.stringify([df.map(x => x[1]), m5.pastille, m5.chal.map(c => [c.id, c.choisi, c.pastille])]));
    let tout = await page.$eval("#fo-vue", x => x.textContent.replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ")).catch(() => "");
    const o1c = await objModule(page, "m1"), mods = [Object.assign({ m: "m5" }, await objModule(page, "m5"))];   // module 5 ouvert (FORM_AVANT)
    for (const m of ["m0", "m1", "m2", "m3", "m4", "m6"]) { tout += " " + await ouvrirModule(page, m); mods.push(Object.assign({ m }, await objModule(page, m))); }
    await ouvrirModule(page, "m0"); const o0 = await objModule(page, "m0");
    await ouvrirModule(page, "m1"); const o1 = await objModule(page, "m1");
    ok("J2 et J3 : module 0 « Des objectifs réalistes : ce qu'on peut viser en 14 jours… » (espace insécable avant « : ») ; module 1 « Travailler l'état d'esprit qui fait tenir une transformation dans la durée. » (carte et ligne « Objectif : »)",
      o0.contenu[0] === TX.m0 && (o0.contenuBrut[0] || "").includes("réalistes\u00a0: ce qu'on") && o1c.court === TX.m1 && o1.court === TX.m1 && o1.obj === "Objectif : " + TX.m1,
      JSON.stringify([o0.contenuBrut[0], o1c.court, o1.obj]));
    /* relecture : l'étiquette lue telle qu'affichée, sans normalisation ; et la règle du contrat sur tous les textes de la
       formation qui passent par typoFr (objectifs et contenus des 7 modules, lignes objectif et défis des 15 axes, titres et
       descriptions des 10 défis) */
    const typo = textesTypo(m5, mods), simples = typo.filter(t => ESPACE_SIMPLE.test(t));
    ok("typographie française : l'étiquette « Objectif » suivie d'une espace insécable, telle qu'affichée (7 modules et 15 axes) ; aucune espace simple avant « : ; ? ! » ni après « « » dans les objectifs, contenus, défis et descriptions (" + typo.length + " textes)",
      mods.length === 7 && mods.every(o => o.etiq === "Objectif\u00a0:") && bruts.length === 15 && bruts.every(x => x[0] === "Objectif\u00a0:")
      && typo.length >= 60 && typo.filter(t => INSECABLE.test(t)).length >= 20 && simples.length === 0,
      JSON.stringify([mods.filter(o => o.etiq !== "Objectif\u00a0:").map(o => [o.m, o.etiq]), bruts.filter(x => x[0] !== "Objectif\u00a0:").map(x => x[0]).slice(0, 2), typo.length, simples.slice(0, 2)]));
    ok("les 7 modules ouverts un à un : plus aucun ancien texte dans la page (« perdre tes premiers kilos », « garantir », jeûne, à jeun, double séance, « limite le stockage », « glucides après 17 h », « journée pauvre en glucides »…) ; aucun prix",
      tout.length > 3000 && anciensVus(tout, ANCIENS).length === 0 && !PRIX.test(tout), JSON.stringify(anciensVus(tout, ANCIENS)) + " " + (tout.match(PRIX) || [""])[0]);
    await attendre(page, 1200);
    const Fo = contenuDe(db, ID, "formation") || {};
    ok("en base, après ces 7 ouvertures (seule la clé formation est écrite) : d6, d7, c3 et les 3 étapes cochées intacts, aucune trace de « départ » (aucune vidéo lancée)",
      saisies(db).length >= 1 && saisies(db).every(e => e.outil === "formation" && e.user_id === ID) && egal(Fo.defis, { d6: true, d7: true }) && Fo.challenge === "c3" && egal(Fo.coches, FORM_AVANT().coches) && !("depart" in Fo),
      resume(db) + " " + JSON.stringify(Fo).slice(0, 200));
  });

  /* =================== J2. client Thomas, français =================== */
  await bloc("J2. client Thomas, français (390 px) : mêmes textes", async () => {
    const db = base();
    const { page } = await contexte(b, THOMAS, db, { viewport: MOBILE });
    await ouvrirFormation(page);
    const intro = await introParcours(page), o1 = await objModule(page, "m1");   // module 1 ouvert (fixtures : ouvert « m1 »)
    let tout = await page.$eval("#fo-vue", x => x.textContent.replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ")).catch(() => "");
    tout += " " + await ouvrirModule(page, "m0"); const o0 = await objModule(page, "m0");
    ok("client : « Ton parcours » (J1), module 0 (J2), module 1 (J3 : carte et « Objectif : », étiquette suivie d'une espace insécable) avec les textes du brief",
      intro.n === TX.intro && o0.contenu[0] === TX.m0 && o1.court === TX.m1 && o1.obj === "Objectif : " + TX.m1 && o1.etiq === "Objectif\u00a0:" && o0.etiq === "Objectif\u00a0:",
      JSON.stringify([intro.n.slice(0, 60), o0.contenu[0], o1.obj, o1.etiq]));
    tout += " " + await ouvrirModule(page, "m5");
    const S = await sourceChallenges(page), m5 = await module5(page);
    ok("client, module 5 : 15 axes et 10 défis, les textes du brief (J5, J6) et les autres tels qu'en c800fe0, étiquettes « Objectif » + espace insécable, son challenge c1 toujours choisi",
      m5.chal.length === 5 && axesVus(m5).length === 15 && egal(axesVus(m5), axesAttendus(S, false)) && axesBruts(m5).every(x => x[0] === "Objectif\u00a0:")
      && egal(m5.defis.map(x => x.slice(0, 1).concat(x.slice(2))), defisAttendus(S, false).map(x => x.slice(0, 1).concat(x.slice(2)))) && m5.chal.filter(c => c.choisi).map(c => c.id).join() === "c1",
      JSON.stringify([m5.chal.length, m5.defis.length, m5.chal.filter(c => c.choisi).map(c => c.id), axesBruts(m5).map(x => x[0]).filter(x => x !== "Objectif\u00a0:").slice(0, 2)]));
    ok("client : aucun ancien texte (J), aucun prix", anciensVus(tout, ANCIENS).length === 0 && !PRIX.test(tout), JSON.stringify(anciensVus(tout, ANCIENS)));
  });

  /* =================== J3. prospect, anglais =================== */
  await bloc("J3. prospect, anglais (390 px, clair) : textes J traduits, « Goal: » pour les 5 axes", async () => {
    const ID = PID(2);
    const db = base({ comptes: [PROSPECT(2, "Emma", [["formation", FORM_AVANT("m5")]])] }); avecEn(db, ID);
    const { page } = await contexte(b, quiP(2), db, { viewport: MOBILE, langue: "en", stockage: { mhx_theme: "light" } });
    await ouvrirFormation(page); await attendre(page, 400);
    const intro = await introParcours(page), S = await sourceChallenges(page), m5 = await module5(page);
    let tout = await page.$eval("#fo-vue", x => x.textContent.replace(/\s+/g, " ")).catch(() => "");
    const o1c = await objModule(page, "m1");
    tout += " " + await ouvrirModule(page, "m0"); const o0 = await objModule(page, "m0");
    tout += " " + await ouvrirModule(page, "m1"); const o1 = await objModule(page, "m1");
    /* relecture : en anglais, typoFr ne fait rien : aucun texte traduit ne porte d'espace insécable avant la ponctuation */
    const en1 = [intro.brut, o0.contenuBrut[0], o1c.courtBrut, o1.objBrut];
    ok("anglais : « A simple method to lay the foundations in 14 days… » (J1), « Realistic goals: what you can aim for… » (J2), « Build the mindset that makes a transformation last. » (J3 : carte et « Goal: ») ; aucune espace insécable avant « : »",
      intro.n === TX.intro_en && o0.contenu[0] === TX.m0_en && o1c.court === TX.m1_en && o1.obj === "Goal: " + TX.m1_en && o1.etiq === "Goal:" && en1.every(t => typeof t === "string" && !INSECABLE.test(t)),
      JSON.stringify([intro.n.slice(0, 50), o0.contenu[0], o1c.court, o1.obj, o1.etiq, en1.filter(t => typeof t !== "string" || INSECABLE.test(t))]));
    const vus = axesVus(m5), att = axesAttendus(S, true), bruts = axesBruts(m5), etiqAtt = AXES_ORDRE.map(k => J5[k] ? "Goal:" : "Objectif :");
    ok("anglais, module 5 : les 5 axes remplacés « Goal: » + objectif et défi anglais du brief ; les 10 autres entièrement en français (tels qu'en c800fe0), « Objectif : » inchangé (espace simple) ; aucune espace insécable avant la ponctuation",
      vus.length === 15 && egal(vus, att) && vus.filter(x => x[2] === "Goal:").length === 5 && egal(bruts.map(x => x[0]), etiqAtt) && bruts.every(x => x.every(t => typeof t === "string" && !INSECABLE.test(t))),
      JSON.stringify(vus.filter((x, i) => !egal(x, att[i])).slice(0, 2)) + " " + JSON.stringify(bruts.filter((x, i) => x[0] !== etiqAtt[i] || x.some(t => typeof t !== "string" || INSECABLE.test(t))).slice(0, 2)));
    const attD = defisAttendus(S, true, { d6: true, d7: true });
    ok("anglais, 10 défis : les 6 réécrits en anglais (« Planned snacks, not random ones »…), d3, d4, d8, d10 en français (tels qu'en c800fe0) ; d6 et d7 cochés, c3 choisi ; aucune espace insécable avant la ponctuation",
      egal(m5.defis, attD) && m5.chal.filter(c => c.choisi).map(c => c.id).join() === "c3" && m5.defisBrut.length === 10 && m5.defisBrut.every(x => x.every(t => typeof t === "string" && !INSECABLE.test(t))),
      JSON.stringify(m5.defis.filter((x, i) => !egal(x, attD[i])).slice(0, 2)) + " " + JSON.stringify(m5.defisBrut.filter(x => x.some(t => typeof t !== "string" || INSECABLE.test(t))).slice(0, 2)));
    ok("anglais : aucun ancien texte (ni anglais : « lose your first », « guarantee »…, ni français), aucun prix", anciensVus(tout, ANCIENS_EN.concat(ANCIENS)).length === 0 && !PRIX.test(tout), JSON.stringify(anciensVus(tout, ANCIENS_EN.concat(ANCIENS))));
  });

  /* =================== I1. prospect, français : les deux cartes =================== */
  await bloc("I1. prospect, français (390 px, sombre) : « Commence ici » et « Ce qui t'attend dans ta formation »", async () => {
    const ID = PID(3);
    const db = base({ comptes: [PROSPECT(3, "Chloé")] });
    const { page } = await contexte(b, quiP(3), db, { viewport: MOBILE });
    await ouvrirFormation(page);
    ok("ordre : #fo-depart, puis #fo-apercu, puis « Ton parcours »", egal(await ordre(page), ["fo-depart", "fo-apercu", "Ton parcours"]), JSON.stringify(await ordre(page)));
    const d = await carteDepart(page);
    ok("« Commence ici » (sans durée : FORMATION.video_minutes vide), affiché en capitales (« COMMENCE ICI ») ; titre « 3 actions pour bien démarrer aujourd'hui »",
      !!d && d.tag === "SECTION" && /\bpanel\b/.test(d.classes) && /\bfo-depart\b/.test(d.classes) && d.eyebrow === I_FR.etiquette && d.capitales === "COMMENCE ICI" && d.h2 === I_FR.titre, JSON.stringify(d && [d.classes, d.eyebrow, d.capitales, d.h2]));
    ok("les 3 actions : vidéo (#fo-presentation), calories (#/calculateur), poids (#/mensurations), leurs textes ; aucune faite (ni coche, ni « (fait) ») ; tactiles (44 px au moins)",
      !!d && d.ol === 1 && egal(d.actions.map(a => [a.k, a.href, a.t]), I_FR.actions) && d.actions.every(a => !a.fait && a.c === "" && a.sr === null && a.h >= 44), JSON.stringify(d && d.actions));
    const a = await carteApercu(page), n = await chiffresAttendus(page);
    ok("« Ce qui t'attend dans ta formation » : 7 modules, 7 vidéos avec Lucas, 15 guides et documents, 25 défis (comptés dans FORMATION et LECONS) ; plus aucun « à télécharger » (ni « download ») dans la carte",
      !!a && /\bpanel\b/.test(a.classes) && a.h2 === I_FR.apercu && egal(a.tuiles, [["7", I_FR.tuiles[0]], ["7", I_FR.tuiles[1]], ["15", I_FR.tuiles[2]], ["25", I_FR.tuiles[3]]]) && egal(a.tuiles.map(x => x[0]), n) && !TELECHARGER.test(a.brut),
      JSON.stringify(a && a.tuiles) + " attendu " + JSON.stringify(n) + " · " + JSON.stringify(a && (a.brut.match(TELECHARGER) || [""])[0]));
    ok("… ses 2 lignes (« Dont 3 programmes d'entraînement… », « Plus tes outils : … Gratuit, sans limite de temps. »), espace insécable avant « : »",
      !!a && egal(a.lignes, I_FR.lignes) && a.brut.includes("outils\u00a0: organisation"), JSON.stringify(a && a.lignes));
    ok("compteur « 0 / 49 étapes » (les 3 actions ne sont pas des étapes) ; aucun prix dans les deux cartes", (await compteur(page)) === I_FR.compteur && !PRIX.test(await page.$eval("#fo-depart", x => x.textContent) + (a ? a.brut : "")), await compteur(page));
    ok("390 px : aucun débordement horizontal (la page, les cartes, les tuiles)", (await horsEcran(page)).bon, JSON.stringify(await horsEcran(page)) + " " + await largeur(page));
    ok("une simple visite : rien d'écrit ; calc_perso et mens lus en UNE lecture groupée (outil=in.(calc_perso,mens))", saisies(db).length === 0 && uneLectureGroupee(db, ID), resume(db) + " " + JSON.stringify(lecturesDepart(db, ID)));
    await page.click('[data-depart="calcul"]'); await attendre(page, 1600); const v1 = await ou(page);
    const L1 = db.lectures.length;   // 2e visite de la formation (le calculateur lit calc_perso pour lui-même)
    await aller(page, "#/formation", 1500); await page.waitForSelector("#fo-depart"); await attendre(page, 300);
    const groupee2 = uneLectureGroupee(db, ID, L1), l2 = lecturesDepart(db, ID, L1).map(x => x.outil);
    await page.click('[data-depart="pesee"]'); await attendre(page, 1600); const v2 = await ou(page);
    ok("« Calcule tes calories » mène au calculateur, « Note ton poids de départ » à Ma progression", v1.courant === "calculateur" && v1.hash === "#/calculateur" && v2.courant === "mensurations" && v2.hash === "#/mensurations", JSON.stringify([v1, v2]));
    ok("… revenue sur la formation : de nouveau UNE lecture groupée (sans cache), et rien d'écrit dans tout le bloc (formation, calculateur, Ma progression)", groupee2 && saisies(db).length === 0, resume(db) + " " + JSON.stringify(l2));
  });

  /* =================== I2. états des 3 actions =================== */
  await bloc("I2. prospect : états des 3 actions selon la base", async () => {
    const vid = { depart: { video: avant(2 * H) } };
    /* relecture (v62) : aussi deux cas à 2 actions sur 3 (vidéo + calcul sans pesée ; calcul + pesée sans vidéo) : aucune
       invitation tant qu'une action manque */
    const cas = [
      [11, "rien", [], [false, false, false]],
      [12, "calcul valide et adulte, pas de pesée", [["calc_perso", CP]], [false, true, false]],
      [13, "calcul mineur (16 ans), pesée de départ", [["calc_perso", CP_MINEUR], ["mens", MENS_DEPART]], [false, false, true]],
      [14, "vidéo déjà lancée, calcul incomplet, suivi sans poids", [["formation", vid], ["calc_perso", CP_INCOMPLET], ["mens", MENS_VIDE]], [true, false, false]],
      [18, "vidéo déjà lancée, calcul valide, pas de pesée", [["formation", vid], ["calc_perso", CP]], [true, true, false]],
      [19, "calcul valide, une mesure avec un poids, pas de vidéo", [["calc_perso", CP], ["mens", MENS_MESURE]], [false, true, true]],
      [15, "les 3 : vidéo, calcul valide, une mesure avec un poids", [["formation", vid], ["calc_perso", CP], ["mens", MENS_MESURE]], null]];
    const db = base({ comptes: cas.map(([k, , d]) => PROSPECT(k, "P" + k, d)) });
    const vus = [];
    for (const [k, , , etat] of cas) {
      const L0 = db.lectures.length;
      const { c, page } = await contexte(b, quiP(k), db, { viewport: MOBILE });
      await ouvrirFormation(page);
      /* v62 (brief V2, H4) : les 3 faites à l'ouverture de #/formation → l'invitation formation_commence_ici juste après
         #fo-depart (posée après la lecture groupée d'intake et challenge) ; relecture : une action manque → on laisse
         1 s de plus à une invitation qui arriverait après une lecture, avant de compter */
      if (!etat) await page.waitForSelector("#invitation-" + INV_DEPART.code, { timeout: 5000 }).catch(() => {});
      else await attendre(page, 1000);
      vus.push({ k, etat, d: await carteDepart(page), ordre: await ordre(page, 4), compteur: await compteur(page), inv: await carteInvitation(page, INV_DEPART.code), nbInv: await page.$$eval("section.invitation", l => l.length).catch(() => -1),
        lInv: lecturesInvitation(db, PID(k), L0).map(x => x.outil) });
      await c.close();
    }
    const partiels = vus.filter(v => v.etat), trois = vus.find(v => !v.etat);
    ok("états : rien fait ; calcul seul ; pesée seule (calcul mineur : pas fait) ; vidéo seule (calcul incomplet, suivi sans poids : pas faits) ; vidéo et calcul sans pesée ; calcul et pesée sans vidéo",
      partiels.length === 6 && partiels.every(v => v.d && egal(v.d.actions.map(a => a.fait), v.etat)), JSON.stringify(partiels.map(v => v.d && v.d.actions.map(a => a.fait))));
    ok("la coche et « (fait) » (lecteurs d'écran) sur les seules actions faites ; mêmes textes et liens",
      partiels.length === 6 && partiels.every(v => v.d && v.d.actions.every((a, j) => a.c === (v.etat[j] ? "✓" : "") && a.sr === (v.etat[j] ? I_FR.fait : null) && a.t === I_FR.actions[j][2] && a.href === I_FR.actions[j][1])), JSON.stringify(partiels.map(v => v.d && v.d.actions.map(a => [a.c, a.sr]))));
    const f = trois.d, iv = trois.inv, ko = invitationKo(iv, INV_DEPART, "fo-depart", quiLien(15, "P15"));
    /* v62 (brief V2, H4) : avant, « Ce qui t'attend » venait juste après ; désormais l'invitation « Bien joué, ton départ
       est lancé. » s'intercale (juste après #fo-depart), puis « Ce qui t'attend » et « Ton parcours » ; la carte est
       vérifiée (relecture : structure commune exacte et dans l'ordre, ses 6 textes et rien d'autre — aucune valeur saisie,
       ce prospect a 60 kg et 70,4 kg en base —, lien Calendly vérifié sans l'app, rel=noopener, « Plus tard ») ; aucune
       invitation tant qu'une des 3 actions manque */
    ok("les 3 faites : la carte se replie en UNE ligne « Départ lancé » avec sa coche (section.panel.fo-depart.fo-depart-fini, ni étiquette, ni titre, ni liste), suivie de l'invitation « Bien joué, ton départ est lancé. » (structure commune dans l'ordre : h2, « Ton objectif », texte, div.dc-cta = bouton, « 15 min avec Lucas · offert », « Plus tard » ; ses 6 textes et rien d'autre ; lien Calendly de 15 min utm_source=app, utm_medium=bouton, utm_content=formation_commence_ici, nouvel onglet, noopener), puis « Ce qui t'attend » ; aucune invitation dans les 6 autres cas",
      !!f && /\bfo-depart-fini\b/.test(f.classes) && /\bpanel\b/.test(f.classes) && egal(f.enfants, ["P.fo-depart-ligne"]) && f.ligne === I_FR.fini && f.ol === 0 && f.eyebrow === null && f.h2 === null && egal(trois.ordre, ["fo-depart", "invitation-" + INV_DEPART.code, "fo-apercu", "Ton parcours"])
        && ko.length === 0 && partiels.every(v => v.nbInv === 0 && v.inv === null),
      JSON.stringify([ko, f, trois.ordre, iv && iv.textes, iv && iv.lien, partiels.map(v => v.nbInv)]));
    ok("compteur « 0 / 49 étapes » dans tous les cas (vidéo lancée, calcul, pesée : aucune étape de plus)", vus.every(v => v.compteur === I_FR.compteur), JSON.stringify(vus.map(v => v.compteur)));
    /* relecture (contrat H) : intake et challenge lus en UNE lecture groupée au déclencheur, jamais à la simple ouverture
       d'une page : aucune tant qu'une action manque (pas de déclencheur), au plus une pour les 3 faites */
    ok("ces 7 visites : rien d'écrit ; une seule lecture groupée de calc_perso et mens chacune ; lecture groupée d'intake et challenge (invitation) : aucune dans les 6 visites où une action manque, au plus une pour les 3 faites",
      saisies(db).length === 0 && cas.every(([k]) => uneLectureGroupee(db, PID(k))) && partiels.every(v => v.lInv.length === 0) && trois.lInv.length <= 1,
      resume(db) + " " + JSON.stringify(cas.map(([k]) => lecturesDepart(db, PID(k)).map(x => x.outil))) + " " + JSON.stringify(vus.map(v => [v.k, v.lInv])));
  });

  /* relecture (contrat I : « + ce qui attend encore d'être envoyé (outilDecouverte.saisiesLocales) ») : un calcul enregistré
     dans le calculateur et pas encore arrivé au serveur (envoi retenu 4 s par le faux Supabase : db.retard ; gabarit de
     verif56 « I. accueil juste après l'enregistrement ») ; la lecture groupée ne le rapporte pas, seule la saisie locale
     le dit. Prospect 16 : aucun calcul en base, retour IMMÉDIAT sur la formation (la saisie attend encore ses 700 ms, ou
     vient de partir). Prospect 17 : un calcul incomplet en base (il y a 1 h), complété, formation ouverte 1 s après
     (envoi parti et en vol : seule la copie gardée sur l'appareil, plus récente que la base, le dit). */
  await bloc("I2. prospect : calcul enregistré à l'instant (saisie pas encore arrivée au serveur)", async () => {
    const ID1 = PID(16), ID2 = PID(17);
    const db = base({ comptes: [PROSPECT(16, "P16"), PROSPECT(17, "P17", [["calc_perso", CP_INCOMPLET, avant(H)]])] });
    db.retard = { calc_perso: 4000 };
    const surFormation = async page => { await aller(page, "#/formation", 300); await page.waitForSelector("#fo-depart", { timeout: 5000 }); await attendre(page, 300); return carteDepart(page); };
    const enVol = (page, id) => page.evaluate(id => ({ attente: Store.valeursEnAttente[id + "|calc_perso"] !== undefined, copie: !!Auth.magasin().getItem("mhx_attente|" + id + "|calc_perso") }), id);
    const calculFait = d => !!d && egal(d.actions.map(a => [a.fait, a.c, a.sr]), [[false, "", null], [true, "✓", I_FR.fait], [false, "", null]]);
    let { page } = await contexte(b, quiP(16), db, { viewport: MOBILE });   // reste ouverte : sa saisie doit pouvoir arriver
    await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 800);
    await page.click('#sexe [data-v="F"]'); await page.fill("#age", "30"); await page.fill("#taille", "165"); await page.fill("#poids", "60"); await page.fill("#heures", "3");
    const L1 = db.lectures.length, v1 = await enVol(page, ID1);
    const d1 = await surFormation(page);
    const r1 = { v1, serveur: ecr(db, "calc_perso", ID1).length, enBase: !!contenuDe(db, ID1, "calc_perso"), groupee: uneLectureGroupee(db, ID1, L1), autres: saisies(db).length };
    ok("calcul enregistré, retour immédiat sur la formation (pas encore arrivé au serveur : la lecture groupée ne le rapporte pas) : « Calcule tes calories » déjà faite (coche, « (fait) »), les 2 autres non ; une seule lecture groupée ; rien d'écrit à l'affichage",
      (v1.attente || v1.copie) && r1.serveur === 0 && !r1.enBase && calculFait(d1) && r1.groupee && r1.autres === 0, JSON.stringify(r1) + " " + JSON.stringify(d1 && d1.actions));
    ({ page } = await contexte(b, quiP(17), db, { viewport: MOBILE }));
    await page.goto(URL0 + "#/calculateur"); await pret(page, "#tdee"); await attendre(page, 800);
    await page.fill("#pas", "6000"); await page.fill("#heures", "3");
    await attendre(page, 1000);
    const L2 = db.lectures.length, v2 = await enVol(page, ID2);
    const d2 = await surFormation(page);
    const r2 = { v2, parti: db.journal.includes("P calc_perso"), serveur: ecr(db, "calc_perso", ID2).length, enBase: contenuDe(db, ID2, "calc_perso"), groupee: uneLectureGroupee(db, ID2, L2) };
    await attendre(page, 4800);
    const fin = { p16: ecr(db, "calc_perso", ID1).length, p17: ecr(db, "calc_perso", ID2).length, tout: resume(db), n: saisies(db).length, copie: (await enVol(page, ID2)).copie };
    ok("calcul incomplet en base complété, formation ouverte 1 s après (envoi parti, en vol : seule la copie gardée sur l'appareil, plus récente que la base, le dit) : « Calcule tes calories » faite ; une seule lecture groupée ; une fois arrivés : une écriture de calc_perso par prospect, rien d'autre (formation jamais écrite)",
      !v2.attente && v2.copie && r2.parti && r2.serveur === 0 && egal(r2.enBase, CP_INCOMPLET) && calculFait(d2) && r2.groupee
      && fin.p16 === 1 && fin.p17 === 1 && fin.n === 2 && ecr(db, "formation").length === 0 && !fin.copie,
      JSON.stringify(r2) + " " + JSON.stringify(d2 && d2.actions) + " " + JSON.stringify(fin));
  });

  /* =================== I3. la vidéo de bienvenue =================== */
  await bloc("I3. prospect : la vidéo de bienvenue lancée depuis « Commence ici »", async () => {
    const ID = PID(21), ID2 = PID(22);
    const AVANT = { coches: { p1a: true }, ouvert: "", lecon: "", challenge: "c3", defis: { d6: true }, diete: {}, semaine: 1, jour: 0, priorites: { semaine: [], demain: [] }, notes: [], objectifs: [] };
    const db = base({ comptes: [PROSPECT(21, "Manon", [["formation", AVANT]]), PROSPECT(22, "Inès")] });
    let { c, page } = await contexte(b, quiP(21), db, { viewport: MOBILE });
    await ouvrirFormation(page);
    const av = await page.evaluate(() => { const bx = document.getElementById("fo-presentation"), s = bx && bx.closest("section"), vg = bx && bx.querySelector(".video-vignette"), r = bx && bx.getBoundingClientRect();
      if (s) s.__v66 = "parcours"; const d = document.getElementById("fo-depart"); if (d) d.__v66 = "avant";
      const a = document.getElementById("fo-apercu"); if (a) a.__v66 = "apercu";   // relecture : « Ce qui t'attend » marquée aussi
      return { boite: !!bx && bx.classList.contains("video-boite"), parcours: !!s && !!Array.from(s.querySelectorAll("h2")).find(h => h.textContent.trim() === "Ton parcours"), yt: vg && vg.dataset.yt, attendu: FORMATION.video, iframe: !!(bx && bx.querySelector("iframe")),
        apercu: !!a, vu: !!r && r.top < innerHeight && r.bottom > 0, y: Math.round(scrollY) }; });
    const c0 = await compteur(page);
    ok("avant : la vidéo de bienvenue (#fo-presentation, boîte vidéo de « Ton parcours ») avec sa vignette, pas encore de lecteur", av.boite && av.parcours && av.yt === av.attendu && !av.iframe && av.apercu, JSON.stringify(av));
    const t0 = Date.now();
    await page.click('[data-depart="video"]'); await attendre(page, 1600);
    const ap = await page.evaluate(() => { const bx = document.getElementById("fo-presentation"), s = bx && bx.closest("section"), f = bx && bx.querySelector("iframe"), d = document.getElementById("fo-depart"), a = document.getElementById("fo-apercu"), r = bx && bx.getBoundingClientRect();
      if (f) f.__v66 = "lecteur";
      return { hash: location.hash, src: f ? f.getAttribute("src") : null, vignette: !!(bx && bx.querySelector(".video-vignette")), entiere: !!r && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight, y: Math.round(scrollY),
        nouvelleCarte: !!d && d.__v66 !== "avant", memeParcours: !!s && s.__v66 === "parcours", memeApercu: !!a && a.__v66 === "apercu", lecteurDansParcours: !!f && f.isConnected && s.contains(f) }; });
    /* relecture : la vidéo n'est pas à l'écran avant le clic (sinon le défilement ne serait pas vérifié) ; après, la page est
       descendue et la vidéo est ENTIÈREMENT à l'écran */
    ok("clic « Regarde la vidéo de bienvenue » : même adresse (#/formation), la page descend jusqu'à la vidéo (hors de l'écran avant, entièrement à l'écran après), le lecteur youtube-nocookie (lecture automatique) remplace la vignette",
      ap.hash === "#/formation" && /^https:\/\/www\.youtube-nocookie\.com\/embed\/[A-Za-z0-9_-]{11}\?/.test(ap.src || "") && ap.src.includes("/embed/" + av.attendu + "?") && /autoplay=1/.test(ap.src) && !ap.vignette
      && !av.vu && ap.y > av.y && ap.entiere, JSON.stringify([av.vu, av.y, ap]));
    const e1 = ecr(db, "formation", ID), Fo = (e1[0] || {}).contenu || {};
    ok("formation.depart.video écrit UNE fois (un instant ISO, celui du clic), le reste de sa clé intact (étape p1a, défi d6, challenge c3), rien d'autre d'écrit",
      e1.length === 1 && saisies(db).length === 1 && ISO.test((Fo.depart || {}).video || "") && Date.parse(Fo.depart.video) >= t0 - 2000 && Date.parse(Fo.depart.video) <= Date.now() + 2000
      && egal(Fo.coches, { p1a: true }) && egal(Fo.defis, { d6: true }) && Fo.challenge === "c3", resume(db) + " " + JSON.stringify(Fo).slice(0, 200));
    const d1 = await carteDepart(page);
    /* relecture (v62) : 1 action sur 3 après le clic : aucune invitation */
    ok("seule la carte « Commence ici » est redessinée : l'action vidéo cochée (coche, « (fait) »), les 2 autres non ; « Ce qui t'attend », « Ton parcours » et le lecteur restent à l'écran (mêmes éléments) ; compteur inchangé ; aucune invitation (une seule action faite)",
      ap.nouvelleCarte && ap.memeApercu && ap.memeParcours && ap.lecteurDansParcours && !!d1 && egal(d1.actions.map(a => [a.fait, a.c, a.sr]), [[true, "✓", I_FR.fait], [false, "", null], [false, "", null]]) && (await compteur(page)) === c0
        && (await page.$$eval("section.invitation", l => l.length).catch(() => -1)) === 0,
      JSON.stringify([ap.nouvelleCarte, ap.memeApercu, ap.memeParcours, ap.lecteurDansParcours, d1 && d1.actions.map(a => a.fait), c0, await compteur(page)]));
    await page.click('[data-depart="video"]'); await attendre(page, 1500);
    const deux = await page.evaluate(() => { const f = document.querySelector("#fo-presentation iframe"); return { meme: !!f && f.__v66 === "lecteur", n: document.querySelectorAll("#fo-presentation iframe").length }; });
    ok("2e clic sur l'action : aucune nouvelle écriture, le même lecteur (pas relancé)", ecr(db, "formation", ID).length === 1 && deux.meme && deux.n === 1, resume(db) + " " + JSON.stringify(deux));
    await page.reload(); await pret(page, "#fo-depart"); await attendre(page, 600);
    const d2 = await carteDepart(page);
    await page.click('[data-depart="video"]'); await attendre(page, 1500);
    const src2 = await page.$eval("#fo-presentation iframe", x => x.getAttribute("src")).catch(() => "");
    ok("rechargée : l'action vidéo reste cochée (lue en base), un nouveau clic relance la vidéo sans rien réécrire (toujours une seule écriture)",
      !!d2 && d2.actions[0].fait && !d2.actions[1].fait && src2.includes("youtube-nocookie.com/embed/" + av.attendu) && ecr(db, "formation", ID).length === 1 && saisies(db).length === 1, resume(db) + " " + JSON.stringify(d2 && d2.actions.map(a => a.fait)));
    await c.close();
    ({ c, page } = await contexte(b, quiP(22), db, { viewport: MOBILE }));
    await ouvrirFormation(page);
    await page.click("#fo-presentation .video-vignette"); await attendre(page, 1600);
    const e2 = ecr(db, "formation", ID2), d3 = await carteDepart(page);
    ok("autre prospect, clic sur la vignette elle-même : le lecteur démarre, formation.depart.video écrit une fois, l'action vidéo cochée",
      !!(await page.$("#fo-presentation iframe")) && e2.length === 1 && ISO.test(((e2[0].contenu || {}).depart || {}).video || "") && !!d3 && egal(d3.actions.map(a => a.fait), [true, false, false]), resume(db));
    await c.close();
    /* relecture (contrat H4) : « juste après le lancement de la vidéo qui complète les 3 » — calcul et pesée déjà faits :
       à l'ouverture, 2 actions sur 3, aucune invitation et aucune lecture d'intake et challenge ; clic sur la vidéo : UNE
       écriture (formation), la carte se replie et l'invitation se pose juste après #fo-depart (conforme), avec au plus UNE
       lecture groupée d'intake et challenge */
    const ID3 = PID(23), db3 = base({ comptes: [PROSPECT(23, "Lina", [["calc_perso", CP], ["mens", MENS_DEPART]])] });
    ({ c, page } = await contexte(b, quiP(23), db3, { viewport: MOBILE }));
    await ouvrirFormation(page); await attendre(page, 1000);
    const a3 = { d: await carteDepart(page), nb: await page.$$eval("section.invitation", l => l.length).catch(() => -1), lInv: lecturesInvitation(db3, ID3).map(x => x.outil) };
    const L3 = db3.lectures.length;
    await page.click('[data-depart="video"]');
    await page.waitForSelector(INV_SEL, { timeout: 5000 }).catch(() => {}); await attendre(page, 1600);   // l'écriture part après ses 700 ms
    const p3 = { d: await carteDepart(page), ordre: await ordre(page, 3), inv: await carteInvitation(page, INV_DEPART.code), lInv: lecturesInvitation(db3, ID3, L3).map(x => x.outil), e: ecr(db3, "formation", ID3) };
    const ko3 = invitationKo(p3.inv, INV_DEPART, "fo-depart", quiLien(23, "Lina"));
    ok("calcul et pesée déjà faits : à l'ouverture, 2 actions sur 3, aucune invitation ni lecture d'intake et challenge ; clic sur la vidéo de bienvenue (la 3e) : UNE écriture (formation.depart.video), la carte se replie en « Départ lancé ✓ », l'invitation « Bien joué, ton départ est lancé. » (conforme) juste après #fo-depart, puis « Ce qui t'attend » ; au plus une lecture groupée d'intake et challenge",
      !!a3.d && egal(a3.d.actions.map(x => x.fait), [false, true, true]) && a3.nb === 0 && a3.lInv.length === 0
        && p3.e.length === 1 && saisies(db3).length === 1 && ISO.test(((p3.e[0].contenu || {}).depart || {}).video || "")
        && !!p3.d && /\bfo-depart-fini\b/.test(p3.d.classes) && p3.d.ligne === I_FR.fini && egal(p3.ordre, ["fo-depart", "invitation-" + INV_DEPART.code, "fo-apercu"]) && ko3.length === 0 && p3.lInv.length <= 1,
      JSON.stringify([a3.d && a3.d.actions.map(x => x.fait), a3.nb, a3.lInv, ko3, p3.d && [p3.d.classes, p3.d.ligne], p3.ordre, p3.lInv]) + " " + resume(db3));
    await c.close();
    /* relecture (contrat H, corrections) : l'écriture de formation refusée (sa lecture a échoué : rien ne doit l'écraser) —
       calcul et pesée faits, clic sur la vidéo : rien d'écrit, l'action vidéo reste non cochée (carte non repliée), et rien
       n'est déclenché : aucune invitation, aucune lecture d'intake et challenge, rien noté sur l'appareil
       (mhx_invitations|<id>) */
    const ID4 = PID(24), db4 = base({ comptes: [PROSPECT(24, "Léna", [["calc_perso", CP], ["mens", MENS_DEPART]])], lectureKo: ["formation"] });
    ({ c, page } = await contexte(b, quiP(24), db4, { viewport: MOBILE }));
    await ouvrirFormation(page);
    const L4 = db4.lectures.length, r4 = lu(db4, "formation");
    await page.click('[data-depart="video"]'); await attendre(page, 2500);
    const p4 = { d: await carteDepart(page), nb: await page.$$eval("section.invitation", l => l.length).catch(() => -1), lInv: lecturesInvitation(db4, ID4, L4).map(x => x.outil),
      lecteur: !!(await page.$("#fo-presentation iframe")), memo: await page.evaluate(id => localStorage.getItem("mhx_invitations|" + id), ID4) };
    ok("écriture de formation refusée (sa lecture a échoué) : clic sur la vidéo de bienvenue — rien d'écrit, l'action vidéo reste non cochée (2 sur 3, carte non repliée), aucune invitation, aucune lecture d'intake et challenge, rien noté sur l'appareil",
      r4 >= 1 && saisies(db4).length === 0 && ecr(db4, "formation").length === 0 && !!p4.d && egal(p4.d.actions.map(x => x.fait), [false, true, true]) && !/\bfo-depart-fini\b/.test(p4.d.classes)
        && p4.nb === 0 && p4.lInv.length === 0 && p4.memo === null,
      JSON.stringify([r4, p4.d && p4.d.actions.map(x => x.fait), p4.d && p4.d.classes, p4.nb, p4.lInv, p4.lecteur, p4.memo]) + " " + resume(db4));
    await c.close();
  });

  /* =================== I4. client et coach : aucune des deux cartes =================== */
  await bloc("I4. client Thomas et coach : aucune des deux cartes", async () => {
    const IDP = PID(31);
    const db = base({ comptes: [PROSPECT(31, "Jade", [["calc_perso", CP]])] });
    let { c, page } = await contexte(b, THOMAS, db, { viewport: MOBILE });
    const L0t = db.lectures.length;   // relecture : tout ce qui est lu depuis l'ouverture de l'app sur #/formation
    await ouvrirFormation(page);
    const t = await page.evaluate(() => ({ depart: !!document.getElementById("fo-depart"), apercu: !!document.getElementById("fo-apercu"), presentation: !!document.getElementById("fo-presentation"), actions: document.querySelectorAll("[data-depart]").length }));
    const lt = lecturesCalcMens(db, L0t);
    ok("client Thomas : ni « Commence ici », ni « Ce qui t'attend », ni ancre de la vidéo ; « Ton parcours » en premier ; aucune lecture de calc_perso ni de mens (groupée dans un sens ou dans l'autre, ou séparée)",
      !t.depart && !t.apercu && !t.presentation && t.actions === 0 && (await ordre(page))[0] === "Ton parcours" && db.lectures.length > L0t && lt.length === 0, JSON.stringify(t) + " " + JSON.stringify(await ordre(page)) + " " + JSON.stringify(lt));
    await page.click("#fo-vue > section.panel:first-child .video-vignette"); await attendre(page, 1500);
    ok("… sa vidéo de présentation se lance (lecteur) sans rien écrire", !!(await page.$("#fo-vue > section.panel:first-child iframe")) && saisies(db).length === 0, resume(db));
    await c.close();
    ({ c, page } = await contexte(b, COACH, db));
    await page.goto(URL0 + "#/tableau"); await pret(page); await attendre(page, 600);
    await aller(page, "#/clients", 2000); await page.waitForSelector(`[data-ouvrir="${IDP}"]`, { timeout: 8000 });
    await page.click(`[data-ouvrir="${IDP}"]`); await page.waitForSelector("#vue .bandeau", { timeout: 8000 }); await attendre(page, 800);
    const L0 = db.lectures.length;
    await aller(page, "#/formation", 2000); await page.waitForSelector("#fo-vue .prog-compteur", { timeout: 8000 });
    const k = await page.evaluate(() => ({ consulte: Store.idConsulte, depart: !!document.getElementById("fo-depart"), apercu: !!document.getElementById("fo-apercu"), presentation: !!document.getElementById("fo-presentation") }));
    const lk = lecturesCalcMens(db, L0);
    ok("coach dans la fiche d'un prospect, #/formation : ni l'une ni l'autre carte, « Ton parcours » en premier, aucune lecture de calc_perso ni de mens (quel que soit l'ordre ou le découpage), rien d'écrit",
      k.consulte === IDP && !k.depart && !k.apercu && !k.presentation && (await ordre(page))[0] === "Ton parcours" && db.lectures.length > L0 && lk.length === 0 && saisies(db).length === 0,
      JSON.stringify(k) + " " + resume(db) + " " + JSON.stringify(lk));
    await c.close();
  });

  /* =================== I5. page servie retouchée =================== */
  const RES = '{t:"Guide circuit abdos", u:"';
  await bloc("I5. page servie retouchée : durée de la vidéo, une ressource de plus", async () => {
    await avec([["video_minutes: 0,", "video_minutes: 4,"], [RES, '{t:"Guide du banc (verif66)", u:"https://drive.google.com/file/d/verif66-banc/view"},\n        ' + RES]], async () => {
      const db = base({ comptes: [PROSPECT(41, "Zoé"), PROSPECT(42, "Amy")] }); avecEn(db, PID(42));
      let { c, page } = await contexte(b, quiP(41), db, { viewport: MOBILE });
      await ouvrirFormation(page);
      const d = await carteDepart(page), a = await carteApercu(page);
      const srv = await page.evaluate(() => ({ min: FORMATION.video_minutes, res: FORMATION.modules[6].ressources.length, ch: outilFormation.chiffres() }));
      ok("FORMATION.video_minutes à 4 (servi) : « Commence ici · 7 min » (3 + 4), affiché « COMMENCE ICI · 7 MIN »", srv.min === 4 && !!d && d.eyebrow === "Commence ici · 7 min" && d.capitales === "COMMENCE ICI · 7 MIN", JSON.stringify([srv.min, d && d.eyebrow, d && d.capitales]));
      ok("une ressource de plus dans le module 6 : la tuile passe à 16 guides et documents (comptés, rien d'écrit en dur), les autres 7 / 7 / 25, compteur « 0 / 49 étapes »",
        srv.res === 5 && srv.ch.documents === 16 && !!a && egal(a.tuiles.map(x => x[0]), ["7", "7", "16", "25"]) && (await compteur(page)) === I_FR.compteur, JSON.stringify([srv, a && a.tuiles]));
      await c.close();
      ({ c, page } = await contexte(b, quiP(42), db, { viewport: MOBILE, langue: "en" }));
      await ouvrirFormation(page); await attendre(page, 300);
      const de = await carteDepart(page);
      ok("anglais : « Start here · 7 min »", !!de && de.eyebrow === "Start here · 7 min" && de.capitales === "START HERE · 7 MIN", JSON.stringify(de && [de.eyebrow, de.capitales]));
      await c.close();
    });
  });

  /* =================== I6. prospect, anglais =================== */
  await bloc("I6. prospect, anglais (390 px, clair) : les deux cartes", async () => {
    const vid = { depart: { video: avant(H) } };
    const db = base({ comptes: [PROSPECT(51, "Mia"), PROSPECT(52, "Lily", [["calc_perso", CP]]), PROSPECT(53, "Ava", [["formation", vid], ["calc_perso", CP], ["mens", MENS_DEPART]])] });
    [51, 52, 53].forEach(k => avecEn(db, PID(k)));
    const opts = { viewport: MOBILE, langue: "en", stockage: { mhx_theme: "light" } };
    let { c, page } = await contexte(b, quiP(51), db, opts);
    await ouvrirFormation(page); await attendre(page, 300);
    const d = await carteDepart(page), a = await carteApercu(page);
    ok("anglais : « Start here » (« START HERE »), « 3 actions to get started today », « Watch the welcome video », « Calculate your calories (2 min) », « Log your starting weight (1 min) », mêmes liens",
      !!d && d.eyebrow === I_EN.etiquette && d.capitales === "START HERE" && d.h2 === I_EN.titre && egal(d.actions.map(x => [x.k, x.href, x.t]), I_EN.actions), JSON.stringify(d));
    ok("anglais : « What's inside your course », 7 modules, 7 videos with Lucas, 15 guides and documents, 25 challenges, ses 2 lignes, « 0 / 49 steps » ; plus aucun « downloads » (ni « à télécharger ») dans la carte",
      !!a && a.h2 === I_EN.apercu && egal(a.tuiles, [["7", I_EN.tuiles[0]], ["7", I_EN.tuiles[1]], ["15", I_EN.tuiles[2]], ["25", I_EN.tuiles[3]]]) && egal(a.lignes, I_EN.lignes) && (await compteur(page)) === I_EN.compteur && !TELECHARGER.test(a.brut),
      JSON.stringify(a && [a.h2, a.tuiles, a.lignes]) + " " + await compteur(page) + " · " + JSON.stringify(a && (a.brut.match(TELECHARGER) || [""])[0]));
    const h = await horsEcran(page), th = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    ok("anglais, thème clair, 390 px : aucun débordement", th === "light" && h.bon, th + " " + JSON.stringify(h));
    await c.close();
    ({ c, page } = await contexte(b, quiP(52), db, opts));
    await ouvrirFormation(page); await attendre(page, 300);
    const d2 = await carteDepart(page);
    ok("anglais, calcul fait : la coche et « (done) » (lecteurs d'écran) sur l'action des calories seulement", !!d2 && egal(d2.actions.map(x => [x.fait, x.c, x.sr]), [[false, "", null], [true, "✓", I_EN.fait], [false, "", null]]), JSON.stringify(d2 && d2.actions));
    await c.close();
    ({ c, page } = await contexte(b, quiP(53), db, opts));
    await ouvrirFormation(page); await attendre(page, 300);
    await page.waitForSelector(INV_SEL, { timeout: 5000 }).catch(() => {});
    const d3 = await carteDepart(page), iv3 = await carteInvitation(page, INV_DEPART_EN.code), ko3 = invitationKo(iv3, INV_DEPART_EN, "fo-depart", quiLien(53, "Ava"));
    /* relecture (v62, brief H) : l'invitation anglaise, vérifiée comme la française (textes EN du brief H mot pour mot :
       « Nice work, you're off to a start. », « Your goal: “…” », « Next step: … », « Get my action plan », « 15 min with
       Lucas · free », « Later ») */
    ok("anglais, les 3 faites : une seule ligne « You're off » avec sa coche, suivie de l'invitation anglaise (« Nice work, you're off to a start. », « Your goal: “…” », « Next step: your personalized action plan, free, in 15 min with Lucas. », « Get my action plan », « 15 min with Lucas · free », « Later » ; même structure, rien d'autre, même lien Calendly) ; rien d'écrit par ces 3 visites",
      !!d3 && /\bfo-depart-fini\b/.test(d3.classes) && d3.ligne === I_EN.fini && d3.ol === 0 && ko3.length === 0 && saisies(db).length === 0, JSON.stringify([ko3, d3, iv3 && iv3.textes]) + " " + resume(db));
    await c.close();
  });

  /* =================== T. thèmes sombre et clair =================== */
  let fondSombre = null;
  for (const theme of ["sombre", "clair"]) await bloc("T. thème " + theme + " (390 px) : les deux cartes", async () => {
    const db = base({ comptes: [PROSPECT(61, "Rose", [["calc_perso", CP]])] });
    const { page } = await contexte(b, quiP(61), db, Object.assign({ viewport: MOBILE }, theme === "clair" ? { stockage: { mhx_theme: "light" } } : {}));
    await ouvrirFormation(page);
    const k = await contrastes(page);
    if (theme === "sombre") fondSombre = k.fond;
    /* relecture : l'état replié « Départ lancé ✓ » (les 3 actions faites) mesuré aussi, dans le même thème */
    const db2 = base({ comptes: [PROSPECT(62, "Iris", [["formation", { depart: { video: avant(H) } }], ["calc_perso", CP], ["mens", MENS_DEPART]])] });
    const x2 = await contexte(b, quiP(62), db2, Object.assign({ viewport: MOBILE }, theme === "clair" ? { stockage: { mhx_theme: "light" } } : {}));
    await ouvrirFormation(x2.page);
    /* relecture (v62) : les 3 faites → l'invitation « Bien joué, ton départ est lancé. » est là : mesurée aussi (contraste,
       rien hors de l'écran, zones de tap du bouton et de « Plus tard ») */
    await x2.page.waitForSelector(INV_SEL, { timeout: 5000 }).catch(() => {});
    const k2 = await contrastes(x2.page, INV_SEL), replie = k2.out.filter(x => /\bfo-depart-ligne\b/.test(x.cls || "")), dansInv = k2.out.filter(x => x.inv);
    const h2 = await horsEcran(x2.page, INV_SEL), tapInv = await x2.page.evaluate(s => Array.from(document.querySelectorAll(s + " > .dc-cta > a.btn, " + s + " > .dc-cta > button.lien-discret")).map(e => Math.round(e.getBoundingClientRect().height)), INV_SEL).catch(() => []);
    await x2.c.close();
    const tous = k.out.concat(k2.out), faibles = tropFaibles(k).concat(tropFaibles(k2)), exc = tous.filter(x => x.exc);
    ok("thème " + theme + " : appliqué ; chaque texte des deux cartes (et « Départ lancé ✓ », l'état replié, suivi de son invitation « Bien joué… » : ses 6 textes) se détache de son fond : au moins 4,5:1, 3:1 pour les seules exceptions nommées (" + EXCEPTIONS_CONTRASTE.map(x => x[0] + (x[2] ? " en clair" : "")).join(", ") + ") ; " + tous.length + " textes, le plus faible " + Math.min(...tous.map(x => x.r)) + ":1" + (theme === "clair" ? " ; fond des cartes différent du thème sombre" : ""),
      (theme === "clair" ? k.theme === "light" && k2.theme === "light" && !!fondSombre && k.fond !== fondSombre : k.theme === null && k2.theme === null) && k.out.length >= 12 && replie.length === 1 && dansInv.length === 6 && faibles.length === 0,
      JSON.stringify([k.theme, k.fond, fondSombre, replie, dansInv.map(x => [x.t, x.cls, x.r, x.exc]), faibles, exc.map(x => [x.t, x.exc, x.r])]));
    const h = await horsEcran(page), d = await carteDepart(page);
    ok("thème " + theme + ", 390 px : rien ne sort de l'écran (page, cartes, tuiles ; et, les 3 faites, « Départ lancé ✓ » et son invitation), les 3 actions d'au moins 44 px de haut, le bouton et « Plus tard » de l'invitation aussi",
      h.bon && !!d && d.actions.length === 3 && d.actions.every(a => a.h >= 44) && h2.bon && tapInv.length === 2 && tapInv.every(x => x >= 44),
      JSON.stringify(h) + " " + JSON.stringify(d && d.actions.map(a => a.h)) + " " + JSON.stringify(h2) + " " + JSON.stringify(tapInv));
  });

  /* =================== Z. hôtes externes =================== */
  await bloc("Z. hôtes externes", async () => {
    const autres = Array.from(externes).filter(h => !/^(fonts\.(googleapis|gstatic)\.com|img\.youtube\.com)$/.test(h));
    ok("aucune requête vers un autre hôte que la page, le faux Supabase, les polices et les vignettes des vidéos (bloquées) ; le lecteur youtube-nocookie simulé", autres.length === 0, JSON.stringify(autres));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
