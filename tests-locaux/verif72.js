/* verif72 — v66 (relecture sécurité du 30/09, décision de Lucas) : 3 corrections, vérifiées de bout en bout.
   A. liens à jetons (#access_token=…) sans personne de connectée : confirmation d'inscription, lien magique,
      réinitialisation, invitation, lien sans type — AUCUNE session ouverte (rien dans localStorage ni sessionStorage),
      jamais l'écran « Choisis ton nouveau mot de passe », le jeton du lien n'est JAMAIS envoyé (ni /auth/v1/user ni
      rien d'autre), écran de connexion avec « Ce lien n'est plus valable », adresse nettoyée ; en anglais aussi.
      Avant la v66, un lien fabriqué par un tiers avec SES jetons faisait entrer dans SON compte.
   B. un client connecté ouvre un lien à jetons d'un autre compte : il reste lui-même, le jeton n'est pas envoyé,
      « déjà dans ton espace », adresse nettoyée ; B2. session enregistrée mais expirée (renouvellement refusé) : retour à la
      connexion avec « Ce lien n'est plus valable », jamais la session du lien.
   C. dernier lien d'un changement d'adresse (type=email_change) : inchangé — aucune session, le mot « adresse changée ».
   D. polices hébergées dans polices/ : plus aucune mention de Google Fonts dans la page servie ; css/jetons.css déclare
      les 3 familles en 400, 500 et 600 (latin et latin étendu, 18 @font-face), chaque fichier existe (woff2), aucun
      fichier orphelin, licences OFL présentes ; dans le navigateur, les polices se chargent depuis polices/ et aucune
      requête ne part vers fonts.googleapis.com ni fonts.gstatic.com.
   E. emails de comptes retirés du dépôt public : aucun fichier suivi par git (hors donnees/) ne contient l'une des 5
      adresses retirées le 30/09 (comparées par empreinte SHA-256 : aucune adresse n'est écrite ici).
      v67 (audit du 01/10) : ni le nom d'un vrai client ni celui de la 2e personne à l'accès coach (empreintes, mot par mot).
   F. v67 : la publication ne copie que l'app (index.html, css/, js/, polices/ : liste blanche dans pages.yml, garde-fous),
      plus tout le dépôt par Jekyll (notes, docs et donnees/ étaient servis sur le site).
   Supabase simulé : rien ne part vers la vraie base (routage par NOM D'HÔTE). Comptes fictifs.
   Usage : node verif72.js ../index.html
           VERIF72_PORT=9881 node verif72.js ../index.html     (autre port, si 9880 est pris) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const crypto = require("crypto"); const { execFileSync } = require("child_process");
const F = require("./fixtures");
const FT = require("./fichiers");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const RACINE = path.dirname(HTML);
const PORT = +process.env.VERIF72_PORT || 9880;
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

/* ---------- personnes : Thomas (client des fixtures) ; l'« attaquant » : un compte à lui ---------- */
const session = (id, email) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + 86400000, user: { id, email, role: "authenticated" } });
const THOMAS = F.IDS.c1, AUTRE = "00000000-0000-4000-8000-000000007201";
const LIEN = (type) => "#access_token=lien." + AUTRE + ".x&expires_in=3600&refresh_token=renouvellement-" + AUTRE + "&token_type=bearer" + (type ? "&type=" + type : "");

/* ---------- le faux Supabase (réduit) : note chaque appel et chaque jeton reçu ---------- */
const externes = new Set();
function base(){
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  profils.push({ id: AUTRE, prenom: "Autre", nom: "Compte", role: "client", statut: "prospect", cree_le: "2026-09-30T10:00:00Z" });
  return { profils, donnees: clone(F.donnees), chemins: [], jetonsLien: 0, ecritures: [] };
}
async function repondre(r, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue().catch(() => {});
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort().catch(() => {}); }
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" } }).catch(() => {});
  const auth = req.headers()["authorization"] || "";
  if (/^Bearer lien\./.test(auth)) db.jetonsLien++;   // le jeton du lien n'aurait jamais dû partir
  const mo = /^Bearer jeton-([0-9a-f-]{36})$/.exec(auth), moi = mo ? mo[1] : null;
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  db.chemins.push(m + " " + p);
  if (p.startsWith("/auth/v1/token")) {
    let c = {}; try { c = JSON.parse(req.postData() || "{}"); } catch (e) {}
    const r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || ""));
    return r1 ? json(session(r1[1], "")) : json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
  }
  if (p.startsWith("/auth/v1/user")) return moi ? json({ id: moi, email: "", role: "authenticated" }) : json({ msg: "invalid JWT" }, 401);
  if (p.startsWith("/auth/v1/")) return json({});
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  if (p.startsWith("/functions/v1/") || p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({});
  if (!["GET", "HEAD"].includes(m)) db.ecritures.push(m + " " + p);
  if (p === "/rest/v1/profils") { const id = (q.get("id") || "").replace(/^eq\./, ""); let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(m === "GET" ? l : []); }
  if (p === "/rest/v1/donnees") {
    if (m !== "GET") return json(null, 201);
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "";
    let l = db.donnees.filter(x => coach || (x.user_id === moi && !["notes_coach", "suivi_prospect"].includes(x.outil)));
    if (uid) l = l.filter(x => x.user_id === uid);
    if (o.startsWith("eq.")) l = l.filter(x => x.outil === o.slice(3));
    if (o.startsWith("in.")) { const k = o.slice(3).replace(/^\(|\)$/g, "").split(","); l = l.filter(x => k.includes(x.outil)); }
    return json(l);
  }
  const t = p.replace("/rest/v1/", "");
  if (F.catalogue[t]) return json(m === "GET" ? F.catalogue[t] : null);
  return json([]);
}
async function contexte(b, db, who, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: { width: 390, height: 844 } });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, db));
  await c.addInitScript(({ s, langue }) => {
    if (!/^https?:$/.test(location.protocol) || localStorage.getItem("__init")) return;
    localStorage.setItem("__init", "1");
    localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
    if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
    if (langue) localStorage.setItem("mhx_langue", langue);
  }, { s: who ? Object.assign(session(who, "t@exemple.fr"), opts.expiree ? { refresh_token: "perime", expire_le: Date.now() - 60000 } : {}) : null, langue: opts.langue || "" });
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return { c, page };
}
const etat = page => page.evaluate(() => ({
  url: location.href, hash: location.hash,
  session: !!(localStorage.getItem("mhx_session") || sessionStorage.getItem("mhx_session")),
  connexion: !!document.getElementById("c-go"), mdp: !!document.getElementById("r-mdp"),
  err: (document.getElementById("co-err") || {}).textContent || "",
  toasts: (document.getElementById("toasts") || {}).textContent || ""
}));

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();

  /* =================== A. liens à jetons, personne de connectée =================== */
  await bloc("A. liens à jetons sans session", async () => {
    for (const [type, nom] of [["signup", "confirmation d'inscription"], ["magiclink", "lien magique"], ["recovery", "réinitialisation du mot de passe"], ["invite", "invitation"], ["", "lien sans type"]]) {
      const db = base();
      const { page } = await contexte(b, db, null);
      await page.goto(URL0 + LIEN(type)); await page.waitForSelector("#c-go", { timeout: 10000 }); await attendre(page, 500);
      const e = await etat(page);
      ok(`${nom} (#access_token=…${type ? "&type=" + type : ""}) : aucune session, jamais l'écran « nouveau mot de passe », jeton jamais envoyé, aucun appel /auth/v1/user, connexion avec « Ce lien n'est plus valable », adresse nettoyée`,
        !e.session && e.connexion && !e.mdp && db.jetonsLien === 0 && !db.chemins.some(x => /\/auth\/v1\/user/.test(x)) && norm(e.err).startsWith("Ce lien n'est plus valable") && !/access_token|refresh_token/.test(e.url) && db.ecritures.length === 0,
        JSON.stringify(e) + " · jetons " + db.jetonsLien + " · " + JSON.stringify(db.chemins));
    }
    const db = base();
    const { page } = await contexte(b, db, null, { langue: "en" });
    await page.goto(URL0 + LIEN("signup")); await page.waitForSelector("#c-go", { timeout: 10000 }); await attendre(page, 500);
    const e = await etat(page);
    ok("en anglais : aucune session, « This link is no longer valid », jeton jamais envoyé", !e.session && norm(e.err).startsWith("This link is no longer valid") && db.jetonsLien === 0 && !/access_token/.test(e.url), JSON.stringify(e));
  });

  /* =================== B. un client connecté ouvre le lien d'un autre compte =================== */
  await bloc("B. lien à jetons avec une session", async () => {
    const db = base();
    const { page } = await contexte(b, db, THOMAS);
    await page.goto(URL0 + LIEN("signup"));
    await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 }); await attendre(page, 1200);
    const e = await etat(page), id = await page.evaluate(() => Auth.utilisateur() && Auth.utilisateur().id).catch(() => null);
    const s = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem("mhx_session")); } catch (x) { return null; } });
    ok("client connecté + lien d'un autre compte : il reste lui-même (session intacte), jeton du lien jamais envoyé, « déjà dans ton espace », adresse nettoyée",
      id === THOMAS && s && s.access_token === "jeton-" + THOMAS && db.jetonsLien === 0 && norm(e.toasts).includes("déjà dans ton espace") && !/access_token/.test(e.url),
      JSON.stringify({ id, e, jetons: db.jetonsLien }));
  });

  await bloc("B2. lien à jetons avec une session expirée", async () => {
    /* session enregistrée sur l'appareil mais périmée, renouvellement refusé : retour à la connexion, jamais le compte du lien */
    const db = base();
    const { page } = await contexte(b, db, THOMAS, { expiree: true });
    await page.goto(URL0 + LIEN("signup")); await page.waitForSelector("#c-go", { timeout: 10000 }); await attendre(page, 600);
    const e = await etat(page);
    ok("session expirée (renouvellement refusé) + lien d'un autre compte : écran de connexion, « Ce lien n'est plus valable », jeton du lien jamais envoyé, jamais la session du lien, adresse nettoyée",
      e.connexion && norm(e.err).startsWith("Ce lien n'est plus valable") && db.jetonsLien === 0 && !/lien\./.test(await page.evaluate(() => (localStorage.getItem("mhx_session") || "") + (sessionStorage.getItem("mhx_session") || ""))) && !/access_token/.test(e.url),
      JSON.stringify(e) + " · jetons " + db.jetonsLien);
  });

  /* =================== C. dernier lien d'un changement d'adresse : inchangé =================== */
  await bloc("C. changement d'adresse", async () => {
    const db = base();
    const { page } = await contexte(b, db, null);
    await page.goto(URL0 + LIEN("email_change")); await page.waitForSelector("#c-go", { timeout: 10000 }); await attendre(page, 500);
    const e = await etat(page);
    ok("dernier lien d'un changement d'adresse (type=email_change) : comme avant — aucune session, jeton jamais envoyé, « Ton adresse email est changée », adresse nettoyée",
      !e.session && db.jetonsLien === 0 && norm(e.err).startsWith("Ton adresse email est changée") && !/access_token/.test(e.url), JSON.stringify(e));
  });

  /* =================== D. polices hébergées =================== */
  await bloc("D. polices hébergées", async () => {
    const servie = FT.source(HTML);
    ok("page servie (index.html + css/ + js/) : plus aucune mention de fonts.googleapis.com ni fonts.gstatic.com", !/fonts\.(googleapis|gstatic)\.com/.test(servie));
    const jetons = fs.readFileSync(path.join(RACINE, "css", "jetons.css"), "utf8");
    const faces = [...jetons.matchAll(/@font-face\{([^}]*)\}/g)].map(x => x[1]);
    const lu = faces.map(f => ({ fam: (/font-family:'([^']+)'/.exec(f) || [])[1], w: +(/font-weight:(\d+)/.exec(f) || [])[1], swap: /font-display:swap/.test(f), plage: /unicode-range:/.test(f), url: (/url\(\.\.\/polices\/([^)]+)\)/.exec(f) || [])[1] }));
    const attendus = [];
    for (const fam of ["Oswald", "IBM Plex Sans", "IBM Plex Mono"]) for (const w of [400, 500, 600]) for (const j of ["latin-ext", "latin"]) attendus.push(fam + "|" + w + "|" + fam.toLowerCase().replace(/ /g, "-") + "-" + j + "-" + w + "-normal.woff2");
    const vus = lu.map(x => x.fam + "|" + x.w + "|" + x.url);
    const fichiers = fs.readdirSync(path.join(RACINE, "polices"));
    const woff = fichiers.filter(f => f.endsWith(".woff2"));
    const valides = woff.every(f => fs.readFileSync(path.join(RACINE, "polices", f)).slice(0, 4).toString("latin1") === "wOF2");
    ok("css/jetons.css : 18 @font-face (Oswald, IBM Plex Sans, IBM Plex Mono × 400, 500, 600 × latin, latin étendu), font-display:swap et unicode-range partout ; chaque fichier existe dans polices/, est un vrai woff2, aucun orphelin",
      faces.length === 18 && JSON.stringify(vus.slice().sort()) === JSON.stringify(attendus.slice().sort()) && lu.every(x => x.swap && x.plage) && woff.length === 18 && woff.every(f => lu.some(x => x.url === f)) && valides,
      JSON.stringify({ n: faces.length, manquants: attendus.filter(x => !vus.includes(x)), orphelins: woff.filter(f => !lu.some(x => x.url === f)), valides }));
    const lic = ["oswald", "ibm-plex-sans", "ibm-plex-mono"].map(k => { try { return /SIL Open Font License, Version 1\.1/.test(fs.readFileSync(path.join(RACINE, "polices", "LICENCE-OFL-" + k + ".txt"), "utf8")); } catch (e) { return false; } });
    ok("licences : polices/LICENCE-OFL-oswald.txt, -ibm-plex-sans.txt, -ibm-plex-mono.txt (SIL OFL 1.1)", lic.every(Boolean), JSON.stringify(lic));
    externes.clear();
    const db = base();
    const { page } = await contexte(b, db, THOMAS);
    await page.goto(URL0);
    await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 });
    await page.evaluate(() => document.fonts.ready); await attendre(page, 800);
    const f = await page.evaluate(() => ({
      charges: performance.getEntriesByType("resource").map(e => new URL(e.name)).filter(u => u.origin === location.origin && /^\/polices\/.+\.woff2$/.test(u.pathname)).map(u => u.pathname),
      etats: Array.from(document.fonts).filter(x => x.status === "loaded").map(x => x.family.replace(/["']/g, "") + " " + x.weight)
    }));
    const google = Array.from(externes).filter(h => /^fonts\.(googleapis|gstatic)\.com$/.test(h));
    ok("navigateur (client connecté, accueil) : les polices affichées viennent de polices/ (IBM Plex Sans chargée), aucune requête vers Google Fonts",
      f.charges.length > 0 && f.etats.some(x => /^IBM Plex Sans /.test(x)) && google.length === 0, JSON.stringify({ f, google }));
  });

  /* =================== E. emails de comptes retirés du dépôt =================== */
  await bloc("E. emails de comptes", async () => {
    const RETIRES = ["2289c1835adb4c62343f853b236de0c3b8f849cfd461b4a63cecd57af6c7667c", "5c5ad18cd0920169bcabce86df18263c1992c942554e2fce563afbaad5f26bdf",
      "7a19bd2b9460a20477949694bb149d7e0907e22c1f9cab28baa3774b6868c704", "c95192be9c292f529036759160163526a4d4857b272711ee5eeb55d217e633bc", "e28957ea9f7744d3ce7f413e231f62df617fe4c940f1120ef413847180b10f3f"];
    let liste;
    try { liste = execFileSync("git", ["ls-files"], { cwd: RACINE, encoding: "utf8" }).split("\n").filter(Boolean); }
    catch (e) { liste = null; }
    if (!liste) { ok("dépôt : liste des fichiers suivis lisible (git ls-files)", false, "git indisponible"); return; }
    const trouves = [];
    for (const f of liste) {
      if (/^donnees\//.test(f) || /\.(woff2|png|jpe?g|pdf)$/i.test(f)) continue;
      let t; try { t = fs.readFileSync(path.join(RACINE, f), "utf8"); } catch (e) { continue; }
      for (const a of t.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/g) || []) {
        if (RETIRES.includes(crypto.createHash("sha256").update(a.toLowerCase()).digest("hex"))) trouves.push(f);
      }
    }
    ok("aucun fichier suivi (hors donnees/) ne contient l'email du compte coach ni celui d'un compte de test retirés le 30/09 (comparaison par empreinte)", liste.length > 50 && trouves.length === 0, JSON.stringify(Array.from(new Set(trouves))));
    /* v67 (audit du 01/10) : noms de vrais clients et d'une 2e personne à l'accès coach retirés de NOTES-GROK.md (avec leurs
       poids, taille et âge) — comparés mot par mot par empreinte SHA-256 : aucun nom n'est écrit ici. donnees/ (Grok) : hors
       de ce contrôle, à nettoyer par Lucas ou Grok (donnees/audit-coherence.md, donnees/programme-stephanie.json). */
    const NOMS = ["c38c694be0201b1fe5ab1dd8dac366a9fbd75daae63e34a23cad3a38b70c21f7", "1a30f7a797eeea67688374ad30dd61f4a6bf5103ded33cafad6ea7da058b5137",
      "43d4bbc06fd3f0955e807d146b94490f9a600bc849a44c66df323b137554f307", "3471f50663eda35b15d9b3f3a77857ba011979b98d08d5df6e627069f0b5789d"];
    const avecNom = [];
    for (const f of liste) {
      if (/^donnees\//.test(f) || /\.(woff2|png|jpe?g|pdf)$/i.test(f)) continue;
      let t; try { t = fs.readFileSync(path.join(RACINE, f), "utf8"); } catch (e) { continue; }
      for (const m of new Set(t.toLowerCase().split(/[^a-zà-ÿ]+/))) if (m.length > 2 && NOMS.includes(crypto.createHash("sha256").update(m).digest("hex"))) avecNom.push(f);
    }
    ok("aucun fichier suivi (hors donnees/) ne contient le nom d'un vrai client ni celui de la 2e personne à l'accès coach retirés le 01/10 (comparaison mot par mot, par empreinte)", avecNom.length === 0, JSON.stringify(Array.from(new Set(avecNom))));
  });

  /* =================== F. publication : seulement l'app =================== */
  await bloc("F. site publié", async () => {
    /* v67 (audit du 01/10) : GitHub Pages publiait tout le dépôt (Jekyll) : notes, docs, supabase/, tests-locaux/ et donnees/
       (dont des données de vrais clients) étaient lisibles sur lcsmhx.github.io. La publication ne copie plus que
       index.html, css/, js/ et polices/ (liste blanche), et s'arrête sur tout autre fichier. */
    const wf = fs.readFileSync(path.join(RACINE, ".github", "workflows", "pages.yml"), "utf8");
    const pub = wf.slice(wf.indexOf("publication:"));
    let cfg = ""; try { cfg = fs.readFileSync(path.join(RACINE, "_config.yml"), "utf8"); } catch (e) {}   // filet si Pages repasse en mode Jekyll
    ok("pages.yml : la publication n'utilise plus jekyll-build-pages (qui publiait tout le dépôt) mais la liste blanche index.html, css/, js/, polices/, avec un garde-fou sur tout autre fichier et sur les fichiers listés par index.html, avant upload-pages-artifact ; _config.yml exclut notes, docs, tests et donnees/ si Pages repassait en mode Jekyll",
      wf.indexOf("publication:") > -1 && !/jekyll-build-pages/.test(pub) && /cp index\.html _site\//.test(pub) && /cp -R css js polices _site\//.test(pub)
        && /Fichiers inattendus dans le site/.test(pub) && /Fichier listé par index\.html absent/.test(pub)
        && pub.indexOf("Site publié") > -1 && pub.indexOf("Site publié") < pub.indexOf("upload-pages-artifact")
        && /^exclude: \[docs, donnees, supabase, tests-locaux, CLAUDE\.md, NOTESCLAUDE\.md, NOTES-GROK\.md, README\.md\]$/m.test(cfg),
      pub.slice(0, 300));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
