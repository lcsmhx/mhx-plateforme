/* Injection HTML depuis les données d'un client (correctif 37.1 / v38).
   Un client peut écrire, par l'API, n'importe laquelle de ses propres lignes
   `donnees` (et son prénom). Ce test piège ces données avec une balise qui
   s'exécuterait si elle était insérée sans échappement, puis ouvre les écrans
   du coach (fiche, préparer le call, son suivi, ses courbes, ses séances, son
   programme, ses repas) et ceux du client. Attendu : rien ne s'exécute.
   Usage : node verif-xss.js ../index.html   (sur une version non corrigée, il
   doit signaler des injections : c'est ce qui prouve qu'il teste vraiment). */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const server = http.createServer((req, res) => { res.writeHead(200, { "Content-Type": "text/html" }); res.end(fs.readFileSync(HTML)); });
const PORT = 9669;
const res = []; const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
const PIEGE = '<img src="x" data-xss="1" onerror="window.__xss=(window.__xss||0)+1">';
const clone = (x) => JSON.parse(JSON.stringify(x));
const ligne = (uid, outil) => F.donnees.find(x => x.user_id === uid && x.outil === outil);

/* données piégées : une copie des fixtures, modifiée champ par champ */
function donneesPiegees() {
  const l = clone(F.donnees);
  const get = (uid, outil) => l.find(x => x.user_id === uid && x.outil === outil);
  /* Thomas : bilan hebdo (échelle + date d'envoi), cartes repas (temps, inconnus, grammes) */
  const ck = get(F.IDS.c1, "checkins").contenu.liste;
  ck[ck.length - 1].reponses.energie = PIEGE;
  ck.push({ semaine: "2026-09-21", fin: "2026-09-27", envoye_le: PIEGE, reponses: { energie: 3, motivation: 3, sommeil: 3, stress: 3 } });
  const carte = get(F.IDS.c1, "repas").contenu.jours[0].repas[0];
  carte.temps_min = PIEGE; carte.inconnus = PIEGE; carte.ingredients[0].grammes = '">' + PIEGE;
  /* Sarah : mesures (numéro de semaine, avec composition) et diète dont un jour a « repas » en objet */
  const m = get(F.IDS.c2, "mens").contenu.mesures;
  m[m.length - 1].sem = PIEGE; m[m.length - 1].compo = { mg: 30.1, mm: 45.2 };
  l.push({ user_id: F.IDS.c2, outil: "repas", contenu: { nom: "", note: "", cible: { kcal: 1800, prot: 120, gluc: 180, lip: 60 }, regime: "Omnivore", allergenes: [], nb_repas: 3, maj: "01/09/2026",
    jours: [{ nom: "Lundi", repas: { length: PIEGE }, manquants: [], complement: null, diagnostic: [] }] }, maj_le: "2026-09-20T00:30:00+00:00" });
  l.push({ user_id: F.IDS.c2, outil: "repas_suivi", contenu: { date: "2026-09-20", mange: {}, courses: {}, joursCourses: {}, hist: { "2026-09-22": { c: 1, p: 3 }, "2026-09-23": { c: 2, p: 3 } } }, maj_le: "2026-09-23T00:30:00+00:00" });
  /* Julien : journal (exos en objet) et journal du coach « perf » (historique piégé) */
  l.push({ user_id: F.IDS.c3, outil: "journal", contenu: { seances: [{ date: "2026-09-20", si: 0, nom: "Séance A", exos: { length: PIEGE } }] }, maj_le: "2026-09-20T00:30:00+00:00" });
  l.push({ user_id: F.IDS.c3, outil: "programme", contenu: clone(ligne(F.IDS.c1, "programme").contenu), maj_le: "2026-09-01T00:30:00+00:00" });
  l.push({ user_id: F.IDS.c3, outil: "perf", contenu: { date: "", courante: 0, seances: [{ nom: "Séance 1", ex: [] }], historique: [{ si: 0, nom: "Séance 1", vol: 100, date: "2026-09-20", exos: { length: PIEGE }, series: PIEGE }] }, maj_le: "2026-09-20T00:30:00+00:00" });
  return l;
}

async function contexte(b, who, lignes) {
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await c.route("**/*", r => {
    const req = r.request(); const u = req.url();
    if (new URL(u).hostname === "localhost") return r.continue();
    if (!new URL(u).hostname.endsWith(".supabase.co")) return r.abort();
    const url = new URL(u); const p = url.pathname, q = url.searchParams, m = req.method();
    const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", body: body === null ? "" : JSON.stringify(body) });
    if (p.startsWith("/auth/v1/token")) return json(F.session(who.id, who.email));
    if (p.startsWith("/auth/v1/")) return json({});
    if (m !== "GET") return json(null, 201);
    if (p === "/rest/v1/profils") { const id = q.get("id"); return json(id ? F.profils.filter(x => x.id === id.slice(3)) : F.profils); }
    if (p === "/rest/v1/donnees") {
      const coach = who.id === F.IDS.coach;
      let l = lignes.filter(x => coach || (x.user_id === who.id && x.outil !== "notes_coach"));
      const uid = q.get("user_id"), o = q.get("outil") || "";
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
  await c.addInitScript(s => { localStorage.setItem("mhx_session", JSON.stringify(s)); localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); }, who.session);
  const page = await c.newPage();
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(String(e).slice(0, 160)));
  page.on("dialog", d => d.dismiss());
  return { c, page, erreurs };
}
const compter = (page) => page.evaluate(() => ({ exec: window.__xss || 0, balises: document.querySelectorAll("img[data-xss]").length }));

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();
  const lignes = donneesPiegees();
  const coach = { id: F.IDS.coach, email: "c@e.fr", session: F.session(F.IDS.coach, "c@e.fr") };
  const pages = [
    [F.IDS.c1, ["accueil", "bilan", "suivi", "nutrition"]],
    [F.IDS.c2, ["accueil", "suivi", "mensurations", "bilan"]],
    [F.IDS.c3, ["accueil", "programme", "entrainement", "suivi"]]
  ];
  let total = { exec: 0, balises: 0 }; const touches = [];
  {
    const { c, page, erreurs } = await contexte(b, coach, lignes);
    await page.goto(`http://localhost:${PORT}/`); await page.waitForTimeout(1800);
    for (const [uid, routes] of pages) {
      await page.evaluate(() => { location.hash = "#/clients"; }); await page.waitForTimeout(1500);
      await page.click(`[data-ouvrir="${uid}"]`); await page.waitForTimeout(1500);
      for (const r of routes) {
        await page.evaluate(h => { location.hash = h; }, "#/" + r); await page.waitForTimeout(1500);
        /* en édition de repas, les grammages deviennent des champs */
        if (r === "nutrition") { const ed = await page.$("[data-editer], [data-rep-editer], .btn-editer"); if (ed) { await ed.click().catch(() => {}); await page.waitForTimeout(600); } }
        const n = await compter(page);
        if (n.exec || n.balises) touches.push(`coach › ${uid.slice(-3)} › ${r} (${n.balises} balise(s))`);
        total.balises += n.balises;
      }
    }
    total.exec += (await compter(page)).exec;
    await page.evaluate(() => { location.hash = "#/tableau"; }); await page.waitForTimeout(1500);
    const n = await compter(page); total.exec = Math.max(total.exec, n.exec); if (n.balises) touches.push("coach › tableau");
    ok("écrans du coach : aucune balise injectée depuis les données d'un client", total.balises === 0 && !touches.length, touches.join(" | "));
    ok("écrans du coach : aucun script exécuté", total.exec === 0, "exécutions : " + total.exec);
    if (erreurs.length) res.push("  · info : erreurs JS côté coach (données volontairement malformées) : " + Array.from(new Set(erreurs)).slice(0, 3).join(" | "));
    await c.close();
  }
  for (const [uid, routes] of pages) {
    const who = { id: uid, email: "x@e.fr", session: F.session(uid, "x@e.fr") };
    const { c, page } = await contexte(b, who, lignes);
    await page.goto(`http://localhost:${PORT}/`); await page.waitForTimeout(1800);
    const t = [];
    for (const r of routes.filter(x => x !== "entrainement" && x !== "bilan")) {
      await page.evaluate(h => { location.hash = h; }, "#/" + r); await page.waitForTimeout(1300);
      const n = await compter(page); if (n.exec || n.balises) t.push(r);
    }
    ok(`écrans du client ${uid.slice(-3)} : rien d'injecté`, !t.length, t.join(", "));
    await c.close();
  }
  await b.close(); server.close(); console.log(res.join("\n"));
})();
