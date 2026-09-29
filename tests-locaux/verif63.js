/* verif63 — v59 (lot B, Q13) : les deux corrections du feedback du dimanche, avec le bilan du vendredi et les remarques
   v53 c1 et c2, vérifiées de bout en bout dans un vrai navigateur, horloge contrôlée. Deux contextes = deux appareils du
   même compte (stockage séparé). Le compte de test est lu dans le fichier servi (CONFIG.nouveautes.comptes_test) ; rien
   ne dépend de la valeur de l'interrupteur dans le fichier (« test » ou « tous ») : la règle du vendredi, quand un bloc
   en a besoin, est posée dans la page (CONFIG.nouveautes.feedback_dimanche = "off"), le fichier servi n'est pas retouché.
   A. deux appareils : le feedback du dimanche envoyé sur le téléphone pendant que Mon suivi est ouvert sur l'ordinateur,
      puis un smiley sur l'ordinateur : l'entrée du téléphone reste en base, la base est relue juste avant d'écrire ;
   B. deux appareils, bilan du vendredi : le formulaire « en retard » resté ouvert depuis jeudi sur l'ordinateur, le bilan
      de la semaine envoyé vendredi depuis le téléphone, puis l'ordinateur envoie le sien : rien n'est perdu, l'écran de
      l'ordinateur prend la version écrite ;
   C. deux appareils, « réponse vue » (fb_vu) : le coach complète sa réponse, le téléphone la voit (fb_vu), puis
      l'ordinateur resté ouvert envoie son feedback : fb_vu reste, la pastille ne revient pas ;
   D. fb_vu dans la fenêtre d'envoi : un autre appareil (simulé en base) écrit pendant l'ouverture de Mon suivi : gardé ;
   E. lecture de checkins ratée (à l'ouverture, ou à la relecture) : fb_vu n'écrit rien, aucun message, la pastille
      « Ton coach a répondu » reste ; smiley : refusé avec le message de lecture ratée ; puis tout repart ;
   F. hors ligne (Q13-6, choix b) : un feedback envoyé hors ligne est gardé sur l'appareil puis renvoyé au retour du
      réseau (comme en v48) ; un smiley est refusé (message) ; fb_vu se tait ;
   G. inactivité (Q13-4) : un smiley ou fb_vu récents ne font pas disparaître « Inactif depuis N j » (Mes clients, fiche,
      tableau de bord, Comptes) ; ancienne entrée sans envoye_a ; entrées à dates piégées (jamais « NaN ») ; de bout en
      bout (le compte de test ouvre Mon suivi, le coach voit toujours « 12 j ») ;
   H. remarque v53 c1 : les réponses de l'autre format d'une entrée (vendredi ↔ dimanche) restent affichées, client et
      coach, « Alimentation » une seule fois ; une entrée sans réponse de l'autre format : affichage d'avant ;
   I. le coach en consultation (Son suivi) : ni lecture en plus, ni écriture de checkins ;
   J. double clic (feedback, smileys) ; K. le seul message possible est traduit ; Z. aucun appel vers l'extérieur.
   Supabase simulé (repris de verif57) : rien ne part vers la vraie base (routage par NOM D'HÔTE) ; règles de la base
   reproduites ; chaque écriture est appliquée en mémoire et notée, chaque lecture de « donnees » aussi (db.journal :
   « L checkins » / « E checkins » dans l'ordre). Pannes : db.lectureKo (lecture outil=eq. en 500), db.retardLecture
   (réponse lente), db.panne (réseau coupé : requêtes abandonnées). Calendrier de verif57 (LUNDI0, jour k). Chaque bloc
   tourne à part (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif63.js ../index.html
           VERIF63_PORT=9791 node verif63.js ../index.html     (autre port, si 9790 est pris)
           VERIF63_BLOCS="A.,G." node verif63.js …              (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF63_PORT || 9790;
const BLOCS = (process.env.VERIF63_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const MOBILE = { width: 390, height: 844 }, ORDI = { width: 1280, height: 900 };

/* ---------- la page servie : le fichier testé tel quel, avec ses fichiers css/ et js/ (fichiers.js) ---------- */
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

/* ---------- dates : toujours relatives au lancement ---------- */
const T0 = Date.now(), MIN = 60000, H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const norm = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "donnees", f), "utf8"));
const CATALOGUE = Object.assign({}, F.catalogue, { aliments: lireDonnees("aliments.json"), recettes: lireDonnees("recettes.json") });
/* jours calendaires LOCAUX (coach, sans horloge) */
const pad = n => String(n).padStart(2, "0");
const isoL = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const ilYA = n => { const d = new Date(T0); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return isoL(d); };

/* ---------- les personnes ---------- */
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: meta } : {}) });
const qui = (id, email, meta) => ({ id, email, session: session(id, email, meta) });
const COACH = qui(F.IDS.coach, "coach@exemple.fr");
const PID = k => "00000000-0000-4000-8000-0000000063" + String(k).padStart(2, "0");   // verif63 : …63kk (une plage par suite)
const INTAKE_THOMAS = clone(F.donnees.find(d => d.user_id === F.IDS.c1 && d.outil === "intake").contenu);

/* ---------- le décor : fixtures.js (coach, Thomas, Sarah, Julien, tous « client ») + les comptes du bloc ----------
   comptes : [{ id, prenom, nom, statut ("prospect" par défaut), cree (instant ISO), email, donnees: [[outil, contenu, maj_le]] }]
   cles : [[user_id, outil, contenu, maj_le]] ajoutées à un compte existant */
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  const donnees = clone(F.donnees);
  donnees.forEach(d => { if (d.user_id === F.IDS.c3) d.maj_le = avant(12 * J + 3 * H); });   // Julien : 12 j entiers pendant toute la suite
  const db = { profils, donnees, ecritures: [], refus: [], lectures: [], journal: [], chemins: [], emails: {}, lectureKo: opts.lectureKo || [], retardLecture: {}, panne: false };
  for (const x of opts.comptes || []) {
    profils.push({ id: x.id, prenom: x.prenom, nom: x.nom || "", role: "client", statut: x.statut || "prospect", cree_le: x.cree || avant(J) });
    if (x.email) db.emails[x.id] = x.email;
    for (const [outil, contenu, maj] of x.donnees || []) donnees.push({ user_id: x.id, outil, contenu: clone(contenu), maj_le: maj || avant(H) });
  }
  for (const [uid, outil, contenu, maj] of opts.cles || []) donnees.push({ user_id: uid, outil, contenu: clone(contenu), maj_le: maj || avant(J) });
  return db;
}

/* ---------- le faux Supabase (repris de verif57) ---------- */
const MAX_LIGNES = 1000;
/* règles de la base (HANDOFF §2.3, policies v49) */
const ILLISIBLES_PROPRIO = ["notes_coach", "suivi_prospect"];
const INTERDITES_PROPRIO = ["feedbacks", "notes_coach", "suivi_prospect"];
const ECRITES_PAR_COACH = ["programme", "repas", "calc", "complements", "hist_programme", "hist_repas", "feedbacks", "notes_coach", "suivi_prospect"];
const permis = (moi, coach, row) => !!moi && (row.user_id === moi ? (coach || !INTERDITES_PROPRIO.includes(row.outil)) : (coach && ECRITES_PAR_COACH.includes(row.outil)));
const externes = new Set();
function ordonner(l, order){
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
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req) || (who && who.id) || null;
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  const lecture = p === "/rest/v1/donnees" && (m === "GET" || m === "HEAD");
  /* réseau coupé (db.panne) : la requête est abandonnée (une lecture de donnees l'est après son éventuel retard) */
  if (db.panne && !lecture) { db.chemins.push("PANNE " + m + " " + p); return r.abort().catch(() => {}); }
  db.chemins.push(m + " " + p);
  if (p.startsWith("/auth/v1/token")) {
    const c = corps() || {}, r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || ""));
    const id = (r1 && r1[1]) || (who && who.id);
    if (!id) return json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
    return json(who && id === who.id ? who.session : session(id, db.emails[id] || ""));
  }
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);   // v56 : testée à part (verif61)
  if (!["GET", "HEAD"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m, corps: corps() });
  if (p.startsWith("/auth/v1/user")) return moi ? json({ id: moi, email: db.emails[moi] || (who && who.id === moi ? who.email : ""), role: "authenticated" }) : json({ msg: "invalid JWT" }, 401);
  if (p.startsWith("/auth/v1/")) return json({});
  if (p.startsWith("/functions/v1/")) return json({ ok: true });
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/emails_prospects") return json([]);
  if (p === "/rest/v1/profils") {
    const id = (q.get("id") || "").replace(/^eq\./, "");
    if (m === "GET" || m === "HEAD") { let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(colonnes(plage(l), q)); }
    db.ecritures.push({ table: "profils", m, id, corps: corps() }); return json([]);
  }
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "";
    const cleEq = o.startsWith("eq.") ? o.slice(3) : null;
    if (lecture) {
      db.lectures.push({ par: moi, uid, outil: o, select: q.get("select") || "*" }); db.journal.push("L " + (cleEq || o));
      if (cleEq && db.retardLecture[cleEq]) await new Promise(z => setTimeout(z, db.retardLecture[cleEq]));   // réponse lente
      if (db.panne) return r.abort().catch(() => {});
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
      const c = corps() || {}, mj = q.get("maj_le");
      const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj == null || (mj === "is.null" ? !x.maj_le : (mj.startsWith("eq.") && x.maj_le === mj.slice(3)))));
      if (!row) return json([]);
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

/* ---------- un navigateur (contexte) pour une personne : un appareil ----------
   opts : viewport (ORDI par défaut, MOBILE), horloge (instant : l'horloge part de là et tourne), fuseau */
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext(Object.assign({ viewport: opts.viewport || ORDI }, opts.fuseau ? { timezoneId: opts.fuseau } : {}));
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
  if (opts.horloge) await c.clock.install({ time: opts.horloge });
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|ERR_INTERNET|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
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
const couvre = (o, k) => { o = String(o || ""); if (!o) return true; if (o.startsWith("eq.")) return o.slice(3) === k; if (o.startsWith("in.")) return liste(o.slice(3)).includes(k); if (o.startsWith("not.in.")) return !liste(o.slice(7)).includes(k); return true; };
const lu = (db, outil, depuis) => db.lectures.slice(depuis || 0).filter(x => couvre(x.outil, outil) && x.select !== "maj_le").length;   // lectures du CONTENU de la clé
const toasts = page => page.evaluate(() => (window.__toasts || []).slice()).catch(() => []);
const LECTURE_RATEE = "Non enregistré : tes données n'ont pas pu être chargées. Recharge la page.";
const badgeSuivi = page => page.evaluate(() => { const x = document.querySelector('#nav a[data-id="suivi"] .fbd-badge'); return x ? x.textContent : null; }).catch(() => null);
/* la copie gardée sur l'appareil (v48 : « mhx_attente|compte|clé »), où qu'elle soit rangée */
const copie = (page, uid, cle) => page.evaluate(k => { for (const m of [localStorage, sessionStorage]) { const v = m.getItem(k); if (v) { try { return JSON.parse(v); } catch (e) { return "illisible"; } } } return null; }, "mhx_attente|" + uid + "|" + cle).catch(() => null);
const espion = page => page.evaluate(() => { if (window.__ecrits) return; window.__ecrits = []; const o = Store.ecrire.bind(Store); Store.ecrire = (cle, v) => { window.__ecrits.push(cle); return o(cle, v); }; });
const ecrits = page => page.evaluate(() => window.__ecrits || []).catch(() => []);
const journalCk = (db, depuis) => db.journal.slice(depuis || 0).filter(x => x === "L checkins" || x === "E checkins");
/* la règle du vendredi dans CE navigateur, quelle que soit la valeur du fichier (le fichier servi n'est pas retouché) */
const vendredi = page => page.evaluate(() => { CONFIG.nouveautes.feedback_dimanche = "off"; });

/* ---------- le décor ---------- */
const SRC = source(HTML);
const TEST_ID = (/comptes_test:\s*\[\s*"([0-9a-f-]{36})"/.exec(SRC) || [])[1] || null;
const TESTEUR = qui(TEST_ID || PID(1), "test@exemple.fr");
const PROG_THOMAS = clone(F.donnees.find(d => d.user_id === F.IDS.c1 && d.outil === "programme").contenu);
const PIEGE = '<img src="x" data-xss="1" onerror="window.__xss=(window.__xss||0)+1">';
/* le calendrier de verif57 : LUNDI0 = un lundi 00:00 UTC, quatre semaines avant la semaine du lancement ; jour k = LUNDI0 + k */
const LUNDI0 = (() => { const d = new Date(T0), j = (d.getUTCDay() + 6) % 7; return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - j - 28); })();
const isoJ = k => new Date(LUNDI0 + k * J).toISOString().slice(0, 10);
const fr = iso => iso.slice(8, 10) + "/" + iso.slice(5, 7) + "/" + iso.slice(0, 4);
const a = (k, h, m, s) => LUNDI0 + k * J + (h || 0) * H + (m || 0) * MIN + (s || 0) * 1000;
const isoA = (k, h, m) => new Date(a(k, h, m)).toISOString();
const entreeDim = (k, note, rep, plus) => Object.assign({ semaine: isoJ(k), fin: isoJ(k + 6), envoye_le: isoJ(k + 6), envoye_a: isoA(k + 6, 18), format: "dimanche",
  reponses: Object.assign({ note: note, training: "", alimentation: "", autre: "" }, rep || {}) }, plus || {});
const REP_VEN = { semaine: "Bonne semaine, un peu fatigué jeudi.", energie: 4, motivation: 4, sommeil: 3, stress: 2, seances: 4, alimentation: "Bien, sauf samedi soir.", reussite: "4 séances tenues", difficulte: "Le sommeil", ajustement: "Non", ajustement_detail: "" };
const entreeVen = (k, plus) => Object.assign({ semaine: isoJ(k), fin: isoJ(k + 6), envoye_le: isoJ(k + 6), reponses: clone(REP_VEN) }, plus || {});
const fbk = (k, texte, plus) => Object.assign({ semaine: isoJ(k), fin: isoJ(k + 6), date: isoJ(k + 7), texte: texte, ecrit_a: isoA(k + 7, 9) }, plus || {});
function compteTest(ck, fb){
  const d = [["intake", INTAKE_THOMAS], ["programme", PROG_THOMAS], ["prefs", { langue: "fr" }]];
  if (ck) d.push(["checkins", ck]);
  if (fb) d.push(["feedbacks", fb]);
  return { id: TESTEUR.id, prenom: "", nom: "", statut: "client", cree: avant(40 * J), email: "test@exemple.fr", donnees: d };
}
const contenu = (db, outil, uid) => (db.donnees.find(x => x.user_id === uid && x.outil === outil) || {}).contenu;
const poser = (db, uid, outil, c) => { const i = db.donnees.findIndex(d => d.user_id === uid && d.outil === outil); const l = { user_id: uid, outil, contenu: clone(c), maj_le: new Date().toISOString() }; if (i > -1) db.donnees[i] = l; else db.donnees.push(l); };
const egal = (x, y) => JSON.stringify(x) === JSON.stringify(y);
const ckDe = db => contenu(db, "checkins", TESTEUR.id) || {};
const semainesDe = CK => (Array.isArray(CK.liste) ? CK.liste : []).map(x => x && x.semaine);
let URL0 = "";
/* un appareil réglé sur le jour k à h:m (fuseau UTC) */
async function sur(b, who, db, k, h, m, hash, sel, opts){
  const { c, page } = await contexte(b, who, db, Object.assign({ horloge: a(k, h, m), fuseau: "UTC" }, opts || {}));
  await page.goto(URL0 + (hash || "")); await pret(page, sel);
  return { c, page };
}
async function fiche(page, uid, nom, cible, sel){
  await page.evaluate(([id, n, cb]) => Clients.ouvrir(id, n, cb), [uid, nom, cible]);
  await page.waitForSelector(sel, { timeout: 10000, state: "attached" }); await attendre(page, 700);
}
const voir = async (page, id) => { await page.evaluate(x => afficher(x), id); await attendre(page, 700); };
const heure = async (page, t) => { await page.clock.setSystemTime(t); };
/* la ligne d'un compte dans Mes clients : { colonne (data-l) : texte, _point : l'info-bulle du feu } */
const ligneClient = (page, uid) => page.$eval(`#tb-clients [data-ouvrir="${uid}"]`, bt => { const o = {}; const tr = bt.closest("tr"); tr.querySelectorAll("td").forEach(td => { o[td.dataset.l || "_"] = td.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim(); }); o._point = (tr.querySelector(".point") || {}).title || ""; return o; }).catch(() => ({}));
/* la ligne d'un compte dans « Comptes » : { etat (actif / pas encore utilisé), meta } */
const ligneCompte = (page, nom) => page.$$eval("#liste-clients .client-l", (l, n) => { const x = l.find(e => (e.querySelector(".nom") || {}).textContent.trim().startsWith(n)); if (!x) return null; const ps = Array.from(x.querySelectorAll(".pastille")).map(p => p.textContent.trim()); return { etats: ps, meta: (x.querySelector(".meta") || {}).textContent.trim() }; }, nom).catch(() => null);
const alertesFiche = page => page.$$eval("#vue .masthead .attention-alertes .pastille", l => l.map(e => e.textContent.trim())).catch(() => []);
const tuile = (page, lbl) => page.$$eval("#vue .tile", (l, t) => { const x = l.find(e => (e.querySelector(".t-lbl") || {}).textContent.trim() === t); return x ? { val: x.querySelector(".t-val").textContent.replace(/\s+/g, "").trim(), sub: x.querySelector(".t-sub").textContent.trim() } : null; }, lbl).catch(() => null);
const aTraiterTb = page => page.$$eval("#tb-a-traiter .tb-liste li", l => l.map(li => li.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim())).catch(() => []);
/* les libellés « alimentation » (vendredi : la question ; dimanche : « Alimentation ») dans une zone */
const alim = (page, sel) => page.$$eval(sel + " .checkin-rep .lbl", l => l.map(e => e.textContent.trim()).filter(t => t === "Alimentation" || t === "Comment s'est passée ton alimentation ?").length).catch(() => -1);
const blocSemaine = (page, s) => page.evaluate(x => { const ed = document.querySelector(`#bilan-vue [data-fb-semaine="${x}"]`), d = ed && ed.closest("details"); return d ? { t: d.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim(), ech: d.querySelectorAll(".checkin-echelles .pastille:not(.fbd-note)").length, rep: d.querySelectorAll(".checkin-rep").length, note: !!d.querySelector(".fbd-note"),
  alim: Array.from(d.querySelectorAll(".checkin-rep .lbl")).map(e => e.textContent.trim()).filter(t => t === "Alimentation" || t === "Comment s'est passée ton alimentation ?").length } : null; }, s).catch(() => null);

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF63_PORT=9791 node verif63.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();
  URL0 = `http://localhost:${PORT}/`;

  /* =================== A. deux appareils : feedback du dimanche puis smiley =================== */
  await bloc("A. deux appareils : feedback sur le téléphone, smiley sur l'ordinateur", async () => {
    ok("A : le compte de test est lu dans le fichier servi (un identifiant, aucun « @ » dans comptes_test)", !!TEST_ID && !/comptes_test:[^\]]*@/.test(SRC), String(TEST_ID));
    const e7 = entreeDim(7, 8, { training: "Semaine 7" }), f7 = fbk(7, "Bravo pour ta semaine 7.", { bilan: e7.envoye_a });
    const db = base({ comptes: [compteTest({ liste: [e7], fb_vu: f7.ecrit_a }, { liste: [f7] })] });
    /* l'ordinateur : Mon suivi ouvert dimanche matin (formulaire de la semaine, la réponse de la semaine 7 déjà vue) */
    const { page: po } = await sur(b, TESTEUR, db, 20, 10, 0, "#/suivi", "#suivi-checkin [data-fbd]");
    /* le téléphone : le feedback de la semaine */
    const { page: pt } = await sur(b, TESTEUR, db, 20, 10, 2, "#/suivi", "#suivi-checkin [data-fbd]", { viewport: MOBILE });
    await pt.click('.note10 [data-v="7"]'); await pt.fill("#fbd-training", "Deux séances, genou ok");
    await pt.click("[data-fbd] button[type=submit]"); await attendre(pt, 1500);
    const e14 = clone((ckDe(db).liste || []).find(x => x && x.semaine === isoJ(14)) || null);
    ok("A : le téléphone envoie son feedback : une écriture, la semaine 14 en base (note 7)", ecr(db, "checkins").length === 1 && egal(semainesDe(ckDe(db)), [isoJ(7), isoJ(14)]) && !!e14 && e14.reponses.note === 7 && e14.reponses.training === "Deux séances, genou ok", resume(db) + " " + JSON.stringify(ckDe(db)).slice(0, 300));
    /* l'ordinateur, resté ouvert : un smiley sur la réponse de la semaine 7 (historique) */
    await po.evaluate(() => document.querySelectorAll("#suivi-checkin details.hist-entree").forEach(d => { d.open = true; }));
    const j0 = db.journal.length;
    await po.click(`[data-avis-semaine="${isoJ(7)}"] [data-smiley="content"]`); await attendre(po, 1300);
    const CK = ckDe(db), av = Array.isArray(CK.avis) ? CK.avis : [];
    ok("A : smiley sur l'ordinateur : l'entrée envoyée par le téléphone reste en base (semaines 7 et 14, la 14 telle que le téléphone l'a écrite), un seul avis (😊 sur la réponse de la semaine 7), fb_vu inchangé",
      ecr(db, "checkins").length === 2 && egal(CK.liste, [e7, e14]) && av.length === 1 && av[0].semaine === isoJ(7) && av[0].fb === f7.ecrit_a && av[0].smiley === "content" && CK.fb_vu === f7.ecrit_a, JSON.stringify(CK).slice(0, 500));
    ok("A : … la base est relue juste avant d'écrire (une lecture de checkins, puis l'écriture)", egal(journalCk(db, j0), ["L checkins", "E checkins"]), JSON.stringify(journalCk(db, j0)));
    const bt = await po.evaluate(s => { const b = document.querySelector(`[data-avis-semaine="${s}"] [data-smiley="content"]`), m = document.querySelector(`[data-avis-semaine="${s}"] [data-avis-msg]`); return { p: b && b.getAttribute("aria-pressed"), m: m && m.textContent }; }, isoJ(7));
    ok("A : … le bouton est choisi, « Merci, c'est noté. »", bt.p === "true" && bt.m === "Merci, c'est noté.", JSON.stringify(bt));
    /* l'ordinateur envoie ensuite son propre feedback de la semaine (formulaire resté ouvert) */
    await po.click('.note10 [data-v="9"]'); await po.click("[data-fbd] button[type=submit]"); await attendre(po, 1500);
    const CK2 = ckDe(db), n14 = (CK2.liste || []).find(x => x && x.semaine === isoJ(14)) || {};
    ok("A : puis l'ordinateur envoie son feedback de la même semaine : le plus récent gagne (note 9), la semaine 7 et l'avis gardés", ecr(db, "checkins").length === 3 && egal(semainesDe(CK2), [isoJ(7), isoJ(14)]) && egal(CK2.liste[0], e7) && n14.reponses && n14.reponses.note === 9 && Array.isArray(CK2.avis) && CK2.avis.length === 1 && CK2.avis[0].smiley === "content", JSON.stringify(CK2).slice(0, 500));
  });

  /* =================== B. deux appareils : bilan du vendredi =================== */
  await bloc("B. deux appareils : bilan du vendredi", async () => {
    const e0 = entreeVen(0);
    const db = base({ comptes: [compteTest({ liste: [e0] }, null)] });
    /* l'ordinateur, jeudi soir : Mon suivi ouvert sur le bilan de la semaine passée (en retard) */
    const { page: po } = await sur(b, TESTEUR, db, 17, 20, 0, "", "#acc-vue h1");
    await vendredi(po); await aller(po, "#/suivi", 1500);
    const s0 = await po.$eval("[data-checkin]", f => f.dataset.semaine).catch(() => null);
    /* le téléphone, vendredi matin : le bilan de la semaine */
    const { page: pt } = await sur(b, TESTEUR, db, 18, 10, 0, "", "#acc-vue h1", { viewport: MOBILE });
    await vendredi(pt); await aller(pt, "#/suivi", 1500);
    const s1 = await pt.$eval("[data-checkin]", f => f.dataset.semaine).catch(() => null);
    for (const g of await pt.$$("[data-checkin] .echelle5")) { const bt = await g.$$("button"); await bt[3].click(); }
    await pt.fill('[data-checkin] textarea[data-q="semaine"]', "Envoyé du téléphone");
    await pt.click("[data-checkin] button[type=submit]"); await attendre(pt, 1500);
    const e14 = clone((ckDe(db).liste || []).find(x => x && x.semaine === isoJ(14)) || null);
    ok(`B : jeudi, l'ordinateur affiche le bilan de la semaine du ${fr(isoJ(7))} (en retard) ; vendredi, le téléphone envoie celui de la semaine du ${fr(isoJ(14))} : une écriture`,
      s0 === isoJ(7) && s1 === isoJ(14) && ecr(db, "checkins").length === 1 && egal(semainesDe(ckDe(db)), [isoJ(0), isoJ(14)]) && !!e14 && !("format" in e14), s0 + " " + s1 + " " + resume(db));
    /* l'ordinateur, vendredi 10:05 : il envoie le bilan resté ouvert */
    await heure(po, a(18, 10, 5));
    for (const g of await po.$$("[data-checkin] .echelle5")) { const bt = await g.$$("button"); await bt[2].click(); }
    await po.fill('[data-checkin] textarea[data-q="semaine"]', "Envoyé de l'ordinateur");
    await po.click("[data-checkin] button[type=submit]"); await attendre(po, 1500);
    const CK = ckDe(db), e7 = (CK.liste || []).find(x => x && x.semaine === isoJ(7)) || {};
    ok("B : puis l'ordinateur envoie le sien : rien n'est perdu en base (semaines 0, 7 et 14 ; la 14 telle que le téléphone l'a écrite ; la 7 sans « format »)",
      ecr(db, "checkins").length === 2 && egal(semainesDe(CK), [isoJ(0), isoJ(7), isoJ(14)]) && egal(CK.liste[0], e0) && egal(CK.liste[2], e14) && e7.reponses && e7.reponses.semaine === "Envoyé de l'ordinateur" && e7.reponses.energie === 3 && !("format" in e7) && e7.envoye_le === isoJ(18), JSON.stringify(CK).slice(0, 600));
    const t = await texte(po, "#suivi-checkin");
    ok("B : l'écran de l'ordinateur prend la version écrite : « Bilan de la semaine envoyé » (celui du téléphone), plus de formulaire ; les semaines 7 et 0 dans l'historique",
      t.includes("Bilan de la semaine envoyé") && t.includes("Envoyé du téléphone") && !(await po.$("[data-checkin]")) && t.includes(`Semaine du ${fr(isoJ(7))}`) && t.includes(`Semaine du ${fr(isoJ(0))}`), t.slice(0, 400));
    ok("B : message « Bilan envoyé. Ton coach le lira avant votre prochain échange. »", (await toasts(po)).some(x => x.includes("Bilan envoyé. Ton coach le lira avant votre prochain échange.")), JSON.stringify(await toasts(po)));
  });

  /* =================== C. deux appareils : fb_vu =================== */
  await bloc("C. deux appareils : « réponse vue » (fb_vu) gardée", async () => {
    const e7 = entreeDim(7, 8), f7 = fbk(7, "Première réponse.", { bilan: e7.envoye_a });
    const db = base({ comptes: [compteTest({ liste: [e7], fb_vu: f7.ecrit_a }, { liste: [f7] })] });
    const { page: po } = await sur(b, TESTEUR, db, 20, 10, 0, "#/suivi", "#suivi-checkin [data-fbd]");
    /* le coach complète sa réponse de la semaine 7 (nouvel ecrit_a) */
    const V2 = isoA(20, 9, 30);
    poser(db, TESTEUR.id, "feedbacks", { liste: [Object.assign({}, f7, { texte: "Réponse complétée.", date: isoJ(20), ecrit_a: V2 })] });
    const { c: ct, page: pt } = await sur(b, TESTEUR, db, 20, 10, 5, "#/suivi", "#suivi-checkin [data-fbd]", { viewport: MOBILE });
    await attendre(pt, 1200);
    ok("C : le téléphone ouvre Mon suivi : la réponse complétée est vue, fb_vu écrit (une écriture)", ecr(db, "checkins").length === 1 && ckDe(db).fb_vu === V2, resume(db) + " " + ckDe(db).fb_vu);
    await po.click('.note10 [data-v="6"]'); await po.click("[data-fbd] button[type=submit]"); await attendre(po, 1500);
    const CK = ckDe(db);
    ok("C : puis l'ordinateur (ouvert avant) envoie son feedback : fb_vu garde la réponse complétée, semaines 7 et 14", ecr(db, "checkins").length === 2 && CK.fb_vu === V2 && egal(semainesDe(CK), [isoJ(7), isoJ(14)]) && egal(CK.liste[0], e7), JSON.stringify(CK).slice(0, 400));
    await aller(pt, "#/programme", 400); await pt.reload(); await pret(pt, null); await attendre(pt, 1500);   // rechargé sur Mon programme : la pastille vient de la base
    ok("C : le téléphone rechargé (Mon programme) : la pastille « Ton coach a répondu » ne revient pas", (await badgeSuivi(pt)) === null, String(await badgeSuivi(pt)));
    await ct.close().catch(() => {});
  });

  /* =================== D. fb_vu : un autre appareil écrit pendant l'ouverture =================== */
  await bloc("D. fb_vu : fenêtre d'envoi", async () => {
    const e14 = entreeDim(14, 7), f14 = fbk(14, "Réponse récente.", { date: isoJ(22), ecrit_a: isoA(22, 9), bilan: e14.envoye_a });
    const db = base({ comptes: [compteTest({ liste: [e14] }, { liste: [f14] })] });
    const { page } = await sur(b, TESTEUR, db, 23, 10, 0, "#/programme", null);
    await attendre(page, 1200);
    db.retardLecture.checkins = 1200;   // réseau lent : chaque lecture de checkins met 1,2 s
    await page.evaluate(() => { location.hash = "#/suivi"; });
    await page.waitForSelector("#suivi-checkin .fbd", { timeout: 10000 });
    /* dès que Mon suivi est dessiné, un autre appareil écrit (simulé en base) */
    const row = db.donnees.find(d => d.user_id === TESTEUR.id && d.outil === "checkins");
    row.contenu = Object.assign(clone(row.contenu), { liste: [entreeDim(7, 9)].concat(clone(row.contenu.liste)), x_autre: "garde" }); row.maj_le = new Date().toISOString();
    await attendre(page, 3600);
    const CK = ckDe(db);
    ok("D : ce que l'autre appareil a écrit pendant l'ouverture de Mon suivi reste en base (semaine 7, x_autre), et fb_vu est écrit (une écriture)", ecr(db, "checkins").length === 1 && egal(semainesDe(CK), [isoJ(7), isoJ(14)]) && CK.x_autre === "garde" && CK.fb_vu === f14.ecrit_a, resume(db) + " " + JSON.stringify(CK).slice(0, 300));
  });

  /* =================== E. lecture de checkins ratée =================== */
  const e14 = entreeDim(14, 7), f14 = fbk(14, "Réponse récente.", { date: isoJ(22), ecrit_a: isoA(22, 9), bilan: e14.envoye_a });
  await bloc("E. lecture ratée à l'ouverture de Mon suivi (remarque v53 c2)", async () => {
    const db = base({ lectureKo: ["checkins"], comptes: [compteTest({ liste: [e14] }, { liste: [f14] })] });
    const { page } = await sur(b, TESTEUR, db, 23, 10, 0, "#/programme", null);
    await attendre(page, 1500);
    ok("E : arrivée sur Mon programme : la pastille « 1 » (Ton coach a répondu)", (await badgeSuivi(page)) === "1", String(await badgeSuivi(page)));
    await espion(page);
    await aller(page, "#/suivi", 2200);
    const ts = await toasts(page), es = await ecrits(page);
    ok("E : lecture de checkins ratée à l'ouverture de Mon suivi : aucun message « Non enregistré », aucune tentative d'écriture (ni Store.ecrire, ni requête)", !ts.some(x => x.includes("Non enregistré")) && es.indexOf("checkins") === -1 && ecr(db, "checkins").length === 0, JSON.stringify(ts) + " " + JSON.stringify(es) + " " + resume(db));
    ok("E : … la pastille « Ton coach a répondu » reste allumée (fb_vu n'est pas écrit)", (await badgeSuivi(page)) === "1", String(await badgeSuivi(page)));
    db.lectureKo = [];
    await page.reload(); await pret(page, null); await aller(page, "#/suivi", 2000);
    ok("E : la lecture revenue, Mon suivi rouvert : une écriture, fb_vu = la réponse, la liste intacte, la pastille éteinte", ecr(db, "checkins").length === 1 && ckDe(db).fb_vu === f14.ecrit_a && egal(ckDe(db).liste, [e14]) && (await badgeSuivi(page)) === null, resume(db) + " " + String(await badgeSuivi(page)));
  });
  await bloc("E2. relecture ratée juste avant d'écrire fb_vu", async () => {
    const db = base({ comptes: [compteTest({ liste: [e14] }, { liste: [f14] })] });
    const { page } = await sur(b, TESTEUR, db, 23, 10, 0, "#/programme", null);
    await attendre(page, 1200); await espion(page);
    db.retardLecture.checkins = 800;
    await page.evaluate(() => { location.hash = "#/suivi"; });
    await page.waitForSelector("#suivi-checkin .fbd", { timeout: 10000 });
    db.lectureKo = ["checkins"];   // la lecture de l'ouverture est passée ; la relecture (partie à l'instant, lente) échoue
    await attendre(page, 2600);
    const ts = await toasts(page);
    ok("E2 : relecture ratée : rien n'est écrit, aucun message « Non enregistré », la pastille « 1 » reste (ou revient)", ecr(db, "checkins").length === 0 && !ts.some(x => x.includes("Non enregistré")) && (await badgeSuivi(page)) === "1", resume(db) + " " + JSON.stringify(ts) + " " + String(await badgeSuivi(page)));
    db.lectureKo = []; db.retardLecture = {};
    await aller(page, "#/programme", 400); await aller(page, "#/suivi", 2000);
    ok("E2 : la lecture revenue, Mon suivi rouvert : une écriture de fb_vu, la pastille éteinte", ecr(db, "checkins").length === 1 && ckDe(db).fb_vu === f14.ecrit_a && (await badgeSuivi(page)) === null, resume(db));
  });
  await bloc("E3. smiley : relecture ratée", async () => {
    const db = base({ comptes: [compteTest({ liste: [e14], fb_vu: f14.ecrit_a }, { liste: [f14] })] });
    const { page } = await sur(b, TESTEUR, db, 22, 10, 0, "#/suivi", "#suivi-checkin [data-smiley]");
    db.lectureKo = ["checkins"];
    await page.click('.fbd-reponse [data-smiley="content"]'); await attendre(page, 1300);
    const st = await page.evaluate(() => ({ p: document.querySelector('.fbd-reponse [data-smiley="content"]').getAttribute("aria-pressed"), m: document.querySelector(".fbd-reponse [data-avis-msg]").textContent }));
    ok("E3 : smiley quand la relecture échoue : rien n'est écrit, le bouton n'est pas choisi, message « " + LECTURE_RATEE + " »", ecr(db, "checkins").length === 0 && st.p === "false" && st.m === "" && (await toasts(page)).some(x => x.includes(LECTURE_RATEE)), resume(db) + " " + JSON.stringify(st) + " " + JSON.stringify(await toasts(page)));
    db.lectureKo = [];
    const n0 = ecr(db, "checkins").length;
    await page.click('.fbd-reponse [data-smiley="content"]'); await attendre(page, 1300);
    const av = ckDe(db).avis || [];
    ok("E3 : la lecture revenue, nouveau clic : une écriture de plus, l'avis 😊, le bouton choisi", ecr(db, "checkins").length === n0 + 1 && av.length === 1 && av[0].smiley === "content" && egal(ckDe(db).liste, [e14]) && (await page.$eval('.fbd-reponse [data-smiley="content"]', x => x.getAttribute("aria-pressed"))) === "true", resume(db) + " " + JSON.stringify(av));
  });

  /* =================== F. hors ligne (Q13-6, choix b) =================== */
  await bloc("F. hors ligne : le feedback gardé sur l'appareil, renvoyé au retour du réseau", async () => {
    const e7 = entreeDim(7, 8);
    const db = base({ comptes: [compteTest({ liste: [e7] }, null)] });
    db.donnees.forEach(d => { if (d.user_id === TESTEUR.id) d.maj_le = isoA(19, 10); });   // la base date d'avant l'horloge de l'appareil (jour 20) : la copie est bien plus récente
    const { page } = await sur(b, TESTEUR, db, 20, 10, 0, "#/suivi", "#suivi-checkin [data-fbd]");
    db.panne = true;
    await page.click('.note10 [data-v="6"]'); await page.fill("#fbd-training", "Écrit hors ligne");
    await page.click("[data-fbd] button[type=submit]"); await attendre(page, 1800);
    const cp = await copie(page, TESTEUR.id, "checkins"), l = (cp && cp.v && Array.isArray(cp.v.liste)) ? cp.v.liste : [];
    const n = l.find(x => x && x.semaine === isoJ(14)) || {};
    ok("F : hors ligne (relecture impossible) : le feedback est gardé sur l'appareil (semaine 14, note 6, la semaine 7 avec), « gardé sur cet appareil », rien n'arrive en base",
      egal(l.map(x => x.semaine), [isoJ(7), isoJ(14)]) && n.reponses && n.reponses.note === 6 && n.reponses.training === "Écrit hors ligne" && (await texte(page, "#etat")).includes("gardé sur cet appareil") && ecr(db, "checkins").length === 0, JSON.stringify(cp).slice(0, 300) + " · " + (await texte(page, "#etat")));
    ok("F : … le message « Feedback envoyé. Ton coach te répond ici, juste en dessous. » et son feedback affiché (comme en v48)", (await toasts(page)).some(x => x.includes("Feedback envoyé. Ton coach te répond ici, juste en dessous.")) && (await texte(page, "#suivi-checkin")).includes("Note de la semaine 6/10"), JSON.stringify(await toasts(page)));
    db.panne = false;
    await page.evaluate(() => window.dispatchEvent(new Event("online"))); await attendre(page, 2500);
    const CK = ckDe(db), m14 = (CK.liste || []).find(x => x && x.semaine === isoJ(14)) || {};
    ok("F : retour du réseau : le feedback repart de lui-même et arrive (une écriture, semaines 7 et 14), la copie est retirée", ecr(db, "checkins").length === 1 && egal(semainesDe(CK), [isoJ(7), isoJ(14)]) && m14.reponses && m14.reponses.note === 6 && (await copie(page, TESTEUR.id, "checkins")) === null, resume(db) + " " + JSON.stringify(CK).slice(0, 300));
  });
  await bloc("F2. hors ligne : smiley refusé, fb_vu silencieux", async () => {
    const db = base({ comptes: [compteTest({ liste: [e14], fb_vu: f14.ecrit_a }, { liste: [f14] })] });
    const { page } = await sur(b, TESTEUR, db, 22, 10, 0, "#/suivi", "#suivi-checkin [data-smiley]");
    db.panne = true;
    await page.click('.fbd-reponse [data-smiley="content"]'); await attendre(page, 1500);
    const p = await page.$eval('.fbd-reponse [data-smiley="content"]', x => x.getAttribute("aria-pressed"));
    ok("F2 : smiley hors ligne : refusé (bouton pas choisi, rien gardé sur l'appareil, rien en base), message « " + LECTURE_RATEE + " »", p === "false" && (await copie(page, TESTEUR.id, "checkins")) === null && ecr(db, "checkins").length === 0 && (await toasts(page)).some(x => x.includes(LECTURE_RATEE)), p + " " + JSON.stringify(await toasts(page)));
    const db2 = base({ comptes: [compteTest({ liste: [e14] }, { liste: [f14] })] });
    const { page: p2 } = await sur(b, TESTEUR, db2, 23, 10, 0, "#/programme", null);
    await attendre(p2, 1200);
    db2.retardLecture.checkins = 800;
    await p2.evaluate(() => { location.hash = "#/suivi"; });
    await p2.waitForSelector("#suivi-checkin .fbd", { timeout: 10000 });
    db2.panne = true;   // le réseau tombe pendant la relecture
    await attendre(p2, 2600);
    ok("F2 : fb_vu hors ligne : rien d'écrit ni gardé sur l'appareil, aucun message « Non enregistré », la pastille « 1 » reste", ecr(db2, "checkins").length === 0 && (await copie(p2, TESTEUR.id, "checkins")) === null && !(await toasts(p2)).some(x => x.includes("Non enregistré")) && (await badgeSuivi(p2)) === "1", resume(db2) + " " + JSON.stringify(await toasts(p2)) + " " + String(await badgeSuivi(p2)));
  });

  /* =================== G. inactivité : seules les vraies saisies comptent =================== */
  await bloc("G. « Inactif depuis N j » : ni smiley ni fb_vu", async () => {
    const J12 = avant(12 * J + 3 * H);
    const CHLOE = PID(10), LEON = PID(11), NINA = PID(12), OSCAR = PID(13);
    const ent = (envoye_a, envoye_le) => { const o = { semaine: ilYA(20), fin: ilYA(14), envoye_le: envoye_le, format: "dimanche", reponses: { note: 7, training: "", alimentation: "", autre: "" } }; if (envoye_a !== undefined) o.envoye_a = envoye_a; return o; };
    const intake = n => ({ nom: n, complet: true, age: 30, sexe: "Femme" });
    const db = base({
      comptes: [
        { id: CHLOE, prenom: "Chloé", nom: "Récente", statut: "client", cree: avant(40 * J), donnees: [["intake", intake("Chloé Récente"), avant(20 * J)], ["checkins", { liste: [ent(avant(2 * H), isoL(new Date(T0 - 2 * H)))] }, avant(2 * H)]] },
        { id: LEON, prenom: "Léon", nom: "Ancien", statut: "client", cree: avant(40 * J), donnees: [["intake", intake("Léon Ancien"), avant(20 * J)], ["checkins", { liste: [ent(undefined, ilYA(4))], fb_vu: avant(H) }, avant(H)]] },
        { id: NINA, prenom: "Nina", nom: "Piégée", statut: "client", cree: avant(40 * J), donnees: [["checkins", { liste: [{ semaine: "x", envoye_a: {}, envoye_le: {} }, { semaine: 3, envoye_a: "x", envoye_le: "2026-13-45" }, { envoye_a: 5, envoye_le: 7 }, { envoye_a: "2026-99-99T99:99", envoye_le: "hier" }], fb_vu: avant(H), avis: [{ semaine: "x", fb: "y", smiley: "content", le: avant(H) }] }, avant(H)]] },
        { id: OSCAR, prenom: "Oscar", nom: "Liste", statut: "client", cree: avant(40 * J), donnees: [["intake", intake("Oscar Liste"), avant(15 * J + 3 * H)], ["checkins", { liste: "x", fb_vu: avant(H) }, avant(H)]] }
      ],
      /* Julien : toutes ses clés il y a 12 j ; son dernier feedback aussi, mais un smiley et « réponse vue » il y a 1 h */
      cles: [[F.IDS.c3, "checkins", { liste: [ent(J12, isoL(new Date(Date.parse(J12))))], avis: [{ semaine: ilYA(20), fb: "x", smiley: "content", le: avant(H) }], fb_vu: avant(H) }, avant(H)]]
    });
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/clients"); await page.waitForSelector(`#tb-clients [data-ouvrir="${F.IDS.c3}"]`, { timeout: 10000 }); await attendre(page, 800);
    const Ju = await ligneClient(page, F.IDS.c3), Ch = await ligneClient(page, CHLOE), Le = await ligneClient(page, LEON), Ni = await ligneClient(page, NINA), Os = await ligneClient(page, OSCAR);
    ok("G : Mes clients : Julien (dernier feedback il y a 12 j, smiley et « réponse vue » il y a 1 h) garde « 12 j » et l'alerte « Inactif depuis 12 j »", Ju["Activité"] === "12 j" && Ju._point.includes("Inactif depuis 12 j"), JSON.stringify(Ju));
    ok("G : contre-épreuve : Chloé (feedback envoyé il y a 2 h) « aujourd'hui », sans alerte d'inactivité", Ch["Activité"] === "aujourd'hui" && !/Inactif|Jamais rien saisi/.test(Ch._point), JSON.stringify(Ch));
    const nLeon = Math.floor((Date.now() - new Date(ilYA(4) + "T00:00:00").getTime()) / J);
    ok(`G : Léon (ancienne entrée sans envoye_a, envoyée le ${fr(ilYA(4))} ; « réponse vue » il y a 1 h) : compté du jour de l'envoi, « il y a ${nLeon} j »`, Le["Activité"] === "il y a " + nLeon + " j", JSON.stringify(Le));
    ok("G : Nina (seulement des dates piégées, un smiley et fb_vu) : « jamais » et « Jamais rien saisi » ; Oscar (liste piégée, fb_vu il y a 1 h) : « 15 j », « Inactif depuis 15 j »", Ni["Activité"] === "jamais" && Ni._point.includes("Jamais rien saisi") && Os["Activité"] === "15 j" && Os._point.includes("Inactif depuis 15 j"), JSON.stringify([Ni, Os]));
    const tout = await texte(page, "#vue");
    ok("G : Mes clients : jamais « NaN », « undefined » ni « Invalid Date »", !/NaN|undefined|Invalid Date/.test(tout), (tout.match(/.{0,40}(NaN|undefined|Invalid Date).{0,40}/) || [""])[0]);
    const dJu = await page.evaluate(x => new Date(x).toLocaleDateString("fr-FR"), J12);
    const cJu = await ligneCompte(page, "Julien Démo"), cNi = await ligneCompte(page, "Nina Piégée");
    ok(`G : Comptes : Julien « dernière saisie : ${dJu} » ; Nina « pas encore utilisé », « dernière saisie : jamais »`, !!cJu && cJu.meta === "dernière saisie : " + dJu && !!cNi && cNi.etats.includes("pas encore utilisé") && cNi.meta === "dernière saisie : jamais", JSON.stringify([cJu, cNi]));
    await fiche(page, F.IDS.c3, "Julien Démo", "accueil", "#vue .masthead");
    const al = await alertesFiche(page), tu = await tuile(page, "Activité");
    ok("G : fiche de Julien : « Inactif depuis 12 j » dans l'en-tête, tuile « Activité » 12 j", al.includes("Inactif depuis 12 j") && !!tu && tu.val === "12j" && tu.sub === "depuis sa dernière saisie", JSON.stringify([al, tu]));
    await aller(page, "#/clients", 1500);
    await fiche(page, NINA, "Nina Piégée", "accueil", "#vue .masthead");
    const alN = await alertesFiche(page), tuN = await tuile(page, "Activité");
    ok("G : fiche de Nina (dates piégées) : « Jamais rien saisi », tuile « — » « jamais rien saisi »", alN.includes("Jamais rien saisi") && !!tuN && tuN.val === "—" && tuN.sub === "jamais rien saisi" && !/NaN/.test(await texte(page, "#vue")), JSON.stringify([alN, tuN]));
    await page.click("#sortir-fiche").catch(() => {}); await attendre(page, 600);
    await aller(page, "#/tableau", 2400);
    const L = (await aTraiterTb(page)).filter(t => t.includes("Julien Démo"));
    ok("G : tableau de bord, « À traiter maintenant » : Julien « Inactif depuis 12 j »", L.length === 1 && L[0].includes("Inactif depuis 12 j"), JSON.stringify(await aTraiterTb(page)));
    ok("G : afficher n'écrit rien", db.ecritures.length === 0, resume(db));
  });
  await bloc("G2. de bout en bout : le compte de test ouvre Mon suivi, le coach voit toujours « 12 j »", async () => {
    const J12 = avant(12 * J + 3 * H);
    const env = { semaine: ilYA(19), fin: ilYA(13), envoye_le: isoL(new Date(Date.parse(J12))), envoye_a: J12, format: "dimanche", reponses: { note: 7, training: "Bien", alimentation: "", autre: "" } };
    const fb = { semaine: ilYA(19), fin: ilYA(13), date: ilYA(1), texte: "Réponse d'hier.", ecrit_a: avant(J) };
    const db = base({ comptes: [{ id: TESTEUR.id, prenom: "", nom: "", statut: "client", cree: avant(40 * J), email: "test@exemple.fr",
      donnees: [["intake", INTAKE_THOMAS, J12], ["programme", PROG_THOMAS, J12], ["prefs", { langue: "fr" }, J12], ["checkins", { liste: [env] }, J12], ["feedbacks", { liste: [fb] }, avant(J)]] }] });
    const { page: pc } = await contexte(b, TESTEUR, db);
    await pc.goto(URL0 + "#/suivi"); await pret(pc, "#suivi-checkin .fbd"); await attendre(pc, 1800);
    const ecrClient = db.ecritures.filter(e => e.table === "donnees").map(e => e.outil);
    ok("G2 : le compte de test ouvre Mon suivi : fb_vu écrit (une écriture de checkins ; ni saisie ni autre clé, hors visites)", ecr(db, "checkins").length === 1 && ckDe(db).fb_vu === fb.ecrit_a && ecrClient.every(o => o === "checkins" || o === "activite"), JSON.stringify(ecrClient));
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/clients"); await page.waitForSelector(`#tb-clients [data-ouvrir="${TESTEUR.id}"]`, { timeout: 10000 }); await attendre(page, 800);
    const T = await ligneClient(page, TESTEUR.id);
    ok("G2 : puis le coach, Mes clients : le compte de test garde « 12 j » et « Inactif depuis 12 j »", T["Activité"] === "12 j" && T._point.includes("Inactif depuis 12 j"), JSON.stringify(T));
  });

  /* =================== H. remarque v53 c1 : les réponses de l'autre format =================== */
  await bloc("H. un bilan du vendredi complété le dimanche", async () => {
    const db = base({ comptes: [compteTest({ liste: [entreeVen(14)] }, null)] });
    const { page } = await sur(b, TESTEUR, db, 20, 10, 0, "#/suivi", "#suivi-checkin [data-fbd-modifier]");
    let t = await texte(page, "#suivi-checkin");
    ok("H : dimanche, son bilan du vendredi de la semaine : lisible (« 4 séances tenues », « Énergie 4/5 »), « Modifier mon feedback »", t.includes("4 séances tenues") && t.includes("Énergie 4/5") && !t.includes("Note de la semaine") && !!(await page.$("[data-fbd-modifier]")), t.slice(0, 400));
    await page.click("[data-fbd-modifier]"); await attendre(page, 300);
    await page.click('.note10 [data-v="8"]'); await page.click("[data-fbd] button[type=submit]"); await attendre(page, 1500);
    const n = (ckDe(db).liste || [])[0] || {}, r = n.reponses || {};
    ok("H : envoyé : l'entrée passe au format du dimanche, note 8, ses réponses du vendredi gardées en base (énergie, réussite, alimentation)", (ckDe(db).liste || []).length === 1 && n.format === "dimanche" && r.note === 8 && r.energie === 4 && r.reussite === "4 séances tenues" && r.alimentation === "Bien, sauf samedi soir.", JSON.stringify(n));
    t = await texte(page, "#suivi-checkin");
    ok("H : Mon suivi affiche la note ET les réponses du vendredi (« Note de la semaine 8/10 », « 4 séances tenues », « Énergie 4/5 », « Comment s'est passée ta semaine ? »), « Alimentation » une seule fois",
      t.includes("Note de la semaine 8/10") && t.includes("4 séances tenues") && t.includes("Énergie 4/5") && t.includes("Comment s'est passée ta semaine ?") && (await alim(page, "#suivi-checkin .fbd-semaine")) === 1 && !t.includes("Aucune réponse lisible."), t.slice(0, 600) + " · alimentation " + (await alim(page, "#suivi-checkin .fbd-semaine")));
    const { page: pc } = await sur(b, COACH, db, 21, 10, 0, "", null);
    await fiche(pc, TESTEUR.id, "Sans nom", "bilan", `#bilan-vue [data-fb-semaine="${isoJ(14)}"]`);
    const B = await blocSemaine(pc, isoJ(14));
    ok("H : coach, Préparer le call : la note et les réponses du vendredi, « Alimentation » une seule fois", !!B && B.t.includes("Note de la semaine 8/10") && B.t.includes("4 séances tenues") && B.t.includes("Énergie 4/5") && B.alim === 1, JSON.stringify(B).slice(0, 400));
    await voir(pc, "accueil"); await pc.waitForSelector("#acc-vue .masthead", { timeout: 10000 });
    const fi = await texte(pc, "#acc-vue");
    ok("H : coach, fiche : le dernier feedback avec sa note et ses réponses du vendredi", fi.includes("Note de la semaine 8/10") && fi.includes("4 séances tenues"), fi.slice(fi.indexOf("Feedback du dimanche"), fi.indexOf("Feedback du dimanche") + 300));
    ok("H : jamais d'écriture de feedbacks, aucun refus de la base (affichage seul côté coach)", ecr(db, "feedbacks").length === 0 && db.refus.length === 0 && ecr(db, "checkins").length === 1, resume(db) + " " + JSON.stringify(db.refus));
  });
  await bloc("H2. une entrée du vendredi avec des réponses du dimanche (coach)", async () => {
    const ven7 = entreeVen(7, { reponses: Object.assign(clone(REP_VEN), { note: 6, training: "Trois séances", autre: "Genou raide" }) });
    const dim21 = entreeDim(21, 5, { energie: PIEGE, semaine: { a: 1 }, seances: 3, motivation: null, ajustement_detail: "  " });
    const db = base({ comptes: [compteTest({ liste: [entreeVen(0), ven7, entreeDim(14, 7, { training: "Séances du dimanche" }), dim21] }, null)] });
    const { page } = await sur(b, COACH, db, 22, 10, 0, "", null);
    await fiche(page, TESTEUR.id, "Sans nom", "bilan", `#bilan-vue [data-fb-semaine="${isoJ(0)}"]`);
    const B7 = await blocSemaine(page, isoJ(7)), B0 = await blocSemaine(page, isoJ(0)), B14 = await blocSemaine(page, isoJ(14)), B21 = await blocSemaine(page, isoJ(21));
    ok("H2 : un bilan du vendredi qui porte une note et des cases du dimanche : les deux affichés (« Note de la semaine 6/10 », « Trois séances », « Genou raide », « 4 séances tenues »), « Alimentation » une seule fois",
      !!B7 && B7.t.includes("Note de la semaine 6/10") && B7.t.includes("Trois séances") && B7.t.includes("Genou raide") && B7.t.includes("4 séances tenues") && B7.alim === 1 && !B7.t.includes("Aucune réponse lisible."), JSON.stringify(B7).slice(0, 500));
    ok("H2 : sans réponse de l'autre format : affichage d'avant (bilan du vendredi : 4 échelles, 6 réponses, pas de note ; feedback du dimanche : sa note et sa case seulement)",
      !!B0 && B0.ech === 4 && B0.rep === 6 && !B0.note && !!B14 && B14.note && B14.ech === 0 && B14.rep === 1 && B14.t.includes("Séances du dimanche"), JSON.stringify([B0, B14]).slice(0, 500));
    const x = await page.evaluate(() => (window.__xss || 0) + document.querySelectorAll("img[data-xss]").length);
    ok("H2 : réponses piégées sous un feedback du dimanche : rien ne s'exécute, jamais « [object »", x === 0 && !!B21 && !B21.t.includes("[object") && !(await texte(page, "#bilan-vue")).includes("[object"), String(x) + " " + (B21 ? B21.t.slice(0, 300) : ""));
    ok("H2 : … ses réponses du vendredi lisibles (séances 3, l'énergie écrite en texte)", !!B21 && B21.t.includes("Combien de séances as-tu réalisées ?3") && B21.t.includes('<img src="x"'), B21 ? B21.t.slice(0, 400) : "");
  });

  /* =================== I. le coach en consultation =================== */
  await bloc("I. Son suivi (coach) : ni lecture en plus, ni écriture", async () => {
    const db = base({ comptes: [compteTest({ liste: [e14] }, { liste: [f14] })] });
    const { page } = await sur(b, COACH, db, 23, 10, 0, "", null);
    await espion(page);
    await fiche(page, TESTEUR.id, "Sans nom", "suivi", "#suivi-checkin .fbd");
    const n0 = lu(db, "checkins");
    await attendre(page, 1800);
    ok("I : Son suivi d'un compte avec une réponse non vue : aucune écriture (ni tentative), aucune relecture de checkins après l'affichage", db.ecritures.length === 0 && (await ecrits(page)).length === 0 && lu(db, "checkins") === n0 && !(await page.$("[data-smiley]")), resume(db) + " " + JSON.stringify(await ecrits(page)) + " " + n0 + "/" + lu(db, "checkins"));
  });

  /* =================== J. double clic =================== */
  await bloc("J. double clic", async () => {
    const db = base({ comptes: [compteTest({ liste: [entreeDim(7, 8)] }, null)] });
    const { page } = await sur(b, TESTEUR, db, 20, 10, 0, "#/suivi", "#suivi-checkin [data-fbd]");
    await page.click('.note10 [data-v="7"]');
    await page.evaluate(() => { const f = document.querySelector("[data-fbd]"); f.requestSubmit(); f.requestSubmit(); });
    await attendre(page, 1800);
    const l = ckDe(db).liste || [], nb = (await toasts(page)).filter(x => x.includes("Feedback envoyé.")).length;
    ok("J : « Envoyer mon feedback » deux fois de suite : une seule entrée pour la semaine, une seule écriture, un seul message", ecr(db, "checkins").length === 1 && l.filter(x => x.semaine === isoJ(14)).length === 1 && nb === 1, resume(db) + " messages " + nb);
    const db2 = base({ comptes: [compteTest({ liste: [e14], fb_vu: f14.ecrit_a }, { liste: [f14] })] });
    const { page: p2 } = await sur(b, TESTEUR, db2, 22, 10, 0, "#/suivi", "#suivi-checkin [data-smiley]");
    await p2.evaluate(() => { document.querySelector('.fbd-reponse [data-smiley="neutre"]').click(); document.querySelector('.fbd-reponse [data-smiley="content"]').click(); });
    await attendre(p2, 2000);
    const av = ckDe(db2).avis || [], pr = await p2.evaluate(() => Array.from(document.querySelectorAll(".fbd-reponse [data-smiley]")).map(x => x.getAttribute("aria-pressed")).join(","));
    ok("J : deux smileys cliqués coup sur coup : un seul avis, le dernier (😊), au plus deux écritures, l'écran le montre", av.length === 1 && av[0].smiley === "content" && ecr(db2, "checkins").length >= 1 && ecr(db2, "checkins").length <= 2 && pr === "false,false,true" && egal(ckDe(db2).liste, [e14]), JSON.stringify(av) + " " + pr + " " + resume(db2));
  });

  /* =================== K. traduction =================== */
  await bloc("K. le seul message possible est traduit", async () => {
    const db = base();
    const { page } = await contexte(b, qui(F.IDS.c1, "thomas@exemple.fr"), db);
    await page.goto(URL0); await pret(page, null);
    const en = await page.evaluate(k => (typeof I18N !== "undefined" && I18N.en) ? I18N.en[k] || null : null, LECTURE_RATEE);
    ok("K : « " + LECTURE_RATEE + " » a son anglais dans I18N.en (aucune phrase nouvelle côté client)", en === "Not saved: your data couldn't be loaded. Reload the page.", String(en));
  });

  /* =================== Z. rien vers l'extérieur =================== */
  await bloc("Z. hôtes externes", async () => {
    const autres = Array.from(externes).filter(h => !/^(fonts\.(googleapis|gstatic)\.com|img\.youtube\.com)$/.test(h));
    ok("Z : aucune requête vers un autre hôte que la page, le faux Supabase et les polices (bloquées)", autres.length === 0, JSON.stringify(autres));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
