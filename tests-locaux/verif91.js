/* verif91 — v89 (mission de nuit du 14/10/2026, lot 4 : qualité générale, sans rien redessiner) : chaque correction vérifiée
   dans un vrai navigateur (infrastructure de verif71 / verif88 : Supabase simulé, comptes fictifs « pNN@exemple.fr » et clients
   des fixtures ; pannes de lecture d'une clé et de la vérification du mot de passe).
   A. accueil du client : la carte « Bilan de la semaine envoyé › » est un vrai lien vers Mon suivi (avant : un <div> qui ne
      faisait rien au toucher) ;
   B. prospect : « J'ai déjà réservé » retire aussi la carte « Ton cadeau t'attend » (avant : elle restait, sans son bouton) ;
   C. en anglais, un message court (flash) s'efface après 3 s comme en français (avant : il restait) ;
   D. nombres : un petit négatif ne s'affiche plus « -0 » ni « -0,0 » ;
   E. « réduire les animations » : les défilements lancés par l'app ne sont plus doux (defilementDoux) ;
   F. plus aucun « 14 jours » (ni « 14 days ») dans la Formation (intro et module 0), en français et en anglais ;
   G. coach, « L'ajouter » (Son programme) : un exercice déjà dans la base n'est jamais écrasé (message, aucune écriture) ;
   H. « Changer mon mot de passe » : une panne du serveur ne dit plus « Ton mot de passe actuel n'est pas le bon. » ;
   I. accessibilité : les champs du bilan du vendredi et celui de UI.demander ont un nom accessible ; le bouton « + » de la
      Formation aussi ;
   J. « Afficher l'historique » hors connexion : « Pas de connexion », le bouton reste (avant : « Aucun ancien programme ») ;
   K. Profil du client hors connexion : « Pas de connexion » + Réessayer au-dessus du questionnaire (avant : il paraissait vide) ;
   T. traductions : les phrases ajoutées dans I18N.en (v89) sont toutes servies en anglais ;
   Z. aucune erreur de console ni erreur JS, aucun dialogue natif, aucun appel vers l'extérieur.
   Usage : node verif91.js ../index.html
           VERIF91_PORT=10091 node verif91.js ../index.html     (autre port, si 10090 est pris)
           VERIF91_BLOCS="A.,J." node verif91.js …               (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF91_PORT || 10090;
const BLOCS = (process.env.VERIF91_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const CAPT = process.env.VERIF91_CAPTURES ? path.resolve(process.env.VERIF91_CAPTURES) : "";
const MOBILE = { width: 390, height: 844 }, ETROIT = { width: 320, height: 700 }, ORDI = { width: 1280, height: 900 };

/* ---------- les textes légaux SERVIS (CONFIG.textes_legaux de js/config.js) : la suite remplace les 3 valeurs dans le
   fichier servi (jamais sur le disque) ; test par défaut, « à compléter » ou invalides le temps du bloc M ---------- */
const NOMS_LEGAUX = ["cgu_pdf", "confidentialite_pdf", "cgu_version"];
/* verif88 (bloc F) : le lien Instagram de la marque servi tel quel (null) ou remplacé dans le config.js servi (jamais sur le disque) */
let INSTA = null;
const LEGAUX_TEST = { cgu_pdf: "https://drive.google.com/file/d/TEST-CGU-91/view", confidentialite_pdf: "https://drive.google.com/file/d/TEST-POLITIQUE-91/view", cgu_version: "2026-10-15" };
const LEGAUX_ABSENTS = { cgu_pdf: "à compléter", confidentialite_pdf: "à compléter", cgu_version: "à compléter" };
const LEGAUX_INVALIDES = { cgu_pdf: "ftp://exemple.fr/cgu.pdf", confidentialite_pdf: "javascript:alert(91)", cgu_version: "2026-10-15" };
/* relecture (v64) : la version du texte court (DECOUVERTE.confidentialite.version), lue dans js/config.js du disque exécuté
   seul (vm) : sante_version doit en être DISTINCTE (putOk) — sinon une version prise au mauvais endroit passerait */
const VERSION_COURT = (() => { try { const ctx = {}; require("vm").runInNewContext(fs.readFileSync(path.join(path.dirname(HTML), "js", "config.js"), "utf8") + "\n;this.v = DECOUVERTE.confidentialite.version;", ctx, { timeout: 2000 }); return typeof ctx.v === "string" ? ctx.v : null; } catch (e) { return null; } })();
let LEGAUX = LEGAUX_TEST;
/* la valeur entre guillemets collée à « nom: » (la première occurrence : il n'y en a qu'une, bloc 0) */
const motifLegal = (n, g) => new RegExp("\\b(" + n + ": )\"([^\"\\n]*)\"", g ? "g" : "");
function poserLegaux(texte, valeurs){ let t = String(texte); for (const n of NOMS_LEGAUX) t = t.replace(motifLegal(n), (x, a) => a + JSON.stringify(String(valeurs[n]))); return t; }
const valeursLegales = (texte, n) => Array.from(String(texte).matchAll(motifLegal(n, true)), m => m[2]);

/* ---------- la page servie : le fichier testé (page, css/ et js/), config.js avec les textes légaux de la suite ---------- */
const { servirFichier, source } = require("./fichiers");
const server = http.createServer((req, res) => {
  if (servirFichier(req, res, HTML, t => { t = poserLegaux(t, LEGAUX); if (INSTA !== null) t = t.replace(/(\binstagram: )"https:[^"]*"/, (x, a) => a + JSON.stringify(INSTA)); return t; })) return;
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); res.end(fs.readFileSync(HTML, "utf8"));
});

/* ---------- résultats ---------- */
const res = [];
const ok = (n, c, d) => res.push((c ? "  ✓ " : "  ✗ ") + n + (c ? "" : "  — " + String(d || "").replace(/[✓✗]/g, "·").replace(/\s+/g, " ").trim().slice(0, 1200)));
function bilan(){
  const nb = res.filter(l => l.startsWith("  ✓")).length, tot = res.filter(l => /^  [✓✗] /.test(l)).length;
  console.log(res.join("\n")); console.log(nb + "/" + tot);
  if (nb < tot || tot === 0) process.exitCode = 1;
}
const ouverts = [];   // les contextes du bloc en cours : fermés à la fin du bloc, même s'il s'arrête en route
const blocsLances = [];
async function bloc(nom, fn){
  if (BLOCS.length && !BLOCS.some(x => nom.startsWith(x))) return;
  blocsLances.push(nom);
  try { await fn(); }
  catch (e) { res.push("  ✗ BLOC INTERROMPU (" + nom + ") — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); }
  finally { while (ouverts.length) await ouverts.pop().close().catch(() => {}); LEGAUX = LEGAUX_TEST; }
}

/* ---------- dates : l'horloge de chaque navigateur part de T0 = midi (heure locale) du jour du lancement ---------- */
const T0 = (() => { const d = new Date(); d.setHours(12, 0, 0, 0); return d.getTime(); })(), MIN = 60000, H = 3600000, J = 86400000;
const avant = ms => new Date(T0 - ms).toISOString();
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
const egal = (x, y) => JSON.stringify(x) === JSON.stringify(y);
/* texte comparé : espaces (insécables comprises) resserrées */
const norm = t => String(t == null ? "" : t).replace(/[\u00a0\u202f]/g, " ").replace(/\s+/g, " ").trim();

/* ---------- les textes attendus (brief V2, B, mot pour mot ; échec : DECOUVERTE.emails.refuse, contrat du lot 5) ----------
   v64 (décision de Lucas du 30/09) : la carte s'affiche aussi sur « Organise ta diète » : les repas prévus y sont ajoutés dans
   le texte, la phrase d'accord (entre parenthèses, après « calculs ») et le message après « Pas maintenant » ; le reste mot pour
   mot. En anglais, le nom de l'outil tel qu'il s'affiche (la Speed Formation n'est pas traduite) : “Organise ta diète”.
   v79 (mission de Lucas du 13/10) : + les aliments notés dans le journal alimentaire, dans les 3 textes (FR et EN), le reste
   mot pour mot. */
const SANTE = {
  fr: { titre: "Ton accord, une seule fois",
    texte: "Pour calculer tes calories et suivre ta progression, l'app enregistre ton poids, ta taille, tes mensurations, tes calculs, les repas prévus dans « Organise ta diète » et les aliments notés dans ton journal alimentaire. Ce sont des données de santé : elles restent privées, visibles seulement par toi et ton coach, et tu peux les supprimer à tout moment.",
    phrase: "J'accepte que mes données de santé (poids, taille, mensurations, calculs, repas prévus dans « Organise ta diète », aliments notés dans le journal) servent à mes calculs et à mon suivi.",
    oui: "J'accepte", non: "Pas maintenant", lien: "En savoir plus : politique de confidentialité",
    refus: "Pas de souci. Sans ton accord, le calculateur, le suivi, l'organisation de la diète et le journal alimentaire restent en pause. Le reste de ton espace reste ouvert, et tu peux changer d'avis quand tu veux.",
    echec: "Non enregistré : réessaie dans un instant." },
  en: { titre: "Your consent, just once",
    texte: "To calculate your calories and track your progress, the app saves your weight, height, measurements, results, the meals you plan in “Organise ta diète” and the foods you log in your food diary. This is health data: it stays private, visible only to you and your coach, and you can delete it at any time.",
    phrase: "I agree that my health data (weight, height, measurements, results, meals planned in “Organise ta diète”, foods logged in the diary) is used for my calculations and tracking.",
    oui: "I agree", non: "Not now", lien: "Learn more: Privacy Policy",
    refus: "No problem. Without your consent, the calculator, tracking, diet planning and food diary stay paused. The rest of your space stays open, and you can change your mind anytime.",
    echec: "Not saved: try again in a moment." }
};

/* ---------- les personnes ---------- */
const MDP = "MotDePasse-fictif-91";
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + 90 * J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: clone(meta) } : {}) });
const qui = (id, email, meta) => ({ id, email, session: session(id, email, meta) });
const COACH = qui(F.IDS.coach, "coach@exemple.fr", { prenom: "Coach", nom: "Démo" }), THOMAS = qui(F.IDS.c1, "thomas@exemple.fr", { prenom: "Thomas", nom: "Démo" });
const PID = k => "00000000-0000-4000-8000-0000000091" + String(k).padStart(2, "0");   // verif91 : …91kk (une plage par suite)
const EMAIL = k => "p" + k + "@exemple.fr";
/* métadonnées d'un prospect inscrit en v64 (une seule case : conditions, newsletter non cochée ; AUCUN accord santé) */
const META_V64 = () => ({ prenom: "Léa", nom: "Martin", consentement: avant(3 * J), conditions_version: "2026-10-01", newsletter: null, newsletter_version: "2026-09-30" });
/* un prospect inscrit de la v52 à la v63 (case « données de santé » cochée à l'inscription) */
const META_V55 = extra => Object.assign({ prenom: "Léa", nom: "Martin", consentement: avant(3 * J), conditions_version: "2026-09-29", consentement_sante: avant(3 * J), sante_version: "2026-09-28b", newsletter: null, newsletter_version: "2026-09-28c" }, extra || {});
/* le choix de la newsletter déjà recopié dans la clé emails (Accords.copierEmails n'écrit donc rien au démarrage) */
const EMAILS0 = { newsletter: false, maj: avant(3 * J), version: "2026-09-30", source: "inscription" };
const AVEC_CHOIX = k => ({ probleme: "Perdre du gras", obstacle_choix: ["temps", "craquages"], obstacle: "Le manque de temps · Je craque sur la nourriture",
  projection_choix: ["photos"], projection: "M'aimer sur les photos", objectif: "Perte de poids / sèche", objectif_auto: "Perte de poids / sèche",
  court_debut: avant(3 * J), court_le: avant(3 * J - 5 * MIN), email_compte: EMAIL(k), bilan_propose: { choix: "plus_tard", le: avant(3 * J - 4 * MIN) } });
const FO = extra => Object.assign({ coches: {}, ouvert: "", lecon: "", challenge: "", defis: {}, diete: {}, semaine: 1, jour: 0, priorites: { semaine: [], demain: [] }, notes: [], objectifs: [] }, extra || {});
const LIGNE = (f, p, g, l) => ({ f, p, g, l });
const DIETE_REMPLIE = { "1": { "0": [LIGNE(true, "30", "40", "10"), LIGNE(false, "25", "", ""), LIGNE(false, "", "", ""), LIGNE(false, "", "", ""), LIGNE(false, "", "", ""), LIGNE(false, "", "", "")] } };
const CP = { sexe: "F", age: 30, taille: 165, poids: 60, pas: 6000, heures: 3, objectif: "perte" };
const ZONES = ["Poitrine", "Épaules", "Bras gauche", "Bras droit", "Taille", "Ventre", "Hanches", "Cuisse gauche", "Cuisse droite", "Mollet"];
const MENS1 = { dstart: "2026-01-05", pstart: 70.5, zones: ZONES, affichees: [4, 5], compo_affichee: "mg", mesures: [{ sem: 1, date: "2026-01-12", poids: 70.1, vals: { "4": 80 } }] };
/* des chiffres déjà connus (ancien questionnaire) : un calculateur LANCÉ affiche aussitôt un résultat de départ */
const CHIFFRES_Q = { age: 30, taille: 165, poids: 60, sexe: "Femme", seances: 3 };
/* un prospect : opts.meta (métadonnées du compte en base ; META_V64 par défaut), opts.intake (ajouté au questionnaire),
   opts.donnees (en plus de intake et emails) */
const compte = (k, opts) => { opts = opts || {}; return { id: PID(k), prenom: "Léa", nom: "Martin", cree: avant(4 * J), email: EMAIL(k), meta: opts.meta === undefined ? META_V64() : opts.meta,
  donnees: [["intake", Object.assign(AVEC_CHOIX(k), opts.intake || {})], ["emails", EMAILS0]].concat(opts.donnees || []) }; };
/* la session de l'appareil : par défaut, les métadonnées d'un inscrit v64 (sans accord) */
const quiP = (k, meta) => qui(PID(k), EMAIL(k), meta === undefined ? META_V64() : meta);
/* le compte client de test est lu dans le fichier servi (CONFIG.nouveautes.comptes_test : un identifiant, jamais un email) */
const SRC = source(HTML);
const TEST_ID = (/comptes_test:\s*\[\s*"([0-9a-f-]{36})"/.exec(SRC) || [])[1] || null;

/* ---------- le décor : fixtures.js (coach, clients) + les comptes du bloc ----------
   comptes : [{ id, prenom, nom, statut ("prospect" par défaut), cree, email, meta, donnees: [[outil, contenu, maj_le]] }] */
function base(opts){
  opts = opts || {};
  const profils = clone(F.profils); profils.forEach(p => { if (p.role !== "coach") p.statut = "client"; });
  const donnees = clone(F.donnees);
  const db = { profils, donnees, ecritures: [], refus: [], lectures: [], authUser: [], connexions: [], renouvellements: [], bloquees: [],
    emails: { [F.IDS.coach]: "coach@exemple.fr", [F.IDS.c1]: "thomas@exemple.fr", [F.IDS.c2]: "sarah@exemple.fr", [F.IDS.c3]: "julien@exemple.fr" },
    meta: { [F.IDS.coach]: { prenom: "Coach", nom: "Démo" }, [F.IDS.c1]: { prenom: "Thomas", nom: "Démo" }, [F.IDS.c2]: { prenom: "Sarah", nom: "Démo" }, [F.IDS.c3]: { prenom: "Julien", nom: "Démo" } },
    panneToken: false, panneLecture: null, panneEcriture: null, retardEcriture: 0, ecrituresRatees: [],
    panneGet: null, pannePut: null, retardPut: 0, retardGet: 0, retardMajLe: null, majLeLents: [],
    /* n : numéro d'ordre commun aux lectures et aux écritures de donnees (qui passe avant qui) ; getsLents : les réponses
       des GET /auth/v1/user retardés (métadonnées LUES À L'ARRIVÉE de la requête) ; putsFinis : l'instant de chaque réponse
       réussie d'un PUT /auth/v1/user */
    n: 0, getsLents: [], putsFinis: [] };
  for (const x of opts.comptes || []) {
    profils.push({ id: x.id, prenom: x.prenom, nom: x.nom || "", role: "client", statut: x.statut || "prospect", cree_le: x.cree || avant(J) });
    if (x.email) db.emails[x.id] = x.email;
    db.meta[x.id] = clone(x.meta || {});
    for (const [outil, contenu, maj] of x.donnees || []) donnees.push({ user_id: x.id, outil, contenu: clone(contenu), maj_le: maj || avant(H) });
  }
  return db;
}

/* ---------- le faux Supabase (gabarit de verif68) + les métadonnées du compte ---------- */
const MAX_LIGNES = 1000;
/* règles de la base (HANDOFF §2.3, policies v49). Une migration qui change une règle change ces listes dans le même chantier. */
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
const appelant = req => { const m = /^Bearer (?:jeton-|lien\.)([0-9a-f-]{36})/.exec(req.headers()["authorization"] || ""); return m ? m[1] : null; };
const lireDonnees = f => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "donnees", f), "utf8"));
const CATALOGUE = Object.assign({}, F.catalogue, { aliments: lireDonnees("aliments.json"), recettes: lireDonnees("recettes.json") });
async function repondre(r, who, db, appareil){
  const req = r.request(), u = req.url(), host = new URL(u).hostname;
  if (host === "localhost") return r.continue();
  if (host === "www.youtube-nocookie.com") return r.fulfill({ status: 200, contentType: "text/html", body: "<html><body></body></html>" }).catch(() => {});
  if (!host.endsWith(".supabase.co")) { externes.add(host); return r.abort().catch(() => {}); }   // polices, vignettes… : rien ne sort
  const url = new URL(u), p = url.pathname, q = url.searchParams, m = req.method();
  /* appareil hors ligne (couper) : la requête ne part pas (le gestionnaire de routes de Playwright répond même quand le
     contexte est hors ligne : c'est donc ici qu'elle échoue, sans jamais atteindre le serveur) */
  if (appareil && appareil.horsLigne) { db.bloquees.push(m + " " + p); return r.abort("internetdisconnected").catch(() => {}); }
  const json = (body, status) => r.fulfill({ status: status || 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: body === null ? "" : JSON.stringify(body) }).catch(() => {});
  const plage = l => { l = ordonner(l, q.get("order")); const rg = req.headers()["range"]; if (rg) { const [a, z] = rg.split("-").map(Number); l = l.slice(a, z + 1); } return l.slice(0, MAX_LIGNES); };
  const corps = () => { try { return JSON.parse(req.postData() || "null"); } catch (e) { return null; } };
  if (m === "OPTIONS") return r.fulfill({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "*" }, body: "" });
  const moi = appelant(req) || (who && who.id) || null;
  const coach = !!moi && db.profils.some(x => x.id === moi && x.role === "coach");
  /* jetons : connexion par mot de passe (les métadonnées de la base) ; renouvellement (idem) — jamais comptés comme écriture */
  if (p.startsWith("/auth/v1/token")) {
    const c = corps() || {};
    if (q.get("grant_type") === "password") {
      /* verif91 (bloc H) : la vérification du mot de passe en panne (500) tant que db.panneToken est vrai */
      if (db.panneToken) return json({ message: "panne simulée" }, 500);
      const e = String(c.email || "").trim().toLowerCase(); db.connexions.push(e);
      const id = Object.keys(db.emails).find(x => db.emails[x] === e);
      if (!id || c.password !== MDP) return json({ error: "invalid_grant", error_description: "Invalid login credentials" }, 400);
      return json(session(id, db.emails[id], db.meta[id]));
    }
    const r1 = /^renouvellement-(.+)$/.exec(String(c.refresh_token || "")), id = r1 && r1[1];
    db.renouvellements.push(id);
    if (!id) return json({ error: "invalid_grant", error_description: "Invalid Refresh Token" }, 400);
    return json(session(id, db.emails[id] || "", db.meta[id]));
  }
  if (p === "/rest/v1/rpc/noter_connexion") return json(null, 204);
  /* le compte : GET rend les métadonnées de la base ; PUT { data } les FUSIONNE (null supprime la clé) et les rend. Pannes :
     un statut (400, 500…), "coupure" (réseau coupé), pour le GET "vide" ({}) ou "sans" (sans user_metadata), pour le PUT
     "sans accord" (200, les métadonnées du compte SANS rien fusionner). Lenteurs : retardPut (fusion à la fin du délai),
     retardGet (métadonnées lues à l'ARRIVÉE de la requête, rendues à la fin du délai : une réponse périmée) */
  if (p === "/auth/v1/user") {
    const c = corps();
    db.authUser.push({ m, par: moi, corps: clone(c), q: url.search });
    if (!moi) return json({ msg: "invalid JWT" }, 401);
    const panne = m === "GET" ? db.panneGet : db.pannePut;
    if (panne === "coupure") return r.abort("failed").catch(() => {});
    if (typeof panne === "number") return json({ msg: "panne simulée", code: panne }, panne);
    if (m === "GET" && db.retardGet) {
      const lu = clone(db.meta[moi] || {}), ms = db.retardGet;
      await new Promise(k => setTimeout(k, ms));
      db.getsLents.push({ meta: clone(lu), t: Date.now() });
      return json({ id: moi, email: db.emails[moi] || "", role: "authenticated", user_metadata: lu });
    }
    if (m === "PUT" && db.retardPut) await new Promise(k => setTimeout(k, db.retardPut));
    const meta = db.meta[moi] || (db.meta[moi] = {});
    const uu = { id: moi, email: db.emails[moi] || "", role: "authenticated" };
    if (m === "PUT" && panne === "sans accord") return json(Object.assign(uu, { user_metadata: clone(meta) }));
    if (m === "PUT" && c && c.data && typeof c.data === "object") Object.keys(c.data).forEach(k => { if (c.data[k] === null) delete meta[k]; else meta[k] = clone(c.data[k]); });
    if (m === "PUT") db.putsFinis.push(Date.now());
    if (m === "GET" && panne === "vide") return json({});
    if (m === "GET" && panne === "sans") return json(uu);
    return json(Object.assign(uu, { user_metadata: clone(meta) }));
  }
  if (p.startsWith("/auth/v1/")) return json({});   // logout…
  if (!["GET", "HEAD"].includes(m) && p !== "/rest/v1/donnees" && p !== "/rest/v1/profils") db.ecritures.push({ table: p, m, corps: corps() });
  if (p.startsWith("/functions/v1/")) return json({ ok: true });
  if (p.startsWith("/storage/v1/")) return m === "GET" ? json({ message: "Object not found" }, 404) : json({ Key: p });
  if (p === "/rest/v1/emails_prospects") return json([]);
  if (p === "/rest/v1/profils") {
    const id = (q.get("id") || "").replace(/^eq\./, "");
    if (m === "GET" || m === "HEAD") { let l = db.profils.filter(x => coach || x.id === moi); if (id) l = l.filter(x => x.id === id); return json(colonnes(plage(l), q)); }
    const c = corps() || {}, cible = db.profils.find(x => x.id === id);
    db.ecritures.push({ table: "profils", m, id, corps: clone(c) });
    if (!cible || !(coach || id === moi)) { db.refus.push({ table: "profils", m, id }); return json([]); }
    if (!coach && (("role" in c && c.role !== cible.role) || ("statut" in c && c.statut !== cible.statut))) { db.refus.push({ table: "profils", m, id }); return json({ code: "P0001", message: "Seul un coach peut changer un rôle ou un statut." }, 400); }
    Object.assign(cible, c);
    return json((req.headers()["prefer"] || "").includes("return=representation") ? [cible] : null, 200);
  }
  if (p === "/rest/v1/donnees") {
    const uid = (q.get("user_id") || "").replace(/^eq\./, ""), o = q.get("outil") || "", mj = q.get("maj_le");
    const cleEq = o.startsWith("eq.") ? o.slice(3) : null;
    if (m === "GET" || m === "HEAD") {
      db.lectures.push({ par: moi, uid, outil: o, select: q.get("select") || "*", n: ++db.n });
      /* verif88 (bloc A) : toute lecture d'une clé en panne (500) tant que db.panneLecture porte son nom */
      if (db.panneLecture && o.includes(db.panneLecture)) return json({ message: "panne simulée" }, 500);
      /* reprise lente (bloc V) : la lecture maj_le d'une clé (celle de Store.reprendre) répond après ms (minuteur qui ne
         retient pas la fin de la suite) ; majLeLents : l'instant de chaque réponse */
      if (db.retardMajLe && (q.get("select") || "") === "maj_le" && o === "eq." + db.retardMajLe.outil) {
        const ms = db.retardMajLe.ms; await new Promise(k => setTimeout(k, ms).unref()); db.majLeLents.push(Date.now());
      }
      let l = db.donnees.filter(x => coach || (x.user_id === moi && !ILLISIBLES_PROPRIO.includes(x.outil)));
      if (uid) l = l.filter(x => x.user_id === uid);
      return json(colonnes(plage(parOutil(l, o)), q));
    }
    /* verif88 (blocs B et C) : toute écriture d'une clé en panne (500, après db.retardEcriture ms) tant que db.panneEcriture porte son nom */
    if ((m === "POST" || m === "PATCH") && db.panneEcriture && (cleEq === db.panneEcriture || String(req.postData() || "").includes('"outil":"' + db.panneEcriture + '"'))) {
      db.ecrituresRatees.push({ m, outil: db.panneEcriture }); if (db.retardEcriture) await new Promise(k => setTimeout(k, db.retardEcriture));
      return json({ message: "panne simulée" }, 500);
    }
    if (m === "POST") {
      let rows = corps(); rows = Array.isArray(rows) ? rows : rows ? [rows] : [];
      const refuse = rows.find(row => !permis(moi, coach, row));
      if (refuse) { db.refus.push({ table: "donnees", m, user_id: refuse.user_id, outil: refuse.outil }); return json({ code: "42501", message: 'new row violates row-level security policy for table "donnees"' }, 403); }
      const upsert = q.has("on_conflict"), out = [];
      for (const row of rows) {
        const i = db.donnees.findIndex(x => x.user_id === row.user_id && x.outil === row.outil);
        if (i > -1 && !upsert) return json({ code: "23505", message: "duplicate key value violates unique constraint" }, 409);
        const ligne = { user_id: row.user_id, outil: row.outil, contenu: clone(row.contenu), maj_le: row.maj_le || new Date().toISOString() };
        if (i > -1) db.donnees[i] = ligne; else db.donnees.push(ligne);
        db.ecritures.push(Object.assign({ table: "donnees", m, n: ++db.n }, clone(ligne)));
        out.push(ligne);
      }
      return (req.headers()["prefer"] || "").includes("return=representation") ? json(out, 201) : json(null, 201);
    }
    if (m === "PATCH") {
      const c = corps() || {};
      const row = db.donnees.find(x => x.user_id === uid && x.outil === cleEq && (mj == null || (mj === "is.null" ? !x.maj_le : (mj.startsWith("eq.") && x.maj_le === mj.slice(3)))));
      if (!row) return json([]);
      if (!permis(moi, coach, row)) { db.refus.push({ table: "donnees", m, user_id: uid, outil: cleEq }); return json([]); }
      Object.assign(row, { contenu: clone(c.contenu), maj_le: c.maj_le || new Date().toISOString() });
      db.ecritures.push(Object.assign({ table: "donnees", m }, clone(row)));
      return json([row]);
    }
    db.ecritures.push({ table: "donnees", m, user_id: uid, outil: cleEq });   // DELETE : jamais attendu (zéro perte), noté
    db.donnees = db.donnees.filter(x => !(x.user_id === uid && x.outil === cleEq && permis(moi, coach, x)));
    return json(null, 204);
  }
  if (p === "/rest/v1/bibliotheque") return m === "GET" ? json(coach ? colonnes(plage(clone(F.bibliotheque)), q) : []) : json(null, 204);
  const t = p.replace("/rest/v1/", "");
  if (CATALOGUE[t]) return m === "GET" ? json(colonnes(plage(CATALOGUE[t]), q)) : json(null, 201);
  return json([]);
}

/* ---------- un navigateur (contexte) pour une personne, horloge contrôlée ----------
   opts : viewport (MOBILE par défaut : 390 px), langue ("en"), theme ("light" : un ancien choix « clair » rangé dans
   mhx_theme, que la v80 ignore — tout en sombre ; rien de rangé par défaut), rangement ("session" :
   « Rester connecté » décoché, la session dans sessionStorage) */
const ERREURS = [];   // erreurs de console et erreurs JS de toute la suite (bloc Z)
async function contexte(b, who, db, opts){
  opts = opts || {};
  const c = await b.newContext({ viewport: opts.viewport || MOBILE });
  ouverts.push(c);
  c.setDefaultTimeout(8000);
  const appareil = { horsLigne: false };
  await c.route("**/*", r => repondre(r, who, db, appareil));
  await c.addInitScript(({ s, langue, theme, rangement }) => {
    if (!/^https?:$/.test(location.protocol) || location.hostname !== "localhost") return;
    if (!localStorage.getItem("__init")) {
      localStorage.setItem("__init", "1");
      if (s) (rangement === "session" ? sessionStorage : localStorage).setItem("mhx_session", JSON.stringify(s));
      localStorage.setItem("mhx_installe", "1"); localStorage.setItem("mhx_visites", "3");
      if (langue) localStorage.setItem("mhx_langue", langue);
      if (theme) localStorage.setItem("mhx_theme", theme);
    }
  }, { s: who ? who.session : null, langue: opts.langue || "", theme: opts.theme || "", rangement: opts.rangement || "" });
  await c.clock.install({ time: T0 });   // midi du jour du lancement, puis l'horloge tourne
  const page = surveiller(await c.newPage());
  return { c, page, appareil };
}
/* l'appareil passe hors ligne (navigator.onLine faux, événements offline / online) ou revient */
async function couper(x, oui){ x.appareil.horsLigne = !!oui; await x.c.setOffline(!!oui); }
function surveiller(page){
  page.on("pageerror", e => { ERREURS.push("JS " + String(e).slice(0, 200)); res.push("  ✗ ERREUR JS " + String(e).slice(0, 300)); });
  /* une ressource refusée (4xx/5xx simulés), une requête coupée ou hors ligne (simulés) : le navigateur le note, ce n'est
     pas une erreur de l'app */
  page.on("console", msg => { if (msg.type() === "error" && !/ERR_FAILED|ERR_INTERNET_DISCONNECTED|status of [45]\d\d/.test(msg.text())) { ERREURS.push("CONSOLE " + msg.text().slice(0, 200)); res.push("  ✗ CONSOLE " + msg.text().slice(0, 200)); } });
  page.on("dialog", d => { ERREURS.push("DIALOGUE " + d.message().slice(0, 80)); res.push("  ✗ DIALOGUE NATIF " + d.message().slice(0, 80)); d.dismiss(); });
  return page;
}

/* ---------- aides ---------- */
const attendre = (page, ms) => page.waitForTimeout(ms);
/* attend (côté suite) qu'une condition sur le faux Supabase devienne vraie ; faux au bout de ms */
const attendreQue = async (f, ms) => { const fin = Date.now() + (ms || 5000); while (Date.now() < fin) { if (f()) return true; await new Promise(r => setTimeout(r, 100)); } return !!f(); };
async function pret(page, sel){
  await page.waitForFunction(() => typeof appPrete !== "undefined" && appPrete === true, null, { timeout: 10000 });
  if (sel) await page.waitForSelector(sel, { timeout: 10000 });
  await attendre(page, 400);
}
const URL0 = `http://localhost:${PORT}/`;
const aller = async (page, h, ms) => { await page.evaluate(x => { location.hash = x; }, h); await attendre(page, ms || 1500); };
const ACCUEIL = "#/decouverte";   // l'accueil du prospect (#/accueil le mène là)
const ecr = (db, outil, uid) => db.ecritures.filter(e => e.table === "donnees" && e.outil === outil && (!uid || e.user_id === uid));
/* les écritures en base, hors compteur de visites du prospect (clé activite) */
const saisies = (db, uid) => db.ecritures.filter(e => !(e.table === "donnees" && e.outil === "activite") && (!uid || e.user_id === uid || e.id === uid));
const resume = db => JSON.stringify(saisies(db).map(e => (e.table === "donnees" ? e.outil : e.table) + ":" + e.m));
const contenuDe = (db, uid, outil) => (db.donnees.find(d => d.user_id === uid && d.outil === outil) || {}).contenu;
const rangees = (db, uid) => JSON.stringify(db.donnees.filter(d => d.user_id === uid).map(d => [d.outil, d.contenu, d.maj_le]).sort((a, b) => a[0] < b[0] ? -1 : 1));
/* les appels /auth/v1/user (m : "GET" / "PUT"), depuis n0 */
const auth = (db, m, n0) => db.authUser.slice(n0 || 0).filter(x => !m || x.m === m);
/* les lectures de clés de santé (calc_perso, calc, mens : lecture seule ou groupée) depuis n0 */
const SANTE_CLES = /\b(calc_perso|calc|mens)\b/;
const lusSante = (db, n0) => db.lectures.slice(n0 || 0).filter(l => SANTE_CLES.test(l.outil));
/* une diète écrite avec une ligne (squelette compris) */
const avecDiete = e => !!(e && e.contenu && e.contenu.diete && Object.keys(e.contenu.diete).length);
/* l'état de Sante dans la page (null si l'objet n'existe pas : ancienne version) */
const santeEtat = page => page.evaluate(() => { try { return { a: Sante.aDemander(), ok: Sante.ok(), consulte: Store.idConsulte || null }; } catch (e) { return { erreur: String((e && e.message) || e).slice(0, 80) }; } });
/* la garde du stockage (Sante.bloque) pour des mesures et un calcul chiffré : { mens, calc } (vrai = bloqué) ; null si l'objet
   n'existe pas (ancienne version) */
const garde = page => page.evaluate(() => { try { return { mens: Sante.bloque("mens", { mesures: [{ poids: 70 }] }), calc: Sante.bloque("calc_perso", { age: 30, poids: 60 }) }; } catch (e) { return null; } });
const gardeOuverte = G => !!G && G.mens === false && G.calc === false;
/* le stockage de l'appareil : clés, session rangée (jetons, métadonnées), métadonnées de la session en mémoire */
const stockage = page => page.evaluate(() => {
  const l = [];
  for (const [nom, m] of [["local", localStorage], ["session", sessionStorage]]) { try { for (let i = 0; i < m.length; i++) l.push(nom + ":" + m.key(i)); } catch (e) { l.push(nom + ":illisible"); } }
  const lire = m => { try { return JSON.parse(m.getItem("mhx_session") || "null"); } catch (e) { return "illisible"; } };
  const sl = lire(localStorage), ss = lire(sessionStorage), s = sl || ss;
  let u = null; try { u = Auth.utilisateur(); } catch (e) {}
  let inv = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/invitations/.test(k)) inv.push(localStorage.getItem(k)); } } catch (e) {}
  return { cles: l, enLocal: !!sl, enSession: !!ss, rangee: s && typeof s === "object" ? { access: s.access_token, refresh: s.refresh_token, meta: s.user ? s.user.user_metadata : undefined } : null,
    memoire: u ? (u.user_metadata === undefined ? null : u.user_metadata) : "sans session", invitations: inv.join(" | ") };
});
/* rien en file pour la santé : aucune copie mhx_attente|…|calc_perso ou mens, aucune clé d'accord sur l'appareil */
const copiesSante = S => S.cles.filter(k => /mhx_attente\|.*\|(calc_perso|mens)$/.test(k) || /sante|consentement/i.test(k));
const invitSante = S => /declic_calculateur|declic_premiere_pesee/.test(S.invitations);
const nbInvitations = page => page.evaluate(() => document.querySelectorAll(".invitation, [data-invitation]").length);


/* ---------- verif91 : aides ---------- */
const isoJ = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const lundiDe = t => { const d = new Date(t); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; };
const ckC1 = () => clone(F.donnees.find(x => x.user_id === F.IDS.c1 && x.outil === "checkins").contenu);
const attendreSel91 = async (page, sel, ms) => { try { await page.waitForSelector(sel, { timeout: ms || 6000 }); return true; } catch (e) { return false; } };
/* les phrases ajoutées par la v89 dans I18N.en, lues dans le js/i18n.js servi (entre les deux marqueurs) */
const TRAD89 = (() => {
  const t = SRC, a = t.indexOf("/* v89-traductions-debut */"), z = t.indexOf("/* v89-traductions-fin */");
  if (a < 0 || z < a) return null;
  const bloc = t.slice(a, z), out = [];
  for (const m of bloc.matchAll(/^\s*("(?:[^"\\]|\\.)*")\s*:\s*("(?:[^"\\]|\\.)*")\s*,?\s*$/gm)) { try { out.push([JSON.parse(m[1]), JSON.parse(m[2])]); } catch (e) {} }
  return out;
})();

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF91_PORT=10091 node verif91.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. la carte « Bilan de la semaine envoyé » =================== */
  await bloc("A. carte du bilan envoyé", async () => {
    const db = base();
    const ck = ckC1(), e0 = ck.liste[0], l = lundiDe(T0), dim = new Date(l); dim.setDate(l.getDate() + 6);
    if (!ck.liste.some(x => x.semaine === isoJ(l))) ck.liste.unshift(Object.assign(clone(e0), { semaine: isoJ(l), fin: isoJ(dim), envoye_le: avant(2 * H) }));
    db.donnees.find(x => x.user_id === F.IDS.c1 && x.outil === "checkins").contenu = ck;
    const { page } = await contexte(b, THOMAS, db);
    await page.goto(URL0 + "#/accueil"); await pret(page); await attendre(page, 800);
    const c = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll("#vue .acces.fait")).find(x => /Bilan de la semaine envoyé/.test(x.textContent));
      return el ? { tag: el.tagName, href: el.getAttribute("href"), fleche: !!el.querySelector(".fleche") } : null;
    });
    let hash = null;
    if (c && c.tag === "A") { await page.click("#vue a.acces.fait"); await attendre(page, 1200); hash = await page.evaluate(() => location.hash); }
    ok("A1 : accueil du client, bilan de la semaine envoyé : la carte « Bilan de la semaine envoyé › » est un vrai lien (<a href=\"#/suivi\">) et ouvre Mon suivi",
      !!c && c.tag === "A" && c.href === "#/suivi" && c.fleche && hash === "#/suivi", JSON.stringify([c, hash]));
  });

  /* =================== B. la carte cadeau après « J'ai déjà réservé » =================== */
  await bloc("B. carte cadeau", async () => {
    const k = 1, db = base({ comptes: [compte(k, { meta: META_V64(), intake: { parcours_le: avant(J) } })] });
    const { page } = await contexte(b, quiP(k, META_V64()), db);
    await page.goto(URL0 + "#/accueil"); await pret(page); await attendre(page, 800);
    const avant1 = await page.evaluate(() => ({ cadeau: !!document.getElementById("dc-cadeau"), cases: !!document.getElementById("dc-reserve-case") }));
    if (avant1.cases) { await page.click("#dc-reserve-case"); await attendre(page, 1500); }
    const apres = await page.evaluate(() => ({ cadeau: !!document.getElementById("dc-cadeau"), reserve: !!document.getElementById("dc-reserve-ok") || !!document.getElementById("dc-reserve-haut") }));
    ok("B1 : prospect arrivé par le parcours : « J'ai déjà réservé » coché, la carte « Ton cadeau t'attend » disparaît aussitôt (sans bouton, elle n'a plus de sens)",
      avant1.cadeau && avant1.cases && !apres.cadeau, JSON.stringify([avant1, apres]));
  });

  /* =================== C. message court en anglais =================== */
  await bloc("C. flash en anglais", async () => {
    const k = 2, db = base({ comptes: [compte(k, { meta: META_V64(), donnees: [["prefs", { langue: "en" }]] })] });
    const { page } = await contexte(b, quiP(k, META_V64()), db, { langue: "en" });
    await page.goto(URL0 + "#/accueil"); await pret(page); await attendre(page, 500);
    const r = await page.evaluate(async () => {
      const d = document.createElement("p"); d.id = "t91"; document.getElementById("vue").appendChild(d);
      flash("t91", "Enregistré");
      await new Promise(k => setTimeout(k, 600)); const pendant = d.textContent;
      await new Promise(k => setTimeout(k, 3300)); return { pendant, apres: d.textContent, en: I18N.langue };
    });
    ok("C1 : en anglais, « Saved » (flash) s'affiche puis s'efface au bout de 3 s, comme en français", r.en === "en" && r.pendant === "Saved" && r.apres === "", JSON.stringify(r));
  });

  /* =================== D. E. F. nombres, défilement, « 14 jours » =================== */
  await bloc("D. nombres, défilement, 14 jours", async () => {
    const db = base();
    const x = await contexte(b, THOMAS, db), page = x.page;
    await page.goto(URL0 + "#/accueil"); await pret(page);
    const d = await page.evaluate(() => ({ a: fmt(-0.4), b: n1(-0.04), c: fmt(-3.6), e: n1(2.25) }));
    ok("D1 : un petit nombre négatif s'affiche « 0 » et « 0,0 » (plus « -0 » ni « -0,0 ») ; les autres nombres ne changent pas (-4, 2,3)", d.a === "0" && d.b === "0,0" && d.c === "-4" && /^2,[23]$/.test(d.e), JSON.stringify(d));
    const sans = await page.evaluate(() => typeof defilementDoux === "function" ? defilementDoux() : null);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const avec = await page.evaluate(() => typeof defilementDoux === "function" ? defilementDoux() : null);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const smooth = (SRC.match(/behavior: ?"smooth"/g) || []).length;
    ok("E1 : « réduire les animations » demandé : les défilements lancés par l'app ne sont plus doux (« auto ») ; sinon doux (« smooth ») ; plus aucun behavior: \"smooth\" écrit en dur dans js/",
      sans === "smooth" && avec === "auto" && smooth === 0, JSON.stringify([sans, avec, smooth]));
    const f = await page.evaluate(() => { const fr = JSON.stringify(FORMATION), en = Object.keys(I18N.en).filter(k => fr.includes(k)).map(k => I18N.en[k]).join(" "); return { fr: /14 jours/.test(fr), en: /14 days/i.test(en), intro: FORMATION.intro.slice(0, 50) }; });
    ok("F1 : plus aucun « 14 jours » dans la Formation (intro « Une méthode simple pour poser les bases : … », module 0), ni « 14 days » dans leur anglais", !f.fr && !f.en, JSON.stringify(f));
  });

  /* =================== G. « L'ajouter » n'écrase pas un exercice de la base =================== */
  await bloc("G. L'ajouter", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/tableau"); await pret(page);
    const r = await page.evaluate(async () => {
      const l = await Catalogue.exercices(); const e = (l || []).find(x => x && x.id && x.nom);
      if (!e) return { erreur: "aucun exercice" };
      let msg = "";
      try { await Catalogue.ajouterExercice("  " + e.nom.toUpperCase() + " ", "https://www.youtube.com/watch?v=abcdefghijk", ""); msg = "ajouté"; } catch (er) { msg = String(er && er.message); }
      return { nom: e.nom, msg };
    });
    const posts = db.ecritures.filter(e => e.table === "/rest/v1/exercices").length;
    ok("G1 : « L'ajouter » avec le nom d'un exercice déjà dans la base (majuscules et espaces près) : « … est déjà dans ta base : choisis-le dans la liste. », rien n'est écrit (sa vidéo et son groupe ne sont jamais écrasés)",
      /est déjà dans ta base : choisis-le dans la liste\.$/.test(r.msg || "") && posts === 0, JSON.stringify([r, posts]));
  });

  /* =================== H. changer son mot de passe pendant une panne =================== */
  await bloc("H. mot de passe et panne", async () => {
    const db = base(); db.panneToken = true;
    const { page } = await contexte(b, THOMAS, db);
    await page.goto(URL0 + "#/accueil"); await pret(page);
    const m = await page.evaluate(async () => { try { await Auth.changerMotDePasse("AncienMotDePasse-fictif-91", "NouveauMotDePasse-fictif-91"); return "changé"; } catch (e) { return String(e && e.message); } });
    ok("H1 : vérification du mot de passe en panne (500) : « Pas de connexion pour l'instant : ton mot de passe n'a pas changé. Réessaie dans un instant. » (plus « Ton mot de passe actuel n'est pas le bon. »)",
      m === "Pas de connexion pour l'instant : ton mot de passe n'a pas changé. Réessaie dans un instant." && !auth(db, "PUT").length, JSON.stringify([m, auth(db).map(a => a.m)]));
  });

  /* =================== I. accessibilité =================== */
  await bloc("I. noms accessibles", async () => {
    const db = base();
    const { page } = await contexte(b, THOMAS, db);
    await page.goto(URL0 + "#/accueil"); await pret(page);
    const r = await page.evaluate(async () => {
      const d = document.createElement("div");
      d.innerHTML = [Checkin.champ({ id: "q1", type: "nombre", label: "Séances" }, ""), Checkin.champ({ id: "q2", type: "select", label: "Énergie", options: ["Bonne"] }, ""), Checkin.champ({ id: "q3", type: "texte", label: "Ta semaine" }, "")].join("");
      const ch = Array.from(d.querySelectorAll("input, select, textarea")).map(x => x.getAttribute("aria-label"));
      const p = UI.demander("Sous quel nom ?", "", {});
      await new Promise(k => setTimeout(k, 100));
      const inp = document.getElementById("ui-champ"), lb = inp ? inp.getAttribute("aria-labelledby") : null, corps = lb ? (document.getElementById(lb) || {}).textContent : null;
      UI.fermer(null); await p;
      return { ch, lb, corps };
    });
    const plus = /data-pb="\$\{cle\}" aria-label="Ajouter">\+<\/button>/.test(SRC);
    ok("I1 : les 3 sortes de champs du bilan du vendredi portent leur question (aria-label) ; le champ de UI.demander est nommé par sa question (aria-labelledby) ; le bouton « + » de la Formation s'appelle « Ajouter »",
      JSON.stringify(r.ch) === JSON.stringify(["Séances", "Énergie", "Ta semaine"]) && r.lb === "ui-corps" && r.corps === "Sous quel nom ?" && plus, JSON.stringify([r, plus]));
  });

  /* =================== J. K. hors connexion =================== */
  await bloc("J. historique hors connexion", async () => {
    const db = base(); db.panneLecture = "hist_programme";
    const { page } = await contexte(b, THOMAS, db);
    await page.goto(URL0 + "#/programme"); await pret(page); await attendre(page, 800);
    const vu = await attendreSel91(page, "[data-hist-ouvrir]", 6000);
    if (vu) { await page.click("[data-hist-ouvrir]"); await attendre(page, 1500); }
    const r = await page.evaluate(() => { const bt = document.querySelector("[data-hist-ouvrir]"), l = document.querySelector("[data-hist-liste]"); return { bouton: !!bt && !bt.hidden && !bt.disabled, texte: l ? l.textContent.replace(/\s+/g, " ").trim() : null }; });
    ok("J1 : « Afficher l'historique » quand sa lecture échoue : « Pas de connexion : tes données n'ont pas pu être chargées. », le bouton reste pour réessayer (plus « Aucun ancien programme »)",
      vu && r.bouton && /^Pas de connexion/.test(r.texte || "") && !/Aucun ancien/.test(r.texte || ""), JSON.stringify(r));
  });
  await bloc("K. profil hors connexion", async () => {
    const db = base(); db.panneLecture = "intake";
    const { page } = await contexte(b, THOMAS, db);
    await page.goto(URL0 + "#/profil"); await pret(page); await attendre(page, 1200);
    const r = await page.evaluate(() => { const f = document.getElementById("page-hors-ligne"); return { flag: !!f, texte: f ? f.textContent.replace(/\s+/g, " ").trim() : null, reessayer: !!(f && f.querySelector("[data-reessayer]")), hash: location.hash }; });
    ok("K1 : Profil du client quand le questionnaire ne se lit pas : « Pas de connexion » + Réessayer sous l'en-tête ; rien n'est écrit",
      r.flag && /^Pas de connexion/.test(r.texte || "") && r.reessayer && r.hash === "#/profil" && ecr(db, "intake").length === 0, JSON.stringify([r, ecr(db, "intake").length]));
  });

  /* =================== T. traductions =================== */
  await bloc("T. traductions", async () => {
    const k = 3, db = base({ comptes: [compte(k, { meta: META_V64(), donnees: [["prefs", { langue: "en" }]] })] });
    const { page } = await contexte(b, quiP(k, META_V64()), db, { langue: "en" });
    await page.goto(URL0 + "#/accueil"); await pret(page);
    const r = await page.evaluate(L => { const faux = (L || []).filter(([fr, en]) => trad(fr) !== en); return { n: (L || []).length, faux: faux.slice(0, 5) }; }, TRAD89);
    ok("T1 : les phrases ajoutées par la v89 dans I18N.en (Formation, programmes de la formation, compléments, collations, courses, bannière d'installation, messages du compte…) sont toutes servies en anglais (au moins 60)",
      !!TRAD89 && r.n >= 60 && r.faux.length === 0, JSON.stringify(r));
  });

  /* =================== Z. console, hôtes externes =================== */
  await bloc("Z. console et hôtes externes", async () => {
    const autres = Array.from(externes).filter(h => !/^(fonts\.(googleapis|gstatic)\.com|i\.ytimg\.com|img\.youtube\.com)$/.test(h));
    ok("Z1 : aucune erreur de console ni erreur JS ni dialogue natif pendant la suite, aucun appel vers l'extérieur",
      ERREURS.length === 0 && autres.length === 0, JSON.stringify(ERREURS.slice(0, 5)) + " " + JSON.stringify(autres));
  });

  await b.close(); server.close();
  bilan();
})().catch(e => { res.push("  ✗ SUITE INTERROMPUE — " + String((e && e.message) || e).split("\n")[0].slice(0, 160)); bilan(); process.exit(1); });
