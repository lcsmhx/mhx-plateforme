/* v51 — corrections 1 à 11 (après « v51 corrections (1/5) », 5860a9f) vérifiées de bout en bout dans un vrai navigateur :
   A. activité du prospect : visite courte puis vrai rechargement (page.goto) sans rien écrire, copie locale
      « mhx_activite_attente|<uid> » reprise à la visite suivante et écrite une seule fois ; pagehide synthétique puis
      pageshow persisted (retour du cache du navigateur : l'arrière-plan suivant envoie) ; deux onglets et un appareil à la base périmée (fusion au maximum,
      rien d'effacé, rien de compté deux fois) ; onglet repris sans changer de page après plus de 10 minutes (jour et
      dernière activité, au plus une fois par 10 min, passage de minuit compris) ; copie hors ligne du Store plus
      ancienne que la base (fusionnée sans message, alors que la clé emails garde son message avec le nom « Emails de
      suivi ») ; déconnexion (l'activité part avant l'effacement de l'appareil) ;
   B. Mes clients, tableau de bord et fiche : activite / emails / coach_notifs récents ne cachent pas l'alerte
      « Inactif depuis N j » d'un client ; l'activité d'un prospect compte toujours, ses emails non ;
   C. email du compte (email_compte) : premier brouillon, réponse « email » d'un questionnaire jamais écrasée, adresse
      du compte changée (une seule écriture à l'affichage), aucune écriture sinon ; côté coach (carte, recherche, CSV,
      fiche, mailto) email_compte, à défaut l'ancien intake.email ;
   D. purge au premier remplissage : un âge mineur retire aussi ce qu'une visite précédente avait envoyé (v52 : bloc
      retiré, plus d'âge dans le questionnaire court ; garde-fou 18 ans au calculateur, lot D) ;
   E. bandeau de première connexion d'un ancien prospect passé client ;
   F. Nouveautés : date « vu » non ISO ignorée, lecture ratée dite dans le panneau puis « Tout marquer comme vu »
      une fois le réseau revenu, « vu » relu à chaque affichage, page Prospects ouverte aussitôt après « Tout marquer
      comme vu » (écriture pas encore arrivée : ni anciennes nouveautés ni badge), « Voir les N suivantes » (300 au
      plus) sur la page Prospects, lien « tout voir dans la page Prospects » sur le tableau de bord ;
   G. mobile 390 px : email de 120 caractères sans tiret, réponses et notes sans espace, aucun défilement horizontal ;
   H. restauration d'une sauvegarde (Profil, « Restaurer une sauvegarde ») : ni emails ni activite ne sont réécrits ;
   I. page Prospects : après une action sur une carte, la liste garde sa longueur (100 après « Afficher plus ») et sa place ;
   J. conditions (FR / EN, Profil et inscription) : mesure des ouvertures et des clics par Brevo, aucun prix (conditions,
      Profil, Découverte, inscription), version « 2026-09-27 · 51 » en pied de page ;
   K. statuts : clic « Réserver » sans questionnaire à 2 h = TIÈDE, à 30 h = FROID, NOUVEAU avec « questionnaire
      commencé (4/10 réponses) » ;
   L. client Thomas : ni lecture ni écriture d'activite, emails ou coach_notifs en naviguant, en arrière-plan, au bout de
      11 minutes (horloge contrôlée), à la fermeture ni à la réouverture ;
   M. page de désinscription (desinscription.html) : rien à l'ouverture, « Confirmer » envoie la demande signée.
   Supabase simulé : rien ne part vers la vraie base ; chaque écriture est appliquée en mémoire et notée, chaque lecture
   de « donnees » aussi ; réponses coupées à 1 000 lignes, en-tête Range et tri order= respectés. Dates relatives au
   lancement (la suite passe quel que soit le jour ou l'heure). Chaque bloc tourne à part (« ✗ BLOC INTERROMPU ») ;
   code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif53.js ../index.html
           VERIF53_PORT=9701 node verif53.js ../index.html     (autre port, si 9690 est pris)
           VERIF53_BLOCS="A.,F." node verif53.js …              (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const DESINSCRIPTION = path.join(__dirname, "..", "desinscription.html");
const PORT = +process.env.VERIF53_PORT || 9690;
const BLOCS = (process.env.VERIF53_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const OUT = path.join(__dirname, "captures", "v53"); fs.mkdirSync(OUT, { recursive: true });
let inscriptionLibre = false;
const server = http.createServer((req, res) => {
  if (req.url.split("?")[0] === "/desinscription.html") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return res.end(fs.readFileSync(DESINSCRIPTION, "utf8")); }
  let h = fs.readFileSync(HTML, "utf8");
  if (inscriptionLibre) h = h.replace("inscription_libre: false", "inscription_libre: true");
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(h);
});
const res = []; const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
const norm = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const T0 = Date.now(), H = 3600000, J = 86400000, MIN = 60000;
const avant = ms => new Date(T0 - ms).toISOString();
const ilYA = n => { const d = new Date(T0); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return iso(d); };
const midiIlYA = n => { const d = new Date(T0); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d.toISOString(); };
const fr = v => { const j = iso(new Date(v)); return j.slice(8, 10) + "/" + j.slice(5, 7) + "/" + j.slice(0, 4); };
const hm = v => { const d = new Date(v); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
const ajd = () => iso(new Date());   // « aujourd'hui » au moment du contrôle
/* jours de calendrier (heure locale) entre la date d'un instant et aujourd'hui, et leur libellé dans l'app */
const joursCal = v => { const a = ajd(), m = iso(new Date(v)); return Math.round((Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10)) - Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1, +m.slice(8, 10))) / J); };
const quand = n => n === 0 ? "aujourd'hui" : n === 1 ? "hier" : "il y a " + n + " jours";
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "donnees", f), "utf8"));
const CATALOGUE = Object.assign({}, F.catalogue, { aliments: lireDonnees("aliments.json"), recettes: lireDonnees("recettes.json") });
const PID = k => "00000000-0000-4000-8000-0000000053" + String(k).padStart(2, "0");
const GEN = i => "00000000-0000-4000-8000-2" + String(i).padStart(11, "0");
const p4 = i => String(i).padStart(4, "0");
const COACH_SEUL = ["notes_coach", "suivi_prospect", "feedbacks"];
const XSS = "<img src=x onerror=window.__xss=1>";
/* aucun prix, tarif ni abonnement (même règle que verif40) */
const PRIX = /€|\$|£|\bEUR\b|\beuros?\b|\bdollars?\b|(?<!à tout )\bprix\b|tarif|abonnement|\/\s*mois|(?<!\bat a )\bprices?\b|pricing|subscription|\/\s*month/i;
const prixTrouve = t => { const m = PRIX.exec(t); return m ? "« " + t.slice(Math.max(0, m.index - 60), m.index + 40).replace(/\s+/g, " ") + " »" : ""; };
const QS = ["sexe", "age", "taille", "poids", "objectif", "seances", "essaye", "obstacle", "pourquoi", "motivation"];

/* ---------- le faux Supabase ---------- */
const ouverts = [];
const MAX_LIGNES = 1000;
async function bloc(nom, fn){
  if (BLOCS.length && !BLOCS.some(x => nom.startsWith(x))) return;
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); }
}
/* profils et données de fixtures.js (clients Thomas, Sarah, Julien), plus les comptes du bloc (prospects ou clients) */
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  const donnees = clone(F.donnees);
  /* Julien : dernière saisie il y a 12 jours et 3 heures (nombre de jours entiers stable pendant toute la suite) */
  donnees.forEach(d => { if (d.user_id === F.IDS.c3) d.maj_le = avant(12 * J + 3 * H); });
  const db = { profils, donnees, emails_prospects: [], ecritures: [], lectures: [], journal: [], chemins: [], fonction: [], lectureKo: opts.lectureKo || [], reponseFonction: { status: 200, body: { ok: true } } };
  (opts.comptes || []).forEach(x => {
    profils.push({ id: x.id, prenom: x.prenom, nom: x.nom, role: "client", statut: x.statut || "prospect", cree_le: x.cree });
    (x.donnees || []).forEach(([outil, contenu, maj]) => donnees.push({ user_id: x.id, outil, contenu: clone(contenu), maj_le: maj }));
  });
  (opts.cles || []).forEach(([uid, outil, contenu, maj]) => donnees.push({ user_id: uid, outil, contenu: clone(contenu), maj_le: maj || avant(J) }));
  return db;
}
/* order=a.desc,b.asc (PostgREST) */
function ordonner(l, order){
  const cles = String(order || "").split(",").filter(Boolean).map(x => { const [k, sens] = x.split("."); return { k, desc: sens === "desc" }; });
  if (!cles.length) return l;
  const v = (x, k) => (x && typeof x === "object" && x[k] != null) ? String(x[k]) : "";
  return l.slice().sort((a, b) => { for (const { k, desc } of cles) { const x = v(a, k), y = v(b, k); if (x !== y) return (x < y ? -1 : 1) * (desc ? -1 : 1); } return 0; });
}
async function repondre(r, who, db){
  const req = r.request(); const u = req.url(); const host = new URL(u).hostname;
  if (host === "localhost") return r.continue();
  if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" });
  if (!host.endsWith(".supabase.co")) return r.abort();
  const url = new URL(u); const p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) });
  /* comme PostgREST sur Supabase : tri demandé, puis l'en-tête Range choisit les lignes, jamais plus de 1 000 */
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const estCoach = !!who && who.id === F.IDS.coach;
  db.chemins.push(m + " " + p);
  if (p.startsWith("/functions/v1/emails-prospects")) {
    if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, GET, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
    db.fonction.push({ m, action: q.get("action"), u: q.get("u"), t: q.get("t") });
    const rf = db.reponseFonction || { status: 200, body: { ok: true } };
    if (rf.abort) return r.abort();
    return json(rf.body, rf.status);
  }
  if (p.startsWith("/auth/v1/token")) return json(who ? who.session : { error: "invalid" }, who ? 200 : 400);
  if (p.startsWith("/auth/v1/logout")) { db.journal.push("LOGOUT"); db.ecritures.push({ table: p, m }); return json({}); }
  if (!["GET", "HEAD", "OPTIONS"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m });
  if (p.startsWith("/auth/v1/")) return json({});
  if (p === "/rest/v1/emails_prospects") {
    if (!estCoach) return json([]);
    let l = db.emails_prospects.slice();
    const sel = (q.get("select") || "*").split(","); l = plage(l); if (!sel.includes("*")) l = l.map(x => (x && typeof x === "object") ? Object.fromEntries(sel.map(k => [k, x[k]])) : x);
    return json(l);
  }
  if (p === "/rest/v1/profils") {
    if (m !== "GET") { db.ecritures.push({ table: "profils", m }); return json(null, 204); }
    const id = q.get("id"); const l = id ? db.profils.filter(x => x.id === id.slice(3)) : db.profils.slice();
    return json(plage(l));
  }
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "", mj = q.get("maj_le");
    const cleEq = o.startsWith("eq.") ? o.slice(3) : null;
    if (m === "PATCH") {
      let corps = {}; try { corps = JSON.parse(req.postData() || "{}"); } catch (e) { }
      if (!estCoach && (COACH_SEUL.includes(cleEq) || uid !== (who && who.id))) return json({ message: "rls" }, 403);
      const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj == null ? true : mj === "is.null" ? !x.maj_le : mj.startsWith("eq.") ? x.maj_le === decodeURIComponent(mj.slice(3)) : false));
      if (!row) return json([]);
      row.contenu = corps.contenu; row.maj_le = corps.maj_le;
      db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq, contenu: clone(corps.contenu) }); db.journal.push("E " + cleEq);
      return json([row]);
    }
    if (m === "POST") {
      let rows = []; try { rows = JSON.parse(req.postData() || "[]"); } catch (e) { }
      rows = Array.isArray(rows) ? rows : [rows];
      if (rows.some(row => !estCoach && (COACH_SEUL.includes(row.outil) || row.user_id !== (who && who.id)))) return json({ message: "rls" }, 403);
      /* écriture lente (réseau) : appliquée et notée seulement au bout de db.retard[clé] ms */
      const lent = Math.max(0, ...rows.map(row => (db.retard || {})[row.outil] || 0));
      if (lent){ db.journal.push("P " + rows.map(row => row.outil).join(",")); await new Promise(z => setTimeout(z, lent)); }
      const upsert = u.indexOf("on_conflict") > -1, out = [];
      for (const row of rows) {
        const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
        if (i > -1 && !upsert) return json({ code: "23505", message: "duplicate key" }, 409);
        const ligne = { user_id: row.user_id, outil: row.outil, contenu: row.contenu, maj_le: row.maj_le || new Date().toISOString() };
        if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        db.ecritures.push({ table: "donnees", m, user_id: row.user_id, outil: row.outil, contenu: clone(row.contenu), maj_le: ligne.maj_le }); db.journal.push("E " + row.outil);
        out.push(ligne);
      }
      return (req.headers()["prefer"] || "").indexOf("return=representation") > -1 ? json(out, 201) : json(null, 201);
    }
    if (m !== "GET") { db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq }); return json(null, 204); }
    db.lectures.push({ uid, outil: o, select: q.get("select") || "*" }); db.journal.push("L " + (cleEq || o));
    if (cleEq && (db.retardLecture || {})[cleEq]) await new Promise(z => setTimeout(z, db.retardLecture[cleEq]));   // réponse lente
    if (cleEq && db.lectureKo.includes(cleEq)) return json({ message: "panne" }, 500);
    let l = db.donnees;
    if (who && !estCoach) l = l.filter(x => x.user_id === who.id && !COACH_SEUL.includes(x.outil));
    if (uid) l = l.filter(x => x.user_id === uid);
    if (o.startsWith("eq.")) l = l.filter(x => x.outil === o.slice(3));
    if (o.startsWith("in.(")) { const k = o.slice(4, -1).split(","); l = l.filter(x => k.includes(x.outil)); }
    if (o.startsWith("not.in.(")) { const k = o.slice(8, -1).split(","); l = l.filter(x => !k.includes(x.outil)); }
    l = plage(l);
    const sel = (q.get("select") || "*").split(","); if (!sel.includes("*")) l = l.map(x => Object.fromEntries(sel.map(k => [k, x[k]])));
    return json(l);
  }
  const t = p.replace("/rest/v1/", "");
  if (CATALOGUE[t]) return json(plage(CATALOGUE[t]));
  return json([]);
}
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || { width: 1280, height: 900 } });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, who, db));
  await c.addInitScript(({ s, stock, langue }) => {
    if (!/^https?:$/.test(location.protocol)) return;   // about:blank (fermeture simulée) : pas de stockage
    /* ce que l'appareil garde (copies en attente) à l'instant où la page se charge, avant que l'app ne tourne */
    try { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^mhx_(activite_)?attente\|/.test(k)) o[k] = localStorage.getItem(k); } window.__auChargement = o; } catch (e) { window.__auChargement = null; }
    /* tous les toasts affichés (ils s'effacent seuls) */
    window.__toasts = [];
    try { new MutationObserver(ms => ms.forEach(mu => mu.addedNodes.forEach(n => { if (n.nodeType === 1 && n.classList && n.classList.contains("toast")) window.__toasts.push(n.textContent); }))).observe(document, { childList: true, subtree: true }); } catch (e) { }
    if (sessionStorage.getItem("__init")) return; sessionStorage.setItem("__init", "1");   // une seule fois : un rechargement garde l'état de l'appareil
    if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
    localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
    if (langue) localStorage.setItem("mhx_langue", langue);
    Object.keys(stock).forEach(k => localStorage.setItem(k, stock[k]));
  }, { s: who ? who.session : null, stock: opts.stockage || {}, langue: opts.langue || "" });
  if (opts.horloge) await c.clock.install(opts.horloge === true ? undefined : { time: opts.horloge });   // horloge contrôlée (qui continue de tourner)
  const page = await nouvellePage(c);
  return { c, page };
}
async function nouvellePage(c){
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF"); d.dismiss(); });
  return page;
}
const sessionDe = (id, email, expire) => { const s = F.session(id, email); if (expire) s.expire_le = expire; return s; };
const qui = (id, email, expire) => ({ id, email, session: sessionDe(id, email, expire) });
const coach = qui(F.IDS.coach, "c@e.fr");
const attendre = (page, ms) => page.waitForTimeout(ms);
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1600); };
const texte = async (page, sel) => norm(await page.textContent(sel || "#vue").catch(() => ""));
const uids = page => page.$$eval("#pr-liste .sc-carte", l => l.map(e => e.dataset.uid)).catch(() => []);
const carte = (page, uid) => page.$eval(`#pr-liste .sc-carte[data-uid="${uid}"]`, e => e.textContent).then(norm).catch(() => "");
const raisons = (page, uid) => page.$$eval(`#pr-liste .sc-carte[data-uid="${uid}"] .sc-raisons li`, l => l.map(e => e.textContent.replace(/\s+/g, " ").trim())).catch(() => []);
const pastilleEtat = (page, uid) => page.$eval(`#pr-liste .sc-carte[data-uid="${uid}"] .sc-tete .pastille:last-child`, e => e.textContent.trim()).catch(() => "");
const filtre = async (page, f) => { await page.click(`[data-filtre="${f}"]`); await attendre(page, 350); };
const chercher = async (page, v) => { await page.fill("#pr-q", v); await attendre(page, 550); };
const badge = page => page.$$eval('#nav a[data-id="prospects"] .nav-badge, #barre-bas a[data-id="prospects"] .nav-badge', l => l.map(e => e.textContent.trim())).catch(() => []);
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.outil === outil && (!uid || e.user_id === uid));
const contenu = (db, outil, uid) => (db.donnees.find(x => x.user_id === uid && x.outil === outil) || {}).contenu;
/* la clé k fait-elle partie de ce qu'une lecture de « donnees » renvoie ? (eq., in., not.in., sans filtre) */
const couvre = (o, k) => {
  o = String(o || ""); if (!o) return true;
  const liste = t => t.replace(/^\(|\)$/g, "").split(",").map(x => x.trim().replace(/^"|"$/g, ""));
  if (o.startsWith("eq.")) return o.slice(3) === k;
  if (o.startsWith("in.")) return liste(o.slice(3)).includes(k);
  if (o.startsWith("not.in.")) return !liste(o.slice(7)).includes(k);
  return true;
};
/* lectures du CONTENU d'une clé (le Store relit aussi la seule date maj_le d'une copie en attente : ce n'est pas une lecture du contenu) */
const lu = (db, outil, depuis) => db.lectures.slice(depuis || 0).filter(x => couvre(x.outil, outil) && x.select !== "maj_le").length;
/* lectures qui visent la clé par son nom (outil=eq.k), sans les lectures groupées du coach (Clients.charger : not.in.(…)) */
const luDirect = (db, outil, depuis) => db.lectures.slice(depuis || 0).filter(x => x.outil === "eq." + outil && x.select !== "maj_le").length;
/* lectures qui NOMMENT la clé (eq. ou in.(…)) */
const nomme = (o, k) => { o = String(o || ""); const liste = t => t.replace(/^\(|\)$/g, "").split(",").map(x => x.trim().replace(/^"|"$/g, "")); return o.startsWith("eq.") ? o.slice(3) === k : o.startsWith("in.") ? liste(o.slice(3)).includes(k) : false; };
const memes = (a, b) => { const t = o => JSON.stringify(Object.keys(o || {}).sort().map(k => [k, o[k]])); return t(a) === t(b); };
const deborde = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
const largeur = page => page.evaluate(() => document.documentElement.scrollWidth + " px pour " + window.innerWidth).catch(() => "?");
const cacher = page => page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }); document.dispatchEvent(new Event("visibilitychange")); });
const montrer = page => page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" }); document.dispatchEvent(new Event("visibilitychange")); });
const lireLocal = (page, k) => page.evaluate(k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return "illisible"; } }, k);
const tousLesToasts = page => page.evaluate(() => window.__toasts || []).catch(() => []);
const xss = page => page.evaluate(() => !!window.__xss || !!document.querySelector("#vue img[src='x'], .nv-panneau img")).catch(() => true);
/* un vrai lecteur CSV (guillemets doublés, point-virgule, fin de ligne CRLF) */
function lireCSV(t){
  const lignes = []; let ligne = [], champ = "", dans = false, i = 0;
  while (i < t.length) {
    const ch = t[i];
    if (dans) { if (ch === '"') { if (t[i + 1] === '"') { champ += '"'; i += 2; continue; } dans = false; i++; continue; } champ += ch; i++; continue; }
    if (ch === '"') { dans = true; i++; continue; }
    if (ch === ";") { ligne.push(champ); champ = ""; i++; continue; }
    if (ch === "\r" && t[i + 1] === "\n") { ligne.push(champ); lignes.push(ligne); ligne = []; champ = ""; i += 2; continue; }
    champ += ch; i++;
  }
  if (champ !== "" || ligne.length) { ligne.push(champ); lignes.push(ligne); }
  return lignes;
}
async function exporter(page){
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 5000 }), page.click("#pr-csv")]);
  return fs.readFileSync(await dl.path(), "utf8");
}
async function ouvrirFiche(page, uid){
  if (!(await page.$("#pr-vue"))) await aller(page, "#/prospects", 2200);
  await page.waitForSelector("#pr-liste", { timeout: 8000 });
  await filtre(page, "tous");
  await page.click(`#pr-liste .sc-carte[data-uid="${uid}"] [data-sc="fiche"]`);
  await page.waitForSelector("#fiche-score", { timeout: 6000 }); await attendre(page, 500);
}
const lignesLi = (page, sel) => page.$$eval(sel + " li", l => l.map(li => [li.querySelector("span") ? li.querySelector("span").textContent.replace(/\s+/g, " ").trim() : "", li.querySelector("b") ? li.querySelector("b").textContent.replace(/\s+/g, " ").trim() : ""])).catch(() => []);
const nvVisibles = (page, sel) => page.$$eval(sel + " .nv-liste li", l => l.filter(li => !li.closest("[hidden]")).map(li => li.querySelector(".nv-txt").textContent.replace(/\s+/g, " ").trim())).catch(() => []);
const complet = o => Object.assign({ sexe: "Homme", age: "35", taille: "178", poids: "82", objectif: "Perte de poids / sèche", seances: "3", essaye: "Rien de sérieux", obstacle: "Le temps", pourquoi: "Pour ma santé", motivation: "7" }, o);

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : relance plus tard ou choisis un autre port, VERIF53_PORT=9701 node verif53.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. Activité du prospect =================== */
  const ACT = PID(20), EMAIL_ACT = "lea.martin@exemple.fr";
  const leaAct = qui(ACT, EMAIL_ACT);
  const seule = (donnees, extra) => [Object.assign({ id: ACT, prenom: "Léa", nom: "", cree: avant(2 * J), donnees: donnees || [] }, extra || {})];
  const CLE_LOCALE = "mhx_activite_attente|" + ACT, CLE_STORE = "mhx_attente|" + ACT + "|activite";

  await bloc("A. visite courte, fermeture puis visite suivante", async () => {
    const F0 = { version: 1, jours: [ilYA(1)], pages: { formation: 2 }, temps_s: 100, derniere: avant(J) };
    const db = base({ comptes: seule([["activite", F0, avant(J)]]) });
    const { page } = await contexte(b, leaAct, db);
    const t0 = Date.now();
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector("#q-probleme", { timeout: 8000 }); await attendre(page, 800);
    await aller(page, "#/programme", 1400);
    const avantFermeture = { l: lu(db, "activite"), e: db.ecritures.length };
    /* vrai rechargement (page.goto : la page se ferme, vrai pagehide), puis la visite suivante commence */
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector("#q-probleme", { timeout: 8000 }); await attendre(page, 1200);
    const t1 = Date.now();
    const snap = await page.evaluate(() => window.__auChargement).catch(() => null);
    let copie = null; try { copie = JSON.parse(snap[CLE_LOCALE]); } catch (e) { copie = null; }
    ok("visite de moins d'une minute (Découverte, #/programme) puis fermeture (pagehide) : rien de lu, rien d'écrit (ni activite, ni autre chose)", avantFermeture.l === 0 && avantFermeture.e === 0 && lu(db, "activite") === 0 && db.ecritures.length === 0, JSON.stringify(avantFermeture) + " · " + JSON.stringify(db.ecritures.map(e => e.outil || e.table)));
    ok("… la visite est gardée sur l'appareil (« mhx_activite_attente|<uid> ») au moment de la fermeture : decouverte-questionnaire 1, verrou-programme 1, jour d'aujourd'hui, temps visible, dernière activité datée", !!copie && memes(copie.pages, { "decouverte-questionnaire": 1, "verrou-programme": 1 }) && JSON.stringify(copie.jours) === JSON.stringify([ajd()]) && copie.temps_s >= 1 && copie.temps_s <= Math.ceil((t1 - t0) / 1000) + 1 && !isNaN(Date.parse(copie.derniere)), JSON.stringify(copie) + " · au chargement : " + JSON.stringify(snap));
    const reste = await lireLocal(page, CLE_LOCALE);
    /* la copie n'est retirée qu'une fois l'écriture qui la contient confiée au Store : une app tuée sans pagehide ne perd rien */
    ok("visite suivante : la copie reste sur l'appareil jusqu'à son envoi, toujours rien de lu ni d'écrit à l'affichage", !!reste && !!copie && memes(reste.pages, copie.pages) && lu(db, "activite") === 0 && ecr(db, "activite").length === 0, "copie restante " + JSON.stringify(reste) + " · lectures " + lu(db, "activite"));
    await cacher(page); await attendre(page, 1800); await montrer(page);
    const A1 = contenu(db, "activite", ACT) || {};
    const ordre = db.journal.filter(x => x.endsWith(" activite"));
    ok("arrière-plan : la base est relue PUIS écrite, une seule fois ; la visite fermée compte une fois (decouverte-questionnaire 1 + 1, verrou-programme 1, formation 2 de la base gardé, jours hier + aujourd'hui)", lu(db, "activite") === 1 && ecr(db, "activite").length === 1 && JSON.stringify(ordre) === '["L activite","E activite"]' && memes(A1.pages, { formation: 2, "decouverte-questionnaire": 2, "verrou-programme": 1 }) && JSON.stringify(A1.jours) === JSON.stringify([ilYA(1), ajd()]), JSON.stringify(ordre) + " · " + JSON.stringify(A1));
    const secondes = Math.ceil((Date.now() - t0) / 1000);
    ok("temps : 100 s de la base + la visite fermée (" + (copie && copie.temps_s) + " s) + la visite en cours, rien de perdu ni compté deux fois", !!copie && A1.temps_s >= 100 + copie.temps_s + 1 && A1.temps_s <= 100 + secondes + 1, "temps_s " + A1.temps_s + " (visite fermée " + (copie && copie.temps_s) + " s, " + secondes + " s depuis le début)");
    ok("dernière activité : l'instant de la dernière page vue (après le rechargement)", Date.parse(A1.derniere) >= t1 - 5000 && Date.parse(A1.derniere) <= Date.now(), A1.derniere);
    await attendre(page, 1500); await cacher(page); await attendre(page, 1800); await montrer(page);
    const A2 = contenu(db, "activite", ACT) || {};
    ok("nouvel arrière-plan sans nouvelle page : pages et jours inchangés (rien de recompté ; seul le temps visible peut s'ajouter), aucune copie laissée sur l'appareil", memes(A2.pages, A1.pages) && JSON.stringify(A2.jours) === JSON.stringify(A1.jours) && A2.temps_s >= A1.temps_s && A2.temps_s <= A1.temps_s + 5 && (await lireLocal(page, CLE_LOCALE)) === null && (await lireLocal(page, CLE_STORE)) === null, JSON.stringify(A2));
    ok("seule la clé activite est écrite", db.ecritures.every(e => e.outil === "activite" && e.user_id === ACT), JSON.stringify(db.ecritures.map(e => e.outil || e.table)));
  });

  await bloc("A. pagehide puis retour du cache du navigateur (pageshow persisted)", async () => {
    const F0 = { version: 1, jours: [ilYA(1)], pages: { formation: 1 }, temps_s: 50, derniere: avant(J) };
    const db = base({ comptes: seule([["activite", F0, avant(J)]]) });
    const { page } = await contexte(b, leaAct, db);
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector("#q-probleme", { timeout: 8000 }); await attendre(page, 800);
    await aller(page, "#/formation", 1400);
    const ev = (type, persisted) => page.evaluate(([t, p]) => { window.dispatchEvent(new PageTransitionEvent(t, { persisted: p })); }, [type, persisted]);
    const journalAct = () => JSON.stringify(db.journal.filter(x => x.endsWith(" activite")));
    await ev("pagehide", true); await attendre(page, 600);
    const copie = await lireLocal(page, CLE_LOCALE);
    ok("pagehide synthétique (la page part dans le cache du navigateur) : rien de lu ni d'écrit, la visite est dans la copie locale (decouverte-questionnaire 1, formation 1, aujourd'hui)", lu(db, "activite") === 0 && db.ecritures.length === 0 && !!copie && memes(copie.pages, { "decouverte-questionnaire": 1, formation: 1 }) && JSON.stringify(copie.jours) === JSON.stringify([ajd()]), JSON.stringify(copie) + " · " + journalAct());
    await cacher(page); await attendre(page, 1500);
    ok("… l'événement « masqué » qui suit (Chrome le déclenche après pagehide) n'envoie rien", lu(db, "activite") === 0 && db.ecritures.length === 0, journalAct());
    await ev("pageshow", false); await attendre(page, 200); await cacher(page); await attendre(page, 1500);
    ok("… un pageshow ordinaire (persisted false) ne rouvre pas l'envoi : toujours rien", lu(db, "activite") === 0 && db.ecritures.length === 0, journalAct());
    await ev("pageshow", true); await attendre(page, 300);
    await cacher(page); await attendre(page, 1800);
    const A = contenu(db, "activite", ACT) || {};
    ok("pageshow persisted (retour du cache) puis nouvel arrière-plan : base relue puis écrite une fois, copie locale reprise (formation 1 + 1, decouverte-questionnaire 1, jours hier + aujourd'hui, temps ajouté), copie effacée", journalAct() === '["L activite","E activite"]' && memes(A.pages, { formation: 2, "decouverte-questionnaire": 1 }) && JSON.stringify(A.jours) === JSON.stringify([ilYA(1), ajd()]) && A.temps_s > 50 && (await lireLocal(page, CLE_LOCALE)) === null, journalAct() + " · " + JSON.stringify(A));
    await montrer(page); await attendre(page, 800); await cacher(page); await attendre(page, 1500);
    const A2 = contenu(db, "activite", ACT) || {};
    ok("arrière-plan suivant : pages et jours inchangés (rien compté deux fois), seule la clé activite écrite", memes(A2.pages, A.pages) && JSON.stringify(A2.jours) === JSON.stringify(A.jours) && db.ecritures.every(e => e.outil === "activite"), JSON.stringify(A2) + " · " + JSON.stringify(db.ecritures.map(e => e.outil || e.table)));
    /* l'onglet redevenu visible rouvre aussi l'envoi (sans pageshow) */
    await montrer(page); await attendre(page, 300); await aller(page, "#/programme", 1200);
    const nE = ecr(db, "activite").length;
    await ev("pagehide", false); await attendre(page, 300); await cacher(page); await attendre(page, 1200);
    const rien = ecr(db, "activite").length === nE && !!(await lireLocal(page, CLE_LOCALE));
    await montrer(page); await attendre(page, 300); await cacher(page); await attendre(page, 1800);
    const A3 = contenu(db, "activite", ACT) || {};
    ok("pagehide puis « masqué » : rien d'envoyé (copie locale) ; l'onglet redevient visible puis passe en arrière-plan : la copie part (verrou-programme 1 en plus), une écriture", rien && ecr(db, "activite").length === nE + 1 && memes(A3.pages, Object.assign({}, A.pages, { "verrou-programme": 1 })) && (await lireLocal(page, CLE_LOCALE)) === null, "rien avant : " + rien + " · " + JSON.stringify(A3.pages));
  });

  await bloc("A. deux onglets et un appareil à la base périmée", async () => {
    const F0 = { version: 1, jours: [ilYA(2)], pages: { formation: 1 }, temps_s: 60, derniere: avant(2 * J) };
    const db = base({ comptes: seule([["activite", F0, avant(2 * J)]]) });
    const { c, page: p1 } = await contexte(b, leaAct, db);
    await p1.goto(`http://localhost:${PORT}/`); await p1.waitForSelector("#q-probleme", { timeout: 8000 }); await attendre(p1, 600);
    const p2 = await nouvellePage(c);
    await p2.goto(`http://localhost:${PORT}/`); await p2.waitForSelector("#q-probleme", { timeout: 8000 }); await attendre(p2, 600);
    await aller(p1, "#/formation", 1400); await aller(p2, "#/programme", 1400);
    await cacher(p1); await attendre(p1, 1800);
    const W1 = clone(contenu(db, "activite", ACT)) || {};
    ok("onglet 1 en arrière-plan : base relue puis écrite (formation 1 + 1, decouverte-questionnaire 1)", ecr(db, "activite").length === 1 && memes(W1.pages, { formation: 2, "decouverte-questionnaire": 1 }), JSON.stringify(W1.pages));
    await cacher(p2); await attendre(p2, 1800);
    const W2 = clone(contenu(db, "activite", ACT)) || {};
    ok("onglet 2 ensuite : il relit la base écrite par l'onglet 1 et y ajoute ses pages (decouverte-questionnaire 2, verrou-programme 1, formation 2 gardé)", ecr(db, "activite").length === 2 && memes(W2.pages, { formation: 2, "decouverte-questionnaire": 2, "verrou-programme": 1 }) && W2.temps_s >= W1.temps_s, JSON.stringify(W2.pages));
    /* un autre appareil écrit une valeur calculée sur une base ancienne : il écrase les comptes des deux onglets */
    const row = db.donnees.find(x => x.user_id === ACT && x.outil === "activite");
    row.contenu = { version: 1, jours: [ilYA(5), ilYA(2)], pages: { formation: 1, "decouverte-resultat": 7 }, temps_s: 30, derniere: avant(3 * J) }; row.maj_le = new Date().toISOString();
    await montrer(p1); await attendre(p1, 500); await aller(p1, "#/suivi", 1400);
    await cacher(p1); await attendre(p1, 1800);
    const W3 = clone(contenu(db, "activite", ACT)) || {};
    ok("appareil à la base périmée (formation 1, temps 30 s) puis onglet 1 : ses comptes ne reculent pas (formation 2, decouverte-questionnaire 1 : le plus grand des deux), les 7 decouverte-resultat de l'autre appareil restent, verrou-suivi 1 s'ajoute", ecr(db, "activite").length === 3 && memes(W3.pages, { formation: 2, "decouverte-questionnaire": 1, "decouverte-resultat": 7, "verrou-suivi": 1 }) && W3.temps_s >= W1.temps_s && JSON.stringify(W3.jours) === JSON.stringify([ilYA(5), ilYA(2), ajd()]), JSON.stringify(W3));
    await montrer(p2); await attendre(p2, 500); await aller(p2, "#/nutrition", 1400);
    await cacher(p2); await attendre(p2, 1800);
    const W4 = clone(contenu(db, "activite", ACT)) || {};
    ok("onglet 2 à son tour : ce qu'il avait écrit revient (decouverte-questionnaire 2, verrou-programme 1), rien de l'autre appareil ni de l'onglet 1 n'est perdu, verrou-nutrition 1 s'ajoute, rien n'est compté deux fois", ecr(db, "activite").length === 4 && memes(W4.pages, { formation: 2, "decouverte-questionnaire": 2, "verrou-programme": 1, "decouverte-resultat": 7, "verrou-suivi": 1, "verrou-nutrition": 1 }) && W4.temps_s >= W2.temps_s && W4.temps_s >= W3.temps_s && JSON.stringify(W4.jours) === JSON.stringify([ilYA(5), ilYA(2), ajd()]), JSON.stringify(W4));
    ok("deux onglets : chaque écriture suit sa propre relecture (4 lectures, 4 écritures), jamais une écriture sans relecture", lu(db, "activite") === 4 && JSON.stringify(db.journal.filter(x => x.endsWith(" activite"))) === JSON.stringify(["L activite", "E activite", "L activite", "E activite", "L activite", "E activite", "L activite", "E activite"]), JSON.stringify(db.journal.filter(x => x.endsWith(" activite"))));
  });

  await bloc("A. onglet repris sans changer de page", async () => {
    /* horloge contrôlée, lancée à 23:50 (heure locale) le jour du lancement : l'onglet est repris après minuit */
    const debut = new Date(T0); debut.setHours(23, 50, 0, 0);
    const D0 = iso(debut), D1 = (() => { const d = new Date(debut); d.setDate(d.getDate() + 1); d.setHours(12, 0, 0, 0); return iso(d); })();
    const db = base({ comptes: seule() });
    const { page } = await contexte(b, qui(ACT, EMAIL_ACT, debut.getTime() + 3 * J), db, { horloge: debut.getTime() });
    const maintenant = () => page.evaluate(() => Date.now());
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector("#q-probleme", { timeout: 8000 }); await attendre(page, 800);
    await cacher(page); await attendre(page, 1800);
    const W1 = clone(contenu(db, "activite", ACT)) || {};
    ok("23:50, première page puis arrière-plan : écrite (jour " + D0 + ", dernière activité 23:50)", ecr(db, "activite").length === 1 && JSON.stringify(W1.jours) === JSON.stringify([D0]) && Math.abs(Date.parse(W1.derniere) - debut.getTime()) < 15000, JSON.stringify(W1));
    await page.clock.fastForward(4 * MIN);
    await montrer(page); await attendre(page, 1200); await cacher(page); await attendre(page, 1800);
    const W2 = clone(contenu(db, "activite", ACT)) || {};
    ok("repris 4 minutes plus tard sans changer de page : ni jour ni dernière activité ajoutés (au plus une fois par 10 min), seul le temps visible", JSON.stringify(W2.jours) === JSON.stringify([D0]) && W2.derniere === W1.derniere && memes(W2.pages, W1.pages), JSON.stringify(W2));
    await page.clock.fastForward(12 * MIN);   // 16 min après la dernière page vue : passé minuit
    const tRep = await maintenant();
    await montrer(page); await attendre(page, 1200); await cacher(page); await attendre(page, 1800);
    const W3 = clone(contenu(db, "activite", ACT)) || {};
    ok("repris après minuit, 16 minutes après la dernière page (sans en changer) : le jour " + D1 + " et la dernière activité (l'instant de la reprise) sont écrits, pages inchangées", JSON.stringify(W3.jours) === JSON.stringify([D0, D1]) && Date.parse(W3.derniere) >= tRep && Date.parse(W3.derniere) <= tRep + 5000 && memes(W3.pages, W1.pages) && W3.temps_s >= W2.temps_s, JSON.stringify(W3) + " · reprise à " + new Date(tRep).toISOString());
    await page.clock.fastForward(3 * MIN);
    await montrer(page); await attendre(page, 1200); await cacher(page); await attendre(page, 1800);
    const W4 = clone(contenu(db, "activite", ACT)) || {};
    ok("repris encore 3 minutes plus tard : la dernière activité ne bouge plus (moins de 10 min depuis la reprise précédente)", W4.derniere === W3.derniere && JSON.stringify(W4.jours) === JSON.stringify([D0, D1]), JSON.stringify(W4));
    ok("chaque écriture suit une relecture de la base", lu(db, "activite") === ecr(db, "activite").length && ecr(db, "activite").length >= 3, "lectures " + lu(db, "activite") + " écritures " + ecr(db, "activite").length);
  });

  await bloc("A. copie hors ligne plus ancienne que la base", async () => {
    const FS = { version: 1, jours: [ilYA(2), ilYA(1)], pages: { formation: 5, "decouverte-resultat": 2 }, temps_s: 400, derniere: avant(20 * H) };
    const copieV = { version: 1, jours: [ilYA(3), ilYA(2)], pages: { formation: 3, "verrou-programme": 4 }, temps_s: 600, derniere: avant(30 * H) };
    const stock = { [CLE_STORE]: JSON.stringify({ a: ACT, t: avant(30 * H), v: copieV }) };
    const db = base({ comptes: seule([["activite", FS, avant(20 * H)]]) });
    const { c, page } = await contexte(b, leaAct, db, { stockage: stock });
    const t0 = Date.now();
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector("#q-probleme", { timeout: 8000 }); await attendre(page, 1500);
    const garde = await lireLocal(page, CLE_STORE);
    ok("au démarrage, copie hors ligne de la clé activite plus ancienne que la base : rien d'écrit tout de suite (ni la copie brute, ni rien d'autre), copie gardée sur l'appareil jusqu'au prochain envoi (qui la fusionne)", ecr(db, "activite").length === 0 && !!garde && !!garde.v && memes(garde.v.pages, copieV.pages), "écritures " + JSON.stringify(ecr(db, "activite").map(e => e.contenu)) + " · copie " + JSON.stringify(garde));
    await cacher(page); await attendre(page, 1800); await montrer(page); await attendre(page, 600);
    const A = contenu(db, "activite", ACT) || {};
    ok("envoi suivant : base relue, fusionnée avec la copie écartée (pour chaque compteur le plus grand : formation 5, verrou-programme 4, decouverte-resultat 2 ; jours réunis ; temps 600 s) puis la visite ajoutée (decouverte-questionnaire 1, aujourd'hui)", ecr(db, "activite").length === 1 && memes(A.pages, { formation: 5, "decouverte-resultat": 2, "verrou-programme": 4, "decouverte-questionnaire": 1 }) && JSON.stringify(A.jours) === JSON.stringify([ilYA(3), ilYA(2), ilYA(1), ajd()]) && A.temps_s >= 601 && A.temps_s <= 600 + Math.ceil((Date.now() - t0) / 1000) + 1, JSON.stringify(A));
    await attendre(page, 1200);
    ok("… la copie de l'appareil est remplacée par cet envoi, puis retirée une fois l'écriture arrivée", (await lireLocal(page, CLE_STORE)) === null, JSON.stringify(await lireLocal(page, CLE_STORE)));
    const ts = await tousLesToasts(page);
    ok("aucun message « Une modification faite hors ligne n'a pas été envoyée » pour l'activité (ce n'est pas une saisie), aucun toast du tout", ts.length === 0, JSON.stringify(ts));
    await c.close();
    /* même situation pour la clé emails (un choix de la personne) : le message reste, avec un nom lisible */
    const stock2 = { [CLE_STORE]: JSON.stringify({ a: ACT, t: avant(30 * H), v: copieV }), ["mhx_attente|" + ACT + "|emails"]: JSON.stringify({ a: ACT, t: avant(5 * H), v: { suivi: true, maj: avant(5 * H) } }) };
    const db2 = base({ comptes: seule([["activite", FS, avant(20 * H)], ["emails", { suivi: false, maj: avant(H) }, avant(H)]]) });
    const { page: p2 } = await contexte(b, leaAct, db2, { stockage: stock2 });
    await p2.goto(`http://localhost:${PORT}/`); await p2.waitForSelector("#q-probleme", { timeout: 8000 }); await attendre(p2, 1800);
    const ts2 = await tousLesToasts(p2);
    const attendu = "Une modification faite hors ligne n'a pas été envoyée (Emails de suivi, " + fr(avant(5 * H)) + ") : une version plus récente existe déjà.";
    ok("copies hors ligne activite + emails plus anciennes que la base : un seul toast, « " + attendu + " » (nom lisible, l'activité n'y figure pas)", ts2.length === 1 && ts2[0] === attendu, JSON.stringify(ts2));
    ok("… la clé emails de la base n'est pas écrasée (suivi: false gardé), ni la copie emails ni la copie activite n'est écrite telle quelle", ecr(db2, "emails").length === 0 && (contenu(db2, "emails", ACT) || {}).suivi === false && ecr(db2, "activite").length === 0, JSON.stringify(db2.ecritures.map(e => e.outil)));
  });

  await bloc("A. déconnexion", async () => {
    const F0 = { version: 1, jours: [ilYA(1)], pages: { formation: 4 }, temps_s: 200, derniere: avant(J) };
    const db = base({ comptes: seule([["activite", F0, avant(J)]]) });
    const { page } = await contexte(b, leaAct, db);
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector("#q-probleme", { timeout: 8000 }); await attendre(page, 800);
    await aller(page, "#/formation", 1400);
    ok("avant la déconnexion (moins d'une minute, onglet visible) : rien de lu ni d'écrit", lu(db, "activite") === 0 && db.ecritures.length === 0);
    /* un autre onglet fermé entre-temps a laissé sa copie locale */
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [CLE_LOCALE, JSON.stringify({ version: 1, jours: [ajd()], pages: { "verrou-suivi": 2 }, temps_s: 30, derniere: new Date().toISOString() })]);
    await page.evaluate(() => { UI.confirmer = async () => { sessionStorage.setItem("__confirmer", String(+(sessionStorage.getItem("__confirmer") || 0) + 1)); return true; }; });
    if (await page.isVisible("#deco").catch(() => false)) await page.click("#deco"); else await page.evaluate(() => { Auth.deconnecter(); });
    await attendre(page, 3500);
    const ordre = db.journal.filter(x => x === "LOGOUT" || x.endsWith(" activite"));
    const A = contenu(db, "activite", ACT) || {};
    ok("« Se déconnecter » : l'activité est relue puis écrite AVANT la déconnexion (formation 4 + 1, decouverte-questionnaire 1, et verrou-suivi 2 + 30 s de la copie d'un onglet fermé)", JSON.stringify(ordre) === '["L activite","E activite","LOGOUT"]' && memes(A.pages, { formation: 5, "decouverte-questionnaire": 1, "verrou-suivi": 2 }) && JSON.stringify(A.jours) === JSON.stringify([ilYA(1), ajd()]) && A.temps_s > 230, JSON.stringify(ordre) + " · " + JSON.stringify(A));
    const apres = await page.evaluate(() => ({ cles: Object.keys(localStorage).concat(Object.keys(sessionStorage)).filter(k => /^mhx_(session|attente\||activite_attente\|)/.test(k)), confirmer: sessionStorage.getItem("__confirmer"), connexion: !!document.querySelector("#c-go, #co-err, .carte-co") })).catch(() => ({}));
    ok("… puis l'appareil est vidé (ni session, ni copie en attente, ni copie d'activité), écran de connexion, aucune alerte « modifications pas encore envoyées » (tout était parti)", Array.isArray(apres.cles) && apres.cles.length === 0 && apres.confirmer === null && apres.connexion, JSON.stringify(apres));
  });

  await bloc("A. déconnexion pendant un envoi d'activité en cours", async () => {
    const F0 = { version: 1, jours: [ilYA(1)], pages: { formation: 4 }, temps_s: 200, derniere: avant(J) };
    const db = base({ comptes: seule([["activite", F0, avant(J)]]) });
    const { page } = await contexte(b, leaAct, db);
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector("#q-probleme", { timeout: 8000 }); await attendre(page, 800);
    await aller(page, "#/formation", 1400);
    db.retardLecture = { activite: 1500 };   // réseau lent : la relecture de la base met 1,5 s
    await cacher(page); await attendre(page, 150); await montrer(page); await attendre(page, 150);   // un envoi commence (relecture en cours)
    const enCours = await page.evaluate(() => Activite._envoi).catch(() => null);
    await page.evaluate(() => { UI.confirmer = async () => true; });
    if (await page.isVisible("#deco").catch(() => false)) await page.click("#deco"); else await page.evaluate(() => { Auth.deconnecter(); });
    await attendre(page, 5000);
    const ordre = db.journal.filter(x => x === "LOGOUT" || x.endsWith(" activite"));
    const A = contenu(db, "activite", ACT) || {};
    ok("« Se déconnecter » cliqué pendant la relecture de l'activité (réponse lente) : l'envoi en cours est attendu, l'activité (formation 4 + 1, decouverte-questionnaire 1) est écrite AVANT la déconnexion", enCours === true && JSON.stringify(ordre) === '["L activite","E activite","LOGOUT"]' && memes(A.pages, { formation: 5, "decouverte-questionnaire": 1 }), "envoi en cours au clic : " + enCours + " · " + JSON.stringify(ordre) + " · base " + JSON.stringify(A.pages));
    const reste = await page.evaluate(() => Object.keys(localStorage).concat(Object.keys(sessionStorage)).filter(k => /^mhx_(session|attente\||activite_attente\|)/.test(k))).catch(() => ["?"]);
    ok("… et rien de l'activité ne reste sur l'appareil après la déconnexion", reste.length === 0, JSON.stringify(reste));
  });

  /* =================== B. Mes clients, tableau de bord, fiche =================== */
  await bloc("B. activite, emails et coach_notifs ne sont pas une saisie", async () => {
    const MARC = PID(1), NORA = PID(2), PIA = PID(3), REMI = PID(4), EVA = PID(5);
    const qProspect = complet({ court_debut: midiIlYA(8), court_le: midiIlYA(8) });
    const db = base({
      comptes: [
        { id: MARC, prenom: "Marc", nom: "Ancien", statut: "client", cree: avant(40 * J), donnees: [["intake", { nom: "Marc Ancien", complet: true, age: 40, sexe: "Homme" }, avant(15 * J + 3 * H)], ["emails", { suivi: false, maj: avant(H) }, avant(H)]] },
        { id: NORA, prenom: "Nora", nom: "Ancienne", statut: "client", cree: avant(40 * J), donnees: [["intake", { nom: "Nora Ancienne", complet: true, age: 38, sexe: "Femme" }, avant(20 * J + 3 * H)], ["coach_notifs", { vu: avant(2 * H) }, avant(2 * H)]] },
        { id: PIA, prenom: "Pia", nom: "Active", cree: avant(10 * J), donnees: [["intake", qProspect, midiIlYA(8)], ["activite", { version: 1, jours: [ilYA(8), ajd()], pages: { formation: 3 }, temps_s: 300, derniere: avant(H) }, avant(H)]] },
        { id: REMI, prenom: "Rémi", nom: "Muet", cree: avant(10 * J), donnees: [["intake", qProspect, midiIlYA(8)]] },
        { id: EVA, prenom: "Eva", nom: "Désinscrite", cree: avant(10 * J), donnees: [["intake", qProspect, midiIlYA(8)], ["emails", { suivi: false, maj: avant(H) }, avant(H)]] }
      ],
      cles: [[F.IDS.c3, "activite", { version: 1, jours: [ajd()], pages: { formation: 3 }, temps_s: 300, derniere: avant(H) }, avant(H)]]
    });
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/clients`); await page.waitForSelector(`[data-ouvrir="${F.IDS.c3}"]`, { timeout: 8000 }); await attendre(page, 800);
    const ligne = uid => page.$eval(`#tb-clients [data-ouvrir="${uid}"]`, bt => { const tr = bt.closest("tr"); return { act: tr.querySelector('td[data-l="Activité"]').textContent.trim(), feu: (tr.querySelector(".point") || {}).title || "" }; }).catch(() => ({}));
    const lj = await ligne(F.IDS.c3), lm = await ligne(MARC), ln = await ligne(NORA);
    ok("Mes clients : Julien (activite écrite il y a 1 h, dernière vraie saisie il y a 12 j) garde « 12 j » et l'alerte « Inactif depuis 12 j »", lj.act === "12 j" && lj.feu.includes("Inactif depuis 12 j"), JSON.stringify(lj));
    ok("Mes clients : Marc (clé emails écrite il y a 1 h) garde « 15 j » / « Inactif depuis 15 j » ; Nora (coach_notifs il y a 2 h) garde « 20 j » / « Inactif depuis 20 j »", lm.act === "15 j" && lm.feu.includes("Inactif depuis 15 j") && ln.act === "20 j" && ln.feu.includes("Inactif depuis 20 j"), JSON.stringify({ lm, ln }));
    const flag = await texte(page, "#alertes-clients");
    ok("Mes clients : « Sans nouvelles depuis 10 jours ou plus : » cite Julien Démo, Marc Ancien et Nora Ancienne", /Sans nouvelles depuis 10 jours ou plus :[^.]*Julien Démo/.test(flag) && /Sans nouvelles depuis 10 jours ou plus :[^.]*Marc Ancien/.test(flag) && /Sans nouvelles depuis 10 jours ou plus :[^.]*Nora Ancienne/.test(flag), flag.slice(0, 300));
    const lp = await ligne(PIA), lr = await ligne(REMI), le = await ligne(EVA);
    ok("Mes clients : la prospecte Pia (activite il y a 1 h) « aujourd'hui » ; Eva (clé emails il y a 1 h, rien d'autre depuis 8 jours) comme Rémi (" + lr.act + "), pas « aujourd'hui »", lp.act === "aujourd'hui" && lr.act !== "aujourd'hui" && le.act === lr.act, JSON.stringify({ lp, lr, le }));
    await page.click(`#tb-clients [data-ouvrir="${F.IDS.c3}"]`); await attendre(page, 2600);
    const alertes = await page.$$eval("#vue .masthead .attention-alertes .pastille", l => l.map(e => e.textContent.trim())).catch(() => []);
    ok("fiche de Julien : l'alerte « Inactif depuis 12 j » est dans l'en-tête (la clé activite, lue par la fiche, ne compte pas pour un client)", alertes.includes("Inactif depuis 12 j"), JSON.stringify(alertes));
    await page.click("#sortir-fiche").catch(() => {}); await attendre(page, 800);
    for (const [uid, nom, n] of [[MARC, "Marc", 15], [NORA, "Nora", 20]]) {
      await aller(page, "#/clients", 1800); await page.waitForSelector(`#tb-clients [data-ouvrir="${uid}"]`, { timeout: 8000 });
      await page.click(`#tb-clients [data-ouvrir="${uid}"]`); await attendre(page, 2600);
      const al = await page.$$eval("#vue .masthead .attention-alertes .pastille", l => l.map(e => e.textContent.trim())).catch(() => []);
      ok(`fiche de ${nom} (clé ${uid === MARC ? "emails" : "coach_notifs"} récente) : « Inactif depuis ${n} j » dans l'en-tête`, al.includes("Inactif depuis " + n + " j"), JSON.stringify(al));
      await page.click("#sortir-fiche").catch(() => {}); await attendre(page, 800);
    }
    await aller(page, "#/tableau", 2600);
    const cj = await page.$$eval("#tb-vue .attention-c", l => l.map(e => e.textContent.replace(/\s+/g, " ").trim()).filter(t => t.includes("Julien Démo"))).catch(() => []);
    ok("tableau de bord, « Qui nécessite ton attention » : Julien « dernière saisie il y a 12 j », « Inactif depuis 12 j »", cj.length === 1 && cj[0].includes("dernière saisie il y a 12 j") && cj[0].includes("Inactif depuis 12 j"), JSON.stringify(cj));
    await aller(page, "#/prospects", 2400); await filtre(page, "tous");
    const rp = await raisons(page, PIA), rr = await raisons(page, REMI), re = await raisons(page, EVA);
    ok("page Prospects : Pia (activité il y a 1 h) TIÈDE, sans « Aucune action depuis »", (await pastilleEtat(page, PIA)) === "TIÈDE" && !rp.some(x => x.startsWith("Aucune action depuis")), (await pastilleEtat(page, PIA)) + " " + JSON.stringify(rp));
    ok("page Prospects : Rémi (rien depuis 8 jours) FROID « Aucune action depuis 8 jours (découverte terminée). » ; Eva aussi (un changement d'avis sur les emails n'est pas une action)", (await pastilleEtat(page, REMI)) === "FROID" && rr.includes("Aucune action depuis 8 jours (découverte terminée).") && (await pastilleEtat(page, EVA)) === "FROID" && re.includes("Aucune action depuis 8 jours (découverte terminée)."), JSON.stringify({ rr, re }));
    await page.click(`#pr-liste .sc-carte[data-uid="${PIA}"] [data-sc="fiche"]`); await page.waitForSelector("#fiche-score", { timeout: 6000 }); await attendre(page, 500);
    const sc = await page.$eval("#vue .sc-fiche .seance-c-tete .pastille", e => e.textContent.trim()).catch(() => "");
    ok("fiche de Pia : suivi commercial TIÈDE (son activité compte, c'est une prospecte)", sc === "TIÈDE", sc);
    ok("affichages : aucune écriture", db.ecritures.length === 0, JSON.stringify(db.ecritures.map(e => e.outil || e.table)));
  });

  /* =================== C. email du compte (email_compte) =================== */
  const NEWP = PID(21), PERSO = "perso@exemple.fr";
  /* v52 (28/09/2026, Chantier 1 lot C) : les 3 questions (probleme, obstacle, projection) remplacent les 10 ; le premier
     brouillon part avec la première réponse (avant : avec l'âge, #q-age, seulement à partir de 18 ans) */
  await bloc("C. premier brouillon et réponse « email » d'un questionnaire", async () => {
    const db = base({ comptes: [{ id: NEWP, prenom: "Léa", nom: "", cree: avant(2 * J) }] });
    const { c, page } = await contexte(b, qui(NEWP, EMAIL_ACT), db);
    await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector("#q-probleme", { timeout: 8000 }); await attendre(page, 800);
    ok("affichage du questionnaire (pas commencé) : rien d'écrit", ecr(db, "intake").length === 0);
    await page.selectOption("#q-probleme", "Perdre du gras"); await attendre(page, 1500);
    const I1 = contenu(db, "intake", NEWP) || {};
    ok("premier brouillon (objectif « Perdre du gras ») : email_compte = l'email du compte, jamais de clé « email » (question « email » du questionnaire client)", ecr(db, "intake").length === 1 && I1.email_compte === EMAIL_ACT && !("email" in I1) && typeof I1.court_debut === "string", JSON.stringify(I1));
    await c.close();
    /* intake qui porte déjà une réponse « email » (questionnaire client) : elle n'est jamais remplacée */
    const db2 = base({ comptes: [{ id: NEWP, prenom: "Léa", nom: "", cree: avant(2 * J), donnees: [["intake", { email: PERSO }, avant(J)]] }] });
    const { page: p2 } = await contexte(b, qui(NEWP, EMAIL_ACT), db2);
    await p2.goto(`http://localhost:${PORT}/`); await p2.waitForSelector("#q-probleme", { timeout: 8000 }); await attendre(p2, 800);
    ok("intake avec une réponse « email » mais questionnaire pas commencé : rien d'écrit à l'affichage", ecr(db2, "intake").length === 0);
    await p2.selectOption("#q-probleme", "Perdre du gras"); await attendre(p2, 1500);
    const I2 = contenu(db2, "intake", NEWP) || {};
    ok("premier brouillon : la réponse « email » (" + PERSO + ") reste intacte, l'email du compte va dans email_compte", I2.email === PERSO && I2.email_compte === EMAIL_ACT && I2.probleme === "Perdre du gras", JSON.stringify(I2));
    await p2.fill("#q-obstacle", "Le temps"); await p2.fill("#q-projection", "Courir 10 km");
    await attendre(p2, 1200);
    await p2.click("#dc-voir"); await attendre(p2, 1600);
    const I3 = contenu(db2, "intake", NEWP) || {};
    ok("validation (« Valider mes réponses ») : court_le posé, email toujours " + PERSO + ", email_compte = email du compte", typeof I3.court_le === "string" && I3.email === PERSO && I3.email_compte === EMAIL_ACT, JSON.stringify(I3));
    ok("aucune écriture intake ne touche la réponse « email »", ecr(db2, "intake").every(e => e.contenu.email === PERSO), JSON.stringify(ecr(db2, "intake").map(e => e.contenu.email)));
  });

  await bloc("C. adresse du compte changée", async () => {
    for (const fait of [false, true]) {
      const I0 = Object.assign({ sexe: "Femme", age: "30", taille: "168", poids: "64", court_debut: avant(J), email_compte: "ancien@exemple.fr", email: PERSO }, fait ? { objectif: "Prise de muscle", seances: "3", motivation: "8", court_le: avant(J - H) } : {});
      const db = base({ comptes: [{ id: NEWP, prenom: "Léa", nom: "", cree: avant(2 * J), donnees: [["intake", I0, avant(J)]] }] });
      const { c, page } = await contexte(b, qui(NEWP, "nouveau@exemple.fr"), db);
      /* v52 : validé sans choix → la page de proposition de bilan (avant : le résultat, #dc-modifier) ; commencé → les 3 questions */
      await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector(fait ? "#dc-bilan" : "#q-probleme", { timeout: 8000 }); await attendre(page, 1500);
      const I1 = contenu(db, "intake", NEWP) || {};
      const attI = Object.assign({}, I0, { email_compte: "nouveau@exemple.fr" });
      ok(`adresse du compte changée (${fait ? "questionnaire validé, page bilan" : "questionnaire commencé"}) : une seule écriture à l'affichage, email_compte = nouveau@exemple.fr, tout le reste identique (réponse « email » comprise)`, ecr(db, "intake").length === 1 && memes(I1, attI), JSON.stringify(I1));
      await aller(page, "#/formation", 1400); await aller(page, "#/decouverte", 1800);
      ok(`… page quittée puis rouverte : plus aucune écriture (l'adresse est à jour)`, ecr(db, "intake").length === 1 && db.ecritures.filter(e => e.outil !== "activite").length === 1, JSON.stringify(db.ecritures.map(e => e.outil || e.table)));
      await c.close();
    }
  });

  await bloc("C. aucune écriture sinon", async () => {
    const cas = [
      ["adresse inchangée (email_compte = email du compte)", { sexe: "Femme", age: "30", court_debut: avant(J), email_compte: EMAIL_ACT }],
      ["questionnaire pas commencé (intake vide)", {}],
      ["questionnaire pas commencé (seulement une réponse « email » de questionnaire client)", { email: PERSO }]
    ];
    for (const [quoi, I0] of cas) {
      const db = base({ comptes: [{ id: NEWP, prenom: "Léa", nom: "", cree: avant(2 * J), donnees: [["intake", I0, avant(J)]] }] });
      const { c, page } = await contexte(b, qui(NEWP, EMAIL_ACT), db);
      await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector("#q-probleme", { timeout: 8000 }); await attendre(page, 1300);
      await aller(page, "#/formation", 1200); await aller(page, "#/decouverte", 1600);
      ok(`${quoi} : affichages de la Découverte sans aucune écriture`, db.ecritures.length === 0 && memes(contenu(db, "intake", NEWP), I0), JSON.stringify(db.ecritures.map(e => e.outil || e.table)));
      await c.close();
    }
  });

  await bloc("C. côté coach : email_compte, à défaut l'ancien intake.email", async () => {
    const PA = PID(22), PB = PID(23), PC = PID(24);
    const db = base({ comptes: [
      { id: PA, prenom: "Anna", nom: "Compte", cree: avant(3 * J), donnees: [["intake", { sexe: "Femme", age: "30", court_debut: avant(3 * J - H), email_compte: "compte.a@exemple.fr", email: "perso.a@exemple.fr" }, midiIlYA(2)]] },
      { id: PB, prenom: "Bruno", nom: "Ancien", cree: avant(4 * J), donnees: [["intake", { sexe: "Homme", age: "40", court_debut: avant(4 * J - H), email: "ancien.b@exemple.fr" }, midiIlYA(3)]] },
      { id: PC, prenom: "Chloé", nom: "Rien", cree: avant(5 * J) }
    ] });
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await page.waitForSelector("#pr-liste", { timeout: 8000 }); await attendre(page, 600);
    await filtre(page, "tous");
    const ca = await carte(page, PA), cb = await carte(page, PB);
    ok("cartes : Anna affiche compte.a@exemple.fr (jamais sa réponse perso.a@…), Bruno (données d'avant la v51) affiche ancien.b@exemple.fr", ca.includes("compte.a@exemple.fr") && !ca.includes("perso.a@") && cb.includes("ancien.b@exemple.fr"), ca.slice(0, 160) + " | " + cb.slice(0, 160));
    await chercher(page, "compte.a@"); const r1 = await uids(page);
    await chercher(page, "perso.a"); const r2 = await uids(page);
    await chercher(page, "ancien.b@"); const r3 = await uids(page);
    ok("recherche : « compte.a@ » → Anna, « perso.a » → personne, « ancien.b@ » → Bruno", JSON.stringify(r1) === JSON.stringify([PA]) && r2.length === 0 && JSON.stringify(r3) === JSON.stringify([PB]), JSON.stringify([r1, r2, r3]));
    await chercher(page, "");
    const L = lireCSV((await exporter(page)).replace(/^﻿/, "")).slice(1);
    const col = n => (L.find(l => l[0] === n) || [])[1];
    ok("export CSV, colonne Email : Anna compte.a@exemple.fr, Bruno ancien.b@exemple.fr, Chloé vide", col("Anna Compte") === "compte.a@exemple.fr" && col("Bruno Ancien") === "ancien.b@exemple.fr" && col("Chloé Rien") === "", JSON.stringify(L.map(l => [l[0], l[1]])));
    await ouvrirFiche(page, PA);
    const ea = Object.fromEntries(await lignesLi(page, "#fiche-reponses")).Email, ma = await page.getAttribute("#dc-mail", "href").catch(() => "");
    ok("fiche d'Anna : « Email » compte.a@exemple.fr, « Lui écrire un email » vers compte.a@exemple.fr, lien de réservation avec cet email", ea === "compte.a@exemple.fr" && (ma || "").startsWith("mailto:compte.a%40exemple.fr?") && (await page.$eval("#dc-lien", e => e.value).catch(() => "")).includes("email=compte.a%40exemple.fr"), ea + " · " + (ma || "").slice(0, 60));
    await aller(page, "#/prospects", 2200); await ouvrirFiche(page, PB);
    const eb = Object.fromEntries(await lignesLi(page, "#fiche-reponses")).Email, mb = await page.getAttribute("#dc-mail", "href").catch(() => "");
    ok("fiche de Bruno : « Email » ancien.b@exemple.fr (repli sur l'ancien intake.email), mailto vers cette adresse", eb === "ancien.b@exemple.fr" && (mb || "").startsWith("mailto:ancien.b%40exemple.fr?"), eb + " · " + (mb || "").slice(0, 60));
    ok("côté coach : aucune écriture", db.ecritures.length === 0);
  });

  /* =================== D. purge au premier remplissage =================== */
  /* v52 (28/09/2026, Chantier 1 lot C) : le questionnaire court ne demande plus l'âge (3 questions : probleme, obstacle,
     projection) ; il n'y a donc plus d'âge mineur à purger ici. Les 6 vérifications de ce bloc (âge 15 après une visite
     précédente, à la sortie du champ et à « Voir mon résultat », âge corrigé, purge limitée au premier remplissage) sont
     retirées : le garde-fou 18 ans passe au calculateur (lot D). La garde reste dans le code du formulaire, inerte sans
     question « age » : verif56 (bloc H) la vérifie en remettant une question d'âge dans la page servie. */

  /* =================== E. bandeau de première connexion =================== */
  await bloc("E. ancien prospect passé client", async () => {
    const EX = PID(25), VRAI = PID(26);
    const cas = [
      [EX, "ex@exemple.fr", { sexe: "Femme", age: "31", court_debut: avant(3 * J), email_compte: "ex@exemple.fr", complet: false }, "Bienvenue dans l'accompagnement !", "client sans nom, 2 réponses du questionnaire court + court_debut + email_compte, complet false"],
      [VRAI, "vrai@exemple.fr", { ville: "Lyon", sommeil_h: 7, stress: "5", energie: "6", complet: false }, "Reprends ton profil là où tu t'es arrêté.", "client qui a commencé son questionnaire complet (4 réponses, aucune du questionnaire court, presque toutes les obligatoires manquent)"],
      [PID(27), "ancien@exemple.fr", { nom: "Camille Martin", age: "34", sexe: "Femme", taille: "165", poids: "60", objectif: "Perte de poids / sèche", niveau: "Débutant (moins de 6 mois)", lieu: "Salle complète", seances: "3", journee_type: "Tartines, pâtes.", nb_repas: "3 repas", complet: false }, "Une réponse manque à ton profil.", "témoin : client inscrit avant l'ajout d'une question obligatoire (une seule manque)"]
    ];
    for (const [id, mail, I, att, quoi] of cas) {
      const db = base({ comptes: [{ id, prenom: "Camille", nom: "", statut: "client", cree: avant(5 * J), donnees: [["intake", I, avant(2 * J)]] }] });
      const { c, page } = await contexte(b, qui(id, mail), db);
      await page.goto(`http://localhost:${PORT}/`); await attendre(page, 3000);
      const tb = await texte(page, "#vue .bandeau strong");
      ok(`${quoi} : Profil ouvert avec le bandeau « ${att} »`, tb === att && /#\/profil/.test(page.url()), tb + " · " + page.url());
      ok(`… aucune écriture`, db.ecritures.length === 0);
      await c.close();
    }
  });

  /* =================== F. Nouveautés =================== */
  const NV = Array.from({ length: 12 }, (_, i) => ({ id: PID(40 + i), prenom: "Nv", nom: String(i + 1).padStart(2, "0"), cree: avant((i + 1) * 5 * H + 10 * MIN) }))
    .concat([{ id: PID(39), prenom: "Vieux", nom: "Prospect", cree: avant(9 * J) }]);
  const NOMS_NV = NV.slice(0, 12).map(x => "Nv " + x.nom + " · inscription");
  await bloc("F. date « vu » non ISO", async () => {
    const db = base({ comptes: NV, cles: [[F.IDS.coach, "coach_notifs", { vu: "<img src=x>2026-09-20" }, avant(H)]] });
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/tableau`); await page.waitForSelector("#tb-nouveautes .nv-panneau", { timeout: 8000 }); await attendre(page, 500);
    const pan = await texte(page, "#tb-nouveautes");
    ok("coach_notifs.vu « <img src=x>2026-09-20 » ignoré : « Ces 7 derniers jours : », 12 nouveautés (le prospect de 9 jours absent), aucune injection", pan.includes("Ces 7 derniers jours :") && (await texte(page, "#tb-nouveautes .seance-c-tete .pastille")) === "12" && !pan.includes("Vieux") && !(await xss(page)), pan.slice(0, 160));
    ok("tableau de bord : les 8 plus récentes, puis « Et 4 autres : tout voir dans la page Prospects → » (lien vers #/prospects)", JSON.stringify(await nvVisibles(page, "#tb-nouveautes")) === JSON.stringify(NOMS_NV.slice(0, 8)) && pan.includes("Et 4 autres : tout voir dans la page Prospects →") && (await page.getAttribute("#tb-nouveautes a.link-a", "href").catch(() => "")) === "#/prospects" && !(await page.$("#tb-nouveautes [data-nv-plus]")), JSON.stringify(await nvVisibles(page, "#tb-nouveautes")));
    await page.click("#tb-nouveautes a.link-a"); await page.waitForSelector("#pr-nouveautes .nv-panneau", { timeout: 8000 }); await attendre(page, 500);
    ok("le lien mène à la page Prospects", /#\/prospects$/.test(page.url()) && !!(await page.$("#pr-liste")), page.url());
    const bt = await texte(page, "#pr-nouveautes [data-nv-plus]");
    ok("page Prospects : 8 nouveautés affichées, les 4 autres repliées, bouton « Voir les 4 suivantes »", JSON.stringify(await nvVisibles(page, "#pr-nouveautes")) === JSON.stringify(NOMS_NV.slice(0, 8)) && bt === "Voir les 4 suivantes" && (await page.$$("#pr-nouveautes .nv-liste li")).length === 12, bt + " · " + (await nvVisibles(page, "#pr-nouveautes")).length);
    await page.click("#pr-nouveautes [data-nv-plus]"); await attendre(page, 300);
    ok("« Voir les 4 suivantes » : les 12 affichées sur place, dans l'ordre (de la plus récente à la plus ancienne), le bouton disparaît", JSON.stringify(await nvVisibles(page, "#pr-nouveautes")) === JSON.stringify(NOMS_NV) && !(await page.$("#pr-nouveautes [data-nv-plus]")), JSON.stringify(await nvVisibles(page, "#pr-nouveautes")));
    ok("Nouveautés : aucune écriture", db.ecritures.length === 0);
  });
  await bloc("F. lecture de la dernière visite ratée", async () => {
    const db = base({ comptes: NV, lectureKo: ["coach_notifs"] });
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/tableau`); await page.waitForSelector("#tb-nouveautes .nv-panneau", { timeout: 8000 }); await attendre(page, 500);
    const pan = await texte(page, "#tb-nouveautes");
    ok("lecture de coach_notifs ratée (500) : le panneau le dit (« Ta dernière visite n'a pas pu être lue (réseau) : nouveautés des 7 derniers jours. »), 12 nouveautés des 7 derniers jours", pan.includes("Ta dernière visite n'a pas pu être lue (réseau) : nouveautés des 7 derniers jours.") && pan.includes("Ces 7 derniers jours :") && (await texte(page, "#tb-nouveautes .seance-c-tete .pastille")) === "12", pan.slice(0, 200));
    const n0 = lu(db, "coach_notifs");
    await page.click("#tb-nouveautes [data-nv-vu]"); await attendre(page, 1500);
    ok("« Tout marquer comme vu » toujours en panne : relu d'abord, rien d'écrit, « Non enregistré : vérifie ta connexion et réessaie. », bouton de nouveau actif", lu(db, "coach_notifs") === n0 + 1 && ecr(db, "coach_notifs").length === 0 && (await texte(page, "#tb-nouveautes .msg")) === "Non enregistré : vérifie ta connexion et réessaie." && (await page.$eval("#tb-nouveautes [data-nv-vu]", e => !e.disabled).catch(() => false)), (await texte(page, "#tb-nouveautes .msg")) + " · lectures " + (lu(db, "coach_notifs") - n0));
    db.lectureKo = [];
    const t0 = Date.now();
    await page.click("#tb-nouveautes [data-nv-vu]"); await attendre(page, 1800);
    const N = contenu(db, "coach_notifs", F.IDS.coach) || {};
    ok("réseau revenu, nouveau clic : relu puis écrit une fois, coach_notifs.vu = maintenant au format ISO", ecr(db, "coach_notifs").length === 1 && typeof N.vu === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(N.vu) && Math.abs(Date.parse(N.vu) - t0) < 10000 && lu(db, "coach_notifs") === n0 + 2, JSON.stringify(N));
    const pan2 = await texte(page, "#tb-nouveautes");
    ok("… panneau « Rien de nouveau chez tes prospects depuis ta dernière visite (" + fr(N.vu || 0) + " " + hm(N.vu || 0) + "). », avertissement retiré, badge disparu", pan2.includes("Rien de nouveau chez tes prospects depuis ta dernière visite (" + fr(N.vu || 0) + " " + hm(N.vu || 0) + ").") && !pan2.includes("n'a pas pu être lue") && (await badge(page)).length === 0, pan2 + " · " + JSON.stringify(await badge(page)));
    ok("seule écriture : coach_notifs", db.ecritures.length === 1, JSON.stringify(db.ecritures.map(e => e.outil || e.table)));
  });
  await bloc("F. dernière visite relue à chaque affichage", async () => {
    const db = base({ comptes: NV });
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/tableau`); await page.waitForSelector("#tb-nouveautes .nv-panneau", { timeout: 8000 }); await attendre(page, 500);
    const n1 = luDirect(db, "coach_notifs");
    ok("tableau de bord : 12 nouveautés, badge « 12 », coach_notifs lu une fois", (await texte(page, "#tb-nouveautes .seance-c-tete .pastille")) === "12" && JSON.stringify(await badge(page)) === '["12"]' && n1 === 1, "lectures " + n1 + " · " + JSON.stringify(await badge(page)));
    /* un autre appareil du coach marque tout comme vu */
    const vu = new Date().toISOString();
    db.donnees.push({ user_id: F.IDS.coach, outil: "coach_notifs", contenu: { vu }, maj_le: vu });
    await attendre(page, 1100);
    await aller(page, "#/prospects", 2400);
    ok("tout marqué comme vu sur un autre appareil : la page Prospects relit la date (1 lecture de plus) → « Rien de nouveau… depuis ta dernière visite », badge disparu, sans recharger", luDirect(db, "coach_notifs") === n1 + 1 && (await texte(page, "#pr-nouveautes")).includes("Rien de nouveau chez tes prospects depuis ta dernière visite (" + fr(vu) + " " + hm(vu) + ").") && (await badge(page)).length === 0, "lectures " + luDirect(db, "coach_notifs") + " · " + (await texte(page, "#pr-nouveautes")).slice(0, 120));
    ok("aucune écriture", db.ecritures.length === 0);
  });
  await bloc("F. « Tout marquer comme vu » puis page Prospects avant l'arrivée de l'écriture", async () => {
    const db = base({ comptes: NV }); db.retard = { coach_notifs: 2500 };   // l'écriture met 2,5 s à arriver
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/tableau`); await page.waitForSelector("#tb-nouveautes [data-nv-vu]", { timeout: 8000 }); await attendre(page, 500);
    ok("avant : 12 nouveautés, badge « 12 »", (await texte(page, "#tb-nouveautes .seance-c-tete .pastille")) === "12" && JSON.stringify(await badge(page)) === '["12"]', JSON.stringify(await badge(page)));
    const n0 = luDirect(db, "coach_notifs"), t0 = Date.now();
    await page.click("#tb-nouveautes [data-nv-vu]");
    await page.evaluate(() => { location.hash = "#/prospects"; });   // aussitôt, pendant le délai d'écriture (700 ms) puis son envoi
    await page.waitForSelector("#pr-nouveautes .nv-panneau", { timeout: 8000 }); await attendre(page, 200);
    const pan = await texte(page, "#pr-nouveautes"), bd = await badge(page), dejaEcrit = contenu(db, "coach_notifs", F.IDS.coach), vis = await nvVisibles(page, "#pr-nouveautes");
    ok("#/prospects ouvert aussitôt après « Tout marquer comme vu » (date relue avant l'écriture puis par la page, la base ne l'a pas encore) : « Rien de nouveau chez tes prospects depuis ta dernière visite (" + fr(t0) + " …) », aucune ancienne nouveauté, pas de badge", dejaEcrit === undefined && luDirect(db, "coach_notifs") === n0 + 2 && pan.includes("Rien de nouveau chez tes prospects depuis ta dernière visite (" + fr(t0) + " ") && vis.length === 0 && !(await page.$("#pr-nouveautes [data-nv-plus]")) && bd.length === 0, JSON.stringify({ dejaEcrit, lectures: luDirect(db, "coach_notifs") - n0, bd, vis: vis.length }) + " · " + pan.slice(0, 200));
    await attendre(page, 3500);
    const N = contenu(db, "coach_notifs", F.IDS.coach) || {};
    ok("… l'écriture arrive ensuite (après la relecture de la page Prospects) : une seule, coach_notifs.vu = l'instant où la page a été lue (juste avant le clic), au format ISO", ecr(db, "coach_notifs").length === 1 && typeof N.vu === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(N.vu) && Math.abs(Date.parse(N.vu) - t0) < 5000 && db.journal.lastIndexOf("L coach_notifs") < db.journal.indexOf("E coach_notifs"), JSON.stringify(N) + " · " + JSON.stringify(db.journal.filter(x => /coach_notifs/.test(x))));
    await aller(page, "#/tableau", 2400);
    const pan2 = await texte(page, "#tb-nouveautes");
    ok("retour au tableau de bord : « Rien de nouveau … (" + fr(N.vu || 0) + " " + hm(N.vu || 0) + ") », pas de badge", pan2.includes("Rien de nouveau chez tes prospects depuis ta dernière visite (" + fr(N.vu || 0) + " " + hm(N.vu || 0) + ").") && (await badge(page)).length === 0, pan2.slice(0, 200) + " · " + JSON.stringify(await badge(page)));
    ok("seule écriture : coach_notifs", db.ecritures.length === 1, JSON.stringify(db.ecritures.map(e => e.outil || e.table)));
  });
  await bloc("F. plus de 300 nouveautés", async () => {
    const beaucoup = Array.from({ length: 310 }, (_, i) => ({ id: GEN(i), prenom: "Masse", nom: "M" + p4(i), cree: avant((i + 1) * 30 * MIN) }));
    const db = base({ comptes: beaucoup });
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/tableau`); await page.waitForSelector("#tb-nouveautes .nv-panneau", { timeout: 12000 }); await attendre(page, 500);
    ok("tableau de bord, 310 nouveautés : 8 affichées, « Et 302 autres : tout voir dans la page Prospects → »", (await nvVisibles(page, "#tb-nouveautes")).length === 8 && (await texte(page, "#tb-nouveautes")).includes("Et 302 autres : tout voir dans la page Prospects →"), (await texte(page, "#tb-nouveautes")).slice(-200));
    await aller(page, "#/prospects", 3000); await page.waitForSelector("#pr-nouveautes .nv-panneau", { timeout: 12000 });
    ok("page Prospects : bouton « Voir les 292 suivantes » (300 au plus sont listées)", (await texte(page, "#pr-nouveautes [data-nv-plus]")) === "Voir les 292 suivantes", await texte(page, "#pr-nouveautes [data-nv-plus]"));
    await page.click("#pr-nouveautes [data-nv-plus]"); await attendre(page, 400);
    const vis = await nvVisibles(page, "#pr-nouveautes");
    const note = await page.$$eval("#pr-nouveautes p.nv-suite", l => l.filter(p => !p.hidden).map(p => p.textContent.replace(/\s+/g, " ").trim())).catch(() => []);
    ok("dépliées : 300 nouveautés (de Masse M0000 à M0299), « Les 10 plus anciennes ne sont pas listées : filtre la liste ci-dessous par date d'inscription. »", vis.length === 300 && vis[0] === "Masse M0000 · inscription" && vis[299] === "Masse M0299 · inscription" && JSON.stringify(note) === JSON.stringify(["Les 10 plus anciennes ne sont pas listées : filtre la liste ci-dessous par date d'inscription."]), vis.length + " · " + JSON.stringify(note));
  });

  /* =================== G. mobile 390 px =================== */
  await bloc("G. mobile 390 px, email de 120 caractères", async () => {
    const LONG = PID(27), mail = "a".repeat(109) + "@exemple.fr";
    const note = "n".repeat(150), obj = "Objectif" + "x".repeat(90);
    const db = base({ comptes: [{ id: LONG, prenom: "Long", nom: "Email", cree: avant(4 * J), donnees: [
      ["intake", { sexe: "Femme", age: "30", objectif: obj, obstacle: "o".repeat(120), court_debut: avant(4 * J - H), email_compte: mail }, midiIlYA(3)],
      ["suivi_prospect", { version: 1, issue: "perdu", issue_le: midiIlYA(2), note, historique: [{ type: "issue", valeur: "perdu", le: midiIlYA(2), note }] }, midiIlYA(2)] ] }] });
    const { page } = await contexte(b, coach, db, { viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/#/prospects`); await page.waitForSelector("#pr-liste", { timeout: 8000 }); await attendre(page, 600);
    await filtre(page, "tous");
    ok("email de " + mail.length + " caractères sans tiret : la carte l'affiche en entier, page Prospects sans défilement horizontal", mail.length === 120 && (await carte(page, LONG)).includes(mail) && !(await deborde(page)), await largeur(page));
    await page.screenshot({ path: path.join(OUT, "prospects-email-long.png"), fullPage: true });
    await ouvrirFiche(page, LONG);
    const rep = Object.fromEntries(await lignesLi(page, "#fiche-reponses"));
    ok("fiche (réponses, chronologie avec une note de 150 caractères sans espace, suivi commercial, découverte) : email affiché en entier, aucun défilement horizontal", rep.Email === mail && (await texte(page, "#fiche-chrono")).includes(note) && !(await deborde(page)), await largeur(page));
    await page.screenshot({ path: path.join(OUT, "fiche-email-long.png"), fullPage: true });
    const larges = await page.evaluate(() => Array.from(document.querySelectorAll("#vue *")).filter(e => e.getBoundingClientRect().right > window.innerWidth + 1 && !e.closest(".scroll")).map(e => e.tagName + (e.id ? "#" + e.id : "") + "." + String(e.className).split(" ")[0]).slice(0, 5)).catch(() => ["?"]);
    ok("fiche : aucun élément ne dépasse la largeur de l'écran", larges.length === 0, JSON.stringify(larges));
    ok("mobile : aucune écriture", db.ecritures.length === 0);
  });

  /* =================== H. restauration d'une sauvegarde =================== */
  await bloc("H. restaurer une sauvegarde : ni emails ni activite", async () => {
    const F0 = { version: 1, jours: [ilYA(1)], pages: { formation: 2 }, temps_s: 100, derniere: avant(J) };
    const db = base({ comptes: seule([["emails", { suivi: false, maj: avant(H) }, avant(H)], ["activite", F0, avant(J)]]) });
    const { page } = await contexte(b, leaAct, db);
    await page.goto(`http://localhost:${PORT}/#/profil`); await page.waitForSelector("#sv-paste", { timeout: 8000 }); await attendre(page, 1500);
    const sauvegarde = JSON.stringify({ plateforme: "mhx", version: 2, donnees: {
      emails: { suivi: true, maj: avant(3 * J) },
      activite: { version: 1, jours: [ilYA(30)], pages: { formation: 99 }, temps_s: 9999, derniere: avant(30 * J) },
      formation: { coches: { p1a: true }, ouvert: "", lecon: "", challenge: "", defis: {}, diete: {}, semaine: 1, jour: 0, priorites: { semaine: [], demain: [] }, notes: [], objectifs: [] } } });
    /* le message s'affiche puis le Profil est réaffiché 500 ms plus tard (message effacé) : on note chaque message vu */
    const restaurer = async (t) => {
      await page.evaluate(() => { window.__msgs = []; const o = new MutationObserver(() => { const m = document.getElementById("sv-msg"); const x = m && m.textContent.trim(); if (x && window.__msgs[window.__msgs.length - 1] !== x) window.__msgs.push(x); }); o.observe(document.body, { childList: true, subtree: true, characterData: true }); });
      await page.click("#sv-paste"); await page.waitForSelector("#ui-champ"); await page.fill("#ui-champ", t); await page.click('[data-ui-b="1"]'); await attendre(page, 1800);
      return page.evaluate(() => window.__msgs || []);
    };
    const m1 = await restaurer(sauvegarde);
    ok("sauvegarde avec emails { suivi: true }, activite et formation : « Sauvegarde restaurée. », formation écrite", m1.includes("Sauvegarde restaurée.") && ecr(db, "formation", ACT).length === 1, JSON.stringify(m1) + " · " + JSON.stringify(db.ecritures.map(e => e.outil)));
    ok("… ni la clé emails (désinscription gardée : suivi false) ni la clé activite ne sont réécrites", ecr(db, "emails").length === 0 && ecr(db, "activite").length === 0 && (contenu(db, "emails", ACT) || {}).suivi === false && memes(contenu(db, "activite", ACT), F0), JSON.stringify(db.ecritures.map(e => e.outil)));
    await attendre(page, 1200);
    ok("… le Profil réaffiché garde l'interrupteur des emails décoché", (await page.$eval("#mc-emails", e => e.checked).catch(() => null)) === false);
    const n0 = db.ecritures.length;
    const m2 = await restaurer(JSON.stringify({ plateforme: "mhx", version: 2, donnees: { emails: { suivi: true, maj: avant(3 * J) }, activite: { pages: { formation: 99 } } } }));
    ok("sauvegarde qui ne contient que emails et activite : « Cette sauvegarde n'est pas lisible. », rien d'écrit", m2.includes("Cette sauvegarde n'est pas lisible.") && !m2.includes("Sauvegarde restaurée.") && db.ecritures.length === n0, JSON.stringify(m2) + " · " + JSON.stringify(db.ecritures.slice(n0).map(e => e.outil)));
    const r = await page.evaluate(async (t) => { try { await Store.importer(t); return "ok"; } catch (e) { return String(e.message); } }, JSON.stringify({ emails: { suivi: true }, activite: { pages: { x: 1 } } }));
    await attendre(page, 800);
    ok("Store.importer appelé directement avec { emails, activite } : refusé (« vide »), rien d'écrit", r === "vide" && db.ecritures.length === n0 && ecr(db, "emails").length === 0 && ecr(db, "activite").length === 0, r);
  });

  /* =================== I. page Prospects : une action garde la liste =================== */
  await bloc("I. « Afficher plus » puis une action sur une carte", async () => {
    const liste = Array.from({ length: 150 }, (_, i) => ({ id: GEN(i), prenom: "Prospect", nom: "N" + p4(i), cree: avant((2 + i % 20) * J + i * MIN) }));
    const db = base({ comptes: liste, cles: [[F.IDS.coach, "coach_notifs", { vu: new Date(T0).toISOString() }, new Date(T0).toISOString()]] });
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await page.waitForSelector("#pr-liste .sc-carte", { timeout: 10000 }); await attendre(page, 600);
    await filtre(page, "tous");
    await page.click("#pr-plus"); await attendre(page, 400);
    const l0 = await uids(page);
    ok("« Tous » puis « Afficher plus » : 100 cartes, « Afficher 50 de plus (50 restants) »", l0.length === 100 && (await texte(page, "#pr-plus")) === "Afficher 50 de plus (50 restants)", l0.length + " · " + (await texte(page, "#pr-plus")));
    const cible = l0[89];
    await page.$eval(`#pr-liste .sc-carte[data-uid="${cible}"]`, e => e.scrollIntoView({ block: "center" })); await attendre(page, 300);
    const centre = () => page.evaluate(() => { const y = window.innerHeight / 2; let best = -1, d = 1e9; Array.from(document.querySelectorAll("#pr-liste .sc-carte")).forEach((c, i) => { const r = c.getBoundingClientRect(); const e = r.top <= y && r.bottom >= y ? 0 : Math.min(Math.abs(r.top - y), Math.abs(r.bottom - y)); if (e < d){ d = e; best = i; } }); return best; });
    const y0 = await page.evaluate(() => window.scrollY), i0 = await centre();
    await page.click(`#pr-liste .sc-carte[data-uid="${cible}"] [data-sc="relance"]`); await attendre(page, 2800);
    const l1 = await uids(page), y1 = await page.evaluate(() => window.scrollY), i1 = await centre();
    const S = contenu(db, "suivi_prospect", cible) || {};
    ok("« J'ai relancé » sur la 90e carte : relance enregistrée (une écriture)", ecr(db, "suivi_prospect", cible).length === 1 && Array.isArray(S.relances) && S.relances.length === 1, JSON.stringify(S));
    ok("… la liste rechargée garde ses 100 cartes (pas de retour à 50), « Afficher 50 de plus (50 restants) »", l1.length >= 100 && (await texte(page, "#pr-plus")) === "Afficher 50 de plus (50 restants)", l1.length + " · " + (await texte(page, "#pr-plus")));
    ok("… et sa place : même défilement (" + y0 + " px → " + y1 + " px), la carte au centre de l'écran reste autour de la 90e (" + (i0 + 1) + "e → " + (i1 + 1) + "e)", y0 > 1000 && Math.abs(y1 - y0) <= 400 && i1 >= 0 && Math.abs(i1 - i0) <= 2, JSON.stringify({ y0, y1, i0, i1 }));
    const second = l1[99];
    await page.$eval(`#pr-liste .sc-carte[data-uid="${second}"]`, e => e.scrollIntoView({ block: "center" })); await attendre(page, 300);
    await page.click(`#pr-liste .sc-carte[data-uid="${second}"] [data-sc="relance"]`); await attendre(page, 2800);
    ok("seconde action sur la 100e carte : toujours 100 cartes, seules les 2 relances écrites", (await uids(page)).length >= 100 && db.ecritures.length === 2 && ecr(db, "suivi_prospect").length === 2, (await uids(page)).length + " · " + JSON.stringify(db.ecritures.map(e => e.outil)));
    await filtre(page, "froid");
    ok("changer de filtre revient bien à 50 cartes", (await uids(page)).length === 50);
  });

  /* =================== J. conditions : mesure des emails, aucun prix =================== */
  const PHRASE_FR = "Brevo indique au coach si chaque email a été ouvert et si un lien a été cliqué : cela compte dans le suivi de ta découverte.";
  const PHRASE_EN = "Brevo tells the coach whether each email was opened and whether a link was clicked: this counts in the follow-up of your discovery.";
  await bloc("J. conditions (Profil, FR et EN ; inscription)", async () => {
    for (const langue of ["", "en"]) {
      const db = base({ comptes: seule() });
      const { c, page } = await contexte(b, leaAct, db, { langue });
      await page.goto(`http://localhost:${PORT}/#/profil`); await page.waitForSelector("#mc-conditions", { timeout: 8000 }); await attendre(page, 800);
      await page.click("#mc-conditions"); await page.waitForSelector(".volet", { timeout: 5000 }); await attendre(page, 300);
      const tv = norm(await page.textContent(".volet").catch(() => ""));
      if (!langue) ok("Profil du prospect, conditions en français : « " + PHRASE_FR + " » (ouvert et cliqué), aucun prix", tv.includes(PHRASE_FR) && tv.includes("ouvert") && tv.includes("cliqué") && !prixTrouve(tv), prixTrouve(tv) || tv.slice(0, 200));
      else ok("Profil du prospect, conditions en anglais : « " + PHRASE_EN + " » (opened / clicked), aucun prix", tv.includes(PHRASE_EN) && tv.includes("opened") && tv.includes("clicked") && !prixTrouve(tv), prixTrouve(tv) || tv.slice(0, 300));
      await page.keyboard.press("Escape").catch(() => {}); await attendre(page, 300);
      const visible = () => page.evaluate(() => document.body.innerText).then(norm).catch(() => "");   // texte affiché (pas le code de la page)
      const tp = await visible();
      await aller(page, "#/decouverte", 1600);
      const td = await visible();
      ok(`Profil et Découverte du prospect${langue ? " (anglais)" : ""} : aucun prix sur la page`, tp.length > 200 && td.length > 200 && !prixTrouve(tp) && !prixTrouve(td), prixTrouve(tp) || prixTrouve(td) || (tp.length + " / " + td.length));
      if (!langue) ok("version affichée en pied de page : « v2026-09-27 · 51 »", norm(await page.textContent("#foot-right .version").catch(() => "")) === "v2026-09-27 · 51", await page.textContent("#foot-right .version").catch(() => "?"));
      await c.close();
    }
    inscriptionLibre = true;
    try {
      for (const langue of ["", "en"]) {
        const db = base();
        const { c, page } = await contexte(b, null, db, { langue });
        await page.goto(`http://localhost:${PORT}/#/inscription`); await page.waitForSelector("#c-cgu-lien", { timeout: 8000 }); await attendre(page, 400);
        await page.click("#c-cgu-lien"); await page.waitForSelector(".volet", { timeout: 5000 }); await attendre(page, 300);
        const tv = norm(await page.textContent(".volet").catch(() => "")), te = await page.evaluate(() => document.body.innerText).then(norm).catch(() => "");
        const ph = langue ? PHRASE_EN : PHRASE_FR;
        ok(`inscription${langue ? " (anglais)" : ""} : conditions avec « ${ph.slice(0, 60)}… », écran et conditions sans aucun prix`, tv.includes(ph) && !prixTrouve(te), prixTrouve(te) || tv.slice(0, 200));
        await c.close();
      }
    } finally { inscriptionLibre = false; }
  });

  /* =================== K. statuts =================== */
  await bloc("K. statuts des premières heures", async () => {
    const TIA = PID(30), THEO = PID(31), NOUR = PID(32), NINO = PID(33);
    const creeT = T0 - 2 * H, creeTh = T0 - 30 * H, creeN = T0 - 3 * H, clic = avant(H);
    const db = base({ comptes: [
      { id: TIA, prenom: "Tia", nom: "Clic", cree: new Date(creeT).toISOString(), donnees: [["challenge", { version: 1, jours: {}, cta: { clics: [{ jour: 1, source: "decouverte", date: clic }] } }, clic]] },
      { id: THEO, prenom: "Théo", nom: "Clic", cree: new Date(creeTh).toISOString(), donnees: [["challenge", { version: 1, jours: {}, cta: { clics: [{ jour: 1, source: "verrou-programme", date: clic }] } }, clic]] },
      { id: NOUR, prenom: "Nour", nom: "Commence", cree: new Date(creeN).toISOString(), donnees: [["intake", { sexe: "Femme", age: "28", taille: "165", poids: "60", court_debut: avant(2.5 * H), email_compte: "nour@exemple.fr" }, avant(2.5 * H)]] },
      { id: NINO, prenom: "Nino", nom: "Rien", cree: new Date(creeN).toISOString() }
    ] });
    const { page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/prospects`); await page.waitForSelector("#pr-liste", { timeout: 8000 }); await attendre(page, 600);
    await filtre(page, "tous");
    const h = t => Math.floor((Date.now() - t) / H);
    const rClic = "A cliqué « Réserver mon bilan » (1 fois), la dernière " + quand(joursCal(clic)) + ", sans réserver.";
    const rt = await raisons(page, TIA), attT = ["Inscrit il y a " + h(creeT) + " h, questionnaire pas encore rempli.", rClic];
    ok("inscrit il y a 2 h, clic « Réserver » sans questionnaire : TIÈDE, raisons « " + attT.join(" ") + " »", (await pastilleEtat(page, TIA)) === "TIÈDE" && JSON.stringify(rt) === JSON.stringify(attT), (await pastilleEtat(page, TIA)) + " " + JSON.stringify(rt));
    const rh = await raisons(page, THEO), attH = ["Inscrit " + quand(joursCal(creeTh)) + ", questionnaire pas rempli.", rClic];
    ok("inscrit il y a 30 h, même clic sans questionnaire : FROID, raisons « " + attH.join(" ") + " », « DM de bienvenue » à faire", (await pastilleEtat(page, THEO)) === "FROID" && JSON.stringify(rh) === JSON.stringify(attH) && (await carte(page, THEO)).includes("Prochaine action : DM de bienvenue : aide-le à remplir son questionnaire (3 minutes)."), (await pastilleEtat(page, THEO)) + " " + JSON.stringify(rh));
    const rn = await raisons(page, NOUR), attN = ["Inscrit il y a " + h(creeN) + " h, questionnaire commencé (4/10 réponses)."];
    ok("inscrit il y a 3 h, 4 réponses sur 10 : NOUVEAU, raison « " + attN[0] + " », score 18/100", (await pastilleEtat(page, NOUR)) === "NOUVEAU" && JSON.stringify(rn) === JSON.stringify(attN) && (await carte(page, NOUR)).includes("18/100"), (await pastilleEtat(page, NOUR)) + " " + JSON.stringify(rn));
    const ri = await raisons(page, NINO);
    ok("témoin, inscrit il y a 3 h sans rien : NOUVEAU « Inscrit il y a " + h(creeN) + " h, rien fait pour l'instant. »", (await pastilleEtat(page, NINO)) === "NOUVEAU" && JSON.stringify(ri) === JSON.stringify(["Inscrit il y a " + h(creeN) + " h, rien fait pour l'instant."]), JSON.stringify(ri));
    await ouvrirFiche(page, TIA);
    const sc = await page.$eval("#vue .sc-fiche .seance-c-tete .pastille", e => e.textContent.trim()).catch(() => "");
    ok("fiche de Tia : suivi commercial TIÈDE aussi", sc === "TIÈDE", sc);
    ok("statuts : aucune écriture", db.ecritures.length === 0);
  });

  /* =================== L. client Thomas : rien de la v51 =================== */
  await bloc("L. client Thomas : ni activite, ni emails, ni coach_notifs", async () => {
    const db = base();
    const thomas = qui(F.IDS.c1, "t@e.fr");
    const { c, page } = await contexte(b, thomas, db, { horloge: true });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2600);
    const vues = [];
    for (const h of ["#/programme", "#/nutrition", "#/suivi", "#/formation", "#/profil", "#/accueil"]) { await aller(page, h, 1300); vues.push(h + (await page.$("#vue h1, #vue h2") ? "" : " (vide)")); }
    await cacher(page); await attendre(page, 1500); await montrer(page); await attendre(page, 600);
    await page.clock.fastForward(11 * MIN);   // au-delà de la minute d'Activite et des 10 minutes de reprise d'un onglet
    await attendre(page, 800); await cacher(page); await attendre(page, 1500); await montrer(page); await attendre(page, 800);
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }))); await attendre(page, 300);
    await page.goto("about:blank"); await attendre(page, 800);   // fermeture : vrai pagehide
    const p2 = await nouvellePage(c);
    await p2.goto(`http://localhost:${PORT}/#/accueil`); await attendre(p2, 2400);
    const snap = await p2.evaluate(() => window.__auChargement).catch(() => null);
    const K = ["activite", "emails", "coach_notifs"];
    const lusK = db.lectures.filter(x => K.some(k => nomme(x.outil, k))), sansFiltre = db.lectures.filter(x => !x.outil);
    ok("client Thomas (programme, nutrition, suivi, formation, profil, accueil, arrière-plan, 11 minutes, fermeture, réouverture) : aucune lecture qui vise activite, emails ou coach_notifs, ni de lecture de toutes ses clés", vues.length === 6 && lusK.length === 0 && sansFiltre.length === 0, JSON.stringify(lusK.concat(sansFiltre)) + " · " + JSON.stringify(vues));
    ok("… aucune écriture d'activite, emails ni coach_notifs (ni aucune autre écriture)", K.every(k => ecr(db, k).length === 0) && db.ecritures.length === 0, JSON.stringify(db.ecritures.map(e => e.outil || e.table)));
    ok("… rien gardé sur l'appareil (ni « mhx_activite_attente| », ni copie en attente) à la réouverture", !!snap && Object.keys(snap).length === 0, JSON.stringify(snap));
    ok("… ni le journal des emails ni la fonction d'envoi ne sont appelés", !db.chemins.some(x => /emails_prospects|functions\/v1/.test(x)), JSON.stringify(db.chemins.filter(x => /emails|functions/.test(x))));
  });

  /* =================== M. page de désinscription =================== */
  await bloc("M. page de désinscription", async () => {
    const U = PID(34), T = "0123456789abcdef".repeat(4);
    const db = base();
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/desinscription.html?u=${U}&t=${T}`); await attendre(page, 800);
    ok("lien valable : « Ne plus recevoir les emails de suivi », bouton « Confirmer », rien n'est envoyé à l'ouverture (un aperçu de lien ne désinscrit personne)", (await texte(page, "#titre")) === "Ne plus recevoir les emails de suivi" && (await page.isVisible("#confirmer")) && db.fonction.length === 0, (await texte(page, "#titre")) + " · " + JSON.stringify(db.fonction));
    await page.click("#confirmer"); await attendre(page, 1200);
    ok("« Confirmer » : une demande POST à la fonction (action=desinscription, u et t exacts), puis « C'est noté », bouton retiré", db.fonction.length === 1 && db.fonction[0].m === "POST" && db.fonction[0].action === "desinscription" && db.fonction[0].u === U && db.fonction[0].t === T && (await texte(page, "#titre")) === "C'est noté" && !(await page.isVisible("#confirmer")), JSON.stringify(db.fonction) + " · " + (await texte(page, "#titre")));
    await c.close();
    const db2 = base();
    const { c: c2, page: p2 } = await contexte(b, null, db2);
    await p2.goto(`http://localhost:${PORT}/desinscription.html?u=abc&t=123`); await attendre(p2, 600);
    ok("lien incomplet : « Lien non valable », pas de bouton, rien d'envoyé", (await texte(p2, "#titre")) === "Lien non valable" && !(await p2.isVisible("#confirmer")) && db2.fonction.length === 0, await texte(p2, "#titre"));
    await c2.close();
    const db3 = base(); db3.reponseFonction = { status: 500, body: { ok: false } };
    const { page: p3 } = await contexte(b, null, db3, { viewport: { width: 390, height: 844 } });
    await p3.goto(`http://localhost:${PORT}/desinscription.html?u=${U}&t=${T}`); await attendre(p3, 600);
    ok("mobile 390 px : page sans défilement horizontal", !(await deborde(p3)), await largeur(p3));
    await p3.click("#confirmer"); await attendre(p3, 1000);
    ok("erreur 500 : « Ça n'a pas marché… », bouton de nouveau actif (on peut réessayer)", (await texte(p3, "#msg")).startsWith("Ça n'a pas marché.") && (await p3.$eval("#confirmer", e => !e.disabled && !e.hidden).catch(() => false)), await texte(p3, "#msg"));
    db3.reponseFonction = { status: 400, body: { ok: false } };
    await p3.click("#confirmer"); await attendre(p3, 1000);
    ok("refus 400 : « Ce lien n'est pas valable. Coupe les emails de suivi depuis ton Profil, dans l'app. »", (await texte(p3, "#msg")) === "Ce lien n'est pas valable. Coupe les emails de suivi depuis ton Profil, dans l'app." && db3.fonction.length === 2, await texte(p3, "#msg"));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
function bilan(){
  const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length;
  console.log(res.join("\n")); console.log(nb + "/" + tot);
  if (nb < tot) process.exitCode = 1;
}
