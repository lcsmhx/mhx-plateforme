/* v78 (tâche 2) — le navigateur d'Instagram, de TikTok ou de Facebook / Messenger (Integre, js/installation.js).
   Un compte créé dans ces navigateurs y reste coincé (leur mémoire est séparée de Safari et de Chrome). Toute la suite sert
   l'inscription OUVERTE (forcerInscription) et l'interrupteur CONFIG.marque.navigateur_integre allumé (la valeur du fichier ;
   les autres suites tournent avec le user agent par défaut, jamais repéré), sauf le bloc A9 (éteint). Téléphone obligatoire
   éteint (servirFichier, comme les autres suites). User agents RÉELS (bases publiques user-agents.net, whatmyuseragent.com,
   tests d'inapp-spy, relevés 2025-2026), fixés par contexte (newContext({ userAgent })).
     A0  un seul réglage « navigateur_integre: true|false » (servi tel quel) ; les textes DECOUVERTE.integre et .en (mêmes clés,
         rien de vide, gras équilibré, jamais « Lucas », anglais traduit) ; titre et ligne de l'email mot pour mot ;
     A1  détection : Instagram, TikTok, Facebook / Messenger (anciens et nouveaux formats), iPhone et Android ; jamais Safari,
         Chrome (Android, iOS), Firefox, Samsung Internet, Edge, ordinateur, robot d'aperçu de Facebook, Snapchat, LinkedIn,
         WhatsApp, WebView quelconque ;
     A2  inscription dans Instagram (iPhone) comparée à la même dans Safari : même écran, mêmes requêtes, mêmes écritures, même
         nombre de chargements (jamais bloquée ni retardée) ; puis ?ouvrir=connexion dans l'adresse (Instagram seulement, sans
         email) ; drapeau de l'appareil sans rien de personnel ; ni carte ni bannière sur le questionnaire ;
     A3  la carte « Dernière étape » : jamais sur la page « Ton plan d'action », puis sur l'accueil (sous l'en-tête, avant
         l'étape), textes, email, 5 étapes iPhone ; ni bannière ni invitation ; mêmes écritures que dans Safari ; invitation en
         attente : cachée par la carte, remontrée après « Plus tard » ;
     A4  « Plus tard » : la carte part (mémoire de l'appareil), aucune écriture, ni bannière dans cette visite ; nouvelle visite :
         pas de carte, la bannière avec les étapes d'Instagram ; stockage plein (écriture refusée) : « Plus tard » tient quand
         même pendant la visite ;
     A5  Android (Instagram, TikTok long et court, Facebook FB_IAB et MetaIAB) : le lien intent:// exact vers Chrome (jamais
         suivi : schéma inconnu ; ni ?ref=, ni fbclid, ni utm_), quoi faire s'il n'ouvre rien, les étapes dans Chrome ; iPhone
         (TikTok long et court, Facebook FBAN et MetaIAB) : la 1re étape de chaque app ;
     A6  adresse : ?ouvrir=connexion sur un appareil neuf → connexion (#/connexion), même dans Safari ou Chrome ; connexion →
         paramètre retiré, accueil, bannière normale dès cette visite, en haut de la page, avec la suite des étapes de la carte
         (Safari, Chrome Android) ; témoins ; avec une session : ignoré dans Safari, posé dans Instagram pour le compte inscrit
         là (ancre gardée ; ancre d'inscription retirée), jamais pour un client sans drapeau ni pour le coach, jamais dans
         Chrome iOS ;
     A7  bannière dans ces navigateurs (client) : étapes de l'app, « Je suis sur Android » (bouton Chrome), « C'est fait »,
         « Plus tard » ; Facebook Android, Messenger iPhone ;
     A8  anglais (carte, carte Android, bannière) ;
     A9  interrupteur éteint : tout comme avant (aucun paramètre, aucun drapeau, aucune carte, bannière de Safari, ?ouvrir=
         connexion ignoré) ;
     A10 Safari iPhone, Chrome Android, Chrome iOS, ordinateur : écran d'inscription et accueil (bannière comprise) identiques
         interrupteur allumé ou éteint, jamais de paramètre ni de drapeau ;
     A11 client, coach, page du plan d'action : jamais de carte ; email piégé échappé ; 320 × 568 : « Plus tard » écrit en
         toutes lettres en haut de la carte, visible sans défiler, puis plus de carte.
   Supabase simulé (gabarit de verif80) : rien ne part vers la vraie base (routage par NOM D'HÔTE) ; chaque écriture est
   notée. Comptes fictifs (@exemple.fr). Le lien intent:// n'est jamais touché (Chromium : erreur console « schéme inconnu »).
   Chaque bloc tourne à part (« ✗ BLOC INTERROMPU ») ; code de sortie 1 dès qu'un ✗ apparaît.
   Usage : node verif82.js ../index.html
           VERIF82_PORT=9981 node verif82.js ../index.html     (autre port, si 9980 est pris)
           VERIF82_BLOCS="A1,A5" node verif82.js …              (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path"); const vm = require("vm");
const F = require("./fixtures");
const FT = require("./fichiers");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF82_PORT || 9980;
const BLOCS = (process.env.VERIF82_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const MOBILE = { width: 390, height: 844 }, PETIT = { width: 320, height: 568 }, LARGE = { width: 1280, height: 900 };

/* ---------- la page servie : inscription ouverte, textes légaux de test, interrupteur allumé (valeur du fichier) ou éteint ---------- */
let integre = null;   // null : la valeur du fichier ; true / false : forcée (bloc A9, A10)
const retouche = h => { const t = FT.forcerLegaux(FT.forcerInscription(h, true)); return integre === null ? t : t.replace(/navigateur_integre: (true|false)/, "navigateur_integre: " + integre); };
const server = http.createServer((req, res) => {
  if (FT.servirFichier(req, res, HTML, retouche)) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(retouche(fs.readFileSync(HTML, "utf8")));
});
async function avecInterrupteur(v, fn){ const a = integre; integre = v; try { await fn(); } finally { integre = a; } }

/* ---------- résultats ---------- */
const res = [];
const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + String(d || "").replace(/✓/g, "v").slice(0, 1500)));
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
const T0 = Date.now(), H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const norm = t => String(t == null ? "" : t).replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const isoPres = (x, t) => typeof x === "string" && !isNaN(Date.parse(x)) && new Date(x).toISOString() === x && Math.abs(Date.parse(x) - t) < 30000;
const trie = l => l.slice().sort();
const egal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ---------- les user agents (réels) ---------- */
const UA = {
  /* repérés */
  ig_ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/23G90 Instagram 450.1.0.35.61 (iPhone14,5; iOS 26_6_2; ja_JP; ja; scale=3.00; 1170x2532; IABMV/1; 1084815185) Safari/604.1",
  ig_ios_18: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22B91 Instagram 361.0.0.35.82 (iPhone16,2; iOS 18_1_1; pt_BR; pt; scale=3.00; 1290x2796; 674117118; IABMV/1)",
  ig_and: "Mozilla/5.0 (Linux; Android 17; Pixel 9a Build/CP3A.260905.009; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/155.0.8059.32 Mobile Safari/537.36 Instagram 450.0.0.50.77 Android (37/17; 420dpi; 1080x2424; Google/google; Pixel 9a; tegu; tegu; fr_CA; 1084453874; IABMV/1)",
  tt_ios_long: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_33.3.0 JsSdk/2.0 NetType/2G Channel/App Store ByteLocale/en Region/US isDarkMode/0 WKWebView/1 RevealType/Dialog BytedanceWebview/d8a21c6 FalconTag/E71E1572-8CC2-4B67-97F3-01C1B57FD02F",
  tt_ios_court: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1 musical_ly_41.9.0",
  tt_ios_trill: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari/604.1 trill_46.9.0",
  tt_and_long: "Mozilla/5.0 (Linux; Android 15; moto g - 2025 Build/V1VK35.22-19-2-4-1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/127.0.6533.103 Mobile Safari/537.36 musical_ly_2024001040 JsSdk/1.0 NetType/WIFI Channel/googleplay AppName/musical_ly app_version/40.1.4 ByteLocale/en ByteFullLocale/en Region/US AppId/1233 Spark/1.7.2 AppVersion/40.1.4 PIA/2.5.3 BytedanceWebview/d8a21c6",
  tt_and_court: "Mozilla/5.0 (Linux; Android 14; SM-A546B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/153.0.8010.36 Mobile Safari/537.36 musical_ly_2024701040 AppName/musical_ly ByteLocale/en",
  fb_ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22G100 [FBAN/FBIOS;FBAV/527.0.0.42.97;FBBV/780115200;FBDV/iPhone16,1;FBMD/iPhone;FBSN/iOS;FBSV/18.6.2;FBSS/3;FBID/phone;FBLC/it_IT;FBOP/5;FBRV/782854979;IABMV/1]",
  fb_and: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A.240905.003; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.83 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/488.0.0.62.79;IABMV/1;]",
  meta_ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/23D8133 Safari/604.1 MetaIAB Facebook",
  meta_and: "Mozilla/5.0 (Linux; Android 11; SM-A705FN Build/RP1A.200720.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/144.0.7559.94 Mobile Safari/537.36 IABMV/1 MetaIAB Facebook",
  msg_ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/458.0.0.38.108;FBBV/586735040;FBDV/iPhone14,2;FBMD/iPhone;FBSN/iOS;FBSV/17.5;FBSS/3;FBID/phone;FBLC/fr_FR;FBOP/5]",
  msg_and: "Mozilla/5.0 (Linux; Android 13; SM-G991B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.230 Mobile Safari/537.36 [FB_IAB/Orca-Android;FBAV/440.0.0.31.105;]",
  /* témoins : jamais repérés */
  safari_ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1",
  chrome_and: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36",
  chrome_ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/135.0.7049.83 Mobile/15E148 Safari/604.1",
  firefox_ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/140.0 Mobile/15E148 Safari/605.1.15",
  samsung: "Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36",
  edge_and: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 EdgA/141.0.0.0",
  mac_chrome: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  mac_safari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15",
  win_edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
  robot_fb: "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  snapchat: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Snapchat/13.10.0.40 (like Safari/8618.2.12.10.4, panda)",
  linkedin: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [LinkedInApp]/9.30.1",
  whatsapp: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A.240905.003; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.83 Mobile Safari/537.36 WA4A/2.25.1.75",
  webview: "Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ3A.230805.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.230 Mobile Safari/537.36"
};
const REPERES = [["ig_ios", "instagram", "ios", "Instagram"], ["ig_ios_18", "instagram", "ios", "Instagram"], ["ig_and", "instagram", "android", "Instagram"],
  ["tt_ios_long", "tiktok", "ios", "TikTok"], ["tt_ios_court", "tiktok", "ios", "TikTok"], ["tt_ios_trill", "tiktok", "ios", "TikTok"],
  ["tt_and_long", "tiktok", "android", "TikTok"], ["tt_and_court", "tiktok", "android", "TikTok"],
  ["fb_ios", "facebook", "ios", "Facebook"], ["fb_and", "facebook", "android", "Facebook"], ["meta_ios", "facebook", "ios", "Facebook"], ["meta_and", "facebook", "android", "Facebook"],
  ["msg_ios", "facebook", "ios", "Messenger"], ["msg_and", "facebook", "android", "Messenger"]];
const TEMOINS = ["safari_ios", "chrome_and", "chrome_ios", "firefox_ios", "samsung", "edge_and", "mac_chrome", "mac_safari", "win_edge", "robot_fb", "snapchat", "linkedin", "whatsapp", "webview"];

/* ---------- les personnes ---------- */
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: meta } : {}) });
const PID = k => "00000000-0000-4000-8000-0000000082" + String(k).padStart(2, "0");   // verif82 : …82kk
const COACH = { id: F.IDS.coach, email: "coach@exemple.fr" }, THOMAS = { id: F.IDS.c1, email: "thomas@exemple.fr" };
const NOAH = { id: PID(2), email: "noah@exemple.fr" };
const INTAKE_FAIT = () => ({ court_debut: avant(2 * J), court_le: avant(2 * J), probleme: "Perdre du gras", obstacle: "Le manque de temps",
  projection: "Avoir plus d'énergie", bilan_propose: { choix: "plus_tard", le: avant(2 * J) } });

/* ---------- le décor : fixtures.js (coach, clients) + un prospect qui a fait son questionnaire et passé la page du plan d'action ---------- */
function base(extra, prospects){
  const profils = clone(F.profils); profils.forEach(p => { p.statut = "client"; });
  profils.push({ id: NOAH.id, prenom: "Noah", nom: "", role: "client", statut: "prospect", cree_le: avant(2 * J) });
  (prospects || []).forEach(p => profils.push({ id: p.id, prenom: p.prenom || "", nom: "", role: "client", statut: "prospect", cree_le: avant(J) }));
  const donnees = clone(F.donnees).concat([
    { user_id: NOAH.id, outil: "intake", contenu: INTAKE_FAIT(), maj_le: avant(2 * J) }
  ], (prospects || []).map(p => ({ user_id: p.id, outil: "intake", contenu: INTAKE_FAIT(), maj_le: avant(J) })), extra || []);
  return { profils, donnees, ecritures: [], lectures: [], chemins: [], inscriptions: [], emails: {}, meta: {}, inscription: {}, ko: {}, perdre: {} };
}

/* ---------- le faux Supabase (gabarit de verif80) ---------- */
const MAX_LIGNES = 1000;
const ILLISIBLES_PROPRIO = ["notes_coach", "suivi_prospect"];
const INTERDITES_PROPRIO = ["feedbacks", "notes_coach", "suivi_prospect"];
const ECRITES_PAR_COACH = ["programme", "repas", "calc", "complements", "hist_programme", "hist_repas", "feedbacks", "notes_coach", "suivi_prospect"];
const permis = (moi, coach, row) => !!moi && (row.user_id === moi ? (coach || !INTERDITES_PROPRIO.includes(row.outil)) : (coach && ECRITES_PAR_COACH.includes(row.outil)));
const externes = new Set();
function ordonner(l, order){
  const cles = String(order || "").split(",").filter(Boolean).map(x => { const [k, sens] = x.split("."); return { k, desc: sens === "desc" }; });
  if (!cles.length) return l;
  const v = (x, k) => (x && typeof x === "object" && x[k] != null) ? String(x[k]) : "";
  return l.slice().sort((a, b) => { for (const { k, desc } of cles) { const x = v(a, k), y = v(b, k); if (x !== y) return (x < y ? -1 : 1) * (desc ? -1 : 1); } return 0; });
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
async function repondre(r, db){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue();
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort(); }
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req);
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  db.chemins.push(m + " " + p + (p === "/rest/v1/donnees" && m === "GET" ? " " + (q.get("outil") || "") : ""));
  if (p.startsWith("/auth/v1/signup")) {   // déclencheur creer_profil : un profil prospect ; la session porte data en user_metadata
    const c = corps() || {}, data = c.data || {}; db.inscriptions.push(clone(c));
    const id = db.inscription.id || PID(99); db.emails[id] = c.email; db.meta[id] = clone(data);
    db.profils.push({ id, prenom: data.prenom || "", nom: data.nom || "", role: "client", statut: "prospect", cree_le: new Date().toISOString() });
    return json(session(id, c.email, data));
  }
  if (p.startsWith("/auth/v1/token")) {
    const c = corps() || {}, r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || ""));
    if (c.email && c.password){ const idm = Object.keys(db.emails).find(k => db.emails[k] === c.email); return idm ? json(session(idm, c.email, db.meta[idm])) : json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400); }   // connexion par mot de passe
    const id = r1 && r1[1];
    if (!id) return json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
    return json(session(id, db.emails[id] || "", db.meta[id]));
  }
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  if (p.startsWith("/auth/v1/logout")) return json(null, 204);
  if (p.startsWith("/auth/v1/user")) return moi ? json(Object.assign({ id: moi, email: db.emails[moi] || "", role: "authenticated" }, db.meta[moi] ? { user_metadata: clone(db.meta[moi]) } : {})) : json({ msg: "invalid JWT" }, 401);
  if (p.startsWith("/auth/v1/")) return json({});
  if (!["GET", "HEAD"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m, corps: corps() });
  if (p.startsWith("/functions/v1/")) return json({ ok: true });
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/connexions") return json([]);
  if (p === "/rest/v1/profils") {
    const id = (q.get("id") || "").replace(/^eq\./, "");
    if (m === "GET" || m === "HEAD") { let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(colonnes(plage(l), q)); }
    db.ecritures.push({ table: "profils", m, id, corps: corps() });
    return json([]);
  }
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "", mj = q.get("maj_le");
    const cleEq = o.startsWith("eq.") ? o.slice(3) : null;
    if (m === "GET" || m === "HEAD") {
      db.lectures.push({ par: moi, uid, outil: o, select: q.get("select") || "*" });
      if (cleEq && db.ko[cleEq]) return json({ message: "panne simulée" }, 500);
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
   opts : ua (user agent ; absent = celui de Playwright), viewport (MOBILE par défaut), langue ("en"), qui (compte connecté :
   { id, email }), stockage ({ clé: valeur }), neuf (appareil sans aucune trace : ni mhx_installe ni mhx_visites) */
async function contexte(b, db, opts){
  opts = opts || {};
  const c = await b.newContext(Object.assign({ viewport: opts.viewport || MOBILE }, opts.ua ? { userAgent: opts.ua } : {}));
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  await c.route("**/*", r => repondre(r, db));
  if (opts.qui) db.emails[opts.qui.id] = opts.qui.email;
  await c.addInitScript(({ langue, s, stockage, neuf }) => {
    if (!/^https?:$/.test(location.protocol)) return;
    if (!localStorage.getItem("__init")) {   // l'appareil n'est préparé qu'une fois : un rechargement le garde
      localStorage.setItem("__init", "1");
      if (!neuf){ localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3"); }
      if (langue) localStorage.setItem("mhx_langue", langue);
      if (s) localStorage.setItem("mhx_session", JSON.stringify(s));
      Object.keys(stockage || {}).forEach(k => localStorage.setItem(k, stockage[k]));
    }
  }, { langue: opts.langue || "", s: opts.qui ? session(opts.qui.id, opts.qui.email) : null, stockage: opts.stockage || null, neuf: !!opts.neuf });
  const page = await nouvellePage(c);
  return { c, page };
}
async function nouvellePage(c){
  const page = await c.newPage();
  page.__charges = 0; page.on("load", () => { page.__charges++; });
  page.on("pageerror", e => res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)));
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|status of [45]\d\d/.test(msg.text())) res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); });
  page.on("dialog", d => { res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return page;
}
const attendre = (page, ms) => page.waitForTimeout(ms);
const pret = async page => { await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 }); await attendre(page, 400); };
/* les écritures en base, hors compteur de visites du prospect (clé activite : au plus une fois par minute, comme avant) */
const saisies = db => db.ecritures.filter(e => !(e.table === "donnees" && e.outil === "activite"));
const resume = db => saisies(db).map(e => (e.table === "donnees" ? e.outil : e.table) + ":" + e.m);
const sorte = db => [...new Set(resume(db))].sort();
const flag = (app, sys, ferme) => JSON.stringify({ app, sys, inscrit: avant(H), ferme: ferme || "" });
const CLEF = uid => "mhx_integre|" + uid;
const drapeaux = page => page.evaluate(() => Object.keys(localStorage).filter(k => k.indexOf("mhx_integre") === 0).map(k => [k, localStorage.getItem(k)]));
const adresse = page => page.evaluate(() => ({ search: location.search, hash: location.hash }));
const portailVu = page => page.evaluate(() => ({ h2: ((document.querySelector(".carte-co h2") || {}).textContent || "").trim(), prenom: !!document.getElementById("c-prenom"), hash: location.hash, search: location.search }));
const INSC = "Crée ton espace gratuit", CONN = "Connexion à ton espace";
/* la carte « Dernière étape », lue telle qu'affichée */
const carte = page => page.evaluate(() => {
  const c = document.getElementById("integre-carte"); if (!c) return null;
  const n = s => String(s == null ? "" : s).replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
  const a = c.querySelector("[data-integre-chrome]"), x = c.querySelector("#integre-fermer"), t = c.querySelector("#integre-plus-tard");
  return { avant: c.previousElementSibling ? c.previousElementSibling.tagName + "." + c.previousElementSibling.className : "", apres: c.nextElementSibling ? c.nextElementSibling.id : "",
    titre: n((c.querySelector("h2") || {}).textContent), ids: n((c.querySelector("#integre-ids") || {}).textContent), idsB: n((c.querySelector("#integre-ids b") || {}).textContent),
    li: [...c.querySelectorAll("li")].map(l => n(l.textContent)), gras: [...c.querySelectorAll("li")].map(l => l.querySelectorAll("b").length),
    tard: t ? n(t.textContent) : null, croix: x ? x.getAttribute("aria-label") : null, croixT: x ? n(x.textContent) : null,
    chrome: a ? { href: a.getAttribute("href"), t: n(a.textContent), target: a.getAttribute("target"), id: a.id, cls: a.className } : null,
    secours: n((c.querySelector(".integre-secours") || {}).textContent), nChrome: c.querySelectorAll("[data-integre-chrome], a[href^='intent:']").length, texte: n(c.textContent),
    ordre: [...c.querySelectorAll(".integre-etapes > *")].map(e => e.tagName) };
});
/* les textes attendus, lus dans DECOUVERTE.integre (ou .en) de la page servie : « ** » retirés, espaces normalisés */
const attendus = (page, app, sys, en) => page.evaluate(([app, sys, en]) => {
  const T = en ? DECOUVERTE.en.integre : DECOUVERTE.integre, n = s => String(s).replace(/\*\*/g, "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim(), g = s => (String(s).match(/\*\*/g) || []).length / 2;
  const l = sys === "android" ? T.android : [T.ios_ouvrir[app]].concat(T.ios);
  return { li: l.map(n), gras: l.map(g), chrome: n(T.chrome), secours: n(T.secours), bandeau: n(T.bandeau), tard: n(T.plus_tard),
    suite: (sys === "android" ? T.android : T.ios).slice(1).map(n) };
}, [app, sys, !!en]);
/* la bannière d'installation */
const banniere = page => page.evaluate(() => {
  const b = document.getElementById("installe"); if (!b) return null;
  const n = s => String(s == null ? "" : s).replace(/[  ]/g, " ").replace(/\s+/g, " ").trim(), a = b.querySelector("[data-integre-chrome]");
  return { cls: b.className, h3: n((b.querySelector("h3") || {}).textContent), p: [...b.querySelectorAll(":scope > p")].map(x => n(x.textContent)), ici: n((b.querySelector("#inst-ici") || {}).textContent),
    etapesTag: (b.querySelector("#inst-etapes") || {}).tagName || "", li: [...b.querySelectorAll("#inst-etapes li")].map(l => n(l.textContent)),
    bascule: n((b.querySelector("#inst-bascule") || {}).textContent), ids: [...b.querySelectorAll("[id]")].map(e => e.id),
    chrome: a ? { href: a.getAttribute("href"), t: n(a.textContent), target: a.getAttribute("target") } : null,
    fait: n((b.querySelector("#inst-fait") || {}).textContent), tard: n((b.querySelector("#inst-plus-tard-2") || {}).textContent), html: b.outerHTML,
    suite: b.hasAttribute("data-integre-suite"), premier: b.parentElement && b.parentElement.id === "vue" && b.parentElement.firstElementChild === b,
    dernier: b.parentElement && b.parentElement.id === "vue" && b.parentElement.lastElementChild === b, haut: Math.round(b.getBoundingClientRect().top + window.scrollY), ecran: window.innerHeight };
});
const lienAttendu = () => `intent://localhost:${PORT}/?ouvrir=connexion#Intent;scheme=http;package=com.android.chrome;S.browser_fallback_url=` + encodeURIComponent(`http://localhost:${PORT}/?ouvrir=connexion`) + ";end";
/* le questionnaire court (3 réponses), puis la page « Ton plan d'action » */
const option = (q, v) => `#q-${q} label.dc-opt:has(input[value="${v}"])`;
async function questionnaire(page){
  await page.waitForSelector(option("probleme", "Perdre du gras"));
  await page.click(option("probleme", "Perdre du gras")); await attendre(page, 300);
  await page.click(option("obstacle", "temps")); await attendre(page, 300);
  await page.click(option("projection", "energie")); await attendre(page, 300);
  await page.click("#dc-voir", { force: true }); await page.waitForSelector("#dc-bilan"); await attendre(page, 500);
}
/* changer de page sans recharger (l'ancre seule : l'adresse d'Instagram porte ?ouvrir=connexion) */
async function aller(page, h){
  await page.evaluate(h => { location.hash = h; }, h);
  await page.waitForFunction(id => typeof courant !== "undefined" && courant === id, h.replace(/^#\//, "").split("/")[0], { timeout: 8000 });
  await attendre(page, 500);
}
async function apresPlan(page){ await page.click("#dc-bilan-plus-tard"); await page.waitForSelector("#dc-etape"); await attendre(page, 500); }
async function inscrire(page, prenom, email){
  await page.fill("#c-prenom", prenom); await page.fill("#c-email", email); await page.fill("#c-mdp", "motdepasse1");
  await page.check("#c-cgu");
  await Promise.all([page.waitForNavigation({ timeout: 15000 }).catch(() => {}), page.click("#c-go")]);
  await pret(page);
}
async function connecter(page, email){
  await page.fill("#c-email", email); await page.fill("#c-mdp", "motdepasse1");
  await Promise.all([page.waitForNavigation({ timeout: 15000 }).catch(() => {}), page.click("#c-go")]);
  await pret(page);
}
const prospectIntegre = (app, sys, extra) => Object.assign({ [CLEF(NOAH.id)]: flag(app, sys) }, extra || {});
async function accueil(b, db, ua, stockage, opts){
  const { c, page } = await contexte(b, db, Object.assign({ ua, qui: NOAH, stockage }, opts || {}));
  await page.goto(URL0 + ((opts && opts.adresse) || "#/accueil")); await pret(page); await page.waitForSelector("#dc-etape"); await attendre(page, 300);
  return { c, page };
}
let URL0 = "";

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF82_PORT=9981 node verif82.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();
  URL0 = `http://localhost:${PORT}/`;

  /* =================== A0. le réglage et les textes (sans navigateur) =================== */
  await bloc("A0. réglage et textes", async () => {
    const vals = t => (t.match(/navigateur_integre:\s*(true|false)/g) || []).map(x => x.split(/:\s*/)[1]);
    const disque = vals(FT.source(HTML)), servi = vals(FT.sourceServie(HTML));
    ok("A0 : un seul réglage « navigateur_integre: true|false » dans les fichiers, allumé (true), servi tel quel aux autres suites",
      disque.length === 1 && disque[0] === "true" && servi.length === 1 && servi[0] === "true", JSON.stringify({ disque, servi }));
    let D = null, err = "";
    try { const ctx = {}; vm.runInNewContext(fs.readFileSync(path.join(path.dirname(HTML), "js", "config.js"), "utf8") + ";this.D = DECOUVERTE;", ctx, { timeout: 2000 }); D = ctx.D; } catch (e) { err = String(e); }
    const pbs = [];
    const fr = D && D.integre, en = D && D.en && D.en.integre;
    const compare = (x, y, ch) => {
      if (Array.isArray(x)) { if (!Array.isArray(y) || y.length !== x.length) pbs.push(ch + " : pas la même liste en anglais"); else x.forEach((v, i) => compare(v, y[i], ch + "[" + i + "]")); return; }
      if (x && typeof x === "object") { if (!y || typeof y !== "object") { pbs.push(ch + " : absent en anglais"); return; } Object.keys(x).forEach(k => compare(x[k], y[k], ch + "." + k)); Object.keys(y).forEach(k => { if (!(k in x)) pbs.push(ch + "." + k + " : en trop en anglais"); }); return; }
      if (typeof x !== "string" || !x.trim()) pbs.push(ch + " : vide (français)");
      if (typeof y !== "string" || !y.trim()) pbs.push(ch + " : vide (anglais)");
      [x, y].forEach(s => { if (typeof s === "string") { if ((s.match(/\*\*/g) || []).length % 2) pbs.push(ch + " : « ** » non fermé"); if (/lucas/i.test(s)) pbs.push(ch + " : « Lucas »"); if (/</.test(s)) pbs.push(ch + " : balise"); } });
      if (typeof x === "string" && x === y) pbs.push(ch + " : pas traduit");
      if (typeof x === "string" && typeof y === "string" && (x.match(/\{[a-z]\}/g) || []).join() !== (y.match(/\{[a-z]\}/g) || []).join()) pbs.push(ch + " : variables différentes");
    };
    if (fr) compare(fr, en, "integre"); else pbs.push("DECOUVERTE.integre absent " + err);
    ok("A0 : textes DECOUVERTE.integre et DECOUVERTE.en.integre : mêmes clés et mêmes listes, rien de vide, gras « ** » fermé, aucune balise, jamais « Lucas », l'anglais traduit (mêmes variables) ; 4 étapes iPhone communes, 1 par app (Instagram, TikTok, Facebook), 2 étapes Android (dans Chrome) ; Chrome 150 et suivants : « Installer et créer un raccourci » / « Install and create shortcut »",
      !pbs.length && fr && fr.ios.length === 4 && egal(Object.keys(fr.ios_ouvrir).sort(), ["facebook", "instagram", "tiktok"]) && fr.android.length === 2
        && /Installer et créer un raccourci/.test(fr.android[1]) && /Install and create shortcut/.test(en.android[1]), JSON.stringify(pbs));
    ok("A0 : mot pour mot (demande de Lucas) : « Dernière étape : mets l'app sur ton téléphone » / « Last step: put the app on your phone », « Tu te connectes avec **{e}** et le mot de passe que tu viens de choisir. » / « You log in with **{e}** and the password you just chose. »",
      !!fr && fr.titre === "Dernière étape : mets l'app sur ton téléphone" && en.titre === "Last step: put the app on your phone"
        && fr.identifiants === "Tu te connectes avec **{e}** et le mot de passe que tu viens de choisir." && en.identifiants === "You log in with **{e}** and the password you just chose.",
      JSON.stringify(fr && { t: fr.titre, i: fr.identifiants, te: en.titre, ie: en.identifiants }));
  });

  /* =================== A1. la détection (user agents réels) =================== */
  await bloc("A1. détection", async () => {
    const db = base();
    const { page } = await contexte(b, db, { neuf: true });
    await page.goto(URL0 + "#/inscription"); await page.waitForSelector("#c-go");
    const r = await page.evaluate(L => L.map(u => { const i = Integre.ici(u); return [Integre.app(u), Integre.systeme(u), Integre.nom(Integre.app(u), u), i ? i.app + "/" + i.sys : ""]; }), REPERES.map(x => UA[x[0]]));
    const faux = REPERES.map((x, k) => egal(r[k], [x[1], x[2], x[3], x[1] + "/" + x[2]]) ? "" : x[0] + " → " + JSON.stringify(r[k])).filter(Boolean);
    ok("A1 : repérés (app, système, nom affiché) : Instagram iPhone (iOS 26 et iOS 18) et Android ; TikTok iPhone (format long, court musical_ly, court trill) et Android (long et court) ; Facebook iPhone (FBAN) et Android (FB_IAB), nouveau format MetaIAB (iPhone et Android) ; Messenger (FBAN/MessengerForiOS, FB_IAB/Orca-Android) avec Facebook",
      !faux.length, JSON.stringify(faux));
    const t = await page.evaluate(L => L.map(u => [Integre.app(u), Integre.ici(u)]), TEMOINS.map(k => UA[k]));
    const vus = TEMOINS.filter((k, i) => t[i][0] !== "" || t[i][1] !== null);
    const defaut = await page.evaluate(() => ({ ua: navigator.userAgent, ici: Integre.ici() }));
    ok("A1 : jamais repérés : Safari iPhone, Chrome Android, Chrome iOS (CriOS), Firefox iOS, Samsung Internet, Edge Android, Chrome et Safari sur Mac, Edge Windows, robot d'aperçu de Facebook (facebookexternalhit), Snapchat, LinkedIn, WhatsApp, WebView Android quelconque, et le navigateur des autres suites (user agent par défaut)",
      !vus.length && defaut.ici === null, JSON.stringify({ vus, defaut }));
  });

  /* =================== A2. l'inscription dans Instagram (iPhone), comparée à Safari =================== */
  const parcours = {};
  await bloc("A2. inscription, A3. carte", async () => {
    for (const k of ["ig_ios", "safari_ios"]) {
      const db = base(); db.inscription.id = PID(k === "ig_ios" ? 10 : 11);
      const { page } = await contexte(b, db, { ua: UA[k], neuf: true });
      await page.goto(URL0 + "?ref=insta#/inscription"); await page.waitForSelector("#c-go"); await attendre(page, 300);
      const ecran = await page.evaluate(() => document.querySelector(".carte-co").innerHTML);
      const h2 = (await portailVu(page)).h2;
      const tClic = Date.now();
      await inscrire(page, "Zoé", "zoe@exemple.fr");
      await page.waitForSelector("#dc-voir"); await attendre(page, 800);
      parcours[k] = { db, page, ecran, h2, tClic, charges: page.__charges, chemins: trie(db.chemins), ecr: resume(db), adr: await adresse(page), url: page.url(),
        dr: await drapeaux(page), carte: !!(await page.$("#integre-carte")), banniere: !!(await page.$("#installe")), corps: JSON.stringify(db.inscriptions).replace(/\d{4}-\d\d-\d\dT[\d:.]+Z/g, "<instant>") };
    }
    const I = parcours.ig_ios, S = parcours.safari_ios;
    ok("A2 : Instagram (iPhone) : même écran d'inscription que Safari (« Crée ton espace gratuit », formulaire identique au caractère près), puis, après « Créer mon compte », le même écran (le questionnaire) ; même nombre de chargements de page (aucun écran ni rechargement en plus)",
      I.h2 === INSC && S.h2 === INSC && I.ecran === S.ecran && I.charges === S.charges && I.charges === 2, JSON.stringify({ h2: [I.h2, S.h2], memeEcran: I.ecran === S.ecran, charges: [I.charges, S.charges] }));
    ok("A2 : … la même demande d'inscription, exactement les mêmes requêtes vers la base (aucune de plus) et les mêmes écritures (jamais bloquée ni retardée)",
      I.corps === S.corps && egal(I.chemins, S.chemins) && egal(trie(I.ecr), trie(S.ecr)), JSON.stringify({ corps: [I.corps, S.corps], ig: I.chemins.filter(x => !S.chemins.includes(x)), safari: S.chemins.filter(x => !I.chemins.includes(x)), n: [I.chemins.length, S.chemins.length], ecr: [I.ecr, S.ecr] }));
    ok("A2 : après l'inscription, l'adresse d'Instagram porte « ?ouvrir=connexion » (sans le code ?ref=), celle de Safari rien ; jamais l'email (ni « %40 ») ni le prénom dans l'adresse",
      I.adr.search === "?ouvrir=connexion" && S.adr.search === "" && !/zoe|%40|@|Zo%C3%A9|Zoé/i.test(I.url) && !/zoe|%40|@/i.test(S.url), JSON.stringify({ ig: I.adr, s: S.adr, url: I.url }));
    const v = I.dr.length === 1 ? JSON.parse(I.dr[0][1]) : null;
    ok("A2 : le drapeau de l'appareil « mhx_integre|<id du compte> » = exactement { app: instagram, sys: ios, inscrit (l'instant de l'inscription), ferme: \"\" }, rien de personnel ; aucun dans Safari",
      I.dr.length === 1 && I.dr[0][0] === CLEF(PID(10)) && egal(Object.keys(v), ["app", "sys", "inscrit", "ferme"]) && v.app === "instagram" && v.sys === "ios" && isoPres(v.inscrit, I.tClic) && v.ferme === ""
        && !/@|zoe|Zoé/i.test(I.dr[0][1]) && S.dr.length === 0, JSON.stringify({ ig: I.dr, s: S.dr }));
    ok("A2 : sur le questionnaire (jamais avant la page du plan d'action) : ni carte « Dernière étape » ni bannière d'installation, dans Instagram comme dans Safari",
      !I.carte && !S.carte && !I.banniere && !S.banniere, JSON.stringify({ I: [I.carte, I.banniere], S: [S.carte, S.banniere] }));

    /* =================== A3. la carte « Dernière étape », après la page du plan d'action (mêmes pages) =================== */
    await questionnaire(I.page); await questionnaire(S.page);
    const surPlan = [!!(await I.page.$("#integre-carte")), !!(await S.page.$("#integre-carte"))];
    ok("A3 : la page « Ton plan d'action » (après les 3 réponses) : pas de carte, ni dans Instagram ni dans Safari", egal(surPlan, [false, false]), JSON.stringify(surPlan));
    await apresPlan(I.page); await apresPlan(S.page);
    const vI = await carte(I.page), vS = await carte(S.page), A = await attendus(I.page, "instagram", "ios");
    ok("A3 : « Voir mon espace d'abord » → l'accueil : dans Instagram, la carte juste sous l'en-tête (« Bonjour »), avant « Ta première étape » ; dans Safari, aucune carte",
      !!vI && vI.avant === "HEADER.masthead" && vI.apres === "dc-etape" && vS === null, JSON.stringify({ vI: vI && [vI.avant, vI.apres], vS }));
    ok("A3 : textes : « Dernière étape : mets l'app sur ton téléphone », « Tu te connectes avec zoe@exemple.fr (en gras) et le mot de passe que tu viens de choisir. », les 5 étapes iPhone d'Instagram (DECOUVERTE.integre, gras compris, la dernière : ouvrir l'icône et se connecter), « Plus tard » écrit en haut à droite et en bas ; aucun bouton Chrome sur iPhone",
      !!vI && vI.titre === "Dernière étape : mets l'app sur ton téléphone" && vI.ids === "Tu te connectes avec zoe@exemple.fr et le mot de passe que tu viens de choisir." && vI.idsB === "zoe@exemple.fr"
        && egal(vI.li, A.li) && egal(vI.gras, A.gras) && vI.li.length === 5 && /depuis l'icône/.test(vI.li[4]) && vI.tard === "Plus tard" && vI.croixT === "Plus tard" && vI.nChrome === 0 && !/lucas/i.test(vI.texte),
      JSON.stringify({ vI, A }));
    const vu = await I.page.evaluate(() => ({ inst: !!document.getElementById("installe"), inv: document.querySelectorAll(".invitation").length }));
    ok("A3 : carte affichée : ni bannière d'installation ni invitation dans cet affichage", !vu.inst && vu.inv === 0, JSON.stringify(vu));
    await attendre(I.page, 1200); await attendre(S.page, 200);
    const dI = await drapeaux(I.page);
    ok("A3 : tout le parcours (inscription, questionnaire, plan d'action, accueil avec la carte) écrit en base exactement les mêmes clés que dans Safari (hors compteur de visites), rien de plus ; le drapeau n'est pas fermé",
      egal(sorte(I.db), sorte(S.db)) && dI.length === 1 && JSON.parse(dI[0][1]).ferme === "", JSON.stringify({ ig: sorte(I.db), s: sorte(S.db), dI }));
  });

  await bloc("A3. invitation en attente", async () => {
    const inv = JSON.stringify({ vues: {}, fermees: {}, attente: [{ code: "declic_calculateur", le: avant(J) }], jour: "", clic: "", reserve: "" });
    const memo = { ["mhx_invitations|" + NOAH.id]: inv };
    const db = base();
    const { page } = await accueil(b, db, UA.ig_ios, prospectIntegre("instagram", "ios", memo));
    const v1 = await page.evaluate(() => ({ carte: !!document.getElementById("integre-carte"), inv: document.querySelectorAll(".invitation").length }));
    const { page: ps } = await accueil(b, base(), UA.safari_ios, memo);
    const v2 = await ps.evaluate(() => ({ carte: !!document.getElementById("integre-carte"), inv: document.querySelectorAll(".invitation").length }));
    ok("A3 : une invitation en attente (v62) : cachée tant que la carte est affichée (Instagram) ; dans Safari, elle s'affiche comme avant (pas de carte)",
      v1.carte && v1.inv === 0 && !v2.carte && v2.inv === 1, JSON.stringify({ v1, v2 }));
    await page.click("#integre-plus-tard"); await attendre(page, 300);
    await aller(page, "#/formation");
    await aller(page, "#/accueil"); await page.waitForSelector("#dc-etape"); await attendre(page, 300);
    const v3 = await page.evaluate(() => ({ carte: !!document.getElementById("integre-carte"), inv: document.querySelectorAll(".invitation").length }));
    ok("A3 : après « Plus tard », l'accueil suivant montre l'invitation restée en attente (plus de carte)", !v3.carte && v3.inv === 1, JSON.stringify(v3));
  });

  /* =================== A4. « Plus tard », puis la visite suivante =================== */
  await bloc("A4. plus tard", async () => {
    const db = base();
    /* 2e visite d'après le compteur (mhx_visites 1 → 2) : la bannière s'afficherait, la carte la retient */
    const { c, page } = await accueil(b, db, UA.ig_ios, prospectIntegre("instagram", "ios", { mhx_visites: "1" }), { neuf: true });
    const v1 = await page.evaluate(() => ({ carte: !!document.getElementById("integre-carte"), inst: !!document.getElementById("installe"), v: localStorage.getItem("mhx_visites") }));
    await aller(page, "#/formation");
    const v2 = await page.evaluate(() => ({ carte: !!document.getElementById("integre-carte"), inst: !!document.getElementById("installe"), h: location.hash }));
    await aller(page, "#/accueil"); await page.waitForSelector("#dc-etape");
    const v3 = await page.evaluate(() => ({ carte: !!document.getElementById("integre-carte"), inst: !!document.getElementById("installe") }));
    ok("A4 : 2e visite (la bannière s'afficherait) : la carte sur l'accueil et pas de bannière ; sur une autre page (Speed Formation) ni carte ni bannière ; de retour sur l'accueil, la carte encore (à chaque affichage, jusqu'à « Plus tard »)",
      v1.carte && !v1.inst && v1.v === "2" && !v2.carte && !v2.inst && v2.h === "#/formation" && v3.carte && !v3.inst, JSON.stringify({ v1, v2, v3 }));
    const n0 = saisies(db).length, t = Date.now();
    await page.click("#integre-plus-tard"); await attendre(page, 800);
    const dr = await drapeaux(page), m = dr.length ? JSON.parse(dr[0][1]) : {};
    const v4 = await page.evaluate(() => ({ carte: !!document.getElementById("integre-carte"), y: window.scrollY }));
    ok("A4 : « Plus tard » : la carte disparaît ; le drapeau de l'appareil passe à « ferme » (l'instant), rien d'autre ; aucune écriture en base",
      !v4.carte && dr.length === 1 && isoPres(m.ferme, t) && m.app === "instagram" && saisies(db).length === n0, JSON.stringify({ v4, dr, ecr: resume(db).slice(n0) }));
    await aller(page, "#/formation");
    const v5 = await page.evaluate(() => ({ inst: !!document.getElementById("installe") }));
    await page.reload(); await pret(page); await aller(page, "#/accueil"); await page.waitForSelector("#dc-etape");
    const v6 = await page.evaluate(() => ({ carte: !!document.getElementById("integre-carte"), inst: !!document.getElementById("installe") }));
    ok("A4 : dans la même visite (autre page, rechargement) : plus de carte, et pas de bannière non plus (« Plus tard » vaut pour cette visite)", !v5.inst && !v6.carte && !v6.inst && saisies(db).length === n0, JSON.stringify({ v5, v6 }));
    const p2 = await nouvellePage(c);
    await p2.goto(URL0 + "#/accueil"); await pret(p2); await p2.waitForSelector("#dc-etape"); await attendre(p2, 400);
    const v7 = await p2.evaluate(() => ({ carte: !!document.getElementById("integre-carte"), v: localStorage.getItem("mhx_visites") })), bn = await banniere(p2), A = await attendus(p2, "instagram", "ios");
    ok("A4 : visite suivante (nouvel onglet) : plus jamais la carte ; la bannière d'installation prend le relais, avec les étapes d'Instagram (« Ici, tu es dans Instagram : ouvre l'app dans Safari pour l'installer. ») ; aucune écriture en base pendant tout ce parcours",
      !v7.carte && v7.v === "3" && !!bn && /installe-integre/.test(bn.cls) && bn.ici === "Ici, tu es dans Instagram : ouvre l'app dans Safari pour l'installer." && egal(bn.li, A.li) && saisies(db).length === n0,
      JSON.stringify({ v7, bn: bn && { cls: bn.cls, ici: bn.ici, li: bn.li }, ecr: resume(db).slice(n0) }));
  });

  await bloc("A4. stockage plein", async () => {
    /* le drapeau se lit, mais son écriture est refusée (stockage plein : QuotaExceededError) : « Plus tard » tient quand même
       pendant la visite (la copie de la visite passe avant l'appareil) */
    const db = base();
    const { page } = await accueil(b, db, UA.ig_ios, prospectIntegre("instagram", "ios"));
    await page.evaluate(() => { const o = Storage.prototype.setItem; Storage.prototype.setItem = function(k, v){ if (String(k).indexOf("mhx_integre|") === 0) throw new DOMException("plein", "QuotaExceededError"); return o.call(this, k, v); }; });
    const n0 = saisies(db).length;
    await page.click("#integre-plus-tard"); await attendre(page, 300);
    await aller(page, "#/formation");
    await aller(page, "#/accueil"); await page.waitForSelector("#dc-etape"); await attendre(page, 300);
    const v = await page.evaluate(() => ({ carte: !!document.getElementById("integre-carte"), ferme: JSON.parse(localStorage.getItem("mhx_integre|" + Auth.utilisateur().id)).ferme }));
    ok("A4 : stockage plein (écriture du drapeau refusée) : après « Plus tard », de retour sur l'accueil dans la même visite, plus de carte (l'appareil garde l'ancien drapeau) ; aucune écriture en base",
      !v.carte && v.ferme === "" && saisies(db).length === n0, JSON.stringify({ v, ecr: resume(db).slice(n0) }));
  });

  /* =================== A5. Android : le lien vers Chrome ; iPhone : la 1re étape de chaque app =================== */
  await bloc("A5. android", async () => {
    const db = base();
    const { page } = await accueil(b, db, UA.ig_and, prospectIntegre("instagram", "android"));
    const v = await carte(page), A = await attendus(page, "instagram", "android");
    ok("A5 : Instagram Android : bouton « Ouvrir dans Chrome » = lien intent:// exact (" + lienAttendu() + "), sans target, sans email ; juste dessous quoi faire s'il n'ouvre rien (revenir en arrière, ⋮, « Ouvrir dans Chrome ») ; puis les 2 étapes de tous, dans Chrome (DECOUVERTE.integre.android : se connecter, « Installer et créer un raccourci »)",
      !!v && !!v.chrome && v.chrome.href === lienAttendu() && v.chrome.target === null && v.chrome.t === A.chrome && v.chrome.id === "integre-chrome" && v.nChrome === 1 && !/@|%40|noah/i.test(v.chrome.href)
        && v.secours === A.secours && /Reviens en arrière/.test(v.secours) && /« Ouvrir dans Chrome »/.test(v.secours) && egal(v.ordre, ["DIV", "P", "OL"])
        && egal(v.li, A.li) && egal(v.gras, A.gras) && v.li.length === 2 && /^Dans Chrome/.test(v.li[0]) && /Installer et créer un raccourci/.test(v.li[1]) && v.tard === "Plus tard",
      JSON.stringify({ v, A }));
    { const { page: p } = await accueil(b, base(), UA.ig_and, prospectIntegre("instagram", "android"), { adresse: "?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZtest123&igsh=abc#/accueil" });
      const w = await carte(p), ad = await adresse(p);
      ok("A5 : arrivée par le lien de la bio (utm_…, fbclid, igsh ajoutés par Instagram) : le lien vers Chrome n'emporte que ?ouvrir=connexion (ni fbclid, ni utm_, ni igsh, même encodés dans l'adresse de secours)",
        !!w && !!w.chrome && w.chrome.href === lienAttendu() && !/fbclid|utm_|igsh|PAZ/.test(w.chrome.href) && /fbclid=PAZtest123/.test(ad.search) && /ouvrir=connexion$/.test(ad.search),
        JSON.stringify({ href: w && w.chrome && w.chrome.href, ad })); }
    const vus = [];
    for (const k of ["tt_and_long", "tt_and_court", "fb_and", "meta_and"]) {
      const app = /^tt/.test(k) ? "tiktok" : "facebook";
      const { page: p } = await accueil(b, base(), UA[k], prospectIntegre(app, "android"), { adresse: "?ref=insta#/accueil" });
      const w = await carte(p), ad = await adresse(p);
      vus.push({ k, href: w && w.chrome && w.chrome.href, n: w && w.li.length, ad });
    }
    ok("A5 : TikTok Android (format long et court), Facebook Android (FB_IAB) et MetaIAB : la carte avec le même lien vers Chrome (le code ?ref= de l'adresse n'y passe pas) ; l'adresse garde ?ref= et reçoit ouvrir=connexion",
      vus.length === 4 && vus.every(x => x.href === lienAttendu() && x.n === 2 && x.ad.search === "?ref=insta&ouvrir=connexion" && x.ad.hash === "#/accueil"), JSON.stringify(vus));
    const ios = [];
    for (const [k, app] of [["tt_ios_long", "tiktok"], ["tt_ios_court", "tiktok"], ["fb_ios", "facebook"], ["meta_ios", "facebook"]]) {
      const { page: p } = await accueil(b, base(), UA[k], prospectIntegre(app, "ios"));
      const w = await carte(p), At = await attendus(p, app, "ios");
      ios.push({ k, ok: !!w && egal(w.li, At.li) && w.nChrome === 0, li0: w && w.li[0] });
    }
    ok("A5 : iPhone : TikTok (long et court) commence par « ⋯ en haut à droite, puis « Ouvrir dans le navigateur » », Facebook (FBAN) et MetaIAB par « ⋯ en bas à droite, puis « Ouvrir dans le navigateur du système » » ; puis les étapes de Safari ; jamais de lien Chrome",
      ios.length === 4 && ios.every(x => x.ok) && /navigateur »\.$/.test(ios[0].li0) && /du système/.test(ios[2].li0), JSON.stringify(ios));
  });

  /* =================== A6. l'adresse : ?ouvrir=connexion =================== */
  await bloc("A6. adresse", async () => {
    const vus = [];
    for (const k of ["safari_ios", "chrome_and"]) {
      const { page } = await contexte(b, base(), { ua: UA[k], neuf: true });
      await page.goto(URL0 + "?ouvrir=connexion"); await page.waitForSelector("#c-go"); await attendre(page, 300);
      vus.push(await portailVu(page));
      await page.goto(URL0 + "?ouvrir=connexion#/inscription"); await page.reload(); await page.waitForSelector("#c-go"); await attendre(page, 300);
      vus.push(await portailVu(page));
    }
    ok("A6 : appareil neuf (Safari iPhone, Chrome Android) ouvert sur « ?ouvrir=connexion » : l'écran de connexion (pas l'inscription), l'adresse dit #/connexion ; « #/inscription » garde la priorité",
      vus.length === 4 && [0, 2].every(i => vus[i].h2 === CONN && !vus[i].prenom && vus[i].hash === "#/connexion" && vus[i].search === "?ouvrir=connexion") && [1, 3].every(i => vus[i].h2 === INSC), JSON.stringify(vus));
    { const { page } = await contexte(b, base(), { ua: UA.safari_ios, neuf: true });
      await page.goto(URL0); await page.waitForSelector("#c-go"); await attendre(page, 300);
      const v = await portailVu(page);
      ok("A6 : témoin : le même appareil neuf sans le paramètre : l'inscription, comme avant", v.h2 === INSC && v.prenom, JSON.stringify(v)); }
    { const db = base(); db.emails[NOAH.id] = NOAH.email;
      const { page } = await contexte(b, db, { ua: UA.safari_ios, neuf: true });
      await page.goto(URL0 + "?ouvrir=connexion"); await page.waitForSelector("#c-go");
      await connecter(page, NOAH.email); await page.waitForSelector("#dc-etape"); await attendre(page, 400);
      await page.evaluate(() => window.scrollTo(0, 0)); await attendre(page, 100);
      const ad = await adresse(page), bn = await banniere(page), A = await attendus(page, "instagram", "ios"), x = await page.evaluate(() => ({ v: localStorage.getItem("mhx_visites"), carte: !!document.getElementById("integre-carte") }));
      ok("A6 : … connexion (Safari) : l'adresse n'a plus le paramètre, l'accueil s'ouvre (pas de carte : navigateur normal)", ad.search === "" && ad.hash === "" && !x.carte, JSON.stringify({ ad, x }));
      ok("A6 : … et la bannière d'installation normale (mêmes titre, boutons et id) s'affiche dès cette première visite, EN HAUT de la page (avant « Bonjour », visible sans défiler), avec la suite des étapes de la carte (Partager, « Sur l'écran d'accueil », ouvrir l'icône : DECOUVERTE.integre.ios sans la connexion)",
        !!bn && bn.cls === "installe" && bn.suite && bn.premier && bn.haut < bn.ecran && bn.etapesTag === "OL" && egal(bn.li, A.suite) && bn.li.length === 3 && /Partager/.test(bn.li[0]) && /depuis l'icône/.test(bn.li[2])
          && bn.ici === "" && bn.h3 === "Mets MHX Coaching sur ton écran d'accueil" && ["inst-plus-tard", "inst-etapes", "inst-bascule", "inst-fait", "inst-plus-tard-2"].every(i => bn.ids.includes(i)) && x.v === "1",
        JSON.stringify({ bn: bn && Object.assign({}, bn, { html: undefined }), A: A.suite, x }));
      const An = await attendus(page, "instagram", "android");
      await page.click("#inst-bascule"); await attendre(page, 200);
      const w = await banniere(page);
      await page.click("#inst-plus-tard-2"); await attendre(page, 200);
      await aller(page, "#/formation");
      const apres = await banniere(page);
      ok("A6 : … « Je suis sur Android ou ordinateur » : l'étape de Chrome de la carte (« Installer et créer un raccourci ») ; « Plus tard » : plus de bannière dans cette visite",
        !!w && egal(w.li, An.suite) && /Installer et créer un raccourci/.test(w.li[0]) && !apres, JSON.stringify({ w: w && w.li, apres: !!apres })); }
    { const db = base(); db.emails[NOAH.id] = NOAH.email;
      const { page } = await contexte(b, db, { ua: UA.chrome_and, neuf: true });
      await page.goto(URL0 + "?ouvrir=connexion"); await page.waitForSelector("#c-go");
      await connecter(page, NOAH.email); await page.waitForSelector("#dc-etape"); await attendre(page, 400);
      const bn = await banniere(page), A = await attendus(page, "instagram", "android");
      ok("A6 : … même chose dans Chrome Android (bouton Chrome touché) : la bannière en haut, avec « Touche ⋮ puis « Installer et créer un raccourci » … »",
        !!bn && bn.cls === "installe" && bn.suite && bn.premier && egal(bn.li, A.suite) && bn.li.length === 1, JSON.stringify({ bn: bn && { li: bn.li, premier: bn.premier, suite: bn.suite }, A: A.suite })); }
    { const db = base(); db.emails[NOAH.id] = NOAH.email;
      const { page } = await contexte(b, db, { ua: UA.safari_ios, neuf: true });
      await page.goto(URL0 + "#/connexion"); await page.waitForSelector("#c-go");
      await connecter(page, NOAH.email); await page.waitForSelector("#dc-etape"); await attendre(page, 400);
      const b1 = await banniere(page);
      const p2 = await nouvellePage(page.context());
      await p2.goto(URL0 + "#/accueil"); await pret(p2); await p2.waitForSelector("#dc-etape"); await p2.waitForSelector("#installe"); await attendre(p2, 300);
      const b2 = await banniere(p2);
      ok("A6 : témoin : la même connexion sans le paramètre : pas de bannière à la première visite ; à la visite suivante, la bannière de Safari, en bas de la page, comme avant",
        !b1 && !!b2 && b2.cls === "installe" && !b2.suite && b2.dernier && !b2.premier && /^Touche le bouton Partager en bas de Safari/.test(b2.li[0]) && b2.li.length === 3,
        JSON.stringify({ b1: !!b1, b2: b2 && { li: b2.li, suite: b2.suite, dernier: b2.dernier } })); }
    { const { page } = await contexte(b, base(), { ua: UA.safari_ios, qui: NOAH });
      await page.goto(URL0 + "?ouvrir=connexion#/profil"); await pret(page);
      const v = await page.evaluate(() => ({ portail: !!document.querySelector(".portail"), vue: !!document.getElementById("vue"), hash: location.hash, search: location.search }));
      ok("A6 : avec une session, dans Safari : le paramètre est ignoré (l'app s'ouvre sur la page demandée, l'adresse n'est pas touchée)", !v.portail && v.vue && v.hash === "#/profil" && v.search === "?ouvrir=connexion", JSON.stringify(v)); }
    { const r = [];
      for (const k of ["ig_ios", "chrome_ios"]) {
        const { page } = await contexte(b, base(), { ua: UA[k], qui: NOAH, stockage: prospectIntegre("instagram", "ios") });
        await page.goto(URL0 + "#/profil"); await pret(page);
        r.push(await page.evaluate(() => ({ vue: !!document.getElementById("vue"), hash: location.hash, search: location.search })));
        if (k === "ig_ios") {
          await Promise.all([page.waitForNavigation({ timeout: 15000 }).catch(() => {}), page.evaluate(() => Auth.deconnecter())]);
          await page.waitForSelector("#c-go"); await attendre(page, 300);
          r.push(await portailVu(page));
        }
      }
      ok("A6 : avec une session dans Instagram (#/profil), prospect inscrit là : « ?ouvrir=connexion#/profil » (ancre gardée) ; « Se déconnecter » y rouvre la connexion ; Chrome iOS : jamais de paramètre",
        r[0].vue && r[0].hash === "#/profil" && r[0].search === "?ouvrir=connexion" && r[1].h2 === CONN && r[2].vue && r[2].hash === "#/profil" && r[2].search === "", JSON.stringify(r)); }
    { const r = [];
      for (const [nom, qui, vp, h] of [["prospect sans drapeau", NOAH, MOBILE, "#/profil"], ["client", THOMAS, MOBILE, "#/profil"], ["coach", COACH, LARGE, "#/tableau"]]) {
        const { page } = await contexte(b, base(), { ua: UA.ig_ios, qui, viewport: vp });
        await page.goto(URL0 + h); await pret(page); await attendre(page, 300);
        r.push(Object.assign({ nom }, await adresse(page), { vue: !!(await page.$("#vue")) }));
      }
      ok("A6 : dans Instagram, un compte qui ne s'y est pas inscrit (prospect sans drapeau, client, coach) : jamais de paramètre (un lien copié puis partagé ouvre l'écran d'entrée habituel), ancre intacte",
        r.length === 3 && r.every(x => x.vue && x.search === "") && r[0].hash === "#/profil" && r[1].hash === "#/profil", JSON.stringify(r)); }
    { const r = [];
      for (const depart of ["#/inscription?ref=insta", "?ouvrir=connexion#/inscription?ref=insta", "?ref=insta#/connexion"]) {
        const { page } = await contexte(b, base(), { ua: UA.ig_ios, qui: NOAH, stockage: { [CLEF(NOAH.id)]: flag("instagram", "ios", avant(H)) } });   // « Plus tard » déjà touché : le paramètre reste (la bannière prend le relais)
        await page.goto(URL0 + depart); await pret(page); await attendre(page, 300);
        r.push(Object.assign({ depart }, await adresse(page), { accueil: !!(await page.$("#dc-etape")), portail: !!(await page.$(".portail")) }));
      }
      const db = base(); db.emails[NOAH.id] = NOAH.email;
      const { page: ps } = await contexte(b, db, { ua: UA.safari_ios, neuf: true });
      await ps.goto(URL0 + r[0].search + r[0].hash); await ps.waitForSelector("#c-go"); await attendre(ps, 300);
      const vs = await portailVu(ps);
      ok("A6 : session dans Instagram (prospect inscrit là) ouverte par « …/#/inscription?ref=insta » (lien touché de nouveau) : l'ancre d'inscription (ou de connexion) est retirée, même si le paramètre est déjà là ; l'accueil s'ouvre ; cette adresse ouverte ensuite dans Safari (appareil neuf) mène à la connexion, pas à l'inscription",
        r.length === 3 && r[0].search === "?ouvrir=connexion" && r[1].search === "?ouvrir=connexion" && r[2].search === "?ref=insta&ouvrir=connexion" && r.every(x => x.hash === "" && x.accueil && !x.portail)
          && vs.h2 === CONN && !vs.prenom && vs.hash === "#/connexion", JSON.stringify({ r, vs })); }
  });

  /* =================== A7. la bannière d'installation dans ces navigateurs =================== */
  await bloc("A7. bannière", async () => {
    const db = base();
    const { page } = await contexte(b, db, { ua: UA.ig_ios, qui: THOMAS, neuf: true, stockage: { mhx_visites: "1", [CLEF(THOMAS.id)]: flag("instagram", "ios") } });
    await page.goto(URL0 + "#/accueil"); await pret(page); await page.waitForSelector("#installe"); await attendre(page, 300);
    const n0 = saisies(db).length;
    const v = await banniere(page), A = await attendus(page, "instagram", "ios"), An = await attendus(page, "instagram", "android");
    ok("A7 : client (Thomas) dans Instagram, 2e visite : la bannière garde son titre, sa phrase, ses boutons et ses id (inst-plus-tard, inst-etapes, inst-bascule, inst-fait, inst-plus-tard-2), avec « Ici, tu es dans Instagram : ouvre l'app dans Safari pour l'installer. » et les 5 étapes d'Instagram ; « Je suis sur Android » ; jamais la carte (client)",
      !!v && v.cls === "installe installe-integre" && v.h3 === "Mets MHX Coaching sur ton écran d'accueil" && v.p[0] === "Tu l'ouvres d'un doigt, elle s'affiche en plein écran, et tu n'as plus à retenir l'adresse."
        && v.ici === "Ici, tu es dans Instagram : ouvre l'app dans Safari pour l'installer." && egal(v.li, A.li) && v.bascule === "Je suis sur Android" && v.fait === "C'est fait" && v.tard === "Plus tard"
        && ["inst-plus-tard", "inst-etapes", "inst-bascule", "inst-fait", "inst-plus-tard-2"].every(i => v.ids.includes(i)) && !(await page.$("#integre-carte")),
      JSON.stringify(v && Object.assign({}, v, { html: undefined })));
    await page.click("#inst-bascule"); await attendre(page, 300);
    const w = await banniere(page);
    await page.click("#inst-bascule"); await attendre(page, 300);
    const w2 = await banniere(page);
    ok("A7 : « Je suis sur Android » : le bouton « Ouvrir dans Chrome » (même lien intent://), quoi faire s'il n'ouvre rien et les 2 étapes dans Chrome, « … dans Chrome pour l'installer. », « Je suis sur iPhone » ; et retour",
      !!w && !!w.chrome && w.chrome.href === lienAttendu() && egal(w.li, An.li) && w.ici === "Ici, tu es dans Instagram : ouvre l'app dans Chrome pour l'installer." && w.bascule === "Je suis sur iPhone"
        && !!w2 && egal(w2.li, A.li) && !w2.chrome && w2.bascule === "Je suis sur Android", JSON.stringify({ w: w && { li: w.li, ici: w.ici, chrome: w.chrome, b: w.bascule }, w2: w2 && { li: w2.li, b: w2.bascule } }));
    await page.click("#inst-fait"); await attendre(page, 300);
    const f = await page.evaluate(() => ({ inst: !!document.getElementById("installe"), cle: localStorage.getItem("mhx_installe") }));
    await page.reload(); await pret(page);
    const f2 = !!(await page.$("#installe"));
    ok("A7 : « C'est fait » : la bannière part pour de bon (mhx_installe, même après un rechargement) ; aucune écriture en base", !f.inst && f.cle === "1" && !f2 && saisies(db).length === n0, JSON.stringify({ f, f2, ecr: resume(db).slice(n0) }));
    const r = [];
    for (const [k, ici, sys, app] of [["fb_and", "Ici, tu es dans Facebook : ouvre l'app dans Chrome pour l'installer.", "android", "facebook"], ["msg_ios", "Ici, tu es dans Messenger : ouvre l'app dans Safari pour l'installer.", "ios", "facebook"]]) {
      const { page: p } = await contexte(b, base(), { ua: UA[k], qui: THOMAS, neuf: true, stockage: { mhx_visites: "1" } });
      await p.goto(URL0 + "#/accueil"); await pret(p); await p.waitForSelector("#installe"); await attendre(p, 300);
      const x = await banniere(p), Ax = await attendus(p, app, sys);
      r.push({ k, ok: !!x && x.ici === ici && egal(x.li, Ax.li) && (sys === "android" ? !!x.chrome && x.chrome.href === lienAttendu() : !x.chrome), ici: x && x.ici });
      if (k === "msg_ios") { await p.click("#inst-plus-tard"); await attendre(p, 200); await aller(p, "#/formation"); r.push({ k: "plus tard", ok: !(await p.$("#installe")) && (await adresse(p)).search === "" }); }
    }
    ok("A7 : Facebook Android : le bouton Chrome d'emblée (« … dans Facebook : ouvre l'app dans Chrome … ») ; Messenger iPhone : « Ici, tu es dans Messenger … Safari … » et l'étape de Facebook ; la croix « Plus tard » ferme la bannière pour la visite, comme avant (client sans drapeau : pas de paramètre dans l'adresse)",
      r.length === 3 && r.every(x => x.ok), JSON.stringify(r));
  });

  /* =================== A8. en anglais =================== */
  await bloc("A8. anglais", async () => {
    const prefs = uid => ({ user_id: uid, outil: "prefs", contenu: { langue: "en" }, maj_le: avant(J) });
    { const db = base([prefs(NOAH.id)]);
      const { page } = await accueil(b, db, UA.ig_ios, prospectIntegre("instagram", "ios"), { langue: "en" });
      await attendre(page, 400);
      const v = await carte(page), A = await attendus(page, "instagram", "ios", true);
      ok("A8 : anglais (iPhone) : « Last step: put the app on your phone », « You log in with noah@exemple.fr and the password you just chose. », les 5 étapes anglaises (DECOUVERTE.en.integre), « Later » (en haut et en bas) ; aucun mot français",
        !!v && v.titre === "Last step: put the app on your phone" && v.ids === "You log in with noah@exemple.fr and the password you just chose." && v.idsB === "noah@exemple.fr"
          && egal(v.li, A.li) && egal(v.gras, A.gras) && v.tard === "Later" && v.croixT === "Later" && !/Touche|Connecte|Partager|Plus tard|Dernière|écran|navigateur|Ajouter/.test(v.texte),
        JSON.stringify({ v, A })); }
    { const db = base([prefs(NOAH.id)]);
      const { page } = await accueil(b, db, UA.ig_and, prospectIntegre("instagram", "android"), { langue: "en" });
      await attendre(page, 400);
      const v = await carte(page), A = await attendus(page, "instagram", "android", true);
      ok("A8 : anglais (Android) : « Open in Chrome » (même lien), « Chrome didn't open, or you see an error page? Go back… », les 2 étapes anglaises (« Install and create shortcut »)",
        !!v && !!v.chrome && v.chrome.t === "Open in Chrome" && v.chrome.href === lienAttendu() && v.secours === A.secours && /^Chrome didn't open, or you see an error page\? Go back/.test(v.secours) && egal(v.li, A.li)
          && /Install and create shortcut/.test(v.li[1]) && !/Touche|Connecte|Ouvrir|Fais-le|Reviens/.test(v.texte),
        JSON.stringify({ v, A })); }
    { const db = base(); db.donnees.find(d => d.user_id === THOMAS.id && d.outil === "prefs").contenu.langue = "en";
      const { page } = await contexte(b, db, { ua: UA.ig_ios, qui: THOMAS, neuf: true, langue: "en", stockage: { mhx_visites: "1" } });
      await page.goto(URL0 + "#/accueil"); await pret(page); await page.waitForSelector("#installe"); await attendre(page, 500);
      const v = await banniere(page), A = await attendus(page, "instagram", "ios", true);
      await page.click("#inst-bascule"); await attendre(page, 400);
      const w = await banniere(page);
      ok("A8 : anglais, bannière : « Add MHX Coaching to your home screen », « Right now you're inside Instagram: open the app in Safari to install it. », étapes anglaises, « I'm on Android » → « I'm on iPhone », « Done », « Later »",
        !!v && v.h3 === "Add MHX Coaching to your home screen" && v.ici === "Right now you're inside Instagram: open the app in Safari to install it." && egal(v.li, A.li)
          && v.bascule === "I'm on Android" && v.fait === "Done" && v.tard === "Later" && !!w && w.bascule === "I'm on iPhone" && !!w.chrome && w.chrome.t === "Open in Chrome",
        JSON.stringify({ v: v && Object.assign({}, v, { html: undefined }), w: w && { b: w.bascule, c: w.chrome } })); }
  });

  /* =================== A9. interrupteur éteint : exactement comme avant =================== */
  await bloc("A9. interrupteur éteint", async () => {
    await avecInterrupteur(false, async () => {
      const db = base(); db.inscription.id = PID(20);
      const { page } = await contexte(b, db, { ua: UA.ig_ios, neuf: true });
      await page.goto(URL0 + "?ref=insta#/inscription"); await page.waitForSelector("#c-go");
      const ici = await page.evaluate(() => [Integre.ici(), Integre.versConnexion()]);
      await inscrire(page, "Léa", "lea@exemple.fr"); await page.waitForSelector("#dc-voir"); await attendre(page, 500);
      const ad = await adresse(page), dr = await drapeaux(page);
      ok("A9 : éteint : dans Instagram, rien n'est repéré ; après l'inscription, aucun paramètre dans l'adresse et aucun drapeau sur l'appareil",
        ici[0] === null && ici[1] === false && ad.search === "" && dr.length === 0, JSON.stringify({ ici, ad, dr }));
      await questionnaire(page); await apresPlan(page);
      ok("A9 : éteint : l'accueil après la page du plan d'action, sans carte", !(await page.$("#integre-carte")), "");
      const bannieres = [];
      for (const k of ["ig_ios", "safari_ios"]) {
        const { page: p } = await contexte(b, base(), { ua: UA[k], qui: THOMAS, neuf: true, stockage: { mhx_visites: "1" } });
        await p.goto(URL0 + "#/accueil"); await pret(p); await p.waitForSelector("#installe"); await attendre(p, 300);
        bannieres.push(await banniere(p));
      }
      ok("A9 : éteint : la bannière dans Instagram est celle de Safari, au caractère près (étapes de Safari, sans classe installe-integre)",
        bannieres.length === 2 && !!bannieres[0] && bannieres[0].html === bannieres[1].html && bannieres[0].cls === "installe" && /Partager/.test(bannieres[0].li[0]), JSON.stringify(bannieres.map(x => x && x.cls)));
      const db2 = base(); db2.emails[NOAH.id] = NOAH.email;
      const { page: p3 } = await contexte(b, db2, { ua: UA.safari_ios, neuf: true });
      await p3.goto(URL0 + "?ouvrir=connexion"); await p3.waitForSelector("#c-go"); await attendre(p3, 300);
      const v = await portailVu(p3);
      await p3.click('.bascule [data-mode="connexion"]'); await attendre(p3, 300);
      await connecter(p3, NOAH.email); await p3.waitForSelector("#dc-etape"); await attendre(p3, 300);
      const ad3 = await adresse(p3), bn3 = await banniere(p3);
      ok("A9 : éteint : « ?ouvrir=connexion » sur un appareil neuf ouvre l'inscription, comme avant ; après la connexion, pas de bannière à la première visite et le paramètre n'est pas touché (comme avant : il ne veut rien dire)",
        v.h2 === INSC && v.hash === "" && !bn3 && ad3.search === "?ouvrir=connexion", JSON.stringify({ v, ad3, bn3: !!bn3 }));
    });
  });

  /* =================== A10. Safari, Chrome et l'ordinateur : rien ne change =================== */
  await bloc("A10. navigateurs normaux", async () => {
    for (const [k, nom, vp] of [["safari_ios", "Safari iPhone", MOBILE], ["chrome_and", "Chrome Android", MOBILE], ["chrome_ios", "Chrome iOS (CriOS)", MOBILE], [null, "ordinateur (user agent par défaut)", LARGE]]) {
      const vus = {};
      for (const v of [true, false]) {
        await avecInterrupteur(v, async () => {
          const { page } = await contexte(b, base(), { ua: k ? UA[k] : undefined, viewport: vp, neuf: true });
          await page.goto(URL0 + "?ref=insta#/inscription"); await page.waitForSelector("#c-go"); await attendre(page, 900);
          const insc = await page.evaluate(() => document.body.innerHTML);
          const { page: p } = await contexte(b, base(), { ua: k ? UA[k] : undefined, viewport: vp, qui: NOAH, neuf: true, stockage: { mhx_visites: "1" } });
          await p.goto(URL0 + "#/accueil"); await pret(p); await p.waitForSelector("#dc-etape"); await p.waitForSelector("#installe"); await attendre(p, 500);
          const vue = await p.evaluate(() => document.getElementById("vue").innerHTML.replace(/ style="[^"]*animation[^"]*"/g, ""));
          vus[v] = { insc, vue, ad: await adresse(p), dr: await drapeaux(p), carte: !!(await p.$("#integre-carte")), cls: (await banniere(p) || {}).cls };
        });
      }
      const A = vus[true], E = vus[false];
      ok("A10 : " + nom + " : écran d'inscription et accueil (bannière d'installation comprise) identiques au caractère près, interrupteur allumé ou éteint ; ni carte, ni paramètre, ni drapeau",
        !!A && !!E && A.insc === E.insc && A.vue === E.vue && !A.carte && A.ad.search === "" && A.dr.length === 0 && A.cls === "installe",
        JSON.stringify({ insc: A && A.insc === E.insc, vue: A && A.vue === E.vue, carte: A && A.carte, ad: A && A.ad, dr: A && A.dr, cls: A && A.cls }));
    }
  });

  /* =================== A11. jamais pour un client, le coach, la page du plan ; email piégé ; 320 × 568 =================== */
  await bloc("A11. jamais de carte", async () => {
    const r = [];
    { const { page } = await contexte(b, base(), { ua: UA.ig_ios, qui: THOMAS, stockage: { [CLEF(THOMAS.id)]: flag("instagram", "ios") } });
      await page.goto(URL0 + "#/accueil"); await pret(page); await attendre(page, 500); r.push(["client", !!(await page.$("#integre-carte")), !!(await page.$("#vue section, #vue header"))]); }
    { const { page } = await contexte(b, base(), { ua: UA.ig_ios, qui: COACH, viewport: LARGE, stockage: { [CLEF(COACH.id)]: flag("instagram", "ios") } });
      await page.goto(URL0); await pret(page); await attendre(page, 500); r.push(["coach", !!(await page.$("#integre-carte")), !!(await page.$("#vue section, #vue header"))]); }
    { const { page } = await contexte(b, base(), { ua: UA.ig_ios, qui: NOAH, stockage: prospectIntegre("instagram", "ios") });
      await page.goto(URL0 + "#/decouverte/bilan"); await pret(page); await page.waitForSelector("#dc-bilan"); await attendre(page, 300); r.push(["plan", !!(await page.$("#integre-carte")), true]); }
    ok("A11 : jamais de carte pour un client (Thomas) ni pour le coach (même avec un drapeau), ni sur la page « Ton plan d'action » d'un prospect inscrit dans Instagram",
      r.length === 3 && r.every(x => x[1] === false && x[2] === true), JSON.stringify(r));
  });

  await bloc("A11. email piégé, 320 × 568", async () => {
    const PIEGE = { id: PID(30), prenom: "Ana", email: `<img src=x onerror="window.__xss=1">'"&**gras**{e}@exemple.fr` };
    const db = base([], [PIEGE]);
    const { page } = await contexte(b, db, { ua: UA.ig_ios, qui: PIEGE, stockage: { [CLEF(PIEGE.id)]: flag("instagram", "ios") } });
    await page.goto(URL0 + "#/accueil"); await pret(page); await page.waitForSelector("#integre-carte"); await attendre(page, 300);
    const v = await carte(page), x = await page.evaluate(() => ({ xss: !!window.__xss, img: !!document.querySelector("#integre-carte img"), b: document.querySelectorAll("#integre-ids b").length, h: document.getElementById("integre-ids").innerHTML }));
    ok("A11 : email piégé (balise, guillemets, apostrophe, &, « ** », « {e} ») : affiché tel quel, en gras, échappé (aucune balise créée, aucun script)",
      !!v && v.idsB === PIEGE.email && !x.xss && !x.img && x.b === 1 && /&lt;img/.test(x.h), JSON.stringify({ idsB: v && v.idsB, x }));
    const LONG = { id: PID(31), prenom: "Max", email: "prenom.nom.vraiment.tres.long.pour.le.test@exemple.fr" };
    for (const [ua, app, sys] of [[UA.ig_ios, "instagram", "ios"], [UA.ig_and, "instagram", "android"]]) {
      const db2 = base([], [LONG]);
      const { page: p } = await contexte(b, db2, { ua, qui: LONG, viewport: PETIT, stockage: { [CLEF(LONG.id)]: flag(app, sys) } });
      await p.goto(URL0 + "#/accueil"); await pret(p); await p.waitForSelector("#integre-carte"); await attendre(p, 600);
      await p.evaluate(() => window.scrollTo(0, 0)); await attendre(p, 200);
      const m = await p.evaluate(() => {
        const x = document.getElementById("integre-fermer"), r = x.getBoundingClientRect(), t = document.querySelector(".topbar"), bb = document.getElementById("barre-bas");
        const haut = t ? t.getBoundingClientRect().bottom : 0, bas = bb && getComputedStyle(bb).display !== "none" ? bb.getBoundingClientRect().top : window.innerHeight;
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2, e = document.elementFromPoint(cx, cy);
        const pt = document.getElementById("integre-plus-tard").getBoundingClientRect();
        return { y: window.scrollY, sw: document.documentElement.scrollWidth, iw: window.innerWidth, top: Math.round(r.top), bottom: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height), haut: Math.round(haut), bas: Math.round(bas),
          dessus: e === x, cx, cy, boutonBas: Math.round(pt.bottom), boutonVisible: pt.bottom <= bas, texte: x.textContent.replace(/\s+/g, " ").trim(),
          titreDroite: (() => { const rg = document.createRange(); rg.selectNodeContents(document.getElementById("integre-titre")); return Math.max(...[...rg.getClientRects()].filter(q => q.bottom > r.top && q.top < r.bottom).map(q => q.right), -1); })(),
          gauche: r.left, dehors: r.right <= window.innerWidth && r.left >= 0 };
      });
      const n0 = saisies(db2).length;
      res.push("    (info) 320 × 568, " + sys + " : « Plus tard » du haut de " + m.top + " à " + m.bottom + " px (" + m.w + " × " + m.h + "), barre du bas à " + m.bas + " px ; bouton « Plus tard » du bas à " + m.boutonBas + " px (" + (m.boutonVisible ? "visible" : "après défilement") + ")");
      await p.mouse.click(m.cx, m.cy); await attendre(p, 400);
      const apres = await p.evaluate(() => ({ carte: !!document.getElementById("integre-carte"), y: window.scrollY }));
      ok("A11 : 320 × 568 (" + sys + ", email long) : aucun défilement horizontal ; « Plus tard » écrit en toutes lettres en haut à droite de la carte (au moins 44 × 44, sans chevaucher le titre), visible sans défiler, entre la barre du haut et celle du bas ; touché sans défiler, la carte part (aucune écriture)",
        m.y === 0 && m.sw <= m.iw && m.texte === "Plus tard" && m.dehors && m.top >= m.haut && m.bottom <= m.bas && m.w >= 44 && m.h >= 44 && m.dessus && m.titreDroite <= m.gauche
          && !apres.carte && apres.y === 0 && saisies(db2).length === n0,
        JSON.stringify({ m, apres }));
    }
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
