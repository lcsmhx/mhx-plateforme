/* Tests de flux (phase 2) : fenetres de confirmation / saisie, theme.
   Supabase simule : on verifie ce qui PARTIRAIT vers la base sans rien envoyer. */
const http = require("http"); const fs = require("fs"); const path = require("path");
const { chromium } = require("playwright");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || "../index.html");
const OUT = path.resolve(process.argv[3] || "captures/flux");
fs.mkdirSync(OUT, { recursive: true });
const PORT = 9100 + Math.floor(Math.random() * 100);
const server = http.createServer((req, res) => { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(fs.readFileSync(HTML)); });

const resultats = [];
const ok = (nom, cond, detail) => { resultats.push({ test: nom, ok: !!cond, detail: detail || "" }); };

async function contexte(browser, who, viewport, langue) {
  const ecritures = [];
  const ctx = await browser.newContext({ viewport: viewport || { width: 390, height: 844 }, locale: "fr-FR" });
  await ctx.route("**/*", route => {
    const req = route.request(); const u = req.url();
    if (new URL(u).hostname === "localhost") return route.continue();
    if (!new URL(u).hostname.endsWith(".supabase.co")) return route.abort();
    const url = new URL(u); const p = url.pathname, q = url.searchParams, m = req.method();
    const json = (b, st) => route.fulfill({ status: st || 200, contentType: "application/json", body: b === null ? "" : JSON.stringify(b) });
    if (m !== "GET" && !p.startsWith("/auth/")) { ecritures.push(m + " " + p + url.search); return json(null, m === "DELETE" ? 204 : 201); }
    if (p.startsWith("/auth/v1/token")) return json(F.session(who.id, who.email));
    if (p === "/rest/v1/profils") { const id = q.get("id"); return json(id ? F.profils.filter(x => x.id === id.slice(3)) : F.profils); }
    if (p === "/rest/v1/donnees") {
      let l = langue ? F.donnees.map(x => x.outil === "prefs" ? Object.assign({}, x, { contenu: { langue } }) : x) : F.donnees; const uid = q.get("user_id"), o = q.get("outil");
      if (uid) l = l.filter(x => x.user_id === uid.slice(3));
      if (o && o.startsWith("eq.")) l = l.filter(x => x.outil === o.slice(3));
      if (o && o.startsWith("not.in.(")) { const ex = o.slice(8, -1).split(","); l = l.filter(x => ex.indexOf(x.outil) === -1); }
      const sel = (q.get("select") || "*").split(","); if (sel.indexOf("*") === -1) l = l.map(x => Object.fromEntries(sel.map(k => [k, x[k]])));
      return json(l);
    }
    if (p === "/rest/v1/bibliotheque") return json(F.bibliotheque);
    const t = p.replace("/rest/v1/", ""); if (F.catalogue[t]) { let l = F.catalogue[t]; const r = req.headers()["range"]; if (r) { const [a, b] = r.split("-").map(Number); l = l.slice(a, b + 1); } return json(l); }
    return json([]);
  });
  await ctx.addInitScript(({ who, langue }) => { localStorage.setItem("mhx_session", JSON.stringify(who.session)); localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); if (langue) localStorage.setItem("mhx_langue", langue); }, { who, langue: langue || "" });
  const page = await ctx.newPage();
  const erreurs = [];
  page.on("pageerror", e => erreurs.push(String(e).slice(0, 200)));
  page.on("dialog", d => { erreurs.push("DIALOGUE NATIF : " + d.message().slice(0, 80)); d.dismiss(); });
  return { ctx, page, ecritures, erreurs };
}

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch();
  const client = { id: F.IDS.c1, email: "thomas@exemple.fr", session: F.session(F.IDS.c1, "thomas@exemple.fr") };
  const coach = { id: F.IDS.coach, email: "coach@exemple.fr", session: F.session(F.IDS.coach, "coach@exemple.fr") };

  /* 1. Client : mensurations, semaine existante -> fenetre ; Annuler = rien n'est ecrit ; Confirmer = ecriture */
  {
    const { ctx, page, ecritures, erreurs } = await contexte(browser, client);
    await page.goto(`http://localhost:${PORT}/#/mensurations`); await page.waitForLoadState("networkidle"); await page.waitForTimeout(500);
    const ouvrirSaisie = await page.$("#mens-ajouter"); if (ouvrirSaisie) { await ouvrirSaisie.click(); await page.waitForTimeout(300); }
    await page.fill("#e-sem", "4"); await page.fill("#e-poids", "82.1");
    await page.click("#add"); await page.waitForTimeout(400);
    const modale = await page.$(".modale");
    ok("mensurations : fenetre de confirmation affichee", !!modale);
    await page.screenshot({ path: path.join(OUT, "modale-confirmer-mobile.png") });
    await page.keyboard.press("Escape"); await page.waitForTimeout(900);
    ok("mensurations : Echap = fenetre fermee", !(await page.$(".modale")));
    ok("mensurations : Echap = aucune ecriture", ecritures.length === 0, ecritures.join(" | "));
    await page.click("#add"); await page.waitForTimeout(300);
    await page.click(".modale .btn:not(.ghost)"); await page.waitForTimeout(1100);
    ok("mensurations : Confirmer = ecriture de la cle mens", ecritures.some(e => e.indexOf("donnees") > -1), ecritures.join(" | "));
    ok("mensurations : message de succes", (await page.textContent("#msg") || "").indexOf("enregistrée") > -1);
    ok("mensurations : aucune erreur JS ni dialogue natif", erreurs.length === 0, erreurs.join(" | "));
    await ctx.close();
  }
  /* 2. Client : restaurer une sauvegarde -> saisie ; Annuler = rien */
  {
    const { ctx, page, ecritures, erreurs } = await contexte(browser, client, { width: 1280, height: 900 });
    await page.goto(`http://localhost:${PORT}/#/profil`); await page.waitForLoadState("networkidle"); await page.waitForTimeout(400);
    await page.click("#sv-paste"); await page.waitForTimeout(400);
    ok("restauration : fenetre de saisie avec champ", !!(await page.$(".modale #ui-champ")));
    await page.screenshot({ path: path.join(OUT, "modale-demander-desktop.png") });
    await page.click(".modale .btn.ghost"); await page.waitForTimeout(400);
    ok("restauration : Annuler = aucune ecriture", ecritures.length === 0 && !(await page.$(".modale")));
    /* suppression de compte : Continuer puis mot faux -> rien n'est supprime */
    await page.click("#sv-suppr"); await page.waitForTimeout(300);
    await page.click(".modale .btn.danger"); await page.waitForTimeout(300);
    await page.fill("#ui-champ", "non"); await page.keyboard.press("Enter"); await page.waitForTimeout(400);
    ok("suppression : mot faux = pas d'appel serveur", !ecritures.some(e => e.indexOf("supprimer-acces") > -1), ecritures.join(" | "));
    ok("suppression : message d'avertissement", (await page.textContent("#sv-suppr-msg") || "").indexOf("rien") > -1);
    ok("client : aucune erreur JS ni dialogue natif", erreurs.length === 0, erreurs.join(" | "));
    await ctx.close();
  }
  /* 3. Coach : bibliotheque, Supprimer -> Annuler puis Confirmer */
  {
    const { ctx, page, ecritures, erreurs } = await contexte(browser, coach, { width: 1280, height: 900 });
    await page.goto(`http://localhost:${PORT}/#/bibliotheque`); await page.waitForLoadState("networkidle"); await page.waitForTimeout(500);
    await page.click("[data-suppr]"); await page.waitForTimeout(300);
    ok("bibliotheque : fenetre danger", !!(await page.$(".modale .btn.danger")));
    await page.screenshot({ path: path.join(OUT, "modale-danger-desktop.png") });
    await page.click(".fond", { position: { x: 5, y: 5 } }); await page.waitForTimeout(300);
    ok("bibliotheque : clic a cote = ferme sans supprimer", !(await page.$(".modale")) && ecritures.length === 0);
    await page.click("[data-suppr]"); await page.waitForTimeout(300);
    await page.click(".modale .btn.danger"); await page.waitForTimeout(600);
    ok("bibliotheque : Confirmer = DELETE simule", ecritures.some(e => e.startsWith("DELETE /rest/v1/bibliotheque")), ecritures.join(" | "));
    /* theme : bascule + persistance */
    await page.click("#theme"); await page.waitForTimeout(200);
    ok("theme : clair applique", (await page.getAttribute("html", "data-theme")) === "light");
    await page.reload(); await page.waitForLoadState("networkidle"); await page.waitForTimeout(400);
    ok("theme : clair conserve apres rechargement", (await page.getAttribute("html", "data-theme")) === "light");
    await page.screenshot({ path: path.join(OUT, "coach-bibliotheque-clair.png") });
    await page.click("#theme"); await page.waitForTimeout(200);
    ok("theme : retour au sombre", (await page.getAttribute("html", "data-theme")) === null);
    ok("coach : aucune erreur JS ni dialogue natif", erreurs.length === 0, erreurs.join(" | "));
    await ctx.close();
  }
  /* 4. Anglais : les boutons de fenetre sont traduits */
  {
    const { ctx, page } = await contexte(browser, client, null, "en");
    await page.goto(`http://localhost:${PORT}/#/mensurations`); await page.waitForLoadState("networkidle"); await page.waitForTimeout(500);
    const os2 = await page.$("#mens-ajouter"); if (os2) { await os2.click(); await page.waitForTimeout(300); }
    await page.fill("#e-sem", "4"); await page.fill("#e-poids", "82.1"); await page.click("#add"); await page.waitForTimeout(400);
    const boutons = await page.$$eval(".modale .btn", l => l.map(b => b.textContent.trim()));
    ok("anglais : boutons Cancel / Replace", boutons.indexOf("Cancel") > -1 && boutons.indexOf("Yes, replace") > -1, boutons.join(", "));
    await page.screenshot({ path: path.join(OUT, "modale-en-mobile.png") });
    await ctx.close();
  }
  await browser.close(); server.close();
  const rates = resultats.filter(r => !r.ok);
  console.log(JSON.stringify({ total: resultats.length, reussis: resultats.length - rates.length, rates }, null, 2));
  resultats.forEach(r => console.log((r.ok ? "  ✓ " : "  ✗ ") + r.test + (r.ok ? "" : "  — " + r.detail)));
})().catch(e => { console.error(e); process.exit(1); });
