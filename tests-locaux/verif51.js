/* v52 (28/09/2026, Chantier 1 lot C) — mise à jour : le questionnaire court a 3 questions (probleme, obstacle, projection),
   sans âge ; une fois validé, la page de proposition de bilan (vérifiée en détail par verif56), puis l'accueil du prospect
   (Speed Formation, « Réserver mon bilan », case « J'ai réservé »). L'ancien écran « résultat » n'est plus affiché : ses
   vérifications (calories, priorités, recettes, séance) sont retirées, comme celles de la garde 18 ans et des bornes du
   questionnaire (plus d'âge demandé ; garde-fou 18 ans au calculateur, lot D). « Modifier mes réponses » part du Profil.
   Lot D (v52, gratuit pour toujours) : plus de « Jour n/7 » ni de jours restants, plus de verrou de la Speed Formation au
   jour 8 : ces vérifications sont retirées (fonction supprimée) ; côté coach, « inscrit depuis n j » remplace « J n/7 » et
   « terminée » (pastilles, fiche) ; calculateur, Ma progression et Speed Formation ouverts, « Mon journal » en vitrine.
   Chaque attente changée est expliquée par un commentaire « v52 » dans le bloc concerné.
   v53 (nettoyage) : le mode test « jour n » (#/decouverte-jour/N) est retiré (fonction supprimée) : son ancienne adresse
   mène à #/decouverte (bloc F), son ancien drapeau mhx_decouverte_jour resté sur un appareil est effacé au démarrage et
   ne change rien (clic daté du vrai jour, bloc F ; écrans du coach, bloc I) ; commentaires « v53 ». Texte d'origine (v51) :
   v51 — funnel « Découverte » (remplace le Challenge 7 jours) : démarrage du prospect (Jour n/7 depuis
   profils.cree_le, date locale), questionnaire court (manquants, bornes, brouillon pendant la frappe, garde
   18 ans jugée à la sortie du champ âge : « 185 » et « 25 → 15 » ne laissent rien en base, « 30 » envoie),
   validation (court_le posé une fois, événements mhx_tracking), résultat vraiment calculé (kcal refaites ici
   avec les formules de outilCalculateur, priorités qui changent avec les réponses), recettes du catalogue,
   séance, « Modifier » / « Revenir » sans écriture, « Modifier » + « Voir » qui écrit, clics « Réserver mon
   bilan » (en-tête : decouverte ; accompagnement : decouverte-accompagnement) notés une fois chacun, case
   « J'ai réservé » (une seule date, même en double clic), jour 8 (Speed Formation verrouillée, le reste
   visible), anciennes adresses #/challenge…, mode test #/decouverte-jour/8 puis /0, Profil du prospect,
   ancien prospect du challenge, données piégées, anglais, mobile 390 px, coach (Mes clients, fiche, tableau
   de bord, statuts v51 TIÈDE / FROID / CHAUD sur la tuile — mise en avant seulement s'il y a un chaud — et
   sur la page Prospects, pastille « bilan réservé », mode test posé sur l'appareil du coach ; dernière
   activité du prospect datée par rapport à maintenant, donc résultat indépendant du jour où la suite
   tourne) et client Thomas qui ne voit rien de la Découverte. Jour 1 vérifié dans deux fuseaux (UTC+8,
   UTC−5) avec une horloge fixée.
   Supabase simulé : rien ne part vers la vraie base ; les écritures sont appliquées en mémoire, et toute
   autre requête d'écriture vers la base (bibliothèque, Storage, fonctions, compte) est notée aussi.
   Chaque bloc tourne à part : une action impossible (sur l'ancienne version, par exemple) n'arrête que son
   bloc (« ✗ BLOC INTERROMPU ») ; les suivants, dont le client Thomas, tournent quand même.
   Usage : node verif51.js ../index.html                                          */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const PORT = 9681;
const OUT = path.join(__dirname, "captures", "v51"); fs.mkdirSync(OUT, { recursive: true });
const { servirFichier } = require("./fichiers");   // 52.1 : la page charge css/ et js/, servis depuis son dossier (fichiers.js)
const server = http.createServer((req, res) => { if (servirFichier(req, res, HTML)) return; res.writeHead(200, { "Content-Type": "text/html" }); res.end(fs.readFileSync(HTML, "utf8")); });
const res = []; const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
const PROSPECT = "00000000-0000-4000-8000-000000000c04";
const MARC = "00000000-0000-4000-8000-000000000c05";
const CAL = "https://calendly.com/mhx-coaching/30min";
const PRE = "&name=L%C3%A9a&first_name=L%C3%A9a&email=l%40e.fr";
const lienAttendu = source => CAL + "?utm_source=app-mhx&utm_medium=app&utm_content=" + source + PRE;
const norm = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const ilYA = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return iso(d); };
/* inscription il y a n jours, a midi heure locale (le jour 1 = ce jour-la) */
const creeIlYA = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d.toISOString(); };
/* catalogue complet du depot (les 3 recettes de la Decouverte et tous leurs aliments) */
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "donnees", f), "utf8"));
const RECETTES = lireDonnees("recettes.json");
const CATALOGUE = Object.assign({}, F.catalogue, { aliments: lireDonnees("aliments.json"), recettes: RECETTES });

/* deux jeux de reponses connus */
const A = { sexe: "Femme", age: "30", taille: "165", poids: "70", objectif: "Perte de poids / sèche", seances: "3", essaye: "Des régimes trop stricts.", obstacle: "Je manque de temps avec le travail", pourquoi: "Me sentir mieux cet été", motivation: "8" };
const B = { sexe: "Homme", age: "45", taille: "180", poids: "90", objectif: "Prise de muscle", seances: "5", essaye: "", obstacle: "Je grignote le soir", pourquoi: "", motivation: "4" };
const COURT = "2026-09-25T08:00:00.000Z";
const avecCourt = R => Object.assign({}, R, { court_le: COURT });
/* v52 : les 3 réponses du nouveau questionnaire court ; avecChoix : validé ET page de proposition de bilan passée
   (« Pas maintenant ») — l'accueil du prospect s'affiche */
const N = { probleme: "Perdre du gras", obstacle: "Je manque de temps avec le travail", projection: "Me sentir mieux cet été" };
const avecChoix = R => Object.assign(avecCourt(R), { bilan_propose: { choix: "plus_tard", le: COURT } });
/* un ancien prospect du challenge : cle challenge avec jours (case du jour 7 cochee), intake sans court_le */
const jourFait = (n, quand, extra) => Object.assign({ fait: quand + "T08:00:00.000Z", date: quand }, extra || {});
const ANCIEN_CH = (() => { const j = {}; for (let n = 1; n <= 7; n++) j[String(n)] = jourFait(n, ilYA(10 - n)); j["7"].reserve = ilYA(3) + "T09:05:00.000Z"; return { version: 1, debut: ilYA(9), jours: j, cta: { clics: [{ jour: 6, date: ilYA(4) + "T08:00:00.000Z" }] }, termine: ilYA(3) + "T09:00:00.000Z" }; })();
const ANCIEN_INTAKE = { sexe: "Femme", age: "29", taille: "168", poids: "64", poids_obj: "60", objectif: "Perte de poids / sèche", niveau: "Débutant (0 à 6 mois)", seances: "3", lieu: "À la maison", nb_repas: "3 repas", sommeil_h: "6.5", energie: "4", pourquoi: "Retrouver de l'énergie." };

/* les contextes ouverts par le bloc en cours : fermes a la fin du bloc, meme s'il s'arrete en route */
const ouverts = [];
async function bloc(nom, fn){
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); }
}
function base(opts){
  opts = opts || {};
  const profils = JSON.parse(JSON.stringify(F.profils)).concat([{ id: PROSPECT, prenom: "Léa", nom: "", role: "client", cree_le: opts.cree_le || creeIlYA(opts.cree == null ? 2 : opts.cree) }]);
  if (opts.marc) profils.push({ id: MARC, prenom: "Marc", nom: "Essai", role: "client", cree_le: creeIlYA(10) });
  profils.forEach(p => { p.statut = (p.id === PROSPECT || p.id === MARC) ? "prospect" : "client"; });
  const donnees = JSON.parse(JSON.stringify(F.donnees));
  if (opts.intake) donnees.push({ user_id: PROSPECT, outil: "intake", contenu: opts.intake, maj_le: "2026-09-25T08:00:00+00:00" });
  if (opts.challenge) donnees.push({ user_id: PROSPECT, outil: "challenge", contenu: opts.challenge, maj_le: "2026-09-25T08:00:00+00:00" });
  return { profils, donnees, ecritures: [], lectures: [], catalogueVide: !!opts.catalogueVide };
}
/* la derniere activite d'un prospect, pour le coach, est le maj_le le plus recent de ses lignes (Clients.charger).
   Dans l'appli, un clic « Réserver » ou la case « J'ai réservé » reecrit la cle challenge : sa ligne prend la date
   de cette action. Sans cela, le maj_le fixe de base() vieillirait avec le calendrier et ferait passer le prospect
   en FROID (3 jours sans action) des le 28/09/2026 : la verification dependrait du jour ou la suite tourne */
const dateAction = (db, outil, quand) => db.donnees.forEach(x => { if (x.user_id === PROSPECT && x.outil === outil) x.maj_le = quand; });
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext(Object.assign({ viewport: opts.viewport || { width: 1280, height: 900 } }, opts.fuseau ? { timezoneId: opts.fuseau } : {}));
  ouverts.push(c);
  c.setDefaultTimeout(6000);
  await c.route("**/*", async r => {
    const req = r.request(); const u = req.url(); const host = new URL(u).hostname;
    if (host === "localhost") return r.continue();
    if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" });
    if (!host.endsWith(".supabase.co")) return r.abort();
    const url = new URL(u); const p = url.pathname, q = url.searchParams, m = req.method();
    const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", body: body === null ? "" : JSON.stringify(body) });
    if (p.startsWith("/auth/v1/token")) return json(who ? F.session(who.id, who.email) : { error: "invalid" }, who ? 200 : 400);
    /* toute autre ecriture vers la base (compte, bibliotheque, catalogue, Storage, fonctions) est notee aussi : les
       verifications « aucune écriture » la verraient. donnees et profils sont notees plus bas, avec leur contenu */
    if (!["GET", "HEAD", "OPTIONS"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m });
    if (p.startsWith("/auth/v1/")) return json({});
    if (p === "/rest/v1/profils") { if (m !== "GET") { db.ecritures.push({ table: "profils", m }); return json(null, 204); } const id = q.get("id"); return json(id ? db.profils.filter(x => x.id === id.slice(3)) : db.profils); }
    if (p === "/rest/v1/donnees") {
      if (m !== "GET") {
        let rows = []; try { rows = JSON.parse(req.postData() || "[]"); } catch (e) { }
        (Array.isArray(rows) ? rows : [rows]).forEach(row => {
          db.ecritures.push({ table: "donnees", m, user_id: row.user_id, outil: row.outil, contenu: JSON.parse(JSON.stringify(row.contenu)) });
          const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
          const ligne = { user_id: row.user_id, outil: row.outil, contenu: row.contenu, maj_le: row.maj_le || new Date().toISOString() };
          if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        });
        return json(null, 201);
      }
      let l = db.donnees; const uid = q.get("user_id"), o = q.get("outil") || "";
      db.lectures.push({ uid: uid || "", outil: o, select: q.get("select") || "*" });
      if (who && who.id !== F.IDS.coach) l = l.filter(x => x.user_id === who.id && x.outil !== "notes_coach");
      if (uid) l = l.filter(x => x.user_id === uid.slice(3));
      if (o.startsWith("eq.")) l = l.filter(x => x.outil === o.slice(3));
      if (o.startsWith("in.(")) { const k = o.slice(4, -1).split(","); l = l.filter(x => k.includes(x.outil)); }
      if (o.startsWith("not.in.(")) { const k = o.slice(8, -1).split(","); l = l.filter(x => !k.includes(x.outil)); }
      const sel = (q.get("select") || "*").split(","); if (!sel.includes("*")) l = l.map(x => Object.fromEntries(sel.map(k => [k, x[k]])));
      return json(l);
    }
    const t = p.replace("/rest/v1/", "");
    if (CATALOGUE[t]) {
      let l = (db.catalogueVide && (t === "recettes" || t === "aliments")) ? [] : CATALOGUE[t];
      const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); }
      return json(l);
    }
    return json([]);
  });
  await c.addInitScript(({ s, langue, stock }) => {
    if (sessionStorage.getItem("__init")) return; sessionStorage.setItem("__init", "1");   // une seule fois : un rechargement garde l'etat de l'appareil
    if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
    localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
    if (langue) localStorage.setItem("mhx_langue", langue);
    Object.keys(stock).forEach(k => localStorage.setItem(k, stock[k]));   // reglages de l'appareil (ex. mode test)
  }, { s: who ? who.session : null, langue: opts.langue || "", stock: opts.stockage || {} });
  /* horloge fixee (les minuteries continuent de tourner) : pour les cas qui dependent de l'heure */
  if (opts.horloge) await c.clock.setFixedTime(opts.horloge);
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF"); d.dismiss(); });
  return { c, page };
}
const coach = { id: F.IDS.coach, email: "c@e.fr", session: F.session(F.IDS.coach, "c@e.fr") };
const lea = { id: PROSPECT, email: "l@e.fr", session: F.session(PROSPECT, "l@e.fr") };
const thomas = { id: F.IDS.c1, email: "t@e.fr", session: F.session(F.IDS.c1, "t@e.fr") };
const attendre = (page, ms) => page.waitForTimeout(ms);
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1500); };
const texte = async (page, sel) => norm(await page.textContent(sel || "#vue").catch(() => ""));
const eyebrow = page => texte(page, "#vue .masthead .eyebrow");
const lede = page => texte(page, "#vue .masthead .lede");
const valeur = (page, sel) => page.$eval(sel, e => e.value).catch(() => null);
const navIds = page => page.$$eval("#nav a", l => l.map(a => a.dataset.id)).catch(() => []);
const cadenas = page => page.$$eval("#nav a .nav-cadenas", l => l.map(e => e.closest("a").dataset.id).sort()).catch(() => []);
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.user_id === (uid || PROSPECT) && e.outil === outil);
const contenu = (db, outil, uid) => (db.donnees.find(x => x.user_id === (uid || PROSPECT) && x.outil === outil) || {}).contenu;
const suivi = page => page.evaluate(() => { try { return JSON.parse(localStorage.getItem("mhx_tracking") || "[]").map(x => x.event + "|" + x.uid); } catch (e) { return ["illisible"]; } });
/* v52 : les 3 questions (avant : les 10, sexe … motivation, l'âge tapé puis jugé à la sortie du champ) */
const QIDS = ["probleme", "obstacle", "projection"];
const SELECTS = ["probleme"];
async function remplir(page, R){
  for (const k of QIDS) { if (SELECTS.includes(k)) await page.selectOption("#q-" + k, R[k]); else await page.fill("#q-" + k, R[k]); }
}
/* un clic « Réserver mon bilan » sans ouvrir Calendly */
const cliquerCal = (page, sel) => page.evaluate(s => { const a = document.querySelector(s); if (!a) return false; a.addEventListener("click", e => e.preventDefault(), { once: true }); a.click(); return true; }, sel).catch(() => false);
const ligneDe = (page, id) => page.$eval(`[data-ouvrir="${id}"]`, b => b.closest("tr").textContent).then(norm).catch(() => "");
const deborde = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();

  /* ---------- A. Démarrage du prospect ---------- */
  await bloc("A. démarrage", async () => {
    const db = base({ cree: 0 });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    /* v52 (lot D) : « Découverte », sans « Jour n/7 » */
    ok("prospect inscrit aujourd'hui : l'accueil est l'écran Découverte, « Découverte » (sans « Jour n/7 »)", !!(await page.$("#acc-vue, #dc-vue")) && (await eyebrow(page)) === "Découverte", await eyebrow(page));
    const champs = await page.$$eval("#vue [id^='q-']", l => l.map(e => e.id)).catch(() => []);
    /* v52 : les 3 questions (avant : les 10, sexe … motivation, et « Voir mon résultat ») */
    ok("questionnaire court : les 3 questions (objectif principal, ce qui a bloqué, dans 3 mois), sans âge, et « Valider mes réponses »", JSON.stringify(champs) === JSON.stringify(QIDS.map(k => "q-" + k)) && (await texte(page, "#dc-voir")) === "Valider mes réponses", JSON.stringify(champs));
    /* v52 : « 3 questions, 1 minute » (avant : « Commence par ton questionnaire : 3 minutes, 10 questions… ») */
    ok("avant le questionnaire : pas de bouton Calendly, « 3 questions, 1 minute »", !(await page.$("#vue a[href*='calendly']")) && (await lede(page)) === "3 questions, 1 minute : dis-nous où tu en es.", await lede(page));
    ok("démarrage : aucune écriture, aucun événement « page bilan vue »", db.ecritures.length === 0 && !(await suivi(page)).some(x => /^(result_viewed|bilan_viewed)/.test(x)));
    ok("démarrage : événement « diagnostic_started » noté (mhx_tracking) pour ce compte", (await suivi(page)).includes("diagnostic_started|" + PROSPECT), JSON.stringify(await suivi(page)));
    const ids = await navIds(page);
    /* v52 (lot D) : + Ma progression et calculateur ouverts, journal en vitrine */
    ok("navigation : accueil, progression, calculateur, formation, profil ouverts ; programme, journal, nutrition, suivi en vitrine avec cadenas ; ni challenge, ni compléments, bilan", ["accueil", "mensurations", "calculateur", "formation", "profil", "programme", "journal", "nutrition", "suivi"].every(x => ids.includes(x)) && !["challenge", "decouverte", "complements", "bilan"].some(x => ids.includes(x)) && JSON.stringify(await cadenas(page)) === '["journal","nutrition","programme","suivi"]', JSON.stringify(ids) + " cadenas " + JSON.stringify(await cadenas(page)));
    await aller(page, "#/decouverte", 1500);
    ok("#/decouverte : même écran (zone #dc-vue), « Accueil » reste marqué dans la navigation", !!(await page.$("#dc-vue #q-probleme")) && (await page.$eval('#nav a[data-id="accueil"]', a => a.getAttribute("aria-current")).catch(() => null)) === "page");
    await c.close();
  });
  /* v52 (lot D) : fonction supprimée — « A. jour selon l'inscription » (Jour n/7 et jours restants de l'accueil) */
  await bloc("A. fuseaux horaires", async () => {
    /* le jour 1 est la date LOCALE de l'inscription. Chaque cas fixe le fuseau du navigateur ET son horloge (10 h,
       heure locale, aujourd'hui) : une version qui compterait en UTC, ou qui lirait les 10 premiers caracteres de
       cree_le (renvoye en UTC par la base), se trompe a coup sur, quels que soient le fuseau de la machine et
       l'heure du lancement (sans horloge fixee, a 02 h 30 heure de Makassar, UTC donne aussi « Jour 1 ») */
    const dateDans = fuseau => new Intl.DateTimeFormat("en-CA", { timeZone: fuseau }).format(new Date());
    const veille = j => new Date(Date.parse(j + "T12:00:00Z") - 86400000).toISOString().slice(0, 10);
    const cas = [
      /* v52 (lot D) : le jour n'est plus affiché au prospect ; il reste compté (coach : « inscrit depuis n j ») : lu dans la page */
      ["Asia/Makassar", "+08:00", j => j + "T00:30:00", 1, "UTC+8, inscrit aujourd'hui à 00 h 30", "la veille en UTC"],
      ["America/Bogota", "-05:00", j => veille(j) + "T23:30:00", 2, "UTC−5, inscrit hier à 23 h 30", "aujourd'hui en UTC"]
    ];
    for (const [fuseau, dec, inscription, eb, quoi, utc] of cas) {
      const j = dateDans(fuseau), cree = new Date(inscription(j) + dec).toISOString();
      const db = base({ cree_le: cree });
      const { c, page } = await contexte(b, lea, db, { fuseau, horloge: new Date(j + "T10:00:00" + dec) });
      await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
      const reglage = await page.evaluate(() => [Intl.DateTimeFormat().resolvedOptions().timeZone, new Date().getHours()]).catch(() => []);
      const jr = await page.evaluate(() => [Decouverte.jour(Auth.profil, true), Decouverte.depuisTexte(Decouverte.jour(Auth.profil, true))]).catch(() => []);
      ok(`${quoi} (cree_le ${cree.slice(0, 16)}Z, ${utc}), il est 10 h : jour ${eb} (« ${eb === 1 ? "inscrit aujourd'hui" : "inscrit depuis 1 j"} ») — la date locale compte, pas la date UTC`, reglage[0] === fuseau && reglage[1] === 10 && jr[0] === eb && jr[1] === (eb === 1 ? "inscrit aujourd'hui" : "inscrit depuis 1 j") && (await eyebrow(page)) === "Découverte", JSON.stringify(jr) + " · navigateur " + JSON.stringify(reglage));
      await c.close();
    }
  });

  /* ---------- B. Questionnaire ----------
     v52 : 3 questions sans âge ni borne. Les 12 vérifications de la garde 18 ans (« 185 », « 25 → 15 ») et des bornes
     exactes (âge 18 / 90, poids 35 / 250, taille en mètres) sont retirées : plus aucune de ces questions n'est posée au
     prospect ; le garde-fou 18 ans passe au calculateur (lot D). La garde reste dans le code du formulaire, inerte sans
     question « age » (verif56, bloc H, la vérifie en remettant une question d'âge dans la page servie). */
  await bloc("B. manquants", async () => {
    const db = base();
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
    await page.click("#dc-voir"); await attendre(page, 300);   // le message s'efface apres 3,2 s : lu tout de suite
    const msg = await texte(page, "#dc-msg");
    ok("« Valider mes réponses » sans rien remplir : « Il manque : » les 3 questions (toutes requises)", msg === "Il manque : Quel est ton objectif principal ?, Qu'est-ce qui t'a bloqué jusqu'ici ?, Dans 3 mois, qu'est-ce qui aurait changé pour toi ?", msg);
    await attendre(page, 900);   // 1,2 s apres le clic : une ecriture qu'il aurait declenchee (envoi a 700 ms) serait deja la
    const manque = await page.$$eval("#vue .manque", l => l.map(e => e.id).sort()).catch(() => []);
    ok("… les 3 champs sont signalés, rien n'est écrit", manque.length === 3 && db.ecritures.length === 0, JSON.stringify(manque));
    await remplir(page, Object.assign({}, N, { projection: "   " })); await attendre(page, 1500);
    await page.click("#dc-voir"); await attendre(page, 400);
    const msg2 = await texte(page, "#dc-msg"); await attendre(page, 800);
    const I2 = contenu(db, "intake") || {};
    ok("réponse « projection » faite d'espaces seulement : « Il manque : Dans 3 mois… », pas de court_le", msg2 === "Il manque : Dans 3 mois, qu'est-ce qui aurait changé pour toi ?" && !I2.court_le && !(await page.$("#dc-bilan")), msg2 + " · " + JSON.stringify(I2));
    ok("… les autres réponses sont déjà parties en brouillon (objectif principal, ce qui a bloqué)", I2.probleme === N.probleme && I2.obstacle === N.obstacle, JSON.stringify(I2));
    ok("plus aucune question d'âge, de taille ni de poids (aucune borne à vérifier)", !(await page.$("#q-age, #q-taille, #q-poids")), "");
    await c.close();
  });
  await bloc("B. brouillon", async () => {
    /* brouillon pendant la frappe */
    const db = base();
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
    await page.click("#q-obstacle"); await page.keyboard.type("Le temps", { delay: 30 }); await attendre(page, 1500);
    const w = ecr(db, "intake"), I = contenu(db, "intake") || {};
    ok("brouillon : la réponse tapée part pendant la saisie, sans quitter le champ, sans court_le", w.length >= 1 && I.obstacle === "Le temps" && !I.court_le && (await page.evaluate(() => document.activeElement && document.activeElement.id)) === "q-obstacle", "écritures " + w.length + " " + JSON.stringify(I));
    ok("brouillon : événement « diagnostic_question_answered » noté", (await suivi(page)).includes("diagnostic_question_answered|" + PROSPECT));
    await page.reload(); await attendre(page, 2400);
    ok("brouillon : après rechargement, les réponses sont là et le questionnaire reste ouvert", (await valeur(page, "#q-obstacle")) === "Le temps" && !(await page.$("#dc-bilan")));
    await c.close();
  });

  /* ---------- C. Validation, page de proposition de bilan, accueil ----------
     v52 : après la validation, la page de proposition de bilan (verif56 la vérifie en détail), puis l'accueil. L'ancien
     écran « résultat » n'est plus affiché : les 8 vérifications du résultat calculé (calories, tuiles, phrases, 3 priorités,
     recettes, séance et sa vidéo), le jeu B (3) et le catalogue vide (1) sont retirés — leurs morceaux utiles (séance,
     recettes) reviennent dans les pages verrouillées (lot E), le calcul des calories dans le calculateur (lot D). */
  await bloc("C. validation", async () => {
    const db = base();
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
    await remplir(page, N); await attendre(page, 300);
    const t0 = Date.now();
    await page.click("#dc-voir"); await attendre(page, 1600);
    const I = contenu(db, "intake") || {};
    ok("validation : court_le (instant ISO de la validation) et les 3 réponses dans la clé intake (+ l'objectif du questionnaire complet)", typeof I.court_le === "string" && !isNaN(Date.parse(I.court_le)) && Math.abs(Date.parse(I.court_le) - t0) < 10000 && QIDS.every(k => I[k] === N[k]) && I.objectif === "Perte de poids / sèche", JSON.stringify(I));
    ok("validation : la page de proposition de bilan s'affiche (ni questionnaire, ni ancien résultat)", !!(await page.$("#dc-bilan")) && !(await page.$("#q-probleme, #dc-resultat, #dc-calcul, #dc-seance, #dc-recettes")));
    const ev = await suivi(page);
    ok("événements : diagnostic_started, diagnostic_question_answered, diagnostic_completed, bilan_viewed (dans cet ordre)", ["diagnostic_started", "diagnostic_question_answered", "diagnostic_completed", "bilan_viewed"].every(e => ev.includes(e + "|" + PROSPECT)) && ev.indexOf("diagnostic_completed|" + PROSPECT) < ev.indexOf("bilan_viewed|" + PROSPECT) && ev.indexOf("diagnostic_started|" + PROSPECT) < ev.indexOf("diagnostic_question_answered|" + PROSPECT), JSON.stringify(ev));
    const hB = await page.$$eval("#vue a[data-dc-cal]", l => l.map(a => a.getAttribute("href") + "|" + a.textContent.trim())).catch(() => []);
    ok("page bilan : un seul lien Calendly, « Réserver mon bilan », pré-rempli (utm_content=bilan-propose, prénom, email)", JSON.stringify(hB) === JSON.stringify([lienAttendu("bilan-propose") + "|Réserver mon bilan"]), JSON.stringify(hB));
    await page.click("#dc-bilan-plus-tard"); await attendre(page, 1500);
    const hEnTete = await page.$eval("#vue .masthead a[data-dc-cal]", a => a.getAttribute("href") + "|" + a.textContent.trim()).catch(() => "");
    ok("« Pas maintenant » → l'accueil : « Réserver mon bilan » dans l'en-tête, lien pré-rempli (utm_content=decouverte, prénom, email)", hEnTete === lienAttendu("decouverte") + "|Réserver mon bilan", hEnTete);
    const hAcc = await page.$eval("#dc-accomp a[data-dc-cal]", a => a.getAttribute("href")).catch(() => "");
    ok("accompagnement : son bouton porte utm_content=decouverte-accompagnement", hAcc === lienAttendu("decouverte-accompagnement"), hAcc);
    ok("accueil : ni résultat, ni calories, ni séance, ni recettes (l'ancien écran n'est plus affiché)", !(await page.$("#dc-resultat, #dc-calcul, #dc-seance, #dc-recettes")) && !(await texte(page, "#vue")).includes("Tes 3 priorités"));
    ok("pendant la découverte : la Speed Formation est ouverte (lien « Ouvrir la Speed Formation »)", !!(await page.$('#dc-formation a[href="#/formation"]')));
    ok("accompagnement : avantages, bouton Calendly et case « J'ai réservé mon bilan »", (await page.$$("#dc-accomp .liste-debloque li")).length >= 3 && !!(await page.$("#dc-accomp #dc-reserve-case")) && (await texte(page, "#dc-accomp")).includes("J'ai réservé mon bilan"));
    await page.screenshot({ path: path.join(OUT, "accueil-desktop.png"), fullPage: true });
    await c.close();
  });

  /* ---------- D. Modifier mes réponses ----------
     v52 : depuis le Profil (« Modifier mes réponses », #/decouverte/reponses), plus depuis l'écran résultat ; après la
     validation, retour à l'accueil (avant : le résultat recalculé). La vérification « âge 16 puis Voir » devient « réponse
     effacée puis Valider ». */
  await bloc("D. Modifier mes réponses", async () => {
    const db = base({ intake: avecChoix(N) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    ok("questionnaire déjà fait et page bilan passée : l'accueil s'affiche d'emblée, aucune écriture au chargement", !!(await page.$("#dc-accomp")) && !(await page.$("#dc-bilan, #q-probleme")) && db.ecritures.length === 0);
    await aller(page, "#/profil", 1800);
    await page.click('#vue a[href="#/decouverte/reponses"]').catch(() => {}); await attendre(page, 1500);
    ok("« Modifier mes réponses » (Profil) : le questionnaire revient pré-rempli, avec « Annuler les modifications »", (await valeur(page, "#q-probleme")) === N.probleme && (await valeur(page, "#q-obstacle")) === N.obstacle && (await texte(page, "#dc-annuler")) === "Annuler les modifications");
    await page.selectOption("#q-probleme", "Prendre du muscle"); await page.fill("#q-obstacle", "Autre chose"); await attendre(page, 1500);
    ok("en modification : rien ne part pendant la saisie", db.ecritures.length === 0, "écritures " + db.ecritures.length);
    await page.click("#dc-annuler"); await attendre(page, 1200);   // plus que le delai d'envoi (700 ms)
    ok("« Annuler les modifications » : l'accueil, aucune écriture", !!(await page.$("#dc-accomp")) && db.ecritures.length === 0);
    await aller(page, "#/decouverte/reponses", 1500);
    ok("… en rouvrant : les réponses d'avant (« Perdre du gras », obstacle d'avant), pas celles abandonnées", (await valeur(page, "#q-probleme")) === N.probleme && (await valeur(page, "#q-obstacle")) === N.obstacle);
    await page.fill("#q-projection", ""); await page.click("#dc-voir"); await attendre(page, 1200);
    ok("en modification, réponse effacée puis « Valider » : « Il manque : Dans 3 mois… », aucune écriture", (await texte(page, "#dc-msg")) === "Il manque : Dans 3 mois, qu'est-ce qui aurait changé pour toi ?" && db.ecritures.length === 0, await texte(page, "#dc-msg"));
    await page.fill("#q-projection", "Prendre 4 kg de muscle"); await page.selectOption("#q-probleme", "Prendre du muscle"); await page.click("#dc-voir"); await attendre(page, 1600);
    const w = ecr(db, "intake"), I = contenu(db, "intake") || {};
    ok("« Modifier » + « Valider mes réponses » : une écriture, court_le inchangé ; la réponse abandonnée avant « Annuler » (obstacle « Autre chose ») n'est pas entrée", w.length === 1 && I.probleme === "Prendre du muscle" && I.projection === "Prendre 4 kg de muscle" && I.court_le === COURT && I.obstacle === N.obstacle, "écritures " + w.length + " " + JSON.stringify(I));
    ok("… l'objectif posé depuis la réponse « problème » suit (« Prise de muscle »), retour à l'accueil", I.objectif === "Prise de muscle" && !!(await page.$("#dc-accomp")), JSON.stringify(I));
    await c.close();
  });

  /* ---------- E. Réserver mon bilan : clics et case (v52 : sur l'accueil, après la page bilan) ---------- */
  await bloc("E. clics et case", async () => {
    const db = base({ intake: avecChoix(N) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    await cliquerCal(page, "#vue .masthead a[data-dc-cal]"); await attendre(page, 2000);
    const C1 = contenu(db, "challenge") || {}, cl1 = (C1.cta || {}).clics || [];
    ok("clic « Réserver mon bilan » (en-tête) : noté une fois dans la clé challenge (source decouverte, jour 3, date du jour)", cl1.length === 1 && cl1[0].source === "decouverte" && cl1[0].jour === 3 && typeof cl1[0].date === "string" && cl1[0].date.slice(0, 10) === new Date().toISOString().slice(0, 10) && ecr(db, "challenge").length === 1, JSON.stringify(C1));
    ok("clic : événement « call_cta_clicked » noté", (await suivi(page)).includes("call_cta_clicked|" + PROSPECT));
    await cliquerCal(page, "#dc-accomp a[data-dc-cal]"); await attendre(page, 2000);
    const cl2 = ((contenu(db, "challenge") || {}).cta || {}).clics || [];
    ok("clic « Réserver mon bilan » (accompagnement) : un seul clic de plus (source decouverte-accompagnement), le premier gardé", cl2.length === 2 && cl2[0].source === "decouverte" && cl2[1].source === "decouverte-accompagnement" && ecr(db, "challenge").length === 2, JSON.stringify(cl2));
    ok("clics : les 2 clics notés, l'intake n'est pas touché", cl2.length === 2 && ecr(db, "intake").length === 0, "clics " + cl2.length + ", écritures intake " + ecr(db, "intake").length);
    await page.dblclick("#dc-reserve-case").catch(() => {}); await attendre(page, 2200);
    const C3 = contenu(db, "challenge") || {};
    const dates = new Set(ecr(db, "challenge").map(e => e.contenu && e.contenu.reserve).filter(Boolean));
    ok("« J'ai réservé mon bilan » en double clic : une seule date (challenge.reserve), les clics gardés", typeof C3.reserve === "string" && !isNaN(Date.parse(C3.reserve)) && dates.size === 1 && ((C3.cta || {}).clics || []).length === 2, JSON.stringify(C3) + " dates " + JSON.stringify([...dates]));
    ok("… la case devient « Bilan réservé le … », événement « call_booked » une seule fois", (await texte(page, "#dc-reserve")).startsWith("Bilan réservé le") && !(await page.$("#dc-reserve-case")) && (await suivi(page)).filter(x => x === "call_booked|" + PROSPECT).length === 1, await texte(page, "#dc-reserve"));
    const nW = db.ecritures.length;
    await page.reload(); await attendre(page, 2400);
    ok("après rechargement : toujours « Bilan réservé le … », rien de réécrit", (await texte(page, "#dc-reserve")).startsWith("Bilan réservé le") && !(await page.$("#dc-reserve-case")) && db.ecritures.length === nW, await texte(page, "#dc-reserve"));
    await c.close();
  });
  await bloc("E. deux « change »", async () => {
    /* deux « change » coup sur coup (ecriture pas encore partie) : toujours une seule date */
    const db = base({ intake: avecChoix(N) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    await page.evaluate(() => { const cs = document.getElementById("dc-reserve-case"); cs.checked = true; cs.dispatchEvent(new Event("change")); cs.dispatchEvent(new Event("change")); }).catch(() => {});
    await attendre(page, 2600);
    const w = ecr(db, "challenge"), dates = new Set(w.map(e => e.contenu && e.contenu.reserve));
    ok("case « J'ai réservé » déclenchée deux fois de suite : chaque écriture porte la même date", w.length >= 1 && dates.size === 1 && typeof [...dates][0] === "string" && (contenu(db, "challenge") || {}).reserve === [...dates][0], JSON.stringify(w.map(e => e.contenu && e.contenu.reserve)));
    await c.close();
  });

  /* ---------- F. Jour 8, anciennes adresses, mode test ---------- */
  /* v52 (lot D) : fonction supprimée — « F. jour 8 » (Speed Formation verrouillée, « Découverte · terminée ») */
  await bloc("F. adresses, verrous, mode test, profil", async () => {
    const db = base({ intake: avecChoix(N) });
    /* v53 : un ancien drapeau du mode test (jour 8) est resté sur l'appareil de Léa : il est effacé au démarrage */
    const { c, page } = await contexte(b, lea, db, { stockage: { mhx_decouverte_jour: "8" } });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    await aller(page, "#/formation", 1800);
    ok("pendant la découverte : #/formation s'ouvre (pas de verrou)", !(await page.$("#vue .verrou")) && !(await cadenas(page)).includes("formation"));
    for (const h of ["#/challenge", "#/challenge/3", "#/challenge-libre", "#/challenge-rythme"]) {
      await aller(page, h, 1500);
      /* v52 : l'écran Découverte = son accueil (#dc-accomp ; avant : #dc-resultat) */
      ok(`${h} → #/decouverte (écran Découverte)`, (await page.evaluate(() => location.hash)) === "#/decouverte" && !!(await page.$("#dc-vue #dc-accomp")), await page.evaluate(() => location.hash));
    }
    /* v52 (lot D) : Ma progression est ouverte au prospect ; « Mon journal » est verrouillé */
    /* v52 (28/09/2026, Chantier 1 lot E) : #/programme montre d'abord un exemple générique (#ech-programme, « Exemple »),
       puis l'appel « Tu veux un programme construit pour toi… » à la place du texte du verrou (détails : verif56, blocs E1) */
    /* v52 : lots D + E — #/journal (vitrine du lot D) a lui aussi son exemple et l'appel ; compléments et bilan : le verrou */
    const APPEL = "Tu veux un programme construit pour toi, qui évolue chaque semaine ? Réserve ton bilan.", VERROU = "Cette fonctionnalité est disponible avec l'accompagnement MHX.";
    const AVEC_EXEMPLE = ["programme", "journal"];
    for (const [h, id] of [["#/programme", "programme"], ["#/journal", "journal"], ["#/complements", "complements"], ["#/bilan", "bilan"]]) {
      const n0 = db.lectures.length;
      await aller(page, h, 1400);
      const hv = await page.$eval("#vue .verrou a[target=_blank]", a => a.getAttribute("href") + "|" + a.textContent.trim()).catch(() => "");
      const avecEx = AVEC_EXEMPLE.includes(id), tx = avecEx ? APPEL : VERROU, ex = avecEx === !!(await page.$("#vue #ech-" + id + ".echantillon")) && avecEx === !!(await page.$("#vue .echantillon"));
      ok(`${h} : verrouillée (${avecEx ? "l'exemple, puis " : ""}« ${tx} » + « Réserver mon bilan », utm_content=verrou-${id}), aucune donnée lue`, (await texte(page, "#vue .verrou")).includes(tx) && ex && hv === lienAttendu("verrou-" + id) + "|Réserver mon bilan" && db.lectures.length === n0, hv + " · lectures " + JSON.stringify(db.lectures.slice(n0)));
    }
    await cliquerCal(page, "#vue .verrou a[target=_blank]"); await attendre(page, 2000);
    const cl = ((contenu(db, "challenge") || {}).cta || {}).clics || [];
    /* v53 : … daté du vrai jour de la découverte (Léa inscrite il y a 2 jours : jour 3), pas du jour 8 de l'ancien drapeau */
    ok("clic depuis une page verrouillée (#/bilan) : noté avec la source verrou-bilan, au vrai jour (3, pas le 8 de l'ancien drapeau du mode test)", cl.length === 1 && cl[0].source === "verrou-bilan" && cl[0].jour === 3, JSON.stringify(cl));
    /* v52 (lot D) : fonction supprimée — mode test #/decouverte-jour/8 (Speed Formation verrouillée, « terminée ») et /0 */
    /* v53 : fonction supprimée — le mode test lui-même ; son ancienne adresse mène simplement à la Découverte */
    await aller(page, "#/profil", 900);
    const nJ = db.ecritures.length;
    await aller(page, "#/decouverte-jour/8", 1500);
    ok("v53 : ancienne adresse #/decouverte-jour/8 → #/decouverte (écran Découverte) ; l'ancien drapeau mhx_decouverte_jour de l'appareil est effacé et pas reposé ; rien d'écrit", (await page.evaluate(() => location.hash)) === "#/decouverte" && !!(await page.$("#dc-vue #dc-accomp")) && (await page.evaluate(() => localStorage.getItem("mhx_decouverte_jour"))) === null && db.ecritures.length === nJ, (await page.evaluate(() => location.hash + " | " + localStorage.getItem("mhx_decouverte_jour"))) + " | " + JSON.stringify(db.ecritures.slice(nJ).map(e => e.outil || e.table)));
    /* profil — v52 : ses réponses et « Modifier mes réponses » (#/decouverte/reponses) ; avant : « Voir mon résultat » (#/decouverte) */
    await aller(page, "#/profil", 1800);
    const pr = await texte(page, "#vue");
    ok("Profil du prospect : « Tes réponses au questionnaire sont enregistrées… », ses 3 réponses, « Modifier mes réponses » (#/decouverte/reponses), pas de questionnaire complet", pr.includes("Tes réponses au questionnaire sont enregistrées") && pr.includes(N.obstacle) && pr.includes(N.projection) && (await texte(page, '#vue a[href="#/decouverte/reponses"]')) === "Modifier mes réponses" && !(await page.$("#q-nom")));
    await page.click('#vue a[href="#/decouverte/reponses"]').catch(() => {}); await attendre(page, 1500);
    ok("… « Modifier mes réponses » ouvre ses 3 réponses en modification", !!(await page.$("#dc-vue #q-probleme")) && !!(await page.$("#dc-annuler")) && (await valeur(page, "#q-projection")) === N.projection);
    await c.close();
  });

  /* ---------- G. Ancien prospect du challenge, données piégées ---------- */
  await bloc("G. ancien prospect du challenge", async () => {
    const db = base({ cree: 9, intake: ANCIEN_INTAKE, challenge: ANCIEN_CH });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/7`); await attendre(page, 2600);
    /* v52 : les 3 nouvelles questions (avant : le questionnaire court de 10 pré-rempli, 29 ans, 64 kg) */
    ok("ancien prospect du challenge (#/challenge/7) : « Découverte » (v52 : jamais « terminée »), les 3 questions (pas d'âge ni de poids redemandés), rien d'écrit", (await page.evaluate(() => location.hash)) === "#/decouverte" && (await eyebrow(page)) === "Découverte" && !!(await page.$("#q-probleme")) && !(await page.$("#q-age, #q-poids")) && db.ecritures.length === 0, await eyebrow(page));
    await page.click("#dc-voir"); await attendre(page, 300);
    ok("… il manque les 3 réponses", (await texte(page, "#dc-msg")) === "Il manque : Quel est ton objectif principal ?, Qu'est-ce qui t'a bloqué jusqu'ici ?, Dans 3 mois, qu'est-ce qui aurait changé pour toi ?", await texte(page, "#dc-msg"));
    await remplir(page, N); await page.click("#dc-voir"); await attendre(page, 1600);
    const I = contenu(db, "intake") || {};
    ok("… validé : court_le posé, ses anciennes réponses gardées (niveau, lieu, poids objectif, âge 29, objectif d'avant)", typeof I.court_le === "string" && I.niveau === ANCIEN_INTAKE.niveau && I.lieu === ANCIEN_INTAKE.lieu && I.poids_obj === "60" && I.age === "29" && I.objectif === ANCIEN_INTAKE.objectif && I.projection === N.projection, JSON.stringify(I));
    await page.click("#dc-bilan-plus-tard").catch(() => {}); await attendre(page, 1500);
    ok("… page bilan puis « Pas maintenant » : l'accueil, case du jour 7 lue : « Bilan réservé le … »", !!(await page.$("#dc-accomp")) && (await texte(page, "#dc-reserve")).startsWith("Bilan réservé le") && !(await page.$("#dc-reserve-case")), await texte(page, "#dc-reserve"));
    await cliquerCal(page, "#dc-accomp a[data-dc-cal]"); await attendre(page, 2000);
    const C = contenu(db, "challenge") || {};
    ok("… un clic s'ajoute à ses anciens clics ; ses jours et sa case du jour 7 restent intacts", ((C.cta || {}).clics || []).length === 2 && C.cta.clics[1].source === "decouverte-accompagnement" && C.jours && C.jours["1"] && C.jours["1"].fait === ANCIEN_CH.jours["1"].fait && C.jours["7"].reserve === ANCIEN_CH.jours["7"].reserve, JSON.stringify(C).slice(0, 300));
    await c.close();
  });
  await bloc("G. données piégées (types faux)", async () => {
    /* donnees piegees, questionnaire pas fait (court_le d'un mauvais type) */
    const db = base({ intake: { court_le: 12345, probleme: { x: 1 }, age: { x: 1 }, sexe: ["Homme"], taille: "<b>x</b>", poids: null, obstacle: "<img src=x onerror=\"window.__xss=1\">", projection: "<script>window.__xss=1</script>", motivation: "<script>window.__xss=1</script>" }, challenge: { cta: "n'importe quoi", jours: [1, 2], reserve: 42 } });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    ok("données piégées (court_le nombre, problème objet, HTML) : le questionnaire s'affiche, aucune injection, aucune écriture", !!(await page.$("#q-probleme")) && !(await page.evaluate(() => window.__xss)) && !(await page.$("#vue img[src='x'], #vue script")) && (await valeur(page, "#q-obstacle")) === "<img src=x onerror=\"window.__xss=1\">" && db.ecritures.length === 0);
    await c.close();
  });
  await bloc("G. données piégées (premier niveau)", async () => {
    /* donnees piegees au premier niveau : intake en texte, challenge en liste */
    const db = base({ intake: "texte brut", challenge: [1, 2, 3] });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    await remplir(page, N); await attendre(page, 1500);
    const I = contenu(db, "intake");
    ok("intake en texte, challenge en liste : le questionnaire s'affiche vide, le brouillon part comme un objet normal", !!I && typeof I === "object" && !Array.isArray(I) && I.probleme === N.probleme && I.obstacle === N.obstacle && !("0" in I), JSON.stringify(I));
    await page.click("#dc-voir").catch(() => {}); await attendre(page, 1600);
    /* v52 : le clic part de la page de proposition de bilan (avant : de l'en-tête du résultat) */
    await cliquerCal(page, "#dc-bilan-reserver"); await attendre(page, 2000);
    const C = contenu(db, "challenge");
    ok("… validé puis clic « Réserver mon bilan » (page bilan) : la clé challenge est réécrite comme un objet (cta.clics = 1 clic)", !!C && typeof C === "object" && !Array.isArray(C) && ((C.cta || {}).clics || []).length === 1 && C.cta.clics[0].source === "bilan-propose", JSON.stringify(C));
    await c.close();
  });
  await bloc("G. données piégées et coach", async () => {
    /* donnees piegees, questionnaire fait : page bilan puis accueil, cle challenge aux types faux.
       v52 : la page bilan (phrase neutre : pas de projection) remplace le résultat qui citait l'obstacle */
    const intake = Object.assign({}, A, { court_le: COURT, obstacle: "<img src=x onerror=\"window.__xss=1\">", essaye: { a: 1 }, pourquoi: 42, motivation: "<b>9</b>", seances: ["3"], projection: { p: 1 } });
    const challenge = { cta: { clics: [null, 5, "x", { date: "<script>window.__xss=1</script>", source: "<img src=x onerror=window.__xss=1>" }] }, reserve: { d: 1 }, jours: "abc" };
    const db = base({ intake, challenge });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2600);
    const r = await texte(page, "#dc-bilan");
    ok("données piégées (obstacle en HTML, déjà essayé objet, pourquoi nombre, projection objet) : page bilan affichée, phrase neutre, aucune injection", !!(await page.$("#dc-bilan")) && (await texte(page, "#dc-projection")) === "Faisons le point ensemble sur ton objectif." && !r.includes("[object Object]") && !(await page.evaluate(() => window.__xss)) && !(await page.$("#vue img[src='x']")), r.slice(0, 200));
    await page.click("#dc-bilan-plus-tard").catch(() => {}); await attendre(page, 1500);
    ok("… clé challenge piégée (clics douteux, reserve objet, jours texte) : l'accueil et la case « J'ai réservé » s'affichent normalement", !!(await page.$("#dc-reserve-case")));
    await cliquerCal(page, "#vue .masthead a[data-dc-cal]"); await attendre(page, 2000);
    const cl = ((contenu(db, "challenge") || {}).cta || {}).clics || [];
    ok("… un clic sur cette clé piégée : noté sans erreur (source decouverte)", cl.length >= 1 && (cl[cl.length - 1] || {}).source === "decouverte" && !(await page.evaluate(() => window.__xss)), JSON.stringify(cl).slice(0, 200));
    await c.close();
    const db2 = base({ intake, challenge });
    const { c: c2, page: p2 } = await contexte(b, coach, db2);
    await p2.goto(`http://localhost:${PORT}/#/clients`); await attendre(p2, 2400);
    const l = await ligneDe(p2, PROSPECT);
    await p2.click(`[data-ouvrir="${PROSPECT}"]`).catch(() => {}); await attendre(p2, 2200);
    ok("coach : prospect aux données piégées — pastille « Découverte · inscrit depuis 2 j » (v52 ; avant : « J3/7 »), bloc « Découverte » de la fiche lisible, aucune injection", l.includes("Découverte · inscrit depuis 2 j") && !!(await p2.$("#fiche-decouverte")) && (await texte(p2, "#fiche-decouverte")).includes("Obstacle principal") && !(await p2.evaluate(() => window.__xss)) && !(await p2.$("#vue img[src='x']")) && db2.ecritures.length === 0, l);
    await c2.close();
  });

  /* ---------- H. Anglais, mobile ---------- */
  await bloc("H. anglais, questionnaire", async () => {
    const db = base();
    const { c, page } = await contexte(b, lea, db, { langue: "en" });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    /* v52 : « Submit my answers » (avant : « See my result ») */
    ok("anglais : « Discovery » (v52 : sans « Day n/7 »), « Your questionnaire », « Submit my answers »", (await eyebrow(page)) === "Discovery" && (await texte(page, "#vue")).includes("Your questionnaire") && (await texte(page, "#dc-voir")) === "Submit my answers", await eyebrow(page));
    await page.click("#dc-voir"); await attendre(page, 300);
    ok("anglais : « Missing: … » si rien n'est rempli", (await texte(page, "#dc-msg")).startsWith("Missing: "), await texte(page, "#dc-msg"));
    await c.close();
  });
  await bloc("H. anglais, page bilan et accueil", async () => {
    /* v52 : la page bilan puis l'accueil (avant : le résultat, « Your result », « Your 3 priorities »…) */
    const db = base({ intake: avecCourt(N) });
    const { c, page } = await contexte(b, lea, db, { langue: "en" });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2600);
    const vb = await texte(page, "#vue");
    ok("anglais : page bilan (« Your next step », « Book my assessment », « Not now, explore my space »), aucun texte français de la page", vb.includes("Your next step") && (await texte(page, "#dc-bilan-reserver")) === "Book my assessment" && (await texte(page, "#dc-bilan-plus-tard")) === "Not now, explore my space" && !vb.includes("Réserver mon bilan") && !vb.includes("Ta prochaine étape") && !vb.includes("Pas maintenant"), vb.slice(0, 300));
    await page.click("#dc-bilan-plus-tard"); await attendre(page, 1500);
    const v = await texte(page, "#vue");
    ok("anglais : accueil (« With MHX coaching », « I booked my assessment », Speed Formation)", ["With MHX coaching", "I booked my assessment", "Speed Formation"].every(x => v.includes(x)), v.slice(0, 300));
    ok("anglais : « Book my assessment » (en-tête et accompagnement), aucun « Réserver mon bilan »", (await texte(page, "#vue .masthead a[data-dc-cal]")) === "Book my assessment" && (await texte(page, "#dc-accomp a[data-dc-cal]")) === "Book my assessment" && !v.includes("Réserver mon bilan") && !v.includes("Avec l'accompagnement MHX"));
    await aller(page, "#/decouverte/reponses", 1500);
    ok("anglais : « Modifier mes réponses » → « Submit my answers » et « Discard changes »", (await texte(page, "#dc-voir")) === "Submit my answers" && (await texte(page, "#dc-annuler")) === "Discard changes");
    await aller(page, "#/programme", 1400);
    /* v52 (lot E) : #/programme a son exemple, puis l'appel en anglais à la place de « This feature is available… » */
    ok("anglais : page verrouillée « Want a program built for you that evolves every week? Book your assessment. » + « Book my assessment »", (await texte(page, "#vue .verrou")).includes("Want a program built for you that evolves every week? Book your assessment.") && (await texte(page, "#vue .verrou a[target=_blank]")) === "Book my assessment");
    await c.close();
  });
  await bloc("H. mobile, questionnaire", async () => {
    const db = base();
    const { c, page } = await contexte(b, lea, db, { viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    ok("mobile 390 px : questionnaire sans débordement horizontal", !!(await page.$("#q-probleme")) && !(await deborde(page)), String(await page.evaluate(() => document.documentElement.scrollWidth)));
    await page.click("#dc-voir"); await attendre(page, 400);
    ok("mobile 390 px : message « Il manque » affiché, toujours sans débordement", (await texte(page, "#dc-msg")).startsWith("Il manque") && !(await deborde(page)));
    const barre = await page.$$eval("#barre-bas a", l => l.map(a => a.dataset.id)).catch(() => []);
    /* v52 (lot D) : la barre du bas du prospect est Accueil, Calculateur, Progression, Speed Formation (le Profil passe dans « Plus ») */
    ok("mobile : barre du bas Accueil, Calculateur, Progression, Speed Formation, sans Challenge", JSON.stringify(barre) === '["accueil","calculateur","mensurations","formation"]' && !barre.includes("challenge"), JSON.stringify(barre));
    await page.screenshot({ path: path.join(OUT, "questionnaire-mobile.png"), fullPage: true });
    await c.close();
  });
  await bloc("H. mobile, page bilan et accueil", async () => {
    /* v52 : réponse « projection » très longue sur la page bilan, puis l'accueil (avant : le résultat, vidéo ouverte) */
    const db = base({ intake: avecCourt(Object.assign({}, N, { projection: "Une projection très longue ".repeat(12) })) });
    const { c, page } = await contexte(b, lea, db, { viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2600);
    const bilanOk = !!(await page.$("#dc-bilan")) && !(await deborde(page));
    await page.screenshot({ path: path.join(OUT, "bilan-mobile.png"), fullPage: true });
    await page.click("#dc-bilan-plus-tard").catch(() => {}); await attendre(page, 1500);
    ok("mobile 390 px : page bilan (réponse très longue) puis accueil (Speed Formation, accompagnement) — sans débordement", bilanOk && !!(await page.$("#dc-accomp")) && !(await deborde(page)), String(await page.evaluate(() => document.documentElement.scrollWidth)));
    await page.screenshot({ path: path.join(OUT, "accueil-mobile.png"), fullPage: true });
    await c.close();
  });

  /* ---------- I. Coach ---------- */
  await bloc("I. coach", async () => {
    const ch = { version: 1, jours: {}, cta: { clics: [{ jour: 3, source: "decouverte", date: new Date().toISOString() }] } };
    const db = base({ intake: avecCourt(A), challenge: ch, marc: true });
    dateAction(db, "challenge", ch.cta.clics[0].date);   // le clic d'aujourd'hui a reecrit challenge : Léa est active
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/tableau`); await attendre(page, 2600);
    /* v53 (chantier 4) : plus de tuile « Prospects en découverte » ni de température (TIÈDE / FROID / CHAUD) : retirées (2),
       les nouvelles tuiles et la page Prospects sont vérifiées par verif58 */
    await aller(page, "#/clients", 2200);
    const lLea = await ligneDe(page, PROSPECT), lMarc = await ligneDe(page, MARC);
    /* v52 (lot D) : « inscrit depuis n j » (avant : « Découverte J3/7 » / « Découverte terminée ») */
    ok("Mes clients : Léa « Découverte · inscrit depuis 2 j » + « a cliqué Réserver » ; Marc « Découverte · inscrit depuis 10 j »", lLea.includes("Découverte · inscrit depuis 2 j") && lLea.includes("a cliqué Réserver") && lMarc.includes("Découverte · inscrit depuis 10 j") && !/J\d+\/7|terminée/.test(lLea + lMarc), lLea + " | " + lMarc);
    await page.click(`[data-ouvrir="${PROSPECT}"]`).catch(() => {}); await attendre(page, 2200);
    const f = await texte(page, "#fiche-decouverte");
    ok("fiche de Léa : bloc « Découverte » (inscrit depuis 2 j — v52 ; avant : jour 3 / 7 —, questionnaire rempli, objectif, motivation 8 / 10, 1 clic, case pas cochée)", f.includes("inscrit depuis 2 j") && !f.includes("/ 7") && f.includes("rempli le") && f.includes("Perte de poids / sèche") && f.includes("8 / 10") && f.includes("1 clic") && f.includes("pas cochée"), f.slice(0, 300));
    ok("fiche de Léa : lienCalendly() rend l'adresse brute pour le coach, aucune écriture (tableau de bord, page Prospects, Mes clients, fiche)", (await page.evaluate(() => typeof lienCalendly === "function" ? lienCalendly("decouverte") : null)) === CAL && db.ecritures.length === 0);
    await c.close();
  });
  await bloc("I. coach, bilan réservé et mode test", async () => {
    /* Léa a coché « J'ai réservé mon bilan » ; le mode test du prospect (jour 8) est pose sur l'appareil du coach :
       il ne vaut que sur l'appareil du prospect, les ecrans du coach n'en tiennent pas compte
       v53 : fonction supprimée — le mode test n'existe plus ; l'ancien drapeau resté sur l'appareil du coach est efface
       au demarrage, et les ecrans du coach sont inchanges */
    const ch = { version: 1, jours: {}, cta: { clics: [{ jour: 2, source: "decouverte", date: creeIlYA(1) }] }, reserve: new Date().toISOString() };
    const db = base({ intake: avecCourt(A), challenge: ch, marc: true });
    dateAction(db, "challenge", ch.reserve);   // la case cochée aujourd'hui a reecrit challenge
    const { c, page } = await contexte(b, coach, db, { stockage: { mhx_decouverte_jour: "8" } });
    await page.goto(`http://localhost:${PORT}/#/tableau`); await attendre(page, 2600);
    /* v53 (chantier 4) : plus de tuile « Prospects en découverte » ni de température : la partie « tuile » de cette
       vérification et « Léa CHAUD, Marc FROID » (page Prospects) sont retirées (1) ; l'effacement du drapeau reste vérifié */
    ok("v53 : ancien drapeau du mode test (mhx_decouverte_jour = 8) sur l'appareil du coach : effacé au démarrage ; le tableau de bord s'affiche (Prospects : 2)", (await page.evaluate(() => localStorage.getItem("mhx_decouverte_jour"))) === null && (await texte(page, "#tb-t-prospects .t-val")) === "2", await texte(page, "#tb-vue"));
    await aller(page, "#/clients", 2200);
    const lLea = await ligneDe(page, PROSPECT), lMarc = await ligneDe(page, MARC);
    ok("Mes clients (même appareil) : Léa « Découverte · inscrit depuis 2 j » + « bilan réservé » (et pas « a cliqué Réserver ») ; Marc « Découverte · inscrit depuis 10 j » (v52)", lLea.includes("Découverte · inscrit depuis 2 j") && lLea.includes("bilan réservé") && !lLea.includes("a cliqué Réserver") && lMarc.includes("Découverte · inscrit depuis 10 j"), lLea + " | " + lMarc);
    await page.click(`[data-ouvrir="${PROSPECT}"]`).catch(() => {}); await attendre(page, 2200);
    const f = await texte(page, "#fiche-decouverte");
    /* v53 (chantier 4) : la case du prospect se lit « Le prospect a coché « J'ai réservé » le … » (le coach coche lui-même « Bilan réservé ») */
    ok("fiche de Léa (même appareil) : « inscrit depuis 2 j » (v52 ; avant : « jour 3 / 7 »), case « Le prospect a coché « J'ai réservé » le … », pastille « bilan réservé » ; aucune écriture (tableau de bord, Mes clients, fiche)", f.includes("inscrit depuis 2 j") && f.includes("Le prospect a coché « J'ai réservé » le") && f.includes("bilan réservé") && db.ecritures.length === 0, f.slice(0, 300));
    await c.close();
  });

  /* ---------- J. Client Thomas : rien de la Découverte ---------- */
  await bloc("J. client Thomas", async () => {
    const db = base();
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    const rien = async () => !(await page.$("#dc-vue, #dc-resultat, #q-motivation, [data-dc-cal], #vue .verrou")) && !(await texte(page, "#vue")).includes("Découverte") && !(await texte(page, "#vue")).includes("Réserver mon bilan");
    ok("client Thomas : son accueil habituel, rien de la Découverte, aucun cadenas", !!(await page.$("#acc-vue")) && (await rien()) && (await cadenas(page)).length === 0 && !(await navIds(page)).includes("decouverte"));
    await aller(page, "#/decouverte", 1800);
    ok("client Thomas tape #/decouverte : il reste sur son accueil, rien de la Découverte", !!(await page.$("#acc-vue")) && (await rien()));
    /* v53 : #/decouverte-jour/8 = l'ancienne adresse du mode test (supprimé) : comme #/decouverte, son accueil */
    await aller(page, "#/decouverte-jour/8", 2000);
    ok("client Thomas tape #/decouverte-jour/8 (ancienne adresse du mode test) : son accueil, rien de la Découverte, aucun cadenas", !!(await page.$("#acc-vue")) && (await rien()) && (await cadenas(page)).length === 0);
    await aller(page, "#/formation", 1800);
    ok("client Thomas (après #/decouverte-jour/8) : Speed Formation ouverte, pas de verrou", !(await page.$("#vue .verrou")) && (await texte(page, "#vue")).length > 50);
    await aller(page, "#/challenge", 1800);
    ok("client Thomas tape #/challenge : son accueil, rien de la Découverte ; aucune écriture de toute la visite", !!(await page.$("#acc-vue")) && (await rien()) && db.ecritures.length === 0);
    await c.close();
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
function bilan(){ const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length; console.log(res.join("\n")); console.log(nb + "/" + tot); }
