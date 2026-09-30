/* verif75 — v67 (audit du 01/10, lot « repas ») : 3 corrections, vérifiées de bout en bout dans le navigateur.
   A. « Remplacer » un repas, sans changement du coach entre-temps : comme avant — le repas est remplacé (marque
      change_client du jour), les autres repas, les dates et la cible ne bougent pas ; deux remplacements de suite ne
      déclenchent aucun faux conflit, même quand la base renvoie les clés dans SON ordre (jsonb, simulé ici) ; la fiche du
      coach compte toujours « Repas remplacés ce mois ».
   B. (D3) la page « Mes repas » est restée ouverte, le coach a changé la diète entre-temps (nouvelle semaine envoyée,
      retouche des grammes sans envoi, envoi seul) : « Remplacer » n'écrit RIEN (la version du coach reste entière),
      message « Ton coach vient de mettre à jour tes repas », la page repart de la version du coach, bouton jamais figé
      sur « … » ; un 2e « Remplacer » s'applique alors à la version du coach. En anglais aussi.
      Avant la v67, l'ancienne semaine (un repas changé) écrasait la nouvelle semaine du coach, perdue.
   C. (D3) relecture impossible (réseau) : rien n'est écrit, « Pas de connexion : ton repas n'a pas été remplacé »,
      bouton rendu ; le réseau revenu, « Remplacer » marche. En anglais aussi.
   D. (D4) écrans du coach : « Ses repas » et « Son programme » disent la vérité — chaque changement est visible du client
      tout de suite ; « Valider et envoyer » / « Envoyer au client » datent l'envoi (plus « Rien n'est envoyé
      automatiquement », ni « le lui rend visible »). Le conseil sur les allergies reste.
   E. (B2) client en anglais : une traduction du catalogue (exercices.traductions) qui contient une balise
      (<img onerror>) n'entre pas dans le dictionnaire et n'est jamais insérée en HTML ; les traductions propres (y compris
      avec « & ») entrent toujours.
   Supabase simulé : rien ne part vers la vraie base (routage par NOM D'HÔTE). Comptes fictifs (fixtures.js).
   Usage : node verif75.js ../index.html
           VERIF75_PORT=9911 node verif75.js ../index.html     (autre port, si 9910 est pris) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const FT = require("./fichiers");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF75_PORT || 9910;
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
/* comparaison sans ordre des clés */
const canon = v => JSON.stringify(v, (k, x) => (x && typeof x === "object" && !Array.isArray(x)) ? Object.keys(x).sort().reduce((o, c) => { o[c] = x[c]; return o; }, {}) : x);
/* la base (jsonb) range les clés à sa façon : plus courtes d'abord, puis par octets — simulé à chaque écriture */
const jsonb = v => Array.isArray(v) ? v.map(jsonb) : (v && typeof v === "object")
  ? Object.keys(v).sort((a, b) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0)).reduce((o, k) => { o[k] = jsonb(v[k]); return o; }, {}) : v;

const THOMAS = F.IDS.c1, COACH = F.IDS.coach;
const IDX = (new Date().getDay() + 6) % 7;   // le jour affiché à l'ouverture (lundi = 0)
const AUJ = F.AUJ;
const session = id => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + 86400000, user: { id, email: "t@exemple.fr", role: "authenticated" } });

/* ---------- le faux Supabase : garde les écritures (upsert), clés rangées façon jsonb ---------- */
function base(){
  const profils = clone(F.profils); profils.forEach(p => { if (p.role === "client") p.statut = "client"; });
  const donnees = clone(F.donnees).map(l => Object.assign(l, { contenu: jsonb(l.contenu) }));
  return { profils, donnees, ecritures: [], panne: false, traductions: [] };
}
const ligneDe = (db, uid, outil) => db.donnees.find(x => x.user_id === uid && x.outil === outil);
const repasDe = (db, uid) => { const l = ligneDe(db, uid || THOMAS, "repas"); return l ? l.contenu : null; };
const ecrRepas = (db, uid) => db.ecritures.filter(e => e.outil === "repas" && e.user_id === (uid || THOMAS));
async function repondre(r, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue().catch(() => {});
  if (!host.endsWith(".supabase.co")) return r.abort().catch(() => {});
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" } }).catch(() => {});
  const auth = req.headers()["authorization"] || "";
  const mo = /^Bearer jeton-([0-9a-f-]{36})$/.exec(auth), moi = mo ? mo[1] : null;
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  if (p.startsWith("/auth/v1/token")) {
    let c = {}; try { c = JSON.parse(req.postData() || "{}"); } catch (e) {}
    const r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || ""));
    return r1 ? json(session(r1[1])) : json({ error: "invalid_grant" }, 400);
  }
  if (p.startsWith("/auth/v1/user")) return moi ? json({ id: moi, email: "", role: "authenticated" }) : json({ msg: "invalid JWT" }, 401);
  if (p.startsWith("/auth/v1/")) return json({});
  if (p.startsWith("/rest/v1/rpc/")) return json(null, 204);
  if (p.startsWith("/functions/v1/") || p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({});
  if (p === "/rest/v1/profils") { const id = (q.get("id") || "").replace(/^eq\./, ""); let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(m === "GET" ? l : []); }
  if (p === "/rest/v1/donnees") {
    if (m === "GET") {
      if (db.panne) return r.abort("failed").catch(() => {});   // réseau coupé pour la table donnees
      const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "";
      let l = db.donnees.filter(x => coach || (x.user_id === moi && !["notes_coach", "suivi_prospect"].includes(x.outil)));
      if (uid) l = l.filter(x => x.user_id === uid);
      if (o.startsWith("eq.")) l = l.filter(x => x.outil === o.slice(3));
      if (o.startsWith("in.")) { const k = o.slice(3).replace(/^\(|\)$/g, "").split(","); l = l.filter(x => k.includes(x.outil)); }
      return json(clone(l));
    }
    if (m === "POST") {
      let rows = []; try { rows = JSON.parse(req.postData() || "[]"); } catch (e) {}
      rows = Array.isArray(rows) ? rows : [rows];
      for (const row of rows) {
        if (!(coach || row.user_id === moi)) return json({ code: "42501", message: "row-level security" }, 403);
        const ligne = { user_id: row.user_id, outil: row.outil, contenu: jsonb(clone(row.contenu)), maj_le: row.maj_le || new Date().toISOString() };
        const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
        if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        db.ecritures.push(Object.assign({ par: moi }, clone(ligne)));
      }
      return json(null, 201);
    }
    return json(null, 204);
  }
  if (p === "/rest/v1/bibliotheque") return json(m === "GET" ? [] : null, m === "GET" ? 200 : 201);
  const t = p.replace("/rest/v1/", "");
  if (t === "exercices" && q.has("traductions")) return json(clone(db.traductions));
  if (F.catalogue[t]) return json(m === "GET" ? (q.has("traductions") ? [] : F.catalogue[t]) : null);
  return json([]);
}
async function contexte(b, db, who, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: { width: 390, height: 844 } });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, db));
  await c.addInitScript(({ s, langue }) => {
    if (!/^https?:$/.test(location.protocol)) return;
    window.__toasts = [];
    try { new MutationObserver(ms => ms.forEach(mu => mu.addedNodes.forEach(n => { if (n.nodeType === 1 && n.classList && n.classList.contains("toast")) window.__toasts.push(n.textContent); }))).observe(document, { childList: true, subtree: true }); } catch (e) { }
    if (localStorage.getItem("__init")) return;
    localStorage.setItem("__init", "1");
    localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
    if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
    if (langue) localStorage.setItem("mhx_langue", langue);
  }, { s: who ? session(who) : null, langue: opts.langue || "" });
  /* la langue rangée en base (prefs) l'emporte sur l'appareil : alignée sur celle du contexte */
  const pr = ligneDe(db, who, "prefs"); if (pr) pr.contenu = { langue: opts.langue || "fr" };
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return { c, page };
}
async function pret(page, sel){
  await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 });
  if (sel) await page.waitForSelector(sel, { timeout: 10000 });
  await attendre(page, 500);
}
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1500); };
async function ouvrirFiche(page, id){
  await aller(page, "#/clients", 2000); await page.waitForSelector(`[data-ouvrir="${id}"]`, { timeout: 8000 });
  await page.click(`[data-ouvrir="${id}"]`); await page.waitForSelector("#vue .bandeau", { timeout: 8000 }); await attendre(page, 800);
}
/* « Remplacer » sur le repas n° i du jour affiché, puis attend que la page ait fini (plus aucun bouton sur « … ») */
async function remplacer(page, i){
  await page.click(`#nu-vue [data-remplacer="${IDX}:${i}"]`);
  await attendre(page, 150);
  await page.waitForFunction(() => !Array.from(document.querySelectorAll("#nu-vue [data-remplacer]")).some(b => b.disabled || b.textContent.trim() === "…"), null, { timeout: 20000 });
  await attendre(page, 1600);   // l'écriture éventuelle (700 ms au plus) arrive au faux serveur
}
const etatPage = page => page.evaluate(() => ({
  noms: Array.from(document.querySelectorAll("#nu-vue .repas-c h2")).map(x => x.textContent.trim()),
  boutons: Array.from(document.querySelectorAll("#nu-vue [data-remplacer]")).map(x => x.textContent.trim() + (x.disabled ? " (inactif)" : "")),
  texte: (document.getElementById("nu-vue") || {}).textContent || "",
  toasts: (window.__toasts || []).slice()
}));
const repasN = (R, j, i) => R && R.jours && R.jours[j] && R.jours[j].repas[i];
/* les repas de R identiques à ceux de ref, sauf les positions « j:i » de sauf */
const autresIntacts = (R, ref, sauf) => ref.jours.every((j, jj) => j.repas.every((x, ii) => sauf.includes(jj + ":" + ii) || canon(x) === canon(repasN(R, jj, ii)))) && R.jours.length === ref.jours.length;
const sansJours = R => { const x = clone(R); delete x.jours; return canon(x); };

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();

  /* =================== A. « Remplacer » sans changement du coach =================== */
  await bloc("A. Remplacer, cas normal", async () => {
    const db = base(), R0 = clone(repasDe(db));
    const { page } = await contexte(b, db, THOMAS);
    await page.goto(URL0 + "#/nutrition"); await pret(page, "#nu-vue [data-remplacer]");
    const avant = await etatPage(page);
    await remplacer(page, 0);
    const R1 = repasDe(db), e1 = await etatPage(page), x1 = repasN(R1, IDX, 0);
    ok("client, « Mes repas » : « Remplacer » le 1er repas du jour → écrit : un autre plat du même moment, marqué change_client = aujourd'hui, affiché ; bouton rendu",
      ecrRepas(db).length >= 1 && x1 && x1.recette_id !== repasN(R0, IDX, 0).recette_id && x1.moment === repasN(R0, IDX, 0).moment && x1.change_client === AUJ
        && e1.noms[0] === x1.nom && e1.noms[0] !== avant.noms[0] && e1.boutons.every(t => t === "Remplacer"),
      JSON.stringify({ n: ecrRepas(db).length, x1: x1 && [x1.recette_id, x1.change_client, x1.nom], noms: e1.noms.slice(0, 2), avant: avant.noms[0], boutons: e1.boutons }));
    ok("… les 27 autres repas, les dates (debut, maj), la note et la cible sont inchangés ; aucun message « Ton coach vient de mettre à jour »",
      autresIntacts(R1, R0, [IDX + ":0"]) && sansJours(R1) === sansJours(R0) && !e1.toasts.some(t => /Ton coach vient/.test(t)), JSON.stringify(e1.toasts));
    const n1 = ecrRepas(db).length;
    await remplacer(page, 2);
    const R2 = repasDe(db), e2 = await etatPage(page), x2 = repasN(R2, IDX, 2);
    ok("… un 2e « Remplacer » (base qui renvoie les clés dans son ordre, comme jsonb) : pas de faux conflit — écrit, le 1er remplacement gardé, aucun autre repas touché, aucun message de conflit",
      ecrRepas(db).length > n1 && x2 && x2.change_client === AUJ && x2.recette_id !== repasN(R0, IDX, 2).recette_id && canon(repasN(R2, IDX, 0)) === canon(x1)
        && autresIntacts(R2, R0, [IDX + ":0", IDX + ":2"]) && sansJours(R2) === sansJours(R0) && !e2.toasts.some(t => /Ton coach vient|Pas de connexion/.test(t)) && e2.noms[2] === x2.nom,
      JSON.stringify({ n: ecrRepas(db).length, x2: x2 && [x2.recette_id, x2.change_client], toasts: e2.toasts }));
    /* la fiche du coach compte toujours les remplacements (outilAccueil, « Repas remplacés ce mois ») */
    const co = await contexte(b, db, COACH);
    await co.page.goto(URL0); await pret(co.page);
    await ouvrirFiche(co.page, THOMAS);
    const fiche = norm(await co.page.evaluate(() => document.getElementById("vue").textContent));
    await aller(co.page, "#/nutrition", 2000); await co.page.waitForSelector("#nu-save", { timeout: 10000 });
    await co.page.click(`#nu-vue [data-jed="${IDX}"]`); await attendre(co.page, 600);
    const pastilles = await co.page.evaluate(() => Array.from(document.querySelectorAll("#nu-vue .pastille")).filter(x => x.textContent.trim() === "Changé par ton client").length);
    ok("… fiche du coach : « Repas remplacés ce mois 2 » ; « Ses repas » : « Changé par ton client » sur les 2 repas du jour remplacés", /Repas remplacés ce mois\s*2/.test(fiche) && pastilles === 2,
      JSON.stringify({ fiche: (fiche.match(/Repas remplacés ce mois.{0,4}/) || [""])[0], pastilles }));
  });

  /* =================== B. le coach a changé la diète pendant que la page restait ouverte =================== */
  const VARIANTES = [
    { nom: "nouvelle semaine envoyée (debut, maj et repas changés)", langue: "", changer: R => {
        R.jours.forEach((j, jj) => j.repas.forEach((x, ii) => { x.nom = "Semaine 2 · plat " + jj + "-" + ii; x.recette_id = "n2-" + jj + "-" + ii; }));
        R.debut = AUJ; R.maj = AUJ.slice(8, 10) + "/" + AUJ.slice(5, 7) + "/" + AUJ.slice(0, 4); },
      voit: e => e.noms[0] === "Semaine 2 · plat " + IDX + "-0" },
    { nom: "retouche des grammes, sans envoi (ni debut ni maj changés)", langue: "", changer: R => { repasN(R, IDX, 1).ingredients[0].grammes = 999; },
      voit: e => /999 g/.test(norm(e.texte)) },
    { nom: "envoi seul (maj changé) — client en anglais", langue: "en", changer: R => { R.maj = "25/10/2099"; },
      voit: e => /10\/25\/2099|25\/10\/2099/.test(e.texte) }
  ];
  for (const V of VARIANTES) {
    await bloc("B. coach : " + V.nom, async () => {
      const db = base();
      const { page } = await contexte(b, db, THOMAS, { langue: V.langue });
      await page.goto(URL0 + "#/nutrition"); await pret(page, "#nu-vue [data-remplacer]");
      /* le coach écrit sa version (sa page à lui) pendant que celle du client reste ouverte */
      const C = clone(repasDe(db)); V.changer(C);
      const l = ligneDe(db, THOMAS, "repas"); l.contenu = jsonb(clone(C)); l.maj_le = new Date().toISOString();
      const n0 = ecrRepas(db).length;
      await remplacer(page, 0);
      const e = await etatPage(page);
      const msg = V.langue === "en" ? "Your coach just updated your meals: here is the new version." : "Ton coach vient de mettre à jour tes repas : voici sa nouvelle version.";
      ok(`${V.nom} : « Remplacer » n'écrit rien — la version du coach reste entière en base`, ecrRepas(db).length === n0 && canon(repasDe(db)) === canon(C),
        JSON.stringify({ ecritures: ecrRepas(db).length - n0, repas0: (repasN(repasDe(db), IDX, 0) || {}).nom }));
      ok(`… message « ${msg} », la page repart de la version du coach, boutons rendus (jamais figés sur « … »)`,
        e.toasts.some(t => t === msg) && V.voit(e) && e.boutons.length > 0 && e.boutons.every(t => t === (V.langue === "en" ? "Swap" : "Remplacer")),
        JSON.stringify({ toasts: e.toasts, noms: e.noms.slice(0, 2), boutons: e.boutons }));
      await remplacer(page, 0);
      const R2 = repasDe(db), x = repasN(R2, IDX, 0);
      ok("… un 2e « Remplacer » s'applique à la version du coach : écrit, seul ce repas change (change_client), le reste = la version du coach",
        ecrRepas(db).length > n0 && x && x.change_client === AUJ && x.recette_id !== repasN(C, IDX, 0).recette_id && autresIntacts(R2, C, [IDX + ":0"]) && sansJours(R2) === sansJours(C),
        JSON.stringify({ n: ecrRepas(db).length - n0, x: x && [x.recette_id, x.change_client] }));
    });
  }

  /* =================== C. relecture impossible =================== */
  for (const langue of ["", "en"]) {
    await bloc("C. relecture impossible" + (langue ? " (anglais)" : ""), async () => {
      const db = base(), R0 = clone(repasDe(db));
      const { page } = await contexte(b, db, THOMAS, { langue });
      await page.goto(URL0 + "#/nutrition"); await pret(page, "#nu-vue [data-remplacer]");
      const avant = await etatPage(page);
      db.panne = true;
      await remplacer(page, 0);
      const e = await etatPage(page);
      const msg = langue ? "No connection: your meal wasn't swapped. Try again in a moment." : "Pas de connexion : ton repas n'a pas été remplacé. Réessaie dans un instant.";
      ok(`${langue ? "anglais : " : ""}réseau coupé au moment de « Remplacer » : rien n'est écrit, « ${msg} », le repas affiché ne change pas, bouton rendu`,
        ecrRepas(db).length === 0 && canon(repasDe(db)) === canon(R0) && e.toasts.some(t => t === msg) && e.noms[0] === avant.noms[0] && e.boutons.every(t => t === (langue ? "Swap" : "Remplacer")),
        JSON.stringify({ n: ecrRepas(db).length, toasts: e.toasts, noms: [avant.noms[0], e.noms[0]], boutons: e.boutons }));
      db.panne = false;
      await remplacer(page, 0);
      const x = repasN(repasDe(db), IDX, 0);
      ok("… le réseau revenu, « Remplacer » marche : écrit, repas remplacé (change_client)", ecrRepas(db).length >= 1 && x && x.change_client === AUJ && autresIntacts(repasDe(db), R0, [IDX + ":0"]),
        JSON.stringify({ n: ecrRepas(db).length, x: x && [x.recette_id, x.change_client] }));
    });
  }

  /* =================== D. écrans du coach : ce qui est envoyé, et quand =================== */
  await bloc("D. textes du coach", async () => {
    const db = base();
    const { page } = await contexte(b, db, COACH);
    await page.goto(URL0); await pret(page);
    await ouvrirFiche(page, THOMAS);
    await aller(page, "#/nutrition", 2000); await page.waitForSelector("#nu-save", { timeout: 10000 });
    const tn = norm(await page.evaluate(() => document.getElementById("nu-vue").textContent));
    ok("coach, « Ses repas » de Thomas : « chaque changement est enregistré aussitôt et ton client le voit tout de suite », « Valider et envoyer au client » date la semaine ; le conseil sur les allergies reste ; plus « Rien n'est envoyé automatiquement »",
      tn.includes("Chaque changement est enregistré aussitôt et ton client le voit tout de suite, avant même que tu valides") && tn.includes("les allergies en premier")
        && tn.includes("« Valider et envoyer au client » date la semaine") && !tn.includes("Rien n'est envoyé automatiquement"),
      (tn.match(/.{0,40}(Rien n'est envoyé|Chaque changement).{0,120}/) || [""])[0]);
    await aller(page, "#/programme", 2000); await page.waitForSelector("#pg-save", { timeout: 10000 });
    const tp = norm(await page.evaluate(() => document.getElementById("vue").textContent));
    ok("coach, « Son programme » : « ton client voit chaque changement tout de suite, avant même l'envoi », « Envoyer au client » date le programme ; plus « le lui rend visible »",
      tp.includes("ton client voit chaque changement tout de suite, avant même l'envoi") && tp.includes("« Envoyer au client » date le programme") && !tp.includes("le lui rend visible"),
      (tp.match(/.{0,40}(Tout est enregistré).{0,160}/) || [""])[0]);
    ok("… aucune écriture en ouvrant ces pages", db.ecritures.length === 0, JSON.stringify(db.ecritures.map(x => x.outil)));
  });

  /* =================== E. traductions du catalogue avec une balise =================== */
  await bloc("E. traductions du catalogue (anglais)", async () => {
    /* 1. le texte exact (innerHTML) du « Mot du coach » de « Mes repas », en anglais, sans rien de piégé */
    const db1 = base();
    const t1 = await contexte(b, db1, THOMAS, { langue: "en" });
    await t1.page.goto(URL0 + "#/nutrition"); await pret(t1.page, "#nu-vue .flag.info");
    const CLE = await t1.page.evaluate(() => Traduction.norm(document.querySelector("#nu-vue .flag.info").innerHTML));
    ok("anglais : « Mes repas » affiche le mot du coach dans un bloc HTML simple (cible du piège)", /^<b>[^<]+<\/b><br>Bois 2 L/.test(CLE), CLE);
    /* 2. le catalogue porte une traduction de ce bloc qui contient une balise */
    const db = base();
    db.traductions = [
      { nom: CLE, execution: "", erreurs: "", respiration: "", traductions: { en: { nom: "<img src=x onerror=\"window.__xss=(window.__xss||0)+1\">Hacked" } } },
      { nom: "Tirage < 90° (essai 75)", execution: "", erreurs: "", respiration: "", traductions: { en: { nom: "Row under 90 (test 75)" } } },
      { nom: "Pompes lestées (essai 75)", execution: "", erreurs: "", respiration: "", traductions: { en: { nom: "Weighted push-ups (test 75)" } } },
      { nom: "Poulet & riz (essai 75)", execution: "", erreurs: "", respiration: "", traductions: { en: { nom: "Chicken & rice (test 75)" } } },
      { nom: "Qualité > vitesse (essai 75)", execution: "", erreurs: "", respiration: "", traductions: { en: { nom: "Quality > speed (test 75)" } } }
    ];
    const { page } = await contexte(b, db, THOMAS, { langue: "en" });
    await page.goto(URL0 + "#/nutrition"); await pret(page, "#nu-vue .flag.info");
    await page.waitForFunction(() => I18N.en["Pompes lestées (essai 75)"] === "Weighted push-ups (test 75)", null, { timeout: 10000 }).catch(() => {});
    await attendre(page, 1200);
    const e = await page.evaluate(k => ({ xss: window.__xss || 0, img: document.querySelectorAll("#nu-vue img, #nu-vue [onerror]").length, dans: Object.prototype.hasOwnProperty.call(I18N.en, k),
      mot: Traduction.norm(document.querySelector("#nu-vue .flag.info").innerHTML),
      propres: [I18N.en["Pompes lestées (essai 75)"], I18N.en["Poulet & riz (essai 75)"], I18N.en["Qualité > vitesse (essai 75)"]], chevron: Object.prototype.hasOwnProperty.call(I18N.en, "Tirage < 90° (essai 75)") }), CLE);
    ok("… une traduction du catalogue qui contient une balise (<img onerror>) n'entre pas dans le dictionnaire : rien d'exécuté, aucune image insérée, le mot du coach affiché tel quel",
      e.xss === 0 && e.img === 0 && !e.dans && e.mot === CLE, JSON.stringify(e));
    ok("… les traductions propres du catalogue entrent toujours (y compris avec « & » et « > », v67 : « Qualité > vitesse ») ; un texte français avec « < » est ignoré",
      e.propres[0] === "Weighted push-ups (test 75)" && e.propres[1] === "Chicken & rice (test 75)" && e.propres[2] === "Quality > speed (test 75)" && !e.chevron, JSON.stringify(e.propres) + " " + e.chevron);
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
