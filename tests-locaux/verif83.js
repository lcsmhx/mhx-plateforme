/* v78 (tâche 3) — CAPTCHA Cloudflare Turnstile sur la connexion et la création de compte, « en ligne mais éteint ».
   L'interrupteur est la clé : CONFIG.turnstile.cle_site (js/config.js). Vide = l'app exactement comme avant. Les autres
   suites la reçoivent toujours vide (fichiers.js, forcerTurnstile) ; celle-ci l'allume dans sa retouche avec les clés de
   TEST officielles de Cloudflare, servies par un FAUX api.js (route Playwright sur challenges.cloudflare.com) qui les
   reproduit : 1x00000000000000000000AA (visible, passe : jeton XXXX.DUMMY.TOKEN.XXXX), 2x00000000000000000000AB (visible,
   échoue : error-callback), 1x00000000000000000000BB (invisible, passe), 3x00000000000000000000FF (défi : jeton seulement
   après un clic dans le widget). Le faux Supabase renvoie les vraies erreurs de Supabase Auth (middleware verifyCaptcha) :
   400 captcha_failed « captcha protection: request disallowed (no captcha_token found | invalid-input-response |
   timeout-or-duplicate) », 500 « captcha verification process failed ».
     A0  sans navigateur : une seule clé et un seul « profil » dans les fichiers, la valeur réellement exécutée ; la règle des
         clés publiables (problemeTurnstile : jamais une clé de test, jamais la longueur d'une clé secrète) ; sur main la clé
         du fichier doit la respecter (branche v2/* : seule une clé de TEST est tolérée, en le disant ; la longueur d'une
         clé secrète est rouge partout, toute branche poussée est publique) ; clé remplie (main) : le texte court de
         confidentialité de l'app cite Cloudflare (FR et EN) et plus Google Fonts ; servi éteint aux autres suites ;
         l'adresse du script écrite une seule fois (js/connexion.js), jamais dans index.html ni en preconnect ;
     A   clé vide : aucun élément, aucun script ni requête vers Cloudflare, corps de /token et /signup au caractère près,
         connexion, inscription (FR, EN), « Me reconnecter » et renouvellement inchangés ; écran identique à celui de la clé
         de test sans son widget ; CAPTCHA allumé dans Supabase sans clé : message « écris à ton coach » ;
     B   clé 1x…AA : script chargé une fois, seulement sur la connexion et la création de compte (et « Me reconnecter »),
         jamais sur l'app d'un client ou du coach ; rendu explicite (options exactes) ; jeton dans
         gotrue_meta_security.captcha_token de /token et /signup ; remise à zéro après un mot de passe faux (nouveau jeton à
         l'essai suivant), aucune après un refus de saisie ; retrait au changement d'écran ; script arrivé après un
         changement d'écran ; place réservée SOUS le bouton (rien ne saute) ; bouton jamais bloqué par le CAPTCHA ;
     C   2x…AB (échec) et 1x…BB (invisible) ; D 3x…FF (défi) : 4 s d'attente au plus, puis envoi sans jeton (et sans remise
         à zéro : la vérification continue) ; écran quitté pendant l'attente : rien n'est envoyé ; E script injoignable ou
         qui ne répond pas ; F erreurs de Supabase (FR et EN) ; G le coach qui crée un compte (creer-acces inchangé, aucun
         CAPTCHA) ; H Profil (profil false / true) ; I 320 px (compact, rien ne déborde) ; le bouton à la même place qu'avec
         la clé vide, visible sans défiler (390 × 844 et 320 × 568, téléphone obligatoire comme en ligne).
   Hors banc : R (VERIF83_RESEAU=1) charge le VRAI script de Cloudflare avec la clé 1x00000000000000000000AA sur localhost et
   attend un jeton dans le corps de /signup ; AV (VERIF83_AVANT=<index.html de la version d'avant>) compare l'écran et les
   corps de /token et /signup avec cette version, clé vide.
   Supabase simulé (gabarit de verif80) : rien ne part vers la vraie base ni vers Cloudflare (routage par NOM D'HÔTE).
   Comptes fictifs (@exemple.fr). Chaque bloc tourne à part (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif83.js ../index.html
           VERIF83_PORT=9991 node verif83.js ../index.html     (autre port, si 9990 est pris ; AV utilise le port + 2)
           VERIF83_BLOCS="B,F" node verif83.js …               (seulement les blocs dont le nom commence ainsi)
           VERIF83_RESEAU=1 VERIF83_BLOCS="R" node verif83.js …  (le vrai script de Cloudflare, Internet nécessaire)
           VERIF83_AVANT=/chemin/de/l/ancienne/index.html VERIF83_BLOCS="AV" node verif83.js … */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const FT = require("./fichiers");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF83_PORT || 9990;
const BLOCS = (process.env.VERIF83_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const RESEAU = process.env.VERIF83_RESEAU === "1";
const AVANT = process.env.VERIF83_AVANT ? path.resolve(process.env.VERIF83_AVANT) : "";
const MOBILE = { width: 390, height: 844 }, PETIT = { width: 320, height: 640 }, LARGE = { width: 1280, height: 900 };
const TS = FT.TURNSTILE_TEST || { passe: "1x00000000000000000000AA", echoue: "2x00000000000000000000AB",
  passe_invisible: "1x00000000000000000000BB", echoue_invisible: "2x00000000000000000000BB", interactif: "3x00000000000000000000FF" };
const DUMMY = "XXXX.DUMMY.TOKEN.XXXX";
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=mhxTurnstilePret";

/* ---------- la page servie : inscription ouverte, textes légaux de test, CAPTCHA réglé par avecCle ---------- */
let cle = "", profil = false, tel = false;   // tel : téléphone obligatoire (comme en ligne), seulement pour le bloc I
const forcerTs = (h, k, p) => typeof FT.forcerTurnstile === "function" ? FT.forcerTurnstile(h, k, p) : h;
const retouche = h => { const x = forcerTs(FT.forcerLegaux(FT.forcerInscription(h, true)), cle, profil); return tel ? FT.forcerTelephone(x, true) : x; };
const serveur = page => http.createServer((req, res) => {
  if (FT.servirFichier(req, res, page, retouche)) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(retouche(fs.readFileSync(page, "utf8")));
});
const server = serveur(HTML);
async function avecCle(k, p, fn){ const a = cle, b = profil; cle = k; profil = !!p; try { await fn(); } finally { cle = a; profil = b; } }

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
  if (BLOCS.length && !BLOCS.some(x => nom.startsWith(x))) return;
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); }
}

/* ---------- dates, petites aides ---------- */
const T0 = Date.now(), J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const norm = t => String(t || "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const cles = s => { try { return Object.keys(JSON.parse(s)); } catch (e) { return null; } };
const lireJ = s => { try { return JSON.parse(s); } catch (e) { return null; } };

/* ---------- les personnes ---------- */
const session = (id, email, meta, expire) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: expire != null ? expire : Date.now() + J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: meta } : {}) });
const PID = k => "00000000-0000-4000-8000-0000000083" + String(k).padStart(2, "0");   // verif83 : …83kk
const COACH = { id: F.IDS.coach, email: "coach@exemple.fr" }, THOMAS = { id: F.IDS.c1, email: "thomas@exemple.fr" };
const INES = { id: PID(1), email: "ines@exemple.fr" };
const MDP = "motdepasse1";

/* ---------- le décor : fixtures.js (coach, clients) + une prospecte ---------- */
function base(extra){
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  profils.push({ id: INES.id, prenom: "Inès", nom: "Morel", role: "client", statut: "prospect", cree_le: avant(3 * J) });
  const donnees = clone(F.donnees).concat([
    { user_id: INES.id, outil: "contact", contenu: { telephone: "+33639980083", inscrit_le: avant(3 * J) }, maj_le: avant(3 * J) }
  ], extra || []);
  const emails = { [COACH.id]: COACH.email, [THOMAS.id]: THOMAS.email, [INES.id]: INES.email };
  const mdp = { [COACH.email]: MDP, [THOMAS.email]: MDP, [INES.email]: MDP };
  return { profils, donnees, ecritures: [], chemins: [], inscriptions: [], emails, mdp, meta: {}, inscription: {}, puts: [], fonctions: [],
    captcha: "off", bruts: { token: [], signup: [], refresh: [] }, cf: [], ts: { injoignable: false, muet: false, delai: 0 } };
}

/* ---------- le faux Supabase (gabarit de verif80) + le faux Turnstile ---------- */
const MAX_LIGNES = 1000;
const ILLISIBLES_PROPRIO = ["notes_coach", "suivi_prospect"];
const INTERDITES_PROPRIO = ["feedbacks", "notes_coach", "suivi_prospect"];
const ECRITES_PAR_COACH = ["programme", "repas", "calc", "complements", "hist_programme", "hist_repas", "feedbacks", "notes_coach", "suivi_prospect"];
const permis = (moi, coach, row) => !!moi && (row.user_id === moi ? (coach || !INTERDITES_PROPRIO.includes(row.outil)) : (coach && ECRITES_PAR_COACH.includes(row.outil)));
const externes = new Set();
function ordonner(l, order){
  const cl = String(order || "").split(",").filter(Boolean).map(x => { const [k, sens] = x.split("."); return { k, desc: sens === "desc" }; });
  if (!cl.length) return l;
  const v = (x, k) => (x && typeof x === "object" && x[k] != null) ? String(x[k]) : "";
  return l.slice().sort((a, b) => { for (const { k, desc } of cl) { const x = v(a, k), y = v(b, k); if (x !== y) return (x < y ? -1 : 1) * (desc ? -1 : 1); } return 0; });
}
const liste = t => String(t).replace(/^\(|\)$/g, "").split(",").map(x => x.trim().replace(/^"|"$/g, ""));
function parOutil(l, o){
  if (o.startsWith("eq.")) return l.filter(x => x.outil === o.slice(3));
  if (o.startsWith("in.")) { const k = liste(o.slice(3)); return l.filter(x => k.includes(x.outil)); }
  if (o.startsWith("not.in.")) { const k = liste(o.slice(7)); return l.filter(x => !k.includes(x.outil)); }
  return l;
}
const colonnes = (l, q) => { const sel = (q.get("select") || "*").split(","); return sel.includes("*") ? l : l.map(x => Object.fromEntries(sel.map(k => [k, x[k]]))); };
const appelant = req => { const m = /^Bearer (?:jeton-)([0-9a-f-]{36})/.exec(req.headers()["authorization"] || ""); return m ? m[1] : null; };
/* la réponse de Supabase Auth quand le CAPTCHA est allumé (middleware.go, verifyCaptcha) : null = accepté.
   db.captcha : off (éteint), 1x (clé secrète de test 1x : seul le jeton factice passe), 2x (invalid-input-response),
   3x (timeout-or-duplicate), 500 (Cloudflare injoignable par Supabase), ancien (versions d'avant la v2.189.0 : jeton absent → 500) */
function refusCaptcha(db, c){
  const mode = db.captcha || "off";
  if (mode === "off") return null;
  const g = c && c.gotrue_meta_security, t = g && typeof g.captcha_token === "string" ? g.captcha_token.trim() : "";
  const e500 = [500, { code: 500, error_code: "unexpected_failure", msg: "captcha verification process failed", error_id: "verif83" }];
  if (mode === "500") return e500;
  if (!t) return mode === "ancien" ? e500 : [400, { code: 400, error_code: "captcha_failed", msg: "captcha protection: request disallowed (no captcha_token found)" }];
  const raison = mode === "2x" ? "invalid-input-response" : mode === "3x" ? "timeout-or-duplicate" : t === DUMMY ? "" : "invalid-input-response";
  return raison ? [400, { code: 400, error_code: "captcha_failed", msg: "captcha protection: request disallowed (" + raison + ")" }] : null;
}
/* le faux api.js de Cloudflare (rendu explicite, ?onload=) : reproduit les clés de test officielles, aux tailles du vrai
   widget (relevées le 12/10/2026 par le bloc R : normal 300 × 72, compact 150 × 147) ; window.__ts compte
   les chargements, les rendus (options), les remises à zéro, les retraits, les jetons émis et lus */
const FAUX_TURNSTILE = `(function(){
  var src = (document.currentScript && document.currentScript.src) || "", onload = "";
  try { onload = new URL(src).searchParams.get("onload") || ""; } catch (e) {}
  var T = window.__ts = window.__ts || { chargements: 0, src: [], rendus: [], resets: 0, removes: 0, emis: 0, lus: [], erreurs: 0 };
  T.chargements++; T.src.push(src);
  var W = {}, n = 0;
  function emettre(w){ w.jeton = "${DUMMY}"; T.emis++; w.boite.setAttribute("data-etat", "ok"); if (w.o.callback) w.o.callback(w.jeton); }
  function lancer(w){
    clearTimeout(w.m); w.jeton = ""; w.boite.innerHTML = ""; w.boite.removeAttribute("data-etat");
    var k = w.o.sitekey;
    if (window.__tsNonPris) { w.m = setTimeout(function(){ w.boite.setAttribute("data-etat", "nonpris"); if (w.o["unsupported-callback"]) w.o["unsupported-callback"](); }, 80); return; }   // navigateur non pris en charge
    if (k === "${TS.passe}" || k === "${TS.passe_invisible}") w.m = setTimeout(function(){ emettre(w); }, 80);
    else if (k === "${TS.interactif}") {
      var b = document.createElement("button"); b.type = "button"; b.id = "faux-ts-case"; b.textContent = "Verify you are human";
      b.onclick = function(){ b.remove(); emettre(w); };
      w.boite.appendChild(b);
    } else {
      var code = (k === "${TS.echoue}" || k === "${TS.echoue_invisible}") ? 300030 : 110100;
      w.m = setTimeout(function(){ T.erreurs++; w.boite.setAttribute("data-etat", "echec");
        var r = w.o["error-callback"] ? w.o["error-callback"](code) : undefined;
        if (!r) throw new Error("[Cloudflare Turnstile] Error: " + code + "."); }, 80);
    }
  }
  window.turnstile = {
    render: function(c, o){
      var z = typeof c === "string" ? document.querySelector(c) : c;
      if (!z || !o || !o.sitekey) throw new Error("[Cloudflare Turnstile] Invalid or missing parameter");
      var id = "faux" + (++n), compact = o.size === "compact", invisible = /BB$/.test(o.sitekey);
      var opts = {}; Object.keys(o).forEach(function(x){ opts[x] = typeof o[x] === "function" ? "fonction" : o[x]; });
      T.rendus.push({ id: id, zone: z.id, opts: opts });
      var boite = document.createElement("div"); boite.className = "faux-ts"; boite.setAttribute("data-taille", o.size || "normal");
      boite.style.cssText = invisible ? "display:none" : "width:" + (compact ? 150 : 300) + "px;height:" + (compact ? 147 : 72) + "px;border:1px solid #888;box-sizing:border-box;flex:0 0 auto";
      z.appendChild(boite);
      var w = W[id] = { id: id, o: o, z: z, boite: boite, jeton: "" };
      lancer(w); return id;
    },
    getResponse: function(id){ var w = W[id], t = w && w.jeton ? w.jeton : undefined; T.lus.push({ id: id, jeton: t || "", emis: T.emis }); return t; },
    reset: function(id){ T.resets++; var w = W[id]; if (w) lancer(w); },
    remove: function(id){ T.removes++; var w = W[id]; if (w){ clearTimeout(w.m); w.boite.remove(); delete W[id]; } },
    isExpired: function(id){ return false; },
    ready: function(f){ f(); }
  };
  if (onload && typeof window[onload] === "function") setTimeout(function(){ window[onload](); }, 0);
})();`;
async function repondre(r, db){
  const req = r.request(), u = req.url(), url = new URL(u), host = url.hostname;
  if (host === "localhost") return r.continue();
  if (host === "challenges.cloudflare.com" || host.endsWith(".challenges.cloudflare.com")) {
    db.cf.push(u);
    if (db.ts.reel) return r.continue();   // bloc R (hors banc) : le vrai script
    if (db.ts.injoignable) return r.abort("failed");
    if (db.ts.muet) return;                // jamais de réponse (réseau figé)
    if (url.pathname !== "/turnstile/v0/api.js") return r.abort("failed");
    if (db.ts.delai) await new Promise(z => setTimeout(z, db.ts.delai));
    return r.fulfill({ status: 200, contentType: "text/javascript; charset=utf-8", body: (db.ts.nonPris ? "window.__tsNonPris = true;\n" : "") + FAUX_TURNSTILE }).catch(() => {});
  }
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort(); }
  const p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const brut = req.postData() || "";
  const corps = () => { try { return JSON.parse(brut || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req);
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  db.chemins.push(m + " " + p);
  if (p.startsWith("/auth/v1/signup")) {   // déclencheur creer_profil : un profil prospect ; la session porte data en user_metadata
    db.bruts.signup.push({ brut, t: Date.now() });
    const c = corps() || {}, refus = refusCaptcha(db, c);
    if (refus) return json(refus[1], refus[0]);
    const data = c.data || {}; db.inscriptions.push(clone(c));
    const id = db.inscription.id || PID(99); db.emails[id] = c.email; db.mdp[c.email] = c.password; db.meta[id] = clone(data);
    db.profils.push({ id, prenom: data.prenom || "", nom: data.nom || "", role: "client", statut: "prospect", cree_le: new Date().toISOString() });
    if (db.inscription.sansSession) return json({ id, email: c.email, role: "", confirmation_sent_at: new Date().toISOString() });   // « Confirm email » allumé
    return json(session(id, c.email, data));
  }
  if (p.startsWith("/auth/v1/token")) {
    const c = corps() || {}, r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || ""));
    if (q.get("grant_type") === "refresh_token") {   // jamais soumis au CAPTCHA (isIgnoreCaptchaRoute)
      db.bruts.refresh.push({ brut, t: Date.now() });
      const id = r1 && r1[1];
      if (!id) return json({ code: 400, error_code: "refresh_token_not_found", msg: "Invalid Refresh Token: Refresh Token Not Found" }, 400);
      return json(session(id, db.emails[id] || "", db.meta[id]));
    }
    db.bruts.token.push({ brut, t: Date.now() });
    const refus = refusCaptcha(db, c);
    if (refus) return json(refus[1], refus[0]);
    const idm = Object.keys(db.emails).find(k => db.emails[k] === c.email);
    if (!idm || db.mdp[c.email] !== c.password) return json({ code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials" }, 400);
    return json(session(idm, c.email, db.meta[idm]));
  }
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  if (p.startsWith("/auth/v1/logout")) return json(null, 204);
  if (p.startsWith("/auth/v1/user")) {
    if (m === "PUT") { db.puts.push({ brut, par: moi }); const c = corps() || {}; if (moi && c.password) db.mdp[db.emails[moi]] = c.password; }
    return moi ? json(Object.assign({ id: moi, email: db.emails[moi] || "", role: "authenticated" }, db.meta[moi] ? { user_metadata: clone(db.meta[moi]) } : {})) : json({ msg: "invalid JWT" }, 401);
  }
  if (p.startsWith("/auth/v1/")) return json({});
  if (p === "/functions/v1/creer-acces") {
    const c = corps() || {}; db.fonctions.push({ brut, auth: req.headers()["authorization"] || "" });
    const id = PID(70); db.profils.push({ id, prenom: c.prenom || "", nom: c.nom || "", role: "client", statut: "prospect", cree_le: new Date().toISOString() });
    return json({ id, email: c.email, role: c.role || "client" });
  }
  if (!["GET", "HEAD"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m, corps: corps() });
  if (p.startsWith("/functions/v1/")) return json({ ok: true });
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/connexions") return json([]);
  if (p === "/rest/v1/profils") {
    const id = (q.get("id") || "").replace(/^eq\./, "");
    if (m === "GET" || m === "HEAD") { let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(colonnes(plage(l), q)); }
    db.ecritures.push({ table: "profils", m, id, corps: corps() });
    const pr = db.profils.find(x => x.id === id), c = corps() || {};
    if (pr && m === "PATCH") { Object.assign(pr, c); return json([clone(pr)]); }
    return json([]);
  }
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "", mj = q.get("maj_le");
    const cleEq = o.startsWith("eq.") ? o.slice(3) : null;
    if (m === "GET" || m === "HEAD") {
      let l = db.donnees.filter(x => coach || (x.user_id === moi && !ILLISIBLES_PROPRIO.includes(x.outil)));
      if (uid) l = l.filter(x => x.user_id === uid);
      return json(colonnes(plage(parOutil(l, o)), q));
    }
    if (m === "POST") {
      let rows = corps(); rows = Array.isArray(rows) ? rows : rows ? [rows] : [];
      const refuse = rows.find(row => !permis(moi, coach, row));
      if (refuse) { db.ecritures.push({ table: "donnees", m, refus: true, outil: refuse.outil, user_id: refuse.user_id }); return json({ code: "42501", message: 'new row violates row-level security policy for table "donnees"' }, 403); }
      const upsert = q.has("on_conflict"), out = [];
      for (const row of rows) {
        const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
        if (i > -1 && !upsert) return json({ code: "23505", message: "duplicate key value violates unique constraint" }, 409);
        const ligne = { user_id: row.user_id, outil: row.outil, contenu: clone(row.contenu), maj_le: row.maj_le || new Date().toISOString() };
        if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        db.ecritures.push(Object.assign({ table: "donnees", m }, clone(ligne)));
        out.push(ligne);
      }
      return (req.headers()["prefer"] || "").includes("return=representation") ? json(out, 201) : json(null, 201);
    }
    if (m === "PATCH") {
      const c = corps() || {};
      const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj == null || (mj === "is.null" ? !x.maj_le : (mj.startsWith("eq.") && x.maj_le === mj.slice(3)))));
      if (!row || !permis(moi, coach, row)) return json([]);
      Object.assign(row, { contenu: clone(c.contenu), maj_le: c.maj_le || new Date().toISOString() });
      db.ecritures.push(Object.assign({ table: "donnees", m }, clone(row)));
      return json([row]);
    }
    db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq });
    return json(null, 204);
  }
  if (p === "/rest/v1/bibliotheque") return m === "GET" ? json(coach ? colonnes(plage(clone(F.bibliotheque)), q) : []) : json(null, 204);
  const t = p.replace("/rest/v1/", "");
  if (F.catalogue[t]) return m === "GET" ? json(colonnes(plage(F.catalogue[t]), q)) : json(null, 201);
  return json([]);
}

/* ---------- un navigateur (contexte) ----------
   opts : viewport (MOBILE par défaut), langue ("en"), theme ("light" : ancien choix rangé sur l'appareil, ignoré depuis la v80), qui (compte connecté : { id, email }), expire (la
   session rangée expire à cet instant : renouvellement au démarrage), neuf (appareil sans aucune trace), port */
async function contexte(b, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || MOBILE });
  ouverts.push(c);
  c.setDefaultTimeout(9000);
  await c.route("**/*", r => repondre(r, db));
  if (opts.qui) db.emails[opts.qui.id] = opts.qui.email;
  await c.addInitScript(({ langue, theme, s, neuf }) => {
    if (!/^https?:$/.test(location.protocol)) return;
    if (!localStorage.getItem("__init")) {   // l'appareil n'est préparé qu'une fois : un rechargement le garde
      localStorage.setItem("__init", "1");
      if (!neuf){ localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); }
      if (langue) localStorage.setItem("mhx_langue", langue);
      if (theme) localStorage.setItem("mhx_theme", theme);
      if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
    }
  }, { langue: opts.langue || "", theme: opts.theme || "", s: opts.qui ? session(opts.qui.id, opts.qui.email, null, opts.expire) : null, neuf: !!opts.neuf });
  const page = await c.newPage();
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return { c, page };
}
const attendre = (page, ms) => page.waitForTimeout(ms);
const pret = async page => { await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 12000 }); await attendre(page, 300); };
const URL0 = `http://localhost:${PORT}/`;
async function portailOuvert(b, db, hash, opts){
  const { page } = await contexte(b, db, opts);
  await page.goto((opts && opts.url0 || URL0) + "#/" + hash); await page.waitForSelector("#c-go");
  return page;
}
/* l'écran du portail tel qu'on le voit */
const etat = page => page.evaluate(() => {
  const z = document.getElementById("co-captcha"), b = document.getElementById("c-go"), e = document.getElementById("co-err");
  const r = z ? z.getBoundingClientRect() : null, bx = z ? z.querySelector(".faux-ts") : null, rb = bx ? bx.getBoundingClientRect() : null;
  return { zone: !!z, classes: z ? z.className : "", h: r ? Math.round(r.height) : 0, larg: z ? z.clientWidth : 0,
    widgets: document.querySelectorAll(".faux-ts").length, taille: bx ? bx.getAttribute("data-taille") : "",
    boite: rb ? { g: Math.round(rb.left), d: Math.round(rb.right), l: Math.round(rb.width), h: Math.round(rb.height) } : null,
    apresBouton: !!(z && z.previousElementSibling && z.previousElementSibling.id === "c-go"),
    bouton: b ? { actif: !b.disabled, texte: b.textContent.trim(), haut: Math.round(b.getBoundingClientRect().top) } : null,
    err: e ? e.textContent.replace(/[  ]/g, " ").trim() : "", errOk: !!(e && e.classList.contains("ok")),
    ts: typeof window.turnstile, pret: typeof window.mhxTurnstilePret,
    scripts: Array.from(document.querySelectorAll("script[src], link[href]")).map(s => s.src || s.href).filter(s => /cloudflare/i.test(s)),
    T: window.__ts ? JSON.parse(JSON.stringify(window.__ts)) : null, sw: document.documentElement.scrollWidth, iw: window.innerWidth };
});
const carte = (page, sans) => page.evaluate(sans => {
  const c = document.querySelector(".carte-co"); if (!c) return "";
  const x = c.cloneNode(true); if (sans) x.querySelectorAll("#co-captcha").forEach(z => z.remove());
  return x.outerHTML;
}, !!sans);
const attendreWidget = page => page.waitForFunction(() => !!(window.__ts && window.__ts.emis > 0 || document.querySelector(".faux-ts[data-etat], #faux-ts-case")), null, { timeout: 9000 });
const attendreEtat = (page, e) => page.waitForFunction(e => !!document.querySelector('.faux-ts[data-etat="' + e + '"]'), e, { timeout: 9000 });
const attendreErr = page => page.waitForFunction(() => { const e = document.getElementById("co-err"), b = document.getElementById("c-go"); return !!(e && e.textContent.trim() && b && !b.disabled); }, null, { timeout: 12000 });
async function remplirConnexion(page, email, mdp){ await page.fill("#c-email", email); await page.fill("#c-mdp", mdp); }
async function remplirInscription(page, prenom, email){ await page.fill("#c-prenom", prenom); await page.fill("#c-email", email); await page.fill("#c-mdp", MDP); await page.check("#c-cgu"); }
/* un clic qui doit ouvrir l'app (rechargement) */
async function cliquerEtEntrer(page){ await Promise.all([page.waitForNavigation({ timeout: 15000 }).catch(() => {}), page.click("#c-go")]); await pret(page); }
const email = page => page.evaluate(() => CONFIG.marque.email);
/* les textes attendus (Captcha.TEXTES, connexion.js, et leur traduction, i18n.js) — {e} : l'adresse de la marque */
const TX = {
  fr: { attente: "La vérification anti-robot n'est pas encore terminée. Attends qu'elle soit validée (ou coche la case), puis réessaie. Si ça continue, écris à ton coach à {e}.",
    refus: "La vérification anti-robot n'a pas été acceptée. Elle vient d'être relancée : attends qu'elle soit validée, puis réessaie. Si ça continue, écris à ton coach à {e}.",
    injoignable: "La vérification anti-robot n'a pas pu se charger. Vérifie ta connexion, recharge la page, puis réessaie. Si ça continue, écris à ton coach à {e}.",
    echec: "La vérification anti-robot a échoué. Recharge la page, puis réessaie. Si ça continue, écris à ton coach à {e}.",
    navigateur: "Ton navigateur ne permet pas la vérification anti-robot. Mets-le à jour ou ouvre l'app dans un autre navigateur (Safari, Chrome). Si ça continue, écris à ton coach à {e}.",
    indispo: "La vérification anti-robot est momentanément indisponible : réessaie dans une minute.",
    eteint: "Impossible pour le moment (vérification de sécurité). Ferme et rouvre l'app (ou recharge la page), puis réessaie. Si ça continue, écris à ton coach à {e}.",
    profil: "Le changement de mot de passe n'est pas possible pour le moment (vérification anti-robot). Ferme et rouvre l'app (ou recharge la page), puis réessaie. Si ça continue, écris à ton coach à {e}.",
    faux: "Email ou mot de passe incorrect.", indispoService: "Service momentanément indisponible, réessaie dans une minute." },
  en: { attente: "The anti-bot check isn't finished yet. Wait until it's confirmed (or check the box), then try again. If it keeps happening, email your coach at {e}.",
    refus: "The anti-bot check wasn't accepted. It just restarted: wait until it's confirmed, then try again. If it keeps happening, email your coach at {e}.",
    injoignable: "The anti-bot check couldn't load. Check your connection, reload the page, then try again. If it keeps happening, email your coach at {e}.",
    echec: "The anti-bot check failed. Reload the page, then try again. If it keeps happening, email your coach at {e}.",
    indispo: "The anti-bot check is temporarily unavailable: try again in a minute.",
    eteint: "Not possible right now (security check). Close and reopen the app (or reload the page), then try again. If it keeps happening, email your coach at {e}.",
    profil: "Changing your password isn't possible right now (anti-bot check). Close and reopen the app (or reload the page), then try again. If it keeps happening, email your coach at {e}." }
};
const avecE = (t, e) => String(t).split("{e}").join(e);

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF83_PORT=9991 node verif83.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A0. la clé dans les fichiers (sans navigateur) =================== */
  await bloc("A0. réglage", async () => {
    const fonctions = ["forcerTurnstile", "valeursTurnstile", "problemeTurnstile", "modeLegaux", "brancheGit"].filter(n => typeof FT[n] !== "function");
    const disque = fonctions.length ? null : FT.valeursTurnstile(FT.source(HTML)), servi = fonctions.length ? null : FT.valeursTurnstile(FT.sourceServie(HTML));
    let execute = null, D = null;
    try { const conf = fs.readFileSync(path.join(path.dirname(HTML), "js", "config.js"), "utf8"), ctx = {};
      require("vm").runInNewContext(conf + "\n;this.__C = CONFIG; this.__D = typeof DECOUVERTE !== \"undefined\" ? DECOUVERTE : null;", ctx, { timeout: 2000 });
      execute = ctx.__C && ctx.__C.turnstile ? clone(ctx.__C.turnstile) : null; D = ctx.__D || null; } catch (e) { execute = { erreur: String(e.message).slice(0, 80) }; }
    ok("A0 : une seule clé « cle_site: \"…\" » et, juste dessous, un seul « profil: true|false » dans les fichiers (le forçage du banc les prend en entier), et ce sont les valeurs réellement exécutées (CONFIG.turnstile de js/config.js, bac à sable) ; servis éteints aux autres suites (sourceServie : \"\" et false)",
      !fonctions.length && disque.cles.length === 1 && disque.profils.length === 1 && !!execute && execute.cle_site === disque.cles[0] && String(execute.profil) === disque.profils[0]
        && servi.cles.length === 1 && servi.cles[0] === "" && servi.profils.length === 1 && servi.profils[0] === "false",
      JSON.stringify({ fonctions, disque, servi, execute }));
    if (fonctions.length) { ok("A0 : règle des clés publiables (problemeTurnstile)", false, "fichiers.js sans " + fonctions.join(", ")); ok("A0 : la clé du fichier est publiable", false, "fichiers.js incomplet"); }
    else {
      const CAS = [["", true], ["0x4AAAAAAABkMYinukE8nzY", true], ["0x4AAAAAAAc6HG1RMG_8EHSC", true],
        [TS.passe, false], [TS.echoue, false], [TS.passe_invisible, false], [TS.echoue_invisible, false], [TS.interactif, false],
        ["1x00000000000000000000AB", false], ["3x00000000000000000000AA", false], ["2x0000000000000000000000000000000AA", false],
        ["0x4AAAAAAABkMYinukE8nzYS2RO-STq1w2e3r4", false], [" 0x4AAAAAAABkMYinukE8nzY", false], ["0x4AAAAAAA BkMY", false], ["ma-cle", false], ["0x", false]];
      const faux = CAS.filter(([k, bon]) => (FT.problemeTurnstile(k) === "") !== bon).map(([k, bon]) => JSON.stringify(k) + (bon ? " refusée : " + FT.problemeTurnstile(k) : " acceptée"));
      ok("A0 : règle des clés publiables — acceptées : vide (éteint) et une clé de site au format de Cloudflare (0x…, 24 caractères) ; refusées : les 5 clés de test officielles et leurs variantes (1x/2x/3x0000…), la longueur d'une clé SECRÈTE (35 caractères et plus), un espace, une autre forme",
        faux.length === 0, faux.join(" | "));
      const dossier = path.join(path.dirname(HTML)), branche = FT.brancheGit(dossier), mode = FT.modeLegaux(process.env, branche);
      const pb = disque.cles.length === 1 ? FT.problemeTurnstile(disque.cles[0]) : "clé absente ou écrite " + disque.cles.length + " fois";
      /* v78 (tâche 3) : hors de main, seule une clé de TEST est tolérée ; la longueur d'une clé secrète (ou une autre forme)
         est rouge partout : toute branche poussée est publique */
      const estTest = k => Object.values(TS).includes(k) || /^[123]x0{10,}/i.test(String(k));
      const nomBranche = String(process.env.GITHUB_REF || "").replace(/^refs\/heads\//, "") || branche;
      const tolere = mode === "branche" && !!pb && disque.cles.length === 1 && estTest(disque.cles[0]);
      ok("A0 : la clé de js/config.js est publiable (vide ou clé de site réelle, jamais une clé de test ni la clé secrète) — strict sur main ; sur une branche v2/*, seule une clé de test est tolérée" + (tolere ? " ; branche de travail « " + nomBranche + " » : clé de test tolérée (main : rouge) : " + pb : ""),
        !pb || tolere, "mode " + mode + " : " + pb);
      /* clé remplie : le texte court de confidentialité de l'app (DECOUVERTE.confidentialite, accepté à l'inscription) doit
         déjà citer Cloudflare, en français ET en anglais (le script part chez Cloudflare dès que la clé est en ligne), et
         plus Google Fonts (polices hébergées avec l'app depuis la v66) — mode d'emploi : docs/TURNSTILE.md, étape 2 */
      const confProbleme = X => {
        const fr = ((X && X.confidentialite && X.confidentialite.paragraphes) || []).join(" "), en = ((X && X.en && X.en.confidentialite && X.en.confidentialite.paragraphes) || []).join(" ");
        const l = [];
        if (!/Cloudflare/.test(fr)) l.push("le texte français ne cite pas Cloudflare");
        if (!/Cloudflare/.test(en)) l.push("le texte anglais ne cite pas Cloudflare");
        if (/Google Fonts/i.test(fr + " " + en)) l.push("il cite encore Google Fonts (polices hébergées avec l'app depuis la v66)");
        return l.join(" ; ");
      };
      const texte = (fr, en) => ({ confidentialite: { paragraphes: fr }, en: { confidentialite: { paragraphes: en } } });
      const EX = [[texte(["Polices (Google Fonts) et vidéos (YouTube)."], ["Fonts (Google Fonts) and videos (YouTube)."]), false],
        [texte(["Vérification anti-robot : Cloudflare Turnstile.", "Vidéos : YouTube."], ["Videos: YouTube."]), false],
        [texte(["Vérification anti-robot : Cloudflare Turnstile.", "Vidéos : YouTube."], ["Anti-bot check: Cloudflare Turnstile.", "Videos: YouTube."]), true]];
      const regle = EX.every(([X, bon]) => (confProbleme(X) === "") === bon);
      const pbConf = disque.cles.length === 1 && disque.cles[0] !== "" ? (D ? confProbleme(D) : "DECOUVERTE introuvable dans js/config.js") : "";
      const tolereConf = mode === "branche" && !!pbConf;
      ok("A0 : clé remplie ⇒ le texte court de confidentialité de l'app (DECOUVERTE.confidentialite) cite Cloudflare en français ET en anglais, et plus Google Fonts (règle vérifiée sur 3 textes d'exemple) ; sur main, js/config.js la respecte (clé vide : rien à exiger)" + (tolereConf ? " ; branche « " + nomBranche + " » : toléré (main : rouge) : " + pbConf : ""),
        regle && (!pbConf || tolereConf), JSON.stringify({ regle, mode, pbConf }));
    }
    const src = FT.source(HTML), page0 = fs.readFileSync(HTML, "utf8");
    const nb = (src.match(/challenges\.cloudflare\.com/g) || []).length;
    let co = ""; try { co = fs.readFileSync(path.join(path.dirname(HTML), "js", "connexion.js"), "utf8"); } catch (e) {}
    ok("A0 : l'adresse du script de Cloudflare n'est écrite qu'une fois, dans js/connexion.js (Captcha.SCRIPT, rendu explicite + onload) ; jamais dans index.html, ni en <link rel=preconnect>",
      nb === 1 && co.includes(SCRIPT) && !/cloudflare/i.test(page0) && !/preconnect[^>]*cloudflare|cloudflare[^>]*preconnect/i.test(src), JSON.stringify({ nb, connexion: co.includes(SCRIPT), page: /cloudflare/i.test(page0) }));
  });

  /* =================== A. clé vide : exactement comme avant =================== */
  await bloc("A. clé vide", async () => {
    { const db = base();
      const page = await portailOuvert(b, db, "connexion");
      await attendre(page, 600);
      const e = await etat(page);
      ok("A : clé vide, connexion (FR, 390 px) — aucun élément du CAPTCHA (#co-captcha), aucun script ni lien vers Cloudflare, window.turnstile et mhxTurnstilePret absents, aucune requête vers challenges.cloudflare.com",
        !e.zone && e.widgets === 0 && e.ts === "undefined" && e.pret === "undefined" && e.scripts.length === 0 && db.cf.length === 0, JSON.stringify({ e, cf: db.cf }));
      await remplirConnexion(page, INES.email, "mauvais");
      const t0 = Date.now(); await page.click("#c-go"); await attendreErr(page);
      const e2 = await etat(page), d0 = (db.bruts.token[0] || {}).t - t0;
      ok("A : mot de passe faux — corps de /token exactement {\"email\",\"password\"} (au caractère près), envoyé sans attente, « Email ou mot de passe incorrect. », bouton actif",
        db.bruts.token.length === 1 && db.bruts.token[0].brut === JSON.stringify({ email: INES.email, password: "mauvais" }) && d0 < 1500 && e2.err === TX.fr.faux && e2.bouton.actif && e2.bouton.texte === "Se connecter",
        JSON.stringify({ bruts: db.bruts.token, d0, e2 }));
      await page.fill("#c-mdp", MDP); await cliquerEtEntrer(page);
      ok("A : bon mot de passe — corps exact {\"email\",\"password\"}, l'app s'ouvre ; toujours aucune requête vers Cloudflare",
        db.bruts.token.length === 2 && db.bruts.token[1].brut === JSON.stringify({ email: INES.email, password: MDP }) && db.cf.length === 0, JSON.stringify({ bruts: db.bruts.token, cf: db.cf })); }
    for (const langue of ["fr", "en"]) {
      const db = base(); db.inscription.id = PID(langue === "fr" ? 10 : 11);
      const page = await portailOuvert(b, db, "inscription", { langue, neuf: true });
      await attendre(page, 500);
      const e = await etat(page);
      await remplirInscription(page, "Zoé", "zoe" + langue + "@exemple.fr"); await page.check("#c-newsletter");
      await cliquerEtEntrer(page);
      const s = db.bruts.signup[0] || {}, c = lireJ(s.brut) || {};
      ok("A : clé vide, création de compte (" + langue.toUpperCase() + ") — aucun élément ni requête vers Cloudflare ; corps de /signup : clés exactement email, password, data (dans cet ordre, sans gotrue_meta_security), data exactement prenom, nom, consentement, conditions_version, newsletter, newsletter_version ; compte créé, l'app s'ouvre",
        !e.zone && e.ts === "undefined" && db.cf.length === 0 && db.bruts.signup.length === 1 && JSON.stringify(cles(s.brut)) === '["email","password","data"]'
          && JSON.stringify(Object.keys(c.data || {})) === '["prenom","nom","consentement","conditions_version","newsletter","newsletter_version"]' && c.email === "zoe" + langue + "@exemple.fr",
        JSON.stringify({ e: { zone: e.zone, ts: e.ts }, cf: db.cf, brut: s.brut }));
    }
    { /* renouvellement au démarrage, puis « Me reconnecter » (session perdue en cours d'utilisation) */
      const db = base();
      const { page } = await contexte(b, db, { qui: THOMAS, expire: Date.now() - 1000 });
      await page.goto(URL0 + "#/accueil"); await pret(page);
      const r = db.bruts.refresh[0] || {};
      await page.evaluate(() => sessionPerdue()); await page.click("#session-perdue button"); await page.waitForSelector("#c-go"); await attendre(page, 500);
      const e = await etat(page);
      ok("A : clé vide — renouvellement de session inchangé (corps exactement {\"refresh_token\"}), « Me reconnecter » : connexion sans élément ni requête vers Cloudflare",
        db.bruts.refresh.length >= 1 && r.brut === JSON.stringify({ refresh_token: "renouvellement-" + THOMAS.id }) && !e.zone && e.ts === "undefined" && db.cf.length === 0,
        JSON.stringify({ r, e: { zone: e.zone, ts: e.ts }, cf: db.cf })); }
    { /* l'écran avec la clé vide = l'écran avec la clé de test, sans son widget (même HTML, mêmes espaces) */
      const pareils = [];
      for (const [hash, langue] of [["connexion", "fr"], ["inscription", "fr"], ["inscription", "en"], ["connexion", "en"]]) {
        const p1 = await portailOuvert(b, base(), hash, { langue }); const vide = await carte(p1);
        let avec = "", z = false;
        await avecCle(TS.passe, false, async () => { const p2 = await portailOuvert(b, base(), hash, { langue }); await attendreWidget(p2); z = (await etat(p2)).widgets === 1; avec = await carte(p2, true); });
        pareils.push({ hash, langue, egal: vide === avec && vide.length > 500, z });
      }
      ok("A : connexion et création de compte (FR, EN) — avec la clé vide, la carte est au caractère près celle de la clé de test sans son widget (aucun espace ni retour à la ligne ajouté)",
        pareils.every(x => x.egal && x.z), JSON.stringify(pareils)); }
    { /* CAPTCHA allumé dans Supabase alors que la clé est vide (ordre d'activation inversé) */
      const vus = [];
      for (const [hash, langue] of [["connexion", "fr"], ["inscription", "en"]]) {
        const db = base(); db.captcha = "1x";
        const page = await portailOuvert(b, db, hash, { langue, neuf: hash === "inscription" });
        if (hash === "connexion") await remplirConnexion(page, INES.email, MDP); else await remplirInscription(page, "Léo", "leo@exemple.fr");
        await page.click("#c-go"); await attendreErr(page);
        const e = await etat(page), m = await email(page);
        vus.push({ hash, langue, err: e.err, attendu: avecE(TX[langue].eteint, m), actif: e.bouton.actif, cf: db.cf.length, n: db.bruts[hash === "connexion" ? "token" : "signup"].length });
      }
      ok("A : CAPTCHA allumé dans Supabase avec la clé vide (400 « no captcha_token found ») — message « écris à ton coach » (FR à la connexion, EN à l'inscription) au lieu du texte brut ou de « Inscription impossible », bouton actif, aucune requête vers Cloudflare",
        vus.every(v => v.err === v.attendu && v.actif && v.cf === 0 && v.n === 1), JSON.stringify(vus)); }
  });

  /* =================== B. clé de test 1x…AA (passe) =================== */
  await avecCle(TS.passe, false, async () => {
    await bloc("B. clé 1x…AA", async () => {
      { const db = base(); db.captcha = "1x";
        const page = await portailOuvert(b, db, "connexion");
        await attendreWidget(page); await attendre(page, 200);
        const e = await etat(page), R = (e.T && e.T.rendus[0]) || {}, o = R.opts || {};
        ok("B : connexion — le script de Cloudflare chargé une fois, à l'adresse exacte (" + SCRIPT + "), widget rendu dans #co-captcha, juste SOUS le bouton (le bouton garde sa place)",
          db.cf.length === 1 && db.cf[0] === SCRIPT && e.T && e.T.chargements === 1 && e.T.rendus.length === 1 && R.zone === "co-captcha" && e.widgets === 1 && e.apresBouton && e.scripts.length === 1 && e.scripts[0] === SCRIPT,
          JSON.stringify({ cf: db.cf, T: e.T, apresBouton: e.apresBouton, scripts: e.scripts }));
        const att = { sitekey: TS.passe, action: "connexion", language: "fr", theme: "dark", size: "normal", appearance: "always", "response-field": false, "refresh-expired": "auto",
          callback: "fonction", "error-callback": "fonction", "expired-callback": "fonction", "timeout-callback": "fonction", "unsupported-callback": "fonction" };
        ok("B : rendu explicite, options exactes — sitekey, action « connexion », langue fr, thème sombre (celui de l'app), taille normal (390 px), appearance always, response-field false, refresh-expired auto, les 5 rappels (callback, error, expired, timeout, unsupported)",
          JSON.stringify(Object.keys(o).sort()) === JSON.stringify(Object.keys(att).sort()) && Object.keys(att).every(k => o[k] === att[k]), JSON.stringify(o));
        await remplirConnexion(page, INES.email, "mauvais");
        await page.click("#c-go"); await attendreErr(page); await attendre(page, 300);
        const e2 = await etat(page), c1 = lireJ((db.bruts.token[0] || {}).brut) || {};
        ok("B : mot de passe faux — le jeton part dans le corps de /token, au format de Supabase : clés email, password, gotrue_meta_security { captcha_token: « " + DUMMY + " » } ; « Email ou mot de passe incorrect. » ; widget remis à zéro une fois ; bouton actif (« Se connecter »)",
          db.bruts.token.length === 1 && JSON.stringify(cles(db.bruts.token[0].brut)) === '["email","password","gotrue_meta_security"]' && JSON.stringify(c1.gotrue_meta_security) === JSON.stringify({ captcha_token: DUMMY })
            && e2.err === TX.fr.faux && e2.T.resets === 1 && e2.bouton.actif && e2.bouton.texte === "Se connecter",
          JSON.stringify({ bruts: db.bruts.token, e2: { err: e2.err, resets: e2.T.resets, bouton: e2.bouton } }));
        await page.waitForFunction(() => window.__ts.emis === 2);   // la remise à zéro a effacé le jeton consommé ; un nouveau est émis
        const emis = await page.evaluate(() => window.__ts.emis);
        await page.fill("#c-mdp", MDP); await cliquerEtEntrer(page);
        const c2 = lireJ((db.bruts.token[1] || {}).brut) || {};
        ok("B : essai suivant (bon mot de passe) — un NOUVEAU jeton (le consommé est effacé par la remise à zéro, 2 jetons émis), dans le corps, l'app s'ouvre",
          emis === 2 && db.bruts.token.length === 2 && c2.gotrue_meta_security && c2.gotrue_meta_security.captcha_token === DUMMY && c2.password === MDP,
          JSON.stringify({ emis, bruts: db.bruts.token.map(x => x.brut) }));
        const e3 = await etat(page);
        ok("B : … et dans l'app connectée, le script de Cloudflare n'est plus chargé (aucune nouvelle requête après le rechargement)", db.cf.length === 1 && e3.ts === "undefined", JSON.stringify({ cf: db.cf, ts: e3.ts })); }
      { const db = base(); db.captcha = "1x"; db.ts.delai = 2000;
        const page = await portailOuvert(b, db, "connexion");
        await remplirConnexion(page, INES.email, MDP);
        const avantClic = await page.evaluate(() => !!(window.__ts && window.__ts.emis));
        const t0 = Date.now(); await cliquerEtEntrer(page);
        const d = (db.bruts.token[0] || {}).t - t0, c = lireJ((db.bruts.token[0] || {}).brut) || {};
        ok("B : clic avant que le jeton soit prêt (script lent) — l'envoi attend le jeton (bien moins de 4 s), puis part avec lui ; connexion réussie",
          !avantClic && db.bruts.token.length === 1 && c.gotrue_meta_security && c.gotrue_meta_security.captcha_token === DUMMY && d > 400 && d < 3800, JSON.stringify({ avantClic, d, brut: (db.bruts.token[0] || {}).brut })); }
      for (const [langue, theme] of [["fr", ""], ["en", "light"]]) {   // EN : ancien choix « clair » rangé sur l'appareil, ignoré (v80 : tout en sombre)
        const db = base(); db.captcha = "1x"; db.inscription.id = PID(langue === "fr" ? 20 : 21);
        const page = await portailOuvert(b, db, "inscription", { langue, theme, neuf: true });
        await attendreWidget(page);
        const e = await etat(page), o = ((e.T && e.T.rendus[0]) || {}).opts || {};
        await remplirInscription(page, "Zoé", "zoe-b" + langue + "@exemple.fr");
        await cliquerEtEntrer(page);
        const s = db.bruts.signup[0] || {}, c = lireJ(s.brut) || {};
        ok("B : création de compte (" + langue.toUpperCase() + (theme ? ", ancien choix « clair » ignoré, v80" : "") + ") — widget : action « inscription », langue " + langue + ", thème dark ; corps de /signup : email, password, data (exactement comme sans CAPTCHA), puis gotrue_meta_security.captcha_token ; compte créé, l'app s'ouvre",
          o.action === "inscription" && o.language === langue && o.theme === "dark" && db.bruts.signup.length === 1 && JSON.stringify(cles(s.brut)) === '["email","password","data","gotrue_meta_security"]'
            && JSON.stringify(Object.keys(c.data || {})) === '["prenom","nom","consentement","conditions_version","newsletter","newsletter_version"]' && c.gotrue_meta_security.captcha_token === DUMMY && db.inscriptions.length === 1,
          JSON.stringify({ o: { action: o.action, language: o.language, theme: o.theme }, brut: s.brut }));
      }
      { const db = base(); db.captcha = "1x";
        const page = await portailOuvert(b, db, "inscription", { neuf: true });
        await attendreWidget(page);
        await page.click("#c-go"); await attendre(page, 250);                                         // prénom manquant
        await page.fill("#c-prenom", "Léa"); await page.fill("#c-email", "lea@exemple.fr"); await page.fill("#c-mdp", "court");
        await page.click("#c-go"); await attendre(page, 250);                                         // mot de passe trop court
        await page.fill("#c-mdp", MDP); await page.click("#c-go"); await attendre(page, 250);        // case non cochée
        const e = await etat(page);
        ok("B : saisie refusée sur place (prénom, mot de passe trop court, case) — rien n'est envoyé, le widget n'est PAS remis à zéro (jeton intact), bouton actif",
          db.bruts.signup.length === 0 && e.T.resets === 0 && e.bouton.actif && e.widgets === 1, JSON.stringify({ n: db.bruts.signup.length, resets: e.T.resets, err: e.err })); }
      { const db = base();
        const page = await portailOuvert(b, db, "connexion");
        await attendreWidget(page);
        await page.click('[data-mode="inscription"]'); await page.waitForSelector("#c-prenom"); await attendreWidget(page); await attendre(page, 150);
        const e1 = await etat(page);
        await page.click('[data-mode="connexion"]'); await page.waitForSelector("#c-rester"); await attendre(page, 250);
        const e2 = await etat(page);
        await page.click('[data-mode="oubli"]'); await page.waitForSelector("#co-oubli"); await attendre(page, 250);
        const e3 = await etat(page);
        ok("B : changement d'écran — connexion → création de compte → connexion : l'ancien widget retiré à chaque fois (turnstile.remove), un seul à l'écran, script chargé une seule fois ; « Mot de passe oublié ? » : widget retiré, aucun nouveau",
          e1.T.removes === 1 && e1.widgets === 1 && e1.T.rendus.length === 2 && e2.T.removes === 2 && e2.widgets === 1 && e2.T.rendus.length === 3
            && e3.T.removes === 3 && e3.widgets === 0 && !e3.zone && e3.T.rendus.length === 3 && e3.T.chargements === 1 && db.cf.length === 1,
          JSON.stringify({ e1: e1.T, e2: e2.T, e3: e3.T, w: [e1.widgets, e2.widgets, e3.widgets], cf: db.cf.length })); }
      { const db = base(); db.captcha = "1x"; db.inscription.id = PID(22); db.inscription.sansSession = true;
        const page = await portailOuvert(b, db, "inscription", { neuf: true });
        await attendreWidget(page); await remplirInscription(page, "Noé", "noe@exemple.fr");
        await page.click("#c-go"); await page.waitForSelector("#co-verif"); await attendre(page, 200);
        const e = await etat(page);
        ok("B : « Vérifie ta boîte mail » (Supabase demande de confirmer l'email) — le jeton est parti, le widget est retiré avec le formulaire",
          db.bruts.signup.length === 1 && (lireJ(db.bruts.signup[0].brut) || {}).gotrue_meta_security && e.T.removes === 1 && e.widgets === 0, JSON.stringify({ T: e.T, n: db.bruts.signup.length })); }
      { /* script lent : il arrive après le changement d'écran (compteur de tour) ; place réservée avant son arrivée */
        const db = base(); db.ts.delai = 1500;
        const t00 = Date.now();
        const page = await portailOuvert(b, db, "connexion");
        const ouvert = Date.now() - t00;
        await attendre(page, 200);
        const e0 = await etat(page);
        await page.click('[data-mode="inscription"]'); await page.waitForSelector("#c-prenom"); await attendre(page, 200);
        const e1 = await etat(page);
        await attendreWidget(page); await attendre(page, 300);
        const e2 = await etat(page);
        ok("B : script lent (1,5 s) — la page est chargée sans l'attendre (script ajouté après l'événement « load » : le reste de l'app n'est pas retardé) ; en attendant, la place est réservée (72 px) et le bouton reste actif ; arrivé après le passage à la création de compte : un seul rendu, pour l'écran affiché (action « inscription »), le bouton n'a pas bougé (rien ne saute)",
          ouvert < 1400 && e0.h >= 72 && e0.bouton.actif && e0.widgets === 0 && e1.h >= 72 && e2.T.chargements === 1 && e2.T.rendus.length === 1 && e2.T.rendus[0].opts.action === "inscription" && e2.widgets === 1 && e2.bouton.haut === e1.bouton.haut && e2.h === e1.h,
          JSON.stringify({ ouvert, e0: { h: e0.h, b: e0.bouton }, e1: { h: e1.h, b: e1.bouton }, e2: { h: e2.h, b: e2.bouton, T: e2.T } })); }
      { /* le script ne se charge jamais dans l'app : client (accueil, Profil, Ma progression), coach (tableau de bord, Mes clients) */
        const db = base();
        const vus = [];
        { const { page } = await contexte(b, db, { qui: THOMAS });
          for (const h of ["#/accueil", "#/profil", "#/mensurations"]) { await page.goto(URL0 + h); await pret(page); await attendre(page, 300); vus.push(h + ":" + (await page.evaluate(() => typeof window.turnstile + "," + !!document.querySelector(".co-captcha")))); } }
        { const { page } = await contexte(b, db, { qui: COACH, viewport: LARGE });
          for (const h of ["#/tableau", "#/clients"]) { await page.goto(URL0 + h); await pret(page); await attendre(page, 300); vus.push(h + ":" + (await page.evaluate(() => typeof window.turnstile + "," + !!document.querySelector(".co-captcha")))); } }
        ok("B : clé remplie — le script de Cloudflare n'est JAMAIS chargé dans l'app : client (accueil, Profil, Ma progression), coach (tableau de bord, Mes clients) ; aucun élément du CAPTCHA",
          db.cf.length === 0 && vus.every(v => v.endsWith(":undefined,false")), JSON.stringify({ cf: db.cf, vus })); }
      { /* « Me reconnecter » : la connexion de l'app complète a son widget, le jeton part */
        const db = base(); db.captcha = "1x";
        const { page } = await contexte(b, db, { qui: THOMAS, expire: Date.now() - 1000 });
        await page.goto(URL0 + "#/profil"); await pret(page);
        const avantCf = db.cf.length, r = db.bruts.refresh[0] || {};
        await page.evaluate(() => sessionPerdue()); await page.click("#session-perdue button"); await page.waitForSelector("#c-go");
        await attendreWidget(page);
        await remplirConnexion(page, THOMAS.email, MDP); await cliquerEtEntrer(page);
        const c = lireJ((db.bruts.token[0] || {}).brut) || {}, h = await page.evaluate(() => location.hash);
        ok("B : renouvellement de session sans CAPTCHA (CAPTCHA allumé dans Supabase : corps exactement {\"refresh_token\"}, accepté) ; « Me reconnecter » : le script se charge alors seulement, le jeton part avec la connexion, retour sur la page ouverte (Profil)",
          r.brut === JSON.stringify({ refresh_token: "renouvellement-" + THOMAS.id }) && avantCf === 0 && db.cf.length === 1 && c.gotrue_meta_security && c.gotrue_meta_security.captcha_token === DUMMY && h === "#/profil",
          JSON.stringify({ r, avantCf, cf: db.cf.length, brut: (db.bruts.token[0] || {}).brut, h })); }
    });
  });

  /* =================== C. 2x…AB (échoue) et 1x…BB (invisible, passe) =================== */
  await avecCle(TS.echoue, false, async () => {
    await bloc("C. clé 2x…AB", async () => {
      { const db = base();
        const page = await portailOuvert(b, db, "connexion");
        await page.waitForFunction(() => window.__ts && window.__ts.erreurs > 0);
        await remplirConnexion(page, INES.email, MDP);
        const t0 = Date.now(); await cliquerEtEntrer(page);
        const d = (db.bruts.token[0] || {}).t - t0;
        ok("C : widget en échec (error-callback), CAPTCHA éteint dans Supabase — la connexion part tout de suite sans jeton (corps exactement {\"email\",\"password\"}) et passe : le bouton n'est jamais bloqué",
          db.bruts.token.length === 1 && db.bruts.token[0].brut === JSON.stringify({ email: INES.email, password: MDP }) && d < 2000, JSON.stringify({ d, bruts: db.bruts.token })); }
      for (const [hash, langue] of [["connexion", "fr"], ["inscription", "en"]]) {
        const db = base(); db.captcha = "1x";
        const page = await portailOuvert(b, db, hash, { langue, neuf: hash === "inscription" });
        await page.waitForFunction(() => window.__ts && window.__ts.erreurs > 0);
        if (hash === "connexion") await remplirConnexion(page, INES.email, MDP); else await remplirInscription(page, "Léo", "leo-c@exemple.fr");
        await page.click("#c-go"); await attendreErr(page);
        const e = await etat(page), m = await email(page), n = db.bruts[hash === "connexion" ? "token" : "signup"];
        ok("C : widget en échec, CAPTCHA allumé dans Supabase (" + langue.toUpperCase() + ", " + hash + ") — envoyé quand même sans jeton, refusé : « " + avecE(TX[langue].echec, m).slice(0, 60) + "… », bouton actif, widget relancé (remise à zéro)",
          n.length === 1 && !(lireJ(n[0].brut) || {}).gotrue_meta_security && e.err === avecE(TX[langue].echec, m) && e.bouton.actif && e.T.resets === 1, JSON.stringify({ err: e.err, n: n.length, resets: e.T.resets }));
      }
    });
  });
  await avecCle(TS.passe, false, async () => {
    await bloc("C. navigateur non pris en charge", async () => {
      const vus = [];
      for (const [mode, langue] of [["off", "fr"], ["1x", "fr"], ["1x", "en"]]) {
        const db = base(); db.captcha = mode; db.ts.nonPris = true;
        const page = await portailOuvert(b, db, "connexion", { langue });
        await attendreEtat(page, "nonpris");
        await remplirConnexion(page, INES.email, MDP);
        const t0 = Date.now();
        if (mode === "off") { await cliquerEtEntrer(page); vus.push({ mode, d: (db.bruts.token[0] || {}).t - t0, brut: (db.bruts.token[0] || {}).brut, bon: (db.bruts.token[0] || {}).brut === JSON.stringify({ email: INES.email, password: MDP }) }); continue; }
        await page.click("#c-go"); await attendreErr(page);
        const e = await etat(page), m = await email(page);
        vus.push({ mode, langue, d: (db.bruts.token[0] || {}).t - t0, err: e.err, bon: e.err === avecE(langue === "en" ? "Your browser doesn't support the anti-bot check. Update it or open the app in another browser (Safari, Chrome). If it keeps happening, email your coach at {e}." : TX.fr.navigateur, m) && e.bouton.actif });
      }
      ok("C : navigateur non pris en charge (unsupported-callback) — envoi aussitôt sans jeton (aucune attente) ; CAPTCHA éteint dans Supabase : la connexion passe ; allumé : « " + TX.fr.navigateur.slice(0, 55) + "… » (FR, EN), bouton actif",
        vus.every(v => v.bon && v.d < 2000), JSON.stringify(vus));
    });
  });
  await avecCle(TS.passe_invisible, false, async () => {
    await bloc("C. clé 1x…BB", async () => {
      const db = base(); db.captcha = "1x"; db.inscription.id = PID(30);
      const page = await portailOuvert(b, db, "inscription", { neuf: true });
      await attendreWidget(page); await remplirInscription(page, "Inès", "ines-c@exemple.fr");
      await cliquerEtEntrer(page);
      const c = lireJ((db.bruts.signup[0] || {}).brut) || {};
      ok("C : clé invisible 1x…BB — le jeton part avec la création de compte, compte créé", c.gotrue_meta_security && c.gotrue_meta_security.captcha_token === DUMMY && db.inscriptions.length === 1, (db.bruts.signup[0] || {}).brut);
    });
  });

  /* =================== D. 3x…FF : défi interactif =================== */
  await avecCle(TS.interactif, false, async () => {
    await bloc("D. clé 3x…FF", async () => {
      const db = base(); db.captcha = "1x";
      const page = await portailOuvert(b, db, "connexion");
      await page.waitForSelector("#faux-ts-case");
      await remplirConnexion(page, INES.email, MDP);
      const t0 = Date.now(); await page.click("#c-go");
      await attendre(page, 1000);
      const pendant = await etat(page);
      await attendreErr(page);
      const d = (db.bruts.token[0] || {}).t - t0, e = await etat(page), m = await email(page);
      ok("D : défi pas fait au clic — bouton « Un instant… » pendant l'envoi, la requête part après 4 s (pas avant, pas bien après) sans jeton ; refusée : « " + TX.fr.attente.slice(0, 50) + "… », bouton actif ; widget PAS remis à zéro (aucun jeton n'est parti : la vérification continue, le défi reste à l'écran)",
        pendant.bouton && !pendant.bouton.actif && db.bruts.token.length === 1 && d >= 3800 && d < 6500 && !(lireJ(db.bruts.token[0].brut) || {}).gotrue_meta_security
          && e.err === avecE(TX.fr.attente, m) && e.bouton.actif && e.bouton.texte === "Se connecter" && e.T.resets === 0 && (await page.evaluate(() => !!document.getElementById("faux-ts-case"))),
        JSON.stringify({ d, pendant: pendant.bouton, err: e.err, resets: e.T.resets }));
      await page.waitForSelector("#faux-ts-case");
      const t1 = Date.now(); await page.click("#c-go"); await attendre(page, 800);
      await Promise.all([page.waitForNavigation({ timeout: 15000 }).catch(() => {}), page.click("#faux-ts-case")]); await pret(page);
      const d2 = (db.bruts.token[1] || {}).t - t1, c = lireJ((db.bruts.token[1] || {}).brut) || {};
      ok("D : défi fait PENDANT l'attente — la requête part dès le jeton reçu (avant les 4 s), avec lui ; connexion réussie",
        db.bruts.token.length === 2 && c.gotrue_meta_security && c.gotrue_meta_security.captcha_token === DUMMY && d2 < 3500, JSON.stringify({ d2, brut: (db.bruts.token[1] || {}).brut }));
      { /* écran quitté pendant l'attente du jeton : l'envoi de l'écran quitté ne part pas (ni message ni remise à zéro sur le nouveau) */
        const db2 = base(); db2.captcha = "1x";
        const vus = [];
        for (const [de, vers, sel] of [["connexion", "inscription", "#c-prenom"], ["inscription", "connexion", "#c-rester"]]) {
          const p = await portailOuvert(b, db2, de, { neuf: de === "inscription" });
          await p.waitForSelector("#faux-ts-case");
          if (de === "connexion") await remplirConnexion(p, INES.email, MDP); else await remplirInscription(p, "Léa", "lea-d@exemple.fr");
          const n0 = db2.bruts.token.length + db2.bruts.signup.length;
          await p.click("#c-go"); await attendre(p, 800);
          await p.click('[data-mode="' + vers + '"]'); await p.waitForSelector(sel); await attendre(p, 4600);
          const e2 = await etat(p);
          vus.push({ de, envoyes: db2.bruts.token.length + db2.bruts.signup.length - n0, err: e2.err, resets: e2.T.resets, removes: e2.T.removes, widgets: e2.widgets,
            defi: await p.evaluate(() => !!document.getElementById("faux-ts-case")), bouton: e2.bouton });
        }
        ok("D : écran quitté pendant l'attente du jeton (clic, puis « Créer mon compte » ou « Se connecter » dans les 4 s) — rien n'est envoyé, aucun message sur le nouvel écran, son widget tout neuf n'est pas remis à zéro (défi intact), bouton actif",
          vus.every(v => v.envoyes === 0 && v.err === "" && v.resets === 0 && v.removes === 1 && v.widgets === 1 && v.defi && v.bouton && v.bouton.actif), JSON.stringify(vus)); }
    });
  });

  /* =================== E. le script de Cloudflare injoignable ou muet =================== */
  await avecCle(TS.passe, false, async () => {
    await bloc("E. script injoignable", async () => {
      { const db = base(); db.ts.injoignable = true;
        const page = await portailOuvert(b, db, "connexion");
        await attendre(page, 600);
        const e0 = await etat(page);
        await remplirConnexion(page, INES.email, MDP);
        const t0 = Date.now(); await cliquerEtEntrer(page);
        const d = (db.bruts.token[0] || {}).t - t0;
        ok("E : script injoignable, CAPTCHA éteint dans Supabase — l'écran reste utilisable (bouton actif, aucune erreur), la connexion part aussitôt sans jeton (corps exact) et passe",
          db.cf.length >= 1 && e0.bouton.actif && e0.widgets === 0 && db.bruts.token.length === 1 && db.bruts.token[0].brut === JSON.stringify({ email: INES.email, password: MDP }) && d < 2000,
          JSON.stringify({ cf: db.cf.length, e0: e0.bouton, d, bruts: db.bruts.token })); }
      for (const [hash, langue] of [["connexion", "fr"], ["inscription", "en"]]) {
        const db = base(); db.ts.injoignable = true; db.captcha = "1x";
        const page = await portailOuvert(b, db, hash, { langue, neuf: hash === "inscription" });
        await attendre(page, 600);
        if (hash === "connexion") await remplirConnexion(page, INES.email, MDP); else await remplirInscription(page, "Léo", "leo-e@exemple.fr");
        await page.click("#c-go"); await attendreErr(page);
        const e = await etat(page), m = await email(page);
        ok("E : script injoignable, CAPTCHA allumé dans Supabase (" + langue.toUpperCase() + ", " + hash + ") — « " + avecE(TX[langue].injoignable, m).slice(0, 60) + "… », bouton actif",
          e.err === avecE(TX[langue].injoignable, m) && e.bouton.actif && db.bruts[hash === "connexion" ? "token" : "signup"].length === 1, JSON.stringify({ err: e.err }));
      }
      { const db = base(); db.ts.muet = true;
        const page = await portailOuvert(b, db, "connexion");
        await remplirConnexion(page, INES.email, MDP);
        const t0 = Date.now(); await cliquerEtEntrer(page);
        const d = (db.bruts.token[0] || {}).t - t0;
        ok("E : script qui ne répond jamais (réseau figé), CAPTCHA éteint dans Supabase — la connexion part après 4 s sans jeton et passe (jamais bloquée)",
          db.bruts.token.length === 1 && db.bruts.token[0].brut === JSON.stringify({ email: INES.email, password: MDP }) && d >= 3800 && d < 6500, JSON.stringify({ d })); }
    });
  });

  /* =================== F. les erreurs de Supabase (jeton envoyé) =================== */
  await avecCle(TS.passe, false, async () => {
    await bloc("F. erreurs de Supabase", async () => {
      const CAS = [["3x", "refus", "timeout-or-duplicate"], ["2x", "refus", "invalid-input-response"], ["500", "indispo", "captcha verification process failed (500)"]];
      for (const [mode, cleTx, nom] of CAS) {
        const vus = [];
        for (const [hash, langue] of [["connexion", "fr"], ["inscription", "en"]]) {
          const db = base(); db.captcha = mode;
          const page = await portailOuvert(b, db, hash, { langue, neuf: hash === "inscription" });
          await attendreWidget(page);
          if (hash === "connexion") await remplirConnexion(page, INES.email, MDP); else await remplirInscription(page, "Léo", "leo-f@exemple.fr");
          await page.click("#c-go"); await attendreErr(page); await attendre(page, 200);
          const e = await etat(page), n = db.bruts[hash === "connexion" ? "token" : "signup"], m = await email(page);
          vus.push({ hash, langue, err: e.err, attendu: avecE(TX[langue][cleTx], m), actif: e.bouton.actif, resets: e.T.resets, jeton: !!(lireJ((n[0] || {}).brut) || {}).gotrue_meta_security });
        }
        ok("F : Supabase refuse le jeton (« " + nom + " ») — " + (cleTx === "indispo" ? "« " + TX.fr.indispo + " » (et non « Service momentanément indisponible »)" : "« " + TX.fr.refus.slice(0, 55) + "… »") + ", à la connexion (FR) et à la création de compte (EN) ; bouton actif, widget relancé",
          vus.every(v => v.err === v.attendu && v.actif && v.resets === 1 && v.jeton), JSON.stringify(vus));
      }
    });
  });
  await avecCle(TS.interactif, false, async () => {
    await bloc("F. Supabase ancien", async () => {
      const db = base(); db.captcha = "ancien";
      const page = await portailOuvert(b, db, "connexion");
      await page.waitForSelector("#faux-ts-case"); await remplirConnexion(page, INES.email, MDP);
      await page.click("#c-go"); await attendreErr(page);
      const e = await etat(page), m = await email(page);
      ok("F : version de Supabase d'avant la v2.189.0 (jeton absent → 500 « captcha verification process failed ») sans jeton — le message dit que la vérification n'est pas terminée, jamais « Service momentanément indisponible »",
        e.err === avecE(TX.fr.attente, m) && e.bouton.actif, JSON.stringify({ err: e.err }));
    });
  });

  /* =================== G. le coach qui crée un compte : rien ne change =================== */
  await avecCle(TS.passe, false, async () => {
    await bloc("G. creer-acces", async () => {
      const db = base(); db.captcha = "1x";
      const { page } = await contexte(b, db, { qui: COACH, viewport: LARGE });
      await page.goto(URL0 + "#/clients"); await pret(page); await page.waitForSelector("#n-creer");
      await page.fill("#n-prenom", "Nina"); await page.fill("#n-nom", "Démo"); await page.fill("#n-email", "nina@exemple.fr"); await page.fill("#n-mdp", "motdepasse83");
      await page.click("#n-creer"); await attendre(page, 1500);
      const f = db.fonctions[0] || {}, v = await page.evaluate(() => typeof window.turnstile + "," + !!document.querySelector(".co-captcha"));
      ok("G : CAPTCHA allumé (clé et Supabase) — le coach crée un compte (Mes clients) : un seul appel creer-acces, corps exactement {email, motdepasse, prenom, nom, role} (aucun jeton), avec la session du coach ; aucun script ni élément du CAPTCHA, aucune connexion /token",
        db.fonctions.length === 1 && f.brut === JSON.stringify({ email: "nina@exemple.fr", motdepasse: "motdepasse83", prenom: "Nina", nom: "Démo", role: "client" }) && f.auth === "Bearer jeton-" + COACH.id
          && db.cf.length === 0 && v === "undefined,false" && db.bruts.token.length === 0,
        JSON.stringify({ f, cf: db.cf, v, token: db.bruts.token.length }));
    });
  });

  /* =================== H. Profil : « Changer mon mot de passe » =================== */
  const changerMdp = async (page, actuel, nouveau) => { await page.fill("#mc-actuel", actuel); await page.fill("#mc-nouveau", nouveau); await page.fill("#mc-nouveau2", nouveau); await page.click("#mc-mdp"); };
  const msgMdp = page => page.waitForFunction(() => { const m = document.getElementById("mc-mdp-msg"), b = document.getElementById("mc-mdp"); return !!(m && m.textContent.trim() && m.textContent.trim() !== "Un instant…" && m.textContent.trim() !== "One moment…" && b && !b.disabled); }, null, { timeout: 12000 })
    .then(() => page.evaluate(() => document.getElementById("mc-mdp-msg").textContent.replace(/[  ]/g, " ").trim()));
  await bloc("H. Profil", async () => {
    await avecCle(TS.passe, false, async () => {
      for (const langue of ["fr", "en"]) {
        const db = base(); db.captcha = "1x";
        if (langue === "en") db.donnees.find(r => r.user_id === THOMAS.id && r.outil === "prefs").contenu.langue = "en";   // la langue du compte suit (sinon la page revient au français)
        const { page } = await contexte(b, db, { qui: THOMAS, langue });
        await page.goto(URL0 + "#/profil"); await pret(page); await page.waitForSelector("#mc-mdp");
        const zone = await page.evaluate(() => !!document.getElementById("mc-captcha"));
        await changerMdp(page, MDP, "nouveau-mdp-83");
        const msg = await msgMdp(page), m = await email(page);
        ok("H : profil: false (clé remplie, CAPTCHA allumé dans Supabase), " + langue.toUpperCase() + " — aucun widget ni script dans le Profil ; la vérification de l'ancien mot de passe est refusée : « " + avecE(TX[langue].profil, m).slice(0, 60) + "… » au lieu de « Ton mot de passe actuel n'est pas le bon. » ; corps exact {email, password}, rien d'autre envoyé",
          !zone && db.cf.length === 0 && msg === avecE(TX[langue].profil, m) && db.bruts.token.length === 1 && db.bruts.token[0].brut === JSON.stringify({ email: THOMAS.email, password: MDP }) && db.puts.length === 0,
          JSON.stringify({ zone, cf: db.cf, msg, bruts: db.bruts.token, puts: db.puts }));
      }
      { const db = base();
        const { page } = await contexte(b, db, { qui: THOMAS });
        await page.goto(URL0 + "#/profil"); await pret(page); await page.waitForSelector("#mc-mdp");
        await changerMdp(page, "pas-le-bon", "nouveau-mdp-83"); const m1 = await msgMdp(page);
        await attendre(page, 300);
        await changerMdp(page, MDP, "nouveau-mdp-83"); const m2 = await msgMdp(page);
        ok("H : profil: false, CAPTCHA éteint dans Supabase — comme avant : ancien mot de passe faux → « Ton mot de passe actuel n'est pas le bon. » ; bon → « Mot de passe changé… », corps exacts {email, password} puis PUT {password}",
          m1 === "Ton mot de passe actuel n'est pas le bon." && m2 === "Mot de passe changé. Utilise le nouveau à ta prochaine connexion." && db.bruts.token.length === 2
            && db.bruts.token[1].brut === JSON.stringify({ email: THOMAS.email, password: MDP }) && db.puts.length === 1 && db.puts[0].brut === JSON.stringify({ password: "nouveau-mdp-83" }) && db.cf.length === 0,
          JSON.stringify({ m1, m2, bruts: db.bruts.token.map(x => x.brut), puts: db.puts })); }
    });
    await avecCle(TS.passe, true, async () => {
      for (const vp of [LARGE, PETIT]) {
        const db = base(); db.captcha = "1x";
        const { page } = await contexte(b, db, { qui: THOMAS, viewport: vp });
        await page.goto(URL0 + "#/profil"); await pret(page); await page.waitForSelector("#mc-captcha"); await attendreWidget(page);
        const v = await page.evaluate(() => { const z = document.getElementById("mc-captcha"), bx = z && z.querySelector(".faux-ts"), r = bx && bx.getBoundingClientRect();
          return { zone: !!z, avant: !!(z && z.nextElementSibling && z.nextElementSibling.querySelector("#mc-mdp")), larg: z ? z.clientWidth : 0, d: r ? Math.round(r.right) : 0,
            iw: window.innerWidth, sw: document.documentElement.scrollWidth, T: JSON.parse(JSON.stringify(window.__ts || null)) }; });
        const o = (v.T && v.T.rendus[0] || {}).opts || {};
        await changerMdp(page, MDP, "nouveau-mdp-83"); const msg = await msgMdp(page); await attendre(page, 200);
        const T2 = await page.evaluate(() => JSON.parse(JSON.stringify(window.__ts)));
        const c = lireJ((db.bruts.token[0] || {}).brut) || {};
        ok("H : profil: true (" + vp.width + " px) — le widget dans « Changer mon mot de passe », juste avant le bouton (action « profil », taille " + (vp.width < 400 ? "compact" : "normal") + ", rien ne déborde) ; le jeton part avec la vérification de l'ancien mot de passe, puis PUT {password} ; « Mot de passe changé… » ; widget remis à zéro pour le changement suivant",
          v.zone && v.avant && db.cf.length === 1 && o.action === "profil" && o.size === (vp.width < 400 ? "compact" : "normal") && v.d <= v.iw && v.sw <= v.iw
            && JSON.stringify(cles(db.bruts.token[0].brut)) === '["email","password","gotrue_meta_security"]' && c.gotrue_meta_security.captcha_token === DUMMY
            && db.puts.length === 1 && db.puts[0].brut === JSON.stringify({ password: "nouveau-mdp-83" }) && msg === "Mot de passe changé. Utilise le nouveau à ta prochaine connexion." && T2.resets === 1,
          JSON.stringify({ v: Object.assign({}, v, { T: undefined }), o, msg, brut: (db.bruts.token[0] || {}).brut, resets: T2.resets }));
        if (vp === LARGE) {
          await page.evaluate(() => { location.hash = "#/accueil"; }); await attendre(page, 1800);
          const q = await page.evaluate(() => ({ removes: window.__ts.removes, id: Captcha.id, w: document.querySelectorAll(".faux-ts").length }));
          ok("H : profil: true — quitter le Profil (autre page) retire le widget (turnstile.remove)", q.removes === 1 && q.id === null && q.w === 0, JSON.stringify(q));
        }
      }
    });
    await avecCle("", true, async () => {
      const db = base();
      const { page } = await contexte(b, db, { qui: THOMAS });
      await page.goto(URL0 + "#/profil"); await pret(page); await page.waitForSelector("#mc-mdp"); await attendre(page, 400);
      const v = await page.evaluate(() => ({ zone: !!document.getElementById("mc-captcha"), ts: typeof window.turnstile }));
      ok("H : profil: true mais clé vide — rien (ni widget, ni script) : la clé reste l'interrupteur", !v.zone && v.ts === "undefined" && db.cf.length === 0, JSON.stringify({ v, cf: db.cf }));
    });
  });

  /* =================== I. 320 px (et 390 px, ordinateur) =================== */
  await avecCle(TS.passe, false, async () => {
    await bloc("I. tailles", async () => {
      const vus = [];
      for (const [vp, hash, langue] of [[PETIT, "connexion", "fr"], [PETIT, "inscription", "fr"], [PETIT, "inscription", "en"], [MOBILE, "inscription", "fr"], [LARGE, "connexion", "fr"]]) {
        const page = await portailOuvert(b, base(), hash, { viewport: vp, langue, neuf: hash === "inscription" });
        await attendreWidget(page); await attendre(page, 150);
        const e = await etat(page), o = ((e.T && e.T.rendus[0]) || {}).opts || {};
        vus.push({ l: vp.width, hash, langue, size: o.size, taille: e.taille, classes: e.classes, h: e.h, larg: e.larg, boite: e.boite, sw: e.sw, iw: e.iw });
      }
      const bon = v => (v.l === 320 ? v.size === "compact" && v.taille === "compact" && /\bcompact\b/.test(v.classes) && v.h === 147 && v.larg < 300
        : v.size === "normal" && v.taille === "normal" && !/\bcompact\b/.test(v.classes) && v.h === 72 && v.larg >= 300) && !!v.boite && v.boite.g >= 0 && v.boite.d <= v.iw && v.sw <= v.iw;
      ok("I : 320 px — widget « compact » (150 × 147, moins de 300 px utiles), place réservée exactement à sa taille, rien ne déborde (connexion, création de compte FR et EN) ; 390 px et ordinateur : « normal » (300 × 72)",
        vus.every(bon), JSON.stringify(vus.filter(v => !bon(v))));
      { /* réglages de production (téléphone obligatoire) : le bouton reste là où il est avec la clé vide (widget dessous),
           visible sans défiler — l'exigence de la v76 (tâche 1) : « Créer mon espace gratuit » visible en 390 × 844 */
        const pli = [];
        tel = true;
        try {
          for (const [vp, hash, langue] of [[MOBILE, "inscription", "fr"], [MOBILE, "inscription", "en"], [{ width: 320, height: 568 }, "connexion", "fr"], [MOBILE, "connexion", "en"]]) {
            const mesure = async () => {
              const p = await portailOuvert(b, base(), hash, { viewport: vp, langue, neuf: hash === "inscription" });
              if (cle) await attendreWidget(p);
              await attendre(p, 200);
              return p.evaluate(() => { const r = document.getElementById("c-go").getBoundingClientRect(); return { haut: Math.round(r.top), bas: Math.round(r.bottom), tel: !!document.getElementById("c-tel"), sy: Math.round(scrollY) }; });
            };
            let sans = null; await avecCle("", false, async () => { sans = await mesure(); });
            const avec = await mesure();
            pli.push({ l: vp.width, h: vp.height, hash, langue, sans, avec });
          }
        } finally { tel = false; }
        const bonPli = v => v.avec.haut === v.sans.haut && v.avec.bas <= v.h && v.avec.sy === 0 && (v.hash !== "inscription" || (v.avec.tel && v.sans.tel));
        ok("I : clé remplie, réglages de production (téléphone obligatoire) — le bouton reste exactement à sa place (widget dessous) et visible sans défiler : création de compte en 390 × 844 (FR, EN), connexion en 320 × 568 (FR) et 390 × 844 (EN)",
          pli.every(bonPli), JSON.stringify(pli)); }
    });
  });

  /* =================== R. hors banc : le VRAI script de Cloudflare (VERIF83_RESEAU=1) =================== */
  if (RESEAU) await avecCle(TS.passe, false, async () => {
    await bloc("R. vrai Turnstile", async () => {
      let v320 = null;
      { /* 320 px : la taille réelle du widget compact */
        const db = base(); db.ts.reel = true;
        const page = await portailOuvert(b, db, "connexion", { viewport: PETIT });
        try { await page.waitForFunction(() => typeof Captcha !== "undefined" && !!Captcha.jeton(), null, { timeout: 20000 }); } catch (e) {}
        await attendre(page, 500);
        v320 = await page.evaluate(() => { const z = document.getElementById("co-captcha"), r = z && z.getBoundingClientRect(), c = z && z.firstElementChild, q = c && c.getBoundingClientRect();
          return { etat: Captcha.etat, zone: r ? [Math.round(r.width), Math.round(r.height)] : null, widget: q ? [Math.round(q.width), Math.round(q.height)] : null, sw: document.documentElement.scrollWidth, iw: window.innerWidth }; });
        console.log("R 320 px : " + JSON.stringify(v320));
      }
      const db = base(); db.ts.reel = true; db.inscription.id = PID(40);
      const page = await portailOuvert(b, db, "inscription", { neuf: true });
      let jeton = "";
      try { await page.waitForFunction(() => typeof Captcha !== "undefined" && !!Captcha.jeton(), null, { timeout: 20000 }); jeton = await page.evaluate(() => Captcha.jeton()); } catch (e) {}
      const info = await page.evaluate(() => { const z = document.getElementById("co-captcha"), r = z && z.getBoundingClientRect();
        return { etat: Captcha.etat, id: Captcha.id, ts: typeof window.turnstile, enfants: z ? z.children.length : 0, h: r ? Math.round(r.height) : 0,
          iframe: !!(z && (z.querySelector("iframe") || Array.from(z.querySelectorAll("*")).some(x => x.shadowRoot))),
          enfant: z && z.firstElementChild ? (c => { const q = c.getBoundingClientRect(), st = getComputedStyle(c); return { tag: c.tagName, l: Math.round(q.width), h: Math.round(q.height), display: st.display, marge: st.margin, html: c.outerHTML.slice(0, 300) }; })(z.firstElementChild) : null }; });
      console.log("R : " + JSON.stringify({ jeton, info, hotes: Array.from(new Set(db.cf.map(u => new URL(u).hostname))), requetes: db.cf.length }));
      await remplirInscription(page, "Réa", "rea@exemple.fr");
      await cliquerEtEntrer(page).catch(() => {});
      const c = lireJ((db.bruts.signup[0] || {}).brut) || {};
      ok("R (hors banc, réseau) : le vrai api.js de Cloudflare avec la clé de test 1x00000000000000000000AA sur localhost — widget réel rendu, jeton « " + DUMMY + " » obtenu et envoyé dans gotrue_meta_security.captcha_token de /signup ; il tient dans la place réservée (390 px : 72 px de haut ; 320 px : compact, 147 px, rien ne déborde)",
        jeton === DUMMY && !!c.gotrue_meta_security && c.gotrue_meta_security.captcha_token === DUMMY && info.h === 72 && !!v320 && v320.etat === "pret" && !!v320.zone && v320.zone[1] === 147 && v320.sw <= v320.iw,
        JSON.stringify({ jeton, info, cf: db.cf.slice(0, 6), brut: (db.bruts.signup[0] || {}).brut }));
    });
  });

  /* =================== AV. hors banc : comparaison avec la version d'avant (VERIF83_AVANT) =================== */
  if (AVANT) await bloc("AV. version d'avant", async () => {
    const PORT2 = PORT + 2, srv2 = serveur(AVANT);
    await new Promise((r, k) => { srv2.once("error", k); srv2.listen(PORT2, r); });
    const URL2 = `http://localhost:${PORT2}/`;
    try {
      const sansVersion = h => String(h).replace(/<p class="co-aide">v[^<]*<\/p>/g, "<p class=\"co-aide\">v…</p>");
      const ecrans = [];
      for (const [hash, langue] of [["connexion", "fr"], ["inscription", "fr"], ["inscription", "en"], ["connexion", "en"]]) {
        const p1 = await portailOuvert(b, base(), hash, { langue }); await attendre(p1, 400);
        const p2 = await portailOuvert(b, base(), hash, { langue, url0: URL2 }); await attendre(p2, 400);
        const a = sansVersion(await carte(p1)), v = sansVersion(await carte(p2));
        ecrans.push({ hash, langue, egal: a === v && a.length > 500, n: [a.length, v.length] });
      }
      ok("AV (hors banc) : clé vide — connexion et création de compte (FR, EN) : la carte est au caractère près celle de la version d'avant (" + AVANT + "), numéro de version mis à part",
        ecrans.every(x => x.egal), JSON.stringify(ecrans));
      const corps = [];
      for (const url0 of [URL0, URL2]) {
        const db = base(); db.inscription.id = PID(50);
        const p = await portailOuvert(b, db, "connexion", { url0 });
        await remplirConnexion(p, INES.email, "mauvais"); await p.click("#c-go"); await attendreErr(p);
        const q = await portailOuvert(b, db, "inscription", { url0, neuf: true });
        await remplirInscription(q, "Zoé", "zoe-av@exemple.fr"); await cliquerEtEntrer(q);
        corps.push({ token: (db.bruts.token[0] || {}).brut, signup: String((db.bruts.signup[0] || {}).brut || "").replace(/"\d{4}-\d\d-\d\dT[\d:.]+Z"/g, "\"<date>\""), msg: (await etat(p)).err });
      }
      ok("AV (hors banc) : clé vide — corps de /token et de /signup au caractère près ceux de la version d'avant (dates mises à part), même message d'erreur",
        corps[0].token === corps[1].token && corps[0].signup === corps[1].signup && corps[0].msg === corps[1].msg && !!corps[0].token && !!corps[0].signup, JSON.stringify(corps));
    } finally { srv2.close(); }
  });

  ok("hôtes externes : rien d'autre que localhost, supabase.co et challenges.cloudflare.com n'a été demandé", externes.size === 0, Array.from(externes).join(", "));
  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
