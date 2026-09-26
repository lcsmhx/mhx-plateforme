/* v51 — funnel « Découverte » (remplace le Challenge 7 jours) : démarrage du prospect (Jour n/7 depuis
   profils.cree_le, date locale), questionnaire court (manquants, bornes, brouillon pendant la frappe, garde
   18 ans jugée à la sortie du champ âge : « 185 » et « 25 → 15 » ne laissent rien en base, « 30 » envoie),
   validation (court_le posé une fois, événements mhx_tracking), résultat vraiment calculé (kcal refaites ici
   avec les formules de outilCalculateur, priorités qui changent avec les réponses), recettes du catalogue,
   séance, « Modifier » / « Revenir » sans écriture, « Modifier » + « Voir » qui écrit, clics « Réserver mon
   bilan » (en-tête : decouverte ; accompagnement : decouverte-accompagnement) notés une fois chacun, case
   « J'ai réservé » (une seule date, même en double clic), jour 8 (Speed Formation verrouillée, le reste
   visible), anciennes adresses #/challenge…, mode test #/decouverte-jour/8 puis /0, Profil du prospect,
   ancien prospect du challenge, données piégées, anglais, mobile 390 px, coach (Mes clients, fiche, tableau
   de bord, pastille « bilan réservé », mode test posé sur l'appareil du coach) et client Thomas qui ne voit
   rien de la Découverte. Jour 1 vérifié dans deux fuseaux (UTC+8, UTC−5) avec une horloge fixée.
   Supabase simulé : rien ne part vers la vraie base ; les écritures sont appliquées en mémoire, et toute
   autre requête d'écriture vers la base (bibliothèque, Storage, fonctions, compte) est notée aussi.
   Chaque bloc tourne à part : une action impossible (sur l'ancienne version, par exemple) n'arrête que son
   bloc (« ✗ BLOC INTERROMPU ») ; les suivants, dont le client Thomas, tournent quand même.
   Usage : node verif51.js ../index.html                                          */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const PORT = 9681;
const OUT = path.join(__dirname, "captures", "v51"); fs.mkdirSync(OUT, { recursive: true });
const server = http.createServer((req, res) => { res.writeHead(200, { "Content-Type": "text/html" }); res.end(fs.readFileSync(HTML, "utf8")); });
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
const QIDS = ["sexe", "age", "taille", "poids", "objectif", "seances", "essaye", "obstacle", "pourquoi", "motivation"];
const SELECTS = ["sexe", "objectif", "seances", "motivation"];
/* l'age se tape puis on quitte le champ (Tab) : c'est a ce moment qu'il est juge */
const taperAge = async (page, v) => { await page.fill("#q-age", v); await page.press("#q-age", "Tab"); };
async function remplir(page, R){
  await taperAge(page, R.age);
  for (const k of QIDS) {
    if (k === "age") continue;
    if (SELECTS.includes(k)) await page.selectOption("#q-" + k, R[k]); else await page.fill("#q-" + k, R[k]);
  }
}
/* un clic « Réserver mon bilan » sans ouvrir Calendly */
const cliquerCal = (page, sel) => page.evaluate(s => { const a = document.querySelector(s); if (!a) return false; a.addEventListener("click", e => e.preventDefault(), { once: true }); a.click(); return true; }, sel).catch(() => false);
const tuiles = (page, sel) => page.$$eval(sel + " .tile", l => l.map(t => ({ lbl: t.querySelector(".t-lbl").textContent.trim(), val: (t.querySelector(".t-val").firstChild || { textContent: "" }).textContent.replace(/[  ]/g, " ").trim() }))).catch(() => []);
const tuile = (ts, lbl) => (ts.find(t => t.lbl === lbl) || {}).val;
const priorites = page => page.$$eval("#dc-resultat ol.etapes li", l => l.map(e => e.textContent.replace(/[  ]/g, " ").trim())).catch(() => []);
const ligneDe = (page, id) => page.$eval(`[data-ouvrir="${id}"]`, b => b.closest("tr").textContent).then(norm).catch(() => "");
const deborde = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
/* les formules du calculateur, refaites ici (Mifflin-St Jeor × facteur d'activite ; pas par defaut de la Decouverte) */
const milliers = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
function attendu(R, K, pas){
  const bmr = 10 * +R.poids + 6.25 * +R.taille - 5 * +R.age + (R.sexe === "Femme" ? -161 : 5);
  const f = K.facteur_base + Math.min(pas, K.plafond_pas) / 10000 * K.bonus_10000_pas + Math.min(+R.seances * 1.25, K.plafond_heures) * K.bonus_par_heure;
  const T = bmr * f, sens = /perte|s[èe]che/i.test(R.objectif) ? "perte" : /prise|masse/i.test(R.objectif) ? "prise" : "maintien";
  const cible = sens === "perte" ? T * (1 - K.deficit_perte) : sens === "prise" ? T * (1 + K.surplus_prise) : T;
  const prot = K.proteines_g_par_kg * +R.poids, lip = K.lipides_g_par_kg * +R.poids;
  return { T: milliers(T), cible: milliers(cible), prot: milliers(prot), lip: milliers(lip), gluc: milliers(Math.max((cible - prot * 4 - lip * 9) / 4, 0)) };
}

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();

  /* ---------- A. Démarrage du prospect ---------- */
  await bloc("A. démarrage", async () => {
    const db = base({ cree: 0 });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    ok("prospect inscrit aujourd'hui : l'accueil est l'écran Découverte, « Découverte · Jour 1/7 »", !!(await page.$("#acc-vue, #dc-vue")) && (await eyebrow(page)) === "Découverte · Jour 1/7", await eyebrow(page));
    const champs = await page.$$eval(QIDS.map(k => "#q-" + k).join(","), l => l.map(e => e.id)).catch(() => []);
    ok("questionnaire court : les 10 questions (sexe, âge, taille, poids, objectif, séances, déjà essayé, obstacle, pourquoi, motivation) et « Voir mon résultat »", champs.length === 10 && !!(await page.$("#dc-voir")), JSON.stringify(champs));
    ok("avant le questionnaire : pas de bouton Calendly, « Commence par ton questionnaire »", !(await page.$("#vue a[href*='calendly']")) && (await lede(page)).startsWith("Commence par ton questionnaire"), await lede(page));
    ok("démarrage : aucune écriture, aucun événement « résultat vu »", db.ecritures.length === 0 && !(await suivi(page)).some(x => x.startsWith("result_viewed")));
    ok("démarrage : événement « diagnostic_started » noté (mhx_tracking) pour ce compte", (await suivi(page)).includes("diagnostic_started|" + PROSPECT), JSON.stringify(await suivi(page)));
    const ids = await navIds(page);
    ok("navigation : accueil, formation, profil ouverts ; programme, nutrition, suivi en vitrine avec cadenas ; ni challenge, ni mensurations, compléments, bilan", ["accueil", "formation", "profil", "programme", "nutrition", "suivi"].every(x => ids.includes(x)) && !["challenge", "decouverte", "mensurations", "complements", "bilan"].some(x => ids.includes(x)) && JSON.stringify(await cadenas(page)) === '["nutrition","programme","suivi"]', JSON.stringify(ids) + " cadenas " + JSON.stringify(await cadenas(page)));
    await aller(page, "#/decouverte", 1500);
    ok("#/decouverte : même écran (zone #dc-vue), « Accueil » reste marqué dans la navigation", !!(await page.$("#dc-vue #q-age")) && (await page.$eval('#nav a[data-id="accueil"]', a => a.getAttribute("aria-current")).catch(() => null)) === "page");
    await c.close();
  });
  await bloc("A. jour selon l'inscription", async () => {
    /* le jour suit la date d'inscription (date locale) */
    const cas = [[3, null, "Découverte · Jour 4/7", "Commence par ton questionnaire"], [2, avecCourt(A), "Découverte · Jour 3/7", "Encore 5 jours d'accès découverte."], [6, avecCourt(A), "Découverte · Jour 7/7", "Dernier jour de ton accès découverte."], [7, avecCourt(A), "Découverte · terminée", "Ta période découverte est terminée."]];
    for (const [n, intake, eb, ld] of cas) {
      const db = base({ cree: n, intake });
      const { c, page } = await contexte(b, lea, db);
      await page.goto(`http://localhost:${PORT}/#/accueil`); await attendre(page, 2200);
      ok(`inscrit il y a ${n} jour${n > 1 ? "s" : ""}${intake ? ", questionnaire fait" : ""} : « ${eb} », « ${ld.slice(0, 40)}… »`, (await eyebrow(page)) === eb && (await lede(page)).startsWith(ld), (await eyebrow(page)) + " / " + (await lede(page)));
      await c.close();
    }
  });
  await bloc("A. fuseaux horaires", async () => {
    /* le jour 1 est la date LOCALE de l'inscription. Chaque cas fixe le fuseau du navigateur ET son horloge (10 h,
       heure locale, aujourd'hui) : une version qui compterait en UTC, ou qui lirait les 10 premiers caracteres de
       cree_le (renvoye en UTC par la base), se trompe a coup sur, quels que soient le fuseau de la machine et
       l'heure du lancement (sans horloge fixee, a 02 h 30 heure de Makassar, UTC donne aussi « Jour 1 ») */
    const dateDans = fuseau => new Intl.DateTimeFormat("en-CA", { timeZone: fuseau }).format(new Date());
    const veille = j => new Date(Date.parse(j + "T12:00:00Z") - 86400000).toISOString().slice(0, 10);
    const cas = [
      ["Asia/Makassar", "+08:00", j => j + "T00:30:00", "Découverte · Jour 1/7", "UTC+8, inscrit aujourd'hui à 00 h 30", "la veille en UTC"],
      ["America/Bogota", "-05:00", j => veille(j) + "T23:30:00", "Découverte · Jour 2/7", "UTC−5, inscrit hier à 23 h 30", "aujourd'hui en UTC"]
    ];
    for (const [fuseau, dec, inscription, eb, quoi, utc] of cas) {
      const j = dateDans(fuseau), cree = new Date(inscription(j) + dec).toISOString();
      const db = base({ cree_le: cree });
      const { c, page } = await contexte(b, lea, db, { fuseau, horloge: new Date(j + "T10:00:00" + dec) });
      await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
      const reglage = await page.evaluate(() => [Intl.DateTimeFormat().resolvedOptions().timeZone, new Date().getHours()]).catch(() => []);
      ok(`${quoi} (cree_le ${cree.slice(0, 16)}Z, ${utc}), il est 10 h : « ${eb} » — la date locale compte, pas la date UTC`, reglage[0] === fuseau && reglage[1] === 10 && (await eyebrow(page)) === eb, (await eyebrow(page)) + " · navigateur " + JSON.stringify(reglage));
      await c.close();
    }
  });

  /* ---------- B. Questionnaire ---------- */
  await bloc("B. manquants et bornes", async () => {
    const db = base();
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
    await page.click("#dc-voir"); await attendre(page, 300);   // le message s'efface apres 3,2 s : lu tout de suite
    const msg = await texte(page, "#dc-msg");
    ok("« Voir mon résultat » sans rien remplir : « Il manque : Sexe, Âge, Taille (cm), Poids actuel (kg), objectif, séances, motivation » (les facultatives n'y sont pas)", msg.startsWith("Il manque : Sexe, Âge, Taille (cm), Poids actuel (kg), Quel est ton objectif principal ?") && msg.includes("Ta motivation pour t'y mettre maintenant") && !msg.includes("déjà essayé") && !msg.includes("obstacle"), msg);
    await attendre(page, 900);   // 1,2 s apres le clic : une ecriture qu'il aurait declenchee (envoi a 700 ms) serait deja la
    const manque = await page.$$eval("#vue .manque", l => l.map(e => e.id).sort()).catch(() => []);
    ok("… les 7 champs requis sont signalés, rien n'est écrit", manque.length === 7 && db.ecritures.length === 0, JSON.stringify(manque));
    /* bornes : taille en metres, age d'enfant */
    await remplir(page, Object.assign({}, A, { taille: "1.68" })); await attendre(page, 1500);
    await page.click("#dc-voir"); await attendre(page, 400);
    const msg2 = await texte(page, "#dc-msg"); await attendre(page, 800);   // puis 1,2 s apres le clic pour la base
    const I2 = contenu(db, "intake") || {};
    ok("taille « 1.68 » (en mètres) : « Vérifie : Taille (cm) (120 à 230) », jamais envoyée, pas de court_le", msg2 === "Vérifie : Taille (cm) (120 à 230)" && !("taille" in I2) && !I2.court_le && !(await page.$("#dc-resultat")), msg2 + " · " + JSON.stringify(I2));
    ok("… les autres réponses valides sont déjà parties en brouillon (âge 30, poids 70, objectif, motivation)", I2.age === "30" && I2.poids === "70" && I2.objectif === A.objectif && I2.motivation === "8", JSON.stringify(I2));
    await page.fill("#q-taille", "165"); await page.fill("#q-age", "17"); await page.press("#q-age", "Tab"); await attendre(page, 200);
    await page.click("#dc-voir"); await attendre(page, 1500);
    const I3 = contenu(db, "intake") || {};
    ok("âge 17 à la validation : « Vérifie : Âge (18 à 90) », rien de ce formulaire ne reste en base, pas de court_le", (await texte(page, "#dc-msg")) === "Vérifie : Âge (18 à 90)" && !I3.court_le && !["age", "poids", "taille", "objectif", "motivation", "sexe", "obstacle"].some(k => k in I3), (await texte(page, "#dc-msg")) + " · " + JSON.stringify(I3));
    await c.close();
  });
  await bloc("B. brouillon", async () => {
    /* brouillon pendant la frappe */
    const db = base();
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
    await taperAge(page, "30");
    await page.click("#q-poids"); await page.keyboard.type("64", { delay: 30 }); await attendre(page, 1500);
    const w = ecr(db, "intake"), I = contenu(db, "intake") || {};
    ok("brouillon : l'âge (30) puis le poids tapé (64) partent pendant la saisie, sans quitter le champ, sans court_le", w.length >= 1 && I.age === "30" && I.poids === "64" && !I.court_le && (await page.evaluate(() => document.activeElement && document.activeElement.id)) === "q-poids", "écritures " + w.length + " " + JSON.stringify(I));
    ok("brouillon : événement « diagnostic_question_answered » noté", (await suivi(page)).includes("diagnostic_question_answered|" + PROSPECT));
    await page.reload(); await attendre(page, 2400);
    ok("brouillon : après rechargement, les réponses sont là et le questionnaire reste ouvert", (await valeur(page, "#q-age")) === "30" && (await valeur(page, "#q-poids")) === "64" && !(await page.$("#dc-resultat")));
    await c.close();
  });
  await bloc("B. garde 18 ans « 185 »", async () => {
    /* garde 18 ans : « 185 » (passe par « 18 » à la frappe) ne laisse rien ; « 30 » envoie */
    const db = base();
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
    await page.fill("#q-poids", "64"); await page.fill("#q-taille", "168"); await page.selectOption("#q-sexe", "Femme"); await attendre(page, 1200);
    ok("garde 18 ans : sans âge saisi, poids, taille et sexe ne partent pas", db.ecritures.length === 0, "écritures " + db.ecritures.length);
    await page.click("#q-age"); await page.keyboard.type("185", { delay: 80 }); await attendre(page, 900);
    ok("garde 18 ans : « 185 » tapé (passe par « 18 ») — rien ne part pendant la frappe", db.ecritures.length === 0, "écritures " + db.ecritures.length);
    await page.keyboard.press("Tab"); await page.fill("#q-obstacle", "Le temps"); await attendre(page, 1500);
    ok("garde 18 ans : « 185 » puis sortie du champ (hors bornes) — toujours rien en base", db.ecritures.length === 0 && !contenu(db, "intake"), "écritures " + db.ecritures.length);
    await taperAge(page, "30"); await attendre(page, 1500);
    const I = contenu(db, "intake") || {};
    ok("garde 18 ans : « 30 » → le brouillon part avec les réponses déjà saisies (âge, poids, taille, sexe, obstacle)", I.age === "30" && I.poids === "64" && I.taille === "168" && I.sexe === "Femme" && I.obstacle === "Le temps" && !I.court_le, JSON.stringify(I));
    await c.close();
  });
  await bloc("B. garde 18 ans « 25 → 15 »", async () => {
    /* garde 18 ans : « 25 » envoie, puis « 15 » remet ce que ce formulaire avait envoye a son etat d'avant */
    const db = base({ intake: { objectif: "Prise de muscle" } });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
    await taperAge(page, "25"); await page.selectOption("#q-objectif", A.objectif); await page.fill("#q-poids", "64"); await attendre(page, 1500);
    const I1 = contenu(db, "intake") || {};
    ok("garde 18 ans : « 25 » → brouillon envoyé (âge 25, poids 64, objectif changé)", I1.age === "25" && I1.poids === "64" && I1.objectif === A.objectif, JSON.stringify(I1));
    await taperAge(page, "15"); await page.fill("#q-taille", "170"); await attendre(page, 1600);
    const I2 = contenu(db, "intake") || {};
    ok("garde 18 ans : « 25 → 15 » → en base, les champs envoyés reviennent à leur état d'avant (âge et poids retirés, objectif « Prise de muscle »), la taille tapée ensuite ne part pas", JSON.stringify(I2) === JSON.stringify({ objectif: "Prise de muscle" }), JSON.stringify(I2));
    const n = db.ecritures.length;
    await page.fill("#q-pourquoi", "Pour moi"); await attendre(page, 1300);
    ok("… tant que l'âge reste 15 : plus rien ne part", db.ecritures.length === n, "écritures " + db.ecritures.length + " / " + n);
    await taperAge(page, "30"); await attendre(page, 1500);
    const I3 = contenu(db, "intake") || {};
    ok("… âge corrigé à 30 : le brouillon repart avec ce qui est à l'écran (âge 30, poids 64, taille 170, objectif, pourquoi)", I3.age === "30" && I3.poids === "64" && I3.taille === "170" && I3.objectif === A.objectif && I3.pourquoi === "Pour moi", JSON.stringify(I3));
    await c.close();
  });
  await bloc("B. bornes exactes", async () => {
    /* bornes exactes (CONFIG.decouverte.bornes : age 18 a 90, poids 35 a 250) */
    const db = base();
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
    await taperAge(page, "18"); await page.fill("#q-poids", "35"); await attendre(page, 1500);
    const I1 = contenu(db, "intake") || {};
    ok("bornes : âge 18 (le minimum) accepté, le brouillon part avec le poids minimum (35 kg)", I1.age === "18" && I1.poids === "35", JSON.stringify(I1));
    await page.fill("#q-poids", "251"); await attendre(page, 1200); const p251 = (contenu(db, "intake") || {}).poids;
    await page.fill("#q-poids", "34"); await attendre(page, 1200); const p34 = (contenu(db, "intake") || {}).poids;
    await taperAge(page, "90"); await attendre(page, 1500);
    const I2 = contenu(db, "intake") || {};
    ok("bornes : poids 251 puis 34 ne partent pas (35 reste) ; âge 90 (le maximum) part", p251 === "35" && p34 === "35" && I2.age === "90" && I2.poids === "35", "251 → " + p251 + ", 34 → " + p34 + " · " + JSON.stringify(I2));
    await remplir(page, Object.assign({}, A, { age: "91", poids: "34" })); await attendre(page, 1500);
    const n91 = db.ecritures.length, age91 = (contenu(db, "intake") || {}).age;
    await page.click("#dc-voir"); await attendre(page, 400);
    const msg = await texte(page, "#dc-msg"); await attendre(page, 800);
    ok("bornes : âge 91 ne part pas (90 reste, rien de retiré) ; « Voir » : « Vérifie : Âge (18 à 90), Poids actuel (kg) (35 à 250) », pas de court_le", age91 === "90" && msg === "Vérifie : Âge (18 à 90), Poids actuel (kg) (35 à 250)" && !(contenu(db, "intake") || {}).court_le && db.ecritures.length === n91, msg + " · âge en base " + age91);
    await taperAge(page, "90"); await page.fill("#q-poids", "250"); await page.click("#dc-voir"); await attendre(page, 1600);
    const I3 = contenu(db, "intake") || {};
    ok("bornes : âge 90 et poids 250 (les maximums) validés, court_le posé", I3.age === "90" && I3.poids === "250" && typeof I3.court_le === "string" && !!(await page.$("#dc-resultat")), JSON.stringify(I3));
    await c.close();
  });

  /* ---------- C. Validation et résultat calculé ---------- */
  let prioA = [], prioB = [];
  await bloc("C. validation, jeu A", async () => {
    const db = base();
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
    const K = await page.evaluate(() => ({ calcul: CONFIG.calcul, pas: (CONFIG.decouverte || {}).pas_defaut || 6000 })).catch(() => null);
    await remplir(page, A); await attendre(page, 300);
    const t0 = Date.now();
    await page.click("#dc-voir"); await attendre(page, 1600);
    const I = contenu(db, "intake") || {};
    ok("validation : court_le (instant ISO de la validation) et les 10 réponses dans la clé intake", typeof I.court_le === "string" && !isNaN(Date.parse(I.court_le)) && Math.abs(Date.parse(I.court_le) - t0) < 10000 && QIDS.every(k => I[k] === A[k]), JSON.stringify(I));
    ok("validation : le résultat s'affiche (résultat, calories, séance, recettes, Speed Formation, accompagnement)", (await page.$$("#dc-resultat, #dc-calcul, #dc-seance, #dc-recettes, #dc-formation, #dc-accomp")).length === 6 && !(await page.$("#q-age")));
    const ev = await suivi(page);
    ok("événements : diagnostic_started, diagnostic_question_answered, diagnostic_completed, result_viewed (dans cet ordre)", ["diagnostic_started", "diagnostic_question_answered", "diagnostic_completed", "result_viewed"].every(e => ev.includes(e + "|" + PROSPECT)) && ev.indexOf("diagnostic_completed|" + PROSPECT) < ev.indexOf("result_viewed|" + PROSPECT) && ev.indexOf("diagnostic_started|" + PROSPECT) < ev.indexOf("diagnostic_question_answered|" + PROSPECT), JSON.stringify(ev));
    const hEnTete = await page.$eval("#vue .masthead a[data-dc-cal]", a => a.getAttribute("href") + "|" + a.textContent.trim()).catch(() => "");
    ok("après validation : « Réserver mon bilan » dans l'en-tête, lien pré-rempli (utm_content=decouverte, prénom, email)", hEnTete === lienAttendu("decouverte") + "|Réserver mon bilan", hEnTete);
    const hAcc = await page.$eval("#dc-accomp a[data-dc-cal]", a => a.getAttribute("href")).catch(() => "");
    ok("accompagnement : son bouton porte utm_content=decouverte-accompagnement", hAcc === lienAttendu("decouverte-accompagnement"), hAcc);
    const X = (K && K.calcul) ? attendu(A, K.calcul, K.pas) : {}, ts = await tuiles(page, "#dc-calcul");
    ok(`calories (Femme, 30 ans, 165 cm, 70 kg, perte, 3 séances) : maintien ${X.T}, objectif ${X.cible} kcal, protéines ${X.prot} g, glucides ${X.gluc} g, lipides ${X.lip} g — mêmes formules que le calculateur`, !!X.T && tuile(ts, "Maintien") === X.T && tuile(ts, "Ton objectif") === X.cible && tuile(ts, "Protéines") === X.prot && tuile(ts, "Glucides") === X.gluc && tuile(ts, "Lipides") === X.lip, JSON.stringify(ts));
    const tr = await tuiles(page, "#dc-resultat");
    ok(`résultat : tuiles Dépense estimée (${X.T}), Tes séances (3), Motivation (8)`, !!X.T && tuile(tr, "Dépense estimée") === X.T && tuile(tr, "Tes séances") === "3" && tuile(tr, "Motivation") === "8", JSON.stringify(tr));
    const phrases = norm(await texte(page, "#dc-resultat ul.ch-lecture"));
    ok("résultat : phrases tirées des réponses (motivation 8/10, obstacle, déjà essayé et déclic cités)", phrases.includes("Motivation 8/10 : c'est le bon moment") && phrases.includes("« Je manque de temps avec le travail »") && phrases.includes("« Des régimes trop stricts »") && phrases.includes("« Me sentir mieux cet été »"), phrases.slice(0, 300));
    prioA = await priorites(page);
    ok("« Tes 3 priorités » : déficit (" + X.cible + " kcal, " + X.prot + " g de protéines), 3 séances corps entier, séances courtes (obstacle « temps »)", (await texte(page, "#dc-resultat")).includes("Tes 3 priorités") && prioA.length === 3 && prioA[0].startsWith("Viser environ " + X.cible + " kcal par jour, avec " + X.prot + " g de protéines") && prioA[1].startsWith("3 séances corps entier") && prioA[2].startsWith("Des séances de 30 à 45 minutes"), JSON.stringify(prioA));
    await page.screenshot({ path: path.join(OUT, "resultat-desktop.png"), fullPage: true });
    /* recettes chargees depuis le catalogue */
    const ids = await page.evaluate(() => (CONFIG.decouverte || {}).recettes || []).catch(() => []);
    const noms = ids.map(id => (RECETTES.find(r => r.id === id) || {}).nom);
    const affiches = await page.$$eval("#dc-recettes details.dc-recette summary b", l => l.map(e => e.textContent.trim())).catch(() => []);
    ok("recettes : les 3 recettes de CONFIG.decouverte.recettes, lues dans le catalogue (" + noms.join(" · ") + ")", ids.length === 3 && JSON.stringify(affiches) === JSON.stringify(noms), JSON.stringify(affiches));
    await page.click("#dc-recettes details.dc-recette summary").catch(() => {}); await attendre(page, 300);
    const r0 = await texte(page, "#dc-recettes details.dc-recette");
    ok("recette ouverte : durée, ingrédients avec leur nom et leurs grammes (Avoine, crue · 50 g), préparation", r0.includes("15 min") && r0.includes("Avoine, crue") && r0.includes("50 g") && r0.includes("Préparation") && r0.includes("Verser les flocons"), r0.slice(0, 200));
    /* seance */
    const s = await texte(page, "#dc-seance");
    const yt = await page.$$eval("#dc-seance [data-yt]", l => l.map(e => e.dataset.yt)).catch(() => []);
    ok("séance : échauffement (5 minutes, marche sur place) + circuit de 5 exercices avec 5 boutons Démonstration, niveau débutant (2 tours)", s.includes("Échauffement · 5 minutes") && s.includes("Marche sur place") && (await page.$$("#dc-seance ul.ch-exos li")).length === 5 && yt.length === 5 && s.includes("2 tours (ton niveau : Débutant)"), s.slice(0, 200) + " · " + JSON.stringify(yt));
    await page.click("#dc-seance [data-yt]").catch(() => {}); await attendre(page, 400);
    await page.click("#dc-seance [data-yt]").catch(() => {}); await attendre(page, 400);
    const fr = await page.$$eval("#dc-seance iframe", l => l.map(f => f.getAttribute("src"))).catch(() => []);
    ok("séance : la vidéo s'ouvre en youtube-nocookie, une seule à la fois", fr.length === 1 && /^https:\/\/www\.youtube-nocookie\.com\/embed\/jdM0CTRKTKU/.test(fr[0]), JSON.stringify(fr));
    ok("pendant la découverte : la Speed Formation est ouverte (lien « Ouvrir la Speed Formation »)", !!(await page.$('#dc-formation a[href="#/formation"]')));
    ok("accompagnement : avantages, bouton Calendly et case « J'ai réservé mon bilan »", (await page.$$("#dc-accomp .liste-debloque li")).length >= 3 && !!(await page.$("#dc-accomp #dc-reserve-case")) && (await texte(page, "#dc-accomp")).includes("J'ai réservé mon bilan"));
    await c.close();
  });
  await bloc("C. jeu B", async () => {
    /* un autre jeu de reponses donne un autre resultat */
    const db = base();
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
    const K = await page.evaluate(() => ({ calcul: CONFIG.calcul, pas: (CONFIG.decouverte || {}).pas_defaut || 6000 })).catch(() => null);
    await remplir(page, B); await page.click("#dc-voir"); await attendre(page, 1600);
    const X = (K && K.calcul) ? attendu(B, K.calcul, K.pas) : {}, ts = await tuiles(page, "#dc-calcul");
    ok(`calories (Homme, 45 ans, 180 cm, 90 kg, prise de muscle, 5 séances) : maintien ${X.T}, objectif ${X.cible} kcal, protéines ${X.prot} g, glucides ${X.gluc} g, lipides ${X.lip} g`, !!X.T && tuile(ts, "Maintien") === X.T && tuile(ts, "Ton objectif") === X.cible && tuile(ts, "Protéines") === X.prot && tuile(ts, "Glucides") === X.gluc && tuile(ts, "Lipides") === X.lip, JSON.stringify(ts));
    prioB = await priorites(page);
    ok("réponses différentes → 3 priorités différentes (surplus, 5 séances haut / bas, repas repères contre le grignotage)", prioB.length === 3 && prioB.every((x, i) => x !== prioA[i]) && prioB[0].startsWith("Viser environ " + X.cible + " kcal") && prioB[0].includes("surplus léger") && prioB[1].startsWith("5 séances par semaine") && prioB[2].startsWith("Des repas repères"), JSON.stringify(prioB));
    const phrases = await texte(page, "#dc-resultat ul.ch-lecture");
    ok("motivation 4/10 : phrase « commence petit » et tuile en alerte ; pas de citation vide (déjà essayé, déclic non remplis)", phrases.includes("Motivation 4/10 : commence petit") && !!(await page.$("#dc-resultat .t-val.neg")) && !phrases.includes("Tu as déjà essayé") && !phrases.includes("Ton déclic"), phrases.slice(0, 200));
    await c.close();
  });
  await bloc("C. catalogue vide", async () => {
    /* catalogue indisponible : un message, pas d'erreur */
    const db = base({ intake: avecCourt(A), catalogueVide: true });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2600);
    ok("catalogue vide et dépôt injoignable : « Les recettes n'ont pas pu être chargées », le reste du résultat s'affiche", (await texte(page, "#dc-recettes")).includes("Les recettes n'ont pas pu être chargées") && !!(await page.$("#dc-calcul .tile")), await texte(page, "#dc-recettes"));
    await c.close();
  });

  /* ---------- D. Modifier mes réponses ---------- */
  await bloc("D. Modifier mes réponses", async () => {
    const db = base({ intake: avecCourt(A) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    const K = await page.evaluate(() => ({ calcul: CONFIG.calcul, pas: (CONFIG.decouverte || {}).pas_defaut || 6000 })).catch(() => null);
    const XA = (K && K.calcul) ? attendu(A, K.calcul, K.pas) : {}, X80 = (K && K.calcul) ? attendu(Object.assign({}, A, { poids: "80" }), K.calcul, K.pas) : {};
    ok("questionnaire déjà fait : le résultat s'affiche d'emblée, aucune écriture au chargement", !!(await page.$("#dc-resultat")) && db.ecritures.length === 0);
    await page.click("#dc-modifier"); await attendre(page, 500);
    ok("« Modifier mes réponses » : le questionnaire revient pré-rempli, avec « Revenir à mon résultat »", (await valeur(page, "#q-poids")) === "70" && (await valeur(page, "#q-motivation")) === "8" && !!(await page.$("#dc-annuler")));
    await page.fill("#q-poids", "80"); await page.selectOption("#q-motivation", "3"); await page.fill("#q-obstacle", "Autre chose"); await taperAge(page, "31"); await attendre(page, 1500);
    ok("en modification : rien ne part pendant la frappe (poids, motivation, obstacle, âge)", db.ecritures.length === 0, "écritures " + db.ecritures.length);
    await page.click("#dc-annuler"); await attendre(page, 1200);   // plus que le delai d'envoi (700 ms)
    ok("« Revenir à mon résultat » : résultat d'avant (maintien " + XA.T + "), aucune écriture", !!XA.T && !!(await page.$("#dc-resultat")) && tuile(await tuiles(page, "#dc-calcul"), "Maintien") === XA.T && db.ecritures.length === 0);
    await page.click("#dc-modifier"); await attendre(page, 500);
    ok("… en rouvrant « Modifier » : les réponses d'avant (70 kg, motivation 8, 30 ans), pas celles abandonnées", (await valeur(page, "#q-poids")) === "70" && (await valeur(page, "#q-motivation")) === "8" && (await valeur(page, "#q-age")) === "30");
    await taperAge(page, "16"); await page.click("#dc-voir"); await attendre(page, 1200);
    ok("en modification, âge 16 puis « Voir » : « Vérifie : Âge (18 à 90) », aucune écriture", (await texte(page, "#dc-msg")) === "Vérifie : Âge (18 à 90)" && db.ecritures.length === 0, await texte(page, "#dc-msg"));
    await taperAge(page, "30"); await page.fill("#q-poids", "80"); await page.click("#dc-voir"); await attendre(page, 1600);
    const w = ecr(db, "intake"), I = contenu(db, "intake") || {};
    ok("« Modifier » + « Voir mon résultat » : une écriture (poids 80), court_le inchangé ; les réponses abandonnées avant « Revenir » (âge 31, motivation 3, obstacle « Autre chose ») ne sont pas entrées", w.length === 1 && I.poids === "80" && I.court_le === COURT && I.age === "30" && I.motivation === "8" && I.obstacle === A.obstacle, "écritures " + w.length + " " + JSON.stringify(I));
    ok("… le résultat est recalculé (maintien " + X80.T + " kcal)", !!X80.T && tuile(await tuiles(page, "#dc-calcul"), "Maintien") === X80.T, JSON.stringify(await tuiles(page, "#dc-calcul")));
    await c.close();
  });

  /* ---------- E. Réserver mon bilan : clics et case ---------- */
  await bloc("E. clics et case", async () => {
    const db = base({ intake: avecCourt(A) });
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
    const db = base({ intake: avecCourt(A) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    await page.evaluate(() => { const cs = document.getElementById("dc-reserve-case"); cs.checked = true; cs.dispatchEvent(new Event("change")); cs.dispatchEvent(new Event("change")); }).catch(() => {});
    await attendre(page, 2600);
    const w = ecr(db, "challenge"), dates = new Set(w.map(e => e.contenu && e.contenu.reserve));
    ok("case « J'ai réservé » déclenchée deux fois de suite : chaque écriture porte la même date", w.length >= 1 && dates.size === 1 && typeof [...dates][0] === "string" && (contenu(db, "challenge") || {}).reserve === [...dates][0], JSON.stringify(w.map(e => e.contenu && e.contenu.reserve)));
    await c.close();
  });

  /* ---------- F. Jour 8, anciennes adresses, mode test ---------- */
  await bloc("F. jour 8", async () => {
    const db = base({ cree: 7, intake: avecCourt(A) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    ok("jour 8 : « Découverte · terminée », résultat, calories, séance et recettes restent visibles", (await eyebrow(page)) === "Découverte · terminée" && (await page.$$("#dc-resultat, #dc-calcul, #dc-seance, #dc-recettes")).length === 4 && !!(await page.$("#vue .masthead a[data-dc-cal]")));
    ok("jour 8 : bloc Speed Formation « Ta période découverte est terminée… », sans lien pour l'ouvrir", (await texte(page, "#dc-formation")).includes("Ta période découverte est terminée : la Speed Formation fait partie de l'accompagnement.") && !(await page.$('#dc-formation a[href="#/formation"]')));
    ok("jour 8 : l'onglet Speed Formation reste visible, avec cadenas", (await navIds(page)).includes("formation") && (await cadenas(page)).includes("formation"), JSON.stringify(await cadenas(page)));
    const n0 = db.lectures.length;
    await aller(page, "#/formation", 1500);
    const hv = await page.$eval("#vue .verrou a[target=_blank]", a => a.getAttribute("href") + "|" + a.textContent.trim()).catch(() => "");
    ok("jour 8 : #/formation verrouillée — texte de fin de découverte + « Réserver mon bilan » (utm_content=verrou-formation)", (await texte(page, "#vue .verrou")).includes("Ta période découverte est terminée : la Speed Formation fait partie de l'accompagnement.") && hv === lienAttendu("verrou-formation") + "|Réserver mon bilan", hv);
    ok("page verrouillée : aucune donnée lue", db.lectures.length === n0, JSON.stringify(db.lectures.slice(n0)));
    await c.close();
  });
  await bloc("F. adresses, verrous, mode test, profil", async () => {
    const db = base({ intake: avecCourt(A) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    await aller(page, "#/formation", 1800);
    ok("pendant la découverte : #/formation s'ouvre (pas de verrou)", !(await page.$("#vue .verrou")) && !(await cadenas(page)).includes("formation"));
    for (const h of ["#/challenge", "#/challenge/3", "#/challenge-libre", "#/challenge-rythme"]) {
      await aller(page, h, 1500);
      ok(`${h} → #/decouverte (écran Découverte)`, (await page.evaluate(() => location.hash)) === "#/decouverte" && !!(await page.$("#dc-vue #dc-resultat")), await page.evaluate(() => location.hash));
    }
    for (const [h, id] of [["#/programme", "programme"], ["#/mensurations", "mensurations"], ["#/complements", "complements"], ["#/bilan", "bilan"]]) {
      const n0 = db.lectures.length;
      await aller(page, h, 1400);
      const hv = await page.$eval("#vue .verrou a[target=_blank]", a => a.getAttribute("href") + "|" + a.textContent.trim()).catch(() => "");
      ok(`${h} : verrouillée (« Cette fonctionnalité est disponible avec l'accompagnement MHX. » + « Réserver mon bilan », utm_content=verrou-${id}), aucune donnée lue`, (await texte(page, "#vue .verrou")).includes("Cette fonctionnalité est disponible avec l'accompagnement MHX.") && hv === lienAttendu("verrou-" + id) + "|Réserver mon bilan" && db.lectures.length === n0, hv + " · lectures " + JSON.stringify(db.lectures.slice(n0)));
    }
    await cliquerCal(page, "#vue .verrou a[target=_blank]"); await attendre(page, 2000);
    const cl = ((contenu(db, "challenge") || {}).cta || {}).clics || [];
    ok("clic depuis une page verrouillée (#/bilan) : noté avec la source verrou-bilan", cl.length === 1 && cl[0].source === "verrou-bilan", JSON.stringify(cl));
    /* mode test */
    const w0 = db.ecritures.length;
    await aller(page, "#/decouverte-jour/8", 1800);
    ok("mode test #/decouverte-jour/8 : retour sur #/decouverte, « Découverte · terminée », Speed Formation verrouillée, rien d'écrit", (await page.evaluate(() => location.hash)) === "#/decouverte" && (await page.evaluate(() => localStorage.getItem("mhx_decouverte_jour"))) === "8" && (await eyebrow(page)) === "Découverte · terminée" && (await cadenas(page)).includes("formation") && !(await page.$('#dc-formation a[href="#/formation"]')) && db.ecritures.length === w0, (await eyebrow(page)) + " " + JSON.stringify(await cadenas(page)));
    await aller(page, "#/decouverte-jour/0", 1800);
    ok("mode test #/decouverte-jour/0 : retour au vrai jour (Jour 3/7), Speed Formation rouverte, réglage effacé", (await eyebrow(page)) === "Découverte · Jour 3/7" && !(await cadenas(page)).includes("formation") && (await page.evaluate(() => localStorage.getItem("mhx_decouverte_jour"))) === null && db.ecritures.length === w0, await eyebrow(page));
    /* profil */
    await aller(page, "#/profil", 1800);
    const pr = await texte(page, "#vue");
    ok("Profil du prospect : « Tes réponses au questionnaire sont enregistrées… » + « Voir mon résultat » (#/decouverte), pas de questionnaire complet", pr.includes("Tes réponses au questionnaire sont enregistrées") && !!(await page.$('#vue a[href="#/decouverte"]')) && (await texte(page, '#vue a[href="#/decouverte"]')) === "Voir mon résultat" && !(await page.$("#q-nom")));
    await page.click('#vue a[href="#/decouverte"]').catch(() => {}); await attendre(page, 1500);
    ok("… « Voir mon résultat » ramène au résultat", !!(await page.$("#dc-vue #dc-resultat")));
    await c.close();
  });

  /* ---------- G. Ancien prospect du challenge, données piégées ---------- */
  await bloc("G. ancien prospect du challenge", async () => {
    const db = base({ cree: 9, intake: ANCIEN_INTAKE, challenge: ANCIEN_CH });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/7`); await attendre(page, 2600);
    ok("ancien prospect du challenge (#/challenge/7) : Découverte terminée, questionnaire court pré-rempli par ses réponses (29 ans, 64 kg)", (await page.evaluate(() => location.hash)) === "#/decouverte" && (await eyebrow(page)) === "Découverte · terminée" && (await valeur(page, "#q-age")) === "29" && (await valeur(page, "#q-poids")) === "64" && db.ecritures.length === 0, await eyebrow(page));
    await page.click("#dc-voir"); await attendre(page, 300);
    ok("… il ne manque que la motivation", (await texte(page, "#dc-msg")) === "Il manque : Ta motivation pour t'y mettre maintenant", await texte(page, "#dc-msg"));
    await page.selectOption("#q-motivation", "7"); await page.click("#dc-voir"); await attendre(page, 1600);
    const I = contenu(db, "intake") || {};
    ok("… validé : court_le posé, ses anciennes réponses gardées (niveau, lieu, poids objectif)", typeof I.court_le === "string" && I.niveau === ANCIEN_INTAKE.niveau && I.lieu === ANCIEN_INTAKE.lieu && I.poids_obj === "60" && I.motivation === "7", JSON.stringify(I));
    ok("… résultat : écart « 4,0 kg à perdre » (poids objectif de l'ancien questionnaire), case du jour 7 lue : « Bilan réservé le … »", tuile(await tuiles(page, "#dc-resultat"), "Ton écart") === "4,0" && (await texte(page, "#dc-resultat")).includes("à perdre, à ton rythme") && (await texte(page, "#dc-reserve")).startsWith("Bilan réservé le") && !(await page.$("#dc-reserve-case")), JSON.stringify(await tuiles(page, "#dc-resultat")) + " " + (await texte(page, "#dc-reserve")));
    await cliquerCal(page, "#dc-accomp a[data-dc-cal]"); await attendre(page, 2000);
    const C = contenu(db, "challenge") || {};
    ok("… un clic s'ajoute à ses anciens clics ; ses jours et sa case du jour 7 restent intacts", ((C.cta || {}).clics || []).length === 2 && C.cta.clics[1].source === "decouverte-accompagnement" && C.jours && C.jours["1"] && C.jours["1"].fait === ANCIEN_CH.jours["1"].fait && C.jours["7"].reserve === ANCIEN_CH.jours["7"].reserve, JSON.stringify(C).slice(0, 300));
    await c.close();
  });
  await bloc("G. données piégées (types faux)", async () => {
    /* donnees piegees, questionnaire pas fait (court_le d'un mauvais type) */
    const db = base({ intake: { court_le: 12345, age: { x: 1 }, sexe: ["Homme"], taille: "<b>x</b>", poids: null, obstacle: "<img src=x onerror=\"window.__xss=1\">", motivation: "<script>window.__xss=1</script>" }, challenge: { cta: "n'importe quoi", jours: [1, 2], reserve: 42 } });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    ok("données piégées (court_le nombre, âge objet, sexe liste, HTML) : le questionnaire s'affiche, aucune injection, aucune écriture", !!(await page.$("#q-age")) && !(await page.evaluate(() => window.__xss)) && !(await page.$("#vue img[src='x'], #vue script")) && (await valeur(page, "#q-obstacle")) === "<img src=x onerror=\"window.__xss=1\">" && db.ecritures.length === 0);
    await c.close();
  });
  await bloc("G. données piégées (premier niveau)", async () => {
    /* donnees piegees au premier niveau : intake en texte, challenge en liste */
    const db = base({ intake: "texte brut", challenge: [1, 2, 3] });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    await remplir(page, A); await attendre(page, 1500);
    const I = contenu(db, "intake");
    ok("intake en texte, challenge en liste : le questionnaire s'affiche vide, le brouillon part comme un objet normal", !!I && typeof I === "object" && !Array.isArray(I) && I.age === "30" && I.poids === "70" && !("0" in I), JSON.stringify(I));
    await page.click("#dc-voir").catch(() => {}); await attendre(page, 1600);
    await cliquerCal(page, "#vue .masthead a[data-dc-cal]"); await attendre(page, 2000);
    const C = contenu(db, "challenge");
    ok("… validé puis clic « Réserver mon bilan » : la clé challenge est réécrite comme un objet (cta.clics = 1 clic)", !!(await page.$("#dc-resultat")) && !!C && typeof C === "object" && !Array.isArray(C) && ((C.cta || {}).clics || []).length === 1, JSON.stringify(C));
    await c.close();
  });
  await bloc("G. données piégées et coach", async () => {
    /* donnees piegees, questionnaire fait : resultat et cle challenge aux types faux */
    const intake = Object.assign({}, A, { court_le: COURT, obstacle: "<img src=x onerror=\"window.__xss=1\">", essaye: { a: 1 }, pourquoi: 42, motivation: "<b>9</b>", seances: ["3"] });
    const challenge = { cta: { clics: [null, 5, "x", { date: "<script>window.__xss=1</script>", source: "<img src=x onerror=window.__xss=1>" }] }, reserve: { d: 1 }, jours: "abc" };
    const db = base({ intake, challenge });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2600);
    const r = await texte(page, "#dc-resultat");
    ok("données piégées (obstacle en HTML, déjà essayé objet, pourquoi nombre, motivation « <b>9</b> ») : résultat affiché, le HTML reste du texte, aucune injection", !!(await page.$("#dc-calcul .tile")) && r.includes("« <img src=x onerror=\"window.__xss=1\"> »") && !r.includes("[object Object]") && !(await page.evaluate(() => window.__xss)) && !(await page.$("#vue img[src='x']")), r.slice(0, 200));
    ok("… clé challenge piégée (clics douteux, reserve objet, jours texte) : la case « J'ai réservé » s'affiche normalement", !!(await page.$("#dc-reserve-case")));
    await cliquerCal(page, "#vue .masthead a[data-dc-cal]"); await attendre(page, 2000);
    const cl = ((contenu(db, "challenge") || {}).cta || {}).clics || [];
    ok("… un clic sur cette clé piégée : noté sans erreur (source decouverte)", cl.length >= 1 && (cl[cl.length - 1] || {}).source === "decouverte" && !(await page.evaluate(() => window.__xss)), JSON.stringify(cl).slice(0, 200));
    await c.close();
    const db2 = base({ intake, challenge });
    const { c: c2, page: p2 } = await contexte(b, coach, db2);
    await p2.goto(`http://localhost:${PORT}/#/clients`); await attendre(p2, 2400);
    const l = await ligneDe(p2, PROSPECT);
    await p2.click(`[data-ouvrir="${PROSPECT}"]`).catch(() => {}); await attendre(p2, 2200);
    ok("coach : prospect aux données piégées — pastille « Découverte J3/7 », bloc « Découverte » de la fiche lisible, aucune injection", l.includes("Découverte J3/7") && !!(await p2.$("#fiche-decouverte")) && (await texte(p2, "#fiche-decouverte")).includes("Obstacle principal") && !(await p2.evaluate(() => window.__xss)) && !(await p2.$("#vue img[src='x']")) && db2.ecritures.length === 0, l);
    await c2.close();
  });

  /* ---------- H. Anglais, mobile ---------- */
  await bloc("H. anglais, questionnaire", async () => {
    const db = base();
    const { c, page } = await contexte(b, lea, db, { langue: "en" });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    ok("anglais : « Discovery · Day 3/7 », « Your questionnaire », « See my result »", (await eyebrow(page)) === "Discovery · Day 3/7" && (await texte(page, "#vue")).includes("Your questionnaire") && (await texte(page, "#dc-voir")) === "See my result", await eyebrow(page));
    await page.click("#dc-voir"); await attendre(page, 300);
    ok("anglais : « Missing: … » si rien n'est rempli", (await texte(page, "#dc-msg")).startsWith("Missing: "), await texte(page, "#dc-msg"));
    await c.close();
  });
  await bloc("H. anglais, résultat", async () => {
    const db = base({ intake: avecCourt(A) });
    const { c, page } = await contexte(b, lea, db, { langue: "en" });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2600);
    const v = await texte(page, "#vue");
    ok("anglais : résultat (« Your result », « Your 3 priorities », « Your calories and macros », « 3 recipes to get started », « With MHX coaching »)", ["Your result", "Your 3 priorities", "Your calories and macros", "Your discovery workout", "3 recipes to get started", "With MHX coaching", "I booked my assessment"].every(x => v.includes(x)), v.slice(0, 300));
    ok("anglais : « Book my assessment » (en-tête et accompagnement), aucun « Réserver mon bilan » ni « Ton résultat »", (await texte(page, "#vue .masthead a[data-dc-cal]")) === "Book my assessment" && (await texte(page, "#dc-accomp a[data-dc-cal]")) === "Book my assessment" && !v.includes("Réserver mon bilan") && !v.includes("Ton résultat") && !v.includes("Tes 3 priorités"));
    await page.click("#dc-modifier"); await attendre(page, 500);
    ok("anglais : « Edit my answers » → « See my result » et « Back to my result »", (await texte(page, "#dc-voir")) === "See my result" && (await texte(page, "#dc-annuler")) === "Back to my result");
    await aller(page, "#/programme", 1400);
    ok("anglais : page verrouillée « This feature is available with MHX coaching. » + « Book my assessment »", (await texte(page, "#vue .verrou")).includes("This feature is available with MHX coaching.") && (await texte(page, "#vue .verrou a[target=_blank]")) === "Book my assessment");
    await c.close();
  });
  await bloc("H. mobile, questionnaire", async () => {
    const db = base();
    const { c, page } = await contexte(b, lea, db, { viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    ok("mobile 390 px : questionnaire sans débordement horizontal", !!(await page.$("#q-age")) && !(await deborde(page)), String(await page.evaluate(() => document.documentElement.scrollWidth)));
    await page.click("#dc-voir"); await attendre(page, 400);
    ok("mobile 390 px : message « Il manque » affiché, toujours sans débordement", (await texte(page, "#dc-msg")).startsWith("Il manque") && !(await deborde(page)));
    const barre = await page.$$eval("#barre-bas a", l => l.map(a => a.dataset.id)).catch(() => []);
    ok("mobile : barre du bas avec Accueil et Profil, sans Challenge", barre.includes("accueil") && barre.includes("profil") && !barre.includes("challenge"), JSON.stringify(barre));
    await page.screenshot({ path: path.join(OUT, "questionnaire-mobile.png"), fullPage: true });
    await c.close();
  });
  await bloc("H. mobile, résultat", async () => {
    const db = base({ intake: avecCourt(Object.assign({}, A, { obstacle: "Un obstacle très long ".repeat(12) })) });
    const { c, page } = await contexte(b, lea, db, { viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2600);
    await page.click("#dc-recettes details.dc-recette summary").catch(() => {}); await page.click("#dc-seance [data-yt]").catch(() => {}); await attendre(page, 500);
    ok("mobile 390 px : résultat, calories, séance (vidéo ouverte), recettes (une ouverte), accompagnement — sans débordement", !!(await page.$("#dc-accomp")) && !!(await page.$("#dc-seance iframe")) && !(await deborde(page)), String(await page.evaluate(() => document.documentElement.scrollWidth)));
    await page.screenshot({ path: path.join(OUT, "resultat-mobile.png"), fullPage: true });
    await c.close();
  });

  /* ---------- I. Coach ---------- */
  await bloc("I. coach", async () => {
    const ch = { version: 1, jours: {}, cta: { clics: [{ jour: 3, source: "decouverte", date: new Date().toISOString() }] } };
    const db = base({ intake: avecCourt(A), challenge: ch, marc: true });
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/tableau`); await attendre(page, 2600);
    const t = await page.$$eval("#vue .tb-tuile", l => l.map(e => e.textContent.replace(/[  ]/g, " ").replace(/\s+/g, " ").trim())).catch(() => []);
    const tp = t.find(x => x.startsWith("Prospects en découverte")) || "";
    ok("tableau de bord : « Prospects en découverte » = 1 (Marc a fini ses 7 jours), « 1 chaud · 2 prospects au total »", /^Prospects en découverte ?1 ?1 chaud · 2 prospects au total$/.test(tp), tp || JSON.stringify(t));
    await aller(page, "#/clients", 2200);
    const lLea = await ligneDe(page, PROSPECT), lMarc = await ligneDe(page, MARC);
    ok("Mes clients : Léa « Découverte J3/7 » + « a cliqué Réserver » ; Marc « Découverte terminée »", lLea.includes("Découverte J3/7") && lLea.includes("a cliqué Réserver") && lMarc.includes("Découverte terminée"), lLea + " | " + lMarc);
    await page.click(`[data-ouvrir="${PROSPECT}"]`).catch(() => {}); await attendre(page, 2200);
    const f = await texte(page, "#fiche-decouverte");
    ok("fiche de Léa : bloc « Découverte » (jour 3 / 7, questionnaire rempli, objectif, motivation 8 / 10, 1 clic, case pas cochée)", f.includes("jour 3 / 7") && f.includes("rempli le") && f.includes("Perte de poids / sèche") && f.includes("8 / 10") && f.includes("1 clic") && f.includes("pas cochée"), f.slice(0, 300));
    ok("fiche de Léa : lienCalendly() rend l'adresse brute pour le coach, aucune écriture", (await page.evaluate(() => typeof lienCalendly === "function" ? lienCalendly("decouverte") : null)) === CAL && db.ecritures.length === 0);
    await c.close();
  });
  await bloc("I. coach, bilan réservé et mode test", async () => {
    /* Léa a coché « J'ai réservé mon bilan » ; le mode test du prospect (jour 8) est pose sur l'appareil du coach :
       il ne vaut que sur l'appareil du prospect, les ecrans du coach n'en tiennent pas compte */
    const ch = { version: 1, jours: {}, cta: { clics: [{ jour: 2, source: "decouverte", date: creeIlYA(1) }] }, reserve: new Date().toISOString() };
    const db = base({ intake: avecCourt(A), challenge: ch, marc: true });
    const { c, page } = await contexte(b, coach, db, { stockage: { mhx_decouverte_jour: "8" } });
    await page.goto(`http://localhost:${PORT}/#/tableau`); await attendre(page, 2600);
    const t = (await page.$$eval("#vue .tb-tuile", l => l.map(e => e.textContent)).catch(() => [])).map(norm);
    const tp = t.find(x => x.startsWith("Prospects en découverte")) || "";
    ok("appareil du coach en mode test (mhx_decouverte_jour = 8) : la tuile ne bouge pas — « Prospects en découverte » = 1, « 1 chaud · 2 prospects au total »", (await page.evaluate(() => localStorage.getItem("mhx_decouverte_jour"))) === "8" && /^Prospects en découverte ?1 ?1 chaud · 2 prospects au total$/.test(tp), tp || JSON.stringify(t));
    await aller(page, "#/clients", 2200);
    const lLea = await ligneDe(page, PROSPECT), lMarc = await ligneDe(page, MARC);
    ok("Mes clients (même mode test) : Léa « Découverte J3/7 » + « bilan réservé » (et pas « a cliqué Réserver ») ; Marc « Découverte terminée »", lLea.includes("Découverte J3/7") && lLea.includes("bilan réservé") && !lLea.includes("a cliqué Réserver") && lMarc.includes("Découverte terminée"), lLea + " | " + lMarc);
    await page.click(`[data-ouvrir="${PROSPECT}"]`).catch(() => {}); await attendre(page, 2200);
    const f = await texte(page, "#fiche-decouverte");
    ok("fiche de Léa (même mode test) : « jour 3 / 7 », case « cochée le … », pastille « bilan réservé » ; aucune écriture", f.includes("jour 3 / 7") && f.includes("cochée le") && f.includes("bilan réservé") && db.ecritures.length === 0, f.slice(0, 300));
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
    await aller(page, "#/decouverte-jour/8", 2000);
    ok("client Thomas tape #/decouverte-jour/8 : rien de la Découverte, aucun cadenas", (await rien()) && (await cadenas(page)).length === 0);
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
