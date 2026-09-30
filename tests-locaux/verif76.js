/* verif76 — v67 (lot « formation ») : ouvrir ou fermer un module ou une leçon de la Speed Formation n'écrit plus rien.
   Avant : chaque clic sur un module (D.ouvert) ou une leçon (D.lecon) réécrivait TOUT « formation » depuis la copie de la
   page (notes, objectifs, challenges, grammes de la diète, cases cochées) : avec deux appareils, la page restée ouverte sur
   l'ordinateur effaçait ce qui venait d'être noté sur le téléphone, rien qu'en ouvrant un module. Maintenant : affichage
   seul, comme la semaine et le jour de la diète (v67) — choix gardé sur l'appareil dans mhx_aff|<compte>|formation =
   { semaine, jour, ouvert, lecon } ; au départ, celui du document (rien ne change à l'écran) ; un module ou une leçon qui
   n'existe pas est ignoré ; les champs du document restent.
   A. client, deux appareils : ouvrir / fermer des modules et une leçon → rien d'écrit, la note du téléphone reste ; le choix
      gardé sur l'appareil ; page rechargée : même affichage ; puis une vraie saisie : la note du téléphone est dans ce qui
      est écrit, ouvert et lecon aussi (le document garde ses champs).
   B. anciens formats et valeurs gardées : sans choix → celui du document ; choix de la v67 ({ semaine, jour }) → module et
      leçon du document ; module ou leçon inconnus, types faux → ignorés ; « tout fermé » gardé.
   C. coach dans la fiche d'un client : ouvrir des modules et une leçon n'écrit rien, le document du client ne change pas, le
      choix reste sur l'appareil du coach pour CE client (la fiche d'un autre client montre son propre document).
   D. prospect : cartes « Commence ici » et « Ce qui t'attend » intactes, ouvrir le module 01 et sa leçon n'écrit rien ; la
      7e case du module 01 écrit la formation (cases, module et leçon ouverts) et l'invitation declic_mindset se pose juste
      après la section du module.
   Supabase simulé : rien ne part vers la vraie base (routage par NOM D'HÔTE). Comptes fictifs (fixtures).
   Usage : node verif76.js ../index.html
           VERIF76_PORT=9921 node verif76.js ../index.html     (autre port, si 9920 est pris) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const FT = require("./fichiers");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF76_PORT || 9920;
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
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).replace(/\s+/g, " ").slice(0, 700)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); }
}
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const egal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const attendre = (page, ms) => page.waitForTimeout(ms);
const MIN = 60000, H = 3600000, J = 86400000;
const ilYa = ms => new Date(Date.now() - ms).toISOString();

/* ---------- personnes ---------- */
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + 86400000, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: meta } : {}) });
const THOMAS = F.IDS.c1, SARAH = F.IDS.c2, COACH = F.IDS.coach;
const PROSPECT = "00000000-0000-4000-8000-000000007601";   // verif76 : …76kk
const ACCORD_SANTE = { consentement_sante: "2026-09-28T09:00:00.000Z", sante_version: "2026-09-28b" };
const NOUVEAU = { probleme: "Perdre du gras", obstacle: "Le manque de temps", projection: "Avoir de l'énergie toute la journée",
  objectif: "Perte de poids / sèche", objectif_auto: "Perte de poids / sèche", court_debut: ilYa(2 * H), court_le: ilYa(H), bilan_propose: { choix: "plus_tard", le: ilYa(MIN) } };
const LIGNE = (p) => ({ f: !!p, p: p || "", g: "", l: "" });
const FO = extra => Object.assign({ coches: { p1a: true }, ouvert: "m2", lecon: "", challenge: "c3", defis: { d2: true },
  diete: { "1": { "0": [LIGNE("20"), LIGNE(), LIGNE(), LIGNE(), LIGNE(), LIGNE()] } },
  semaine: 1, jour: 0, priorites: { semaine: [{ id: "p-ord", texte: "Marcher 30 min", fait: false }], demain: [] }, notes: [], objectifs: [{ id: "o-1", titre: "Perdre 3 kg", mesure: "", echeance: "", fait: false }] }, extra || {});
const NOTE_TEL = { id: "n-tel", date: F.AUJ, titre: "Note du téléphone", texte: "écrite sur l'autre appareil" };
const SIX = { m1a: true, m1b: true, m1c: true, m1d: true, m1e: true, m1f: true };

/* ---------- le faux Supabase : lectures et écritures notées (même refusées), upsert de « donnees » ---------- */
function base(prospect){
  const profils = clone(F.profils); profils.forEach(p => { if (p.role !== "coach") p.statut = "client"; });
  const donnees = clone(F.donnees);
  if (prospect){
    profils.push({ id: PROSPECT, prenom: "Léa", nom: "Essai", role: "client", statut: "prospect", cree_le: ilYa(2 * J) });
    donnees.push({ user_id: PROSPECT, outil: "intake", contenu: clone(NOUVEAU), maj_le: ilYa(H) });
  }
  return { profils, donnees, n: 0, ecritures: [], lectures: [] };
}
const ligne = (db, uid, outil) => db.donnees.find(x => x.user_id === uid && x.outil === outil);
function mettre(db, uid, outil, contenu, maj){
  const l = ligne(db, uid, outil);
  if (l){ l.contenu = clone(contenu); l.maj_le = maj || new Date().toISOString(); } else db.donnees.push({ user_id: uid, outil, contenu: clone(contenu), maj_le: maj || new Date().toISOString() });
}
const ecr = (db, outil, uid) => db.ecritures.filter(e => (!outil || e.outil === outil) && (!uid || e.user_id === uid));
async function repondre(r, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue().catch(() => {});
  if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" }).catch(() => {});
  if (!host.endsWith(".supabase.co")) return r.abort().catch(() => {});
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" } }).catch(() => {});
  const corps = req.postData() || "";
  const mo = /^Bearer jeton-([0-9a-f-]{36})$/.exec(req.headers()["authorization"] || ""), moi = mo ? mo[1] : null;
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
  if (p === "/rest/v1/emails_prospects") return json([]);
  if (p === "/rest/v1/profils") { const id = (q.get("id") || "").replace(/^eq\./, ""); let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(m === "GET" ? l : []); }
  if (p === "/rest/v1/donnees") {
    if (m === "POST" || m === "PATCH") {
      let rows = []; try { rows = JSON.parse(corps); } catch (e) {}
      (Array.isArray(rows) ? rows : [rows]).forEach(x => {
        if (!x) return;
        db.n++; db.ecritures.push({ n: db.n, par: moi, user_id: x.user_id, outil: x.outil, contenu: clone(x.contenu), maj_le: x.maj_le });   // noté même refusé
        if (x.user_id === moi) mettre(db, x.user_id, x.outil, x.contenu, x.maj_le);
      });
      return json(null, 201);
    }
    if (m !== "GET") { db.n++; db.ecritures.push({ n: db.n, par: moi, m }); return json(null, 204); }
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "";
    db.n++; db.lectures.push({ n: db.n, uid, outil: o, select: q.get("select") || "" });
    let l = db.donnees.filter(x => coach || (x.user_id === moi && !["notes_coach", "suivi_prospect"].includes(x.outil)));
    if (uid) l = l.filter(x => x.user_id === uid);
    if (o.startsWith("eq.")) l = l.filter(x => x.outil === o.slice(3));
    if (o.startsWith("in.")) { const k = o.slice(3).replace(/^\(|\)$/g, "").split(","); l = l.filter(x => k.includes(x.outil)); }
    return json(clone(l));
  }
  if (p === "/rest/v1/bibliotheque") return json(m === "GET" && coach ? clone(F.bibliotheque) : []);
  const t = p.replace("/rest/v1/", "");
  if (F.catalogue[t]) return json(m === "GET" ? F.catalogue[t] : null);
  return json([]);
}
/* opts.local : { clé: valeur } posées sur l'appareil avant la première visite (un choix d'affichage gardé) */
async function contexte(b, db, who, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: { width: 1100, height: 900 } });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, db));
  await c.addInitScript(({ s, local }) => {
    if (!/^https?:$/.test(location.protocol) || location.hostname !== "localhost" || localStorage.getItem("__init")) return;
    localStorage.setItem("__init", "1");
    localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
    if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
    Object.keys(local || {}).forEach(k => localStorage.setItem(k, local[k]));
  }, { s: who ? session(who, "t@exemple.fr", opts.meta) : null, local: opts.local || null });
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
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1500); };
/* l'état de la formation affichée : modules ouverts, leçons ouvertes, semaine de la diète, cartes du prospect, messages */
const foAff = page => page.evaluate(() => ({
  mods: Array.from(document.querySelectorAll("#fo-vue .fo-mod.ouvert .fo-tete")).map(b => b.dataset.mod),
  exp: Array.from(document.querySelectorAll("#fo-vue .fo-tete[aria-expanded='true']")).map(b => b.dataset.mod),
  lecons: Array.from(document.querySelectorAll("#fo-vue .fo-lecon")).filter(l => l.querySelector(".fo-lecon-corps")).map(l => l.querySelector("[data-lecon]").dataset.lecon),
  sem: (document.getElementById("fo-sem") || {}).value || null,
  jours: Array.from(document.querySelectorAll("[data-fj]")).filter(b => b.getAttribute("aria-pressed") === "true").map(b => b.dataset.fj),
  notes: Array.from(document.querySelectorAll("#fo-vue [data-nt]")).map(e => e.value),
  depart: !!document.getElementById("fo-depart"), apercu: !!document.getElementById("fo-apercu"),
  toasts: (document.getElementById("toasts") || {}).textContent || ""
})).catch(e => String(e));
const local = (page, k) => page.evaluate(k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return "illisible"; } }, k);
const cleAff = uid => "mhx_aff|" + uid + "|formation";
const clic = async (page, sel, ms) => { await page.click(sel); await attendre(page, ms || 450); };
const clavier = async (page, sel, ms) => { await page.focus(sel); await page.keyboard.press("Enter"); await attendre(page, ms || 450); };
const MOD = m => `#fo-vue .fo-tete[data-mod="${m}"]`, LEC = l => `#fo-vue [data-lecon="${l}"]`;

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();

  /* =================== A. client, deux appareils =================== */
  await bloc("A. client : modules et leçons, deux appareils", async () => {
    const db = base(); mettre(db, THOMAS, "formation", FO(), "2026-09-28T08:00:00Z");
    const { page } = await contexte(b, db, THOMAS);
    await page.goto(URL0 + "#/formation"); await pret(page, "#fo-sem"); await attendre(page, 1200);
    const a0 = await foAff(page);
    /* pendant ce temps, une note est ajoutée sur le téléphone */
    mettre(db, THOMAS, "formation", FO({ notes: [clone(NOTE_TEL)] }));
    await clic(page, MOD("m1"));                 // m1 ouvert (m2 fermé)
    await clic(page, LEC("mindset"));            // la leçon Mindset ouverte
    const a1 = await foAff(page);
    await clic(page, LEC("mindset"));            // fermée
    const a2 = await foAff(page);
    await clic(page, LEC("mindset"));            // rouverte
    await clic(page, MOD("m0")); await clic(page, MOD("m0"));   // m0 ouvert puis fermé : plus rien d'ouvert
    const a3 = await foAff(page);
    await clic(page, MOD("m1"), 1800);           // m1 rouvert (sa leçon toujours ouverte) ; 700 ms d'attente d'un envoi dépassées
    const a4 = await foAff(page), L = await local(page, cleAff(THOMAS)), fo = ligne(db, THOMAS, "formation").contenu;
    ok("au départ, le module 02 du document est ouvert (aucun choix sur cet appareil)", egal(a0.mods, ["m2"]) && egal(a0.exp, ["m2"]) && egal(a0.lecons, []) && a0.sem === "1", JSON.stringify(a0));
    ok("ouvrir le module 01 puis sa leçon, la fermer, la rouvrir, ouvrir puis fermer le module 00, rouvrir le 01 : l'affichage suit à chaque clic",
      egal(a1.mods, ["m1"]) && egal(a1.lecons, ["mindset"]) && egal(a2.mods, ["m1"]) && egal(a2.lecons, []) && egal(a3.mods, []) && egal(a3.exp, []) && egal(a4.mods, ["m1"]) && egal(a4.lecons, ["mindset"]),
      JSON.stringify([a1, a2, a3, a4].map(x => [x.mods, x.lecons])));
    ok("RIEN n'est écrit (aucune écriture de formation) : la note ajoutée sur le téléphone reste en base, avec les objectifs, les priorités, le challenge, les défis et la diète",
      ecr(db, "formation").length === 0 && fo.notes.length === 1 && fo.notes[0].id === "n-tel" && fo.objectifs.length === 1 && fo.priorites.semaine.length === 1 && fo.challenge === "c3" && fo.defis.d2 === true && fo.diete["1"]["0"][0].p === "20" && fo.ouvert === "m2",
      JSON.stringify([ecr(db, "formation").map(e => e.outil), fo.notes, fo.ouvert]));
    ok("aucun message (« Non enregistré »…) pour un simple clic d'affichage", !/Non enregistré|Hors ligne/.test(a4.toasts), a4.toasts);
    ok("le choix est gardé sur l'appareil : mhx_aff|<compte>|formation = { semaine: 1, jour: 0, ouvert: \"m1\", lecon: \"mindset\", challenge: \"c3\" } (v67, 3e tour : + la carte de challenge ouverte, celle du document)",
      egal(L, { semaine: 1, jour: 0, ouvert: "m1", lecon: "mindset", challenge: "c3" }), JSON.stringify(L));
    await page.reload(); await pret(page, MOD("m1")); await attendre(page, 1500);
    const a5 = await foAff(page);
    ok("page rechargée : le module 01 et sa leçon restent ouverts (choix de l'appareil, le document dit toujours m2), toujours rien d'écrit",
      egal(a5.mods, ["m1"]) && egal(a5.lecons, ["mindset"]) && ecr(db, "formation").length === 0 && ligne(db, THOMAS, "formation").contenu.ouvert === "m2", JSON.stringify([a5, ecr(db, "formation").length]));
    await clic(page, MOD("m4"), 900);            // les notes (module 04) : celle du téléphone est affichée
    const a6 = await foAff(page);
    ok("module 04 ouvert : la note du téléphone est affichée, rien d'écrit", egal(a6.mods, ["m4"]) && egal(a6.notes, ["Note du téléphone"]) && ecr(db, "formation").length === 0, JSON.stringify([a6.mods, a6.notes, ecr(db, "formation").length]));
    await clic(page, MOD("m1"), 900);
    await page.check('[data-coche="m1a"]'); await attendre(page, 1800);
    const E = ecr(db, "formation"), der = E[E.length - 1] && E[E.length - 1].contenu;
    ok("puis une vraie saisie (case m1a cochée) : formation écrit avec la case ET la note du téléphone, la diète, les objectifs, le challenge ; le document garde ses champs ouvert (\"m1\") et lecon (\"mindset\"), semaine et jour",
      E.length === 1 && !!der && der.coches.m1a === true && der.coches.p1a === true && der.notes.length === 1 && der.notes[0].id === "n-tel" && der.diete["1"]["0"][0].p === "20" && der.objectifs.length === 1 && der.challenge === "c3"
      && der.ouvert === "m1" && der.lecon === "mindset" && der.semaine === 1 && der.jour === 0,
      JSON.stringify([E.length, der && der.coches, der && der.notes, der && der.ouvert, der && der.lecon]));
  });

  /* =================== B. anciens formats, valeurs gardées =================== */
  await bloc("B. anciens formats et valeurs gardées", async () => {
    /* B1 : aucun choix sur l'appareil → celui du document, rien ne change à l'écran */
    {
      const db = base(); mettre(db, THOMAS, "formation", FO({ lecon: "alimentation" }), "2026-09-28T08:00:00Z");
      const { page } = await contexte(b, db, THOMAS);
      await page.goto(URL0 + "#/formation"); await pret(page, "#fo-sem"); await attendre(page, 1500);
      const a = await foAff(page);
      ok("client existant, aucun choix sur cet appareil : le module 02 et la leçon « alimentation » du document sont ouverts, rien d'écrit",
        egal(a.mods, ["m2"]) && egal(a.lecons, ["alimentation"]) && a.sem === "1" && ecr(db, "formation").length === 0, JSON.stringify([a, ecr(db, "formation").length]));
    }
    /* B2 : choix gardé par la v67 ({ semaine, jour }) → module et leçon du document */
    {
      const db = base(); mettre(db, THOMAS, "formation", FO({ lecon: "alimentation" }), "2026-09-28T08:00:00Z");
      const { page } = await contexte(b, db, THOMAS, { local: { [cleAff(THOMAS)]: JSON.stringify({ semaine: 3, jour: 4 }) } });
      await page.goto(URL0 + "#/formation"); await pret(page, "#fo-sem"); await attendre(page, 1500);
      const a = await foAff(page);
      ok("choix gardé par la v67 ({ semaine: 3, jour: 4 }) : semaine 3, vendredi, ET le module 02 et sa leçon du document",
        egal(a.mods, ["m2"]) && egal(a.lecons, ["alimentation"]) && a.sem === "3" && egal(a.jours, ["4"]), JSON.stringify(a));
      await clic(page, LEC("alimentation"), 1600);
      const a2 = await foAff(page), L = await local(page, cleAff(THOMAS));
      ok("leçon fermée : rien d'écrit ; le choix de l'appareil devient { semaine: 3, jour: 4, ouvert: \"m2\", lecon: \"\", challenge: \"c3\" } (v67, 3e tour : + le challenge du document)",
        egal(a2.lecons, []) && egal(a2.mods, ["m2"]) && ecr(db, "formation").length === 0 && egal(L, { semaine: 3, jour: 4, ouvert: "m2", lecon: "", challenge: "c3" }), JSON.stringify([a2.lecons, ecr(db, "formation").length, L]));
    }
    /* B3 : valeurs inconnues ou de mauvais type → ignorées (celles du document) */
    for (const [quoi, v] of [["module et leçon inconnus", { semaine: 2, jour: 1, ouvert: "m99", lecon: "<img src=x onerror=alert(1)>" }], ["types faux", { semaine: 2, jour: 1, ouvert: 5, lecon: null }], ["leçon hors formation", { semaine: 2, jour: 1, ouvert: {}, lecon: "toString" }]]) {
      const db = base(); mettre(db, THOMAS, "formation", FO({ lecon: "alimentation" }), "2026-09-28T08:00:00Z");
      const { page } = await contexte(b, db, THOMAS, { local: { [cleAff(THOMAS)]: JSON.stringify(v) } });
      await page.goto(URL0 + "#/formation"); await pret(page, "#fo-sem"); await attendre(page, 1500);
      const a = await foAff(page);
      ok(`choix gardé illisible (${quoi} : ${JSON.stringify(v).slice(0, 70)}) : ignoré — module 02 et leçon « alimentation » du document, semaine 2 et mardi gardés, rien d'écrit`,
        egal(a.mods, ["m2"]) && egal(a.lecons, ["alimentation"]) && a.sem === "2" && egal(a.jours, ["1"]) && ecr(db, "formation").length === 0, JSON.stringify([a, ecr(db, "formation").length]));
    }
    /* B4 : « tout fermé » gardé sur l'appareil */
    {
      const db = base(); mettre(db, THOMAS, "formation", FO({ lecon: "alimentation" }), "2026-09-28T08:00:00Z");
      const { page } = await contexte(b, db, THOMAS, { local: { [cleAff(THOMAS)]: JSON.stringify({ semaine: 1, jour: 0, ouvert: "", lecon: "" }) } });
      await page.goto(URL0 + "#/formation"); await pret(page, MOD("m2")); await attendre(page, 1500);
      const a = await foAff(page);
      ok("choix gardé « tout fermé » ({ ouvert: \"\", lecon: \"\" }) : aucun module ouvert (le document dit m2), rien d'écrit",
        egal(a.mods, []) && egal(a.exp, []) && a.sem === null && ecr(db, "formation").length === 0, JSON.stringify([a, ecr(db, "formation").length]));
    }
  });

  /* =================== C. coach dans la fiche d'un client =================== */
  await bloc("C. coach dans la fiche d'un client", async () => {
    const db = base(); mettre(db, THOMAS, "formation", FO(), "2026-09-28T08:00:00Z"); mettre(db, SARAH, "formation", FO({ ouvert: "m4", lecon: "", notes: [clone(NOTE_TEL)] }), "2026-09-28T08:00:00Z");
    const avantT = clone(ligne(db, THOMAS, "formation")), avantS = clone(ligne(db, SARAH, "formation"));
    const { page } = await contexte(b, db, COACH);
    await page.goto(URL0 + "#/tableau"); await pret(page); await attendre(page, 800);
    await aller(page, "#/clients", 2000); await page.waitForSelector(`[data-ouvrir="${THOMAS}"]`, { timeout: 8000 });
    await page.click(`[data-ouvrir="${THOMAS}"]`); await page.waitForSelector("#vue .bandeau", { timeout: 8000 }); await attendre(page, 800);
    await aller(page, "#/formation", 1800); await page.waitForSelector(MOD("m2"), { timeout: 8000 }); await attendre(page, 600);
    const c0 = await foAff(page), consulte = await page.evaluate(() => Store.idConsulte);
    /* en consultation, la souris est coupée sur les boutons (.lecture-seule .panel button : pointer-events none) : au clavier */
    await clavier(page, MOD("m3")); await clavier(page, MOD("m1")); await clavier(page, LEC("mindset"), 1800);
    const c1 = await foAff(page), L = await local(page, cleAff(THOMAS));
    ok("coach dans la fiche de Thomas, #/formation : le module 02 de son document ouvert ; ouvrir (au clavier) le 03, puis le 01 et sa leçon : l'affichage suit",
      consulte === THOMAS && egal(c0.mods, ["m2"]) && egal(c1.mods, ["m1"]) && egal(c1.lecons, ["mindset"]), JSON.stringify([consulte, c0.mods, c1.mods, c1.lecons]));
    ok("rien n'est écrit (aucune écriture chez Thomas ni de formation, même refusée), le document de Thomas est inchangé, aucun message",
      ecr(db, "formation").length === 0 && ecr(db, null, THOMAS).length === 0 && egal(ligne(db, THOMAS, "formation"), avantT) && !/Non enregistré|Hors ligne/.test(c1.toasts), JSON.stringify([db.ecritures.map(e => [e.par, e.user_id, e.outil]), c1.toasts]));
    ok("le choix reste sur l'appareil du coach, pour ce client : mhx_aff|<Thomas>|formation = { semaine: 1, jour: 0, ouvert: \"m1\", lecon: \"mindset\", challenge: \"c3\" } (v67, 3e tour : + le challenge du document)",
      egal(L, { semaine: 1, jour: 0, ouvert: "m1", lecon: "mindset", challenge: "c3" }), JSON.stringify(L));
    /* la fiche de Sarah : son propre document (module 04), pas le choix fait chez Thomas */
    await aller(page, "#/clients", 2000); await page.waitForSelector(`[data-ouvrir="${SARAH}"]`, { timeout: 8000 });
    await page.click(`[data-ouvrir="${SARAH}"]`); await page.waitForSelector("#vue .bandeau", { timeout: 8000 }); await attendre(page, 800);
    await aller(page, "#/formation", 1800); await page.waitForSelector(MOD("m4"), { timeout: 8000 }); await attendre(page, 600);
    const c2 = await foAff(page), consulte2 = await page.evaluate(() => Store.idConsulte);
    ok("puis la fiche de Sarah : son propre document (module 04 ouvert, sa note affichée), pas le choix fait chez Thomas ; toujours rien d'écrit, son document inchangé",
      consulte2 === SARAH && egal(c2.mods, ["m4"]) && egal(c2.lecons, []) && egal(c2.notes, ["Note du téléphone"]) && ecr(db, "formation").length === 0 && ecr(db, null, SARAH).length === 0 && egal(ligne(db, SARAH, "formation"), avantS),
      JSON.stringify([consulte2, c2.mods, c2.lecons, c2.notes, ecr(db, "formation").length]));
  });

  /* =================== D. prospect : cartes du haut, module 01, invitation =================== */
  await bloc("D. prospect", async () => {
    const db = base(true); mettre(db, PROSPECT, "formation", FO({ coches: clone(SIX), ouvert: "", diete: {}, challenge: "", defis: {}, priorites: { semaine: [], demain: [] }, objectifs: [] }), ilYa(H));
    const { page } = await contexte(b, db, PROSPECT, { meta: ACCORD_SANTE });
    await page.goto(URL0 + "#/formation"); await pret(page, "#fo-vue .prog-compteur"); await attendre(page, 1500);
    const d0 = await foAff(page);
    await clic(page, MOD("m1")); await clic(page, LEC("mindset")); await clic(page, LEC("mindset")); await clic(page, LEC("mindset"), 1800);
    const d1 = await foAff(page), L = await local(page, cleAff(PROSPECT));
    ok("prospect : « Commence ici » et « Ce qui t'attend » affichés, aucun module ouvert ; ouvrir le module 01 et sa leçon (fermée, rouverte) : les deux cartes restent, RIEN n'est écrit, le choix gardé sur l'appareil",
      d0.depart && d0.apercu && egal(d0.mods, []) && d1.depart && d1.apercu && egal(d1.mods, ["m1"]) && egal(d1.lecons, ["mindset"]) && ecr(db, "formation").length === 0 && egal(L, { semaine: 1, jour: 0, ouvert: "m1", lecon: "mindset", challenge: "" }),
      JSON.stringify([d0.depart, d0.apercu, d0.mods, d1.mods, d1.lecons, ecr(db, "formation").map(e => e.outil), L]));
    await page.check('[data-coche="m1g"]');
    await page.waitForSelector("#invitation-declic_mindset", { timeout: 6000 }).catch(() => null); await attendre(page, 1500);
    const E = ecr(db, "formation", PROSPECT), der = E[E.length - 1] && E[E.length - 1].contenu;
    const pl = await page.evaluate(() => { const s = document.querySelector('#fo-vue [data-mod="m1"]').closest("section"), c = document.getElementById("invitation-declic_mindset"); return { carte: !!c, juste: !!c && s.nextElementSibling === c, n: document.querySelectorAll(".invitation").length }; });
    ok("7e case du module 01 : formation écrite une fois (les 7 cases, module 01 et leçon ouverts dans le document) ; l'invitation declic_mindset juste après la section du module",
      E.length === 1 && !!der && Object.keys(SIX).concat("m1g").every(k => der.coches[k] === true) && der.ouvert === "m1" && der.lecon === "mindset" && pl.carte && pl.juste && pl.n === 1,
      JSON.stringify([E.length, der && der.coches, der && der.ouvert, der && der.lecon, pl]));
    await clic(page, MOD("m1"), 1500);
    const d2 = await foAff(page), E2 = ecr(db, "formation", PROSPECT);
    ok("module 01 refermé ensuite : rien d'écrit de plus", egal(d2.mods, []) && E2.length === 1, JSON.stringify([d2.mods, E2.length]));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
