/* verif73 — v67 (audit du 01/10, lot « store ») : 4 corrections de la couche Store, vérifiées de bout en bout.
   A. (D1, perte de données) une séance notée hors ligne dans « Mon programme » (gardée sur l'appareil), le réseau revient
      SANS événement « online », le client ouvre « Mon journal » et note une 2e séance : les DEUX arrivent dans la base
      (avant : « Mon journal » relisait la base sans la copie de l'appareil, la 2e séance réécrivait le journal sans la
      1re, et la copie était remplacée : 1re séance perdue).
   A2. même chose sans panne : une séance notée puis « Mon journal » ouvert tout de suite (enregistrement encore dans
      ses 700 ms) : les deux séances arrivent.
   A3. envoi qui ne répond plus (réseau pendu) : Store.lire rend la main en moins de 6 s, avec la saisie de l'appareil.
   B. Store.lire et les copies de l'appareil : une copie plus récente que la base est servie (mens) ; plus ancienne,
      non (intake) ; faite par un autre compte (le coach), jamais (programme, repas) ; checkins et activite, jamais (ils
      ont leur propre réunion) ; aucune copie n'est retirée par une lecture.
   B2. le coach, dans la fiche d'un client, retrouve sa propre saisie (programme) gardée sur l'appareil.
   C. (D7) refus définitif (403) : la modification est mise de côté (mhx_refus|compte|clé), plus dans mhx_attente, jamais
      renvoyée (même au retour du réseau), un message le dit (« Préviens ton coach ») en plus de l'en-tête ; déconnexion :
      pas comptée « non envoyée », effacée de l'appareil ; en anglais aussi.
   D. (D8) « Rester connecté » décoché + hors ligne : l'en-tête dit « gardé dans cet onglet seulement : ne le ferme pas »
      (en anglais aussi) ; coché : toujours « gardé sur cet appareil ».
   E. (D5) « Restaurer une sauvegarde » : une confirmation liste les rubriques remplacées (« sera remplacé ») ; « Annuler »
      n'écrit rien ; les compléments (écrits par le coach) ne sont jamais restaurés par un client ; un envoi raté affiche
      « Restauration non enregistrée. » (plus « Sauvegarde restaurée. ») ; Store.importer appelé seul rend toujours true.
   Supabase simulé : rien ne part vers la vraie base (routage par NOM D'HÔTE). Comptes fictifs.
   Usage : node verif73.js ../index.html
           VERIF73_PORT=9891 node verif73.js ../index.html     (autre port, si 9890 est pris) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const FT = require("./fichiers");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF73_PORT || 9890;
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
const norm = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const attendre = (page, ms) => page.waitForTimeout(ms);

const THOMAS = F.IDS.c1, COACH = F.IDS.coach;

/* ---------- le faux Supabase : écritures appliquées en mémoire ; panne (POST coupés), refus (403), lentPost (POST pendu) ---------- */
function base(){
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  /* les dates de la base restent dans le passé, quel que soit le jour de la semaine (les fixtures datent le journal du
     mercredi de la semaine en cours : un lundi, la base serait « plus récente » que toute saisie) */
  const donnees = clone(F.donnees), hier = new Date(Date.now() - 86400000).toISOString();
  donnees.forEach(x => { if (!(new Date(x.maj_le).getTime() < Date.now() - 3600000)) x.maj_le = hier; });
  return { profils, donnees, ecritures: [], posts: [], panne: 0, refus: false, lentPost: 0 };
}
const ligne = (db, uid, outil) => db.donnees.find(x => x.user_id === uid && x.outil === outil);
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.outil === outil && (!uid || e.user_id === uid));
async function repondre(r, db, who){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue().catch(() => {});
  if (!host.endsWith(".supabase.co")) return r.abort().catch(() => {});
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" } }).catch(() => {});
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  if (p.startsWith("/auth/v1/token")) return json(F.session(who.id, who.email));
  if (p.startsWith("/auth/v1/")) return json({});
  if (p.startsWith("/functions/v1/") || p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({});
  if (p === "/rest/v1/profils") { if (m !== "GET") return json(null, 204); const id = q.get("id"); return json(id ? db.profils.filter(x => x.id === id.slice(3)) : db.profils); }
  if (p === "/rest/v1/donnees") {
    if (m !== "GET") {
      db.posts.push(Date.now());
      if (db.panne > 0) { db.panne--; return r.abort().catch(() => {}); }
      if (db.refus) return json({ code: "42501", message: "new row violates row-level security policy" }, 403);
      if (db.lentPost) await new Promise(x => setTimeout(x, db.lentPost));
      let rows = []; try { rows = JSON.parse(req.postData() || "[]"); } catch (e) { }
      (Array.isArray(rows) ? rows : [rows]).forEach(row => {
        db.ecritures.push({ user_id: row.user_id, outil: row.outil, contenu: row.contenu, maj_le: row.maj_le });
        const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
        const l = { user_id: row.user_id, outil: row.outil, contenu: row.contenu, maj_le: row.maj_le || new Date().toISOString() };
        if (i > -1) db.donnees[i] = l; else db.donnees.push(l);
      });
      return json(null, 201);
    }
    let l = db.donnees; const uid = q.get("user_id"), o = q.get("outil") || "";
    if (who.id !== COACH) l = l.filter(x => x.user_id === who.id && x.outil !== "notes_coach" && x.outil !== "suivi_prospect");
    if (uid) l = l.filter(x => x.user_id === uid.slice(3));
    if (o.startsWith("eq.")) l = l.filter(x => x.outil === o.slice(3));
    if (o.startsWith("in.(")) { const k = o.slice(4, -1).split(","); l = l.filter(x => k.includes(x.outil)); }
    const sel = (q.get("select") || "*").split(","); if (!sel.includes("*")) l = l.map(x => Object.fromEntries(sel.map(k => [k, x[k]])));
    return json(clone(l));
  }
  const t = p.replace("/rest/v1/", "");
  if (F.catalogue[t]) { let l = F.catalogue[t]; const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return json(l); }
  return json([]);
}
const thomas = { id: THOMAS, email: "t@e.fr" }, coach = { id: COACH, email: "c@e.fr" };
async function contexte(b, db, who, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, db, who));
  await c.addInitScript(({ s, magasin, langue }) => {
    if (!/^https?:$/.test(location.protocol) || sessionStorage.getItem("__init")) return;
    sessionStorage.setItem("__init", "1");   // une seule fois : un rechargement (déconnexion) garde l'état
    (magasin === "session" ? sessionStorage : localStorage).setItem("mhx_session", JSON.stringify(s));
    localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
    if (langue) localStorage.setItem("mhx_langue", langue);
  }, { s: F.session(who.id, who.email), magasin: opts.magasin || "local", langue: opts.langue || "" });
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return { c, page };
}
async function ouvrir(page, hash, sel){
  await page.goto(URL0 + hash);
  await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 12000 });
  if (sel) await page.waitForSelector(sel, { timeout: 10000 });
  await attendre(page, 600);
}
async function aller(page, hash, sel){
  await page.evaluate(h => { location.hash = h; }, hash);
  if (sel) await page.waitForSelector(sel, { timeout: 10000 });
  await attendre(page, 500);
}
/* « Noter ma séance » (Journal.brancher, dans « Mon programme » comme dans « Mon journal ») : une série, puis « Séance terminée » */
const noter = (page, si, reps) => page.evaluate(([si, reps]) => {
  const z = document.querySelector('[data-jr="' + si + '"]'); if (!z) return "pas de séance " + si;
  z.querySelector("[data-jr-ouvrir]").click();
  const i = z.querySelector("[data-r]"); i.value = String(reps);
  z.querySelector("[data-jr-fin]").click(); return "ok";
}, [si, reps]);
const seancesDuJour = (db) => ((ligne(db, THOMAS, "journal") || {}).contenu || { seances: [] }).seances.filter(x => x && x.date === F.AUJ);
const aSeance = (db, si, reps) => seancesDuJour(db).some(x => x.si === si && x.exos && x.exos[0] && x.exos[0].series[0] && x.exos[0].series[0].r === reps);
const copies = (page, prefixe, m) => page.evaluate(([P, m]) => { const s = m === "session" ? sessionStorage : localStorage, o = {}; for (let i = 0; i < s.length; i++){ const k = s.key(i); if (k && k.indexOf(P) === 0) o[k.slice(P.length)] = JSON.parse(s.getItem(k)); } return o; }, [prefixe, m || "local"]);
const texte = async (page, sel) => norm(await page.textContent(sel).catch(() => ""));

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();

  /* =================== A. D1 : séance hors ligne, puis « Mon journal » =================== */
  await bloc("A. séance hors ligne puis Mon journal", async () => {
    const db = base();
    const { page } = await contexte(b, db, thomas);
    await ouvrir(page, "#/programme", '[data-jr="0"] [data-jr-ouvrir]');
    const n0 = ((ligne(db, THOMAS, "journal") || {}).contenu || { seances: [] }).seances.length;
    db.panne = 1000;   // à la salle : plus de réseau
    const r1 = await noter(page, 0, 11); await attendre(page, 1600);
    const cp = (await copies(page, "mhx_attente|"))[THOMAS + "|journal"];
    ok("« Mon programme », hors ligne : la séance A est gardée sur l'appareil (copie mhx_attente), rien dans la base, l'en-tête dit « gardé sur cet appareil »",
      r1 === "ok" && !!cp && (cp.v.seances || []).some(x => x.date === F.AUJ && x.si === 0) && !aSeance(db, 0, 11) && (await texte(page, "#etat")).includes("gardé sur cet appareil"),
      r1 + " · copie " + !!cp + " · " + (await texte(page, "#etat")));
    db.panne = 0;   // le réseau revient, sans événement « online »
    await aller(page, "#/journal", '[data-jr="1"] [data-jr-ouvrir]');
    const nb = await texte(page, "#jr-nb");
    ok("« Mon journal » ouvert ensuite : la séance A (pas encore arrivée) est affichée (" + (n0 + 1) + " séances)", nb === String(n0 + 1), "compteur " + nb + " · attendu " + (n0 + 1));
    const r2 = await noter(page, 1, 12); await attendre(page, 1800);
    const j = seancesDuJour(db).map(x => x.si + ":" + ((x.exos || [])[0] || { series: [{}] }).series[0].r).join(",");
    ok("séance B notée dans « Mon journal » : la base a les DEUX séances (A et B), aucune perdue, plus aucune copie en attente",
      r2 === "ok" && aSeance(db, 0, 11) && aSeance(db, 1, 12) && ligne(db, THOMAS, "journal").contenu.seances.length === n0 + 2 && !(await copies(page, "mhx_attente|"))[THOMAS + "|journal"],
      r2 + " · séances du jour " + j + " · total " + ((ligne(db, THOMAS, "journal") || {}).contenu || { seances: [] }).seances.length);
  });

  await bloc("A2. séance puis Mon journal dans la seconde", async () => {
    const db = base();
    const { page } = await contexte(b, db, thomas);
    await ouvrir(page, "#/programme", '[data-jr="2"] [data-jr-ouvrir]');
    const r1 = await page.evaluate(() => { const z = document.querySelector('[data-jr="2"]'); z.querySelector("[data-jr-ouvrir]").click(); z.querySelector("[data-r]").value = "13"; z.querySelector("[data-jr-fin]").click(); location.hash = "#/journal"; return "ok"; });
    await page.waitForSelector('[data-jr="3"] [data-jr-ouvrir]', { timeout: 10000 }); await attendre(page, 500);
    const r2 = await noter(page, 3, 14); await attendre(page, 1800);
    ok("séance notée puis « Mon journal » ouvert tout de suite (enregistrement dans ses 700 ms) : la séance part d'abord, la base finit avec les deux",
      r1 === "ok" && r2 === "ok" && aSeance(db, 2, 13) && aSeance(db, 3, 14), seancesDuJour(db).map(x => x.si).join(","));
  });

  await bloc("A3. envoi pendu", async () => {
    const db = base();
    const { page } = await contexte(b, db, thomas);
    await ouvrir(page, "#/accueil", "#acc-vue");
    db.lentPost = 9000;
    const r = await page.evaluate(async () => {
      const M = JSON.parse(JSON.stringify(Store.cache.mens || await Store.lire("mens", {})));
      M.pstart = 71.5; Store.ecrire("mens", M);
      const t0 = Date.now(), L = await Store.lire("mens", {});
      return { ms: Date.now() - t0, pstart: L && L.pstart };
    });
    ok("envoi qui ne répond plus : Store.lire rend la main en moins de 6 s, avec la saisie gardée sur l'appareil (71,5)", r.ms < 6000 && r.pstart === 71.5, JSON.stringify(r));
    db.lentPost = 0; await attendre(page, 6000);
  });

  /* =================== B. Store.lire et les copies de l'appareil =================== */
  await bloc("B. copies servies ou non", async () => {
    const db = base();
    const { page } = await contexte(b, db, thomas);
    await ouvrir(page, "#/accueil", "#acc-vue");
    const r = await page.evaluate(async ([T, C]) => {
      const mettre = (cle, a, t, v) => localStorage.setItem("mhx_attente|" + T + "|" + cle, JSON.stringify({ a, t, v }));
      const maint = new Date().toISOString();
      mettre("mens", T, maint, { pstart: 70.2, zones: [], mesures: [] });
      mettre("intake", T, "2026-01-01T00:00:00.000Z", { nom: "VIEILLE COPIE" });
      mettre("programme", C, maint, { nom: "COPIE DU COACH", seances: [] });
      mettre("repas", C, maint, { note: "COPIE DU COACH", jours: [] });
      mettre("checkins", T, maint, { liste: [{ semaine: "2026-09-28", fin: "2026-10-04", envoye_le: "2026-10-01", reponses: { semaine: "COPIE CHECKIN" } }] });
      mettre("activite", T, maint, { version: 1, jours: ["2026-10-01"], pages: { copie: 99 } });
      const out = {};
      out.mens = (await Store.lire("mens", {})).pstart;
      out.intake = (await Store.lire("intake", {})).nom;
      out.programme = (await Store.lire("programme", {})).nom;
      out.repas = (await Store.lire("repas", {})).note;
      out.checkins = JSON.stringify(await Store.lire("checkins", { liste: [] }));
      out.activite = JSON.stringify(await Store.lire("activite", {}));
      out.restent = ["mens", "intake", "programme", "repas", "checkins"].filter(k => localStorage.getItem("mhx_attente|" + T + "|" + k)).length;
      return out;
    }, [THOMAS, COACH]);
    ok("copie du compte plus récente que la base (mens) : servie par Store.lire", r.mens === 70.2, JSON.stringify(r.mens));
    ok("copie plus ancienne que la base (intake) : la base est servie", r.intake === "Thomas Démo", r.intake);
    ok("copie faite par un AUTRE compte (le coach) sur cet appareil : jamais servie au client (programme, repas)", r.programme === "Bloc 1 — 4 semaines" && r.repas === "Bois 2 L d'eau par jour. Les grammages sont crus.", r.programme + " · " + r.repas);
    ok("checkins et activite : jamais remplacés par la copie (ils ont leur propre réunion)", !r.checkins.includes("COPIE CHECKIN") && !r.activite.includes("copie"), r.checkins.slice(0, 120) + " · " + r.activite.slice(0, 120));
    ok("aucune copie n'est retirée par une lecture (elles repartiront par la reprise)", r.restent === 5, "restent " + r.restent);
  });

  await bloc("B2. le coach retrouve sa saisie dans la fiche d'un client", async () => {
    const db = base();
    const { page } = await contexte(b, db, coach);
    await ouvrir(page, "#/clients", `[data-ouvrir="${THOMAS}"]`);
    await page.evaluate(([T, C]) => {
      const P = { nom: "COPIE DU COACH", note: "", maj: "", seances: [{ nom: "Séance copie", note: "", exercices: [{ nom: "Squat", series: "3", reps: "8", repos: "90 s", note: "", lien: "", id: "" }] }] };
      localStorage.setItem("mhx_attente|" + T + "|programme", JSON.stringify({ a: C, t: new Date().toISOString(), v: P }));
    }, [THOMAS, COACH]);
    await page.click(`[data-ouvrir="${THOMAS}"]`); await page.waitForSelector("#vue .bandeau", { timeout: 10000 }); await attendre(page, 600);
    await aller(page, "#/programme", "#pg-nom");
    const v = await page.$eval("#pg-nom", e => e.value).catch(() => null);
    ok("coach, fiche de Thomas, « Programme » : sa saisie gardée sur l'appareil (plus récente que la base) est affichée", v === "COPIE DU COACH", v);
  });

  /* =================== C. D7 : refus définitif =================== */
  await bloc("C. refus définitif", async () => {
    const db = base(); db.refus = true;
    const { page } = await contexte(b, db, thomas);
    await ouvrir(page, "#/profil", "#q-stress");
    await page.selectOption("#q-stress", "4"); await attendre(page, 1600);
    const envois = db.posts.length;
    const refus = (await copies(page, "mhx_refus|"))[THOMAS + "|intake"], att = await copies(page, "mhx_attente|");
    ok("refus définitif (403) : la modification est mise de côté (mhx_refus|compte|intake, stress 4), plus dans mhx_attente",
      !!refus && String(refus.v.stress) === "4" && refus.a === THOMAS && !att[THOMAS + "|intake"], JSON.stringify(refus) + " · attente " + Object.keys(att));
    ok("… un message le dit (« Non enregistré : la base a refusé cette modification. Préviens ton coach. »), l'en-tête aussi (« modification refusée »)",
      (await texte(page, "#toasts")).includes("Non enregistré : la base a refusé cette modification. Préviens ton coach.") && (await texte(page, "#etat")).includes("modification refusée"),
      (await texte(page, "#toasts")) + " · " + (await texte(page, "#etat")));
    await page.evaluate(() => window.dispatchEvent(new Event("online"))); await attendre(page, 1500);
    ok("… jamais renvoyée (retour du réseau : aucun nouvel envoi)", db.posts.length === envois && envois === 1, "envois " + db.posts.length);
    db.refus = false;
    await page.click("#deco"); await attendre(page, 5200);
    const reste = await page.evaluate(() => Object.keys(localStorage).concat(Object.keys(sessionStorage)).filter(k => k.indexOf("mhx_refus|") === 0 || k === "mhx_session"));
    ok("… déconnexion : pas de « modifications non envoyées » à confirmer, la copie mise de côté est effacée de l'appareil", reste.length === 0, JSON.stringify(reste));
  });

  await bloc("C2. refus définitif en anglais", async () => {
    const db = base(); db.refus = true; ligne(db, THOMAS, "prefs").contenu.langue = "en";
    const { page } = await contexte(b, db, thomas, { langue: "en" });
    await ouvrir(page, "#/profil", "#q-stress");
    await page.selectOption("#q-stress", "5"); await attendre(page, 1600);
    ok("en anglais : « Not saved: the server refused this change. Let your coach know. »", (await texte(page, "#toasts")).includes("Not saved: the server refused this change. Let your coach know."), await texte(page, "#toasts"));
  });

  /* =================== D. D8 : « Rester connecté » décoché =================== */
  await bloc("D. en-tête hors ligne", async () => {
    for (const [magasin, langue, attendu] of [["session", "", "Hors ligne — gardé dans cet onglet seulement : ne le ferme pas"], ["session", "en", "Offline — kept in this tab only: don't close it"], ["local", "", "Hors ligne — gardé sur cet appareil, renvoi automatique"]]) {
      const db = base(); db.panne = 1000; if (langue) ligne(db, THOMAS, "prefs").contenu.langue = langue;
      const { c, page } = await contexte(b, db, thomas, { magasin, langue });
      await ouvrir(page, "#/profil", "#q-stress");
      await page.selectOption("#q-stress", "8"); await attendre(page, 1600);
      const e = await texte(page, "#etat"), cp = (await copies(page, "mhx_attente|", magasin))[THOMAS + "|intake"];
      ok(`« Rester connecté » ${magasin === "session" ? "décoché" : "coché"}${langue ? " (anglais)" : ""}, hors ligne : l'en-tête dit « ${attendu} », la copie est ${magasin === "session" ? "dans l'onglet" : "sur l'appareil"}`, e === attendu && !!cp, e);
      await c.close();
    }
  });

  /* =================== E. D5 : Restaurer une sauvegarde =================== */
  await bloc("E. restaurer une sauvegarde", async () => {
    const db = base();
    const { page } = await contexte(b, db, thomas);
    await ouvrir(page, "#/profil", "#sv-paste");
    const FO = { coches: { p1a: true, p2a: true }, ouvert: "", lecon: "", challenge: "", defis: {}, diete: {}, semaine: 1, jour: 0, priorites: { semaine: [], demain: [] }, notes: [], objectifs: [], restauree: 73 };
    const sauvegarde = JSON.stringify({ plateforme: "mhx", version: 2, donnees: { formation: FO, complements: { note: "COMPLEMENTS DE LA SAUVEGARDE", liste: [] }, programme: { nom: "VIEUX PROGRAMME", seances: [] } } });
    const coller = async () => {
      await page.click("#sv-paste"); await page.waitForSelector(".modale #ui-champ"); await page.fill("#ui-champ", sauvegarde);
      await page.click('.modale [data-ui-b="1"]'); await attendre(page, 700);
    };
    await coller();
    const m = await texte(page, ".modale .corps");
    ok("« Restaurer » : une confirmation liste les rubriques remplacées (Speed Formation, jamais Mes compléments ni le programme) et dit « Ce que tu as saisi depuis cette copie sera remplacé. »",
      m.includes("Speed Formation") && m.includes("Ce que tu as saisi depuis cette copie sera remplacé.") && !m.includes("compléments") && !/programme/i.test(m) && db.ecritures.length === 0, m || "(pas de confirmation)");
    await page.click('.modale [data-ui-b="0"]').catch(() => {}); await attendre(page, 1000);
    ok("… « Annuler » : rien n'est écrit", db.ecritures.length === 0 && !(await page.$(".modale")), JSON.stringify(db.ecritures.map(e => e.outil)));
    await coller();
    await page.evaluate(() => { window.__msgs = []; const o = new MutationObserver(() => { const x = (document.getElementById("sv-msg") || {}).textContent; if (x && window.__msgs[window.__msgs.length - 1] !== x.trim()) window.__msgs.push(x.trim()); }); o.observe(document.body, { childList: true, subtree: true, characterData: true }); });
    await page.click('.modale [data-ui-b="1"]').catch(() => {}); await attendre(page, 1500);
    const msgs = await page.evaluate(() => window.__msgs || []);
    ok("… « Restaurer » : la formation est restaurée, « Sauvegarde restaurée. » ; les compléments (écrits par le coach) et le programme ne sont jamais réécrits par un client",
      ecr(db, "formation", THOMAS).length === 1 && ecr(db, "formation")[0].contenu.restauree === 73 && ecr(db, "complements").length === 0 && ecr(db, "programme").length === 0 && msgs.includes("Sauvegarde restaurée."),
      JSON.stringify(db.ecritures.map(e => e.outil)) + " · " + JSON.stringify(msgs));
    await attendre(page, 1200); await page.waitForSelector("#sv-paste");
    db.panne = 1000;
    await coller();
    await page.evaluate(() => { window.__msgs = []; const o = new MutationObserver(() => { const x = (document.getElementById("sv-msg") || {}).textContent; if (x && window.__msgs[window.__msgs.length - 1] !== x.trim()) window.__msgs.push(x.trim()); }); o.observe(document.body, { childList: true, subtree: true, characterData: true }); });
    await page.click('.modale [data-ui-b="1"]').catch(() => {}); await attendre(page, 1500);
    const msgs2 = await page.evaluate(() => window.__msgs || []);
    ok("… envoi raté (hors ligne) : « Restauration non enregistrée. », jamais « Sauvegarde restaurée. »", msgs2.includes("Restauration non enregistrée.") && !msgs2.includes("Sauvegarde restaurée."), JSON.stringify(msgs2));
    db.panne = 0;
    const r = await page.evaluate(async (t) => { try { return await Store.importer(t); } catch (e) { return "erreur " + e.message; } }, JSON.stringify({ plateforme: "mhx", version: 2, donnees: { formation: FO } }));
    ok("Store.importer appelé seul (sans confirmation) : restaure et rend true, comme avant", r === true && ecr(db, "formation", THOMAS).length === 2, JSON.stringify(r));
  });

  await b.close();
  server.close();
  bilan();
})().catch(e => { console.error(e); bilan(); process.exit(1); });
