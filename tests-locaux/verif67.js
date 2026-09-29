/* verif67 — v61 (brief V2, lot 2 : sections D, E, F, G et décision 4) : le plan d'action offert de 15 min, vérifié de bout
   en bout dans un vrai navigateur, pour un prospect, en français et en anglais, sur téléphone (390 px), en thème sombre et
   en thème clair. Un faux Calendly (hôte calendly.com, comme verif40) sert une page blanche à l'onglet que le bouton ouvre
   et note l'adresse reçue : aucun appel ne part vers le vrai Calendly.
   A. page « Ton plan d'action » (juste après les 3 questions), français, 390 px, thème sombre : ordre exact (« Offert »,
      titre, projection, texte, « Ton plan est à toi… », petit texte gris, bouton, « 15 min · par téléphone · offert »,
      « Plus tard… »), textes EXACTS, typographie française (espaces insécables), « Offert » en capitales dorées, UN seul
      bouton doré (.btn) et « Plus tard » en lien gris souligné sans fond ni bordure (pas un .btn), zones de tap ≥ 44 px,
      lien Calendly exact (apres_questionnaire, pré-rempli), puis le clic : l'onglet ouvert reçoit ce lien, le clic est
      compté (challenge.cta.clics, source apres_questionnaire), intake.bilan_propose « reserver » écrit une fois, l'accueil ;
   B. la même page en anglais, 390 px, thème clair (textes exacts, aucun texte français, doré du thème clair) ; « Plus
      tard » (deux taps) : bilan_propose « plus_tard » écrit UNE fois, aucun clic compté, l'accueil en haut de page ; page
      rouverte par #/decouverte/bilan : rien de réécrit ;
   C. accueil du prospect, français, 390 px, thème sombre : son étape et la Speed Formation inchangées ; exactement 2 liens
      (accueil_haut en contour + « 15 min avec Lucas · offert », accueil_accompagnement), liens exacts ; carte « Ce que
      l'accompagnement ajoute » (4 lignes exactes), note 15 min, case « J'ai déjà choisi mon créneau » ; les 2 clics
      (onglet ouvert, clic compté) ; la case (challenge.reserve, pastille « Bilan réservé le … », clics gardés) ;
   D. accueil en anglais, 390 px, thème clair (4 descriptions anglaises comprises) ; « Edit my answers » (reponses_haut) ;
   E. « Modifier mes réponses » en français : bouton du haut reponses_haut et sa ligne, seul lien Calendly de la page ;
      clic (onglet ouvert, clic compté, rien d'autre d'écrit) ;
   F. les 4 pages verrouillées de la vitrine (programme, journal, nutrition, suivi), français, 390 px, thème sombre :
      l'exemple au-dessus inchangé (marqué « Exemple », son titre, aucun texte du lot 2 dedans), le titre, le texte propre
      à la page (typographie française), « Récupérer mon plan d'action » (lien verrou_<page>), « 15 min avec Lucas · offert »,
      la description sous la carte ; aucune clé « donnees » lue ; chaque clic : onglet ouvert, clic compté ;
   G. les pages verrouillées cachées (#/bilan, #/complements) : texte inchangé, même bouton et même ligne, verrou_bilan /
      verrou_complements, clics comptés ;
   H. les 4 pages verrouillées en anglais, 390 px, thème clair ; un clic compté (verrou_journal) ;
   I. F récapitulé : depuis CHAQUE écran (les 10 codes), l'onglet ouvert a reçu la nouvelle adresse, le pré-remplissage,
      utm_source=app, utm_medium=bouton, le bon utm_content ; aucun « 30min », « 30 minutes », « 30-minute » ni ancien
      libellé (« Réserver mon bilan », « Book my assessment »…) sur les écrans du prospect visités (A à H et Profil), en
      français et en anglais ; ni dans les fichiers servis (page, js/, css/). La Speed Formation n'est pas relevée : ses
      défis gardent leurs durées d'effort (« 30 minutes de marche rapide », brief F « Ne PAS toucher aux autres durées ») ;
      le bloc I, lancé après J, relit ce que les blocs A à H et J ont ouvert et affiché : il se lance avec eux ;
   J. décision 4 : version 2026-09-30 (= accords.conditions), volet « Conditions d'utilisation et confidentialité » du
      Profil : 12 paragraphes, le 2e EXACT (français, anglais), les 11 autres identiques à la v60 (empreinte) ; inscription :
      conditions_version 2026-09-30 envoyée ;
   K. coach : fiche d'un prospect — anciens clics (decouverte, decouverte-accompagnement, bilan-propose, verrou-programme)
      avec leurs anciens libellés, nouveaux codes avec leur nom d'écran, codes illisibles sans libellé (texte brut) ; autres
      libellés du coach inchangés ; lien fiche_coach exact ; message « bilan de 15 minutes » ; le coach reçoit le lien sans
      paramètres (sa page et la fiche) ; aucune écriture ;
   L. client Thomas : accueil et pages (programme, journal, nutrition, suivi), en français et en anglais : aucun des
      nouveaux textes, aucun verrou, aucun lien Calendly ; son lien Calendly sans paramètres ;
   Z. aucun appel vers l'extérieur (hors polices, bloquées, et le faux Calendly).
   Supabase simulé (gabarit de verif65 / verif56) : rien ne part vers la vraie base (routage par NOM D'HÔTE, jamais par
   sous-chaîne) ; règles de la base reproduites (HANDOFF §2.3, v49) ; appelant reconnu à son jeton ; chaque écriture est
   appliquée en mémoire et notée. Données fictives, dates relatives au lancement. Chaque bloc tourne à part (« ✗ BLOC
   INTERROMPU ») ; code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif67.js ../index.html
           VERIF67_PORT=9831 node verif67.js ../index.html     (autre port, si 9830 est pris)
           VERIF67_BLOCS="A.,C." node verif67.js …              (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path"); const crypto = require("crypto");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF67_PORT || 9830;
const BLOCS = (process.env.VERIF67_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const MOBILE = { width: 390, height: 844 }, ORDI = { width: 1280, height: 900 };

/* ---------- la page servie : le fichier testé (page, css/ et js/) ; inscription ouverte le temps du bloc J ---------- */
const { servirFichier, source, forcerInscription } = require("./fichiers");
let inscriptionLibre = null;
const retouche = h => inscriptionLibre === null ? h : forcerInscription(h, inscriptionLibre);
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML, retouche)) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(retouche(fs.readFileSync(HTML, "utf8")));
});

/* ---------- résultats ---------- */
const res = [];
const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + String(d || "").replace(/\s+/g, " ").trim().slice(0, 700)));
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
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); }
}

/* ---------- dates : toujours relatives au lancement ---------- */
const T0 = Date.now(), MIN = 60000, H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
/* texte comparé : espaces (insécables comprises) resserrées, apostrophes courbes ou droites */
const norm = t => String(t == null ? "" : t).replace(/[  ]/g, " ").replace(/\s+/g, " ").replace(/’/g, "'").trim();
/* la typographie française attendue (js/boite-a-outils.js, typoFr) : insécable avant « : ; ? ! » et « », après « « » */
const typo = s => s.replace(/ ([:;?!»])/g, " $1").replace(/« /g, "« ");

/* ---------- les personnes ---------- */
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: meta } : {}) });
const qui = (id, email, meta) => ({ id, email, session: session(id, email, meta) });
const COACH = qui(F.IDS.coach, "coach@exemple.fr"), THOMAS = qui(F.IDS.c1, "thomas@exemple.fr");
const PID = k => "00000000-0000-4000-8000-0000000067" + String(k).padStart(2, "0");   // verif67 : …67kk (une plage par suite)

/* ---------- le décor : fixtures.js (coach, clients) + les prospects du bloc ----------
   comptes : [{ id, prenom, nom, statut ("prospect" par défaut), cree (instant ISO), email, donnees: [[outil, contenu, maj_le]] }] */
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  const donnees = clone(F.donnees);
  const db = { profils, donnees, ecritures: [], refus: [], lectures: [], chemins: [], fonctions: [], emails: {}, lectureKo: [], calendly: [], inscriptions: [] };
  for (const x of opts.comptes || []) {
    profils.push({ id: x.id, prenom: x.prenom, nom: x.nom || "", role: "client", statut: x.statut || "prospect", cree_le: x.cree || avant(J) });
    if (x.email) db.emails[x.id] = x.email;
    for (const [outil, contenu, maj] of x.donnees || []) donnees.push({ user_id: x.id, outil, contenu: clone(contenu), maj_le: maj || avant(H) });
  }
  return db;
}

/* ---------- le faux Supabase (gabarit de verif65 / verif56) et le faux Calendly ---------- */
const MAX_LIGNES = 1000;
/* règles de la base (HANDOFF §2.3, policies v49). Une migration qui change une règle change ces listes dans le même chantier. */
const ILLISIBLES_PROPRIO = ["notes_coach", "suivi_prospect"];                 // SELECT : le propriétaire ne les lit pas
const INTERDITES_PROPRIO = ["feedbacks", "notes_coach", "suivi_prospect"];     // INSERT / UPDATE / DELETE du propriétaire
const ECRITES_PAR_COACH = ["programme", "repas", "calc", "complements", "hist_programme", "hist_repas", "feedbacks", "notes_coach", "suivi_prospect"];
const permis = (moi, coach, row) => !!moi && (row.user_id === moi ? (coach || !INTERDITES_PROPRIO.includes(row.outil)) : (coach && ECRITES_PAR_COACH.includes(row.outil)));
const externes = new Set();
/* toutes les adresses reçues par le faux Calendly, dans l'ordre (bloc I) */
const CAL_RECUS = [];
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
/* le catalogue complet (la journée type de #/nutrition lit ses recettes et ses aliments) */
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "donnees", f), "utf8"));
const CATALOGUE = Object.assign({}, F.catalogue, { aliments: lireDonnees("aliments.json"), recettes: lireDonnees("recettes.json") });
async function repondre(r, who, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue();
  if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" });
  /* le faux Calendly : une page blanche pour l'onglet ouvert par le bouton, l'adresse reçue est notée */
  if (host === "calendly.com") { CAL_RECUS.push(u); db.calendly.push(u); return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body>Calendly (faux)</body></html>" }).catch(() => {}); }
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort(); }   // polices, Instagram… : rien ne sort
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});   // page fermée entre-temps
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req) || (who && who.id) || null;
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  db.chemins.push(m + " " + p);
  /* --- comptes --- */
  if (p.startsWith("/auth/v1/signup")) {   // inscription (bloc J) : le déclencheur creer_profil crée le profil prospect
    const c = corps() || {}, data = c.data || {}; db.inscriptions.push(clone(c));
    const id = db.nouvelId || PID(99); db.emails[id] = c.email;
    db.profils.push({ id, prenom: data.prenom || "", nom: data.nom || "", role: "client", statut: "prospect", cree_le: new Date().toISOString() });
    return json(session(id, c.email, data));
  }
  if (p.startsWith("/auth/v1/token")) {   // renouvellement : jamais compté comme écriture
    const c = corps() || {}, r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || ""));
    const id = (r1 && r1[1]) || (who && who.id);
    if (!id) return json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
    return json(who && id === who.id ? who.session : session(id, db.emails[id] || ""));
  }
  /* la connexion notée par la base (noter_connexion) n'est pas une écriture de l'app dans les données (testée dans verif61) */
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  if (!["GET", "HEAD"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m, corps: corps() });
  if (p.startsWith("/auth/v1/user")) return moi ? json({ id: moi, email: db.emails[moi] || (who && who.id === moi ? who.email : ""), role: "authenticated" }) : json({ msg: "invalid JWT" }, 401);
  if (p.startsWith("/auth/v1/")) return json({});
  /* --- fonctions serveur et Storage : jamais appelés pour de vrai --- */
  if (p.startsWith("/functions/v1/")) { db.fonctions.push({ nom: p.slice(14), m }); return json({ ok: true }); }
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/emails_prospects") return json([]);
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
      db.lectures.push({ par: moi, uid, outil: o, select: q.get("select") || "*" });
      if (cleEq && db.lectureKo.includes(cleEq)) return json({ message: "panne simulée" }, 500);
      let l = db.donnees.filter(x => coach || (x.user_id === moi && !ILLISIBLES_PROPRIO.includes(x.outil)));
      if (uid) l = l.filter(x => x.user_id === uid);
      return json(colonnes(plage(parOutil(l, o)), q));
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
        db.ecritures.push(Object.assign({ table: "donnees", m }, clone(ligne)));
        out.push(ligne);
      }
      return (req.headers()["prefer"] || "").includes("return=representation") ? json(out, 201) : json(null, 201);
    }
    if (m === "PATCH") {   // écriture conditionnelle (CleCoach) : maj_le=eq.<valeur lue> ou is.null
      const c = corps() || {};
      const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj == null || (mj === "is.null" ? !x.maj_le : (mj.startsWith("eq.") && x.maj_le === mj.slice(3)))));
      if (!row) return json([]);   // la ligne a bougé : 0 ligne (conflit)
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

/* ---------- un navigateur (contexte) pour une personne ----------
   opts : viewport (MOBILE par défaut : 390 px), langue ("en"), theme ("light" : thème clair, rangé sur l'appareil comme le
   fait le bouton de thème ; sombre par défaut) */
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || MOBILE });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, who, db));
  await c.addInitScript(({ s, langue, theme }) => {
    if (!/^https?:$/.test(location.protocol) || location.hostname !== "localhost") return;   // l'onglet du faux Calendly : rien
    if (!localStorage.getItem("__init")) {
      localStorage.setItem("__init", "1");
      if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
      localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
      if (langue) localStorage.setItem("mhx_langue", langue);
      if (theme) localStorage.setItem("mhx_theme", theme);
    }
  }, { s: who ? who.session : null, langue: opts.langue || "", theme: opts.theme || "" });
  const page = surveiller(await c.newPage());
  return { c, page };
}
function surveiller(page){
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return page;
}

/* ---------- aides ---------- */
const attendre = (page, ms) => page.waitForTimeout(ms);
async function pret(page, sel){
  await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 });
  if (sel) await page.waitForSelector(sel, { timeout: 10000 });
  await attendre(page, 400);
}
const URL0 = `http://localhost:${PORT}/`;
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1500); };
const texte = async (page, sel) => norm(await page.textContent(sel || "#vue").catch(() => ""));
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.table === "donnees" && e.outil === outil && (!uid || e.user_id === uid));
/* les écritures de données, hors compteur de visites du prospect (clé activite) */
const saisies = db => db.ecritures.filter(e => (e.table === "donnees" || e.table === "profils") && e.outil !== "activite");
const resume = db => JSON.stringify(db.ecritures.map(e => (e.table === "donnees" ? e.outil : e.table) + ":" + e.m));
const deborde = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
const intakeDe = (db, uid) => (db.donnees.find(d => d.user_id === uid && d.outil === "intake") || {}).contenu;
const challengeDe = (db, uid) => (db.donnees.find(d => d.user_id === uid && d.outil === "challenge") || {}).contenu || {};
const clicsDe = (db, uid) => ((challengeDe(db, uid).cta || {}).clics || []);
/* les lectures de « donnees » depuis n0, hors compteur de visites (clé activite) */
const luHors = (db, n0) => db.lectures.slice(n0).filter(l => l.outil !== "eq.activite");
const lignes = (page, sel) => page.$$eval(sel + " li", l => l.map(li => [li.querySelector("span") ? li.querySelector("span").textContent : "", li.querySelector("b") ? li.querySelector("b").textContent : ""])).then(l => l.map(x => x.map(norm))).catch(() => []);
const compte = (k, donnees, extra) => Object.assign({ id: PID(k), prenom: "Léa", nom: "Martin", cree: avant(2 * J), email: "p" + k + "@exemple.fr", donnees: donnees || [] }, extra || {});
async function ouvrir(b, db, k, h, sel, opts){
  const { c, page } = await contexte(b, qui(PID(k), db.emails[PID(k)] || ("p" + k + "@exemple.fr")), db, opts);
  await page.goto(URL0 + (h || "")); await pret(page, sel || "#vue .masthead");
  return { c, page };
}
/* un clic (vrai) sur un bouton qui ouvre Calendly dans un nouvel onglet : l'adresse de l'onglet ouvert et ce que le faux
   Calendly a reçu ; puis le temps que le clic soit noté (Decouverte.clic : relecture, écriture après 700 ms) */
async function ouvrirCalendly(c, page, sel){
  const n0 = CAL_RECUS.length;
  if (!(await page.$(sel))) return { url: "", recus: [], absent: sel };   // bouton absent : la vérification échoue (sans interrompre le bloc)
  const [pop] = await Promise.all([c.waitForEvent("page", { timeout: 6000 }).catch(() => null), page.click(sel)]);
  let url = "";
  if (pop) { await pop.waitForLoadState("domcontentloaded", { timeout: 6000 }).catch(() => {}); url = pop.url(); await pop.close().catch(() => {}); }
  await attendre(page, 2300);
  return { url, recus: CAL_RECUS.slice(n0) };
}
/* la couleur calculée d'une variable du thème (--accent, --ink-3) */
const couleur = (page, v) => page.evaluate(v => { const s = document.createElement("span"); s.style.color = "var(" + v + ")"; document.body.appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c; }, v);
const OR_SOMBRE = "rgb(212, 168, 68)", OR_CLAIR = "rgb(154, 116, 32)";   // --accent des deux thèmes (css/jetons.css)
const TRANSPARENT = "rgba(0, 0, 0, 0)";
/* ce qui ne doit jamais s'afficher : un prix, un « undefined » */
const PRIX = /€|\$ ?\d|\d ?\$|\bprix\b|\bprice\b|\btarifs?\b|\beuros?\b|\bEUR\b/i, BRUT = /undefined|\[object|\bNaN\b|\bnull\b/;
const propre = t => !PRIX.test(t) && !BRUT.test(t);
/* une durée de bilan à 30 min (brief F : « 30 minutes », « 30 min », « 30-minute » ; l'ancien lien …/30min) et les anciens
   libellés du bilan (sensibles à la casse : « disponible avec l'accompagnement MHX » reste le texte des pages cachées) */
const TRENTE = /30min|30 minutes|30-minute/i;
const ANCIENS_TXT = /Réserver mon bilan|Réserve ton bilan|J'ai réservé mon bilan|Avec l'accompagnement MHX|Pas maintenant, découvrir|Book my assessment|Book your assessment|I booked my assessment|With MHX coaching|Not now, explore|Tu veux un programme construit|Want a program built/;
/* ce que le prospect a vu (texte et adresses des liens de #vue, volet ouvert compris), par langue : relu par le bloc I */
const VUS = { fr: [], en: [] };
async function relever(page, en, ou){
  const x = await page.evaluate(() => {
    const v = document.querySelector("#vue"), vo = document.querySelector(".volet");
    return (v ? v.innerText : "") + "\n" + (vo ? vo.innerText : "") + "\n" + (v ? [...v.querySelectorAll("a[href]")].map(a => a.getAttribute("href")).join("\n") : "");
  }).catch(() => "");
  VUS[en ? "en" : "fr"].push({ ou, t: norm(x) });
}

/* ---------- le lien Calendly attendu (brief F) ---------- */
const CAL = "https://calendly.com/mhx-coaching/ton-plan-d-action-offert-15-min-avec-lucas";
const enc = encodeURIComponent;
/* le lien d'un prospect Léa Martin (pk@exemple.fr) : utm_source=app, utm_medium=bouton, utm_content=<code>, puis le
   pré-remplissage (name, first_name, last_name, email), dans cet ordre, chaque valeur encodée */
const lienAtt = (code, k) => CAL + "?utm_source=app&utm_medium=bouton&utm_content=" + code + "&name=" + enc("Léa Martin") + "&first_name=" + enc("Léa") + "&last_name=" + enc("Martin") + "&email=" + enc("p" + k + "@exemple.fr");
const CODES = ["apres_questionnaire", "accueil_haut", "reponses_haut", "accueil_accompagnement", "verrou_programme", "verrou_journal", "verrou_nutrition", "verrou_suivi", "verrou_bilan", "verrou_complements"];

/* ---------- les textes attendus (brief V2, D, E, G et décision 4, mot pour mot) ---------- */
const D = {
  offert: "Offert", offert_en: "Free",
  titre: "Ton plan d'action personnalisé", titre_en: "Your personalized action plan",
  projection: p => "Ton objectif dans 3 mois : « " + p + " »", projection_en: p => "Your goal in 3 months: “" + p + "”",
  texte: "En 15 minutes au téléphone avec Lucas, on transforme cet objectif en plan concret : ce qui te freine vraiment, par quoi commencer, et les 3 actions à mettre en place en priorité.",
  texte_en: "In a 15-minute call with Lucas, we turn this goal into a concrete plan: what's really holding you back, where to start, and the 3 actions to put in place first.",
  garde: "Ton plan est à toi, quelle que soit la suite.", garde_en: "The plan is yours to keep, whatever you decide next.",
  libre: "Si l'accompagnement te correspond, Lucas te le présente à la fin, seulement si tu le veux. Tu es libre de dire non.",
  libre_en: "If coaching is a good fit, Lucas will tell you about it at the end, only if you want. You're free to say no.",
  bouton: "Récupérer mon plan d'action", bouton_en: "Get my action plan",
  sous: "15 min · par téléphone · offert", sous_en: "15 min · phone call · free",
  plus_tard: "Plus tard, je découvre mon espace", plus_tard_en: "Later, let me explore my space"
};
const E = {
  sous: "15 min avec Lucas · offert", sous_en: "15 min with Lucas · free",
  titre: "Ce que l'accompagnement ajoute", titre_en: "What coaching adds",
  lignes: [["Mon programme", "Tes séances construites pour toi et ajustées par ton coach selon tes progrès."], ["Nutrition", "Tes repas calculés pour ton objectif, avec ta liste de courses."],
    ["Mon journal", "Chaque séance notée, et la charge à viser la fois suivante."], ["Mon suivi", "Ta régularité, ta courbe et le retour de ton coach chaque semaine."]],
  lignes_en: [["My program", "Workouts built for you and adjusted by your coach as you progress."], ["Nutrition", "Meals calculated for your goal, with your shopping list."],
    ["My training log", "Every workout logged, with the weight to aim for next time."], ["My follow-up", "Your consistency, your progress curve and your coach's feedback every week."]],
  note: "15 min avec Lucas pour faire le point sur ton objectif. Offert.", note_en: "15 min with Lucas to go over your goal. Free.",
  case: "J'ai déjà choisi mon créneau", case_en: "I've already booked my slot"
};
/* G : [page, titre, texte, description sous la carte (E2), titre de l'exemple] ; puis l'anglais */
const G = {
  programme: ["Mon programme", "Cette séance découverte est la même pour tout le monde. Ton programme, lui, part de ton niveau, de ton matériel et de ton emploi du temps, puis évolue avec tes progrès.", E.lignes[0][1], "Ta séance découverte"],
  journal: ["Mon journal", "Avec l'accompagnement, chaque séance est notée et l'app te propose la charge à viser la fois suivante : tu sais toujours quoi faire pour progresser.", E.lignes[2][1], "Séance A — Corps entier"],
  nutrition: ["Nutrition", "Avec l'accompagnement, tes repas sont calculés sur tes calories et tes macros, en tenant compte de ton régime et de tes allergies, avec ta liste de courses.", E.lignes[1][1], "Une journée type"],
  suivi: ["Mon suivi", "Avec l'accompagnement, ton coach lit ton bilan chaque semaine et te répond avec la suite du plan : tu sais toujours où tu en es et quoi faire ensuite.", E.lignes[3][1], "Ton suivi de la semaine"]
};
const G_EN = {
  programme: ["My program", "This starter workout is the same for everyone. Your program starts from your level, your equipment and your schedule, then evolves as you progress.", E.lignes_en[0][1]],
  journal: ["My training log", "With coaching, every workout is logged and the app suggests the weight to aim for next time: you always know what to do to progress.", E.lignes_en[2][1]],
  nutrition: ["Nutrition", "With coaching, your meals are calculated from your calories and macros, taking your diet and allergies into account, with your shopping list.", E.lignes_en[1][1]],
  suivi: ["My follow-up", "With coaching, your coach reads your weekly check-in and replies with the next step: you always know where you stand and what to do next.", E.lignes_en[3][1]]
};
/* les pages verrouillées cachées : texte générique et description d'avant (inchangés) */
const CACHEES = { bilan: ["Mon bilan", "Ton bilan du mois, préparé avec ton coach."], complements: ["Mes compléments", "Tes compléments conseillés, avec les doses et les moments."] };
const VERROU_TXT = "Cette fonctionnalité est disponible avec l'accompagnement MHX.";
/* décision 4 : le 2e paragraphe du texte court des conditions, et l'empreinte des 11 autres (version 2026-09-29 de la v60 :
   sha256 des 11 paragraphes, JSON, 16 premiers caractères) — « rien d'autre ne change » */
const COND = {
  version: "2026-09-30",
  p2: "Données collectées : ton prénom, ton nom, ton email, tes réponses aux 3 questions de départ et ton activité dans l'app, dont tes clics sur « Récupérer mon plan d'action ». Données de santé : celles que tu saisis (poids, mensurations, âge, taille et activité dans le calculateur de calories), avec ton accord (case dédiée).",
  p2_en: "Data collected: your first name, your last name, your email, your answers to the 3 starting questions and your activity in the app, including your clicks on “Get my action plan”. Health data: what you enter (weight, measurements, age, height and activity in the calorie calculator), with your consent (dedicated box).",
  autres: "71839dfa3afa4ec5", autres_en: "6d866771dcf795a5"
};
const empreinte = a => crypto.createHash("sha256").update(JSON.stringify(a)).digest("hex").slice(0, 16);
/* tous les nouveaux textes du lot 2 : jamais chez un client */
const NOUVEAUX = [D.offert, D.titre, D.texte, D.garde, D.libre, D.bouton, D.sous, D.plus_tard, E.sous, E.titre, E.note, E.case].concat(E.lignes.map(x => x[1]), Object.values(G).map(x => x[1]));
const NOUVEAUX_EN = [D.titre_en, D.texte_en, D.garde_en, D.libre_en, D.bouton_en, D.sous_en, D.plus_tard_en, E.sous_en, E.titre_en, E.note_en, E.case_en].concat(E.lignes_en.map(x => x[1]), Object.values(G_EN).map(x => x[1]));
const NOUVEAUX_RE = /Récupérer mon plan|Get my action plan|15 min avec Lucas|15 min with Lucas|plan d'action|action plan/i;

/* l'objectif du questionnaire complet posé par l'app depuis la réponse « problème » */
const OBJ = { "Perdre du gras": "Perte de poids / sèche" };
/* un prospect qui a validé le questionnaire (réponses à choix, lot 1) : projection « M'aimer sur les photos » */
const AVEC_CHOIX = (k, extra) => Object.assign({ probleme: "Perdre du gras", obstacle_choix: ["temps", "craquages"], obstacle: "Le manque de temps · Je craque sur la nourriture",
  projection_choix: ["photos"], projection: "M'aimer sur les photos", objectif: OBJ["Perdre du gras"], objectif_auto: OBJ["Perdre du gras"],
  court_debut: avant(2 * H), court_le: avant(H), email_compte: "p" + k + "@exemple.fr" }, extra || {});
const PLUS_TARD = () => ({ bilan_propose: { choix: "plus_tard", le: avant(50 * MIN) } });

/* la page « Ton plan d'action », lue dans la page : ordre, textes bruts (insécables gardées), styles */
const planVu = page => page.evaluate(() => {
  const s = document.querySelector("#vue #dc-bilan"); if (!s) return null;
  const brut = e => e ? e.textContent.replace(/[ \t\r\n]+/g, " ").trim() : null;
  const sig = e => e.tagName.toLowerCase() + (e.id ? "#" + e.id : "") + [...e.classList].sort().map(c => "." + c).join("");
  const st = e => { if (!e) return null; const c = getComputedStyle(e), r = e.getBoundingClientRect(); return { bg: c.backgroundColor, bord: [c.borderTopWidth, c.borderRightWidth, c.borderBottomWidth, c.borderLeftWidth].join(" "), deco: c.textDecorationLine, coul: c.color, tt: c.textTransform, w: Math.round(r.width), h: Math.round(r.height) }; };
  const cta = s.querySelector(".dc-cta"), a = s.querySelector("#dc-bilan-reserver"), t = s.querySelector("#dc-bilan-plus-tard"), o = s.querySelector("#dc-offert");
  const q = x => brut(s.querySelector(x));
  const acc = (() => { const x = document.createElement("span"); x.style.color = "var(--accent)"; document.body.appendChild(x); const v = getComputedStyle(x).color; x.remove(); return v; })();
  return { classes: [...s.classList].sort().join("."), enfants: [...s.children].map(sig), cta: cta ? [...cta.children].map(sig) : [],
    txt: [q("#dc-offert"), q("h2"), q("#dc-projection"), q("#dc-bilan-texte"), q("#dc-bilan-garde"), q("#dc-bilan-libre"), q("#dc-bilan-reserver"), q("#dc-bilan-sous"), q("#dc-bilan-plus-tard")],
    a: a ? { href: a.getAttribute("href"), cible: a.getAttribute("target"), rel: a.getAttribute("rel") || "", dc: a.getAttribute("data-dc-cal") } : null,
    sa: st(a), st: st(t), so: st(o), ctaW: cta ? Math.round(cta.getBoundingClientRect().width) : 0,
    nBtn: s.querySelectorAll(".btn").length, tag: t ? t.tagName + (t.classList.contains("btn") ? ".btn" : "") : "",
    nCal: document.querySelectorAll("#vue a[href*='calendly']").length, nDc: document.querySelectorAll("#vue [data-dc-cal]").length,
    dores: [...document.querySelectorAll("#vue a, #vue button")].filter(e => e.offsetParent !== null && getComputedStyle(e).backgroundColor === acc).map(e => e.id || e.textContent.trim()) };
});
/* l'accueil du prospect, lu dans la page */
const accueilVu = page => page.evaluate(() => {
  const n = e => e ? e.textContent.replace(/\s+/g, " ").trim() : null;
  const haut = document.querySelector("#vue header.masthead [data-dc-cal]"), act = haut && haut.closest(".actions"), sous = act && act.nextElementSibling;
  const acc = document.querySelector("#vue #dc-accomp"), ca = acc && acc.querySelector("[data-dc-cal]"), lab = document.querySelector("#dc-reserve-case");
  const st = e => { if (!e) return null; const c = getComputedStyle(e); return { bg: c.backgroundColor, bord: c.borderTopStyle + " " + c.borderTopWidth }; };
  return { blocs: [...document.querySelectorAll("#vue section[id^='dc-']")].map(s => s.id),
    etape: n(document.querySelector("#dc-etape h2")) + " | " + n(document.querySelector("#dc-etape-go")) + " | " + ((document.querySelector("#dc-etape-go") || {}).getAttribute ? document.querySelector("#dc-etape-go").getAttribute("href") : ""),
    cals: [...document.querySelectorAll("#vue [data-dc-cal]")].map(a => ({ code: a.getAttribute("data-dc-cal"), href: a.getAttribute("href"), t: n(a), cible: a.getAttribute("target"), rel: a.getAttribute("rel") || "", cls: [...a.classList].sort().join("."), haut: !!a.closest("header.masthead"), carte: !!a.closest("#dc-accomp") })),
    nCal: document.querySelectorAll("#vue a[href*='calendly']").length,
    haut: haut ? { t: n(haut), style: st(haut) } : null, sous: sous ? { cls: [...sous.classList].sort().join("."), t: n(sous), dansHaut: !!sous.closest("header.masthead") } : null,
    titre: acc ? n(acc.querySelector("h2")) : null, lignes: acc ? [...acc.querySelectorAll(".liste-debloque li")].map(li => [n(li.querySelector("a[data-dc-vitrine]")), n(li)]) : [],
    carte: ca ? { t: n(ca), style: st(ca) } : null, note: acc ? n(acc.querySelector("p.note")) : null, caseT: lab ? n(lab.closest("label")) : null, caseCoche: lab ? lab.checked : null };
});
/* une page verrouillée, lue dans la page (textes bruts : insécables gardées) */
const verrouVu = (page, id) => page.evaluate(id => {
  const n = e => e ? e.textContent.replace(/[ \t\r\n]+/g, " ").trim() : null;
  const v = document.querySelector("#vue .verrou"), e = document.getElementById("ech-" + id), plus = document.querySelector("#vue .verrou-plus");
  const a = v ? [...v.querySelectorAll("a")] : [], act = v && v.querySelector(".actions"), sous = act && act.nextElementSibling;
  return { v: !!v, titre: v ? n(v.querySelector("h2")) : null, texte: v ? n(v.querySelector("p")) : null, nLiens: a.length,
    a: a[0] ? { href: a[0].getAttribute("href"), t: n(a[0]), cible: a[0].getAttribute("target"), rel: a[0].getAttribute("rel") || "", btn: a[0].classList.contains("btn"), h: Math.round(a[0].getBoundingClientRect().height) } : null,
    sous: sous ? { cls: sous.className, t: n(sous) } : null, plus: plus ? n(plus) : null, plusApres: !!(v && plus && (v.compareDocumentPosition(plus) & Node.DOCUMENT_POSITION_FOLLOWING)),
    ech: e ? { h2: n(e.querySelector("h2")), role: e.getAttribute("role"), marque: n(e.querySelector(".ech-marque .pastille")), avant: !!(v && (e.compareDocumentPosition(v) & Node.DOCUMENT_POSITION_FOLLOWING)), texte: n(e) } : null,
    nEch: document.querySelectorAll("#vue .echantillon").length };
}, id);

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF67_PORT=9831 node verif67.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. page « Ton plan d'action » en français, 390 px, thème sombre =================== */
  await bloc("A. plan d'action en français", async () => {
    const k = 1, ID = PID(k), db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k)]])] });
    const { c, page } = await ouvrir(b, db, k, "", "#dc-bilan");
    await attendre(page, 1300);   // Store.ecrire n'envoie qu'après 700 ms : une écriture lancée par l'affichage aurait le temps d'arriver
    const P = await planVu(page), T = P ? P.txt : [], th = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    const ink3 = await couleur(page, "--ink-3");
    ok("questionnaire validé sans choix : la page « Ton plan d'action » (section.panel.dc-plan#dc-bilan), thème sombre ; dans l'ordre : « Offert » (span.eyebrow.dc-offert), titre, projection, texte, « Ton plan est à toi… », petit texte gris (p.note), puis div.dc-cta = bouton doré, « 15 min · par téléphone · offert », « Plus tard… » (button.lien-discret)",
      !!P && th === null && P.classes === "dc-plan.panel" && JSON.stringify(P.enfants) === JSON.stringify(["span#dc-offert.dc-offert.eyebrow", "h2", "p#dc-projection.dc-projection", "p#dc-bilan-texte", "p#dc-bilan-garde", "p#dc-bilan-libre.note", "div.dc-cta"])
      && JSON.stringify(P.cta) === JSON.stringify(["a#dc-bilan-reserver.btn", "p#dc-bilan-sous.dc-cta-sous", "button#dc-bilan-plus-tard.lien-discret"]), JSON.stringify(P && [th, P.classes, P.enfants, P.cta]));
    ok("textes EXACTS : « Offert », « Ton plan d'action personnalisé », « Ton objectif dans 3 mois : « M'aimer sur les photos » », « En 15 minutes au téléphone avec Lucas… », « Ton plan est à toi, quelle que soit la suite. », « Si l'accompagnement te correspond… Tu es libre de dire non. »",
      JSON.stringify(T.slice(0, 6).map(norm)) === JSON.stringify([D.offert, D.titre, D.projection("M'aimer sur les photos"), D.texte, D.garde, D.libre]), JSON.stringify(T.slice(0, 6)));
    ok("bouton « Récupérer mon plan d'action », ligne « 15 min · par téléphone · offert », lien « Plus tard, je découvre mon espace »",
      JSON.stringify(T.slice(6).map(norm)) === JSON.stringify([D.bouton, D.sous, D.plus_tard]), JSON.stringify(T.slice(6)));
    ok("typographie française : espace insécable avant « : » et dans « « … » » (projection, texte) ; « Offert » affiché en capitales, en doré",
      T[2] === typo(D.projection("M'aimer sur les photos")) && T[3] === typo(D.texte) && !!P.so && P.so.tt === "uppercase" && P.so.coul === OR_SOMBRE, JSON.stringify([T[2], T[3], P && P.so]));
    ok("UN seul élément doré : le bouton (seul .btn de la page, fond doré) ; « Plus tard » n'est pas un .btn : bouton texte gris (--ink-3), souligné, sans fond ni bordure",
      P.nBtn === 1 && JSON.stringify(P.dores) === '["dc-bilan-reserver"]' && P.sa.bg === OR_SOMBRE && P.tag === "BUTTON" && P.st.bg === TRANSPARENT && P.st.bord === "0px 0px 0px 0px" && /underline/.test(P.st.deco) && P.st.coul === ink3 && P.st.coul !== OR_SOMBRE,
      JSON.stringify([P.nBtn, P.dores, P.sa, P.tag, P.st, ink3]));
    ok("lien exact : " + lienAtt("apres_questionnaire", k).slice(0, 110) + "… (nouvelle adresse, utm_source=app, utm_medium=bouton, utm_content=apres_questionnaire, prénom, nom, email), nouvel onglet, data-dc-cal « apres_questionnaire », seul lien Calendly de la page",
      !!P.a && P.a.href === lienAtt("apres_questionnaire", k) && P.a.cible === "_blank" && /noopener/.test(P.a.rel) && P.a.dc === "apres_questionnaire" && P.nCal === 1 && P.nDc === 1, JSON.stringify([P.a, P.nCal, P.nDc]));
    const v = await texte(page, "#vue");
    ok("390 px : aucun défilement horizontal ; bouton sur toute la largeur, « Plus tard » tactile (44 px de haut au moins) ; aucun prix ni « undefined » ; aucune écriture à l'affichage",
      !(await deborde(page)) && P.sa.h >= 44 && Math.abs(P.sa.w - P.ctaW) <= 1 && P.st.h >= 44 && propre(v) && saisies(db).length === 0, JSON.stringify([P.sa, P.st, P.ctaW]) + " · " + resume(db));
    await relever(page, false, "plan d'action");
    const t0 = Date.now(), o = await ouvrirCalendly(c, page, "#dc-bilan-reserver");
    ok("clic sur le bouton : l'onglet ouvert reçoit exactement ce lien (faux Calendly)", o.url === lienAtt("apres_questionnaire", k) && o.recus.length === 1 && o.recus[0] === o.url, JSON.stringify(o));
    const cl = clicsDe(db, ID), I = intakeDe(db, ID) || {};
    ok("… le clic est compté : challenge.cta.clics = [{ source « apres_questionnaire », jour, date }] ; intake.bilan_propose = { choix « reserver », le } en UNE écriture, les réponses intactes",
      cl.length === 1 && cl[0].source === "apres_questionnaire" && typeof cl[0].jour === "number" && Math.abs(Date.parse(cl[0].date) - t0) < 15000 && ecr(db, "challenge", ID).length === 1
      && ecr(db, "intake", ID).length === 1 && !!I.bilan_propose && I.bilan_propose.choix === "reserver" && Object.keys(I.bilan_propose).sort().join() === "choix,le" && I.projection === "M'aimer sur les photos" && I.court_le === AVEC_CHOIX(k).court_le,
      JSON.stringify(cl) + " · " + JSON.stringify(I.bilan_propose) + " · " + resume(db));
    ok("… puis l'accueil du prospect (plus la page « Ton plan d'action »)", !!(await page.$("#dc-accomp")) && !(await page.$("#dc-bilan")), await texte(page, "#vue"));
  });

  /* =================== B. la même page en anglais, 390 px, thème clair ; « Plus tard » =================== */
  await bloc("B. plan d'action en anglais, « Plus tard »", async () => {
    const k = 2, ID = PID(k), db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k)]])] });
    const { page } = await ouvrir(b, db, k, "", "#dc-bilan", { langue: "en", theme: "light" });
    await attendre(page, 1000);
    const P = await planVu(page), T = P ? P.txt : [], th = await page.evaluate(() => document.documentElement.getAttribute("data-theme")), v = await texte(page, "#vue");
    ok("anglais, thème clair : « Free », « Your personalized action plan », « Your goal in 3 months: “Loving how I look in photos” », texte, « The plan is yours to keep… », « If coaching is a good fit… », « Get my action plan », « 15 min · phone call · free », « Later, let me explore my space » (exacts, dans cet ordre, sans espace insécable)",
      th === "light" && JSON.stringify(T.map(norm)) === JSON.stringify([D.offert_en, D.titre_en, D.projection_en("Loving how I look in photos"), D.texte_en, D.garde_en, D.libre_en, D.bouton_en, D.sous_en, D.plus_tard_en]) && !T.some(x => /[  ]/.test(x || "")),
      JSON.stringify([th, T]));
    const ink3 = await couleur(page, "--ink-3"), francais = [D.offert, D.titre, D.texte, D.garde, D.libre, D.bouton, D.sous, D.plus_tard, "M'aimer sur les photos"].filter(x => v.includes(x));
    ok("anglais : aucun texte français de la page ; un seul élément doré (doré du thème clair), « Later… » gris, souligné, sans fond ni bordure ; « Free » en capitales dorées",
      !francais.length && P.nBtn === 1 && JSON.stringify(P.dores) === '["dc-bilan-reserver"]' && P.sa.bg === OR_CLAIR && P.st.bg === TRANSPARENT && P.st.bord === "0px 0px 0px 0px" && /underline/.test(P.st.deco) && P.st.coul === ink3 && P.so.tt === "uppercase" && P.so.coul === OR_CLAIR,
      JSON.stringify([francais, P.dores, P.sa, P.st, P.so]));
    ok("anglais : même lien exact (apres_questionnaire, pré-rempli), 390 px sans débordement, aucun prix ni « undefined », aucune écriture à l'affichage",
      !!P.a && P.a.href === lienAtt("apres_questionnaire", k) && P.a.cible === "_blank" && !(await deborde(page)) && propre(v) && saisies(db).length === 0, JSON.stringify(P.a) + " · " + resume(db));
    await relever(page, true, "plan d'action");
    /* « Later » touché deux fois coup sur coup */
    await page.evaluate(() => { const t = document.querySelector("#dc-bilan-plus-tard"); t.click(); t.click(); }); await attendre(page, 1800);
    const I = clone(intakeDe(db, ID)) || {};
    ok("« Later, let me explore my space » (deux taps) : intake.bilan_propose = { choix « plus_tard », le } en UNE écriture ; aucun clic compté, aucun onglet Calendly",
      ecr(db, "intake", ID).length === 1 && !!I.bilan_propose && I.bilan_propose.choix === "plus_tard" && typeof I.bilan_propose.le === "string" && ecr(db, "challenge", ID).length === 0 && !db.calendly.length,
      JSON.stringify(I.bilan_propose) + " · " + resume(db));
    const acc1 = !!(await page.$("#dc-accomp")) && !(await page.$("#dc-bilan")) && (await page.evaluate(() => window.scrollY)) === 0;
    await aller(page, "#/decouverte/bilan", 1500);
    const rouverte = !!(await page.$("#dc-bilan")) && norm((await planVu(page) || { txt: [] }).txt[1]) === D.titre_en;
    await page.click("#dc-bilan-plus-tard"); await attendre(page, 1600);
    ok("… puis l'accueil, en haut de page ; rouverte par #/decouverte/bilan, la page revient ; « Later » de nouveau : l'accueil (#/decouverte), rien de réécrit (le premier choix gardé)",
      acc1 && rouverte && !!(await page.$("#dc-accomp")) && (await page.evaluate(() => location.hash)) === "#/decouverte" && ecr(db, "intake", ID).length === 1 && (intakeDe(db, ID).bilan_propose || {}).le === I.bilan_propose.le,
      JSON.stringify([acc1, rouverte, await page.evaluate(() => location.hash)]) + " · " + resume(db));
  });

  /* =================== C. accueil du prospect, français, 390 px, thème sombre =================== */
  await bloc("C. accueil en français", async () => {
    const k = 3, ID = PID(k), db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k, PLUS_TARD())]])] });
    const { c, page } = await ouvrir(b, db, k, "", "#dc-accomp");
    await attendre(page, 1300);
    const A = await accueilVu(page), v = await texte(page, "#vue");
    ok("accueil : son étape (« Ta première étape », « Calcule tes calories (2 min) » → #/calculateur), la Speed Formation, puis la carte de l'accompagnement (inchangés)",
      JSON.stringify(A.blocs) === '["dc-etape","dc-formation","dc-accomp"]' && A.etape === "Ta première étape | Calcule tes calories (2 min) | #/calculateur", JSON.stringify([A.blocs, A.etape]));
    ok("exactement 2 liens Calendly (data-dc-cal) : accueil_haut dans l'en-tête et accueil_accompagnement dans la carte, liens exacts (nouvelle adresse, pré-remplis), nouvel onglet",
      A.cals.length === 2 && A.nCal === 2 && A.cals[0].code === "accueil_haut" && A.cals[0].haut && A.cals[1].code === "accueil_accompagnement" && A.cals[1].carte
      && A.cals.every(x => x.href === lienAtt(x.code, k) && x.cible === "_blank" && /noopener/.test(x.rel)), JSON.stringify(A.cals));
    ok("bouton du haut : « Récupérer mon plan d'action », en contour (btn ghost petit : sans fond, bordure fine), suivi de la ligne « 15 min avec Lucas · offert » (p.dc-cta-sous.dc-haut-sous, dans l'en-tête)",
      !!A.haut && A.haut.t === D.bouton && A.cals[0].cls === "btn.ghost.petit" && A.haut.style.bg === TRANSPARENT && A.haut.style.bord === "solid 1px" && !!A.sous && A.sous.cls === "dc-cta-sous.dc-haut-sous" && A.sous.t === E.sous && A.sous.dansHaut,
      JSON.stringify([A.haut, A.cals[0] && A.cals[0].cls, A.sous]));
    ok("carte « Ce que l'accompagnement ajoute » : 4 lignes exactes (Mon programme, Nutrition, Mon journal, Mon suivi — nouvelles descriptions)",
      A.titre === E.titre && JSON.stringify(A.lignes) === JSON.stringify(E.lignes.map(([n, d]) => [n, n + " — " + d])), JSON.stringify([A.titre, A.lignes]));
    ok("carte : bouton « Récupérer mon plan d'action » en contour (btn ghost), note « 15 min avec Lucas pour faire le point sur ton objectif. Offert. », case « J'ai déjà choisi mon créneau » décochée",
      !!A.carte && A.carte.t === D.bouton && A.cals[1].cls === "btn.ghost" && A.carte.style.bg === TRANSPARENT && A.note === E.note && A.caseT === E.case && A.caseCoche === false, JSON.stringify([A.carte, A.note, A.caseT, A.caseCoche]));
    ok("accueil : plus aucun « Réserver mon bilan » ni durée à 30 min, aucun prix ni « undefined » ; 390 px sans débordement ; aucune écriture à l'affichage",
      !ANCIENS_TXT.test(v) && !TRENTE.test(v) && propre(v) && !(await deborde(page)) && saisies(db).length === 0, (v.match(ANCIENS_TXT) || v.match(TRENTE) || [""])[0] + " · " + resume(db));
    await relever(page, false, "accueil");
    const o1 = await ouvrirCalendly(c, page, '#vue header.masthead [data-dc-cal="accueil_haut"]'), cl1 = clicsDe(db, ID).slice();
    ok("clic sur le bouton du haut : l'onglet ouvert reçoit le lien accueil_haut ; le clic est compté (source accueil_haut)",
      o1.url === lienAtt("accueil_haut", k) && o1.recus.length === 1 && o1.recus[0] === o1.url && cl1.length === 1 && cl1[0].source === "accueil_haut" && typeof cl1[0].jour === "number", JSON.stringify([o1, cl1]));
    const o2 = await ouvrirCalendly(c, page, '#dc-accomp [data-dc-cal="accueil_accompagnement"]'), cl2 = clicsDe(db, ID);
    ok("clic sur le bouton de la carte : l'onglet ouvert reçoit le lien accueil_accompagnement ; 2 clics comptés dans l'ordre (accueil_haut, accueil_accompagnement) ; seule la clé challenge est écrite",
      o2.url === lienAtt("accueil_accompagnement", k) && o2.recus.length === 1 && JSON.stringify(cl2.map(x => x.source)) === '["accueil_haut","accueil_accompagnement"]' && saisies(db).every(e => e.outil === "challenge"), JSON.stringify([o2, cl2]) + " · " + resume(db));
    const n0 = ecr(db, "challenge", ID).length, t0 = Date.now();
    await page.check("#dc-reserve-case"); await attendre(page, 2300);
    const C = challengeDe(db, ID), pastille = await texte(page, "#dc-reserve-ok");
    ok("case « J'ai déjà choisi mon créneau » cochée : même comportement — challenge.reserve (maintenant) en UNE écriture, les 2 clics gardés, pastille « Bilan réservé le … Ton coach te retrouve à l'heure prévue. »",
      ecr(db, "challenge", ID).length === n0 + 1 && typeof C.reserve === "string" && Math.abs(Date.parse(C.reserve) - t0) < 15000 && ((C.cta || {}).clics || []).length === 2 && /^Bilan réservé le .+\. Ton coach te retrouve à l'heure prévue\.$/.test(pastille) && !(await page.$("#dc-reserve-case")),
      JSON.stringify(C) + " · " + pastille);
  });

  /* =================== D. accueil en anglais, 390 px, thème clair ; « Edit my answers » =================== */
  await bloc("D. accueil en anglais", async () => {
    const k = 4, db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k, PLUS_TARD())]])] });
    const { page } = await ouvrir(b, db, k, "", "#dc-accomp", { langue: "en", theme: "light" });
    await attendre(page, 1300);
    const A = await accueilVu(page), v = await texte(page, "#vue");
    ok("anglais, thème clair : bouton du haut « Get my action plan » (accueil_haut) + « 15 min with Lucas · free » ; carte « What coaching adds » : 4 lignes exactes (My program, Nutrition, My training log, My follow-up — descriptions anglaises)",
      (await page.evaluate(() => document.documentElement.getAttribute("data-theme"))) === "light" && !!A.haut && A.haut.t === D.bouton_en && !!A.sous && A.sous.t === E.sous_en && A.titre === E.titre_en
      && JSON.stringify(A.lignes) === JSON.stringify(E.lignes_en.map(([n, d]) => [n, n + " — " + d])), JSON.stringify([A.haut, A.sous, A.titre, A.lignes]));
    const francais = NOUVEAUX.filter(x => v.includes(x));
    ok("anglais : carte « Get my action plan » (accueil_accompagnement), « 15 min with Lucas to go over your goal. Free. », « I've already booked my slot » ; les 2 liens exacts ; aucun texte français du lot 2, aucun ancien libellé ni durée à 30 min ; 390 px sans débordement ; aucune écriture",
      !!A.carte && A.carte.t === D.bouton_en && A.note === E.note_en && A.caseT === E.case_en && A.cals.length === 2 && A.cals.every(x => x.href === lienAtt(x.code, k)) && A.cals.map(x => x.code).join() === "accueil_haut,accueil_accompagnement"
      && !francais.length && !ANCIENS_TXT.test(v) && !TRENTE.test(v) && propre(v) && !(await deborde(page)) && saisies(db).length === 0, JSON.stringify([A.carte, A.note, A.caseT, francais]) + " · " + resume(db));
    await relever(page, true, "accueil");
    await aller(page, "#/decouverte/reponses", 1500); await page.waitForSelector("#q-probleme", { timeout: 6000 });
    const R = await accueilVu(page), vr = await texte(page, "#vue");
    ok("« Edit my answers » (#/decouverte/reponses) : bouton du haut « Get my action plan » (reponses_haut, lien exact) + « 15 min with Lucas · free », seul lien Calendly de la page",
      R.cals.length === 1 && R.nCal === 1 && R.cals[0].code === "reponses_haut" && R.cals[0].href === lienAtt("reponses_haut", k) && R.cals[0].t === D.bouton_en && !!R.sous && R.sous.t === E.sous_en && !ANCIENS_TXT.test(vr) && !TRENTE.test(vr),
      JSON.stringify([R.cals, R.sous]));
    await relever(page, true, "modifier mes réponses");
  });

  /* =================== E. « Modifier mes réponses » en français =================== */
  await bloc("E. « Modifier mes réponses »", async () => {
    const k = 5, ID = PID(k), db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k, PLUS_TARD())]])] });
    const { c, page } = await ouvrir(b, db, k, "#/decouverte/reponses", "#q-probleme");
    await attendre(page, 1300);
    const R = await accueilVu(page), v = await texte(page, "#vue");
    ok("« Modifier mes réponses » : bouton du haut « Récupérer mon plan d'action » en contour, data-dc-cal « reponses_haut », lien exact, ligne « 15 min avec Lucas · offert » ; seul lien Calendly de la page ; aucun ancien libellé ni durée à 30 min",
      R.cals.length === 1 && R.nCal === 1 && R.cals[0].code === "reponses_haut" && R.cals[0].haut && R.cals[0].cls === "btn.ghost.petit" && R.cals[0].href === lienAtt("reponses_haut", k) && R.cals[0].t === D.bouton && R.cals[0].cible === "_blank"
      && !!R.sous && R.sous.t === E.sous && R.sous.cls === "dc-cta-sous.dc-haut-sous" && !ANCIENS_TXT.test(v) && !TRENTE.test(v) && saisies(db).length === 0, JSON.stringify([R.cals, R.sous]) + " · " + resume(db));
    await relever(page, false, "modifier mes réponses");
    const o = await ouvrirCalendly(c, page, '[data-dc-cal="reponses_haut"]'), cl = clicsDe(db, ID);
    ok("clic : l'onglet ouvert reçoit le lien reponses_haut ; le clic est compté (source reponses_haut) ; rien d'autre n'est écrit (intake intact, questionnaire toujours affiché)",
      o.url === lienAtt("reponses_haut", k) && o.recus.length === 1 && cl.length === 1 && cl[0].source === "reponses_haut" && ecr(db, "intake", ID).length === 0 && saisies(db).every(e => e.outil === "challenge") && !!(await page.$("#q-probleme")),
      JSON.stringify([o, cl]) + " · " + resume(db));
  });

  /* =================== F. les 4 pages verrouillées de la vitrine, français, 390 px, thème sombre =================== */
  await bloc("F. pages verrouillées en français", async () => {
    const k = 6, ID = PID(k), db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k, PLUS_TARD())]])] });
    const { c, page } = await ouvrir(b, db, k, "#/profil", "#vue .masthead");
    let n = 0;
    for (const id of ["programme", "journal", "nutrition", "suivi"]) {
      const [nom, txt, av, h2] = G[id], code = "verrou_" + id;
      await aller(page, "#/profil", 1000);
      const n0 = db.lectures.length;
      await aller(page, "#/" + id, 1800);
      const V = await verrouVu(page, id), lus = luHors(db, n0);
      const lot2 = V.ech ? NOUVEAUX.concat([E.sous]).filter(x => V.ech.texte.includes(x)) : [];
      ok(`#/${id} : l'exemple au-dessus inchangé (« ${h2} », marqué « Exemple », aucun texte du lot 2 dedans), puis la carte : « ${nom} », son texte propre (typographie française), « Récupérer mon plan d'action » (lien ${code} exact, nouvel onglet), « 15 min avec Lucas · offert », puis « ${av.slice(0, 40)}… » ; aucune clé « donnees » lue`,
        !!V.ech && V.ech.h2 === h2 && V.ech.role === "region" && V.ech.marque === "Exemple" && V.ech.avant && !lot2.length && V.nEch === 1
        && V.titre === nom && V.texte === typo(txt) && V.nLiens === 1 && !!V.a && V.a.href === lienAtt(code, k) && V.a.t === D.bouton && V.a.btn && V.a.cible === "_blank" && /noopener/.test(V.a.rel) && V.a.h >= 44
        && !!V.sous && V.sous.cls === "verrou-sous" && V.sous.t === E.sous && V.plus === av && V.plusApres && !lus.length,
        JSON.stringify([V, lot2, lus]));
      await relever(page, false, "#/" + id);
      const w0 = saisies(db).length, o = await ouvrirCalendly(c, page, "#vue .verrou a[target=_blank]"), cl = clicsDe(db, ID), autres = saisies(db).slice(w0).filter(e => e.outil !== "challenge");
      n++;
      ok(`#/${id} : clic → l'onglet ouvert reçoit le lien ${code} ; le clic est compté (source ${code}), rien d'autre n'est écrit`,
        o.url === lienAtt(code, k) && o.recus.length === 1 && cl.length === n && cl[n - 1].source === code && typeof cl[n - 1].jour === "number" && !autres.length, JSON.stringify([o, cl.map(x => x.source)]) + " · " + resume(db));
    }
  });

  /* =================== G. les pages verrouillées cachées (#/bilan, #/complements) =================== */
  await bloc("G. pages verrouillées cachées", async () => {
    const k = 7, ID = PID(k), db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k, PLUS_TARD())]])] });
    const { c, page } = await ouvrir(b, db, k, "#/profil", "#vue .masthead");
    const recus = [];
    for (const id of ["bilan", "complements"]) {
      const [nom, av] = CACHEES[id], code = "verrou_" + id;
      await aller(page, "#/profil", 1000);
      const n0 = db.lectures.length;
      await aller(page, "#/" + id, 1600);
      const V = await verrouVu(page, id), lus = luHors(db, n0);
      ok(`#/${id} (hors de la navigation) : pas d'exemple, « ${nom} », texte inchangé « ${VERROU_TXT} », même bouton « Récupérer mon plan d'action » (lien ${code} exact), même ligne « 15 min avec Lucas · offert », description inchangée ; aucune clé « donnees » lue`,
        V.v && !V.ech && V.nEch === 0 && V.titre === nom && V.texte === VERROU_TXT && V.nLiens === 1 && !!V.a && V.a.href === lienAtt(code, k) && V.a.t === D.bouton && V.a.cible === "_blank"
        && !!V.sous && V.sous.cls === "verrou-sous" && V.sous.t === E.sous && V.plus === av && !lus.length, JSON.stringify([V, lus]));
      await relever(page, false, "#/" + id);
      recus.push(await ouvrirCalendly(c, page, "#vue .verrou a[target=_blank]"));
    }
    const cl = clicsDe(db, ID);
    ok("clics sur les deux : les onglets ouverts reçoivent les liens verrou_bilan puis verrou_complements ; 2 clics comptés (sources verrou_bilan, verrou_complements), seule la clé challenge est écrite",
      recus.length === 2 && recus[0].url === lienAtt("verrou_bilan", k) && recus[1].url === lienAtt("verrou_complements", k) && recus.every(o => o.recus.length === 1)
      && JSON.stringify(cl.map(x => x.source)) === '["verrou_bilan","verrou_complements"]' && saisies(db).every(e => e.outil === "challenge"), JSON.stringify([recus, cl]) + " · " + resume(db));
  });

  /* =================== H. les 4 pages verrouillées en anglais, 390 px, thème clair =================== */
  await bloc("H. pages verrouillées en anglais", async () => {
    const k = 8, ID = PID(k), db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k, PLUS_TARD())]])] });
    const { c, page } = await ouvrir(b, db, k, "#/profil", "#vue .masthead", { langue: "en", theme: "light" });
    for (const id of ["programme", "journal", "nutrition", "suivi"]) {
      const [nom, txt, av] = G_EN[id], code = "verrou_" + id;
      await aller(page, "#/profil", 1000);
      await aller(page, "#/" + id, 1800);
      const V = await verrouVu(page, id), v = await texte(page, "#vue"), francais = NOUVEAUX.filter(x => v.includes(x));
      ok(`anglais, #/${id} : l'exemple (« Example ») au-dessus, « ${nom} », « ${txt.slice(0, 45)}… », « Get my action plan » (lien ${code} exact), « 15 min with Lucas · free », « ${av.slice(0, 35)}… » ; aucun texte français du lot 2`,
        !!V.ech && V.ech.marque === "Example" && V.ech.avant && V.titre === nom && V.texte === txt && !!V.a && V.a.href === lienAtt(code, k) && V.a.t === D.bouton_en && V.nLiens === 1
        && !!V.sous && V.sous.t === E.sous_en && norm(V.plus) === norm(av) && !francais.length && !(await deborde(page)), JSON.stringify([V, francais]));
      await relever(page, true, "#/" + id);
    }
    await aller(page, "#/journal", 1800);
    const o = await ouvrirCalendly(c, page, "#vue .verrou a[target=_blank]"), cl = clicsDe(db, ID);
    ok("anglais, #/journal : clic → l'onglet ouvert reçoit le lien verrou_journal ; le clic est compté (source verrou_journal)",
      o.url === lienAtt("verrou_journal", k) && o.recus.length === 1 && cl.length === 1 && cl[0].source === "verrou_journal" && saisies(db).every(e => e.outil === "challenge"), JSON.stringify([o, cl]) + " · " + resume(db));
  });

  /* =================== J. décision 4 : texte court des conditions, version 2026-09-30 =================== */
  await bloc("J. conditions (décision 4)", async () => {
    for (const en of [false, true]) {
      const k = en ? 10 : 9, db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k, PLUS_TARD())]])] });
      const { page } = await ouvrir(b, db, k, "#/profil", "#mc-conditions", en ? { langue: "en", theme: "light" } : {});
      await relever(page, en, "profil");
      const vers = await page.evaluate(() => [DECOUVERTE.confidentialite.version, DECOUVERTE.accords.conditions]);
      await page.click("#mc-conditions"); await page.waitForSelector(".volet .corps p", { timeout: 6000 }); await attendre(page, 300);
      const ps = await page.$$eval(".volet .corps p", l => l.map(p => p.textContent));
      await relever(page, en, "profil, volet des conditions");
      const autres = ps.filter((_, i) => i !== 1), emp = empreinte(autres);
      if (!en) ok("version du texte court : « 2026-09-30 » (DECOUVERTE.confidentialite.version = DECOUVERTE.accords.conditions, envoyée à l'inscription)", vers[0] === COND.version && vers[1] === COND.version, JSON.stringify(vers));
      ok(`Profil${en ? " (anglais)" : ""}, volet « ${en ? "Terms of use and privacy" : "Conditions d'utilisation et confidentialité"} » : 12 paragraphes ; le 2e EXACT (« …${en ? "including your clicks on “Get my action plan”" : "dont tes clics sur « Récupérer mon plan d'action »"}. … ») ; les 11 autres identiques à la version 2026-09-29 (v60 : même empreinte)`,
        ps.length === 12 && norm(ps[1]) === norm(en ? COND.p2_en : COND.p2) && emp === (en ? COND.autres_en : COND.autres) && !ps.some(p => /Réserver mon bilan|Book my assessment|30 ?min|30-minute/.test(p)),
        ps.length + " · " + ps[1] + " · empreinte " + emp);
    }
    /* inscription (faux serveur, données fictives) : la version envoyée */
    inscriptionLibre = true;
    try {
      const db = base(); db.nouvelId = PID(90);
      const { page } = await contexte(b, null, db);
      await page.goto(URL0 + "#/inscription"); await page.waitForSelector("#c-go"); await attendre(page, 400);
      await page.fill("#c-prenom", "Zoé"); await page.fill("#c-nom", "Martin"); await page.fill("#c-email", "zoe67@exemple.fr"); await page.fill("#c-mdp", "motdepasse-fictif-67");
      await page.check("#c-cgu"); await page.check("#c-sante");
      await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 15000 }), page.click("#c-go")]);
      await pret(page); await attendre(page, 1500);
      const md = ((db.inscriptions[0] || {}).data) || {};
      ok("inscription : conditions_version « 2026-09-30 » envoyée avec l'acceptation des conditions (datée), une seule inscription",
        db.inscriptions.length === 1 && md.conditions_version === COND.version && typeof md.consentement === "string" && /^\d{4}-\d{2}-\d{2}T/.test(md.consentement), JSON.stringify(db.inscriptions.map(x => x.data)));
    } finally { inscriptionLibre = null; }
  });

  /* =================== I. F récapitulé : chaque écran, et plus aucune durée à 30 min =================== */
  await bloc("I. lien Calendly de chaque écran", async () => {
    const parse = u => { try { const x = new URL(u); return { base: u.split("?")[0], cles: [...x.searchParams.keys()].join(","), v: Object.fromEntries(x.searchParams) }; } catch (e) { return null; } };
    const faux = CAL_RECUS.filter(u => { const p = parse(u), m = p && /^p(\d+)@exemple\.fr$/.exec(p.v.email || ""); return !p || !m || p.base !== CAL || p.cles !== "utm_source,utm_medium,utm_content,name,first_name,last_name,email" || p.v.utm_source !== "app" || p.v.utm_medium !== "bouton" || u !== lienAtt(p.v.utm_content, m[1]); });
    const codes = [...new Set(CAL_RECUS.map(u => (parse(u) || { v: {} }).v.utm_content))], manquants = CODES.filter(x => !codes.includes(x)), inconnus = codes.filter(x => !CODES.includes(x));
    ok("depuis CHAQUE écran (les 10 codes : apres_questionnaire, accueil_haut, reponses_haut, accueil_accompagnement, verrou_programme, verrou_journal, verrou_nutrition, verrou_suivi, verrou_bilan, verrou_complements), l'onglet ouvert a reçu la nouvelle adresse, utm_source=app, utm_medium=bouton, le bon utm_content, puis le pré-remplissage (name, first_name, last_name, email), rien d'autre",
      CAL_RECUS.length >= 10 && !faux.length && !manquants.length && !inconnus.length, "reçus " + CAL_RECUS.length + " · faux " + JSON.stringify(faux) + " · manquants " + JSON.stringify(manquants) + " · inconnus " + JSON.stringify(inconnus) + " · blocs " + JSON.stringify(blocsLances));
    for (const en of [false, true]) {
      const vus = VUS[en ? "en" : "fr"], mauvais = vus.filter(x => TRENTE.test(x.t) || ANCIENS_TXT.test(x.t)).map(x => x.ou + " : " + (x.t.match(TRENTE) || x.t.match(ANCIENS_TXT))[0]);
      const ecrans = new Set(vus.map(x => x.ou));
      ok(`${en ? "anglais" : "français"} : aucun « 30min », « 30 minutes », « 30-minute » ni ancien libellé du bilan sur les ${ecrans.size} écrans du prospect relevés (plan d'action, accueil, modifier mes réponses, pages verrouillées, Profil et volet des conditions ; textes et adresses des liens)`,
        ecrans.size >= (en ? 8 : 10) && !mauvais.length, JSON.stringify([...ecrans]) + " · " + JSON.stringify(mauvais));
    }
    const src = source(HTML), cfg = src.match(/calendly: "([^"]*)"/);
    ok("fichiers servis (page, js/, css/) : CONFIG.marque.calendly = la nouvelle adresse ; plus aucun « 30min » (ancien lien) ni « 30-minute »", !!cfg && cfg[1] === CAL && !/30min/.test(src) && !/30-minute/i.test(src),
      (cfg ? cfg[1] : "calendly introuvable") + " · " + ((src.match(/.{0,40}(30min|30-minute).{0,40}/i) || [""])[0]));
  });

  /* =================== K. coach : fiche d'un prospect =================== */
  await bloc("K. coach", async () => {
    const k = 40, ID = PID(k);
    const XSS = "<img src=x onerror=\"window.__xss=1\">";
    /* [code enregistré, libellé attendu dans la chronologie] ; le plus récent d'abord */
    const CLICS = [
      ["apres_questionnaire", "page « Ton plan d'action » (après les 3 questions)"], ["accueil_haut", "accueil, bouton du haut"], ["reponses_haut", "« Modifier mes réponses », bouton du haut"],
      ["accueil_accompagnement", "accueil, carte « Ce que l'accompagnement ajoute »"], ["verrou_programme", "page verrouillée Mon programme"], ["verrou_journal", "page verrouillée Mon journal"],
      ["verrou_nutrition", "page verrouillée Nutrition"], ["verrou_suivi", "page verrouillée Mon suivi"], ["verrou_bilan", "page verrouillée Mon bilan"], ["verrou_complements", "page verrouillée Mes compléments"],
      ["__proto__", ""], [XSS, ""],
      ["decouverte", "en haut de sa Découverte"], ["decouverte-accompagnement", "bloc accompagnement"], ["bilan-propose", "page de proposition du bilan"], ["verrou-programme", "page verrouillée « programme »"]
    ];
    const C0 = { version: 1, jours: {}, cta: { clics: CLICS.map(([source], i) => ({ jour: 2, source, date: avant((i + 1) * 7 * MIN) })) } };
    const db = base({ comptes: [compte(k, [["intake", AVEC_CHOIX(k, { bilan_propose: { choix: "reserver", le: avant(2 * H) } })], ["challenge", C0]])] });
    const { page } = await contexte(b, COACH, db, { viewport: ORDI });
    await page.goto(URL0 + "#/clients"); await pret(page, `[data-ouvrir="${ID}"]`);
    const coachSeul = await page.evaluate(() => lienCalendly("accueil_haut"));
    await page.click(`[data-ouvrir="${ID}"]`); await page.waitForSelector("#fiche-chrono", { timeout: 8000 }); await attendre(page, 800);
    const chrono = await page.$$eval("#fiche-chrono ol.dc-chrono li span", l => l.map(x => x.textContent)).then(l => l.map(norm)).catch(() => []);
    const clics = chrono.filter(x => x.startsWith("Clic « Réserver mon bilan »")), att = CLICS.map(([, lib]) => "Clic « Réserver mon bilan »" + (lib ? " (" + lib + ")" : ""));
    ok("chronologie : les anciens clics gardent leurs anciens libellés (« (en haut de sa Découverte) », « (bloc accompagnement) », « (page de proposition du bilan) », « (page verrouillée « programme ») »)",
      JSON.stringify(clics.slice(12)) === JSON.stringify(att.slice(12)), JSON.stringify(clics.slice(12)));
    ok("chronologie : les 10 nouveaux codes avec le nom de leur écran (« (page « Ton plan d'action » (après les 3 questions)) », « (accueil, bouton du haut) »… « (page verrouillée Mon bilan) ») ; un code réservé (__proto__) ou piégé : « Clic « Réserver mon bilan » » sans libellé, en texte brut, aucune injection",
      JSON.stringify(clics.slice(0, 12)) === JSON.stringify(att.slice(0, 12)) && !(await page.evaluate(() => window.__xss)) && !(await page.$("#vue img[src='x']")), JSON.stringify(clics.slice(0, 12)));
    const fd = await lignes(page, "#fiche-decouverte"), val = x => (fd.find(l => l[0] === x) || [])[1] || "";
    ok("les autres libellés du coach ne changent pas : « Bouton « Réserver mon bilan » : 16 clics, le dernier le … », « Case « J'ai réservé mon bilan » : pas cochée », pastille « a cliqué Réserver »",
      /^16 clics, le dernier le \S.*$/.test(val("Bouton « Réserver mon bilan »")) && val("Case « J'ai réservé mon bilan »") === "pas cochée" && (await texte(page, "#fiche-decouverte .seance-c-tete")).includes("a cliqué Réserver"),
      JSON.stringify(fd) + " · " + (await texte(page, "#fiche-decouverte .seance-c-tete")));
    const LIEN = CAL + "?utm_source=app&utm_medium=coach&utm_content=fiche_coach&name=" + enc("Léa Martin") + "&first_name=" + enc("Léa") + "&last_name=Martin&email=" + enc("p40@exemple.fr");
    const lien = await page.$eval("#dc-lien", e => e.value).catch(() => null);
    ok("fiche, « Contacter » : son lien de réservation exact (nouvelle adresse, utm_source=app, utm_medium=coach, utm_content=fiche_coach, prénom, nom, email)", lien === LIEN, lien);
    const mail = await page.$eval("#dc-mail", a => a.getAttribute("href")).catch(() => ""), corps = (() => { try { return decodeURIComponent(mail.split("&body=")[1] || ""); } catch (e) { return ""; } })();
    ok("message préparé : « Je te propose un bilan de 15 minutes pour faire le point sur ton objectif et voir comment je peux t'aider : » suivi de ce lien ; aucune durée à 30 min",
      mail.startsWith("mailto:p40%40exemple.fr?") && corps.includes("Je te propose un bilan de 15 minutes pour faire le point sur ton objectif et voir comment je peux t'aider :\n" + LIEN + "\n") && !TRENTE.test(corps) && !/30 min/.test(corps), corps);
    const fiche = await page.evaluate(() => [lienCalendly("verrou_programme"), lienCalendly("apres_questionnaire")]);
    ok("coach : lienCalendly rend l'adresse seule, sans paramètres (sa page Mes clients, et dans la fiche du prospect) ; le coach n'écrit rien",
      coachSeul === CAL && fiche.every(x => x === CAL) && saisies(db).length === 0, JSON.stringify([coachSeul, fiche]) + " · " + resume(db));
  });

  /* =================== L. client Thomas : rien du lot 2 =================== */
  await bloc("L. client Thomas", async () => {
    for (const en of [false, true]) {
      const db = base(), pr = db.donnees.find(d => d.user_id === F.IDS.c1 && d.outil === "prefs");   // sa langue est rangée en base (prefs) : elle l'emporte
      if (en) { if (pr) pr.contenu = Object.assign({}, pr.contenu, { langue: "en" }); else db.donnees.push({ user_id: F.IDS.c1, outil: "prefs", contenu: { langue: "en" }, maj_le: avant(J) }); }
      const { page } = await contexte(b, THOMAS, db, en ? { langue: "en", theme: "light" } : {});
      await page.goto(URL0); await pret(page, "#acc-vue");
      const vus = [];
      for (const h of ["#/accueil", "#/programme", "#/journal", "#/nutrition", "#/suivi", "#/decouverte/bilan"]) {
        await aller(page, h, 1500);
        const x = await page.evaluate(() => ({ t: (document.querySelector("#vue") || {}).innerText || "", verrou: !!document.querySelector("#vue .verrou, #vue .echantillon"), dc: !!document.querySelector("#vue [data-dc-cal], #vue #dc-bilan, #vue #dc-accomp"), cal: document.querySelectorAll("a[href*='calendly']").length, hash: location.hash }));
        const t = norm(x.t);
        vus.push({ h, hash: x.hash, verrou: x.verrou, dc: x.dc, cal: x.cal, nouveaux: (en ? NOUVEAUX_EN : NOUVEAUX).concat(NOUVEAUX).filter(s => t.includes(norm(s))).concat(NOUVEAUX_RE.test(t) ? [t.match(NOUVEAUX_RE)[0]] : []), programme: t.includes("Bloc 1 — 4 semaines") });
      }
      const lien = await page.evaluate(() => lienCalendly("accueil_haut"));
      ok(`client Thomas${en ? " (anglais)" : ""} : accueil, programme, journal, nutrition, suivi (et #/decouverte/bilan → son accueil) : aucun des nouveaux textes, aucun verrou ni exemple, aucun lien Calendly, rien de la Découverte ; son programme est là ; lienCalendly sans paramètres ; aucune écriture`,
        vus.every(v => !v.verrou && !v.dc && !v.cal && !v.nouveaux.length) && vus[1].programme && vus[5].hash === "#/accueil" && lien === CAL && saisies(db).length === 0,
        JSON.stringify(vus.filter(v => v.verrou || v.dc || v.cal || v.nouveaux.length).concat([{ programme: vus[1] && vus[1].programme, fin: vus[5] && vus[5].hash, lien }])) + " · " + resume(db));
    }
  });

  /* =================== Z. rien vers l'extérieur =================== */
  await bloc("Z. hôtes externes", async () => {
    const autres = Array.from(externes).filter(h => !/^fonts\.(googleapis|gstatic)\.com$/.test(h));
    ok("aucune requête vers un autre hôte que la page, le faux Supabase, le faux Calendly (nouvelle adresse seulement) et les polices (bloquées)",
      autres.length === 0 && CAL_RECUS.every(u => u.startsWith(CAL + "?")), JSON.stringify(autres) + " · " + JSON.stringify(CAL_RECUS.filter(u => !u.startsWith(CAL + "?"))));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
