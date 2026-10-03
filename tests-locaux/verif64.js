/* verif64 — v59, lot C : « À traiter » complet côté coach, plus deux remarques de la relecture v53 (export CSV,
   analyse qui plante). Vérifié de bout en bout dans un vrai navigateur, avec le coach et le compte de test (client, lu dans
   CONFIG.nouveautes.comptes_test du fichier servi : un identifiant, jamais un email) :
   A. la définition (Commercial.analyse, Commercial.bilan) : les 3 motifs rétablis — « Absent » tant que le coach ne l'a pas
      relancé depuis l'appel (sans limite de durée), « Perdu » depuis 30 jours ou plus sans relance depuis l'appel, bilan
      coché depuis plus de 7 jours sans issue (« l'appel a-t-il eu lieu ? ») —, toujours prospect ; ce qui les fait sortir
      (relance après l'issue ; Signé, Perdu ou Absent pour le bilan à conclure) ; une relance faite AVANT l'appel ne fait
      plus « attendre » ; la coche et la case d'avant l'issue ne comptent plus ; coche après l'issue (Absent ou Perdu) : de
      nouveau en cours, sans limite de durée (retirée : de nouveau Absent / Perdu) ; une issue sans date lisible : pas de
      « nouveau créneau » ; la case du prospect cochée APRÈS la dernière décision du coach compte de nouveau (pas une case
      datée dans le futur) ; l'ordre : signé, case, absent, clic, nouveau, appel, perdu, puis tout ce qui n'est pas à traiter
      (un « Signé » oublié le dernier, même coché avant l'appel) ; le texte d'aide ; v59 (relecture) : Nouveautés et
      l'info-bulle « bilan réservé » (Decouverte.pastilleCoach, appelée directement ; v71 (D) : Mes clients ne l'affiche
      plus) suivent la case à vérifier de l'analyse ; un Absent dont la case d'après l'appel reste à
      vérifier au-delà de 14 jours : « Retirer « Bilan réservé » » dans la fiche ;
   B. page Prospects : les 3 motifs dans « À traiter » (ordre, tuile, filtre, en-tête, cartes avec le motif et la prochaine
      action, aide), les autres issues hors de la liste ; « J'ai relancé » (Absent, Perdu) et « Perdu » (bilan à conclure) :
      chacun sort de la liste, une seule écriture de suivi_prospect chacun (PATCH conditionnel, contenu exact) ;
   C. tableau de bord : « À traiter maintenant » (5 lignes au plus) dans l'ordre 😞 (compte de test), signé, case, absent,
      clic, nouveau, urgence d'un client (Julien), bilan à conclure, « Perdu » à relancer ; badge de la tuile Prospects =
      la liste de la page Prospects (même définition) ; « Ouvrir » sur un bilan à conclure : sa fiche, Signé / Perdu / Absent ;
   D. fiche d'un Absent qui reprend un créneau : « Bilan réservé (nouveau créneau) » en un clic, sans fenêtre, une écriture
      EXACTE (issue et historique gardés), de nouveau en cours (« Prépare le bilan ») ; la tuile des Absents le garde ;
      « Retirer » le remet Absent ; un Signé n'a pas ce bouton ; un Perdu : le même bouton, la même écriture exacte ;
   E. la case « J'ai réservé » cochée par le prospect après le retrait du coach : à vérifier (À traiter, Nouveautés, filtre,
      compteur, fiche) ; une case d'avant le retrait reste une info ; « Retirer » de nouveau la fait tomber ; v59 (relecture) :
      un Absent dont la case d'après l'appel est restée à vérifier (16 jours) : « Retirer » dans la fiche, une écriture
      exacte, le « à vérifier » tombe, l'Absent reste ;
   F. export CSV (prospects et newsletter) : une cellule qui commence par des espaces puis = + - @ est neutralisée
      (apostrophe) ; espaces seuls, nombres et dates inchangés ;
   G. une analyse qui lève une erreur ne fait plus disparaître le prospect : carte « données illisibles » (seul bouton :
      « Ouvrir la fiche »), en-tête, filtres, CSV et tableau de bord le comptent, sans urgence, au rang le plus bas (10) ;
   H. la coche ou la case d'avant l'appel, et la case à vérifier après l'appel : la ligne « Bilan » de la carte, l'info-bulle
      « bilan réservé », les colonnes « Bilan réservé » du CSV et le bloc « Découverte » de la fiche suivent l'analyse (plus
      « réservé le … » ni « à vérifier » contraires au motif) ; sans issue : inchangés ; v59 (relecture) : de même
      Nouveautés et le badge de l'onglet Prospects ; v71 (D) : Mes clients ne liste plus les prospects (« Les prospects sont
      dans Prospects → (N comptes gratuits). », lien), le fait « Bilan » de leur carte Prospects tient lieu de l'info-bulle
      de leur ligne ;
   Z. aucun appel vers l'extérieur.
   Infrastructure (serveur, faux Supabase, personnes, décor) reprise de verif58 : rien ne part vers la vraie base (routage
   par NOM D'HÔTE) ; règles de la base reproduites ; chaque écriture appliquée en mémoire et notée, avec sa condition maj_le.
   La page et ses fichiers sont servis tels quels (aucune retouche : la suite ne dépend d'aucun interrupteur). Dates
   relatives au lancement ; v59 (relecture) : l'horloge de chaque navigateur part de midi (heure locale) du jour du
   lancement (T0) et tourne : aucun minuit n'est franchi pendant la suite, quelle que soit l'heure réelle (les « depuis N j »
   restent ceux du décor). Chaque bloc tourne à part (« ✗ BLOC INTERROMPU ») ;
   code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif64.js ../index.html
           VERIF64_PORT=9801 node verif64.js ../index.html     (autre port, si 9800 est pris)
           VERIF64_BLOCS="A.,D." node verif64.js …              (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF64_PORT || 9800;
const BLOCS = (process.env.VERIF64_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const ORDI = { width: 1280, height: 900 };

/* ---------- la page servie : le fichier testé et ses fichiers css/ et js/, sans retouche ---------- */
const { servirFichier, source } = require("./fichiers");
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML)) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(fs.readFileSync(HTML, "utf8"));
});

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

/* ---------- dates : toujours relatives au lancement ----------
   v59 (relecture) : T0 = midi (heure locale) du jour du lancement, et l'horloge de chaque navigateur part de T0 (contexte) :
   une suite lancée à 23:59 ne voit plus ses « depuis N j » prendre un jour de plus en route */
const T0 = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d.getTime(); })(), MIN = 60000, H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const norm = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "donnees", f), "utf8"));   // lecture seule
const CATALOGUE = Object.assign({}, F.catalogue, { aliments: lireDonnees("aliments.json"), recettes: lireDonnees("recettes.json") });

/* ---------- les personnes ---------- */
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: meta } : {}) });
const qui = (id, email, meta) => ({ id, email, session: session(id, email, meta) });
const COACH = qui(F.IDS.coach, "coach@exemple.fr");
const PID = k => "00000000-0000-4000-8000-0000000064" + String(k).padStart(2, "0");   // verif64 : …64kk (une plage par suite)

/* ---------- le décor : fixtures.js (coach, Thomas, Sarah, Julien, tous « client ») + les comptes du bloc ----------
   comptes : [{ id, prenom, nom, statut ("prospect" par défaut), cree (instant ISO), email, donnees: [[outil, contenu, maj_le]] }]
   cles : [[user_id, outil, contenu, maj_le]] ajoutées à un compte existant */
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  const donnees = clone(F.donnees);
  donnees.forEach(d => { if (d.user_id === F.IDS.c3) d.maj_le = avant(12 * J + 3 * H); });   // Julien : 12 j entiers pendant toute la suite
  const db = { profils, donnees, emails_prospects: [], ecritures: [], refus: [], lectures: [], journal: [], chemins: [],
    fonctions: [], emails: {}, lectureKo: [], retard: {}, reponseFonction: { status: 200, body: { ok: true } }, conditions: [] };
  for (const x of opts.comptes || []) {
    profils.push({ id: x.id, prenom: x.prenom, nom: x.nom || "", role: "client", statut: x.statut || "prospect", cree_le: x.cree || avant(J) });
    if (x.email) db.emails[x.id] = x.email;
    for (const [outil, contenu, maj] of x.donnees || []) donnees.push({ user_id: x.id, outil, contenu: clone(contenu), maj_le: maj || avant(H) });
  }
  for (const [uid, outil, contenu, maj] of opts.cles || []) donnees.push({ user_id: uid, outil, contenu: clone(contenu), maj_le: maj || avant(J) });
  return db;
}

/* ---------- le faux Supabase (repris de verif58) ---------- */
const MAX_LIGNES = 1000;
/* règles de la base (HANDOFF §2.3, policies v49) */
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
  if (p.startsWith("/auth/v1/token")) {   // renouvellement : jamais compté comme écriture
    const c = corps() || {}, r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || ""));
    const id = (r1 && r1[1]) || (who && who.id);
    if (!id) return json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
    return json(who && id === who.id ? who.session : session(id, db.emails[id] || ""));
  }
  /* v56 : la connexion notée par la base (noter_connexion) n'est pas une écriture de l'app dans les données (verif61) */
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  if (!["GET", "HEAD"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m, corps: corps() });
  if (p.startsWith("/auth/v1/logout")) { db.journal.push("LOGOUT"); return json({}); }
  if (p.startsWith("/auth/v1/user")) return moi ? json({ id: moi, email: db.emails[moi] || (who && who.id === moi ? who.email : ""), role: "authenticated" }) : json({ msg: "invalid JWT" }, 401);
  if (p.startsWith("/auth/v1/")) return json({});
  if (p.startsWith("/functions/v1/")) { db.fonctions.push({ nom: p.slice(14), m }); const rf = db.reponseFonction; return json(rf.body, rf.status); }
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/emails_prospects") return json(coach ? colonnes(plage(db.emails_prospects.slice()), q) : []);
  /* --- profils : chacun le sien, le coach tous ; rôle et statut changés par le coach seul --- */
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
        db.ecritures.push(Object.assign({ table: "donnees", m }, clone(ligne))); db.journal.push("E " + row.outil);
        out.push(ligne);
      }
      return (req.headers()["prefer"] || "").includes("return=representation") ? json(out, 201) : json(null, 201);
    }
    if (m === "PATCH") {   // écriture conditionnelle (CleCoach) : maj_le=eq.<valeur lue> ou is.null
      const c = corps() || {};
      db.conditions.push({ uid, outil: cleEq, maj_le: mj });
      const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj == null || (mj === "is.null" ? !x.maj_le : (mj.startsWith("eq.") && x.maj_le === mj.slice(3)))));
      if (!row) return json([]);   // la ligne a bougé : 0 ligne (conflit)
      if (!permis(moi, coach, row)) { db.refus.push({ table: "donnees", m, user_id: uid, outil: cleEq }); return json([]); }
      Object.assign(row, { contenu: clone(c.contenu), maj_le: c.maj_le || new Date().toISOString() });
      db.ecritures.push(Object.assign({ table: "donnees", m }, clone(row))); db.journal.push("E " + cleEq);
      return json([row]);
    }
    db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq });   // DELETE : jamais attendu (zéro perte), noté
    return json(null, 204);
  }
  if (p === "/rest/v1/bibliotheque") return m === "GET" ? json(coach ? colonnes(plage(clone(F.bibliotheque)), q) : []) : json(null, 204);
  const t = p.replace("/rest/v1/", "");
  if (CATALOGUE[t]) return m === "GET" ? json(colonnes(plage(CATALOGUE[t]), q)) : json(null, 201);
  return json([]);
}

/* ---------- un navigateur (contexte) pour une personne ---------- */
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || ORDI });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, who, db));
  await c.addInitScript(({ s }) => {
    if (!/^https?:$/.test(location.protocol)) return;
    window.__toasts = [];
    try { new MutationObserver(ms => ms.forEach(mu => mu.addedNodes.forEach(n => { if (n.nodeType === 1 && n.classList && n.classList.contains("toast")) window.__toasts.push(n.textContent); }))).observe(document, { childList: true, subtree: true }); } catch (e) { }
    if (!localStorage.getItem("__init")) {
      localStorage.setItem("__init", "1");
      if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
      localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
    }
  }, { s: who ? who.session : null });
  await c.clock.install({ time: T0 });   // v59 (relecture) : midi du jour du lancement, puis l'horloge tourne (comme verif58, 61, 62, 63)
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return { c, page };
}

/* ---------- aides ---------- */
const attendre = (page, ms) => page.waitForTimeout(ms);
async function pret(page, sel){
  await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 });
  if (sel) await page.waitForSelector(sel, { timeout: 10000 });
  await attendre(page, 400);
}
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1500); };
const texte = async (page, sel) => norm(await page.textContent(sel || "#vue").catch(() => ""));
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.table === "donnees" && e.outil === outil && (!uid || e.user_id === uid));
const resume = db => JSON.stringify(db.ecritures.map(e => (e.table === "donnees" ? e.outil : e.table) + ":" + e.m));
const contenu = (db, outil, uid) => (db.donnees.find(x => x.user_id === uid && x.outil === outil) || {}).contenu;
const majLe = (db, outil, uid) => (db.donnees.find(x => x.user_id === uid && x.outil === outil) || {}).maj_le;
const egal = (x, y) => JSON.stringify(x) === JSON.stringify(y);
const SUIVI = (db, uid) => contenu(db, "suivi_prospect", uid);
const ecrSuivi = (db, uid) => ecr(db, "suivi_prospect", uid);
const conds = (db, uid) => db.conditions.filter(x => x.uid === uid && x.outil === "suivi_prospect").map(x => x.maj_le);

/* ---------- le décor ---------- */
const SRC = source(HTML);
/* le compte de test est lu dans le fichier servi (CONFIG.nouveautes.comptes_test : un identifiant, jamais un email) */
const TEST_ID = (/comptes_test:\s*\[\s*"([0-9a-f-]{36})"/.exec(SRC) || [])[1] || null;
const TESTEUR = qui(TEST_ID || PID(90), "test@exemple.fr");
const INTAKE_THOMAS = clone(F.donnees.find(d => d.user_id === F.IDS.c1 && d.outil === "intake").contenu);
const PROG_THOMAS = clone(F.donnees.find(d => d.user_id === F.IDS.c1 && d.outil === "programme").contenu);
const pad = n => String(n).padStart(2, "0");
const isoL = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const ilYA = n => { const d = new Date(T0); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return isoL(d); };
const LUNDI = (() => { const d = new Date(T0); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; })();
const jourSem = k => { const d = new Date(LUNDI); d.setDate(LUNDI.getDate() + k); return isoL(d); };
const LUNDI_P = jourSem(-7), DIM_P = jourSem(-1);
const aHeure = (jour, h, m) => new Date(jour + "T" + pad(h) + ":" + pad(m || 0) + ":00").toISOString();   // heure locale
const MIDI = n => aHeure(ilYA(n), 12);   // midi (heure locale) il y a n jours : les seuils en jours ne dépendent pas de l'heure du lancement
const frL = v => { const d = new Date(v); return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear(); };   // dateFr d'un instant (date locale)

/* le compte de test (client, sans prénom ni nom comme le vrai) : feedback du dimanche de la semaine passée, la réponse du
   coach, puis un 😞 du client sur cette réponse (non traité) : l'urgence la plus haute du tableau de bord */
const ENV_T = aHeure(DIM_P, 18), ECRIT_T = aHeure(DIM_P, 20), AVIS_T = aHeure(DIM_P, 21);
const ckTest = () => ({ liste: [{ semaine: LUNDI_P, fin: DIM_P, envoye_le: DIM_P, envoye_a: ENV_T, format: "dimanche", reponses: { note: 7, training: "Trois séances", alimentation: "", autre: "" } }],
  avis: [{ semaine: LUNDI_P, fb: ECRIT_T, smiley: "triste", le: AVIS_T, deplu: "Trop court", ameliorer: "Plus de détails" }] });
const fbTest = () => ({ liste: [{ semaine: LUNDI_P, fin: DIM_P, date: DIM_P, texte: "Belle semaine, continue.", ecrit_a: ECRIT_T, bilan: ENV_T }] });
const compteTest = () => ({ id: TESTEUR.id, prenom: "", nom: "", statut: "client", cree: avant(40 * J), email: "test@exemple.fr",
  donnees: [["intake", INTAKE_THOMAS], ["programme", PROG_THOMAS], ["prefs", { langue: "fr" }], ["checkins", ckTest()], ["feedbacks", fbTest()]] });

/* un prospect : k (plage …64kk), cree / q (questionnaire validé) / clics / caseP / newsLe en ms avant le lancement */
function prospect(k, prenom, nom, o){
  const d = [];
  if (o.rep || o.q != null) d.push(["intake", Object.assign({}, o.rep || {}, o.q != null ? { court_debut: avant(o.q + 10 * MIN), court_le: avant(o.q) } : {}, o.email != null ? { email_compte: o.email } : {}), avant(o.q != null ? o.q : H)]);
  if ((o.clics && o.clics.length) || o.caseP != null){
    const C = { version: 1, jours: {}, cta: { clics: (o.clics || []).map(t => ({ jour: 1, source: "decouverte", date: avant(t) })) } };
    if (o.caseP != null) C.reserve = avant(o.caseP);
    d.push(["challenge", C, avant(Math.min.apply(null, (o.clics || []).concat(o.caseP != null ? [o.caseP] : [])))]);
  }
  if (o.news != null) d.push(["emails", { newsletter: o.news, maj: avant(o.newsLe || o.cree), version: "2026-09-28c", source: "inscription" }, avant(o.newsLe || o.cree)]);
  if (o.act) d.push(["activite", o.act, avant(H)]);
  if (o.suivi) d.push(["suivi_prospect", o.suivi, o.suiviLe || avant(H)]);
  return { id: PID(k), prenom, nom: nom || "", statut: o.statut || "prospect", cree: avant(o.cree), email: o.email, donnees: d };
}
const REP = { probleme: "Perdre du gras", obstacle: "Le manque de temps", projection: "Courir 5 km" };
const ev = (type, valeur, le, note) => Object.assign({ type }, valeur != null ? { valeur } : {}, { le }, note != null ? { note } : {});
const ALICE = PID(1), MARC = PID(2), BRUNO = PID(3), VICTOR = PID(4), OMAR = PID(5), HUGO = PID(6), PAUL = PID(7), ZOE = PID(8), INES = PID(9), LEA = PID(10), NADIA = PID(11), ROSE = PID(12), SARA = PID(13), TINA = PID(14), YANN = PID(15);
const P = {
  /* Absente il y a 2 jours ; « Bilan réservé » coché AVANT l'appel (il y a 5 jours) ; jamais relancée */
  alice: () => prospect(1, "Alice", "Absente", { cree: 9 * J, q: 9 * J, rep: REP, email: "alice@exemple.fr",
    suivi: { version: 1, bilan_le: MIDI(5), issue: "absent", issue_le: MIDI(2), note: "", historique: [ev("bilan", "reserve", MIDI(5)), ev("issue", "absent", MIDI(2), "")] }, suiviLe: MIDI(2) }),
  /* inscrit il y a 10 h, rien d'autre */
  marc: () => prospect(2, "Marc", "Neuf", { cree: 10 * H }),
  /* bilan coché il y a 9 jours, aucune issue */
  bruno: () => prospect(3, "Bruno", "Coché", { cree: 15 * J, q: 15 * J, rep: REP, email: "bruno@exemple.fr",
    suivi: { version: 1, bilan_le: MIDI(9), historique: [ev("bilan", "reserve", MIDI(9))] }, suiviLe: MIDI(9) }),
  /* « Perdu » il y a 31 jours, jamais relancé */
  victor: () => prospect(4, "Victor", "Perdu", { cree: 40 * J, q: 39 * J, rep: REP, email: "victor@exemple.fr",
    suivi: { version: 1, issue: "perdu", issue_le: MIDI(31), note: "timing", historique: [ev("issue", "perdu", MIDI(31), "timing")] }, suiviLe: MIDI(31) }),
  /* « Perdu » il y a 5 jours : relance prévue dans 25 jours, pas à traiter */
  omar: () => prospect(5, "Omar", "Récent", { cree: 20 * J, q: 19 * J, rep: REP, email: "omar@exemple.fr",
    suivi: { version: 1, issue: "perdu", issue_le: MIDI(5), note: "", historique: [ev("issue", "perdu", MIDI(5), "")] }, suiviLe: MIDI(5) }),
  /* bilan coché hier : « Prépare le bilan », pas à traiter */
  hugo: () => prospect(6, "Hugo", "Réservé", { cree: 8 * J, q: 8 * J, rep: REP, email: "hugo@exemple.fr",
    suivi: { version: 1, bilan_le: MIDI(1), historique: [ev("bilan", "reserve", MIDI(1))] }, suiviLe: MIDI(1) }),
  /* Absent il y a 3 jours, relancé hier (après l'appel) : pas à traiter */
  paul: () => prospect(7, "Paul", "Relancé", { cree: 12 * J, q: 12 * J, rep: REP, email: "paul@exemple.fr",
    suivi: { version: 1, issue: "absent", issue_le: MIDI(3), note: "", relances: [MIDI(1)], historique: [ev("issue", "absent", MIDI(3), ""), ev("relance", null, MIDI(1))] }, suiviLe: MIDI(1) }),
  /* « Signé » il y a 2 jours, toujours prospect */
  zoe: () => prospect(8, "Zoé", "Signée", { cree: 6 * J, q: 6 * J, rep: REP, email: "zoe@exemple.fr",
    suivi: { version: 1, issue: "signe", issue_le: avant(2 * J), note: "", historique: [ev("issue", "signe", avant(2 * J), "")] }, suiviLe: avant(2 * J) }),
  /* case « J'ai réservé » cochée il y a 2 jours, le coach n'a rien décidé */
  ines: () => prospect(9, "Inès", "Case", { cree: 5 * J, q: 5 * J, rep: REP, email: "ines@exemple.fr", clics: [2 * J + H], caseP: 2 * J }),
  /* a cliqué « Réserver mon bilan » hier */
  lea: () => prospect(10, "Léa", "Clic", { cree: 3 * J, q: 3 * J, rep: REP, email: "lea@exemple.fr", clics: [J],
    act: { version: 1, jours: [ilYA(0), ilYA(1)], pages: { formation: 2 }, temps_s: 600, derniere: avant(5 * H) } }),
  /* v59 point C : bilan coché il y a 10 jours puis retiré il y a 5 jours ; la case « J'ai réservé » cochée il y a 2 jours
     (APRÈS le retrait) compte de nouveau ; Rose l'a cochée il y a 6 jours (AVANT le retrait) : une info seulement.
     Première coche du prospect, après la décision (la case ne se coche qu'une fois : l'app ne peut pas la « recocher ») */
  nadia: () => prospect(11, "Nadia", "Recoche", { cree: 20 * J, q: 20 * J, rep: REP, email: "nadia@exemple.fr", caseP: 2 * J,
    suivi: { version: 1, bilan_le: null, historique: [ev("bilan", "reserve", MIDI(10)), ev("bilan", "annule", MIDI(5))] }, suiviLe: MIDI(5) }),
  rose: () => prospect(12, "Rose", "Avant", { cree: 20 * J, q: 20 * J, rep: REP, email: "rose@exemple.fr", caseP: 6 * J,
    suivi: { version: 1, bilan_le: null, historique: [ev("bilan", "reserve", MIDI(10)), ev("bilan", "annule", MIDI(5))] }, suiviLe: MIDI(5) }),
  /* bloc H : « Bilan réservé » coché il y a 8 jours, Absente il y a 5 jours, puis sa case « J'ai réservé » cochée il y a 20 h
     (après l'appel : à vérifier ; sa première coche, après la décision) ; Tina : case cochée il y a 6 jours, Absente il y a 4 jours, puis un clic il y a 20 h */
  sara: () => prospect(13, "Sara", "Recase", { cree: 20 * J, q: 20 * J, rep: REP, email: "sara@exemple.fr", caseP: 20 * H,
    suivi: { version: 1, bilan_le: MIDI(8), issue: "absent", issue_le: MIDI(5), note: "", historique: [ev("bilan", "reserve", MIDI(8)), ev("issue", "absent", MIDI(5), "")] }, suiviLe: MIDI(5) }),
  tina: () => prospect(14, "Tina", "Reclic", { cree: 20 * J, q: 20 * J, rep: REP, email: "tina@exemple.fr", caseP: 6 * J, clics: [20 * H],
    suivi: { version: 1, issue: "absent", issue_le: MIDI(4), note: "", historique: [ev("issue", "absent", MIDI(4), "")] }, suiviLe: MIDI(4) }),
  /* v59 (relecture) : Absent il y a 20 jours, puis sa case « J'ai réservé » cochée il y a 16 jours (sa première coche, après
     l'appel ; au-delà de retour_jours : l'issue reste) : à vérifier, « Retirer « Bilan réservé » » dans la fiche */
  yann: () => prospect(15, "Yann", "Vieux", { cree: 30 * J, q: 30 * J, rep: REP, email: "yann@exemple.fr", caseP: 16 * J,
    suivi: { version: 1, issue: "absent", issue_le: MIDI(20), note: "", historique: [ev("issue", "absent", MIDI(20), "")] }, suiviLe: MIDI(20) })
};
const NOM = { [ALICE]: "Alice", [MARC]: "Marc", [BRUNO]: "Bruno", [VICTOR]: "Victor", [OMAR]: "Omar", [HUGO]: "Hugo", [PAUL]: "Paul", [ZOE]: "Zoé", [INES]: "Inès", [LEA]: "Léa", [NADIA]: "Nadia", [ROSE]: "Rose", [SARA]: "Sara", [TINA]: "Tina", [YANN]: "Yann" };
const noms = l => (l || []).map(u => NOM[u] || (u === TESTEUR.id ? "compte de test" : u === F.IDS.c3 ? "Julien" : String(u).slice(-4))).join(", ");
/* le décor : fixtures (Thomas, Sarah, Julien) + compte de test (opts.test !== false) + les prospects du bloc ; opts.sans : comptes retirés */
function decor(opts){
  opts = opts || {};
  const db = base({ comptes: (opts.test === false ? [] : [compteTest()]).concat(opts.comptes || []), cles: opts.cles || [] });
  if (opts.sans) { db.profils = db.profils.filter(p => opts.sans.indexOf(p.id) === -1); db.donnees = db.donnees.filter(d => opts.sans.indexOf(d.user_id) === -1); }
  return db;
}
let URL0 = "";   // l'adresse de la page servie (posée au lancement)

/* ---------- aides d'écran ---------- */
async function coachSur(b, db, hash, sel, opts){
  const x = await contexte(b, COACH, db, opts);
  await x.page.goto(URL0 + (hash || "")); await pret(x.page, sel || "#vue");
  return x;
}
const uids = page => page.$$eval("#pr-liste .sc-carte", l => l.map(e => e.dataset.uid)).catch(() => []);
const carte = (page, uid) => page.$eval(`#pr-liste .sc-carte[data-uid="${uid}"]`, e => e.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim()).catch(() => "");
const motifCarte = (page, uid) => page.$eval(`#pr-liste .sc-carte[data-uid="${uid}"] .sc-motif`, e => e.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim()).catch(() => "");
const titreBilan = (page, uid) => page.$$eval(`#pr-liste .sc-carte[data-uid="${uid}"] .sc-tete .pastille.ok`, l => { const e = l.find(x => x.textContent.trim() === "bilan réservé"); return e ? e.getAttribute("title") : null; }).catch(() => null);
/* v71 (D) : les faits d'une carte Prospects ({ libellé : valeur }, .sc-faits, comme verif61) — là où se lisait, jusqu'à la v70,
   l'info-bulle « bilan réservé » de la ligne d'un prospect dans Mes clients (Decouverte.pastilleCoach : plus de ligne) */
const faits = (page, uid) => page.$eval(`#pr-liste .sc-carte[data-uid="${uid}"]`, e => { const o = {}; e.querySelectorAll(".sc-faits li").forEach(li => { const n = x => ((x || {}).textContent || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim(); o[n(li.querySelector("span"))] = n(li.querySelector("b")); }); return o; }).catch(() => ({}));
/* v71 (D) : la ligne sous le titre de Mes clients, « Les prospects sont dans Prospects → (N compte(s) gratuit(s)). » : { t, href } */
const ligneProspects = async page => { const r = await page.$eval("#clients-prospects", e => { const a = e.querySelector("a.link-a"); return { t: e.textContent, href: a ? a.getAttribute("href") : "" }; }).catch(() => null); return r ? { t: norm(r.t), href: r.href } : { t: "", href: "" }; };
const boutonsCarte = (page, uid) => page.$$eval(`#pr-liste .sc-carte[data-uid="${uid}"] [data-sc]`, l => l.map(e => e.dataset.sc)).catch(() => []);
const boutonsFiche = page => page.$$eval("#fiche-commercial [data-sc]", l => l.map(e => e.dataset.sc + "=" + e.textContent.trim())).catch(() => []);
const filtre = async (page, f) => { await page.click(`[data-filtre="${f}"]`); await attendre(page, 400); };
const compteFiltres = page => page.$$eval("[data-filtre]", l => Object.fromEntries(l.map(e => [e.dataset.filtre, (e.querySelector(".meta") || {}).textContent]))).catch(() => ({}));
const tuilePr = (page, lbl) => page.$$eval("#pr-vue .tile", (l, k) => { const e = l.find(x => (x.querySelector(".t-lbl") || {}).textContent === k); return e ? e.querySelector(".t-val").textContent.trim() : ""; }, lbl).catch(() => "");
const choisir = async (page, sel, v) => { await page.selectOption(sel, v); await attendre(page, 400); };
const bouton = async (page, txt) => { await page.click(`.modale button:has-text("${txt}")`); };
/* un clic sur un élément s'il existe (sinon la vérification qui suit échoue, sans interrompre le bloc) */
const cliquer = async (page, sel) => { const el = await page.$(sel); if (!el) return false; await el.click(); return true; };
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
async function ficheDe(page, uid, nom, sel){
  /* même adresse #/accueil d'une fiche à l'autre : on en sort d'abord (sinon aucun changement d'adresse, la fiche ne change pas) */
  if ((await page.evaluate(() => location.hash)) !== "#/clients"){ await page.evaluate(() => { location.hash = "#/clients"; }); await page.waitForSelector("#tb-clients [data-ouvrir]", { timeout: 10000 }); await attendre(page, 300); }
  await page.evaluate(([id, n]) => Clients.ouvrir(id, n, "accueil"), [uid, nom]);
  await page.waitForSelector(sel || "#fiche-reponses", { timeout: 10000 }); await attendre(page, 600);
}
const tuileTb = (page, id) => page.$eval("#" + id, e => ({ href: e.getAttribute("href"), val: ((e.querySelector(".t-val") || {}).textContent || "").trim(), badge: ((e.querySelector(".tb-badge") || {}).textContent || "").trim(), cls: (e.querySelector(".tb-badge") || {}).className || "", titre: e.getAttribute("title") || "" })).catch(() => null);
const aTraiterTb = page => page.$$eval("#tb-a-traiter .tb-liste li", l => l.map(li => ({ t: li.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim(), uid: li.querySelector("[data-fiche]") ? li.querySelector("[data-fiche]").dataset.fiche : "", cible: li.querySelector("[data-fiche]") ? li.querySelector("[data-fiche]").dataset.cible : "" }))).catch(() => []);
const toasts = page => page.evaluate(() => (window.__toasts || []).slice()).catch(() => []);
/* une ligne « libellé : valeur » d'un bloc de la fiche (ul.fiche-l) */
const valeurFiche = (page, sel, k) => page.$$eval(sel + " ul.fiche-l > li", (l, k) => { const li = l.find(x => x.querySelector("span") && x.querySelector("span").textContent.replace(/\s+/g, " ").trim() === k); return li && li.querySelector("b") ? li.querySelector("b").textContent.replace(/\s+/g, " ").trim() : ""; }, k).catch(() => "");

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF64_PORT=9801 node verif64.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();
  URL0 = `http://localhost:${PORT}/`;

  /* =================== A. la définition (Commercial.analyse, Commercial.bilan) =================== */
  await bloc("A. définition des motifs", async () => {
    ok("A : le compte de test est lu dans le fichier servi (CONFIG.nouveautes.comptes_test)", !!TEST_ID, String(TEST_ID));
    const db = decor({ test: false });
    const { page } = await coachSur(b, db, "#/prospects", "#pr-vue");
    const r = await page.evaluate(() => {
      const H = h => new Date(Date.now() - h * 3600000).toISOString();
      const M = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d.toISOString(); };   // midi il y a n jours (date locale)
      const p = n => ({ statut: "prospect", cree_le: M(n) }), ph = h => ({ statut: "prospect", cree_le: H(h) });
      const Q = n => ({ court_le: M(n), probleme: "Perdre du gras", repondues: 3, nb_questions: 3 });
      const C = o => { const x = { version: 1, jours: {}, cta: { clics: (o.clics || []).map(v => ({ jour: 1, source: "decouverte", date: v })) } }; if (o.reserve) x.reserve = o.reserve; return x; };
      const bil = (v, t) => ({ type: "bilan", valeur: v, le: t }), iss = (v, t) => ({ type: "issue", valeur: v, le: t, note: "" });
      const S = (o) => Object.assign({ version: 1 }, o);
      const a = (P, Cc, Su, act, D) => { const z = Commercial.analyse(P, Cc, Su, act, D); return { etat: z.etat, urgent: z.urgent, motif: z.motif, action: z.action, rang: z.rang, texte: Commercial.motifTexte(z), raisons: z.raisons.join(" ") }; };
      const bl = (Su, Cc) => { const x = Commercial.bilan(Su, Cc, { statut: "prospect" }); return [x.reserve, x.source]; };
      return {
        absent: a(p(20), null, S({ issue: "absent", issue_le: M(2), historique: [iss("absent", M(2))] }), null, Q(20)),
        absentRelance: a(p(20), null, S({ issue: "absent", issue_le: M(2), relances: [M(1)] }), null, Q(20)),
        absentRelanceAvant: a(p(20), null, S({ issue: "absent", issue_le: H(2), relances: [H(30)] }), null, Q(20)),
        absentVieux: a(p(120), null, S({ issue: "absent", issue_le: M(90) }), null, Q(120)),
        absentClient: a({ statut: "client", cree_le: M(30) }, null, S({ issue: "absent", issue_le: M(2) }), null, Q(30)),
        perdu30: a(p(60), null, S({ issue: "perdu", issue_le: M(30) }), null, Q(60)),
        perdu29: a(p(60), null, S({ issue: "perdu", issue_le: M(29) }), null, Q(60)),
        perduRelance: a(p(60), null, S({ issue: "perdu", issue_le: M(40), relances: [M(5)] }), null, Q(60)),
        perduRelanceAvant: a(p(60), null, S({ issue: "perdu", issue_le: M(35), relances: [M(40), M(38), M(37)] }), null, Q(60)),
        perduClient: a({ statut: "client", cree_le: M(60) }, null, S({ issue: "perdu", issue_le: M(40) }), null, Q(60)),
        appel8: a(p(20), null, S({ bilan_le: M(8), historique: [bil("reserve", M(8))] }), null, Q(20)),
        appel7: a(p(20), null, S({ bilan_le: M(7), historique: [bil("reserve", M(7))] }), null, Q(20)),
        appelSigne: a(p(20), null, S({ bilan_le: M(10), issue: "signe", issue_le: H(1), historique: [bil("reserve", M(10)), iss("signe", H(1))] }), null, Q(20)),
        appelPerdu: a(p(20), null, S({ bilan_le: M(10), issue: "perdu", issue_le: M(1), historique: [bil("reserve", M(10)), iss("perdu", M(1))] }), null, Q(20)),
        appelAbsent: a(p(20), null, S({ bilan_le: M(10), issue: "absent", issue_le: M(1), historique: [bil("reserve", M(10)), iss("absent", M(1))] }), null, Q(20)),
        appelClient: a({ statut: "client", cree_le: M(30) }, null, S({ bilan_le: M(10), historique: [bil("reserve", M(10))] }), null, Q(30)),
        /* coche d'avant l'appel, Absent, puis un clic hier : de nouveau en cours pour son clic (plus « l'appel a-t-il eu lieu ? ») */
        cocheAvantClic: a(p(30), C({ clics: [H(20)] }), S({ bilan_le: M(12), issue: "absent", issue_le: M(5), historique: [bil("reserve", M(12)), iss("absent", M(5))] }), H(20), Q(30)),
        /* point B : coche APRÈS l'issue, il y a 20 jours (plus de retour_jours) : toujours en cours ; retirée : de nouveau Absent */
        cocheApres: a(p(40), null, S({ bilan_le: M(20), issue: "absent", issue_le: M(25), historique: [iss("absent", M(25)), bil("reserve", M(20))] }), null, Q(40)),
        cocheApresRetiree: a(p(40), null, S({ bilan_le: null, issue: "absent", issue_le: M(25), historique: [iss("absent", M(25)), bil("reserve", M(20)), bil("annule", M(18))] }), null, Q(40)),
        cocheApresRecente: a(p(40), null, S({ bilan_le: H(2), issue: "absent", issue_le: M(3), historique: [iss("absent", M(3)), bil("reserve", H(2))] }), null, Q(40)),
        /* … de même après « Perdu » (il y a 35 jours) : coche il y a 20 jours, en cours ; retirée : de nouveau PERDU à relancer */
        cochePerdu: a(p(60), null, S({ bilan_le: M(20), issue: "perdu", issue_le: M(35), historique: [iss("perdu", M(35)), bil("reserve", M(20))] }), null, Q(60)),
        cochePerduRetiree: a(p(60), null, S({ bilan_le: null, issue: "perdu", issue_le: M(35), historique: [iss("perdu", M(35)), bil("reserve", M(20)), bil("annule", M(18))] }), null, Q(60)),
        /* une issue sans date lisible (ancienne donnée) : pas de « nouveau créneau » (la coche ne saurait pas la suivre), « Annuler » reste */
        boutonsSansDate: (() => { try { return Commercial.boutons({ id: "x", prenom: "X", nom: "Y", statut: "prospect" }, Commercial.analyse(p(20), null, S({ issue: "absent", issue_le: "x" }), null, Q(20)), true); } catch (e) { return "ERREUR " + e.message; } })(),
        /* point C */
        caseApresRetrait: bl(S({ bilan_le: null, historique: [bil("reserve", M(10)), bil("annule", M(5))] }), C({ reserve: M(2) })),
        caseAvantRetrait: bl(S({ bilan_le: null, historique: [bil("reserve", M(10)), bil("annule", M(5))] }), C({ reserve: M(6) })),
        caseApresCoche: bl(S({ bilan_le: M(10), historique: [bil("reserve", M(10))] }), C({ reserve: M(2) })),
        caseSansDate: bl(S({ bilan_le: null }), C({ reserve: M(2) })),
        caseAncienClient: bl(S({ issue: "signe", issue_le: M(60), client_le: M(59), bilan_le: null, historique: [bil("reserve", M(61)), bil("annule", M(58))] }), C({ reserve: M(3) })),
        /* une case datée dans 48 h (téléphone du prospect en avance) après ton retrait : ne compte pas ; sans décision : compte (comme avant) */
        caseFuture: bl(S({ bilan_le: null, historique: [bil("reserve", M(10)), bil("annule", M(5))] }), C({ reserve: H(-48) })),
        caseFutureSansDecision: bl(S({}), C({ reserve: H(-48) })),
        /* première coche du prospect (hier), après la décision (coche il y a 8 jours, Absent il y a 5 jours) */
        absentCocheCase: a(p(30), C({ reserve: H(20) }), S({ bilan_le: M(8), issue: "absent", issue_le: M(5), historique: [bil("reserve", M(8)), iss("absent", M(5))] }), H(20), Q(30)),
        caseAvantAbsentClic: a(p(30), C({ reserve: M(6), clics: [H(20)] }), S({ issue: "absent", issue_le: M(4) }), H(20), Q(30)),
        /* v59 (relecture) : Nouveautés et l'info-bulle de Mes clients (Decouverte.pastilleCoach) suivent l'analyse
           (caseAVerifier) : les deux cas ci-dessus, en lignes de Clients.resumer */
        nouv: [["nc", "Nora", C({ reserve: H(20) }), S({ bilan_le: M(8), issue: "absent", issue_le: M(5), historique: [bil("reserve", M(8)), iss("absent", M(5))] })],
               ["na", "Nils", C({ reserve: M(6), clics: [H(20)] }), S({ issue: "absent", issue_le: M(4) })]].map(([id, prenom, Cc, Su]) => {
          const l = { p: { id, prenom, nom: "Test", statut: "prospect", cree_le: M(30) }, ch: Cc, suivi: Su, activite: H(20), dc: Q(30) };
          const t = /class="pastille ok" title="([^"]*)">bilan réservé</.exec(Decouverte.pastilleCoach(l));
          return { ev: Nouveautes.evenements([l], null).map(e => e.type + (e.quand === Cc.reserve ? "=case" : "")), titre: t ? t[1] : null };
        }),
        /* v59 (relecture) : « Absent » il y a 20 jours, case cochée il y a 16 jours (après l'appel, au-delà de retour_jours :
           l'issue reste) : à vérifier, « Retirer « Bilan réservé » » dans la fiche ; retirée maintenant : plus à vérifier, toujours Absent */
        absentCaseVieille: (() => {
          const P = p(40), Cc = C({ reserve: M(16) }), D = Q(40), h0 = [iss("absent", M(20))], px = { id: "x", prenom: "X", nom: "Y", statut: "prospect" };
          const bt = z => (Commercial.boutons(px, z, true).match(/data-sc="[a-z_]+"/g) || []).map(x => x.slice(9, -1));
          const z1 = Commercial.analyse(P, Cc, S({ issue: "absent", issue_le: M(20), historique: h0 }), null, D);
          const z2 = Commercial.analyse(P, Cc, S({ issue: "absent", issue_le: M(20), bilan_le: null, historique: h0.concat([bil("annule", new Date().toISOString())]) }), null, D);
          return [z1, z2].map(z => ({ etat: z.etat, motif: z.motif, aVerifier: !!z.caseAVerifier, boutons: bt(z) }));
        })(),
        /* l'ordre : les 7 motifs, puis ce qui n'est pas à traiter */
        rangs: [
          a(p(20), null, S({ issue: "signe", issue_le: H(1) }), null, Q(20)),
          a(p(4), C({ reserve: M(1) }), {}, null, Q(4)),
          a(p(20), null, S({ issue: "absent", issue_le: M(2) }), null, Q(20)),
          a(p(4), C({ clics: [H(20)] }), {}, null, Q(4)),
          a(ph(10), null, {}, null, null),
          a(p(20), null, S({ bilan_le: M(8) }), null, Q(20)),
          a(p(60), null, S({ issue: "perdu", issue_le: M(31) }), null, Q(60)),
          a(p(20), null, S({ bilan_le: M(1) }), null, Q(20)),
          a(p(20), null, S({ issue: "absent", issue_le: M(3), relances: [M(1)] }), null, Q(20)),
          a(p(20), null, S({ issue: "perdu", issue_le: M(5) }), null, Q(20)),
          a(p(20), null, {}, null, Q(20)),
          a(p(80), null, S({ issue: "signe", issue_le: M(40) }), null, Q(80))
        ].map(x => [x.motif, x.urgent, x.rang]),
        /* un « Signé » oublié (il y a 40 jours), coché avant l'appel (il y a 45 jours), toujours prospect : le dernier */
        signeCoche: a(p(80), null, S({ bilan_le: M(45), issue: "signe", issue_le: M(40), historique: [bil("reserve", M(45)), iss("signe", M(40))] }), null, Q(80)),
        aide: Commercial.AIDE
      };
    });
    const T_ABS = "Absent à l'appel : repropose-lui un créneau en DM.";
    ok("A : « Absent » il y a 2 jours, jamais relancé : à traiter (motif absent), « " + T_ABS + " », motif « Absent à l'appel : repropose-lui un créneau »",
      r.absent.urgent && r.absent.motif === "absent" && r.absent.etat === "absent" && r.absent.action === T_ABS && r.absent.texte === "Absent à l'appel : repropose-lui un créneau", JSON.stringify(r.absent));
    ok("A : « Absent » il y a 90 jours, jamais relancé : toujours à traiter (pas de limite de durée) ; relancé après l'appel : plus à traiter",
      r.absentVieux.urgent && r.absentVieux.motif === "absent" && !r.absentRelance.urgent && r.absentRelance.etat === "absent", JSON.stringify([r.absentVieux, r.absentRelance]));
    ok("A : « Absent » relancé AVANT l'appel seulement : à traiter, et l'action ne dit pas d'attendre (« " + T_ABS + " »)",
      r.absentRelanceAvant.urgent && r.absentRelanceAvant.motif === "absent" && r.absentRelanceAvant.action === T_ABS, JSON.stringify(r.absentRelanceAvant));
    ok("A : « Perdu » il y a 30 jours, jamais relancé : à traiter (motif perdu), « Relance-le : l'appel date d'il y a 30 jours. », motif « Perdu depuis 30 j : relance-le »",
      r.perdu30.urgent && r.perdu30.motif === "perdu" && r.perdu30.etat === "perdu" && r.perdu30.action === "Relance-le : l'appel date d'il y a 30 jours." && r.perdu30.texte === "Perdu depuis 30 j : relance-le", JSON.stringify(r.perdu30));
    ok("A : « Perdu » il y a 29 jours : pas encore (« Relance prévue dans 1 jour. ») ; relancé après l'appel : plus à traiter (« laisse-le »)",
      !r.perdu29.urgent && r.perdu29.action === "Relance prévue dans 1 jour." && !r.perduRelance.urgent && r.perduRelance.action.includes("laisse-le"), JSON.stringify([r.perdu29, r.perduRelance]));
    ok("A : « Perdu » il y a 35 jours avec 3 relances d'AVANT l'appel : à traiter, « Relance-le : l'appel date d'il y a 35 jours. » (pas « classe-le « Perdu » »)",
      r.perduRelanceAvant.urgent && r.perduRelanceAvant.motif === "perdu" && r.perduRelanceAvant.action === "Relance-le : l'appel date d'il y a 35 jours.", JSON.stringify(r.perduRelanceAvant));
    ok("A : bilan coché il y a 8 jours, sans issue : à traiter (motif appel), « Bilan réservé il y a 8 jours : l'appel a-t-il eu lieu ? Indique Signé, Perdu ou Absent. », motif « Bilan réservé depuis 8 j : l'appel a-t-il eu lieu ? »",
      r.appel8.urgent && r.appel8.motif === "appel" && r.appel8.etat === "en_cours" && r.appel8.action === "Bilan réservé il y a 8 jours : l'appel a-t-il eu lieu ? Indique Signé, Perdu ou Absent." && r.appel8.texte === "Bilan réservé depuis 8 j : l'appel a-t-il eu lieu ?", JSON.stringify(r.appel8));
    ok("A : bilan coché il y a 7 jours : pas encore (« Prépare le bilan ») ; le bilan à conclure sort par « Signé » (à passer client), « Perdu » (plus à traiter), « Absent » (repropose un créneau)",
      !r.appel7.urgent && r.appel7.action.startsWith("Prépare le bilan") && r.appelSigne.motif === "signe" && !r.appelPerdu.urgent && r.appelPerdu.etat === "perdu" && r.appelAbsent.motif === "absent" && r.appelAbsent.action === T_ABS, JSON.stringify([r.appel7, r.appelSigne, r.appelPerdu, r.appelAbsent]));
    ok("A : un client (plus prospect) Absent, Perdu depuis 40 jours ou coché il y a 10 jours : jamais à traiter",
      !r.absentClient.urgent && !r.perduClient.urgent && !r.appelClient.urgent, JSON.stringify([r.absentClient, r.perduClient, r.appelClient]));
    ok("A : coche d'AVANT l'appel, « Absent », puis un clic hier : de nouveau en cours, à traiter pour son clic (« DM : il a cliqué… »), plus « l'appel a-t-il eu lieu ? »",
      r.cocheAvantClic.etat === "en_cours" && r.cocheAvantClic.motif === "clic" && r.cocheAvantClic.action.startsWith("DM : il a cliqué") && r.cocheAvantClic.raisons.includes("coché par toi il y a 12 jours, avant l'appel"), JSON.stringify(r.cocheAvantClic));
    ok("A : « Absent » il y a 25 jours, « Bilan réservé » coché APRÈS (il y a 20 jours) : toujours en cours (sans limite de durée), « l'appel a-t-il eu lieu ? » ; coche d'aujourd'hui : « Prépare le bilan »",
      r.cocheApres.etat === "en_cours" && r.cocheApres.motif === "appel" && r.cocheApres.action.includes("l'appel a-t-il eu lieu ?") && r.cocheApres.raisons.includes("Revenu après l'issue « Absent »") && r.cocheApresRecente.etat === "en_cours" && !r.cocheApresRecente.urgent && r.cocheApresRecente.action.startsWith("Prépare le bilan"), JSON.stringify([r.cocheApres, r.cocheApresRecente]));
    ok("A : … la même coche retirée : de nouveau ABSENT et à traiter (repropose un créneau)",
      r.cocheApresRetiree.etat === "absent" && r.cocheApresRetiree.motif === "absent", JSON.stringify(r.cocheApresRetiree));
    ok("A : « Perdu » il y a 35 jours, « Bilan réservé » coché APRÈS (il y a 20 jours) : en cours (« Revenu après l'issue « Perdu » »), « l'appel a-t-il eu lieu ? » ; retirée : de nouveau PERDU, à relancer",
      r.cochePerdu.etat === "en_cours" && r.cochePerdu.motif === "appel" && r.cochePerdu.raisons.includes("Revenu après l'issue « Perdu »") && r.cochePerduRetiree.etat === "perdu" && r.cochePerduRetiree.motif === "perdu",
      JSON.stringify([r.cochePerdu, r.cochePerduRetiree]));
    ok("A : « Absent » dont la date est illisible : ni « Bilan réservé (nouveau créneau) » ni « Bilan réservé » dans la fiche ; « J'ai relancé » et « Annuler « Absent » » restent",
      !/data-sc="bilan"/.test(r.boutonsSansDate) && /data-sc="relance"/.test(r.boutonsSansDate) && /data-sc="annuler"[^>]*>Annuler « Absent »</.test(r.boutonsSansDate), r.boutonsSansDate);
    ok("A : Commercial.bilan : case « J'ai réservé » cochée APRÈS le retrait du coach → réservé, à vérifier (source prospect) ; cochée AVANT le retrait → non",
      egal(r.caseApresRetrait, [true, "prospect"]) && egal(r.caseAvantRetrait, [false, null]), JSON.stringify([r.caseApresRetrait, r.caseAvantRetrait]));
    ok("A : … face à une coche en cours : la coche (source coach) ; clé bilan_le posée sans historique (décision sans date) : non ; ancien client : décisions d'avant son passage en client ignorées, la case d'après compte",
      egal(r.caseApresCoche, [true, "coach"]) && egal(r.caseSansDate, [false, null]) && egal(r.caseAncienClient, [true, "prospect"]), JSON.stringify([r.caseApresCoche, r.caseSansDate, r.caseAncienClient]));
    ok("A : … case datée dans 48 h (horloge du prospect en avance) après ton retrait : ne compte pas (« Retirer » la fait tomber) ; sans aucune décision : elle compte, comme avant",
      egal(r.caseFuture, [false, null]) && egal(r.caseFutureSansDecision, [true, "prospect"]), JSON.stringify([r.caseFuture, r.caseFutureSansDecision]));
    ok("A : « Absent » il y a 5 jours, coche d'AVANT l'appel, case « J'ai réservé » cochée hier (après sa décision) : de nouveau en cours, à vérifier (« vérifie ton agenda »)",
      r.absentCocheCase.etat === "en_cours" && r.absentCocheCase.motif === "case" && r.absentCocheCase.action.includes("vérifie ton agenda"), JSON.stringify(r.absentCocheCase));
    ok("A : « Absent », case cochée AVANT l'appel, clic hier : en cours pour son clic (la case d'avant l'appel n'est plus « à vérifier »)",
      r.caseAvantAbsentClic.etat === "en_cours" && r.caseAvantAbsentClic.motif === "clic", JSON.stringify(r.caseAvantAbsentClic));
    const [nc, na] = r.nouv;
    ok("A : Nouveautés : la case « J'ai réservé » cochée hier, après l'appel, face à la coche d'AVANT l'appel (cas ci-dessus) : 1 nouveauté « case » (comme « À traiter ») ; info-bulle de Mes clients « à vérifier » (plus « coché par toi »)",
      egal(nc.ev, ["reserve=case"]) && nc.titre === "A coché « J'ai réservé mon bilan » (à vérifier, puis coche « Bilan réservé » dans sa fiche)", JSON.stringify(nc));
    ok("A : … la case cochée AVANT l'appel (« Absent », puis un clic hier) : plus de nouveauté « case », son clic oui ; info-bulle « A coché « J'ai réservé mon bilan », avant l'appel »",
      egal(na.ev, ["clic"]) && na.titre === "A coché « J'ai réservé mon bilan », avant l'appel", JSON.stringify(na));
    const [av1, av2] = r.absentCaseVieille;
    ok("A : « Absent » il y a 20 jours, case cochée il y a 16 jours (au-delà de 14 jours) : toujours Absent à traiter, case à vérifier, fiche : « Bilan réservé (nouveau créneau) » ET « Retirer « Bilan réservé » »",
      av1.etat === "absent" && av1.motif === "absent" && av1.aVerifier && av1.boutons.includes("bilan") && av1.boutons.includes("bilan_non"), JSON.stringify(av1));
    ok("A : … « Retirer » (ta décision, datée après sa case) : plus à vérifier, toujours Absent à traiter, plus de « Retirer », « nouveau créneau » reste",
      av2.etat === "absent" && av2.motif === "absent" && !av2.aVerifier && av2.boutons.includes("bilan") && !av2.boutons.includes("bilan_non"), JSON.stringify(av2));
    const R = r.rangs, urg = R.slice(0, 7), autres = R.slice(7);
    ok("A : ordre : signé, case, absent, clic, nouveau, appel, perdu (rangs croissants), puis tout ce qui n'est pas à traiter (bilan coché, absent relancé, perdu récent, le reste, signé ancien)",
      egal(urg.map(x => x[0]), ["signe", "case", "absent", "clic", "nouveau", "appel", "perdu"]) && urg.every(x => x[1]) && urg.every((x, i) => i === 0 || x[2] > urg[i - 1][2])
      && autres.every(x => !x[1]) && autres.every(x => x[2] > urg[6][2]) && autres.every((x, i) => i === 0 || x[2] > autres[i - 1][2]), JSON.stringify(R));
    ok("A : un « Signé » d'il y a 40 jours, coché avant l'appel (il y a 45 jours), toujours prospect : pas à traiter, au dernier rang (celui d'un signé ancien, après bilan coché, absent relancé, perdu récent et le reste)",
      !r.signeCoche.urgent && r.signeCoche.rang === R[R.length - 1][2] && autres.slice(0, -1).every(x => x[2] < r.signeCoche.rang), JSON.stringify([r.signeCoche.rang, R]));
    ok("A : l'aide « À traiter » cite les nouveaux cas (« Absent » sans limite de durée, « Perdu » depuis 30 jours ou plus, bilans cochés depuis plus de 7 jours) et garde les anciens (48 h, le clic — v65 : « Récupérer mon plan d'action », plus « Réserver » —, « Signé »)",
      /« Absent » \(sans limite de durée\)/.test(r.aide) && /« Perdu » depuis 30 jours ou plus/.test(r.aide) && /plus de 7 jours/.test(r.aide) && /48 h/.test(r.aide) && /« Récupérer mon plan d'action »/.test(r.aide) && !/Réserver/.test(r.aide) && /« Signé »/.test(r.aide), r.aide);
    ok("A : aucune écriture", db.ecritures.length === 0, resume(db));
  });

  /* =================== B. page Prospects =================== */
  await bloc("B. page Prospects : les 3 motifs, puis les actions du coach", async () => {
    const db = decor({ comptes: [P.alice(), P.marc(), P.bruno(), P.victor(), P.omar(), P.hugo(), P.paul()] });
    const { page } = await coachSur(b, db, "#/prospects", "#pr-liste .sc-carte");
    ok("B : « À traiter » par défaut, dans l'ordre : Alice (Absent), Marc (10 h), Bruno (bilan coché il y a 9 jours), Victor (Perdu il y a 31 jours)",
      egal(await uids(page), [ALICE, MARC, BRUNO, VICTOR]), noms(await uids(page)));
    const cpt = await compteFiltres(page);
    ok("B : en-tête « 7 comptes gratuits · 4 à traiter », tuile « À traiter » 4, filtres « À traiter » 4, « Appel fait » 4 (Alice, Victor, Omar, Paul), « Tous » 7",
      (await texte(page, "#pr-vue .masthead .lede")) === "7 comptes gratuits · 4 à traiter" && (await tuilePr(page, "À traiter")) === "4" && cpt.a_traiter === "4" && cpt.issues === "4" && cpt.tous === "7",
      (await texte(page, "#pr-vue .masthead .lede")) + " " + JSON.stringify(cpt));
    const ca = await carte(page, ALICE), cb = await carte(page, BRUNO), cv = await carte(page, VICTOR);
    ok("B : carte d'Alice : ABSENT, « à traiter Absent à l'appel : repropose-lui un créneau », « Prochaine action : Absent à l'appel : repropose-lui un créneau en DM. »",
      ca.includes("ABSENT") && (await motifCarte(page, ALICE)) === "à traiter Absent à l'appel : repropose-lui un créneau" && ca.includes("Prochaine action : Absent à l'appel : repropose-lui un créneau en DM."), ca);
    ok("B : … sa coche d'avant l'appel : « Bilan coché le " + frL(MIDI(5)) + ", avant l'appel » (plus « réservé le … »)",
      ca.includes("Bilan coché le " + frL(MIDI(5)) + ", avant l'appel") && !ca.includes("Bilan réservé le"), ca);
    ok("B : carte de Bruno : « à traiter Bilan réservé depuis 9 j : l'appel a-t-il eu lieu ? », « Prochaine action : Bilan réservé il y a 9 jours : l'appel a-t-il eu lieu ? Indique Signé, Perdu ou Absent. »",
      (await motifCarte(page, BRUNO)) === "à traiter Bilan réservé depuis 9 j : l'appel a-t-il eu lieu ?" && cb.includes("Prochaine action : Bilan réservé il y a 9 jours : l'appel a-t-il eu lieu ? Indique Signé, Perdu ou Absent."), cb);
    ok("B : carte de Victor : PERDU, « à traiter Perdu depuis 31 j : relance-le », « Prochaine action : Relance-le : l'appel date d'il y a 31 jours. »",
      cv.includes("PERDU") && (await motifCarte(page, VICTOR)) === "à traiter Perdu depuis 31 j : relance-le" && cv.includes("Prochaine action : Relance-le : l'appel date d'il y a 31 jours."), cv);
    const note = await texte(page, "#pr-vue");
    ok("B : l'aide en bas de page cite « Absent » (sans limite de durée), « Perdu » depuis 30 jours ou plus et les bilans cochés depuis plus de 7 jours",
      note.includes("les « Absent » (sans limite de durée) et les « Perdu » depuis 30 jours ou plus, tant que tu ne les as pas relancés depuis l'appel ; les bilans cochés depuis plus de 7 jours sans issue."), note.slice(-700));
    await filtre(page, "tous");
    ok("B : pas à traiter : Omar (« Perdu » il y a 5 jours, « Relance prévue dans 25 jours. »), Hugo (coché hier, « Prépare le bilan »), Paul (Absent relancé après l'appel)",
      !(await motifCarte(page, OMAR)) && (await carte(page, OMAR)).includes("Relance prévue dans 25 jours.") && !(await motifCarte(page, HUGO)) && (await carte(page, HUGO)).includes("Prépare le bilan") && !(await motifCarte(page, PAUL)) && (await carte(page, PAUL)).includes("ABSENT"),
      [await carte(page, OMAR), await carte(page, HUGO), await carte(page, PAUL)].join(" | "));
    await filtre(page, "a_traiter");
    /* les actions du coach sur les cartes : chacune sort la personne de la liste, une seule écriture chacune */
    const avantA = clone(SUIVI(db, ALICE)), luA = majLe(db, "suivi_prospect", ALICE);
    await cliquer(page, `#pr-liste .sc-carte[data-uid="${ALICE}"] [data-sc="relance"]`); await attendre(page, 1800);
    const SA = SUIVI(db, ALICE) || {}, leA = (SA.relances || [])[0];
    ok("B : « J'ai relancé » sur Alice : elle sort de « À traiter » ; UNE écriture (PATCH maj_le=eq.<lu>), contenu exact : le suivi d'avant + la relance et son événement",
      !(await uids(page)).includes(ALICE) && ecrSuivi(db, ALICE).length === 1 && ecrSuivi(db, ALICE)[0].m === "PATCH" && egal(conds(db, ALICE), ["eq." + luA])
      && egal(SA, Object.assign({}, avantA, { relances: [leA], historique: avantA.historique.concat([{ type: "relance", le: leA }]) })), noms(await uids(page)) + " " + JSON.stringify([conds(db, ALICE), SA]));
    const avantV = clone(SUIVI(db, VICTOR)), luV = majLe(db, "suivi_prospect", VICTOR);
    await cliquer(page, `#pr-liste .sc-carte[data-uid="${VICTOR}"] [data-sc="relance"]`); await attendre(page, 1800);
    const SV = SUIVI(db, VICTOR) || {}, leV = (SV.relances || [])[0];
    ok("B : « J'ai relancé » sur Victor : il sort ; UNE écriture (PATCH maj_le=eq.<lu>), contenu exact",
      !(await uids(page)).includes(VICTOR) && ecrSuivi(db, VICTOR).length === 1 && egal(conds(db, VICTOR), ["eq." + luV])
      && egal(SV, Object.assign({}, avantV, { relances: [leV], historique: avantV.historique.concat([{ type: "relance", le: leV }]) })), noms(await uids(page)) + " " + JSON.stringify(SV));
    const avantB = clone(SUIVI(db, BRUNO)), luB = majLe(db, "suivi_prospect", BRUNO);
    const vu = await cliquer(page, `#pr-liste .sc-carte[data-uid="${BRUNO}"] [data-sc="perdu"]`); await attendre(page, 500);
    if (vu) await bouton(page, "Perdu"); await attendre(page, 1800);
    const SB = SUIVI(db, BRUNO) || {};
    ok("B : « Perdu » sur Bruno (bilan à conclure, sans motif) : il sort ; UNE écriture (PATCH maj_le=eq.<lu>) : issue « perdu » datée, note vide, la coche gardée, un événement de plus",
      !(await uids(page)).includes(BRUNO) && ecrSuivi(db, BRUNO).length === 1 && egal(conds(db, BRUNO), ["eq." + luB]) && /^\d{4}-/.test(SB.issue_le || "")
      && egal(SB, Object.assign({}, avantB, { issue: "perdu", issue_le: SB.issue_le, note: "", historique: avantB.historique.concat([{ type: "issue", valeur: "perdu", le: SB.issue_le, note: "" }]) })), noms(await uids(page)) + " " + JSON.stringify(SB));
    const cpt2 = await compteFiltres(page);
    ok("B : ensuite : « À traiter » : Marc seul, tuile 1, « Appel fait » 5 (Bruno en plus) ; en tout 3 écritures, toutes de suivi_prospect",
      egal(await uids(page), [MARC]) && (await tuilePr(page, "À traiter")) === "1" && cpt2.a_traiter === "1" && cpt2.issues === "5" && db.ecritures.length === 3 && db.ecritures.every(e => e.table === "donnees" && e.outil === "suivi_prospect"),
      noms(await uids(page)) + " " + JSON.stringify(cpt2) + " " + resume(db));
  });

  /* =================== C. tableau de bord =================== */
  await bloc("C. tableau de bord : les 3 motifs après les urgences des clients", async () => {
    /* Thomas et Sarah retirés : côté clients, le 😞 du compte de test et Julien (inactif depuis 12 jours) */
    const db = decor({ test: false, comptes: [P.alice(), P.marc(), P.bruno(), P.victor(), P.omar(), P.hugo(), P.paul()], sans: [F.IDS.c1, F.IDS.c2] });
    const { page } = await coachSur(b, db, "#/tableau", "#tb-vue .tb-tiles");
    const tp = await tuileTb(page, "tb-t-prospects"), L = await aTraiterTb(page);
    ok("C : tuile Prospects 7, badge « 4 urgences » en couleur (Alice, Marc, Bruno, Victor) ; « 5 urgences aujourd'hui. » (avec Julien)",
      tp && tp.val === "7" && tp.badge === "4 urgences" && /mauvais/.test(tp.cls) && (await texte(page, "#tb-vue .lede")) === "5 urgences aujourd'hui.", JSON.stringify(tp) + " " + await texte(page, "#tb-vue .lede"));
    ok("C : « À traiter maintenant » : 5 lignes, Alice (absent), Marc (nouveau), Julien (urgence d'un client), puis Bruno (bilan à conclure) et Victor (« Perdu » à relancer)",
      egal(L.map(x => x.uid), [ALICE, MARC, F.IDS.c3, BRUNO, VICTOR]), noms(L.map(x => x.uid)));
    ok("C : textes : « Absent à l'appel : repropose-lui un créneau », « Inscrit il y a 10 h : DM de bienvenue », « Bilan réservé depuis 9 j : l'appel a-t-il eu lieu ? », « Perdu depuis 31 j : relance-le » ; pas de « Et … autres »",
      L.length === 5 && L[0].t.includes("Absent à l'appel : repropose-lui un créneau") && L[1].t.includes("Inscrit il y a 10 h : DM de bienvenue") && L[3].t.includes("Bilan réservé depuis 9 j : l'appel a-t-il eu lieu ?") && L[4].t.includes("Perdu depuis 31 j : relance-le") && !(await texte(page, "#tb-a-traiter")).includes("Et "),
      JSON.stringify(L.map(x => x.t)));
    ok("C : info-bulle de la tuile Prospects : la même aide que la page (Absent sans limite de durée, Perdu depuis 30 jours ou plus, 7 jours ; 48 h, « Récupérer mon plan d'action » ; v65 : plus « Réserver »)",
      /« Absent » \(sans limite de durée\)/.test(tp.titre) && /« Perdu » depuis 30 jours ou plus/.test(tp.titre) && /plus de 7 jours/.test(tp.titre) && /48 h/.test(tp.titre) && /« Récupérer mon plan d'action »/.test(tp.titre) && !/Réserver/.test(tp.titre), tp.titre);
    await cliquer(page, `#tb-a-traiter [data-fiche="${BRUNO}"]`); await page.waitForSelector("#fiche-commercial", { timeout: 8000 }).catch(() => {}); await attendre(page, 600);
    const bf = await boutonsFiche(page);
    ok("C : « Ouvrir » sur Bruno : sa fiche, « à traiter » avec le même motif, boutons Signé, Perdu, Absent et « Retirer « Bilan réservé » »",
      (await page.evaluate(() => Store.idConsulte)) === BRUNO && (await texte(page, "#fiche-commercial .sc-motif")) === "à traiter Bilan réservé depuis 9 j : l'appel a-t-il eu lieu ?" && ["signe=Signé", "perdu=Perdu", "absent=Absent", "bilan_non=Retirer « Bilan réservé »"].every(x => bf.includes(x)), JSON.stringify(bf));
    await aller(page, "#/tableau", 1500);
    await cliquer(page, "#tb-t-prospects"); await page.waitForSelector("#pr-liste", { timeout: 8000 }); await attendre(page, 600);
    ok("C : la tuile Prospects mène à la page Prospects : « À traiter » = les 4 du badge (même définition)", egal((await uids(page)).slice().sort(), [ALICE, MARC, BRUNO, VICTOR].sort()), noms(await uids(page)));
    ok("C : aucune écriture (tableau de bord, fiche, Prospects)", db.ecritures.length === 0, resume(db));
  });
  await bloc("C. tableau de bord : 5 lignes au plus, dans l'ordre", async () => {
    /* tous les motifs + le compte de test (😞) et Julien : 9 urgences, 5 lignes */
    const db = decor({ comptes: [P.zoe(), P.ines(), P.alice(), P.lea(), P.marc(), P.bruno(), P.victor(), P.omar()], sans: [F.IDS.c1, F.IDS.c2] });
    const { page } = await coachSur(b, db, "#/tableau", "#tb-a-traiter");
    const tc = await tuileTb(page, "tb-t-clients"), tp = await tuileTb(page, "tb-t-prospects"), L = await aTraiterTb(page);
    ok("C : Clients « 2 urgences » (compte de test, Julien), Prospects 8 « 7 urgences » ; « 9 urgences aujourd'hui. »",
      tc && tc.badge === "2 urgences" && tp && tp.val === "8" && tp.badge === "7 urgences" && (await texte(page, "#tb-vue .lede")) === "9 urgences aujourd'hui.", JSON.stringify([tc, tp]));
    ok("C : 5 lignes : le 😞 du compte de test (« Sans nom », vers Préparer le call), Zoé (signé), Inès (case), Alice (absent), Léa (clic) ; « Et 4 autres »",
      egal(L.map(x => x.uid), [TESTEUR.id, ZOE, INES, ALICE, LEA]) && L[0].t.includes("Sans nom") && L[0].t.includes("😞") && L[0].cible === "bilan" && L[3].t.includes("Absent à l'appel : repropose-lui un créneau") && (await texte(page, "#tb-a-traiter")).includes("Et 4 autres : Mes clients → · Prospects →"),
      noms(L.map(x => x.uid)) + " " + await texte(page, "#tb-a-traiter"));
    await aller(page, "#/prospects", 300); await page.waitForSelector("#pr-liste .sc-carte", { timeout: 8000 }); await attendre(page, 500);
    ok("C : page Prospects, « À traiter » (tri priorité) : Zoé, Inès, Alice, Léa, Marc, Bruno, Victor — signé, case, absent, clic, nouveau, appel, perdu ; tuile 7 = badge",
      egal(await uids(page), [ZOE, INES, ALICE, LEA, MARC, BRUNO, VICTOR]) && (await tuilePr(page, "À traiter")) === "7", noms(await uids(page)));
    ok("C : aucune écriture", db.ecritures.length === 0, resume(db));
  });

  /* =================== D. « Bilan réservé (nouveau créneau) » après « Absent » ou « Perdu » =================== */
  await bloc("D. Absent qui reprend un créneau", async () => {
    const db = decor({ test: false, comptes: [P.alice(), P.zoe(), P.paul(), P.victor()] });
    const { page } = await coachSur(b, db, "#/clients", "#tb-clients [data-ouvrir]");
    await ficheDe(page, ALICE, "Alice Absente", "#fiche-commercial");
    const b0 = await boutonsFiche(page);
    ok("D : fiche d'Alice (Absente, coche d'avant l'appel) : ABSENT, à traiter, bouton « Bilan réservé (nouveau créneau) », pas de « Retirer »",
      (await texte(page, "#fiche-commercial .seance-c-tete")).includes("ABSENT") && b0.includes("bilan=Bilan réservé (nouveau créneau)") && !b0.some(x => x.startsWith("bilan_non=")), JSON.stringify(b0));
    const avantA = clone(SUIVI(db, ALICE)), luA = majLe(db, "suivi_prospect", ALICE), n0 = db.ecritures.length;
    await cliquer(page, '#fiche-commercial [data-sc="bilan"]'); await attendre(page, 150);
    const modale = !!(await page.$(".modale"));
    await attendre(page, 1500);
    const S1 = SUIVI(db, ALICE) || {};
    ok("D : un clic, sans fenêtre : UNE écriture (PATCH maj_le=eq.<lu>) ; contenu EXACT : le suivi d'avant + bilan_le (maintenant) + l'événement « bilan réservé » ; issue « absent » et sa date gardées",
      !modale && db.ecritures.length === n0 + 1 && ecrSuivi(db, ALICE).length === 1 && egal(conds(db, ALICE), ["eq." + luA]) && /^\d{4}-\d{2}-\d{2}T/.test(S1.bilan_le || "") && S1.bilan_le !== avantA.bilan_le
      && egal(S1, Object.assign({}, avantA, { bilan_le: S1.bilan_le, historique: avantA.historique.concat([{ type: "bilan", valeur: "reserve", le: S1.bilan_le }]) })) && S1.issue === "absent" && S1.issue_le === avantA.issue_le,
      JSON.stringify([modale, S1]));
    const b1 = await boutonsFiche(page), fc = await texte(page, "#fiche-commercial");
    ok("D : la fiche : plus « ABSENT », « Revenu après l'issue « Absent » », « Prépare le bilan », boutons Signé / Perdu / Absent et « Retirer « Bilan réservé » » ; toast",
      !(await texte(page, "#fiche-commercial .seance-c-tete")).includes("ABSENT") && fc.includes("Revenu après l'issue « Absent »") && fc.includes("Prochaine action : Prépare le bilan") && ["signe=Signé", "perdu=Perdu", "absent=Absent", "bilan_non=Retirer « Bilan réservé »"].every(x => b1.includes(x)) && (await toasts(page)).some(x => x.includes("Bilan réservé noté pour Alice Absente.")),
      JSON.stringify(b1) + " " + fc.slice(0, 300));
    await aller(page, "#/prospects", 300); await page.waitForSelector("#pr-liste", { timeout: 8000 }); await attendre(page, 500);
    const aT = await uids(page);
    await filtre(page, "issues"); const aI = await uids(page);
    await filtre(page, "tous");
    ok("D : page Prospects : Alice n'est plus dans « À traiter » ni dans « Appel fait » ; dans « Tous » : « Bilan réservé le " + frL(S1.bilan_le) + " » ; tuile « Absents » (30 jours) : 2 (Alice gardée, Paul)",
      !aT.includes(ALICE) && !aI.includes(ALICE) && (await carte(page, ALICE)).includes("Bilan réservé le " + frL(S1.bilan_le)) && !(await carte(page, ALICE)).includes("ABSENT") && (await tuilePr(page, "Absents")) === "2",
      JSON.stringify([noms(aT), noms(aI), await tuilePr(page, "Absents")]) + " " + await carte(page, ALICE));
    await ficheDe(page, ALICE, "Alice Absente", "#fiche-commercial");
    const lu2 = majLe(db, "suivi_prospect", ALICE);
    await cliquer(page, '#fiche-commercial [data-sc="bilan_non"]'); await attendre(page, 1500);
    const S2 = SUIVI(db, ALICE) || {};
    ok("D : « Retirer « Bilan réservé » » : un PATCH (maj_le=eq.<lu>), bilan_le null, un événement « retiré » ; de nouveau ABSENT, à traiter, « Bilan réservé (nouveau créneau) »",
      ecrSuivi(db, ALICE).length === 2 && conds(db, ALICE).slice(-1)[0] === "eq." + lu2 && S2.bilan_le === null && S2.issue === "absent" && egal(S2.historique.map(e => e.type + ":" + e.valeur), ["bilan:reserve", "issue:absent", "bilan:reserve", "bilan:annule"])
      && (await texte(page, "#fiche-commercial .seance-c-tete")).includes("ABSENT") && !!(await page.$("#fiche-commercial .sc-motif")) && (await boutonsFiche(page)).includes("bilan=Bilan réservé (nouveau créneau)"),
      JSON.stringify([S2, await boutonsFiche(page)]));
    await ficheDe(page, ZOE, "Zoé Signée", "#fiche-commercial");
    const bz = await boutonsFiche(page);
    ok("D : fiche de Zoé (Signé) : ni « Bilan réservé » ni « Retirer » ; « Passer client »", !bz.some(x => /^bilan/.test(x)) && bz.includes("client=Passer client"), JSON.stringify(bz));
    /* « Perdu » (Victor, il y a 31 jours) qui reprend un créneau : le même bouton, la même écriture */
    await ficheDe(page, VICTOR, "Victor Perdu", "#fiche-commercial");
    const bv = await boutonsFiche(page);
    ok("D : fiche de Victor (Perdu il y a 31 jours) : PERDU, bouton « Bilan réservé (nouveau créneau) », pas de « Retirer »",
      (await texte(page, "#fiche-commercial .seance-c-tete")).includes("PERDU") && bv.includes("bilan=Bilan réservé (nouveau créneau)") && !bv.some(x => x.startsWith("bilan_non=")), JSON.stringify(bv));
    const avantV = clone(SUIVI(db, VICTOR)), luV = majLe(db, "suivi_prospect", VICTOR), nV = db.ecritures.length;
    await cliquer(page, '#fiche-commercial [data-sc="bilan"]'); await attendre(page, 150);
    const modaleV = !!(await page.$(".modale"));
    await attendre(page, 1500);
    const SV = SUIVI(db, VICTOR) || {}, fv = await texte(page, "#fiche-commercial");
    ok("D : un clic, sans fenêtre : UNE écriture (PATCH maj_le=eq.<lu>), contenu EXACT (issue « perdu », sa date et sa note gardées) ; en cours : plus « PERDU », « Revenu après l'issue « Perdu » », « Prépare le bilan »",
      !modaleV && db.ecritures.length === nV + 1 && ecrSuivi(db, VICTOR).length === 1 && egal(conds(db, VICTOR), ["eq." + luV]) && /^\d{4}-\d{2}-\d{2}T/.test(SV.bilan_le || "")
      && egal(SV, Object.assign({}, avantV, { bilan_le: SV.bilan_le, historique: avantV.historique.concat([{ type: "bilan", valeur: "reserve", le: SV.bilan_le }]) })) && SV.issue === "perdu" && SV.issue_le === avantV.issue_le && SV.note === "timing"
      && !(await texte(page, "#fiche-commercial .seance-c-tete")).includes("PERDU") && fv.includes("Revenu après l'issue « Perdu »") && fv.includes("Prochaine action : Prépare le bilan"),
      JSON.stringify([modaleV, SV]) + " " + fv.slice(0, 300));
    ok("D : seules les 3 écritures de suivi_prospect (Alice 2, Victor 1)", db.ecritures.length === 3 && db.ecritures.every(e => e.table === "donnees" && e.outil === "suivi_prospect") && ecrSuivi(db, ALICE).length === 2 && ecrSuivi(db, VICTOR).length === 1, resume(db));
  });

  /* =================== E. la case « J'ai réservé » cochée après la décision du coach =================== */
  await bloc("E. case du prospect après le retrait du coach", async () => {
    const db = decor({ test: false, comptes: [P.nadia(), P.rose()] });
    const { page } = await coachSur(b, db, "#/prospects", "#pr-liste");
    await attendre(page, 600);
    ok("E : « À traiter » : Nadia (case cochée il y a 2 jours, APRÈS ton retrait) ; pas Rose (case d'avant le retrait)", egal(await uids(page), [NADIA]), noms(await uids(page)));
    const cn = await carte(page, NADIA);
    ok("E : carte de Nadia : « bilan réservé », « à traiter A coché « J'ai réservé » : à vérifier », « Bilan à vérifier (case cochée le " + frL(avant(2 * J)) + ") », « vérifie ton agenda »",
      cn.includes("bilan réservé") && (await motifCarte(page, NADIA)) === "à traiter A coché « J'ai réservé » : à vérifier" && cn.includes("Bilan à vérifier (case cochée le " + frL(avant(2 * J)) + ")") && cn.includes("Il a coché « J'ai réservé » il y a 2 jours : vérifie ton agenda"), cn);
    const nv = await page.$$eval("#pr-nouveautes .nv-liste li .nv-txt", l => l.map(e => e.textContent.replace(/\s+/g, " ").trim())).catch(() => []);
    ok("E : Nouveautés : « Nadia Recoche · a coché « J'ai réservé » » ; rien pour la case de Rose (d'avant le retrait)", nv.includes("Nadia Recoche · a coché « J'ai réservé »") && !nv.some(x => x.startsWith("Rose Avant · a coché")), JSON.stringify(nv));
    await filtre(page, "tous"); await choisir(page, "#pr-bilan", "oui");
    const bo = await uids(page);
    await choisir(page, "#pr-bilan", "tout");
    ok("E : filtre « Bilan réservé » : Nadia seule ; compteur « … → bilans réservés 1 → … »", egal(bo, [NADIA]) && /bilans réservés 1 →/.test(await texte(page, "#pr-compteur")), noms(bo) + " " + await texte(page, "#pr-compteur"));
    await cliquer(page, `#pr-liste .sc-carte[data-uid="${NADIA}"] [data-sc="fiche"]`); await page.waitForSelector("#fiche-commercial", { timeout: 8000 }).catch(() => {}); await attendre(page, 600);
    const bf = await boutonsFiche(page), dec = await valeurFiche(page, "#fiche-decouverte", "Bilan réservé");
    ok("E : fiche de Nadia : « Bilan réservé : à vérifier : le prospect a coché sa case », boutons « Bilan réservé » et « Retirer « Bilan réservé » »",
      dec === "à vérifier : le prospect a coché sa case" && bf.includes("bilan=Bilan réservé") && bf.includes("bilan_non=Retirer « Bilan réservé »"), dec + " " + JSON.stringify(bf));
    await cliquer(page, '#fiche-commercial [data-sc="bilan_non"]'); await attendre(page, 1500);
    await aller(page, "#/prospects", 300); await page.waitForSelector("#pr-liste", { timeout: 8000 }); await attendre(page, 500);
    await filtre(page, "a_traiter");   // le filtre choisi est gardé le temps de la session (« Tous » plus haut)
    ok("E : « Retirer » de nouveau (ta décision, après sa case) : Nadia sort de « À traiter », la case redevient une info ; une écriture, jamais la clé challenge",
      !(await uids(page)).includes(NADIA) && ecrSuivi(db, NADIA).length === 1 && ecr(db, "challenge").length === 0 && db.ecritures.length === 1, noms(await uids(page)) + " " + resume(db));
  });

  /* v59 (relecture) : « Absent » dont la case « J'ai réservé » (cochée après l'appel) est restée à vérifier au-delà de
     retour_jours : « Retirer « Bilan réservé » » dans la fiche fait tomber le « à vérifier », l'Absent reste */
  await bloc("E. Absent, case d'après l'appel restée à vérifier : « Retirer »", async () => {
    const db = decor({ test: false, comptes: [P.yann()] });
    const { page } = await coachSur(b, db, "#/clients", "#tb-clients [data-ouvrir]");
    await ficheDe(page, YANN, "Yann Vieux", "#fiche-commercial");
    const b0 = await boutonsFiche(page), f0 = await texte(page, "#fiche-commercial");
    ok("E : fiche de Yann (Absent il y a 20 jours, case cochée il y a 16 jours) : ABSENT, « pas encore vérifié par toi », boutons « Bilan réservé (nouveau créneau) » et « Retirer « Bilan réservé » »",
      (await texte(page, "#fiche-commercial .seance-c-tete")).includes("ABSENT") && f0.includes("il y a 16 jours : pas encore vérifié par toi") && b0.includes("bilan=Bilan réservé (nouveau créneau)") && b0.includes("bilan_non=Retirer « Bilan réservé »"),
      JSON.stringify(b0) + " " + f0.slice(0, 400));
    const avantY = clone(SUIVI(db, YANN)), luY = majLe(db, "suivi_prospect", YANN), n0 = db.ecritures.length;
    await cliquer(page, '#fiche-commercial [data-sc="bilan_non"]'); await attendre(page, 1500);
    const SY = SUIVI(db, YANN) || {}, leY = ((SY.historique || []).slice(-1)[0] || {}).le;
    ok("E : « Retirer » : UNE écriture (PATCH maj_le=eq.<lu>), contenu EXACT : le suivi d'avant + bilan_le null + l'événement « retiré » ; l'issue « absent » et sa date gardées ; jamais la clé challenge",
      db.ecritures.length === n0 + 1 && ecrSuivi(db, YANN).length === 1 && egal(conds(db, YANN), ["eq." + luY]) && /^\d{4}-\d{2}-\d{2}T/.test(leY || "")
      && egal(SY, Object.assign({}, avantY, { bilan_le: null, historique: avantY.historique.concat([{ type: "bilan", valeur: "annule", le: leY }]) })) && SY.issue === "absent" && SY.issue_le === avantY.issue_le && ecr(db, "challenge").length === 0,
      JSON.stringify(SY) + " " + resume(db));
    const b1 = await boutonsFiche(page), f1 = await texte(page, "#fiche-commercial");
    ok("E : la fiche se redessine : toujours ABSENT et à traiter, plus « pas encore vérifié par toi » ni « Retirer », « Bilan réservé (nouveau créneau) » reste",
      (await texte(page, "#fiche-commercial .seance-c-tete")).includes("ABSENT") && !!(await page.$("#fiche-commercial .sc-motif")) && !f1.includes("pas encore vérifié par toi") && !b1.some(x => x.startsWith("bilan_non=")) && b1.includes("bilan=Bilan réservé (nouveau créneau)"),
      JSON.stringify(b1) + " " + f1.slice(0, 400));
    await aller(page, "#/prospects", 300); await page.waitForSelector("#pr-liste", { timeout: 8000 }); await attendre(page, 500);
    const cy = await carte(page, YANN);
    ok("E : page Prospects, carte de Yann : « à traiter Absent à l'appel : repropose-lui un créneau », « Bilan pas réservé » (plus « à vérifier »)",
      (await motifCarte(page, YANN)) === "à traiter Absent à l'appel : repropose-lui un créneau" && cy.includes("Bilan pas réservé") && !cy.includes("à vérifier"), cy);
  });

  /* =================== F. export CSV : espaces puis = + - @ =================== */
  await bloc("F. export CSV : cellules précédées d'espaces", async () => {
    const pieges = [
      prospect(20, "Esp", "Ace", { cree: 2 * J, q: 2 * J, rep: { probleme: "Perdre du gras" }, email: '  =HYPERLINK("http://x")', news: true }),
      prospect(21, "Evi", "Lat", { cree: 2 * J, q: 2 * J, rep: { probleme: "Perdre du gras" }, email: " @evil.fr", news: true }),
      prospect(22, "Tab", "Plus", { cree: 2 * J, q: 2 * J, rep: { probleme: "Perdre du gras" }, email: " \t+33 6 00", news: true }),
      prospect(23, "Lou", "Espace", { cree: 2 * J, q: 2 * J, rep: { probleme: "Perdre du gras" }, email: " lou@exemple.fr", news: true }),
      prospect(24, "Jean-Luc", "Normal", { cree: 2 * J, q: 2 * J, rep: { probleme: "Perdre du gras" }, email: "jl@exemple.fr", news: true })
    ];
    const db = decor({ test: false, comptes: pieges });
    const { page } = await coachSur(b, db, "#/prospects", "#pr-liste");
    await filtre(page, "tous");
    const { t } = await exporter(page);
    const L = lireCSV(t.replace(/^﻿/, "")), ligne = n => L.find(l => l[0] === n) || [];
    const col = k => L[0].indexOf(k), iE = col("Email"), iR = col("Relances"), iI = col("Inscrit le"), iC = col("Clics « Récupérer mon plan d'action »");
    ok("F : CSV des prospects : email « ␣␣=HYPERLINK(…) » → « '␣␣=HYPERLINK(…) », « ␣@evil.fr » → « '␣@evil.fr », espace insécable + tabulation + « + » neutralisé",
      ligne("Esp Ace")[iE] === '\'  =HYPERLINK("http://x")' && ligne("Evi Lat")[iE] === "' @evil.fr" && ligne("Tab Plus")[iE] === "' \t+33 6 00", JSON.stringify([ligne("Esp Ace")[iE], ligne("Evi Lat")[iE], ligne("Tab Plus")[iE]]));
    ok("F : … sans signe après les espaces (« ␣lou@exemple.fr »), un nom avec un tiret au milieu, les nombres (relances, clics) et les dates : inchangés",
      ligne("Lou Espace")[iE] === " lou@exemple.fr" && ligne("Jean-Luc Normal")[iE] === "jl@exemple.fr" && ligne("Jean-Luc Normal")[iR] === "0" && ligne("Jean-Luc Normal")[iC] === "0" && /^\d{2}\/\d{2}\/\d{4}$/.test(ligne("Jean-Luc Normal")[iI] || ""),
      JSON.stringify([ligne("Lou Espace"), ligne("Jean-Luc Normal")]));
    const { t: tn } = await exporter(page, "#pr-nl-csv");
    const N = lireCSV(tn.replace(/^﻿/, "")), nl = n => N.find(l => l[0] === n) || [];
    ok("F : CSV de la newsletter : les mêmes emails neutralisés (« '␣␣=HYPERLINK(…) », « '␣@evil.fr »), « ␣lou@exemple.fr » et « jl@exemple.fr » inchangés",
      nl("Esp")[2] === '\'  =HYPERLINK("http://x")' && nl("Evi")[2] === "' @evil.fr" && nl("Tab")[2] === "' \t+33 6 00" && nl("Lou")[2] === " lou@exemple.fr" && nl("Jean-Luc")[2] === "jl@exemple.fr", JSON.stringify(N.slice(1)));
    ok("F : export : aucune écriture", db.ecritures.length === 0, resume(db));
  });

  /* =================== G. une analyse qui lève une erreur =================== */
  await bloc("G. analyse qui plante : le prospect reste", async () => {
    const db = decor({ test: false, comptes: [P.lea(), P.marc(), P.hugo(), P.omar()] });
    const { page } = await coachSur(b, db, "#/prospects", "#pr-liste .sc-carte");
    /* une erreur imprévue dans l'analyse d'Omar (un bug futur, un champ nouveau lu sans garde) */
    await page.evaluate(id => { const o = Commercial.analyse; Commercial.analyse = function(p){ if (p && p.id === id) throw new Error("piège"); return o.apply(this, arguments); }; outilProspects.rendre(document.getElementById("pr-vue")); }, OMAR);
    await attendre(page, 500);
    await filtre(page, "tous");
    const co = await carte(page, OMAR), bo = await boutonsCarte(page, OMAR);
    ok("G : la carte d'Omar reste, avec « données illisibles », « Prochaine action : Données illisibles : ouvre sa fiche pour vérifier. », un seul bouton : « Ouvrir la fiche »",
      co.includes("données illisibles") && co.includes("Prochaine action : Données illisibles : ouvre sa fiche pour vérifier.") && egal(bo, ["fiche"]) && !(await motifCarte(page, OMAR)), co + " " + JSON.stringify(bo));
    const cpt = await compteFiltres(page);
    ok("G : en-tête « 4 comptes gratuits · 2 à traiter » (Léa, Marc), filtres « Tous » 4, « À traiter » 2 ; « 4 prospects »",
      (await texte(page, "#pr-vue .masthead .lede")) === "4 comptes gratuits · 2 à traiter" && cpt.tous === "4" && cpt.a_traiter === "2" && (await texte(page, "#pr-compte")) === "4 prospects", (await texte(page, "#pr-vue .masthead .lede")) + " " + JSON.stringify(cpt));
    const a = await page.evaluate(id => { const x = (outilProspects.tous || []).find(y => y.l.p.id === id); return x ? { illisible: x.a.illisible, urgent: x.a.urgent, rang: x.a.rang, etat: x.a.etat } : null; }, OMAR);
    ok("G : analyse de secours : sans urgence, en cours, au rang le plus bas (10), après Léa (clic), Marc (nouveau) et Hugo (bilan coché)",
      !!a && a.illisible === true && a.urgent === false && a.rang === 10 && a.etat === "en_cours" && egal(await uids(page), [LEA, MARC, HUGO, OMAR]), JSON.stringify(a) + " " + noms(await uids(page)));
    const { t } = await exporter(page);
    const L = lireCSV(t.replace(/^﻿/, "")), lo = L.find(l => l[0] === "Omar Récent") || [];
    ok("G : CSV : 4 lignes (Omar compris, « Données illisibles : ouvre sa fiche pour vérifier. »)", L.length === 5 && lo[L[0].indexOf("Prochaine action")] === "Données illisibles : ouvre sa fiche pour vérifier.", JSON.stringify(L.map(l => l[0])));
    await cliquer(page, `#pr-liste .sc-carte[data-uid="${OMAR}"] [data-sc="fiche"]`); await page.waitForSelector("#fiche-reponses", { timeout: 8000 }).catch(() => {}); await attendre(page, 600);
    ok("G : « Ouvrir la fiche » : la fiche d'Omar s'ouvre (ses réponses), sans bloc « Suivi commercial »", (await page.evaluate(() => Store.idConsulte)) === OMAR && !!(await page.$("#fiche-reponses")) && !(await page.$("#fiche-commercial")), await texte(page, "#vue .masthead h1"));
    await aller(page, "#/tableau", 300); await page.waitForSelector("#tb-t-prospects", { timeout: 8000 }); await attendre(page, 600);
    const tp = await tuileTb(page, "tb-t-prospects");
    ok("G : tableau de bord (même erreur) : tuile Prospects 4 (Omar compté), badge « 2 urgences »", tp && tp.val === "4" && tp.badge === "2 urgences", JSON.stringify(tp));
    ok("G : aucune écriture", db.ecritures.length === 0, resume(db));
  });

  /* =================== H. le bilan d'avant l'appel, à l'écran et dans le CSV =================== */
  await bloc("H. bilan d'avant l'appel : carte, fiche, CSV", async () => {
    const db = decor({ test: false, comptes: [P.alice(), P.sara(), P.tina(), P.hugo()] });
    const { page } = await coachSur(b, db, "#/prospects", "#pr-liste");
    await filtre(page, "tous");
    const ca = await carte(page, ALICE), cs = await carte(page, SARA), ct = await carte(page, TINA), ch = await carte(page, HUGO);
    ok("H : Alice (coche d'avant son « Absent ») : « Bilan coché le " + frL(MIDI(5)) + ", avant l'appel », info-bulle « Bilan réservé : coché par toi, avant l'appel »",
      ca.includes("Bilan coché le " + frL(MIDI(5)) + ", avant l'appel") && (await titreBilan(page, ALICE)) === "Bilan réservé : coché par toi, avant l'appel", ca + " | " + await titreBilan(page, ALICE));
    ok("H : Sara (coche d'avant l'appel, case cochée après) : motif « A coché « J'ai réservé » : à vérifier », « Bilan à vérifier (case cochée le " + frL(avant(20 * H)) + ") », pas « réservé le », info-bulle « à vérifier »",
      (await motifCarte(page, SARA)) === "à traiter A coché « J'ai réservé » : à vérifier" && cs.includes("Bilan à vérifier (case cochée le " + frL(avant(20 * H)) + ")") && !cs.includes("Bilan réservé le") && (await titreBilan(page, SARA)) === "A coché « J'ai réservé mon bilan » : à vérifier",
      cs + " | " + await titreBilan(page, SARA));
    ok("H : Tina (case d'avant l'appel, puis un clic) : motif « clic », « Bilan case cochée le " + frL(avant(6 * J)) + ", avant l'appel », pas « à vérifier », info-bulle « avant l'appel »",
      (await motifCarte(page, TINA)) === "à traiter A cliqué « Récupérer mon plan d'action », pas de bilan coché" && ct.includes("Bilan case cochée le " + frL(avant(6 * J)) + ", avant l'appel") && !ct.includes("à vérifier") && (await titreBilan(page, TINA)) === "A coché « J'ai réservé mon bilan », avant l'appel",
      ct + " | " + await titreBilan(page, TINA));
    ok("H : Hugo (coché hier, sans issue) : inchangé, « Bilan réservé le " + frL(MIDI(1)) + " », info-bulle « Bilan réservé : coché par toi »",
      ch.includes("Bilan réservé le " + frL(MIDI(1))) && (await titreBilan(page, HUGO)) === "Bilan réservé : coché par toi", ch + " | " + await titreBilan(page, HUGO));
    /* v59 (relecture) : Nouveautés et le badge de l'onglet Prospects suivent l'analyse (caseAVerifier), comme « À traiter » */
    const nvH = await page.$$eval("#pr-nouveautes .nv-liste li .nv-txt", l => l.map(e => e.textContent.replace(/\s+/g, " ").trim())).catch(() => []);
    const bgH = await page.$$eval('#nav a[data-id="prospects"] .nav-badge', l => l.map(e => e.textContent.trim())).catch(() => []);
    ok("H : Nouveautés : « Sara Recase · a coché « J'ai réservé » » (sa case d'après l'appel, face à ta coche d'avant) ; pas la case de Tina (d'avant l'appel), son clic oui ; badge de l'onglet Prospects « 2 »",
      nvH.includes("Sara Recase · a coché « J'ai réservé »") && !nvH.some(x => x.startsWith("Tina Reclic · a coché")) && nvH.includes("Tina Reclic · clic « Récupérer mon plan d'action »") && nvH.length === 2 && egal(bgH, ["2"]),
      JSON.stringify([nvH, bgH]));
    const { t } = await exporter(page);
    const L = lireCSV(t.replace(/^\uFEFF/, "")), ligne = n => L.find(l => l[0] === n) || [], iB = L[0].indexOf("Bilan réservé"), iL = L[0].indexOf("Bilan réservé le"), iC = L[0].indexOf("Case « J'ai réservé » (prospect)");
    const cols = n => [ligne(n)[iB], ligne(n)[iL], ligne(n)[iC]];
    ok("H : CSV, « Bilan réservé » / « Bilan réservé le » / case : Alice « oui, avant l'appel », Sara « à vérifier (case du prospect) » et la date de sa case, Tina « case du prospect, avant l'appel »",
      egal(cols("Alice Absente"), ["oui, avant l'appel", frL(MIDI(5)), ""]) && egal(cols("Sara Recase"), ["à vérifier (case du prospect)", frL(avant(20 * H)), frL(avant(20 * H))]) && egal(cols("Tina Reclic"), ["case du prospect, avant l'appel", frL(avant(6 * J)), frL(avant(6 * J))]),
      JSON.stringify([cols("Alice Absente"), cols("Sara Recase"), cols("Tina Reclic")]));
    ok("H : … Hugo inchangé (« oui », " + frL(MIDI(1)) + ")", egal(cols("Hugo Réservé"), ["oui", frL(MIDI(1)), ""]), JSON.stringify(cols("Hugo Réservé")));
    /* v71 (D) : Mes clients ne liste plus les prospects (« Les prospects sont dans Prospects → (N comptes gratuits). ») : ce que
       disait l'info-bulle « bilan réservé » de leur ligne (v59, Decouverte.pastilleCoach) se lit sur leur carte Prospects, fait
       « Bilan », valeur exacte (la page est encore sur Prospects, filtre « Tous ») ; puis Mes clients : aucun des 4, la ligne */
    const fb = {}; for (const [k, u] of [["Alice", ALICE], ["Sara", SARA], ["Tina", TINA], ["Hugo", HUGO]]) fb[k] = (await faits(page, u)).Bilan;
    await aller(page, "#/clients", 300); await page.waitForSelector("#tb-clients [data-ouvrir]", { timeout: 8000 }); await attendre(page, 500);
    const lp = await ligneProspects(page), dansTb = !!(await page.$([ALICE, SARA, TINA, HUGO].map(u => `#tb-clients [data-ouvrir="${u}"]`).join(", ")));
    ok("H : Mes clients (v71) : ni Alice, Sara, Tina ni Hugo dans « Suivi de mes clients », « Les prospects sont dans Prospects → (4 comptes gratuits). » (lien #/prospects) ; cartes Prospects, fait « Bilan » : Sara « à vérifier (case cochée le " + frL(avant(20 * H)) + ") » (plus « réservé le »), Alice « coché le " + frL(MIDI(5)) + ", avant l'appel », Tina « case cochée le " + frL(avant(6 * J)) + ", avant l'appel », Hugo inchangé (« réservé le " + frL(MIDI(1)) + " »)",
      !dansTb && lp.t === "Les prospects sont dans Prospects → (4 comptes gratuits)." && lp.href === "#/prospects" && fb.Sara === "à vérifier (case cochée le " + frL(avant(20 * H)) + ")" && fb.Alice === "coché le " + frL(MIDI(5)) + ", avant l'appel" && fb.Tina === "case cochée le " + frL(avant(6 * J)) + ", avant l'appel" && fb.Hugo === "réservé le " + frL(MIDI(1)),
      JSON.stringify([dansTb, lp, fb]));
    await ficheDe(page, ALICE, "Alice Absente", "#fiche-decouverte");
    const da = await valeurFiche(page, "#fiche-decouverte", "Bilan réservé");
    await ficheDe(page, TINA, "Tina Reclic", "#fiche-decouverte");
    const dtn = await valeurFiche(page, "#fiche-decouverte", "Bilan réservé");
    await ficheDe(page, HUGO, "Hugo Réservé", "#fiche-decouverte");
    const dh = await valeurFiche(page, "#fiche-decouverte", "Bilan réservé");
    ok("H : fiche, bloc « Découverte » : Alice « oui, coché par toi le " + frL(MIDI(5)) + ", avant l'appel », Tina « case cochée par le prospect avant l'appel », Hugo inchangé (« oui, coché par toi le " + frL(MIDI(1)) + " »)",
      da === "oui, coché par toi le " + frL(MIDI(5)) + ", avant l'appel" && dtn === "case cochée par le prospect avant l'appel" && dh === "oui, coché par toi le " + frL(MIDI(1)), JSON.stringify([da, dtn, dh]));
    ok("H : aucune écriture", db.ecritures.length === 0, resume(db));
  });

  /* =================== Z. rien vers l'extérieur =================== */
  await bloc("Z. hôtes externes", async () => {
    const autres = Array.from(externes).filter(h => !/^fonts\.(googleapis|gstatic)\.com$/.test(h));
    ok("Z : aucune requête vers un autre hôte que la page, le faux Supabase et les polices (bloquées)", autres.length === 0, JSON.stringify(autres));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
