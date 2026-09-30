/* verif78 — v67 (3e tour, audit du 01/10) : deux pertes de données.
   1. Speed Formation : ouvrir ou fermer une carte de challenge (module 05, [data-chal], D.challenge) réécrivait TOUT
      « formation » depuis la copie de la page : la page restée ouverte sur l'ordinateur effaçait les notes, objectifs, diète
      saisis sur le téléphone rien qu'en ouvrant une carte. Maintenant : affichage seul, comme le module et la leçon ouverts
      (verif76) — choix gardé sur l'appareil dans mhx_aff|<compte>|formation = { semaine, jour, ouvert, lecon, challenge } ;
      au départ, celui du document ; un challenge qui n'existe pas est ignoré ; les champs du document restent.
   2. Mon suivi : les objectifs du mois étaient lus par Store.lireTout (sans la copie gardée sur l'appareil) puis réécrits à
      chaque case : une case dont l'envoi avait raté (copie gardée), Mon suivi rouvert avant le nouvel essai automatique
      (30 s), la case suivante effaçait la première. Maintenant : la copie de l'appareil plus récente que la base passe
      devant (même règle que Store.lire, Store.copieAServir) ; une base plus récente reste servie.
   A. client, deux appareils : ouvrir / fermer des cartes de challenge → rien d'écrit, la note du téléphone reste ; le choix
      gardé sur l'appareil ; page rechargée : même carte ouverte ; puis une vraie saisie (un défi) : la note du téléphone est
      dans ce qui est écrit, le document garde son champ challenge.
   B. valeurs gardées : challenge inconnu ou de mauvais type → celui du document ; choix gardé sans challenge (verif76) →
      celui du document ; « aucune carte ouverte » gardé.
   C. objectifs du mois : envoi raté (503) de la 1re case, Mon suivi rouvert, 2e case → les deux cochées en base ;
      base plus récente que la copie → la base est affichée, rien d'écrit à l'ouverture.
   Supabase simulé : rien ne part vers la vraie base (routage par NOM D'HÔTE). Comptes fictifs (fixtures).
   Usage : node verif78.js ../index.html
           VERIF78_PORT=9941 node verif78.js ../index.html     (autre port, si 9940 est pris) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const FT = require("./fichiers");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF78_PORT || 9940;
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
const H = 3600000;
const ilYa = ms => new Date(Date.now() - ms).toISOString();
const MOIS = F.AUJ.slice(0, 7);

/* ---------- personnes ---------- */
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + 86400000, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: meta } : {}) });
const THOMAS = F.IDS.c1;
const LIGNE = (p) => ({ f: !!p, p: p || "", g: "", l: "" });
const FO = extra => Object.assign({ coches: { p1a: true }, ouvert: "m5", lecon: "", challenge: "c3", defis: { d2: true },
  diete: { "1": { "0": [LIGNE("20"), LIGNE(), LIGNE(), LIGNE(), LIGNE(), LIGNE()] } },
  semaine: 1, jour: 0, priorites: { semaine: [{ id: "p-ord", texte: "Marcher 30 min", fait: false }], demain: [] }, notes: [], objectifs: [{ id: "o-1", titre: "Perdre 3 kg", mesure: "", echeance: "", fait: false }] }, extra || {});
const NOTE_TEL = { id: "n-tel", date: F.AUJ, titre: "Note du téléphone", texte: "écrite sur l'autre appareil" };

/* ---------- le faux Supabase : lectures et écritures notées (même refusées), upsert de « donnees » ;
   db.panne = liste de clés dont l'envoi échoue (503, comme un serveur qui ne répond plus : la copie reste sur l'appareil) ---------- */
function base(){
  const profils = clone(F.profils); profils.forEach(p => { if (p.role !== "coach") p.statut = "client"; });
  return { profils, donnees: clone(F.donnees), n: 0, ecritures: [], lectures: [], panne: [] };
}
const ligne = (db, uid, outil) => db.donnees.find(x => x.user_id === uid && x.outil === outil);
function mettre(db, uid, outil, contenu, maj){
  const l = ligne(db, uid, outil);
  if (l){ l.contenu = clone(contenu); l.maj_le = maj || new Date().toISOString(); } else db.donnees.push({ user_id: uid, outil, contenu: clone(contenu), maj_le: maj || new Date().toISOString() });
}
const ecr = (db, outil, uid) => db.ecritures.filter(e => !e.echec && (!outil || e.outil === outil) && (!uid || e.user_id === uid));
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
      rows = (Array.isArray(rows) ? rows : [rows]).filter(Boolean);
      if (rows.some(x => db.panne.includes(x.outil))) {
        rows.forEach(x => { db.n++; db.ecritures.push({ n: db.n, par: moi, user_id: x.user_id, outil: x.outil, contenu: clone(x.contenu), maj_le: x.maj_le, echec: true }); });
        return json({ message: "Service Unavailable" }, 503);
      }
      rows.forEach(x => {
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
/* la formation affichée : modules ouverts, cartes de challenge ouvertes (classe ET aria-pressed), notes, défis, messages */
const foAff = page => page.evaluate(() => ({
  mods: Array.from(document.querySelectorAll("#fo-vue .fo-mod.ouvert .fo-tete")).map(b => b.dataset.mod),
  chal: Array.from(document.querySelectorAll("#fo-vue .fo-chal.fo-chal-on [data-chal]")).map(b => b.dataset.chal),
  presses: Array.from(document.querySelectorAll("#fo-vue [data-chal][aria-pressed='true']")).map(b => b.dataset.chal),
  nbChal: document.querySelectorAll("#fo-vue [data-chal]").length,
  notes: Array.from(document.querySelectorAll("#fo-vue [data-nt]")).map(e => e.value),
  toasts: (document.getElementById("toasts") || {}).textContent || ""
})).catch(e => String(e));
const local = (page, k) => page.evaluate(k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return "illisible"; } }, k);
const cleAff = uid => "mhx_aff|" + uid + "|formation";
const clic = async (page, sel, ms) => { await page.click(sel); await attendre(page, ms || 450); };
const MOD = m => `#fo-vue .fo-tete[data-mod="${m}"]`, CHAL = c => `#fo-vue [data-chal="${c}"]`;
/* Mon suivi : les cases des objectifs du mois */
const objAff = page => page.evaluate(() => ({
  cases: Array.from(document.querySelectorAll("#suivi-reg .obj-case")).map(c => ({ i: c.dataset.obj, coche: c.checked, off: c.disabled })),
  toasts: (document.getElementById("toasts") || {}).textContent || ""
})).catch(e => String(e));
const OBJ = i => `#suivi-reg .obj-case[data-obj="${i}"]`;

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();

  /* =================== A. client, deux appareils : cartes de challenge =================== */
  await bloc("A. client : cartes de challenge, deux appareils", async () => {
    const db = base(); mettre(db, THOMAS, "formation", FO(), "2026-09-28T08:00:00Z");
    const { page } = await contexte(b, db, THOMAS);
    await page.goto(URL0 + "#/formation"); await pret(page, CHAL("c1")); await attendre(page, 1200);
    const a0 = await foAff(page);
    /* pendant ce temps, une note est ajoutée sur le téléphone */
    mettre(db, THOMAS, "formation", FO({ notes: [clone(NOTE_TEL)] }));
    await clic(page, CHAL("c1"));              // c1 ouverte (c3 fermée)
    const a1 = await foAff(page);
    await clic(page, CHAL("c1"));              // fermée : aucune carte ouverte
    const a2 = await foAff(page);
    await clic(page, CHAL("c3")); await clic(page, CHAL("c5"), 1800);   // c3 puis c5 ; 700 ms d'attente d'un envoi dépassées
    const a3 = await foAff(page), L = await local(page, cleAff(THOMAS)), fo = ligne(db, THOMAS, "formation").contenu;
    ok("au départ, la carte c3 du document est ouverte (aucun choix sur cet appareil), module 05 ouvert, 5 cartes",
      egal(a0.mods, ["m5"]) && egal(a0.chal, ["c3"]) && egal(a0.presses, ["c3"]) && a0.nbChal === 5, JSON.stringify(a0));
    ok("ouvrir c1, la fermer, ouvrir c3 puis c5 : l'affichage suit à chaque clic (une seule carte ouverte, aria-pressed à jour)",
      egal(a1.chal, ["c1"]) && egal(a1.presses, ["c1"]) && egal(a2.chal, []) && egal(a2.presses, []) && egal(a3.chal, ["c5"]) && egal(a3.presses, ["c5"]) && egal(a3.mods, ["m5"]),
      JSON.stringify([a1, a2, a3].map(x => [x.chal, x.presses])));
    ok("RIEN n'est écrit (aucune écriture de formation, même ratée) : la note ajoutée sur le téléphone reste en base, avec les objectifs, les priorités, le challenge du document, les défis et la diète",
      db.ecritures.filter(e => e.outil === "formation").length === 0 && fo.notes.length === 1 && fo.notes[0].id === "n-tel" && fo.objectifs.length === 1 && fo.priorites.semaine.length === 1 && fo.challenge === "c3" && fo.defis.d2 === true && fo.diete["1"]["0"][0].p === "20",
      JSON.stringify([db.ecritures.map(e => e.outil), fo.notes, fo.challenge]));
    ok("aucun message (« Non enregistré »…) pour un simple clic d'affichage", !/Non enregistré|Hors ligne/.test(a3.toasts), a3.toasts);
    ok("le choix est gardé sur l'appareil : mhx_aff|<compte>|formation = { semaine: 1, jour: 0, ouvert: \"m5\", lecon: \"\", challenge: \"c5\" }",
      egal(L, { semaine: 1, jour: 0, ouvert: "m5", lecon: "", challenge: "c5" }), JSON.stringify(L));
    await page.reload(); await pret(page, CHAL("c5")); await attendre(page, 1500);
    const a4 = await foAff(page);
    ok("page rechargée : la carte c5 reste ouverte (choix de l'appareil, le document dit toujours c3), toujours rien d'écrit",
      egal(a4.chal, ["c5"]) && egal(a4.presses, ["c5"]) && ecr(db, "formation").length === 0 && ligne(db, THOMAS, "formation").contenu.challenge === "c3", JSON.stringify([a4, ecr(db, "formation").length]));
    await page.check('#fo-vue [data-defi="d1"]'); await attendre(page, 1800);
    const E = ecr(db, "formation"), der = E[E.length - 1] && E[E.length - 1].contenu, a5 = await foAff(page);
    ok("puis une vraie saisie (défi d1 coché) : formation écrite une fois avec le défi ET la note du téléphone, la diète, les objectifs, les priorités ; le document garde son champ challenge (\"c5\", la carte ouverte) ; c5 toujours ouverte",
      E.length === 1 && !!der && der.defis.d1 === true && der.defis.d2 === true && der.notes.length === 1 && der.notes[0].id === "n-tel" && der.diete["1"]["0"][0].p === "20" && der.objectifs.length === 1 && der.priorites.semaine.length === 1
      && der.challenge === "c5" && der.ouvert === "m5" && der.coches.p1a === true && egal(a5.chal, ["c5"]),
      JSON.stringify([E.length, der && der.defis, der && der.notes, der && der.challenge, a5.chal]));
  });

  /* =================== B. valeurs gardées =================== */
  await bloc("B. valeurs gardées", async () => {
    for (const [quoi, v, att] of [
      ["challenge de l'appareil (c2)", { semaine: 1, jour: 0, ouvert: "m5", lecon: "", challenge: "c2" }, ["c2"]],
      ["challenge inconnu", { semaine: 1, jour: 0, ouvert: "m5", lecon: "", challenge: "c99" }, ["c3"]],
      ["challenge de mauvais type", { semaine: 1, jour: 0, ouvert: "m5", lecon: "", challenge: 2 }, ["c3"]],
      ["challenge hors formation", { semaine: 1, jour: 0, ouvert: "m5", lecon: "", challenge: "toString" }, ["c3"]],
      ["choix gardé sans challenge (verif76)", { semaine: 1, jour: 0, ouvert: "m5", lecon: "" }, ["c3"]],
      ["« aucune carte ouverte » gardé", { semaine: 1, jour: 0, ouvert: "m5", lecon: "", challenge: "" }, []]]) {
      const db = base(); mettre(db, THOMAS, "formation", FO(), "2026-09-28T08:00:00Z");
      const { page } = await contexte(b, db, THOMAS, { local: { [cleAff(THOMAS)]: JSON.stringify(v) } });
      await page.goto(URL0 + "#/formation"); await pret(page, CHAL("c1")); await attendre(page, 1500);
      const a = await foAff(page);
      ok(`${quoi} (${JSON.stringify(v.challenge)}) : carte ouverte ${JSON.stringify(att)} (le document dit c3), rien d'écrit`,
        egal(a.chal, att) && egal(a.presses, att) && egal(a.mods, ["m5"]) && db.ecritures.filter(e => e.outil === "formation").length === 0, JSON.stringify([a, ecr(db, "formation").length]));
    }
  });

  /* =================== C. Mon suivi : objectifs du mois, envoi raté puis page rouverte =================== */
  await bloc("C. objectifs du mois : envoi raté, Mon suivi rouvert, case suivante", async () => {
    const db = base(); mettre(db, THOMAS, "objectifs_faits", { mois: MOIS, faits: [] }, ilYa(H));
    const { page } = await contexte(b, db, THOMAS);
    await page.goto(URL0 + "#/suivi"); await pret(page, OBJ(0)); await attendre(page, 1200);
    const o0 = await objAff(page);
    ok("Mon suivi : les 3 objectifs du mois, aucun coché, le 3e tranché par le coach (désactivé)",
      egal(o0.cases, [{ i: "0", coche: false, off: false }, { i: "1", coche: false, off: false }, { i: "2", coche: false, off: true }]), JSON.stringify(o0));
    db.panne = ["objectifs_faits"];
    await page.check(OBJ(0)); await attendre(page, 1800);
    const copie = await page.evaluate(u => { try { return JSON.parse(localStorage.getItem("mhx_attente|" + u + "|objectifs_faits")); } catch (e) { return null; } }, THOMAS);
    ok("1re case cochée, envoi raté (503) : rien en base, la copie reste sur l'appareil (faits[0] coché)",
      db.ecritures.some(e => e.outil === "objectifs_faits" && e.echec) && ecr(db, "objectifs_faits").length === 0 && egal(ligne(db, THOMAS, "objectifs_faits").contenu.faits, [])
      && !!copie && copie.v && copie.v.faits && copie.v.faits[0] === true, JSON.stringify([db.ecritures.map(e => [e.outil, !!e.echec]), copie]));
    db.panne = [];
    await aller(page, "#/formation", 1500);
    await aller(page, "#/suivi", 1800); await page.waitForSelector(OBJ(1), { timeout: 8000 }); await attendre(page, 400);
    const o1 = await objAff(page);
    ok("Mon suivi rouvert avant le nouvel essai automatique (30 s) : la 1re case est affichée cochée (copie de l'appareil, plus récente que la base), rien d'écrit à l'ouverture",
      !!o1.cases && o1.cases[0] && o1.cases[0].coche === true && o1.cases[1].coche === false && ecr(db, "objectifs_faits").length === 0, JSON.stringify([o1, ecr(db, "objectifs_faits").length]));
    await page.check(OBJ(1)); await attendre(page, 1800);
    const E = ecr(db, "objectifs_faits"), der = E[E.length - 1] && E[E.length - 1].contenu, enBase = ligne(db, THOMAS, "objectifs_faits").contenu, o2 = await objAff(page);
    ok("2e case cochée : objectifs_faits écrit avec les DEUX cases (la 1re n'est plus effacée) ; en base : faits[0] et faits[1] cochés, mois gardé",
      E.length === 1 && !!der && der.faits[0] === true && der.faits[1] === true && der.mois === MOIS && enBase.faits[0] === true && enBase.faits[1] === true && enBase.mois === MOIS,
      JSON.stringify([E.map(e => e.contenu), enBase]));
    ok("à l'écran : les deux cases cochées ; la copie de l'appareil retirée (arrivée) ; aucune autre clé écrite",
      o2.cases[0].coche === true && o2.cases[1].coche === true && !(await page.evaluate(u => localStorage.getItem("mhx_attente|" + u + "|objectifs_faits"), THOMAS)) && ecr(db).every(e => e.outil === "objectifs_faits"),
      JSON.stringify([o2.cases, ecr(db).map(e => e.outil)]));
  });

  /* =================== C2. base plus récente que la copie : la base est servie =================== */
  await bloc("C2. objectifs du mois : base plus récente que la copie", async () => {
    const db = base(); mettre(db, THOMAS, "objectifs_faits", { mois: MOIS, faits: [] }, ilYa(H));
    const { page } = await contexte(b, db, THOMAS);
    await page.goto(URL0 + "#/suivi"); await pret(page, OBJ(0)); await attendre(page, 1200);
    db.panne = ["objectifs_faits"];
    await page.check(OBJ(0)); await attendre(page, 1800);
    db.panne = [];
    await attendre(page, 50);
    /* l'autre appareil coche la 2e case APRÈS la copie gardée ici */
    mettre(db, THOMAS, "objectifs_faits", { mois: MOIS, faits: [false, true] }, new Date(Date.now() + 1000).toISOString());
    await aller(page, "#/formation", 1500);
    await aller(page, "#/suivi", 1800); await page.waitForSelector(OBJ(1), { timeout: 8000 }); await attendre(page, 400);
    const o1 = await objAff(page);
    ok("base plus récente que la copie de l'appareil : Mon suivi affiche la base (1re case non cochée, 2e cochée), rien d'écrit à l'ouverture (même règle que Store.lire)",
      !!o1.cases && o1.cases[0] && o1.cases[0].coche === false && o1.cases[1].coche === true && ecr(db, "objectifs_faits").length === 0, JSON.stringify([o1, ecr(db, "objectifs_faits").length]));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
