/* v39 — phase 15 : statut prospect / client (colonne profils.statut).
   Supabase simulé : la colonne statut existe (sauf option sansStatut), un compte
   créé par la base naît « prospect », seul le coach change un statut.
   Usage : node verif39.js ../index.html                                         */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const PORT = 9670;
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
  return { profils, donnees: JSON.parse(JSON.stringify(F.donnees)), patchs: [], fonctions: [], inscriptions: [] };
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

  /* ---------- A. Coach : prospects visibles, statut modifiable ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1800);
    const tb = (await page.textContent("#tb-vue")).replace(/\s+/g, " ");
    ok("tableau : KPI Prospects = 1 et Clients actifs = 3", /Prospects\s*1/.test(tb) && /Clients actifs\s*3/.test(tb), tb.slice(0, 200));
    ok("tableau : le prospect n'est pas dans « qui nécessite ton attention »", !tb.includes("Léa Démo"));
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
    ok("sans colonne statut : KPI Prospects = 0", /Prospects\s*0/.test((await page.textContent("#tb-vue")).replace(/\s+/g, " ")));
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
    inscriptionLibre = true;
    const db = base();
    const { c, page } = await contexte(b, null, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 1200);
    ok("inscription ouverte : bouton « Créer mon compte » sur la connexion", !!(await page.$('[data-mode="inscription"]')));
    await page.click('[data-mode="inscription"]'); await attendre(page, 400);
    await page.fill("#c-email", "nouvelle@exemple.fr"); await page.fill("#c-mdp", "court"); await page.fill("#c-mdp2", "court");
    await page.click("#c-go"); await attendre(page, 300);
    ok("inscription : prénom obligatoire", (await page.textContent("#co-err")).includes("prénom"));
    await page.fill("#c-prenom", "Zoé"); await page.fill("#c-nom", "Démo");
    await page.click("#c-go"); await attendre(page, 300);
    ok("inscription : 8 caractères minimum", (await page.textContent("#co-err")).includes("8 caractères"));
    await page.fill("#c-mdp", "motdepasse1"); await page.fill("#c-mdp2", "motdepasse2");
    await page.click("#c-go"); await attendre(page, 300);
    ok("inscription : les deux mots de passe doivent être identiques", (await page.textContent("#co-err")).includes("identiques") && db.inscriptions.length === 0);
    await page.fill("#c-mdp2", "motdepasse1");
    await page.click("#c-go"); await attendre(page, 2500);
    ok("inscription : POST /auth/v1/signup avec prénom et nom", db.inscriptions.length === 1 && db.inscriptions[0].data.prenom === "Zoé" && db.inscriptions[0].data.nom === "Démo" && db.inscriptions[0].email === "nouvelle@exemple.fr");
    ok("inscription : connecté ensuite, et prospect", await page.evaluate(() => Auth.connecte() && Auth.estProspect()).catch(() => false));
    await c.close();
  }
  {
    inscriptionLibre = true;
    const db = base();
    const { c, page } = await contexte(b, null, db, { inscriptionKo: true, langue: "en" });
    await page.goto(`http://localhost:${PORT}/#/inscription`); await attendre(page, 1200);
    const t = await page.textContent("body");
    ok("inscription en anglais : « Create your account »", t.includes("Create your account") && t.includes("Your first name"));
    await page.fill("#c-prenom", "Zoé"); await page.fill("#c-email", "z@exemple.fr"); await page.fill("#c-mdp", "motdepasse1"); await page.fill("#c-mdp2", "motdepasse1");
    await page.click("#c-go"); await attendre(page, 800);
    ok("inscription refusée par Supabase : « Sign-ups are not open yet. »", (await page.textContent("#co-err")).includes("Sign-ups are not open yet"));
    await c.close();
  }
  inscriptionLibre = false;
  await b.close(); server.close(); console.log(res.join("\n"));
})();
