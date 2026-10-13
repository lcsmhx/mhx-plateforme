/* verif88 — v86 (mission de nuit du 14/10/2026, lot 1 : sécurité) : les corrections de l'audit, chacune vérifiée de bout en bout
   (infrastructure de verif71 : Supabase simulé, comptes fictifs « pNN@exemple.fr » et clients des fixtures ; plus des pannes de
   lecture et d'écriture d'une clé, et le lien Instagram du config.js servi remplacé par la suite, jamais sur le disque).
   A. parcours du prospect : si l'enregistrement de ses réponses rate encore au toucher final (« Plus tard » ou « Je réserve »),
      elles restent dans l'onglet, un message le dit, la page n'est pas rechargée ; le toucher suivant (réseau revenu) les
      enregistre dans intake puis recharge (avant : réponses effacées sans un mot) ;
   B. notes privées du coach : l'envoi échoue alors que la fiche est déjà fermée → une fenêtre le dit, avec le texte à copier
      (avant : message écrit dans un élément disparu, texte perdu) ;
   C. feedback du coach : même chose (« Feedback non enregistré ») ;
   D. « Se déconnecter » dans un onglet : l'autre onglet ouvert sur le même compte est rechargé, sans session (avant : il restait
      ouvert sur l'espace) ; un simple renouvellement de session dans l'autre onglet ne déconnecte rien ;
   E. noms choisis par un client (« __proto__ », « constructor ») : la liste de courses ne touche plus aux objets communs de la
      page, les charges de « Préparer le call » ne plantent plus ;
   F. lien Instagram du pied de page passé par lienSur() et esc() : une valeur « javascript:… » ne donne jamais un lien actif ;
   G. liens du bandeau de la fiche : l'identifiant consulté est échappé (aucun attribut ajouté, même avec des guillemets) ;
   H. garde du dépôt : un secret dans un fichier suivi (jeton GitHub, clé service_role…) arrête le banc, sans jamais être recopié
      dans le journal ; la clé publique (anon) passe ; « Claude outputs/ » est ignoré par git ;
   I. « Créer un accès » (et « Supprimer un compte ») : un jeton qui expire est d'abord renouvelé (avant : « Session expirée »
      trompeur après une mise en veille) ;
   J. une ligne écrite par un compte avec la clé « __proto__ » (faux suivi « archivé ») ne fait plus disparaître ce prospect de la
      liste du coach (aucune fausse clé du coach lue) ;
   K. « Organise ta diète » : une semaine ou un jour piégés dans le document ne touchent plus aux objets communs de la page ;
   L. une copie hors ligne écartée parce que la date en base est illisible (« infinity ») : le message le dit ;
   Z. aucune erreur de console ni erreur JS, aucun dialogue natif, aucun appel vers l'extérieur.
   Sur la version d'avant (v85) : A, B, C, D1, E, F1, G, H, I, J, K, L en échec.
   Usage : node verif88.js ../index.html
           VERIF88_PORT=10051 node verif88.js ../index.html     (autre port, si 10050 est pris)
           VERIF88_BLOCS="A.,D." node verif88.js …               (seulement les blocs dont le nom commence ainsi) */
const { chromium } = require("playwright"); const fs = require("fs"); const http = require("http"); const path = require("path");
const F = require("./fixtures");
const HTML = path.resolve(process.argv[2] || path.join(__dirname, "..", "index.html"));
const PORT = +process.env.VERIF88_PORT || 10050;
const BLOCS = (process.env.VERIF88_BLOCS || "").split(",").map(x => x.trim()).filter(Boolean);
const CAPT = process.env.VERIF88_CAPTURES ? path.resolve(process.env.VERIF88_CAPTURES) : "";
const MOBILE = { width: 390, height: 844 }, ETROIT = { width: 320, height: 700 }, ORDI = { width: 1280, height: 900 };

/* ---------- les textes légaux SERVIS (CONFIG.textes_legaux de js/config.js) : la suite remplace les 3 valeurs dans le
   fichier servi (jamais sur le disque) ; test par défaut, « à compléter » ou invalides le temps du bloc M ---------- */
const NOMS_LEGAUX = ["cgu_pdf", "confidentialite_pdf", "cgu_version"];
/* verif88 (bloc F) : le lien Instagram de la marque servi tel quel (null) ou remplacé dans le config.js servi (jamais sur le disque) */
let INSTA = null;
const LEGAUX_TEST = { cgu_pdf: "https://drive.google.com/file/d/TEST-CGU-88/view", confidentialite_pdf: "https://drive.google.com/file/d/TEST-POLITIQUE-88/view", cgu_version: "2026-10-15" };
const LEGAUX_ABSENTS = { cgu_pdf: "à compléter", confidentialite_pdf: "à compléter", cgu_version: "à compléter" };
const LEGAUX_INVALIDES = { cgu_pdf: "ftp://exemple.fr/cgu.pdf", confidentialite_pdf: "javascript:alert(88)", cgu_version: "2026-10-15" };
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
const MDP = "MotDePasse-fictif-88";
const session = (id, email, meta) => ({ access_token: "jeton-" + id, refresh_token: "renouvellement-" + id, token_type: "bearer",
  expires_in: 3600, expire_le: Date.now() + 90 * J, user: Object.assign({ id, email, role: "authenticated" }, meta ? { user_metadata: clone(meta) } : {}) });
const qui = (id, email, meta) => ({ id, email, session: session(id, email, meta) });
const COACH = qui(F.IDS.coach, "coach@exemple.fr", { prenom: "Coach", nom: "Démo" }), THOMAS = qui(F.IDS.c1, "thomas@exemple.fr", { prenom: "Thomas", nom: "Démo" });
const PID = k => "00000000-0000-4000-8000-0000000088" + String(k).padStart(2, "0");   // verif88 : …88kk (une plage par suite)
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
    panneLecture: null, panneEcriture: null, retardEcriture: 0, ecrituresRatees: [],
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


/* ---------- verif88 : aides ---------- */
const { execFileSync } = require("child_process");
const RACINE88 = path.dirname(HTML);
const lundiPrec = F.donnees.find(x => x.user_id === F.IDS.c1 && x.outil === "checkins").contenu.liste[0].semaine;
/* un prospect créé à l'instant par le parcours : pas encore de questionnaire (intake absente) */
const neuf = k => ({ id: PID(k), prenom: "Léa", nom: "", cree: avant(10 * MIN), email: EMAIL(k), meta: META_V64(), donnees: [["emails", EMAILS0]] });
const PARCOURS = k => ({ etape: "cadeau", uid: PID(k), cree: avant(9 * MIN), a_ecrire: true, objectif: "Perdre du gras", obstacle: ["temps", "craquages"],
  projection: "photos", sexe: "Femme", prenom: "Léa", email: EMAIL(k), cgu: true });
const MSG_PARCOURS = "Tes réponses n'ont pas pu être enregistrées : vérifie ta connexion, puis touche à nouveau le bouton.";
const toasts88 = page => page.evaluate(() => Array.from(document.querySelectorAll("#toasts .toast")).map(t => t.textContent));
const fenetreCopie = page => page.evaluate(() => {
  const m = document.querySelector(".fond .modale.texte-a-copier"); if (!m) return null;
  const ta = m.querySelector("textarea");
  return { titre: (m.querySelector("h2") || {}).textContent || "", corps: (m.querySelector(".corps p") || {}).textContent || "", texte: ta ? ta.value : null, lecture: ta ? ta.readOnly : null };
});
const attendreSel = async (page, sel, ms) => { try { await page.waitForSelector(sel, { timeout: ms || 6000 }); return true; } catch (e) { return false; } };

(async () => {
  await new Promise((r, k) => { server.once("error", e => k(new Error(e && e.code === "EADDRINUSE" ? "port " + PORT + " déjà pris (une autre suite tourne ?) : VERIF88_PORT=10051 node verif88.js ../index.html" : String(e)))); server.listen(PORT, r); });
  const b = await chromium.launch();

  /* =================== A. parcours : réponses gardées si l'enregistrement rate =================== */
  await bloc("A. parcours : réponses gardées", async () => {
    const k = 1, ID = PID(k);
    const db = base({ comptes: [neuf(k)] });
    db.panneLecture = "intake";
    const { page } = await contexte(b, quiP(k, META_V64()), db);
    await page.addInitScript(S => { if (!sessionStorage.getItem("__p")) { sessionStorage.setItem("__p", "1"); sessionStorage.setItem("mhx_parcours", JSON.stringify(S)); } }, PARCOURS(k));
    await page.goto(URL0 + "#/accueil");
    const cadeau = await attendreSel(page, "#pc-plus-tard", 12000); await attendre(page, 600);
    await page.evaluate(() => { window.__verif88 = 1; });
    await page.click("#pc-plus-tard"); await attendre(page, 2500);
    const apres = await page.evaluate(() => { let S = null; try { S = JSON.parse(sessionStorage.getItem("mhx_parcours") || "null"); } catch (e) {} return { marque: window.__verif88 === 1, S, ecran: !!document.getElementById("pc-plus-tard") }; }).catch(e => ({ erreur: String(e.message) }));
    const Ts = await toasts88(page).catch(() => []);
    ok("A1 : lecture du questionnaire en panne au toucher final (« Plus tard ») : la page n'est pas rechargée, l'écran reste, les réponses restent dans l'onglet (à enregistrer), le message « Tes réponses n'ont pas pu être enregistrées… » ; rien d'écrit dans intake",
      cadeau && apres.marque === true && apres.ecran === true && !!apres.S && apres.S.a_ecrire === true && apres.S.objectif === "Perdre du gras" && apres.S.projection === "photos" && apres.S.sexe === "Femme"
        && Ts.map(norm).includes(MSG_PARCOURS) && ecr(db, "intake", ID).length === 0, JSON.stringify([cadeau, apres, Ts, ecr(db, "intake", ID).length]));
    db.panneLecture = null;
    await page.click("#pc-plus-tard");
    const recharge = await page.waitForFunction(() => window.__verif88 !== 1, null, { timeout: 12000 }).then(() => true).catch(() => false);
    await attendre(page, 1500);
    const E = ecr(db, "intake", ID), I = contenuDe(db, ID, "intake") || {};
    const reste = await page.evaluate(() => { try { return sessionStorage.getItem("mhx_parcours"); } catch (e) { return "illisible"; } }).catch(() => "?");
    ok("A2 : réseau revenu, le toucher suivant enregistre les réponses dans intake (objectif, ce qui bloque, projection, sexe, « Plus tard » noté) puis recharge l'app ; l'onglet est vidé",
      recharge && E.length >= 1 && I.probleme === "Perdre du gras" && I.sexe === "Femme" && Array.isArray(I.obstacle_choix) && I.obstacle_choix.join() === "temps,craquages" && Array.isArray(I.projection_choix) && I.projection_choix[0] === "photos"
        && !!I.bilan_propose && I.bilan_propose.choix === "plus_tard" && reste === null, JSON.stringify([recharge, E.length, I, reste]));
  });

  /* =================== B. notes privées du coach, fiche fermée =================== */
  await bloc("B. notes privées : échec après la fiche fermée", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/tableau"); await pret(page);
    await page.evaluate(id => Clients.ouvrir(id, "Thomas Démo", "accueil"), F.IDS.c1);
    const ouvert = await attendreSel(page, "#nc-texte:not([disabled])", 8000);
    db.panneEcriture = "notes_coach"; db.retardEcriture = 900;
    const TEXTE = "Note fictive de la suite : genou droit à surveiller.";
    await page.fill("#nc-texte", TEXTE);
    await page.evaluate(() => { location.hash = "#/clients"; });
    const vue = await attendreSel(page, ".fond .modale.texte-a-copier", 8000);
    const M = await fenetreCopie(page);
    ok("B1 : notes privées envoyées en quittant la fiche, envoi refusé (500) : une fenêtre « Notes privées non enregistrées » avec la raison et le texte à copier (zone en lecture seule) ; rien d'écrit",
      ouvert && vue && !!M && norm(M.titre) === "Notes privées non enregistrées" && M.corps.length > 5 && M.texte === TEXTE && M.lecture === true && db.ecrituresRatees.length >= 1 && ecr(db, "notes_coach").length === 0, JSON.stringify([ouvert, vue, M, db.ecrituresRatees]));
  });

  /* =================== C. feedback du coach, fiche fermée =================== */
  await bloc("C. feedback : échec après la fiche fermée", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/tableau"); await pret(page);
    await page.evaluate(id => Clients.ouvrir(id, "Thomas Démo", "bilan"), F.IDS.c1);
    const sel = `[data-fb-semaine="${lundiPrec}"]`;
    const ouvert = await attendreSel(page, sel + " textarea", 8000);
    db.panneEcriture = "feedbacks"; db.retardEcriture = 1500;
    const TEXTE = "Feedback fictif de la suite : belle régularité cette semaine.";
    await page.fill(sel + " textarea", TEXTE);
    await page.click(sel + " [data-fb-enregistrer]");
    await attendre(page, 200);
    await page.evaluate(() => { location.hash = "#/clients"; });
    const vue = await attendreSel(page, ".fond .modale.texte-a-copier", 8000);
    const M = await fenetreCopie(page);
    ok("C1 : feedback envoyé puis fiche quittée, envoi refusé (500) : une fenêtre « Feedback non enregistré » avec la raison et le texte à copier ; rien d'écrit",
      ouvert && vue && !!M && norm(M.titre) === "Feedback non enregistré" && M.corps.length > 5 && M.texte === TEXTE && M.lecture === true && ecr(db, "feedbacks").length === 0, JSON.stringify([ouvert, vue, M, db.ecrituresRatees]));
  });

  /* =================== D. déconnexion : les autres onglets =================== */
  await bloc("D. déconnexion et autres onglets", async () => {
    const k = 2, ID = PID(k);
    const db = base({ comptes: [compte(k, { meta: META_V64() })] });
    const x = await contexte(b, quiP(k, META_V64()), db), p1 = x.page;
    await p1.goto(URL0 + "#/accueil"); await pret(p1);
    const p2 = surveiller(await x.c.newPage());
    await p2.goto(URL0 + "#/profil"); await pret(p2);
    await p2.evaluate(() => { window.__verif88 = 1; });
    /* un renouvellement de session rangé par l'onglet 1 : l'onglet 2 la reprend, rien d'autre */
    await p1.evaluate(() => { Auth.memoriser(Object.assign({}, Auth.session, { access_token: Auth.session.access_token, expires_in: 3600 })); });
    await attendre(p2, 1500);
    const r2 = await p2.evaluate(() => ({ marque: window.__verif88 === 1, connecte: Auth.connecte() }));
    ok("D2 : un renouvellement de session rangé par un autre onglet ne déconnecte rien (l'onglet 2 reste sur l'espace, connecté)", r2.marque === true && r2.connecte === true, JSON.stringify(r2));
    await p1.evaluate(() => { Auth.deconnecter(); }).catch(() => {});
    const recharge = await p2.waitForFunction(() => window.__verif88 !== 1, null, { timeout: 8000 }).then(() => true).catch(() => false);
    await attendre(p2, 2500);
    const r1 = await p2.evaluate(() => ({ connecte: (typeof Auth !== "undefined") && Auth.connecte(), mdp: !!document.querySelector('input[type="password"]'), session: !!(localStorage.getItem("mhx_session") || sessionStorage.getItem("mhx_session")) })).catch(e => ({ erreur: String(e.message) }));
    ok("D1 : « Se déconnecter » dans l'onglet 1 : l'onglet 2, ouvert sur le même compte, est rechargé sans session (écran de connexion, plus rien de l'espace)",
      recharge && r1.connecte === false && r1.mdp === true && r1.session === false, JSON.stringify([recharge, r1]));
  });

  /* =================== E. noms choisis par un client =================== */
  await bloc("E. noms réservés de JavaScript", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/tableau"); await pret(page);
    const c = await page.evaluate(() => {
      const R = { jours: [{ repas: [{ ingredients: [{ aliment_id: "__proto__", nom: "Riz", categorie: "Féculents", grammes: 50 }, { aliment_id: "constructor", nom: "Pâtes", categorie: "Féculents", grammes: 30 }] }] }] };
      let out = null, err = "";
      try { out = outilNutrition.courses(R, null); } catch (e) { err = String(e && e.message); }
      const lignes = out ? out.flatMap(r => r.lignes.map(l => l.id + ":" + l.grammes)) : [];
      const pollue = Object.prototype.hasOwnProperty.call(Object.prototype, "grammes") || Object.prototype.hasOwnProperty.call(Object, "grammes");
      return { err, lignes, pollue };
    });
    ok("E1 : liste de courses avec des aliments « __proto__ » et « constructor » (écrits par un client) : les deux lignes comptées (50 g, 30 g), aucun objet commun de la page modifié, aucune erreur",
      c.err === "" && c.lignes.includes("__proto__:50") && c.lignes.includes("constructor:30") && c.pollue === false, JSON.stringify(c));
    const ch = await page.evaluate(() => {
      const J = { seances: [{ date: "2026-10-01", exos: [{ nom: "constructor", series: [{ r: 10, c: 20 }] }, { nom: "toString", series: [{ r: 8, c: 30 }] }] },
                            { date: "2026-10-03", exos: [{ nom: "constructor", series: [{ r: 10, c: 25 }] }, { nom: "toString", series: [{ r: 8, c: 35 }] }] }] };
      let out = null, err = "";
      try { out = outilBilan.charges(J, "2026-09-01"); } catch (e) { err = String(e && e.message); }
      return { err, out: out ? out.map(x => x.nom + ":" + x.de + ">" + x.a) : null };
    });
    ok("E2 : charges de « Préparer le call » avec des exercices nommés « constructor » et « toString » : calculées (20 > 25 kg, 30 > 35 kg), aucune erreur (avant : la fiche plantait)",
      ch.err === "" && Array.isArray(ch.out) && ch.out.includes("constructor:20>25") && ch.out.includes("toString:30>35"), JSON.stringify(ch));
  });

  /* =================== F. lien Instagram du pied de page =================== */
  await bloc("F. lien Instagram", async () => {
    INSTA = "javascript:alert(88)";
    try {
      const db = base();
      const { page } = await contexte(b, COACH, db);
      await page.goto(URL0 + "#/tableau"); await pret(page);
      const h = await page.evaluate(() => { const a = document.querySelector("#foot-right a"); return a ? a.getAttribute("href") : null; });
      ok("F1 : un lien Instagram « javascript:… » dans la configuration ne donne jamais un lien actif dans le pied de page (lienSur, esc)", h === "", JSON.stringify(h));
    } finally { INSTA = null; }
    const db = base();
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/tableau"); await pret(page);
    const h2 = await page.evaluate(() => { const a = document.querySelector("#foot-right a"); return a ? a.getAttribute("href") : null; });
    ok("F2 : le vrai lien Instagram de la marque (https) reste tel quel", typeof h2 === "string" && /^https:\/\/www\.instagram\.com\//.test(h2), JSON.stringify(h2));
  });

  /* =================== G. liens du bandeau de la fiche =================== */
  await bloc("G. bandeau de la fiche", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/tableau"); await pret(page);
    const g = await page.evaluate(() => {
      const avant = [Store.idConsulte, Store.nomConsulte];
      let h = "", err = "";
      try { Store.idConsulte = 'x" data-pirate="1'; Store.nomConsulte = "Test"; h = bandeauConsultation(); } catch (e) { err = String(e && e.message); }
      finally { Store.idConsulte = avant[0]; Store.nomConsulte = avant[1]; }
      const d = document.createElement("div"); d.innerHTML = h;
      return { err, pirates: d.querySelectorAll("[data-pirate]").length, liens: d.querySelectorAll("a.b-act").length, href: (d.querySelector("a.b-act") || { getAttribute: () => "" }).getAttribute("href") };
    });
    ok("G1 : un identifiant consulté avec des guillemets n'ajoute aucun attribut aux liens du bandeau de la fiche (échappé ; aujourd'hui l'identifiant est toujours un UUID)",
      g.err === "" && g.liens > 0 && g.pirates === 0 && g.href.includes('x" data-pirate="1'), JSON.stringify(g));
  });

  /* =================== H. garde du dépôt =================== */
  await bloc("H. garde du dépôt", async () => {
    const tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "verif88-"));
    try {
      const g = args => execFileSync("git", ["-C", tmp].concat(args), { encoding: "utf8" });
      g(["init", "-q"]);
      fs.mkdirSync(path.join(tmp, "js"));
      fs.writeFileSync(path.join(tmp, "index.html"), "<!doctype html>\n");
      fs.writeFileSync(path.join(tmp, "js", "config.js"), '  email: "contact@exemple.fr",\n');
      for (let i = 0; i < 55; i++) fs.writeFileSync(path.join(tmp, "f" + i + ".txt"), "rien " + i + "\n");
      const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
      const jwt = role => b64({ alg: "HS256", typ: "JWT" }) + "." + b64({ iss: "supabase", role, ref: "exemple" }) + ".signaturefictive" + "x".repeat(20);
      const GH = "ghp_" + "Z".repeat(36), SR = jwt("service_role"), AN = jwt("anon");
      fs.writeFileSync(path.join(tmp, "anon.txt"), "clé publique : " + AN + "\n");
      g(["add", "-A"]);
      const lancer = () => { try { return { code: 0, out: execFileSync(process.execPath, [path.join(RACINE88, "tests-locaux", "garde-depot.js"), path.join(tmp, "index.html")], { encoding: "utf8" }) }; } catch (e) { return { code: e.status, out: String(e.stdout || "") }; } };
      const r0 = lancer();
      fs.writeFileSync(path.join(tmp, "secret.txt"), "jeton : " + GH + "\nservice : " + SR + "\n");
      g(["add", "-A"]);
      const r1 = lancer();
      ok("H1 : garde du dépôt — la clé publique (anon) seule : vert ; un jeton GitHub et une clé service_role dans un fichier suivi : rouge (code 1), fichier, ligne et genre nommés, le secret jamais recopié dans le journal",
        r0.code === 0 && r1.code === 1 && /secret\.txt:1 : jeton GitHub/.test(r1.out) && /secret\.txt:2 : jeton JWT \(rôle « service_role »\)/.test(r1.out) && !r1.out.includes(GH) && !r1.out.includes(SR) && !/anon\.txt/.test(r1.out),
        JSON.stringify([r0.code, r0.out.slice(-200), r1.code, r1.out.slice(-400)]));
      let ign = false; try { execFileSync("git", ["-C", RACINE88, "check-ignore", "-q", "Claude outputs/rapport.md"]); ign = true; } catch (e) { ign = false; }
      ok("H2 : le dossier local « Claude outputs/ » (sorties de Claude, parfois avec des données de vrais clients) est ignoré par git", ign);
    } finally { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {} }
  });

  /* =================== I. jeton renouvelé avant « Créer un accès » =================== */
  await bloc("I. jeton renouvelé avant Créer un accès", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/tableau"); await pret(page);
    const r0 = db.renouvellements.length, f0 = db.ecritures.filter(e => e.table === "/functions/v1/creer-acces").length;
    const out = await page.evaluate(async () => { Auth.session.expire_le = Date.now() + 10000; try { await Auth.creerAcces("nouveau@exemple.fr", "MotDePasse-fictif-88", "Nina", "", "client"); return "ok"; } catch (e) { return "erreur " + (e && e.message); } });
    const appels = db.ecritures.filter(e => e.table === "/functions/v1/creer-acces").length - f0;
    ok("I1 : « Créer un accès » avec un jeton qui expire dans moins d'une minute (téléphone sorti de veille) : la session est d'abord renouvelée, puis la fonction est appelée une fois",
      db.renouvellements.length === r0 + 1 && appels === 1, JSON.stringify([out, r0, db.renouvellements.length, appels]));
  });

  /* =================== J. une ligne « __proto__ » écrite par un compte =================== */
  await bloc("J. ligne __proto__", async () => {
    const k = 3, ID = PID(k);
    const piege = { suivi_prospect: { version: 1, archive_le: avant(J), issue: "signe", issue_le: avant(J) }, feedbacks: { liste: [] } };
    const db = base({ comptes: [compte(k, { meta: META_V64(), donnees: [["__proto__", piege]] })] });
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/prospects"); await pret(page); await attendre(page, 1200);
    const l = await page.evaluate(() => Array.from(document.querySelectorAll("#lc-prospects #lc-liste li")).map(x => x.textContent.replace(/\s+/g, " ").trim()));
    ok("J1 : un prospect qui a écrit dans son compte une ligne à clé « __proto__ » (avec un faux suivi « archivé, signé ») reste dans la liste Prospects du coach, comme un nouvel inscrit (aucune fausse clé du coach lue)",
      l.filter(t => t.includes("Léa")).length === 1, JSON.stringify(l));
  });

  /* =================== K. la diète : semaine et jour piégés =================== */
  await bloc("K. diète, clés piégées", async () => {
    const db = base();
    const { page } = await contexte(b, COACH, db);
    await page.goto(URL0 + "#/tableau"); await pret(page);
    const r = await page.evaluate(() => {
      let ligne = null, err = "";
      const D = { semaine: "__proto__", jour: "constructor", diete: {} };
      try { ligne = outilFormation.ligneDiete(D); } catch (e) { err = String(e && e.message); }
      const D2 = { semaine: 3, jour: 2, diete: {} }, l2 = outilFormation.ligneDiete(D2);
      return { err, tableau: Array.isArray(ligne) && ligne.length === 6, pollue: Object.prototype.hasOwnProperty.call(Object.prototype, "1") || Object.prototype.hasOwnProperty.call(Object.prototype, "0"),
        propre: Object.keys(D.diete).join(), normal: Array.isArray(l2) && l2.length === 6 && Object.keys(D2.diete).join() === "3" && Object.keys(D2.diete["3"]).join() === "2" };
    });
    ok("K1 : « Organise ta diète » avec une semaine « __proto__ » et un jour « constructor » (document écrit hors de l'app) : une ligne de 6 repas rangée sous une clé propre (semaine 1), aucun objet commun touché ; semaine 3 jour 2 : inchangé",
      r.err === "" && r.tableau && !r.pollue && r.propre === "1" && r.normal, JSON.stringify(r));
  });

  /* =================== L. copie hors ligne et date illisible en base =================== */
  await bloc("L. date illisible en base", async () => {
    const db = base();
    const ligne = db.donnees.find(d => d.user_id === F.IDS.c1 && d.outil === "objectifs_faits");
    if (ligne) ligne.maj_le = "infinity"; else db.donnees.push({ user_id: F.IDS.c1, outil: "objectifs_faits", contenu: { mois: "2026-10", faits: [false, false, false] }, maj_le: "infinity" });
    const { page } = await contexte(b, THOMAS, db);
    await page.addInitScript(([c, id, t]) => {
      if (location.hostname !== "localhost" || localStorage.getItem("__copie88")) return;
      localStorage.setItem("__copie88", "1"); localStorage.setItem(c, JSON.stringify({ a: id, t, v: { mois: "2026-10", faits: [true, false, false] } }));
    }, ["mhx_attente|" + F.IDS.c1 + "|objectifs_faits", F.IDS.c1, avant(20 * MIN)]);
    await page.goto(URL0 + "#/accueil"); await pret(page); await attendre(page, 2500);
    const Ts = await toasts88(page);
    ok("L1 : une modification gardée hors ligne, et en base une date illisible (« infinity ») sur la même clé : la copie n'est pas envoyée, et le message « Une modification faite hors ligne n'a pas été envoyée… » le dit (avant : écartée sans un mot)",
      Ts.some(t => /^Une modification faite hors ligne n'a pas été envoyée/.test(norm(t))) && ecr(db, "objectifs_faits", F.IDS.c1).length === 0, JSON.stringify([Ts, ecr(db, "objectifs_faits").length]));
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
