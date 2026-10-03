/* v40 — mode gratuit (prospects) : cadenas, pages verrouillées, Calendly, aucun prix.
   Réécrite pour la Découverte (le Challenge 7 jours n'existe plus, branche test/abandon-challenge) :
   - accueil du prospect = écran Découverte : « Découverte · Jour n/7 » (jour 1 = jour LOCAL de l'inscription,
     profils.cree_le), questionnaire court tant que intake.court_le n'est pas posé (sans bouton Calendly, quel
     que soit le jour), puis résultat avec « Réserver mon bilan » ;
     v52 (28/09/2026, Chantier 1 lot C) : le questionnaire court a 3 questions (probleme, obstacle, projection), sans âge ;
     une fois validé, la page de proposition de bilan (vérifiée par verif56), puis l'accueil (Speed Formation,
     « Réserver mon bilan ») : l'ancien écran « résultat » n'est plus affiché ;
   - navigation : accueil, profil, Speed Formation (ouverte les 7 premiers jours) et la vitrine verrouillée
     (programme, nutrition, suivi ; formation après le jour 7) ; mensurations, compléments, bilan cachés
     mais verrouillés à leur adresse ; plus d'onglet Challenge, ses anciennes adresses mènent à #/decouverte ;
   - pages verrouillées : cadenas, « Réserver mon bilan » vers Calendly (utm_content=verrou-<id>, prénom et
     email pré-remplis), AUCUNE donnée lue ni affichée (la prospecte a des données témoins qu'elle ne doit
     jamais voir), aucune écriture ; un clic est noté dans la clé « challenge » ;
   - v52 (lot D, gratuit pour toujours) : plus de « Jour n/7 », plus de verrou de la Speed Formation au jour 8 ; calculateur,
     Ma progression et Speed Formation ouverts, « Mon journal » dans la vitrine (programme, nutrition, journal, suivi) ;
     les vérifications du jour 8, du mode test et de la date locale du « Jour n » sont retirées (fonction supprimée) ;
   - aucun prix, tarif ni abonnement nulle part (pages FR / EN, volets, inscription, textes de la Découverte,
     avantages et tout le dictionnaire anglais) ;
   - client, coach sur une fiche, base sans colonne statut : inchangés.
   - v61 (lot 2, brief V2 E, F, G, décision 4) : partout « Récupérer mon plan d'action » / « Get my action plan » (avant :
     « Réserver mon bilan » / « Book my assessment ») suivi de « 15 min avec Lucas · offert » / « 15 min with Lucas · free »
     (accueil : sous le bouton du haut ; carte : sa note « 15 min avec Lucas pour faire le point… ») ; lien Calendly de
     l'événement de 15 min avec utm_source=app, utm_medium=bouton, utm_content = accueil_haut, accueil_accompagnement,
     verrou_<page> (clic noté avec la même source) ; un texte propre à chaque page verrouillée de la vitrine ; texte court des
     conditions : « dont tes clics sur « Récupérer mon plan d'action » ». Nombre de vérifications inchangé (64).
   - v64 (lot 5, brief V2 A) : écran d'inscription « Créer mon espace gratuit » / « Create my free account », UNE case obligatoire
     (#c-cgu) et la newsletter, plus de case santé (#c-sante absente) ; « CGU » et « politique de confidentialité » (« Terms of
     Use », « Privacy Policy ») sont 2 liens distincts vers les PDF (href = CONFIG.textes_legaux, servis avec LEGAUX_TEST ;
     target=_blank, rel=noopener ; jamais cliqués) au lieu d'un lien vers le volet des conditions : le volet (et son contrôle
     des prix) reste vérifié depuis le profil (blocs D et F). Nombre de vérifications inchangé (64).
   - v71 (D) : « Suivi de mes clients » (#tb-clients) ne liste plus les prospects (ligne #clients-prospects → Prospects) : dans le
     bloc I coach, la fiche de Léa s'ouvre par Clients.ouvrir au lieu du clic sur son [data-ouvrir] (disparu), après contrôle de
     son absence du tableau et de la ligne de renvoi. Nombre de vérifications inchangé.
   Supabase simulé : rien ne part vers la vraie base ; les écritures dans donnees sont appliquées en mémoire,
   et TOUTE requête non-GET vers /rest/v1/* est relevée (méthode + adresse) pour les contrôles « aucune écriture ».
   Chaque bloc est protégé : une exception (élément absent, délai dépassé) note un ✗ et la suite continue ;
   les résultats sont toujours affichés.
   Usage : node verif40.js ../index.html                                         */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const PORT = 9671;
const OUT = path.join(__dirname, "captures", "v40"); fs.mkdirSync(OUT, { recursive: true });
let inscriptionLibre = false;
/* 52.1 : la retouche vaut pour la page et pour ses fichiers (inscription_libre est dans js/config.js) */
const { servirFichier, forcerInscription } = require("./fichiers");   // 52.1 : la page charge css/ et js/, servis depuis son dossier (fichiers.js)
/* v54 : l'inscription est ouverte dans le fichier (inscription_libre: true) ; la retouche FORCE la valeur voulue
   (inscriptionLibre, fermée par défaut comme avant), dans les deux sens : la suite reste valable si Lucas la referme.
   v55 : par forcerInscription (fichiers.js), comme toutes les suites qui testent l'inscription (les autres servent la valeur
   du fichier) */
/* v64 (lot 5, brief V2 A2) : les 3 emplacements CONFIG.textes_legaux (js/config.js, « à compléter » tant que Lucas ne les a
   pas remplis) servis avec des valeurs de test valides (liens Drive fictifs, jamais ouverts ; version postérieure au
   2026-09-30) le temps du bloc G (legaux = LEGAUX_TEST), sinon tels quels. Aucun test ne clique un lien PDF. */
const LEGAUX_TEST = { cgu_pdf: "https://drive.google.com/file/d/TEST-CGU/view", confidentialite_pdf: "https://drive.google.com/file/d/TEST-POLITIQUE/view", cgu_version: "2026-10-01" };
let legaux = null;
const poserLegaux = t => legaux ? t.replace(/\b(cgu_pdf|confidentialite_pdf|cgu_version): "[^"\n]*"/g, (x, k) => k + ": " + JSON.stringify(legaux[k])) : t;
const retouche = h => poserLegaux(forcerInscription(h, inscriptionLibre));
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML, retouche)) return;
  let h = retouche(fs.readFileSync(HTML, "utf8"));
  res.writeHead(200, { "Content-Type": "text/html" }); res.end(h);
});
const res = []; const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + String(d || "").replace(/\s+/g, " ").trim()));
const PROSPECT = "00000000-0000-4000-8000-000000000c04", EQUIPE = "00000000-0000-4000-8000-0000000000e1";
/* v61 (lot 2, brief V2 F) : l'événement de 15 min « Ton plan d'action offert » (avant : …/mhx-coaching/30min) */
const CAL = "https://calendly.com/mhx-coaching/ton-plan-d-action-offert-15-min-avec-lucas";
/* le lien attendu pour la prospecte Léa Démo (l@e.fr) : source de l'écran + prénom et email pré-remplis.
   v52 (lot B) : son nom aussi (profils.nom « Démo ») : name = « Léa Démo », first_name, last_name
   v61 (lot 2, F) : utm_source=app, utm_medium=bouton (avant : app-mhx / app), codes d'origine avec « _ » (accueil_haut,
   accueil_accompagnement, verrou_<page> ; avant : decouverte, decouverte-accompagnement, verrou-<page>) ; même ordre */
const lienPre = src => CAL + "?utm_source=app&utm_medium=bouton&utm_content=" + src + "&name=L%C3%A9a%20D%C3%A9mo&first_name=L%C3%A9a&last_name=D%C3%A9mo&email=l%40e.fr";
/* v61 (lot 2, vocabulaire commun) : le bouton unique partout où le bilan est proposé au prospect (avant : « Réserver mon
   bilan » / « Book my assessment ») et sa petite ligne dessous (nouvelle) */
const CTA = { fr: "Récupérer mon plan d'action", en: "Get my action plan" };
const SOUS = { fr: "15 min avec Lucas · offert", en: "15 min with Lucas · free" };
/* la note de la carte « Ce que l'accompagnement ajoute », sous son bouton (avant : « Un bilan de 30 minutes… ») */
const NOTE_ACCOMP = { fr: "15 min avec Lucas pour faire le point sur ton objectif. Offert.", en: "15 min with Lucas to go over your goal. Free." };
/* v61 : les textes français passent par typoFr (espace insécable avant « : ; ? ! » et dans « ») : comparés après
   remplacement des espaces insécables (U+00A0, U+202F) par des espaces simples. (norm, plus haut, ne le fait pas : sa
   classe ne contient que des espaces simples.) */
const plat = t => String(t || "").replace(/[\u00a0\u202f]/g, " ");
/* inscription il y a n jours (10 h, heure locale) : la prospecte est au jour n + 1 de sa découverte */
const inscritIlYA = n => { const d = new Date(); d.setHours(10, 0, 0, 0); d.setDate(d.getDate() - n); return d.toISOString(); };
/* la date locale (AAAA-MM-JJ) d'il y a n jours */
const jourLocal = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
/* inscription à hh h mm, heure locale d'un fuseau à décalage fixe (en heures), n jours avant la date du jour DANS ce fuseau */
const inscritDansFuseau = (decalage, n, hh, mm) => { const l = new Date(Date.now() + decalage * 3600e3); return new Date(Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), l.getUTCDate() - n, hh, mm) - decalage * 3600e3).toISOString(); };
const norm = t => String(t || "").replace(/[  ]/g, " ");
/* l'écran Découverte s'affiche dans #acc-vue (accueil du prospect) ou #dc-vue (adresse #/decouverte) */
const DC_ZONE = ":is(#acc-vue, #dc-vue)", DC_ECRAN = "#vue :is(#dc-voir, #dc-resultat, [data-dc-cal])";
/* v52 : les 3 questions du questionnaire court (avant : 10, dont l'âge) */
const QUESTIONS_COURT = ["probleme", "obstacle", "projection"];
/* v60 (lot 1, brief V2 C) : les 3 questions sont des cadres à toucher (fieldset.dc-q#q-<id> : cartes pour probleme, pastilles
   pour obstacle et projection), plus aucun select ni textarea #q-<id>. Dans l'écran, les seuls [id^='q-'] sont ces 3 cadres
   et ce qu'ils contiennent : le message « 2 réponses max » (#q-obstacle-max) et les 2 précisions libres facultatives
   (#q-obstacle-precision, #q-projection-precision). Avant : exactement 3 champs #q-probleme, #q-obstacle, #q-projection. */
const IDS_COURT = ["q-probleme", "q-obstacle", "q-obstacle-max", "q-obstacle-precision", "q-projection", "q-projection-precision"];
const BOUTON_COURT = "Voir ma prochaine étape";   // v60 (avant : « Valider mes réponses »)
/* tous les [id^='q-'] de l'écran Découverte, et les cadres de question (fieldset.dc-q) */
const champsCourt = async page => ({ ids: await page.$$eval(DC_ZONE + " [id^='q-']", l => l.map(e => e.id)).catch(() => []), questions: await page.$$eval(DC_ZONE + " fieldset.dc-q", l => l.map(e => e.id)).catch(() => []),
  /* les réponses à toucher de chaque cadre : r = radio, c = case (3 cartes, 6 pastilles à 2 choix, 5 pastilles à 1 choix) */
  opts: await page.$$eval(DC_ZONE + " fieldset.dc-q", l => l.map(f => f.id + ":" + [...f.querySelectorAll("label.dc-opt input")].map(i => i.type[0]).join(""))).catch(() => []) });
/* exactement les 3 questions du questionnaire court (dans l'ordre) et leurs éléments, rien d'autre (donc pas d'âge) */
const courtOk = ch => JSON.stringify(ch.ids) === JSON.stringify(IDS_COURT) && JSON.stringify(ch.questions) === JSON.stringify(QUESTIONS_COURT.map(q => "q-" + q)) && !ch.ids.includes("q-age")
  && JSON.stringify(ch.opts) === '["q-probleme:rrr","q-obstacle:cccccc","q-projection:rrrrr"]';
/* v52 : un questionnaire validé (3 réponses) dont la page de proposition de bilan est passée (« Pas maintenant ») :
   l'accueil du prospect s'affiche (avant la v52 : le résultat, directement) */
const intakeCourt = n => ({ probleme: "Perdre du gras", obstacle: "Le manque de temps.", projection: "Retrouver de l'énergie.", objectif: "Perte de poids / sèche",
  court_le: inscritIlYA(n), bilan_propose: { choix: "plus_tard", le: inscritIlYA(n) } });
/* un ancien prospect du Challenge 7 jours : son questionnaire (sans court_le) et sa clé challenge, formes de verif44 */
const INTAKE_CHALLENGE = { sexe: "Femme", age: "29", taille: "168", poids: "64", poids_obj: "60", objectif: "Perte de poids / sèche", niveau: "Débutant (0 à 6 mois)", seances: "3", lieu: "À la maison", nb_repas: "3 repas", sommeil_h: "6.5", energie: "4" };
const jourFait = (n, quand) => ({ fait: quand + "T08:00:00.000Z", date: quand });
const challengeAncien = debut => ({ version: 1, debut, jours: { "1": jourFait(1, debut) }, cta: { clics: [] }, termine: null });
/* données témoins : ce qu'aurait un ancien client redevenu prospect. Une page verrouillée ne doit JAMAIS les lire */
const TEMOIN = "TÉMOIN-LÉA";
const CLES_TEMOINS = ["programme", "repas", "mens", "complements", "checkins", "journal", "formation"];
/* aucun prix, tarif ni abonnement, en français comme en anglais. Les tournures figurées « at a price » (« Faster comes at
   a price: hunger… », texte du Challenge de main) et « à tout prix » ne sont pas des prix : un vrai prix porte de toute
   façon une devise ou « /mois » */
const PRIX = /€|\$|£|\bEUR\b|\beuros?\b|\bdollars?\b|(?<!à tout )\bprix\b|tarif|abonnement|\/\s*mois|(?<!\bat a )\bprices?\b|pricing|subscription|\/\s*month/i;
const prixTrouve = t => { const m = PRIX.exec(t); return m ? "« " + t.slice(Math.max(0, m.index - 60), m.index + 40).replace(/\s+/g, " ") + " »" : ""; };
/* le volet des conditions est bien ouvert quand son paragraphe « Hébergement » est dans la page */
const HEBERGEMENT = { fr: "Hébergement : Supabase", en: "Hosting: Supabase" };

function base(opts) {
  opts = opts || {};
  const jours = opts.ilYA == null ? 3 : opts.ilYA;
  const cree = opts.cree || inscritIlYA(jours);
  const profils = JSON.parse(JSON.stringify(F.profils)).concat([
    { id: PROSPECT, prenom: "Léa", nom: "Démo", role: "client", cree_le: cree },
    { id: EQUIPE, prenom: "Équipe", nom: "Démo", role: "coach", cree_le: "2026-09-02T10:00:00Z" }
  ]);
  if (!opts.sansStatut) profils.forEach(p => { p.statut = p.id === PROSPECT ? "prospect" : "client"; });
  const donnees = JSON.parse(JSON.stringify(F.donnees));
  const maj = cree.slice(0, 10) + "T10:00:00+00:00";
  /* intake : null = questionnaire court pas encore rempli (compte tout neuf) */
  if (opts.intake !== null) donnees.push({ user_id: PROSPECT, outil: "intake", contenu: opts.intake || intakeCourt(jours), maj_le: maj });
  if (opts.challenge) donnees.push({ user_id: PROSPECT, outil: "challenge", contenu: opts.challenge, maj_le: maj });
  CLES_TEMOINS.forEach(o => {
    const src = F.donnees.find(x => x.user_id === F.IDS.c1 && x.outil === o); if (!src) return;
    const contenu = JSON.parse(JSON.stringify(src.contenu));
    if (o === "programme") { contenu.nom = "Programme " + TEMOIN; contenu.seances[0].nom = "Séance " + TEMOIN; }
    if (o === "repas" || o === "complements") contenu.note = "Note " + TEMOIN;
    donnees.push({ user_id: PROSPECT, outil: o, contenu, maj_le: maj });
  });
  if (opts.prefs) donnees.push({ user_id: PROSPECT, outil: "prefs", contenu: opts.prefs, maj_le: maj });
  /* requetes : toute requête non-GET vers /rest/v1/* (méthode + adresse), quelle que soit la table, avec ou sans corps */
  return { profils, donnees, patchs: [], ecritures: [], requetes: [], inscriptions: [], calendly: [] };
}
const ouverts = [];
async function contexte(b, who, db, opts) {
  opts = opts || {};
  const c = await b.newContext(Object.assign({ viewport: opts.viewport || { width: 1280, height: 900 } }, opts.fuseau ? { timezoneId: opts.fuseau } : {}));
  ouverts.push(c);
  c.setDefaultTimeout(6000);
  await c.route("**/*", async r => {
    const req = r.request(); const u = req.url(); const host = new URL(u).hostname;
    if (host === "localhost") return r.continue();
    /* Calendly : une page blanche (rien ne part sur Internet), l'adresse ouverte est notée */
    if (host === "calendly.com") { db.calendly.push(u); return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" }); }
    if (!host.endsWith(".supabase.co")) return r.abort();
    const url = new URL(u); const p = url.pathname, q = url.searchParams, m = req.method();
    const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", body: body === null ? "" : JSON.stringify(body) });
    /* v56 : la connexion notée par la base (fonction noter_connexion, au démarrage d'un prospect) n'est pas une écriture de
       l'app dans les données : elle est testée à part (verif61) */
    if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
    if (p.startsWith("/rest/v1/") && !["GET", "HEAD", "OPTIONS"].includes(m)) db.requetes.push(m + " " + decodeURIComponent(p + url.search));
    if (p.startsWith("/auth/v1/signup")) {
      const corps = JSON.parse(req.postData() || "{}"); db.inscriptions.push(corps);
      return json({ msg: "Signups not allowed for this instance" }, 422);   // aucune inscription dans cette suite
    }
    if (p.startsWith("/auth/v1/token")) return json(who ? F.session(who.id, who.email) : { error: "invalid" }, who ? 200 : 400);
    if (p.startsWith("/auth/v1/")) return json({});
    if (p === "/rest/v1/profils") {
      if (m !== "GET") { db.patchs.push({ m, corps: req.postData() }); return json(null, 204); }
      const id = q.get("id"); return json(id ? db.profils.filter(x => x.id === id.slice(3)) : db.profils);
    }
    if (p === "/rest/v1/donnees") {
      if (m !== "GET") {
        let rows = []; try { rows = JSON.parse(req.postData() || "[]"); } catch (e) { }
        (Array.isArray(rows) ? rows : [rows]).forEach(row => {
          db.ecritures.push({ m, user_id: row.user_id, outil: row.outil, contenu: row.contenu });
          const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
          const ligne = { user_id: row.user_id, outil: row.outil, contenu: row.contenu, maj_le: new Date().toISOString() };
          if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        });
        return json(null, 201);
      }
      let l = db.donnees; const uid = q.get("user_id"), o = q.get("outil") || "";
      if (who && who.id !== F.IDS.coach) l = l.filter(x => x.user_id === who.id && x.outil !== "notes_coach");
      if (uid) l = l.filter(x => x.user_id === uid.slice(3));
      if (o.startsWith("eq.")) l = l.filter(x => x.outil === o.slice(3));
      if (o.startsWith("in.(")) { const k = o.slice(4, -1).split(","); l = l.filter(x => k.includes(x.outil)); }
      if (o.startsWith("not.in.(")) { const k = o.slice(8, -1).split(","); l = l.filter(x => !k.includes(x.outil)); }
      const sel = (q.get("select") || "*").split(","); if (!sel.includes("*")) l = l.map(x => Object.fromEntries(sel.map(k => [k, x[k]])));
      return json(l);
    }
    const t = p.replace("/rest/v1/", "");
    if (F.catalogue[t]) { let l = F.catalogue[t]; const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return json(l); }
    return json([]);
  });
  await c.addInitScript(({ s, langue }) => { if (s) localStorage.setItem("mhx_session", JSON.stringify(s)); localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); if (langue) localStorage.setItem("mhx_langue", langue); }, { s: who ? who.session : null, langue: opts.langue || "" });
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  /* toutes les requêtes vers la table donnees (lectures ET écritures), avec leur méthode */
  page.donnees = [];
  page.on("request", rq => { if (rq.url().includes("/rest/v1/donnees")) page.donnees.push(rq.method() + " " + decodeURIComponent(rq.url()).replace(/^https:\/\/[^/]+/, "")); });
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of 4\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF"); d.dismiss(); });
  return { c, page };
}
/* un bloc de vérifications : une exception (élément absent, délai dépassé) note un ✗ au lieu d'arrêter toute la suite */
async function bloc(nom, fn) {
  try { await fn(); }
  catch (e) { ok(nom + " : bloc interrompu par une exception (les vérifications suivantes du bloc n'ont pas tourné)", false, String((e && e.message) || e).split("\n")[0].slice(0, 240)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); }
}
const coach = { id: F.IDS.coach, email: "c@e.fr", session: F.session(F.IDS.coach, "c@e.fr") };
const lea = { id: PROSPECT, email: "l@e.fr", session: F.session(PROSPECT, "l@e.fr") };
const thomas = { id: F.IDS.c1, email: "t@e.fr", session: F.session(F.IDS.c1, "t@e.fr") };
const attendre = (page, ms) => page.waitForTimeout(ms);
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1400); };
const texte = async (page, sel) => norm(await page.textContent(sel || "#vue", { timeout: 3000 }).catch(() => ""));
/* un clic qui ne plante jamais la suite : false si l'élément n'est pas là */
const cliquer = (page, sel) => page.click(sel, { timeout: 3000 }).then(() => true, () => false);
/* tout le texte de la page, y compris ce qui est replié ou masqué (détails, volets), sans les scripts */
const toutLeTexte = page => page.evaluate(() => { const b = document.body.cloneNode(true); b.querySelectorAll("script, style, template, noscript").forEach(e => e.remove()); return document.body.innerText + "\n" + b.textContent; }).then(norm);
/* le texte de #vue et les valeurs de ses champs (le coach modifie un programme dans des champs) */
const valeursVue = page => page.evaluate(() => { const v = document.querySelector("#vue"); return v ? v.innerText + " " + [...v.querySelectorAll("input, textarea")].map(i => i.value).join(" ") : ""; }).then(norm);
const navIds = page => page.$$eval("#nav a", l => l.map(a => a.dataset.id));
const cadenasNav = page => page.$$eval("#nav a", l => l.filter(a => a.querySelector(".nav-cadenas")).map(a => a.dataset.id));
const barreIds = page => page.$$eval("#barre-bas a", l => l.map(a => a.dataset.id));
const calendlyVue = async page => (await page.$$("#vue a[href*='calendly']")).length;
/* le contenu du verrou affiché dans #vue (null s'il n'y en a pas) */
const verrou = page => page.$eval("#vue .verrou", el => {
  const a = el.querySelector("a");
  /* v61 : + la ligne sous le bouton (p.verrou-sous, juste après le bloc du bouton) et le nombre de liens du verrou */
  const sous = el.querySelector(".actions + p.verrou-sous");
  return { cadenas: !!el.querySelector(".cadenas svg"), titre: (el.querySelector("h2") || {}).textContent || "", texte: (el.querySelector("p") || {}).textContent || "",
           lien: a ? { href: a.href, t: a.textContent.trim(), cible: a.target, rel: a.rel } : null,
           sous: sous ? sous.textContent.trim() : null, nLiens: el.querySelectorAll("a").length };
}).catch(() => null);
/* v61 (lot 2) : un seul lien, « Récupérer mon plan d'action » / « Get my action plan » (lang = "en" en anglais), vers le
   lien pré-rempli de son code d'origine, puis la ligne « 15 min avec Lucas · offert » / « 15 min with Lucas · free »
   (avant : « Réserver mon bilan », sans ligne dessous) */
const lienOk = (v, src, lang) => !!(v && v.lien && v.nLiens === 1 && v.lien.href === lienPre(src) && v.lien.t === CTA[lang || "fr"] && v.lien.cible === "_blank" && /noopener/.test(v.lien.rel) && plat(v.sous) === SOUS[lang || "fr"]);
/* les clés de données chargées dans l'appli (toutes les boîtes du cache) ; null si le cache n'est pas lisible */
const clesChargees = page => page.evaluate(() => {
  try { const bs = Store.boites ? Object.values(Store.boites) : [Store.cache]; return [...new Set(bs.flatMap(x => Object.keys(x || {})))]; } catch (e) { return null; }
});
/* clic sur le « Récupérer mon plan d'action » (v61 ; avant : « Réserver mon bilan ») d'une page verrouillée : l'adresse de
   l'onglet ouvert, ou null si le bouton manque */
const cliquerVerrou = async (c, page) => {
  if (!(await page.$("#vue .verrou a"))) return null;
  const [pop] = await Promise.all([c.waitForEvent("page", { timeout: 4000 }).catch(() => null), cliquer(page, "#vue .verrou a")]);
  await attendre(page, 2200);
  const u = pop ? pop.url() : "";
  if (pop) await pop.close().catch(() => {});
  return u;
};

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();
  /* v52 (lot D) : Ma progression est ouverte au prospect ; « Mon journal » est verrouillé */
  const VERROUILLES = ["programme", "nutrition", "journal", "suivi", "complements", "bilan"];
  const TEXTE_VERROU = "Cette fonctionnalité est disponible avec l'accompagnement MHX.";
  const TEXTE_VERROU_EN = "This feature is available with MHX coaching.";
  /* v52 (28/09/2026, Chantier 1 lot E) : programme, nutrition, suivi (et journal, lot D) montrent d'abord un exemple
     générique marqué « Exemple » (#ech-<id>, vérifié en détail par verif56, blocs E1), puis cet appel à la place du texte
     du verrou ; les autres pages verrouillées gardent « Cette fonctionnalité… ». Le contrat ne change pas : une page
     verrouillée ne fait aucune requête vers ses données (la journée type lit le catalogue public, pas la table donnees). */
  const AVEC_EXEMPLE = ["programme", "nutrition", "journal", "suivi"];
  /* v61 (lot 2, brief V2 G) : un texte propre à chaque page de la vitrine, qui prolonge son exemple (avant : le même appel
     partout, « Tu veux un programme construit pour toi, qui évolue chaque semaine ? Réserve ton bilan. » / « Want a program
     built for you that evolves every week? Book your assessment. ») ; les pages cachées gardent « Cette fonctionnalité… » */
  const APPELS = {
    programme: "Cette séance découverte est la même pour tout le monde. Ton programme, lui, part de ton niveau, de ton matériel et de ton emploi du temps, puis évolue avec tes progrès.",
    journal: "Avec l'accompagnement, chaque séance est notée et l'app te propose la charge à viser la fois suivante : tu sais toujours quoi faire pour progresser.",
    nutrition: "Avec l'accompagnement, tes repas sont calculés sur tes calories et tes macros, en tenant compte de ton régime et de tes allergies, avec ta liste de courses.",
    suivi: "Avec l'accompagnement, ton coach lit ton bilan chaque semaine et te répond avec la suite du plan : tu sais toujours où tu en es et quoi faire ensuite."
  };
  const APPELS_EN = {
    programme: "This starter workout is the same for everyone. Your program starts from your level, your equipment and your schedule, then evolves as you progress.",
    journal: "With coaching, every workout is logged and the app suggests the weight to aim for next time: you always know what to do to progress.",
    nutrition: "With coaching, your meals are calculated from your calories and macros, taking your diet and allergies into account, with your shopping list.",
    suivi: "With coaching, your coach reads your weekly check-in and replies with the next step: you always know where you stand and what to do next."
  };
  const texteVerrou = (r, en) => AVEC_EXEMPLE.includes(r) ? (en ? APPELS_EN[r] : APPELS[r]) : (en ? TEXTE_VERROU_EN : TEXTE_VERROU);
  const exempleOk = async (page, r) => AVEC_EXEMPLE.includes(r) === !!(await page.$("#vue #ech-" + r + ".echantillon"));
  const TEXTE_FORMATION = "Ta période découverte est terminée : la Speed Formation fait partie de l'accompagnement.";
  let textesFr = "", textesEn = "";
  try {

  /* ---------- A. Prospect tout neuf (jour 1) : questionnaire court, pas encore de Calendly ---------- */
  await bloc("A. prospect jour 1", async () => {
    const db = base({ ilYA: 0, intake: null });
    const { page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/accueil`); await attendre(page, 1800);
    const t = await texte(page, "#acc-vue");
    /* v52 (lot D) : « Découverte », sans « Jour n/7 » (avant : « Découverte · Jour 1/7 ») */
    ok("prospect jour 1 : accueil = écran Découverte (« Découverte » sans « Jour n/7 », « Bonjour Léa »)", !!(await page.$(DC_ZONE + " #dc-voir")) && /^\s*Découverte\s+Bonjour Léa/.test(t) && !/Jour \d/.test(t), t.slice(0, 200));
    const champs = await champsCourt(page);
    /* v52 : 3 questions (avant : 10, #q-sexe … #q-motivation, « Voir mon résultat ») ;
       v60 (lot 1) : 3 cadres à toucher (+ leurs précisions et le message « 2 réponses max »), bouton « Voir ma prochaine
       étape » (avant : « Valider mes réponses »), l'air inactif tant qu'il manque une réponse (aria-disabled="true") */
    const voirInactif = await page.$eval("#dc-voir", e => e.getAttribute("aria-disabled")).catch(() => null);
    ok(`prospect jour 1 : questionnaire court de 3 questions à toucher (#q-probleme, #q-obstacle, #q-projection), sans âge, et bouton « ${BOUTON_COURT} » (inactif, rien de répondu)`, courtOk(champs) && (await texte(page, "#dc-voir")) === BOUTON_COURT && voirInactif === "true", JSON.stringify(champs) + " | aria-disabled " + voirInactif);
    const voir = !!(await page.$(DC_ZONE + " #dc-voir")), nCal = await calendlyVue(page);
    ok("prospect jour 1 : questionnaire court affiché (#dc-voir) et aucun bouton Calendly tant qu'il n'est pas rempli", voir && nCal === 0, (voir ? "" : "questionnaire court absent ; ") + nCal + " lien(s) Calendly");
    textesFr += "\n" + await toutLeTexte(page);
    await aller(page, "#/decouverte", 1500);
    ok("prospect jour 1 : #/decouverte = le même écran (questionnaire, « Accueil » marqué dans la navigation)", !!(await page.$(DC_ZONE + " #dc-voir")) && !(await page.$("#vue .verrou")) && (await page.$eval('#nav a[aria-current="page"]', a => a.dataset.id).catch(() => "")) === "accueil");
    ok("prospect jour 1 : rien n'est écrit à l'affichage (aucune requête non-GET vers /rest/v1/*)", db.requetes.length === 0, db.requetes.join(" ; "));
    await page.screenshot({ path: path.join(OUT, "prospect-jour1-questionnaire.png"), fullPage: true });
  });

  /* ---------- A2. Questionnaire pas rempli après le jour 1 : toujours le questionnaire, jamais de Calendly ---------- */
  await bloc("A2. questionnaire pas rempli après le jour 1", async () => {
    {
      /* ancien prospect du Challenge au jour 5 : son questionnaire du challenge n'a pas de court_le */
      const db = base({ ilYA: 4, intake: INTAKE_CHALLENGE, challenge: challengeAncien(jourLocal(4)) });
      const { c, page } = await contexte(b, lea, db);
      await page.goto(`http://localhost:${PORT}/#/accueil`); await attendre(page, 2000);
      const t = await texte(page, "#acc-vue");
      const champs = await champsCourt(page);
      const age = await page.$("#q-age"), nCal = await calendlyVue(page);
      /* v52 : les 3 nouvelles questions (avant : les 10, pré-remplies par ses réponses, âge 29) ; ses anciennes réponses
         restent en base, lisibles dans son Profil et la fiche du coach (verif56) ;
         v60 (lot 1) : les 3 cadres à toucher et leurs éléments (avant : exactement 3 champs [id^='q-']) */
      ok("ancien prospect du Challenge au jour 5 (questionnaire sans court_le) : « Découverte » (v52 : sans « Jour n/7 »), les 3 questions du questionnaire court (plus d'âge), pas de résultat, aucun bouton Calendly", /^\s*Découverte\s+Bonjour/.test(t) && !/Jour \d/.test(t) && courtOk(champs) && !!(await page.$(DC_ZONE + " #dc-voir")) && !age && !(await page.$("#dc-resultat, #dc-bilan")) && nCal === 0, t.slice(0, 160) + " | " + JSON.stringify(champs) + " | " + nCal + " lien(s) Calendly");
      await aller(page, "#/challenge", 1500);
      const h = await page.evaluate(() => location.hash), nCal2 = await calendlyVue(page);
      ok("ancien prospect du Challenge au jour 5 : son ancienne adresse #/challenge mène au questionnaire (#/decouverte), sans bouton Calendly ; rien n'est écrit", h === "#/decouverte" && !!(await page.$(DC_ZONE + " #dc-voir")) && nCal2 === 0 && db.requetes.length === 0, h + " | " + nCal2 + " lien(s) Calendly | " + db.requetes.join(" ; "));
      await c.close();
    }
    {
      /* compte jamais rempli, découverte terminée (jour 21) */
      const db = base({ ilYA: 20, intake: null });
      const { page } = await contexte(b, lea, db);
      await page.goto(`http://localhost:${PORT}/#/accueil`); await attendre(page, 2000);
      const t = await texte(page, "#acc-vue"), nCal = await calendlyVue(page);
      ok("prospect jour 21 sans questionnaire : « Découverte » (v52 : jamais « terminée »), questionnaire court, toujours aucun bouton Calendly sur l'écran Découverte", /^\s*Découverte\s+Bonjour/.test(t) && !/terminée/.test(t) && !!(await page.$(DC_ZONE + " #dc-voir")) && nCal === 0, t.slice(0, 160) + " | " + nCal + " lien(s) Calendly");
    }
  });

  /* ---------- B. Prospect au jour 4, questionnaire rempli : accueil, navigation, pages verrouillées ---------- */
  await bloc("B. prospect jour 4", async () => {
    const db = base({ ilYA: 3 });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/accueil`); await attendre(page, 2200);
    const acc = await texte(page, "#acc-vue");
    const blocs = await page.$$eval(DC_ZONE + " section[id^='dc-']", l => l.map(s => s.id)).catch(() => []);
    /* v52 : l'accueil après la page bilan = Speed Formation + accompagnement (avant : résultat, calcul, séance, recettes en plus) ;
       lot D : l'action mise en avant en tête (dc-etape, « Calcule tes calories »), plus de « Jour n/7 » */
    ok("prospect jour 4 : accueil Découverte « Découverte » (sans « Jour n/7 »), « Bonjour Léa », son étape, Speed Formation et accompagnement (plus d'ancien écran « résultat »)", /^\s*Découverte\s+Bonjour Léa/.test(acc) && !/Jour \d/.test(acc) && JSON.stringify(blocs) === '["dc-etape","dc-formation","dc-accomp"]', acc.slice(0, 160) + " | " + JSON.stringify(blocs));
    const cals = await page.$$eval(DC_ZONE + " [data-dc-cal]", l => l.map(a => ({ src: a.dataset.dcCal, href: a.href, t: a.textContent.trim(), cible: a.target })));
    /* v61 (lot 2, brief V2 E et F) : « Récupérer mon plan d'action » (avant : « Réserver mon bilan »), codes accueil_haut /
       accueil_accompagnement (avant : decouverte / decouverte-accompagnement) ; sous le bouton du haut, la ligne « 15 min avec
       Lucas · offert » ; sous celui de la carte, sa note « 15 min avec Lucas pour faire le point… » ; plus aucun « Réserver mon
       bilan » ni « 30 minutes » sur l'accueil */
    const sousAcc = await page.evaluate(z => ({ haut: (document.querySelector(z + " header.masthead .actions + p.dc-cta-sous.dc-haut-sous") || {}).textContent || null,
      note: (document.querySelector("#dc-accomp .actions + p.note") || {}).textContent || null }), DC_ZONE).catch(() => ({}));
    ok("prospect jour 4 : « Récupérer mon plan d'action » sur l'accueil (en-tête + carte « Ce que l'accompagnement ajoute »), Calendly pré-rempli, utm_content=accueil_haut / accueil_accompagnement, « 15 min avec Lucas · offert » sous le bouton du haut et « 15 min avec Lucas pour faire le point sur ton objectif. Offert. » sous celui de la carte ; plus de « Réserver mon bilan » ni de « 30 minutes »",
      cals.length === 2 && cals.every(x => x.href === lienPre(x.src) && x.t === CTA.fr && x.cible === "_blank") && cals.map(x => x.src).join() === "accueil_haut,accueil_accompagnement"
      && plat(sousAcc.haut).trim() === SOUS.fr && plat(sousAcc.note).trim() === NOTE_ACCOMP.fr && !/Réserver mon bilan|30 minutes/.test(plat(acc)), JSON.stringify(cals) + " | " + JSON.stringify(sousAcc));
    ok("prospect jour 4 : bloc Speed Formation ouvert pendant la découverte (lien « Ouvrir la Speed Formation »)", !!(await page.$('#dc-formation a[href="#/formation"]')) && !(await texte(page, "#dc-formation")).includes(TEXTE_FORMATION));
    await page.screenshot({ path: path.join(OUT, "prospect-accueil.png"), fullPage: true });
    textesFr += "\n" + await toutLeTexte(page);

    /* navigation */
    const ids = await navIds(page), cad = await cadenasNav(page);
    /* v52 (lot D) : + journal (vitrine), mensurations et calculateur (ouverts) */
    ok("prospect jour 4 : navigation = accueil, programme, journal, nutrition, mensurations, calculateur, suivi, formation, profil (plus d'onglet Challenge ni Découverte en double)", JSON.stringify(ids) === '["accueil","programme","journal","nutrition","mensurations","calculateur","suivi","formation","profil"]', JSON.stringify(ids));
    ok("prospect jour 4 : cadenas sur la vitrine (programme, journal, nutrition, suivi) seulement — ni sur accueil, progression, calculateur, formation, profil", JSON.stringify(cad) === '["programme","journal","nutrition","suivi"]', JSON.stringify(cad));
    ok("prospect jour 4 : chaque onglet verrouillé est annoncé « (verrouillé) » aux lecteurs d'écran", cad.length > 0 && await page.$$eval("#nav a", l => l.filter(a => a.querySelector(".nav-cadenas")).every(a => (a.querySelector(".sr-only") || {}).textContent === " (verrouillé)")));
    const barre = await barreIds(page);
    /* v52 (lot D) : accueil, calculateur, progression, Speed Formation (avant : accueil, formation, profil, programme verrouillé) */
    ok("prospect jour 4 : barre du bas = accueil, calculateur, progression, Speed Formation (aucun onglet verrouillé) ; le reste derrière « Plus »", JSON.stringify(barre) === '["accueil","calculateur","mensurations","formation"]' && !!(await page.$("#barre-bas [data-plus]")) && (await page.$$eval("#barre-bas a.verrouille", l => l.map(a => a.dataset.id))).join() === "", JSON.stringify(barre));

    /* pages verrouillées : on part d'une page ouverte, puis chaque adresse */
    await aller(page, "#/profil", 1500);
    for (const r of VERROUILLES) {
      page.donnees.length = 0;
      await aller(page, "#/" + r, 1300);
      const v = await verrou(page);
      /* v61 (lot 2) : le texte propre à la page (typographie française : comparé sans les espaces insécables), « Récupérer
         mon plan d'action » (utm_content=verrou_<page>) et la ligne « 15 min avec Lucas · offert » (avant : l'appel commun,
         « Réserver mon bilan », verrou-<page>) */
      ok(`prospect : #/${r} verrouillé — ${AVEC_EXEMPLE.includes(r) ? "l'exemple, puis " : ""}cadenas, « ${texteVerrou(r)} », « ${CTA.fr} » vers Calendly (utm_content=verrou_${r}, prénom et email pré-remplis), « ${SOUS.fr} » dessous`, !!v && v.cadenas && plat(v.texte) === texteVerrou(r) && await exempleOk(page, r) && lienOk(v, "verrou_" + r), JSON.stringify(v));
      const html = await page.evaluate(() => document.body.innerHTML);
      ok(`prospect : #/${r} verrouillé — aucune requête vers ses données (ni lecture ni écriture), rien de ses données affiché`, page.donnees.length === 0 && !html.includes(TEMOIN), page.donnees.join(" ; ") + (html.includes(TEMOIN) ? " | donnée témoin affichée" : ""));
      textesFr += "\n" + await toutLeTexte(page);
    }
    /* le relevé du cache marche : prefs (langue, lue au démarrage de tout compte) doit y figurer */
    const cles = await clesChargees(page);
    ok("prospect : après toutes les pages verrouillées, aucune de ses données d'accompagnement n'est chargée dans l'appli (cache lisible : prefs y est)", Array.isArray(cles) && cles.includes("prefs") && !cles.some(k => ["programme", "repas", "mens", "complements", "checkins", "journal", "repas_suivi", "objectifs_faits", "feedbacks", "calc"].includes(k)), JSON.stringify(cles));
    ok("prospect : compléments et bilan cachés de la navigation (verrouillés à leur adresse)", !(await navIds(page)).some(x => ["complements", "bilan"].includes(x)));

    /* formation : ouverte pendant les 7 jours */
    page.donnees.length = 0;
    await aller(page, "#/formation", 1600);
    /* témoin du relevé des requêtes : une page ouverte, elle, lit bien ses données.
       v60 (lot 1, brief V2 I) : pour le prospect, la carte « Commence ici » (#fo-depart, dessinée après la lecture groupée de
       son calcul et de sa pesée) est là : le contrôle « aucune écriture pendant toute la visite » ci-dessous couvre donc
       aussi ce nouveau chemin (une simple visite n'écrit rien) */
    ok("prospect jour 4 : #/formation ouvert (la Speed Formation s'affiche, pas de cadenas, sa formation est lue, v60 : carte « Commence ici » dessinée)", !(await page.$("#vue .verrou")) && (await texte(page, "#vue h1")).includes("SpeedFormation") && page.donnees.some(u => /^GET .*outil=(eq\.formation|in\.\([^)]*formation)/.test(u)) && !!(await page.$("#fo-vue #fo-depart")), (await texte(page, "#vue")).slice(0, 160) + " | " + page.donnees.join(" ; "));
    textesFr += "\n" + await toutLeTexte(page);

    /* anciennes adresses du challenge */
    const redirs = [];
    for (const h of ["#/challenge", "#/challenge/3", "#/challenge-libre", "#/challenge-rythme"]) {
      await aller(page, h, 1300);
      redirs.push(h + " → " + await page.evaluate(() => location.hash) + (await page.$(DC_ZONE + " #dc-accomp") ? " (Découverte)" : " (?)") + (await page.$("#vue .verrou") ? " VERROU" : ""));
    }
    /* v52 : son accueil (avant : son résultat, #dc-resultat) */
    ok("prospect : #/challenge, #/challenge/3, #/challenge-libre, #/challenge-rythme mènent à #/decouverte (son accueil)", redirs.every(x => / → #\/decouverte \(Découverte\)$/.test(x)), redirs.join(" ; "));

    /* profil */
    await aller(page, "#/profil", 1400);
    const tp = await texte(page, "#vue");
    /* v52 : ses réponses et « Modifier mes réponses » (#/decouverte/reponses) ; avant : « Voir mon résultat » (#/decouverte) */
    ok("prospect : #/profil ouvert et allégé — « Tes réponses au questionnaire sont enregistrées… », ses réponses, lien « Modifier mes réponses » (#/decouverte/reponses), bloc « Mon compte », pas de questionnaire complet", !(await page.$("#vue .verrou")) && !(await page.$("#p-save")) && tp.includes("Tes réponses au questionnaire sont enregistrées") && tp.includes("Perdre du gras") && tp.includes("Mon compte") && (await page.$eval('#vue a[href="#/decouverte/reponses"]', a => a.textContent.trim()).catch(() => "")) === "Modifier mes réponses", tp.slice(0, 200));
    textesFr += "\n" + await toutLeTexte(page);
    /* le volet des conditions (relisible depuis le profil) : il doit s'ouvrir, sinon son texte échapperait au contrôle des prix */
    const okCond = await cliquer(page, "#mc-conditions"); await attendre(page, 500);
    const tc = await toutLeTexte(page);
    /* v61 (lot 2, décision 4) : le texte court dit « dont tes clics sur « Récupérer mon plan d'action » » (avant : « Réserver
       mon bilan ») */
    ok("prospect : le volet « Conditions d'utilisation et confidentialité » s'ouvre depuis le profil (texte capturé pour le contrôle des prix) ; v61 : « dont tes clics sur « Récupérer mon plan d'action » », plus de « Réserver mon bilan »", okCond && tc.includes(HEBERGEMENT.fr) && plat(tc).includes("dont tes clics sur « " + CTA.fr + " »") && !plat(tc).includes("Réserver mon bilan"), okCond ? (tc.includes(HEBERGEMENT.fr) ? "clics : " + (/dont tes clics sur[^.]*/.exec(plat(tc)) || ["introuvable"])[0] : "« " + HEBERGEMENT.fr + " » introuvable") : "bouton #mc-conditions absent");
    textesFr += "\n" + tc;
    await page.keyboard.press("Escape"); await attendre(page, 300);
    ok("prospect : aucune écriture pendant toute la visite (accueil, navigation, pages verrouillées, formation, profil, conditions) — aucune requête non-GET vers /rest/v1/*", db.requetes.length === 0 && db.ecritures.length === 0, db.requetes.join(" ; "));

    /* un clic « Récupérer mon plan d'action » (v61 ; avant : « Réserver mon bilan ») sur une page verrouillée : Calendly
       s'ouvre, le clic est noté pour le coach avec son code d'origine verrou_nutrition (avant : verrou-nutrition) */
    await aller(page, "#/nutrition", 1300);
    const popUrl = await cliquerVerrou(c, page);
    const manque = popUrl === null ? "bouton « " + CTA.fr + " » absent de #/nutrition | " : "";
    const ec = db.ecritures.filter(e => e.user_id === PROSPECT);
    const der = ec.length ? ec[ec.length - 1] : null;
    const clics = der && der.contenu && der.contenu.cta && Array.isArray(der.contenu.cta.clics) ? der.contenu.cta.clics : [];
    const clic = clics[clics.length - 1] || {};
    ok("prospect : clic « Récupérer mon plan d'action » sur #/nutrition verrouillé — Calendly s'ouvre dans un nouvel onglet avec le lien pré-rempli (utm_content=verrou_nutrition)", popUrl === lienPre("verrou_nutrition") && db.calendly.length === 1 && db.calendly[0] === lienPre("verrou_nutrition"), manque + (popUrl || "aucun onglet") + " | " + db.calendly.join(" ; "));
    ok("prospect : ce clic est noté dans la clé « challenge » (cta.clics : source verrou_nutrition, jour 4, date) et rien d'autre n'est écrit (une seule requête non-GET)", db.requetes.length === 1 && /^POST \/rest\/v1\/donnees/.test(db.requetes[0]) && ec.length === 1 && der.outil === "challenge" && clics.length === 1 && clic.source === "verrou_nutrition" && clic.jour === 4 && /^\d{4}-\d{2}-\d{2}T/.test(clic.date || ""), manque + db.requetes.join(" ; ") + " | " + JSON.stringify(ec.map(e => ({ outil: e.outil, cta: e.contenu && e.contenu.cta }))));
    const suivi = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem("mhx_tracking") || "[]").map(e => e.event); } catch (e) { return []; } });
    ok("prospect : le clic est aussi compté dans le suivi local (call_cta_clicked)", suivi.includes("call_cta_clicked"), manque + JSON.stringify(suivi));
  });

  /* ---------- C, C2, D. v52 (lot D) : fonction supprimée — plus de « Jour n/7 » ni de verrou de la Speed Formation au jour 8
     (par la date, inscription ancienne ou mode test) : ces blocs sont retirés. La Speed Formation ouverte au 30e jour et
     « plus aucun 7 jours » côté prospect sont vérifiés par verif56 (bloc N). ---------- */

  /* ---------- E. Téléphone et tablette : cadenas dans la barre du bas, volet « Plus », pas de débordement ---------- */
  await bloc("E. téléphone et tablette", async () => {
    {
      const db = base({ ilYA: 3 });
      const { c, page } = await contexte(b, lea, db, { viewport: { width: 390, height: 844 } });
      await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
      /* v52 : l'accueil (#dc-accomp) remplace l'ancien résultat (#dc-resultat) */
      ok("prospect mobile : accueil Découverte sans défilement horizontal", !!(await page.$(DC_ZONE + " #dc-accomp")) && await page.evaluate(() => document.documentElement.scrollWidth <= 390));
      /* v52 (lot D) : la barre du bas n'a plus d'onglet verrouillé (accueil, calculateur, progression, Speed Formation) ;
         la vitrine verrouillée est dans « Plus », avec ses cadenas */
      const okPlus = await cliquer(page, "#barre-bas [data-plus]"); await attendre(page, 600);
      const plus = await page.$$eval(".volet .menu-plus a", l => l.map(a => a.dataset.id + (a.querySelector(".nav-cadenas") ? "🔒" : ""))).catch(() => []);
      ok("prospect mobile : « Plus » = programme, journal, nutrition, suivi (verrouillés, avec cadenas) et profil ; ni compléments, ni bilan, ni challenge", okPlus && JSON.stringify(plus) === '["programme🔒","journal🔒","nutrition🔒","suivi🔒","profil"]', (okPlus ? "" : "bouton « Plus » absent | ") + JSON.stringify(plus));
      textesFr += "\n" + await toutLeTexte(page);
      await page.keyboard.press("Escape"); await attendre(page, 300);
      await aller(page, "#/programme", 1300);
      ok("prospect mobile : page verrouillée sans défilement horizontal", !!(await page.$("#vue .verrou")) && await page.evaluate(() => document.documentElement.scrollWidth <= 390));
      await page.screenshot({ path: path.join(OUT, "prospect-programme-mobile.png"), fullPage: true });
      await c.close();
    }
    /* v52 (lot D) : fonction supprimée — « jour 21 : la formation verrouillée passe dans « Plus » » (plus de verrou au jour 8) */
    for (const largeur of [800, 1024]) {
      /* tablette / petite fenetre : la barre du haut (avec « (verrouillé) » pour les lecteurs d'ecran) ne deborde pas */
      const db = base({ ilYA: 20 });
      const { c, page } = await contexte(b, lea, db, { viewport: { width: largeur, height: 800 } });
      await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1800);
      const d = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
      ok(`prospect ${largeur} px : aucun défilement horizontal (barre du haut avec 4 cadenas)`, d.s <= d.c && (await cadenasNav(page)).length === 4, JSON.stringify(d));
      await c.close();
    }
  });

  /* ---------- F. Anglais : toutes les pages verrouillées, accueil, profil et ses conditions, formation au jour 8 ---------- */
  await bloc("F. anglais", async () => {
    const db = base({ ilYA: 3, prefs: { langue: "en" } });
    const { page } = await contexte(b, lea, db, { langue: "en" });
    await page.goto(`http://localhost:${PORT}/#/programme`); await attendre(page, 2000);
    const v = await verrou(page);
    /* v61 (lot 2) : le texte anglais propre à la page, « Get my action plan » (utm_content=verrou_programme) et « 15 min with
       Lucas · free » (avant : l'appel commun, « Book my assessment », verrou-programme) */
    ok(`prospect en anglais : #/programme (l'exemple, puis) « ${APPELS_EN.programme} », « ${CTA.en} » (utm_content=verrou_programme) et « ${SOUS.en} »`, !!v && v.texte === APPELS_EN.programme && await exempleOk(page, "programme") && lienOk(v, "verrou_programme", "en"), JSON.stringify(v));
    textesEn += "\n" + await toutLeTexte(page);
    await aller(page, "#/accueil", 2000);
    const acc = await texte(page, "#acc-vue");
    const cals = await page.$$eval(DC_ZONE + " [data-dc-cal]", l => l.map(a => a.textContent.trim()));
    /* v61 (lot 2) : « Get my action plan » (avant : « Book my assessment »), « 15 min with Lucas · free » sous le bouton du haut,
       « 15 min with Lucas to go over your goal. Free. » sous celui de la carte ; plus de « Book my assessment » ni de « 30-minute » */
    const sousAcc = await page.evaluate(z => ({ haut: (document.querySelector(z + " header.masthead .actions + p.dc-cta-sous.dc-haut-sous") || {}).textContent || null,
      note: (document.querySelector("#dc-accomp .actions + p.note") || {}).textContent || null }), DC_ZONE).catch(() => ({}));
    ok("prospect en anglais : accueil « Discovery » (v52 : sans « Day n/7 »), boutons « Get my action plan », « 15 min with Lucas · free » sous celui du haut, « 15 min with Lucas to go over your goal. Free. » sous celui de la carte ; plus de « Book my assessment » ni de « 30-minute »", /^\s*Discovery\s+Hello/.test(acc) && !/Day \d/.test(acc) && cals.length === 2 && cals.every(x => x === CTA.en)
      && (sousAcc.haut || "").trim() === SOUS.en && (sousAcc.note || "").trim() === NOTE_ACCOMP.en && !/Book my assessment|30-minute|30 minutes/.test(acc), acc.slice(0, 160) + " | " + JSON.stringify(cals) + " | " + JSON.stringify(sousAcc));
    textesEn += "\n" + await toutLeTexte(page);
    /* les 5 autres pages verrouillées, cachées ou non (leurs avantages traduits passent au contrôle des prix) */
    const fautes = [];
    for (const r of VERROUILLES.filter(x => x !== "programme")) {
      await aller(page, "#/" + r, 1300);
      const vr = await verrou(page);
      if (!(vr && vr.cadenas && vr.texte === texteVerrou(r, true) && await exempleOk(page, r) && lienOk(vr, "verrou_" + r, "en"))) fautes.push(r + " " + JSON.stringify(vr));
      textesEn += "\n" + await toutLeTexte(page);
    }
    /* v52 : lots D + E — journal (lot D) remplace mensurations (ouverte) ; nutrition, journal et suivi ont leur exemple (lot E) */
    /* v61 (lot 2) : chaque page de la vitrine a son texte anglais ; « Get my action plan », utm_content=verrou_<id>, « 15 min with
       Lucas · free » (avant : l'appel commun, « Book my assessment », verrou-<id>) */
    ok(`prospect en anglais : #/nutrition, #/journal, #/suivi, #/complements, #/bilan verrouillés en anglais (nutrition, journal et suivi : l'exemple puis le texte anglais propre à la page ; les autres : « ${TEXTE_VERROU_EN} » ; « ${CTA.en} », utm_content=verrou_<id>, « ${SOUS.en} »)`, fautes.length === 0, fautes.join(" ; "));
    await aller(page, "#/profil", 1300);
    textesEn += "\n" + await toutLeTexte(page);
    const okCond = await cliquer(page, "#mc-conditions"); await attendre(page, 500);
    const tc = await toutLeTexte(page);
    /* v61 (lot 2, décision 4) : « including your clicks on “Get my action plan” » (avant : “Book my assessment”) */
    ok("prospect en anglais : le volet des conditions s'ouvre depuis le profil, en anglais (texte capturé pour le contrôle des prix) ; v61 : « including your clicks on “Get my action plan” », plus de « Book my assessment »", okCond && tc.includes(HEBERGEMENT.en) && tc.includes("including your clicks on “" + CTA.en + "”") && !tc.includes("Book my assessment"), okCond ? (tc.includes(HEBERGEMENT.en) ? "clics : " + (/including your clicks on[^.]*/.exec(tc) || ["introuvable"])[0] : "« " + HEBERGEMENT.en + " » introuvable") : "bouton #mc-conditions absent");
    textesEn += "\n" + tc;
    await page.keyboard.press("Escape"); await attendre(page, 300);
    /* v52 (lot D) : fonction supprimée — « jour 8 : #/formation verrouillée en anglais » (plus de verrou au jour 8) ; la
       Speed Formation ouverte passe quand même au contrôle des prix */
    await aller(page, "#/formation", 1600);
    textesEn += "\n" + await toutLeTexte(page);
  });

  /* ---------- G. Écran d'inscription (inscription libre allumée pour le test) et ses conditions ---------- */
  for (const langue of ["", "en"]) {
    await bloc("G. inscription" + (langue ? " (anglais)" : ""), async () => {
      inscriptionLibre = true; legaux = LEGAUX_TEST;   // v64 : liens des PDF de test (CONFIG.textes_legaux)
      try {
        const db = base();
        const { page } = await contexte(b, null, db, { langue });
        await page.goto(`http://localhost:${PORT}/#/inscription`); await attendre(page, 1500);
        const t = await toutLeTexte(page);
        const titre = (await texte(page, ".carte-co h2")).trim(), bouton = (await texte(page, "#c-go")).trim();
        /* v52 (lot B) : « espace gratuit » (plus d'accès découverte de 7 jours) ; + la case newsletter (facultative).
           v64 (brief V2 A3, A6) : bouton « Créer mon espace gratuit » / « Create my free account » ; plus de case santé */
        const [tA, bA] = langue ? ["Create your free space", "Create my free account"] : ["Crée ton espace gratuit", "Créer mon espace gratuit"];
        const cases = { cgu: !!(await page.$("#c-cgu")), sante: !!(await page.$("#c-sante")), newsletter: !!(await page.$("#c-newsletter")) };
        ok(`inscription${langue ? " (anglais)" : ""} : écran « ${tA} », bouton « ${bA} », cases des conditions (#c-cgu) et de la newsletter (#c-newsletter) ; plus de case des données de santé (#c-sante absente, v64)`, titre === tA && bouton === bA && cases.cgu && !cases.sante && cases.newsletter, JSON.stringify({ titre, bouton, cases }));
        /* v64 (brief V2 A2) : le lien des conditions n'ouvre plus le volet (avant : clic sur #c-cgu-lien, volet « Hébergement… »
           capturé) : 2 liens distincts dans la case, vers les 2 PDF de CONFIG.textes_legaux, dans un nouvel onglet ; jamais
           cliqués (réseau). Le volet et son texte (contrôle des prix) restent vérifiés depuis le profil (blocs D et F). */
        const liens = await page.evaluate(() => ["c-cgu-lien", "c-politique-lien"].map(id => { const a = document.getElementById(id);
          return a ? { tag: a.tagName, href: a.getAttribute("href"), cible: a.getAttribute("target"), rel: a.getAttribute("rel"), t: a.textContent.replace(/\s+/g, " ").trim(), dansCase: !!a.closest("label.co-cgu") } : null; }));
        const [L1, L2] = langue ? ["Terms of Use", "Privacy Policy"] : ["CGU", "politique de confidentialité"];
        const okLiens = liens.every(l => l && l.tag === "A" && l.cible === "_blank" && /(^|\s)noopener(\s|$)/.test(l.rel || "") && l.dansCase)
          && liens[0].href === LEGAUX_TEST.cgu_pdf && liens[1].href === LEGAUX_TEST.confidentialite_pdf && liens[0].href !== liens[1].href && liens[0].t === L1 && liens[1].t === L2;
        ok(`inscription${langue ? " (anglais)" : ""} : écran sans aucun prix, tarif ni abonnement ; « ${L1} » et « ${L2} » : 2 liens distincts vers les PDF (href = CONFIG.textes_legaux.cgu_pdf / confidentialite_pdf, target=_blank, rel=noopener ; v64 : plus de volet ici, il reste vérifié depuis le profil)`, okLiens && !prixTrouve(t), prixTrouve(t) || JSON.stringify(liens));
        if (langue) textesEn += "\n" + t; else textesFr += "\n" + t;
      } finally { inscriptionLibre = false; legaux = null; }
    });
  }

  /* ---------- H. Aucun prix nulle part ---------- */
  await bloc("H. aucun prix", async () => {
    ok("prospect : aucun prix sur aucune des pages visitées en français (€, prix, tarif, abonnement, /mois)", textesFr.length > 5000 && !prixTrouve(textesFr), prixTrouve(textesFr) || "textes vides");
    ok("prospect : aucun prix sur aucune des pages visitées en anglais ($, £, €, price, subscription, /month)", textesEn.length > 2000 && !prixTrouve(textesEn), prixTrouve(textesEn) || "textes vides");
    /* les textes eux-mêmes, même ceux qu'aucun écran n'a montrés : la Découverte (FR + EN), les avantages
       (FR + leur traduction), et tout le dictionnaire anglais (clés et valeurs), l'appli étant en anglais */
    const { page } = await contexte(b, lea, base({ prefs: { langue: "en" } }), { langue: "en" });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2000);
    const r = await page.evaluate(() => {
      const l = []; const tour = v => { if (typeof v === "string") l.push(v); else if (v && typeof v === "object") Object.values(v).forEach(tour); };
      const out = { decouverte: null };
      if (typeof DECOUVERTE !== "undefined") { tour(DECOUVERTE); out.decouverte = l.splice(0).join("\n"); }
      const av = typeof AVANTAGES !== "undefined" ? AVANTAGES : null, dico = typeof I18N !== "undefined" && I18N.en ? I18N.en : null;
      if (av) Object.values(av).forEach(s => l.push(s, trad(s)));
      if (dico) Object.keys(dico).forEach(k => { l.push(k); tour(dico[k]); });
      out.reste = l.join("\n");
      out.langue = typeof I18N !== "undefined" ? I18N.langue : "";
      out.nAv = av ? Object.keys(av).length : 0;
      out.avEn = av ? Object.values(av).filter(s => trad(s) !== s).length : 0;
      out.nDico = dico ? Object.keys(dico).length : 0;
      return out;
    });
    ok("textes de la Découverte (DECOUVERTE, français + anglais) : aucun prix, tarif ni abonnement", !!r.decouverte && !prixTrouve(r.decouverte), r.decouverte ? prixTrouve(r.decouverte) : "DECOUVERTE absent");
    ok("avantages de l'accompagnement (français + traduction anglaise de chacun) et tout le dictionnaire anglais I18N.en (clés et valeurs) : aucun prix, tarif ni abonnement", r.langue === "en" && r.nAv >= 6 && r.avEn === r.nAv && r.nDico > 500 && !prixTrouve(r.reste), prixTrouve(r.reste) || JSON.stringify({ langue: r.langue, avantages: r.nAv, traduits: r.avEn, dictionnaire: r.nDico }));
  });

  /* ---------- I. Client, coach, base sans statut : rien ne change ---------- */
  await bloc("I. client", async () => {
    const { page } = await contexte(b, thomas, base());
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1800);
    ok("client : aucun cadenas dans la navigation", (await page.$$("#nav .nav-cadenas")).length === 0);
    const barreC = await barreIds(page);
    ok("client : barre du bas inchangée (ses onglets principaux)", JSON.stringify(barreC) === '["accueil","programme","nutrition","mensurations"]', JSON.stringify(barreC));
    ok("client : son accueil habituel (pas d'écran Découverte)", !!(await page.$("#acc-vue")) && !(await page.$(DC_ECRAN)));
    await aller(page, "#/programme", 1500);
    ok("client : son programme s'affiche (pas de verrou)", !(await page.$("#vue .verrou")) && (await texte(page, "#vue")).includes("Séance"));
    await aller(page, "#/formation", 1500);
    ok("client : Speed Formation ouverte (pas de verrou)", !(await page.$("#vue .verrou")) && (await texte(page, "#vue h1")).includes("SpeedFormation"));
    await aller(page, "#/decouverte", 1500);
    ok("client : #/decouverte ne lui ouvre rien de nouveau (retour à son accueil, pas d'écran Découverte)", !(await page.$(DC_ECRAN)) && !(await page.$("#vue .verrou")) && !!(await page.$("#acc-vue")));
  });
  await bloc("I. coach sur la fiche d'un prospect", async () => {
    /* le coach consulte la fiche de Léa, prospecte dont la découverte est terminée */
    const { page } = await contexte(b, coach, base({ ilYA: 20 }));
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2000);
    /* v71 (D) : « Suivi de mes clients » ne liste plus les prospects : Léa n'a plus de bouton [data-ouvrir] (avant : clic
       dessus). On attend le tableau (le bouton de Thomas, client), on relève l'absence de Léa et la ligne #clients-prospects
       (« Les prospects sont dans Prospects → (1 compte gratuit). », lien #/prospects), puis la fiche s'ouvre par
       Clients.ouvrir (ce que faisait le clic), attendue par son bandeau. Rien ne lève d'exception : un ✗ au lieu d'un arrêt */
    const tableauPret = await page.waitForSelector(`#tb-clients [data-ouvrir="${F.IDS.c1}"]`, { timeout: 6000 }).then(() => true, () => false);
    const leaListee = !!(await page.$(`#tb-clients [data-ouvrir="${PROSPECT}"]`));
    const renvoi = await page.$eval("#clients-prospects", e => { const a = e.querySelector("a.link-a"); return { t: e.textContent.replace(/\s+/g, " ").trim(), cache: e.hidden, lien: a ? a.getAttribute("href") : null }; }).catch(() => null);
    const renvoiOk = !!renvoi && !renvoi.cache && plat(renvoi.t) === "Les prospects sont dans Prospects → (1 compte gratuit)." && renvoi.lien === "#/prospects";
    const ouvert = await page.evaluate(([id, n]) => { Clients.ouvrir(id, n, "accueil"); return Store.idConsulte === id; }, [PROSPECT, "Léa Démo"]).catch(() => false);
    const bandeau = await page.waitForSelector("#vue .bandeau", { timeout: 6000 }).then(() => true, () => false); await attendre(page, 1500);
    const okFiche = tableauPret && !leaListee && renvoiOk && ouvert && bandeau;
    const detailFiche = okFiche ? "" : "fiche de Léa : " + JSON.stringify({ tableauPret, leaListee, renvoi, ouvert, bandeau }) + " | ";
    await aller(page, "#/programme", 1500);
    const vu = await valeursVue(page);
    ok("coach dans la fiche d'un prospect (v71 : Léa n'est plus dans #tb-clients, « Les prospects sont dans Prospects → (1 compte gratuit). » avec a[href=\"#/prospects\"], fiche ouverte par Clients.ouvrir, bandeau affiché) : rien n'est verrouillé, il voit son programme", okFiche && !(await page.$("#vue .verrou")) && (await page.$$("#nav .nav-cadenas")).length === 0 && vu.includes(TEMOIN), detailFiche + vu.slice(0, 300));
    await aller(page, "#/formation", 1500);
    /* ouverte ET affichée : ni cadenas, ni page en erreur, ni « Chargement… » ; la progression est celle de Léa (10 étapes cochées) */
    const fo = await page.evaluate(() => { const v = document.querySelector("#vue"); return { verrou: !!document.querySelector("#vue .verrou"), illisible: !!document.getElementById("page-illisible"), chargement: !!v && /Chargement…/.test(v.innerText), h1: ((document.querySelector("#vue h1") || {}).textContent || "").replace(/\s+/g, ""), progression: ((document.querySelector("#vue .prog-compteur .t-sub") || {}).textContent || "").trim(), modules: document.querySelectorAll("#vue .fo-mod").length }; });
    ok("coach dans la fiche d'un prospect au jour 21 : Speed Formation ouverte et affichée (titre, modules, progression de Léa « 10 / … étapes ») — le verrou du jour 8 ne vaut que pour le prospect", okFiche && !fo.verrou && !fo.illisible && !fo.chargement && fo.h1.includes("SpeedFormation") && fo.modules > 0 && /^10 \//.test(fo.progression), JSON.stringify(fo));
    /* v61 (lot 2) : le nouveau code (verrou_programme) comme l'ancien (verrou-programme) : la base seule (nouvelle adresse) */
    const lien = await page.evaluate(() => { try { return [lienCalendly("verrou_programme"), lienCalendly("verrou-programme")]; } catch (e) { return ["ERREUR " + e.message]; } });
    ok("coach dans la fiche d'un prospect : lien Calendly brut (ni source, ni prénom, ni email ; v61 : l'adresse de l'événement de 15 min, nouveau et ancien code)", okFiche && lien.length === 2 && lien.every(x => x === CAL), JSON.stringify(lien));
  });
  await bloc("I. base sans colonne statut", async () => {
    const db = base({ sansStatut: true, intake: Object.assign(intakeCourt(3), { nom: "Léa Démo", complet: true }) });
    const { page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/programme`); await attendre(page, 1800);
    ok("base sans colonne statut : personne n'est prospect, rien n'est verrouillé (Léa voit son programme)", !(await page.$("#vue .verrou")) && (await page.$$("#nav .nav-cadenas")).length === 0 && (await texte(page, "#vue")).includes(TEMOIN));
  });

  } catch (e) {
    ok("suite interrompue par une exception", false, String((e && e.message) || e).split("\n")[0].slice(0, 240));
  } finally {
    while (ouverts.length) await ouverts.pop().close().catch(() => {});
    await b.close().catch(() => {}); server.close(); console.log(res.join("\n"));
  }
})();
