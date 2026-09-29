/* verif65 — v60 (brief V2, section C) : les 3 questions « en 1 tap » du prospect, vérifiées de bout en bout dans un vrai
   navigateur, pour un NOUVEAU prospect, en français et en anglais, sur téléphone (390 px), en thème sombre et en thème clair.
   v61 (lot 2, brief V2, D) : la page qui suit le questionnaire est désormais « Ton plan d'action personnalisé » (EN « Your
   personalized action plan »), sa projection « Ton objectif dans 3 mois : « … » » (EN « Your goal in 3 months: “…” ») ;
   {projection} garde les règles du lot 1 (précision sinon libellé, 140 caractères, texte brut).
   A. questionnaire en français, 390 px, thème sombre : textes EXACTS (intro « 30 secondes », légendes, cartes et leurs
      sous-textes, pastilles, aide « Jusqu'à 2 réponses. », précisions, « Voir ma prochaine étape », mention médicale
      inchangée), structure (3 fieldset, radios / cases, plus aucun select ni textarea de réponse), typographie française
      (espaces insécables), zone de tap d'au moins 44 px pour chaque carte et pastille, bouton inactif (aria-disabled),
      aucun débordement, aucun prix, aucun « undefined », rien d'écrit à l'affichage ;
   B. le même questionnaire en anglais, 390 px, thème clair (valeurs gardées en français, aucun texte français) ;
   C. réponses à toucher (390 px, thème sombre, écran tactile) : état choisi visible (bordure dorée), un seul choix pour les
      questions 1 et 3 (un 2e tap remplace), jusqu'à 2 pastilles (un 3e tap n'est pas pris : « 2 réponses max »), bouton
      touché trop tôt (« Il manque une réponse », rien de validé), bouton actif avec les 3 réponses, aucun champ texte mis
      au point ;
   D. précision libre seule (sans choix) : suffit pour l'obstacle et pour la projection, brouillon pendant la frappe (témoin :
      le détecteur de clavier utilisé en C, E et F note bien la zone de texte) ;
   E. réponse complète en taps seulement (le clavier ne s'ouvre jamais), pastilles touchées à rebours (craquages puis temps :
      enregistrées dans l'ordre de la question), validation : intake EXACT (probleme, obstacle_choix, obstacle « A · B »,
      projection…, aucun champ vide créé), court_le, page « Ton plan d'action personnalisé » avec le libellé choisi ; puis « Modifier mes
      réponses » (pré-coché), précision de la projection ajoutée : la page s'affiche d'elle-même et la reprend ; Profil ;
   F. le même parcours en anglais (390 px, thème clair) : « One answer is missing », « 2 answers max », bordure dorée du
      thème clair, valeurs enregistrées en français, page et Profil avec les libellés anglais ;
   G. {projection} coupée proprement à 140 caractères (« … ») sur la page du plan ; 140 caractères tout juste : entière ;
   H. sécurité : une précision « <b>test</b> » et une précision piégée (<img src=x onerror=…>) restent du texte brut, sans
      créer d'élément, chez le prospect (page du plan, Profil) et chez le coach (fiche du prospect, carte de la page Prospects) ;
   I. ancien prospect (réponses libres v52, sans *_choix) : Profil, page du plan et fiche du coach les montrent telles quelles ;
      « Modifier mes réponses » pré-remplit les précisions avec l'ancien texte ; valider sans rien toucher ne perd rien ;
   J. Profil du prospect en anglais : ses réponses à choix avec les libellés anglais (« Not enough time · I give in to
      cravings — le soir ») ; « Edit my answers » pré-coché ; le coach lit le texte français ;
   K. au clavier : Tab jusqu'à une carte (anneau de focus doré), Espace, flèches, 3e pastille refusée, Entrée sur le bouton ;
   Z. aucun appel vers l'extérieur.
   Supabase simulé (gabarit de verif56) : rien ne part vers la vraie base (routage par NOM D'HÔTE, jamais par sous-chaîne) ;
   règles de la base reproduites (HANDOFF §2.3, v49) ; appelant reconnu à son jeton ; chaque écriture est appliquée en
   mémoire et notée. Données fictives, dates relatives au lancement. Chaque bloc tourne à part (« ✗ BLOC INTERROMPU ») ;
   code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif65.js ../index.html
           VERIF65_PORT=9811 node verif65.js ../index.html     (autre port, si 9810 est pris)
           VERIF65_BLOCS="A.,C." node verif65.js …              (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF65_PORT || 9810;
const BLOCS = (process.env.VERIF65_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const MOBILE = { width: 390, height: 844 }, ORDI = { width: 1280, height: 900 };

/* ---------- la page servie : le fichier testé (page, css/ et js/) ---------- */
const { servirFichier } = require("./fichiers");
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML)) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(fs.readFileSync(HTML, "utf8"));
});

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
/* texte comparé : espaces (insécables comprises) resserrées, apostrophes courbes ou droites (brief, mode d'emploi) */
const norm = t => String(t == null ? "" : t).replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").replace(/’/g, "'").trim();
/* texte brut : seules les espaces ordinaires sont resserrées (les insécables restent, pour la typographie française) */
const brut = t => String(t == null ? "" : t).replace(/[ \t\r\n]+/g, " ").trim();
/* la typographie française attendue (js/boite-a-outils.js, typoFr) : insécable avant « : ; ? ! » et « », après « « » */
const typo = s => s.replace(/ ([:;?!»])/g, "\u00a0$1").replace(/« /g, "«\u00a0");

/* ---------- les personnes ---------- */
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: meta } : {}) });
const qui = (id, email, meta) => ({ id, email, session: session(id, email, meta) });
const COACH = qui(F.IDS.coach, "coach@exemple.fr");
const PID = k => "00000000-0000-4000-8000-0000000065" + String(k).padStart(2, "0");   // verif65 : …65kk (une plage par suite)

/* ---------- le décor : fixtures.js (coach, clients) + les prospects du bloc ----------
   comptes : [{ id, prenom, nom, statut ("prospect" par défaut), cree (instant ISO), email, donnees: [[outil, contenu, maj_le]] }] */
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  const donnees = clone(F.donnees);
  const db = { profils, donnees, ecritures: [], refus: [], lectures: [], chemins: [], fonctions: [], emails: {}, lectureKo: [] };
  for (const x of opts.comptes || []) {
    profils.push({ id: x.id, prenom: x.prenom, nom: x.nom || "", role: "client", statut: x.statut || "prospect", cree_le: x.cree || avant(J) });
    if (x.email) db.emails[x.id] = x.email;
    for (const [outil, contenu, maj] of x.donnees || []) donnees.push({ user_id: x.id, outil, contenu: clone(contenu), maj_le: maj || avant(H) });
  }
  return db;
}

/* ---------- le faux Supabase (gabarit de verif56) ---------- */
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
const CATALOGUE = F.catalogue;
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
   opts : viewport (ORDI par défaut, MOBILE), toucher (écran tactile : page.tap), langue ("en"), theme ("light" : thème
   clair, rangé sur l'appareil comme le fait le bouton de thème ; sombre par défaut) */
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || ORDI, hasTouch: !!opts.toucher });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, who, db));
  await c.addInitScript(({ s, langue, theme }) => {
    if (!/^https?:$/.test(location.protocol)) return;
    /* chaque mise au point d'un champ qui ouvre le clavier d'un téléphone (texte, zone de texte, liste) est notée */
    window.__claviers = [];
    document.addEventListener("focusin", e => { const t = e.target; if (t && t.matches && t.matches("textarea, select, [contenteditable], input:not([type=radio]):not([type=checkbox]):not([type=button]):not([type=submit]):not([type=hidden])")) window.__claviers.push(t.id || t.tagName); }, true);
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
const lignes = (page, sel) => page.$$eval(sel + " li", l => l.map(li => [li.querySelector("span") ? li.querySelector("span").textContent : "", li.querySelector("b") ? li.querySelector("b").textContent : ""])).then(l => l.map(x => x.map(norm))).catch(() => []);
const compte = (k, prenom, nom, donnees, extra) => Object.assign({ id: PID(k), prenom, nom, cree: avant(2 * J), email: "p" + k + "@exemple.fr", donnees: donnees || [] }, extra || {});
async function ouvrir(b, db, k, h, sel, opts){
  const { c, page } = await contexte(b, qui(PID(k), db.emails[PID(k)] || ("p" + k + "@exemple.fr")), db, opts);
  await page.goto(URL0 + (h || "")); await pret(page, sel || "#vue .masthead");
  return { c, page };
}
/* un tap (écran tactile) ou un clic sur la carte / pastille d'une réponse : c'est le label qu'on touche (l'input est invisible) */
const option = (q, v) => `#q-${q} label.dc-opt:has(input[value="${v}"])`;
const toucher = async (page, q, v) => { await page.tap(option(q, v)); await attendre(page, 350); };
/* l'état des réponses d'une question : cochée ou non, bordure, fond et couleur du libellé ; acc = la couleur d'accent du thème */
const etat = (page, q) => page.evaluate(q => {
  const s = document.createElement("span"); s.style.color = "var(--accent)"; document.body.appendChild(s); const acc = getComputedStyle(s).color; s.remove();
  return { acc, theme: document.documentElement.getAttribute("data-theme") || "sombre", opts: Array.from(document.querySelectorAll(`#q-${q} label.dc-opt`)).map(l => {
    const i = l.querySelector("input"), c = l.querySelector(".dc-opt-c"), lb = l.querySelector(".dc-opt-l"), st = getComputedStyle(c);
    return { v: i.value, on: i.checked, bord: st.borderTopColor, fond: st.backgroundColor, coul: getComputedStyle(lb).color };
  }) };
}, q);
const choisis = e => e.opts.filter(o => o.on).map(o => o.v);
const dores = (e, or) => e.opts.filter(o => o.bord === or).map(o => o.v);
/* le choix se voit : bordure et libellé de la couleur d'accent (or), fond différent des cartes non choisies */
const bienVisible = (e, or) => { const on = e.opts.filter(o => o.on), off = e.opts.filter(o => !o.on); return e.acc === or && on.length > 0 && on.every(o => o.bord === or && o.coul === or && off.every(x => x.fond !== o.fond)) && off.every(o => o.bord !== or); };
const OR_SOMBRE = "rgb(212, 168, 68)", OR_CLAIR = "rgb(154, 116, 32)";   // --accent des deux thèmes (css/jetons.css)
/* « Voir ma prochaine étape » touché : aria-disabled="true" n'est pas « disabled » (touché, il dit ce qui manque) ; Playwright
   le tient pour désactivé et attendrait : le tap part quand même, au centre du bouton, comme le doigt */
const taperBouton = page => page.tap("#dc-voir", { force: true });
const bouton = page => page.$eval("#dc-voir", b => ({ aria: b.getAttribute("aria-disabled"), inactif: b.classList.contains("inactif"), txt: b.textContent.replace(/\s+/g, " ").trim() })).catch(() => ({}));
const claviers = page => page.evaluate(() => ({ notes: window.__claviers || [], actif: document.activeElement ? document.activeElement.tagName + "#" + document.activeElement.id + "[" + (document.activeElement.type || "") + "]" : "" }));
/* aucun champ qui ouvre le clavier n'a eu le focus, et aucun ne l'a maintenant (actif : « BALISE#id[type] ») */
const sansClavier = x => !x.notes.length && !/^(TEXTAREA|SELECT)#|^INPUT#[^\[]*\[(text|search|email|tel|number|password|url)\]$/.test(x.actif);
/* ce qui ne doit jamais s'afficher : un prix, un « undefined » */
const PRIX = /€|\$ ?\d|\d ?\$|\bprix\b|\bprice\b|\btarifs?\b|\beuros?\b|\bEUR\b/i, BRUT = /undefined|\[object|\bNaN\b|\bnull\b/;
const propre = t => !PRIX.test(t) && !BRUT.test(t);
/* un champ vide créé pour rien dans intake ("" ou []) */
const videsDe = I => Object.keys(I || {}).filter(k => I[k] === "" || (Array.isArray(I[k]) && !I[k].length));
/* aucune balise créée par une réponse piégée (<b>test</b>, <img src=x onerror=…>) */
const injecte = page => page.evaluate(() => !!window.__xss || !!document.querySelector("#vue img[src='x'], #vue script:not([src])") || Array.from(document.querySelectorAll("#vue b, #vue strong")).some(e => e.textContent === "test")).catch(() => true);

/* ---------- les textes attendus (brief V2, section C, mot pour mot) ---------- */
const TX = {
  lede: "3 questions, 30 secondes : dis-nous où tu en es.", lede_en: "3 questions, 30 seconds: tell us where you're at.",
  legendes: ["Ton objectif numéro 1 ?", "Jusqu'ici, qu'est-ce qui a coincé ?", "Dans 3 mois, qu'est-ce qui changerait tout pour toi ?"],
  legendes_en: ["Your #1 goal?", "What's held you back so far?", "In 3 months, what would change everything for you?"],
  /* [valeur = libellé français (option française exacte), sous-texte, libellé EN, sous-texte EN] */
  probleme: [["Perdre du gras", "Affiner ma silhouette", "Lose fat", "Get leaner"], ["Prendre du muscle", "Me dessiner et gagner en force", "Build muscle", "Get toned and stronger"],
    ["Me remettre en forme", "Retrouver de l'énergie et une routine", "Get back in shape", "Get my energy and routine back"]],
  /* [clé, libellé, libellé EN] */
  obstacle: [["temps", "Le manque de temps", "Not enough time"], ["craquages", "Je craque sur la nourriture", "I give in to cravings"], ["quoi_faire", "Je ne sais pas quoi faire exactement", "I don't know exactly what to do"],
    ["motivation", "La motivation retombe vite", "My motivation fades fast"], ["tout_essaye", "J'ai déjà tout essayé, rien ne dure", "I've tried everything, nothing lasts"], ["suivi", "Personne pour me suivre et me recadrer", "No one to keep me on track"]],
  projection: [["vetements", "Rentrer à nouveau dans mes vêtements préférés", "Fitting into my favorite clothes again"], ["photos", "M'aimer sur les photos", "Loving how I look in photos"],
    ["energie", "Avoir de l'énergie toute la journée", "Having energy all day long"], ["routine", "Tenir une routine sans me forcer", "Sticking to a routine without forcing it"], ["confiance", "Retrouver confiance en moi", "Feeling confident again"]],
  aide: "Jusqu'à 2 réponses.", aide_en: "Pick up to 2.",
  prec_obstacle: "Autre chose ? Avec tes mots (facultatif, sans détail de santé)", prec_obstacle_en: "Anything else? In your own words (optional, no health details)",
  prec_projection: "Ou dis-le avec tes mots (facultatif)", prec_projection_en: "Or say it in your own words (optional)",
  bouton: "Voir ma prochaine étape", bouton_en: "See my next step",
  max: "2 réponses max", max_en: "2 answers max", manque: "Il manque une réponse", manque_en: "One answer is missing",
  note: "Ce questionnaire ne remplace pas un avis médical. Si tu as un doute sur ta santé, parles-en à un professionnel.",
  note_en: "This questionnaire is not medical advice. If you have any doubt about your health, talk to a professional.",
  titre: "Ton questionnaire", titre_en: "Your questionnaire",
  /* v61 (lot 2, brief V2, D) : la page qui suit le questionnaire (#dc-bilan), son titre et sa projection */
  plan: "Ton plan d'action personnalisé", plan_en: "Your personalized action plan",
  projection_page: p => "Ton objectif dans 3 mois : « " + p + " »", projection_page_en: p => "Your goal in 3 months: “" + p + "”",
  modifier: "Modifier mes réponses", modifier_en: "Edit my answers"
};
/* l'objectif du questionnaire complet posé par l'app depuis la réponse « problème » (table CONFIG.decouverte.objectif_depuis) */
const OBJ = { "Perdre du gras": "Perte de poids / sèche", "Prendre du muscle": "Prise de muscle", "Me remettre en forme": "Santé & énergie au quotidien" };
/* un prospect qui a validé le NOUVEAU questionnaire (réponses à choix) */
const AVEC_CHOIX = extra => Object.assign({ probleme: "Perdre du gras", obstacle_choix: ["temps", "craquages"], obstacle: "Le manque de temps · Je craque sur la nourriture",
  projection_choix: ["photos"], projection: "M'aimer sur les photos", objectif: OBJ["Perdre du gras"], objectif_auto: OBJ["Perdre du gras"],
  court_debut: avant(2 * H), court_le: avant(H) }, extra || {});
/* un ancien prospect (v52) : ses 3 réponses en texte libre, sans *_choix ni *_precision */
const ANCIEN_V52 = { probleme: "Perdre du gras", obstacle: "Le manque de temps avec le travail", projection: "Courir 10 km sans m'arrêter", objectif: OBJ["Perdre du gras"],
  objectif_auto: OBJ["Perdre du gras"], court_debut: avant(3 * J), court_le: avant(3 * J - H), email_compte: "p10@exemple.fr", bilan_propose: { choix: "plus_tard", le: avant(3 * J - 50 * MIN) } };
/* la structure du questionnaire, lue dans la page */
const structure = page => page.evaluate(() => {
  const t = e => e ? e.textContent.replace(/[ \t\r\n]+/g, " ").trim() : null;
  const fs = Array.from(document.querySelectorAll("#vue fieldset.dc-q")).map(f => ({ id: f.id, type: f.getAttribute("data-type"), max: f.getAttribute("data-max"),
    legende: t(f.querySelector("legend")), aide: t(f.querySelector("p.note.dc-aide")),
    opts: Array.from(f.querySelectorAll(".dc-opts > label.dc-opt")).map(l => { const i = l.querySelector("input"); return { v: i.value, type: i.type, nom: i.name, l: t(l.querySelector(".dc-opt-c > .dc-opt-l")), s: t(l.querySelector(".dc-opt-c > .dc-opt-s")), opacite: getComputedStyle(i).opacity }; }),
    prec: t(f.querySelector("label.dc-precision")), precPour: f.querySelector("label.dc-precision") ? f.querySelector("label.dc-precision").getAttribute("for") : null,
    zone: f.querySelector("textarea") ? { id: f.querySelector("textarea").id, max: f.querySelector("textarea").getAttribute("maxlength"), val: f.querySelector("textarea").value } : null,
    maxMsg: f.querySelector("p.msg.ko.dc-max") ? { id: f.querySelector("p.msg.ko.dc-max").id, txt: t(f.querySelector("p.msg.ko.dc-max")), vu: f.querySelector("p.msg.ko.dc-max").offsetHeight > 0 } : null }));
  const zones = Array.from(document.querySelectorAll("#vue label.dc-opt")).map(l => { const r = l.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
  return { fs, zones, h2: t(document.querySelector("#vue section.panel h2")), lede: t(document.querySelector("#vue .masthead .lede")),
    anciens: Array.from(document.querySelectorAll("#vue select, #vue textarea#q-probleme, #vue textarea#q-obstacle, #vue textarea#q-projection, #vue select#q-probleme")).map(e => e.tagName + "#" + e.id),
    note: t(document.querySelector("#vue .panel .note:last-child")), annuler: !!document.querySelector("#dc-annuler"), calendly: !!document.querySelector("#vue a[href*='calendly']") };
});

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF65_PORT=9811 node verif65.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. questionnaire en français, 390 px, thème sombre =================== */
  await bloc("A. questionnaire en français", async () => {
    const k = 1, db = base({ comptes: [compte(k, "Léa", "Martin")] });
    const { page } = await ouvrir(b, db, k, "", "#q-probleme", { viewport: MOBILE, toucher: true });
    const S = await structure(page), [P, O, R] = S.fs;
    ok("nouveau prospect : le questionnaire « Ton questionnaire », 3 fieldset.dc-q (#q-probleme « cartes », #q-obstacle « choix » max 2, #q-projection « choix »), plus aucun select ni textarea de réponse ; thème sombre",
      S.h2 === TX.titre && JSON.stringify(S.fs.map(f => [f.id, f.type, f.max])) === '[["q-probleme","cartes",null],["q-obstacle","choix","2"],["q-projection","choix",null]]' && !S.anciens.length && (await page.evaluate(() => document.documentElement.getAttribute("data-theme"))) === null,
      JSON.stringify([S.h2, S.fs.map(f => [f.id, f.type, f.max]), S.anciens]));
    ok("intro exacte : « " + TX.lede + " »", norm(S.lede) === TX.lede, S.lede);
    ok("légendes exactes : « " + TX.legendes.join(" » / « ") + " »", JSON.stringify(S.fs.map(f => norm(f.legende))) === JSON.stringify(TX.legendes), JSON.stringify(S.fs.map(f => f.legende)));
    ok("question 1 : 3 cartes radio (name q-probleme), valeur = option française EXACTE, libellé et sous-texte exacts (« Perdre du gras — Affiner ma silhouette »…)",
      !!P && JSON.stringify(P.opts.map(o => [o.v, o.type, o.nom, norm(o.l), norm(o.s)])) === JSON.stringify(TX.probleme.map(x => [x[0], "radio", "q-probleme", x[0], x[1]])), JSON.stringify(P && P.opts));
    ok("question 2 : aide « Jusqu'à 2 réponses. », 6 pastilles (cases à cocher, name q-obstacle, valeur = clé stable), libellés exacts",
      !!O && norm(O.aide) === TX.aide && JSON.stringify(O.opts.map(o => [o.v, o.type, o.nom, norm(o.l), o.s])) === JSON.stringify(TX.obstacle.map(x => [x[0], "checkbox", "q-obstacle", x[1], null])), JSON.stringify(O && [O.aide, O.opts]));
    ok("question 2 : « 2 réponses max » vide et caché (#q-obstacle-max), précision « " + TX.prec_obstacle + " » (label pour #q-obstacle-precision, 500 caractères au plus, vide)",
      !!O && !!O.maxMsg && O.maxMsg.id === "q-obstacle-max" && O.maxMsg.txt === "" && !O.maxMsg.vu && norm(O.prec) === TX.prec_obstacle && O.precPour === "q-obstacle-precision" && !!O.zone && O.zone.id === "q-obstacle-precision" && O.zone.max === "500" && O.zone.val === "", JSON.stringify(O && [O.maxMsg, O.prec, O.zone]));
    ok("question 3 : 5 réponses radio (name q-projection, clé stable), libellés exacts, précision « " + TX.prec_projection + " » (#q-projection-precision), pas d'aide",
      !!R && JSON.stringify(R.opts.map(o => [o.v, o.type, o.nom, norm(o.l), o.s])) === JSON.stringify(TX.projection.map(x => [x[0], "radio", "q-projection", x[1], null])) && norm(R.prec) === TX.prec_projection && R.precPour === "q-projection-precision" && !!R.zone && R.zone.id === "q-projection-precision" && R.aide === null && R.maxMsg === null, JSON.stringify(R && [R.opts, R.prec, R.zone]));
    ok("typographie française : espace insécable avant « : » et « ? » (intro, légendes, précisions), rien d'autre",
      S.lede === typo(TX.lede) && JSON.stringify(S.fs.map(f => f.legende)) === JSON.stringify(TX.legendes.map(typo)) && O.prec === typo(TX.prec_obstacle) && R.prec === typo(TX.prec_projection) && O.aide === TX.aide, JSON.stringify([S.lede, S.fs.map(f => f.legende), O.prec]));
    const bt = await bouton(page);
    ok("bouton « Voir ma prochaine étape » inactif (aria-disabled « true », classe « inactif »), pas d'« Annuler les modifications », mention médicale inchangée, aucun lien Calendly",
      bt.txt === TX.bouton && bt.aria === "true" && bt.inactif && !S.annuler && norm(S.note) === TX.note && !S.calendly, JSON.stringify([bt, S.note, S.annuler]));
    ok("zone de tap : les 14 cartes et pastilles font au moins 44 × 44 px ; les vraies radios / cases restent dans la page, invisibles (opacité 0)",
      S.zones.length === 14 && S.zones.every(([w, h]) => w >= 44 && h >= 44) && S.fs.every(f => f.opts.every(o => o.opacite === "0")), JSON.stringify(S.zones));
    await attendre(page, 1300);   // Store.ecrire n'envoie qu'après 700 ms : une écriture lancée par l'affichage aurait le temps d'arriver
    const v = await texte(page, "#vue");
    ok("390 px : aucun défilement horizontal ; aucun prix, aucun « undefined » ; aucune écriture à l'affichage ; aucun champ texte mis au point",
      !(await deborde(page)) && propre(v) && saisies(db).length === 0 && sansClavier(await claviers(page)), resume(db) + " · " + (v.match(PRIX) || v.match(BRUT) || [""])[0]);
  });

  /* =================== B. questionnaire en anglais, 390 px, thème clair =================== */
  await bloc("B. questionnaire en anglais", async () => {
    const k = 2, db = base({ comptes: [compte(k, "Léa", "Martin")] });
    const { page } = await ouvrir(b, db, k, "", "#q-probleme", { viewport: MOBILE, toucher: true, langue: "en", theme: "light" });
    await attendre(page, 300);
    const S = await structure(page), [P, O, R] = S.fs;
    ok("anglais, thème clair : « Your questionnaire », les 3 questions à toucher", (await page.evaluate(() => document.documentElement.getAttribute("data-theme"))) === "light" && S.h2 === TX.titre_en && S.fs.length === 3, JSON.stringify([S.h2, S.fs.length]));
    ok("anglais : intro « " + TX.lede_en + " » et légendes exactes (sans espace insécable)", S.lede === TX.lede_en && JSON.stringify(S.fs.map(f => f.legende)) === JSON.stringify(TX.legendes_en), JSON.stringify([S.lede, S.fs.map(f => f.legende)]));
    ok("anglais, question 1 : « Lose fat — Get leaner »…, valeurs gardées en français (« Perdre du gras »…)",
      !!P && JSON.stringify(P.opts.map(o => [o.v, norm(o.l), norm(o.s)])) === JSON.stringify(TX.probleme.map(x => [x[0], x[2], x[3]])), JSON.stringify(P && P.opts));
    ok("anglais, question 2 : « Pick up to 2. », 6 pastilles en anglais (mêmes clés), précision « " + TX.prec_obstacle_en + " »",
      !!O && O.aide === TX.aide_en && JSON.stringify(O.opts.map(o => [o.v, norm(o.l)])) === JSON.stringify(TX.obstacle.map(x => [x[0], x[2]])) && O.prec === TX.prec_obstacle_en, JSON.stringify(O && [O.aide, O.opts, O.prec]));
    ok("anglais, question 3 : 5 réponses en anglais (mêmes clés), précision « " + TX.prec_projection_en + " »",
      !!R && JSON.stringify(R.opts.map(o => [o.v, norm(o.l)])) === JSON.stringify(TX.projection.map(x => [x[0], x[2]])) && R.prec === TX.prec_projection_en, JSON.stringify(R && [R.opts, R.prec]));
    await attendre(page, 1300);   // Store.ecrire n'envoie qu'après 700 ms : une écriture lancée par l'affichage aurait le temps d'arriver
    const bt = await bouton(page), v = await texte(page, "#vue");
    const francais =[TX.lede, TX.bouton, TX.aide, TX.prec_obstacle, TX.prec_projection, TX.note].concat(TX.legendes, TX.probleme.map(x => x[1]), TX.obstacle.map(x => x[1]), TX.projection.map(x => x[1])).filter(x => v.includes(x));
    ok("anglais : « See my next step » inactif (aria-disabled « true »), mention médicale en anglais, aucun texte français du questionnaire",
      bt.txt === TX.bouton_en && bt.aria === "true" && bt.inactif && norm(S.note) === TX.note_en && !francais.length, JSON.stringify([bt, S.note, francais]));
    ok("anglais, 390 px : cartes et pastilles d'au moins 44 × 44 px, aucun débordement, aucun prix ni « undefined », aucune écriture",
      S.zones.length === 14 && S.zones.every(([w, h]) => w >= 44 && h >= 44) && !(await deborde(page)) && propre(v) && saisies(db).length === 0, JSON.stringify(S.zones) + " · " + resume(db));
  });

  /* =================== C. réponses à toucher : choix, maximum, bouton (390 px, thème sombre) =================== */
  await bloc("C. réponses à toucher", async () => {
    const k = 3, ID = PID(k), db = base({ comptes: [compte(k, "Léa", "Martin")] });
    const { page } = await ouvrir(b, db, k, "", "#q-probleme", { viewport: MOBILE, toucher: true });
    const e0 = [await etat(page, "probleme"), await etat(page, "obstacle"), await etat(page, "projection")];
    ok("à l'arrivée : rien de choisi parmi les 3 + 6 + 5 réponses, aucune carte dorée (thème sombre, accent #d4a844)", JSON.stringify(e0.map(e => e.opts.length)) === "[3,6,5]" && e0.every(e => !choisis(e).length && !dores(e, OR_SOMBRE).length) && e0[0].acc === OR_SOMBRE, JSON.stringify(e0.map(e => [e.acc, e.opts.map(o => o.bord)])));
    await toucher(page, "probleme", "Perdre du gras");
    const e1 = await etat(page, "probleme"), b1 = await bouton(page);
    ok("tap sur « Perdre du gras » : choisie, bordure et libellé dorés, fond doré léger ; les deux autres non ; le bouton reste inactif", JSON.stringify(choisis(e1)) === '["Perdre du gras"]' && bienVisible(e1, OR_SOMBRE) && b1.aria === "true", JSON.stringify([e1, b1]));
    await toucher(page, "probleme", "Prendre du muscle");
    const e2 = await etat(page, "probleme");
    ok("2e tap sur « Prendre du muscle » : il remplace le premier (un seul choix), la bordure dorée suit", JSON.stringify(choisis(e2)) === '["Prendre du muscle"]' && JSON.stringify(dores(e2, OR_SOMBRE)) === '["Prendre du muscle"]' && bienVisible(e2, OR_SOMBRE), JSON.stringify(e2.opts.map(o => [o.v, o.on, o.bord])));
    await toucher(page, "obstacle", "temps"); await toucher(page, "obstacle", "craquages");
    const e3 = await etat(page, "obstacle");
    ok("question 2 : 2 pastilles touchées (temps, craquages), toutes deux choisies et dorées", JSON.stringify(choisis(e3)) === '["temps","craquages"]' && bienVisible(e3, OR_SOMBRE), JSON.stringify(e3.opts.map(o => [o.v, o.on, o.bord])));
    await toucher(page, "obstacle", "motivation");
    const e4 = await etat(page, "obstacle"), mx = (await structure(page)).fs[1].maxMsg;
    ok("3e tap (« La motivation retombe vite ») : pas pris, toujours temps + craquages ; « 2 réponses max » affiché sous les pastilles", JSON.stringify(choisis(e4)) === '["temps","craquages"]' && !dores(e4, OR_SOMBRE).includes("motivation") && !!mx && norm(mx.txt) === TX.max && mx.vu, JSON.stringify([choisis(e4), mx]));
    await attendre(page, 1300);
    const I1 = clone(intakeDe(db, ID)) || {}, w1 = ecr(db, "intake", ID);
    ok("brouillon pendant les taps : probleme « Prendre du muscle », obstacle_choix temps + craquages, obstacle « Le manque de temps · Je craque sur la nourriture » ; la 3e pastille jamais écrite ; pas de court_le",
      I1.probleme === "Prendre du muscle" && JSON.stringify(I1.obstacle_choix) === '["temps","craquages"]' && I1.obstacle === "Le manque de temps · Je craque sur la nourriture" && !w1.some(e => JSON.stringify(e.contenu).includes("motivation")) && !w1.some(e => e.contenu.court_le), JSON.stringify(I1));
    await toucher(page, "obstacle", "temps"); await toucher(page, "obstacle", "motivation");
    const e5 = await etat(page, "obstacle");
    ok("retaper une pastille la retire ; une autre peut alors être prise (craquages + motivation)", JSON.stringify(choisis(e5)) === '["craquages","motivation"]' && JSON.stringify(dores(e5, OR_SOMBRE)) === '["craquages","motivation"]', JSON.stringify(choisis(e5)));
    await taperBouton(page); await attendre(page, 300);
    const msg = await texte(page, "#dc-msg"), manque = await page.$$eval("#vue .dc-q.manque", l => l.map(e => e.id)).catch(() => []), b2 = await bouton(page), cl = await claviers(page);
    await attendre(page, 1300);
    ok("« Voir ma prochaine étape » touché trop tôt (question 3 sans réponse) : « Il manque une réponse », seule la question 3 marquée, rien de validé (pas de court_le), aucun champ texte mis au point",
      msg === TX.manque && JSON.stringify(manque) === '["q-projection"]' && b2.aria === "true" && !(intakeDe(db, ID) || {}).court_le && !ecr(db, "intake", ID).some(e => e.contenu.court_le) && sansClavier(cl) && !!(await page.$("#q-probleme")), JSON.stringify([msg, manque, b2, cl]));
    await attendre(page, 2400);
    ok("… le message s'efface ensuite de lui-même (environ 3 s), #dc-msg toujours là", !!(await page.$("#dc-msg")) && (await texte(page, "#dc-msg")) === "", await texte(page, "#dc-msg"));
    await toucher(page, "projection", "energie");
    const b3 = await bouton(page);
    ok("3e réponse touchée : le bouton devient actif (aria-disabled « false », plus « inactif »)", b3.aria === "false" && !b3.inactif, JSON.stringify(b3));
    await toucher(page, "projection", "photos");
    const e6 = await etat(page, "projection");
    ok("question 3 : un 2e tap (« M'aimer sur les photos ») remplace le premier, seule carte dorée", JSON.stringify(choisis(e6)) === '["photos"]' && JSON.stringify(dores(e6, OR_SOMBRE)) === '["photos"]' && bienVisible(e6, OR_SOMBRE), JSON.stringify(e6.opts.map(o => [o.v, o.on, o.bord])));
  });

  /* =================== D. précision libre seule =================== */
  await bloc("D. précision seule", async () => {
    const k = 4, ID = PID(k), db = base({ comptes: [compte(k, "Léa", "Martin")] });
    const { page } = await ouvrir(b, db, k, "", "#q-probleme", { viewport: MOBILE, toucher: true });
    await toucher(page, "probleme", "Me remettre en forme");
    await page.fill("#q-obstacle-precision", "Le temps"); await attendre(page, 1300);
    const I1 = clone(intakeDe(db, ID)) || {}, b1 = await bouton(page), foc = await page.evaluate(() => document.activeElement && document.activeElement.id), cl = await claviers(page);
    ok("précision seule pour la question 2 : brouillon pendant la frappe, sans quitter le champ (obstacle = obstacle_precision = « Le temps », pas d'obstacle_choix vide) ; le bouton reste inactif (question 3 sans réponse) ; témoin : le détecteur de clavier (C, E, F) a bien noté la zone de texte",
      I1.obstacle === "Le temps" && I1.obstacle_precision === "Le temps" && !("obstacle_choix" in I1) && foc === "q-obstacle-precision" && b1.aria === "true" && cl.notes.includes("q-obstacle-precision") && !sansClavier(cl), JSON.stringify([I1, b1, foc, cl]));
    await page.fill("#q-projection-precision", "Courir 10 km sans m'arrêter"); await attendre(page, 300);
    const b2 = await bouton(page);
    ok("précision seule pour la question 3 : le bouton devient actif", b2.aria === "false" && !b2.inactif, JSON.stringify(b2));
    const t0 = Date.now(); await page.click("#dc-voir"); await attendre(page, 1600);
    const I = clone(intakeDe(db, ID)) || {};
    ok("validation : obstacle « Le temps » et projection « Courir 10 km sans m'arrêter » (le texte seul, comme avant), leurs précisions, court_le ; aucun choix vide créé (ni obstacle_choix, ni projection_choix)",
      I.probleme === "Me remettre en forme" && I.obstacle === "Le temps" && I.obstacle_precision === "Le temps" && I.projection === "Courir 10 km sans m'arrêter" && I.projection_precision === "Courir 10 km sans m'arrêter" && typeof I.court_le === "string" && Math.abs(Date.parse(I.court_le) - t0) < 10000 && !videsDe(I).length,
      "vides : " + JSON.stringify(videsDe(I)) + " · " + JSON.stringify(I));
    ok("page « Ton plan d'action personnalisé » : « Ton objectif dans 3 mois : « Courir 10 km sans m'arrêter » »", !!(await page.$("#dc-bilan")) && (await texte(page, "#dc-projection")) === TX.projection_page("Courir 10 km sans m'arrêter"), await texte(page, "#dc-projection"));
  });

  /* =================== E. réponse complète en taps seulement, validation, modification =================== */
  await bloc("E. taps seulement puis validation", async () => {
    const k = 5, ID = PID(k), db = base({ comptes: [compte(k, "Léa", "Martin")] });
    const { page } = await ouvrir(b, db, k, "", "#q-probleme", { viewport: MOBILE, toucher: true });
    /* les pastilles touchées à rebours (craquages PUIS temps) : l'enregistrement suit l'ordre de la question (contrat C) */
    await toucher(page, "probleme", "Perdre du gras"); await toucher(page, "obstacle", "craquages"); await toucher(page, "obstacle", "temps"); await toucher(page, "projection", "energie");
    await attendre(page, 1300);
    const cl = await claviers(page), b1 = await bouton(page), w0 = ecr(db, "intake", ID).length, wd = ecr(db, "intake", ID).slice(-1).map(e => e.contenu)[0] || {};
    ok("4 taps (objectif, 2 pastilles, projection) : le bouton est actif ; aucun champ texte n'a eu le focus (le clavier ne s'ouvre jamais)", b1.aria === "false" && !b1.inactif && sansClavier(cl), JSON.stringify([b1, cl]));
    ok("brouillon pendant les taps (au moins une écriture d'intake), jamais de court_le ni de champ vide avant la validation ; le dernier brouillon range les pastilles dans l'ordre de la question (obstacle_choix [temps, craquages], obstacle « Le manque de temps · Je craque sur la nourriture »)",
      w0 >= 1 && ecr(db, "intake", ID).every(e => !e.contenu.court_le && !videsDe(e.contenu).length) && JSON.stringify(wd.obstacle_choix) === '["temps","craquages"]' && wd.obstacle === "Le manque de temps · Je craque sur la nourriture",
      JSON.stringify(ecr(db, "intake", ID).map(e => e.contenu)));
    const t0 = Date.now(); await page.tap("#dc-voir"); await attendre(page, 1600);
    const I = clone(intakeDe(db, ID)) || {}, cles = Object.keys(I).sort().join(",");
    ok("validation : intake EXACT — probleme « Perdre du gras », obstacle_choix [temps, craquages] (touchées craquages puis temps : l'ordre de la question), obstacle « Le manque de temps · Je craque sur la nourriture », projection_choix [energie], projection « Avoir de l'énergie toute la journée », objectif posé, court_debut, email du compte ; pas d'obstacle_precision ni de projection_precision (vides)",
      cles === "court_debut,court_le,email_compte,objectif,objectif_auto,obstacle,obstacle_choix,probleme,projection,projection_choix" && I.probleme === "Perdre du gras" && JSON.stringify(I.obstacle_choix) === '["temps","craquages"]'
      && I.obstacle === "Le manque de temps · Je craque sur la nourriture" && JSON.stringify(I.projection_choix) === '["energie"]' && I.projection === "Avoir de l'énergie toute la journée" && I.objectif === OBJ["Perdre du gras"] && I.objectif_auto === I.objectif && I.email_compte === "p5@exemple.fr",
      cles + " · " + JSON.stringify(I));
    const fin = ecr(db, "intake", ID).filter(e => e.contenu.court_le);
    ok("court_le posé (maintenant), une seule date de validation, court_debut du premier brouillon ; seule la clé intake est écrite",
      typeof I.court_le === "string" && Math.abs(Date.parse(I.court_le) - t0) < 10000 && new Set(fin.map(e => e.contenu.court_le)).size === 1 && typeof I.court_debut === "string" && Date.parse(I.court_debut) <= Date.parse(I.court_le) && saisies(db).every(e => e.table === "donnees" && e.outil === "intake"), resume(db));
    const v = await texte(page, "#vue");
    ok("page « Ton plan d'action personnalisé » : « Ton objectif dans 3 mois : « Avoir de l'énergie toute la journée » » (le libellé choisi) ; plus le questionnaire ; 390 px sans débordement ; aucun prix ni « undefined »",
      (await texte(page, "#dc-bilan h2")) === TX.plan && (await texte(page, "#dc-projection")) === TX.projection_page("Avoir de l'énergie toute la journée") && !(await page.$("#q-probleme")) && !(await deborde(page)) && propre(v), await texte(page, "#dc-projection"));
    /* « Modifier mes réponses » : pré-coché, puis la précision de la projection */
    await aller(page, "#/decouverte/reponses", 1500);
    const [p1, o1, r1] = [await etat(page, "probleme"), await etat(page, "obstacle"), await etat(page, "projection")], S = await structure(page), b2 = await bouton(page);
    ok("« Modifier mes réponses » : cartes et pastilles pré-cochées et dorées (Perdre du gras ; temps, craquages ; energie), précisions vides, bouton actif, « Annuler les modifications »",
      JSON.stringify([choisis(p1), choisis(o1), choisis(r1)]) === '[["Perdre du gras"],["temps","craquages"],["energie"]]' && [p1, o1, r1].every(e => bienVisible(e, OR_SOMBRE)) && S.fs[1].zone.val === "" && S.fs[2].zone.val === "" && b2.aria === "false" && S.annuler,
      JSON.stringify([choisis(p1), choisis(o1), choisis(r1), b2, S.annuler]));
    const n0 = ecr(db, "intake", ID).length;
    await page.fill("#q-projection-precision", "Courir 10 km sans m'arrêter"); await attendre(page, 1300);
    ok("en modification : rien ne part pendant la saisie de la précision", ecr(db, "intake", ID).length === n0, resume(db));
    await page.tap("#dc-voir"); await attendre(page, 1600);
    const I2 = clone(intakeDe(db, ID)) || {};
    ok("validation : UNE écriture, projection_precision « Courir 10 km sans m'arrêter », projection « Avoir de l'énergie toute la journée — Courir 10 km sans m'arrêter », projection_choix et court_le inchangés ; aucun champ vide créé (pas d'obstacle_precision « »)",
      ecr(db, "intake", ID).length === n0 + 1 && I2.projection_precision === "Courir 10 km sans m'arrêter" && I2.projection === "Avoir de l'énergie toute la journée — Courir 10 km sans m'arrêter" && JSON.stringify(I2.projection_choix) === '["energie"]' && I2.court_le === I.court_le && I2.obstacle === I.obstacle && !videsDe(I2).length,
      "vides : " + JSON.stringify(videsDe(I2)) + " · " + JSON.stringify(I2));
    /* pas encore de choix sur la page de bilan : la validation en modification la ré-affiche d'elle-même (aucun détour par l'adresse) */
    ok("page « Ton plan d'action personnalisé » affichée tout de suite après la validation ; la précision remplie prend la place du libellé (« Ton objectif dans 3 mois : « Courir 10 km sans m'arrêter » »)",
      !!(await page.$("#dc-bilan")) && (await texte(page, "#dc-bilan h2")) === TX.plan && !(await page.$("#q-probleme")) && (await texte(page, "#dc-projection")) === TX.projection_page("Courir 10 km sans m'arrêter"),
      JSON.stringify([!!(await page.$("#dc-bilan")), await texte(page, "#dc-projection")]));
    await aller(page, "#/profil", 1800); await page.waitForSelector("#mc-reponses li", { timeout: 6000 }).catch(() => {});
    const rp = await lignes(page, "#mc-reponses");
    ok("Profil : ses 3 réponses en français (« Le manque de temps · Je craque sur la nourriture », « Avoir de l'énergie toute la journée — Courir 10 km sans m'arrêter »)",
      JSON.stringify(rp) === JSON.stringify([[TX.legendes[0], "Perdre du gras"], [TX.legendes[1], "Le manque de temps · Je craque sur la nourriture"], [TX.legendes[2], "Avoir de l'énergie toute la journée — Courir 10 km sans m'arrêter"]]), JSON.stringify(rp));
  });

  /* =================== F. le même parcours en anglais (390 px, thème clair) =================== */
  await bloc("F. anglais", async () => {
    const k = 6, ID = PID(k), db = base({ comptes: [compte(k, "Léa", "Martin")] });
    const { page } = await ouvrir(b, db, k, "", "#q-probleme", { viewport: MOBILE, toucher: true, langue: "en", theme: "light" });
    await attendre(page, 300);
    await taperBouton(page); await attendre(page, 300);
    const msg = await texte(page, "#dc-msg"), manque = await page.$$eval("#vue .dc-q.manque", l => l.map(e => e.id)).catch(() => []);
    await attendre(page, 1000);
    ok("anglais : bouton touché sans réponse → « One answer is missing », les 3 questions marquées, rien d'écrit", msg === TX.manque_en && JSON.stringify(manque) === '["q-probleme","q-obstacle","q-projection"]' && saisies(db).length === 0, JSON.stringify([msg, manque]) + " · " + resume(db));
    await toucher(page, "probleme", "Perdre du gras"); await toucher(page, "obstacle", "temps"); await toucher(page, "obstacle", "craquages"); await toucher(page, "obstacle", "suivi");
    const e1 = await etat(page, "obstacle"), mx = (await structure(page)).fs[1].maxMsg;
    ok("anglais : 3e pastille pas prise, « 2 answers max »", JSON.stringify(choisis(e1)) === '["temps","craquages"]' && !!mx && mx.txt === TX.max_en && mx.vu, JSON.stringify([choisis(e1), mx]));
    const e2 = await etat(page, "probleme");
    ok("thème clair : le choix en doré du thème clair (accent #9a7420) — bordure, libellé, fond ; les autres non", e2.theme === "light" && bienVisible(e1, OR_CLAIR) && bienVisible(e2, OR_CLAIR) && JSON.stringify(dores(e2, OR_CLAIR)) === '["Perdre du gras"]', JSON.stringify([e2.acc, e2.opts.map(o => [o.v, o.bord, o.fond])]));
    await toucher(page, "projection", "energie");
    const cl = await claviers(page);
    await page.tap("#dc-voir"); await attendre(page, 1600);
    const I = clone(intakeDe(db, ID)) || {};
    ok("anglais, en taps seulement (aucun champ texte mis au point) : les valeurs enregistrées restent françaises (probleme « Perdre du gras », obstacle « Le manque de temps · Je craque sur la nourriture », projection « Avoir de l'énergie toute la journée »), clés stables, court_le, aucun champ vide créé",
      sansClavier(cl) && I.probleme === "Perdre du gras" && I.obstacle === "Le manque de temps · Je craque sur la nourriture" && JSON.stringify(I.obstacle_choix) === '["temps","craquages"]' && I.projection === "Avoir de l'énergie toute la journée" && JSON.stringify(I.projection_choix) === '["energie"]' && typeof I.court_le === "string" && !videsDe(I).length,
      "vides : " + JSON.stringify(videsDe(I)) + " · " + JSON.stringify([cl, I]));
    const v = await texte(page, "#vue");
    ok("anglais : « Your personalized action plan », « Your goal in 3 months: “Having energy all day long” » (le libellé anglais, pas le français)",
      (await texte(page, "#dc-bilan h2")) === TX.plan_en && (await texte(page, "#dc-projection")) === TX.projection_page_en("Having energy all day long") && !v.includes("Avoir de l'énergie") && propre(v), await texte(page, "#dc-projection"));
    await aller(page, "#/profil", 1800); await page.waitForSelector("#mc-reponses li", { timeout: 6000 }).catch(() => {}); await attendre(page, 300);
    const rp = await lignes(page, "#mc-reponses");
    ok("anglais, Profil : « Your #1 goal? Lose fat », « Not enough time · I give in to cravings », « Having energy all day long »",
      JSON.stringify(rp) === JSON.stringify([[TX.legendes_en[0], "Lose fat"], [TX.legendes_en[1], "Not enough time · I give in to cravings"], [TX.legendes_en[2], "Having energy all day long"]]), JSON.stringify(rp));
  });

  /* =================== G. {projection} coupée à 140 caractères =================== */
  await bloc("G. coupe à 140 caractères", async () => {
    const LONGUE = "Je veux enfin me sentir bien dans mon corps, courir avec mes enfants le dimanche matin et retrouver assez d'énergie pour tenir toute la semaine au travail";
    const k = 7, ID = PID(k), db = base({ comptes: [compte(k, "Léa", "Martin")] });
    const { page } = await ouvrir(b, db, k, "", "#q-probleme", { viewport: MOBILE, toucher: true });
    await toucher(page, "probleme", "Perdre du gras"); await toucher(page, "obstacle", "temps"); await toucher(page, "projection", "photos");
    await page.fill("#q-projection-precision", LONGUE); await page.tap("#dc-voir"); await attendre(page, 1600);
    const t = await texte(page, "#dc-projection"), x = t.replace(/^Ton objectif dans 3 mois : « /, "").replace(/ »$/, ""), I = intakeDe(db, ID) || {};
    /* attendu : les 140 premiers caractères, coupés au dernier espace (« …tenir toute la »), puis « … » : 136 caractères */
    const COUPEE = LONGUE.slice(0, LONGUE.slice(0, 140).lastIndexOf(" ")) + "…";
    ok(`page du plan, précision de ${Array.from(LONGUE).length} caractères (entière sous l'ancienne limite de 160) : coupée à 140 au plus, au dernier espace, « … » (exactement « …tenir toute la… », 136 caractères) ; la précision enregistrée reste entière`,
      Array.from(LONGUE).length > 141 && Array.from(LONGUE).length <= 160 && Array.from(COUPEE).length === 136 && COUPEE.endsWith(" tenir toute la…") && x === COUPEE && t === TX.projection_page(COUPEE)
      && Array.from(x).length <= 141 && LONGUE.startsWith(x.slice(0, -1)) && /[\s,]/.test(LONGUE.charAt(x.length - 1)) && I.projection_precision === LONGUE,
      Array.from(x).length + " · " + t);
    const P140 = LONGUE.slice(0, 140).replace(/\s+$/, "") + "x".repeat(140 - LONGUE.slice(0, 140).replace(/\s+$/, "").length);
    const db2 = base({ comptes: [compte(8, "Léa", "Martin", [["intake", AVEC_CHOIX({ projection_precision: P140, projection: "M'aimer sur les photos — " + P140 })]])] });
    const o2 = await ouvrir(b, db2, 8, "", "#dc-bilan", { viewport: MOBILE });
    ok("page du plan, précision de 140 caractères tout juste : affichée entière, sans « … »", Array.from(P140).length === 140 && (await texte(o2.page, "#dc-projection")) === TX.projection_page(P140), await texte(o2.page, "#dc-projection"));
  });

  /* =================== H. sécurité : réponses piégées, chez le prospect et chez le coach =================== */
  await bloc("H. précisions piégées", async () => {
    const PIEGE = "<img src=x onerror=\"window.__xss=1\">", B = "<b>test</b>";
    const k = 9, ID = PID(k), db = base({ comptes: [compte(k, "Léa", "Martin")] });
    const { page } = await ouvrir(b, db, k, "", "#q-probleme", { viewport: MOBILE, toucher: true });
    await toucher(page, "probleme", "Perdre du gras"); await toucher(page, "obstacle", "temps");
    await page.fill("#q-obstacle-precision", B); await page.fill("#q-projection-precision", PIEGE); await attendre(page, 200);
    await page.tap("#dc-voir"); await attendre(page, 1600);
    const I = clone(intakeDe(db, ID)) || {};
    ok("précisions piégées enregistrées telles quelles (texte) : obstacle « Le manque de temps — <b>test</b> », projection « <img src=x onerror=…> » ; aucun champ vide créé (pas de projection_choix [])",
      I.obstacle === "Le manque de temps — " + B && I.obstacle_precision === B && I.projection === PIEGE && I.projection_precision === PIEGE && typeof I.court_le === "string" && !videsDe(I).length, "vides : " + JSON.stringify(videsDe(I)) + " · " + JSON.stringify(I));
    ok("page « Ton plan d'action personnalisé » : la précision piégée affichée comme du texte, aucune balise créée, aucun script lancé", (await texte(page, "#dc-projection")) === TX.projection_page(PIEGE) && !(await injecte(page)), await texte(page, "#dc-projection"));
    await aller(page, "#/profil", 1800); await page.waitForSelector("#mc-reponses li", { timeout: 6000 }).catch(() => {});
    const rp = await lignes(page, "#mc-reponses");
    ok("Profil du prospect : « Le manque de temps — <b>test</b> » et la précision piégée en texte brut, aucune balise créée",
      JSON.stringify(rp.map(x => x[1])) === JSON.stringify(["Perdre du gras", "Le manque de temps — " + B, PIEGE]) && !(await injecte(page)), JSON.stringify(rp));
    const n0 = saisies(db).length;
    const { page: p2 } = await contexte(b, COACH, db);
    await p2.goto(URL0 + "#/clients"); await pret(p2, `[data-ouvrir="${ID}"]`);
    await p2.click(`[data-ouvrir="${ID}"]`); await p2.waitForSelector("#fiche-reponses", { timeout: 8000 }); await attendre(p2, 600);
    const rf = await lignes(p2, "#fiche-reponses"), fd = await lignes(p2, "#fiche-decouverte"), v = k2 => (fd.find(x => x[0] === k2) || [])[1];
    ok("coach, fiche du prospect : « Ce qui l'a bloqué » et « Dans 3 mois » en texte brut (réponses et bloc Découverte), aucune balise créée, aucun script lancé",
      JSON.stringify(rf.slice(1, 4)) === JSON.stringify([["Problème", "Perdre du gras"], ["Ce qui l'a bloqué", "Le manque de temps — " + B], ["Dans 3 mois", PIEGE]]) && v("Ce qui l'a bloqué") === "Le manque de temps — " + B && v("Dans 3 mois") === PIEGE && !(await injecte(p2)),
      JSON.stringify([rf, fd.filter(x => /bloqué|3 mois/.test(x[0]))]));
    await aller(p2, "#/prospects", 300); await p2.waitForSelector('#pr-vue [data-filtre="tous"]', { timeout: 8000 });
    await p2.click('#pr-vue [data-filtre="tous"]'); await p2.waitForSelector(`#pr-liste .sc-carte[data-uid="${ID}"]`, { timeout: 8000 }); await attendre(p2, 500);
    const carte = await p2.$eval(`#pr-liste .sc-carte[data-uid="${ID}"]`, e => Array.from(e.querySelectorAll(".sc-reponses li")).map(x => x.textContent)).then(l => l.map(norm)).catch(() => []);
    ok("coach, carte de la page Prospects : « Ce qui l'a bloqué « Le manque de temps — <b>test</b> » », « Dans 3 mois « <img …> » » en texte, aucune balise créée ; le coach n'écrit rien",
      JSON.stringify(carte) === JSON.stringify(["Problème Perdre du gras", "Ce qui l'a bloqué « Le manque de temps — " + B + " »", "Dans 3 mois « " + PIEGE + " »"]) && !(await injecte(p2)) && !(await p2.$("#pr-liste .sc-reponses b, #pr-liste .sc-reponses img")) && saisies(db).length === n0,
      JSON.stringify(carte) + " · " + resume(db));
  });

  /* =================== I. ancien prospect (réponses libres v52) =================== */
  await bloc("I. ancien prospect", async () => {
    const k = 10, ID = PID(k), db = base({ comptes: [compte(k, "Nina", "", [["intake", ANCIEN_V52]], { cree: avant(4 * J) })] });
    const ficheCoach = async () => {
      const { c, page: p } = await contexte(b, COACH, db);
      await p.goto(URL0 + "#/clients"); await pret(p, `[data-ouvrir="${ID}"]`);
      await p.click(`[data-ouvrir="${ID}"]`); await p.waitForSelector("#fiche-reponses", { timeout: 8000 }); await attendre(p, 500);
      const r = await lignes(p, "#fiche-reponses"); await c.close(); return r;
    };
    const attCoach = [["Email", "p10@exemple.fr"], ["Problème", "Perdre du gras"], ["Ce qui l'a bloqué", ANCIEN_V52.obstacle], ["Dans 3 mois", ANCIEN_V52.projection]];
    const rf0 = await ficheCoach();
    ok("coach, fiche de l'ancien prospect : ses réponses libres telles quelles (« Le manque de temps avec le travail », « Courir 10 km sans m'arrêter »)", JSON.stringify(rf0) === JSON.stringify(attCoach), JSON.stringify(rf0));
    const { page } = await ouvrir(b, db, k, "#/profil", "#mc-questionnaire", { viewport: MOBILE, toucher: true });
    await page.waitForSelector("#mc-reponses li", { timeout: 6000 }).catch(() => {});
    const attProfil = [[TX.legendes[0], "Perdre du gras"], [TX.legendes[1], ANCIEN_V52.obstacle], [TX.legendes[2], ANCIEN_V52.projection]];
    const rp = await lignes(page, "#mc-reponses");
    ok("Profil de l'ancien prospect : ses 3 réponses libres telles quelles", JSON.stringify(rp) === JSON.stringify(attProfil), JSON.stringify(rp));
    await aller(page, "#/decouverte/bilan", 1500);
    ok("page « Ton plan d'action personnalisé » (#/decouverte/bilan) : son ancienne réponse reprise telle quelle (« Ton objectif dans 3 mois : « Courir 10 km sans m'arrêter » »)", (await texte(page, "#dc-projection")) === TX.projection_page(ANCIEN_V52.projection), await texte(page, "#dc-projection"));
    await aller(page, "#/decouverte/reponses", 1500);
    const [p1, o1, r1] = [await etat(page, "probleme"), await etat(page, "obstacle"), await etat(page, "projection")], S = await structure(page), bt = await bouton(page);
    ok("« Modifier mes réponses » : « Perdre du gras » pré-cochée ; aucune pastille ni projection cochée ; les précisions pré-remplies avec ses anciens textes ; bouton actif",
      JSON.stringify([choisis(p1), choisis(o1), choisis(r1)]) === '[["Perdre du gras"],[],[]]' && S.fs[1].zone.val === ANCIEN_V52.obstacle && S.fs[2].zone.val === ANCIEN_V52.projection && bt.aria === "false",
      JSON.stringify([choisis(p1), choisis(o1), choisis(r1), S.fs.map(f => f.zone && f.zone.val), bt]));
    await page.tap("#dc-voir"); await attendre(page, 1600);
    const I = clone(intakeDe(db, ID)) || {}, perdues = Object.keys(ANCIEN_V52).filter(x => JSON.stringify(I[x]) !== JSON.stringify(ANCIEN_V52[x]));
    ok("valider sans rien toucher : UNE écriture, rien de perdu (obstacle, projection, court_le, bilan_propose… identiques), aucun champ vide créé (ni obstacle_choix [], ni projection_choix [])",
      ecr(db, "intake", ID).length === 1 && !perdues.length && !videsDe(I).length, "changées : " + JSON.stringify(perdues) + " · vides : " + JSON.stringify(videsDe(I)) + " · " + JSON.stringify(I));
    await aller(page, "#/profil", 1800); await page.waitForSelector("#mc-reponses li", { timeout: 6000 }).catch(() => {});
    const rp2 = await lignes(page, "#mc-reponses"), rf2 = await ficheCoach();
    ok("… ensuite : Profil et fiche du coach montrent toujours ses réponses telles quelles", JSON.stringify(rp2) === JSON.stringify(attProfil) && JSON.stringify(rf2) === JSON.stringify(attCoach), JSON.stringify([rp2, rf2]));
  });

  /* =================== J. Profil du prospect en anglais =================== */
  await bloc("J. Profil en anglais", async () => {
    const k = 11, ID = PID(k);
    const I0 = AVEC_CHOIX({ obstacle_precision: "le soir", obstacle: "Le manque de temps · Je craque sur la nourriture — le soir", email_compte: "p11@exemple.fr", bilan_propose: { choix: "plus_tard", le: avant(30 * MIN) } });
    const db = base({ comptes: [compte(k, "Léa", "Martin", [["intake", I0]])] });
    const { page } = await ouvrir(b, db, k, "#/profil", "#mc-questionnaire", { viewport: MOBILE, toucher: true, langue: "en", theme: "light" });
    await page.waitForSelector("#mc-reponses li", { timeout: 6000 }).catch(() => {}); await attendre(page, 400);
    await attendre(page, 1300);   // Store.ecrire n'envoie qu'après 700 ms : une écriture lancée par l'affichage aurait le temps d'arriver
    const rp = await lignes(page, "#mc-reponses"), v = await texte(page, "#vue");
    ok("Profil en anglais : « Your questionnaire », ses réponses à choix avec les libellés anglais (« Lose fat », « Not enough time · I give in to cravings — le soir », « Loving how I look in photos »), « Edit my answers »",
      (await texte(page, "#mc-questionnaire h2")) === TX.titre_en && JSON.stringify(rp) === JSON.stringify([[TX.legendes_en[0], "Lose fat"], [TX.legendes_en[1], "Not enough time · I give in to cravings — le soir"], [TX.legendes_en[2], "Loving how I look in photos"]])
      && (await texte(page, "#mc-reponses-lien a")) === TX.modifier_en && propre(v) && saisies(db).length === 0, JSON.stringify(rp));
    await page.click("#mc-reponses-lien a"); await page.waitForSelector("#q-probleme", { timeout: 6000 }); await attendre(page, 500);
    const [p1, o1, r1] = [await etat(page, "probleme"), await etat(page, "obstacle"), await etat(page, "projection")], S = await structure(page);
    ok("« Edit my answers » : cartes pré-cochées (Perdre du gras ; temps, craquages ; photos), dorées (thème clair), libellés anglais, précision « le soir » pré-remplie",
      JSON.stringify([choisis(p1), choisis(o1), choisis(r1)]) === '[["Perdre du gras"],["temps","craquages"],["photos"]]' && [p1, o1, r1].every(e => bienVisible(e, OR_CLAIR)) && S.fs[1].zone.val === "le soir" && norm(S.fs[1].opts[0].l) === "Not enough time" && norm(S.fs[0].opts[0].l) === "Lose fat",
      JSON.stringify([choisis(p1), choisis(o1), choisis(r1), S.fs[1].zone]));
    const { page: p2 } = await contexte(b, COACH, db);
    await p2.goto(URL0 + "#/clients"); await pret(p2, `[data-ouvrir="${ID}"]`);
    await p2.click(`[data-ouvrir="${ID}"]`); await p2.waitForSelector("#fiche-reponses", { timeout: 8000 }); await attendre(p2, 500);
    const rf = await lignes(p2, "#fiche-reponses");
    ok("coach : la fiche de ce prospect anglophone montre le texte français (« Le manque de temps · Je craque sur la nourriture — le soir », « M'aimer sur les photos »)",
      JSON.stringify(rf.slice(1, 4)) === JSON.stringify([["Problème", "Perdre du gras"], ["Ce qui l'a bloqué", I0.obstacle], ["Dans 3 mois", "M'aimer sur les photos"]]), JSON.stringify(rf));
  });

  /* =================== K. au clavier =================== */
  await bloc("K. clavier", async () => {
    const k = 12, ID = PID(k), db = base({ comptes: [compte(k, "Léa", "Martin")] });
    const { page } = await ouvrir(b, db, k, "", "#q-probleme", { viewport: MOBILE });
    const actif = () => page.evaluate(() => { const a = document.activeElement; return a ? { tag: a.tagName, id: a.id, nom: a.name || "", v: a.value || "", on: !!a.checked } : {}; });
    const tabJusqua = async (sel, max) => { for (let i = 0; i < (max || 60); i++) { await page.keyboard.press("Tab"); if (await page.evaluate(s => !!document.activeElement && document.activeElement.matches(s), sel)) return i + 1; } return 0; };
    const n1 = await tabJusqua('input[name="q-probleme"]', 60);
    const anneau = await page.evaluate(() => { const c = document.activeElement && document.activeElement.nextElementSibling; if (!c) return null; const s = getComputedStyle(c); return [s.outlineStyle, s.outlineColor, parseFloat(s.outlineWidth)]; });
    const a1 = await actif();
    ok("Tab jusqu'à la 1re carte (radio « Perdre du gras ») : atteinte, anneau de focus doré visible autour de la carte", n1 > 0 && a1.v === "Perdre du gras" && !!anneau && anneau[0] === "solid" && anneau[1] === OR_SOMBRE && anneau[2] >= 2, JSON.stringify([n1, a1, anneau]));
    await page.keyboard.press("Space"); await attendre(page, 200);
    const s1 = choisis(await etat(page, "probleme"));
    await page.keyboard.press("ArrowDown"); await attendre(page, 300);
    const s2 = choisis(await etat(page, "probleme")), a2 = await actif();
    ok("Espace choisit « Perdre du gras » ; flèche bas passe à « Prendre du muscle » (choisie, la 1re ne l'est plus)", JSON.stringify(s1) === '["Perdre du gras"]' && JSON.stringify(s2) === '["Prendre du muscle"]' && a2.v === "Prendre du muscle", JSON.stringify([s1, s2, a2]));
    const n2 = await tabJusqua('input[name="q-obstacle"]', 5); await page.keyboard.press("Space");
    await page.keyboard.press("Tab"); await page.keyboard.press("Space");
    await page.keyboard.press("Tab"); await page.keyboard.press("Space"); await attendre(page, 300);
    const s3 = choisis(await etat(page, "obstacle")), mx = (await structure(page)).fs[1].maxMsg, a3 = await actif();
    ok("Tab jusqu'aux pastilles, Espace sur les 2 premières : prises ; Espace sur la 3e (« Je ne sais pas quoi faire exactement ») : refusée, « 2 réponses max »",
      n2 > 0 && JSON.stringify(s3) === '["temps","craquages"]' && a3.v === "quoi_faire" && !a3.on && !!mx && mx.txt === TX.max, JSON.stringify([n2, s3, a3, mx]));
    const n3 = await tabJusqua('input[name="q-projection"]', 12); await page.keyboard.press("Space"); await attendre(page, 300);
    const n4 = await tabJusqua("#dc-voir", 5), bt = await bouton(page);
    await page.keyboard.press("Enter"); await attendre(page, 1600);
    const I = clone(intakeDe(db, ID)) || {};
    ok("Tab jusqu'à la question 3, Espace, Tab jusqu'au bouton (actif), Entrée : validé (court_le), page « Ton plan d'action personnalisé » (« Ton objectif dans 3 mois : « Rentrer à nouveau dans mes vêtements préférés » ») ; probleme « Prendre du muscle », obstacle_choix temps + craquages, projection « Rentrer à nouveau dans mes vêtements préférés », aucun champ vide créé",
      n3 > 0 && n4 > 0 && bt.aria === "false" && typeof I.court_le === "string" && I.probleme === "Prendre du muscle" && JSON.stringify(I.obstacle_choix) === '["temps","craquages"]' && JSON.stringify(I.projection_choix) === '["vetements"]' && I.projection === "Rentrer à nouveau dans mes vêtements préférés" && !videsDe(I).length && (await texte(page, "#dc-projection")) === TX.projection_page("Rentrer à nouveau dans mes vêtements préférés"),
      "vides : " + JSON.stringify(videsDe(I)) + " · " + JSON.stringify([n3, n4, bt, I]));
  });

  /* =================== Z. rien vers l'extérieur =================== */
  await bloc("Z. hôtes externes", async () => {
    const autres = Array.from(externes).filter(h => !/^fonts\.(googleapis|gstatic)\.com$/.test(h));
    ok("aucune requête vers un autre hôte que la page, le faux Supabase et les polices (bloquées)", autres.length === 0, JSON.stringify(autres));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
