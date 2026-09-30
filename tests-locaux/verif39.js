/* v39 — phase 15 : statut prospect / client (colonne profils.statut).
   Supabase simulé : la colonne statut existe (sauf option sansStatut), un compte
   créé par la base naît « prospect », seul le coach change un statut.
   Découverte (remplace le Challenge 7 jours) : tuile « Prospects en découverte » (prospects
   encore dans leurs 7 jours), inscription « Crée ton accès découverte » avec les deux cases
   (conditions + données de santé), arrivée du nouveau compte sur l'écran Découverte sans aucune
   écriture dans donnees (rien ne part avant un âge ≥ 18).
   v52 (chantier 1, lot A) : 7 vérifications reprises de la branche attente/nuit-28-09 (index.html les reprend aussi) :
   erreurs d'envoi d'email en français, jamais le texte brut de Supabase (inscription : serveur d'emails en panne,
   limite horaire, limite par adresse ; mot de passe oublié : panne, limite horaire), liens du changement d'adresse
   en deux temps (premier lien, dernier lien). Détails et variantes (anglais, connecté, Profil) : verif55 bloc B.
   v52 (chantier 1, lot B) : l'écran d'inscription change volontairement : « Crée ton espace gratuit » / « Gratuit pour
   toujours… » (plus de 7 jours), champ Nom obligatoire (« Indique ton nom. »), trois cases séparées (conditions, santé,
   newsletter facultative), métadonnées exactes (nom saisi, versions des accords, newsletter au lieu d'emails_suivi) ; le
   faux Supabase rend la session avec ses métadonnées, comme la vraie base : à l'arrivée, seule la copie de la newsletter
   (clé emails) est écrite. Détails : verif55 blocs E à H.
   v52 (lot B, décision de Lucas) : aucun email envoyé par l'app : « Mot de passe oublié » donne l'adresse du coach, sans appel.
   v55 : sante_version « 2026-09-28b » à l'inscription ; connexion, inscription ouverte : « Mot de passe oublié ? » et
   « Créer mon compte » centrés à 320, 375 et 390 px (côte à côte ou sur deux lignes), 1 vérification de plus (48).
   v64 (lot 5, brief V2 A) : l'inscription n'a plus qu'UNE case obligatoire, « J'ai 18 ans ou plus et j'accepte les CGU et la
   politique de confidentialité. » (deux liens vers les PDF de CONFIG.textes_legaux, point final collé au 2e lien), puis la
   newsletter (facultative) et « Rester connecté » ; plus de case santé (accord demandé au premier usage, partie B) : « case santé
   obligatoire » devient « plus de case ni de texte santé, un compte se crée sans elle » ; sous-titre A1, bouton « Créer mon
   espace gratuit » / « Create my free account » ; métadonnées : conditions_version = CONFIG.textes_legaux.cgu_version (servie
   « 2026-10-15 », LEGAUX_TEST ; distincte du texte court, 2026-10-01), newsletter_version « 2026-09-30 », plus de consentement_sante ni de sante_version ; en anglais,
   la case des conditions manquante (avant : la case santé). Même nombre de vérifications (48).
   Usage : node verif39.js ../index.html                                         */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const PORT = 9670;
let inscriptionLibre = false;
/* 52.1 : la retouche vaut pour la page et pour ses fichiers (inscription_libre est dans js/config.js) */
const { servirFichier, forcerInscription } = require("./fichiers");   // 52.1 : la page charge css/ et js/, servis depuis son dossier (fichiers.js)
/* v54 : l'inscription est ouverte dans le fichier (inscription_libre: true) ; la retouche FORCE la valeur voulue
   (inscriptionLibre, fermée par défaut comme avant), dans les deux sens : la suite reste valable si Lucas la referme.
   v55 : par forcerInscription (fichiers.js), comme toutes les suites qui testent l'inscription (les autres servent la valeur
   du fichier) */
/* v64 (lot 5, brief V2 A2) : les 3 emplacements CONFIG.textes_legaux (js/config.js, « à compléter » tant que Lucas ne les a
   pas remplis) servis avec des valeurs de test valides (liens Drive fictifs, jamais ouverts ; version postérieure au
   2026-09-30) le temps des blocs d'inscription (legaux = LEGAUX_TEST), sinon tels quels. Aucun test ne clique un lien PDF. */
const LEGAUX_TEST = { cgu_pdf: "https://drive.google.com/file/d/TEST-CGU/view", confidentialite_pdf: "https://drive.google.com/file/d/TEST-POLITIQUE/view", cgu_version: "2026-10-15" };   // v64 : version DISTINCTE du texte court (2026-10-01 depuis la v64, comme les PDF)
let legaux = null;
const poserLegaux = t => legaux ? t.replace(/\b(cgu_pdf|confidentialite_pdf|cgu_version): "[^"\n]*"/g, (x, k) => k + ": " + JSON.stringify(legaux[k])) : t;
const retouche = h => poserLegaux(forcerInscription(h, inscriptionLibre));
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML, retouche)) return;
  let h = retouche(fs.readFileSync(HTML, "utf8"));
  res.writeHead(200, { "Content-Type": "text/html" }); res.end(h);
});
const res = []; const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
/* v64 (lot 5, brief V2 A1 et A2) : sous-titre et case des conditions de l'inscription, FR et EN (textes du brief, mot pour mot) */
const SOUS_FR = "Gratuit, pour toujours : calculateur de calories, suivi de ton poids et de tes mensurations, et la Speed Formation avec ses vidéos, programmes et plans alimentaires.";
const SOUS_EN = "Free, forever: calorie calculator, weight and measurement tracking, and the Speed Formation course with its videos, workout programs and meal plans.";
const CGU_FR = "J'ai 18 ans ou plus et j'accepte les CGU et la politique de confidentialité.", CGU_EN = "I'm 18 or older and I accept the Terms of Use and the Privacy Policy.";
const PROSPECT = "00000000-0000-4000-8000-000000000c04", EQUIPE = "00000000-0000-4000-8000-0000000000e1", NOUVEAU = "00000000-0000-4000-8000-000000000c05";
/* instant « il y a n jours » (midi, heure locale) : les dates d'inscription suivent le jour du test.
   Léa s'est inscrite il y a 3 jours : jour 4/7 de sa Découverte, quel que soit le jour où la suite tourne. */
const ilYAIso = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d.toISOString(); };

function base(opts) {
  opts = opts || {};
  const profils = JSON.parse(JSON.stringify(F.profils)).concat([
    { id: PROSPECT, prenom: "Léa", nom: "Démo", role: "client", cree_le: ilYAIso(3) },
    { id: EQUIPE, prenom: "Équipe", nom: "Démo", role: "coach", cree_le: "2026-09-02T10:00:00Z" }
  ]);
  if (!opts.sansStatut) profils.forEach(p => { p.statut = p.id === PROSPECT ? "prospect" : "client"; });
  return { profils, donnees: JSON.parse(JSON.stringify(F.donnees)), patchs: [], fonctions: [], inscriptions: [], ecritures: [] };
}
async function contexte(b, who, db, opts) {
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || { width: 1280, height: 900 } });
  await c.route("**/*", async r => {
    const req = r.request(); const u = req.url();
    if (new URL(u).hostname === "localhost") return r.continue();
    if (!new URL(u).hostname.endsWith(".supabase.co")) return r.abort();
    const url = new URL(u); const p = url.pathname, q = url.searchParams, m = req.method();
    const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", body: body === null ? "" : JSON.stringify(body) });
    /* v56 : la connexion notée par la base (fonction noter_connexion, au démarrage de chaque compte client ou prospect) n'est
       pas une écriture de l'app dans les données : elle est testée à part (verif61) */
    if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
    if (p.startsWith("/auth/v1/signup")) {
      const corps = JSON.parse(req.postData() || "{}"); db.inscriptions.push(corps);
      if (opts.inscriptionKo) return json({ msg: "Signups not allowed for this instance" }, 422);
      if (opts.inscriptionErreur) return json({ msg: opts.inscriptionErreur.msg }, opts.inscriptionErreur.status);   // v52 : SMTP en panne, limites
      const id = "00000000-0000-4000-8000-00000000abcd";
      /* le declencheur de la base : profil avec prenom / nom, statut par defaut « prospect » */
      db.profils.push(Object.assign({ id, prenom: corps.data.prenom, nom: corps.data.nom, role: "client", cree_le: new Date().toISOString() }, "statut" in db.profils[0] ? { statut: "prospect" } : {}));
      /* v52 : comme la vraie base, la session rendue porte les métadonnées de l'inscription (user_metadata) */
      const sess = F.session(id, corps.email); sess.user.user_metadata = corps.data || {};
      return json(sess);
    }
    if (p.startsWith("/auth/v1/recover") && opts.recoverErreur) { db.oublis = (db.oublis || 0) + 1; return json({ msg: opts.recoverErreur.msg }, opts.recoverErreur.status); }
    if (p.startsWith("/auth/v1/recover")) { db.recover = (db.recover || 0) + 1; return json({}); }   // v52 : ne doit plus jamais être appelé
    if (p.startsWith("/auth/v1/token")) return json(who ? F.session(who.id, who.email) : { error: "invalid" }, who ? 200 : 400);
    if (p.startsWith("/auth/v1/")) return json({});
    if (p === "/functions/v1/creer-acces") {
      const corps = JSON.parse(req.postData() || "{}"); db.fonctions.push(corps);
      const role = corps.role === "coach" && !opts.equipeRefusee ? "coach" : "client";   // equipeRefusee : la base a refuse le role (la fonction renvoie le role reellement pose)
      db.profils.push(Object.assign({ id: NOUVEAU, prenom: corps.prenom, nom: corps.nom, role, cree_le: new Date().toISOString() }, "statut" in db.profils[0] ? { statut: "prospect" } : {}));
      return json({ id: NOUVEAU, email: corps.email, role });
    }
    if (p === "/rest/v1/profils") {
      if (m === "PATCH") {
        const id = (q.get("id") || "").slice(3); const corps = JSON.parse(req.postData() || "{}"); db.patchs.push({ id, corps });
        if (opts.patchKo) return json({ code: "P0001", message: "Seul un coach peut changer un rôle ou un statut." }, 400);
        const cible = db.profils.find(x => x.id === id);
        if (!cible) return json([], 200);
        if ("statut" in corps && !("statut" in cible)) return json({ code: "PGRST204", message: "Could not find the 'statut' column" }, 400);
        Object.assign(cible, corps);
        return json((req.headers()["prefer"] || "").includes("return=representation") ? [cible] : null, 200);
      }
      const id = q.get("id");
      if (!id && opts.listeKo) return r.abort();   // panne reseau simulee
      return json(id ? db.profils.filter(x => x.id === id.slice(3)) : db.profils);
    }
    if (p === "/rest/v1/donnees") {
      if (m !== "GET") {   /* toute écriture est notée (clé, compte), puis acceptée */
        let rows = []; try { rows = JSON.parse(req.postData() || "[]"); } catch (e) { }
        (Array.isArray(rows) ? rows : [rows]).forEach(row => db.ecritures.push({ table: "donnees", m, user_id: row && row.user_id, outil: row && row.outil }));
        if (!rows || (Array.isArray(rows) && !rows.length)) db.ecritures.push({ table: "donnees", m, filtre: url.search });
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
  /* un 500 simulé exprès (serveur d'emails en panne) fait écrire au navigateur « status of 500 » : attendu dans ces cas-là */
  const attendu500 = !!(opts && ((opts.inscriptionErreur && opts.inscriptionErreur.status >= 500) || (opts.recoverErreur && opts.recoverErreur.status >= 500)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of 4\d\d/.test(msg.text()) && !(attendu500 && /status of 5\d\d/.test(msg.text()))) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF"); d.dismiss(); });
  return { c, page };
}
const coach = { id: F.IDS.coach, email: "c@e.fr", session: F.session(F.IDS.coach, "c@e.fr") };
const attendre = (page, ms) => page.waitForTimeout(ms);
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1400); };
const ligneCompte = (page, nom) => page.locator("#liste-clients .client-l", { hasText: nom });
/* les tuiles du tableau de bord : libellé, valeur, sous-titre, lien */
const lireTuiles = page => page.$$eval("#tb-vue .tb-tuile", l => l.map(t => {
  const txt = sel => { const e = t.querySelector(sel); return e ? e.textContent.replace(/\s+/g, " ").trim() : ""; };
  return { lbl: txt(".t-lbl"), val: txt(".t-val"), sub: txt(".t-sub"), href: t.getAttribute("href") };
}));

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();

  /* ---------- A. Coach : prospects visibles, statut modifiable ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1800);
    /* v53 (chantier 4) : le tableau de bord n'a plus que 2 tuiles (Clients, Prospects) et « À traiter maintenant » : les
       vérifications de la tuile « Prospects en découverte » et de la section « Qui nécessite ton attention » sont retirées
       (2) ; les nouvelles tuiles et leurs urgences sont vérifiées par verif58 (bloc A). Le prospect reste sans alerte de
       suivi dans Mes clients (ci-dessous). */
    await aller(page, "#/clients", 1800);
    const ligne = await page.locator("#tb-clients tr", { hasText: "Léa Démo" }).textContent();
    ok("mes clients : pastille « prospect » sur la ligne de Léa", ligne.includes("prospect"));
    const feu = await page.locator("#tb-clients tr", { hasText: "Léa Démo" }).locator(".point").getAttribute("class");
    ok("mes clients : aucune alerte de suivi pour un prospect (feu vert)", /\bok\b/.test(feu), feu);
    const encadres = (await page.textContent("#alertes-clients")).replace(/\s+/g, " ");
    ok("mes clients : le prospect n'est pas dans les encadrés « Sans nouvelles… » / « Il manque quelque chose… »", !encadres.includes("Léa Démo") && encadres.includes("Julien Démo"), encadres.slice(0, 300));
    const compteLea = await ligneCompte(page, "Léa Démo").textContent();
    ok("comptes : Léa « prospect » avec « Passer client »", compteLea.includes("prospect") && compteLea.includes("Passer client"));
    const compteThomas = await ligneCompte(page, "Thomas Démo").textContent();
    ok("comptes : Thomas « client » avec « Repasser prospect »", compteThomas.includes("client") && compteThomas.includes("Repasser prospect"));
    ok("comptes : pas de bouton de statut pour un compte d'équipe", !(await ligneCompte(page, "Équipe Démo").textContent()).includes("Passer client"));
    await ligneCompte(page, "Thomas Démo").locator(".statut").click(); await attendre(page, 400);
    ok("repasser prospect : fenêtre de confirmation en rouge (danger)", await page.locator('.modale [data-ui-b="1"].danger').count() === 1);
    await page.click('.modale [data-ui-b="0"]'); await attendre(page, 300);
    /* annuler ne change rien ; confirmer passe Léa client, confirmé par la base */
    await ligneCompte(page, "Léa Démo").locator(".statut").click(); await attendre(page, 400);
    await page.click('.modale [data-ui-b="0"]'); await attendre(page, 400);
    ok("passer client : Annuler = aucune écriture", db.patchs.length === 0);
    await ligneCompte(page, "Léa Démo").locator(".statut").click(); await attendre(page, 400);
    await page.click('.modale [data-ui-b="1"]'); await attendre(page, 1500);
    ok("passer client : PATCH profils { statut: client } pour Léa, et la liste se met à jour", db.patchs.length === 1 && db.patchs[0].id === PROSPECT && db.patchs[0].corps.statut === "client" && (await ligneCompte(page, "Léa Démo").textContent()).includes("Repasser prospect"), JSON.stringify(db.patchs));
    /* bug corrigé : « Supprimer » sur un compte d'équipe n'ouvre plus une fiche */
    await ligneCompte(page, "Équipe Démo").locator(".suppr").click(); await attendre(page, 400);
    const apres = await page.evaluate(() => ({ h: location.hash, id: Store.idConsulte }));
    await page.click('.modale [data-ui-b="0"]').catch(() => {}); await attendre(page, 300);
    ok("supprimer un compte d'équipe : ne navigue pas vers une fiche (bug corrigé)", apres.h === "#/clients" && !apres.id, JSON.stringify(apres));
    /* fiche d'un prospect : pastille « prospect », pas d'alertes de suivi */
    await ligneCompte(page, "Léa Démo").locator(".statut").click(); await attendre(page, 300);
    await page.click('.modale [data-ui-b="1"]'); await attendre(page, 1200);   // Léa repasse prospect
    await page.evaluate(id => { Store.oublier(Store.idConsulte); Store.idConsulte = id; Store.nomConsulte = "Léa Démo"; location.hash = "#/accueil"; }, PROSPECT); await attendre(page, 1800);
    const ficheLea = (await page.textContent("#vue")).replace(/\s+/g, " ");
    ok("fiche d'un prospect : pastille « prospect », « Compte gratuit », aucune alerte de suivi", ficheLea.includes("prospect") && ficheLea.includes("Compte gratuit") && await page.locator("#vue .attention-alertes").count() === 0, ficheLea.slice(0, 250));
    await aller(page, "#/clients", 1500);   // meme ancre #/accueil : il faut en sortir pour changer de fiche
    await page.evaluate(id => { Store.oublier(Store.idConsulte); Store.idConsulte = id; Store.nomConsulte = "Julien Démo"; location.hash = "#/accueil"; }, F.IDS.c3); await attendre(page, 1800);
    ok("fiche d'un client : alertes de suivi toujours là", await page.locator("#vue .attention-alertes").count() === 1);
    await page.evaluate(() => { Store.oublier(Store.idConsulte); Store.idConsulte = null; Store.nomConsulte = null; location.hash = "#/clients"; }); await attendre(page, 1800);
    /* creation d'un acces : nait prospect en base, passe client tout de suite */
    await page.fill("#n-prenom", "Nina"); await page.fill("#n-nom", "Démo"); await page.fill("#n-email", "nina@exemple.fr"); await page.fill("#n-mdp", "motdepasse1");
    await page.click("#n-creer"); await attendre(page, 1500);
    ok("créer un accès : puis statut « client » posé tout de suite", db.fonctions.length === 1 && db.patchs.some(x => x.id === NOUVEAU && x.corps.statut === "client") && db.profils.find(x => x.id === NOUVEAU).statut === "client");
    ok("créer un accès : message « Compte créé »", (await page.textContent("#n-msg")).includes("Compte créé"));
    await c.close();
  }
  /* v53 (chantier 4) : tuile « Prospects en découverte » retirée (plus de limite de 7 jours, 2 tuiles Clients et Prospects) :
     le bloc qui en vérifiait les jours 7 / 8 / 11 et le sous-titre « 1 chaud · 4 prospects au total » est retiré (1). */
  {
    /* le passage en client echoue : le coach le sait */
    const db = base();
    const { c, page } = await contexte(b, coach, db, { patchKo: true });
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2000);
    await page.fill("#n-prenom", "Nina"); await page.fill("#n-email", "nina@exemple.fr"); await page.fill("#n-mdp", "motdepasse1");
    await page.click("#n-creer"); await attendre(page, 1500);
    ok("créer un accès, statut refusé : message « encore prospect … Passer client »", (await page.textContent("#n-msg")).includes("encore « prospect »"));
    ok("créer un accès, statut refusé : une fenêtre le dit aussi (le message ne s'efface pas)", (await page.textContent(".modale").catch(() => "")).includes("encore « prospect »"));
    await page.click('.modale [data-ui-b]').catch(() => {}); await attendre(page, 300);
    /* le bouton de statut qui echoue retrouve son libelle */
    await ligneCompte(page, "Léa Démo").locator(".statut").click(); await attendre(page, 300);
    await page.click('.modale [data-ui-b="1"]'); await attendre(page, 1000);
    await page.click('.modale [data-ui-b]').catch(() => {}); await attendre(page, 300);
    const bst = ligneCompte(page, "Léa Démo").locator(".statut");
    ok("passer client refusé : le bouton retrouve « Passer client »", (await bst.textContent()) === "Passer client" && !(await bst.isDisabled()));
    await c.close();
  }
  {
    /* la liste des comptes n'a pas pu se charger : le statut est quand meme pose apres une creation */
    const db = base();
    const { c, page } = await contexte(b, coach, db, { listeKo: true });
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2000);
    await page.fill("#n-prenom", "Nina"); await page.fill("#n-email", "nina@exemple.fr"); await page.fill("#n-mdp", "motdepasse1");
    await page.click("#n-creer"); await attendre(page, 1500);
    ok("liste en panne : la création pose quand même le statut « client »", db.fonctions.length === 1 && db.patchs.some(x => x.id === NOUVEAU && x.corps.statut === "client") && db.profils.find(x => x.id === NOUVEAU).statut === "client", JSON.stringify(db.patchs));
    await c.close();
  }
  {
    /* acces d'equipe demande, mais la base ne l'a pas accorde : le coach le sait */
    const db = base();
    const { c, page } = await contexte(b, coach, db, { equipeRefusee: true });
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2000);
    await page.fill("#n-prenom", "Eva"); await page.fill("#n-email", "eva@exemple.fr"); await page.fill("#n-mdp", "motdepasse1");
    await page.selectOption("#n-type", "coach"); await attendre(page, 200);
    await page.click("#n-creer"); await attendre(page, 500);
    await page.click('.modale [data-ui-b="1"]').catch(() => {}); await attendre(page, 1500);   // confirmation « Donner l'accès »
    const fen = await page.textContent(".modale").catch(() => "");
    ok("accès d'équipe refusé par la base : fenêtre « sans l'accès complet » et message", fen.includes("sans l'accès complet") && (await page.textContent("#n-msg")).includes("sans l'accès complet"), fen.slice(0, 120));
    await c.close();
  }
  {
    /* base sans colonne statut (avant migration) : rien ne change */
    const db = base({ sansStatut: true });
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1800);
    /* comportement inchangé : sans statut, aucun prospect (la tuile est cherchée par le début de son libellé) */
    const tSans = (await lireTuiles(page)).find(x => /^Prospects/.test(x.lbl)) || {};
    ok("sans colonne statut : tuile des prospects = 0", tSans.val === "0", JSON.stringify(tSans));
    await aller(page, "#/clients", 1800);
    ok("sans colonne statut : ni pastille ni bouton de statut", !(await page.textContent("#liste-clients")).includes("Passer client") && !(await page.textContent("#liste-clients")).includes("Repasser prospect"));
    await page.fill("#n-prenom", "Nina"); await page.fill("#n-email", "nina@exemple.fr"); await page.fill("#n-mdp", "motdepasse1");
    await page.click("#n-creer"); await attendre(page, 1500);
    const msgSans = await page.textContent("#n-msg");
    ok("sans colonne statut : création réussie, statut sans objet (PGRST204 ignoré), aucune alerte", db.fonctions.length === 1 && db.patchs.length === 1 && !("statut" in db.profils.find(x => x.id === NOUVEAU)) && msgSans.includes("Compte créé") && !msgSans.includes("prospect") && await page.locator(".modale").count() === 0, msgSans + " " + JSON.stringify(db.patchs));
    await c.close();
  }
  {
    /* Auth.estProspect */
    const db = base();
    const lea = { id: PROSPECT, email: "l@e.fr", session: F.session(PROSPECT, "l@e.fr") };
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1800);
    ok("Auth.estProspect() vrai pour un prospect", await page.evaluate(() => Auth.estProspect()));
    await c.close();
    const { c: c2, page: p2 } = await contexte(b, { id: F.IDS.c1, email: "t@e.fr", session: F.session(F.IDS.c1, "t@e.fr") }, base());
    await p2.goto(`http://localhost:${PORT}/`); await attendre(p2, 1800);
    ok("Auth.estProspect() faux pour un client", !(await p2.evaluate(() => Auth.estProspect())));
    await c2.close();
  }

  /* ---------- B. Inscription libre ---------- */
  {
    inscriptionLibre = false;
    const db = base();
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/#/inscription`); await attendre(page, 1200);
    const t = await page.textContent("body");
    ok("inscription fermée : pas de « Créer mon compte », #/inscription ouvre la connexion", !t.includes("Créer mon compte") && t.includes("Connexion à ton espace"));
    await c.close();
  }
  {
    inscriptionLibre = true; legaux = LEGAUX_TEST;   // v64 : liens et version des CGU de test (CONFIG.textes_legaux)
    const db = base();
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1200);
    ok("inscription ouverte : bouton « Créer mon compte » sur la connexion", !!(await page.$('[data-mode="inscription"]')));
    await page.click('[data-mode="inscription"]'); await attendre(page, 400);
    const ecran = await page.evaluate(() => { const q = s => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, " ").trim() : ""; };
      const cas = id => { const e = document.getElementById(id); return e ? (e.checked ? "cochée" : "vide") : "absente"; };
      /* v64 : le texte de la case des conditions, et le nœud qui suit le 2e lien (« politique de confidentialité ») : il
         commence par le point final, sans espace (le point ne tombe plus seul sous le lien) */
      const lab = document.querySelector("label.co-cgu > span"), l2 = document.getElementById("c-politique-lien");
      return { titre: q(".carte-co h2"), sous: q(".carte-co .co-sous"), bouton: q("#c-go"), cases: ["c-cgu", "c-sante", "c-newsletter", "c-rester"].map(cas), cocher: [...document.querySelectorAll(".carte-co input[type=checkbox]")].map(i => i.id),
        cgu: lab ? lab.textContent.replace(/\s+/g, " ").trim() : "", point: !!(l2 && l2.nextSibling && l2.nextSibling.nodeType === 3 && l2.nextSibling.textContent.startsWith(".")), nom: !!document.getElementById("c-nom"), challenge: document.body.textContent.includes("Challenge") }; });
    /* v52 (lot B) : plus de « 7 jours » ; titre et sous-titre de l'espace gratuit. v64 (brief V2 A1, A6) : sous-titre et bouton */
    ok("inscription : titre « Crée ton espace gratuit », sous-titre « Gratuit, pour toujours : … et la Speed Formation avec ses vidéos, programmes et plans alimentaires. », bouton « Créer mon espace gratuit », plus aucun « Challenge » ni « 7 jours »", ecran.titre === "Crée ton espace gratuit" && ecran.sous === SOUS_FR && ecran.bouton === "Créer mon espace gratuit" && !ecran.challenge && !/7 jours/.test(ecran.sous), JSON.stringify(ecran));
    /* v52 (lot B) : cases séparées, aucune cochée d'avance, et le champ Nom. v64 (brief V2 A) : UNE seule case obligatoire
       (conditions, son texte exact, point collé au 2e lien), la newsletter, « Rester connecté » (coché) ; plus de case santé */
    ok("inscription : une seule case obligatoire, conditions (#c-cgu, « J'ai 18 ans ou plus et j'accepte les CGU et la politique de confidentialité. », point final collé au lien), puis newsletter (#c-newsletter), toutes deux vides ; plus de case santé (#c-sante absente) ; « Rester connecté » coché ; champ Nom (#c-nom)", JSON.stringify(ecran.cases) === '["vide","absente","vide","cochée"]' && JSON.stringify(ecran.cocher) === '["c-cgu","c-newsletter","c-rester"]' && ecran.cgu === CGU_FR && ecran.point && ecran.nom, JSON.stringify(ecran));
    await page.fill("#c-email", "nouvelle@exemple.fr"); await page.fill("#c-mdp", "court");
    await page.click("#c-go"); await attendre(page, 300);
    ok("inscription : prénom obligatoire", (await page.textContent("#co-err")).includes("prénom"));
    await page.fill("#c-prenom", "Zoé");
    await page.click("#c-go"); await attendre(page, 300);
    /* v52 (lot B) : le nom est obligatoire */
    ok("inscription : nom obligatoire (« Indique ton nom. »)", (await page.textContent("#co-err")).includes("Indique ton nom.") && db.inscriptions.length === 0, await page.textContent("#co-err"));
    await page.fill("#c-nom", "Martin");
    await page.click("#c-go"); await attendre(page, 300);
    ok("inscription : 8 caractères minimum", (await page.textContent("#co-err")).includes("8 caractères"));
    await page.fill("#c-mdp", "motdepasse1");
    await page.click("#c-go"); await attendre(page, 300);
    ok("inscription : la case des conditions est obligatoire (v44)", (await page.textContent("#co-err")).includes("Coche la case") && db.inscriptions.length === 0);
    /* v64 (brief V2 A3) : plus de case santé (avant, P0.5 : case obligatoire, « …données de santé… » au clic) : ni case, ni
       texte santé à l'écran, ni texte santé dans DECOUVERTE.inscription (FR et EN) ; la case des conditions cochée suffit */
    const sante = await page.evaluate(() => ({ cases: ["c-sante"].filter(id => document.getElementById(id)).concat(document.querySelector(".co-sante") ? [".co-sante"] : []),
      texte: /données de santé|health data/i.test((document.querySelector(".carte-co") || document.body).textContent),
      cles: ["sante_avant", "sante_manque"].filter(k => (k in (DECOUVERTE.inscription || {})) || (k in ((DECOUVERTE.en || {}).inscription || {}))) })).catch(e => ({ erreur: String(e) }));
    /* version des conditions attendue (v64, brief V2 A2 et K) : celle des CGU en PDF, CONFIG.textes_legaux.cgu_version (servie :
       LEGAUX_TEST), reprise par DECOUVERTE.accords.conditions ; avant : la version du texte court (confidentialite.version) */
    const version = await page.evaluate(() => ({ cgu: (CONFIG.textes_legaux || {}).cgu_version, accords: (DECOUVERTE.accords || {}).conditions, court: (DECOUVERTE.confidentialite || {}).version })).catch(e => ({ erreur: String(e) }));
    await page.check("#c-cgu");
    await page.click("#c-go"); await attendre(page, 2500);
    ok("inscription : plus de case ni de texte santé (#c-sante absente, aucun « données de santé » à l'écran, sante_avant / sante_manque retirés des textes FR et EN) ; la case des conditions cochée suffit, un compte se crée sans accord santé (v64, brief V2 A3 ; avant : case santé obligatoire, P0.5)",
      !!sante.cles && sante.cases.length === 0 && sante.texte === false && sante.cles.length === 0 && db.inscriptions.length === 1, JSON.stringify(sante) + " · inscriptions envoyées : " + db.inscriptions.length);
    const ins = db.inscriptions[0] || {}, md = ins.data || {}, isoRe = /^\d{4}-\d{2}-\d{2}T/;
    /* v52 (lot B) : le nom saisi (plus « » vide), chaque accord daté ET versionné, newsletter (null si la case est vide) au lieu d'emails_suivi.
       v64 (brief V2 A) : EXACTEMENT prenom, nom, consentement, conditions_version (= CONFIG.textes_legaux.cgu_version), newsletter,
       newsletter_version (« 2026-09-30 », texte A4) ; plus de consentement_sante ni de sante_version (accord au premier usage) */
    ok("inscription : POST /auth/v1/signup avec prénom et nom, consentement daté + version des CGU (CONFIG.textes_legaux.cgu_version, « 2026-10-15 » servie, = DECOUVERTE.accords.conditions, ≠ version du texte court), newsletter null (case vide) + version « 2026-09-30 », aucun accord santé (ni consentement_sante ni sante_version), plus d'emails_suivi (v44, v52, v64)",
      db.inscriptions.length === 1 && md.prenom === "Zoé" && md.nom === "Martin" && isoRe.test(md.consentement || "") && version.cgu === LEGAUX_TEST.cgu_version && version.accords === LEGAUX_TEST.cgu_version && md.conditions_version === LEGAUX_TEST.cgu_version && !!version.court && md.conditions_version !== version.court
      && md.newsletter === null && md.newsletter_version === "2026-09-30" && Object.keys(md).sort().join(",") === "conditions_version,consentement,newsletter,newsletter_version,nom,prenom" && ins.email === "nouvelle@exemple.fr",
      db.inscriptions.length + " " + JSON.stringify(md) + " attendu " + JSON.stringify(version));
    ok("inscription : connecté ensuite, et prospect", await page.evaluate(() => Auth.connecte() && Auth.estProspect()).catch(() => false));
    /* le compte neuf arrive sur la Découverte au jour 1, questionnaire court à remplir, pas encore de bouton Calendly */
    const arrivee = await page.evaluate(() => { const z = document.querySelector("#dc-vue, #acc-vue");
      return { h: location.hash, t: z ? z.textContent.replace(/\s+/g, " ") : "", age: !!document.getElementById("q-probleme"), voir: !!document.getElementById("dc-voir"), cal: z ? z.querySelectorAll('a[href*="calendly"], [data-dc-cal]').length : -1 }; }).catch(e => ({ erreur: String(e) }));
    /* v52 (Chantier 1 lot C) : les 3 questions, sans âge (#q-probleme ; avant : #q-age) */
    /* v52 (lot D) : « Découverte » sans « Jour n/7 » (gratuit pour toujours) */
    ok("inscription : arrivée sur la Découverte (sans « Jour n/7 »), questionnaire court (#q-probleme, #dc-voir), aucun bouton Calendly", /^ ?Découverte Bonjour/.test(arrivee.t || "") && !/Jour \d/.test(arrivee.t || "") && arrivee.age && arrivee.voir && arrivee.cal === 0, JSON.stringify(arrivee).slice(0, 250));
    /* rien ne part dans donnees avant la saisie d'un âge ≥ 18 : ni brouillon intake, ni clé challenge écrite au démarrage.
       v52 (lot B) : la seule écriture est la copie du choix de la newsletter dans la clé emails (première ouverture) */
    const ecrArrivee = db.ecritures.filter(e => e.table === "donnees");
    ok("inscription : à l'arrivée du compte neuf, une seule écriture dans donnees, la copie de la newsletter (clé emails) ; ni brouillon intake, ni clé challenge", ecrArrivee.length === 1 && ecrArrivee[0].outil === "emails", JSON.stringify(ecrArrivee).slice(0, 250));
    await c.close();
    legaux = null;
  }
  {
    inscriptionLibre = true;
    const db = base();
    const { c, page } = await contexte(b, null, db, { inscriptionKo: true, langue: "en" });
    await page.goto(`http://localhost:${PORT}/#/inscription`); await attendre(page, 1200);
    const t = await page.textContent("body");
    /* v52 (lot B) : espace gratuit, plus de 7 jours ; champ « Your last name ». v64 (brief V2 A1, A2, A6) : sous-titre, case
       des conditions « I'm 18 or older… », « Create my free account », plus aucun « health data » */
    const cguEn = await page.$eval("label.co-cgu > span", s => s.textContent.replace(/\s+/g, " ").trim()).catch(() => "");
    ok("inscription en anglais : « Create your free space », sous-titre « Free, forever: … and the Speed Formation course with its videos, workout programs and meal plans. », « Your first name », « Your last name », case « I'm 18 or older and I accept the Terms of Use and the Privacy Policy. », « Create my free account », plus aucun « health data », « Challenge » ni « 7 days »", t.includes("Create your free space") && t.includes(SOUS_EN) && !t.includes("7 days") && t.includes("Your first name") && t.includes("Your last name") && cguEn === CGU_EN && t.includes("Create my free account") && !/health data/i.test(t) && !t.includes("Challenge"), cguEn + " · " + t.replace(/\s+/g, " ").slice(0, 250));
    /* v64 (brief V2 A) : la seule case obligatoire est celle des conditions (avant : la case santé manquante → « Accept the
       processing of your health data ») : sans elle, « Tick the terms box to continue. » et rien n'est envoyé */
    await page.fill("#c-prenom", "Zoé"); await page.fill("#c-nom", "Martin"); await page.fill("#c-email", "z@exemple.fr"); await page.fill("#c-mdp", "motdepasse1");
    await page.click("#c-go"); await attendre(page, 300);
    const santeEn = !!(await page.$("#c-sante"));
    ok("inscription en anglais : case des conditions manquante → « Tick the terms box to continue. », rien n'est envoyé ; c'est la seule case obligatoire (plus de case santé, #c-sante absente)", (await page.textContent("#co-err")).trim() === "Tick the terms box to continue." && db.inscriptions.length === 0 && !santeEn, await page.textContent("#co-err") + " · #c-sante " + (santeEn ? "présente" : "absente"));
    await page.check("#c-cgu");
    await page.click("#c-go"); await attendre(page, 800);
    ok("inscription refusée par Supabase : « Sign-ups are not open yet. »", (await page.textContent("#co-err")).includes("Sign-ups are not open yet"));
    await c.close();
  }
  /* v52 (reprise de la nuit du 28/09) : erreurs d'envoi d'email (SMTP Brevo en panne, limite horaire du projet) : jamais l'anglais brut */
  for (const [quoi, err, attendu] of [
    ["serveur d'emails en panne", { status: 500, msg: "Error sending confirmation email" }, "L'email n'a pas pu partir (souci de notre côté). Réessaie dans un moment ; si ça continue, écris-moi sur Instagram (@lucasmhxcoaching)."],
    ["limite horaire d'emails du projet", { status: 429, msg: "email rate limit exceeded" }, "Beaucoup d'inscriptions en ce moment : réessaie dans une heure."],
    ["limite par adresse (inchangée)", { status: 429, msg: "For security purposes, you can only request this after 42 seconds." }, "Trop de demandes d'un coup : réessaie dans une minute."]]) {
    inscriptionLibre = true;
    const db = base();
    const { c, page } = await contexte(b, null, db, { inscriptionErreur: err });
    await page.goto(`http://localhost:${PORT}/#/inscription`); await attendre(page, 1200);
    await page.fill("#c-prenom", "Zoé"); await page.fill("#c-nom", "Martin"); await page.fill("#c-email", "z@exemple.fr"); await page.fill("#c-mdp", "motdepasse1"); await page.check("#c-cgu");   // v64 : plus de case santé
    await page.click("#c-go"); await attendre(page, 800);
    const t = await page.textContent("#co-err");
    ok("inscription, " + quoi + " (« " + err.msg + " ») : message en français, jamais le texte anglais brut", t.includes(attendu) && !t.includes(err.msg), t);
    await c.close();
  }
  /* v55 : écran de connexion, inscription ouverte : « Mot de passe oublié ? » et « Créer mon compte » bien placés sur
     téléphone. La v54 avait mis un margin-left de 18 px sur le second lien : côte à côte, un espace ; mais à 320 px, où les
     deux liens passent sur deux lignes, le second restait décalé de 9 px vers la droite, à 4 px sous le premier. v55
     (css/communs.css) : une marge égale autour de chaque lien. Vérifié sans dépendre de la police (celle de GitHub peut
     différer, les liens peuvent donc tenir ou non sur une ligne) : côte à côte (hauts à moins de 3 px l'un de l'autre) →
     12 à 24 px entre les deux et la paire centrée dans .bascule à 3 px près ; sur deux lignes (le second commence au moins
     6 px sous le bas du premier) → chacun centré à 3 px près. Une seule vérification pour les trois largeurs. */
  inscriptionLibre = true;
  try {
    const mesures = [];
    try {
      for (const largeur of [320, 375, 390]) {
        const { c, page } = await contexte(b, null, base(), { viewport: { width: largeur, height: 800 } });
        try {
          await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.bascule [data-mode="inscription"]', { timeout: 8000 }); await attendre(page, 600);
          mesures.push(await page.evaluate(() => {
            const bas = document.querySelector(".bascule"), bs = bas ? Array.from(bas.querySelectorAll("button")) : [];
            if (bs.length !== 2) return { largeur: innerWidth, erreur: bs.length + " lien(s) dans .bascule", bon: false };
            const B = bas.getBoundingClientRect(), [a, z] = bs.map(e => e.getBoundingClientRect());
            const centre = r => (r.left + r.right) / 2, cB = centre(B), arr = x => Math.round(x * 10) / 10;
            const liens = bs.map(e => e.textContent.trim());
            const ligne = Math.abs(a.top - z.top) < 3, deuxLignes = z.top >= a.bottom + 6;
            const ecart = z.left - a.right, decalPaire = (a.left + z.right) / 2 - cB, decal = [centre(a) - cB, centre(z) - cB];
            const place = ligne ? ecart >= 12 && ecart <= 24 && Math.abs(decalPaire) <= 3 : deuxLignes && decal.every(d => Math.abs(d) <= 3);
            return { largeur: innerWidth, liens, disposition: ligne ? "côte à côte" : deuxLignes ? "deux lignes" : "ni l'un ni l'autre",
              ecart: arr(ecart), dessous: arr(z.top - a.bottom), decalPaire: arr(decalPaire), decal: decal.map(arr),
              bon: liens[0] === "Mot de passe oublié ?" && liens[1] === "Créer mon compte" && place };
          }));
        } finally { await c.close(); }
      }
    } catch (e) { mesures.push({ erreur: String((e && e.message) || e).split("\n")[0].slice(0, 160), bon: false }); }
    ok("connexion, inscription ouverte, téléphone 320 / 375 / 390 px : « Mot de passe oublié ? » et « Créer mon compte » côte à côte (12 à 24 px entre les deux, paire centrée à 3 px près) ou sur deux lignes (au moins 6 px entre les deux, chacun centré à 3 px près)",
      mesures.length === 3 && mesures.every(m => m.bon), JSON.stringify(mesures));
  } finally { inscriptionLibre = false; }
  inscriptionLibre = false;
  /* v52 (chantier 1, lot B — décision de Lucas : l'app n'envoie aucun email pour l'instant) : « Mot de passe oublié » ne
     demande plus de lien ; il donne l'adresse du coach (mailto), sans appel à /auth/v1/recover. Les deux vérifications
     des erreurs d'envoi du mot de passe oublié (panne, limite horaire) sont remplacées par celles-ci. */
  for (const langue of ["", "en"]) {
    const db = base();
    const { c, page } = await contexte(b, null, db, { langue });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1000);
    await page.click('[data-mode="oubli"]'); await attendre(page, 400);
    await page.keyboard.press("Enter"); await attendre(page, 800);
    const t = (await page.textContent("#co-oubli").catch(() => "")).replace(/\s+/g, " ").trim();
    const href = await page.getAttribute("#co-oubli a", "href").catch(() => "");
    const att = langue ? "Write to us at mhx.coaching@gmail.com, we'll get you back in quickly." : "Écris-nous à mhx.coaching@gmail.com, on te débloque rapidement.";
    ok(`mot de passe oublié${langue ? " (anglais)" : ""} : « ${att} » (mailto), ni champ ni bouton d'envoi, aucun appel à /auth/v1/recover (même avec Entrée)`, t === att && href === "mailto:mhx.coaching@gmail.com" && !(await page.$("#c-email")) && !(await page.$("#c-go")) && !db.recover, t + " · " + href + " · appels recover " + (db.recover || 0));
    await c.close();
  }
  {
    /* changement d'adresse : le DERNIER lien revient avec #access_token=…&type=email_change — le changement est fait */
    const db = base();
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/#access_token=abc.def.ghi&expires_in=3600&refresh_token=xyz&token_type=bearer&type=email_change`); await attendre(page, 1200);
    const t = await page.textContent("#co-err").catch(() => "");
    ok("changement d'adresse, dernier lien cliqué (déconnecté) : « Ton adresse email est changée : utilise la nouvelle pour te connecter. », jetons retirés de l'adresse", t.includes("Ton adresse email est changée : utilise la nouvelle pour te connecter.") && !/access_token/.test(page.url()), t + " · " + page.url());
    await c.close();
  }
  {
    /* changement d'adresse (« Secure email change ») : le PREMIER des deux liens revient sans jeton, avec #message=… */
    const db = base();
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/#message=Confirmation+link+accepted.++Please+proceed+to+confirm+link+sent+to+the+other+email`); await attendre(page, 1200);
    const t = await page.textContent("#co-err").catch(() => "");
    ok("changement d'adresse, premier lien cliqué (déconnecté) : « Premier lien accepté : clique maintenant celui reçu sur ton autre adresse… », adresse nettoyée, jamais l'anglais", t.includes("Premier lien accepté : clique maintenant celui reçu sur ton autre adresse.") && !/Confirmation link accepted/.test(await page.textContent("body")) && !/message=/.test(page.url()), t + " · " + page.url());
    await c.close();
  }
  await b.close(); server.close(); console.log(res.join("\n"));
})();
