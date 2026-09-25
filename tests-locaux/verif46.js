/* v46 — Challenge 7 jours, jours 5 à 7 : personnalisation (blocs calculés avec les formules du
   calculateur, garde-fou santé, volet « ce que comprend l'accompagnement »), projection (trois
   colonnes, fourchette prudente plafonnée, « Où en es-tu ? », Calendly secondaire), conversion
   (jour 7 validé à l'ouverture, tuiles, appel principal, case « J'ai réservé », formation ouverte),
   clics Calendly notés, hub après le jour 5, anglais, mobile (390 et 320 px), thème clair, mode test,
   relecture ratée au jour 7, écritures presque simultanées, garde-fou santé aux jours 6 et 7,
   fourchettes (à la portée, autre sens, écart nul), client et coach inchangés.
   Supabase simulé : rien ne part vers la vraie base ; les écritures sont appliquées en mémoire.
   Usage : node verif46.js ../index.html                                          */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const PORT = 9676;
const OUT = path.join(__dirname, "captures", "v46"); fs.mkdirSync(OUT, { recursive: true });
const server = http.createServer((req, res) => { res.writeHead(200, { "Content-Type": "text/html" }); res.end(fs.readFileSync(HTML, "utf8")); });
const res = []; const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
const PROSPECT = "00000000-0000-4000-8000-000000000c04";
const CAL = "https://calendly.com/mhx-coaching/30min";
const iso = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const ilYA = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return iso(d); };
const AUJ = ilYA(0);
const INTAKE = { sexe: "Femme", age: "29", taille: "168", poids: "64", poids_obj: "60", objectif: "Perte de poids / sèche", niveau: "Débutant (0 à 6 mois)", seances: "3", lieu: "À la maison", nb_repas: "3 repas", sommeil_h: "6.5", energie: "4", pourquoi: "Retrouver de l'énergie." };
const REPONSES = { 2: { erreur: "boire", ressenti: "moyen" }, 3: { tours: 3, ressenti: 4 }, 4: { habitude: "marche", quand: "après le déjeuner", ou: "autour du bureau" }, 5: { interet: "calories" }, 6: { etat: "hesite" } };
const jourFait = (n, quand, extra) => Object.assign({ fait: quand + "T08:00:00.000Z", date: quand }, extra || {});
/* jours 1..k faits, le jour 1 il y a k jours (le jour k+1 est disponible aujourd'hui) */
const chJusqua = (k) => { const j = {}; for (let n = 1; n <= k; n++) j[String(n)] = jourFait(n, ilYA(k - n + 1), REPONSES[n]); return { version: 1, debut: ilYA(k), jours: j, cta: { clics: [] }, termine: null }; };
const norm = t => String(t || "").replace(/[  ]/g, " ");
const pasDePrix = t => !/€|\bprix\b|tarif|garanti(?!r)|promis/i.test(t);

function base(opts){
  opts = opts || {};
  const profils = JSON.parse(JSON.stringify(F.profils)).concat([{ id: PROSPECT, prenom: "Léa", nom: "", role: "client", cree_le: "2026-09-24T10:00:00Z" }]);
  profils.forEach(p => { p.statut = p.id === PROSPECT ? "prospect" : "client"; });
  const donnees = JSON.parse(JSON.stringify(F.donnees));
  if (opts.challenge) donnees.push({ user_id: PROSPECT, outil: "challenge", contenu: opts.challenge, maj_le: "2026-09-24T10:00:00+00:00" });
  donnees.push({ user_id: PROSPECT, outil: "intake", contenu: opts.intake || INTAKE, maj_le: "2026-09-24T10:00:00+00:00" });
  if (opts.prefs) donnees.push({ user_id: PROSPECT, outil: "prefs", contenu: opts.prefs, maj_le: "2026-09-24T10:00:00+00:00" });
  return { profils, donnees, ecritures: [] };
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
      const oc = q.get("outil") || "";
      if (oc === "eq.challenge"){ db.nbChallenge = (db.nbChallenge || 0) + 1; if (db.panne && db.panne(db.nbChallenge)) return json({ message: "panne simulée" }, 500); if (db.lent) await new Promise(r => setTimeout(r, db.lent)); }
      if (oc === "eq.intake" && db.panneIntake) return json({ message: "panne simulée" }, 500);
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
  await c.addInitScript(({ s, langue, theme }) => { if (s) localStorage.setItem("mhx_session", JSON.stringify(s)); localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); if (langue) localStorage.setItem("mhx_langue", langue); if (theme) localStorage.setItem("mhx_theme", theme); }, { s: who ? who.session : null, langue: opts.langue || "", theme: opts.theme || "" });
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
const ecrituresDe = (db, outil) => db.ecritures.filter(e => e.table === "donnees" && e.outil === outil);
const dernier = (db, outil) => { const w = ecrituresDe(db, outil); return w.length ? w[w.length - 1].contenu : null; };
/* clic sur un lien Calendly sans ouvrir de nouvel onglet : l'ecouteur de l'app tourne, la navigation est annulee */
const cliquerCal = (page, sel) => page.evaluate(s => { const a = document.querySelector(s); if (!a) return false; a.addEventListener("click", ev => ev.preventDefault(), { once: true }); a.click(); return true; }, sel);

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();
  let pages = "";

  /* ---------- A. Jour 5 : personnalisation ---------- */
  {
    const db = base({ challenge: chJusqua(4) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2200);
    let t = await texte(page, "#ch-vue");
    ok("jour 5 : « Jour 5 / 7 · Personnalisation », cinq blocs (objectif, calories, entraînement, alimentation, habitudes)", t.includes("Jour 5 / 7") && t.includes("Ton objectif") && t.includes("Tes calories") && t.includes("Ton entraînement") && t.includes("Ton alimentation") && t.includes("Tes habitudes"));
    ok("jour 5 : objectif → « écart : 4,0 kg », rythme prudent « 0,25 à 0,5 kg par semaine » (pas d'arrondi à 0,3)", t.includes("écart : 4,0 kg") && /0,25 à 0,5 kg par semaine/.test(t), t.slice(0, 400));
    ok("jour 5 : calories = formules du calculateur (dépense 1 941 kcal, cible 1 747 kcal, protéines 141 g)", /1 941 kcal/.test(t) && /1 747 kcal/.test(t) && /141 g par jour/.test(t), t.match(/Dépense estimée[^.]*\.[^.]*\.[^.]*\./) ? t.match(/Dépense estimée[^.]*\.[^.]*\.[^.]*\./)[0] : t.slice(0, 200));
    ok("jour 5 : « estimation solide, pas une vérité absolue », le coach ajuste", t.includes("pas une vérité absolue") && t.includes("Ton coach les ajuste"));
    ok("jour 5 : entraînement → 3 séances : corps entier ou haut / bas ; séance du jour 3 (3 tours, ressenti 4 sur 5), niveau et matériel", t.includes("Trois séances par semaine") && t.includes("3 tours, ressenti 4 sur 5") && t.includes("Débutant") && t.includes("À la maison"));
    ok("jour 5 : alimentation → premier levier « corriger « Boire ses calories » », 3 repas par jour", t.includes("Ton premier levier : corriger « Boire ses calories »") && t.includes("3 repas par jour"));
    ok("jour 5 : habitudes → « Marcher 10 minutes après un repas », sommeil 6,5 h = récupération, énergie 4/10", t.includes("Ton habitude : « marcher 10 minutes après un repas ».") && t.includes("6,5 h de sommeil : la récupération sera un sujet") && t.includes("Énergie 4/10"));
    ok("jour 5 : conclusion (ce qu'un questionnaire ne voit pas), lien discret « Voir ce que comprend l'accompagnement », aucun Calendly direct", t.includes("ce qu'un questionnaire ne voit pas") && !!(await page.$("#ch-voir-accomp")) && !(await page.$(`#ch-vue a[href="${CAL}"]`)));
    await page.click("#ch-voir-accomp"); await attendre(page, 500);
    const volet = await texte(page, ".volet");
    ok("jour 5 : le volet reçoit le focus (bouton Fermer)", await page.evaluate(() => !!document.activeElement && document.activeElement.matches(".volet [data-ui-fermer]")));
    ok("jour 5 : le volet liste ce que comprend l'accompagnement (programme, diète…) et un appel en bouton discret", volet.includes("Avec l'accompagnement MHX") && volet.includes("programme d'entraînement sur mesure") && !!(await page.$(`.volet a[href="${CAL}"][data-ch-cal="5"]`)) && pasDePrix(volet));
    await cliquerCal(page, `.volet a[data-ch-cal="5"]`); await attendre(page, 1800);
    let C = dernier(db, "challenge");
    ok("jour 5 : un clic sur l'appel du volet est noté (cta.clics, jour 5), rien d'autre ne change", !!C && C.cta.clics.length === 1 && C.cta.clics[0].jour === 5 && Object.keys(C.jours).length === 4, JSON.stringify(C && C.cta));
    await page.keyboard.press("Escape"); await attendre(page, 400);
    pages += "\n" + t;
    await page.click('#ch-interet button[data-v="calories"]'); await attendre(page, 200);
    await page.click("#ch-valider"); await attendre(page, 1800);
    C = dernier(db, "challenge");
    ok("jour 5 : « J'ai lu mes recommandations » écrit le jour 5 (intérêt « calories »), clic conservé", !!C && C.jours["5"] && C.jours["5"].interet === "calories" && /^\d{4}-\d{2}-\d{2}T/.test(C.jours["5"].fait) && C.cta.clics.length === 1, JSON.stringify(C && C.jours["5"]));
    t = await texte(page, "#ch-vue");
    ok("jour 5 validé : récapitulatif (Calories), « Jour 5 validé le », félicitations, « Demain, jour 6 : dans 90 jours. »", t.includes("Ce qui te parle le plus") && t.includes("Jour 5 validé le") && t.includes("lecture claire de ton point de départ") && t.includes("Demain, jour 6 : dans 90 jours"));
    await aller(page, "#/accueil", 1500);
    const hub = await texte(page, "#acc-vue");
    ok("hub après le jour 5 : « 5 jours validés sur 7 », bloc « Avec l'accompagnement MHX » et appel Calendly (CTA progressif)", hub.includes("5 jours validés sur 7") && hub.includes("Avec l'accompagnement MHX") && !!(await page.$(`#acc-vue a[href="${CAL}"]`)));
    ok("jour 5 et hub : aucun prix, aucune promesse", pasDePrix(pages) && pasDePrix(hub));
    await c.close();
  }
  {
    /* garde-fou sante au jour 5 : aucune cible en deficit */
    const db = base({ challenge: chJusqua(4), intake: Object.assign({}, INTAKE, { taille: "165", poids: "48", poids_obj: "43" }) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/5`); await attendre(page, 2200);
    const t = await texte(page, "#ch-vue");
    ok("jour 5, poids sous un poids de forme : « Aucune cible en déficit », renvoi vers un professionnel, pas d'écart ni de rythme de perte", t.includes("Aucune cible en déficit") && t.includes("professionnel de santé") && !t.includes("écart :") && !t.includes("kg par semaine"));
    await c.close();
  }
  {
    /* objectif recomposition : pas de chiffre a viser */
    const db = base({ challenge: chJusqua(4), intake: Object.assign({}, INTAKE, { objectif: "Recomposition (perdre du gras + prendre du muscle)", poids_obj: "" }) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/5`); await attendre(page, 2200);
    const t = await texte(page, "#ch-vue");
    ok("jour 5, recomposition : « Pas de chiffre à viser sur la balance », cible « pour te stabiliser »", t.includes("Pas de chiffre à viser sur la balance") && t.includes("pour te stabiliser"));
    await c.close();
  }
  {
    /* objectif « perte » mais poids objectif plus haut : aucun ecart affiche, le rythme prudent reste */
    const db = base({ challenge: chJusqua(4), intake: Object.assign({}, INTAKE, { poids_obj: "68" }) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/5`); await attendre(page, 2200);
    const t = await texte(page, "#ch-vue");
    ok("jour 5, objectif « perte » avec un poids objectif plus haut : aucun écart affiché, le rythme prudent reste", !t.includes("écart :") && t.includes("0,25 à 0,5 kg par semaine"), t.slice(0, 300));
    await c.close();
  }
  {
    /* objectif « sante » avec un poids objectif plus bas : pas d'ecart, « Pas de chiffre a viser » */
    const db = base({ challenge: chJusqua(4), intake: Object.assign({}, INTAKE, { objectif: "Santé & énergie au quotidien", poids_obj: "60" }) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/5`); await attendre(page, 2200);
    const t = await texte(page, "#ch-vue");
    ok("jour 5, santé et énergie avec un poids objectif plus bas : aucun écart, « Pas de chiffre à viser »", !t.includes("écart :") && t.includes("Pas de chiffre à viser"), t.slice(0, 300));
    await c.close();
  }
  {
    /* lecture du questionnaire ratee : la page le dit, ni tirets ni bouton, aucune ecriture */
    const db = base({ challenge: chJusqua(4) }); db.panneIntake = true;
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/5`); await attendre(page, 2400);
    const t = await texte(page, "#ch-vue");
    ok("jour 5, questionnaire illisible : « Tes réponses n'ont pas pu être chargées », pas de bouton, aucune écriture", t.includes("Tes réponses n'ont pas pu être chargées") && !(await page.$("#ch-valider")) && !t.includes("Tes calories") && db.ecritures.length === 0, t.slice(0, 200));
    await c.close();
  }

  /* ---------- B. Jour 6 : projection ---------- */
  {
    const db = base({ challenge: chJusqua(5) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2200);
    let t = await texte(page, "#ch-vue");
    ok("jour 6 : « Jour 6 / 7 · Projection », trois colonnes (Aujourd'hui 64,0 kg / 3 séances / 6,5 h ; Ton objectif 60,0 kg + pourquoi ; 90 jours en trois phases)", t.includes("Jour 6 / 7") && t.includes("64,0 kg") && t.includes("3 séances par semaine") && t.includes("6,5 h de sommeil") && t.includes("60,0 kg") && t.includes("Retrouver de l'énergie") && t.includes("Semaines 1-2") && t.includes("Semaines 9-12"));
    ok("jour 6 : fourchette prudente plafonnée à l'écart (« 3,0 à 4,0 kg de moins »), « Personne ne peut te garantir un chiffre »", t.includes("3,0 à 4,0 kg de moins") && t.includes("Personne ne peut te garantir un chiffre"));
    ok("jour 6 : « Où en es-tu ? » avec trois réponses dont « Pas maintenant », appel Calendly secondaire, « ou attends demain »", (await page.$$('input[name="ch-etat"]')).length === 3 && t.includes("Pas maintenant") && !!(await page.$(`#ch-vue a[href="${CAL}"][data-ch-cal="6"]`)) && t.includes("ou attends demain"));
    await page.click("#ch-valider"); await attendre(page, 700);
    ok("jour 6 : valider sans réponse → « Dis-nous où tu en es. », aucune écriture", (await texte(page, "#ch-msg")).includes("Dis-nous") && db.ecritures.length === 0);
    await cliquerCal(page, `#ch-vue a[data-ch-cal="6"]`); await attendre(page, 1800);
    let C = dernier(db, "challenge");
    ok("jour 6 : le clic Calendly est noté (jour 6), le jour 6 n'est pas validé pour autant", !!C && C.cta.clics.length === 1 && C.cta.clics[0].jour === 6 && !C.jours["6"]);
    await page.check('input[name="ch-etat"][value="hesite"]'); await page.click("#ch-valider"); await attendre(page, 1800);
    C = dernier(db, "challenge");
    ok("jour 6 : « Projection faite » écrit le jour 6 (état « hesite »), clic conservé, jours 1 à 5 intacts", !!C && C.jours["6"] && C.jours["6"].etat === "hesite" && C.cta.clics.length === 1 && C.jours["5"].interet === "calories", JSON.stringify(C && C.jours["6"]));
    t = await texte(page, "#ch-vue");
    ok("jour 6 validé : récapitulatif (J'hésite encore), félicitations, « Demain, jour 7 : ta dernière étape. »", t.includes("J'hésite encore") && t.includes("Jour 6 validé le") && t.includes("déjà décider") && t.includes("Demain, jour 7 : ta dernière étape"));
    pages += "\n" + t; ok("jour 6 : aucun prix, aucune promesse", pasDePrix(t));
    await aller(page, "#/challenge/7", 1300);
    ok("jour 7 le même jour : « Disponible demain », rien n'est écrit", (await texte(page, "#ch-vue")).includes("Disponible demain") && !dernier(db, "challenge").jours["7"]);
    await aller(page, "#/accueil", 1500);
    const hub = await texte(page, "#acc-vue");
    ok("hub entre le jour 6 et le jour 7 : « Jour 7 — Ta dernière étape » (titre court), appel Calendly en bouton discret", hub.includes("Jour 7 — Ta dernière étape") && !hub.includes("Tu viens de terminer") && !!(await page.$(`#acc-vue a.btn.ghost[href="${CAL}"]`)), hub.slice(0, 300));
    await c.close();
  }
  {
    /* deux ecritures presque simultanees (clic Calendly puis « Projection faite ») : aucune n'efface l'autre */
    const db = base({ challenge: chJusqua(5) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/6`); await attendre(page, 2200);
    db.lent = 400;
    await page.check('input[name="ch-etat"][value="avancer"]');
    await cliquerCal(page, `#ch-vue a[data-ch-cal="6"]`);
    await page.click("#ch-valider"); await attendre(page, 3800);
    const C = dernier(db, "challenge");
    ok("jour 6 : clic Calendly et « Projection faite » lancés presque ensemble → le clic et le jour 6 sont tous deux enregistrés (file d'écriture)", !!C && C.cta.clics.length === 1 && C.cta.clics[0].jour === 6 && !!C.jours["6"] && C.jours["6"].etat === "avancer", JSON.stringify(C && { c: C.cta, j6: C.jours["6"] }));
    ok("jour 6 : la page affiche le jour validé une fois la file passée", (await texte(page, "#ch-vue")).includes("Jour 6 validé le"));
    await c.close();
  }
  {
    /* ecart a la portee d'un rythme durable (2 kg) : une phrase dediee, pas « 2,0 a 2,0 » */
    const db = base({ challenge: chJusqua(5), intake: Object.assign({}, INTAKE, { poids_obj: "62" }) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/6`); await attendre(page, 2200);
    const t = await texte(page, "#ch-vue");
    ok("jour 6, écart de 2 kg : « Ton objectif (2,0 kg) est à la portée d'un rythme durable sur 12 semaines », jamais « 2,0 à 2,0 »", t.includes("Ton objectif (2,0 kg) est à la portée d'un rythme durable sur 12 semaines") && !t.includes("2,0 à 2,0") && t.includes("Personne ne peut te garantir un chiffre"), t.slice(0, 400));
    await c.close();
  }
  {
    /* arrondis flottants : 64,4 → 61,4 (écart 3,000000000000007) et prise 70 → 71,2 (1,2000000000000028) restent « à la portée », jamais « 3,0 à 3,0 » */
    for (const [intake, attendu] of [[{ poids: "64.4", poids_obj: "61.4" }, "Ton objectif (3,0 kg) est à la portée"], [{ objectif: "Prise de muscle", poids: "70", poids_obj: "71.2" }, "Ton objectif (1,2 kg) est à la portée"]]) {
      const db = base({ challenge: chJusqua(5), intake: Object.assign({}, INTAKE, intake) });
      const { c, page } = await contexte(b, lea, db);
      await page.goto(`http://localhost:${PORT}/#/challenge/6`); await attendre(page, 2200);
      const t = await texte(page, "#ch-vue");
      ok(`jour 6, écart pile sur la borne basse (${intake.poids} → ${intake.poids_obj}) : « ${attendu} », jamais « x à x »`, t.includes(attendu) && !/(\d,\d) à \1 kg/.test(t), t.slice(0, 400));
      await c.close();
    }
  }
  {
    /* poids objectif dans l'autre sens que l'objectif declare, ou egal : aucune fourchette */
    for (const [obj, nom] of [["68", "objectif « perte » avec un poids objectif plus haut"], ["64", "poids objectif égal au poids actuel"]]) {
      const db = base({ challenge: chJusqua(5), intake: Object.assign({}, INTAKE, { poids_obj: obj }) });
      const { c, page } = await contexte(b, lea, db);
      await page.goto(`http://localhost:${PORT}/#/challenge/6`); await attendre(page, 2200);
      const t = await texte(page, "#ch-vue");
      ok(`jour 6, ${nom} : aucune fourchette en kilos, les trois phases restent`, !t.includes("kg de moins") && !t.includes("kg de muscle") && !t.includes("à la portée") && t.includes("Semaines 3-8"), t.slice(0, 300));
      await c.close();
    }
  }
  {
    /* garde-fou sante au jour 6 : aucun kilo, renvoi vers un professionnel */
    const db = base({ challenge: chJusqua(5), intake: Object.assign({}, INTAKE, { taille: "165", poids: "48", poids_obj: "43" }) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/6`); await attendre(page, 2200);
    const t = await texte(page, "#ch-vue");
    ok("jour 6, poids sous un poids de forme : aucune fourchette, aucun poids objectif, renvoi vers un professionnel de santé", !t.includes("kg de moins") && !t.includes("43,0 kg") && t.includes("professionnel de santé") && t.includes("Semaines 3-8"), t.slice(0, 300));
    await c.close();
  }
  {
    const db = base({ challenge: chJusqua(5), prefs: { langue: "en" } });
    const { c, page } = await contexte(b, lea, db, { langue: "en" });
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2400);
    const t = await texte(page, "#ch-vue");
    ok("jour 6 en anglais : « Day 6 / 7 », « With 90 days of coaching », « 3.0 to 4.0 kg less », « Where are you at? », « Not now », « Projection done »", t.includes("Day 6 / 7") && t.includes("With 90 days of coaching") && t.includes("3.0 to 4.0 kg less") && t.includes("Where are you at?") && t.includes("Not now") && t.includes("Projection done"), t.slice(0, 400));
    await c.close();
  }
  {
    const db = base({ challenge: chJusqua(5), intake: Object.assign({}, INTAKE, { objectif: "Prise de muscle", poids_obj: "68" }) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/6`); await attendre(page, 2200);
    ok("jour 6, prise de muscle : « 1,2 à 3,0 kg de muscle en plus » (rythme prudent, plafonné à l'écart de 4 kg)", (await texte(page, "#ch-vue")).includes("1,2 à 3,0 kg de muscle en plus"));
    await c.close();
  }
  {
    const db = base({ challenge: chJusqua(5), intake: Object.assign({}, INTAKE, { objectif: "Santé & énergie au quotidien", poids_obj: "" }) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/6`); await attendre(page, 2200);
    const t = await texte(page, "#ch-vue");
    ok("jour 6, santé et énergie : aucune fourchette en kilos, les trois phases restent", !t.includes("kg de moins") && !t.includes("kg de muscle") && t.includes("Semaines 3-8"));
    await c.close();
  }

  /* ---------- C. Jour 7 : conversion ---------- */
  {
    const db = base({ challenge: chJusqua(6) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2600);
    let C = dernier(db, "challenge");
    ok("jour 7 : validé à l'ouverture (jour 7 fait, challenge terminé), jours 1 à 6 intacts", !!C && C.jours["7"] && /^\d{4}-\d{2}-\d{2}T/.test(C.jours["7"].fait) && typeof C.termine === "string" && C.jours["6"].etat === "hesite" && C.jours["2"].erreur === "boire", JSON.stringify(C && { j: Object.keys(C.jours), t: C.termine }));
    let t = await texte(page, "#ch-vue");
    ok("jour 7 : titre, tuiles (7 / 7, écart 4,0 kg, cible 1 747 kcal, habitude, séance 3 tours · 4/5)", t.includes("Tu viens de terminer ton Challenge 7 jours") && /7\s*\/ 7/.test(t) && t.includes("4,0") && /1 747/.test(t) && t.includes("Marcher 10 minutes") && t.includes("3 tours · 4/5"));
    ok("jour 7 : « Maintenant, construisons ton plan personnalisé. », appel principal Calendly (nouvel onglet), note sans engagement", t.includes("Maintenant, construisons ton plan personnalisé") && (await page.$eval("#ch-vue .ch-cta", a => a.href === "https://calendly.com/mhx-coaching/30min" && a.target === "_blank" && a.rel.includes("noopener")).catch(() => false)) && t.includes("Sans engagement"));
    ok("jour 7 : « Pas encore le moment ? », Instagram, Speed Formation ouverte (lien et plus de cadenas)", t.includes("Pas encore le moment") && !!(await page.$('#ch-vue a[href="https://www.instagram.com/lucasmhxcoaching/"]')) && t.includes("Speed Formation est maintenant ouverte") && !(await page.$('#nav a[data-id="formation"] .nav-cadenas')));
    ok("jour 7 : aucun prix, aucune promesse", pasDePrix(t));
    pages += "\n" + t;
    await cliquerCal(page, "#ch-vue .ch-cta"); await attendre(page, 1800);
    C = dernier(db, "challenge");
    ok("jour 7 : le clic sur l'appel principal est noté (jour 7)", !!C && C.cta.clics.some(x => x.jour === 7), JSON.stringify(C && C.cta));
    await page.check("#ch-reserve"); await attendre(page, 1800);
    C = dernier(db, "challenge");
    ok("jour 7 : « J'ai réservé mon appel » enregistré (jours[7].reserve daté), case figée, « Noté. À très vite. »", !!C && C.jours["7"] && /^\d{4}-\d{2}-\d{2}T/.test(C.jours["7"].reserve || "") && (await page.$eval("#ch-reserve", e => e.checked && e.disabled)) && (await texte(page, "#ch-vue")).includes("Noté. À très vite."), JSON.stringify(C && C.jours["7"]));
    ok("jour 7 : après « J'ai réservé », le focus va sur « Jour 7 validé le »", await page.evaluate(() => !!document.activeElement && document.activeElement.id === "ch-fait"));
    await aller(page, "#/accueil", 1500);
    const hub = await texte(page, "#acc-vue");
    ok("hub après le jour 7 : « Challenge terminé », 7 étapes faites, appel Calendly, Speed Formation listée", hub.includes("Challenge terminé") && (await page.$$("#acc-vue .ch-etape.fait")).length === 7 && !!(await page.$(`#acc-vue a[href="${CAL}"]`)) && hub.includes("Speed Formation"));
    await aller(page, "#/formation", 1500);
    ok("après le jour 7 : #/formation s'ouvre (plus de verrou)", !(await page.$("#vue .verrou")) && (await texte(page, "#vue")).includes("Bibliothèque"));
    ok("jour 7 : seule la clé challenge a été écrite, chez le prospect", db.ecritures.every(e => e.table === "donnees" && e.user_id === PROSPECT && e.outil === "challenge"));
    await c.close();
  }
  {
    /* jour 7 pas encore accessible : rien n'est ecrit */
    const db = base({ challenge: chJusqua(5) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/7`); await attendre(page, 2200);
    ok("jour 7 sans le jour 6 : « Dans l'ordre », aucune écriture, challenge non terminé, formation verrouillée", (await texte(page, "#ch-vue")).includes("Dans l'ordre") && db.ecritures.length === 0 && !!(await page.$('#nav a[data-id="formation"] .nav-cadenas')));
    await c.close();
  }
  {
    /* jour 7 revu : lecture seule, rien n'est reecrit */
    const ch = chJusqua(7); ch.termine = ilYA(0) + "T09:00:00.000Z"; ch.jours["7"].reserve = ilYA(0) + "T09:05:00.000Z";
    const db = base({ challenge: ch });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/7`); await attendre(page, 2200);
    ok("jour 7 revu : rien n'est réécrit, case « J'ai réservé » déjà cochée et figée", db.ecritures.length === 0 && (await page.$eval("#ch-reserve", e => e.checked && e.disabled)));
    await c.close();
  }
  {
    /* relecture ratee a l'ouverture du jour 7 : rien n'est annonce comme termine, rien n'est ecrit ; au rechargement tout rentre dans l'ordre */
    /* lectures de la cle challenge a l'ouverture directe de #/challenge/7 : 1 = demarrage, 2 = la page, 3 = la relecture avant validation */
    const db = base({ challenge: chJusqua(6) }); db.panne = n => n >= 3;
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/7`); await attendre(page, 2600);
    let t = await texte(page, "#ch-vue");
    ok("jour 7, relecture ratée : « Ta dernière étape n'a pas pu être enregistrée », ni « Jour 7 validé le », ni case « J'ai réservé », aucune écriture, formation toujours verrouillée", t.includes("Ta dernière étape n'a pas pu être enregistrée") && !t.includes("Jour 7 validé le") && !(await page.$("#ch-reserve")) && db.ecritures.length === 0 && !!(await page.$('#nav a[data-id="formation"] .nav-cadenas')), t.slice(0, 300) + " · lectures " + db.nbChallenge + " · écritures " + db.ecritures.length);
    db.panne = null; await page.reload(); await attendre(page, 2600);
    t = await texte(page, "#ch-vue"); const C = dernier(db, "challenge");
    ok("jour 7 après rechargement : validé, case « J'ai réservé » présente, formation ouverte", !!C && !!C.jours["7"] && typeof C.termine === "string" && t.includes("Jour 7 validé le") && !!(await page.$("#ch-reserve")) && !(await page.$('#nav a[data-id="formation"] .nav-cadenas')));
    await c.close();
  }
  {
    /* lecture du challenge ratee a l'ouverture de la page : message clair, ni « Dans l'ordre » ni validation, aucune ecriture */
    const db = base({ challenge: chJusqua(6) }); db.panne = n => n === 2;
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/7`); await attendre(page, 2600);
    const t = await texte(page, "#ch-vue");
    ok("jour 7, challenge illisible à l'ouverture : « Ton challenge n'a pas pu être chargé », ni « Dans l'ordre » ni « validé », aucune écriture", t.includes("Ton challenge n'a pas pu être chargé") && !t.includes("Dans l'ordre") && !t.includes("Jour 7 validé le") && db.ecritures.length === 0, t.slice(0, 300) + " · lectures " + db.nbChallenge);
    await c.close();
  }
  {
    /* garde-fou sante au jour 7 : ni ecart ni cible dans les tuiles, l'appel reste */
    const db = base({ challenge: chJusqua(6), intake: Object.assign({}, INTAKE, { taille: "165", poids: "48", poids_obj: "43" }) });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2600);
    const t = await texte(page, "#ch-vue");
    ok("jour 7, poids sous un poids de forme : ni tuile « Ton écart » ni « Cible estimée », titre et appel présents, seule la clé challenge écrite", !t.includes("Ton écart") && !t.includes("Cible estimée") && t.includes("Tu viens de terminer ton Challenge 7 jours") && !!(await page.$("#ch-vue .ch-cta")) && db.ecritures.length > 0 && db.ecritures.every(e => e.outil === "challenge"), t.slice(0, 300));
    await c.close();
  }

  /* ---------- D. Anglais, mobile ---------- */
  {
    const db = base({ challenge: chJusqua(4), prefs: { langue: "en" } });
    const { c, page } = await contexte(b, lea, db, { langue: "en" });
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2400);
    const t = await texte(page, "#ch-vue");
    ok("jour 5 en anglais : « What your answers say about you », « Your calories », « Estimated expenditure », « See what the coaching includes »", t.includes("What your answers say about you") && t.includes("Your calories") && t.includes("Estimated expenditure") && t.includes("See what the coaching includes"), t.slice(0, 300));
    await c.close();
  }
  {
    const db = base({ challenge: chJusqua(6), prefs: { langue: "en" } });
    const { c, page } = await contexte(b, lea, db, { langue: "en" });
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2600);
    const t = await texte(page, "#ch-vue");
    ok("jour 7 en anglais : « You've just finished your 7-Day Challenge », « Book my call », « I've booked my call »", t.includes("You've just finished your 7-Day Challenge") && t.includes("Book my call") && t.includes("I've booked my call"), t.slice(0, 300));
    await c.close();
  }
  for (const [k, nom] of [[4, "jour5"], [5, "jour6"], [6, "jour7"]]) {
    const db = base({ challenge: chJusqua(k) });
    const { c, page } = await contexte(b, lea, db, { viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2600);
    ok(`${nom} mobile : sans défilement horizontal`, await page.evaluate(() => document.documentElement.scrollWidth <= 390));
    await page.screenshot({ path: path.join(OUT, `prospect-${nom}-mobile.png`), fullPage: true });
    await c.close();
  }
  for (const [k, nom] of [[4, "jour5"], [5, "jour6"], [6, "jour7"]]) {
    const db = base({ challenge: chJusqua(k) });
    const { c, page } = await contexte(b, lea, db, { viewport: { width: 320, height: 640 } });
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2600);
    ok(`${nom} à 320 px : sans défilement horizontal`, await page.evaluate(() => document.documentElement.scrollWidth <= 320), "largeur " + await page.evaluate(() => document.documentElement.scrollWidth));
    await c.close();
  }
  for (const [k, nom, attendu] of [[4, "jour5", "Jour 5 / 7"], [5, "jour6", "Jour 6 / 7"], [6, "jour7", "Jour 7 / 7"]]) {
    const db = base({ challenge: chJusqua(k) });
    const { c, page } = await contexte(b, lea, db, { theme: "light" });
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2600);
    ok(`${nom} en thème clair : page rendue sans erreur`, (await texte(page, "#ch-vue")).includes(attendu) && (await page.evaluate(() => document.documentElement.getAttribute("data-theme") === "light")));
    if (nom === "jour5") await page.screenshot({ path: path.join(OUT, `prospect-${nom}-clair.png`), fullPage: true });
    await c.close();
  }
  {
    /* mode test (Lucas) : #/challenge-libre debloque les jours sur cet appareil, #/challenge-rythme remet le rythme normal */
    const ch = chJusqua(2); ch.jours["2"] = jourFait(2, AUJ, REPONSES[2]); ch.debut = ilYA(1);
    const db = base({ challenge: ch });
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge/3`); await attendre(page, 2200);
    ok("rythme normal : le jour 2 fait aujourd'hui → jour 3 « Disponible demain »", (await texte(page, "#ch-vue")).includes("Disponible demain"));
    await aller(page, "#/challenge-libre", 1800);
    ok("mode test : #/challenge-libre ouvre le jour 3 tout de suite (« Jour 3 / 7 »), sans écriture", (await texte(page, "#ch-vue")).includes("Jour 3 / 7") && db.ecritures.length === 0 && (await page.evaluate(() => localStorage.getItem("mhx_challenge_libre") === "1")));
    await aller(page, "#/challenge-rythme", 1800);
    ok("mode test : #/challenge-rythme remet le rythme normal (jour 3 « Disponible demain »)", (await texte(page, "#ch-vue")).includes("Disponible demain") && (await page.evaluate(() => localStorage.getItem("mhx_challenge_libre") === null)));
    await c.close();
  }

  /* ---------- E. Client et coach : rien ne change ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2000);
    ok("client : accueil, pas d'onglet challenge, aucune écriture", !!(await page.$("#acc-vue")) && !(await page.$('#nav a[data-id="challenge"]')) && db.ecritures.length === 0);
    await c.close();
  }
  {
    const ch = chJusqua(7); ch.termine = ilYA(0) + "T09:00:00.000Z";
    const db = base({ challenge: ch });
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2000);
    await page.click(`[data-ouvrir="${PROSPECT}"]`); await attendre(page, 1600);
    const tf = await texte(page, "#vue");
    ok("coach : la fiche du prospect (challenge terminé) s'ouvre (Léa, pastille prospect, « Compte gratuit »), questionnaire de la prospecte visible, aucune écriture", tf.includes("Léa") && !!(await page.$("#vue h1 .pastille.accent")) && tf.includes("Compte gratuit") && tf.includes("29 ans") && db.ecritures.length === 0, tf.slice(0, 300));
    await c.close();
  }

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
function bilan(){ const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length; console.log(res.join("\n")); console.log(nb + "/" + tot); }
