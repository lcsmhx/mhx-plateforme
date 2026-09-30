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
   ne change rien (clic daté du vrai jour, bloc F ; écrans du coach, bloc I) ; commentaires « v53 ».
   v60 (lot 1, brief V2 C) : les 3 questions se répondent en touchant des cartes / pastilles (fieldset.dc-q #q-probleme,
   #q-obstacle — 2 choix au plus —, #q-projection), avec une précision libre facultative (#q-obstacle-precision,
   #q-projection-precision) ; bouton « Voir ma prochaine étape » (EN « See my next step »), inactif (aria-disabled)
   tant qu'il manque une réponse ; touché trop tôt : « Il manque une réponse » (EN « One answer is missing ») et les
   questions sans réponse signalées (.manque) ; intro « 3 questions, 30 secondes ». Dans intake : <id> = le texte
   français lisible, <id>_choix = les clés, <id>_precision = la précision. remplir() touche les cartes (clic sur le
   label) et tape les précisions ; N a la forme nouvelle. Aucune vérification ajoutée ni retirée (89) : chaque attente
   changée est expliquée par un commentaire « v60 ».
   v61 (lot 2, brief V2 D, E, F, G) : lien Calendly de l'événement de 15 min (utm_source=app, utm_medium=bouton) et codes
   d'origine apres_questionnaire (page « Ton plan d'action »), accueil_haut (bouton du haut ; reponses_haut sur « Modifier
   mes réponses »), accueil_accompagnement (carte), verrou_<page> (avant : bilan-propose, decouverte,
   decouverte-accompagnement, verrou-<page>), dans les liens ET dans les clics notés ; page « Ton plan d'action
   personnalisé » (« Offert », objectif dans 3 mois, 15 min avec Lucas, UN seul bouton doré « Récupérer mon plan
   d'action » et « Plus tard, je découvre mon espace » en lien discret) ; accueil : « Récupérer mon plan d'action »
   + « 15 min avec Lucas · offert », carte « Ce que l'accompagnement ajoute », case « J'ai déjà choisi mon créneau » ;
   pages verrouillées : un texte par page, bouton et ligne sous le bouton. Côté coach : libellés inchangés (anciens codes
   en base). Aucune vérification ajoutée ni retirée (89) : chaque attente changée est expliquée par un commentaire « v61 ».
   Texte d'origine (v51) :
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
/* v61 (lot 2, brief V2 F) : l'événement de 15 min « Ton plan d'action offert » (avant : …/30min) ; utm_source=app,
   utm_medium=bouton (avant : app-mhx, app), même ordre des paramètres */
const CAL = "https://calendly.com/mhx-coaching/ton-plan-d-action-offert-15-min-avec-lucas";
const PRE = "&name=L%C3%A9a&first_name=L%C3%A9a&email=l%40e.fr";
const lienAttendu = source => CAL + "?utm_source=app&utm_medium=bouton&utm_content=" + source + PRE;
/* v61 (lot 2, brief V2 D, E, G) : le bouton unique « Récupérer mon plan d'action » (avant : « Réserver mon bilan ») et sa
   ligne ; ce que l'accompagnement ajoute (rubriques de la vitrine, dans l'ordre de CONFIG.marque.gratuit_vitrine) */
const BOUTON = "Récupérer mon plan d'action", BOUTON_EN = "Get my action plan";
const SOUS = "15 min avec Lucas · offert", SOUS_EN = "15 min with Lucas · free";
const AVANTAGES_FR = { programme: "Tes séances construites pour toi et ajustées par ton coach selon tes progrès.", nutrition: "Tes repas calculés pour ton objectif, avec ta liste de courses.", journal: "Chaque séance notée, et la charge à viser la fois suivante.", suivi: "Ta régularité, ta courbe et le retour de ton coach chaque semaine.", complements: "Tes compléments conseillés, avec les doses et les moments.", bilan: "Ton bilan du mois, préparé avec ton coach." };
const AVANTAGES_EN = { programme: "Workouts built for you and adjusted by your coach as you progress.", nutrition: "Meals calculated for your goal, with your shopping list.", journal: "Every workout logged, with the weight to aim for next time.", suivi: "Your consistency, your progress curve and your coach's feedback every week." };
const VITRINE = ["programme", "nutrition", "journal", "suivi"];
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
/* v60 : N a la forme nouvelle (avant : { probleme, obstacle: "Je manque de temps avec le travail", projection } en texte
   libre) — « ce qui a coincé » : 2 pastilles (temps, craquages) + une précision ; « dans 3 mois » : la précision seule
   (même texte qu'avant : la page bilan et l'accueil ne changent pas). obstacle = libellés français joints par « · »,
   puis « — » + la précision (contrat du lot 1, C) ; projection = la précision seule */
const N = { probleme: "Perdre du gras",
  obstacle: "Le manque de temps · Je craque sur la nourriture — le soir", obstacle_choix: ["temps", "craquages"], obstacle_precision: "le soir",
  projection: "Me sentir mieux cet été", projection_precision: "Me sentir mieux cet été" };
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
    /* v56 : la connexion notée par la base (fonction noter_connexion, au démarrage d'un prospect ou d'un compte suivi) n'est
       pas une écriture de l'app dans les données : elle est testée à part (verif61) */
    if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
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
/* v60 : des réponses à toucher (avant : une liste pour probleme, du texte libre pour obstacle et projection). Le bouton
   radio / la case est invisible : on touche sa carte (le label). R a la forme de N : probleme (valeur française exacte),
   <id>_choix (les clés, touchées dans l'ordre), <id>_precision (tapée si elle est donnée) */
const carte = (id, v) => `#q-${id} label.dc-opt:has(input[value="${v}"])`;
async function remplir(page, R){
  if (R.probleme) await page.click(carte("probleme", R.probleme));
  for (const k of ["obstacle", "projection"]) {
    for (const v of R[k + "_choix"] || []) await page.click(carte(k, v));
    if (R[k + "_precision"] != null) await page.fill(`#q-${k}-precision`, R[k + "_precision"]);
  }
}
/* v60 : ce qui est coché dans une question (valeurs des boutons radio / cases), et les questions signalées « manque » */
const coches = (page, id) => page.$$eval(`#q-${id} input:checked`, l => l.map(e => e.value)).catch(() => null);
const manques = page => page.$$eval("#vue .manque", l => l.map(e => e.id).sort()).catch(() => []);
/* v60 : l'état du bouton « Voir ma prochaine étape » : aria-disabled + classe inactif */
const inactif = page => page.$eval("#dc-voir", b => b.getAttribute("aria-disabled") + "|" + b.classList.contains("inactif")).catch(() => "");
/* v60 : le bouton touché alors qu'il manque une réponse. Playwright tient un bouton aria-disabled="true" pour désactivé et
   attendrait qu'il s'active ; pour une personne, il reste touchable (c'est voulu : il dit ce qui manque). Le clic est donc
   forcé : un vrai clic de souris au centre du bouton, sans cette attente. Quand les réponses sont complètes, page.click
   ordinaire (qui attend un bouton actif) */
const toucherTropTot = page => page.click("#dc-voir", { force: true });
/* v60 : les clés que le questionnaire écrit dans intake ; exactement les mêmes (un champ vide n'est jamais créé : une clé
   absente de la référence doit être absente de l'intake) */
const CLES = ["probleme", "obstacle", "obstacle_choix", "obstacle_precision", "projection", "projection_choix", "projection_precision"];
const vide = v => v == null || v === "" || (Array.isArray(v) && !v.length);
const memes = (I, R) => CLES.every(k => JSON.stringify(I[k]) === JSON.stringify(R[k]));
/* un clic « Récupérer mon plan d'action » (v61 ; avant : « Réserver mon bilan ») sans ouvrir Calendly */
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
    /* v60 : chaque élément « q-… » avec sa balise, et les réponses à toucher de chaque question (avant : les 3 champs
       q-probleme, q-obstacle, q-projection — une liste et deux textes libres —, et « Valider mes réponses ») */
    const champs = await page.$$eval("#vue [id^='q-']", l => l.map(e => e.tagName.toLowerCase() + "#" + e.id + (e.dataset.type ? "[" + e.dataset.type + "]" : ""))).catch(() => []);
    const touches = await page.$$eval("#vue fieldset.dc-q", l => l.map(f => f.id + ":" + [...f.querySelectorAll("label.dc-opt input")].map(i => i.type).join(","))).catch(() => []);
    const CHAMPS = ["fieldset#q-probleme[cartes]", "fieldset#q-obstacle[choix]", "p#q-obstacle-max", "textarea#q-obstacle-precision", "fieldset#q-projection[choix]", "textarea#q-projection-precision"];
    const TOUCHES = ["q-probleme:" + Array(3).fill("radio"), "q-obstacle:" + Array(6).fill("checkbox"), "q-projection:" + Array(5).fill("radio")];
    /* v52 : les 3 questions (avant : les 10, sexe … motivation, et « Voir mon résultat ») */
    ok("questionnaire court : les 3 questions à toucher (objectif numéro 1 : 3 cartes ; ce qui a coincé : 6 pastilles + précision ; dans 3 mois : 5 pastilles + précision), sans âge, et « Voir ma prochaine étape »", JSON.stringify(champs) === JSON.stringify(CHAMPS) && JSON.stringify(touches) === JSON.stringify(TOUCHES) && (await texte(page, "#dc-voir")) === "Voir ma prochaine étape", JSON.stringify(champs) + " " + JSON.stringify(touches) + " " + (await texte(page, "#dc-voir")));
    /* v52 : « 3 questions, 1 minute » (avant : « Commence par ton questionnaire : 3 minutes, 10 questions… ») ; v60 : « 30 secondes » */
    ok("avant le questionnaire : pas de bouton Calendly, « 3 questions, 30 secondes »", !(await page.$("#vue a[href*='calendly']")) && (await lede(page)) === "3 questions, 30 secondes : dis-nous où tu en es.", await lede(page));
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
    /* v60 : le bouton a l'air inactif tant qu'il manque une réponse, mais reste cliquable */
    const etat0 = await inactif(page);
    await toucherTropTot(page); await attendre(page, 300);   // le message s'efface apres 3,2 s : lu tout de suite
    const msg = await texte(page, "#dc-msg");
    /* v60 : « Il manque une réponse » (avant : « Il manque : » suivi des 3 questions) ; le bouton est inactif (aria-disabled,
       classe inactif) avant le clic. Les 3 questions sans réponse restent nommées par la vérification suivante (.manque) */
    ok("« Voir ma prochaine étape » (inactif : aria-disabled) touché sans rien remplir : « Il manque une réponse »", msg === "Il manque une réponse" && etat0 === "true|true", msg + " · bouton " + etat0);
    await attendre(page, 900);   // 1,2 s apres le clic : une ecriture qu'il aurait declenchee (envoi a 700 ms) serait deja la
    const manque = await manques(page);
    /* v60 : les 3 questions (fieldset) nommément (avant : 3 champs, comptés) */
    ok("… les 3 questions sont signalées, rien n'est écrit", JSON.stringify(manque) === '["q-obstacle","q-probleme","q-projection"]' && db.ecritures.length === 0, JSON.stringify(manque));
    /* v60 : « dans 3 mois » sans pastille, sa précision faite d'espaces (avant : la réponse libre faite d'espaces) */
    await remplir(page, Object.assign({}, N, { projection_precision: "   " })); await attendre(page, 1500);
    /* v60 : le 1er message et le 2e sont le même texte : le 2e clic attend que le 1er se soit effacé (flash, 3,2 s), sinon
       la minuterie du 1er effacerait le 2e */
    const efface = await page.waitForFunction(() => !(document.getElementById("dc-msg") || {}).textContent, null, { timeout: 5000 }).then(() => true, () => false);
    const etat1 = await inactif(page);
    await toucherTropTot(page); await attendre(page, 400);
    const msg2 = await texte(page, "#dc-msg"), manque2 = await manques(page); await attendre(page, 800);
    const I2 = contenu(db, "intake") || {};
    /* v60 : « Il manque une réponse » et seule « dans 3 mois » signalée (avant : « Il manque : Dans 3 mois… ») */
    ok("réponse « dans 3 mois » : aucune pastille et une précision faite d'espaces seulement : « Il manque une réponse », seule cette question signalée, bouton toujours inactif, pas de court_le", msg2 === "Il manque une réponse" && JSON.stringify(manque2) === '["q-projection"]' && etat1 === "true|true" && efface && !I2.court_le && !(await page.$("#dc-bilan")), msg2 + " · " + JSON.stringify(manque2) + " · bouton " + etat1 + " · " + JSON.stringify(I2));
    /* v60 : le brouillon garde les clés et le texte français lisible ; la précision d'espaces n'écrit rien */
    ok("… les autres réponses sont déjà parties en brouillon (objectif numéro 1, ce qui a coincé : pastilles, précision et texte français lisible), rien pour « dans 3 mois »", I2.probleme === N.probleme && I2.obstacle === N.obstacle && JSON.stringify(I2.obstacle_choix) === JSON.stringify(N.obstacle_choix) && I2.obstacle_precision === N.obstacle_precision && ["projection", "projection_choix", "projection_precision"].every(k => !(k in I2)), JSON.stringify(I2));
    ok("plus aucune question d'âge, de taille ni de poids (aucune borne à vérifier)", !(await page.$("#q-age, #q-taille, #q-poids")), "");
    await c.close();
  });
  await bloc("B. brouillon", async () => {
    /* brouillon pendant la frappe */
    const db = base();
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
    /* v60 : la précision libre de « ce qui a coincé » (avant : la réponse libre #q-obstacle) ; précision seule, sans
       pastille : obstacle === la précision, comme avant (contrat du lot 1, C) */
    await page.click("#q-obstacle-precision"); await page.keyboard.type("Le temps", { delay: 30 }); await attendre(page, 1500);
    const w = ecr(db, "intake"), I = contenu(db, "intake") || {};
    ok("brouillon : la précision tapée part pendant la saisie, sans quitter le champ, sans court_le (obstacle = la précision, aucune pastille)", w.length >= 1 && I.obstacle === "Le temps" && I.obstacle_precision === "Le temps" && !("obstacle_choix" in I) && !I.court_le && (await page.evaluate(() => document.activeElement && document.activeElement.id)) === "q-obstacle-precision", "écritures " + w.length + " " + JSON.stringify(I));
    ok("brouillon : événement « diagnostic_question_answered » noté", (await suivi(page)).includes("diagnostic_question_answered|" + PROSPECT));
    await page.reload(); await attendre(page, 2400);
    ok("brouillon : après rechargement, les réponses sont là (la précision, aucune pastille cochée) et le questionnaire reste ouvert", (await valeur(page, "#q-obstacle-precision")) === "Le temps" && JSON.stringify(await coches(page, "obstacle")) === "[]" && !(await page.$("#dc-bilan")));
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
    const etat = await inactif(page);   // v60 : les 3 réponses données : le bouton n'a plus l'air inactif
    const t0 = Date.now();
    await page.click("#dc-voir"); await attendre(page, 1600);
    const I = contenu(db, "intake") || {};
    /* v60 : les 3 réponses = le texte français lisible, les clés et les précisions (memes : toutes les clés de N ; avant :
       probleme, obstacle, projection en texte libre) ; le bouton actif juste avant */
    ok("validation : court_le (instant ISO de la validation) et les 3 réponses dans la clé intake (texte français lisible, pastilles, précisions ; + l'objectif du questionnaire complet), bouton actif", typeof I.court_le === "string" && !isNaN(Date.parse(I.court_le)) && Math.abs(Date.parse(I.court_le) - t0) < 10000 && memes(I, N) && I.objectif === "Perte de poids / sèche" && etat === "false|false", "bouton " + etat + " " + JSON.stringify(I));
    /* v61 : la page « Ton plan d'action personnalisé », ses éléments dans l'ordre du contrat et ses textes (avant : la page
       s'affichait, sans texte vérifié ici — « Ta prochaine étape » et ses 2 boutons, vérifiés par verif56) */
    const ordre = await page.$$eval("#dc-bilan > *", l => l.map(e => e.tagName.toLowerCase() + (e.id ? "#" + e.id : "." + [...e.classList].join(".")))).catch(() => []);
    const ordreCta = await page.$$eval("#dc-bilan .dc-cta > *", l => l.map(e => e.tagName.toLowerCase() + "#" + e.id)).catch(() => []);
    const plan = {}; for (const k of ["dc-offert", "dc-projection", "dc-bilan-texte", "dc-bilan-garde", "dc-bilan-libre"]) plan[k] = await texte(page, "#" + k);
    plan.h2 = await texte(page, "#dc-bilan h2");
    const PLAN = { "dc-offert": "Offert", "dc-projection": "Ton objectif dans 3 mois : « " + N.projection_precision + " »", "dc-bilan-texte": "En 15 minutes au téléphone avec Lucas, on transforme cet objectif en plan concret : ce qui te freine vraiment, par quoi commencer, et les 3 actions à mettre en place en priorité.", "dc-bilan-garde": "Ton plan est à toi, quelle que soit la suite.", "dc-bilan-libre": "Si l'accompagnement te correspond, Lucas te le présente à la fin, seulement si tu le veux. Tu es libre de dire non.", h2: "Ton plan d'action personnalisé" };
    ok("validation : la page « Ton plan d'action personnalisé » s'affiche (« Offert », titre, « Ton objectif dans 3 mois : « … » », 15 min avec Lucas, « Ton plan est à toi… », « Tu es libre de dire non », dans cet ordre ; ni questionnaire, ni ancien résultat)", !!(await page.$("section.panel.dc-plan#dc-bilan")) && !(await page.$("#q-probleme, #dc-resultat, #dc-calcul, #dc-seance, #dc-recettes"))
      && JSON.stringify(ordre) === JSON.stringify(["span#dc-offert", "h2.", "p#dc-projection", "p#dc-bilan-texte", "p#dc-bilan-garde", "p#dc-bilan-libre", "div.dc-cta"]) && JSON.stringify(ordreCta) === JSON.stringify(["a#dc-bilan-reserver", "p#dc-bilan-sous", "button#dc-bilan-plus-tard"])
      && Object.keys(PLAN).every(k => plan[k] === PLAN[k]), JSON.stringify(ordre) + " " + JSON.stringify(ordreCta) + " " + JSON.stringify(plan));
    const ev = await suivi(page);
    ok("événements : diagnostic_started, diagnostic_question_answered, diagnostic_completed, bilan_viewed (dans cet ordre)", ["diagnostic_started", "diagnostic_question_answered", "diagnostic_completed", "bilan_viewed"].every(e => ev.includes(e + "|" + PROSPECT)) && ev.indexOf("diagnostic_completed|" + PROSPECT) < ev.indexOf("bilan_viewed|" + PROSPECT) && ev.indexOf("diagnostic_started|" + PROSPECT) < ev.indexOf("diagnostic_question_answered|" + PROSPECT), JSON.stringify(ev));
    const hB = await page.$$eval("#vue a[data-dc-cal]", l => l.map(a => a.dataset.dcCal + "|" + a.getAttribute("href") + "|" + a.getAttribute("target") + "|" + a.textContent.trim())).catch(() => []);
    /* v61 : un seul bouton doré (le seul .btn de la page, sans .ghost, fond plein) et « Plus tard » en lien discret (un
       button.lien-discret, pas .btn : ni fond ni bordure, souligné) ; « Récupérer mon plan d'action », code
       apres_questionnaire, et sa ligne « 15 min · par téléphone · offert » (avant : « Réserver mon bilan »,
       utm_content=bilan-propose, à côté d'un 2e bouton « Pas maintenant ») */
    const boutons = await page.$$eval("#dc-bilan .btn", l => l.map(e => e.id + "|" + e.classList.contains("ghost") + "|" + (getComputedStyle(e).backgroundColor !== "rgba(0, 0, 0, 0)"))).catch(() => []);
    const plusTard = await page.$eval("#dc-bilan-plus-tard", e => { const s = getComputedStyle(e); return [e.tagName, e.classList.contains("lien-discret"), e.classList.contains("btn"), s.backgroundColor, s.backgroundImage, ["Top", "Right", "Bottom", "Left"].map(c => s["border" + c + "Width"]).join(" "), s.textDecorationLine].join("|"); }).catch(() => "");
    const pt = await texte(page, "#dc-bilan-plus-tard"), sousB = await texte(page, "#dc-bilan-sous");
    ok("page « Ton plan d'action » : un seul lien Calendly, « Récupérer mon plan d'action », pré-rempli (utm_content=apres_questionnaire, prénom, email), nouvel onglet, sa ligne « 15 min · par téléphone · offert » ; un seul bouton doré, « Plus tard, je découvre mon espace » en lien discret (ni fond ni bordure, souligné)", JSON.stringify(hB) === JSON.stringify(["apres_questionnaire|" + lienAttendu("apres_questionnaire") + "|_blank|" + BOUTON]) && JSON.stringify(boutons) === '["dc-bilan-reserver|false|true"]'
      && plusTard === "BUTTON|true|false|rgba(0, 0, 0, 0)|none|0px 0px 0px 0px|underline" && pt === "Plus tard, je découvre mon espace" && sousB === "15 min · par téléphone · offert", JSON.stringify(hB) + " · " + JSON.stringify(boutons) + " · " + plusTard + " · " + pt + " · " + sousB);
    await page.click("#dc-bilan-plus-tard"); await attendre(page, 1500);
    const hEnTete = await page.$eval("#vue .masthead a[data-dc-cal]", a => a.dataset.dcCal + "|" + a.className + "|" + a.getAttribute("href") + "|" + a.textContent.trim()).catch(() => "");
    /* v61 : « Plus tard » (avant : « Pas maintenant ») ; « Récupérer mon plan d'action » en contour (avant : « Réserver mon
       bilan »), code accueil_haut (avant : decouverte), suivi de « 15 min avec Lucas · offert » */
    ok("« Plus tard » → l'accueil : « Récupérer mon plan d'action » (contour) dans l'en-tête, lien pré-rempli (utm_content=accueil_haut, prénom, email), puis « 15 min avec Lucas · offert »", hEnTete === "accueil_haut|btn ghost petit|" + lienAttendu("accueil_haut") + "|" + BOUTON && (await texte(page, "#vue .masthead p.dc-cta-sous.dc-haut-sous")) === SOUS, hEnTete + " · " + (await texte(page, "#vue .masthead .dc-haut-sous")));
    const hAcc = await page.$eval("#dc-accomp a[data-dc-cal]", a => a.dataset.dcCal + "|" + a.getAttribute("href")).catch(() => "");
    /* v61 : code accueil_accompagnement (avant : decouverte-accompagnement), dans le lien et dans data-dc-cal */
    ok("accompagnement : son bouton porte utm_content=accueil_accompagnement", hAcc === "accueil_accompagnement|" + lienAttendu("accueil_accompagnement"), hAcc);
    ok("accueil : ni résultat, ni calories, ni séance, ni recettes (l'ancien écran n'est plus affiché)", !(await page.$("#dc-resultat, #dc-calcul, #dc-seance, #dc-recettes")) && !(await texte(page, "#vue")).includes("Tes 3 priorités"));
    ok("pendant la découverte : la Speed Formation est ouverte (lien « Ouvrir la Speed Formation »)", !!(await page.$('#dc-formation a[href="#/formation"]')));
    /* v61 : « Ce que l'accompagnement ajoute », les 4 rubriques de la vitrine avec leurs nouvelles descriptions (avant : au
       moins 3 lignes), « Récupérer mon plan d'action » (contour), « 15 min avec Lucas pour faire le point… Offert. », case
       « J'ai déjà choisi mon créneau » (avant : « J'ai réservé mon bilan ») ; exactement 2 liens Calendly sur l'accueil
       (haut + carte) ; plus aucun « Réserver mon bilan » ni « 30 minutes » sur l'accueil */
    const lignes = await page.$$eval("#dc-accomp .liste-debloque li", l => l.map(li => { const a = li.querySelector("a[data-dc-vitrine]"); return (a ? a.dataset.dcVitrine : "") + "|" + li.textContent.split(" — ").slice(1).join(" — ").trim(); })).catch(() => []);
    const vAcc = await texte(page, "#vue"), bAcc = await page.$eval("#dc-accomp a[data-dc-cal]", a => a.className + "|" + a.textContent.trim()).catch(() => "");
    ok("accompagnement : « Ce que l'accompagnement ajoute », les 4 rubriques (programme, nutrition, journal, suivi) et leurs nouvelles descriptions, « Récupérer mon plan d'action », « 15 min avec Lucas pour faire le point sur ton objectif. Offert. », case « J'ai déjà choisi mon créneau » ; 2 liens Calendly sur l'accueil, plus aucun « Réserver mon bilan » ni « 30 minutes »", (await texte(page, "#dc-accomp h2")) === "Ce que l'accompagnement ajoute" && JSON.stringify(lignes) === JSON.stringify(VITRINE.map(id => id + "|" + AVANTAGES_FR[id]))
      && bAcc === "btn ghost|" + BOUTON && (await texte(page, "#dc-accomp > p.note")) === "15 min avec Lucas pour faire le point sur ton objectif. Offert." && !!(await page.$("#dc-accomp #dc-reserve-case")) && (await texte(page, "#dc-reserve label")) === "J'ai déjà choisi mon créneau"
      && (await page.$$("#vue [data-dc-cal]")).length === 2 && !vAcc.includes("Réserver mon bilan") && !vAcc.includes("30 minutes"), JSON.stringify(lignes) + " · " + bAcc + " · " + (await texte(page, "#dc-accomp")));
    await page.screenshot({ path: path.join(OUT, "accueil-desktop.png"), fullPage: true });
    await c.close();
  });

  /* ---------- D. Modifier mes réponses ----------
     v52 : depuis le Profil (« Modifier mes réponses », #/decouverte/reponses), plus depuis l'écran résultat ; après la
     validation, retour à l'accueil (avant : le résultat recalculé). La vérification « âge 16 puis Voir » devient « réponse
     effacée puis Valider ». v60 : des cartes et pastilles à toucher, des précisions ; « Voir ma prochaine étape ». */
  await bloc("D. Modifier mes réponses", async () => {
    const db = base({ intake: avecChoix(N) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    ok("questionnaire déjà fait et page bilan passée : l'accueil s'affiche d'emblée, aucune écriture au chargement", !!(await page.$("#dc-accomp")) && !(await page.$("#dc-bilan, #q-probleme")) && db.ecritures.length === 0);
    await aller(page, "#/profil", 1800);
    await page.click('#vue a[href="#/decouverte/reponses"]').catch(() => {}); await attendre(page, 1500);
    /* v60 : pré-rempli = la carte et les pastilles cochées, la précision tapée (avant : la liste et le texte libre) */
    const avantObstacle = async () => JSON.stringify(await coches(page, "obstacle")) === JSON.stringify(N.obstacle_choix) && (await valeur(page, "#q-obstacle-precision")) === N.obstacle_precision;
    /* v61 : + le bouton du haut, même bouton et même ligne que l'accueil, code reponses_haut (avant : decouverte, non vérifié ici) */
    const hRep = await page.$eval("#vue .masthead a[data-dc-cal]", a => a.dataset.dcCal + "|" + a.getAttribute("href") + "|" + a.textContent.trim()).catch(() => "");
    ok("« Modifier mes réponses » (Profil) : le questionnaire revient pré-rempli, avec « Annuler les modifications » ; en haut « Récupérer mon plan d'action » (utm_content=reponses_haut) et « 15 min avec Lucas · offert »", JSON.stringify(await coches(page, "probleme")) === JSON.stringify([N.probleme]) && (await avantObstacle()) && (await texte(page, "#dc-annuler")) === "Annuler les modifications"
      && hRep === "reponses_haut|" + lienAttendu("reponses_haut") + "|" + BOUTON && (await texte(page, "#vue .masthead .dc-haut-sous")) === SOUS, JSON.stringify(await coches(page, "probleme")) + " " + JSON.stringify(await coches(page, "obstacle")) + " " + (await valeur(page, "#q-obstacle-precision")) + " · " + hRep);
    /* v60 : une autre carte, une pastille décochée et une autre précision (avant : la liste et le texte libre changés) */
    await page.click(carte("probleme", "Prendre du muscle")); await page.click(carte("obstacle", "craquages")); await page.fill("#q-obstacle-precision", "Autre chose"); await attendre(page, 1500);
    ok("en modification : rien ne part pendant la saisie (les touchers ont bien pris : autre carte, pastille décochée, précision)", db.ecritures.length === 0
      && JSON.stringify(await coches(page, "probleme")) === '["Prendre du muscle"]' && JSON.stringify(await coches(page, "obstacle")) === '["temps"]' && (await valeur(page, "#q-obstacle-precision")) === "Autre chose", "écritures " + db.ecritures.length);
    await page.click("#dc-annuler"); await attendre(page, 1200);   // plus que le delai d'envoi (700 ms)
    ok("« Annuler les modifications » : l'accueil, aucune écriture", !!(await page.$("#dc-accomp")) && db.ecritures.length === 0);
    await aller(page, "#/decouverte/reponses", 1500);
    ok("… en rouvrant : les réponses d'avant (« Perdre du gras », pastilles et précision d'avant), pas celles abandonnées", JSON.stringify(await coches(page, "probleme")) === JSON.stringify([N.probleme]) && (await avantObstacle()), JSON.stringify(await coches(page, "probleme")) + " " + JSON.stringify(await coches(page, "obstacle")) + " " + (await valeur(page, "#q-obstacle-precision")));
    /* v60 : « dans 3 mois » n'a que sa précision (N) : l'effacer laisse la question sans réponse ; « Il manque une
       réponse », seule cette question signalée (avant : « Il manque : Dans 3 mois… ») */
    await page.fill("#q-projection-precision", ""); await toucherTropTot(page); await attendre(page, 1200);
    ok("en modification, réponse effacée puis « Voir ma prochaine étape » : « Il manque une réponse » (« dans 3 mois » signalée), aucune écriture", (await texte(page, "#dc-msg")) === "Il manque une réponse" && JSON.stringify(await manques(page)) === '["q-projection"]' && db.ecritures.length === 0, (await texte(page, "#dc-msg")) + " · " + JSON.stringify(await manques(page)));
    /* v60 : une pastille + une précision pour « dans 3 mois » (avant : le texte libre « Prendre 4 kg de muscle ») */
    await page.click(carte("projection", "confiance")); await page.fill("#q-projection-precision", "Prendre 4 kg de muscle"); await page.click(carte("probleme", "Prendre du muscle")); await page.click("#dc-voir"); await attendre(page, 1600);
    const w = ecr(db, "intake"), I = contenu(db, "intake") || {};
    ok("« Modifier » + « Voir ma prochaine étape » : une écriture, court_le inchangé ; la réponse abandonnée avant « Annuler » (pastille décochée, précision « Autre chose ») n'est pas entrée", w.length === 1 && I.probleme === "Prendre du muscle" && I.projection === "Retrouver confiance en moi — Prendre 4 kg de muscle" && JSON.stringify(I.projection_choix) === '["confiance"]' && I.projection_precision === "Prendre 4 kg de muscle" && I.court_le === COURT && I.obstacle === N.obstacle && JSON.stringify(I.obstacle_choix) === JSON.stringify(N.obstacle_choix) && I.obstacle_precision === N.obstacle_precision, "écritures " + w.length + " " + JSON.stringify(I));
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
    /* v61 : « Récupérer mon plan d'action », source accueil_haut (avant : « Réserver mon bilan », decouverte) */
    ok("clic « Récupérer mon plan d'action » (en-tête) : noté une fois dans la clé challenge (source accueil_haut, jour 3, date du jour)", cl1.length === 1 && cl1[0].source === "accueil_haut" && cl1[0].jour === 3 && typeof cl1[0].date === "string" && cl1[0].date.slice(0, 10) === new Date().toISOString().slice(0, 10) && ecr(db, "challenge").length === 1, JSON.stringify(C1));
    ok("clic : événement « call_cta_clicked » noté", (await suivi(page)).includes("call_cta_clicked|" + PROSPECT));
    await cliquerCal(page, "#dc-accomp a[data-dc-cal]"); await attendre(page, 2000);
    const cl2 = ((contenu(db, "challenge") || {}).cta || {}).clics || [];
    /* v61 : sources accueil_haut puis accueil_accompagnement (avant : decouverte, decouverte-accompagnement) */
    ok("clic « Récupérer mon plan d'action » (accompagnement) : un seul clic de plus (source accueil_accompagnement), le premier gardé", cl2.length === 2 && cl2[0].source === "accueil_haut" && cl2[1].source === "accueil_accompagnement" && ecr(db, "challenge").length === 2, JSON.stringify(cl2));
    ok("clics : les 2 clics notés, l'intake n'est pas touché", cl2.length === 2 && ecr(db, "intake").length === 0, "clics " + cl2.length + ", écritures intake " + ecr(db, "intake").length);
    await page.dblclick("#dc-reserve-case").catch(() => {}); await attendre(page, 2200);
    const C3 = contenu(db, "challenge") || {};
    const dates = new Set(ecr(db, "challenge").map(e => e.contenu && e.contenu.reserve).filter(Boolean));
    ok("« J'ai déjà choisi mon créneau » (v61 ; avant : « J'ai réservé mon bilan ») en double clic : une seule date (challenge.reserve), les clics gardés", typeof C3.reserve === "string" && !isNaN(Date.parse(C3.reserve)) && dates.size === 1 && ((C3.cta || {}).clics || []).length === 2, JSON.stringify(C3) + " dates " + JSON.stringify([...dates]));
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
    ok("case « J'ai déjà choisi mon créneau » (v61 ; avant : « J'ai réservé ») déclenchée deux fois de suite : chaque écriture porte la même date", w.length >= 1 && dates.size === 1 && typeof [...dates][0] === "string" && (contenu(db, "challenge") || {}).reserve === [...dates][0], JSON.stringify(w.map(e => e.contenu && e.contenu.reserve)));
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
    /* v61 (lot 2, brief V2 G) : un texte propre à chaque page à exemple (avant : l'appel unique « Tu veux un programme
       construit pour toi… Réserve ton bilan. » pour programme et journal) ; compléments et bilan gardent le texte du verrou.
       Le paragraphe du verrou est comparé en entier (avant : contenu dans la carte). Bouton « Récupérer mon plan d'action »
       (avant : « Réserver mon bilan »), seul lien de la carte, code verrou_<page> (avant : verrou-<page>), puis la ligne
       « 15 min avec Lucas · offert » ; sous la carte, la note = ce que l'accompagnement ajoute pour cette page (nouveau
       texte pour programme et journal) */
    const APPELS = { programme: "Cette séance découverte est la même pour tout le monde. Ton programme, lui, part de ton niveau, de ton matériel et de ton emploi du temps, puis évolue avec tes progrès.", journal: "Avec l'accompagnement, chaque séance est notée et l'app te propose la charge à viser la fois suivante : tu sais toujours quoi faire pour progresser." };
    const VERROU = "Cette fonctionnalité est disponible avec l'accompagnement MHX.";
    const AVEC_EXEMPLE = ["programme", "journal"];
    for (const [h, id] of [["#/programme", "programme"], ["#/journal", "journal"], ["#/complements", "complements"], ["#/bilan", "bilan"]]) {
      const n0 = db.lectures.length;
      await aller(page, h, 1400);
      const hv = await page.$eval("#vue .verrou a[target=_blank]", a => a.getAttribute("href") + "|" + a.textContent.trim()).catch(() => "");
      const avecEx = AVEC_EXEMPLE.includes(id), tx = avecEx ? APPELS[id] : VERROU, ex = avecEx === !!(await page.$("#vue #ech-" + id + ".echantillon")) && avecEx === !!(await page.$("#vue .echantillon"));
      const pv = await texte(page, "#vue .verrou > p:not(.verrou-sous)"), sv = await texte(page, "#vue .verrou > p.verrou-sous"), plus = await texte(page, "#vue .verrou-plus"), nLiens = (await page.$$("#vue .verrou a")).length;
      ok(`${h} : verrouillée (${avecEx ? "l'exemple, puis " : ""}« ${tx.slice(0, 48)}… » + « Récupérer mon plan d'action », utm_content=verrou_${id}, « 15 min avec Lucas · offert », note « ${AVANTAGES_FR[id].slice(0, 30)}… »), aucune donnée lue`, pv === tx && ex && hv === lienAttendu("verrou_" + id) + "|" + BOUTON && nLiens === 1 && sv === SOUS && plus === AVANTAGES_FR[id] && db.lectures.length === n0, pv + " · " + hv + " · " + sv + " · " + plus + " · liens " + nLiens + " · lectures " + JSON.stringify(db.lectures.slice(n0)));
    }
    await cliquerCal(page, "#vue .verrou a[target=_blank]"); await attendre(page, 2000);
    const cl = ((contenu(db, "challenge") || {}).cta || {}).clics || [];
    /* v53 : … daté du vrai jour de la découverte (Léa inscrite il y a 2 jours : jour 3), pas du jour 8 de l'ancien drapeau */
    /* v61 : source verrou_bilan (avant : verrou-bilan) */
    ok("clic depuis une page verrouillée (#/bilan) : noté avec la source verrou_bilan, au vrai jour (3, pas le 8 de l'ancien drapeau du mode test)", cl.length === 1 && cl[0].source === "verrou_bilan" && cl[0].jour === 3, JSON.stringify(cl));
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
    /* v60 : « dans 3 mois » revient dans sa précision (avant : le texte libre #q-projection) */
    ok("… « Modifier mes réponses » ouvre ses 3 réponses en modification", !!(await page.$("#dc-vue #q-probleme")) && !!(await page.$("#dc-annuler")) && (await valeur(page, "#q-projection-precision")) === N.projection_precision, await valeur(page, "#q-projection-precision"));
    await c.close();
  });

  /* ---------- G. Ancien prospect du challenge, données piégées ---------- */
  await bloc("G. ancien prospect du challenge", async () => {
    const db = base({ cree: 9, intake: ANCIEN_INTAKE, challenge: ANCIEN_CH });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/7`); await attendre(page, 2600);
    /* v52 : les 3 nouvelles questions (avant : le questionnaire court de 10 pré-rempli, 29 ans, 64 kg) */
    ok("ancien prospect du challenge (#/challenge/7) : « Découverte » (v52 : jamais « terminée »), les 3 questions (pas d'âge ni de poids redemandés), rien d'écrit", (await page.evaluate(() => location.hash)) === "#/decouverte" && (await eyebrow(page)) === "Découverte" && !!(await page.$("#q-probleme")) && !(await page.$("#q-age, #q-poids")) && db.ecritures.length === 0, await eyebrow(page));
    await toucherTropTot(page); await attendre(page, 300);
    /* v60 : « Il manque une réponse » et les 3 questions signalées (avant : « Il manque : » suivi des 3 questions) */
    ok("… il manque les 3 réponses", (await texte(page, "#dc-msg")) === "Il manque une réponse" && JSON.stringify(await manques(page)) === '["q-obstacle","q-probleme","q-projection"]', (await texte(page, "#dc-msg")) + " · " + JSON.stringify(await manques(page)));
    await remplir(page, N); await page.click("#dc-voir"); await attendre(page, 1600);
    const I = contenu(db, "intake") || {};
    ok("… validé : court_le posé, ses anciennes réponses gardées (niveau, lieu, poids objectif, âge 29, objectif d'avant)", typeof I.court_le === "string" && I.niveau === ANCIEN_INTAKE.niveau && I.lieu === ANCIEN_INTAKE.lieu && I.poids_obj === "60" && I.age === "29" && I.objectif === ANCIEN_INTAKE.objectif && I.projection === N.projection, JSON.stringify(I));
    await page.click("#dc-bilan-plus-tard").catch(() => {}); await attendre(page, 1500);
    ok("… page « Ton plan d'action » puis « Plus tard » (v61 ; avant : « Pas maintenant ») : l'accueil, case du jour 7 lue : « Bilan réservé le … »", !!(await page.$("#dc-accomp")) && (await texte(page, "#dc-reserve")).startsWith("Bilan réservé le") && !(await page.$("#dc-reserve-case")), await texte(page, "#dc-reserve"));
    await cliquerCal(page, "#dc-accomp a[data-dc-cal]"); await attendre(page, 2000);
    const C = contenu(db, "challenge") || {};
    /* v61 : source accueil_accompagnement (avant : decouverte-accompagnement) ; l'ancien clic (sans source) reste le 1er */
    ok("… un clic s'ajoute à ses anciens clics (source accueil_accompagnement) ; ses jours et sa case du jour 7 restent intacts", ((C.cta || {}).clics || []).length === 2 && C.cta.clics[1].source === "accueil_accompagnement" && C.jours && C.jours["1"] && C.jours["1"].fait === ANCIEN_CH.jours["1"].fait && C.jours["7"].reserve === ANCIEN_CH.jours["7"].reserve, JSON.stringify(C).slice(0, 300));
    await c.close();
  });
  await bloc("G. données piégées (types faux)", async () => {
    /* donnees piegees, questionnaire pas fait (court_le d'un mauvais type) */
    const db = base({ intake: { court_le: 12345, probleme: { x: 1 }, age: { x: 1 }, sexe: ["Homme"], taille: "<b>x</b>", poids: null, obstacle: "<img src=x onerror=\"window.__xss=1\">", projection: "<script>window.__xss=1</script>", motivation: "<script>window.__xss=1</script>" }, challenge: { cta: "n'importe quoi", jours: [1, 2], reserve: 42 } });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    ok("données piégées (court_le nombre, problème objet, HTML) : le questionnaire s'affiche, aucune injection, aucune écriture", !!(await page.$("#q-probleme")) && !(await page.evaluate(() => window.__xss)) && !(await page.$("#vue img[src='x'], #vue script")) && (await valeur(page, "#q-obstacle-precision")) === "<img src=x onerror=\"window.__xss=1\">" && db.ecritures.length === 0);
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
    /* v61 : « Récupérer mon plan d'action », source apres_questionnaire (avant : « Réserver mon bilan », bilan-propose) */
    ok("… validé puis clic « Récupérer mon plan d'action » (page « Ton plan d'action ») : la clé challenge est réécrite comme un objet (cta.clics = 1 clic, source apres_questionnaire)", !!C && typeof C === "object" && !Array.isArray(C) && ((C.cta || {}).clics || []).length === 1 && C.cta.clics[0].source === "apres_questionnaire", JSON.stringify(C));
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
    ok("… clé challenge piégée (clics douteux, reserve objet, jours texte) : l'accueil et la case « J'ai déjà choisi mon créneau » (v61 ; avant : « J'ai réservé ») s'affichent normalement", !!(await page.$("#dc-reserve-case")));
    await cliquerCal(page, "#vue .masthead a[data-dc-cal]"); await attendre(page, 2000);
    const cl = ((contenu(db, "challenge") || {}).cta || {}).clics || [];
    /* v61 : source accueil_haut (avant : decouverte) */
    ok("… un clic sur cette clé piégée : noté sans erreur (source accueil_haut)", cl.length >= 1 && (cl[cl.length - 1] || {}).source === "accueil_haut" && !(await page.evaluate(() => window.__xss)), JSON.stringify(cl).slice(0, 200));
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
    /* v52 : « Submit my answers » (avant : « See my result ») ; v60 : « See my next step » */
    /* v60 : + l'intro anglaise et la 1re carte traduite (« Lose fat — Get leaner »), sa valeur restant l'option française */
    const carte1 = await page.$eval("#q-probleme label.dc-opt", l => l.querySelector("input").value + "|" + l.querySelector(".dc-opt-l").textContent.trim() + "|" + l.querySelector(".dc-opt-s").textContent.trim()).catch(() => "");
    ok("anglais : « Discovery » (v52 : sans « Day n/7 »), « 3 questions, 30 seconds », « Your questionnaire », cartes traduites, « See my next step »", (await eyebrow(page)) === "Discovery" && (await lede(page)) === "3 questions, 30 seconds: tell us where you're at." && (await texte(page, "#vue")).includes("Your questionnaire") && carte1 === "Perdre du gras|Lose fat|Get leaner" && (await texte(page, "#dc-voir")) === "See my next step", (await eyebrow(page)) + " · " + (await lede(page)) + " · " + carte1 + " · " + (await texte(page, "#dc-voir")));
    await toucherTropTot(page); await attendre(page, 300);
    /* v60 : « One answer is missing » (avant : « Missing: … ») */
    ok("anglais : « One answer is missing » si rien n'est rempli", (await texte(page, "#dc-msg")) === "One answer is missing", await texte(page, "#dc-msg"));
    await c.close();
  });
  await bloc("H. anglais, page bilan et accueil", async () => {
    /* v52 : la page bilan puis l'accueil (avant : le résultat, « Your result », « Your 3 priorities »…) */
    const db = base({ intake: avecCourt(N) });
    const { c, page } = await contexte(b, lea, db, { langue: "en" });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2600);
    const vb = await texte(page, "#vue");
    /* v61 : la page « Your personalized action plan », élément par élément (avant : « Your next step », « Book my
       assessment », « Not now, explore my space ») ; aucun de ses textes français (les nouveaux ; l'ancien « Réserver mon
       bilan » reste cherché aussi) */
    const planEn = {}; for (const k of ["dc-offert", "dc-projection", "dc-bilan-texte", "dc-bilan-garde", "dc-bilan-libre", "dc-bilan-reserver", "dc-bilan-sous", "dc-bilan-plus-tard"]) planEn[k] = await texte(page, "#" + k);
    planEn.h2 = await texte(page, "#dc-bilan h2");
    const PLAN_EN = { "dc-offert": "Free", "dc-projection": "Your goal in 3 months: “" + N.projection_precision + "”", "dc-bilan-texte": "In a 15-minute call with Lucas, we turn this goal into a concrete plan: what's really holding you back, where to start, and the 3 actions to put in place first.", "dc-bilan-garde": "The plan is yours to keep, whatever you decide next.", "dc-bilan-libre": "If coaching is a good fit, Lucas will tell you about it at the end, only if you want. You're free to say no.", "dc-bilan-reserver": BOUTON_EN, "dc-bilan-sous": "15 min · phone call · free", "dc-bilan-plus-tard": "Later, let me explore my space", h2: "Your personalized action plan" };
    ok("anglais : page « Your personalized action plan » (« Free », « Your goal in 3 months: … », 15-minute call with Lucas, « Get my action plan », « 15 min · phone call · free », « Later, let me explore my space »), aucun texte français de la page", Object.keys(PLAN_EN).every(k => planEn[k] === PLAN_EN[k]) && !["Récupérer mon plan d'action", "Ton plan d'action personnalisé", "Ton objectif dans 3 mois", "par téléphone", "Plus tard", "Tu es libre de dire non", "Réserver mon bilan"].some(x => vb.includes(x)), JSON.stringify(planEn));
    await page.click("#dc-bilan-plus-tard"); await attendre(page, 1500);
    const v = await texte(page, "#vue");
    /* v61 : « What coaching adds », « I've already booked my slot » (avant : « With MHX coaching », « I booked my
       assessment ») ; + les 4 descriptions anglaises de la carte, sa note et la ligne sous le bouton du haut */
    const lignesEn = await page.$$eval("#dc-accomp .liste-debloque li", l => l.map(li => li.textContent.split(" — ").slice(1).join(" — ").trim())).catch(() => []);
    ok("anglais : accueil (« What coaching adds » et ses 4 descriptions, « 15 min with Lucas to go over your goal. Free. », « I've already booked my slot », « 15 min with Lucas · free » en haut, Speed Formation)", ["What coaching adds", "I've already booked my slot", "15 min with Lucas to go over your goal. Free.", "Speed Formation"].every(x => v.includes(x)) && JSON.stringify(lignesEn) === JSON.stringify(VITRINE.map(id => AVANTAGES_EN[id])) && (await texte(page, "#vue .masthead .dc-haut-sous")) === SOUS_EN, JSON.stringify(lignesEn) + " · " + v.slice(0, 300));
    /* v61 : « Get my action plan » (avant : « Book my assessment ») ; aucun texte français de l'accueil (les nouveaux, et les
       anciens toujours cherchés) */
    ok("anglais : « Get my action plan » (en-tête et accompagnement), aucun « Récupérer mon plan d'action » ni autre texte français de l'accueil", (await texte(page, "#vue .masthead a[data-dc-cal]")) === BOUTON_EN && (await texte(page, "#dc-accomp a[data-dc-cal]")) === BOUTON_EN && !["Récupérer mon plan d'action", "Ce que l'accompagnement ajoute", "J'ai déjà choisi mon créneau", "15 min avec Lucas", "Réserver mon bilan", "Avec l'accompagnement MHX"].some(x => v.includes(x)), v.slice(0, 300));
    await aller(page, "#/decouverte/reponses", 1500);
    /* v60 : « See my next step » (avant : « Submit my answers ») */
    ok("anglais : « Modifier mes réponses » → « See my next step » et « Discard changes »", (await texte(page, "#dc-voir")) === "See my next step" && (await texte(page, "#dc-annuler")) === "Discard changes", (await texte(page, "#dc-voir")) + " · " + (await texte(page, "#dc-annuler")));
    await aller(page, "#/programme", 1400);
    /* v52 (lot E) : #/programme a son exemple, puis l'appel en anglais à la place de « This feature is available… » */
    /* v61 (lot 2, brief V2 G) : le texte anglais propre à la page programme, comparé en entier (avant : « Want a program
       built for you… Book your assessment. », contenu dans la carte), « Get my action plan » (avant : « Book my
       assessment »), la ligne « 15 min with Lucas · free » et la note anglaise de ce que l'accompagnement ajoute */
    const pvEn = await texte(page, "#vue .verrou > p:not(.verrou-sous)");
    ok("anglais : page verrouillée « This starter workout is the same for everyone… » + « Get my action plan », « 15 min with Lucas · free », note « Workouts built for you… »", pvEn === "This starter workout is the same for everyone. Your program starts from your level, your equipment and your schedule, then evolves as you progress." && (await texte(page, "#vue .verrou a[target=_blank]")) === BOUTON_EN && (await texte(page, "#vue .verrou > p.verrou-sous")) === SOUS_EN && (await texte(page, "#vue .verrou-plus")) === AVANTAGES_EN.programme, pvEn + " · " + (await texte(page, "#vue .verrou")) + " · " + (await texte(page, "#vue .verrou-plus")));
    await c.close();
  });
  await bloc("H. mobile, questionnaire", async () => {
    const db = base();
    const { c, page } = await contexte(b, lea, db, { viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    ok("mobile 390 px : questionnaire sans débordement horizontal", !!(await page.$("#q-probleme")) && !(await deborde(page)), String(await page.evaluate(() => document.documentElement.scrollWidth)));
    await toucherTropTot(page); await attendre(page, 400);
    /* v60 : « Il manque une réponse » (avant : un message commençant par « Il manque ») */
    ok("mobile 390 px : message « Il manque une réponse » affiché, toujours sans débordement", (await texte(page, "#dc-msg")) === "Il manque une réponse" && !(await deborde(page)), await texte(page, "#dc-msg"));
    const barre = await page.$$eval("#barre-bas a", l => l.map(a => a.dataset.id)).catch(() => []);
    /* v52 (lot D) : la barre du bas du prospect est Accueil, Calculateur, Progression, Speed Formation (le Profil passe dans « Plus ») */
    ok("mobile : barre du bas Accueil, Calculateur, Progression, Speed Formation, sans Challenge", JSON.stringify(barre) === '["accueil","calculateur","mensurations","formation"]' && !barre.includes("challenge"), JSON.stringify(barre));
    await page.screenshot({ path: path.join(OUT, "questionnaire-mobile.png"), fullPage: true });
    await c.close();
  });
  await bloc("H. mobile, page bilan et accueil", async () => {
    /* v52 : réponse « projection » très longue sur la page bilan, puis l'accueil (avant : le résultat, vidéo ouverte) */
    const LONGUE = "Une projection très longue ".repeat(12);   // v60 : précision et texte français cohérents (la page montre la précision)
    const db = base({ intake: avecCourt(Object.assign({}, N, { projection: LONGUE, projection_precision: LONGUE })) });
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
    ok("Mes clients : Léa « Découverte · inscrit depuis 2 j » + « a cliqué Plan d'action » ; Marc « Découverte · inscrit depuis 10 j »", lLea.includes("Découverte · inscrit depuis 2 j") && lLea.includes("a cliqué Plan d'action") && lMarc.includes("Découverte · inscrit depuis 10 j") && !/J\d+\/7|terminée/.test(lLea + lMarc), lLea + " | " + lMarc);
    await page.click(`[data-ouvrir="${PROSPECT}"]`).catch(() => {}); await attendre(page, 2200);
    const f = await texte(page, "#fiche-decouverte");
    ok("fiche de Léa : bloc « Découverte » (inscrit depuis 2 j — v52 ; avant : jour 3 / 7 —, questionnaire rempli, objectif, motivation 8 / 10, 1 clic, case pas cochée)", f.includes("inscrit depuis 2 j") && !f.includes("/ 7") && f.includes("rempli le") && f.includes("Perte de poids / sèche") && f.includes("8 / 10") && f.includes("1 clic") && f.includes("pas cochée"), f.slice(0, 300));
    /* v61 : l'adresse du nouvel événement (CAL), demandée avec un code nouveau (accueil_haut ; avant : decouverte) */
    ok("fiche de Léa : lienCalendly() rend l'adresse brute pour le coach, aucune écriture (tableau de bord, page Prospects, Mes clients, fiche)", (await page.evaluate(() => typeof lienCalendly === "function" ? lienCalendly("accueil_haut") : null)) === CAL && db.ecritures.length === 0);
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
    ok("Mes clients (même appareil) : Léa « Découverte · inscrit depuis 2 j » + « bilan réservé » (et pas « a cliqué Plan d'action ») ; Marc « Découverte · inscrit depuis 10 j » (v52)", lLea.includes("Découverte · inscrit depuis 2 j") && lLea.includes("bilan réservé") && !lLea.includes("a cliqué Plan d'action") && lMarc.includes("Découverte · inscrit depuis 10 j"), lLea + " | " + lMarc);
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
    /* v61 : + « Récupérer mon plan d'action » (le bouton du prospect ; « Réserver mon bilan » reste cherché) */
    const rien = async () => !(await page.$("#dc-vue, #dc-resultat, #q-motivation, [data-dc-cal], #vue .verrou")) && !(await texte(page, "#vue")).includes("Découverte") && !(await texte(page, "#vue")).includes("Réserver mon bilan") && !(await texte(page, "#vue")).includes(BOUTON);
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
