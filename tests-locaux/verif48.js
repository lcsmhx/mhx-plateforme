/* v48 — P0 fiabilité : sessions (expirée au démarrage, hors ligne, refusée, deux onglets, 401 en
   cours de route), modifications gardées sur l'appareil jusqu'à leur arrivée (panne réseau, retour du
   réseau, fermeture de l'onglet, reprise au démarrage seulement si le serveur n'a rien de plus récent,
   autre compte, « Rester connecté » décoché, refus définitif, déconnexion), questionnaire et diagnostic
   enregistrés pendant la frappe, clients et coach inchangés.
   Supabase simulé : rien ne part vers la vraie base ; les écritures sont appliquées en mémoire.
   Usage : node verif48.js ../index.html                                          */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures"); const HTML = path.resolve(process.argv[2] || "../index.html");
const PORT = 9678;
const server = http.createServer((req, res) => { res.writeHead(200, { "Content-Type": "text/html" }); res.end(fs.readFileSync(HTML, "utf8")); });
const res = []; const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
const PROSPECT = "00000000-0000-4000-8000-000000000c04";
const norm = t => String(t || "").replace(/[  ]/g, " ");

function base(opts){
  opts = opts || {};
  const profils = JSON.parse(JSON.stringify(F.profils)).concat([{ id: PROSPECT, prenom: "Léa", nom: "", role: "client", cree_le: "2026-09-24T10:00:00Z" }]);
  profils.forEach(p => { p.statut = p.id === PROSPECT ? "prospect" : "client"; });
  const donnees = JSON.parse(JSON.stringify(F.donnees));
  return { profils, donnees, ecritures: [], refresh: [], deja: new Set(), refreshMode: "ok", lent: 0, lentLecture: 0, erreur500: 0, panne: 0, refus: false, revoque: 0, posts: [] };
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
    if (p.startsWith("/auth/v1/token")) {
      if (q.get("grant_type") === "refresh_token") {
        let corps = {}; try { corps = JSON.parse(req.postData() || "{}"); } catch (e) { }
        const rt = corps.refresh_token; db.refresh.push(rt);
        if (db.refreshMode === "reseau") return r.abort();
        if (db.refreshMode === "refuse" || db.deja.has(rt)) return json({ error: "invalid_grant", error_description: "Invalid Refresh Token: Already Used" }, 400);
        db.deja.add(rt); const n = db.refresh.length;
        const s = F.session(who.id, who.email); s.access_token = "jeton-" + n; s.refresh_token = "R" + n; delete s.expire_le;
        if (db.lent) await new Promise(x => setTimeout(x, db.lent));
        return json(s);
      }
      return json(who ? F.session(who.id, who.email) : { error: "invalid" }, who ? 200 : 400);
    }
    if (p.startsWith("/auth/v1/")) return json({});
    if (p === "/rest/v1/profils") { if (m !== "GET") { db.ecritures.push({ table: "profils", m }); return json(null, 204); } const id = q.get("id"); return json(id ? db.profils.filter(x => x.id === id.slice(3)) : db.profils); }
    if (p === "/rest/v1/donnees") {
      const auth = req.headers()["authorization"] || "";
      if (m === "GET" && (q.get("select") || "") === "maj_le" && db.lentLecture) await new Promise(x => setTimeout(x, db.lentLecture));
      if (m !== "GET") {
        db.posts.push({ auth, t: Date.now() });
        if (auth.indexOf("Bearer ") !== 0) return json({ code: "42501", message: "permission denied (anon)" }, 401);
        if (db.erreur500 > 0) { db.erreur500--; return json({ message: "panne serveur simulée" }, 500); }
        if (db.revoque > 0 && auth.indexOf("faux-jeton") > -1) { db.revoque--; return json({ code: "PGRST303", message: "JWT expired" }, 401); }
        if (db.panne > 0) { db.panne--; return r.abort(); }
        if (db.refus) return json({ code: "42501", message: "new row violates row-level security policy" }, 403);
        let rows = []; try { rows = JSON.parse(req.postData() || "[]"); } catch (e) { }
        (Array.isArray(rows) ? rows : [rows]).forEach(row => {
          db.ecritures.push({ table: "donnees", m, user_id: row.user_id, outil: row.outil, contenu: row.contenu, maj_le: row.maj_le, t: Date.now() });
          const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
          const ligne = { user_id: row.user_id, outil: row.outil, contenu: row.contenu, maj_le: row.maj_le || new Date().toISOString() };
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
  await c.addInitScript(({ s, magasin, attente }) => {
    if (sessionStorage.getItem("__init")) return; sessionStorage.setItem("__init", "1");   // une seule fois : un rechargement garde l'etat de la page
    if (s) (magasin === "session" ? sessionStorage : localStorage).setItem("mhx_session", JSON.stringify(s));
    if (attente) Object.keys(attente).forEach(k => localStorage.setItem("mhx_attente|" + k, JSON.stringify(attente[k])));
    localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
  }, { s: opts.session !== undefined ? opts.session : (who ? who.session : null), magasin: opts.magasin || "local", attente: opts.attente || null });
  const page = await nouvellePage(c);
  return { c, page };
}
async function nouvellePage(c){
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF"); d.dismiss(); });
  return page;
}
const coach = { id: F.IDS.coach, email: "c@e.fr", session: F.session(F.IDS.coach, "c@e.fr") };
const lea = { id: PROSPECT, email: "l@e.fr", session: F.session(PROSPECT, "l@e.fr") };
const thomas = { id: F.IDS.c1, email: "t@e.fr", session: F.session(F.IDS.c1, "t@e.fr") };
const julien = { id: F.IDS.c3, email: "j@e.fr", session: F.session(F.IDS.c3, "j@e.fr") };
const expiree = w => Object.assign({}, w.session, { expire_le: Date.now() - 1000 });
const attendre = (page, ms) => page.waitForTimeout(ms);
const texte = async (page, sel) => norm(await page.textContent(sel || "#vue").catch(() => ""));
const stock = (page, m, k) => page.evaluate(([m, k]) => (m === "session" ? sessionStorage : localStorage).getItem(k), [m, k]);
/* les copies en attente : une cle par copie, « mhx_attente|compte|cle » */
const copies = (page, m) => page.evaluate(m => { const s = m === "session" ? sessionStorage : localStorage, o = {}; for (let i = 0; i < s.length; i++){ const k = s.key(i); if (k && k.indexOf("mhx_attente|") === 0) o[k.slice(12)] = JSON.parse(s.getItem(k)); } return o; }, m);
const aucuneCopie = async (page, m) => !Object.keys(await copies(page, m || "local")).length;
const intakeDe = (db, uid) => (db.donnees.find(x => x.user_id === uid && x.outil === "intake") || {}).contenu || {};
const ecrituresIntake = (db, uid) => db.ecritures.filter(e => e.outil === "intake" && e.user_id === uid);

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();

  /* ---------- A. Sessions ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, thomas, db, { session: expiree(thomas) });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    const s = JSON.parse(await stock(page, "local", "mhx_session") || "null");
    ok("session expirée au démarrage : un seul renouvellement, l'accueil s'ouvre, la nouvelle session est rangée", db.refresh.length === 1 && !!(await page.$("#acc-vue")) && !!s && s.refresh_token === "R1", "renouvellements " + db.refresh.length);
    await c.close();
  }
  {
    const db = base(); db.refreshMode = "reseau";
    const { c, page } = await contexte(b, thomas, db, { session: expiree(thomas) });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2000);
    ok("renouvellement impossible (hors ligne) : la session est GARDÉE sur l'appareil (avant : effacée, il fallait se reconnecter)", !!(await stock(page, "local", "mhx_session")));
    db.refreshMode = "ok"; await page.reload(); await attendre(page, 2400);
    ok("… et au retour du réseau, l'app s'ouvre sans nouvelle connexion", !!(await page.$("#acc-vue")) && db.refresh.length === 2, "renouvellements " + db.refresh.length);
    await c.close();
  }
  {
    const db = base(); db.refreshMode = "refuse";
    const { c, page } = await contexte(b, thomas, db, { session: expiree(thomas) });
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 3800);
    ok("renouvellement refusé par le serveur : écran de connexion, session effacée (comme avant)", !!(await page.$("#c-go")) && !(await stock(page, "local", "mhx_session")));
    await c.close();
  }
  {
    /* deux onglets sur le meme compte */
    const db = base();
    const { c, page: A } = await contexte(b, thomas, db);
    await A.goto(`http://localhost:${PORT}/#/accueil`); await attendre(A, 2000);
    const B = await nouvellePage(c); await B.goto(`http://localhost:${PORT}/#/accueil`); await attendre(B, 2000);
    const ancienne = await B.evaluate(() => JSON.parse(JSON.stringify(Auth.session)));
    await A.evaluate(async () => { Auth.session.expire_le = 1; return await Auth.assurer(); }); await attendre(A, 500);
    ok("deux onglets : A renouvelle (R1), B reprend la nouvelle session tout seul (événement storage), un seul renouvellement", db.refresh.length === 1 && (await B.evaluate(() => Auth.session && Auth.session.refresh_token)) === "R1", "B : " + (await B.evaluate(() => Auth.session && Auth.session.refresh_token)));
    const okB = await B.evaluate(async (old) => { Auth.session = old; Auth.session.expire_le = 1; return await Auth.assurer(); }, ancienne);
    ok("deux onglets : B avec l'ancien jeton reprend la session rangée par A au lieu de présenter un jeton déjà utilisé", okB === true && db.refresh.length === 1 && (await B.evaluate(() => Auth.session.refresh_token)) === "R1" && JSON.parse(await stock(B, "local", "mhx_session")).refresh_token === "R1");
    /* course : A renouvelle lentement, B presente le meme jeton pendant ce temps (refuse « deja utilise ») */
    db.lent = 600;
    await A.evaluate(() => { Auth.session.expire_le = 1; window.__a = Auth.assurer(); });
    await attendre(A, 100);
    const okB2 = await B.evaluate(async () => { Auth.session.expire_le = 1; return await Auth.assurer(); });
    await attendre(A, 800);
    const sessA = await A.evaluate(() => Auth.session && Auth.session.refresh_token), sessB = await B.evaluate(() => Auth.session && Auth.session.refresh_token);
    ok("deux onglets, renouvellements simultanés : B, refusé, attend et reprend la session de A ; personne n'est déconnecté, rien n'est effacé", okB2 === true && sessA === "R2" && sessB === "R2" && JSON.parse(await stock(A, "local", "mhx_session") || "{}").refresh_token === "R2", "A " + sessA + " · B " + sessB + " · appels " + db.refresh.join(","));
    await c.close();
  }
  {
    /* jeton revoque en cours de route : 401 sur l'enregistrement → renouvellement + un nouvel essai */
    const db = base(); db.revoque = 1;
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2200);
    await page.selectOption("#q-stress", "7"); await attendre(page, 2000);
    const w = ecrituresIntake(db, F.IDS.c1);
    ok("401 en cours de route : un renouvellement puis un seul nouvel essai, la modification arrive (stress 7)", db.refresh.length === 1 && w.length === 1 && String(w[0].contenu.stress) === "7" && db.posts.length === 2, "renouvellements " + db.refresh.length + " · envois " + db.posts.length);
    await c.close();
  }

  /* ---------- B. Modifications gardées sur l'appareil ---------- */
  {
    const db = base(); db.panne = 1000;
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2200);
    await page.selectOption("#q-stress", "8"); await attendre(page, 1600);
    const att = (await copies(page, "local"))[F.IDS.c1 + "|intake"];
    ok("panne réseau : la modification est gardée sur l'appareil (mhx_attente), l'indicateur le dit", !!att && String(att.v.stress) === "8" && att.a === F.IDS.c1 && (await texte(page, "#etat")).includes("gardé sur cet appareil") && ecrituresIntake(db, F.IDS.c1).length === 0, await texte(page, "#etat"));
    db.panne = 0; await page.evaluate(() => window.dispatchEvent(new Event("online"))); await attendre(page, 1800);
    const w = ecrituresIntake(db, F.IDS.c1);
    ok("retour du réseau : la modification repart d'elle-même et arrive, la copie est retirée", w.length === 1 && String(w[0].contenu.stress) === "8" && (await aucuneCopie(page)), "écritures " + w.length);
    await c.close();
  }
  {
    const db = base(); db.panne = 1000;
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2200);
    await page.selectOption("#q-stress", "3"); await attendre(page, 1500);
    db.panne = 0; await page.reload(); await attendre(page, 2600);
    const w = ecrituresIntake(db, F.IDS.c1);
    ok("app fermée puis rouverte (hors ligne au moment de la saisie) : la modification repart au démarrage et s'affiche", w.length === 1 && String(w[0].contenu.stress) === "3" && (await page.$eval("#q-stress", e => e.value)) === "3" && (await aucuneCopie(page)), "écritures " + w.length);
    await c.close();
  }
  {
    /* reprise au demarrage : serveur plus ancien → envoye ; serveur plus recent → jamais ecrase ; autre compte → jamais envoye */
    const mk = (a, t, stress) => ({ [F.IDS.c1 + "|intake"]: { a, t, v: Object.assign({}, intakeDe(base(), F.IDS.c1), { stress }) } });
    {
      const db = base();
      const tSaisie = new Date(Date.now() - 60000).toISOString();
      const { c, page } = await contexte(b, thomas, db, { attente: mk(F.IDS.c1, tSaisie, "9") });
      await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2600);
      const w = ecrituresIntake(db, F.IDS.c1);
      ok("reprise au démarrage, serveur plus ancien : envoyée avec la date de la saisie (maj_le = instant de la saisie), affichée, copie retirée", w.length === 1 && String(w[0].contenu.stress) === "9" && w[0].maj_le === tSaisie && (await page.$eval("#q-stress", e => e.value)) === "9" && (await aucuneCopie(page)), "écritures " + w.length);
      await c.close();
    }
    {
      const db = base();
      const { c, page } = await contexte(b, thomas, db, { attente: mk(F.IDS.c1, "2026-01-01T00:00:00.000Z", "9") });
      await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2600);
      ok("reprise au démarrage, serveur plus récent : rien n'est écrasé, la copie périmée est retirée et c'est dit (« n'a pas été envoyée »)", ecrituresIntake(db, F.IDS.c1).length === 0 && (await texte(page, "#toasts")).includes("n'a pas été envoyée") && (await page.$eval("#q-stress", e => e.value)) !== "9" && (await aucuneCopie(page)));
      await c.close();
    }
    {
      const db = base();
      const { c, page } = await contexte(b, thomas, db, { attente: mk(F.IDS.coach, new Date().toISOString(), "9") });
      await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2600);
      ok("reprise au démarrage, copie laissée par un autre compte sur l'appareil : jamais envoyée, retirée", db.ecritures.length === 0 && (await aucuneCopie(page)));
      await c.close();
    }
  }
  {
    /* l'onglet se ferme dans la seconde : ce qui attendait part tout de suite */
    const db = base();
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2200);
    await page.fill("#q-objectif_phrase", "Perdre 5 kg avant l'été");
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide"))); await attendre(page, 300);
    const w = ecrituresIntake(db, F.IDS.c1);
    ok("onglet fermé juste après la frappe : l'envoi part tout de suite (sans attendre la seconde)", w.length === 1 && w[0].contenu.objectif_phrase === "Perdre 5 kg avant l'été", "écritures " + w.length);
    await c.close();
  }
  {
    /* « Rester connecte » decoche : la copie vit dans l'onglet, pas sur l'ordinateur */
    const db = base(); db.panne = 1000;
    const { c, page } = await contexte(b, thomas, db, { magasin: "session" });
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2200);
    await page.selectOption("#q-stress", "5"); await attendre(page, 1500);
    ok("« Rester connecté » décoché : la copie est dans l'onglet (sessionStorage), rien sur l'ordinateur (localStorage)", !(await aucuneCopie(page, "session")) && (await aucuneCopie(page)));
    await c.close();
  }
  {
    /* refus definitif (droits) : pas de nouvel essai sans fin */
    const db = base(); db.refus = true;
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2200);
    await page.selectOption("#q-stress", "4"); await attendre(page, 1500);
    const envois = db.posts.length;
    await page.evaluate(() => window.dispatchEvent(new Event("online"))); await attendre(page, 1200);
    ok("refus définitif (403) : la copie est retirée, aucun nouvel essai, l'en-tête dit « Non enregistré — modification refusée »", (await texte(page, "#etat")).includes("modification refusée") && (await aucuneCopie(page)) && db.posts.length === envois && envois === 1, "envois " + db.posts.length);
    await c.close();
  }
  {
    /* deconnexion : plus rien ne reste sur l'appareil */
    const db = base(); db.panne = 1000;
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2200);
    await page.selectOption("#q-stress", "6"); await attendre(page, 1500);
    const avant = !(await aucuneCopie(page));
    await page.click("#deco").catch(() => {}); await attendre(page, 5200);
    const dialogue = await texte(page, ".modale");
    ok("déconnexion avec des modifications non envoyées (hors ligne) : on le dit avant de tout effacer", avant && dialogue.includes("n'ont pas encore pu être envoyées") && !!(await stock(page, "local", "mhx_session")), dialogue.slice(0, 200));
    await page.click(".modale button:has-text(\"Annuler\")").catch(() => {}); await attendre(page, 500);
    ok("… « Annuler » : toujours connecté, la copie reste", !!(await stock(page, "local", "mhx_session")) && !(await aucuneCopie(page)));
    await page.click("#deco").catch(() => {}); await attendre(page, 5200);
    await page.click(".modale button:has-text(\"Me déconnecter quand même\")").catch(() => {}); await attendre(page, 1800);
    ok("… « Me déconnecter quand même » : déconnecté, plus rien sur l'appareil", (await aucuneCopie(page)) && !(await stock(page, "local", "mhx_session")));
    await c.close();
  }

  {
    /* course : la reprise lit lentement le serveur ; pendant ce temps une saisie plus recente arrive — l'ancienne ne repasse jamais */
    const db = base(); db.panne = 1000;
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2200);
    await page.selectOption("#q-stress", "3"); await attendre(page, 1500);
    db.panne = 0; db.lentLecture = 2500;
    await page.evaluate(() => window.dispatchEvent(new Event("online"))); await attendre(page, 300);
    await page.selectOption("#q-stress", "5"); await attendre(page, 4500);
    const w = ecrituresIntake(db, F.IDS.c1), i5 = w.findIndex(x => String(x.contenu.stress) === "5");
    ok("course reprise / nouvelle saisie : le serveur finit sur la plus récente (5), l'ancienne (3) ne repasse jamais après", String(intakeDe(db, F.IDS.c1).stress) === "5" && i5 > -1 && !w.slice(i5 + 1).some(x => String(x.contenu.stress) === "3") && (await aucuneCopie(page)), w.map(x => x.contenu.stress).join(","));
    await c.close();
  }
  {
    /* session refusee en cours d'usage (deconnexion depuis un autre appareil) : retour a la connexion, la saisie est gardee et repart apres reconnexion */
    const db = base();
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2200);
    db.refreshMode = "refuse";
    await page.evaluate(() => { Auth.session.expire_le = 1; });
    await page.selectOption("#q-stress", "2"); await attendre(page, 3800);
    ok("session refusée en cours d'usage : un bandeau « Ta session a pris fin », la page reste (questionnaire à l'écran), la saisie est gardée sur l'appareil", (await texte(page, "#session-perdue")).includes("Ta session a pris fin") && (await texte(page, "#session-perdue")).includes("n'est plus enregistré") && (await page.evaluate(() => { const avant = location.hash; location.hash = "#/accueil"; return avant; })) !== null && !!(await page.$("#q-stress")) && !(await page.$("#c-go")) && !!(await copies(page, "local"))[F.IDS.c1 + "|intake"], (await texte(page, "body")).slice(0, 200));
    await page.click("#session-perdue button").catch(() => {}); await attendre(page, 800);
    ok("… « Me reconnecter » ouvre l'écran de connexion avec un mot ; changer d'adresse ensuite ne provoque aucune erreur", !!(await page.$("#c-go")) && (await texte(page, "#co-err")).includes("Reconnecte-toi") && (await page.evaluate(() => { location.hash = "#/profil"; return true; })));
    await attendre(page, 600);
    db.refreshMode = "ok";
    await page.fill("#c-email", "t@e.fr"); await page.fill("#c-mdp", "motdepasse1"); await page.click("#c-go"); await attendre(page, 3500);
    ok("… après reconnexion, la saisie repart et arrive (stress 2), rien ne reste", String(intakeDe(db, F.IDS.c1).stress) === "2" && (await aucuneCopie(page)), JSON.stringify(intakeDe(db, F.IDS.c1).stress));
    await c.close();
  }
  {
    /* coach dans la fiche d'un client, hors ligne : sa modification est gardee (au nom du coach) et repart chez le bon client */
    const db = base(); db.panne = 1000;
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2200);
    await page.click(`[data-ouvrir="${F.IDS.c1}"]`).catch(() => {}); await attendre(page, 1800);
    const accepte = await page.evaluate(() => Store.ecrire("complements", { liste: [{ nom: "Oméga 3", dose: "2 g" }] })); await attendre(page, 1500);
    const cp = (await copies(page, "local"))[F.IDS.c1 + "|complements"];
    ok("coach hors ligne dans la fiche de Thomas : la modification (compléments) est gardée, au nom du coach, pour Thomas", accepte === true && !!cp && cp.a === F.IDS.coach, JSON.stringify(cp && { a: cp.a }));
    db.panne = 0; await page.evaluate(() => window.dispatchEvent(new Event("online"))); await attendre(page, 2000);
    ok("… et repart au retour du réseau, chez Thomas", db.ecritures.some(e => e.user_id === F.IDS.c1 && e.outil === "complements") && (await aucuneCopie(page)));
    await c.close();
  }
  {
    /* panne serveur (500) : la copie reste, un nouvel essai est planifie (30 s), il aboutit */
    const db = base(); db.erreur500 = 1;
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2200);
    await page.selectOption("#q-stress", "1"); await attendre(page, 1500);
    const planifie = await page.evaluate(() => !!Store._reprise);
    ok("panne serveur (500) : copie gardée, nouvel essai planifié", planifie && !(await aucuneCopie(page)) && ecrituresIntake(db, F.IDS.c1).length === 0);
    await page.evaluate(() => Store.reprendre()); await attendre(page, 1500);
    ok("… le nouvel essai aboutit (stress 1), copie retirée", String(intakeDe(db, F.IDS.c1).stress) === "1" && (await aucuneCopie(page)));
    await c.close();
  }
  {
    /* deconnexion juste apres une frappe : la saisie part d'abord, avec le jeton */
    const db = base();
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2200);
    await page.fill("#q-objectif_phrase", "Courir 10 km en mars");
    await page.click("#deco").catch(() => {}); await attendre(page, 2500);
    ok("déconnexion juste après une frappe : la saisie est envoyée d'abord, puis déconnexion", ecrituresIntake(db, F.IDS.c1).some(x => x.contenu.objectif_phrase === "Courir 10 km en mars") && !(await stock(page, "local", "mhx_session")));
    await c.close();
  }
  {
    /* « Rester connecte » decoche cette fois-ci : une copie du meme compte restee sur l'ordinateur est rapatriee et envoyee */
    const db = base();
    const t0 = new Date(Date.now() - 120000).toISOString();
    const { c, page } = await contexte(b, thomas, db, { magasin: "session", attente: { [F.IDS.c1 + "|intake"]: { a: F.IDS.c1, t: t0, v: Object.assign({}, intakeDe(base(), F.IDS.c1), { stress: "10" }) } } });
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2600);
    ok("copie restée dans l'autre rangement (même compte) : rapatriée au démarrage et envoyée, rien ne reste", String(intakeDe(db, F.IDS.c1).stress) === "10" && (await aucuneCopie(page, "local")) && (await aucuneCopie(page, "session")));
    await c.close();
  }

  {
    /* session refusee pendant la redaction d'une note privee (coach) : le texte reste a l'ecran */
    const db = base();
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2200);
    await page.click(`[data-ouvrir="${F.IDS.c1}"]`).catch(() => {}); await attendre(page, 2200);
    db.refreshMode = "refuse";
    await page.evaluate(() => { Auth.session.expire_le = 1; });
    await page.fill("#nc-texte", "Relancer mardi, parle de son genou").catch(() => {}); await attendre(page, 4200);
    ok("coach, session refusée pendant une note privée : bandeau, le texte de la note reste à l'écran (rien n'est détruit)", !!(await page.$("#session-perdue")) && (await page.$eval("#nc-texte", e => e.value).catch(() => "")) === "Relancer mardi, parle de son genou");
    await c.close();
  }
  {
    /* copie deja arrivee (envoi a la fermeture de l'onglet, reponse perdue) : meme instant que le serveur → retiree sans message */
    const db = base();
    const t0 = new Date(Date.now() - 30000).toISOString();
    const row = db.donnees.find(x => x.user_id === F.IDS.c1 && x.outil === "intake"); row.maj_le = t0; row.contenu = Object.assign({}, row.contenu, { stress: "7" });
    const { c, page } = await contexte(b, thomas, db, { attente: { [F.IDS.c1 + "|intake"]: { a: F.IDS.c1, t: t0, v: row.contenu } } });
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2600);
    ok("copie déjà arrivée (même instant que le serveur) : retirée sans rien renvoyer ni afficher de fausse alerte", db.ecritures.length === 0 && (await aucuneCopie(page)) && !(await texte(page, "#toasts")).includes("n'a pas été envoyée"));
    await c.close();
  }
  {
    /* horloge qui recule : une saisie fraiche part toujours */
    const db = base();
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/#/profil`); await attendre(page, 2200);
    await page.evaluate(() => { Store.dernierT[Auth.utilisateur().id + "|intake"] = "2099-01-01T00:00:00.000Z"; });
    await page.selectOption("#q-stress", "4"); await attendre(page, 1500);
    ok("horloge de l'appareil qui recule : la saisie fraîche part quand même", String(intakeDe(db, F.IDS.c1).stress) === "4");
    await c.close();
  }

  /* ---------- C. Questionnaire et diagnostic ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, julien, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2400);
    await page.click("#q-objectif_phrase"); await page.keyboard.type("Reprendre le sport 3 fois par semaine", { delay: 10 }); await attendre(page, 1500);
    const w = ecrituresIntake(db, F.IDS.c3);
    ok("questionnaire : un texte tapé part pendant la frappe, sans quitter le champ", w.length >= 1 && w[w.length - 1].contenu.objectif_phrase === "Reprendre le sport 3 fois par semaine" && (await page.evaluate(() => document.activeElement && document.activeElement.id)) === "q-objectif_phrase", "écritures " + w.length);
    await c.close();
  }
  {
    /* diagnostic du jour 1 (prospect) : les reponses partent pendant la saisie et reviennent au retour */
    const db = base();
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2400);
    await page.fill("#q-age", "29"); await page.fill("#q-poids", "64"); await attendre(page, 1500);
    const w = ecrituresIntake(db, PROSPECT);
    ok("diagnostic : l'âge et le poids partent pendant la saisie (brouillon), le jour 1 n'est pas validé", w.length >= 1 && String(w[w.length - 1].contenu.age) === "29" && String(w[w.length - 1].contenu.poids) === "64" && !db.ecritures.some(e => e.outil === "challenge"), "écritures " + w.length);
    await page.reload(); await attendre(page, 2400);
    ok("diagnostic : en revenant, les réponses sont déjà là", (await page.$eval("#q-age", e => e.value).catch(() => "")) === "29" && (await page.$eval("#q-poids", e => e.value).catch(() => "")) === "64");
    await c.close();
  }
  {
    /* diagnostic : un age de 15 ans → aucun brouillon, meme si d'autres reponses sont remplies */
    const db = base();
    const { c, page } = await contexte(b, lea, db);
    await page.goto(`http://localhost:${PORT}/#/challenge`); await attendre(page, 2400);
    await page.fill("#q-age", "15"); await page.fill("#q-poids", "64"); await page.fill("#q-taille", "168"); await attendre(page, 1500);
    ok("diagnostic : âge de 15 ans → aucune réponse ne part en brouillon", db.ecritures.length === 0);
    await page.fill("#q-age", "29"); await attendre(page, 1500);
    ok("diagnostic : âge corrigé (29) → le brouillon part avec les réponses valides", ecrituresIntake(db, PROSPECT).some(x => String(x.contenu.age) === "29" && String(x.contenu.taille) === "168"));
    await c.close();
  }

  /* ---------- D. Clients et coach : rien ne change ---------- */
  {
    const db = base();
    const { c, page } = await contexte(b, thomas, db);
    await page.goto(`http://localhost:${PORT}/`); await attendre(page, 2200);
    ok("client : l'accueil s'ouvre, aucune écriture, aucun renouvellement, rien en attente", !!(await page.$("#acc-vue")) && db.ecritures.length === 0 && db.refresh.length === 0 && (await aucuneCopie(page)));
    await c.close();
  }
  {
    const db = base();
    const { c, page } = await contexte(b, coach, db);
    await page.goto(`http://localhost:${PORT}/#/clients`); await attendre(page, 2200);
    await page.click(`[data-ouvrir="${F.IDS.c1}"]`).catch(() => {}); await attendre(page, 1800);
    ok("coach : Mes clients puis la fiche de Thomas s'ouvrent, aucune écriture", (await texte(page, "#vue")).includes("Fiche client") && db.ecritures.length === 0);
    await c.close();
  }

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
function bilan(){ const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length; console.log(res.join("\n")); console.log(nb + "/" + tot); }
