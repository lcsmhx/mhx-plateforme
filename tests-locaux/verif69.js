/* verif69 — v62 (brief V2, lot 3, section L) : le bloc « Mesure » de la page Prospects du coach (#/prospects), de bout en
   bout dans un vrai navigateur (coach fictif, prospects fictifs, Supabase simulé), sur ordinateur et téléphone (390 px), en
   thème sombre et clair :
   A. place et forme : section.panel#pr-mesure juste après les 4 tuiles (À traiter, Signés, Perdus, Absents) et avant les
      filtres ; « Mesure » et le sélecteur « 7 derniers jours » (par défaut) / « 30 derniers jours » / « Depuis le
      28/09/2026 » ; 5 tuiles (libellés exacts, dans l'ordre) ; « Clics par écran » (Écran, Clics, Plus tard) ; case
      « Inclure les comptes de test » décochée ;
   B. les 5 chiffres et le tableau exacts pour CHAQUE période, sur des données variées (inscriptions, questionnaires, clics,
      « Plus tard » et cases à des dates différentes ; limites à la seconde : un événement à 00:00:00 pile compté, un à
      23:59:59 la veille non compté, pour minuit il y a 6 jours (12/11), minuit il y a 29 jours (20/10) et le 28/09/2026 ;
      un clic daté de demain ne compte jamais — v63 : ni comme « dernier clic » de la carte et du CSV, voir E) ; noms d'écran en clair (Decouverte.ORIGINES) ; anciens codes
      (bilan-propose, decouverte, decouverte-accompagnement, verrou-programme) comptés avec les nouveaux ; clic sans
      source : « origine inconnue (avant la v50) » ; listes de clics PAS dans l'ordre des dates ; tableau : autant de
      lignes que d'écrans attendus, somme de la colonne Clics = tuile « Clics » ; tri par clics décroissants, puis « Plus tard » ; « Plus tard » par
      origine (cta.plus_tard, et le « plus_tard » d'intake.bilan_propose compté une seule fois) ; un client passé par
      l'inscription gratuite compte, un client créé par le coach jamais ; au clavier, le réglage changé
      (période, case) garde le focus après le redessin du bloc ;
   C. exclusions : le compte du coach toujours (même case cochée) ; email avec « +test » (majuscules comprises, dans
      email_compte ou, à défaut, email) et identifiant de CONFIG.nouveautes.comptes_test (lu dans le fichier servi) exclus
      tant que la case est décochée ; cochée : ils comptent, à chaque période (la période est gardée quand on coche, la case
      quand on change de période) ; décochée : de nouveau exclus ; aucun email écrit en dur (code du bloc, comptes_test) ;
   D. brief L, « FAIT QUAND » : 3 clics d'un prospect de test depuis 3 écrans différents apparaissent avec les bonnes
      origines quand la case est cochée, et disparaissent des chiffres quand elle est décochée — sur le décor, puis de
      bout en bout : un prospect de test (« +test ») clique 3 VRAIS boutons (accueil, #/programme, #/journal ; faux
      Calendly : chaque onglet reçoit le bon utm_content), puis le coach regarde, sur la même base ;
   E. chaque carte de prospect : « Clics plan d'action » (dernière ligne) « 0 », ou « N (dernier : <écran du clic le plus
      récent> ») , origine inconnue comprise, liste pas dans l'ordre des dates ; v63 : un clic daté de demain (plus de 5 min
      dans le futur : horloge du téléphone en avance) IGNORÉ, le plus récent d'avant compte (David) ; un calcul qui plante :
      « — » ; v63 : l'export CSV « Dernier clic » = la date du clic le plus récent (liste pas dans l'ordre, dates objet
      ignorées, date de demain ignorée), et la carte et le CSV désignent le MÊME clic pour chaque prospect ;
   F. période vide : « Aucun clic ni « Plus tard » sur cette période. », tuiles à 0, puis le tableau sur 30 jours ;
   G. aucune donnée de santé (poids, calories, mensurations) ni email dans le bloc ; rien n'est lu en plus (la lecture
      groupée de la page et les clés du coach seulement), aucune requête quand on change de période ou qu'on coche la case,
      rien n'est écrit ;
   H. affichage : téléphone 390 px en thème sombre, 320 px, et ordinateur en thème clair : rien ne déborde (ni les boîtes,
      ni le texte des tuiles), tout le texte du bloc lisible (contraste : titres, sélecteur, tuiles, en-têtes, cellules,
      case, notes) ; 2 captures du bloc si VERIF69_CAPTURES est posé (pas des vérifications) ;
   I. données piégées (date objet, sources « __proto__ » / « constructor » / « hasOwnProperty » / « prototype » / non
      texte, clés de forme inattendue, listes géantes) : la page s'affiche, ({}).clics reste undefined, chiffres exacts, les
      autres comptes gardent leurs chiffres et leurs cartes ; un bloc qui plante À L'AFFICHAGE de la page (arrivée depuis
      Mes clients) : « Mesure indisponible pour le moment. », le reste de la page est là (compteur, 4 tuiles, filtres,
      cartes, Nouveautés, Newsletter, identiques) ; Mes clients (régularité comprise) identique avant et après la visite ;
   J. les autres origines (brief L : « Toute autre origine trouvée est conservée, avec un code clair ») : « Modifier mes
      réponses », pages verrouillées Mon bilan / Mes compléments, fiche-coach et fiche_coach (une ligne), une page
      verrouillée inconnue (verrou-recettes), un code propre inconnu (tel quel) ; sources illisibles (nombre, objet,
      majuscules, texte HTML, 41 caractères) : « ? » ; la case d'un ancien prospect du challenge (jours["7"].reserve) ;
   K. « Plus tard » écrits par le prospect : 50 au plus (le plus ancien retiré), et la relecture avant écriture (fraiche)
      fusionne les « Plus tard » notés sur l'appareil avec ceux de la base, sans doublon ;
   Z. aucun appel vers l'extérieur (le faux Calendly du bloc D sert une page blanche, rien ne part).
   Dans les blocs (hors écritures du prospect de D et K, vérifiées) : aucune écriture, les données de tous inchangées.
   Horloge : la période « Depuis le 28/09/2026 » part d'une date FIXE ; pour que les 3 périodes soient distinctes et les
   chiffres attendus exacts quel que soit le jour du lancement, l'horloge de chaque navigateur est posée au mercredi
   18/11/2026 à midi (heure locale) et tourne (aucun minuit franchi pendant la suite) ; les dates du décor sont fixes, en
   heure locale (comme celles de l'app). Infrastructure (serveur, faux Supabase) reprise de verif64 : rien ne part vers la
   vraie base (routage par NOM D'HÔTE), chaque écriture ou lecture est notée. La page et ses fichiers sont servis tels quels.
   Chaque bloc tourne à part (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif69.js ../index.html
           VERIF69_PORT=9851 node verif69.js ../index.html     (autre port, si 9850 est pris)
           VERIF69_BLOCS="B.,I." node verif69.js …              (seulement les blocs dont le nom commence ainsi)
           VERIF69_CAPTURES=<dossier> node verif69.js …         (captures du bloc : 390 px sombre, ordinateur clair) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF69_PORT || 9850;
const BLOCS = (process.env.VERIF69_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const CAPT = process.env.VERIF69_CAPTURES ? path.resolve(process.env.VERIF69_CAPTURES) : null;
const MOBILE = { width: 390, height: 844 }, ETROIT = { width: 320, height: 700 }, ORDI = { width: 1280, height: 900 };

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

/* ---------- dates : fixes, en heure locale ---------- */
const MIN = 60000, H = 3600000, J = 86400000;
const L = (j, m, h, mi, s) => new Date(2026, m - 1, j, h || 0, mi || 0, s || 0, 0).toISOString();   // le j/m/2026 à h:mi:s, heure locale
const T0 = new Date(2026, 10, 18, 12, 0, 0, 0).getTime();   // mercredi 18/11/2026, midi (heure locale)
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const norm = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "donnees", f), "utf8"));   // lecture seule
const CATALOGUE = Object.assign({}, F.catalogue, { aliments: lireDonnees("aliments.json"), recettes: lireDonnees("recettes.json") });

/* ---------- les personnes (la session expire un jour après l'heure posée dans le navigateur) ---------- */
const session = (id, email) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: T0 + J, user: { id, email, role: "authenticated" } });
const qui = (id, email) => ({ id, email, session: session(id, email) });
const COACH = qui(F.IDS.coach, "coach@exemple.fr");
const PID = k => "00000000-0000-4000-8000-0000000069" + String(k).padStart(2, "0");   // verif69 : …69kk (une plage par suite)

/* ---------- le faux Supabase (repris de verif64) ---------- */
const MAX_LIGNES = 1000;
const ILLISIBLES_PROPRIO = ["notes_coach", "suivi_prospect"];
const INTERDITES_PROPRIO = ["feedbacks", "notes_coach", "suivi_prospect"];
const ECRITES_PAR_COACH = ["programme", "repas", "calc", "complements", "hist_programme", "hist_repas", "feedbacks", "notes_coach", "suivi_prospect"];
const permis = (moi, coach, row) => !!moi && (row.user_id === moi ? (coach || !INTERDITES_PROPRIO.includes(row.outil)) : (coach && ECRITES_PAR_COACH.includes(row.outil)));
const externes = new Set();
const CAL_RECUS = [];   // le faux Calendly (hôte calendly.com, comme verif67) : les adresses reçues par les onglets ouverts
let CAL_ATTENDUS = 0;   // le nombre d'onglets Calendly que les blocs lancés ont ouverts (3 par le bloc D, vrais clics)
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
  /* le faux Calendly (bloc D, vrais clics du prospect) : une page blanche pour l'onglet ouvert, l'adresse reçue est notée */
  if (host === "calendly.com") { CAL_RECUS.push(u); return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body>Calendly (faux)</body></html>" }).catch(() => {}); }
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort(); }   // polices, Instagram… : rien ne sort
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req) || (who && who.id) || null;
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  db.chemins.push(m + " " + p + (url.search || ""));
  if (p.startsWith("/auth/v1/token")) {   // renouvellement : jamais compté comme écriture
    const c = corps() || {}, r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || ""));
    const id = (r1 && r1[1]) || (who && who.id);
    if (!id) return json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
    return json(who && id === who.id ? who.session : session(id, db.emails[id] || ""));
  }
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);   // v56 : notée par la base, pas une écriture de l'app
  if (!["GET", "HEAD"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m, corps: corps() });
  if (p.startsWith("/auth/v1/logout")) { db.journal.push("LOGOUT"); return json({}); }
  if (p.startsWith("/auth/v1/user")) return moi ? json({ id: moi, email: db.emails[moi] || (who && who.id === moi ? who.email : ""), role: "authenticated" }) : json({ msg: "invalid JWT" }, 401);
  if (p.startsWith("/auth/v1/")) return json({});
  if (p.startsWith("/functions/v1/")) { db.fonctions.push({ nom: p.slice(14), m }); return json({ ok: true }); }
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/emails_prospects") return json(coach ? colonnes(plage(db.emails_prospects.slice()), q) : []);
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
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "", mj = q.get("maj_le");
    const cleEq = o.startsWith("eq.") ? o.slice(3) : null;
    if (m === "GET" || m === "HEAD") {
      db.lectures.push({ par: moi, uid, outil: o, select: q.get("select") || "*" }); db.journal.push("L " + (cleEq || o));
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
        const ligne = { user_id: row.user_id, outil: row.outil, contenu: clone(row.contenu), maj_le: row.maj_le || new Date(T0).toISOString() };
        if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        db.ecritures.push(Object.assign({ table: "donnees", m }, clone(ligne))); db.journal.push("E " + row.outil);
        out.push(ligne);
      }
      return (req.headers()["prefer"] || "").includes("return=representation") ? json(out, 201) : json(null, 201);
    }
    if (m === "PATCH") {
      const c = corps() || {};
      const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj == null || (mj === "is.null" ? !x.maj_le : (mj.startsWith("eq.") && x.maj_le === mj.slice(3)))));
      if (!row) return json([]);
      if (!permis(moi, coach, row)) { db.refus.push({ table: "donnees", m, user_id: uid, outil: cleEq }); return json([]); }
      Object.assign(row, { contenu: clone(c.contenu), maj_le: c.maj_le || new Date(T0).toISOString() });
      db.ecritures.push(Object.assign({ table: "donnees", m }, clone(row))); db.journal.push("E " + cleEq);
      return json([row]);
    }
    db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq });   // DELETE : jamais attendu, noté
    return json(null, 204);
  }
  if (p === "/rest/v1/bibliotheque") return m === "GET" ? json(coach ? colonnes(plage(clone(F.bibliotheque)), q) : []) : json(null, 204);
  const t = p.replace("/rest/v1/", "");
  if (CATALOGUE[t]) return m === "GET" ? json(colonnes(plage(CATALOGUE[t]), q)) : json(null, 201);
  return json([]);
}

/* ---------- un navigateur (contexte) : opts.viewport (ordinateur par défaut), opts.theme ("light" : thème clair, rangé
   sur l'appareil comme le fait le bouton de thème ; sombre par défaut) ---------- */
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || ORDI });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, who, db));
  await c.addInitScript(({ s, theme }) => {
    if (!/^https?:$/.test(location.protocol)) return;
    if (!localStorage.getItem("__init")) {
      localStorage.setItem("__init", "1");
      if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
      localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
      if (theme) localStorage.setItem("mhx_theme", theme);
    }
  }, { s: who ? who.session : null, theme: opts.theme || "" });
  await c.clock.install({ time: T0 });   // mercredi 18/11/2026 à midi, puis l'horloge tourne
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
let URL0 = "";
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1500); };
const resume = db => JSON.stringify(db.ecritures.map(e => (e.table === "donnees" ? e.outil : e.table) + ":" + e.m));
const egal = (x, y) => JSON.stringify(x) === JSON.stringify(y);
async function coachSur(b, db, hash, sel, opts){
  const x = await contexte(b, COACH, db, opts);
  await x.page.goto(URL0 + (hash || "")); await pret(x.page, sel || "#vue");
  return x;
}
/* le bloc Mesure tel qu'il est affiché */
const lireMesure = page => page.evaluate(() => {
  const n = s => String(s || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
  const B = document.querySelector("#pr-mesure"); if (!B) return null;
  const sel = B.querySelector("#pr-mesure-periode"), tab = B.querySelector("#pr-mesure-table"), vide = B.querySelector("#pr-mesure-vide"), cb = B.querySelector("#pr-mesure-test");
  return {
    tag: B.tagName + "." + B.className, h2: n((B.querySelector("h2") || {}).textContent),
    periode: sel ? sel.value : null, options: sel ? Array.from(sel.options).map(o => [o.value, n(o.textContent)]) : [],
    tuiles: Array.from(B.querySelectorAll("div.tiles#pr-mesure-chiffres > .tile")).map(t => [n((t.querySelector(".t-lbl") || {}).textContent), n((t.querySelector(".t-val") || {}).textContent)]),
    h3: n((B.querySelector("h3") || {}).textContent),
    tableCls: tab ? tab.tagName + "." + tab.className : "",
    entetes: tab ? Array.from(tab.querySelectorAll("thead th")).map(x => n(x.textContent)) : [],
    lignes: tab ? Array.from(tab.querySelectorAll("tbody tr")).map(tr => { const td = tr.querySelectorAll("td"); return [tr.getAttribute("data-origine"), n(td[0] && td[0].textContent), n(td[1] && td[1].textContent), n(td[2] && td[2].textContent)]; }) : null,
    vide: vide ? vide.tagName + ":" + n(vide.textContent) : null,
    test: cb ? cb.checked : null, testLbl: cb && cb.closest("label") ? n(cb.closest("label").textContent) : "",
    note: n(Array.from(B.querySelectorAll("p.note")).map(p => p.textContent).join(" | ")),
    texte: n(B.textContent), html: B.innerHTML
  };
});
const periode = async (page, v) => { await page.selectOption("#pr-mesure-periode", v); await attendre(page, 250); };
const caseTest = async page => { await page.click("#pr-mesure-test"); await attendre(page, 250); };
/* les 5 chiffres ; le tableau { code: [clics, plus tard] } ; noms en clair ; tri */
const chiffres = M => M ? M.tuiles.map(t => t[1]).join(",") : "?";
const tableau = M => M && M.lignes ? Object.fromEntries(M.lignes.map(r => [r[0], [+r[2], +r[3]]])) : null;
/* le tableau exact : autant de lignes que d'écrans attendus (deux lignes d'un même data-origine ne se fondent pas en une),
   les mêmes écrans et valeurs, des nombres entiers, et la somme de la colonne Clics = la tuile « Clics » */
const memeTable = (M, E) => { const t = tableau(M); if (!t) return false; const k1 = Object.keys(t).sort(), k2 = Object.keys(E).sort(), tc = M.tuiles[3] || [];
  return M.lignes.length === k2.length && egal(k1, k2) && k1.every(k => egal(t[k], E[k])) && M.lignes.every(r => /^\d+$/.test(r[2]) && /^\d+$/.test(r[3]))
    && tc[0] === "Clics" && M.lignes.reduce((s, r) => s + (+r[2]), 0) === +tc[1]; };
const trie = M => !!(M && M.lignes) && M.lignes.length > 0 && M.lignes.every((r, i) => { if (!i) return true; const p = M.lignes[i - 1]; return +p[2] > +r[2] || (+p[2] === +r[2] && +p[3] >= +r[3]); });
const NOMS = {
  apres_questionnaire: "page « Ton plan d'action » (après les 3 questions)",
  accueil_haut: "accueil, bouton du haut",
  accueil_accompagnement: "accueil, carte « Ce que l'accompagnement ajoute »",
  reponses_haut: "« Modifier mes réponses », bouton du haut",   // les autres origines écrites par l'app (bloc J)
  verrou_programme: "page verrouillée Mon programme",
  verrou_journal: "page verrouillée Mon journal",
  verrou_nutrition: "page verrouillée Nutrition",
  verrou_suivi: "page verrouillée Mon suivi",
  verrou_bilan: "page verrouillée Mon bilan",
  verrou_complements: "page verrouillée Mes compléments",
  declic_calculateur: "invitation après le calculateur",
  declic_premiere_pesee: "invitation après la première pesée",
  declic_mindset: "invitation après le module Mindset",
  formation_commence_ici: "invitation après « Commence ici »",
  fiche_coach: "lien envoyé par le coach",
  "?": "origine inconnue (avant la v50)"
};
/* noms en clair (au moins une ligne) ; extra : les noms des codes inconnus du bloc J */
const nomsOk = (M, extra) => !!(M && M.lignes) && M.lignes.length > 0 && M.lignes.every(r => (extra && Object.prototype.hasOwnProperty.call(extra, r[0]) ? extra[r[0]] : NOMS[r[0]]) === r[1]);
const detail = M => M ? chiffres(M) + " " + JSON.stringify(M.lignes) + (M.vide ? " " + M.vide : "") : "bloc absent";
/* E + deltas (chiffres et lignes du tableau) */
function plus(E){
  const out = { chiffres: E.chiffres.slice(), table: clone(E.table) };
  Array.from(arguments).slice(1).forEach(d => {
    d.chiffres.forEach((v, i) => { out.chiffres[i] += v; });
    Object.keys(d.table).forEach(k => { const a = out.table[k] || [0, 0]; out.table[k] = [a[0] + d.table[k][0], a[1] + d.table[k][1]]; });
  });
  return out;
}
const conforme = (M, E, per, extra) => !!M && M.periode === per && chiffres(M) === E.chiffres.join(",") && memeTable(M, E.table) && trie(M) && nomsOk(M, extra) && M.vide === null;
/* la ligne « Clics plan d'action » de chaque carte (valeur, rang dans ul.sc-faits, nombre de lignes, ligne d'avant) */
const clicsCartes = page => page.$$eval("#pr-liste .sc-carte", l => Object.fromEntries(l.map(c => {
  const n = s => String(s || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
  const lis = Array.from(c.querySelectorAll("ul.sc-faits > li")), i = lis.findIndex(li => n((li.querySelector("span") || {}).textContent) === "Clics plan d'action");
  return [c.dataset.uid, { v: i > -1 && lis[i].querySelector("b") ? n(lis[i].querySelector("b").textContent) : null, rang: i, n: lis.length, avant: i > 0 ? n((lis[i - 1].querySelector("span") || {}).textContent) : "" }];
}))).catch(() => ({}));
const tous = async page => { await page.click('[data-filtre="tous"]'); await attendre(page, 400); };
const mesClients = page => page.$$eval("#tb-clients tr", l => l.map(tr => tr.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim())).catch(() => []);
/* v63 (lot 4) : l'export CSV des prospects (bouton #pr-csv), relu comme un vrai CSV (guillemets, point-virgule, CRLF ; repris de verif58) */
async function exporter(page){
  const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 6000 }), page.click("#pr-csv")]);
  return fs.readFileSync(await dl.path(), "utf8");
}
function lireCSV(s){
  const L = []; let ligne = [], champ = "", dans = false;
  for (let i = 0; i < s.length; i++) { const ch = s[i];
    if (dans) { if (ch === '"') { if (s[i + 1] === '"') { champ += '"'; i++; } else dans = false; } else champ += ch; continue; }
    if (ch === '"') dans = true; else if (ch === ";") { ligne.push(champ); champ = ""; } else if (ch === "\r" && s[i + 1] === "\n") { ligne.push(champ); L.push(ligne); ligne = []; champ = ""; i++; } else champ += ch; }
  return L;
}
const pad2 = n => String(n).padStart(2, "0");
const frL = v => { const d = new Date(v); return pad2(d.getDate()) + "/" + pad2(d.getMonth() + 1) + "/" + d.getFullYear(); };   // la date (locale) d'un instant, comme l'export
/* le contraste (WCAG) du texte des éléments sel sur le premier fond opaque en remontant. Seuil : 4,5:1 ; 3:1 (celui des
   tuiles de l'app) pour les seules exceptions NOMMÉES — comme verif66 — et seulement si le texte a exactement la couleur du
   jeton de l'app : le texte secondaire de toute l'app (--ink-3, styles communs : libellés des tuiles .t-lbl, titres h3
   comme « Clics par écran », en-têtes th, notes .note), mesuré à 3,99:1 en sombre et 4,27:1 en clair sur le panneau,
   4,13:1 et 3,94:1 sur le fond des tuiles ; un de ces textes passé à une autre couleur retombe sous le seuil de 4,5:1.
   Tout le reste du bloc (titre, sélecteur, chiffres, cellules, case) : 4,5:1 */
const CONTRASTE = 4.5, CONTRASTE_EXC = 3, EXCEPTIONS_CONTRASTE = [[".t-lbl", "--ink-3"], ["h3", "--ink-3"], ["th", "--ink-3"], [".note", "--ink-3"]];
const seuil = x => x.exc ? CONTRASTE_EXC : CONTRASTE;
const lisible = (page, sel) => page.$$eval(sel, (l, EXC) => {
  const jeton = v => { const s = document.createElement("span"); s.style.color = "var(" + v + ")"; document.body.appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c; };
  const exc = e => EXC.some(([q, v]) => e.matches(q) && getComputedStyle(e).color === jeton(v));
  const rgb = s => {
    let m = /^rgba?\(([^)]+)\)/.exec(s);
    if (m) { const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
    m = /^color\(srgb ([^)]+)\)/.exec(s);
    if (m) { const p = m[1].split(/[\s\/]+/).filter(Boolean).map(parseFloat); return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1]; }
    return null;
  };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const fond = e => { for (let x = e; x; x = x.parentElement) { const c = rgb(getComputedStyle(x).backgroundColor); if (c && c[3] > 0.5) return c; } return [255, 255, 255, 1]; };
  const qui = e => e.tagName.toLowerCase() + (e.className ? "." + String(e.className).trim().replace(/\s+/g, ".") : "") + " « " + String(e.textContent || "").replace(/\s+/g, " ").trim().slice(0, 30) + " »";
  return l.map(e => { const t = rgb(getComputedStyle(e).color), f = fond(e); if (!t) return { ratio: 0, fondClair: null, qui: qui(e), exc: false }; const a = lum(t), b = lum(f); return { ratio: +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2), fondClair: b > 0.4, qui: qui(e), exc: exc(e) }; });
}, EXCEPTIONS_CONTRASTE).catch(() => []);
/* tout le texte du bloc : titre, sélecteur, libellés et chiffres des tuiles, « Clics par écran », en-têtes, cellules, case, notes ;
   absentes : les sortes d'éléments introuvables (chacune doit être là, donc mesurée) */
const PARTIES = ["h2", "select", ".t-lbl", ".t-val", "h3", "th", "td", "label", "p.note"].map(x => "#pr-mesure " + x), TEXTE_BLOC = PARTIES.join(", ");
const absentes = page => page.evaluate(l => l.filter(x => !document.querySelector(x)), PARTIES).catch(() => ["?"]);
/* la géométrie du bloc (débordements) */
const geo = page => page.evaluate(() => {
  const B = document.querySelector("#pr-mesure"); if (!B) return null;
  const r = B.getBoundingClientRect(), t = document.querySelector("#pr-mesure-table"), tr = t ? t.getBoundingClientRect() : null, W = window.innerWidth;
  const tuiles = Array.from(B.querySelectorAll("#pr-mesure-chiffres > .tile")).map(e => e.getBoundingClientRect());
  /* le TEXTE des tuiles ne dépasse pas de sa boîte (un mot long d'un libellé en capitales, un grand nombre) */
  const texteTuiles = Array.from(B.querySelectorAll("#pr-mesure-chiffres > .tile")).filter(e => [e].concat(Array.from(e.querySelectorAll(".t-lbl, .t-val"))).some(x => x.scrollWidth > x.clientWidth + 1))
    .map(e => { const l = e.querySelector(".t-lbl"), rg = document.createRange(); if (l) rg.selectNodeContents(l); const tr = l ? rg.getBoundingClientRect() : null, er = e.getBoundingClientRect();
      return (l ? l.textContent.trim() : "?") + " (texte " + (l ? l.scrollWidth + " px dans " + l.clientWidth : "?") + " ; fin du texte à " + (tr ? Math.round(er.right - tr.right) : "?") + " px du bord de la tuile)"; });
  const sel = B.querySelector("#pr-mesure-periode").getBoundingClientRect();
  return { page: document.documentElement.scrollWidth + "/" + W, deborde: document.documentElement.scrollWidth > W + 1, bloc: [Math.round(r.left), Math.round(r.right)],
    blocOk: r.left >= 0 && r.right <= W + 1, tableOk: !!tr && tr.left >= r.left - 1 && tr.right <= r.right + 1,
    tuilesOk: tuiles.length === 5 && tuiles.every(x => x.width > 0 && x.height > 0 && x.left >= r.left - 1 && x.right <= r.right + 1),
    selectOk: sel.width > 0 && sel.right <= r.right + 1, cellules: t ? Array.from(t.querySelectorAll("td, th")).filter(td => td.scrollWidth > td.clientWidth + 1).length : -1, texteTuiles,
    theme: document.documentElement.getAttribute("data-theme") };
}).catch(() => null);
/* les lectures de « donnees » depuis n0 qui ne sont ni la lecture groupée de la page (Clients.charger) ni une clé du coach */
const GROUPEE = "not.in.(hist_programme,hist_repas,notes_coach)";
const luEnPlus = (db, n0) => db.lectures.slice(n0).filter(l => !(l.uid === COACH.id || (!l.uid && l.outil === GROUPEE)));

/* ---------- le décor ---------- */
const SRC = source(HTML);
const TEST_ID = (/comptes_test:\s*\[\s*"([0-9a-f-]{36})"/.exec(SRC) || [])[1] || null;   // CONFIG.nouveautes.comptes_test du fichier servi
const XID = TEST_ID || PID(90);
const REP = { probleme: "Perdre du gras", obstacle: "Le manque de temps", projection: "Courir 5 km" };
const clic = (source, date, jour) => Object.assign({ jour: jour || 1 }, source !== undefined ? { source } : {}, { date });
const pt = (source, date) => ({ source, date });
const chal = (clics, tard, reserve) => { const C = { version: 1, jours: {}, cta: { clics: clics || [] } }; if (tard) C.cta.plus_tard = tard; if (reserve) C.reserve = reserve; return C; };
const intake = (court_le, email, extra) => Object.assign({}, REP, { court_debut: new Date(Date.parse(court_le) - 10 * MIN).toISOString(), court_le }, email ? { email_compte: email } : {}, extra || {});
const ANNA = PID(1), BRUNO = PID(2), CHLOE = PID(3), DAVID = PID(4), EMMA = PID(5), FARID = PID(6), GILLES = PID(7), HELENE = PID(8), INES = PID(9), KARIM = PID(10), MARC = PID(11), TESS = PID(12), UGO = PID(13);
const PIEGE = PID(20), GEANT = PID(21), BIZ = PID(22), BIZ2 = PID(23);
const TINA = PID(14), OLGA = PID(15), PAUL = PID(30), RITA = PID(31);   // blocs D (vrais clics), J, K
/* comptes : { id, prenom, nom, statut ("prospect" par défaut), cree, email (celui du compte), donnees: [[outil, contenu, maj_le]] } */
const C = {
  /* inscrite le 13/11 (7 j) : questionnaire, clic sur la page du plan puis sur l'accueil, case le 16/11 ; poids, mensurations et
     calories en base (jamais dans le bloc) ; son choix « Réserver » sur la page du plan (pas un « Plus tard ») */
  anna: () => ({ id: ANNA, prenom: "Anna", nom: "Tôt", cree: L(13, 11, 10, 0), email: "anna@exemple.fr", donnees: [
    ["intake", intake(L(13, 11, 10, 20), "anna@exemple.fr", { bilan_propose: { choix: "reserver", le: L(13, 11, 10, 21) } }), L(13, 11, 10, 21)],
    ["challenge", chal([clic("apres_questionnaire", L(13, 11, 10, 21)), clic("accueil_haut", L(16, 11, 9, 0), 4)], null, L(16, 11, 9, 30)), L(16, 11, 9, 30)],
    ["mens", { dstart: "2026-11-13", pstart: 71.4, zones: [], affichees: [], mesures: [{ sem: 1, date: "2026-11-13", poids: 71.4, vals: { "0": 83.5 } }] }, L(13, 11, 11, 0)],
    ["calc_perso", { kcal: 1873, prot: 131, sexe: "Femme", age: 34, poids: 71.4, taille: 168 }, L(13, 11, 11, 5)]] }),
  /* inscrit le 25/10 (30 j) : ancien code « bilan-propose » le 25/10, ancien « verrou-programme » le 14/11 (7 j) — liste PAS
     dans l'ordre des dates (le plus récent en premier : la carte ne prend pas le dernier de la liste) ;
     « Plus tard » d'une invitation (declic_calculateur) le 14/11 */
  bruno: () => ({ id: BRUNO, prenom: "Bruno", nom: "Ancien", cree: L(25, 10, 10, 0), email: "bruno@exemple.fr", donnees: [
    ["intake", intake(L(25, 10, 10, 15), "bruno@exemple.fr", { bilan_propose: { choix: "reserver", le: L(25, 10, 10, 16) } }), L(25, 10, 10, 16)],
    ["challenge", chal([clic("verrou-programme", L(14, 11, 8, 0), 21), clic("bilan-propose", L(25, 10, 10, 16))], [pt("declic_calculateur", L(14, 11, 9, 0))]), L(14, 11, 9, 0)]] }),
  /* inscrite le 05/10 (depuis le 28/09 seulement), email dans « email » : « Plus tard » d'avant la v62 (intake.bilan_propose
     seul), anciens codes « decouverte » (19/10 à 23:59:59 : hors 30 j d'une seconde) et « decouverte-accompagnement » (20/10
     à 00:00:00 pile : 30 j), un clic sans source (06/10) — liste pas dans l'ordre des dates ; case le 20/10 à 00:00:00 (30 j) */
  chloe: () => ({ id: CHLOE, prenom: "Chloé", nom: "Octobre", cree: L(5, 10, 9, 0), email: "chloe@exemple.fr", donnees: [
    ["intake", intake(L(5, 10, 9, 20), null, { email: "chloe@exemple.fr", bilan_propose: { choix: "plus_tard", le: L(5, 10, 9, 21) } }), L(5, 10, 9, 21)],
    ["challenge", chal([clic("decouverte", L(19, 10, 23, 59, 59), 15), clic(undefined, L(6, 10, 10, 0), 2), clic("decouverte-accompagnement", L(20, 10, 0, 0), 16)], null, L(20, 10, 0, 0)), L(20, 10, 0, 0)]] }),
  /* inscrit le 20/09 (avant le 28/09) : « Plus tard » de la page du plan le 20/09 (les deux formes) ; clic le 27/09 à 23:59:59
     (une seconde avant le 28/09), clic le 17/11 (7 j), clic daté de DEMAIN (horloge d'un appareil en avance : jamais compté ; v63 : ni pris
     pour le « dernier clic » — carte et CSV sur son clic du 17/11) */
  david: () => ({ id: DAVID, prenom: "David", nom: "Septembre", cree: L(20, 9, 10, 0), email: "david@exemple.fr", donnees: [
    ["intake", intake(L(20, 9, 10, 10), "david@exemple.fr", { bilan_propose: { choix: "plus_tard", le: L(20, 9, 10, 11) } }), L(20, 9, 10, 11)],
    ["challenge", chal([clic("accueil_haut", L(27, 9, 23, 59, 59), 8), clic("verrou_nutrition", L(17, 11, 8, 0), 59), clic("apres_questionnaire", L(19, 11, 12, 0), 61)], [pt("apres_questionnaire", L(20, 9, 10, 11))]), L(17, 11, 8, 0)]] }),
  /* inscrite le 15/11 : « Plus tard » de la page du plan noté des deux façons (bilan_propose ET cta.plus_tard) = compté une
     fois ; « Plus tard » d'une invitation (declic_mindset) le 16/11 ; aucun clic */
  emma: () => ({ id: EMMA, prenom: "Emma", nom: "Plus-Tard", cree: L(15, 11, 9, 0), email: "emma@exemple.fr", donnees: [
    ["intake", intake(L(15, 11, 9, 10), "emma@exemple.fr", { bilan_propose: { choix: "plus_tard", le: L(15, 11, 9, 11) } }), L(15, 11, 9, 11)],
    ["challenge", chal([], [pt("apres_questionnaire", L(15, 11, 9, 11)), pt("declic_mindset", L(16, 11, 20, 0))]), L(16, 11, 20, 0)]] }),
  /* client passé par l'inscription gratuite (inscrit le 01/11, signé) : compte */
  farid: () => ({ id: FARID, prenom: "Farid", nom: "Signé", statut: "client", cree: L(1, 11, 10, 0), email: "farid@exemple.fr", donnees: [
    ["intake", intake(L(1, 11, 10, 10), "farid@exemple.fr"), L(1, 11, 10, 10)],
    ["challenge", chal([clic("accueil_accompagnement", L(2, 11, 11, 0), 2)], null, L(2, 11, 11, 5)), L(2, 11, 11, 5)],
    ["suivi_prospect", { version: 1, bilan_le: L(3, 11, 12, 0), issue: "signe", issue_le: L(9, 11, 12, 0), client_le: L(10, 11, 12, 0), note: "",
      historique: [{ type: "bilan", valeur: "reserve", le: L(3, 11, 12, 0) }, { type: "issue", valeur: "signe", le: L(9, 11, 12, 0), note: "" }] }, L(10, 11, 12, 0)]] }),
  /* client créé par le coach le 14/11 (questionnaire complet, poids) : jamais compté */
  gilles: () => ({ id: GILLES, prenom: "Gilles", nom: "Coaché", statut: "client", cree: L(14, 11, 10, 0), email: "gilles@exemple.fr", donnees: [
    ["intake", { nom: "Gilles Coaché", age: 41, sexe: "Homme", taille: 178, poids: 92.3, objectif: "Perte de poids / sèche", complet: true }, L(14, 11, 11, 0)]] }),
  /* les limites, à la seconde : inscrite le 11/11 à 23:59:59 (hors 7 j), questionnaire le 12/11 à 00:00:00 pile (7 j) ; clics
     le 11/11 à 23:59:59 et le 12/11 à 00:00:00 ; « Plus tard » (formation_commence_ici) le 19/10 à 23:59:59 (hors 30 j) et
     le 20/10 à 00:00:00 (30 j) */
  helene: () => ({ id: HELENE, prenom: "Hélène", nom: "Minuit", cree: L(11, 11, 23, 59, 59), email: "helene@exemple.fr", donnees: [
    ["intake", intake(L(12, 11, 0, 0), "helene@exemple.fr"), L(12, 11, 0, 0)],
    ["challenge", chal([clic("verrou_suivi", L(11, 11, 23, 59, 59)), clic("verrou_suivi", L(12, 11, 0, 0), 2)], [pt("formation_commence_ici", L(19, 10, 23, 59, 59)), pt("formation_commence_ici", L(20, 10, 0, 0))]), L(12, 11, 0, 0)]] }),
  /* inscrite le 27/09 à 23:59:59 (une seconde avant le 28/09), questionnaire, clic et case le 28/09 à 00:00:00 pile */
  ines: () => ({ id: INES, prenom: "Inès", nom: "Ouverture", cree: L(27, 9, 23, 59, 59), email: "ines@exemple.fr", donnees: [
    ["intake", intake(L(28, 9, 0, 0), "ines@exemple.fr"), L(28, 9, 0, 0)],
    ["challenge", chal([clic("verrou_journal", L(28, 9, 0, 0), 2)], null, L(28, 9, 0, 0)), L(28, 9, 0, 0)]] }),
  /* tout avant le 28/09 : son dernier clic n'a pas de source (carte : origine inconnue) */
  karim: () => ({ id: KARIM, prenom: "Karim", nom: "Vieux", cree: L(15, 9, 10, 0), email: "karim@exemple.fr", donnees: [
    ["challenge", chal([clic("verrou_programme", L(16, 9, 10, 0), 2), clic(undefined, L(17, 9, 10, 0), 3)]), L(17, 9, 10, 0)]] }),
  /* inscrit ce matin, rien d'autre */
  marc: () => ({ id: MARC, prenom: "Marc", nom: "Neuf", cree: L(18, 11, 9, 0), email: "marc@exemple.fr", donnees: [] }),
  /* prospect de test (« +TEST » en majuscules dans email_compte) : 3 clics depuis 3 écrans, un « Plus tard », sa case */
  tess: () => ({ id: TESS, prenom: "Tess", nom: "Essai", cree: L(16, 11, 8, 0), email: "tess+TEST@exemple.fr", donnees: [
    ["intake", intake(L(16, 11, 8, 10), "tess+TEST@exemple.fr"), L(16, 11, 8, 10)],
    ["challenge", chal([clic("apres_questionnaire", L(16, 11, 8, 11)), clic("verrou_journal", L(16, 11, 10, 0)), clic("declic_premiere_pesee", L(17, 11, 9, 0), 2)], [pt("declic_calculateur", L(16, 11, 9, 0))], L(17, 11, 9, 30)), L(17, 11, 9, 30)]] }),
  /* prospect de test par « email » (« +Test ») */
  ugo: () => ({ id: UGO, prenom: "Ugo", nom: "Essai", cree: L(17, 11, 10, 0), email: "ugo+test@exemple.fr", donnees: [
    ["intake", intake(L(17, 11, 10, 5), null, { email: "Ugo+Test@exemple.fr" }), L(17, 11, 10, 5)],
    ["challenge", chal([clic("accueil_haut", L(17, 11, 10, 6))]), L(17, 11, 10, 6)]] }),
  /* le compte de test de l'app (CONFIG.nouveautes.comptes_test), client passé par l'inscription, email ordinaire */
  x: () => ({ id: XID, prenom: "", nom: "", statut: "client", cree: L(17, 11, 11, 0), email: "essai.appli@exemple.fr", donnees: [
    ["intake", intake(L(17, 11, 11, 5), "essai.appli@exemple.fr"), L(17, 11, 11, 5)],
    ["challenge", chal([clic("verrou_suivi", L(17, 11, 11, 10))]), L(17, 11, 11, 10)]] }),
  /* données piégées : date objet, sources réservées ou non texte, email objet, case objet, questionnaire daté par un objet ;
     le DERNIER clic de la liste a une date objet et un code lisible (verrou_nutrition) : la carte ne doit pas le prendre pour
     le plus récent (ni en prenant le dernier de la liste, ni en comparant les dates comme du texte) */
  piege: () => ({ id: PIEGE, prenom: "Piège", nom: "Proto", cree: L(16, 11, 7, 0), email: "piege@exemple.fr", donnees: [
    ["intake", Object.assign({}, REP, { court_le: { $date: "2026-11-16" }, email_compte: { x: "@" }, email: "piege@exemple.fr", bilan_propose: { choix: "plus_tard", le: {} } }), L(16, 11, 7, 10)],
    ["challenge", { version: 1, jours: {}, reserve: { le: "x" }, cta: {
      clics: [clic("__proto__", L(16, 11, 10, 0)), clic("constructor", L(16, 11, 11, 0)), clic("accueil_haut", { $date: "2026-11-16T12:30:00Z" }), clic("hasOwnProperty", L(16, 11, 12, 0)), clic("verrou_nutrition", {})],
      plus_tard: [pt("__proto__", L(16, 11, 13, 0)), pt("prototype", L(16, 11, 13, 5)), pt({}, L(16, 11, 13, 10)), null, 7, "x", [pt("accueil_haut", L(16, 11, 13, 15))]] } }, L(16, 11, 13, 10)]] }),
  /* listes géantes : 3 000 entrées illisibles et 2 000 clics de 2025 avant un clic du 17/11 ; 5 000 « Plus tard » de 2025 */
  geant: () => {
    const cl = [];
    for (let i = 0; i < 3000; i++) cl.push([null, 1, "x", [], true][i % 5]);
    for (let i = 0; i < 2000; i++) cl.push(clic("accueil_haut", new Date(Date.UTC(2025, 0, 1, 10, 0, 0) + i * H).toISOString()));
    cl.push(clic("verrou_programme", L(17, 11, 7, 20)));
    const tard = []; for (let i = 0; i < 5000; i++) tard.push(pt("apres_questionnaire", new Date(Date.UTC(2025, 1, 1, 10, 0, 0) + i * MIN).toISOString()));
    return { id: GEANT, prenom: "Géant", nom: "Listes", cree: L(17, 11, 7, 0), email: "geant@exemple.fr", donnees: [
      ["intake", intake(L(17, 11, 7, 10), "geant@exemple.fr"), L(17, 11, 7, 10)],
      ["challenge", { version: 1, jours: {}, cta: { clics: cl, plus_tard: tard } }, L(17, 11, 7, 20)]] };
  },
  /* clé challenge en tableau ; cta.clics en objet, plus_tard en texte, case en nombre */
  biz: () => ({ id: BIZ, prenom: "Bizarre", nom: "Tableau", cree: L(17, 11, 6, 0), email: "biz@exemple.fr", donnees: [
    ["intake", intake(L(17, 11, 6, 5), "biz@exemple.fr"), L(17, 11, 6, 5)], ["challenge", [1, 2, 3], L(17, 11, 6, 6)]] }),
  biz2: () => ({ id: BIZ2, prenom: "Bizarre", nom: "Objet", cree: L(17, 11, 5, 0), email: "biz2@exemple.fr", donnees: [
    ["challenge", { version: 1, jours: {}, reserve: 42, cta: { clics: { a: clic("accueil_haut", L(17, 11, 5, 10)) }, plus_tard: "beaucoup" } }, L(17, 11, 5, 10)]] }),
  /* bloc J — les autres origines (brief L : « Toute autre origine trouvée est conservée, avec un code clair »), tout dans les
     7 derniers jours, liste PAS dans l'ordre des dates : « Modifier mes réponses » (reponses_haut, écrit par l'app), pages
     verrouillées Mon bilan et Mes compléments, l'ancien code du lien du coach (fiche-coach) et un « Plus tard » au nouveau
     (fiche_coach) : une seule ligne ; une page verrouillée inconnue à l'ancienne (verrou-recettes : le clic le plus récent,
     et un « Plus tard ») ; un code propre inconnu (bouton_mystere : affiché tel quel) ; sources illisibles : nombre, objet,
     majuscules, texte HTML, 41 caractères (clics) et nombre (« Plus tard ») → « ? » ; la case d'un ancien prospect du
     challenge (jours["7"].reserve, le 17/11) */
  olga: () => ({ id: OLGA, prenom: "Olga", nom: "Origines", cree: L(16, 11, 9, 0), email: "olga@exemple.fr", donnees: [
    ["intake", intake(L(16, 11, 9, 10), "olga@exemple.fr"), L(16, 11, 9, 10)],
    ["challenge", { version: 1, jours: { "7": { reserve: L(17, 11, 15, 0) } }, cta: {
      clics: [clic("verrou_bilan", L(16, 11, 12, 0)), clic("reponses_haut", L(16, 11, 11, 0)), clic("verrou-recettes", L(17, 11, 16, 0), 2), clic("fiche-coach", L(16, 11, 13, 0)),
        clic("verrou_complements", L(16, 11, 14, 0)), clic("bouton_mystere", L(16, 11, 15, 0)), clic(42, L(17, 11, 9, 0), 2), clic({ a: 1 }, L(17, 11, 9, 1), 2),
        clic("Accueil_Haut", L(17, 11, 9, 2), 2), clic("<b>x</b>", L(17, 11, 9, 3), 2), clic("a".repeat(41), L(17, 11, 9, 4), 2)],
      plus_tard: [pt("fiche_coach", L(16, 11, 13, 5)), pt(42, L(17, 11, 9, 5)), pt("verrou-recettes", L(17, 11, 16, 5))] } }, L(17, 11, 16, 5)]] }),
  /* bloc D, vrais clics : un nouveau prospect de test (« tina+test@… »), questionnaire validé le 17/11 (« Plus tard » sur la
     page du plan : l'app ouvre l'accueil), aucun clic, pas encore de clé challenge */
  tina: () => ({ id: TINA, prenom: "Tina", nom: "Essai", cree: L(17, 11, 14, 0), email: "tina+test@exemple.fr", donnees: [
    ["intake", intake(L(17, 11, 14, 10), "tina+test@exemple.fr", { bilan_propose: { choix: "plus_tard", le: L(17, 11, 14, 11) } }), L(17, 11, 14, 11)]] }),
  /* bloc K : 50 « Plus tard » déjà notés (mars 2025, une heure d'écart), un clic ; questionnaire validé SANS choix : l'app
     ouvre la page « Ton plan d'action » */
  paul: () => {
    const tard = []; for (let i = 0; i < 50; i++) tard.push(pt(i % 2 ? "declic_mindset" : "declic_calculateur", new Date(Date.UTC(2025, 2, 1, 10, 0, 0) + i * H).toISOString()));
    return { id: PAUL, prenom: "Paul", nom: "Cinquante", cree: L(17, 11, 9, 0), email: "paul@exemple.fr", donnees: [
      ["intake", intake(L(17, 11, 9, 10), "paul@exemple.fr"), L(17, 11, 9, 10)],
      ["challenge", { version: 1, jours: {}, cta: { clics: [clic("accueil_haut", L(17, 11, 9, 20))], plus_tard: tard } }, L(17, 11, 9, 20)]] };
  },
  /* bloc K : un « Plus tard » en base (calculateur, 17/11 09:00) ; questionnaire validé (l'accueil) */
  rita: () => ({ id: RITA, prenom: "Rita", nom: "Fusion", cree: L(17, 11, 8, 0), email: "rita@exemple.fr", donnees: [
    ["intake", intake(L(17, 11, 8, 10), "rita@exemple.fr", { bilan_propose: { choix: "plus_tard", le: L(17, 11, 8, 11) } }), L(17, 11, 8, 11)],
    ["challenge", { version: 1, jours: {}, cta: { clics: [], plus_tard: [pt("declic_calculateur", L(17, 11, 9, 0))] } }, L(17, 11, 9, 0)]] })
};
const PRINCIPAUX = ["anna", "bruno", "chloe", "david", "emma", "farid", "gilles", "helene", "ines", "karim", "marc", "tess", "ugo", "x"];
const PIEGES = ["piege", "geant", "biz", "biz2"];
/* le décor : fixtures (coach, Thomas, Sarah, Julien : clients créés par le coach) + les comptes demandés ; le coach a lui aussi
   un questionnaire, un clic, un « Plus tard » et sa case cette semaine, et il est « inscrit » le 17/11 : jamais compté */
function decor(noms){
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  profils.find(p => p.id === F.IDS.coach).cree_le = L(17, 11, 8, 0);
  const db = { profils, donnees: clone(F.donnees), emails_prospects: [], ecritures: [], refus: [], lectures: [], journal: [], chemins: [], fonctions: [], emails: {} };
  db.donnees.push({ user_id: F.IDS.coach, outil: "intake", contenu: intake(L(17, 11, 8, 10), "coach@exemple.fr"), maj_le: L(17, 11, 8, 10) });
  db.donnees.push({ user_id: F.IDS.coach, outil: "challenge", contenu: chal([clic("accueil_haut", L(17, 11, 9, 0))], [pt("declic_mindset", L(17, 11, 9, 5))], L(17, 11, 9, 10)), maj_le: L(17, 11, 9, 10) });
  for (const k of noms) {
    const x = C[k]();
    profils.push({ id: x.id, prenom: x.prenom, nom: x.nom || "", role: "client", statut: x.statut || "prospect", cree_le: x.cree });
    db.emails[x.id] = x.email;
    for (const [outil, contenu, maj] of x.donnees) db.donnees.push({ user_id: x.id, outil, contenu: clone(contenu), maj_le: maj });
  }
  db.photo = JSON.stringify({ p: db.profils, d: db.donnees });   // l'état de départ (rien ne doit changer)
  return db;
}
const intact = db => db.ecritures.length === 0 && db.refus.length === 0 && JSON.stringify({ p: db.profils, d: db.donnees }) === db.photo;
/* les profils et les données de tous les AUTRES comptes que uids inchangés */
const intactSauf = (db, uids) => { const x = JSON.parse(db.photo), hors = l => l.filter(d => !uids.includes(d.user_id));
  return JSON.stringify(x.p) === JSON.stringify(db.profils) && JSON.stringify(hors(x.d)) === JSON.stringify(hors(db.donnees)); };
const cleDe = (db, uid, outil) => (db.donnees.find(d => d.user_id === uid && d.outil === outil) || {}).contenu;
/* un clic (vrai) sur un bouton qui ouvre Calendly dans un nouvel onglet (repris de verif67) : l'adresse de l'onglet ouvert
   et ce que le faux Calendly a reçu ; puis le temps que le clic soit noté (Decouverte.clic : relecture, écriture après 700 ms) */
async function ouvrirCalendly(c, page, sel){
  const n0 = CAL_RECUS.length;
  if (!(await page.$(sel))) return { url: "", recus: [], absent: sel };   // bouton absent : la vérification échoue (sans interrompre le bloc)
  const [pop] = await Promise.all([c.waitForEvent("page", { timeout: 6000 }).catch(() => null), page.click(sel)]);
  let url = "";
  if (pop) { await pop.waitForLoadState("domcontentloaded", { timeout: 6000 }).catch(() => {}); url = pop.url(); await pop.close().catch(() => {}); }
  await attendre(page, 2300);
  return { url, recus: CAL_RECUS.slice(n0) };
}
const utm = u => { try { return new URL(u).searchParams.get("utm_content"); } catch (e) { return null; } };

/* ---------- les chiffres attendus (Nouveaux inscrits, Questionnaires terminés, Ont cliqué, Clics, Cases) ----------
   Horloge : 18/11 12:00. 7 j = depuis le 12/11 00:00 ; 30 j = depuis le 20/10 00:00 ; tout = depuis le 28/09 00:00.
   Comptés : Anna, Bruno, Chloé, David, Emma, Farid (client passé par l'inscription), Hélène, Inès, Karim, Marc.
   7 j  : inscrits Anna, Emma, Marc (pas Hélène, 23:59:59 la veille) ; questionnaires Anna, Emma, Hélène (12/11 00:00:00) ;
          clics Anna ×2, Bruno (verrou-programme), David (verrou_nutrition ; celui de demain non), Hélène (12/11 00:00:00) ;
          case Anna.
   30 j : + inscrits Bruno, Farid, Hélène ; questionnaires Bruno, Farid ; clics Bruno (bilan-propose), Chloé (20/10
          00:00:00 ; pas son « decouverte » de 23:59:59 la veille), Farid, Hélène (23:59:59 la veille du 12/11) ; cases Chloé
          (20/10 00:00:00), Farid ; « Plus tard » formation_commence_ici du 20/10 00:00:00 (pas celui de 23:59:59 la veille).
   tout : + inscrite Chloé (pas Inès, 27/09 23:59:59) ; questionnaires Chloé, Inès (28/09 00:00:00) ; clics Chloé
          (decouverte, sans source), Inès (28/09 00:00:00 ; pas celui de David, 27/09 23:59:59) ; case Inès (28/09 00:00:00) ;
          « Plus tard » d'avant la v62 de Chloé (bilan_propose seul) ; formation_commence_ici du 19/10 23:59:59. */
const EXP = {
  "7": { chiffres: [3, 3, 4, 5, 1], table: { apres_questionnaire: [1, 1], accueil_haut: [1, 0], verrou_programme: [1, 0], verrou_nutrition: [1, 0], verrou_suivi: [1, 0], declic_calculateur: [0, 1], declic_mindset: [0, 1] } },
  "30": { chiffres: [6, 5, 6, 9, 3], table: { apres_questionnaire: [2, 1], accueil_haut: [1, 0], accueil_accompagnement: [2, 0], verrou_programme: [1, 0], verrou_nutrition: [1, 0], verrou_suivi: [2, 0], declic_calculateur: [0, 1], declic_mindset: [0, 1], formation_commence_ici: [0, 1] } },
  tout: { chiffres: [7, 7, 7, 12, 4], table: { apres_questionnaire: [2, 2], accueil_haut: [2, 0], "?": [1, 0], accueil_accompagnement: [2, 0], verrou_programme: [1, 0], verrou_nutrition: [1, 0], verrou_suivi: [2, 0], verrou_journal: [1, 0], declic_calculateur: [0, 1], declic_mindset: [0, 1], formation_commence_ici: [0, 2] } }
};
/* les comptes de test (tout dans les 7 derniers jours) */
const D_TESS = { chiffres: [1, 1, 1, 3, 1], table: { apres_questionnaire: [1, 0], verrou_journal: [1, 0], declic_premiere_pesee: [1, 0], declic_calculateur: [0, 1] } };
const D_UGO = { chiffres: [1, 1, 1, 1, 0], table: { accueil_haut: [1, 0] } };
const D_X = { chiffres: [1, 1, 1, 1, 0], table: { verrou_suivi: [1, 0] } };
/* les comptes piégés (tout dans les 7 derniers jours) : Piège, inscrit, 3 clics et 3 « Plus tard » d'origine inconnue ;
   Géant, inscrit, questionnaire, 1 clic ; Bizarre (tableau), inscrit et questionnaire ; Bizarre (objet), inscrit */
const D_PIEGES = { chiffres: [4, 2, 2, 4, 0], table: { "?": [3, 3], verrou_programme: [1, 0] } };
/* bloc J : Olga, inscrite, questionnaire, 11 clics, 3 « Plus tard », sa case (jours["7"].reserve) ; ses deux codes inconnus */
const D_OLGA = { chiffres: [1, 1, 1, 11, 1], table: { reponses_haut: [1, 0], verrou_bilan: [1, 0], verrou_complements: [1, 0], fiche_coach: [1, 1], verrou_recettes: [1, 1], bouton_mystere: [1, 0], "?": [5, 1] } };
const NOMS_OLGA = { verrou_recettes: "page verrouillée « recettes »", bouton_mystere: "bouton_mystere" };
/* bloc D, vrais clics : Tina, inscrite, questionnaire (« Plus tard » de la page du plan d'avant la v62 : bilan_propose seul),
   ses 3 clics */
const D_TINA = { chiffres: [1, 1, 1, 3, 0], table: { accueil_haut: [1, 0], verrou_programme: [1, 0], verrou_journal: [1, 0], apres_questionnaire: [0, 1] } };
const LBL = ["Nouveaux inscrits", "Questionnaires terminés", "Ont cliqué au moins une fois", "Clics", "« J'ai déjà choisi mon créneau »"];
const CARTES = {
  [ANNA]: "2 (dernier : accueil, bouton du haut)", [BRUNO]: "2 (dernier : page verrouillée Mon programme)",
  [CHLOE]: "3 (dernier : accueil, carte « Ce que l'accompagnement ajoute »)", [DAVID]: "3 (dernier : page verrouillée Nutrition)",   // v63 : son clic daté de demain ignoré
  [EMMA]: "0", [HELENE]: "2 (dernier : page verrouillée Mon suivi)", [INES]: "1 (dernier : page verrouillée Mon journal)",
  [KARIM]: "2 (dernier : origine inconnue (avant la v50))", [MARC]: "0", [TESS]: "3 (dernier : invitation après la première pesée)",
  [UGO]: "1 (dernier : accueil, bouton du haut)"
};
/* captures seulement : la barre du haut (collante) et la barre du bas (fixe) cachées, pour voir le bloc entier */
const SANS_BARRES = ".topbar, .barre-bas { visibility: hidden !important; }";
const SANTE = /71[,.]4|1\s?873|83[,.]5|92[,.]3|\bkcal\b|\bkg\b|\bpoids\b|\btaille\b|mensuration|calorie|\bIMC\b/i;

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF69_PORT=9851 node verif69.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();
  URL0 = `http://localhost:${PORT}/`;

  /* =================== A. place et forme du bloc =================== */
  await bloc("A. place et forme", async () => {
    ok("A : le compte de test est lu dans le fichier servi (CONFIG.nouveautes.comptes_test)", !!TEST_ID, String(TEST_ID));
    const db = decor(PRINCIPAUX);
    const { page } = await coachSur(b, db, "#/prospects", "#pr-mesure-chiffres");
    const place = await page.evaluate(() => {
      const n = s => String(s || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
      const B = document.querySelector("#pr-mesure"), av = B && B.previousElementSibling, ap = B && B.nextElementSibling;
      return { avant: av ? Array.from(av.querySelectorAll(".tile .t-lbl")).map(e => n(e.textContent)) : [], apres: !!(ap && ap.querySelector(".sc-filtres") && ap.querySelector("#pr-liste")),
               dansVue: !!(B && B.closest("#pr-vue")), panneau: !!(B && B.tagName === "SECTION" && B.classList.contains("panel")) };
    });
    ok("A : section.panel#pr-mesure juste après les 4 tuiles (À traiter, Signés, Perdus, Absents) et juste avant les filtres et la liste",
      place.panneau && place.dansVue && egal(place.avant, ["À traiter", "Signés", "Perdus", "Absents"]) && place.apres, JSON.stringify(place));
    const M = await lireMesure(page);
    ok("A : « Mesure » et le sélecteur de période : « 7 derniers jours » (7, choisi par défaut), « 30 derniers jours » (30), « Depuis le 28/09/2026 » (tout)",
      !!M && M.h2 === "Mesure" && M.periode === "7" && egal(M.options, [["7", "7 derniers jours"], ["30", "30 derniers jours"], ["tout", "Depuis le 28/09/2026"]]),
      M ? JSON.stringify([M.h2, M.periode, M.options]) : "bloc absent");
    ok("A : 5 tuiles dans div.tiles#pr-mesure-chiffres, dans l'ordre : " + LBL.join(" / "),
      !!M && egal(M.tuiles.map(t => t[0]), LBL) && M.tuiles.every(t => /^\d+$/.test(t[1])), M ? JSON.stringify(M.tuiles) : "");
    ok("A : « Clics par écran » : table.pr-mesure-t#pr-mesure-table (Écran, Clics, Plus tard), une ligne tr[data-origine] par écran",
      !!M && M.h3 === "Clics par écran" && M.tableCls === "TABLE.pr-mesure-t" && egal(M.entetes, ["Écran", "Clics", "Plus tard"]) && !!M.lignes && M.lignes.length > 0 && M.lignes.every(r => !!r[0]),
      M ? JSON.stringify([M.h3, M.tableCls, M.entetes]) : "");
    ok("A : case #pr-mesure-test « Inclure les comptes de test », décochée par défaut", !!M && M.test === false && M.testLbl === "Inclure les comptes de test", M ? JSON.stringify([M.test, M.testLbl]) : "");
    ok("A : aucune écriture, aucune donnée changée (clients compris)", intact(db), resume(db));
  });

  /* =================== B. les 3 périodes, chiffres et tableau exacts =================== */
  await bloc("B. périodes", async () => {
    const db = decor(PRINCIPAUX);
    const { page } = await coachSur(b, db, "#/prospects", "#pr-mesure-chiffres");
    const debuts = await page.evaluate(() => { const p0 = Mesure.periode, r = {}; for (const p of ["7", "30", "tout"]) { Mesure.periode = p; r[p] = new Date(Mesure.debut()).toISOString(); } Mesure.periode = p0; return r; });
    ok("B : début des périodes (heure locale) : 7 j = 12/11 00:00 (minuit il y a 6 jours), 30 j = 20/10 00:00 (minuit il y a 29 jours), tout = 28/09/2026 00:00",
      egal(debuts, { "7": L(12, 11, 0, 0), "30": L(20, 10, 0, 0), tout: L(28, 9, 0, 0) }), JSON.stringify(debuts));
    const m7 = await lireMesure(page);
    ok("B : 7 derniers jours : " + EXP["7"].chiffres.join(" / ") + " (inscrits, questionnaires, cliqueurs, clics, cases ; 12/11 à 00:00:00 compté, 11/11 à 23:59:59 non, clic de demain non)",
      !!m7 && m7.periode === "7" && chiffres(m7) === EXP["7"].chiffres.join(","), detail(m7));
    ok("B : 7 j, tableau exact (7 lignes, somme des clics = tuile « Clics ») : page du plan 1 clic / 1 « Plus tard » (Emma, noté des deux façons : une fois), accueil haut 1, Mon programme 1 (ancien code), Nutrition 1, Mon suivi 1, invitations calculateur et Mindset 0 / 1",
      !!m7 && memeTable(m7, EXP["7"].table), detail(m7));
    ok("B : 7 j, noms en clair (Decouverte.ORIGINES) et tri par clics décroissants, puis « Plus tard »", nomsOk(m7) && trie(m7), detail(m7));
    await periode(page, "30");
    const m30 = await lireMesure(page);
    ok("B : 30 derniers jours : " + EXP["30"].chiffres.join(" / ") + " (client passé par l'inscription compté, client créé par le coach jamais)",
      !!m30 && m30.periode === "30" && chiffres(m30) === EXP["30"].chiffres.join(","), detail(m30));
    ok("B : 30 j, tableau exact (9 lignes, somme = tuile) : page du plan 2 / 1 (bilan-propose compté avec apres_questionnaire), carte accompagnement 2 (decouverte-accompagnement du 20/10 à 00:00:00 + nouveau code), Mon suivi 2, « Commence ici » 0 / 1 (le 20/10 à 00:00:00, pas 23:59:59 la veille), accueil haut 1 (pas le « decouverte » de 23:59:59 la veille)",
      !!m30 && memeTable(m30, EXP["30"].table), detail(m30));
    ok("B : 30 j, noms en clair et tri", nomsOk(m30) && trie(m30), detail(m30));
    await periode(page, "tout");
    const mt = await lireMesure(page);
    ok("B : depuis le 28/09/2026 : " + EXP.tout.chiffres.join(" / ") + " (inscrite le 27/09 à 23:59:59 non comptée, son questionnaire, son clic et sa case du 28/09 à 00:00:00 oui)",
      !!mt && mt.periode === "tout" && chiffres(mt) === EXP.tout.chiffres.join(","), detail(mt));
    ok("B : depuis le 28/09, tableau exact (11 lignes, somme = tuile) : page du plan 2 / 2 (« Plus tard » d'avant la v62 compté), accueil haut 2 (decouverte), « origine inconnue (avant la v50) » 1 (clic sans source), Mon journal 1 (28/09 à 00:00:00), « Commence ici » 0 / 2 ; clic du 27/09 à 23:59:59 non compté",
      !!mt && memeTable(mt, EXP.tout.table), detail(mt));
    ok("B : depuis le 28/09, noms en clair (dont « origine inconnue (avant la v50) », data-origine=\"?\") et tri", nomsOk(mt) && trie(mt) && !!mt.lignes.find(r => r[0] === "?"), detail(mt));
    ok("B : aucun ancien code affiché comme un écran à part (bilan-propose, decouverte, decouverte-accompagnement, verrou-programme), aux 3 périodes",
      [m7, m30, mt].every(M => !!M && !!M.lignes && M.lignes.length > 0 && M.lignes.every(r => !["bilan-propose", "decouverte", "decouverte-accompagnement", "verrou-programme"].includes(r[0]) && !/bilan-propose|decouverte-|verrou-/.test(r[1]))),
      [m7, m30, mt].map(detail).join(" | "));
    await periode(page, "7");
    const m7b = await lireMesure(page);
    ok("B : retour à 7 jours : de nouveau les chiffres et le tableau des 7 jours", conforme(m7b, EXP["7"], "7"), detail(m7b));
    const fP = await page.evaluate(() => document.activeElement && document.activeElement.id);
    await page.focus("#pr-mesure-test"); await page.keyboard.press("Space"); await attendre(page, 250);
    const fT = await page.evaluate(() => { const a = document.activeElement, c = document.querySelector("#pr-mesure-test"); return { id: a && a.id, meme: !!c && a === c, coche: !!c && c.checked }; });
    await page.keyboard.press("Space"); await attendre(page, 250);
    const fT2 = await page.evaluate(() => { const a = document.activeElement, c = document.querySelector("#pr-mesure-test"); return { id: a && a.id, meme: !!c && a === c, coche: !!c && c.checked }; });
    const m7c = await lireMesure(page);
    ok("B : clavier : le sélecteur de période garde le focus après un changement (bloc redessiné), la case aussi (Espace la coche puis la décoche, le focus reste dessus) ; de nouveau les chiffres des 7 jours",
      fP === "pr-mesure-periode" && fT.meme && fT.coche && fT2.meme && !fT2.coche && conforme(m7c, EXP["7"], "7"), JSON.stringify([fP, fT, fT2]) + " " + detail(m7c));
  });

  /* =================== C. exclusions (coach, +test, compte de test de l'app) et case =================== */
  await bloc("C. exclusions", async () => {
    const db = decor(PRINCIPAUX);
    const { page } = await coachSur(b, db, "#/prospects", "#pr-mesure-chiffres");
    const exclus = await page.evaluate(() => outilProspects.lignes.filter(l => Mesure.estTest(l)).map(l => l.p.id).sort());
    ok("C : comptes de test reconnus : « tess+TEST@… » (email_compte, majuscules), « Ugo+Test@… » (email), le compte de CONFIG.nouveautes.comptes_test ; aucun autre",
      egal(exclus, [TESS, UGO, XID].sort()), JSON.stringify(exclus));
    const ids = await page.evaluate(() => { const a = Mesure.avecTest, r = {}; Mesure.avecTest = false; r.sans = Mesure.comptes(outilProspects.lignes).map(l => l.p.id).sort(); Mesure.avecTest = true; r.avec = Mesure.comptes(outilProspects.lignes).map(l => l.p.id).sort();
      r.coach = Mesure.comptes([{ p: { id: "coach", role: "coach", statut: "prospect", cree_le: new Date().toISOString() }, ch: { cta: { clics: [{ source: "accueil_haut", date: new Date().toISOString() }] } }, dc: { court_le: new Date().toISOString(), email: "coach@exemple.fr" } }]).length; Mesure.avecTest = a; return r; });
    const base = [ANNA, BRUNO, CHLOE, DAVID, EMMA, FARID, HELENE, INES, KARIM, MARC].sort();
    ok("C : comptes pris en compte : prospects et client passé par l'inscription (Farid), jamais le client créé par le coach (Gilles), ni Thomas / Sarah / Julien, ni le coach (même case cochée) ; case cochée : + les 3 comptes de test",
      egal(ids.sans, base) && egal(ids.avec, base.concat([TESS, UGO, XID]).sort()) && ids.coach === 0, JSON.stringify(ids));
    /* brief L : « Aucun email écrit en dur dans le code » — ni dans le bloc Mesure (toutes ses fonctions, dont estTest), ni dans
       la ligne des cartes ; les comptes de test de l'app sont des identifiants */
    const dur = await page.evaluate(() => {
      const fns = Object.keys(Mesure).filter(k => typeof Mesure[k] === "function"), code = fns.map(k => String(Mesure[k])).join("\n") + "\n" + String(Commercial.clicsTexte);
      const ids = (CONFIG.nouveautes && CONFIG.nouveautes.comptes_test) || [];
      return { fns, arobase: (code.match(/[^\s"'`]*@[^\s"'`]*/g) || []).slice(0, 3), plusTest: /\+test/.test(String(Mesure.estTest)), ids: Array.isArray(ids) ? ids.map(String) : String(ids) };
    });
    ok("C : aucun email écrit en dur (brief L) : pas un « @ » dans le code du bloc Mesure (" + dur.fns.length + " fonctions, dont estTest : le motif « +test ») ni dans la ligne des cartes ; CONFIG.nouveautes.comptes_test : des identifiants seulement",
      ["estTest", "comptes", "calcul", "html", "monter"].every(f => dur.fns.includes(f)) && dur.arobase.length === 0 && dur.plusTest && Array.isArray(dur.ids) && dur.ids.length > 0 && dur.ids.every(x => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(x)),
      JSON.stringify(dur));
    const m0 = await lireMesure(page);
    ok("C : case décochée : les chiffres des 7 jours sans les comptes de test ni le coach ; « Exclus : ton compte et 3 comptes de test »",
      conforme(m0, EXP["7"], "7") && m0.test === false && /Exclus : ton compte et 3 comptes de test\b/.test(m0.note), detail(m0) + " " + (m0 ? m0.note : ""));
    await caseTest(page);
    const E7 = plus(EXP["7"], D_TESS, D_UGO, D_X), E30 = plus(EXP["30"], D_TESS, D_UGO, D_X), Et = plus(EXP.tout, D_TESS, D_UGO, D_X);
    const m1 = await lireMesure(page);
    ok("C : case cochée, 7 j : " + E7.chiffres.join(" / ") + " (les 3 comptes de test comptent ; toujours pas le coach), « Comptes de test inclus »",
      !!m1 && m1.test === true && chiffres(m1) === E7.chiffres.join(",") && /Comptes de test inclus/.test(m1.note), detail(m1) + " " + (m1 ? m1.note : ""));
    ok("C : case cochée, 7 j, tableau exact (page du plan 2, accueil haut 2, Mon suivi 2, Mon journal 1, première pesée 1, calculateur 0 / 2), noms et tri", conforme(m1, E7, "7"), detail(m1));
    await periode(page, "30");
    const m2 = await lireMesure(page);
    ok("C : case cochée puis 30 j : la case reste cochée, " + E30.chiffres.join(" / ") + ", tableau exact", !!m2 && m2.test === true && conforme(m2, E30, "30"), detail(m2));
    await periode(page, "tout");
    const m3 = await lireMesure(page);
    ok("C : case cochée, depuis le 28/09 : " + Et.chiffres.join(" / ") + ", tableau exact", !!m3 && m3.test === true && conforme(m3, Et, "tout"), detail(m3));
    await caseTest(page);
    const m4 = await lireMesure(page);
    ok("C : case décochée de nouveau (période gardée : depuis le 28/09) : " + EXP.tout.chiffres.join(" / ") + ", tableau sans les comptes de test",
      !!m4 && m4.test === false && conforme(m4, EXP.tout, "tout"), detail(m4));
    ok("C : aucune écriture, aucune donnée changée", intact(db), resume(db));
  });

  /* =================== D. brief L, « FAIT QUAND » : 3 clics d'un prospect de test, 3 écrans =================== */
  await bloc("D. fait quand", async () => {
    const db = decor(PRINCIPAUX.filter(k => k !== "ugo" && k !== "x"));   // Tess, seul compte de test
    const { page } = await coachSur(b, db, "#/prospects", "#pr-mesure-chiffres");
    const n0 = db.chemins.length;
    const m0 = await lireMesure(page);
    ok("D : case décochée : chiffres et tableau des 7 jours sans Tess (ni Mon journal, ni première pesée)", conforme(m0, EXP["7"], "7"), detail(m0));
    await caseTest(page);
    const m1 = await lireMesure(page), t0 = tableau(m0) || {}, t1 = tableau(m1) || {};
    const delta = {}; new Set(Object.keys(t0).concat(Object.keys(t1))).forEach(k => { const a = t0[k] || [0, 0], z = t1[k] || [0, 0]; if (a[0] !== z[0] || a[1] !== z[1]) delta[k] = [z[0] - a[0], z[1] - a[1]]; });
    const ligne = (M, k) => (M && M.lignes || []).find(r => r[0] === k) || [];
    ok("D : case cochée : ses 3 clics apparaissent avec leurs origines (+1 page du plan, +1 « page verrouillée Mon journal », +1 « invitation après la première pesée ») et son « Plus tard » (calculateur), rien d'autre",
      egal(delta, { apres_questionnaire: [1, 0], declic_calculateur: [0, 1], declic_premiere_pesee: [1, 0], verrou_journal: [1, 0] }) && ligne(m1, "verrou_journal")[1] === NOMS.verrou_journal && ligne(m1, "declic_premiere_pesee")[1] === NOMS.declic_premiere_pesee,
      JSON.stringify(delta) + " " + detail(m1));
    ok("D : case cochée : 7 j " + plus(EXP["7"], D_TESS).chiffres.join(" / ") + " (clics 5 → 8, cliqueurs 4 → 5, inscrits, questionnaires et cases +1)", conforme(m1, plus(EXP["7"], D_TESS), "7") && m1.test === true, detail(m1));
    await caseTest(page);
    const m2 = await lireMesure(page);
    ok("D : case décochée : ils disparaissent des chiffres (de nouveau " + EXP["7"].chiffres.join(" / ") + ", plus de ligne Mon journal ni première pesée)",
      conforme(m2, EXP["7"], "7") && m2.test === false && !tableau(m2).verrou_journal && !tableau(m2).declic_premiere_pesee, detail(m2));
    ok("D : aucune requête en cochant / décochant, aucune écriture", db.chemins.length === n0 && intact(db), JSON.stringify(db.chemins.slice(n0)) + " " + resume(db));
  });

  /* =================== D. « FAIT QUAND » de bout en bout : 3 vrais clics d'un prospect de test, puis le coach =================== */
  await bloc("D. fait quand, 3 vrais clics", async () => {
    const db = decor(PRINCIPAUX.filter(k => !["tess", "ugo", "x"].includes(k)).concat(["tina"]));   // Tina, seul compte de test
    const T = await contexte(b, qui(TINA, "tina+test@exemple.fr"), db, { viewport: MOBILE });
    await T.page.goto(URL0); await pret(T.page, "#dc-accomp");
    const vus = [["accueil_haut", await ouvrirCalendly(T.c, T.page, '#vue header.masthead [data-dc-cal="accueil_haut"]')]];
    await aller(T.page, "#/programme", 1800);
    vus.push(["verrou_programme", await ouvrirCalendly(T.c, T.page, "#vue .verrou a[target=_blank]")]);
    await aller(T.page, "#/journal", 1800);
    vus.push(["verrou_journal", await ouvrirCalendly(T.c, T.page, "#vue .verrou a[target=_blank]")]);
    CAL_ATTENDUS += 3;
    ok("D (vrais clics) : un nouveau prospect de test (« tina+test@… ») clique « Récupérer mon plan d'action » depuis 3 écrans (accueil, #/programme, #/journal) : chaque onglet ouvert reçoit le lien Calendly avec le bon utm_content (accueil_haut, verrou_programme, verrou_journal)",
      vus.every(([code, o]) => o.url.startsWith("https://calendly.com/") && o.recus.length === 1 && o.recus[0] === o.url && utm(o.url) === code), JSON.stringify(vus.map(([k, o]) => [k, utm(o.url), o.recus.length, o.absent || ""])));
    const cl = ((cleDe(db, TINA, "challenge") || {}).cta || {}).clics || [];
    ok("D (vrais clics) : ses 3 clics notés en base, avec leurs origines, dans l'ordre (challenge.cta.clics : accueil_haut, verrou_programme, verrou_journal, datés de maintenant) ; rien d'autre changé, pour personne",
      egal(cl.map(x => x && x.source), ["accueil_haut", "verrou_programme", "verrou_journal"]) && cl.every(x => typeof x.date === "string" && Math.abs(Date.parse(x.date) - T0) < 5 * MIN)
      && db.refus.length === 0 && db.ecritures.every(e => e.table === "donnees" && e.user_id === TINA && ["challenge", "activite"].includes(e.outil)) && intactSauf(db, [TINA]), JSON.stringify(cl) + " " + resume(db));
    const e0 = db.ecritures.length, c0 = CAL_RECUS.length;
    const { page } = await coachSur(b, db, "#/prospects", "#pr-mesure-chiffres");
    const m0 = await lireMesure(page);
    ok("D (vrais clics) : le coach, case décochée : chiffres et tableau des 7 jours sans Tina", conforme(m0, EXP["7"], "7") && m0.test === false, detail(m0));
    await caseTest(page);
    const m1 = await lireMesure(page), E1 = plus(EXP["7"], D_TINA);
    ok("D (vrais clics) : case cochée : ses 3 clics apparaissent avec les bonnes origines (accueil haut 1 → 2, Mon programme 1 → 2, Mon journal 0 → 1 ; et son « Plus tard » de la page du plan), 7 j " + E1.chiffres.join(" / "),
      conforme(m1, E1, "7") && m1.test === true, detail(m1));
    await caseTest(page);
    const m2 = await lireMesure(page);
    ok("D (vrais clics) : case décochée : ils disparaissent des chiffres (de nouveau " + EXP["7"].chiffres.join(" / ") + ", plus de ligne Mon journal)",
      conforme(m2, EXP["7"], "7") && m2.test === false && !tableau(m2).verrou_journal, detail(m2));
    await tous(page);
    const k = await clicsCartes(page);
    ok("D (vrais clics) : sa carte « 3 (dernier : page verrouillée Mon journal) » ; côté coach, aucune écriture ni aucun lien Calendly ouvert",
      !!k[TINA] && k[TINA].v === "3 (dernier : page verrouillée Mon journal)" && db.ecritures.length === e0 && CAL_RECUS.length === c0, JSON.stringify(k[TINA]) + " " + JSON.stringify(db.ecritures.slice(e0).map(e => e.table + ":" + (e.outil || "") + ":" + e.m)));
  });

  /* =================== E. la ligne « Clics plan d'action » de chaque carte =================== */
  await bloc("E. cartes", async () => {
    const db = decor(PRINCIPAUX);
    const { page } = await coachSur(b, db, "#/prospects", "#pr-mesure-chiffres");
    await tous(page);
    const k = await clicsCartes(page);
    const vus = Object.keys(k).sort(), attendus = Object.keys(CARTES).sort();
    ok("E : chaque carte de prospect a sa ligne « Clics plan d'action » (11 cartes ; aucune pour les clients)", egal(vus, attendus) && vus.every(u => k[u].v !== null), JSON.stringify(vus.map(u => [u.slice(-2), k[u].v])));
    ok("E : « Clics plan d'action » en dernière ligne de ul.sc-faits, après « Dernière connexion »", vus.length > 0 && vus.every(u => k[u].rang === k[u].n - 1 && k[u].avant === "Dernière connexion"), JSON.stringify(vus.map(u => [u.slice(-2), k[u].rang, k[u].n, k[u].avant])));
    ok("E : « 0 » sans clic (Emma, Marc)", k[EMMA] && k[EMMA].v === "0" && k[MARC] && k[MARC].v === "0", JSON.stringify([k[EMMA], k[MARC]]));
    const faux = attendus.filter(u => u !== EMMA && u !== MARC && (!k[u] || k[u].v !== CARTES[u]));
    ok("E : « N (dernier : <écran du clic le plus récent>) » exacts : anciens codes en clair (Bruno, Chloé), le plus récent et pas le dernier de la liste (Bruno : le plus récent en premier), un clic daté de demain ignoré (v63 : David, « page verrouillée Nutrition », son clic du 17/11, pas celui de demain), origine inconnue (Karim), comptes de test compris (Tess, Ugo)",
      faux.length === 0, JSON.stringify(faux.map(u => [u.slice(-2), k[u] && k[u].v, CARTES[u]])));
    const tiret = await page.evaluate(() => { try { return Commercial.clicsTexte({ get cta(){ throw new Error("piège"); } }); } catch (e) { return "ERREUR " + e.message; } });
    ok("E : un calcul qui plante (clé piégée) donne « — » sans erreur", tiret === "—", tiret);
    ok("E : aucune écriture", intact(db), resume(db));
  });
  /* v63 (lot 4) : l'export CSV (« Dernier clic ») prend, comme la carte, le clic le plus récent PAR DATE : pour chaque
     prospect, la carte et le CSV désignent le MÊME clic (Bruno : le plus récent en premier dans la liste ; Piège : le dernier
     de la liste et un autre datés par un objet ; David : son clic daté de demain ignoré — plus de 5 min dans le futur, règle
     de la v63 —, le dernier est celui du 17/11) */
  await bloc("E. CSV « Dernier clic » et cartes", async () => {
    const db = decor(PRINCIPAUX.concat(["piege"]));
    const { page } = await coachSur(b, db, "#/prospects", "#pr-mesure-chiffres");
    await tous(page);
    const k = await clicsCartes(page);
    const Lc = lireCSV((await exporter(page)).replace(/^﻿/, "")), tete = Lc[0] || [];
    const iN = tete.indexOf("Clics « Récupérer mon plan d'action »"), iD = tete.indexOf("Dernier clic");
    const csv = nom => { const l = Lc.find(x => x[0] === nom) || []; return [l[iN], l[iD]]; };
    const ATT = { "Anna Tôt": ["2", "16/11/2026"], "Bruno Ancien": ["2", "14/11/2026"], "Chloé Octobre": ["3", "20/10/2026"], "David Septembre": ["3", "17/11/2026"],
      "Emma Plus-Tard": ["0", ""], "Hélène Minuit": ["2", "12/11/2026"], "Inès Ouverture": ["1", "28/09/2026"], "Karim Vieux": ["2", "17/09/2026"], "Marc Neuf": ["0", ""],
      "Tess Essai": ["3", "17/11/2026"], "Ugo Essai": ["1", "17/11/2026"], "Piège Proto": ["5", "16/11/2026"] };
    const fauxCsv = Object.keys(ATT).filter(n => !egal(csv(n), ATT[n]));
    ok("E : export CSV (v63) : « Dernier clic » = la date du clic le plus récent, pas du dernier de la liste : Bruno 14/11/2026 (le plus récent en premier ; pas 25/10/2026), Piège 16/11/2026 (le dernier de la liste et un autre datés par un objet : ignorés), David 17/11/2026 (son clic daté de demain, 19/11, ignoré, comme sur la carte), Chloé, Karim… ; sans clic : vide ; une ligne par prospect (12)",
      iN > -1 && iD === iN + 1 && Lc.length === 13 && fauxCsv.length === 0, JSON.stringify(fauxCsv.map(n => [n, csv(n), ATT[n]])) + " · " + Lc.length + " lignes");
    /* pour chaque prospect : l'écran nommé par sa carte (« N (dernier : <écran>) ») est celui d'un de ses clics daté du jour du
       « Dernier clic » du CSV, et la carte et le CSV comptent autant de clics ; sans clic : « 0 » et vide */
    const memes = [];
    for (const p of db.profils.filter(x => x.statut === "prospect" && x.role === "client")) {
      const nom = (p.prenom + " " + p.nom).trim(), [n, d] = csv(nom), ch = cleDe(db, p.id, "challenge") || {};
      const cl = ch.cta && Array.isArray(ch.cta.clics) ? ch.cta.clics : [], v = k[p.id] ? k[p.id].v : null, m = /^(\d+) \(dernier : (.*)\)$/.exec(v || "");
      if (!cl.length) { memes.push([nom, v === "0" && n === "0" && d === "", v, n, d]); continue; }
      const du = cl.filter(c => c && typeof c.date === "string" && /^\d{4}-\d{2}-\d{2}/.test(c.date) && frL(c.date) === d).map(c => c.source === undefined ? null : c.source);
      const ecrans = await page.evaluate(l => l.map(s => Decouverte.nomOrigine(s) || "origine inconnue (avant la v50)"), du);
      memes.push([nom, !!m && +m[1] === cl.length && n === m[1] && ecrans.includes(m[2]), v, n, d, ecrans]);
    }
    ok("E : la carte « Clics plan d'action » et le CSV désignent le MÊME clic pour chaque prospect (v63) : l'écran nommé par la carte est celui d'un clic daté du « Dernier clic » du CSV, même nombre de clics (Bruno : page verrouillée Mon programme, 14/11/2026 ; Piège : origine inconnue, 16/11/2026 ; David : page verrouillée Nutrition, 17/11/2026, pas son clic de demain) ; aucune écriture",
      memes.length === 12 && memes.every(x => x[1]) && intact(db), JSON.stringify(memes.filter(x => !x[1])) + " · " + memes.length + " " + resume(db));
  });

  /* =================== F. période vide =================== */
  await bloc("F. période vide", async () => {
    const db = decor(["chloe", "farid"]);   // rien dans les 7 derniers jours
    const { page } = await coachSur(b, db, "#/prospects", "#pr-mesure-chiffres");
    const m0 = await lireMesure(page);
    ok("F : 7 j sans clic ni « Plus tard » : p#pr-mesure-vide « Aucun clic ni « Plus tard » sur cette période. », pas de tableau, tuiles à 0",
      !!m0 && m0.vide === "P:Aucun clic ni « Plus tard » sur cette période." && m0.lignes === null && chiffres(m0) === "0,0,0,0,0" && egal(m0.tuiles.map(t => t[0]), LBL), detail(m0));
    await periode(page, "30");
    const m1 = await lireMesure(page);
    ok("F : 30 j : le tableau revient (carte accompagnement 2 clics), plus de message ; 1 / 1 / 2 / 2 / 2 (Farid inscrit le 01/11, Chloé le 05/10)",
      !!m1 && m1.vide === null && memeTable(m1, { accueil_accompagnement: [2, 0] }) && chiffres(m1) === "1,1,2,2,2", detail(m1));
    ok("F : aucune écriture", intact(db), resume(db));
  });

  /* =================== G. ni santé ni email ; rien lu ni écrit en plus =================== */
  await bloc("G. santé, email, lectures", async () => {
    const db = decor(PRINCIPAUX);
    const { page } = await coachSur(b, db, "#/prospects", "#pr-mesure-chiffres");
    const vus = [];
    const n0 = db.chemins.length, l0 = db.lectures.length;
    for (const p of ["7", "30", "tout"]) { await periode(page, p); vus.push(await lireMesure(page)); }
    await caseTest(page);
    for (const p of ["tout", "30", "7"]) { await periode(page, p); vus.push(await lireMesure(page)); }
    const n1 = db.chemins.length;
    const EMAIL = /@|exemple\.fr|[a-z0-9._-]\+test/i;   // « email avec « +test » » (la note) n'est pas une adresse
    ok("G : aucun email dans le bloc (ni « @ », ni adresse, ni « nom+test »), aux 3 périodes, case cochée ou non",
      vus.length === 6 && vus.every(M => !!M && !EMAIL.test(M.texte) && !EMAIL.test(M.html)), vus.map(M => M ? (EMAIL.exec(M.texte + " " + M.html) || ["—"])[0] : "absent").join(" | "));
    ok("G : aucune donnée de santé dans le bloc (poids 71,4 / 92,3, 1 873 kcal, tour 83,5, kg, poids, taille, mensurations, calories, IMC)",
      vus.every(M => !!M && !SANTE.test(M.texte) && !SANTE.test(M.html)), vus.map(M => M ? (SANTE.exec(M.texte + " " + M.html) || [""])[0] : "absent").join(","));
    ok("G : changer de période ou cocher la case : aucune requête (ni lecture ni écriture)", n1 === n0 && db.lectures.length === l0, JSON.stringify(db.chemins.slice(n0)));
    const plusLu = luEnPlus(db, 0), groupees = db.lectures.filter(l => !l.uid && l.outil === GROUPEE).length;
    ok("G : rien n'est lu en plus pour le bloc : la lecture groupée de la page (" + groupees + ") et les clés du coach seulement, aucune clé d'un prospect lue à part (intake, challenge…)",
      groupees === 1 && plusLu.length === 0, JSON.stringify(plusLu.slice(0, 6)));
    ok("G : rien n'est écrit (ni données, ni profils, ni fonctions), données de tous inchangées", intact(db) && db.fonctions.length === 0, resume(db));
  });

  /* =================== H. affichage : 390 px sombre, 320 px, ordinateur clair =================== */
  await bloc("H. affichage", async () => {
    const db = decor(PRINCIPAUX);
    if (CAPT) fs.mkdirSync(CAPT, { recursive: true });
    const tel = await coachSur(b, db, "#/prospects", "#pr-mesure-chiffres", { viewport: MOBILE });
    await periode(tel.page, "tout");
    const g1 = await geo(tel.page), c1 = await lisible(tel.page, TEXTE_BLOC), a1 = await absentes(tel.page), m1 = await lireMesure(tel.page);
    ok("H : téléphone 390 px, thème sombre : rien ne déborde (page, bloc, tableau, 5 tuiles et leur texte, sélecteur), aucune cellule coupée",
      !!g1 && g1.theme === null && !g1.deborde && g1.blocOk && g1.tableOk && g1.tuilesOk && g1.selectOk && g1.cellules === 0 && g1.texteTuiles.length === 0, JSON.stringify(g1));
    ok("H : 390 px sombre : tout le texte du bloc lisible sur fond sombre (contraste ≥ 4,5 : titre, sélecteur, chiffres des tuiles, cellules, case ; ≥ 3 pour le texte secondaire de l'app au jeton --ink-3, exceptions nommées comme verif66 : libellés des tuiles, « Clics par écran », en-têtes, notes), chiffres exacts (depuis le 28/09)",
      a1.length === 0 && c1.length > 20 && c1.every(x => x.ratio >= seuil(x) && x.fondClair === false) && conforme(m1, EXP.tout, "tout"),
      JSON.stringify(a1) + " " + JSON.stringify(c1.filter(x => !(x.ratio >= seuil(x) && x.fondClair === false)).slice(0, 5)) + " exceptions " + c1.filter(x => x.exc).length + " " + detail(m1));
    if (CAPT) await tel.page.locator("#pr-mesure").screenshot({ path: path.join(CAPT, "mesure-390-sombre.png"), style: SANS_BARRES }).catch(e => console.log("capture 390 : " + e.message));
    const et = await coachSur(b, db, "#/prospects", "#pr-mesure-chiffres", { viewport: ETROIT });
    await periode(et.page, "tout"); await caseTest(et.page);
    const g2 = await geo(et.page);
    ok("H : 320 px (case cochée, tableau le plus long) : rien ne déborde (page, bloc, tableau, 5 tuiles, sélecteur), aucune cellule coupée", !!g2 && !g2.deborde && g2.blocOk && g2.tableOk && g2.tuilesOk && g2.selectOk && g2.cellules === 0, JSON.stringify(g2));
    ok("H : 320 px : le TEXTE de chacune des 5 tuiles tient dans sa tuile (libellés en capitales, chiffres)", !!g2 && g2.texteTuiles.length === 0, JSON.stringify(g2 && g2.texteTuiles));
    const ordi = await coachSur(b, db, "#/prospects", "#pr-mesure-chiffres", { viewport: ORDI, theme: "light" });
    const g3 = await geo(ordi.page), c3 = await lisible(ordi.page, TEXTE_BLOC), a3 = await absentes(ordi.page), m3 = await lireMesure(ordi.page);
    ok("H : ordinateur, thème clair : data-theme=\"light\", rien ne déborde (texte des tuiles compris), tout le texte du bloc lisible sur fond clair (mêmes éléments et mêmes seuils), chiffres exacts (7 j)",
      !!g3 && g3.theme === "light" && !g3.deborde && g3.blocOk && g3.tableOk && g3.tuilesOk && g3.texteTuiles.length === 0 && a3.length === 0 && c3.length > 20 && c3.every(x => x.ratio >= seuil(x) && x.fondClair === true) && conforme(m3, EXP["7"], "7"),
      JSON.stringify(g3) + " " + JSON.stringify(a3) + " " + JSON.stringify(c3.filter(x => !(x.ratio >= seuil(x) && x.fondClair === true)).slice(0, 5)) + " exceptions " + c3.filter(x => x.exc).length);
    if (CAPT) await ordi.page.locator("#pr-mesure").screenshot({ path: path.join(CAPT, "mesure-ordi-clair.png"), style: SANS_BARRES }).catch(e => console.log("capture ordi : " + e.message));
    ok("H : aucune écriture", intact(db), resume(db));
  });

  /* =================== I. données piégées ; Mes clients inchangé =================== */
  await bloc("I. données piégées", async () => {
    const db = decor(PRINCIPAUX.concat(PIEGES));
    const { page } = await coachSur(b, db, "#/clients", "#tb-clients [data-ouvrir]");
    await attendre(page, 500);
    const avant = await mesClients(page);
    const t0 = Date.now();
    await aller(page, "#/prospects", 300);
    await page.waitForSelector("#pr-mesure #pr-mesure-chiffres", { timeout: 15000 }).catch(() => {});
    const duree = Date.now() - t0;
    const m7 = await lireMesure(page);
    ok("I : la page s'affiche avec le bloc (pas « Mesure indisponible »), les filtres et la liste, malgré les données piégées et les listes géantes (" + (duree < 8000 ? "moins de 8 s" : duree + " ms") + ")",
      !!m7 && m7.tuiles.length === 5 && !/indisponible/.test(m7.texte) && !!(await page.$("#pr-liste .sc-carte")) && !!(await page.$(".sc-filtres")) && duree < 8000, detail(m7) + " " + duree + " ms");
    const E7 = plus(EXP["7"], D_PIEGES);
    ok("I : 7 j : " + E7.chiffres.join(" / ") + " ; « origine inconnue » 3 clics / 3 « Plus tard » (__proto__, constructor, hasOwnProperty, prototype, source non texte) ; date objet, questionnaire daté par un objet, case objet ou nombre, entrées illisibles : ignorés",
      conforme(m7, E7, "7"), detail(m7));
    await periode(page, "30"); const m30 = await lireMesure(page);
    await periode(page, "tout"); const mt = await lireMesure(page);
    ok("I : 30 j et depuis le 28/09 : chiffres et tableaux exacts (ceux des autres comptes inchangés, + les comptes piégés)",
      conforme(m30, plus(EXP["30"], D_PIEGES), "30") && conforme(mt, plus(EXP.tout, D_PIEGES), "tout"), detail(m30) + " | " + detail(mt));
    const proto = await page.evaluate(() => ({ clics: ({}).clics, tard: ({}).tard, ctor: ({}).constructor === Object, proto: Object.getPrototypeOf({}) === Object.prototype, cles: Object.keys(Object.prototype).length, has: typeof ({}).hasOwnProperty, ts: typeof ({}).toString }));
    ok("I : aucun objet touché : ({}).clics et ({}).tard restent undefined, Object.prototype sans clé, constructor / hasOwnProperty / toString intacts",
      proto.clics === undefined && proto.tard === undefined && proto.ctor && proto.proto && proto.cles === 0 && proto.has === "function" && proto.ts === "function", JSON.stringify(proto));
    await tous(page);
    const k = await clicsCartes(page);
    const faux = Object.keys(CARTES).filter(u => !k[u] || k[u].v !== CARTES[u]);
    ok("I : les autres comptes gardent leurs cartes (« Clics plan d'action » identiques)", faux.length === 0, JSON.stringify(faux.map(u => [u.slice(-2), k[u] && k[u].v])));
    ok("I : cartes piégées : Piège « 5 (dernier : origine inconnue (avant la v50)) » (date objet ignorée), Géant « 2001 (dernier : page verrouillée Mon programme) », clés de forme inattendue « 0 »",
      !!k[PIEGE] && k[PIEGE].v === "5 (dernier : origine inconnue (avant la v50))" && !!k[GEANT] && k[GEANT].v === "2001 (dernier : page verrouillée Mon programme)" && !!k[BIZ] && k[BIZ].v === "0" && !!k[BIZ2] && k[BIZ2].v === "0",
      JSON.stringify([PIEGE, GEANT, BIZ, BIZ2].map(u => k[u] && k[u].v)));
    /* un bloc qui plante À L'AFFICHAGE de la page (Mesure.monter passe avant la Newsletter et les Nouveautés) : on arrive depuis
       Mes clients avec Decouverte.plusTardDe qui lève une erreur ; le message, et le reste de la page est là, identique à une
       visite normale ; remis en place (nouvelle visite) : de nouveau les chiffres */
    const reste = () => page.evaluate(() => {
      const n = s => String(s || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim(), B = document.querySelector("#pr-mesure");
      return { mesure: B ? Array.from(B.children).map(e => e.tagName + ":" + n(e.textContent)).join(" | ") : null, cartes: document.querySelectorAll("#pr-liste .sc-carte").length,
        filtres: !!document.querySelector(".sc-filtres"), tuiles: Array.from(document.querySelectorAll("#pr-vue > section.panel:not(#pr-mesure) .tiles > .tile .t-lbl")).map(e => n(e.textContent)),
        compteur: n((document.querySelector("#pr-compteur") || {}).textContent), nouveautes: n((document.querySelector("#pr-nouveautes") || {}).textContent),
        newsletter: n((document.querySelector("#pr-newsletter #pr-nl") || {}).textContent) };
    });
    const complete = async () => { await page.waitForSelector("#pr-liste .sc-carte", { timeout: 15000 }).catch(() => {});
      await page.waitForFunction(() => !!document.querySelector("#pr-nl") && (document.querySelector("#pr-nouveautes") || { textContent: "" }).textContent.trim().length > 0, null, { timeout: 8000 }).catch(() => {}); await attendre(page, 500); };
    await complete();
    const normal = await reste();
    await aller(page, "#/clients", 300); await page.waitForSelector("#tb-clients [data-ouvrir]", { timeout: 10000 });
    await page.evaluate(() => { window.__plusTardDe = Decouverte.plusTardDe; Decouverte.plusTardDe = () => { throw new Error("piège"); }; });
    await aller(page, "#/prospects", 300); await complete();
    const casse = await reste();
    await page.evaluate(() => { Decouverte.plusTardDe = window.__plusTardDe; delete window.__plusTardDe; });
    const court = x => Object.assign({}, x, { nouveautes: String(x.nouveautes).slice(0, 60), newsletter: String(x.newsletter).slice(0, 40) });
    ok("I : un bloc Mesure qui plante À L'AFFICHAGE de la page (arrivée depuis Mes clients) : « Mesure indisponible pour le moment. » ; le reste de la page est là et identique à une visite normale (compteur, 4 tuiles, filtres, " + normal.cartes + " cartes, Nouveautés, Newsletter)",
      casse.mesure === "H2:Mesure | P:Mesure indisponible pour le moment." && normal.cartes > 10 && casse.cartes === normal.cartes && casse.filtres && egal(normal.tuiles, ["À traiter", "Signés", "Perdus", "Absents"]) && egal(casse.tuiles, normal.tuiles)
      && !!normal.compteur && casse.compteur === normal.compteur && normal.nouveautes.length > 0 && casse.nouveautes === normal.nouveautes && /^Newsletter/.test(normal.newsletter) && casse.newsletter === normal.newsletter,
      JSON.stringify({ normal: court(normal), casse: court(casse) }));
    await aller(page, "#/clients", 300); await page.waitForSelector("#tb-clients [data-ouvrir]", { timeout: 10000 });
    await aller(page, "#/prospects", 300); await page.waitForSelector("#pr-mesure #pr-mesure-chiffres", { timeout: 15000 }).catch(() => {});
    const mr = await lireMesure(page);
    ok("I : remis en place (nouvelle visite) : le bloc revient, chiffres et tableau exacts (période gardée : depuis le 28/09)", conforme(mr, plus(EXP.tout, D_PIEGES), "tout"), detail(mr));
    await aller(page, "#/clients", 300);
    await page.waitForSelector("#tb-clients [data-ouvrir]", { timeout: 10000 }); await attendre(page, 500);
    const apres = await mesClients(page);
    ok("I : Mes clients identique avant et après la visite (clients, prospects, régularité, pastilles ; " + avant.length + " lignes)", avant.length >= 6 && egal(avant, apres),
      JSON.stringify(avant.filter((x, i) => x !== apres[i]).slice(0, 2)) + " → " + JSON.stringify(apres.filter((x, i) => x !== avant[i]).slice(0, 2)));
    ok("I : aucune écriture, aucune donnée changée (clients compris)", intact(db), resume(db));
  });

  /* =================== J. les autres origines (brief L : « conservée, avec un code clair ») =================== */
  await bloc("J. autres origines", async () => {
    const db = decor(PRINCIPAUX.concat(["olga"]));
    const { page } = await coachSur(b, db, "#/prospects", "#pr-mesure-chiffres");
    const V = {};
    for (const p of ["7", "30", "tout"]) { await periode(page, p); V[p] = await lireMesure(page); }
    const E = p => plus(EXP[p], D_OLGA), M = V["7"];
    const ligne = (X, k) => ((X && X.lignes) || []).find(r => r[0] === k) || [];
    ok("J : 7 j : " + E("7").chiffres.join(" / ") + " (+ Olga : inscrite, questionnaire, 11 clics, et sa case d'ancien prospect du challenge, jours[\"7\"].reserve), tableau exact, noms, tri",
      conforme(M, E("7"), "7", NOMS_OLGA), detail(M));
    ok("J : chaque autre origine garde sa ligne, nom en clair : « Modifier mes réponses » (reponses_haut), pages verrouillées Mon bilan et Mes compléments, « lien envoyé par le coach » (fiche-coach et fiche_coach : UNE ligne, 1 clic / 1 « Plus tard »), page verrouillée inconnue (verrou-recettes → verrou_recettes, « page verrouillée « recettes » », 1 / 1), code propre inconnu tel quel (bouton_mystere)",
      egal(ligne(M, "reponses_haut"), ["reponses_haut", NOMS.reponses_haut, "1", "0"]) && egal(ligne(M, "verrou_bilan"), ["verrou_bilan", NOMS.verrou_bilan, "1", "0"])
      && egal(ligne(M, "verrou_complements"), ["verrou_complements", NOMS.verrou_complements, "1", "0"]) && egal(ligne(M, "fiche_coach"), ["fiche_coach", NOMS.fiche_coach, "1", "1"])
      && egal(ligne(M, "verrou_recettes"), ["verrou_recettes", NOMS_OLGA.verrou_recettes, "1", "1"]) && egal(ligne(M, "bouton_mystere"), ["bouton_mystere", "bouton_mystere", "1", "0"])
      && !ligne(M, "fiche-coach").length && !ligne(M, "verrou-recettes").length, detail(M));
    ok("J : sources illisibles (nombre, objet, majuscules « Accueil_Haut », texte HTML, 41 caractères ; « Plus tard » au code nombre) : « origine inconnue (avant la v50) » 5 clics / 1 « Plus tard » ; aucune affichée telle quelle, aucun HTML injecté, aux 3 périodes",
      egal(ligne(M, "?"), ["?", NOMS["?"], "5", "1"]) && ["7", "30", "tout"].every(p => !!V[p] && !/Accueil_Haut|<b>x|&lt;b|a{41}|\[object/.test(V[p].texte + " " + V[p].html)), detail(M));
    ok("J : 30 j et depuis le 28/09 : les mêmes lignes en plus (tout est dans les 7 jours), chiffres, tableaux, noms et tri exacts",
      conforme(V["30"], E("30"), "30", NOMS_OLGA) && conforme(V.tout, E("tout"), "tout", NOMS_OLGA), detail(V["30"]) + " | " + detail(V.tout));
    await tous(page);
    const k = await clicsCartes(page);
    ok("J : sa carte « 11 (dernier : page verrouillée « recettes ») » (le clic le plus récent, au milieu de la liste) ; les autres cartes inchangées",
      !!k[OLGA] && k[OLGA].v === "11 (dernier : page verrouillée « recettes »)" && Object.keys(CARTES).every(u => !!k[u] && k[u].v === CARTES[u]), JSON.stringify(k[OLGA]));
    ok("J : aucune écriture, aucune donnée changée", intact(db), resume(db));
  });

  /* =================== K. « Plus tard » écrits par le prospect : 50 au plus, fusion à la relecture =================== */
  await bloc("K. « Plus tard » écrits", async () => {
    const db = decor(["paul", "rita"]);
    const tard = uid => (((cleDe(db, uid, "challenge") || {}).cta || {}).plus_tard || []).map(x => x && (x.source + "|" + x.date));
    const avant = tard(PAUL);
    const P = await contexte(b, qui(PAUL, "paul@exemple.fr"), db, { viewport: MOBILE });
    await P.page.goto(URL0); await pret(P.page, "#dc-bilan-plus-tard");
    await P.page.click("#dc-bilan-plus-tard"); await attendre(P.page, 2500);
    const apres = tard(PAUL), der = (((cleDe(db, PAUL, "challenge") || {}).cta || {}).plus_tard || []).slice(-1)[0] || {};
    const clP = ((cleDe(db, PAUL, "challenge") || {}).cta || {}).clics || [], bp = (cleDe(db, PAUL, "intake") || {}).bilan_propose || {};
    ok("K : 50 « Plus tard » déjà notés, puis « Plus tard » sur la page du plan : 50 au plus — le plus ancien retiré, les 49 suivants gardés dans l'ordre, le nouveau à la fin (apres_questionnaire, daté de maintenant) ; son clic gardé ; intake.bilan_propose « plus_tard » ; la clé écrite une fois",
      avant.length === 50 && apres.length === 50 && egal(apres.slice(0, 49), avant.slice(1)) && der.source === "apres_questionnaire" && typeof der.date === "string" && Math.abs(Date.parse(der.date) - T0) < 5 * MIN
      && clP.length === 1 && clP[0].source === "accueil_haut" && clP[0].date === L(17, 11, 9, 20) && bp.choix === "plus_tard"
      && db.ecritures.filter(e => e.user_id === PAUL && e.outil === "challenge").length === 1, JSON.stringify([avant.length, apres.length, apres.slice(0, 1), der, clP.length, bp]) + " " + resume(db));
    const R = await contexte(b, qui(RITA, "rita@exemple.fr"), db, { viewport: MOBILE });
    await R.page.goto(URL0); await pret(R.page, "#dc-accomp");
    /* depuis l'ouverture de la page, un autre appareil a noté un « Plus tard » (« Commence ici », 17/11 11:00) */
    cleDe(db, RITA, "challenge").cta.plus_tard.push(pt("formation_commence_ici", L(17, 11, 11, 0)));
    /* sur l'appareil : la clé telle qu'elle a été lue (calculateur, 17/11 09:00) + un « Plus tard » noté ici et pas encore en
       base (Mindset, 17/11 10:00) ; puis un nouveau « Plus tard » (première pesée) */
    const r = await R.page.evaluate(async ([d1, d2]) => {
      const C = { version: 1, jours: {}, cta: { clics: [], plus_tard: [{ source: "declic_calculateur", date: d1 }, { source: "declic_mindset", date: d2 }] } };
      await Decouverte.plusTard(C, "declic_premiere_pesee"); return true;
    }, [L(17, 11, 9, 0), L(17, 11, 10, 0)]).catch(e => String(e));
    await attendre(R.page, 2000);
    const f = tard(RITA), dern = (((cleDe(db, RITA, "challenge") || {}).cta || {}).plus_tard || []).slice(-1)[0] || {};
    ok("K : relecture avant écriture (fraiche) : le « Plus tard » noté sur l'appareil et absent de la base (Mindset) est ajouté, celui d'un autre appareil (« Commence ici ») gardé, celui déjà en base (calculateur) pas en double, le nouveau (première pesée) à la fin",
      r === true && f.length === 4 && egal(f.slice(0, 3), ["declic_calculateur|" + L(17, 11, 9, 0), "formation_commence_ici|" + L(17, 11, 11, 0), "declic_mindset|" + L(17, 11, 10, 0)])
      && dern.source === "declic_premiere_pesee" && typeof dern.date === "string" && Math.abs(Date.parse(dern.date) - T0) < 5 * MIN, JSON.stringify(f) + " " + r);
    ok("K : seules leurs clés à eux écrites (Paul : intake et challenge ; Rita : challenge ; compteurs de visites), aucun refus, rien d'autre changé",
      db.refus.length === 0 && db.ecritures.every(e => e.table === "donnees" && ((e.user_id === PAUL && ["intake", "challenge", "activite"].includes(e.outil)) || (e.user_id === RITA && ["challenge", "activite"].includes(e.outil))))
      && intactSauf(db, [PAUL, RITA]), resume(db));
  });

  /* =================== Z. rien vers l'extérieur =================== */
  await bloc("Z. hôtes externes", async () => {
    const autres = Array.from(externes).filter(h => !/^fonts\.(googleapis|gstatic)\.com$/.test(h));
    ok("Z : aucune requête vers un autre hôte que la page, le faux Supabase et les polices (bloquées) ; le faux Calendly n'a reçu que les onglets ouverts par le prospect du bloc D (3)",
      autres.length === 0 && CAL_RECUS.length === CAL_ATTENDUS, JSON.stringify(autres) + " " + JSON.stringify(CAL_RECUS.map(utm)));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
