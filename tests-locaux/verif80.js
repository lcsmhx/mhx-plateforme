/* v72 — le numéro de téléphone (sujet A) et le parcours d'arrivée des inscrits (sujets B, C, D, F côté inscrit).
   Toute la suite sert l'inscription OUVERTE et le téléphone obligatoire ALLUMÉ (forcerInscription, forcerTelephone :
   fichiers.js), comme en ligne ; les autres suites servent le téléphone éteint.
   A. Téléphone obligatoire :
     A0  un seul réglage « telephone_obligatoire: true|false » dans les fichiers (sinon le forçage du banc ne prendrait
         qu'une partie) ; servi éteint aux autres suites ;
     A1  Telephone.normaliser : espaces, points, tirets ignorés, 0 initial retiré (sauf Côte d'Ivoire), 6 à 14 chiffres sans
         l'indicatif, indicatif tapé (+33, 0033) gardé, « Autre pays » (+…), format +33612345678 ;
     A2  inscription : le champ « Ton numéro (WhatsApp) » (menu de 8 pays + Autre, France par défaut) après le nom ; refus
         clairs, aucune inscription envoyée ; une inscription réussie écrit la clé contact { telephone, inscrit_le } une
         fois, puis l'app s'ouvre sans écran du numéro ; 320 px sans défilement ;
     A3  copie de secours : l'écriture ratée juste après l'inscription repart à l'ouverture suivante (aucun écran) ;
     A4  un prospect et un client sans numéro : écran « Ajoute ton numéro… » avant tout (ni navigation, ni routage, même
         par un lien profond), refus clair, enregistrement (relire puis écrire : ref et inscrit_le gardés), puis l'app ;
         « Se déconnecter » ; en anglais ; 320 px ;
     A5  pas d'écran : compte qui a son numéro (une seule lecture de contact), lecture ratée (500 : l'app s'ouvre, rien
         d'écrit), le coach (aucune lecture de contact), réglage éteint ;
     A6  Mon compte : numéro affiché et modifiable (ref et inscrit_le gardés), « C'est déjà ton numéro. », lecture ratée ;
     A7  coach : colonne Téléphone de Mes clients, carte Prospects, en-tête de la fiche : le numéro, « Appeler » (tel:+…)
         et « WhatsApp » (wa.me, chiffres sans +) ; « — » sans numéro ou pour un numéro piégé ; le numéro n'est pas une
         « saisie » (Activité inchangée).
   Supabase simulé (gabarit de verif70) : rien ne part vers la vraie base (routage par NOM D'HÔTE) ; chaque écriture est
   notée. Comptes fictifs (@exemple.fr), numéros de la plage réservée à la fiction (06 39 98 …). Chaque bloc tourne à part
   (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif80.js ../index.html
           VERIF80_PORT=9961 node verif80.js ../index.html     (autre port, si 9960 est pris)
           VERIF80_BLOCS="A1,A4" node verif80.js …              (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const FT = require("./fichiers");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF80_PORT || 9960;
const BLOCS = (process.env.VERIF80_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const MOBILE = { width: 390, height: 844 }, PETIT = { width: 320, height: 640 }, LARGE = { width: 1280, height: 900 };

/* ---------- la page servie : inscription ouverte, téléphone obligatoire allumé, textes légaux de test ---------- */
let telephone = true;
const retouche = h => FT.forcerLegaux(FT.forcerTelephone(FT.forcerInscription(h, true), telephone));
const server = http.createServer((req, res) => {
  if (FT.servirFichier(req, res, HTML, retouche)) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(retouche(fs.readFileSync(HTML, "utf8")));
});
async function avecTelephone(v, fn){ const a = telephone; telephone = v; try { await fn(); } finally { telephone = a; } }

/* ---------- résultats ---------- */
const res = [];
const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
function bilan(){
  const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length;
  console.log(res.join("\n")); console.log(nb + "/" + tot);
  if (nb < tot || tot === 0) process.exitCode = 1;
}
const ouverts = [];
async function bloc(nom, fn){
  if (BLOCS.length && !BLOCS.some(x => nom.startsWith(x))) return;
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); }
}

/* ---------- dates, petites aides ---------- */
const T0 = Date.now(), H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const norm = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const isoPres = (x, t) => typeof x === "string" && !isNaN(Date.parse(x)) && new Date(x).toISOString() === x && Math.abs(Date.parse(x) - t) < 20000;

/* ---------- les personnes ---------- */
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: meta } : {}) });
const PID = k => "00000000-0000-4000-8000-0000000080" + String(k).padStart(2, "0");   // verif80 : …80kk
const COACH = { id: F.IDS.coach, email: "coach@exemple.fr" }, THOMAS = { id: F.IDS.c1, email: "thomas@exemple.fr" };
const INES = { id: PID(1), email: "ines@exemple.fr" }, NOAH = { id: PID(2), email: "noah@exemple.fr" }, MAEL = { id: PID(3), email: "mael@exemple.fr" };
const TEL_NOAH = "+33639980002", TEL_THOMAS = "+33639980001";

/* ---------- le décor : fixtures.js (coach, clients) + 3 prospects ; extra : lignes en plus ---------- */
function base(extra){
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  profils.push({ id: INES.id, prenom: "Inès", nom: "Morel", role: "client", statut: "prospect", cree_le: avant(3 * J) });
  profils.push({ id: NOAH.id, prenom: "Noah", nom: "Petit", role: "client", statut: "prospect", cree_le: avant(2 * J) });
  profils.push({ id: MAEL.id, prenom: "Maël", nom: "Roux", role: "client", statut: "prospect", cree_le: avant(1 * J) });
  const donnees = clone(F.donnees).concat([
    { user_id: NOAH.id, outil: "contact", contenu: { telephone: TEL_NOAH, ref: "insta", inscrit_le: avant(2 * J) }, maj_le: avant(2 * J) }
  ], extra || []);
  return { profils, donnees, ecritures: [], lectures: [], chemins: [], inscriptions: [], emails: {}, meta: {}, inscription: {}, ko: {}, perdre: {} };
}

/* ---------- le faux Supabase (gabarit de verif70) ---------- */
const MAX_LIGNES = 1000;
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
const appelant = req => { const m = /^Bearer (?:jeton-)([0-9a-f-]{36})/.exec(req.headers()["authorization"] || ""); return m ? m[1] : null; };
async function repondre(r, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue();
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort(); }
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req);
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  db.chemins.push(m + " " + p);
  if (p.startsWith("/auth/v1/signup")) {   // déclencheur creer_profil : un profil prospect ; la session porte data en user_metadata
    const c = corps() || {}, data = c.data || {}; db.inscriptions.push(clone(c));
    const id = db.inscription.id || PID(99); db.emails[id] = c.email; db.meta[id] = clone(data);
    db.profils.push({ id, prenom: data.prenom || "", nom: data.nom || "", role: "client", statut: "prospect", cree_le: new Date().toISOString() });
    return json(session(id, c.email, data));
  }
  if (p.startsWith("/auth/v1/token")) {
    const c = corps() || {}, r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || ""));
    const id = r1 && r1[1];
    if (!id) return json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
    return json(session(id, db.emails[id] || "", db.meta[id]));
  }
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  if (p.startsWith("/auth/v1/logout")) return json(null, 204);
  if (p.startsWith("/auth/v1/user")) return moi ? json(Object.assign({ id: moi, email: db.emails[moi] || "", role: "authenticated" }, db.meta[moi] ? { user_metadata: clone(db.meta[moi]) } : {})) : json({ msg: "invalid JWT" }, 401);
  if (p.startsWith("/auth/v1/")) return json({});
  if (!["GET", "HEAD"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m, corps: corps() });
  if (p.startsWith("/functions/v1/")) return json({ ok: true });
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/connexions") return json([]);
  if (p === "/rest/v1/profils") {
    const id = (q.get("id") || "").replace(/^eq\./, "");
    if (m === "GET" || m === "HEAD") { let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(colonnes(plage(l), q)); }
    db.ecritures.push({ table: "profils", m, id, corps: corps() });
    return json([]);
  }
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "", mj = q.get("maj_le");
    const cleEq = o.startsWith("eq.") ? o.slice(3) : null;
    if (m === "GET" || m === "HEAD") {
      db.lectures.push({ par: moi, uid, outil: o, select: q.get("select") || "*" });
      if (cleEq && db.ko[cleEq]) return json({ message: "panne simulée" }, 500);
      let l = db.donnees.filter(x => coach || (x.user_id === moi && !ILLISIBLES_PROPRIO.includes(x.outil)));
      if (uid) l = l.filter(x => x.user_id === uid);
      return json(colonnes(plage(parOutil(l, o)), q));
    }
    if (m === "POST") {
      let rows = corps(); rows = Array.isArray(rows) ? rows : rows ? [rows] : [];
      const refuse = rows.find(row => !permis(moi, coach, row));
      if (refuse) { db.ecritures.push({ table: "donnees", m, refus: true, outil: refuse.outil, user_id: refuse.user_id }); return json({ code: "42501", message: 'new row violates row-level security policy for table "donnees"' }, 403); }
      if (rows.some(x => db.perdre[x.outil] > 0)) { rows.forEach(x => { if (db.perdre[x.outil] > 0) db.perdre[x.outil]--; }); db.ecritures.push({ table: "donnees", m, perdue: true, outil: rows[0].outil }); return r.abort("failed"); }
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
    if (m === "PATCH") {
      const c = corps() || {};
      const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj == null || (mj === "is.null" ? !x.maj_le : (mj.startsWith("eq.") && x.maj_le === mj.slice(3)))));
      if (!row || !permis(moi, coach, row)) return json([]);
      Object.assign(row, { contenu: clone(c.contenu), maj_le: c.maj_le || new Date().toISOString() });
      db.ecritures.push(Object.assign({ table: "donnees", m }, clone(row)));
      return json([row]);
    }
    db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq });
    return json(null, 204);
  }
  if (p === "/rest/v1/bibliotheque") return m === "GET" ? json(coach ? colonnes(plage(clone(F.bibliotheque)), q) : []) : json(null, 204);
  const t = p.replace("/rest/v1/", "");
  if (F.catalogue[t]) return m === "GET" ? json(colonnes(plage(F.catalogue[t]), q)) : json(null, 201);
  return json([]);
}

/* ---------- un navigateur (contexte) ----------
   opts : viewport (MOBILE par défaut), langue ("en"), qui (compte connecté : { id, email }), stockage ({ clé: valeur }),
   neuf (appareil sans aucune trace : ni mhx_installe ni mhx_visites), autonome (app lancée depuis l'écran d'accueil) */
async function contexte(b, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || MOBILE });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, db));
  if (opts.qui) db.emails[opts.qui.id] = opts.qui.email;
  await c.addInitScript(({ langue, s, stockage, neuf, autonome }) => {
    if (!/^https?:$/.test(location.protocol)) return;
    if (autonome) Object.defineProperty(navigator, "standalone", { get: () => true });
    if (!localStorage.getItem("__init")) {   // l'appareil n'est préparé qu'une fois : un rechargement le garde
      localStorage.setItem("__init", "1");
      if (!neuf){ localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); }
      if (langue) localStorage.setItem("mhx_langue", langue);
      if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
      Object.keys(stockage || {}).forEach(k => localStorage.setItem(k, stockage[k]));
    }
  }, { langue: opts.langue || "", s: opts.qui ? session(opts.qui.id, opts.qui.email) : null, stockage: opts.stockage || null, neuf: !!opts.neuf, autonome: !!opts.autonome });
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return { c, page };
}
const attendre = (page, ms) => page.waitForTimeout(ms);
const pret = async page => { await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 }); await attendre(page, 400); };
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.table === "donnees" && e.outil === outil && !e.refus && !e.perdue && (!uid || e.user_id === uid));
const resume = db => JSON.stringify(db.ecritures.map(e => (e.table === "donnees" ? e.outil : e.table) + ":" + e.m));
const ligne0 = (db, uid, outil) => db.donnees.find(d => d.user_id === uid && d.outil === outil) || null;
const lu = (db, uid, outil, par) => db.lectures.filter(l => l.outil === "eq." + outil && (!uid || l.uid === uid) && (!par || l.par === par));
/* l'écran affiché : écran du numéro ? navigation ? */
const etat = page => page.evaluate(() => ({
  ecranTel: !!document.getElementById("co-tel"), h2: (document.querySelector(".carte-co h2") || {}).textContent || "",
  nav: !!document.querySelector("nav, .nav, #barre"), vue: !!document.getElementById("vue"), pret: typeof appPrete !== "undefined" && appPrete === true,
  err: ((document.getElementById("co-err") || {}).textContent || "").replace(/[  ]/g, " "),
  sw: document.documentElement.scrollWidth, iw: window.innerWidth
}));
const SOUS_TITRE = { fr: "Lucas s'en sert pour t'appeler ou t'écrire sur WhatsApp.", en: "Lucas uses it to call you or message you on WhatsApp." };
const TX = {
  fr: { h2: "Ajoute ton numéro pour que Lucas puisse te joindre", label: "Ton numéro (WhatsApp)", bouton: "Enregistrer mon numéro", sortir: "Se déconnecter",
    vide: "Indique ton numéro.", court: "Ce numéro est trop court : 6 chiffres au moins, sans l'indicatif.", long: "Ce numéro est trop long : 14 chiffres au plus, sans l'indicatif.",
    chiffres: "Un numéro ne contient que des chiffres.", autre: "Avec « Autre pays », tape ton numéro avec son indicatif, par exemple +212 6 12 34 56 78.",
    options: ["France (+33)", "Belgique (+32)", "Suisse (+41)", "Canada (+1)", "Australie (+61)", "Côte d'Ivoire (+225)", "Sénégal (+221)", "La Réunion (+262)", "Autre pays"] },
  en: { h2: "Add your phone number so Lucas can reach you", label: "Your phone number (WhatsApp)", bouton: "Save my number", sortir: "Log out",
    vide: "Enter your phone number.", court: "This number is too short: at least 6 digits, without the country code.",
    options: ["France (+33)", "Belgium (+32)", "Switzerland (+41)", "Canada (+1)", "Australia (+61)", "Ivory Coast (+225)", "Senegal (+221)", "Réunion (+262)", "Other country"] }
};
const champTel = (page, id) => page.evaluate(id => {
  const s = document.getElementById(id + "-ind"), i = document.getElementById(id), lab = document.querySelector('label[for="' + id + '"]');
  return { label: lab ? lab.textContent.trim() : null, options: s ? Array.from(s.options).map(o => o.textContent.trim()) : null, valeurs: s ? Array.from(s.options).map(o => o.value) : null,
    defaut: s ? s.value : null, type: i ? i.type : null, placeholder: i ? i.placeholder : null };
}, id);

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF80_PORT=9961 node verif80.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();
  const URL0 = `http://localhost:${PORT}/`;

  /* =================== A0. le réglage (sans navigateur) =================== */
  await bloc("A0. réglage", async () => {
    const disque = FT.valeursTelephone(FT.source(HTML)), servi = FT.valeursTelephone(FT.sourceServie(HTML));
    ok("A0 : un seul réglage « telephone_obligatoire: true|false » dans les fichiers (le forçage du banc le prend en entier), servi éteint aux autres suites (sourceServie)",
      disque.length === 1 && ["true", "false"].includes(disque[0]) && servi.length === 1 && servi[0] === "false", JSON.stringify({ disque, servi }));
  });

  /* =================== A1. la règle du numéro (Telephone.normaliser) =================== */
  await bloc("A1. normaliser", async () => {
    const db = base();
    const { page } = await contexte(b, db);
    await page.goto(URL0 + "#/inscription"); await page.waitForSelector("#c-go");
    const CAS = [
      ["33", "06 12 34 56 78", "+33612345678"], ["33", "06.12.34.56.78", "+33612345678"], ["33", "06-12-34-56-78", "+33612345678"],
      ["33", "+33 6 12 34 56 78", "+33612345678"], ["33", "0033 6 12 34 56 78", "+33612345678"], ["33", "6 12 34 56 78", "+33612345678"],
      ["32", "0470 12 34 56", "+32470123456"], ["41", "079 123 45 67", "+41791234567"], ["61", "0412 345 678", "+61412345678"],
      ["225", "07 07 12 34 56", "+2250707123456"], ["221", "77 123 45 67", "+221771234567"], ["262", "0692 12 34 56", "+262692123456"],
      ["1", "514-555-1234", "+15145551234"], ["1", "1 514 555 1234", "+15145551234"],
      ["33", "+32 470 12 34 56", "+32470123456"], ["33", "+212 6 12 34 56 78", "+212612345678"], ["autre", "+212 6 12 34 56 78", "+212612345678"],
      ["33", "0123456", "+33123456"], ["33", "012345678901234", "+3312345678901234"],
      ["33", "", "E:Indique ton numéro."], ["33", "   ", "E:Indique ton numéro."], ["33", "012345", "E:court"], ["33", "06123", "E:court"],
      ["33", "0123456789012345", "E:long"], ["33", "06 12 ab 56 78", "E:chiffres"], ["33", "+33 6 12 ab", "E:chiffres"], ["autre", "06 12 34 56 78", "E:autre"]
    ];
    const MSG = { court: TX.fr.court, long: TX.fr.long, chiffres: TX.fr.chiffres, autre: TX.fr.autre };
    const sorties = await page.evaluate(c => c.map(([i, s]) => Telephone.normaliser(i, s)), CAS);
    const faux = CAS.map((c, k) => {
      const att = c[2], o = sorties[k];
      const bon = att.startsWith("E:") ? (o.erreur === (MSG[att.slice(2)] || att.slice(2)) && !o.tel) : (o.tel === att && !o.erreur);
      return bon ? null : c[0] + " « " + c[1] + " » → " + JSON.stringify(o) + " (attendu " + att + ")";
    }).filter(Boolean);
    ok(`A1 : Telephone.normaliser — ${CAS.length} cas : espaces, points, tirets ignorés, 0 initial retiré (gardé pour +225), « 1 » national du Canada, indicatif tapé (+33, 0033, +32, +212 → Autre pays) gardé, 6 à 14 chiffres sans l'indicatif, format +33612345678, refus clairs (vide, court, long, lettres, Autre pays sans +)`,
      faux.length === 0, faux.join(" | "));
    const val = await page.evaluate(() => [Telephone.valide("+33612345678"), Telephone.valide("+212612345678"), Telephone.valide("0612345678"), Telephone.valide("+33 6 12"), Telephone.valide("javascript:alert(1)"), Telephone.valide("+0612345678"), Telephone.valide(null)]);
    ok("A1 : Telephone.valide — +33612345678 et +212612345678 oui ; 0612345678, « +33 6 12 », javascript:, +0…, null non", JSON.stringify(val) === JSON.stringify([true, true, false, false, false, false, false]), JSON.stringify(val));
  });

  /* =================== A2. l'inscription =================== */
  await bloc("A2. inscription", async () => {
    const db = base(); db.inscription.id = PID(50);
    const { page } = await contexte(b, db);
    await page.goto(URL0 + "#/inscription"); await page.waitForSelector("#c-go");
    const ch = await champTel(page, "c-tel");
    const ordre = await page.evaluate(() => Array.from(document.querySelectorAll(".carte-co input, .carte-co select")).map(x => x.id).filter(Boolean));
    ok("A2 : inscription — champ « Ton numéro (WhatsApp) » : menu de 8 pays + « Autre pays » (France +33 par défaut, l'ordre de Lucas), champ type tel ; placé après le nom, avant l'email",
      ch.label === TX.fr.label && JSON.stringify(ch.options) === JSON.stringify(TX.fr.options) && JSON.stringify(ch.valeurs) === JSON.stringify(["33", "32", "41", "1", "61", "225", "221", "262", "autre"])
        && ch.defaut === "33" && ch.type === "tel" && ordre.slice(0, 5).join(",") === "c-prenom,c-nom,c-tel-ind,c-tel,c-email",
      JSON.stringify({ ch, ordre }));
    await page.fill("#c-prenom", "Zoé"); await page.fill("#c-nom", "Martin"); await page.fill("#c-email", "zoe@exemple.fr"); await page.fill("#c-mdp", "motdepasse1");
    await page.check("#c-cgu");
    const essai = async (tel, ind) => { if (ind) await page.selectOption("#c-tel-ind", ind); await page.fill("#c-tel", tel); await page.click("#c-go"); await attendre(page, 300); return norm(await page.textContent("#co-err")); };
    const e1 = await essai(""), e2 = await essai("012345"), e3 = await essai("0123456789012345"), e4 = await essai("06 12 ab 56 78"), e5 = await essai("06 12 34 56 78", "autre");
    ok("A2 : refus clairs (vide, trop court, trop long, lettres, « Autre pays » sans indicatif), aucune inscription envoyée",
      e1 === TX.fr.vide && e2 === norm(TX.fr.court) && e3 === norm(TX.fr.long) && e4 === TX.fr.chiffres && e5 === norm(TX.fr.autre) && db.inscriptions.length === 0,
      JSON.stringify({ e1, e2, e3, e4, e5, n: db.inscriptions.length }));
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    await page.setViewportSize(PETIT); await attendre(page, 200);
    const sw320 = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    ok("A2 : 390 et 320 px : le formulaire et son champ du numéro tiennent sans défilement horizontal", sw <= 390 && sw320.sw <= sw320.iw, JSON.stringify({ sw, sw320 }));
    await page.setViewportSize(MOBILE);
    await page.selectOption("#c-tel-ind", "33"); await page.fill("#c-tel", "06 12 34 56 78");
    const tClic = Date.now();
    await Promise.all([page.waitForNavigation({ timeout: 15000 }).catch(() => {}), page.click("#c-go")]);
    await pret(page);
    const C = ecr(db, "contact", PID(50)), data = (db.inscriptions[0] || {}).data || {};
    ok("A2 : inscription réussie — clé contact écrite UNE fois par le nouveau compte : exactement { telephone: « +33612345678 », inscrit_le: instant de l'inscription } ; le numéro ne part pas dans les métadonnées du compte",
      db.inscriptions.length === 1 && C.length === 1 && JSON.stringify(Object.keys(C[0].contenu).sort()) === '["inscrit_le","telephone"]' && C[0].contenu.telephone === "+33612345678"
        && isoPres(C[0].contenu.inscrit_le, tClic) && !("telephone" in data),
      JSON.stringify({ C: C.map(x => x.contenu), data: Object.keys(data), ecr: resume(db) }));
    const e = await etat(page);
    ok("A2 : … puis l'app s'ouvre (prête, navigation), sans l'écran du numéro", e.pret && !e.ecranTel && e.vue, JSON.stringify(e));
  });

  /* =================== A3. la copie de secours =================== */
  await bloc("A3. copie de secours", async () => {
    const db = base(); db.inscription.id = PID(51); db.perdre.contact = 1;   // la première écriture de contact se perd (réseau)
    const { page } = await contexte(b, db);
    await page.goto(URL0 + "#/inscription"); await page.waitForSelector("#c-go");
    await page.fill("#c-prenom", "Léo"); await page.fill("#c-nom", "Blanc"); await page.fill("#c-tel", "06 39 98 00 51"); await page.fill("#c-email", "leo@exemple.fr"); await page.fill("#c-mdp", "motdepasse1");
    await page.check("#c-cgu");
    await Promise.all([page.waitForNavigation({ timeout: 15000 }).catch(() => {}), page.click("#c-go")]);
    await pret(page);
    const C = ecr(db, "contact", PID(51)), L = ligne0(db, PID(51), "contact"), e = await etat(page);
    const reste = await page.evaluate(id => Object.keys(localStorage).concat(Object.keys(sessionStorage)).filter(k => k.indexOf("mhx_contact_attente|") === 0), PID(51));
    ok("A3 : l'écriture ratée juste après l'inscription (réseau) est gardée sur l'appareil puis repart à l'ouverture qui suit : une ligne contact { telephone +33639980051, inscrit_le }, aucun écran du numéro, la copie retirée",
      db.ecritures.filter(x => x.perdue).length === 1 && C.length === 1 && !!L && L.contenu.telephone === "+33639980051" && !!L.contenu.inscrit_le && e.pret && !e.ecranTel && reste.length === 0,
      JSON.stringify({ C: C.map(x => x.contenu), e, reste, ecr: resume(db) }));
  });

  /* =================== A4. l'écran « Ajoute ton numéro » =================== */
  await bloc("A4. écran prospect", async () => {
    const db = base();
    const { page } = await contexte(b, db, { qui: INES });
    await page.goto(URL0 + "#/calculateur"); await page.waitForSelector("#co-tel");
    const e = await etat(page), ch = await champTel(page, "t-tel");
    const txt = await page.evaluate(() => ({ sous: ((document.querySelector(".carte-co .co-sous") || {}).textContent || "").trim(), go: ((document.getElementById("t-go") || {}).textContent || "").trim(), sortir: ((document.getElementById("t-sortir") || {}).textContent || "").trim() }));
    ok("A4 : prospect sans numéro, ouvert par un lien profond (#/calculateur) : l'écran « Ajoute ton numéro pour que Lucas puisse te joindre » seul (ni navigation, ni page, app pas prête), le champ (France par défaut), « Enregistrer mon numéro », « Se déconnecter »",
      e.ecranTel && e.h2 === TX.fr.h2 && !e.nav && !e.vue && !e.pret && ch.label === TX.fr.label && ch.defaut === "33" && JSON.stringify(ch.options) === JSON.stringify(TX.fr.options)
        && txt.sous === SOUS_TITRE.fr && txt.go === TX.fr.bouton && txt.sortir === TX.fr.sortir,
      JSON.stringify({ e, ch, txt }));
    await page.evaluate(() => { location.hash = "#/accueil"; }); await attendre(page, 600);
    ok("A4 : changer d'adresse ne passe pas l'écran (pas de routage derrière)", (await etat(page)).ecranTel, "");
    await page.fill("#t-tel", "123"); await page.click("#t-go"); await attendre(page, 300);
    const e2 = await etat(page);
    ok("A4 : numéro trop court : refus clair, rien d'écrit", norm(e2.err) === norm(TX.fr.court) && ecr(db, "contact").length === 0, JSON.stringify({ err: e2.err, ecr: resume(db) }));
    await page.selectOption("#t-tel-ind", "32"); await page.fill("#t-tel", "0470 12 34 56");
    await Promise.all([page.waitForNavigation({ timeout: 15000 }).catch(() => {}), page.click("#t-go")]);
    await pret(page);
    const C = ecr(db, "contact", INES.id), e3 = await etat(page);
    ok("A4 : « Enregistrer mon numéro » : une écriture de contact, exactement { telephone: « +32470123456 » } (pas de date d'inscription inventée), puis l'app s'ouvre (prête, sans écran)",
      C.length === 1 && JSON.stringify(C[0].contenu) === JSON.stringify({ telephone: "+32470123456" }) && e3.pret && !e3.ecranTel && e3.vue,
      JSON.stringify({ C: C.map(x => x.contenu), e3, ecr: resume(db) }));
  });
  await bloc("A4. écran client", async () => {
    /* Thomas (client) a une clé contact SANS numéro (ref et date d'inscription d'avant) : relire puis écrire les garde */
    const db = base([{ user_id: THOMAS.id, outil: "contact", contenu: { ref: "salon", inscrit_le: avant(30 * J) }, maj_le: avant(30 * J) }]);
    const { page } = await contexte(b, db, { qui: THOMAS, viewport: PETIT });
    await page.goto(URL0); await page.waitForSelector("#co-tel");
    const e = await etat(page);
    ok("A4 : client sans numéro : le même écran, avant tout (et avant « Bienvenue ! ») ; 320 px sans défilement horizontal", e.ecranTel && !e.nav && !e.pret && e.sw <= e.iw, JSON.stringify(e));
    await page.fill("#t-tel", "06 39 98 00 01");
    await Promise.all([page.waitForNavigation({ timeout: 15000 }).catch(() => {}), page.click("#t-go")]);
    await pret(page);
    const C = ecr(db, "contact", THOMAS.id);
    ok("A4 : … enregistré par relecture puis écriture conditionnelle (PATCH) : { ref « salon », inscrit_le d'avant, telephone +33639980001 } — rien d'autre ne change",
      C.length === 1 && C[0].m === "PATCH" && JSON.stringify(C[0].contenu) === JSON.stringify({ ref: "salon", inscrit_le: avant(30 * J), telephone: TEL_THOMAS }),
      JSON.stringify({ C, ecr: resume(db) }));
  });
  await bloc("A4. écran en anglais, se déconnecter", async () => {
    const db = base([{ user_id: INES.id, outil: "prefs", contenu: { langue: "en" }, maj_le: avant(J) }]);
    const { page } = await contexte(b, db, { qui: INES, langue: "en" });
    await page.goto(URL0); await page.waitForSelector("#co-tel"); await attendre(page, 300);
    const e = await etat(page), ch = await champTel(page, "t-tel");
    const txt = await page.evaluate(() => ({ sous: ((document.querySelector(".carte-co .co-sous") || {}).textContent || "").trim(), go: document.getElementById("t-go").textContent.trim(), sortir: document.getElementById("t-sortir").textContent.trim() }));
    await page.click("#t-go"); await attendre(page, 300);
    const err = norm(await page.textContent("#co-err"));
    ok("A4 : en anglais : titre, phrase, champ, menu (pays en anglais), boutons et refus traduits",
      e.h2 === TX.en.h2 && txt.sous === SOUS_TITRE.en && ch.label === TX.en.label && JSON.stringify(ch.options) === JSON.stringify(TX.en.options) && txt.go === TX.en.bouton && txt.sortir === TX.en.sortir && err === TX.en.vide,
      JSON.stringify({ h2: e.h2, txt, ch, err }));
    await Promise.all([page.waitForNavigation({ timeout: 15000 }).catch(() => {}), page.click("#t-sortir")]);
    await page.waitForSelector("#c-go");
    const s = await page.evaluate(() => !!(localStorage.getItem("mhx_session") || sessionStorage.getItem("mhx_session")));
    ok("A4 : « Se déconnecter » : retour à l'écran d'entrée, session retirée, rien d'écrit", !s && ecr(db, "contact").length === 0, JSON.stringify({ s, ecr: resume(db) }));
  });

  /* =================== A5. pas d'écran =================== */
  await bloc("A5. pas d'écran", async () => {
    { const db = base();
      const { page } = await contexte(b, db, { qui: NOAH });
      await page.goto(URL0); await pret(page);
      const e = await etat(page), L = lu(db, NOAH.id, "contact");
      ok("A5 : prospect qui a son numéro : pas d'écran, l'app s'ouvre ; contact lu une seule fois au démarrage, rien d'écrit", !e.ecranTel && e.pret && L.length === 1 && ecr(db, "contact").length === 0,
        JSON.stringify({ e, L: L.length, ecr: resume(db) })); }
    { const db = base(); db.ko.contact = true;
      const { page } = await contexte(b, db, { qui: INES });
      await page.goto(URL0); await pret(page);
      const e = await etat(page);
      ok("A5 : lecture de contact en panne (500) : pas de faux écran, l'app s'ouvre, rien d'écrit", !e.ecranTel && e.pret && lu(db, INES.id, "contact").length >= 1 && ecr(db, "contact").length === 0,
        JSON.stringify({ e, ecr: resume(db) })); }
    { const db = base();
      const { page } = await contexte(b, db, { qui: COACH, viewport: LARGE });
      await page.goto(URL0); await pret(page);
      const e = await etat(page);
      ok("A5 : le coach (sans numéro) : jamais l'écran, aucune lecture de sa clé contact", !e.ecranTel && e.pret && lu(db, COACH.id, "contact").length === 0 && ecr(db, "contact").length === 0,
        JSON.stringify({ e, lus: db.lectures.filter(l => /contact/.test(l.outil)) })); }
    await avecTelephone(false, async () => {
      const db = base();
      const { page } = await contexte(b, db, { qui: INES });
      await page.goto(URL0); await pret(page);
      const e = await etat(page);
      ok("A5 : réglage éteint : pas d'écran pour un prospect sans numéro, aucune lecture de contact au démarrage", !e.ecranTel && e.pret && lu(db, INES.id, "contact").length === 0,
        JSON.stringify({ e, lus: lu(db, INES.id, "contact").length }));
    });
    await avecTelephone(false, async () => {
      const db = base();
      const { page } = await contexte(b, db);
      await page.goto(URL0 + "#/inscription"); await page.waitForSelector("#c-go");
      ok("A5 : réglage éteint : l'inscription n'a pas de champ du numéro", !(await page.$("#c-tel")) && !(await page.$("#c-tel-ind")), "");
    });
  });

  /* =================== A6. Mon compte =================== */
  await bloc("A6. Mon compte", async () => {
    const db = base();
    const { page } = await contexte(b, db, { qui: NOAH });
    await page.goto(URL0 + "#/profil"); await pret(page);
    await page.waitForFunction(() => { const b = document.getElementById("mc-tel-ok"); return !!b && !b.disabled; }, null, { timeout: 8000 });
    const v = await page.evaluate(() => ({ actuel: document.getElementById("mc-tel-actuel").textContent, ligne: document.getElementById("mc-tel-ligne").textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim(),
      ind: document.getElementById("mc-tel-ind").value, num: document.getElementById("mc-tel").value, h3: Array.from(document.querySelectorAll("h3")).map(h => h.textContent.trim()) }));
    ok("A6 : Mon compte : « Mon numéro », « Numéro actuel : +33639980002 », champ pré-rempli (France, 639980002)",
      v.actuel === TEL_NOAH && v.ligne === "Numéro actuel : " + TEL_NOAH && v.ind === "33" && v.num === "639980002" && v.h3.includes("Mon numéro"), JSON.stringify(v));
    await page.click("#mc-tel-ok"); await attendre(page, 400);
    ok("A6 : même numéro : « C'est déjà ton numéro. », rien d'écrit", norm(await page.textContent("#mc-tel-msg")) === "C'est déjà ton numéro." && ecr(db, "contact").length === 0, resume(db));
    await page.selectOption("#mc-tel-ind", "41"); await page.fill("#mc-tel", "079 123 45 67"); await page.click("#mc-tel-ok"); await attendre(page, 1200);
    const C = ecr(db, "contact", NOAH.id), msg = norm(await page.textContent("#mc-tel-msg")), actuel = await page.textContent("#mc-tel-actuel");
    ok("A6 : changé (Suisse) : relecture puis PATCH, { telephone +41791234567, ref « insta », inscrit_le d'avant } ; « Numéro enregistré. », numéro actuel à jour",
      C.length === 1 && C[0].m === "PATCH" && JSON.stringify(C[0].contenu) === JSON.stringify({ telephone: "+41791234567", ref: "insta", inscrit_le: avant(2 * J) }) && msg === "Numéro enregistré." && actuel === "+41791234567",
      JSON.stringify({ C: C.map(x => x.contenu), msg, actuel }));
    await page.fill("#mc-tel", "12"); await page.click("#mc-tel-ok"); await attendre(page, 300);
    ok("A6 : numéro trop court : refus clair, rien d'écrit de plus", norm(await page.textContent("#mc-tel-msg")) === norm(TX.fr.court) && ecr(db, "contact").length === 1, "");
    const db2 = base(); db2.ko.contact = true;
    await avecTelephone(false, async () => {
      const { page: p2 } = await contexte(b, db2, { qui: NOAH });
      await p2.goto(URL0 + "#/profil"); await pret(p2); await attendre(p2, 800);
      const r = await p2.evaluate(() => ({ d: document.getElementById("mc-tel-ok").disabled, m: document.getElementById("mc-tel-msg").textContent.replace(/[  ]/g, " ") }));
      ok("A6 : lecture ratée : « Ton numéro n'a pas pu être chargé. Recharge la page. », bouton inactif, rien d'écrit", r.d && r.m === "Ton numéro n'a pas pu être chargé. Recharge la page." && ecr(db2, "contact").length === 0, JSON.stringify(r));
    });
    const db3 = base();
    const { page: p3 } = await contexte(b, db3, { qui: COACH, viewport: LARGE });
    await p3.goto(URL0 + "#/profil"); await pret(p3);
    ok("A6 : le coach n'a pas de bloc « Mon numéro »", !(await p3.$("#mc-tel")) && !(await p3.$("#mc-tel-ok")), "");
  });

  /* =================== A7. ce que voit le coach =================== */
  await bloc("A7. coach", async () => {
    const PIEGE = "javascript:alert(1)//+33612345678";
    const db = base([
      { user_id: THOMAS.id, outil: "contact", contenu: { telephone: TEL_THOMAS }, maj_le: new Date(T0).toISOString() },
      { user_id: F.IDS.c2, outil: "contact", contenu: { telephone: PIEGE }, maj_le: new Date(T0).toISOString() },
      { user_id: MAEL.id, outil: "contact", contenu: { telephone: "<img src=x onerror=alert(1)>" }, maj_le: avant(J) }
    ]);
    const { page } = await contexte(b, db, { qui: COACH, viewport: LARGE });
    await page.goto(URL0 + "#/clients"); await pret(page);
    await page.waitForSelector("#tb-clients [data-ouvrir]");
    const t = await page.evaluate(ids => {
      const th = Array.from(document.querySelectorAll(".tb-clients-table thead th")).map(x => x.textContent.trim());
      const cell = id => { const b = document.querySelector('#tb-clients [data-ouvrir="' + id + '"]'), tr = b && b.closest("tr"), td = tr && tr.querySelector('td[data-l="Téléphone"]');
        return td ? { t: td.textContent.replace(/\s+/g, " ").trim(), liens: Array.from(td.querySelectorAll("a")).map(a => ({ t: a.textContent.trim(), href: a.getAttribute("href"), target: a.getAttribute("target"), rel: a.getAttribute("rel") })), act: (tr.querySelector('td[data-l="Activité"]') || {}).textContent } : null; };
      return { th, thomas: cell(ids[0]), sarah: cell(ids[1]), julien: cell(ids[2]) };
    }, [THOMAS.id, F.IDS.c2, F.IDS.c3]);
    ok("A7 : Mes clients : colonne « Téléphone » (après Diète) ; Thomas : +33639980001, « Appeler » (tel:+33639980001) et « WhatsApp » (https://wa.me/33639980001, nouvel onglet)",
      t.th.indexOf("Téléphone") === t.th.indexOf("Diète") + 1 && t.th.length === 18 && !!t.thomas && t.thomas.t.indexOf(TEL_THOMAS) === 0
        && JSON.stringify(t.thomas.liens) === JSON.stringify([{ t: "Appeler", href: "tel:" + TEL_THOMAS, target: null, rel: null }, { t: "WhatsApp", href: "https://wa.me/33639980001", target: "_blank", rel: "noopener" }]),
      JSON.stringify(t));
    ok("A7 : « — » sans numéro (Julien) et pour un numéro piégé (Sarah : javascript:…) : aucun lien", !!t.julien && t.julien.t === "—" && !t.julien.liens.length && !!t.sarah && t.sarah.t === "—" && !t.sarah.liens.length, JSON.stringify(t));
    ok("A7 : le numéro enregistré aujourd'hui n'est pas une saisie : l'Activité de Sarah (dernière vraie saisie) ne passe pas à « aujourd'hui »", !!t.sarah && !/aujourd/.test(t.sarah.act || ""), JSON.stringify(t.sarah));
    await page.evaluate(() => { location.hash = "#/prospects"; }); await pret(page);
    await page.click('[data-filtre="tous"]').catch(() => {}); await attendre(page, 500);
    const pr = await page.evaluate(ids => ids.map(id => { const c = document.querySelector('.sc-carte[data-uid="' + id + '"]'), t = c && c.querySelector(".sc-tel");
      return t ? { t: t.textContent.replace(/\s+/g, " ").trim(), liens: Array.from(t.querySelectorAll("a")).map(a => a.getAttribute("href")), img: !!c.querySelector("img") } : null; }), [NOAH.id, INES.id, MAEL.id]);
    ok("A7 : cartes Prospects : « Téléphone : +33639980002 Appeler WhatsApp » (tel: et wa.me) ; « Téléphone : — » sans numéro ou numéro piégé (aucune balise injectée)",
      !!pr[0] && pr[0].t === "Téléphone : " + TEL_NOAH + " Appeler WhatsApp" && JSON.stringify(pr[0].liens) === JSON.stringify(["tel:" + TEL_NOAH, "https://wa.me/33639980002"])
        && !!pr[1] && pr[1].t === "Téléphone : —" && !pr[1].liens.length && !!pr[2] && pr[2].t === "Téléphone : —" && !pr[2].liens.length && !pr[2].img,
      JSON.stringify(pr));
    await page.evaluate(id => Clients.ouvrir(id, "Noah Petit", "accueil"), NOAH.id); await attendre(page, 2000);
    const f1 = await page.evaluate(() => { const x = document.getElementById("fiche-tel"); return x ? { t: x.textContent.replace(/\s+/g, " ").trim(), liens: Array.from(x.querySelectorAll("a")).map(a => a.getAttribute("href")) } : null; });
    await page.evaluate(id => Clients.ouvrir(id, "Julien Démo", "accueil"), F.IDS.c3); await attendre(page, 2000);
    const f2 = await page.evaluate(() => { const x = document.getElementById("fiche-tel"); return x ? x.textContent.replace(/\s+/g, " ").trim() : null; });
    ok("A7 : fiche (en-tête) : prospect Noah « Téléphone : +33639980002 Appeler WhatsApp » ; client sans numéro « Téléphone : — »",
      !!f1 && f1.t === "Téléphone : " + TEL_NOAH + " Appeler WhatsApp" && JSON.stringify(f1.liens) === JSON.stringify(["tel:" + TEL_NOAH, "https://wa.me/33639980002"]) && f2 === "Téléphone : —",
      JSON.stringify({ f1, f2 }));
    ok("A7 : le coach n'a rien écrit", db.ecritures.length === 0, resume(db));
  });

  /* =================== B. l'inscription en premier =================== */
  const portailVu = page => page.evaluate(() => ({ h2: ((document.querySelector(".carte-co h2") || {}).textContent || "").trim(),
    liens: Array.from(document.querySelectorAll(".bascule button")).map(x => ({ mode: x.dataset.mode, t: x.textContent.replace(/[\u00a0\u202f]/g, " ").trim() })),
    err: ((document.getElementById("co-err") || {}).textContent || "").trim(), hash: location.hash, prenom: !!document.getElementById("c-prenom") }));
  const INSC = { h2: "Crée ton espace gratuit", lien: "Déjà un compte ? Se connecter" }, CONN = { h2: "Connexion à ton espace", oubli: "Mot de passe oublié ?", lien: "Pas encore de compte ? Créer mon compte" };
  await bloc("B. inscription en premier", async () => {
    { const db = base();
      const { page } = await contexte(b, db, { neuf: true });
      await page.goto(URL0); await page.waitForSelector("#c-go"); await attendre(page, 300);
      const v1 = await portailVu(page);
      await page.click('.bascule [data-mode="connexion"]'); await attendre(page, 300);
      const v2 = await portailVu(page);
      ok("B : appareil neuf, adresse vide : la page d'entrée est « Crée ton espace gratuit » avec le lien « Déjà un compte ? Se connecter » ; il mène à « Connexion à ton espace » avec « Mot de passe oublié ? » et « Pas encore de compte ? Créer mon compte »",
        v1.h2 === INSC.h2 && v1.prenom && JSON.stringify(v1.liens) === JSON.stringify([{ mode: "connexion", t: INSC.lien }])
          && v2.h2 === CONN.h2 && !v2.prenom && JSON.stringify(v2.liens) === JSON.stringify([{ mode: "oubli", t: CONN.oubli }, { mode: "inscription", t: CONN.lien }]),
        JSON.stringify({ v1, v2 }));
      await page.click("#co-langue"); await page.waitForSelector("#c-go"); await attendre(page, 500);
      const v3 = await portailVu(page);
      ok("B : … changer de langue sur la connexion la garde (adresse #/connexion), liens en anglais", v3.h2 === "Log in to your space" && v3.hash === "#/connexion" && JSON.stringify(v3.liens.map(x => x.t)) === JSON.stringify(["Forgot your password?", "No account yet? Create my account"]),
        JSON.stringify(v3));
      await page.click('.bascule [data-mode="inscription"]'); await attendre(page, 300);
      const v4 = await portailVu(page);
      ok("B : … et l'inscription en anglais : « Already have an account? Log in »", JSON.stringify(v4.liens.map(x => x.t)) === JSON.stringify(["Already have an account? Log in"]), JSON.stringify(v4));
    }
    const vues = [];
    for (const o of [{ stockage: { mhx_deja_venu: "1" }, neuf: true }, { stockage: { mhx_visites: "1" }, neuf: true }, { stockage: { mhx_installe: "1" }, neuf: true }, { neuf: true, autonome: true }]) {
      const db = base();
      const { page } = await contexte(b, db, o);
      await page.goto(URL0); await page.waitForSelector("#c-go"); await attendre(page, 300);
      vues.push((await portailVu(page)).h2);
    }
    ok("B : appareil déjà venu (marqueur mhx_deja_venu, ou traces d'avant la v72 : compteur de visites, bannière d'installation ; ou app lancée depuis l'écran d'accueil) : la page d'entrée est la connexion",
      vues.length === 4 && vues.every(h => h === CONN.h2), JSON.stringify(vues));
    const liensEmail = [];
    for (const h of ["#access_token=jeton-tiers&refresh_token=x&type=recovery", "#access_token=jeton-tiers&type=invite", "#message=Confirmation+link+accepted", "#error=access_denied&error_code=otp_expired", "#/connexion"]) {
      const db = base();
      const { page } = await contexte(b, db, { neuf: true });
      await page.goto(URL0 + h); await page.waitForSelector("#c-go"); await attendre(page, 400);
      const v = await portailVu(page); liensEmail.push(v.h2 + (v.err ? " [" + v.err.slice(0, 30) + "]" : ""));
    }
    ok("B : appareil neuf, liens d'email (réinitialisation, invitation, message, lien périmé) et #/connexion : la connexion, comme avant (avec leur message)",
      liensEmail.length === 5 && liensEmail.every(x => x.indexOf(CONN.h2) === 0) && liensEmail.slice(0, 4).every(x => / \[/.test(x)), JSON.stringify(liensEmail));
    { const db = base();
      const { page } = await contexte(b, db, { stockage: { mhx_deja_venu: "1" }, neuf: true });
      await page.goto(URL0 + "#/inscription"); await page.waitForSelector("#c-go"); await attendre(page, 300);
      ok("B : #/inscription ouvre la création de compte, même sur un appareil déjà venu", (await portailVu(page)).h2 === INSC.h2, ""); }
    { const db = base();
      const { page } = await contexte(b, db, { qui: NOAH, neuf: true });
      await page.goto(URL0); await pret(page);
      const m1 = await page.evaluate(() => localStorage.getItem("mhx_deja_venu"));
      await Promise.all([page.waitForNavigation({ timeout: 15000 }).catch(() => {}), page.evaluate(() => Auth.deconnecter())]);
      await page.waitForSelector("#c-go"); await attendre(page, 300);
      const m2 = await page.evaluate(() => localStorage.getItem("mhx_deja_venu")), v = await portailVu(page);
      ok("B : une ouverture avec une session pose le marqueur ; « Se déconnecter » le garde, et l'appareil s'ouvre sur la connexion", m1 === "1" && m2 === "1" && v.h2 === CONN.h2, JSON.stringify({ m1, m2, v })); }
  });
  await bloc("B. inscription fermée", async () => {
    const db = base();
    const serveurFerme = h => FT.forcerInscription(h, false);
    /* inscription fermée (la suite la sert ouverte) : un contexte qui sert le fichier avec la valeur fermée */
    const c = await b.newContext({ viewport: MOBILE }); ouverts.push(c);
    await c.route("**/*", async r => {
      const u = new URL(r.request().url());
      if (u.hostname === "localhost" && /\/js\/config\.js$/.test(u.pathname)) { const t = serveurFerme(retouche(fs.readFileSync(path.join(path.dirname(HTML), "js", "config.js"), "utf8"))); return r.fulfill({ status: 200, contentType: "text/javascript; charset=utf-8", body: t }); }
      return repondre(r, db);
    });
    const page = await c.newPage();
    await page.goto(URL0); await page.waitForSelector("#c-go"); await attendre(page, 300);
    const v = await portailVu(page);
    ok("B : inscription fermée, appareil neuf : la connexion, sans lien vers la création de compte", v.h2 === CONN.h2 && JSON.stringify(v.liens.map(x => x.mode)) === JSON.stringify(["oubli"]), JSON.stringify(v));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
