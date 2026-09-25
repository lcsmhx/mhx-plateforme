/* Banc de test local : sert index.html, SIMULE Supabase (rien ne sort vers la
   vraie base), rend chaque page pour un client et pour le coach, capture des
   écrans et relève les erreurs console.
   Usage : node rig.js --html ../index.html --out captures/vNN [--scheme dark|light] [--theme dark|light] [--only client|coach|anon] [--lang en]
*/
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const F = require("./fixtures");

const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > -1 ? process.argv[i + 1] : d; };
const HTML = path.resolve(arg("html", "../index.html"));
const OUT = path.resolve(arg("out", "captures/avant"));
const SCHEME = arg("scheme", "light");       // prefers-color-scheme simulé
const THEME = arg("theme", "");              // mhx_theme (après phase 2)
const ONLY = arg("only", "");
const LANG = arg("lang", "fr");
/* la langue enregistree du compte l'emporte sur celle de l'appareil (l'app recharge la page) :
   en anglais, les comptes fictifs ont donc aussi « en », sinon le script d'init la remettrait a chaque chargement */
if (LANG !== "fr") F.donnees.forEach(d => { if (d.outil === "prefs") d.contenu = Object.assign({}, d.contenu, { langue: LANG }); });
const PORT = 8765 + Math.floor(Math.random() * 200);
fs.mkdirSync(OUT, { recursive: true });

/* --- serveur statique minimal --- */
const server = http.createServer((req, res) => {
  if (req.url.split("?")[0] === "/" || req.url.startsWith("/index.html")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(fs.readFileSync(HTML));
  } else { res.writeHead(404); res.end(); }
});

const journal = { appels: [], ecritures: [], erreurs: [], externes: [] };
let persona = null;

function supabase(route) {
  const req = route.request();
  const url = new URL(req.url());
  const p = url.pathname, q = url.searchParams, m = req.method();
  journal.appels.push(m + " " + p + url.search);
  const json = (body, status) => route.fulfill({ status: status || 200, contentType: "application/json", body: body === null ? "" : JSON.stringify(body) });
  if (p.startsWith("/auth/v1/token")) return json(persona ? F.session(persona.id, persona.email) : { error: "invalid" }, persona ? 200 : 400);
  if (p.startsWith("/auth/v1/logout")) return json(null, 204);
  if (p.startsWith("/auth/v1/")) return json({});
  if (p.startsWith("/functions/v1/")) { journal.ecritures.push(m + " " + p); return json({ ok: true }); }
  if (p === "/rest/v1/profils") {
    if (m !== "GET") { journal.ecritures.push(m + " profils"); return json(null, 204); }
    let l = F.profils; const id = q.get("id");
    if (id && id.startsWith("eq.")) l = l.filter(x => x.id === id.slice(3));
    return json(l);
  }
  if (p === "/rest/v1/donnees") {
    if (m !== "GET") { journal.ecritures.push(m + " donnees " + (req.postData() || "").slice(0, 120)); return json(null, 201); }
    let l = F.donnees; const uid = q.get("user_id"), outil = q.get("outil");
    if (uid && uid.startsWith("eq.")) l = l.filter(x => x.user_id === uid.slice(3));
    if (outil) {
      if (outil.startsWith("eq.")) l = l.filter(x => x.outil === outil.slice(3));
      else if (outil.startsWith("not.in.(")) { const ex = outil.slice(8, -1).split(","); l = l.filter(x => ex.indexOf(x.outil) === -1); }
      else if (outil.startsWith("in.(")) { const inc = outil.slice(4, -1).split(","); l = l.filter(x => inc.indexOf(x.outil) > -1); }
    }
    const sel = (q.get("select") || "*").split(",");
    if (sel.indexOf("*") === -1) l = l.map(x => Object.fromEntries(sel.map(k => [k, x[k]])));
    return json(l);
  }
  if (p === "/rest/v1/bibliotheque") {
    if (m !== "GET") { journal.ecritures.push(m + " bibliotheque"); return json(null, 204); }
    let l = F.bibliotheque; const id = q.get("id"); if (id) l = l.filter(x => x.id === id.slice(3));
    const sel = (q.get("select") || "*").split(",");
    if (sel.indexOf("*") === -1) l = l.map(x => Object.fromEntries(sel.map(k => [k, x[k]])));
    return json(l);
  }
  const t = p.replace("/rest/v1/", "");
  if (F.catalogue[t]) {
    if (m !== "GET") { journal.ecritures.push(m + " " + t); return json(null, 201); }
    let l = F.catalogue[t]; const range = req.headers()["range"];
    if (range) { const [a, b] = range.split("-").map(Number); l = l.slice(a, b + 1); }
    return json(l);
  }
  return json([]);
}

async function main() {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch();
  const rapport = [];

  const ouvrir = async (viewport, who) => {
    const ctx = await browser.newContext({ viewport, colorScheme: SCHEME, locale: "fr-FR", deviceScaleFactor: 1 });
    await ctx.route("**/*", route => {
      const u = route.request().url();
      if (new URL(u).hostname.endsWith(".supabase.co")) return supabase(route);
      if (["localhost", "127.0.0.1"].includes(new URL(u).hostname)) return route.continue();
      journal.externes.push(u.split("?")[0]);
      if (u.indexOf("fonts.googleapis.com") > -1) return route.fulfill({ status: 200, contentType: "text/css", body: "" });
      return route.abort();
    });
    persona = who;
    await ctx.addInitScript(({ who, THEME, LANG }) => {
      try {
        localStorage.clear(); sessionStorage.clear();
        if (who) localStorage.setItem("mhx_session", JSON.stringify(who.session));
        localStorage.setItem("mhx_installe", "1");
        localStorage.setItem("mhx_visites", "3");
        if (THEME) localStorage.setItem("mhx_theme", THEME);
        localStorage.setItem("mhx_langue", LANG);
      } catch (e) { }
    }, { who, THEME, LANG });
    const page = await ctx.newPage();
    page.on("console", msg => { if (msg.type() === "error" && msg.text().indexOf("ERR_FAILED") === -1) journal.erreurs.push("[console] " + page.url().split("#")[1] + " : " + msg.text().slice(0, 200)); });
    page.on("pageerror", e => journal.erreurs.push("[pageerror] " + page.url().split("#")[1] + " : " + String(e.stack || e).slice(0, 600)));
    return { ctx, page };
  };

  const capture = async (page, nom) => {
    await page.waitForLoadState("networkidle").catch(() => { });
    await page.waitForTimeout(600);
    const f = path.join(OUT, nom + ".png");
    await page.screenshot({ path: f, fullPage: true });
    const h = await page.evaluate(() => document.body.scrollHeight);
    rapport.push({ nom, hauteur: h });
  };
  const aller = async (page, hash) => {
    await page.evaluate(h => { location.hash = h; }, hash);
    await page.waitForTimeout(300);
  };

  const VIEWS = { mobile: { width: 390, height: 844 }, desktop: { width: 1280, height: 900 } };
  const personas = {
    client: { id: F.IDS.c1, email: "thomas@exemple.fr", session: F.session(F.IDS.c1, "thomas@exemple.fr") },
    coach: { id: F.IDS.coach, email: "coach@exemple.fr", session: F.session(F.IDS.coach, "coach@exemple.fr") }
  };

  for (const [vn, vp] of Object.entries(VIEWS)) {
    /* --- écran de connexion --- */
    if (!ONLY || ONLY === "anon") {
      const { ctx, page } = await ouvrir(vp, null);
      await page.goto(`http://localhost:${PORT}/index.html`);
      await capture(page, `anon-connexion-${vn}`);
      const oubli = await page.$('[data-mode="oubli"]'); if (oubli) { await oubli.click(); await capture(page, `anon-oubli-${vn}`); }
      await ctx.close();
    }
    /* --- client --- */
    if (!ONLY || ONLY === "client") {
      const { ctx, page } = await ouvrir(vp, personas.client);
      await page.goto(`http://localhost:${PORT}/index.html`);
      await capture(page, `client-accueil-${vn}`);
      rapport.push({ nom: "client-defaut", hash: await page.evaluate(() => location.hash) });
      for (const r of ["programme", "profil", "formation", "nutrition", "complements", "mensurations", "suivi", "bilan"]) {
        await aller(page, "#/" + r); await capture(page, `client-${r}-${vn}`);
      }
      if (vn === "mobile"){ const plus = await page.$("#barre-bas [data-plus]"); if (plus){ await plus.click(); await page.waitForTimeout(400); await page.screenshot({ path: path.join(OUT, `client-menu-plus-${vn}.png`) }); await page.keyboard.press("Escape"); await page.waitForTimeout(300); } else journal.erreurs.push("[rig] barre du bas absente sur mobile"); }
      /* flux : ouvrir le journal de séance puis l'historique des programmes */
      await aller(page, "#/programme");
      const jr = await page.$("[data-jr-ouvrir]"); if (jr) { await jr.click(); await capture(page, `client-programme-journal-${vn}`); }
      const hist = await page.$("[data-hist-ouvrir]"); if (hist) { await hist.click(); await page.waitForTimeout(400); }
      await ctx.close();
    }
    /* --- coach --- */
    if (!ONLY || ONLY === "coach") {
      const { ctx, page } = await ouvrir(vp, personas.coach);
      await page.goto(`http://localhost:${PORT}/index.html`);
      await capture(page, `coach-tableau-${vn}`);
      rapport.push({ nom: "coach-defaut", hash: await page.evaluate(() => location.hash) });
      for (const r of ["clients", "atelier", "bibliotheque", "catalogue", "calculateur", "entrainement", "profil"]) {
        await aller(page, "#/" + r); await capture(page, `coach-${r}-${vn}`);
      }
      /* fiche client */
      await aller(page, "#/clients"); await page.waitForTimeout(500);
      const ouvrirBtn = await page.$(`[data-ouvrir="${F.IDS.c1}"]`);
      if (ouvrirBtn) {
        await ouvrirBtn.click();
        await capture(page, `fiche-profil-${vn}`);
        for (const r of ["accueil", "programme", "nutrition", "calculateur", "mensurations", "suivi", "bilan", "complements", "formation"]) {
          await aller(page, "#/" + r); await capture(page, `fiche-${r}-${vn}`);
        }
      } else journal.erreurs.push("[rig] bouton Ouvrir introuvable pour le client c1");
      await ctx.close();
    }
  }

  await browser.close();
  server.close();
  const resume = {
    html: HTML, out: OUT, scheme: SCHEME, theme: THEME, captures: rapport.length,
    appels_supabase_simules: journal.appels.length,
    ecritures_simulees: journal.ecritures,
    hotes_externes_bloques: Array.from(new Set(journal.externes)),
    erreurs: Array.from(new Set(journal.erreurs))
  };
  fs.writeFileSync(path.join(OUT, "_rapport.json"), JSON.stringify(Object.assign({ pages: rapport }, resume), null, 2));
  console.log(JSON.stringify(resume, null, 2));
}
main().catch(e => { console.error(e); process.exit(1); });
