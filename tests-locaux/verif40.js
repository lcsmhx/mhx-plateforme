/* v40 — phase 16 : mode gratuit (prospects), écrans verrouillés et Calendly.
   Supabase simulé : la colonne statut existe (sauf option sansStatut), un compte
   créé par la base naît « prospect », seul le coach change un statut.
   Usage : node verif40.js ../index.html                                         */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const PORT = 9671;
const OUT = path.join(__dirname, "captures", "v40"); fs.mkdirSync(OUT, { recursive: true });
let inscriptionLibre = false;
const server = http.createServer((req, res) => {
  let h = fs.readFileSync(HTML, "utf8");
  if (inscriptionLibre) h = h.replace("inscription_libre: false", "inscription_libre: true");
  res.writeHead(200, { "Content-Type": "text/html" }); res.end(h);
});
const res = []; const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
const PROSPECT = "00000000-0000-4000-8000-000000000c04", EQUIPE = "00000000-0000-4000-8000-0000000000e1", NOUVEAU = "00000000-0000-4000-8000-000000000c05";

function base(opts) {
  opts = opts || {};
  const profils = JSON.parse(JSON.stringify(F.profils)).concat([
    { id: PROSPECT, prenom: "Léa", nom: "Démo", role: "client", cree_le: "2026-09-24T10:00:00Z" },
    { id: EQUIPE, prenom: "Équipe", nom: "Démo", role: "coach", cree_le: "2026-09-02T10:00:00Z" }
  ]);
  if (!opts.sansStatut) profils.forEach(p => { p.statut = p.id === PROSPECT ? "prospect" : "client"; });
  const donnees = JSON.parse(JSON.stringify(F.donnees));
  /* Léa (prospect) a rempli son questionnaire : sinon l'app l'ouvre d'office à la connexion */
  donnees.push({ user_id: PROSPECT, outil: "intake", contenu: { nom: "Léa Démo", age: 27, sexe: "Femme", taille: 168, poids: 64, objectif: "Perte de poids / sèche", complet: true }, maj_le: "2026-09-24T10:00:00+00:00" });
  return { profils, donnees, patchs: [], fonctions: [], inscriptions: [] };
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
    if (p.startsWith("/auth/v1/signup")) {
      const corps = JSON.parse(req.postData() || "{}"); db.inscriptions.push(corps);
      if (opts.inscriptionKo) return json({ msg: "Signups not allowed for this instance" }, 422);
      const id = "00000000-0000-4000-8000-00000000abcd";
      /* le declencheur de la base : profil avec prenom / nom, statut par defaut « prospect » */
      db.profils.push(Object.assign({ id, prenom: corps.data.prenom, nom: corps.data.nom, role: "client", cree_le: new Date().toISOString() }, "statut" in db.profils[0] ? { statut: "prospect" } : {}));
      return json(F.session(id, corps.email));
    }
    if (p.startsWith("/auth/v1/token")) return json(who ? F.session(who.id, who.email) : { error: "invalid" }, who ? 200 : 400);
    if (p.startsWith("/auth/v1/")) return json({});
    if (p === "/functions/v1/creer-acces") {
      const corps = JSON.parse(req.postData() || "{}"); db.fonctions.push(corps);
      db.profils.push(Object.assign({ id: NOUVEAU, prenom: corps.prenom, nom: corps.nom, role: corps.role === "coach" ? "coach" : "client", cree_le: new Date().toISOString() }, "statut" in db.profils[0] ? { statut: "prospect" } : {}));
      return json({ id: NOUVEAU, email: corps.email, role: corps.role });
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
      const id = q.get("id"); return json(id ? db.profils.filter(x => x.id === id.slice(3)) : db.profils);
    }
    if (p === "/rest/v1/donnees") {
      if (m !== "GET") return json(null, 201);
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
  page.lectures = [];
  page.on("request", rq => { if (rq.url().includes("/rest/v1/donnees")) page.lectures.push(decodeURIComponent(rq.url())); });
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of 4\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF"); d.dismiss(); });
  return { c, page };
}
const coach = { id: F.IDS.coach, email: "c@e.fr", session: F.session(F.IDS.coach, "c@e.fr") };
const attendre = (page, ms) => page.waitForTimeout(ms);
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1400); };
const ligneCompte = (page, nom) => page.locator("#liste-clients .client-l", { hasText: nom });

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();
  const lea = { id: PROSPECT, email: "l@e.fr", session: F.session(PROSPECT, "l@e.fr") };
  const thomas = { id: F.IDS.c1, email: "t@e.fr", session: F.session(F.IDS.c1, "t@e.fr") };
  const VERROUILLES = ["programme", "nutrition", "mensurations", "suivi", "complements", "bilan", "formation"];   // v44 : la formation attend la fin du challenge
  const CAL = "https://calendly.com/mhx-coaching/30min";

  /* ---------- A. Prospect ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/accueil`); await attendre(page, 1800);
    const acc = await page.textContent("#acc-vue");
    ok("prospect : accueil = hub du Challenge 7 jours (v44 : Bonjour, Challenge 7 jours, Ton espace)", acc.includes("Bonjour") && acc.includes("Challenge 7 jours") && acc.includes("Ton espace"));
    await page.screenshot({ path: path.join(OUT, "prospect-accueil.png"), fullPage: true });
    ok("prospect : accueil sans « Réserver mon appel » avant le jour 5 (v44 : CTA progressifs)", !(await page.$(`#acc-vue a[href="${CAL}"]`)));
    let textes = await page.evaluate(() => document.body.innerText);
    const cadenas = await page.$$eval("#nav a", l => l.filter(a => a.querySelector(".nav-cadenas")).map(a => a.dataset.id));
    ok("prospect : chaque onglet verrouillé est annoncé « (verrouillé) » aux lecteurs d'écran", await page.$$eval("#nav a", l => l.filter(a => a.querySelector(".nav-cadenas")).every(a => (a.querySelector(".sr-only") || {}).textContent === " (verrouillé)")));
    const barre = await page.$$eval("#barre-bas a", l => l.map(a => a.dataset.id));
    ok("prospect : barre du bas = accueil, challenge, profil, puis un onglet verrouillé (v44)", JSON.stringify(barre) === '["accueil","challenge","profil","programme"]', JSON.stringify(barre));
    /* v50 : la navigation ne garde que la vitrine (programme, nutrition, formation) ; les autres onglets verrouilles sont caches, leur adresse reste verrouillee (boucle ci-dessous) */
    ok("prospect : cadenas sur la vitrine (programme, nutrition, formation), onglets sans intérêt cachés, rien sur accueil / challenge / profil", ["programme", "nutrition", "formation"].every(x => cadenas.includes(x)) && !cadenas.some(x => ["mensurations", "suivi", "complements"].includes(x)) && !cadenas.some(x => ["accueil", "challenge", "profil"].includes(x)), JSON.stringify(cadenas));
    for (const r of VERROUILLES) {
      page.lectures.length = 0;
      await aller(page, "#/" + r, 1200);
      const v = await page.$("#vue .verrou");
      const lien = v ? await page.$eval("#vue .verrou a", a => a.href).catch(() => "") : "";
      const lu = page.lectures.filter(u => u.includes("outil=eq.") || u.includes("outil=in.("));
      /* v44 : la formation renvoie vers le challenge (elle s'ouvre a la fin), les autres vers Calendly */
      ok(`prospect : #/${r} verrouillé (cadenas + ${r === "formation" ? "lien vers le challenge" : "Calendly"}), aucune donnée lue`, !!v && (r === "formation" ? /#\/challenge$/.test(lien) : lien === CAL) && lu.length === 0, lien + " | " + lu.join(" ; "));
      textes += "\n" + await page.evaluate(() => document.body.innerText);
    }
    for (const r of ["challenge", "profil"]) {
      await aller(page, "#/" + r, 1300);
      ok(`prospect : #/${r} ouvert`, !(await page.$("#vue .verrou")));
      textes += "\n" + await page.evaluate(() => document.body.innerText);
    }
    ok("prospect : aucun prix affiché sur aucune des pages visitées (€, prix, tarif)", !/€|\bprix\b|tarif/i.test(textes));
    /* v44 : le prospect n'a plus le questionnaire complet dans Profil (il arrive avec l'accompagnement) */
    await aller(page, "#/profil", 1300);
    ok("prospect : profil allégé (v44) — pas de questionnaire complet, bloc « Mon compte »", !(await page.$("#p-save")) && (await page.textContent("#vue")).includes("Mon compte"));
    await c.close();
  }
  {
    /* mobile : barre du bas avec cadenas, pas de débordement */
    const db = base();
    const { c, page } = await contexte(b, lea, db, { viewport: { width: 390, height: 844 } });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1800);
    ok("prospect mobile : onglets verrouillés marqués dans la barre du bas", (await page.$$("#barre-bas a.verrouille")).length >= 1);
    await aller(page, "#/programme", 1200);
    ok("prospect mobile : page verrouillée sans défilement horizontal", await page.evaluate(() => document.documentElement.scrollWidth <= 390));
    await page.screenshot({ path: path.join(OUT, "prospect-programme-mobile.png"), fullPage: true });
    await c.close();
  }
  for (const largeur of [800, 1024]) {
    /* tablette / petite fenetre : la barre du haut (avec « (verrouillé) » pour les lecteurs d'ecran) ne deborde pas */
    const db = base();
    const { c, page } = await contexte(b, lea, db, { viewport: { width: largeur, height: 800 } });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1800);
    const d = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
    ok(`prospect ${largeur} px : aucun défilement horizontal (barre du haut avec cadenas)`, d.s <= d.c, JSON.stringify(d));
    await c.close();
  }
  {
    /* anglais */
    const db = base();
    db.donnees.push({ user_id: PROSPECT, outil: "prefs", contenu: { langue: "en" }, maj_le: "2026-09-24T10:00:00+00:00" });
    const { c, page } = await contexte(b, lea, db, { langue: "en" });
    await page.goto(`http://localhost:${PORT}/#/programme`); await attendre(page, 2000);
    const t = await page.textContent("#vue");
    ok("prospect en anglais : « This feature is available with MHX coaching. » et « Book my call »", t.includes("This feature is available with MHX coaching.") && t.includes("Book my call"), t.slice(0, 200));
    await aller(page, "#/accueil", 1500);
    ok("prospect en anglais : accueil « 7-Day Challenge », « Your starting point » (v44)", (await page.textContent("#acc-vue")).includes("7-Day Challenge") && (await page.textContent("#acc-vue")).includes("Your starting point"));
    await c.close();
  }

  /* ---------- B. Client, coach, base sans statut : rien ne change ---------- */
  {
    const { c, page } = await contexte(b, thomas, base());
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1800);
    ok("client : aucun cadenas dans la navigation", (await page.$$("#nav .nav-cadenas")).length === 0);
    const barreC = await page.$$eval("#barre-bas a", l => l.map(a => a.dataset.id));
    ok("client : barre du bas inchangée (ses onglets principaux)", JSON.stringify(barreC) === '["accueil","programme","nutrition","mensurations"]', JSON.stringify(barreC));
    await aller(page, "#/programme", 1500);
    ok("client : son programme s'affiche (pas de verrou)", !(await page.$("#vue .verrou")) && (await page.textContent("#vue")).includes("Séance"));
    await c.close();
  }
  {
    const { c, page } = await contexte(b, coach, base());
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2000);
    await page.click(`[data-ouvrir="${PROSPECT}"]`); await attendre(page, 1500);
    await aller(page, "#/programme", 1500);
    ok("coach dans la fiche d'un prospect : rien n'est verrouillé", !(await page.$("#vue .verrou")) && (await page.$$("#nav .nav-cadenas")).length === 0);
    await c.close();
  }
  {
    const { c, page } = await contexte(b, lea, base({ sansStatut: true }));
    await page.goto(`http://localhost:${PORT}/#/programme`); await attendre(page, 1800);
    ok("base sans colonne statut : personne n'est prospect, rien n'est verrouillé", !(await page.$("#vue .verrou")) && (await page.$$("#nav .nav-cadenas")).length === 0);
    await c.close();
  }
  await b.close(); server.close(); console.log(res.join("\n"));
})();
