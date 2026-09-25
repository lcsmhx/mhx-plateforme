/* v38 — phases 10 (feedback du coach) et 18 (notes privées).
   Supabase simulé AVEC les règles de la base du 25/09/2026 : un client ne lit
   pas notes_coach et n'écrit ni feedbacks ni notes_coach ; le coach écrit ces
   deux clés dans la fiche d'un client. Les écritures sont gardées en mémoire
   (upsert), et « return=representation » renvoie la ligne comme PostgREST.
   Usage : node verif38.js ../index.html                                       */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const OUT = path.join(__dirname, "captures", "v38"); fs.mkdirSync(OUT, { recursive: true });
const server = http.createServer((req, res) => { res.writeHead(200, { "Content-Type": "text/html" }); res.end(fs.readFileSync(HTML)); });
const PORT = 9667;
const res = []; const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
const iso = (d) => d.toISOString().slice(0, 10);
const ilYA = (n) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return iso(d); };
const ckThomas = F.donnees.find(x => x.user_id === F.IDS.c1 && x.outil === "checkins").contenu.liste[0];
const lundiPrec = ckThomas.semaine, envoiThomas = ckThomas.envoye_le;
const COACH_CLES = ["programme", "repas", "calc", "complements", "hist_programme", "hist_repas", "feedbacks", "notes_coach"];
const PRIVEES = ["feedbacks", "notes_coach"];

/* une base simulée par contexte : copie des fixtures + lignes ajoutées */
function base(extra) {
  const lignes = JSON.parse(JSON.stringify(F.donnees)).concat(extra || []);
  return { lignes, ecritures: [], lectures: [] };
}
async function contexte(b, who, opts) {
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || { width: 1280, height: 900 } });
  const db = opts.db;
  await c.route("**/*", async r => {
    const req = r.request(); const u = req.url();
    if (u.includes("localhost")) return r.continue();
    if (!u.includes("supabase.co")) return r.abort();
    const url = new URL(u); const p = url.pathname, q = url.searchParams, m = req.method();
    const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", body: body === null ? "" : JSON.stringify(body) });
    if (p.startsWith("/auth/v1/token")) { if (opts.refreshKo && url.search.includes("refresh_token")) return json({ error: "invalid_grant" }, 400); return json(F.session(who.id, who.email)); }
    if (p.startsWith("/auth/v1/")) return json({});
    if (p === "/rest/v1/profils") { if (m !== "GET") { db.ecritures.push({ table: "profils" }); return json(null, 204); } const id = q.get("id"); return json(id ? F.profils.filter(x => x.id === id.slice(3)) : F.profils); }
    if (p === "/rest/v1/donnees") {
      if (opts.latence) await new Promise(ok => setTimeout(ok, opts.latence));
      const coach = who.id === F.IDS.coach;
      if (m === "GET") {
        db.lectures.push(url.search);
        const o = q.get("outil") || "";
        if (opts.lectureKo && o === "eq." + opts.lectureKo) return json({ message: "panne simulée" }, 500);
        /* RLS SELECT : (proprietaire et pas notes_coach) ou coach */
        let l = db.lignes.filter(x => coach || (x.user_id === who.id && x.outil !== "notes_coach"));
        const uid = q.get("user_id"); if (uid) l = l.filter(x => x.user_id === uid.slice(3));
        if (o.startsWith("eq.")) l = l.filter(x => x.outil === o.slice(3));
        if (o.startsWith("in.(")) { const k = o.slice(4, -1).split(","); l = l.filter(x => k.includes(x.outil)); }
        if (o.startsWith("not.in.(")) { const k = o.slice(8, -1).split(","); l = l.filter(x => !k.includes(x.outil)); }
        const sel = (q.get("select") || "*").split(","); if (!sel.includes("*")) l = l.map(x => Object.fromEntries(sel.map(k => [k, x[k]])));
        const reponse = JSON.parse(JSON.stringify(l));
        if (opts.apresLecture) opts.apresLecture(o, db);   // « un autre onglet » ecrit juste apres cette lecture
        return json(reponse);
      }
      const permisPour = (x) => coach ? (x.user_id === who.id ? !PRIVEES.includes(x.outil) : COACH_CLES.includes(x.outil))
                                      : (x.user_id === who.id && !PRIVEES.includes(x.outil));
      const rep = (req.headers()["prefer"] || "").includes("return=representation");
      if (m === "PATCH") {
        /* UPDATE filtre (user_id, outil, maj_le) : 0 ligne si elle a bouge ; RLS USING = filtre silencieux */
        const corps = JSON.parse(req.postData() || "{}");
        const uid = (q.get("user_id") || "").slice(3), o = (q.get("outil") || "").slice(3), mj = q.get("maj_le");
        let cibles = db.lignes.filter(x => x.user_id === uid && x.outil === o && permisPour(x));
        if (mj && mj.startsWith("eq.")) cibles = cibles.filter(x => String(x.maj_le) === mj.slice(3));
        if (mj === "is.null") cibles = cibles.filter(x => !x.maj_le);
        if (cibles.length && opts.refus403 && PRIVEES.includes(o)) { db.ecritures.push({ refus: true, outil: o, user_id: uid }); return json({ code: "42501", message: "rls" }, 403); }
        if (opts.patchVide) return json([], 200);   // comme une RLS qui filtre la ligne : aucune erreur, aucune ligne
        for (const x of cibles) { Object.assign(x, corps); db.ecritures.push({ outil: x.outil, user_id: x.user_id, contenu: corps.contenu, patch: true }); }
        if (cibles.length && opts.perdre && opts.perdre.outil === o && opts.perdre.fois > 0) { opts.perdre.fois--; return r.abort("failed"); }   // ecrite, mais la reponse se perd
        return json(rep ? JSON.parse(JSON.stringify(cibles)) : null, 200);
      }
      const upsert = !!q.get("on_conflict");
      const corps = JSON.parse(req.postData() || "[]"); const rows = Array.isArray(corps) ? corps : [corps];
      /* RLS INSERT/UPDATE */
      for (const x of rows) {
        const permis = permisPour(x);
        if (!permis || (opts.refus403 && PRIVEES.includes(x.outil))) { db.ecritures.push({ refus: true, outil: x.outil, user_id: x.user_id }); return json({ code: "42501", message: "new row violates row-level security policy" }, 403); }
      }
      if (!upsert && rows.some(x => db.lignes.some(y => y.user_id === x.user_id && y.outil === x.outil))) return json({ code: "23505", message: "duplicate key" }, 409);
      for (const x of rows) {
        db.ecritures.push({ outil: x.outil, user_id: x.user_id, contenu: x.contenu });
        const i = db.lignes.findIndex(y => y.user_id === x.user_id && y.outil === x.outil);
        if (i > -1) db.lignes[i] = Object.assign({}, db.lignes[i], x); else db.lignes.push(x);
      }
      if (opts.perdre && rows.some(x => x.outil === opts.perdre.outil) && opts.perdre.fois > 0) { opts.perdre.fois--; return r.abort("failed"); }
      return json(rep ? rows : null, 201);
    }
    const t = p.replace("/rest/v1/", "");
    if (F.catalogue[t]) { let l = F.catalogue[t]; const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return json(l); }
    return json([]);
  });
  await c.addInitScript(({ s, langue }) => { localStorage.setItem("mhx_session", JSON.stringify(s)); localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); if (langue) localStorage.setItem("mhx_langue", langue); }, { s: who.session, langue: opts.langue || "" });
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !msg.text().includes("ERR_FAILED") && !msg.text().includes("status of 403") && !msg.text().includes("status of 500") && !msg.text().includes("status of 400"))   /* refus simulés */ res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF"); d.dismiss(); });
  return { c, page };
}
const coach = { id: F.IDS.coach, email: "c@e.fr", session: F.session(F.IDS.coach, "c@e.fr") };
const thomas = { id: F.IDS.c1, email: "t@e.fr", session: F.session(F.IDS.c1, "t@e.fr") };
const attendre = (page, ms) => page.waitForTimeout(ms);
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1300); };
const ouvrirFiche = async (page, id) => { await aller(page, "#/clients", 1500); await page.click(`[data-ouvrir="${id}"]`); await attendre(page, 1500); };
const ecr = (db, outil) => db.ecritures.filter(e => e.outil === outil && !e.refus);

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();

  /* ---------- A. Coach : notes privées ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, coach, { db });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1500);
    await ouvrirFiche(page, F.IDS.c1);
    const fiche = await page.textContent("#acc-vue");
    ok("fiche : panneau « Notes privées » (jamais visibles par le client)", fiche.includes("Notes privées") && fiche.includes("jamais visibles par le client"));
    ok("fiche : la vue n'est pas en lecture seule (accueil dans MODIFIABLES)", !(await page.$eval("#vue", e => e.className.includes("lecture-seule"))));
    ok("fiche : champ des notes ouvert après lecture", !(await page.$eval("#nc-texte", e => e.disabled)));
    ok("fiche : ton feedback sur ce bilan « à écrire »", fiche.includes("Ton feedback sur ce bilan") && fiche.includes("à écrire"));
    await page.fill("#nc-texte", "Genou droit à surveiller.\nParle de son sommeil au call.");
    await attendre(page, 1800);
    const n1 = ecr(db, "notes_coach");
    ok("notes : enregistrement automatique après 1 s (clé notes_coach, chez le client)", n1.length === 1 && n1[0].user_id === F.IDS.c1 && n1[0].contenu.texte.includes("Genou droit"), JSON.stringify(n1));
    ok("notes : état « Enregistré »", (await page.textContent("#nc-etat")).includes("Enregistré"));
    ok("notes : aucune autre clé écrite", db.ecritures.every(e => e.outil === "notes_coach"), JSON.stringify(db.ecritures.map(e => e.outil)));
    await page.type("#nc-texte", " Urgent.");
    await aller(page, "#/bilan", 300);    // on quitte la fiche : pas le temps d'attendre la seconde
    const n2 = ecr(db, "notes_coach");
    ok("notes : ce qui attend part en quittant la fiche (moins de 300 ms)", n2.length === 2 && n2[1].contenu.texte.endsWith("Urgent."), JSON.stringify(n2.map(x => x.contenu.texte)));
    await attendre(page, 1200);
    /* ---------- B. Coach : feedback dans « Préparer le call » ---------- */
    const t = await page.textContent("#bilan-vue");
    ok("préparer le call : bilans + éditeur de feedback", t.includes("Ses bilans hebdomadaires") && t.includes("4 séances tenues") && (await page.$$("[data-fb-semaine]")).length >= 1);
    const ed = await page.$(`[data-fb-semaine="${lundiPrec}"]`);
    ok("préparer le call : un éditeur pour la semaine du bilan reçu", !!ed);
    await page.click(`[data-fb-semaine="${lundiPrec}"] [data-fb-enregistrer]`); await attendre(page, 400);
    ok("feedback vide : rien n'est écrit", ecr(db, "feedbacks").length === 0 && (await page.textContent(`[data-fb-semaine="${lundiPrec}"] [data-fb-msg]`)).includes("Écris"));
    await page.fill(`[data-fb-semaine="${lundiPrec}"] textarea`, "Belle semaine : 4 séances.\nOn cale le coucher à 23 h.");
    await page.click(`[data-fb-semaine="${lundiPrec}"] [data-fb-enregistrer]`); await attendre(page, 900);
    const f1 = ecr(db, "feedbacks");
    ok("feedback : écriture de la clé feedbacks chez le client", f1.length === 1 && f1[0].user_id === F.IDS.c1, JSON.stringify(f1));
    const l1 = f1.length ? f1[0].contenu.liste : [];
    ok("feedback : une entrée { semaine, fin, date, texte, bilan } — bilan = date d'envoi du bilan", l1.length === 1 && l1[0].semaine === lundiPrec && l1[0].fin && l1[0].date === ilYA(0) && l1[0].texte.startsWith("Belle semaine") && l1[0].bilan === envoiThomas, JSON.stringify(l1));
    ok("feedback : message « Feedback enregistré »", (await page.textContent(`[data-fb-semaine="${lundiPrec}"] [data-fb-msg]`)).includes("Feedback enregistré"));
    await page.screenshot({ path: path.join(OUT, "coach-preparer-call-feedback.png"), fullPage: true });
    /* retirer : annuler ne touche à rien, confirmer retire l'entrée */
    await page.fill(`[data-fb-semaine="${lundiPrec}"] textarea`, "");
    await page.click(`[data-fb-semaine="${lundiPrec}"] [data-fb-enregistrer]`); await attendre(page, 400);
    await page.click('.modale [data-ui-b="0"]'); await attendre(page, 400);
    ok("retirer un feedback : Annuler = aucune écriture", ecr(db, "feedbacks").length === 1);
    await page.click(`[data-fb-semaine="${lundiPrec}"] [data-fb-enregistrer]`); await attendre(page, 400);
    await page.click('.modale [data-ui-b="1"]'); await attendre(page, 900);
    const f2 = ecr(db, "feedbacks");
    ok("retirer un feedback : Confirmer = liste sans cette semaine (pas de DELETE)", f2.length === 2 && f2[1].contenu.liste.length === 0, JSON.stringify(f2.map(x => x.contenu)));
    await page.fill(`[data-fb-semaine="${lundiPrec}"] textarea`, "Belle semaine : 4 séances.");
    await page.click(`[data-fb-semaine="${lundiPrec}"] [data-fb-enregistrer]`); await attendre(page, 900);
    /* ---------- C. Alertes et activité ---------- */
    await aller(page, "#/tableau", 1800);
    const tb = (await page.textContent("#tb-vue")).replace(/\s+/g, " ");
    ok("tableau : le bilan de Thomas n'est plus « à lire » une fois le feedback écrit", !tb.includes("Bilan hebdo reçu"), tb.slice(0, 300));
    ok("tableau : KPI Bilans à traiter = 0", /Bilans à traiter\s*0/.test(tb));
    await ouvrirFiche(page, F.IDS.c3);
    await page.fill("#nc-texte", "Relancer Julien par message."); await attendre(page, 1800);
    ok("notes chez Julien enregistrées", ecr(db, "notes_coach").some(e => e.user_id === F.IDS.c3));
    await aller(page, "#/tableau", 1800);
    const tb2 = (await page.textContent("#tb-vue")).replace(/\s+/g, " ");
    ok("activité : une note du coach ne rend pas Julien « actif » (toujours inactif)", /Inactif depuis 1\d j/.test(tb2), tb2.slice(0, 400));
    ok("coach : aucune écriture refusée", db.ecritures.every(e => !e.refus), JSON.stringify(db.ecritures.filter(e => e.refus)));
    await c.close();
  }

  /* ---------- D. Base qui refuse (migration non appliquée) et lecture en panne ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, coach, { db, refus403: true });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1500);
    await ouvrirFiche(page, F.IDS.c1);
    await page.fill("#nc-texte", "Note qui ne passera pas."); await attendre(page, 1800);
    ok("refus 403 : les notes affichent « la base refuse » et gardent le texte", (await page.textContent("#nc-etat")).includes("la base refuse") && (await page.inputValue("#nc-texte")) === "Note qui ne passera pas.");
    await aller(page, "#/bilan", 1500);
    await page.fill(`[data-fb-semaine="${lundiPrec}"] textarea`, "Feedback refusé.");
    await page.click(`[data-fb-semaine="${lundiPrec}"] [data-fb-enregistrer]`); await attendre(page, 900);
    ok("refus 403 : le feedback affiche « la base refuse », texte gardé", (await page.textContent(`[data-fb-semaine="${lundiPrec}"] [data-fb-msg]`)).includes("la base refuse") && (await page.inputValue(`[data-fb-semaine="${lundiPrec}"] textarea`)) === "Feedback refusé.");
    await c.close();
  }
  {
    const db = base([{ user_id: F.IDS.c1, outil: "notes_coach", contenu: { texte: "Ancienne note importante", maj: "2026-09-20T10:00:00Z" }, maj_le: "2026-09-20T10:00:00Z" }]);
    const { c, page } = await contexte(b, coach, { db, lectureKo: "notes_coach" });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1500);
    await ouvrirFiche(page, F.IDS.c1);
    ok("lecture en panne : le champ reste fermé, rien n'est écrit", (await page.$eval("#nc-texte", e => e.disabled)) && (await page.textContent("#nc-etat")).includes("n'ont pas pu être lues") && ecr(db, "notes_coach").length === 0);
    await c.close();
  }
  {
    const db = base([{ user_id: F.IDS.c1, outil: "notes_coach", contenu: { texte: "Ancienne note importante", maj: "2026-09-20T10:00:00Z" }, maj_le: "2026-09-20T10:00:00Z" }]);
    const { c, page } = await contexte(b, coach, { db });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1500);
    await ouvrirFiche(page, F.IDS.c1);
    ok("notes existantes : relues dans la fiche, aucune écriture à l'ouverture", (await page.inputValue("#nc-texte")) === "Ancienne note importante" && ecr(db, "notes_coach").length === 0 && (await page.textContent("#nc-etat")).includes("Dernière modification"));
    await page.screenshot({ path: path.join(OUT, "coach-fiche-notes.png"), fullPage: true });
    await c.close();
  }

  /* ---------- D2. Feedback écrit avant le bilan, semaines conservées, conflit ---------- */
  {
    const avantBilan = { user_id: F.IDS.c1, outil: "feedbacks", contenu: { liste: [
      { semaine: ilYA(40), fin: ilYA(34), date: ilYA(33), texte: "Semaine ancienne, à garder.", bilan: ilYA(34) },
      { semaine: lundiPrec, fin: envoiThomas, date: lundiPrec, texte: "Mot écrit avant son bilan." } ] }, maj_le: ilYA(3) + "T08:00:00Z" };
    const db = base([avantBilan]);
    const { c, page } = await contexte(b, coach, { db });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1800);
    ok("feedback écrit avant le bilan : le bilan reste « à lire » au tableau", (await page.textContent("#tb-vue")).includes("Bilan hebdo reçu"));
    await ouvrirFiche(page, F.IDS.c1);
    ok("fiche : « écrit avant ce bilan, à relire »", (await page.textContent("#acc-vue")).includes("écrit avant ce bilan, à relire"));
    await aller(page, "#/bilan", 1500);
    const t = await page.textContent("#bilan-vue");
    ok("préparer le call : « feedback à relire » et « avant ce bilan »", t.includes("feedback à relire") && t.includes("avant ce bilan"));
    await page.click(`[data-fb-semaine="${lundiPrec}"] [data-fb-enregistrer]`); await attendre(page, 900);
    const f = ecr(db, "feedbacks"), l = f.length ? f[0].contenu.liste : [];
    ok("renvoyé sous le bilan : il y répond (bilan = date d'envoi)", l.some(x => x.semaine === lundiPrec && x.bilan === envoiThomas), JSON.stringify(l));
    ok("les autres semaines sont conservées telles quelles", l.some(x => x.texte === "Semaine ancienne, à garder." && x.bilan === ilYA(34)) && l.length === 2, JSON.stringify(l));
    await aller(page, "#/tableau", 1800);
    ok("après réponse : plus d'alerte « Bilan hebdo reçu »", !(await page.textContent("#tb-vue")).includes("Bilan hebdo reçu"));
    /* conflit : la même semaine change ailleurs après l'affichage */
    await ouvrirFiche(page, F.IDS.c1); await aller(page, "#/bilan", 1500);
    const ligne = db.lignes.find(x => x.user_id === F.IDS.c1 && x.outil === "feedbacks");
    ligne.contenu = JSON.parse(JSON.stringify(ligne.contenu));
    ligne.contenu.liste.find(x => x.semaine === lundiPrec).texte = "Réécrit depuis un autre appareil.";
    const avant = ecr(db, "feedbacks").length;
    await page.fill(`[data-fb-semaine="${lundiPrec}"] textarea`, "Ma version.");
    await page.click(`[data-fb-semaine="${lundiPrec}"] [data-fb-enregistrer]`); await attendre(page, 900);
    ok("conflit : rien n'est écrit, message « a changé entre-temps », texte gardé", ecr(db, "feedbacks").length === avant && (await page.textContent(`[data-fb-semaine="${lundiPrec}"] [data-fb-msg]`)).includes("changé entre-temps") && (await page.inputValue(`[data-fb-semaine="${lundiPrec}"] textarea`)) === "Ma version.");
    ok("conflit : la version écrite ailleurs est intacte", db.lignes.find(x => x.user_id === F.IDS.c1 && x.outil === "feedbacks").contenu.liste.find(x => x.semaine === lundiPrec).texte === "Réécrit depuis un autre appareil.");
    await c.close();
  }
  {
    const db = base([{ user_id: F.IDS.c1, outil: "feedbacks", contenu: { liste: [{ semaine: lundiPrec, fin: envoiThomas, date: ilYA(2), texte: "Existant.", bilan: envoiThomas }] }, maj_le: ilYA(2) + "T08:00:00Z" }]);
    const { c, page } = await contexte(b, coach, { db, lectureKo: "feedbacks" });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1500);
    await ouvrirFiche(page, F.IDS.c1); await aller(page, "#/bilan", 1500);
    const fermes = await page.$$eval("[data-fb-semaine] textarea", l => l.length > 0 && l.every(e => e.disabled));
    const boutons = await page.$$eval("[data-fb-enregistrer]", l => l.length > 0 && l.every(e => e.disabled));
    ok("feedbacks illisibles : éditeurs et boutons fermés, message clair", fermes && boutons && (await page.textContent("#bilan-vue")).includes("n'ont pas pu être lus"));
    ok("feedbacks illisibles : aucune écriture", ecr(db, "feedbacks").length === 0);
    await c.close();
  }
  {
    /* deux envois coup sur coup, base lente : les deux arrivent */
    const db = base();
    const { c, page } = await contexte(b, coach, { db, latence: 600 });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 4000);
    await aller(page, "#/clients", 3000); await page.click(`[data-ouvrir="${F.IDS.c1}"]`); await attendre(page, 3500);
    await aller(page, "#/bilan", 5000);
    const eds = await page.$$eval("[data-fb-semaine]", l => l.map(e => e.dataset.fbSemaine));
    if (eds.length >= 2) {
      await page.fill(`[data-fb-semaine="${eds[0]}"] textarea`, "Premier feedback.");
      await page.fill(`[data-fb-semaine="${eds[1]}"] textarea`, "Second feedback.");
      await page.click(`[data-fb-semaine="${eds[0]}"] [data-fb-enregistrer]`);
      await page.click(`[data-fb-semaine="${eds[1]}"] [data-fb-enregistrer]`);
      await attendre(page, 5000);
      const fin = db.lignes.find(x => x.user_id === F.IDS.c1 && x.outil === "feedbacks");
      const textes = fin ? fin.contenu.liste.map(x => x.texte) : [];
      ok("deux envois coup sur coup (latence 600 ms) : les deux feedbacks sont en base", textes.includes("Premier feedback.") && textes.includes("Second feedback."), JSON.stringify(textes));
    } else ok("deux envois coup sur coup : il faut deux éditeurs (semaine du bilan + semaine visée)", eds.length >= 2, JSON.stringify(eds));
    await c.close();
  }
  {
    /* notes : modifiées ailleurs après l'ouverture ; version « avant » gardée */
    const db = base([{ user_id: F.IDS.c1, outil: "notes_coach", contenu: { texte: "Ancienne note importante", maj: "2026-09-20T10:00:00.000Z" }, maj_le: "2026-09-20T10:00:00Z" }]);
    const { c, page } = await contexte(b, coach, { db });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1500);
    await ouvrirFiche(page, F.IDS.c1);
    await page.fill("#nc-texte", "Nouvelle version."); await attendre(page, 1800);
    const n = ecr(db, "notes_coach");
    ok("notes : la version trouvée à l'ouverture est gardée dans « avant »", n.length === 1 && n[0].contenu.avant && n[0].contenu.avant.texte === "Ancienne note importante", JSON.stringify(n.map(x => x.contenu)));
    const ligne = db.lignes.find(x => x.user_id === F.IDS.c1 && x.outil === "notes_coach");
    ligne.contenu = { texte: "Écrit dans un autre onglet.", maj: "2099-01-01T00:00:00.000Z" }; ligne.maj_le = "2099-01-01T00:00:00+00:00";
    await page.fill("#nc-texte", "Nouvelle version, suite."); await attendre(page, 1800);
    const apres = db.lignes.find(x => x.user_id === F.IDS.c1 && x.outil === "notes_coach").contenu.texte;
    ok("notes modifiées ailleurs : les deux versions sont gardées (la sienne à la suite), rien n'est perdu", apres.startsWith("Écrit dans un autre onglet.") && apres.includes("Nouvelle version, suite.") && (await page.textContent("#nc-etat")).includes("les deux versions sont gardées") && (await page.inputValue("#nc-texte")) === apres, apres);
    await c.close();
  }
  {
    /* un feedback « sans bilan » pour Julien (inactif) ne le rend pas actif */
    const db = base();
    const { c, page } = await contexte(b, coach, { db });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1500);
    await ouvrirFiche(page, F.IDS.c3); await aller(page, "#/bilan", 1500);
    const sem = await page.$eval("[data-fb-semaine]", e => e.dataset.fbSemaine);
    await page.fill(`[data-fb-semaine="${sem}"] textarea`, "Tu me donnes des nouvelles ?");
    await page.click(`[data-fb-semaine="${sem}"] [data-fb-enregistrer]`); await attendre(page, 900);
    ok("feedback sans bilan pour Julien : écrit, sans « bilan »", ecr(db, "feedbacks").some(e => e.user_id === F.IDS.c3 && e.contenu.liste.length === 1 && !e.contenu.liste[0].bilan));
    await aller(page, "#/tableau", 1800);
    ok("activité : un feedback du coach ne rend pas Julien « actif »", /Inactif depuis 1\d j/.test((await page.textContent("#tb-vue")).replace(/\s+/g, " ")));
    await c.close();
  }

  /* ---------- D3. Écritures presque simultanées, bilan renvoyé le même jour, session perdue ---------- */
  {
    /* une AUTRE semaine est écrite (autre onglet) entre la lecture et l'écriture : on relit et on réapplique */
    const db = base([{ user_id: F.IDS.c1, outil: "feedbacks", contenu: { liste: [{ semaine: ilYA(40), fin: ilYA(34), date: ilYA(33), texte: "Semaine A.", bilan: ilYA(34) }] }, maj_le: ilYA(33) + "T08:00:00+00:00" }]);
    let arme = false;
    const { c, page } = await contexte(b, coach, { db, apresLecture: (o, dbx) => {
      if (!arme || o !== "eq.feedbacks") return; arme = false;
      const l = dbx.lignes.find(x => x.user_id === F.IDS.c1 && x.outil === "feedbacks");
      l.contenu = { liste: l.contenu.liste.concat([{ semaine: ilYA(20), fin: ilYA(14), date: ilYA(0), texte: "Semaine B, autre onglet." }]) };
      l.maj_le = new Date().toISOString();
    } });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1500);
    await ouvrirFiche(page, F.IDS.c1); await aller(page, "#/bilan", 1500);
    arme = true;
    await page.fill(`[data-fb-semaine="${lundiPrec}"] textarea`, "Semaine du bilan.");
    await page.click(`[data-fb-semaine="${lundiPrec}"] [data-fb-enregistrer]`); await attendre(page, 1500);
    const fin = db.lignes.find(x => x.user_id === F.IDS.c1 && x.outil === "feedbacks").contenu.liste.map(x => x.texte);
    ok("écriture presque simultanée d'une autre semaine : rien n'est perdu (A, B et la nouvelle)", fin.includes("Semaine A.") && fin.includes("Semaine B, autre onglet.") && fin.includes("Semaine du bilan."), JSON.stringify(fin));
    ok("… et le message dit « Feedback enregistré »", (await page.textContent(`[data-fb-semaine="${lundiPrec}"] [data-fb-msg]`)).includes("Feedback enregistré"));
    await c.close();
  }
  {
    /* bilan renvoyé le même jour après le feedback : il redevient « à lire » */
    const db = base([{ user_id: F.IDS.c1, outil: "feedbacks", contenu: { liste: [{ semaine: lundiPrec, fin: envoiThomas, date: envoiThomas, texte: "Réponse au premier envoi.", bilan: envoiThomas + "T09:00:00.000Z" }] }, maj_le: envoiThomas + "T09:05:00+00:00" }]);
    const ck = db.lignes.find(x => x.user_id === F.IDS.c1 && x.outil === "checkins").contenu.liste;
    ck[ck.length - 1].envoye_a = envoiThomas + "T20:00:00.000Z";
    const { c, page } = await contexte(b, coach, { db });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1800);
    ok("bilan renvoyé le même jour après le feedback : de nouveau « Bilan hebdo reçu »", (await page.textContent("#tb-vue")).includes("Bilan hebdo reçu"));
    await ouvrirFiche(page, F.IDS.c1); await aller(page, "#/bilan", 1500);
    ok("… et « feedback à relire » dans Préparer le call", (await page.textContent("#bilan-vue")).includes("feedback à relire"));
    await c.close();
  }
  {
    /* bilan envoyé par le client : l'instant d'envoi (envoye_a) est enregistré */
    const db = base();
    const { c, page } = await contexte(b, thomas, { db });
    await page.goto(`http://localhost:${PORT}/#/suivi`); await attendre(page, 1800);
    const form = await page.$("[data-checkin]");
    if (form) {
      for (const q of ["energie", "motivation", "sommeil", "stress"]) await page.click(`[data-q="${q}"] [data-v="3"]`);
      await page.click("[data-checkin] button[type=submit]"); await attendre(page, 1500);
      const e = ecr(db, "checkins");
      const der = e.length ? e[e.length - 1].contenu.liste.slice(-1)[0] : null;
      ok("bilan envoyé : envoye_le (jour) et envoye_a (instant ISO)", !!der && /^\d{4}-\d{2}-\d{2}$/.test(der.envoye_le) && /^\d{4}-\d{2}-\d{2}T/.test(der.envoye_a || ""), JSON.stringify(der));
    } else ok("bilan envoyé : formulaire disponible", false, "pas de formulaire");
    await c.close();
  }
  {
    /* session impossible à renouveler : les notes ne s'ouvrent pas vides, rien n'est écrit */
    const db = base([{ user_id: F.IDS.c1, outil: "notes_coach", contenu: { texte: "Note existante.", maj: "2026-09-20T10:00:00.000Z" }, maj_le: "2026-09-20T10:00:00+00:00" }]);
    const { c, page } = await contexte(b, coach, { db, refreshKo: true });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1500);
    await aller(page, "#/clients", 1500);
    await page.evaluate(() => { Auth.session.expire_le = Date.now() - 1000; });
    await page.click(`[data-ouvrir="${F.IDS.c1}"]`); await attendre(page, 1800);
    const ferme = await page.$eval("#nc-texte", e => e.disabled).catch(() => true);
    ok("session perdue : notes fermées (pas affichées vides), message « n'ont pas pu être lues »", ferme && (await page.textContent("#nc-etat").catch(() => "")).includes("n'ont pas pu être lues") && ecr(db, "notes_coach").length === 0);
    await c.close();
  }

  /* ---------- D4. Réponse perdue alors que l'écriture est passée ; refus silencieux de la base ---------- */
  {
    const db = base([{ user_id: F.IDS.c1, outil: "notes_coach", contenu: { texte: "V0.", maj: "2026-09-20T10:00:00.000Z" }, maj_le: "2026-09-20T10:00:00+00:00" }]);
    const opts = { db, perdre: { outil: "notes_coach", fois: 1 } };
    const { c, page } = await contexte(b, coach, opts);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1500);
    await ouvrirFiche(page, F.IDS.c1);
    await page.fill("#nc-texte", "V0. Phrase 1."); await attendre(page, 1800);
    ok("notes : réponse perdue → « la connexion a échoué » (l'écriture, elle, est passée)", (await page.textContent("#nc-etat")).includes("connexion a échoué") && db.lignes.find(x => x.user_id === F.IDS.c1 && x.outil === "notes_coach").contenu.texte === "V0. Phrase 1.");
    await page.type("#nc-texte", " Phrase 2."); await attendre(page, 1800);
    await page.type("#nc-texte", " Phrase 3."); await aller(page, "#/bilan", 1200);
    const fin = db.lignes.find(x => x.user_id === F.IDS.c1 && x.outil === "notes_coach").contenu.texte;
    ok("notes : après la réponse perdue, rien n'est jeté (phrases 2 et 3 enregistrées)", fin === "V0. Phrase 1. Phrase 2. Phrase 3.", fin);
    await c.close();
  }
  {
    const db = base();
    const opts = { db, perdre: { outil: "feedbacks", fois: 1 } };
    const { c, page } = await contexte(b, coach, opts);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1500);
    await ouvrirFiche(page, F.IDS.c1); await aller(page, "#/bilan", 1500);
    const sel = `[data-fb-semaine="${lundiPrec}"]`;
    await page.fill(sel + " textarea", "Premier jet.");
    await page.click(sel + " [data-fb-enregistrer]"); await attendre(page, 900);
    ok("feedback : réponse perdue → « la connexion a échoué »", (await page.textContent(sel + " [data-fb-msg]")).includes("connexion a échoué"));
    await page.fill(sel + " textarea", "Premier jet, retouché.");
    await page.click(sel + " [data-fb-enregistrer]"); await attendre(page, 900);
    const l = db.lignes.find(x => x.user_id === F.IDS.c1 && x.outil === "feedbacks").contenu.liste;
    ok("feedback : la retouche après une réponse perdue est enregistrée (pas de faux conflit)", (await page.textContent(sel + " [data-fb-msg]")).includes("Feedback enregistré") && l.length === 1 && l[0].texte === "Premier jet, retouché.", JSON.stringify(l));
    await c.close();
  }
  {
    const db = base([{ user_id: F.IDS.c1, outil: "notes_coach", contenu: { texte: "Note.", maj: "2026-09-20T10:00:00.000Z" }, maj_le: "2026-09-20T10:00:00+00:00" }]);
    const { c, page } = await contexte(b, coach, { db, patchVide: true });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1500);
    await ouvrirFiche(page, F.IDS.c1);
    await page.fill("#nc-texte", "Note modifiée."); await attendre(page, 1800);
    ok("refus silencieux de la base (mise à jour vide) : « la base refuse », pas un faux conflit", (await page.textContent("#nc-etat")).includes("la base refuse") && (await page.inputValue("#nc-texte")) === "Note modifiée.");
    await c.close();
  }

  /* ---------- E. Client : lecture du feedback ---------- */
  const fbRecent = { user_id: F.IDS.c1, outil: "feedbacks", contenu: { liste: [
    { semaine: ilYA(35), fin: ilYA(29), date: ilYA(28), texte: "Ancien feedback." },
    { semaine: lundiPrec, fin: F.donnees.find(x => x.user_id === F.IDS.c1 && x.outil === "checkins").contenu.liste[0].fin, date: ilYA(1), texte: "Belle semaine : 4 séances.\nOn cale le coucher à 23 h." } ] }, maj_le: ilYA(1) + "T08:00:00Z" };
  const noteC1 = { user_id: F.IDS.c1, outil: "notes_coach", contenu: { texte: "NOTE PRIVEE DU COACH", maj: "2026-09-20T10:00:00Z" }, maj_le: "2026-09-20T10:00:00Z" };
  {
    const db = base([fbRecent, noteC1]);
    const { c, page } = await contexte(b, thomas, { db });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1800);
    const acc = await page.textContent("#acc-vue");
    ok("client accueil : carte « Ton feedback est disponible »", acc.includes("Ton feedback est disponible") && acc.includes("Ton coach a répondu"));
    await page.screenshot({ path: path.join(OUT, "client-accueil-feedback.png"), fullPage: true });
    await aller(page, "#/suivi", 1600);
    const haut = await page.textContent("#suivi-fb-haut");
    ok("client mon suivi : « Feedback de ton coach » en tête (récent), avec le texte", haut.includes("Feedback de ton coach") && haut.includes("On cale le coucher") && haut.includes("nouveau"));
    ok("client mon suivi : l'ancien feedback dans « Feedbacks précédents »", haut.includes("Feedbacks précédents") && haut.includes("Ancien feedback"));
    const blanc = await page.$eval("#suivi-fb-haut .fb-texte", e => getComputedStyle(e).whiteSpace);
    ok("client mon suivi : retours à la ligne du coach conservés", blanc === "pre-line", blanc);
    await page.screenshot({ path: path.join(OUT, "client-suivi-feedback.png"), fullPage: true });
    const tout = await page.evaluate(() => document.body.innerText);
    ok("client : la note privée n'apparaît nulle part", !tout.includes("NOTE PRIVEE DU COACH"));
    ok("client : aucune requête ne demande notes_coach", db.lectures.every(s => !s.includes("notes_coach")), db.lectures.filter(s => s.includes("notes_coach")).join(" | "));
    /* restauration de sauvegarde et Store.ecrire : jamais ces deux clés */
    const avant = db.ecritures.length;
    const r = await page.evaluate(async () => {
      Store.ecrire("feedbacks", { liste: [] }); Store.ecrire("notes_coach", { texte: "x" });
      await new Promise(ok => setTimeout(ok, 1000));
      try { await Store.importer(JSON.stringify({ plateforme: "mhx", version: 2, donnees: { feedbacks: { liste: [{ semaine: "2026-01-05", texte: "faux" }] }, notes_coach: { texte: "fausse note" }, mens: { mesures: [] } } })); return "ok"; } catch (e) { return "erreur " + e.message; }
    });
    const apres = db.ecritures.slice(avant);
    ok("restauration : seule « mens » est réécrite, jamais feedbacks / notes_coach", r === "ok" && apres.length === 1 && apres[0].outil === "mens", r + " " + JSON.stringify(apres.map(e => e.outil + (e.refus ? " (refus)" : ""))));
    await c.close();
  }
  {
    const db = base([fbRecent]);
    /* la langue du compte l'emporte sur celle de l'appareil : Thomas passe en anglais */
    db.lignes.find(x => x.user_id === F.IDS.c1 && x.outil === "prefs").contenu.langue = "en";
    const { c, page } = await contexte(b, thomas, { db, langue: "en" });
    await page.goto(`http://localhost:${PORT}/#/suivi`); await attendre(page, 2000);
    const t = await page.textContent("#suivi-fb-haut");
    ok("client en anglais : « Your coach's feedback », « written on »", t.includes("Your coach's feedback") && t.includes("written on") && t.includes("Previous feedback"), t.slice(0, 200));
    await aller(page, "#/accueil", 1600);
    ok("client en anglais : « Your feedback is available »", (await page.textContent("#acc-vue")).includes("Your feedback is available"));
    await c.close();
  }
  {
    const vieux = JSON.parse(JSON.stringify(fbRecent)); vieux.contenu.liste = [vieux.contenu.liste[0]];
    const db = base([vieux]);
    const { c, page } = await contexte(b, thomas, { db, viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1800);
    ok("feedback ancien : pas de carte sur l'accueil", !(await page.textContent("#acc-vue")).includes("Ton feedback est disponible"));
    await aller(page, "#/suivi", 1600);
    ok("feedback ancien : affiché sous le bilan, sans « nouveau »", (await page.textContent("#suivi-fb-bas")).includes("Ancien feedback") && !(await page.textContent("#suivi-fb-bas")).includes("nouveau") && (await page.textContent("#suivi-fb-haut")).trim() === "");
    ok("mobile : pas de défilement horizontal dans Mon suivi", await page.evaluate(() => document.documentElement.scrollWidth <= 390));
    ok("client : aucune écriture en simple lecture", db.ecritures.length === 0, JSON.stringify(db.ecritures));
    await c.close();
  }
  {
    const db = base();
    const { c, page } = await contexte(b, coach, { db, viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1500);
    await ouvrirFiche(page, F.IDS.c1);
    ok("mobile : fiche avec notes sans défilement horizontal", await page.evaluate(() => document.documentElement.scrollWidth <= 390));
    await page.screenshot({ path: path.join(OUT, "coach-fiche-mobile.png"), fullPage: true });
    await aller(page, "#/bilan", 1500);
    ok("mobile : préparer le call sans défilement horizontal", await page.evaluate(() => document.documentElement.scrollWidth <= 390));
    await c.close();
  }

  await b.close(); server.close(); console.log(res.join("\n"));
})();
