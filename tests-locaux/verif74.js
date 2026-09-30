/* verif74 — v67 (audit du 01/10, lot « mesures ») : 3 corrections, vérifiées de bout en bout dans le navigateur.
   A. D6 : la croix d'une ligne de « Toutes tes mesures » (Ma progression) effaçait la semaine au premier toucher, sans
      confirmation ni retour possible. Maintenant : une fenêtre de l'app (jamais un dialogue natif) demande « Supprimer la
      semaine {n} ? Cette mesure sera effacée. » ; « Annuler » ne touche à rien ; « Oui, supprimer » efface cette semaine
      seule. En anglais aussi.
   B. D2 (a) : les pastilles de courbes (zones, composition) de Ma progression ne réécrivent plus tout « mens » (une
      pesée faite entre-temps sur un autre appareil était effacée) : affichage seul, choix gardé sur l'appareil
      (mhx_aff|<compte>|mens), au départ celui du document ; les champs du document restent.
   C. D2 (a) : la semaine et le jour de « Organise ta diète » (Speed Formation) ne réécrivent plus tout « formation »
      (notes, objectifs, diète saisis ailleurs) : même principe (mhx_aff|<compte>|formation).
   D. D2 (b) : retour sur l'app après plus de 5 minutes en arrière-plan (client) : ce qui attend part, puis Ma progression
      (ou la Speed Formation) est relue et redessinée — la semaine notée sur le téléphone apparaît, et une pesée faite
      ensuite ne l'efface plus.
   E. D2 (b), garde-fous : moins de 5 minutes → rien ; un poids à moitié saisi (focus dans le champ, ou focus parti)
      n'est JAMAIS effacé ; une fenêtre de l'app ouverte → rien ; champ vidé → la relecture a lieu.
   F. D2 (b) : Speed Formation relue au retour (diète modifiée ailleurs).
   G. K9 : un lien dont l'adresse ne porte que refresh_token, provider_token, provider_refresh_token ou token_hash est
      nettoyé comme #access_token (jetons jamais lus ni envoyés, « Ce lien n'est plus valable » ; connecté : il reste
      lui-même, « déjà dans ton espace »).
   Supabase simulé : rien ne part vers la vraie base (routage par NOM D'HÔTE). Comptes fictifs (fixtures).
   Usage : node verif74.js ../index.html
           VERIF74_PORT=9901 node verif74.js ../index.html     (autre port, si 9900 est pris) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const FT = require("./fichiers");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF74_PORT || 9900;
const URL0 = "http://localhost:" + PORT + "/";
const server = http.createServer((req, res) => {
  if (FT.servirFichier(req, res, HTML)) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(fs.readFileSync(HTML, "utf8"));
});

/* ---------- résultats ---------- */
const res = [];
const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + (d || "")));
function bilan(){
  const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length;
  console.log(res.join("\n")); console.log(nb + "/" + tot);
  if (nb < tot || tot === 0) process.exitCode = 1;
}
const ouverts = [];
async function bloc(nom, fn){
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); }
}
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const egal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const norm = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const attendre = (page, ms) => page.waitForTimeout(ms);

/* ---------- personnes ---------- */
const session = (id, email) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + 86400000, user: { id, email, role: "authenticated" } });
const THOMAS = F.IDS.c1;
const MENS0 = () => clone(F.donnees.find(x => x.user_id === THOMAS && x.outil === "mens").contenu);   // 4 semaines, affichees [4, 5], mg
const S5 = { sem: 5, date: F.AUJ, poids: 82.1, vals: { 0: 100, 4: 86.5, 5: 91 }, compo: { mg: 21.5, mm: 62.4 } };
const FO = extra => Object.assign({ coches: { p1a: true }, ouvert: "m2", lecon: "", challenge: "", defis: {}, diete: { "1": { "0": [{ f: true, p: "20", g: "", l: "" }, { f: false, p: "", g: "", l: "" }, { f: false, p: "", g: "", l: "" }, { f: false, p: "", g: "", l: "" }, { f: false, p: "", g: "", l: "" }, { f: false, p: "", g: "", l: "" }] } },
  semaine: 1, jour: 0, priorites: { semaine: [], demain: [] }, notes: [], objectifs: [] }, extra || {});
const maintenant = () => new Date().toISOString();

/* ---------- le faux Supabase : lectures et écritures notées, upsert de « donnees » ---------- */
function base(){
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  return { profils, donnees: clone(F.donnees), n: 0, ecritures: [], lectures: [], traces: [] };
}
const ligne = (db, uid, outil) => db.donnees.find(x => x.user_id === uid && x.outil === outil);
function mettre(db, uid, outil, contenu, maj){
  const l = ligne(db, uid, outil);
  if (l){ l.contenu = contenu; l.maj_le = maj || maintenant(); } else db.donnees.push({ user_id: uid, outil, contenu, maj_le: maj || maintenant() });
}
const ecr = (db, outil) => db.ecritures.filter(e => e.outil === outil);
const lus = (db, outil) => db.lectures.filter(l => l.outil === "eq." + outil && l.select === "contenu");
async function repondre(r, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue().catch(() => {});
  if (!host.endsWith(".supabase.co")) return r.abort().catch(() => {});
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" } }).catch(() => {});
  const corps = req.postData() || "";
  db.traces.push(u + " " + JSON.stringify(req.headers()) + " " + corps);
  const auth = req.headers()["authorization"] || "";
  const mo = /^Bearer jeton-([0-9a-f-]{36})$/.exec(auth), moi = mo ? mo[1] : null;
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  if (p.startsWith("/auth/v1/token")) {
    let c = {}; try { c = JSON.parse(corps || "{}"); } catch (e) {}
    const r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || ""));
    return r1 ? json(session(r1[1], "")) : json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
  }
  if (p.startsWith("/auth/v1/user")) return moi ? json({ id: moi, email: "", role: "authenticated" }) : json({ msg: "invalid JWT" }, 401);
  if (p.startsWith("/auth/v1/")) return json({});
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  if (p.startsWith("/functions/v1/") || p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({});
  if (p === "/rest/v1/profils") { const id = (q.get("id") || "").replace(/^eq\./, ""); let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(m === "GET" ? l : []); }
  if (p === "/rest/v1/donnees") {
    if (m === "POST") {
      let rows = []; try { rows = JSON.parse(corps); } catch (e) {}
      (Array.isArray(rows) ? rows : [rows]).forEach(x => {
        if (!x || x.user_id !== moi) return;
        db.n++; db.ecritures.push({ n: db.n, outil: x.outil, contenu: clone(x.contenu), maj_le: x.maj_le });
        mettre(db, x.user_id, x.outil, clone(x.contenu), x.maj_le);
      });
      return json(null, 201);
    }
    if (m !== "GET") return json(null, 201);
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "";
    db.n++; db.lectures.push({ n: db.n, outil: o, select: q.get("select") || "" });
    let l = db.donnees.filter(x => coach || (x.user_id === moi && !["notes_coach", "suivi_prospect"].includes(x.outil)));
    if (uid) l = l.filter(x => x.user_id === uid);
    if (o.startsWith("eq.")) l = l.filter(x => x.outil === o.slice(3));
    if (o.startsWith("in.")) { const k = o.slice(3).replace(/^\(|\)$/g, "").split(","); l = l.filter(x => k.includes(x.outil)); }
    return json(clone(l));
  }
  const t = p.replace("/rest/v1/", "");
  if (F.catalogue[t]) return json(m === "GET" ? F.catalogue[t] : null);
  return json([]);
}
async function contexte(b, db, who, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: { width: 1100, height: 900 } });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, db));
  await c.addInitScript(({ s, langue }) => {
    if (!/^https?:$/.test(location.protocol) || localStorage.getItem("__init")) return;
    localStorage.setItem("__init", "1");
    localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
    if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
    if (langue) localStorage.setItem("mhx_langue", langue);
  }, { s: who ? session(who, "t@exemple.fr") : null, langue: opts.langue || "" });
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return { c, page };
}
async function pret(page, sel){
  await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 12000 });
  if (sel) await page.waitForSelector(sel, { timeout: 10000 });
}
/* l'app passe en arrière-plan / revient (comme verif53) ; « reculer » : l'arrière-plan a commencé il y a ms de plus */
const cacher = page => page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }); document.dispatchEvent(new Event("visibilitychange")); });
const montrer = page => page.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" }); document.dispatchEvent(new Event("visibilitychange")); });
const reculer = (page, ms) => page.evaluate(ms => { if (typeof Retour !== "undefined" && Retour.cachee) Retour.cachee -= ms; }, ms);
const MIN = 60000;
const modale = page => page.evaluate(() => { const m = document.querySelector(".modale"); return m ? { texte: (m.querySelector(".corps") || m).textContent, boutons: Array.from(m.querySelectorAll("button")).map(b => b.textContent.trim()) } : null; });
const mensAff = page => page.evaluate(() => ({
  lignes: document.querySelectorAll("#tbody tr").length, sems: Array.from(document.querySelectorAll("#tbody tr td:first-child")).map(td => td.textContent.trim()),
  poids: (document.getElementById("k-poids") || {}).textContent || "", sem: (document.getElementById("k-sem") || {}).textContent || "",
  chips: Array.from(document.querySelectorAll("#chips .chip")).map((b, i) => b.getAttribute("aria-pressed") === "true" ? i : -1).filter(i => i > -1),
  compo: Array.from(document.querySelectorAll("#compo-chips .chip")).filter(b => b.getAttribute("aria-pressed") === "true").map(b => b.textContent.trim()),
  legende: (document.getElementById("legend") || {}).textContent || "",
  ePoids: (document.getElementById("e-poids") || {}).value
})).catch(e => String(e));
const foAff = page => page.evaluate(() => ({
  sem: (document.getElementById("fo-sem") || {}).value, jours: Array.from(document.querySelectorAll("[data-fj]")).filter(b => b.getAttribute("aria-pressed") === "true").map(b => b.dataset.fj),
  p0: (document.querySelector('[data-dm="0.p"]') || {}).value
})).catch(e => String(e));
const local = (page, k) => page.evaluate(k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return "illisible"; } }, k);

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();

  /* =================== A. D6 : la croix demande d'abord =================== */
  await bloc("A. suppression d'une semaine", async () => {
    const db = base();
    const { page } = await contexte(b, db, THOMAS);
    await page.goto(URL0 + "#/mensurations"); await pret(page, "#tbody tr"); await attendre(page, 1200);
    const e0 = ecr(db, "mens").length;
    await page.click("#tbody tr:nth-child(2) .del"); await attendre(page, 900);
    const m1 = await modale(page), a1 = await mensAff(page);
    ok("× de la semaine 2 : une fenêtre de l'app demande « Supprimer la semaine 2 ? Cette mesure sera effacée. » (« Annuler » / « Oui, supprimer »), rien d'effacé à l'écran ni d'écrit tant qu'on n'a pas confirmé",
      !!m1 && norm(m1.texte) === "Supprimer la semaine 2 ? Cette mesure sera effacée." && egal(m1.boutons, ["Annuler", "Oui, supprimer"]) && a1.lignes === 4 && ecr(db, "mens").length === e0,
      JSON.stringify([m1, a1.lignes, ecr(db, "mens").length - e0]));
    await page.click(".modale button:has-text('Annuler')"); await attendre(page, 1500);
    const a2 = await mensAff(page), m2 = await modale(page);
    ok("« Annuler » : la fenêtre se ferme, les 4 semaines restent, rien n'est écrit", !m2 && a2.lignes === 4 && ecr(db, "mens").length === e0, JSON.stringify([m2, a2.lignes, ecr(db, "mens").length - e0]));
    await page.click("#tbody tr:nth-child(2) .del"); await attendre(page, 700);
    await page.click(".modale button:has-text('Oui, supprimer')"); await attendre(page, 1800);
    const E = ecr(db, "mens"), der = E[E.length - 1], a3 = await mensAff(page);
    ok("« Oui, supprimer » : la semaine 2 seule est effacée (mens écrit une fois avec les semaines 1, 3, 4 ; la page en montre 3)",
      E.length === e0 + 1 && !!der && egal(der.contenu.mesures.map(x => x.sem), [1, 3, 4]) && a3.lignes === 3 && egal(a3.sems, ["S1", "S3", "S4"]),
      JSON.stringify([E.length - e0, der && der.contenu.mesures.map(x => x.sem), a3.sems]));
    /* en anglais (langue choisie : prefs.langue = en) */
    const db2 = base(); mettre(db2, THOMAS, "prefs", { langue: "en" });
    const X = await contexte(b, db2, THOMAS, { langue: "en" }), p2 = X.page;
    await p2.goto(URL0 + "#/mensurations"); await pret(p2, "#tbody tr"); await attendre(p2, 1200);
    await p2.click("#tbody tr:nth-child(3) .del"); await attendre(p2, 900);
    const m3 = await modale(p2);
    await p2.keyboard.press("Escape"); await attendre(p2, 1200);
    const a4 = await mensAff(p2);
    ok("en anglais : « Delete week 3? This measurement will be erased. » (« Cancel » / « Yes, delete ») ; Échap ne touche à rien (4 semaines, rien d'écrit)",
      !!m3 && norm(m3.texte) === "Delete week 3? This measurement will be erased." && egal(m3.boutons, ["Cancel", "Yes, delete"]) && a4.lignes === 4 && ecr(db2, "mens").length === 0,
      JSON.stringify([m3, a4.lignes, ecr(db2, "mens").length]));
  });

  /* =================== B. D2 : pastilles de Ma progression =================== */
  await bloc("B. pastilles de courbes", async () => {
    const db = base();
    const { page } = await contexte(b, db, THOMAS);
    await page.goto(URL0 + "#/mensurations"); await pret(page, "#chips .chip"); await attendre(page, 1200);
    const a0 = await mensAff(page);
    ok("client existant, aucun choix sur cet appareil : les courbes du document s'affichent comme avant (Taille et Ventre ; composition : Masse grasse)",
      egal(a0.chips, [4, 5]) && egal(a0.compo, ["Masse grasse"]), JSON.stringify(a0));
    /* pendant ce temps, la semaine 5 est notée sur le téléphone */
    const M = MENS0(); M.mesures.push(clone(S5)); mettre(db, THOMAS, "mens", M);
    await page.click("#chips .chip >> nth=0"); await attendre(page, 1200);
    await page.click("#compo-chips .chip[aria-pressed='false'] >> nth=0"); await attendre(page, 1600);
    const a1 = await mensAff(page), L = await local(page, "mhx_aff|" + THOMAS + "|mens");
    ok("clic sur la pastille « Poitrine » puis sur « Masse musculaire » : l'affichage suit (Poitrine ajoutée à la légende, Masse musculaire choisie), RIEN n'est écrit, la semaine 5 notée sur le téléphone reste en base",
      egal(a1.chips, [0, 4, 5]) && /Poitrine/.test(a1.legende) && egal(a1.compo, ["Masse musculaire"]) && ecr(db, "mens").length === 0 && ligne(db, THOMAS, "mens").contenu.mesures.length === 5,
      JSON.stringify([a1, ecr(db, "mens").length, ligne(db, THOMAS, "mens").contenu.mesures.length]));
    ok("le choix est gardé sur l'appareil : mhx_aff|<compte>|mens = { affichees: [4, 5, 0], compo_affichee: \"mm\" }",
      !!L && egal(L.affichees, [4, 5, 0]) && L.compo_affichee === "mm", JSON.stringify(L));
    await page.reload(); await pret(page, "#chips .chip"); await attendre(page, 1500);
    const a2 = await mensAff(page);
    ok("page rechargée : le choix de l'appareil est repris (Poitrine, Taille, Ventre ; Masse musculaire), la semaine 5 du téléphone est là, toujours rien d'écrit",
      egal(a2.chips, [0, 4, 5]) && egal(a2.compo, ["Masse musculaire"]) && a2.lignes === 5 && ecr(db, "mens").length === 0, JSON.stringify([a2, ecr(db, "mens").length]));
    await page.click("#mens-ajouter").catch(() => page.evaluate(() => { const s = document.getElementById("mens-saisie"); if (s) s.hidden = false; }));
    await page.fill("#e-sem", "6"); await page.fill("#e-poids", "81.9"); await page.click("#add"); await attendre(page, 1800);
    const E = ecr(db, "mens"), der = E[E.length - 1] && E[E.length - 1].contenu;
    ok("puis une vraie pesée (semaine 6) : mens écrit une fois, avec les semaines 1 à 6 ; les champs affichees et compo_affichee restent dans le document",
      E.length === 1 && !!der && egal(der.mesures.map(x => x.sem), [1, 2, 3, 4, 5, 6]) && Array.isArray(der.affichees) && typeof der.compo_affichee === "string" && Array.isArray(der.zones) && der.zones.length === 10,
      JSON.stringify([E.length, der && der.mesures.map(x => x.sem), der && der.affichees, der && der.compo_affichee]));
  });

  /* =================== C. D2 : semaine et jour de la diète (Speed Formation) =================== */
  await bloc("C. semaine et jour de la diète", async () => {
    const db = base(); mettre(db, THOMAS, "formation", FO(), "2026-09-28T08:00:00Z");
    const { page } = await contexte(b, db, THOMAS);
    await page.goto(URL0 + "#/formation"); await pret(page, "#fo-sem"); await attendre(page, 1200);
    const f0 = await foAff(page);
    /* une note ajoutée sur le téléphone pendant que la page est ouverte */
    const T = FO({ notes: [{ id: "n-tel", date: F.AUJ, titre: "Note du téléphone", texte: "écrite ailleurs" }] }); mettre(db, THOMAS, "formation", T);
    await page.selectOption("#fo-sem", "3"); await attendre(page, 1000);
    await page.click('[data-fj="4"]'); await attendre(page, 1600);
    const f1 = await foAff(page), L = await local(page, "mhx_aff|" + THOMAS + "|formation");
    ok("au départ : semaine 1, lundi (ceux du document) ; changer la semaine (3) puis le jour (vendredi) : l'affichage suit, RIEN n'est écrit, la note ajoutée sur le téléphone reste en base",
      f0.sem === "1" && egal(f0.jours, ["0"]) && f0.p0 === "20" && f1.sem === "3" && egal(f1.jours, ["4"]) && f1.p0 === "" && ecr(db, "formation").length === 0 && ligne(db, THOMAS, "formation").contenu.notes.length === 1,
      JSON.stringify([f0, f1, ecr(db, "formation").length]));
    ok("le choix est gardé sur l'appareil : mhx_aff|<compte>|formation = { semaine: 3, jour: 4 }", !!L && L.semaine === 3 && L.jour === 4, JSON.stringify(L));
    await page.reload(); await pret(page, "#fo-sem"); await attendre(page, 1500);
    const f2 = await foAff(page);
    ok("page rechargée : semaine 3, vendredi (le choix de l'appareil), toujours rien d'écrit", f2.sem === "3" && egal(f2.jours, ["4"]) && ecr(db, "formation").length === 0, JSON.stringify([f2, ecr(db, "formation").length]));
    await page.fill('[data-dm="0.p"]', "40"); await attendre(page, 1800);
    const E = ecr(db, "formation"), der = E[E.length - 1] && E[E.length - 1].contenu;
    ok("puis des grammes notés (semaine 3, vendredi) : formation écrit avec ces grammes ET la note du téléphone ; semaine 1 lundi gardée ; les champs semaine et jour restent dans le document",
      E.length >= 1 && !!der && der.diete["3"] && der.diete["3"]["4"] && der.diete["3"]["4"][0].p === "40" && der.diete["1"]["0"][0].p === "20" && der.notes.length === 1 && der.notes[0].id === "n-tel" && "semaine" in der && "jour" in der,
      JSON.stringify([E.length, der && der.diete, der && der.notes]));
  });

  /* =================== D. D2 : retour sur l'app après plus de 5 minutes =================== */
  await bloc("D. relecture au retour (Ma progression)", async () => {
    const db = base();
    const { page } = await contexte(b, db, THOMAS);
    await page.goto(URL0 + "#/mensurations"); await pret(page, "#tbody tr"); await attendre(page, 1200);
    const n0 = lus(db, "mens").length;
    await cacher(page); await attendre(page, 300);
    const M = MENS0(); M.mesures.push(clone(S5)); mettre(db, THOMAS, "mens", M);   // la semaine 5, notée sur le téléphone
    await reculer(page, 6 * MIN); await montrer(page); await attendre(page, 3000);
    const a1 = await mensAff(page);
    ok("client, Ma progression, rien de tapé : retour sur l'app après plus de 5 min en arrière-plan → mens relu et la page redessinée : la semaine 5 notée sur le téléphone apparaît (5 lignes, poids actuel 82,1), rien n'est écrit",
      lus(db, "mens").length > n0 && a1.lignes === 5 && /^82,1/.test(a1.poids) && ecr(db, "mens").length === 0, JSON.stringify([lus(db, "mens").length - n0, a1, ecr(db, "mens").length]));
    await page.click("#mens-ajouter").catch(() => page.evaluate(() => { const s = document.getElementById("mens-saisie"); if (s) s.hidden = false; }));
    await page.fill("#e-sem", "6"); await page.fill("#e-poids", "81.8"); await page.click("#add"); await attendre(page, 1800);
    const E = ecr(db, "mens"), der = E[E.length - 1] && E[E.length - 1].contenu;
    ok("puis une pesée sur cet appareil (semaine 6) : mens écrit avec les semaines 1 à 6 — celle du téléphone n'est plus effacée",
      E.length === 1 && !!der && egal(der.mesures.map(x => x.sem), [1, 2, 3, 4, 5, 6]), JSON.stringify(der && der.mesures.map(x => x.sem)));
  });

  /* =================== E. D2 : garde-fous de la relecture =================== */
  await bloc("E. pas de relecture", async () => {
    const db = base();
    const { page } = await contexte(b, db, THOMAS);
    await page.goto(URL0 + "#/mensurations"); await pret(page, "#tbody tr"); await attendre(page, 1200);
    const M = MENS0(); M.mesures.push(clone(S5));
    /* E1 : moins de 5 minutes */
    let n0 = lus(db, "mens").length;
    await cacher(page); await attendre(page, 300); mettre(db, THOMAS, "mens", M); await reculer(page, 2 * MIN); await montrer(page); await attendre(page, 2500);
    const a1 = await mensAff(page);
    ok("retour après moins de 5 min : rien n'est relu ni redessiné (4 lignes)", lus(db, "mens").length === n0 && a1.lignes === 4, JSON.stringify([lus(db, "mens").length - n0, a1.lignes]));
    /* E2 : un poids à moitié saisi, le focus dans le champ */
    await page.click("#mens-ajouter"); await page.fill("#e-poids", "81.7");
    n0 = lus(db, "mens").length;
    await cacher(page); await attendre(page, 300); await reculer(page, 6 * MIN); await montrer(page); await attendre(page, 2500);
    const a2 = await mensAff(page), f2 = await page.evaluate(() => document.activeElement && document.activeElement.id);
    ok("poids à moitié saisi (81.7), le focus dans le champ, retour après plus de 5 min : rien n'est redessiné, la saisie est intacte (et toujours active)",
      a2.ePoids === "81.7" && a2.lignes === 4 && f2 === "e-poids" && lus(db, "mens").length === n0 && ecr(db, "mens").length === 0, JSON.stringify([a2, f2, lus(db, "mens").length - n0]));
    /* E3 : le focus est parti ailleurs, la saisie reste dans le champ */
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await cacher(page); await attendre(page, 300); await reculer(page, 6 * MIN); await montrer(page); await attendre(page, 2500);
    const a3 = await mensAff(page);
    ok("même poids à moitié saisi, focus parti (champ quitté sans enregistrer), retour après plus de 5 min : la saisie n'est JAMAIS effacée (81.7, 4 lignes)",
      a3.ePoids === "81.7" && a3.lignes === 4 && lus(db, "mens").length === n0 && ecr(db, "mens").length === 0, JSON.stringify([a3, lus(db, "mens").length - n0]));
    /* E4 : une fenêtre de l'app ouverte */
    await page.fill("#e-poids", ""); await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.click("#tbody tr:nth-child(1) .del"); await attendre(page, 700);
    await cacher(page); await attendre(page, 300); await reculer(page, 6 * MIN); await montrer(page); await attendre(page, 2500);
    const a4 = await mensAff(page), m4 = await modale(page);
    ok("une fenêtre de l'app ouverte (confirmation de suppression), retour après plus de 5 min : rien n'est redessiné, la fenêtre reste",
      !!m4 && a4.lignes === 4 && lus(db, "mens").length === n0, JSON.stringify([m4, a4.lignes, lus(db, "mens").length - n0]));
    await page.click(".modale button:has-text('Annuler')"); await attendre(page, 800);
    /* E5 : champ vidé, rien d'ouvert : la relecture a lieu */
    await cacher(page); await attendre(page, 300); await reculer(page, 6 * MIN); await montrer(page); await attendre(page, 3000);
    const a5 = await mensAff(page);
    ok("champ vidé par la personne, fenêtre fermée, retour après plus de 5 min : la page est relue (semaine 5 du téléphone affichée), rien n'est écrit",
      a5.lignes === 5 && lus(db, "mens").length > n0 && ecr(db, "mens").length === 0, JSON.stringify([a5, lus(db, "mens").length - n0, ecr(db, "mens").length]));
  });

  /* =================== F. D2 : Speed Formation relue au retour =================== */
  await bloc("F. relecture au retour (Speed Formation)", async () => {
    const db = base(); mettre(db, THOMAS, "formation", FO(), "2026-09-28T08:00:00Z");
    const { page } = await contexte(b, db, THOMAS);
    await page.goto(URL0 + "#/formation"); await pret(page, "#fo-sem"); await attendre(page, 1200);
    const f0 = await foAff(page);
    await cacher(page); await attendre(page, 300);
    const T = FO(); T.diete["1"]["0"][0].p = "55"; mettre(db, THOMAS, "formation", T);   // modifiée sur le téléphone
    await reculer(page, 6 * MIN); await montrer(page); await attendre(page, 3000);
    const f1 = await foAff(page);
    ok("Speed Formation, rien de tapé : retour après plus de 5 min → la diète est relue (protéines du petit-déjeuner : 20 → 55, notées sur le téléphone), rien n'est écrit",
      f0.p0 === "20" && f1.p0 === "55" && ecr(db, "formation").length === 0, JSON.stringify([f0, f1, ecr(db, "formation").length]));
  });

  /* =================== G. K9 : jetons dans l'adresse =================== */
  await bloc("G. jetons dans l'adresse", async () => {
    for (const frag of ["refresh_token=secret-r1&token_type=bearer", "provider_token=secret-p1", "provider_refresh_token=secret-pr1", "token_hash=secret-th1&type=signup"]) {
      const db = base();
      const { page } = await contexte(b, db, null);
      await page.goto(URL0 + "#" + frag); await page.waitForSelector("#c-go", { timeout: 10000 }); await attendre(page, 600);
      const e = await page.evaluate(() => ({ url: location.href, err: (document.getElementById("co-err") || {}).textContent || "", session: !!(localStorage.getItem("mhx_session") || sessionStorage.getItem("mhx_session")) }));
      ok(`#${frag.split("=")[0]}=… seul, personne de connecté : adresse nettoyée, aucune session, jeton jamais envoyé, « Ce lien n'est plus valable »`,
        !/token|secret/.test(e.url) && !e.session && !db.traces.some(t => /secret-/.test(t)) && norm(e.err).startsWith("Ce lien n'est plus valable"), JSON.stringify(e));
    }
    const db = base();
    const { page } = await contexte(b, db, THOMAS);
    await page.goto(URL0 + "#provider_token=secret-p2&refresh_token=secret-r2");
    await pret(page); await attendre(page, 1500);
    const e = await page.evaluate(() => ({ url: location.href, id: Auth.utilisateur() && Auth.utilisateur().id, toasts: (document.getElementById("toasts") || {}).textContent || "" }));
    ok("client connecté + #provider_token=…&refresh_token=… : il reste lui-même, adresse nettoyée, jetons jamais envoyés, « déjà dans ton espace »",
      e.id === THOMAS && !/token|secret/.test(e.url) && !db.traces.some(t => /secret-/.test(t)) && norm(e.toasts).includes("déjà dans ton espace"), JSON.stringify(e));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
