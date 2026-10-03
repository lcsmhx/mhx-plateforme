/* v50 (Découverte) — lien Calendly central, confidentialité, navigation du prospect allégée.
   Contrat actuel (funnel « Découverte », qui remplace le Challenge 7 jours) :
   - lienCalendly(source) : le même lien partout. Pour le prospect connecté : paramètres utm_source=app,
     utm_medium=bouton, utm_content=<source> (v61 : accueil_haut, reponses_haut, accueil_accompagnement, verrou_<outil> ;
     avant : utm_source=app-mhx, utm_medium=app, decouverte, decouverte-accompagnement, verrou-<outil>), puis name,
     first_name et email pré-remplis (CONFIG.marque.calendly_prerempli, allumé) ; paramètres placés avant un
     éventuel « # » ; caractère mal formé → adresse intacte ; source hors format → pas d'utm_content ; jamais
     pour le coach dans une fiche ni pour un client (adresse brute).
   - Confidentialité : paragraphe « Prise de rendez-vous » de DECOUVERTE.confidentialite (FR et EN, même place :
     Calendly, pour le compte du coach, États-Unis, pré-remplissage, écran d'origine), relisible depuis le Profil
     du prospect (v64 : plus depuis l'inscription, dont la case ouvre les PDF des CGU et de la politique).
   - v52 (lot D) : onglets ouverts accueil, Ma progression, calculateur, Speed Formation (sans limite), profil ; vitrine
     programme, journal, nutrition, suivi ; barre du bas accueil, calculateur, progression, Speed Formation ; les
     vérifications du jour 8 (formation verrouillée) sont retirées (fonction supprimée).
   - Navigation du prospect (avant la v52) : onglets ouverts accueil, formation (7 jours), profil ; vitrine verrouillée visible
     (programme, nutrition, suivi ; formation après le jour 7) ; plus d'onglet Challenge (ses adresses mènent à
     #/decouverte) ; mensurations, compléments, bilan cachés mais verrouillés à leur adresse (« Réserver mon
     bilan », aucune donnée lue). Clics des pages verrouillées notés dans challenge.cta.clics avec leur source.
     Barre du bas et menu « Plus » sur téléphone. Naviguer n'écrit rien en base (seul le clic écrit, dans « challenge »).
     Client et coach (fiche) inchangés ; chaque vérification « dans la fiche » s'assure que la fiche est bien ouverte.
   v52 (chantier 1, lot B) : le nom du prospect (profils.nom) est pré-rempli aussi : name = « prénom nom »,
     first_name, last_name ; Léa n'a pas de nom ici (nom ""), donc PRE ne change pas (aucun paramètre vide ajouté) ;
     le paragraphe Calendly des conditions dit « Ton prénom, ton nom et ton email y sont pré-remplis ».
   v61 (lot 2, brief V2 E, F, G, décision 4) : adresse de l'événement de 15 min (…/ton-plan-d-action-offert-15-min-avec-lucas ;
     avant …/30min), utm_source=app, utm_medium=bouton (avant : app-mhx / app), codes d'origine avec « _ » (accueil_haut,
     reponses_haut, accueil_accompagnement, verrou_<page> ; avant : decouverte, decouverte-accompagnement, verrou-<page>),
     acceptés par lienCalendly (/^[a-z0-9_-]{1,40}$/) ; clics notés avec ces codes (les anciens clics gardent le leur) ;
     « Récupérer mon plan d'action » / « Get my action plan » (avant : « Réserver mon bilan » / « Book my assessment ») et la
     ligne « 15 min avec Lucas · offert » / « 15 min with Lucas · free » sous les boutons ; un texte propre à chaque page
     verrouillée de la vitrine ; texte court des conditions : « dont tes clics sur « Récupérer mon plan d'action » », version
     2026-09-30. Les adresses Calendly fictives des essais « ? » / « # » ont un chemin neutre (avant : …/x/30min).
     Nombre de vérifications inchangé (57).
   v64 (lot 5, brief V2 A et K) : DECOUVERTE.accords.conditions (version enregistrée à l'inscription) = la version des CGU en
     PDF, CONFIG.textes_legaux.cgu_version (servie « 2026-10-15 », LEGAUX_TEST), plus celle du texte court (2026-09-30,
     puis 2026-10-01 : la date des PDF, décision de Lucas du 30/09) ; à l'inscription, « CGU » et « politique de confidentialité » sont 2 liens distincts vers les PDF
     (target=_blank, rel=noopener ; jamais cliqués), plus de volet (le texte « Prise de rendez-vous » reste vérifié depuis le
     Profil), case des conditions présente, plus de case santé. Nombre de vérifications inchangé (57).
   v71 (sujet D) : « Suivi de mes clients » (#tb-clients) ne liste plus les prospects (plus de ligne ni de bouton « Ouvrir » pour
     Léa) : la fiche du prospect s'ouvre par Clients.ouvrir (ouvrirFiche), et ne compte comme ouverte que si son bandeau de
     consultation est affiché. Nombre de vérifications inchangé (57).
   Reprend le simulateur de verif47 : Supabase simulé en mémoire, rien ne part vers la vraie base.
   Usage : node verif50.js ../index.html                                          */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const PORT = 9680;
const OUT = path.join(__dirname, "captures", "v50"); fs.mkdirSync(OUT, { recursive: true });
/* reglages du HTML servi : inscription ouverte ou fermée, pre-remplissage eteint. v55 : le depot garde inscription_libre: true
   (ouverte par Lucas en v54) et calendly_prerempli: true ; la suite ferme l'inscription par défaut (inscriptionLibre) */
let inscriptionLibre = false, prerempliEteint = false;
const { servirFichier, forcerInscription } = require("./fichiers");   // 52.1 : la page charge css/ et js/, servis depuis son dossier (fichiers.js)
/* 52.1 : les retouches valent pour la page et pour ses fichiers (ces réglages sont dans js/config.js) */
/* v54 : l'inscription est ouverte dans le fichier ; la retouche force la valeur voulue (fermée par défaut), dans les deux sens.
   v55 : par forcerInscription (fichiers.js), comme toutes les suites qui testent l'inscription (les autres servent la valeur
   du fichier) */
/* v64 (lot 5, brief V2 A2) : les 3 emplacements CONFIG.textes_legaux (js/config.js, « à compléter » tant que Lucas ne les a
   pas remplis) servis avec des valeurs de test valides (liens Drive fictifs, jamais ouverts ; version postérieure au
   2026-09-30) le temps des blocs qui en ont besoin (legaux = LEGAUX_TEST), sinon tels quels. Aucun test ne clique un lien PDF. */
const LEGAUX_TEST = { cgu_pdf: "https://drive.google.com/file/d/TEST-CGU/view", confidentialite_pdf: "https://drive.google.com/file/d/TEST-POLITIQUE/view", cgu_version: "2026-10-15" };   // v64 : version DISTINCTE du texte court (2026-10-01 depuis la v64, comme les PDF)
let legaux = null;
const poserLegaux = t => legaux ? t.replace(/\b(cgu_pdf|confidentialite_pdf|cgu_version): "[^"\n]*"/g, (x, k) => k + ": " + JSON.stringify(legaux[k])) : t;
const retouche = h => { h = poserLegaux(forcerInscription(h, inscriptionLibre));
  if (prerempliEteint) h = h.replace("calendly_prerempli: true", "calendly_prerempli: false"); return h; };
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML, retouche)) return;
  let h = retouche(fs.readFileSync(HTML, "utf8"));
  res.writeHead(200, { "Content-Type": "text/html" }); res.end(h);
});
const res = []; const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
const PROSPECT = "00000000-0000-4000-8000-000000000c04";
/* v61 (lot 2, F) : l'événement de 15 min « Ton plan d'action offert » (avant : …/mhx-coaching/30min) */
const CAL = "https://calendly.com/mhx-coaching/ton-plan-d-action-offert-15-min-avec-lucas";
const PRE = "&name=L%C3%A9a&first_name=L%C3%A9a&email=l%40e.fr";
/* v61 : utm_source=app, utm_medium=bouton (avant : app-mhx / app) ; même ordre des paramètres */
const UTM = "utm_source=app&utm_medium=bouton";
/* le lien attendu pour la prospecte Léa (l@e.fr) : utm, puis prénom et email */
const lienAttendu = (source, sansPre) => CAL + "?" + UTM + (source ? "&utm_content=" + source : "") + (sansPre ? "" : PRE);
/* v61 (lot 2, vocabulaire commun) : le bouton unique et sa ligne dessous (avant : « Réserver mon bilan », sans ligne) */
const CTA = "Récupérer mon plan d'action", CTA_EN = "Get my action plan";
const SOUS = "15 min avec Lucas · offert", SOUS_EN = "15 min with Lucas · free";
/* v61 : les textes français passent par typoFr (espaces insécables U+00A0 / U+202F) : comparés après les avoir remplacés par des
   espaces simples (norm, plus bas, ne le fait pas : sa classe ne contient que des espaces simples) */
const plat = t => String(t || "").replace(/[\u00a0\u202f]/g, " ");
/* instant d'inscription : midi (heure locale) il y a n jours → jour de découverte n + 1 */
const creeLe = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d.toISOString(); };
/* v52 (28/09/2026, Chantier 1 lot C) : + bilan_propose — la page de proposition de bilan est passée (« Pas maintenant ») :
   la Découverte affiche l'accueil et ses boutons « Réserver mon bilan » (en-tête, accompagnement) ; sans ce choix, la page
   de proposition s'affiche d'abord (vérifiée par verif56) */
const INTAKE = { sexe: "Femme", age: "29", taille: "168", poids: "64", objectif: "Perte de poids / sèche", seances: "3", essaye: "Des régimes stricts.", obstacle: "Le manque de temps.", pourquoi: "Retrouver de l'énergie.", motivation: "8", court_le: creeLe(1), bilan_propose: { choix: "plus_tard", le: creeLe(1) } };
const FORMATION_M6 = { coches: {}, ouvert: "m6", lecon: "", challenge: "", defis: {}, diete: {}, semaine: 1, jour: 0, priorites: { semaine: [], demain: [] }, notes: [], objectifs: [] };
const norm = t => String(t || "").replace(/[  ]/g, " ");

function base(opts){
  opts = opts || {};
  const jour = opts.jour || 2;
  const profils = JSON.parse(JSON.stringify(F.profils)).concat([{ id: PROSPECT, prenom: opts.prenom === undefined ? "Léa" : opts.prenom, nom: "", role: "client", cree_le: creeLe(jour - 1) }]);
  profils.forEach(p => { p.statut = p.id === PROSPECT ? "prospect" : "client"; });
  const donnees = JSON.parse(JSON.stringify(F.donnees));
  if (opts.challenge) donnees.push({ user_id: PROSPECT, outil: "challenge", contenu: opts.challenge, maj_le: creeLe(1) });
  if (opts.intake !== null) donnees.push({ user_id: PROSPECT, outil: "intake", contenu: opts.intake || INTAKE, maj_le: creeLe(1) });
  if (opts.formation) donnees.push({ user_id: PROSPECT, outil: "formation", contenu: opts.formation, maj_le: creeLe(1) });
  return { profils, donnees, ecritures: [], lectures: [], inscriptions: [] };
}
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || { width: 1280, height: 900 } });
  c.setDefaultTimeout(6000);
  await c.route("**/*", async r => {
    const req = r.request(); const u = req.url(); const host = new URL(u).hostname;
    if (host === "localhost") return r.continue();
    if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" });
    if (!host.endsWith(".supabase.co")) return r.abort();
    const url = new URL(u); const p = url.pathname, q = url.searchParams, m = req.method();
    const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", body: body === null ? "" : JSON.stringify(body) });
    /* v56 : la connexion notée par la base (fonction noter_connexion, au démarrage de chaque compte client ou prospect) n'est
       pas une écriture de l'app dans les données : elle est testée à part (verif61) */
    if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
    if (p.startsWith("/auth/v1/signup")) { db.inscriptions.push(JSON.parse(req.postData() || "{}")); return json({ code: 400, msg: "inscription non simulée ici" }, 400); }
    if (p === "/auth/v1/user" && m === "GET") return json(who ? { id: who.id, aud: "authenticated", role: "authenticated", email: who.email } : { code: 401, msg: "invalid JWT" }, who ? 200 : 401);
    if (p.startsWith("/auth/v1/token")) return json(who ? F.session(who.id, who.email) : { error: "invalid" }, who ? 200 : 400);
    if (p.startsWith("/auth/v1/")) return json({});
    /* comme Supabase : 1 000 lignes au plus sans en-tete Range */
    const tranche = l => { const rg = req.headers()["range"]; if (!rg) return l.slice(0, 1000); const [a, z] = rg.split("-").map(Number); return l.slice(a, z + 1); };
    if (p === "/rest/v1/profils") { if (m !== "GET") { db.ecritures.push({ table: "profils", m }); return json(null, 204); } const id = q.get("id"); return json(id ? db.profils.filter(x => x.id === id.slice(3)) : tranche(db.profils)); }
    if (p === "/rest/v1/donnees") {
      if (m !== "GET") {
        let rows = []; try { rows = JSON.parse(req.postData() || "[]"); } catch (e) { }
        (Array.isArray(rows) ? rows : [rows]).forEach(row => {
          db.ecritures.push({ table: "donnees", m, user_id: row.user_id, outil: row.outil, contenu: row.contenu });
          const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
          const ligne = { user_id: row.user_id, outil: row.outil, contenu: row.contenu, maj_le: new Date().toISOString() };
          if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        });
        return json(null, 201);
      }
      let l = db.donnees; const uid = q.get("user_id"), o = q.get("outil") || "";
      db.lectures.push({ uid: uid || "", outil: o });
      if (who && who.id !== F.IDS.coach) l = l.filter(x => x.user_id === who.id && x.outil !== "notes_coach");
      if (uid) l = l.filter(x => x.user_id === uid.slice(3));
      if (o.startsWith("eq.")) l = l.filter(x => x.outil === o.slice(3));
      if (o.startsWith("in.(")) { const k = o.slice(4, -1).split(","); l = l.filter(x => k.includes(x.outil)); }
      if (o.startsWith("not.in.(")) { const k = o.slice(8, -1).split(","); l = l.filter(x => !k.includes(x.outil)); }
      const sel = (q.get("select") || "*").split(","); if (!sel.includes("*")) l = l.map(x => Object.fromEntries(sel.map(k => [k, x[k]])));
      return json(tranche(l));
    }
    const t = p.replace("/rest/v1/", "");
    if (F.catalogue[t]) { let l = F.catalogue[t]; const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return json(l); }
    return json([]);
  });
  await c.addInitScript(({ s, langue }) => { if (s) localStorage.setItem("mhx_session", JSON.stringify(s)); localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); if (langue) localStorage.setItem("mhx_langue", langue); }, { s: who ? who.session : null, langue: opts.langue || "" });
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
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1400); };
const texte = async (page, sel) => norm(await page.textContent(sel || "#vue").catch(() => ""));
const href = (page, sel) => page.$eval(sel, a => a.getAttribute("href")).catch(() => "");
const navIds = page => page.$$eval("#nav a", l => l.map(a => a.dataset.id));
const cadenasIds = page => page.$$eval("#nav a .nav-cadenas", l => l.map(e => e.closest("a").dataset.id).sort().join(","));
/* clic sur le bouton de réservation (v61 : « Récupérer mon plan d'action ») sans ouvrir Calendly (la navigation est annulee,
   les ecouteurs de l'app passent) */
const cliquerSansOuvrir = (page, sel) => page.evaluate(s => { const a = document.querySelector(s); if (!a) return false; a.addEventListener("click", e => e.preventDefault(), { once: true }); a.click(); return true; }, sel).catch(() => false);
const cleChallenge = db => (db.donnees.find(x => x.user_id === PROSPECT && x.outil === "challenge") || {}).contenu || {};
/* fiche consultee par le coach (Store.idConsulte), null hors fiche */
const idConsulte = page => page.evaluate(() => (typeof Store !== "undefined" && Store.idConsulte) || null).catch(() => null);
/* ouvre la fiche d'un compte depuis Mes clients et rend la fiche reellement ouverte (a verifier : l'ouverture peut echouer).
   v71 (D) : un prospect n'a plus de ligne ni de bouton « Ouvrir » ([data-ouvrir]) dans #tb-clients : la fiche s'ouvre par
   Clients.ouvrir(id, nom, "accueil") (comme ficheDe de verif58 ; avant : clic sur le bouton), nom = celui que portait le bouton
   (Clients.nom : « Léa ») ; la fiche ne compte comme ouverte (idConsulte) que si son bandeau de consultation est affiché */
const ouvrirFiche = async (page, id, nom) => { await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2200);
  await page.evaluate(([i, n]) => Clients.ouvrir(i, n, "accueil"), [id, nom || ""]).catch(() => {}); await attendre(page, 1800);
  return (await page.$("#vue .bandeau .bandeau-actions")) ? idConsulte(page) : null; };
const TXT_VERROU = "Cette fonctionnalité est disponible avec l'accompagnement MHX.";
/* v52 (28/09/2026, Chantier 1 lot E) : programme, nutrition, suivi (vitrine) montrent d'abord un exemple générique marqué
   « Exemple » (#ech-<id>, détaillé dans verif56, blocs E1), puis cet appel à la place du texte du verrou ; les pages cachées
   (compléments, bilan) gardent TXT_VERROU. Même lien, même comptage des clics, aucune donnée lue.
   v52 : lots D + E — journal (vitrine du lot D) a lui aussi son exemple ; Ma progression est ouverte (lot D). */
/* v61 (lot 2, brief V2 G) : un texte propre à chaque page de la vitrine (avant : le même appel partout, « Tu veux un programme
   construit pour toi, qui évolue chaque semaine ? Réserve ton bilan. » / « Want a program built for you that evolves every
   week? Book your assessment. ») */
const TXT_APPELS = {
  programme: "Cette séance découverte est la même pour tout le monde. Ton programme, lui, part de ton niveau, de ton matériel et de ton emploi du temps, puis évolue avec tes progrès.",
  journal: "Avec l'accompagnement, chaque séance est notée et l'app te propose la charge à viser la fois suivante : tu sais toujours quoi faire pour progresser.",
  nutrition: "Avec l'accompagnement, tes repas sont calculés sur tes calories et tes macros, en tenant compte de ton régime et de tes allergies, avec ta liste de courses.",
  suivi: "Avec l'accompagnement, ton coach lit ton bilan chaque semaine et te répond avec la suite du plan : tu sais toujours où tu en es et quoi faire ensuite."
};
const TXT_APPEL_EN = "This starter workout is the same for everyone. Your program starts from your level, your equipment and your schedule, then evolves as you progress.";   // #/programme
/* le bouton du verrou (seul lien du verrou) et la ligne juste après son bloc : { n, t, sous } */
const boutonVerrou = page => page.evaluate(() => { const v = document.querySelector("#vue .verrou"); if (!v) return null; const a = v.querySelector(".actions a[target=_blank]"), s = v.querySelector(".actions + p.verrou-sous");
  return { n: v.querySelectorAll("a").length, t: a ? a.textContent.trim() : null, sous: s ? s.textContent.trim() : null }; }).catch(() => null);
const TXT_FORMATION_FERMEE = "Ta période découverte est terminée : la Speed Formation fait partie de l'accompagnement.";

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();

  /* ---------- A. Lien Calendly central : lienCalendly(source) ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/decouverte`); await attendre(page, 2600);
    /* v61 (lot 2, E1 et F) : « Récupérer mon plan d'action » (avant : « Réserver mon bilan »), code accueil_haut (avant :
       decouverte), utm_source=app, utm_medium=bouton, puis la ligne « 15 min avec Lucas · offert » juste après son bloc */
    const hTete = await href(page, '#dc-vue a[data-dc-cal="accueil_haut"]');
    const tTete = await texte(page, '#dc-vue a[data-dc-cal="accueil_haut"]');
    const sTete = plat(await texte(page, "#dc-vue header.masthead .actions + p.dc-cta-sous.dc-haut-sous")).trim();
    ok("Découverte : « Récupérer mon plan d'action » de l'en-tête → Calendly avec utm_source=app, utm_medium=bouton, utm_content=accueil_haut, puis name, first_name, email ; « 15 min avec Lucas · offert » dessous", hTete === lienAttendu("accueil_haut") && tTete.trim() === CTA && sTete === SOUS, hTete + " | " + tTete + " | " + sTete);
    /* v61 (E2) : code accueil_accompagnement (avant : decouverte-accompagnement) ; + le texte du bouton */
    const hAcc = await href(page, '#dc-accomp a[data-dc-cal="accueil_accompagnement"]');
    const tAcc = await texte(page, '#dc-accomp a[data-dc-cal="accueil_accompagnement"]');
    ok("Découverte : le bouton de la carte « Ce que l'accompagnement ajoute » (« Récupérer mon plan d'action ») porte utm_content=accueil_accompagnement", hAcc === lienAttendu("accueil_accompagnement") && tAcc.trim() === CTA, hAcc + " | " + tAcc);
    const r = await page.evaluate(() => {
      if (typeof lienCalendly !== "function") return { err: "lienCalendly absent" };
      const out = {};
      out.sans = lienCalendly();
      /* v61 : + des sources avec « _ » hors format (majuscules, « & », 41 caractères) ; « _ » est accepté (40 caractères au plus) */
      out.hors = ["Verrou Programme", "decouverte&email=pirate%40x.fr", "x".repeat(41), 42, null, "verrou-programme#x", "Verrou_Programme", "accueil_haut&utm_source=pirate", "a_".repeat(20) + "x"].map(s => lienCalendly(s));
      out.souligne = lienCalendly("a_".repeat(20));
      /* v61 : adresses fictives au chemin neutre (avant : https://calendly.com/x/30min…) */
      const avant = CONFIG.marque.calendly, p0 = Auth.profil.prenom;
      CONFIG.marque.calendly = "https://calendly.com/exemple/rendez-vous?month=2026-10#haut"; out.diese = lienCalendly("apres_questionnaire");
      CONFIG.marque.calendly = "https://calendly.com/exemple/rendez-vous#haut"; out.diese2 = lienCalendly("verrou_programme");
      CONFIG.marque.calendly = "javascript:alert(1)"; out.piege = lienCalendly("accueil_haut");
      CONFIG.marque.calendly = ""; out.vide = lienCalendly("accueil_haut");
      CONFIG.marque.calendly = avant;
      Auth.profil.prenom = "L" + String.fromCharCode(0xD800) + "a"; try { out.malforme = lienCalendly("accueil_haut"); } catch(e){ out.err = String(e); }
      Auth.profil.prenom = ""; out.sansPrenom = lienCalendly("accueil_haut");
      Auth.profil.prenom = "Anne-Marie & Co"; out.special = lienCalendly("accueil_haut");
      /* v52 (lot B) : avec un nom */
      const n0 = Auth.profil.nom;
      Auth.profil.prenom = p0; Auth.profil.nom = "Dupré-Martin"; out.avecNom = lienCalendly("accueil_haut");
      Auth.profil.prenom = ""; out.nomSeul = lienCalendly("accueil_haut");
      Auth.profil.nom = n0;
      Auth.profil.prenom = p0;
      return out;
    }).catch(e => ({ err: String(e) }));
    ok("lienCalendly() sans source : utm_source et utm_medium, pas d'utm_content, prénom et email pré-remplis", r.sans === lienAttendu(""), r.sans || r.err);
    ok("source hors format (majuscules, espace, « & », plus de 40 caractères, nombre, null, « # », v61 : aussi avec « _ ») : aucun utm_content, rien d'injecté ; v61 : « _ » accepté (40 caractères : utm_content)", Array.isArray(r.hors) && r.hors.length === 9 && r.hors.every(x => x === lienAttendu("")) && r.souligne === lienAttendu("a_".repeat(20)), JSON.stringify(r.hors || r.err) + " | " + r.souligne);
    ok("adresse Calendly avec « ? » et « # » : paramètres ajoutés avec « & », avant le « # »", r.diese === "https://calendly.com/exemple/rendez-vous?month=2026-10&" + UTM + "&utm_content=apres_questionnaire" + PRE + "#haut", r.diese);
    ok("adresse Calendly avec « # » seulement : « ? » ajouté avant le « # »", r.diese2 === "https://calendly.com/exemple/rendez-vous?" + UTM + "&utm_content=verrou_programme" + PRE + "#haut", r.diese2);
    ok("adresse Calendly piégée (javascript:) ou vide : aucun lien", r.piege === "" && r.vide === "", JSON.stringify([r.piege, r.vide]));
    ok("prénom avec un caractère mal formé : aucune erreur, adresse Calendly intacte (sans aucun paramètre)", !r.err && r.malforme === CAL, JSON.stringify({ l: r.malforme, err: r.err }));
    ok("prospect sans prénom : ni name ni first_name, l'email reste pré-rempli", r.sansPrenom === CAL + "?" + UTM + "&utm_content=accueil_haut&email=l%40e.fr", r.sansPrenom);
    ok("prénom avec espace et « & » : encodé, aucun paramètre injecté", r.special === CAL + "?" + UTM + "&utm_content=accueil_haut&name=Anne-Marie%20%26%20Co&first_name=Anne-Marie%20%26%20Co&email=l%40e.fr", r.special);
    ok("v52 : prospect avec un nom : name = « Léa Dupré-Martin », first_name = Léa, last_name = Dupré-Martin, puis l'email", r.avecNom === CAL + "?" + UTM + "&utm_content=accueil_haut&name=L%C3%A9a%20Dupr%C3%A9-Martin&first_name=L%C3%A9a&last_name=Dupr%C3%A9-Martin&email=l%40e.fr", r.avecNom);
    ok("v52 : nom sans prénom : name = le nom, last_name, pas de first_name", r.nomSeul === CAL + "?" + UTM + "&utm_content=accueil_haut&name=Dupr%C3%A9-Martin&last_name=Dupr%C3%A9-Martin&email=l%40e.fr", r.nomSeul);
    await aller(page, "#/accueil", 2200);
    const hAccueil = await href(page, '#acc-vue a[data-dc-cal="accueil_haut"]');
    /* v61 (F) : sur « Modifier mes réponses », le même bouton porte le code reponses_haut (avant : decouverte aussi), avec la
       même ligne dessous */
    await aller(page, "#/decouverte/reponses", 2000);
    const hRep = await href(page, '#dc-vue a[data-dc-cal="reponses_haut"]'), nRep = (await page.$$("#dc-vue [data-dc-cal]")).length;
    const sRep = plat(await texte(page, "#dc-vue header.masthead .actions + p.dc-cta-sous.dc-haut-sous")).trim();
    ok("#/accueil du prospect : le même écran Découverte, le même lien (utm_content=accueil_haut) ; v61 : « Modifier mes réponses » : un seul bouton, utm_content=reponses_haut, « 15 min avec Lucas · offert » dessous", hAccueil === lienAttendu("accueil_haut") && hRep === lienAttendu("reponses_haut") && nRep === 1 && sRep === SOUS, hAccueil + " | " + hRep + " (" + nRep + " bouton(s)) | " + sRep);
    await aller(page, "#/programme", 1400);
    /* v61 (G et F) : « Récupérer mon plan d'action » (avant : « Réserver mon bilan »), code verrou_programme (avant :
       verrou-programme), seul lien du verrou, puis « 15 min avec Lucas · offert » */
    const hV = await href(page, "#vue .verrou a[target=_blank]"), bV = await boutonVerrou(page);
    ok("page verrouillée (#/programme) : « Récupérer mon plan d'action » → utm_content=verrou_programme, prénom et email ; « 15 min avec Lucas · offert » dessous", hV === lienAttendu("verrou_programme") && !!bV && bV.n === 1 && bV.t === CTA && plat(bV.sous) === SOUS, hV + " | " + JSON.stringify(bV));
    ok("prospect (Découverte, #/accueil, page verrouillée, liens calculés) : aucune écriture en base", db.ecritures.length === 0, JSON.stringify(db.ecritures.map(e => [e.table, e.user_id, e.outil])));
    await c.close();
  }
  {
    /* questionnaire pas encore rempli : pas de bouton Calendly sur la Découverte */
    const db = base({ intake: null });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/decouverte`); await attendre(page, 2400);
    ok("questionnaire pas encore rempli : aucun bouton Calendly sur la Découverte", !!(await page.$("#dc-vue #dc-voir")) && !(await page.$('#dc-vue a[href*="calendly"]')));
    await c.close();
  }
  {
    prerempliEteint = true;
    const db = base();
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/decouverte`); await attendre(page, 2600);
    /* v61 : codes accueil_haut et verrou_nutrition (avant : decouverte, verrou-nutrition) */
    const h1 = await href(page, '#dc-vue a[data-dc-cal="accueil_haut"]');
    await aller(page, "#/nutrition", 1400);
    const h2 = await href(page, "#vue .verrou a[target=_blank]");
    ok("interrupteur calendly_prerempli à false : utm seulement, ni prénom ni email (Découverte et page verrouillée)", h1 === lienAttendu("accueil_haut", true) && h2 === lienAttendu("verrou_nutrition", true), h1 + " | " + h2);
    await c.close();
    prerempliEteint = false;
  }
  {
    const db = base();
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/tableau`); await attendre(page, 2200);
    const hors = await idConsulte(page);
    /* v61 : avec un nouveau code (accueil_haut, verrou_programme) comme avec un ancien (decouverte) : la base seule */
    const lc = await page.evaluate(() => typeof lienCalendly === "function" ? lienCalendly("accueil_haut") : null).catch(() => null);
    const fiche = await ouvrirFiche(page, PROSPECT, "Léa");   // v71 (D) : par Clients.ouvrir (plus de bouton « Ouvrir » pour un prospect)
    const lf = await page.evaluate(() => typeof lienCalendly === "function" ? [lienCalendly("accueil_haut"), lienCalendly("verrou_programme"), lienCalendly("decouverte"), lienCalendly()] : null).catch(() => null);
    ok("coach (hors fiche, puis dans la fiche du prospect bien ouverte) : lienCalendly() rend l'adresse brute, sans utm ni pré-remplissage", hors === null && fiche === PROSPECT && lc === CAL && Array.isArray(lf) && lf.every(x => x === CAL), JSON.stringify({ hors, fiche, lc, lf }));
    await c.close();
  }
  {
    const db = base();
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
    const l = await page.evaluate(() => typeof lienCalendly === "function" ? lienCalendly("accueil_haut") : null).catch(() => null);   // v61 : nouveau code (avant : decouverte)
    ok("client accompagné : lienCalendly() rend l'adresse brute (inchangé)", l === CAL, String(l));
    await c.close();
  }
  {
    const db = base();
    const { c, page } = await contexte(b, lea, db, { langue: "en" });
    await page.goto(`http://localhost:${PORT}/#/decouverte`); await attendre(page, 2600);
    /* v61 (lot 2) : « Get my action plan » (avant : « Book my assessment ») et « 15 min with Lucas · free » dessous ; #/programme :
       son texte anglais propre (avant : l'appel commun) ; codes accueil_haut / verrou_programme */
    const tTete = await texte(page, '#dc-vue a[data-dc-cal="accueil_haut"]');
    const sTete = (await texte(page, "#dc-vue header.masthead .actions + p.dc-cta-sous.dc-haut-sous")).trim();
    await aller(page, "#/programme", 1400);
    const tV = await texte(page, "#vue .verrou");
    const hV = await href(page, "#vue .verrou a[target=_blank]"), bV = await boutonVerrou(page);
    ok("anglais : « Get my action plan » et « 15 min with Lucas · free » sur la Découverte et la page verrouillée (#/programme : « " + TXT_APPEL_EN + " »), même lien", tTete.trim() === CTA_EN && sTete === SOUS_EN && !!bV && bV.n === 1 && bV.t === CTA_EN && bV.sous === SOUS_EN && tV.includes(TXT_APPEL_EN) && !tV.includes("Book my assessment") && hV === lienAttendu("verrou_programme"), tTete + " | " + sTete + " | " + JSON.stringify(bV) + " | " + tV.slice(0, 160) + " | " + hV);
    await c.close();
  }

  /* ---------- B. Confidentialité : « Prise de rendez-vous », relisible depuis le Profil ---------- */
  {
    legaux = LEGAUX_TEST;   // v64 : version des CGU de test (CONFIG.textes_legaux.cgu_version), distincte de celle du texte court
    const db = base();
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2400);
    const d = await page.evaluate(() => {
      if (typeof DECOUVERTE === "undefined" || !DECOUVERTE.confidentialite || !DECOUVERTE.en) return null;
      const fr = DECOUVERTE.confidentialite.paragraphes || [], en = (DECOUVERTE.en.confidentialite || {}).paragraphes || [];
      const i = fr.findIndex(p => /^Prise de rendez-vous/.test(p));
      /* v61 (décision 4) : le paragraphe « Données collectées » (2e) et les versions du texte */
      const j = fr.findIndex(p => /^Données collectées/.test(p));
      return { i, fr: fr[i] || "", en: en[i] || "", nFr: fr.length, nEn: en.length, j, frD: fr[j] || "", enD: en[j] || "",
        version: DECOUVERTE.confidentialite.version, conditions: DECOUVERTE.accords ? DECOUVERTE.accords.conditions : null,
        cgu: typeof CONFIG !== "undefined" && CONFIG.textes_legaux ? CONFIG.textes_legaux.cgu_version : null };
    }).catch(() => null);
    /* v61 (lot 2, décision 4) : texte court version 2026-09-30 (avant : 2026-09-29) ; 2e paragraphe « … dont tes clics sur
       « Récupérer mon plan d'action » » (avant : « Réserver mon bilan »).
       v64 (brief V2 A2 et K) : accords.conditions (version enregistrée aux nouvelles inscriptions) = la version des CGU en PDF,
       CONFIG.textes_legaux.cgu_version (servie « 2026-10-15 ») ; avant : celle du texte court, qui passe à 2026-10-01 (K) */
    ok("DECOUVERTE.confidentialite : un paragraphe « Prise de rendez-vous » (Calendly, société américaine, pour le compte du coach, États-Unis, pré-remplissage à l'ouverture, écran d'origine) ; v61 : 2e paragraphe « Données collectées : … dont tes clics sur « Récupérer mon plan d'action » », version 2026-10-01 (v64, celle des PDF) ; v64 : accords.conditions = CONFIG.textes_legaux.cgu_version (« 2026-10-15 » servie), plus la version du texte court",
      !!d && d.i > -1 && ["ton bilan se réserve sur Calendly (société américaine)", "pour le compte du coach", "États-Unis", "pré-remplis dès que tu ouvres la page de réservation", "l'écran de l'app d'où tu viens", "Ton prénom, ton nom et ton email"].every(x => d.fr.includes(x))
      && d.j === 1 && d.frD.includes("dont tes clics sur « " + CTA + " ».") && !d.frD.includes("Réserver mon bilan") && d.version === "2026-10-01" && d.cgu === LEGAUX_TEST.cgu_version && d.conditions === LEGAUX_TEST.cgu_version && d.conditions !== d.version, JSON.stringify(d));
    ok("confidentialité en anglais : le paragraphe « Booking: » à la même place (Calendly, a US company, on the coach's behalf, pre-filled, app screen) ; v61 : « Data collected: … including your clicks on “Get my action plan” » à la même place que le français",
      !!d && d.nFr === d.nEn && /^Booking: /.test(d.en) && ["Calendly (a US company)", "on the coach's behalf", "United States", "pre-filled as soon as you open the booking page", "the app screen you came from", "Your first name, last name and email"].every(x => d.en.includes(x))
      && /^Data collected: /.test(d.enD) && d.enD.includes("including your clicks on “" + CTA_EN + "”.") && !d.enD.includes("Book my assessment"), JSON.stringify(d && [d.en, d.enD]));
    const vue = await texte(page);
    /* v52 : questionnaire validé → « Modifier mes réponses » (#/decouverte/reponses) ; avant : « Voir mon résultat » (#/decouverte) */
    ok("Profil du prospect : « Tes réponses au questionnaire sont enregistrées… » et le lien « Modifier mes réponses » (#/decouverte/reponses)", vue.includes("Tes réponses au questionnaire sont enregistrées") && (await texte(page, '#vue a[href="#/decouverte/reponses"]')).trim() === "Modifier mes réponses");
    const bouton = await texte(page, "#mc-conditions");
    await page.click("#mc-conditions").catch(() => {}); await attendre(page, 500);
    const v = await texte(page, ".volet");
    /* v61 (décision 4) : le volet affiche le nouveau 2e paragraphe (« Récupérer mon plan d'action »), plus « Réserver mon bilan » */
    ok("Profil du prospect : « Conditions d'utilisation et confidentialité » s'ouvre sur le texte complet, « Prise de rendez-vous » compris ; v61 : « dont tes clics sur « Récupérer mon plan d'action » », plus de « Réserver mon bilan »",
      bouton.trim() === "Conditions d'utilisation et confidentialité" && v.includes("Prise de rendez-vous : ton bilan se réserve sur Calendly (société américaine)") && v.includes("l'écran de l'app d'où tu viens") && v.includes("Hébergement : Supabase")
      && plat(v).includes("dont tes clics sur « " + CTA + " »") && !plat(v).includes("Réserver mon bilan"), bouton + " | " + v.slice(0, 200) + " | " + (/dont tes clics sur[^.]*/.exec(plat(v)) || [""])[0]);
    await page.keyboard.press("Escape"); await attendre(page, 400);
    ok("relire les conditions ferme proprement (Échap) et n'écrit rien", !(await page.$(".volet")) && db.ecritures.length === 0, JSON.stringify(db.ecritures.map(e => e.outil)));
    await c.close();
    legaux = null;
  }
  {
    const db = base();
    const { c, page } = await contexte(b, lea, db, { langue: "en" });
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2400);
    const bouton = await texte(page, "#mc-conditions");
    await page.click("#mc-conditions").catch(() => {}); await attendre(page, 500);
    const v = await texte(page, ".volet");
    const P = await page.evaluate(() => typeof DECOUVERTE === "undefined" ? null : { fr: (DECOUVERTE.confidentialite || {}).paragraphes || [], en: ((DECOUVERTE.en || {}).confidentialite || {}).paragraphes || [] }).catch(() => null);
    /* chaque paragraphe anglais en entier ; aucun debut de paragraphe francais (un paragraphe oublie resterait en francais) */
    const manquantsEn = P ? P.en.filter(x => !v.includes(norm(x))).map(x => x.slice(0, 30)) : ["DECOUVERTE absent"];
    const restesFr = P ? P.fr.map(x => norm(x).slice(0, 20)).concat(["Conditions d'utilisation", "Hébergement :", "Données collectées", "Prise de rendez-vous"]).filter(x => v.includes(x)) : [];
    /* v61 (décision 4) : dont « including your clicks on “Get my action plan” » (avant : “Book my assessment”) */
    ok("Profil du prospect en anglais : « Terms of use and privacy » → tous les paragraphes anglais (dont « Booking: your assessment is booked on Calendly (a US company)… » et, v61, « including your clicks on “Get my action plan” »), aucun paragraphe français",
      bouton.trim() === "Terms of use and privacy" && !!P && P.fr.length > 0 && P.en.length === P.fr.length && manquantsEn.length === 0 && restesFr.length === 0 && v.includes("Booking: your assessment is booked on Calendly (a US company)") && v.includes("on the coach's behalf") && v.includes("the app screen you came from")
      && v.includes("including your clicks on “" + CTA_EN + "”") && !v.includes("Book my assessment"),
      bouton + " | anglais manquants " + JSON.stringify(manquantsEn) + " | restes français " + JSON.stringify(restesFr) + " | " + v.slice(0, 160));
    await c.close();
  }
  {
    const db = base();
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2400);
    const client = !(await page.$("#mc-conditions")) && !!(await page.$("#vue #p-save"));
    await c.close();
    const db2 = base();
    const { c: c2, page: p2 } = await contexte(b, coach, db2);
    const f1 = await ouvrirFiche(p2, PROSPECT, "Léa");   // v71 (D) : par Clients.ouvrir
    await aller(p2, "#/profil", 1800);
    const f2 = await idConsulte(p2), h2 = await p2.evaluate(() => location.hash);
    /* le Profil de la fiche est bien affiche (questionnaire du prospect), toujours dans sa fiche */
    const profilFiche = f1 === PROSPECT && f2 === PROSPECT && h2 === "#/profil" && !!(await p2.$("#vue [data-q]"));
    const fiche = !(await p2.$("#mc-conditions"));
    await c2.close();
    ok("client (son Profil) et coach (Profil de la fiche du prospect, bien ouverte) : pas de lien vers les conditions du prospect (inchangé)", client && profilFiche && fiche, JSON.stringify({ client, f1, f2, h2, profilFiche, fiche }));
  }
  {
    inscriptionLibre = true; legaux = LEGAUX_TEST;   // v64 : liens des PDF de test (CONFIG.textes_legaux)
    const db = base();
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/#/inscription`); await attendre(page, 1400);
    /* v61 (décision 4) : le même texte court à l'inscription (« Récupérer mon plan d'action »).
       v64 (brief V2 A2, A3) : l'inscription n'ouvre plus le volet du texte court (avant : clic sur #c-cgu-lien, « Prise de
       rendez-vous… » dans le volet ; ce texte reste relisible et vérifié depuis le Profil, plus haut) : « CGU » et « politique
       de confidentialité » sont 2 liens distincts vers les PDF de CONFIG.textes_legaux (nouvel onglet, jamais cliqués) ; la
       case des conditions reste, la case santé a disparu */
    const e = await page.evaluate(() => ({ liens: ["c-cgu-lien", "c-politique-lien"].map(id => { const a = document.getElementById(id);
        return a ? { tag: a.tagName, href: a.getAttribute("href"), cible: a.getAttribute("target"), rel: a.getAttribute("rel"), t: a.textContent.replace(/\s+/g, " ").trim(), dansCase: !!a.closest("label.co-cgu") } : null; }),
      cgu: !!document.getElementById("c-cgu"), sante: !!document.getElementById("c-sante") })).catch(e => ({ erreur: String(e), liens: [] }));
    ok("inscription : « CGU » et « politique de confidentialité », 2 liens distincts vers les PDF (href = CONFIG.textes_legaux.cgu_pdf / confidentialite_pdf, target=_blank, rel=noopener) au lieu du volet du texte court (relisible depuis le Profil) ; case des conditions présente, plus de case santé (v64)",
      e.liens.length === 2 && e.liens.every(l => l && l.tag === "A" && l.cible === "_blank" && /(^|\s)noopener(\s|$)/.test(l.rel || "") && l.dansCase) && e.liens[0].href === LEGAUX_TEST.cgu_pdf && e.liens[1].href === LEGAUX_TEST.confidentialite_pdf
      && e.liens[0].t === "CGU" && e.liens[1].t === "politique de confidentialité" && e.cgu && !e.sante, JSON.stringify(e));
    await c.close();
    inscriptionLibre = false; legaux = null;
  }

  /* ---------- C. Navigation du prospect (bureau) ---------- */
  {
    const db = base({ formation: FORMATION_M6 });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/decouverte`); await attendre(page, 2600);
    const ids = await navIds(page);
    /* v52 (lot D) : + journal (vitrine), Ma progression et calculateur (ouverts) */
    ok("prospect (jour 2) : navigation = accueil, programme, journal, nutrition, progression, calculateur, suivi, formation, profil", JSON.stringify(ids) === '["accueil","programme","journal","nutrition","mensurations","calculateur","suivi","formation","profil"]', JSON.stringify(ids));
    ok("prospect : plus d'onglet Challenge, pas de Découverte en double, ni compléments ou bilan", !["challenge", "decouverte", "complements", "bilan"].some(x => ids.includes(x)), JSON.stringify(ids));
    ok("prospect (jour 2) : cadenas sur la vitrine programme, journal, nutrition, suivi ; progression, calculateur, formation ouverts", (await cadenasIds(page)) === "journal,nutrition,programme,suivi", await cadenasIds(page));
    /* v52 : lots D + E — les quatre pages de la vitrine (journal compris) : l'exemple, puis l'appel, aucune donnée lue */
    for (const r of ["programme", "journal", "nutrition", "suivi"]) {
      const avant = db.lectures.length;
      await aller(page, "#/" + r, 1300);
      const t = plat(await texte(page, "#vue .verrou")), lu = db.lectures.slice(avant), bV = await boutonVerrou(page);
      /* v52 (lot E) : aucune clé de la table donnees lue (la journée type de #/nutrition lit le catalogue public : permis)
         v61 (lot 2, G et F) : le texte propre à la page (avant : l'appel commun), « Récupérer mon plan d'action » (avant :
         « Réserver mon bilan »), seul lien du verrou, utm_content=verrou_<page> (avant : verrou-<page>), « 15 min avec Lucas ·
         offert » dessous */
      ok(`#/${r} (vitrine) : page verrouillée (l'exemple, puis son texte), « Récupérer mon plan d'action » (utm_content=verrou_${r}) et « 15 min avec Lucas · offert », aucune de ses données lue`, t.includes(TXT_APPELS[r]) && !!(await page.$("#vue #ech-" + r + ".echantillon")) && !!bV && bV.n === 1 && bV.t === CTA && plat(bV.sous) === SOUS && !t.includes("Réserver mon bilan") && (await href(page, "#vue .verrou a[target=_blank]")) === lienAttendu("verrou_" + r) && lu.length === 0, t.slice(0, 160) + " | " + JSON.stringify(bV) + " | lectures " + JSON.stringify(lu));
    }
    for (const r of ["complements", "bilan"]) {   // v52 : Ma progression n'est plus verrouillée
      const avant = db.lectures.length;
      await aller(page, "#/" + r, 1300);
      const t = plat(await texte(page, "#vue .verrou")), bV = await boutonVerrou(page);
      const lu = db.lectures.slice(avant);
      /* avant > 0 : le compteur de lectures marche (l'accueil a bien lu ses donnees)
         v61 (lot 2) : même bouton et même ligne que la vitrine, code verrou_<page> (avant : « Réserver mon bilan », verrou-<page>) */
      ok(`#/${r} (caché) : verrouillé à son adresse, « Récupérer mon plan d'action » (utm_content=verrou_${r}) et « 15 min avec Lucas · offert », aucune donnée lue`, t.includes(TXT_VERROU) && !!bV && bV.n === 1 && bV.t === CTA && plat(bV.sous) === SOUS && !t.includes("Réserver mon bilan") && (await href(page, "#vue .verrou a[target=_blank]")) === lienAttendu("verrou_" + r) && avant > 0 && lu.length === 0, t.slice(0, 120) + " | " + JSON.stringify(bV) + " | lectures " + JSON.stringify(lu) + " (avant : " + avant + ")");
    }
    const redir = [];
    for (const h of ["#/challenge", "#/challenge/3", "#/challenge-libre", "#/challenge-rythme"]) {
      await aller(page, "#/profil", 900);
      await aller(page, h, 1500);
      redir.push([h, await page.evaluate(() => location.hash), !!(await page.$("#vue #dc-vue"))]);
    }
    ok("anciennes adresses du Challenge (#/challenge, #/challenge/3, #/challenge-libre, #/challenge-rythme) → #/decouverte", redir.every(x => x[1] === "#/decouverte" && x[2]), JSON.stringify(redir));
    await aller(page, "#/formation", 2200);
    const liens = await page.$$eval("#vue a[href^='#/']", l => l.map(a => a.getAttribute("href"))).catch(() => []);
    ok("formation : ouverte, et ses liens internes ne mènent à aucun onglet caché (#/complements, #/bilan)",
      !(await page.$("#vue .verrou")) && !!(await page.$("#fo-vue")) && liens.includes("#/nutrition") && !liens.some(x => ["#/complements", "#/bilan"].includes(x)), JSON.stringify(liens));
    /* v52 (lot D) : fonction supprimée — « le mode test #/decouverte-jour/8 verrouille la formation » (plus de verrou au jour 8) */
    ok("aucune écriture pendant la navigation du prospect (pages verrouillées de la vitrine et cachées, anciennes adresses du Challenge, formation)", db.ecritures.length === 0, JSON.stringify(db.ecritures.map(e => [e.table, e.user_id, e.outil])));
    await c.close();
  }
  /* v52 (lot D) : fonction supprimée — « prospect (jour 8) : formation verrouillée » */
  {
    /* reglage de la vitrine absent, en texte ou vide : sans erreur */
    const db = base();
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/decouverte`); await attendre(page, 2400);
    const ids = await page.evaluate(() => { const out = {}; const v0 = CONFIG.marque.gratuit_vitrine; for (const v of [undefined, "programme", []]) { CONFIG.marque.gratuit_vitrine = v; construireNav(); out[JSON.stringify(v === undefined ? "absent" : v)] = Array.from(document.querySelectorAll("#nav a")).map(a => a.dataset.id); } CONFIG.marque.gratuit_vitrine = v0; construireNav(); return out; }).catch(e => ({ err: String(e) }));
    ok("vitrine absente ou en texte : tous les onglets verrouillés redeviennent visibles (progression, compléments avec cadenas)", ["\"absent\"", "\"programme\""].every(k => Array.isArray(ids[k]) && ["mensurations", "suivi", "complements"].every(x => ids[k].includes(x))), JSON.stringify(ids));
    ok("vitrine vide ([]) : seuls les onglets ouverts restent (accueil, progression, calculateur, formation, profil)", JSON.stringify(ids["[]"]) === '["accueil","mensurations","calculateur","formation","profil"]', JSON.stringify(ids["[]"]));
    await c.close();
  }
  {
    const db = base();
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
    const ids = await navIds(page);
    ok("client : navigation complète inchangée (programme, nutrition, mensurations, suivi, formation, compléments, profil), aucun cadenas, ni Challenge ni Découverte",
      ["programme", "nutrition", "mensurations", "suivi", "formation", "complements", "profil"].every(x => ids.includes(x)) && !ids.includes("challenge") && !ids.includes("decouverte") && (await page.$$("#nav .nav-cadenas")).length === 0, JSON.stringify(ids));
    await c.close();
  }
  {
    const db = base();
    const { c, page } = await contexte(b, coach, db);
    const fiche = await ouvrirFiche(page, PROSPECT, "Léa");   // v71 (D) : par Clients.ouvrir
    const ids = await navIds(page);
    await aller(page, "#/programme", 1600);
    const verrou = !!(await page.$("#vue .verrou"));
    await aller(page, "#/mensurations", 1600);
    const verrou2 = !!(await page.$("#vue .verrou"));
    const fin = await idConsulte(page);
    /* « accueil » est client_seul : il n'apparait dans la navigation du coach que dans une fiche */
    ok("coach dans la fiche d'un prospect (bien ouverte : Accueil de la fiche présent) : tous les onglets de sa fiche, aucun cadenas, aucune page verrouillée, aucune écriture",
      fiche === PROSPECT && fin === PROSPECT && ids.includes("accueil") && ids.includes("mensurations") && ids.includes("suivi") && ids.includes("complements") && (await page.$$("#nav .nav-cadenas")).length === 0 && !verrou && !verrou2 && db.ecritures.length === 0,
      JSON.stringify({ fiche, fin, ids, verrou, verrou2, ecritures: db.ecritures.map(e => [e.table, e.user_id, e.outil]) }));
    await c.close();
  }

  /* ---------- D. Clics « Récupérer mon plan d'action » (v61 ; avant : « Réserver mon bilan ») des pages verrouillées ----------
     v61 (lot 2, F) : chaque clic est noté avec le code verrou_<page> (avant : verrou-<page>) ; un ancien clic en base garde son
     ancien code (« decouverte ») : rien n'est réécrit */
  {
    const ancien = { version: 1, jours: { "1": { fait: creeLe(1), date: "x" } }, cta: { clics: [{ jour: 1, source: "decouverte", date: creeLe(1) }] } };
    const db = base({ challenge: ancien });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/programme`); await attendre(page, 2400);
    const t0 = Date.now();
    await cliquerSansOuvrir(page, "#vue .verrou a[target=_blank]"); await attendre(page, 1800);
    let C = cleChallenge(db), cl = (C.cta && C.cta.clics) || [];
    const der = cl[cl.length - 1] || {};
    ok("clic « Récupérer mon plan d'action » sur #/programme : noté dans challenge.cta.clics { jour: 2, source: \"verrou_programme\", date }",
      cl.length === 2 && der.jour === 2 && der.source === "verrou_programme" && typeof der.date === "string" && Math.abs(Date.parse(der.date) - t0) < 60000, JSON.stringify(C.cta));
    ok("le clic s'ajoute sans rien perdre (ancien clic et anciens jours gardés)", cl.length === 2 && cl[0].source === "decouverte" && !!(C.jours && C.jours["1"]), JSON.stringify(C));
    /* v52 (lot D) : Ma progression est ouverte au prospect ; la page cachée essayée est #/complements */
    await aller(page, "#/complements", 1400);
    await cliquerSansOuvrir(page, "#vue .verrou a[target=_blank]"); await attendre(page, 1800);
    C = cleChallenge(db); cl = (C.cta && C.cta.clics) || [];
    ok("clic depuis une page cachée (#/complements) : noté avec source \"verrou_complements\"", cl.length === 3 && (cl[2] || {}).source === "verrou_complements", JSON.stringify(C.cta));
    ok("aucune autre écriture que la clé challenge de la prospecte", db.ecritures.length > 0 && db.ecritures.every(e => e.table === "donnees" && e.user_id === PROSPECT && e.outil === "challenge"), JSON.stringify(db.ecritures.map(e => [e.table, e.user_id, e.outil])));
    const tr = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem("mhx_tracking") || "[]"); } catch(e){ return []; } });
    ok("événement « call_cta_clicked » noté dans mhx_tracking pour chaque clic", tr.filter(x => x.event === "call_cta_clicked" && x.uid === PROSPECT).length === 2, JSON.stringify(tr.map(x => x.event)));
    await c.close();
  }
  {
    /* aucune cle challenge encore : elle nait au premier clic */
    const db = base();
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/suivi`); await attendre(page, 2400);
    await cliquerSansOuvrir(page, "#vue .verrou a[target=_blank]"); await attendre(page, 1800);
    const C = cleChallenge(db), cl = (C.cta && C.cta.clics) || [];
    ok("premier clic sans clé challenge (#/suivi) : la clé naît avec ce clic (source \"verrou_suivi\")", cl.length === 1 && cl[0].source === "verrou_suivi" && cl[0].jour === 2, JSON.stringify(C));
    await c.close();
  }
  /* v52 (lot D) : fonction supprimée — « clic depuis la formation verrouillée (jour 8) » */

  /* ---------- E. Téléphone : barre du bas et menu « Plus » ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, lea, db, { viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/#/decouverte`); await attendre(page, 2400);
    const barre = await page.$$eval("#barre-bas a", l => l.map(a => a.dataset.id)).catch(() => []);
    /* v52 (lot D) : accueil, calculateur, progression, Speed Formation */
    ok("prospect mobile (jour 2) : barre du bas = accueil, calculateur, progression, Speed Formation", JSON.stringify(barre) === '["accueil","calculateur","mensurations","formation"]', JSON.stringify(barre));
    ok("sur la Découverte (#/decouverte), « Accueil » est surligné (pas « Plus »)", !!(await page.$("#vue #dc-vue")) && (await page.$eval('#barre-bas a[data-id="accueil"]', a => a.getAttribute("aria-current")).catch(() => "")) === "page" && !(await page.$eval("#barre-bas [data-plus]", e => e.classList.contains("ici")).catch(() => true)));
    await page.click("#barre-bas [data-plus]").catch(() => {}); await attendre(page, 500);
    const plus = await page.$$eval(".menu-plus a", l => l.map(a => a.dataset.id)).catch(() => []);
    const plusCad = await page.$$eval(".menu-plus a .nav-cadenas", l => l.length).catch(() => 0);
    ok("prospect mobile : « Plus » = programme, journal, nutrition, suivi (avec cadenas) et profil (rien de caché, pas de Challenge)", JSON.stringify(plus) === '["programme","journal","nutrition","suivi","profil"]' && plusCad === 4, JSON.stringify(plus) + " cadenas " + plusCad);
    await page.screenshot({ path: path.join(OUT, "prospect-plus-mobile.png") });
    await page.click('.menu-plus a[data-id="suivi"]').catch(() => {}); await attendre(page, 1400);
    ok("un lien du menu « Plus » ferme le volet et ouvre la page (#/suivi verrouillée, « Plus » surligné)", !(await page.$(".volet")) && (await page.evaluate(() => location.hash)) === "#/suivi" && !!(await page.$("#vue .verrou")) && (await page.$eval("#barre-bas [data-plus]", e => e.classList.contains("ici")).catch(() => false)));
    await aller(page, "#/complements", 1400);   // v52 : Ma progression est ouverte ; page cachée : compléments
    const deb = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok("page cachée (#/complements) sur mobile : verrouillée, « Plus » ne s'allume pas, aucun débordement horizontal", !!(await page.$("#vue .verrou")) && !(await page.$eval("#barre-bas [data-plus]", e => e.classList.contains("ici")).catch(() => true)) && deb <= 0, "débordement " + deb);
    await page.screenshot({ path: path.join(OUT, "prospect-verrou-mobile.png") });
    ok("aucune écriture pendant la navigation mobile du prospect (barre du bas, menu « Plus », pages verrouillées)", db.ecritures.length === 0, JSON.stringify(db.ecritures.map(e => [e.table, e.user_id, e.outil])));
    await c.close();
  }
  /* v52 (lot D) : fonction supprimée — « prospect mobile (jour 8) : formation dans « Plus » » */
  {
    const db = base();
    const { c, page } = await contexte(b, thomas, db, { viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
    const barre = await page.$$eval("#barre-bas a", l => l.map(a => a.dataset.id)).catch(() => []);
    await page.click("#barre-bas [data-plus]").catch(() => {}); await attendre(page, 500);
    const plus = await page.$$eval(".menu-plus a", l => l.map(a => a.dataset.id)).catch(() => []);
    ok("client mobile : barre du bas et « Plus » inchangés (aucun cadenas, compléments et suivi présents)", barre.length === 4 && plus.includes("complements") && [].concat(barre, plus).includes("suivi") && (await page.$$(".menu-plus .nav-cadenas, #barre-bas .nav-cadenas")).length === 0, JSON.stringify({ barre, plus }));
    await c.close();
  }

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
function bilan(){ const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length; console.log(res.join("\n")); console.log(nb + "/" + tot); }
