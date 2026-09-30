/* verif77 — v67 (audit du 01/10, lot « compte ») : 2 corrections, vérifiées de bout en bout dans le navigateur.
   A. A5 : « Changer mon mot de passe » (Profil). Le mot de passe actuel est vérifié par une connexion
      (POST /auth/v1/token?grant_type=password) qui ouvre une session NEUVE ; le changement (PUT /auth/v1/user) part
      maintenant avec le jeton de CETTE session (avant : avec l'ancienne session de l'onglet) — prêt pour « Secure password
      change » de Supabase (connexion récente exigée) — et l'app garde cette session neuve : Supabase ferme les autres
      sessions du compte quand le mot de passe change (simulé ici : ancien jeton et ancien renouvellement refusés).
      Vérifié : le PUT porte le jeton neuf ; la session rangée est la neuve, au même endroit (« Rester connecté » coché :
      localStorage ; décoché : sessionStorage) ; une copie en attente (hors ligne) reste, du même compte, et part ensuite
      avec le jeton neuf ; une écriture suivante passe ; un renouvellement se fait avec le jeton de renouvellement neuf ;
      personne n'est déconnecté ; un autre onglet reprend la session neuve (événement « storage ») et écrit avec elle.
      Mauvais mot de passe actuel : rien n'est envoyé ni gardé, « Ton mot de passe actuel n'est pas le bon. » comme avant.
      Réponse d'un autre compte : rien n'est gardé ni envoyé. Un renouvellement de l'ancienne session parti pendant la
      vérification (réponse arrivée après le changement) ne remplace pas la session neuve.
   B. E4 : « Télécharger toutes mes données » : le fichier porte aussi les accords du compte (compte.accords : conditions,
      newsletter, santé — dates et versions), lus dans la session en mémoire (aucun appel de plus), seulement ces champs,
      jamais un jeton ; compte sans accords (ancien compte) : {}. Le texte de « Mes données » ne promet plus « une copie
      complète » (photos et historique de connexion : sur demande au coach) ; en anglais aussi.
   Supabase simulé : rien ne part vers la vraie base (routage par NOM D'HÔTE). Comptes fictifs (fixtures).
   Usage : node verif77.js ../index.html
           VERIF77_PORT=9931 node verif77.js ../index.html     (autre port, si 9930 est pris) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const FT = require("./fichiers");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF77_PORT || 9930;
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
const trie = o => o && typeof o === "object" && !Array.isArray(o) ? Object.keys(o).sort().reduce((x, k) => (x[k] = o[k], x), {}) : o;
const memes = (a, b) => egal(trie(a), trie(b));   // mêmes champs, dans n'importe quel ordre
const norm = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const attendre = (page, ms) => page.waitForTimeout(ms);

/* ---------- personnes ---------- */
const THOMAS = F.IDS.c1, COACH = F.IDS.coach;
const EMAIL = "thomas@exemple.fr", MDP = "ancien-mdp-77", NOUVEAU = "nouveau-mdp-77";
const ANCIEN_JETON = "jeton-" + THOMAS, ANCIEN_RENOUV = "renouvellement-" + THOMAS;
const META = { prenom: "Thomas", nom: "Démo", consentement: "2026-09-30T08:00:00.000Z", conditions_version: "2026-10-01",
  newsletter: "2026-09-30T08:00:00.000Z", newsletter_version: "2026-09-27", consentement_sante: "2026-09-30T08:05:00.000Z",
  sante_version: "2026-10-01", sante_ecran: "calculateur", emails_suivi: true, autre_champ: "pas un accord", jeton_cache: "secret-77" };
const ACCORDS = { consentement: META.consentement, conditions_version: META.conditions_version, consentement_sante: META.consentement_sante,
  sante_version: META.sante_version, sante_ecran: META.sante_ecran, newsletter: META.newsletter, newsletter_version: META.newsletter_version,
  emails_suivi: true };
const sessionDepart = meta => ({ access_token: ANCIEN_JETON, refresh_token: ANCIEN_RENOUV, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + 86400000, user: Object.assign({ id: THOMAS, email: EMAIL, role: "authenticated" }, meta ? { user_metadata: meta } : {}) });

/* ---------- le faux Supabase : de vraies sessions (jeton d'accès + jeton de renouvellement par session), fermées comme
   Supabase le fait quand le mot de passe change (toutes celles du compte sauf celle qui a fait le changement) ---------- */
function base(meta){
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  const db = { profils, donnees: clone(F.donnees), n: 0, nJ: 0, nS: 0, ecritures: [], lectures: [], traces: [], jetons: [], puts: [],
    refusees: [], acces: {}, renouv: {}, fermees: new Set(), mdp: { [THOMAS]: MDP }, emails: { [THOMAS]: EMAIL, [COACH]: "coach@exemple.fr" },
    meta: { [THOMAS]: clone(meta || {}) }, panne: false, autreCompte: false, lentRenouv: 0 };
  db.acces[ANCIEN_JETON] = { uid: THOMAS, sid: "s0" }; db.renouv[ANCIEN_RENOUV] = { uid: THOMAS, sid: "s0", utilise: false };
  return db;
}
const utilisateur = (db, uid) => ({ id: uid, email: db.emails[uid] || "", role: "authenticated", user_metadata: clone(db.meta[uid] || {}) });
function ouvrir(db, uid, sid){
  db.nJ++;
  const a = "jeton-" + uid + "." + sid + "." + db.nJ, r = "renouvellement-" + uid + "." + sid + "." + db.nJ;
  db.acces[a] = { uid, sid }; db.renouv[r] = { uid, sid, utilise: false };
  return { access_token: a, refresh_token: r, token_type: "bearer", expires_in: 3600, user: utilisateur(db, uid) };
}
const ligne = (db, uid, outil) => db.donnees.find(x => x.user_id === uid && x.outil === outil);
function mettre(db, uid, outil, contenu, maj){
  const l = ligne(db, uid, outil);
  if (l){ l.contenu = contenu; l.maj_le = maj || new Date().toISOString(); } else db.donnees.push({ user_id: uid, outil, contenu, maj_le: maj || new Date().toISOString() });
}
async function repondre(r, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue().catch(() => {});
  if (!host.endsWith(".supabase.co")) return r.abort().catch(() => {});
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" } }).catch(() => {});
  const corps = req.postData() || "";
  db.traces.push(m + " " + p);
  let c = {}; try { c = JSON.parse(corps || "{}"); } catch (e) {}
  const auth = req.headers()["authorization"] || "", jeton = auth.replace(/^Bearer /, "");
  const a = db.acces[jeton], valide = !!a && !db.fermees.has(a.sid), moi = valide ? a.uid : null;
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  if (p.startsWith("/auth/v1/token")) {
    const g = q.get("grant_type") || "?";
    db.jetons.push({ g, email: c.email, password: c.password, refresh_token: c.refresh_token });
    if (g === "password") {
      const uid = Object.keys(db.mdp).find(k => db.emails[k] === c.email);
      if (!uid || db.mdp[uid] !== c.password) return json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
      db.nS++;
      return json(ouvrir(db, db.autreCompte ? COACH : uid, "s" + db.nS));
    }
    const x = db.renouv[c.refresh_token];
    if (!x || x.utilise || db.fermees.has(x.sid)) return json({ error: "invalid_grant", error_description: "Invalid Refresh Token: Refresh Token Not Found" }, 400);
    x.utilise = true;
    const rep = ouvrir(db, x.uid, x.sid);
    if (db.lentRenouv) await new Promise(t => setTimeout(t, db.lentRenouv));   // traité tout de suite, réponse retardée
    return json(rep);
  }
  if (p.startsWith("/auth/v1/user")) {
    if (m === "PUT") {
      db.puts.push({ jeton, corps: c });
      if (!moi) return json({ msg: "invalid JWT" }, 401);
      if (c.password) {
        db.mdp[moi] = c.password;
        Object.values(db.acces).concat(Object.values(db.renouv)).forEach(s => { if (s.uid === moi && s.sid !== a.sid) db.fermees.add(s.sid); });
      }
      return json(utilisateur(db, moi));
    }
    return moi ? json(utilisateur(db, moi)) : json({ msg: "invalid JWT" }, 401);
  }
  if (p.startsWith("/auth/v1/")) return json(null, 204);
  if (p.startsWith("/functions/v1/") || p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({});
  /* la base : un jeton fermé ou inconnu est refusé (401), comme un jeton d'une session fermée à son expiration */
  if (p.startsWith("/rest/v1/") && jeton && !valide) { db.refusees.push(m + " " + p + " " + jeton); return json({ message: "JWT expired", code: "PGRST301" }, 401); }
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  if (p === "/rest/v1/profils") { const id = (q.get("id") || "").replace(/^eq\./, ""); let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(m === "GET" ? l : []); }
  if (p === "/rest/v1/donnees") {
    if (m === "POST") {
      if (db.panne) return r.abort().catch(() => {});
      let rows = []; try { rows = JSON.parse(corps); } catch (e) {}
      (Array.isArray(rows) ? rows : [rows]).forEach(x => {
        if (!x || x.user_id !== moi) return;
        db.n++; db.ecritures.push({ n: db.n, outil: x.outil, contenu: clone(x.contenu), jeton });
        mettre(db, x.user_id, x.outil, clone(x.contenu), x.maj_le);
      });
      return json(null, 201);
    }
    if (m !== "GET") return json(null, 201);
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "";
    db.n++; db.lectures.push({ n: db.n, outil: o, select: q.get("select") || "", jeton });
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
async function contexte(b, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: { width: 1100, height: 900 }, acceptDownloads: true });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, db));
  await c.addInitScript(({ s, magasin, langue }) => {
    if (!/^https?:$/.test(location.protocol) || localStorage.getItem("__init")) return;
    localStorage.setItem("__init", "1");   // une seule fois (un 2e onglet du même contexte partage localStorage)
    localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
    (magasin === "session" ? sessionStorage : localStorage).setItem("mhx_session", JSON.stringify(s));
    if (langue) localStorage.setItem("mhx_langue", langue);
  }, { s: sessionDepart(opts.meta), magasin: opts.magasin || "local", langue: opts.langue || "" });
  const page = await nouvellePage(c);
  return { c, page };
}
async function nouvellePage(c){
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return page;
}
async function ouvrirPage(page, hash, sel){
  await page.goto(URL0 + hash);
  await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 12000 });
  if (sel) await page.waitForSelector(sel, { timeout: 10000 });
  await attendre(page, 800);
}
/* remplit les trois champs et clique « Changer mon mot de passe » ; le message lu 1,2 s après */
async function changer(page, actuel, nouveau){
  await page.fill("#mc-actuel", actuel); await page.fill("#mc-nouveau", nouveau); await page.fill("#mc-nouveau2", nouveau);
  await page.click("#mc-mdp"); await attendre(page, 1200);
  return page.evaluate(() => ({ msg: (document.getElementById("mc-mdp-msg") || {}).textContent || "",
    champs: ["mc-actuel", "mc-nouveau", "mc-nouveau2"].map(i => (document.getElementById(i) || {}).value) }));
}
const etat = page => page.evaluate(() => {
  const lire = m => { try { return JSON.parse(m.getItem("mhx_session")); } catch (e) { return "illisible"; } };
  const s = Auth.session || {};
  return { acces: s.access_token || null, renouv: s.refresh_token || null, id: s.user && s.user.id, persistant: Auth.persistant,
    local: lire(localStorage), session: lire(sessionStorage), perdue: !!document.getElementById("session-perdue"),
    connexion: !!document.getElementById("co-email") || !!document.getElementById("co-err") };
});
const copies = (page, m) => page.evaluate(m => { const s = m === "session" ? sessionStorage : localStorage, o = {}; for (let i = 0; i < s.length; i++){ const k = s.key(i); if (k && k.indexOf("mhx_attente|") === 0) o[k.slice(12)] = JSON.parse(s.getItem(k)); } return o; }, m || "local");
const ecrireIntake = (page, marque) => page.evaluate(v => Store.ecrire("intake", Object.assign({}, Store.cache.intake || {}, { essai77: v })), marque);
const derniereIntake = (db, marque) => db.ecritures.filter(e => e.outil === "intake" && e.contenu && e.contenu.essai77 === marque);

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const b = await chromium.launch();

  /* =================== A. A5 : le changement part avec la session neuve, que l'app garde =================== */
  await bloc("A. changement du mot de passe (rester connecté coché)", async () => {
    const db = base(META);
    const { page } = await contexte(b, db, { meta: META });
    await ouvrirPage(page, "#/profil", "#mc-mdp");
    /* une saisie faite hors ligne attend son envoi (copie de l'appareil, compte de Thomas) */
    db.panne = true;
    const e0 = await ecrireIntake(page, "hors-ligne"); await attendre(page, 1500);
    const c0 = await copies(page);
    const r = await changer(page, MDP, NOUVEAU);
    const verif = db.jetons.filter(j => j.g === "password"), neuf = verif.length === 1 ? Object.keys(db.acces).find(k => db.acces[k].sid === "s1") : null;
    const renouvNeuf = Object.keys(db.renouv).find(k => db.renouv[k].sid === "s1");
    ok("le mot de passe actuel est vérifié une fois (connexion avec l'email et le mot de passe actuel), puis UN seul PUT /auth/v1/user { password: nouveau }",
      verif.length === 1 && verif[0].email === EMAIL && verif[0].password === MDP && db.puts.length === 1 && egal(db.puts[0].corps, { password: NOUVEAU }),
      JSON.stringify([verif, db.puts.map(x => x.corps)]));
    ok("… le PUT porte le jeton de la session NEUVE rendue par la vérification (pas l'ancien jeton de l'onglet)",
      !!neuf && db.puts.length === 1 && db.puts[0].jeton === neuf && db.puts[0].jeton !== ANCIEN_JETON, JSON.stringify([neuf, db.puts.map(x => x.jeton)]));
    ok("« Mot de passe changé. Utilise le nouveau à ta prochaine connexion. », les trois champs vidés",
      norm(r.msg) === "Mot de passe changé. Utilise le nouveau à ta prochaine connexion." && egal(r.champs, ["", "", ""]), JSON.stringify(r));
    const s1 = await etat(page);
    ok("l'app garde la session neuve (jeton d'accès ET de renouvellement de la vérification), même compte, rangée dans localStorage (« Rester connecté » coché), rien dans sessionStorage",
      s1.acces === neuf && s1.renouv === renouvNeuf && s1.id === THOMAS && s1.persistant === true && !!s1.local && s1.local.access_token === neuf && s1.local.refresh_token === renouvNeuf && s1.session === null,
      JSON.stringify(s1));
    const c1 = await copies(page);
    ok("la copie en attente (hors ligne) reste sur l'appareil, du même compte, inchangée",
      e0 === true && !!c0[THOMAS + "|intake"] && egal(c1[THOMAS + "|intake"], c0[THOMAS + "|intake"]) && c1[THOMAS + "|intake"].a === THOMAS && c1[THOMAS + "|intake"].v.essai77 === "hors-ligne",
      JSON.stringify([e0, Object.keys(c0), Object.keys(c1)]));
    /* le réseau revient : la copie part, avec le jeton neuf (l'ancienne session est fermée) */
    db.panne = false;
    await page.evaluate(() => Store.reprendre()); await attendre(page, 1500);
    const E1 = derniereIntake(db, "hors-ligne"), c2 = await copies(page);
    ok("le réseau revient : la copie arrive dans la base, avec le jeton neuf, puis quitte l'appareil",
      E1.length === 1 && E1[0].jeton === neuf && !c2[THOMAS + "|intake"], JSON.stringify([E1, Object.keys(c2)]));
    /* une écriture suivante passe */
    const e2 = await ecrireIntake(page, "apres"); await attendre(page, 1600);
    const E2 = derniereIntake(db, "apres"), s2 = await etat(page);
    ok("une écriture suivante passe (jeton neuf, aucun refus de la base), la personne reste connectée (pas de bandeau « Ta session a pris fin »)",
      e2 === true && E2.length === 1 && E2[0].jeton === neuf && db.refusees.length === 0 && !s2.perdue && !s2.connexion, JSON.stringify([e2, E2, db.refusees, s2.perdue, s2.connexion]));
    /* le jeton expire : le renouvellement se fait avec le jeton de renouvellement neuf (l'ancien est refusé par Supabase) */
    const rf = await page.evaluate(async () => { Auth.session.expire_le = Date.now() + 1000; return await Auth.assurer(); });
    const der = db.jetons.filter(j => j.g === "refresh_token");
    const e3 = await ecrireIntake(page, "renouvele"); await attendre(page, 1600);
    const E3 = derniereIntake(db, "renouvele"), s3 = await etat(page);
    ok("jeton expiré : renouvellement avec le jeton de renouvellement NEUF (accepté), l'écriture suivante passe, toujours connecté",
      rf === true && der.length === 1 && der[0].refresh_token === renouvNeuf && E3.length === 1 && db.acces[E3[0].jeton] && db.acces[E3[0].jeton].sid === "s1" && E3[0].jeton !== neuf && !s3.perdue && db.refusees.length === 0,
      JSON.stringify([rf, der, E3.map(x => x.jeton), s3.perdue, db.refusees]));
    ok("… l'ancienne session est bien fermée côté Supabase simulé (son renouvellement serait refusé)", db.fermees.has("s0") && !db.fermees.has("s1"), JSON.stringify([...db.fermees]));
  });

  /* =================== A2. « Rester connecté » décoché : la session neuve reste dans l'onglet =================== */
  await bloc("A2. rester connecté décoché", async () => {
    const db = base(META);
    const { page } = await contexte(b, db, { meta: META, magasin: "session" });
    await ouvrirPage(page, "#/profil", "#mc-mdp");
    const s0 = await etat(page);
    const r = await changer(page, MDP, NOUVEAU);
    const neuf = Object.keys(db.acces).find(k => db.acces[k].sid === "s1"), s1 = await etat(page);
    ok("départ : session dans sessionStorage (Auth.persistant false)", s0.persistant === false && !!s0.session && s0.local === null, JSON.stringify(s0));
    ok("après le changement : la session neuve est rangée dans sessionStorage, RIEN dans localStorage, Auth.persistant reste false ; le PUT porte le jeton neuf",
      norm(r.msg) === "Mot de passe changé. Utilise le nouveau à ta prochaine connexion." && s1.persistant === false && !!s1.session && s1.session.access_token === neuf && s1.local === null && s1.acces === neuf && db.puts.length === 1 && db.puts[0].jeton === neuf,
      JSON.stringify([r.msg, s1, db.puts.map(x => x.jeton)]));
    const e = await ecrireIntake(page, "onglet-seul"); await attendre(page, 1600);
    const E = derniereIntake(db, "onglet-seul");
    ok("… une écriture suivante passe avec le jeton neuf", e === true && E.length === 1 && E[0].jeton === neuf && db.refusees.length === 0, JSON.stringify([e, E, db.refusees]));
  });

  /* =================== A3. mauvais mot de passe actuel ; réponse d'un autre compte =================== */
  await bloc("A3. mauvais mot de passe actuel", async () => {
    const db = base(META);
    const { page } = await contexte(b, db, { meta: META });
    await ouvrirPage(page, "#/profil", "#mc-mdp");
    const r = await changer(page, "pas-le-bon", NOUVEAU), s = await etat(page);
    ok("mauvais mot de passe actuel : « Ton mot de passe actuel n'est pas le bon. », aucun PUT, la session de l'onglet ne change pas (mémoire et localStorage)",
      norm(r.msg) === "Ton mot de passe actuel n'est pas le bon." && db.puts.length === 0 && db.jetons.filter(j => j.g === "password").length === 1 && s.acces === ANCIEN_JETON && s.renouv === ANCIEN_RENOUV && s.local && s.local.access_token === ANCIEN_JETON && s.session === null && db.mdp[THOMAS] === MDP,
      JSON.stringify([r.msg, db.puts, s]));
    const e = await ecrireIntake(page, "apres-refus"); await attendre(page, 1600);
    const E = derniereIntake(db, "apres-refus");
    ok("… l'app continue avec sa session (écriture suivante avec l'ancien jeton, acceptée)", e === true && E.length === 1 && E[0].jeton === ANCIEN_JETON && db.refusees.length === 0, JSON.stringify([e, E, db.refusees]));
    /* la vérification rend la session d'un AUTRE compte : rien n'est gardé ni envoyé */
    const db2 = base(META); db2.autreCompte = true;
    const X = await contexte(b, db2, { meta: META });
    await ouvrirPage(X.page, "#/profil", "#mc-mdp");
    const r2 = await changer(X.page, MDP, NOUVEAU), s2 = await etat(X.page);
    ok("vérification qui rend la session d'un autre compte : « Changement impossible. », aucun PUT, la session de Thomas reste (mémoire et localStorage)",
      norm(r2.msg) === "Changement impossible." && db2.puts.length === 0 && s2.acces === ANCIEN_JETON && s2.id === THOMAS && s2.local && s2.local.access_token === ANCIEN_JETON && s2.local.user.id === THOMAS,
      JSON.stringify([r2.msg, db2.puts, s2.acces, s2.id]));
  });

  /* =================== A5. un renouvellement de l'ancienne session part pendant la vérification =================== */
  await bloc("A5. renouvellement pendant le changement", async () => {
    const db = base(META);
    const { page } = await contexte(b, db, { meta: META });
    await ouvrirPage(page, "#/profil", "#mc-mdp");
    db.lentRenouv = 900;   // le renouvellement (ancien jeton) est accepté avant le changement, sa réponse arrive après
    await page.fill("#mc-actuel", MDP); await page.fill("#mc-nouveau", NOUVEAU); await page.fill("#mc-nouveau2", NOUVEAU);
    await page.evaluate(() => { document.getElementById("mc-mdp").click(); setTimeout(() => { Auth.rafraichir(); }, 0); });
    await attendre(page, 2200);
    const neuf = Object.keys(db.acces).find(k => db.acces[k].sid === "s1"), renouvNeuf = Object.keys(db.renouv).find(k => db.renouv[k].sid === "s1");
    const s = await etat(page), msg = await page.evaluate(() => (document.getElementById("mc-mdp-msg") || {}).textContent || "");
    ok("un renouvellement de l'ancienne session parti pendant la vérification (réponse arrivée après le changement) ne remplace pas la session neuve : l'app et localStorage gardent la neuve",
      db.jetons.filter(j => j.g === "refresh_token").length === 1 && db.puts.length === 1 && db.puts[0].jeton === neuf && norm(msg) === "Mot de passe changé. Utilise le nouveau à ta prochaine connexion." && s.acces === neuf && s.renouv === renouvNeuf && !!s.local && s.local.refresh_token === renouvNeuf,
      JSON.stringify([db.jetons.map(j => j.g), db.puts.map(x => x.jeton), msg, s.acces, s.local && s.local.access_token]));
    db.lentRenouv = 0;
    const e = await ecrireIntake(page, "apres-course"); await attendre(page, 1600);
    const E = derniereIntake(db, "apres-course"), s2 = await etat(page);
    ok("… l'écriture suivante passe avec le jeton neuf, personne n'est déconnecté", e === true && E.length === 1 && E[0].jeton === neuf && db.refusees.length === 0 && !s2.perdue, JSON.stringify([e, E, db.refusees, s2.perdue]));
  });

  /* =================== A4. un autre onglet reprend la session neuve =================== */
  await bloc("A4. autre onglet", async () => {
    const db = base(META);
    const { c, page } = await contexte(b, db, { meta: META });
    await ouvrirPage(page, "#/profil", "#mc-mdp");
    const p2 = await nouvellePage(c);
    await ouvrirPage(p2, "#/profil", "#mc-mdp");
    const a0 = await etat(p2);
    const r = await changer(page, MDP, NOUVEAU); await attendre(p2, 400);
    const neuf = Object.keys(db.acces).find(k => db.acces[k].sid === "s1"), a1 = await etat(p2);
    ok("l'autre onglet (même navigateur) avait l'ancienne session ; après le changement dans le 1er, il a pris la session neuve (événement « storage »)",
      a0.acces === ANCIEN_JETON && norm(r.msg) === "Mot de passe changé. Utilise le nouveau à ta prochaine connexion." && !!neuf && a1.acces === neuf && a1.id === THOMAS && !a1.perdue,
      JSON.stringify([a0.acces, r.msg, neuf, a1]));
    const e = await ecrireIntake(p2, "onglet-2"); await attendre(p2, 1600);
    const E = derniereIntake(db, "onglet-2"), a2 = await etat(p2);
    ok("… et y écrit avec le jeton neuf, sans refus ni déconnexion", e === true && E.length === 1 && E[0].jeton === neuf && db.refusees.length === 0 && !a2.perdue, JSON.stringify([e, E, db.refusees, a2.perdue]));
  });

  /* =================== B. E4 : les accords dans « Télécharger toutes mes données » =================== */
  async function exporter(page){
    const [dl] = await Promise.all([page.waitForEvent("download", { timeout: 8000 }), page.click("#sv-export")]);
    const f = await dl.path();
    return fs.readFileSync(f, "utf8");
  }
  const noteDonnees = page => page.evaluate(() => { const b = document.getElementById("sv-export"), s = b && b.closest("section"), n = s && s.querySelector("p.note"); return n ? n.textContent : null; });
  await bloc("B. export des accords", async () => {
    const db = base(META);
    const { page } = await contexte(b, db, { meta: META });
    await ouvrirPage(page, "#/profil", "#sv-export");
    const n0 = db.traces.length;
    const brut = await exporter(page); await attendre(page, 400);
    let J = null; try { J = JSON.parse(brut); } catch (e) {}
    const appels = db.traces.slice(n0);
    ok("le fichier porte compte.accords : exactement les accords du compte (conditions, newsletter, santé : dates, versions, écran ; ancien accord emails_suivi)",
      !!J && !!J.compte && memes(J.compte.accords, ACCORDS), JSON.stringify(J && J.compte));
    ok("… aucun autre champ des métadonnées (prénom, champ inconnu), aucun jeton dans le fichier",
      !!J && !("prenom" in (J.compte.accords || {})) && !("autre_champ" in (J.compte.accords || {})) && !/jeton-|renouvellement-|secret-77|access_token|refresh_token/.test(brut),
      brut.slice(0, 300));
    ok("… lu en mémoire : aucun appel à /auth/v1 pendant l'export (seulement la base : données et profil)",
      appels.length === 2 && !appels.some(x => /\/auth\/v1\//.test(x)) && appels.some(x => /^GET \/rest\/v1\/donnees/.test(x)) && appels.some(x => /^GET \/rest\/v1\/profils/.test(x)), JSON.stringify(appels));
    ok("… le reste du fichier est comme avant (identifiant, email, prénom, nom, données)",
      !!J && J.compte.identifiant === THOMAS && J.compte.email === EMAIL && J.compte.prenom === "Thomas" && J.plateforme === "MHX Coaching" && !!J.donnees && !!J.donnees.intake && !!J.donnees.mens,
      JSON.stringify(J && Object.assign({}, J.compte, { donnees: J && J.donnees && Object.keys(J.donnees) })));
    const t = norm(await noteDonnees(page));
    ok("texte de « Mes données » : plus de « copie complète » ; « une copie de tes saisies et de tes accords (tes photos et ton historique de connexion : sur demande à ton coach) »",
      t === "Tout est enregistré dans ton compte : tu retrouves tes données sur n'importe quel appareil en te connectant. Tu peux récupérer quand tu veux une copie de tes saisies et de tes accords (tes photos et ton historique de connexion : sur demande à ton coach), et demander leur effacement." && !/copie complète/.test(t), t);
    /* ancien compte, sans métadonnées : accords vide, l'export marche comme avant */
    const db2 = base(null);
    const X = await contexte(b, db2, {});
    await ouvrirPage(X.page, "#/profil", "#sv-export");
    let J2 = null; try { J2 = JSON.parse(await exporter(X.page)); } catch (e) {}
    ok("compte sans métadonnées (ancien compte) : compte.accords = {}, le reste du fichier est là", !!J2 && egal(J2.compte.accords, {}) && J2.compte.identifiant === THOMAS && !!J2.donnees.intake, JSON.stringify(J2 && J2.compte));
    /* en anglais */
    const db3 = base(META); mettre(db3, THOMAS, "prefs", { langue: "en" });
    const Y = await contexte(b, db3, { meta: META, langue: "en" });
    await ouvrirPage(Y.page, "#/profil", "#sv-export");
    const t3 = norm(await noteDonnees(Y.page));
    ok("en anglais : « … You can get a copy of your entries and your consents whenever you want (your photos and login history: on request to your coach), and ask for them to be deleted. »",
      t3 === "Everything is saved to your account: log in on any device to find your data. You can get a copy of your entries and your consents whenever you want (your photos and login history: on request to your coach), and ask for them to be deleted.", t3);
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
