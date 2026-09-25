/* v43 — deux défauts d'affichage côté coach, relevés par Lucas sur la v42 :
   1. un compte sans prénom ni nom s'affichait avec son identifiant (« 9df6bb84 »,
      initiale « 9 ») : il s'affiche désormais « Sans nom » partout (tableau de
      bord, Mes clients, Comptes, fiche, bandeau, fil d'Ariane, fenêtres de
      confirmation), avec un avatar neutre ;
   2. un compte qui n'a jamais rien saisi était compté « Sans nouvelles depuis
      10 jours ou plus » : il est classé à part (« Jamais rien saisi »).
   Supabase simulé (aucun appel réel), toute écriture est journalisée.
   Usage : node verif43.js ../index.html                                          */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const PORT = 9675;
const server = http.createServer((req, res) => { res.writeHead(200, { "Content-Type": "text/html" }); res.end(fs.readFileSync(HTML)); });
const res = []; const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
/* Deux comptes de plus que les fixtures : N1 sans prénom ni nom et sans aucune
   donnée (le cas relevé par Lucas), N2 « Nadia Démo » sans aucune donnée. */
const N1 = "deadbeef-0000-4000-8000-000000000e01", N2 = "deadbeef-0000-4000-8000-000000000e02";
const MARQUE = N1.slice(0, 8);   // ce que la v42 affichait à la place du nom
const base = () => ({ profils: JSON.parse(JSON.stringify(F.profils)).map(p => Object.assign({ statut: "client" }, p)), donnees: JSON.parse(JSON.stringify(F.donnees)) });
const avec = base();
avec.profils.push({ id: N1, prenom: null, nom: null, role: "client", cree_le: "2026-09-24T10:00:00Z", statut: "client" });
avec.profils.push({ id: N2, prenom: "Nadia", nom: "Démo", role: "client", cree_le: "2026-09-24T11:00:00Z", statut: "client" });
const avecN2 = base();
avecN2.profils.push({ id: N2, prenom: "Nadia", nom: "Démo", role: "client", cree_le: "2026-09-24T11:00:00Z", statut: "client" });

async function contexte(b, who, erreurs, jeu) {
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const coach = who.id === F.IDS.coach;
  await c.route("**/*", async r => {
    const req = r.request(); const url = new URL(req.url());
    if (url.hostname === "localhost") return r.continue();
    if (!url.hostname.endsWith(".supabase.co")) return r.abort();
    const p = url.pathname, q = url.searchParams, m = req.method();
    const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", body: body === null ? "" : JSON.stringify(body) });
    if (p.startsWith("/auth/v1/token")) return json(F.session(who.id, who.email));
    if (p.startsWith("/auth/v1/")) return json({});
    if (p.startsWith("/storage/v1/")) return json({ statusCode: "404", error: "not_found", message: "Object not found" }, 400);
    if (p.startsWith("/functions/v1/")) { erreurs.ecritures.push(m + " " + p); return json({}, 200); }
    if (p === "/rest/v1/profils") {
      if (m !== "GET") { erreurs.ecritures.push(m + " profils " + (req.postData() || "").slice(0, 200)); return json([], 200); }
      const id = q.get("id"); return json(id ? jeu.profils.filter(x => x.id === id.slice(3)) : (coach ? jeu.profils : jeu.profils.filter(x => x.id === who.id)));
    }
    if (p === "/rest/v1/donnees") {
      if (m !== "GET") { erreurs.ecritures.push(m + " " + (req.postData() || "").slice(0, 600)); return json(null, 201); }
      const uid = q.get("user_id"), o = q.get("outil") || "";
      let l = jeu.donnees.filter(x => coach || (x.user_id === who.id && x.outil !== "notes_coach"));
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
  await c.addInitScript(({ s }) => { localStorage.setItem("mhx_session", JSON.stringify(s)); localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); }, { s: who.session });
  const page = await c.newPage();
  page.on("pageerror", e => erreurs.js.push(erreurs.ici + " : " + String(e).slice(0, 160)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of 4\d\d/.test(msg.text())) erreurs.js.push(erreurs.ici + " : console " + msg.text().slice(0, 160)); });
  page.on("dialog", d => { erreurs.js.push(erreurs.ici + " : dialogue natif"); d.dismiss(); });
  return { c, page };
}
const attendre = (page, ms) => page.waitForTimeout(ms);
/* texte d'un élément, blancs repliés ; "" s'il n'existe pas (sans attendre) */
const texte = async (page, sel) => ((await page.$eval(sel, e => e.textContent).catch(() => "")) || "").replace(/\s+/g, " ").trim();
const flagsDe = (page) => page.$$eval("#alertes-clients .flag", l => l.map(x => x.textContent.replace(/\s+/g, " ").trim()));

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();
  const coach = { id: F.IDS.coach, email: "c@e.fr", session: F.session(F.IDS.coach, "c@e.fr") };

  /* ---------- avec les deux comptes de plus ---------- */
  {
    const E = { js: [], ecritures: [], ici: "" };
    const { c, page } = await contexte(b, coach, E, avec);

    /* --- tableau de bord --- */
    E.ici = "tableau de bord"; await page.goto(`http://localhost:${PORT}/#/tableau`); await attendre(page, 2200);
    const tb = await texte(page, "#tb-vue");
    ok("tableau de bord : le compte sans prénom ni nom s'affiche « Sans nom »", tb.includes("Sans nom"), tb.slice(0, 200));
    ok("tableau de bord : son identifiant n'apparaît nulle part", !tb.includes(MARQUE));
    ok("tableau de bord : 5 clients actifs (les deux comptes ajoutés comptent)", /Clients actifs\s*5/.test(tb), tb.slice(0, 120));
    const carte = await page.$(`.attention-c:has([data-fiche="${N1}"])`);
    ok("tableau de bord : le compte sans nom a sa carte dans « Qui nécessite ton attention »", !!carte);
    const av = carte ? await carte.$eval(".avatar", e => ({ cls: e.className, txt: e.textContent.trim() })) : null;
    ok("tableau de bord : avatar neutre « ? » (classe neutre), pas l'initiale de l'identifiant", !!av && av.cls.split(/\s+/).includes("neutre") && av.txt === "?", JSON.stringify(av));
    const avJ = await page.$eval(`.attention-c:has([data-fiche="${F.IDS.c3}"]) .avatar`, e => ({ cls: e.className, txt: e.textContent.trim() })).catch(() => null);
    ok("tableau de bord : Julien Démo garde ses initiales « JD », avatar normal", !!avJ && avJ.txt === "JD" && !avJ.cls.includes("neutre"), JSON.stringify(avJ));
    const carteT = carte ? (await carte.textContent()).replace(/\s+/g, " ") : "";
    ok("tableau de bord : sa carte dit « jamais rien saisi », jamais « Inactif depuis »", carteT.includes("jamais rien saisi") && carteT.includes("Jamais rien saisi") && !/Inactif depuis/.test(carteT), carteT.slice(0, 200));
    const nomBtn = carte ? await carte.$eval('[data-cible="accueil"]', e => e.dataset.nom) : null;
    ok("tableau de bord : le bouton « Ouvrir » porte le nom « Sans nom »", nomBtn === "Sans nom", nomBtn);

    /* --- Mes clients --- */
    E.ici = "Mes clients"; await page.evaluate(() => { location.hash = "#/clients"; }); await attendre(page, 2200);
    const vue = await texte(page, "#vue");
    ok("Mes clients : aucun identifiant de compte affiché", !vue.includes(MARQUE));
    const ligne = await page.$(`#tb-clients tr:has([data-ouvrir="${N1}"])`);
    const ligneT = ligne ? (await ligne.textContent()).replace(/\s+/g, " ") : "";
    ok("Mes clients : la ligne du compte sans nom dit « Sans nom », activité « jamais »", ligneT.includes("Sans nom") && ligneT.includes("jamais"), ligneT.slice(0, 200));
    const flags = await flagsDe(page);
    const sansNouvelles = flags.find(t => t.startsWith("Sans nouvelles depuis 10 jours ou plus")) || "";
    const jamais = flags.find(t => t.startsWith("Jamais rien saisi")) || "";
    ok("Mes clients : encadré « Jamais rien saisi » à part, avec Sans nom et Nadia Démo", jamais.includes("Sans nom") && jamais.includes("Nadia Démo"), jamais || flags.join(" | "));
    ok("Mes clients : « Sans nouvelles depuis 10 jours ou plus » ne cite que Julien (12 j)", sansNouvelles.includes("Julien Démo") && !sansNouvelles.includes("Sans nom") && !sansNouvelles.includes("Nadia"), sansNouvelles || flags.join(" | "));
    ok("Mes clients : Julien n'est pas dans « Jamais rien saisi »", !jamais.includes("Julien"));
    ok("Mes clients : deux comptes → « Ces comptes n'ont encore rien enregistré »", jamais.includes("Ces comptes n'ont encore rien enregistré"), jamais);
    const comptes = await texte(page, "#liste-clients");
    ok("Comptes : « Sans nom » et « pas encore utilisé », sans identifiant", comptes.includes("Sans nom") && comptes.includes("pas encore utilisé") && !comptes.includes(MARQUE), comptes.slice(0, 200));

    /* --- fenêtres de Comptes : le nom y est « Sans nom » ; on annule, rien n'est écrit --- */
    const rangee = await page.$(`#liste-clients .client-l:has-text("Sans nom")`);
    ok("Comptes : la rangée du compte sans nom existe", !!rangee);
    if (rangee) {
      await (await rangee.$(".suppr")).click(); await attendre(page, 500);
      const corps = await texte(page, ".modale .corps");
      ok("Comptes / Supprimer : la fenêtre parle de « Sans nom », plus de « ce compte »", corps.includes("le compte de Sans nom") && !corps.includes("ce compte") && !corps.includes(MARQUE), corps.slice(0, 160));
      await page.keyboard.press("Escape"); await attendre(page, 400);
      ok("Comptes / Supprimer : Échap ferme la fenêtre", !(await page.$(".modale")));
      await (await rangee.$(".statut")).click(); await attendre(page, 500);
      const corps2 = await texte(page, ".modale .corps");
      ok("Comptes / Repasser prospect : la fenêtre parle de « Sans nom »", corps2.includes("Repasser Sans nom en prospect"), corps2.slice(0, 160));
      await page.keyboard.press("Escape"); await attendre(page, 400);
    }

    /* --- fiche du compte sans nom, ouverte depuis Mes clients --- */
    E.ici = "fiche"; await page.click(`[data-ouvrir="${N1}"]`); await attendre(page, 2000);
    const h1 = await texte(page, "#acc-vue h1");
    ok("fiche : le titre est « Sans nom »", h1.startsWith("Sans nom"), h1);
    const bandeau = await texte(page, ".bandeau-tete strong");
    ok("fiche : le bandeau dit « Fiche — Sans nom » (ni « ce client », ni l'identifiant)", bandeau === "Fiche — Sans nom", bandeau);
    const fiche = await texte(page, "#vue");
    ok("fiche : aucun identifiant affiché, activité « jamais rien saisi »", !fiche.includes(MARQUE) && fiche.includes("jamais rien saisi"), fiche.slice(0, 200));
    await page.evaluate(() => { location.hash = "#/programme"; }); await attendre(page, 1600);
    const eb1 = await texte(page, ".masthead .eyebrow");
    ok("fiche / Son programme : le fil d'Ariane commence par « Sans nom — »", eb1.startsWith("Sans nom — "), eb1);

    /* --- « Préparer le call » depuis Mes clients --- */
    E.ici = "préparer le call"; await page.evaluate(() => { location.hash = "#/clients"; }); await attendre(page, 2000);
    await page.click(`[data-bilan="${N1}"]`); await attendre(page, 1800);
    const eb2 = await texte(page, ".masthead .eyebrow");
    ok("Préparer le call : le fil d'Ariane commence par « Sans nom — »", eb2.startsWith("Sans nom — "), eb2);

    /* --- « Ouvrir sa fiche » depuis Comptes --- */
    E.ici = "ouvrir sa fiche"; await page.evaluate(() => { location.hash = "#/clients"; }); await attendre(page, 2000);
    const bOuvrir = await page.$(`#liste-clients .client-l:has-text("Sans nom") .voir:not(.role):not(.statut):not(.suppr)`);
    if (bOuvrir) { await bOuvrir.click(); await attendre(page, 1800); }
    const eb3 = await texte(page, ".masthead .eyebrow"), band3 = await texte(page, ".bandeau-tete strong");
    ok("Comptes → Ouvrir sa fiche : « Sans nom » dans le fil d'Ariane et le bandeau (plus « ce client »)", !!bOuvrir && eb3.startsWith("Sans nom — ") && band3 === "Fiche — Sans nom", eb3 + " / " + band3);

    ok("coach : aucune erreur JS", E.js.length === 0, E.js.join(" | "));
    ok("coach : aucune écriture (fenêtres annulées, fiches en lecture)", E.ecritures.length === 0, E.ecritures.join(" | "));
    await c.close();
  }

  /* ---------- un seul compte muet : formulation au singulier ---------- */
  {
    const E = { js: [], ecritures: [], ici: "un seul compte muet" };
    const { c, page } = await contexte(b, coach, E, avecN2);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2200);
    const flags = await flagsDe(page);
    const jamais = flags.find(t => t.startsWith("Jamais rien saisi")) || "";
    ok("un seul compte muet : « Jamais rien saisi : Nadia Démo. Ce compte n'a encore rien enregistré… »", jamais.startsWith("Jamais rien saisi : Nadia Démo.") && jamais.includes("Ce compte n'a encore rien enregistré"), jamais || flags.join(" | "));
    ok("un seul compte muet : aucune erreur JS, aucune écriture", E.js.length === 0 && E.ecritures.length === 0, E.js.concat(E.ecritures).join(" | "));
    await c.close();
  }

  /* ---------- témoin : les fixtures seules, rien ne change ---------- */
  {
    const E = { js: [], ecritures: [], ici: "témoin" };
    const { c, page } = await contexte(b, coach, E, base());
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2200);
    const flags = await flagsDe(page);
    ok("témoin (fixtures seules) : pas d'encadré « Jamais rien saisi »", !flags.some(t => t.startsWith("Jamais rien saisi")), flags.join(" | "));
    ok("témoin : « Sans nouvelles depuis 10 jours ou plus » cite Julien", flags.some(t => t.startsWith("Sans nouvelles") && t.includes("Julien Démo")), flags.join(" | "));
    const tbT = await page.$$eval("#tb-clients tr", l => l.map(x => x.textContent.replace(/\s+/g, " ")));
    ok("témoin : Thomas, Sarah et Julien s'affichent avec leur nom", ["Thomas Démo", "Sarah Démo", "Julien Démo"].every(n => tbT.some(t => t.includes(n))), tbT.join(" | ").slice(0, 200));
    await page.evaluate(() => { location.hash = "#/tableau"; }); await attendre(page, 2000);
    const avT = await page.$eval(`.attention-c:has([data-fiche="${F.IDS.c2}"]) .avatar`, e => e.textContent.trim()).catch(() => null);
    ok("témoin : Sarah Démo a ses initiales « SD » sur le tableau de bord", avT === "SD", avT);
    ok("témoin : aucune erreur JS, aucune écriture", E.js.length === 0 && E.ecritures.length === 0, E.js.concat(E.ecritures).join(" | "));
    await c.close();
  }

  await b.close(); server.close();
  console.log(res.join("\n"));
  const nb = res.filter(x => x.startsWith("  ✓")).length, tot = res.filter(x => /^  [✓✗]/.test(x)).length;
  console.log(`${nb}/${tot}`);
  process.exitCode = nb === tot ? 0 : 1;
})();
