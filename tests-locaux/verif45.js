/* v45 — Challenge 7 jours, jours 2 à 4 : erreur alimentaire (choix, action du jour, ressenti),
   mini-séance (échauffement, circuit selon le niveau, démonstrations vidéo, tours et ressenti),
   habitude (choix, intention quand / où, carte « ce que change un coach » sans bouton),
   relecture de la clé avant chaque écriture, anglais, mobile, client et coach inchangés.
   Supabase simulé : rien ne part vers la vraie base ; les écritures sont appliquées en mémoire.
   Usage : node verif45.js ../index.html                                          */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const PORT = 9675;
const OUT = path.join(__dirname, "captures", "v45"); fs.mkdirSync(OUT, { recursive: true });
const server = http.createServer((req, res) => { res.writeHead(200, { "Content-Type": "text/html" }); res.end(fs.readFileSync(HTML, "utf8")); });
const res = []; const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
const PROSPECT = "00000000-0000-4000-8000-000000000c04";
const CAL = "https://calendly.com/mhx-coaching/30min";
const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const ilYA = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return iso(d); };
const AUJ = ilYA(0);
const INTAKE = { sexe: "Femme", age: "29", taille: "168", poids: "64", poids_obj: "60", objectif: "Perte de poids / sèche", niveau: "Débutant (0 à 6 mois)", seances: "3", lieu: "À la maison", nb_repas: "3 repas", sommeil_h: "6.5", energie: "4" };
const jourFait = (n, quand, extra) => Object.assign({ fait: quand + "T08:00:00.000Z", date: quand }, extra || {});
/* jours 1..k faits, le jour 1 il y a k jours (donc le jour k+1 est disponible aujourd'hui) */
const chJusqua = (k, extras) => { const j = {}; for (let n = 1; n <= k; n++) j[String(n)] = jourFait(n, ilYA(k - n + 1), (extras || {})[n]); return { version: 1, debut: ilYA(k), jours: j, cta: { clics: [] }, termine: null }; };

function base(opts){
  opts = opts || {};
  const profils = JSON.parse(JSON.stringify(F.profils)).concat([{ id: PROSPECT, prenom: "Léa", nom: "", role: "client", cree_le: "2026-09-24T10:00:00Z" }]);
  profils.forEach(p => { p.statut = p.id === PROSPECT ? "prospect" : "client"; });
  const donnees = JSON.parse(JSON.stringify(F.donnees));
  if (opts.challenge) donnees.push({ user_id: PROSPECT, outil: "challenge", contenu: opts.challenge, maj_le: "2026-09-24T10:00:00+00:00" });
  donnees.push({ user_id: PROSPECT, outil: "intake", contenu: opts.intake || INTAKE, maj_le: "2026-09-24T10:00:00+00:00" });
  if (opts.prefs) donnees.push({ user_id: PROSPECT, outil: "prefs", contenu: opts.prefs, maj_le: "2026-09-24T10:00:00+00:00" });
  return { profils, donnees, ecritures: [], lectures: 0 };
}
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || { width: 1280, height: 900 } });
  c.setDefaultTimeout(6000);
  await c.route("**/*", async r => {
    const req = r.request(); const u = req.url(); const host = new URL(u).hostname;
    if (host === "localhost") return r.continue();
    /* la demonstration video (jour 3) ouvre une iframe YouTube : simulee par une page vide */
    if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" });
    if (!host.endsWith(".supabase.co")) return r.abort();
    const url = new URL(u); const p = url.pathname, q = url.searchParams, m = req.method();
    const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", body: body === null ? "" : JSON.stringify(body) });
    if (p.startsWith("/auth/v1/token")) return json(who ? F.session(who.id, who.email) : { error: "invalid" }, who ? 200 : 400);
    if (p.startsWith("/auth/v1/")) return json({});
    if (p === "/rest/v1/profils") { if (m !== "GET") { db.ecritures.push({ table: "profils", m }); return json(null, 204); } const id = q.get("id"); return json(id ? db.profils.filter(x => x.id === id.slice(3)) : db.profils); }
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
      db.lectures++;
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
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
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
const dernier = (db, outil) => { const w = ecrituresDe(db, outil); return w.length ? w[w.length - 1].contenu : null; };
const pasDePrix = t => !/€|\bprix\b|tarif|garanti|promis/i.test(t);

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();
  let pages = "";

  /* ---------- A. Jour 2 : l'erreur à corriger ---------- */
  {
    const db = base({ challenge: chJusqua(1) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2000);
    let t = await texte(page, "#ch-vue");
    ok("jour 2 : « Jour 2 / 7 · Nutrition », titre, 5 erreurs à choisir, aucune action tant qu'on n'a pas choisi", t.includes("Jour 2 / 7") && t.includes("L'erreur qui bloque presque tout le monde") && (await page.$$('input[name="ch-erreur"]')).length === 5 && (await texte(page, "#ch-action")).includes("Choisis d'abord"));
    await page.click("#ch-valider"); await attendre(page, 700);
    ok("jour 2 : valider sans choix → « Choisis d'abord l'erreur qui te ressemble. », aucune écriture", (await texte(page, "#ch-msg")).includes("Choisis d'abord") && db.ecritures.length === 0);
    await page.check('input[name="ch-erreur"][value="boire"]'); await attendre(page, 300);
    ok("jour 2 : choisir « Boire ses calories » affiche l'action du jour (eau, café ou thé sans sucre)", (await texte(page, "#ch-action")).includes("uniquement de l'eau, du café ou du thé sans sucre"));
    await page.check('input[name="ch-erreur"][value="reperes"]'); await attendre(page, 300);
    ok("jour 2 : changer d'erreur change l'action (photo d'un repas complet)", (await texte(page, "#ch-action")).includes("prends en photo un repas complet"));
    await page.check('input[name="ch-erreur"][value="boire"]');
    await page.click('#ch-ressenti button[data-v="moyen"]'); await attendre(page, 200);
    ok("jour 2 : le ressenti « Moyen » se sélectionne (un seul bouton pressé)", (await page.$$eval("#ch-ressenti button", l => l.map(x => x.getAttribute("aria-pressed")).join(","))) === "false,true,false");
    t = await texte(page, "#ch-vue");
    ok("jour 2 : aucun prix, aucune promesse ; « Corriger une seule erreur pendant 7 jours »", pasDePrix(t) && t.includes("Corriger une seule erreur pendant 7 jours"));
    pages += "\n" + t;
    const lecturesAvant = db.lectures;
    /* un autre onglet a note un clic Calendly entre-temps : l'ecriture du jour 2 ne doit pas l'ecraser */
    const ligne = db.donnees.find(x => x.user_id === PROSPECT && x.outil === "challenge"); ligne.contenu.cta.clics.push({ jour: 1, date: "2026-09-25T10:00:00.000Z" });
    await page.click("#ch-valider"); await attendre(page, 1800);
    const C = dernier(db, "challenge");
    ok("jour 2 : « Action faite » écrit le jour 2 (erreur « boire », ressenti « moyen », fait, date)", !!C && C.jours && C.jours["2"] && C.jours["2"].erreur === "boire" && C.jours["2"].ressenti === "moyen" && /^\d{4}-\d{2}-\d{2}T/.test(C.jours["2"].fait) && C.jours["2"].date === AUJ, JSON.stringify(C && C.jours));
    ok("jour 2 : la clé est relue juste avant d'écrire (le clic noté par un autre onglet est conservé, le jour 1 aussi)", !!C && db.lectures > lecturesAvant && C.cta.clics.length === 1 && C.jours["1"] && C.jours["1"].fait, JSON.stringify(C && C.cta));
    ok("jour 2 : seule la clé challenge est écrite, chez le prospect", db.ecritures.every(e => e.table === "donnees" && e.user_id === PROSPECT && e.outil === "challenge") && ecrituresDe(db, "challenge").length === 1);
    t = await texte(page, "#ch-vue");
    ok("jour 2 validé : récapitulatif (Boire ses calories, action, Moyen), « Jour 2 validé le », « Demain, jour 3 », plus de bouton", t.includes("Boire ses calories") && t.includes("Moyen") && t.includes("Jour 2 validé le") && t.includes("Demain, jour 3") && !(await page.$("#ch-valider")));
    ok("jour 2 validé : 2 étapes faites, l'étape 3 fermée (demain), félicitations affichées", (await page.$$("#ch-vue .ch-etape.fait")).length === 2 && (await page.$$eval("#ch-vue .ch-etape", l => l[2].classList.contains("ferme"))) && t.includes("quelque chose de précis"));
    ok("jour 2 validé : le focus est sur la pastille « Jour 2 validé »", (await page.evaluate(() => document.activeElement && document.activeElement.id)) === "ch-fait");
    await aller(page, "#/challenge/3", 1300);
    ok("jour 3 le même jour : « Disponible demain »", (await texte(page, "#ch-vue")).includes("Disponible demain"));
    await aller(page, "#/accueil", 1400);
    ok("hub : « 2 jours validés sur 7 », jour 3 disponible demain, toujours pas de Calendly", (await texte(page, "#acc-vue")).includes("2 jours validés sur 7") && (await texte(page, "#acc-vue")).includes("Disponible demain") && !(await page.$(`#acc-vue a[href="${CAL}"]`)));
    await c.close();
  }

  /* ---------- B. Jour 3 : la mini-séance ---------- */
  {
    const db = base({ challenge: chJusqua(2, { 2: { erreur: "boire", ressenti: "moyen" } }) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2000);
    let t = await texte(page, "#ch-vue");
    ok("jour 3 : « Jour 3 / 7 · Entraînement », échauffement (Marche sur place), circuit de 5 exercices", t.includes("Jour 3 / 7") && t.includes("Marche sur place") && t.includes("Squats") && t.includes("Gainage") && (await page.$$("#ch-vue .ch-exos li")).length === 5);
    ok("jour 3 : niveau Débutant → « 2 tours », tours pré-sélectionnés à 2, consigne de sécurité", t.includes("2 tours (ton niveau : Débutant)") && (await page.$eval('#ch-tours button[aria-pressed="true"]', b => b.dataset.v)) === "2" && t.includes("Une douleur vive, non"));
    ok("jour 3 : 5 boutons « Démonstration », aucune iframe avant le clic", (await page.$$("#ch-vue [data-yt]")).length === 5 && (await page.$$("#ch-vue iframe")).length === 0);
    ok("jour 3 : groupes de boutons nommés pour les lecteurs d'écran (Tours réalisés, Ressenti…), message annoncé (role=status)", (await page.$eval("#ch-tours", e => e.getAttribute("aria-label") || "")) === "Tours réalisés" && (await page.$eval("#ch-ressenti", e => e.getAttribute("aria-label") || "")).startsWith("Ressenti") && (await page.$eval("#ch-msg", e => e.getAttribute("role") || "")) === "status");
    await page.click('#ch-vue [data-yt="G9nGRJjQFXw"]'); await attendre(page, 500);
    ok("jour 3 : « Démonstration » ouvre le lecteur (youtube-nocookie, bon identifiant), à la place du bouton", (await page.$$("#ch-vue iframe")).length === 1 && (await page.$eval("#ch-vue iframe", f => f.src)).includes("youtube-nocookie.com/embed/G9nGRJjQFXw") && (await page.$$("#ch-vue [data-yt]")).length === 4);
    await page.click("#ch-valider"); await attendre(page, 700);
    ok("jour 3 : valider sans ressenti → « Indique tes tours et ton ressenti. », aucune écriture", (await texte(page, "#ch-msg")).includes("Indique tes tours") && db.ecritures.length === 0);
    await page.click('#ch-tours button[data-v="3"]'); await page.click('#ch-ressenti button[data-v="4"]'); await attendre(page, 200);
    pages += "\n" + await texte(page, "#ch-vue");
    await page.click("#ch-valider"); await attendre(page, 1800);
    const C = dernier(db, "challenge");
    ok("jour 3 : « Séance faite » écrit le jour 3 (3 tours, ressenti 4), les jours 1 et 2 conservés", !!C && C.jours["3"] && C.jours["3"].tours === 3 && C.jours["3"].ressenti === 4 && C.jours["2"].erreur === "boire" && C.jours["1"].fait, JSON.stringify(C && C.jours));
    t = await texte(page, "#ch-vue");
    ok("jour 3 validé : récapitulatif (3 tours, 4 / 5), « Jour 3 validé le », félicitations, « Demain, jour 4 »", t.includes("Tours réalisés") && t.includes("4 / 5") && t.includes("Jour 3 validé le") && t.includes("à lundi") && t.includes("Demain, jour 4"));
    await c.close();
  }
  {
    const db = base({ challenge: chJusqua(2), intake: Object.assign({}, INTAKE, { niveau: "Avancé (2 ans et +)" }) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/3`); await attendre(page, 2000);
    ok("jour 3 : niveau Avancé → « 4 tours », tours pré-sélectionnés à 4", (await texte(page, "#ch-vue")).includes("4 tours (ton niveau : Avancé)") && (await page.$eval('#ch-tours button[aria-pressed="true"]', b => b.dataset.v)) === "4");
    await c.close();
  }

  /* ---------- C. Jour 4 : l'habitude ---------- */
  {
    const db = base({ challenge: chJusqua(3, { 2: { erreur: "sauter", ressenti: "dur" }, 3: { tours: 2, ressenti: 3 } }) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2000);
    let t = await texte(page, "#ch-vue");
    ok("jour 4 : « Jour 4 / 7 · Habitudes », 5 habitudes, intention quand / où, texte mindset", t.includes("Jour 4 / 7") && (await page.$$('input[name="ch-habitude"]')).length === 5 && !!(await page.$("#ch-quand")) && !!(await page.$("#ch-ou")) && t.includes("un système qui ne dépend pas de ta motivation"));
    ok("jour 4 : carte « Ce que change un coach à ce stade » sans bouton ni Calendly (CTA progressifs)", t.includes("Ce que change un coach à ce stade") && !(await page.$(`#ch-vue a[href="${CAL}"]`)) && !(await page.$("#ch-vue .ch-info a, #ch-vue .ch-info button")));
    await page.click("#ch-valider"); await attendre(page, 700);
    ok("jour 4 : valider sans habitude → « Choisis une habitude et note quand et où. », aucune écriture", (await texte(page, "#ch-msg")).includes("Choisis une habitude") && db.ecritures.length === 0);
    await page.check('input[name="ch-habitude"][value="marche"]'); await page.click("#ch-valider"); await attendre(page, 700);
    ok("jour 4 : habitude choisie mais sans quand ni où → message, aucune écriture", (await texte(page, "#ch-msg")).includes("Choisis une habitude") && db.ecritures.length === 0);
    await page.fill("#ch-quand", "après le déjeuner"); await page.fill("#ch-ou", "autour du bureau");
    pages += "\n" + await texte(page, "#ch-vue");
    await page.click("#ch-valider"); await attendre(page, 1800);
    const C = dernier(db, "challenge");
    ok("jour 4 : « Habitude faite aujourd'hui » écrit le jour 4 (marche, quand, où), jours 1 à 3 conservés", !!C && C.jours["4"] && C.jours["4"].habitude === "marche" && C.jours["4"].quand === "après le déjeuner" && C.jours["4"].ou === "autour du bureau" && C.jours["3"].tours === 2 && C.jours["2"].erreur === "sauter", JSON.stringify(C && C.jours));
    t = await texte(page, "#ch-vue");
    ok("jour 4 validé : récapitulatif « Ton habitude » (Marcher 10 minutes…, après le déjeuner, autour du bureau), félicitations, « Demain, jour 5 », carte coach toujours là", t.includes("Ton habitude") && t.includes("Marcher 10 minutes après un repas") && t.includes("après le déjeuner, autour du bureau") && t.includes("tient bien mieux") && t.includes("Demain, jour 5") && t.includes("Ce que change un coach"));
    await aller(page, "#/challenge/5", 1300);
    ok("jour 5 le même jour : « Disponible demain » (et pas encore livré : v46)", (await texte(page, "#ch-vue")).includes("Disponible demain"));
    await aller(page, "#/accueil", 1400);
    ok("hub après le jour 4 : « 4 jours validés sur 7 », pas de Calendly avant le jour 5", (await texte(page, "#acc-vue")).includes("4 jours validés sur 7") && !(await page.$(`#acc-vue a[href="${CAL}"]`)));
    pages += "\n" + await texte(page, "#acc-vue");
    ok("jours 2 à 4 : aucun prix, aucune promesse sur les pages visitées", pasDePrix(pages));
    await c.close();
  }
  {
    /* jours 2 à 4 revisites : lecture seule */
    const db = base({ challenge: chJusqua(4, { 2: { erreur: "toutourien", ressenti: "facile" }, 3: { tours: 3, ressenti: 2 }, 4: { habitude: "eau", quand: "au réveil", ou: "cuisine" } }) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/2`); await attendre(page, 2000);
    ok("jour 2 revu : récapitulatif en lecture seule (Le tout ou rien, Facile), pas de bouton", (await texte(page, "#ch-vue")).includes("Le tout ou rien") && (await texte(page, "#ch-vue")).includes("Facile") && !(await page.$("#ch-valider")) && !(await page.$('input[name="ch-erreur"]')));
    await aller(page, "#/challenge/4", 1300);
    ok("jour 4 revu : récapitulatif (eau, au réveil, cuisine), pas de bouton", (await texte(page, "#ch-vue")).includes("Boire un grand verre d'eau") && (await texte(page, "#ch-vue")).includes("au réveil, cuisine") && !(await page.$("#ch-valider")));
    ok("jour 3 revu : boutons « Démonstration » nommés (Démonstration : Squats)", await (async () => { await aller(page, "#/challenge/3", 1300); return (await page.$eval("#ch-vue .ch-exos [data-yt]", b => b.getAttribute("aria-label") || "")).includes("Démonstration : Squats"); })());
    ok("jours revus : aucune écriture", db.ecritures.length === 0);
    await c.close();
  }

  /* ---------- D. Données piégées et écriture refusée ---------- */
  {
    const db = base({ challenge: { version: 1, debut: ilYA(1), jours: { "1": jourFait(1, ilYA(1)), "2": "x", "3": [] }, cta: { clics: [] }, termine: null } });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2000);
    ok("jours 2 et 3 piégés (chaîne, tableau) : ignorés, le jour 2 s'ouvre normalement, sans erreur", (await texte(page, "#ch-vue")).includes("Jour 2 / 7") && (await page.$$('input[name="ch-erreur"]')).length === 5);
    await c.close();
  }
  {
    /* la relecture avant ecriture echoue : rien n'est ecrit, la page ne passe pas en « validé » */
    const db = base({ challenge: chJusqua(1) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2000);
    await page.check('input[name="ch-erreur"][value="boire"]');
    await c.route("**/rest/v1/donnees**", r => { if (r.request().method() === "GET") return r.fulfill({ status: 500, contentType: "application/json", body: "{}" }); return r.fallback(); });   // fallback : les autres requetes restent simulees
    await page.click("#ch-valider"); await attendre(page, 1800);
    ok("jour 2, relecture en panne : aucune écriture, pas de « Jour 2 validé », le bouton reste, message « Non enregistré »", db.ecritures.length === 0 && !(await texte(page, "#ch-vue")).includes("Jour 2 validé le") && !!(await page.$("#ch-valider")) && (await texte(page, "body")).includes("Non enregistré"));
    ok("jour 2, relecture en panne : la copie en mémoire garde l'état affiché (jour 1 toujours fait)", await page.evaluate(() => { const C = Store.cache["challenge"]; return !!(C && C.jours && C.jours["1"] && C.jours["1"].fait); }));
    await c.close();
  }
  {
    /* le meme jour a ete valide dans un autre onglet : rien n'est ecrase, la page passe en lecture seule */
    const db = base({ challenge: chJusqua(1) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2000);
    await page.check('input[name="ch-erreur"][value="boire"]');
    const ligne = db.donnees.find(x => x.user_id === PROSPECT && x.outil === "challenge"); ligne.contenu.jours["2"] = jourFait(2, AUJ, { erreur: "sauter", ressenti: "dur" });
    await page.click("#ch-valider"); await attendre(page, 1800);
    const t2 = await texte(page, "#ch-vue");
    ok("jour 2 déjà validé ailleurs (autre onglet) : aucune écriture, récapitulatif de l'autre onglet (Sauter des repas, Dur)", db.ecritures.length === 0 && t2.includes("Sauter des repas") && t2.includes("Dur") && !(await page.$("#ch-valider")));
    await c.close();
  }
  {
    /* deux appareils : le telephone a valide le jour 2 puis laisse le jour 3 ouvert ; l'ordinateur valide 3 et 4 ;
       le telephone touche « Seance faite » : rien ne doit etre efface (le jour 3 est deja fait : lecture seule) */
    const db = base({ challenge: { version: 1, debut: ilYA(3), jours: { "1": jourFait(1, ilYA(3)) }, cta: { clics: [] }, termine: null } });   // jour 1 seul, il y a 3 jours : jours 2, 3, 4 rattrapables
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/2`); await attendre(page, 2000);
    await page.check('input[name="ch-erreur"][value="boire"]'); await page.click("#ch-valider"); await attendre(page, 1800);
    await aller(page, "#/challenge/3", 1500);
    const ligne = db.donnees.find(x => x.user_id === PROSPECT && x.outil === "challenge");
    ligne.contenu.jours["3"] = jourFait(3, AUJ, { tours: 4, ressenti: 5 }); ligne.contenu.jours["4"] = jourFait(4, AUJ, { habitude: "eau", quand: "réveil", ou: "cuisine" });
    const avant = db.ecritures.length;
    await page.click('#ch-ressenti button[data-v="2"]'); await page.click("#ch-valider"); await attendre(page, 1800);
    const C = ligne.contenu;
    ok("deux appareils : le téléphone (jour 2 écrit avant) ne renvoie pas sa vieille copie — jours 3 et 4 de l'ordinateur intacts, aucune écriture", db.ecritures.length === avant && C.jours["3"].tours === 4 && C.jours["4"] && C.jours["4"].habitude === "eau" && C.jours["2"] && C.jours["2"].erreur === "boire", JSON.stringify(C.jours));
    ok("deux appareils : message « déjà validé sur un autre appareil », récapitulatif de l'autre appareil (Tours réalisés = 4)", (await texte(page, "body")).includes("déjà été validé sur un autre appareil") && (await page.$$eval("#ch-vue .ch-recap li", l => l.some(x => x.textContent.includes("Tours réalisés") && x.querySelector("b").textContent.trim() === "4"))) && !(await page.$("#ch-valider")));
    await c.close();
  }
  {
    /* jeton expire : la relecture renouvelle la connexion AVANT de relire, puis ecrit */
    const db = base({ challenge: chJusqua(1) });
    const perime = { id: PROSPECT, email: "l@e.fr", session: Object.assign({}, F.session(PROSPECT, "l@e.fr"), { expire_le: Date.now() - 1000 }) };
    const { c, page } = await contexte(b, perime, db);
    const journal = []; await c.route("**/*.supabase.co/**", r => { const u = r.request().url(), m = r.request().method(); if (u.includes("refresh_token")) journal.push("refresh"); else if (u.includes("/rest/v1/donnees")) journal.push(m + " donnees"); return r.fallback(); });
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2000);
    journal.length = 0;
    await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("mhx_session")); s.expire_le = Date.now() - 1000; localStorage.setItem("mhx_session", JSON.stringify(s)); Auth.session.expire_le = Date.now() - 1000; });
    await page.check('input[name="ch-erreur"][value="boire"]'); await page.click("#ch-valider"); await attendre(page, 1800);
    ok("jeton expiré au moment de valider : renouvelé AVANT la relecture, puis le jour 2 est écrit", journal[0] === "refresh" && journal.indexOf("GET donnees") > 0 && journal.indexOf("POST donnees") > journal.indexOf("GET donnees") && !!dernier(db, "challenge") && dernier(db, "challenge").jours["2"].erreur === "boire", journal.join(" > "));
    await c.close();
  }
  {
    /* une ecriture encore en attente (700 ms) part avant la relecture : rien n'est perdu */
    const db = base({ challenge: chJusqua(1) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2000);
    await page.check('input[name="ch-erreur"][value="boire"]'); await page.click("#ch-valider"); await attendre(page, 150);
    await page.evaluate(() => Challenge.clic(Store.cache["challenge"], 2)); await attendre(page, 2000);
    const C = dernier(db, "challenge");
    ok("clic noté moins de 700 ms après la validation : le jour 2 et le clic sont tous deux en base", !!C && C.jours["2"] && C.jours["2"].erreur === "boire" && C.cta.clics.length === 1, JSON.stringify(C && { j: Object.keys(C.jours), c: C.cta }));
    await c.close();
  }

  /* ---------- E. Anglais, mobile ---------- */
  {
    const db = base({ challenge: chJusqua(1), prefs: { langue: "en" } });
    const { c, page } = await contexte(b, lea, db, { langue: "en" });
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2200);
    let t = await texte(page, "#ch-vue");
    ok("jour 2 en anglais : titre, erreurs, ressentis (Easy / Medium / Hard)", t.includes("The mistake that holds almost everyone back") && t.includes("Drinking your calories") && t.includes("Easy") && t.includes("Hard"), t.slice(0, 200));
    await page.check('input[name="ch-erreur"][value="boire"]'); await attendre(page, 300);
    ok("jour 2 en anglais : l'action du jour est traduite", (await texte(page, "#ch-action")).includes("only water, coffee or tea without sugar"));
    await aller(page, "#/challenge/3", 1500);   // le jour 2 n'est pas fait : page « dans l'ordre » traduite
    ok("jour 3 en anglais, jour 2 non fait : « In order », « Finish day 2 first. »", (await texte(page, "#ch-vue")).includes("In order") && (await texte(page, "#ch-vue")).includes("Finish day 2 first."), (await texte(page, "#ch-vue")).slice(0, 200));
    await c.close();
  }
  {
    const db = base({ challenge: chJusqua(2), prefs: { langue: "en" } });
    const { c, page } = await contexte(b, lea, db, { langue: "en" });
    await page.goto(`http://localhost:${PORT}/#/challenge/3`); await attendre(page, 2200);
    const t = await texte(page, "#ch-vue");
    ok("jour 3 en anglais : circuit (Squats, Push-ups, Plank), « 2 rounds (your level: Beginner) », échauffement traduit", t.includes("Push-ups") && t.includes("Plank") && t.includes("2 rounds (your level: Beginner)") && t.includes("March in place"), t.slice(0, 300));
    await c.close();
  }
  {
    const db = base({ challenge: chJusqua(4, { 2: { erreur: "boire", ressenti: "moyen" }, 3: { tours: 2, ressenti: 3 }, 4: { habitude: "noter", quand: "le soir", ou: "cuisine,bureau,salon,chambre,jardin,garage,cave,grenier,balcon,terrasse,couloir" } }), prefs: { langue: "en" } });
    const { c: c0, page: p0 } = await contexte(b, lea, db, { langue: "en" });
    await p0.goto(`http://localhost:${PORT}/#/challenge/4`); await attendre(p0, 2200);
    ok("jour 4 en anglais : récapitulatif traduit (Your habit, Write down my meals…)", (await texte(p0, "#ch-vue")).includes("Your habit") && (await texte(p0, "#ch-vue")).includes("Write down my meals"));
    await c0.close();
    const { c: c1, page: p1 } = await contexte(b, lea, db, { viewport: { width: 320, height: 700 } });
    await p1.goto(`http://localhost:${PORT}/#/challenge/4`); await attendre(p1, 2000);
    ok("jour 4 revu à 320 px avec un « où » de 80 caractères sans espace : sans défilement horizontal", await p1.evaluate(() => document.documentElement.scrollWidth <= 320));
    await c1.close();
  }
  {
    const db = base({ challenge: chJusqua(2) });
    const { c, page } = await contexte(b, lea, db, { viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/#/challenge/3`); await attendre(page, 2000);
    ok("jour 3 mobile : sans défilement horizontal", await page.evaluate(() => document.documentElement.scrollWidth <= 390));
    await page.screenshot({ path: path.join(OUT, "prospect-jour3-mobile.png"), fullPage: true });
    await aller(page, "#/challenge/2", 1300);
    ok("jour 2 mobile : sans défilement horizontal", await page.evaluate(() => document.documentElement.scrollWidth <= 390));
    await page.screenshot({ path: path.join(OUT, "prospect-jour2-mobile.png"), fullPage: true });
    await c.close();
  }

  /* ---------- F. Client et coach : rien ne change ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2000);
    ok("client : accueil, pas d'onglet challenge, aucune écriture", !!(await page.$("#acc-vue")) && !(await page.$('#nav a[data-id="challenge"]')) && db.ecritures.length === 0);
    await c.close();
  }
  {
    const db = base({ challenge: chJusqua(4, { 2: { erreur: "boire", ressenti: "moyen" }, 3: { tours: 3, ressenti: 4 }, 4: { habitude: "marche", quand: "midi", ou: "bureau" } }) });
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2000);
    await page.click(`[data-ouvrir="${PROSPECT}"]`); await attendre(page, 1600);
    ok("coach : la fiche du prospect (4 jours faits) s'ouvre sans erreur, aucune écriture", (await texte(page, "#vue")).includes("prospect") && db.ecritures.length === 0);
    await c.close();
  }

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
function bilan(){ const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length; console.log(res.join("\n")); console.log(nb + "/" + tot); }
