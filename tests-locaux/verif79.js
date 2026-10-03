/* verif79 — v71 (F, mission du 04/10) : réseau faible, plus jamais un écran faux — vérifié de bout en bout dans un vrai
   navigateur, avec un faux Supabase qui tombe en panne à la demande (profils en 500, lecture de donnees qui ne répond
   JAMAIS, renouvellement ou connexion en 5xx / coupés).
   A. profil illisible au démarrage (GET /rest/v1/profils → 500) : la page « Impossible de charger ton compte pour le
      moment » (« Vérifie ta connexion, puis réessaie. », bouton « Réessayer ») et RIEN de l'app (aucun onglet, appPrete
      faux, aucune lecture de donnees, aucune connexion notée, rien d'écrit), la session gardée sur l'appareil ; profils
      rétablis + « Réessayer » (rechargement) → l'accueil de Thomas ; une prospecte (questionnaire validé) voit le même
      écran, jamais « Bienvenue » ni l'espace client (pas de cadenas) ; en anglais (« Your account couldn't be loaded right
      now », « Check your connection, then try again. », « Try again ») ; profils rétablis + retour du réseau (événement
      online) → rechargement de lui-même → l'accueil ;
   B. lecture figée (Auth.DELAI abaissé à 1,5 s par page.evaluate, 15 s dans le fichier) : une lecture de donnees qui ne
      répond jamais est abandonnée après le délai et la page affiche « Pas de connexion : tes données n'ont pas pu être
      chargées. » + « Réessayer » (#page-hors-ligne, role=alert, bouton data-reessayer data-lecture-ok) à la place de
      l'état vide — jamais « Ton coach n'a pas encore déposé ton programme », « pas encore validé tes repas », « Ton coach
      prépare ton programme » (guettés en continu) —, rien d'écrit ; la base revenue, « Réessayer » relit la page (sans
      rechargement) et la page normale revient, toujours rien d'écrit : Mon programme (eq.programme), Nutrition
      (eq.repas), accueil (lecture groupée in.( …)), Mon suivi (in.( …)), Ma progression (eq.mens : les panneaux retirés,
      aucun #tbody, le bloc sous l'en-tête), Speed Formation (eq.formation) ; le coach dans la fiche de Thomas (Mon suivi,
      lecture groupée figée) : « Pas de connexion : les données de ce client n'ont pas pu être chargées. » + bouton ;
      un envoi keepalive sur une route figée n'est jamais abandonné par le délai (toujours « pendant » après 3 s), le même
      envoi sans keepalive l'est (TypeError « Failed to fetch », reseau et delai vrais) ;
   C. écran de connexion : session expirée dont le renouvellement est coupé par le réseau (route abandonnée) ou répond
      503 → l'écran de connexion dit « Service momentanément indisponible, réessaie dans une minute. », la session reste
      sur l'appareil ; renouvellement refusé (400 invalid_grant) → #co-err vide, session effacée (comme avant) ; sans
      session, une connexion par mot de passe qui reçoit un 503 ou une coupure affiche ce même message (jamais « Erreur
      503 » ni « Failed to fetch »), le bouton redevient actif ; en anglais : « The service is temporarily unavailable, try
      again in a minute. ».
   Supabase simulé : rien ne part vers la vraie base (routage par NOM D'HÔTE, jamais par sous-chaîne) ; une requête
   figée n'est jamais répondue (abandonnée à la fin du bloc, ou après 40 s par un minuteur unref : la suite ne pend
   jamais). Comptes fictifs (fixtures.js + une prospecte …7901). Chaque bloc tourne dans un contexte neuf, à part
   (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif79.js ../index.html
           VERIF79_PORT=9951 node verif79.js ../index.html     (autre port, si 9950 est pris)
           VERIF79_BLOCS="A.,C." node verif79.js …              (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const FT = require("./fichiers");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF79_PORT || 9950;
const BLOCS = (process.env.VERIF79_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const URL0 = "http://localhost:" + PORT + "/";
const server = http.createServer((req, res) => {
  if (FT.servirFichier(req, res, HTML)) return;
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
const figees = [];    // les requêtes figées (jamais répondues) du bloc en cours : abandonnées à la fin du bloc, avant la fermeture
async function bloc(nom, fn){
  if (BLOCS.length && !BLOCS.some(x => nom.startsWith(x))) return;
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
  finally {
    while (figees.length) figees.pop().abort().catch(() => {});   // déjà abandonnée par la page (AbortController) : l'appel échoue, tant mieux
    while (ouverts.length) await ouverts.pop().close().catch(() => {});
  }
}
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const egal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const norm = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const attendre = (page, ms) => page.waitForTimeout(ms);
const maintenant = () => new Date().toISOString();
const T0 = Date.now(), MIN = 60000, H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();

/* ---------- personnes ---------- */
/* un jeton par compte : le faux Supabase reconnaît l'appelant à son en-tête Authorization ; expireLe : la date de fin de la
   session rangée (passée : l'app doit la renouveler au démarrage) */
const session = (id, email, expireLe) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: expireLe || Date.now() + J, user: { id, email, role: "authenticated" } });
const THOMAS = F.IDS.c1, COACH = F.IDS.coach;
const LEA = "00000000-0000-4000-8000-000000007901";   // verif79 : …79kk (une plage par suite)
/* une prospecte qui a validé les 3 questions (gabarit de verif76 / verif66) */
const NOUVEAU = { probleme: "Perdre du gras", obstacle: "Le manque de temps", projection: "Avoir de l'énergie toute la journée",
  objectif: "Perte de poids / sèche", objectif_auto: "Perte de poids / sèche", court_debut: avant(2 * H), court_le: avant(H), bilan_propose: { choix: "plus_tard", le: avant(MIN) } };

/* ---------- les textes attendus (FR + I18N.en), mot pour mot ---------- */
const TX = {
  indispo: "Impossible de charger ton compte pour le moment", indispo_en: "Your account couldn't be loaded right now",
  verifie: "Vérifie ta connexion, puis réessaie.", verifie_en: "Check your connection, then try again.",
  reessayer: "Réessayer", reessayer_en: "Try again",
  horsLigne: "Pas de connexion : tes données n'ont pas pu être chargées.", horsLigne_en: "No connection: your data couldn't be loaded.",
  horsLigneCoach: "Pas de connexion : les données de ce client n'ont pas pu être chargées.",
  service: "Service momentanément indisponible, réessaie dans une minute.", service_en: "The service is temporarily unavailable, try again in a minute."
};

/* ---------- le faux Supabase : pannes à la demande ----------
   profilKo : GET /rest/v1/profils → 500 tant que vrai ; fige : filtres « outil » (ex. "eq.programme", "in.(") dont la lecture
   GET /rest/v1/donnees ne répond JAMAIS ; figeEnvois : les POST / PATCH de donnees ne répondent jamais ; refreshMode ("ok" |
   "abort" | 503 | 400) pour POST /auth/v1/token?grant_type=refresh_token ; login ("ok" | 503 | "abort") pour grant_type=password.
   lectures : chaque GET de donnees répondu ; ecritures : chaque POST / PATCH de donnees ; notees : appels de noter_connexion ;
   tokens : les grant_type reçus. */
function base(){
  const profils = clone(F.profils); profils.forEach(p => { if (p.role !== "coach") p.statut = "client"; });
  return { profils, donnees: clone(F.donnees), n: 0, ecritures: [], lectures: [], notees: 0, tokens: [], traces: [],
    profilKo: false, fige: [], figeEnvois: false, refreshMode: "ok", login: "ok" };
}
/* la prospecte Léa (statut prospect, questionnaire validé) ajoutée au décor */
function prospecte(db){
  db.profils.push({ id: LEA, prenom: "Léa", nom: "Essai", role: "client", statut: "prospect", cree_le: avant(2 * J) });
  db.donnees.push({ user_id: LEA, outil: "intake", contenu: clone(NOUVEAU), maj_le: avant(H) });
  return db;
}
const ligne = (db, uid, outil) => db.donnees.find(x => x.user_id === uid && x.outil === outil);
function mettre(db, uid, outil, contenu, maj){
  const l = ligne(db, uid, outil);
  if (l){ l.contenu = clone(contenu); l.maj_le = maj || maintenant(); } else db.donnees.push({ user_id: uid, outil, contenu: clone(contenu), maj_le: maj || maintenant() });
}
/* les écritures de données (hors « activite », le compteur de visites d'un prospect : pas une saisie, écrit en arrière-plan) */
const ecrDonnees = db => db.ecritures.filter(e => e.outil !== "activite");
const lus = (db, prefixe) => db.lectures.filter(l => String(l.outil || "").startsWith(prefixe));
async function repondre(r, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue().catch(() => {});
  if (!host.endsWith(".supabase.co")) return r.abort().catch(() => {});   // polices, Calendly, YouTube… : rien ne sort
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});   // page fermée entre-temps
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" } }).catch(() => {});
  /* une requête figée : jamais répondue. Abandonnée à la fin du bloc (bloc → figees), ou après 40 s par un minuteur qui ne
     retient pas le processus (unref) : la suite ne pend jamais. La page, elle, l'abandonne après Auth.DELAI (AbortController). */
  const figer = () => { figees.push(r); const t = setTimeout(() => r.abort().catch(() => {}), 40000); if (t.unref) t.unref(); };
  const corps = req.postData() || "";
  db.traces.push(m + " " + p + (url.search || ""));
  const auth = req.headers()["authorization"] || "";
  const mo = /^Bearer jeton-([0-9a-f-]{36})$/.exec(auth), moi = mo ? mo[1] : null;
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  if (p.startsWith("/auth/v1/token")) {
    const grant = q.get("grant_type") || "?"; db.tokens.push(grant);
    let c = {}; try { c = JSON.parse(corps || "{}"); } catch (e) {}
    if (grant === "refresh_token") {
      if (db.refreshMode === "abort") return r.abort("failed").catch(() => {});   // réseau coupé : TypeError « Failed to fetch »
      if (db.refreshMode === 503) return json({ message: "Service Unavailable" }, 503);
      if (db.refreshMode === 400) return json({ error: "invalid_grant", error_description: "Invalid Refresh Token: Already Used" }, 400);
      const r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || ""));
      return r1 ? json(session(r1[1], "")) : json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
    }
    if (grant === "password") {
      if (db.login === "abort") return r.abort("failed").catch(() => {});
      if (db.login === 503) return json({ message: "Service Unavailable" }, 503);
      return json(session(THOMAS, String(c.email || "")));
    }
    return json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
  }
  if (p.startsWith("/auth/v1/user")) return moi ? json({ id: moi, email: "", role: "authenticated" }) : json({ msg: "invalid JWT" }, 401);
  if (p.startsWith("/auth/v1/")) return json({});
  /* v56 : la connexion notée par la base (fonction noter_connexion) : pas une écriture de l'app dans les données ; comptée ici */
  if (p === "/rest/v1/rpc/noter_connexion") { db.notees++; return json(null, 204); }
  if (p.startsWith("/functions/v1/") || p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({});
  if (p === "/rest/v1/profils") {
    if (db.profilKo && (m === "GET" || m === "HEAD")) return json({ message: "panne simulée" }, 500);   // A : profil illisible (5xx)
    const id = (q.get("id") || "").replace(/^eq\./, ""); let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(m === "GET" ? l : []);
  }
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "";
    if (m === "POST") {
      if (db.figeEnvois) return figer();   // B : un envoi qui ne répond jamais
      let rows = []; try { rows = JSON.parse(corps); } catch (e) {}
      (Array.isArray(rows) ? rows : [rows]).forEach(x => {
        if (!x || x.user_id !== moi) return;
        db.n++; db.ecritures.push({ n: db.n, m, outil: x.outil, contenu: clone(x.contenu), maj_le: x.maj_le });
        mettre(db, x.user_id, x.outil, clone(x.contenu), x.maj_le);
      });
      return json(null, 201);
    }
    if (m === "PATCH") {   // écriture conditionnelle (CleCoach) : notée, appliquée telle quelle
      if (db.figeEnvois) return figer();
      let c = {}; try { c = JSON.parse(corps || "{}"); } catch (e) {}
      const cle = o.replace(/^eq\./, ""), row = db.donnees.find(x => x.user_id === uid && x.outil === cle);
      db.n++; db.ecritures.push({ n: db.n, m, outil: cle, contenu: clone(c.contenu), maj_le: c.maj_le });
      if (row){ row.contenu = clone(c.contenu); row.maj_le = c.maj_le || maintenant(); return json([row]); }
      return json([]);
    }
    if (m !== "GET") { db.n++; db.ecritures.push({ n: db.n, m, outil: o.replace(/^eq\./, "") }); return json(null, 204); }   // DELETE : jamais attendu, noté
    if (db.fige.some(f => o.startsWith(f))) return figer();   // B : une lecture qui ne répond jamais
    db.n++; db.lectures.push({ n: db.n, uid, outil: o, select: q.get("select") || "" });
    let l = db.donnees.filter(x => coach || (x.user_id === moi && !["notes_coach", "suivi_prospect"].includes(x.outil)));
    if (uid) l = l.filter(x => x.user_id === uid);
    if (o.startsWith("eq.")) l = l.filter(x => x.outil === o.slice(3));
    if (o.startsWith("in.")) { const k = o.slice(3).replace(/^\(|\)$/g, "").split(","); l = l.filter(x => k.includes(x.outil)); }
    const sel = q.get("select") || "*";
    return json(sel === "*" ? clone(l) : clone(l).map(x => Object.fromEntries(sel.split(",").map(k => [k, x[k]]))));
  }
  if (p === "/rest/v1/bibliotheque") return m === "GET" ? json(coach ? clone(F.bibliotheque) : []) : json(null, 204);
  const t = p.replace("/rest/v1/", "");
  if (F.catalogue[t]) return json(m === "GET" ? F.catalogue[t] : null);
  return json([]);
}

/* ---------- un navigateur (contexte) pour une personne ----------
   who : l'identifiant du compte connecté (null : personne) ; opts.langue ("en" : mhx_langue sur l'appareil — la ligne prefs du
   compte doit dire la même chose, sinon l'app recharge en boucle), opts.expireLe (session expirée : date passée) */
async function contexte(b, db, who, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: { width: 1100, height: 900 } });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, db));
  await c.addInitScript(({ s, langue }) => {
    if (!/^https?:$/.test(location.protocol) || localStorage.getItem("__init")) return;   // l'appareil n'est préparé qu'une fois : un rechargement le garde
    localStorage.setItem("__init", "1");
    localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
    if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
    if (langue) localStorage.setItem("mhx_langue", langue);
  }, { s: who ? session(who, "t@exemple.fr", opts.expireLe) : null, langue: opts.langue || "" });
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  /* console.error ignorée seulement pour une réponse 4xx / 5xx simulée (« status of 500 ») et une requête coupée par la
     simulation (ERR_FAILED) ; net::ERR_ABORTED (ou un autre net::ERR) : une requête figée abandonnée par la page elle-même
     (AbortController après Auth.DELAI) peut l'écrire dans la console — ce cas précis seulement, voulu ici */
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d|net::ERR/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return { c, page };
}
/* l'app a fini de démarrer (appPrete) et l'écran attendu est là — jamais pour l'écran « Impossible » (appPrete y reste faux) */
async function pret(page, sel){
  await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 12000 });
  if (sel) await page.waitForSelector(sel, { timeout: 10000 });
}
const aller = (page, h) => page.evaluate(x => { location.hash = x; }, h);
/* B : le délai d'abandon des appels, posé dans la page ouverte (avant la navigation vers la page testée) ; renvoie l'ancien */
const delai = (page, ms) => page.evaluate(ms => { const d = Auth.DELAI; Auth.DELAI = ms; return d; }, ms);
const local = (page, k) => page.evaluate(k => localStorage.getItem(k), k);
const sessionGardee = page => page.evaluate(() => !!localStorage.getItem("mhx_session"));
/* un texte interdit guetté EN CONTINU dans #vue (observateur de mutations), depuis l'appel : vu(page) dit s'il est apparu un instant */
const guetter = (page, re) => page.evaluate(src => {
  window.__guet = { src, vu: false };
  const test = () => { const v = document.getElementById("vue"); if (v && new RegExp(src).test(v.textContent)) window.__guet.vu = true; };
  try { new MutationObserver(test).observe(document.body, { childList: true, subtree: true, characterData: true }); } catch (e) { window.__guet.vu = "observateur impossible"; }
  test();
}, re.source);
const vu = page => page.evaluate(() => (window.__guet ? window.__guet.vu : "pas guetté"));
/* A : l'écran « Impossible de charger ton compte » tel qu'affiché, et ce qui ne doit PAS y être */
const ecranIndispo = page => page.evaluate(() => {
  const n = x => x ? x.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null;
  const h2 = document.getElementById("co-indispo"), b = document.getElementById("co-reessayer");
  return { h2: n(h2), sous: n(h2 && h2.parentElement && h2.parentElement.querySelector(".co-sous")), bouton: n(b), carte: !!(h2 && h2.closest(".portail .carte-co")),
    nav: document.querySelectorAll("#nav a").length, cadenas: document.querySelectorAll(".nav-cadenas").length, vue: !!document.getElementById("vue"),
    bienvenue: /Bienvenue|Welcome/.test(document.body.textContent), pret: typeof appPrete !== "undefined" ? appPrete : "absent", lang: document.documentElement.lang };
});
/* B : le bloc « Pas de connexion » tel qu'affiché (zone : le conteneur attendu), et l'état de la page autour */
const horsLigne = (page, zone) => page.evaluate(zone => {
  const n = x => x ? x.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : null;
  const f = document.getElementById("page-hors-ligne"), b = f && f.querySelector("[data-reessayer]"), z = zone ? document.querySelector(zone) : null;
  return { present: !!f, nb: document.querySelectorAll("#page-hors-ligne").length, classes: f ? f.className : null, role: f ? f.getAttribute("role") : null,
    texte: n(f && f.querySelector("span")), bouton: b ? { t: n(b), lectureOk: b.hasAttribute("data-lecture-ok"), bouton: b.tagName === "BUTTON" && b.getAttribute("type") === "button" } : null,
    dansZone: zone ? !!(z && f && z.contains(f)) : null, apresEntete: !!(f && f.previousElementSibling && f.previousElementSibling.classList.contains("masthead")),
    panneaux: document.querySelectorAll("#vue section.panel").length, tbody: !!document.getElementById("tbody"), kpoids: !!document.getElementById("k-poids"),
    consulte: typeof Store !== "undefined" ? Store.idConsulte : null, vue: n(document.getElementById("vue")) };
}, zone || null);
/* C : l'écran de connexion tel qu'affiché */
const ecranCo = page => page.evaluate(() => {
  const n = x => x ? x.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim() : "";
  const go = document.getElementById("c-go");
  return { go: !!go, goInactif: !!(go && go.disabled), goTexte: n(go), err: n(document.getElementById("co-err")), classeErr: (document.getElementById("co-err") || {}).className || "",
    session: !!localStorage.getItem("mhx_session"), sessionOnglet: !!sessionStorage.getItem("mhx_session"), nav: document.querySelectorAll("#nav a").length, vue: !!document.getElementById("vue"), lang: document.documentElement.lang };
});
/* le bloc « Pas de connexion » conforme (FR, ou « les données de ce client » pour une fiche consultée) */
const flagOk = (f, texte) => !!f && f.present && f.nb === 1 && /\bflag\b/.test(f.classes) && /\bgrave\b/.test(f.classes) && /\bflag-hors-ligne\b/.test(f.classes) && f.role === "alert"
  && f.texte === texte && !!f.bouton && f.bouton.t === TX.reessayer && f.bouton.lectureOk && f.bouton.bouton;

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF79_PORT=9951 node verif79.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. profil illisible au démarrage =================== */
  await bloc("A. Thomas : profils en 500 → « Impossible de charger ton compte », puis « Réessayer »", async () => {
    const db = base(); db.profilKo = true;
    const { page } = await contexte(b, db, THOMAS);
    await page.goto(URL0); await page.waitForSelector("#co-indispo", { timeout: 10000 }); await attendre(page, 900);
    const e = await ecranIndispo(page), g = await sessionGardee(page);
    ok("Thomas, profils en 500 au démarrage : l'écran « Impossible de charger ton compte pour le moment » (« Vérifie ta connexion, puis réessaie. », bouton « Réessayer », dans la carte du portail), rien de l'app (aucun onglet, pas de #vue, appPrete faux), aucune lecture de donnees, aucune connexion notée, rien d'écrit, la session gardée sur l'appareil",
      e.h2 === TX.indispo && e.sous === TX.verifie && e.bouton === TX.reessayer && e.carte && e.nav === 0 && !e.vue && e.pret === false && !e.bienvenue && db.lectures.length === 0 && db.notees === 0 && ecrDonnees(db).length === 0 && g === true,
      JSON.stringify([e, db.lectures.length, db.notees, ecrDonnees(db).length, g, db.traces.slice(-6)]));
    db.profilKo = false;
    await page.click("#co-reessayer");   // location.reload()
    await page.waitForSelector("#acc-vue h1", { timeout: 15000 }); await pret(page); await attendre(page, 1200);
    const a = await page.evaluate(() => ({ indispo: !!document.getElementById("co-indispo"), nav: document.querySelectorAll("#nav a").length, h1: !!document.querySelector("#acc-vue h1"), horsLigne: !!document.getElementById("page-hors-ligne"), pret: appPrete }));
    ok("profils rétablis, clic sur « Réessayer » : la page se recharge et l'accueil de Thomas s'affiche (onglets, appPrete vrai, pas de « Pas de connexion »), plus d'écran « Impossible », UNE connexion notée, rien d'écrit",
      !a.indispo && a.nav > 0 && a.h1 && !a.horsLigne && a.pret === true && db.notees === 1 && ecrDonnees(db).length === 0, JSON.stringify([a, db.notees, ecrDonnees(db).length]));
  });

  await bloc("A. prospecte : profils en 500 → le même écran, jamais l'espace client", async () => {
    const db = prospecte(base()); db.profilKo = true;
    const { page } = await contexte(b, db, LEA);
    await page.goto(URL0); await page.waitForSelector("#co-indispo", { timeout: 10000 }); await attendre(page, 900);
    const e = await ecranIndispo(page), g = await sessionGardee(page);
    ok("prospecte Léa (questionnaire validé), profils en 500 : le même écran « Impossible de charger ton compte pour le moment » + « Réessayer », jamais « Bienvenue » ni l'espace client (aucun cadenas, aucun onglet, pas de #vue), aucune lecture de donnees (ni intake), aucune connexion notée, rien d'écrit, session gardée",
      e.h2 === TX.indispo && e.sous === TX.verifie && e.bouton === TX.reessayer && !e.bienvenue && e.cadenas === 0 && e.nav === 0 && !e.vue && e.pret === false && db.lectures.length === 0 && db.notees === 0 && ecrDonnees(db).length === 0 && g === true,
      JSON.stringify([e, db.lectures.length, db.notees, ecrDonnees(db).length, g]));
  });

  await bloc("A. en anglais, puis retour du réseau (événement online)", async () => {
    const db = base(); mettre(db, THOMAS, "prefs", { langue: "en" }); db.profilKo = true;   // prefs.langue = en aussi : sinon l'app rechargerait en boucle une fois le profil lu
    const { page } = await contexte(b, db, THOMAS, { langue: "en" });
    await page.goto(URL0); await page.waitForSelector("#co-indispo", { timeout: 10000 }); await attendre(page, 900);
    const e = await ecranIndispo(page);
    ok("en anglais (mhx_langue = en) : « Your account couldn't be loaded right now », « Check your connection, then try again. », bouton « Try again » ; rien de l'app, aucune lecture, rien d'écrit",
      e.h2 === TX.indispo_en && e.sous === TX.verifie_en && e.bouton === TX.reessayer_en && e.lang === "en" && e.nav === 0 && !e.vue && e.pret === false && db.lectures.length === 0 && ecrDonnees(db).length === 0, JSON.stringify([e, db.lectures.length]));
    db.profilKo = false;
    await page.evaluate(() => { window.dispatchEvent(new Event("online")); }).catch(() => {});   // le rechargement détruit le contexte d'exécution : normal
    await page.waitForSelector("#acc-vue h1", { timeout: 15000 }); await pret(page); await attendre(page, 1200);
    const a = await page.evaluate(() => ({ indispo: !!document.getElementById("co-indispo"), nav: document.querySelectorAll("#nav a").length, h1: !!document.querySelector("#acc-vue h1"), horsLigne: !!document.getElementById("page-hors-ligne"), lang: document.documentElement.lang, pret: appPrete }));
    ok("profils rétablis, retour du réseau (événement online) : la page se recharge d'elle-même et l'accueil s'affiche (en anglais, onglets, appPrete vrai), plus d'écran « Impossible », une connexion notée, rien d'écrit",
      !a.indispo && a.nav > 0 && a.h1 && !a.horsLigne && a.lang === "en" && a.pret === true && db.notees === 1 && ecrDonnees(db).length === 0, JSON.stringify([a, db.notees, ecrDonnees(db).length]));
  });

  /* =================== B. lecture figée : « Pas de connexion » + Réessayer après le délai =================== */
  /* chaque page de Thomas : depart = la page ouverte d'abord (ses lectures ne sont pas figées), fige = le filtre « outil » dont
     la lecture ne répond plus, interdit = l'ancien état vide (guetté en continu), zone = le conteneur du bloc, retour = ce qui
     prouve la page normale après « Réessayer », absents = ce qui ne doit plus être là tant que la lecture a échoué */
  const PAGES = [
    { nom: "Mon programme", hash: "#/programme", depart: URL0, fige: "eq.programme", interdit: /pas encore déposé ton programme/, zone: "#prog-vue", retour: "#prog-vue .prog-tete", texteRetour: /Séance|Bloc 1 — 4 semaines/ },
    { nom: "Nutrition", hash: "#/nutrition", depart: URL0, fige: "eq.repas", interdit: /pas encore validé tes repas/, zone: "#nu-vue", retour: "#nu-vue [data-mange]" },
    { nom: "accueil (lecture groupée)", hash: "#/accueil", depart: URL0 + "#/programme", fige: "in.(", interdit: /Ton coach prépare ton programme/, zone: "#acc-vue", apresEntete: true,
      retour: () => { const z = document.getElementById("acc-vue"); return !!z && !document.getElementById("page-hors-ligne") && z.querySelectorAll("section.panel").length > 0 && !/Chargement…/.test(z.textContent); } },
    { nom: "Mon suivi (lecture groupée)", hash: "#/suivi", depart: URL0 + "#/programme", fige: "in.(", interdit: /Ta régularité/, zone: "#suivi-reg", retour: "#suivi-reg .reg-evo" },
    { nom: "Ma progression (sans zone)", hash: "#/mensurations", depart: URL0, fige: "eq.mens", interdit: /Pas encore de mesure/, zone: null, apresEntete: true, sansPanneau: true, retour: "#tbody tr" },
    { nom: "Speed Formation", hash: "#/formation", depart: URL0, fige: "eq.formation", interdit: /0 \/ 49 étapes/, zone: "#fo-vue", retour: "#fo-vue .prog-compteur" }
  ];
  for (const P of PAGES) await bloc("B. " + P.nom + " : lecture figée (" + P.fige + ") → « Pas de connexion » + Réessayer", async () => {
    const db = base();
    const { page } = await contexte(b, db, THOMAS);
    await page.goto(P.depart); await pret(page, "#vue"); await attendre(page, 1200);
    const d0 = await delai(page, 1500);   // 15 s dans le fichier ; 1,5 s pour la suite, posé AVANT la navigation vers la page testée
    await guetter(page, P.interdit);
    db.fige = [P.fige];
    const e0 = ecrDonnees(db).length, l0 = lus(db, P.fige).length;
    const t = Date.now();
    await aller(page, P.hash);
    await page.waitForSelector("#page-hors-ligne", { timeout: 10000 }); await attendre(page, 600);
    const dt = Date.now() - t, f = await horsLigne(page, P.zone), v1 = await vu(page);
    ok("Thomas, " + P.nom + " avec la lecture « " + P.fige + " » qui ne répond jamais (Auth.DELAI = 1500, 15000 dans le fichier) : après le délai, « Pas de connexion : tes données n'ont pas pu être chargées. » + « Réessayer » (flag grave, role=alert, bouton data-reessayer data-lecture-ok" + (P.zone ? ", dans " + P.zone : ", sous l'en-tête, les panneaux retirés, aucun #tbody") + "), jamais l'ancien état vide (" + P.interdit.source + "), rien d'écrit",
      d0 === 15000 && flagOk(f, TX.horsLigne) && (P.zone ? f.dansZone : true) && (P.apresEntete ? f.apresEntete : true) && (P.sansPanneau ? (f.panneaux === 0 && !f.tbody && !f.kpoids) : true)
        && !P.interdit.test(f.vue) && v1 === false && dt >= 1200 && dt < 9000 && ecrDonnees(db).length === e0,
      JSON.stringify([d0, dt, f, v1, ecrDonnees(db).length - e0]));
    db.fige = [];
    await page.click("#page-hors-ligne [data-reessayer]");
    if (typeof P.retour === "function") await page.waitForFunction(P.retour, null, { timeout: 10000 }); else await page.waitForSelector(P.retour, { timeout: 10000 });
    await attendre(page, 900);
    const a = await page.evaluate(() => ({ horsLigne: !!document.getElementById("page-hors-ligne"), vue: (document.getElementById("vue") || {}).textContent || "", hash: location.hash, courant: typeof courant !== "undefined" ? courant : null }));
    ok("… la base revenue, clic sur « Réessayer » : la page est relue sur place (" + P.hash + " gardé, sans rechargement : Auth.DELAI toujours à 1500) et " + P.nom + " s'affiche normalement (" + (typeof P.retour === "function" ? "panneaux de l'accueil" : P.retour) + "), plus de « Pas de connexion », la lecture « " + P.fige + " » répondue, rien d'écrit",
      !a.horsLigne && a.hash === P.hash && (!P.texteRetour || P.texteRetour.test(a.vue)) && !/Pas de connexion/.test(a.vue) && lus(db, P.fige).length > l0 && (await page.evaluate(() => Auth.DELAI)) === 1500 && ecrDonnees(db).length === e0,
      JSON.stringify([a.horsLigne, a.hash, a.courant, lus(db, P.fige).length - l0, ecrDonnees(db).length - e0, norm(a.vue).slice(0, 160)]));
  });

  await bloc("B. le coach dans la fiche de Thomas : Mon suivi, lecture groupée figée", async () => {
    const db = base();
    const { page } = await contexte(b, db, COACH);
    await page.goto(URL0); await pret(page, "#vue"); await attendre(page, 1200);
    await delai(page, 1500);
    await page.evaluate(([id, nom]) => Clients.ouvrir(id, nom, "programme"), [THOMAS, "Thomas Démo"]);   // la fiche s'ouvre sur Mon programme (lecture eq.programme, pas figée)
    await page.waitForSelector("#vue .bandeau", { timeout: 8000 }); await attendre(page, 1500);
    db.fige = ["in.("];
    const e0 = ecrDonnees(db).length;
    await aller(page, "#/suivi");
    await page.waitForSelector("#suivi-reg #page-hors-ligne", { timeout: 10000 }); await attendre(page, 600);
    const f = await horsLigne(page, "#suivi-reg");
    ok("coach, fiche de Thomas (Clients.ouvrir), Mon suivi avec la lecture groupée figée : « Pas de connexion : les données de ce client n'ont pas pu être chargées. » + « Réessayer » dans #suivi-reg (flag grave, role=alert), la fiche toujours ouverte (Store.idConsulte = Thomas), rien d'écrit",
      flagOk(f, TX.horsLigneCoach) && f.dansZone && f.consulte === THOMAS && ecrDonnees(db).length === e0, JSON.stringify([f, ecrDonnees(db).length - e0]));
  });

  await bloc("B. envoi keepalive : jamais abandonné par le délai", async () => {
    const db = base();
    const { page } = await contexte(b, db, THOMAS);
    await page.goto(URL0); await pret(page, "#acc-vue h1"); await attendre(page, 1200);
    const d0 = await delai(page, 1500);
    db.figeEnvois = true;
    const r = await page.evaluate(() => Promise.all([
      Promise.race([Auth.appel("/rest/v1/donnees", { method: "POST", keepalive: true, body: [] }).then(() => "repondu", e => "rejete:" + e.message), new Promise(r => setTimeout(() => r("pendant"), 3000))]),
      Promise.race([Auth.appel("/rest/v1/donnees", { method: "POST", body: [] }).then(() => "repondu", e => "rejete:" + e.message + ":" + (e.reseau === true) + ":" + (e.delai === true)), new Promise(r => setTimeout(() => r("pendant"), 3000))])
    ]));
    ok("Auth.DELAI = 1500 (15000 dans le fichier) : un envoi keepalive sur une route qui ne répond jamais n'est pas rejeté en 3 s (« pendant ») ; le même envoi sans keepalive est abandonné après le délai (TypeError « Failed to fetch », reseau et delai vrais) ; rien n'est arrivé en base",
      d0 === 15000 && r[0] === "pendant" && r[1] === "rejete:Failed to fetch:true:true" && ecrDonnees(db).length === 0, JSON.stringify([d0, r, ecrDonnees(db).length]));
  });

  /* =================== C. écran de connexion : « Service momentanément indisponible » =================== */
  await bloc("C. renouvellement du jeton coupé par le réseau", async () => {
    const db = base(); db.refreshMode = "abort";
    const { page } = await contexte(b, db, THOMAS, { expireLe: Date.now() - 1000 });   // session expirée : l'app la renouvelle au démarrage
    await page.goto(URL0); await page.waitForSelector("#c-go", { timeout: 10000 }); await attendre(page, 800);
    const e = await ecranCo(page);
    ok("session expirée, renouvellement coupé par le réseau (route abandonnée) : l'écran de connexion (#c-go) dit « Service momentanément indisponible, réessaie dans une minute. » (classe erreur), la session reste sur l'appareil, un renouvellement tenté, rien de l'app",
      e.go && e.err === TX.service && /\berreur\b/.test(e.classeErr) && e.session && db.tokens.includes("refresh_token") && e.nav === 0 && !e.vue, JSON.stringify([e, db.tokens]));
  });

  await bloc("C. renouvellement du jeton en 503", async () => {
    const db = base(); db.refreshMode = 503;
    const { page } = await contexte(b, db, THOMAS, { expireLe: Date.now() - 1000 });
    await page.goto(URL0); await page.waitForSelector("#c-go", { timeout: 10000 }); await attendre(page, 800);
    const e = await ecranCo(page);
    ok("session expirée, renouvellement en 503 : même écran de connexion, « Service momentanément indisponible, réessaie dans une minute. » (jamais « Erreur 503 »), la session gardée, rien de l'app",
      e.go && e.err === TX.service && !/Erreur 5/.test(e.err) && e.session && db.tokens.includes("refresh_token") && e.nav === 0 && !e.vue, JSON.stringify([e, db.tokens]));
  });

  await bloc("C. renouvellement refusé (400 invalid_grant)", async () => {
    const db = base(); db.refreshMode = 400;
    const { page } = await contexte(b, db, THOMAS, { expireLe: Date.now() - 1000 });
    await page.goto(URL0); await page.waitForSelector("#c-go", { timeout: 12000 }); await attendre(page, 800);   // l'app laisse 1,5 s à un autre onglet avant d'effacer la session
    const e = await ecranCo(page);
    ok("session expirée, renouvellement refusé (400 invalid_grant) : l'écran de connexion sans un mot (#co-err vide, comme avant), la session effacée (localStorage et sessionStorage), rien de l'app",
      e.go && e.err === "" && !e.session && !e.sessionOnglet && db.tokens.includes("refresh_token") && e.nav === 0 && !e.vue, JSON.stringify([e, db.tokens]));
  });

  const connecter = async (page, email, mdp) => {
    await page.fill("#c-email", email); await page.fill("#c-mdp", mdp); await page.click("#c-go");
    await page.waitForFunction(() => ((document.getElementById("co-err") || {}).textContent || "").trim() !== "", null, { timeout: 8000 }); await attendre(page, 500);
  };
  await bloc("C. connexion par mot de passe en 503", async () => {
    const db = base(); db.login = 503;
    const { page } = await contexte(b, db, null);
    await page.goto(URL0); await page.waitForSelector("#c-go", { timeout: 10000 });
    await connecter(page, "thomas@exemple.fr", "motdepasse1");
    const e = await ecranCo(page);
    ok("sans session, connexion par mot de passe qui reçoit un 503 : « Service momentanément indisponible, réessaie dans une minute. » (jamais « Erreur 503 »), le bouton « Se connecter » redevenu actif, aucune session ouverte, un appel grant_type=password",
      e.err === TX.service && !/Erreur 5/.test(e.err) && e.go && !e.goInactif && e.goTexte === "Se connecter" && !e.session && !e.sessionOnglet && db.tokens.includes("password"), JSON.stringify([e, db.tokens]));
  });

  await bloc("C. connexion par mot de passe coupée par le réseau", async () => {
    const db = base(); db.login = "abort";
    const { page } = await contexte(b, db, null);
    await page.goto(URL0); await page.waitForSelector("#c-go", { timeout: 10000 });
    await connecter(page, "thomas@exemple.fr", "motdepasse1");
    const e = await ecranCo(page);
    ok("sans session, connexion par mot de passe coupée par le réseau (TypeError « Failed to fetch ») : « Service momentanément indisponible, réessaie dans une minute. » (jamais « Failed to fetch »), bouton actif, aucune session, un appel grant_type=password",
      e.err === TX.service && !/Failed to fetch/i.test(e.err) && e.go && !e.goInactif && !e.session && !e.sessionOnglet && db.tokens.includes("password"), JSON.stringify([e, db.tokens]));
  });

  await bloc("C. connexion en anglais, service indisponible", async () => {
    const db = base(); db.login = 503;
    const { page } = await contexte(b, db, null, { langue: "en" });
    await page.goto(URL0); await page.waitForSelector("#c-go", { timeout: 10000 });
    await connecter(page, "thomas@exemple.fr", "motdepasse1");
    const e = await ecranCo(page);
    ok("en anglais (mhx_langue = en, sans session), connexion en 503 : « The service is temporarily unavailable, try again in a minute. », rien en français, bouton actif, aucune session",
      e.lang === "en" && e.err === TX.service_en && !/indisponible|Erreur 5/.test(e.err) && e.go && !e.goInactif && !e.session && !e.sessionOnglet, JSON.stringify([e, db.tokens]));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
