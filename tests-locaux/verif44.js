/* v44 — funnel « Challenge 7 jours » : inscription simplifiée (prénom, email, mot de
   passe, case des conditions + volet), clé client « challenge », jour 1 (diagnostic →
   intake + challenge), déblocage un jour par jour calendaire avec rattrapage, mode test
   (#/challenge-libre), hub du prospect, démarrage sans questionnaire forcé, profil
   allégé, Speed Formation verrouillée jusqu'au jour 7, client et coach inchangés.
   Supabase simulé : rien ne part vers la vraie base ; les écritures sont appliquées en
   mémoire pour que les relectures les voient.
   Usage : node verif44.js ../index.html                                          */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const PORT = 9674;
const OUT = path.join(__dirname, "captures", "v44"); fs.mkdirSync(OUT, { recursive: true });
let inscriptionLibre = false;
const server = http.createServer((req, res) => {
  let h = fs.readFileSync(HTML, "utf8");
  if (inscriptionLibre) h = h.replace("inscription_libre: false", "inscription_libre: true");
  res.writeHead(200, { "Content-Type": "text/html" }); res.end(h);
});
const res = []; const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
const PROSPECT = "00000000-0000-4000-8000-000000000c04";
const CAL = "https://calendly.com/mhx-coaching/30min";
const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const ilYA = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return iso(d); };
const AUJ = ilYA(0);
const INTAKE = { sexe: "Femme", age: "29", taille: "168", poids: "64", poids_obj: "60", objectif: "Perte de poids / sèche", niveau: "Débutant (0 à 6 mois)", seances: "3", lieu: "À la maison", nb_repas: "3 repas", sommeil_h: "6.5", energie: "4" };
const jourFait = (n, quand) => ({ fait: quand + "T08:00:00.000Z", date: quand });
const chJ1 = (debut) => ({ version: 1, debut, jours: { "1": jourFait(1, debut) }, cta: { clics: [] }, termine: null });
const chFini = () => { const j = {}; for (let n = 1; n <= 7; n++) j[String(n)] = jourFait(n, ilYA(8 - n)); return { version: 1, debut: ilYA(7), jours: j, cta: { clics: [] }, termine: ilYA(1) + "T09:00:00.000Z" }; };

function base(opts){
  opts = opts || {};
  const profils = JSON.parse(JSON.stringify(F.profils)).concat([{ id: PROSPECT, prenom: "Léa", nom: "", role: "client", cree_le: "2026-09-24T10:00:00Z" }]);
  profils.forEach(p => { p.statut = p.id === PROSPECT ? "prospect" : "client"; });
  const donnees = JSON.parse(JSON.stringify(F.donnees));
  if (opts.challenge) donnees.push({ user_id: PROSPECT, outil: "challenge", contenu: opts.challenge, maj_le: "2026-09-24T10:00:00+00:00" });
  if (opts.intake) donnees.push({ user_id: PROSPECT, outil: "intake", contenu: opts.intake, maj_le: "2026-09-24T10:00:00+00:00" });
  if (opts.prefs) donnees.push({ user_id: PROSPECT, outil: "prefs", contenu: opts.prefs, maj_le: "2026-09-24T10:00:00+00:00" });
  return { profils, donnees, ecritures: [], inscriptions: [] };
}
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || { width: 1280, height: 900 } });
  c.setDefaultTimeout(6000);   // un élément absent fait échouer vite (la suite doit rendre un score, même sur une vieille version)
  await c.route("**/*", async r => {
    const req = r.request(); const u = req.url(); const host = new URL(u).hostname;
    if (host === "localhost") return r.continue();
    if (!host.endsWith(".supabase.co")) return r.abort();
    const url = new URL(u); const p = url.pathname, q = url.searchParams, m = req.method();
    const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", body: body === null ? "" : JSON.stringify(body) });
    if (p.startsWith("/auth/v1/signup")) {
      const corps = JSON.parse(req.postData() || "{}"); db.inscriptions.push(corps);
      const id = "00000000-0000-4000-8000-00000000abcd";
      db.profils.push({ id, prenom: (corps.data || {}).prenom, nom: (corps.data || {}).nom, role: "client", statut: "prospect", cree_le: new Date().toISOString() });
      return json(F.session(id, corps.email));
    }
    if (p.startsWith("/auth/v1/token")) return json(who ? F.session(who.id, who.email) : { error: "invalid" }, who ? 200 : 400);
    if (p.startsWith("/auth/v1/")) return json({});
    if (p === "/rest/v1/profils") {
      if (m !== "GET") { db.ecritures.push({ table: "profils", m }); return json(null, 204); }
      const id = q.get("id"); return json(id ? db.profils.filter(x => x.id === id.slice(3)) : db.profils);
    }
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
  await c.addInitScript(({ s, langue, libre }) => {
    if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
    localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
    if (langue) localStorage.setItem("mhx_langue", langue);
    if (libre) localStorage.setItem("mhx_challenge_libre", "1");
  }, { s: who ? who.session : null, langue: opts.langue || "", libre: !!opts.libre });
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of 4\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF"); d.dismiss(); });
  return { c, page };
}
const coach = { id: F.IDS.coach, email: "c@e.fr", session: F.session(F.IDS.coach, "c@e.fr") };
const lea = { id: PROSPECT, email: "l@e.fr", session: F.session(PROSPECT, "l@e.fr") };
const thomas = { id: F.IDS.c1, email: "t@e.fr", session: F.session(F.IDS.c1, "t@e.fr") };
const attendre = (page, ms) => page.waitForTimeout(ms);
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1400); };
const texte = (page, sel) => page.textContent(sel || "#vue").catch(() => "");
const ecrituresDe = (db, outil) => db.ecritures.filter(e => e.table === "donnees" && e.outil === outil);

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();
  let pagesProspect = "";

  /* ---------- A. Inscription simplifiée ---------- */
  {
    inscriptionLibre = true;
    const db = base();
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/#/inscription`); await attendre(page, 1200);
    const t = await texte(page, "body");
    ok("inscription : titre « Rejoins le Challenge 7 jours », bouton « Commencer le challenge »", t.includes("Rejoins le Challenge 7 jours") && (await texte(page, "#c-go")).includes("Commencer le challenge"));
    ok("inscription : prénom, email, mot de passe, case des conditions — ni nom ni confirmation", !!(await page.$("#c-prenom")) && !!(await page.$("#c-email")) && !!(await page.$("#c-mdp")) && !!(await page.$("#c-cgu")) && !(await page.$("#c-nom")) && !(await page.$("#c-mdp2")));
    ok("inscription : note « ne remplace pas un avis médical », aucun prix", t.includes("ne remplace pas un avis médical") && !/€|\bprix\b|tarif/i.test(t));
    await page.click("#c-cgu-lien"); await attendre(page, 400);
    const volet = await texte(page, ".volet");
    ok("inscription : le lien des conditions ouvre le volet (Conditions d'utilisation et confidentialité, droits, hébergement)", volet.includes("Conditions d'utilisation et confidentialité") && volet.includes("Tes droits") && volet.includes("Supabase"));
    ok("inscription : cliquer le lien ne coche pas la case", !(await page.isChecked("#c-cgu")));
    await page.keyboard.press("Escape"); await attendre(page, 400);
    ok("inscription : Échap ferme le volet", !(await page.$(".volet")));
    await page.fill("#c-mdp", "secret123");
    ok("inscription : « Afficher » montre le mot de passe, puis « Masquer »", await (async () => { await page.click("#c-voir"); const a = await page.$eval("#c-mdp", e => e.type); const l1 = await texte(page, "#c-voir"); await page.click("#c-voir"); const b2 = await page.$eval("#c-mdp", e => e.type); return a === "text" && l1.includes("Masquer") && b2 === "password"; })());
    await page.fill("#c-email", "nouvelle@exemple.fr");
    await page.click("#c-go"); await attendre(page, 300);
    ok("inscription : prénom obligatoire", (await texte(page, "#co-err")).includes("prénom"));
    await page.fill("#c-prenom", "Zoé"); await page.fill("#c-mdp", "court");
    await page.click("#c-go"); await attendre(page, 300);
    ok("inscription : 8 caractères minimum", (await texte(page, "#co-err")).includes("8 caractères"));
    await page.fill("#c-mdp", "motdepasse1");
    await page.click("#c-go"); await attendre(page, 300);
    ok("inscription : la case des conditions est obligatoire, rien n'est envoyé", (await texte(page, "#co-err")).includes("Coche la case") && db.inscriptions.length === 0);
    await page.check("#c-cgu");
    await page.click("#c-go"); await attendre(page, 2800);
    const ins = db.inscriptions[0] || {}, d = ins.data || {};
    ok("inscription : POST /auth/v1/signup = email, prénom, nom vide, consentement daté, version des conditions", db.inscriptions.length === 1 && ins.email === "nouvelle@exemple.fr" && d.prenom === "Zoé" && d.nom === "" && /^\d{4}-\d{2}-\d{2}T/.test(d.consentement || "") && d.conditions_version === "2026-09", JSON.stringify(d));
    ok("inscription : connecté ensuite, prospect, et arrivée directe sur le jour 1 du challenge", (await page.evaluate(() => Auth.connecte() && Auth.estProspect()).catch(() => false)) && (await page.evaluate(() => location.hash)) === "#/challenge" && (await texte(page, "#ch-vue")).includes("Ton point de départ"), await page.evaluate(() => location.hash));
    ok("inscription : jamais le questionnaire complet (pas de #p-save)", !(await page.$("#p-save")));
    await c.close();
  }
  {
    inscriptionLibre = false;
    const db = base();
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/#/inscription`); await attendre(page, 1200);
    const t = await texte(page, "body");
    ok("inscription fermée (réglage actuel) : #/inscription ouvre la connexion, aucun champ prénom", t.includes("Connexion à ton espace") && !(await page.$("#c-prenom")) && !(await page.$("#c-cgu")));
    await c.close();
  }
  {
    inscriptionLibre = true;
    const db = base();
    const { c, page } = await contexte(b, null, db, { langue: "en" });
    await page.goto(`http://localhost:${PORT}/#/inscription`); await attendre(page, 1200);
    const t = await texte(page, "body");
    ok("inscription en anglais : « Join the 7-Day Challenge », « I accept the », « Start the challenge »", t.includes("Join the 7-Day Challenge") && t.includes("I accept the") && t.includes("Start the challenge"), t.slice(0, 300));
    await c.close();
    inscriptionLibre = false;
  }

  /* ---------- B. Prospect : démarrage, navigation, jour 1 complet ---------- */
  {
    const db = base();   // ni questionnaire ni challenge
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2000);
    ok("prospect sans questionnaire : arrive sur #/challenge (jamais #/profil forcé)", (await page.evaluate(() => location.hash)) === "#/challenge" && !(await page.$("#p-save")), await page.evaluate(() => location.hash));
    let t = await texte(page, "#ch-vue");
    ok("prospect : jour 1 — « Jour 1 / 7 », « Ton point de départ », une douzaine de questions", t.includes("Jour 1 / 7") && t.includes("Ton point de départ") && t.includes("Une douzaine de questions"));
    ok("prospect : 7 étapes, aucune faite, la 1 en cours", (await page.$$("#ch-vue .ch-etape")).length === 7 && (await page.$$("#ch-vue .ch-etape.fait")).length === 0 && !!(await page.$("#ch-vue .ch-etape.actuel")));
    ok("prospect : onglet « Challenge 7 jours » dans la navigation, cadenas sur la formation", !!(await page.$('#nav a[data-id="challenge"]')) && !!(await page.$('#nav a[data-id="formation"] .nav-cadenas')));
    const barre = await page.$$eval("#barre-bas a", l => l.map(a => a.dataset.id));
    ok("prospect : barre du bas = accueil, challenge, profil, puis un onglet verrouillé", JSON.stringify(barre) === '["accueil","challenge","profil","programme"]', JSON.stringify(barre));
    ok("prospect : libellé court « Challenge » dans la barre du bas", (await page.$eval('#barre-bas a[data-id="challenge"] .lbl', e => e.textContent)) === "Challenge");
    pagesProspect += "\n" + await page.evaluate(() => document.body.innerText);
    /* formulaire vide -> rien n'est écrit */
    await page.click("#ch-voir"); await attendre(page, 900);
    ok("jour 1 : formulaire incomplet → « Il manque : … », aucune écriture", (await texte(page, "#ch-msg")).includes("Il manque") && db.ecritures.length === 0);
    /* on remplit — d'abord une taille en mètres et un âge d'enfant : refusés (bornes), rien n'est écrit */
    await page.selectOption("#q-sexe", "Femme"); await page.fill("#q-age", "15"); await page.fill("#q-taille", "1.68"); await page.fill("#q-poids", "64"); await page.fill("#q-poids_obj", "60");
    await page.selectOption("#q-objectif", "Perte de poids / sèche"); await page.selectOption("#q-niveau", "Débutant (0 à 6 mois)"); await page.selectOption("#q-seances", "3");
    await page.selectOption("#q-lieu", "À la maison"); await page.selectOption("#q-nb_repas", "3 repas"); await page.fill("#q-sommeil_h", "6.5"); await page.selectOption("#q-energie", "4");
    await page.click("#ch-voir"); await attendre(page, 900);
    ok("jour 1 : taille en mètres et âge de 15 ans → « Vérifie : Âge (18 à 90), Taille (120 à 230) », aucune écriture", /Vérifie : .*Âge.*18 à 90.*Taille.*120 à 230/.test(await texte(page, "#ch-msg")) && db.ecritures.length === 0 && !!(await page.$("#q-taille.manque")), await texte(page, "#ch-msg"));
    ok("jour 1 : aides de saisie (centimètres, kilos, à partir de 18 ans)", (await texte(page, "#ch-vue")).includes("En centimètres") && (await texte(page, "#ch-vue")).includes("À partir de 18 ans"));
    await page.fill("#q-age", "29"); await page.fill("#q-taille", "168");
    await page.selectOption("#q-objectif", "Perte de poids / sèche"); await page.selectOption("#q-niveau", "Débutant (0 à 6 mois)"); await page.selectOption("#q-seances", "3");
    await page.selectOption("#q-lieu", "À la maison"); await page.selectOption("#q-nb_repas", "3 repas"); await page.fill("#q-sommeil_h", "6.5"); await page.selectOption("#q-energie", "4");
    await page.fill("#q-pourquoi", "Retrouver de l'énergie.");
    await page.click("#ch-voir"); await attendre(page, 1600);
    const wi = ecrituresDe(db, "intake");
    ok("jour 1 : « Voir mon point de départ » écrit le questionnaire (clé intake, mêmes identifiants), pas encore le challenge", wi.length === 1 && wi[0].contenu.age === "29" && wi[0].contenu.objectif === "Perte de poids / sèche" && wi[0].contenu.pourquoi === "Retrouver de l'énergie." && !wi[0].contenu.complet && ecrituresDe(db, "challenge").length === 0, JSON.stringify(db.ecritures).slice(0, 300));
    t = await texte(page, "#ch-vue");
    ok("jour 1 : point de départ — écart 4,0 kg, dépense estimée, séances, sommeil, énergie", t.includes("Ton écart") && t.includes("4,0") && t.includes("Dépense estimée") && /\d\s?\d{3}\s*kcal/.test(t.replace(/ | /g, " ")) && t.includes("Tes séances") && t.includes("6,5") && t.includes("Énergie"));
    ok("jour 1 : lecture prudente (estimation, pas une vérité ; sommeil = premier frein ; énergie = assiette et sommeil)", t.includes("pas une vérité") && t.includes("premier frein") && t.includes("assiette et le sommeil") && t.includes("estimation basse"));
    ok("jour 1 : aucune promesse chiffrée, aucun prix, aucun conseil médical", !/garanti|promis|€|\bprix\b|tarif|médicament|ordonnance/i.test(t));
    await page.click("#ch-modifier"); await attendre(page, 500);
    ok("jour 1 : « Modifier mes réponses » revient au formulaire pré-rempli", !!(await page.$("#ch-voir")) && (await page.$eval("#q-poids", e => e.value)) === "64");
    await page.click("#ch-voir"); await attendre(page, 1600);
    await page.click("#ch-valider"); await attendre(page, 1600);
    const wc = ecrituresDe(db, "challenge");
    const C = wc.length ? wc[wc.length - 1].contenu : {};
    ok("jour 1 : « J'ai fait mon point de départ » écrit la clé challenge (jour 1 fait, début = aujourd'hui, version 1)", wc.length >= 1 && C.version === 1 && C.debut === AUJ && C.jours && C.jours["1"] && /^\d{4}-\d{2}-\d{2}T/.test(C.jours["1"].fait) && C.jours["1"].date === AUJ && !C.termine, JSON.stringify(C));
    t = await texte(page, "#ch-vue");
    ok("jour 1 : « Jour 1 validé le … », demain annoncé, étape 1 faite, jour 2 verrouillé (même jour)", t.includes("Jour 1 validé le") && t.includes("Demain, jour 2") && (await page.$$("#ch-vue .ch-etape.fait")).length === 1 && !!(await page.$("#ch-vue .ch-etape.ferme")) && !(await page.$("#ch-valider")));
    ok("jour 1 : message « Jour 1 validé » affiché", (await texte(page, "body")).includes("Jour 1 validé"));
    ok("jour 1 : seules les clés intake et challenge ont été écrites, chez le prospect", db.ecritures.every(e => e.table === "donnees" && e.user_id === PROSPECT && ["intake", "challenge"].includes(e.outil)));
    await aller(page, "#/challenge/2", 1300);
    ok("jour 2 le même jour : « Disponible demain », rien d'autre", !!(await page.$("#ch-vue .ch-attente")) && (await texte(page, "#ch-vue")).includes("Disponible demain") && !(await page.$("#ch-voir")));
    await aller(page, "#/challenge/1", 1300);
    ok("jour 1 revu : point de départ en lecture seule, plus de bouton de validation", (await texte(page, "#ch-vue")).includes("Ton écart") && !(await page.$("#ch-valider")) && !(await page.$("#ch-voir")));
    await aller(page, "#/accueil", 1500);
    t = await texte(page, "#acc-vue");
    ok("hub après le jour 1 : « 1 jour validé sur 7 », jour 2 disponible demain, « Mon compte », pas de Calendly avant le jour 5", t.includes("1 jour validé sur 7") && t.includes("Disponible demain") && t.includes("Mon compte") && !(await page.$(`#acc-vue a[href="${CAL}"]`)) && !t.includes("Speed Formation"));
    pagesProspect += "\n" + await page.evaluate(() => document.body.innerText);
    await aller(page, "#/profil", 1300);
    t = await texte(page, "#vue");
    ok("prospect : profil allégé — « Mon compte », note sur le questionnaire complet, pas de formulaire de 57 questions", t.includes("Mon compte") && t.includes("Le questionnaire complet") && !(await page.$("#p-save")) && !(await page.$("#q-journee_type")));
    ok("prospect : bloc « Mes données » (export, suppression) toujours présent dans le profil", t.includes("Mes données"));
    pagesProspect += "\n" + await page.evaluate(() => document.body.innerText);
    await aller(page, "#/formation", 1300);
    ok("prospect : Speed Formation verrouillée tant que le challenge n'est pas fini (« s'ouvre à la fin de ton Challenge », lien vers le challenge, pas Calendly)", !!(await page.$("#vue .verrou")) && (await texte(page, "#vue")).includes("s'ouvre à la fin de ton Challenge 7 jours") && /#\/challenge$/.test(await page.$eval("#vue .verrou a", a => a.href).catch(() => "")) && !(await page.$(`#vue a[href="${CAL}"]`)));
    pagesProspect += "\n" + await page.evaluate(() => document.body.innerText);
    ok("prospect : aucun prix sur les pages visitées", !/€|\bprix\b|tarif/i.test(pagesProspect));
    await c.close();
  }

  /* ---------- C. Déblocage : lendemain, rattrapage, ordre ---------- */
  {
    const db = base({ intake: INTAKE, challenge: chJ1(ilYA(1)) });   // jour 1 fait hier
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2000);
    ok("jour 1 fait hier : arrivée sur l'accueil (pas de redirection vers le challenge), « Aujourd'hui : jour 2 »", ["", "#/accueil"].includes(await page.evaluate(() => location.hash)) && !!(await page.$("#acc-vue")) && (await texte(page, "#acc-vue")).includes("Aujourd'hui : jour 2"), await page.evaluate(() => location.hash));
    await aller(page, "#/challenge", 1300);
    const t = await texte(page, "#ch-vue");
    ok("jour 1 fait hier : #/challenge ouvre le jour 2 (disponible, pas « demain »)", t.includes("Jour 2 / 7") && !t.includes("Disponible demain"));
    await c.close();
  }
  {
    const db = base({ intake: INTAKE, challenge: chJ1(ilYA(3)) });   // jour 1 fait il y a 3 jours : jours 2, 3, 4 rattrapables, dans l'ordre
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/2`); await attendre(page, 2000);
    ok("rattrapage : en retard de 3 jours, le jour 2 est ouvert", (await texte(page, "#ch-vue")).includes("Jour 2 / 7") && !(await page.$("#ch-vue .ch-attente h2:has-text('Disponible demain')")));
    await aller(page, "#/challenge/3", 1300);
    const t3 = await texte(page, "#ch-vue");
    ok("rattrapage : le jour 3 attend le jour 2 (« Dans l'ordre », « Termine d'abord le jour 2 »)", t3.includes("Dans l'ordre") && t3.includes("Termine d'abord le jour 2"));
    await aller(page, "#/challenge/5", 1300);
    ok("rattrapage : le jour 5 reste hors d'atteinte", (await texte(page, "#ch-vue")).includes("Dans l'ordre"));
    await c.close();
  }

  /* ---------- D. Mode test (Lucas) : jours débloqués sur l'appareil ---------- */
  {
    const db = base({ intake: INTAKE, challenge: chJ1(AUJ) });   // jour 1 fait aujourd'hui : le jour 2 attend demain
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/2`); await attendre(page, 2000);
    ok("rythme normal : jour 2 « Disponible demain »", (await texte(page, "#ch-vue")).includes("Disponible demain"));
    await aller(page, "#/challenge-libre", 1600);
    ok("#/challenge-libre : drapeau posé sur l'appareil, retour sur #/challenge, pastille « Mode test »", (await page.evaluate(() => localStorage.getItem("mhx_challenge_libre"))) === "1" && (await page.evaluate(() => location.hash)) === "#/challenge" && (await texte(page, "#ch-vue")).includes("Mode test"));
    await aller(page, "#/challenge/2", 1300);
    ok("mode test : le jour 2 s'ouvre le même jour", !(await texte(page, "#ch-vue")).includes("Disponible demain") && (await texte(page, "#ch-vue")).includes("Jour 2 / 7"));
    await aller(page, "#/accueil", 1300);
    ok("mode test : pastille sur l'accueil, lien « Revenir au rythme normal »", (await texte(page, "#acc-vue")).includes("Mode test") && !!(await page.$('#acc-vue a[href="#/challenge-rythme"]')));
    await aller(page, "#/challenge-rythme", 1600);
    ok("#/challenge-rythme : drapeau retiré, rythme normal (jour 2 disponible demain)", (await page.evaluate(() => localStorage.getItem("mhx_challenge_libre"))) === null && (await (async () => { await aller(page, "#/challenge/2", 1300); return (await texte(page, "#ch-vue")).includes("Disponible demain"); })()));
    ok("mode test : aucune écriture (le drapeau ne vit que sur l'appareil)", db.ecritures.length === 0);
    await c.close();
  }

  /* ---------- E. Challenge terminé : formation débloquée, Calendly ---------- */
  {
    const db = base({ intake: INTAKE, challenge: chFini() });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2000);
    const t = await texte(page, "#acc-vue");
    ok("challenge terminé : hub « Challenge terminé », 7 étapes faites, « Réserver mon appel » (Calendly, nouvel onglet), « Revoir mon challenge »", t.includes("Challenge terminé") && (await page.$$("#acc-vue .ch-etape.fait")).length === 7 && (await page.$eval(`#acc-vue a[href="${CAL}"]`, a => a.target === "_blank" && a.rel.includes("noopener")).catch(() => false)) && t.includes("Revoir mon challenge"));
    ok("challenge terminé : bloc « Avec l'accompagnement MHX » présent, aucun prix", t.includes("Avec l'accompagnement MHX") && !/€|\bprix\b|tarif/i.test(t));
    ok("challenge terminé : la Speed Formation est débloquée (plus de cadenas, listée dans « Ton espace »)", !(await page.$('#nav a[data-id="formation"] .nav-cadenas')) && t.includes("Speed Formation"));
    await aller(page, "#/formation", 1600);
    ok("challenge terminé : #/formation s'ouvre (bibliothèque, 7 modules, pas de verrou)", !(await page.$("#vue .verrou")) && (await texte(page, "#vue")).includes("Bibliothèque") && /7 modules/.test(await texte(page, "#vue")));
    const barre = await page.$$eval("#barre-bas a", l => l.map(a => a.dataset.id));
    ok("challenge terminé : la formation rejoint la barre du bas", barre.includes("formation"), JSON.stringify(barre));
    await aller(page, "#/accueil", 1300);
    await page.click(`#acc-vue a[href="${CAL}"]`).catch(() => {}); await attendre(page, 1600);
    const wc = ecrituresDe(db, "challenge"); const Cc = wc.length ? wc[wc.length - 1].contenu : {};
    ok("challenge terminé : un clic sur « Réserver mon appel » est noté pour le coach (cta.clics, jour 7)", wc.length === 1 && Cc.cta && Array.isArray(Cc.cta.clics) && Cc.cta.clics.length === 1 && Cc.cta.clics[0].jour === 7, JSON.stringify(Cc.cta));
    await c.close();
  }

  /* ---------- F0. Garde-fou santé : objectif sous un poids de forme → pas d'écart, renvoi vers un professionnel ---------- */
  {
    const db = base({ intake: Object.assign({}, INTAKE, { taille: "165", poids: "48", poids_obj: "43" }), challenge: chJ1(ilYA(1)) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/1`); await attendre(page, 2000);
    const t = await texte(page, "#ch-vue");
    ok("garde-fou santé : poids objectif sous un poids de forme → aucune tuile « à perdre », phrase vers un professionnel de santé", !t.includes("à perdre") && !t.includes("Ton écart") && t.includes("professionnel de santé"), t.slice(0, 300));
    ok("garde-fou santé : la dépense estimée reste affichée (information, pas une cible)", t.includes("Dépense estimée"));
    await c.close();
  }
  {
    const db = base({ intake: Object.assign({}, INTAKE, { taille: "165", poids: "48", poids_obj: "" }), challenge: { jours: "x", cta: 5, debut: 12, termine: "false" } });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/accueil`); await attendre(page, 2000);
    ok("clé challenge piégée avec termine: \"false\" : le challenge n'est PAS terminé (0 jour fait), formation verrouillée", (await texte(page, "#acc-vue")).includes("Commencer le jour 1") && !!(await page.$('#nav a[data-id="formation"] .nav-cadenas')));
    await c.close();
  }
  {
    /* date de départ illisible ou dans le futur : jamais bloqué à vie */
    const db = base({ intake: INTAKE, challenge: { version: 1, debut: "26/09/2026", jours: { "1": jourFait(1, ilYA(2)) }, cta: { clics: [] }, termine: null } });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/2`); await attendre(page, 2000);
    ok("date de départ illisible, jour 1 fait avant-hier : le jour 2 s'ouvre quand même (repli sur le dernier jour fait)", (await texte(page, "#ch-vue")).includes("Jour 2 / 7") && !(await texte(page, "#ch-vue")).includes("Disponible demain"));
    await c.close();
  }
  {
    const db = base({ intake: INTAKE, challenge: { version: 1, debut: ilYA(-3), jours: { "1": jourFait(1, AUJ) }, cta: { clics: [] }, termine: null } });   // début dans le futur, jour 1 fait aujourd'hui
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/2`); await attendre(page, 2000);
    ok("date de départ dans le futur, jour 1 fait aujourd'hui : le jour 2 attend demain (pas bloqué à vie, pas ouvert non plus)", (await texte(page, "#ch-vue")).includes("Disponible demain"));
    await c.close();
  }

  /* ---------- F. Données piégées : la clé challenge illisible n'empêche rien ---------- */
  {
    const db = base({ intake: INTAKE, challenge: { jours: "x", cta: 5, debut: 12, termine: [] } });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2000);
    ok("clé challenge piégée : le jour 1 s'affiche normalement, sans erreur", (await texte(page, "#ch-vue")).includes("Ton point de départ") && !!(await page.$("#ch-voir")));
    await aller(page, "#/accueil", 1300);
    ok("clé challenge piégée : le hub s'affiche (« Commencer le jour 1 »)", (await texte(page, "#acc-vue")).includes("Commencer le jour 1"));
    await c.close();
  }

  /* ---------- G. Anglais, mobile ---------- */
  {
    const db = base({ prefs: { langue: "en" } });
    const { c, page } = await contexte(b, lea, db, { langue: "en" });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
    const t = await texte(page, "#ch-vue"), nav = await texte(page, "#nav");
    ok("prospect en anglais : « Day 1 / 7 », « Your starting point », « See my starting point », onglet « 7-Day Challenge »", t.includes("Day 1 / 7") && t.includes("Your starting point") && t.includes("See my starting point") && nav.includes("7-Day Challenge"), t.slice(0, 200));
    ok("prospect en anglais : libellés requis du jour 1 traduits (sommeil, énergie), aides et unités", !t.includes("Heures de sommeil") && !t.includes("Niveau d'énergie") && t.includes("From 18 years old") && t.includes("In centimetres"));
    /* tous les champs requis remplis, sauf une taille en mètres : c'est le message des bornes qui doit sortir, en anglais */
    await page.selectOption("#q-sexe", "Femme"); await page.fill("#q-poids", "64"); await page.selectOption("#q-objectif", "Perte de poids / sèche"); await page.selectOption("#q-niveau", "Débutant (0 à 6 mois)");
    await page.selectOption("#q-seances", "3"); await page.selectOption("#q-lieu", "À la maison"); await page.selectOption("#q-nb_repas", "3 repas"); await page.fill("#q-sommeil_h", "7"); await page.selectOption("#q-energie", "6");
    await page.fill("#q-taille", "1.68"); await page.fill("#q-age", "29"); await page.click("#ch-voir"); await attendre(page, 900);
    ok("prospect en anglais : message de bornes traduit (« Check: Height (cm) (120 to 230) »)", /Check: .*Height \(cm\) \(120 to 230\)/.test(await texte(page, "#ch-msg")), await texte(page, "#ch-msg"));
    await page.fill("#q-taille", ""); await page.click("#ch-voir"); await attendre(page, 900);
    ok("prospect en anglais : message des champs manquants traduit (« Missing: … Height (cm)… »), sans étoile", /Missing: .*Height \(cm\)/.test(await texte(page, "#ch-msg")) && !/\*/.test(await texte(page, "#ch-msg")) && !/Taille/.test(await texte(page, "#ch-msg")), await texte(page, "#ch-msg"));
    await c.close();
  }
  {
    /* la langue anglaise vient de la base seulement (appareil en français) : le dictionnaire du challenge doit suivre */
    const db = base({ prefs: { langue: "en" } });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2600);
    const t = await texte(page, "#ch-vue");
    ok("anglais venu de la base (appareil en français) : le jour 1 est bien en anglais", t.includes("Your starting point") && t.includes("See my starting point"), t.slice(0, 200));
    await aller(page, "#/accueil", 1500);
    ok("prospect en anglais : hub « Today: day 1 — Your starting point », « Start day 1 »", (await texte(page, "#acc-vue")).includes("Today: day 1 — Your starting point") && (await texte(page, "#acc-vue")).includes("Start day 1"));
    await c.close();
  }
  {
    const db = base();
    const { c, page } = await contexte(b, lea, db, { viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2000);
    ok("prospect mobile : le jour 1 sans défilement horizontal", await page.evaluate(() => document.documentElement.scrollWidth <= 390));
    await page.screenshot({ path: path.join(OUT, "prospect-jour1-mobile.png"), fullPage: true });
    await aller(page, "#/accueil", 1300);
    ok("prospect mobile : le hub sans défilement horizontal", await page.evaluate(() => document.documentElement.scrollWidth <= 390));
    await page.screenshot({ path: path.join(OUT, "prospect-accueil-mobile.png"), fullPage: true });
    await c.close();
  }

  /* ---------- H. Client accompagné et coach : rien ne change ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2000);
    ok("client : arrive sur son accueil, pas d'onglet challenge, aucun cadenas", ["", "#/accueil"].includes(await page.evaluate(() => location.hash)) && !!(await page.$("#acc-vue")) && !(await page.$('#nav a[data-id="challenge"]')) && (await page.$$("#nav .nav-cadenas")).length === 0, await page.evaluate(() => location.hash));
    const barre = await page.$$eval("#barre-bas a", l => l.map(a => a.dataset.id));
    ok("client : barre du bas inchangée", JSON.stringify(barre) === '["accueil","programme","nutrition","mensurations"]', JSON.stringify(barre));
    await aller(page, "#/challenge", 1300);
    ok("client : #/challenge retombe sur une page du client (jamais le challenge)", !(await page.$("#ch-vue")) && !!(await page.$("#vue .panel")));
    await aller(page, "#/profil", 1300);
    ok("client : questionnaire complet et « Mon compte » intacts", !!(await page.$("#p-save")) && !!(await page.$("#q-journee_type")) && (await texte(page, "#vue")).includes("Mon compte"));
    ok("client : aucune écriture", db.ecritures.length === 0);
    await c.close();
  }
  {
    const db = base({ intake: INTAKE, challenge: chJ1(ilYA(1)) });
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2000);
    ok("coach : pas d'onglet challenge", !(await page.$('#nav a[data-id="challenge"]')));
    await page.click(`[data-ouvrir="${PROSPECT}"]`); await attendre(page, 1600);
    const t = await texte(page, "#vue");
    ok("coach : la fiche du prospect s'ouvre sans erreur (pastille prospect, questionnaire incomplet, âge 29 ans)", t.includes("prospect") && t.includes("questionnaire incomplet") && t.includes("29 ans"));
    await aller(page, "#/profil", 1300);
    ok("coach : « Son questionnaire » montre les réponses du jour 1 (poids 64)", (await page.$eval("#q-poids", e => e.value).catch(() => "")) === "64");
    ok("coach : aucune écriture en consultant", db.ecritures.length === 0);
    await c.close();
  }

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
function bilan(){ const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length; console.log(res.join("\n")); console.log(nb + "/" + tot); }
